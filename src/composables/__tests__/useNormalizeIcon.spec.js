import { describe, it, expect } from 'vitest';
import { useNormalizeIcon } from '../useNormalizeIcon';

describe('useNormalizeIcon', () => {
  it('should return a function', () => {
    const normalizeIcon = useNormalizeIcon();
    expect(typeof normalizeIcon).toBe('function');
  });

  describe('full format (mdi mdi-icon)', () => {
    it('should return unchanged when given full mdi format', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('mdi mdi-thermometer')).toBe('mdi mdi-thermometer');
    });

    it('should handle multiple spaces gracefully', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('mdi  mdi-thermometer')).toBe('mdi  mdi-thermometer');
    });

    it('should handle various icon names', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('mdi mdi-home')).toBe('mdi mdi-home');
      expect(normalizeIcon('mdi mdi-lightbulb')).toBe('mdi mdi-lightbulb');
      expect(normalizeIcon('mdi mdi-power-plug')).toBe('mdi mdi-power-plug');
    });
  });

  describe('Home Assistant format (mdi:icon)', () => {
    it('should convert Home Assistant format to mdi format', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('mdi:thermometer')).toBe('mdi mdi-thermometer');
    });

    it('should handle hyphenated icon names', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('mdi:power-plug')).toBe('mdi mdi-power-plug');
      expect(normalizeIcon('mdi:view-dashboard')).toBe('mdi mdi-view-dashboard');
    });

    it('should handle various Home Assistant format icons', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('mdi:home')).toBe('mdi mdi-home');
      expect(normalizeIcon('mdi:lightbulb')).toBe('mdi mdi-lightbulb');
    });
  });

  describe('simplified format (mdi-icon)', () => {
    it('should add mdi prefix to simplified format', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('mdi-thermometer')).toBe('mdi mdi-thermometer');
    });

    it('should handle hyphenated icon names', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('mdi-power-plug')).toBe('mdi mdi-power-plug');
      expect(normalizeIcon('mdi-view-dashboard')).toBe('mdi mdi-view-dashboard');
    });

    it('should handle various simplified format icons', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('mdi-home')).toBe('mdi mdi-home');
      expect(normalizeIcon('mdi-lightbulb')).toBe('mdi mdi-lightbulb');
    });
  });

  describe('bare icon name format (icon)', () => {
    it('should add mdi mdi prefix to bare icon name', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('thermometer')).toBe('mdi mdi-thermometer');
    });

    it('should handle hyphenated icon names', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('power-plug')).toBe('mdi mdi-power-plug');
      expect(normalizeIcon('view-dashboard')).toBe('mdi mdi-view-dashboard');
    });

    it('should handle various bare format icons', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('home')).toBe('mdi mdi-home');
      expect(normalizeIcon('lightbulb')).toBe('mdi mdi-lightbulb');
    });
  });

  describe('edge cases and empty values', () => {
    it('should handle null gracefully', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon(null)).toBe(null);
    });

    it('should handle undefined gracefully', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon(undefined)).toBe(undefined);
    });

    it('should handle empty string', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('')).toBe('');
    });

    it('should preserve whitespace in full format', () => {
      const normalizeIcon = useNormalizeIcon();
      const result = normalizeIcon('mdi mdi-thermometer');
      expect(result).toBe('mdi mdi-thermometer');
      expect(result).toMatch(/mdi\smdi-/);
    });
  });

  describe('consistency across multiple calls', () => {
    it('should return consistent results for repeated calls', () => {
      const normalizeIcon = useNormalizeIcon();
      const icon = 'mdi-home';
      const result1 = normalizeIcon(icon);
      const result2 = normalizeIcon(icon);
      expect(result1).toBe(result2);
    });

    it('should handle mixed format sequences', () => {
      const normalizeIcon = useNormalizeIcon();
      const formats = [
        { input: 'home', expected: 'mdi mdi-home' },
        { input: 'mdi-home', expected: 'mdi mdi-home' },
        { input: 'mdi:home', expected: 'mdi mdi-home' },
        { input: 'mdi mdi-home', expected: 'mdi mdi-home' },
      ];
      formats.forEach(({ input, expected }) => {
        expect(normalizeIcon(input)).toBe(expected);
      });
    });
  });

  describe('real-world icon examples', () => {
    it('should handle dashboard view icons', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('view-dashboard')).toBe('mdi mdi-view-dashboard');
      expect(normalizeIcon('mdi-view-dashboard')).toBe('mdi mdi-view-dashboard');
      expect(normalizeIcon('mdi:view-dashboard')).toBe('mdi mdi-view-dashboard');
    });

    it('should handle device control icons', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('thermometer')).toBe('mdi mdi-thermometer');
      expect(normalizeIcon('lightbulb')).toBe('mdi mdi-lightbulb');
      expect(normalizeIcon('power-plug')).toBe('mdi mdi-power-plug');
    });

    it('should handle room/area icons', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('sofa')).toBe('mdi mdi-sofa');
      expect(normalizeIcon('bed')).toBe('mdi mdi-bed');
      expect(normalizeIcon('door')).toBe('mdi mdi-door');
    });

    it('should handle weather icons', () => {
      const normalizeIcon = useNormalizeIcon();
      expect(normalizeIcon('weather-sunny')).toBe('mdi mdi-weather-sunny');
      expect(normalizeIcon('cloud')).toBe('mdi mdi-cloud');
      expect(normalizeIcon('mdi:weather-partly-cloudy')).toBe('mdi mdi-weather-partly-cloudy');
    });
  });
});
