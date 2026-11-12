import { arrayUnion, collection, deleteDoc, deleteField, doc, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { db, storage } from './firebase'
import type { Vehicle, VehicleImage, VehicleStatus } from '../types'
import type { Brand, Category, Generation, Model, Pkg } from '../hooks/useCatalog'
import { slugify } from './format'

export const newVehicleId = () => doc(collection(db, 'vehicles')).id

async function nextListingNo() {
  const r = doc(db, 'siteSettings', 'counters')
  const n = await runTransaction(db, async (tx) => {
    const next = ((await tx.get(r)).data()?.vehicleSeq ?? 0) + 1
    tx.set(r, { vehicleSeq: next }, { merge: true })
    return next
  })
  return `BEP-${String(n).padStart(4, '0')}`
}

const clean = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))

export async function saveVehicle(id: string, data: Record<string, unknown>, isNew: boolean) {
  const payload: Record<string, unknown> = { ...clean(data), updatedAt: serverTimestamp() }
  if (isNew) { payload.createdAt = serverTimestamp(); payload.listingNo = await nextListingNo() }
  await setDoc(doc(db, 'vehicles', id), payload, { merge: true })
}

/** Tek belge, tek kaynak: durum değişince araç ilgili listeye otomatik geçer. */
export async function changeStatus(v: Pick<Vehicle, 'id' | 'listedAt'>, status: VehicleStatus, opts?: { soldAt?: Date; soldPrice?: number }) {
  const p: Record<string, any> = { status, updatedAt: serverTimestamp() }  // eslint-disable-line @typescript-eslint/no-explicit-any
  if (status === 'published' && !v.listedAt) p.listedAt = serverTimestamp()
  if (status === 'sold') {
    p.soldAt = opts?.soldAt ? Timestamp.fromDate(opts.soldAt) : serverTimestamp()
    p.soldPrice = opts?.soldPrice ? opts.soldPrice : deleteField()
  } else if (status !== 'archived') {
    p.soldAt = deleteField(); p.soldPrice = deleteField()
  }
  await updateDoc(doc(db, 'vehicles', v.id), p)
}

export const setFeatured = (id: string, featured: boolean) => updateDoc(doc(db, 'vehicles', id), { featured, updatedAt: serverTimestamp() })

export async function editSale(id: string, soldAt: Date, soldPrice?: number) {
  await updateDoc(doc(db, 'vehicles', id), { soldAt: Timestamp.fromDate(soldAt), soldPrice: soldPrice || deleteField(), updatedAt: serverTimestamp() })
}

export async function duplicateVehicle(v: Vehicle) {
  const { id: _id, listingNo: _n, createdAt: _c, updatedAt: _u, listedAt: _l, soldAt: _s, soldPrice: _p, images: _i, expertReportUrl: _e, ...rest } = v
  const id = newVehicleId()
  // Fotoğraflar kopyalanmaz: aynı dosyayı iki ilan paylaşırsa birini silmek diğerini bozar.
  await saveVehicle(id, { ...rest, title: `${v.title} (Kopya)`, status: 'draft', featured: false, images: [] }, true)
  return id
}

export async function removeVehicle(v: Vehicle) {
  await Promise.all((v.images ?? []).map((i) => deleteObject(ref(storage, i.path)).catch(() => {})))
  await deleteDoc(doc(db, 'vehicles', v.id))
}

/** Yüklemeden önce 1920px'e küçültüp WebP'ye çevirir. */
async function compress(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const k = Math.min(1, 1920 / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.82))
    return blob && blob.size < file.size ? blob : file
  } catch { return file }
}

