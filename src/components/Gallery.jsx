import { memo, useEffect, useRef } from "react";
import { observeTile } from "../lib/reveal.js";
import { assetUrl } from "../lib/assets.js";

const Tile = memo(function Tile({ photo, index, onOpen }) {
  const ref = useRef(null);
  useEffect(() => observeTile(ref.current), []);
  return (
    <button
      type="button"
      className="tile"
      ref={ref}
      onClick={() => onOpen(index)}
      aria-label={`Open ${photo.category.toLowerCase()} photo ${index + 1}`}
      style={{ aspectRatio: `${photo.w} / ${photo.h}`, "--tile": photo.color }}
    >
      <img
        src={assetUrl(`photos/${photo.id}-s.webp`)}
        srcSet={`${assetUrl(`photos/${photo.id}-m.webp`)} 360w, ${assetUrl(`photos/${photo.id}-s.webp`)} 720w`}
        sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
        width={photo.w}
        height={photo.h}
        alt=""
        loading="lazy"
        decoding="async"
        draggable="false"
      />
      <span className="tile-curtain" aria-hidden="true" />
    </button>
  );
});

export default function Gallery({ photos, categories, filter, setFilter, visible, onMore, onOpen }) {
  const shown = photos.slice(0, visible);
  return (
    <section id="work" className="section work">
      <div className="container">
        <header className="section-head" data-reveal>
          <p className="eyebrow">Selected work</p>
          <h2>Frames I'm proud of</h2>
        </header>

        <div className="filters" role="tablist" aria-label="Filter photos" data-reveal>
          {["All", ...categories.filter((category) => category !== "Portrait")].map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={filter === c}
              className={`chip ${filter === c ? "is-active" : ""}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="masonry" key={filter}>
          {shown.map((p, i) => (
            <Tile key={p.id} photo={p} index={i} onOpen={onOpen} />
          ))}
        </div>

        {visible < photos.length && (
          <div className="more">
            <button type="button" className="btn btn-ghost" onClick={onMore}>
              Show more ({photos.length - visible})
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
