import FormData from 'form-data'

import type { ClientInfo, DeviceInfo, PlayInfo, UserInfo } from './interface'

import { createBaseFetch } from './fetch'
import { createRandomString, crerateRandomNumber, sleep, createZip, ZipEntryFile } from './utils'

interface AuthParams {
  client: ClientInfo
  device: DeviceInfo
  user: UserInfo
}

const JOIN_CHAR = '\x01'

const buildHeaders = ({ user, client, device }: AuthParams) => {
  return {
    cmpageid: 'MainActivity',
    'mconfig-info': JSON.stringify({ IuRPVVmc3WWul9fT: { version: '509952', appver: client.version } }),
    'user-agent': `NeteaseMusic/${client.version}.${client.buildCode}(${client.versionCode}); Dalvik/2.1.0 (Linux; U; Android ${device.system.version}; ${device.name} Build/UP1A.231005.007)`,
  }
}

const buildCookies = ({ user, client, device }: AuthParams) => {
  return {
    EVNSM: device.evnsm,
    osver: device.system.version,
    MUSIC_U: user.auth.token,
    NMCID: client.ncmid,
    versioncode: client.versionCode,
    MUSIC_A_T: user.auth.at,
    buildver: client.buildCode,
    resolution: device.resolution,
    sn: '',
    sDeviceId: device.id,
    os: client.type,
    channel: client.channel,
    deviceId: device.id,
    appver: client.version,
    NMDI: device.nmdi,
    MUSIC_R_T: user.auth.rt,
    mobilename: device.name,
    distributeChannel: encodeURIComponent(`${client.type}$${JSON.stringify({ channel: client.channel })}`),
    packageType: client.packageType,
  }
}

const uploadLog = async ({ url, form, withAuth, auth }: { url: string; form: FormData; withAuth: boolean; auth: AuthParams }) => {
  return createBaseFetch(url, {
    method: 'POST',
    headers: { ...buildHeaders(auth), ...form.getHeaders() },
    cookies: buildCookies(auth),
    params: {
      ...(withAuth ? { oc: auth.user.auth.token } : {}),
    },
    body: {
      data: form,
    },
  }).request
}

const buildCommonParams = (auth: AuthParams, playInfo: PlayInfo) => {
  // 这里面的数据可能会有变化
  return {
    _addUndefineRefer: 'androidx.constraintlayout.widget.ConstraintLayout',
    _addrefer: `[F:2111][${playInfo.baseTime}#862#${auth.client.version}#${auth.client.buildCode}][p][1][17][page_tv_songlist_detail][${playInfo.listId}:list::]`,
    _hsrefer: '[F:62][e][3][15][cell_tv_mine_func_entrance:2|page_tv_mine|page_tv_main][liked:spm::|:::|:::]',
    _multirefers: JSON.stringify([
      `[F:63][${playInfo.baseTime}#862#${auth.client.version}#${auth.client.buildCode}][e][3][15][cell_tv_mine_func_entrance:2|page_tv_mine|page_tv_main][liked:spm::|:::|:::]`,
      `[F:2111][${playInfo.baseTime}#862#${auth.client.version}#${auth.client.buildCode}][p][1][1][page_tv_appstart][0:tv_function::]`,
    ]),
  }
}

const buildStartTime = (baseTime: number) => {
  return Math.floor(baseTime / 1000) - crerateRandomNumber(300, 100)
}

const buildConsumeLog = (auth: AuthParams, playInfo: PlayInfo, seq: number) => {
  const startTime = buildStartTime(playInfo.baseTime)

  const common = buildCommonParams(auth, playInfo)

  const action = 'auto_consume'
  const data = {
    abtest: '',
    buildType: auth.client.packageType,
    extra_props: {
      ...common,
      alg: 'null',
      bitrate: 96,
      brand: auth.device.brand,
      channel: auth.client.channel,
      copyright: 1,
      download: 0,
      end: 'ui',
      errorcode: -1,
      fee: 1,
      file: 4,
      format: 'other',
      id: playInfo.songId,
      is_atmosphere: 0,
      // 未知
      mode: 'circulation',
      player_style: '',
      // 来源
      source: 'iot_list',
      // 来源id（列表id）
      sourceId: playInfo.listId,
      startlogtime: startTime,
      status: 'front',
      // 可能是当前播放的时间?
      time: 100,
      type: 'song',
      vipType: 15,
      wifi: 1,
    },
    lca: 1,
    libra_abt: '',
    // 网络状态
    netstatus: 'wifi',
    // 固定
    pid: 12567,
    scm: '0',
    seq,
    spm: 'PlayerActivity.0.0.0.0.0',
    uuid: '0',
    viptype: '0',
  }

  return [action, JSON.stringify(data)].join(JOIN_CHAR)
}

