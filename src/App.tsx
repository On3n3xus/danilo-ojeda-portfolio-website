import { useEffect } from "react";
import { ScrollScrub } from "./components/scroll-scrub/scroll-scrub";
import { scrollScrubScenes, scrollScrubTheme } from "./scroll-scrub-scenes";

const projects = [
  { name: "WYN Intelligence", field: "Commercial real estate", status: "In production", summary: "A broker command center that joins listings, campaigns, follow-up, and deal activity in one operating record.", role: "Product strategy, workflow design, AI layer, implementation" },
  { name: "Miguel Closes", field: "Real estate growth", status: "Live", summary: "A public website and GoHighLevel pipeline that captures, nurtures, and books while the agent is in the field.", role: "Site, funnel, CRM workflow, nurture, booking", href: "https://miguelcloses.com" },
  { name: "Neurospark", field: "Founder venture", status: "Live", summary: "An AI marketing company building agents that live in a client stack and ship useful work around the clock.", role: "Founder, brand, agent architecture, delivery systems", href: "https://neurosparkmarketing.com" },
  { name: "MicroCommit", field: "AI product lab", status: "iOS build", summary: "An adaptive habit product testing AI coaching, behavioral loops, and community accountability.", role: "Product design, application build, behavioral model, AI coach" },
];
const record = [
  ["2026 to now", "WYN Group", "AI Growth and Innovation Manager"],
  ["2024 to now", "Optum", "Cybersecurity Analyst, IAM and PAM"],
  ["2026", "EVIA Partners", "AI Engineer, contract"],
  ["2015 to 2024", "Allina Health", "Information Security and Security Analyst"],
  ["2014 to 2015", "St. Jude Medical", "Identity and Access Management Analyst"],
];


const navSections = [
  { id: "top", label: "Intro" },
  { id: "work", label: "Work" },
  { id: "record", label: "Record" },
  { id: "contact", label: "Contact" },
] as const;

function usePageMotion() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".site-shell");
    if (!shell) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealTargets = [...shell.querySelectorAll<HTMLElement>("[data-reveal]")];
    shell.dataset.motionReady = "true";

    let observer: IntersectionObserver | undefined;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => { target.dataset.revealed = "true"; });
    } else {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = "true";
            observer?.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.14 });
      revealTargets.forEach((target) => observer?.observe(target));
    }

    const navLinks = [...shell.querySelectorAll<HTMLAnchorElement>("[data-nav-section]")];
    const navLabel = shell.querySelector<HTMLElement>("[data-nav-label]");
    const recordSection = shell.querySelector<HTMLElement>("#record");
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      const pageRange = Math.max(document.documentElement.scrollHeight - viewportHeight, 1);
      const pageProgress = Math.min(Math.max(window.scrollY / pageRange, 0), 1);
      shell.style.setProperty("--page-progress", String(pageProgress));

      let active: (typeof navSections)[number] = navSections[0];
      const marker = viewportHeight * 0.38;
      navSections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= marker) active = section;
      });

      if (navLabel && navLabel.textContent !== active.label) navLabel.textContent = active.label;
      navLinks.forEach((link) => {
        const isActive = link.dataset.navSection === active.id;
        link.toggleAttribute("data-active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });

      if (recordSection && !reducedMotion) {
        const rect = recordSection.getBoundingClientRect();
        const local = Math.min(Math.max((viewportHeight - rect.top) / (viewportHeight + rect.height), 0), 1);
        shell.style.setProperty("--portrait-shift", String((local * 36 - 18).toFixed(2)) + "px");
      }
    };

    const queueUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    return () => {
      observer?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      shell.style.removeProperty("--page-progress");
      shell.style.removeProperty("--portrait-shift");
      delete shell.dataset.motionReady;
    };
  }, []);
}

