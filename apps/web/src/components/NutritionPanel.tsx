import { SubscribeButton } from '@/components/SubscribeButton';
import type { Language, MessageKey, Translate } from '@/lib/i18n';
import { NUTRIENT_ORDER, type Nutrition } from '@/lib/types';

/**
 * Shown when the API answered 402. It contains no nutrition values, because the
 * server never sent any - the lock is enforced in the backend, not here.
 */
export function LockedNutrition({
  language,
  translate,
}: {
  language: Language;
  translate: Translate;
}) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <h2 className="font-semibold text-amber-900">{translate('nutrition.locked.title')}</h2>
      <p className="mt-1 mb-4 text-sm text-amber-900">{translate('nutrition.locked.body')}</p>
      <SubscribeButton language={language} />
    </section>
  );
}

export function NutritionTable({
  nutrition,
  translate,
}: {
  nutrition: Nutrition;
  translate: Translate;
}) {
  if (!nutrition.available) {
    return (
      <section className="rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900">{translate('nutrition.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{translate('nutrition.unavailable')}</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900">{translate('nutrition.title')}</h2>
      <p className="text-sm text-slate-500">
        {translate('nutrition.per')}
        {nutrition.servingSize
          ? ` · ${translate('nutrition.servingSize', { size: nutrition.servingSize })}`
          : ''}
      </p>

      <dl className="mt-4 divide-y divide-slate-100">
        {NUTRIENT_ORDER.map((key) => {
          const nutrient = nutrition.nutrients[key];
          return (
            <div key={key} className="flex justify-between gap-4 py-2 text-sm">
              <dt className="text-slate-600">{translate(`nutrition.${key}` as MessageKey)}</dt>
              <dd className="font-medium text-slate-900">
                {nutrient.value === null
                  ? translate('product.unknown')
                  : `${nutrient.value} ${nutrient.unit ?? ''}`.trim()}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
