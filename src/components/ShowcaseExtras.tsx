import { useEffect, useRef, useState } from "react";
import "./portfolio-experience.css";

export function PreviewDialog({ title, image, onClose }: { title: string; image: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  return <dialog className="capture-dialog" ref={ref} onClose={() => { if (ref.current && !ref.current.open) onClose(); }} aria-label={`${title} full capture`} onClick={(event) => { if (event.target === event.currentTarget) ref.current?.close(); }}>
    <div className="capture-dialog-heading"><div><h2>{title}</h2><p>Full saved capture. Scroll to inspect. This is not a live website.</p></div><button type="button" onClick={() => ref.current?.close()} autoFocus>Close preview</button></div>
    <div className="capture-dialog-image"><img src={image} alt={`Full saved capture of ${title}`} /></div>
  </dialog>;
}

const demos = {
  wyn: { title: "Inside WYN Intelligence", src: "/media/wyn-walkthrough.mp4", poster: "/media/wyn-poster.jpg", captions: "/media/wyn-walkthrough.vtt", duration: "18 seconds", note: "Recorded training walkthrough. Example properties and draft activity are fictional.", transcript: ["Explore Listings and the working context attached to a property.", "Open OM Studio to prepare and review brochure drafts.", "Review the campaign workspace before any submission or delivery.", "Approvals keep proposed actions separate from execution. Nothing is sent by this demo."] },
  microcommit: { title: "A closer look at MicroCommit", src: "/media/microcommit-walkthrough.mp4", poster: "/media/micro-poster.jpg", captions: "/media/microcommit-walkthrough.vtt", duration: "21 seconds", note: "Screenshot walkthrough of an existing iOS build. Not a live phone recording.", transcript: ["Today brings daily commitments and a journal intention into view.", "Discover organizes challenges across wellness, productivity, and community.", "The profile brings level, streak, and badges into one personal view."] },
};

export function DemoPlayer({ kind }: { kind: keyof typeof demos }) {
  const [active, setActive] = useState(false);
  const demo = demos[kind];
  return <section className="demo-player" aria-label={demo.title}>
    <div className="experience-heading"><h3>{demo.title}</h3><span>{demo.duration}</span></div>
    {active ? <video controls autoPlay playsInline preload="metadata" poster={demo.poster} aria-label={demo.title}><source src={demo.src} type="video/mp4" /><track kind="captions" src={demo.captions} srcLang="en" label="English screen descriptions" default />Your browser cannot play this video. Read the transcript below.</video> : <button className="demo-poster" type="button" onClick={() => setActive(true)} aria-label={`Play ${demo.title}`}><img src={demo.poster} alt="" loading="lazy" /><span className="demo-play-label"><span aria-hidden="true">▶</span> Play walkthrough</span></button>}
    <p className="media-disclosure">{demo.note}</p>
    <details className="media-transcript"><summary>Read walkthrough transcript</summary>{demo.transcript.map(line => <p key={line}>{line}</p>)}</details>
  </section>;
}

const explanations: Record<number, string[]> = {
  0: ["Start with the listing and keep the property context together.", "Prepare a campaign around the listing and its intended audience.", "Keep the next follow-up visible to the person responsible.", "Bring the conversation back to the operating record for review."],
  3: ["Show completed work so a visitor can assess the service.", "Help the visitor find the service that matches their project.", "Give the visitor a clear way to describe what they need.", "Route the request into a conversation about an estimate."],
  4: ["Begin with a small, specific commitment.", "Make it easy to check in on the action.", "Leave room to reflect on what helped or got in the way.", "Use that context to choose the next manageable step."],
};

export function WorkflowPlayer({ steps, kind }: { steps: string[]; kind: number }) {
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      if (step >= steps.length - 1) setRunning(false);
      else setStep(step + 1);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [running, step, steps.length]);
  const toggle = () => {
    if (running) { setRunning(false); return; }
    if (step < 0 || step === steps.length - 1) setStep(0);
    setRunning(true);
  };
  return <section className="workflow-player" aria-label="Illustrated workflow playback">
    <div className="experience-heading"><h3>Follow the workflow</h3><button type="button" onClick={toggle}>{running ? "Pause workflow" : step === steps.length - 1 ? "Replay workflow" : step >= 0 ? "Resume workflow" : "Play workflow"}</button></div>
    <ol>{steps.map((label, index) => <li key={label} data-complete={index < step} data-active={index === step}><button type="button" onClick={() => { setRunning(false); setStep(index); }} aria-current={index === step ? "step" : undefined}><span aria-hidden="true">{index + 1}</span>{label}</button></li>)}</ol>
    <p className="workflow-explanation" aria-live="polite" aria-atomic="true">{step < 0 ? "Play the sequence, or choose any step to explore it." : explanations[kind]?.[step] ?? steps[step]}</p>
    <small>Illustrated sequence. This does not trigger actions in a live system.</small>
  </section>;
}
