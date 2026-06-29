import React, { useEffect, useMemo, useState } from 'react'
import {
    fetchConsole,
    type ConsoleData,
    type ConsoleSolution,
    type ConsoleSolItem,
    type ConsoleVr,
    type ConsoleVrItem,
    type ScopeMode,
} from '../../shared/api'
import type { Visibility } from '../../shared/visibility'

// Aba "Principal" do painel: gráficos (tipos, criticidade, status das histórias)
// + cards do Console por Solução, usando o escopo do painel (meus / time / ambos).

// Cores concretas (hex) — var() não resolve em atributo SVG, então usamos hex direto.
const C = {
    azul: '#1c60ab',
    azulEscuro: '#003a70',
    laranja: '#ef9c00',
    turquesa: '#3fb6a8',
    vermelho: '#d64545',
    roxo: '#7b6fd6',
    verde: '#4f9d3a',
    amarelo: '#d8a200',
    cinza: '#8c99ab',
}
const PALETTE = [C.azul, C.turquesa, C.laranja, C.roxo, C.verde, C.vermelho, C.amarelo, C.azulEscuro, C.cinza]
const PRI_LABEL: Record<string, string> = { '1': 'Crítica', '2': 'Alta', '3': 'Moderada', '4': 'Baixa', '5': 'Planejada' }
const PRI_COLOR: Record<string, string> = { '1': C.vermelho, '2': C.laranja, '3': C.amarelo, '4': C.cinza, '5': C.azul }

// Escala de criticidade UNIFICADA: tarefas (priority) e vulnerabilidades (risk_rating)
// mapeadas para os mesmos 5 níveis — usada no card "Registros não atribuídos".
const CRIT_LABEL: Record<string, string> = { '1': 'Crítica', '2': 'Alta', '3': 'Moderada', '4': 'Baixa', '5': 'Nenhuma' }
const CRIT_COLOR: Record<string, string> = { '1': C.vermelho, '2': C.laranja, '3': C.amarelo, '4': C.verde, '5': C.cinza }
// priority de task (1..5 / vazio) -> bucket unificado
function priBucket(priority: string): string {
    const n = parseInt(priority, 10)
    return n >= 1 && n <= 4 ? String(n) : '5'
}

// Cor por severidade (risk_rating) das vulnerabilidades — casa por substring do rótulo.
function sevColor(label: string): string {
    const l = (label || '').toLowerCase()
    if (l.indexOf('critic') >= 0 || l.indexOf('crítica') >= 0) return C.vermelho
    if (l.indexOf('high') >= 0 || l.indexOf('alta') >= 0) return C.laranja
    if (l.indexOf('medium') >= 0 || l.indexOf('média') >= 0 || l.indexOf('moder') >= 0) return C.amarelo
    if (l.indexOf('low') >= 0 || l.indexOf('baixa') >= 0) return C.verde
    return C.cinza
}

// Rótulo da severidade (risk_rating) em PT-BR, alinhado aos rótulos de prioridade
// dos demais cards (PRI_LABEL). O risk_rating chega da instância em inglês.
function sevLabel(label: string): string {
    const l = (label || '').toLowerCase()
    if (l.indexOf('critic') >= 0 || l.indexOf('crítica') >= 0) return 'Crítica'
    if (l.indexOf('high') >= 0 || l.indexOf('alta') >= 0) return 'Alta'
    if (l.indexOf('medium') >= 0 || l.indexOf('média') >= 0 || l.indexOf('moder') >= 0) return 'Moderada'
    if (l.indexOf('low') >= 0 || l.indexOf('baixa') >= 0) return 'Baixa'
    if (l.indexOf('none') >= 0 || l.indexOf('nenhuma') >= 0) return 'Nenhuma'
    return label || '—'
}

// Ordem de apresentação da severidade: da mais crítica para a mais baixa, "Nenhuma" por último.
function sevRank(label: string): number {
    const l = (label || '').toLowerCase()
    if (l.indexOf('critic') >= 0 || l.indexOf('crítica') >= 0) return 0
    if (l.indexOf('high') >= 0 || l.indexOf('alta') >= 0) return 1
    if (l.indexOf('medium') >= 0 || l.indexOf('média') >= 0 || l.indexOf('moder') >= 0) return 2
    if (l.indexOf('low') >= 0 || l.indexOf('baixa') >= 0) return 3
    if (l.indexOf('none') >= 0 || l.indexOf('nenhuma') >= 0) return 4
    return 5
}

