import { buildRecord } from '@root/common'
import type { LogRecord } from '@root/common'

const RECORD_SEP = '\n'

/**
 * Pack mobile log records joined by a newline separator.
 */
export const buildRecords = (records: LogRecord[]): string => {
  return records.map(buildRecord).join(RECORD_SEP)
}
