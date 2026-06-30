import React, { useEffect, useState } from 'react'
import './app.css'
import { Header } from './components/Header'
import { Settings } from './components/Settings'
import { ViewSwitcher } from './components/ViewSwitcher'
import { PrincipalView } from './components/views/PrincipalView'
import { HistoricoView } from './components/views/HistoricoView'
import { MeuTimeView } from './components/views/MeuTimeView'
import { fetchSummary, type Summary, type ScopeMode } from './shared/api'
import { useVisibility } from './shared/visibility'
import { useViewMode } from './shared/views'

export default function App() {
    const [scope, setScope] = useState<ScopeMode>('team')
    const [summary, setSummary] = useState<Summary | null>(null)
    const [error, setError] = useState<string | null>(null)

    const vis = useVisibility()
    const [viewMode, setViewMode] = useViewMode()

    // Summary acompanha o escopo — alimenta o nome no header e a engrenagem.
    useEffect(() => {
        let alive = true
        fetchSummary(scope)
            .then((s) => alive && (setSummary(s), setError(null)))
            .catch((e) => alive && setError(String(e?.message || e)))
        return () => {
            alive = false
        }
    }, [scope])

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

            {viewMode === 'historico' ? (
                <HistoricoView scope={scope} vis={vis} />
            ) : viewMode === 'meu_time' ? (
                <MeuTimeView />
            ) : (
                <PrincipalView scope={scope} vis={vis} />
            )}

            <footer className="app-foot">
                Simplifica.CAIXA · + simples + CAIXA · {summary ? `${summary.groups} grupo(s)` : '…'}
            </footer>
        </div>
    )
}
