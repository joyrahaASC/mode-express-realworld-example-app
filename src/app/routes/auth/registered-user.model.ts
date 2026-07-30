import { RegisteredUser } from './registered-user.model';

describe('RegisteredUser', () => {
  describe('Interface Structure', () => {
    it('should allow creation of a valid RegisteredUser object with all required fields', () => {
      const user: RegisteredUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        token: 'jwt-token-string'
      };

      expect(user.id).toBe(1);
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.bio).toBe('Test bio');
      expect(user.image).toBe('https://example.com/image.jpg');
      expect(user.token).toBe('jwt-token-string');
    });

    it('should allow bio to be null', () => {
      const user: RegisteredUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: 'https://example.com/image.jpg',
        token: 'jwt-token-string'
      };

      expect(user.bio).toBeNull();
    });

    it('should allow image to be null', () => {
      const user: RegisteredUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: null,
        token: 'jwt-token-string'
      };

      expect(user.image).toBeNull();
    });

    it('should allow both bio and image to be null', () => {
      const user: RegisteredUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'jwt-token-string'
      };

      expect(user.bio).toBeNull();
      expect(user.image).toBeNull();
    });

    it('should have id as number type', () => {
      const user: RegisteredUser = {
        id: 12345,
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'jwt-token-string'
      };

      expect(typeof user.id).toBe('number');
    });

    it('should have email as string type', () => {
      const user: RegisteredUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'jwt-token-string'
      };

      expect(typeof user.email).toBe('string');
    });

    it('should have username as string type', () => {
      const user: RegisteredUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'jwt-token-string'
      };

      expect(typeof user.username).toBe('string');
    });

    it('should have token as string type', () => {
      const user: RegisteredUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'jwt-token-string'
      };

      expect(typeof user.token).toBe('string');
    });
  });
});