import type { MobileContext } from './context'

export const buildSessId = (ctx: MobileContext): string => {
  return `${ctx.startTime}#968#${ctx.app.version}#${ctx.app.buildCode}`
}

export const buildSidRefer = (ctx: MobileContext): string => {
  return `${ctx.startTime}#991#${ctx.app.version}#${ctx.app.buildCode}`
}
