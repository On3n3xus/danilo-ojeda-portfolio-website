import { useEffect, useState } from "react";
import "./project-showcase.css";
import { DemoPlayer, PreviewDialog, WorkflowPlayer } from "./ShowcaseExtras";
const projects = [
  { name: "WYN Intelligence", field: "Commercial real estate", status: "In production", summary: "A broker command center that joins listings, campaigns, follow-up, and deal activity in one operating record.", role: "Product strategy, workflow design, AI layer, implementation" },
  { name: "Miguel Closes", field: "Real estate growth", status: "Live", summary: "A public website and GoHighLevel pipeline that captures, nurtures, and books while the agent is in the field.", role: "Site, funnel, CRM workflow, nurture, booking", href: "https://miguelcloses.com" },
  { name: "Neurospark", field: "Founder venture", status: "Live", summary: "An AI marketing company building agents that live in a client stack and ship useful work around the clock.", role: "Founder, brand, agent architecture, delivery systems", href: "https://neurosparkmarketing.com" },
  { name: "Cortez Landscaping", field: "Local business growth", status: "Live", summary: "A cinematic lead-generation website for a family-owned Twin Cities landscaping company, built to turn project proof into estimate requests.", role: "Brand direction, website design, media system, performance, conversion path", href: "https://cortez-landscaping.vercel.app" },
  { name: "MicroCommit", field: "AI product lab", status: "iOS build", summary: "An adaptive habit product testing AI coaching, behavioral loops, and community accountability.", role: "Product design, application build, behavioral model, AI coach" },
  { name: "WYN Group website", field: "Commercial real estate website", status: "Live", summary: "A public website bringing WYN Group’s services, property portfolio, team, and inquiry paths into one place.", role: "Website design, implementation, and inquiry experience", href: "https://wyngroup.com" },
];

const presentations = [
  { label: "Workflow illustration", title: "A clearer view of the deal.", image: "", problem: "Listings, conversations, and follow-up can become disconnected.", approach: "Bring the working context into one broker command center.", steps: ["Listings", "Campaigns", "Follow-up", "Deal activity"] },
  { label: "Website capture", title: "From first visit to next conversation.", image: "/miguel-closes-live.jpg", problem: "An agent needs a way to capture inquiries while working in the field.", approach: "Connect the public website to a CRM, nurture, and booking workflow.", steps: ["Website", "Inquiry", "Nurture", "Booking"] },
  { label: "Website capture", title: "Useful AI, inside the business.", image: "/neurospark-live.jpg", problem: "Useful AI needs to fit the way a business already operates.", approach: "Design agents and delivery systems around the client’s working stack.", steps: ["Context", "Agent", "Review", "Delivery"] },
  { label: "Workflow illustration", title: "The work earns the next inquiry.", image: "", problem: "Visitors need to see the quality of the work before requesting an estimate.", approach: "Build a visual website around project proof and a clear estimate request path.", steps: ["Project proof", "Services", "Inquiry", "Estimate request"] },
  { label: "Product concept illustration", title: "Make the next commitment smaller.", image: "", problem: "A habit product needs to help people return and take the next small step.", approach: "Explore AI coaching, behavioral loops, and community accountability in an iOS build.", steps: ["Small action", "Check-in", "Reflection", "Next step"] },
  { label: "Website capture", title: "A public home for WYN Group.", image: "/wyn-group-live.jpg", problem: "Investors, owners, and tenants need a clear way to explore the firm, its properties, and its services.", approach: "Connect the property portfolio, service pages, team, and contact paths in one public website.", steps: ["Services", "Properties", "Team", "Inquiry"] },
];

