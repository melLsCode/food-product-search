import Link from 'next/link';

import { ArrowLeftIcon, CheckCircleIcon, SpinnerIcon } from '@/components/Icons';
import { ManageSubscriptionButton } from '@/components/ManageSubscriptionButton';
import { PageShell } from '@/components/PageShell';
import { SubscribeButton } from '@/components/SubscribeButton';
import { getSubscriptionStatus } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { getTranslator, toLanguage } from '@/lib/i18n';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, CONTAINER_NARROW, EYEBROW } from '@/lib/ui';

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
  const subscription = result.ok ? result.data.subscription : null;
  const active = subscription?.active ?? false;
  // A stored non-active status means the webhook has already written a
  // cancellation (or other inactive state). No status yet is checkout pending.
  const view = active ? 'active' : subscription?.status ? 'inactive' : 'pending';

  const periodEnd = formatDate(subscription?.currentPeriodEnd ?? null, language);
  const renewalNote =
    periodEnd === null
      ? null
      : subscription?.cancelAtPeriodEnd
        ? translate('billing.cancelsOn', { date: periodEnd })
        : translate('billing.renews', { date: periodEnd });

  const title =
    view === 'active'
      ? translate('billing.active.title')
      : view === 'inactive'
        ? translate('billing.inactive.title')
        : translate('billing.success.title');
  const body =
    view === 'active'
      ? translate('billing.active.body')
      : view === 'inactive'
        ? translate('billing.inactive.body')
        : translate('billing.success.body');
  const statusLabel =
    view === 'active'
      ? translate('billing.active')
      : view === 'inactive'
        ? translate('billing.inactive')
        : translate('billing.success.pending');

  return (
    <PageShell language={language} translate={translate}>
      <div className={`${CONTAINER_NARROW} py-12 sm:py-16`}>
        <div className={`${CARD} px-6 py-10 text-center sm:px-10`}>
          {/* The completed action is the headline: a solid brand mark rather than
              a status colour on a panel, so this reads as a receipt. */}
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              view === 'active' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {view === 'active' ? (
              <CheckCircleIcon className="h-7 w-7" />
            ) : view === 'pending' ? (
              <SpinnerIcon className="h-6 w-6" />
            ) : null}
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{body}</p>

          <div className="mt-8 inline-flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <span className={EYEBROW}>{statusLabel}</span>
            {view === 'active' && renewalNote ? (
              <span className="text-sm text-slate-600">{renewalNote}</span>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            {view === 'pending' ? (
              <Link href={`/billing/success?language=${language}`} className={BUTTON_SECONDARY}>
                {translate('billing.refresh')}
              </Link>
            ) : view === 'active' ? (
              <ManageSubscriptionButton language={language} />
            ) : (
              <SubscribeButton language={language} />
            )}
            <Link href={`/?language=${language}`} className={BUTTON_PRIMARY}>
              <ArrowLeftIcon className="h-4 w-4" />
              {translate('product.back')}
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
