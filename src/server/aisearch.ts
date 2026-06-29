import { GlideRecord } from '@servicenow/glide'
import { ScopeMode, scopeClause, withScope } from './identity.ts'
import { deeplink } from './routes.ts'

// Busca para orientar o uso da plataforma + localizar registros do usuário.
// Usa full-text nativo (operador Zing 123TEXTQUERY321) sobre Knowledge,
// Catálogo e a hierarquia de task do usuário. Estruturado para, no futuro,
// delegar à AI Search nativa / Now Assist (AISASearchUtil) ou a um AI Agent.

export interface SearchHit {
    kind: string
    title: string
    snippet: string
    meta: string
    url: string
}

function stripHtml(s: string): string {
    return (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function tryBlock(fn: () => void) {
    try {
        fn()
    } catch (e) {
        /* fonte indisponível — ignora */
    }
}

export function search(term: string, mode: ScopeMode) {
    const t = (term || '').trim()
    if (!t) return { term: '', hits: [] as SearchHit[] }
    const hits: SearchHit[] = []

    // Base de conhecimento (orientação de uso: "como abrir uma change")
    tryBlock(() => {
        const gr = new GlideRecord('kb_knowledge') as any
        gr.addEncodedQuery(`workflow_state=published^123TEXTQUERY321=${t}`)
        gr.setLimit(5)
        gr.query()
        while (gr.next()) {
            hits.push({
                kind: 'Conhecimento',
                title: gr.getDisplayValue('short_description') || gr.getValue('number'),
                snippet: stripHtml(gr.getValue('text')).slice(0, 160),
                meta: gr.getValue('number'),
                url: `/kb_view.do?sysparm_article=${gr.getValue('number')}`,
            })
        }
    })

    // Catálogo de serviços
    tryBlock(() => {
        const gr = new GlideRecord('sc_cat_item') as any
        gr.addEncodedQuery(`active=true^123TEXTQUERY321=${t}`)
        gr.setLimit(5)
        gr.query()
        while (gr.next()) {
            const id = gr.getUniqueValue()
            hits.push({
                kind: 'Catálogo',
                title: gr.getDisplayValue('name'),
                snippet: stripHtml(gr.getValue('short_description')).slice(0, 160),
                meta: 'Item de catálogo',
                url: `/com.glideapp.servicecatalog_cat_item_view.do?v=1&sysparm_id=${id}`,
            })
        }
    })

    // Meus registros que casam o termo
    tryBlock(() => {
        const scope = scopeClause(mode)
        const gr = new GlideRecord('task') as any
        gr.addEncodedQuery(withScope(scope, 'active=true', `123TEXTQUERY321=${t}`) + '^ORDERBYDESCsys_updated_on')
        gr.setLimit(5)
        gr.query()
        while (gr.next()) {
            const cls = gr.getValue('sys_class_name') || 'task'
            const id = gr.getUniqueValue()
            hits.push({
                kind: 'Meu registro',
                title: `${gr.getDisplayValue('number')} · ${gr.getValue('short_description')}`,
                snippet: '',
                meta: cls,
                url: deeplink(cls, id),
            })
        }
    })

    return { term: t, hits }
}
