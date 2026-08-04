import { redirect } from 'next/navigation'

/**
 * Ancienne route Sprint 1. Les plans techniques vivent désormais
 * sous /plans (voir DECISION_LOG.md — Sprint 2).
 */
export default function ShotsRedirectPage() {
  redirect('/cinema/projects/gilgamesh/plans')
}
