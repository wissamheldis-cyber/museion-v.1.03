"use client";
import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectNotFound } from "@/components/layout/ProjectNotFound";
import { useProjectScope } from "@/components/layout/useProjectFromRoute";
import { useMuseionStore } from "@/store/museionStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn, formatDate } from "@/lib/utils";
import { Search, FolderPlus, Trash2, CheckCircle, Archive, Star, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function LibraryPage() {
  const { project, slug, assets, scenes, shots } = useProjectScope();
  const projectId = project?.id || '';
  const store = useMuseionStore();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSceneId, setFilterSceneId] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  if (!project) return <ProjectNotFound slug={slug} />;

  const collections = store.assetCollections?.filter(c => c.projectId === projectId) || [];
  
  const filteredAssets = (assets || []).filter(a => {
    if (search && !a.id.includes(search) && !(a.prompt || "").includes(search) && !(a.name || "").includes(search)) return false;
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterSceneId !== "all" && a.sceneId !== filterSceneId) return false;
    if (filterDate && !a.createdAt.startsWith(filterDate)) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="flex h-full text-sm text-[var(--text-primary)]">
        <div className="w-64 border-r border-[var(--border-subtle)] p-4 bg-[var(--bg-surface)] flex flex-col gap-4 overflow-auto">
          <h2 className="label-caps text-[var(--text-secondary)]">Collections</h2>
          <Button variant="secondary" onClick={() => store.addAssetCollection(projectId, "Nouvelle Collection")}><FolderPlus className="w-4 h-4 mr-2"/> Créer</Button>
          <div className="flex flex-col gap-1 mt-2">
            {collections.map(c => (
              <div key={c.id} className="flex justify-between items-center p-2 rounded hover:bg-[var(--bg-card-hover)] cursor-pointer border border-transparent hover:border-[var(--border-subtle)]">
                <span className="truncate">{c.name}</span>
                <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-card)] px-2 rounded-full">{c.assetIds.length}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[var(--bg-base)]">
          <div className="p-4 border-b border-[var(--border-subtle)] flex flex-wrap gap-4 bg-[var(--bg-surface)]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <Input className="pl-9" placeholder="Rechercher (nom, prompt, id)..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded px-3" value={filterType} onChange={e=>setFilterType(e.target.value)}>
              <option value="all">Tous types</option>
              <option value="image">Images</option>
              <option value="video">Vidéos</option>
            </select>
            <select className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded px-3" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="all">Tous statuts</option>
              <option value="ephemeral">Éphémère</option>
              <option value="candidate">Candidat</option>
              <option value="approved">Approuvé</option>
              <option value="canonical">Canonique</option>
              <option value="archived">Archivé</option>
            </select>
            <select className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded px-3" value={filterSceneId} onChange={e=>setFilterSceneId(e.target.value)}>
              <option value="all">Toutes scènes</option>
              {scenes.map(s => (
                 <option key={s.id} value={s.id}>Scène {s.number} - {s.title}</option>
              ))}
            </select>
            <Input type="date" className="w-[150px]" value={filterDate} onChange={e=>setFilterDate(e.target.value)} title="Filtrer par date" />
          </div>

          <div className="flex-1 overflow-auto p-6">
            {assets.length === 0 ? (
              <EmptyState
                title="Bibliothèque Vide"
                role="L'espace central pour retrouver, filtrer et organiser toutes vos productions visuelles."
                inputs={["Génération d'images (Prévis)", "Rendus terminés (Production)"]}
                outputs={["Collections thématiques", "Recherche par scène ou date", "Accès rapide aux assets canoniques"]}
                dependencies={["Prévis", "Production"]}
              />
            ) : filteredAssets.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">Aucun asset ne correspond aux filtres.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 content-start">
                {filteredAssets.map(a => (
                  <div key={a.id} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg overflow-hidden group flex flex-col">
                    <div className="h-40 bg-black relative flex items-center justify-center">
                      {a.url ? <img src={a.url} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" /> : <span className="text-xs text-[var(--text-muted)]">{a.type}</span>}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="ghost" title="Approuver" className="text-white hover:text-[var(--state-ok)]" onClick={() => store.setAssetStatus(a.id, "approved")}><CheckCircle className="w-4 h-4"/></Button>
                        <Button size="sm" variant="ghost" title="Définir Canonique" className="text-white hover:text-[var(--state-warn)]" onClick={() => store.promoteAssetToCanonical(a.id)}><Star className="w-4 h-4"/></Button>
                        <Button size="sm" variant="ghost" title="Archiver" className="text-white hover:text-[var(--text-muted)]" onClick={() => store.setAssetStatus(a.id, "archived")}><Archive className="w-4 h-4"/></Button>
                        <Button size="sm" variant="ghost" title="Supprimer" className="text-white hover:text-[var(--state-danger)]" onClick={() => store.deleteAsset(a.id)}><Trash2 className="w-4 h-4"/></Button>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                      <div className="text-xs truncate font-medium" title={a.name || a.prompt}>{a.name || a.prompt || a.id}</div>
                      
                      {/* Liens contextuels */}
                      {(a.sceneId) && (
                        <div className="flex gap-2">
                          {a.sceneId && (
                            <Link href={`/cinema/projects/${slug}/board?scene=${a.sceneId}`} className="text-[10px] flex items-center text-[var(--interactive)] hover:underline truncate">
                              <LinkIcon className="w-3 h-3 mr-1" /> Scène {scenes.find(s => s.id === a.sceneId)?.number}
                            </Link>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] label-caps mt-auto">
                        <span className={cn(
                          a.status==="approved"&&"text-[var(--state-ok)]",
                          a.status==="canonical"&&"text-[var(--state-warn)]"
                        )}>{a.status}</span>
                        <span className="metric">{formatDate(a.createdAt || "")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
