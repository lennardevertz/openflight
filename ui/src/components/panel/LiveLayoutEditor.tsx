import { useRef, useState, type PointerEvent } from 'react';
import { useI18n } from '../../i18n/useI18n';
import { liveGridShape, moveLiveMetric, type LiveLayout, type LiveMetric } from './liveMetrics';

interface LiveLayoutEditorProps {
  /** Every metric for the current mode, already in the saved order. */
  metrics: LiveMetric[];
  hidden: readonly string[];
  onChange: (layout: LiveLayout) => void;
}

/** Pointer travel (px) that turns a press into a drag instead of a tap. */
const DRAG_THRESHOLD = 8;

interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
}

/**
 * Edit mode for the Live table: the full tile grid, including hidden tiles.
 * Drag a tile onto another slot to reorder; tap it to show or hide it.
 * Pointer events cover touch, pen and mouse on the kiosk.
 */
export function LiveLayoutEditor({ metrics, hidden, onChange }: LiveLayoutEditorProps) {
  const { t } = useI18n();
  const drag = useRef<DragState | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const order = metrics.map((metric) => metric.id);
  const hiddenSet = new Set(hidden);
  const visibleCount = order.filter((id) => !hiddenSet.has(id)).length;
  const { columns, rows } = liveGridShape(metrics.length);

  const toggle = (id: string) => {
    if (hiddenSet.has(id)) {
      onChange({ order, hidden: hidden.filter((hiddenId) => hiddenId !== id) });
    } else if (visibleCount > 1) {
      onChange({ order, hidden: [...hidden, id] });
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) {
      return;
    }
    if (!state.moved && Math.hypot(event.clientX - state.startX, event.clientY - state.startY) < DRAG_THRESHOLD) {
      return;
    }
    state.moved = true;
    setDraggingId(state.id);
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-tile-id]')
      ?.dataset.tileId;
    if (target && target !== state.id) {
      onChange({ order: moveLiveMetric(order, state.id, target), hidden: [...hidden] });
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) {
      return;
    }
    if (!state.moved) {
      toggle(state.id);
    }
    drag.current = null;
    setDraggingId(null);
  };

  const onPointerCancel = () => {
    drag.current = null;
    setDraggingId(null);
  };

  return (
    <div
      className="live-panel__grid live-layout-editor"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      aria-label={t('live.editHint')}
    >
      {metrics.map((metric) => {
        const isHidden = hiddenSet.has(metric.id);
        const classes = ['live-layout-editor__tile'];
        if (isHidden) classes.push('live-layout-editor__tile--hidden');
        if (metric.id === draggingId) classes.push('live-layout-editor__tile--dragging');
        return (
          <button
            key={metric.id}
            type="button"
            data-tile-id={metric.id}
            className={classes.join(' ')}
            aria-pressed={!isHidden}
            onPointerDown={(event) => onPointerDown(event, metric.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggle(metric.id);
              }
            }}
          >
            <span className="live-layout-editor__grip" aria-hidden="true">
              ⠿
            </span>
            <span className="live-layout-editor__label">{metric.label}</span>
            <span className="live-layout-editor__state">{isHidden ? t('live.tileHidden') : t('live.tileShown')}</span>
          </button>
        );
      })}
    </div>
  );
}