export default function App() {
  usePageMotion();

  return <main className="site-shell">
    <header className="site-nav">
      <a className="nav-mark" href="#top" aria-label="Danilo Ojeda, home" data-nav-section="top"><span>DO</span><b>Danilo Ojeda</b></a>
      <div className="nav-state" aria-hidden="true"><i /><span data-nav-label>Intro</span></div>
      <nav aria-label="Primary navigation"><a href="#work" data-nav-section="work">Work</a><a href="#record" data-nav-section="record">Record</a><a className="nav-contact" href="#contact" data-nav-section="contact">Map my pipeline</a></nav>
      <div className="nav-progress" aria-hidden="true"><span /></div>
    </header>
    <div id="top" className="journey-wrap">
      <ScrollScrub scenes={scrollScrubScenes} theme={scrollScrubTheme} />
      <div className="journey-key" aria-label="The lead journey"><span>Signal</span><i/><span>Voice</span><i/><span>Intent</span><i/><span>CRM</span><i/><span>Booked</span></div>
    </div>
    <section className="project-section" id="work" aria-labelledby="work-title">
      <div className="section-heading reveal-target" data-reveal><p>Selected systems</p><h2 id="work-title">The work is the interface.</h2><span>Each system connects a real operating problem to a working path.</span></div>
      <div className="project-canvas">
        <figure className="project-plate reveal-target" data-reveal><img src="/assets/projects-plate.png" alt="Abstract liquid system map in the Living Signal visual language" loading="lazy" /></figure>
        <div className="project-index">{projects.map((project) => <article className="project-row reveal-target" data-reveal key={project.name} onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--spot-x", String(event.clientX - rect.left) + "px");
          event.currentTarget.style.setProperty("--spot-y", String(event.clientY - rect.top) + "px");
        }}>
          <div className="project-meta"><span>{project.field}</span><em>{project.status}</em></div><h3>{project.name}</h3><p>{project.summary}</p><small>{project.role}</small>
          {project.href ? <a href={project.href} target="_blank" rel="noreferrer">Visit live site</a> : null}
        </article>)}</div>
      </div>
    </section>
    <section className="record-section" id="record" aria-labelledby="record-title">
      <div className="portrait-column reveal-target" data-reveal><figure className="portrait-frame"><img src="/assets/danilo-headshot.webp" alt="Danilo Ojeda" loading="lazy" /><figcaption>Minneapolis, Minnesota</figcaption></figure><p>Eleven years in identity, privileged access, and enterprise security shape how every automation gets designed.</p></div>
      <div className="record-column"><p className="section-label reveal-target" data-reveal>Operating record</p><h2 id="record-title" className="reveal-target" data-reveal>Built with respect for access, data, and failure.</h2><div className="career-list">{record.map(([period, company, role]) => <article className="reveal-target" data-reveal key={period + "-" + company}><time>{period}</time><h3>{company}</h3><p>{role}</p></article>)}</div></div>
    </section>
    <section className="practice-section" aria-labelledby="practice-title">
      <img className="practice-icons reveal-target" data-reveal src="/assets/signal-icons.png" alt="Custom icons for capture, voice, intent, routing, and meeting" loading="lazy" />
      <h2 id="practice-title" className="reveal-target" data-reveal>One visible path. Fewer dropped handoffs.</h2>
      <div className="practice-principles reveal-target" data-reveal><article><h3>Capture the context</h3><p>Keep the source, question, and timing attached to every inquiry.</p></article><article><h3>Route with intent</h3><p>Move useful facts into the system people already trust.</p></article><article><h3>Keep moving</h3><p>Follow-up continues without hiding the work or the ownership.</p></article></div>
    </section>
    <section className="contact-section" id="contact" aria-labelledby="contact-title">
      <img src="/assets/contact-plate.png" alt="A luminous signal arriving at its final aperture" loading="lazy" />
      <div className="contact-copy"><p>Start with the first broken handoff.</p><h2 id="contact-title">Map your pipeline.</h2><a href="mailto:danilo@neurosparkmarketing.com">Start a conversation</a></div>
    </section>
    <footer><p>Danilo Ojeda</p><nav aria-label="Social links"><a href="https://www.linkedin.com/in/daniloojeda/" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://www.instagram.com/daniloojeda_/" target="_blank" rel="noreferrer">Instagram</a></nav><small>AI systems for commercial real estate</small></footer>
  </main>;
}
