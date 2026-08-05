"use client";
import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectNotFound } from "@/components/layout/ProjectNotFound";
import { useProjectScope } from "@/components/layout/useProjectFromRoute";
import { useMuseionStore } from "@/store/museionStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Check, X, MessageSquare, ListTodo, PenTool } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SuccessToast } from "@/components/ui/SuccessToast";

export default function ReviewPage() {
  const { project, slug, assets } = useProjectScope();
  const projectId = project?.id || '';
  const store = useMuseionStore();

  const reviewAssets = (assets || []).filter(a => a.status === "candidate" || a.status === "ephemeral");
  const [selectedAssetId, setSelectedAssetId] = useState<string|null>(null);
  const [compareAssetId, setCompareAssetId] = useState<string|null>(null);
  const [newComment, setNewComment] = useState("");
  const [newChecklist, setNewChecklist] = useState("");
  const [drawMode, setDrawMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!project) return <AppShell projectSlug={slug}><ProjectNotFound slug={slug} /></AppShell>;

  const selectedAsset = assets?.find(a => a.id === selectedAssetId);
  const compareAsset = assets?.find(a => a.id === compareAssetId);

  const comments = store.reviewComments?.filter(c => c.assetId === selectedAssetId) || [];
  const checklists = store.reviewChecklists?.filter(c => c.assetId === selectedAssetId) || [];

  const handleAskVariation = () => {
    if (!selectedAsset) return;
    store.addProductionJob({
      projectId,
      kind: "image",
      status: "draft",
      label: "Variation de " + (selectedAsset.name || "l'asset"),
      prompt: selectedAsset.prompt || "Variation",
      ratio: "16:9", resolution: "1920x1080", seed: "", quality: "standard",
      provider: "mock",
      referenceAssetIds: [selectedAsset.id],
      sceneId: selectedAsset.sceneId,
    });
    store.setAssetStatus(selectedAsset.id, "archived");
    setSelectedAssetId(null);
    setToast("Nouveau job de variation créé (brouillon) et asset actuel archivé.");
  };

  return (
    <AppShell projectSlug={slug}>
      <div className="flex h-full text-sm text-[var(--text-primary)]">
        <div className="w-64 border-r border-[var(--border-subtle)] p-4 bg-[var(--bg-surface)] overflow-auto">
          <h2 className="label-caps text-[var(--text-secondary)] mb-4">À revoir</h2>
          <div className="flex flex-col gap-2">
            {reviewAssets.map(a => (
              <button key={a.id} onClick={() => setSelectedAssetId(a.id)} className={cn("p-2 text-left rounded border border-[var(--border-subtle)]", selectedAssetId === a.id ? "bg-[var(--bg-card)] border-[var(--border-default)]" : "hover:bg-[var(--bg-card-hover)]")}>
                <div className="font-medium truncate">{a.name || a.prompt || a.id}</div>
                <div className="text-xs text-[var(--text-muted)] label-caps">{a.status}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col p-6 bg-[var(--bg-base)] overflow-auto">
          {selectedAsset ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl">Revue: {selectedAsset.name || selectedAsset.prompt || "Asset sans nom"}</h1>
                <div className="flex gap-2">
                  <select className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded p-1" value={compareAssetId || ""} onChange={e=>setCompareAssetId(e.target.value)}>
                    <option value="">Comparer avec...</option>
                    {(assets || []).filter(a => a.id !== selectedAssetId).map(a => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-black rounded-lg min-h-[300px] flex items-center justify-center border border-[var(--border-default)] relative overflow-hidden">
                  {selectedAsset.url ? <img src={selectedAsset.url} alt="" className="w-full h-full object-cover opacity-80" /> : <span className="text-[var(--text-muted)]">Asset Principal</span>}
                  {drawMode && (
                    <div className="absolute inset-0 pointer-events-none">
                       {/* Simulate drawing lines */}
                       <svg className="w-full h-full text-red-500" fill="none" stroke="currentColor" strokeWidth="4">
                         <path d="M 50 50 Q 150 150 250 50" />
                         <circle cx="150" cy="150" r="40" stroke="yellow" strokeWidth="3" />
                       </svg>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className={cn("absolute top-2 left-2 bg-black/50 hover:bg-black/80", drawMode && "text-red-400")} onClick={()=>setDrawMode(!drawMode)}><PenTool className="w-4 h-4 mr-2"/> Annoter</Button>
                </div>
                {compareAsset && (
                  <div className="flex-1 bg-black rounded-lg min-h-[300px] flex items-center justify-center border border-[var(--border-default)] relative overflow-hidden">
                    {compareAsset.url ? <img src={compareAsset.url} alt="" className="w-full h-full object-cover opacity-80" /> : <span className="text-[var(--text-muted)]">Asset Comparé</span>}
                    <Button variant="ghost" size="sm" className="absolute top-2 right-2 bg-black/50" onClick={()=>setCompareAssetId(null)}><X className="w-4 h-4"/></Button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mb-6">
                <Button className="bg-[var(--state-ok)] text-black hover:opacity-90" onClick={() => { store.setAssetStatus(selectedAsset.id, "approved"); setSelectedAssetId(null); }}><Check className="w-4 h-4 mr-2"/> Approuver</Button>
                <Button className="bg-[var(--state-danger)] text-white hover:opacity-90" onClick={() => { store.setAssetStatus(selectedAsset.id, "archived"); setSelectedAssetId(null); }}><X className="w-4 h-4 mr-2"/> Rejeter</Button>
                <Button variant="secondary" onClick={handleAskVariation}>Demander Variation</Button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="flex items-center gap-2 mb-3 text-[var(--text-secondary)]"><MessageSquare className="w-4 h-4"/> Commentaires</h3>
                  <div className="flex flex-col gap-2 mb-3">
                    {comments.map(c => (
                      <div key={c.id} className="p-2 bg-[var(--bg-surface)] rounded border border-[var(--border-subtle)] flex justify-between">
                        <span>{c.content}</span>
                        <Button variant="ghost" size="sm" onClick={()=>store.removeReviewComment(c.id)}><X className="w-3 h-3"/></Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Ajouter un commentaire..." onKeyDown={e => { if(e.key === 'Enter' && newComment) { store.addReviewComment(projectId, selectedAsset.id, newComment); setNewComment(""); } }} />
                    <Button onClick={() => { if(newComment) { store.addReviewComment(projectId, selectedAsset.id, newComment); setNewComment(""); } }}>Envoyer</Button>
                  </div>
                </div>
                <div>
                  <h3 className="flex items-center gap-2 mb-3 text-[var(--text-secondary)]"><ListTodo className="w-4 h-4"/> Checklist</h3>
                  <div className="flex flex-col gap-2 mb-3">
                    {checklists.map(c => (
                      <div key={c.id} className="flex items-center gap-2 p-2 bg-[var(--bg-surface)] rounded border border-[var(--border-subtle)]">
                        <input type="checkbox" checked={c.checked} onChange={() => store.toggleReviewChecklist(c.id)} />
                        <span className={cn(c.checked && "line-through text-[var(--text-muted)]")}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={newChecklist} onChange={e=>setNewChecklist(e.target.value)} placeholder="Nouveau point..." onKeyDown={e => { if(e.key === 'Enter' && newChecklist) { store.addReviewChecklist(projectId, selectedAsset.id, newChecklist); setNewChecklist(""); } }} />
                    <Button onClick={() => { if(newChecklist) { store.addReviewChecklist(projectId, selectedAsset.id, newChecklist); setNewChecklist(""); } }}>Ajouter</Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center">
              <EmptyState
                title="Revue et Validation"
                role="Inspectez les rendus, comparez les versions et décidez du statut de chaque asset."
                inputs={["Assets en attente de revue"]}
                outputs={["Approbations", "Demandes de variation", "Checklists validées"]}
                dependencies={["Moteur de Production"]}
              />
            </div>
          )}
        </div>
      </div>
      <SuccessToast message={toast} onDismiss={() => setToast(null)} />
    </AppShell>
  );
}
