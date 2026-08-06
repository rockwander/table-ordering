// Sound notification utility
// Plays notification sound for new orders and service calls

let audioContext: AudioContext | null = null;
let newOrderAudio: HTMLAudioElement | null = null;
let waiterCallAudio: HTMLAudioElement | null = null;
let currentLoopInterval: NodeJS.Timeout | null = null;
let currentStopTimeout: NodeJS.Timeout | null = null;

// Stop any currently playing notification sound
export function stopNotificationSound(): void {
  console.log('🛑 Stopping notification sound');

  // Stop new order audio
  if (newOrderAudio) {
    newOrderAudio.pause();
    newOrderAudio.currentTime = 0;
  }

  // Stop waiter call audio
  if (waiterCallAudio) {
    waiterCallAudio.pause();
    waiterCallAudio.currentTime = 0;
  }

  // Clear any pending intervals/timeouts
  if (currentLoopInterval) {
    clearInterval(currentLoopInterval);
    currentLoopInterval = null;
  }

  if (currentStopTimeout) {
    clearTimeout(currentStopTimeout);
    currentStopTimeout = null;
  }
}

// Play notification sound with looping for 10 seconds
async function playLoopingSound(soundFile: string, label: string): Promise<void> {
  try {
    // Stop any existing sounds first
    stopNotificationSound();

    // Create audio element for this sound
    const audio = new Audio(soundFile);
    audio.volume = 1.0;

    // Store reference based on type
    if (label === 'New Order') {
      newOrderAudio = audio;
    } else {
      waiterCallAudio = audio;
    }

    console.log(`🔊 Starting ${label} sound loop for 10 seconds`);

    // Play the sound initially
    await audio.play();

    // Set up looping - replay every 2 seconds
    currentLoopInterval = setInterval(async () => {
      try {
        audio.currentTime = 0;
        await audio.play();
        console.log(`🔄 Looping ${label} sound`);
      } catch (err) {
        console.error('Error looping sound:', err);
      }
    }, 2000);

    // Automatically stop after 10 seconds
    currentStopTimeout = setTimeout(() => {
      console.log(`⏱️ 10 seconds elapsed - stopping ${label} sound`);
      stopNotificationSound();
    }, 10000);

  } catch (error) {
    console.error(`❌ Failed to play ${label} sound:`, error);
  }
}

// Play new order sound (loops for 10 seconds, can be stopped by tap)
export async function playNewOrderSound(): Promise<void> {
  await playLoopingSound('/mixkit-casino-bells-reward-1981.wav', 'New Order');
}

// Play waiter call sound (loops for 10 seconds, can be stopped by tap)
export async function playServiceCallSound(): Promise<void> {
  await playLoopingSound('/mixkit-happy-bells-notification-937.wav', 'Waiter Call');
}
