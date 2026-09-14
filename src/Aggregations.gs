/**
 * Aggregations.gs
 * ---------------------------------------------------------------------------
 * Semua rumus KPI & agregasi per halaman. Tidak ada satupun fungsi di sini
 * yang menyentuh SpreadsheetApp — semua menerima data yang sudah dimuat oleh
 * DataLayer.gs (loadAll_ / loadRekapPenggajian_ / loadPayrollSchedule_).
 *
 * Rujukan rumus: docs/SPEC.md (hasil bedah kode dashboard asli).
 * ---------------------------------------------------------------------------
 */

/* ============================ SHARED HELPERS ============================ */

/**
 * "Top Client Tagihan Terlama" — dipakai bareng oleh Dashboard & Tagihan.
 * Direplikasi persis dari fungsi asli buildOldUnpaidClients (docs/SPEC.md §2.3).
 */
function buildOldUnpaidClients_(tagihan, invoice, today) {
  var currentYear = today.getFullYear();
  var currentMonthIdx = today.getMonth(); // 0=Januari

  var periodeBerjalan = CONFIG.MONTHS.slice(0, currentMonthIdx + 1);
  if (currentMonthIdx >= 2) periodeBerjalan.push('THR');

  var dueDateMap = {};
  invoice.forEach(function (inv) {
    if (!inv.JATUH_TEMPO) return;
    var key = normalizeClientName_(inv.CLIENT_STD || inv.CLIENT) + '|' + inv.PERIODE;
    var existing = dueDateMap[key];
    if (!existing || inv.JATUH_TEMPO.getTime() < existing.getTime()) dueDateMap[key] = inv.JATUH_TEMPO;
  });

  var clients = {};
  tagihan
    .filter(function (t) {
      return t.TAHUN === currentYear && t.SISA_PIUTANG > 0 && t.STATUS !== 'LUNAS' &&
        periodeBerjalan.indexOf(t.PERIODE_LABEL) !== -1 && t.NAMA_LOKASI;
    })
    .forEach(function (t) {
      var key = normalizeClientName_(t.NAMA_LOKASI);
      var entry = clients[key];
      if (!entry) {
        entry = { client: t.NAMA_LOKASI, pic: t.PIC_ADMIN, periods: [], tagihanCount: 0,
                  oldestLateDays: null, oldestDueDate: null, totalOutstanding: 0 };
        clients[key] = entry;
      }
      if (entry.periods.indexOf(t.PERIODE_LABEL) === -1) entry.periods.push(t.PERIODE_LABEL);
      entry.tagihanCount += 1;
      entry.totalOutstanding += t.SISA_PIUTANG;
      var due = dueDateMap[key + '|' + t.PERIODE_LABEL];
      if (due) {
        var late = Math.max(0, daysBetween_(today, due));
        entry.oldestLateDays = entry.oldestLateDays === null ? late : Math.max(entry.oldestLateDays, late);
        entry.oldestDueDate = entry.oldestDueDate === null ? due : (due.getTime() < entry.oldestDueDate.getTime() ? due : entry.oldestDueDate);
      }
    });

  var periodSortKey = function (p) { return p === 'THR' ? 2.5 : monthIndexOf_(p); };
  var list = Object.keys(clients).map(function (k) {
    var e = clients[k];
    e.periods.sort(function (a, b) { return periodSortKey(a) - periodSortKey(b); });
    return e;
  });

  list.sort(function (a, b) {
    var hasDueA = a.oldestDueDate ? 1 : 0, hasDueB = b.oldestDueDate ? 1 : 0;
    if (hasDueB !== hasDueA) return hasDueB - hasDueA;
    var lateA = a.oldestLateDays === null ? -1 : a.oldestLateDays;
    var lateB = b.oldestLateDays === null ? -1 : b.oldestLateDays;
    if (lateB !== lateA) return lateB - lateA;
    if (b.periods.length !== a.periods.length) return b.periods.length - a.periods.length;
    return b.totalOutstanding - a.totalOutstanding;
  });
  return list;
}

function paginate_(arr, page, pageSize) {
  page = Math.max(1, page || 1);
  pageSize = pageSize || CONFIG.PAGE_SIZE;
  var totalPages = Math.max(1, Math.ceil(arr.length / pageSize));
  page = Math.min(page, totalPages);
  var start = (page - 1) * pageSize;
  return { rows: arr.slice(start, start + pageSize), page: page, totalPages: totalPages, total: arr.length };
}

/* ============================== DASHBOARD ================================ */

