/**
 * Utils.gs — helper murni (tidak menyentuh Spreadsheet), dipakai lintas file.
 */

/**
 * Buang baris kosong-total di AWAL dan kolom kosong-total di kiri (mis. ada
 * kolom A / beberapa baris atas yang sengaja dikosongkan sebagai spasi
 * visual di sheet REKAP PENGGAJIAN 2026 — getValues() ikut mengembalikan
 * baris/kolom kosong itu apa adanya, beda dari ringkasan "human readable"
 * yang otomatis memangkasnya). Tidak menyentuh baris/kolom kosong DI
 * TENGAH data (itu bisa jadi section marker yang memang perlu, lihat
 * DataLayer.gs). Aman dipanggil walau sheetnya memang sudah rapi dari
 * kolom A / baris 1 — hasilnya tidak berubah.
 */
function compactGrid_(values) {
  function isBlank(c) { return c === '' || c === null || c === undefined; }
  var startRow = 0;
  while (startRow < values.length && values[startRow].every(isBlank)) startRow++;
  var trimmed = values.slice(startRow);
  if (!trimmed.length) return [];

  var minCol = trimmed[0].length;
  trimmed.forEach(function (row) {
    for (var c = 0; c < row.length; c++) {
      if (!isBlank(row[c])) { if (c < minCol) minCol = c; break; }
    }
  });
  if (minCol <= 0 || minCol >= trimmed[0].length) return trimmed;
  return trimmed.map(function (row) { return row.slice(minCol); });
}

/** Ubah apapun (number, string format ID "1.234,56", kosong) jadi number aman. */
function toNumber_(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  var s = String(v).trim();
  if (!s) return 0;
  // format Indonesia: "1.234.567,89" -> hapus titik ribuan, koma jadi desimal
  if (/,\d{1,2}$/.test(s) || /\.\d{3}(\.|,|$)/.test(s)) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  }
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/**
 * Nama/singkatan bulan Indonesia -> index bulan (0=Januari). PENTING: JS
 * Date parser bawaan cuma kenal singkatan Inggris (Jan/Feb/Mar/Apr/May/...),
 * jadi tanggal teks seperti "20 Agu 2026" (dari sheet REKAP PENGGAJIAN,
 * kolom TANGGAL yang diketik manual bukan cell format tanggal asli) akan
 * SELALU gagal di-parse tanpa mapping ini — inilah yang bikin baris jadwal
 * hilang total tanpa pesan error apapun.
 */
var ID_MONTHS_ = {
  JAN: 0, JANUARI: 0, FEB: 1, FEBRUARI: 1, MAR: 2, MARET: 2, APR: 3, APRIL: 3,
  MEI: 4, MAY: 4, JUN: 5, JUNI: 5, JUL: 6, JULI: 6,
  AGU: 7, AGT: 7, AUG: 7, AGUSTUS: 7,
  SEP: 8, SEPT: 8, SEPTEMBER: 8, OKT: 9, OCT: 9, OKTOBER: 9,
  NOV: 10, NOVEMBER: 10, DES: 11, DEC: 11, DESEMBER: 11,
};

/** Ubah cell tanggal (Date object dari Sheets, serial Excel, atau string) jadi Date (jam 00:00). */
function toDate_(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return stripTime_(v);
  if (typeof v === 'number') {
    if (v === 0) return null;
    // serial Excel (basis 30 Des 1899)
    var ms = Math.round((v - 25569) * 86400 * 1000);
    return stripTime_(new Date(ms));
  }
  var s = String(v).trim();
  if (!s || s === '-' || s === '0') return null;
  var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return stripTime_(new Date(+m[3], +m[2] - 1, +m[1]));
  // Format ISO "yyyy-mm-dd" (mis. dari <input type="date"> di halaman Penggajian)
  var mIso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (mIso) return stripTime_(new Date(+mIso[1], +mIso[2] - 1, +mIso[3]));
  // Format "20 Agu 2026" / "20 Agustus 2026" (nama bulan Indonesia, dengan/tanpa titik)
  var m2 = s.match(/^(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})$/);
  if (m2) {
    var monIdx = ID_MONTHS_[m2[2].toUpperCase()];
    if (monIdx !== undefined) return stripTime_(new Date(+m2[3], monIdx, +m2[1]));
  }
  var d = new Date(s);
  if (!isNaN(d.getTime())) return stripTime_(d);
  return null;
}

var ISO_DATE_RE_ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * Setelah data mentah pulang-pergi lewat cache (JSON.stringify/parse), nilai
 * Date berubah jadi string ISO ("2026-01-01T00:00:00.000Z"). Fungsi ini
 * mengembalikannya jadi Date lagi; nilai lain (angka, teks biasa) dibiarkan
 * apa adanya.
 */
function reviveDateIfNeeded_(v) {
  if (typeof v === 'string' && ISO_DATE_RE_.test(v)) return new Date(v);
  return v;
}

function stripTime_(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function todayJakarta_() {
  var tz = 'Asia/Jakarta';
  var s = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var parts = s.split('-');
  return new Date(+parts[0], +parts[1] - 1, +parts[2]);
}

/** Selisih hari bulat (a - b), a & b harus Date jam 00:00. */
function daysBetween_(a, b) {
  if (!a || !b) return null;
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function formatRupiah_(n) {
  n = Math.round(Number(n) || 0);
  var neg = n < 0;
  n = Math.abs(n);
  var s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '-Rp ' : 'Rp ') + s;
}

function formatAngka_(n) {
  n = Math.round(Number(n) || 0);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatTanggal_(d) {
  if (!d) return '-';
  return Utilities.formatDate(d, 'Asia/Jakarta', 'dd MMM yyyy');
}

function monthIndexOf_(namaBulan) {
  if (!namaBulan) return -1;
  return CONFIG.MONTHS.indexOf(String(namaBulan).toUpperCase());
}

/**
 * Normalisasi nama client untuk keperluan pencocokan lintas sheet
 * (dipakai utk agregasi "client tagihan terlama").
 * Direplikasi persis dari logika frontend asli (lihat docs/SPEC.md §2.3).
 */
function normalizeClientName_(s) {
  return String(s || '')
    .toUpperCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(PERSERODA|RAPELAN|REWARD|GAJI|LBR|PAM|KB|OB|PC|THR)\b/g, ' ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function safeUpper_(s) {
  return String(s || '').trim().toUpperCase();
}

/** Ambil nilai numerik dari objek row berdasarkan salah satu dari beberapa kemungkinan nama kolom. */
function pick_(row, keys) {
  for (var i = 0; i < keys.length; i++) {
    if (row[keys[i]] !== undefined) return row[keys[i]];
  }
  return undefined;
}

function clamp_(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sum_(arr, fn) {
  var t = 0;
  for (var i = 0; i < arr.length; i++) t += (fn ? fn(arr[i]) : arr[i]) || 0;
  return t;
}

function groupBy_(arr, keyFn) {
  var map = {};
  arr.forEach(function (item) {
    var k = keyFn(item);
    if (!map[k]) map[k] = [];
    map[k].push(item);
  });
  return map;
}

/** Escape nilai untuk baris CSV (RFC4180 minimal). */
function csvCell_(v) {
  var s = (v === null || v === undefined) ? '' : String(v);
  if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsv_(headerArr, rowsArr) {
  var lines = [headerArr.map(csvCell_).join(',')];
  rowsArr.forEach(function (r) { lines.push(r.map(csvCell_).join(',')); });
  return lines.join('\r\n');
}
