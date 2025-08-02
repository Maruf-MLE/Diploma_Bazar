// src/lib/playNotificationSound.ts
// Simple utility to play a notification sound.
// Place a WAV file named `notification.wav` (or change the path) in the public folder.

let audio: HTMLAudioElement | null = null;

export function playNotificationSound() {
  try {
    if (!audio) {
      audio = new Audio('/notification.wav'); // Path relative to public/
      audio.preload = 'auto';
      audio.volume = 0.6; // moderate volume
    }
    // Rewind to start for rapid consecutive notifications
    audio.currentTime = 0;
    // Play returns a promise; we can ignore catch silently (autoplay rules)
    // Some browsers may block autoplay until user interaction.
    audio.play().catch(() => {});
  } catch (_) {
    // ignore errors – sound is non-critical
  }
}

