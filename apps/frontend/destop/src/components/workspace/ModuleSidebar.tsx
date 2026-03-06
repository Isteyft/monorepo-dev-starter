import { ChevronDown, ChevronRight, Folder } from 'lucide-react'

import { ModuleKey, MODULES } from '../../modules'

type ModuleSidebarProps = {
    activeModule: ModuleKey | ''
    rootName: string
    expanded: boolean
    onSelect: (key: ModuleKey) => void
    onToggleExpanded: () => void
    onRootContextMenu?: (x: number, y: number) => void
}

export function ModuleSidebar({ activeModule, rootName, expanded, onSelect, onToggleExpanded, onRootContextMenu }: ModuleSidebarProps) {
    return (
        <aside className="panel panel-tree">
            <h2>项目文件夹</h2>
            <div className="panel-content">
                <button
                    className="tree-root"
                    onClick={onToggleExpanded}
                    onContextMenu={event => {
                        event.preventDefault()
                        onRootContextMenu?.(event.clientX, event.clientY)
                    }}
                    type="button"
                >
                    <Folder size={14} />
                    <span>{rootName}</span>
                    <span className="tree-expand-icon">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                </button>

                {expanded ? (
                    <div className="tree-children">
                        {MODULES.map(module => (
                            <button
                                className={`tree-item ${module.key === activeModule ? 'active' : ''}`}
                                key={module.key}
                                onClick={() => onSelect(module.key)}
                                type="button"
                            >
                                {module.label}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>
        </aside>
    )
}
