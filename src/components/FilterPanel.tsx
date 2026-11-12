import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Dropdown from './Dropdown'
import { ChevronDown } from 'lucide-react'
import type { Vehicle } from '../types'
import type { Filters } from '../lib/filters'
import { dateOptions, damageOptions } from '../lib/filters'
import { bodyOptionsFor, colors, cylinderOptions, driveTypes, fuels, transmissions } from '../data/options'
import { provinces } from '../data/provinces'
import type { Brand, Category, Generation, Model, Pkg } from '../hooks/useCatalog'

export type Patch = Partial<Filters>
export type OnChange = (patch: Patch, opts?: { replace?: boolean }) => void
interface Catalog { categories: Category[]; brands: Brand[]; models: Model[]; generations: Generation[]; packages: Pkg[] }
interface Props { value: Filters; onChange: OnChange; catalog: Catalog; scoped: Vehicle[] }

const nf = new Intl.NumberFormat('tr-TR')
const label = 'mb-1 block text-xs font-medium text-neutral-600'

function Group({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-neutral-200 py-3">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between font-semibold">{title}<ChevronDown size={16} className="transition-transform group-open:rotate-180" /></summary>
      <div className="pt-3">{children}</div>
    </details>
  )
}

/** Turkce binlik ayraçlı sayı alanı; yazdıkça değil, bekleyip/odak kaybında uygular. */
function NumInput({ text, value, onCommit, placeholder }: { text: string; value?: number; onCommit: (n: number | undefined) => void; placeholder?: string }) {
  const [v, setV] = useState(value === undefined ? '' : nf.format(value))
  useEffect(() => setV(value === undefined ? '' : nf.format(value)), [value])
  const commit = (raw: string) => { const d = raw.replace(/\D/g, ''); const n = d ? Number(d) : undefined; if (n !== value) onCommit(n) }
  useEffect(() => { const t = setTimeout(() => commit(v), 700); return () => clearTimeout(t) }, [v]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <label className="block"><span className={label}>{text}</span>
      <input className="input" inputMode="numeric" placeholder={placeholder} value={v}
        onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setV(d ? nf.format(Number(d)) : '') }}
        onBlur={() => commit(v)} onKeyDown={(e) => { if (e.key === 'Enter') commit(v) }} /></label>
  )
}

function Range({ title, min, max, a, z, onChange, unit, placeholder }: { title: string; min?: number; max?: number; a: keyof Filters; z: keyof Filters; onChange: OnChange; unit?: string; placeholder?: [string, string] }) {
  return (
    <fieldset><legend className="sr-only">{title}{unit ? ` (${unit})` : ''}</legend>
      <div className="grid grid-cols-2 gap-2">
        <NumInput text="En az" value={min} placeholder={placeholder?.[0]} onCommit={(n) => onChange({ [a]: n }, { replace: true })} />
        <NumInput text="En çok" value={max} placeholder={placeholder?.[1]} onCommit={(n) => onChange({ [z]: n }, { replace: true })} />
      </div>
    </fieldset>
  )
}

function Checks<T extends string | number>({ name, options, selected, onChange }: { name: string; options: [T, string][]; selected: T[]; onChange: (v: T[]) => void }) {
  if (!options.length) return <p className="text-sm text-neutral-500">Seçenek yok.</p>
  return (
    <fieldset><legend className="sr-only">{name}</legend>
      {options.map(([v, l]) => (
        <label key={String(v)} className="flex min-h-9 items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-[#ff6a13]" checked={selected.includes(v)} onChange={() => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])} />{l}
        </label>))}
    </fieldset>
  )
}

