# SPESIFIKASI TEKNIS — Dashboard Piutang Client (PT Ray Mitra Perkasa)
Rekonstruksi dari hasil build (bundled/minified) React Server Components ("waku-like"/vite-rsc) di folder `dashboard_zip/DASHBOARD/`.

Legenda bukti:
- **[PASTI]** — ada bukti langsung di kode sumber (dikutip) atau diverifikasi 100% secara empiris terhadap data mentah.
- **[DUGAAN]** — inferensi masuk akal karena kode halaman terkait hilang dari zip / obfuscated / hanya 1 contoh data.
- **[TIDAK DAPAT DIPASTIKAN]** — tidak ada bukti sama sekali, murni asumsi standar diberikan sebagai fallback.

---

## 0. RINGKASAN KETERBATASAN DATA (WAJIB DIBACA DULU)

Hasil `find` menunjukkan **hanya 2 dari 5 halaman punya file component JS-nya**:

| Route | File HTML entry | page-*.js dirujuk HTML | File JS ada di disk? |
|---|---|---|---|
| `/` (Dashboard) | `DASHBOARD/DASHBOARD/index` | `page-Clg8M8mr.js` | **ADA** ✅ (dibaca penuh) |
| `/mutasi` | `DASHBOARD/MUTASI/mutasi` | `page-CYhQCqZF.js` | **ADA** ✅ (dibaca penuh) |
| `/tagihan` | `DASHBOARD/TAGIHAN/tagihan` | `page-DZf1j86T.js` | **TIDAK ADA** ❌ |
| `/invoice` | `DASHBOARD/INVOICE/invoice` | `page-Bsq_0Msw.js` | **TIDAK ADA** ❌ |
| `/penggajian` | `DASHBOARD/PENGGAJIAN/penggajian` | `page-CC3-oz6-.js` | **TIDAK ADA** ❌ |

Dikonfirmasi dengan `find ... -name "*.js"` (hanya folder `DASHBOARD/` dan `MUTASI/` berisi file `.js`; folder `TAGIHAN/`, `INVOICE/`, `PENGGAJIAN/` hanya berisi 1 file HTML tanpa asset JS sendiri) dan `find -iname "*DZf1j86T*|*Bsq_0Msw*|*CC3-oz6*"` yang hasilnya kosong. **Ini bukan salah cari — file-nya memang tidak ikut ter-zip.**

**Yang dipakai sebagai kompensasi** untuk 3 halaman yang hilang kodenya:
1. **HTML statis hasil SSR** tiap halaman (berisi RSC payload + tabel yang sudah di-render dengan data asli) — dipakai untuk melihat *hasil akhir* perhitungan.
2. **`live-data-DoSb5tEf.js`** (shared, identik di semua folder) — berisi semua data mentah + helper functions (formatter, `buildOldUnpaidClients`, dsb) yang dipakai bersama semua halaman.
3. **Analisis statistik/empiris** terhadap seluruh isi array data mentah (mis. 2021 baris `invoiceData` di-parse dengan Python lalu setiap hipotesis rumus diuji hingga cocok 100% dengan angka pada kartu KPI/tabel di HTML). Ketika hasil cocok 100% terhadap seluruh populasi data (bukan cuma 1-2 contoh), kesimpulan ditandai **[PASTI]** walau kode page aslinya tidak terbaca — karena rumus terbukti secara matematis, bukan tebakan.

**Temuan penting soal waktu**: HTML statis di zip ini di-render pada saat **jam sistem server = epoch (1 Januari 1970)** — terlihat dari `<strong>1 Januari 1970</strong>`, `value="1970-01-01"` pada input tanggal, dan filter tahun `1970`. Ini **bukan bug produksi**, melainkan artefak build/prerender (kemungkinan container tanpa RTC/clock saat proses static export dijalankan). Buktinya ada di `live-data-DoSb5tEf.js`:
```js
b=new Intl.DateTimeFormat(`en-CA`,{timeZone:`Asia/Jakarta`,...}).formatToParts(new Date)
```
`new Date()` dipanggil **sekali saat module di-load** (bukan tiap render), jadi kalau modul ini di-load ulang di browser pengunjung sungguhan, `S,C,w,T,E,D,O,k` (tahun/bulan/hari/serial-hari-ini/dsb) akan otomatis berisi tanggal asli. Konsekuensi lain: field ini **tidak auto-refresh** walau data di-fetch ulang tiap 60 detik — kalau dashboard dibiarkan terbuka lewat tengah malam, "hari ini" tidak berubah sampai halaman di-reload penuh. **[PASTI]**

Meta snapshot cadangan (fallback) yang sebenarnya dibuat pada **20 Agustus 2026 15:06** (`meta.updatedAt`), jadi semua angka Umur/Terlambat/Aging di `invoiceData` dihitung relatif terhadap tanggal itu — bukan terhadap 1970.

---

## 1. SKEMA DATA

Semua array berada di `live-data-DoSb5tEf.js`, digabung jadi objek fallback `R` lalu dipakai sebagai state awal `LiveDataProvider`, yang setiap 60 detik mem-fetch ulang `` `/api/master-data?ts=${Date.now()}` `` dan memvalidasi bentuknya dengan fungsi `H()`:
```js
function H(e){ return Array.isArray(e.tagihanData)&&Array.isArray(e.mutasiData)&&Array.isArray(e.invoiceData)
 &&Array.isArray(e.saldoData)&&Array.isArray(e.payrollHistoryData)&&Array.isArray(e.payrollScheduleData)
 &&Array.isArray(e.payrollPaidGroupTotals)&&!!e.meta }
```
**[PASTI]**