const buildStartPlayLog = (auth: AuthParams, playInfo: PlayInfo, seq: number) => {
  const startTime = buildStartTime(playInfo.baseTime)

  const common = buildCommonParams(auth, playInfo)

  const action = 'startplay'
  const data = {
    ...common,
    abtest: '',
    alg: 'null',
    bitrate: 256,
    brand: auth.device.brand,
    buildType: auth.client.packageType,
    channel: auth.client.channel,
    copyright: 1,
    download: 0,
    fee: 1,
    file: 4,
    id: playInfo.songId,
    is_atmosphere: 0,
    lca: 1,
    libra_abt: '',
    mode: 'circulation',
    mspm: auth.client.mspm,
    netstatus: 'wifi',
    // 固定
    pid: 12567,
    player_style: '',
    seq,
    source: 'iot_list',
    sourceId: playInfo.listId,
    startlogtime: startTime,
    status: 'front',
    time: 0,
    type: 'song',
    // 账号的 vipType
    vipType: 15,
    wifi: 1,
  }

  return [action, JSON.stringify(data)].join(JOIN_CHAR)
}

const buildPlayLog = (auth: AuthParams, playInfo: PlayInfo, seq: number) => {
  const startTime = buildStartTime(playInfo.baseTime)

  const common = buildCommonParams(auth, playInfo)

  const action = 'play'
  const data = {
    ...common,
    abtest: '',
    alg: 'null',
    bitrate: 96,
    brand: auth.device.brand,
    buildType: auth.client.packageType,
    channel: auth.client.channel,
    copyright: 1,
    download: 0,
    end: 'ui',
    errorcode: -1,
    fee: 1,
    file: 4,
    format: 'other',
    id: playInfo.songId,
    is_atmosphere: 0,
    lca: 1,
    libra_abt: '',
    lt: 1,
    mode: 'circulation',
    mspm: auth.client.mspm,
    netstatus: 'wifi',
    pid: 12567,
    player_style: '',
    seq,
    source: 'iot_list',
    sourceId: playInfo.listId,
    startlogtime: startTime,
    status: 'front',
    time: 100,
    type: 'song',
    vipType: 15,
    wifi: 1,
  }

  return [action, JSON.stringify(data)].join(JOIN_CHAR)
}

export const reportLog = async (auth: AuthParams, playInfo: PlayInfo) => {
  const baseSeq = crerateRandomNumber(1145, 14)

  const consumeLog = buildConsumeLog(auth, playInfo, baseSeq + crerateRandomNumber(20, 10))
  const startPlayLog = buildStartPlayLog(auth, playInfo, baseSeq + crerateRandomNumber(30, 20))
  const playLog = buildPlayLog(auth, playInfo, baseSeq + crerateRandomNumber(100, 50))

  // 假装统计了一会再上报的样子
  const sleepTime = crerateRandomNumber(14, 10)
  console.log(`wait for upload, time=${sleepTime}`)
  await sleep(sleepTime * 1000)

  const now = Math.floor(Date.now() / 1000)

  const consume = [now, consumeLog].join(JOIN_CHAR)
  const startPlay = [now, startPlayLog].join(JOIN_CHAR)
  const play = [now, playLog].join(JOIN_CHAR)
  const body = [consume, startPlay, play].join('\n')

  const random = createRandomString(14, '0123456789')
  const fileName = `${auth.user.id}_${random}`

  const entry: ZipEntryFile[] = [{ name: fileName, buffer: Buffer.from(body, 'utf-8') }]
  const zip = await createZip(entry)

  const form = new FormData()
  form.append('attach', zip, {
    filename: 'log',
    contentType: 'application/zip',
  })

  const url = 'https://clientlog.music.163.com/api/clientlog/upload'
  return uploadLog({ url, form, withAuth: true, auth })
    .then(resp => {
      console.log('then upload resp', JSON.stringify(resp.body))
      if (resp.body?.code !== 200 || !resp.body?.data?.successfiles?.includes?.('log')) {
        return false
      }
      return true
    })
    .catch(err => {
      console.log('catch upload resp', err)
      return false
    })
}
