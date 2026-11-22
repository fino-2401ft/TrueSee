import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Not required by `prisma generate`; migrate commands fail with a clear error if unset.
    url: process.env.DATABASE_URL ?? '',
  },
});
