// app/library/courseDurations.ts
// Official YTS course durations (in days).
// Used to compute course access windows and auto-progress for
// Offline, Online, and Site training modes.

export const COURSE_DURATIONS: Record<string, number> = {
  'CENTUM VP DCS Operation': 3,
  'CENTUM VP DCS Fundamentals': 5,
  'CENTUM VP DCS Engineering': 5,
  'CENTUM VP DCS Fundamentals & Engineering': 5,
  'CENTUM VP DCS Engineering & Maintenance': 10,
  'CENTUM VP DCS Maintenance': 3,
  'CENTUM VP DCS Advanced Engineering': 5,
  'CENTUM VP DCS Batch Engineering': 5,
  'CENTUM VP DCS with AD Suite Engineering': 5,
  'CENTUM VP DCS AD Suite Engineering': 5,
  'Consolidated Alarm Management System': 2,
  'CAMS Engineering': 2,
  'SEBOL Programming': 3,
  'STARDOM NCS with FAST/TOOLS SCADA': 5,
  'STARDOM NCS with CI Server': 5,
  'STARDOM NCS Engineering': 5,
  'FAST/TOOLS SCADA Operations': 2,
  'FAST/TOOLS SCADA Engineering': 3,
  'CI Server Operations': 2,
  'CI Server Engineering': 3,
  'Field Bus Basics & Engineering': 2,
  'Field Bus Engineering & PRM': 4,
  'Industrial Communication Protocols': 3,
  'Field Instruments for Process Control': 5,
  'PROFIBUS Basics & Engineering': 1,
  'Profibus Basics & Engineering': 1,
  'Asset Management Software - PRM': 2,
  'Asset Management Software – PRM': 2,
  'Cyber Security for Industrial Control System': 3,
  'PROSAFE RS Operations': 2,
  'PROSAFE RS Engineering': 5,
  'PROSAFE RS Advanced Engineering': 5,
  'PROSAFE RS Engineering with FAST/TOOLS SCADA': 5,
  'PROSAFE RS Engineering with CI Server': 5,
  'Functional Safety for End Users': 2,
  'TUV Functional Safety Engineer': 4, // 3.5 days rounded up to 4
};

/**
 * Get the duration of a course in days.
 * Performs a case-insensitive partial match as a fallback for minor naming variations.
 */
export function getCourseDurationDays(courseTitle: string): number {
  // Exact match first
  if (COURSE_DURATIONS[courseTitle] !== undefined) {
    return COURSE_DURATIONS[courseTitle];
  }
  // Case-insensitive fallback
  const lower = courseTitle.toLowerCase();
  for (const [key, value] of Object.entries(COURSE_DURATIONS)) {
    if (key.toLowerCase() === lower) return value;
  }
  // Partial match last resort
  for (const [key, value] of Object.entries(COURSE_DURATIONS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return value;
  }
  // Default 5 days if unknown
  return 5;
}

/**
 * Calculate automatic progress percentage for Offline/Online/Site training.
 * Based on elapsed calendar days relative to course start and end dates.
 * E-Learning uses video-watch percentage from the DB instead.
 */
export function computeTimeBasedProgress(
  startDate: string | Date | null,
  endDate: string | Date | null
): number {
  if (!startDate || !endDate) return 0;

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return 0;
  if (now >= end) return 100;

  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();
  return Math.min(100, Math.round((elapsedMs / totalMs) * 100));
}
