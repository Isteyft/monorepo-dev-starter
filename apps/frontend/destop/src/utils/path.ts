import type { FsEntry } from '../types'

export function joinWinPath(base: string, ...parts: string[]) {
    return [base, ...parts].join('\\')
}

export function pickProjectTail(path: string) {
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean)
    return parts[parts.length - 1] ?? ''
}

export function pickLeafName(path: string) {
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean)
    return parts[parts.length - 1] ?? ''
}

export function inferModRootPath(rootPath: string) {
    const core = pickProjectTail(rootPath).replace(/^mod/i, '') || '默认'
    return joinWinPath(rootPath, 'plugins', 'Next', `mod${core}`)
}

export function findModRoot(entries: FsEntry[]) {
    return entries.find(entry => entry.is_dir && /[\\/]plugins[\\/]Next[\\/]mod[^\\/]+$/i.test(entry.path.replace(/\\/g, '/')))
}
