import { Request, Response, NextFunction } from 'express';
import * as articleService from './article.service';
import router from './article.controller';

jest.mock('./article.service');
jest.mock('../auth/auth', () => ({
  optional: jest.fn((req, res, next) => next()),
  required: jest.fn((req, res, next) => next()),
}));

describe('Article Controller - readingTime field inclusion', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let sendStatusMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    sendStatusMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      query: {},
      params: {},
      body: {},
      auth: { user: { id: 1 } },
    };
    
    mockResponse = {
      json: jsonMock,
      sendStatus: sendStatusMock,
      status: statusMock,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('GET /articles - getArticles handler', () => {
    it('should call getArticles service with query params and user id', async () => {
      const mockArticles = {
        articles: [
          { slug: 'test-article', title: 'Test', readingTime: 5 },
        ],
        articlesCount: 1,
      };
      
      mockRequest.query = { offset: '0', limit: '20', tag: 'test' };
      mockRequest.auth = { user: { id: 1 } };
      
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(articleService.getArticles).toHaveBeenCalledWith(mockRequest.query, 1);
      expect(jsonMock).toHaveBeenCalledWith(mockArticles);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should include readingTime field in each article in the response', async () => {
      const mockArticles = {
        articles: [
          { slug: 'article-1', title: 'Article 1', readingTime: 3 },
          { slug: 'article-2', title: 'Article 2', readingTime: 7 },
        ],
        articlesCount: 2,
      };
      
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(jsonMock).toHaveBeenCalledWith(mockArticles);
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.articles[0]).toHaveProperty('readingTime');
      expect(responseData.articles[1]).toHaveProperty('readingTime');
    });

    it('should handle errors and pass them to next middleware', async () => {
      const error = new Error('Database error');
      (articleService.getArticles as jest.Mock).mockRejectedValue(error);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should work with optional auth when user is not authenticated', async () => {
      const mockArticles = {
        articles: [{ slug: 'test', title: 'Test', readingTime: 4 }],
        articlesCount: 1,
      };
      
      mockRequest.auth = undefined;
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(articleService.getArticles).toHaveBeenCalledWith(mockRequest.query, undefined);
      expect(jsonMock).toHaveBeenCalledWith(mockArticles);
    });
  });

  describe('GET /articles/feed - getFeed handler', () => {
    it('should call getFeed service with offset, limit, and user id', async () => {
      const mockFeed = {
        articles: [
          { slug: 'feed-article', title: 'Feed Article', readingTime: 6 },
        ],
        articlesCount: 1,
      };
      
      mockRequest.query = { offset: '10', limit: '5' };
      mockRequest.auth = { user: { id: 2 } };
      
      (articleService.getFeed as jest.Mock).mockResolvedValue(mockFeed);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/feed' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(articleService.getFeed).toHaveBeenCalledWith(10, 5, 2);
      expect(jsonMock).toHaveBeenCalledWith(mockFeed);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should include readingTime field in each article in the feed response', async () => {
      const mockFeed = {
        articles: [
          { slug: 'feed-1', title: 'Feed 1', readingTime: 2 },
          { slug: 'feed-2', title: 'Feed 2', readingTime: 8 },
          { slug: 'feed-3', title: 'Feed 3', readingTime: 5 },
        ],
        articlesCount: 3,
      };
      
      (articleService.getFeed as jest.Mock).mockResolvedValue(mockFeed);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/feed' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(jsonMock).toHaveBeenCalledWith(mockFeed);
      const responseData = jsonMock.mock.calls[0][0];
      responseData.articles.forEach((article: any) => {
        expect(article).toHaveProperty('readingTime');
        expect(typeof article.readingTime).toBe('number');
      });
    });

    it('should handle errors and pass them to next middleware', async () => {
      const error = new Error('Feed fetch error');
      (articleService.getFeed as jest.Mock).mockRejectedValue(error);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/feed' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should handle NaN values for offset and limit gracefully', async () => {
      const mockFeed = {
        articles: [{ slug: 'test', title: 'Test', readingTime: 3 }],
        articlesCount: 1,
      };
      
      mockRequest.query = { offset: 'invalid', limit: 'invalid' };
      (articleService.getFeed as jest.Mock).mockResolvedValue(mockFeed);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/feed' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(articleService.getFeed).toHaveBeenCalledWith(NaN, NaN, 1);
    });
  });

  describe('GET /articles/:slug - getArticle handler', () => {
    it('should call getArticle service with slug and user id', async () => {
      const mockArticle = {
        slug: 'test-article',
        title: 'Test Article',
        body: 'Test content',
        readingTime: 4,
      };
      
      mockRequest.params = { slug: 'test-article' };
      mockRequest.auth = { user: { id: 3 } };
      
      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(articleService.getArticle).toHaveBeenCalledWith('test-article', 3);
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should include readingTime field in the article response', async () => {
      const mockArticle = {
        slug: 'detailed-article',
        title: 'Detailed Article',
        body: 'Very long content here...',
        readingTime: 12,
      };
      
      mockRequest.params = { slug: 'detailed-article' };
      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.article).toHaveProperty('readingTime');
      expect(responseData.article.readingTime).toBe(12);
    });

    it('should handle errors and pass them to next middleware', async () => {
      const error = new Error('Article not found');
      mockRequest.params = { slug: 'non-existent' };
      (articleService.getArticle as jest.Mock).mockRejectedValue(error);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should work with optional auth when user is not authenticated', async () => {
      const mockArticle = {
        slug: 'public-article',
        title: 'Public Article',
        readingTime: 5,
      };
      
      mockRequest.params = { slug: 'public-article' };
      mockRequest.auth = undefined;
      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(articleService.getArticle).toHaveBeenCalledWith('public-article', undefined);
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
    });
  });

  describe('POST /articles/:slug/favorite - favoriteArticle handler', () => {
    it('should include readingTime field in favorited article response', async () => {
      const mockArticle = {
        slug: 'favorite-article',
        title: 'Favorite Article',
        favorited: true,
        favoritesCount: 1,
        readingTime: 7,
      };
      
      mockRequest.params = { slug: 'favorite-article' };
      mockRequest.auth = { user: { id: 4 } };
      (articleService.favoriteArticle as jest.Mock).mockResolvedValue(mockArticle);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/favorite' && layer.route?.methods?.post
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.article).toHaveProperty('readingTime');
      expect(responseData.article.readingTime).toBe(7);
    });

    it('should handle errors without interfering with readingTime field', async () => {
      const error = new Error('Favorite failed');
      mockRequest.params = { slug: 'test-article' };
      (articleService.favoriteArticle as jest.Mock).mockRejectedValue(error);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/favorite' && layer.route?.methods?.post
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /articles/:slug/favorite - unfavoriteArticle handler', () => {
    it('should include readingTime field in unfavorited article response', async () => {
      const mockArticle = {
        slug: 'unfavorite-article',
        title: 'Unfavorite Article',
        favorited: false,
        favoritesCount: 0,
        readingTime: 9,
      };
      
      mockRequest.params = { slug: 'unfavorite-article' };
      mockRequest.auth = { user: { id: 5 } };
      (articleService.unfavoriteArticle as jest.Mock).mockResolvedValue(mockArticle);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/favorite' && layer.route?.methods?.delete
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.article).toHaveProperty('readingTime');
      expect(responseData.article.readingTime).toBe(9);
    });

    it('should handle errors without interfering with readingTime field', async () => {
      const error = new Error('Unfavorite failed');
      mockRequest.params = { slug: 'test-article' };
      (articleService.unfavoriteArticle as jest.Mock).mockRejectedValue(error);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/favorite' && layer.route?.methods?.delete
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('PUT /articles/:slug - updateArticle handler', () => {
    it('should include readingTime field in updated article response', async () => {
      const mockArticle = {
        slug: 'updated-article',
        title: 'Updated Article',
        body: 'Updated content with more words',
        readingTime: 10,
      };
      
      mockRequest.params = { slug: 'old-slug' };
      mockRequest.body = { article: { title: 'Updated Article', body: 'Updated content' } };
      mockRequest.auth = { user: { id: 6 } };
      (articleService.updateArticle as jest.Mock).mockResolvedValue(mockArticle);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.put
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.article).toHaveProperty('readingTime');
      expect(responseData.article.readingTime).toBe(10);
    });

    it('should handle errors without interfering with readingTime field', async () => {
      const error = new Error('Update failed');
      mockRequest.params = { slug: 'test-article' };
      mockRequest.body = { article: {} };
      (articleService.updateArticle as jest.Mock).mockRejectedValue(error);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.put
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('POST /articles - createArticle handler', () => {
    it('should include readingTime field in created article response', async () => {
      const mockArticle = {
        slug: 'new-article',
        title: 'New Article',
        body: 'Brand new content',
        readingTime: 6,
      };
      
      mockRequest.body = {
        article: {
          title: 'New Article',
          description: 'Description',
          body: 'Brand new content',
        },
      };
      mockRequest.auth = { user: { id: 7 } };
      (articleService.createArticle as jest.Mock).mockResolvedValue(mockArticle);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.post
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.article).toHaveProperty('readingTime');
    });
  });

  describe('Error handling across all endpoints', () => {
    it('should not lose readingTime field when errors occur in serialization layer', async () => {
      const mockArticle = {
        slug: 'test',
        title: 'Test',
        readingTime: 5,
      };
      
      mockRequest.params = { slug: 'test' };
      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(jsonMock).toHaveBeenCalled();
      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.article.readingTime).toBeDefined();
    });

    it('should maintain error handling flow without affecting readingTime inclusion', async () => {
      const error = new Error('Service error');
      (articleService.getArticles as jest.Mock).mockRejectedValue(error);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Response structure validation', () => {
    it('should pass article data through res.json() preserving readingTime', async () => {
      const mockArticle = {
        slug: 'test',
        title: 'Test',
        description: 'Test description',
        body: 'Test body',
        readingTime: 8,
        author: { username: 'test' },
      };
      
      mockRequest.params = { slug: 'test' };
      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
      const calledWith = jsonMock.mock.calls[0][0];
      expect(calledWith.article.readingTime).toBe(8);
    });

    it('should pass article list through res.json() preserving readingTime for all articles', async () => {
      const mockArticles = {
        articles: [
          { slug: 'article-1', readingTime: 3 },
          { slug: 'article-2', readingTime: 5 },
          { slug: 'article-3', readingTime: 7 },
        ],
        articlesCount: 3,
      };
      
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);
      
      const handler = (router as any).stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.get
      ).route.stack[0].handle;
      
      await handler(mockRequest, mockResponse, mockNext);
      
      expect(jsonMock).toHaveBeenCalledWith(mockArticles);
      const calledWith = jsonMock.mock.calls[0][0];
      calledWith.articles.forEach((article: any, index: number) => {
        expect(article.readingTime).toBe(mockArticles.articles[index].readingTime);
      });
    });
  });
});