### 1.1 `tagihanData` — **[PASTI]**
Contoh baris mentah:
```js
[`TAG-2026-CE6074DDFC14`,2026,`JANUARI`,`REGULER`,`ATR BPK PULANG PISAU`,`BCA`,`MIDAN`,`RIDWAN`,4,`2 SATPAM`,9923392,10075000,0,`LUNAS`,46023,46062]
```
| idx | Field | Contoh | Catatan |
|---|---|---|---|
|0|ID_TAGIHAN|`TAG-2026-CE6074DDFC14`||
|1|TAHUN|2026|numeric|
|2|PERIODE_LABEL|`JANUARI` / `THR`||
|3|JENIS_TAGIHAN|`REGULER` / `THR`||
|4|NAMA_LOKASI|`ATR BPK PULANG PISAU`|dipakai sbg key client|
|5|BANK|`BCA`||
|6|PIC_ADMIN|`MIDAN`||
|7|PIC_LAPANGAN|`RIDWAN`||
|8|SKALA_PRIORITAS|4|numeric|
|9|KOMODITAS|`2 SATPAM`||
|10|NILAI_TAGIHAN|9923392||
|11|NOMINAL_TERBAYAR|10075000||
|12|SISA_PIUTANG|0||
|13|STATUS|`LUNAS` / `BELUM BAYAR`||
|14|PERIODE_TANGGAL (serial Excel)|46023||
|15|TANGGAL_PELUNASAN (serial Excel, 0=belum)|46062||

Konfirmasi via `page-Clg8M8mr.js`: `t[10]` dijumlah utk "TOTAL TAGIHAN", `t[11]` utk "SUDAH TERBAYAR", `t[12]` utk "SISA PIUTANG", `t[13]==='LUNAS'` utk hitung lunas.

### 1.2 `mutasiData` — **[PASTI]**
```js
[1,`PT Ray Mitra Perkasa`,`MANDIRI 99 2026`,46023,`PRMA CR Transf ...`,1e7,``]
```
| idx | Field | Catatan |
|---|---|---|
|0|No/ID|integer urut|
|1|Perusahaan|`PT Ray Mitra Perkasa` / `PT Cakra Adidaya Perkasa`|
|2|Sumber Akun|nama rekening, mis. `BCA 2026`|
|3|Tanggal Mutasi (serial Excel)||
|4|Uraian/Keterangan|teks bebas dari rekening koran|
|5|Nominal Masuk||
|6|**LOKASI hasil pencocokan** (string kosong `` jika belum match)|dipakai utk status alokasi|

**Status Alokasi** — dari `page-CYhQCqZF.js`:
```js
j===`ALLOCATED`?!!e[6]:!e[6]
...
e[6]?(0,w.jsx)(`span`,{className:`allocation-pill`,children:e[6]}):(0,w.jsx)(`span`,{className:`allocation-pill waiting`,children:`BELUM TERALOKASI`})
```
→ **ALLOCATED** jika `mutasiData[i][6]` (field LOKASI) terisi (truthy), **WAITING** jika kosong. Nilai LOKASI itu sendiri diasumsikan hasil pencocokan teks Uraian (idx4) terhadap NAMA_LOKASI di `tagihanData` — tapi **proses pencocokannya dilakukan di backend/sumber data, bukan di frontend ini** (frontend hanya membaca hasil akhirnya). **[DUGAAN]** untuk mekanisme pencocokan; **[PASTI]** untuk logika ALLOCATED/WAITING itu sendiri.

### 1.3 `invoiceData` — **[PASTI, direkonstruksi via analisis statistik]**
Kode halaman (`page-Bsq_0Msw.js`) hilang, tapi seluruh 2021 baris berhasil di-parse (Python) dan **setiap hipotesis kolom diuji sampai cocok 100% dengan angka di kartu KPI HTML** — jadi skema di bawah ini punya tingkat kepastian setara kode asli.
```js
[`INV-2026-JANUARI-0004`,`JANUARI`,`PT SAT DC REMBANG`,`PT SAT DC REMBANG`,`PAK TOHAR`,46052,`POS`,130108820,46082,`LUNAS`,46049,0,202,0,`LUNAS`,`SIAP`,`Terkirim tgl 30/1/26 (POS)`,!0]
```
| idx | Field | Catatan |
|---|---|---|
|0|ID Invoice||
|1|PERIODE|nama bulan|
|2|CLIENT (nama tampil)||
|3|CLIENT_MATCH (nama utk pencocokan ke tagihan)|dipakai di `B(e[3]\|\|e[2])`|
|4|PIC||
|5|TANGGAL_TERKIRIM (serial, **0 = belum ada**)||
|6|METODE_KIRIM|`POS`/`LANGSUNG`/`` |
|7|NOMINAL||
|8|JATUH_TEMPO (serial)|= TANGGAL_TERKIRIM + termin (lihat 2.4)|
|9|STATUS|`LUNAS` / `BELUM COCOK TAGIHAN` / `BELUM BAYAR`|
|10|TANGGAL_PELUNASAN (serial, 0=belum bayar)|nonzero **hanya & selalu** saat STATUS=LUNAS (diverifikasi 100%: 1260/1279 baris LUNAS nonzero, 0/742 baris non-LUNAS nonzero — 19 pengecualian LUNAS bernilai 0 kemungkinan data legacy)|
|11|SISA_PIUTANG|nonzero **persis** utk 210 baris = jumlah baris STATUS=BELUM BAYAR (persis 210) — 1:1|
|12|UMUR (hari)|lihat 2.4|
|13|TERLAMBAT (hari)|lihat 2.4|
|14|AGING (teks siap-pakai)|lihat 2.4|
|15|STATUS_DATA (teks gabungan, lihat 2.4)||
|16|Catatan pengiriman (teks bebas, tidak tampil di tabel)|mis. `Terkirim tgl 30/1/26 (POS)`|
|17|Boolean "data lengkap" (`true`/`false`)|**persis sama** dgn flag `PERLU MAPPING CLIENT` di StatusData & penentu stat "PERLU VALIDASI" (lihat 2.4)|

### 1.4 `saldoData` — **[PASTI]**
```js
[`BCA 70`,86008264,`PT Ray Mitra Perkasa`,`REKAP PENGGAJIAN 2026 > UPDATE DANA`,46248.673168506946]
```
idx0=Rekening, idx1=Saldo, idx2=Perusahaan, idx3=Sumber/catatan asal angka, idx4=timestamp serial (pecahan = jam). Dipakai langsung: `h.reduce((e,t)=>e+t[1],0)` (total saldo), filter `t[2]===...` per perusahaan.

