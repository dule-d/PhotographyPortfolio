import { InstagramIcon, ArrowIcon } from "./Icons.jsx";
import { SITE } from "../data/site.js";

export default function Contact() {
  return (
    <section id="contact" className="section contact">
      <div className="container contact-inner">
        <p className="eyebrow" data-reveal>Let's work together</p>
        <h2 className="contact-title" data-reveal>
          Got a game, a car or a
          <em> story </em>
          to shoot?
        </h2>
        <p className="contact-text" data-reveal>
          The quickest way to reach me is Instagram. Send a message, tell me what you have in mind and let's make something.
        </p>
        <a className="btn btn-primary btn-xl" data-reveal href={SITE.instagram} target="_blank" rel="noopener noreferrer">
          <InstagramIcon /> {SITE.handle}
          <ArrowIcon />
        </a>
      </div>
    </section>
  );
}
