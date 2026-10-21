/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss 格式
 */
export function formatDateTime(date: Date | string | null | undefined): string | null {
    if (!date) return null

    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return null

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function formatTimestamp(date = new Date()): string {
    const pad = (value: number) => String(value).padStart(2, '0')

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
        date.getMinutes()
    )}:${pad(date.getSeconds())}`
}