// risk_rating de VR -> bucket de criticidade unificada (1..5), alinhado a CRIT_LABEL.
function sevBucket(label: string): string {
    return String(Math.min(sevRank(label) + 1, 5))
}

// Chave de visibilidade que controla o card VR (mesma da engrenagem).
const VR_VIS = 'sn_vul_vulnerable_item'

type Layout = 'grid' | 'stack'

interface Datum {
    label: string
    value: number
    color: string
}

function priClass(p: string): string {
    const n = parseInt(p, 10)
    if (n <= 1) return 'p1'
    if (n === 2) return 'p2'
    if (n === 3) return 'p3'
    return 'p4'
}

function openRecord(it: ConsoleSolItem) {
    if (it.deeplink && it.deeplink !== '#') window.open(it.deeplink, '_blank')
}

function Donut({ title, data, unit = 'REGISTROS' }: { title: string; data: Datum[]; unit?: string }) {
    const total = data.reduce((a, d) => a + d.value, 0)
    const R = 52
    const CIRC = 2 * Math.PI * R
    let off = 0
    return (
        <div
            className="chart"
            style={{ background: '#fff', border: '1px solid #e4e9f0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(16,38,76,.08)' }}
        >
            <div className="chart-ttl">{title}</div>
            {total ? (
                <div className="donut-wrap" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <svg
                        viewBox="0 0 140 140"
                        className="donut"
                        style={{ width: 'clamp(96px, 26%, 132px)', height: 'auto', flexShrink: 0 }}
                    >
                        <circle cx="70" cy="70" r={R} className="donut-bg" fill="none" stroke="#eef2f7" strokeWidth={16} />
                        {data.map((d) => {
                            const len = (d.value / total) * CIRC
                            const seg = (
                                <circle
                                    key={d.label}
                                    cx="70"
                                    cy="70"
                                    r={R}
                                    fill="none"
                                    stroke={d.color}
                                    strokeWidth={16}
                                    strokeDasharray={`${len} ${CIRC - len}`}
                                    strokeDashoffset={-off}
                                    transform="rotate(-90 70 70)"
                                />
                            )
                            off += len
                            return seg
                        })}
                        <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="700" fill="#003a70">
                            {total}
                        </text>
                        <text x="70" y="84" textAnchor="middle" fontSize="9" fill="#8c99ab">
                            {unit}
                        </text>
                    </svg>
                    <div className="donut-leg" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                        {data.map((d) => (
                            <span key={d.label} className="leg-item" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <span
                                    className="leg-sw"
                                    style={{ background: d.color, width: 10, height: 10, borderRadius: 3, flexShrink: 0 }}
                                />
                                {d.label} <b style={{ marginLeft: 2 }}>{d.value}</b>
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="donut-wrap" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <svg
                        viewBox="0 0 140 140"
                        className="donut"
                        style={{ width: 'clamp(96px, 26%, 132px)', height: 'auto', flexShrink: 0 }}
                    >
                        <circle cx="70" cy="70" r={R} className="donut-bg" fill="none" stroke="#eef2f7" strokeWidth={16} />
                        <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="700" fill="#003a70">
                            0
                        </text>
                        <text x="70" y="84" textAnchor="middle" fontSize="9" fill="#8c99ab">
                            {unit}
                        </text>
                    </svg>
                    <div className="donut-leg" style={{ fontSize: 12, color: '#8c99ab' }}>Sem registros</div>
                </div>
            )}
        </div>
    )
}

// Barras horizontais compactas de distribuição (severidade / prioridade) — usadas no header
// dos cards de solução e no card de vulnerabilidades.
function DistBars({ data }: { data: Datum[] }) {
    const max = Math.max(1, ...data.map((d) => d.value))
    return (
        <div className="vr-sev" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0 10px' }}>
            {data.map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 70, flexShrink: 0, color: '#5a6678' }}>{d.label}</span>
                    <span
                        style={{
                            height: 10,
                            borderRadius: 4,
                            background: d.color,
                            width: `${(d.value / max) * 100}%`,
                            minWidth: 4,
                            transition: 'width .2s',
                        }}
                    />
                    <b style={{ marginLeft: 2 }}>{d.value}</b>
                </div>
            ))}
        </div>
    )
}

