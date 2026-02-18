// Package main implements a simple command-line calculator.
package main

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Calculator represents a simple command-line calculator.
type Calculator struct{}

// NewCalculator returns a new Calculator instance.
func NewCalculator() *Calculator {
	return &Calculator{}
}

// PerformOperation performs the specified mathematical operation on two numbers.
func (c *Calculator) PerformOperation(num1, num2 float64, op string) (float64, error) {
	switch op {
	case "+":
		return num1 + num2, nil
	case "-":
		return num1 - num2, nil
	case "*":
		return num1 * num2, nil
	case "/":
		if num2 == 0 {
			return 0, errors.New("division by zero")
		}
		return num1 / num2, nil
	default:
		return 0, errors.New("unsupported operation")
	}
}

func main() {
(calculator := NewCalculator()
	scanner := bufio.NewScanner(os.Stdin)

	fmt.Println("Simple Command-Line Calculator")
	fmt.Println("-------------------------------")

	for {
		fmt.Print("Enter a mathematical expression (e.g., 2 + 2), 'quit' to exit: ")
		scanner.Scan()
		input := scanner.Text()

		if strings.ToLower(input) == "quit" {
			break
		}

		parts := strings.Split(input, " ")
		if len(parts) != 3 {
			fmt.Println("Invalid input. Please use the format: number operator number")
			continue
		}

		num1, err := strconv.ParseFloat(parts[0], 64)
		if err != nil {
			fmt.Println("Invalid first operand:", err)
			continue
		}

		op := parts[1]
		num2, err := strconv.ParseFloat(parts[2], 64)
		if err != nil {
			fmt.Println("Invalid second operand:", err)
			continue
		}

		result, err := calculator.PerformOperation(num1, num2, op)
		if err != nil {
			fmt.Println("Error performing operation:", err)
			continue
		}

		fmt.Printf("%f %s %f = %f\n", num1, op, num2, result)
	}
}