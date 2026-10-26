
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# --------------------------------------------------
# Load the trained PriceScope ML model
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "pricescope_model.joblib"
NEW_PRODUCT_MODEL_PATH = BASE_DIR / "pricescope_new_product_model.joblib"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model file not found: {MODEL_PATH}"
    )

bundle = joblib.load(MODEL_PATH)

model = bundle["model"]
features = bundle["features"]
new_product_bundle = (
    joblib.load(NEW_PRODUCT_MODEL_PATH)
    if NEW_PRODUCT_MODEL_PATH.exists()
    else None
)

# --------------------------------------------------
# Create FastAPI application
# --------------------------------------------------

app = FastAPI(
    title="PriceScope ML API",
    version="1.0.0",
    description="Experimental product price estimation API",
)

# --------------------------------------------------
# CORS: Allow the local PriceScope frontend
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Prediction request validation
# --------------------------------------------------

class PredictionRequest(BaseModel):
    product_id: str = Field(min_length=1, max_length=100)
    website: str = Field(min_length=1, max_length=100)
    previous_price: float = Field(gt=0, le=100000000)
    previous_change: float = Field(
        ge=-100000000,
        le=100000000,
    )


class NewProductPredictionRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    retailer: str = Field(min_length=1, max_length=100)
    current_price: float = Field(gt=0, le=100000000)
    previous_price: float | None = Field(default=None, gt=0, le=100000000)
    previous_change: float | None = Field(
        default=None,
        ge=-100000000,
        le=100000000,
    )
    prediction_horizon_days: Literal[1] = 1

    @field_validator("product_name", "category", "retailer")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value


# --------------------------------------------------
# Root endpoint
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "status": "ok",
        "service": "PriceScope ML API",
        "model": bundle.get(
            "model_name",
            "PriceScope Ridge Regression Prototype",
        ),
    }


# --------------------------------------------------
# Health check endpoint
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "healthy"}


# --------------------------------------------------
# ML price prediction endpoint
# --------------------------------------------------

@app.post("/predict")
def predict(request: PredictionRequest):
    try:
        input_row = {
            "Product_ID": request.product_id,
            "Website": request.website,
            "Previous_Price": request.previous_price,
            "Previous_Change": request.previous_change,
        }

        # Preserve the exact feature order used during training.
        input_df = pd.DataFrame([input_row])[features]

        prediction_value = float(model.predict(input_df)[0])

        if not pd.notna(prediction_value):
            raise ValueError("The model returned an invalid prediction.")

        return {
            "product_id": request.product_id,
            "website": request.website,
            "predicted_price": round(prediction_value, 2),
            "currency": "INR",
            "model_type": "Ridge Regression prototype",
            "is_real_market_quote": False,
            "warning": (
                "Experimental estimate based on limited sample data; "
                "not a verified future market price."
            ),
        }

    except Exception as exc:
        print(f"Prediction error: {type(exc).__name__}: {exc}")

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {type(exc).__name__}",
        ) from exc


@app.post("/predict/new-product")
def predict_new_product(request: NewProductPredictionRequest):
    if new_product_bundle is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "New-product estimates are unavailable because the model "
                "has not passed product-level validation."
            ),
        )

    previous_change = request.previous_change
    if previous_change is None and request.previous_price is not None:
        previous_change = request.current_price - request.previous_price

    input_row = {
        "Category": request.category,
        "Website": request.retailer,
        "Current_Price": request.current_price,
        "Previous_Price": request.previous_price,
        "Previous_Change": previous_change,
    }

    price_min, price_max = new_product_bundle["current_price_range_inr"]
    if not price_min <= request.current_price <= price_max:
        raise HTTPException(
            status_code=422,
            detail=(
                "Current price is outside the range represented in "
                f"training data ({price_min:.2f}–{price_max:.2f} INR)."
            ),
        )

    try:
        input_df = pd.DataFrame(
            [input_row],
            columns=new_product_bundle["feature_columns"],
        )
        predicted_change = float(
            new_product_bundle["model"].predict(input_df)[0]
        )
        prediction_value = request.current_price + predicted_change
        if not pd.notna(prediction_value) or prediction_value <= 0:
            raise ValueError("The model returned a non-positive or invalid price.")
    except Exception as exc:
        print(f"New-product prediction error: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"New-product prediction failed: {type(exc).__name__}",
        ) from exc

    difference = prediction_value - request.current_price
    return {
        "product_name": request.product_name,
        "retailer": request.retailer,
        "input_price": request.current_price,
        "estimated_price": round(prediction_value, 2),
        "estimated_difference": round(difference, 2),
        "estimated_change_percent": round(
            difference / request.current_price * 100,
            2,
        ),
        "currency": "INR",
        "prediction_horizon_days": request.prediction_horizon_days,
        "model_type": new_product_bundle["model_name"],
        "is_real_market_quote": False,
        "validation": new_product_bundle["validation"],
        "training_products": new_product_bundle["training_products"],
        "observation_dates": new_product_bundle["observation_dates"],
        "limitations": new_product_bundle["limitations"],
        "warning": (
            "Experimental estimate for the next observed daily interval, "
            "not a guaranteed future price or live retailer quote."
        ),
    }
