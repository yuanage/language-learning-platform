import { useEffect, useRef } from 'react';

/**
 * GenerativeBackground — 「墨流字河 Glyph Currents」零依赖 Canvas 精简版
 * 哲学与参数详见 design/algorithmic-philosophy.md：
 *  - 三层噪声洋流驱动英/日/韩字符墨滴漂流
 *  - 噪声深度控制字符"呼吸"（浮现/沉影）
 *  - 低透明度覆底形成墨迹存留
 *  - 尊重 prefers-reduced-motion（静帧降级）、页面隐藏时暂停
 *  - 主题感知：亮=宣纸白底，暗=墨夜底（颜色读自 CSS 变量）
 */
export default function GenerativeBackground({ density = 30, seed = 20261 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 主题色（读 CSS 变量，切主题时重取）
    const palette = () => {
      const css = getComputedStyle(document.documentElement);
      const readVar = (name, fallback) => (css.getPropertyValue(name) || fallback).trim();
      const isDark = document.documentElement.dataset.theme === 'dark';
      return {
        bg: hexToRGB(readVar('--llp-bg', isDark ? '#0d1020' : '#f5f7fb')),
        colors: isDark
          ? ['#8fa6ff', '#e8916d', '#9db378'].map(hexToRGB)
          : ['#5b7cfa', '#d97757', '#788c5d'].map(hexToRGB),
        fadeAlpha: isDark ? 0.05 : 0.035,
        baseAlpha: isDark ? [0.14, 0.5] : [0.1, 0.42]
      };
    };

    const GLYPHS = [
      'AaEeGgMRbbsw'.split(''),
      'あいうかきさそにんほれ'.split(''),
      '가나다석손이학한혜'.split('')
    ];

    // mulberry32 种子随机
    let s = seed >>> 0;
    const rand = () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // value noise（双层，hash + 平滑双线性）
    const hash = (ix, iy) => {
      const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };
    const smooth = (v) => v * v * (3 - 2 * v);
    const noise2 = (x, y) => {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = smooth(x - ix), fy = smooth(y - iy);
      const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
    const NOISE_SCALE = 0.0016;
    const fieldAngle = (x, y, t) => {
      const primary = noise2(x * NOISE_SCALE, y * NOISE_SCALE + t * 0.03) * Math.PI * 2 * 2.2;
      const vortex = (noise2(x * NOISE_SCALE * 3.1 + 90, y * NOISE_SCALE * 3.1 + t * 0.05) - 0.5) * 1.6;
      return primary + vortex;
    };

    let W = 0, H = 0, dpr = 1;
    let particles = [];
    let rafId = 0;
    let running = true;
    let t = 0;

    const makeParticle = () => {
      const si = Math.floor(rand() * 3);
      return {
        x: rand(), y: rand(), // 归一化坐标
        glyph: GLYPHS[si][Math.floor(rand() * GLYPHS[si].length)],
        ci: si,
        size: 12 + rand() * 15,
        speed: 0.4 + rand() * 0.7,
        rot: rand() * Math.PI * 2,
        rotSpeed: (rand() - 0.5) * 0.004,
        phase: rand() * 1000
      };
    };

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, Math.floor(rect.width));
      H = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paintFrame = (advanceTime) => {
      const { bg, colors, fadeAlpha, baseAlpha } = palette();
      if (advanceTime) t += 0.6;
      ctx.fillStyle = `rgba(${bg[0]},${bg[1]},${bg[2]},${fadeAlpha})`;
      ctx.fillRect(0, 0, W, H);

      for (const p of particles) {
        const px = p.x * W, py = p.y * H;
        const a = fieldAngle(px, py, t);
        p.x += (Math.cos(a) * p.speed) / W;
        p.y += (Math.sin(a) * p.speed) / H;
        p.rot += p.rotSpeed;
        if (p.x < -0.05 || p.x > 1.05 || p.y < -0.05 || p.y > 1.05) {
          const np = makeParticle();
          np.x = rand() < 0.5 ? -0.02 : rand();
          np.y = rand() < 0.5 ? -0.02 : rand() * 0.3;
          Object.assign(p, np);
          continue;
        }
        const depth = noise2(px * NOISE_SCALE * 1.8, py * NOISE_SCALE * 1.8 + p.phase);
        const alpha = baseAlpha[0] + (baseAlpha[1] - baseAlpha[0]) * (1 - depth);
        const c = colors[p.ci];
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rot);
        ctx.font = `${p.size}px "Segoe UI", "Noto Sans JP", "Noto Sans KR", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`;
        ctx.fillText(p.glyph, 0, 0);
        ctx.restore();
      }
    };

    const init = () => {
      resize();
      particles = Array.from({ length: density }, makeParticle);
      const { bg } = palette();
      ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      ctx.fillRect(0, 0, W, H);
    };

    init();

    if (reducedMotion) {
      // 降级：静帧构图（若干步演化后定格）
      for (let i = 0; i < 240; i++) paintFrame(true);
      return undefined;
    }

    const loop = () => {
      if (running) paintFrame(true);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const onVisibility = () => { running = !document.hidden; };
    const onResize = () => init();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density, seed]);

  return <canvas ref={canvasRef} className="auth-canvas" aria-hidden="true" />;
}

function hexToRGB(hex) {
  const h = (hex || '#ffffff').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
