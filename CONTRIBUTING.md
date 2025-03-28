# Contributing to PDF Buddy

Thank you for your interest in contributing to PDF Buddy! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser and version
- Any other relevant information

### Suggesting Features

We welcome feature suggestions! Please create an issue with:

- A clear, descriptive title
- A detailed description of the feature
- Why this feature would be useful
- Any implementation ideas you have

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Run tests and linting (`npm run lint`)
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature-name`)
7. Open a Pull Request

## Development Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Follow the installation instructions in INSTALL.md to load the extension in Chrome

## Coding Standards

- Follow the ESLint configuration
- Use ES6+ features
- Write JSDoc comments for all public functions and methods
- Follow the existing code style and patterns
- Write clear, descriptive commit messages

## Project Structure

```
pdfbuddy/
├── src/
│   ├── popup/       # Browser action popup
│   ├── background/  # Background service worker
│   ├── content/     # Content scripts
│   ├── options/     # Options page
│   ├── lib/         # Shared libraries
│   │   └── utils/   # Utility functions
├── assets/
│   └── icons/       # Extension icons
├── manifest.json    # Extension manifest
└── README.md        # Project documentation
```

## Testing

- Write unit tests for new functionality
- Test the extension in Chrome before submitting a PR
- Verify that your changes work across different types of web pages

## Documentation

- Update the README.md if necessary
- Document new features or changes in behavior
- Update JSDoc comments for any modified functions

## License

By contributing to PDF Buddy, you agree that your contributions will be licensed under the project's license.

## Questions?

If you have any questions or need help, please create an issue or contact the project maintainers.

Thank you for contributing to PDF Buddy!
