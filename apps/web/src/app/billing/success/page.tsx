import Link from 'next/link';

import { PageHeader } from '@/components/PageHeader';
import { getSubscriptionStatus } from '@/lib/api';
import { getTranslator, toLanguage } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  const language = toLanguage((await searchParams).language);
  const translate = getTranslator(language);

  // Stripe redirects here immediately, but the subscription only becomes active
  // once the webhook has been processed, so the state is read rather than assumed.
  const result = await getSubscriptionStatus();
  const active = result.ok && result.data.subscription.active;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader language={language} translate={translate} />

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h1 className="text-lg font-semibold text-emerald-900">
          {translate('billing.success.title')}
        </h1>
        <p className="mt-1 text-sm text-emerald-900">{translate('billing.success.body')}</p>

        <p className="mt-4 font-medium text-emerald-900">
          {active ? translate('billing.active') : translate('billing.success.pending')}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {!active ? (
            <Link
              href={`/billing/success?language=${language}`}
              className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-medium text-emerald-900"
            >
              {translate('billing.refresh')}
            </Link>
          ) : null}
          <Link
            href={`/?language=${language}`}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            {translate('product.back')}
          </Link>
        </div>
      </div>
    </main>
  );
}
