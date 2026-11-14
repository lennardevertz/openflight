import { useMemo, useState, type ReactNode } from 'react';
import type { Shot } from '../../types/shot';
import { computeSwingSpeedStats, filterShotsByProfile, isSwingSpeedShot } from '../../types/shot';
import { useUnitPreference } from '../../state/useUnitPreference';
import { useI18n } from '../../i18n/useI18n';
import { useSharedFitFontSize } from '../../hooks/useFitFontSize';
import { useLiveLayoutStore } from '../../stores/useLiveLayoutStore';
import { MetricCard } from '../ui/MetricCard';
import { LiveLayoutEditor } from './LiveLayoutEditor';
import { PanelAction } from './PanelAction';
import { PanelHeader } from './PanelHeader';
import { applyLiveLayout, buildLiveMetrics, liveGridShape, orderLiveMetrics, pinSelectedMetric } from './liveMetrics';

interface LivePanelProps {
  shot: Shot | null;
  shots: Shot[];
  profileId: string;
  profileName: string;
  clubLabel: string;
  /** Undefined outside swing-speed mode. Scopes the swing stats to one implement. */
  activeTrainingImplement?: string;
  /** Metric pinned top-left while the full table remains visible. */
  selectedMetricId?: string | null;
  onSelectMetric?: (id: string) => void;
  /** True for a freshly captured shot (not a restored session). */
  isNewShot?: boolean;
  /** Pinned header control, e.g. Change club. */
  headerAction?: ReactNode;
}

/**
 * Ten-metric table. Tapping a tile selects it: the title turns accent yellow
 * and the tile moves to the top-left without hiding the remaining metrics.
 * Edit tiles opens {@link LiveLayoutEditor} to reorder or hide tiles.
 */
export function LivePanel({
  shot,
  shots,
  profileId,
  profileName,
  clubLabel,
  activeTrainingImplement,
  selectedMetricId = null,
  onSelectMetric,
  isNewShot = false,
  headerAction,
}: LivePanelProps) {
  const { locale, t } = useI18n();
  const { unitSystem } = useUnitPreference();
  const profileShots = useMemo(() => filterShotsByProfile(shots, profileId), [shots, profileId]);
  const displayedShot = profileShots[profileShots.length - 1] ?? null;
  const isProfileNewShot = Boolean(isNewShot && shot && displayedShot && shot.timestamp === displayedShot.timestamp);

  const swingStats = useMemo(
    () => computeSwingSpeedStats(profileShots, { profileId, trainingImplement: activeTrainingImplement }),
    [profileShots, profileId, activeTrainingImplement]
  );
  const layoutMode = displayedShot && isSwingSpeedShot(displayedShot) ? 'swing' : 'ball';
  const layout = useLiveLayoutStore((state) => state.layouts[layoutMode]);
  const setLayout = useLiveLayoutStore((state) => state.setLayout);
  const resetLayout = useLiveLayoutStore((state) => state.resetLayout);
  const [editing, setEditing] = useState(false);
  const allMetrics = useMemo(
    () => (displayedShot ? buildLiveMetrics(displayedShot, unitSystem, swingStats) : []),
    // locale is not read in the factory; t() is a stable import. Without it,
    // changing language would keep stale metric labels.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
    [displayedShot, unitSystem, swingStats, locale]
  );
  const metrics = useMemo(
    () => pinSelectedMetric(applyLiveLayout(allMetrics, layout), selectedMetricId),
    [allMetrics, layout, selectedMetricId]
  );
  const selected = metrics[0] ?? null;
  const gridRef = useSharedFitFontSize(
    metrics.length > 0,
    metrics.map((metric) => `${metric.value}:${metric.unit ?? ''}`).join('|')
  );
  const isEditing = editing && metrics.length > 0;
  const actions = isEditing ? (
    <>
      <PanelAction variant="secondary" onClick={() => resetLayout(layoutMode)}>
        {t('live.editReset')}
      </PanelAction>
      <PanelAction onClick={() => setEditing(false)}>{t('live.editDone')}</PanelAction>
    </>
  ) : (
    <>
      {metrics.length > 0 ? (
        <PanelAction variant="secondary" onClick={() => setEditing(true)}>
          {t('live.editTiles')}
        </PanelAction>
      ) : null}
      {headerAction}
    </>
  );
  const header = <PanelHeader title={t('nav.live')} subtitle={profileName} club={clubLabel} actions={actions} />;

  if (!selected) {
    return (
      <div className="panel">
        {header}
        <div className="panel__body panel__body--empty live-panel__empty">
          <span className="panel__empty-title live-panel__empty-title">{t('live.ready')}</span>
          <span className="panel__empty-detail live-panel__empty-detail">{t('live.readyDetail')}</span>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="panel">
        {header}
        <div className="panel__body live-panel__body">
          <LiveLayoutEditor
            metrics={orderLiveMetrics(allMetrics, layout?.order)}
            hidden={layout?.hidden ?? []}
            onChange={(next) => setLayout(layoutMode, next)}
          />
        </div>
      </div>
    );
  }

  const { columns, rows } = liveGridShape(metrics.length);

  return (
    <div className="panel">
      {header}
      <div className="panel__body live-panel__body">
        {isProfileNewShot ? <div className="shot-flash" /> : null}
        <div
          ref={gridRef}
          className={`live-panel__grid live-panel__grid--of-${metrics.length}`}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
        >
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              subtext={metric.subtext}
              estimated={metric.estimated}
              confidence={metric.confidence}
              confidenceLabel={metric.confidenceLabel}
              labelPosition="above"
              selected={metric.id === selected.id}
              onClick={onSelectMetric ? () => onSelectMetric(metric.id) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
