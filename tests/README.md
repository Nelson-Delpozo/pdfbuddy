# PDF Buddy - Tests

This directory contains tests for the PDF Buddy Chrome extension. The tests are organized into three categories:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test how components work together
3. **End-to-End Tests**: Test the extension in a real browser environment

## Test Structure

```
tests/
├── unit/             # Unit tests
│   └── security.test.js
├── integration/      # Integration tests
│   └── watermark.test.js
├── e2e/              # End-to-end tests
│   └── extension.test.js
└── README.md         # This file
```

## Running Tests

### Prerequisites

- Node.js and npm installed
- Dependencies installed (`npm install`)

### Running All Tests

```bash
npm test
```

### Running Specific Test Categories

```bash
# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run end-to-end tests only
npm run test:e2e
```

## Unit Tests

Unit tests focus on testing individual functions and components in isolation. They mock any dependencies to ensure that only the unit being tested is exercised.

### Current Unit Tests

- **Security Utilities**: Tests for input validation, sanitization, and other security-related functions

## Integration Tests

Integration tests focus on testing how components work together. They may mock some dependencies, but they test the integration between multiple units.

### Current Integration Tests

- **Watermark Integration**: Tests for creating watermarks and applying them to canvases

## End-to-End Tests

End-to-end tests focus on testing the extension in a real browser environment. They require a real Chrome browser with the extension installed.

### Current End-to-End Tests

- **Extension Loading**: Tests that the extension loads correctly
- **PDF Generation**: Tests for generating PDFs from web pages
- **Context Menu**: Tests for the context menu functionality
- **Templates**: Tests for saving and loading templates

### Running End-to-End Tests

End-to-end tests require additional setup:

1. Build the extension
2. Install it in Chrome
3. Get the extension ID
4. Update the `EXTENSION_ID` constant in `tests/e2e/extension.test.js`
5. Run the tests

```bash
npm run test:e2e
```

## Adding New Tests

When adding new tests, follow these guidelines:

1. Place unit tests in the `tests/unit/` directory
2. Place integration tests in the `tests/integration/` directory
3. Place end-to-end tests in the `tests/e2e/` directory
4. Name test files with the `.test.js` extension
5. Follow the existing test patterns

## Test Coverage

Test coverage reports are generated when running tests. The reports can be found in the `coverage/` directory.

To view the coverage report, open `coverage/lcov-report/index.html` in a browser.
