const strictModeState = {
  enabled: false,
  focusTabId: null,
  distractionCount: 0,
};

const recentlyHandledTabs = new Map();

const extensionIndexUrl = chrome.runtime.getURL('index.html');

function sendRuntimeEvent(message) {
  chrome.runtime.sendMessage(message, () => {
    // Ignore receiver errors when no extension page is listening.
  });
}

function markTabHandled(tabId) {
  if (typeof tabId !== 'number') return;
  recentlyHandledTabs.set(tabId, Date.now() + 3000);
}

function wasTabHandledRecently(tabId) {
  if (typeof tabId !== 'number') return false;
  const expiresAt = recentlyHandledTabs.get(tabId);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    recentlyHandledTabs.delete(tabId);
    return false;
  }
  return true;
}

function isFocusableDistractionTab(tab) {
  if (!tab || !tab.url) return false;
  if (tab.id === strictModeState.focusTabId) return false;

  const isExtensionPage = tab.url.startsWith(chrome.runtime.getURL(''));
  if (isExtensionPage) return false;

  return tab.url.startsWith('http://') || tab.url.startsWith('https://');
}

function enforceStrictModeOnTab(tab) {
  if (!strictModeState.enabled || !isFocusableDistractionTab(tab)) return;
  if (wasTabHandledRecently(tab.id)) return;
  markTabHandled(tab.id);

  strictModeState.distractionCount += 1;
  sendRuntimeEvent({
    type: 'DISTRACTION_DETECTED',
    count: strictModeState.distractionCount,
    tabTitle: tab.title || 'Unknown tab',
    tabUrl: tab.url || '',
  });

  if (typeof tab.id === 'number') {
    chrome.tabs.remove(tab.id, () => {
      sendRuntimeEvent({
        type: 'DISTRACTION_TAB_CLOSED',
        count: strictModeState.distractionCount,
      });
    });
  }

  if (typeof strictModeState.focusTabId === 'number') {
    chrome.tabs.update(strictModeState.focusTabId, { active: true }, () => {
      // Ignore failures if the focus tab is no longer available.
    });
  }
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: extensionIndexUrl,
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return;

  if (message.type === 'SET_STRICT_MODE' || message.type === 'STRICT_MODE_CHANGED') {
    strictModeState.enabled = Boolean(message.enabled);
    strictModeState.focusTabId = Number.isInteger(message.focusTabId)
      ? message.focusTabId
      : Number.isInteger(_sender?.tab?.id)
      ? _sender.tab.id
      : strictModeState.focusTabId;

    if (!strictModeState.enabled) {
      strictModeState.distractionCount = 0;
    }

    sendResponse({
      ok: true,
      strictMode: strictModeState.enabled,
      focusTabId: strictModeState.focusTabId,
      distractionCount: strictModeState.distractionCount,
    });
  }

  if (message.type === 'GET_STRICT_MODE') {
    sendResponse({
      strictMode: strictModeState.enabled,
      focusTabId: strictModeState.focusTabId,
      distractionCount: strictModeState.distractionCount,
    });
  }

  return true;
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (!strictModeState.enabled) return;
  if (tabId === strictModeState.focusTabId) return;
  if (wasTabHandledRecently(tabId)) return;
  markTabHandled(tabId);

  strictModeState.distractionCount += 1;
  sendRuntimeEvent({
    type: 'DISTRACTION_DETECTED',
    count: strictModeState.distractionCount,
  });

  if (typeof strictModeState.focusTabId === 'number') {
    chrome.tabs.update(strictModeState.focusTabId, { active: true }, () => {
      // Ignore update errors if focus tab is not available.
    });
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  if (!strictModeState.enabled) return;
  if (tab.id === strictModeState.focusTabId) return;
  if (wasTabHandledRecently(tab.id)) return;
  markTabHandled(tab.id);

  strictModeState.distractionCount += 1;
  sendRuntimeEvent({
    type: 'DISTRACTION_DETECTED',
    count: strictModeState.distractionCount,
  });

  // Close newly created distraction tabs quickly.
  setTimeout(() => {
    if (typeof tab.id !== 'number') return;

    chrome.tabs.remove(tab.id, () => {
      sendRuntimeEvent({
        type: 'DISTRACTION_TAB_CLOSED',
        count: strictModeState.distractionCount,
      });
    });

    if (typeof strictModeState.focusTabId === 'number') {
      chrome.tabs.update(strictModeState.focusTabId, { active: true }, () => {
        // Ignore update errors if focus tab is not available.
      });
    }
  }, 100);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  recentlyHandledTabs.delete(tabId);

  if (tabId !== strictModeState.focusTabId) return;

  strictModeState.enabled = false;
  strictModeState.focusTabId = null;
  strictModeState.distractionCount = 0;

  sendRuntimeEvent({ type: 'STRICT_MODE_FORCED_OFF' });
});
