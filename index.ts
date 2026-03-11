import type { ClientInfo, DeviceInfo, UserInfo } from './src/interface'

import { sleep } from './src/utils'
import { reportLog } from './src'

const userInfo: UserInfo = {
  // 用户id
  id: 0,
  // 在cookie中获取
  auth: {
    token: '',
    rt: '',
    at: '',
  },
}

const clientInfo: ClientInfo = {
  type: 'andrtv',
  channel: 'netease',
  version: '1.1.80',
  versionCode: '1001080',
  buildCode: '260227151229',
  packageType: 'dev',
  mspm: '5f3ab1ea81c235b0c828bc64',
  ncmid: 'jwmwbn.1773077005729.01.4',
}

// 根据你的设备信息修改
const deviceInfo: DeviceInfo = {
  id: '',
  brand: '',
  name: '',
  resolution: '',
  nmdi: '',
  evnsm: '1.0.0',
  system: {
    type: 'android',
    version: '14',
  },
}

// 歌曲id
const songId = 3340137252
// 歌曲名称
const songName = '纸飞机'
// 列表id
const listId = 0

const main = async () => {
  console.log(`try to report, songId=${songId} songName=${songName} listId=${listId}`)

  const base = Date.now()

  // 假装休眠一会
  await sleep(5000)
  console.log('sleep 5s')

  const resp = await reportLog({ client: clientInfo, device: deviceInfo, user: userInfo }, { baseTime: base, songId, songName, listId })
  console.log(`report resp: ${resp}`)
}

main()
