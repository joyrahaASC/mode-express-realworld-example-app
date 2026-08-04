import articleMapper from './article.mapper';
import authorMapper from './author.mapper';

jest.mock('./author.mapper');

describe('article.mapper', () => {
  const mockAuthorMapper = authorMapper as jest.MockedFunction<typeof authorMapper>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorMapper.mockReturnValue({
      username: 'testuser',
      bio: 'test bio',
      image: 'test.jpg',
      following: false,
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time for a 200-word article as 1 minute', () => {
      const body = 'word '.repeat(200).trim();
      const article = createMockArticle(body);
      const result = articleMapper(article);
      expect(result.readingTime).toBe(1);
    });

    it('should calculate reading time for a 400-word article as 2 minutes', () => {
      const body = 'word '.repeat(400).trim();
      const article = createMockArticle(body);
      const result = articleMapper(article);
      expect(result.readingTime).toBe(2);
    });

    it('should calculate reading time for a 250-word article as 2 minutes (rounded up)', () => {
      const body = 'word '.repeat(250).trim();
      const article = createMockArticle(body);
      const result = articleMapper(article);
      expect(result.readingTime).toBe(2);
    });

    it('should return minimum 1 minute for empty body', () => {
      const article = createMockArticle('');
      const result = articleMapper(article);
      expect(result.readingTime).toBe(1);
    });

    it('should return minimum 1 minute for null body', () => {
      const article = createMockArticle(null);
      const result = articleMapper(article);
      expect(result.readingTime).toBe(1);
    });

    it('should return minimum 1 minute for undefined body', () => {
      const article = createMockArticle(undefined);
      const result = articleMapper(article);
      expect(result.readingTime).toBe(1);
    });

    it('should return minimum 1 minute for whitespace-only body', () => {
      const article = createMockArticle('   \n\t  ');
      const result = articleMapper(article);
      expect(result.readingTime).toBe(1);
    });

    it('should handle body with multiple consecutive spaces correctly', () => {
      const body = 'word    word    word';
      const article = createMockArticle(body);
      const result = articleMapper(article);
      expect(result.readingTime).toBe(1);
    });

    it('should handle body with newlines and tabs correctly', () => {
      const body = 'word\nword\tword   word';
      const article = createMockArticle(body);
      const result = articleMapper(article);
      expect(result.readingTime).toBe(1);
    });

    it('should calculate reading time for a 1000-word article as 5 minutes', () => {
      const body = 'word '.repeat(1000).trim();
      const article = createMockArticle(body);
      const result = articleMapper(article);
      expect(result.readingTime).toBe(5);
    });

    it('should calculate reading time for a 199-word article as 1 minute', () => {
      const body = 'word '.repeat(199).trim();
      const article = createMockArticle(body);
      const result = articleMapper(article);
      expect(result.readingTime).toBe(1);
    });

    it('should calculate reading time for a 201-word article as 2 minutes', () => {
      const body = 'word '.repeat(201).trim();
      const article = createMockArticle(body);
      const result = articleMapper(article);
      expect(result.readingTime).toBe(2);
    });

    it('should filter out empty strings when splitting by whitespace', () => {
      const body = '  word1  word2  word3  ';
      const article = createMockArticle(body);
      const result = articleMapper(article);
      expect(result.readingTime).toBe(1);
    });
  });

  describe('articleMapper', () => {
    it('should map all existing fields correctly', () => {
      const article = createMockArticle('Test body content');
      const userId = 1;
      const result = articleMapper(article, userId);

      expect(result.slug).toBe(article.slug);
      expect(result.title).toBe(article.title);
      expect(result.description).toBe(article.description);
      expect(result.body).toBe(article.body);
      expect(result.createdAt).toBe(article.createdAt);
      expect(result.updatedAt).toBe(article.updatedAt);
      expect(result.favoritesCount).toBe(article.favoritedBy.length);
    });

    it('should include readingTime field in the mapped article', () => {
      const article = createMockArticle('word '.repeat(200).trim());
      const result = articleMapper(article);

      expect(result).toHaveProperty('readingTime');
      expect(typeof result.readingTime).toBe('number');
    });

    it('should map tagList correctly', () => {
      const article = createMockArticle('Test body');
      const result = articleMapper(article);

      expect(result.tagList).toEqual(['tag1', 'tag2']);
    });

    it('should set favorited to true when user has favorited the article', () => {
      const article = createMockArticle('Test body');
      const userId = 1;
      const result = articleMapper(article, userId);

      expect(result.favorited).toBe(true);
    });

    it('should set favorited to false when user has not favorited the article', () => {
      const article = createMockArticle('Test body');
      const userId = 999;
      const result = articleMapper(article, userId);

      expect(result.favorited).toBe(false);
    });

    it('should set favorited to false when no userId is provided', () => {
      const article = createMockArticle('Test body');
      const result = articleMapper(article);

      expect(result.favorited).toBe(false);
    });

    it('should call authorMapper with correct parameters', () => {
      const article = createMockArticle('Test body');
      const userId = 1;
      articleMapper(article, userId);

      expect(mockAuthorMapper).toHaveBeenCalledWith(article.author, userId);
    });

    it('should maintain backward compatibility with existing article structure', () => {
      const article = createMockArticle('Test body');
      const result = articleMapper(article);

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

    it('should calculate readingTime correctly for article with long body', () => {
      const body = 'word '.repeat(500).trim();
      const article = createMockArticle(body);
      const result = articleMapper(article);

      expect(result.readingTime).toBe(3);
    });

    it('should handle article with empty tagList', () => {
      const article = {
        ...createMockArticle('Test body'),
        tagList: [],
      };
      const result = articleMapper(article);

      expect(result.tagList).toEqual([]);
    });

    it('should handle article with empty favoritedBy array', () => {
      const article = {
        ...createMockArticle('Test body'),
        favoritedBy: [],
      };
      const result = articleMapper(article);

      expect(result.favoritesCount).toBe(0);
      expect(result.favorited).toBe(false);
    });
  });
});

function createMockArticle(body: any) {
  return {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    body: body,
    tagList: [{ name: 'tag1' }, { name: 'tag2' }],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
    favoritedBy: [{ id: 1 }, { id: 2 }],
    author: {
      username: 'author',
      bio: 'author bio',
      image: 'author.jpg',
    },
  };
}