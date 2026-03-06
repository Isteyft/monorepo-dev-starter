import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-dialog'
import { FormEvent, useEffect, useMemo, useState } from 'react'

import { CreateProjectModal } from './components/project/CreateProjectModal'
import { FolderContextMenu } from './components/project/FolderContextMenu'
import { RenameFolderModal } from './components/project/RenameFolderModal'
import { AddTalentModal } from './components/tianfu/AddTalentModal'
import { SeidEditorModal } from './components/tianfu/SeidEditorModal'
import { SeidMetaItem, SeidPickerModal } from './components/tianfu/SeidPickerModal'
import {
    createEmptyTalent,
    mergeTalentSeidFiles,
    normalizeTalentMap,
    saveTalentSeidFiles,
    toTalentRows,
} from './components/tianfu/talent-domain'
import { preloadEditorMeta } from './components/tianfu/talent-meta'
import { AppTopBarMenu } from './components/topbar/AppTopBarMenu'
import { EditorPanel } from './components/workspace/EditorPanel'
import { InfoPanel } from './components/workspace/InfoPanel'
import { ModuleSidebar } from './components/workspace/ModuleSidebar'
import { useSeidActiveSync } from './hooks/useSeidActiveSync'
import { ModuleKey, MODULES, ViewMode } from './modules'
import {
    createProject,
    deleteModFolder,
    ensureModStructure,
    getWorkspaceRoot,
    loadProjectEntries,
    readFilePayload,
    renameModFolder,
    saveFilePayload,
} from './services/project-api'
import type { CreateAvatarEntry, TalentTypeOption } from './types'
import { findModRoot, inferModRootPath, joinWinPath, pickLeafName, pickProjectTail } from './utils/path'

const appWindow = getCurrentWindow()

