/**
 * Config.gs
 * ---------------------------------------------------------------------------
 * Konfigurasi pusat Dashboard Piutang Client (PT Ray Mitra Perkasa).
 *
 * SEMUA konstanta yang mungkin perlu diubah suatu saat ada di sini SAJA —
 * jangan hardcode ID spreadsheet / nama sheet di file lain.
 * ---------------------------------------------------------------------------
 */

const CONFIG = {
  // Spreadsheet sumber utama: TAGIHAN, MUTASI, INVOICE, SALDO, MASTER_CLIENT
  MASTER_DATA_ID: '1UifGzezCofXDueyQKDFRTvu6MNuuXOwlsb97bilWN0E',

  // Spreadsheet sumber Penggajian: REKAP, UPDATE DANA, <NAMA_BULAN>, THR
  PAYROLL_ID: '1uD3WrDzp2XkamL1jGaTEwqy0teve8lh93qOo5xDIM1o',

  // Nama sheet di MASTER_DATA_ID (harus persis sama dengan tab di spreadsheet)
  SHEET_TAGIHAN: 'TAGIHAN',
  SHEET_MUTASI: 'MUTASI',
  SHEET_INVOICE: 'INVOICE',
  SHEET_SALDO: 'SALDO',
  SHEET_MASTER_CLIENT: 'MASTER_CLIENT',

  // Nama sheet di PAYROLL_ID
  SHEET_REKAP: 'REKAP',

  // Termin pembayaran invoice default (hari) — bisa dioverride per client lewat
  // kolom TERMIN_HARI di sheet MASTER_CLIENT.
  DEFAULT_TERMIN_HARI: 30,

  // Nama bulan dalam Bahasa Indonesia — urutan ini dipakai di seluruh aplikasi.
  MONTHS: ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI',
           'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'],
  MONTHS_SHORT: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],

  // [ASUMSI — lihat README bagian "Keputusan & Asumsi"]
  // Rekening yang dipakai sebagai sumber dana penggajian (dari 11 rekening di
  // sheet SALDO, hanya 6 ini yang relevan untuk Penggajian, sesuai video/HTML asli).
  PAYROLL_FUNDING_ACCOUNTS: ['BCA 70', 'BPD', 'BRI', 'MANDIRI 99', 'MANDIRI 97', 'PT CAKRA BCA'],

  // [ASUMSI] Pemetaan nama Bank di JADWAL PENGGAJIAN -> nama Rekening di SALDO.
  // Data mentah jadwal cuma menyimpan nama bank generik ("BCA","MANDIRI",dst),
  // bukan nomor rekening spesifik. Silakan sesuaikan mapping ini kalau ternyata
  // ada aturan lain di internal Anda.
  BANK_TO_REKENING: {
    'BCA': 'BCA 70',
    'BPD': 'BPD',
    'BRI': 'BRI',
    'MANDIRI': 'MANDIRI 99',
    'CAKRA': 'PT CAKRA BCA',
  },

  // Berapa lama data mentah tiap sheet disimpan di cache sementara
  // (CacheService, lihat Cache.gs) sebelum dibaca ulang dari Spreadsheet.
  // Sedikit lebih lama dari interval polling frontend (60 detik) supaya
  // kebanyakan siklus polling & perpindahan antar halaman kena cache hit.
  // Perbesar kalau ingin lebih cepat tapi kurang real-time; perkecil kalau
  // sebaliknya. Tombol "Perbarui data sekarang" di topbar SELALU melewati
  // cache ini (forceRefresh) berapapun nilainya.
  CACHE_SECONDS: 120,

  // Jumlah baris per halaman untuk tabel dengan pagination server-side.
  PAGE_SIZE: 25,
};
