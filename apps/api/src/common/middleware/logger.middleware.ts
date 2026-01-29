import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const duration = Date.now() - startTime;

      const message = `${method} ${originalUrl} ${statusCode} ${contentLength} - ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(message, { ip, userAgent });
      } else if (statusCode >= 400) {
        this.logger.warn(message, { ip, userAgent });
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
