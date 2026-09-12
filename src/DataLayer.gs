/**
 * DataLayer.gs
 * ---------------------------------------------------------------------------
 * Satu-satunya tempat yang menyentuh SpreadsheetApp. Semua fungsi di sini
 * membaca sheet APA ADANYA (berdasarkan NAMA kolom di header, bukan posisi
 * index) supaya tahan terhadap perubahan urutan kolom di sheet sumber.
 *
 * CACHING: data mentah tiap sheet disimpan sementara lewat Cache.gs supaya
 * buka halaman ke-2/ke-3 dst tidak perlu baca ulang Spreadsheet (lihat
 * Cache.gs untuk detail & alasannya). Selain itu, satu kali doGet() cukup
 * memanggil loadAll_() SEKALI lalu meneruskan hasilnya ke semua fungsi
 * agregasi — bukan membaca ulang sheet berkali-kali dalam satu request.
 * ---------------------------------------------------------------------------
 */

/** Baca 1 sheet penuh (LANGSUNG dari Spreadsheet, tanpa cache), kembalikan {header, rows} mentah. */
function readSheetRawUncached_(spreadsheetId, sheetName) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { header: [], rows: [] };
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return { header: [], rows: [] };
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var header = (values[0] || []).map(function (h) { return String(h || '').trim(); });
  var rows = values.slice(1).filter(function (r) {
    return r.some(function (c) { return c !== '' && c !== null; });
  });
  return { header: header, rows: rows };
}

/**
 * Sama seperti readSheetRawUncached_, tapi lewat cache sementara (lihat
 * Cache.gs) — inilah yang dipakai di seluruh aplikasi supaya buka halaman
 * ke-2/ke-3 dst tidak perlu baca ulang Sheet kalau masih dalam jendela
 * CONFIG.CACHE_SECONDS. Nilai Date ikut tersimpan di cache sebagai string
 * ISO (efek JSON.stringify) — makanya dipulihkan lagi jadi Date di sini
 * sebelum dikembalikan, supaya pemanggil tidak perlu tahu soal ini.
 */
function readSheetRaw_(spreadsheetId, sheetName, forceRefresh) {
  var raw = withSheetCache_(['sheet', spreadsheetId, sheetName], forceRefresh, function () {
    return readSheetRawUncached_(spreadsheetId, sheetName);
  });
  raw.rows.forEach(function (row) {
    for (var i = 0; i < row.length; i++) row[i] = reviveDateIfNeeded_(row[i]);
  });
  return raw;
}

/** Ubah {header, rows} jadi array of object {NAMA_KOLOM: nilai}. */
function rowsToObjects_(raw) {
  var header = raw.header;
  return raw.rows.map(function (r) {
    var o = {};
    for (var i = 0; i < header.length; i++) {
      if (header[i]) o[header[i]] = r[i];
    }
    return o;
  });
}

function readSheetAsObjects_(spreadsheetId, sheetName, forceRefresh) {
  return rowsToObjects_(readSheetRaw_(spreadsheetId, sheetName, forceRefresh));
}

/** Sama seperti readSheetAllRows_, tapi LANGSUNG dari Spreadsheet tanpa cache. */
function readSheetAllRowsUncached_(spreadsheetId, sheetName) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return [];
  return sheet.getRange(1, 1, lastRow, lastCol).getValues();
}

/**
 * Baca SEMUA baris tanpa menganggap baris pertama sebagai header — dipakai
 * untuk sheet semi-terstruktur (bukan tabel rapi 1 header), seperti sheet
 * bulan di REKAP PENGGAJIAN yang punya beberapa blok section di satu sheet.
 * Lewat cache sementara juga (lihat Cache.gs).
 */
function readSheetAllRows_(spreadsheetId, sheetName, forceRefresh) {
  var rows = withSheetCache_(['allrows', spreadsheetId, sheetName], forceRefresh, function () {
    return readSheetAllRowsUncached_(spreadsheetId, sheetName);
  });
  rows.forEach(function (row) {
    for (var i = 0; i < row.length; i++) row[i] = reviveDateIfNeeded_(row[i]);
  });
  return rows;
}

/**
 * Muat & normalisasi SEMUA data dari MASTER DATA + REKAP PENGGAJIAN dalam
 * satu paket. Dipanggil sekali per request oleh doGet()/API.
 */
