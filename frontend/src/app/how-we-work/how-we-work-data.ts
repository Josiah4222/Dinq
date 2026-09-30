export interface HowWeWorkStep {
  title: string;
  text: string;
}

/**
 * Single source of truth for the four-step ASSESS / ADVISE / IMPLEMENT /
 * SUPPORT engagement process. Shared across the homepage, the About landing
 * page, the /about/who-we-are page, and solution detail pages so the step copy
 * never drifts.
 */
export const HOW_WE_WORK_STEPS: HowWeWorkStep[] = [
  {
    title: 'Assess',
    text: 'We understand objectives, identify opportunities, evaluate risks, and define a practical roadmap.',
  },
  {
    title: 'Advise',
    text: 'We develop commercially sound strategies supported by local market insight and coordinated legal guidance where required.',
  },
  {
    title: 'Implement',
    text: 'We coordinate stakeholders, engage authorities, manage projects, and support transactions and execution.',
  },
  {
    title: 'Support',
    text: 'We remain engaged through ongoing advisory, reporting, governance support, property and asset management, and trusted local representation.',
  },
];
