import { describe, it, expect, beforeEach } from "vitest";
import { ref } from "vue";
import {
  formatValue,
  formatYAxisLabel,
  calculateStats,
  calculateMaxValue,
  calculateLabelStep,
  useEnergyChart,
} from "../useEnergyChart";

describe("useEnergyChart", () => {
  describe("formatValue", () => {
    it("should format values less than 1000 with 1 decimal", () => {
      expect(formatValue(0)).toBe("0.0");
      expect(formatValue(50.5)).toBe("50.5");
      expect(formatValue(999.9)).toBe("999.9");
    });

    it("should format values >= 1000 with k suffix", () => {
      expect(formatValue(1000)).toBe("1.0k");
      expect(formatValue(1500)).toBe("1.5k");
      expect(formatValue(2345)).toBe("2.3k");
      expect(formatValue(9999)).toBe("10.0k");
    });

    it("should handle zero", () => {
      expect(formatValue(0)).toBe("0.0");
    });

    it("should handle negative values", () => {
      expect(formatValue(-50)).toBe("-50.0");
      // Note: formatValue doesn't handle negative thousands correctly
      expect(formatValue(-1500)).toBe("-1500.0");
    });

    it("should round to 1 decimal place", () => {
      expect(formatValue(123.456)).toBe("123.5");
      expect(formatValue(1234.56)).toBe("1.2k");
    });
  });

  describe("formatYAxisLabel", () => {
    it("should format values less than 1000 as rounded integers", () => {
      expect(formatYAxisLabel(0)).toBe("0");
      expect(formatYAxisLabel(50.7)).toBe("51");
      expect(formatYAxisLabel(999.4)).toBe("999");
    });

    it("should format values >= 1000 with k suffix", () => {
      expect(formatYAxisLabel(1000)).toBe("1k");
      expect(formatYAxisLabel(1500)).toBe("2k");
      expect(formatYAxisLabel(2345)).toBe("2k");
      expect(formatYAxisLabel(9999)).toBe("10k");
    });

    it("should handle zero", () => {
      expect(formatYAxisLabel(0)).toBe("0");
    });

    it("should round to nearest integer for k values", () => {
      expect(formatYAxisLabel(1234)).toBe("1k");
      expect(formatYAxisLabel(1567)).toBe("2k");
    });

    it("should handle negative values", () => {
      expect(formatYAxisLabel(-50)).toBe("-50");
      // Note: formatYAxisLabel doesn't handle negative thousands correctly
      expect(formatYAxisLabel(-1500)).toBe("-1500");
    });
  });

  describe("calculateStats", () => {
    it("should calculate stats for positive values", () => {
      const data = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
        { value: 300, label: "3" },
      ];

      const stats = calculateStats(data, []);

      expect(stats.total).toBe(600);
      expect(stats.avg).toBe(200);
      expect(stats.max).toBe(300);
      expect(stats.min).toBe(100);
      expect(stats.comparison).toBeNull();
    });

    it("should handle empty data", () => {
      const stats = calculateStats([], []);

      expect(stats.total).toBe(0);
      expect(stats.avg).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.comparison).toBeNull();
    });

    it("should handle single value", () => {
      const data = [{ value: 150, label: "1" }];

      const stats = calculateStats(data, []);

      expect(stats.total).toBe(150);
      expect(stats.avg).toBe(150);
      expect(stats.max).toBe(150);
      expect(stats.min).toBe(150);
    });

    it("should calculate comparison with previous data", () => {
      const currentData = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
      ];
      const prevData = [
        { value: 50, label: "1" },
        { value: 100, label: "2" },
      ];

      const stats = calculateStats(currentData, prevData);

      // Current total: 300, Previous total: 150
      // Comparison: ((300 - 150) / 150) * 100 = 100%
      expect(stats.comparison).toBe(100);
    });

    it("should calculate negative comparison when consumption decreased", () => {
      const currentData = [
        { value: 50, label: "1" },
        { value: 100, label: "2" },
      ];
      const prevData = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
      ];

      const stats = calculateStats(currentData, prevData);

      // Current total: 150, Previous total: 300
      // Comparison: ((150 - 300) / 300) * 100 = -50%
      expect(stats.comparison).toBe(-50);
    });

    it("should return null comparison when previous data is empty", () => {
      const currentData = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
      ];

      const stats = calculateStats(currentData, []);

      expect(stats.comparison).toBeNull();
    });

    it("should return null comparison when previous total is zero", () => {
      const currentData = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
      ];
      const prevData = [
        { value: 0, label: "1" },
        { value: 0, label: "2" },
      ];

      const stats = calculateStats(currentData, prevData);

      expect(stats.comparison).toBeNull();
    });

    it("should handle floating point values", () => {
      const data = [
        { value: 12.5, label: "1" },
        { value: 25.75, label: "2" },
        { value: 37.2, label: "3" },
      ];

      const stats = calculateStats(data, []);

      expect(stats.total).toBeCloseTo(75.45, 1);
      expect(stats.avg).toBeCloseTo(25.15, 1);
    });

    it("should round comparison to nearest integer", () => {
      const currentData = [{ value: 105, label: "1" }];
      const prevData = [{ value: 100, label: "1" }];

      const stats = calculateStats(currentData, prevData);

      expect(stats.comparison).toBe(5);
      expect(Number.isInteger(stats.comparison)).toBe(true);
    });

    it("should find correct max value", () => {
      const data = [
        { value: 50, label: "1" },
        { value: 500, label: "2" },
        { value: 100, label: "3" },
      ];

      const stats = calculateStats(data, []);

      expect(stats.max).toBe(500);
    });

    it("should find correct min value", () => {
      const data = [
        { value: 50, label: "1" },
        { value: 5, label: "2" },
        { value: 100, label: "3" },
      ];

      const stats = calculateStats(data, []);

      expect(stats.min).toBe(5);
    });
  });

  describe("calculateMaxValue", () => {
    it("should round to nice number", () => {
      // Max is 300, magnitude is 100, ceil(300/100) * 100 = 300
      expect(calculateMaxValue(300)).toBe(300);
    });

    it("should return 1 for zero", () => {
      expect(calculateMaxValue(0)).toBe(1);
    });

    it("should handle single value", () => {
      // 100, magnitude 100, ceil(100/100) * 100 = 100
      expect(calculateMaxValue(100)).toBe(100);
    });

    it("should round up to nice number", () => {
      // 250, magnitude 100, ceil(250/100) * 100 = 300
      expect(calculateMaxValue(250)).toBe(300);
    });

    it("should handle large values", () => {
      // 1000, magnitude 1000, ceil(1000/1000) * 1000 = 1000
      expect(calculateMaxValue(1000)).toBe(1000);
    });

    it("should handle floating point values", () => {
      // 37.2, magnitude 10, ceil(37.2/10) * 10 = 40
      expect(calculateMaxValue(37.2)).toBe(40);
    });
  });

  describe("calculateLabelStep", () => {
    it("should return 1 for 12 or fewer data points", () => {
      expect(calculateLabelStep(5)).toBe(1);
      expect(calculateLabelStep(10)).toBe(1);
      expect(calculateLabelStep(12)).toBe(1);
    });

    it("should return 2 for 13-24 data points", () => {
      expect(calculateLabelStep(13)).toBe(2);
      expect(calculateLabelStep(15)).toBe(2);
      expect(calculateLabelStep(20)).toBe(2);
      expect(calculateLabelStep(24)).toBe(2);
    });

    it("should calculate step for more than 24 data points", () => {
      expect(calculateLabelStep(25)).toBe(3); // ceil(25/12) = 3
      expect(calculateLabelStep(30)).toBe(3); // ceil(30/12) = 3
      expect(calculateLabelStep(36)).toBe(3); // ceil(36/12) = 3
      expect(calculateLabelStep(37)).toBe(4); // ceil(37/12) = 4
      expect(calculateLabelStep(50)).toBe(5); // ceil(50/12) = 5
      expect(calculateLabelStep(100)).toBe(9); // ceil(100/12) = 9
    });

    it("should handle zero data points", () => {
      expect(calculateLabelStep(0)).toBe(1);
    });

    it("should handle negative values (edge case)", () => {
      expect(calculateLabelStep(-5)).toBe(1);
    });
  });

  describe("useEnergyChart composable", () => {
    let chartData, prevChartData;
    const chartWidth = 400;
    const chartHeight = 200;

    beforeEach(() => {
      chartData = ref([]);
      prevChartData = ref([]);
    });

    it("should initialize with default values", () => {
      const result = useEnergyChart(chartData, prevChartData);

      expect(result.hoveredIndex.value).toBe(-1);
      expect(result.stats.value.total).toBe(0);
      expect(result.maxValue.value).toBe(1);
      expect(result.labelStep.value).toBe(1);
      expect(result.chartWidth).toBe(chartWidth);
      expect(result.chartHeight).toBe(chartHeight);
    });

    it("should calculate stats reactively", () => {
      const result = useEnergyChart(chartData, prevChartData);

      chartData.value = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
        { value: 300, label: "3" },
      ];

      expect(result.stats.value.total).toBe(600);
      expect(result.stats.value.avg).toBe(200);
      expect(result.stats.value.max).toBe(300);
    });

    it("should calculate maxValue reactively", () => {
      const result = useEnergyChart(chartData, prevChartData);

      chartData.value = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
      ];

      // stats.max = 200, calculateMaxValue(200) = 200
      expect(result.maxValue.value).toBe(200);
    });

    it("should calculate labelStep based on data length", () => {
      const result = useEnergyChart(chartData, prevChartData);

      // 5 points: <= 12 -> step 1
      chartData.value = Array(5)
        .fill(0)
        .map((_, i) => ({ value: i * 10, label: `${i}` }));
      expect(result.labelStep.value).toBe(1);

      // 15 points: 13-24 -> step 2
      chartData.value = Array(15)
        .fill(0)
        .map((_, i) => ({ value: i * 10, label: `${i}` }));
      expect(result.labelStep.value).toBe(2);

      // 25 points: ceil(25/12) = 3
      chartData.value = Array(25)
        .fill(0)
        .map((_, i) => ({ value: i * 10, label: `${i}` }));
      expect(result.labelStep.value).toBe(3);

      // 35 points: ceil(35/12) = 3
      chartData.value = Array(35)
        .fill(0)
        .map((_, i) => ({ value: i * 10, label: `${i}` }));
      expect(result.labelStep.value).toBe(3);
    });

    it("should calculate comparison with previous data", () => {
      const result = useEnergyChart(chartData, prevChartData);

      chartData.value = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
      ];
      prevChartData.value = [
        { value: 50, label: "1" },
        { value: 100, label: "2" },
      ];

      expect(result.stats.value.comparison).toBe(100); // 100% increase
    });

    it("should update hoveredIndex", () => {
      const result = useEnergyChart(chartData, prevChartData);

      expect(result.hoveredIndex.value).toBe(-1);

      result.hoveredIndex.value = 2;
      expect(result.hoveredIndex.value).toBe(2);
    });

    it("should calculate tooltipStyle for hovered bar", () => {
      const result = useEnergyChart(chartData, prevChartData);

      chartData.value = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
        { value: 300, label: "3" },
      ];

      result.hoveredIndex.value = 1; // Hover over second bar

      const style = result.tooltipStyle.value;
      expect(style).toHaveProperty("left");
      expect(style.left).toContain("%");
    });

    it("should return empty tooltipStyle when not hovering", () => {
      const result = useEnergyChart(chartData, prevChartData);

      chartData.value = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
      ];

      const style = result.tooltipStyle.value;
      expect(style).toEqual({});
    });

    it("should calculate tooltipStyle position correctly", () => {
      const result = useEnergyChart(chartData, prevChartData);

      chartData.value = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
        { value: 300, label: "3" },
      ];

      result.hoveredIndex.value = 0; // First bar

      const style = result.tooltipStyle.value;
      const leftPercent = parseFloat(style.left);

      // First bar should be near the left
      expect(leftPercent).toBeGreaterThan(0);
      expect(leftPercent).toBeLessThan(50);
    });

    it("should update tooltipStyle when hoveredIndex changes", () => {
      const result = useEnergyChart(chartData, prevChartData);

      chartData.value = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
        { value: 300, label: "3" },
      ];

      result.hoveredIndex.value = 0;
      const firstStyle = result.tooltipStyle.value;

      result.hoveredIndex.value = 2;
      const lastStyle = result.tooltipStyle.value;

      // The tooltip should move right
      expect(parseFloat(lastStyle.left)).toBeGreaterThan(
        parseFloat(firstStyle.left),
      );
    });

    it("should handle empty chartData with invalid calculation", () => {
      const result = useEnergyChart(chartData, prevChartData);

      result.hoveredIndex.value = 0;

      // When chartData is empty, division by zero causes NaN in percentage
      expect(result.tooltipStyle.value).toEqual({ left: "NaN%" });
    });

    it("should handle hoveredIndex out of bounds", () => {
      const result = useEnergyChart(chartData, prevChartData);

      chartData.value = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
      ];

      result.hoveredIndex.value = 10; // Out of bounds

      // Should handle gracefully
      expect(result.tooltipStyle.value).toHaveProperty("left");
    });

    it("should provide immutable chartWidth and chartHeight", () => {
      const result = useEnergyChart(chartData, prevChartData);

      expect(result.chartWidth).toBe(400);
      expect(result.chartHeight).toBe(200);

      // These should not be reactive refs
      expect(typeof result.chartWidth).toBe("number");
      expect(typeof result.chartHeight).toBe("number");
    });

    it("should recalculate all computed values when data changes", () => {
      const result = useEnergyChart(chartData, prevChartData);

      // Initial data
      chartData.value = [
        { value: 100, label: "1" },
        { value: 200, label: "2" },
      ];

      const initialMax = result.maxValue.value;
      const initialStats = result.stats.value.total;

      // Change data
      chartData.value = [
        { value: 500, label: "1" },
        { value: 600, label: "2" },
      ];

      expect(result.maxValue.value).toBeGreaterThan(initialMax);
      expect(result.stats.value.total).toBeGreaterThan(initialStats);
    });

    it("should handle data points with zero values", () => {
      const result = useEnergyChart(chartData, prevChartData);

      chartData.value = [
        { value: 0, label: "1" },
        { value: 0, label: "2" },
        { value: 100, label: "3" },
      ];

      expect(result.stats.value.min).toBe(0);
      expect(result.stats.value.max).toBe(100);
      expect(result.maxValue.value).toBe(100); // calculateMaxValue(100) = 100
    });
  });
});
