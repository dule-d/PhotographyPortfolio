import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import data from "./data/photos.json";
import Background from "./components/Background.jsx";
import Loader from "./components/Loader.jsx";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Gallery from "./components/Gallery.jsx";
import Lightbox from "./components/Lightbox.jsx";
import About from "./components/About.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import { revealOnScroll } from "./lib/reveal.js";
import { prefersReducedMotion } from "./lib/motion.js";

const FEATURED = ["pobeda-fkpobeda-post-2", "car-exh-carexhib-4", "solun-solun-8722"].map((id) => data.photos.find((p) => p.id === id)).filter(Boolean);
const PORTRAIT = data.photos.find((p) => p.id === "eksportirani-viktor-viktorce-10") ?? data.photos[0];
const PAGE = 16;
const SECTION_IDS = ["home", "work", "about", "contact"];

export default function App() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "dark");
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [filter, setFilter] = useState("All");
  const [visible, setVisible] = useState(PAGE);
  const [lightbox, setLightbox] = useState(null);
  const sceneHost = useRef(null);
  const scene = useRef(null);

  const photos = useMemo(() => (filter === "All" ? data.photos : data.photos.filter((p) => p.category === filter)), [filter]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.background = "";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#ffffeb" : "#272736");
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* storage unavailable */
    }
    scene.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    let instance = null;
    const reduced = prefersReducedMotion();
    const hasGL = (() => {
      try {
        return !!document.createElement("canvas").getContext("webgl2");
      } catch {
        return false;
      }
    })();
    const timeout = new Promise((r) => setTimeout(r, 1800));

    const sceneReady = hasGL
      ? import("./scene/engine.js")
          .then(({ createScene }) => {
            if (cancelled) return true;
            instance = createScene(sceneHost.current, { theme: document.documentElement.dataset.theme, reducedMotion: reduced });
            scene.current = instance;
            return instance.ready;
          })
          .catch((error) => {
            console.error("Could not start the 3D camera scene", error);
            return true;
          })
      : Promise.resolve(true);
    Promise.race([sceneReady, timeout]).then(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
      instance?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    if (!started) return;
    const off = revealOnScroll();
    return off;
  }, [started]);

  useEffect(() => {
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("no-scroll", menuOpen || !started);
  }, [menuOpen, started]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (started) scene.current?.refresh();
  }, [started, visible, filter]);

  const onFilter = useCallback((value) => {
    setFilter(value);
    setVisible(PAGE);
  }, []);
  const onDone = useCallback(() => setStarted(true), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <>
      <Background />
      <div className="scene" ref={sceneHost} aria-hidden="true" />
      {!started && <Loader ready={ready} onDone={onDone} />}

      <Navbar theme={theme} onToggleTheme={toggleTheme} active={active} menuOpen={menuOpen} setMenuOpen={setMenuOpen} started={started} />

      <main>
        <Hero started={started} featured={FEATURED} />
        <Gallery
          photos={photos}
          categories={data.categories}
          filter={filter}
          setFilter={onFilter}
          visible={visible}
          onMore={() => setVisible((v) => v + PAGE)}
          onOpen={setLightbox}
        />
        <About portrait={PORTRAIT} />
        <Contact />
      </main>
      <Footer theme={theme} />

      {lightbox != null && photos[lightbox] && (
        <Lightbox photos={photos} index={lightbox} onClose={closeLightbox} onIndex={setLightbox} />
      )}
    </>
  );
}
