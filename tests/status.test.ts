import request from 'supertest';
import { app } from '../src/app';

describe('Status Router', () => {
  it('GET /heartbeat should return status healthy', async () => {
    const response = await request(app).get('/heartbeat');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'healthy' });
  });
});
