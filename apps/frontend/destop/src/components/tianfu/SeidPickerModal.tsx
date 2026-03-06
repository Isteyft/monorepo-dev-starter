import { X } from 'lucide-react'

export type SeidMetaProperty = {
    ID: string
    Type: string
    Desc: string
}

export type SeidMetaItem = {
    id: number
    name: string
    desc: string
    properties: SeidMetaProperty[]
}

type SeidPickerModalProps = {
    open: boolean
    items: SeidMetaItem[]
    selectedIds: number[]
    onClose: () => void
    onPick: (id: number) => void
}

export function SeidPickerModal({ open, items, selectedIds, onClose, onPick }: SeidPickerModalProps) {
    if (!open) return null

    return (
        <div className="modal-mask" onClick={onClose}>
            <div className="create-modal seid-picker-modal" onClick={event => event.stopPropagation()}>
                <div className="create-modal-head">
                    <strong>选择 Seid</strong>
                    <button className="modal-close" onClick={onClose} type="button">
                        <X size={14} />
                    </button>
                </div>
                <div className="seid-picker-list">
                    {items.length === 0 ? <div className="todo-box">未读取到 Seid 元数据</div> : null}
                    {items.map(item => {
                        const exists = selectedIds.includes(item.id)
                        return (
                            <button
                                className="seid-picker-row"
                                disabled={exists}
                                key={item.id}
                                onClick={() => onPick(item.id)}
                                type="button"
                            >
                                <div className="seid-picker-main">
                                    <span className="seid-picker-id">{item.id}</span>
                                    <strong>{item.name || '-'}</strong>
                                </div>
                                <div className="seid-picker-desc">{item.desc || '-'}</div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
