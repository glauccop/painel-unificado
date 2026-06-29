import { GlideRecord } from '@servicenow/glide'
import { ScopeMode, scopeClause, withScope, currentUserId } from './identity.ts'
import { deeplink } from './routes.ts'
import { typeMeta } from './catalog.ts'

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

function win(gr: any, offset: number, limit: number) {
    if (typeof gr.chooseWindow === 'function') gr.chooseWindow(offset, offset + limit)
    else gr.setLimit(offset + limit)
}

// Inbox unificada sobre a hierarquia de task
export function buildList(mode: ScopeMode, lens: string, limit: number, offset: number) {
    if (lens === 'vuln') return buildVulnList(mode, limit, offset)
    if (lens === 'approvals') return buildApprovalList(limit, offset)

    const scope = scopeClause(mode)
    let q = withScope(scope, 'active=true')
    if (lens && lens !== 'all') q = withScope(q, `sys_class_name=${lens}`)
    q += '^ORDERBYpriority^ORDERBYDESCsys_updated_on'

    const gr = new GlideRecord('task') as any
    gr.addEncodedQuery(q)
    win(gr, offset, limit)
    gr.query()

    const items: InboxItem[] = []
    while (gr.next()) {
        const cls = gr.getValue('sys_class_name') || 'task'
        const sysId = gr.getUniqueValue()
        const m = typeMeta(cls)
        items.push({
            sys_id: sysId,
            table: cls,
            type_label: m.label,
            product: m.product,
            number: gr.getDisplayValue('number') || gr.getValue('number'),
            short_description: gr.getValue('short_description'),
            priority: gr.getValue('priority'),
            priority_label: gr.getDisplayValue('priority'),
            state: gr.getValue('state'),
            state_label: gr.getDisplayValue('state'),
            assignment_group: gr.getDisplayValue('assignment_group'),
            assigned_to: gr.getDisplayValue('assigned_to'),
            updated: gr.getDisplayValue('sys_updated_on'),
            deeplink: deeplink(cls, sysId),
        })
    }
    return { lens: lens || 'all', count: items.length, items }
}

function buildVulnList(mode: ScopeMode, limit: number, offset: number) {
    const scope = scopeClause(mode)
    const q = withScope(scope, 'active=true') + '^ORDERBYDESCrisk_score'
    const gr = new GlideRecord('sn_vul_vulnerable_item') as any
    gr.addEncodedQuery(q)
    win(gr, offset, limit)
    gr.query()

    const items: InboxItem[] = []
    while (gr.next()) {
        const sysId = gr.getUniqueValue()
        items.push({
            sys_id: sysId,
            table: 'sn_vul_vulnerable_item',
            type_label: 'Vulnerabilidade',
            product: 'VR',
            number: gr.getDisplayValue('number') || gr.getValue('number'),
            short_description: gr.getValue('short_description'),
            priority: gr.getValue('risk_score') || '',
            priority_label: gr.getDisplayValue('risk_rating') || '',
            state: gr.getValue('state'),
            state_label: gr.getDisplayValue('state'),
            assignment_group: gr.getDisplayValue('assignment_group'),
            assigned_to: gr.getDisplayValue('assigned_to'),
            updated: gr.getDisplayValue('sys_updated_on'),
            deeplink: deeplink('sn_vul_vulnerable_item', sysId),
        })
    }
    return { lens: 'vuln', count: items.length, items }
}

function buildApprovalList(limit: number, offset: number) {
    const me = currentUserId()
    const gr = new GlideRecord('sysapproval_approver') as any
    gr.addEncodedQuery(`approver=${me}^state=requested^ORDERBYDESCsys_created_on`)
    win(gr, offset, limit)
    gr.query()

    const items: InboxItem[] = []
    while (gr.next()) {
        const targetTable = gr.getValue('source_table') || 'task'
        const targetId = gr.getValue('sysapproval')
        items.push({
            sys_id: gr.getUniqueValue(),
            table: targetTable,
            type_label: 'Aprovação',
            product: 'Aprovações',
            number: gr.getDisplayValue('sysapproval') || '',
            short_description: gr.getDisplayValue('sysapproval') || 'Aprovação pendente',
            priority: '',
            priority_label: '',
            state: gr.getValue('state'),
            state_label: gr.getDisplayValue('state'),
            assignment_group: '',
            assigned_to: gr.getDisplayValue('approver'),
            updated: gr.getDisplayValue('sys_created_on'),
            deeplink: deeplink(targetTable, targetId),
        })
    }
    return { lens: 'approvals', count: items.length, items }
}
