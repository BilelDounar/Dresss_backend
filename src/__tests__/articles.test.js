const request = require('supertest');
const app = require('../app');

// Mock the Article Mongoose model
jest.mock('../api/models/articleModel', () => ({
    find: jest.fn(),
    findById: jest.fn(),
}));

const Article = require('../api/models/articleModel');

describe('Articles API', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/articles', () => {
        it('should return list of articles', async () => {
            const mockArticles = [
                { _id: '1', titre: 'Article 1', urlPhoto: '/img1.jpg', prix: 10 },
                { _id: '2', titre: 'Article 2', urlPhoto: '/img2.jpg', prix: 20 },
            ];
            Article.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockArticles),
            });

            const res = await request(app).get('/api/articles');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockArticles);
            expect(Article.find).toHaveBeenCalledTimes(1);
            expect(Article.find().sort).toHaveBeenCalledTimes(1);
        });

        it('should handle server error', async () => {
            Article.find.mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('DB error')),
            });

            const res = await request(app).get('/api/articles');

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('message');
        });
    });

    describe('GET /api/articles/:id', () => {
        it('should return a single article', async () => {
            const mockArticle = { _id: '1', titre: 'Article 1', urlPhoto: '/img1.jpg', prix: 10 };
            Article.findById.mockResolvedValue(mockArticle);

            const res = await request(app).get('/api/articles/1');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockArticle);
            expect(Article.findById).toHaveBeenCalledWith('1');
        });

        it('should return 404 if article not found', async () => {
            Article.findById.mockResolvedValue(null);

            const res = await request(app).get('/api/articles/unknown');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
        });

        it('should handle server error', async () => {
            Article.findById.mockRejectedValue(new Error('DB error'));

            const res = await request(app).get('/api/articles/1');

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('message');
        });
    });
});
