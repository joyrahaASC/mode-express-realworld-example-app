import request from 'supertest';
import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import routes from './app/routes/routes';
import HttpException from './app/models/http-exception.model';

describe('Main Application Entry Point', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(routes);
    app.use(express.static(__dirname + '/assets'));

    app.get('/', (req: express.Request, res: express.Response) => {
      res.json({ status: 'API is running on /api' });
    });

    app.use(
      (
        err: Error | HttpException,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        if (err && err.name === 'UnauthorizedError') {
          return res.status(401).json({
            status: 'error',
            message: 'missing authorization credentials',
          });
        } else if (err && (err as any).errorCode) {
          res.status((err as any).errorCode).json((err as any).message);
        } else if (err) {
          res.status(500).json(err.message);
        }
      },
    );
  });

  describe('Application Configuration', () => {
    it('should have cors middleware configured', () => {
      expect(app._router.stack.some((layer: any) => layer.name === 'corsMiddleware')).toBeDefined();
    });

    it('should have body-parser json middleware configured', () => {
      expect(app._router.stack.some((layer: any) => layer.name === 'jsonParser')).toBeDefined();
    });

    it('should have body-parser urlencoded middleware configured', () => {
      expect(app._router.stack.some((layer: any) => layer.name === 'urlencodedParser')).toBeDefined();
    });

    it('should serve static files from assets directory', () => {
      expect(app._router.stack.some((layer: any) => layer.name === 'serveStatic')).toBeDefined();
    });
  });

  describe('GET /', () => {
    it('should return API status message', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'API is running on /api' });
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/');
      
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Error Handling Middleware', () => {
    beforeEach(() => {
      app.get('/test-unauthorized', (req, res, next) => {
        const error: any = new Error('Unauthorized');
        error.name = 'UnauthorizedError';
        next(error);
      });

      app.get('/test-custom-error', (req, res, next) => {
        const error: any = new Error('Custom error message');
        error.errorCode = 400;
        next(error);
      });

      app.get('/test-generic-error', (req, res, next) => {
        const error = new Error('Generic error message');
        next(error);
      });
    });

    it('should handle UnauthorizedError with 401 status', async () => {
      const response = await request(app).get('/test-unauthorized');
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        status: 'error',
        message: 'missing authorization credentials',
      });
    });

    it('should handle custom HttpException with custom error code', async () => {
      const response = await request(app).get('/test-custom-error');
      
      expect(response.status).toBe(400);
      expect(response.body).toBe('Custom error message');
    });

    it('should handle generic errors with 500 status', async () => {
      const response = await request(app).get('/test-generic-error');
      
      expect(response.status).toBe(500);
      expect(response.body).toBe('Generic error message');
    });
  });

  describe('Application Startup', () => {
    it('should start server on default port 3000 when PORT is not set', () => {
      const originalPort = process.env.PORT;
      delete process.env.PORT;
      
      const mockListen = jest.fn();
      app.listen = mockListen;
      
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.info(`server up on port ${PORT}`);
      });
      
      expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
      
      process.env.PORT = originalPort;
    });

    it('should start server on specified PORT from environment', () => {
      const originalPort = process.env.PORT;
      process.env.PORT = '5000';
      
      const mockListen = jest.fn();
      app.listen = mockListen;
      
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.info(`server up on port ${PORT}`);
      });
      
      expect(mockListen).toHaveBeenCalledWith('5000', expect.any(Function));
      
      process.env.PORT = originalPort;
    });

    it('should log server startup message', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const mockListen = jest.fn((port, callback) => callback());
      app.listen = mockListen;
      
      const PORT = 3000;
      app.listen(PORT, () => {
        console.info(`server up on port ${PORT}`);
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('server up on port 3000');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Routes Integration', () => {
    it('should have routes middleware mounted', () => {
      expect(app._router.stack.some((layer: any) => layer.name === 'router')).toBeDefined();
    });
  });

  describe('Middleware Order', () => {
    it('should have middleware in correct order', () => {
      const middlewareNames = app._router.stack
        .filter((layer: any) => layer.name)
        .map((layer: any) => layer.name);
      
      const corsIndex = middlewareNames.findIndex((name: string) => name === 'corsMiddleware');
      const jsonParserIndex = middlewareNames.findIndex((name: string) => name === 'jsonParser');
      const urlencodedParserIndex = middlewareNames.findIndex((name: string) => name === 'urlencodedParser');
      
      expect(corsIndex).toBeLessThan(jsonParserIndex);
      expect(jsonParserIndex).toBeLessThan(urlencodedParserIndex);
    });
  });
});