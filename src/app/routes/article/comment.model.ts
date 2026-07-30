import { Comment } from './comment.model';
import { Article } from './article.model';

describe('Comment Model', () => {
  describe('Comment Interface Structure', () => {
    it('should have required id property of type number', () => {
      const comment: Comment = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        body: 'Test comment'
      };
      
      expect(comment.id).toBeDefined();
      expect(typeof comment.id).toBe('number');
    });

    it('should have required createdAt property of type Date', () => {
      const comment: Comment = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        body: 'Test comment'
      };
      
      expect(comment.createdAt).toBeDefined();
      expect(comment.createdAt instanceof Date).toBe(true);
    });

    it('should have required updatedAt property of type Date', () => {
      const comment: Comment = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        body: 'Test comment'
      };
      
      expect(comment.updatedAt).toBeDefined();
      expect(comment.updatedAt instanceof Date).toBe(true);
    });

    it('should have required body property of type string', () => {
      const comment: Comment = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        body: 'Test comment'
      };
      
      expect(comment.body).toBeDefined();
      expect(typeof comment.body).toBe('string');
    });

    it('should have optional article property of type Article', () => {
      const mockArticle: Article = {} as Article;
      const comment: Comment = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        body: 'Test comment',
        article: mockArticle
      };
      
      expect(comment.article).toBeDefined();
      expect(comment.article).toBe(mockArticle);
    });

    it('should allow comment without article property', () => {
      const comment: Comment = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        body: 'Test comment'
      };
      
      expect(comment.article).toBeUndefined();
    });

    it('should create valid comment with all properties', () => {
      const mockArticle: Article = {} as Article;
      const createdDate = new Date('2023-01-01');
      const updatedDate = new Date('2023-01-02');
      
      const comment: Comment = {
        id: 123,
        createdAt: createdDate,
        updatedAt: updatedDate,
        body: 'This is a test comment body',
        article: mockArticle
      };
      
      expect(comment.id).toBe(123);
      expect(comment.createdAt).toBe(createdDate);
      expect(comment.updatedAt).toBe(updatedDate);
      expect(comment.body).toBe('This is a test comment body');
      expect(comment.article).toBe(mockArticle);
    });

    it('should handle empty body string', () => {
      const comment: Comment = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        body: ''
      };
      
      expect(comment.body).toBe('');
      expect(typeof comment.body).toBe('string');
    });

    it('should handle long body text', () => {
      const longBody = 'a'.repeat(10000);
      const comment: Comment = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        body: longBody
      };
      
      expect(comment.body).toBe(longBody);
      expect(comment.body.length).toBe(10000);
    });

    it('should handle special characters in body', () => {
      const specialBody = '!@#$%^&*()_+-=[]{}|;:\'',.<>?/~`';
      const comment: Comment = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        body: specialBody
      };
      
      expect(comment.body).toBe(specialBody);
    });
  });
});