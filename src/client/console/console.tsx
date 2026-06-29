import React, { useEffect, useMemo, useState } from 'react'
import logoMark from '../assets/logo_default.png'

type Scope = 'mine' | 'team' | 'both'
type Layout = 'grid' | 'stack'

interface WorkspaceLink {
    label: string
    url: string
}

interface SolItem {
    sys_id: string
    table: string
    type_label: string
    number: string
    short_description: string
    priority: string
    priority_label: string
    assigned_to: string
    assignment_group: string
    deeplink: string
}
interface Solution {
    key: string
    label: string
    product: string
    accent: string
    workspace: WorkspaceLink
    workspaceFallback: WorkspaceLink | null
    total: number
    byType: Array<{ label: string; count: number }>
    items: SolItem[]
}
interface BA {
    id: string
    name: string
    count: number
}
interface ConsoleData {
    user: { id: string; name: string }
    scope: Scope
    groups: number
    ba: string
    businessApps: BA[]
    byPriority: Array<{ key: string; count: number }>
    solutions: Solution[]
}

const BASE = '/api/x_snc_painel_unif/painel'

async function fetchConsole(scope: Scope, ba: string): Promise<ConsoleData> {
    const qs = new URLSearchParams({ scope, ba }).toString()
    const res = await fetch(`${BASE}/console?${qs}`, {
        headers: { Accept: 'application/json', 'X-UserToken': window.g_ck || '' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 400)}`)
    return res.json() as Promise<ConsoleData>
}

const SCOPES: Array<{ id: Scope; label: string }> = [
    { id: 'mine', label: 'Meus' },
    { id: 'team', label: 'Meu time' },
    { id: 'both', label: 'Meus + time' },
]

const PRI_LABEL: Record<string, string> = { '1': 'Crítica', '2': 'Alta', '3': 'Moderada', '4': 'Baixa', '5': 'Planejada' }
const PRI_COLOR: Record<string, string> = {
    '1': 'var(--vermelho)',
    '2': 'var(--caixa-laranja)',
    '3': '#d8a200',
    '4': 'var(--ink-mute)',
    '5': 'var(--caixa-azul)',
}
const ACCENT_COLOR: Record<string, string> = {
    azul: 'var(--caixa-azul)',
    turquesa: 'var(--caixa-turquesa)',
    laranja: 'var(--caixa-laranja)',
}

function priClass(p: string): string {
    const n = parseInt(p, 10)
    if (n <= 1) return 'p1'
    if (n === 2) return 'p2'
    if (n === 3) return 'p3'
    return 'p4'
}

function openRecord(it: SolItem) {
    if (it.deeplink && it.deeplink !== '#') window.open(it.deeplink, '_blank')
}

/* ===== Gráficos (SVG/CSS, sem dependências) ===== */
interface BarDatum {
    label: string
    value: number
    color: string
}

function BarChart({ title, data }: { title: string; data: BarDatum[] }) {
    const max = Math.max(1, ...data.map((d) => d.value))
    const has = data.some((d) => d.value > 0)
    return (
        <div className="chart">
            <div className="chart-ttl">{title}</div>
            {has ? (
                <div className="bars">
                    {data.map((d) => (
                        <div className="bar-row" key={d.label}>
                            <span className="bar-lbl" title={d.label}>
                                {d.label}
                            </span>
                            <span className="bar-track">
                                <span className="bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: d.color }} />
                            </span>
                            <span className="bar-val">{d.value}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="chart-empty">Sem dados no filtro</div>
            )}
        </div>
    )
}

function Donut({ title, data }: { title: string; data: BarDatum[] }) {
    const total = data.reduce((a, d) => a + d.value, 0)
    const R = 52
    const C = 2 * Math.PI * R
    let off = 0
    return (
        <div className="chart">
            <div className="chart-ttl">{title}</div>
            {total ? (
                <div className="donut-wrap">
                    <svg viewBox="0 0 140 140" className="donut">
                        <circle cx="70" cy="70" r={R} className="donut-bg" />
                        {data.map((d) => {
                            const len = (d.value / total) * C
                            const seg = (
                                <circle
                                    key={d.label}
                                    cx="70"
                                    cy="70"
                                    r={R}
                                    className="donut-seg"
                                    stroke={d.color}
                                    strokeDasharray={`${len} ${C - len}`}
                                    strokeDashoffset={-off}
                                />
                            )
                            off += len
                            return seg
                        })}
                        <text x="70" y="66" className="donut-num">
                            {total}
                        </text>
                        <text x="70" y="84" className="donut-cap">
                            registros
                        </text>
                    </svg>
                    <div className="donut-leg">
                        {data.map((d) => (
                            <span key={d.label} className="leg-item">
                                <span className="leg-sw" style={{ background: d.color }} />
                                {d.label} <b>{d.value}</b>
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="chart-empty">Sem dados no filtro</div>
            )}
        </div>
    )
}

function SolutionCard({ s }: { s: Solution }) {
    const [open, setOpen] = useState(false)
    const shown = open ? s.items : s.items.slice(0, 5)
    const hiddenLoaded = s.items.length - 5
    return (
        <div className={`sol acc-${s.accent}${open ? ' is-open' : ''}`}>
            <div className="sol-hd">
                <div>
                    <div className="sol-ttl">{s.label}</div>
                    <div className="sol-sub">{s.product}</div>
                </div>
                <div className="sol-kpi">{s.total}</div>
            </div>

            <div className="sol-chips">
                {s.byType.length ? (
                    s.byType.map((t) => (
                        <span key={t.label} className="chip">
                            {t.label} <b>{t.count}</b>
                        </span>
                    ))
                ) : (
                    <span className="chip muted">Sem registros no filtro</span>
                )}
            </div>

            <ul className="sol-list">
                {shown.length ? (
                    shown.map((it) => (
                        <li key={it.sys_id} onClick={() => openRecord(it)} title="Abrir registro">
                            <span className={`dot ${priClass(it.priority)}`} />
                            <span className="li-id">{it.number}</span>
                            <span className="li-ds">{it.short_description}</span>
                            <span className="li-who">{it.assigned_to || it.assignment_group || '—'}</span>
                        </li>
                    ))
                ) : (
                    <li className="empty">Nenhum item para mostrar</li>
                )}
            </ul>

            {s.items.length > 5 ? (
                <button className="sol-toggle" onClick={() => setOpen((v) => !v)}>
                    {open ? 'Ver menos' : `Ver todos (${hiddenLoaded})`}
                </button>
            ) : null}

            <div className="sol-foot">
                <button className="ws-btn" onClick={() => window.open(s.workspace.url, '_blank')}>
                    Abrir no {s.workspace.label} ↗
                </button>
                {s.workspaceFallback ? (
                    <a className="ws-fallback" href={s.workspaceFallback.url} target="_blank" rel="noreferrer">
                        {s.workspaceFallback.label}
                    </a>
                ) : null}
            </div>
        </div>
    )
}

export function Console() {
    const [scope, setScope] = useState<Scope>('mine')
    const [layout, setLayout] = useState<Layout>('grid')
    const [ba, setBa] = useState('')
    const [data, setData] = useState<ConsoleData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let alive = true
        setLoading(true)
        setError('')
        fetchConsole(scope, ba)
            .then((d) => {
                if (!alive) return
                if (ba && !d.businessApps.some((b) => b.id === ba)) setBa('')
                setData(d)
            })
            .catch((e) => alive && setError(String(e.message || e)))
            .finally(() => alive && setLoading(false))
        return () => {
            alive = false
        }
    }, [scope, ba])

    const totalAll = data ? data.solutions.reduce((a, s) => a + s.total, 0) : 0

    const solutionBars: BarDatum[] = useMemo(
        () => (data ? data.solutions.map((s) => ({ label: s.label, value: s.total, color: ACCENT_COLOR[s.accent] })) : []),
        [data],
    )
    const priorityBars: BarDatum[] = useMemo(() => {
        if (!data) return []
        return ['1', '2', '3', '4', '5']
            .map((k) => ({
                label: PRI_LABEL[k],
                value: data.byPriority.filter((p) => p.key === k).reduce((a, p) => a + p.count, 0),
                color: PRI_COLOR[k],
            }))
            .filter((d) => d.value > 0)
    }, [data])
    const areaBars: BarDatum[] = useMemo(
        () =>
            data
                ? data.businessApps.slice(0, 6).map((b) => ({ label: b.name, value: b.count, color: 'var(--caixa-azul)' }))
                : [],
        [data],
    )

    return (
        <div className="app">
            <header className="hdr">
                <div className="hdr-brand">
                    <img className="hdr-logo" src={logoMark} alt="Simplifica.CAIXA" />
                    <span>
                        Simplifica.CAIXA
                        <small>Console por Solução</small>
                    </span>
                </div>

                <label className="ba-ctl">
                    <span>Área (Business Application)</span>
                    <select value={ba} onChange={(e) => setBa(e.target.value)}>
                        <option value="">Todas as áreas</option>
                        {data?.businessApps.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name} ({b.count})
                            </option>
                        ))}
                    </select>
                </label>

                <div className="scope" role="tablist" aria-label="Escopo">
                    {SCOPES.map((s) => (
                        <button
                            key={s.id}
                            role="tab"
                            aria-selected={scope === s.id}
                            className={scope === s.id ? 'on' : ''}
                            onClick={() => setScope(s.id)}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <div className="layout-tog" role="tablist" aria-label="Layout dos cards">
                    <button
                        role="tab"
                        aria-selected={layout === 'grid'}
                        className={layout === 'grid' ? 'on' : ''}
                        title="Cards em grade"
                        onClick={() => setLayout('grid')}
                    >
                        ▦ Grade
                    </button>
                    <button
                        role="tab"
                        aria-selected={layout === 'stack'}
                        className={layout === 'stack' ? 'on' : ''}
                        title="Cards empilhados (largura total)"
                        onClick={() => setLayout('stack')}
                    >
                        ▤ Empilhado
                    </button>
                </div>

                <span className="sp" />
                {data ? (
                    <span className="hdr-user" title={data.user.name}>
                        {data.user.name}
                    </span>
                ) : null}
            </header>

            <main className="wrap">
                <div className="lead">
                    {loading
                        ? 'Carregando…'
                        : error
                          ? ''
                          : `${totalAll} registro(s) · escopo ${
                                scope === 'mine' ? 'Meus' : scope === 'team' ? 'Meu time' : 'Meus + time'
                            }${ba ? ' · 1 área' : ` · ${data?.businessApps.length || 0} áreas`}`}
                </div>

                {error ? <div className="err">Erro: {error}</div> : null}

                {data ? (
                    <>
                        <div className="charts">
                            <Donut title="Registros por solução" data={solutionBars} />
                            <BarChart title="Por prioridade" data={priorityBars} />
                            <BarChart title="Top áreas (Business Application)" data={areaBars} />
                        </div>

                        <div className={`sol-grid${layout === 'stack' ? ' stacked' : ''}`}>
                            {data.solutions.map((s) => (
                                <SolutionCard key={s.key} s={s} />
                            ))}
                        </div>
                    </>
                ) : null}
            </main>
        </div>
    )
}
