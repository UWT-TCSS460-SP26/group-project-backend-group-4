import request from 'supertest';
import { app } from '../src/app';

describe('app', () => {
  it('GET /heartbeat returns healthy status', async () => {
    const res = await request(app).get('/heartbeat');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'healthy' });
  });
});
