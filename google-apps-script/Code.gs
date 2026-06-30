function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Users Sheet
  let sheetUsers = ss.getSheetByName("Users");
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet("Users");
    sheetUsers.appendRow(["Email", "Password"]);
    sheetUsers.getRange("A1:B1").setFontWeight("bold");
    sheetUsers.setFrozenRows(1);
    sheetUsers.appendRow(["admin@gmail.com", "admin123"]);
  }
  
  // Create Keuangan Sheet
  let sheetKeuangan = ss.getSheetByName("Keuangan");
  if (!sheetKeuangan) {
    sheetKeuangan = ss.insertSheet("Keuangan");
    sheetKeuangan.appendRow(["ID", "Tanggal", "Waktu", "Jenis", "Kategori", "Metode", "Nominal"]);
    sheetKeuangan.getRange("A1:G1").setFontWeight("bold");
    sheetKeuangan.setFrozenRows(1);
  }

  // Create Hutang Sheet
  let sheetHutang = ss.getSheetByName("Hutang");
  if (!sheetHutang) {
    sheetHutang = ss.insertSheet("Hutang");
    sheetHutang.appendRow(["ID", "Tanggal", "Waktu", "Nama Penghutang", "Keterangan", "Metode", "Hutang Awal", "Sisa Hutang", "Status"]);
    sheetHutang.getRange("A1:I1").setFontWeight("bold");
    sheetHutang.setFrozenRows(1);
  }
}

// Handle preflight CORS request if needed (GAS handles it somewhat implicitly, but good to have)
function doOptions(e) {
  return respondJson({ status: "ok" });
}

function doPost(e) {
  try {
    setupSpreadsheet();
    
    if (!e || !e.postData || !e.postData.contents) {
      return respondJson({ status: "error", message: "No data provided" });
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "login") {
      return checkLogin(data.payload);
    } else if (action === "addKeuangan") {
      return addKeuangan(data.payload);
    } else if (action === "updateKeuangan") {
      return updateKeuangan(data.payload);
    } else if (action === "deleteKeuangan") {
      return deleteKeuangan(data.payload.id);
    } else if (action === "deleteMultipleKeuangan") {
      return deleteMultipleKeuangan(data.payload.ids);
    } else if (action === "addHutang") {
      return addHutang(data.payload);
    } else if (action === "updateHutang") {
      return updateHutang(data.payload);
    } else if (action === "deleteHutang") {
      return deleteHutang(data.payload.id);
    } else if (action === "deleteMultipleHutang") {
      return deleteMultipleHutang(data.payload.ids);
    } else if (action === "payHutang") {
      return payHutang(data.payload);
    }

    return respondJson({ status: "error", message: "Invalid action" });

  } catch (error) {
    return respondJson({ status: "error", message: error.toString() });
  }
}

function doGet(e) {
  try {
    setupSpreadsheet();
    
    const action = e.parameter.action;
    
    if (action === "getKeuangan") {
      return respondJson({ status: "success", data: getKeuangan() });
    } else if (action === "getHutang") {
      return respondJson({ status: "success", data: getHutang() });
    } else if (action === "getAll") {
      return respondJson({ 
        status: "success", 
        keuangan: getKeuangan(),
        hutang: getHutang()
      });
    }

    return respondJson({ status: "error", message: "Invalid action or action not specified" });
  } catch (error) {
    return respondJson({ status: "error", message: error.toString() });
  }
}

function respondJson(responseObj) {
  return ContentService.createTextOutput(JSON.stringify(responseObj))
    .setMimeType(ContentService.MimeType.JSON);
}

// === AUTH FUNCTIONS ===

function checkLogin(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  if (!sheet) return respondJson({ status: "error", message: "Sistem belum siap (Sheet Users tidak ditemukan)." });
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.email && String(data[i][1]) === String(payload.password)) {
      return respondJson({ status: "success", message: "Login berhasil" });
    }
  }
  return respondJson({ status: "error", message: "Email atau password salah" });
}

// === KEUANGAN FUNCTIONS ===

function getKeuangan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Keuangan");
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    result.push({
      id: row[0],
      tanggal: row[1],
      waktu: row[2],
      jenis: row[3],
      kategori: row[4],
      metode: row[5],
      nominal: row[6]
    });
  }
  return result;
}

function addKeuangan(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Keuangan");
  
  const id = "K-" + new Date().getTime();
  
  sheet.appendRow([
    id,
    payload.tanggal,
    payload.waktu,
    payload.jenis,
    payload.kategori,
    payload.metode,
    payload.nominal
  ]);
  
  return respondJson({ status: "success", message: "Data Keuangan ditambahkan", id: id });
}

