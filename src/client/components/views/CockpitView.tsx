import React, { useMemo } from 'react'
import { Bars } from '../Bars'
import { KpiCard } from '../KpiCard'
import { buildLenses, kpiEntries, visibleByType, VULN_ID } from '../../shared/derive'
import type { LabeledCount } from '../../shared/api'
import type { ViewProps } from './common'

function Card({ title, span, children }: { title: string; span?: boolean; children: React.ReactNode }) {
    return (
        <section className={`ck-card${span ? ' ck-span' : ''}`}>
            <h3 className="ck-card-title">{title}</h3>
            {children}
        </section>
    )
}

// Visão "Cockpit Analítico": KPIs em destaque + parede de painéis/gráficos.
// Usa todos os indicadores disponíveis no summary, independente do template.
export function CockpitView({ summary, vis, onDrill }: ViewProps) {
    // No cockpit mostramos os 4 KPIs principais sempre que visíveis
    const kpis = useMemo(
        () => kpiEntries(['open_total', 'awaiting_you', 'overdue_sla', 'vuln_open'], summary, vis),
        [summary, vis],
    )
    const byType: LabeledCount[] = useMemo(
        () => visibleByType(summary, vis).map((t) => ({ key: t.table, label: t.label, count: t.count })),
        [summary, vis],
    )
    const lenses = buildLenses(summary, vis)

    return (
        <div className="cockpit">
            <div className="kpi-strip ck-kpis">
                {kpis.map(({ key, def, value }) => (
                    <KpiCard
                        key={key}
                        label={def.label}
                        value={value}
                        hint={def.hint}
                        accent={def.accent}
                        onClick={() => onDrill(def.lens)}
                    />
                ))}
            </div>

            <div className="ck-grid">
                <Card title="Por tipo de registro" span>
                    <Bars data={byType} accent="azul" onBar={(d) => d.key && onDrill(d.key)} emptyText="Nada visível" />
                </Card>

                <Card title="Por prioridade">
                    <Bars data={summary.byPriority} accent="laranja" emptyText="Sem dados" />
                </Card>

                <Card title="Idade das pendências">
                    <Bars data={summary.aging} accent="turquesa" emptyText="Sem pendências" />
                </Card>

                {summary.team ? (
                    <Card title="Carga por responsável (time)" span>
                        <Bars data={summary.team.by_assignee} accent="azul" emptyText="Sem dados do time" />
                    </Card>
                ) : null}

                {summary.team ? (
                    <Card title="Throughput (7 dias)">
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
                                <span className="thr-num">{summary.team.closed_7d - summary.team.opened_7d}</span>
                                <span className="thr-cap">Saldo</span>
                            </div>
                        </div>
                    </Card>
                ) : null}

                {vis.isVisible(VULN_ID) && summary.vuln.by_severity.length > 0 ? (
                    <Card title="Vulnerabilidades por severidade">
                        <Bars data={summary.vuln.by_severity} accent="laranja" onBar={() => onDrill('vuln')} />
                    </Card>
                ) : null}
            </div>

            <div className="ck-foot-lenses">
                {lenses.map((l) => (
                    <button key={l.id} className="chip" onClick={() => onDrill(l.id)}>
                        {l.label}
                        {typeof l.count === 'number' ? <span className="chip-count">{l.count}</span> : null}
                    </button>
                ))}
            </div>
        </div>
    )
}
