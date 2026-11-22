import { createCheckBackendStatus } from './src/application/checkBackendStatus';
import { readConfig } from './src/infrastructure/config';
import { createHealthClient } from './src/infrastructure/healthClient';
import { AppShellScreen } from './src/presentation/AppShellScreen';

const config = readConfig();
const checkBackendStatus = config.ok
  ? createCheckBackendStatus(createHealthClient(config.config.apiBaseUrl))
  : () => Promise.resolve('unreachable' as const);

export default function App(): React.JSX.Element {
  return (
    <AppShellScreen config={config} checkBackendStatus={checkBackendStatus} />
  );
}
