import { Router } from 'express';

import { getDemoUser } from '../demoUser.js';
import { prisma } from '../prisma.js';
import type { Language } from '../openfoodfacts/mapper.js';
import { parseInput, recentSearchesQuerySchema } from '../validation.js';

/** Trim and lowercase, so "  Nutella " and "nutella" are the same recent search. */
export function normalizeTerm(term: string): string {
  return term.trim().toLowerCase();
}

/**
 * Records a search for the demo user. The unique constraint on
 * (userId, term, language) plus an upsert means repeating a search refreshes the
 * existing row instead of filling the list with duplicates.
 */
export async function recordSearch(
  userId: string,
  term: string,
  language: Language,
  resultCount: number,
): Promise<void> {
  const normalized = normalizeTerm(term);

  await prisma.recentSearch.upsert({
    where: { userId_term_language: { userId, term: normalized, language } },
    update: { resultCount },
    create: { userId, term: normalized, language, resultCount },
  });
}

export const searchesRouter = Router();

searchesRouter.get('/recent', async (req, res) => {
  const { limit } = parseInput(recentSearchesQuerySchema, req.query);
  const user = await getDemoUser();

  const searches = await prisma.recentSearch.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: { term: true, language: true, resultCount: true, updatedAt: true },
  });

  res.json({ searches });
});
