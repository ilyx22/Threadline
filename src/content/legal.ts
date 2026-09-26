/**
 * The legal pages (26 September 2026): privacy, terms, cookies. Written from
 * what the site actually does, not from a template. Anything in square
 * brackets is an owner input that the code cannot know (legal entity, company
 * number, registered address, privacy contact, retention period, governing
 * law). Nothing here is legal advice; the owner should have it checked.
 */
export type LegalSection = { title: string; paras?: readonly string[]; items?: readonly string[]; table?: readonly (readonly string[])[]; /** kept in the content but not rendered until the owner supplies it (the legal entity does not exist yet) */ hidden?: boolean };
export type LegalDoc = { slug: string; title: string; lead: string; updated: string; sections: readonly LegalSection[] };

const UPDATED = "26 September 2026";
const OWNER = "[Legal entity name]";
const CONTACT = "[privacy contact email]";

export const PRIVACY: LegalDoc = {
  slug: "privacy",
  title: "Privacy policy",
  lead: "What Threadline collects, why, where it goes and what you can ask us to do with it. Written to be read, not scrolled past.",
  updated: UPDATED,
  sections: [
    { title: "Who we are", hidden: true, paras: [`Threadline is operated by ${OWNER}, company number [number], registered at [registered address]. We are the controller of the personal data described here. Questions and requests go to ${CONTACT}.`] },
    { title: "Questions and requests", paras: ["Threadline is a founding-client programme and the operating company is being set up. Until then, questions and requests about your data go to the person who replies to your application, or through the application form. We treat every request as we would once the company exists."] },
    {
      title: "What we collect, and why",
      items: [
        "When you apply: your name, email address, company, website, revenue range and your answers to the application questions. We use these to assess fit, to reply to you either way, and, if we work together, to set up your workspace. Legal basis: steps taken at your request before a contract, and our legitimate interest in assessing applications.",
        "When you are a client: your sign-in email, a hashed password, the content and records you and we create in your workspace, and the technical logs needed to run and secure the service. Legal basis: performance of our contract with your firm.",
        "When you follow a tracked link (a Threadline address in a client's post): the time of the click, the referring site's host name, and a random first-party identifier so that repeat clicks from the same browser can be told apart. We do not fingerprint devices and we cannot identify you from this. Legal basis: our and our clients' legitimate interest in measuring whether published work is met.",
        "When you write to us: your message and your contact details, to reply.",
      ],
    },
    {
      title: "What we do not do",
      items: ["We do not sell or rent personal data.", "We do not run advertising or third-party analytics trackers on this site.", "We do not scrape login-walled platforms or build profiles of people who have not contacted us.", "We do not send marketing email to applicants who were not accepted."],
    },
    {
      title: "Who else sees it",
      paras: ["We use a small number of providers to run the service, each under a contract that limits them to acting on our instructions:"],
      items: ["Hosting and delivery: Vercel.", "Transactional email (application confirmations, invites, password resets and reports): Resend, when configured.", "File storage for client workspaces: our storage provider, when a workspace uses file storage.", "Where a client connects a publishing or CRM platform to their workspace, the data that platform returns is held in the client's workspace and governed by the client's own agreement with that platform."],
    },
    {
      title: "How long we keep it",
      items: ["Applications: for the time it takes to assess them and reply, and for a short period afterwards so that we can answer follow-up questions, after which they are deleted or anonymised.", "Client workspace data: for the life of the engagement and for a short period after it ends so that records can be handed over, unless the client asks for earlier deletion.", "Tracked-link records: for as long as the piece of work they measure is being read, and then anonymised.", "Security and access logs: for a short, fixed period, then deleted."],
    },
    {
      title: "Where it is processed",
      paras: ["Our providers may process data outside the United Kingdom. Where they do, transfers rely on adequacy regulations or the UK International Data Transfer Agreement and the providers' standard contractual terms."],
    },
    {
      title: "Your rights",
      paras: ["Under UK data protection law you can ask us to confirm what we hold about you, to correct it, to delete it, to restrict or object to how we use it, and to give you a copy in a portable form. Write to the contact above; we reply within one month. If you are unhappy with our answer you can complain to the Information Commissioner's Office at ico.org.uk."],
    },
    { title: "Changes", paras: [`We will change this policy when the service changes. The date at the top is the date of the current version. This version: ${UPDATED}.`] },
  ],
};

