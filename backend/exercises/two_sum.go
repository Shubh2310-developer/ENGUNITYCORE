// Package main provides a solution to the two sum problem.
package main

import (
	"errors"
	"fmt"
)

// twoSum returns the pairs of numbers in the given array that add up to the target sum.
func twoSum(nums []int, target int) ([][]int, error) {
	// Initialize an empty slice to store the pairs of numbers.
	pairs := [][]int{}

	// Iterate over the array of numbers using nested loops to check every pair.
	for i := 0; i < len(nums); i++ {
		for j := i + 1; j < len(nums); j++ {
			// Check if the current pair adds up to the target sum.
			if nums[i]+nums[j] == target {
				// If the pair adds up to the target sum, append it to the pairs slice.
				pairs = append(pairs, []int{nums[i], nums[j]})
			}
		}
	}

	// If no pairs are found, return an empty slice and an error.
	if len(pairs) == 0 {
		return [][]int{}, errors.New("no two sum solution exists")
	}

	// Return the pairs of numbers that add up to the target sum.
	return pairs, nil
}

func main() {
	// Example usage:
	nums := []int{2, 7, 11, 15}
	target := 9

	result, err := twoSum(nums, target)
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println("Pairs that sum up to the target:")
		for i, pair := range result {
			fmt.Printf("Pair %d: (%d, %d)\n", i+1, pair[0], pair[1])
		}
	}
}