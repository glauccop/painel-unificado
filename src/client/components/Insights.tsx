import React from 'react'
import { Bars } from './Bars'
import type { Summary, LabeledCount } from '../shared/api'
import type { InsightKey, PersonaTemplate } from '../shared/templates'
import type { Visibility } from '../shared/visibility'
import { VULN_ID, visibleByType, visiblePriority, visibleAging, visibleByAssignee, visibleThroughput } from '../shared/derive'

interface Props {
    template: PersonaTemplate
    summary: Summary
    onLens: (lens: string) => void
    vis: Visibility
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="panel">
            <h3 className="panel-title">{title}</h3>
            {children}
        </section>
    )
}

export function Insights({ template, summary, onLens, vis }: Props) {
    const blocks: React.ReactNode[] = []

    for (const key of template.insights as InsightKey[]) {
        if (key === 'byType') {
            const data: LabeledCount[] = visibleByType(summary, vis).map((t) => ({
                key: t.table,
                label: t.label,
                count: t.count,
            }))
            blocks.push(
                <Panel key="byType" title="Por tipo de registro">
                    <Bars data={data} accent="azul" onBar={(d) => d.key && onLens(d.key)} emptyText="Nada atribuído" />
                </Panel>,
            )
        } else if (key === 'byPriority') {
            blocks.push(
                <Panel key="byPriority" title="Por prioridade">
                    <Bars data={visiblePriority(summary, vis)} accent="laranja" emptyText="Sem dados" />
                </Panel>,
            )
        } else if (key === 'aging') {
            blocks.push(
                <Panel key="aging" title="Idade das pendências">
                    <Bars data={visibleAging(summary, vis)} accent="turquesa" emptyText="Sem pendências" />
                </Panel>,
            )
        } else if (key === 'team_load' && summary.team) {
            blocks.push(
                <Panel key="team_load" title="Carga por responsável (time)">
                    <Bars data={visibleByAssignee(summary, vis)} accent="azul" emptyText="Sem dados do time" />
                </Panel>,
            )
        } else if (key === 'throughput' && summary.team) {
            const thr = visibleThroughput(summary, vis)
            blocks.push(
                <Panel key="throughput" title="Throughput (7 dias)">
                    <div className="throughput">
                        <div className="thr-stat">
                            <span className="thr-num thr-in">{thr.opened}</span>
                            <span className="thr-cap">Abertos</span>
                        </div>
                        <div className="thr-stat">
                            <span className="thr-num thr-out">{thr.closed}</span>
                            <span className="thr-cap">Fechados</span>
                        </div>
                        <div className="thr-stat">
                            <span className="thr-num">{thr.saldo}</span>
                            <span className="thr-cap">Saldo</span>
                        </div>
                    </div>
                </Panel>,
            )
        }
    }

    // Severidade de vulnerabilidades — mostra quando há itens e o tipo está visível
    if (summary.vuln && summary.vuln.by_severity.length > 0 && vis.isVisible(VULN_ID)) {
        blocks.push(
            <Panel key="vuln" title="Vulnerabilidades por severidade">
                <Bars data={summary.vuln.by_severity} accent="laranja" onBar={() => onLens('vuln')} />
            </Panel>,
        )
    }

    return <aside className="insights">{blocks}</aside>
}
