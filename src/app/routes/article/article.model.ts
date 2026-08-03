import { ArticleImpl } from './article.model';

describe('ArticleImpl', () => {
  describe('calculateReadingTime', () => {
    it('should return 1 minute when body is undefined', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: undefined,
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should return 1 minute when body is null', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: null as any,
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should return 1 minute when body is an empty string', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: '',
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should return 1 minute when body contains only whitespace', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: '   \n\t  ',
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should return 1 minute for body with less than 200 words', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'This is a short article with only a few words.',
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should return 1 minute for body with exactly 1 word', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Word',
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should return 1 minute for body with exactly 200 words', () => {
      const words = Array(200).fill('word').join(' ');
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: words,
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should return 2 minutes for body with 201 words', () => {
      const words = Array(201).fill('word').join(' ');
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: words,
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(2);
    });

    it('should return 2 minutes for body with 400 words', () => {
      const words = Array(400).fill('word').join(' ');
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: words,
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(2);
    });

    it('should return 3 minutes for body with 401 words', () => {
      const words = Array(401).fill('word').join(' ');
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: words,
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(3);
    });

    it('should return 5 minutes for body with 1000 words', () => {
      const words = Array(1000).fill('word').join(' ');
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: words,
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(5);
    });

    it('should correctly filter out empty strings from word array', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Word1   Word2\n\nWord3\t\tWord4     Word5',
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should handle body with multiple consecutive spaces', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Word1     Word2     Word3',
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should handle body with tabs and newlines', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Word1\tWord2\nWord3\r\nWord4',
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should handle body with mixed whitespace characters', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: '  \t\n  Word1  \n\t  Word2  \r\n  ',
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should not modify article properties when called', () => {
      const originalBody = 'This is a test article body.';
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: originalBody,
        comments: [],
        favorited: false
      });

      article.calculateReadingTime();

      expect(article.body).toBe(originalBody);
      expect(article.id).toBe(1);
      expect(article.title).toBe('Test Article');
      expect(article.slug).toBe('test-article');
      expect(article.description).toBe('Test description');
      expect(article.comments).toEqual([]);
      expect(article.favorited).toBe(false);
    });

    it('should return consistent results when called multiple times', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: Array(500).fill('word').join(' '),
        comments: [],
        favorited: false
      });

      const firstCall = article.calculateReadingTime();
      const secondCall = article.calculateReadingTime();
      const thirdCall = article.calculateReadingTime();

      expect(firstCall).toBe(3);
      expect(secondCall).toBe(3);
      expect(thirdCall).toBe(3);
    });

    it('should handle body with special characters and punctuation', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Hello, world! This is a test. Does it work? Yes, it does.',
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should use ceiling function for fractional minutes', () => {
      const words = Array(250).fill('word').join(' ');
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: words,
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(2);
    });

    it('should handle very long articles correctly', () => {
      const words = Array(10000).fill('word').join(' ');
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: words,
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(50);
    });

    it('should handle body with leading whitespace', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: '     This is a test article.',
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });

    it('should handle body with trailing whitespace', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'This is a test article.     ',
        comments: [],
        favorited: false
      });

      expect(article.calculateReadingTime()).toBe(1);
    });
  });

  describe('constructor', () => {
    it('should create article instance without affecting calculateReadingTime', () => {
      const article = new ArticleImpl({
        id: 1,
        title: 'Test',
        slug: 'test',
        description: 'Test',
        body: Array(300).fill('word').join(' ')
      });

      expect(article.calculateReadingTime()).toBe(2);
    });
  });
});