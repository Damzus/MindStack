import { useId, useState } from 'react';

const NEEDS = ['Web', 'App', 'Infra'] as const;
const BUDGETS = ['Under $25k', '$25k – $75k', '$75k – $200k', '$200k+', 'Not sure yet'] as const;

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactForm() {
  const uid = useId();
  const [needs, setNeeds] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  const toggleNeed = (need: string) =>
    setNeeds((current) =>
      current.includes(need) ? current.filter((n) => n !== need) : [...current, need]
    );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setErrors({});
    setMessage('');

    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      budget: String(data.get('budget') ?? ''),
      context: String(data.get('context') ?? ''),
      company: String(data.get('company') ?? ''),
      needs,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.ok) {
        setStatus('sent');
        return;
      }

      setStatus('error');
      if (body.errors) setErrors(body.errors);
      setMessage(body.message ?? 'Please check the fields above and try again.');
    } catch {
      setStatus('error');
      setMessage('Network error — please try again, or email us directly.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="form-done" role="status">
        <p className="form-done-title">Thanks — that's with us.</p>
        <p className="form-done-body">
          Waisale Bunoa will reply from a real address, not a drip sequence. If it's urgent, email{' '}
          <a href="mailto:saurabnand951@gmail.com">saurabnand951@gmail.com</a> directly.
        </p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label className="eyebrow" htmlFor={`${uid}-name`}>
          Name
        </label>
        <input id={`${uid}-name`} name="name" type="text" autoComplete="name" required />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>

      <div className="field">
        <label className="eyebrow" htmlFor={`${uid}-email`}>
          Work email
        </label>
        <input id={`${uid}-email`} name="email" type="email" autoComplete="email" required />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      <fieldset className="field field-set">
        <legend className="eyebrow">What do you need?</legend>
        <div className="chips">
          {NEEDS.map((need) => (
            <button
              key={need}
              type="button"
              className={needs.includes(need) ? 'chip chip-on' : 'chip'}
              aria-pressed={needs.includes(need)}
              onClick={() => toggleNeed(need)}
            >
              {need}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label className="eyebrow" htmlFor={`${uid}-budget`}>
          Budget range <span className="optional">optional</span>
        </label>
        <select id={`${uid}-budget`} name="budget" defaultValue="">
          <option value="">Prefer not to say</option>
          {BUDGETS.map((band) => (
            <option key={band} value={band}>
              {band}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="eyebrow" htmlFor={`${uid}-context`}>
          Context
        </label>
        <textarea id={`${uid}-context`} name="context" rows={5} required />
        <p className="field-help">What's in the way, and what does done look like?</p>
        {errors.context && <p className="field-error">{errors.context}</p>}
      </div>

      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${uid}-company`}>Company</label>
        <input id={`${uid}-company`} name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button className="submit" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send'}
      </button>

      <p className="form-note">Five fields. No newsletter, no drip sequence.</p>

      {status === 'error' && message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
