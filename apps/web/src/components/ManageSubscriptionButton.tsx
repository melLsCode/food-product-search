'use client';

import { useState } from 'react';

import { AlertIcon, SpinnerIcon } from '@/components/Icons';
import { BROWSER_BASE_URL } from '@/lib/api';
import { getTranslator, translateErrorCode, type Language } from '@/lib/i18n';
import { BUTTON_SECONDARY } from '@/lib/ui';

/**
 * Opens Stripe's hosted Customer Portal. Cancellation (and any other change)
 * still lands through the existing webhook; this button only starts the redirect.
 */
export function ManageSubscriptionButton({
  language,
  fullWidth = false,
}: {
  language: Language;
  fullWidth?: boolean;
}) {
  const translate = getTranslator(language);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setIsRedirecting(true);
    setError(null);

    try {
      const response = await fetch(`${BROWSER_BASE_URL}/api/billing/portal`, {
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
        onClick={openPortal}
        disabled={isRedirecting}
        aria-busy={isRedirecting}
        className={`${BUTTON_SECONDARY} ${fullWidth ? 'w-full' : ''}`}
      >
        {isRedirecting ? <SpinnerIcon className="h-4 w-4" /> : null}
        {isRedirecting ? translate('billing.managing') : translate('billing.manage')}
      </button>

      {error ? (
        <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-700">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
