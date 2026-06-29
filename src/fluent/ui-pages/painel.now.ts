import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import painelHtml from '../../client/index.html'

UiPage({
    $id: Now.ID['ui_painel'],
    endpoint: 'x_snc_painel_unif_painel.do',
    description: 'Simplifica.CAIXA — Painel Unificado',
    category: 'general',
    html: painelHtml,
    direct: true,
})
