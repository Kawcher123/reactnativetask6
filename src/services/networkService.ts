import NetInfo from '@react-native-community/netinfo';
import { NetworkState } from '../types';

class NetworkService {
  private listeners: ((state: NetworkState) => void)[] = [];
  private currentState: NetworkState = {
    isConnected: true,
    isInternetReachable: true,
  };

  constructor() {
    this.initializeNetworkListener();
  }

  private async initializeNetworkListener() {
    // Get initial network state
    const netInfoState = await NetInfo.fetch();
    this.updateNetworkState(netInfoState);

    // Listen for network changes
    NetInfo.addEventListener((state) => {
      this.updateNetworkState(state);
    });
  }

  private updateNetworkState(netInfoState: any) {
    const newState: NetworkState = {
      isConnected: netInfoState.isConnected ?? false,
      isInternetReachable: netInfoState.isInternetReachable ?? false,
    };

    // Only update if state actually changed
    if (
      this.currentState.isConnected !== newState.isConnected ||
      this.currentState.isInternetReachable !== newState.isInternetReachable
    ) {
      this.currentState = newState;
      this.notifyListeners(newState);
    }
  }

  private notifyListeners(state: NetworkState) {
    this.listeners.forEach(listener => listener(state));
  }

  // Subscribe to network state changes
  subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get current network state
  getCurrentState(): NetworkState {
    return { ...this.currentState };
  }

  // Check if currently online
  isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable;
  }

  // Check if currently offline
  isOffline(): boolean {
    return !this.isOnline();
  }

  // Wait for network to be available
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.subscribe((state) => {
        if (state.isConnected && state.isInternetReachable) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  // Force refresh network state
  async refreshNetworkState(): Promise<NetworkState> {
    const netInfoState = await NetInfo.fetch();
    this.updateNetworkState(netInfoState);
    return this.currentState;
  }
}

export const networkService = new NetworkService();
export default networkService;
