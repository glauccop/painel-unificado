import { ScopeMode, scopeClause, withScope, currentUserId, currentUserName, myGroupIds } from './identity.ts'
import { groupBy, readAll, countWhere } from './aggregations/util.ts'
import { deeplink, EAP_SLUG } from './routes.ts'
import { typeMeta } from './catalog.ts'

interface WorkspaceLink {
    label: string
    url: string
}

// Campo (herdado de task) que liga qualquer registro à sua Business Application = "SIGLA".
const BA_FIELD = 'cmdb_ci_business_app'

// Cada "solução" é um card que consolida várias classes da hierarquia task.
interface SolutionDef {
    key: string
    label: string
    product: string
    accent: string
    classes: string[]
    workspace: WorkspaceLink
    workspaceFallback: WorkspaceLink | null
}

// Workspaces confirmados na instância: SOW=sow, Project=workspace/project, EAP=alignment-workspace.
const SOLUTIONS: SolutionDef[] = [
    {
        key: 'itsm',
        label: 'ITSM',
        product: 'Incidentes · Problemas · Mudanças',
        accent: 'azul',
        classes: ['incident', 'problem', 'change_request', 'incident_task', 'problem_task', 'change_task'],
        workspace: { label: 'Service Operations Workspace', url: '/now/sow' },
        workspaceFallback: null,
    },
    {
        key: 'spm',
        label: 'SPM',
        product: 'Demandas · Projetos · Ideias',
        accent: 'turquesa',
        classes: ['dmn_demand', 'pm_project', 'pm_project_task', 'idea', 'business_app_request'],
        workspace: { label: 'Project Workspace', url: '/now/workspace/project' },
        workspaceFallback: null,
    },
    {
        key: 'agil',
        label: 'Ágil / SAFe',
        product: 'Epics · Stories · Features',
        accent: 'laranja',
        classes: ['rm_epic', 'sn_safe_epic', 'rm_story', 'rm_feature', 'rm_scrum_task', 'rm_defect'],
        workspace: { label: 'EAP', url: `/now/${EAP_SLUG}` },
        workspaceFallback: null,
    },
]

function guard<T>(fn: () => T, fallback: T): T {
    try {
        return fn()
    } catch (e) {
        return fallback
    }
}

const baClause = (ba: string) => (ba ? `${BA_FIELD}=${ba}` : '')

// Consolida os cards de solução para o escopo (meus / meu time / ambos) + Business Application.
export function buildConsole(mode: ScopeMode, ba: string) {
    const scope = scopeClause(mode)
    const base = withScope(scope, 'active=true', baClause(ba))

    // Business Applications presentes no escopo do usuário (alimenta o seletor).
    const baseNoBa = withScope(scope, 'active=true')
    const businessApps = guard(
        () =>
            groupBy('task', BA_FIELD, withScope(baseNoBa, `${BA_FIELD}ISNOTEMPTY`))
                .map((r) => ({ id: r.key, name: r.label, count: r.count }))
                .sort((a, b) => b.count - a.count),
        [] as Array<{ id: string; name: string; count: number }>,
    )

    // Quebra por prioridade (para o gráfico) no escopo + BA.
    const byPriority = guard(
        () => groupBy('task', 'priority', base).map((r) => ({ key: r.key || '0', count: r.count })),
        [] as Array<{ key: string; count: number }>,
    )

    // Status das histórias (rm_story) no escopo do usuário — para o gráfico de barras verticais.
    const storyStatus = guard(
        () =>
            groupBy('rm_story', 'state', scopeClause(mode))
                .map((r) => ({ label: r.label || r.key, count: r.count }))
                .sort((a, b) => b.count - a.count),
        [] as Array<{ label: string; count: number }>,
    )

    // VR — Vulnerability Response (não é task). Escopo = assigned_to/grupos do usuário + ativo.
    const vrScope = withScope(scopeClause(mode), 'active=true')
    const vr = guard(
        () => {
            const total = countWhere('sn_vul_vulnerable_item', vrScope)
            const bySeverity = groupBy('sn_vul_vulnerable_item', 'risk_rating', vrScope)
                .map((r) => ({ label: r.label || r.key || '—', count: r.count }))
                .sort((a, b) => b.count - a.count)
            const items =
                total > 0
                    ? readAll(
                          'sn_vul_vulnerable_item',
                          ['number', 'short_description', 'risk_rating', 'risk_score', 'assigned_to', 'assignment_group'],
                          { where: vrScope + '^ORDERBYDESCrisk_score', limit: 20 },
                      ).map((o) => ({
                          sys_id: o.sys_id.value,
                          number: o.number.display || o.number.value,
                          short_description: o.short_description.value,
                          severity: o.risk_rating.display || o.risk_rating.value,
                          assigned_to: o.assigned_to.display,
                          assignment_group: o.assignment_group.display,
                          deeplink: deeplink('sn_vul_vulnerable_item', o.sys_id.value),
                      }))
                    : []
            return { total, bySeverity, items, consoleUrl: '/now/vr-analysis/homepage', consoleLabel: 'Security Exposure Management' }
        },
        { total: 0, bySeverity: [] as Array<{ label: string; count: number }>, items: [] as any[], consoleUrl: '/now/vr-analysis/homepage', consoleLabel: 'Security Exposure Management' },
    )

    // Uma única agregação por classe cobre todas as soluções.
    const classCount: Record<string, number> = {}
    guard(() => groupBy('task', 'sys_class_name', base), []).forEach((r) => (classCount[r.key] = r.count))

    const solutions = SOLUTIONS.map((s) => {
        const byType = s.classes
            .map((c) => ({ table: c, label: typeMeta(c).label, count: classCount[c] || 0 }))
            .filter((x) => x.count > 0)
        const total = byType.reduce((a, x) => a + x.count, 0)

        const items = guard(() => {
            if (!total) return [] as any[]
            const q =
                withScope(base, `sys_class_nameIN${s.classes.join(',')}`) +
                '^ORDERBYpriority^ORDERBYDESCsys_updated_on'
            return readAll(
                'task',
                ['number', 'short_description', 'priority', 'assigned_to', 'assignment_group', 'sys_updated_on'],
                { where: q },
            ).map((o) => {
                const cls = o.sys_class_name.value
                return {
                    sys_id: o.sys_id.value,
                    table: cls,
                    type_label: typeMeta(cls).label,
                    number: o.number.display || o.number.value,
                    short_description: o.short_description.value,
                    priority: o.priority.value,
                    priority_label: o.priority.display,
                    assigned_to: o.assigned_to.display,
                    assignment_group: o.assignment_group.display,
                    deeplink: deeplink(cls, o.sys_id.value),
                }
            })
        }, [] as any[])

        return {
            key: s.key,
            label: s.label,
            product: s.product,
            accent: s.accent,
            workspace: s.workspace,
            workspaceFallback: s.workspaceFallback,
            total,
            byType,
            items,
        }
    })

    return {
        user: { id: currentUserId(), name: currentUserName() },
        scope: mode,
        groups: myGroupIds().length,
        ba,
        businessApps,
        byPriority,
        storyStatus,
        vr,
        solutions,
    }
}
