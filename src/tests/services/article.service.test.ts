import prismaMock from '../prisma-mock';
import {
  deleteComment,
  favoriteArticle,
  unfavoriteArticle,
  findArticleBySlug,
  findArticles,
  getFeedArticles,
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
        description: '',
        body: '',
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
      expect(typeof result.readingTime).toBe('number');
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
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
        description: '',
        body: '',
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
      };

      // When
      prismaMock.user.findUnique.mockResolvedValue(mockedUserResponse);
      prismaMock.article.update.mockResolvedValue(mockedArticleResponse);

      // Then
      const result = await unfavoriteArticle(slug, mockedUserResponse.id);
      expect(result).toHaveProperty('favoritesCount');
      expect(result).toHaveProperty('readingTime');
      expect(typeof result.readingTime).toBe('number');
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
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

  describe('Article readingTime calculation', () => {
    test('should include readingTime in article response', async () => {
      // Given
      const bodyWith200Words = Array(200).fill('word').join(' ');
      const mockedArticle = {
        id: 1,
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: bodyWith200Words,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 123,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestUser',
          bio: null,
          image: null,
          followedBy: [],
        },
      };

      // When
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);
      const result = await findArticleBySlug('test-article', 123);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
      expect(typeof result.readingTime).toBe('number');
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
    });

    test('should calculate readingTime correctly for long articles', async () => {
      // Given
      const bodyWith1000Words = Array(1000).fill('word').join(' ');
      const mockedArticle = {
        id: 2,
        slug: 'long-article',
        title: 'Long Article',
        description: 'Long description',
        body: bodyWith1000Words,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 123,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestUser',
          bio: null,
          image: null,
          followedBy: [],
        },
      };

      // When
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);
      const result = await findArticleBySlug('long-article', 123);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(5);
      expect(typeof result.readingTime).toBe('number');
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
    });

    test('should return minimum 1 minute for short articles', async () => {
      // Given
      const bodyWith50Words = Array(50).fill('word').join(' ');
      const mockedArticle = {
        id: 3,
        slug: 'short-article',
        title: 'Short Article',
        description: 'Short description',
        body: bodyWith50Words,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 123,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestUser',
          bio: null,
          image: null,
          followedBy: [],
        },
      };

      // When
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);
      const result = await findArticleBySlug('short-article', 123);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
      expect(typeof result.readingTime).toBe('number');
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
    });

    test('should return 1 minute for empty body', async () => {
      // Given
      const mockedArticle = {
        id: 4,
        slug: 'empty-article',
        title: 'Empty Article',
        description: 'Empty description',
        body: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 123,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestUser',
          bio: null,
          image: null,
          followedBy: [],
        },
      };

      // When
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);
      const result = await findArticleBySlug('empty-article', 123);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
      expect(typeof result.readingTime).toBe('number');
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
    });

    test('should return 1 minute for null or undefined body', async () => {
      // Given
      const mockedArticleWithNull = {
        id: 5,
        slug: 'null-article',
        title: 'Null Article',
        description: 'Null description',
        body: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 123,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestUser',
          bio: null,
          image: null,
          followedBy: [],
        },
      };

      // When
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleWithNull);
      const result = await findArticleBySlug('null-article', 123);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
      expect(typeof result.readingTime).toBe('number');
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
    });

    test('should round up partial minutes', async () => {
      // Given
      const bodyWith250Words = Array(250).fill('word').join(' ');
      const mockedArticle = {
        id: 6,
        slug: 'partial-article',
        title: 'Partial Article',
        description: 'Partial description',
        body: bodyWith250Words,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 123,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'TestUser',
          bio: null,
          image: null,
          followedBy: [],
        },
      };

      // When
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle);
      const result = await findArticleBySlug('partial-article', 123);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(2);
      expect(typeof result.readingTime).toBe('number');
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
    });
  });

  describe('findArticles', () => {
    test('should return articles with readingTime property', async () => {
      // Given
      const mockedArticles = [
        {
          id: 1,
          slug: 'article-1',
          title: 'Article 1',
          description: 'Description 1',
          body: Array(300).fill('word').join(' '),
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 123,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'TestUser',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      prismaMock.article.findMany.mockResolvedValue(mockedArticles);
      prismaMock.article.count.mockResolvedValue(1);
      const result = await findArticles({}, 123);

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBeGreaterThan(0);
      result.articles.forEach((article: any) => {
        expect(article).toHaveProperty('readingTime');
        expect(typeof article.readingTime).toBe('number');
        expect(article.readingTime).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('getFeedArticles', () => {
    test('should return feed articles with readingTime property', async () => {
      // Given
      const mockedUser = {
        id: 123,
        username: 'TestUser',
        email: 'test@example.com',
        password: 'password',
        bio: null,
        image: null,
        token: '',
        demo: false,
        following: [
          {
            id: 456,
            username: 'Author',
            email: 'author@example.com',
            password: 'password',
            bio: null,
            image: null,
            token: '',
            demo: false,
          },
        ],
      };

      const mockedArticles = [
        {
          id: 1,
          slug: 'feed-article-1',
          title: 'Feed Article 1',
          description: 'Feed Description 1',
          body: Array(400).fill('word').join(' '),
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'Author',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      prismaMock.user.findUnique.mockResolvedValue(mockedUser);
      prismaMock.article.findMany.mockResolvedValue(mockedArticles);
      prismaMock.article.count.mockResolvedValue(1);
      const result = await getFeedArticles(123, {});

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBeGreaterThan(0);
      result.articles.forEach((article: any) => {
        expect(article).toHaveProperty('readingTime');
        expect(typeof article.readingTime).toBe('number');
        expect(article.readingTime).toBeGreaterThanOrEqual(1);
      });
    });
  });
});