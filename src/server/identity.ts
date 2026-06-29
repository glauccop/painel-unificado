import { gs } from '@servicenow/glide'

export type ScopeMode = 'mine' | 'team' | 'both'

export function currentUserId(): string {
    return gs.getUserID()
}

export function currentUserName(): string {
    return gs.getUserDisplayName()
}

// sys_ids dos grupos do usuário atual. getMyGroups() pode retornar
// um Array JS ou um objeto Java iterável — normalizamos para string[].
export function myGroupIds(): string[] {
    try {
        const raw = gs.getUser().getMyGroups() as any
        const out: string[] = []
        if (!raw) return out
        if (typeof raw.length === 'number') {
            for (let i = 0; i < raw.length; i++) out.push(String(raw[i]))
        } else if (typeof raw.toArray === 'function') {
            const arr = raw.toArray()
            for (let i = 0; i < arr.length; i++) out.push(String(arr[i]))
        }
        return out.filter((s) => s && s !== 'null')
    } catch (e) {
        return []
    }
}

// Monta a cláusula de escopo como GRUPO DE OR no início da query.
// Encoded query: condições ^OR consecutivas formam um grupo; um ^ seguinte
// faz AND com o grupo. Então retornamos "assigned_to=me^ORassignment_groupIN..."
// e o chamador concatena os demais filtros com "^...".
export function scopeClause(
    mode: ScopeMode,
    fields: { assigned?: string; group?: string } = {},
): string {
    const af = fields.assigned || 'assigned_to'
    const gf = fields.group || 'assignment_group'
    const me = currentUserId()
    const groups = myGroupIds()
    const groupClause = groups.length ? `${gf}IN${groups.join(',')}` : ''

    if (mode === 'mine') return `${af}=${me}`
    if (mode === 'team') return groupClause || `${af}=${me}`
    // both
    return groupClause ? `${af}=${me}^OR${groupClause}` : `${af}=${me}`
}

// Concatena o escopo com filtros adicionais preservando a precedência
// (escopo como grupo OR inicial, AND com o restante).
export function withScope(scope: string, ...and: string[]): string {
    const extra = and.filter(Boolean).join('^')
    return extra ? `${scope}^${extra}` : scope
}
