type ChromeStorageArea = {
  get: (keys: string | string[] | Record<string, unknown> | null, callback: (items: Record<string, unknown>) => void) => void;
  set: (items: Record<string, unknown>, callback?: () => void) => void;
  remove: (keys: string | string[], callback?: () => void) => void;
};

type ChromeStorageApi = {
  runtime?: {
    lastError?: { message?: string };
  };
  storage?: {
    local?: ChromeStorageArea;
  };
};

const memoryStorage = new Map<string, string>();

function getChromeStorage() {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: ChromeStorageApi }).chrome;
  return chromeApi?.storage?.local ? { chromeApi, storage: chromeApi.storage.local } : null;
}

export function getStoredValue(key: string): Promise<string | null> {
  const chromeStorage = getChromeStorage();
  if (!chromeStorage) {
    return Promise.resolve(memoryStorage.get(key) ?? null);
  }

  return new Promise((resolve) => {
    chromeStorage.storage.get(key, (items) => {
      if (chromeStorage.chromeApi.runtime?.lastError) {
        resolve(null);
        return;
      }

      const value = items[key];
      resolve(typeof value === 'string' ? value : value == null ? null : String(value));
    });
  });
}

export function setStoredValue(key: string, value: string): Promise<void> {
  const chromeStorage = getChromeStorage();
  if (!chromeStorage) {
    memoryStorage.set(key, value);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    chromeStorage.storage.set({ [key]: value }, resolve);
  });
}

export function removeStoredValue(key: string): Promise<void> {
  const chromeStorage = getChromeStorage();
  if (!chromeStorage) {
    memoryStorage.delete(key);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    chromeStorage.storage.remove(key, resolve);
  });
}
