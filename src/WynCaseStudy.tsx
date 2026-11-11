export function WynCaseStudy() {
  return (
    <details className="wyn-case-study">
      <summary>Case study: From a listing inquiry to a draft reply</summary>
      <p>A prospective tenant asks for the offering memorandum, the document that explains the property. The request sits in an email thread. To answer, the broker has to connect it to the right listing and choose the right version of the document.</p>
      <p>I built a follow-up view that shows the request alongside the source email and who owes the next reply. The broker can check that context, select the listing’s memorandum, and prepare a response in the original thread.</p>
      <figure>
        <img src="/assets/wyn-follow-up-demo.webp" width="1510" height="328" loading="lazy" alt="WYN’s demo showing a cold-storage listing, version three of its offering memorandum, and the Prepare follow-up draft button." />
        <figcaption>WYN Intelligence demo with sample listing data.</figcaption>
      </figure>
      <p><strong>What the broker gets:</strong> In the demo, selecting the memorandum created an editable reply in the approvals queue. The broker could review the wording and attachment before sending.</p>
    </details>
  );
}
