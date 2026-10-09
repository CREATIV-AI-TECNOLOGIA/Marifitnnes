interface TextItem { str: string; transform: number[]; }

function isTextItem(item: unknown): item is TextItem {
  return !!item && typeof item === 'object' && 'str' in item && 'transform' in item
    && typeof item.str === 'string' && Array.isArray(item.transform) && item.transform.length >= 6
    && Number.isFinite(item.transform[4]) && Number.isFinite(item.transform[5]);
}

export function pageLines(items: unknown[]) {
  const rows: { y: number; items: { x: number; value: string }[] }[] = [];
  for (const item of items) {
    if (!isTextItem(item) || !item.str.trim()) continue;
    const point = { x: item.transform[4], y: item.transform[5], value: item.str };
    // The smaller rest labels sit 3–4 points above the workout codes on the same table row.
    let row = rows.find(candidate => Math.abs(candidate.y - point.y) < 5);
    if (!row) { row = { y: point.y, items: [] }; rows.push(row); }
    row.items.push(point);
  }
  return rows.sort((a, b) => b.y - a.y)
    .map(row => row.items.sort((a, b) => a.x - b.x).map(item => item.value).join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}
