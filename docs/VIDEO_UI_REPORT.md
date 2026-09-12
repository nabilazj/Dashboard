# Laporan Detail UI — Dashboard Piutang Client (PT Ray Mitra Perkasa)
Sumber: 72 frame screenshot (f_001–f_072), diekstrak 1 frame/2 detik dari screen-recording durasi 2m23s.
URL aplikasi yang terlihat di address bar: `dashboard-piutang-client.nabilazahrotul10.chatgpt.site/...`

Catatan metodologi: Semua 72 frame telah dibaca berurutan penuh. Detail yang tulisannya terlalu kecil/blur pada screenshot ditandai eksplisit sebagai "tidak terlihat jelas" — tidak dikarang.

## Urutan Kemunculan Halaman di Video
Video TIDAK dimulai dari Dashboard. Urutan navigasi asli:
1. **PENGGAJIAN** — frame f_001–f_019 (halaman pertama yang tampil saat video mulai)
2. **INVOICE** — frame f_020–f_036
3. **MUTASI** — frame f_037–f_049
4. **TAGIHAN** — frame f_049/f_050–f_065
5. **DASHBOARD (overview)** — frame f_066–f_072 (halaman terakhir, video berakhir di sini setelah scroll turun lalu kembali ke atas)

---

## KOMPONEN GLOBAL (tampil identik di semua halaman)

### Browser chrome (bagian dari rekaman, bukan bagian dashboard)
Terlihat toolbar browser standar: tombol back/forward, refresh, address bar berisi URL `dashboard-piutang-client.nabilazahrotul10.chatgpt.site/<page>`, ikon bintang bookmark, ikon extensions (puzzle), avatar profil bulat, menu titik tiga. Ini murni chrome browser, tidak perlu direplikasi di UI dashboard itu sendiri — tapi menandakan dashboard adalah web app biasa (bukan SPA app-shell terpisah, URL berubah per halaman: `/penggajian`, `/invoice`, `/mutasi`, `/tagihan`, dan root `/` untuk Dashboard).

### Sidebar (kiri, fixed, lebar ± 120px)
Latar belakang: biru navy sangat gelap (dekat hitam-kebiruan / indigo-950).
- Header logo: kotak ikon kecil (isinya tidak terlihat jelas, kemungkinan logo bergambar, warna-warni/gradient) + teks "PT RAY MITRA PERKASA" (putih, bold, dua baris) + di bawahnya label kecil bentuk pill/badge ungu bertuliskan "KEUANGAN".
- Menu navigasi (urutan dari atas ke bawah), masing-masing dengan ikon kecil di kiri teks:
  1. Dashboard (ikon rumah/home)
  2. Tagihan (ikon dokumen/invoice)
  3. Mutasi (ikon panah bolak-balik/transfer)
  4. Invoice (ikon dokumen)
  5. Penggajian (ikon "Rp")
- Item menu yang sedang aktif diberi latar belakang blok warna **ungu/violet terang** (highlight full-width, rounded), teks putih. Item non-aktif: teks abu-abu terang di atas latar gelap.
- Footer sidebar (paling bawah): titik hijau kecil + teks kecil "Data Internal · Private".

### Header halaman (konsisten di semua halaman kecuali sedikit variasi teks)
- Judul halaman: huruf besar tebal, warna navy gelap/hitam-kebiruan, ukuran besar (mis. "PUSAT KONTROL PENGGAJIAN", "MONITORING INVOICE CLIENT", "RIWAYAT MUTASI PEMASUKAN", "REKAP TAGIHAN CLIENT", "DASHBOARD PIHUTANG CLIENT" — **perhatikan: penulisan "PIHUTANG" bukan "PIUTANG"**, kemungkinan typo asli di sumber, harus direplikasi persis).
- Subjudul di bawah judul: teks abu-abu, italic-like kecil, deskripsi 1 baris (mis. "Jadwal, kesiapan dana, realisasi dan riwayat gaji client", "Pengiriman invoice, jatuh tempo & aging pembayaran", "Rekap transaksi masuk seluruh rekening", "Pemantauan tagihan sampai bulan berjalan", "Monitoring Tagihan, Pembayaran & Mutasi Bank").
- Pojok kanan atas: tanggal hari ini format "12 September 2026" (bold, navy), di bawahnya baris kecil dengan titik hijau (live indicator) + teks "MASTER DATA · 12 September 2026 pukul 11:2x/11:3x" (halaman Dashboard teksnya sedikit beda: "Diperbarui dari MASTER DATA · SALDO").
- Di bawah subjudul, ada blok label kecil huruf kapital ungu (mis. "PENGGAJIAN SEPTEMBER 2026", "INVOICE 2026", "MUTASI BANK 2026", "DATA TAGIHAN 2026") lalu judul section (mis. "Kontrol pembayaran dari jadwal hingga kesiapan rekening") dan 1 baris keterangan italic abu-abu kecil di bawahnya yang menjelaskan sumber data/aturan (lihat detail per halaman).
- Dua tombol aksi di kanan atas (di semua halaman kecuali Dashboard yang tidak menampilkannya di area ini): tombol merah dengan ikon (kemungkinan ikon PDF/download) bertuliskan **"Unduh PDF"**, dan tombol hijau dengan ikon bertuliskan **"Ekspor CSV"** (khusus halaman Penggajian, teks tombol hijau tidak terbaca jelas pada resolusi screenshot — kemungkinan "Ekspor CSV" atau "Cetak Jadwal", **tidak terlihat jelas**, jangan diasumsikan sama).

