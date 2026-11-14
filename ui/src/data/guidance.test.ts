import { afterEach, describe, expect, it } from 'vitest';
import { setActiveLocale } from '../i18n';
import {
  attackGuidance,
  directionGuidance,
  launchGuidance,
  pathGuidance,
  smashGuidance,
  spinGuidance,
} from './guidance';

describe('metric guidance', () => {
  afterEach(() => setActiveLocale('en'));

  it('rates smash factor against the club, never too high', () => {
    expect(smashGuidance(1.46, 'driver')).toEqual({ status: 'good', text: 'Target 1.44+' });
    expect(smashGuidance(1.38, 'driver')?.status).toBe('low');
    expect(smashGuidance(1.3, '7-iron')?.status).toBe('good');
    expect(smashGuidance(1.6, 'driver')?.status).toBe('good');
  });

  it('rates launch and spin inside a band around the tour value', () => {
    expect(launchGuidance(12.6, 'driver')).toEqual({ status: 'good', text: 'Target 8-14°' });
    expect(launchGuidance(7, 'driver')?.status).toBe('low');
    expect(launchGuidance(30, '7-iron')?.status).toBe('high');
    expect(spinGuidance(3100, 'driver')).toEqual({ status: 'good', text: 'Target 1,900-3,200' });
    expect(spinGuidance(4000, 'driver')?.status).toBe('high');
  });

  it('gives no target for clubs without reference data or missing values', () => {
    expect(smashGuidance(1.2, 'lw')).toBeUndefined();
    expect(launchGuidance(null, 'driver')).toBeUndefined();
  });

  it('names directions instead of signs', () => {
    expect(directionGuidance(1.5)).toEqual({ status: 'good', text: 'Straight' });
    expect(directionGuidance(3.1)).toEqual({ status: 'off', text: '3.1° right' });
    expect(directionGuidance(-4)).toEqual({ status: 'off', text: '4.0° left' });
    expect(pathGuidance(4)?.text).toBe('In-to-out');
    expect(pathGuidance(-4)?.text).toBe('Out-to-in');
  });

  it('wants the driver hit up and irons hit down', () => {
    expect(attackGuidance(2, 'driver')?.status).toBe('good');
    expect(attackGuidance(-3, 'driver')?.status).toBe('low');
    expect(attackGuidance(-4, '7-iron')?.status).toBe('good');
    expect(attackGuidance(1, '7-iron')?.status).toBe('high');
  });

  it('translates the text', () => {
    setActiveLocale('de');
    expect(launchGuidance(12, 'driver')?.text).toBe('Ziel 8-14°');
    expect(directionGuidance(3.1)?.text).toBe('3,1° rechts');
  });
});
