import unittest

from fastapi import HTTPException
from pydantic import ValidationError

from main import (
    NewProductPredictionRequest,
    PredictionRequest,
    predict,
    predict_new_product,
)


class NewProductPredictionTests(unittest.TestCase):
    def test_unseen_product_and_unseen_categories_are_supported(self):
        request = NewProductPredictionRequest(
            product_name="Unseen prototype device",
            category="Unrepresented category",
            retailer="Unrepresented retailer",
            current_price=12500,
        )

        result = predict_new_product(request)

        self.assertEqual(result["product_name"], request.product_name)
        self.assertEqual(result["retailer"], request.retailer)
        self.assertEqual(result["prediction_horizon_days"], 1)
        self.assertFalse(result["is_real_market_quote"])
        self.assertGreater(result["estimated_price"], 0)
        self.assertLess(
            result["validation"]["model"]["mae_inr"],
            result["validation"]["baseline"]["mae_inr"],
        )
        self.assertEqual(result["training_products"], 20)

    def test_previous_price_derives_change_when_not_provided(self):
        request = NewProductPredictionRequest(
            product_name="New product",
            category="Electronics",
            retailer="Amazon",
            current_price=14000,
            previous_price=13500,
        )

        result = predict_new_product(request)

        self.assertIsInstance(result["estimated_price"], float)
        self.assertIn("not a guaranteed future price", result["warning"])

    def test_seven_day_horizon_is_rejected(self):
        with self.assertRaises(ValidationError):
            NewProductPredictionRequest(
                product_name="New product",
                category="Electronics",
                retailer="Amazon",
                current_price=14000,
                prediction_horizon_days=7,
            )

    def test_prices_outside_training_range_are_rejected(self):
        request = NewProductPredictionRequest(
            product_name="Out-of-range product",
            category="Electronics",
            retailer="Amazon",
            current_price=100000000,
        )

        with self.assertRaises(HTTPException) as raised:
            predict_new_product(request)

        self.assertEqual(raised.exception.status_code, 422)

    def test_existing_product_prediction_contract_remains_available(self):
        result = predict(
            PredictionRequest(
                product_id="P0001",
                website="Amazon",
                previous_price=1576,
                previous_change=0,
            )
        )

        self.assertEqual(result["product_id"], "P0001")
        self.assertEqual(result["website"], "Amazon")
        self.assertIn("predicted_price", result)
        self.assertFalse(result["is_real_market_quote"])


if __name__ == "__main__":
    unittest.main()
