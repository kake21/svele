// projectNext uses winston here. The mini version keeps the same call surface so ported code does
// not need editing, but writes to the console - swap in winston if svele ever needs log files.
const levels = ['error', 'warn', 'info', 'debug'] as const
type Level = typeof levels[number]

const threshold: Level = (process.env.LOG_LEVEL as Level) ?? 'info'

function shouldLog(level: Level): boolean {
    return levels.indexOf(level) <= levels.indexOf(threshold)
}

function log(level: Level, message: unknown, meta?: unknown) {
    if (!shouldLog(level)) return
    if (meta === undefined) {
        console[level === 'debug' ? 'log' : level](`[${level}]`, message)
        return
    }
    console[level === 'debug' ? 'log' : level](`[${level}]`, message, meta)
}

export default {
    error: (message: unknown, meta?: unknown) => log('error', message, meta),
    warn: (message: unknown, meta?: unknown) => log('warn', message, meta),
    info: (message: unknown, meta?: unknown) => log('info', message, meta),
    debug: (message: unknown, meta?: unknown) => log('debug', message, meta),
}
