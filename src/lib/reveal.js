import { animate, createTimeline } from "animejs";
import { PALETTE, prefersReducedMotion } from "./motion.js";

const whenLoaded = (img) =>
  img.complete && img.naturalWidth > 0
    ? Promise.resolve()
    : new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });

let tileObserver = null;
let tileCounter = 0;

function playTile(tile, order) {
  const img = tile.querySelector("img");
  const curtain = tile.querySelector(".tile-curtain");
  whenLoaded(img).then(() => {
    const color = PALETTE[tileCounter++ % PALETTE.length];
    curtain.style.background = color;
    const delay = order * 90;
    const tl = createTimeline({ delay, onComplete: () => curtain.remove() });
    tl.add(curtain, { scaleY: [1, 0], duration: 950, ease: "inOutExpo" }, 0)
      .add(img, { opacity: [0, 1], duration: 300, ease: "linear" }, 120)
      .add(img, { scale: [1.35, 1], duration: 1500, ease: "outQuart" }, 0);
  });
}

// One shared observer; tiles entering together get a staggered reveal.
export function observeTile(tile) {
  if (prefersReducedMotion()) {
    tile.querySelector(".tile-curtain")?.remove();
    return () => {};
  }
  tileObserver ??= new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((entry, i) => {
          tileObserver.unobserve(entry.target);
          playTile(entry.target, i);
        });
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
  );
  tileObserver.observe(tile);
  return () => tileObserver?.unobserve(tile);
}

// Generic fade/slide-up for anything marked [data-reveal].
export function revealOnScroll(root = document) {
  const items = [...root.querySelectorAll("[data-reveal]")];
  if (prefersReducedMotion()) {
    items.forEach((el) => (el.style.opacity = "1"));
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .forEach((entry, i) => {
          const el = entry.target;
          io.unobserve(el);
          animate(el, {
            opacity: [0, 1],
            translateY: [el.dataset.reveal === "far" ? 90 : 44, 0],
            delay: i * 90 + Number(el.dataset.delay || 0),
            duration: 1100,
            ease: "outExpo",
          });
        });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  items.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
