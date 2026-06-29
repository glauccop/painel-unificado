import type { ScopeMode } from './api'

// Cards de insight disponíveis (data-driven). O template escolhe quais exibir.
export type InsightKey =
    | 'open_total'
    | 'awaiting_you'
    | 'overdue_sla'
    | 'vuln_open'
    | 'byType'
    | 'aging'
    | 'byPriority'
    | 'team_load'
    | 'throughput'

export interface PersonaTemplate {
    id: string
    name: string
    description: string
    defaultScope: ScopeMode
    defaultLens: string
    kpis: InsightKey[]
    insights: InsightKey[]
}

// 5 personas. Estrutura data-driven: adicionar/ajustar template não exige
// reescrever telas — só editar esta lista.
export const TEMPLATES: PersonaTemplate[] = [
    {
        id: 'executor',
        name: 'Mesa do Executor',
        description: 'Dev · N3 · Analista ITSM · Analista de Vulnerabilidade',
        defaultScope: 'both',
        defaultLens: 'all',
        kpis: ['open_total', 'awaiting_you', 'overdue_sla', 'vuln_open'],
        insights: ['byType', 'aging', 'byPriority'],
    },
    {
        id: 'time',
        name: 'Visão do Time',
        description: 'Líder técnico · Scrum Master',
        defaultScope: 'team',
        defaultLens: 'all',
        kpis: ['open_total', 'overdue_sla', 'awaiting_you', 'vuln_open'],
        insights: ['team_load', 'throughput', 'byType', 'byPriority'],
    },
    {
        id: 'executiva',
        name: 'Visão Executiva',
        description: 'Gestor · PO · PM',
        defaultScope: 'team',
        defaultLens: 'all',
        kpis: ['open_total', 'overdue_sla', 'vuln_open', 'awaiting_you'],
        insights: ['byType', 'throughput', 'aging'],
    },
    {
        id: 'po_agile',
        name: 'Product Owner / Ágil',
        description: 'Backlog, epics, features e stories (EAP/CWM)',
        defaultScope: 'both',
        defaultLens: 'rm_story',
        kpis: ['open_total', 'awaiting_you', 'overdue_sla', 'vuln_open'],
        insights: ['byType', 'byPriority', 'aging'],
    },
    {
        id: 'gestor_times',
        name: 'Gestor de Times (Meus Times)',
        description: 'Visão consolidada dos times sob sua gestão',
        defaultScope: 'team',
        defaultLens: 'all',
        kpis: ['open_total', 'overdue_sla', 'awaiting_you', 'vuln_open'],
        insights: ['team_load', 'throughput', 'byType'],
    },
]

export const DEFAULT_TEMPLATE = TEMPLATES[0]
