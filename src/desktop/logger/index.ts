import FormData from 'form-data'

import type { DesktopContext } from '../context'
import type { LogRecord } from '@root/common'

import { randomUUID } from 'node:crypto'
import { encrypt } from '@root/common'
import { crerateRandomNumber } from '@root/utils'
import { createBaseFetch } from '@root/utils/fetch'

import { buildRecords } from '../record'

export type LogData = Record<string, any>

export interface UploadForm {
  name: string
  form: FormData
  payload: Buffer
}

const UPLOAD_URL = 'https://clientlog3.music.163.com/api/clientlog/encrypt/upload'

export class Logger {
  private readonly queue: LogRecord[] = []

  private seq = 0

  constructor(public readonly context: DesktopContext) {}

  private buildMeta(): string {
    const { app, device, auth } = this.context
    return JSON.stringify({
      'JSESSIONID-WYYY': auth.sessionId,
      MUSIC_U: auth.token,
      NMTID: device.ti,
      WEVNSM: app.nsm,
      WNMCID: app.cid,
      __csrf: device.csrf,
      _iuqxldmzr_: '33',
      _ntes_nnid: device.nnid,
      _ntes_nuid: device.nuid,
      appver: `${app.version}.${app.versionCode}`,
      channel: app.channel,
      clientSign: device.sign,
      deviceId: device.id,
      mode: device.model,
      ntes_kaola_ad: '1',
      os: device.systemType,
      osver: device.systemVersion,
    })
  }

  private buildFileName(): string {
    const a = crerateRandomNumber(99999, 10000)
    const rand = crerateRandomNumber(4294967295, 1)
    return `op_${a}_${this.seq++}_${rand}`
  }

  private buildForm(records: LogRecord[]): UploadForm {
    const body = buildRecords(records)
    const payload = encrypt({ meta: this.buildMeta(), body })
    const name = this.buildFileName()

    const form = new FormData()
    form.setBoundary(randomUUID())
    form.append('file', payload, {
      filename: name,
      contentType: 'multipart/form-data',
    })

    return { name, form, payload }
  }

  private buildHeaders(): Record<string, string> {
    const { app } = this.context
    return {
      Referer: 'https://music.163.com/di',
      'User-Agent': `Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.164 NeteaseMusicDesktop/${app.version}`,
      'Accept-Encoding': 'gzip,deflate',
      'Accept-Language': 'zh-CN,zh;q=0.8',
    }
  }

  private buildCookies(): Record<string, string> {
    const { app, device, auth } = this.context
    return {
      'JSESSIONID-WYYY': auth.sessionId,
      MUSIC_U: auth.token,
      NMTID: device.ti,
      WEVNSM: app.nsm,
      WNMCID: app.cid,
      __csrf: device.csrf,
      _iuqxldmzr_: '33',
      _ntes_nnid: device.nnid,
      _ntes_nuid: device.nuid,
      appver: `${app.version}.${app.versionCode}`,
      channel: app.channel,
      clientSign: device.sign,
      deviceId: device.id,
      mode: device.model,
      ntes_kaola_ad: '1',
      os: device.systemType,
      osver: device.systemVersion,
    }
  }

  add(data: LogData, action: string, time?: number): this {
    this.queue.push({ time: time ?? Math.floor(Date.now() / 1000), action, data })
    return this
  }

  async upload(): Promise<boolean> {
    if (!this.queue.length) return false

    const records = this.queue.slice()
    this.clear()

    const { name, form } = this.buildForm(records)

    return createBaseFetch(UPLOAD_URL, {
      method: 'POST',
      headers: { ...this.buildHeaders(), ...form.getHeaders() },
      cookies: this.buildCookies(),
      params: { multiupload: 'true' },
      body: { data: form },
    })
      .request.then(resp => {
        const body: any = resp.body
        if (body?.code !== 200 || !body?.data?.successfiles?.includes?.(name)) {
          console.log('upload op failed', JSON.stringify(body))
          return false
        }
        console.log('upload op success', JSON.stringify(body?.data?.successfiles))
        return true
      })
      .catch(err => {
        console.log('upload op error', err?.message ?? err)
        return false
      })
  }

  clear(): void {
    this.queue.length = 0
  }
}
