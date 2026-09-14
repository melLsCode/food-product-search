import { CheckCircleIcon, LockIcon } from '@/components/Icons';
import { SubscribeButton } from '@/components/SubscribeButton';
import { formatNutrientValue } from '@/lib/format';
import type { Language, MessageKey, Translate } from '@/lib/i18n';
import { NUTRIENT_ORDER, type Nutrition } from '@/lib/types';
import { CARD, EYEBROW, SECTION_TITLE } from '@/lib/ui';

/**
 * Shown when the API answered 402. It contains no nutrition values, because the
 * server never sent any - the lock is enforced in the backend, not here.
 *
 * Presented as an offer rather than an error: the panel lists the nutrient names
 * it would reveal, but the values are literal placeholder bars, so nothing is
 * being hidden client-side that a reader could recover from the markup.
 */
export function LockedNutrition({
  language,
  translate,
}: {
  language: Language;
  translate: Translate;
}) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="border-b border-brand-100 bg-gradient-to-br from-brand-50 to-white px-6 py-6 sm:px-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <LockIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {translate('nutrition.locked.title')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {translate('nutrition.locked.body')}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8">
        {/* The teaser: real nutrient labels, deliberately empty values. */}
        <ul aria-hidden="true" className="mb-6 divide-y divide-slate-100">
          {NUTRIENT_ORDER.slice(0, 4).map((key) => (
            <li key={key} className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-sm text-slate-500">
                {translate(`nutrition.${key}` as MessageKey)}
              </span>
              <span className="h-3 w-14 rounded-full bg-slate-200/80" />
            </li>
          ))}
        </ul>

        <p className="flex items-start gap-2.5 text-sm text-slate-600">
          <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <span>{translate('nutrition.locked.included')}</span>
        </p>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className={EYEBROW}>{translate('nutrition.locked.price')}</p>
          <SubscribeButton language={language} label={translate('nutrition.locked.cta')} />
        </div>
      </div>
    </section>
  );
}

export function NutritionTable({
  nutrition,
  language,
  translate,
}: {
  nutrition: Nutrition;
  language: Language;
  translate: Translate;
}) {
  if (!nutrition.available) {
    return (
      <section className={`${CARD} px-6 py-6 sm:px-8`}>
        <h2 className={SECTION_TITLE}>{translate('nutrition.title')}</h2>
        <p className="mt-1.5 text-sm text-slate-500">{translate('nutrition.unavailable')}</p>
      </section>
    );
  }

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-100 px-6 py-5 sm:px-8">
        <h2 className={SECTION_TITLE}>{translate('nutrition.title')}</h2>
        <p className="text-sm text-slate-500">
          {translate('nutrition.per')}
          {nutrition.servingSize
            ? ` · ${translate('nutrition.servingSize', { size: nutrition.servingSize })}`
            : ''}
        </p>
      </div>

      <dl className="divide-y divide-slate-100">
        {NUTRIENT_ORDER.map((key) => {
          const nutrient = nutrition.nutrients[key];
          const isMissing = nutrient.value === null;

          return (
            <div
              key={key}
              className="flex items-baseline justify-between gap-4 px-6 py-3 transition hover:bg-slate-50/70 sm:px-8"
            >
              <dt className="text-sm text-slate-600">
                {translate(`nutrition.${key}` as MessageKey)}
              </dt>
              {/* tabular-nums keeps the decimal points aligned down the column. */}
              <dd
                className={
                  isMissing
                    ? 'text-sm text-slate-400'
                    : 'text-sm font-semibold tabular-nums text-slate-900'
                }
              >
                {isMissing ? (
                  translate('product.unknown')
                ) : (
                  <>
                    {formatNutrientValue(nutrient.value as number, language)}
                    {nutrient.unit ? (
                      <span className="ml-1 font-normal text-slate-500">{nutrient.unit}</span>
                    ) : null}
                  </>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
