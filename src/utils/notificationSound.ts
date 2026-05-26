const playedNotificationKeys = new Set<string>();
let audioUnlocked = false;

export type SoundNotification = {
  id: number;
  read?: boolean;
  created_at?: string;
};

function getNotificationKey(notification: SoundNotification) {
  return `${notification.id}-${notification.created_at ?? 'no-date'}`;
}

export function playNotificationSound() {
  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return;

    const audioContext = new AudioContextCtor();
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.16);
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.18);
    oscillator.onended = () => void audioContext.close();
  } catch {
    // Browsers can block audio until the user interacts with the page.
  }
}

export function unlockNotificationSound() {
  if (audioUnlocked) return;

  const unlock = () => {
    audioUnlocked = true;
    try {
      const AudioContextCtor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextCtor) return;

      const audioContext = new AudioContextCtor();
      void audioContext.resume().finally(() => void audioContext.close());
    } catch {
      // Ignore browser audio restrictions until a real notification arrives.
    }
  };

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

export function playSoundForNewUnreadNotifications(notifications: SoundNotification[]) {
  const unread = notifications.filter((notification) => !notification.read);
  const newUnread = unread.find((notification) => {
    const key = getNotificationKey(notification);
    if (playedNotificationKeys.has(key)) return false;
    return sessionStorage.getItem(`focusspark-notification-sound-${key}`) !== 'true';
  });

  unread.forEach((notification) => {
    const key = getNotificationKey(notification);
    playedNotificationKeys.add(key);
    sessionStorage.setItem(`focusspark-notification-sound-${key}`, 'true');
  });

  if (newUnread) {
    playNotificationSound();
  }
}
