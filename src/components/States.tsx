export const Skeletons = ({ n = 3 }: { n?: number }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Yükleniyor">
    {Array.from({ length: n }).map((_, i) => <div key={i} className="h-[420px] animate-pulse rounded-[20px] bg-paper" />)}
  </div>
)

export const Empty = ({ title, text }: { title: string; text: string }) => (
  <div className="rounded-[20px] border border-dashed border-neutral-300 px-6 py-16 text-center">
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-neutral-600">{text}</p>
  </div>
)

export const ErrorBox = () => (
  <Empty title="Araçlar yüklenemedi" text="Bağlantınızı kontrol edip sayfayı yenileyin. Sorun sürerse bizimle iletişime geçin." />
)
