import { randomUUID } from 'node:crypto'

import FormData from 'form-data'

import type { MobileContext } from '../context'
import type { LogRecord } from '@root/common'

import { encrypt } from '@root/common'
import { buildRecords } from '../record'
import { crerateRandomNumber } from '@root/utils'
import { createBaseFetch } from '@root/utils/fetch'

export type LogType = 'bi' | 'ua' | 'sysdebug' | 'monitor'

export type LogData = Record<string, any>

export interface UploadForm {
  name: string
  form: FormData
  payload: Buffer
}

const UPLOAD_URL: Record<LogType, string> = {
  bi: 'https://clientlogsf.music.163.com/api/clientlog/encrypt/upload',
  ua: 'https://clientlogsf.music.163.com/api/clientlog/encrypt/upload',
  monitor: 'https://clientlogdep.music.163.com/api/clientlog/encrypt/upload/sysaction',
  sysdebug: 'https://clientlogdep.music.163.com/api/clientlog/encrypt/upload/sysaction',
}

export abstract class BaseLogger {
  protected readonly queue: LogRecord[] = []

  private seq = 0

  constructor(
    public readonly type: LogType,
    public readonly context: MobileContext
  ) {}

  protected commonKeys(): LogData {
    return {
      abtest: '',
      buildType: this.context.app.buildType,
      lca: 1,
      netstatus: 'wifi',
    }
  }

  protected buildMeta(): string {
    const { auth, app } = this.context
    return JSON.stringify({
      MUSIC_U: auth.token,
      URS_APPID: app.urs,
      appver: app.version,
      buildver: app.buildCode,
    })
  }

  protected buildFileName(): string {
    const a = crerateRandomNumber(99999, 10000)
    const rand = crerateRandomNumber(4294967295, 1)
    return `flush_${this.type}_${a}_${this.seq++}_${rand}`
  }

  protected buildForm(records: LogRecord[]): UploadForm {
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

  protected buildHeaders(): Record<string, string> {
    const { app, device, auth } = this.context
    return {
      'x-music-u': auth.token,
      'x-deviceid': device.id,
      'x-os': device.systemType,
      'x-osver': device.systemVersion,
      'x-sdeviceid': device.id,
      'x-buildver': app.buildCode,
      'x-mam-custommark': 'cronet',
      'mconfig-info': JSON.stringify({ IuRPVVmc3WWul9fT: { version: '509952', appver: app.version } }),
      'user-agent': `NeteaseMusic/${app.version}.${app.buildCode}(${app.versionCode}); Dalvik/2.1.0 (Linux; U; Android ${device.systemVersion}; ${device.name} Build/UP1A.231005.007)`,
    }
  }

  protected buildCookies(): Record<string, string> {
    const { app, device, auth } = this.context
    return {
      EVNSM: app.nsm,
      NMCID: app.cid,
      versioncode: app.versionCode,
      MUSIC_A_T: app.at,
      URS_APPID: app.urs,
      buildver: app.buildCode,
      resolution: device.screenSize,
      sDeviceId: device.id,
      ntes_kaola_ad: '1',
      mobilename: device.name,
      brand: device.brand,
      osver: device.systemVersion,
      MUSIC_U: auth.token,
      os: device.systemType,
      channel: app.channel,
      screenType: device.screenType,
      deviceId: device.id,
      NMDI: device.di,
      appver: app.version,
      MUSIC_R_T: app.rt,
      NMTID: device.ti,
      packageType: app.buildType,
      minors_mode_age_range: '0',
    }
  }

  add(data: LogData, action: string, time?: number): this {
    const payload: LogData = {
      ...data,
      _eventcode: action,
      _log_thoroughfare: this.type,
    }
    this.queue.push({ time: time ?? Math.floor(Date.now() / 1000), action, data: payload })
    return this
  }

  async upload(): Promise<boolean> {
    if (!this.queue.length) return false

    const records = this.queue.slice()
    this.clear()

    const { name, form } = this.buildForm(records)
    // console.log(form)
    // return false

    return createBaseFetch(UPLOAD_URL[this.type], {
      method: 'POST',
      headers: { ...this.buildHeaders(), ...form.getHeaders() },
      cookies: this.buildCookies(),
      params: { multiupload: 'true' },
      body: { data: form },
    })
      .request.then(resp => {
        const body: any = resp.body
        if (body?.code !== 200 || !body?.data?.successfiles?.includes?.(name)) {
          console.log(`upload ${this.type} failed`, JSON.stringify(body))
          return false
        }
        console.log(`upload ${this.type} success`, JSON.stringify(body?.data?.successfiles))
        return true
      })
      .catch(err => {
        console.log(`upload ${this.type} error`, err?.message ?? err)
        return false
      })
  }

  clear(): void {
    this.queue.length = 0
  }
}