function loadAll_(forceRefresh) {
  var tagihanRaw = readSheetAsObjects_(CONFIG.MASTER_DATA_ID, CONFIG.SHEET_TAGIHAN, forceRefresh);
  var mutasiRaw = readSheetAsObjects_(CONFIG.MASTER_DATA_ID, CONFIG.SHEET_MUTASI, forceRefresh);
  var invoiceRaw = readSheetAsObjects_(CONFIG.MASTER_DATA_ID, CONFIG.SHEET_INVOICE, forceRefresh);
  var saldoRaw = readSheetAsObjects_(CONFIG.MASTER_DATA_ID, CONFIG.SHEET_SALDO, forceRefresh);
  var masterClientRaw = readSheetAsObjects_(CONFIG.MASTER_DATA_ID, CONFIG.SHEET_MASTER_CLIENT, forceRefresh);

  var tagihan = tagihanRaw
    .map(normalizeTagihanRow_)
    .filter(function (t) { return t.NAMA_LOKASI && t.NAMA_LOKASI !== 'TOTAL'; });

  var mutasi = mutasiRaw.map(normalizeMutasiRow_);

  var termOverride = {};
  masterClientRaw.forEach(function (m) {
    var std = safeUpper_(m['NAMA_CLIENT_STANDAR']);
    if (std && m['TERMIN_HARI'] !== undefined && m['TERMIN_HARI'] !== '') {
      termOverride[std] = toNumber_(m['TERMIN_HARI']) || CONFIG.DEFAULT_TERMIN_HARI;
    }
  });

  var today = todayJakarta_();
  var invoice = invoiceRaw.map(function (r) { return normalizeInvoiceRow_(r, termOverride, today); });

  var saldo = saldoRaw.map(function (r) {
    return {
      REKENING: String(r['BANK_REKENING'] || '').trim(),
      SALDO: toNumber_(r['SALDO']),
      PERUSAHAAN: String(r['PERUSAHAAN'] || '').trim(),
      SUMBER: String(r['SUMBER_DATA'] || '').trim(),
      WAKTU: r['WAKTU_PEMBACAAN'] || null,
    };
  });

  return {
    tagihan: tagihan,
    mutasi: mutasi,
    invoice: invoice,
    saldo: saldo,
    masterClient: masterClientRaw,
    today: today,
  };
}

function normalizeTagihanRow_(r) {
  return {
    ID_TAGIHAN: r['ID_TAGIHAN'],
    TAHUN: toNumber_(r['TAHUN']),
    PERIODE_LABEL: safeUpper_(r['PERIODE_LABEL']),
    PERIODE_TANGGAL: toDate_(r['PERIODE_TANGGAL']),
    JENIS_TAGIHAN: r['JENIS_TAGIHAN'],
    NAMA_LOKASI: String(r['NAMA_LOKASI'] || '').trim(),
    BANK: String(r['BANK'] || '').trim(),
    PIC_ADMIN: String(r['PIC_ADMIN'] || '').trim(),
    PIC_LAPANGAN: String(r['PIC_LAPANGAN'] || '').trim(),
    SKALA_PRIORITAS: toNumber_(r['SKALA_PRIORITAS']),
    KOMODITAS: r['KOMODITAS'],
    NO_INVOICE: r['NO_INVOICE'],
    TANGGAL_INVOICE: toDate_(r['TANGGAL_INVOICE']),
    TANGGAL_JATUH_TEMPO: toDate_(r['TANGGAL_JATUH_TEMPO']),
    NILAI_TAGIHAN: toNumber_(r['NILAI_TAGIHAN']),
    NOMINAL_TERBAYAR: toNumber_(r['NOMINAL_TERBAYAR']),
    SISA_PIUTANG: toNumber_(r['SISA_PIUTANG']),
    TANGGAL_PELUNASAN: toDate_(r['TANGGAL_PELUNASAN']),
    STATUS: safeUpper_(r['STATUS']) || 'BELUM BAYAR',
    RAB: toNumber_(r['RAB']),
    PPN: toNumber_(r['PPN']),
    PPH: toNumber_(r['PPH']),
    KETERANGAN: r['KETERANGAN'],
  };
}

function normalizeMutasiRow_(r) {
  var lokasi = String(r['Lokasi'] || '').trim();
  return {
    NO: r['No'],
    PERUSAHAAN: String(r['PT'] || '').trim(),
    SUMBER_AKUN: String(r['Sumber Akun'] || '').trim(),
    TANGGAL: toDate_(r['Tanggal Mutasi']),
    URAIAN: String(r['Uraian'] || '').trim(),
    NOMINAL: toNumber_(r['Nominal']),
    LOKASI: lokasi,
    TERALOKASI: !!lokasi,
  };
}

/**
 * Hitung field turunan invoice (Umur/Terlambat/Aging/StatusData) SETIAP
 * REQUEST relatif ke tanggal server "today" — ini SENGAJA tidak disimpan
 * statis (lihat docs/SPEC.md §2.5: field ini terbukti dihitung ulang tiap
 * generate, bukan live di browser, jadi harus dihitung fresh di backend).
 */
