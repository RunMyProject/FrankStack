/**
 * datetime.ts
 * DateTime Formatter
 * -----------------------
 * Utility function to format a Date object into a readable string.
 * - Output format: "Day Mon DD YYYY HH:MM"
 * - Pads hours and minutes with leading zeros
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

/**
 * Formats a Date object into a string.
 * @param date Date object to format
 * @returns Formatted date string
 */
export const formatDateTime = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
