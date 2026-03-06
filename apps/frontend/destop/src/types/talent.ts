export type TalentTypeOption = { id: number; name: string }

export type CreateAvatarEntry = {
    id: number
    Title: string
    fenZu: number
    feiYong: number
    fenLei: string
    fenLeiGuanLian: number
    seid: number[]
    seidData: Record<string, Record<string, string | number | number[]>>
    jiesuo: number
    UnlockKey?: string
    UnlockDesc?: string
    Desc: string
    Info: string
}
