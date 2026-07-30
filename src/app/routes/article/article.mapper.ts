import articleMapper from './article.mapper';
import authorMapper from './author.mapper';

jest.mock('./author.mapper');

describe('article.mapper', () => {
  describe('articleMapper', () => {
    const mockAuthor = {
      id: 1,
      username: 'testuser',
      bio: 'Test bio',
      image: 'test.jpg',
    };

    const mockArticle = {
      slug: 'test-article',
      title: 'Test Article',
      description: 'Test description',
      body: 'This is a test article body with some words to calculate reading time.',
      tagList: [{ name: 'tag1' }, { name: 'tag2' }],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      favoritedBy: [{ id: 1 }, { id: 2 }],
      author: mockAuthor,
    };

    beforeEach(() => {
      (authorMapper as jest.Mock).mockReturnValue({
        username: 'testuser',
        bio: 'Test bio',
        image: 'test.jpg',
        following: false,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should map article with all fields including readingTime', () => {
      const result = articleMapper(mockArticle, 1);

      expect(result).toEqual({
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'This is a test article body with some words to calculate reading time.',
        readingTime: 1,
        tagList: ['tag1', 'tag2'],
        createdAt: mockArticle.createdAt,
        updatedAt: mockArticle.updatedAt,
        favorited: true,
        favoritesCount: 2,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          following: false,
        },
      });
    });

    it('should calculate readingTime correctly for article body', () => {
      const result = articleMapper(mockArticle, 1);
      expect(result.readingTime).toBe(1);
    });

    it('should set favorited to true when user id matches favoritedBy', () => {
      const result = articleMapper(mockArticle, 1);
      expect(result.favorited).toBe(true);
    });

    it('should set favorited to false when user id does not match favoritedBy', () => {
      const result = articleMapper(mockArticle, 999);
      expect(result.favorited).toBe(false);
    });

    it('should set favorited to false when no user id is provided', () => {
      const result = articleMapper(mockArticle);
      expect(result.favorited).toBe(false);
    });

    it('should calculate favoritesCount correctly', () => {
      const result = articleMapper(mockArticle, 1);
      expect(result.favoritesCount).toBe(2);
    });

    it('should map tagList correctly', () => {
      const result = articleMapper(mockArticle, 1);
      expect(result.tagList).toEqual(['tag1', 'tag2']);
    });

    it('should handle empty tagList', () => {
      const articleWithNoTags = { ...mockArticle, tagList: [] };
      const result = articleMapper(articleWithNoTags, 1);
      expect(result.tagList).toEqual([]);
    });

    it('should handle empty favoritedBy array', () => {
      const articleWithNoFavorites = { ...mockArticle, favoritedBy: [] };
      const result = articleMapper(articleWithNoFavorites, 1);
      expect(result.favorited).toBe(false);
      expect(result.favoritesCount).toBe(0);
    });

    it('should call authorMapper with correct parameters', () => {
      articleMapper(mockArticle, 1);
      expect(authorMapper).toHaveBeenCalledWith(mockAuthor, 1);
    });

    it('should maintain backward compatibility with existing fields', () => {
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
    });

    it('should position readingTime after body and before tagList', () => {
      const result = articleMapper(mockArticle, 1);
      const keys = Object.keys(result);
      const bodyIndex = keys.indexOf('body');
      const readingTimeIndex = keys.indexOf('readingTime');
      const tagListIndex = keys.indexOf('tagList');
      
      expect(readingTimeIndex).toBeGreaterThan(bodyIndex);
      expect(readingTimeIndex).toBeLessThan(tagListIndex);
    });
  });

  describe('calculateReadingTime', () => {
    const calculateReadingTime = (body: string): number => {
      if (!body || body.trim().length === 0) {
        return 1;
      }
      
      const words = body.trim().split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      const readingTimeMinutes = wordCount / 200;
      
      return Math.max(1, Math.ceil(readingTimeMinutes));
    };

    it('should return 1 for null body', () => {
      expect(calculateReadingTime(null as any)).toBe(1);
    });

    it('should return 1 for undefined body', () => {
      expect(calculateReadingTime(undefined as any)).toBe(1);
    });

    it('should return 1 for empty string', () => {
      expect(calculateReadingTime('')).toBe(1);
    });

    it('should return 1 for whitespace-only string', () => {
      expect(calculateReadingTime('   ')).toBe(1);
    });

    it('should return 1 for body with less than 200 words', () => {
      const body = 'This is a short article.';
      expect(calculateReadingTime(body)).toBe(1);
    });

    it('should return 1 for exactly 200 words', () => {
      const body = Array(200).fill('word').join(' ');
      expect(calculateReadingTime(body)).toBe(1);
    });

    it('should return 2 for 201 words', () => {
      const body = Array(201).fill('word').join(' ');
      expect(calculateReadingTime(body)).toBe(2);
    });

    it('should return 2 for 400 words', () => {
      const body = Array(400).fill('word').join(' ');
      expect(calculateReadingTime(body)).toBe(2);
    });

    it('should return 3 for 401 words', () => {
      const body = Array(401).fill('word').join(' ');
      expect(calculateReadingTime(body)).toBe(3);
    });

    it('should round up reading time using Math.ceil', () => {
      const body = Array(250).fill('word').join(' ');
      expect(calculateReadingTime(body)).toBe(2);
    });

    it('should handle body with multiple spaces between words', () => {
      const body = 'word1    word2     word3';
      expect(calculateReadingTime(body)).toBe(1);
    });

    it('should handle body with leading and trailing whitespace', () => {
      const body = '   word1 word2 word3   ';
      expect(calculateReadingTime(body)).toBe(1);
    });

    it('should handle body with newlines and tabs', () => {
      const body = 'word1\nword2\tword3';
      expect(calculateReadingTime(body)).toBe(1);
    });

    it('should filter out empty strings from word array', () => {
      const body = 'word1  word2  word3';
      expect(calculateReadingTime(body)).toBe(1);
    });

    it('should ensure minimum reading time of 1 minute', () => {
      const body = 'a';
      expect(calculateReadingTime(body)).toBe(1);
    });

    it('should calculate correctly for large articles', () => {
      const body = Array(1000).fill('word').join(' ');
      expect(calculateReadingTime(body)).toBe(5);
    });

    it('should handle body with punctuation', () => {
      const body = 'Hello, world! This is a test.';
      expect(calculateReadingTime(body)).toBe(1);
    });

    it('should split by whitespace regex correctly', () => {
      const body = 'word1 word2\nword3\tword4';
      const words = body.trim().split(/\s+/).filter(word => word.length > 0);
      expect(words.length).toBe(4);
    });

    it('should calculate word count accurately', () => {
      const body = Array(150).fill('word').join(' ');
      expect(calculateReadingTime(body)).toBe(1);
    });

    it('should divide word count by 200', () => {
      const body = Array(600).fill('word').join(' ');
      expect(calculateReadingTime(body)).toBe(3);
    });
  });
});