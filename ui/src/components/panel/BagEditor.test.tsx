import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ALL_CLUBS } from '../../data/clubs';
import { BagEditor } from './BagEditor';
import { bagSections, pickerGridRows } from './pickerSections';

describe('BagEditor', () => {
  it('shows the count and marks clubs in the bag', () => {
    const html = renderToString(
      <BagEditor profileName="Lennard" initialBag={['driver', '7-iron']} onSave={() => {}} onClose={() => {}} />
    );

    expect(html).toContain('Bag: Lennard');
    expect(html).toMatch(/2<!-- -->\/<!-- -->16|2\/16/);
    expect(html.match(/picker-overlay__option--selected/g)).toHaveLength(1);
  });

  it('disables clubs outside the bag once it is full', () => {
    // All woods and hybrids plus 8 irons: the Irons tab still shows 4 unselected irons.
    const full = ALL_CLUBS.slice(4).map((club) => club.id);
    const html = renderToString(<BagEditor profileName="A" initialBag={full} onSave={() => {}} onClose={() => {}} />);

    expect(html).toContain('disabled=""');
    expect(html).toContain('Bag is full');
  });

  it('fits a full bag on one tab-less picker screen of four rows', () => {
    const sections = bagSections(ALL_CLUBS.slice(0, 16));
    expect(sections).toHaveLength(1);
    expect(pickerGridRows(sections)).toBe(4);
  });
});
