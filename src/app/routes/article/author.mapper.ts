import authorMapper from './author.mapper';
import { User } from '../auth/user.model';

describe('authorMapper', () => {
  describe('Basic author mapping', () => {
    it('should map author username correctly', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.username).toBe('testuser');
    });

    it('should map author bio correctly', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.bio).toBe('Test bio');
    });

    it('should map author image correctly', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.image).toBe('http://example.com/image.jpg');
    });

    it('should handle null bio', () => {
      const author = {
        username: 'testuser',
        bio: null,
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.bio).toBeNull();
    });

    it('should handle null image', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: null,
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.image).toBeNull();
    });

    it('should handle undefined bio', () => {
      const author = {
        username: 'testuser',
        bio: undefined,
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.bio).toBeUndefined();
    });

    it('should handle undefined image', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: undefined,
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.image).toBeUndefined();
    });
  });

  describe('Following status without user id', () => {
    it('should set following to false when no id is provided', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }, { id: 2 }],
      };

      const result = authorMapper(author);

      expect(result.following).toBe(false);
    });

    it('should set following to false when id is undefined', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }, { id: 2 }],
      };

      const result = authorMapper(author, undefined);

      expect(result.following).toBe(false);
    });

    it('should set following to false when id is null', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }, { id: 2 }],
      };

      const result = authorMapper(author, null as any);

      expect(result.following).toBe(false);
    });

    it('should set following to false when id is 0', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }, { id: 2 }],
      };

      const result = authorMapper(author, 0);

      expect(result.following).toBe(false);
    });
  });

  describe('Following status with user id', () => {
    it('should set following to true when user is in followedBy list', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };

      const result = authorMapper(author, 2);

      expect(result.following).toBe(true);
    });

    it('should set following to false when user is not in followedBy list', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };

      const result = authorMapper(author, 5);

      expect(result.following).toBe(false);
    });

    it('should set following to false when followedBy is empty array', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author, 1);

      expect(result.following).toBe(false);
    });

    it('should handle followedBy with single matching user', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }],
      };

      const result = authorMapper(author, 1);

      expect(result.following).toBe(true);
    });

    it('should handle followedBy with single non-matching user', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }],
      };

      const result = authorMapper(author, 2);

      expect(result.following).toBe(false);
    });

    it('should match user at the beginning of followedBy list', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 10 }, { id: 20 }, { id: 30 }],
      };

      const result = authorMapper(author, 10);

      expect(result.following).toBe(true);
    });

    it('should match user at the end of followedBy list', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 10 }, { id: 20 }, { id: 30 }],
      };

      const result = authorMapper(author, 30);

      expect(result.following).toBe(true);
    });

    it('should match user in the middle of followedBy list', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 10 }, { id: 20 }, { id: 30 }],
      };

      const result = authorMapper(author, 20);

      expect(result.following).toBe(true);
    });
  });

  describe('Edge cases for followedBy', () => {
    it('should handle null followedBy gracefully', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: null,
      };

      expect(() => authorMapper(author, 1)).toThrow();
    });

    it('should handle undefined followedBy gracefully', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: undefined,
      };

      expect(() => authorMapper(author, 1)).toThrow();
    });

    it('should handle followedBy with partial user objects', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1, username: 'user1' }, { id: 2 }, { id: 3, email: 'test@test.com' }],
      };

      const result = authorMapper(author, 2);

      expect(result.following).toBe(true);
    });

    it('should handle followedBy with users missing id', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ username: 'user1' }, { id: 2 }, { username: 'user3' }],
      };

      const result = authorMapper(author, 2);

      expect(result.following).toBe(true);
    });

    it('should not match when all users in followedBy have no id', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ username: 'user1' }, { username: 'user2' }],
      };

      const result = authorMapper(author, 1);

      expect(result.following).toBe(false);
    });
  });

  describe('Complete object mapping', () => {
    it('should return complete mapped object with all fields', () => {
      const author = {
        username: 'johndoe',
        bio: 'Software developer',
        image: 'http://example.com/johndoe.jpg',
        followedBy: [{ id: 5 }, { id: 10 }],
      };

      const result = authorMapper(author, 5);

      expect(result).toEqual({
        username: 'johndoe',
        bio: 'Software developer',
        image: 'http://example.com/johndoe.jpg',
        following: true,
      });
    });

    it('should return complete mapped object when not following', () => {
      const author = {
        username: 'janedoe',
        bio: 'Designer',
        image: 'http://example.com/janedoe.jpg',
        followedBy: [{ id: 5 }, { id: 10 }],
      };

      const result = authorMapper(author, 15);

      expect(result).toEqual({
        username: 'janedoe',
        bio: 'Designer',
        image: 'http://example.com/janedoe.jpg',
        following: false,
      });
    });

    it('should return complete mapped object without user id', () => {
      const author = {
        username: 'testuser',
        bio: 'Tester',
        image: 'http://example.com/test.jpg',
        followedBy: [{ id: 1 }],
      };

      const result = authorMapper(author);

      expect(result).toEqual({
        username: 'testuser',
        bio: 'Tester',
        image: 'http://example.com/test.jpg',
        following: false,
      });
    });
  });

  describe('Type safety and optional chaining', () => {
    it('should handle author with null followedBy when id is provided', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: null,
      };

      expect(() => authorMapper(author, 1)).toThrow();
    });

    it('should handle author without followedBy property when id is provided', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
      };

      expect(() => authorMapper(author, 1)).toThrow();
    });

    it('should handle empty author object', () => {
      const author = {};

      const result = authorMapper(author);

      expect(result.username).toBeUndefined();
      expect(result.bio).toBeUndefined();
      expect(result.image).toBeUndefined();
      expect(result.following).toBe(false);
    });
  });
});