import { Router } from 'express';
import { z } from 'zod';

import { getDemoUser } from '../demoUser.js';
import { NotFoundError } from '../errors.js';
import { getProduct, searchProducts } from '../openfoodfacts/client.js';
import { mapNutrition, mapProductDetail, mapSearchResults } from '../openfoodfacts/mapper.js';
import { assertActiveSubscription } from '../subscription.js';
import { barcodeSchema, languageSchema, parseInput, searchQuerySchema } from '../validation.js';
import { recordSearch } from './searches.js';

export const productsRouter = Router();

const productParamsSchema = z.object({ code: barcodeSchema });
const productQuerySchema = z.object({ language: languageSchema });

/**
 * Public search. The response contains only what the result list needs; nutrition
 * is never part of it, so the subscription gate cannot be bypassed by reading
 * search results.
 */
productsRouter.get('/search', async (req, res) => {
  const { q, language } = parseInput(searchQuerySchema, req.query);

  const payload = await searchProducts(q, language);
  const products = mapSearchResults(payload, language);

  // Recording the search must never break the search itself.
  try {
    const user = await getDemoUser();
    await recordSearch(user.id, q, language, products.length);
  } catch (error) {
    console.error('Failed to record recent search:', error);
  }

  res.json({ query: q, language, products });
});

/** Public product detail. Reports whether nutrition exists, never the values. */
productsRouter.get('/:code', async (req, res) => {
  const { code } = parseInput(productParamsSchema, req.params);
  const { language } = parseInput(productQuerySchema, req.query);

  const product = await getProduct(code, language);
  const detail = mapProductDetail(product, language);

  if (!detail) {
    throw new NotFoundError('Product not found');
  }

  res.json({ product: detail });
});

/**
 * Subscription-protected nutrition. The entitlement check runs before the
 * provider is contacted, so an unsubscribed request cannot even cause a lookup,
 * let alone receive data.
 */
productsRouter.get('/:code/nutrition', async (req, res) => {
  const { code } = parseInput(productParamsSchema, req.params);
  const { language } = parseInput(productQuerySchema, req.query);

  const user = await getDemoUser();
  await assertActiveSubscription(user.id);

  const product = await getProduct(code, language);

  res.json({ nutrition: mapNutrition(product, code) });
});
