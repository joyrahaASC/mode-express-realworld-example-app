import prismaMock from '../prisma-mock';
import {
  deleteComment,
  favoriteArticle,
  unfavoriteArticle,
  getArticles,
  getFeed,
  getArticle,
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
      await expect(favoriteArticle(slug, mockedUserResponse.id)).resolves.toHaveProperty(
        'favoritesCount',
      );
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
      await expect(unfavoriteArticle(slug, mockedUserResponse.id)).resolves.toHaveProperty(
        'favoritesCount',
      );
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

  describe('getArticle', () => {
    test('should include readingTime field in article response for getArticle', async () => {
      // Given
      const slug = 'test-article-200-words';
      const userId = 123;
      const bodyWith200Words = Array(200).fill('word').join(' ');

      const mockedArticleResponse = {
        id: 1,
        slug: slug,
        title: 'Test Article',
        description: 'Test description',
        body: bodyWith200Words,
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
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should calculate readingTime correctly for articles with 400+ words', async () => {
      // Given
      const slug = 'test-article-450-words';
      const userId = 123;
      const bodyWith450Words = Array(450).fill('word').join(' ');

      const mockedArticleResponse = {
        id: 2,
        slug: slug,
        title: 'Long Test Article',
        description: 'Test description',
        body: bodyWith450Words,
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
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(3);
    });

    test('should default readingTime to 1 minute for empty or very short articles', async () => {
      // Given
      const slug = 'test-article-50-words';
      const userId = 123;
      const bodyWith50Words = Array(50).fill('word').join(' ');

      const mockedArticleResponse = {
        id: 3,
        slug: slug,
        title: 'Short Test Article',
        description: 'Test description',
        body: bodyWith50Words,
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
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should handle empty body and default readingTime to 1', async () => {
      // Given
      const slug = 'test-article-empty';
      const userId = 123;

      const mockedArticleResponse = {
        id: 4,
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
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should handle null body and default readingTime to 1', async () => {
      // Given
      const slug = 'test-article-null';
      const userId = 123;

      const mockedArticleResponse = {
        id: 5,
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
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should calculate readingTime for exactly 200 words as 1 minute', async () => {
      // Given
      const slug = 'test-article-exact-200';
      const userId = 123;
      const bodyWithExact200Words = Array(200).fill('word').join(' ');

      const mockedArticleResponse = {
        id: 6,
        slug: slug,
        title: 'Exact 200 Words Article',
        description: 'Test description',
        body: bodyWithExact200Words,
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
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should calculate readingTime for 201 words as 2 minutes', async () => {
      // Given
      const slug = 'test-article-201-words';
      const userId = 123;
      const bodyWith201Words = Array(201).fill('word').join(' ');

      const mockedArticleResponse = {
        id: 7,
        slug: slug,
        title: '201 Words Article',
        description: 'Test description',
        body: bodyWith201Words,
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
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(2);
    });

    test('should calculate readingTime for 1000 words as 5 minutes', async () => {
      // Given
      const slug = 'test-article-1000-words';
      const userId = 123;
      const bodyWith1000Words = Array(1000).fill('word').join(' ');

      const mockedArticleResponse = {
        id: 8,
        slug: slug,
        title: '1000 Words Article',
        description: 'Test description',
        body: bodyWith1000Words,
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
      };

      // When
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticle(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(5);
    });
  });

  describe('getArticles', () => {
    test('should include readingTime in article list from getArticles', async () => {
      // Given
      const mockedArticlesResponse = [
        {
          id: 1,
          slug: 'article-1',
          title: 'Article 1',
          description: 'Description 1',
          body: Array(200).fill('word').join(' '),
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
        },
        {
          id: 2,
          slug: 'article-2',
          title: 'Article 2',
          description: 'Description 2',
          body: Array(400).fill('word').join(' '),
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
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedArticlesResponse);
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(2);

      const result = await getArticles({});

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBeGreaterThan(0);
      result.articles.forEach((article: any) => {
        expect(article).toHaveProperty('readingTime');
        expect(typeof article.readingTime).toBe('number');
      });
    });

    test('should include readingTime for all articles with varying word counts', async () => {
      // Given
      const mockedArticlesResponse = [
        {
          id: 1,
          slug: 'article-short',
          title: 'Short Article',
          description: 'Description',
          body: Array(50).fill('word').join(' '),
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
        },
        {
          id: 2,
          slug: 'article-medium',
          title: 'Medium Article',
          description: 'Description',
          body: Array(300).fill('word').join(' '),
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
        },
        {
          id: 3,
          slug: 'article-long',
          title: 'Long Article',
          description: 'Description',
          body: Array(800).fill('word').join(' '),
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 458,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'Author3',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedArticlesResponse);
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(3);

      const result = await getArticles({});

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBe(3);
      expect(result.articles[0].readingTime).toBe(1);
      expect(result.articles[1].readingTime).toBe(2);
      expect(result.articles[2].readingTime).toBe(4);
    });

    test('should include readingTime when filtering by tag', async () => {
      // Given
      const mockedArticlesResponse = [
        {
          id: 1,
          slug: 'tagged-article',
          title: 'Tagged Article',
          description: 'Description',
          body: Array(250).fill('word').join(' '),
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [{ id: 1, name: 'test' }],
          favoritedBy: [],
          author: {
            username: 'Author1',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedArticlesResponse);
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(1);

      const result = await getArticles({ tag: 'test' });

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBe(1);
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(typeof result.articles[0].readingTime).toBe('number');
    });

    test('should include readingTime when filtering by author', async () => {
      // Given
      const mockedArticlesResponse = [
        {
          id: 1,
          slug: 'author-article',
          title: 'Author Article',
          description: 'Description',
          body: Array(350).fill('word').join(' '),
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'SpecificAuthor',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedArticlesResponse);
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(1);

      const result = await getArticles({ author: 'SpecificAuthor' });

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBe(1);
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(typeof result.articles[0].readingTime).toBe('number');
    });

    test('should include readingTime when filtering by favorited', async () => {
      // Given
      const mockedArticlesResponse = [
        {
          id: 1,
          slug: 'favorited-article',
          title: 'Favorited Article',
          description: 'Description',
          body: Array(600).fill('word').join(' '),
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [],
          favoritedBy: [{ id: 123, username: 'FavUser' }],
          author: {
            username: 'Author1',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedArticlesResponse);
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(1);

      const result = await getArticles({ favorited: 'FavUser' });

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBe(1);
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(typeof result.articles[0].readingTime).toBe('number');
    });

    test('should return empty array with readingTime validation when no articles found', async () => {
      // Given
      const mockedArticlesResponse: any[] = [];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedArticlesResponse);
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(0);

      const result = await getArticles({});

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBe(0);
    });
  });

  describe('getFeed', () => {
    test('should include readingTime in feed articles from getFeed', async () => {
      // Given
      const userId = 123;
      const limit = 10;
      const offset = 0;

      const mockedFeedArticlesResponse = [
        {
          id: 1,
          slug: 'feed-article-1',
          title: 'Feed Article 1',
          description: 'Feed Description 1',
          body: Array(300).fill('word').join(' '),
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'FeedAuthor1',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
        {
          id: 2,
          slug: 'feed-article-2',
          title: 'Feed Article 2',
          description: 'Feed Description 2',
          body: Array(500).fill('word').join(' '),
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 457,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'FeedAuthor2',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedFeedArticlesResponse);
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(2);

      const result = await getFeed(userId, limit, offset);

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBeGreaterThan(0);
      result.articles.forEach((article: any) => {
        expect(article).toHaveProperty('readingTime');
        expect(typeof article.readingTime).toBe('number');
      });
    });

    test('should include readingTime for feed articles with varying word counts', async () => {
      // Given
      const userId = 123;
      const limit = 10;
      const offset = 0;

      const mockedFeedArticlesResponse = [
        {
          id: 1,
          slug: 'feed-short',
          title: 'Short Feed Article',
          description: 'Description',
          body: Array(100).fill('word').join(' '),
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'FeedAuthor1',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
        {
          id: 2,
          slug: 'feed-long',
          title: 'Long Feed Article',
          description: 'Description',
          body: Array(900).fill('word').join(' '),
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 457,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'FeedAuthor2',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedFeedArticlesResponse);
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(2);

      const result = await getFeed(userId, limit, offset);

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBe(2);
      expect(result.articles[0].readingTime).toBe(1);
      expect(result.articles[1].readingTime).toBe(5);
    });

    test('should include readingTime with pagination parameters', async () => {
      // Given
      const userId = 123;
      const limit = 5;
      const offset = 5;

      const mockedFeedArticlesResponse = [
        {
          id: 6,
          slug: 'feed-article-6',
          title: 'Feed Article 6',
          description: 'Description',
          body: Array(400).fill('word').join(' '),
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'FeedAuthor',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedFeedArticlesResponse);
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(1);

      const result = await getFeed(userId, limit, offset);

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBe(1);
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(typeof result.articles[0].readingTime).toBe('number');
    });

    test('should return empty feed with readingTime validation when no followed authors', async () => {
      // Given
      const userId = 123;
      const limit = 10;
      const offset = 0;
      const mockedFeedArticlesResponse: any[] = [];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedFeedArticlesResponse);
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(0);

      const result = await getFeed(userId, limit, offset);

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBe(0);
    });

    test('should include readingTime for feed articles with empty body', async () => {
      // Given
      const userId = 123;
      const limit = 10;
      const offset = 0;

      const mockedFeedArticlesResponse = [
        {
          id: 1,
          slug: 'feed-empty',
          title: 'Empty Feed Article',
          description: 'Description',
          body: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'FeedAuthor',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedFeedArticlesResponse);
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(1);

      const result = await getFeed(userId, limit, offset);

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBe(1);
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(result.articles[0].readingTime).toBe(1);
    });
  });
});