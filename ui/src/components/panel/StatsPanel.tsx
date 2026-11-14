import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Shot } from '../../types/shot';
import {
  computeStats,
  computeSwingSpeedStats,
  filterShotsByProfile,
  getUniqueClubs,
  isSwingSpeedShot,
} from '../../types/shot';
import { computeGapping } from '../../data/gapping';
import { useDragScroll } from '../../hooks/useDragScroll';
import { useHistoryStore } from '../../stores/useHistoryStore';
import { useUnitPreference } from '../../state/useUnitPreference';
import { useI18n } from '../../i18n/useI18n';
import { formatDistance, formatSpeed, getDistanceUnit, getSpeedUnit } from '../../utils/units';
import { MetricCard } from '../ui/MetricCard';
import { PanelAction } from './PanelAction';
import { PanelHeader } from './PanelHeader';

interface StatsPanelProps {
  shots: Shot[];
  activeClub: string;
  profileId: string;
  profileName: string;
  /** Pinned header control, e.g. Clear session. */
  headerAction?: ReactNode;
  /** Ask the server for this profile's logged history (History and Gapping views). */
  onRequestHistory?: () => void;
}

export type StatsScope = 'session' | 'history' | 'gapping';

interface StatTile {
  id: string;
  label: string;
  value: string;
  unit?: string;
}

/**
 * Design doc 7a: session summary as a hairline tile grid, with the per-club
 * filter chips above the tiles. Six tiles for a ball-strike session (3x2 as
 * drawn), four for a swing-speed one.
 */
