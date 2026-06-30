import React, { useEffect, useState } from 'react'
import { fetchTeam, type TeamData, type TeamGroup, type TeamMember } from '../../shared/api'

// Aba "Meu time": à esquerda os grupos do usuário; à direita a estrutura (diagrama)
// do grupo selecionado — nome do grupo acima, pessoas abaixo (Full Name, e-mail, last_login).

const C = { azul: '#1c60ab', azulEscuro: '#003a70', cinza: '#8c99ab', borda: '#e4e9f0' }

function initials(name: string): string {
    const p = (name || '').trim().split(/\s+/)
    if (!p.length) return '?'
    return (p[0][0] || '').toUpperCase() + (p.length > 1 ? (p[p.length - 1][0] || '').toUpperCase() : '')
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.4, color: C.cinza }}>{label}</span>
            <span style={{ fontSize: 12, color: '#3b4658', wordBreak: 'break-word' }}>{children}</span>
        </div>
    )
}

function PersonCard({ m }: { m: TeamMember }) {
    return (
        <div
            style={{
                width: 220,
                background: '#fff',
                border: `1px solid ${C.borda}`,
                borderRadius: 12,
                padding: '12px 14px',
                boxShadow: '0 1px 3px rgba(16,38,76,.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                    style={{
                        width: 34,
                        height: 34,
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: C.azul,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 13,
                    }}
                >
                    {initials(m.name)}
                </span>
                <Field label="name">{m.name}</Field>
            </div>
            <Field label="email">
                {m.email ? (
                    <a href={`mailto:${m.email}`} style={{ color: C.azul, textDecoration: 'none' }}>
                        {m.email}
                    </a>
                ) : (
                    '—'
                )}
            </Field>
            <Field label="last_login">{m.last_login || '—'}</Field>
        </div>
    )
}

function TeamDiagram({ group }: { group: TeamGroup }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 16px' }}>
            {/* nó do grupo (acima) */}
            <div
                style={{
                    background: C.azulEscuro,
                    color: '#fff',
                    borderRadius: 12,
                    padding: '10px 20px',
                    fontWeight: 700,
                    fontSize: 15,
                    textAlign: 'center',
                }}
            >
                {group.name}
                <div style={{ fontWeight: 400, fontSize: 12, opacity: 0.85 }}>
                    {group.members.length} {group.members.length === 1 ? 'pessoa' : 'pessoas'}
                </div>
            </div>

            {/* conector vertical */}
            {group.members.length ? <div style={{ width: 2, height: 22, background: C.borda }} /> : null}

            {/* pessoas (abaixo) */}
            {group.members.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', borderTop: `2px solid ${C.borda}`, paddingTop: 22 }}>
                    {group.members.map((m) => (
                        <PersonCard key={m.sys_id} m={m} />
                    ))}
                </div>
            ) : (
                <div className="chart-empty">Este grupo não tem membros ativos.</div>
            )}
        </div>
    )
}

export function MeuTimeView() {
    const [data, setData] = useState<TeamData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selected, setSelected] = useState<string>('')

    useEffect(() => {
        let alive = true
        setLoading(true)
        setError('')
        fetchTeam()
            .then((d) => {
                if (!alive) return
                setData(d)
                setSelected(d.groups[0]?.sys_id || '')
            })
            .catch((e) => alive && setError(String(e?.message || e)))
            .finally(() => alive && setLoading(false))
        return () => {
            alive = false
        }
    }, [])

    const groups = data?.groups || []
    const current = groups.find((g) => g.sys_id === selected) || groups[0]

    return (
        <div className="meu-time-view" style={{ padding: '4px 24px 24px' }}>
            {error ? <div className="app-error">Falha ao carregar: {error}</div> : null}

            {loading ? (
                <div className="chart-empty" style={{ padding: 24 }}>
                    Carregando seus grupos…
                </div>
            ) : !groups.length ? (
                <div className="chart-empty" style={{ padding: 24 }}>
                    Você não pertence a nenhum grupo.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
                    {/* card à esquerda: grupos do usuário */}
                    <div
                        style={{
                            background: '#fff',
                            border: `1px solid ${C.borda}`,
                            borderRadius: 14,
                            padding: '16px 14px',
                            boxShadow: '0 1px 3px rgba(16,38,76,.08)',
                        }}
                    >
                        <div className="chart-ttl" style={{ marginBottom: 10 }}>
                            Meus grupos <span style={{ color: C.cinza, fontWeight: 400 }}>({groups.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {groups.map((g) => (
                                <button
                                    key={g.sys_id}
                                    onClick={() => setSelected(g.sys_id)}
                                    style={{
                                        textAlign: 'left',
                                        border: 'none',
                                        background: g.sys_id === current?.sys_id ? '#eef4fb' : 'transparent',
                                        color: g.sys_id === current?.sys_id ? C.azul : '#3b4658',
                                        fontWeight: g.sys_id === current?.sys_id ? 700 : 500,
                                        borderRadius: 8,
                                        padding: '9px 11px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: 13,
                                    }}
                                >
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</span>
                                    <span
                                        style={{
                                            flexShrink: 0,
                                            background: '#dfe7f1',
                                            color: C.azulEscuro,
                                            borderRadius: 10,
                                            padding: '1px 8px',
                                            fontSize: 11,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {g.members.length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* diagrama do time à direita */}
                    <div
                        style={{
                            background: '#f8fafc',
                            border: `1px solid ${C.borda}`,
                            borderRadius: 14,
                            padding: '8px 18px',
                            minHeight: 200,
                        }}
                    >
                        {current ? <TeamDiagram group={current} /> : null}
                    </div>
                </div>
            )}
        </div>
    )
}
