# PDF Buddy - Installation Guide

This guide will help you install and test the PDF Buddy Chrome extension in development mode.

## Prerequisites

- Google Chrome browser (or any Chromium-based browser like Edge, Brave, etc.)
- Git (optional, for cloning the repository)

## Installation Steps

### 1. Get the Code

Either clone the repository or download and extract the ZIP file:

```bash
git clone https://github.com/your-username/pdfbuddy.git
cd pdfbuddy
```

### 2. Install Dependencies (Optional)

If you want to use the development tools or run linting:

```bash
npm install
```

### 3. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top-right corner
3. Click "Load unpacked"
4. Select the `pdfbuddy` directory (the root of the project, containing the manifest.json file)

The extension should now appear in your extensions list and the icon should be visible in the Chrome toolbar.

## Testing the Extension

### Basic PDF Generation

1. Navigate to any webpage
2. Click the PDF Buddy icon in the toolbar
3. In the popup, click "Save as PDF"
4. The page should be saved as a PDF in your downloads folder

### Using Watermarks

1. Click the PDF Buddy icon in the toolbar
2. Switch to the "Watermark" tab
3. Enter your watermark text and customize the settings
4. Click "Save with Watermark"
5. The page should be saved as a PDF with your watermark applied

### Using Templates

1. Create a watermark as described above
2. Click "Save as Template"
3. Enter a name for your template
4. Switch to the "Templates" tab to see your saved template
5. Click "Use" to apply the template to a new PDF

### Context Menu

1. Right-click on any webpage
2. In the context menu, hover over "Save as PDF"
3. Choose one of the options:
   - Without Watermark
   - With Watermark
   - With Last Watermark

## Troubleshooting

### Extension Not Loading

- Make sure you've selected the correct directory containing the manifest.json file
- Check the console in the extensions page for any error messages

### PDF Generation Issues

- Some pages with complex layouts may not render correctly
- Try disabling any other extensions that might interfere with page rendering

### Watermark Not Appearing

- Make sure you've entered text for the watermark
- Try adjusting the opacity if the watermark is too faint

## Development Notes

- The extension is currently in development mode
- Icons are placeholders and will be replaced in the final version
- Some premium features are not yet implemented

## Feedback and Issues

If you encounter any issues or have suggestions for improvements, please open an issue on the GitHub repository or contact the development team.
