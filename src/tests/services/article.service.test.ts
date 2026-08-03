import prismaMock from '../prisma-mock';
import {
  deleteComment,
  favoriteArticle,
  unfavoriteArticle,
  getArticleBySlug,
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
        description: '',
        body: 'This is a comprehensive guide on how to train your dragon. Dragons are magnificent creatures that require patience, understanding, and a lot of practice. First, you need to understand their behavior patterns. Dragons communicate through body language and sounds. Learning to read these signals is crucial for building trust. Second, establish a feeding routine. Dragons appreciate consistency and will respond better to training when they know when to expect their meals. Third, start with basic commands like sit, stay, and come. Use positive reinforcement techniques, rewarding good behavior with treats or praise. Fourth, gradually introduce more complex tasks as your dragon masters the basics. Remember, every dragon is unique and will learn at their own pace. Be patient and celebrate small victories along the way. Fifth, ensure your dragon gets plenty of exercise and mental stimulation. Bored dragons can become destructive. Finally, always prioritize safety for both you and your dragon. With dedication and the right approach, you and your dragon will form an unbreakable bond that lasts a lifetime.',
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
        body: 'This is a comprehensive guide on how to train your dragon. Dragons are magnificent creatures that require patience, understanding, and a lot of practice. First, you need to understand their behavior patterns. Dragons communicate through body language and sounds. Learning to read these signals is crucial for building trust. Second, establish a feeding routine. Dragons appreciate consistency and will respond better to training when they know when to expect their meals. Third, start with basic commands like sit, stay, and come. Use positive reinforcement techniques, rewarding good behavior with treats or praise. Fourth, gradually introduce more complex tasks as your dragon masters the basics. Remember, every dragon is unique and will learn at their own pace. Be patient and celebrate small victories along the way. Fifth, ensure your dragon gets plenty of exercise and mental stimulation. Bored dragons can become destructive. Finally, always prioritize safety for both you and your dragon. With dedication and the right approach, you and your dragon will form an unbreakable bond that lasts a lifetime.',
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

  describe('getArticleBySlug', () => {
    test('should return article with readingTime property', async () => {
      // Given
      const slug = 'How-to-train-your-dragon';
      const userId = 123;

      const mockedArticleResponse = {
        id: 123,
        slug: 'How-to-train-your-dragon',
        title: 'How to train your dragon',
        description: 'A comprehensive guide',
        body: 'This is a comprehensive guide on how to train your dragon. Dragons are magnificent creatures that require patience, understanding, and a lot of practice. First, you need to understand their behavior patterns. Dragons communicate through body language and sounds. Learning to read these signals is crucial for building trust. Second, establish a feeding routine. Dragons appreciate consistency and will respond better to training when they know when to expect their meals. Third, start with basic commands like sit, stay, and come. Use positive reinforcement techniques, rewarding good behavior with treats or praise. Fourth, gradually introduce more complex tasks as your dragon masters the basics. Remember, every dragon is unique and will learn at their own pace. Be patient and celebrate small victories along the way. Fifth, ensure your dragon gets plenty of exercise and mental stimulation. Bored dragons can become destructive. Finally, always prioritize safety for both you and your dragon. With dedication and the right approach, you and your dragon will form an unbreakable bond that lasts a lifetime.',
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
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticleBySlug(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(typeof result.readingTime).toBe('number');
    });
  });

  describe('getArticles', () => {
    test('should return articles with readingTime property', async () => {
      // Given
      const filters = {};
      const userId = 123;

      const mockedArticlesResponse = [
        {
          id: 123,
          slug: 'How-to-train-your-dragon',
          title: 'How to train your dragon',
          description: 'A comprehensive guide',
          body: 'This is a comprehensive guide on how to train your dragon. Dragons are magnificent creatures that require patience, understanding, and a lot of practice. First, you need to understand their behavior patterns. Dragons communicate through body language and sounds. Learning to read these signals is crucial for building trust. Second, establish a feeding routine. Dragons appreciate consistency and will respond better to training when they know when to expect their meals. Third, start with basic commands like sit, stay, and come. Use positive reinforcement techniques, rewarding good behavior with treats or praise. Fourth, gradually introduce more complex tasks as your dragon masters the basics. Remember, every dragon is unique and will learn at their own pace. Be patient and celebrate small victories along the way. Fifth, ensure your dragon gets plenty of exercise and mental stimulation. Bored dragons can become destructive. Finally, always prioritize safety for both you and your dragon. With dedication and the right approach, you and your dragon will form an unbreakable bond that lasts a lifetime.',
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
        },
      ];

      // When
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedArticlesResponse);

      const result = await getArticles(filters, userId);

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBeGreaterThan(0);
      result.articles.forEach((article: any) => {
        expect(article).toHaveProperty('readingTime');
        expect(typeof article.readingTime).toBe('number');
      });
    });
  });

  describe('getFeed', () => {
    test('should return feed articles with readingTime property', async () => {
      // Given
      const userId = 123;
      const offset = 0;
      const limit = 20;

      const mockedUserResponse = {
        id: 123,
        username: 'RealWorld',
        email: 'realworld@me',
        password: '1234',
        bio: null,
        image: null,
        token: '',
        demo: false,
        following: [{ id: 456 }],
      };

      const mockedArticlesResponse = [
        {
          id: 123,
          slug: 'How-to-train-your-dragon',
          title: 'How to train your dragon',
          description: 'A comprehensive guide',
          body: 'This is a comprehensive guide on how to train your dragon. Dragons are magnificent creatures that require patience, understanding, and a lot of practice. First, you need to understand their behavior patterns. Dragons communicate through body language and sounds. Learning to read these signals is crucial for building trust. Second, establish a feeding routine. Dragons appreciate consistency and will respond better to training when they know when to expect their meals. Third, start with basic commands like sit, stay, and come. Use positive reinforcement techniques, rewarding good behavior with treats or praise. Fourth, gradually introduce more complex tasks as your dragon masters the basics. Remember, every dragon is unique and will learn at their own pace. Be patient and celebrate small victories along the way. Fifth, ensure your dragon gets plenty of exercise and mental stimulation. Bored dragons can become destructive. Finally, always prioritize safety for both you and your dragon. With dedication and the right approach, you and your dragon will form an unbreakable bond that lasts a lifetime.',
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'AuthorUser',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue(mockedUserResponse);
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedArticlesResponse);

      const result = await getFeed(userId, offset, limit);

      // Then
      expect(result.articles).toBeDefined();
      expect(result.articles.length).toBeGreaterThan(0);
      result.articles.forEach((article: any) => {
        expect(article).toHaveProperty('readingTime');
        expect(typeof article.readingTime).toBe('number');
      });
    });
  });

  describe('readingTime calculation', () => {
    test('should include readingTime in article response', async () => {
      // Given
      const slug = 'test-article';
      const userId = 123;
      
      // Create a mock article with 400 words (should result in 2 minutes reading time)
      const words400 = Array(400).fill('word').join(' ');
      
      const mockedArticleResponse = {
        id: 123,
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: words400,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
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
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticleBySlug(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(2);
    });

    test('should return minimum 1 minute readingTime for short articles', async () => {
      // Given
      const slug = 'short-article';
      const userId = 123;
      
      // Create a mock article with fewer than 200 words
      const shortBody = 'This is a very short article with only a few words.';
      
      const mockedArticleResponse = {
        id: 124,
        slug: 'short-article',
        title: 'Short Article',
        description: 'Short description',
        body: shortBody,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
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
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticleBySlug(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should handle empty or null body gracefully', async () => {
      // Given
      const slug = 'empty-article';
      const userId = 123;
      
      const mockedArticleResponse = {
        id: 125,
        slug: 'empty-article',
        title: 'Empty Article',
        description: 'Empty description',
        body: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
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
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticleBySlug(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should handle null body gracefully', async () => {
      // Given
      const slug = 'null-body-article';
      const userId = 123;
      
      const mockedArticleResponse = {
        id: 126,
        slug: 'null-body-article',
        title: 'Null Body Article',
        description: 'Null body description',
        body: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
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
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticleBySlug(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should return 1 minute for exactly 200 words', async () => {
      // Given
      const slug = 'exactly-200-words';
      const userId = 123;
      
      const words200 = Array(200).fill('word').join(' ');
      
      const mockedArticleResponse = {
        id: 127,
        slug: 'exactly-200-words',
        title: 'Exactly 200 Words',
        description: 'Test description',
        body: words200,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
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
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticleBySlug(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should return 2 minutes for 201 words', async () => {
      // Given
      const slug = 'exactly-201-words';
      const userId = 123;
      
      const words201 = Array(201).fill('word').join(' ');
      
      const mockedArticleResponse = {
        id: 128,
        slug: 'exactly-201-words',
        title: 'Exactly 201 Words',
        description: 'Test description',
        body: words201,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
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
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticleBySlug(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(2);
    });

    test('should return 5 minutes for 1000 words', async () => {
      // Given
      const slug = 'exactly-1000-words';
      const userId = 123;
      
      const words1000 = Array(1000).fill('word').join(' ');
      
      const mockedArticleResponse = {
        id: 129,
        slug: 'exactly-1000-words',
        title: 'Exactly 1000 Words',
        description: 'Test description',
        body: words1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
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
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticleBySlug(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(5);
    });

    test('should calculate readingTime correctly for articles in getArticles', async () => {
      // Given
      const filters = {};
      const userId = 123;
      
      const words600 = Array(600).fill('word').join(' ');

      const mockedArticlesResponse = [
        {
          id: 130,
          slug: 'article-600-words',
          title: 'Article with 600 words',
          description: 'Test description',
          body: words600,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
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
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedArticlesResponse);

      const result = await getArticles(filters, userId);

      // Then
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(result.articles[0].readingTime).toBe(3);
    });

    test('should calculate readingTime correctly for articles in getFeed', async () => {
      // Given
      const userId = 123;
      const offset = 0;
      const limit = 20;
      
      const words800 = Array(800).fill('word').join(' ');

      const mockedUserResponse = {
        id: 123,
        username: 'RealWorld',
        email: 'realworld@me',
        password: '1234',
        bio: null,
        image: null,
        token: '',
        demo: false,
        following: [{ id: 456 }],
      };

      const mockedArticlesResponse = [
        {
          id: 131,
          slug: 'feed-article-800-words',
          title: 'Feed Article with 800 words',
          description: 'Test description',
          body: words800,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 456,
          tagList: [],
          favoritedBy: [],
          author: {
            username: 'AuthorUser',
            bio: null,
            image: null,
            followedBy: [],
          },
        },
      ];

      // When
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue(mockedUserResponse);
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue(mockedArticlesResponse);

      const result = await getFeed(userId, offset, limit);

      // Then
      expect(result.articles[0]).toHaveProperty('readingTime');
      expect(result.articles[0].readingTime).toBe(4);
    });

    test('should handle whitespace-only body as empty', async () => {
      // Given
      const slug = 'whitespace-article';
      const userId = 123;
      
      const mockedArticleResponse = {
        id: 132,
        slug: 'whitespace-article',
        title: 'Whitespace Article',
        description: 'Whitespace description',
        body: '   \n\t   ',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
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
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticleBySlug(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });

    test('should handle multiple spaces between words correctly', async () => {
      // Given
      const slug = 'multiple-spaces-article';
      const userId = 123;
      
      // 10 words with multiple spaces between them
      const bodyWithMultipleSpaces = 'word1    word2   word3  word4     word5 word6   word7  word8    word9 word10';
      
      const mockedArticleResponse = {
        id: 133,
        slug: 'multiple-spaces-article',
        title: 'Multiple Spaces Article',
        description: 'Test description',
        body: bodyWithMultipleSpaces,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
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
      // @ts-ignore
      prismaMock.article.findUnique.mockResolvedValue(mockedArticleResponse);

      const result = await getArticleBySlug(slug, userId);

      // Then
      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(1);
    });
  });
});