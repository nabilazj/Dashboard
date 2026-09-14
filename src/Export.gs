/**
 * Export.gs — Ekspor CSV & PDF yang BENAR-BENAR menghasilkan file (bukan
 * sekadar window.print()).
 *
 * - CSV: dibangun sebagai teks di server, dikirim ke klien lewat
 *   google.script.run, lalu di-download via Blob + <a download> (lihat
 *   ClientScript.html -> downloadCsv_()).
 * - PDF: dibangun sebagai Google Doc sementara (native DocumentApp, TANPA
 *   perlu mengaktifkan Advanced Service apapun), dikonversi ke PDF asli via
 *   DriveApp.getAs(MimeType.PDF), lalu file sementara dihapus. Hasilnya
 *   dikirim ke klien sebagai base64 lalu di-download sebagai file .pdf.
 *
 * Batasan yang disengaja: PDF dibatasi maksimal 500 baris per ekspor (supaya
 * tidak melebihi batas waktu eksekusi Apps Script / ukuran dokumen). Kalau
 * data terfilter lebih dari itu, gunakan Ekspor CSV untuk data lengkap.
 */

var PDF_ROW_LIMIT_ = 500;

function buildCsvForPage_(pageName, f) {
  var all = loadAll_();

  if (pageName === 'mutasi') {
    var rows = filterMutasi_(all, f);
    var header = ['No', 'Perusahaan', 'Sumber Akun', 'Tanggal Mutasi', 'Uraian', 'Nominal Masuk', 'Status Alokasi'];
    var body = rows.map(function (m, i) {
      return [i + 1, m.PERUSAHAAN, m.SUMBER_AKUN, formatTanggal_(m.TANGGAL), m.URAIAN, Math.round(m.NOMINAL), m.TERALOKASI ? m.LOKASI : 'BELUM TERALOKASI'];
    });
    return { filename: 'mutasi_' + stamp_() + '.csv', csv: toCsv_(header, body) };
  }

  if (pageName === 'tagihan') {
    var built = buildTagihanRows_(all, f);
    var header2 = ['No', 'Nama Lokasi', 'Bank', 'PIC Admin'].concat(built.kolomBulan, ['Total Belum Bayar']);
    var body2 = built.rows.map(function (r, i) {
      var cells = r.cells.map(function (c) { return c ? c.status : '-'; });
      return [i + 1, r.lokasi, r.bank, r.picAdmin].concat(cells, [Math.round(r.totalPeriode)]);
    });
    return { filename: 'tagihan_' + stamp_() + '.csv', csv: toCsv_(header2, body2) };
  }

  if (pageName === 'invoice') {
    var rowsInv = filterInvoice_(all, f);
    var header3 = ['No', 'Client', 'Periode', 'PIC', 'Tanggal Terkirim', 'Jatuh Tempo', 'Nominal', 'Status', 'Sisa Piutang', 'Umur (hari)', 'Terlambat (hari)', 'Aging', 'Status Data'];
    var body3 = rowsInv.map(function (inv, i) {
      return [i + 1, inv.CLIENT, inv.PERIODE, inv.PIC,
        inv.TANGGAL_TERKIRIM ? formatTanggal_(inv.TANGGAL_TERKIRIM) : '-',
        inv.JATUH_TEMPO ? formatTanggal_(inv.JATUH_TEMPO) : '-',
        Math.round(inv.NOMINAL), inv.STATUS, Math.round(inv.SISA_PIUTANG), inv.UMUR, inv.TERLAMBAT, inv.AGING, inv.STATUS_DATA];
    });
    return { filename: 'invoice_' + stamp_() + '.csv', csv: toCsv_(header3, body3) };
  }

  if (pageName === 'penggajian_jadwal') {
    var payroll = loadPayrollSchedule_();
    var today = all.today;
    var awalBulan = new Date(today.getFullYear(), today.getMonth(), 1);
    var akhirBulan = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    var in7Hari = new Date(today.getTime() + 7 * 86400000);
    var rowsJadwal = filterSchedule_(payroll.schedule, f, today, awalBulan, akhirBulan, in7Hari);
    var header4 = ['No', 'Tanggal', 'Client', 'PIC Rekap', 'Nominal', 'Bank', 'Rekening Bayar', 'Maker', 'Status'];
    var body4 = rowsJadwal.map(function (s, i) {
      return [i + 1, formatTanggal_(s.TANGGAL), s.CLIENT, s.PIC_REKAP, Math.round(s.NOMINAL), s.BANK, s.REKENING_BAYAR, s.PIC_REKAP, s.STATUS];
    });
    return { filename: 'jadwal_penggajian_' + stamp_() + '.csv', csv: toCsv_(header4, body4) };
  }

  if (pageName === 'penggajian_riwayat') {
    var rekap = loadRekapPenggajian_();
    var today2 = all.today;
    var riwayat = buildRiwayatMatrix_(rekap, today2.getMonth(), f.searchHistory);
    var riwayatMonths = CONFIG.MONTHS.slice(0, today2.getMonth() + 1);
    var header5 = ['No', 'Nama Client'].concat(riwayatMonths, ['Total']);
    var body5 = riwayat.map(function (r, i) {
      return [i + 1, r.client].concat(r.cells.map(function (n) { return Math.round(n); }), [Math.round(r.total)]);
    });
    return { filename: 'riwayat_penggajian_' + stamp_() + '.csv', csv: toCsv_(header5, body5) };
  }

  if (pageName === 'dashboard') {
    var dash = getDashboardData_(all);
    var header6 = ['Client', 'PIC', 'Jumlah Bulan Belum Bayar', 'Daftar Bulan', 'Jumlah Tagihan', 'Terlambat (hari)', 'Jatuh Tempo', 'Total Sisa Piutang'];
    var body6 = dash.top10.map(function (r) {
      return [r.client, r.pic, r.jumlahBulanBelumBayar, r.daftarBulan, r.jumlahTagihan, r.terlambatHari === null ? '-' : r.terlambatHari, r.jatuhTempo, Math.round(r.totalSisaPiutang)];
    });
    return { filename: 'dashboard_top_client_' + stamp_() + '.csv', csv: toCsv_(header6, body6) };
  }

  throw new Error('Halaman ekspor tidak dikenal: ' + pageName);
}

