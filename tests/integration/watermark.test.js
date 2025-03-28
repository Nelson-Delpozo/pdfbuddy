/**
 * Integration tests for watermark functionality
 */

// Import the functions to test
import { createTextWatermark, applyWatermarkToCanvas } from '../../src/lib/utils/watermark.js';
import { validateWatermarkConfig } from '../../src/lib/utils/security.js';

// Mock the dependencies
jest.mock('../../src/lib/utils/error-handler.js', () => ({
  errorHandler: {
    createWatermarkError: jest.fn().mockImplementation((message) => ({ message })),
    handleError: jest.fn()
  },
  ErrorType: { WATERMARK: 'WATERMARK' },
  ErrorSeverity: { ERROR: 'ERROR', WARNING: 'WARNING' }
}));

jest.mock('../../src/lib/utils/analytics.js', () => ({
  trackWatermarkCreation: jest.fn(),
  trackError: jest.fn()
}));

jest.mock('../../src/lib/utils/license-manager.js', () => ({
  isFeatureAvailable: jest.fn().mockReturnValue(true),
  PremiumFeature: { IMAGE_WATERMARK: 'IMAGE_WATERMARK' }
}));

describe('Watermark Integration', () => {
  // Create a mock canvas and context for testing
  let mockCanvas;
  let mockContext;
  
  beforeEach(() => {
    // Create a mock canvas
    mockCanvas = {
      width: 800,
      height: 600,
      getContext: jest.fn()
    };
    
    // Create a mock context
    mockContext = {
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      fillText: jest.fn(),
      globalAlpha: 0,
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: ''
    };
    
    // Set up the mock canvas to return the mock context
    mockCanvas.getContext.mockReturnValue(mockContext);
  });
  
  describe('Watermark Creation and Application', () => {
    test('should create a text watermark and apply it to a canvas', () => {
      // Create a text watermark
      const watermarkText = 'CONFIDENTIAL';
      const watermarkOptions = {
        position: 'center',
        opacity: 0.5,
        color: '#FF0000',
        fontSize: 48,
        fontFamily: 'Arial',
        rotation: -45
      };
      
      const watermarkConfig = createTextWatermark(watermarkText, watermarkOptions);
      
      // Validate the watermark configuration
      expect(watermarkConfig).toBeDefined();
      expect(watermarkConfig.type).toBe('text');
      expect(watermarkConfig.text).toBe(watermarkText);
      expect(watermarkConfig.position).toBe(watermarkOptions.position);
      expect(watermarkConfig.opacity).toBe(watermarkOptions.opacity);
      expect(watermarkConfig.color).toBe(watermarkOptions.color);
      expect(watermarkConfig.fontSize).toBe(watermarkOptions.fontSize);
      expect(watermarkConfig.fontFamily).toBe(watermarkOptions.fontFamily);
      expect(watermarkConfig.rotation).toBe(watermarkOptions.rotation);
      
      // Apply the watermark to the canvas
      const result = applyWatermarkToCanvas(mockCanvas, watermarkConfig);
      
      // Verify the canvas was returned
      expect(result).toBe(mockCanvas);
      
      // Verify the context methods were called
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockContext.save).toHaveBeenCalled();
      
      // Verify the context properties were set
      expect(mockContext.globalAlpha).toBe(watermarkOptions.opacity);
      expect(mockContext.fillStyle).toBe(watermarkOptions.color);
      expect(mockContext.font).toBe(`${watermarkOptions.fontSize}px ${watermarkOptions.fontFamily}`);
      expect(mockContext.textAlign).toBe('center');
      expect(mockContext.textBaseline).toBe('middle');
      
      // Verify the context methods were called with the right parameters
      expect(mockContext.translate).toHaveBeenCalledWith(400, 300); // Center of 800x600 canvas
      expect(mockContext.rotate).toHaveBeenCalledWith((-45 * Math.PI) / 180);
      expect(mockContext.fillText).toHaveBeenCalledWith(watermarkText, 0, 0);
      expect(mockContext.restore).toHaveBeenCalled();
    });
    
    test('should handle invalid watermark configurations', () => {
      // Create an invalid watermark configuration
      const invalidConfig = {
        type: 'text',
        text: '<script>alert("XSS")</script>',
        position: 'invalid',
        opacity: 2,
        color: 'notacolor',
        fontSize: 100,
        fontFamily: 'UnknownFont',
        rotation: 200
      };
      
      // Validate the watermark configuration
      const validatedConfig = validateWatermarkConfig(invalidConfig);
      
      // Apply the watermark to the canvas
      const result = applyWatermarkToCanvas(mockCanvas, validatedConfig);
      
      // Verify the canvas was returned
      expect(result).toBe(mockCanvas);
      
      // Verify the context methods were called
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockContext.save).toHaveBeenCalled();
      
      // Verify the context properties were set with default values
      expect(mockContext.globalAlpha).toBe(0.5); // Default opacity
      expect(mockContext.fillStyle).toBe('#FF0000'); // Default color
      expect(mockContext.font).toBe('48px Arial'); // Default font
      expect(mockContext.textAlign).toBe('center');
      expect(mockContext.textBaseline).toBe('middle');
      
      // Verify the context methods were called with the right parameters
      expect(mockContext.translate).toHaveBeenCalledWith(400, 300); // Center of 800x600 canvas
      expect(mockContext.rotate).toHaveBeenCalledWith((0 * Math.PI) / 180); // Default rotation
      expect(mockContext.fillText).toHaveBeenCalledWith('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;', 0, 0);
      expect(mockContext.restore).toHaveBeenCalled();
    });
  });
  
  describe('Watermark Positioning', () => {
    test('should position watermarks correctly', () => {
      // Test center position
      let config = createTextWatermark('CENTER', { position: 'center' });
      applyWatermarkToCanvas(mockCanvas, config);
      expect(mockContext.translate).toHaveBeenCalledWith(400, 300);
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Test top left position
      config = createTextWatermark('TOP LEFT', { position: 'topLeft' });
      applyWatermarkToCanvas(mockCanvas, config);
      expect(mockContext.translate).toHaveBeenCalledWith(80, 60); // 10% of 800x600
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Test top right position
      config = createTextWatermark('TOP RIGHT', { position: 'topRight' });
      applyWatermarkToCanvas(mockCanvas, config);
      expect(mockContext.translate).toHaveBeenCalledWith(720, 60); // 90% of 800x600
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Test bottom left position
      config = createTextWatermark('BOTTOM LEFT', { position: 'bottomLeft' });
      applyWatermarkToCanvas(mockCanvas, config);
      expect(mockContext.translate).toHaveBeenCalledWith(80, 540); // 10% and 90% of 800x600
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Test bottom right position
      config = createTextWatermark('BOTTOM RIGHT', { position: 'bottomRight' });
      applyWatermarkToCanvas(mockCanvas, config);
      expect(mockContext.translate).toHaveBeenCalledWith(720, 540); // 90% of 800x600
    });
  });
});
