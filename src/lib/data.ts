import { Project, Research, Article, Draft, Profile, SiteConfig, TimelineEvent } from "./types";

// ─── Projects ────────────────────────────────────────────────────────────────

export const projects: Project[] = [
    {
        id: "feelosophy-core",
        title: "Feelosophy Core",
        description:
            "Can a machine understand how a body thinks? Feelosophy Core investigates biosignal-driven prediction — learning cyclical physiological patterns from temporal and physiological features to surface what clinical instruments often miss.",
        longDescription:
            "The project centers on a deceptively hard question: can a machine extract reliable structure from biological signals that are noisy, non-stationary, and deeply personal? Feelosophy Core approaches this by treating physiological data as a latent temporal sequence, building feature representations that capture rhythmic behaviour across time. It sits at the intersection of signal intelligence, bio-data engineering, and the early frontier of AI-driven health insight.",
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
        description:
            "What hidden structure exists in how students learn over time? CampusWeb applies AI analytics to GPA trajectories, credit loads, and subject performance — not to report numbers, but to reason about patterns invisible to semester-by-semester views.",
        longDescription:
            "Academic data, like most complex system data, contains structure that aggregation destroys. CampusWeb asks: what does a student's learning path actually look like as a dynamic system? By treating course sequences, performance curves, and credit distributions as interconnected signals rather than isolated metrics, the platform surfaces early indicators of drift, load imbalance, and opportunity — framing academic analytics as an intelligent reasoning problem, not a dashboard exercise.",
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
        description:
            "How should an intelligent system reason about data collected by instruments that have changed since collection? Using CalCOFI oceanographic records, this project treats sensor drift correction as a temporal reasoning problem rather than a lookup table.",
        longDescription:
            "Decades of oceanographic measurement accumulate a hidden variable: the instrument itself changes. The CalCOFI project confronts this by framing calibration as an inference problem — the system must reason about the past state of a sensor from its present behaviour and physical priors. Machine learning models the drift trajectory, allowing historical data to be recalibrated without discard. The project touches fundamental questions about measurement, trust, and how AI should handle evidence that was imperfect at the source.",
        tags: ["AI", "ML", "Environmental Science"],
        year: 2024,
        caseStudyUrl: "#",
        featured: false,
        methods: ["Bayesian inference", "Temporal regularisation", "GP regression"],
        datasets: ["CalCOFI physical oceanography records (1950-Present)"],
        results: ["Recovered 15% of historically discarded salinity readings by probabilistically modeling physical sensor fatigue."],
    },
];

// ─── Research ─────────────────────────────────────────────────────────────────

export const research: Research[] = [
    {
        id: "nitc-compgeo-2024",
        title: "Spatial Reasoning via Computational Geometry — Research Internship",
        conference: "National Institute of Technology Calicut",
        year: 2024,
        link: "#",
        tags: ["Computational Geometry", "C++", "OpenCV", "LibIGL", "CGAL"],
        abstract:
            "Research internship at NIT Calicut exploring computational geometry as a framework for spatial image analysis. Developed image-processing pipelines using C++, OpenCV, LibIGL, and CGAL — investigating how geometric structures (topology, transformations, manifold representations) can encode spatial reasoning in visual data. Geometry here was encountered as a powerful lens for thinking about spatial intelligence, not as an endpoint in itself.",
        publicationYear: "2024",
        authors: ["Amaljith Nair"],
        status: "Published",
        pdfLink: "/papers/nitc-compgeo-2024.pdf"
    },
    {
        id: "srm-urop-2024",
        title: "Behavioural Anomaly Detection for Insider Threat Modelling",
        conference: "SRM Institute of Science & Technology — UROP",
        year: 2024,
        link: "#",
        tags: ["AI", "Security", "ML"],
        abstract:
            "Research exposure through SRM IST's Undergraduate Research Opportunities Program. Investigated machine learning approaches to insider threat detection — a domain where the challenge is recognising meaningful deviation in human behaviour from sparse, ambiguous, and often incomplete signals. Work centred on anomaly modelling and classification under distributional uncertainty.",
        publicationYear: "2024",
        authors: ["Amaljith Nair"],
        status: "Ongoing",
        pdfLink: "/papers/srm-urop-2024.pdf"
    },
];

