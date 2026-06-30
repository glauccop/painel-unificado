import { buildSummary } from './summary.ts'
import { buildList } from './list.ts'
import { buildConsole } from './console.ts'
import { buildHistorico } from './historico.ts'
import { buildTeam } from './team.ts'
import { search } from './aisearch.ts'
import { ScopeMode } from './identity.ts'

// Lê um query param simples do request do Scripted REST (scoped).
function qp(request: any, name: string, def: string): string {
    try {
        const v = request && request.queryParams ? request.queryParams[name] : null
        if (v && typeof v.length === 'number' && v.length > 0) return String(v[0])
        if (typeof v === 'string') return v
    } catch (e) {
        /* ignore */
    }
    return def
}

function normalizeScope(s: string): ScopeMode {
    return s === 'mine' || s === 'team' ? s : 'both'
}

function writeJson(response: any, body: any, status = 200) {
    response.setStatus(status)
    response.setContentType('application/json')
    response.getStreamWriter().writeString(JSON.stringify(body))
}

function errBody(e: any) {
    return {
        error: String((e && (e.message || e)) || 'erro'),
        stack: e && e.stack ? String(e.stack) : '',
    }
}

// GET /api/x_snc_painel_unif/painel/summary?scope=mine|team|both
export function getSummary(request: any, response: any) {
    try {
        const scope = normalizeScope(qp(request, 'scope', 'both'))
        writeJson(response, buildSummary(scope))
    } catch (e: any) {
        writeJson(response, errBody(e), 500)
    }
}

// GET /api/x_snc_painel_unif/painel/list?scope=&lens=&limit=&offset=
export function getList(request: any, response: any) {
    try {
        const scope = normalizeScope(qp(request, 'scope', 'both'))
        const lens = qp(request, 'lens', 'all')
        const limit = Math.min(parseInt(qp(request, 'limit', '50'), 10) || 50, 200)
        const offset = parseInt(qp(request, 'offset', '0'), 10) || 0
        writeJson(response, buildList(scope, lens, limit, offset))
    } catch (e: any) {
        writeJson(response, errBody(e), 500)
    }
}

// GET /api/x_snc_painel_unif/painel/console?scope=mine|team|both&ba=<sys_id>
export function getConsole(request: any, response: any) {
    try {
        const scope = normalizeScope(qp(request, 'scope', 'both'))
        const ba = qp(request, 'ba', '')
        writeJson(response, buildConsole(scope, ba))
    } catch (e: any) {
        writeJson(response, errBody(e), 500)
    }
}

// GET /api/x_snc_painel_unif/painel/historico?scope=mine|team|both
export function getHistorico(request: any, response: any) {
    try {
        const scope = normalizeScope(qp(request, 'scope', 'both'))
        const days = qp(request, 'days', '')
        writeJson(response, buildHistorico(scope, days))
    } catch (e: any) {
        writeJson(response, errBody(e), 500)
    }
}

// GET /api/x_snc_painel_unif/painel/team
export function getTeam(request: any, response: any) {
    try {
        writeJson(response, buildTeam())
    } catch (e: any) {
        writeJson(response, errBody(e), 500)
    }
}

// GET /api/x_snc_painel_unif/painel/search?q=&scope=
export function getSearch(request: any, response: any) {
    try {
        const scope = normalizeScope(qp(request, 'scope', 'both'))
        const term = qp(request, 'q', '')
        writeJson(response, search(term, scope))
    } catch (e: any) {
        writeJson(response, errBody(e), 500)
    }
}
