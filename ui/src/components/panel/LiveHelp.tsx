import type { MessageKey } from '../../i18n';
import { useI18n } from '../../i18n/useI18n';
import type { LiveMetric } from './liveMetrics';

interface LiveHelpProps {
  /** The current shot's metrics, so each row can show this club's target. */
  metrics: LiveMetric[];
  onClose: () => void;
}

/** Full-screen sheet: what each Live number means, and the target for this club. */
export function LiveHelp({ metrics, onClose }: LiveHelpProps) {
  const { t } = useI18n();
  const title = t('guide.title');

  return (
    <div className="picker-overlay live-help" role="dialog" aria-modal="true" aria-label={title}>
      <div className="picker-overlay__header">
        <span className="picker-overlay__title">{title}</span>
        <button type="button" className="picker-overlay__close" onClick={onClose} aria-label={t('guide.close')}>
          ✕
        </button>
      </div>
      <div className="live-help__list">
        {metrics.map((metric) => {
          const key = `explain.${metric.id}` as MessageKey;
          return (
            <div className="live-help__row" key={metric.id}>
              <span className="live-help__name">{metric.label}</span>
              <span className="live-help__text">{t(key)}</span>
              {metric.guidance ? (
                <span className={`live-help__target metric-card__guidance--${metric.guidance.status}`}>
                  {metric.guidance.text}
                </span>
              ) : null}
            </div>
          );
        })}
        <p className="live-help__source">{t('guide.source')}</p>
      </div>
    </div>
  );
}
