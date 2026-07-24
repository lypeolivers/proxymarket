import type { WheelEventHandler } from 'react'

/** Stops wheel events from bubbling to scrollable ancestors (e.g. dialog body). */
export const preventScrollChainingOnWheel: WheelEventHandler = (e) => {
  e.stopPropagation()
}
