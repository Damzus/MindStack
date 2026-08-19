export interface ServiceDetail {
  slug: string;
  name: string;
  eyebrow: string;
  lead: string;
  included: string[];
  notUs: string[];
  stack: string[];
  steps: { index: string; label: string }[];
  objections: { q: string; a: string }[];
}

export const serviceDetails: ServiceDetail[] = [
  {
    slug: 'web-platforms',
    name: 'Web platforms',
    eyebrow: 'What we do / Web platforms',
    lead: 'Marketing sites, customer portals and internal tools that are fast, measurable and handed over documented.',
    included: [
      'Discovery, design and build',
      'CMS and third-party integrations',
      'Performance budgets enforced in CI',
      'Analytics and conversion instrumentation',
      'Documented handover',
    ],
    notUs: ['Template customisation on someone else’s build', 'Ongoing content authoring', 'Paid media and campaign management'],
    stack: ['TypeScript', 'React', 'Next.js', 'Astro', 'Postgres', 'Vercel', 'Azure'],
    steps: [
      { index: '01', label: 'Paid discovery — architecture, plan and a number' },
      { index: '02', label: 'Design and build in two-week increments' },
      { index: '03', label: 'Staged release with rollback and monitoring' },
      { index: '04', label: 'Handover or managed operation' },
    ],
    objections: [
      { q: 'Who owns the code?', a: 'You do, from the first commit, in your own repository.' },
      { q: 'How fast will it be?', a: 'We agree a performance budget up front and fail the build when it is breached.' },
      { q: 'What drives the cost?', a: 'Integrations, content volume and how much design is genuinely new.' },
    ],
  },
  {
    slug: 'product-engineering',
    name: 'Product & app engineering',
    eyebrow: 'What we do / Product & app engineering',
    lead: 'Web and mobile applications built to be extended by your own team, with the tests and CI to make that safe.',
    included: [
      'Product design and prototyping',
      'Web and mobile application builds',
      'Legacy modernisation and replatforming',
      'Test suites and continuous integration',
      'Knowledge transfer to your engineers',
    ],
    notUs: ['Staff augmentation without design input', 'Fixed-price builds against an unstable spec', 'Native game development'],
    stack: ['TypeScript', 'React', 'Node', 'NestJS', 'Postgres', 'Cosmos DB', 'Redis'],
    steps: [
      { index: '01', label: 'Paid discovery — scope, architecture and estimate' },
      { index: '02', label: 'Increments in your repository, reviewable from day one' },
      { index: '03', label: 'Release with monitoring wired before launch' },
      { index: '04', label: 'We operate it, or train your team to' },
    ],
    objections: [
      { q: 'Will my team be able to extend it?', a: 'That is the acceptance criterion. Tests, CI and documentation are part of the build, not an extra.' },
      { q: 'What if the scope moves?', a: 'Two-week increments mean you can change direction without renegotiating a contract.' },
      { q: 'What drives the cost?', a: 'Integrations, compliance, timeline pressure and legacy migration.' },
    ],
  },
  {
    slug: 'cloud-infrastructure',
    name: 'Cloud & infrastructure',
    eyebrow: 'What we do / Cloud & infrastructure',
    lead: 'The part most agencies leave behind: provisioning, pipelines, monitoring and someone answerable when it pages.',
    included: [
      'Infrastructure as code',
      'CI/CD pipelines and container registries',
      'Observability, alerting and dashboards',
      'Secrets management and access control',
      'Managed operation with a response commitment',
    ],
    notUs: ['Taking the pager on infrastructure we have never reviewed', 'Licence resale', 'On-premise hardware procurement'],
    stack: ['Azure', 'AWS', 'Terraform', 'Kubernetes', 'GitHub Actions', 'Application Insights'],
    steps: [
      { index: '01', label: 'Review of what exists and what it costs' },
      { index: '02', label: 'Infrastructure described as code, in your account' },
      { index: '03', label: 'Pipelines, monitoring and runbooks' },
      { index: '04', label: 'Managed operation or documented handover' },
    ],
    objections: [
      { q: 'Do you lock us in?', a: 'Everything lives in your cloud account, described in code you own.' },
      { q: 'What does managed operation actually mean?', a: 'A written response commitment, named people, and a runbook written by whoever built it.' },
      { q: 'Can you take on infrastructure we already have?', a: 'Yes, after a review. We will not take the pager on something we have not read.' },
    ],
  },
];

export const getServiceDetail = (slug: string) => serviceDetails.find((s) => s.slug === slug);