### 1.5 `payrollHistoryData` — **[PASTI, diverifikasi 100%]**
```js
[`ATR BPN KENDAL`,29965594,29968841,32321911,32351841,41470341,41410481,41410481,0,0,0,0,0]
```
idx0=Nama Client, idx1..idx12 = Nominal gaji per bulan **Januari..Desember** (13 kolom, format lebar/wide). Diverifikasi: menjumlah kolom idx1..idx7 (Jan-Jul) di seluruh 282 baris menghasilkan persentase tinggi bar **identik hingga >10 digit desimal** dengan `style="height:...%"` di HTML trend chart (mis. Jan=92.89560771652513%). Baris client "PT AESTHETIC HEALTH BEAUTY" juga cocok persis: Juni=864.233.203, Juli=1.429.939.103 — sama persis dengan tabel "RIWAYAT PENGGAJIAN" di HTML.

### 1.6 `payrollScheduleData` — **[PASTI untuk skema; DUGAAN untuk kolom "Rekening Bayar"]**
```js
[`GAJI-2026-001`,46254,`PT BPR BKK PURWODADI (PERSERODA)`,`PAK TOHAR`,0,`BCA`,`PAK TOHAR`]
```
Seluruh 288 baris **konsisten 7 kolom** (diverifikasi via `Counter(len(r) for r in rows)` → `{7: 288}`): idx0=ID, idx1=Tanggal(serial), idx2=Client, idx3=PIC Rekap, idx4=Nominal, idx5=Bank, idx6=Maker.
**Temuan penting**: tabel HTML "JADWAL PENGGAJIAN" punya kolom **"Rekening Bayar"** yang **tidak ada sama sekali** di data mentah 7-kolom ini. Berarti "Rekening Bayar" pasti dihitung/di-lookup oleh `page-CC3-oz6-.js` (hilang) — kemungkinan look-up dari nama Bank ke rekening spesifik di `saldoData`, tapi tidak bisa dipastikan. **[DUGAAN]**

### 1.7 `payrollPaidGroupTotals` — **[PASTI, diverifikasi]**
```js
_=[455530468]
```
Array angka total. Diverifikasi dengan mengelompokkan `payrollScheduleData` berdasarkan **Tanggal (idx1) saja** lalu menjumlah Nominal per tanggal: grup tanggal `46254` menghasilkan total **455530468 — cocok persis** dengan satu-satunya nilai di `payrollPaidGroupTotals`. Ini konsisten dengan catatan di halaman Penggajian:
> "Status Sudah Dibayar hanya muncul bila total kelompok jadwal cocok dengan catatan Client yang Sudah Digaji."

→ Rumus **SUDAH DIBAYAR**: kelompokkan baris jadwal per tanggal, jumlahkan Nominal; jika total grup == salah satu nilai `payrollPaidGroupTotals`, seluruh baris jadwal pada tanggal itu berstatus SUDAH DIBAYAR. (Hanya 1 titik data yang bisa diuji, jadi tidak 100% menutup kemungkinan pengelompokan tambahan per Bank, tapi grouping per-tanggal saja sudah cukup menjelaskan kecocokan.)

### 1.8 `meta` — **[PASTI]**
```js
p={updatedAt:`20 Agustus 2026 15:06`,tagihanRows:3097,mutasiRows:2800,invoiceRows:2021,source:`MASTER DATA`}
// digabung saat build objek R:
{...p, payrollHistoryRows:h.length, payrollScheduleRows:g.length, payrollSource:`Snapshot REKAP PENGGAJIAN 2026`}
```
Field: `updatedAt, tagihanRows, mutasiRows, invoiceRows, source, payrollHistoryRows, payrollScheduleRows, payrollSource`. `payrollSource` adalah string hardcoded (bukan dari data live).

---

## 2. LOGIKA PER HALAMAN

### 2.1 DASHBOARD (`page-Clg8M8mr.js`, dibaca 100%) — **[PASTI]**

Semua variabel di bawah persis dari kode (nama asli 1-huruf, diberi nama deskriptif untuk kejelasan):

```js
let{tagihanData:TG, mutasiData:MU, saldoData:SA, oldUnpaidClients:OU} = useLiveData()
periodeAktif = TG.filter(r=>r[4] && r[4]!=='TOTAL')
tahunIni     = periodeAktif.filter(r=>r[1]===currentYear && (r[2]==='THR' || monthIndex(r[2])<=currentMonthIdx))
```
- **TOTAL TAGIHAN (YTD)** = `sum(tahunIni[].NILAI_TAGIHAN)` ; hint = jumlah baris `tahunIni.length` "periode tagihan"
- **SISA PIUTANG** = `sum(tahunIni[].SISA_PIUTANG)`
- **SUDAH TERBAYAR** = `sum(tahunIni[].NOMINAL_TERBAYAR)` ; hint = count STATUS==='LUNAS'
- **BELUM BAYAR** (kartu) = `count(tahunIni[].STATUS !== 'LUNAS')` — ditampilkan sbg "N Data" bukan Rupiah
- **MUTASI HARI INI** = `sum( MU.filter(floor(TanggalMutasi)===todaySerial).NominalMasuk )`
- **BELUM TERALOKASI** = `count( MU.filter(!LOKASI) )` — **atas SELURUH mutasi (tidak difilter periode)**
- **TOTAL PIUTANG CLIENT** (blok priority-stats) = sama persis dgn SISA PIUTANG di atas (angka yang sama dipakai ulang)
- **CLIENT TERLAMBAT** = `count( OU.filter(oldestLateDays>0) )` ; hint = `sum(OU[].tagihanCount)` "tagihan belum bayar dari data TAGIHAN"
- **PEMASUKAN BULAN INI** (bottom-summary) = `sum( MU.filter(TanggalMutasi>=awalBulanSerial && TanggalMutasi<=todaySerial+1).NominalMasuk )`
- **TOTAL SISA PIUTANG YTD** (bottom-summary) = sama dgn SISA PIUTANG

**Trend chart bulanan** (Tagihan vs Terbayar):
```js
P = months.slice(0,currentMonthIdx+1).map(bulan => ({
  label: bulan,
  invoice: sum(periodeAktif.filter(r=>r[2]===bulan).NILAI_TAGIHAN),
  paid:    sum(periodeAktif.filter(r=>r[2]===bulan).NOMINAL_TERBAYAR)
}))
tinggiBar% = max(3, nilai / max(semua invoice bulan) * 100)   // minimum 3% agar bar tetap terlihat
```
Catatan: trend ini **TIDAK memasukkan THR** (beda dgn kartu2 stat lain yg pakai `tahunIni` termasuk THR).

