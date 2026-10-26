import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import GroupKFold, GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "pricescope_new_product_model.joblib"
CATEGORICAL_FEATURES = ["Category", "Website"]
NUMERIC_FEATURES = ["Current_Price", "Previous_Price", "Previous_Change"]
FEATURE_COLUMNS = CATEGORICAL_FEATURES + NUMERIC_FEATURES
REQUIRED_DATASET_COLUMNS = {
    "Product_ID",
    "Category",
    "Website",
    "Price_INR",
    "Timestamp",
}


def build_transitions(
    dataset_path: Path,
) -> tuple[pd.DataFrame, pd.Series, pd.Series, list[str]]:
    records = pd.read_csv(dataset_path)
    missing_columns = REQUIRED_DATASET_COLUMNS - set(records.columns)
    if missing_columns:
        raise ValueError(
            f"Dataset is missing required columns: {', '.join(sorted(missing_columns))}"
        )
    if records.empty:
        raise ValueError("The dataset contains no records.")

    records["_date"] = pd.to_datetime(
        records["Timestamp"],
        format="%d-%m-%Y",
        errors="raise",
    )
    dates = sorted(records["_date"].drop_duplicates())
    if len(dates) < 2:
        raise ValueError("At least two distinct observation dates are required.")
    if any((current - previous).days != 1 for previous, current in zip(dates, dates[1:])):
        raise ValueError(
            "The dataset does not contain consecutive daily observations; "
            "a one-day estimate cannot be trained."
        )

    records["Price_INR"] = pd.to_numeric(records["Price_INR"], errors="raise")
    if (records["Price_INR"] <= 0).any():
        raise ValueError("Dataset prices must be greater than zero.")

    transitions = []
    for (product_id, retailer), product_records in records.groupby(
        ["Product_ID", "Website"],
        sort=False,
    ):
        product_records = product_records.sort_values("_date").reset_index(drop=True)
        for index in range(len(product_records) - 1):
            current = product_records.iloc[index]
            previous = product_records.iloc[index - 1] if index > 0 else None
            previous_price = float(previous["Price_INR"]) if previous is not None else np.nan
            transitions.append(
                {
                    "Product_ID": str(product_id),
                    "Category": str(current["Category"]),
                    "Website": str(retailer),
                    "Current_Price": float(current["Price_INR"]),
                    "Previous_Price": previous_price,
                    "Previous_Change": (
                        float(current["Price_INR"] - previous_price)
                        if previous is not None
                        else np.nan
                    ),
                    "target": float(product_records.iloc[index + 1]["Price_INR"]),
                }
            )

    data = pd.DataFrame(transitions)
    if data.empty:
        raise ValueError("The dataset contains no usable price transitions.")
    return (
        data[FEATURE_COLUMNS],
        data["target"] - data["Current_Price"],
        data["Product_ID"],
        [date.strftime("%Y-%m-%d") for date in dates],
    )


