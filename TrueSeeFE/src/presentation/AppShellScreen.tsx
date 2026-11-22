import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  type ConnectionView,
  connectionText,
  type ReachabilityState,
} from '../domain/connectionState';
import type { ConfigResult } from '../infrastructure/config';

interface AppShellScreenProps {
  config: ConfigResult;
  checkBackendStatus: () => Promise<ReachabilityState>;
}

export function AppShellScreen({
  config,
  checkBackendStatus,
}: AppShellScreenProps): React.JSX.Element {
  const [view, setView] = useState<ConnectionView>(
    config.ok
      ? { state: 'checking' }
      : { state: 'misconfigured', variable: config.variable },
  );
  const mounted = useRef(true);

  const runCheck = useCallback(() => {
    void checkBackendStatus().then((state) => {
      if (mounted.current) setView({ state });
    });
  }, [checkBackendStatus]);

  useEffect(() => {
    mounted.current = true;
    if (config.ok) runCheck();
    return () => {
      mounted.current = false;
    };
  }, [config.ok, runCheck]);

  const retry = (): void => {
    setView({ state: 'checking' });
    runCheck();
  };

  const showRetry = view.state !== 'checking' && view.state !== 'misconfigured';

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text testID="app-shell-title" style={styles.title}>
        TrueSee
      </Text>
      <Text testID="app-shell-environment" style={styles.line}>
        Environment: {config.ok ? config.config.appEnv : 'unknown'}
      </Text>
      <Text testID="app-shell-connection" style={styles.line}>
        {connectionText(view)}
      </Text>
      {showRetry && (
        <Pressable
          testID="app-shell-retry"
          accessibilityRole="button"
          onPress={retry}
          style={styles.retry}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 16 },
  line: { fontSize: 16, marginBottom: 8, textAlign: 'center' },
  retry: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1f6feb',
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
