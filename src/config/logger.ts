import pino from 'pino';
import { env } from './env';

const isProduction = env.NODE_ENV === 'production';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  ...(!isProduction && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
        errorProps: '*',
        customColors: 'fatal:bgMagenta,error:bgRed,warn:bgYellow black,info:cyan,debug:white',
        messageFormat: '{msg}',
      },
    },
  }),
});
