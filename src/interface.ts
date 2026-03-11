export interface UserInfo {
  id: number
  auth: {
    // MUSIC_U
    token: string
    // MUSIC_A_T
    at: string
    // MUSIC_R_T
    rt: string
  }
}

export interface ClientInfo {
  type: 'andrtv' | 'pc' | 'android'
  channel: string
  packageType: string
  version: string
  versionCode: string
  buildCode: string
  mspm: string
  ncmid: string
}

export interface DeviceInfo {
  id: string
  name: string
  brand: string
  resolution: string
  nmdi: string
  evnsm: string
  system: {
    type: string
    version: string
  }
}

export interface PlayInfo {
  baseTime: number
  songId: number
  songName: string
  listId: number
}
