const strictModeState = {
  enabled: false,
  focusTabId: null,
  distractionCount: 0,
};

const pomodoroState = {
  phase: 'idle',
  focusTabId: null,
  distractionCount: 0,
  breakEndsAt: null,
  breakLateStartedAt: null,
};

const recentlyHandledTabs = new Map();

const extensionIndexUrl = chrome.runtime.getURL('index.html');
const pomodoroAlarmName = 'focusspark-pomodoro-break-ended';
const backgroundStateStorageKey = 'focusspark-background-state';
let backgroundStateHydrated = false;
let backgroundStateHydrationPromise = null;

function getBackgroundStateSnapshot() {
  return {
    strictModeState: { ...strictModeState },
    pomodoroState: { ...pomodoroState },
  };
}

function applyStoredBackgroundState(storedState) {
  if (!storedState || typeof storedState !== 'object') return;

  if (storedState.strictModeState && typeof storedState.strictModeState === 'object') {
    strictModeState.enabled = Boolean(storedState.strictModeState.enabled);
    strictModeState.focusTabId = Number.isInteger(storedState.strictModeState.focusTabId)
      ? storedState.strictModeState.focusTabId
      : null;
    strictModeState.distractionCount = Number.isFinite(Number(storedState.strictModeState.distractionCount))
      ? Math.max(0, Number(storedState.strictModeState.distractionCount))
      : 0;
  }

  if (storedState.pomodoroState && typeof storedState.pomodoroState === 'object') {
    pomodoroState.phase = typeof storedState.pomodoroState.phase === 'string'
      ? storedState.pomodoroState.phase
      : 'idle';
    pomodoroState.focusTabId = Number.isInteger(storedState.pomodoroState.focusTabId)
      ? storedState.pomodoroState.focusTabId
      : null;
    pomodoroState.distractionCount = Number.isFinite(Number(storedState.pomodoroState.distractionCount))
      ? Math.max(0, Number(storedState.pomodoroState.distractionCount))
      : 0;
    pomodoroState.breakEndsAt = Number.isFinite(Number(storedState.pomodoroState.breakEndsAt))
      ? Number(storedState.pomodoroState.breakEndsAt)
      : null;
    pomodoroState.breakLateStartedAt = Number.isFinite(Number(storedState.pomodoroState.breakLateStartedAt))
      ? Number(storedState.pomodoroState.breakLateStartedAt)
      : null;
  }
}

function persistBackgroundState() {
  chrome.storage.local.set({
    [backgroundStateStorageKey]: getBackgroundStateSnapshot(),
  });
}

function hydrateBackgroundState() {
  if (backgroundStateHydrated) return Promise.resolve();
  if (backgroundStateHydrationPromise) return backgroundStateHydrationPromise;

  backgroundStateHydrationPromise = new Promise((resolve) => {
    chrome.storage.local.get({ [backgroundStateStorageKey]: null }, (items) => {
      if (!chrome.runtime.lastError) {
        applyStoredBackgroundState(items[backgroundStateStorageKey]);
      }
      backgroundStateHydrated = true;
      resolve();
    });
  });

  return backgroundStateHydrationPromise;
}

void hydrateBackgroundState();

