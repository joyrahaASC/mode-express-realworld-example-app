import * as articleService from './article.service';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';
import articleMapper from './article.mapper';
import profileMapper from '../profile/profile.utils';

jest.mock('../../../prisma/prisma-client', () => ({
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
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('./article.mapper');
jest.mock('../profile/profile.utils');

describe('Article Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getArticles', () => {
    it('should return articles with articleMapper applied to each article', async () => {
      const mockQuery = { offset: 0, limit: 10 };
      const mockId = 1;
      const mockArticles = [
        {
          id: 1,
          title: 'Test Article',
          body: 'This is a test article body with some content',
          tagList: [{ name: 'test' }],
          author: { username: 'testuser', bio: 'bio', image: 'image.jpg', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticles[0], readingTime: 1 });

      const result = await articleService.getArticles(mockQuery, mockId);

      expect(prisma.article.count).toHaveBeenCalled();
      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          include: expect.objectContaining({
            tagList: { select: { name: true } },
            author: expect.any(Object),
            favoritedBy: true,
            _count: { select: { favoritedBy: true } },
          }),
        })
      );
      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], mockId);
      expect(result.articles).toHaveLength(1);
      expect(result.articlesCount).toBe(1);
    });

    it('should return articles with body field included for readingTime calculation', async () => {
      const mockQuery = {};
      const mockArticles = [
        {
          id: 1,
          title: 'Test',
          body: 'Test body content',
          tagList: [],
          author: { username: 'user', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue(mockArticles[0]);

      await articleService.getArticles(mockQuery);

      const findManyCall = (prisma.article.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.include).toBeDefined();
      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'Test body content' }),
        undefined
      );
    });

    it('should handle query filters for author, tag, and favorited', async () => {
      const mockQuery = { author: 'testauthor', tag: 'testtag', favorited: 'testuser' };

      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getArticles(mockQuery);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                author: expect.any(Object),
              }),
              expect.objectContaining({
                tagList: expect.objectContaining({
                  some: { name: 'testtag' },
                }),
              }),
              expect.objectContaining({
                favoritedBy: expect.objectContaining({
                  some: { username: { equals: 'testuser' } },
                }),
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('getFeed', () => {
    it('should return feed articles with articleMapper applied to each article', async () => {
      const mockOffset = 0;
      const mockLimit = 10;
      const mockId = 1;
      const mockArticles = [
        {
          id: 1,
          title: 'Feed Article',
          body: 'This is a feed article with content for reading time',
          tagList: [],
          author: { username: 'author', bio: '', image: '', followedBy: [{ id: 1 }] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticles[0], readingTime: 1 });

      const result = await articleService.getFeed(mockOffset, mockLimit, mockId);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            author: {
              followedBy: { some: { id: mockId } },
            },
          },
          include: expect.objectContaining({
            tagList: { select: { name: true } },
            author: expect.any(Object),
            favoritedBy: true,
            _count: { select: { favoritedBy: true } },
          }),
        })
      );
      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], mockId);
      expect(result.articles).toHaveLength(1);
    });

    it('should return feed articles with body field for readingTime calculation', async () => {
      const mockArticles = [
        {
          id: 1,
          body: 'Feed body content',
          tagList: [],
          author: { username: 'user', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue(mockArticles[0]);

      await articleService.getFeed(0, 10, 1);

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'Feed body content' }),
        1
      );
    });
  });

  describe('getArticle', () => {
    it('should return single article with articleMapper applied', async () => {
      const mockSlug = 'test-article-1';
      const mockId = 1;
      const mockArticle = {
        id: 1,
        slug: mockSlug,
        title: 'Test Article',
        body: 'Article body content for reading time calculation',
        tagList: [],
        author: { username: 'author', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockArticle, readingTime: 1 });

      const result = await articleService.getArticle(mockSlug, mockId);

      expect(prisma.article.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: mockSlug },
          include: expect.objectContaining({
            tagList: { select: { name: true } },
            author: expect.any(Object),
            favoritedBy: true,
            _count: { select: { favoritedBy: true } },
          }),
        })
      );
      expect(articleMapper).toHaveBeenCalledWith(mockArticle, mockId);
    });

    it('should return article with body field for readingTime calculation', async () => {
      const mockArticle = {
        id: 1,
        slug: 'test-1',
        body: 'Single article body content',
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (articleMapper as jest.Mock).mockReturnValue(mockArticle);

      await articleService.getArticle('test-1', 1);

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'Single article body content' }),
        1
      );
    });

    it('should throw 404 error when article not found', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(articleService.getArticle('nonexistent-slug')).rejects.toThrow(HttpException);
      await expect(articleService.getArticle('nonexistent-slug')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('createArticle', () => {
    it('should create article and apply articleMapper to result', async () => {
      const mockArticleData = {
        title: 'New Article',
        description: 'Description',
        body: 'Article body content for reading time',
        tagList: ['tag1', 'tag2'],
      };
      const mockId = 1;
      const mockCreatedArticle = {
        id: 1,
        authorId: mockId,
        ...mockArticleData,
        slug: 'new-article-1',
        tagList: [{ name: 'tag1' }, { name: 'tag2' }],
        author: { username: 'author', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.article.create as jest.Mock).mockResolvedValue(mockCreatedArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockCreatedArticle, readingTime: 1 });

      const result = await articleService.createArticle(mockArticleData, mockId);

      expect(prisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: mockArticleData.title,
            body: mockArticleData.body,
            description: mockArticleData.description,
          }),
          include: expect.objectContaining({
            tagList: { select: { name: true } },
            author: expect.any(Object),
            favoritedBy: true,
            _count: { select: { favoritedBy: true } },
          }),
        })
      );
      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: mockArticleData.body }),
        mockId
      );
    });

    it('should create article with body field for readingTime calculation', async () => {
      const mockArticleData = {
        title: 'Test',
        description: 'Desc',
        body: 'Body content for reading time',
        tagList: [],
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.article.create as jest.Mock).mockResolvedValue({
        id: 1,
        authorId: 1,
        ...mockArticleData,
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      });
      (articleMapper as jest.Mock).mockReturnValue({});

      await articleService.createArticle(mockArticleData, 1);

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'Body content for reading time' }),
        1
      );
    });

    it('should throw 422 error when title is missing', async () => {
      const mockArticleData = { description: 'Desc', body: 'Body' };

      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toMatchObject({
        statusCode: 422,
        errors: { title: ["can't be blank"] },
      });
    });

    it('should throw 422 error when description is missing', async () => {
      const mockArticleData = { title: 'Title', body: 'Body' };

      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toMatchObject({
        statusCode: 422,
        errors: { description: ["can't be blank"] },
      });
    });

    it('should throw 422 error when body is missing', async () => {
      const mockArticleData = { title: 'Title', description: 'Desc' };

      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toMatchObject({
        statusCode: 422,
        errors: { body: ["can't be blank"] },
      });
    });

    it('should throw 422 error when title is not unique', async () => {
      const mockArticleData = {
        title: 'Existing Title',
        description: 'Desc',
        body: 'Body',
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ slug: 'existing-title-1' });

      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toThrow(
        HttpException
      );
      await expect(articleService.createArticle(mockArticleData, 1)).rejects.toMatchObject({
        statusCode: 422,
        errors: { title: ['must be unique'] },
      });
    });
  });

  describe('updateArticle', () => {
    it('should update article and apply articleMapper to result', async () => {
      const mockSlug = 'test-article-1';
      const mockId = 1;
      const mockUpdateData = {
        title: 'Updated Title',
        body: 'Updated body content for reading time',
        description: 'Updated description',
      };
      const mockExistingArticle = {
        author: { id: mockId, username: 'author' },
      };
      const mockUpdatedArticle = {
        id: 1,
        slug: 'updated-title-1',
        ...mockUpdateData,
        tagList: [],
        author: { username: 'author', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce(mockExistingArticle);
      (prisma.article.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (prisma.article.update as jest.Mock)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(mockUpdatedArticle);
      (articleMapper as jest.Mock).mockReturnValue({ ...mockUpdatedArticle, readingTime: 1 });

      const result = await articleService.updateArticle(mockUpdateData, mockSlug, mockId);

      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: mockSlug },
          include: expect.objectContaining({
            tagList: { select: { name: true } },
            author: expect.any(Object),
            favoritedBy: true,
            _count: { select: { favoritedBy: true } },
          }),
        })
      );
      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: mockUpdateData.body }),
        mockId
      );
    });

    it('should update article with body field for readingTime calculation', async () => {
      const mockUpdateData = { body: 'Updated body for reading time' };
      const mockExistingArticle = { author: { id: 1, username: 'user' } };
      const mockUpdatedArticle = {
        id: 1,
        body: 'Updated body for reading time',
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);
      (prisma.article.update as jest.Mock)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(mockUpdatedArticle);
      (articleMapper as jest.Mock).mockReturnValue(mockUpdatedArticle);

      await articleService.updateArticle(mockUpdateData, 'test-1', 1);

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'Updated body for reading time' }),
        1
      );
    });

    it('should throw 404 error when article not found', async () => {
      (prisma.article.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        articleService.updateArticle({ title: 'New' }, 'nonexistent', 1)
      ).rejects.toThrow(HttpException);
      await expect(
        articleService.updateArticle({ title: 'New' }, 'nonexistent', 1)
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 403 error when user is not authorized', async () => {
      const mockExistingArticle = { author: { id: 2, username: 'other' } };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);

      await expect(articleService.updateArticle({ title: 'New' }, 'test-1', 1)).rejects.toThrow(
        HttpException
      );
      await expect(
        articleService.updateArticle({ title: 'New' }, 'test-1', 1)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'You are not authorized to update this article',
      });
    });

    it('should throw 422 error when new title is not unique', async () => {
      const mockExistingArticle = { author: { id: 1, username: 'user' } };

      (prisma.article.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockExistingArticle)
        .mockResolvedValueOnce({ slug: 'new-title-1' });

      await expect(
        articleService.updateArticle({ title: 'New Title' }, 'old-slug-1', 1)
      ).rejects.toThrow(HttpException);
      await expect(
        articleService.updateArticle({ title: 'New Title' }, 'old-slug-1', 1)
      ).rejects.toMatchObject({
        statusCode: 422,
        errors: { title: ['must be unique'] },
      });
    });
  });

  describe('deleteArticle', () => {
    it('should delete article when user is authorized', async () => {
      const mockSlug = 'test-article-1';
      const mockId = 1;
      const mockExistingArticle = {
        author: { id: mockId, username: 'author' },
      };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);
      (prisma.article.delete as jest.Mock).mockResolvedValue({});

      await articleService.deleteArticle(mockSlug, mockId);

      expect(prisma.article.delete).toHaveBeenCalledWith({
        where: { slug: mockSlug },
      });
    });

    it('should throw 404 error when article not found', async () => {
      (prisma.article.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(articleService.deleteArticle('nonexistent', 1)).rejects.toThrow(HttpException);
      await expect(articleService.deleteArticle('nonexistent', 1)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 403 error when user is not authorized', async () => {
      const mockExistingArticle = { author: { id: 2, username: 'other' } };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);

      await expect(articleService.deleteArticle('test-1', 1)).rejects.toThrow(HttpException);
      await expect(articleService.deleteArticle('test-1', 1)).rejects.toMatchObject({
        statusCode: 403,
        message: 'You are not authorized to delete this article',
      });
    });
  });

  describe('getCommentsByArticle', () => {
    it('should return comments for an article', async () => {
      const mockSlug = 'test-article-1';
      const mockId = 1;
      const mockComments = {
        comments: [
          {
            id: 1,
            body: 'Test comment',
            createdAt: new Date(),
            updatedAt: new Date(),
            author: {
              username: 'commenter',
              bio: 'bio',
              image: 'image.jpg',
              followedBy: [{ id: mockId }],
            },
          },
        ],
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockComments);

      const result = await articleService.getCommentsByArticle(mockSlug, mockId);

      expect(prisma.article.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: mockSlug },
          include: expect.objectContaining({
            comments: expect.any(Object),
          }),
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0].author.following).toBe(true);
    });
  });

  describe('addComment', () => {
    it('should add comment to article', async () => {
      const mockBody = 'Test comment body';
      const mockSlug = 'test-article-1';
      const mockId = 1;
      const mockArticle = { id: 1 };
      const mockComment = {
        id: 1,
        body: mockBody,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'commenter',
          bio: 'bio',
          image: 'image.jpg',
          followedBy: [],
        },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

      const result = await articleService.addComment(mockBody, mockSlug, mockId);

      expect(prisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            body: mockBody,
          }),
        })
      );
      expect(result.body).toBe(mockBody);
    });

    it('should throw 422 error when body is missing', async () => {
      await expect(articleService.addComment('', 'test-1', 1)).rejects.toThrow(HttpException);
      await expect(articleService.addComment('', 'test-1', 1)).rejects.toMatchObject({
        statusCode: 422,
        errors: { body: ["can't be blank"] },
      });
    });
  });

  describe('deleteComment', () => {
    it('should delete comment when user is authorized', async () => {
      const mockCommentId = 1;
      const mockUserId = 1;
      const mockComment = {
        author: { id: mockUserId, username: 'user' },
      };

      (prisma.comment.findFirst as jest.Mock).mockResolvedValue(mockComment);
      (prisma.comment.delete as jest.Mock).mockResolvedValue({});

      await articleService.deleteComment(mockCommentId, mockUserId);

      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: mockCommentId },
      });
    });

    it('should throw 404 error when comment not found', async () => {
      (prisma.comment.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(articleService.deleteComment(999, 1)).rejects.toThrow(HttpException);
      await expect(articleService.deleteComment(999, 1)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 403 error when user is not authorized', async () => {
      const mockComment = { author: { id: 2, username: 'other' } };

      (prisma.comment.findFirst as jest.Mock).mockResolvedValue(mockComment);

      await expect(articleService.deleteComment(1, 1)).rejects.toThrow(HttpException);
      await expect(articleService.deleteComment(1, 1)).rejects.toMatchObject({
        statusCode: 403,
        message: 'You are not authorized to delete this comment',
      });
    });
  });

  describe('favoriteArticle', () => {
    it('should favorite an article', async () => {
      const mockSlug = 'test-article-1';
      const mockId = 1;
      const mockArticle = {
        id: 1,
        slug: mockSlug,
        title: 'Test',
        body: 'Body',
        tagList: [{ name: 'tag1' }],
        author: { username: 'author', bio: '', image: '', followedBy: [] },
        favoritedBy: [{ id: mockId }],
        _count: { favoritedBy: 1 },
      };

      (prisma.article.update as jest.Mock).mockResolvedValue(mockArticle);
      (profileMapper as jest.Mock).mockReturnValue(mockArticle.author);

      const result = await articleService.favoriteArticle(mockSlug, mockId);

      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: mockSlug },
          data: {
            favoritedBy: {
              connect: { id: mockId },
            },
          },
        })
      );
      expect(result.favorited).toBe(true);
      expect(result.favoritesCount).toBe(1);
    });
  });

  describe('unfavoriteArticle', () => {
    it('should unfavorite an article', async () => {
      const mockSlug = 'test-article-1';
      const mockId = 1;
      const mockArticle = {
        id: 1,
        slug: mockSlug,
        title: 'Test',
        body: 'Body',
        tagList: [{ name: 'tag1' }],
        author: { username: 'author', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.update as jest.Mock).mockResolvedValue(mockArticle);
      (profileMapper as jest.Mock).mockReturnValue(mockArticle.author);

      const result = await articleService.unfavoriteArticle(mockSlug, mockId);

      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: mockSlug },
          data: {
            favoritedBy: {
              disconnect: { id: mockId },
            },
          },
        })
      );
      expect(result.favorited).toBe(false);
      expect(result.favoritesCount).toBe(0);
    });
  });

  describe('Verification: articleMapper receives body field', () => {
    it('should verify getArticles passes article with body to articleMapper', async () => {
      const mockArticles = [
        {
          id: 1,
          body: 'Test body for reading time',
          tagList: [],
          author: { username: 'user', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue({});

      await articleService.getArticles({});

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.any(String) }),
        undefined
      );
    });

    it('should verify getFeed passes article with body to articleMapper', async () => {
      const mockArticles = [
        {
          id: 1,
          body: 'Feed body content',
          tagList: [],
          author: { username: 'user', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockReturnValue({});

      await articleService.getFeed(0, 10, 1);

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.any(String) }),
        1
      );
    });

    it('should verify getArticle passes article with body to articleMapper', async () => {
      const mockArticle = {
        id: 1,
        body: 'Single article body',
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (articleMapper as jest.Mock).mockReturnValue({});

      await articleService.getArticle('test-1', 1);

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.any(String) }),
        1
      );
    });

    it('should verify createArticle passes article with body to articleMapper', async () => {
      const mockArticleData = {
        title: 'Test',
        description: 'Desc',
        body: 'Created article body',
        tagList: [],
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.article.create as jest.Mock).mockResolvedValue({
        id: 1,
        authorId: 1,
        ...mockArticleData,
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      });
      (articleMapper as jest.Mock).mockReturnValue({});

      await articleService.createArticle(mockArticleData, 1);

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.any(String) }),
        1
      );
    });

    it('should verify updateArticle passes article with body to articleMapper', async () => {
      const mockExistingArticle = { author: { id: 1, username: 'user' } };
      const mockUpdatedArticle = {
        id: 1,
        body: 'Updated article body',
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);
      (prisma.article.update as jest.Mock)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(mockUpdatedArticle);
      (articleMapper as jest.Mock).mockReturnValue({});

      await articleService.updateArticle({ body: 'Updated article body' }, 'test-1', 1);

      expect(articleMapper).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.any(String) }),
        1
      );
    });
  });

  describe('Prisma query verification for body field', () => {
    it('should verify getArticles Prisma query does not exclude body field', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getArticles({});

      const findManyCall = (prisma.article.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.select).toBeUndefined();
      expect(findManyCall.include).toBeDefined();
    });

    it('should verify getFeed Prisma query does not exclude body field', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await articleService.getFeed(0, 10, 1);

      const findManyCall = (prisma.article.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.select).toBeUndefined();
      expect(findManyCall.include).toBeDefined();
    });

    it('should verify getArticle Prisma query does not exclude body field', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        body: 'test',
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      });
      (articleMapper as jest.Mock).mockReturnValue({});

      await articleService.getArticle('test-1');

      const findUniqueCall = (prisma.article.findUnique as jest.Mock).mock.calls[0][0];
      expect(findUniqueCall.select).toBeUndefined();
      expect(findUniqueCall.include).toBeDefined();
    });

    it('should verify createArticle Prisma query includes body field in data', async () => {
      const mockArticleData = {
        title: 'Test',
        description: 'Desc',
        body: 'Body content',
        tagList: [],
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.article.create as jest.Mock).mockResolvedValue({
        id: 1,
        authorId: 1,
        ...mockArticleData,
        tagList: [],
        author: { username: 'user', bio: '', image: '', followedBy: [] },
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      });
      (articleMapper as jest.Mock).mockReturnValue({});

      await articleService.createArticle(mockArticleData, 1);

      const createCall = (prisma.article.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.body).toBe('Body content');
      expect(createCall.select).toBeUndefined();
      expect(createCall.include).toBeDefined();
    });

    it('should verify updateArticle Prisma query includes body field when updated', async () => {
      const mockExistingArticle = { author: { id: 1, username: 'user' } };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockExistingArticle);
      (prisma.article.update as jest.Mock)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          id: 1,
          body: 'Updated body',
          tagList: [],
          author: { username: 'user', bio: '', image: '', followedBy: [] },
          favoritedBy: [],
          _count: { favoritedBy: 0 },
        });
      (articleMapper as jest.Mock).mockReturnValue({});

      await articleService.updateArticle({ body: 'Updated body' }, 'test-1', 1);

      const updateCalls = (prisma.article.update as jest.Mock).mock.calls;
      const finalUpdateCall = updateCalls[updateCalls.length - 1][0];
      expect(finalUpdateCall.data.body).toBe('Updated body');
      expect(finalUpdateCall.select).toBeUndefined();
      expect(finalUpdateCall.include).toBeDefined();
    });
  });
});