#!/usr/bin/env python3
"""Unit tests for the calculator application."""

import unittest
from calculator import add, subtract, multiply, divide, parse_and_calculate


class TestCalculator(unittest.TestCase):
    """Test cases for core arithmetic functions."""

    def test_add(self):
        self.assertEqual(add(2, 3), 5)
        self.assertEqual(add(-1, 1), 0)
        self.assertEqual(add(-5, -5), -10)
        self.assertEqual(add(1.5, 2.5), 4.0)

    def test_subtract(self):
        self.assertEqual(subtract(5, 2), 3)
        self.assertEqual(subtract(2, 5), -3)
        self.assertEqual(subtract(-1, -1), 0)
        self.assertEqual(subtract(5.5, 1.5), 4.0)

    def test_multiply(self):
        self.assertEqual(multiply(3, 4), 12)
        self.assertEqual(multiply(-2, 3), -6)
        self.assertEqual(multiply(-2, -3), 6)
        self.assertEqual(multiply(0, 5), 0)
        self.assertEqual(multiply(1.5, 2), 3.0)

    def test_divide(self):
        self.assertEqual(divide(6, 2), 3)
        self.assertEqual(divide(-6, 2), -3)
        self.assertEqual(divide(-6, -2), 3)
        self.assertEqual(divide(5, 2), 2.5)

    def test_divide_by_zero(self):
        with self.assertRaises(ValueError) as context:
            divide(5, 0)
        self.assertEqual(str(context.exception), "Cannot divide by zero.")


class TestParseAndCalculate(unittest.TestCase):
    """Test cases for expression parsing and calculating."""

    def test_valid_expressions(self):
        self.assertEqual(parse_and_calculate("5 + 3"), 8.0)
        self.assertEqual(parse_and_calculate("10 - 4"), 6.0)
        self.assertEqual(parse_and_calculate("3 * 4"), 12.0)
        self.assertEqual(parse_and_calculate("10 / 2"), 5.0)

    def test_invalid_formats(self):
        with self.assertRaises(ValueError):
            parse_and_calculate("5 +")
        with self.assertRaises(ValueError):
            parse_and_calculate("5 + 3 + 2")
        with self.assertRaises(ValueError):
            parse_and_calculate("five + three")

    def test_unsupported_operators(self):
        with self.assertRaises(ValueError) as context:
            parse_and_calculate("5 ^ 3")
        self.assertIn("Unsupported operator", str(context.exception))


if __name__ == "__main__":
    unittest.main()