function getDashboardData_(all) {
  var today = all.today;
  var currentYear = today.getFullYear();
  var currentMonthIdx = today.getMonth();
  var TG = all.tagihan, MU = all.mutasi, SA = all.saldo;

  var tahunIni = TG.filter(function (t) {
    return t.TAHUN === currentYear && (t.PERIODE_LABEL === 'THR' || monthIndexOf_(t.PERIODE_LABEL) <= currentMonthIdx);
  });

  var totalTagihan = sum_(tahunIni, function (t) { return t.NILAI_TAGIHAN; });
  var sisaPiutang = sum_(tahunIni, function (t) { return t.SISA_PIUTANG; });
  var sudahTerbayar = sum_(tahunIni, function (t) { return t.NOMINAL_TERBAYAR; });
  var countLunas = tahunIni.filter(function (t) { return t.STATUS === 'LUNAS'; }).length;
  var countBelumBayar = tahunIni.length - countLunas;
  var belumBayarNominal = sum_(tahunIni.filter(function (t) { return t.STATUS !== 'LUNAS'; }), function (t) { return t.NILAI_TAGIHAN; });

  var mutasiHariIni = sum_(MU.filter(function (m) { return m.TANGGAL && m.TANGGAL.getTime() === today.getTime(); }), function (m) { return m.NOMINAL; });
  var belumTeralokasi = MU.filter(function (m) { return !m.TERALOKASI; }).length;

  var awalBulan = new Date(today.getFullYear(), today.getMonth(), 1);
  var pemasukanBulanIni = sum_(MU.filter(function (m) { return m.TANGGAL && m.TANGGAL >= awalBulan && m.TANGGAL <= today; }), function (m) { return m.NOMINAL; });

  var OU = buildOldUnpaidClients_(TG, all.invoice, today);
  var clientTerlambat = OU.filter(function (c) { return c.oldestLateDays > 0; });

  // Trend bulanan Tagihan vs Terbayar (tahun berjalan, tidak termasuk THR)
  var trend = CONFIG.MONTHS.slice(0, currentMonthIdx + 1).map(function (bulan, idx) {
    var rows = TG.filter(function (t) { return t.TAHUN === currentYear && t.PERIODE_LABEL === bulan; });
    return {
      label: CONFIG.MONTHS_SHORT[idx],
      invoice: sum_(rows, function (t) { return t.NILAI_TAGIHAN; }),
      paid: sum_(rows, function (t) { return t.NOMINAL_TERBAYAR; }),
    };
  });
  var maxInvoice = Math.max(1, Math.max.apply(null, trend.map(function (t) { return t.invoice; }).concat([0])));
  trend.forEach(function (t) {
    t.invoicePct = Math.max(3, t.invoice / maxInvoice * 100);
    t.paidPct = Math.max(0, t.paid / maxInvoice * 100);
  });

  // Donut Sisa Piutang per Bank (top-5)
  var byBank = groupBy_(tahunIni, function (t) { return t.BANK || 'LAINNYA'; });
  var bankList = Object.keys(byBank).map(function (b) { return { label: b, value: sum_(byBank[b], function (t) { return t.SISA_PIUTANG; }) }; });
  bankList.sort(function (a, b) { return b.value - a.value; });
  var top5Bank = bankList.slice(0, 5);
  var donutColors = ['#4b22ff', '#10b5d5', '#ffc72c', '#f15b50', '#10c79a'];
  top5Bank.forEach(function (b, i) { b.color = donutColors[i]; });

  // Horizontal bar Sisa Piutang per PIC Admin (top-5)
  var byPic = groupBy_(tahunIni, function (t) { return t.PIC_ADMIN || 'BELUM DIISI'; });
  var picList = Object.keys(byPic).map(function (p) { return { label: p, value: sum_(byPic[p], function (t) { return t.SISA_PIUTANG; }) }; });
  picList.sort(function (a, b) { return b.value - a.value; });
  var top5Pic = picList.slice(0, 5);
  var maxPic = Math.max(1, top5Pic.length ? top5Pic[0].value : 0);
  top5Pic.forEach(function (p, i) { p.color = donutColors[i]; p.pct = p.value / maxPic * 100; });

  var statusPct = (countLunas + countBelumBayar) > 0 ? Math.round(countLunas / (countLunas + countBelumBayar) * 100) : null;

  return {
    meta: buildMeta_(all),
    saldo: buildSaldoRingkasan_(SA),
    kpi: {
      totalTagihanYtd: totalTagihan, totalTagihanYtdCount: tahunIni.length,
      sisaPiutang: sisaPiutang,
      sudahTerbayar: sudahTerbayar, sudahTerbayarCount: countLunas,
      belumBayarCount: countBelumBayar,
      belumBayarNominal: belumBayarNominal,
      mutasiHariIni: mutasiHariIni,
      belumTeralokasi: belumTeralokasi,
      totalPiutangClient: sisaPiutang,
      clientTerlambatCount: clientTerlambat.length,
      clientTerlambatTagihanCount: sum_(clientTerlambat, function (c) { return c.tagihanCount; }),
      pemasukanBulanIni: pemasukanBulanIni,
      totalSisaPiutangYtd: sisaPiutang,
    },
    trend: trend,
    donutBank: top5Bank,
    picBar: top5Pic,
    statusDonut: { pctLunas: statusPct, lunas: countLunas, belumBayar: countBelumBayar },
    top10: OU.slice(0, 10).map(formatOldUnpaidClientRow_),
    reminder: {
      terlambat90: clientTerlambat.filter(function (c) { return c.oldestLateDays > 90; }).length,
      belumAdaInvoice: OU.filter(function (c) { return !c.oldestDueDate; }).length,
      belumTeralokasi: belumTeralokasi,
    },
    bulanBerjalan: CONFIG.MONTHS[currentMonthIdx],
    tahun: currentYear,
  };
}

