import { TIME_CONSTANTS } from './constants';

/**
 * Convert time string (HH:MM) to minutes
 */
export const timeToMinutes = (time) => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Convert minutes to time string (HH:MM)
 */
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Calculate total work minutes from timecard
 * Deducts lunch and break times from total duration
 */
export const calculateWorkMinutes = (timecard) => {
  if (!timecard.logIn || !timecard.logOut) return 0;

  let total = timeToMinutes(timecard.logOut) - timeToMinutes(timecard.logIn);

  // Deduct lunch time
  if (timecard.lunchOut && timecard.lunchIn) {
    const lunchDuration = timeToMinutes(timecard.lunchIn) - timeToMinutes(timecard.lunchOut);
    const deductibleLunch = Math.min(lunchDuration, TIME_CONSTANTS.LUNCH_DURATION);
    total -= deductibleLunch;
  }

  // Deduct break times
  if (timecard.breaks && Array.isArray(timecard.breaks)) {
    timecard.breaks.forEach(b => {
      if (b.breakOut && b.breakIn) {
        const breakDuration = timeToMinutes(b.breakIn) - timeToMinutes(b.breakOut);
        if (breakDuration > 0) {
          total -= breakDuration;
        }
      }
    });
  }

  return Math.max(0, total);
};

/**
 * Calculate late login minutes
 */
export const calculateLateLoginMinutes = (loginTime, requiredTime) => {
  const loginMinutes = timeToMinutes(loginTime);
  const requiredMinutes = timeToMinutes(requiredTime);
  return Math.max(0, loginMinutes - requiredMinutes);
};

/**
 * Check if login is late
 */
export const isLateLogin = (loginTime, requiredTime) => {
  return timeToMinutes(loginTime) > timeToMinutes(requiredTime);
};

/**
 * Calculate break/lunch extension minutes
 */
export const calculateExtensionMinutes = (startTime, endTime, standardDuration) => {
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
  return Math.max(0, duration - standardDuration);
};

/**
 * Check if break/lunch exceeds standard duration
 */
export const hasExtension = (startTime, endTime, standardDuration) => {
  return calculateExtensionMinutes(startTime, endTime, standardDuration) > 0;
};
