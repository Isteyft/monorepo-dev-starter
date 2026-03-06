export type ModuleKey = 'project-config' | 'talent' | 'buff' | 'item' | 'skill' | 'staticskill'
export type ViewMode = 'config-form' | 'todo' | 'table'

export const MODULES: { key: ModuleKey; label: string }[] = [
    { key: 'project-config', label: '项目配置' },
    { key: 'talent', label: '天赋' },
    { key: 'buff', label: 'Buff' },
    { key: 'item', label: '物品' },
    { key: 'skill', label: '神通' },
    { key: 'staticskill', label: '功法' },
]
