import { X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

type RenameFolderModalProps = {
    open: boolean
    initialName: string
    onClose: () => void
    onSubmit: (nextName: string) => void
}

export function RenameFolderModal({ open, initialName, onClose, onSubmit }: RenameFolderModalProps) {
    const [name, setName] = useState(initialName)

    useEffect(() => {
        if (open) {
            setName(initialName)
        }
    }, [open, initialName])

    if (!open) return null

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        onSubmit(name.trim())
    }

    return (
        <div className="modal-mask" onClick={onClose}>
            <div className="create-modal" onClick={event => event.stopPropagation()}>
                <div className="create-modal-head">
                    <strong>重命名文件夹</strong>
                    <button className="modal-close" onClick={onClose} type="button">
                        <X size={14} />
                    </button>
                </div>
                <form className="new-project-form" onSubmit={handleSubmit}>
                    <label>
                        新名称
                        <input onChange={event => setName(event.target.value)} value={name} />
                    </label>
                    <button type="submit">确认</button>
                </form>
            </div>
        </div>
    )
}