function updateKeuangan(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Keuangan");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.id) {
      sheet.getRange(i + 1, 2).setValue(payload.tanggal);
      sheet.getRange(i + 1, 3).setValue(payload.waktu);
      sheet.getRange(i + 1, 4).setValue(payload.jenis);
      sheet.getRange(i + 1, 5).setValue(payload.kategori);
      sheet.getRange(i + 1, 6).setValue(payload.metode);
      sheet.getRange(i + 1, 7).setValue(payload.nominal);
      return respondJson({ status: "success", message: "Data Keuangan diperbarui" });
    }
  }
  return respondJson({ status: "error", message: "Data not found" });
}

function deleteKeuangan(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Keuangan");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return respondJson({ status: "success", message: "Data Keuangan dihapus" });
    }
  }
  return respondJson({ status: "error", message: "Data not found" });
}

function deleteMultipleKeuangan(ids) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Keuangan");
  const data = sheet.getDataRange().getValues();
  
  // Set untuk pencarian cepat
  const idSet = new Set(ids);
  let deletedCount = 0;
  
  // Looping dari bawah ke atas agar indeks baris tidak bergeser
  for (let i = data.length - 1; i >= 1; i--) {
    if (idSet.has(data[i][0])) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  
  return respondJson({ status: "success", message: deletedCount + " Data Keuangan dihapus" });
}

// === HUTANG FUNCTIONS ===

function getHutang() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Hutang");
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    result.push({
      id: row[0],
      tanggal: row[1],
      waktu: row[2],
      nama: row[3],
      keterangan: row[4],
      metode: row[5],
      hutangAwal: row[6],
      sisaHutang: row[7],
      status: row[8]
    });
  }
  return result;
}

function addHutang(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Hutang");
  
  const id = "H-" + new Date().getTime();
  
  sheet.appendRow([
    id,
    payload.tanggal,
    payload.waktu,
    payload.nama,
    payload.keterangan,
    payload.metode,
    payload.hutangAwal,
    payload.hutangAwal,
    "Belum Lunas"
  ]);
  
  return respondJson({ status: "success", message: "Data Hutang ditambahkan", id: id });
}

function updateHutang(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Hutang");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.id) {
      sheet.getRange(i + 1, 2).setValue(payload.tanggal);
      sheet.getRange(i + 1, 3).setValue(payload.waktu);
      sheet.getRange(i + 1, 4).setValue(payload.nama);
      sheet.getRange(i + 1, 5).setValue(payload.keterangan);
      sheet.getRange(i + 1, 6).setValue(payload.metode);
      
      const oldHutangAwal = data[i][6];
      const oldSisaHutang = data[i][7];
      const paidAmount = oldHutangAwal - oldSisaHutang;
      
      const newHutangAwal = parseFloat(payload.hutangAwal);
      let newSisaHutang = newHutangAwal - paidAmount;
      if (newSisaHutang < 0) newSisaHutang = 0;
      
      let status = "Belum Lunas";
      if (newSisaHutang === 0) status = "Lunas";

      sheet.getRange(i + 1, 7).setValue(newHutangAwal);
      sheet.getRange(i + 1, 8).setValue(newSisaHutang);
      sheet.getRange(i + 1, 9).setValue(status);
      
      return respondJson({ status: "success", message: "Data Hutang diperbarui" });
    }
  }
  return respondJson({ status: "error", message: "Data not found" });
}

function deleteHutang(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Hutang");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return respondJson({ status: "success", message: "Data Hutang dihapus" });
    }
  }
  return respondJson({ status: "error", message: "Data not found" });
}

function deleteMultipleHutang(ids) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Hutang");
  const data = sheet.getDataRange().getValues();
  
  const idSet = new Set(ids);
  let deletedCount = 0;
  
  for (let i = data.length - 1; i >= 1; i--) {
    if (idSet.has(data[i][0])) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  
  return respondJson({ status: "success", message: deletedCount + " Data Hutang dihapus" });
}

function payHutang(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Hutang");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.id) {
      const currentSisa = parseFloat(data[i][7]);
      const payAmount = parseFloat(payload.payAmount);
      
      let newSisa = currentSisa - payAmount;
      if (newSisa < 0) newSisa = 0;
      
      let status = "Belum Lunas";
      if (newSisa === 0) status = "Lunas";
      
      sheet.getRange(i + 1, 8).setValue(newSisa);
      sheet.getRange(i + 1, 9).setValue(status);
      
      // Auto add to Keuangan as Pemasukan
      const sheetKeuangan = ss.getSheetByName("Keuangan");
      const kId = "K-" + new Date().getTime();
      sheetKeuangan.appendRow([
        kId,
        payload.tanggal,
        payload.waktu,
        "Pemasukan",
        "Pembayaran Hutang: " + data[i][3],
        payload.metode,
        payAmount
      ]);

      return respondJson({ status: "success", message: "Pembayaran berhasil dan tercatat di Keuangan" });
    }
  }
  return respondJson({ status: "error", message: "Data not found" });
}
