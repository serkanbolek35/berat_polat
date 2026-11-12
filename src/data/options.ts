export const categories = ['Otomobil','SUV','Arazi Araçları','Pick-up','Elektrikli Araçlar','Motosiklet','Minibüs','Midibüs','Kamyonet','Kamyon','Otobüs','Çekici','Traktör','İş Makineleri','Karavan','Römork','Özel Amaçlı Araçlar','Diğer Vasıtalar']
export const fuels = ['Benzin','Dizel','LPG','Benzin + LPG','Hibrit','Plug-in Hibrit','Elektrik','Hidrojen','Diğer']
export const transmissions = ['Manuel','Otomatik','Yarı otomatik']
export const driveTypes = ['Önden Çekiş','Arkadan İtiş','4x4','AWD']
export const bodyTypes = ['Sedan','Hatchback','Station Wagon','Coupe','Cabrio','Roadster','SUV','Crossover','MPV','Panelvan','Pick-up','Minibüs','Diğer']
export const panelNames = ['Ön kaput','Arka kaput','Sağ ön çamurluk','Sol ön çamurluk','Sağ arka çamurluk','Sol arka çamurluk','Sağ ön kapı','Sol ön kapı','Sağ arka kapı','Sol arka kapı','Tavan','Bagaj kapağı','Ön tampon','Arka tampon']
export const panelStates = ['Orijinal','Boyalı','Lokal Boyalı','Değişen','İşlemli']
export const equipmentGroups: Record<string, string[]> = {
  'Güvenlik': ['ABS','ESP','ASR','Şerit takip asistanı','Kör nokta uyarısı','Park sensörü','Geri görüş kamerası','360° kamera','Hava yastığı'],
  'Konfor': ['Hız sabitleyici','Adaptif hız sabitleyici','Deri koltuk','Isıtmalı koltuk','Havalandırmalı koltuk','Elektrikli koltuk','Hafızalı koltuk','Isıtmalı direksiyon','Çift bölgeli klima','Yağmur sensörü','Işık sensörü','Elektrikli bagaj kapağı','Anahtarsız giriş','Start/Stop düğmesi'],
  'Multimedya': ['Apple CarPlay','Android Auto','Navigasyon','Kablosuz şarj','Premium ses sistemi','Dijital gösterge paneli'],
  'Dış donanım': ['Sunroof','Panoramik cam tavan','LED far','Matrix LED far','Ambiyans aydınlatma'],
}

export const colors = ['Beyaz','Siyah','Gri','Gümüş','Kırmızı','Mavi','Lacivert','Yeşil','Kahverengi','Bej','Sarı','Turuncu','Mor','Diğer']
export const damageStatuses = ['Belirtilmemiş','Hasar Kaydı Yok','Hasar Kaydı Var','Ağır Hasar Kayıtlı','Pert Kayıtlı']
export const cylinderOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12]
const car = ['Sedan','Hatchback','Station Wagon','Coupe','Cabrio','Roadster','MPV']
// Kategoriye göre alt kategori / kasa tipi
export const subcategories: Record<string, string[]> = {
  'Otomobil': car, 'SUV': ['SUV','Crossover'], 'Arazi Araçları': ['SUV','Pick-up','Diğer'], 'Pick-up': ['Pick-up'],
  'Elektrikli Araçlar': [...car, 'SUV', 'Crossover'],
  'Motosiklet': ['Scooter','Naked','Touring','Sport','Enduro','Cross','Chopper','Elektrikli'],
  'İş Makineleri': ['Ekskavatör','Forklift','Kepçe','Vinç','Dozer','Greyder','Loder'],
  'Minibüs': ['Panelvan','Minibüs','Diğer'], 'Midibüs': ['Midibüs','Diğer'], 'Kamyonet': ['Panelvan','Pick-up','Açık Kasa','Kapalı Kasa','Diğer'],
  'Kamyon': ['Açık Kasa','Kapalı Kasa','Damperli','Frigorifik','Tanker','Diğer'], 'Otobüs': ['Şehirlerarası','Şehir İçi','Turizm','Diğer'],
  'Çekici': ['Çekici','Diğer'], 'Traktör': ['Bahçe','Tarla','Paletli','Diğer'], 'Karavan': ['Çekme Karavan','Motokaravan','Diğer'],
  'Römork': ['Tenteli','Damperli','Platform','Diğer'], 'Özel Amaçlı Araçlar': ['Diğer'], 'Diğer Vasıtalar': ['Diğer'],
}
export const bodyOptionsFor = (category?: string) => (category && subcategories[category]) || bodyTypes
