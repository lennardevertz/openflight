import { describe, expect, it } from 'vitest';
import { computeGapping } from './gapping';

describe('computeGapping', () => {
  it('summarizes carry per club, longest first, with the gap to the next club', () => {
    const rows = computeGapping([
      { club: '7-iron', estimated_carry_yards: 140 },
      { club: 'driver', estimated_carry_yards: 230, carry_spin_adjusted: 220 },
      { club: '7-iron', estimated_carry_yards: 150 },
      { club: 'driver', estimated_carry_yards: 240 },
    ]);

    expect(rows.map((row) => row.label)).toEqual(['DR', '7i']);
    expect(rows[0]).toMatchObject({ count: 2, avgCarry: 230, minCarry: 220, maxCarry: 240, gapToNext: 85 });
    expect(rows[1]).toMatchObject({ count: 2, avgCarry: 145, gapToNext: null });
  });

  it('is empty without shots', () => {
    expect(computeGapping([])).toEqual([]);
  });
});
