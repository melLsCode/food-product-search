import { describe, expect, it } from 'vitest';

import {
  mapNutrition,
  mapProductSummary,
  mapSearchResults,
  resolveLocalized,
} from '../../src/openfoodfacts/mapper.js';

describe('mapProductSummary', () => {
  it('maps a complete product', () => {
    const result = mapProductSummary(
      {
        code: '3017620422003',
        product_name: 'Nutella',
        brands: ['Ferrero', 'Nutella'],
        image_front_small_url: 'https://images.openfoodfacts.org/front.jpg',
      },
      'en',
    );

    expect(result).toEqual({
      code: '3017620422003',
      name: 'Nutella',
      brand: 'Ferrero',
      imageUrl: 'https://images.openfoodfacts.org/front.jpg',
    });
  });

  it('prefers the requested language over the default name', () => {
    const result = mapProductSummary(
      { code: '1', product_name: 'Hazelnut spread', product_name_nl: 'Hazelnootpasta' },
      'nl',
    );

    expect(result?.name).toBe('Hazelnootpasta');
  });

  it('treats brands as a comma separated string when the provider sends one', () => {
    const result = mapProductSummary(
      { code: '1', product_name: 'Nutella', brands: 'Ferrero, Nutella' },
      'en',
    );

    expect(result?.brand).toBe('Ferrero');
  });

  it('returns null nulls for missing brand and image rather than failing', () => {
    const result = mapProductSummary({ code: '1', product_name: 'Plain' }, 'en');

    expect(result).toEqual({ code: '1', name: 'Plain', brand: null, imageUrl: null });
  });

  it('treats empty strings as missing', () => {
    const result = mapProductSummary(
      { code: '1', product_name: 'Plain', brands: '   ', image_front_small_url: '' },
      'en',
    );

    expect(result?.brand).toBeNull();
    expect(result?.imageUrl).toBeNull();
  });

  it('skips a product without a barcode', () => {
    expect(mapProductSummary({ product_name: 'No code' }, 'en')).toBeNull();
  });

  it('skips a product with no name in any supported language', () => {
    expect(mapProductSummary({ code: '1', product_name: '' }, 'en')).toBeNull();
  });

  it('skips malformed entries', () => {
    expect(mapProductSummary(null, 'en')).toBeNull();
    expect(mapProductSummary('not an object', 'en')).toBeNull();
    expect(mapProductSummary([], 'en')).toBeNull();
  });
});

describe('resolveLocalized', () => {
  it('falls back through generic, then other languages, and reports which was used', () => {
    expect(resolveLocalized({ product_name_de: 'Kekse' }, 'product_name', 'nl')).toEqual({
      value: 'Kekse',
      language: 'de',
    });

    expect(
      resolveLocalized({ product_name: 'Biscuits' }, 'product_name', 'nl'),
    ).toEqual({ value: 'Biscuits', language: null });
  });

  it('returns null when no language has a value', () => {
    expect(resolveLocalized({ product_name_nl: '  ' }, 'product_name', 'nl')).toBeNull();
  });
});

describe('mapSearchResults', () => {
  it('keeps valid hits and drops unusable ones', () => {
    const payload = {
      hits: [
        { code: '1', product_name: 'Good' },
        { code: '', product_name: 'No code' },
        null,
        { code: '2' },
        { code: '3', product_name: 'Also good' },
      ],
    };

    expect(mapSearchResults(payload, 'en').map((product) => product.code)).toEqual(['1', '3']);
  });

  it('returns an empty array when the payload has no hits', () => {
    expect(mapSearchResults({}, 'en')).toEqual([]);
    expect(mapSearchResults({ hits: 'nope' }, 'en')).toEqual([]);
    expect(mapSearchResults(null, 'en')).toEqual([]);
  });
});

describe('mapNutrition', () => {
  it('maps whitelisted nutrients and parses numeric strings', () => {
    const result = mapNutrition(
      {
        nutriments: {
          'energy-kcal_100g': 539,
          'energy-kcal_unit': 'kcal',
          fat_100g: '30.9',
          fat_unit: 'g',
          salt_100g: 0.107,
        },
        serving_size: '15 g',
      },
      '3017620422003',
    );

    expect(result.available).toBe(true);
    expect(result.per).toBe('100g');
    expect(result.servingSize).toBe('15 g');
    expect(result.nutrients.energyKcal).toEqual({ value: 539, unit: 'kcal' });
    expect(result.nutrients.fat).toEqual({ value: 30.9, unit: 'g' });
    expect(result.nutrients.salt.value).toBe(0.107);
  });

  it('reports every nutrient as null when the product has no nutriments', () => {
    const result = mapNutrition({ product_name: 'Unknown' }, '1');

    expect(result.available).toBe(false);
    expect(result.nutrients.proteins).toEqual({ value: null, unit: null });
  });

  it('ignores unparseable values instead of returning NaN', () => {
    const result = mapNutrition({ nutriments: { sugars_100g: '', fat_100g: 'n/a' } }, '1');

    expect(result.nutrients.sugars.value).toBeNull();
    expect(result.nutrients.fat.value).toBeNull();
    expect(result.available).toBe(false);
  });
});
