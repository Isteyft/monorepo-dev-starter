import { SeidMetaItem } from './SeidPickerModal'

function dirname(path: string) {
    const normalized = path.replace(/[\\/]+$/, '')
    const idx = Math.max(normalized.lastIndexOf('\\'), normalized.lastIndexOf('/'))
    return idx >= 0 ? normalized.slice(0, idx) : normalized
}

function joinWinPath(base: string, ...parts: string[]) {
    return [base, ...parts].join('\\')
}

export function collectMetaFileCandidates(rootPath: string, fileName: string) {
    const normalized = rootPath
        .replace(/\//g, '\\')
        .replace(/\\+/g, '\\')
        .replace(/[\\]+$/, '')
    const results: string[] = []
    const seen = new Set<string>()
    const addCandidate = (path: string) => {
        const winPath = path.replace(/\//g, '\\').replace(/\\+/g, '\\')
        const unixPath = winPath.replace(/\\/g, '/')
        const variants = [winPath, unixPath]
        for (const variant of variants) {
            const key = variant.toLowerCase()
            if (seen.has(key)) continue
            seen.add(key)
            results.push(variant)
        }
    }

    let current = normalized
    for (let i = 0; i < 7; i += 1) {
        addCandidate(joinWinPath(current, 'editorMeta', fileName))
        const parent = dirname(current)
        if (!parent || parent === current) break
        current = parent
    }

    const marker = normalized.toLowerCase().lastIndexOf('\\mod\\')
    if (marker > 0) {
        const repoRoot = normalized.slice(0, marker)
        addCandidate(joinWinPath(repoRoot, 'editorMeta', fileName))
    }

    return results
}

export async function readTalentTypeOptions(params: {
    rootPath: string
    readFilePayload: (filePath: string) => Promise<{ content: string }>
}) {
    const { rootPath, readFilePayload } = params
    const candidates = collectMetaFileCandidates(rootPath, 'CreateAvatarTalentType.json')

    for (const filePath of candidates) {
        try {
            const payload = await readFilePayload(filePath)
            const parsed = JSON.parse(payload.content) as Array<Record<string, unknown>>
            const options = parsed
                .map(item => ({
                    id: Number(item.TypeID),
                    name: String(item.TypeName ?? ''),
                }))
                .filter(item => Number.isFinite(item.id) && item.id > 0)
            if (options.length > 0) {
                return { options, loadedPath: filePath, candidates }
            }
        } catch {
            // try next path
        }
    }

    return { options: [] as { id: number; name: string }[], loadedPath: '', candidates }
}

export async function readSeidMeta(params: { rootPath: string; readFilePayload: (filePath: string) => Promise<{ content: string }> }) {
    const { rootPath, readFilePayload } = params
    const candidates = collectMetaFileCandidates(rootPath, 'CreateAvatarSeidMeta.json')

    for (const filePath of candidates) {
        try {
            const payload = await readFilePayload(filePath)
            const parsed = JSON.parse(payload.content) as Record<string, Record<string, unknown>>
            const mapped: Record<number, SeidMetaItem> = {}
            for (const value of Object.values(parsed)) {
                const id = Number(value.ID)
                if (!Number.isFinite(id) || id <= 0) continue
                const propertiesRaw = Array.isArray(value.Properties) ? value.Properties : []
                mapped[id] = {
                    id,
                    name: String(value.Name ?? ''),
                    desc: String(value.Desc ?? ''),
                    properties: propertiesRaw.map(property => ({
                        ID: String((property as Record<string, unknown>).ID ?? ''),
                        Type: String((property as Record<string, unknown>).Type ?? ''),
                        Desc: String((property as Record<string, unknown>).Desc ?? ''),
                    })),
                }
            }
            return { metaMap: mapped, loadedPath: filePath, candidates }
        } catch {
            // try next path
        }
    }

    return { metaMap: {} as Record<number, SeidMetaItem>, loadedPath: '', candidates }
}

export async function preloadEditorMeta(params: {
    roots: string[]
    readFilePayload: (filePath: string) => Promise<{ content: string }>
    loadProjectEntries: (rootPath: string) => Promise<Array<{ path: string; name: string; is_dir: boolean }>>
}) {
    const { roots, readFilePayload, loadProjectEntries } = params
    const orderedRoots = Array.from(new Set(roots.filter(Boolean)))
    let talentOptions: { id: number; name: string }[] | null = null
    let talentLoadedPath = ''
    let seidMetaMap: Record<number, SeidMetaItem> | null = null
    let seidLoadedPath = ''
    const customLoadedPaths: string[] = []

    for (const root of orderedRoots) {
        if (!talentOptions) {
            const result = await readTalentTypeOptions({ rootPath: root, readFilePayload })
            if (result.options.length > 0) {
                talentOptions = result.options
                talentLoadedPath = result.loadedPath
            }
        }

        if (!seidMetaMap) {
            const result = await readSeidMeta({ rootPath: root, readFilePayload })
            if (Object.keys(result.metaMap).length > 0) {
                seidMetaMap = result.metaMap
                seidLoadedPath = result.loadedPath
            }
        }

        if (talentOptions && seidMetaMap) break
    }

    const customFiles = await collectCustomMetaFiles(orderedRoots, loadProjectEntries)
    for (const filePath of customFiles) {
        try {
            const payload = await readFilePayload(filePath)
            const parsed = JSON.parse(payload.content) as unknown
            const parsedTypes = parseTalentTypeFromUnknown(parsed)
            if (parsedTypes.length > 0) {
                const merged = mergeTalentTypeOptions(talentOptions ?? [], parsedTypes)
                talentOptions = merged
                if (!talentLoadedPath) talentLoadedPath = filePath
                customLoadedPaths.push(filePath)
            }
            const parsedSeid = parseSeidMetaFromUnknown(parsed)
            if (Object.keys(parsedSeid).length > 0) {
                seidMetaMap = { ...(seidMetaMap ?? {}), ...parsedSeid }
                if (!seidLoadedPath) seidLoadedPath = filePath
                if (!customLoadedPaths.includes(filePath)) customLoadedPaths.push(filePath)
            }
        } catch {
            // ignore invalid custom meta file
        }
    }

    return {
        triedRoots: orderedRoots,
        talentOptions,
        talentLoadedPath,
        seidMetaMap,
        seidLoadedPath,
        customLoadedPaths,
    }
}

async function collectCustomMetaFiles(
    roots: string[],
    loadProjectEntries: (rootPath: string) => Promise<Array<{ path: string; name: string; is_dir: boolean }>>
) {
    const results: string[] = []
    const seen = new Set<string>()
    const dirs = roots.filter(Boolean).map(root =>
        joinWinPath(
            root
                .replace(/\//g, '\\')
                .replace(/\\+/g, '\\')
                .replace(/[\\]+$/, ''),
            'config'
        )
    )
    for (const dir of dirs) {
        try {
            const entries = await loadProjectEntries(dir)
            for (const entry of entries) {
                if (entry.is_dir || !/\.json$/i.test(entry.name)) continue
                const key = entry.path.toLowerCase()
                if (seen.has(key)) continue
                seen.add(key)
                results.push(entry.path)
            }
        } catch {
            // directory does not exist or cannot be listed
        }
    }
    return results
}

function parseTalentTypeFromUnknown(raw: unknown) {
    if (Array.isArray(raw)) {
        return raw
            .map(item => ({
                id: Number((item as Record<string, unknown>).TypeID),
                name: String((item as Record<string, unknown>).TypeName ?? ''),
            }))
            .filter(item => Number.isFinite(item.id) && item.id > 0)
    }
    if (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).CreateAvatarTalentType)) {
        return parseTalentTypeFromUnknown((raw as Record<string, unknown>).CreateAvatarTalentType)
    }
    return [] as { id: number; name: string }[]
}

function parseSeidMetaFromUnknown(raw: unknown) {
    const source =
        raw && typeof raw === 'object' && !Array.isArray(raw)
            ? (((raw as Record<string, unknown>).CreateAvatarSeidMeta as unknown) ?? raw)
            : null
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {} as Record<number, SeidMetaItem>

    const mapped: Record<number, SeidMetaItem> = {}
    for (const value of Object.values(source as Record<string, unknown>)) {
        if (!value || typeof value !== 'object') continue
        const row = value as Record<string, unknown>
        const id = Number(row.ID ?? row.id)
        if (!Number.isFinite(id) || id <= 0) continue
        const propertiesRaw = Array.isArray(row.Properties) ? row.Properties : []
        mapped[id] = {
            id,
            name: String(row.Name ?? row.name ?? ''),
            desc: String(row.Desc ?? row.desc ?? ''),
            properties: propertiesRaw.map(property => ({
                ID: String((property as Record<string, unknown>).ID ?? ''),
                Type: String((property as Record<string, unknown>).Type ?? ''),
                Desc: String((property as Record<string, unknown>).Desc ?? ''),
            })),
        }
    }
    return mapped
}

function mergeTalentTypeOptions(base: { id: number; name: string }[], incoming: { id: number; name: string }[]) {
    const map = new Map<number, { id: number; name: string }>()
    base.forEach(item => map.set(item.id, item))
    incoming.forEach(item => map.set(item.id, item))
    return Array.from(map.values()).sort((a, b) => a.id - b.id)
}
