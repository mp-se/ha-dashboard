/**
 * Composable for energy chart data management and calculations
 * Handles chart dimensions, statistics, and data transformations
 */

import { computed, ref, ComputedRef, Ref } from "vue";

/**
 * Chart dimensions constants
 */
export const CHART_WIDTH = 400;
export const CHART_HEIGHT = 200;

interface ChartDataPoint {
  value: number;
}

interface ChartStats {
  max: number;
  min: number;
  avg: number;
  total: number;
  comparison: number | null;
}

interface EnergyChartReturn {
  hoveredIndex: Ref<number>;
  stats: ComputedRef<ChartStats>;
  maxValue: ComputedRef<number>;
  labelStep: ComputedRef<number>;
  tooltipStyle: ComputedRef<Record<string, string>>;
  chartWidth: number;
  chartHeight: number;
}

import { formatKValue } from "@/utils/attributeFormatters";

/**
 * Format a value for display
 * @param value - Value to format
 * @returns Formatted value
 */
export function formatValue(value: number): string {
  return formatKValue(value);
}

/**
 * Format Y-axis label (with k abbreviation)
 * @param value - Value to format
 * @returns Formatted label
 */
export function formatYAxisLabel(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toFixed(0);
}

/**
 * Calculate statistics from chart data
 * @param chartData - Current period data
 * @param prevChartData - Previous period data for comparison
 * @returns Statistics object
 */
export function calculateStats(
  chartData: ChartDataPoint[],
  prevChartData: ChartDataPoint[],
): ChartStats {
  if (chartData.length === 0) {
    return { max: 0, min: 0, avg: 0, total: 0, comparison: null };
  }

  const values = chartData.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const total = values.reduce((a, b) => a + b, 0);

  // Calculate comparison vs previous period
  let comparison: number | null = null;
  if (prevChartData.length > 0) {
    const prevTotal = prevChartData.reduce((a, b) => a + b.value, 0);
    if (prevTotal > 0) {
      comparison = Math.round(((total - prevTotal) / prevTotal) * 1000) / 10;
    }
  }

  return {
    max: Math.round(max * 100) / 100,
    min: Math.round(min * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    total: Math.round(total * 100) / 100,
    comparison,
  };
}

/**
 * Calculate maximum Y-axis value (rounded to nice number)
 * @param maxValue - Maximum data value
 * @returns Scaled max value for Y-axis
 */
export function calculateMaxValue(maxValue: number): number {
  if (maxValue === 0) return 1;
  // Round up to nearest "nice" number
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
  return Math.ceil(maxValue / magnitude) * magnitude;
}

/**
 * Calculate label step for X-axis to avoid crowding
 * @param dataLength - Number of data points
 * @returns Step value for labels
 */
export function calculateLabelStep(dataLength: number): number {
  if (dataLength <= 12) return 1;
  if (dataLength <= 24) return 2;
  return Math.ceil(dataLength / 12);
}

/**
 * Composable for energy chart management
 * @param chartData - Chart data array
 * @param prevChartData - Previous period data
 * @returns Chart utilities and computed values
 */
export function useEnergyChart(
  chartData: Ref<ChartDataPoint[]>,
  prevChartData: Ref<ChartDataPoint[]>,
): EnergyChartReturn {
  const hoveredIndex = ref(-1);

  /**
   * Calculate statistics from current and previous data
   */
  const stats = computed(() =>
    calculateStats(chartData.value, prevChartData.value),
  );

  /**
   * Maximum value for Y-axis scaling
   */
  const maxValue = computed(() => calculateMaxValue(stats.value.max));

  /**
   * Label step for X-axis
   */
  const labelStep = computed(() => calculateLabelStep(chartData.value.length));

  /**
   * Tooltip positioning based on hovered bar
   */
  const tooltipStyle = computed(() => {
    if (hoveredIndex.value < 0) return {};

    const barWidth = (CHART_WIDTH - 30) / chartData.value.length;
    const barX =
      25 +
      (hoveredIndex.value * (CHART_WIDTH - 30)) / chartData.value.length +
      barWidth * 0.5;
    const percentage = (barX / CHART_WIDTH) * 100;

    return {
      left: `${percentage}%`,
    };
  });

  return {
    hoveredIndex,
    stats,
    maxValue,
    labelStep,
    tooltipStyle,
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
  };
}
