import React from 'react'
import type { LabeledCount } from '../shared/api'

interface Props {
    data: LabeledCount[]
    accent?: 'azul' | 'turquesa' | 'laranja'
    onBar?: (item: LabeledCount) => void
    emptyText?: string
}

// Barras horizontais leves (sem dependência de lib de chart).
export function Bars({ data, accent = 'azul', onBar, emptyText = 'Sem dados' }: Props) {
    if (!data || data.length === 0) return <div className="empty">{emptyText}</div>
    const max = Math.max(...data.map((d) => d.count), 1)
    return (
        <div className="bars">
            {data.map((d, i) => (
                <div
                    key={d.key || d.label || i}
                    className={`bar-row${onBar ? ' clickable' : ''}`}
                    onClick={onBar ? () => onBar(d) : undefined}
                >
                    <span className="bar-label" title={d.label}>
                        {d.label || '—'}
                    </span>
                    <span className="bar-track">
                        <span className={`bar-fill fill-${accent}`} style={{ width: `${(d.count / max) * 100}%` }} />
                    </span>
                    <span className="bar-count">{d.count}</span>
                </div>
            ))}
        </div>
    )
}
