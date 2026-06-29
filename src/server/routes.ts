// Resolve o deep-link do workspace correto para cada tipo de registro.
// Padrão confirmado: /now/<workspace>/record/<table>/<sys_id> (SOW slug = "sow").
// Para tipos sem workspace mapeado, usamos o form clássico como fallback robusto
// (/<table>.do?sys_id=<id>), que sempre abre o registro.

// Tabelas que abrem no Service Operations Workspace (SOW).
const SOW_TABLES: Record<string, boolean> = {
    task: true,
    incident: true,
    incident_task: true,
    problem: true,
    problem_task: true,
    change_request: true,
    change_task: true,
    sc_task: true,
    sc_req_item: true,
    sm_order: true,
}

// Slugs de workspace por tabela — confirmados na instância (sys_ux_page_registry + sys_ux_app_route).
// EAP = Enterprise Agile Planning, hospedado no Strategic Planning Workspace (path alignment-workspace),
// que tem rota `record` (table,sysId) → /now/alignment-workspace/record/<table>/<id>.
// workspace/project = Project Workspace (SPM/PPM). CWM foi descontinuado a pedido.
export const EAP_SLUG = 'alignment-workspace'

const WORKSPACE_SLUG: Record<string, string> = {
    rm_story: EAP_SLUG,
    rm_scrum_task: EAP_SLUG,
    rm_defect: EAP_SLUG,
    rm_epic: EAP_SLUG,
    rm_feature: EAP_SLUG,
    sn_safe_epic: EAP_SLUG,
    pm_project: 'workspace/project',
    pm_project_task: 'workspace/project',
    // VR — Vulnerability Response → Security Exposure Management workspace
    sn_vul_vulnerable_item: 'vr-analysis',
    sn_vul_app_vulnerable_item: 'vr-analysis',
    sn_vul_vulnerability: 'vr-analysis',
}

export function deeplink(table: string, sysId: string): string {
    if (!sysId) return '#'
    if (SOW_TABLES[table]) return `/now/sow/record/${table}/${sysId}`
    const slug = WORKSPACE_SLUG[table]
    if (slug) return `/now/${slug}/record/${table}/${sysId}`
    // fallback: form clássico (sempre funciona)
    return `/${table}.do?sys_id=${sysId}`
}

// Link de fallback por registro: form clássico (sempre abre), caso o workspace não renderize.
export function fallbackLink(table: string, sysId: string): string {
    if (!sysId) return '#'
    return `/${table}.do?sys_id=${sysId}`
}
