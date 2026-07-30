import prismaMock from '../prisma-mock';
import {
  deleteComment,
  favoriteArticle,
  unfavoriteArticle,
  getArticle,
  getArticles,
  getFeed,
} from '../../app/routes/article/article.service';

describe('ArticleService', () => {
  describe('deleteComment', () => {
    test('should throw an error ', () => {
      // Given
      const id = 123;
      const idUser = 456;

      // When
      // @ts-ignore
      prismaMock.comment.findFirst.mockResolvedValue(null);

      // Then
      expect(deleteComment(id, idUser)).rejects.toThrowError();
    });
  });

  describe('favoriteArticle', () => {
    test('should return the favorited article', async () => {
      // Given
      const slug = 'How-to-train-your-dragon';
      const username = 'RealWorld';

      const mockedUserResponse = {
        id: 123,
        username: 'RealWorld',
        email: 'realworld@me',
        password: '1234',
        bio: null,
        image: null,
        token: '',
        demo: false,
      };

      const mockedArticleResponse = {
        id: 123,
        slug: 'How-to-train-your-dragon',
        title: 'How to train your dragon',
        description: 'Ever wonder how?',
        body: 'It takes a Jacobian',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'RealWorld',
          bio: null,
          image: null,
          followedBy: [],
        },
        _count: {
          favoritedBy: 0,
        },
      };

      // When
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue(mockedUserResponse);
      // @ts-ignore
      prismaMock.article.update.mockResolvedValue(mockedArticleResponse);

      // Then
      const result = await favoriteArticle(slug, mockedUserResponse.id);
      expect(result).toHaveProperty('favoritesCount');
      expect(result).toHaveProperty('readingTime');
    });

    test('should throw an error if no user is found', async () => {
      // Given
      const id = 123;
      const slug = 'how-to-train-your-dragon';
      const username = 'RealWorld';

      // When
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Then
      await expect(favoriteArticle(slug, id)).rejects.toThrowError();
    });
  });

  describe('unfavoriteArticle', () => {
    test('should return the unfavorited article', async () => {
      // Given
      const slug = 'How-to-train-your-dragon';
      const username = 'RealWorld';

      const mockedUserResponse = {
        id: 123,
        username: 'RealWorld',
        email: 'realworld@me',
        password: '1234',
        bio: null,
        image: null,
        token: '',
        demo: false,
      };

      const mockedArticleResponse = {
        id: 123,
        slug: 'How-to-train-your-dragon',
        title: 'How to train your dragon',
        description: 'Ever wonder how?',
        body: 'It takes a Jacobian',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'RealWorld',
          bio: null,
          image: null,
          followedBy: [],
        },
        _count: {
          favoritedBy: 0,
        },
      };

      // When
      prismaMock.user.findUnique.mockResolvedValue(mockedUserResponse);
      prismaMock.article.update.mockResolvedValue(mockedArticleResponse);

      // Then
      const result = await unfavoriteArticle(slug, mockedUserResponse.id);
      expect(result).toHaveProperty('favoritesCount');
      expect(result).toHaveProperty('readingTime');
    });

    test('should throw an error if no user is found', async () => {
      // Given
      const id = 123;
      const slug = 'how-to-train-your-dragon';
      const username = 'RealWorld';

      // When
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Then
      await expect(unfavoriteArticle(slug, id)).rejects.toThrowError();
    });
  });

  describe('Reading Time Calculation', () => {
    test('should include readingTime field in article response from getArticle', async () => {
      // Given
      const slug = 'test-article-200-words';
      const userId = 123;
      const body200Words = Array(200).fill('word').join(' ');

      const mockedArticle = {
        id: 1,
        slug: slug,
        title: 'Test Article',
        description: 'Test description',
        body: body200Words,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestAuthor',
          bio: null,
          image: null,
          followedBy: [],
        },
        _count: {
          favoritedBy: 0,
        },
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should calculate readingTime correctly for articles with 500 words', async () => {
      // Given
      const slug = 'test-article-500-words';
      const userId = 123;
      const body500Words = Array(500).fill('word').join(' ');

      const mockedArticle = {
        id: 2,
        slug: slug,
        title: 'Test Article 500',
        description: 'Test description',
        body: body500Words,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestAuthor',
          bio: null,
          image: null,
          followedBy: [],
        },
        _count: {
          favoritedBy: 0,
        },
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(3);
    });

    test('should return minimum readingTime of 1 for empty or short articles', async () => {
      // Given
      const slug = 'test-article-empty';
      const userId = 123;

      const mockedArticle = {
        id: 3,
        slug: slug,
        title: 'Empty Article',
        description: 'Test description',
        body: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestAuthor',
          bio: null,
          image: null,
          followedBy: [],
        },
        _count: {
          favoritedBy: 0,
        },
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should include readingTime in getArticles list response', async () => {
      // Given
      const userId = 123;
      const query = {};
      const body100Words = Array(100).fill('word').join(' ');
      const body300Words = Array(300).fill('word').join(' ');

      const mockedArticles = [
        {
          id: 1,
          slug: 'article-1',
          title: 'Article 1',
          description: 'Description 1',
          body: body100Words,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'Author1',
            bio: null,
            image: null,
            followedBy: [],
          },
          _count: {
            favoritedBy: 0,
          },
        },
        {
          id: 2,
          slug: 'article-2',
          title: 'Article 2',
          description: 'Description 2',
          body: body300Words,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 457,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'Author2',
            bio: null,
            image: null,
            followedBy: [],
          },
          _count: {
            favoritedBy: 0,
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(2);
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedArticles);

      const result = await getArticles(query, userId);

      // Then
      expect(result.articles).toHaveLength(2);
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(result.articles[1]).toHaveProperty('readingTime');
      expect(result.articles[0].readingTime).toBe(1);
      expect(result.articles[1].readingTime).toBe(2);
    });

    test('should include readingTime in getFeed response', async () => {
      // Given
      const userId = 123;
      const offset = 0;
      const limit = 10;
      const body250Words = Array(250).fill('word').join(' ');
      const body400Words = Array(400).fill('word').join(' ');

      const mockedFeedArticles = [
        {
          id: 1,
          slug: 'feed-article-1',
          title: 'Feed Article 1',
          description: 'Feed Description 1',
          body: body250Words,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'FeedAuthor1',
            bio: null,
            image: null,
            followedBy: [{ id: userId }],
          },
          _count: {
            favoritedBy: 0,
          },
        },
        {
          id: 2,
          slug: 'feed-article-2',
          title: 'Feed Article 2',
          description: 'Feed Description 2',
          body: body400Words,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 457,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'FeedAuthor2',
            bio: null,
            image: null,
            followedBy: [{ id: userId }],
          },
          _count: {
            favoritedBy: 0,
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(2);
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedFeedArticles);

      const result = await getFeed(offset, limit, userId);

      // Then
      expect(result.articles).toHaveLength(2);
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(result.articles[1]).toHaveProperty('readingTime');
      expect(result.articles[0].readingTime).toBe(2);
      expect(result.articles[1].readingTime).toBe(2);
    });

    test('should handle null body and return minimum readingTime', async () => {
      // Given
      const slug = 'test-article-null-body';
      const userId = 123;

      const mockedArticle = {
        id: 4,
        slug: slug,
        title: 'Null Body Article',
        description: 'Test description',
        body: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestAuthor',
          bio: null,
          image: null,
          followedBy: [],
        },
        _count: {
          favoritedBy: 0,
        },
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should handle whitespace-only body and return minimum readingTime', async () => {
      // Given
      const slug = 'test-article-whitespace';
      const userId = 123;

      const mockedArticle = {
        id: 5,
        slug: slug,
        title: 'Whitespace Article',
        description: 'Test description',
        body: '   \n\t   ',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestAuthor',
          bio: null,
          image: null,
          followedBy: [],
        },
        _count: {
          favoritedBy: 0,
        },
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should calculate readingTime correctly for boundary case of exactly 200 words', async () => {
      // Given
      const slug = 'test-article-exactly-200';
      const userId = 123;
      const bodyExactly200Words = Array(200).fill('word').join(' ');

      const mockedArticle = {
        id: 6,
        slug: slug,
        title: 'Exactly 200 Words',
        description: 'Test description',
        body: bodyExactly200Words,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestAuthor',
          bio: null,
          image: null,
          followedBy: [],
        },
        _count: {
          favoritedBy: 0,
        },
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should calculate readingTime correctly for 201 words (boundary)', async () => {
      // Given
      const slug = 'test-article-201-words';
      const userId = 123;
      const body201Words = Array(201).fill('word').join(' ');

      const mockedArticle = {
        id: 7,
        slug: slug,
        title: '201 Words Article',
        description: 'Test description',
        body: body201Words,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestAuthor',
          bio: null,
          image: null,
          followedBy: [],
        },
        _count: {
          favoritedBy: 0,
        },
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(2);
    });

    test('should handle articles with special characters and multiple spaces', async () => {
      // Given
      const slug = 'test-article-special-chars';
      const userId = 123;
      const bodyWithSpecialChars = 'word1   word2\n\nword3\tword4    word5';

      const mockedArticle = {
        id: 8,
        slug: slug,
        title: 'Special Characters Article',
        description: 'Test description',
        body: bodyWithSpecialChars,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestAuthor',
          bio: null,
          image: null,
          followedBy: [],
        },
        _count: {
          favoritedBy: 0,
        },
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });
  });
});