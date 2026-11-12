import type { Timestamp } from 'firebase/firestore'

export type VehicleStatus = 'draft' | 'published' | 'reserved' | 'sold' | 'archived'

export interface VehicleImage { url: string; path: string }

export interface Vehicle {
  id: string
  listingNo: string
  stockNo?: string
  title: string
  description?: string
  status: VehicleStatus
  featured: boolean
  category: string
  brand: string
  model: string
  generation?: string
  package?: string
  year: number
  mileage: number
  fuel: string
  transmission: string
  driveType?: string
  bodyType?: string
  color?: string
  enginePowerHp?: number
  engineCc?: number
  price: number
  currency: 'TRY' | 'EUR' | 'USD'
  negotiable?: boolean
  exchange?: boolean
  financing?: boolean
  damageStatus?: string           // 'Belirtilmemiş' | 'Hasar Kaydı Yok' | ...
  panelsVerified?: boolean        // kaporta bilgileri yönetici tarafından doğrulandı
  paintedCount?: number           // kayıt sırasında panellerden türetilir
  replacedCount?: number
  cylinders?: number
  turbo?: boolean
  firstOwner?: boolean
  warranty?: boolean
  authorizedService?: boolean
  province?: string
  district?: string
  categoryId?: string
  brandId?: string
  modelId?: string
  generationId?: string
  packageId?: string
  tramerAmount?: number
  equipment?: string[]
  panels?: Record<string, string>  // panel adı -> durum
  expertNotes?: string
  images: VehicleImage[]          // ilk görsel kapak fotoğrafıdır
  videoUrl?: string
  expertReportUrl?: string
  listedAt?: Timestamp
  soldAt?: Timestamp
  soldPrice?: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface SiteSettings {
  phone?: string
  whatsapp?: string          // uluslararası biçim, örn. 905551234567
  instagram?: string
  facebook?: string
  email?: string
  address?: string
  mapsUrl?: string
  workingHours?: string
  logoUrl?: string
  heroTitle?: string
  heroSubtitle?: string
  aboutText?: string
  siteTitle?: string
  metaDescription?: string
}

export interface ContactMessage {
  name: string
  phone: string
  email: string
  message: string
  vehicleId: string
  read: boolean
}
