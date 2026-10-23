import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { ChevronIcon, CloseIcon } from "./Icons.jsx";
import { prefersReducedMotion } from "../lib/motion.js";
import { assetUrl } from "../lib/assets.js";

export default function Lightbox({ photos, index, onClose, onIndex }) {
  const root = useRef(null);
  const img = useRef(null);
  const touch = useRef(null);
  const [loadedId, setLoadedId] = useState(null);
  const photo = photos[index];
  const loaded = loadedId === photo.id;

  const step = useCallback((d) => onIndex((index + d + photos.length) % photos.length), [index, photos.length, onIndex]);

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
    if (!loaded || prefersReducedMotion()) return;
    const a = animate(img.current, { opacity: [0, 1], scale: [0.94, 1], duration: 700, ease: "outExpo" });
    return () => a.revert();
  }, [loaded, index]);

  const onTouchStart = (e) => (touch.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
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
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
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
