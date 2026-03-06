import type { FsEntry } from '../../types'
import type { CreateAvatarEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

export function normalizeTalentMap(raw: unknown): Record<string, CreateAvatarEntry> {
    const next: Record<string, CreateAvatarEntry> = {}
    if (!raw || typeof raw !== 'object') return next

    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (!value || typeof value !== 'object') continue
        const row = value as Record<string, unknown>
        const id = Number(row.id ?? Number(key))
        if (!Number.isFinite(id)) continue
        const seidNormalized = normalizeSeidPayload(row.seid, row.seidData)
        next[String(id)] = {
            id,
            Title: String(row.Title ?? ''),
            fenZu: Number(row.fenZu ?? 0),
            feiYong: Number(row.feiYong ?? 0),
            fenLei: String(row.fenLei ?? ''),
            fenLeiGuanLian: Number(row.fenLeiGuanLian ?? 0),
            seid: seidNormalized.ids,
            seidData: seidNormalized.data,
            jiesuo: Number(row.jiesuo ?? 0),
            UnlockKey: String(row.UnlockKey ?? ''),
            UnlockDesc: String(row.UnlockDesc ?? ''),
            Desc: String(row.Desc ?? ''),
            Info: String(row.Info ?? ''),
        }
    }
    return next
}

export function toTalentRows(map: Record<string, CreateAvatarEntry>): CreateAvatarRow[] {
    return Object.entries(map)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: value.Title,
            fenLei: value.fenLei,
            desc: value.Desc,
        }))
        .sort((a, b) => a.id - b.id)
}

export function createEmptyTalent(id: number): CreateAvatarEntry {
    return {
        id,
        Title: '',
        fenZu: 0,
        feiYong: 0,
        fenLei: '',
        fenLeiGuanLian: 0,
        seid: [],
        seidData: {},
        jiesuo: 0,
        UnlockKey: '',
        UnlockDesc: '',
        Desc: '',
        Info: '',
    }
}

