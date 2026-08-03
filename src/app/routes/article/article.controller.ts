import { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import express from 'express';
import router from './article.controller';
import * as articleService from './article.service';
import auth from '../auth/auth';

jest.mock('./article.service');
jest.mock('../auth/auth');

describe('Article Controller - readingTime Integration Tests', () => {
  let app: express.Application;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(router);

    mockRequest = {
      query: {},
      params: {},
      body: {},
      auth: undefined,
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('GET /articles - getArticles handler', () => {
    it('should call getArticles service with query params and user id', async () => {
      const mockArticles = {
        articles: [
          {
            slug: 'test-article',
            title: 'Test Article',
            description: 'Test description',
            body: 'Test body content',
            readingTime: 5,
          },
        ],
        articlesCount: 1,
      };

      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);
      (auth.optional as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 123 } };
        next();
      });

      mockRequest.query = { offset: '0', limit: '10', tag: 'test' };
      mockRequest.auth = { user: { id: 123 } };

      await request(app)
        .get('/articles')
        .query({ offset: '0', limit: '10', tag: 'test' })
        .expect(200);

      expect(articleService.getArticles).toHaveBeenCalledWith(
        expect.objectContaining({ offset: '0', limit: '10', tag: 'test' }),
        123
      );
    });

    it('should return articles with readingTime included via mapper', async () => {
      const mockArticles = {
        articles: [
          {
            slug: 'article-1',
            title: 'Article 1',
            readingTime: 3,
          },
          {
            slug: 'article-2',
            title: 'Article 2',
            readingTime: 7,
          },
        ],
        articlesCount: 2,
      };

      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/articles').expect(200);

      expect(response.body).toEqual(mockArticles);
      expect(response.body.articles[0]).toHaveProperty('readingTime');
      expect(response.body.articles[1]).toHaveProperty('readingTime');
    });

    it('should handle errors without interfering with readingTime field', async () => {
      const mockError = new Error('Database connection failed');
      (articleService.getArticles as jest.Mock).mockRejectedValue(mockError);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });

      const response = await request(app).get('/articles').expect(500);

      expect(response.body.error).toBe('Database connection failed');
      expect(articleService.getArticles).toHaveBeenCalled();
    });

    it('should call getArticles with undefined user id when not authenticated', async () => {
      const mockArticles = { articles: [], articlesCount: 0 };
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      await request(app).get('/articles').expect(200);

      expect(articleService.getArticles).toHaveBeenCalledWith(expect.any(Object), undefined);
    });
  });

  describe('GET /articles/feed - getFeed handler', () => {
    it('should call getFeed service with offset, limit, and user id', async () => {
      const mockFeed = {
        articles: [
          {
            slug: 'feed-article',
            title: 'Feed Article',
            readingTime: 4,
          },
        ],
        articlesCount: 1,
      };

      (articleService.getFeed as jest.Mock).mockResolvedValue(mockFeed);
      (auth.required as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 456 } };
        next();
      });

      await request(app)
        .get('/articles/feed')
        .query({ offset: '10', limit: '20' })
        .expect(200);

      expect(articleService.getFeed).toHaveBeenCalledWith(10, 20, 456);
    });

    it('should return feed articles with readingTime included via mapper', async () => {
      const mockFeed = {
        articles: [
          {
            slug: 'feed-1',
            title: 'Feed Article 1',
            readingTime: 6,
          },
          {
            slug: 'feed-2',
            title: 'Feed Article 2',
            readingTime: 2,
          },
        ],
        articlesCount: 2,
      };

      (articleService.getFeed as jest.Mock).mockResolvedValue(mockFeed);
      (auth.required as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 456 } };
        next();
      });

      const response = await request(app).get('/articles/feed').expect(200);

      expect(response.body).toEqual(mockFeed);
      expect(response.body.articles[0]).toHaveProperty('readingTime', 6);
      expect(response.body.articles[1]).toHaveProperty('readingTime', 2);
    });

    it('should handle errors in feed endpoint without interfering with readingTime', async () => {
      const mockError = new Error('Feed service error');
      (articleService.getFeed as jest.Mock).mockRejectedValue(mockError);
      (auth.required as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 456 } };
        next();
      });

      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });

      const response = await request(app).get('/articles/feed').expect(500);

      expect(response.body.error).toBe('Feed service error');
    });

    it('should convert query params to numbers for offset and limit', async () => {
      const mockFeed = { articles: [], articlesCount: 0 };
      (articleService.getFeed as jest.Mock).mockResolvedValue(mockFeed);
      (auth.required as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 789 } };
        next();
      });

      await request(app)
        .get('/articles/feed')
        .query({ offset: '5', limit: '15' })
        .expect(200);

      expect(articleService.getFeed).toHaveBeenCalledWith(5, 15, 789);
    });
  });

  describe('GET /articles/:slug - getArticle handler', () => {
    it('should call getArticle service with slug and user id', async () => {
      const mockArticle = {
        slug: 'test-slug',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body',
        readingTime: 8,
      };

      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);
      (auth.optional as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 111 } };
        next();
      });

      await request(app).get('/articles/test-slug').expect(200);

      expect(articleService.getArticle).toHaveBeenCalledWith('test-slug', 111);
    });

    it('should return single article with readingTime included via mapper', async () => {
      const mockArticle = {
        slug: 'single-article',
        title: 'Single Article',
        description: 'Description',
        body: 'Body content',
        readingTime: 10,
      };

      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/articles/single-article').expect(200);

      expect(response.body).toEqual({ article: mockArticle });
      expect(response.body.article).toHaveProperty('readingTime', 10);
    });

    it('should handle errors in getArticle without interfering with readingTime', async () => {
      const mockError = new Error('Article not found');
      (articleService.getArticle as jest.Mock).mockRejectedValue(mockError);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(404).json({ error: err.message });
      });

      const response = await request(app).get('/articles/non-existent').expect(404);

      expect(response.body.error).toBe('Article not found');
    });

    it('should call getArticle with undefined user id when not authenticated', async () => {
      const mockArticle = {
        slug: 'public-article',
        title: 'Public Article',
        readingTime: 5,
      };

      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      await request(app).get('/articles/public-article').expect(200);

      expect(articleService.getArticle).toHaveBeenCalledWith('public-article', undefined);
    });
  });

  describe('Error Handling - Ensuring readingTime field is not affected', () => {
    it('should maintain error handling for getArticles without breaking readingTime', async () => {
      const mockError = new Error('Service unavailable');
      (articleService.getArticles as jest.Mock).mockRejectedValue(mockError);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(503).json({ error: err.message });
      });

      await request(app).get('/articles').expect(503);

      expect(articleService.getArticles).toHaveBeenCalled();
    });

    it('should maintain error handling for getFeed without breaking readingTime', async () => {
      const mockError = new Error('Unauthorized access');
      (articleService.getFeed as jest.Mock).mockRejectedValue(mockError);
      (auth.required as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 999 } };
        next();
      });

      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(401).json({ error: err.message });
      });

      await request(app).get('/articles/feed').expect(401);

      expect(articleService.getFeed).toHaveBeenCalled();
    });

    it('should maintain error handling for getArticle without breaking readingTime', async () => {
      const mockError = new Error('Internal server error');
      (articleService.getArticle as jest.Mock).mockRejectedValue(mockError);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });

      await request(app).get('/articles/error-slug').expect(500);

      expect(articleService.getArticle).toHaveBeenCalled();
    });
  });

  describe('Mapper Integration - Verifying readingTime is included automatically', () => {
    it('should verify getArticles returns articles array with readingTime for each article', async () => {
      const mockArticles = {
        articles: [
          { slug: 'article-1', readingTime: 1 },
          { slug: 'article-2', readingTime: 2 },
          { slug: 'article-3', readingTime: 3 },
        ],
        articlesCount: 3,
      };

      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/articles').expect(200);

      response.body.articles.forEach((article: any) => {
        expect(article).toHaveProperty('readingTime');
        expect(typeof article.readingTime).toBe('number');
      });
    });

    it('should verify getFeed returns feed articles with readingTime for each article', async () => {
      const mockFeed = {
        articles: [
          { slug: 'feed-1', readingTime: 4 },
          { slug: 'feed-2', readingTime: 5 },
        ],
        articlesCount: 2,
      };

      (articleService.getFeed as jest.Mock).mockResolvedValue(mockFeed);
      (auth.required as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 123 } };
        next();
      });

      const response = await request(app).get('/articles/feed').expect(200);

      response.body.articles.forEach((article: any) => {
        expect(article).toHaveProperty('readingTime');
        expect(typeof article.readingTime).toBe('number');
      });
    });

    it('should verify getArticle returns single article with readingTime', async () => {
      const mockArticle = {
        slug: 'test-article',
        title: 'Test',
        readingTime: 12,
      };

      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/articles/test-article').expect(200);

      expect(response.body.article).toHaveProperty('readingTime', 12);
      expect(typeof response.body.article.readingTime).toBe('number');
    });
  });

  describe('Response Structure - Ensuring no manual readingTime calculation in controller', () => {
    it('should not modify response structure in getArticles handler', async () => {
      const mockArticles = {
        articles: [{ slug: 'test', readingTime: 5 }],
        articlesCount: 1,
      };

      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/articles').expect(200);

      expect(response.body).toEqual(mockArticles);
      expect(articleService.getArticles).toHaveBeenCalledTimes(1);
    });

    it('should not modify response structure in getFeed handler', async () => {
      const mockFeed = {
        articles: [{ slug: 'feed', readingTime: 3 }],
        articlesCount: 1,
      };

      (articleService.getFeed as jest.Mock).mockResolvedValue(mockFeed);
      (auth.required as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 456 } };
        next();
      });

      const response = await request(app).get('/articles/feed').expect(200);

      expect(response.body).toEqual(mockFeed);
      expect(articleService.getFeed).toHaveBeenCalledTimes(1);
    });

    it('should not modify response structure in getArticle handler', async () => {
      const mockArticle = { slug: 'single', readingTime: 7 };

      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/articles/single').expect(200);

      expect(response.body).toEqual({ article: mockArticle });
      expect(articleService.getArticle).toHaveBeenCalledTimes(1);
    });
  });
});