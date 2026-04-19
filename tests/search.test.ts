import request from 'supertest';
import { app } from '../src/app';

// Mock fetch globally for TMDB API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Search Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TMDB_API_KEY = 'test_api_key';
  });

  describe('GET /api/movies/search', () => {
    it('should return search results for valid query', async () => {
      const mockResponse = {
        results: [
          {
            id: 123,
            title: 'Test Movie',
            release_date: '2023-01-01',
            poster_path: '/test.jpg',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await request(app).get('/api/movies/search').query({ q: 'test' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 20);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0]).toEqual({
        id: 123,
        title: 'Test Movie',
        release_date: '2023-01-01',
        poster_path: '/test.jpg',
      });
    });

    it('should return search results for valid query, page, and limit parameters', async () => {
      const mockResponse = {
        results: [
          {
            id: 123,
            title: 'Test Movie',
            release_date: '2023-01-01',
            poster_path: '/test.jpg',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await request(app)
        .get('/api/movies/search')
        .query({ q: 'test', page: 2, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page', 2);
      expect(res.body).toHaveProperty('limit', 10);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0]).toEqual({
        id: 123,
        title: 'Test Movie',
        release_date: '2023-01-01',
        poster_path: '/test.jpg',
      });
    });

    it('should return search results for valid query, and page parameters, and no limit parameters', async () => {
      const mockResponse = {
        results: [
          {
            id: 123,
            title: 'Test Movie',
            release_date: '2023-01-01',
            poster_path: '/test.jpg',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await request(app).get('/api/movies/search').query({ q: 'test', page: 2 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page', 2);
      expect(res.body).toHaveProperty('limit', 20);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0]).toEqual({
        id: 123,
        title: 'Test Movie',
        release_date: '2023-01-01',
        poster_path: '/test.jpg',
      });
    });

    it('should return search results for valid query, and limit parameters, no page parameters', async () => {
      const mockResponse = {
        results: [
          {
            id: 123,
            title: 'Test Movie',
            release_date: '2023-01-01',
            poster_path: '/test.jpg',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await request(app).get('/api/movies/search').query({ q: 'test', limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 10);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0]).toEqual({
        id: 123,
        title: 'Test Movie',
        release_date: '2023-01-01',
        poster_path: '/test.jpg',
      });
    });

    it('should return 400 for missing q parameter', async () => {
      const res = await request(app).get('/api/movies/search');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('q is required and must be a string');
    });

    it('should return 400 for invalid page parameter(not a number)', async () => {
      const res = await request(app)
        .get('/api/movies/search')
        .query({ q: 'test', page: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for a page parameter less than 1', async () => {
      const res = await request(app).get('/api/movies/search').query({ q: 'test', page: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for a page parameter greater than 1000', async () => {
      const res = await request(app).get('/api/movies/search').query({ q: 'test', page: 1001 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for invalid limit parameter(not a number)', async () => {
      const res = await request(app).get('/api/movies/search').query({ q: 'test', limit: 'test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for a limit parameter less than 1', async () => {
      const res = await request(app).get('/api/movies/search').query({ q: 'test', limit: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for a limit parameter greater than 50', async () => {
      const res = await request(app).get('/api/movies/search').query({ q: 'test', limit: 51 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for invalid page and limit parameters', async () => {
      const res = await request(app)
        .get('/api/movies/search')
        .query({ q: 'test', page: 'invalid', limit: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for invalid page, but valid limit parameter', async () => {
      const res = await request(app)
        .get('/api/movies/search')
        .query({ q: 'test', page: 'invalid', limit: 20 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for valid page, but invalid limit parameter', async () => {
      const res = await request(app)
        .get('/api/movies/search')
        .query({ q: 'test', page: 1, limit: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
    });

    it('should return 404 when TMDB returns not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ status_message: 'Not found' }),
      });

      const res = await request(app).get('/api/movies/search').query({ q: 'nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The resource you requested could not be found');
    });

    it('should return 502 when TMDB API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const res = await request(app).get('/api/movies/search').query({ q: 'test' });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe('Failed to reach the TMDB API');
    });
  });

  describe('GET /api/tv/search', () => {
    it('should return search results for valid query', async () => {
      const mockResponse = {
        results: [
          {
            id: 456,
            name: 'Test Show',
            first_air_date: '2022-05-15',
            poster_path: '/show.jpg',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await request(app).get('/api/tv/search').query({ q: 'test' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 20);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0]).toEqual({
        id: 456,
        title: 'Test Show',
        release_date: '2022-05-15',
        poster_path: '/show.jpg',
      });
    });

    it('should return search results for valid query, page, and limit parameters', async () => {
      const mockResponse = {
        results: [
          {
            id: 456,
            name: 'Test Show',
            first_air_date: '2022-05-15',
            poster_path: '/show.jpg',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await request(app).get('/api/tv/search').query({ q: 'test', page: 2, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page', 2);
      expect(res.body).toHaveProperty('limit', 10);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0]).toEqual({
        id: 456,
        title: 'Test Show',
        release_date: '2022-05-15',
        poster_path: '/show.jpg',
      });
    });

    it('should return search results for valid query, and page parameters, and no limit parameters', async () => {
      const mockResponse = {
        results: [
          {
            id: 456,
            name: 'Test Show',
            first_air_date: '2022-05-15',
            poster_path: '/show.jpg',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await request(app).get('/api/tv/search').query({ q: 'test', page: 2 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page', 2);
      expect(res.body).toHaveProperty('limit', 20);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0]).toEqual({
        id: 456,
        title: 'Test Show',
        release_date: '2022-05-15',
        poster_path: '/show.jpg',
      });
    });

    it('should return search results for valid query, and limit parameters, no page parameters', async () => {
      const mockResponse = {
        results: [
          {
            id: 456,
            name: 'Test Show',
            first_air_date: '2022-05-15',
            poster_path: '/show.jpg',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await request(app).get('/api/tv/search').query({ q: 'test', limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 10);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0]).toEqual({
        id: 456,
        title: 'Test Show',
        release_date: '2022-05-15',
        poster_path: '/show.jpg',
      });
    });

    it('should return 400 for missing q parameter', async () => {
      const res = await request(app).get('/api/tv/search');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('q is required and must be a string');
    });

    it('should return 400 for invalid page parameter(not a number)', async () => {
      const res = await request(app).get('/api/tv/search').query({ q: 'test', page: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for invalid limit parameter(not a number)', async () => {
      const res = await request(app).get('/api/tv/search').query({ q: 'test', limit: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for a page parameter less than 1', async () => {
      const res = await request(app).get('/api/tv/search').query({ q: 'test', page: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for a page parameter greater than 1000', async () => {
      const res = await request(app).get('/api/tv/search').query({ q: 'test', page: 1001 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for a limit parameter less than 1', async () => {
      const res = await request(app).get('/api/tv/search').query({ q: 'test', limit: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for a limit parameter greater than 50', async () => {
      const res = await request(app).get('/api/tv/search').query({ q: 'test', limit: 51 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for invalid page and limit parameters', async () => {
      const res = await request(app)
        .get('/api/tv/search')
        .query({ q: 'test', page: 'invalid', limit: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for invalid page, but valid limit parameter', async () => {
      const res = await request(app)
        .get('/api/tv/search')
        .query({ q: 'test', page: 'invalid', limit: 20 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for valid page, but invalid limit parameter', async () => {
      const res = await request(app)
        .get('/api/tv/search')
        .query({ q: 'test', page: 1, limit: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
    });

    it('should return 404 when TMDB returns not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ status_message: 'Not found' }),
      });

      const res = await request(app).get('/api/tv/search').query({ q: 'nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The resource you requested could not be found');
    });

    it('should return 502 when TMDB API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const res = await request(app).get('/api/tv/search').query({ q: 'test' });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe('Failed to reach the TMDB API');
    });
  });
});