function formatOldUnpaidClientRow_(c) {
  return {
    client: c.client,
    pic: c.pic || '-',
    jumlahBulanBelumBayar: c.periods.length,
    daftarBulan: c.periods.join(' · '),
    jumlahTagihan: c.tagihanCount,
    terlambatHari: c.oldestLateDays,
    jatuhTempo: c.oldestDueDate ? formatTanggal_(c.oldestDueDate) : '-',
    totalSisaPiutang: c.totalOutstanding,
  };
}

function buildSaldoRingkasan_(saldo) {
  var total = sum_(saldo, function (s) { return s.SALDO; });
  var byCompany = groupBy_(saldo, function (s) { return s.PERUSAHAAN; });
  var perusahaan = Object.keys(byCompany).map(function (p) {
    return { nama: p, total: sum_(byCompany[p], function (s) { return s.SALDO; }), jumlahRekening: byCompany[p].length };
  });
  return {
    total: total,
    jumlahRekening: saldo.length,
    perusahaan: perusahaan,
    rekening: saldo.map(function (s) { return { rekening: s.REKENING, perusahaan: s.PERUSAHAAN, saldo: s.SALDO }; }),
  };
}

function buildMeta_(all) {
  return {
    tagihanRows: all.tagihan.length,
    mutasiRows: all.mutasi.length,
    invoiceRows: all.invoice.length,
    source: 'MASTER DATA',
    updatedAt: Utilities.formatDate(new Date(), 'Asia/Jakarta', "dd MMMM yyyy 'pukul' HH:mm"),
  };
}

/* ================================ MUTASI ================================= */

