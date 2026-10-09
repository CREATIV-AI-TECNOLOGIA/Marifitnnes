import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SegmentedControl } from './index';

describe('seleção de opções acessível', () => {
  it('usa radios nativos com uma única opção marcada e um nome compartilhado', () => {
    const html = renderToStaticMarkup(<SegmentedControl value="kg" onChange={() => {}}
      options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} />);
    const inputs = html.match(/<input\b[^>]*>/g) ?? [];
    expect(inputs).toHaveLength(2);
    expect(inputs.every(input => input.includes('type="radio"'))).toBe(true);
    expect(inputs.filter(input => input.includes('checked=""'))).toHaveLength(1);
    expect(inputs[0]).toContain('checked=""');
    expect(inputs[1]).not.toContain('checked=""');
    const names = inputs.map(input => input.match(/name="([^"]+)"/)?.[1]);
    expect(names[0]).toBeTruthy();
    expect(names[0]).toBe(names[1]);
    expect(html).toContain('role="radiogroup"');
    expect(html).not.toContain('role="tab"');
  });

  it('separa grupos diferentes para não misturar a escolha de aparência com a de unidade', () => {
    const html = renderToStaticMarkup(<>
      <SegmentedControl value="dark" onChange={() => {}} options={[{ value: 'dark', label: 'Escuro' }]} />
      <SegmentedControl value="kg" onChange={() => {}} options={[{ value: 'kg', label: 'kg' }]} />
    </>);
    const names = [...html.matchAll(/<input\b[^>]*name="([^"]+)"/g)].map(match => match[1]);
    expect(names).toHaveLength(2);
    expect(names[0]).not.toBe(names[1]);
  });
});
