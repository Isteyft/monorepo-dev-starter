type ProjectConfigFormValues = {
    name: string
    author: string
    version: string
    description: string
}

type ProjectConfigFormProps = {
    values: ProjectConfigFormValues
    onChange: (patch: Partial<ProjectConfigFormValues>) => void
}

export function ProjectConfigForm({ values, onChange }: ProjectConfigFormProps) {
    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>名称</span>
                <input value={values.name} onChange={event => onChange({ name: event.target.value })} />
            </label>
            <label className="config-field">
                <span>作者</span>
                <input value={values.author} onChange={event => onChange({ author: event.target.value })} />
            </label>
            <label className="config-field">
                <span>版本</span>
                <input value={values.version} onChange={event => onChange({ version: event.target.value })} />
            </label>
            <label className="config-field">
                <span>描述</span>
                <textarea
                    className="config-desc-input"
                    value={values.description}
                    onChange={event => onChange({ description: event.target.value })}
                />
            </label>
        </div>
    )
}
