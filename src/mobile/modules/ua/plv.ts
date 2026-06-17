import type { SongInfo } from '@root/common/context'
import type { MobileContext } from '@root/mobile/context'
import type { LogData } from '@root/mobile/logger'

import { buildSessId, buildSidRefer } from '@root/mobile/session'

export const buildPlv = (ctx: MobileContext, song: SongInfo): LogData => {
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
    alg: 'alg_hp_tr_lan_red',
    artistName: artist,
    audioLevel: level,
    bitrate: bitrate,
    copyright: 1,
    currentProcessName: ctx.app.packageId,
    download: 0,
    fee: 1,
    file: 4,
    id: id,
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
    logtime: start,
    mode: 'circulation',
    npu_bitrate: -1,
    pid: Number(ctx.app.pid),
    playermodel_id: '76001',
    preferrefer: '',
    privilege_viptype: 0,
    process_id: ctx.app.pid,
    realtime: 0,
    reference_id: '',
    resource_ratio: 0,
    resource_time: time,
    rightSource: 0,
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
    time: 0,
    trialMode: 6,
    type: 'song',
    viptype: ctx.auth.vipType,
    wifi: 1,
  }
}
