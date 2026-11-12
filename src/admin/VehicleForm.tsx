import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { deleteField, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { newVehicleId, resolveCatalog, saveVehicle, uploadPdf } from '../lib/vehicleOps'
import { bodyOptionsFor, categories, colors, damageStatuses, driveTypes, equipmentGroups, fuels, panelNames, panelStates, transmissions } from '../data/options'
import { provinces } from '../data/provinces'
import type { Vehicle, VehicleImage } from '../types'
import PhotoManager from './PhotoManager'
import { useCatalog } from '../hooks/useCatalog'
import VehicleCard from '../components/VehicleCard'

const optNum = z.number().optional()
const schema = z.object({
  category: z.string().min(1, 'Kategori seçin.'),
  brand: z.string().trim().min(1, 'Marka yazın.'),
  model: z.string().trim().min(1, 'Model yazın.'),
  generation: z.string().optional(), package: z.string().optional(), stockNo: z.string().optional(),
  year: z.number({ invalid_type_error: 'Model yılını girin.' }).int().min(1950, 'Yıl geçersiz.').max(new Date().getFullYear() + 1, 'Yıl geçersiz.'),
  bodyType: z.string().optional(), color: z.string().optional(),
  cylinders: optNum, turbo: z.boolean(), firstOwner: z.boolean(), warranty: z.boolean(), authorizedService: z.boolean(),
  province: z.string().optional(), district: z.string().optional(),
  fuel: z.string().min(1, 'Yakıt türünü seçin.'), engineCc: optNum, enginePowerHp: optNum,
  transmission: z.string().min(1, 'Vites türünü seçin.'), driveType: z.string().optional(),
  mileage: z.number({ invalid_type_error: 'Kilometreyi girin.' }).min(0, 'Kilometre geçersiz.'),
  damageStatus: z.string().optional(), panelsVerified: z.boolean(), tramerAmount: optNum, expertNotes: z.string().optional(),
  panels: z.record(z.string()), equipment: z.array(z.string()),
  title: z.string().trim().min(3, 'İlan başlığı yazın.'), description: z.string().optional(),
  price: z.number({ invalid_type_error: 'Fiyatı girin.' }).positive('Fiyatı girin.'),
  currency: z.enum(['TRY', 'EUR', 'USD']),
  negotiable: z.boolean(), exchange: z.boolean(), financing: z.boolean(), featured: z.boolean(),
  videoUrl: z.string().url('Geçerli bir bağlantı girin.').optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

const steps: { name: string; fields: FieldPath<FormValues>[] }[] = [
  { name: 'Kimlik', fields: ['category', 'brand', 'model', 'year'] },
  { name: 'Teknik', fields: ['fuel', 'transmission', 'mileage'] },
  { name: 'Hasar', fields: ['tramerAmount'] },
  { name: 'Donanım', fields: [] },
  { name: 'Fiyat', fields: ['title', 'price', 'videoUrl'] },
  { name: 'Fotoğraf', fields: [] },
  { name: 'Önizleme', fields: [] },
]
const empty: FormValues = {
  category: 'Otomobil', brand: '', model: '', year: new Date().getFullYear(), fuel: '', transmission: '', mileage: 0,
  damageStatus: 'Belirtilmemiş', panelsVerified: false, turbo: false, firstOwner: false, warranty: false, authorizedService: false, panels: {}, equipment: [], title: '', price: 0, currency: 'TRY',
  negotiable: false, exchange: false, financing: false, featured: false,
}
function CatalogSelect({ label, value, options, onChange, error }: { label: string; value: string; options: string[]; onChange: (v: string) => void; error?: string }) {
  const [custom, setCustom] = useState(false)
  const isCustom = custom || (value !== '' && !options.includes(value))
  return (
    <label className="block text-sm font-medium">{label}
      {isCustom ? (
        <span className="mt-1.5 flex gap-2"><input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
          <button type="button" className="shrink-0 text-xs underline" onClick={() => { setCustom(false); onChange('') }}>Listeden seç</button></span>
      ) : (
        <select className="input mt-1.5" value={value} onChange={(e) => { if (e.target.value === '__other') { setCustom(true); onChange('') } else onChange(e.target.value) }}>
          <option value="">Seçin</option>{options.map((o) => <option key={o}>{o}</option>)}<option value="__other">Listede yok, elle yaz</option></select>
      )}
      {error && <span role="alert" className="mt-1 block text-sm text-red-700">{error}</span>}
    </label>
  )
}
const opt = { setValueAs: (v: string) => (v === '' || v == null ? undefined : Number(v)) }

export default function VehicleForm() {
  const { id: param } = useParams(); const nav = useNavigate()
  const isNew = !param
  const [vid] = useState(() => param ?? newVehicleId())
  const [existing, setExisting] = useState<Vehicle | null>(null)
  const [ready, setReady] = useState(isNew)
  const [step, setStep] = useState(0)
  const [images, setImages] = useState<VehicleImage[]>([])
  const [pdf, setPdf] = useState<string | undefined>()
  const [eqSearch, setEqSearch] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const savedRef = useRef(!isNew)

  const { register, handleSubmit, trigger, watch, setValue, getValues, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty })

  useEffect(() => {
    if (isNew) return
    getDoc(doc(db, 'vehicles', vid)).then((s) => {
      if (!s.exists()) { setMsg({ ok: false, t: 'Araç bulunamadı.' }); return }
      const v = { id: s.id, images: [], ...s.data() } as unknown as Vehicle
      setExisting(v); setImages(v.images ?? []); setPdf(v.expertReportUrl)
      reset({ ...empty, ...(Object.fromEntries(Object.keys(empty).map((k) => [k, (v as unknown as Record<string, unknown>)[k]]).filter(([, x]) => x !== undefined)) as Partial<FormValues>), videoUrl: v.videoUrl ?? '' })
      setReady(true)
    })
  }, [isNew, vid, reset])

  const w = watch()
  const eq = w.equipment ?? []
  const cat = useCatalog()
  const pick = (name: FieldPath<FormValues>, v: string, clear: FieldPath<FormValues>[] = []) => {
    setValue(name, v as never, { shouldDirty: true, shouldValidate: !!errors[name as keyof typeof errors] })
    clear.forEach((k) => setValue(k, '' as never, { shouldDirty: true }))
  }
  const catOpts = cat.categories.length ? cat.categories.map((x) => x.name) : categories
  const brandOpts = cat.brands.filter((b) => !b.categories?.length || b.categories.includes(w.category)).map((b) => b.name)
  const brandObj = cat.brands.find((b) => b.name === w.brand)
  const modelObj = brandObj ? cat.models.find((m) => m.brandId === brandObj.id && m.name === w.model) : undefined
  const modelOpts = brandObj ? cat.models.filter((m) => m.brandId === brandObj.id).map((m) => m.name) : []
  const genObj = modelObj ? cat.generations.find((g) => g.modelId === modelObj.id && g.name === w.generation) : undefined
  const genOpts = modelObj ? cat.generations.filter((g) => g.modelId === modelObj.id).map((g) => g.name) : []
  const pkgOpts = modelObj ? cat.packages.filter((x) => x.modelId === modelObj.id && (!genObj || !x.generationId || x.generationId === genObj.id)).map((x) => x.name) : []
  const eqGroups = useMemo(() => {
    const g: Record<string, string[]> = Object.fromEntries(Object.entries(equipmentGroups).map(([k, v]) => [k, [...v]]))
    cat.equipment.forEach((e) => { g[e.group] ??= []; if (!Object.values(g).some((l) => l.includes(e.name))) g[e.group].push(e.name) })
    return g
  }, [cat.equipment])

  const persist = async (values: FormValues, status: Vehicle['status']) => {
    setBusy(true); setMsg(null)
    try {
      const ids = await resolveCatalog(values, cat)
      const verified = values.panelsVerified
      const panels = verified ? Object.fromEntries(panelNames.map((p) => [p, values.panels?.[p] ?? 'Orijinal'])) : {}
      const count = (...st: string[]) => Object.values(panels).filter((x) => st.includes(x)).length
      const data: Record<string, unknown> = {
        ...values, panels, paintedCount: count('Boyalı', 'Lokal Boyalı'), replacedCount: count('Değişen'),
        brand: ids.brandName ?? values.brand, model: ids.modelName ?? values.model, generation: ids.generationName ?? deleteField(), package: ids.packageName ?? deleteField(),
        categoryId: ids.categoryId ?? deleteField(), brandId: ids.brandId ?? deleteField(), modelId: ids.modelId ?? deleteField(),
        generationId: ids.generationId ?? deleteField(), packageId: ids.packageId ?? deleteField(),
        videoUrl: values.videoUrl || deleteField(), images, status, expertReportUrl: pdf ?? deleteField(),
      }
      if (status === 'published' && !existing?.listedAt) data.listedAt = serverTimestamp()
      await saveVehicle(vid, data, !savedRef.current)
      savedRef.current = true
      setMsg({ ok: true, t: status === 'published' ? 'Araç yayında.' : 'Kaydedildi.' })
      if (isNew) nav(`/admin/araclar/${vid}`, { replace: true })
      else setExisting((e) => e && { ...e, status })
    } catch { setMsg({ ok: false, t: 'Kaydedilemedi. Bağlantınızı ve yönetici yetkinizi kontrol edin.' }) }
    setBusy(false)
  }

  const saveDraft = () => persist(getValues(), existing?.status ?? 'draft')           // doğrulamasız: yarım bilgi kaybolmasın
  const publish = handleSubmit((v) => persist(v, 'published'), () => setMsg({ ok: false, t: 'Eksik veya hatalı alanlar var. İlgili adımlara dönüp düzeltin.' }))

  const next = async () => { if (await trigger(steps[step].fields)) setStep(step + 1) }
  const onImages = async (imgs: VehicleImage[]) => {
    setImages(imgs)
    if (savedRef.current) await updateDoc(doc(db, 'vehicles', vid), { images: imgs, updatedAt: serverTimestamp() }).catch(() => setMsg({ ok: false, t: 'Fotoğraf listesi kaydedilemedi.' }))
  }

  const preview = useMemo<Vehicle>(() => ({
    ...(w as unknown as Vehicle), id: vid, listingNo: existing?.listingNo ?? 'Otomatik', status: 'published', images, price: w.price || 0,
  }), [w, vid, images, existing])

  if (!ready) return <p className="text-neutral-600">{msg?.t ?? 'Yükleniyor…'}</p>

  const F = ({ label, name, err, children }: { label: string; name?: string; err?: string; children: React.ReactNode }) => (
    <label className="block text-sm font-medium">{label}{children}{err && <span role="alert" className="mt-1 block text-sm text-red-700">{err}</span>}{name && null}</label>
  )
  const Check = ({ name, label }: { name: 'panelsVerified' | 'turbo' | 'firstOwner' | 'warranty' | 'authorizedService' | 'negotiable' | 'exchange' | 'financing' | 'featured'; label: string }) => (
    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[#ff6a13]" {...register(name)} />{label}</label>
  )
  const Select = ({ name, list, placeholder }: { name: 'category' | 'fuel' | 'transmission' | 'driveType' | 'bodyType' | 'color' | 'damageStatus' | 'province'; list: string[]; placeholder?: string }) => (
    <select className="input mt-1.5" {...register(name)}><option value="">{placeholder ?? 'Seçin'}</option>{list.map((x) => <option key={x}>{x}</option>)}</select>
  )

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold">{isNew ? 'Yeni araç' : (existing?.title || 'Araç düzenle')}</h1>
      {existing && <p className="mt-1 text-sm text-neutral-600">{existing.listingNo}</p>}
      <ol className="mt-6 flex flex-wrap gap-2" aria-label="Adımlar">
        {steps.map((s, i) => <li key={s.name}><button type="button" onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}
          className={`rounded-full px-4 py-2 text-sm font-medium ${i === step ? 'bg-ink text-white' : 'bg-white'}`}>{i + 1}. {s.name}</button></li>)}
      </ol>

      <form onSubmit={(e) => e.preventDefault()} className="mt-6 rounded-2xl bg-white p-6" noValidate>
        {step === 0 && <div className="grid gap-4 sm:grid-cols-2">
          <CatalogSelect label="Kategori" value={w.category} options={catOpts} error={errors.category?.message} onChange={(v) => pick('category', v)} />
          <F label="Stok no"><input className="input mt-1.5" {...register('stockNo')} /></F>
          <CatalogSelect label="Marka" value={w.brand} options={brandOpts} error={errors.brand?.message} onChange={(v) => pick('brand', v, ['model', 'generation', 'package'])} />
          <CatalogSelect label="Model" value={w.model} options={modelOpts} error={errors.model?.message} onChange={(v) => pick('model', v, ['generation', 'package'])} />
          <CatalogSelect label="Nesil" value={w.generation ?? ''} options={genOpts} onChange={(v) => pick('generation', v, ['package'])} />
          <CatalogSelect label="Paket" value={w.package ?? ''} options={pkgOpts} onChange={(v) => pick('package', v)} />
          <F label="Model yılı" err={errors.year?.message}><input className="input mt-1.5" inputMode="numeric" {...register('year', { valueAsNumber: true })} /></F>
          <F label="Kasa tipi / alt kategori"><Select name="bodyType" list={bodyOptionsFor(w.category)} /></F>
          <F label="Renk"><Select name="color" list={colors} /></F>
        </div>}

        {step === 1 && <div className="grid gap-4 sm:grid-cols-2">
          <F label="Yakıt" err={errors.fuel?.message}><Select name="fuel" list={fuels} /></F>
          <F label="Vites" err={errors.transmission?.message}><Select name="transmission" list={transmissions} /></F>
          <F label="Çekiş"><Select name="driveType" list={driveTypes} /></F>
          <F label="Kilometre" err={errors.mileage?.message}><input className="input mt-1.5" inputMode="numeric" {...register('mileage', { valueAsNumber: true })} /></F>
          <F label="Motor hacmi (cc)"><input className="input mt-1.5" inputMode="numeric" {...register('engineCc', opt)} /></F>
          <F label="Motor gücü (HP)"><input className="input mt-1.5" inputMode="numeric" {...register('enginePowerHp', opt)} /></F>
          <F label="Silindir sayısı"><input className="input mt-1.5" inputMode="numeric" {...register('cylinders', opt)} /></F>
          <div className="flex items-end"><Check name="turbo" label="Turbo" /></div>
        </div>}

        {step === 2 && <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Hasar durumu"><Select name="damageStatus" list={damageStatuses} /></F>
            <F label="TRAMER toplam tutarı (₺)" err={errors.tramerAmount?.message}><input className="input mt-1.5" inputMode="numeric" {...register('tramerAmount', opt)} /></F>
          </div>
          <div className="flex flex-wrap gap-x-6"><Check name="firstOwner" label="İlk sahibinden" /><Check name="warranty" label="Garantili" /><Check name="authorizedService" label="Yetkili servis bakımlı" /></div>
          <fieldset><legend className="mb-2 text-sm font-medium">Kaporta durumu</legend>
            <Check name="panelsVerified" label="Kaporta bilgilerini kontrol ettim ve doğruluyorum (işaretlenmezse sitede gösterilmez ve araç “hatasız” sayılmaz)" />
            <div className="grid gap-2 sm:grid-cols-2">{panelNames.map((p) => (
              <label key={p} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3 py-2 text-sm">{p}
                <select disabled={!w.panelsVerified} className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 disabled:opacity-50" value={w.panels?.[p] ?? 'Orijinal'} onChange={(e) => setValue('panels', { ...getValues('panels'), [p]: e.target.value }, { shouldDirty: true })}>
                  {panelStates.map((s) => <option key={s}>{s}</option>)}</select></label>))}</div></fieldset>
          <F label="Ekspertiz ve hasar notları"><textarea className="input mt-1.5 min-h-24 py-3" {...register('expertNotes')} /></F>
          <div className="text-sm"><span className="font-medium">Ekspertiz raporu (PDF)</span>
            <input type="file" accept="application/pdf" className="mt-1.5 block" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setPdf(await uploadPdf(vid, f)); setMsg({ ok: true, t: 'Rapor yüklendi. Kaydetmeyi unutmayın.' }) } catch { setMsg({ ok: false, t: 'Rapor yüklenemedi.' }) } }} />
            {pdf && <p className="mt-1"><a className="underline" href={pdf} target="_blank" rel="noreferrer">Yüklü raporu aç</a> · <button type="button" className="underline" onClick={() => setPdf(undefined)}>Kaldır</button></p>}</div>
        </div>}

        {step === 3 && <div>
          <input className="input mb-5" type="search" placeholder="Donanım ara…" value={eqSearch} onChange={(e) => setEqSearch(e.target.value)} aria-label="Donanım ara" />
          {Object.entries(eqGroups).map(([g, items]) => {
            const shown = items.filter((x) => x.toLocaleLowerCase('tr').includes(eqSearch.toLocaleLowerCase('tr')))
            return shown.length ? <fieldset key={g} className="mb-5"><legend className="mb-2 font-semibold">{g}</legend>
              <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">{shown.map((x) => (
                <label key={x} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[#ff6a13]" checked={eq.includes(x)} onChange={() => setValue('equipment', eq.includes(x) ? eq.filter((y) => y !== x) : [...eq, x], { shouldDirty: true })} />{x}</label>))}</div></fieldset> : null
          })}
        </div>}

        {step === 4 && <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><F label="İlan başlığı" err={errors.title?.message}><input className="input mt-1.5" {...register('title')} onFocus={() => { if (!getValues('title')) setValue('title', [getValues('brand'), getValues('model'), getValues('package')].filter(Boolean).join(' ')) }} /></F></div>
          <F label="Fiyat" err={errors.price?.message}><input className="input mt-1.5" inputMode="numeric" {...register('price', { valueAsNumber: true })} /></F>
          <F label="Para birimi"><select className="input mt-1.5" {...register('currency')}><option value="TRY">₺ TL</option><option value="EUR">€ Euro</option><option value="USD">$ Dolar</option></select></F>
          <F label="İl"><Select name="province" list={provinces} /></F>
          <F label="İlçe"><input className="input mt-1.5" {...register('district')} /></F>
          <div className="flex flex-wrap gap-x-6 sm:col-span-2"><Check name="negotiable" label="Pazarlık payı var" /><Check name="exchange" label="Takas olur" /><Check name="financing" label="Kredi uygun" /><Check name="featured" label="Öne çıkar" /></div>
          <div className="sm:col-span-2"><F label="Açıklama"><textarea className="input mt-1.5 min-h-36 py-3" {...register('description')} /></F></div>
          <div className="sm:col-span-2"><F label="YouTube video bağlantısı" err={errors.videoUrl?.message}><input className="input mt-1.5" {...register('videoUrl')} placeholder="https://www.youtube.com/watch?v=…" /></F></div>
        </div>}

        {step === 5 && <PhotoManager vehicleId={vid} images={images} onChange={onImages} />}

        {step === 6 && <div>
          <p className="mb-4 text-sm text-neutral-600">İlan sitede böyle görünecek. Eksik bir şey varsa ilgili adıma dönün.</p>
          <div className="max-w-sm"><VehicleCard v={preview} /></div>
        </div>}
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-outline-dark" disabled={step === 0} onClick={() => setStep(step - 1)}>Geri</button>
        {step < steps.length - 1 && <button type="button" className="btn btn-outline-dark" onClick={next}>İleri</button>}
        <span className="flex-1" />
        <button type="button" className="btn btn-outline-dark" disabled={busy} onClick={saveDraft}>{existing && existing.status !== 'draft' ? 'Kaydet' : 'Taslak olarak kaydet'}</button>
        {(!existing || !['published', 'sold'].includes(existing.status)) && <button type="button" className="btn btn-accent" disabled={busy} onClick={publish}>Kaydet ve yayınla</button>}
      </div>
      <p aria-live="polite" className={`mt-3 text-sm ${msg?.ok ? 'text-green-800' : 'text-red-700'}`}>{msg?.t}</p>
    </div>
  )
}
