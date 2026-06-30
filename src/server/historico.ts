import { ScopeMode, scopeClause, withScope } from './identity.ts'
import { groupBy2 } from './aggregations/util.ts'
import { typeMeta } from './catalog.ts'

// Aba "Histórico" — construção progressiva.
// Card 1: tipos de registros FECHADOS (Closed) no escopo do filtro geral
// (meus / meu time / todos). "Fechado" = active=false e state cujo rótulo NÃO é "cancel".

function guard<T>(fn: () => T, fallback: T): T {
    try {
        return fn()
    } catch (e) {
        return fallback
    }
}

function isCancelled(stateLabel: string): boolean {
    return (stateLabel || '').toLowerCase().indexOf('cancel') >= 0
}

export interface HistoricoTypeRow {
    table: string
    label: string
    closed: number
}

// days = '' (Todos) ou '7'|'14'|'30'|'60' — janela por sys_updated_on (closed_at vem vazio).
export function buildHistorico(mode: ScopeMode, days: string = '') {
    let closedScope = withScope(scopeClause(mode), 'active=false')
    const n = parseInt(days, 10)
    // RELATIVE@day@ago não casa nesta instância; gs.daysAgoStart(N) funciona.
    if (n > 0) closedScope = withScope(closedScope, 'sys_updated_on>=javascript:gs.daysAgoStart(' + n + ')')

    // Fechados por tipo. groupBy2 A=state (display p/ classificar), B=sys_class_name.
    const byType = guard(
        () => {
            const map = new Map<string, HistoricoTypeRow>()
            groupBy2('task', 'state', 'sys_class_name', closedScope).forEach((r) => {
                if (isCancelled(r.aLabel)) return // só fechados
                const cls = r.b || 'task'
                let e = map.get(cls)
                if (!e) {
                    e = { table: cls, label: typeMeta(cls).label, closed: 0 }
                    map.set(cls, e)
                }
                e.closed += r.count
            })
            return [...map.values()].filter((e) => e.closed > 0).sort((a, b) => b.closed - a.closed)
        },
        [] as HistoricoTypeRow[],
    )

    return { scope: mode, byType }
}