function HBarChart({ title, data }: { title: string; data: Datum[] }) {
    const max = Math.max(1, ...data.map((d) => d.value))
    return (
        <div
            className="chart"
            style={{ background: '#fff', border: '1px solid #e4e9f0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(16,38,76,.08)' }}
        >
            <div className="chart-ttl">{title}</div>
            {data.length ? (
                <div className="hbars" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>
                    {data.map((d) => (
                        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                            <span
                                className="hbar-lbl"
                                title={d.label}
                                style={{ width: 120, flexShrink: 0, color: '#5a6678', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                                {d.label}
                            </span>
                            <div style={{ flex: 1, background: '#eef2f7', borderRadius: 5, height: 14 }}>
                                <span
                                    className="hbar-col"
                                    style={{
                                        display: 'block',
                                        height: '100%',
                                        width: `${(d.value / max) * 100}%`,
                                        minWidth: 4,
                                        background: d.color,
                                        borderRadius: 5,
                                        transition: 'width .2s',
                                    }}
                                />
                            </div>
                            <b style={{ width: 28, textAlign: 'right' }}>{d.value}</b>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="chart-empty">Sem histórias no filtro</div>
            )}
        </div>
    )
}

function SolutionCard({ s }: { s: ConsoleSolution }) {
    const [open, setOpen] = useState(false)
    const shown = open ? s.items : s.items.slice(0, 5)
    const hiddenLoaded = s.items.length - 5
    // Distribuição por prioridade dos itens do card — espelha o donut "Criticidade".
    const priData: Datum[] = ['1', '2', '3', '4', '5']
        .map((k) => ({
            label: PRI_LABEL[k],
            value: s.items.filter((it) => String(parseInt(it.priority, 10) || 5) === k).length,
            color: PRI_COLOR[k],
        }))
        .filter((d) => d.value > 0)
    return (
        <div className={`sol acc-${s.accent}`}>
            <div className="sol-hd">
                <div>
                    <div className="sol-ttl">{s.label}</div>
                    <div className="sol-sub">{s.product}</div>
                </div>
                <div className="sol-kpi">{s.total}</div>
            </div>

            {priData.length ? <DistBars data={priData} /> : null}

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

function VrCard({ vr }: { vr: ConsoleVr }) {
    const [open, setOpen] = useState(false)
    const shown = open ? vr.items : vr.items.slice(0, 5)
    const hiddenLoaded = vr.items.length - 5
    const sevData: Datum[] = vr.bySeverity
        .slice()
        .sort((a, b) => sevRank(a.label) - sevRank(b.label))
        .map((s) => ({ label: sevLabel(s.label), value: s.count, color: sevColor(s.label) }))
    return (
        <div className="sol acc-vermelho">
            <div className="sol-hd">
                <div>
                    <div className="sol-ttl">Vulnerabilidades</div>
                    <div className="sol-sub">Vulnerable Items por severidade</div>
                </div>
                <div className="sol-kpi">{vr.total}</div>
            </div>

            {sevData.length ? (
                <DistBars data={sevData} />
            ) : (
                <div className="sol-chips">
                    <span className="chip muted">Sem vulnerabilidades no filtro</span>
                </div>
            )}

            <ul className="sol-list">
                {shown.length ? (
                    shown.map((it) => (
                        <li
                            key={it.sys_id}
                            onClick={() => it.deeplink && it.deeplink !== '#' && window.open(it.deeplink, '_blank')}
                            title="Abrir registro"
                        >
                            <span className="dot p1" style={{ background: sevColor(it.severity) }} />
                            <span className="li-id">{it.number}</span>
                            <span className="li-ds">{it.short_description}</span>
                            <span className="li-who">{it.assigned_to || it.assignment_group || '—'}</span>
                        </li>
                    ))
                ) : (
                    <li className="empty">Nenhum item para mostrar</li>
                )}
            </ul>

            {vr.items.length > 5 ? (
                <button className="sol-toggle" onClick={() => setOpen((v) => !v)}>
                    {open ? 'Ver menos' : `Ver todos (${hiddenLoaded})`}
                </button>
            ) : null}

            <div className="sol-foot">
                <button className="ws-btn" onClick={() => window.open(vr.consoleUrl, '_blank')}>
                    Abrir no {vr.consoleLabel} ↗
                </button>
            </div>
        </div>
    )
}

export function PrincipalView({ scope, vis }: { scope: ScopeMode; vis: Visibility }) {
    const [data, setData] = useState<ConsoleData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [layout, setLayout] = useState<Layout>('grid')

    useEffect(() => {
        let alive = true
        setLoading(true)
        setError('')
        fetchConsole(scope, '')
            .then((d) => alive && setData(d))
            .catch((e) => alive && setError(String(e?.message || e)))
            .finally(() => alive && setLoading(false))
        return () => {
            alive = false
        }
    }, [scope])

    // Soluções filtradas pela engrenagem: cada card mantém só os tipos/itens visíveis,
    // recomputando o total. Cards sem nenhum tipo visível são omitidos.
    const solutions = useMemo(() => {
        if (!data) return [] as ConsoleSolution[]
        return data.solutions
            .map((s) => {
                const byType = s.byType.filter((t) => vis.isVisible(t.table))
                const items = s.items.filter((it) => vis.isVisible(it.table))
                const total = byType.reduce((a, t) => a + t.count, 0)
                return { ...s, byType, items, total }
            })
            .filter((s) => s.byType.length > 0)
    }, [data, vis])

    const total = solutions.reduce((a, s) => a + s.total, 0)
    const vrVisible = vis.isVisible(VR_VIS)

    // 1) Tipos de registros — donut com TODOS os tipos apresentados ao usuário,
    //    incluindo Vulnerabilidades (que não são task) quando o card VR está visível.
    const typeData: Datum[] = useMemo(() => {
        const items = solutions.flatMap((s) => s.byType).map((t) => ({ label: t.label, value: t.count }))
        if (data && data.vr && vrVisible && data.vr.total) {
            items.push({ label: 'Vulnerabilidades', value: data.vr.total })
        }
        return items
            .sort((a, b) => b.value - a.value)
            .map((t, i) => ({ ...t, color: PALETTE[i % PALETTE.length] }))
    }, [solutions, data, vrVisible])

    // 2) Registros não atribuídos — donut por criticidade UNIFICADA dos registros
    //    sem assigned_to. Tarefas (priority, respeitando a engrenagem) + Vulnerabilidades
    //    (risk_rating, agregadas no servidor), mapeadas para a mesma escala.
    const unassignedData: Datum[] = useMemo(() => {
        const byBucket: Record<string, number> = {}
        solutions.forEach((s) => s.items.forEach((it) => {
            if (!it.assigned_to) {
                const k = priBucket(it.priority)
                byBucket[k] = (byBucket[k] || 0) + 1
            }
        }))
        if (data && data.vr && vrVisible && data.vr.unassignedBySeverity) {
            data.vr.unassignedBySeverity.forEach((s) => {
                const k = sevBucket(s.label)
                byBucket[k] = (byBucket[k] || 0) + s.count
            })
        }
        return ['1', '2', '3', '4', '5']
            .map((k) => ({ label: CRIT_LABEL[k], value: byBucket[k] || 0, color: CRIT_COLOR[k] }))
            .filter((d) => d.value > 0)
    }, [solutions, data, vrVisible])

    // 3) Status das histórias — barras horizontais; vazio se "Stories" estiver desligado.
    const storyVisible = vis.isVisible('rm_story')
    const storyData: Datum[] = useMemo(() => {
        if (!data || !storyVisible) return []
        return data.storyStatus.map((s, i) => ({ label: s.label, value: s.count, color: PALETTE[i % PALETTE.length] }))
    }, [data, storyVisible])

    // 4) Aprovações pendentes do usuário — donut por tipo do registro aprovado.
    //    É pessoal (não depende da engrenagem nem do escopo).
    const approvalsData: Datum[] = useMemo(() => {
        if (!data || !data.approvals) return []
        const bt = data.approvals.byType
        if (bt.length) return bt.map((t, i) => ({ label: t.label, value: t.count, color: PALETTE[i % PALETTE.length] }))
        if (data.approvals.total) return [{ label: 'Aprovações', value: data.approvals.total, color: C.azul }]
        return []
    }, [data])

    return (
        <div className="principal-view" style={{ padding: '4px 24px 24px' }}>
            <div className="principal-bar">
                <div className="principal-lead">
                    {loading ? 'Carregando…' : error ? '' : `${total} registro(s) consolidados por solução`}
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
            </div>
            {error ? <div className="app-error">Falha ao carregar: {error}</div> : null}

            {data ? (
                <>
                    <div
                        className="charts"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: 16,
                            marginBottom: 18,
                        }}
                    >
                        <Donut title="Tipos de registros" data={typeData} />
                        <Donut title="Registros sem dono" data={unassignedData} />
                        <HBarChart title="Status das histórias" data={storyData} />
                        <Donut title="Aprovações Pendentes" data={approvalsData} unit="APROVAÇÕES" />
                    </div>

                    <div className={`sol-grid${layout === 'stack' ? ' stacked' : ''}`}>
                        {solutions.map((s) => (
                            <SolutionCard key={s.key} s={s} />
                        ))}
                        {vrVisible && data.vr ? <VrCard vr={data.vr} /> : null}
                    </div>
                </>
            ) : null}
        </div>
    )
}
