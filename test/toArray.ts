import { isArray } from 'lodash';

/**
 * Convert a string or string array value to a string array
 */
export function toArray<T>(val: T | T[]): T[] {
  return isArray(val) ? (val as T[]) : [val as T];
}