**Donut "Sisa Piutang per Bank"**: ambil top-5 bank (berdasar total SISA_PIUTANG terbesar) dari `tahunIni`, sisanya tidak masuk grafik (tidak ada kategori "Lainnya"). Warna dipetakan urut: `#4b22ff,#10b5d5,#ffc72c,#f15b50,#10c79a`.

**Horizontal bar "Sisa Piutang per PIC Admin"**: sama, top-5 PIC_ADMIN terbesar (PIC kosong dianggap `BELUM DIISI`).

**Donut "Status Tagihan"**: `%Lunas = countLunas/(countLunas+countBelumBayar)*100`. **Bug potensial**: jika `countLunas+countBelumBayar===0` (belum ada data sama sekali), hasilnya `0/0 = NaN` — inilah sebabnya di HTML snapshot muncul literal teks **`NaN%`** pada donut status ketika tidak ada data yang lolos filter periode (kasus tahun 1970 di snapshot ini). **[PASTI, terlihat langsung di HTML: `<span>NaN<!-- -->%`]**

**Top 10 Client Tagihan Terlama** = `OU.slice(0,10)` — algoritma `OU` (fungsi `buildOldUnpaidClients`, dipakai bareng oleh context provider, lihat 2.3 di bawah untuk detail lengkap karena ini fungsi shared, dipakai lagi kemungkinan besar oleh halaman Tagihan).

**Reminder Penagihan**:
- "Follow up **N** client yang terlambat lebih dari 90 hari" → `count(OU.filter(oldestLateDays>90))`
- "Lengkapi due date untuk **N** client yang belum memiliki data invoice" → `count(OU.filter(oldestDueDateSerial===null))`
- "Cocokkan **N** mutasi yang belum teralokasi" → sama dgn kartu BELUM TERALOKASI di atas

### 2.2 MUTASI (`page-CYhQCqZF.js`, dibaca 100%) — **[PASTI]**

State filter default: `startDate=O` (awal tahun ini, `YYYY-01-01`), `endDate=D` (hari ini, `YYYY-MM-DD`), Akun Bank=ALL, Perusahaan=ALL, Status Alokasi=ALL, search=''.

```js
filtered = mutasiData.filter(r =>
  toISODate(r[3]) >= startDate && toISODate(r[3]) <= endDate &&
  (bankFilter==='ALL' || r[2]===bankFilter) &&
  (companyFilter==='ALL' || r[1]===companyFilter) &&
  (statusFilter==='ALL' || (statusFilter==='ALLOCATED' ? !!r[6] : !r[6])) &&
  (!search || `${r[4]} ${r[6]} ${r[2]}`.toLowerCase().includes(search.toLowerCase()))
)
```
- **TOTAL FILTER DATA** = `sum(filtered[].NominalMasuk)` ; hint = `filtered.length` transaksi
- **PEMASUKAN HARI INI** = `sum( mutasiData.filter(floor(Tanggal)===todaySerial).NominalMasuk )` — **dihitung dari seluruh data, bukan dari `filtered`**
- **PEMASUKAN BULAN INI** = `sum( mutasiData.filter(Tanggal>=awalBulan && Tanggal<=today+1).NominalMasuk )` — juga dari seluruh data
- **TRANSAKSI MENUNGGU** = `count( filtered.filter(!LOKASI) )` — ini dihitung dari **`filtered`** (beda dgn 2 kartu di atas)
- Paginasi: 25 baris/halaman (`Math.ceil(filtered.length/25)`)
- **Export CSV**: header `[NO,PT,SUMBER AKUN,TANGGAL MUTASI,URAIAN,NOMINAL MASUK,STATUS ALOKASI]`, nominal dibulatkan (`Math.round`), status kosong diisi teks `BELUM TERALOKASI`.
- **Definisi Status Alokasi**: **ALLOCATED jika field LOKASI (idx6) terisi, WAITING jika kosong** — lihat 1.2.

### 2.3 Fungsi Shared `buildOldUnpaidClients` (dipakai Dashboard, kemungkinan besar juga Tagihan) — **[PASTI]**

```js
function normalisasiNama(s){
  return s.toUpperCase()
    .replace(/\([^)]*\)/g,' ')                                   // buang isi kurung, mis. "(GAJI)","(LBR)"
    .replace(/\b(PERSERODA|RAPELAN|REWARD|GAJI|LBR|PAM|KB|OB|PC|THR)\b/g,' ')  // buang kata-kata noise ini
    .replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ')
}

function buildOldUnpaidClients(tagihanData, invoiceData){
  periodeBerjalan = [...months.slice(0,currentMonthIdx+1), ...(currentMonthIdx>=2 ? ['THR'] : [])]

  // peta jatuh-tempo TERAWAL per (client dinormalisasi | periode), diambil dari invoiceData
  dueDateMap = new Map()
  invoiceData.forEach(inv => {
    if (!inv.JATUH_TEMPO) return
    key = normalisasiNama(inv.CLIENT_MATCH || inv.CLIENT) + '|' + inv.PERIODE
    if (!dueDateMap.has(key) || inv.JATUH_TEMPO < dueDateMap.get(key)) dueDateMap.set(key, inv.JATUH_TEMPO)
  })

  clients = new Map()
  tagihanData
    .filter(t => t.TAHUN===currentYear && t.SISA_PIUTANG>0 && t.STATUS!=='LUNAS'
              && periodeBerjalan.includes(t.PERIODE) && t.NAMA_LOKASI && t.NAMA_LOKASI!=='TOTAL')
    .forEach(t => {
      key = normalisasiNama(t.NAMA_LOKASI)
      entry = clients.get(key) ?? {client:t.NAMA_LOKASI, pic:t.PIC_ADMIN, periods:[], tagihanCount:0,
                                    oldestLateDays:null, oldestDueDateSerial:null, totalOutstanding:0}
      if (!entry.periods.includes(t.PERIODE)) entry.periods.push(t.PERIODE)
      entry.periods.sort(byPeriodIndex)
      entry.tagihanCount += 1
      entry.totalOutstanding += t.SISA_PIUTANG
      due = dueDateMap.get(key+'|'+t.PERIODE)
      if (due) {
        late = max(0, todaySerial - floor(due))
        entry.oldestLateDays = entry.oldestLateDays===null ? late : max(entry.oldestLateDays, late)
        entry.oldestDueDateSerial = entry.oldestDueDateSerial===null ? due : min(entry.oldestDueDateSerial, due)
      }
      clients.set(key, entry)
    })

  return [...clients.values()].sort((a,b) =>
    (hasDue(b)-hasDue(a))                                        // 1) yang punya due date duluan
    || ((b.oldestLateDays??-1) - (a.oldestLateDays??-1))          // 2) paling lama terlambat duluan
    || (b.periods.length - a.periods.length)                     // 3) paling banyak periode belum bayar
    || (b.totalOutstanding - a.totalOutstanding))                // 4) sisa piutang terbesar
}
```
Ini adalah sumber data "Top 10 Client Tagihan Terlama" di Dashboard **dan** kemungkinan besar juga panel serupa di halaman Tagihan (nama class CSS `top-aging-panel` identik, teks "Belum ada client dengan tagihan belum bayar." identik persis di kedua HTML). **[PASTI untuk algoritma; DUGAAN untuk pemakaian ulang di halaman Tagihan]** karena `page-DZf1j86T.js` hilang.

