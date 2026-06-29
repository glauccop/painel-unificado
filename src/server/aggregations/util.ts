import { GlideAggregate, GlideRecord } from '@servicenow/glide'

// Helpers de agregação/leitura sobre GlideAggregate/GlideRecord.
// Reaproveitados do padrão do projeto Dashboard-ServiceNow.

export function n(v: string | number): number {
    const f = typeof v === 'number' ? v : parseFloat(v)
    return isFinite(f) ? f : 0
}

export function round(v: number, d = 2): number {
    const m = Math.pow(10, d)
    return Math.round(v * m) / m
}

export interface GroupRow {
    key: string
    label: string
    count: number
}

// Contagem de linhas que batem a query
export function countWhere(table: string, where?: string): number {
    const ga = new GlideAggregate(table) as any
    ga.addAggregate('COUNT')
    if (where) ga.addEncodedQuery(where)
    ga.query()
    return ga.next() ? n(ga.getAggregate('COUNT')) : 0
}

// Agrupa por um campo, retornando key, label (display) e count
export function groupBy(table: string, field: string, where?: string): GroupRow[] {
    const ga = new GlideAggregate(table) as any
    ga.addAggregate('COUNT')
    ga.groupBy(field)
    if (where) ga.addEncodedQuery(where)
    ga.query()
    const out: GroupRow[] = []
    while (ga.next()) {
        out.push({
            key: ga.getValue(field) || '',
            label: ga.getDisplayValue(field) || ga.getValue(field) || '',
            count: n(ga.getAggregate('COUNT')),
        })
    }
    return out
}

// Agrupa por DOIS campos (ex.: priority x sys_class_name). Retorna valor+display do
// campo A e valor do campo B, para o cliente colapsar por visibilidade de classe.
export interface Group2Row {
    a: string
    aLabel: string
    b: string
    count: number
}
export function groupBy2(table: string, fieldA: string, fieldB: string, where?: string): Group2Row[] {
    const ga = new GlideAggregate(table) as any
    ga.addAggregate('COUNT')
    ga.groupBy(fieldA)
    ga.groupBy(fieldB)
    if (where) ga.addEncodedQuery(where)
    ga.query()
    const out: Group2Row[] = []
    while (ga.next()) {
        out.push({
            a: ga.getValue(fieldA) || '',
            aLabel: ga.getDisplayValue(fieldA) || ga.getValue(fieldA) || '',
            b: ga.getValue(fieldB) || '',
            count: n(ga.getAggregate('COUNT')),
        })
    }
    return out
}

// Mapa key -> count
export function countMap(table: string, field: string, where?: string): Record<string, number> {
    const m: Record<string, number> = {}
    groupBy(table, field, where).forEach((r) => (m[r.key] = r.count))
    return m
}

export interface Bucket {
    name: string
    min?: number
    max?: number
}

// Histograma por faixas numéricas (ex.: aging em dias)
export function buckets(table: string, field: string, bs: Bucket[], where?: string): Array<{ name: string; count: number }> {
    return bs.map((b) => {
        let q = where ? where : ''
        if (b.min != null) q += `${q ? '^' : ''}${field}>=${b.min}`
        if (b.max != null) q += `${q ? '^' : ''}${field}<=${b.max}`
        return { name: b.name, count: countWhere(table, q) }
    })
}

export interface ReadField {
    name: string
    // quando true, retorna display value em vez do raw value
    display?: boolean
}

// Lê registros (com order/limit/where) retornando objetos { raw, display } por campo
export function readAll(
    table: string,
    fields: string[],
    opts: { orderDesc?: string; order?: string; where?: string; limit?: number } = {},
): Array<Record<string, { value: string; display: string }>> {
    const gr = new GlideRecord(table) as any
    if (opts.where) gr.addEncodedQuery(opts.where)
    if (opts.orderDesc) gr.orderByDesc(opts.orderDesc)
    if (opts.order) gr.orderBy(opts.order)
    if (opts.limit) gr.setLimit(opts.limit)
    gr.query()
    const out: Array<Record<string, { value: string; display: string }>> = []
    while (gr.next()) {
        const o: Record<string, { value: string; display: string }> = {}
        fields.forEach((f) => {
            o[f] = { value: gr.getValue(f) || '', display: gr.getDisplayValue(f) || '' }
        })
        // sempre inclui sys_id e sys_class_name úteis para deeplink
        o.sys_id = { value: gr.getUniqueValue ? gr.getUniqueValue() : gr.getValue('sys_id'), display: '' }
        o.sys_class_name = { value: gr.getValue('sys_class_name') || table, display: '' }
        out.push(o)
    }
    return out
}
