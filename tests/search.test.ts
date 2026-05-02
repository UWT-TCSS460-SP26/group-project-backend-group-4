import request from 'supertest';
import { app } from '../src/app';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    media: {
      findUnique: jest.fn(),
    },
  },
}));

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

beforeEach(() => {
  process.env.TMDB_API_KEY = 'test_api_key';
  global.fetch = jest.fn();
});

afterEach(() => {
  delete process.env.TMDB_API_KEY;
  jest.restoreAllMocks();
});

describe('Search Router', () => {
  describe('GET /api/movies/search', () => {
    const mockResponsep1 = {
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: '/4BS8tgBNWg2jPiDlBwM2iJe1xB7.jpg',
          genre_ids: [16, 10751, 12, 35],
          id: 49013,
          original_language: 'en',
          original_title: 'Cars 2',
          overview:
            'Star race car Lightning McQueen and his pal Mater head overseas to compete in the World Grand Prix race. But the road to the championship becomes rocky as Mater gets caught up in an intriguing adventure of his own: international espionage.',
          popularity: 12.9599,
          poster_path: '/okIz1HyxeVOMzYwwHUjH2pHi74I.jpg',
          release_date: '2011-06-11',
          title: 'Cars 2',
          video: false,
          vote_average: 6.176,
          vote_count: 8423,
        },
        {
          adult: false,
          backdrop_path: '/j5SWztnnNERAqvA19tyl6Tm7eAJ.jpg',
          genre_ids: [18, 35],
          id: 51896,
          original_language: 'en',
          original_title: 'Two Cars, One Night',
          overview:
            'Sometimes first love is found in the most unlikely of places, like in the carpark outside the Te Kaha pub.',
          popularity: 1.0352,
          poster_path: '/a3BkwY76IUwadgxeKByxWv5Qukf.jpg',
          release_date: '2004-06-09',
          title: 'Two Cars, One Night',
          video: false,
          vote_average: 6.647,
          vote_count: 68,
        },
        {
          adult: false,
          backdrop_path: null,
          genre_ids: [10751, 16, 10770],
          id: 52328,
          original_language: 'pt',
          original_title: 'Os Carrinhos 2: Aventuras em Rodópolis',
          overview:
            "The Little Cars pals are back for more racetrack action in this collection of three animated adventures for kids. Combo tries to save his delivery company by proving he's the fastest truck on the road in the Rodopolis Race; Chris hopes that a makeover will help her join the in-crowd; and a newspaper article claims Cruise has been cheating … and that the accusation has come from Combo. Can Cruise repair his reputation and fix their friendship?",
          popularity: 0.0673,
          poster_path: '/py6zQapfbWdwl17DZXS2lkxzGWR.jpg',
          release_date: '2007-05-05',
          title: 'The Little Cars 2: Rodopolis Adventures',
          video: true,
          vote_average: 3,
          vote_count: 8,
        },
        {
          adult: false,
          backdrop_path: null,
          genre_ids: [35],
          id: 301319,
          original_language: 'en',
          original_title: 'Little Women Big Cars 2',
          overview:
            "The women of Cherry Branch Elementary are back and contemplating the idea of beauty. Barbara and AJ's exes, Richard and Doro spark a short lived romance that makes the other couples question many of their life choices from letting their daughters participate in beauty pageants to the idea of breast implants.",
          popularity: 0.5828,
          poster_path: '/htkKQgb7GTOh2I4S90lyyksepgz.jpg',
          release_date: '2014-01-01',
          title: 'Little Women Big Cars 2',
          video: false,
          vote_average: 1.5,
          vote_count: 2,
        },
        {
          adult: false,
          backdrop_path: null,
          genre_ids: [16, 10751],
          id: 101923,
          original_language: 'en',
          original_title: "Car's Life 2",
          overview:
            "Sparky is a spunky little sports car who can't wait to grow up, but first he needs to learn the rules of the road. Sparky snubs car washes, curfews, and speed limits, driving his poor dad to distraction.",
          popularity: 0.2068,
          poster_path: '/n897fAY3EQEFLo6FUZ1V6OcZ4ud.jpg',
          release_date: '2011-07-18',
          title: "Car's Life 2",
          video: false,
          vote_average: 2.5,
          vote_count: 12,
        },
        {
          adult: false,
          backdrop_path: null,
          genre_ids: [18, 10749],
          id: 643896,
          original_language: 'sv',
          original_title: 'Love, Cars and Two Smoking Squirrels',
          overview: 'Four peoples different views on love.',
          popularity: 0,
          poster_path: '/iJYI8b79U1QIUqcqG0ca60ITP78.jpg',
          release_date: '2008-11-20',
          title: 'Love, Cars and Two Smoking Squirrels',
          video: false,
          vote_average: 0,
          vote_count: 0,
        },
        {
          adult: false,
          backdrop_path: null,
          genre_ids: [],
          id: 823117,
          original_language: 'en',
          original_title: 'Funny Little Cars 2: Fun at Oasis City',
          overview:
            'In this follow-up to their Little Oaza adventures, our vehicular friends come fender to fender with shady businesses looking to destroy Doom Valley.',
          popularity: 0.0214,
          poster_path: '/CmqZuclSpZ7WHppOztp1IACAb3.jpg',
          release_date: '2020-09-30',
          title: 'Funny Little Cars 2: Fun at Oasis City',
          video: false,
          vote_average: 3.3,
          vote_count: 3,
        },
        {
          adult: false,
          backdrop_path: null,
          genre_ids: [35],
          id: 638685,
          original_language: 'es',
          original_title: '2 en 1 auto',
          overview:
            'A couple in a car, starting with a cigarette, begins a discussion as ridiculous as interesting. The lack of communication and lack of harmony, attributes that are exploited in love (or lack thereof).',
          popularity: 0.0707,
          poster_path: '/46YNA1ygdP9rNnV9NbrrYMP7cfm.jpg',
          release_date: '1998-04-17',
          title: '2 in 1 car',
          video: false,
          vote_average: 2,
          vote_count: 2,
        },
        {
          adult: false,
          backdrop_path: '/lUOS4m5WrgYE5uPKiEjlZDEwSQP.jpg',
          genre_ids: [99],
          id: 376116,
          original_language: 'en',
          original_title: 'All Cars Go To Heaven - Volume 2: Better Than A Horse',
          overview:
            'Up until Henry Ford created the Model T, the only choice for personal transportation was a horse. Then Mr. Ford created his machine that would change the world.  But, compared to other cars of the time, the T was a piece of junk. The T was a type writer to the Bentley laptops of the time. Crude, bare, uncomfortable.  But, it was cheap, and better than a horse.  A cheap car is better than no car, and to prove this point, we take 2 cheap cars and one Ford Model T across 819 miles of dusty, rocky, steep, ruthless Utah desert. No amount of rocks, scrapes, crashes, leaked fluids or lost wires will stand in our way. We think.',
          popularity: 0.0264,
          poster_path: '/i6eTFck3BufqgomtO4lfBqnfSa2.jpg',
          release_date: '2015-12-25',
          title: 'All Cars Go To Heaven - Volume 2: Better Than A Horse',
          video: false,
          vote_average: 10,
          vote_count: 2,
        },
        {
          adult: false,
          backdrop_path: '/vrzmgmpjN39MddU4VETo8Gc6b0N.jpg',
          genre_ids: [18],
          id: 567660,
          original_language: 'en',
          original_title: 'Love, Death & Cars',
          overview:
            "In Los Angeles, Max and Haley go to a reading and book signing of Kyle, a friend of Max's from New York. Through flashbacks and conversations, we learn that they were more than casual friends, and Kyle's reappearance throws Haley and Max's relationship into question. Central to the two men's history was a Grand Canyon trip some years before. Max may need to travel that road again with renewed honesty if he's to sort out his life's conflicts and contradictions.",
          popularity: 0.0706,
          poster_path: '/irwmRxLDjLvq80e0LG8ZAAYrcoH.jpg',
          release_date: '1999-10-05',
          title: 'Love, Death & Cars',
          video: false,
          vote_average: 3.8,
          vote_count: 4,
        },
        {
          adult: false,
          backdrop_path: null,
          genre_ids: [],
          id: 195241,
          original_language: 'en',
          original_title: '10th U.S. Infantry, 2nd Battalion Leaving Cars',
          overview:
            'Hurrah here they come! Hot, dusty, grim and determined! Real soldiers, every inch of them! No gold lace and chalked belts and shoulder straps...',
          popularity: 0.0671,
          poster_path: '/cqNG6gsT4s4F592eZpbAtvWXQg6.jpg',
          release_date: '1898-05-20',
          title: '10th U.S. Infantry, 2nd Battalion Leaving Cars',
          video: false,
          vote_average: 3,
          vote_count: 4,
        },
        {
          adult: false,
          backdrop_path: '/g8nkLbfaF1STl6l7OmSHiroyaA1.jpg',
          genre_ids: [16, 10751, 35],
          id: 230767,
          original_language: 'en',
          original_title: 'Hiccups',
          overview:
            'When Lightning McQueen gets the hiccups, everyone in Radiator Springs thinks they have the cure.',
          popularity: 2.3391,
          poster_path: '/uel0QbbmC97y4Q1dM72GWh0OpPc.jpg',
          release_date: '2013-03-22',
          title: 'Hiccups',
          video: false,
          vote_average: 5.985,
          vote_count: 66,
        },
        {
          adult: false,
          backdrop_path: '/gShzQKKPj7ylPQojFPEEcExs6cy.jpg',
          genre_ids: [28, 35, 80, 53],
          id: 10751,
          original_language: 'da',
          original_title: 'Gamle mænd i nye biler',
          overview:
            'The last wish of the dying "Monk" is for his foster child, Harald, to find his real son, Ludvig. But the latter is currently in a Swedish prison cell...',
          popularity: 1.4271,
          poster_path: '/n2KH5TlEcYPvinmwsJj4ULc1xDO.jpg',
          release_date: '2002-07-12',
          title: 'Old Men in New Cars: In China They Eat Dogs II',
          video: false,
          vote_average: 6.746,
          vote_count: 120,
        },
        {
          adult: false,
          backdrop_path: '/o5GX0iM5vwYVR4WPuY3hh8Kl5cU.jpg',
          genre_ids: [16, 10751, 35],
          id: 286189,
          original_language: 'en',
          original_title: 'The Radiator Springs 500½',
          overview:
            "A 'leisurely drive' planned in honor of Radiator Springs’ town founder, Stanley, turns precarious as Baja pros descend on the town and challenge Lightning McQueen to an off-road race. Meanwhile, the townsfolk, led by a Stanley-costumed Mater, enjoy the planned 'leisurely drive' to retrace Stanley’s original frontier route. Thinking they’re on the same course, a wrong turn sends McQueen and the Baja pros on a treacherously wild bid for survival. The misunderstanding leaves the racing professionals in awe of the 'legend' of Stanley: the Original Off-Road Racer.",
          popularity: 0.8864,
          poster_path: '/oKuGXTnggOmut8A0ZvU1Hh2yOa8.jpg',
          release_date: '2014-05-20',
          title: 'The Radiator Springs 500½',
          video: false,
          vote_average: 6.3,
          vote_count: 94,
        },
        {
          adult: false,
          backdrop_path: '/zq5G1xZLLytc3cdfkDdljfirj4Z.jpg',
          genre_ids: [16, 10751, 878, 35],
          id: 141528,
          original_language: 'en',
          original_title: 'Time Travel Mater',
          overview:
            "When a clock lands on Mater's engine, he travels back in time to 1909 where he meets Stanley, an ambitious young car on his way to California. With the help of Lightning McQueen, Mater alters history by convincing Stanley to stay and build Radiator Springs. Stanley meets Lizzie and they commemorate the opening of the new courthouse with their wedding.",
          popularity: 0.4246,
          poster_path: '/nuRDv9pDZVHK7SYx9XBWxIYyMFW.jpg',
          release_date: '2012-06-12',
          title: 'Time Travel Mater',
          video: false,
          vote_average: 6.1,
          vote_count: 142,
        },
      ],
      total_pages: 1,
      total_results: 15,
    };

    it('should return search results for valid query', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponsep1,
      });

      const res = await request(app).get('/api/movies/search').query({ title: 'cars 2' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        page: 1,
        results: [
          {
            id: 49013,
            title: 'Cars 2',
            release_date: '2011-06-11',
            poster_path: '/okIz1HyxeVOMzYwwHUjH2pHi74I.jpg',
          },
          {
            id: 51896,
            title: 'Two Cars, One Night',
            release_date: '2004-06-09',
            poster_path: '/a3BkwY76IUwadgxeKByxWv5Qukf.jpg',
          },
          {
            id: 52328,
            title: 'The Little Cars 2: Rodopolis Adventures',
            release_date: '2007-05-05',
            poster_path: '/py6zQapfbWdwl17DZXS2lkxzGWR.jpg',
          },
          {
            id: 301319,
            title: 'Little Women Big Cars 2',
            release_date: '2014-01-01',
            poster_path: '/htkKQgb7GTOh2I4S90lyyksepgz.jpg',
          },
          {
            id: 101923,
            title: "Car's Life 2",
            release_date: '2011-07-18',
            poster_path: '/n897fAY3EQEFLo6FUZ1V6OcZ4ud.jpg',
          },
          {
            id: 643896,
            title: 'Love, Cars and Two Smoking Squirrels',
            release_date: '2008-11-20',
            poster_path: '/iJYI8b79U1QIUqcqG0ca60ITP78.jpg',
          },
          {
            id: 823117,
            title: 'Funny Little Cars 2: Fun at Oasis City',
            release_date: '2020-09-30',
            poster_path: '/CmqZuclSpZ7WHppOztp1IACAb3.jpg',
          },
          {
            id: 638685,
            title: '2 in 1 car',
            release_date: '1998-04-17',
            poster_path: '/46YNA1ygdP9rNnV9NbrrYMP7cfm.jpg',
          },
          {
            id: 376116,
            title: 'All Cars Go To Heaven - Volume 2: Better Than A Horse',
            release_date: '2015-12-25',
            poster_path: '/i6eTFck3BufqgomtO4lfBqnfSa2.jpg',
          },
          {
            id: 567660,
            title: 'Love, Death & Cars',
            release_date: '1999-10-05',
            poster_path: '/irwmRxLDjLvq80e0LG8ZAAYrcoH.jpg',
          },
          {
            id: 195241,
            title: '10th U.S. Infantry, 2nd Battalion Leaving Cars',
            release_date: '1898-05-20',
            poster_path: '/cqNG6gsT4s4F592eZpbAtvWXQg6.jpg',
          },
          {
            id: 230767,
            title: 'Hiccups',
            release_date: '2013-03-22',
            poster_path: '/uel0QbbmC97y4Q1dM72GWh0OpPc.jpg',
          },
          {
            id: 10751,
            title: 'Old Men in New Cars: In China They Eat Dogs II',
            release_date: '2002-07-12',
            poster_path: '/n2KH5TlEcYPvinmwsJj4ULc1xDO.jpg',
          },
          {
            id: 286189,
            title: 'The Radiator Springs 500½',
            release_date: '2014-05-20',
            poster_path: '/oKuGXTnggOmut8A0ZvU1Hh2yOa8.jpg',
          },
          {
            id: 141528,
            title: 'Time Travel Mater',
            release_date: '2012-06-12',
            poster_path: '/nuRDv9pDZVHK7SYx9XBWxIYyMFW.jpg',
          },
        ],
      });
    });

    it('should return search results for valid query, page, and limit parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponsep1,
      });

      const res = await request(app)
        .get('/api/movies/search')
        .query({ title: 'cars 2', page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        page: 1,
        results: [
          {
            id: 49013,
            title: 'Cars 2',
            release_date: '2011-06-11',
            poster_path: '/okIz1HyxeVOMzYwwHUjH2pHi74I.jpg',
          },
          {
            id: 51896,
            title: 'Two Cars, One Night',
            release_date: '2004-06-09',
            poster_path: '/a3BkwY76IUwadgxeKByxWv5Qukf.jpg',
          },
          {
            id: 52328,
            title: 'The Little Cars 2: Rodopolis Adventures',
            release_date: '2007-05-05',
            poster_path: '/py6zQapfbWdwl17DZXS2lkxzGWR.jpg',
          },
          {
            id: 301319,
            title: 'Little Women Big Cars 2',
            release_date: '2014-01-01',
            poster_path: '/htkKQgb7GTOh2I4S90lyyksepgz.jpg',
          },
          {
            id: 101923,
            title: "Car's Life 2",
            release_date: '2011-07-18',
            poster_path: '/n897fAY3EQEFLo6FUZ1V6OcZ4ud.jpg',
          },
          {
            id: 643896,
            title: 'Love, Cars and Two Smoking Squirrels',
            release_date: '2008-11-20',
            poster_path: '/iJYI8b79U1QIUqcqG0ca60ITP78.jpg',
          },
          {
            id: 823117,
            title: 'Funny Little Cars 2: Fun at Oasis City',
            release_date: '2020-09-30',
            poster_path: '/CmqZuclSpZ7WHppOztp1IACAb3.jpg',
          },
          {
            id: 638685,
            title: '2 in 1 car',
            release_date: '1998-04-17',
            poster_path: '/46YNA1ygdP9rNnV9NbrrYMP7cfm.jpg',
          },
          {
            id: 376116,
            title: 'All Cars Go To Heaven - Volume 2: Better Than A Horse',
            release_date: '2015-12-25',
            poster_path: '/i6eTFck3BufqgomtO4lfBqnfSa2.jpg',
          },
          {
            id: 567660,
            title: 'Love, Death & Cars',
            release_date: '1999-10-05',
            poster_path: '/irwmRxLDjLvq80e0LG8ZAAYrcoH.jpg',
          },
        ],
      });
    });

    it('should return search results for valid query, and page parameters, and no limit parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponsep1,
      });

      const res = await request(app).get('/api/movies/search').query({ title: 'cars 2', page: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        page: 1,
        results: [
          {
            id: 49013,
            title: 'Cars 2',
            release_date: '2011-06-11',
            poster_path: '/okIz1HyxeVOMzYwwHUjH2pHi74I.jpg',
          },
          {
            id: 51896,
            title: 'Two Cars, One Night',
            release_date: '2004-06-09',
            poster_path: '/a3BkwY76IUwadgxeKByxWv5Qukf.jpg',
          },
          {
            id: 52328,
            title: 'The Little Cars 2: Rodopolis Adventures',
            release_date: '2007-05-05',
            poster_path: '/py6zQapfbWdwl17DZXS2lkxzGWR.jpg',
          },
          {
            id: 301319,
            title: 'Little Women Big Cars 2',
            release_date: '2014-01-01',
            poster_path: '/htkKQgb7GTOh2I4S90lyyksepgz.jpg',
          },
          {
            id: 101923,
            title: "Car's Life 2",
            release_date: '2011-07-18',
            poster_path: '/n897fAY3EQEFLo6FUZ1V6OcZ4ud.jpg',
          },
          {
            id: 643896,
            title: 'Love, Cars and Two Smoking Squirrels',
            release_date: '2008-11-20',
            poster_path: '/iJYI8b79U1QIUqcqG0ca60ITP78.jpg',
          },
          {
            id: 823117,
            title: 'Funny Little Cars 2: Fun at Oasis City',
            release_date: '2020-09-30',
            poster_path: '/CmqZuclSpZ7WHppOztp1IACAb3.jpg',
          },
          {
            id: 638685,
            title: '2 in 1 car',
            release_date: '1998-04-17',
            poster_path: '/46YNA1ygdP9rNnV9NbrrYMP7cfm.jpg',
          },
          {
            id: 376116,
            title: 'All Cars Go To Heaven - Volume 2: Better Than A Horse',
            release_date: '2015-12-25',
            poster_path: '/i6eTFck3BufqgomtO4lfBqnfSa2.jpg',
          },
          {
            id: 567660,
            title: 'Love, Death & Cars',
            release_date: '1999-10-05',
            poster_path: '/irwmRxLDjLvq80e0LG8ZAAYrcoH.jpg',
          },
          {
            id: 195241,
            title: '10th U.S. Infantry, 2nd Battalion Leaving Cars',
            release_date: '1898-05-20',
            poster_path: '/cqNG6gsT4s4F592eZpbAtvWXQg6.jpg',
          },
          {
            id: 230767,
            title: 'Hiccups',
            release_date: '2013-03-22',
            poster_path: '/uel0QbbmC97y4Q1dM72GWh0OpPc.jpg',
          },
          {
            id: 10751,
            title: 'Old Men in New Cars: In China They Eat Dogs II',
            release_date: '2002-07-12',
            poster_path: '/n2KH5TlEcYPvinmwsJj4ULc1xDO.jpg',
          },
          {
            id: 286189,
            title: 'The Radiator Springs 500½',
            release_date: '2014-05-20',
            poster_path: '/oKuGXTnggOmut8A0ZvU1Hh2yOa8.jpg',
          },
          {
            id: 141528,
            title: 'Time Travel Mater',
            release_date: '2012-06-12',
            poster_path: '/nuRDv9pDZVHK7SYx9XBWxIYyMFW.jpg',
          },
        ],
      });
    });

    it('should return search results for valid query, and limit parameters, no page parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponsep1,
      });

      const res = await request(app).get('/api/movies/search').query({ title: 'cars 2', limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        page: 1,
        results: [
          {
            id: 49013,
            title: 'Cars 2',
            release_date: '2011-06-11',
            poster_path: '/okIz1HyxeVOMzYwwHUjH2pHi74I.jpg',
          },
          {
            id: 51896,
            title: 'Two Cars, One Night',
            release_date: '2004-06-09',
            poster_path: '/a3BkwY76IUwadgxeKByxWv5Qukf.jpg',
          },
          {
            id: 52328,
            title: 'The Little Cars 2: Rodopolis Adventures',
            release_date: '2007-05-05',
            poster_path: '/py6zQapfbWdwl17DZXS2lkxzGWR.jpg',
          },
          {
            id: 301319,
            title: 'Little Women Big Cars 2',
            release_date: '2014-01-01',
            poster_path: '/htkKQgb7GTOh2I4S90lyyksepgz.jpg',
          },
          {
            id: 101923,
            title: "Car's Life 2",
            release_date: '2011-07-18',
            poster_path: '/n897fAY3EQEFLo6FUZ1V6OcZ4ud.jpg',
          },
        ],
      });
    });

    it('should return 400 for missing title parameter', async () => {
      const res = await request(app).get('/api/movies/search');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('title is required and must be a string');
    });

    it('should return 400 for invalid page parameter(not a number)', async () => {
      const res = await request(app)
        .get('/api/movies/search')
        .query({ title: 'test', page: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for a page parameter less than 1', async () => {
      const res = await request(app).get('/api/movies/search').query({ title: 'test', page: 0 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for a page parameter greater than 1000', async () => {
      const res = await request(app).get('/api/movies/search').query({ title: 'test', page: 1001 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for invalid limit parameter(not a number)', async () => {
      const res = await request(app)
        .get('/api/movies/search')
        .query({ title: 'test', limit: 'test' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for a limit parameter less than 1', async () => {
      const res = await request(app).get('/api/movies/search').query({ title: 'test', limit: 0 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for a limit parameter greater than 50', async () => {
      const res = await request(app).get('/api/movies/search').query({ title: 'test', limit: 51 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for invalid page and limit parameters', async () => {
      const res = await request(app)
        .get('/api/movies/search')
        .query({ title: 'test', page: 'invalid', limit: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for invalid page, but valid limit parameter', async () => {
      const res = await request(app)
        .get('/api/movies/search')
        .query({ title: 'test', page: 'invalid', limit: 20 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for valid page, but invalid limit parameter', async () => {
      const res = await request(app)
        .get('/api/movies/search')
        .query({ title: 'test', page: 1, limit: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
    });

    it('should return 404 when TMDB returns not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ status_message: 'Not found' }),
      });

      const res = await request(app).get('/api/movies/search').query({ title: 'nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('The resource you requested could not be found');
    });

    it('should return 502 when TMDB API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const res = await request(app).get('/api/movies/search').query({ title: 'test' });

      expect(res.status).toBe(502);
      expect(res.body.message).toBe('Failed to reach the TMDB API');
    });
  });

  describe('GET /api/tv/search', () => {
    const mockResponseP1 = {
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: '/iWopHyAvuIDjGX10Yc3nn6UEebW.jpg',
          genre_ids: [18, 10765, 10759],
          id: 1403,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Agents of S.H.I.E.L.D.",
          overview:
            'Agent Phil Coulson of S.H.I.E.L.D. (Strategic Homeland Intervention, Enforcement and Logistics Division) puts together a team of agents to investigate the new, the strange and the unknown around the globe, protecting the ordinary from the extraordinary.',
          popularity: 70.2334,
          poster_path: '/gHUCCMy1vvj58tzE3dZqeC9SXus.jpg',
          first_air_date: '2013-09-24',
          name: "Marvel's Agents of S.H.I.E.L.D.",
          vote_average: 7.476,
          vote_count: 3748,
        },
        {
          adult: false,
          backdrop_path: '/qsnXwGS7KBbX4JLqHvICngtR8qg.jpg',
          genre_ids: [80, 18, 10759],
          id: 61889,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Daredevil",
          overview:
            'Lawyer-by-day Matt Murdock uses his heightened senses from being blinded as a young boy to fight crime at night on the streets of Hell’s Kitchen as Daredevil.',
          popularity: 38.9193,
          poster_path: '/QWbPaDxiB6LW2LjASknzYBvjMj.jpg',
          first_air_date: '2015-04-10',
          name: "Marvel's Daredevil",
          vote_average: 8.161,
          vote_count: 5085,
        },
        {
          adult: false,
          backdrop_path: '/9czVEnJemvP6gcJlMEjUeuISL1c.jpg',
          genre_ids: [10759, 80, 18],
          id: 67178,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's The Punisher",
          overview:
            "A former Marine out to punish the criminals responsible for his family's murder finds himself ensnared in a military conspiracy.",
          popularity: 26.4388,
          poster_path: '/tM6xqRKXoloH9UchaJEyyRE9O1w.jpg',
          first_air_date: '2017-11-17',
          name: "Marvel's The Punisher",
          vote_average: 8.137,
          vote_count: 3021,
        },
        {
          adult: false,
          backdrop_path: '/fjEOQhzZk2Or7VYUBeMx5ZIwU95.jpg',
          genre_ids: [10765, 18],
          id: 38472,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Jessica Jones",
          overview:
            'After a tragic ending to her short-lived super hero stint, Jessica Jones is rebuilding her personal life and career as a detective who gets pulled into cases involving people with extraordinary abilities in New York City.',
          popularity: 14.6518,
          poster_path: '/paf9wL3mOW9LT3ZjRxXqJcjeMEv.jpg',
          first_air_date: '2015-11-20',
          name: "Marvel's Jessica Jones",
          vote_average: 7.483,
          vote_count: 2563,
        },
        {
          adult: false,
          backdrop_path: '/vQ77kC1amsZECKIxkUIsMJCtBVp.jpg',
          genre_ids: [35, 18],
          id: 70796,
          origin_country: ['US'],
          original_language: 'en',
          original_name: 'The Marvelous Mrs. Maisel',
          overview:
            'It’s 1958 Manhattan and Miriam “Midge” Maisel has everything she’s ever wanted - the perfect husband, kids, and Upper West Side apartment. But when her life suddenly takes a turn and Midge must start over, she discovers a previously unknown talent - one that will take her all the way from the comedy clubs of Greenwich Village to a spot on Johnny Carson’s couch,',
          popularity: 15.4736,
          poster_path: '/aslKQXXydNQxSBvP7zzsbaNTIlF.jpg',
          first_air_date: '2017-03-16',
          name: 'The Marvelous Mrs. Maisel',
          vote_average: 8.05,
          vote_count: 943,
        },
        {
          adult: false,
          backdrop_path: '/MaQ7hbNsiJ30p14UgRdEnXDGMH.jpg',
          genre_ids: [18, 10765],
          id: 61550,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Agent Carter",
          overview:
            "It's 1946, and peace has dealt Peggy Carter a serious blow as she finds herself marginalized when the men return home from fighting abroad. Working for the covert SSR (Strategic Scientific Reserve), Peggy must balance doing administrative work and going on secret missions for Howard Stark all while trying to navigate life as a single woman in America, in the wake of losing the love of her life - Steve Rogers.",
          popularity: 12.0657,
          poster_path: '/7kqIsjjDMZA5GRMH5VCdQYZJqc6.jpg',
          first_air_date: '2015-01-06',
          name: "Marvel's Agent Carter",
          vote_average: 7.529,
          vote_count: 1950,
        },
        {
          adult: false,
          backdrop_path: '/hutyHRPoY0woAZCJtLmosJHuTjQ.jpg',
          genre_ids: [10759, 16, 10765],
          id: 59427,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Avengers",
          overview:
            "The further adventures of the Marvel Universe's mightiest general membership superhero team. With an all-star roster consisting of Iron Man, Captain America, Thor, Hulk, Hawkeye, Falcon and, occasionally--when she feels like it and only when she feels like it--Black Widow, the Avengers are a team in the truest sense. The Avengers save the world from the biggest threats imaginable--threats no single super hero could withstand.",
          popularity: 12.924,
          poster_path: '/aVYPq7FSvsdNQOXVIFnndXJPCXn.jpg',
          first_air_date: '2013-05-26',
          name: "Marvel's Avengers",
          vote_average: 7.545,
          vote_count: 673,
        },
        {
          adult: false,
          backdrop_path: '/gVnxTA3FT4G2M2j6wyAZkWpRKn5.jpg',
          genre_ids: [16, 10759, 10765],
          id: 70801,
          origin_country: ['JP'],
          original_language: 'ja',
          original_name: 'ディスク・ウォーズ:アベンジャーズ',
          overview:
            "A group of teenagers join forces with the Avengers, Earth's mightiest heroes, to fight against the tyrannical Loki and his mighty empire.",
          popularity: 2.9519,
          poster_path: '/6wQAZaWSvBJOIIt68cqmC0KJjeE.jpg',
          first_air_date: '2014-04-02',
          name: 'Marvel Disk Wars: The Avengers',
          vote_average: 6.3,
          vote_count: 15,
        },
        {
          adult: false,
          backdrop_path: '/2jPv3B0ikeGjEYZKDX8vJGXJrvh.jpg',
          genre_ids: [99, 10759, 10765],
          id: 114695,
          origin_country: ['US'],
          original_language: 'en',
          original_name: 'Marvel Studios Legends',
          overview:
            'Revisit the epic heroes, villains and moments from across the MCU in preparation for the stories still to come. Each dynamic segment feeds directly into the upcoming series — setting the stage for future events. This series weaves together the many threads that constitute the unparalleled Marvel Cinematic Universe.',
          popularity: 9.5147,
          poster_path: '/EpDuYIK81YtCUT3gH2JDpyj8Qk.jpg',
          first_air_date: '2021-01-08',
          name: 'Marvel Studios Legends',
          vote_average: 7.362,
          vote_count: 689,
        },
        {
          adult: false,
          backdrop_path: '/j7AHhA0bH5FlVPVMFcKNOLC4PMv.jpg',
          genre_ids: [18, 10759, 80],
          id: 62126,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Luke Cage",
          overview:
            'Given superstrength and durability by a sabotaged experiment, a wrongly accused man escapes prison to become a superhero for hire.',
          popularity: 12.1497,
          poster_path: '/yzM1hMB3PUJqbISX0f421b3xOjB.jpg',
          first_air_date: '2016-09-30',
          name: "Marvel's Luke Cage",
          vote_average: 6.925,
          vote_count: 1969,
        },
        {
          adult: false,
          backdrop_path: '/ieZ9AdB3yJF9jZSVO39zZ9d4D1y.jpg',
          genre_ids: [16, 10762, 10765, 10759],
          id: 92788,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Moon Girl and Devil Dinosaur",
          overview:
            "After 13-year-old super-genius Lunella accidentally brings ten-ton T-Rex, Devil Dinosaur into present-day New York City via a time vortex, the duo works together to protect the city's Lower East Side from danger.",
          popularity: 9.952,
          poster_path: '/1oFkjiF9fT2asKWjRiJtlbhu3hn.jpg',
          first_air_date: '2023-02-10',
          name: "Marvel's Moon Girl and Devil Dinosaur",
          vote_average: 7.7,
          vote_count: 36,
        },
        {
          adult: false,
          backdrop_path: '/gXeCzYmCRBlpbbhhKrYM1ZpIDAA.jpg',
          genre_ids: [10762, 10759, 16, 35, 10751],
          id: 34391,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Ultimate Spider-Man",
          overview:
            'While being trained by S.H.I.E.L.D., Spider-Man battles evil with a new team of teen colleagues.',
          popularity: 14.3468,
          poster_path: '/jK3pc8XOQT8UgdvSjMFk8xLQOxE.jpg',
          first_air_date: '2012-04-01',
          name: "Marvel's Ultimate Spider-Man",
          vote_average: 7.674,
          vote_count: 1037,
        },
        {
          adult: false,
          backdrop_path: '/7s1AmaDsFq4wkZGhEIrtyNl5Wmn.jpg',
          genre_ids: [18],
          id: 138136,
          origin_country: ['CN'],
          original_language: 'zh',
          original_name: '当家主母',
          overview:
            "As China becomes a major commercial economy, the silk, embroidering, and weaving trade is booming - and a few influential families have risen to the top. The industry's powerhouse is the Gusu District in Suzhou, Jiangsu Province. And arguably the greatest weaving dynasty of them all is the Ren family, which carefully guards the secrets of its weaving prowess.",
          popularity: 2.2222,
          poster_path: '/h9bnyM0SSfmELGvbUOdTixdEPOW.jpg',
          first_air_date: '2021-11-08',
          name: 'Marvelous Woman',
          vote_average: 5.6,
          vote_count: 5,
        },
        {
          adult: false,
          backdrop_path: '/qDum1yhNftUMaIB3pPiZ7PLsIto.jpg',
          genre_ids: [16, 10765, 35, 10751],
          id: 72705,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Spider-Man",
          overview:
            'An insecure but courageous and intelligent teen named Peter Parker, a new student of Midtown High, is bitten by a radioactive spider and given powers. He becomes a hero named Spider-Man after the death of his uncle and he must adapt to this new way of life.',
          popularity: 8.2219,
          poster_path: '/dKdcyyHUR5WTMnrbPdYN5y9xPVp.jpg',
          first_air_date: '2017-08-19',
          name: "Marvel's Spider-Man",
          vote_average: 7.466,
          vote_count: 384,
        },
        {
          adult: false,
          backdrop_path: '/jQ0cQGugJABsFYvBhtWQQ8ftTGK.jpg',
          genre_ids: [99],
          id: 118924,
          origin_country: ['US'],
          original_language: 'en',
          original_name: 'Marvel Studios Assembled',
          overview:
            'Go behind the scenes of the shows and movies of the Marvel Cinematic Universe, following the filmmakers, cast and crew, and Marvel heroes every step of the way.',
          popularity: 6.4726,
          poster_path: '/v2BHRwtQVkt5fssLdo5MpFgHJPY.jpg',
          first_air_date: '2021-03-12',
          name: 'Marvel Studios Assembled',
          vote_average: 7.2,
          vote_count: 215,
        },
        {
          adult: false,
          backdrop_path: '/kA53Uqqj5rRdxXvQHts1udc9ze0.jpg',
          genre_ids: [],
          id: 113187,
          origin_country: ['CN'],
          original_language: 'zh',
          original_name: '兄弟营',
          overview: '',
          popularity: 1.9346,
          poster_path: '/48fF0dMnai8re394Ij1hcm6DBcd.jpg',
          first_air_date: '2018-05-31',
          name: "Marvel's the Brothers",
          vote_average: 0,
          vote_count: 0,
        },
        {
          adult: false,
          backdrop_path: '/pHURd96EW167jUd2Jf8XpgTiLJV.jpg',
          genre_ids: [10759, 18, 10765],
          id: 67466,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Runaways",
          overview:
            'Every teenager thinks their parents are evil. What if you found out they actually were? Six diverse teenagers who can barely stand each other must unite against a common foe – their parents.',
          popularity: 7.6676,
          poster_path: '/hnHEhbzh0F7kN3Ah1lzRjtQuW16.jpg',
          first_air_date: '2017-11-21',
          name: "Marvel's Runaways",
          vote_average: 7.296,
          vote_count: 964,
        },
        {
          adult: false,
          backdrop_path: '/8LdHg0aMrmROcU8LlSRRx1FiphC.jpg',
          genre_ids: [18],
          id: 250957,
          origin_country: ['TH'],
          original_language: 'th',
          original_name: 'ฝันรักห้วงนิทรา',
          overview:
            "I'm Dawan. Since I can remember, I have always had strange dreams about a quiet girl who often played with me in my dreams. One day, a new neighbor moved in, and that led to my family falling apart. My father ran away with the man next door, who turned out to be the father of Khimhan the quiet and small girl from next door. Initially, we were not close at all, but circumstances brought us closer and made us understand each other.\n\nHowever, Khimhan was unaware that while in the real world we were just friends, in my dreams, she and I did things that went far beyond that. So, I kept my feelings concealed because I couldn't let her know. I never realized that in those dreams, I was not the only one dreaming.",
          popularity: 1.3218,
          poster_path: '/ry8hTSyaLqHFlylSoYsItxhtV25.jpg',
          first_air_date: '2024-05-08',
          name: 'My Marvellous Dream Is You',
          vote_average: 6.5,
          vote_count: 15,
        },
        {
          adult: false,
          backdrop_path: '/72jj9y2Ejeub0mycZvkrPfT59sW.jpg',
          genre_ids: [10765, 10759, 80],
          id: 62285,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's The Defenders",
          overview:
            'Daredevil, Jessica Jones, Luke Cage and Iron Fist join forces to take on common enemies as a sinister conspiracy threatens New York City.',
          popularity: 8.2299,
          poster_path: '/49XzINhH4LFsgz7cx6TOPcHUJUL.jpg',
          first_air_date: '2017-08-18',
          name: "Marvel's The Defenders",
          vote_average: 7.062,
          vote_count: 1617,
        },
        {
          adult: false,
          backdrop_path: '/4amkATUf2mh5QL9OQ3WmHQqx9wk.jpg',
          genre_ids: [10759, 18, 10765],
          id: 66190,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Cloak & Dagger",
          overview:
            'Two teenagers from very different backgrounds awaken to newly acquired superpowers which mysteriously link them to one another.',
          popularity: 7.7704,
          poster_path: '/pYnRJuBPEqZO1o4fcxBTgmKNHfy.jpg',
          first_air_date: '2018-06-07',
          name: "Marvel's Cloak & Dagger",
          vote_average: 7.087,
          vote_count: 647,
        },
      ],
      total_pages: 8,
      total_results: 141,
    };

    const mockResponseP2 = {
      page: 2,
      results: [
        {
          adult: false,
          backdrop_path: '/1OCqKSrX2VC1gJo9eITi49b03BS.jpg',
          genre_ids: [18, 10765],
          id: 228520,
          origin_country: ['CN'],
          original_language: 'zh',
          original_name: '夏日奇妙书',
          overview:
            'By chance, best-selling author Wang Pu Tao and rookie editor Feng Tian Lan have become colleagues. The story unfolds through their marvellous adventures in their journey home.\n\nAfter being attracted by a novel, Feng Tian Lan ends up working at a publishing house. He never expected that his first assignment would be to send reminders. Eccentric author Wang Pu Tao has not yet submitted her new work. After procrastinating for many days, she runs into Feng Tian Lan at the bar. Wang Pu Tao tells Feng Tian Lan that he needs to agree to her terms if he wants her to submit her work. As a result, the two embark on a journey together.',
          popularity: 2.0615,
          poster_path: '/4KfIWmhkrhpomhbEFDpbDFEtDhj.jpg',
          first_air_date: '2023-06-11',
          name: 'My Marvellous Fable',
          vote_average: 4.7,
          vote_count: 3,
        },
        {
          adult: false,
          backdrop_path: '/9yAhhj9toqP9z6CeoMbhJdNhXN3.jpg',
          genre_ids: [10759, 16, 10751],
          id: 63181,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Guardians of the Galaxy",
          overview:
            'Peter Quill is Star-Lord, the brash adventurer who, to save the universe from its greatest threats, joins forces with a quartet of disparate misfits — fan-favorite Rocket Raccoon, a tree-like humanoid named Groot, the enigmatic, expert fighter Gamora and the rough edged warrior Drax the Destroyer.',
          popularity: 8.3708,
          poster_path: '/oXwe3wVhdvvxiixL9UJf6PgBybZ.jpg',
          first_air_date: '2015-09-05',
          name: "Marvel's Guardians of the Galaxy",
          vote_average: 7.202,
          vote_count: 89,
        },
        {
          adult: false,
          backdrop_path: '/mfcLUWASJghU8MTNK38eYktfE83.jpg',
          genre_ids: [10765, 10759, 35],
          id: 92782,
          origin_country: ['US'],
          original_language: 'en',
          original_name: 'Ms. Marvel',
          overview:
            'A great student, avid gamer, and voracious fan-fic scribe, Kamala Khan has a special affinity for superheroes, particularly Captain Marvel. However, she struggles to fit in at home and at school — that is, until she gets superpowers like the heroes she’s always looked up to. Life is easier with superpowers, right?',
          popularity: 6.8546,
          poster_path: '/3HWWh92kZbD7odwJX7nKmXNZsYo.jpg',
          first_air_date: '2022-06-08',
          name: 'Ms. Marvel',
          vote_average: 6.291,
          vote_count: 1419,
        },
        {
          adult: false,
          backdrop_path: '/zwL0PTy7oxHLp7oDUmk0XRePhmt.jpg',
          genre_ids: [18, 10759, 10765],
          id: 226757,
          origin_country: ['TH'],
          original_language: 'th',
          original_name: 'ฤทัยบดี',
          overview:
            'Born with psychic powers, Cho-ueang is vilified as a bad omen against the community. When she is only small, her father performs a spell to keep her hidden and Cho-ueang winds up travelling hundreds of years into the future. There, a family takes her in and renames her Panruethai.\n\nUnexpectedly, Panruethai is returned to her original era, an era she has no memory of. All she knows is her powers have strengthened. Confused, she comes across a young man, Singkham, who mistakes her for a thief and apprehends her. However, she finds herself staying with him.',
          popularity: 0.8262,
          poster_path: '/9LAjVH33SAwhCi9xTEQVBFdHi7r.jpg',
          first_air_date: '2023-05-15',
          name: 'Marvellous Love',
          vote_average: 10,
          vote_count: 1,
        },
        {
          adult: false,
          backdrop_path: '/zUOf1expJBeAd07iBDXhhyAUt5y.jpg',
          genre_ids: [10764, 99],
          id: 117690,
          origin_country: ['CN'],
          original_language: 'zh',
          original_name: '奇妙之城',
          overview: '',
          popularity: 2.4529,
          poster_path: '/6VOY2mm0sVoApwQ65PckSEMkSuZ.jpg',
          first_air_date: '2021-01-05',
          name: 'Marvelous City',
          vote_average: 8.6,
          vote_count: 5,
        },
        {
          adult: false,
          backdrop_path: '/80KgNNF0bpoDvU5iNXT07Lgb2wL.jpg',
          genre_ids: [10765, 35, 16],
          id: 6673,
          origin_country: ['US'],
          original_language: 'en',
          original_name: 'The Marvelous Misadventures of Flapjack',
          overview:
            "A young boy who grew up inside a talking whale sets sail for magical Candied Island, accompanied by Capt. K'nuckles, a crusty old pirate.",
          popularity: 9.5871,
          poster_path: '/8dpk0bjBgX93ZkQxEI1daNSj3OW.jpg',
          first_air_date: '2008-06-05',
          name: 'The Marvelous Misadventures of Flapjack',
          vote_average: 8.1,
          vote_count: 372,
        },
        {
          adult: false,
          backdrop_path: '/y9FhwCVyIqonm2XqwGrFtmalnkv.jpg',
          genre_ids: [16, 10759, 10765],
          id: 91278,
          origin_country: ['JP'],
          original_language: 'ja',
          original_name: 'マーベル フューチャー・アベンジャーズ',
          overview:
            'Makoto, Adi, and Chloe attend a special training school where they train to become the heroes of the next generation. Unfortunately for them they are actually science experiments for Hydra. When Adi and Chloe get captured by Hydra for learning the truth, Makoto seeks out the one group he believes could help them- The Avengers. After rescuing the kids The Avengers decide to take them in and train them to be the heroes of the future.',
          popularity: 3.0154,
          poster_path: '/buxBvftqx3g57FTYtdrfGSHlWfQ.jpg',
          first_air_date: '2017-07-22',
          name: "Marvel's Future Avengers",
          vote_average: 6.3,
          vote_count: 22,
        },
        {
          adult: false,
          backdrop_path: '/s7Puqpq4Yp67l8JfPZYwhDTVNi5.jpg',
          genre_ids: [99],
          id: 6145,
          origin_country: ['US'],
          original_language: 'en',
          original_name: 'Modern Marvels',
          overview:
            'HISTORY’s longest-running series moves to H2. Modern Marvels celebrates the ingenuity, invention and imagination found in the world around us. From commonplace items like ink and coffee to architectural masterpieces and engineering disasters, the hit series goes beyond the basics to provide insight and history into things we wonder about and that impact our lives. This series tells fascinating stories of the doers, the dreamers and sometime-schemers that create everyday items, technological breakthroughs and manmade wonders. The hit series goes deep to explore the leading edge of human inspiration and ambition.',
          popularity: 7.5608,
          poster_path: '/uRMi6q4mazNTZ2HKdiY6RP5noDW.jpg',
          first_air_date: '1993-12-10',
          name: 'Modern Marvels',
          vote_average: 8.1,
          vote_count: 33,
        },
        {
          adult: false,
          backdrop_path: '/lxQMxqao3vs2ehxESrkQU6acU86.jpg',
          genre_ids: [10765, 16, 10759],
          id: 138505,
          origin_country: ['US'],
          original_language: 'en',
          original_name: 'Marvel Zombies',
          overview:
            'After the Avengers are overtaken by a zombie plague, a desperate group of survivors discover the key to bringing an end to the super-powered undead, racing across a dystopian landscape and risking life and limb to save their world.',
          popularity: 11.2029,
          poster_path: '/mwKj9ERGFXsWot0nXgQ5yMQf9I7.jpg',
          first_air_date: '2025-09-24',
          name: 'Marvel Zombies',
          vote_average: 7.195,
          vote_count: 329,
        },
        {
          adult: false,
          backdrop_path: '/6hwdgbR6ISFPhaIWKrJ01Mftkyr.jpg',
          genre_ids: [16, 10759, 10765],
          id: 319725,
          origin_country: ['US'],
          original_language: 'en',
          original_name: 'Today in Marvel History',
          overview: '',
          popularity: 0.2669,
          poster_path: '/v3tTJaJwprQkbPYEuvYuY8kyxU6.jpg',
          first_air_date: '2019-01-10',
          name: 'Today in Marvel History',
          vote_average: 10,
          vote_count: 1,
        },
        {
          adult: false,
          backdrop_path: '/tJ2fGRBKNgEwt9GiCOJ1veKRHXu.jpg',
          genre_ids: [10751, 10765, 18],
          id: 92804,
          origin_country: ['CA'],
          original_language: 'fr',
          original_name: 'Alix et les merveilleux',
          overview:
            'Magic, humor and many twists and turns are at the heart of this new season of Alix et les Merveilleux . In this universe where reality meets imagination, the characters continue their incredible adventures.',
          popularity: 1.082,
          poster_path: '/38Wm4JiOtajqDOWdjlfesp5T2jE.jpg',
          first_air_date: '2019-09-09',
          name: 'Alix and the Marvelous',
          vote_average: 3.8,
          vote_count: 4,
        },
        {
          adult: false,
          backdrop_path: '/7p0QLfjFx1iJzJ6iB82mp7E9qIH.jpg',
          genre_ids: [10759, 16, 10765],
          id: 40044,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Hulk and the Agents of S.M.A.S.H.",
          overview:
            'Joined by the Agents of S.M.A.S.H., a humorously dysfunctional group of teammates who double as family, Hulk tackles threats that are too enormous for any other heroes to handle.',
          popularity: 7.3818,
          poster_path: '/gkGIiIIkHOeVXzwjBNFTRqTCnqF.jpg',
          first_air_date: '2013-08-11',
          name: "Marvel's Hulk and the Agents of S.M.A.S.H.",
          vote_average: 6.1,
          vote_count: 81,
        },
        {
          adult: false,
          backdrop_path: '/zFOn9MgW1oSGyc8HKUAI3bV8NPc.jpg',
          genre_ids: [35, 16, 10759, 10765],
          id: 111312,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's M.O.D.O.K.",
          overview:
            'The megalomaniacal supervillain M.O.D.O.K. has long pursued his dream of one day conquering the world. But after years of setbacks and failures fighting the Earth’s mightiest heroes, M.O.D.O.K. has run his evil organization A.I.M. into the ground. Ousted as A.I.M.’s leader, while also dealing with his crumbling marriage and family life, the Mental Organism Designed Only for Killing is set to confront his greatest challenge yet: a midlife crisis!',
          popularity: 4.5737,
          poster_path: '/2kXRzRjQZs9kAIm3K9MkQgsZR9C.jpg',
          first_air_date: '2021-05-21',
          name: "Marvel's M.O.D.O.K.",
          vote_average: 6.604,
          vote_count: 193,
        },
        {
          adult: false,
          backdrop_path: '/5W9YCPMDF5TCudct2guf6b8iRFz.jpg',
          genre_ids: [18, 10765, 10759],
          id: 68716,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Inhumans",
          overview:
            'After the Royal Family of Inhumans is splintered by a military coup, they barely escape to Hawaii where their surprising interactions with the lush world and humanity around them may prove to not only save them, but Earth itself.',
          popularity: 6.1915,
          poster_path: '/zKfGip55oJ9tdzhyd9ayGyFFhuo.jpg',
          first_air_date: '2017-09-29',
          name: "Marvel's Inhumans",
          vote_average: 5.9,
          vote_count: 752,
        },
        {
          adult: false,
          backdrop_path: '/cuckn6IFp9OKu9H8AgD0iEANxhc.jpg',
          genre_ids: [10759, 18, 10765],
          id: 62127,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Iron Fist",
          overview:
            'Danny Rand resurfaces 15 years after being presumed dead. Now, with the power of the Iron Fist, he seeks to reclaim his past and fulfill his destiny.',
          popularity: 3.9332,
          poster_path: '/4l6KD9HhtD6nCDEfg10Lp6C6zah.jpg',
          first_air_date: '2017-03-17',
          name: "Marvel's Iron Fist",
          vote_average: 6.518,
          vote_count: 2649,
        },
        {
          adult: false,
          backdrop_path: '/3FaimokK7FaufDYGIGnOG6uyp3f.jpg',
          genre_ids: [10751, 16, 10765, 10759],
          id: 305165,
          origin_country: ['CA', 'DK', 'US'],
          original_language: 'en',
          original_name: 'LEGO Marvel Avengers: Strange Tails',
          overview:
            'Hawkeye and The Avengers have made saving the world look easy. But now they face their wildest threat yet: SOCIAL MEDIA. To save the world, a new team must be recruited to help our heroes contend with an influencer bent on cataclysmic destruction.',
          popularity: 2.8873,
          poster_path: '/6MhzH93izyEvVO15qgM8UJNvY4z.jpg',
          first_air_date: '2025-11-14',
          name: 'LEGO Marvel Avengers: Strange Tails',
          vote_average: 6.083,
          vote_count: 12,
        },
        {
          adult: false,
          backdrop_path: '/2nXKdWx5X3QKA3FFnBdG1qjvcFW.jpg',
          genre_ids: [16, 10762],
          id: 62576,
          origin_country: ['US'],
          original_language: 'en',
          original_name: 'LEGO MARVEL Super Heroes: Maximum Overload',
          overview:
            "Spider-Man and Marvel's Super Heroes take on a mischievous Loki and a team of super villains in an all-new LEGO adventure.",
          popularity: 3.7021,
          poster_path: '/6JaUKywvJyq7g7qDTRYW6s3ZRm9.jpg',
          first_air_date: '2013-11-05',
          name: 'LEGO MARVEL Super Heroes: Maximum Overload',
          vote_average: 6.5,
          vote_count: 15,
        },
        {
          adult: false,
          backdrop_path: '/wumQlzmEGhABxD84c6sFUq4qSug.jpg',
          genre_ids: [16, 10759, 10765, 10762],
          id: 2164,
          origin_country: ['US'],
          original_language: 'en',
          original_name: 'The Marvel Super Heroes',
          overview:
            'This cartoon series, characterized by extremely limited animation, features five of the most popular super-powered heroes from Marvel Comics: the Incredible Hulk, the Mighty Thor, Captain America, Iron Man, and the Sub-Mariner.',
          popularity: 3.8811,
          poster_path: '/nkY0h3WxWWKIxrcpUJdziMV3IN3.jpg',
          first_air_date: '1966-09-05',
          name: 'The Marvel Super Heroes',
          vote_average: 6.5,
          vote_count: 19,
        },
        {
          adult: false,
          backdrop_path: '/pvqasfLg6ALyTV1bAlg4hkrCdVu.jpg',
          genre_ids: [10765, 10759, 18],
          id: 69088,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Agents of S.H.I.E.L.D.: Slingshot",
          overview:
            'Elena "Yo-Yo" Rodriguez, an Inhuman with the ability to move at super-speed, is required to sign the Sokovia Accords. However, the restrictions of the Accords are in direct conflict with a personal mission she\'s desperate to fulfill, one that will test her abilities and will include tense encounters with S.H.I.E.L.D. team members.',
          popularity: 5.834,
          poster_path: '/bwJej7WdmGRMCMyuDlotwAqVX7S.jpg',
          first_air_date: '2016-12-13',
          name: "Marvel's Agents of S.H.I.E.L.D.: Slingshot",
          vote_average: 7.098,
          vote_count: 250,
        },
        {
          adult: false,
          backdrop_path: '/3QkMOMI3EPlhHAN1WFfXHRyTQSt.jpg',
          genre_ids: [16, 35, 10759],
          id: 73919,
          origin_country: ['US'],
          original_language: 'en',
          original_name: "Marvel's Ant-Man",
          overview:
            'Follow Scott Lang as Ant-Man, dealing with everything from super villains to miniature alien invasions (and occasionally helping Cassie with her homework). Along with The Wasp and Hank Pym, Ant-Man protects the world one inch at a time.',
          popularity: 1.6869,
          poster_path: '/6msLuFmP5MjyDW6x8vXHnFM86li.jpg',
          first_air_date: '2017-06-10',
          name: "Marvel's Ant-Man",
          vote_average: 6.241,
          vote_count: 29,
        },
      ],
      total_pages: 8,
      total_results: 141,
    };
    it('should return search results for valid query', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseP1,
      });

      const res = await request(app).get('/api/tv/search').query({ title: 'marvel' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        page: 1,
        results: [
          {
            id: 1403,
            title: "Marvel's Agents of S.H.I.E.L.D.",
            release_date: '2013-09-24',
            poster_path: '/gHUCCMy1vvj58tzE3dZqeC9SXus.jpg',
          },
          {
            id: 61889,
            title: "Marvel's Daredevil",
            release_date: '2015-04-10',
            poster_path: '/QWbPaDxiB6LW2LjASknzYBvjMj.jpg',
          },
          {
            id: 67178,
            title: "Marvel's The Punisher",
            release_date: '2017-11-17',
            poster_path: '/tM6xqRKXoloH9UchaJEyyRE9O1w.jpg',
          },
          {
            id: 38472,
            title: "Marvel's Jessica Jones",
            release_date: '2015-11-20',
            poster_path: '/paf9wL3mOW9LT3ZjRxXqJcjeMEv.jpg',
          },
          {
            id: 70796,
            title: 'The Marvelous Mrs. Maisel',
            release_date: '2017-03-16',
            poster_path: '/aslKQXXydNQxSBvP7zzsbaNTIlF.jpg',
          },
          {
            id: 61550,
            title: "Marvel's Agent Carter",
            release_date: '2015-01-06',
            poster_path: '/7kqIsjjDMZA5GRMH5VCdQYZJqc6.jpg',
          },
          {
            id: 59427,
            title: "Marvel's Avengers",
            release_date: '2013-05-26',
            poster_path: '/aVYPq7FSvsdNQOXVIFnndXJPCXn.jpg',
          },
          {
            id: 70801,
            title: 'Marvel Disk Wars: The Avengers',
            release_date: '2014-04-02',
            poster_path: '/6wQAZaWSvBJOIIt68cqmC0KJjeE.jpg',
          },
          {
            id: 114695,
            title: 'Marvel Studios Legends',
            release_date: '2021-01-08',
            poster_path: '/EpDuYIK81YtCUT3gH2JDpyj8Qk.jpg',
          },
          {
            id: 62126,
            title: "Marvel's Luke Cage",
            release_date: '2016-09-30',
            poster_path: '/yzM1hMB3PUJqbISX0f421b3xOjB.jpg',
          },
          {
            id: 92788,
            title: "Marvel's Moon Girl and Devil Dinosaur",
            release_date: '2023-02-10',
            poster_path: '/1oFkjiF9fT2asKWjRiJtlbhu3hn.jpg',
          },
          {
            id: 34391,
            title: "Marvel's Ultimate Spider-Man",
            release_date: '2012-04-01',
            poster_path: '/jK3pc8XOQT8UgdvSjMFk8xLQOxE.jpg',
          },
          {
            id: 138136,
            title: 'Marvelous Woman',
            release_date: '2021-11-08',
            poster_path: '/h9bnyM0SSfmELGvbUOdTixdEPOW.jpg',
          },
          {
            id: 72705,
            title: "Marvel's Spider-Man",
            release_date: '2017-08-19',
            poster_path: '/dKdcyyHUR5WTMnrbPdYN5y9xPVp.jpg',
          },
          {
            id: 118924,
            title: 'Marvel Studios Assembled',
            release_date: '2021-03-12',
            poster_path: '/v2BHRwtQVkt5fssLdo5MpFgHJPY.jpg',
          },
          {
            id: 113187,
            title: "Marvel's the Brothers",
            release_date: '2018-05-31',
            poster_path: '/48fF0dMnai8re394Ij1hcm6DBcd.jpg',
          },
          {
            id: 67466,
            title: "Marvel's Runaways",
            release_date: '2017-11-21',
            poster_path: '/hnHEhbzh0F7kN3Ah1lzRjtQuW16.jpg',
          },
          {
            id: 250957,
            title: 'My Marvellous Dream Is You',
            release_date: '2024-05-08',
            poster_path: '/ry8hTSyaLqHFlylSoYsItxhtV25.jpg',
          },
          {
            id: 62285,
            title: "Marvel's The Defenders",
            release_date: '2017-08-18',
            poster_path: '/49XzINhH4LFsgz7cx6TOPcHUJUL.jpg',
          },
          {
            id: 66190,
            title: "Marvel's Cloak & Dagger",
            release_date: '2018-06-07',
            poster_path: '/pYnRJuBPEqZO1o4fcxBTgmKNHfy.jpg',
          },
        ],
      });
    });

    it('should return search results for valid query, page, and limit parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseP2,
      });

      const res = await request(app)
        .get('/api/tv/search')
        .query({ title: 'marvel', page: 2, limit: 3 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        page: 2,
        results: [
          {
            id: 228520,
            title: 'My Marvellous Fable',
            release_date: '2023-06-11',
            poster_path: '/4KfIWmhkrhpomhbEFDpbDFEtDhj.jpg',
          },
          {
            id: 63181,
            title: "Marvel's Guardians of the Galaxy",
            release_date: '2015-09-05',
            poster_path: '/oXwe3wVhdvvxiixL9UJf6PgBybZ.jpg',
          },
          {
            id: 92782,
            title: 'Ms. Marvel',
            release_date: '2022-06-08',
            poster_path: '/3HWWh92kZbD7odwJX7nKmXNZsYo.jpg',
          },
        ],
      });
    });

    it('should return search results for valid query, and page parameters, and no limit parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseP2,
      });

      const res = await request(app).get('/api/tv/search').query({ title: 'marvel', page: 2 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        page: 2,
        results: [
          {
            id: 228520,
            title: 'My Marvellous Fable',
            release_date: '2023-06-11',
            poster_path: '/4KfIWmhkrhpomhbEFDpbDFEtDhj.jpg',
          },
          {
            id: 63181,
            title: "Marvel's Guardians of the Galaxy",
            release_date: '2015-09-05',
            poster_path: '/oXwe3wVhdvvxiixL9UJf6PgBybZ.jpg',
          },
          {
            id: 92782,
            title: 'Ms. Marvel',
            release_date: '2022-06-08',
            poster_path: '/3HWWh92kZbD7odwJX7nKmXNZsYo.jpg',
          },
          {
            id: 226757,
            title: 'Marvellous Love',
            release_date: '2023-05-15',
            poster_path: '/9LAjVH33SAwhCi9xTEQVBFdHi7r.jpg',
          },
          {
            id: 117690,
            title: 'Marvelous City',
            release_date: '2021-01-05',
            poster_path: '/6VOY2mm0sVoApwQ65PckSEMkSuZ.jpg',
          },
          {
            id: 6673,
            title: 'The Marvelous Misadventures of Flapjack',
            release_date: '2008-06-05',
            poster_path: '/8dpk0bjBgX93ZkQxEI1daNSj3OW.jpg',
          },
          {
            id: 91278,
            title: "Marvel's Future Avengers",
            release_date: '2017-07-22',
            poster_path: '/buxBvftqx3g57FTYtdrfGSHlWfQ.jpg',
          },
          {
            id: 6145,
            title: 'Modern Marvels',
            release_date: '1993-12-10',
            poster_path: '/uRMi6q4mazNTZ2HKdiY6RP5noDW.jpg',
          },
          {
            id: 138505,
            title: 'Marvel Zombies',
            release_date: '2025-09-24',
            poster_path: '/mwKj9ERGFXsWot0nXgQ5yMQf9I7.jpg',
          },
          {
            id: 319725,
            title: 'Today in Marvel History',
            release_date: '2019-01-10',
            poster_path: '/v3tTJaJwprQkbPYEuvYuY8kyxU6.jpg',
          },
          {
            id: 92804,
            title: 'Alix and the Marvelous',
            release_date: '2019-09-09',
            poster_path: '/38Wm4JiOtajqDOWdjlfesp5T2jE.jpg',
          },
          {
            id: 40044,
            title: "Marvel's Hulk and the Agents of S.M.A.S.H.",
            release_date: '2013-08-11',
            poster_path: '/gkGIiIIkHOeVXzwjBNFTRqTCnqF.jpg',
          },
          {
            id: 111312,
            title: "Marvel's M.O.D.O.K.",
            release_date: '2021-05-21',
            poster_path: '/2kXRzRjQZs9kAIm3K9MkQgsZR9C.jpg',
          },
          {
            id: 68716,
            title: "Marvel's Inhumans",
            release_date: '2017-09-29',
            poster_path: '/zKfGip55oJ9tdzhyd9ayGyFFhuo.jpg',
          },
          {
            id: 62127,
            title: "Marvel's Iron Fist",
            release_date: '2017-03-17',
            poster_path: '/4l6KD9HhtD6nCDEfg10Lp6C6zah.jpg',
          },
          {
            id: 305165,
            title: 'LEGO Marvel Avengers: Strange Tails',
            release_date: '2025-11-14',
            poster_path: '/6MhzH93izyEvVO15qgM8UJNvY4z.jpg',
          },
          {
            id: 62576,
            title: 'LEGO MARVEL Super Heroes: Maximum Overload',
            release_date: '2013-11-05',
            poster_path: '/6JaUKywvJyq7g7qDTRYW6s3ZRm9.jpg',
          },
          {
            id: 2164,
            title: 'The Marvel Super Heroes',
            release_date: '1966-09-05',
            poster_path: '/nkY0h3WxWWKIxrcpUJdziMV3IN3.jpg',
          },
          {
            id: 69088,
            title: "Marvel's Agents of S.H.I.E.L.D.: Slingshot",
            release_date: '2016-12-13',
            poster_path: '/bwJej7WdmGRMCMyuDlotwAqVX7S.jpg',
          },
          {
            id: 73919,
            title: "Marvel's Ant-Man",
            release_date: '2017-06-10',
            poster_path: '/6msLuFmP5MjyDW6x8vXHnFM86li.jpg',
          },
        ],
      });
    });

    it('should return search results for valid query, and limit parameters, no page parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseP1,
      });

      const res = await request(app).get('/api/tv/search').query({ title: 'marvel', limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        page: 1,
        results: [
          {
            id: 1403,
            title: "Marvel's Agents of S.H.I.E.L.D.",
            release_date: '2013-09-24',
            poster_path: '/gHUCCMy1vvj58tzE3dZqeC9SXus.jpg',
          },
          {
            id: 61889,
            title: "Marvel's Daredevil",
            release_date: '2015-04-10',
            poster_path: '/QWbPaDxiB6LW2LjASknzYBvjMj.jpg',
          },
        ],
      });
    });

    it('should return 400 for missing title parameter', async () => {
      const res = await request(app).get('/api/tv/search');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('title is required and must be a string');
    });

    it('should return 400 for invalid page parameter(not a number)', async () => {
      const res = await request(app)
        .get('/api/tv/search')
        .query({ title: 'test', page: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for invalid limit parameter(not a number)', async () => {
      const res = await request(app)
        .get('/api/tv/search')
        .query({ title: 'test', limit: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for a page parameter less than 1', async () => {
      const res = await request(app).get('/api/tv/search').query({ title: 'test', page: 0 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for a page parameter greater than 1000', async () => {
      const res = await request(app).get('/api/tv/search').query({ title: 'test', page: 1001 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for a limit parameter less than 1', async () => {
      const res = await request(app).get('/api/tv/search').query({ title: 'test', limit: 0 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for a limit parameter greater than 50', async () => {
      const res = await request(app).get('/api/tv/search').query({ title: 'test', limit: 51 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for invalid page and limit parameters', async () => {
      const res = await request(app)
        .get('/api/tv/search')
        .query({ title: 'test', page: 'invalid', limit: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
    });

    it('should return 400 for invalid page, but valid limit parameter', async () => {
      const res = await request(app)
        .get('/api/tv/search')
        .query({ title: 'test', page: 'invalid', limit: 20 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).not.toContain('limit must be an integer between 1 and 50');
    });

    it('should return 400 for valid page, but invalid limit parameter', async () => {
      const res = await request(app)
        .get('/api/tv/search')
        .query({ title: 'test', page: 1, limit: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.details).not.toContain('page must be an integer between 1 and 1000');
      expect(res.body.details).toContain('limit must be an integer between 1 and 50');
    });

    it('should return 404 when TMDB returns not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ status_message: 'Not found' }),
      });

      const res = await request(app).get('/api/tv/search').query({ title: 'nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('The resource you requested could not be found');
    });

    it('should return 502 when TMDB API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const res = await request(app).get('/api/tv/search').query({ title: 'test' });

      expect(res.status).toBe(502);
      expect(res.body.message).toBe('Failed to reach the TMDB API');
    });
  });
});
