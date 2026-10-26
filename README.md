# PriceScope ML API

The API keeps the existing `POST /predict` request and response contract for
products in the historical dataset. `POST /predict/new-product` estimates a
next-observed-daily price for a product name that is not in that dataset; it
does not require or use a `Product_ID`.

## Train and validate the new-product model

Use the backend's Python environment and the existing frontend dataset:

```powershell
.\.venv310\Scripts\python.exe train_new_product_model.py --dataset ..\project-bolt-sb1-mkwc8k8s\project\public\data\ecommerce_price_comparison_dataset-2.csv
```

The trainer builds daily product/retailer transitions, compares a carry-forward
current-price baseline with a gradient-boosted price-change model using
product-level five-fold validation and a fixed 80/20 product holdout, and only
exports `pricescope_new_product_model.joblib` if the model beats the baseline
on both MAE and RMSE in both evaluations. The existing `pricescope_model.joblib`
and `/predict` endpoint are not changed by retraining.

Start the API from this directory:

```powershell
.\.venv310\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## New-product request

`POST /predict/new-product` accepts `product_name`, `category`, `retailer`,
`current_price`, optional `previous_price`, optional `previous_change` (INR),
and `prediction_horizon_days: 1`. The API derives the change from the two prices
when only `previous_price` is provided. Categories and retailers not seen in
training are handled without an encoder error, but are not independently
validated. Prices outside the training input-price range are rejected.

The current dataset contains 20 product identities and three consecutive daily
observation dates. The endpoint therefore supports only a one-day next-observed
interval; seven-day forecasts are intentionally rejected. Estimates are
experimental model outputs, not live retailer quotes or guaranteed future
prices. The small dataset and limited dates do not support broad accuracy
claims.
