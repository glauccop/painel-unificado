import React, { useState, useRef, useEffect } from 'react'
import { fetchSearch, type ScopeMode, type SearchHit } from '../shared/api'

interface Props {
    scope: ScopeMode
}

export function AiSearch({ scope }: Props) {
    const [term, setTerm] = useState('')
    const [hits, setHits] = useState<SearchHit[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const boxRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [])

    const run = async (q: string) => {
        if (!q.trim()) {
            setHits([])
            setOpen(false)
            return
        }
        setLoading(true)
        setOpen(true)
        try {
            const r = await fetchSearch(q, scope)
            setHits(r.hits || [])
        } catch (e) {
            setHits([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="ai-search" ref={boxRef}>
            <div className="ai-search-input">
                <span className="ai-search-icon" aria-hidden>
                    ⌕
                </span>
                <input
                    type="text"
                    value={term}
                    placeholder="Pergunte ou busque — ex.: como abrir uma change, INC0010023…"
                    onChange={(e) => setTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && run(term)}
                    onFocus={() => hits.length && setOpen(true)}
                />
                <span className="ai-search-tag">AI Search</span>
            </div>
            {open && (
                <div className="ai-search-results">
                    {loading ? (
                        <div className="ai-search-empty">Buscando…</div>
                    ) : hits.length === 0 ? (
                        <div className="ai-search-empty">Nenhum resultado para “{term}”.</div>
                    ) : (
                        hits.map((h, i) => (
                            <a key={i} className="ai-hit" href={h.url} target="_top">
                                <span className={`ai-hit-kind kind-${h.kind === 'Conhecimento' ? 'kb' : h.kind === 'Catálogo' ? 'cat' : 'rec'}`}>
                                    {h.kind}
                                </span>
                                <span className="ai-hit-body">
                                    <span className="ai-hit-title">{h.title}</span>
                                    {h.snippet ? <span className="ai-hit-snippet">{h.snippet}</span> : null}
                                </span>
                            </a>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
