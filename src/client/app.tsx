import React, { useEffect, useState } from 'react'
import './app.css'
import { Header } from './components/Header'
import { Settings } from './components/Settings'
import { ViewSwitcher } from './components/ViewSwitcher'
import { FocusView } from './components/views/FocusView'
import { PrincipalView } from './components/views/PrincipalView'
import { CockpitView } from './components/views/CockpitView'
import { KanbanView } from './components/views/KanbanView'
import { ExecutiveView } from './components/views/ExecutiveView'
import { fetchSummary, fetchList, type Summary, type InboxItem, type ScopeMode } from './shared/api'
import { DEFAULT_TEMPLATE } from './shared/templates'
import { useVisibility } from './shared/visibility'
import { useViewMode } from './shared/views'
import type { ViewProps } from './components/views/common'

export default function App() {
    const template = DEFAULT_TEMPLATE
    const [scope, setScope] = useState<ScopeMode>('team')
    const [lens, setLens] = useState<string>(DEFAULT_TEMPLATE.defaultLens)
    const [summary, setSummary] = useState<Summary | null>(null)
    const [items, setItems] = useState<InboxItem[]>([])
    const [loadingList, setLoadingList] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const vis = useVisibility()
    const [viewMode, setViewMode] = useViewMode()

    // Cockpit/Kanban/Executivo trabalham com a base completa; só o Foco usa a lente.
    const listLens = viewMode === 'foco' ? lens : 'all'

    // Drill-down a partir de gráficos: filtra e leva para a visão Foco.
    const onDrill = (l: string) => {
        setLens(l)
        setViewMode('foco')
    }

    // Summary acompanha o escopo
    useEffect(() => {
        let alive = true
        fetchSummary(scope)
            .then((s) => alive && (setSummary(s), setError(null)))
            .catch((e) => alive && setError(String(e?.message || e)))
        return () => {
            alive = false
        }
    }, [scope])

    // Lista acompanha escopo + lente efetiva
    useEffect(() => {
        let alive = true
        setLoadingList(true)
        fetchList(scope, listLens, 60, 0)
            .then((r) => alive && setItems(r.items || []))
            .catch(() => alive && setItems([]))
            .finally(() => alive && setLoadingList(false))
        return () => {
            alive = false
        }
    }, [scope, listLens])

    const viewProps: ViewProps | null = summary
        ? { summary, vis, template, items, loadingList, lens, onLens: setLens, onDrill }
        : null

    return (
        <div className="app">
            <Header scope={scope} onScope={setScope} userName={summary?.user?.name} />

            <div className="app-sub">
                <div className="sub-tools">
                    <ViewSwitcher mode={viewMode} onMode={setViewMode} />
                    <Settings summary={summary} vis={vis} />
                </div>
            </div>

            {error ? <div className="app-error">Falha ao carregar: {error}</div> : null}

            {viewMode === 'principal' ? (
                <PrincipalView scope={scope} vis={vis} />
            ) : !viewProps ? (
                <div className="kpi-strip">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="kpi skeleton" />
                    ))}
                </div>
            ) : viewMode === 'cockpit' ? (
                <CockpitView {...viewProps} />
            ) : viewMode === 'kanban' ? (
                <KanbanView {...viewProps} />
            ) : viewMode === 'executivo' ? (
                <ExecutiveView {...viewProps} />
            ) : (
                <FocusView {...viewProps} />
            )}

            <footer className="app-foot">
                Simplifica.CAIXA · + simples + CAIXA · {summary ? `${summary.groups} grupo(s)` : '…'}
            </footer>
        </div>
    )
}
