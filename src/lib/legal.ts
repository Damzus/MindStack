export interface LegalMeta {
  tradingName: string;
  registeredName: string | null;
  jurisdiction: string;
  city: string;
  contactEmail: string;
  updated: string;
}

export const legal: LegalMeta = {
  tradingName: 'MindStack',
  registeredName: null,
  jurisdiction: 'Fiji',
  city: 'Suva',
  contactEmail: 'saurabnand951@gmail.com',
  updated: '20 August 2026',
};

export const entityName = legal.registeredName ?? legal.tradingName;
export const entityPlace = `${legal.city}, ${legal.jurisdiction}`;

export const subprocessors = [
  {
    name: 'Vercel',
    role: 'Website hosting and delivery',
    data: 'Server logs, including IP address and user agent, and contact form submissions in transit',
  },
  {
    name: 'Resend',
    role: 'Email delivery for the contact form',
    data: 'The contents of your enquiry and your email address',
  },
  {
    name: 'Google (Gmail)',
    role: 'The mailbox that receives enquiries',
    data: 'Your enquiry, retained as business correspondence',
  },
];
