import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import consoleHtml from '../../client/console/index.html'

// Painel novo (cards por solução) — convive com o painel atual sem alterá-lo.
UiPage({
    $id: Now.ID['ui_console'],
    endpoint: 'x_snc_painel_unif_console.do',
    description: 'Simplifica.CAIXA — Console por solução',
    category: 'general',
    html: consoleHtml,
    direct: true,
})
