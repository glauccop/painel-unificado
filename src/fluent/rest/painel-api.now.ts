import '@servicenow/sdk/global'
import { RestApi } from '@servicenow/sdk/core'
import { getSummary, getList, getConsole, getSearch } from '../../server/painel-handler'

// API de leitura. Exige usuário autenticado (não-guest); a autorização por ACL
// de endpoint fica desligada porque o próprio escopo da query (assigned_to = eu /
// meus grupos) já limita os dados ao trabalho do usuário.
// Base: /api/x_snc_painel_unif/painel
RestApi({
    $id: Now.ID['rest_painel'],
    name: 'Painel Unificado API',
    serviceId: 'painel',
    produces: 'application/json',
    routes: [
        {
            $id: Now.ID['rest_painel_summary'],
            name: 'Summary',
            path: '/summary',
            method: 'GET',
            script: getSummary,
            authentication: true,
            authorization: false,
        },
        {
            $id: Now.ID['rest_painel_list'],
            name: 'List',
            path: '/list',
            method: 'GET',
            script: getList,
            authentication: true,
            authorization: false,
        },
        {
            $id: Now.ID['rest_painel_console'],
            name: 'Console',
            path: '/console',
            method: 'GET',
            script: getConsole,
            authentication: true,
            authorization: false,
        },
        {
            $id: Now.ID['rest_painel_search'],
            name: 'Search',
            path: '/search',
            method: 'GET',
            script: getSearch,
            authentication: true,
            authorization: false,
        },
    ],
})
