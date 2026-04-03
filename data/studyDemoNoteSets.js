/**
 * Demo note sets (shown when NEXT_PUBLIC_STUDY_DEMO=1) for UI preview without Firestore.
 */
export const DEMO_NOTE_SETS = [
  {
    id: "demo-interwar",
    name: "Interwar period & WWII origins",
    subject: "history",
    notes:
      "Treaty of Versailles → German resentment, reparations, Rhineland. Weimar instability. Rise of fascism in Italy and Germany. Appeasement, Anschluss, Munich. Invasion of Poland 1939.",
    isDemo: true,
    demoWeakness:
      "Causation chains (Versailles → instability → extremism), chronology of crises (1920s–1939), and comparing appeasement vs deterrence.",
    demoStrengths:
      "Key terms (reparations, mandate), map/geography (Rhineland), and recognizing primary-source tone in passages.",
  },
  {
    id: "demo-cell-bio",
    name: "Cell structure & photosynthesis",
    subject: "science",
    notes:
      "Organelles: nucleus, mitochondria, chloroplasts. Light-dependent vs Calvin cycle. ATP and NADPH. Factors limiting photosynthesis.",
    isDemo: true,
    demoWeakness:
      "NADPH vs NADH roles, Calvin cycle steps, and explaining limiting factors with graphs.",
    demoStrengths:
      "Organelle functions, overall equation for photosynthesis, and chloroplast vs mitochondria contrast.",
  },
];
