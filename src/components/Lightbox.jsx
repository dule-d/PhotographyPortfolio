import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { ChevronIcon, CloseIcon } from "./Icons.jsx";
import { prefersReducedMotion } from "../lib/motion.js";
import { assetUrl } from "../lib/assets.js";

export default function Lightbox({ photos, index, onClose, onIndex }) {
  const root = useRef(null);
  const img = useRef(null);
  const zoom = useRef({ scale: 1, x: 0, y: 0 });
  const gesture = useRef({ mode: "idle" });
  const [loadedId, setLoadedId] = useState(null);
  const photo = photos[index];
  const loaded = loadedId === photo.id;

  const step = useCallback((d) => onIndex((index + d + photos.length) % photos.length), [index, photos.length, onIndex]);
  const applyZoom = useCallback((scale, x, y) => {
    const image = img.current;
    if (!image) return;

    scale = Math.max(1, Math.min(4, scale));
    if (scale === 1) {
      x = 0;
      y = 0;
    } else {
      const figure = image.closest(".lb-figure");
      const maxX = Math.max(0, (image.offsetWidth * scale - (figure?.clientWidth ?? image.offsetWidth)) / 2);
      const maxY = Math.max(0, (image.offsetHeight * scale - (figure?.clientHeight ?? image.offsetHeight)) / 2);
      x = Math.max(-maxX, Math.min(maxX, x));
      y = Math.max(-maxY, Math.min(maxY, y));
    }

    zoom.current = { scale, x, y };
    image.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, []);

  useEffect(() => {
    const el = root.current;
    const previous = document.activeElement;
    document.body.classList.add("no-scroll");
    el.focus();
    const a = prefersReducedMotion()
      ? null
      : animate(el, { opacity: [0, 1], duration: 350, ease: "outQuad" });
    return () => {
      a?.revert();
      document.body.classList.remove("no-scroll");
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  useEffect(() => {
    const next = photos[(index + 1) % photos.length];
    const prev = photos[(index - 1 + photos.length) % photos.length];
    [next, prev].forEach((p) => {
      const i = new Image();
      i.src = assetUrl(`photos/${p.id}-l.webp`);
    });
  }, [index, photos]);

  useEffect(() => {
    zoom.current = { scale: 1, x: 0, y: 0 };
    gesture.current = { mode: "idle" };
    if (img.current) img.current.style.transform = "translate3d(0, 0, 0) scale(1)";
  }, [photo.id]);

  useEffect(() => {
    if (!loaded || prefersReducedMotion()) return;
    const a = animate(img.current, { opacity: [0, 1], duration: 700, ease: "outExpo" });
    return () => a.revert();
  }, [loaded, index]);

  const onTouchStart = (e) => {
    if (e.touches.length > 1) {
      const [first, second] = e.touches;
      gesture.current = {
        mode: "pinch",
        startDistance: Math.max(1, Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)),
        startCenterX: (first.clientX + second.clientX) / 2,
        startCenterY: (first.clientY + second.clientY) / 2,
        startScale: zoom.current.scale,
        startX: zoom.current.x,
        startY: zoom.current.y,
      };
      return;
    }

    const point = e.touches[0];
    gesture.current = {
      mode: zoom.current.scale > 1 ? "pan" : "swipe",
      startX: point.clientX,
      startY: point.clientY,
      offsetX: zoom.current.x,
      offsetY: zoom.current.y,
    };
  };

  const onTouchMove = (e) => {
    const current = gesture.current;
    if (e.touches.length > 1) {
      const [first, second] = e.touches;
      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      const centerX = (first.clientX + second.clientX) / 2;
      const centerY = (first.clientY + second.clientY) / 2;
      if (current.mode !== "pinch") {
        gesture.current = {
          mode: "pinch",
          startDistance: Math.max(1, distance),
          startCenterX: centerX,
          startCenterY: centerY,
          startScale: zoom.current.scale,
          startX: zoom.current.x,
          startY: zoom.current.y,
        };
        return;
      }

      const scale = current.startScale * (distance / current.startDistance);
      applyZoom(
        scale,
        current.startX + centerX - current.startCenterX,
        current.startY + centerY - current.startCenterY,
      );
      return;
    }

    if (current.mode === "pan" && e.touches.length === 1) {
      const point = e.touches[0];
      applyZoom(
        zoom.current.scale,
        current.offsetX + point.clientX - current.startX,
        current.offsetY + point.clientY - current.startY,
      );
    }
  };

  const onTouchEnd = (e) => {
    const current = gesture.current;
    if (current.mode === "pinch" && e.touches.length === 1 && zoom.current.scale > 1) {
      const point = e.touches[0];
      gesture.current = {
        mode: "pan",
        startX: point.clientX,
        startY: point.clientY,
        offsetX: zoom.current.x,
        offsetY: zoom.current.y,
      };
      return;
    }

    if (current.mode === "swipe" && e.changedTouches.length > 0) {
      const dx = e.changedTouches[0].clientX - current.startX;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    }
    if (e.touches.length === 0) gesture.current = { mode: "idle" };
  };

  const onTouchCancel = () => {
    gesture.current = { mode: "idle" };
  };

  return (
    <div
      className="lightbox"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      tabIndex={-1}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button type="button" className="lb-btn lb-close" onClick={onClose} aria-label="Close">
        <CloseIcon />
      </button>
      <button type="button" className="lb-btn lb-prev" onClick={() => step(-1)} aria-label="Previous photo">
        <ChevronIcon dir="left" />
      </button>
      <button type="button" className="lb-btn lb-next" onClick={() => step(1)} aria-label="Next photo">
        <ChevronIcon />
      </button>

      <figure className="lb-figure" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img
          key={photo.id}
          ref={img}
          src={assetUrl(`photos/${photo.id}-l.webp`)}
          alt={`${photo.category} photograph by DK`}
          style={{ opacity: loaded ? undefined : 0 }}
          onLoad={() => setLoadedId(photo.id)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          draggable="false"
        />
        {!loaded && <span className="lb-spinner" aria-hidden="true" />}
        <figcaption>
          {index + 1} / {photos.length}
        </figcaption>
      </figure>
    </div>
  );
}
