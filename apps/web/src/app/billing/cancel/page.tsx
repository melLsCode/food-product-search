import Link from 'next/link';

import { ArrowLeftIcon, SearchIcon } from '@/components/Icons';
import { PageShell } from '@/components/PageShell';
import { SubscribeButton } from '@/components/SubscribeButton';
import { getTranslator, toLanguage } from '@/lib/i18n';
import { BUTTON_SECONDARY, CARD, CONTAINER_NARROW } from '@/lib/ui';

export default async function BillingCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  const language = toLanguage((await searchParams).language);
  const translate = getTranslator(language);

  return (
    <PageShell language={language} translate={translate}>
      <div className={`${CONTAINER_NARROW} py-12 sm:py-16`}>
        {/* Neutral, not red: nothing failed here, the user simply chose not to
            continue, so the page offers both ways forward without alarm. */}
        <div className={`${CARD} px-6 py-10 text-center sm:px-10`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <SearchIcon className="h-7 w-7" />
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            {translate('billing.cancel.title')}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            {translate('billing.cancel.body')}
          </p>

          <div className="mt-8 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
            <Link href={`/?language=${language}`} className={BUTTON_SECONDARY}>
              <ArrowLeftIcon className="h-4 w-4" />
              {translate('product.back')}
            </Link>
            <SubscribeButton language={language} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