// ─── Articles (Curiosity Archive) ─────────────────────────────────────────────

export const articles: Article[] = [
    {
        id: "what-does-understanding-mean",
        title: "What Does It Mean for a System to Understand?",
        slug: "what-does-understanding-mean",
        excerpt:
            "On the gap between pattern recognition and genuine comprehension — and why that gap matters for AI in medicine.",
        content: `# What Does It Mean for a System to Understand?

There is a particular kind of discomfort that comes from watching a machine perform a task correctly without any apparent grasp of what the task is *for*.

Working on biosignal prediction sharpened this discomfort for me. A model can learn to predict a physiological cycle with high accuracy without understanding what a cycle is — why it exists, what disrupts it, what it means for the organism experiencing it.

This is not a failure of the model. It is a feature of the paradigm.

*Pattern recognition* and *understanding* are not the same operation. Recognition is statistical; understanding is relational — the capacity to connect a pattern to its cause, context, and consequence.

The question I keep returning to: what would it take to build systems that don't just recognise patterns in biological signals, but reason about what those patterns mean?

That is not an engineering question. It is a scientific one. And it is probably the most interesting question in AI right now.`,
        tags: ["AI", "Medical", "Research"],
        publishedAt: "2025-01-20",
    },
    {
        id: "measurement-drift-knowing",
        title: "Measurement, Drift, and the Limits of Knowing",
        slug: "measurement-drift-knowing",
        excerpt:
            "What the CalCOFI calibration problem revealed about the epistemology of historical data — and the quiet unreliability of instruments we trust.",
        content: `# Measurement, Drift, and the Limits of Knowing

Every instrument has a biography.

It was manufactured under certain tolerances. Deployed in certain conditions. Exposed to temperature, pressure, time. And as it aged, its relationship to truth slowly changed — without ever announcing the change.

The CalCOFI oceanographic dataset contains decades of environmental measurements recorded by instruments that were not the same at the end as at the beginning. The historical record is not the ocean as it was. It is the ocean filtered through the evolving biases of measuring devices that could not speak for themselves.

Machine learning can model this drift. But to do so, you have to treat calibration not as a correction lookup table, but as an inference problem: *given what I know about how this instrument behaves now, what can I infer about how it behaved then?*

This is, in miniature, the epistemological problem of any science that relies on historical data. And it applies with even greater force to medicine — where measurements of the body made years ago may need to be reinterpreted in light of what we now understand about the instruments and methods used.

The lesson is uncomfortable: **we rarely know how much of what we know is an artifact of how we measured it.**`,
        tags: ["ML", "Environmental Science", "Data"],
        publishedAt: "2024-10-08",
    },
    {
        id: "intelligence-at-scale-of-body",
        title: "Intelligence at the Scale of the Body",
        slug: "intelligence-at-scale-of-body",
        excerpt:
            "On why medical data is one of the hardest domains for AI — and why that makes it the most important one to pursue.",
        content: `# Intelligence at the Scale of the Body

Medical data breaks almost every assumption that makes AI comfortable.

It is sparse. Longitudinal. Deeply individual. Confounded by lifestyle, genetics, and history no sensor can directly observe. Its ground truth is often defined by human experts who disagree. Its signals are noisy in ways that are causally meaningful, not randomly distributed.

And yet this is precisely where AI could matter most.

Early detection. Personalised monitoring. Reasoning under uncertainty about states that cannot be directly measured. The body is a complex adaptive system — and complex adaptive systems are exactly what modern AI is beginning to learn how to reason about.

What makes this hard is not a lack of data. It is a lack of the right *representations*. The difference between a waveform that means something and one that does not is rarely visible in the raw signal. It lives in the relationship between the signal, the context, and the biology.

This is where computational geometry and signal processing converge for me — not as tools for their own sake, but as frameworks for building representations that preserve the structure the biology actually contains.

The long game is systems that reason about the body the way a thoughtful clinician does: not matching patterns to databases, but asking *what is this patient's physiology telling me that I haven't thought to look for yet?*`,
        tags: ["AI", "Medical", "Systems"],
        publishedAt: "2024-12-05",
    },
];

