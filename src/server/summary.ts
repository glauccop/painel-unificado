import { countWhere, groupBy, groupBy2, type Group2Row } from './aggregations/util.ts'
import { ScopeMode, scopeClause, withScope, currentUserId, currentUserName, myGroupIds } from './identity.ts'
import { typeMeta, GEAR_TABLES } from './catalog.ts'

function guard<T>(fn: () => T, fallback: T): T {
    try {
        return fn()
    } catch (e) {
        return fallback
    }
}

// Mapa classe -> contagem, a partir de um groupBy por sys_class_name.
function classMapOf(rows: Array<{ key: string; count: number }>): Record<string, number> {
    const m: Record<string, number> = {}
    rows.forEach((r) => (m[r.key] = (m[r.key] || 0) + r.count))
    return m
}

// Agrupa Group2Row[] (A x sys_class_name) por A, mantendo count total e a quebra
// por classe (byClass) — o cliente colapsa byClass pelas classes visíveis na engrenagem.
function byAWithClass(
    rows: Group2Row[],
): Array<{ key: string; label: string; count: number; byClass: Record<string, number> }> {
    const map = new Map<string, { key: string; label: string; count: number; byClass: Record<string, number> }>()
    for (const r of rows) {
        let e = map.get(r.a)
        if (!e) {
            e = { key: r.a, label: r.aLabel, count: 0, byClass: {} }
            map.set(r.a, e)
        }
        e.count += r.count
        e.byClass[r.b] = (e.byClass[r.b] || 0) + r.count
    }
    return [...map.values()]
}

// Sintaxe RELATIVE de encoded query (independe de gs):
// GT@day@ago@N  = data mais recente que N dias atrás (dentro dos últimos N dias)
// LT@day@ago@N  = data mais antiga que N dias atrás
const olderThan = (field: string, days: number) => `${field}RELATIVELT@day@ago@${days}`
const withinDays = (field: string, days: number) => `${field}RELATIVEGT@day@ago@${days}`

export function buildSummary(mode: ScopeMode) {
    const me = currentUserId()
    const scope = scopeClause(mode)
    const openScope = withScope(scope, 'active=true')

    // Contagens por tipo (toda a hierarquia de task numa só query)
    const byTypeRaw = guard(() => groupBy('task', 'sys_class_name', openScope), [])
    const byType = byTypeRaw
        .map((r) => {
            const m = typeMeta(r.key, r.label)
            return { table: r.key, label: m.label, product: m.product, count: r.count }
        })
        .sort((a, b) => b.count - a.count)
    const open_total = byTypeRaw.reduce((a, r) => a + r.count, 0)

    // Tipos da engrenagem: lista EXPLÍCITA (GEAR_TABLES), com contagem por tabela no escopo.
    const taskTypes = GEAR_TABLES.map((g) => ({
        table: g.table,
        label: typeMeta(g.table).label,
        category: g.category,
        count: guard(() => countWhere(g.table, withScope(scopeClause(mode), 'active=true')), 0),
    }))

    // Por prioridade — com quebra por classe (byClass) para o Foco respeitar a engrenagem.
    const byPriority = guard(() => byAWithClass(groupBy2('task', 'priority', 'sys_class_name', openScope)), [])

    // Aging por idade de criação dos registros abertos — cada balde traz byClass.
    const agingBuckets: Array<{ label: string; clauses: string[] }> = [
        { label: '0–3 dias', clauses: [withinDays('sys_created_on', 3)] },
        { label: '3–7 dias', clauses: [olderThan('sys_created_on', 3), withinDays('sys_created_on', 7)] },
        { label: '7+ dias', clauses: [olderThan('sys_created_on', 7)] },
    ]
    const aging = agingBuckets.map((b) => {
        const byClass = guard(
            () => classMapOf(groupBy('task', 'sys_class_name', withScope(openScope, ...b.clauses))),
            {} as Record<string, number>,
        )
        const count = Object.keys(byClass).reduce((a, k) => a + byClass[k], 0)
        return { label: b.label, count, byClass }
    })

    // SLA estourado — dot-walk no task_sla, com quebra por classe do task.
    const slaScope = scopeClause(mode, { assigned: 'task.assigned_to', group: 'task.assignment_group' })
    const overdueRows = guard(
        () => groupBy('task_sla', 'task.sys_class_name', withScope(slaScope, 'active=true', 'has_breached=true')),
        [],
    )
    const overdue_sla_by_class = classMapOf(overdueRows)
    const overdue_sla = overdueRows.reduce((a, r) => a + r.count, 0)

    // Vulnerabilidades (sn_vul_vulnerable_item — não herda de task)
    const vulnScope = scopeClause(mode)
    const vulnOpen = withScope(vulnScope, 'active=true')
    const vuln = guard(
        () => ({
            open: countWhere('sn_vul_vulnerable_item', vulnOpen),
            by_severity: groupBy('sn_vul_vulnerable_item', 'risk_rating', vulnOpen).map((r) => ({
                label: r.label || r.key,
                count: r.count,
            })),
        }),
        { open: 0, by_severity: [] as Array<{ label: string; count: number }> },
    )

    // Aprovações pendentes para mim (sysapproval_approver — não é task)
    const approvals_pending = guard(() => countWhere('sysapproval_approver', `approver=${me}^state=requested`), 0)

    // Visão de time (quando team/both)
    let team: any = null
    if (mode !== 'mine') {
        const teamScope = scopeClause('team')
        const teamOpen = withScope(teamScope, 'active=true')
        const opened7dByClass = guard(
            () => classMapOf(groupBy('task', 'sys_class_name', withScope(teamScope, withinDays('sys_created_on', 7)))),
            {} as Record<string, number>,
        )
        const closed7dByClass = guard(
            () =>
                classMapOf(groupBy('task', 'sys_class_name', withScope(teamScope, 'active=false', withinDays('closed_at', 7)))),
            {} as Record<string, number>,
        )
        const sumMap = (m: Record<string, number>) => Object.keys(m).reduce((a, k) => a + m[k], 0)
        team = {
            by_assignee: guard(
                () =>
                    byAWithClass(groupBy2('task', 'assigned_to', 'sys_class_name', teamOpen))
                        .map((e) => ({ ...e, label: e.label || 'Sem responsável' }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10),
                [],
            ),
            opened_7d: sumMap(opened7dByClass),
            closed_7d: sumMap(closed7dByClass),
            opened_7d_by_class: opened7dByClass,
            closed_7d_by_class: closed7dByClass,
        }
    }

    return {
        user: { id: me, name: currentUserName() },
        scope: mode,
        groups: myGroupIds().length,
        kpis: {
            open_total,
            awaiting_you: approvals_pending,
            overdue_sla,
            vuln_open: vuln.open,
        },
        byType,
        taskTypes,
        byPriority,
        aging,
        aging_total: aging.reduce((a, r) => a + r.count, 0),
        overdue_sla_by_class,
        vuln,
        approvals_pending,
        team,
    }
}
