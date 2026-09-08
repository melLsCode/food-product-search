import type { Language, Translate } from '@/lib/i18n';

/**
 * A plain GET form: submitting navigates to /?q=…&language=…, which is what
 * triggers the server-rendered search. There is no debounce and no client-side
 * state, because search runs on explicit submit only - Open Food Facts rate
 * limits search requests and explicitly warns against search-as-you-type.
 */
export function SearchForm({
  query,
  language,
  translate,
}: {
  query: string;
  language: Language;
  translate: Translate;
}) {
  return (
    <form action="/" method="get" className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="language" value={language} />
      <label htmlFor="q" className="sr-only">
        {translate('search.label')}
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={query}
        required
        minLength={2}
        maxLength={100}
        placeholder={translate('search.placeholder')}
        className="w-full flex-1 rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-slate-900"
      />
      <button
        type="submit"
        className="rounded-md bg-slate-900 px-5 py-2 font-medium text-white transition hover:bg-slate-700"
      >
        {translate('search.button')}
      </button>
    </form>
  );
}
