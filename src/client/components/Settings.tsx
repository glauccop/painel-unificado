import React, { useMemo, useState } from 'react'
import type { Summary } from '../shared/api'
import type { Visibility } from '../shared/visibility'

interface Props {
    summary: Summary | null
    vis: Visibility
}

interface Entry {
    id: string
    label: string
    category: string
    count: number
}

// Ordem fixa das categorias na engrenagem.
const CATEGORY_ORDER = ['ITSM', 'SPM', 'VR']
const CATEGORY_LABEL: Record<string, string> = {
    ITSM: 'ITSM',
    SPM: 'SPM — Projetos, Demandas e Agile/SAFe',
    VR: 'VR — Vulnerability Response',
}

// Engrenagem de configuração: liga/desliga quais tipos de registro aparecem.
// Lista todas as tabelas herdadas de task (em uso na instância) + tabelas VR,
// categorizadas em ITSM / SPM / VR / Plataforma.
export function Settings({ summary, vis }: Props) {
    const [open, setOpen] = useState(false)

    const groups = useMemo(() => {
        if (!summary) return [] as Array<{ category: string; entries: Entry[] }>
        const entries: Entry[] = summary.taskTypes.map((t) => ({
            id: t.table,
            label: t.label,
            category: t.category,
            count: t.count,
        }))

        const byCategory = new Map<string, Entry[]>()
        for (const e of entries) {
            const arr = byCategory.get(e.category) || []
            arr.push(e)
            byCategory.set(e.category, arr)
        }
        const orderIdx = (c: string) => {
            const i = CATEGORY_ORDER.indexOf(c)
            return i < 0 ? CATEGORY_ORDER.length : i
        }
        return [...byCategory.entries()]
            .sort((a, b) => orderIdx(a[0]) - orderIdx(b[0]))
            .map(([category, list]) => ({
                category,
                entries: list.sort((a, b) => b.count - a.count),
            }))
    }, [summary])

    const total = groups.reduce((a, g) => a + g.entries.length, 0)
    const visibleCount = total - vis.hidden.size

    return (
        <div className="settings">
            <button
                type="button"
                className={`gear${vis.hiddenCount > 0 ? ' has-filter' : ''}`}
                aria-label="Configurar tipos visíveis"
                title="Configurar tipos de registro visíveis"
                onClick={() => setOpen((o) => !o)}
            >
                <span className="gear-icon" aria-hidden>⚙</span>
                {vis.hiddenCount > 0 ? <span className="gear-badge">{vis.hiddenCount}</span> : null}
            </button>

            {open ? (
                <>
                    <div className="settings-backdrop" onClick={() => setOpen(false)} />
                    <div className="settings-panel" role="dialog" aria-label="Tipos de registro">
                        <header className="settings-head">
                            <div>
                                <strong>Tipos de registro</strong>
                                <span className="settings-sub">
                                    {visibleCount} de {total} visíveis
                                </span>
                            </div>
                            <button className="settings-all" onClick={vis.showAll} disabled={vis.hiddenCount === 0}>
                                Mostrar tudo
                            </button>
                        </header>

                        <div className="settings-body">
                            {groups.length === 0 ? (
                                <div className="settings-empty">Carregando…</div>
                            ) : (
                                groups.map((g) => (
                                    <div key={g.category} className="settings-group">
                                        <div className="settings-group-title">{CATEGORY_LABEL[g.category] || g.category}</div>
                                        {g.entries.map((e) => {
                                            const on = vis.isVisible(e.id)
                                            return (
                                                <label key={e.id} className={`settings-row${on ? '' : ' is-off'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={on}
                                                        onChange={() => vis.toggle(e.id)}
                                                    />
                                                    <span className="settings-switch" aria-hidden />
                                                    <span className="settings-label">{e.label}</span>
                                                    <span className="settings-count">{e.count}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                        <footer className="settings-foot">
                            Sua escolha fica salva neste navegador.
                        </footer>
                    </div>
                </>
            ) : null}
        </div>
    )
}
