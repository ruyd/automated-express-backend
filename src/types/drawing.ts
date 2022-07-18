import { DataTypes } from 'sequelize'
import { UserModel } from './user'
import { register } from '../shared/db'

import { Entity, User } from '.'

export enum ActionType {
  Open = 0,
  Close = 1,
  Stroke = 2,
}

/**
 * Reducing space as much as possible
 *
 * c: color
 * w: width/size
 * ts: unix timestamp
 */
// better space would be, mini serializer needed
// JSON.stringify([...Object.values({ x, y, t, w, st, ts })])
export interface DrawAction {
  t: ActionType
  x?: number
  y?: number
  c?: string
  w?: number
  ts?: number
}

export interface Drawing extends Entity {
  id?: string
  userId?: string
  name: string
  history: DrawAction[]
  thumbnail?: string
  private?: boolean
  user?: User
}

// might be better to add up all open closes hmm
export function getTimeSpent(d: Drawing): number {
  if (d.history.length < 2) {
    return 0
  }
  const first = d.history[0].ts as number
  const last = d.history[d.history.length - 1].ts as number
  const millisecs = last - first
  return millisecs
}

export function getDuration(d: Drawing) {
  const secs = Math.round(getTimeSpent(d) / 1000)
  const mins = Math.round(secs / 60)
  const hours = Math.round(mins / 60)
  const rem = secs % 60
  return `${hours}h:${mins}m:${rem}s`
}

export const DrawingModel = register<Drawing>(
  'drawing',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
    },
    name: {
      type: DataTypes.STRING,
    },
    history: {
      type: DataTypes.JSONB,
    },
    thumbnail: {
      type: DataTypes.TEXT,
    },
  },
  true
)

DrawingModel.hasOne(UserModel, {
  as: 'user',
  foreignKey: 'userId',
  sourceKey: 'userId',
})
