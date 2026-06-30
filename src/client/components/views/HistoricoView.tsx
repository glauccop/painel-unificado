import React, { useEffect, useState } from 'react'
import { fetchHistorico, type HistoricoData, type ScopeMode } from '../../shared/api'
import type { Visibility } from '../../shared/visibility'

// Aba "Histórico" — construção progressiva.
// Card 1: tipos de registros FECHADOS (Closed) vindos do filtro geral (escopo do topo).

const CLOSED_COLOR = '#1c60ab'

const WINDOWS: Array<{ v: string; label: string }> = [
    { v: 'all', label: 'Todos' },
    { v: '7', label: 'Últimos 7 dias' },
    { v: '14', label: 'Últimos 14 dias' },
    { v: '30', label: 'Últimos 30 dias' },
    { v: '60', label: 'Últimos 60 dias' },
]

const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e4e9f0',
    borderRadius: 14,
    padding: '16px 18px',
    boxShadow: '0 1px 3px rgba(16,38,76,.08)',
}

// Seletor de período em botões (segmented control).
function PeriodSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div style={{ display: 'inline-flex', gap: 4, background: '#eef2f7', padding: 4, borderRadius: 10, marginBottom: 16 }}>
            {WINDOWS.map((w) => {
                const on = value === w.v
                return (
                    <button
                        key={w.v}
                        onClick={() => onChange(w.v)}
                        style={{
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: 7,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: on ? 700 : 500,
                            background: on ? '#fff' : 'transparent',
                            color: on ? '#1c60ab' : '#5a6678',
                            boxShadow: on ? '0 1px 2px rgba(16,38,76,.12)' : 'none',
                        }}
                    >
                        {w.label}
                    </button>
                )
            })}
        </div>
    )
}

function TypeBars({ data }: { data: HistoricoData['byType'] }) {
    const max = Math.max(1, ...data.map((d) => d.closed))
    if (!data.length) return <div className="chart-empty">Sem registros fechados no filtro</div>
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6 }}>
            {data.map((d) => (
                <div key={d.table} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    <span
                        title={d.label}
                        style={{ width: 140, flexShrink: 0, color: '#5a6678', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                        {d.label}
                    </span>
                    <div style={{ flex: 1, background: '#eef2f7', borderRadius: 5, height: 14 }}>
                        <span
                            style={{
                                display: 'block',
                                height: '100%',
                                width: `${(d.closed / max) * 100}%`,
                                minWidth: 4,
                                background: CLOSED_COLOR,
                                borderRadius: 5,
                            }}
                        />
                    </div>
                    <b style={{ width: 36, textAlign: 'right' }}>{d.closed}</b>
                </div>
            ))}
        </div>
    )
}

export function HistoricoView({ scope, vis }: { scope: ScopeMode; vis: Visibility }) {
    const [data, setData] = useState<HistoricoData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [windowSel, setWindowSel] = useState('all')

    useEffect(() => {
        let alive = true
        setLoading(true)
        setError('')
        fetchHistorico(scope, windowSel === 'all' ? '' : windowSel)
            .then((d) => alive && setData(d))
            .catch((e) => alive && setError(String(e?.message || e)))
            .finally(() => alive && setLoading(false))
        return () => {
            alive = false
        }
    }, [scope, windowSel])

    return (
        <div className="historico-view" style={{ padding: '4px 24px 24px' }}>
            {error ? <div className="app-error">Falha ao carregar: {error}</div> : null}

            <PeriodSelector value={windowSel} onChange={setWindowSel} />

            <div style={cardStyle}>
                <div className="chart-ttl">Tipo de Registros — Fechados</div>
                {loading ? (
                    <div className="chart-empty">Carregando…</div>
                ) : (
                    <TypeBars data={(data?.byType || []).filter((t) => vis.isVisible(t.table))} />
                )}
            </div>
        </div>
    )
}
