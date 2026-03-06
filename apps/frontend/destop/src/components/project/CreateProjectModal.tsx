import { X } from 'lucide-react'
import { FormEvent } from 'react'

type CreateProjectModalProps = {
    open: boolean
    projectName: string
    modName: string
    onChangeProjectName: (value: string) => void
    onChangeModName: (value: string) => void
    onClose: () => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CreateProjectModal({
    open,
    projectName,
    modName,
    onChangeProjectName,
    onChangeModName,
    onClose,
    onSubmit,
}: CreateProjectModalProps) {
    if (!open) return null

    return (
        <div className="modal-mask" onClick={onClose}>
            <div className="create-modal" onClick={event => event.stopPropagation()}>
                <div className="create-modal-head">
                    <strong>新建项目</strong>
                    <button className="modal-close" onClick={onClose} type="button">
                        <X size={14} />
                    </button>
                </div>
                <form className="new-project-form" onSubmit={onSubmit}>
                    <label>
                        项目名字
                        <input
                            onChange={event => onChangeProjectName(event.target.value)}
                            placeholder="例如: mod/测试"
                            value={projectName}
                        />
                    </label>
                    <label>
                        mod 名称
                        <input
                            onChange={event => onChangeModName(event.target.value)}
                            placeholder="例如: 测试（会生成 mod测试）"
                            value={modName}
                        />
                    </label>
                    <button type="submit">创建</button>
                </form>
            </div>
        </div>
    )
}
