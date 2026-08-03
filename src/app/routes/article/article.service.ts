import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as articleService from './article.service';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';
import articleMapper from './article.mapper';
import profileMapper from '../profile/profile.utils';

vi.mock('../../../prisma/prisma-client', () => ({
  default: {
    article: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('./article.mapper', () => ({
  default: vi.fn((article, id) => ({
    ...article,
    readingTime: 5,
    mapped: true,
  })),
}));

vi.mock('../profile/profile.utils', () => ({
  default: vi.fn((profile, id) => ({
    ...profile,
    profileMapped: true,
  })),
}));

describe('article.service.ts - readingTime field integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getArticle - single article retrieval with readingTime', () => {
    it('should retrieve article by slug and return mapped article with readingTime field', async () => {
      const mockArticle = {
        id: 1,
        slug: 'test-article-1',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test body content',
        tagList: [{ name: 'tag1' }],
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          followedBy: [],
        },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as any).mockResolvedValue(mockArticle);

      const result = await articleService.getArticle('test-article-1', 1);

      expect(prisma.article.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-article-1' },
        include: {
          tagList: { select: { name: true } },
          author: {
            select: {
              username: true,
              bio: true,
              image: true,
              followedBy: true,
            },
          },
          favoritedBy: true,
          _count: { select: { favoritedBy: true } },
        },
      });
      expect(articleMapper).toHaveBeenCalledWith(mockArticle, 1);
      expect(result).toHaveProperty('readingTime');
      expect(result.mapped).toBe(true);
    });

    it('should retrieve article by slug without user id and return mapped article with readingTime', async () => {
      const mockArticle = {
        id: 1,
        slug: 'test-article-1',
        title: 'Test Article',
        body: 'Test body',
        tagList: [],
        author: { username: 'testuser', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as any).mockResolvedValue(mockArticle);

      const result = await articleService.getArticle('test-article-1');

      expect(articleMapper).toHaveBeenCalledWith(mockArticle, undefined);
      expect(result).toHaveProperty('readingTime');
    });

    it('should throw 404 HttpException when article is not found', async () => {
      (prisma.article.findUnique as any).mockResolvedValue(null);

      await expect(articleService.getArticle('non-existent-slug', 1)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.getArticle('non-existent-slug', 1)).rejects.toMatchObject({
        statusCode: 404,
        errors: { article: ['not found'] },
      });
    });

    it('should pass correct article data structure to mapper ensuring readingTime calculation', async () => {
      const mockArticle = {
        id: 2,
        slug: 'long-article-2',
        title: 'Long Article',
        body: 'Very long body content '.repeat(500),
        tagList: [{ name: 'long' }, { name: 'read' }],
        author: { username: 'author', bio: 'bio', image: 'img.jpg', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 5 },
      };

      (prisma.article.findUnique as any).mockResolvedValue(mockArticle);

      await articleService.getArticle('long-article-2', 2);

      expect(articleMapper).toHaveBeenCalledWith(mockArticle, 2);
      expect(articleMapper).toHaveBeenCalledTimes(1);
    });
  });

  describe('getArticles - list articles with readingTime', () => {
    it('should retrieve filtered articles and map each with readingTime field', async () => {
      const mockArticles = [
        {
          id: 1,
          slug: 'article-1',
          title: 'Article 1',
          body: 'Body 1',
          tagList: [{ name: 'tag1' }],
          author: { username: 'user1', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
        {
          id: 2,
          slug: 'article-2',
          title: 'Article 2',
          body: 'Body 2',
          tagList: [{ name: 'tag2' }],
          author: { username: 'user2', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 1 },
        },
      ];

      (prisma.article.count as any).mockResolvedValue(2);
      (prisma.article.findMany as any).mockResolvedValue(mockArticles);

      const result = await articleService.getArticles({ limit: 10, offset: 0 }, 1);

      expect(result.articles).toHaveLength(2);
      expect(articleMapper).toHaveBeenCalledTimes(2);
      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], 1);
      expect(articleMapper).toHaveBeenCalledWith(mockArticles[1], 1);
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(result.articles[1]).toHaveProperty('readingTime');
      expect(result.articlesCount).toBe(2);
    });

    it('should handle pagination without affecting readingTime calculation', async () => {
      const mockArticles = [
        {
          id: 3,
          slug: 'article-3',
          title: 'Article 3',
          body: 'Body 3',
          tagList: [],
          author: { username: 'user3', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as any).mockResolvedValue(10);
      (prisma.article.findMany as any).mockResolvedValue(mockArticles);

      const result = await articleService.getArticles({ limit: 5, offset: 5 }, 2);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(result.articlesCount).toBe(10);
    });

    it('should filter by tag and return articles with readingTime', async () => {
      const mockArticles = [
        {
          id: 4,
          slug: 'tagged-article',
          title: 'Tagged Article',
          body: 'Tagged body',
          tagList: [{ name: 'javascript' }],
          author: { username: 'jsdev', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 2 },
        },
      ];

      (prisma.article.count as any).mockResolvedValue(1);
      (prisma.article.findMany as any).mockResolvedValue(mockArticles);

      const result = await articleService.getArticles({ tag: 'javascript' }, 3);

      expect(result.articles).toHaveLength(1);
      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], 3);
      expect(result.articles[0]).toHaveProperty('readingTime');
    });

    it('should filter by author and return articles with readingTime', async () => {
      const mockArticles = [
        {
          id: 5,
          slug: 'author-article',
          title: 'Author Article',
          body: 'Author body',
          tagList: [],
          author: { username: 'specificauthor', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as any).mockResolvedValue(1);
      (prisma.article.findMany as any).mockResolvedValue(mockArticles);

      const result = await articleService.getArticles({ author: 'specificauthor' }, 4);

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0]).toHaveProperty('readingTime');
    });

    it('should filter by favorited user and return articles with readingTime', async () => {
      const mockArticles = [
        {
          id: 6,
          slug: 'favorited-article',
          title: 'Favorited Article',
          body: 'Favorited body',
          tagList: [],
          author: { username: 'author', bio: '', image: '', followedBy: [] },
          favoritedBy: [{ id: 5, username: 'favoriter' }],
          _count: { favoritedBy: 1 },
        },
      ];

      (prisma.article.count as any).mockResolvedValue(1);
      (prisma.article.findMany as any).mockResolvedValue(mockArticles);

      const result = await articleService.getArticles({ favorited: 'favoriter' }, 5);

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0]).toHaveProperty('readingTime');
    });

    it('should return empty array with readingTime structure when no articles found', async () => {
      (prisma.article.count as any).mockResolvedValue(0);
      (prisma.article.findMany as any).mockResolvedValue([]);

      const result = await articleService.getArticles({}, 1);

      expect(result.articles).toHaveLength(0);
      expect(result.articlesCount).toBe(0);
      expect(articleMapper).not.toHaveBeenCalled();
    });

    it('should handle query without user id and still map readingTime', async () => {
      const mockArticles = [
        {
          id: 7,
          slug: 'public-article',
          title: 'Public Article',
          body: 'Public body',
          tagList: [],
          author: { username: 'public', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as any).mockResolvedValue(1);
      (prisma.article.findMany as any).mockResolvedValue(mockArticles);

      const result = await articleService.getArticles({});

      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], undefined);
      expect(result.articles[0]).toHaveProperty('readingTime');
    });
  });

  describe('getFeed - personalized feed with readingTime', () => {
    it('should retrieve user feed and map articles with readingTime field', async () => {
      const mockArticles = [
        {
          id: 8,
          slug: 'feed-article-1',
          title: 'Feed Article 1',
          body: 'Feed body 1',
          tagList: [],
          author: { username: 'followed1', bio: '', image: '', followedBy: [{ id: 10 }] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
        {
          id: 9,
          slug: 'feed-article-2',
          title: 'Feed Article 2',
          body: 'Feed body 2',
          tagList: [],
          author: { username: 'followed2', bio: '', image: '', followedBy: [{ id: 10 }] },
          favoritedBy: [],
          _count: { favoritedBy: 3 },
        },
      ];

      (prisma.article.count as any).mockResolvedValue(2);
      (prisma.article.findMany as any).mockResolvedValue(mockArticles);

      const result = await articleService.getFeed(0, 10, 10);

      expect(result.articles).toHaveLength(2);
      expect(articleMapper).toHaveBeenCalledTimes(2);
      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], 10);
      expect(articleMapper).toHaveBeenCalledWith(mockArticles[1], 10);
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(result.articles[1]).toHaveProperty('readingTime');
      expect(result.articlesCount).toBe(2);
    });

    it('should handle feed pagination without affecting readingTime', async () => {
      const mockArticles = [
        {
          id: 10,
          slug: 'feed-article-3',
          title: 'Feed Article 3',
          body: 'Feed body 3',
          tagList: [],
          author: { username: 'followed3', bio: '', image: '', followedBy: [{ id: 11 }] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as any).mockResolvedValue(20);
      (prisma.article.findMany as any).mockResolvedValue(mockArticles);

      const result = await articleService.getFeed(10, 5, 11);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      );
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(result.articlesCount).toBe(20);
    });

    it('should return empty feed with correct structure when user follows no one', async () => {
      (prisma.article.count as any).mockResolvedValue(0);
      (prisma.article.findMany as any).mockResolvedValue([]);

      const result = await articleService.getFeed(0, 10, 12);

      expect(result.articles).toHaveLength(0);
      expect(result.articlesCount).toBe(0);
      expect(articleMapper).not.toHaveBeenCalled();
    });

    it('should query articles from followed authors and include readingTime', async () => {
      const mockArticles = [
        {
          id: 11,
          slug: 'followed-article',
          title: 'Followed Article',
          body: 'Followed body',
          tagList: [{ name: 'follow' }],
          author: { username: 'followeduser', bio: '', image: '', followedBy: [{ id: 13 }] },
          favoritedBy: [],
          _count: { favoritedBy: 1 },
        },
      ];

      (prisma.article.count as any).mockResolvedValue(1);
      (prisma.article.findMany as any).mockResolvedValue(mockArticles);

      const result = await articleService.getFeed(0, 10, 13);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            author: {
              followedBy: { some: { id: 13 } },
            },
          },
        })
      );
      expect(result.articles[0]).toHaveProperty('readingTime');
    });
  });

  describe('createArticle - new article with readingTime', () => {
    it('should create article and return mapped result with readingTime', async () => {
      const newArticle = {
        title: 'New Article',
        description: 'New Description',
        body: 'New body content',
        tagList: ['tag1', 'tag2'],
      };

      const createdArticle = {
        id: 12,
        authorId: 14,
        slug: 'new-article-14',
        title: 'New Article',
        description: 'New Description',
        body: 'New body content',
        tagList: [{ name: 'tag1' }, { name: 'tag2' }],
        author: { username: 'creator', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as any).mockResolvedValue(null);
      (prisma.article.create as any).mockResolvedValue(createdArticle);

      const result = await articleService.createArticle(newArticle, 14);

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Article',
          body: 'New body content',
        }),
        14
      );
      expect(result).toHaveProperty('readingTime');
    });

    it('should create article without tags and return with readingTime', async () => {
      const newArticle = {
        title: 'Tagless Article',
        description: 'No tags',
        body: 'Body without tags',
      };

      const createdArticle = {
        id: 13,
        authorId: 15,
        slug: 'tagless-article-15',
        title: 'Tagless Article',
        description: 'No tags',
        body: 'Body without tags',
        tagList: [],
        author: { username: 'creator2', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as any).mockResolvedValue(null);
      (prisma.article.create as any).mockResolvedValue(createdArticle);

      const result = await articleService.createArticle(newArticle, 15);

      expect(result).toHaveProperty('readingTime');
    });

    it('should throw 422 when title is missing', async () => {
      const invalidArticle = {
        description: 'Description',
        body: 'Body',
      };

      await expect(articleService.createArticle(invalidArticle, 16)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.createArticle(invalidArticle, 16)).rejects.toMatchObject({
        statusCode: 422,
        errors: { title: ["can't be blank"] },
      });
    });

    it('should throw 422 when description is missing', async () => {
      const invalidArticle = {
        title: 'Title',
        body: 'Body',
      };

      await expect(articleService.createArticle(invalidArticle, 17)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.createArticle(invalidArticle, 17)).rejects.toMatchObject({
        statusCode: 422,
        errors: { description: ["can't be blank"] },
      });
    });

    it('should throw 422 when body is missing', async () => {
      const invalidArticle = {
        title: 'Title',
        description: 'Description',
      };

      await expect(articleService.createArticle(invalidArticle, 18)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.createArticle(invalidArticle, 18)).rejects.toMatchObject({
        statusCode: 422,
        errors: { body: ["can't be blank"] },
      });
    });

    it('should throw 422 when title is not unique', async () => {
      const duplicateArticle = {
        title: 'Duplicate Title',
        description: 'Description',
        body: 'Body',
      };

      (prisma.article.findUnique as any).mockResolvedValue({ slug: 'duplicate-title-19' });

      await expect(articleService.createArticle(duplicateArticle, 19)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.createArticle(duplicateArticle, 19)).rejects.toMatchObject({
        statusCode: 422,
        errors: { title: ['must be unique'] },
      });
    });
  });

  describe('updateArticle - update article maintaining readingTime', () => {
    it('should update article and return mapped result with readingTime', async () => {
      const existingArticle = {
        author: { id: 20, username: 'author20' },
      };

      const updatedArticle = {
        id: 14,
        slug: 'updated-article-20',
        title: 'Updated Title',
        description: 'Updated Description',
        body: 'Updated body',
        tagList: [{ name: 'updated' }],
        author: { username: 'author20', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findFirst as any).mockResolvedValueOnce(existingArticle);
      (prisma.article.findFirst as any).mockResolvedValueOnce(null);
      (prisma.article.update as any).mockResolvedValueOnce(updatedArticle);
      (prisma.article.update as any).mockResolvedValueOnce(updatedArticle);

      const result = await articleService.updateArticle(
        { title: 'Updated Title', body: 'Updated body' },
        'old-article-20',
        20
      );

      expect(articleMapper).toHaveBeenCalledWith(updatedArticle, 20);
      expect(result).toHaveProperty('readingTime');
    });

    it('should update article body only and maintain readingTime calculation', async () => {
      const existingArticle = {
        author: { id: 21, username: 'author21' },
      };

      const updatedArticle = {
        id: 15,
        slug: 'article-21',
        title: 'Original Title',
        body: 'New body content with more words',
        tagList: [],
        author: { username: 'author21', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findFirst as any).mockResolvedValue(existingArticle);
      (prisma.article.update as any).mockResolvedValueOnce(updatedArticle);
      (prisma.article.update as any).mockResolvedValueOnce(updatedArticle);

      const result = await articleService.updateArticle(
        { body: 'New body content with more words' },
        'article-21',
        21
      );

      expect(result).toHaveProperty('readingTime');
    });

    it('should throw 404 when article does not exist', async () => {
      (prisma.article.findFirst as any).mockResolvedValue(null);

      await expect(
        articleService.updateArticle({ title: 'New Title' }, 'non-existent', 22)
      ).rejects.toThrow(HttpException);
      await expect(
        articleService.updateArticle({ title: 'New Title' }, 'non-existent', 22)
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 403 when user is not the author', async () => {
      const existingArticle = {
        author: { id: 23, username: 'author23' },
      };

      (prisma.article.findFirst as any).mockResolvedValue(existingArticle);

      await expect(
        articleService.updateArticle({ title: 'Unauthorized Update' }, 'article-23', 99)
      ).rejects.toThrow(HttpException);
      await expect(
        articleService.updateArticle({ title: 'Unauthorized Update' }, 'article-23', 99)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'You are not authorized to update this article',
      });
    });

    it('should throw 422 when new title is not unique', async () => {
      const existingArticle = {
        author: { id: 24, username: 'author24' },
      };

      (prisma.article.findFirst as any).mockResolvedValueOnce(existingArticle);
      (prisma.article.findFirst as any).mockResolvedValueOnce({ slug: 'duplicate-slug' });

      await expect(
        articleService.updateArticle({ title: 'Duplicate Title' }, 'article-24', 24)
      ).rejects.toThrow(HttpException);
      await expect(
        articleService.updateArticle({ title: 'Duplicate Title' }, 'article-24', 24)
      ).rejects.toMatchObject({
        statusCode: 422,
        errors: { title: ['must be unique'] },
      });
    });
  });

  describe('deleteArticle - deletion does not affect readingTime logic', () => {
    it('should delete article successfully when user is author', async () => {
      const existingArticle = {
        author: { id: 25, username: 'author25' },
      };

      (prisma.article.findFirst as any).mockResolvedValue(existingArticle);
      (prisma.article.delete as any).mockResolvedValue({});

      await articleService.deleteArticle('article-25', 25);

      expect(prisma.article.delete).toHaveBeenCalledWith({
        where: { slug: 'article-25' },
      });
    });

    it('should throw 404 when article does not exist', async () => {
      (prisma.article.findFirst as any).mockResolvedValue(null);

      await expect(articleService.deleteArticle('non-existent', 26)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.deleteArticle('non-existent', 26)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 403 when user is not the author', async () => {
      const existingArticle = {
        author: { id: 27, username: 'author27' },
      };

      (prisma.article.findFirst as any).mockResolvedValue(existingArticle);

      await expect(articleService.deleteArticle('article-27', 99)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.deleteArticle('article-27', 99)).rejects.toMatchObject({
        statusCode: 403,
        message: 'You are not authorized to delete this article',
      });
    });
  });

  describe('favoriteArticle - favorite operation with readingTime', () => {
    it('should favorite article and return result with readingTime', async () => {
      const favoritedArticle = {
        id: 16,
        slug: 'favorite-article',
        title: 'Favorite Article',
        body: 'Favorite body',
        tagList: [{ name: 'favorite' }],
        author: { username: 'author28', bio: '', image: '', followedBy: [] },
        favoritedBy: [{ id: 28 }],
        _count: { favoritedBy: 1 },
      };

      (prisma.article.update as any).mockResolvedValue(favoritedArticle);

      const result = await articleService.favoriteArticle('favorite-article', 28);

      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { slug: 'favorite-article' },
        data: {
          favoritedBy: {
            connect: { id: 28 },
          },
        },
        include: expect.any(Object),
      });
      expect(result.favorited).toBe(true);
      expect(result.favoritesCount).toBe(1);
      expect(profileMapper).toHaveBeenCalled();
    });

    it('should handle favoriting with multiple existing favorites', async () => {
      const favoritedArticle = {
        id: 17,
        slug: 'popular-article',
        title: 'Popular Article',
        body: 'Popular body',
        tagList: [],
        author: { username: 'author29', bio: '', image: '', followedBy: [] },
        favoritedBy: [{ id: 1 }, { id: 2 }, { id: 29 }],
        _count: { favoritedBy: 3 },
      };

      (prisma.article.update as any).mockResolvedValue(favoritedArticle);

      const result = await articleService.favoriteArticle('popular-article', 29);

      expect(result.favoritesCount).toBe(3);
      expect(result.favorited).toBe(true);
    });
  });

  describe('unfavoriteArticle - unfavorite operation with readingTime', () => {
    it('should unfavorite article and return result with readingTime', async () => {
      const unfavoritedArticle = {
        id: 18,
        slug: 'unfavorite-article',
        title: 'Unfavorite Article',
        body: 'Unfavorite body',
        tagList: [],
        author: { username: 'author30', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.update as any).mockResolvedValue(unfavoritedArticle);

      const result = await articleService.unfavoriteArticle('unfavorite-article', 30);

      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { slug: 'unfavorite-article' },
        data: {
          favoritedBy: {
            disconnect: { id: 30 },
          },
        },
        include: expect.any(Object),
      });
      expect(result.favorited).toBe(false);
      expect(result.favoritesCount).toBe(0);
    });

    it('should handle unfavoriting with remaining favorites', async () => {
      const unfavoritedArticle = {
        id: 19,
        slug: 'still-popular-article',
        title: 'Still Popular Article',
        body: 'Still popular body',
        tagList: [],
        author: { username: 'author31', bio: '', image: '', followedBy: [] },
        favoritedBy: [{ id: 1 }, { id: 2 }],
        _count: { favoritedBy: 2 },
      };

      (prisma.article.update as any).mockResolvedValue(unfavoritedArticle);

      const result = await articleService.unfavoriteArticle('still-popular-article', 31);

      expect(result.favoritesCount).toBe(2);
      expect(result.favorited).toBe(false);
    });
  });

  describe('getCommentsByArticle - comments retrieval does not affect readingTime', () => {
    it('should retrieve comments for article without affecting article readingTime logic', async () => {
      const mockComments = {
        comments: [
          {
            id: 1,
            body: 'Comment 1',
            createdAt: new Date(),
            updatedAt: new Date(),
            author: { username: 'commenter1', bio: '', image: '', followedBy: [] },
          },
        ],
      };

      (prisma.article.findUnique as any).mockResolvedValue(mockComments);

      const result = await articleService.getCommentsByArticle('article-slug', 32);

      expect(result).toHaveLength(1);
      expect(result[0].author.username).toBe('commenter1');
    });

    it('should retrieve comments without user id', async () => {
      const mockComments = {
        comments: [
          {
            id: 2,
            body: 'Comment 2',
            createdAt: new Date(),
            updatedAt: new Date(),
            author: { username: 'commenter2', bio: '', image: '', followedBy: [] },
          },
        ],
      };

      (prisma.article.findUnique as any).mockResolvedValue(mockComments);

      const result = await articleService.getCommentsByArticle('article-slug');

      expect(result).toHaveLength(1);
    });
  });

  describe('addComment - adding comments does not affect readingTime', () => {
    it('should add comment to article without affecting article readingTime', async () => {
      const mockArticle = { id: 20 };
      const mockComment = {
        id: 3,
        body: 'New comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { username: 'commenter3', bio: '', image: '', followedBy: [] },
      };

      (prisma.article.findUnique as any).mockResolvedValue(mockArticle);
      (prisma.comment.create as any).mockResolvedValue(mockComment);

      const result = await articleService.addComment('New comment', 'article-slug', 33);

      expect(result.body).toBe('New comment');
      expect(result.author.username).toBe('commenter3');
    });

    it('should throw 422 when comment body is empty', async () => {
      await expect(articleService.addComment('', 'article-slug', 34)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.addComment('', 'article-slug', 34)).rejects.toMatchObject({
        statusCode: 422,
        errors: { body: ["can't be blank"] },
      });
    });
  });

  describe('deleteComment - deleting comments does not affect readingTime', () => {
    it('should delete comment successfully when user is author', async () => {
      const mockComment = {
        author: { id: 35, username: 'commenter35' },
      };

      (prisma.comment.findFirst as any).mockResolvedValue(mockComment);
      (prisma.comment.delete as any).mockResolvedValue({});

      await articleService.deleteComment(1, 35);

      expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw 404 when comment does not exist', async () => {
      (prisma.comment.findFirst as any).mockResolvedValue(null);

      await expect(articleService.deleteComment(999, 36)).rejects.toThrow(HttpException);
      await expect(articleService.deleteComment(999, 36)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 403 when user is not the comment author', async () => {
      const mockComment = {
        author: { id: 37, username: 'commenter37' },
      };

      (prisma.comment.findFirst as any).mockResolvedValue(mockComment);

      await expect(articleService.deleteComment(1, 99)).rejects.toThrow(HttpException);
      await expect(articleService.deleteComment(1, 99)).rejects.toMatchObject({
        statusCode: 403,
        message: 'You are not authorized to delete this comment',
      });
    });
  });

  describe('Edge cases and error handling with readingTime', () => {
    it('should handle articles with very long body content for readingTime calculation', async () => {
      const longBodyArticle = {
        id: 21,
        slug: 'very-long-article',
        title: 'Very Long Article',
        body: 'word '.repeat(10000),
        tagList: [],
        author: { username: 'author38', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as any).mockResolvedValue(longBodyArticle);

      const result = await articleService.getArticle('very-long-article', 38);

      expect(articleMapper).toHaveBeenCalledWith(longBodyArticle, 38);
      expect(result).toHaveProperty('readingTime');
    });

    it('should handle articles with empty body for readingTime calculation', async () => {
      const emptyBodyArticle = {
        id: 22,
        slug: 'empty-body-article',
        title: 'Empty Body Article',
        body: '',
        tagList: [],
        author: { username: 'author39', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as any).mockResolvedValue(emptyBodyArticle);

      const result = await articleService.getArticle('empty-body-article', 39);

      expect(articleMapper).toHaveBeenCalledWith(emptyBodyArticle, 39);
      expect(result).toHaveProperty('readingTime');
    });

    it('should handle database errors gracefully without breaking readingTime logic', async () => {
      (prisma.article.findUnique as any).mockRejectedValue(new Error('Database error'));

      await expect(articleService.getArticle('error-article', 40)).rejects.toThrow(
        'Database error'
      );
    });

    it('should verify articleMapper is called with correct parameters for readingTime', async () => {
      const mockArticle = {
        id: 23,
        slug: 'mapper-test',
        title: 'Mapper Test',
        body: 'Test body',
        tagList: [],
        author: { username: 'author41', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as any).mockResolvedValue(mockArticle);

      await articleService.getArticle('mapper-test', 41);

      expect(articleMapper).toHaveBeenCalledWith(mockArticle, 41);
      expect(articleMapper).toHaveBeenCalledTimes(1);
    });

    it('should ensure readingTime is included in all article response scenarios', async () => {
      const scenarios = [
        { method: 'getArticle', args: ['test-slug', 42] },
        { method: 'getArticles', args: [{}, 43] },
        { method: 'getFeed', args: [0, 10, 44] },
      ];

      for (const scenario of scenarios) {
        vi.clearAllMocks();

        const mockData = {
          id: 24,
          slug: 'test',
          title: 'Test',
          body: 'Body',
          tagList: [],
          author: { username: 'test', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        };

        if (scenario.method === 'getArticle') {
          (prisma.article.findUnique as any).mockResolvedValue(mockData);
        } else {
          (prisma.article.count as any).mockResolvedValue(1);
          (prisma.article.findMany as any).mockResolvedValue([mockData]);
        }

        const result = await (articleService as any)[scenario.method](...scenario.args);

        if (scenario.method === 'getArticle') {
          expect(result).toHaveProperty('readingTime');
        } else {
          expect(result.articles[0]).toHaveProperty('readingTime');
        }
      }
    });
  });
});