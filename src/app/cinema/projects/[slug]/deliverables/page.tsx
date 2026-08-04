"use client";
import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectNotFound } from "@/components/layout/ProjectNotFound";
import { useProjectScope } from "@/components/layout/useProjectFromRoute";
import { useMuseionStore } from "@/store/museionStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn, formatDate } from "@/lib/utils";
import { Download, FileJson, Check, PackagePlus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DeliverablesPage() {
  const { project, slug } = useProjectScope();
  const projectId = project?.id || '';
  const store = useMuseionStore();
  const [newTitle, setNewTitle] = useState("");
  const [selectedPkgId, setSelectedPkgId] = useState<string|null>(null);

  if (!project) return <ProjectNotFound slug={slug} />;

  const packages = store.deliverablePackages?.filter(p => p.projectId === projectId) || [];
  const selectedPkg = packages.find(p => p.id === selectedPkgId);

  const handleCreate = () => {
    if (!newTitle) return;
    const pkg = store.createDeliverablePackage(projectId, newTitle);
    setSelectedPkgId(pkg.id);
    setNewTitle("");
  };

  const toggleSection = (sectionId: string, current: boolean) => {
    if (selectedPkgId) store.updateDeliverableSection(selectedPkgId, sectionId, !current);
  };

  const handleExport = (type: 'html' | 'json') => {
    if (selectedPkgId && selectedPkg) {
      store.markDeliverableExported(selectedPkgId);
      
      let content = "";
      let mimeType = "";
      let filename = "";

      if (type === 'html') {
        content = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${selectedPkg.title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333; }
  h1 { border-bottom: 2px solid #eaeaea; padding-bottom: 0.5rem; }
  h2 { margin-top: 2rem; color: #555; }
  .section { margin-bottom: 2rem; padding: 1rem; background: #fafafa; border: 1px solid #eaeaea; border-radius: 8px; }
</style>
</head>
<body>
<h1>${selectedPkg.title}</h1>
<p><em>Généré par Museion le ${new Date().toLocaleDateString()}</em></p>
${selectedPkg.sections.filter(s => s.included).map(s => `
  <div class="section">
    <h2>${s.label}</h2>
    <p>Contenu issu du projet (Mock pour ${s.label})...</p>
  </div>
`).join('\n')}
</body>
</html>`;
        mimeType = 'text/html';
        filename = `${selectedPkg.title.replace(/\s+/g, '_')}.html`;
      } else {
        content = JSON.stringify(selectedPkg, null, 2);
        mimeType = 'application/json';
        filename = `${selectedPkg.title.replace(/\s+/g, '_')}.json`;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <AppShell>
      <div className="flex h-full text-sm text-[var(--text-primary)]">
        <div className="w-72 border-r border-[var(--border-subtle)] p-4 bg-[var(--bg-surface)] flex flex-col gap-4 overflow-auto">
          <h2 className="label-caps text-[var(--text-secondary)]">Packages</h2>
          <div className="flex gap-2">
            <Input placeholder="Titre du package" value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            <Button onClick={handleCreate}><PackagePlus className="w-4 h-4"/></Button>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {packages.map(p => (
              <button key={p.id} onClick={() => setSelectedPkgId(p.id)} className={cn("p-3 rounded text-left border border-[var(--border-subtle)]", selectedPkgId === p.id ? "bg-[var(--bg-card)] border-[var(--border-default)]" : "hover:bg-[var(--bg-card-hover)]")}>
                <div className="font-medium truncate">{p.title}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-[var(--text-muted)] label-caps">{p.sections.filter(s=>s.included).length} sections</span>
                  <span className="text-xs text-[var(--text-muted)] metric">{formatDate(p.createdAt || "")}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-8 bg-[var(--bg-base)] overflow-auto">
          {selectedPkg ? (
            <div className="max-w-3xl mx-auto flex flex-col gap-8">
              <div className="flex justify-between items-end border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <h1 className="text-3xl font-light mb-1">{selectedPkg.title}</h1>
                  <div className="text-[var(--text-muted)] flex gap-4">
                    <span>Créé le {formatDate(selectedPkg.createdAt || "")}</span>
                    {selectedPkg.exportedAt && <span className="text-[var(--state-ok)]">Exporté le {formatDate(selectedPkg.exportedAt)}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => handleExport('json')}><FileJson className="w-4 h-4 mr-2"/> JSON</Button>
                  <Button onClick={() => handleExport('html')}><Download className="w-4 h-4 mr-2"/> HTML</Button>
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-6">
                <h3 className="text-lg mb-4">Contenu du package</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedPkg.sections.map(sec => (
                    <div key={sec.id} className="flex items-center gap-3 p-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded cursor-pointer hover:border-[var(--border-default)]" onClick={() => toggleSection(sec.id, sec.included)}>
                      <div className={cn("w-5 h-5 rounded flex items-center justify-center border", sec.included ? "bg-[var(--interactive)] border-[var(--interactive)] text-black" : "border-[var(--border-subtle)] text-transparent")}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={cn(!sec.included && "text-[var(--text-muted)]")}>{sec.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-6">
                <h3 className="text-lg mb-4">Aperçu du sommaire</h3>
                <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)]">
                  {selectedPkg.sections.filter(s => s.included).map(s => (
                    <li key={s.id}>{s.label}</li>
                  ))}
                  {selectedPkg.sections.filter(s => s.included).length === 0 && <li className="text-[var(--text-muted)] list-none">Aucune section incluse</li>}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                title="Livrables et Exports"
                role="Compilez votre projet en documents finaux à partager avec l'équipe ou les producteurs."
                inputs={["Sections du projet (Logline, Synopsis, Scénario)", "Assets canoniques"]}
                outputs={["Package HTML interactif", "Export JSON complet"]}
                dependencies={["Toutes les autres sections"]}
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
