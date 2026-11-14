import { getHtmlLang, t } from '../i18n';
import {
  LAUNCH_ABOVE,
  LAUNCH_BELOW,
  SMASH_TOLERANCE,
  SPIN_TOLERANCE,
  STRAIGHT_DEG,
  TOUR_BENCHMARKS,
} from './benchmarks';

export type GuidanceStatus = 'good' | 'low' | 'high' | 'off';

export interface MetricGuidance {
  status: GuidanceStatus;
  /** Short line under the value, e.g. "Target 8-14°" or "3.1° right". */
  text: string;
}

function fmt(value: number, digits = 0): string {
  return value.toLocaleString(getHtmlLang(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function inBand(value: number, low: number, high: number): GuidanceStatus {
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'good';
}

export function smashGuidance(value: number | null, club: string): MetricGuidance | undefined {
  const benchmark = TOUR_BENCHMARKS[club];
  if (value === null || !benchmark) return undefined;
  const floor = benchmark.smash - SMASH_TOLERANCE;
  return { status: value >= floor ? 'good' : 'low', text: t('guide.targetMin', { value: fmt(floor, 2) }) };
}

export function launchGuidance(value: number | null, club: string): MetricGuidance | undefined {
  const benchmark = TOUR_BENCHMARKS[club];
  if (value === null || !benchmark) return undefined;
  const low = benchmark.launch - LAUNCH_BELOW;
  const high = benchmark.launch + LAUNCH_ABOVE;
  return {
    status: inBand(value, low, high),
    text: t('guide.targetRange', { low: fmt(low), high: fmt(high), unit: '°' }),
  };
}

export function spinGuidance(value: number | null, club: string): MetricGuidance | undefined {
  const benchmark = TOUR_BENCHMARKS[club];
  if (value === null || !benchmark) return undefined;
  const round = (rpm: number) => Math.round(rpm / 100) * 100;
  const low = round(benchmark.spin * (1 - SPIN_TOLERANCE));
  const high = round(benchmark.spin * (1 + SPIN_TOLERANCE));
  return {
    status: inBand(value, low, high),
    text: t('guide.targetRange', { low: fmt(low), high: fmt(high), unit: '' }),
  };
}

/** Start line, spin axis or club path: near zero is straight, otherwise name the side. */
export function directionGuidance(value: number | null): MetricGuidance | undefined {
  if (value === null) return undefined;
  if (Math.abs(value) <= STRAIGHT_DEG) return { status: 'good', text: t('guide.straight') };
  return {
    status: 'off',
    text: t(value > 0 ? 'guide.right' : 'guide.left', { value: fmt(Math.abs(value), 1) }),
  };
}

/** Club path names in-to-out (positive) or out-to-in (negative). */
export function pathGuidance(value: number | null): MetricGuidance | undefined {
  if (value === null) return undefined;
  if (Math.abs(value) <= STRAIGHT_DEG) return { status: 'good', text: t('guide.straight') };
  return { status: 'off', text: t(value > 0 ? 'guide.inToOut' : 'guide.outToIn') };
}

/** Driver wants to be hit level or up; every other club down on the ball. */
export function attackGuidance(value: number | null, club: string): MetricGuidance | undefined {
  if (value === null) return undefined;
  if (club === 'driver') {
    return { status: value >= 0 ? 'good' : 'low', text: t('guide.hitUp') };
  }
  return { status: value <= 0 ? 'good' : 'high', text: t('guide.hitDown') };
}