export function App() {
    const [projectPath, setProjectPath] = useState('')
    const [modRootPath, setModRootPath] = useState('')
    const [activeModule, setActiveModule] = useState<ModuleKey | ''>('')
    const [viewMode, setViewMode] = useState<ViewMode>('todo')
    const [activePath, setActivePath] = useState('')
    const [workspaceRoot, setWorkspaceRoot] = useState('')

    const [configForm, setConfigForm] = useState({
        name: '',
        author: '',
        version: '0.0.1',
        description: '',
    })
    const [rawConfigObject, setRawConfigObject] = useState<Record<string, unknown>>({})
    const [preservedSettings, setPreservedSettings] = useState<unknown>([])
    const [configDirty, setConfigDirty] = useState(false)
    const [configCachePath, setConfigCachePath] = useState('')

    const [talentMap, setTalentMap] = useState<Record<string, CreateAvatarEntry>>({})
    const [talentPath, setTalentPath] = useState('')
    const [talentCachePath, setTalentCachePath] = useState('')
    const [talentDirty, setTalentDirty] = useState(false)
    const [selectedTalentKey, setSelectedTalentKey] = useState('')
    const [selectedTalentKeys, setSelectedTalentKeys] = useState<string[]>([])
    const [talentSelectionAnchor, setTalentSelectionAnchor] = useState('')
    const [talentClipboard, setTalentClipboard] = useState<CreateAvatarEntry[]>([])
    const [talentTypeOptions, setTalentTypeOptions] = useState<TalentTypeOption[]>([])
    const [seidMetaMap, setSeidMetaMap] = useState<Record<number, SeidMetaItem>>({})
    const [seidEditorOpen, setSeidEditorOpen] = useState(false)
    const [seidPickerOpen, setSeidPickerOpen] = useState(false)
    const [activeSeidId, setActiveSeidId] = useState<number | null>(null)
    const [addTalentOpen, setAddTalentOpen] = useState(false)

    const [treeExpanded, setTreeExpanded] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [renameOpen, setRenameOpen] = useState(false)
    const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0 })
    const [newProjectName, setNewProjectName] = useState('mod/测试')
    const [newModName, setNewModName] = useState('测试')
    const [status, setStatus] = useState('请先从“文件”菜单打开项目。')

    const moduleConfigPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Config', 'modConfig.json') : ''), [modRootPath])
    const createAvatarPath = useMemo(
        () => (modRootPath ? joinWinPath(modRootPath, 'Data', 'CreateAvatarJsonData.json') : ''),
        [modRootPath]
    )
    const modFolderName = useMemo(() => pickLeafName(modRootPath) || 'mod默认', [modRootPath])
    const avatarRows = useMemo(() => toTalentRows(talentMap), [talentMap])
    const selectedTalent = useMemo(
        () => (selectedTalentKey ? (talentMap[selectedTalentKey] ?? null) : null),
        [talentMap, selectedTalentKey]
    )
    const activeModuleLabel = useMemo(() => MODULES.find(item => item.key === activeModule)?.label ?? '-', [activeModule])
    const seidPickerItems = useMemo(() => Object.values(seidMetaMap).sort((a, b) => a.id - b.id), [seidMetaMap])
    const selectedSeidDisplayRows = useMemo(
        () =>
            (selectedTalent?.seid ?? []).map(id => ({
                id,
                name: seidMetaMap[id]?.name ?? '',
            })),
        [selectedTalent, seidMetaMap]
    )

    function cloneTalentEntry(entry: CreateAvatarEntry): CreateAvatarEntry {
        return {
            ...entry,
            seid: [...entry.seid],
            seidData: JSON.parse(JSON.stringify(entry.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }
    }

    function isEditableElement(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) return false
        const tag = target.tagName.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
        return Boolean(target.closest('[contenteditable="true"]'))
    }

    useSeidActiveSync({ activeSeidId, seidEditorOpen, selectedTalent, setActiveSeidId })

    useEffect(() => {
        const validKeys = new Set(avatarRows.map(row => row.key))
        setSelectedTalentKeys(prev => prev.filter(key => validKeys.has(key)))
        if (selectedTalentKey && !validKeys.has(selectedTalentKey)) {
            const fallback = avatarRows[0]?.key ?? ''
            setSelectedTalentKey(fallback)
            setSelectedTalentKeys(fallback ? [fallback] : [])
            setTalentSelectionAnchor(fallback)
        }
    }, [avatarRows, selectedTalentKey])

    useEffect(() => {
        let active = true
        ;(async () => {
            try {
                const root = await getWorkspaceRoot()
                if (!active) return
                setWorkspaceRoot(root)
                await preloadMeta([root], true)
            } catch {
                // ignore startup preload failures
            }
        })()
        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (activeModule !== 'talent') return
            if (isEditableElement(event.target)) return
            if (event.key === 'Delete') {
                event.preventDefault()
                handleDeleteTalents()
                return
            }
            if (!(event.ctrlKey || event.metaKey)) return
            const key = event.key.toLowerCase()
            if (key === 'c') {
                event.preventDefault()
                handleCopyTalent()
            } else if (key === 'v') {
                event.preventDefault()
                handlePasteTalent()
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [activeModule, avatarRows, selectedTalent, selectedTalentKey, selectedTalentKeys, talentClipboard, talentMap])

    async function preloadMeta(roots: string[], silent = false) {
        const result = await preloadEditorMeta({ roots, readFilePayload, loadProjectEntries })
        const talentLoaded = Boolean(result.talentOptions?.length)
        const seidLoaded = Boolean(result.seidMetaMap && Object.keys(result.seidMetaMap).length > 0)

        if (talentLoaded && result.talentOptions) {
            setTalentTypeOptions(result.talentOptions)
        } else if (!silent) {
            setTalentTypeOptions([])
        }

        if (seidLoaded && result.seidMetaMap) {
            setSeidMetaMap(result.seidMetaMap)
        } else if (!silent) {
            setSeidMetaMap({})
        }

        if (!silent) {
            const talentPart = talentLoaded ? `分类已加载(${result.talentLoadedPath})` : '分类未加载'
            const seidPart = seidLoaded ? `Seid已加载(${result.seidLoadedPath})` : 'Seid未加载'
            const customPart = result.customLoadedPaths.length > 0 ? `，自定义配置${result.customLoadedPaths.length}个` : ''
            setStatus(`元数据预加载：${talentPart}，${seidPart}${customPart}`)
        }
        return { talentLoaded, seidLoaded }
    }
    async function reloadProject(rootPath: string) {
        const loaded = await loadProjectEntries(rootPath)
        const modRoot = findModRoot(loaded)
        const nextModRoot = modRoot?.path ?? inferModRootPath(rootPath)

        setProjectPath(rootPath)
        setModRootPath(nextModRoot)
        setActiveModule('')
        setViewMode('todo')
        setActivePath('')
        setConfigForm({ name: '', author: '', version: '0.0.1', description: '' })
        setRawConfigObject({})
        setPreservedSettings([])
        setConfigDirty(false)
        setConfigCachePath('')
        setTalentMap({})
        setTalentPath('')
        setTalentCachePath('')
        setTalentDirty(false)
        setSelectedTalentKey('')
        setSelectedTalentKeys([])
        setTalentSelectionAnchor('')
        setTalentClipboard([])
        setSeidEditorOpen(false)
        setSeidPickerOpen(false)
        setActiveSeidId(null)
        setTreeExpanded(true)
        await preloadMeta([rootPath, nextModRoot, workspaceRoot], true)
        setStatus(modRoot ? `项目已打开: ${rootPath}` : `项目已打开，未发现 mod 目录，按预设路径加载: ${nextModRoot}`)
    }

    async function handleOpenProject() {
        const selected = await open({ directory: true, multiple: false, title: '选择项目目录' })
        if (!selected || Array.isArray(selected)) return
        try {
            await reloadProject(selected)
        } catch (error) {
            setStatus(`打开失败: ${String(error)}`)
        }
    }

    async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const projectName = newProjectName.trim()
        const modName = (newModName.trim() || pickProjectTail(projectName)).trim()
        if (!projectName || !modName) {
            setStatus('请输入项目名字和 mod 名称。')
            return
        }
        try {
            const createdPath = await createProject(projectName, modName)
            await reloadProject(createdPath)
            setCreateOpen(false)
            setStatus(`项目已新建: ${createdPath}`)
        } catch (error) {
            setStatus(`新建失败: ${String(error)}`)
        }
    }

    async function loadConfigForm() {
        setViewMode('config-form')
        setActivePath(moduleConfigPath)
        if (!modRootPath || !moduleConfigPath) return
        if (configCachePath === moduleConfigPath) return
        try {
            let payload
            try {
                payload = await readFilePayload(moduleConfigPath)
            } catch {
                const name = pickProjectTail(projectPath) || '未命名项目'
                await saveFilePayload(
                    moduleConfigPath,
                    `{\n  "Name": "${name}",\n  "Author": "",\n  "Version": "0.0.1",\n  "Description": "",\n  "Settings": []\n}\n`
                )
                payload = await readFilePayload(moduleConfigPath)
            }
            const parsed = JSON.parse(payload.content) as Record<string, unknown>
            setRawConfigObject(parsed)
            setPreservedSettings(Object.prototype.hasOwnProperty.call(parsed, 'Settings') ? parsed.Settings : [])
            setConfigForm({
                name: String(parsed.Name ?? ''),
                author: String(parsed.Author ?? ''),
                version: String(parsed.Version ?? '0.0.1'),
                description: String(parsed.Description ?? ''),
            })
            setConfigCachePath(moduleConfigPath)
            setConfigDirty(false)
        } catch (error) {
            setStatus(`读取配置失败: ${String(error)}`)
        }
    }

    async function loadTalentTable() {
        setViewMode('table')
        setActivePath(createAvatarPath)
        if (!modRootPath || !createAvatarPath) return
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        if (talentCachePath === createAvatarPath) {
            setStatus(talentDirty ? '已加载天赋数据（缓存，未保存）。' : '已加载天赋数据（缓存）。')
            return
        }
        try {
            let payload
            try {
                payload = await readFilePayload(createAvatarPath)
            } catch {
                await saveFilePayload(createAvatarPath, '{}\n')
                payload = await readFilePayload(createAvatarPath)
            }
            let parsed: unknown = {}
            try {
                parsed = JSON.parse(payload.content)
            } catch {
                parsed = {}
            }
            const normalized = normalizeTalentMap(parsed)
            const baseData = normalized
            const finalData = await mergeTalentSeidFiles({
                source: baseData,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setTalentMap(finalData)
            setTalentPath(createAvatarPath)
            setTalentCachePath(createAvatarPath)
            setTalentDirty(false)
            setSelectedTalentKey(firstKey)
            setSelectedTalentKeys(firstKey ? [firstKey] : [])
            setTalentSelectionAnchor(firstKey)
            setStatus('已加载天赋数据（CreateAvatarJsonData）。')
        } catch (error) {
            setStatus(`读取天赋数据失败: ${String(error)}`)
        }
    }

    async function handleSelectModule(key: ModuleKey) {
        setActiveModule(key)
        if (key === 'project-config') {
            await loadConfigForm()
            return
        }
        if (key === 'talent') {
            await loadTalentTable()
            return
        }
        if (key === 'skill' || key === 'staticskill') {
            setViewMode('table')
            setActivePath('')
            return
        }
        setViewMode('todo')
        setActivePath('')
    }

    function handleSelectTalent(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        if (options.shift && talentSelectionAnchor) {
            const anchorIndex = avatarRows.findIndex(row => row.key === talentSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = avatarRows.slice(start, end + 1).map(row => row.key)
                setSelectedTalentKeys(nextKeys)
                setSelectedTalentKey(key)
                return
            }
        }

        if (options.ctrl) {
            setSelectedTalentKeys(prev => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedTalentKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedTalentKey(key)
            setTalentSelectionAnchor(key)
            return
        }

        setSelectedTalentKeys([key])
        setSelectedTalentKey(key)
        setTalentSelectionAnchor(key)
    }

    function handleDeleteTalents() {
        const targets = selectedTalentKeys.length > 0 ? selectedTalentKeys : selectedTalentKey ? [selectedTalentKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = avatarRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''

        setTalentMap(prev => {
            const draft = { ...prev }
            targets.forEach(key => {
                delete draft[key]
            })
            return draft
        })
        setSelectedTalentKey(nextActive)
        setSelectedTalentKeys(nextActive ? [nextActive] : [])
        setTalentSelectionAnchor(nextActive)
        setTalentDirty(true)
        setStatus(`已删除 ${targets.length} 条天赋数据。`)
    }

    function handleBatchPrefixIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedTalentKeys.length > 0 ? selectedTalentKeys : selectedTalentKey ? [selectedTalentKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的天赋。')
            return
        }

        const orderedTargets = [...targets].sort((a, b) => (talentMap[a]?.id ?? 0) - (talentMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(`${prefix}${index + 1}`)))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }

        const occupied = new Set(Object.keys(talentMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }

        setTalentMap(prev => {
            const draft = { ...prev }
            orderedTargets.forEach(oldKey => delete draft[oldKey])
            orderedTargets.forEach((oldKey, index) => {
                const nextKey = nextKeys[index]
                const row = prev[oldKey]
                if (!row) return
                draft[nextKey] = { ...row, id: Number(nextKey) }
            })
            return draft
        })

        const nextActive = nextKeys[0] ?? ''
        setSelectedTalentKey(nextActive)
        setSelectedTalentKeys(nextKeys)
        setTalentSelectionAnchor(nextActive)
        setTalentDirty(true)
        setStatus(`已批量修改 ${targets.length} 条ID，开头为 ${prefix}。`)
    }

    function handleAddTalent(id: number) {
        const key = String(id)
        setAddTalentOpen(false)
        if (talentMap[key]) {
            setSelectedTalentKey(key)
            setSelectedTalentKeys([key])
            setTalentSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setTalentMap(prev => ({ ...prev, [key]: createEmptyTalent(id) }))
        setSelectedTalentKey(key)
        setSelectedTalentKeys([key])
        setTalentSelectionAnchor(key)
        setTalentDirty(true)
    }

    function handleCopyTalent() {
        const targets = selectedTalentKeys.length > 0 ? selectedTalentKeys : selectedTalentKey ? [selectedTalentKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => talentMap[key])
            .filter((item): item is CreateAvatarEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneTalentEntry(item))
        if (copied.length === 0) return
        setTalentClipboard(copied)
        setStatus(copied.length === 1 ? `已复制天赋 ${copied[0].id}` : `已复制 ${copied.length} 条天赋数据`)
    }

    function handlePasteTalent() {
        if (talentClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(talentMap))
        const inserts: Array<{ key: string; row: CreateAvatarEntry }> = []
        const conflicts: CreateAvatarEntry[] = []

        talentClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            const row = { ...cloneTalentEntry(item), id }
            inserts.push({ key, row })
            existingKeys.add(key)
        })

        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条ID重复，请输入新的ID前缀（例如 50）`)
            if (prefixText === null) return
            const prefix = prefixText.trim()
            if (!/^\d+$/.test(prefix)) {
                setStatus('粘贴失败：请输入数字前缀。')
                return
            }
            for (let index = 0; index < conflicts.length; index += 1) {
                const nextKey = String(Number(`${prefix}${index + 1}`))
                if (existingKeys.has(nextKey)) {
                    setStatus(`粘贴失败：批量重命名ID冲突（${nextKey}）。`)
                    return
                }
                const row = { ...cloneTalentEntry(conflicts[index]), id: Number(nextKey) }
                inserts.push({ key: nextKey, row })
                existingKeys.add(nextKey)
            }
        }

        if (inserts.length === 0) return
        setTalentMap(prev => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedTalentKey(nextKeys[0] ?? '')
        setSelectedTalentKeys(nextKeys)
        setTalentSelectionAnchor(nextKeys[0] ?? '')
        setTalentDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条天赋数据。`)
    }

    function handleChangeTalentForm(patch: Partial<CreateAvatarEntry>) {
        if (!selectedTalentKey || !talentMap[selectedTalentKey]) return
        const current = talentMap[selectedTalentKey]
        const option =
            typeof patch.fenLeiGuanLian === 'number' ? talentTypeOptions.find(item => item.id === patch.fenLeiGuanLian) : undefined
        const normalizedPatch = typeof patch.fenLeiGuanLian === 'number' ? { ...patch, fenLei: option?.name ?? '' } : patch
        const next = { ...current, ...normalizedPatch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)

        setTalentMap(prev => {
            if (nextKey !== selectedTalentKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedTalentKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedTalentKey(nextKey)
        setSelectedTalentKeys(prev =>
            prev.map(key => (key === selectedTalentKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setTalentSelectionAnchor(nextKey)
        setTalentDirty(true)
    }

    function updateSelectedTalent(updater: (current: CreateAvatarEntry) => CreateAvatarEntry) {
        if (!selectedTalentKey || !talentMap[selectedTalentKey]) return
        setTalentMap(prev => {
            const current = prev[selectedTalentKey]
            if (!current) return prev
            return { ...prev, [selectedTalentKey]: updater(current) }
        })
        setTalentDirty(true)
    }

    async function ensureSeidMetaLoaded() {
        if (Object.keys(seidMetaMap).length > 0) return true
        const result = await preloadMeta([workspaceRoot, projectPath, modRootPath], true)
        return result.seidLoaded
    }

    async function handleOpenSeidEditor() {
        if (!selectedTalent) return
        const ok = await ensureSeidMetaLoaded()
        if (!ok) {
            setStatus('未加载到 Seid 元数据，请确认 editorMeta/CreateAvatarSeidMeta.json 路径和 JSON 格式。')
        }
        const first = selectedTalent.seid[0] ?? null
        setActiveSeidId(first)
        setSeidEditorOpen(true)
    }

    async function handleOpenSeidPicker() {
        const ok = await ensureSeidMetaLoaded()
        setSeidPickerOpen(true)
        if (!ok) {
            setStatus('未加载到 Seid 元数据，无法新增 Seid。')
        }
    }

    function handleAddSeidFromPicker(id: number) {
        updateSelectedTalent(current => {
            if (current.seid.includes(id)) return current
            const nextSeid = [...current.seid, id]
            const nextData = { ...current.seidData }
            if (!nextData[String(id)]) nextData[String(id)] = {}
            return { ...current, seid: nextSeid, seidData: nextData }
        })
        setActiveSeidId(id)
        setSeidPickerOpen(false)
    }

    function handleDeleteSelectedSeid() {
        if (!activeSeidId) return
        updateSelectedTalent(current => {
            const nextSeid = current.seid.filter(id => id !== activeSeidId)
            const nextData = { ...current.seidData }
            delete nextData[String(activeSeidId)]
            return { ...current, seid: nextSeid, seidData: nextData }
        })
        const currentList = selectedTalent?.seid ?? []
        const nextId = currentList.find(id => id !== activeSeidId) ?? null
        setActiveSeidId(nextId)
    }

    function handleMoveSelectedSeid(direction: 'up' | 'down') {
        if (!activeSeidId) return
        updateSelectedTalent(current => {
            const index = current.seid.findIndex(id => id === activeSeidId)
            if (index < 0) return current
            const targetIndex = direction === 'up' ? index - 1 : index + 1
            if (targetIndex < 0 || targetIndex >= current.seid.length) return current
            const nextSeid = [...current.seid]
            const temp = nextSeid[index]
            nextSeid[index] = nextSeid[targetIndex]
            nextSeid[targetIndex] = temp
            return { ...current, seid: nextSeid }
        })
    }

    function handleChangeSeidProperty(seidId: number, key: string, value: string | number | number[]) {
        updateSelectedTalent(current => {
            const nextData = { ...current.seidData }
            const row = { ...(nextData[String(seidId)] ?? {}) }
            row[key] = value
            nextData[String(seidId)] = row
            return { ...current, seidData: nextData }
        })
    }

    async function handleRenameModRoot(newName: string) {
        if (!newName || !modRootPath) return
        try {
            const nextPath = await renameModFolder(modRootPath, newName)
            setModRootPath(nextPath)
            setRenameOpen(false)
            setStatus(`mod 目录已重命名: ${pickLeafName(nextPath)}`)
        } catch (error) {
            setStatus(`重命名失败: ${String(error)}`)
        }
    }

    async function handleDeleteModRoot() {
        setContextMenu({ open: false, x: 0, y: 0 })
        if (!modRootPath) return
        if (!window.confirm(`确认删除文件夹 ${pickLeafName(modRootPath)} 吗？`)) return
        try {
            await deleteModFolder(modRootPath)
            const inferred = inferModRootPath(projectPath)
            setModRootPath(inferred)
            setActiveModule('')
            setViewMode('todo')
            setSelectedTalentKey('')
            setSelectedTalentKeys([])
            setTalentSelectionAnchor('')
            setTalentMap({})
            setTalentCachePath('')
            setTalentDirty(false)
            setStatus(`已删除文件夹，后续按预设路径加载: ${inferred}`)
        } catch (error) {
            setStatus(`删除失败: ${String(error)}`)
        }
    }

    async function handleSaveProject() {
        if (!projectPath || !modRootPath || !moduleConfigPath) {
            setStatus('请先打开项目后再保存。')
            return
        }
        try {
            await ensureModStructure(modRootPath)
            const configPayload = {
                ...rawConfigObject,
                Name: configForm.name,
                Author: configForm.author,
                Version: configForm.version,
                Description: configForm.description,
                Settings: preservedSettings,
            }
            await saveFilePayload(moduleConfigPath, `${JSON.stringify(configPayload, null, 2)}\n`)

            const talentTarget = talentPath || createAvatarPath
            const normalizedTalentPayload = Object.fromEntries(
                Object.values(talentMap).map(row => [String(row.id), { ...row, id: row.id }])
            )
            const payload = normalizedTalentPayload
            await saveFilePayload(talentTarget, `${JSON.stringify(payload, null, 2)}\n`)

            const seidFileCount = await saveTalentSeidFiles({
                talentMap,
                modRootPath,
                joinWinPath,
                saveFilePayload,
            })

            setConfigDirty(false)
            setTalentDirty(false)
            setTalentCachePath(talentTarget)
            setStatus(`项目已保存：${moduleConfigPath}，Seid 文件 ${seidFileCount} 个（CrateAvatarSeidJsonData）`)
        } catch (error) {
            setStatus(`保存项目失败: ${String(error)}`)
        }
    }

    async function handleToggleMaximize() {
        const maximized = await appWindow.isMaximized()
        if (maximized) {
            await appWindow.unmaximize()
            return
        }
        await appWindow.maximize()
    }

    return (
        <div className="app-shell" data-active-path={activePath} data-status={status}>
            <AppTopBarMenu
                configDirty={configDirty || talentDirty}
                onClose={() => appWindow.close()}
                onCreateProject={() => setCreateOpen(true)}
                onMinimize={() => appWindow.minimize()}
                onOpenProject={handleOpenProject}
                onSaveProject={handleSaveProject}
                onStartDragging={() => appWindow.startDragging()}
                onToggleMaximize={handleToggleMaximize}
            />

            <CreateProjectModal
                modName={newModName}
                onChangeModName={setNewModName}
                onChangeProjectName={setNewProjectName}
                onClose={() => setCreateOpen(false)}
                onSubmit={handleCreateProject}
                open={createOpen}
                projectName={newProjectName}
            />
            <RenameFolderModal
                initialName={modFolderName}
                onClose={() => setRenameOpen(false)}
                onSubmit={handleRenameModRoot}
                open={renameOpen}
            />
            <AddTalentModal open={addTalentOpen} onClose={() => setAddTalentOpen(false)} onSubmit={handleAddTalent} />
            <SeidEditorModal
                activeSeidId={activeSeidId}
                metaMap={seidMetaMap}
                onChangeProperty={handleChangeSeidProperty}
                onClose={() => setSeidEditorOpen(false)}
                onDeleteSelected={handleDeleteSelectedSeid}
                onMoveDown={() => handleMoveSelectedSeid('down')}
                onMoveUp={() => handleMoveSelectedSeid('up')}
                onRequestAdd={handleOpenSeidPicker}
                onSelectSeid={setActiveSeidId}
                open={seidEditorOpen}
                seidData={selectedTalent?.seidData ?? {}}
                seidIds={selectedTalent?.seid ?? []}
            />
            <SeidPickerModal
                items={seidPickerItems}
                onClose={() => setSeidPickerOpen(false)}
                onPick={handleAddSeidFromPicker}
                open={seidPickerOpen}
                selectedIds={selectedTalent?.seid ?? []}
            />
            <FolderContextMenu
                onClose={() => setContextMenu({ open: false, x: 0, y: 0 })}
                onDelete={handleDeleteModRoot}
                onRename={() => {
                    setContextMenu({ open: false, x: 0, y: 0 })
                    setRenameOpen(true)
                }}
                open={contextMenu.open}
                x={contextMenu.x}
                y={contextMenu.y}
            />

            <main className={`workspace ${activeModule === 'project-config' ? 'workspace-config' : ''}`}>
                <ModuleSidebar
                    activeModule={activeModule}
                    expanded={treeExpanded}
                    onRootContextMenu={(x, y) => setContextMenu({ open: true, x, y })}
                    onSelect={handleSelectModule}
                    onToggleExpanded={() => setTreeExpanded(prev => !prev)}
                    rootName={modFolderName}
                />

                {activeModule && activeModule !== 'project-config' ? (
                    <InfoPanel
                        activeModule={activeModule}
                        onAddTalent={() => setAddTalentOpen(true)}
                        onBatchPrefixIds={handleBatchPrefixIds}
                        onDeleteTalents={handleDeleteTalents}
                        onCopyTalent={handleCopyTalent}
                        onPasteTalent={handlePasteTalent}
                        onSelectTalent={handleSelectTalent}
                        rows={avatarRows}
                        selectedTalentKey={selectedTalentKey}
                        selectedTalentKeys={selectedTalentKeys}
                    />
                ) : null}

                {activeModule ? (
                    <EditorPanel
                        activeModule={activeModule}
                        activeModuleLabel={activeModuleLabel}
                        configForm={configForm}
                        onChangeConfigForm={patch => {
                            setConfigForm(prev => ({ ...prev, ...patch }))
                            setConfigDirty(true)
                        }}
                        onChangeTalentForm={handleChangeTalentForm}
                        onOpenSeidEditor={handleOpenSeidEditor}
                        seidDisplayRows={selectedSeidDisplayRows}
                        talentForm={selectedTalent}
                        talentTypeOptions={talentTypeOptions}
                        viewMode={viewMode}
                    />
                ) : null}
            </main>
            <div className="status-bar">{status}</div>
        </div>
    )
}
