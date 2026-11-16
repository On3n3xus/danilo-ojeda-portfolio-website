import { useState, type FormEvent } from "react";
import introCues from "../data/introduction-cues.json";
import "./portfolio-experience.css";

export function NarratedIntroduction() {
  const [time, setTime] = useState(0);
  const caption = introCues.find(cue => time >= cue.start && time < cue.end)?.text;
  return <section className="narrated-introduction" aria-labelledby="introduction-title">
    <h3 id="introduction-title">Meet Danilo</h3>
    <p>A short introduction to the person behind the projects.</p>
    <audio controls preload="none" aria-label="Narrated introduction to Danilo Ojeda" onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)} src="/media/introduction-frank.mp3" />
    <p className="intro-caption" aria-label="Current narration caption">{caption ?? "Play the introduction to hear the narration. Captions appear here."}</p>
    <p className="media-disclosure">Draft introduction with a synthetic narrator. This is not Danilo’s recorded voice.</p>
    <details className="media-transcript"><summary>Read introduction transcript</summary>{introCues.map(cue => <p key={cue.start}>{cue.text}</p>)}</details>
  </section>;
}

const topics = ["Improve my website", "Connect my workflows", "Discuss a project"];
export function ContactInquiry() {
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState<{ url: string; body: string } | null>(null);
  const prepare = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const details = String(data.get("details") ?? "").trim();
    if (!name || !email || !details || !topic) return;
    const body = `Hi Danilo,\n\nI would like to: ${topic.toLowerCase()}.\n\n${details}\n\nName: ${name}\nReply email: ${email}`;
    setDraft({ url: `mailto:danilo@neurosparkmarketing.com?subject=${encodeURIComponent(`Project inquiry: ${topic}`)}&body=${encodeURIComponent(body)}`, body });
  };
  return <form className="contact-inquiry" onSubmit={prepare} onChange={() => setDraft(null)}>
    <fieldset><legend>What would you like to work on?</legend><div className="inquiry-topics">{topics.map(item => <label key={item}><input type="radio" name="topic" value={item} checked={topic === item} onChange={() => setTopic(item)} required /><span>{item}</span></label>)}</div></fieldset>
    <div className="inquiry-fields"><label>Your name<input name="name" autoComplete="name" maxLength={100} required /></label><label>Your email<input name="email" type="email" autoComplete="email" maxLength={180} required /></label></div>
    <label>What would you like to improve?<textarea name="details" rows={4} minLength={15} maxLength={1200} placeholder="Tell me what you’re working on and where you need help." required /></label>
    <p className="inquiry-note">This prepares an email in your email app. Nothing is sent or saved by this form. Please leave out passwords and sensitive details.</p>
    <button type="submit">Prepare inquiry</button>
    {draft && <div className="inquiry-draft" role="status"><h3>Your inquiry is ready to review.</h3><p>Open the draft in your email app, then send it when you are ready.</p><pre>{draft.body}</pre><a className="open-inquiry" href={draft.url}>Open email draft</a></div>}
    <p className="inquiry-fallback">Prefer email? <a href="mailto:danilo@neurosparkmarketing.com">danilo@neurosparkmarketing.com</a></p>
  </form>;
}
