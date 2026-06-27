#!/usr/bin/env python3
"""A simple calculator module for basic arithmetic operations.

This module provides basic arithmetic operations: addition, subtraction,
multiplication, and division, along with an interactive command-line interface.
"""


def add(a: float, b: float) -> float:
    """Return the sum of a and b."""
    return a + b


def subtract(a: float, b: float) -> float:
    """Return the difference of a and b."""
    return a - b


def multiply(a: float, b: float) -> float:
    """Return the product of a and b."""
    return a * b


def divide(a: float, b: float) -> float:
    """Return the quotient of a and b.

    Raises:
        ValueError: If b is zero.
    """
    if b == 0:
        raise ValueError("Cannot divide by zero.")
    return a / b


def parse_and_calculate(expression: str) -> float:
    """Parse a simple expression of the format 'num1 op num2' and return the result.

    Supported operators: +, -, *, /
    """
    tokens = expression.split()
    if len(tokens) != 3:
        raise ValueError(
            "Invalid format. Please enter expression in the format: number1 operator number2 (e.g., 5 + 3)"
        )

    try:
        a = float(tokens[0])
        op = tokens[1]
        b = float(tokens[2])
    except ValueError:
        raise ValueError("Inputs must be numbers.")

    if op == "+":
        return add(a, b)
    elif op == "-":
        return subtract(a, b)
    elif op == "*":
        return multiply(a, b)
    elif op == "/":
        return divide(a, b)
    else:
        raise ValueError(f"Unsupported operator '{op}'. Supported operators are: +, -, *, /")


def main() -> None:
    """Run the interactive calculator loop."""
    print("========================================")
    print("       Interactive Python Calculator    ")
    print("========================================")
    print("Type your expression separated by spaces (e.g., '5 + 3' or '10 / 2').")
    print("Type 'exit' or 'quit' to close the calculator.\n")

    while True:
        try:
            user_input = input("calc> ").strip()
            if user_input.lower() in ("exit", "quit"):
                print("Goodbye!")
                break
            if not user_input:
                continue

            result = parse_and_calculate(user_input)
            # Format the output nicely (e.g. integer print if result is integer)
            if result.is_integer():
                print(f"Result: {int(result)}")
            else:
                print(f"Result: {result}")

        except (ValueError, ZeroDivisionError) as e:
            print(f"Error: {e}")
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break


if __name__ == "__main__":
    main()
