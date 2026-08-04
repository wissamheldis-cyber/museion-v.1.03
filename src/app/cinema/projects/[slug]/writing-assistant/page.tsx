"use client";
import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectNotFound } from "@/components/layout/ProjectNotFound";
import { useProjectScope } from "@/components/layout/useProjectFromRoute";
import { useMuseionStore } from "@/store/museionStore";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { cn, generateId } from "@/lib/utils";
import { Send, Plus, Check, ArrowRightToLine } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const mockWritingProvider = { generate: async (_m: unknown, _h: unknown) => ({ id: generateId(), role: "assistant" as const, content: "Réponse simulée", timestamp: Date.now() }), isSimulation: true, isActive: true, label: "Mock GPT" };

export default function WritingAssistantPage() {
  const { project, slug } = useProjectScope();
  const projectId = project?.id || '';
  const store = useMuseionStore();
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState<import('@/lib/types-sprint4').WritingTarget>("logline");
  const [newContext, setNewContext] = useState("");
  const [inputMsg, setInputMsg] = useState("");
  const [classification, setClassification] = useState<import('@/lib/types-sprint4').WritingClassification>("open-question");
  const [insertModalTarget, setInsertModalTarget] = useState<{ id: string; content: string; type: 'message' | 'variant' } | null>(null);
  const [insertSubField, setInsertSubField] = useState<string>("");

  if (!project) return <ProjectNotFound slug={slug} />;

  const missions = store.writingMissions?.filter(m => m.projectId === projectId) || [];
  const activeMission = missions.find(m => m.id === activeMissionId);
  const messages = store.writingMessages?.filter(m => m.missionId === activeMissionId) || [];
  const variants = store.writingVariants?.filter(v => v.missionId === activeMissionId) || [];

  const handleCreate = () => {
    if (!newTitle) return;
    const m = store.addWritingMission(projectId, newTitle, newTarget, newContext);
    setActiveMissionId(m.id);
    setNewTitle(""); setNewContext("");
  };

  const handleSend = async () => {
    if (!inputMsg || !activeMissionId) return;
    store.addWritingMessage(activeMissionId, "user", inputMsg, classification);
    setInputMsg("");
    if (mockWritingProvider.isActive) {
      const resp = await mockWritingProvider.generate(activeMission, messages);
      store.addWritingMessage(activeMissionId, "assistant", resp.content, "decision");
    }
  };

  const handleInsert = () => {
    if (!insertModalTarget || !activeMission) return;
    const content = insertModalTarget.content;
    const target = activeMission.target;

    if (target === 'logline') {
      store.updateProject(projectId, { logline: content });
    } else if (target === 'synopsis') {
      const field = insertSubField || 'short';
      store.updateProject(projectId, { synopsis: { ...(project.synopsis || { short: '', long: '', beginning: '', development: '', resolution: '' }), [field]: content } });
    } else if (target === 'vision') {
      const field = insertSubField || 'promise';
      store.updateProject(projectId, { vision: { ...(project.vision || { promise: '', intention: '', theme: '', world: '', conflict: '', arc: '', tone: '', audience: '', duration: '', references: [] }), [field]: content } });
    } else {
      // Pour les autres cibles (treatment, characters, script), on simule l'insertion
      alert(`Simulation : Insertion dans ${target} avec succès.`);
    }
    setInsertModalTarget(null);
  };

  return (
    <AppShell projectSlug={slug}>
      <div className="flex h-full text-sm text-[var(--text-primary)]">
        <div className="w-64 border-r border-[var(--border-subtle)] p-4 flex flex-col gap-4 bg-[var(--bg-surface)]">
          <h2 className="label-caps text-[var(--text-secondary)]">Missions</h2>
          <div className="flex flex-col gap-2">
            <Input placeholder="Titre" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <select className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-1 text-[var(--text-primary)]" value={newTarget} onChange={e=>setNewTarget(e.target.value as import('@/lib/types-sprint4').WritingTarget)}>
              <option value="logline">Logline</option>
              <option value="synopsis">Synopsis</option>
              <option value="treatment">Treatment</option>
              <option value="characters">Personnages</option>
            </select>
            <Textarea placeholder="Contexte" value={newContext} onChange={e => setNewContext(e.target.value)} />
            <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2"/> Créer</Button>
          </div>
          <div className="flex-1 overflow-auto flex flex-col gap-1">
            {missions.map(m => (
              <button key={m.id} onClick={() => setActiveMissionId(m.id)} className={cn("text-left px-2 py-1 rounded hover:bg-[var(--bg-card-hover)]", activeMissionId === m.id && "bg-[var(--bg-card)]")}>
                {m.title}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-[var(--bg-base)]">
          <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-surface)]">
            <h1 className="text-lg">{activeMission ? activeMission.title : "Sélectionnez une mission"}</h1>
            <div className="text-xs text-[var(--text-muted)]">Provider: {mockWritingProvider.label} {mockWritingProvider.isSimulation && "(Sim)"}</div>
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
            {messages.map(msg => (
              <div key={msg.id} className={cn("max-w-2xl p-3 rounded-md", msg.role === "user" ? "ml-auto bg-[var(--bg-card)] border border-[var(--border-default)]" : "mr-auto bg-[var(--bg-surface)] border border-[var(--border-subtle)]")}>
                <div className="text-xs text-[var(--text-muted)] mb-1 flex justify-between gap-4">
                  <span>{msg.role === "user" ? "Vous" : "Assistant"}</span>
                  {msg.classification && <span className="label-caps">{msg.classification}</span>}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.role === 'assistant' && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setInsertModalTarget({ id: msg.id, content: msg.content, type: 'message' })}>
                    <ArrowRightToLine className="w-3 h-3 mr-1" /> Insérer
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex gap-2">
            <select className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded px-2" value={classification} onChange={e=>setClassification(e.target.value as import('@/lib/types-sprint4').WritingClassification)}>
              <option value="question">Question</option>
              <option value="decision">Décision</option>
              <option value="hypothesis">Hypothèse</option>
            </select>
            <Input className="flex-1" value={inputMsg} onChange={e=>setInputMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Message..." />
            <Button onClick={handleSend}><Send className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="w-80 border-l border-[var(--border-subtle)] p-4 flex flex-col gap-4 bg-[var(--bg-surface)]">
          <h2 className="label-caps text-[var(--text-secondary)]">Variantes</h2>
          {activeMissionId && <Button variant="secondary" onClick={() => store.addWritingVariant(activeMissionId, `Var ${variants.length+1}`, "Contenu généré", activeMission?.target || "logline")}>+ Nouvelle variante</Button>}
          <div className="flex-1 overflow-auto flex flex-col gap-2">
            {variants.map(v => (
              <div key={v.id} className="p-2 border border-[var(--border-subtle)] rounded bg-[var(--bg-card)]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{v.label}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" title="Sélectionner" onClick={() => store.selectWritingVariant(v.id)}><Check className="w-3 h-3"/></Button>
                    <Button variant="ghost" size="sm" title="Insérer au projet" onClick={() => setInsertModalTarget({ id: v.id, content: v.content, type: 'variant' })}><ArrowRightToLine className="w-3 h-3"/></Button>
                  </div>
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{v.content}</div>
              </div>
            ))}
          </div>
        </div>
        
        {!activeMissionId && (
          <div className="flex-1">
            <EmptyState
              title="Assistance à l'Écriture"
              role="Le partenaire d&apos;écriture pour développer la bible du projet. Dialogue interactif avec le moteur de mock pour brainstormer et affiner les éléments narratifs de votre projet."
              inputs={["Titre de mission", "Cible (Logline, Synopsis...)", "Contexte détaillé"]}
              outputs={["Historique des échanges", "Variantes validées", "Insertion directe dans le projet"]}
              dependencies={["MockWritingProvider"]}
            />
          </div>
        )}

        {insertModalTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6 rounded-xl max-w-lg w-full flex flex-col gap-4 shadow-2xl">
              <h3 className="text-lg font-medium">Insérer dans le projet</h3>
              <p className="text-sm text-[var(--text-secondary)]">Vous allez insérer ce contenu dans la cible : <strong>{activeMission?.target}</strong>.</p>
              
              {(activeMission?.target === 'synopsis' || activeMission?.target === 'vision') && (
                <div>
                  <label className="label-caps block mb-1">Sous-champ cible</label>
                  <select className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-2" value={insertSubField} onChange={(e) => setInsertSubField(e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {activeMission.target === 'synopsis' && (
                      <>
                        <option value="short">Synopsis Court</option>
                        <option value="long">Synopsis Long</option>
                        <option value="beginning">Début (Acte I)</option>
                        <option value="development">Développement (Acte II)</option>
                        <option value="resolution">Résolution (Acte III)</option>
                      </>
                    )}
                    {activeMission.target === 'vision' && (
                      <>
                        <option value="promise">Promesse</option>
                        <option value="intention">Intention</option>
                        <option value="theme">Thème</option>
                        <option value="world">Univers</option>
                        <option value="tone">Ton</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4 border-t border-[var(--border-subtle)] pt-4">
                <Button variant="secondary" onClick={() => setInsertModalTarget(null)}>Annuler</Button>
                <Button onClick={handleInsert}>Confirmer l'insertion</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
