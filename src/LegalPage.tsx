import { useEffect, type ReactNode } from "react";

type LegalPageKind = "privacy" | "terms";

type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

const effectiveDate = "September 17, 2026";
const contactEmail = "danilo@neurosparkmarketing.com";

const privacySections: LegalSection[] = [
  {
    id: "scope",
    title: "Scope",
    content: <p>This Privacy Policy explains how daniloojeda.com collects, uses, shares, and retains information when you visit the site, follow an external link, or contact Danilo Ojeda. It does not cover the separate websites, products, or services shown in the portfolio.</p>,
  },
  {
    id: "information",
    title: "Information collected",
    content: <>
      <h3>Information you choose to provide</h3>
      <p>If you use the email link, your email provider processes your email address, message, attachments, and any other information you choose to include.</p>
      <h3>Information collected automatically</h3>
      <p>The site and its service providers may receive your IP address, browser and device information, operating system, referring page, pages viewed, timestamps, approximate location derived from your IP address, and basic request, performance, or error data.</p>
    </>,
  },
  {
    id: "uses",
    title: "How information is used",
    content: <ul>
      <li>Operate, secure, troubleshoot, and improve the site and assistant.</li>
      <li>Respond to messages or requests you choose to send.</li>
      <li>Measure and improve site reliability and performance.</li>
      <li>Detect misuse and comply with legal obligations.</li>
    </ul>,
  },
  {
    id: "providers",
    title: "Tools and service providers",
    content: <>
      <p>These providers support the site and receive information only as needed for their role:</p>
      <div className="legal-table-wrap">
        <table>
          <thead><tr><th>Provider</th><th>Purpose</th><th>Information involved</th></tr></thead>
          <tbody>
            <tr><td>Vercel</td><td>Hosting, content delivery, security, and operational logs</td><td>IP address, request details, device and browser data, timestamps, and error or performance data</td></tr>
            <tr><td>Google Fonts</td><td>Delivering the Outfit and IBM Plex Mono typefaces</td><td>IP address, browser request headers, and requested font files</td></tr>
            <tr><td>Your email provider and Danilo&apos;s email provider</td><td>Delivering email when you choose the contact link</td><td>Your email address, message, attachments, and standard email metadata</td></tr>
          </tbody>
        </table>
      </div>
      <p>LinkedIn, Instagram, Facebook, and portfolio project links are external. Those services receive information only when you follow their links or otherwise interact with them, and their own privacy terms apply.</p>
    </>,
  },
  {
    id: "sharing",
    title: "Sharing and sale",
    content: <p>Personal information is not sold for money. Information may be shared with the service providers listed above, professional advisers when necessary, a successor in a business transfer, or government and legal authorities when required by law or reasonably necessary to protect rights, safety, and the integrity of the site.</p>,
  },
  {
    id: "retention",
    title: "Retention and security",
    content: <>
      <p>Information is kept only as long as reasonably needed for the purposes described here, to resolve disputes, protect the site, or meet legal obligations. Provider retention periods may differ. You can request deletion of information controlled by Danilo, but providers may retain limited records where required by law, security, or backup practices.</p>
      <p>Reasonable safeguards are used, but no website, transmission, or storage system is completely secure. Do not send sensitive or confidential information through the assistant or ordinary email.</p>
    </>,
  },
  {
    id: "choices",
    title: "Your choices and rights",
    content: <>
      <p>Depending on where you live, you may have rights to request access, correction, deletion, or a copy of your personal information, or to object to or restrict certain processing. You may also use browser controls to clear site data or contact Danilo directly.</p>
      <p>To make a request, email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Identity may need to be verified before a request is completed.</p>
    </>,
  },
  {
    id: "children",
    title: "Children",
    content: <p>The site is not directed to children under 13, and personal information from children under 13 is not knowingly collected. If you believe a child has submitted information, contact Danilo so it can be reviewed and deleted where appropriate.</p>,
  },
  {
    id: "changes",
    title: "Changes and contact",
    content: <p>This policy may change when the site, tools, or legal requirements change. The date at the top shows the latest revision. Questions or privacy requests can be sent to <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>,
  },
];

