#include <iostream>

/**
 * Function to calculate and print the Fibonacci sequence up to a given number.
 *
 * @param n The number up to which the Fibonacci sequence should be printed.
 */
void printFibonacci(int n) {
    int fibSequence[100]; // Array to store the Fibonacci sequence

    // Initialize the first two numbers in the sequence
    fibSequence[0] = 0;
    fibSequence[1] = 1;

    // Print the first two numbers
    std::cout << fibSequence[0] << " " << fibSequence[1] << " ";

    // Generate the Fibonacci sequence using a loop
    for (int i = 2; i < n; i++) {
        // Calculate the next number as the sum of the previous two
        fibSequence[i] = fibSequence[i - 1] + fibSequence[i - 2];
        std::cout << fibSequence[i] << " ";
    }
}

int main() {
    int num;
    std::cout << "Enter the number of terms in the Fibonacci sequence: ";
    std::cin >> num;

    std::cout << "Fibonacci sequence up to " << num << " terms: ";
    printFibonacci(num);

    return 0;
}