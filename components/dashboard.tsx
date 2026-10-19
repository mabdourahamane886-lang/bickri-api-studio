"use client";

import { useState } from "react";
import {
  Activity, AlertTriangle, ArrowUpRight, Boxes, Check, ChevronRight, CircleHelp,
  Code2, Copy, Cpu, FlaskConical, KeyRound, LayoutDashboard, LockKeyhole,
  Menu, Plus, Search, Settings, ShieldCheck, Sparkles, Terminal, Users, X, Zap
} from "lucide-react";

const navigation = [
  { name: "Vue d’ensemble", icon: LayoutDashboard },
  { name: "Mes clés API", icon: KeyRound },
  { name: "Fournisseurs IA", icon: Boxes },
  { name: "Laboratoire API", icon: FlaskConical },
  { name: "Catalogue des modèles", icon: Cpu },
  { name: "Applications connectées", icon: Code2 },
  { name: "Utilisation & logs", icon: Activity },
  { name: "Utilisateurs", icon: Users },
  { name: "Sécurité", icon: ShieldCheck },
  { name: "Paramètres", icon: Settings },
];
const providers = [
  { name: "Google Gemini", desc: "Generative Language API", symbol: "✦" },
  { name: "OpenAI", desc: "Chat et génération d’images", symbol: "◎" },
  { name: "Anthropic Claude", desc: "Messages API", symbol: "A" },
  { name: "OpenRouter", desc: "Passerelle multi-modèles", symbol: "◈" },
];

type KeyItem = { name: string; prefix: string; mode: string; created: string };

