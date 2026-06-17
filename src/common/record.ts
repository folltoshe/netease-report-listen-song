export const FIELD_SEP = '\x01'

export interface LogRecord {
  // ms
  time: number
  // act
  action: string
  // json
  data: string | Object
}

/**
 * Frame a single log record as `<time>\x01<action>\x01<json>`.
 */
export const buildRecord = ({ time, action, data }: LogRecord): string => {
  const json = typeof data === 'string' ? data : JSON.stringify(data)
  return [time, action, json].join(FIELD_SEP)
}
