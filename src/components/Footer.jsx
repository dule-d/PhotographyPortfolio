import { InstagramIcon } from "./Icons.jsx";
// import { MODEL_CREDIT, NAV, SITE } from "../data/site.js";
import logoWhite from "../assets/logo-white.png";
import logoBlack from "../assets/logo-black.png";
import { prefersReducedMotion } from "../lib/motion.js";

export default function Footer({ theme }) {
  const year = new Date().getFullYear();
  const go = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src={theme === "dark" ? logoWhite : logoBlack} alt="DK logo" width="64" height="64" loading="lazy" />
          <p>
            Photography by {SITE.name}.
            <br />
            Shot on {SITE.camera} + {SITE.lens}.
          </p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <h3>Explore</h3>
          <a href="#home" onClick={go("home")}>
            Home
          </a>
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={go(n.id)}>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="footer-links">
          <h3>Follow</h3>
          <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="footer-ig">
            <InstagramIcon /> {SITE.handle}
          </a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>
          © {year} {SITE.name}. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
