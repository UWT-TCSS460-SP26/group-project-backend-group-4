import request from 'supertest';
import { app } from '../src/app';

describe('Greeting Route', () => {
  it('GET /greeting — returns greeting message', async () => {
    const response = await request(app).get('/greeting');
    expect(response.status).toBe(200);
    expect(response.body.greeting).toBe('Welcome to the TCSS 460 API!');
  });
});
