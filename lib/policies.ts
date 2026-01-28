export interface TermPolicy {
  blocklist: string[];
  allowlist: string[];
  synonyms: Record<string, string[]>;
}

export interface ActorPolicy {
  blocklist: string[];
  allowlist: string[];
}

export const TERM_POLICY_DEFAULT: TermPolicy = {
  allowlist: [
    "activation rate",
    "ARR",
    "CAC",
    "churn rate",
    "GDPR",
    "HIPAA",
    "LTV",
    "MRR",
    "net revenue retention",
    "NPS",
    "PII",
    "PHI",
    "SLA",
    "SLI",
    "SLO",
    "SOC 2",
    "time to value",
  ],
  blocklist: [
    "AI",
    "API",
    "ascii",
    "CEP",
    "CLI",
    "CPU",
    "CSS",
    "CSV",
    "DB",
    "DBMS",
    "DNS",
    "FAQ",
    "GCP",
    "GIF",
    "GPU",
    "GUI",
    "HTML",
    "HTTP",
    "HTTPS",
    "IoT",
    "IP",
    "IPv4",
    "IPv6",
    "JPEG",
    "JSON",
    "LAN",
    "MAC",
    "ML",
    "OS",
    "PDF",
    "PNG",
    "PRD",
    "SaaS",
    "SDK",
    "TL;DR",
    "UI",
    "URL",
    "UX",
  ],
  synonyms: {},
};

export const ACTOR_POLICY_DEFAULT: ActorPolicy = {
  allowlist: [
    "Approver",
    "Champion",
    "Compliance Officer",
    "Data Analyst",
    "Decision Maker",
    "Engineering Lead",
    "Executive Sponsor",
    "Finance",
    "IT Admin",
    "Legal Counsel",
    "Operations Manager",
    "Procurement",
    "Product Manager",
    "Security Lead",
    "Support Manager",
    "Technical Buyer",
  ],
  blocklist: [
    "Admin",
    "Buyer",
    "Customer",
    "End user",
    "Stakeholder",
    "System",
    "User",
  ],
};
