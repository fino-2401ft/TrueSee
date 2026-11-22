import 'dotenv/config';
import { execSync } from 'node:child_process';

const DEFAULT_TEST_DATABASE_URL =
  'postgresql://truesee:truesee_dev_password@localhost:5432/truesee_test';

export default function globalSetup(): void {
  // Test workers inherit this and point DATABASE_URL at it (see integration/setup-env.ts).
  process.env.TEST_DATABASE_URL ??= DEFAULT_TEST_DATABASE_URL;

  execSync('npx prisma migrate deploy', {
    cwd: `${import.meta.dirname}/..`,
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
