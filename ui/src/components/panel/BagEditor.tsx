import { useState, type CSSProperties } from 'react';
import { cleanBag, MAX_BAG_CLUBS } from '../../data/bag';
import { clubGroupLabel } from '../../i18n';
import { useI18n } from '../../i18n/useI18n';
import { PanelAction } from './PanelAction';
import { clubSections, pickerGridRows } from './pickerSections';

interface BagEditorProps {
  profileName: string;
  /** Club ids currently in the bag. */
  initialBag: ReadonlyArray<string>;
  onSave: (clubs: string[]) => void;
  onClose: () => void;
}

/**
 * Full-screen bag editor, styled like the club picker: tap clubs across the
 * Woods / Hybrids / Irons tabs to add or remove them. Capped at
 * {@link MAX_BAG_CLUBS} so the in-play picker fits on one screen.
 */
export function BagEditor({ profileName, initialBag, onSave, onClose }: BagEditorProps) {
  const { t } = useI18n();
  const sections = clubSections();
  const [sectionName, setSectionName] = useState(sections[0]?.name ?? '');
  const [bag, setBag] = useState<string[]>(() => cleanBag(initialBag));
  const activeSection = sections.find((section) => section.name === sectionName) ?? sections[0];
  const rows = pickerGridRows(sections);
  const full = bag.length >= MAX_BAG_CLUBS;
  const title = t('bag.title', { name: profileName });

  const toggle = (id: string) => {
    setBag((current) => (current.includes(id) ? current.filter((club) => club !== id) : cleanBag([...current, id])));
  };

  return (
    <div className="picker-overlay bag-editor" role="dialog" aria-modal="true" aria-label={title}>
      <div className="picker-overlay__header">
        <span className="picker-overlay__title">{title}</span>
        <div className="bag-editor__actions">
          <span className="bag-editor__count" aria-live="polite">
            {t('bag.count', { count: bag.length, max: MAX_BAG_CLUBS })}
          </span>
          <PanelAction variant="secondary" onClick={() => setBag([])} disabled={bag.length === 0}>
            {t('bag.clear')}
          </PanelAction>
          <PanelAction
            onClick={() => {
              onSave(bag);
              onClose();
            }}
          >
            {t('bag.save')}
          </PanelAction>
          <button
            type="button"
            className="picker-overlay__close"
            onClick={onClose}
            aria-label={t('picker.close', { title })}
          >
            ✕
          </button>
        </div>
      </div>
      <div className="picker-overlay__tabs" role="group" aria-label={t('picker.groups')}>
        {sections.map((section) => {
          const active = section.name === sectionName;
          const inBag = section.options.filter((option) => bag.includes(option.id)).length;
          return (
            <PanelAction
              key={section.name}
              variant={active ? 'primary' : 'secondary'}
              aria-pressed={active}
              onClick={() => setSectionName(section.name)}
            >
              {inBag > 0 ? `${clubGroupLabel(section.name)} · ${inBag}` : clubGroupLabel(section.name)}
            </PanelAction>
          );
        })}
      </div>
      <div className="picker-overlay__body">
        <div className="picker-overlay__grid" style={{ '--picker-rows': String(rows) } as CSSProperties}>
          {(activeSection?.options ?? []).map((option) => {
            const selected = bag.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                className={`picker-overlay__option${selected ? ' picker-overlay__option--selected' : ''}`}
                aria-pressed={selected}
                disabled={!selected && full}
                onClick={() => toggle(option.id)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="bag-editor__hint">{full ? t('bag.full', { max: MAX_BAG_CLUBS }) : t('bag.hint')}</p>
    </div>
  );
}
