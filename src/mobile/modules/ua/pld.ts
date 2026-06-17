import type { SongInfo } from '@root/common/context'
import type { MobileContext } from '@root/mobile/context'
import type { LogData } from '@root/mobile/logger'

import { buildSessId, buildSidRefer } from '@root/mobile/session'

export const buildPld = (ctx: MobileContext, song: SongInfo, played: number): LogData => {
  const { id, name, artist, level, bitrate, vip, time } = song

  const start = ctx.startTime
  const sessId = buildSessId(ctx)

  const multirefers = JSON.stringify([`[F:27][${sessId}][s][13][_ai]`, `[F:27][${sessId}][s][0][_ai]`])

  return {
    _addUndefineRefer: `[F:62][p][2][57][page_mine|page_main][:::|:::]`,
    _addrefer: ``,
    _hsrefer: `[F:62][p][2][57][page_mine|page_main][:::|:::]`,
    _multirefers: multirefers,
    _sessid: sessId,
    _sidrefer: buildSidRefer(ctx),
    // 未知字段，先置空
    alg: 'alg-music-rec-unite-hpStyleRec_lan-hstu_style_category_1',
    appVol: 0,
    artistName: artist,
    audioLevel: level,
    bitrate: bitrate,
    copyright: 1,
    currentProcessName: ctx.app.packageId,
    download: 0,
    enableSepTrack: 0,
    end: 'interrupt',
    end_source: 100,
    errorcode: -1,
    fee: 1,
    file: 4,
    finalVol: 0,
    format: 'm4a',
    id: id,
    ignoreBatteryOpt: 0,
    isForegroundService: 1,
    isMergeProcess: 1,
    isQuickListenFramework: 1,
    isVipSong: vip ? 1 : 0,
    is_autoplay: 0,
    is_heart: '0',
    is_horizontal: 0,
    is_listentogether: 0,
    lags: '',
    // 未知字段，先置空
    libra_abt: '',
    list_start: 'manual',
    listentogether_room: '',
    logtime: start + played * 1000,
    mode: 'circulation',
    npu_bitrate: -1,
    pid: Number(ctx.app.pid),
    play_extra: { deviceType: 0, readType: 0 },
    play_speed: 1,
    playermodel_id: '76001',
    preferrefer: '',
    privilege_viptype: 0,
    process_id: ctx.app.pid,
    progressTime: played,
    realtime: played,
    reference_id: '',
    resource_ratio: 0,
    resource_time: time,
    rightSource: 0,
    skip_reason: 'ui',
    sleeping_resid: '',
    songInd: 0,
    songName: name,
    song_add: 'auto',
    song_start: 'first',
    sound_effect_id: '{}',
    source: 'PAGE_RECOMMEND_PRIVATE_RCMD_SONG',
    sourceId: '0',
    sp_fl: 0,
    sp_flag: 4161540,
    sp_pay: 1,
    sp_pl: 5999000,
    sp_playMaxbr: 5999000,
    sp_source: 'SERVER',
    startlogtime: Math.floor(start / 1000),
    status: 'front',
    supportSepTrack: 1,
    time: played,
    trialMode: 6,
    type: 'song',
    viptype: ctx.auth.vipType,
    volumeBalance: '[0,0]',
    wifi: 1,
  }
}
