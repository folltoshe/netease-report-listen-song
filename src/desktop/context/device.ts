export interface DesktopDeviceInfo {
  // deviceId (PC format)
  id: string
  // NMTID
  ti: string
  // Client signature blob
  sign: string
  // _ntes_nnid
  nnid: string
  // _ntes_nuid
  nuid: string
  // Device model, e.g. "X15 AT 22"
  model: string
  // __csrf token
  csrf: string
  // System type, always "pc"
  systemType: string
  // System version, e.g. Microsoft-Windows-11-Professional-build-26220-64bit
  systemVersion: string
}
