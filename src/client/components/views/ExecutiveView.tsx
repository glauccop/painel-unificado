import React, { useMemo } from 'react'
import { Bars } from '../Bars'
import { kpiValue, visibleByType, VULN_ID, APPROVALS_ID } from '../../shared/derive'
import type { ViewProps } from './common'

type Health = { tone: 'ok' | 'warn' | 'crit'; emoji: string; label: string; note: string }

function healthOf(overdue: number, vulnOpen: number): Health {
    if (overdue >= 10) return { tone: 'crit', emoji: '🔴', label: 'Crítico', note: `${overdue} SLAs estourados` }
    if (overdue > 0 || vulnOpen > 0)
        return {
            tone: 'warn',
            emoji: '🟡',
            label: 'Atenção',
            note: overdue > 0 ? `${overdue} SLA(s) fora do prazo` : `${vulnOpen} vulnerabilidade(s) abertas`,
        }
    return { tone: 'ok', emoji: '🟢', label: 'Saudável', note: 'Nenhum SLA estourado' }
}

// Visão "Resumo Executivo": uma tela, poucos números grandes, semáforo de saúde.
export function ExecutiveView({ summary, vis, onDrill }: ViewProps) {
    const openTotal = kpiValue('open_total', summary, vis)
    const overdue = kpiValue('overdue_sla', summary, vis)
    const vulnOpen = kpiValue('vuln_open', summary, vis)
    const awaiting = kpiValue('awaiting_you', summary, vis)
    const health = useMemo(() => healthOf(overdue, vulnOpen), [overdue, vulnOpen])

    const topTypes = useMemo(() => visibleByType(summary, vis).slice(0, 5), [summary, vis])
    const aging7 = summary.aging.find((a) => a.label?.startsWith('7') || (a as any).name?.startsWith('7'))
    const aging7count = (aging7 as any)?.count ?? 0
    const saldo = summary.team ? summary.team.closed_7d - summary.team.opened_7d : null

    const stats: Array<{ value: number; label: string; tone?: string; lens?: string }> = [
        { value: openTotal, label: 'Em aberto', lens: 'all' },
        { value: overdue, label: 'SLA estourado', tone: overdue > 0 ? 'crit' : undefined },
    ]
    if (vis.isVisible(VULN_ID)) stats.push({ value: vulnOpen, label: 'Vulnerabilidades', lens: 'vuln', tone: vulnOpen > 0 ? 'warn' : undefined })
    if (vis.isVisible(APPROVALS_ID)) stats.push({ value: awaiting, label: 'Aguardando você', lens: 'approvals' })

    return (
        <div className="exec">
            <section className={`exec-health tone-${health.tone}`}>
                <div className="exec-health-main">
                    <span className="exec-health-emoji">{health.emoji}</span>
                    <div>
                        <div className="exec-health-cap">Saúde geral da operação</div>
                        <div className="exec-health-label">{health.label}</div>
                    </div>
                </div>
                <div className="exec-health-note">{health.note}</div>
            </section>

            <section className="exec-stats">
                {stats.map((s) => (
                    <button
                        key={s.label}
                        className={`exec-stat${s.tone ? ' tone-' + s.tone : ''}${s.lens ? ' clickable' : ''}`}
                        onClick={s.lens ? () => onDrill(s.lens!) : undefined}
                        disabled={!s.lens}
                    >
                        <span className="exec-stat-value">{s.value}</span>
                        <span className="exec-stat-label">{s.label}</span>
                    </button>
                ))}
            </section>

            <section className="exec-lower">
                <div className="exec-panel">
                    <h3 className="panel-title">Distribuição por tipo</h3>
                    <Bars
                        data={topTypes.map((t) => ({ key: t.table, label: t.label, count: t.count }))}
                        accent="azul"
                        onBar={(d) => d.key && onDrill(d.key)}
                        emptyText="Nada visível"
                    />
                </div>

                <div className="exec-panel">
                    <h3 className="panel-title">Tendência (7 dias)</h3>
                    {summary.team ? (
                        <div className="throughput">
                            <div className="thr-stat">
                                <span className="thr-num thr-in">{summary.team.opened_7d}</span>
                                <span className="thr-cap">Abertos</span>
                            </div>
                            <div className="thr-stat">
                                <span className="thr-num thr-out">{summary.team.closed_7d}</span>
                                <span className="thr-cap">Fechados</span>
                            </div>
                            <div className="thr-stat">
                                <span className={`thr-num ${saldo !== null && saldo >= 0 ? 'thr-out' : ''}`}>
                                    {saldo !== null && saldo > 0 ? '+' : ''}
                                    {saldo}
                                </span>
                                <span className="thr-cap">Saldo</span>
                            </div>
                        </div>
                    ) : (
                        <div className="empty">Disponível nos escopos de time.</div>
                    )}
                    <div className="exec-mini">
                        <span className="exec-mini-num">{aging7count}</span>
                        <span className="exec-mini-cap">pendência(s) há mais de 7 dias</span>
                    </div>
                    <div className="exec-mini">
                        <span className="exec-mini-num">{summary.groups}</span>
                        <span className="exec-mini-cap">grupo(s) sob sua visão</span>
                    </div>
                </div>
            </section>
        </div>
    )
}
