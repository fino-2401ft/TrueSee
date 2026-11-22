import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfigService } from './config/config.module.js';

export const API_PREFIX = 'api/v1';

/** Settings shared by `main.ts` and the integration tests. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  (
    app.getHttpAdapter().getInstance() as { disable(setting: string): void }
  ).disable('x-powered-by');

  if (app.get(AppConfigService).get('NODE_ENV') === 'development') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('TrueSee API')
        .setVersion('0.1.0')
        .addServer(`/${API_PREFIX}`)
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }
}
