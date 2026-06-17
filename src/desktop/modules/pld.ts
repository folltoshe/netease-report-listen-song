import { SourceInfo } from '@root/common/context/song'
import type { DesktopContext, SongInfo } from '../context'
import type { LogData } from '../logger'

export const buildPld = (ctx: DesktopContext, song: SongInfo, source: SourceInfo, played: number): LogData => {
  const now = Date.now()

  const addRefer = `[F:63][${now}#616#${ctx.app.version}#${ctx.app.versionCode}#c9156c3][e][2][92][btn_pc_cover_play|cell_pc_songlist_song:6|page_pc_songlist_songflow|page_mine_like_music][:::|${song.id}:song:x:x|:::|${source.id}:list::]`
  const multiRefers = ['[F:26][s][87][_ai]', '[F:26][s][81][_ai]', '[F:26][s][75][_ai]', '[F:26][s][69][_ai]', '[F:26][s][63][_ai]']

  return {
    mode: 'circulation',
    download: 0,
    alg: '',
    status: 'front',
    id: String(song.id),
    time: played,
    type: 'song',
    is_listentogether: 0,
    source: source.name,
    is_heart: 0,
    realtime: played,
    resource_ratio: '',
    resource_time: song.time,
    musiceffect_id: '1001',
    app_mode: 1,
    lyriceffect: 'default',
    displayMode: 'classic',
    bitrate: song.bitrate,
    bitrate_level: song.level,
    _addrefer: addRefer,
    _multirefers: multiRefers,
    vipType: ctx.auth.vipType,
    fee: 8,
    file: 4,
    rightSource: 0,
    sourceId: source.id,
    sourcetype: source.type,
    end: 'interrupt',
    libra_abt: '',
    channel: ctx.app.channel,
    curStartChannel: '',
  }
}
