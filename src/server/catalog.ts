// Metadados de apresentação por tipo de registro (sys_class_name).
export interface TypeMeta {
    label: string
    product: string
}

export const TYPE_META: Record<string, TypeMeta> = {
    incident: { label: 'Incidents', product: 'ITSM' },
    incident_task: { label: 'Tarefas de Incident', product: 'ITSM' },
    problem: { label: 'Problems', product: 'ITSM' },
    problem_task: { label: 'Tarefas de Problem', product: 'ITSM' },
    change_request: { label: 'Changes', product: 'ITSM' },
    change_task: { label: 'Tarefas de Change', product: 'ITSM' },
    sc_task: { label: 'Tarefas de Catálogo', product: 'Requisições' },
    sc_req_item: { label: 'Itens Solicitados', product: 'Requisições' },
    pm_project: { label: 'Projetos', product: 'SPM · PPM' },
    dmn_demand: { label: 'Demandas', product: 'SPM' },
    idea: { label: 'Ideias', product: 'SPM · Ideation' },
    business_app_request: { label: 'Solicitações de Aplicação', product: 'SPM · APM' },
    sn_safe_epic: { label: 'SAFe Epics', product: 'SPM · SAFe' },
    pm_project_task: { label: 'Tarefas de Projeto', product: 'SPM · PPM' },
    rm_story: { label: 'Stories', product: 'SPM · EAP' },
    rm_scrum_task: { label: 'Scrum Tasks', product: 'SPM · EAP' },
    rm_epic: { label: 'Epics', product: 'SPM · EAP' },
    rm_feature: { label: 'Features', product: 'SPM · EAP' },
    rm_defect: { label: 'Defects', product: 'SPM · EAP' },
    sn_si_incident: { label: 'Security Incidents', product: 'SIR' },
    sn_si_task: { label: 'Tarefas de SIR', product: 'SIR' },
    dmn_demand_task: { label: 'Tarefas de Demanda', product: 'SPM' },
    planned_task: { label: 'Planned Tasks', product: 'SPM · EAP' },
    sn_safe_scrum_task: { label: 'SAFe Scrum Tasks', product: 'SPM · SAFe' },
    sn_safe_story: { label: 'SAFe Stories', product: 'SPM · SAFe' },
    // VR — Vulnerability Response (não herdam de task)
    sn_vul_vulnerable_item: { label: 'Vulnerable Items', product: 'VR' },
    sn_vul_app_vulnerable_item: { label: 'App Vulnerable Items', product: 'VR' },
    sn_vul_app_vulnerability: { label: 'App Vulnerabilities', product: 'VR' },
    sn_vul_vulnerability: { label: 'Vulnerabilities', product: 'VR' },
    sn_vul_pen_test_assessment_request: { label: 'Pen Test Requests', product: 'VR' },
}

export function typeMeta(cls: string, fallbackLabel?: string): TypeMeta {
    return TYPE_META[cls] || { label: fallbackLabel || cls, product: 'Outros' }
}

// Categoria do tipo de registro para a engrenagem do painel.
export type Category = 'ITSM' | 'SPM' | 'EAP' | 'VR' | 'Plataforma'

// Lista EXPLÍCITA das tabelas que a engrenagem expõe, por categoria (ordem preservada).
// Definida pelo usuário — substitui a descoberta automática de classes da task.
export interface GearTable {
    table: string
    category: Category
}
export const GEAR_TABLES: GearTable[] = [
    // ITSM
    { table: 'incident', category: 'ITSM' },
    { table: 'problem', category: 'ITSM' },
    { table: 'change_request', category: 'ITSM' },
    { table: 'change_task', category: 'ITSM' },
    // SPM (inclui Agile / SAFe)
    { table: 'pm_project', category: 'SPM' },
    { table: 'pm_project_task', category: 'SPM' },
    { table: 'dmn_demand', category: 'SPM' },
    { table: 'dmn_demand_task', category: 'SPM' },
    { table: 'rm_story', category: 'SPM' },
    { table: 'rm_scrum_task', category: 'SPM' },
    { table: 'planned_task', category: 'SPM' },
    { table: 'sn_safe_scrum_task', category: 'SPM' },
    { table: 'sn_safe_story', category: 'SPM' },
    { table: 'rm_feature', category: 'SPM' },
    // VR — Vulnerability Response
    { table: 'sn_vul_app_vulnerable_item', category: 'VR' },
    { table: 'sn_vul_app_vulnerability', category: 'VR' },
    { table: 'sn_vul_pen_test_assessment_request', category: 'VR' },
]

export function categoryOf(table: string): Category {
    if (table.indexOf('sn_vul') === 0) return 'VR'
    if (
        ['incident', 'incident_task', 'problem', 'problem_task', 'change_request', 'change_task'].indexOf(table) >= 0 ||
        table.indexOf('incident') === 0 ||
        table.indexOf('problem') === 0 ||
        table.indexOf('change') === 0
    )
        return 'ITSM'
    // EAP — Enterprise Agile Planning (stories, epics, features, scrum tasks, SAFe).
    if (table.indexOf('rm_') === 0 || table.indexOf('sn_safe') === 0) return 'EAP'
    if (
        ['dmn_demand', 'idea', 'business_app_request'].indexOf(table) >= 0 ||
        table.indexOf('pm_') === 0 ||
        table.indexOf('dmn_') === 0
    )
        return 'SPM'
    return 'Plataforma'
}
