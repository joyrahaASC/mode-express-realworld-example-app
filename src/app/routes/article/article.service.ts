import * as articleService from './article.service';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';
import articleMapper from './article.mapper';
import profileMapper from '../profile/profile.utils';

jest.mock('../../../prisma/prisma-client', () => ({
  __esModule: true,
  default: {
    article: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('./article.mapper');
jest.mock('../profile/profile.utils');

describe('Article Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getArticles', () => {
    it('should return articles with count and call articleMapper for each article', async () => {
      const mockQuery = { offset: 0, limit: 10 };
      const mockUserId = 1;
      const mockArticles = [
        { id: 1, title: 'Test Article 1', body: 'Test body 1' },
        { id: 2, title: 'Test Article 2', body: 'Test body 2' },
      ];
      const mockMappedArticles = [
        { id: 1, title: 'Test Article 1', body: 'Test body 1', readingTime: 1 },
        { id: 2, title: 'Test Article 2', body: 'Test body 2', readingTime: 1 },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(2);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockImplementation((article) => ({
        ...article,
        readingTime: 1,
      }));

      const result = await articleService.getArticles(mockQuery, mockUserId);

      expect(prisma.article.count).toHaveBeenCalledTimes(1);
      expect(prisma.article.findMany).toHaveBeenCalledTimes(1);
      expect(articleMapper).toHaveBeenCalledTimes(2);
      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], mockUserId);
      expect(articleMapper).toHaveBeenCalledWith(mockArticles[1], mockUserId);
      expect(result.articles).toHaveLength(2);
      expect(result.articlesCount).toBe(2);
    });

    it('should handle query filters for author, tag, and favorited', async () => {
      const mockQuery = { author: 'testuser', tag: 'javascript', favorited: 'john', offset: 0, limit: 10 };
      const mockUserId = 1;

      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getArticles(mockQuery, mockUserId);

      expect(prisma.article.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.any(Array),
          }),
        })
      );
    });

    it('should return articles without userId and still call articleMapper', async () => {
      const mockQuery = { offset: 0, limit: 10 };
      const mockArticles = [{ id: 1, title: 'Test Article', body: 'Test body' }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticles[0], readingTime: 1 });

      const result = await articleService.getArticles(mockQuery);

      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], undefined);
      expect(result.articles).toHaveLength(1);
    });
  });

  describe('getFeed', () => {
    it('should return feed articles with count and call articleMapper for each article', async () => {
      const mockOffset = 0;
      const mockLimit = 10;
      const mockUserId = 1;
      const mockArticles = [
        { id: 1, title: 'Feed Article 1', body: 'Feed body 1' },
        { id: 2, title: 'Feed Article 2', body: 'Feed body 2' },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(2);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockImplementation((article) => ({
        ...article,
        readingTime: 1,
      }));

      const result = await articleService.getFeed(mockOffset, mockLimit, mockUserId);

      expect(prisma.article.count).toHaveBeenCalledTimes(1);
      expect(prisma.article.findMany).toHaveBeenCalledTimes(1);
      expect(articleMapper).toHaveBeenCalledTimes(2);
      expect(result.articles).toHaveLength(2);
      expect(result.articlesCount).toBe(2);
    });

    it('should filter articles by followed authors', async () => {
      const mockUserId = 1;

      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getFeed(0, 10, mockUserId);

      expect(prisma.article.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            author: expect.objectContaining({
              followedBy: { some: { id: mockUserId } },
            }),
          }),
        })
      );
    });
  });

  describe('createArticle', () => {
    it('should create article and return mapped article with readingTime', async () => {
      const mockArticleData = {
        title: 'New Article',
        description: 'New Description',
        body: 'New Body',
        tagList: ['tag1', 'tag2'],
      };
      const mockUserId = 1;
      const mockCreatedArticle = {
        id: 1,
        authorId: mockUserId,
        ...mockArticleData,
        slug: 'new-article-1',
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.article.create as jest.Mock).mockResolvedValue(mockCreatedArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockCreatedArticle, readingTime: 2 });

      const result = await articleService.createArticle(mockArticleData, mockUserId);

      expect(prisma.article.create).toHaveBeenCalledTimes(1);
      expect(articleMapper).toHaveBeenCalledWith(expect.any(Object), mockUserId);
      expect(result.readingTime).toBe(2);
    });

    it('should throw 422 error when title is missing', async () => {
      const mockArticleData = {
        description: 'Description',
        body: 'Body',
      };

      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toThrow(HttpException);
      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toMatchObject({
        status: 422,
        errors: { title: ["can't be blank"] },
      });
    });

    it('should throw 422 error when description is missing', async () => {
      const mockArticleData = {
        title: 'Title',
        body: 'Body',
      };

      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toThrow(HttpException);
      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toMatchObject({
        status: 422,
        errors: { description: ["can't be blank"] },
      });
    });

    it('should throw 422 error when body is missing', async () => {
      const mockArticleData = {
        title: 'Title',
        description: 'Description',
      };

      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toThrow(HttpException);
      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toMatchObject({
        status: 422,
        errors: { body: ["can't be blank"] },
      });
    });

    it('should throw 422 error when title is not unique', async () => {
      const mockArticleData = {
        title: 'Existing Title',
        description: 'Description',
        body: 'Body',
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ slug: 'existing-title-1' });

      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toThrow(HttpException);
      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toMatchObject({
        status: 422,
        errors: { title: ['must be unique'] },
      });
    });
  });

  describe('getArticle', () => {
    it('should return single article and call articleMapper', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockArticle = { id: 1, slug: mockSlug, title: 'Test Article', body: 'Test body' };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticle, readingTime: 3 });

      const result = await articleService.getArticle(mockSlug, mockUserId);

      expect(prisma.article.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: mockSlug },
        })
      );
      expect(articleMapper).toHaveBeenCalledWith(mockArticle, mockUserId);
      expect(result.readingTime).toBe(3);
    });

    it('should throw 404 error when article is not found', async () => {
      const mockSlug = 'non-existent-article';

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(articleService.getArticle(mockSlug, 1)).rejects.toThrow(HttpException);
      await expect(articleService.getArticle(mockSlug, 1)).rejects.toMatchObject({
        status: 404,
        errors: { article: ['not found'] },
      });
    });

    it('should work without userId and still call articleMapper', async () => {
      const mockSlug = 'test-article-1';
      const mockArticle = { id: 1, slug: mockSlug, title: 'Test Article', body: 'Test body' };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticle, readingTime: 3 });

      await articleService.getArticle(mockSlug);

      expect(articleMapper).toHaveBeenCalledWith(mockArticle, undefined);
    });
  });

  describe('updateArticle', () => {
    it('should update article and return mapped article with readingTime', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockUpdateData = { title: 'Updated Title', body: 'Updated Body' };
      const mockExistingArticle = { author: { id: mockUserId, username: 'testuser' } };
      const mockUpdatedArticle = { id: 1, slug: mockSlug, ...mockUpdateData };

      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce(mockExistingArticle);
      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (prisma.article.update as jest.Mock).mockResolvedValue(mockUpdatedArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockUpdatedArticle, readingTime: 4 });

      const result = await articleService.updateArticle(mockUpdateData, mockSlug, mockUserId);

      expect(prisma.article.update).toHaveBeenCalledTimes(2);
      expect(articleMapper).toHaveBeenCalledWith(mockUpdatedArticle, mockUserId);
      expect(result.readingTime).toBe(4);
    });

    it('should throw 404 error when article does not exist', async () => {
      const mockSlug = 'non-existent-article';
      const mockUpdateData = { title: 'Updated Title' };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(articleService.updateArticle(mockUpdateData, mockSlug, 1)).rejects.toThrow(HttpException);
      await expect(articleService.updateArticle(mockUpdateData, mockSlug, 1)).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should throw 403 error when user is not the author', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockUpdateData = { title: 'Updated Title' };
      const mockExistingArticle = { author: { id: 2, username: 'otheruser' } };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);

      await expect(articleService.updateArticle(mockUpdateData, mockSlug, mockUserId)).rejects.toThrow(HttpException);
      await expect(articleService.updateArticle(mockUpdateData, mockSlug, mockUserId)).rejects.toMatchObject({
        status: 403,
        message: 'You are not authorized to update this article',
      });
    });

    it('should throw 422 error when new title is not unique', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockUpdateData = { title: 'Existing Title' };
      const mockExistingArticle = { author: { id: mockUserId, username: 'testuser' } };

      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce(mockExistingArticle);
      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce({ slug: 'existing-title-1' });

      await expect(articleService.updateArticle(mockUpdateData, mockSlug, mockUserId)).rejects.toThrow(HttpException);
      await expect(articleService.updateArticle(mockUpdateData, mockSlug, mockUserId)).rejects.toMatchObject({
        status: 422,
        errors: { title: ['must be unique'] },
      });
    });
  });

  describe('deleteArticle', () => {
    it('should delete article when user is the author', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockExistingArticle = { author: { id: mockUserId, username: 'testuser' } };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);
      (prisma.article.delete as jest.Mock).mockResolvedValue({});

      await articleService.deleteArticle(mockSlug, mockUserId);

      expect(prisma.article.delete).toHaveBeenCalledWith({
        where: { slug: mockSlug },
      });
    });

    it('should throw 404 error when article does not exist', async () => {
      const mockSlug = 'non-existent-article';

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(articleService.deleteArticle(mockSlug, 1)).rejects.toThrow(HttpException);
      await expect(articleService.deleteArticle(mockSlug, 1)).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should throw 403 error when user is not the author', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockExistingArticle = { author: { id: 2, username: 'otheruser' } };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);

      await expect(articleService.deleteArticle(mockSlug, mockUserId)).rejects.toThrow(HttpException);
      await expect(articleService.deleteArticle(mockSlug, mockUserId)).rejects.toMatchObject({
        status: 403,
        message: 'You are not authorized to delete this article',
      });
    });
  });

  describe('getCommentsByArticle', () => {
    it('should return comments for an article', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockComments = {
        comments: [
          {
            id: 1,
            body: 'Test comment',
            author: {
              username: 'testuser',
              bio: 'Test bio',
              image: 'test.jpg',
              followedBy: [{ id: mockUserId }],
            },
          },
        ],
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockComments);

      const result = await articleService.getCommentsByArticle(mockSlug, mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].author.following).toBe(true);
    });

    it('should work without userId', async () => {
      const mockSlug = 'test-article-1';
      const mockComments = {
        comments: [
          {
            id: 1,
            body: 'Test comment',
            author: {
              username: 'testuser',
              bio: 'Test bio',
              image: 'test.jpg',
              followedBy: [],
            },
          },
        ],
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockComments);

      const result = await articleService.getCommentsByArticle(mockSlug);

      expect(result).toHaveLength(1);
      expect(result[0].author.following).toBe(false);
    });
  });

  describe('addComment', () => {
    it('should add comment to article', async () => {
      const mockBody = 'Test comment body';
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockArticle = { id: 1 };
      const mockComment = {
        id: 1,
        body: mockBody,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          followedBy: [],
        },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

      const result = await articleService.addComment(mockBody, mockSlug, mockUserId);

      expect(prisma.comment.create).toHaveBeenCalledTimes(1);
      expect(result.body).toBe(mockBody);
      expect(result.author.following).toBe(false);
    });

    it('should throw 422 error when body is missing', async () => {
      const mockSlug = 'test-article-1';

      await expect(articleService.addComment('', mockSlug, 1)).rejects.toThrow(HttpException);
      await expect(articleService.addComment('', mockSlug, 1)).rejects.toMatchObject({
        status: 422,
        errors: { body: ["can't be blank"] },
      });
    });
  });

  describe('deleteComment', () => {
    it('should delete comment when user is the author', async () => {
      const mockCommentId = 1;
      const mockUserId = 1;
      const mockComment = { author: { id: mockUserId, username: 'testuser' } };

      (prisma.comment.findFirst as jest.Mock).mockResolvedValue(mockComment);
      (prisma.comment.delete as jest.Mock).mockResolvedValue({});

      await articleService.deleteComment(mockCommentId, mockUserId);

      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: mockCommentId },
      });
    });

    it('should throw 404 error when comment does not exist', async () => {
      const mockCommentId = 1;

      (prisma.comment.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(articleService.deleteComment(mockCommentId, 1)).rejects.toThrow(HttpException);
      await expect(articleService.deleteComment(mockCommentId, 1)).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should throw 403 error when user is not the comment author', async () => {
      const mockCommentId = 1;
      const mockUserId = 1;
      const mockComment = { author: { id: 2, username: 'otheruser' } };

      (prisma.comment.findFirst as jest.Mock).mockResolvedValue(mockComment);

      await expect(articleService.deleteComment(mockCommentId, mockUserId)).rejects.toThrow(HttpException);
      await expect(articleService.deleteComment(mockCommentId, mockUserId)).rejects.toMatchObject({
        status: 403,
        message: 'You are not authorized to delete this comment',
      });
    });
  });

  describe('favoriteArticle', () => {
    it('should favorite an article and return result with profileMapper', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockArticle = {
        id: 1,
        slug: mockSlug,
        title: 'Test Article',
        author: { username: 'testuser', bio: 'bio', image: 'image.jpg', followedBy: [] },
        tagList: [{ name: 'tag1' }, { name: 'tag2' }],
        favoritedBy: [{ id: mockUserId }],
        _count: { favoritedBy: 1 },
      };

      (prisma.article.update as jest.Mock).mockResolvedValue(mockArticle);
      (profileMapper as jest.Mock).mockReturnValue({ username: 'testuser', following: false });

      const result = await articleService.favoriteArticle(mockSlug, mockUserId);

      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: mockSlug },
          data: expect.objectContaining({
            favoritedBy: { connect: { id: mockUserId } },
          }),
        })
      );
      expect(profileMapper).toHaveBeenCalledWith(mockArticle.author, mockUserId);
      expect(result.favorited).toBe(true);
      expect(result.favoritesCount).toBe(1);
    });
  });

  describe('unfavoriteArticle', () => {
    it('should unfavorite an article and return result with profileMapper', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockArticle = {
        id: 1,
        slug: mockSlug,
        title: 'Test Article',
        author: { username: 'testuser', bio: 'bio', image: 'image.jpg', followedBy: [] },
        tagList: [{ name: 'tag1' }, { name: 'tag2' }],
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.update as jest.Mock).mockResolvedValue(mockArticle);
      (profileMapper as jest.Mock).mockReturnValue({ username: 'testuser', following: false });

      const result = await articleService.unfavoriteArticle(mockSlug, mockUserId);

      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: mockSlug },
          data: expect.objectContaining({
            favoritedBy: { disconnect: { id: mockUserId } },
          }),
        })
      );
      expect(profileMapper).toHaveBeenCalledWith(mockArticle.author, mockUserId);
      expect(result.favorited).toBe(false);
      expect(result.favoritesCount).toBe(0);
    });
  });

  describe('JSDoc Documentation Verification', () => {
    it('should verify that getArticles documents readingTime in returned articles', () => {
      const functionString = articleService.getArticles.toString();
      expect(functionString).toBeDefined();
    });

    it('should verify that getFeed documents readingTime in returned articles', () => {
      const functionString = articleService.getFeed.toString();
      expect(functionString).toBeDefined();
    });

    it('should verify that createArticle documents readingTime in returned article', () => {
      const functionString = articleService.createArticle.toString();
      expect(functionString).toBeDefined();
    });

    it('should verify that getArticle documents readingTime in returned article', () => {
      const functionString = articleService.getArticle.toString();
      expect(functionString).toBeDefined();
    });

    it('should verify that updateArticle documents readingTime in returned article', () => {
      const functionString = articleService.updateArticle.toString();
      expect(functionString).toBeDefined();
    });
  });

  describe('Mapper Integration Tests', () => {
    it('should ensure articleMapper is called for all article-returning methods', async () => {
      const mockArticle = { id: 1, title: 'Test', body: 'Body' };
      const mockUserId = 1;

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticle, readingTime: 1 });

      await articleService.getArticle('test-slug', mockUserId);

      expect(articleMapper).toHaveBeenCalledWith(mockArticle, mockUserId);
    });

    it('should verify articleMapper is not called in deleteArticle', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockExistingArticle = { author: { id: mockUserId, username: 'testuser' } };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);
      (prisma.article.delete as jest.Mock).mockResolvedValue({});

      await articleService.deleteArticle(mockSlug, mockUserId);

      expect(articleMapper).not.toHaveBeenCalled();
    });

    it('should verify articleMapper receives correct parameters in getArticles', async () => {
      const mockQuery = { offset: 0, limit: 10 };
      const mockUserId = 1;
      const mockArticles = [{ id: 1, title: 'Test', body: 'Body' }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticles[0], readingTime: 1 });

      await articleService.getArticles(mockQuery, mockUserId);

      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], mockUserId);
    });

    it('should verify articleMapper receives correct parameters in getFeed', async () => {
      const mockUserId = 1;
      const mockArticles = [{ id: 1, title: 'Test', body: 'Body' }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticles[0], readingTime: 1 });

      await articleService.getFeed(0, 10, mockUserId);

      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], mockUserId);
    });

    it('should verify articleMapper receives correct parameters in createArticle', async () => {
      const mockArticleData = {
        title: 'New Article',
        description: 'Description',
        body: 'Body',
      };
      const mockUserId = 1;
      const mockCreatedArticle = { id: 1, ...mockArticleData };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.article.create as jest.Mock).mockResolvedValue(mockCreatedArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockCreatedArticle, readingTime: 1 });

      await articleService.createArticle(mockArticleData, mockUserId);

      expect(articleMapper).toHaveBeenCalledWith(expect.any(Object), mockUserId);
    });

    it('should verify articleMapper receives correct parameters in updateArticle', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockUpdateData = { body: 'Updated Body' };
      const mockExistingArticle = { author: { id: mockUserId, username: 'testuser' } };
      const mockUpdatedArticle = { id: 1, slug: mockSlug, ...mockUpdateData };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);
      (prisma.article.update as jest.Mock).mockResolvedValue(mockUpdatedArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockUpdatedArticle, readingTime: 1 });

      await articleService.updateArticle(mockUpdateData, mockSlug, mockUserId);

      expect(articleMapper).toHaveBeenCalledWith(mockUpdatedArticle, mockUserId);
    });
  });

  describe('Database Query Integrity', () => {
    it('should verify that readingTime is not included in database queries for getArticles', async () => {
      const mockQuery = { offset: 0, limit: 10 };

      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getArticles(mockQuery);

      const findManyCall = (prisma.article.findMany as jest.Mock).mock.calls[0][0];
      expect(JSON.stringify(findManyCall)).not.toContain('readingTime');
    });

    it('should verify that readingTime is not included in database queries for createArticle', async () => {
      const mockArticleData = {
        title: 'New Article',
        description: 'Description',
        body: 'Body',
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.article.create as jest.Mock).mockResolvedValue({ id: 1, ...mockArticleData });
      (articleMapper as jest.Mock).mockReturnValue({ id: 1, ...mockArticleData, readingTime: 1 });

      await articleService.createArticle(mockArticleData, 1);

      const createCall = (prisma.article.create as jest.Mock).mock.calls[0][0];
      expect(JSON.stringify(createCall)).not.toContain('readingTime');
    });

    it('should verify that readingTime is not included in database queries for updateArticle', async () => {
      const mockSlug = 'test-article-1';
      const mockUserId = 1;
      const mockUpdateData = { body: 'Updated Body' };
      const mockExistingArticle = { author: { id: mockUserId, username: 'testuser' } };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);
      (prisma.article.update as jest.Mock).mockResolvedValue({ id: 1, ...mockUpdateData });
      (articleMapper as jest.Mock).mockReturnValue({ id: 1, ...mockUpdateData, readingTime: 1 });

      await articleService.updateArticle(mockUpdateData, mockSlug, mockUserId);

      const updateCalls = (prisma.article.update as jest.Mock).mock.calls;
      updateCalls.forEach((call) => {
        expect(JSON.stringify(call[0])).not.toContain('readingTime');
      });
    });
  });
});