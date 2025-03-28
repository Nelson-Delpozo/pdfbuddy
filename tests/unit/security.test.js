/**
 * Unit tests for security utilities
 */

// Import the functions to test
import {
  sanitizeString,
  sanitizeObject,
  validatePattern,
  validateLength,
  validateUrl,
  validateColor,
  validateFontFamily,
  validateNumberRange,
  validateWatermarkConfig,
  safeJsonParse,
  safeJsonStringify
} from '../../src/lib/utils/security.js';

describe('Security Utilities', () => {
  describe('sanitizeString', () => {
    test('should sanitize HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(sanitizeString(input)).toBe(expected);
    });

    test('should return empty string for non-string inputs', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString({})).toBe('');
    });

    test('should not modify strings without special characters', () => {
      const input = 'Hello, World!';
      expect(sanitizeString(input)).toBe(input);
    });
  });

  describe('sanitizeObject', () => {
    test('should sanitize all string properties in an object', () => {
      const input = {
        name: '<b>Bold Name</b>',
        description: 'Normal text',
        nested: {
          html: '<p>Paragraph</p>'
        }
      };
      
      const expected = {
        name: '&lt;b&gt;Bold Name&lt;/b&gt;',
        description: 'Normal text',
        nested: {
          html: '&lt;p&gt;Paragraph&lt;/p&gt;'
        }
      };
      
      expect(sanitizeObject(input)).toEqual(expected);
    });

    test('should return non-object inputs as is', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject('string')).toBe('string');
      expect(sanitizeObject(123)).toBe(123);
    });
  });

  describe('validatePattern', () => {
    test('should validate strings against patterns', () => {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      expect(validatePattern('test@example.com', emailPattern)).toBe(true);
      expect(validatePattern('invalid-email', emailPattern)).toBe(false);
    });

    test('should return false for non-string inputs', () => {
      const pattern = /test/;
      expect(validatePattern(null, pattern)).toBe(false);
      expect(validatePattern(undefined, pattern)).toBe(false);
      expect(validatePattern(123, pattern)).toBe(false);
      expect(validatePattern({}, pattern)).toBe(false);
    });
  });

  describe('validateLength', () => {
    test('should validate string length within range', () => {
      expect(validateLength('test', 1, 10)).toBe(true);
      expect(validateLength('test', 5, 10)).toBe(false);
      expect(validateLength('test', 1, 3)).toBe(false);
    });

    test('should return false for non-string inputs', () => {
      expect(validateLength(null, 1, 10)).toBe(false);
      expect(validateLength(undefined, 1, 10)).toBe(false);
      expect(validateLength(123, 1, 10)).toBe(false);
      expect(validateLength({}, 1, 10)).toBe(false);
    });
  });

  describe('validateUrl', () => {
    test('should validate URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('ftp://example.com')).toBe(false); // Not a safe protocol
      expect(validateUrl('javascript:alert(1)')).toBe(false); // Not a safe protocol
      expect(validateUrl('not a url')).toBe(false);
    });

    test('should return false for non-string inputs', () => {
      expect(validateUrl(null)).toBe(false);
      expect(validateUrl(undefined)).toBe(false);
      expect(validateUrl(123)).toBe(false);
      expect(validateUrl({})).toBe(false);
    });
  });

  describe('validateColor', () => {
    test('should validate hex colors', () => {
      expect(validateColor('#FF0000')).toBe(true);
      expect(validateColor('#F00')).toBe(true);
      expect(validateColor('#XYZ')).toBe(false);
    });

    test('should validate rgb/rgba colors', () => {
      expect(validateColor('rgb(255, 0, 0)')).toBe(true);
      expect(validateColor('rgba(255, 0, 0, 0.5)')).toBe(true);
      expect(validateColor('rgb(255, 0)')).toBe(false);
    });

    test('should validate named colors', () => {
      expect(validateColor('red')).toBe(true);
      expect(validateColor('blue')).toBe(true);
      expect(validateColor('notacolor')).toBe(false);
    });

    test('should return false for non-string inputs', () => {
      expect(validateColor(null)).toBe(false);
      expect(validateColor(undefined)).toBe(false);
      expect(validateColor(123)).toBe(false);
      expect(validateColor({})).toBe(false);
    });
  });

  describe('validateFontFamily', () => {
    test('should validate allowed font families', () => {
      expect(validateFontFamily('Arial')).toBe(true);
      expect(validateFontFamily('Times New Roman')).toBe(true);
      expect(validateFontFamily('Comic Sans MS')).toBe(true);
      expect(validateFontFamily('UnknownFont')).toBe(false);
    });

    test('should return false for non-string inputs', () => {
      expect(validateFontFamily(null)).toBe(false);
      expect(validateFontFamily(undefined)).toBe(false);
      expect(validateFontFamily(123)).toBe(false);
      expect(validateFontFamily({})).toBe(false);
    });
  });

  describe('validateNumberRange', () => {
    test('should validate numbers within range', () => {
      expect(validateNumberRange(5, 1, 10)).toBe(true);
      expect(validateNumberRange(0, 1, 10)).toBe(false);
      expect(validateNumberRange(11, 1, 10)).toBe(false);
    });

    test('should return false for non-number inputs', () => {
      expect(validateNumberRange('5', 1, 10)).toBe(false);
      expect(validateNumberRange(null, 1, 10)).toBe(false);
      expect(validateNumberRange(undefined, 1, 10)).toBe(false);
      expect(validateNumberRange({}, 1, 10)).toBe(false);
      expect(validateNumberRange(NaN, 1, 10)).toBe(false);
    });
  });

  describe('validateWatermarkConfig', () => {
    test('should validate text watermark configurations', () => {
      const validConfig = {
        type: 'text',
        text: 'CONFIDENTIAL',
        position: 'center',
        opacity: 0.5,
        color: '#FF0000',
        fontSize: 48,
        fontFamily: 'Arial',
        rotation: 0
      };
      
      expect(validateWatermarkConfig(validConfig)).toEqual(validConfig);
      
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
      
      const sanitizedConfig = validateWatermarkConfig(invalidConfig);
      expect(sanitizedConfig.text).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(sanitizedConfig.position).toBe('center');
      expect(sanitizedConfig.opacity).toBe(0.5);
      expect(sanitizedConfig.color).toBe('#FF0000');
      expect(sanitizedConfig.fontSize).toBe(48);
      expect(sanitizedConfig.fontFamily).toBe('Arial');
      expect(sanitizedConfig.rotation).toBe(0);
    });

    test('should return null for invalid configurations', () => {
      expect(validateWatermarkConfig(null)).toBeNull();
      expect(validateWatermarkConfig({})).toBeNull();
      expect(validateWatermarkConfig({ type: 'unknown' })).toBeNull();
    });
  });

  describe('safeJsonParse', () => {
    test('should parse valid JSON', () => {
      const json = '{"name":"Test","value":123}';
      expect(safeJsonParse(json)).toEqual({ name: 'Test', value: 123 });
    });

    test('should return default value for invalid JSON', () => {
      const invalidJson = '{name:"Test",value:123}';
      expect(safeJsonParse(invalidJson, null)).toBeNull();
      expect(safeJsonParse(invalidJson, {})).toEqual({});
    });
  });

  describe('safeJsonStringify', () => {
    test('should stringify valid objects', () => {
      const obj = { name: 'Test', value: 123 };
      expect(safeJsonStringify(obj)).toBe('{"name":"Test","value":123}');
    });

    test('should return default value for unstringifiable objects', () => {
      const circular = {};
      circular.self = circular;
      
      expect(safeJsonStringify(circular, '{}')).toBe('{}');
    });
  });
});
