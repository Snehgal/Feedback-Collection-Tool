function processLabData() {
  const adminSpreadsheetId = '1x5Tmf7cbiEbI-JR-X2lVLihm2EIf0GtRlRCtKc-TgUQ'; // Replace with your Admin spreadsheet ID
  const esp8266SpreadsheetId = '1Xup7W68UsiHm1jZDyR6q-bvZtboq-4OdbZc5pNwweys'; // Replace with your ESP8266 spreadsheet ID
  const numberOfRecords=16; //total number of default records
  

  const adminScheduleSheet = SpreadsheetApp.openById(adminSpreadsheetId).getSheetByName('schedule');
  const adminDataSheet = SpreadsheetApp.openById(adminSpreadsheetId).getSheetByName('Data');

  const esp8266CurrentInstanceSheet = SpreadsheetApp.openById(esp8266SpreadsheetId).getSheetByName('current_instance');
  const esp8266TempSheet = SpreadsheetApp.openById(esp8266SpreadsheetId).getSheetByName('temp');
    
  // Get data range excluding header row
  const scheduleData = adminScheduleSheet.getRange(2, 1, adminScheduleSheet.getLastRow() - 1, adminScheduleSheet.getLastColumn()).getValues();
  const currentInstanceData = esp8266CurrentInstanceSheet.getRange(2, 1, esp8266CurrentInstanceSheet.getLastRow() - 1, esp8266CurrentInstanceSheet.getLastColumn()).getValues();
  
  const now = new Date();

  // Find rows where feedback is true and current time is within the start and end time
  scheduleData.forEach((row, index) => {
    const roomNumber = row[0];
    const labNumber = row[1];
    const labDate = new Date(row[2]);
    let FstartTime = new Date(labDate);
    let FendTime=new Date(labDate);
    let LstartTime = new Date(labDate);
    let LendTime=new Date(labDate);
    const feedback = row[5];

    // Assuming row[7] are time values in HH:mm:ss format (24-hour) for start of feedback
    const FstartTimeString = row[7].toString();
    let HH=Number(FstartTimeString.slice(16,18));
    let MM=Number(FstartTimeString.slice(19,21));
    let SS=Number(FstartTimeString.slice(22,24));
    FstartTime.setHours(HH,MM, SS);

    // Assuming row[8] are time values in HH:mm:ss format (24-hour) for end of feedback
    const FendTimeString = row[8].toString();
    HH=Number(FendTimeString.slice(16,18));
    MM=Number(FendTimeString.slice(19,21));
    SS=Number(FendTimeString.slice(22,24));
    FendTime.setHours(HH,MM, SS);

    // Assuming row[3] are time values in HH:mm:ss format (24-hour) for start of lab
    const LstartTimeString = row[3].toString();
    let HH=Number(LstartTimeString.slice(16,18));
    let MM=Number(LstartTimeString.slice(19,21));
    let SS=Number(LstartTimeString.slice(22,24));
    LstartTime.setHours(HH,MM, SS);

    // Assuming row[4] are time values in HH:mm:ss format (24-hour) for end of feedback
    const LendTimeString = row[4].toString();
    HH=Number(LendTimeString.slice(16,18));
    MM=Number(LendTimeString.slice(19,21));
    SS=Number(LendTimeString.slice(22,24));
    LendTime.setHours(HH,MM, SS);

    if (feedback === true && now>=FstartTime) {
      Logger.log(`Valid row found: Room ${roomNumber}, Lab ${labNumber}, Date ${labDate}`);

      // Append the data from current_instance to Data sheet in Admin
      currentInstanceData.slice(1).forEach(dataRow => { // Skip header row
        const selectedData = [dataRow[2], dataRow[4]]; // Copy only the 2nd and 4th columns
        const newRow = [labDate, roomNumber, labNumber].concat(selectedData); // Include room number, lab number, date, and selected data
        adminDataSheet.appendRow(newRow);
      });

      // Clear the temp sheet except the header row
      const tempRange = esp8266TempSheet.getRange(2, 1, esp8266TempSheet.getLastRow() - 1, esp8266TempSheet.getLastColumn());
      tempRange.clearContent();
      
    }
      
    const defaultValues=[];
    for(let i=1;i<=numberOfRecords;i++){
      defaultValues[i-1]=['01/01/2000', '0:00:00', (1000+i).toString(), '0'];
    }

    const tempRange = esp8266TempSheet.getRange(2, 1, defaultValues.length, defaultValues[0].length);
    tempRange.setValues(defaultValues);
  });
}

function createTimeDrivenTriggers() {
  // Trigger every minute to check for lab end times
  ScriptApp.newTrigger('processLabData')
    .timeBased()
    .everyMinutes(1)
    .create();
}
