import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

interface SuccessResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: unknown): SuccessResponse => {
        const formatted = {
          success: true,
          statusCode,
          message: this.extractMessage(data),
          data: this.extractData(data),
          timestamp: new Date().toISOString(),
        };

        return formatted;
      }),
    );
  }

  private extractMessage(data: unknown): string {
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as Record<string, unknown>).message === 'string'
    ) {
      return (data as Record<string, unknown>).message as string;
    }

    return 'Success';
  }

  private extractData(data: unknown): unknown {
    if (typeof data === 'object' && data !== null && 'data' in data) {
      return (data as Record<string, unknown>).data;
    }
    return data;
  }
}
