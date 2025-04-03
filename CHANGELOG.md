# Changelog

All notable changes to the PDF Buddy Chrome extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure and documentation
- Basic extension setup with manifest.json
- Background script with context menu integration
- Content script for page preparation
- Popup UI with tabs for quick save, watermark, and templates
- Options page for settings
- PDF generation functionality using Chrome's APIs
- Text watermarking capability
- Template system for saving watermark configurations
- Storage utilities for managing user preferences
- Error handling system
- Analytics tracking (placeholder)
- License management for premium features (placeholder)
- Security infrastructure:
  - Input validation and sanitization utilities
  - Content Security Policy configuration
  - Security constants and patterns
  - Permission management utilities
  - Manifest security enhancements
- Testing infrastructure:
  - Unit tests for security utilities
  - Integration tests for watermark functionality
  - End-to-end test framework
  - Manual testing guide
- Infrastructure:
  - Acquired pdfbuddy.app domain
  - Set up support@pdfbuddy.app email
  - Updated documentation with domain information
- Legal:
  - Implemented custom proprietary license
  - Updated package.json with license reference
  - Updated README with license information
  - Created no-contributions policy
- PDF Library Integration:
  - Added jsPDF for proper PDF generation
  - Created PDF library wrapper module
  - Implemented PDF generation from captured screenshots
  - Added text watermarking directly in PDF
  - Added support for image watermarks (premium feature)

### Changed
- N/A

### Fixed
- Fixed double sanitization issue in watermark.js that was causing integration tests to fail
- Fixed module loading issues in Chrome extension context
- Fixed service worker compatibility issues in error-handler.js
- Fixed window object handling in security.js for environments where window is not available
- Fixed PDF generation error by using chrome.tabs.captureVisibleTab instead of non-existent chrome.tabs.printToPDF
- Implemented canvas-based watermarking for captured screenshots
- Updated watermarking process to work with image data instead of PDF data
- Fixed scale parameter validation in PDF generation to ensure it's always a valid number
- Improved options validation to handle missing or invalid parameters gracefully

## [0.1.0] - 2025-03-28

### Added
- Initial development setup

[Unreleased]: https://github.com/yourusername/pdfbuddy/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/pdfbuddy/releases/tag/v0.1.0
