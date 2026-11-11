import { useTitle } from '../hooks/useTitle'
import { useSettings } from '../hooks/useSettings'

const pages = {
  about: { title: 'Hakkımızda', body: ['BEP CAR, kaliteli ve şeffaf bilgiyle sunulan araçlara odaklanan bir oto galeridir.', 'Her araç için fotoğraf, teknik özellik ve hasar bilgilerini açıkça paylaşırız. Satılan araçlarımızı portföyümüzde göstererek geçmiş satışlarımızı herkesin görebilmesini sağlarız.', 'Bu metni yönetim panelinden düzenlenebilir hale getirmek sonraki aşamadadır; yayına almadan önce gerçek galeri bilgileriyle güncelleyin.'] },
  privacy: { title: 'Gizlilik Politikası', body: ['İletişim formuna yazdığınız ad, telefon, e-posta ve mesaj bilgileri yalnızca sizinle iletişim kurmak için saklanır ve üçüncü kişilerle paylaşılmaz.', 'Favori araçlarınız yalnızca tarayıcınızda (yerel depolama) tutulur; sunucuya gönderilmez.', 'Yayına almadan önce bu metni KVKK kapsamında bir hukuk danışmanıyla gözden geçirin.'] },
  terms: { title: 'Kullanım Koşulları', body: ['Sitedeki ilan bilgileri bilgilendirme amaçlıdır. Fiyat ve araç durumu değişebilir; güncel bilgi için galeriyle iletişime geçin.', 'Sitede yayınlanan ilanları yalnızca BEP CAR yönetimi ekler ve düzenler.', 'Yayına almadan önce bu metni bir hukuk danışmanıyla gözden geçirin.'] },
}

export default function Static({ page }: { page: keyof typeof pages }) {
  const st = useSettings()
  const p = pages[page]
  const body = page === 'about' && st.aboutText ? st.aboutText.split(/\n\s*\n/) : p.body
  useTitle(p.title)
  return (
    <div className="mx-auto max-w-[760px] px-5 py-14">
      <h1 className="text-4xl font-semibold">{p.title}</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-neutral-700">{body.map((t, i) => <p key={i}>{t}</p>)}</div>
    </div>
  )
}
