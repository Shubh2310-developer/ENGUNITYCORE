def is_palindrome(s: str) -> bool:
    """
    Checks if a given string is the same when its characters are reversed, 
    ignoring case and non-alphanumeric characters.

    Args:
    s (str): The input string to check.

    Returns:
    bool: True if the string is a palindrome, False otherwise.
    """
    # Remove non-alphanumeric characters and convert to lower case
    cleaned_s = ''.join(char.lower() for char in s if char.isalnum())
    
    # Compare the cleaned string with its reverse
    return cleaned_s == cleaned_s[::-1]


def main():
    # Test the is_palindrome function with example strings
    test_strings = [
        "A man, a plan, a canal: Panama",
        "Not a palindrome",
        "Was it a car or a cat I saw?",
        "No 'x' in Nixon"
    ]

    for s in test_strings:
        print(f"Is '{s}' a palindrome? {is_palindrome(s)}")


if __name__ == "__main__":
    main()