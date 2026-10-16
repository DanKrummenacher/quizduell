/** Geometry of the playduelio logo mark (viewBox 0 0 100 100). */

/** Brand gradient: dark blue → blue → light blue. */
const GRADIENT: [number, number, number][] = [
  [0x00, 0x32, 0x7d],
  [0x00, 0x78, 0xbb],
  [0x00, 0xa4, 0xe0],
];

interface Shape {
  kind: 'circle' | 'polygon';
  cx: number;
  cy: number;
  r: number;
  points: string;
  color: string;
}

function polygon(
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

/** Color at position t (0–1) along the brand gradient. */
function gradientColor(t: number): string {
  const scaled = Math.min(Math.max(t, 0), 1) * (GRADIENT.length - 1);
  const index = Math.min(Math.floor(scaled), GRADIENT.length - 2);
  const local = scaled - index;
  const from = GRADIENT[index]!;
  const to = GRADIENT[index + 1]!;
  const channel = (i: number) =>
    Math.round(from[i]! + (to[i]! - from[i]!) * local)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

/**
 * Eight geometric shapes on a ring. The colour flows clockwise through the
 * brand gradient, like a spinning quiz wheel.
 */
export function shapeRing(): Shape[] {
  const kinds = ['hexagon', 'diamond', 'pentagon', 'circle'] as const;
  return Array.from({ length: 8 }, (_, i) => {
    const angle = ((-90 + 45 * i) * Math.PI) / 180;
    const cx = 50 + 32 * Math.cos(angle);
    const cy = 50 + 32 * Math.sin(angle);
    const kind = kinds[i % 4]!;
    const color = gradientColor(i / 7);
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
