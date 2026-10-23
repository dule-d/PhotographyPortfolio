import { useEffect, useRef } from "react";
import { animate, createTimeline, splitText, stagger } from "animejs";
import { prefersReducedMotion } from "../lib/motion.js";
import { assetUrl } from "../lib/assets.js";

export default function Loader({ ready, onDone }) {
  const root = useRef(null);
  const label = useRef(null);
  const bar = useRef(null);
  const doneRef = useRef(onDone);
  const minTime = useRef(false);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const split = reduced ? null : splitText(label.current, { chars: { wrap: "clip" } });
    const intro = split
      ? animate(split.chars, {
          translateY: ["110%", "0%"],
          delay: stagger(60),
          duration: 900,
          ease: "outExpo",
        })
      : null;
    const progress = reduced
      ? null
      : animate(bar.current, { scaleX: [0, 0.85], duration: 2400, ease: "outQuart" });
    const timer = setTimeout(() => {
      minTime.current = true;
      root.current?.dispatchEvent(new Event("min"));
    }, reduced ? 100 : 1100);
    return () => {
      clearTimeout(timer);
      intro?.revert();
      progress?.revert();
      split?.revert();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const el = root.current;
    let tl;
    let completionTimer;
    const run = () => {
      if (prefersReducedMotion()) {
        completionTimer = setTimeout(() => doneRef.current(), 0);
        return;
      }
      const tiles = el.querySelectorAll(".loader-tile");
      tl = createTimeline({ onComplete: () => doneRef.current() });
      tl.add(bar.current, { scaleX: 1, duration: 350, ease: "outQuad" })
        .add(".loader-inner", { opacity: 0, translateY: -30, duration: 450, ease: "inQuad" }, "+=80")
        .add(tiles, { translateY: ["0%", "-101%"], duration: 950, delay: stagger(80, { from: "center" }), ease: "inOutExpo" }, "-=150");
    };
    if (minTime.current) run();
    else el.addEventListener("min", run, { once: true });
    return () => {
      el.removeEventListener("min", run);
      clearTimeout(completionTimer);
      tl?.revert();
    };
  }, [ready]);

  const colors = ["#ff6b97", "#ffb570", "#ffe478", "#cfff70", "#66ffe3", "#4da6ff"];
  return (
    <div className="loader" ref={root} role="status" aria-label="Loading">
      <div className="loader-tiles" aria-hidden="true">
        {colors.map((c, i) => (
          <span key={i} className="loader-tile" style={{ "--c": c }} />
        ))}
      </div>
      <div className="loader-inner">
        <img className="loader-logo" src={assetUrl("favicon.png")} alt="" width="84" height="84" />
        <p className="loader-label" ref={label}>
          Developing
        </p>
        <div className="loader-track">
          <span className="loader-bar" ref={bar} />
        </div>
      </div>
    </div>
  );
}
