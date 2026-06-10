// MultithreadingExample.java

// Import the necessary packages
import java.util.concurrent.TimeUnit;

// Define a class that implements the Runnable interface
class MyRunnable implements Runnable {
    private String threadName;

    // Constructor to initialize the thread name
    public MyRunnable(String threadName) {
        this.threadName = threadName;
    }

    // Override the run method to define the thread's behavior
    @Override
    public void run() {
        // Simulate some work being done by the thread
        for (int i = 0; i < 5; i++) {
            System.out.println(threadName + " is running iteration " + (i + 1));
            try {
                // Pause the thread for a short duration
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}

public class MultithreadingExample {
    // Main method to demonstrate multithreading
    public static void main(String[] args) {
        // Create instances of the MyRunnable class
        MyRunnable runnable1 = new MyRunnable("Thread-1");
        MyRunnable runnable2 = new MyRunnable("Thread-2");

        // Create threads from the runnable instances
        Thread thread1 = new Thread(runnable1);
        Thread thread2 = new Thread(runnable2);

        // Start the threads
        thread1.start();
        thread2.start();

        // Wait for both threads to finish
        try {
            thread1.join();
            thread2.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        System.out.println("Both threads have completed execution.");
    }
}