import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    acl_painel_read: {
                        table: 'sys_security_acl'
                        id: 'b659498fff5241ebb7315d9520f0a9d8'
                        deleted: true
                    }
                    app_menu: {
                        table: 'sys_app_application'
                        id: 'f094b49cebf947718108d79eae75db09'
                    }
                    'app.css': {
                        table: 'sys_ux_theme_asset'
                        id: '6551661b731d41ad98a1996863349f8f'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: '303518078b234442b14b2526e8f73066'
                    }
                    mod_console: {
                        table: 'sys_app_module'
                        id: 'd35c22aedb9c4508991f9107c091a801'
                    }
                    mod_painel: {
                        table: 'sys_app_module'
                        id: '61c2d643acb94d05943803d0bdc8bb51'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'e53ca48e8a9741d985a978a388668cbf'
                    }
                    rest_painel: {
                        table: 'sys_ws_definition'
                        id: '25e2f910b9c54078a4ca86897f417b84'
                    }
                    rest_painel_console: {
                        table: 'sys_ws_operation'
                        id: 'bd4e3e13de684ec699c81f0d2894a9d7'
                    }
                    rest_painel_historico: {
                        table: 'sys_ws_operation'
                        id: 'f877959538404f73b0c0aa780def5756'
                    }
                    rest_painel_list: {
                        table: 'sys_ws_operation'
                        id: '617fccbe3ade4efbbc768242bf26f3c6'
                    }
                    rest_painel_search: {
                        table: 'sys_ws_operation'
                        id: 'a8a4d6dc54244b55822f70b1c4bda086'
                    }
                    rest_painel_summary: {
                        table: 'sys_ws_operation'
                        id: '2a553e2546d54381879842587e2cbe4a'
                    }
                    rest_painel_team: {
                        table: 'sys_ws_operation'
                        id: '45a4a72e983c4e21a3f22e360edf23c8'
                    }
                    src_server_aggregations_util_ts: {
                        table: 'sys_module'
                        id: 'b8b4cd85afc9496ab60f530b9ecd555e'
                    }
                    src_server_aisearch_ts: {
                        table: 'sys_module'
                        id: '9719bf6338fc4cfa810e01eb99f68043'
                    }
                    src_server_catalog_ts: {
                        table: 'sys_module'
                        id: 'd97bc1771d1e465ab31d5e55c938b3c6'
                    }
                    src_server_console_ts: {
                        table: 'sys_module'
                        id: 'f6eb63792f1d46e7802bb94b24601204'
                    }
                    src_server_historico_ts: {
                        table: 'sys_module'
                        id: '640ee67bf1bf4163ae39a682c65f74da'
                    }
                    src_server_identity_ts: {
                        table: 'sys_module'
                        id: 'b9c6406dcc164e00a09b3a7d0e6dc64d'
                    }
                    src_server_list_ts: {
                        table: 'sys_module'
                        id: 'fc797d252f9042c2b7d7cee1402ceb4c'
                    }
                    'src_server_painel-handler_ts': {
                        table: 'sys_module'
                        id: '2624dd242007465791f059f1bb95a003'
                    }
                    src_server_routes_ts: {
                        table: 'sys_module'
                        id: 'd20bb651c0eb48e6ae500fe931641d6c'
                    }
                    src_server_summary_ts: {
                        table: 'sys_module'
                        id: '1c8dd4bfa77b44329d645dbf2fa5e0a5'
                    }
                    src_server_team_ts: {
                        table: 'sys_module'
                        id: 'bb11e6f305184f0290b8f90f9857a438'
                    }
                    'x_snc_painel_unif/assets/logo_default.png': {
                        table: 'db_image'
                        id: '14b57821e92043069ed5574d367cdbd7'
                    }
                    'x_snc_painel_unif/assets/logo-simplifica-mark.png': {
                        table: 'db_image'
                        id: 'ca3291f03ed94fc0ac292eac2013449f'
                        deleted: true
                    }
                    'x_snc_painel_unif/assets/logo-simplifica.png': {
                        table: 'db_image'
                        id: '56834bbabd5e4c30a4070847f98d6ccb'
                        deleted: true
                    }
                }
                composite: [
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '1ee81e85c7444c3ab7403e22aaac9750'
                        key: {
                            application_file: '7260bd1f8732429bbe02a258b6a9bc89'
                            source_artifact: '62ee38c69cd3478688c76d51ff7d8249'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '283c8224187a4bd688f76a4ca14bafac'
                        key: {
                            name: 'x_snc_painel_unif/console/main'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '366f2e826bca4548b2814fa93735f350'
                        key: {
                            application_file: 'a7a06b9c75964112a36cb340400f4474'
                            source_artifact: '62ee38c69cd3478688c76d51ff7d8249'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: '39697554542744dc830749c8febbe428'
                        key: {
                            endpoint: 'x_snc_painel_unif_painel.do'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '3cb87d72562c48d791f5837322538461'
                        key: {
                            application_file: 'a7a06b9c75964112a36cb340400f4474'
                            source_artifact: 'b3da164685bb4b4f87dd83620efb6f8a'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '410e3068877b414e917df4fb327711b5'
                        key: {
                            application_file: '95606d3727104d28bed7cd28bddf9436'
                            source_artifact: 'b3da164685bb4b4f87dd83620efb6f8a'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '43171c90559b4420aab5196d64e67e9b'
                        key: {
                            application_file: 'e98ed87f3bdc48fbaf1b3efe6519e140'
                            source_artifact: 'b3da164685bb4b4f87dd83620efb6f8a'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '49fdcb37e0224a3ab56a5187db72c39c'
                        key: {
                            application_file: '39697554542744dc830749c8febbe428'
                            source_artifact: '62ee38c69cd3478688c76d51ff7d8249'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '50bd828b6821444c96d5dbb7cbfe4014'
                        key: {
                            name: 'x_snc_painel_unif/main'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '5ea65139d78a4adf9af3ad1e3b8a321c'
                        key: {
                            application_file: '50bd828b6821444c96d5dbb7cbfe4014'
                            source_artifact: '62ee38c69cd3478688c76d51ff7d8249'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: '62ee38c69cd3478688c76d51ff7d8249'
                        key: {
                            name: 'x_snc_painel_unif_painel.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7260bd1f8732429bbe02a258b6a9bc89'
                        key: {
                            name: 'x_snc_painel_unif/vendor-react-dom--966e429a.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '95606d3727104d28bed7cd28bddf9436'
                        key: {
                            name: 'x_snc_painel_unif/console/main.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a7a06b9c75964112a36cb340400f4474'
                        key: {
                            name: 'x_snc_painel_unif/vendor-react-dom--966e429a'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: 'b3da164685bb4b4f87dd83620efb6f8a'
                        key: {
                            name: 'x_snc_painel_unif_console.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b7f8402f549448458c435cf3b9d96921'
                        key: {
                            name: 'x_snc_painel_unif/main.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'ba5a1321763b46ab97bf85d70420999d'
                        key: {
                            application_file: '7260bd1f8732429bbe02a258b6a9bc89'
                            source_artifact: 'b3da164685bb4b4f87dd83620efb6f8a'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'bebb245e33a74eeabca5d5727a03a6ca'
                        key: {
                            application_file: 'b7f8402f549448458c435cf3b9d96921'
                            source_artifact: '62ee38c69cd3478688c76d51ff7d8249'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: 'e98ed87f3bdc48fbaf1b3efe6519e140'
                        key: {
                            endpoint: 'x_snc_painel_unif_console.do'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'fd99fcb83a64428b97e8310dcb549d3b'
                        key: {
                            application_file: '283c8224187a4bd688f76a4ca14bafac'
                            source_artifact: 'b3da164685bb4b4f87dd83620efb6f8a'
                        }
                    },
                ]
            }
        }
    }
}
