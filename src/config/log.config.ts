import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ConfigService } from '@nestjs/config'
import * as winston from 'winston'
import DailyRotateFile = require('winston-daily-rotate-file')

export function buildLogConfig(config: ConfigService) {
    const logDirectory = resolve(process.cwd(), config.get<string>('LOG_DIR') ?? 'logs')
    mkdirSync(logDirectory, { recursive: true })

    const colors = {
        reset: '\u001B[0m',
        green: '\u001B[32m',
        yellow: '\u001B[33m',
        red: '\u001B[31m',
        magenta: '\u001B[35m',
        cyan: '\u001B[36m',
    }

    const levelColors: Record<string, string> = {
        error: colors.red,
        warn: colors.yellow,
        info: colors.green,
        debug: colors.magenta,
        verbose: colors.cyan,
    }

    const levelLabels: Record<string, string> = {
        error: 'ERROR',
        warn: 'WARN',
        info: 'LOG',
        debug: 'DEBUG',
        verbose: 'VERBOSE',
    }

    function colorizeRequestMessage(message: unknown): string {
        const text = String(message)
        const match = text.match(/^(\S+ \S+ \d{3}) (\+\d+ms)([\s\S]*)$/)

        if (!match) {
            return text
        }

        const [, request, duration, details] = match
        const coloredDetails = details.includes('\n  err:') ? `${colors.red}${details}${colors.reset}` : details

        return `${colors.green}${request}${colors.reset} ${colors.yellow}${duration}${colors.reset}${coloredDetails}`
    }

    const consoleFormat = winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, context }) => {
            const levelColor = levelColors[level] ?? colors.green
            const levelLabel = levelLabels[level] ?? level.toUpperCase()
            const contextLabel = context ? ` ${colors.yellow}[${context}]${colors.reset}` : ''

            return `${colors.yellow}${timestamp}${colors.reset} ${levelColor}[${levelLabel}]${colors.reset}${contextLabel} ${colorizeRequestMessage(message)}`
        })
    )

    const fileFormat = winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.uncolorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
            const contextLabel = context ? ` [${context}]` : ''
            return `${timestamp} [${level.toUpperCase()}]${contextLabel} ${message}`
        })
    )

    return {
        transports: [
            new winston.transports.Console({ format: consoleFormat, level: 'info' }),
            new DailyRotateFile({
                dirname: logDirectory,
                filename: 'application-%DATE%',
                extension: '.log',
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '14d',
                level: 'info',
                format: fileFormat,
            }),
            new DailyRotateFile({
                dirname: logDirectory,
                filename: 'error-%DATE%',
                extension: '.log',
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '14d',
                level: 'error',
                format: fileFormat,
            }),
        ],
    }
}
