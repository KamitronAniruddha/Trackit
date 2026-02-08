// This is a workaround for the fact that NodeJS's EventEmitter is not available in the browser.
class Emitter {
  private listeners: { [event: string]: Function[] } = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }
}

export const errorEmitter = new Emitter();
