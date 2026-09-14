# Dashboard Piutang Client — Versi Google Apps Script

Replika Google Apps Script dari dashboard piutang PT Ray Mitra Perkasa
(`dashboard-piutang-client...`), dibangun langsung dari bedah kode + video
demo dashboard asli + spreadsheet sumbernya. Semua data diambil **langsung**
dari 2 Google Sheet — tidak ada data yang di-hardcode.

## Objektif

Meniru 5 halaman dashboard asli (Dashboard, Tagihan, Mutasi, Invoice,
Penggajian) secara fungsional identik, tapi:
- berjalan 100% di Google Apps Script (tidak butuh hosting terpisah);
- membaca data langsung dari Sheet (bukan snapshot statis);
- ekspor CSV & PDF yang benar-benar berfungsi;
- ejaan "PIUTANG" diperbaiki (versi asli salah tulis "PIHUTANG");
- bug tanggal & bug badge warna di versi asli diperbaiki (lihat bagian
  "Perbaikan dari Versi Asli").

## Sumber Data

| Spreadsheet | ID | Dipakai untuk |
|---|---|---|
| **MASTER DATA** | `1UifGzezCofXDueyQKDFRTvu6MNuuXOwlsb97bilWN0E` | Sheet TAGIHAN, MUTASI, INVOICE, SALDO, MASTER_CLIENT |
| **REKAP PENGGAJIAN 2026** | `1uD3WrDzp2XkamL1jGaTEwqy0teve8lh93qOo5xDIM1o` | Sheet REKAP + sheet per bulan (JANUARI, ..., THR) |
| **MASTER LAPORAN HARIAN** | `1bpt-cvCI_ATJ-_rbKf_P3yXrarT0jZtpfl6P6jd1SPU` | Sheet MASTER DATA (dibaca READ-ONLY untuk halaman Laporan Harian) |

ID ini sudah diisi di `src/Config.gs`. Kalau suatu saat pindah spreadsheet,
**cukup ubah baris terkait di `Config.gs`** — jangan ubah file lain.

**Soal halaman Laporan Harian**: ini menggabungkan 2 tampilan dari app
"Dashboard Laporan Harian" (Dashboard + Eksplorasi Laporan) yang aslinya
punya sistem login/role/kelola-pengguna sendiri, jadi 1 halaman ringkas di
dalam Dashboard ini — **sengaja TIDAK membawa sistem login/role/allowedSources
app aslinya** (dashboard ini sudah punya akses 1-pintu tersendiri lewat 1
link web app). Spreadsheet MASTER LAPORAN HARIAN hanya dibaca, tidak pernah
ditulis/diubah dari sini.

Akun Google yang dipakai untuk membuat & men-deploy Apps Script ini **wajib
punya akses baca (minimal Viewer)** ke kedua spreadsheet di atas. Sesuai
arahan Anda, gunakan akun `ptraymitraperkasaofficial@gmail.com`.

## Struktur File (folder `src/`)

```
appsscript.json     - manifest project (timezone, izin web app)
Config.gs           - SEMUA konstanta (ID spreadsheet, nama sheet, asumsi)
Utils.gs            - helper murni (format Rupiah, tanggal, dll — tanpa akses Sheet)
Cache.gs            - cache sementara (CacheService) supaya buka halaman ke-2/3/dst lebih cepat
Warmup.gs           - trigger terjadwal utk "memanaskan" cache di latar belakang (lihat README bag. Caching)
DataLayer.gs        - satu-satunya file yang menyentuh SpreadsheetApp
Aggregations.gs     - rumus KPI & agregasi tiap halaman
Export.gs           - generator CSV & PDF asli
Code.gs             - doGet() router + fungsi API yang dipanggil dari klien
Style.html          - CSS (meniru desain asli)
Sidebar.html        - komponen sidebar (dipakai di semua halaman)
Topbar.html         - komponen header halaman (dipakai di semua halaman)
ClientScript.html   - JS bersama (format angka, polling, download CSV/PDF)
Page_Dashboard.html - halaman "/"
Page_Tagihan.html   - halaman "/tagihan"
Page_Mutasi.html    - halaman "/mutasi"
Page_Invoice.html   - halaman "/invoice"
Page_Penggajian.html- halaman "/penggajian"
Page_LaporanHarian.html - halaman "/laporan-harian"
```

## Instalasi

