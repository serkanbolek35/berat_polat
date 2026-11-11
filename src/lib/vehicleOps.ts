import { collection, deleteDoc, deleteField, doc, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { db, storage } from './firebase'
import type { Vehicle, VehicleImage, VehicleStatus } from '../types'

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