export default function FilterPanel({ value: f, onChange, catalog: c, scoped }: Props) {
  const yearNow = new Date().getFullYear() + 1
  const years = useMemo(() => Array.from({ length: yearNow - 1969 }, (_, i) => yearNow - i), [yearNow])
  const categoryName = c.categories.find((x) => x.id === f.kategori)?.name

  // Hiyerarşi: yalnızca seçili üst öğeye ait seçenekler
  const brands = c.brands.filter((b) => !f.kategori || !b.categories?.length || b.categories.includes(categoryName ?? ''))
  const models = f.marka ? c.models.filter((m) => m.brandId === f.marka) : []
  const gens = f.model ? c.generations.filter((g) => g.modelId === f.model) : []
  const pkgs = f.model ? c.packages.filter((p) => p.modelId === f.model && (!f.nesil || !p.generationId || p.generationId === f.nesil)) : []

  // Hiyerarşik olmayan gruplar: yalnızca seçili kategori/marka/model kapsamındaki araçlarda bulunan değerler (+ seçili olanlar)
  const present = (get: (v: Vehicle) => string | undefined, all: string[], sel: string[]) => {
    const s = new Set(scoped.map(get).filter(Boolean) as string[]); sel.forEach((x) => s.add(x))
    return all.filter((x) => s.has(x))
  }
  const fuelOpts = present((v) => v.fuel, fuels, f.yakit), gearOpts = present((v) => v.transmission, transmissions, f.vites)
  const bodyOpts = present((v) => v.bodyType, bodyOptionsFor(categoryName), f.kasa), driveOpts = present((v) => v.driveType, driveTypes, f.cekis)
  const colorOpts = present((v) => v.color, colors, f.renk)
  const cylOpts = cylinderOptions.filter((n) => scoped.some((v) => v.cylinders === n) || f.silindir.includes(n))
  const provOpts = present((v) => v.province, provinces, f.il ? [f.il] : [])
  const districts = f.il ? [...new Set(scoped.filter((v) => v.province === f.il).map((v) => v.district).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'tr')) : []
  const toOpts = (a: string[]): [string, string][] => a.map((x) => [x, x])
  const yearSel = (key: 'yilMin' | 'yilMax', text: string) => (
    <label className="block"><span className={label}>{text}</span>
      <select className="input" value={f[key] ?? ''} onChange={(e) => onChange({ [key]: e.target.value ? Number(e.target.value) : undefined })}>
        <option value="">Seçin</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
  )

  return (
    <div>
      <label className="block pb-3"><span className={label}>Arama</span>
        <input className="input" type="search" placeholder="Marka, model, paket…" defaultValue={f.q} key={f.q}
          onKeyDown={(e) => { if (e.key === 'Enter') onChange({ q: e.currentTarget.value }) }} onBlur={(e) => { if (e.target.value !== f.q) onChange({ q: e.target.value }, { replace: true }) }} /></label>

      <Group title="Kategori, marka ve model" open>
        <div className="space-y-3">
          <Dropdown label="Kategori" allLabel="Tüm Kategoriler" value={f.kategori} options={c.categories} onChange={(id) => onChange({ kategori: id, marka: '', model: '', nesil: '', paket: '', kasa: [] })} />
          <Dropdown label="Marka" allLabel="Tüm Markalar" value={f.marka} options={brands} emptyHint="Bu kategoride marka yok" onChange={(id) => onChange({ marka: id, model: '', nesil: '', paket: '' })} />
          <Dropdown label="Model" allLabel="Tüm Modeller" value={f.model} options={models} disabled={!f.marka} disabledHint="Önce marka seçin" emptyHint="Bu markada model yok" onChange={(id) => onChange({ model: id, nesil: '', paket: '' })} />
          <Dropdown label="Nesil / Şasi" allLabel="Tüm Nesiller" value={f.nesil} options={gens} disabled={!f.model} disabledHint="Önce model seçin" emptyHint="Tanımlı nesil yok" onChange={(id) => onChange({ nesil: id, paket: '' })} />
          <Dropdown label="Paket" allLabel="Tüm Paketler" value={f.paket} options={pkgs} disabled={!f.model} disabledHint="Önce model seçin" emptyHint="Tanımlı paket yok" onChange={(id) => onChange({ paket: id })} />
        </div>
      </Group>
      <Group title="Model yılı" open><div className="grid grid-cols-2 gap-2">{yearSel('yilMin', 'En az')}{yearSel('yilMax', 'En çok')}</div></Group>
      <Group title="Fiyat (₺)" open><Range title="Fiyat" a="fiyatMin" z="fiyatMax" min={f.fiyatMin} max={f.fiyatMax} onChange={onChange} unit="₺" placeholder={['0', '2.500.000']} /></Group>
      <Group title="Kilometre"><Range title="Kilometre" a="kmMin" z="kmMax" min={f.kmMin} max={f.kmMax} onChange={onChange} unit="km" placeholder={['0', '200.000']} /></Group>
      <Group title="Yakıt"><Checks name="Yakıt" options={toOpts(fuelOpts)} selected={f.yakit} onChange={(v) => onChange({ yakit: v })} /></Group>
      <Group title="Vites"><Checks name="Vites" options={toOpts(gearOpts)} selected={f.vites} onChange={(v) => onChange({ vites: v })} /></Group>
      <Group title={categoryName === 'Motosiklet' || categoryName === 'İş Makineleri' ? 'Alt kategori' : 'Kasa tipi'}><Checks name="Kasa tipi" options={toOpts(bodyOpts)} selected={f.kasa} onChange={(v) => onChange({ kasa: v })} /></Group>
      <Group title="Çekiş"><Checks name="Çekiş" options={toOpts(driveOpts)} selected={f.cekis} onChange={(v) => onChange({ cekis: v })} /></Group>
      <Group title="Motor">
        <div className="space-y-3">
          <Range title="Motor hacmi" a="ccMin" z="ccMax" min={f.ccMin} max={f.ccMax} onChange={onChange} unit="cc" placeholder={['1.000', '3.000']} />
          <Range title="Motor gücü" a="hpMin" z="hpMax" min={f.hpMin} max={f.hpMax} onChange={onChange} unit="HP" placeholder={['100', '400']} />
          <div><span className={label}>Silindir sayısı</span><Checks name="Silindir" options={cylOpts.map((n) => [n, String(n)] as [number, string])} selected={f.silindir} onChange={(v) => onChange({ silindir: v })} /></div>
          <div><span className={label}>Aspirasyon</span>
            <Checks name="Aspirasyon" options={[['1', 'Turbo'], ['0', 'Atmosferik']]} selected={f.turbo ? [f.turbo] : []} onChange={(v) => onChange({ turbo: (v.filter((x) => x !== f.turbo)[0] ?? '') as Filters['turbo'] })} /></div>
        </div>
      </Group>
      <Group title="Renk"><Checks name="Renk" options={toOpts(colorOpts)} selected={f.renk} onChange={(v) => onChange({ renk: v })} /></Group>
      <Group title="Hasar durumu"><Checks name="Hasar" options={damageOptions} selected={f.hasar} onChange={(v) => onChange({ hasar: v })} />
        <p className="mt-2 text-xs text-neutral-500">Yönetici tarafından doğrulanmamış araçlar “Hatasız” sayılmaz.</p></Group>
      <Group title="Diğer özellikler">
        <fieldset><legend className="sr-only">Diğer özellikler</legend>
          {([['ilkSahibi', 'İlk sahibinden'], ['garanti', 'Garantili'], ['servis', 'Yetkili servis bakımlı'], ['takas', 'Takas olur'], ['kredi', 'Krediye uygun'], ['onecikan', 'Öne çıkan ilanlar']] as const).map(([k, l]) => (
            <label key={k} className="flex min-h-9 items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[#ff6a13]" checked={f[k]} onChange={() => onChange({ [k]: !f[k] })} />{l}</label>))}
        </fieldset>
      </Group>
      <Group title="Konum">
        <div className="space-y-3">
          <label className="block"><span className={label}>İl</span><select className="input" value={f.il} onChange={(e) => onChange({ il: e.target.value, ilce: '' })}><option value="">Tümü</option>{provOpts.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label className="block"><span className={label}>İlçe</span><select className="input" value={f.ilce} disabled={!f.il} onChange={(e) => onChange({ ilce: e.target.value })}><option value="">Tümü</option>{districts.map((d) => <option key={d}>{d}</option>)}</select></label>
        </div>
      </Group>
      <Group title="İlan tarihi"><label className="block"><span className="sr-only">İlan tarihi</span>
        <select className="input" value={f.tarih} onChange={(e) => onChange({ tarih: Number(e.target.value) })}><option value={0}>Tümü</option>{dateOptions.map(([d, l]) => <option key={d} value={d}>{l}</option>)}</select></label></Group>
    </div>
  )
}
