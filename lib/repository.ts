// Static content repository for the PRD Generator

/**
 * Options for the TL;DR section of the PRD.
 */
export const TLDR_OPTIONS = [
  {
    id: "core-problem",
    label: "Identify Core Problem & User Pain",
    defaultContext: "What is the single biggest blocker for users right now?",
  },
  {
    id: "proposed-solution",
    label: "Introduce Proposed Solution",
    defaultContext: "High-level summary of the fix.",
  },
  {
    id: "vision-benefits",
    label: "State Vision & Key Benefits",
    defaultContext: "Where do we want to be in 12 months?",
  },
  {
    id: "risk-mitigation",
    label: "Mitigate New or Evolving Risk",
    defaultContext: "What security or compliance risk are we addressing?",
  },
] as const;

/**
 * Categories for the Context/Background section.
 */
export const CONTEXT_CATEGORIES = [
  {
    id: "evolving-threats",
    label: "Evolving Threats & Security",
    items: [
      "GenAI leakage",
      "Prompt injection",
      "Expanding device ecosystem",
      "Regulatory mandates (GDPR, HIPAA)",
    ],
  },
  {
    id: "competitive-pressures",
    label: "Competitive Pressures",
    items: ["Competitor launch", "Deal losses", "Pricing disadvantage"],
  },
  {
    id: "strategic-opportunities",
    label: "Strategic Opportunities",
    items: ["Company OKRs", "Cross-product synergy", "First-mover advantage"],
  },
  {
    id: "customer-demand",
    label: "Customer Demand",
    items: ["CAB feedback", "Sales blockers", "Integration requests"],
  },
  {
    id: "internal-platform",
    label: "Internal Platform Evolution",
    items: [
      "Architectural limitations",
      "Unifying fragmented systems/UX",
      "Reducing technical debt",
      "Infrastructure modernization",
    ],
  },
  {
    id: "data-insights",
    label: "Data-Driven Insights",
    items: [
      "Underperforming KPIs",
      "User behavior insights",
      "A/B test results",
    ],
  },
  {
    id: "window-opportunity",
    label: "Window of Opportunity",
    items: [
      "Time-sensitive market conditions",
      "Resource availability",
      "External deadlines",
    ],
  },
] as const;

/**
 * Common roles for personas in the system.
 */
export const PERSONA_ROLES = [
  "End User (Managed Employee)",
  "IT Admin",
  "Security Admin",
  "Security Analyst",
  "Business Decision Maker",
  "Partner/Reseller",
] as const;

/**
 * Categories for goal setting.
 */
export const GOAL_CATEGORIES = [
  "Business Growth",
  "User Experience",
  "Security & Compliance",
  "Platform Health",
] as const;