export function StatsPanel({
  shots,
  activeClub,
  profileId,
  profileName,
  headerAction,
  onRequestHistory,
}: StatsPanelProps) {
  const { t } = useI18n();
  const [scope, setScope] = useState<StatsScope>('session');
  const sessionShots = useMemo(() => filterShotsByProfile(shots, profileId), [shots, profileId]);
  const historyProfileId = useHistoryStore((state) => state.profileId);
  const historyAll = useHistoryStore((state) => state.shots);
  const historyLoaded = useHistoryStore((state) => state.loaded);
  const sessionCount = useHistoryStore((state) => state.sessionCount);
  const historyShots = useMemo(
    () => (historyProfileId === profileId ? historyAll.filter((shot) => shot.profile_id === profileId) : []),
    [historyAll, historyProfileId, profileId]
  );
  // Refresh the history when it is shown, and after every new shot while shown.
  useEffect(() => {
    if (scope !== 'session') onRequestHistory?.();
  }, [scope, profileId, sessionShots.length, onRequestHistory]);
  const profileShots = scope === 'session' ? sessionShots : historyShots;
  const hasShotsForActiveClub = profileShots.some((shot) => shot.club === activeClub);
  const [selectedClub, setSelectedClub] = useState<string | null>(hasShotsForActiveClub ? activeClub : null);
  const [prevActiveClub, setPrevActiveClub] = useState(activeClub);
  const [prevProfileId, setPrevProfileId] = useState(profileId);
  const chipRef = useRef<HTMLDivElement>(null);
  const chipScroll = useDragScroll(chipRef, 'x');

  // Update state during render when the prop changes, rather than in an effect.
  if (activeClub !== prevActiveClub || profileId !== prevProfileId) {
    setPrevActiveClub(activeClub);
    setPrevProfileId(profileId);
    setSelectedClub(hasShotsForActiveClub ? activeClub : null);
  }

  const { unitSystem } = useUnitPreference();
  const speedUnit = getSpeedUnit(unitSystem);
  const distanceUnit = getDistanceUnit(unitSystem);

  const availableClubs = useMemo(() => getUniqueClubs(profileShots), [profileShots]);
  const clubCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const shot of profileShots) {
      counts[shot.club] = (counts[shot.club] ?? 0) + 1;
    }
    return counts;
  }, [profileShots]);

  const filteredShots = useMemo(
    () => (selectedClub === null ? profileShots : profileShots.filter((shot) => shot.club === selectedClub)),
    [profileShots, selectedClub]
  );

  const stats = useMemo(() => computeStats(filteredShots), [filteredShots]);
  const swingStats = useMemo(() => computeSwingSpeedStats(filteredShots as Shot[]), [filteredShots]);
  const isSwingSpeedSession =
    scope === 'session' && filteredShots.length > 0 && (filteredShots as Shot[]).every(isSwingSpeedShot);

  const tiles: StatTile[] = useMemo(() => {
    if (isSwingSpeedSession) {
      return [
        { id: 'count', label: t('metric.swings'), value: String(swingStats.count) },
        {
          id: 'last',
          label: t('stats.last'),
          value: formatSpeed(swingStats.last_speed_mph, unitSystem, 1),
          unit: speedUnit,
        },
        {
          id: 'best',
          label: t('metric.best'),
          value: formatSpeed(swingStats.best_speed_mph, unitSystem, 1),
          unit: speedUnit,
        },
        {
          id: 'avg',
          label: t('metric.average'),
          value: formatSpeed(swingStats.avg_speed_mph, unitSystem, 1),
          unit: speedUnit,
        },
      ];
    }

    return [
      { id: 'count', label: t('stats.shots'), value: String(stats.shot_count) },
      {
        id: 'avg_ball',
        label: t('stats.avgBall'),
        value: formatSpeed(stats.avg_ball_speed, unitSystem, 1),
        unit: speedUnit,
      },
      {
        id: 'max_ball',
        label: t('stats.maxBall'),
        value: formatSpeed(stats.max_ball_speed, unitSystem, 1),
        unit: speedUnit,
      },
      {
        id: 'avg_carry',
        label: t('stats.avgCarry'),
        value: formatDistance(stats.avg_carry_est, unitSystem, 0),
        unit: distanceUnit,
      },
      {
        id: 'avg_club',
        label: t('stats.avgClub'),
        value: stats.avg_club_speed === null ? '—' : formatSpeed(stats.avg_club_speed, unitSystem, 1),
        unit: stats.avg_club_speed === null ? undefined : speedUnit,
      },
      {
        id: 'avg_smash',
        label: t('stats.avgSmash'),
        value: stats.avg_smash_factor === null ? '—' : stats.avg_smash_factor.toFixed(2),
      },
    ];
  }, [isSwingSpeedSession, stats, swingStats, unitSystem, speedUnit, distanceUnit, t]);

  const clubFilters = (
    <div className="stats-panel__chips" role="group" aria-label={t('stats.filterByClub')}>
      <button
        type="button"
        className={`panel-chip${selectedClub === null ? ' panel-chip--active' : ''}`}
        aria-pressed={selectedClub === null}
        onClick={() => setSelectedClub(null)}
      >
        {t('stats.all', { count: profileShots.length })}
      </button>
      <div
        className="panel-chips stats-panel__chip-scroll"
        ref={chipRef}
        onPointerDown={chipScroll.onPointerDown}
        onPointerMove={chipScroll.onPointerMove}
        onPointerUp={chipScroll.onPointerUp}
        onPointerCancel={chipScroll.onPointerCancel}
        onClickCapture={chipScroll.onClickCapture}
      >
        {availableClubs.map((club) => (
          <button
            key={club}
            type="button"
            className={`panel-chip${selectedClub === club ? ' panel-chip--active' : ''}`}
            aria-pressed={selectedClub === club}
            onClick={() => setSelectedClub(club)}
          >
            {club.toUpperCase()} ({clubCounts[club] ?? 0})
          </button>
        ))}
      </div>
    </div>
  );

  const gapping = useMemo(() => (scope === 'gapping' ? computeGapping(historyShots) : []), [scope, historyShots]);
  const loading = scope !== 'session' && !historyLoaded;
  const scopes: Array<{ id: StatsScope; label: string }> = [
    { id: 'session', label: t('stats.scopeSession') },
    { id: 'history', label: t('stats.scopeHistory') },
    { id: 'gapping', label: t('stats.scopeGapping') },
  ];
  const scopeSwitch = (
    <div className="stats-panel__scopes" role="group" aria-label={t('stats.scopeAria')}>
      {scopes.map((option) => (
        <PanelAction
          key={option.id}
          variant={scope === option.id ? 'primary' : 'secondary'}
          aria-pressed={scope === option.id}
          onClick={() => setScope(option.id)}
        >
          {option.label}
        </PanelAction>
      ))}
      {scope !== 'session' && historyLoaded ? (
        <span className="stats-panel__scope-meta">{t('stats.sessionsCount', { count: sessionCount })}</span>
      ) : null}
    </div>
  );

  const empty = (
    <div className="panel__body--empty">
      <span className="panel__empty-title">{loading ? t('stats.loading') : t('stats.noShots')}</span>
      {loading ? null : (
        <span className="panel__empty-detail">
          {scope === 'session' ? t('stats.noShotsDetail') : t('stats.noHistoryDetail')}
        </span>
      )}
    </div>
  );

  let body: ReactNode;
  if (profileShots.length === 0) {
    body = empty;
  } else if (scope === 'gapping') {
    body = <GappingList rows={gapping} />;
  } else {
    body = (
      <>
        {clubFilters}
        <div className={`stats-panel__grid stats-panel__grid--of-${tiles.length}`}>
          {tiles.map((tile) => (
            <MetricCard key={tile.id} label={tile.label} value={tile.value} unit={tile.unit} labelPosition="above" />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="panel">
      <PanelHeader title={t('nav.stats')} subtitle={profileName} actions={headerAction} />
      <div className="panel__body stats-panel">
        {scopeSwitch}
        {body}
      </div>
    </div>
  );
}

/** Per-club carry: average, spread bar on a shared scale, and the gap to the next club. */
function GappingList({ rows }: { rows: ReturnType<typeof computeGapping> }) {
  const { t } = useI18n();
  const { unitSystem } = useUnitPreference();
  const distanceUnit = getDistanceUnit(unitSystem);
  const listRef = useRef<HTMLDivElement>(null);
  const dragScroll = useDragScroll(listRef);
  const scaleMax = Math.max(...rows.map((row) => row.maxCarry), 1);

  return (
    <div
      className="gapping"
      ref={listRef}
      role="table"
      aria-label={t('stats.scopeGapping')}
      onPointerDown={dragScroll.onPointerDown}
      onPointerMove={dragScroll.onPointerMove}
      onPointerUp={dragScroll.onPointerUp}
      onPointerCancel={dragScroll.onPointerCancel}
    >
      <div className="gapping__row gapping__row--head" role="row">
        <span role="columnheader">{t('shots.colClub')}</span>
        <span role="columnheader">{t('stats.shots')}</span>
        <span role="columnheader">{t('stats.avgCarry')}</span>
        <span role="columnheader" className="gapping__range-head">
          {t('stats.carryRange')}
        </span>
        <span role="columnheader">{t('stats.gap')}</span>
      </div>
      {rows.map((row) => (
        <div className="gapping__row" role="row" key={row.club}>
          <span className="gapping__club" role="cell">
            {row.label}
          </span>
          <span role="cell">{row.count}</span>
          <span className="gapping__carry" role="cell">
            {formatDistance(row.avgCarry, unitSystem, 0)}
            <small> {distanceUnit}</small>
          </span>
          <span
            className="gapping__range"
            role="cell"
            aria-label={`${formatDistance(row.minCarry, unitSystem, 0)} - ${formatDistance(row.maxCarry, unitSystem, 0)} ${distanceUnit}`}
          >
            <span
              className="gapping__bar"
              style={{
                left: `${(row.minCarry / scaleMax) * 100}%`,
                width: `${Math.max(((row.maxCarry - row.minCarry) / scaleMax) * 100, 0.8)}%`,
              }}
            />
            <span className="gapping__avg" style={{ left: `${(row.avgCarry / scaleMax) * 100}%` }} />
          </span>
          <span className="gapping__gap" role="cell">
            {row.gapToNext === null ? '—' : `${formatDistance(row.gapToNext, unitSystem, 0)} ${distanceUnit}`}
          </span>
        </div>
      ))}
    </div>
  );
}