function normalizeInvoiceRow_(r, termOverride, today) {
  var clientRaw = String(r['NAMA_CLIENT_RAW'] || '').trim();
  var clientStd = String(r['NAMA_CLIENT_STANDAR'] || '').trim() || clientRaw;
  var tglTerkirim = toDate_(r['TANGGAL_TERKIRIM']);
  var nominal = toNumber_(r['NOMINAL']);
  var statusInvoice = safeUpper_(r['STATUS_INVOICE']) || 'BELUM BAYAR';
  var tglBayar = toDate_(r['TANGGAL_PEMBAYARAN']);
  var sisaPiutang = toNumber_(r['SISA_PIUTANG']);

  var termin = termOverride[safeUpper_(clientStd)] || toNumber_(r['TERMIN_HARI']) || CONFIG.DEFAULT_TERMIN_HARI;
  var jatuhTempo = tglTerkirim ? new Date(tglTerkirim.getTime() + termin * 86400000) : null;

  var umur = tglTerkirim ? daysBetween_(today, tglTerkirim) : null;
  var terlambat = umur !== null ? Math.max(0, umur - termin) : 0;

  var mappingBelumJelas = !r['NAMA_CLIENT_STANDAR']; // PERLU MAPPING CLIENT
  var belumCocokTagihan = statusInvoice === 'BELUM COCOK TAGIHAN';

  var aging;
  if (statusInvoice === 'LUNAS') aging = 'LUNAS';
  else if (!tglTerkirim) aging = 'TANGGAL BELUM ADA';
  else if (terlambat === 0) aging = 'BELUM JATUH TEMPO';
  else if (terlambat <= 30) aging = '1 - 30 HARI';
  else if (terlambat <= 60) aging = '31 - 60 HARI';
  else if (terlambat <= 90) aging = '61 - 90 HARI';
  else if (terlambat <= 120) aging = '91 - 120 HARI';
  else aging = '> 120 HARI';

  var flags = [];
  if (!tglTerkirim) flags.push('TANGGAL TERKIRIM KOSONG');
  if (mappingBelumJelas) flags.push('PERLU MAPPING CLIENT');
  if (belumCocokTagihan) flags.push('BELUM COCOK TAGIHAN');
  var statusData = flags.length ? flags.join(' | ') : 'SIAP';
  var dataLengkap = flags.length === 0;

  return {
    ID_INVOICE: r['ID_INVOICE'],
    PERIODE: safeUpper_(r['PERIODE_LABEL']),
    CLIENT: clientRaw || clientStd,
    CLIENT_STD: clientStd,
    PIC: String(r['PIC'] || '').trim(),
    NO_INVOICE: r['NO_INVOICE'],
    TANGGAL_TERKIRIM: tglTerkirim,
    MEDIA_KIRIM: r['MEDIA_PENGIRIMAN'],
    JATUH_TEMPO: jatuhTempo,
    TERMIN_HARI: termin,
    NOMINAL: nominal,
    STATUS: statusInvoice,
    TANGGAL_PEMBAYARAN: tglBayar,
    SISA_PIUTANG: sisaPiutang,
    UMUR: umur || 0,
    TERLAMBAT: terlambat,
    AGING: aging,
    STATUS_DATA: statusData,
    DATA_LENGKAP: dataLengkap,
  };
}

/* ============================= PENGGAJIAN ============================== */

/**
 * REKAP: matrix NO, NAMA CLIENT, JANUARI..DESEMBER (nominal gaji per bulan).
 * Sumber "Riwayat Penggajian per Client".
 */
function loadRekapPenggajian_(forceRefresh) {
  var raw = readSheetAsObjects_(CONFIG.PAYROLL_ID, CONFIG.SHEET_REKAP, forceRefresh);
  return raw
    .filter(function (r) { return String(r['NAMA CLIENT'] || '').trim() && safeUpper_(r['NAMA CLIENT']) !== 'TOTAL'; })
    .map(function (r) {
      var months = {};
      CONFIG.MONTHS.forEach(function (m) { months[m] = toNumber_(r[m]); });
      return { CLIENT: String(r['NAMA CLIENT']).trim(), MONTHS: months };
    });
}

/**
 * Sheet per-bulan (JANUARI..SEPTEMBER, THR) berisi 2 blok semi-terstruktur:
 *   1) "CLIENT YANG SUDAH DIGAJI" -> NO,TGL,NOMINAL
 *   2) "JADWAL PENGGAJIAN"        -> NO,TANGGAL,NAMA CLIENT,REKAP,NOMINAL,BANK
 * Fungsi ini mem-parse KEDUA blok dari SATU nama sheet bulan.
 */
