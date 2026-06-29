import type { Accent } from '../components/KpiCard'
import type { InboxItem, Summary, TypeCount, LabeledCount } from './api'
import type { Lens } from '../components/Inbox'
import type { Visibility } from './visibility'

// IDs especiais de visibilidade (não são sys_class_name)
// VULN_ID continua sendo o id da LENTE da inbox ('vuln'); a VISIBILIDADE das
// vulnerabilidades passa a ser controlada pela tabela real (mesmo toggle do card VR).
export const VULN_ID = 'vuln'
export const VULN_VIS = 'sn_vul_vulnerable_item'
export const APPROVALS_ID = 'approvals'

export interface KpiDef {
    label: string
    accent: Accent
    lens: string
    hint: string
    // qual chave de visibilidade controla este KPI (undefined = sempre visível)
    feature?: string
}

export const KPI_DEFS: Record<string, KpiDef> = {
    open_total: { label: 'Em aberto', accent: 'azul', lens: 'all', hint: 'você + seu time' },
    awaiting_you: { label: 'Aguardando você', accent: 'turquesa', lens: 'approvals', hint: 'aprovações pendentes', feature: APPROVALS_ID },
    overdue_sla: { label: 'SLA estourado', accent: 'vermelho', lens: 'all', hint: 'fora do prazo' },
    vuln_open: { label: 'Vulnerabilidades', accent: 'laranja', lens: 'vuln', hint: 'itens em aberto', feature: VULN_VIS },
}

export interface KpiEntry {
    key: string
    def: KpiDef
    value: number
}

// Tipos visíveis (sys_class_name habilitados pelo usuário)
export function visibleByType(summary: Summary, vis: Visibility): TypeCount[] {
    return summary.byType.filter((t) => vis.isVisible(t.table))
}

// Total em aberto recalculado a partir dos tipos visíveis
export function visibleOpenTotal(summary: Summary, vis: Visibility): number {
    return visibleByType(summary, vis).reduce((a, t) => a + t.count, 0)
}

// Colapsa um mapa { sys_class_name: count } somando só as classes visíveis na engrenagem.
export function collapseByClass(byClass: Record<string, number> | undefined, vis: Visibility): number {
    if (!byClass) return 0
    let sum = 0
    for (const cls of Object.keys(byClass)) if (vis.isVisible(cls)) sum += byClass[cls]
    return sum
}

export function kpiValue(key: string, summary: Summary, vis: Visibility): number {
    if (key === 'open_total') return visibleOpenTotal(summary, vis)
    if (key === 'vuln_open') return vis.isVisible(VULN_VIS) ? summary.kpis.vuln_open : 0
    if (key === 'awaiting_you') return vis.isVisible(APPROVALS_ID) ? summary.kpis.awaiting_you : 0
    if (key === 'overdue_sla') return collapseByClass(summary.overdue_sla_by_class, vis)
    return (summary.kpis as any)[key] ?? 0
}

// Insights da aba Foco recalculados pelas classes visíveis (byClass colapsado).
// Cada entrada mantém label/key; o count passa a contar só os tipos ligados.
function withVisibleCount(rows: LabeledCount[], vis: Visibility): LabeledCount[] {
    return rows
        .map((r) => ({ ...r, count: collapseByClass(r.byClass, vis) }))
        .filter((r) => r.count > 0)
}

export function visiblePriority(summary: Summary, vis: Visibility): LabeledCount[] {
    return withVisibleCount(summary.byPriority, vis)
}

export function visibleAging(summary: Summary, vis: Visibility): LabeledCount[] {
    // Mantém os 3 baldes (mesmo zerados) para preservar a ordem/escala do gráfico.
    return summary.aging.map((r) => ({ ...r, count: collapseByClass(r.byClass, vis) }))
}

export function visibleByAssignee(summary: Summary, vis: Visibility): LabeledCount[] {
    if (!summary.team) return []
    return withVisibleCount(summary.team.by_assignee, vis).sort((a, b) => b.count - a.count)
}

export interface Throughput {
    opened: number
    closed: number
    saldo: number
}
export function visibleThroughput(summary: Summary, vis: Visibility): Throughput {
    if (!summary.team) return { opened: 0, closed: 0, saldo: 0 }
    const opened = collapseByClass(summary.team.opened_7d_by_class, vis)
    const closed = collapseByClass(summary.team.closed_7d_by_class, vis)
    return { opened, closed, saldo: closed - opened }
}

// Lista de KPIs de um template, já filtrada pela visibilidade
export function kpiEntries(keys: string[], summary: Summary, vis: Visibility): KpiEntry[] {
    const out: KpiEntry[] = []
    for (const key of keys) {
        const def = KPI_DEFS[key]
        if (!def) continue
        if (def.feature && !vis.isVisible(def.feature)) continue
        out.push({ key, def, value: kpiValue(key, summary, vis) })
    }
    return out
}

// Lentes da inbox, respeitando a visibilidade
export function buildLenses(summary: Summary, vis: Visibility): Lens[] {
    const out: Lens[] = [{ id: 'all', label: 'Todos', count: visibleOpenTotal(summary, vis) }]
    visibleByType(summary, vis)
        .slice(0, 8)
        .forEach((t) => out.push({ id: t.table, label: t.label, count: t.count }))
    if (summary.vuln.open > 0 && vis.isVisible(VULN_VIS))
        out.push({ id: 'vuln', label: 'Vulnerabilidades', count: summary.vuln.open })
    if (summary.approvals_pending > 0 && vis.isVisible(APPROVALS_ID))
        out.push({ id: 'approvals', label: 'Aprovações', count: summary.approvals_pending })
    return out
}

// Itens da inbox: oculta os de tipos desligados (lentes vuln/approvals não filtram por tabela)
export function filterItems(items: InboxItem[], lens: string, vis: Visibility): InboxItem[] {
    if (lens === VULN_ID || lens === APPROVALS_ID) return items
    return items.filter((it) => vis.isVisible(it.table))
}
