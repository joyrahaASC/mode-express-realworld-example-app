import { ArticleModel } from './article.model';

describe('ArticleModel', () => {
  describe('constructor', () => {
    it('should create an instance with all provided properties', () => {
      const articleData = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content',
        tags: ['tag1', 'tag2'],
        author: { username: 'testuser' },
        comments: [],
        favorited: true
      };

      const article = new ArticleModel(articleData);

      expect(article.id).toBe(1);
      expect(article.title).toBe('Test Article');
      expect(article.slug).toBe('test-article');
      expect(article.description).toBe('Test description');
      expect(article.body).toBe('Test body content');
      expect(article.tags).toEqual(['tag1', 'tag2']);
      expect(article.author).toEqual({ username: 'testuser' });
      expect(article.comments).toEqual([]);
      expect(article.favorited).toBe(true);
    });

    it('should use default values for missing properties', () => {
      const article = new ArticleModel({});

      expect(article.id).toBe(0);
      expect(article.title).toBe('');
      expect(article.slug).toBe('');
      expect(article.description).toBe('');
      expect(article.body).toBeUndefined();
      expect(article.tags).toEqual([]);
      expect(article.author).toBeUndefined();
      expect(article.comments).toEqual([]);
      expect(article.favorited).toBe(false);
    });
  });

  describe('calculateReadingTime', () => {
    it('should return 1 minute for null body', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: null
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(1);
    });

    it('should return 1 minute for undefined body', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test'
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(1);
    });

    it('should return 1 minute for empty string body', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: ''
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(1);
    });

    it('should return 1 minute for whitespace-only body', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: '   \n\t  '
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(1);
    });

    it('should return 1 minute for very short articles (less than 200 words)', () => {
      const shortBody = 'This is a short article with only ten words here.';
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: shortBody
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(1);
    });

    it('should calculate 1 minute for exactly 200 words', () => {
      const words = Array(200).fill('word').join(' ');
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: words
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(1);
    });

    it('should calculate 2 minutes for 201 words (ceiling)', () => {
      const words = Array(201).fill('word').join(' ');
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: words
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(2);
    });

    it('should calculate 2 minutes for 400 words', () => {
      const words = Array(400).fill('word').join(' ');
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: words
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(2);
    });

    it('should calculate 3 minutes for 401 words (ceiling)', () => {
      const words = Array(401).fill('word').join(' ');
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: words
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(3);
    });

    it('should calculate 5 minutes for 1000 words', () => {
      const words = Array(1000).fill('word').join(' ');
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: words
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(5);
    });

    it('should handle multiple consecutive spaces correctly', () => {
      const bodyWithMultipleSpaces = 'word1    word2     word3';
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: bodyWithMultipleSpaces
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(1);
    });

    it('should handle newlines and tabs as whitespace', () => {
      const bodyWithNewlines = 'word1\nword2\tword3\r\nword4';
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: bodyWithNewlines
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(1);
    });

    it('should filter out empty strings from split result', () => {
      const bodyWithLeadingTrailingSpaces = '  word1 word2 word3  ';
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: bodyWithLeadingTrailingSpaces
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(1);
    });
  });

  describe('toJSONFor', () => {
    it('should return all existing fields in the JSON response', () => {
      const articleData = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content with some words',
        tags: ['tag1', 'tag2'],
        author: { username: 'testuser' },
        comments: [{ id: 1, body: 'comment' }],
        favorited: true
      };

      const article = new ArticleModel(articleData);
      const json = article.toJSONFor();

      expect(json.id).toBe(1);
      expect(json.title).toBe('Test Article');
      expect(json.slug).toBe('test-article');
      expect(json.description).toBe('Test description');
      expect(json.body).toBe('Test body content with some words');
      expect(json.tags).toEqual(['tag1', 'tag2']);
      expect(json.author).toEqual({ username: 'testuser' });
      expect(json.favorited).toBe(true);
      expect(json.comments).toEqual([{ id: 1, body: 'comment' }]);
    });

    it('should include readingTime field in the JSON response', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: 'Test body'
      });

      const json = article.toJSONFor();

      expect(json).toHaveProperty('readingTime');
      expect(typeof json.readingTime).toBe('number');
    });

    it('should not break when user parameter is provided', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: 'Test body'
      });

      const user = { id: 1, username: 'testuser' };
      const json = article.toJSONFor(user);

      expect(json).toBeDefined();
      expect(json.readingTime).toBe(1);
    });

    it('should not break when user parameter is undefined', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: 'Test body'
      });

      const json = article.toJSONFor(undefined);

      expect(json).toBeDefined();
      expect(json.readingTime).toBe(1);
    });

    it('should maintain backward compatibility with existing API consumers', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: 'Test body'
      });

      const json = article.toJSONFor();

      // Verify all expected fields are present
      const expectedFields = ['id', 'title', 'slug', 'description', 'body', 'tags', 'author', 'favorited', 'comments', 'readingTime'];
      expectedFields.forEach(field => {
        expect(json).toHaveProperty(field);
      });
    });

    it('should handle articles with no body gracefully in JSON response', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test'
      });

      const json = article.toJSONFor();

      expect(json.body).toBeUndefined();
      expect(json.readingTime).toBe(1);
    });

    it('should calculate readingTime dynamically on each toJSONFor call', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: 'Initial body'
      });

      const json1 = article.toJSONFor();
      expect(json1.readingTime).toBe(1);

      // Modify body
      article.body = Array(500).fill('word').join(' ');
      const json2 = article.toJSONFor();
      expect(json2.readingTime).toBe(3);
    });
  });

  describe('edge cases and error handling', () => {
    it('should not throw exception when body is null', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: null
      });

      expect(() => article.toJSONFor()).not.toThrow();
    });

    it('should not throw exception when body is undefined', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test'
      });

      expect(() => article.toJSONFor()).not.toThrow();
    });

    it('should handle body with only special characters', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: '!@#$%^&*()'
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(1);
    });

    it('should handle body with mixed content (words, numbers, special chars)', () => {
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: 'word1 123 word2 !@# word3'
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(1);
    });

    it('should handle very long articles (10000 words)', () => {
      const words = Array(10000).fill('word').join(' ');
      const article = new ArticleModel({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: words
      });

      const json = article.toJSONFor();
      expect(json.readingTime).toBe(50);
    });
  });
});