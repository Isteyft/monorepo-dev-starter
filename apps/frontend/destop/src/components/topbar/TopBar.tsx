import { Minus, Square, X } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'

type TopBarProps = {
    children: ReactNode
    onMinimize: () => void
    onToggleMaximize: () => void
    onClose: () => void
    onStartDragging: () => void
}

export function TopBar({ children, onMinimize, onToggleMaximize, onClose, onStartDragging }: TopBarProps) {
    const handleAction = (action: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        action()
    }

    const handleDragMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) {
            return
        }
        onStartDragging()
    }

    return (
        <header className="topbar">
            <div className="topbar-left">{children}</div>
            <div className="drag-region" data-tauri-drag-region onMouseDown={handleDragMouseDown} />
            <div className="window-actions">
                <button className="window-btn" onClick={handleAction(onMinimize)} title="最小化" type="button">
                    <Minus size={14} />
                </button>
                <button className="window-btn" onClick={handleAction(onToggleMaximize)} title="最大化/还原" type="button">
                    <Square size={12} />
                </button>
                <button className="window-btn danger" onClick={handleAction(onClose)} title="关闭" type="button">
                    <X size={14} />
                </button>
            </div>
        </header>
    )
}
