import { useEffect } from 'react'

import type { CreateAvatarEntry } from '../types'

type UseSeidActiveSyncParams = {
    seidEditorOpen: boolean
    selectedTalent: CreateAvatarEntry | null
    activeSeidId: number | null
    setActiveSeidId: (id: number | null) => void
}

export function useSeidActiveSync({ seidEditorOpen, selectedTalent, activeSeidId, setActiveSeidId }: UseSeidActiveSyncParams) {
    useEffect(() => {
        if (!seidEditorOpen) return
        const list = selectedTalent?.seid ?? []
        if (list.length === 0) {
            setActiveSeidId(null)
            return
        }
        if (!activeSeidId || !list.includes(activeSeidId)) {
            setActiveSeidId(list[0])
        }
    }, [activeSeidId, seidEditorOpen, selectedTalent, setActiveSeidId])
}
