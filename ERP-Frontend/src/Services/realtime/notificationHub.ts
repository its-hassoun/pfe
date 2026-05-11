import * as signalR from '@microsoft/signalr';
import { hubBaseUrl, tokenStore } from '../api';

export type HubEventHandler<T = unknown> = (payload: T) => void;

export interface NotificationHubClient {
  start(): Promise<void>;
  stop(): Promise<void>;
  on<T = unknown>(event: string, handler: HubEventHandler<T>): () => void;
}

export function createNotificationHub(): NotificationHubClient {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubBaseUrl, {
      accessTokenFactory: () => tokenStore.get() ?? '',
      transport:
        signalR.HttpTransportType.WebSockets |
        signalR.HttpTransportType.ServerSentEvents |
        signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  return {
    async start() {
      if (connection.state === signalR.HubConnectionState.Disconnected) {
        try {
          await connection.start();
        } catch (err) {
          console.warn('SignalR connection failed:', err);
        }
      }
    },
    async stop() {
      if (connection.state !== signalR.HubConnectionState.Disconnected) {
        await connection.stop();
      }
    },
    on(event, handler) {
      connection.on(event, handler as any);
      return () => connection.off(event, handler as any);
    },
  };
}
