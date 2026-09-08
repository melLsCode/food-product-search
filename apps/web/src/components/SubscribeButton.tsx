'use client';

import { useState } from 'react';

import { BROWSER_BASE_URL } from '@/lib/api';
import { getTranslator, translateErrorCode, type Language } from '@/lib/i18n';

/**
 * Starts the Stripe Checkout flow. The browser holds no Stripe credentials: the
 * backend creates the session and returns a hosted Checkout URL to redirect to.
 */
export function SubscribeButton({ language }: { language: Language }) {
  const translate = getTranslator(language);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setIsRedirecting(true);
    setError(null);

    try {
      const response = await fetch(`${BROWSER_BASE_URL}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });

      const body = await response.json();

      if (!response.ok) {
        setError(translateErrorCode(translate, body?.error?.code ?? 'INTERNAL_ERROR'));
        setIsRedirecting(false);
        return;
      }

      window.location.assign(body.url);
    } catch {
      setError(translate('error.NETWORK_ERROR'));
      setIsRedirecting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={subscribe}
        disabled={isRedirecting}
        className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {isRedirecting ? translate('billing.subscribing') : translate('billing.subscribe')}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
