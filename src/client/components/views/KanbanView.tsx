import React, { useMemo, useState } from 'react'
import { filterItems, visibleByType } from '../../shared/derive'
import type { InboxItem } from '../../shared/api'
import { openItem, prioClass, type ViewProps } from './common'

type GroupMode = 'prio' | 'type'

interface Column {
    id: string
    label: string
    accent: string
    items: InboxItem[]
}

const PRIO_COLUMNS: Array<{ id: string; label: string; accent: string }> = [
    { id: 'p1', label: 'Crítica', accent: 'vermelho' },
    { id: 'p2', label: 'Alta', accent: 'laranja' },
    { id: 'p3', label: 'Moderada', accent: 'azul' },
    { id: 'p4', label: 'Baixa / Outros', accent: 'cinza' },
]

// Visão "Kanban Operacional": registros em colunas, cada card é clicável.
// Agrupa por prioridade (padrão) ou por tipo de registro.
export function KanbanView({ summary, vis, items, loadingList, lens }: ViewProps) {
    const [groupBy, setGroupBy] = useState<GroupMode>('prio')
    const shown = useMemo(() => filterItems(items, lens, vis), [items, lens, vis])

    const columns: Column[] = useMemo(() => {
        if (groupBy === 'prio') {
            return PRIO_COLUMNS.map((c) => ({
                ...c,
                items: shown.filter((it) => prioClass(it.priority) === c.id),
            }))
        }
        // por tipo: uma coluna por tipo de registro visível que tenha itens
        return visibleByType(summary, vis)
            .map((t) => ({
                id: t.table,
                label: t.label,
                accent: 'azul',
                items: shown.filter((it) => it.table === t.table),
            }))
            .filter((c) => c.items.length > 0)
    }, [groupBy, shown, summary, vis])

    return (
        <div className="kanban">
            <div className="kanban-bar">
                <span className="kanban-bar-label">Agrupar por</span>
                <div className="seg">
                    <button className={groupBy === 'prio' ? 'is-on' : ''} onClick={() => setGroupBy('prio')}>
                        Prioridade
                    </button>
                    <button className={groupBy === 'type' ? 'is-on' : ''} onClick={() => setGroupBy('type')}>
                        Tipo
                    </button>
                </div>
                <span className="kanban-bar-count">{shown.length} registro(s)</span>
            </div>

            {loadingList ? (
                <div className="inbox-state">Carregando o quadro…</div>
            ) : (
                <div className="kanban-board">
                    {columns.map((col) => (
                        <div key={col.id} className="kb-col">
                            <header className={`kb-col-head acc-${col.accent}`}>
                                <span className="kb-col-title">{col.label}</span>
                                <span className="kb-col-count">{col.items.length}</span>
                            </header>
                            <div className="kb-col-body">
                                {col.items.length === 0 ? (
                                    <div className="kb-empty">—</div>
                                ) : (
                                    col.items.map((it) => (
                                        <article
                                            key={it.sys_id}
                                            className="kb-card"
                                            onClick={() => openItem(it)}
                                            title="Abrir no workspace"
                                        >
                                            <div className="kb-card-top">
                                                <span className={`prio ${prioClass(it.priority)}`} aria-hidden />
                                                <span className="kb-card-number">{it.number}</span>
                                                <span className="row-product">{it.product}</span>
                                            </div>
                                            <div className="kb-card-desc">
                                                {it.short_description || '(sem descrição)'}
                                            </div>
                                            <div className="kb-card-meta">
                                                {it.type_label ? <span>{it.type_label}</span> : null}
                                                {it.state_label ? <span>· {it.state_label}</span> : null}
                                                {it.assigned_to ? <span>👤 {it.assigned_to}</span> : null}
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
