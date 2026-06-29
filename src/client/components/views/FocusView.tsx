import React, { useMemo } from 'react'
import { Inbox } from '../Inbox'
import { Insights } from '../Insights'
import { KpiCard } from '../KpiCard'
import { buildLenses, filterItems, kpiEntries } from '../../shared/derive'
import type { ViewProps } from './common'

// Visão "Foco": faixa de KPIs + fila (inbox) + sidebar de insights.
export function FocusView({ summary, vis, template, items, loadingList, lens, onLens }: ViewProps) {
    const kpis = useMemo(() => kpiEntries(template.kpis, summary, vis), [template, summary, vis])
    const lenses = useMemo(() => buildLenses(summary, vis), [summary, vis])
    const shown = useMemo(() => filterItems(items, lens, vis), [items, lens, vis])

    return (
        <>
            <div className="kpi-strip">
                {kpis.map(({ key, def, value }) => (
                    <KpiCard
                        key={key}
                        label={def.label}
                        value={value}
                        hint={def.hint}
                        accent={def.accent}
                        active={lens === def.lens}
                        onClick={() => onLens(def.lens)}
                    />
                ))}
            </div>

            <div className="app-body">
                <main className="app-main">
                    <Inbox items={shown} loading={loadingList} lens={lens} lenses={lenses} onLens={onLens} />
                </main>
                <Insights template={template} summary={summary} onLens={onLens} vis={vis} />
            </div>
        </>
    )
}