export default function Dashboard() {
  const [active, setActive] = useState("Vue d’ensemble");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [modal, setModal] = useState<"key" | "provider" | "test" | null>(null);
  const [keyName, setKeyName] = useState("");
  const [keyMode, setKeyMode] = useState("test");
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [secret, setSecret] = useState("");
  const [provider, setProvider] = useState("Google Gemini");
  const [prompt, setPrompt] = useState("Explique en une phrase ce qu’est une API.");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  async function createKey() {
    if (keyName.trim().length < 2) return notify("Donne un nom d’au moins 2 caractères.");
    try {
      const res = await fetch("/api/keys", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName.trim(), mode: keyMode })
      });
      const data = await res.json();
      if (!res.ok) return notify(data.error ?? "Création impossible.");
      setSecret(data.key);
      setKeys(old => [{ name: data.name, prefix: data.prefix, mode: data.mode, created: "À l’instant" }, ...old]);
      setKeyName("");
      notify("Clé de démonstration générée.");
    } catch { notify("Backend indisponible. Vérifie le serveur."); }
  }

  async function runTest() {
    setBusy(true); setResult("");
    try {
      const res = await fetch("/api/providers/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, prompt })
      });
      const data = await res.json();
      setResult(data.text ?? data.message ?? data.error ?? "Aucun résultat reçu.");
    } catch { setResult("Impossible de joindre le backend."); }
    finally { setBusy(false); }
  }

  const visibleNav = navigation.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  const sidebar = <aside className="flex h-full w-[250px] shrink-0 flex-col border-r border-white/[.08] bg-[#0b1120]">
    <div className="flex items-center gap-3 px-5 py-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-200 to-yellow-600 text-slate-950"><KeyRound size={21}/></div>
      <div><p className="text-sm font-black tracking-wider">BICKRI <span className="text-amber-300">API</span></p><p className="mt-0.5 text-[10px] tracking-[.25em] text-slate-500">STUDIO</p></div>
      <button className="ml-auto lg:hidden" onClick={() => setMobileMenu(false)} aria-label="Fermer"><X size={18}/></button>
    </div>
    <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-white/[.08] bg-white/[.03] p-3">
      <div className="rounded-lg bg-blue-400/10 p-2 text-blue-300"><ShieldCheck size={17}/></div>
      <div><p className="text-xs font-semibold">Espace administrateur</p><p className="mt-1 text-[10px] text-slate-500">Mode développement</p></div>
    </div>
    <div className="px-3"><div className="relative"><Search size={14} className="absolute left-3 top-3 text-slate-500"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une page" className="w-full rounded-lg border border-white/10 bg-[#080d19] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-amber-300/40"/></div></div>
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">{visibleNav.map(item => { const Icon = item.icon; return <button key={item.name} onClick={() => { setActive(item.name); setMobileMenu(false); if (item.name === "Laboratoire API") setModal("test"); if (item.name === "Fournisseurs IA") setModal("provider"); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs transition ${active === item.name ? "border border-amber-300/20 bg-amber-300/[.08] text-amber-200" : "text-slate-400 hover:bg-white/[.04] hover:text-white"}`}><Icon size={16}/><span className="flex-1">{item.name}</span>{item.name === "Mes clés API" && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">{keys.length}</span>}</button>; })}</nav>
    <div className="m-3 rounded-xl border border-amber-300/15 bg-amber-300/[.05] p-3"><div className="mb-2 flex items-center gap-2 text-amber-200"><Sparkles size={15}/><span className="text-xs font-semibold">Prêt pour BCX</span></div><p className="text-[10px] leading-5 text-slate-400">Centraliser les fournisseurs IA pour les applications Bickri.</p></div>
    <div className="border-t border-white/[.08] p-4"><p className="text-xs font-semibold">Bickri Service Agency</p><p className="mt-1 text-[10px] text-slate-500">Console API · Phase 1</p></div>
  </aside>;

  return <div className="min-h-screen bg-[#080d19] text-slate-100"><div className="flex min-h-screen">
    <div className="hidden lg:block">{sidebar}</div>
    {mobileMenu && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Fermer le menu" onClick={() => setMobileMenu(false)} className="absolute inset-0 bg-black/70"/><div className="relative h-full w-[min(85vw,300px)]">{sidebar}</div></div>}
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-white/[.08] bg-[#080d19]/90 px-4 backdrop-blur-xl sm:px-7">
        <div className="flex items-center gap-3"><button onClick={() => setMobileMenu(true)} className="rounded-lg border border-white/10 p-2 lg:hidden" aria-label="Ouvrir le menu"><Menu size={17}/></button><div><p className="text-[10px] text-slate-500">BICKRI API STUDIO / <span className="text-slate-300">{active}</span></p><h1 className="mt-1 text-sm font-semibold sm:text-base">{active}</h1></div></div>
        <div className="flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[.05] px-3 py-2 text-[10px] text-amber-200"><span className="h-1.5 w-1.5 rounded-full bg-amber-300"/> En développement</div>
      </header>
      <div className="mx-auto max-w-[1450px] space-y-6 p-4 sm:p-7">
        <section className="relative overflow-hidden rounded-2xl border border-amber-300/15 bg-gradient-to-br from-[#182238] via-[#111a2b] to-[#0d1423] p-6 sm:p-8">
          <div className="relative z-10 max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[.07] px-3 py-1.5 text-[10px] font-semibold text-amber-200"><Zap size={13}/> PASSERELLE IA CENTRALISÉE</div><h2 className="text-2xl font-bold leading-tight sm:text-3xl">Toutes tes API. <span className="text-amber-300">Un seul studio.</span></h2><p className="mt-3 max-w-xl text-xs leading-6 text-slate-400 sm:text-sm">Prépare la gestion des fournisseurs IA, les clés internes et les tests pour BICKRI CODEX SYSTEM.</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={() => { setSecret(""); setModal("key"); }} className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-3 text-xs font-bold text-slate-950 hover:bg-amber-200"><Plus size={15}/> Générer une clé</button><button onClick={() => setModal("test")} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] px-4 py-3 text-xs font-semibold hover:border-amber-300/30"><Terminal size={15}/> Tester une API</button></div></div>
          <div className="pointer-events-none absolute -right-8 -top-14 hidden h-64 w-64 items-center justify-center rounded-full border border-amber-300/10 sm:flex"><div className="flex h-44 w-44 items-center justify-center rounded-full border border-amber-300/15"><div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-300/10 text-amber-200"><LockKeyhole size={42}/></div></div></div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[{label:"Clés créées dans cette session",value:String(keys.length),icon:KeyRound},{label:"Fournisseurs au catalogue",value:"04",icon:Boxes},{label:"Applications connectées",value:"0",icon:Code2},{label:"Tests exécutés",value:"0 réels",icon:Activity}].map(card => {const Icon=card.icon;return <div key={card.label} className="rounded-xl border border-white/[.08] bg-[#0d1423] p-5"><div className="flex items-center justify-between"><span className="text-[11px] text-slate-400">{card.label}</span><span className="rounded-lg bg-amber-300/[.08] p-2 text-amber-200"><Icon size={17}/></span></div><p className="mt-4 text-2xl font-bold">{card.value}</p><p className="mt-2 text-[10px] text-slate-500">État de la première version</p></div>;})}
        </section>
        <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <div className="overflow-hidden rounded-xl border border-white/[.08] bg-[#0d1423]"><div className="flex items-center justify-between border-b border-white/[.07] p-5"><div><h3 className="text-sm font-semibold">Fournisseurs IA</h3><p className="mt-1 text-[10px] text-slate-500">Catalogue prêt à configurer</p></div><button onClick={() => setModal("provider")} className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-200">Configurer <ArrowUpRight size={13}/></button></div><div className="divide-y divide-white/[.05]">{providers.map(p=><div key={p.name} className="flex items-center gap-3 p-4 sm:px-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[.08] bg-white/[.03] text-sm font-bold text-amber-200">{p.symbol}</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{p.name}</p><p className="mt-1 text-[10px] text-slate-500">{p.desc}</p></div><span className="rounded-full border border-amber-300/15 bg-amber-300/[.05] px-2.5 py-1 text-[9px] text-amber-200">À configurer</span></div>)}</div></div>
          <div className="rounded-xl border border-white/[.08] bg-[#0d1423] p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-400/10 p-2.5 text-blue-300"><FlaskConical size={18}/></div><div><h3 className="text-sm font-semibold">Laboratoire API</h3><p className="mt-1 text-[10px] text-slate-500">Pas de résultat simulé</p></div></div><div className="mt-5 rounded-lg border border-white/[.06] bg-[#080d19] p-4"><p className="flex items-center gap-2 text-[10px] text-amber-200"><AlertTriangle size={14}/> Fournisseurs non configurés</p><p className="mt-3 text-xs leading-5 text-slate-400">Le backend confirme clairement qu’un adaptateur fournisseur est requis avant un test réel.</p></div><button onClick={() => setModal("test")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-3 text-xs font-semibold hover:border-amber-300/25"><Terminal size={15}/> Ouvrir le laboratoire</button></div>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/[.08] bg-[#0d1423] p-5"><div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-amber-300/[.08] p-2.5 text-amber-200"><KeyRound size={18}/></div><div><h3 className="text-sm font-semibold">Clés API récentes</h3><p className="mt-1 text-[10px] text-slate-500">Clés de démonstration de cette session uniquement</p></div></div>{keys.length===0?<div className="py-8 text-center"><KeyRound className="mx-auto mb-3 text-slate-600" size={25}/><p className="text-xs text-slate-400">Aucune clé générée pour le moment.</p><button onClick={()=>setModal("key")} className="mt-4 rounded-lg border border-amber-300/20 px-3 py-2 text-[10px] font-semibold text-amber-200">Créer une clé</button></div>:<div className="divide-y divide-white/[.05]">{keys.map((key,i)=><div key={key.prefix+i} className="flex items-center gap-3 py-3"><KeyRound size={15} className="text-amber-200"/><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{key.name}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{key.prefix}••••••</p></div><span className="text-[10px] text-amber-200">{key.mode}</span></div>)}</div>}</div>
          <div className="rounded-xl border border-white/[.08] bg-[#0d1423] p-5"><div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-violet-400/10 p-2.5 text-violet-300"><Code2 size={18}/></div><div><h3 className="text-sm font-semibold">Connexion à BCX</h3><p className="mt-1 text-[10px] text-slate-500">BICKRI CODEX SYSTEM</p></div></div>{["Authentification serveur par application","Permissions et quotas par clé","Réponses et erreurs normalisées"].map((label,i)=><div key={label} className="flex gap-3 py-2"><div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-[10px] text-slate-400">{i+1}</div><p className="pt-1 text-xs text-slate-300">{label}</p></div>)}<div className="mt-4 rounded-lg border border-amber-300/10 bg-amber-300/[.04] p-3 text-[10px] leading-5 text-amber-100/80"><AlertTriangle size={13} className="mr-1 inline"/> Connexion BCX à activer après sécurisation du backend.</div></div>
        </section>
        <footer className="flex flex-col justify-between gap-2 border-t border-white/[.06] pt-5 text-[10px] text-slate-600 sm:flex-row"><span>© 2026 Bickri Service Agency · BICKRI API STUDIO</span><span className="flex items-center gap-2"><LockKeyhole size={11}/> Ne partage jamais tes clés secrètes.</span></footer>
      </div>
    </main>
  </div>
  {toast && <div role="status" className="fixed bottom-5 right-5 z-[70] max-w-[90vw] rounded-xl border border-white/10 bg-[#182237] px-4 py-3 text-xs shadow-2xl">{toast}</div>}
  {modal && <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"><div className="my-8 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1423] shadow-2xl">
    <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4"><div><h3 className="text-sm font-semibold">{modal==="key"?"Générer une clé API":modal==="provider"?"Configurer un fournisseur":"Laboratoire de tests API"}</h3><p className="mt-1 text-[10px] text-slate-500">BICKRI API STUDIO · Version de développement</p></div><button onClick={()=>{setModal(null);setSecret("");setResult("");}} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-white/5"><X size={17}/></button></div>
    {modal==="key" && <div className="space-y-4 p-5"><label className="block text-xs font-medium">Nom de la clé<input value={keyName} onChange={e=>setKeyName(e.target.value)} placeholder="Ex. BCX — développement" className="mt-2 w-full rounded-lg border border-white/10 bg-[#080d19] px-3 py-3 text-xs outline-none focus:border-amber-300/40"/></label><label className="block text-xs font-medium">Environnement<select value={keyMode} onChange={e=>setKeyMode(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#080d19] px-3 py-3 text-xs outline-none"><option value="test">Test</option><option value="live">Production</option></select></label><div className="rounded-lg border border-amber-300/10 bg-amber-300/[.04] p-3 text-[10px] leading-5 text-amber-100/80"><LockKeyhole size={13} className="mr-1 inline"/> Démonstration uniquement. La clé ne sera pas stockée et ne peut pas authentifier de requêtes.</div>{secret && <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/[.04] p-3"><p className="mb-2 text-[10px] text-emerald-200">Copie la clé maintenant ; elle ne sera pas enregistrée.</p><code className="block break-all text-[11px]">{secret}</code><button onClick={()=>{navigator.clipboard?.writeText(secret);notify("Copie demandée au navigateur.");}} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-300/10 px-3 py-2 text-[10px] font-semibold text-emerald-200"><Copy size={13}/> Copier la clé</button></div>}<div className="flex justify-end gap-2"><button onClick={()=>setModal(null)} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs">Annuler</button><button onClick={createKey} className="rounded-lg bg-amber-300 px-4 py-2.5 text-xs font-bold text-slate-950">Générer</button></div></div>}
    {modal==="provider" && <div className="space-y-4 p-5"><p className="text-xs leading-6 text-slate-300">Les fournisseurs visibles sont le catalogue initial. Le formulaire de secrets chiffrés et les appels officiels seront ajoutés avec l’authentification et le stockage sécurisé.</p><div className="rounded-lg border border-amber-300/10 bg-amber-300/[.04] p-3 text-[10px] leading-5 text-amber-100/80"><AlertTriangle size={14} className="mr-1 inline"/> N’entre pas encore de secret fournisseur dans cette version.</div><div className="flex justify-end"><button onClick={()=>setModal(null)} className="rounded-lg bg-amber-300 px-4 py-2.5 text-xs font-bold text-slate-950">Compris</button></div></div>}
    {modal==="test" && <div className="space-y-4 p-5"><label className="block text-xs font-medium">Fournisseur<select value={provider} onChange={e=>setProvider(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#080d19] px-3 py-3 text-xs outline-none">{providers.map(p=><option key={p.name}>{p.name}</option>)}</select></label><label className="block text-xs font-medium">Prompt de test<textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#080d19] px-3 py-3 text-xs leading-5 outline-none focus:border-amber-300/40"/></label>{result && <div role="status" className="rounded-lg border border-white/10 bg-[#080d19] p-3 text-xs leading-5 text-slate-300">{result}</div>}<div className="rounded-lg border border-white/[.06] p-3 text-[10px] leading-5 text-slate-500">Aucun test réel ne sera annoncé tant qu’un adaptateur et une clé fournisseur ne sont pas configurés.</div><div className="flex justify-end gap-2"><button onClick={()=>setModal(null)} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs">Fermer</button><button disabled={busy} onClick={runTest} className="rounded-lg bg-amber-300 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-60">{busy?"Test…":"Exécuter le test"}</button></div></div>}
  </div></div>}
  </div>;
}