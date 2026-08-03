import articleMapper, { mapArticleListToResponse, mapArticleToFeedResponse, ArticleResponse } from './article.mapper';
import authorMapper from './author.mapper';

jest.mock('./author.mapper');

describe('article.mapper', () => {
  let mockArticle: any;
  let mockAuthor: any;
  let mockTag1: any;
  let mockTag2: any;
  let mockFavoritedByUser1: any;
  let mockFavoritedByUser2: any;

  beforeEach(() => {
    mockTag1 = { name: 'typescript' };
    mockTag2 = { name: 'testing' };
    mockFavoritedByUser1 = { id: 1 };
    mockFavoritedByUser2 = { id: 2 };
    mockAuthor = { id: 10, username: 'testauthor' };

    mockArticle = {
      slug: 'test-article-slug',
      title: 'Test Article Title',
      description: 'Test article description',
      body: 'This is the test article body content',
      tagList: [mockTag1, mockTag2],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      favoritedBy: [mockFavoritedByUser1, mockFavoritedByUser2],
      author: mockAuthor,
      calculateReadingTime: jest.fn().mockReturnValue(5),
      readingTime: 3,
    };

    (authorMapper as jest.Mock).mockReturnValue({
      username: 'testauthor',
      bio: 'Test bio',
      image: 'test.jpg',
      following: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('articleMapper', () => {
    describe('basic field mapping', () => {
      it('should map slug correctly', () => {
        const result = articleMapper(mockArticle);
        expect(result.slug).toBe('test-article-slug');
      });

      it('should map title correctly', () => {
        const result = articleMapper(mockArticle);
        expect(result.title).toBe('Test Article Title');
      });

      it('should map description correctly', () => {
        const result = articleMapper(mockArticle);
        expect(result.description).toBe('Test article description');
      });

      it('should map body correctly', () => {
        const result = articleMapper(mockArticle);
        expect(result.body).toBe('This is the test article body content');
      });

      it('should map createdAt correctly', () => {
        const result = articleMapper(mockArticle);
        expect(result.createdAt).toEqual(new Date('2023-01-01'));
      });

      it('should map updatedAt correctly', () => {
        const result = articleMapper(mockArticle);
        expect(result.updatedAt).toEqual(new Date('2023-01-02'));
      });
    });

    describe('tagList mapping', () => {
      it('should map tagList by extracting tag names', () => {
        const result = articleMapper(mockArticle);
        expect(result.tagList).toEqual(['typescript', 'testing']);
      });

      it('should handle empty tagList', () => {
        mockArticle.tagList = [];
        const result = articleMapper(mockArticle);
        expect(result.tagList).toEqual([]);
      });

      it('should handle single tag', () => {
        mockArticle.tagList = [mockTag1];
        const result = articleMapper(mockArticle);
        expect(result.tagList).toEqual(['typescript']);
      });

      it('should handle multiple tags', () => {
        const mockTag3 = { name: 'javascript' };
        mockArticle.tagList = [mockTag1, mockTag2, mockTag3];
        const result = articleMapper(mockArticle);
        expect(result.tagList).toEqual(['typescript', 'testing', 'javascript']);
      });
    });

    describe('favorited status mapping', () => {
      it('should set favorited to true when user has favorited the article', () => {
        const result = articleMapper(mockArticle, 1);
        expect(result.favorited).toBe(true);
      });

      it('should set favorited to false when user has not favorited the article', () => {
        const result = articleMapper(mockArticle, 999);
        expect(result.favorited).toBe(false);
      });

      it('should set favorited to false when no user id is provided', () => {
        const result = articleMapper(mockArticle);
        expect(result.favorited).toBe(false);
      });

      it('should set favorited to false when user id is undefined', () => {
        const result = articleMapper(mockArticle, undefined);
        expect(result.favorited).toBe(false);
      });

      it('should handle multiple users who favorited the article', () => {
        const result1 = articleMapper(mockArticle, 1);
        const result2 = articleMapper(mockArticle, 2);
        expect(result1.favorited).toBe(true);
        expect(result2.favorited).toBe(true);
      });
    });

    describe('favoritesCount mapping', () => {
      it('should return correct favoritesCount', () => {
        const result = articleMapper(mockArticle);
        expect(result.favoritesCount).toBe(2);
      });

      it('should return zero when no users have favorited', () => {
        mockArticle.favoritedBy = [];
        const result = articleMapper(mockArticle);
        expect(result.favoritesCount).toBe(0);
      });

      it('should return correct count with single favorite', () => {
        mockArticle.favoritedBy = [mockFavoritedByUser1];
        const result = articleMapper(mockArticle);
        expect(result.favoritesCount).toBe(1);
      });

      it('should return correct count with many favorites', () => {
        mockArticle.favoritedBy = [
          mockFavoritedByUser1,
          mockFavoritedByUser2,
          { id: 3 },
          { id: 4 },
          { id: 5 },
        ];
        const result = articleMapper(mockArticle);
        expect(result.favoritesCount).toBe(5);
      });
    });

    describe('author mapping', () => {
      it('should call authorMapper with article author and user id', () => {
        articleMapper(mockArticle, 1);
        expect(authorMapper).toHaveBeenCalledWith(mockAuthor, 1);
      });

      it('should call authorMapper without user id when not provided', () => {
        articleMapper(mockArticle);
        expect(authorMapper).toHaveBeenCalledWith(mockAuthor, undefined);
      });

      it('should include mapped author in response', () => {
        const result = articleMapper(mockArticle);
        expect(result.author).toEqual({
          username: 'testauthor',
          bio: 'Test bio',
          image: 'test.jpg',
          following: false,
        });
      });
    });

    describe('readingTime mapping - calculateReadingTime method exists', () => {
      it('should call calculateReadingTime method when it exists', () => {
        articleMapper(mockArticle);
        expect(mockArticle.calculateReadingTime).toHaveBeenCalled();
      });

      it('should use value from calculateReadingTime method', () => {
        mockArticle.calculateReadingTime.mockReturnValue(7);
        const result = articleMapper(mockArticle);
        expect(result.readingTime).toBe(7);
      });

      it('should handle calculateReadingTime returning zero', () => {
        mockArticle.calculateReadingTime.mockReturnValue(0);
        const result = articleMapper(mockArticle);
        expect(result.readingTime).toBe(0);
      });

      it('should handle calculateReadingTime returning large values', () => {
        mockArticle.calculateReadingTime.mockReturnValue(999);
        const result = articleMapper(mockArticle);
        expect(result.readingTime).toBe(999);
      });

      it('should prefer calculateReadingTime over readingTime property', () => {
        mockArticle.calculateReadingTime.mockReturnValue(10);
        mockArticle.readingTime = 3;
        const result = articleMapper(mockArticle);
        expect(result.readingTime).toBe(10);
      });
    });

    describe('readingTime mapping - calculateReadingTime method does not exist', () => {
      beforeEach(() => {
        delete mockArticle.calculateReadingTime;
      });

      it('should use readingTime property when calculateReadingTime does not exist', () => {
        mockArticle.readingTime = 8;
        const result = articleMapper(mockArticle);
        expect(result.readingTime).toBe(8);
      });

      it('should default to 0 when neither calculateReadingTime nor readingTime exist', () => {
        delete mockArticle.readingTime;
        const result = articleMapper(mockArticle);
        expect(result.readingTime).toBe(0);
      });

      it('should default to 0 when readingTime is null', () => {
        mockArticle.readingTime = null;
        const result = articleMapper(mockArticle);
        expect(result.readingTime).toBe(0);
      });

      it('should default to 0 when readingTime is undefined', () => {
        mockArticle.readingTime = undefined;
        const result = articleMapper(mockArticle);
        expect(result.readingTime).toBe(0);
      });

      it('should default to 0 when readingTime is falsy (0)', () => {
        mockArticle.readingTime = 0;
        const result = articleMapper(mockArticle);
        expect(result.readingTime).toBe(0);
      });

      it('should use readingTime when it has a truthy value', () => {
        mockArticle.readingTime = 15;
        const result = articleMapper(mockArticle);
        expect(result.readingTime).toBe(15);
      });
    });

    describe('ArticleResponse interface compliance', () => {
      it('should return object with all required ArticleResponse fields', () => {
        const result = articleMapper(mockArticle, 1);
        expect(result).toHaveProperty('slug');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('body');
        expect(result).toHaveProperty('tagList');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('updatedAt');
        expect(result).toHaveProperty('favorited');
        expect(result).toHaveProperty('favoritesCount');
        expect(result).toHaveProperty('author');
        expect(result).toHaveProperty('readingTime');
      });

      it('should return readingTime as number type', () => {
        const result = articleMapper(mockArticle);
        expect(typeof result.readingTime).toBe('number');
      });

      it('should not include extra properties beyond ArticleResponse interface', () => {
        const result = articleMapper(mockArticle);
        const expectedKeys = [
          'slug',
          'title',
          'description',
          'body',
          'tagList',
          'createdAt',
          'updatedAt',
          'favorited',
          'favoritesCount',
          'author',
          'readingTime',
        ];
        expect(Object.keys(result).sort()).toEqual(expectedKeys.sort());
      });
    });

    describe('edge cases', () => {
      it('should handle article with all minimum values', () => {
        const minimalArticle = {
          slug: '',
          title: '',
          description: '',
          body: '',
          tagList: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          favoritedBy: [],
          author: {},
          readingTime: 0,
        };
        const result = articleMapper(minimalArticle);
        expect(result.readingTime).toBe(0);
        expect(result.favoritesCount).toBe(0);
        expect(result.favorited).toBe(false);
      });

      it('should not mutate original article object', () => {
        const originalArticle = { ...mockArticle };
        articleMapper(mockArticle);
        expect(mockArticle).toEqual(originalArticle);
      });
    });
  });

  describe('mapArticleListToResponse', () => {
    let mockArticle2: any;
    let mockArticle3: any;

    beforeEach(() => {
      mockArticle2 = {
        ...mockArticle,
        slug: 'second-article',
        title: 'Second Article',
        calculateReadingTime: jest.fn().mockReturnValue(3),
      };

      mockArticle3 = {
        ...mockArticle,
        slug: 'third-article',
        title: 'Third Article',
        calculateReadingTime: jest.fn().mockReturnValue(8),
      };
    });

    it('should map empty array to empty array', () => {
      const result = mapArticleListToResponse([]);
      expect(result).toEqual([]);
    });

    it('should map single article in array', () => {
      const result = mapArticleListToResponse([mockArticle]);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('test-article-slug');
      expect(result[0].readingTime).toBe(5);
    });

    it('should map multiple articles in array', () => {
      const result = mapArticleListToResponse([mockArticle, mockArticle2, mockArticle3]);
      expect(result).toHaveLength(3);
      expect(result[0].slug).toBe('test-article-slug');
      expect(result[1].slug).toBe('second-article');
      expect(result[2].slug).toBe('third-article');
    });

    it('should include readingTime for all articles in list', () => {
      const result = mapArticleListToResponse([mockArticle, mockArticle2, mockArticle3]);
      expect(result[0].readingTime).toBe(5);
      expect(result[1].readingTime).toBe(3);
      expect(result[2].readingTime).toBe(8);
    });

    it('should pass user id to each article mapper call', () => {
      const articles = [mockArticle, mockArticle2];
      mapArticleListToResponse(articles, 1);
      expect(mockArticle.calculateReadingTime).toHaveBeenCalled();
      expect(mockArticle2.calculateReadingTime).toHaveBeenCalled();
    });

    it('should handle user id undefined for list mapping', () => {
      const result = mapArticleListToResponse([mockArticle, mockArticle2]);
      expect(result[0].favorited).toBe(false);
      expect(result[1].favorited).toBe(false);
    });

    it('should correctly set favorited status for each article with user id', () => {
      const result = mapArticleListToResponse([mockArticle, mockArticle2], 1);
      expect(result[0].favorited).toBe(true);
      expect(result[1].favorited).toBe(true);
    });

    it('should return array of ArticleResponse objects', () => {
      const result = mapArticleListToResponse([mockArticle]);
      expect(result[0]).toHaveProperty('slug');
      expect(result[0]).toHaveProperty('readingTime');
      expect(typeof result[0].readingTime).toBe('number');
    });

    it('should handle articles with different readingTime calculation methods', () => {
      delete mockArticle2.calculateReadingTime;
      mockArticle2.readingTime = 12;
      const result = mapArticleListToResponse([mockArticle, mockArticle2]);
      expect(result[0].readingTime).toBe(5);
      expect(result[1].readingTime).toBe(12);
    });

    it('should maintain order of articles in response', () => {
      const result = mapArticleListToResponse([mockArticle, mockArticle2, mockArticle3]);
      expect(result[0].title).toBe('Test Article Title');
      expect(result[1].title).toBe('Second Article');
      expect(result[2].title).toBe('Third Article');
    });

    it('should handle large arrays of articles', () => {
      const largeArray = Array(100).fill(mockArticle);
      const result = mapArticleListToResponse(largeArray);
      expect(result).toHaveLength(100);
      result.forEach((article) => {
        expect(article.readingTime).toBeDefined();
        expect(typeof article.readingTime).toBe('number');
      });
    });
  });

  describe('mapArticleToFeedResponse', () => {
    let mockArticle2: any;
    let mockArticle3: any;

    beforeEach(() => {
      mockArticle2 = {
        ...mockArticle,
        slug: 'feed-article-2',
        title: 'Feed Article 2',
        calculateReadingTime: jest.fn().mockReturnValue(6),
      };

      mockArticle3 = {
        ...mockArticle,
        slug: 'feed-article-3',
        title: 'Feed Article 3',
        calculateReadingTime: jest.fn().mockReturnValue(4),
      };
    });

    it('should map empty feed array to empty array', () => {
      const result = mapArticleToFeedResponse([]);
      expect(result).toEqual([]);
    });

    it('should map single article in feed', () => {
      const result = mapArticleToFeedResponse([mockArticle]);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('test-article-slug');
      expect(result[0].readingTime).toBe(5);
    });

    it('should map multiple articles in feed', () => {
      const result = mapArticleToFeedResponse([mockArticle, mockArticle2, mockArticle3]);
      expect(result).toHaveLength(3);
      expect(result[0].slug).toBe('test-article-slug');
      expect(result[1].slug).toBe('feed-article-2');
      expect(result[2].slug).toBe('feed-article-3');
    });

    it('should include readingTime for all articles in feed', () => {
      const result = mapArticleToFeedResponse([mockArticle, mockArticle2, mockArticle3]);
      expect(result[0].readingTime).toBe(5);
      expect(result[1].readingTime).toBe(6);
      expect(result[2].readingTime).toBe(4);
    });

    it('should pass user id to each article mapper call in feed', () => {
      const articles = [mockArticle, mockArticle2];
      mapArticleToFeedResponse(articles, 1);
      expect(mockArticle.calculateReadingTime).toHaveBeenCalled();
      expect(mockArticle2.calculateReadingTime).toHaveBeenCalled();
    });

    it('should handle user id undefined for feed mapping', () => {
      const result = mapArticleToFeedResponse([mockArticle, mockArticle2]);
      expect(result[0].favorited).toBe(false);
      expect(result[1].favorited).toBe(false);
    });

    it('should correctly set favorited status for each article in feed with user id', () => {
      const result = mapArticleToFeedResponse([mockArticle, mockArticle2], 2);
      expect(result[0].favorited).toBe(true);
      expect(result[1].favorited).toBe(true);
    });

    it('should return array of ArticleResponse objects for feed', () => {
      const result = mapArticleToFeedResponse([mockArticle]);
      expect(result[0]).toHaveProperty('slug');
      expect(result[0]).toHaveProperty('readingTime');
      expect(typeof result[0].readingTime).toBe('number');
    });

    it('should handle feed articles with different readingTime calculation methods', () => {
      delete mockArticle2.calculateReadingTime;
      mockArticle2.readingTime = 20;
      const result = mapArticleToFeedResponse([mockArticle, mockArticle2]);
      expect(result[0].readingTime).toBe(5);
      expect(result[1].readingTime).toBe(20);
    });

    it('should maintain order of articles in feed response', () => {
      const result = mapArticleToFeedResponse([mockArticle, mockArticle2, mockArticle3]);
      expect(result[0].title).toBe('Test Article Title');
      expect(result[1].title).toBe('Feed Article 2');
      expect(result[2].title).toBe('Third Article');
    });

    it('should handle large feed arrays', () => {
      const largeFeedArray = Array(50).fill(mockArticle);
      const result = mapArticleToFeedResponse(largeFeedArray);
      expect(result).toHaveLength(50);
      result.forEach((article) => {
        expect(article.readingTime).toBeDefined();
        expect(typeof article.readingTime).toBe('number');
      });
    });

    it('should produce same output as mapArticleListToResponse for identical input', () => {
      const articles = [mockArticle, mockArticle2];
      const listResult = mapArticleListToResponse(articles, 1);
      const feedResult = mapArticleToFeedResponse(articles, 1);
      expect(feedResult).toEqual(listResult);
    });
  });

  describe('consistency across all mapping functions', () => {
    it('should ensure readingTime is included in single article mapping', () => {
      const result = articleMapper(mockArticle);
      expect(result).toHaveProperty('readingTime');
      expect(typeof result.readingTime).toBe('number');
    });

    it('should ensure readingTime is included in list mapping', () => {
      const result = mapArticleListToResponse([mockArticle]);
      expect(result[0]).toHaveProperty('readingTime');
      expect(typeof result[0].readingTime).toBe('number');
    });

    it('should ensure readingTime is included in feed mapping', () => {
      const result = mapArticleToFeedResponse([mockArticle]);
      expect(result[0]).toHaveProperty('readingTime');
      expect(typeof result[0].readingTime).toBe('number');
    });

    it('should not remove or overwrite existing article properties in single mapping', () => {
      const result = articleMapper(mockArticle);
      expect(result.slug).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.body).toBeDefined();
      expect(result.tagList).toBeDefined();
      expect(result.author).toBeDefined();
    });

    it('should not remove or overwrite existing article properties in list mapping', () => {
      const result = mapArticleListToResponse([mockArticle]);
      expect(result[0].slug).toBeDefined();
      expect(result[0].title).toBeDefined();
      expect(result[0].description).toBeDefined();
      expect(result[0].body).toBeDefined();
      expect(result[0].tagList).toBeDefined();
      expect(result[0].author).toBeDefined();
    });

    it('should not remove or overwrite existing article properties in feed mapping', () => {
      const result = mapArticleToFeedResponse([mockArticle]);
      expect(result[0].slug).toBeDefined();
      expect(result[0].title).toBeDefined();
      expect(result[0].description).toBeDefined();
      expect(result[0].body).toBeDefined();
      expect(result[0].tagList).toBeDefined();
      expect(result[0].author).toBeDefined();
    });

    it('should maintain API contract uniformity - all functions return ArticleResponse type', () => {
      const singleResult = articleMapper(mockArticle);
      const listResult = mapArticleListToResponse([mockArticle]);
      const feedResult = mapArticleToFeedResponse([mockArticle]);

      const expectedKeys = [
        'slug',
        'title',
        'description',
        'body',
        'tagList',
        'createdAt',
        'updatedAt',
        'favorited',
        'favoritesCount',
        'author',
        'readingTime',
      ];

      expect(Object.keys(singleResult).sort()).toEqual(expectedKeys.sort());
      expect(Object.keys(listResult[0]).sort()).toEqual(expectedKeys.sort());
      expect(Object.keys(feedResult[0]).sort()).toEqual(expectedKeys.sort());
    });
  });
});