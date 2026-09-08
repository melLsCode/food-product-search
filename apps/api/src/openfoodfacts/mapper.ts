/**
 * Pure translation from Open Food Facts payloads into the shapes this API
 * returns. Everything here works on `unknown`, because the provider is a
 * crowd-sourced database: fields are frequently missing, empty, or a different
 * type than the documentation suggests. No function in this file performs I/O,
 * which is what makes the awkward real-world cases cheap to unit test.
 */

export const SUPPORTED_LANGUAGES = ['en', 'nl', 'de', 'fr'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export interface ProductSummary {
  code: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
}

export interface ProductDetail extends ProductSummary {
  /** Language the name is actually shown in, which may differ from the request. */
  nameLanguage: Language | null;
  quantity: string | null;
  categories: string[];
  ingredientsText: string | null;
  ingredientsLanguage: Language | null;
  /** Whether the provider has nutrition data. Never the data itself: this object
   *  is returned by the public endpoint. */
  nutritionAvailable: boolean;
}

export interface NutrientValue {
  value: number | null;
  unit: string | null;
}

export interface Nutrition {
  code: string;
  available: boolean;
  per: string;
  servingSize: string | null;
  nutrients: Record<NutrientKey, NutrientValue>;
}

/** Whitelist of nutrients exposed to clients, mapped to their Open Food Facts key. */
const NUTRIENT_KEYS = {
  energyKcal: 'energy-kcal',
  fat: 'fat',
  saturatedFat: 'saturated-fat',
  carbohydrates: 'carbohydrates',
  sugars: 'sugars',
  fiber: 'fiber',
  proteins: 'proteins',
  salt: 'salt',
} as const;

export type NutrientKey = keyof typeof NUTRIENT_KEYS;

// --- Safe accessors -------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Trimmed string, or null for anything empty or not a string. */
function asText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Open Food Facts returns numbers as numbers, numeric strings, or "". */
function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * `brands` is a comma-separated string on the product API but a string array on
 * the search API. Only the first brand is exposed.
 */
function asBrand(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const brand = asText(entry);
      if (brand) return brand;
    }
    return null;
  }

  const text = asText(value);
  if (!text) return null;
  return asText(text.split(',')[0]);
}

function asTagList(value: unknown): string[] {
  const source = Array.isArray(value) ? value : asText(value)?.split(',') ?? [];
  return source.map(asText).filter((entry): entry is string => entry !== null);
}

/**
 * Picks the best available translation: the requested language first, then the
 * provider's default field, then the remaining supported languages. Returns the
 * language actually used so the UI can tell the user when it fell back.
 */
export function resolveLocalized(
  product: Record<string, unknown>,
  baseField: string,
  language: Language,
): { value: string; language: Language | null } | null {
  const requested = asText(product[`${baseField}_${language}`]);
  if (requested) return { value: requested, language };

  const generic = asText(product[baseField]);
  if (generic) return { value: generic, language: null };

  for (const fallback of SUPPORTED_LANGUAGES) {
    const value = asText(product[`${baseField}_${fallback}`]);
    if (value) return { value, language: fallback };
  }

  return null;
}

// --- Mapping --------------------------------------------------------------

/**
 * Maps one search hit. Returns null when the product cannot be represented
 * safely - no barcode or no usable name in any language - so the caller can skip
 * it rather than render a blank card.
 */
export function mapProductSummary(hit: unknown, language: Language): ProductSummary | null {
  const product = asRecord(hit);
  if (!product) return null;

  const code = asText(product.code);
  if (!code) return null;

  const name = resolveLocalized(product, 'product_name', language);
  if (!name) return null;

  return {
    code,
    name: name.value,
    brand: asBrand(product.brands),
    imageUrl: asText(product.image_front_small_url) ?? asText(product.image_url),
  };
}

/** Maps a Search-a-licious response, skipping every hit that is not safe to show. */
export function mapSearchResults(payload: unknown, language: Language): ProductSummary[] {
  const body = asRecord(payload);
  const hits = body?.hits;
  if (!Array.isArray(hits)) return [];

  return hits
    .map((hit) => mapProductSummary(hit, language))
    .filter((product): product is ProductSummary => product !== null);
}

/**
 * Maps the public product detail. Deliberately builds the object field by field:
 * the raw payload contains `nutriments`, and spreading it here would leak the
 * subscription-protected data through a public endpoint.
 */
export function mapProductDetail(product: unknown, language: Language): ProductDetail | null {
  const summary = mapProductSummary(product, language);
  const raw = asRecord(product);
  if (!summary || !raw) return null;

  const name = resolveLocalized(raw, 'product_name', language);
  const ingredients = resolveLocalized(raw, 'ingredients_text', language);

  return {
    ...summary,
    nameLanguage: name?.language ?? null,
    quantity: asText(raw.quantity),
    categories: asTagList(raw.categories),
    ingredientsText: ingredients?.value ?? null,
    ingredientsLanguage: ingredients?.language ?? null,
    nutritionAvailable: hasNutriments(raw),
  };
}

function hasNutriments(product: Record<string, unknown>): boolean {
  const nutriments = asRecord(product.nutriments);
  if (!nutriments) return false;

  return Object.values(NUTRIENT_KEYS).some(
    (key) => asNumber(nutriments[`${key}_100g`]) !== null || asNumber(nutriments[key]) !== null,
  );
}

/**
 * Maps the subscription-protected nutrition data. Values are per 100g, which is
 * the basis Open Food Facts normalizes to. Missing nutrients stay null rather
 * than being dropped, so the UI can show a complete table with gaps.
 */
export function mapNutrition(product: unknown, code: string): Nutrition {
  const raw = asRecord(product);
  const nutriments = raw ? asRecord(raw.nutriments) : null;

  const nutrients = {} as Record<NutrientKey, NutrientValue>;
  for (const [key, providerKey] of Object.entries(NUTRIENT_KEYS) as [NutrientKey, string][]) {
    nutrients[key] = {
      value: nutriments
        ? asNumber(nutriments[`${providerKey}_100g`]) ?? asNumber(nutriments[providerKey])
        : null,
      unit: nutriments ? asText(nutriments[`${providerKey}_unit`]) : null,
    };
  }

  return {
    code,
    available: raw ? hasNutriments(raw) : false,
    per: '100g',
    servingSize: raw ? asText(raw.serving_size) : null,
    nutrients,
  };
}
