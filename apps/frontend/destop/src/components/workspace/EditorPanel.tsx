import { ViewMode } from '../../modules'
import { TalentForm } from '../tianfu/TalentForm'
import { ProjectConfigForm } from './ProjectConfigForm'

type EditorPanelProps = {
    viewMode: ViewMode
    activeModule: string
    activeModuleLabel: string
    configForm: {
        name: string
        author: string
        version: string
        description: string
    }
    onChangeConfigForm: (patch: Partial<EditorPanelProps['configForm']>) => void
    talentForm: {
        id: number
        Title: string
        fenLeiGuanLian: number
        fenLei: string
        seid: number[]
        seidData?: Record<string, Record<string, string | number | number[]>>
        Desc: string
        Info: string
    } | null
    onChangeTalentForm: (patch: Partial<NonNullable<EditorPanelProps['talentForm']>>) => void
    talentTypeOptions: { id: number; name: string }[]
    onOpenSeidEditor: () => void
    seidDisplayRows: { id: number; name: string }[]
}

export function EditorPanel({
    viewMode,
    activeModule,
    activeModuleLabel,
    configForm,
    onChangeConfigForm,
    talentForm,
    onChangeTalentForm,
    talentTypeOptions,
    onOpenSeidEditor,
    seidDisplayRows,
}: EditorPanelProps) {
    return (
        <section className="panel panel-editor">
            <h2>编辑区域</h2>
            <div className="panel-content editor-wrap">
                {viewMode === 'config-form' ? <ProjectConfigForm values={configForm} onChange={onChangeConfigForm} /> : null}

                {viewMode === 'todo' ? (
                    <div className="todo-box">TODO: {activeModuleLabel === '-' ? '请选择模块' : activeModuleLabel}</div>
                ) : null}

                {viewMode === 'table' ? (
                    activeModule === 'talent' ? (
                        <TalentForm
                            onOpenSeidEditor={onOpenSeidEditor}
                            seidDisplayRows={seidDisplayRows}
                            typeOptions={talentTypeOptions}
                            values={talentForm}
                            onChange={onChangeTalentForm}
                        />
                    ) : (
                        <div className="todo-box">TODO: {activeModuleLabel}</div>
                    )
                ) : null}
            </div>
        </section>
    )
}