function sendRuntimeEvent(message) {
  chrome.runtime.sendMessage(message, () => {
    void chrome.runtime.lastError;
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

function isFocusSparkExtensionTab(tab) {
  return Boolean(tab?.url && tab.url.startsWith(chrome.runtime.getURL('')));
}

function isPomodoroFocusLocked() {
  return pomodoroState.phase === 'focus' || pomodoroState.phase === 'paused';
}

function isTabEditTemporarilyBlocked(errorMessage) {
  return typeof errorMessage === 'string' && errorMessage.includes('Tabs cannot be edited right now');
}

function updateTabSafely(tabId, updateProperties, retries = 3) {
  if (typeof tabId !== 'number') return;

  chrome.tabs.update(tabId, updateProperties, () => {
    const errorMessage = chrome.runtime.lastError?.message;
    if (isTabEditTemporarilyBlocked(errorMessage) && retries > 0) {
      setTimeout(() => updateTabSafely(tabId, updateProperties, retries - 1), 150);
    }
  });
}

function removeTabSafely(tabId, retries = 3, onRemoved) {
  if (typeof tabId !== 'number') return;

  chrome.tabs.remove(tabId, () => {
    const errorMessage = chrome.runtime.lastError?.message;
    if (isTabEditTemporarilyBlocked(errorMessage) && retries > 0) {
      setTimeout(() => removeTabSafely(tabId, retries - 1, onRemoved), 150);
      return;
    }

    if (!errorMessage) {
      onRemoved?.();
    }
  });
}

function enforceFocusLock({
  enabled,
  focusTabId,
  tab,
  shouldHandleTab,
  recordDistraction,
  refocus,
  onClosed,
}) {
  if (!enabled) return false;
  if (typeof tab?.id === 'number' && tab.id === focusTabId) return false;
  if (shouldHandleTab && !shouldHandleTab(tab)) return false;
  if (wasTabHandledRecently(tab?.id)) return false;

  markTabHandled(tab?.id);
  recordDistraction();
  removeTabSafely(tab?.id, 3, onClosed);
  refocus();
  return true;
}

function getPomodoroTutorUrl() {
  return `${extensionIndexUrl}#/chatbot`;
}

function focusPomodoroTab() {
  if (typeof pomodoroState.focusTabId === 'number') {
    chrome.tabs.get(pomodoroState.focusTabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        chrome.tabs.create({ url: getPomodoroTutorUrl() }, (createdTab) => {
          if (typeof createdTab?.id === 'number') {
            pomodoroState.focusTabId = createdTab.id;
            persistBackgroundState();
          }
        });
        return;
      }

      updateTabSafely(pomodoroState.focusTabId, {
        active: true,
        ...(isFocusSparkExtensionTab(tab) ? {} : { url: getPomodoroTutorUrl() }),
      });
    });
    return;
  }

  chrome.tabs.create({ url: getPomodoroTutorUrl() }, (tab) => {
    if (typeof tab?.id === 'number') {
      pomodoroState.focusTabId = tab.id;
      persistBackgroundState();
    }
  });
}

function restorePomodoroFocusTabUrl(tab) {
  if (!isPomodoroFocusLocked()) return false;
  if (tab?.id !== pomodoroState.focusTabId) return false;
  if (isFocusSparkExtensionTab(tab)) return false;

  recordPomodoroDistraction({
    reason: 'focus-tab-url-change',
    tabTitle: tab?.title || 'Focus tab',
    tabUrl: tab?.url || '',
  });

  updateTabSafely(pomodoroState.focusTabId, { url: getPomodoroTutorUrl(), active: true });

  return true;
}

function recordPomodoroDistraction(details = {}) {
  pomodoroState.distractionCount += 1;
  persistBackgroundState();
  sendRuntimeEvent({
    type: 'POMODORO_DISTRACTION_DETECTED',
    count: pomodoroState.distractionCount,
    ...details,
  });
}

function enforcePomodoroFocus(tab, details = {}) {
  enforceFocusLock({
    enabled: isPomodoroFocusLocked(),
    focusTabId: pomodoroState.focusTabId,
    tab,
    recordDistraction: () => recordPomodoroDistraction(details),
    refocus: focusPomodoroTab,
  });
}

function addPomodoroLateTime(lateMs) {
  const safeLateMs = Math.max(0, Math.round(lateMs));
  if (safeLateMs <= 0) return;

  chrome.storage.local.get(
    {
      pomodoroLateMsTotal: 0,
      pomodoroLateEvents: [],
    },
    (items) => {
      const previousEvents = Array.isArray(items.pomodoroLateEvents)
        ? items.pomodoroLateEvents
        : [];
      const nextEvents = [
        ...previousEvents,
        {
          lateMs: safeLateMs,
          recordedAt: Date.now(),
          breakEndedAt: pomodoroState.breakEndsAt,
        },
      ].slice(-50);

      chrome.storage.local.set({
        pomodoroLateMsTotal: Number(items.pomodoroLateMsTotal || 0) + safeLateMs,
        pomodoroLateEvents: nextEvents,
      });
    },
  );

  sendRuntimeEvent({
    type: 'POMODORO_LATE_RETURN_RECORDED',
    lateMs: safeLateMs,
  });
}

function handlePomodoroBreakEnded() {
  if (typeof pomodoroState.breakEndsAt !== 'number') return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs?.[0];
    const isBackOnTutor =
      activeTab?.id === pomodoroState.focusTabId && isFocusSparkExtensionTab(activeTab);

    if (!isBackOnTutor) {
      pomodoroState.breakLateStartedAt = pomodoroState.breakEndsAt;
      focusPomodoroTab();
    } else {
      pomodoroState.breakLateStartedAt = null;
    }
    persistBackgroundState();

    sendRuntimeEvent({
      type: 'POMODORO_BREAK_ENDED_IN_BACKGROUND',
      wasBackOnTutor: isBackOnTutor,
    });
  });
}

