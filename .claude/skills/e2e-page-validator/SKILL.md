---
name: e2e-page-validator
description: Automates E2E testing of a specific page, identifying parameters, testing inputs, and verifying backend services.
trigger: explicit
---

# E2E Page Validator

This skill automates the testing of a web page by exploring its interactive elements, monitoring network traffic, and generating a detailed report.

## Workflow

1.  **Exploration**:
    - Use Chrome to navigate to the target URL.
    - List all interactive elements (inputs, dropdowns, buttons).
    - Map the "happy path" for the user flow.

2.  **Parameter Discovery & Testing**:
    - Identify all data-binding parameters (query params, form fields).
    - Test each parameter with:
        - Valid data
        - Missing data
        - Invalid/Extreme data (very long strings, special characters)

3.  **Service Verification**:
    - Monitor network requests while interacting.
    - Verify that every service call (XHR/Fetch) returns a successful response (2xx).
    - Log any failed service calls (4xx/5xx) with the request details.

4.  **Reporting**:
    - Create a detailed report in `test_report.md` (or a similar name) containing:
        - Overview of the tested page.
        - Table of parameters and their test results.
        - Table of backend services called and their status.
        - Screenshots/Recordings of any failures.

## Usage


credenetials for the login page : email : testuser@engunity.com , password : Meghal0987@23

Trigger this skill with:
"Use the e2e-page-validator skill to test the page: [URL]"

## Anti-Patterns

- **Surface Testing**: Do not just check if the page loads; you must interact with the elements.
- **Ignoring Console Errors**: Always check for JavaScript errors in the browser console.
- **Missing Service Logs**: Every button click that triggers a network request must be verified.
