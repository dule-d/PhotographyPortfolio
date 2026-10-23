import { useEffect, useMemo, useRef } from "react";
import { animate, stagger, utils } from "animejs";
import { PALETTE, prefersReducedMotion } from "../lib/motion.js";

const HEX_CLIP = "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)";

function buildBlocks(width, height, cell) {
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const count = width < 820 ? 9 : 20;
  const taken = new Set();
  const blocks = [];
  let guard = 0;
  while (blocks.length < count && guard++ < 400) {
    const col = utils.random(0, cols - 1);
    const row = utils.random(0, rows - 1);
    const key = `${col}:${row}`;
    if (taken.has(key)) continue;
    taken.add(key);
    // Occasionally merge into 2x2 so the checker reads as a composed pattern, not noise.
    const size = Math.random() < 0.22 ? 2 : 1;
    blocks.push({
      key,
      x: col * cell,
      y: row * cell,
      size: size * cell,
      color: PALETTE[blocks.length % PALETTE.length],
      hex: Math.random() < 0.3,
    });
  }
  return blocks;
}

export default function Background() {
  const layer = useRef(null);
  const [blocks, cell] = useMemo(() => {
    const w = window.innerWidth;
    const c = w < 820 ? 48 : 64;
    return [buildBlocks(w, window.innerHeight, c), c];
  }, []);

  useEffect(() => {
    const nodes = layer.current?.querySelectorAll(".bg-block");
    if (!nodes?.length || prefersReducedMotion()) return;
    const anim = animate(nodes, {
      opacity: [{ to: () => utils.random(0.14, 0.3, 2), duration: () => utils.random(1800, 3600) }, { to: 0.03, duration: () => utils.random(1800, 3600) }],
      scale: [{ to: 1, duration: 0 }, { to: 0.86, duration: () => utils.random(1800, 3600) }, { to: 1, duration: () => utils.random(1800, 3600) }],
      delay: stagger(240, { from: "random" }),
      ease: "inOutSine",
      loop: true,
    });
    return () => anim.revert();
  }, [blocks]);

  return (
    <div className="bg" aria-hidden="true" ref={layer} style={{ "--cell": `${cell}px` }}>
      <div className="bg-checker" />
      <div className="bg-hex" />
      {blocks.map((b) => (
        <span
          key={b.key}
          className="bg-block"
          style={{
            width: b.size,
            height: b.size,
            left: b.x,
            top: b.y,
            background: b.color,
            clipPath: b.hex ? HEX_CLIP : undefined,
          }}
        />
      ))}
      <div className="bg-glow" />
    </div>
  );
}

