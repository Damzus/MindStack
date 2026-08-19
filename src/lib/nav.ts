export interface NavLink {
  label: string;
  href: string;
}

export interface NavItem extends NavLink {
  children?: NavLink[];
}

export const services: NavLink[] = [
  { label: 'Web platforms', href: '/what-we-do/web-platforms' },
  { label: 'Product & app engineering', href: '/what-we-do/product-engineering' },
  { label: 'Cloud & infrastructure', href: '/what-we-do/cloud-infrastructure' },
];

export const primaryNav: NavItem[] = [
  { label: 'Work', href: '/work' },
  { label: 'What we do', href: '/what-we-do', children: services },
  { label: 'How we build', href: '/how-we-build' },
  { label: 'Engagement', href: '/engagement' },
  { label: 'Team', href: '/team' },
];

export const conversionCta: NavLink = { label: 'Talk to sales', href: '/contact' };

export const footerNav: { heading: string; links: NavLink[] }[] = [
  { heading: 'What we do', links: services },
  {
    heading: 'Company',
    links: [
      { label: 'Work', href: '/work' },
      { label: 'Team', href: '/team' },
      { label: 'How we build', href: '/how-we-build' },
      { label: 'Engagement', href: '/engagement' },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Security', href: '/security' },
];
