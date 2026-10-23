import { useEffect, useRef } from "react";
import { animate, createTimeline, stagger } from "animejs";
import { ArrowDownIcon, CameraIcon } from "./Icons.jsx";
import { SITE } from "../data/site.js";
import { prefersReducedMotion } from "../lib/motion.js";

export default function Hero({ started, featured }) {
  const root = useRef(null);
  const title = useRef(null);

  useEffect(() => {
    if (!started) return;
    const el = root.current;
    if (prefersReducedMotion()) {
      el.querySelectorAll(".hero-title, .hero-eyebrow, .hero-lead, .hero-gear, .hero-cta, .hero-chip, .scroll-hint")
        .forEach((node) => (node.style.opacity = 1));
      return;
    }
    const tl = createTimeline({ defaults: { ease: "outExpo" } });
    tl.add(title.current, { opacity: [0, 1], translateY: [56, 0], duration: 1300 }, 0)
      .add(el.querySelectorAll(".hero-eyebrow, .hero-lead, .hero-gear, .hero-cta"), { opacity: [0, 1], translateY: [28, 0], duration: 1100, delay: stagger(110) }, 350)
      .add(el.querySelectorAll(".hero-chip"), { opacity: [0, 1], scale: [0.4, 1], rotate: [-18, 0], duration: 1200, delay: stagger(110), ease: "outBack(2)" }, 600)
      .add(el.querySelector(".scroll-hint"), { opacity: [0, 1], duration: 900, ease: "linear" }, 1500);

    const bob = animate(el.querySelector(".scroll-hint svg"), { translateY: [0, 8], duration: 900, alternate: true, loop: true, ease: "inOutSine" });
    return () => {
      bob.revert();
      tl.revert();
    };
  }, [started]);

  return (
    <section id="home" className="hero" ref={root}>
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span className="dot" /> Photographer · North Macedonia
          </p>
          <h1 className="hero-title" ref={title} aria-label="Light, motion and moments.">
            Light, motion &amp; moments.
          </h1>
          <p className="hero-lead">
            I'm Dusko, a photographer chasing split seconds, from matchday floodlights to chrome and city streets.
          </p>
          <p className="hero-gear">
            <CameraIcon />
            <span>
              Shot on a <strong>{SITE.camera}</strong> with a <strong>{SITE.lens}</strong>
            </span>
          </p>
          <div className="hero-cta">
            <a
              className="btn btn-primary"
              href="#work"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("work")?.scrollIntoView({
                  behavior: prefersReducedMotion() ? "auto" : "smooth",
                });
              }}
            >
              View the work
            </a>
            <a className="btn btn-ghost" href={SITE.instagram} target="_blank" rel="noopener noreferrer">
              Follow on Instagram
            </a>
          </div>
        </div>

        <div className="hero-chips" aria-hidden="true">
          {featured.map((p, i) => (
            <figure className={`hero-chip chip-${i}`} key={p.id} style={{ "--chip": p.color }}>
              <img src={`/photos/${p.id}-m.webp`} alt="" width="360" height="450" decoding="async" loading="eager" />
            </figure>
          ))}
        </div>
      </div>

      <div className="scroll-hint" aria-hidden="true">
        <span>Scroll</span>
        <ArrowDownIcon />
      </div>
    </section>
  );
}
