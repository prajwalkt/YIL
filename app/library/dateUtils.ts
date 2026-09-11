/**
 * Calculates the number of working days (Monday-Friday) between two dates, inclusive.
 * @param startDate The starting date
 * @param endDate The ending date
 * @returns The number of working days between the dates. Returns 0 if startDate > endDate or if dates are invalid.
 */
export function calculateWorkingDays(startDate: string | Date | null, endDate: string | Date | null): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  // Set both to midnight to ensure accurate day comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (start > end) return 0;

  let count = 0;
  let currentDate = new Date(start);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}
