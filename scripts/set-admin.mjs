// Kullanım: node scripts/set-admin.mjs yonetici@ornek.com
// serviceAccountKey.json dosyasını Firebase Console > Proje Ayarları > Hizmet Hesapları'ndan indirip proje köküne koyun.
// Bu dosyayı ASLA git'e eklemeyin (.gitignore içinde).
import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'

const email = process.argv[2]
if (!email) { console.error('E-posta adresi gerekli.'); process.exit(1) }

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))) })
const user = await admin.auth().getUserByEmail(email)
await admin.auth().setCustomUserClaims(user.uid, { admin: true })
console.log(`${email} artık yönetici. Oturumu kapatıp tekrar açması gerekir.`)
