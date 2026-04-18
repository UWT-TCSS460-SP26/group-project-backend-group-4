import request from 'supertest';
import { app } from '../../../src/app';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

beforeEach(() => {
  process.env.TMDB_API_KEY = 'TEST API KEY';
  global.fetch = jest.fn();
});

afterEach(() => {
  delete process.env.TMDB_API_KEY;
  jest.restoreAllMocks();
});

describe('Get movie by id', () => {
  it('GET /api/movies/550 should return movie with id 550 (fight club)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        adult: false,
        backdrop_path: '/c6OLXfKAk5BKeR6broC8pYiCquX.jpg',
        belongs_to_collection: null,
        budget: 63000000,
        genres: [
          { id: 18, name: 'Drama' },
          { id: 53, name: 'Thriller' },
        ],
        homepage: 'https://www.20thcenturystudios.com/movies/fight-club',
        id: 550,
        imdb_id: 'tt0137523',
        origin_country: ['US'],
        original_language: 'en',
        original_title: 'Fight Club',
        overview:
          'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
        popularity: 24.6476,
        poster_path: '/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg',
        production_companies: [
          {
            id: 711,
            logo_path: '/tEiIH5QesdheJmDAqQwvtN60727.png',
            name: 'Fox 2000 Pictures',
            origin_country: 'US',
          },
          {
            id: 508,
            logo_path: '/4sGWXoboEkWPphI6es6rTmqkCBh.png',
            name: 'Regency Enterprises',
            origin_country: 'US',
          },
          {
            id: 4700,
            logo_path: '/A32wmjrs9Psf4zw0uaixF0GXfxq.png',
            name: 'Linson Entertainment',
            origin_country: 'US',
          },
          {
            id: 25,
            logo_path: '/qZCc1lty5FzX30aOCVRBLzaVmcp.png',
            name: '20th Century Fox',
            origin_country: 'US',
          },
          {
            id: 20555,
            logo_path: '/hD8yEGUBlHOcfHYbujp71vD8gZp.png',
            name: 'Taurus Film',
            origin_country: 'DE',
          },
        ],
        production_countries: [
          { iso_3166_1: 'DE', name: 'Germany' },
          { iso_3166_1: 'US', name: 'United States of America' },
        ],
        release_date: '1999-10-15',
        revenue: 100853753,
        runtime: 139,
        spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
        status: 'Released',
        tagline: 'Mischief. Mayhem. Soap.',
        title: 'Fight Club',
        video: false,
        vote_average: 8.439,
        vote_count: 31797,
      }),
    });
    const res = await request(app).get('/api/movies/550');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 550,
      title: 'Fight Club',
      overview:
        'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
      release_date: '1999-10-15',
      poster_path: '/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg',
      budget: 63000000,
      genres: [
        {
          id: 18,
          name: 'Drama',
        },
        {
          id: 53,
          name: 'Thriller',
        },
      ],
    });
  });
});

describe('Get movie by id with missing api key', () => {
  it('Handles a missing API key', async () => {
    delete process.env.TMDB_API_KEY;
    const res = await request(app).get('/api/movies/550');

    expect(res.status).toBe(500);
  });
});

describe('Get movie by id when no tmdb response', () => {
  it('Handles a missing API key', async () => {
    const res = await request(app).get('/api/movies/550');

    expect(res.status).toBe(502);
  });
});

describe('Get movie by invalid id', () => {
  it('Handles an invalid movie id', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        success: false,
        status_code: 6,
        status_message: 'Invalid id: The pre-requisite id is invalid or not found.',
      }),
    });
    const res = await request(app).get('/api/movies/_');

    expect(res.status).toBe(404);
  });
});