export function cloneTalentMap(source: Record<string, CreateAvatarEntry>) {
    const next: Record<string, CreateAvatarEntry> = {}
    for (const [key, row] of Object.entries(source)) {
        next[key] = {
            ...row,
            seid: [...row.seid],
            seidData: JSON.parse(JSON.stringify(row.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }
    }
    return next
}

export async function mergeTalentSeidFiles(params: {
    source: Record<string, CreateAvatarEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    readFilePayload: (filePath: string) => Promise<{ content: string }>
}): Promise<Record<string, CreateAvatarEntry>> {
    const { source, modRootPath, joinWinPath, loadProjectEntries, readFilePayload } = params
    if (!modRootPath) return source
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'CrateAvatarSeidJsonData')
    let entries: FsEntry[] = []
    try {
        entries = await loadProjectEntries(seidDirPath)
    } catch {
        return source
    }

    const fileEntries = entries.filter(entry => !entry.is_dir && /\.json$/i.test(entry.name))
    if (fileEntries.length === 0) return source

    const next = cloneTalentMap(source)
    for (const fileEntry of fileEntries) {
        const seidId = Number(fileEntry.name.replace(/\.json$/i, ''))
        if (!Number.isFinite(seidId) || seidId <= 0) continue
        try {
            const payload = await readFilePayload(fileEntry.path)
            const parsed = JSON.parse(payload.content) as Record<string, Record<string, unknown>>
            for (const [talentKey, rawValue] of Object.entries(parsed)) {
                if (!rawValue || typeof rawValue !== 'object') continue
                const row = rawValue as Record<string, unknown>
                const talentId = Number(row.id ?? Number(talentKey))
                if (!Number.isFinite(talentId) || talentId <= 0) continue
                const target = next[String(talentId)]
                if (!target) continue

                if (!target.seid.includes(seidId)) {
                    target.seid.push(seidId)
                }
                const seidDataKey = String(seidId)
                const dataRow = { ...(target.seidData[seidDataKey] ?? {}) }
                for (const [propKey, propValue] of Object.entries(row)) {
                    if (propKey === 'id') continue
                    if (Array.isArray(propValue)) {
                        const numbers = propValue.map(item => Number(item))
                        dataRow[propKey] = numbers.every(item => Number.isFinite(item)) ? numbers : String(propValue.join(','))
                    } else if (typeof propValue === 'number') {
                        dataRow[propKey] = propValue
                    } else {
                        dataRow[propKey] = String(propValue ?? '')
                    }
                }
                target.seidData[seidDataKey] = dataRow
            }
        } catch {
            // skip broken Seid file
        }
    }

    return next
}

export async function saveTalentSeidFiles(params: {
    talentMap: Record<string, CreateAvatarEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { talentMap, modRootPath, joinWinPath, saveFilePayload } = params
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'CrateAvatarSeidJsonData')
    const seidFilePayload: Record<string, Record<string, Record<string, unknown>>> = {}
    for (const talentRow of Object.values(talentMap)) {
        for (const seidId of talentRow.seid) {
            if (!Number.isFinite(seidId) || seidId <= 0) continue
            const seidKey = String(seidId)
            const fileRows = (seidFilePayload[seidKey] ??= {})
            const rowPayload: Record<string, unknown> = { id: talentRow.id }
            const cachedProps = talentRow.seidData[seidKey] ?? {}
            for (const [propKey, propValue] of Object.entries(cachedProps)) {
                rowPayload[propKey] = propValue
            }
            fileRows[String(talentRow.id)] = rowPayload
        }
    }
    for (const [seidKey, fileRows] of Object.entries(seidFilePayload)) {
        const filePath = joinWinPath(seidDirPath, `${seidKey}.json`)
        await saveFilePayload(filePath, `${JSON.stringify(fileRows, null, 2)}\n`)
    }
    return Object.keys(seidFilePayload).length
}

function normalizeSeidPayload(
    rawSeid: unknown,
    rawSeidData: unknown
): { ids: number[]; data: Record<string, Record<string, string | number | number[]>> } {
    const ids: number[] = []
    const data: Record<string, Record<string, string | number | number[]>> = {}
    const idSet = new Set<number>()
    const addId = (id: number) => {
        if (!Number.isFinite(id) || id <= 0 || idSet.has(id)) return
        idSet.add(id)
        ids.push(id)
    }

    if (Array.isArray(rawSeid)) {
        for (const item of rawSeid) {
            if (typeof item === 'number' || typeof item === 'string') {
                addId(Number(item))
                continue
            }
            if (!item || typeof item !== 'object') continue
            const obj = item as Record<string, unknown>
            const id = Number(obj.id ?? obj.ID ?? obj.seidId ?? obj.SeidID)
            if (!Number.isFinite(id) || id <= 0) continue
            addId(id)
            const key = String(id)
            const current = { ...(data[key] ?? {}) }
            for (const [k, v] of Object.entries(obj)) {
                if (k === 'id' || k === 'ID' || k === 'seidId' || k === 'SeidID') continue
                if (Array.isArray(v)) {
                    const nums = v.map(n => Number(n))
                    current[k] = nums.every(n => Number.isFinite(n)) ? nums : String(v.join(','))
                } else if (typeof v === 'number') {
                    current[k] = v
                } else {
                    current[k] = String(v ?? '')
                }
            }
            data[key] = current
        }
    }

    if (rawSeidData && typeof rawSeidData === 'object') {
        for (const [rawId, rawValue] of Object.entries(rawSeidData as Record<string, unknown>)) {
            const id = Number(rawId)
            if (!Number.isFinite(id) || id <= 0 || !rawValue || typeof rawValue !== 'object') continue
            addId(id)
            const key = String(id)
            const current = { ...(data[key] ?? {}) }
            for (const [k, v] of Object.entries(rawValue as Record<string, unknown>)) {
                if (Array.isArray(v)) {
                    const nums = v.map(n => Number(n))
                    current[k] = nums.every(n => Number.isFinite(n)) ? nums : String(v.join(','))
                } else if (typeof v === 'number') {
                    current[k] = v
                } else {
                    current[k] = String(v ?? '')
                }
            }
            data[key] = current
        }
    }

    return { ids, data }
}
