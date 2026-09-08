/**
 * Response shapes returned by the API.
 *
 * These are deliberately declared again here rather than shared through a
 * workspace package: it is roughly fifty lines of interfaces, and a shared
 * package would add build ordering and project references to a two-app repo.
 * Keep in sync with apps/api/src/openfoodfacts/mapper.ts.
 */

export interface ProductSummary {
  code: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
}

export interface ProductDetail extends ProductSummary {
  nameLanguage: string | null;
  quantity: string | null;
  categories: string[];
  ingredientsText: string | null;
  ingredientsLanguage: string | null;
  /** Whether the provider holds nutrition data. Never the data itself. */
  nutritionAvailable: boolean;
}

export interface NutrientValue {
  value: number | null;
  unit: string | null;
}

/** Keys match the nutrition.* message keys, so the table can be rendered in a loop. */
export const NUTRIENT_ORDER = [
  'energyKcal',
  'fat',
  'saturatedFat',
  'carbohydrates',
  'sugars',
  'fiber',
  'proteins',
  'salt',
] as const;

export type NutrientKey = (typeof NUTRIENT_ORDER)[number];

export interface Nutrition {
  code: string;
  available: boolean;
  per: string;
  servingSize: string | null;
  nutrients: Record<NutrientKey, NutrientValue>;
}

export interface RecentSearch {
  term: string;
  language: string;
  resultCount: number;
  updatedAt: string;
}

export interface SubscriptionState {
  active: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface SearchResponse {
  query: string;
  language: string;
  products: ProductSummary[];
}
