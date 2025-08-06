const request = require('supertest');
const app = require('../app');

// Mock Mongoose models used in the controller
jest.mock('../api/models/publicationModel', () => ({
    find: jest.fn(),
    findById: jest.fn(),
}));

jest.mock('../api/models/viewedPublicationModel', () => ({
    find: jest.fn(),
}));

const Publication = require('../api/models/publicationModel');
const ViewedPublication = require('../api/models/viewedPublicationModel');

describe('Publications API', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/publications', () => {
        it('should return all publications when no userId provided', async () => {
            const mockPubs = [
                { _id: 'p1', description: 'Pub 1' },
                { _id: 'p2', description: 'Pub 2' },
            ];
            Publication.find.mockResolvedValue(mockPubs);

            const res = await request(app).get('/api/publications');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockPubs);
            expect(Publication.find).toHaveBeenCalledWith({});
        });

        it('should return unviewed publications for a given userId', async () => {
            const userId = 'u123';
            const viewed = [
                { publication: 'p1', user: userId },
            ];
            const unviewedPubs = [
                { _id: 'p2', description: 'Pub 2' },
                { _id: 'p3', description: 'Pub 3' },
            ];
            ViewedPublication.find.mockResolvedValue(viewed);
            Publication.find.mockResolvedValue(unviewedPubs);

            const res = await request(app).get(`/api/publications?userId=${userId}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(unviewedPubs);
            expect(ViewedPublication.find).toHaveBeenCalledWith({ user: userId });
            expect(Publication.find).toHaveBeenCalledWith({ _id: { $nin: ['p1'] } });
        });

        it('should handle server error', async () => {
            Publication.find.mockRejectedValue(new Error('DB error'));

            const res = await request(app).get('/api/publications');

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('message');
        });
    });

    describe('GET /api/publications/:id', () => {
        it('should return a single publication', async () => {
            const mockPub = { _id: 'p1', description: 'Pub 1' };
            Publication.findById.mockResolvedValue(mockPub);

            const res = await request(app).get('/api/publications/p1');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockPub);
            expect(Publication.findById).toHaveBeenCalledWith('p1');
        });

        it('should return 404 if publication not found', async () => {
            Publication.findById.mockResolvedValue(null);

            const res = await request(app).get('/api/publications/unknown');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
        });

        it('should handle server error', async () => {
            Publication.findById.mockRejectedValue(new Error('DB error'));

            const res = await request(app).get('/api/publications/p1');

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('message');
        });
    });
});