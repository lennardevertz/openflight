/**
 * Per-club reference values: TrackMan PGA Tour averages (2023 data, published
 * May 2024, https://www.trackman.com/blog/introducing-updated-tour-averages).
 * TrackMan publishes one hybrid row, used for every hybrid. Clubs it does not
 * cover (2-iron, 7-wood, GW, SW, LW) get no guidance rather than a guess.
 */
export interface ClubBenchmark {
  smash: number;
  /** Launch angle, degrees. */
  launch: number;
  /** Spin rate, rpm. */
  spin: number;
}

const HYBRID: ClubBenchmark = { smash: 1.47, launch: 10.2, spin: 4587 };

export const TOUR_BENCHMARKS: Readonly<Record<string, ClubBenchmark>> = {
  driver: { smash: 1.49, launch: 10.4, spin: 2545 },
  '3-wood': { smash: 1.47, launch: 9.3, spin: 3663 },
  '5-wood': { smash: 1.47, launch: 9.7, spin: 4322 },
  '3-hybrid': HYBRID,
  '5-hybrid': HYBRID,
  '7-hybrid': HYBRID,
  '9-hybrid': HYBRID,
  '3-iron': { smash: 1.46, launch: 10.3, spin: 4404 },
  '4-iron': { smash: 1.44, launch: 10.8, spin: 4782 },
  '5-iron': { smash: 1.41, launch: 11.9, spin: 5280 },
  '6-iron': { smash: 1.39, launch: 14.0, spin: 6204 },
  '7-iron': { smash: 1.34, launch: 16.1, spin: 7124 },
  '8-iron': { smash: 1.33, launch: 17.8, spin: 8078 },
  '9-iron': { smash: 1.29, launch: 20.0, spin: 8793 },
  pw: { smash: 1.24, launch: 23.7, spin: 9316 },
};

/*
 * Bands around the tour value. These are OpenFlight's choice, sized for
 * amateurs: slower swings launch higher (TrackMan's average male amateur
 * launches the driver 12.6 deg against the tour's 10.4), and strike quality
 * a little under tour level is still good contact.
 */
export const SMASH_TOLERANCE = 0.05;
export const LAUNCH_BELOW = 2;
export const LAUNCH_ABOVE = 4;
export const SPIN_TOLERANCE = 0.25;
/** Start line, spin axis and club path within this many degrees count as straight. */
export const STRAIGHT_DEG = 2;
