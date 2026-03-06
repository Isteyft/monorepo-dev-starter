type TalentFormValues = {
    id: number
    Title: string
    fenLeiGuanLian: number
    fenLei: string
    seid: number[]
    Desc: string
    Info: string
}

type TalentFormProps = {
    values: TalentFormValues | null
    onChange: (patch: Partial<TalentFormValues>) => void
    typeOptions: { id: number; name: string }[]
    onOpenSeidEditor: () => void
    seidDisplayRows: { id: number; name: string }[]
}

export function TalentForm({ values, onChange, typeOptions, onOpenSeidEditor, seidDisplayRows }: TalentFormProps) {
    if (!values) return <div className="todo-box">请选择一条天赋数据</div>

    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>ID</span>
                <input inputMode="numeric" onChange={event => onChange({ id: Number(event.target.value || '0') })} value={values.id} />
            </label>
            <label className="config-field">
                <span>天赋名字</span>
                <input onChange={event => onChange({ Title: event.target.value })} value={values.Title} />
            </label>
            <label className="config-field">
                <span>分类</span>
                <select onChange={event => onChange({ fenLeiGuanLian: Number(event.target.value || '0') })} value={values.fenLeiGuanLian}>
                    <option value={0}>0.未分类</option>
                    {typeOptions.map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>Seid</span>
                <div className="seid-preview-wrap">
                    <div className="seid-preview-table" role="table">
                        {seidDisplayRows.length > 0 ? (
                            seidDisplayRows.map(row => (
                                <div className="seid-preview-row" key={`${row.id}-${row.name}`} role="row">
                                    {row.id} {row.name}
                                </div>
                            ))
                        ) : (
                            <div className="seid-preview-empty">暂无 Seid</div>
                        )}
                    </div>
                    <div className="seid-preview-actions">
                        <button className="save-btn" onClick={onOpenSeidEditor} type="button">
                            编辑 Seid
                        </button>
                    </div>
                </div>
            </label>
            <label className="config-field">
                <span>描述</span>
                <textarea className="config-desc-input" onChange={event => onChange({ Desc: event.target.value })} value={values.Desc} />
            </label>
            <label className="config-field">
                <span>信息</span>
                <textarea className="config-desc-input" onChange={event => onChange({ Info: event.target.value })} value={values.Info} />
            </label>
        </div>
    )
}
