import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import {
  AppConfigService,
  ConfigInvalidError,
} from './config/config.module.js';
import { DatabaseUnreachableError } from './database/connect-with-timeout.js';
import { createBootstrapLogger } from './logging/logging.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    abortOnError: false,
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  configureApp(app);

  const config = app.get(AppConfigService);
  await app.listen(config.get('PORT'), config.get('HOST'));
  app
    .get(Logger)
    .log(
      `Listening on ${config.get('HOST')}:${config.get('PORT')}`,
      'Bootstrap',
    );
}

bootstrap().catch((error: unknown) => {
  const logger = createBootstrapLogger();
  if (error instanceof ConfigInvalidError) {
    logger.fatal({ code: error.code, variables: error.errors }, error.message);
  } else if (error instanceof DatabaseUnreachableError) {
    logger.fatal({ code: error.code }, error.message);
  } else {
    logger.fatal({ err: error }, 'Startup failed');
  }
  process.exitCode = 1;
  setImmediate(() => process.exit(1));
});
