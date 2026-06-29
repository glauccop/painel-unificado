import { useEffect, useState } from 'react'

export type ViewMode = 'principal' | 'foco' | 'cockpit' | 'kanban' | 'executivo'

export interface ViewDef {
    id: ViewMode
    label: string
    icon: string
    hint: string
}

export const VIEWS: ViewDef[] = [
    { id: 'principal', label: 'Principal', icon: '◧', hint: 'Cards por solução — ITSM, SPM e Ágil consolidados' },
    { id: 'foco', label: 'Foco', icon: '☰', hint: 'Sua fila + insights — o dia a dia operacional' },
    { id: 'cockpit', label: 'Cockpit', icon: '▦', hint: 'Painel analítico com todos os indicadores' },
    { id: 'kanban', label: 'Kanban', icon: '▤', hint: 'Quadro operacional por situação' },
    { id: 'executivo', label: 'Executivo', icon: '◉', hint: 'Resumo de uma tela para gestão' },
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
