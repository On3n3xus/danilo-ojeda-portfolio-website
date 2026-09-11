import type { ScrollScrubScene, ScrollScrubTheme } from "./components/scroll-scrub/scroll-scrub";

export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#C58A9B",
  background: "#170F1C",
  ink: "#F3EEE8",
  muted: "#A79DAE",
};

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    id: "living-signal",
    label: "Living signal",
    kicker: "AI systems for commercial real estate",
    title: "A signal becomes a conversation.",
    body: "Danilo Ojeda builds the path from first inquiry to booked meeting.",
    tags: ["Inquiry", "Voice", "Intent", "CRM", "Follow-up", "Meeting"],
    clip: "/assets/living-signal-desktop.mp4",
    mobileClip: "/assets/living-signal-mobile.mp4",
    poster: "/assets/living-signal-desktop.jpg",
    mobilePoster: "/assets/living-signal-mobile.jpg",
    objectPosition: "50% 50%",
    mobileObjectPosition: "50% 50%",
    align: "left",
    scroll: 2.4,
    linger: 0.16,
  },
];
