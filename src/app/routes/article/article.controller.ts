import { Request, Response, NextFunction } from 'express';
import * as articleService from './article.service';
import router from './article.controller';

jest.mock('./article.service');
jest.mock('../auth/auth', () => ({
  optional: jest.fn((req, res, next) => next()),
  required: jest.fn((req, res, next) => next()),
}));

describe('Article Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      query: {},
      params: {},
      body: {},
      auth: { user: { id: 1 } },
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      sendStatus: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('GET /articles', () => {
    it('should call getArticles service and return result with readingTime', async () => {
      const mockResult = {
        articles: [
          { slug: 'test-article', title: 'Test', readingTime: 5 },
        ],
        articlesCount: 1,
      };
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.query = { offset: '0', limit: '10' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getArticles).toHaveBeenCalledWith(mockRequest.query, 1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when getArticles service fails', async () => {
      const mockError = new Error('Service error');
      (articleService.getArticles as jest.Mock).mockRejectedValue(mockError);

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should pass undefined userId when user is not authenticated', async () => {
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.auth = undefined;

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getArticles).toHaveBeenCalledWith(mockRequest.query, undefined);
    });
  });

  describe('GET /articles/feed', () => {
    it('should call getFeed service and return result with readingTime', async () => {
      const mockResult = {
        articles: [
          { slug: 'feed-article', title: 'Feed', readingTime: 3 },
        ],
        articlesCount: 1,
      };
      (articleService.getFeed as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.query = { offset: '0', limit: '20' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/feed' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getFeed).toHaveBeenCalledWith(0, 20, 1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when getFeed service fails', async () => {
      const mockError = new Error('Feed error');
      (articleService.getFeed as jest.Mock).mockRejectedValue(mockError);

      mockRequest.query = { offset: '0', limit: '20' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/feed' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('POST /articles', () => {
    it('should call createArticle service and return article with readingTime and 201 status', async () => {
      const mockArticle = {
        slug: 'new-article',
        title: 'New Article',
        readingTime: 7,
      };
      (articleService.createArticle as jest.Mock).mockResolvedValue(mockArticle);

      mockRequest.body = {
        article: { title: 'New Article', body: 'Content' },
      };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.post
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.createArticle).toHaveBeenCalledWith(mockRequest.body.article, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ article: mockArticle });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when createArticle service fails', async () => {
      const mockError = new Error('Create error');
      (articleService.createArticle as jest.Mock).mockRejectedValue(mockError);

      mockRequest.body = { article: {} };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.post
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('GET /articles/:slug', () => {
    it('should call getArticle service and return article with readingTime', async () => {
      const mockArticle = {
        slug: 'test-slug',
        title: 'Test Article',
        readingTime: 4,
      };
      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);

      mockRequest.params = { slug: 'test-slug' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getArticle).toHaveBeenCalledWith('test-slug', 1);
      expect(mockResponse.json).toHaveBeenCalledWith({ article: mockArticle });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when getArticle service fails', async () => {
      const mockError = new Error('Article not found');
      (articleService.getArticle as jest.Mock).mockRejectedValue(mockError);

      mockRequest.params = { slug: 'non-existent' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should pass undefined userId when user is not authenticated', async () => {
      const mockArticle = { slug: 'test-slug', readingTime: 4 };
      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);

      mockRequest.params = { slug: 'test-slug' };
      mockRequest.auth = undefined;

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getArticle).toHaveBeenCalledWith('test-slug', undefined);
    });
  });

  describe('PUT /articles/:slug', () => {
    it('should call updateArticle service and return updated article with readingTime', async () => {
      const mockArticle = {
        slug: 'updated-slug',
        title: 'Updated Article',
        readingTime: 6,
      };
      (articleService.updateArticle as jest.Mock).mockResolvedValue(mockArticle);

      mockRequest.params = { slug: 'test-slug' };
      mockRequest.body = {
        article: { title: 'Updated Article', body: 'Updated content' },
      };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.put
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.updateArticle).toHaveBeenCalledWith(
        mockRequest.body.article,
        'test-slug',
        1
      );
      expect(mockResponse.json).toHaveBeenCalledWith({ article: mockArticle });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when updateArticle service fails', async () => {
      const mockError = new Error('Update error');
      (articleService.updateArticle as jest.Mock).mockRejectedValue(mockError);

      mockRequest.params = { slug: 'test-slug' };
      mockRequest.body = { article: {} };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.put
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /articles/:slug', () => {
    it('should call deleteArticle service and return 204 status', async () => {
      (articleService.deleteArticle as jest.Mock).mockResolvedValue(undefined);

      mockRequest.params = { slug: 'test-slug' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.delete
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.deleteArticle).toHaveBeenCalledWith('test-slug', 1);
      expect(mockResponse.sendStatus).toHaveBeenCalledWith(204);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when deleteArticle service fails', async () => {
      const mockError = new Error('Delete error');
      (articleService.deleteArticle as jest.Mock).mockRejectedValue(mockError);

      mockRequest.params = { slug: 'test-slug' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.delete
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.sendStatus).not.toHaveBeenCalled();
    });
  });

  describe('GET /articles/:slug/comments', () => {
    it('should call getCommentsByArticle service and return comments', async () => {
      const mockComments = [
        { id: 1, body: 'Comment 1' },
        { id: 2, body: 'Comment 2' },
      ];
      (articleService.getCommentsByArticle as jest.Mock).mockResolvedValue(mockComments);

      mockRequest.params = { slug: 'test-slug' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/comments' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getCommentsByArticle).toHaveBeenCalledWith('test-slug', 1);
      expect(mockResponse.json).toHaveBeenCalledWith({ comments: mockComments });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when getCommentsByArticle service fails', async () => {
      const mockError = new Error('Comments error');
      (articleService.getCommentsByArticle as jest.Mock).mockRejectedValue(mockError);

      mockRequest.params = { slug: 'test-slug' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/comments' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('POST /articles/:slug/comments', () => {
    it('should call addComment service and return created comment', async () => {
      const mockComment = { id: 1, body: 'New comment' };
      (articleService.addComment as jest.Mock).mockResolvedValue(mockComment);

      mockRequest.params = { slug: 'test-slug' };
      mockRequest.body = { comment: { body: 'New comment' } };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/comments' && layer.route?.methods?.post
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.addComment).toHaveBeenCalledWith('New comment', 'test-slug', 1);
      expect(mockResponse.json).toHaveBeenCalledWith({ comment: mockComment });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when addComment service fails', async () => {
      const mockError = new Error('Add comment error');
      (articleService.addComment as jest.Mock).mockRejectedValue(mockError);

      mockRequest.params = { slug: 'test-slug' };
      mockRequest.body = { comment: { body: 'New comment' } };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/comments' && layer.route?.methods?.post
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /articles/:slug/comments/:id', () => {
    it('should call deleteComment service and return 200 with empty object', async () => {
      (articleService.deleteComment as jest.Mock).mockResolvedValue(undefined);

      mockRequest.params = { slug: 'test-slug', id: '1' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/comments/:id' && layer.route?.methods?.delete
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.deleteComment).toHaveBeenCalledWith(1, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({});
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when deleteComment service fails', async () => {
      const mockError = new Error('Delete comment error');
      (articleService.deleteComment as jest.Mock).mockRejectedValue(mockError);

      mockRequest.params = { slug: 'test-slug', id: '1' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/comments/:id' && layer.route?.methods?.delete
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('POST /articles/:slug/favorite', () => {
    it('should call favoriteArticle service and return favorited article with readingTime', async () => {
      const mockArticle = {
        slug: 'test-slug',
        favorited: true,
        favoritesCount: 1,
        readingTime: 5,
      };
      (articleService.favoriteArticle as jest.Mock).mockResolvedValue(mockArticle);

      mockRequest.params = { slug: 'test-slug' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/favorite' && layer.route?.methods?.post
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.favoriteArticle).toHaveBeenCalledWith('test-slug', 1);
      expect(mockResponse.json).toHaveBeenCalledWith({ article: mockArticle });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when favoriteArticle service fails', async () => {
      const mockError = new Error('Favorite error');
      (articleService.favoriteArticle as jest.Mock).mockRejectedValue(mockError);

      mockRequest.params = { slug: 'test-slug' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/favorite' && layer.route?.methods?.post
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /articles/:slug/favorite', () => {
    it('should call unfavoriteArticle service and return unfavorited article with readingTime', async () => {
      const mockArticle = {
        slug: 'test-slug',
        favorited: false,
        favoritesCount: 0,
        readingTime: 5,
      };
      (articleService.unfavoriteArticle as jest.Mock).mockResolvedValue(mockArticle);

      mockRequest.params = { slug: 'test-slug' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/favorite' && layer.route?.methods?.delete
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.unfavoriteArticle).toHaveBeenCalledWith('test-slug', 1);
      expect(mockResponse.json).toHaveBeenCalledWith({ article: mockArticle });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when unfavoriteArticle service fails', async () => {
      const mockError = new Error('Unfavorite error');
      (articleService.unfavoriteArticle as jest.Mock).mockRejectedValue(mockError);

      mockRequest.params = { slug: 'test-slug' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug/favorite' && layer.route?.methods?.delete
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('Response Structure Validation', () => {
    it('should maintain article key in response for GET /articles/:slug', async () => {
      const mockArticle = { slug: 'test', readingTime: 5 };
      (articleService.getArticle as jest.Mock).mockResolvedValue(mockArticle);

      mockRequest.params = { slug: 'test' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/:slug' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall).toHaveProperty('article');
      expect(responseCall.article).toEqual(mockArticle);
    });

    it('should maintain articles and articlesCount keys in response for GET /articles', async () => {
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall).toHaveProperty('articles');
      expect(responseCall).toHaveProperty('articlesCount');
    });

    it('should maintain articles and articlesCount keys in response for GET /articles/feed', async () => {
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.getFeed as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.query = { offset: '0', limit: '20' };

      const handler = (router.stack.find(
        (layer: any) => layer.route?.path === '/articles/feed' && layer.route?.methods?.get
      ) as any).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall).toHaveProperty('articles');
      expect(responseCall).toHaveProperty('articlesCount');
    });
  });
});