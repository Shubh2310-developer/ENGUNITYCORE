#include <iostream>
using namespace std;

// Function to calculate Fibonacci sequence up to n
void fibonacci(int n) {
    int num1 = 0, num2 = 1;
    cout << "Fibonacci sequence up to " << n << ": ";
    for (int i = 1; i <= n; i++) {
        cout << num1 << " ";
        int next = num1 + num2;
        num1 = num2;
        num2 = next;
    }
    cout << endl;
}

int main() {
    int n;
    cout << "Enter the number of terms in the Fibonacci sequence: ";
    cin >> n;
    fibonacci(n);
    return 0;
}