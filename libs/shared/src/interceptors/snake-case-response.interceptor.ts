import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SnakeCaseResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        return next.handle().pipe(map((data) => this.transformValue(data)));
    }

    private transformValue(value: unknown): unknown {
        if (value === null || value === undefined) {
            return value;
        }

        if (Array.isArray(value)) {
            return value.map((item) => this.transformValue(item));
        }

        if (typeof value !== 'object') {
            return value;
        }

        if (
            value instanceof Date ||
            value instanceof RegExp ||
            value instanceof StreamableFile ||
            Buffer.isBuffer(value)
        ) {
            return value;
        }

        const source = value as Record<string, unknown>;
        const target: Record<string, unknown> = {};

        for (const [key, nestedValue] of Object.entries(source)) {
            target[this.toSnakeCase(key)] = this.transformValue(nestedValue);
        }

        return target;
    }

    private toSnakeCase(key: string): string {
        return key
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .toLowerCase();
    }
}
