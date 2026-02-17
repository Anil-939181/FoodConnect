/**
 * Convert Decimal Degrees to DMS (Degrees, Minutes, Seconds)
 * @param {number} decimal - Decimal degree value
 * @returns {object} { degrees, minutes, seconds }
 */
export function decimalToDMS(decimal) {
  const isNegative = decimal < 0;
  const absDecimal = Math.abs(decimal);

  const degrees = Math.floor(absDecimal);
  const minutesDecimal = (absDecimal - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

  return {
    degrees: isNegative ? -degrees : degrees,
    minutes,
    seconds: parseFloat(seconds),
  };
}

/**
 * Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 * @param {number} degrees - Degree value
 * @param {number} minutes - Minutes value
 * @param {number} seconds - Seconds value
 * @returns {number} Decimal degree value
 */
export function dmsToDecimal(degrees, minutes = 0, seconds = 0) {
  const isNegative = degrees < 0;
  const absDegrees = Math.abs(degrees);

  const decimal = absDegrees + minutes / 60 + seconds / 3600;
  return isNegative ? -decimal : decimal;
}

/**
 * Format DMS for display
 * @param {number} degrees
 * @param {number} minutes
 * @param {number} seconds
 * @returns {string} Formatted string like "28° 12' 34.56""
 */
export function formatDMS(degrees, minutes, seconds) {
  const direction = degrees < 0 ? (degrees < 0 ? "S" : "N") : degrees < 0 ? "W" : "E";
  const absDegrees = Math.abs(degrees);
  return `${absDegrees}° ${minutes}' ${parseFloat(seconds).toFixed(2)}"`;
}
