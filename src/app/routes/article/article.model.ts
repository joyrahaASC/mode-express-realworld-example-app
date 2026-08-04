import { Article } from './article.model';
import { Comment } from './comment.model';

describe('Article Interface', () => {
  describe('readingTime field', () => {
    it('should allow Article object without readingTime field (optional field)', () => {
      const article: Article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test Body',
        tagList: ['test', 'article'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: { username: 'testuser' },
        comments: []
      };

      expect(article).toBeDefined();
      expect(article.readingTime).toBeUndefined();
    });

    it('should allow Article object with readingTime field set to a number', () => {
      const article: Article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test Body',
        tagList: ['test', 'article'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: { username: 'testuser' },
        readingTime: 5,
        comments: []
      };

      expect(article).toBeDefined();
      expect(article.readingTime).toBe(5);
      expect(typeof article.readingTime).toBe('number');
    });

    it('should allow Article object with readingTime field set to zero', () => {
      const article: Article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test Body',
        tagList: ['test', 'article'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: { username: 'testuser' },
        readingTime: 0,
        comments: []
      };

      expect(article).toBeDefined();
      expect(article.readingTime).toBe(0);
    });

    it('should allow Article object with readingTime field set to decimal number', () => {
      const article: Article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test Body',
        tagList: ['test', 'article'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: { username: 'testuser' },
        readingTime: 3.5,
        comments: []
      };

      expect(article).toBeDefined();
      expect(article.readingTime).toBe(3.5);
    });

    it('should maintain backward compatibility with existing Article objects', () => {
      const legacyArticle: Article = {
        slug: 'legacy-article',
        title: 'Legacy Article',
        description: 'Legacy Description',
        body: 'Legacy Body',
        tagList: ['legacy'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        favorited: true,
        favoritesCount: 10,
        author: { username: 'legacyuser' },
        comments: []
      };

      expect(legacyArticle).toBeDefined();
      expect(legacyArticle.slug).toBe('legacy-article');
      expect(legacyArticle.title).toBe('Legacy Article');
      expect(legacyArticle.readingTime).toBeUndefined();
    });

    it('should allow Article object with all fields including readingTime and comments', () => {
      const comment: Comment = {
        id: 1,
        body: 'Test comment',
        createdAt: new Date(),
        author: { username: 'commenter' }
      };

      const article: Article = {
        slug: 'full-article',
        title: 'Full Article',
        description: 'Full Description',
        body: 'Full Body with enough content to have a reading time',
        tagList: ['full', 'test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: true,
        favoritesCount: 25,
        author: { username: 'fulluser', bio: 'Test bio', image: 'test.jpg' },
        readingTime: 8,
        comments: [comment]
      };

      expect(article).toBeDefined();
      expect(article.readingTime).toBe(8);
      expect(article.comments).toHaveLength(1);
      expect(article.comments[0]).toBe(comment);
    });

    it('should verify readingTime field is positioned after author field', () => {
      const article: Article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test Body',
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: { username: 'testuser' },
        readingTime: 5,
        comments: []
      };

      const keys = Object.keys(article);
      const authorIndex = keys.indexOf('author');
      const readingTimeIndex = keys.indexOf('readingTime');
      const commentsIndex = keys.indexOf('comments');

      expect(authorIndex).toBeGreaterThanOrEqual(0);
      expect(readingTimeIndex).toBeGreaterThan(authorIndex);
      expect(commentsIndex).toBeGreaterThan(readingTimeIndex);
    });

    it('should allow large readingTime values for long articles', () => {
      const article: Article = {
        slug: 'long-article',
        title: 'Very Long Article',
        description: 'A very long article description',
        body: 'A'.repeat(100000),
        tagList: ['long'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: { username: 'testuser' },
        readingTime: 500,
        comments: []
      };

      expect(article).toBeDefined();
      expect(article.readingTime).toBe(500);
      expect(article.readingTime).toBeGreaterThan(0);
    });
  });

  describe('Article interface structure validation', () => {
    it('should have all required fields defined', () => {
      const article: Article = {
        slug: 'test-slug',
        title: 'Test Title',
        description: 'Test Description',
        body: 'Test Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {},
        comments: []
      };

      expect(article.slug).toBeDefined();
      expect(article.title).toBeDefined();
      expect(article.description).toBeDefined();
      expect(article.body).toBeDefined();
      expect(article.tagList).toBeDefined();
      expect(article.createdAt).toBeDefined();
      expect(article.updatedAt).toBeDefined();
      expect(article.favorited).toBeDefined();
      expect(article.favoritesCount).toBeDefined();
      expect(article.author).toBeDefined();
      expect(article.comments).toBeDefined();
    });

    it('should maintain correct field order in Article interface', () => {
      const article: Article = {
        slug: 'ordered-article',
        title: 'Ordered Article',
        description: 'Ordered Description',
        body: 'Ordered Body',
        tagList: ['order'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 5,
        author: { username: 'ordereduser' },
        readingTime: 3,
        comments: []
      };

      const expectedFieldOrder = [
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
        'comments'
      ];

      const actualKeys = Object.keys(article);
      expectedFieldOrder.forEach((field) => {
        expect(actualKeys).toContain(field);
      });
    });
  });
});