'use strict';

const fs = require('fs');
const EventEmitter = require('events');

jest.mock('fs', () => ({ createReadStream: jest.fn() }));
jest.mock('csv-parser', () => jest.fn());
jest.mock('../../models/tours', () => ({ find: jest.fn() }));

const Tour = require('../../models/tours');
const controller = require('../../controllers/SuggestionController');
const csv = require('csv-parser');

class FakeStream extends EventEmitter {
  pipe() {
    return this;
  }
}

const csvResponse = () => {
  const stream = new FakeStream();
  fs.createReadStream.mockReturnValue(stream);
  csv.mockReturnValue(stream);
  return stream;
};

describe('suggestion controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns sorted matching suggestions for upcoming approved tours', async () => {
    Tour.find.mockResolvedValue([
      {
        _id: 'tour-1',
        name: 'Kandy tour',
        status: 'approved',
        startDate: '2999-01-01',
        weather: { city: 'Kandy' },
      },
      {
        _id: 'tour-2',
        name: 'Nuwara Eliya tour',
        status: 'approved',
        startDate: '2999-01-01',
        weather: { city: 'Nuwara Eliya' },
      },
    ]);
    const stream = csvResponse([
      { antecedents: 'Kandy', consequents: 'Kandy', confidence: '0.7' },
      { antecedents: 'Kandy', consequents: 'Nuwara Eliya', confidence: '0.9' },
    ]);

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    controller.getSuggestions({ params: { tourName: 'Kandy' } }, res);
    await Promise.resolve();
    stream.emit('data', { antecedents: 'Kandy', consequents: 'Kandy', confidence: '0.7' });
    stream.emit('data', { antecedents: 'Kandy', consequents: 'Nuwara Eliya', confidence: '0.9' });
    stream.emit('end');

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ destination: 'Nuwara Eliya', confidence: 0.9 }),
      expect.objectContaining({ destination: 'Kandy', confidence: 0.7 }),
    ]);
  });

  test('does not return past, unapproved, or weather-less tours', async () => {
    Tour.find.mockResolvedValue([
      { name: 'Past', status: 'approved', startDate: '2020-01-01', weather: { city: 'Kandy' } },
      { name: 'Pending', status: 'pending', startDate: '2999-01-01', weather: { city: 'Kandy' } },
      { name: 'No weather', status: 'approved', startDate: '2999-01-01' },
    ]);
    const stream = csvResponse();
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    controller.getSuggestions({ params: { tourName: 'Kandy' } }, res);
    await Promise.resolve();
    stream.emit('data', { antecedents: 'Kandy', consequents: 'Kandy', confidence: '0.9' });
    stream.emit('end');

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('reports tour lookup and CSV stream failures', async () => {
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    Tour.find.mockRejectedValueOnce(new Error('tour lookup failed'));
    await controller.getSuggestions({ params: { tourName: 'Kandy' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching tours' });

    Tour.find.mockResolvedValueOnce([]);
    const stream = csvResponse();
    const streamRes = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    controller.getSuggestions({ params: { tourName: 'Kandy' } }, streamRes);
    await Promise.resolve();
    stream.emit('error', new Error('csv failed'));

    expect(streamRes.status).toHaveBeenCalledWith(500);
    expect(streamRes.json).toHaveBeenCalledWith({ error: 'Error reading suggestions' });
  });
});
