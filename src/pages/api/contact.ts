import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const NEEDS = ['Web', 'App', 'Infra'] as const;

interface Payload {
  name: string;
  email: string;
  needs: string[];
  budget: string;
  context: string;
  company?: string;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

function validate(raw: Partial<Payload>) {
  const errors: Record<string, string> = {};

  const name = String(raw.name ?? '').trim();
  const email = String(raw.email ?? '').trim();
  const context = String(raw.context ?? '').trim();
  const budget = String(raw.budget ?? '').trim();
  const needs = Array.isArray(raw.needs) ? raw.needs.filter((n) => NEEDS.includes(n as never)) : [];

  if (name.length < 2 || name.length > 120) errors.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200)
    errors.email = 'Enter a valid work email.';
  if (context.length < 10) errors.context = 'Tell us a little about the problem.';
  if (context.length > 4000) errors.context = 'That is too long — 4000 characters maximum.';

  return { errors, clean: { name, email, context, budget, needs } };
}

export const POST: APIRoute = async ({ request }) => {
  let raw: Partial<Payload>;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, message: 'Malformed request.' }, 400);
  }

  if (String(raw.company ?? '').trim() !== '') {
    return json({ ok: true }, 200);
  }

  const { errors, clean } = validate(raw);
  if (Object.keys(errors).length > 0) {
    return json({ ok: false, errors }, 422);
  }

  const runtime: Record<string, string | undefined> =
    typeof process !== 'undefined' && process.env ? process.env : {};

  const apiKey = runtime.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
  const to = runtime.CONTACT_TO_EMAIL || import.meta.env.CONTACT_TO_EMAIL;
  const from =
    runtime.CONTACT_FROM_EMAIL ||
    import.meta.env.CONTACT_FROM_EMAIL ||
    'MindStack <onboarding@resend.dev>';

  if (!apiKey || !to) {
    console.error('[contact] RESEND_API_KEY or CONTACT_TO_EMAIL is not set — email not sent.');
    return json(
      { ok: false, message: 'The contact form is not configured yet. Please email us directly.' },
      503
    );
  }

  const needsLine = clean.needs.length ? clean.needs.join(', ') : 'Not specified';
  const budgetLine = clean.budget || 'Not specified';

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: clean.email,
      subject: `New enquiry — ${clean.name}`,
      text: [
        `Name:    ${clean.name}`,
        `Email:   ${clean.email}`,
        `Needs:   ${needsLine}`,
        `Budget:  ${budgetLine}`,
        '',
        'Context:',
        clean.context,
      ].join('\n'),
    });

    if (error) {
      console.error('[contact] Resend rejected the send:', error);
      return json({ ok: false, message: 'We could not send that. Please try again.' }, 502);
    }

    return json({ ok: true }, 200);
  } catch (cause) {
    console.error('[contact] Unexpected failure:', cause);
    return json({ ok: false, message: 'We could not send that. Please try again.' }, 500);
  }
};
