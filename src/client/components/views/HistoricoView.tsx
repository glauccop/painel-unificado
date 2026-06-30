import React, { useEffect, useState } from 'react'
import { Inbox } from '../Inbox'
import { fetchHistorico, fetchList, type HistoricoData, type InboxItem, type ScopeMode } from '../../shared/api'
import type { Visibility } from '../../shared/visibility'

// Aba "Histórico" — construção progressiva.
// Card 1: tipos de registros FECHADOS (Closed) vindos do filtro geral (escopo do topo).
// Clicar numa barra abre, abaixo, a lista dos fechados daquela tabela (deeplink no Inbox).

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

function TypeBars({ data, active, onPick }: { data: HistoricoData['byType']; active: string; onPick: (table: string) => void }) {
    const max = Math.max(1, ...data.map((d) => d.closed))
    if (!data.length) return <div className="chart-empty">Sem registros fechados no filtro</div>
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6 }}>
            {data.map((d) => (
                <div
                    key={d.table}
                    onClick={() => onPick(d.table)}
                    title={`Ver ${d.label} fechados`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 12,
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: 6,
                        background: active === d.table ? '#eef4fb' : 'transparent',
                    }}
                >
                    <span
                        style={{ width: 140, flexShrink: 0, color: active === d.table ? CLOSED_COLOR : '#5a6678', fontWeight: active === d.table ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
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

    const [activeTable, setActiveTable] = useState('')
    const [items, setItems] = useState<InboxItem[]>([])
    const [loadingList, setLoadingList] = useState(false)

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

    // Lista dos fechados da tabela ativa, seguindo escopo + período.
    useEffect(() => {
        if (!activeTable) {
            setItems([])
            return
        }
        const lens = windowSel === 'all' ? `closed_type:${activeTable}` : `closed_days:${windowSel}:${activeTable}`
        let alive = true
        setLoadingList(true)
        fetchList(scope, lens, 100, 0)
            .then((r) => alive && setItems(r.items || []))
            .catch(() => alive && setItems([]))
            .finally(() => alive && setLoadingList(false))
        return () => {
            alive = false
        }
    }, [scope, windowSel, activeTable])

    const visibleTypes = (data?.byType || []).filter((t) => vis.isVisible(t.table))
    // Se a tabela ativa for ocultada na engrenagem, fecha a lista.
    const activeVisible = activeTable && visibleTypes.some((t) => t.table === activeTable)
    const activeLabel = data?.byType.find((t) => t.table === activeTable)?.label || activeTable

    return (
        <div className="historico-view" style={{ padding: '4px 24px 24px' }}>
            {error ? <div className="app-error">Falha ao carregar: {error}</div> : null}

            <PeriodSelector value={windowSel} onChange={setWindowSel} />

            <div style={cardStyle}>
                <div className="chart-ttl">Tipo de Registros — Fechados</div>
                {loading ? (
                    <div className="chart-empty">Carregando…</div>
                ) : (
                    <TypeBars
                        data={visibleTypes}
                        active={activeTable}
                        onPick={(table) => setActiveTable((t) => (t === table ? '' : table))}
                    />
                )}
            </div>

            {activeVisible ? (
                <div style={{ ...cardStyle, marginTop: 16 }}>
                    <div className="chart-ttl" style={{ marginBottom: 8 }}>
                        {activeLabel} — fechados {windowSel === 'all' ? '(todos os períodos)' : `(últimos ${windowSel} dias)`}
                    </div>
                    <Inbox items={items} loading={loadingList} lens="" lenses={[]} onLens={() => {}} />
                </div>
            ) : null}
        </div>
    )
}
