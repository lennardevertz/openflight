import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import type { Shot } from '../../types/shot';
import { LivePanel } from './LivePanel';

// SSR reads a store's initial state, so seed the saved layout at creation.
vi.mock('../../stores/useLiveLayoutStore', () => ({
  useLiveLayoutStore: create(() => ({
    layouts: { ball: { order: ['carry', 'ball_speed'], hidden: ['spin', 'spin_axis'] } },
    setLayout: () => {},
    resetLayout: () => {},
  })),
}));

const shot = {
  ball_speed_mph: 92,
  club_speed_mph: 68,
  smash_factor: 1.35,
  estimated_carry_yards: 210,
  carry_range: [205, 215],
  club: 'driver',
  timestamp: '2026-08-19T10:00:00Z',
  peak_magnitude: 100,
  launch_angle_vertical: 13.4,
  launch_angle_horizontal: -1.2,
  launch_angle_confidence: 0.8,
  angle_source: 'radar',
  club_angle_deg: 2.1,
  club_path_deg: -0.6,
  spin_axis_deg: 3.4,
  spin_rpm: 2650,
  spin_confidence: 0.9,
  spin_quality: 'high',
  spin_source: 'measured',
  spin_method: null,
  carry_spin_adjusted: 214,
  profile_id: 'james',
  profile_name: 'James',
} as Shot;

describe('LivePanel tile layout', () => {
  it('shows saved tiles in saved order and offers Edit tiles', () => {
    const html = renderToString(
      <LivePanel shot={shot} shots={[shot]} profileId="james" profileName="James" clubLabel="DR" />
    );
    const labels = [...html.matchAll(/metric-card__label[^>]*>([^<]+)/g)].map((match) => match[1]);

    expect(html).toContain('live-panel__grid--of-8');
    expect(html).toContain('grid-template-columns:repeat(4, 1fr)');
    expect(labels.slice(0, 2)).toEqual(['Carry', 'Ball speed']);
    expect(labels).not.toContain('Spin');
    expect(labels).not.toContain('Spin axis');
    expect(html).toContain('Edit tiles');
  });
});
