import { useCallback, useEffect, useState } from 'react'

// Controla quais "tipos de registro" o usuário escolhe ver no painel.
// Tudo client-side: a instância de demo traz dados de teste em excesso, então
// o usuário liga/desliga categorias sem mexer no servidor.
//
// IDs de tipo = sys_class_name (ex.: 'incident', 'rm_story'). Além disso há
// duas features especiais que não vêm da hierarquia de task:
//   'vuln'      → Vulnerabilidades (sn_vul_vulnerable_item)
//   'approvals' → Aprovações pendentes
//
// Persistimos apenas os IDs OCULTOS. Assim, qualquer tipo novo que apareça na
// instância nasce visível por padrão (bom para demo).

const STORAGE_KEY = 'painel.hiddenTypes.v1'

function load(): Set<string> {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return new Set()
        const arr = JSON.parse(raw)
        return new Set(Array.isArray(arr) ? arr : [])
    } catch {
        return new Set()
    }
}

function save(hidden: Set<string>) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...hidden]))
    } catch {
        /* ignore */
    }
}

export interface Visibility {
    hidden: Set<string>
    isVisible: (id: string) => boolean
    toggle: (id: string) => void
    setHidden: (ids: string[]) => void
    showAll: () => void
    hiddenCount: number
}

export function useVisibility(): Visibility {
    const [hidden, setHiddenState] = useState<Set<string>>(load)

    useEffect(() => {
        save(hidden)
    }, [hidden])

    const isVisible = useCallback((id: string) => !hidden.has(id), [hidden])

    const toggle = useCallback((id: string) => {
        setHiddenState((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const setHidden = useCallback((ids: string[]) => setHiddenState(new Set(ids)), [])
    const showAll = useCallback(() => setHiddenState(new Set()), [])

    return { hidden, isVisible, toggle, setHidden, showAll, hiddenCount: hidden.size }
}
