export interface DeviceInfo {
  // Device Id, deviceId | sDeviceId
  id: string
  // NMDI
  di: string
  // NMTID
  ti: string
  // Device Name
  name: string
  // Device Brand
  brand: string
  // Device Board
  board: string
  // oaid
  oaid: string
  // wifi mac
  mac: string
  // Client Ipv4
  networkIpv4: string
  // Client Ipv6
  networkIpv6: string
  // Client Net Operator
  networkOperator: string
  // Device Cpu Arch Name, e.g. [arm64-v8a]
  cpuArch: string
  // Device Cpu Name
  cpuName: string
  // Device Screen Type
  screenType: string
  // Device Screen Size
  screenSize: string
  // Device System Type, e.g. android
  systemType: string
  // System Version
  systemVersion: string
  // System Id, e.g. androidId
  androidId: string
}
