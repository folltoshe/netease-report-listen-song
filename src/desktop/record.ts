import { buildRecord } from '@root/common'
import type { LogRecord } from '@root/common'

export const buildRecords = (records: LogRecord[]): string => {
  return records.map(buildRecord).join('')
}
