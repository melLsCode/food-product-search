'use client';

import { useState } from 'react';

import { AlertIcon, LockIcon, SpinnerIcon } from '@/components/Icons';
import { BROWSER_BASE_URL } from '@/lib/api';
import { getTranslator, translateErrorCode, type Language } from '@/lib/i18n';
import { BUTTON_BRAND } from '@/lib/ui';

/**
 * Starts the Stripe Checkout flow. The browser holds no Stripe credentials: the
 * backend creates the session and returns a hosted Checkout URL to redirect to.
 *
 * `label` lets the calling surface phrase the action in context ("Unlock
 * nutrition" beside the locked panel, "Subscribe" on a billing page). It is a
 * plain string rather than a translator, because props crossing into a Client
 * Component have to be serializable.
 */
export function SubscribeButton({
  language,
  label,
  fullWidth = false,
}: {
  language: Language;
  label?: string;
  fullWidth?: boolean;
}) {
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
    <div className={fullWidth ? 'w-full' : undefined}>
      <button
        type="button"
        onClick={subscribe}
        disabled={isRedirecting}
        // Announces the pending redirect to assistive tech, not just visually.
        aria-busy={isRedirecting}
        className={`${BUTTON_BRAND} ${fullWidth ? 'w-full' : ''}`}
      >
        {isRedirecting ? (
          <SpinnerIcon className="h-4 w-4" />
        ) : (
          <LockIcon className="h-4 w-4" />
        )}
        {isRedirecting ? translate('billing.subscribing') : (label ?? translate('billing.subscribe'))}
      </button>

      {error ? (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 text-sm text-red-700"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
