type FolderContextMenuProps = {
    open: boolean
    x: number
    y: number
    onRename: () => void
    onDelete: () => void
    onClose: () => void
}

export function FolderContextMenu({ open, x, y, onRename, onDelete, onClose }: FolderContextMenuProps) {
    if (!open) return null

    return (
        <>
            <div className="context-mask" onClick={onClose} />
            <div className="folder-menu" style={{ left: `${x}px`, top: `${y}px` }}>
                <button className="folder-menu-item" onClick={onRename} type="button">
                    重命名
                </button>
                <button className="folder-menu-item danger" onClick={onDelete} type="button">
                    删除文件夹
                </button>
            </div>
        </>
    )
}
