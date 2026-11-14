import { describe, expect, it } from 'vitest';
import { cleanBag, getProfileBag, MAX_BAG_CLUBS } from './bag';
import { ALL_CLUBS } from './clubs';

describe('bag', () => {
  it('keeps known clubs once, longest club first', () => {
    expect(cleanBag(['pw', '7-iron', 'driver', 'banana', 'pw', 7, '3-hybrid'])).toEqual([
      'driver',
      '3-hybrid',
      '7-iron',
      'pw',
    ]);
  });

  it('caps the bag at one picker screen', () => {
    expect(cleanBag(ALL_CLUBS.map((club) => club.id))).toHaveLength(MAX_BAG_CLUBS);
    expect(MAX_BAG_CLUBS).toBe(16);
  });

  it('treats a missing or malformed bag as empty', () => {
    expect(cleanBag(undefined)).toEqual([]);
    expect(cleanBag('driver')).toEqual([]);
    expect(getProfileBag(null)).toEqual([]);
    expect(getProfileBag({ id: 'a', name: 'A', created_at: '', settings: { bag: 'driver' } })).toEqual([]);
  });

  it('reads the bag from profile settings as clubs', () => {
    const bag = getProfileBag({ id: 'a', name: 'A', created_at: '', settings: { bag: ['sw', 'driver'] } });
    expect(bag.map((club) => club.label)).toEqual(['DR', 'SW']);
  });
});
