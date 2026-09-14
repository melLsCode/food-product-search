import Image from 'next/image';
import Link from 'next/link';

import { LeafIcon } from '@/components/Icons';
import type { Language, Translate } from '@/lib/i18n';
import type { ProductSummary } from '@/lib/types';
import { BARCODE, CARD_INTERACTIVE } from '@/lib/ui';

/**
 * Open Food Facts data is frequently incomplete, so brand and image are optional
 * by design. The card is a fixed-proportion column: the image sits in an
 * aspect-square frame and the text block grows downward, so a row of cards keeps
 * its images aligned no matter how long the product names are.
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
    <li className="h-full">
      <Link
        href={`/products/${product.code}?language=${language}`}
        className={`${CARD_INTERACTIVE} group flex h-full flex-col overflow-hidden`}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              // Empty alt: the product name is rendered as text directly below, so
              // describing the image again would only repeat it to a screen reader.
              alt=""
              fill
              sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
              className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
              <LeafIcon className="h-8 w-8" />
              <span className="px-2 text-center text-xs text-slate-400">
                {translate('product.noImage')}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 border-t border-slate-100 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition group-hover:text-brand-700">
            {product.name}
          </h3>
          <p className="line-clamp-1 text-sm text-slate-500">
            {product.brand ?? translate('product.unknown')}
          </p>
          {/* Pushed to the bottom so barcodes line up across a row of cards. */}
          <p className={`${BARCODE} mt-auto pt-2`}>{product.code}</p>
        </div>
      </Link>
    </li>
  );
}