### 2.4 TAGIHAN (`page-DZf1j86T.js` **HILANG** — direkonstruksi dari HTML + helper shared)

Yang **[PASTI]** (langsung dari `live-data-DoSb5tEf.js`, dipakai lintas halaman):
```js
function daftarKolomMatrix(){                     // exported sbg "m" / buildMatrixColumns
  kolom = months.slice(0, currentMonthIdx+1)
  kolom.splice(3, 0, 'THR')                       // THR selalu disisipkan tepat SETELAH Maret (index 3)
  return kolom
}
```
Ini konsisten dgn subjudul halaman Tagihan: *"Bulan setelah JANUARI otomatis disembunyikan sampai periodenya tiba"* — kolom matrix (`JANUARI, FEBRUARI, ..., THR`) hanya menampilkan bulan ≤ bulan berjalan, THR muncul setelah kolom Maret begitu bulan berjalan ≥ Maret (index≥2).

Header tabel matrix dari HTML: `No, Nama Lokasi, Bank, PIC Admin, <bulan-bulan berjalan>, THR, Total Periode`.

Opsi filter yang dikonfirmasi dari HTML: Bank = `BCA, CAKRA BCA, CAKRA BPD, JATENG, MANDIRI, MAS YASIR`; Status = `LUNAS, BELUM BAYAR`; PIC Admin = `ADI, DINI, HITA, MIDAN, OPAL, PAK TOHAR, PURWO, PUTUS, ZAHRA`.

Period-tabs yang terlihat di HTML: **Tahun Berjalan (default/active), Satu Bulan, Rentang Bulan, 3 Bulan, 6 Bulan** — **[DUGAAN]** perilaku tiap tab (kode hilang), asumsi paling masuk akal:
- *Tahun Berjalan*: kolom = `months.slice(0,currentMonthIdx+1)+THR` (sama seperti fungsi `daftarKolomMatrix` di atas) — **[PASTI]** ini yang jadi default karena cocok dgn subjudul "Bulan setelah X otomatis disembunyikan".
- *Satu Bulan*: user pilih 1 bulan spesifik → tabel hanya menampilkan 1 kolom bulan itu.
- *Rentang Bulan*: user pilih bulan awal & akhir → kolom = bulan-bulan dalam rentang itu.
- *3 Bulan* / *6 Bulan*: kolom = 3/6 bulan terakhir dari bulan berjalan mundur ke belakang.
Ini **tidak dapat dipastikan** tanpa kode; disarankan saat rebuild di Apps Script mengikuti pola termudah yang konsisten dgn label tombol.

Kartu KPI (label & class identik dgn Dashboard, sehingga **[DUGAAN kuat]** rumusnya identik/mirip dgn Dashboard, kode asli tidak ada):
- **TOTAL PIUTANG CLIENT** — diduga = `sum(SISA_PIUTANG)` atas periode aktif (sama pola dgn Dashboard "SISA PIUTANG").
- **CLIENT TERLAMBAT** — diduga = `count(OU.filter(oldestLateDays>0))` (pakai fungsi shared `buildOldUnpaidClients` yg sama).
- **TERBAYAR** — diduga = `sum(NOMINAL_TERBAYAR)` atas periode aktif.
- **LOKASI** — diduga = jumlah baris unik `NAMA_LOKASI` (distinct count) pada periode aktif; ditampilkan sbg "N Client" — istilah "Client" dan "Lokasi" dipakai bertukar-tukar di UI ini.

**Top 10 Aging** — panel dgn class `top-aging-panel` identik dgn Dashboard → **[DUGAAN kuat]** memakai `OU.slice(0,10)` yang sama persis (fungsi shared 2.3).

### 2.5 INVOICE (`page-Bsq_0Msw.js` **HILANG** — direkonstruksi 100% empiris dari 2021 baris data)

Semua rumus berikut **diuji terhadap SELURUH 2021 baris** dan **cocok persis (exact match)** dengan angka di kartu KPI HTML — ditandai **[PASTI]** meski kode page tidak terbaca:

- **TOTAL DATA INVOICE** = `meta.invoiceRows` = `invoiceData.length` = **2021** ✓ cocok HTML.
- **INVOICE TERKIRIM** = `count(invoiceData.filter(r => r.TANGGAL_TERKIRIM))` (serial ≠ 0) = **1337** ✓ cocok persis HTML "1337 Data — Memiliki tanggal pengiriman".
- **LAMA BELUM DIBAYAR** = `count(invoiceData.filter(r => r.STATUS==='BELUM BAYAR' && r.TERLAMBAT>30))` = **60** ✓ cocok persis HTML "60 Invoice — Terlambat lebih dari 30 hari". (Catatan: kalau syarat STATUS diabaikan, hasilnya 299 — jadi filter status WAJIB ada.)
- **PERLU VALIDASI** = `count(invoiceData.filter(r => r.dataReadyFlag===false))` (kolom idx17) = **1639** ✓ cocok persis HTML "1639 Data — Mapping atau data belum lengkap".

