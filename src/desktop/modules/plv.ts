import { SourceInfo } from '@root/common/context/song'
import type { DesktopContext, SongInfo } from '../context'
import type { LogData } from '../logger'

export const buildPlv = (ctx: DesktopContext, song: SongInfo, source: SourceInfo): LogData => {
  const now = Date.now()

  const addRefer = `[F:63][${now}#933#${ctx.app.version}#${ctx.app.versionCode}#c9156c3][e][2][23][cell_pc_songlist_song:2|page_pc_songlist_songflow|page_mine_like_music][${song.id}:song:x:x|:::|${source.id}:list::]`
  const multiRefers = [
    '[F:26][s][18][_ai]',
    '[F:26][s][12][_ai]',
    `[F:63][${now}#933#${ctx.app.version}#${ctx.app.versionCode}#c9156c3][e][2][8][cell_pc_main_tab_entrance:6|page_pc_main_tab][我喜欢的音乐:spm::|:::]`,
    '[F:26][s][5][_ai]',
    '[F:26][s][0][_ai]',
  ]

  return {
    mode: 'circulation',
    download: 0,
    alg: '',
    status: 'front',
    id: String(song.id),
    bitrate: song.bitrate,
    type: 'song',
    is_listentogether: 0,
    source: source.name,
    is_heart: 0,
    resource_ratio: '',
    resource_time: song.time,
    musiceffect_id: '',
    app_mode: 2,
    bitrate_level: song.level,
    _addrefer: addRefer,
    _multirefers: multiRefers,
    vipType: ctx.auth.vipType,
    fee: 1,
    file: 4,
    rightSource: 0,
    sourceId: source.id,
    sourcetype: source.type,
    libra_abt: '',
    channel: ctx.app.channel,
    curStartChannel: '',
  }
}
