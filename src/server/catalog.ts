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
    // VR — Vulnerability Response (não herdam de task)
    sn_vul_vulnerable_item: { label: 'Vulnerable Items', product: 'VR' },
    sn_vul_app_vulnerable_item: { label: 'App Vulnerable Items', product: 'VR' },
    sn_vul_vulnerability: { label: 'Vulnerabilities', product: 'VR' },
}

export function typeMeta(cls: string, fallbackLabel?: string): TypeMeta {
    return TYPE_META[cls] || { label: fallbackLabel || cls, product: 'Outros' }
}

// Categoria do tipo de registro para a engrenagem do painel.
export type Category = 'ITSM' | 'SPM' | 'EAP' | 'VR' | 'Plataforma'

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