**Termin & Jatuh Tempo**: `JATUH_TEMPO - TANGGAL_TERKIRIM = 30 hari` **konstan pada seluruh 380 baris berterlambat** yang diuji (tidak ditemukan satupun pengecualian). Jadi termin default = **30 hari** adalah **[PASTI]**. Deskripsi di halaman menyebut *"dapat disesuaikan per client"* — fitur override ini ada secara tekstual tapi **tidak teramati satupun contoh override dalam data**, dan mekanismenya (kemungkinan tabel master termin per-client di backend/spreadsheet) **[TIDAK DAPAT DIPASTIKAN]** dari frontend.

**Umur vs Terlambat**:
- `UMUR = today_saat_snapshot_dibuat - TANGGAL_TERKIRIM` (dalam hari)
- `TERLAMBAT = max(0, UMUR - 30)` — diverifikasi: `UMUR - TERLAMBAT === 30` di semua 380 baris dgn Terlambat>0.
- **Penting — arsitektur**: karena `invoiceData` adalah snapshot statis dan field ini sudah berupa angka jadi (bukan dihitung ulang oleh JS Dashboard), **UMUR/TERLAMBAT/AGING/STATUS DATA pasti dihitung di backend (Google Apps Script / API `/api/master-data`) setiap kali data di-generate, BUKAN di frontend bundle ini.** Saat membangun ulang di Apps Script, formula ini harus diimplementasikan di sisi server (mis. saat generate JSON utk endpoint master-data), bukan di client. **[PASTI]** — dibuktikan oleh 2 snapshot berbeda (file `live-data-DoSb5tEf.js` vs HTML statis `invoice`) yang punya Umur berbeda 6 hari untuk baris identik, padahal keduanya "diam" (statis) — artinya masing-masing dihasilkan dari proses generate terpisah dgn "hari ini" berbeda, bukan dihitung live di browser.

**Bucket AGING** (kolom idx14, sudah berupa teks jadi) — batasnya **[PASTI]**, diverifikasi dari min/max Terlambat riil semua baris:
| Label | Syarat |
|---|---|
| `LUNAS` | STATUS === 'LUNAS' (mengalahkan semua kondisi lain) |
| `TANGGAL BELUM ADA` | STATUS ≠ 'LUNAS' **dan** TANGGAL_TERKIRIM = 0 (belum ada tanggal kirim) — diverifikasi 245/245 exact match |
| `BELUM JATUH TEMPO` | TERLAMBAT = 0 (observasi: Umur 0–30) |
| `1 - 30 HARI` | TERLAMBAT 1–30 |
| `31 - 60 HARI` | TERLAMBAT 31–60 |
| `61 - 90 HARI` | TERLAMBAT 61–90 |
| `91 - 120 HARI` | TERLAMBAT 91–120 |
| `> 120 HARI` | TERLAMBAT > 120 |

**Status Data** (kolom idx15, string gabungan) — **[PASTI, diverifikasi exact-match]**: dibentuk dengan menggabungkan flag yang berlaku (urutan tetap: `TANGGAL TERKIRIM KOSONG` → `PERLU MAPPING CLIENT` → `BELUM COCOK TAGIHAN` → `CEK TANGGAL`) dengan separator `" | "`; jika tidak ada flag berlaku → `"SIAP"`.
- `TANGGAL TERKIRIM KOSONG` ⟺ `TANGGAL_TERKIRIM === 0` (match 684/684, exact)
- `PERLU MAPPING CLIENT` ⟺ `dataReadyFlag (idx17) === false` (match 1639/1639, exact — **flag ini sama persis dgn penentu kartu PERLU VALIDASI**)
- `BELUM COCOK TAGIHAN` ⟺ `STATUS === 'BELUM COCOK TAGIHAN'` (match 532/532, exact)
- `CEK TANGGAL` — hanya 9 dari 2021 baris, **tidak ditemukan pola numerik/formula apapun** yang menjelaskannya (tanggal kirim/jatuh tempo/umur semua normal). **[TIDAK DAPAT DIPASTIKAN]** — kemungkinan flag manual dari staf di spreadsheet sumber, bukan hasil formula.

**⚠️ TEMUAN BUG UI (penting)**: Ketiga contoh "Status Data" yang dirender di HTML (`SIAP`, `BELUM COCOK TAGIHAN`, `BELUM COCOK TAGIHAN | CEK TANGGAL`) **semuanya memakai class CSS yang SAMA**: `<span class="data-ready">...</span>` — padahal CSS punya class terpisah `.data-review` (warna oranye, utk kondisi bermasalah) yang **tidak pernah dipakai** pada elemen yang dilihat. Akibatnya baris "BELUM COCOK TAGIHAN" tetap tampil **hijau** (warna sukses) alih-alih oranye/merah, walau isinya menandakan masalah. **[PASTI, terlihat langsung 3x di HTML]** — sebaiknya diperbaiki saat rebuild (pilih class berdasarkan isi teks, bukan hardcode `data-ready`).

### 2.6 PENGGAJIAN (`page-CC3-oz6-.js` **HILANG**)

