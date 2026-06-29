import React from 'react'
import type { InboxItem } from '../shared/api'

export interface Lens {
    id: string
    label: string
    count?: number
}

interface Props {
    items: InboxItem[]
    loading: boolean
    lens: string
    lenses: Lens[]
    onLens: (l: string) => void
}

function prioClass(p: string): string {
    switch (p) {
        case '1':
            return 'p1'
        case '2':
            return 'p2'
        case '3':
            return 'p3'
        default:
            return 'p4'
    }
}

function open(item: InboxItem) {
    if (item.deeplink && item.deeplink !== '#') window.open(item.deeplink, '_blank')
}

export function Inbox({ items, loading, lens, lenses, onLens }: Props) {
    return (
        <div className="inbox">
            <div className="inbox-lenses">
                {lenses.map((l) => (
                    <button
                        key={l.id}
                        className={`chip${lens === l.id ? ' is-on' : ''}`}
                        onClick={() => onLens(l.id)}
                    >
                        {l.label}
                        {typeof l.count === 'number' ? <span className="chip-count">{l.count}</span> : null}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="inbox-state">Carregando sua fila…</div>
            ) : items.length === 0 ? (
                <div className="inbox-state">Nada por aqui. Você está em dia. ✦</div>
            ) : (
                <ul className="inbox-list">
                    {items.map((it) => (
                        <li key={it.sys_id} className="inbox-row" onClick={() => open(it)} title="Abrir no workspace">
                            <span className={`prio ${prioClass(it.priority)}`} aria-hidden />
                            <div className="row-main">
                                <div className="row-top">
                                    <span className="row-number">{it.number}</span>
                                    <span className="row-type">{it.type_label}</span>
                                    <span className="row-product">{it.product}</span>
                                </div>
                                <div className="row-desc">{it.short_description || '(sem descrição)'}</div>
                                <div className="row-meta">
                                    {it.state_label ? <span>{it.state_label}</span> : null}
                                    {it.assigned_to ? <span>👤 {it.assigned_to}</span> : null}
                                    {it.assignment_group ? <span>◷ {it.assignment_group}</span> : null}
                                    {it.updated ? <span>{it.updated}</span> : null}
                                </div>
                            </div>
                            <span className="row-open" aria-hidden>
                                ↗
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
