"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface CircuitLine {
  points: { x: number; y: number }[];
  speed: number;
  glowPhase: number;
  width: number;
}

interface HexParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  drift: number;
  phase: number;
}

function createCircuitCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  let animFrame: number;
  const lines: CircuitLine[] = [];
  const hexes: HexParticle[] = [];

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  function generateLine(w: number, h: number): CircuitLine {
    const points: { x: number; y: number }[] = [];
    // Start from a random edge
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;
    if (side === 0) { x = 0; y = Math.random() * h; }
    else if (side === 1) { x = w; y = Math.random() * h; }
    else if (side === 2) { x = Math.random() * w; y = 0; }
    else { x = Math.random() * w; y = h; }

    points.push({ x, y });
    const segments = 4 + Math.floor(Math.random() * 6);

    for (let i = 0; i < segments; i++) {
      const prev = points[points.length - 1];
      const len = 60 + Math.random() * 200;
      // Angular movement - horizontal, vertical, or 45-degree diagonal
      const directions = [
        { dx: len, dy: 0 },
        { dx: -len, dy: 0 },
        { dx: 0, dy: len },
        { dx: 0, dy: -len },
        { dx: len * 0.7, dy: -len * 0.7 },
        { dx: -len * 0.7, dy: -len * 0.7 },
        { dx: len * 0.7, dy: len * 0.7 },
        { dx: -len * 0.7, dy: len * 0.7 },
      ];
      const dir = directions[Math.floor(Math.random() * directions.length)];
      points.push({
        x: Math.max(-50, Math.min(w + 50, prev.x + dir.dx)),
        y: Math.max(-50, Math.min(h + 50, prev.y + dir.dy)),
      });
    }

    return {
      points,
      speed: 0.3 + Math.random() * 0.7,
      glowPhase: Math.random() * Math.PI * 2,
      width: 0.5 + Math.random() * 1,
    };
  }

  function init() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    lines.length = 0;
    const lineCount = 10 + Math.floor(Math.random() * 4);
    for (let i = 0; i < lineCount; i++) {
      lines.push(generateLine(w, h));
    }

    hexes.length = 0;
    for (let i = 0; i < 6; i++) {
      hexes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 8 + Math.random() * 20,
        opacity: 0.015 + Math.random() * 0.025,
        drift: (Math.random() - 0.5) * 0.15,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawHex(cx: number, cy: number, size: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = cx + size * Math.cos(angle);
      const py = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function draw(time: number) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    // Background gradient (dark blue)
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, w * 0.7);
    bgGrad.addColorStop(0, "rgba(15, 40, 80, 0.4)");
    bgGrad.addColorStop(0.5, "rgba(8, 20, 50, 0.2)");
    bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw floating hexagons
    for (const hex of hexes) {
      hex.y += hex.drift;
      if (hex.y < -30) hex.y = h + 30;
      if (hex.y > h + 30) hex.y = -30;
      const pulse = Math.sin(time * 0.0008 + hex.phase) * 0.5 + 0.5;
      const opacity = hex.opacity * (0.5 + pulse * 0.5);
      ctx.strokeStyle = `rgba(60, 160, 255, ${opacity})`;
      ctx.lineWidth = 1;
      drawHex(hex.x, hex.y, hex.size);
      ctx.stroke();
      ctx.fillStyle = `rgba(60, 160, 255, ${opacity * 0.15})`;
      drawHex(hex.x, hex.y, hex.size);
      ctx.fill();
    }

    // Draw circuit lines
    for (const line of lines) {
      const pulse = Math.sin(time * 0.001 * line.speed + line.glowPhase) * 0.5 + 0.5;
      // Fade lines near center so text stays clean
      const cx = w * 0.5, cy = h * 0.5;
      const lineCx = line.points.reduce((s, p) => s + p.x, 0) / line.points.length;
      const lineCy = line.points.reduce((s, p) => s + p.y, 0) / line.points.length;
      const distFromCenter = Math.hypot(lineCx - cx, lineCy - cy) / Math.hypot(cx, cy);
      const centerFade = Math.min(1, distFromCenter * 1.5);
      const baseOpacity = (0.06 + pulse * 0.06) * (0.3 + centerFade * 0.7);

      // Line glow (wider, more transparent)
      ctx.strokeStyle = `rgba(50, 160, 255, ${baseOpacity * 0.4})`;
      ctx.lineWidth = line.width * 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < line.points.length; i++) {
        const p = line.points[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      // Main line
      ctx.strokeStyle = `rgba(60, 180, 255, ${baseOpacity})`;
      ctx.lineWidth = line.width;
      ctx.beginPath();
      for (let i = 0; i < line.points.length; i++) {
        const p = line.points[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      // Draw glowing nodes at corners
      for (const p of line.points) {
        const nodeGlow = Math.sin(time * 0.002 + p.x * 0.01 + p.y * 0.01) * 0.5 + 0.5;
        const nodeOpacity = baseOpacity * (0.6 + nodeGlow * 0.4);

        // Node outer glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 5);
        grad.addColorStop(0, `rgba(100, 200, 255, ${nodeOpacity * 0.35})`);
        grad.addColorStop(1, `rgba(100, 200, 255, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = `rgba(150, 220, 255, ${nodeOpacity * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Traveling light pulse along the line
      const totalLen = line.points.reduce((sum, p, i) => {
        if (i === 0) return 0;
        const prev = line.points[i - 1];
        return sum + Math.hypot(p.x - prev.x, p.y - prev.y);
      }, 0);
      const t = ((time * 0.0002 * line.speed + line.glowPhase) % 1);
      let targetDist = t * totalLen;
      let px = line.points[0].x, py = line.points[0].y;
      for (let i = 1; i < line.points.length; i++) {
        const prev = line.points[i - 1];
        const curr = line.points[i];
        const segLen = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        if (targetDist <= segLen) {
          const ratio = targetDist / segLen;
          px = prev.x + (curr.x - prev.x) * ratio;
          py = prev.y + (curr.y - prev.y) * ratio;
          break;
        }
        targetDist -= segLen;
      }
      const pulseGrad = ctx.createRadialGradient(px, py, 0, px, py, 10);
      pulseGrad.addColorStop(0, "rgba(150, 230, 255, 0.4)");
      pulseGrad.addColorStop(0.5, "rgba(80, 180, 255, 0.12)");
      pulseGrad.addColorStop(1, "rgba(80, 180, 255, 0)");
      ctx.fillStyle = pulseGrad;
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center bright glow
    const centerGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.35);
    centerGrad.addColorStop(0, "rgba(80, 180, 255, 0.05)");
    centerGrad.addColorStop(0.4, "rgba(40, 120, 220, 0.02)");
    centerGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = centerGrad;
    ctx.fillRect(0, 0, w, h);

    animFrame = requestAnimationFrame(draw);
  }

  resize();
  init();
  animFrame = requestAnimationFrame(draw);

  const handleResize = () => {
    resize();
    init();
  };
  window.addEventListener("resize", handleResize);

  return () => {
    cancelAnimationFrame(animFrame);
    window.removeEventListener("resize", handleResize);
  };
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const line1Ref = useRef<HTMLParagraphElement>(null);
  const name1Ref = useRef<HTMLSpanElement>(null);
  const name2Ref = useRef<HTMLSpanElement>(null);
  const line3Ref = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const glowLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (canvasRef.current) {
      cleanup = createCircuitCanvas(canvasRef.current);
    }
    return () => cleanup?.();
  }, []);

  useEffect(() => {
    // Set initial states
    gsap.set(name1Ref.current, { clipPath: "inset(0 100% 0 0)" });
    gsap.set(name2Ref.current, { clipPath: "inset(0 100% 0 0)" });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Horizontal glow line sweeps across
    tl.fromTo(
      glowLineRef.current,
      { scaleX: 0, opacity: 1 },
      { scaleX: 1, duration: 0.8, ease: "power2.inOut" }
    )
      // "Nawawit" reveal left to right
      .to(
        name1Ref.current,
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 0.8,
          ease: "power4.inOut",
        },
        "-=0.3"
      )
      // "Pilanthanayothin" reveal left to right
      .to(
        name2Ref.current,
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 1,
          ease: "power4.inOut",
        },
        "-=0.4"
      )
      // Glow line fades out
      .to(glowLineRef.current, {
        opacity: 0,
        duration: 0.5,
      }, "-=0.3")
      // "nawawit.com" slides in
      .fromTo(
        line1Ref.current,
        { x: -30, opacity: 0, filter: "blur(8px)" },
        { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.7 },
        "-=0.3"
      )
      // "Since 1996" slides in
      .fromTo(
        line3Ref.current,
        { x: 30, opacity: 0, filter: "blur(8px)" },
        { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.7 },
        "-=0.5"
      )
      // Portfolio button fades in
      .fromTo(
        btnRef.current,
        { y: 15, opacity: 0, filter: "blur(6px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6 },
        "-=0.3"
      )
      // Subtle pulse on the whole content block
      .fromTo(
        contentRef.current,
        { scale: 0.98 },
        { scale: 1, duration: 0.6, ease: "power2.out" },
        "-=0.6"
      );
  }, []);

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
      {/* Animated circuit canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />

      {/* Main text content */}
      <div ref={contentRef} className="relative z-10 flex flex-col items-center gap-2 px-4" style={{ perspective: "600px" }}>
        <p
          ref={line1Ref}
          className="self-end mr-4 font-mono text-xs tracking-[0.4em] uppercase text-zinc-500 opacity-0 sm:text-sm"
        >
          nawawit.com
        </p>

        {/* Glow line */}
        <div
          ref={glowLineRef}
          className="h-[1px] w-full origin-left opacity-0"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.8) 30%, rgba(168,85,247,0.8) 70%, transparent)",
            boxShadow: "0 0 20px rgba(96,165,250,0.5), 0 0 40px rgba(168,85,247,0.3)",
          }}
        />

        <h1 className="font-sans text-left text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          <span
            ref={name1Ref}
            className="block bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
          >
            Nawawit
          </span>
          <span
            ref={name2Ref}
            className="block bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
          >
            Pilanthanayothin
          </span>
        </h1>

        <p
          ref={line3Ref}
          className="self-start ml-4 font-mono text-xs tracking-[0.4em] uppercase text-zinc-500 opacity-0 sm:text-sm"
        >
          Since 1996
        </p>

        <a
          ref={btnRef}
          href="https://portfolio.nawawit.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-6 py-2.5 font-mono text-xs tracking-widest uppercase text-blue-400 opacity-0 backdrop-blur-sm transition-all hover:border-blue-400/60 hover:bg-blue-500/20 hover:text-blue-300 hover:shadow-[0_0_20px_rgba(96,165,250,0.25)] sm:text-sm"
        >
          My Portfolio
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
  );
}
