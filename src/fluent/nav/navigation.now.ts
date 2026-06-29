import '@servicenow/sdk/global'
import { ApplicationMenu, Record } from '@servicenow/sdk/core'

const menu = ApplicationMenu({
    $id: Now.ID['app_menu'],
    title: 'Simplifica.CAIXA',
    hint: 'Painel unificado dos seus registros e do seu time',
    description: 'Mesa de trabalho única: tudo atribuído a você e aos seus grupos.',
    roles: [],
    active: true,
    order: 100,
})

Record({
    $id: Now.ID['mod_painel'],
    table: 'sys_app_module',
    data: {
        title: 'Painel Unificado',
        application: menu,
        link_type: 'DIRECT',
        query: 'x_snc_painel_unif_painel.do',
        roles: [],
        active: true,
        order: 100,
    },
})

Record({
    $id: Now.ID['mod_console'],
    table: 'sys_app_module',
    data: {
        title: 'Console por Solução',
        application: menu,
        link_type: 'DIRECT',
        query: 'x_snc_painel_unif_console.do',
        roles: [],
        active: true,
        order: 110,
    },
})
