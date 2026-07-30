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

describe('Article Service - Body Field Inclusion Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getArticles', () => {
    it('should include body field in select clause for articleMapper', async () => {
      const mockArticles = [
        {
          id: 1,
          slug: 'test-article-1',
          title: 'Test Article',
          description: 'Test Description',
          body: 'This is the article body content for reading time calculation',
          createdAt: new Date(),
          updatedAt: new Date(),
          tagList: [{ name: 'test' }],
          author: {
            username: 'testuser',
            bio: 'Test bio',
            image: 'test.jpg',
            followedBy: [],
          },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticles[0], readingTime: 1 });

      await articleService.getArticles({}, 1);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            body: true,
          }),
        })
      );

      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], 1);
    });

    it('should map articles with articleMapper to include readingTime', async () => {
      const mockArticles = [
        {
          id: 1,
          slug: 'test-1',
          title: 'Test',
          description: 'Desc',
          body: 'Body content',
          createdAt: new Date(),
          updatedAt: new Date(),
          tagList: [],
          author: { username: 'user', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticles[0], readingTime: 2 });

      const result = await articleService.getArticles({ offset: 0, limit: 10 }, 1);

      expect(articleMapper).toHaveBeenCalledTimes(1);
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0]).toHaveProperty('readingTime', 2);
    });

    it('should handle query with author filter and include body field', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getArticles({ author: 'testuser' }, 1);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            body: true,
          }),
        })
      );
    });

    it('should handle query with tag filter and include body field', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getArticles({ tag: 'javascript' }, 1);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            body: true,
          }),
        })
      );
    });

    it('should handle query with favorited filter and include body field', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getArticles({ favorited: 'testuser' }, 1);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            body: true,
          }),
        })
      );
    });
  });

  describe('getFeed', () => {
    it('should include body field in select clause for articleMapper', async () => {
      const mockArticles = [
        {
          id: 1,
          slug: 'feed-article-1',
          title: 'Feed Article',
          description: 'Feed Description',
          body: 'Feed article body content for reading time',
          createdAt: new Date(),
          updatedAt: new Date(),
          tagList: [],
          author: {
            username: 'author',
            bio: '',
            image: '',
            followedBy: [],
          },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticles[0], readingTime: 1 });

      await articleService.getFeed(0, 10, 1);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            body: true,
          }),
        })
      );

      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], 1);
    });

    it('should map feed articles with articleMapper to include readingTime', async () => {
      const mockArticles = [
        {
          id: 2,
          slug: 'feed-2',
          title: 'Feed Test',
          description: 'Feed Desc',
          body: 'Feed body content',
          createdAt: new Date(),
          updatedAt: new Date(),
          tagList: [],
          author: { username: 'feeduser', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticles[0], readingTime: 3 });

      const result = await articleService.getFeed(0, 10, 1);

      expect(articleMapper).toHaveBeenCalledTimes(1);
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0]).toHaveProperty('readingTime', 3);
    });

    it('should handle pagination and include body field', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getFeed(20, 5, 1);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 5,
          select: expect.objectContaining({
            body: true,
          }),
        })
      );
    });
  });

  describe('getArticle', () => {
    it('should include body field in select clause for articleMapper', async () => {
      const mockArticle = {
        id: 1,
        slug: 'single-article-1',
        title: 'Single Article',
        description: 'Single Description',
        body: 'Single article body content for reading time calculation',
        createdAt: new Date(),
        updatedAt: new Date(),
        tagList: [],
        author: {
          username: 'singleuser',
          bio: '',
          image: '',
          followedBy: [],
        },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticle, readingTime: 1 });

      await articleService.getArticle('single-article-1', 1);

      expect(prisma.article.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            body: true,
          }),
        })
      );

      expect(articleMapper).toHaveBeenCalledWith(mockArticle, 1);
    });

    it('should return article with readingTime from articleMapper', async () => {
      const mockArticle = {
        id: 3,
        slug: 'article-3',
        title: 'Article 3',
        description: 'Desc 3',
        body: 'Body content 3',
        createdAt: new Date(),
        updatedAt: new Date(),
        tagList: [],
        author: { username: 'user3', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticle, readingTime: 4 });

      const result = await articleService.getArticle('article-3', 1);

      expect(result).toHaveProperty('readingTime', 4);
      expect(articleMapper).toHaveBeenCalledWith(mockArticle, 1);
    });

    it('should throw 404 when article not found', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(articleService.getArticle('non-existent', 1)).rejects.toThrow(HttpException);
      await expect(articleService.getArticle('non-existent', 1)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('createArticle', () => {
    it('should include body field in created article for articleMapper', async () => {
      const newArticle = {
        title: 'New Article',
        description: 'New Description',
        body: 'New article body content for reading time',
        tagList: ['test'],
      };

      const mockCreatedArticle = {
        authorId: 1,
        id: 10,
        slug: 'new-article-1',
        title: newArticle.title,
        description: newArticle.description,
        body: newArticle.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        tagList: [{ name: 'test' }],
        author: {
          username: 'creator',
          bio: '',
          image: '',
          followedBy: [],
        },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.article.create as jest.Mock).mockResolvedValue(mockCreatedArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockCreatedArticle, readingTime: 1 });

      await articleService.createArticle(newArticle, 1);

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({
          body: newArticle.body,
        }),
        1
      );
    });

    it('should return created article with readingTime from articleMapper', async () => {
      const newArticle = {
        title: 'Another Article',
        description: 'Another Description',
        body: 'Another body content',
        tagList: [],
      };

      const mockCreatedArticle = {
        authorId: 1,
        id: 11,
        slug: 'another-article-1',
        title: newArticle.title,
        description: newArticle.description,
        body: newArticle.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        tagList: [],
        author: { username: 'creator', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.article.create as jest.Mock).mockResolvedValue(mockCreatedArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockCreatedArticle, readingTime: 2 });

      const result = await articleService.createArticle(newArticle, 1);

      expect(result).toHaveProperty('readingTime', 2);
      expect(articleMapper).toHaveBeenCalledTimes(1);
    });

    it('should throw 422 when title is missing', async () => {
      const invalidArticle = {
        description: 'Description',
        body: 'Body',
      };

      await expect(articleService.createArticle(invalidArticle, 1)).rejects.toThrow(HttpException);
      await expect(articleService.createArticle(invalidArticle, 1)).rejects.toMatchObject({
        statusCode: 422,
      });
    });

    it('should throw 422 when description is missing', async () => {
      const invalidArticle = {
        title: 'Title',
        body: 'Body',
      };

      await expect(articleService.createArticle(invalidArticle, 1)).rejects.toThrow(HttpException);
      await expect(articleService.createArticle(invalidArticle, 1)).rejects.toMatchObject({
        statusCode: 422,
      });
    });

    it('should throw 422 when body is missing', async () => {
      const invalidArticle = {
        title: 'Title',
        description: 'Description',
      };

      await expect(articleService.createArticle(invalidArticle, 1)).rejects.toThrow(HttpException);
      await expect(articleService.createArticle(invalidArticle, 1)).rejects.toMatchObject({
        statusCode: 422,
      });
    });
  });

  describe('updateArticle', () => {
    it('should include body field in updated article for articleMapper', async () => {
      const updateData = {
        title: 'Updated Title',
        body: 'Updated body content for reading time',
      };

      const mockExistingArticle = {
        author: { id: 1, username: 'author' },
      };

      const mockUpdatedArticle = {
        id: 5,
        slug: 'updated-title-1',
        title: updateData.title,
        description: 'Original Description',
        body: updateData.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        tagList: [],
        author: { username: 'author', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce(mockExistingArticle).mockResolvedValueOnce(null);
      (prisma.article.update as jest.Mock).mockResolvedValueOnce(undefined).mockResolvedValueOnce(mockUpdatedArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockUpdatedArticle, readingTime: 2 });

      await articleService.updateArticle(updateData, 'original-slug-1', 1);

      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            body: true,
          }),
        })
      );

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({
          body: updateData.body,
        }),
        1
      );
    });

    it('should return updated article with readingTime from articleMapper', async () => {
      const updateData = {
        description: 'Updated Description',
      };

      const mockExistingArticle = {
        author: { id: 1, username: 'author' },
      };

      const mockUpdatedArticle = {
        id: 6,
        slug: 'article-6',
        title: 'Original Title',
        description: updateData.description,
        body: 'Original body',
        createdAt: new Date(),
        updatedAt: new Date(),
        tagList: [],
        author: { username: 'author', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);
      (prisma.article.update as jest.Mock).mockResolvedValueOnce(undefined).mockResolvedValueOnce(mockUpdatedArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockUpdatedArticle, readingTime: 3 });

      const result = await articleService.updateArticle(updateData, 'article-6', 1);

      expect(result).toHaveProperty('readingTime', 3);
      expect(articleMapper).toHaveBeenCalledWith(mockUpdatedArticle, 1);
    });

    it('should throw 404 when article not found', async () => {
      (prisma.article.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(articleService.updateArticle({}, 'non-existent', 1)).rejects.toThrow(HttpException);
      await expect(articleService.updateArticle({}, 'non-existent', 1)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 403 when user is not authorized', async () => {
      const mockExistingArticle = {
        author: { id: 2, username: 'otheruser' },
      };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);

      await expect(articleService.updateArticle({}, 'article-slug', 1)).rejects.toThrow(HttpException);
      await expect(articleService.updateArticle({}, 'article-slug', 1)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('Function Signature Preservation', () => {
    it('getArticles should maintain signature (query: any, id?: number)', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getArticles({}, undefined);
      await articleService.getArticles({ tag: 'test' }, 1);

      expect(prisma.article.findMany).toHaveBeenCalledTimes(2);
    });

    it('getFeed should maintain signature (offset: number, limit: number, id: number)', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getFeed(0, 10, 1);

      expect(prisma.article.findMany).toHaveBeenCalledTimes(1);
    });

    it('getArticle should maintain signature (slug: string, id?: number)', async () => {
      const mockArticle = {
        id: 1,
        slug: 'test',
        title: 'Test',
        description: 'Test',
        body: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (articleMapper as jest.Mock).mockReturnValue(mockArticle);

      await articleService.getArticle('test', undefined);
      await articleService.getArticle('test', 1);

      expect(prisma.article.findUnique).toHaveBeenCalledTimes(2);
    });

    it('createArticle should maintain signature (article: any, id: number)', async () => {
      const newArticle = {
        title: 'Test',
        description: 'Test',
        body: 'Test',
      };

      const mockCreatedArticle = {
        authorId: 1,
        id: 1,
        ...newArticle,
        slug: 'test-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.article.create as jest.Mock).mockResolvedValue(mockCreatedArticle);
      (articleMapper as jest.Mock).mockReturnValue(mockCreatedArticle);

      await articleService.createArticle(newArticle, 1);

      expect(prisma.article.create).toHaveBeenCalledTimes(1);
    });

    it('updateArticle should maintain signature (article: any, slug: string, id: number)', async () => {
      const mockExistingArticle = {
        author: { id: 1, username: 'user' },
      };

      const mockUpdatedArticle = {
        id: 1,
        slug: 'test',
        title: 'Updated',
        description: 'Test',
        body: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);
      (prisma.article.update as jest.Mock).mockResolvedValueOnce(undefined).mockResolvedValueOnce(mockUpdatedArticle);
      (articleMapper as jest.Mock).mockReturnValue(mockUpdatedArticle);

      await articleService.updateArticle({ title: 'Updated' }, 'test', 1);

      expect(prisma.article.update).toHaveBeenCalled();
    });
  });

  describe('articleMapper Integration', () => {
    it('should call articleMapper with correct parameters in all functions', async () => {
      const mockArticle = {
        id: 1,
        slug: 'test',
        title: 'Test',
        description: 'Test',
        body: 'Test body content',
        createdAt: new Date(),
        updatedAt: new Date(),
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([mockArticle]);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.article.create as jest.Mock).mockResolvedValue({ authorId: 1, id: 1, ...mockArticle });
      (prisma.article.findFirst as jest.Mock).mockResolvedValue({ author: { id: 1, username: 'user' } });
      (prisma.article.update as jest.Mock).mockResolvedValueOnce(undefined).mockResolvedValueOnce(mockArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticle, readingTime: 1 });

      await articleService.getArticles({}, 1);
      await articleService.getFeed(0, 10, 1);
      await articleService.getArticle('test', 1);
      await articleService.createArticle({ title: 'Test', description: 'Test', body: 'Test' }, 1);
      await articleService.updateArticle({ title: 'Updated' }, 'test', 1);

      expect(articleMapper).toHaveBeenCalledTimes(5);
      expect(articleMapper).toHaveBeenCalledWith(expect.objectContaining({ body: expect.any(String) }), 1);
    });
  });
});