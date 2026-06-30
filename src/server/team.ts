import { myGroupIds } from './identity.ts'
import { readAll } from './aggregations/util.ts'

// Aba "Meu time": grupos a que o usuário pertence + a estrutura (membros) de cada grupo.

function guard<T>(fn: () => T, fallback: T): T {
    try {
        return fn()
    } catch (e) {
        return fallback
    }
}

export interface TeamMember {
    sys_id: string
    name: string
    email: string
    last_login: string
}
export interface TeamGroup {
    sys_id: string
    name: string
    members: TeamMember[]
}

export function buildTeam() {
    const groupIds = myGroupIds()
    if (!groupIds.length) return { groups: [] as TeamGroup[] }

    // Nomes dos grupos.
    const names: Record<string, string> = {}
    guard(() => readAll('sys_user_group', ['name'], { where: 'sys_idIN' + groupIds.join(',') }), []).forEach((o) => {
        names[o.sys_id.value] = o.name.value
    })

    // Membros de cada grupo (dot-walk no sys_user via sys_user_grmember).
    const groups: TeamGroup[] = groupIds
        .map((gid) => {
            const members = guard(
                () =>
                    readAll('sys_user_grmember', ['user', 'user.name', 'user.email', 'user.last_login'], {
                        where: 'group=' + gid + '^user.active=true',
                        order: 'user.name',
                    }),
                [],
            )
                .map((o) => ({
                    sys_id: o.user.value,
                    name: o['user.name'].display || o['user.name'].value || '(sem nome)',
                    email: o['user.email'].display || o['user.email'].value,
                    last_login: o['user.last_login'].display || o['user.last_login'].value,
                }))
                .filter((m) => m.sys_id)
            return { sys_id: gid, name: names[gid] || gid, members }
        })
        .filter((g) => g.name)
        .sort((a, b) => a.name.localeCompare(b.name))

    return { groups }
}
