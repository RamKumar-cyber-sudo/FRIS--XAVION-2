import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { LayoutDashboard, ScanSearch, ListChecks, Scale, Wrench, FileText, GitCompare, Info, ShieldCheck, Menu, X, Upload, Printer, CheckCircle2, AlertTriangle, Loader2, ExternalLink } from 'lucide-react'
import { components, findings, baseline, sevOf, score, META, Finding, Status, Sev } from './data'

type Page = 'dashboard' | 'scanner' | 'results' | 'priority' | 'remediation' | 'reports' | 'baseline' | 'about'
type Rec = { status: Status; owner: string; notes: string }
const NAV: [Page, string, any][] = [
  ['dashboard', 'Dashboard', LayoutDashboard], ['scanner', 'Firmware scanner', ScanSearch], ['results', 'Scan results', ListChecks],
  ['priority', 'Risk prioritization', Scale], ['remediation', 'Remediation tracker', Wrench], ['reports', 'Reports', FileText],
  ['baseline', 'Trusted baseline', GitCompare], ['about', 'About XAVION', Info]]
const SEV_CLS: Record<Sev, string> = { Critical: 'bg-red-100 text-red-800', High: 'bg-orange-100 text-orange-800', Medium: 'bg-amber-100 text-amber-800', Low: 'bg-slate-100 text-slate-700' }
const SEV_COL: Record<Sev, string> = { Critical: '#b91c1c', High: '#ea580c', Medium: '#d97706', Low: '#94a3b8' }
const STATUSES: Status[] = ['Open', 'In Progress', 'Fixed', 'Verified']
const TEAM = ['Unassigned', 'Ramkumar', 'Firmware team', 'Network team']
const EXT = ['bin', 'img', 'tar', 'zip', 'gz', 'tgz', 'trx', 'chk', 'squashfs']
const MAX = 64 * 1024 * 1024