**[PASTI, diverifikasi exact-match]**:
- **Trend chart "PERKEMBANGAN PENGGAJIAN 2026"**: untuk tiap bulan m (1..bulan tersedia), `total[m] = sum(payrollHistoryData[*][m])` atas seluruh client; `tinggiBar% = total[m] / max(total[1..7]) * 100`. Diverifikasi cocok hingga >10 digit desimal dgn semua 7 nilai `style="height:...%"` di HTML (Jan 92.8956...%, ..., Jul 100%).
- **Tabel Riwayat per Client**: `Nominal = payrollHistoryData[client][periodeTerpilih+1]`; `BulanSebelumnya = payrollHistoryData[client][periodeTerpilih]`; `Perubahan% = (Nominal - BulanSebelumnya) / BulanSebelumnya * 100`. Badge: **up** jika >0, **down** jika <0 (termasuk "-0.0%" yang secara raw negatif tapi rounding tampil -0.0%), **flat** jika persis 0 (Nominal===BulanSebelumnya). Diverifikasi persis pada 20 baris contoh (mis. PT AESTHETIC: (1.429.939.103−864.233.203)/864.233.203=+65.5%).
- **Status "SUDAH DIBAYAR"**: kelompokkan `payrollScheduleData` per Tanggal, jumlahkan Nominal; jika sama dgn salah satu nilai `payrollPaidGroupTotals`, tandai SUDAH DIBAYAR (lihat 1.7).
- **Proyeksi Sisa** (tabel Kesiapan Dana) = `Saldo (dari saldoData) − Kebutuhan` — dikonfirmasi arithmetic langsung di HTML (semua 6 baris: Proyeksi Sisa = Saldo persis, karena Kebutuhan=0 pada snapshot ini).
- **Kondisi "Cukup"** (class `fund-pill.enough`, hijau `#048c68`/`#dcfaee`) muncul bila (diduga) `Saldo >= Kebutuhan`; kebalikannya class `fund-pill.short` (merah `#cf3535`/`#ffe3e3`) ada di CSS tapi **tidak pernah teramati** dipakai (karena tabel jadwal kosong di snapshot ini akibat bug tanggal 1970 — tidak ada data 7 hari ke depan yg valid utk dihitung).

**[DUGAAN]**, tidak ada satupun baris jadwal ter-render di HTML (tabel "JADWAL PENGGAJIAN" kosong total krn filter default "Bulan Berjalan" tidak cocok dgn "1970"), sehingga KPI berikut **tidak bisa diverifikasi sama sekali** — hanya asumsi standar mengikuti pola dari halaman lain:
- **TOTAL RENCANA BULAN INI** = `sum(payrollScheduleData.filter(Tanggal berada di bulan berjalan).Nominal)`
- **SUDAH DIBAYARKAN** = jumlah Nominal dari kelompok tanggal yg lolos cek `payrollPaidGroupTotals`
- **MENUNGGU PEMBAYARAN** = `TOTAL RENCANA BULAN INI − SUDAH DIBAYARKAN`
- **JADWAL HARI INI** = `count/sum(payrollScheduleData.filter(Tanggal===todaySerial))`
- **KEBUTUHAN 7 HARI** = `sum(payrollScheduleData.filter(Tanggal antara hari-ini..+7 && belum SUDAH DIBAYAR).Nominal)`, kemungkinan dikelompokkan per Bank utk mengisi kolom "Kebutuhan" di tabel Kesiapan Dana (pencocokan nama Bank di jadwal ↔ nama Rekening di `saldoData` — **tidak dapat dipastikan** aturan pemetaan bank→rekening persis yang mana, mis. Bank="BCA" bisa cocok ke rekening "BCA 70" **atau** "BCA 99" **atau** "BCA 21"/"BCA 73" — ambigu tanpa kode).
- **KEKURANGAN DANA** = `sum(max(0, Kebutuhan[rekening] − Saldo[rekening]))` atas semua rekening yg kurang.
- Catatan tekstual di halaman (bukan formula, murni informasi bisnis, **[PASTI]** krn tertulis eksplisit di HTML): *"BCA 99 dipakai sebagai sumber pemenuhan dana saat rekening penggajian lain kurang"*, dan *"Dashboard tidak melakukan transfer dan tetap membutuhkan persetujuan petugas"* — mengonfirmasi tidak ada automasi transfer dana, murni monitoring.
- Status jadwal individual (`SUDAH DIBAYAR / HARI INI / TERJADWAL / PERLU KONFIRMASI / NOMINAL BELUM SIAP`) punya CSS class siap pakai (`payroll-status.paid/today/scheduled/warning/review`) tapi **tidak ada satupun contoh render** utk memastikan pemetaan label→class secara pasti; pemetaan nama yang paling masuk akal: SUDAH DIBAYAR→`.paid`, HARI INI→`.today`, TERJADWAL→`.scheduled`, PERLU KONFIRMASI→`.review`, NOMINAL BELUM SIAP→`.warning`. **[DUGAAN]**

---

## 3. DESIGN TOKENS / CSS (`index-Cdl8xaw9.css`, 27KB, dibaca 100%, identik di semua folder)

Build dengan **Tailwind v4.2.1** (preflight/reset only) + CSS custom manual (bukan utility classes Tailwind dipakai untuk styling utama — hanya reset & beberapa utility generik seperti `.relative`,`.table`,`.filter`).

### 3.1 Palet Warna (variabel `:root`)
```css
--navy:#111f4a; --navy2:#071b43; --ink:#16265e; --muted:#6875a0;
--violet:#4b22ff; --green:#0bc89a; --red:#ef5b55; --yellow:#ffc72c; --cyan:#12b9dc;
--line:#dfe5f0; --page:#f3f6fc; --white:#fff;
```
- Background utama halaman: `--page` `#f3f6fc` (abu kebiruan sangat muda)
- Sidebar: gradient `linear-gradient(#14204a 0%, #071c45 100%)` (navy gelap), lebar **246px**, fixed
- Teks utama: `--ink` `#16265e`; font body: `Inter, Segoe UI, Arial, sans-serif` (fallback ke sistem jika Inter tak ter-load — **tidak ada `@font-face`/Google Fonts link di HTML**, jadi murni mengandalkan font sistem bernama "Inter" jika tersedia, atau jatuh ke `Segoe UI`/`Arial`)

**Stat-icon** (ikon KPI card, background bulat 45×45px, radius 11px):
| Class | Warna teks | Background |
|---|---|---|
| (default/violet) | `#4b22ff` | `#e7e3ff` |
| `.green` | `#08a878` | `#d9f9ec` |
| `.purple` | `#8b35e8` | `#f0dfff` |
| `.yellow` | `#a56c00` | `#fff2bf` |
| `.cyan` | `#079abc` | `#dff7fc` |
| `.red` | `#dd4040` | `#ffe3e3` |

