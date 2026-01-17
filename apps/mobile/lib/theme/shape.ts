export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const

export type Radius = typeof radius
export type RadiusKey = keyof Radius