function filterMutasi_(all, f) {
  var today = all.today;
  var start = f.startDate ? toDate_(f.startDate) : new Date(today.getFullYear(), 0, 1);
  var end = f.endDate ? toDate_(f.endDate) : today;
  var search = (f.search || '').toLowerCase();

  var filtered = all.mutasi.filter(function (m) {
    if (m.TANGGAL) {
      if (m.TANGGAL < start || m.TANGGAL > end) return false;
    }
    if (f.bank && f.bank !== 'ALL' && m.SUMBER_AKUN !== f.bank) return false;
    if (f.company && f.company !== 'ALL' && m.PERUSAHAAN !== f.company) return false;
    if (f.status && f.status !== 'ALL') {
      var wantAllocated = f.status === 'ALLOCATED';
      if (wantAllocated !== m.TERALOKASI) return false;
    }
    if (search) {
      var hay = (m.URAIAN + ' ' + m.LOKASI + ' ' + m.SUMBER_AKUN).toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    return true;
  });
  filtered.sort(function (a, b) { return (b.TANGGAL ? b.TANGGAL.getTime() : 0) - (a.TANGGAL ? a.TANGGAL.getTime() : 0); });
  return filtered;
}

function getMutasiData_(all, f) {
  var today = all.today;
  var filtered = filterMutasi_(all, f);

  var awalBulan = new Date(today.getFullYear(), today.getMonth(), 1);
  var pemasukanHariIni = sum_(all.mutasi.filter(function (m) { return m.TANGGAL && m.TANGGAL.getTime() === today.getTime(); }), function (m) { return m.NOMINAL; });
  var pemasukanBulanIni = sum_(all.mutasi.filter(function (m) { return m.TANGGAL && m.TANGGAL >= awalBulan && m.TANGGAL <= today; }), function (m) { return m.NOMINAL; });

  var page = paginate_(filtered, f.page, CONFIG.PAGE_SIZE);
  return {
    meta: buildMeta_(all),
    kpi: {
      totalFilterData: sum_(filtered, function (m) { return m.NOMINAL; }),
      totalFilterCount: filtered.length,
      pemasukanHariIni: pemasukanHariIni,
      pemasukanBulanIni: pemasukanBulanIni,
      transaksiMenunggu: filtered.filter(function (m) { return !m.TERALOKASI; }).length,
    },
    filterOptions: {
      bank: uniqueSorted_(all.mutasi.map(function (m) { return m.SUMBER_AKUN; })),
      company: uniqueSorted_(all.mutasi.map(function (m) { return m.PERUSAHAAN; })),
    },
    table: {
      rows: page.rows.map(function (m, i) {
        return {
          no: (page.page - 1) * CONFIG.PAGE_SIZE + i + 1,
          perusahaan: m.PERUSAHAAN, sumberAkun: m.SUMBER_AKUN,
          tanggal: formatTanggal_(m.TANGGAL), uraian: m.URAIAN,
          nominal: m.NOMINAL, teralokasi: m.TERALOKASI, lokasi: m.LOKASI,
        };
      }),
      page: page.page, totalPages: page.totalPages, total: page.total,
    },
  };
}

function uniqueSorted_(arr) {
  var set = {};
  arr.forEach(function (v) { if (v) set[v] = true; });
  return Object.keys(set).sort();
}

/* ================================ TAGIHAN ================================= */

function buildKolomBulan_(f, currentMonthIdx) {
  var mode = f.periodMode || 'TAHUN_BERJALAN';
  var months = CONFIG.MONTHS;
  if (mode === 'SATU_BULAN' && f.bulan) return [f.bulan];
  if (mode === 'RENTANG_BULAN' && f.bulanAwal && f.bulanAkhir) {
    var i0 = monthIndexOf_(f.bulanAwal), i1 = monthIndexOf_(f.bulanAkhir);
    if (i0 > -1 && i1 > -1 && i1 >= i0) return months.slice(i0, i1 + 1);
  }
  if (mode === '3_BULAN') return months.slice(Math.max(0, currentMonthIdx - 2), currentMonthIdx + 1);
  if (mode === '6_BULAN') return months.slice(Math.max(0, currentMonthIdx - 5), currentMonthIdx + 1);
  // default: TAHUN_BERJALAN — sisipkan THR persis setelah Maret (index 3)
  var kolom = months.slice(0, currentMonthIdx + 1);
  kolom.splice(3, 0, 'THR');
  return kolom;
}

function buildTagihanRows_(all, f) {
  var today = all.today;
  var currentMonthIdx = today.getMonth();
  var year = toNumber_(f.tahun) || today.getFullYear();
  var kolomBulan = buildKolomBulan_(f, currentMonthIdx);
  var search = (f.search || '').toLowerCase();
  // Filter "Bulan" (baru): saat diisi, filter Status dicek KHUSUS pada baris
  // bulan itu (bukan baris manapun) — supaya bisa mencari mis. "lokasi mana
  // yang BELUM BAYAR di bulan Agustus" — tapi matrix tetap menampilkan SEMUA
  // kolom bulan seperti biasa untuk lokasi yang lolos.
  var bulanFilter = f.bulanFilter && f.bulanFilter !== 'ALL' ? f.bulanFilter : null;

  var yearRows = all.tagihan.filter(function (t) { return t.TAHUN === year; });
  var byLokasiAll = groupBy_(yearRows, function (t) { return t.NAMA_LOKASI; });

  var qualifies = {};
  Object.keys(byLokasiAll).forEach(function (lokasi) {
    var rowsForLokasi = byLokasiAll[lokasi];
    var first = rowsForLokasi[0];
    if (f.bank && f.bank !== 'ALL' && first.BANK !== f.bank) return;
    if (f.picAdmin && f.picAdmin !== 'ALL' && first.PIC_ADMIN !== f.picAdmin) return;
    if (search) {
      var hay = (lokasi + ' ' + first.PIC_ADMIN + ' ' + (first.KOMODITAS || '')).toLowerCase();
      if (hay.indexOf(search) === -1) return;
    }
    if (f.status && f.status !== 'ALL') {
      if (bulanFilter) {
        var rowBulan = rowsForLokasi.filter(function (t) { return t.PERIODE_LABEL === bulanFilter; })[0];
        if (!rowBulan || rowBulan.STATUS !== f.status) return;
      } else {
        var anyMatch = rowsForLokasi.some(function (t) {
          return kolomBulan.indexOf(t.PERIODE_LABEL) !== -1 && t.STATUS === f.status;
        });
        if (!anyMatch) return;
      }
    } else if (bulanFilter) {
      var hasMonth = rowsForLokasi.some(function (t) { return t.PERIODE_LABEL === bulanFilter; });
      if (!hasMonth) return;
    }
    qualifies[lokasi] = true;
  });

  var rows = Object.keys(byLokasiAll).filter(function (lokasi) { return qualifies[lokasi]; }).map(function (lokasi) {
    var rowsForLokasi = byLokasiAll[lokasi];
    var first = rowsForLokasi[0];
    var byPeriode = {};
    rowsForLokasi.forEach(function (t) { byPeriode[t.PERIODE_LABEL] = t; });
    var cells = kolomBulan.map(function (bulan) {
      var t = byPeriode[bulan];
      return t ? { status: t.STATUS, nilai: t.NILAI_TAGIHAN, sisa: t.SISA_PIUTANG } : null;
    });
    var totalPeriode = sum_(cells.filter(function (c) { return c; }), function (c) { return c.nilai; });
    return { lokasi: lokasi, bank: first.BANK, picAdmin: first.PIC_ADMIN, cells: cells, totalPeriode: totalPeriode };
  });
  rows.sort(function (a, b) { return a.lokasi.localeCompare(b.lokasi); });

  var relevant = yearRows.filter(function (t) {
    return qualifies[t.NAMA_LOKASI] && kolomBulan.indexOf(t.PERIODE_LABEL) !== -1 &&
      (!bulanFilter || t.PERIODE_LABEL === bulanFilter);
  });

  return { rows: rows, kolomBulan: kolomBulan, relevant: relevant, year: year };
}

function getTagihanData_(all, f) {
  var today = all.today;
  var currentMonthIdx = today.getMonth();
  var built = buildTagihanRows_(all, f);
  var rows = built.rows, kolomBulan = built.kolomBulan, relevant = built.relevant, year = built.year;
  var byLokasi = groupBy_(relevant, function (t) { return t.NAMA_LOKASI; });

  var page = paginate_(rows, f.page, CONFIG.PAGE_SIZE);

  var totalPiutangClient = sum_(relevant, function (t) { return t.SISA_PIUTANG; });
  var terbayar = sum_(relevant, function (t) { return t.NOMINAL_TERBAYAR; });
  var lokasiCount = Object.keys(byLokasi).length;

  var OU = buildOldUnpaidClients_(all.tagihan, all.invoice, today);
  var clientTerlambat = OU.filter(function (c) { return c.oldestLateDays > 0; });

  return {
    meta: buildMeta_(all),
    kpi: {
      totalPiutangClient: totalPiutangClient,
      clientTerlambatCount: clientTerlambat.length,
      clientTerlambatTagihanCount: sum_(clientTerlambat, function (c) { return c.tagihanCount; }),
      terbayar: terbayar,
      lokasiCount: lokasiCount,
    },
    kolomBulan: kolomBulan,
    filterOptions: {
      bank: uniqueSorted_(all.tagihan.map(function (t) { return t.BANK; })),
      picAdmin: uniqueSorted_(all.tagihan.map(function (t) { return t.PIC_ADMIN; })),
      tahun: uniqueSorted_(all.tagihan.map(function (t) { return String(t.TAHUN); })),
    },
    top10: OU.slice(0, 10).map(formatOldUnpaidClientRow_),
    top10Total: OU.length,
    table: { rows: page.rows, page: page.page, totalPages: page.totalPages, total: page.total },
    bulanBerjalan: CONFIG.MONTHS[currentMonthIdx],
    tahun: year,
  };
}

/* ================================ INVOICE ================================= */

function filterInvoice_(all, f) {
  var search = (f.search || '').toLowerCase();
  var filtered = all.invoice.filter(function (inv) {
    if (f.periode && f.periode !== 'ALL' && inv.PERIODE !== f.periode) return false;
    if (f.status && f.status !== 'ALL' && inv.STATUS !== f.status) return false;
    if (f.aging && f.aging !== 'ALL' && inv.AGING !== f.aging) return false;
    if (f.pic && f.pic !== 'ALL' && inv.PIC !== f.pic) return false;
    if (search) {
      var hay = (inv.CLIENT + ' ' + inv.PIC + ' ' + inv.STATUS_DATA).toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    return true;
  });
  filtered.sort(function (a, b) {
    var ta = a.TANGGAL_TERKIRIM ? a.TANGGAL_TERKIRIM.getTime() : -1;
    var tb = b.TANGGAL_TERKIRIM ? b.TANGGAL_TERKIRIM.getTime() : -1;
    return tb - ta;
  });
  return filtered;
}

function getInvoiceData_(all, f) {
  var filtered = filterInvoice_(all, f);
  var page = paginate_(filtered, f.page, CONFIG.PAGE_SIZE);

  return {
    meta: buildMeta_(all),
    kpi: {
      totalDataInvoice: filtered.length,
      invoiceTerkirim: filtered.filter(function (i) { return !!i.TANGGAL_TERKIRIM; }).length,
      lamaBelumDibayar: filtered.filter(function (i) { return i.STATUS === 'BELUM BAYAR' && i.TERLAMBAT > 30; }).length,
      perluValidasi: filtered.filter(function (i) { return !i.DATA_LENGKAP; }).length,
    },
    filterOptions: {
      periode: CONFIG.MONTHS.filter(function (m) { return all.invoice.some(function (i) { return i.PERIODE === m; }); }),
      pic: uniqueSorted_(all.invoice.map(function (i) { return i.PIC; })),
      aging: ['LUNAS', 'BELUM JATUH TEMPO', '1 - 30 HARI', '31 - 60 HARI', '61 - 90 HARI', '91 - 120 HARI', '> 120 HARI', 'TANGGAL BELUM ADA'],
    },
    table: {
      rows: page.rows.map(function (inv, i) {
        return {
          no: (page.page - 1) * CONFIG.PAGE_SIZE + i + 1,
          client: inv.CLIENT, periode: inv.PERIODE, pic: inv.PIC,
          tanggalTerkirim: inv.TANGGAL_TERKIRIM ? formatTanggal_(inv.TANGGAL_TERKIRIM) : '-',
          jatuhTempo: inv.JATUH_TEMPO ? formatTanggal_(inv.JATUH_TEMPO) : '-',
          nominal: inv.NOMINAL, status: inv.STATUS, sisaPiutang: inv.SISA_PIUTANG,
          umur: inv.UMUR, terlambat: inv.TERLAMBAT, aging: inv.AGING, statusData: inv.STATUS_DATA,
        };
      }),
      page: page.page, totalPages: page.totalPages, total: page.total,
    },
  };
}

/* =============================== PENGGAJIAN ================================ */

function filterSchedule_(schedule, f, today, awalBulan, akhirBulan, in7Hari) {
  var rentang = f.rentang || 'MONTH';
  var scopeStart = null, scopeEnd = null;
  var scopeSheet = null;
  if (rentang === 'TODAY') { scopeStart = today; scopeEnd = today; }
  else if (rentang === '7D') { scopeStart = today; scopeEnd = in7Hari; }
  else if (rentang === 'MONTH') { scopeSheet = CONFIG.MONTHS[today.getMonth()]; } // lihat catatan di getPenggajianData_
  else if (rentang === 'ASOF') {
    // "Sampai Tanggal Proyeksi" — jendela sama persis dengan yang dipakai
    // tabel KESIAPAN DANA (lihat asOfDate di getPenggajianData_): hari ini
    // s.d. tanggal yang dipilih user di "Proyeksi s.d. tanggal".
    var asOf = (f.progresTanggal && toDate_(f.progresTanggal)) || today;
    scopeStart = today; scopeEnd = asOf.getTime() >= today.getTime() ? asOf : today;
  }
  // rentang === 'ALL' -> tanpa batas tanggal/sheet

  var search = (f.search || '').toLowerCase();
  var filtered = schedule.filter(function (s) {
    if (scopeStart && (s.TANGGAL < scopeStart || s.TANGGAL > scopeEnd)) return false;
    if (scopeSheet && s.SHEET !== scopeSheet) return false;
    if (f.status && f.status !== 'ALL' && s.STATUS !== f.status) return false;
    if (f.bank && f.bank !== 'ALL' && s.BANK !== f.bank) return false;
    if (f.picRekap && f.picRekap !== 'ALL' && s.PIC_REKAP !== f.picRekap) return false;
    if (search) {
      var hay = (s.CLIENT + ' ' + s.PIC_REKAP + ' ' + s.BANK).toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    return true;
  });
  filtered.sort(function (a, b) { return a.TANGGAL.getTime() - b.TANGGAL.getTime(); });
  return filtered;
}

/**
 * RIWAYAT PENGGAJIAN PER CLIENT — bentuk matrix (NO, NAMA CLIENT, lalu 1
 * kolom per bulan berjalan), persis seperti sheet REKAP PENGGAJIAN 2026
 * aslinya (bukan daftar per client x 1 periode lagi).
 */
function buildRiwayatMatrix_(rekap, currentMonthIdx, searchHistoryRaw) {
  var searchHist = (searchHistoryRaw || '').toLowerCase();
  var months = CONFIG.MONTHS.slice(0, currentMonthIdx + 1);
  return rekap
    .filter(function (r) { return !searchHist || r.CLIENT.toLowerCase().indexOf(searchHist) !== -1; })
    .map(function (r) {
      var cells = months.map(function (m) { return r.MONTHS[m] || 0; });
      return { client: r.CLIENT, cells: cells, total: sum_(cells) };
    })
    .filter(function (r) { return r.total > 0; })
    .sort(function (a, b) { return b.total - a.total; });
}

function getPenggajianData_(all, rekap, payroll, f) {
  var today = all.today;
  var currentMonthIdx = today.getMonth();
  var schedule = payroll.schedule;

  var awalBulan = new Date(today.getFullYear(), today.getMonth(), 1);
  var akhirBulan = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  var in7Hari = new Date(today.getTime() + 7 * 86400000);

  // "Proyeksi s.d. tanggal" — 1 tanggal pilihan user yang menggerakkan 3 hal
  // sekaligus: tabel KESIAPAN DANA, kartu KEKURANGAN DANA, dan (kalau Rentang
  // Jadwal = "Sampai Tanggal Proyeksi") tabel JADWAL PENGGAJIAN. Kalau belum
  // dipilih / tanggalnya di masa lalu, dianggap = hari ini (jendela kosong,
  // bukan negatif).
  var progresTanggal = (f.progresTanggal && toDate_(f.progresTanggal)) || today;
  var asOfDate = progresTanggal.getTime() >= today.getTime() ? progresTanggal : today;

  // PENTING: "bulan ini" diambil berdasarkan SHEET TAB aktif (mis. tab
  // "SEPTEMBER"), BUKAN tanggal kalender baris itu — karena tanggal
  // pencairan di suatu tab bulan bisa jatuh di akhir bulan sebelumnya
  // (mis. dijadwalkan "20 Agu 2026" tapi tetap dicatat di tab SEPTEMBER
  // sebagai bagian siklus gajian September). Kalau difilter per tanggal
  // kalender murni, baris seperti ini akan hilang dari KPI "bulan ini"
  // padahal jelas-jelas ada di sheet aktif — ini akar masalah "Jadwal
  // Penggajian belum masuk" yang dilaporkan.
  var currentSheetName = CONFIG.MONTHS[currentMonthIdx];
  var bulanIni = schedule.filter(function (s) { return s.SHEET === currentSheetName; });
  var totalRencana = sum_(bulanIni, function (s) { return s.NOMINAL; });
  var sudahDibayar = sum_(bulanIni.filter(function (s) { return s.STATUS === 'SUDAH DIBAYAR'; }), function (s) { return s.NOMINAL; });
  var jadwalHariIni = schedule.filter(function (s) { return s.TANGGAL.getTime() === today.getTime(); });
  // KPI "KEBUTUHAN 7 HARI" — TETAP literal 7 hari kalender dari hari ini,
  // tidak ikut berubah oleh "Proyeksi s.d. tanggal" (itu kartu ringkas yang
  // labelnya memang "7 HARI"; yang dinamis ada di tabel KESIAPAN DANA di
  // bawah, lihat kesiapanDanaRows).
  var kebutuhan7Rows = schedule.filter(function (s) { return s.TANGGAL >= today && s.TANGGAL <= in7Hari && s.STATUS !== 'SUDAH DIBAYAR'; });

  // Kesiapan dana per rekening, DARI HARI INI SAMPAI TANGGAL PROYEKSI yang
  // dipilih user (lihat CONFIG.PAYROLL_FUNDING_ACCOUNTS & BANK_TO_REKENING)
  // — ini yang membuat tabel KESIAPAN DANA & kartu KEKURANGAN DANA otomatis
  // ikut berubah begitu "Proyeksi s.d. tanggal" diganti, supaya kelihatan
  // apakah dana cukup untuk seluruh jangka waktu itu, dan rekening mana yang
  // kurang.
  var kesiapanDanaRows = schedule.filter(function (s) { return s.TANGGAL >= today && s.TANGGAL <= asOfDate && s.STATUS !== 'SUDAH DIBAYAR'; });
  var saldoByRekening = {};
  all.saldo.forEach(function (s) { saldoByRekening[s.REKENING] = s.SALDO; });
  var kesiapanDana = CONFIG.PAYROLL_FUNDING_ACCOUNTS.map(function (rek) {
    var kebutuhan = sum_(kesiapanDanaRows.filter(function (s) { return s.REKENING_BAYAR === rek; }), function (s) { return s.NOMINAL; });
    var saldoRek = saldoByRekening[rek] || 0;
    var proyeksi = saldoRek - kebutuhan;
    return { rekening: rek, saldo: saldoRek, kebutuhan: kebutuhan, proyeksiSisa: proyeksi, kondisi: proyeksi >= 0 ? 'Cukup' : 'Kurang' };
  });
  var kekuranganDana = sum_(kesiapanDana, function (k) { return Math.max(0, -k.proyeksiSisa); });

  // Proyeksi kustom "PROGRES PEMBAYARAN BULAN INI" — total jadwal bulan
  // berjalan (sheet aktif) yang tanggalnya <= tanggal proyeksi.
  var sampaiTanggalRows = bulanIni.filter(function (s) { return s.TANGGAL.getTime() <= progresTanggal.getTime(); });
  var sampaiTanggalNominal = sum_(sampaiTanggalRows, function (s) { return s.NOMINAL; });

  // Tabel Jadwal Penggajian (filter terpisah dari KPI di atas)
  var filteredSchedule = filterSchedule_(schedule, f, today, awalBulan, akhirBulan, in7Hari);
  var schedulePage = paginate_(filteredSchedule, f.page, CONFIG.PAGE_SIZE);

  // Trend "Perkembangan Penggajian 2026"
  var trend = [];
  for (var m = 0; m <= currentMonthIdx; m++) {
    var bulan = CONFIG.MONTHS[m];
    var total = sum_(rekap, function (r) { return r.MONTHS[bulan] || 0; });
    trend.push({ label: CONFIG.MONTHS_SHORT[m], value: total });
  }
  var maxTrend = Math.max(1, Math.max.apply(null, trend.map(function (t) { return t.value; }).concat([0])));
  trend.forEach(function (t) { t.pct = t.value / maxTrend * 100; });

  // Riwayat Penggajian per Client — bentuk matrix (lihat buildRiwayatMatrix_)
  var riwayatMonths = CONFIG.MONTHS.slice(0, currentMonthIdx + 1);
  var riwayat = buildRiwayatMatrix_(rekap, currentMonthIdx, f.searchHistory);
  var riwayatPage = paginate_(riwayat, f.pageHistory, CONFIG.PAGE_SIZE);

  return {
    meta: buildMeta_(all),
    kpi: {
      totalRencanaBulanIni: totalRencana, totalRencanaBulanIniCount: bulanIni.length,
      sudahDibayarkan: sudahDibayar, sudahDibayarkanCount: bulanIni.filter(function (s) { return s.STATUS === 'SUDAH DIBAYAR'; }).length,
      menungguPembayaran: totalRencana - sudahDibayar,
      jadwalHariIniCount: jadwalHariIni.length, jadwalHariIniNominal: sum_(jadwalHariIni, function (s) { return s.NOMINAL; }),
      kebutuhan7Hari: sum_(kebutuhan7Rows, function (s) { return s.NOMINAL; }), kebutuhan7HariCount: kebutuhan7Rows.length,
      kekuranganDana: kekuranganDana,
    },
    kesiapanDana: kesiapanDana,
    asOf: {
      tanggal: Utilities.formatDate(asOfDate, 'Asia/Jakarta', 'yyyy-MM-dd'),
      tanggalLabel: formatTanggal_(asOfDate),
    },
    progres: {
      persen: totalRencana > 0 ? Math.round(sudahDibayar / totalRencana * 100) : 0, sudah: sudahDibayar, total: totalRencana,
      tanggal: Utilities.formatDate(progresTanggal, 'Asia/Jakarta', 'yyyy-MM-dd'),
      tanggalLabel: formatTanggal_(progresTanggal),
      sampaiTanggalNominal: sampaiTanggalNominal, sampaiTanggalCount: sampaiTanggalRows.length,
    },
    filterOptions: {
      bank: uniqueSorted_(schedule.map(function (s) { return s.BANK; })),
      picRekap: uniqueSorted_(schedule.map(function (s) { return s.PIC_REKAP; })),
    },
    jadwal: {
      rows: schedulePage.rows.map(function (s, i) {
        return {
          no: (schedulePage.page - 1) * CONFIG.PAGE_SIZE + i + 1,
          tanggal: formatTanggal_(s.TANGGAL), client: s.CLIENT, picRekap: s.PIC_REKAP,
          nominal: s.NOMINAL, bank: s.BANK, rekeningBayar: s.REKENING_BAYAR, maker: s.PIC_REKAP, status: s.STATUS,
        };
      }),
      page: schedulePage.page, totalPages: schedulePage.totalPages, total: schedulePage.total,
    },
    trend: trend,
    riwayat: {
      months: riwayatMonths,
      rows: riwayatPage.rows.map(function (r, i) {
        return {
          no: (riwayatPage.page - 1) * CONFIG.PAGE_SIZE + i + 1,
          client: r.client, cells: r.cells, total: r.total,
        };
      }),
      page: riwayatPage.page, totalPages: riwayatPage.totalPages, total: riwayatPage.total,
    },
    bulanBerjalan: CONFIG.MONTHS[currentMonthIdx],
  };
}
