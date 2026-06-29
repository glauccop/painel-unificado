import React from 'react'

export type Accent = 'azul' | 'turquesa' | 'laranja' | 'vermelho'

interface Props {
    label: string
    value: string | number
    hint?: string
    accent: Accent
    active?: boolean
    onClick?: () => void
}

export function KpiCard({ label, value, hint, accent, active, onClick }: Props) {
    return (
        <button
            type="button"
            className={`kpi acc-${accent}${active ? ' is-active' : ''}`}
            onClick={onClick}
            disabled={!onClick}
        >
            <span className="kpi-value">{value}</span>
            <span className="kpi-label">{label}</span>
            {hint ? <span className="kpi-hint">{hint}</span> : null}
        </button>
    )
}
