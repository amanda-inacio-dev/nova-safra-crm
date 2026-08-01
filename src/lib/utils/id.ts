/** Gera um id só pra uso local (ex.: key do React em uma lista) — não precisa
 *  ser criptograficamente forte, só único na tela. `crypto.randomUUID()` só
 *  existe em contexto seguro (HTTPS ou localhost); acessando o app por um IP
 *  de rede local (ex.: notebook na mesma Wi-Fi) o navegador não expõe essa
 *  função, por isso o fallback. */
export function randomLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
