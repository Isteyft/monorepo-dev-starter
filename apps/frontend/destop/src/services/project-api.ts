import { invoke } from '@tauri-apps/api/core'

import type { FilePayload, FsEntry } from '../types'

export async function createProject(projectName: string, modName: string) {
    return invoke<string>('create_project', { projectName, modName })
}

export async function getWorkspaceRoot() {
    return invoke<string>('get_workspace_root')
}

export async function loadProjectEntries(rootPath: string) {
    return invoke<FsEntry[]>('load_project_entries', { rootPath })
}

export async function readFilePayload(filePath: string) {
    return invoke<FilePayload>('read_file_payload', { filePath })
}

export async function saveFilePayload(filePath: string, content: string) {
    return invoke('save_file_payload', { filePath, content })
}

export async function ensureModStructure(modRootPath: string) {
    return invoke('ensure_mod_structure', { modRootPath })
}

export async function renameModFolder(modRootPath: string, newModName: string) {
    return invoke<string>('rename_mod_folder', { modRootPath, newModName })
}

export async function deleteModFolder(modRootPath: string) {
    return invoke('delete_mod_folder', { modRootPath })
}