// ─── Drafts (Admin) ────────────────────────────────────────────────────────────

export const drafts: Draft[] = [
    {
        id: "draft-distributed-decisions",
        title: "Distributed Decision-Making: From Swarms to Transformers",
        content:
            "Draft: The question of how a system with no central authority arrives at globally coherent decisions is one I keep returning to across very different domains...",
        tags: ["AI", "Systems"],
        status: "draft",
        createdAt: "2026-03-01T10:00:00Z",
        updatedAt: "2026-03-03T09:30:00Z",
    },
];

// ─── Profile (Admin-controlled identity) ─────────────────────────────────────

export const defaultProfile: Profile = {
    name: "Amaljith T",
    role: "AI / ML Researcher",
    affiliation: "SRM IST",
    portraitUrl: "/portrait.jpg",
};

// ─── Site Configuration ──────────────────────────────────────────────────────

export const defaultSiteConfig: SiteConfig = {
    heroScientificImageUrl: "",
    heroScientificImageOpacity: 0.65,
    heroScientificImageParallax: 20,
    heroVisualOpacity: 0.72,
    signalPortraitOffsetY: 40,
    signalPortraitScale: 1.0,
    signalPortraitRingGlow: 0.08,
    goldenLineSpeed: 1.0,
};

export const timelineData: TimelineEvent[] = [
    {
        year: "2023",
        title: "Computational Geometry Research Internship",
        institution: "National Institute of Technology Calicut",
        description: "Explored spatial reasoning and geometric computation using C++ and computer vision tools, working with algorithmic representations of spatial structures.",
        tags: ["Computational Geometry", "C++", "OpenCV", "Algorithms"]
    },
    {
        year: "2023",
        title: "MedTech Research Exposure — JIPMER Conference",
        description: "Presented and engaged with interdisciplinary medical technology research, exploring intersections between artificial intelligence and clinical monitoring systems.",
        tags: ["MedTech", "Research Communication", "Healthcare Systems"]
    },
    {
        year: "2024",
        title: "Sensor Calibration via Machine Learning",
        description: "Developed machine learning models to correct environmental sensor drift using oceanographic data. Random Forest models were trained on large-scale CalCOFI datasets to reconstruct corrected measurements.",
        tags: ["Machine Learning", "Environmental Data", "Random Forest"]
    },
    {
        year: "2024",
        title: "Driver Drowsiness Detection System",
        description: "Built an ensemble machine learning pipeline combining facial landmarks, blink patterns, and head pose signals to detect driver fatigue using interpretable models.",
        tags: ["Computer Vision", "ML Ensemble", "Safety Systems"]
    },
    {
        year: "2024",
        title: "Feelosophy Core",
        description: "A behavioral intelligence platform exploring biosignal-driven emotional pattern recognition and long-term mental health tracking systems.",
        tags: ["AI", "Signal Processing", "Behavior Systems"]
    },
    {
        year: "2025",
        title: "Insider Threat Detection (UROP)",
        description: "Research on behavioral anomaly detection for cybersecurity environments using temporal activity patterns and statistical risk scoring.",
        tags: ["Cybersecurity", "Anomaly Detection", "AI"]
    },
    {
        year: "2025",
        title: "CampusWeb — Academic Intelligence Platform",
        description: "A system analyzing student learning patterns through GPA trajectories, credit structures, and course performance to uncover hidden educational trends.",
        tags: ["AI Analytics", "Education", "Data Systems"]
    },
    {
        year: "2025+",
        title: "VAC / VAE Clinical Surveillance Platform",
        targetLabel: "CURRENT SYSTEM",
        description: "Development of a hospital-grade surveillance system integrating infection monitoring rules, patient data streams, and AI-assisted clinical alerts.",
        tags: ["Healthcare Systems", "Clinical AI", "Surveillance"]
    }
];
