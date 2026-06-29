import React from 'react'
import { VIEWS, type ViewMode } from '../shared/views'

interface Props {
    mode: ViewMode
    onMode: (m: ViewMode) => void
}

export function ViewSwitcher({ mode, onMode }: Props) {
    return (
        <div className="view-switcher" role="tablist" aria-label="Tipo de visão">
            {VIEWS.map((v) => (
                <button
                    key={v.id}
                    role="tab"
                    aria-selected={mode === v.id}
                    className={`view-tab${mode === v.id ? ' is-on' : ''}`}
                    title={v.hint}
                    onClick={() => onMode(v.id)}
                >
                    <span className="view-tab-icon" aria-hidden>{v.icon}</span>
                    <span className="view-tab-label">{v.label}</span>
                </button>
            ))}
        </div>
    )
}
