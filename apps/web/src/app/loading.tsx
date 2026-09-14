import { ResultsSkeleton } from '@/components/States';
import { DEFAULT_LANGUAGE, getTranslator } from '@/lib/i18n';
import { CONTAINER } from '@/lib/ui';

/**
 * Shown while a navigation renders on the server.
 *
 * A route-level loading file receives no params, so the label falls back to the
 * default language. It is a single generic word, and the real per-search label is
 * rendered by the page's own Suspense boundary once the language is known.
 */
export default function Loading() {
  const translate = getTranslator(DEFAULT_LANGUAGE);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mirrors the real header's height so the page does not jump when it loads. */}
      <div className="h-16 border-b border-slate-200 bg-white" />

      <div className={`${CONTAINER} py-10`}>
        <div className="mb-8 space-y-3">
          <div className="h-8 w-2/3 max-w-md animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-1/2 max-w-sm animate-pulse rounded bg-slate-100" />
        </div>
        <ResultsSkeleton label={translate('app.loading')} />
      </div>
    </div>
  );
}