function parsePayrollMonthSheet_(sheetName, forceRefresh) {
  var rows = readSheetAllRows_(CONFIG.PAYROLL_ID, sheetName, forceRefresh);
  var paid = [];       // {tanggal:Date, nominal:number}
  var schedule = [];    // {tanggal:Date, client, pic, nominal, bank, sheet}

  var i = 0;
  // cari marker "CLIENT YANG SUDAH DIGAJI"
  while (i < rows.length && safeUpper_(rows[i][0]) !== 'CLIENT YANG SUDAH DIGAJI') i++;
  i += 2; // lewati marker + header (NO,TGL,NOMINAL)
  while (i < rows.length) {
    var a = rows[i];
    var c0 = String(a[0] || '').trim();
    if (safeUpper_(c0) === 'JADWAL PENGGAJIAN') break;
    if (c0 && safeUpper_(c0) !== 'TOTAL') {
      var tgl = toDate_(a[1]);
      var nom = toNumber_(a[2]);
      if (tgl && nom) paid.push({ tanggal: tgl, nominal: nom });
    }
    i++;
  }
  i += 2; // lewati marker "JADWAL PENGGAJIAN" + header (NO,TANGGAL,NAMA CLIENT,REKAP,NOMINAL,BANK)
  while (i < rows.length) {
    var b = rows[i];
    var no = String(b[0] || '').trim();
    if (safeUpper_(no) !== 'TOTAL' && no !== '') {
      var tgl2 = toDate_(b[1]);
      var client = String(b[2] || '').trim();
      if (tgl2 && client) {
        schedule.push({
          TANGGAL: tgl2,
          CLIENT: client,
          PIC_REKAP: String(b[3] || '').trim(),
          NOMINAL: toNumber_(b[4]),
          BANK: safeUpper_(b[5]),
          SHEET: sheetName,
        });
      }
    }
    i++;
  }
  return { paid: paid, schedule: schedule };
}

/**
 * Gabungkan seluruh sheet bulan yang ADA (tidak semua 12+THR pasti dibuat,
 * bulan yang belum tiba wajar belum ada sheet-nya).
 */
function loadPayrollSchedule_(forceRefresh) {
  var sheetNames = withSheetCache_(['sheetnames', CONFIG.PAYROLL_ID], forceRefresh, function () {
    return SpreadsheetApp.openById(CONFIG.PAYROLL_ID).getSheets().map(function (sh) { return sh.getName(); });
  });
  var existing = {};
  sheetNames.forEach(function (n) { existing[n] = true; });

  var monthSheets = CONFIG.MONTHS.filter(function (m) { return existing[m]; });
  if (existing['THR']) monthSheets.push('THR');

  var allSchedule = [];
  var allPaid = [];
  monthSheets.forEach(function (name) {
    var parsed = parsePayrollMonthSheet_(name, forceRefresh);
    allSchedule = allSchedule.concat(parsed.schedule);
    allPaid = allPaid.concat(parsed.paid);
  });

  // Status "SUDAH DIBAYAR": kelompokkan jadwal per tanggal, cocokkan totalnya
  // dengan salah satu nilai di "Client yang Sudah Digaji" (lihat docs/SPEC.md §1.7).
  var groups = groupBy_(allSchedule, function (s) { return s.TANGGAL.getTime(); });
  var paidTotalsSet = {};
  allPaid.forEach(function (p) { paidTotalsSet[Math.round(p.nominal)] = true; });

  var today = todayJakarta_();
  Object.keys(groups).forEach(function (key) {
    var rowsInGroup = groups[key];
    var total = sum_(rowsInGroup, function (r) { return r.NOMINAL; });
    var isPaid = !!paidTotalsSet[Math.round(total)];
    var tgl = rowsInGroup[0].TANGGAL;
    rowsInGroup.forEach(function (r) {
      if (!r.NOMINAL) {
        r.STATUS = 'NOMINAL BELUM SIAP';
      } else if (isPaid) {
        r.STATUS = 'SUDAH DIBAYAR';
      } else if (tgl.getTime() === today.getTime()) {
        r.STATUS = 'HARI INI';
      } else if (tgl.getTime() > today.getTime()) {
        r.STATUS = 'TERJADWAL';
      } else {
        r.STATUS = 'PERLU KONFIRMASI';
      }
      // [ASUMSI] lihat docs/SPEC.md §1.6 — "Rekening Bayar" tidak ada di data
      // mentah, di-lookup dari nama Bank generik -> rekening spesifik.
      r.REKENING_BAYAR = CONFIG.BANK_TO_REKENING[r.BANK] || r.BANK;
    });
  });

  return { schedule: allSchedule, paid: allPaid };
}
