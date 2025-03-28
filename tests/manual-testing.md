# PDF Buddy - Manual Testing Guide

This guide provides instructions for manually testing the PDF Buddy Chrome extension in a real browser environment.

## Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked" and select the root directory of the PDF Buddy extension
4. The extension should now be loaded and visible in the extensions list
5. Note the extension ID (you'll need this for some tests)

## Basic Extension Tests

### Extension Loading

1. Verify that the extension icon appears in the Chrome toolbar
2. Click the extension icon to open the popup
3. Verify that the popup opens and displays correctly
4. Navigate to the options page by right-clicking the extension icon and selecting "Options"
5. Verify that the options page loads correctly

### Context Menu

1. Navigate to any web page (e.g., `https://example.com`)
2. Right-click on the page
3. Verify that the "Save as PDF" menu item appears
4. Verify that the submenu items appear:
   - "Without Watermark"
   - "With Watermark"
   - "With Last Watermark"

## PDF Generation Tests

### Basic PDF Generation

1. Navigate to a simple web page (e.g., `https://example.com`)
2. Click the extension icon to open the popup
3. Click the "Save as PDF" button
4. Verify that a PDF is downloaded
5. Open the PDF and verify that it contains the content of the web page

### PDF Generation with Watermark

1. Navigate to a simple web page (e.g., `https://example.com`)
2. Click the extension icon to open the popup
3. Go to the "Watermark" tab
4. Enter text for the watermark (e.g., "CONFIDENTIAL")
5. Configure the watermark options:
   - Position: Center
   - Opacity: 0.5
   - Color: Red
   - Font Size: 48
   - Font Family: Arial
   - Rotation: -45
6. Click the "Save as PDF" button
7. Verify that a PDF is downloaded
8. Open the PDF and verify that it contains the content of the web page with the watermark applied

### PDF Generation from Context Menu

1. Navigate to a simple web page (e.g., `https://example.com`)
2. Right-click on the page
3. Select "Save as PDF" > "Without Watermark"
4. Verify that a PDF is downloaded
5. Open the PDF and verify that it contains the content of the web page
6. Navigate to the page again
7. Right-click on the page
8. Select "Save as PDF" > "With Watermark"
9. Verify that the popup opens with the watermark tab active
10. Configure a watermark and click "Save as PDF"
11. Verify that a PDF is downloaded with the watermark applied

## Template Tests

### Creating and Saving Templates

1. Click the extension icon to open the popup
2. Go to the "Watermark" tab
3. Configure a watermark
4. Click the "Save as Template" button
5. Enter a name for the template
6. Click "Save"
7. Go to the "Templates" tab
8. Verify that the template appears in the list

### Loading Templates

1. Click the extension icon to open the popup
2. Go to the "Templates" tab
3. Click on a template in the list
4. Verify that the watermark tab is updated with the template settings
5. Click "Save as PDF"
6. Verify that a PDF is downloaded with the template watermark applied

### Deleting Templates

1. Click the extension icon to open the popup
2. Go to the "Templates" tab
3. Click the delete button next to a template
4. Verify that the template is removed from the list

## Settings Tests

1. Navigate to the options page
2. Verify that all settings are displayed correctly
3. Change some settings
4. Click "Save"
5. Reload the options page
6. Verify that the settings were saved correctly

## Edge Cases and Error Handling

### Large Pages

1. Navigate to a large, complex web page
2. Generate a PDF
3. Verify that the PDF is generated correctly

### Pages with Dynamic Content

1. Navigate to a page with dynamic content (e.g., a page with animations or content that loads dynamically)
2. Generate a PDF
3. Verify that the PDF captures the content correctly

### Error Handling

1. Try to generate a PDF from a page that cannot be accessed (e.g., a page that requires authentication)
2. Verify that an appropriate error message is displayed
3. Try to create a template with invalid settings
4. Verify that validation errors are displayed

## Security Tests

### Input Validation

1. Try to enter malicious input in the watermark text field (e.g., `<script>alert('XSS')</script>`)
2. Verify that the input is sanitized and no script is executed
3. Try to enter extremely long text in the watermark text field
4. Verify that the input is truncated or an error message is displayed

### Permission Handling

1. Revoke the "downloads" permission from the extension
2. Try to generate a PDF
3. Verify that the extension requests the permission again

## Performance Tests

### Multiple PDFs

1. Generate multiple PDFs in quick succession
2. Verify that all PDFs are generated correctly
3. Monitor memory usage to ensure there are no memory leaks

## Reporting Issues

If you encounter any issues during manual testing, please report them with the following information:

1. Steps to reproduce the issue
2. Expected behavior
3. Actual behavior
4. Screenshots or screen recordings if applicable
5. Browser version and operating system
6. Extension version
