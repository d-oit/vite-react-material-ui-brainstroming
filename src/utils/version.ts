/**
 * Convert a semantic version string to a numeric version
 * @param version Version string in format 'x.y.z' or number
 * @returns Numeric version (major number)
 */
export function normalizeVersion(version: string | number): number {
  if (typeof version === 'number') {
    return Math.floor(version);
  }

  const match = /^(\d+)/.exec(version);
  return match ? Number(match[1]) : 1;
}

/**
 * Convert a numeric version to a semantic version string
 * @param version Numeric version
 * @returns Semantic version string
 */
export function formatVersion(version: number): string {
  return `${version}.0.0`;
}

/**
 * Check if a version is valid
 * @param version Version to check
 */
export function isValidVersion(version: unknown): version is number {
  if (typeof version === 'number') {
    return Number.isInteger(version) && version > 0;
  }
  if (typeof version === 'string') {
    // Use a safer regex with explicit limits
    // This regex matches version strings like '1', '1.0', '1.0.0', etc.
    // with a maximum of 5 version segments and each segment limited to 5 digits
    // This is a safe regex with explicit limits
    // eslint-disable-next-line security/detect-unsafe-regex
    return /^\d{1,5}(\.\d{1,5}){0,4}$/.test(version);
  }
  return false;
}

export const DEFAULT_VERSION = 1;
