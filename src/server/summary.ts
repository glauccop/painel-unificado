import { countWhere, groupBy } from './aggregations/util.ts'
import { ScopeMode, scopeClause, withScope, currentUserId, currentUserName, myGroupIds } from './identity.ts'
import { typeMeta, categoryOf, type Category } from './catalog.ts'

// Tabelas VR (não herdam de task) que entram na engrenagem como categoria própria.
const VR_TABLES = ['sn_vul_vulnerable_item', 'sn_vul_app_vulnerable_item', 'sn_vul_vulnerability']

// A engrenagem só lista estas categorias (remove "Plataforma" e todo o ruído).
const GEAR_CATEGORIES: Category[] = ['ITSM', 'SPM', 'EAP', 'VR']

function guard<T>(fn: () => T, fallback: T): T {
    try {
        return fn()
    } catch (e) {
        return fallback
    }
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

    // Lista completa de tipos para a engrenagem: todos os tipos da hierarquia task COM registros
    // na instância (groupBy sem filtro) + tabelas VR, categorizados, com contagem no escopo.
    const scopeCount: Record<string, number> = {}
    byTypeRaw.forEach((r) => (scopeCount[r.key] = r.count))
    const taskTypesRaw = guard(() => groupBy('task', 'sys_class_name'), [])
    const taskTypes = taskTypesRaw
        .filter((r) => GEAR_CATEGORIES.indexOf(categoryOf(r.key)) >= 0)
        .map((r) => {
            const m = typeMeta(r.key)
            return { table: r.key, label: m.label, category: categoryOf(r.key), count: scopeCount[r.key] || 0 }
        })
        .concat(
            VR_TABLES.map((t) => ({
                table: t,
                label: typeMeta(t).label,
                category: categoryOf(t),
                count: guard(() => countWhere(t, withScope(scopeClause(mode), 'active=true')), 0),
            })),
        )
        .sort((a, b) => b.count - a.count)

    // Por prioridade
    const byPriority = guard(
        () => groupBy('task', 'priority', openScope).map((r) => ({ key: r.key, label: r.label, count: r.count })),
        [],
    )

    // Aging por idade de criação dos registros abertos
    const aging = [
        { label: '0–3 dias', count: guard(() => countWhere('task', withScope(openScope, withinDays('sys_created_on', 3))), 0) },
        {
            label: '3–7 dias',
            count: guard(
                () => countWhere('task', withScope(openScope, olderThan('sys_created_on', 3), withinDays('sys_created_on', 7))),
                0,
            ),
        },
        { label: '7+ dias', count: guard(() => countWhere('task', withScope(openScope, olderThan('sys_created_on', 7))), 0) },
    ]

    // SLA estourado — dot-walk no task_sla
    const slaScope = scopeClause(mode, { assigned: 'task.assigned_to', group: 'task.assignment_group' })
    const overdue_sla = guard(
        () => countWhere('task_sla', withScope(slaScope, 'active=true', 'has_breached=true')),
        0,
    )

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
        team = {
            by_assignee: guard(
                () =>
                    groupBy('task', 'assigned_to', teamOpen)
                        .map((r) => ({ label: r.label || 'Sem responsável', count: r.count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10),
                [],
            ),
            opened_7d: guard(() => countWhere('task', withScope(teamScope, withinDays('sys_created_on', 7))), 0),
            closed_7d: guard(
                () => countWhere('task', withScope(teamScope, 'active=false', withinDays('closed_at', 7))),
                0,
            ),
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
        vuln,
        approvals_pending,
        team,
    }
}