function stamp_() {
  return Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmm');
}

/* --------------------------------- PDF ---------------------------------- */

function buildPdfForPage_(pageName, f) {
  var csvResult = buildCsvForPage_(pageName, f);
  var lines = csvResult.csv.split('\r\n');
  var header = parseCsvLine_(lines[0]);
  var dataLines = lines.slice(1, 1 + PDF_ROW_LIMIT_);
  var truncated = lines.length - 1 > PDF_ROW_LIMIT_;

  var titleMap = {
    mutasi: 'Riwayat Mutasi Pemasukan', tagihan: 'Rekap Tagihan Client',
    invoice: 'Monitoring Invoice Client', penggajian_jadwal: 'Jadwal Penggajian',
    penggajian_riwayat: 'Riwayat Penggajian per Client', dashboard: 'Top Client Tagihan Terlama',
  };

  var doc = DocumentApp.create('TMP_EXPORT_' + stamp_());
  var body = doc.getBody();
  body.setPageWidth(792).setPageHeight(612).setMarginLeft(28).setMarginRight(28); // Letter landscape-ish, cukup lebar utk tabel
  body.appendParagraph('PT RAY MITRA PERKASA').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(titleMap[pageName] || pageName).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Dicetak: ' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd MMMM yyyy HH:mm') + ' WIB')
    .setFontSize(9).setForegroundColor('#666666');
  if (truncated) {
    body.appendParagraph('Menampilkan ' + PDF_ROW_LIMIT_ + ' baris pertama dari ' + (lines.length - 1) + ' baris hasil filter. Gunakan "Ekspor CSV" untuk data lengkap.')
      .setFontSize(9).setForegroundColor('#cf3535');
  }

  var tableData = [header].concat(dataLines.map(parseCsvLine_));
  var table = body.appendTable(tableData);
  table.setBorderWidth(0.5);
  var headerRow = table.getRow(0);
  for (var c = 0; c < headerRow.getNumCells(); c++) {
    headerRow.getCell(c).setBackgroundColor('#111f4a');
    headerRow.getCell(c).editAsText().setForegroundColor('#ffffff').setBold(true).setFontSize(8);
  }
  for (var r = 1; r < table.getNumRows(); r++) {
    for (var c2 = 0; c2 < table.getRow(r).getNumCells(); c2++) {
      table.getRow(r).getCell(c2).editAsText().setFontSize(8);
    }
  }

  doc.saveAndClose();
  var pdfBlob = DriveApp.getFileById(doc.getId()).getAs(MimeType.PDF);
  var base64 = Utilities.base64Encode(pdfBlob.getBytes());
  DriveApp.getFileById(doc.getId()).setTrashed(true); // bersihkan file sementara

  return { filename: csvResult.filename.replace(/\.csv$/, '.pdf'), base64: base64 };
}

function parseCsvLine_(line) {
  // parser CSV sederhana yg cukup utk output toCsv_ kita sendiri (quoting RFC4180 minimal)
  var result = [];
  var cur = '', inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}