1. Login ke **`ptraymitraperkasaofficial@gmail.com`**, buka
   [script.google.com](https://script.google.com) → **New project**.
2. Beri nama project, misalnya "Dashboard Piutang Client".
3. Hapus isi default `Code.gs`, lalu buat file-file berikut satu per satu
   (tombol **+** di sebelah "Files" → pilih **Script** untuk file `.gs`,
   atau **HTML** untuk file `.html`) — nama file harus PERSIS sama (tanpa
   ekstensi saat membuatnya di editor, Apps Script otomatis menambahkan):
   `Config`, `Utils`, `DataLayer`, `Aggregations`, `Export`, `Code` (script),
   dan `Style`, `Sidebar`, `Topbar`, `ClientScript`, `Page_Dashboard`,
   `Page_Tagihan`, `Page_Mutasi`, `Page_Invoice`, `Page_Penggajian` (HTML).
4. Salin-tempel isi tiap file dari folder `src/` di repo ini ke file yang
   sesuai di editor Apps Script.
5. Buka **Project Settings** (ikon gerigi) → centang **"Show appsscript.json
   manifest file in editor"** → tempel isi `src/appsscript.json`.
6. Simpan semua (Ctrl+S / Cmd+S).

## Cara Menjalankan (Deploy)

1. Klik **Deploy → New deployment**.
2. Pilih tipe **Web app**.
3. Isi:
   - **Execute as**: *Me (ptraymitraperkasaofficial@gmail.com)*
   - **Who has access**: karena `ptraymitraperkasaofficial@gmail.com` adalah
     akun Gmail biasa (bukan Google Workspace), opsi **"Anyone within
     [organisasi]"** TIDAK akan muncul/tidak berlaku — itu hanya tersedia
     untuk akun domain perusahaan (Workspace). Pilih salah satu ini:
     - **Only myself** — paling aman, hanya akun ini yang bisa buka
       (default di `appsscript.json` sudah diset ke ini).
     - **Anyone with Google account** — semua orang yang tahu link bisa
       buka setelah login Google (cocok kalau tim lain juga perlu akses
       tanpa Anda tambahkan satu-satu).
     Kalau pilih selain "Only myself" lewat dialog Deploy, nilai `access`
     di `appsscript.json` akan otomatis menyesuaikan — tidak perlu edit
     manual lagi setelah deploy pertama.
4. Klik **Deploy**. Saat pertama kali, Google akan minta **otorisasi** —
   klik **Authorize access**, pilih akun, lalu **Advanced → Go to (nama
   project) (unsafe) → Allow** (ini normal untuk script buatan sendiri).
5. Salin **Web app URL** yang muncul (formatnya
   `https://script.google.com/macros/s/XXXXX/exec`) — itulah alamat
   dashboard Anda.

**Setiap kali Anda mengubah kode**, harus **Deploy → Manage deployments →
klik ikon pensil → New version → Deploy** supaya perubahan aktif di URL
yang sama (kalau tidak, URL lama tetap menjalankan kode versi sebelumnya).

## Cara Verifikasi

1. Buka Web app URL → halaman **Dashboard** harus tampil dengan saldo &
   KPI terisi angka asli dari Sheet (bukan Rp 0 semua).
2. Klik menu **Tagihan/Mutasi/Invoice/Penggajian** di sidebar — tiap halaman
   harus tampil sesuai isi Sheet saat ini.
3. Ubah salah satu filter (mis. Bank di halaman Tagihan) → tabel & KPI
   harus berubah tanpa reload halaman.
4. Klik **Ekspor CSV** → file `.csv` harus terunduh ke folder Download
   browser Anda, isinya sesuai filter yang aktif.
5. Klik **Unduh PDF** → tunggu beberapa detik → file `.pdf` terunduh,
   berisi tabel rapi dengan kop "PT RAY MITRA PERKASA".
6. Ubah salah satu angka di Google Sheet MASTER DATA → tunggu maksimal
   60 detik (atau klik tombol status "MASTER DATA · ..." di kanan atas
   untuk refresh manual) → angka di dashboard harus ikut berubah.

## Keputusan & Asumsi (mohon dicek)

Karena sebagian kode asli tidak bisa dibaca (file JS untuk 3 dari 5
halaman tidak ikut ter-*zip*, lihat detail di `docs/SPEC.md`), beberapa
logika direkonstruksi dengan asumsi paling masuk akal. Semua bisa
disesuaikan di `Config.gs` tanpa mengubah kode lain:

1. **Rekening dana penggajian** (`PAYROLL_FUNDING_ACCOUNTS`): hanya 6
   dari 11 rekening SALDO yang dipakai untuk hitungan "Kesiapan Dana 7
   Hari" di halaman Penggajian — sesuai yang terlihat di video/HTML asli
   (BCA 70, BPD, BRI, MANDIRI 99, MANDIRI 97, PT CAKRA BCA).
2. **Pemetaan Bank → Rekening** (`BANK_TO_REKENING`): jadwal penggajian
   cuma menyimpan nama bank generik ("BCA","MANDIRI",dst), bukan nomor
   rekening spesifik. Saat ini "BCA"→"BCA 70", "MANDIRI"→"MANDIRI 99",
   dst. **Kalau ternyata aturan pembagiannya beda, ubah di sini.**
3. **Kolom "Maker"** di tabel Jadwal Penggajian: data mentah sheet bulan
   tidak punya kolom Maker terpisah dari PIC Rekap, jadi untuk sementara
   Maker = PIC Rekap. Kalau Anda punya sumber Maker yang benar, beri tahu
   saya letaknya.
4. **Sheet "LAIN LAIN"** di REKAP PENGGAJIAN 2026 — diabaikan sepenuhnya
   sesuai arahan Anda (catatan internal).
5. **Termin invoice**: default 30 hari, bisa di-override per client lewat
   kolom `TERMIN_HARI` di sheet `MASTER_CLIENT`.
6. **Tab periode "Satu Bulan/Rentang Bulan/3 Bulan/6 Bulan"** di halaman
   Tagihan: perilakunya diasumsikan logis (kode aslinya tidak ketemu) —
   silakan dicoba dan beri tahu kalau ada yang perlu disesuaikan.

## Perbaikan dari Versi Asli

Ditemukan beberapa hal yang tampak seperti bug/celah di versi asli (lihat
`docs/SPEC.md` untuk bukti detailnya) — di versi Apps Script ini semua
sudah diperbaiki:

- **Ejaan "PIUTANG"** — versi asli salah tulis "PIHUTANG" di judul utama.
- **Badge "Status Data" invoice selalu hijau**, walau isinya menandakan
  masalah (mis. "BELUM COCOK TAGIHAN") — sekarang warnanya benar-benar
  berubah (hijau untuk "SIAP", oranye untuk yang perlu perhatian).
- **"Total Periode" di tabel pivot Tagihan selalu Rp 0** — sekarang benar
  dihitung sebagai total nilai tagihan pada periode yang ditampilkan.
- **Ekspor CSV/PDF** — di sini benar-benar mengunduh file, bukan sekadar
  tombol dekoratif.

## Caching (Supaya Buka Halaman ke-2/3/dst Lebih Cepat)

Bagian paling lambat dari tiap kali buka halaman adalah **membaca ulang
Sheet** (TAGIHAN ~3.000 baris, INVOICE ~2.000, MUTASI ~2.800, dst — dan
untuk Penggajian bisa belasan sheet sekaligus: REKAP + tiap tab bulan yang
ada). Sekarang data mentah tiap sheet disimpan sementara lewat
`CacheService` (lihat `src/Cache.gs`):

- Cache berlaku **330 detik** (`CONFIG.CACHE_SECONDS` di `Config.gs`, ubah
  di situ kalau mau lebih cepat/lebih real-time — lihat juga bagian
  "Mempercepat Loading Pertama Kali" di bawah, nilai ini sengaja dipasangkan
  dengan jadwal trigger pemanasan cache).
- Selama masih dalam jendela cache itu, buka halaman Tagihan lalu Mutasi
  lalu Invoice dst **tidak perlu baca ulang Spreadsheet** — tinggal ambil
  dari cache (jauh lebih cepat, biasanya di bawah setengah detik untuk
  bagian ambil datanya).
- Setelah kadaluarsa, pembacaan berikutnya otomatis ambil data segar dari
  Sheet lagi (dan cache-nya diperbarui).
- Karena data mentah tiap sheet bisa lebih dari 100KB (batas 1 entry
  CacheService), datanya **dipecah jadi beberapa potongan** lalu digabung
  lagi saat dibaca — ini otomatis, tidak perlu diapa-apakan.
- **`SpreadsheetApp.openById()` tidak lagi dipanggil berkali-kali untuk
  spreadsheet yang sama** dalam 1 kali request (`openSS_()` di
  `DataLayer.gs`) — sebelumnya halaman Penggajian bisa membuka ulang file
  REKAP PENGGAJIAN 2026 belasan kali (1x per tab bulan) padahal filenya
  sama persis; ini salah satu penyebab utama loading Penggajian jauh lebih
  lambat dari halaman lain.
- Tombol **"Perbarui data sekarang"** di kanan atas tiap halaman **selalu
  melewati cache** (ambil langsung dari Sheet saat itu juga) — pakai ini
  kalau Anda baru saja edit Sheet dan ingin lihat perubahannya seketika
  tanpa menunggu.
- Kalau cache gagal ditulis/dibaca karena sebab apapun, aplikasi otomatis
  jatuh kembali baca langsung dari Sheet — cache murni mempercepat, bukan
  syarat aplikasi bisa jalan.

**Perhatian**: karena data dibagi ke banyak pengguna lewat cache yang sama,
kalau dua orang buka dashboard dalam jendela cache yang sama, orang kedua
akan melihat data se-segar terakhir kali cache ditulis (maksimal seusia
`CACHE_SECONDS`) — bukan detik itu juga. Untuk dashboard monitoring
internal, ini trade-off yang wajar; kalau Anda butuh selalu real-time
walau lebih lambat, kecilkan `CACHE_SECONDS`.

### Mempercepat Loading PERTAMA Kali (Trigger Pemanasan Cache)

Cache di atas hanya membantu buka halaman KEDUA dst — pembukaan **pertama**
di hari itu (atau setelah cache kadaluarsa) tetap kena baca langsung dari
Sheet dan terasa lambat, terutama halaman Penggajian. Untuk mengatasi ini
ada `src/Warmup.gs`: fungsi yang membaca ulang semua sheet secara otomatis
di **latar belakang, terjadwal, tanpa perlu ada orang yang membuka
dashboard sama sekali** — jadi begitu benar-benar ada yang buka, cache-nya
hampir selalu sudah hangat.

**Cara aktifkan (dilakukan sekali saja):**
1. Buka project ini di editor Apps Script (script.google.com).
2. Di dropdown fungsi (sebelah tombol ▶ Jalankan), pilih `installWarmupTrigger`.
3. Klik **▶ Jalankan**. Google akan minta izin akses — setujui (hanya sekali).
4. Selesai. Trigger berjalan otomatis tiap `CONFIG.CACHE_WARMUP_MINUTES`
   menit (default 5 menit), terus-menerus, walau tidak ada yang membuka
   editor sama sekali.

Untuk mematikan lagi, jalankan fungsi `removeWarmupTrigger` dengan cara
yang sama. Ini murni optimasi latar belakang — kalau tidak diaktifkan,
aplikasi tetap jalan normal seperti biasa (cuma pembukaan pertama tiap kali
cache kosong akan tetap terasa seperti sebelumnya).

## Tema Terang & Gelap

Ada tombol toggle (ikon matahari/bulan) di kanan atas tiap halaman, di
sebelah tanggal — klik untuk berpindah antara mode terang dan gelap.
Pilihan disimpan di browser (localStorage), jadi diingat untuk kunjungan
berikutnya; kalau belum pernah memilih, dashboard otomatis mengikuti
pengaturan sistem/browser (terang/gelap) perangkat Anda. Semua warna diatur
lewat CSS custom properties di `src/Style.html` (`:root` untuk terang,
`[data-theme="dark"]` untuk gelap) — kalau suatu saat ingin menyesuaikan
warna tema gelap, cukup ubah nilai di blok `[data-theme="dark"]` itu saja.

## Keterbatasan Platform (bukan pilihan desain)

- **URL**: Apps Script Web App cuma punya 1 URL. Navigasi antar halaman
  pakai `?page=nama` (bukan `/nama` seperti versi asli) — keterbatasan
  platform Apps Script, bukan hasil desain ulang.
- **PDF**: dibatasi 500 baris pertama per ekspor (batas wajar untuk waktu
  eksekusi Apps Script). Untuk data lebih dari itu, gunakan Ekspor CSV.
- **Performa**: lihat bagian "Caching" di atas — permintaan pertama (atau
  setelah cache 120 detik kadaluarsa) tetap butuh baca Sheet langsung
  (biasanya di bawah 2 detik untuk dataset saat ini), permintaan berikutnya
  dalam jendela cache jauh lebih cepat.

## Troubleshooting

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Halaman blank / error "Script function not found" | Nama file di editor Apps Script tidak persis sama | Cek ulang nama file (case-sensitive, tanpa spasi) |
| Semua angka Rp 0 | Akun deploy tidak punya akses ke spreadsheet sumber | Pastikan akun yang deploy adalah Viewer/Editor di kedua spreadsheet |
| "Exception: You do not have permission to call SpreadsheetApp.openById" | Otorisasi belum di-approve penuh | Deploy ulang → Authorize access → Advanced → Go to (unsafe) → Allow |
| Data tidak berubah setelah edit Sheet | Masih dalam jendela cache 120 detik (lihat bagian "Caching"), atau versi deployment lama | Klik tombol status kanan atas ("Perbarui data sekarang") untuk lewati cache seketika, dan pastikan sudah "New version" saat deploy ulang |
| Tombol PDF lambat / timeout | Data terfilter sangat banyak | Persempit filter dulu, atau gunakan CSV untuk data besar |

---
Dibangun berdasarkan analisis `DASHBOARD.zip` (build asli) dan video demo
dashboard yang Anda berikan. Detail teknis lengkap (skema data per kolom,
bukti tiap rumus) ada di `docs/SPEC.md` dan `docs/VIDEO_UI_REPORT.md`.