function ProjectVisual({ index, leaving = false }: { index: number; leaving?: boolean }) {
  const project = projects[index];
  const presentation = presentations[index];
  return (
        <div className={`showcase-visual ${leaving ? "preview-leaving" : "preview-arriving"}`} aria-hidden={leaving || undefined}>
          <div className="preview-toolbar"><span><i /><i /><i /></span><span>{project.name}</span><span>{presentation.label}</span></div>
          {presentation.image ? <div className="site-capture"><img src={presentation.image} alt={`${project.name} website capture, not a live embedded page`} /><span className="capture-caption">Website capture. Open the live site below to explore.</span></div> : <div className={`workflow-scene scene-${index}`}><div className="scene-orbit" aria-hidden="true" /><p>{index === 4 ? "MicroCommit / Product lab" : `${project.name} / System view`}</p><h3>{presentation.title}</h3><div className="workflow-track">{presentation.steps.map((step,index) => <div key={step}><span className="flow-dot" aria-hidden="true" /><span>{step}</span>{index < 3 && <i aria-hidden="true" />}</div>)}</div><small>{index === 4 ? "Concept illustration. The iOS build is not embedded here." : "Illustrative workflow. No live records or client data shown."}</small></div>}
        </div>
  );
}

export function ProjectShowcase() {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [previous, setPrevious] = useState<number | null>(null);
  useEffect(() => {
    if (previous === null) return;
    const timer = window.setTimeout(() => setPrevious(null), 600);
    return () => window.clearTimeout(timer);
  }, [previous, selected]);
  const selectProject = (index: number) => {
    if (index === selected) return;
    setPrevious(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? null : selected);
    setSelected(index);
  };
  const project = projects[selected];
  const presentation = presentations[selected];
  return <section className="showcase" id="work" aria-labelledby="work-title">
    <div className="showcase-heading"><div><p>Selected systems</p><h2 id="work-title">See the work.<br />Explore the thinking.</h2></div><p>Websites, workflows, and products.<br />Choose a project to look inside.</p></div>
    <div className="showcase-layout">
      <div className="showcase-picker" role="group" aria-label="Choose a project">
        {projects.map((item, index) => <button type="button" key={item.name} aria-pressed={selected === index} aria-controls="project-preview" className="showcase-choice" onClick={() => selectProject(index)}>
          <span className="choice-field">{item.field}</span><span className="choice-name">{item.name}<span aria-hidden="true">↗</span></span><span className="choice-status"><i />{item.status}</span>
        </button>)}
        <p className="picker-note">Strategy, design, and implementation<br />by Danilo Ojeda.</p>
      </div>
      <div className="showcase-detail" id="project-preview" role="region" aria-label={`${project.name} project preview`}>
        <div className="preview-stage" onPointerMove={(event) => {
          if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
          const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
          event.currentTarget.style.setProperty("--preview-rotate-x", `${-y * 3}deg`);
          event.currentTarget.style.setProperty("--preview-rotate-y", `${x * 3}deg`);
        }} onPointerLeave={(event) => {
          event.currentTarget.style.setProperty("--preview-rotate-x", "0deg");
          event.currentTarget.style.setProperty("--preview-rotate-y", "0deg");
        }}>
          <div className="preview-tilt">
            {previous !== null && <ProjectVisual key={`leaving-${previous}`} index={previous} leaving />}
            <ProjectVisual key={selected} index={selected} />
          </div>
        </div>
        {presentation.image && <div className="preview-actions"><button type="button" onClick={() => setExpanded(true)}>Expand preview <span aria-hidden="true">⤢</span></button></div>}
        {expanded && <PreviewDialog title={project.name} image={presentation.image} onClose={() => setExpanded(false)} />}
        {(selected === 0 || selected === 4) && <DemoPlayer key={`demo-${selected}`} kind={selected === 0 ? "wyn" : "microcommit"} />}
        {!presentation.image && <WorkflowPlayer key={`workflow-${selected}`} steps={presentation.steps} kind={selected} />}
        <div className="showcase-copy" aria-live="polite" aria-atomic="true"><div className="showcase-description"><p className="detail-category">{project.field}</p><h3>{project.name}</h3><p>{project.summary}</p></div><div className="showcase-thinking"><div><h4>The problem</h4><p>{presentation.problem}</p></div><div><h4>The approach</h4><p>{presentation.approach}</p></div></div><div className="showcase-bottom"><div><span>My contribution</span><p>{project.role}</p></div>{project.href ? <a href={project.href} target="_blank" rel="noreferrer">Explore live site <span aria-hidden="true">↗</span></a> : <a href="#contact">Discuss a similar project <span aria-hidden="true">↗</span></a>}</div></div>
      </div>
    </div>
  </section>;
}
