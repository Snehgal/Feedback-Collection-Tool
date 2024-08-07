//Sheet Link: https://docs.google.com/spreadsheets/d/1Xup7W68UsiHm1jZDyR6q-bvZtboq-4OdbZc5pNwweys/edit?usp=sharing
function doGet(e) { 
  Logger.log(JSON.stringify(e));
  var result = 'Ok';
  if (e.parameter == 'undefined') {
    result = 'No Parameters';
  } else {
    var sheet_id = '1Xup7W68UsiHm1jZDyR6q-bvZtboq-4OdbZc5pNwweys'; // Spreadsheet ID
    var sheet = SpreadsheetApp.openById(sheet_id).getActiveSheet();
    var newRow = sheet.getLastRow() + 1; 
    var rowData = [];
    var Curr_Date = new Date();
    rowData[0] = Curr_Date; // Date in column A
    var Curr_Time = Utilities.formatDate(Curr_Date, "Asia/Kolkata", 'HH:mm:ss');
    rowData[1] = Curr_Time; // Time in column B
    for (var param in e.parameter) {
      Logger.log('In for loop, param=' + param);
      var value = stripQuotes(e.parameter[param]);
      Logger.log(param + ':' + e.parameter[param]);
      switch (param) {
        case 'ID':
          rowData[2] = value; // ID in column C
          result = 'ID Written on column C'; 
          break;
        case 'Value':
          rowData[3] = value; // Value in column D
          result += ' ,Value Written on column D'; 
          break; 
        default:
          result = "unsupported parameter";
      }
    }
    Logger.log(JSON.stringify(rowData));
    var newRange = sheet.getRange(newRow, 1, 1, rowData.length);
    newRange.setValues([rowData]);
  }
  return ContentService.createTextOutput(result);
}

function stripQuotes(value) {
  return value.replace(/^["']|['"]$/g, "");
}
