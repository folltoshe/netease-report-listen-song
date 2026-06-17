import type { SongInfo } from '@root/common/context'
import type { DesktopContext } from '@root/desktop/context'

import { SourceInfo } from '@root/common/context/song'
import { Logger } from '@root/desktop'

import { buildPlv, buildPld } from '@root/desktop/modules'
import { crerateRandomNumber, sleep } from '@root/utils'

const ctx: DesktopContext = {
  app: {
    id: '',
    urs: '',
    pid: '',
    nsm: '1.0.0',
    cid: 'lqdloz.1781634768551.01.0',
    channel: 'netease',
    version: '3.1.35',
    versionCode: '205293',
    buildCode: '',
    buildType: 'release',
    packageId: '',
  },
  device: {
    id: '',
    ti: '',
    sign: '',
    model: '',
    nnid: ',',
    nuid: '',
    csrf: '',
    systemType: 'pc',
    systemVersion: 'Microsoft-Windows-11-Professional-build-26220-64bit',
  },
  auth: {
    id: '',
    token: '',
    sessionId: '',
    vipType: '',
  },
  startTime: Date.now(),
  processId: crerateRandomNumber(99999, 10000),
}

const currentSong: SongInfo = {
  id: 2651562175,
  name: 'Fearless 无所畏惧',
  artist: 'HOYO-MiX',
  vip: false,
  level: 'exhigh',
  bitrate: 256,
  time: 202,
}

const nextSong: SongInfo = {
  id: 3375694932,
  name: '「拉海洛」之心',
  artist: '',
  vip: false,
  level: 'exhigh',
  bitrate: 256,
  time: 205,
}

const source: SourceInfo = {
  id: '2995977532',
  type: 'track',
  name: 'likeMusic',
}

const main = async () => {
  const ts = Math.floor(ctx.startTime / 1000)

  const logger = new Logger(ctx)

  const plv = buildPlv(ctx, nextSong, source)
  logger.add(plv, '_plv', ts)
  await logger.upload()

  const played = Math.floor(nextSong.time / 2)
  await sleep(played * 1000)
  const pld = buildPld(ctx, nextSong, source, played)
  logger.add(pld, '_pld', ts)
  await logger.upload()
}

main()