export async function uploadImage(vehicleId: string, file: File, onProgress: (pct: number) => void): Promise<VehicleImage> {
  const blob = await compress(file)
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `vehicles/${vehicleId}/images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const task = uploadBytesResumable(ref(storage, path), blob, { contentType: blob.type })
  await new Promise<void>((res, rej) => task.on('state_changed', (s) => onProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)), rej, () => res()))
  return { url: await getDownloadURL(task.snapshot.ref), path }
}

export async function uploadPdf(vehicleId: string, file: File) {
  const path = `vehicles/${vehicleId}/documents/${Date.now()}-expert.pdf`
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: 'application/pdf' })
  await new Promise<void>((res, rej) => task.on('state_changed', undefined, rej, () => res()))
  return getDownloadURL(task.snapshot.ref)
}

export const deleteFile = (path: string) => deleteObject(ref(storage, path)).catch(() => {})

interface CatalogData { categories: Category[]; brands: Brand[]; models: Model[]; generations: Generation[]; packages: Pkg[] }
export interface ResolvedCatalog { categoryId?: string; brandId?: string; brandName?: string; modelId?: string; modelName?: string; generationId?: string; generationName?: string; packageId?: string; packageName?: string }

/**
 * Formda yazılan/seçilen adları katalogdaki kayıtlarla eşler; katalogda yoksa kaydı oluşturur.
 * Böylece yönetici ve ziyaretçi filtreleri her zaman aynı veri kümesini kullanır (tutarsız ikinci bir liste oluşmaz).
 * Kimlikler adlardan türetildiği için aynı ad iki kez oluşturulmaz.
 */
export async function resolveCatalog(v: { category?: string; brand?: string; model?: string; generation?: string; package?: string }, c: CatalogData): Promise<ResolvedCatalog> {
  const eq = (a: string, b: string) => a.trim().toLocaleLowerCase('tr') === b.trim().toLocaleLowerCase('tr')
  const out: ResolvedCatalog = {}; const b = writeBatch(db); let dirty = false
  const category = v.category?.trim(); const brand = v.brand?.trim(); const model = v.model?.trim(); const gen = v.generation?.trim(); const pkg = v.package?.trim()

  if (category) {
    const hit = c.categories.find((x) => eq(x.name, category)); out.categoryId = hit?.id ?? slugify(category)
    if (!hit) { b.set(doc(db, 'vehicleCategories', out.categoryId), { name: category }, { merge: true }); dirty = true }
  }
  if (brand) {
    const hit = c.brands.find((x) => eq(x.name, brand)); out.brandId = hit?.id ?? slugify(brand); out.brandName = hit?.name ?? brand
    if (!hit) { b.set(doc(db, 'vehicleBrands', out.brandId), { name: brand, categories: category ? [category] : [] }, { merge: true }); dirty = true }
    else if (category && hit.categories?.length && !hit.categories.includes(category)) { b.update(doc(db, 'vehicleBrands', hit.id), { categories: arrayUnion(category) }); dirty = true }
  }
  if (out.brandId && model) {
    const hit = c.models.find((x) => x.brandId === out.brandId && eq(x.name, model)); out.modelId = hit?.id ?? `${out.brandId}__${slugify(model)}`; out.modelName = hit?.name ?? model
    if (!hit) { b.set(doc(db, 'vehicleModels', out.modelId), { name: model, brandId: out.brandId }, { merge: true }); dirty = true }
  }
  if (out.modelId && gen) {
    const hit = c.generations.find((x) => x.modelId === out.modelId && eq(x.name, gen)); out.generationId = hit?.id ?? `${out.modelId}__${slugify(gen)}`; out.generationName = hit?.name ?? gen
    if (!hit) { b.set(doc(db, 'vehicleGenerations', out.generationId), { name: gen, modelId: out.modelId }, { merge: true }); dirty = true }
  }
  if (out.modelId && pkg) {
    const hit = c.packages.find((x) => x.modelId === out.modelId && eq(x.name, pkg)); out.packageId = hit?.id ?? `${out.modelId}__${slugify(pkg)}`; out.packageName = hit?.name ?? pkg
    if (!hit) { b.set(doc(db, 'vehiclePackages', out.packageId), { name: pkg, modelId: out.modelId, generationId: out.generationId ?? null }, { merge: true }); dirty = true }
  }
  if (dirty) await b.commit()
  return out
}
