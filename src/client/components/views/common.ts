import type { InboxItem, Summary } from '../../shared/api'
import type { PersonaTemplate } from '../../shared/templates'
import type { Visibility } from '../../shared/visibility'

// Props comuns a todas as visões do dashboard.
export interface ViewProps {
    summary: Summary
    vis: Visibility
    template: PersonaTemplate
    items: InboxItem[]
    loadingList: boolean
    lens: string
    onLens: (l: string) => void
    // Drill-down: aplica a lente E leva o usuário para a visão Foco (inbox).
    onDrill: (l: string) => void
}

export function prioClass(p: string): string {
    switch (p) {
        case '1':
            return 'p1'
        case '2':
            return 'p2'
        case '3':
            return 'p3'
        default:
            return 'p4'
    }
}

export function openItem(item: InboxItem) {
    if (item.deeplink && item.deeplink !== '#') window.open(item.deeplink, '_blank')
}
