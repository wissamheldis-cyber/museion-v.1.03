"use client";
import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectNotFound } from "@/components/layout/ProjectNotFound";
import { useProjectScope } from "@/components/layout/useProjectFromRoute";
import { useMuseionStore } from "@/store/museionStore";
import { Button } from "@/components/ui/Button";
import { cn, formatDate, generateId } from "@/lib/utils";
import { Play, Copy, RefreshCw, XCircle, ArrowRightCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProductionPage() {
  const { project, slug } = useProjectScope();
  const projectId = project?.id || '';
  const store = useMuseionStore();
  const [filter, setFilter] = useState("all");
  const [selectedJobId, setSelectedJobId] = useState<string|null>(null);

  if (!project) return <ProjectNotFound slug={slug} />;

  const jobs = (store.productionJobs || []).filter(j => j.projectId === projectId);
  const filteredJobs = filter === "all" ? jobs : jobs.filter(j => j.status === filter);
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "draft": case "cancelled": return "text-[var(--text-muted)]";
      case "queued": return "text-[var(--text-secondary)]";
      case "running": case "review_required": return "text-[var(--state-warn)]";
      case "approved": return "text-[var(--state-ok)]";
      case "failed": return "text-[var(--state-danger)]";
      default: return "text-[var(--text-primary)]";
    }
  };

  const simulateMockRun = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    // Si c'est un draft, on le met d'abord en file d'attente
    if (job.status === 'draft') {
      store.updateProductionJob(jobId, { status: 'queued' });
    }

    setTimeout(() => {
      store.startProductionJob(jobId);
      
      setTimeout(() => {
        // Create an ephemeral asset
        const assetId = generateId();
        const res = {
          id: assetId,
          status: "ephemeral" as const,
          isSimulation: true as const,
          url: "https://placehold.co/800x400/222/FFF?text=Mock+Production",
          prompt: job.prompt,
          simulatedModel: "Production Model v2",
          generatedAt: new Date().toISOString(),
          disclaimer: "Mock de production généré localement"
        };
        store.registerPreview(res, { projectId, name: `Prod - ${job.prompt.substring(0, 15)}`, sceneId: job.sceneId });
        store.completeProductionJob(jobId, assetId);
      }, 2000);
    }, 500);
  };

  return (
    <AppShell projectSlug={slug}>
      <div className="flex h-full text-sm text-[var(--text-primary)]">
        <div className="flex-1 flex flex-col p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl">Production Queue</h1>
            <Button onClick={() => store.addProductionJob({ 
              projectId, kind: "image", status: "draft", label: "Mock Preview", prompt: "Nouveau job",
              ratio: "16:9", resolution: "1920x1080", seed: "", quality: "standard", provider: "mock"
            })}>
              Nouveau Job
            </Button>
          </div>
          
          {jobs.length === 0 ? (
             <EmptyState
              title="File de Production"
              role="Gérez les calculs de prévisualisation et de production en attente."
              inputs={["Jobs depuis l'Écriture ou la Prévis", "Paramètres de génération"]}
              outputs={["Assets de Review", "Suivi de progression"]}
              dependencies={["MockPreviewProvider", "Store V4"]}
            />
          ) : (
            <>
              <div className="flex gap-2 mb-4 border-b border-[var(--border-subtle)] pb-2">
                {["all", "draft", "queued", "running", "review_required", "approved", "failed"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1 rounded label-caps", filter === f ? "bg-[var(--bg-card)] text-[var(--interactive)]" : "text-[var(--text-muted)]")}>
                    {f}
                  </button>
                ))}
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    <th className="py-2">Prompt</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Statut</th>
                    <th className="py-2">Créé le</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => (
                    <tr key={job.id} onClick={() => setSelectedJobId(job.id)} className={cn("border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] cursor-pointer", selectedJobId === job.id && "bg-[var(--bg-surface)]")}>
                      <td className="py-3 max-w-[200px] truncate" title={job.prompt}>{job.prompt || "-"}</td>
                      <td className="py-3 label-caps">{job.kind}</td>
                      <td className={cn("py-3 font-medium", getStatusColor(job.status))}>{job.status}</td>
                      <td className="py-3 metric text-[var(--text-muted)]">{formatDate(job.createdAt || "")}</td>
                      <td className="py-3 flex justify-end gap-2">
                        {job.status === "draft" && <Button size="sm" variant="ghost" title="Mettre en file d'attente (Mock)" onClick={(e) => { e.stopPropagation(); simulateMockRun(job.id); }}><Play className="w-4 h-4"/></Button>}
                        {job.status === "queued" && <Button size="sm" variant="ghost" title="Lancer le rendu (Mock)" onClick={(e) => { e.stopPropagation(); simulateMockRun(job.id); }}><Play className="w-4 h-4"/></Button>}
                        {(job.status === "running" || job.status === "queued") && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); store.cancelProductionJob(job.id); }}><XCircle className="w-4 h-4"/></Button>}
                        {job.status === "failed" && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); store.retryProductionJob(job.id); }}><RefreshCw className="w-4 h-4"/></Button>}
                        <Button size="sm" variant="ghost" title="Dupliquer" onClick={(e) => { e.stopPropagation(); store.duplicateProductionJob(job.id); }}><Copy className="w-4 h-4"/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {selectedJob && (
          <div className="w-80 border-l border-[var(--border-subtle)] p-6 bg-[var(--bg-surface)] flex flex-col gap-4 overflow-auto">
            <h2 className="text-lg font-semibold">Détails du Job</h2>
            <div>
              <span className="label-caps text-[var(--text-muted)]">ID</span>
              <div className="metric truncate" title={selectedJob.id}>{selectedJob.id}</div>
            </div>
            <div>
              <span className="label-caps text-[var(--text-muted)]">Prompt</span>
              <div className="p-2 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded mt-1">{selectedJob.prompt || "-"}</div>
            </div>
            <div>
              <span className="label-caps text-[var(--text-muted)]">Paramètres</span>
              <div className="p-2 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded mt-1 text-xs grid grid-cols-2 gap-2">
                <div>Ratio: <br/><strong>{selectedJob.ratio}</strong></div>
                <div>Résol.: <br/><strong>{selectedJob.resolution}</strong></div>
                <div>Qualité: <br/><strong>{selectedJob.quality}</strong></div>
                <div>Seed: <br/><strong>{selectedJob.seed || "Auto"}</strong></div>
              </div>
            </div>
            {selectedJob.referenceAssetIds && selectedJob.referenceAssetIds.length > 0 && (
               <div>
                 <span className="label-caps text-[var(--text-muted)]">Références (IDs)</span>
                 <ul className="list-disc list-inside text-xs mt-1">
                   {selectedJob.referenceAssetIds.map(id => <li key={id}>{id}</li>)}
                 </ul>
               </div>
            )}
            
            <div className="mt-auto flex flex-col gap-2">
              {selectedJob.status === "review_required" && (
                <Button onClick={() => store.approveProductionJob(selectedJob.id)}>Approuver</Button>
              )}
              {selectedJob.status === "draft" && (
                <Button onClick={() => simulateMockRun(selectedJob.id)} className="w-full">
                  <Play className="w-4 h-4 mr-2" /> Démarrer (Mock)
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
