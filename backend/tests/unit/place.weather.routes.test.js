'use strict';

const request = require('supertest');
const createApp = require('../../app');

jest.mock('../../models/Restaurant', () => ({ find: jest.fn() }));
jest.mock('../../models/Hotel', () => ({ find: jest.fn() }));
jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('../../models/tours', () => ({ find: jest.fn() }));

const Restaurant = require('../../models/Restaurant');
const Hotel = require('../../models/Hotel');
const axios = require('axios');
const Tour = require('../../models/tours');
const { getWeatherAndTours } = require('../../controllers/weatherController');

const query = (value) => Promise.resolve(value);

describe('place lookup endpoints', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns restaurants, optionally filtered by location', async () => {
    Restaurant.find.mockReturnValue(query([{ name: 'Kandy Cafe' }]));

    const all = await request(app).get('/api/restaurants');
    const filtered = await request(app).get('/api/restaurants?location=Kandy');

    expect(all.status).toBe(200);
    expect(all.body).toEqual([{ name: 'Kandy Cafe' }]);
    expect(Restaurant.find).toHaveBeenNthCalledWith(1, {});
    expect(Restaurant.find).toHaveBeenNthCalledWith(2, { location: 'Kandy' });
    expect(filtered.status).toBe(200);
  });

  test('returns hotels and turns repository failures into a safe 500', async () => {
    Hotel.find.mockReturnValueOnce(query([{ name: 'Hotel One' }]));
    const found = await request(app).get('/api/hotels');
    expect(found.status).toBe(200);
    expect(found.body).toEqual([{ name: 'Hotel One' }]);

    Hotel.find.mockRejectedValueOnce(new Error('database offline'));
    const failed = await request(app).get('/api/hotels');
    expect(failed.status).toBe(500);
    expect(failed.body).toEqual({ error: 'Failed to fetch hotels' });
  });

  test('returns a safe 500 when restaurant lookup fails', async () => {
    Restaurant.find.mockRejectedValue(new Error('database offline'));

    const response = await request(app).get('/api/restaurants');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch restaurants' });
  });
});

describe('weather endpoint', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.WEATHER_API_KEY;
  });

  test('returns current conditions for a city', async () => {
    axios.get.mockResolvedValue({
      data: { current: { condition: { text: 'Sunny' }, temp_c: 27 } },
    });

    const response = await request(app).get('/api/weather/Dhaka');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ weather: 'Sunny', temp: 27 });
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('q=Dhaka,Bangladesh'));
  });

  test('degrades to an unavailable weather result when the provider fails', async () => {
    axios.get.mockRejectedValue(new Error('provider down'));

    const response = await request(app).get('/api/weather/Dhaka');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ weather: 'Unavailable', temp: 'N/A' });
  });

  test('enriches tours and isolates a failed city weather lookup', async () => {
    const tours = [
      { name: 'Dhaka tour', toObject: () => ({ name: 'Dhaka tour' }) },
      { name: 'Chattogram tour', toObject: () => ({ name: 'Chattogram tour' }) },
    ];
    Tour.find.mockResolvedValue(tours);
    axios.get
      .mockResolvedValueOnce({ data: { current: { condition: { text: 'Cloudy' }, temp_c: 25 } } })
      .mockRejectedValueOnce(new Error('city unavailable'));

    const res = { json: jest.fn() };
    await getWeatherAndTours({}, res);

    expect(res.json).toHaveBeenCalledWith({
      suggestions: [
        { name: 'Dhaka tour', weather: 'Cloudy', temp: 25 },
        { name: 'Chattogram tour', weather: 'Unavailable', temp: 'N/A' },
      ],
    });
  });
});
