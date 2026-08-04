"use client";
import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectNotFound } from "@/components/layout/ProjectNotFound";
import { useProjectScope } from "@/components/layout/useProjectFromRoute";
import { useMuseionStore } from "@/store/museionStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn, generateId } from "@/lib/utils";
import { Play, Copy, RefreshCw, XCircle, Image as ImageIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Asset } from "@/lib/types-storyboard";

export default function PrevisPage() {
  const { project, slug, scenes, shots, assets } = useProjectScope();
  const projectId = project?.id || '';
  const store = useMuseionStore();
  
  const [sceneId, setSceneId] = useState("");
  const [shotId, setShotId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [settings, setSettings] = useState<{ quality: "draft" | "standard" | "high", ratio: string, resolution: string }>({ quality: "standard", ratio: "16:9", resolution: "1920x1080" });
  const [seed, setSeed] = useState("");
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
  const [previewResult, setPreviewResult] = useState<Asset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!project) return <ProjectNotFound slug={slug} />;

  const filteredShots = shots.filter(s => s.sceneId === sceneId);
  const referenceAssets = (assets || []).filter(a => a.status === "canonical" || a.status === "approved");

  const getPromptForPreview = () => {
    let finalPrompt = prompt;
    if (!finalPrompt) {
      const scene = scenes.find(s => s.id === sceneId);
      const shot = shots.find(s => s.id === shotId);
      finalPrompt = `${scene?.title || "Scène"} - ${shot?.type || "Plan"}`;
    }
    return finalPrompt;
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const assetId = generateId();
      const asset = {
        id: assetId,
        status: "ephemeral" as const,
        isSimulation: true as const,
        url: "https://placehold.co/800x400/222/FFF?text=Mock+Preview",
        prompt: getPromptForPreview(),
        simulatedModel: "Preview Model v1",
        generatedAt: new Date().toISOString(),
        disclaimer: "Simulation locale de prévisualisation"
      };
      setPreviewResult(asset as any);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSaveToProduction = () => {
    if (!previewResult) return;
    
    // Register the preview as an actual asset first
    store.registerPreview(previewResult as any, { projectId, name: `Preview - ${getPromptForPreview().substring(0, 15)}`, sceneId, shotId });
    
    // Then create a production job with it as reference
    store.addProductionJob({
      projectId,
      sceneId,
      shotId,
      label: "Depuis la Prévis",
      kind: "image",
      status: "draft",
      prompt: getPromptForPreview(),
      ratio: settings.ratio,
      resolution: settings.resolution,
      seed,
      quality: settings.quality,
      provider: "mock",
      referenceAssetIds: [previewResult.id, ...selectedReferences]
    });
    
    setPreviewResult(null);
    alert("Job de production créé (brouillon) et asset sauvegardé.");
  };

  return (
    <AppShell>
      <div className="flex h-full text-sm text-[var(--text-primary)]">
        <div className="w-80 border-r border-[var(--border-subtle)] p-4 bg-[var(--bg-surface)] flex flex-col gap-6 overflow-auto">
          <div>
            <h2 className="label-caps text-[var(--text-secondary)] mb-2">Contexte</h2>
            <select className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-2 mb-2" value={sceneId} onChange={e=>{setSceneId(e.target.value); setShotId("");}}>
              <option value="">Sélectionner une scène...</option>
              {scenes.map(s => <option key={s.id} value={s.id}>Scène {s.number} - {s.title}</option>)}
            </select>
            <select className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-2" value={shotId} onChange={e=>setShotId(e.target.value)} disabled={!sceneId}>
              <option value="">Sélectionner un plan...</option>
              {filteredShots.map(s => <option key={s.id} value={s.id}>Plan {s.number} ({s.type})</option>)}
            </select>
          </div>

          <div>
            <h2 className="label-caps text-[var(--text-secondary)] mb-2">Génération</h2>
            <textarea 
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-2 mb-2 min-h-[80px]" 
              placeholder="Description détaillée du rendu souhaité (override)..."
              value={prompt}
              onChange={e=>setPrompt(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Input placeholder="Ratio (ex: 16:9)" value={settings.ratio} onChange={e=>setSettings({...settings, ratio: e.target.value})} />
              <Input placeholder="Résolution" value={settings.resolution} onChange={e=>setSettings({...settings, resolution: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-2" value={settings.quality} onChange={e=>setSettings({...settings, quality: e.target.value as any})}>
                <option value="draft">Brouillon</option>
                <option value="standard">Standard</option>
                <option value="high">Haute qualité</option>
              </select>
              <Input placeholder="Seed (optionnel)" value={seed} onChange={e=>setSeed(e.target.value)} />
            </div>
          </div>
          
          <Button onClick={handleGenerate} disabled={isGenerating || !sceneId} className="w-full justify-center">
            {isGenerating ? "Génération en cours..." : "Générer la Prévis (Mock)"}
          </Button>

          {referenceAssets.length > 0 && (
            <div>
              <h2 className="label-caps text-[var(--text-secondary)] mb-2 mt-4">Références (Canoniques/Approuvés)</h2>
              <div className="grid grid-cols-3 gap-2">
                {referenceAssets.map(a => (
                  <div key={a.id} onClick={() => setSelectedReferences(prev => prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id])} className={cn("aspect-square rounded border cursor-pointer overflow-hidden", selectedReferences.includes(a.id) ? "border-[var(--interactive)]" : "border-[var(--border-subtle)] opacity-60 hover:opacity-100")}>
                    {a.url ? <img src={a.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[var(--bg-base)] flex items-center justify-center text-[10px]"><ImageIcon className="w-4 h-4"/></div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col p-6 bg-[var(--bg-base)] overflow-auto items-center justify-center">
          {previewResult ? (
            <div className="max-w-2xl w-full flex flex-col gap-4">
               <div className="aspect-video bg-black rounded-lg border border-[var(--border-default)] overflow-hidden relative">
                 <img src={previewResult.url} alt="Preview" className="w-full h-full object-cover" />
                 <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                   {(previewResult as any).simulatedModel} - {(previewResult as any).disclaimer}
                 </div>
               </div>
               <div className="flex justify-between items-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-lg">
                 <div className="text-sm">
                   <div className="font-medium mb-1">Résultat Éphémère</div>
                   <div className="text-[var(--text-muted)] text-xs">Prompt: {previewResult.prompt}</div>
                 </div>
                 <div className="flex gap-2">
                   <Button variant="secondary" onClick={() => setPreviewResult(null)}>Ignorer</Button>
                   <Button onClick={handleSaveToProduction}>Envoyer en Production</Button>
                 </div>
               </div>
            </div>
          ) : (
            <EmptyState
              title="Studio de Prévisualisation"
              role="Générez des maquettes rapides pour vos scènes et plans avant de lancer la production finale."
              inputs={["Sélection de Scène / Plan", "Paramètres de génération", "Références visuelles"]}
              outputs={["Aperçu éphémère", "Jobs de production préparés"]}
              dependencies={["Scénario", "MockPreviewProvider"]}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
