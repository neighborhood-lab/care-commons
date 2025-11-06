// Development tool for testing offline scenarios
export class OfflineSimulator {
  private static isSimulatingOffline = false;
  private static originalFetch: typeof fetch;

  static enable() {
    this.isSimulatingOffline = true;
    console.warn('🔴 OFFLINE MODE SIMULATED');

    // Intercept fetch to simulate network failures
    if (!this.originalFetch) {
      this.originalFetch = global.fetch;
    }

    global.fetch = async (...args) => {
      if (this.isSimulatingOffline) {
        throw new Error('Network request failed (simulated offline)');
      }
      return this.originalFetch(...args);
    };
  }

  static disable() {
    this.isSimulatingOffline = false;
    console.log('✅ OFFLINE MODE DISABLED');

    // Restore original fetch
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
    }
  }

  static toggle() {
    if (this.isSimulatingOffline) {
      this.disable();
    } else {
      this.enable();
    }
  }

  static isActive() {
    return this.isSimulatingOffline;
  }
}

// Add debug menu in development
if (__DEV__) {
  // @ts-expect-error - Adding debug function to global
  global.toggleOffline = () => OfflineSimulator.toggle();
}
