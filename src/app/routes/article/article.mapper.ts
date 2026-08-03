import articleMapper from './article.mapper';
import authorMapper from './author.mapper';

jest.mock('./author.mapper');

describe('articleMapper', () => {
  let mockArticle: any;
  let mockAuthor: any;

  beforeEach(() => {
    mockAuthor = {
      id: 1,
      username: 'testuser',
      bio: 'Test bio',
      image: 'test.jpg',
    };

    mockArticle = {
      slug: 'test-article',
      title: 'Test Article',
      description: 'Test description',
      body: 'This is a test article body with some content.',
      tagList: [{ name: 'tag1' }, { name: 'tag2' }],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      favoritedBy: [{ id: 1 }, { id: 2 }],
      author: mockAuthor,
      calculateReadingTime: jest.fn(),
    };

    (authorMapper as jest.Mock).mockReturnValue({
      username: mockAuthor.username,
      bio: mockAuthor.bio,
      image: mockAuthor.image,
      following: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('readingTime property', () => {
    it('should include readingTime property in the response', () => {
      mockArticle.calculateReadingTime.mockReturnValue(5);

      const result = articleMapper(mockArticle, 1);

      expect(result).toHaveProperty('readingTime');
      expect(result.readingTime).toBe(5);
    });

    it('should call calculateReadingTime method on article instance', () => {
      mockArticle.calculateReadingTime.mockReturnValue(3);

      articleMapper(mockArticle, 1);

      expect(mockArticle.calculateReadingTime).toHaveBeenCalledTimes(1);
      expect(mockArticle.calculateReadingTime).toHaveBeenCalledWith();
    });

    it('should handle readingTime when body is null', () => {
      mockArticle.body = null;
      mockArticle.calculateReadingTime.mockReturnValue(1);

      const result = articleMapper(mockArticle, 1);

      expect(result.readingTime).toBe(1);
      expect(mockArticle.calculateReadingTime).toHaveBeenCalled();
    });

    it('should handle readingTime when body is undefined', () => {
      mockArticle.body = undefined;
      mockArticle.calculateReadingTime.mockReturnValue(1);

      const result = articleMapper(mockArticle, 1);

      expect(result.readingTime).toBe(1);
      expect(mockArticle.calculateReadingTime).toHaveBeenCalled();
    });

    it('should handle readingTime when body is empty string', () => {
      mockArticle.body = '';
      mockArticle.calculateReadingTime.mockReturnValue(1);

      const result = articleMapper(mockArticle, 1);

      expect(result.readingTime).toBe(1);
      expect(mockArticle.calculateReadingTime).toHaveBeenCalled();
    });

    it('should return correct readingTime for long article body', () => {
      const longBody = 'word '.repeat(1000);
      mockArticle.body = longBody;
      mockArticle.calculateReadingTime.mockReturnValue(5);

      const result = articleMapper(mockArticle, 1);

      expect(result.readingTime).toBe(5);
    });

    it('should return correct readingTime for short article body', () => {
      mockArticle.body = 'Short content';
      mockArticle.calculateReadingTime.mockReturnValue(1);

      const result = articleMapper(mockArticle, 1);

      expect(result.readingTime).toBe(1);
    });
  });

  describe('existing functionality preservation', () => {
    beforeEach(() => {
      mockArticle.calculateReadingTime.mockReturnValue(3);
    });

    it('should map all existing article properties correctly', () => {
      const result = articleMapper(mockArticle, 1);

      expect(result.slug).toBe('test-article');
      expect(result.title).toBe('Test Article');
      expect(result.description).toBe('Test description');
      expect(result.body).toBe('This is a test article body with some content.');
      expect(result.createdAt).toEqual(new Date('2023-01-01'));
      expect(result.updatedAt).toEqual(new Date('2023-01-02'));
    });

    it('should map tagList correctly', () => {
      const result = articleMapper(mockArticle, 1);

      expect(result.tagList).toEqual(['tag1', 'tag2']);
      expect(result.tagList).toHaveLength(2);
    });

    it('should calculate favorited status correctly when user has favorited', () => {
      const result = articleMapper(mockArticle, 1);

      expect(result.favorited).toBe(true);
    });

    it('should calculate favorited status correctly when user has not favorited', () => {
      const result = articleMapper(mockArticle, 3);

      expect(result.favorited).toBe(false);
    });

    it('should calculate favoritesCount correctly', () => {
      const result = articleMapper(mockArticle, 1);

      expect(result.favoritesCount).toBe(2);
    });

    it('should call authorMapper with correct parameters', () => {
      articleMapper(mockArticle, 1);

      expect(authorMapper).toHaveBeenCalledWith(mockAuthor, 1);
      expect(authorMapper).toHaveBeenCalledTimes(1);
    });

    it('should include author in response', () => {
      const result = articleMapper(mockArticle, 1);

      expect(result.author).toBeDefined();
      expect(result.author.username).toBe('testuser');
    });

    it('should work when id parameter is not provided', () => {
      mockArticle.calculateReadingTime.mockReturnValue(2);

      const result = articleMapper(mockArticle);

      expect(result.favorited).toBe(false);
      expect(result.readingTime).toBe(2);
      expect(authorMapper).toHaveBeenCalledWith(mockAuthor, undefined);
    });
  });

  describe('response structure consistency', () => {
    it('should return object with all required properties including readingTime', () => {
      mockArticle.calculateReadingTime.mockReturnValue(4);

      const result = articleMapper(mockArticle, 1);

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

      expectedKeys.forEach((key) => {
        expect(result).toHaveProperty(key);
      });
    });

    it('should have readingTime at the same level as other properties', () => {
      mockArticle.calculateReadingTime.mockReturnValue(3);

      const result = articleMapper(mockArticle, 1);

      expect(Object.keys(result)).toContain('readingTime');
      expect(Object.keys(result)).toContain('slug');
      expect(Object.keys(result)).toContain('title');
    });

    it('should return readingTime as a number type', () => {
      mockArticle.calculateReadingTime.mockReturnValue(7);

      const result = articleMapper(mockArticle, 1);

      expect(typeof result.readingTime).toBe('number');
    });
  });

  describe('edge cases', () => {
    it('should handle article with empty tagList', () => {
      mockArticle.tagList = [];
      mockArticle.calculateReadingTime.mockReturnValue(2);

      const result = articleMapper(mockArticle, 1);

      expect(result.tagList).toEqual([]);
      expect(result.readingTime).toBe(2);
    });

    it('should handle article with empty favoritedBy array', () => {
      mockArticle.favoritedBy = [];
      mockArticle.calculateReadingTime.mockReturnValue(3);

      const result = articleMapper(mockArticle, 1);

      expect(result.favorited).toBe(false);
      expect(result.favoritesCount).toBe(0);
      expect(result.readingTime).toBe(3);
    });

    it('should handle article with zero reading time', () => {
      mockArticle.calculateReadingTime.mockReturnValue(0);

      const result = articleMapper(mockArticle, 1);

      expect(result.readingTime).toBe(0);
    });

    it('should handle article with large reading time', () => {
      mockArticle.calculateReadingTime.mockReturnValue(999);

      const result = articleMapper(mockArticle, 1);

      expect(result.readingTime).toBe(999);
    });
  });
});