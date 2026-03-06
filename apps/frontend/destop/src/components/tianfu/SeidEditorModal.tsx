import { ChevronDown, ChevronUp, Minus, Plus, X } from 'lucide-react'

import { SeidMetaItem } from './SeidPickerModal'

type SeidEditorModalProps = {
    open: boolean
    seidIds: number[]
    activeSeidId: number | null
    seidData: Record<string, Record<string, string | number | number[]>>
    metaMap: Record<number, SeidMetaItem>
    onClose: () => void
    onSelectSeid: (id: number) => void
    onRequestAdd: () => void
    onDeleteSelected: () => void
    onMoveUp: () => void
    onMoveDown: () => void
    onChangeProperty: (seidId: number, key: string, value: string | number | number[]) => void
}

function toArrayText(value: string | number | number[] | undefined) {
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'number') return String(value)
    return value ?? ''
}

export function SeidEditorModal({
    open,
    seidIds,
    activeSeidId,
    seidData,
    metaMap,
    onClose,
    onSelectSeid,
    onRequestAdd,
    onDeleteSelected,
    onMoveUp,
    onMoveDown,
    onChangeProperty,
}: SeidEditorModalProps) {
    if (!open) return null

    const hasActive = activeSeidId !== null
    const meta = hasActive ? metaMap[activeSeidId] : undefined
    const values = hasActive ? (seidData[String(activeSeidId)] ?? {}) : {}

    return (
        <div className="modal-mask" onClick={onClose}>
            <div className="create-modal seid-editor-modal" onClick={event => event.stopPropagation()}>
                <div className="create-modal-head">
                    <strong>Seid 编辑</strong>
                    <button className="modal-close" onClick={onClose} type="button">
                        <X size={14} />
                    </button>
                </div>

                <div className="seid-editor-layout">
                    <section className="seid-left">
                        <div className="seid-left-tools">
                            <button className="icon-btn" onClick={onRequestAdd} title="新增 Seid" type="button">
                                <Plus size={14} />
                            </button>
                            <button className="icon-btn" onClick={onDeleteSelected} title="删除当前 Seid" type="button">
                                <Minus size={14} />
                            </button>
                            <button className="icon-btn" onClick={onMoveUp} title="上移" type="button">
                                <ChevronUp size={14} />
                            </button>
                            <button className="icon-btn" onClick={onMoveDown} title="下移" type="button">
                                <ChevronDown size={14} />
                            </button>
                        </div>
                        <div className="seid-list">
                            {seidIds.map(id => {
                                const item = metaMap[id]
                                const text = `${id} ${item?.name ?? ''}`
                                return (
                                    <button
                                        className={`seid-list-item ${activeSeidId === id ? 'active' : ''}`}
                                        key={id}
                                        onClick={() => onSelectSeid(id)}
                                        type="button"
                                    >
                                        {text}
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    <section className="seid-right">
                        {meta && hasActive ? (
                            <div className="config-form-wrap">
                                <div className="seid-meta-title">{meta.name}</div>
                                <div className="muted">{meta.desc || '-'}</div>
                                {meta.properties.length === 0 ? (
                                    <div className="todo-box">该 Seid 没有可编辑属性</div>
                                ) : (
                                    meta.properties.map(property => {
                                        const value = values[property.ID]
                                        const type = (property.Type || '').toLowerCase()

                                        if (type === 'intarray') {
                                            return (
                                                <label className="config-field" key={property.ID}>
                                                    <span>
                                                        {property.ID} ({property.Type}) - {property.Desc || '-'}
                                                    </span>
                                                    <input
                                                        onChange={event => {
                                                            const list = event.target.value
                                                                .split(',')
                                                                .map(item => Number(item.trim()))
                                                                .filter(item => Number.isFinite(item))
                                                            onChangeProperty(activeSeidId, property.ID, list)
                                                        }}
                                                        placeholder="例如: 1,2,3"
                                                        value={toArrayText(value)}
                                                    />
                                                </label>
                                            )
                                        }

                                        if (type === 'int' || type === 'float' || type === 'number') {
                                            return (
                                                <label className="config-field" key={property.ID}>
                                                    <span>
                                                        {property.ID} ({property.Type}) - {property.Desc || '-'}
                                                    </span>
                                                    <input
                                                        inputMode="numeric"
                                                        onChange={event => {
                                                            const raw = event.target.value.trim()
                                                            const num = raw === '' ? 0 : Number(raw)
                                                            onChangeProperty(activeSeidId, property.ID, Number.isFinite(num) ? num : 0)
                                                        }}
                                                        value={String(value ?? 0)}
                                                    />
                                                </label>
                                            )
                                        }

                                        return (
                                            <label className="config-field" key={property.ID}>
                                                <span>
                                                    {property.ID} ({property.Type}) - {property.Desc || '-'}
                                                </span>
                                                <input
                                                    onChange={event => onChangeProperty(activeSeidId, property.ID, event.target.value)}
                                                    value={String(value ?? '')}
                                                />
                                            </label>
                                        )
                                    })
                                )}
                            </div>
                        ) : (
                            <div className="todo-box">请选择左侧 Seid</div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}
