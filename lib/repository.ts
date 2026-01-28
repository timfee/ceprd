// Static content repository for the PRD Generator

/**
 * Options for the TL;DR section of the PRD.
 */
export const TLDR_OPTIONS = [
  {
    defaultContext: "What is the single biggest blocker for users right now?",
    id: "core-problem",
    label: "Identify Core Problem & User Pain",
  },
  {
    defaultContext: "High-level summary of the fix.",
    id: "proposed-solution",
    label: "Introduce Proposed Solution",
  },
  {
    defaultContext: "Where do we want to be in 12 months?",
    id: "vision-benefits",
    label: "State Vision & Key Benefits",
  },
  {
    defaultContext: "What security or compliance risk are we addressing?",
    id: "risk-mitigation",
    label: "Mitigate New or Evolving Risk",
  },
] as const;

/**
 * Categories for the Context/Background section.
 */
export const CONTEXT_CATEGORIES = [
  {
    id: "evolving-threats",
    items: [
      "GenAI leakage",
      "Prompt injection",
      "Expanding device ecosystem",
      "Regulatory mandates (GDPR, HIPAA)",
    ],
    label: "Evolving Threats & Security",
  },
  {
    id: "competitive-pressures",
    items: ["Competitor launch", "Deal losses", "Pricing disadvantage"],
    label: "Competitive Pressures",
  },
  {
    id: "strategic-opportunities",
    items: ["Company OKRs", "Cross-product synergy", "First-mover advantage"],
    label: "Strategic Opportunities",
  },
  {
    id: "customer-demand",
    items: ["CAB feedback", "Sales blockers", "Integration requests"],
    label: "Customer Demand",
  },
  {
    id: "internal-platform",
    items: [
      "Architectural limitations",
      "Unifying fragmented systems/UX",
      "Reducing technical debt",
      "Infrastructure modernization",
    ],
    label: "Internal Platform Evolution",
  },
  {
    id: "data-insights",
    items: [
      "Underperforming KPIs",
      "User behavior insights",
      "A/B test results",
    ],
    label: "Data-Driven Insights",
  },
  {
    id: "window-opportunity",
    items: [
      "Time-sensitive market conditions",
      "Resource availability",
      "External deadlines",
    ],
    label: "Window of Opportunity",
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

/**
 * Common terms that should NOT be added to the glossary or expanded by AI.
 */
export const COMMON_TERMS = [
  "CEP",
  "Chrome Enterprise Premium",
  "GCP",
  "Google Cloud Platform",
  "TL;DR",
  "JSON",
  "HTML",
  "CSS",
  "API",
  "UI",
  "UX",
  "SaaS",
  "URL",
  "HTTP",
  "HTTPS",
  "SDK",
  "CLI",
  "PRD",
  "DLP",
  "RBAC",
  "SSO",
  "JWT",
  "REST",
  "XML",
  "CSV",
  "PDF",
] as const;
