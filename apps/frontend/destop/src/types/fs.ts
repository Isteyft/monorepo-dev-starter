export type FsEntry = {
    name: string
    path: string
    is_dir: boolean
    depth: number
}

export type FilePayload = {
    path: string
    content: string
    size: number
}