function handlePomodoroBreakCompleted(message, sender) {
  const breakEndsAt = Number(message.breakEndsAt || pomodoroState.breakEndsAt);
  if (!Number.isFinite(breakEndsAt)) return;

  pomodoroState.focusTabId = Number.isInteger(message.focusTabId)
    ? message.focusTabId
    : Number.isInteger(sender?.tab?.id)
    ? sender.tab.id
    : pomodoroState.focusTabId;
  pomodoroState.breakEndsAt = breakEndsAt;
  persistBackgroundState();

  handlePomodoroBreakEnded();
}

function syncPomodoroState(message, sender) {
  const phase = typeof message.phase === 'string' ? message.phase : 'idle';
  pomodoroState.phase = phase;
  pomodoroState.focusTabId = Number.isInteger(message.focusTabId)
    ? message.focusTabId
    : Number.isInteger(sender?.tab?.id)
    ? sender.tab.id
    : pomodoroState.focusTabId;

  if (phase === 'break') {
    const breakEndsAt = Number(message.breakEndsAt);
    pomodoroState.breakEndsAt = Number.isFinite(breakEndsAt) ? breakEndsAt : null;
    pomodoroState.breakLateStartedAt = null;

    chrome.alarms.clear(pomodoroAlarmName, () => {
      if (typeof pomodoroState.breakEndsAt === 'number') {
        chrome.alarms.create(pomodoroAlarmName, { when: pomodoroState.breakEndsAt });
      }
    });
  } else {
    if (typeof pomodoroState.breakLateStartedAt !== 'number') {
      pomodoroState.breakEndsAt = null;
      pomodoroState.breakLateStartedAt = null;
    }
    chrome.alarms.clear(pomodoroAlarmName);
  }

  if (phase === 'idle') {
    pomodoroState.distractionCount = 0;
  }
  persistBackgroundState();
}

