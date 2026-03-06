import { X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

type AddTalentModalProps = {
    open: boolean
    onClose: () => void
    onSubmit: (id: number) => void
    title?: string
    placeholder?: string
    confirmText?: string
}

export function AddTalentModal({
    open,
    onClose,
    onSubmit,
    title = '新增天赋',
    placeholder = '例如: 404',
    confirmText = '确认新增',
}: AddTalentModalProps) {
    const [idText, setIdText] = useState('')

    useEffect(() => {
        if (open) setIdText('')
    }, [open])

    if (!open) return null

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const id = Number(idText.trim())
        if (!Number.isFinite(id) || id <= 0) return
        onSubmit(id)
    }

    return (
        <div className="modal-mask" onClick={onClose}>
            <div className="create-modal" onClick={event => event.stopPropagation()}>
                <div className="create-modal-head">
                    <strong>{title}</strong>
                    <button className="modal-close" onClick={onClose} type="button">
                        <X size={14} />
                    </button>
                </div>
                <form className="new-project-form" onSubmit={handleSubmit}>
                    <label>
                        ID
                        <input
                            inputMode="numeric"
                            onChange={event => setIdText(event.target.value)}
                            placeholder={placeholder}
                            value={idText}
                        />
                    </label>
                    <button type="submit">{confirmText}</button>
                </form>
            </div>
        </div>
    )
}