### Skema warna keseluruhan
- Background utama konten: abu-abu sangat muda / off-white (#f5f6fa-ish).
- Card: putih, sudut membulat (rounded-xl), shadow tipis.
- Warna aksen/brand utama: **ungu/violet** (dipakai untuk sidebar active state, ikon KPI, tombol/link, bar chart utama, ring donut chart).
- Warna status/badge: hijau (positif/lunas/cukup/sudah), merah/pink (negatif/terlambat/belum bayar/kekurangan), kuning/amber (menunggu/warning), biru (info), teal/cyan (netral/kategori alokasi mutasi), abu-abu (kosong/data awal/tidak ada).
- Font: sans-serif modern bersih (terlihat seperti Inter/system-ui), heading bold warna navy tua, body text abu-abu gelap, angka nominal Rp selalu bold.
- Format angka: mata uang selalu "Rp" + spasi + angka dengan pemisah ribuan titik (mis. "Rp 5.343.334.086"), tidak ada desimal yang terlihat.

---

## 1. HALAMAN PENGGAJIAN (frame f_001–f_019) — muncul PERTAMA di video

Judul: "PUSAT KONTROL PENGGAJIAN" / subjudul: "Jadwal, kesiapan dana, realisasi dan riwayat gaji client"
Label section: "PENGGAJIAN SEPTEMBER 2026" → "Kontrol pembayaran dari jadwal hingga kesiapan rekening" → keterangan italic: "Ringkasan dari sheet REKAP jadwal aktif dari sheet SEPTEMBER. Status dibayar hanya diberikan pada total jadwal yang cocok dengan bagian Client yang Sudah Digaji."

### KPI Cards (6 kartu, grid 6 kolom pada layar lebar)
1. Ikon Σ (sigma, ungu) — **"TOTAL RENCANA BULAN INI"** — Rp 0 — subteks "0 jadwal client"
2. Ikon centang (hijau) — **"SUDAH DIBAYARKAN"** — Rp 0 — subteks "0 jadwal terkonfirmasi"
3. Ikon jam pasir/timbangan (kuning) — **"MENUNGGU PEMBAYARAN"** — Rp 0 — subteks "Belum masuk rekening"
4. Ikon info (biru) — **"JADWAL HARI INI"** — "0 Client" — subteks "Rp 0"
5. Ikon angka "7" (ungu) — **"KEBUTUHAN 7 HARI"** — Rp 0 — subteks "0 jadwal mendatang"
6. Ikon seru "!" (merah) — **"KEKURANGAN DANA"** — Rp 0 — subteks "Semua rekening mencukupi"

Semua nilai Rp 0 pada saat direkam (data September belum ada jadwal aktif) — ini penting: menunjukkan halaman punya *empty-state numerik* wajar (bukan bug), bukan loading state.

### Panel "KESIAPAN DANA 7 HARI KE DEPAN" (kiri, ±60% lebar)
Toggle kecil di pojok kanan atas panel: "Saldo vs kebutuhan".
Tabel kolom: **REKENING | SALDO | KEBUTUHAN | PROYEKSI SISA | KONDISI**
Baris rekening (nama rekening berupa pill/badge kecil ungu): BCA 78, BPD, BRI, MANDIRI 99, MANDIRI 97, PT CAKRA BCA.
Contoh nilai: BCA 78 → Saldo Rp 133.464.124, Kebutuhan Rp 0, Proyeksi Sisa Rp 133.494.124 (hijau bold), Kondisi = badge hijau "Cukup".
Semua baris pada kondisi "Cukup" (hijau) — tidak terlihat contoh warna kondisi lain (misal "Kurang"/merah) di video ini.

### Panel "PROGRES PEMBAYARAN BULAN INI" (kanan, ±40%)
Donut chart besar: tengah menampilkan "0%" (label kecil di bawah "Terbayar") dan di kanan donut "Rp 0" dengan subteks "dari Rp 0".
Legend di bawah donut: kotak hijau "Sudah dibayar 0", kotak kuning "Menunggu 0".
Di bawah donut ada box hijau muda (light green) dengan ikon centang: **"Dana penggajian aman"** + subteks "Saldo rekening penggajian mencukupi kebutuhan tujuh hari ke depan."

### Baris Filter (full width, di bawah 2 panel di atas)
5 filter dropdown + 1 search + tombol reset, kolom: **RENTANG JADWAL** (opsi: Hari Ini, 7 Hari ke Depan, Bulan Berjalan, Semua Jadwal), **STATUS** (opsi terlihat: Semua Status, Sudah Dibayar, Hari Ini, Terlambat, Perlu Konfirmasi, dan minimal 1 opsi lagi terpotong di bawah — tidak terlihat jelas), **BANK** (Semua Bank), **PIC REKAP** (Semua PIC — dropdown hanya menampilkan "Semua PIC" saat dibuka, tanpa opsi lain terlihat), **PENCARIAN** (placeholder "Cari client, PIC, bank, maker..."). Tombol "↺ Reset" di ujung kanan.

### Tabel "JADWAL PENGGAJIAN"
Header tabel + counter kanan atas "0 jadwal".
Kolom: **NO | TANGGAL | CLIENT | PIC REKAP | NOMINAL | BANK | REKENING BAYAR | MAKER | STATUS**
Empty state: teks abu-abu di tengah tabel "Tidak ada jadwal yang sesuai filter." Pagination di bawah: "Halaman 1 dari 1".

### Chart "PERKEMBANGAN PENGGAJIAN 2026"
Label kecil pojok kanan atas: "6 bulan terakhir".
Bar chart vertikal warna **ungu solid**, 8 bar untuk bulan Jan–Agu 2026, label nilai Rp di atas tiap bar dalam satuan "M" (juta/miliar disingkat — format "Rp 10,6 M" dst — **tidak terlihat jelas apakah M = "Miliar" atau representasi jutaan**, nilai persis: Jan Rp10,6M; Feb Rp10M; Mar Rp15,2M; Apr Rp5,3M(?); Mei Rp10,1M(?); Jun Rp11M; Jul Rp11,6M; Agu Rp6,9M — beberapa digit kecil sulit dibaca persis, dicatat sebagai estimasi mendekati). Tidak ada legend/sumbu Y eksplisit — nilai ditulis langsung di atas bar, sumbu X = nama bulan singkat (Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu).

### Panel "CATATAN KONTROL" (kanan chart, box krem/cream muda)
Bullet list (tanpa ikon bullet terlihat jelas, teks hitam dengan beberapa kata bold):
- "Status **Sudah Dibayar** hanya muncul bila kelompok jadwal sudah dicatat dengan catatan 'Client yang Sudah Digaji'."
- "Nominal di sheet REKAP adalah rekap gaji client, bukan bukti transfer bank."
- "BCA 99 dipakai sebagai sumber pemantauan dana saat rekening lain kurang."
- "Dashboard tidak melakukan transfer dan tetap membutuhkan persetujuan petugas."
Baris kecil di bawah (abu-abu, italic): "Sumber: REKAP PENGGAJIAN 2026 - SEPTEMBER"

### Tabel "RIWAYAT PENGGAJIAN PER CLIENT"
Filter khusus tabel ini (kanan atas tabel): **PERIODE** (dropdown bulan: JANUARI, FEBRUARI, MARET, APRIL, MEI, JUNI, JULI, AGUSTUS) dan **PENCARIAN** (placeholder "Cari nama client...").
Kolom: **NO | CLIENT | PERIODE | NOMINAL | BULAN SEBELUMNYA | PERUBAHAN | STATUS DATA**
- Kolom PERUBAHAN: badge persentase — **hijau** untuk kenaikan (mis. "+8,0%"), **merah/pink** untuk penurunan (mis. "-4,9%", "-11,7%", "-4,0%"); saat filter periode = Januari (data pertama), kolom Bulan Sebelumnya menampilkan "—" dan Perubahan menampilkan badge abu-abu "Data awal".
- Kolom STATUS DATA: badge hijau "Tercatat di REKAP" pada semua baris yang terlihat.
Contoh nama client (Agustus 2026): Kejari Kapuas Palingkau(?), Pengadilan Negeri Barito Timur, Pengadilan Agama Gunung Mas, RS Ceporo Semarang, PT PWKWI Temanggung, UPPD Kab Batang, Hotel Puri Asri Magelang, RSUD Bumiayu, BGTK Palangkaraya, Hotel Atria Magelang, UPPD Kab Pemalang, Pengadilan Tinggi Jogja, Dinas Kelautan, RS Emmanuel Banjarnegara, UPPD Kota Semarang 2, Kecamatan Ngaliyan, PT BSN Teknologi Kendal, Dinas Pertanian dan Pangan Purworejo, Cabor 3 Pati, Pengadilan Negeri Pati (beberapa nama client agak buram, dicatat sebisa mungkin).
Pagination di kanan atas tabel: total "Halaman 1 dari 12" (berubah "Halaman 1 dari 13" untuk data Januari). Ada scrollbar vertikal di dalam tabel (tabel terlihat dalam container scrollable, bukan pagination klik-halaman biasa — kombinasi scroll + label halaman).

### Interaksi filter yang terekam
Video mendemonstrasikan: mengganti dropdown PERIODE (Agustus→Januari→Februari→April→kembali Agustus) yang langsung mengubah isi tabel Riwayat Penggajian; mengganti dropdown STATUS (Semua Status/Sudah Dibayar/Hari Ini/Terlambat/Perlu Konfirmasi/...); mengganti RENTANG JADWAL (Hari Ini/7 Hari ke Depan/Bulan Berjalan/Semua Jadwal); membuka dropdown PIC REKAP (isi hanya "Semua PIC" terlihat). Semua kombinasi filter pada tabel Jadwal Penggajian tetap menghasilkan "Tidak ada jadwal yang sesuai filter" (karena data September belum terisi).

---

## 2. HALAMAN INVOICE (frame f_020–f_036)

Judul: "MONITORING INVOICE CLIENT" / subjudul: "Pengiriman invoice, jatuh tempo & aging pembayaran"
Label section: "INVOICE 2026" → "Monitoring invoice terkirim" → keterangan italic: "Termin awal menggunakan standar 30 hari dan dapat disesuaikan per client."

### KPI Cards (4 kartu)
1. Ikon panah/chevron ungu — **"TOTAL DATA INVOICE"** — "2021 Data"/"2147 Data" (berubah sesuai filter) — subteks "Data yang sudah masuk master"
2. Ikon centang hijau — **"INVOICE TERKIRIM"** — "1337 Data"/"1365 Data" — subteks "Memiliki tanggal pengiriman"
3. Ikon jam pasir kuning — **"LAMA BELUM DIBAYAR"** — "60 Invoice"/"15 Invoice" — subteks "Terlambat lebih dari 30 hari"
4. Ikon tanda tanya ungu/kuning — **"PERLU VALIDASI"** — "1639 Data"/"1751 Data" — subteks "Mapping atau tanggal belum lengkap"

### Filter row
**PERIODE** (Semua Periode / Januari…Agustus), **STATUS INVOICE** (opsi: Semua Status, **LUNAS**, **BELUM COCOK TAGIHAN**, **BELUM BAYAR**), **AGING** (Semua Aging), **PIC** (dropdown besar berisi: Semua PIC, ADI, DENIS, DINI, ELA, FITA, HITA, IZTAR/ETZAR (**tidak terlihat jelas ejaannya**), KOKOM, LAILI, MIDAN, OPAL, PAK TOHAR, ZAHRA), **PENCARIAN** (placeholder "Cari client, PIC, keterangan..."). Tombol "Reset".

### Tabel "DATA INVOICE"
Counter jumlah data di kanan atas tabel (berubah dinamis sesuai filter, mis. "2021 data", "2147 data", "3 data", "371 data", "281 data", "0 data", dst).
Kolom (13 kolom): **NO | CLIENT | PERIODE | PIC | TANGGAL TERKIRIM | JATUH TEMPO | NOMINAL | STATUS | SISA PIUTANG | UMUR | TERLAMBAT | AGING | STATUS DATA**
- **STATUS**: badge/teks — "LUNAS" (hijau), "BELUM BAYAR" (merah/pink), "BELUM COCOK TAGIHAN" (warna tidak sepenuhnya jelas di resolusi screenshot, tampak gelap/netral — **tidak terlihat jelas warnanya secara pasti**, kemungkinan abu-abu/oranye).
- **AGING**: badge — "LUNAS" (hijau), "+120 HARI"/"+150 HARI" dst (merah, untuk yang lewat jatuh tempo), "TANGGAL BELUM ADA" (abu-abu/kuning pucat).
- **STATUS DATA**: badge gabungan multi-kondisi (teks dipotong "..." karena panjang), contoh: "BAP" (hijau, singkat — kemungkinan "Berita Acara Pembayaran" atau semacamnya), "TANGGAL TERKIRIM KOSONG | PERLU MAPPING ..." (oranye/kuning), "PERLU MAPPING CLIENT" (kuning), "PERLU MAPPING CLIENT | BELUM COCOK TAGIH..." (kuning), "TANGGAL BELUM ADA" (oranye), "CEK TANGGAL" (oranye, muncul minimal 1 baris).
- Nilai NOMINAL selalu "Rp" + titik ribuan; saat data belum lengkap, NOMINAL bisa "Rp 0" dan SISA PIUTANG "—".
Contoh nama client: PT SAT DC Rembang, PT SAT DC Semarang, PT SAT DC Cilacap, PT SAT Depo Balikpapan, PT SAT Depo Kupang, PT SAT Depo Samarinda, PT BPR BKK Lasem, PT KIDO Mulia Indonesia, PT Liebra Permana Semarang/Wonogiri, PT Polyplas Makmur Santosa Smg, Kemenhaj Kota Semarang, Dinaskeswan, Kementerian Agama Provinsi Jawa Tengah, Labkesmas Banjarnegara, PT Lestari Alam & CV Kindo, PT Aim Isuzu/Roxy/Daihatsu Magelang & Purworejo/Wonosobo, RSUD Dr Adhiyatma (Satpam/Admin), Dinas Esdm Slamet Selatan, PT Triasih Suralaka Ardhi(?), Dinas Esdm Merapi Magelang, Hotel Puri Asri Magelang, BPS Kabupaten Banjarnegara/Kebumen/Magelang/Temanggung/Wonosobo, BPS Kota Magelang, Dinas Pertanian Magelang, SMK Seminari, RSUD Candi Umbul, Puskesmas Sawangan, RS Emmanuel Banjarnegara, RSUD Merah Putih Magelang, Sekretariat DPRD Kab Magelang, Hotel Atria Magelang, MTS N 1/2 Kota Magelang.
PIC yang muncul di data: PAK TOHAR, DENIS, ADI, HITA (nama-nama PIC lain di dropdown belum tentu punya data terlihat).

### Interaksi terekam
Membuka dropdown PIC (list lengkap terlihat), memilih DENIS → ADI → HITA (data tabel berubah signifikan setiap kali, dari 3 data hingga 371/281 data); mengganti STATUS INVOICE ke "BELUM COCOK TAGIHAN" lalu ke "BELUM BAYAR"; mengganti PERIODE ke Juli/Februari; hover ke menu "Mutasi" di sidebar sebagai transisi ke halaman berikutnya.

---

## 3. HALAMAN MUTASI (frame f_037–f_049)

Judul: "RIWAYAT MUTASI PEMASUKAN" / subjudul: "Rekap transaksi masuk seluruh rekening"
Label section: "MUTASI BANK 2026" → "Riwayat mutasi pemasukan" → keterangan italic: "Gunakan filter tanggal, rekening, PT, dan status alokasi."

### KPI Cards (4 kartu)
1. Ikon Σ ungu — **"TOTAL FILTER DATA"** — Rp 50.657.977 (berubah sesuai filter, mis. Rp 5.343.334.086, Rp 0) — subteks "X transaksi" (mis. "4 transaksi", "0 transaksi")
2. Ikon kalender/kotak hijau — **"PEMASUKAN HARI INI"** — Rp 0 — subteks "12 September 2026"
3. Ikon kotak ungu — **"PEMASUKAN BULAN INI"** — Rp 8.658.470.661 — subteks "SEPTEMBER 2026"
4. Ikon jam kuning — **"TRANSAKSI MENUNGGU"** — "0 Transaksi" — subteks "Belum teralokasi"

### Filter row
**DARI TANGGAL** (date picker, default "01/01/2026"), **SAMPAI TANGGAL** (date picker, default "12/09/2026" — mengikuti tanggal hari ini), **AKUN BANK** (Semua Akun Bank), **PERUSAHAAN** (Semua PT / PT Ray Mitra Perkasa / PT Cakra Adidaya Perkasa), **STATUS ALOKASI** (opsi: Semua Status, Sudah Dialokasikan, Belum Teralokasi), **PENCARIAN** (placeholder "Uraian atau lokasi..."). Tombol "Reset".

### Tabel "DATA MUTASI MASUK"
Counter kanan atas berubah dinamis: "2.300 transaksi" → "377 transaksi" → "155 transaksi" → "4 transaksi" → "0 transaksi" mengikuti filter tanggal/PT/status.
Kolom: **NO | PERUSAHAAN | SUMBER AKUN | TANGGAL MUTASI | URAIAN / KETERANGAN | NOMINAL MASUK | STATUS ALOKASI**
- PERUSAHAAN: "PT Ray Mitra Perkasa" atau "PT Cakra Adidaya Perkasa".
- SUMBER AKUN: nama rekening + tahun, mis. "MANDIRI 99 2026", "BCA 2026", "BANK JATENG 2026".
- NOMINAL MASUK: warna hijau, format "Rp" + titik ribuan.
- STATUS ALOKASI: badge kecil warna **teal/hijau-kebiruan** berisi nama lokasi/keperluan alokasi (mis. "PMKRI", "PALANG BIRU", "KUARI PURWOREJO", "EMANUEL", "TAICANG", "UTBK/SNBP MAHASISWA", "RPKM SOLBAR", "CASH", "PANTI WLAYA", "FARMWISATA PWJ", "DUKCAPIL KAB MGL", "PURI ASRI", "PTON PALANGKARAYA", "PHKMS", "IDC BATAN", "RSTN X RS MGL", "CCTBS", "PT JIGSA", "EX AT-FUTUHI", "ATS PGLNS", "RTS I UMBUL", "CAKRA 1 PATI", "PEMA REJATO BANYUAB...", "KEMALU OMBAL") — dan badge **oranye** khusus untuk "**BELUM TERALOKASI**" (baris pertama data awal, saat status alokasi belum ditentukan).
Nama uraian transaksi bervariasi (nama orang/perusahaan pengirim dana), contoh: "HADI MUHAMMAD", "YAKQUM", "ALTO NETWORK PT", "PRIMA CR Transfer...", "PRIMA WANA KREASI", "YAYASAN SIWANA SAINT...", "SPAN SP2D ...", "RS EMANUEL-PT RAY MITRA PERKASA", "TAICHANG WRAPPER I SECURITY", "CHANG CON CHINA CONSTRUCTION", "SALARY OS SZDIO INDUSTRIES P", "SWITCHING CR TRF...", "Pembayaran inv bulan MCM industelnf DARI RUMAH SAKIT AT-FUTUHI AL-ISLAM"(?, agak buram).
Pagination di bawah tabel: "Halaman 1 dari X".

### Interaksi terekam
Mengedit input tanggal DARI TANGGAL/SAMPAI TANGGAL langsung via date picker segmented (klik-ubah bulan/hari/tahun satu per satu); mengganti PERUSAHAAN ke "PT Cakra Adidaya Perkasa" (data KPI & tabel berubah total, jumlah transaksi turun ke "4 transaksi", nama status alokasi berubah jadi "CAKRA 1 PATI" dll); kembali ke "PT Ray Mitra Perkasa"; membuka & mengganti STATUS ALOKASI (Semua Status/Sudah Dialokasikan/Belum Teralokasi — saat "Belum Teralokasi" tabel kosong dengan pesan "Tidak ada mutasi yang sesuai filter" dan semua KPI menjadi 0); hover ke menu "Tagihan" sebagai transisi.

---

## 4. HALAMAN TAGIHAN (frame f_050–f_065)

Judul: "REKAP TAGIHAN CLIENT" / subjudul: "Pemantauan tagihan sampai bulan berjalan"
Label section: "DATA TAGIHAN 2026" → "Rekap per lokasi & periode" → keterangan italic: "Bulan setelah SEPTEMBER otomatis disembunyikan sampai periodenya tiba."

### KPI Cards (4 kartu)
1. Ikon "Rp" ungu — **"TOTAL PIUTANG CLIENT"** — Rp 29.870.090.871 (berubah sesuai filter bank, mis. Rp 18.829.584.350) — subteks "Keseluruhan client sampai bulan berjalan"
2. Ikon Σ oranye — **"CLIENT TERLAMBAT"** — "68 Client"/"13 Client" — subteks "Ada tagihan belum bayar dari data TAGIHAN"
3. Ikon centang hijau — **"TERBAYAR"** — Rp 79.236.335.314 (berubah, mis. Rp 4.264.004.103, Rp 17.297.901.564, Rp 66.612.007, Rp 9.862.101.356) — subteks "Pembayaran tercatat"
4. Ikon lokasi/pin biru — **"LOKASI"** — "277 Client"/"6 Client"/"60 Client"/"53 Client"/"27 Client"/"1 Client" (berubah drastis sesuai filter Bank/Status/PIC) — subteks daftar bulan kecil: "JANUARI · FEBRUARI · MARET · THR · APRIL · MEI · JUNI · JULI · AGUSTUS · SEPTEMBER"

### Tab pemilihan rentang (5 tombol pill, horizontal)
**Bulan Berjalan** (default aktif, warna ungu solid) | Satu Bulan | Rentang Bulan | 3 Bulan | 6 Bulan (non-aktif, putih/outline).

### Filter row
**TAHUN** (2026), **BANK** (opsi: Semua Bank, BCA, CAKRA BCA, CAKRA BPD, JATENG, MANDIRI, MAS YASIR), **STATUS** (opsi: Semua Status, LUNAS, BELUM BAYAR), **PIC ADMIN** (Semua PIC / HITA dll.), **PENCARIAN** (placeholder "Lokasi, PIC, komoditas..."). Tombol "Reset".

### Tabel 1: "TOP 10 CLIENT DENGAN TAGIHAN TERLAMA"
Counter kanan atas: "10 dari 128 client" (berubah, mis. "10 dari 105 client").
Kolom: **NO | CLIENT | BULAN BELUM BAYAR | JUMLAH TAGIHAN | JATUH TEMPO & TERLAMBAT | TOTAL SISA PIUTANG**
- Kolom CLIENT: nama client bold + di bawahnya subteks kecil abu-abu "PIC: [nama]".
- Kolom BULAN BELUM BAYAR: angka besar bold "X bulan" + di bawahnya daftar nama bulan kecil dipisah "·" (mis. "5 bulan" / "APRIL · MEI · JUNI · JULI · AGUSTUS").
- Kolom JUMLAH TAGIHAN: "X Tagihan".
- Kolom JATUH TEMPO & TERLAMBAT: badge angka hari — **kuning/oranye** untuk keterlambatan sedang (mis. "37 hari", "53 hari", "41 hari"), **merah** untuk keterlambatan lebih parah (mis. "98 hari") — di bawah badge ada subteks kecil "Due date: DD Mon YYYY".
- Kolom TOTAL SISA PIUTANG: nominal Rp bold.
Contoh client top tagihan terlama: PT Liebra Permana Semarang, PT Liebra Permana Wonogiri, PT Rajawali Diesel Indonesia, PT Cintai Produk Indonesia, Dinas Pendidikan Kendal, PT Citra Mandiri Kencana, Kejari Kotawaringin Timur, Klinik Paru Brebes, PT Satoria Distribusi Lestari, BPS Kabupaten Wonogiri.

### Tabel 2: "DATA TAGIHAN – JANUARI – FEBRUARI – MARET – THR – APRIL – MEI – JUNI – JULI – AGUSTUS – SEPTEMBER" (tabel pivot per lokasi per bulan)
Counter kanan atas: "60 lokasi"/"27 lokasi" dst.
Kolom: **NO | NAMA LOKASI | BANK | PIC ADMIN | JANUARI | FEBRUARI | MARET | THR | APRIL | MEI | JUNI | JULI | AGUSTUS | SEPTEMBER | TOTAL PERIODE**
- Catatan penting: "THR" (Tunjangan Hari Raya) diperlakukan sebagai kolom bulan tersendiri, diletakkan di antara MARET dan APRIL.
- Tiap sel bulan berisi badge pill kecil **hijau "LUNAS"** jika sudah dibayar bulan tsb, atau tanda **"—"** (dash abu-abu) jika tidak ada tagihan/data untuk bulan itu. Tidak terlihat contoh badge merah "BELUM BAYAR" di dalam pivot table pada frame yang terekam (kemungkinan karena filter STATUS sedang di-set ke LUNAS saat direkam) — **perlu dicatat: warna badge belum bayar pada tabel pivot ini tidak terlihat jelas/tidak terdokumentasi di video.**
- Kolom TOTAL PERIODE menampilkan "Rp 0" pada semua baris yang terlihat (kemungkinan bug tampilan atau memang belum terisi — dicatat apa adanya, "Rp 0" di semua baris yang sempat terlihat).
Contoh nama lokasi: ATR BPN Wonogiri, Balai Teknik Sabo, BBTK Prov Jateng, BPBD Kabupaten Magelang, BPS Kabupaten Demak, BPSMB Provinsi Jateng, Dinas Kelautan, Dinas Pendidikan Kendal, Dinas Pertanian dan Pangan Purworejo, Disnakkeswan, Dispendukcapil Kab Pekalongan, Dispermades Kabupaten Magelang, DPRKP Kabupaten Magelang, DPU Administrasi/Keamanan/Kebersihan, Kecamatan Kutoarjo, Kejari Blora, Kejari Kab Semarang, Kemenag Blora, Kemenag Purworejo, Kemenhaj Kota Magelang, MAN 1 Magelang, MAN Purworejo, MAN Temanggung, MTS N 1/4/5 Kabupaten Magelang.
Baris PIC ADMIN yang terlihat: OPAL, HITA, ADI, ZAHRA.

### Interaksi terekam
Membuka & mengganti filter BANK (Semua Bank → CAKRA BCA → CAKRA BPD → JATENG → BCA → MANDIRI, masing-masing mengubah total 4 KPI cards & isi kedua tabel drastis); mengganti STATUS (Semua Status → LUNAS → BELUM BAYAR); scroll ke bawah untuk melihat isi penuh kedua tabel; hover ke menu "Dashboard" di sidebar sebagai transisi terakhir.

---

## 5. HALAMAN DASHBOARD / OVERVIEW (frame f_066–f_072) — muncul TERAKHIR di video

Judul: **"DASHBOARD PIHUTANG CLIENT"** (perhatikan ejaan "PIHUTANG", bukan "PIUTANG" — kemungkinan typo asli, harus direplikasi persis agar 100% identik) / subjudul: "Monitoring Tagihan, Pembayaran & Mutasi Bank"
Indikator kanan atas: titik hijau + teks "Diperbarui dari MASTER DATA · SALDO" (beda dari halaman lain yang formatnya "MASTER DATA · [tanggal] pukul [jam]"). Tidak ada tombol "Unduh PDF"/"Ekspor CSV" yang terlihat di area header halaman ini (berbeda dari 4 halaman lain).
Label section: "POSISI KAS TERKINI" → judul "Saldo Rekening Perusahaan".

### Blok Saldo (baris pertama, layout 2 kolom: kiri kartu-kartu saldo, kanan tabel rekening)
Kiri atas — kartu besar: Ikon Σ ungu — **"TOTAL SALDO BANK"** — Rp 9.689.816.233 (berubah ke Rp 12.200.574.643 di frame lain, kemungkinan re-load data) — subteks "11 rekening aktif".
Di bawahnya, 2 kartu sejajar: 
- Ikon "R" (lingkaran hijau/teal) — **"PT RAY MITRA PERKASA"** — Rp 8.304.602.781 (atau Rp 10.560.203.820) — subteks "9 rekening"
- Ikon "C" (lingkaran biru) — **"PT CAKRA ADIDAYA PERKASA"** — Rp 1.385.213.452 (atau Rp 1.640.370.823) — subteks "2 rekening"

Kanan — panel **"SALDO REKENING"**, counter kanan atas "11 rekening", tabel scrollable dengan kolom: **REKENING | PERUSAHAAN | SALDO**. Nama rekening ditampilkan sebagai badge pill kecil ungu/hijau (mis. BCA 78, BCA 99, BCA 21, BCA 73, BPD, MANDIRI 99, MANDIRI 97, MANDIRI 95, PT CAKRA BCA, PT CAKRA BPD). Nilai saldo warna hijau bold rata kanan.

### Blok KPI baris kedua (6 kartu, grid 6 kolom)
1. Ikon "Rp" ungu — **"TOTAL TAGIHAN (YTD)"** — Rp 106.570.272.108 (atau Rp 113.048.423.660) — subteks "2.388 periode tagihan" (atau "2.400 periode tagihan")
2. Ikon donut pink — **"SISA PIUTANG"** — Rp 29.870.090.871 (atau Rp 18.829.584.350) — subteks "Menunggu pembayaran"
3. Ikon centang hijau — **"SUDAH TERBAYAR"** — Rp 79.236.335.314 (atau Rp 95.581.942.174) — subteks "1.703 tagihan lunas" (atau "1.979 tagihan lunas")
4. Ikon seru kuning — **"BELUM BAYAR"** — "625 Data" (atau "430 Data") — subteks "Aksi tagihan mendesak"
5. Ikon panah/transfer teal — **"MUTASI HARI INI"** — Rp 0 — subteks "Pemasukan rekening"
6. Ikon warning merah/oranye — **"BELUM TERALOKASI"** — "14 Mutasi" (atau "30 Mutasi") — subteks "Perlu pencocokan lokasi"

### Blok KPI baris ketiga (2 kartu lebar)
- Ikon "Rp" ungu — **"TOTAL PIUTANG CLIENT"** — Rp 29.870.090.871 (atau Rp 18.829.584.350) — subteks "Seluruh piutang sampai SEPTEMBER 2026"
- Ikon Σ merah — **"CLIENT TERLAMBAT"** — "68 Client" (atau "13 Client") — subteks "625 tagihan belum bayar dari data TAGIHAN" (atau "430 tagihan...")

Catatan: nilai-nilai di atas terlihat berubah antara frame f_066 dan f_071/f_072 meskipun tanpa aksi filter eksplisit yang terekam jelas (kemungkinan data live/auto-refresh dari Google Sheets MASTER DATA, atau reload halaman) — dicatat sebagai temuan menarik, bukan diasumsikan sebagai bug.

### Baris 4 Chart (grid 4 kolom sejajar)
1. **"TREND TAGIHAN & PEMBAYARAN (2026)"** — grouped bar chart vertikal, legend 2 warna: kotak ungu "Tagihan", kotak teal/cyan "Terbayar". Sumbu X = bulan (Jan–Sep). Tidak ada label angka di atas bar (berbeda dari chart Penggajian yang melabeli tiap bar).
2. **"SISA PIUTANG BERDASARKAN BANK"** — donut chart, label besar di tengah "Rp 18,8 M". Legend list di kanan donut dengan warna kotak + persentase: BCA 73% (ungu), JATENG 16% (teal), MANDIRI 4% (kuning), CAKRA BCA 4%(?) (merah/pink), CAKRA BPD 1%(?) (hijau) — persentase kecil agak buram, dicatat sebisa mungkin akurat.
3. **"SISA PIUTANG BERDASARKAN PIC ADMIN"** — horizontal bar chart, 5 baris kategori dengan bar warna berbeda per baris: MIDAN Rp 3,9 M (ungu/biru), HITA Rp 1,3 M (teal), ZAHRA Rp 3 M (kuning), PAK TOHAR Rp 2,9 M (merah/pink), ADI Rp 2,9 M (hijau).
4. **"STATUS TAGIHAN"** — donut chart, label besar tengah **"82%"** + subteks kecil "Lunas". Legend: kotak hijau "Lunas 1579", kotak merah "Belum Bayar 430".

### Tabel "TOP 10 CLIENT DENGAN TAGIHAN TERLAMA" (versi ringkas di Dashboard)
Sama persis strukturnya dengan tabel di halaman Tagihan (kolom NO/CLIENT/BULAN BELUM BAYAR/JUMLAH TAGIHAN/JATUH TEMPO & TERLAMBAT/TOTAL SISA PIUTANG), tapi di pojok kanan atas ada link teks ungu **"Lihat halaman Tagihan →"** yang mengarahkan ke halaman Tagihan.

### Baris terakhir (3 panel)
- Kartu putih: **"PEMASUKAN BULAN INI"** — Rp 8.658.470.661 — subteks "Dari data mutasi seluruh rekening"
- Kartu putih: **"TOTAL SISA PIUTANG YTD"** — Rp 18.829.584.350 — subteks "Per Januari–SEPTEMBER + THR"
- Kartu krem/kuning muda dengan ikon lonceng 🔔: **"Reminder Penagihan"** — bullet list:
  - "Follow-up 2 client yang terlambat lebih dari 60 hari."
  - "Lengkapi due date untuk 170 client yang belum memiliki invoice."
  - "Cocokkan 30 mutasi yang belum teralokasi."

Video berakhir dengan scroll kembali ke atas halaman Dashboard (frame f_072 identik dengan f_066/f_070 — tampilan awal Dashboard).

---

## RINGKASAN LAYOUT & RESPONSIVE
- Layout keseluruhan: sidebar fixed kiri (~120px) + area konten fluid di kanan dengan max-width penuh, di dalam viewport browser desktop standar (~1520px lebar terlihat dari screenshot, tidak ada breakpoint mobile yang terekam di video — video full desktop).
- Grid kartu KPI umumnya 4–6 kolom sejajar tergantung halaman (Penggajian: 6, Invoice: 4, Mutasi: 4, Tagihan: 4, Dashboard: campuran 2+2+6+2).
- Pola konsisten tiap halaman: Header → label section+judul kecil+keterangan italic → tombol aksi kanan atas → KPI cards → filter row → tabel/chart utama → (kadang) chart tambahan + catatan.
- Tidak ada mode gelap (dark mode) yang terekam — seluruh video hanya menampilkan light theme.
- Tidak ada loading spinner besar yang terekam jelas selain ikon loading kecil di tab browser saat transisi antar halaman (favicon berubah jadi ikon loading sesaat).
- Tidak terlihat elemen "empty state" ilustrasi (hanya teks polos "Tidak ada ... yang sesuai filter").

## HAL YANG TIDAK TERLIHAT JELAS / PERLU KONFIRMASI ULANG
- Teks persis tombol hijau di halaman Penggajian (kemungkinan bukan "Ekspor CSV").
- Warna badge persis untuk status "BELUM COCOK TAGIHAN" di tabel Invoice.
- Ejaan lengkap beberapa nama client/PIC yang terpotong atau resolusinya rendah (mis. "IZTAR/ETZAR" di dropdown PIC Invoice, sejumlah nama lokasi di tabel pivot Tagihan).
- Warna badge "BELUM BAYAR" pada sel bulan di tabel pivot Tagihan (tidak ada contoh yang terekam).
- Isi ikon logo PT Ray Mitra Perkasa di sidebar (terlalu kecil untuk dikenali detailnya).
- Arti singkatan "M" pada chart Perkembangan Penggajian (apakah "Miliar" atau notasi lain) — mengingat skala Rp 10–15 M sejalan dengan skala payroll bulanan, kemungkinan besar "M" = Miliar, namun tidak ada label eksplisit "Miliar" di chart sehingga dicatat sebagai estimasi bukan kepastian.
