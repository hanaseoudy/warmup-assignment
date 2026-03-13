const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    // TODO: Implement this function
        let startSeconds = convertTo24Hour(startTime);
    let endSeconds = convertTo24Hour(endTime);

    let duration = endSeconds - startSeconds;

    if (duration < 0) {
        duration += 24 * 3600;
    }

    return secondsToTime(duration);
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // TODO: Implement this function
         let start = convertTo24Hour(startTime);
    let end = convertTo24Hour(endTime);

    let deliveryStart = 8 * 3600;   // 8 elsb7
    let deliveryEnd = 22 * 3600;    // 10 blil

    let idle = 0;

    if (start < deliveryStart) {
        idle += deliveryStart - start;
    }

    if (end > deliveryEnd) {
        idle += end - deliveryEnd;
    }

    return secondsToTime(idle);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    // TODO: Implement this function
    let shiftSeconds = timeToSeconds(shiftDuration);
    let idleSeconds = timeToSeconds(idleTime);
    let active = shiftSeconds - idleSeconds;
    return secondsToTime(active);

}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function
     let activeSeconds = timeToSeconds(activeTime);
    let parts = date.split("-");
    let day = parseInt(parts[2]);
    let quota;
    if (day >= 10 && day <= 30) {
        quota = 6 * 3600;              // Eid quota
    } else {
        quota = 8 * 3600 + 24 * 60;    // normal quota
    }
    return activeSeconds >= quota;

}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
       let data = fs.readFileSync(textFile, "utf8").trim().split("\n");

    let header = data[0];
    let rows = data.slice(1);

    for (let row of rows) {
        let cols = row.split(",");
        if (cols[0] === shiftObj.driverID && cols[2] === shiftObj.date) {
            return {};
        }
    }

    
    let shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration, idleTime);
    let met = metQuota(shiftObj.date, activeTime);
    let hasBonus = false;


    let newRow = [
        shiftObj.driverID,
        shiftObj.driverName,
        shiftObj.date,
        shiftObj.startTime,
        shiftObj.endTime,
        shiftDuration,
        idleTime,
        activeTime,
        met,
        hasBonus
    ].join(",");

    rows.push(newRow);

    let newContent = [header, ...rows].join("\n");
    fs.writeFileSync(textFile, newContent);
    return {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: met,
        hasBonus: hasBonus
    };
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
      let data = fs.readFileSync(textFile, "utf8").trim().split("\n");
    let header = data[0];
    let rows = data.slice(1);
    for (let i = 0; i < rows.length; i++) {
        let cols = rows[i].split(",");
        if (cols[0] === driverID && cols[2] === date) {
            cols[9] = String(newValue);   // update HasBonus column
            rows[i] = cols.join(",");
            break;
        }
    }

    let newContent = [header, ...rows].join("\n");
    fs.writeFileSync(textFile, newContent);

}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
     let data = fs.readFileSync(textFile, "utf8").trim().split("\n");

    let rows = data.slice(1); // skip header

    let driverFound = false;
    let count = 0;

    let targetMonth = parseInt(month);

    for (let row of rows) {

        let cols = row.split(",");

        let id = cols[0];
        let date = cols[2];
        let hasBonus = cols[9];

        let rowMonth = parseInt(date.split("-")[1]);

        if (id === driverID) {
            driverFound = true;

            if (rowMonth === targetMonth && hasBonus === "true") {
                count++;
            }
        }
    }

    if (!driverFound) return -1;

    return count;

}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    let data = fs.readFileSync(textFile, "utf8").trim().split("\n");

    let rows = data.slice(1); // skip header

    let totalSeconds = 0;

    for (let row of rows) {

        let cols = row.split(",");

        let id = cols[0];
        let date = cols[2];
        let activeTime = cols[7];

        let rowMonth = parseInt(date.split("-")[1]);

        if (id === driverID && rowMonth === month) {

            totalSeconds += timeToSeconds(activeTime);

        }
    }

    return secondsToTime(totalSeconds);

}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
    let dayOff = getDriverDayOff(rateFile,driverID);

    let data = fs.readFileSync(textFile,"utf8").trim().split("\n");

    let rows = data.slice(1);

    let totalSeconds = 0;

    for(let row of rows){

        let cols = row.split(",");

        let id = cols[0];
        let date = cols[2];

        let rowMonth = parseInt(date.split("-")[1]);

        if(id !== driverID || rowMonth !== month) continue;

        let dayName = new Date(date).toLocaleDateString("en-US",{weekday:"long"});

        if(dayName === dayOff) continue;

        totalSeconds += getDailyQuota(date);
    }

    totalSeconds -= bonusCount * 2 * 3600;

    return secondsToTime(totalSeconds);

}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
     let driver = getDriverInfo(rateFile, driverID);
    let basePay = driver.basePay;
    let tier = driver.tier;
    let actualSec = timeToSeconds(actualHours);
    let requiredSec = timeToSeconds(requiredHours);
    if (actualSec >= requiredSec) return basePay;
    let missingSec = requiredSec - actualSec;
    let missingHours = Math.floor(missingSec / 3600);
    let allowed = getAllowedMissingHours(tier);
    let billableMissing = Math.max(0, missingHours - allowed);
    let deductionRate = getDeductionRate(basePay);
    let salaryDeduction = billableMissing * deductionRate;
    return basePay - salaryDeduction;
}


function timeToSeconds(time) {
    let parts = time.split(":");
    let h = parseInt(parts[0]);
    let m = parseInt(parts[1]);
    let s = parseInt(parts[2]);

    return h * 3600 + m * 60 + s;
}


function timeToSeconds(time) {
    let parts = time.split(":");
    let h = parseInt(parts[0]);
    let m = parseInt(parts[1]);
    let s = parseInt(parts[2]);

    return h * 3600 + m * 60 + s;
   
}

function secondsToTime(sec) {
    let h = Math.floor(sec / 3600);
    sec %= 3600;
    let m = Math.floor(sec / 60);
    let s = sec % 60;

    return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function convertTo24Hour(time) {
    let [clock, period] = time.split(" ");
    let [h,m,s] = clock.split(":").map(Number);

    if(period === "pm" && h !== 12) h += 12;
    if(period === "am" && h === 12) h = 0;

    return h*3600 + m*60 + s;
}

function getDriverDayOff(rateFile, driverID) {

    let data = fs.readFileSync(rateFile,"utf8").trim().split("\n");

    for (let row of data) {
        let cols = row.split(",");
        if(cols[0] === driverID) {
            return cols[1];
        }

    }

    return null;
}

function isEid(date) {

    let day = parseInt(date.split("-")[2]);

    return day >= 10 && day <= 30;

}

function getDailyQuota(date) {

    if(isEid(date)) {
        return 6 * 3600;
    }

    return 8 * 3600 + 24 * 60;
}
function getDriverInfo(rateFile, driverID) {

    let data = fs.readFileSync(rateFile,"utf8").trim().split("\n");

    for (let row of data) {
        let cols = row.split(",");

        if (cols[0] === driverID) {
            return {
                basePay: parseInt(cols[2]),
                tier: parseInt(cols[3])
            };
        }
    }

    return null;
}

function getAllowedMissingHours(tier) {

    if (tier === 1) return 50;
    if (tier === 2) return 20;
    if (tier === 3) return 10;
    return 3;

}

function getDeductionRate(basePay) {

    return Math.floor(basePay / 185);

}


module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};



