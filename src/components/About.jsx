import { useEffect, useRef } from "react";
import { animate, onScroll, splitText, stagger } from "animejs";
import { CameraIcon } from "./Icons.jsx";
import { SITE } from "../data/site.js";
import { prefersReducedMotion } from "../lib/motion.js";

const STATS = [
  { label: "Camera", value: SITE.camera },
  { label: "Lens", value: SITE.lens },
  { label: "Focus", value: "Sport · Auto · Portrait" },
];

export default function About({ portrait }) {
  const root = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = root.current;
    const statement = el.querySelector(".about-statement");
    const photo = el.querySelector(".about-photo");
    const split = splitText(statement, { words: { wrap: "clip" } });
    statement.style.opacity = 1;
    const reveal = animate(split.words, {
      translateY: ["110%", "0%"],
      duration: 1100,
      delay: stagger(40),
      ease: "outExpo",
      autoplay: onScroll({ target: statement, enter: "bottom-=10% top", repeat: false }),
    });
    const parallax = animate(photo.querySelector("img"), {
      translateY: ["-7%", "7%"],
      ease: "linear",
      autoplay: onScroll({ target: photo, sync: true, enter: "bottom top", leave: "top bottom" }),
    });
    return () => {
      reveal.revert();
      parallax.revert();
      split.revert();
    };
  }, []);

  return (
    <section id="about" className="section about" ref={root}>
      <div className="container about-grid">
        <div className="about-stage" aria-hidden="true" />
        <div className="about-copy">
          <p className="eyebrow" data-reveal>About</p>
          <h2 className="about-statement">
            I shoot what moves me: fast games, loud engines and quiet faces, always looking for the light that tells the story.
          </h2>
          <p className="about-text" data-reveal>
            Photography is how I slow time down. Whether it's a keeper diving in the last minute, a car under exhibition lights or a stranger on a city street, I'm chasing honest, colourful frames.
          </p>
          <div className="about-row">
            <figure className="about-photo" data-reveal="far">
              <img src={`/photos/${portrait.id}-s.webp`} alt="" width={portrait.w} height={portrait.h} loading="lazy" decoding="async" />
            </figure>
            <ul className="gear" data-reveal>
              {STATS.map((s) => (
                <li key={s.label}>
                  <CameraIcon />
                  <span>
                    <small>{s.label}</small>
                    {s.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