function useLS<T>(k: string, init: T) {
  const [v, s] = useState<T>(() => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : init } catch { return init } })
  useEffect(() => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage unavailable */ } }, [k, v])
  return [v, s] as const
}
const Sevb = ({ s }: { s: Sev }) => <span className={`rounded px-2 py-0.5 text-xs font-medium ${SEV_CLS[s]}`}>{s}</span>
const Demo = ({ children }: { children: string }) => <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800">{children}</span>
const H = ({ t, sub }: { t: string; sub?: string }) => <div className="mb-4"><h1 className="text-xl font-semibold">{t}</h1>{sub && <p className="text-sm text-slate-500">{sub}</p>}</div>

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [nav, setNav] = useState(false)
  const [sel, setSel] = useState<Finding | null>(null)
  const [recs, setRecs] = useLS<Record<string, Rec>>('fris-recs', {})
  const [log, setLog] = useLS<string[]>('fris-log', ['Sample assessment loaded (demonstration data)'])
  const [busy, setBusy] = useState<string | null>(null)
  const rec = (id: string): Rec => recs[id] ?? { status: 'Open', owner: 'Unassigned', notes: '' }
  const act = (m: string) => setLog(l => [`${new Date().toLocaleTimeString()} ${m}`, ...l].slice(0, 12))
  const patch = (f: Finding, p: Partial<Rec>) => { setRecs({ ...recs, [f.id]: { ...rec(f.id), ...p } }); if (p.status) act(`${f.comp} ${f.cve} set to ${p.status}`) }
  const verify = (f: Finding) => { setBusy(f.id); setTimeout(() => { patch(f, { status: 'Verified' }); setBusy(null) }, 1200) }
  const open = findings.filter(f => !['Fixed', 'Verified'].includes(rec(f.id).status))
  const go = (p: Page) => { setPage(p); setNav(false) }

  const Controls = ({ f }: { f: Finding }) => {
    const r = rec(f.id)
    return (
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Status" className="inp" value={r.status} onChange={e => patch(f, { status: e.target.value as Status })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        <select aria-label="Owner" className="inp" value={r.owner} onChange={e => patch(f, { owner: e.target.value })}>{TEAM.map(s => <option key={s}>{s}</option>)}</select>
        <button className="btn" onClick={() => patch(f, { status: 'Fixed' })}>Mark fixed</button>
        <button className="btn btn-p" disabled={r.status !== 'Fixed' || busy === f.id} onClick={() => verify(f)}>
          {busy === f.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Run verification (demo)</button>
      </div>)
  }

  const Dashboard = () => {
    const dist = (['Critical', 'High', 'Medium', 'Low'] as Sev[]).map(s => ({ name: s, value: open.filter(f => sevOf(f.cvss) === s).length })).filter(d => d.value)
    const stats: [string, number][] = [['Firmware assessments', 1], ['Components identified', components.length], ['Vulnerabilities detected', findings.length], ['Critical risks open', open.filter(f => sevOf(f.cvss) === 'Critical').length]]
    return (<>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><H t="Dashboard" sub="Overview of firmware assessments" /><button className="btn btn-p" onClick={() => go('scanner')}><Upload size={14} /> New firmware scan</button></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([l, n]) => <div key={l} className="card"><div className="text-2xl font-semibold">{n}</div><div className="text-xs text-slate-500">{l}</div></div>)}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card overflow-x-auto lg:col-span-2"><h2 className="mb-2 text-sm font-semibold">Recent scans</h2>
          <table className="w-full"><thead><tr><th>Firmware</th><th>Date</th><th>Open findings</th><th>Source</th></tr></thead>
            <tbody><tr className="cursor-pointer border-t hover:bg-slate-50" onClick={() => go('results')}><td>{META.firmware}</td><td>{META.date}</td><td>{open.length} of {findings.length}</td><td><Demo>Sample data</Demo></td></tr></tbody></table></div>
        <div className="card"><h2 className="text-sm font-semibold">Open risk by severity</h2>
          {dist.length ? <div className="h-44"><ResponsiveContainer><PieChart><Pie data={dist} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>{dist.map(d => <Cell key={d.name} fill={SEV_COL[d.name as Sev]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            : <p className="py-10 text-center text-sm text-slate-500">No open findings. All items are fixed or verified.</p>}</div>
      </div>
      <div className="card mt-4"><h2 className="mb-2 text-sm font-semibold">Recent activity</h2><ul className="space-y-1 text-sm text-slate-600">{log.map((l, i) => <li key={i}>{l}</li>)}</ul></div>
    </>)
  }

  const Scanner = () => {
    const [file, setFile] = useState<File | null>(null)
    const [err, setErr] = useState(''), [stage, setStage] = useState(-1), [info, setInfo] = useState('')
    const stages = ['File validation', 'Component discovery', 'Vulnerability matching', 'Risk assessment', 'Report generation']
    const pick = (f?: File) => {
      setErr(''); setStage(-1); setInfo(''); if (!f) return
      const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
      if (!EXT.includes(ext)) return setErr(`.${ext} is not supported. Use: ${EXT.join(', ')}.`)
      if (f.size > MAX) return setErr('File is larger than the 64 MB limit.')
      setFile(f)
    }
    const run = async () => {
      if (!file) return
      try { const fd = new FormData(); fd.append('file', file); const r = await fetch('/api/upload', { method: 'POST', body: fd })
        setInfo(r.ok ? `Backend validated file. SHA-256: ${(await r.json()).sha256}` : 'Backend rejected the file.') } catch { setInfo('Backend offline. File checked in the browser only.') }
      for (let i = 0; i < stages.length; i++) { setStage(i); await new Promise(r => setTimeout(r, 700)) }
      setStage(stages.length); act(`Demonstration scan of ${file.name}`)
    }
    return (<><H t="Firmware scanner" sub="Uploaded files are treated as untrusted and are never executed." />
      <div className="card max-w-2xl space-y-3">
        <div className="flex gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle size={16} className="mt-0.5 shrink-0" />No analysis engine is connected. The scan below is a demonstration and does not analyse your file. Results come from sample data.</div>
        <input type="file" accept={EXT.map(e => '.' + e).join(',')} onChange={e => pick(e.target.files?.[0])} className="block w-full text-sm" />
        {file && <p className="text-sm">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button className="btn btn-p" disabled={!file || (stage >= 0 && stage < stages.length)} onClick={run}>Run demonstration scan</button>
        {!file && !err && <p className="text-sm text-slate-500">Choose a firmware file to begin. Max 64 MB.</p>}
        {stage >= 0 && <ol className="space-y-1 text-sm">{stages.map((s, i) => <li key={s} className="flex items-center gap-2">{i < stage ? <CheckCircle2 size={14} className="text-brand" /> : i === stage ? <Loader2 size={14} className="animate-spin" /> : <span className="w-3.5" />}<span className={i > stage ? 'text-slate-400' : ''}>{s}</span></li>)}</ol>}
        {info && <p className="text-xs text-slate-500">{info}</p>}
        {stage === stages.length && <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm">Demonstration scan complete. <button className="underline" onClick={() => go('results')}>Open sample results</button></div>}
      </div></>)
  }

  const Results = () => {
    const [sv, setSv] = useState('All'), [cp, setCp] = useState('All')
    const rows = findings.filter(f => (sv === 'All' || sevOf(f.cvss) === sv) && (cp === 'All' || f.comp === cp))
    const s = sel && score(sel)
    return (<><H t="Scan results" sub={`${META.device} · ${META.firmware} · ${META.date}`} />
      <div className="mb-3 flex flex-wrap items-center gap-2"><Demo>Demonstration data</Demo>
        <select aria-label="Severity" className="inp" value={sv} onChange={e => setSv(e.target.value)}>{['All', 'Critical', 'High', 'Medium', 'Low'].map(x => <option key={x}>{x}</option>)}</select>
        <select aria-label="Component" className="inp" value={cp} onChange={e => setCp(e.target.value)}><option>All</option>{components.map(c => <option key={c.name}>{c.name}</option>)}</select></div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card overflow-x-auto p-0 lg:col-span-3"><table className="w-full"><thead><tr><th>Severity</th><th>Component</th><th>ID</th><th>CVSS</th><th>Status</th></tr></thead><tbody>
          {rows.map(f => <tr key={f.id} onClick={() => setSel(f)} className={`cursor-pointer border-t hover:bg-slate-50 ${sel?.id === f.id ? 'bg-teal-50' : ''}`}><td><Sevb s={sevOf(f.cvss)} /></td><td>{f.comp} {f.ver}</td><td>{f.cve}</td><td>{f.cvss}</td><td>{rec(f.id).status}</td></tr>)}
          {!rows.length && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No findings match these filters.</td></tr>}</tbody></table></div>
        <div className="card lg:col-span-2">{sel && s ? <div className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-2"><h2 className="font-semibold">{sel.title}</h2><button aria-label="Close" onClick={() => setSel(null)}><X size={16} /></button></div>
          <div className="flex flex-wrap gap-2"><Sevb s={sevOf(sel.cvss)} />{sel.verified ? <span className="text-xs text-slate-500">Record: {sel.cve}</span> : <Demo>Illustrative, not a real CVE</Demo>}</div>
          <p><b>Impact.</b> {sel.impact}</p>
          <div><b>Why prioritized.</b> Demo score {s.total} ({s.band}): CVSS {sel.cvss} × 7 = {s.base}{sel.kev ? ', +20 listed in CISA KEV' : ', not in KEV'}{sel.exposed ? ', +10 network-exposed' : ''}. This is not an official CVSS score.</div>
          <p><b>Remediation.</b> {sel.fix}</p>
          {sel.verified && <a className="inline-flex items-center gap-1 text-brand underline" target="_blank" rel="noreferrer" href={`https://nvd.nist.gov/vuln/detail/${sel.cve}`}>NVD record <ExternalLink size={12} /></a>}
          <Controls f={sel} /></div> : <p className="py-10 text-center text-sm text-slate-500">Select a finding to see details.</p>}</div>
      </div></>)
  }

  const Priority = () => (<><H t="Risk prioritization" sub="Transparent demonstration model. Not CVSS." />
    <div className="card mb-4 text-sm"><p className="font-medium">Score = (CVSS × 7) + 20 if in CISA KEV + 10 if the component is network-exposed. Maximum 100.</p>
      <p className="mt-1 text-slate-600">Bands: Urgent ≥ 80, High ≥ 60, Medium ≥ 40, Low below 40. CVSS values are from the sample data. KEV status and exposure are set by hand in the sample data; a live build would read them from the CISA KEV catalog and device configuration.</p></div>
    <div className="card overflow-x-auto p-0"><table className="w-full"><thead><tr><th>Finding</th><th>CVSS × 7</th><th>KEV</th><th>Exposure</th><th>Total</th><th>Band</th></tr></thead><tbody>
      {[...findings].sort((a, b) => score(b).total - score(a).total).map(f => { const s = score(f); return <tr key={f.id} className="border-t"><td>{f.comp} · {f.cve}</td><td>{s.base}</td><td>+{s.kev}</td><td>+{s.exp}</td><td className="font-medium">{s.total}</td><td>{s.band}</td></tr> })}</tbody></table></div></>)

  const Remediation = () => (<><H t="Remediation tracker" sub="Changes are saved in this browser only." />
    <div className="space-y-3">{findings.map(f => <div key={f.id} className="card space-y-2"><div className="flex flex-wrap items-center gap-2"><Sevb s={sevOf(f.cvss)} /><span className="text-sm font-medium">{f.comp} {f.ver}</span><span className="text-sm text-slate-500">{f.cve}</span></div>
      <Controls f={f} /><input className="inp w-full" placeholder="Add remediation notes" value={rec(f.id).notes} onChange={e => patch(f, { notes: e.target.value })} /></div>)}</div>
    <button className="btn mt-4" onClick={() => { setRecs({}); act('Remediation state reset') }}>Reset demo state</button></>)

  const Reports = () => {
    const counts = (['Critical', 'High', 'Medium', 'Low'] as Sev[]).map(s => [s, findings.filter(f => sevOf(f.cvss) === s).length] as const)
    return (<><div className="print:hidden"><H t="Reports" /><button className="btn btn-p mb-4" onClick={() => window.print()}><Printer size={14} /> Print or save as PDF</button></div>
      <div className="card space-y-4 text-sm"><h2 className="text-lg font-semibold">Firmware risk assessment: {META.device}</h2><Demo>Demonstration data</Demo>
        <section><h3 className="font-semibold">Executive summary</h3><p>{META.firmware} contains {components.length} identified components and {findings.length} findings. {open.length} remain open; {findings.length - open.length} are fixed or verified. {open.filter(f => score(f).band === 'Urgent').length} open finding(s) rate Urgent under the demonstration score.</p></section>
        <section><h3 className="font-semibold">Severity breakdown</h3><p>{counts.map(([s, n]) => `${s}: ${n}`).join(' · ')}</p></section>
        <section><h3 className="font-semibold">Component inventory</h3><ul className="list-disc pl-5">{components.map(c => <li key={c.name}>{c.name} {c.version} ({c.type})</li>)}</ul></section>
        <section><h3 className="font-semibold">Recommended actions</h3><ol className="list-decimal pl-5">{[...findings].sort((a, b) => score(b).total - score(a).total).map(f => <li key={f.id}>{f.comp}: {f.fix} <i>[{rec(f.id).status}]</i></li>)}</ol></section>
        <section><h3 className="font-semibold">Limitations and metadata</h3><p>Assessment date {META.date}. Mode: {META.mode}. Component discovery and vulnerability matching are not exhaustive; real scans can miss statically linked or renamed components and can produce false positives. FRIS-DEMO entries are illustrative and not real CVEs.</p></section></div></>)
  }

  const Baseline = () => {
    const names = Array.from(new Set([...baseline.map(b => b.name), ...components.map(c => c.name)]))
    const rows = names.map(n => { const b = baseline.find(x => x.name === n)?.version, c = components.find(x => x.name === n)?.version
      return { n, b, c, ch: !b ? 'Added' : !c ? 'Removed' : b !== c ? 'Changed' : 'Same' } })
    return (<><H t="Trusted firmware baseline" sub="Approved version 1.0.0 compared with current version 1.1.0" /><Demo>Demonstration data</Demo>
      <div className="card mt-3 overflow-x-auto p-0"><table className="w-full"><thead><tr><th>Component</th><th>Baseline 1.0.0</th><th>Current 1.1.0</th><th>Change</th><th>Findings</th></tr></thead><tbody>
        {rows.map(r => { const fs = findings.filter(f => f.comp === r.n); return <tr key={r.n} className={`border-t ${r.ch !== 'Same' ? 'bg-amber-50' : ''}`}><td>{r.n}</td><td>{r.b ?? '–'}</td><td>{r.c ?? '–'}</td><td>{r.ch}</td><td>{r.ch === 'Same' || r.ch === 'Removed' ? '' : fs.length ? `${fs.length} new risk(s) to review` : 'None'}</td></tr> })}</tbody></table></div>
      <p className="mt-3 max-w-2xl text-sm text-slate-600">Components that changed or were added since the approved baseline are highlighted so reviewers check them first.</p></>)
  }

  const About = () => (<><H t="About XAVION" /><div className="card max-w-2xl space-y-3 text-sm leading-relaxed">
    <p><b>Status.</b> FRIS is a prototype under development by a student team. It is not a commercial product.</p>
    <p><b>Problem.</b> Routers, gateways and other connected devices often ship with outdated open-source components. Small organizations in India rarely have the tools or staff to inspect firmware.</p>
    <p><b>Target users.</b> Small manufacturers, IoT integrators, and IT teams that buy or maintain connected equipment.</p>
    <p><b>Solution.</b> Inventory the components inside a firmware image, match them to public vulnerability records, rank what to fix first, and track the fix.</p>
    <p><b>Limitations.</b> This build uses sample data. Real component discovery (Syft) and live NVD and CISA KEV lookups are planned, not implemented. It will not find every vulnerability.</p>
    <p><b>Contribution.</b> Make firmware risk visible and actionable for organizations that cannot afford enterprise tooling, supporting a safer digital India.</p></div></>)

  const pages: Record<Page, JSX.Element> = { dashboard: <Dashboard />, scanner: <Scanner />, results: <Results />, priority: <Priority />, remediation: <Remediation />, reports: <Reports />, baseline: <Baseline />, about: <About /> }
  return (
    <div className="min-h-screen lg:flex">
      <aside className={`${nav ? 'block' : 'hidden'} border-b border-slate-200 bg-white p-3 print:hidden lg:block lg:min-h-screen lg:w-60 lg:border-b-0 lg:border-r`}>
        <div className="mb-4 hidden items-center gap-2 px-2 font-semibold lg:flex"><ShieldCheck className="text-brand" size={20} />FRIS <span className="text-xs font-normal text-slate-500">by XAVION</span></div>
        <nav className="space-y-1">{NAV.map(([k, l, I]) => <button key={k} onClick={() => go(k)} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm ${page === k ? 'bg-teal-50 font-medium text-brand' : 'text-slate-600 hover:bg-slate-100'}`}><I size={16} />{l}</button>)}</nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 print:hidden"><button aria-label="Menu" className="lg:hidden" onClick={() => setNav(!nav)}><Menu size={20} /></button>
          <span className="text-sm text-slate-500">Demonstration mode: sample data, no live scanning</span><span className="text-sm font-medium lg:hidden">FRIS</span></header>
        <main className="mx-auto max-w-6xl p-4">{pages[page]}</main>
      </div>
    </div>)
}
