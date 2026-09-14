import { SearchIcon } from '@/components/Icons';
import type { Language, Translate } from '@/lib/i18n';
import { BUTTON_PRIMARY, INPUT } from '@/lib/ui';

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
    <form action="/" method="get" className="flex flex-col gap-3 sm:flex-row">
      <input type="hidden" name="language" value={language} />

      <div className="relative flex-1">
        <label htmlFor="q" className="sr-only">
          {translate('search.label')}
        </label>
        {/* Positioned rather than inside the field so the input keeps its own
            focus ring and full clickable area. */}
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <SearchIcon className="h-5 w-5" />
        </span>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          required
          minLength={2}
          maxLength={100}
          autoComplete="off"
          placeholder={translate('search.placeholder')}
          className={`${INPUT} pl-11`}
        />
      </div>

      <button type="submit" className={`${BUTTON_PRIMARY} shrink-0 py-3 sm:px-7`}>
        <SearchIcon className="h-4 w-4 sm:hidden" />
        {translate('search.button')}
      </button>
    </form>
  );
}