def create_model() -> Pipeline:
    preprocessor = ColumnTransformer(
        [
            (
                "categorical",
                Pipeline(
                    [
                        ("impute", SimpleImputer(strategy="most_frequent")),
                        (
                            "encode",
                            OneHotEncoder(
                                handle_unknown="ignore",
                                sparse_output=False,
                            ),
                        ),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
            (
                "numeric",
                SimpleImputer(strategy="median"),
                NUMERIC_FEATURES,
            ),
        ],
        remainder="drop",
    )
    return Pipeline(
        [
            ("preprocessor", preprocessor),
            (
                "regressor",
                GradientBoostingRegressor(
                    n_estimators=30,
                    max_depth=1,
                    learning_rate=0.05,
                    random_state=7,
                ),
            ),
        ]
    )


def evaluate_model(
    features: pd.DataFrame,
    changes: pd.Series,
    product_groups: pd.Series,
) -> dict:
    group_count = product_groups.nunique()
    if group_count < 5:
        raise ValueError(
            "At least five distinct products are required for product-level validation."
        )

    baseline_predictions = np.empty(len(features), dtype=float)
    model_predictions = np.empty(len(features), dtype=float)
    splitter = GroupKFold(n_splits=5)
    for train_indices, test_indices in splitter.split(
        features,
        changes,
        groups=product_groups,
    ):
        fold_model = create_model()
        fold_model.fit(features.iloc[train_indices], changes.iloc[train_indices])
        model_predictions[test_indices] = (
            features.iloc[test_indices]["Current_Price"].to_numpy()
            + fold_model.predict(features.iloc[test_indices])
        )
        baseline_predictions[test_indices] = features.iloc[test_indices][
            "Current_Price"
        ]

    targets = features["Current_Price"] + changes
    model_mae = mean_absolute_error(targets, model_predictions)
    model_rmse = np.sqrt(mean_squared_error(targets, model_predictions))
    holdout_train, holdout_test = next(
        GroupShuffleSplit(
            n_splits=1,
            test_size=0.2,
            random_state=2026,
        ).split(features, changes, groups=product_groups)
    )
    holdout_model = create_model()
    holdout_model.fit(features.iloc[holdout_train], changes.iloc[holdout_train])
    holdout_truth = (
        features.iloc[holdout_test]["Current_Price"] + changes.iloc[holdout_test]
    )
    holdout_baseline = features.iloc[holdout_test]["Current_Price"]
    holdout_predictions = (
        holdout_baseline.to_numpy()
        + holdout_model.predict(features.iloc[holdout_test])
    )

    def metrics(actual: pd.Series, predicted: np.ndarray) -> dict[str, float]:
        return {
            "mae_inr": round(float(mean_absolute_error(actual, predicted)), 2),
            "rmse_inr": round(
                float(np.sqrt(mean_squared_error(actual, predicted))),
                2,
            ),
        }

    return {
        "validation": "5-fold GroupKFold by Product_ID",
        "held_out_products": int(group_count),
        "evaluated_transitions": int(len(targets)),
        "baseline": {
            "name": "Carry forward current recorded price",
            **metrics(targets, baseline_predictions),
        },
        "model": {
            "mae_inr": round(float(model_mae), 2),
            "rmse_inr": round(float(model_rmse), 2),
        },
        "product_holdout": {
            "validation": "80/20 GroupShuffleSplit by Product_ID (random_state=2026)",
            "held_out_products": int(product_groups.iloc[holdout_test].nunique()),
            "baseline": metrics(holdout_truth, holdout_baseline.to_numpy()),
            "model": metrics(holdout_truth, holdout_predictions),
        },
    }


def train(dataset_path: Path, output_path: Path = MODEL_PATH) -> dict:
    features, changes, product_groups, dates = build_transitions(dataset_path)
    validation = evaluate_model(features, changes, product_groups)
    baseline = validation["baseline"]
    measured_model = validation["model"]
    holdout_baseline = validation["product_holdout"]["baseline"]
    holdout_model = validation["product_holdout"]["model"]
    if (
        measured_model["mae_inr"] >= baseline["mae_inr"]
        or measured_model["rmse_inr"] >= baseline["rmse_inr"]
        or holdout_model["mae_inr"] >= holdout_baseline["mae_inr"]
        or holdout_model["rmse_inr"] >= holdout_baseline["rmse_inr"]
    ):
        print(json.dumps(validation, indent=2))
        raise RuntimeError(
            "The candidate did not beat the carry-forward baseline on both MAE "
            "and RMSE. No model artifact was exported."
        )

    final_model = create_model()
    final_model.fit(features, changes)
    bundle = {
        "model": final_model,
        "feature_columns": FEATURE_COLUMNS,
        "model_name": "PriceScope unseen-product Gradient Boosting estimate",
        "target": "next_observed_daily_price_change_inr",
        "currency": "INR",
        "prediction_horizon_days": 1,
        "training_rows": int(len(features)),
        "training_products": int(product_groups.nunique()),
        "current_price_range_inr": [
            float(features["Current_Price"].min()),
            float(features["Current_Price"].max()),
        ],
        "observation_dates": dates,
        "validation": validation,
        "limitations": (
            f"Validation used {product_groups.nunique()} products and "
            f"{len(dates)} consecutive daily observations. Estimates for "
            "unseen product identities are supported only within represented "
            "categories, retailers, and price ranges; 7-day forecasts and "
            "unrepresented market segments are not validated."
        ),
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, output_path)
    return bundle


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate and train the PriceScope unseen-product estimator."
    )
    parser.add_argument(
        "--dataset",
        required=True,
        type=Path,
        help="CSV containing the real recorded PriceScope observations.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=MODEL_PATH,
        help=f"Output model path (default: {MODEL_PATH}).",
    )
    args = parser.parse_args()
    bundle = train(args.dataset, args.output)
    print(json.dumps({key: value for key, value in bundle.items() if key != "model"}, indent=2))
    print(f"Exported validated model: {args.output.resolve()}")


if __name__ == "__main__":
    main()
