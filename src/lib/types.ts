// ─── Content Models ─────────────────────────────────────────────────────────
// All UI components must consume typed data via props — no hardcoded content.

export type Tag =
    | "AI"
    | "ML"
    | "Chess"
    | "Geometry"
    | "Nanobots"
    | "Research"
    | "Open Source"
    | "Computational Geometry"
    | "C++"
    | "OpenCV"
    | "LibIGL"
    | "CGAL"
    | "Signal Processing"
    | "Medical"
    | "Analytics"
    | "Education"
    | "Environmental Science"
    | "Security"
    | "Systems"
    | "Data";

// ─── Commons Types ────────────────────────────────────────────────────────────

export type CommonsStatus = "active" | "hold" | "locked";

export interface Reply {
    id: string;
    content: string;
    author: string;
    timestamp: string;
    flagged?: boolean;
}

export interface Thread {
    id: string;
    title: string;
    content: string;
    author: string;
    timestamp: string;
    pinned: boolean;
    locked: boolean;
    archived: boolean;
    flagged: boolean;
    replies: Reply[];
}

export interface CommonsData {
    status: CommonsStatus;
    threads: Thread[];
}




export interface Project {
    id: string;
    title: string;
    description: string;
    longDescription?: string;
    tags: Tag[];
    caseStudyUrl?: string;
    imageUrl?: string;
    year: number;
    featured?: boolean;
    methods?: string[];
    datasets?: string[];
    results?: string[];
}

export interface Research {
    id: string;
    title: string;
    conference: string;
    journal?: string;
    year: number;
    link?: string;
    tags: Tag[];
    abstract?: string;
    publicationYear?: string;
    authors?: string[];
    pdfLink?: string;
    status?: "Ongoing" | "Published";
}

export interface Article {
    id: string;
    title: string;
    slug: string;
    content: string; // markdown
    excerpt: string;
    tags: Tag[];
    publishedAt: string; // ISO date string
}

export type DraftStatus = "draft" | "published";

export interface Draft {
    id: string;
    title: string;
    content: string; // markdown
    tags: Tag[];
    status: DraftStatus;
    createdAt: string;
    updatedAt: string;
}

// ─── API Types ───────────────────────────────────────────────────────────────

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ChatRequest {
    messages: ChatMessage[];
}

export interface ContactRequest {
    name: string;
    email: string;
    message: string;
}