const termsSections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance",
    content: <p>These Terms govern your use of daniloojeda.com. By accessing or using the site, you agree to these Terms and the Privacy Policy. If you do not agree, do not use the site.</p>,
  },
  {
    id: "purpose",
    title: "Site purpose",
    content: <p>The site is a personal portfolio and general informational resource about Danilo Ojeda&apos;s experience, projects, and services. Site content is not legal, financial, investment, cybersecurity, brokerage, employment, medical, or other professional advice. You are responsible for evaluating information and obtaining advice suited to your circumstances.</p>,
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    content: <>
      <p>You may use the site for lawful, personal, and legitimate business-evaluation purposes. You may not:</p>
      <ul>
        <li>Attempt to bypass security, access non-public systems, or interfere with the site.</li>
        <li>Use automated means to overload, probe, scrape, or extract content at unreasonable volume.</li>
        <li>Transmit malware, illegal content, confidential third-party data, or abusive material through the site.</li>
        <li>Misrepresent your identity or use the site to violate another person&apos;s rights.</li>
        <li>Copy, republish, sell, or create misleading derivatives of site content without permission.</li>
      </ul>
    </>,
  },
  {
    id: "ownership",
    title: "Ownership",
    content: <p>Unless otherwise stated, the site design, text, graphics, original media, and code presentation are owned by Danilo Ojeda or used with permission. Project names, logos, screenshots, and third-party materials belong to their respective owners. You receive a limited, revocable, non-transferable right to view and use the site under these Terms.</p>,
  },
  {
    id: "submissions",
    title: "Messages and submissions",
    content: <p>You are responsible for information you send through email or the assistant and confirm that you have the right to provide it. Do not submit trade secrets, regulated data, credentials, or information subject to another person&apos;s confidentiality obligations. Feedback about the site may be used to improve it without an obligation to compensate you, but ownership of your pre-existing materials remains yours.</p>,
  },
  {
    id: "third-parties",
    title: "Third-party services and links",
    content: <p>The site relies on or links to third-party services, including Vercel, Google Fonts, email providers, social platforms, and the websites of featured projects. Third parties control their own services, availability, security, content, and terms. A link or integration does not mean Danilo endorses every statement, product, or practice of that third party.</p>,
  },
  {
    id: "availability",
    title: "Availability and changes",
    content: <p>The site and any feature may be changed, suspended, restricted, or removed at any time. There is no promise that the site will always be available, secure, error-free, or compatible with every browser or device. These Terms may also be updated. Continued use after an update means you accept the revised Terms.</p>,
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    content: <p>To the fullest extent allowed by law, the site, content, and related services are provided “as is” and “as available,” without warranties of accuracy, availability, merchantability, fitness for a particular purpose, title, or non-infringement. Portfolio examples describe prior or ongoing work and do not guarantee similar results.</p>,
  },
  {
    id: "liability",
    title: "Limitation of liability",
    content: <p>To the fullest extent allowed by law, Danilo Ojeda will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, lost profits, lost data, business interruption, or losses arising from your use of or inability to use the site, external links, or site content. Nothing in these Terms limits liability that cannot legally be limited.</p>,
  },
  {
    id: "law",
    title: "Governing law",
    content: <p>These Terms are governed by the laws of the State of Minnesota, without regard to conflict-of-law rules. Any dispute relating to the site will be brought in a state or federal court with jurisdiction in Minnesota, unless applicable law requires otherwise. If any part of these Terms is unenforceable, the remaining parts remain in effect.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    content: <p>Questions about these Terms can be sent to <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>,
  },
];

const pageContent = {
  privacy: {
    label: "Privacy Policy",
    title: "Your information should have a visible path.",
    summary: "What this site collects, why it is used, and how the tools behind the experience handle it.",
    sections: privacySections,
  },
  terms: {
    label: "Terms of Use",
    title: "Clear terms for a public portfolio.",
    summary: "The rules for using this site, its content, contact links, and external destinations.",
    sections: termsSections,
  },
} satisfies Record<LegalPageKind, { label: string; title: string; summary: string; sections: LegalSection[] }>;

function LegalFooter() {
  return <footer className="legal-footer">
    <p>Danilo Ojeda</p>
    <nav aria-label="Legal links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href={`mailto:${contactEmail}`}>Contact</a></nav>
    <small>AI systems for commercial real estate</small>
  </footer>;
}

export function LegalPage({ kind }: { kind: LegalPageKind }) {
  const page = pageContent[kind];

  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousDescription = description?.content;
    const previousCanonical = canonical?.href;

    document.title = `${page.label} | Danilo Ojeda`;
    if (description) description.content = page.summary;
    if (canonical) canonical.href = `https://daniloojeda.com/${kind}`;
    document.documentElement.scrollTop = 0;

    return () => {
      document.title = previousTitle;
      if (description && previousDescription) description.content = previousDescription;
      if (canonical && previousCanonical) canonical.href = previousCanonical;
    };
  }, [kind, page.label, page.summary]);

  return <main className="legal-shell">
    <header className="legal-nav">
      <a className="nav-mark" href="/" aria-label="Danilo Ojeda, home"><span>DO</span><b>Danilo Ojeda</b></a>
      <nav aria-label="Legal navigation"><a href={kind === "privacy" ? "/terms" : "/privacy"}>{kind === "privacy" ? "Terms" : "Privacy"}</a><a className="nav-contact" href="/">Back home</a></nav>
    </header>

    <header className="legal-hero">
      <p>{page.label}</p>
      <h1>{page.title}</h1>
      <div><span>{page.summary}</span><time dateTime="2026-09-17">Effective {effectiveDate}</time></div>
    </header>

    <div className="legal-layout">
      <aside className="legal-toc" aria-label={`${page.label} contents`}>
        <p>On this page</p>
        <nav>{page.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav>
      </aside>
      <article className="legal-content">
        {page.sections.map((section) => <section id={section.id} key={section.id}>
          <h2>{section.title}</h2>
          <div>{section.content}</div>
        </section>)}
      </article>
    </div>

    <LegalFooter />
  </main>;
}
