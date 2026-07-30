import getTags from './tag.service';
import prisma from '../../../prisma/prisma-client';
import { Tag } from './tag.model';

jest.mock('../../../prisma/prisma-client', () => ({
  __esModule: true,
  default: {
    tag: {
      findMany: jest.fn(),
    },
  },
}));

describe('TagService - getTags', () => {
  const mockPrismaTagFindMany = prisma.tag.findMany as jest.MockedFunction<typeof prisma.tag.findMany>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getTags without id parameter', () => {
    it('should return an array of tag names when tags exist', async () => {
      const mockTags: Tag[] = [
        { name: 'javascript' },
        { name: 'typescript' },
        { name: 'nodejs' },
      ];

      mockPrismaTagFindMany.mockResolvedValue(mockTags);

      const result = await getTags();

      expect(result).toEqual(['javascript', 'typescript', 'nodejs']);
      expect(mockPrismaTagFindMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaTagFindMany).toHaveBeenCalledWith({
        where: {
          articles: {
            some: {
              author: {
                OR: [{ demo: true }],
              },
            },
          },
        },
        select: {
          name: true,
        },
        orderBy: {
          articles: {
            _count: 'desc',
          },
        },
        take: 10,
      });
    });

    it('should return an empty array when no tags exist', async () => {
      mockPrismaTagFindMany.mockResolvedValue([]);

      const result = await getTags();

      expect(result).toEqual([]);
      expect(mockPrismaTagFindMany).toHaveBeenCalledTimes(1);
    });

    it('should query with demo: true in OR queries', async () => {
      mockPrismaTagFindMany.mockResolvedValue([]);

      await getTags();

      expect(mockPrismaTagFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            articles: {
              some: {
                author: {
                  OR: [{ demo: true }],
                },
              },
            },
          },
        })
      );
    });

    it('should limit results to 10 tags', async () => {
      mockPrismaTagFindMany.mockResolvedValue([]);

      await getTags();

      expect(mockPrismaTagFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should order tags by article count in descending order', async () => {
      mockPrismaTagFindMany.mockResolvedValue([]);

      await getTags();

      expect(mockPrismaTagFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            articles: {
              _count: 'desc',
            },
          },
        })
      );
    });
  });

  describe('getTags with id parameter', () => {
    it('should return tag names filtered by author id', async () => {
      const mockTags: Tag[] = [
        { name: 'react' },
        { name: 'vue' },
      ];

      mockPrismaTagFindMany.mockResolvedValue(mockTags);

      const result = await getTags(123);

      expect(result).toEqual(['react', 'vue']);
      expect(mockPrismaTagFindMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaTagFindMany).toHaveBeenCalledWith({
        where: {
          articles: {
            some: {
              author: {
                OR: [
                  { demo: true },
                  {
                    id: {
                      equals: 123,
                    },
                  },
                ],
              },
            },
          },
        },
        select: {
          name: true,
        },
        orderBy: {
          articles: {
            _count: 'desc',
          },
        },
        take: 10,
      });
    });

    it('should include both demo and id filters in OR queries when id is provided', async () => {
      mockPrismaTagFindMany.mockResolvedValue([]);

      await getTags(456);

      expect(mockPrismaTagFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            articles: {
              some: {
                author: {
                  OR: [
                    { demo: true },
                    {
                      id: {
                        equals: 456,
                      },
                    },
                  ],
                },
              },
            },
          },
        })
      );
    });

    it('should handle id parameter of 0', async () => {
      mockPrismaTagFindMany.mockResolvedValue([]);

      await getTags(0);

      expect(mockPrismaTagFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            articles: {
              some: {
                author: {
                  OR: [
                    { demo: true },
                    {
                      id: {
                        equals: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
        })
      );
    });

    it('should return empty array when no tags match the author id', async () => {
      mockPrismaTagFindMany.mockResolvedValue([]);

      const result = await getTags(999);

      expect(result).toEqual([]);
      expect(mockPrismaTagFindMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTags error handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaTagFindMany.mockRejectedValue(dbError);

      await expect(getTags()).rejects.toThrow('Database connection failed');
      expect(mockPrismaTagFindMany).toHaveBeenCalledTimes(1);
    });

    it('should propagate prisma errors when querying with id', async () => {
      const prismaError = new Error('Prisma query failed');
      mockPrismaTagFindMany.mockRejectedValue(prismaError);

      await expect(getTags(123)).rejects.toThrow('Prisma query failed');
      expect(mockPrismaTagFindMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTags data transformation', () => {
    it('should correctly map Tag objects to string array', async () => {
      const mockTags: Tag[] = [
        { name: 'tag1' },
        { name: 'tag2' },
        { name: 'tag3' },
        { name: 'tag4' },
        { name: 'tag5' },
      ];

      mockPrismaTagFindMany.mockResolvedValue(mockTags);

      const result = await getTags();

      expect(result).toHaveLength(5);
      expect(result).toEqual(['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
      expect(Array.isArray(result)).toBe(true);
      result.forEach(tag => {
        expect(typeof tag).toBe('string');
      });
    });

    it('should handle tags with special characters in names', async () => {
      const mockTags: Tag[] = [
        { name: 'C++' },
        { name: 'C#' },
        { name: 'Node.js' },
      ];

      mockPrismaTagFindMany.mockResolvedValue(mockTags);

      const result = await getTags();

      expect(result).toEqual(['C++', 'C#', 'Node.js']);
    });

    it('should handle tags with unicode characters', async () => {
      const mockTags: Tag[] = [
        { name: '日本語' },
        { name: 'español' },
        { name: 'français' },
      ];

      mockPrismaTagFindMany.mockResolvedValue(mockTags);

      const result = await getTags();

      expect(result).toEqual(['日本語', 'español', 'français']);
    });
  });

  describe('getTags query structure validation', () => {
    it('should select only name field from tags', async () => {
      mockPrismaTagFindMany.mockResolvedValue([]);

      await getTags();

      expect(mockPrismaTagFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            name: true,
          },
        })
      );
    });

    it('should query tags with articles that have matching authors', async () => {
      mockPrismaTagFindMany.mockResolvedValue([]);

      await getTags();

      expect(mockPrismaTagFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            articles: {
              some: expect.any(Object),
            },
          },
        })
      );
    });
  });
});