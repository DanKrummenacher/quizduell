/** Geometry helpers for the logo SVGs (viewBox 0 0 100 100). */

export const DARK = '#00327d';
export const LIGHT = '#0078bb';

export function polygon(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation = -90,
): string {
  return Array.from({ length: sides }, (_, i) => {
    const angle = ((rotation + (360 / sides) * i) * Math.PI) / 180;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}

export interface Shape {
  kind: 'circle' | 'polygon';
  cx: number;
  cy: number;
  r: number;
  points: string;
  color: string;
}

/** Eight geometric shapes on a ring – the two halves stand for the two players. */
export function shapeRing(): Shape[] {
  const kinds = ['hexagon', 'diamond', 'pentagon', 'circle'] as const;
  return Array.from({ length: 8 }, (_, i) => {
    const angle = ((-90 + 45 * i) * Math.PI) / 180;
    const cx = 50 + 32 * Math.cos(angle);
    const cy = 50 + 32 * Math.sin(angle);
    const kind = kinds[i % 4]!;
    const color = i < 4 ? LIGHT : DARK;
    if (kind === 'circle') {
      return { kind: 'circle', cx, cy, r: 8.5, points: '', color };
    }
    const sides = kind === 'hexagon' ? 6 : kind === 'pentagon' ? 5 : 4;
    const radius = kind === 'diamond' ? 11 : 10;
    return {
      kind: 'polygon',
      cx,
      cy,
      r: radius,
      points: polygon(cx, cy, radius, sides),
      color,
    };
  });
}

/** Six dots around a central hexagon. */
export function dotWheel(): Shape[] {
  const dots = Array.from({ length: 6 }, (_, i): Shape => {
    const angle = ((-90 + 60 * i) * Math.PI) / 180;
    return {
      kind: 'circle',
      cx: 50 + 32 * Math.cos(angle),
      cy: 50 + 32 * Math.sin(angle),
      r: 10,
      points: '',
      color: i % 2 === 0 ? DARK : LIGHT,
    };
  });
  return [
    ...dots,
    {
      kind: 'polygon',
      cx: 50,
      cy: 50,
      r: 14,
      points: polygon(50, 50, 16, 6, 0),
      color: DARK,
    },
  ];
}
