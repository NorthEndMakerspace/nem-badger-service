type Config = {
  port: number
  logLevel: string
  redis: RedisConfig
  notion: NotionConfig
}

export type RedisConfig = {
  host: string
  port: number
  password: string
}

export type NotionConfig = {
  // TODO
}

export const config: Config = {
  port: process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 5001,
  logLevel: process.env.LOG_LEVEL || 'info',
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || 'nem',
  },
  notion: {},
}
