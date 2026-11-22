import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReachabilityState } from '../../src/domain/connectionState';
import type { ConfigResult } from '../../src/infrastructure/config';
import { AppShellScreen } from '../../src/presentation/AppShellScreen';

const okConfig: ConfigResult = {
  ok: true,
  config: { apiBaseUrl: 'http://10.0.2.2:3000/api/v1', appEnv: 'development' },
};

function deferred(): {
  promise: Promise<ReachabilityState>;
  resolve: (state: ReachabilityState) => void;
} {
  let resolve: (state: ReachabilityState) => void = () => undefined;
  const promise = new Promise<ReachabilityState>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('AppShellScreen', () => {
  it('shows the title and environment', async () => {
    await render(
      <AppShellScreen
        config={okConfig}
        checkBackendStatus={() => Promise.resolve('reachable')}
      />,
    );

    expect(screen.getByTestId('app-shell-title')).toHaveTextContent('TrueSee');
    expect(screen.getByTestId('app-shell-environment')).toHaveTextContent(
      'Environment: development',
    );
  });

  it('shows "Checking backend…" without Retry while the check runs', async () => {
    const pending = deferred();
    await render(
      <AppShellScreen
        config={okConfig}
        checkBackendStatus={() => pending.promise}
      />,
    );

    expect(screen.getByTestId('app-shell-connection')).toHaveTextContent(
      'Checking backend…',
    );
    expect(screen.queryByTestId('app-shell-retry')).toBeNull();
  });

  it.each([
    ['reachable', 'Backend: reachable'],
    ['databaseUnavailable', 'Backend: reachable, database unavailable'],
    ['unreachable', 'Backend: unreachable'],
  ] as const)(
    'shows the exact text for %s with Retry visible',
    async (state, text) => {
      await render(
        <AppShellScreen
          config={okConfig}
          checkBackendStatus={() => Promise.resolve(state)}
        />,
      );

      expect(await screen.findByText(text)).toBeOnTheScreen();
      expect(screen.getByTestId('app-shell-retry')).toBeOnTheScreen();
    },
  );

  it('re-runs the check when Retry is pressed', async () => {
    const second = deferred();
    const check = jest
      .fn<Promise<ReachabilityState>, []>()
      .mockResolvedValueOnce('unreachable')
      .mockReturnValueOnce(second.promise);
    await render(
      <AppShellScreen config={okConfig} checkBackendStatus={check} />,
    );
    await screen.findByText('Backend: unreachable');

    await fireEvent.press(screen.getByTestId('app-shell-retry'));

    expect(screen.getByTestId('app-shell-connection')).toHaveTextContent(
      'Checking backend…',
    );
    expect(screen.queryByTestId('app-shell-retry')).toBeNull();
    second.resolve('reachable');
    expect(await screen.findByText('Backend: reachable')).toBeOnTheScreen();
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('shows the misconfigured text naming the variable, hides Retry, and makes no request', async () => {
    const check = jest.fn<Promise<ReachabilityState>, []>();
    await render(
      <AppShellScreen
        config={{ ok: false, variable: 'EXPO_PUBLIC_API_BASE_URL' }}
        checkBackendStatus={check}
      />,
    );

    expect(screen.getByTestId('app-shell-connection')).toHaveTextContent(
      'Configuration error: EXPO_PUBLIC_API_BASE_URL is missing or invalid',
    );
    expect(screen.queryByTestId('app-shell-retry')).toBeNull();
    expect(check).not.toHaveBeenCalled();
  });

  it('contains no buttons other than Retry and no navigation elements', async () => {
    await render(
      <AppShellScreen
        config={okConfig}
        checkBackendStatus={() => Promise.resolve('reachable')}
      />,
    );
    await screen.findByText('Backend: reachable');

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button')).toHaveTextContent('Retry');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(screen.queryAllByRole('menu')).toHaveLength(0);
  });
});
