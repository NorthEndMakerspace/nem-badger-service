import { Tool } from './tool'
import express from 'express'
import colors from '@colors/colors/safe'
import { config } from './config'
import winston from 'winston'
import Redis from './redis'

const mira = new Tool('Mira Laser', 'laser_mira', 'mira_stev01')

const app = express()
const loggerColors = {
  DB: 'blue',
  HTTP: 'yellow',
  REDIS: 'magenta',
}

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format((info) => {
      info.level = `[${info.level.padEnd(7)}]`
      return info
    })(),
    winston.format.colorize(),
    winston.format.printf((info) => {
      let rest = JSON.stringify(
        Object.assign({}, info, {
          level: undefined,
          message: undefined,
          splat: undefined,
          service: undefined,
        }),
      )
      if (rest === '{}') {
        rest = ''
      }

      let service = (info.service || '').padEnd(8)
      // @ts-ignore
      const color = info.service && loggerColors[info.service] ? loggerColors[info.service] : 'cyan'
      // @ts-ignore
      service = colors[color](service)
      return `${info.level} ${service} ${info.message} ${colors.gray(rest)}`
    }),
    winston.format.errors({ stack: true }),
  ),
})

const logger = winston.createLogger({
  level: config.logLevel,
  transports: [consoleTransport],
})

const redis = new Redis(config.redis, logger.child({ service: 'REDIS' }))