export interface SuggestionResult {
    type: "warning" | "info" | "success";
    message: string;
    field?: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────
// Admin-controlled identity data. Used on Signal page and nav.
export interface Profile {
    name: string;
    role: string;
    affiliation: string;
    portraitUrl: string; // relative /public path or uploaded URL
}

// ─── Site Configuration ──────────────────────────────────────────────────────
// Admin-controlled visual parameters to avoid hardcoded constants.
export interface SiteConfig {
    heroScientificImageUrl: string;
    heroScientificImageOpacity: number;
    heroScientificImageParallax: number;
    heroVisualOpacity: number;
    signalPortraitOffsetY: number;
    signalPortraitScale: number;
    signalPortraitRingGlow: number;
    goldenLineSpeed: number;
}

// ─── Site Settings ────────────────────────────────────────────────────────────
// Admin-controlled public content — hero text, fragments, contact, orbit words.
export interface LabFragment {
    id: string;
    imageUrl: string;
    caption: string;
    description?: string;
    type?: "behavioural-landscape" | "decision-graph" | "drowsiness-pipeline" | "clinical-surveillance";
}

export interface SiteSettings {
    heroTagline: string;
    heroTitle: string;
    heroSubtitle: string;
    orbitKeywords: string[];
    motionIntensity: number;
    contactEmail: string;
    footerName: string;
    footerTagline: string;
    footerCopyright: string;
    labFragments: LabFragment[];
    projects: Project[];
    // ── Brain Visualization ─────────────────────────────────────────────────
    brainSymbols: string[];      // Layer 1 tokens (math symbols)
    brainEquations: string[];    // Layer 2 tokens (equations)
    brainDensity: number;        // 0.5–2.0 multiplier on base particle count
    brainZoomDepth: number;      // 1.0–3.0 scroll wheel zoom sensitivity
    glitchIntensity: number;     // 0.0–1.0 glitch micro-displacement intensity
    pulseFrequency: number;      // pulses per second (e.g. 0.25 = one every 4s)
    colorIntensity: number;      // 0.5–1.5 overall brightness multiplier
    // ── Research Timeline ───────────────────────────────────────────────────
    timeline?: TimelineEvent[];
}

export const defaultSiteSettings: SiteSettings = {
    heroTagline: "SRM IST · AI / ML · Systems",
    heroTitle: "Curious About\nHow Systems\nReason.",
    heroSubtitle:
        "Exploring how intelligent systems learn, adapt, and reason across AI, biosignals, and complex data. Working toward a long-term research direction at the intersection of AI and medicine.",
    orbitKeywords: ["Inference", "Signal", "Drift", "Emergence", "Latent", "Noise", "Structure", "Anomaly"],
    motionIntensity: 0.008,
    contactEmail: "",
    footerName: "A. T.",
    footerTagline: "AI/ML Researcher · SRM IST · Undergraduate",
    footerCopyright: "crafted with geometry",
    labFragments: [
        { id: "01", type: "behavioural-landscape", imageUrl: "", caption: "Behavioural Signal Landscape", description: "Temporal behavioural signals extracted from observational data streams. Feature windows capture evolving user activity patterns across multiple behavioural dimensions, enabling anomaly surface modeling and pattern detection across time." },
        { id: "02", type: "decision-graph", imageUrl: "", caption: "Explainable Decision Graph", description: "Structured feature relationships used to interpret machine-learning predictions. Contribution pathways highlight how behavioural signals influence final model outputs while preserving interpretability." },
        { id: "03", type: "drowsiness-pipeline", imageUrl: "", caption: "Drowsiness Detection Pipeline", description: "Interpretable ensemble pipeline for driver vigilance monitoring using geometric facial descriptors including EAR, MAR, blink rate, and PERCLOS aggregated over temporal sliding windows. This system combines classical visual descriptors with a stacking ensemble to model vigilance degradation in video streams." },
        { id: "04", type: "clinical-surveillance", imageUrl: "", caption: "Clinical Surveillance Monitoring", description: "Hospital-grade ventilator-associated event surveillance platform using deterministic CDC/NHSN classification rules combined with structured clinical validation workflows. The system monitors ventilator parameters and patient signals to detect VAC, IVAC, and PVAP events while preserving human oversight in clinical decision pipelines." },
    ],
    projects: [
        {
            id: "feelosophy-core",
            title: "Feelosophy Core",
            description: "Can a machine understand how a body thinks? Feelosophy Core investigates biosignal-driven prediction — learning cyclical physiological patterns from temporal and physiological features to surface what clinical instruments often miss.",
            longDescription: "The project centers on a deceptively hard question: can a machine extract reliable structure from biological signals that are noisy, non-stationary, and deeply personal? Feelosophy Core approaches this by treating physiological data as a latent temporal sequence, building feature representations that capture rhythmic behaviour across time. It sits at the intersection of signal intelligence, bio-data engineering, and the early frontier of AI-driven health insight.",
            tags: ["AI", "Signal Processing", "Medical"],
            year: 2024,
            caseStudyUrl: "#",
            featured: true,
            methods: ["Latent temporal modelling", "Unsupervised discovery", "Time-series attention"],
            datasets: ["MIMIC-IV (PhysioNet)", "Proprietary high-frequency wearables"],
            results: ["Identified unseen micro-states correlating to clinical deterioration 4hrs prior to onset."],
        },
        {
            id: "campusweb",
            title: "CampusWeb — Academic Intelligence Platform",
            description: "What hidden structure exists in how students learn over time? CampusWeb applies AI analytics to GPA trajectories, credit loads, and subject performance — not to report numbers, but to reason about patterns invisible to semester-by-semester views.",
            longDescription: "Academic data, like most complex system data, contains structure that aggregation destroys. CampusWeb asks: what does a student's learning path actually look like as a dynamic system? By treating course sequences, performance curves, and credit distributions as interconnected signals rather than isolated metrics, the platform surfaces early indicators of drift, load imbalance, and opportunity — framing academic analytics as an intelligent reasoning problem, not a dashboard exercise.",
            tags: ["AI", "Analytics", "Education"],
            year: 2024,
            caseStudyUrl: "#",
            featured: true,
            methods: ["Graph sequence encoding", "Drift detection", "Counterfactual inference"],
            datasets: ["Multi-year anonymised academic records (N=40k)"],
            results: ["Surfaced hidden dependency pathways between foundational failures and capstone dropout rates."],
        },
        {
            id: "calcOFI-calibration",
            title: "Sensor Calibration via ML — CalCOFI",
            description: "How should an intelligent system reason about data collected by instruments that have changed since collection? Using CalCOFI oceanographic records, this project treats sensor drift correction as a temporal reasoning problem rather than a lookup table.",
            longDescription: "Decades of oceanographic measurement accumulate a hidden variable: the instrument itself changes. The CalCOFI project confronts this by framing calibration as an inference problem — the system must reason about the past state of a sensor from its present behaviour and physical priors. Machine learning models the drift trajectory, allowing historical data to be recalibrated without discard. The project touches fundamental questions about measurement, trust, and how AI should handle evidence that was imperfect at the source.",
            tags: ["AI", "ML", "Environmental Science"],
            year: 2024,
            caseStudyUrl: "#",
            featured: false,
            methods: ["Bayesian inference", "Temporal regularisation", "GP regression"],
            datasets: ["CalCOFI physical oceanography records (1950-Present)"],
            results: ["Recovered 15% of historically discarded salinity readings by probabilistically modeling physical sensor fatigue."],
        },
    ],
    brainSymbols: ["\u2211", "\u2202", "\u222b", "\u03c0", "\u03bb", "\u03c3", "\u0394", "\u2207", "\u03b5", "\u03bc", "\u03b8", "\u221e", "\u2248", "\u2295", "\u2208"],
    brainEquations: ["x(t)", "\u2207f(x)", "P(A|B)", "\u2211w\u1d62x\u1d62", "e^{i\u03c0}", "\u03c3(z)", "\u2202L/\u2202w", "E[X]", "H(X)", "D_KL", "relu", "tanh", "\u2016x\u20162", "argmax"],
    brainDensity: 1.0,
    brainZoomDepth: 1.5,
    glitchIntensity: 0.5,
    pulseFrequency: 0.25,
    colorIntensity: 1.0,
    timeline: [],
};

export interface TimelineEvent {
    year: string;
    title: string;
    institution?: string;
    description: string;
    targetLabel?: string;
    tags: string[];
}
