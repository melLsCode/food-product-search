import Link from 'next/link';

import { PageHeader } from '@/components/PageHeader';
import { getTranslator, toLanguage } from '@/lib/i18n';

export default async function BillingCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  const language = toLanguage((await searchParams).language);
  const translate = getTranslator(language);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader language={language} translate={translate} />

      <div className="rounded-lg border border-slate-200 p-6">
        <h1 className="text-lg font-semibold text-slate-900">
          {translate('billing.cancel.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{translate('billing.cancel.body')}</p>

        <Link
          href={`/?language=${language}`}
          className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          {translate('product.back')}
        </Link>
      </div>
    </main>
  );
}