**Badge status**:
| Class | Teks | BG |
|---|---|---|
| `.invoice-status.lunas` | `#048c68` | `#dcfaee` |
| `.invoice-status.belum-bayar` | `#d43d3d` | `#ffe5e5` |
| `.invoice-status.perlu-validasi` | `#916200` | `#fff3cf` |
| `.invoice-status.draft` | `#68728e` | `#edf0f6` |
| `.aging-pill` (default) | `#2670aa` | `#e9f3ff` |
| `.aging-pill.warning` | `#916200` | `#fff2cc` |
| `.aging-pill.critical` | `#cf3535` | `#ffe3e3` |
| `.data-ready` | `#048c68` | `#dcfaee` |
| `.data-review` | `#916200` | `#fff3cf` |
| `.allocation-pill` (allocated) | `#0789cf` | `#e8f7ff` |
| `.allocation-pill.waiting` | `#9a6900` | `#fff4d2` |
| `.fund-pill.enough` | `#048c68` | `#dcfaee` |
| `.fund-pill.short` | `#cf3535` | `#ffe3e3` |
| `.change-pill.up` | `#048c68` | `#dcfaee` |
| `.change-pill.down` | `#cb3e3e` | `#ffe6e6` |
| `.change-pill.flat` | `#69728c` | `#eef1f7` |
| `.payroll-status.paid` | `#048c68` | `#dcfaee` |
| `.payroll-status.scheduled` | `#2169a7` | `#e8f2ff` |
| `.payroll-status.today` | `#4b22ff` | `#e7e3ff` |
| `.payroll-status.warning` | `#916200` | `#fff3cf` |
| `.payroll-status.review` | `#c63d3d` | `#ffe8e8` |
| `.amount-unpaid` | `#ef3f3f` (tanpa bg, teks saja) | — |

**Tombol**:
- `.btn.danger` (Unduh PDF): teks putih, bg `#ef5b55`, shadow `0 5px 12px #ef5b5533`
- `.btn.success` (Ekspor CSV): teks putih, bg `#0bc89a`, shadow `0 5px 12px #0bc89a33`
- `.btn.reset`: bg putih, border `1px solid #dbe1ed`

**Donut chart colors** (dipakai di JS, bukan CSS): `['#4b22ff','#10b5d5','#ffc72c','#f15b50','#10c79a']`
**Status donut**: Lunas `#10c79a`, Belum Bayar `#f15b50` (via `.green-dot`/`.red-dot`)

### 3.2 Grid & Layout
- Sidebar: `width:246px; position:fixed`
- Main area: `margin-left:246px; padding:0 30px 34px`
- `.stats-grid.six` → `repeat(6, minmax(0,1fr))`; `.stats-grid.four` → `repeat(4,1fr)`; `.stats-grid.two`/`.three` → sesuai nama
- `.dashboard-grid` → `1.55fr 1fr 1.12fr 1fr` (trend | donut bank | horizontal bar PIC | donut status)
- `.balance-overview-grid` → `minmax(0,1fr) minmax(0,1fr)` (ringkasan saldo | tabel saldo)
- `.payroll-control-grid` → `1.65fr 1fr` ; `.payroll-history-grid` → `1.55fr 1fr`
- Breakpoints (`@media width<=...`):
  - **1450px**: `.stats-grid.six`→3 kolom, `.dashboard-grid`→`1.4fr 1fr`, `.stats-grid.four`→2 kolom
  - **1200px** (khusus payroll): grid payroll jadi 1 kolom
  - **1100px**: `.balance-overview-grid`→1 kolom
  - **900px** ("mobile"): sidebar disembunyikan jadi off-canvas (`transform:translate(-102%)`, toggle via `.mobile-menu`), `.dashboard-grid`/`.bottom-summary`→1 kolom, filters jadi grid 2 kolom
  - **560px**: semua `.stats-grid` jadi 1 kolom, `.period-tabs` jadi grid 2 kolom
  - **print**: sidebar/filter/tombol/pager disembunyikan, tabel `min-width:100%`

### 3.3 Radius, Shadow, & Kesan Visual
- Card (`.stat-card`, `.panel`): `border-radius:14-15px`, border tipis `#edf0f7`/`#e9edf5`, shadow lembut `0 8px 22px rgba(24,42,91,0.05-0.07)` → gaya **modern/rounded, flat-soft** (bukan neumorphism, bukan flat tegas — semacam "soft UI" khas dashboard SaaS).
- Badge/pill: `border-radius:999px` (full pill)
- Tombol: `border-radius:9px`
- Tabel: header sticky (`position:sticky;top:0`), zebra-striping (`nth-child(2n)` bg `#fbfcfe`), hover row `#f5f3ff`
- Donut chart dibuat murni CSS `conic-gradient` + pseudo-element `::before` putih di tengah (bukan SVG/canvas)

---

## 4. CATATAN ARSITEKTUR TAMBAHAN

1. **Framework**: Vite RSC (React Server Components) gaya "waku-like" — terlihat dari `self.__VINEXT_RSC_CHUNKS__`, `self.__VINEXT_RSC_NAV__`, payload format `I["<hash>",[],"<ComponentName>",1]`. Setiap route di-export sbg direktori statis terpisah berisi HTML pre-render + RSC flight-data.
2. **Live data**: `LiveDataProvider` fetch `/api/master-data?ts=${Date.now()}` tiap 60 detik + saat tab kembali visible (`visibilitychange`), dgn fallback ke data statis `R` (built-in snapshot) jika fetch gagal/format tidak valid — indikator visual: dot hijau "MASTER DATA · <waktu>" (live) vs dot kuning "Snapshot cadangan · <waktu>" (fallback).
3. Semua 5 route berbagi **1 file CSS**, **1 file live-data**, dan **1 shared UI kit** (`ui-BlsSr6LN.js` — berisi `Layout`, `StatCard`, `Panel`, `EmptyState`, `Select`, `SearchInput`, `Pager`, `downloadCSV`).
4. **Untuk rebuild di Google Apps Script**: karena Umur/Terlambat/Aging/StatusData invoice terbukti dihitung di backend (bukan browser), endpoint `/api/master-data` versi Apps Script HARUS menghitung ulang field-field turunan ini setiap kali dipanggil (menggunakan tanggal server saat itu), bukan menyimpannya sebagai nilai statis di Sheet.
