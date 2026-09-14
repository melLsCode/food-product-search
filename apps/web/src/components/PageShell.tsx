import { PageHeader } from '@/components/PageHeader';
import type { Language, Translate } from '@/lib/i18n';
import { CONTAINER } from '@/lib/ui';

/**
 * Common page frame: header, main landmark, footer.
 *
 * Pages previously repeated the container classes and rendered the header inside
 * <main>, which put a banner landmark in the wrong place. Composing the frame here
 * keeps the landmark structure correct and identical on every route.
 *
 * The header cannot live in app/layout.tsx because it needs the selected
 * language, which is a search parameter and therefore only readable by pages.
 */
export function PageShell({
  language,
  translate,
  children,
}: {
  language: Language;
  translate: Translate;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PageHeader language={language} translate={translate} />

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className={`${CONTAINER} py-6`}>
          <p className="text-xs text-slate-500">
            {translate('footer.attribution')}{' '}
            <a
              href="https://openfoodfacts.org"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:decoration-slate-500"
            >
              Open Food Facts
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
