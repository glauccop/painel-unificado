import React from 'react'
import logo from '../assets/logo_default.png'
import { AiSearch } from './AiSearch'
import type { ScopeMode } from '../shared/api'

interface Props {
    scope: ScopeMode
    onScope: (s: ScopeMode) => void
    userName?: string
}

const SCOPES: Array<{ id: ScopeMode; label: string }> = [
    { id: 'mine', label: 'Meus' },
    { id: 'team', label: 'Meu time' },
    { id: 'both', label: 'Tudo' },
]

export function Header({ scope, onScope, userName }: Props) {
    return (
        <header className="hdr">
            <div className="hdr-brand">
                <img src={logo} alt="Simplifica.CAIXA" className="hdr-logo" />
            </div>

            <div className="hdr-search">
                <AiSearch scope={scope} />
            </div>

            <div className="hdr-controls">
                <div className="scope-toggle" role="tablist" aria-label="Escopo">
                    {SCOPES.map((s) => (
                        <button
                            key={s.id}
                            role="tab"
                            aria-selected={scope === s.id}
                            className={scope === s.id ? 'is-on' : ''}
                            onClick={() => onScope(s.id)}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {userName ? <span className="hdr-user" title={userName}>{userName}</span> : null}
            </div>
        </header>
    )
}
