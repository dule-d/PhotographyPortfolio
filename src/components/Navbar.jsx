import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { SunIcon, MoonIcon, InstagramIcon } from "./Icons.jsx";
import { NAV, SITE } from "../data/site.js";
import logoWhite from "../assets/logo-white.png";
import logoBlack from "../assets/logo-black.png";
import { prefersReducedMotion } from "../lib/motion.js";

export default function Navbar({ theme, onToggleTheme, active, menuOpen, setMenuOpen, started }) {
  const bar = useRef(null);
  const thumb = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    if (!started || prefersReducedMotion()) return;
    const a = animate(bar.current, { opacity: [0, 1], duration: 1100, ease: "outExpo" });
    return () => a.revert();
  }, [started]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (prefersReducedMotion()) return;
    const a = animate(thumb.current, { rotate: [-90, 0], scale: [0.5, 1], duration: 700, ease: "outElastic(1, .6)" });
    return () => a.revert();
  }, [theme]);

  const go = (id) => (e) => {
    e.preventDefault();
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <header className={`nav ${menuOpen ? "is-open" : ""}`} ref={bar}>
      <div className="nav-inner">
        <a className="nav-logo" href="#home" onClick={go("home")} aria-label="DK — back to top">
          <img src={theme === "dark" ? logoWhite : logoBlack} alt="" width="40" height="40" />
        </a>

        <nav className="nav-links" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={go(item.id)}
              className={active === item.id ? "is-active" : ""}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <a
            className="icon-btn nav-ig"
            href={SITE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <InstagramIcon />
          </a>
          <button
            type="button"
            className="theme-switch"
            role="switch"
            aria-checked={theme === "light"}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={onToggleTheme}
          >
            <MoonIcon className="ts-moon" />
            <SunIcon className="ts-sun" />
            <span className="ts-thumb" ref={thumb} />
          </button>
          <button
            type="button"
            className="burger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className="mobile-menu" id="mobile-menu" aria-hidden={!menuOpen} inert={!menuOpen}>
        {NAV.map((item, i) => (
          <a key={item.id} href={`#${item.id}`} onClick={go(item.id)} style={{ "--i": i }}>
            <small>0{i + 1}</small>
            {item.label}
          </a>
        ))}
        <a
          className="mobile-ig"
          href={SITE.instagram}
          target="_blank"
          rel="noopener noreferrer"
          style={{ "--i": NAV.length }}
        >
          <InstagramIcon /> {SITE.handle}
        </a>
      </div>
    </header>
  );
}
