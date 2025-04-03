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
- Build System:
  - Added webpack for bundling
  - Set up development and production builds
  - Configured asset copying and processing
  - Updated manifest.json for bundled files
  - Fixed CSP issues with bundled code
- Full-Page PDF Capture:
  - Implemented scrolling screenshot approach
  - Added UI option to enable/disable full-page capture
  - Enhanced content script for scrolling and stitching
  - Added proper page preparation for PDF generation
  - Implemented smart page layout detection (auto, portrait, landscape)
  - Added content filtering options (images, banners, ads, navigation)
  - Implemented pagination for multi-page PDFs
  - Added progress overlay with real-time feedback

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
- Fixed partial page capture issue by implementing scrolling screenshot approach for full-page PDF generation
- Fixed "Failed to generate PDF" error when clicking the create PDF button:
  - Added null check for logCallback function in error-handler.js
  - Fixed PDF merging logic in pdf-generator.js to properly add pages from other PDFs
  - Updated content.js to properly handle processImage action
  - Fixed captureFullPage option in pdf-generator.js to default to false (current screen only)
  - Added explicit "Capture Full Page" checkbox to popup.html for better user control
  - Updated all PDF generation functions to use the new checkbox value
  - Implemented full page capture functionality in content.js using canvas to capture the entire page

## [0.1.0] - 2025-03-28

### Added
- Initial development setup

[Unreleased]: https://github.com/yourusername/pdfbuddy/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/pdfbuddy/releases/tag/v0.1.0
