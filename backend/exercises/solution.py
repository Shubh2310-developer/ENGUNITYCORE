def two_sum(nums, target):
    """
    Returns the indices of the two numbers in the array that add up to the target.
    
    Args:
        nums (list): A list of integers.
        target (int): The target integer.
    
    Returns:
        list: A list containing the indices of the two numbers. If no solution is found, returns "No solution found".
    """
    num_dict = {}
    for i, num in enumerate(nums):
        # Calculate the complement of the current number
        complement = target - num
        
        # Check if the complement is in the dictionary
        if complement in num_dict:
            # Return the indices of the current number and its complement
            return [num_dict[complement], i]
        
        # Add the current number and its index to the dictionary
        num_dict[num] = i
    
    # If no solution is found after iterating through the entire array, return a message
    return "No solution found"

# Example usage:
def main():
    nums = [2, 7, 11, 15]
    target = 9
    result = two_sum(nums, target)
    print(result)

if __name__ == "__main__":
    main()