function enforceStrictModeOnTab(tab, details = {}, shouldHandleTab = isFocusableDistractionTab) {
  enforceFocusLock({
    enabled: strictModeState.enabled,
    focusTabId: strictModeState.focusTabId,
    tab,
    shouldHandleTab,
    recordDistraction: () => {
      strictModeState.distractionCount += 1;
      persistBackgroundState();
      sendRuntimeEvent({
        type: 'DISTRACTION_DETECTED',
        count: strictModeState.distractionCount,
        tabTitle: tab?.title || 'Unknown tab',
        tabUrl: tab?.url || '',
        ...details,
      });
    },
    refocus: () => {
      if (typeof strictModeState.focusTabId === 'number') {
        updateTabSafely(strictModeState.focusTabId, { active: true });
      }
    },
    onClosed: () => {
      sendRuntimeEvent({
        type: 'DISTRACTION_TAB_CLOSED',
        count: strictModeState.distractionCount,
      });
    },
  });
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: extensionIndexUrl,
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;

  void hydrateBackgroundState().then(() => {
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

      persistBackgroundState();
      sendResponse({
        ok: true,
        strictMode: strictModeState.enabled,
        focusTabId: strictModeState.focusTabId,
        distractionCount: strictModeState.distractionCount,
      });
      return;
    }

    if (message.type === 'GET_STRICT_MODE') {
      sendResponse({
        strictMode: strictModeState.enabled,
        focusTabId: strictModeState.focusTabId,
        distractionCount: strictModeState.distractionCount,
      });
      return;
    }

    if (message.type === 'POMODORO_STATE_CHANGED') {
      syncPomodoroState(message, _sender);
      sendResponse({
        ok: true,
        pomodoro: { ...pomodoroState },
      });
      return;
    }

    if (message.type === 'POMODORO_BREAK_COMPLETED') {
      handlePomodoroBreakCompleted(message, _sender);
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'GET_POMODORO_METRICS') {
      chrome.storage.local.get(
        {
          pomodoroLateMsTotal: 0,
          pomodoroLateEvents: [],
        },
        (items) => {
          void chrome.runtime.lastError;
          sendResponse({ ok: true, ...items });
        },
      );
      return;
    }

    sendResponse({ ok: false, error: 'Unknown message type' });
  });

  return true;
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void hydrateBackgroundState().then(() => {
    if (
      tabId === pomodoroState.focusTabId &&
      typeof pomodoroState.breakLateStartedAt === 'number'
    ) {
      addPomodoroLateTime(Date.now() - pomodoroState.breakLateStartedAt);
      pomodoroState.breakLateStartedAt = null;
      persistBackgroundState();
    }

    if (isPomodoroFocusLocked()) {
      enforcePomodoroFocus({ id: tabId }, { reason: 'tab-switch' });
      return;
    }

    if (!strictModeState.enabled) return;
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return;
      enforceStrictModeOnTab(tab, { reason: 'tab-switch' });
    });
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  void hydrateBackgroundState().then(() => {
    if (isPomodoroFocusLocked()) {
      enforcePomodoroFocus(tab, { reason: 'new-tab' });
      return;
    }

    if (!strictModeState.enabled) return;

    // Close newly created distraction tabs quickly.
    setTimeout(() => {
      enforceStrictModeOnTab(tab, { reason: 'new-tab' }, null);
    }, 100);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  void hydrateBackgroundState().then(() => {
    if (!isPomodoroFocusLocked()) return;
    if (changeInfo.status !== 'loading' && !changeInfo.url) return;
    if (restorePomodoroFocusTabUrl(tab || { id: tabId, url: changeInfo.url })) return;
    if (tabId === pomodoroState.focusTabId) return;
    enforcePomodoroFocus(tab || { id: tabId }, { reason: 'url-change' });
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  void hydrateBackgroundState().then(() => {
    if (alarm.name === pomodoroAlarmName) {
      handlePomodoroBreakEnded();
    }
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void hydrateBackgroundState().then(() => {
    recentlyHandledTabs.delete(tabId);

    if (tabId === pomodoroState.focusTabId) {
      pomodoroState.focusTabId = null;
      persistBackgroundState();
      if (isPomodoroFocusLocked()) {
        focusPomodoroTab();
      }
    }

    if (tabId !== strictModeState.focusTabId) return;

    strictModeState.enabled = false;
    strictModeState.focusTabId = null;
    strictModeState.distractionCount = 0;
    persistBackgroundState();

    sendRuntimeEvent({ type: 'STRICT_MODE_FORCED_OFF' });
  });
});
