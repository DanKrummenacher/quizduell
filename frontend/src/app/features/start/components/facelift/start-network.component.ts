import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const LINK_DISTANCE = 120;
const MOUSE_RADIUS = 140;

/**
 * TEMPORARY (variant): a fine network of dots behind the start page. The
 * dots drift slowly, nearby ones are linked, and they avoid the mouse.
 */
@Component({
  selector: 'app-start-network',
  template: `<canvas #canvas></canvas>`,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  host: { 'aria-hidden': 'true' },
})
export class StartNetworkComponent {
  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const mouse = { x: -1000, y: -1000 };
      let dots: Dot[] = [];
      let width = 0;
      let height = 0;

      const resize = () => {
        const ratio = window.devicePixelRatio || 1;
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        // About one dot per 14 000 px², so phones are calm too.
        const count = Math.min(90, Math.round((width * height) / 14000));
        dots = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
        }));
      };

      const draw = () => {
        context.clearRect(0, 0, width, height);
        for (const dot of dots) {
          if (!still) {
            dot.x += dot.vx;
            dot.y += dot.vy;
            if (dot.x < 0 || dot.x > width) {
              dot.vx *= -1;
            }
            if (dot.y < 0 || dot.y > height) {
              dot.vy *= -1;
            }
          }
          // The dots make room for the mouse.
          const dx = dot.x - mouse.x;
          const dy = dot.y - mouse.y;
          const distance = Math.hypot(dx, dy);
          if (distance < MOUSE_RADIUS && distance > 0) {
            const push = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
            dot.x += (dx / distance) * push * 2;
            dot.y += (dy / distance) * push * 2;
          }
        }
        for (let i = 0; i < dots.length; i++) {
          const a = dots[i]!;
          for (let j = i + 1; j < dots.length; j++) {
            const b = dots[j]!;
            const distance = Math.hypot(a.x - b.x, a.y - b.y);
            if (distance < LINK_DISTANCE) {
              context.strokeStyle = `rgba(0, 120, 187, ${0.18 * (1 - distance / LINK_DISTANCE)})`;
              context.lineWidth = 1;
              context.beginPath();
              context.moveTo(a.x, a.y);
              context.lineTo(b.x, b.y);
              context.stroke();
            }
          }
          context.fillStyle = 'rgba(0, 120, 187, 0.35)';
          context.beginPath();
          context.arc(a.x, a.y, 1.8, 0, Math.PI * 2);
          context.fill();
        }
        frame = requestAnimationFrame(draw);
      };

      const onMove = (event: PointerEvent) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
      };

      resize();
      let frame = requestAnimationFrame(draw);
      window.addEventListener('resize', resize);
      window.addEventListener('pointermove', onMove);
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', onMove);
      });
    });
  }
}
