import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The health check is the only place that talks to the database in this test, so
// the client is mocked. That keeps the test able to prove both outcomes -
// reachable and unreachable - without needing a real MySQL instance.
const queryRaw = vi.hoisted(() => vi.fn());

vi.mock('../src/prisma.js', () => ({
  prisma: { $queryRaw: queryRaw },
}));

const { createApp } = await import('../src/app.js');

describe('GET /health', () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it('reports ok when the database responds', async () => {
    queryRaw.mockResolvedValue([{ '1': 1 }]);

    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('reports degraded with 503 when the database is unreachable', async () => {
    queryRaw.mockRejectedValue(new Error('connection refused'));

    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'degraded', database: 'down' });
  });
});

describe('unknown routes', () => {
  it('returns a 404 in the standard error shape', async () => {
    const response = await request(createApp()).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });
});
