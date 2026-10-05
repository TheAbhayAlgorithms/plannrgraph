import { playChimeSound } from './notificationUtils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

/**
 * Triggers a festive confetti particle celebration effect on the screen.
 * Zero external dependencies, pure HTML5 Canvas with smooth 60fps physics.
 */
export function triggerCelebrationConfetti(): void {
  if (typeof window === 'undefined') return;

  // Play uplifting celebration chime
  playChimeSound();

  const canvas = document.createElement('canvas');
  canvas.id = 'celebration-confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = [
    '#10b981', // Emerald
    '#34d399', // Mint
    '#6366f1', // Indigo
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#fbbf24', // Gold
  ];

  const particles: Particle[] = [];
  const particleCount = 75;

  // Generate particles bursting from center-top
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height * 0.3 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -10 - 4,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
    });
  }

  let startTime: number | null = null;
  const duration = 2400; // 2.4 seconds

  function render(timestamp: number) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = elapsed / duration;

    if (progress >= 1 || !ctx) {
      if (canvas.parentNode) {
        document.body.removeChild(canvas);
      }
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.vx *= 0.98; // Air resistance
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - progress * 1.1);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
