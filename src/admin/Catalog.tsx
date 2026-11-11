import { FormEvent, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCatalog } from '../hooks/useCatalog'
import { seedCatalog } from '../data/seed'

const tabs = [['brands', 'Markalar'], ['models', 'Modeller'], ['cats', 'Kategoriler'], ['equip', 'Donanım']] as const
type Tab = typeof tabs[number][0]
const btn = 'rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium hover:border-accent hover:text-accent-deep'

function AddRow({ label, onAdd, children }: { label: string; onAdd: (name: string) => Promise<unknown>; children?: React.ReactNode }) {
  const [v, setV] = useState('')
  const submit = async (e: FormEvent) => { e.preventDefault(); const n = v.trim(); if (!n) return; await onAdd(n); setV('') }
  return (
    <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
      <input className="input max-w-xs" value={v} onChange={(e) => setV(e.target.value)} placeholder={label} aria-label={label} />{children}
      <button className="btn btn-accent">Ekle</button>
    </form>
  )
}

export default function Catalog() {
  const c = useCatalog()
  const [tab, setTab] = useState<Tab>('brands')
  const [brandId, setBrandId] = useState(''); const [modelId, setModelId] = useState(''); const [genForPkg, setGenForPkg] = useState('')
  const [group, setGroup] = useState('Konfor')
  const [msg, setMsg] = useState('')
  const run = async (fn: () => Promise<unknown>, ok = 'Kaydedildi.') => { setMsg(''); try { await fn(); setMsg(ok) } catch { setMsg('İşlem başarısız oldu. Yetkinizi ve bağlantınızı kontrol edin.') } }

  const brand = c.brands.find((b) => b.id === brandId); const model = c.models.find((m) => m.id === modelId)
  const modelsOf = (bid: string) => c.models.filter((m) => m.brandId === bid)

  const delMany = async (refs: { id: string; col: string }[]) => {
    for (let i = 0; i < refs.length; i += 400) { const b = writeBatch(db); refs.slice(i, i + 400).forEach((r) => b.delete(doc(db, r.col, r.id))); await b.commit() }
  }
  const modelTree = (mid: string) => [
    ...c.generations.filter((g) => g.modelId === mid).map((g) => ({ id: g.id, col: 'vehicleGenerations' })),
    ...c.packages.filter((p) => p.modelId === mid).map((p) => ({ id: p.id, col: 'vehiclePackages' })),
    { id: mid, col: 'vehicleModels' },
  ]
  const rename = async (kind: 'brand' | 'model', id: string, old: string) => {
    const n = prompt('Yeni ad', old)?.trim(); if (!n || n === old) return
    await run(async () => {
      await updateDoc(doc(db, kind === 'brand' ? 'vehicleBrands' : 'vehicleModels', id), { name: n })
      // İlanlarda ad metin olarak saklanır; eski adı kullanan ilanlar da güncellenir.
      const q = kind === 'brand' ? query(collection(db, 'vehicles'), where('brand', '==', old))
        : query(collection(db, 'vehicles'), where('brand', '==', brand?.name ?? ''), where('model', '==', old))
      const snap = await getDocs(q); const b = writeBatch(db)
      snap.docs.forEach((d) => b.update(d.ref, kind === 'brand' ? { brand: n } : { model: n })); await b.commit()
    }, 'Ad değiştirildi, ilgili ilanlar güncellendi.')
  }
  const toggleCat = (id: string, cats: string[] | undefined, name: string) =>
    run(() => updateDoc(doc(db, 'vehicleBrands', id), { categories: cats?.includes(name) ? cats.filter((x) => x !== name) : [...(cats ?? []), name] }))

  const groups = ['Güvenlik', 'Konfor', 'Multimedya', 'Dış donanım', 'Diğer']

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold">Katalog</h1>
      <p className="mt-1 text-sm text-neutral-600">Araç formundaki seçenekler buradan gelir. Kod değiştirmeden genişletebilirsiniz.</p>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === k ? 'bg-ink text-white' : 'bg-white'}`}>{l}</button>)}
      </div>
      <p className="mt-3 h-5 text-sm text-neutral-700" aria-live="polite">{msg}</p>

      <div className="rounded-2xl bg-white p-6">
        {tab === 'brands' && <>
          {c.brands.length === 0 && (
            <div className="mb-6 rounded-xl bg-paper p-4 text-sm">Katalog boş. Yaygın markalar ve modellerle başlamak için:
              <button className="btn btn-accent ml-3" onClick={() => run(seedCatalog, 'Başlangıç kataloğu yüklendi.')}>Başlangıç verisini yükle</button></div>
          )}
          <ul className="divide-y divide-neutral-100">
            {c.brands.map((b) => (
              <li key={b.id} className="py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{b.name} <span className="text-xs text-neutral-500">· {modelsOf(b.id).length} model</span></span>
                  <span className="flex gap-1.5"><button className={btn} onClick={() => rename('brand', b.id, b.name)}>Adı değiştir</button>
                    <button className={`${btn} text-red-700`} onClick={() => { if (confirm(`${b.name} markası ve tüm modelleri, nesilleri, paketleri silinsin mi? Mevcut ilanlar etkilenmez.`)) run(() => delMany([...modelsOf(b.id).flatMap((m) => modelTree(m.id)), { id: b.id, col: 'vehicleBrands' }]), 'Marka silindi.') }}>Sil</button></span></div>
                <details className="mt-1 text-sm"><summary className="cursor-pointer text-neutral-600">Kategoriler ({b.categories?.length ?? 0})</summary>
                  <div className="mt-2 flex flex-wrap gap-x-4">{(c.categories.length ? c.categories.map((x) => x.name) : []).map((n) => (
                    <label key={n} className="flex min-h-9 items-center gap-1.5"><input type="checkbox" className="accent-[#ff6a13]" checked={b.categories?.includes(n) ?? false} onChange={() => toggleCat(b.id, b.categories, n)} />{n}</label>))}</div></details>
              </li>))}
          </ul>
          <AddRow label="Yeni marka adı" onAdd={(name) => run(() => addDoc(collection(db, 'vehicleBrands'), { name, categories: [] }), 'Marka eklendi. Kategorilerini işaretleyin.')} />
        </>}

        {tab === 'models' && <>
          <label className="block text-sm font-medium">Marka<select className="input mt-1.5 max-w-xs" value={brandId} onChange={(e) => { setBrandId(e.target.value); setModelId('') }}><option value="">Marka seçin</option>{c.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          {brand && <>
            <ul className="mt-4 divide-y divide-neutral-100">{modelsOf(brand.id).map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5"><span className={`font-medium ${m.id === modelId ? 'text-accent-deep' : ''}`}>{m.name}</span>
                <span className="flex gap-1.5"><button className={btn} onClick={() => setModelId(m.id)}>Nesil ve paketler</button><button className={btn} onClick={() => rename('model', m.id, m.name)}>Adı değiştir</button>
                  <button className={`${btn} text-red-700`} onClick={() => { if (confirm(`${m.name} modeli, nesilleri ve paketleri silinsin mi?`)) run(() => delMany(modelTree(m.id)), 'Model silindi.') }}>Sil</button></span></li>))}
              {modelsOf(brand.id).length === 0 && <li className="py-3 text-sm text-neutral-500">Bu markada model yok.</li>}</ul>
            <AddRow label="Yeni model adı" onAdd={(name) => run(() => addDoc(collection(db, 'vehicleModels'), { name, brandId: brand.id }), 'Model eklendi.')} />
          </>}
          {model && <div className="mt-8 grid gap-8 border-t border-neutral-100 pt-6 md:grid-cols-2">
            <section><h2 className="text-lg font-semibold">{model.name} – Nesiller</h2>
              <ul className="mt-2 divide-y divide-neutral-100">{c.generations.filter((g) => g.modelId === model.id).map((g) => <li key={g.id} className="flex justify-between py-2 text-sm">{g.name}<button className={`${btn} text-red-700`} onClick={() => run(() => deleteDoc(doc(db, 'vehicleGenerations', g.id)), 'Nesil silindi.')}>Sil</button></li>)}</ul>
              <AddRow label="Yeni nesil (örn. G20)" onAdd={(name) => run(() => addDoc(collection(db, 'vehicleGenerations'), { name, modelId: model.id }), 'Nesil eklendi.')} /></section>
            <section><h2 className="text-lg font-semibold">{model.name} – Paketler</h2>
              <ul className="mt-2 divide-y divide-neutral-100">{c.packages.filter((p) => p.modelId === model.id).map((p) => <li key={p.id} className="flex justify-between gap-2 py-2 text-sm"><span>{p.name}{p.generationId && <span className="text-neutral-500"> · {c.generations.find((g) => g.id === p.generationId)?.name}</span>}</span><button className={`${btn} text-red-700`} onClick={() => run(() => deleteDoc(doc(db, 'vehiclePackages', p.id)), 'Paket silindi.')}>Sil</button></li>)}</ul>
              <AddRow label="Yeni paket (örn. Sport Line)" onAdd={(name) => run(() => addDoc(collection(db, 'vehiclePackages'), { name, modelId: model.id, generationId: genForPkg || null }), 'Paket eklendi.')}>
                <select className="input max-w-[180px]" value={genForPkg} onChange={(e) => setGenForPkg(e.target.value)} aria-label="Nesil (isteğe bağlı)"><option value="">Tüm nesiller</option>{c.generations.filter((g) => g.modelId === model.id).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></AddRow></section>
          </div>}
        </>}

        {tab === 'cats' && <>
          <ul className="divide-y divide-neutral-100">{c.categories.map((x) => (
            <li key={x.id} className="flex items-center justify-between py-2.5"><span className="font-medium">{x.name}</span>
              <button className={`${btn} text-red-700`} onClick={() => { if (confirm(`${x.name} kategorisi silinsin mi?`)) run(() => deleteDoc(doc(db, 'vehicleCategories', x.id)), 'Kategori silindi.') }}>Sil</button></li>))}
            {c.categories.length === 0 && <li className="py-3 text-sm text-neutral-500">Kategori yok. Markalar sekmesinden başlangıç verisini yükleyin.</li>}</ul>
          <AddRow label="Yeni kategori adı" onAdd={(name) => run(() => addDoc(collection(db, 'vehicleCategories'), { name, order: Date.now() }), 'Kategori eklendi.')} />
        </>}

        {tab === 'equip' && <>
          <p className="mb-3 text-sm text-neutral-600">Hazır donanımlara ek olarak kendi donanımlarınızı ekleyin; araç formunda görünür.</p>
          <ul className="divide-y divide-neutral-100">{c.equipment.map((x) => <li key={x.id} className="flex items-center justify-between py-2.5 text-sm"><span>{x.name} <span className="text-neutral-500">· {x.group}</span></span>
            <button className={`${btn} text-red-700`} onClick={() => run(() => deleteDoc(doc(db, 'vehicleEquipment', x.id)), 'Donanım silindi.')}>Sil</button></li>)}
            {c.equipment.length === 0 && <li className="py-3 text-sm text-neutral-500">Henüz özel donanım eklenmedi.</li>}</ul>
          <AddRow label="Yeni donanım adı" onAdd={(name) => run(() => addDoc(collection(db, 'vehicleEquipment'), { name, group }), 'Donanım eklendi.')}>
            <select className="input max-w-[180px]" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Grup">{groups.map((g) => <option key={g}>{g}</option>)}</select></AddRow>
        </>}
      </div>
    </div>
  )
}
