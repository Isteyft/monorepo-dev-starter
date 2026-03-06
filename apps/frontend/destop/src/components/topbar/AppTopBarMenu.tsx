import { useRef, useState } from 'react'

import { useOutsideClick } from '../../hooks/useOutsideClick'
import { TopBar } from './TopBar'

type AppTopBarMenuProps = {
    configDirty: boolean
    onCreateProject: () => void
    onOpenProject: () => void
    onSaveProject: () => void
    onClose: () => void
    onMinimize: () => void
    onToggleMaximize: () => void
    onStartDragging: () => void
}

export function AppTopBarMenu({
    configDirty,
    onCreateProject,
    onOpenProject,
    onSaveProject,
    onClose,
    onMinimize,
    onToggleMaximize,
    onStartDragging,
}: AppTopBarMenuProps) {
    const menuGroupRef = useRef<HTMLDivElement | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)

    useOutsideClick(menuGroupRef, () => setMenuOpen(false), true)

    return (
        <TopBar onClose={onClose} onMinimize={onMinimize} onStartDragging={onStartDragging} onToggleMaximize={onToggleMaximize}>
            <div className="menu-group" ref={menuGroupRef}>
                <button className="menu-trigger" onClick={() => setMenuOpen(prev => !prev)} type="button">
                    文件
                </button>
                {menuOpen ? (
                    <div className="menu-dropdown">
                        <button
                            className="menu-item"
                            onClick={() => {
                                setMenuOpen(false)
                                onCreateProject()
                            }}
                            type="button"
                        >
                            新建项目
                        </button>
                        <button
                            className="menu-item"
                            onClick={() => {
                                setMenuOpen(false)
                                onOpenProject()
                            }}
                            type="button"
                        >
                            打开项目
                        </button>
                        <button
                            className="menu-item"
                            onClick={() => {
                                setMenuOpen(false)
                                onSaveProject()
                            }}
                            type="button"
                        >
                            保存项目{configDirty ? ' *' : ''}
                        </button>
                    </div>
                ) : null}
            </div>
        </TopBar>
    )
}
