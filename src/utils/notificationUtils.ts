import { DayType, RoutineSlot } from '../types';

/**
 * Checks if browser desktop notifications are supported.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission status ('granted', 'denied', 'default', or 'unsupported').
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests browser notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return Notification.permission;
  }
}

/**
 * Synthesizes a pleasant two-tone study chime using Web Audio API without needing external sound files.
 */
export function playChimeSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1: 880 Hz (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 1320 Hz (E6 - pure fifth up)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.15);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.7);

    // Clean up context after playing
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore close error
      }
    }, 1000);
  } catch (err) {
    // Ignore autoplay restriction or audio context errors
    console.warn('Audio chime could not play:', err);
  }
}

/**
 * Triggers a desktop notification and/or audio chime for a routine slot.
 */
export function sendRoutineNotification(
  title: string,
  body: string,
  options?: {
    slotId?: string;
    playSound?: boolean;
  }
): boolean {
  if (options?.playSound !== false) {
    playChimeSound();
  }

  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/favicon.svg',
        tag: options?.slotId ? `routine-slot-${options.slotId}` : 'studyflow-reminder',
      });
      return true;
    } catch (err) {
      console.warn('Failed to display Notification instance:', err);
      return false;
    }
  }

  return false;
}

/**
 * Evaluates which routine slots match the given dayType and start within a +/- 1 minute window.
 */
export function findDueRoutineSlots(
  routineSlots: RoutineSlot[],
  currentTimeStr: string, // 'HH:mm'
  currentDayType: DayType,
  alreadyNotifiedSlotIds: Set<string>
): RoutineSlot[] {
  const [currH, currM] = currentTimeStr.split(':').map(Number);
  const currentTotalMins = currH * 60 + currM;

  return routineSlots.filter((slot) => {
    // Check dayType match
    if (slot.dayType !== currentDayType) return false;
    // Check slot-level notification preference (defaults to true if undefined)
    if (slot.notificationEnabled === false) return false;
    // Check if already notified in this session/window
    if (alreadyNotifiedSlotIds.has(slot.id)) return false;

    const [slotH, slotM] = slot.startTime.split(':').map(Number);
    const slotTotalMins = slotH * 60 + slotM;

    // Trigger if within 0 to 2 minutes of start time
    const diff = slotTotalMins - currentTotalMins;
    return diff >= 0 && diff <= 2;
  });
}
