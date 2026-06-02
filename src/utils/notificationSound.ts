const playedNotificationKeys = new Set<string>();
const SOUND_STORAGE_PREFIX = 'focusspark-notification-sound-v2';
let audioUnlocked = false;
let pendingNotifications: SoundNotification[] = [];
let sharedAudioContext: AudioContext | null = null;

export type SoundNotification = {
  id: number;
  read?: boolean;
  created_at?: string;
};

function getNotificationKey(notification: SoundNotification) {
  return `${notification.id}-${notification.created_at ?? 'no-date'}`;
}

function getNewUnreadNotifications(notifications: SoundNotification[]) {
  return notifications.filter((notification) => {
    if (notification.read) return false;
    const key = getNotificationKey(notification);
    if (playedNotificationKeys.has(key)) return false;
    return sessionStorage.getItem(`${SOUND_STORAGE_PREFIX}-${key}`) !== 'true';
  });
}

function queuePendingNotifications(notifications: SoundNotification[]) {
  const queuedByKey = new Map<string, SoundNotification>();
  [...pendingNotifications, ...notifications].forEach((notification) => {
    if (!notification.read) {
      queuedByKey.set(getNotificationKey(notification), notification);
    }
  });
  pendingNotifications = Array.from(queuedByKey.values());
}

function markNotificationsPlayed(notifications: SoundNotification[]) {
  notifications.forEach((notification) => {
    const key = getNotificationKey(notification);
    playedNotificationKeys.add(key);
    sessionStorage.setItem(`${SOUND_STORAGE_PREFIX}-${key}`, 'true');
  });
}

function getAudioContext() {
  const AudioContextCtor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) return null;

  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContextCtor();
  }

  return sharedAudioContext;
}

function playUnlockPrimer(audioContext: AudioContext) {
  if (audioContext.state !== 'running') return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const startsAt = audioContext.currentTime;
  const endsAt = startsAt + 0.05;

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, startsAt);
  gain.gain.setValueAtTime(0.001, startsAt);
  gain.gain.exponentialRampToValueAtTime(0.015, startsAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, endsAt);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startsAt);
  oscillator.stop(endsAt);
}

export function playNotificationSound() {
  if (!audioUnlocked) return false;

  try {
    const audioContext = getAudioContext();
    if (!audioContext) return false;

    if (audioContext.state === 'suspended') {
      void audioContext.resume().then(flushPendingNotificationSound);
      return false;
    }
    if (audioContext.state !== 'running') return false;

    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.001, audioContext.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.45, audioContext.currentTime + 0.03);
    masterGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.72);
    masterGain.connect(audioContext.destination);

    const notes = [
      { frequency: 523.25, start: 0, duration: 0.24, volume: 0.13 },
      { frequency: 659.25, start: 0.16, duration: 0.28, volume: 0.11 },
      { frequency: 1046.5, start: 0.32, duration: 0.22, volume: 0.045 },
    ];

    notes.forEach(({ frequency, start, duration, volume }) => {
      const oscillator = audioContext.createOscillator();
      const noteGain = audioContext.createGain();
      const startsAt = audioContext.currentTime + start;
      const endsAt = startsAt + duration;

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, startsAt);
      noteGain.gain.setValueAtTime(0.001, startsAt);
      noteGain.gain.exponentialRampToValueAtTime(volume, startsAt + 0.025);
      noteGain.gain.exponentialRampToValueAtTime(0.001, endsAt);

      oscillator.connect(noteGain);
      noteGain.connect(masterGain);
      oscillator.start(startsAt);
      oscillator.stop(endsAt);
    });

    return true;
  } catch {
    // Browsers can block audio until the user interacts with the page.
    return false;
  }
}

export function unlockNotificationSound() {
  if (audioUnlocked) {
    flushPendingNotificationSound();
    return;
  }

  const unlock = () => {
    try {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      audioUnlocked = true;
      void audioContext.resume().then(() => {
        playUnlockPrimer(audioContext);
        flushPendingNotificationSound();
      });
    } catch {
      // Ignore browser audio restrictions until a real notification arrives.
    }
  };

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

function flushPendingNotificationSound() {
  if (!pendingNotifications.length) return;

  const notifications = pendingNotifications;
  pendingNotifications = [];
  playSoundForNewUnreadNotifications(notifications);
}

export function playSoundForNewUnreadNotifications(notifications: SoundNotification[]) {
  const unread = notifications.filter((notification) => !notification.read);
  const newUnread = getNewUnreadNotifications(unread);

  if (!newUnread.length) return;

  const didPlay = playNotificationSound();
  if (!didPlay) {
    queuePendingNotifications(newUnread);
    return;
  }

  markNotificationsPlayed(unread);
}
