// palindrome.cpp
// This program checks whether a given string is a palindrome.

#include <iostream>
#include <string>
#include <algorithm>

/**
 * Checks whether a given string is a palindrome.
 *
 * @param str The input string to check.
 * @return True if the string is a palindrome, false otherwise.
 */
bool isPalindrome(const std::string& str) {
    // Create a copy of the input string to reverse
    std::string reversedStr = str;
    
    // Reverse the copied string
    std::reverse(reversedStr.begin(), reversedStr.end());
    
    // Compare the original string with its reverse
    return str == reversedStr;
}

int main() {
    // Get the input string from the user
    std::string inputStr;
    std::cout << "Enter a string: ";
    std::getline(std::cin, inputStr);
    
    // Check if the input string is a palindrome
    if (isPalindrome(inputStr)) {
        std::cout << inputStr << " is a palindrome." << std::endl;
    } else {
        std::cout << inputStr << " is not a palindrome." << std::endl;
    }
    
    return 0;
}