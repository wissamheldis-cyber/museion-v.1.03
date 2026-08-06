export * from './WritingProvider'
export * from './MockWritingProvider'
export * from './LMStudioWritingProvider'

import { mockWritingProvider } from './MockWritingProvider'
import { lmStudioWritingProvider } from './LMStudioWritingProvider'
import type { WritingProvider } from './WritingProvider'

/** Registre des fournisseurs d'écriture. */
export const WRITING_PROVIDERS: WritingProvider[] = [mockWritingProvider, lmStudioWritingProvider]

/** Fournisseur actif : LM Studio via le pont local (Cloudflare Tunnel + Access). */
export const activeWritingProvider: WritingProvider = lmStudioWritingProvider
