import { RefObject, useEffect } from 'react'

export function useOutsideClick<T extends HTMLElement>(ref: RefObject<T | null>, onOutside: () => void, enabled = true) {
    useEffect(() => {
        if (!enabled) return

        function handlePointerDown(event: MouseEvent) {
            const target = event.target as Node
            if (ref.current && !ref.current.contains(target)) {
                onOutside()
            }
        }

        window.addEventListener('mousedown', handlePointerDown)
        return () => window.removeEventListener('mousedown', handlePointerDown)
    }, [enabled, onOutside, ref])
}
