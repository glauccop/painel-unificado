// Declarações ambient de módulos de assets para o bundler/TS.
// (arquivo de script — sem import/export — para manter as declarações globais)
declare module '*.scss' {
    const content: string
    export default content
}
declare module '*.css' {
    const content: string
    export default content
}
declare module '*.png' {
    const content: string
    export default content
}
declare module '*.svg' {
    const content: string
    export default content
}

interface Window {
    g_ck: string
}
