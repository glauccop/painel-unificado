import { useEffect, useState } from 'react'

export type ViewMode = 'principal' | 'historico' | 'meu_time'

export interface ViewDef {
    id: ViewMode
    label: string
    icon: string
    hint: string
}

export const VIEWS: ViewDef[] = [
    { id: 'principal', label: 'Principal', icon: '◧', hint: 'Cards por solução — ITSM, SPM e Ágil consolidados' },
    { id: 'historico', label: 'Histórico', icon: '◴', hint: 'Registros fechados e cancelados' },
    { id: 'meu_time', label: 'Meu time', icon: '◍', hint: 'Meus grupos e a estrutura do time' },
]

const STORAGE_KEY = 'painel.viewMode.v1'

export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
    const [mode, setMode] = useState<ViewMode>(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY) as ViewMode | null
            if (raw && VIEWS.some((v) => v.id === raw)) return raw
        } catch {
            /* ignore */
        }
        return 'principal'
    })
    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, mode)
        } catch {
            /* ignore */
        }
    }, [mode])
    return [mode, setMode]
}