export const TERMS: LegalDoc = {
  slug: "terms",
  title: "Terms of use",
  lead: "The terms for using this website and the free material on it. Client engagements are governed by a separate written agreement.",
  updated: UPDATED,
  sections: [
    { title: "Who these terms are between", paras: ["These terms are between you and Threadline (\"we\"). By using Threadline's public website you accept them. If you are a client, your engagement agreement takes precedence over anything here."] },
    {
      title: "What the site is",
      paras: ["The site describes a managed authority system for expert-led firms and offers free material, including the Founder Authority System playbook, a cost calculator and an application form."],
      items: ["The figures, cases and scenarios on the site are illustrative unless stated otherwise. They show how the system works, not results any client has achieved.", "The calculator is a model of the numbers you enter. It does not know your market, and it does not show a saving, a reach figure or a revenue outcome.", "Submitting an application does not create an engagement. We read every application and reply either way."],
    },
    {
      title: "Using the material",
      paras: ["You may read, download and use the playbook and the tools for your own business. You may quote short passages with attribution. You may not republish the material, sell it, or present it as your own. The illustrations, the Threadline name and the thread mark are ours."],
    },
    {
      title: "Your account, if you have one",
      paras: ["Client accounts are for the people a client firm names. Keep your password to yourself, tell us if you think it has been used by someone else, and do not try to reach parts of the service you have not been given access to."],
    },
    {
      title: "What we are not responsible for",
      paras: ["The site is provided as it is. We take care over it, but we do not promise it will be available without interruption or free of errors, and we are not liable for decisions you take on the strength of free material. Nothing in these terms limits liability that cannot be limited by law."],
    },
    { title: "Law", hidden: true, paras: ["These terms are governed by the law of [England and Wales], and its courts have exclusive jurisdiction."] },
    { title: "Changes", paras: [`We may update these terms. The current version is dated ${UPDATED}.`] },
  ],
};

export const COOKIES: LegalDoc = {
  slug: "cookies",
  title: "Cookies and storage",
  lead: "This site sets two cookies of its own and uses your browser's storage for two conveniences. There are no advertising or third-party analytics cookies.",
  updated: UPDATED,
  sections: [
    {
      title: "Cookies",
      table: [
        ["Name", "Set when", "Purpose", "Lasts"],
        ["threadline_session", "A client signs in", "Keeps you signed in to your workspace. Essential.", "Until it expires or you sign out"],
        ["tl_v", "You follow a tracked link (/t/…)", "A random first-party identifier so that repeat clicks from the same browser can be told apart when we measure whether a piece of work was met. It does not identify you.", "12 months"],
      ],
    },
    {
      title: "Browser storage",
      table: [
        ["Key", "Where", "Purpose", "Lasts"],
        ["tl-playbook-read", "localStorage", "Remembers which playbook chapters you have read, on this device only.", "Until you clear site data"],
        ["tl-intro", "sessionStorage", "Plays the site's opening animation once per visit rather than on every page.", "Until you close the tab"],
      ],
    },
    {
      title: "Your choices",
      paras: ["You can block or delete cookies in your browser settings. Blocking the session cookie means you cannot stay signed in. Blocking the tracked-link cookie has no effect on where the link takes you. Clearing site data resets your playbook progress."],
    },
    { title: "Changes", paras: [`If we add a cookie or a storage key we will list it here. Current version: ${UPDATED}.`] },
  ],
};

export const LEGAL_DOCS = [PRIVACY, TERMS, COOKIES] as const;
