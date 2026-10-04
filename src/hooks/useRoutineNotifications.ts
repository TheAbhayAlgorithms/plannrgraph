import { useEffect, useRef } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useToastStore } from '../store/useToastStore';
import { findDueRoutineSlots, sendRoutineNotification } from '../utils/notificationUtils';
import { getDayType, getTodayDateString } from '../utils/dateUtils';

export function useRoutineNotifications() {
  const { settings, routineSlots } = usePlannerStore();
  const { addToast } = useToastStore();
  const notifiedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const checkInterval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${mins}`;
      const todayStr = getTodayDateString();
      const currentDayType = getDayType(todayStr);

      const dueSlots = findDueRoutineSlots(
        routineSlots,
        currentTimeStr,
        currentDayType,
        notifiedKeysRef.current
      );

      for (const slot of dueSlots) {
        notifiedKeysRef.current.add(slot.id);

        // Send browser notification and chime
        sendRoutineNotification(
          `Routine Alert: ${slot.title}`,
          `Scheduled for ${slot.startTime} - ${slot.endTime}`,
          {
            slotId: slot.id,
            playSound: settings.soundEnabled !== false,
          }
        );

        // Also add in-app toast
        addToast({
          title: `Routine: ${slot.title}`,
          message: `Starting now (${slot.startTime} - ${slot.endTime})`,
          type: 'info',
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [settings.notificationsEnabled, settings.soundEnabled, routineSlots, addToast]);
}
