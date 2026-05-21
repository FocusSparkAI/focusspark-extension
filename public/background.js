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

function isFocusSparkExtensionTab(tab) {
  return Boolean(tab?.url && tab.url.startsWith(chrome.runtime.getURL('')));
}

function isPomodoroFocusLocked() {
  return pomodoroState.phase === 'focus' || pomodoroState.phase === 'paused';
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
          }
        });
        return;
      }

      chrome.tabs.update(
        pomodoroState.focusTabId,
        {
          active: true,
          ...(isFocusSparkExtensionTab(tab) ? {} : { url: getPomodoroTutorUrl() }),
        },
        () => {
          // Ignore failures if the focus tab is no longer available.
        },
      );
    });
    return;
  }

  chrome.tabs.create({ url: getPomodoroTutorUrl() }, (tab) => {
    if (typeof tab?.id === 'number') {
      pomodoroState.focusTabId = tab.id;
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

  chrome.tabs.update(pomodoroState.focusTabId, { url: getPomodoroTutorUrl(), active: true }, () => {
    // Ignore failures if the focus tab is no longer available.
  });

  return true;
}

function recordPomodoroDistraction(details = {}) {
  pomodoroState.distractionCount += 1;
  sendRuntimeEvent({
    type: 'POMODORO_DISTRACTION_DETECTED',
    count: pomodoroState.distractionCount,
    ...details,
  });
}

function enforcePomodoroFocus(tab, details = {}) {
  if (!isPomodoroFocusLocked()) return;
  if (typeof tab?.id === 'number' && tab.id === pomodoroState.focusTabId) return;
  if (wasTabHandledRecently(tab?.id)) return;
  markTabHandled(tab?.id);
  recordPomodoroDistraction(details);
  focusPomodoroTab();
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

  if (message.type === 'POMODORO_STATE_CHANGED') {
    syncPomodoroState(message, _sender);
    sendResponse({
      ok: true,
      pomodoro: { ...pomodoroState },
    });
  }

  if (message.type === 'POMODORO_BREAK_COMPLETED') {
    handlePomodoroBreakCompleted(message, _sender);
    sendResponse({ ok: true });
  }

  if (message.type === 'GET_POMODORO_METRICS') {
    chrome.storage.local.get(
      {
        pomodoroLateMsTotal: 0,
        pomodoroLateEvents: [],
      },
      (items) => sendResponse({ ok: true, ...items }),
    );
    return true;
  }

  return true;
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (
    tabId === pomodoroState.focusTabId &&
    typeof pomodoroState.breakLateStartedAt === 'number'
  ) {
    addPomodoroLateTime(Date.now() - pomodoroState.breakLateStartedAt);
    pomodoroState.breakLateStartedAt = null;
  }

  if (isPomodoroFocusLocked()) {
    enforcePomodoroFocus({ id: tabId }, { reason: 'tab-switch' });
    return;
  }

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
  if (isPomodoroFocusLocked()) {
    enforcePomodoroFocus(tab, { reason: 'new-tab' });
    return;
  }

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!isPomodoroFocusLocked()) return;
  if (changeInfo.status !== 'loading' && !changeInfo.url) return;
  if (restorePomodoroFocusTabUrl(tab || { id: tabId, url: changeInfo.url })) return;
  if (tabId === pomodoroState.focusTabId) return;
  enforcePomodoroFocus(tab || { id: tabId }, { reason: 'url-change' });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === pomodoroAlarmName) {
    handlePomodoroBreakEnded();
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  recentlyHandledTabs.delete(tabId);

  if (tabId === pomodoroState.focusTabId) {
    pomodoroState.focusTabId = null;
    if (isPomodoroFocusLocked()) {
      focusPomodoroTab();
    }
  }

  if (tabId !== strictModeState.focusTabId) return;

  strictModeState.enabled = false;
  strictModeState.focusTabId = null;
  strictModeState.distractionCount = 0;

  sendRuntimeEvent({ type: 'STRICT_MODE_FORCED_OFF' });
});
