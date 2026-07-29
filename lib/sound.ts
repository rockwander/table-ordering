// Sound notification utility
// Plays notification sound for new orders and service calls

let audioContext: AudioContext | null = null;
let audioElement: HTMLAudioElement | null = null;

// Create a beep sound using Web Audio API (works even without audio files)
export async function playNotificationSound(): Promise<void> {
  try {
    // Try to use HTMLAudioElement first (iOS/Safari friendly)
    if (!audioElement) {
      audioElement = new Audio();
      // Use a data URI for a simple beep sound
      // This is a simple 440Hz sine wave beep
      audioElement.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSuBzvLZiTYIGGe77OmfTQwN';
      audioElement.volume = 1.0;
    }

    // Play the sound
    const playPromise = audioElement.play();

    if (playPromise !== undefined) {
      await playPromise;
      console.log('✅ Notification sound played');
    }
  } catch (error) {
    console.warn('⚠️ Could not play notification sound:', error);

    // Fallback: Try Web Audio API
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Create a simple beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800 Hz beep
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      console.log('✅ Web Audio API beep played');
    } catch (webAudioError) {
      console.error('❌ All audio playback methods failed:', webAudioError);
    }
  }
}

// Play a double beep for new orders
export async function playNewOrderSound(): Promise<void> {
  await playNotificationSound();
  setTimeout(() => playNotificationSound(), 300);
}

// Play a triple beep for service calls
export async function playServiceCallSound(): Promise<void> {
  await playNotificationSound();
  setTimeout(() => playNotificationSound(), 250);
  setTimeout(() => playNotificationSound(), 500);
}
