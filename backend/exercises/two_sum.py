def two_sum(nums, target):
    """
    Returns the indices of the two numbers in the list that add up to the target sum.
    
    Args:
        nums (list): A list of integers.
        target (int): The target sum.
    
    Returns:
        list: A list containing the indices of the two numbers that add up to the target sum. 
              If no such pair exists, returns an empty list.
    """
    num_dict = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_dict:
            return [num_dict[complement], i]
        num_dict[num] = i
    return []

def main():
    # Example usage:
    nums = [2, 7, 11, 15]
    target = 9
    result = two_sum(nums, target)
    if result:
        print(f"Indices of the two numbers that add up to {target}: {result}")
    else:
        print(f"No pair of numbers adds up to {target}")

if __name__ == "__main__":
    main()