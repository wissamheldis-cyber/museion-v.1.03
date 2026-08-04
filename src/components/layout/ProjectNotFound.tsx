import Link from 'next/link'

export function ProjectNotFound({ slug }: { slug: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <p className="label-caps">Projet introuvable</p>
        <h2 className="mt-2 text-xl font-medium text-[var(--text-primary)]">
          Aucun projet ne correspond à « {slug} »
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Le projet a peut-être été renommé, archivé ou supprimé. Aucune donnée d’un autre projet
          n’est affichée à la place.
        </p>
        <Link
          href="/cinema/projects"
          className="mt-6 inline-block text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          ← Tous les projets
        </Link>
      </div>
    </div>
  )
}
