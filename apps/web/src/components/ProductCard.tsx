import Image from 'next/image';
import Link from 'next/link';

import type { Language, Translate } from '@/lib/i18n';
import type { ProductSummary } from '@/lib/types';

/**
 * Open Food Facts data is frequently incomplete, so brand and image are optional
 * by design and the card stays the same size either way.
 */
export function ProductCard({
  product,
  language,
  translate,
}: {
  product: ProductSummary;
  language: Language;
  translate: Translate;
}) {
  return (
    <li>
      <Link
        href={`/products/${product.code}?language=${language}`}
        className="flex h-full gap-4 rounded-lg border border-slate-200 p-3 transition hover:border-slate-400 hover:bg-slate-50"
      >
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt=""
              fill
              sizes="80px"
              className="object-contain"
              unoptimized
            />
          ) : (
            <span className="px-1 text-center text-[10px] text-slate-400">
              {translate('product.noImage')}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{product.name}</p>
          <p className="mt-0.5 text-sm text-slate-500">
            {product.brand ?? translate('product.unknown')}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-400">{product.code}</p>
        </div>
      </Link>
    </li>
  );
}
