import { Article } from './article.model';
import { Comment } from './comment.model';

describe('Article Model', () => {
  describe('Article Interface', () => {
    it('should allow creation of Article with all required properties', () => {
      const article: Article = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content',
        comments: [],
        favorited: false
      };

      expect(article.id).toBe(1);
      expect(article.title).toBe('Test Article');
      expect(article.slug).toBe('test-article');
      expect(article.description).toBe('Test description');
      expect(article.body).toBe('Test body content');
      expect(article.comments).toEqual([]);
      expect(article.favorited).toBe(false);
    });

    it('should allow creation of Article without readingTime property', () => {
      const article: Article = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content',
        comments: [],
        favorited: false
      };

      expect(article.readingTime).toBeUndefined();
    });

    it('should allow creation of Article with readingTime property', () => {
      const article: Article = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content',
        readingTime: 5,
        comments: [],
        favorited: false
      };

      expect(article.readingTime).toBe(5);
    });

    it('should accept readingTime as a number type', () => {
      const article: Article = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content',
        readingTime: 10,
        comments: [],
        favorited: false
      };

      expect(typeof article.readingTime).toBe('number');
    });

    it('should allow readingTime to be undefined when optional', () => {
      const article: Article = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content',
        readingTime: undefined,
        comments: [],
        favorited: false
      };

      expect(article.readingTime).toBeUndefined();
    });

    it('should allow readingTime with decimal values', () => {
      const article: Article = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content',
        readingTime: 2.5,
        comments: [],
        favorited: false
      };

      expect(article.readingTime).toBe(2.5);
    });

    it('should allow readingTime with zero value', () => {
      const article: Article = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content',
        readingTime: 0,
        comments: [],
        favorited: false
      };

      expect(article.readingTime).toBe(0);
    });

    it('should maintain readingTime property position after body field', () => {
      const article: Article = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content',
        readingTime: 3,
        comments: [],
        favorited: true
      };

      const keys = Object.keys(article);
      const bodyIndex = keys.indexOf('body');
      const readingTimeIndex = keys.indexOf('readingTime');
      const commentsIndex = keys.indexOf('comments');

      expect(readingTimeIndex).toBeGreaterThan(bodyIndex);
      expect(readingTimeIndex).toBeLessThan(commentsIndex);
    });

    it('should allow Article with comments array', () => {
      const comment: Comment = {
        id: 1,
        body: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'testuser',
          bio: null,
          image: null,
          following: false
        }
      };

      const article: Article = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content',
        readingTime: 4,
        comments: [comment],
        favorited: false
      };

      expect(article.comments.length).toBe(1);
      expect(article.comments[0]).toEqual(comment);
    });

    it('should allow favorited to be true or false', () => {
      const articleFavorited: Article = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        description: 'Test description',
        body: 'Test body content',
        readingTime: 2,
        comments: [],
        favorited: true
      };

      const articleNotFavorited: Article = {
        id: 2,
        title: 'Test Article 2',
        slug: 'test-article-2',
        description: 'Test description 2',
        body: 'Test body content 2',
        readingTime: 3,
        comments: [],
        favorited: false
      };

      expect(articleFavorited.favorited).toBe(true);
      expect(articleNotFavorited.favorited).toBe(false);
    });
  });
});