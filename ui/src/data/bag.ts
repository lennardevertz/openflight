import { ALL_CLUBS, CLUBS_BY_TYPE, type Club } from './clubs';
import type { Profile } from '../types/profile';

/** A bag must fit the club picker on one screen without tabs: 4 columns x 4 rows. Matches the server. */
export const MAX_BAG_CLUBS = 16;

/** Bag order: longest club first (Driver, woods, hybrids, irons, wedges). */
const BAG_ORDER: string[] = [
  ...(CLUBS_BY_TYPE.Woods ?? []),
  ...(CLUBS_BY_TYPE.Hybrids ?? []),
  ...(CLUBS_BY_TYPE.Irons ?? []),
].map((club) => club.id);

const CLUBS_BY_ID = new Map(ALL_CLUBS.map((club) => [club.id, club]));

/** Known club ids only, no duplicates, in bag order, capped at {@link MAX_BAG_CLUBS}. */
export function cleanBag(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const ids = new Set(raw.filter((id): id is string => typeof id === 'string' && CLUBS_BY_ID.has(id)));
  return BAG_ORDER.filter((id) => ids.has(id)).slice(0, MAX_BAG_CLUBS);
}

/** The profile's bag as clubs. Empty when no bag is set, which means "all clubs". */
export function getProfileBag(profile: Profile | null | undefined): Club[] {
  return cleanBag(profile?.settings?.bag).map((id) => CLUBS_BY_ID.get(id)!);
}
