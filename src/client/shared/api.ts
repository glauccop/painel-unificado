export type ScopeMode = 'mine' | 'team' | 'both'

export interface TypeCount {
    table: string
    label: string
    product: string
    count: number
}
export interface TaskTypeRow {
    table: string
    label: string
    category: string
    count: number
}
export interface LabeledCount {
    key?: string
    label: string
    count: number
}
export interface Summary {
    user: { id: string; name: string }
    scope: ScopeMode
    groups: number
    kpis: { open_total: number; awaiting_you: number; overdue_sla: number; vuln_open: number }
    byType: TypeCount[]
    taskTypes: TaskTypeRow[]
    byPriority: LabeledCount[]
    aging: LabeledCount[]
    aging_total: number
    vuln: { open: number; by_severity: LabeledCount[] }
    approvals_pending: number
    team: null | {
        by_assignee: LabeledCount[]
        opened_7d: number
        closed_7d: number
    }
}
export interface InboxItem {
    sys_id: string
    table: string
    type_label: string
    product: string
    number: string
    short_description: string
    priority: string
    priority_label: string
    state: string
    state_label: string
    assignment_group: string
    assigned_to: string
    updated: string
    deeplink: string
}
export interface ListResult {
    lens: string
    count: number
    items: InboxItem[]
}
export interface SearchHit {
    kind: string
    title: string
    snippet: string
    meta: string
    url: string
}
export interface SearchResult {
    term: string
    hits: SearchHit[]
}

const BASE = '/api/x_snc_painel_unif/painel'

async function getJson<T>(path: string, params: Record<string, string>): Promise<T> {
    const qs = new URLSearchParams(params).toString()
    const res = await fetch(`${BASE}${path}?${qs}`, {
        headers: { Accept: 'application/json', 'X-UserToken': window.g_ck || '' },
    })
    if (!res.ok) {
        let body = ''
        try {
            body = await res.text()
        } catch (e) {
            /* ignore */
        }
        throw new Error(`HTTP ${res.status} — ${body.slice(0, 600)}`)
    }
    return res.json() as Promise<T>
}

// Console por Solução (reutilizado na aba "Principal" do painel).
export interface ConsoleSolItem {
    sys_id: string
    table: string
    type_label: string
    number: string
    short_description: string
    priority: string
    priority_label: string
    assigned_to: string
    assignment_group: string
    deeplink: string
}
export interface ConsoleWorkspaceLink {
    label: string
    url: string
}
export interface ConsoleSolution {
    key: string
    label: string
    product: string
    accent: string
    workspace: ConsoleWorkspaceLink
    workspaceFallback: ConsoleWorkspaceLink | null
    total: number
    byType: Array<{ table: string; label: string; count: number }>
    items: ConsoleSolItem[]
}
export interface ConsoleVrItem {
    sys_id: string
    number: string
    short_description: string
    severity: string
    assigned_to: string
    assignment_group: string
    deeplink: string
}
export interface ConsoleVr {
    total: number
    bySeverity: Array<{ label: string; count: number }>
    unassignedBySeverity: Array<{ label: string; count: number }>
    items: ConsoleVrItem[]
    consoleUrl: string
    consoleLabel: string
}
export interface ConsoleData {
    user: { id: string; name: string }
    scope: ScopeMode
    groups: number
    ba: string
    businessApps: Array<{ id: string; name: string; count: number }>
    byPriority: Array<{ key: string; count: number }>
    storyStatus: Array<{ label: string; count: number }>
    vr: ConsoleVr
    approvals: { total: number; byType: Array<{ label: string; count: number }> }
    solutions: ConsoleSolution[]
}
export const fetchConsole = (scope: ScopeMode, ba = '') => getJson<ConsoleData>('/console', { scope, ba })

export const fetchSummary = (scope: ScopeMode) => getJson<Summary>('/summary', { scope })
export const fetchList = (scope: ScopeMode, lens: string, limit = 50, offset = 0) =>
    getJson<ListResult>('/list', { scope, lens, limit: String(limit), offset: String(offset) })
export const fetchSearch = (q: string, scope: ScopeMode) => getJson<SearchResult>('/search', { q, scope })
