import { ClipboardPaste, Copy, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { ModuleKey } from '../../modules'

export type CreateAvatarRow = {
    key: string
    id: number
    title: string
    fenLei: string
    desc: string
}

type InfoPanelProps = {
    activeModule: ModuleKey | ''
    rows: CreateAvatarRow[]
    selectedTalentKey: string
    selectedTalentKeys: string[]
    onSelectTalent: (key: string, index: number, options: { shift: boolean; ctrl: boolean }) => void
    onAddTalent: () => void
    onDeleteTalents: () => void
    onBatchPrefixIds: (prefix: string) => void
    onCopyTalent: () => void
    onPasteTalent: () => void
}

export function InfoPanel({
    activeModule,
    rows,
    selectedTalentKey,
    selectedTalentKeys,
    onSelectTalent,
    onAddTalent,
    onDeleteTalents,
    onBatchPrefixIds,
    onCopyTalent,
    onPasteTalent,
}: InfoPanelProps) {
    const [menu, setMenu] = useState({ open: false, x: 0, y: 0 })

    function handleBatchPrefix() {
        const value = window.prompt('请输入ID开头数字，例如 40')
        if (value === null) return
        const prefix = value.trim()
        if (!prefix) return
        onBatchPrefixIds(prefix)
    }

    return (
        <section className="panel panel-data">
            <h2>数据内容</h2>
            <div className="panel-content">
                {activeModule === 'talent' ? (
                    <>
                        <div className="table-toolbar">
                            <button className="icon-btn" onClick={onAddTalent} title="新增" type="button">
                                <Plus size={14} />
                            </button>
                            <button className="icon-btn" onClick={onDeleteTalents} title="删除" type="button">
                                <Trash2 size={14} />
                            </button>
                            <button className="icon-btn" onClick={onCopyTalent} title="复制" type="button">
                                <Copy size={14} />
                            </button>
                            <button className="icon-btn" onClick={onPasteTalent} title="粘贴" type="button">
                                <ClipboardPaste size={14} />
                            </button>
                        </div>
                        <div className="todo-table-wrap">
                            <table className="todo-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>天赋名字</th>
                                        <th>分类</th>
                                        <th>描述</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr
                                            className={
                                                selectedTalentKeys.includes(row.key) || selectedTalentKey === row.key ? 'row-selected' : ''
                                            }
                                            key={row.key}
                                            onClick={event =>
                                                onSelectTalent(row.key, index, {
                                                    shift: event.shiftKey,
                                                    ctrl: event.ctrlKey || event.metaKey,
                                                })
                                            }
                                            onContextMenu={event => {
                                                event.preventDefault()
                                                if (!selectedTalentKeys.includes(row.key)) {
                                                    onSelectTalent(row.key, index, { shift: false, ctrl: false })
                                                }
                                                setMenu({ open: true, x: event.clientX, y: event.clientY })
                                            }}
                                        >
                                            <td>{row.id}</td>
                                            <td>{row.title}</td>
                                            <td>{row.fenLei}</td>
                                            <td>{row.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {menu.open ? (
                            <>
                                <div className="context-mask" onClick={() => setMenu({ open: false, x: 0, y: 0 })} />
                                <div className="folder-menu" style={{ left: menu.x, top: menu.y }}>
                                    <button
                                        className="folder-menu-item danger"
                                        onClick={() => {
                                            onDeleteTalents()
                                            setMenu({ open: false, x: 0, y: 0 })
                                        }}
                                        type="button"
                                    >
                                        删除所选
                                    </button>
                                    <button
                                        className="folder-menu-item"
                                        onClick={() => {
                                            setMenu({ open: false, x: 0, y: 0 })
                                            handleBatchPrefix()
                                        }}
                                        type="button"
                                    >
                                        批量修改ID开头
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </>
                ) : (
                    <div className="todo-box">TODO: 当前模块暂无表格数据</div>
                )}
            </div>
        </section>
    )
}
