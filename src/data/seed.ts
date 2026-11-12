import { collection, doc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { categories } from './options'
import { slugify } from '../lib/format'

const CAR = ['Otomobil', 'SUV', 'Elektrikli Araçlar']
const CARX = [...CAR, 'Arazi Araçları']
const MOTO = ['Motosiklet']
const TRUCK = ['Kamyon', 'Çekici', 'Kamyonet']
const BUS = ['Otobüs', 'Midibüs', 'Minibüs']
const TRACTOR = ['Traktör']
const WORK = ['İş Makineleri']

// [marka, kategoriler, modeller]. Modeller başlangıç içindir; yönetim panelinden genişletilir.
const data: [string, string[], string[]][] = [
  ['BMW', CAR, ['1 Serisi', '2 Serisi', '3 Serisi', '4 Serisi', '5 Serisi', '7 Serisi', 'X1', 'X3', 'X5', 'iX', 'i4']],
  ['Mercedes-Benz', [...CARX, ...BUS], ['A Serisi', 'C Serisi', 'E Serisi', 'S Serisi', 'CLA', 'GLA', 'GLC', 'GLE', 'EQC', 'Vito', 'Sprinter']],
  ['Audi', CAR, ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'e-tron']],
  ['Volkswagen', [...CAR, 'Kamyonet'], ['Polo', 'Golf', 'Passat', 'Tiguan', 'T-Roc', 'Jetta', 'Arteon', 'Caddy', 'Transporter', 'ID.4']],
  ['Renault', [...CAR, 'Kamyonet'], ['Clio', 'Megane', 'Taliant', 'Captur', 'Austral', 'Kadjar', 'Fluence', 'Kangoo', 'Trafic']],
  ['Fiat', [...CAR, 'Kamyonet'], ['Egea', 'Doblo', 'Fiorino', 'Panda', '500', 'Linea', 'Ducato']],
  ['Ford', [...CARX, 'Pick-up', 'Kamyonet'], ['Fiesta', 'Focus', 'Puma', 'Kuga', 'Mondeo', 'Courier', 'Transit', 'Ranger']],
  ['Toyota', [...CARX, 'Pick-up'], ['Corolla', 'Yaris', 'C-HR', 'RAV4', 'Auris', 'Hilux', 'Land Cruiser', 'Camry']],
  ['Honda', [...CAR, ...MOTO], ['Civic', 'City', 'Accord', 'CR-V', 'HR-V', 'Jazz']],
  ['Hyundai', CAR, ['i10', 'i20', 'i30', 'Elantra', 'Accent Blue', 'Tucson', 'Kona', 'Bayon']],
  ['Kia', CAR, ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Sorento', 'Stonic', 'Niro', 'EV6']],
  ['Peugeot', [...CAR, 'Kamyonet'], ['208', '308', '408', '2008', '3008', '5008', 'Rifter', 'Partner']],
  ['Citroën', [...CAR, 'Kamyonet'], ['C3', 'C4', 'C5 Aircross', 'C-Elysée', 'Berlingo']],
  ['Opel', CAR, ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland']],
  ['Škoda', CAR, ['Fabia', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq']],
  ['Seat', CAR, ['Ibiza', 'Leon', 'Arona', 'Ateca']],
  ['Cupra', CAR, ['Formentor', 'Leon', 'Born']],
  ['Dacia', CAR, ['Sandero', 'Duster', 'Jogger', 'Lodgy', 'Dokker']],
  ['Nissan', CARX, ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Navara', 'Leaf']],
  ['Volvo', [...CAR, ...TRUCK], ['S60', 'S90', 'V40', 'V60', 'XC40', 'XC60', 'XC90']],
  ['Mazda', CAR, ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-30']],
  ['Mitsubishi', [...CARX, 'Pick-up'], ['ASX', 'Eclipse Cross', 'L200', 'Outlander']],
  ['Suzuki', [...CARX, ...MOTO], ['Swift', 'Vitara', 'SX4 S-Cross', 'Jimny']],
  ['Porsche', CAR, ['911', 'Macan', 'Cayenne', 'Panamera', 'Taycan']],
  ['Jeep', CARX, ['Renegade', 'Compass', 'Cherokee', 'Wrangler']],
  ['Land Rover', CARX, ['Defender', 'Discovery', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport']],
  ['Lexus', CAR, ['IS', 'ES', 'NX', 'RX', 'UX']],
  ['Mini', CAR, ['Cooper', 'Countryman', 'Clubman']],
  ['Alfa Romeo', CAR, ['Giulia', 'Giulietta', 'Stelvio']],
  ['Tesla', ['Elektrikli Araçlar', 'Otomobil', 'SUV'], ['Model 3', 'Model S', 'Model X', 'Model Y']],
  ['BYD', ['Elektrikli Araçlar', 'Otomobil', 'SUV'], ['Atto 3', 'Seal', 'Dolphin', 'Han']],
  ['MG', CAR, ['ZS', 'HS', 'MG4']],
  ['Chery', CAR, ['Tiggo 7', 'Tiggo 8', 'Omoda 5']],
  ['TOGG', ['Elektrikli Araçlar', 'Otomobil', 'SUV'], ['T10X']],
  ['DS Automobiles', CAR, ['DS 3', 'DS 4', 'DS 7']],
  ['Isuzu', ['Pick-up', ...TRUCK], ['D-Max']],
  ['MAN', [...TRUCK, ...BUS], []], ['Scania', [...TRUCK, ...BUS], []], ['Iveco', [...TRUCK, ...BUS, 'Minibüs'], []],
  ['DAF', TRUCK, []], ['Temsa', BUS, []], ['Otokar', BUS, []], ['BMC', [...TRUCK, ...BUS], []],
  ['Massey Ferguson', TRACTOR, []], ['New Holland', [...TRACTOR, ...WORK], []], ['John Deere', [...TRACTOR, ...WORK], []],
  ['Yamaha', MOTO, []], ['Kawasaki', MOTO, []], ['KTM', MOTO, []], ['Ducati', MOTO, []], ['Vespa', MOTO, []],
]

export async function seedCatalog() {
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = []
  categories.forEach((name, i) => ops.push((b) => b.set(doc(db, 'vehicleCategories', slugify(name)), { name, order: i })))
  for (const [brand, cats, models] of data) {
    const bid = slugify(brand)
    ops.push((b) => b.set(doc(collection(db, 'vehicleBrands'), bid), { name: brand, categories: cats }))
    for (const m of models) ops.push((b) => b.set(doc(collection(db, 'vehicleModels'), `${bid}__${slugify(m)}`), { name: m, brandId: bid }))
  }
  for (let i = 0; i < ops.length; i += 400) { const b = writeBatch(db); ops.slice(i, i + 400).forEach((f) => f(b)); await b.commit() }
}
