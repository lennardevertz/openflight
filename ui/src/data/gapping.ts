import { ALL_CLUBS, CLUBS_BY_TYPE } from './clubs';

export interface GappingShot {
  club: string;
  estimated_carry_yards: number;
  carry_spin_adjusted?: number | null;
}

export interface ClubGap {
  club: string;
  label: string;
  count: number;
  /** Carry in yards. */
  avgCarry: number;
  minCarry: number;
  maxCarry: number;
  /** Average carry minus the next shorter club's average; null for the shortest. */
  gapToNext: number | null;
}

const LONGEST_FIRST = [
  ...(CLUBS_BY_TYPE.Woods ?? []),
  ...(CLUBS_BY_TYPE.Hybrids ?? []),
  ...(CLUBS_BY_TYPE.Irons ?? []),
];
const LABELS = new Map(ALL_CLUBS.map((club) => [club.id, club.label]));

/** Carry the Live table shows: spin-adjusted when available, else the estimate. */
export function shotCarry(shot: GappingShot): number {
  return shot.carry_spin_adjusted ?? shot.estimated_carry_yards;
}

/**
 * Per-club carry summary, longest club first. Clubs without shots are
 * skipped; unknown club ids go last in first-seen order.
 */
export function computeGapping(shots: ReadonlyArray<GappingShot>): ClubGap[] {
  const carries = new Map<string, number[]>();
  for (const shot of shots) {
    const carry = shotCarry(shot);
    if (!Number.isFinite(carry)) continue;
    const list = carries.get(shot.club) ?? [];
    list.push(carry);
    carries.set(shot.club, list);
  }
  const known = LONGEST_FIRST.map((club) => club.id).filter((id) => carries.has(id));
  const unknown = [...carries.keys()].filter((id) => !LABELS.has(id));
  const rows = [...known, ...unknown].map((club) => {
    const list = carries.get(club)!;
    return {
      club,
      label: LABELS.get(club) ?? club.toUpperCase(),
      count: list.length,
      avgCarry: list.reduce((sum, value) => sum + value, 0) / list.length,
      minCarry: Math.min(...list),
      maxCarry: Math.max(...list),
      gapToNext: null as number | null,
    };
  });
  for (let index = 0; index < rows.length - 1; index += 1) {
    rows[index].gapToNext = rows[index].avgCarry - rows[index + 1].avgCarry;
  }
  return rows;
}
