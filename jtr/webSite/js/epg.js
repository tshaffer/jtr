var schedulesDirectToken;

var numDaysEpgData = 2;

var stations = [];
var scheduleValidityByStationDate = {};
var scheduleModificationData;

function retrieveEpgData() {

    // get station schedules for single day and populate scheduleValidityByStationDate
    console.log("retrieveEpgData() invoked");

    getStations(retrieveEpgDataStep2);
}


function retrieveEpgDataStep2() {

    var stationIds = [];
    var dates = [];

    // build initial scheduleValidityByStationDate. That is, add keys, leave values empty
    // one entry for each station, date combination
    $.each(stations, function (index, station) {

        var startDate = new Date();

        for (i = 0; i < numDaysEpgData; i++) {
            var date = new Date(startDate);
            date.setDate(date.getDate() + i);
            var dateVal = date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate());

            var stationDate = station.StationId + "-" + dateVal;

            var scheduleValidity = {};
            scheduleValidity.stationId = station.StationId;
            scheduleValidity.scheduleDate = dateVal;
            scheduleValidity.modifiedDate = "";
            scheduleValidity.md5 = "";
            scheduleValidity.downloadedNeeded = true;
            scheduleValidityByStationDate[stationDate] = scheduleValidity;

            if (stationIds.length == 0) {
                dates.push(dateVal);
            }
        }

        stationIds.push(station.StationId);
    });

    //console.log(JSON.stringify(scheduleValidityByStationDate, null, 4));

    // retrieve last fetched station schedules from db
    var url = baseURL + "getStationSchedulesForSingleDay";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
    })
    .done(function (result) {
        console.log("successfully return from getStationSchedulesForSingleDay");
        var jtrStationSchedulesForSingleDay = result;
        //console.log(JSON.stringify(jtrStationSchedulesForSingleDay, null, 4));

        //console.log(JSON.stringify(jtrStationSchedulesForSingleDay.stationschedulesforsingleday[0], null, 4));

        // fill in scheduleValidityByStationDate with appropriate data from db
// change return value so that I dont have to use the nonsense on the next line.
        $.each(jtrStationSchedulesForSingleDay.stationschedulesforsingleday, function (index, jtrStationScheduleForSingleDay) {
            var stationDate = jtrStationScheduleForSingleDay.StationId + "-" + jtrStationScheduleForSingleDay.ScheduleDate;
            if (stationDate in scheduleValidityByStationDate) {
                var scheduleValidity = scheduleValidityByStationDate[stationDate];
                scheduleValidity.modifiedDate = jtrStationScheduleForSingleDay.ModifiedDate;
                scheduleValidity.md5 = jtrStationScheduleForSingleDay.MD5;
                scheduleValidity.downloadedNeeded = false;
            }
        });

        //console.log(JSON.stringify(scheduleValidityByStationDate, null, 4));

        // fetch data from Schedules Direct that will indicate the last changed date / information about stations / dates.
        getSchedulesDirectScheduleModificationData(stationIds, dates, retrieveEpgDataStep3);
    })
    .fail(function () {
        alert("getStationSchedulesForSingleDay failure");
    })
    .always(function () {
        alert("getStationSchedulesForSingleDay complete");
    });

}


function retrieveEpgDataStep3() {

    //console.log(JSON.stringify(scheduleValidityByStationDate, null, 4));

    // for each station/date combination, if it already has data, see if it is current
    $.each(scheduleValidityByStationDate, function (index, scheduleValidity) {
        if (!scheduleValidity.downloadedNeeded) {
            // find matching record in scheduleModificationData
            var stationId = scheduleValidity.stationId;
            var scheduleDate = scheduleValidity.scheduleDate;
            if (stationId in scheduleModificationData) {
                var scheduleModifiedDataForStation = scheduleModificationData[stationId];
                //console.log(JSON.stringify(scheduleModifiedDataForStation, null, 4));
                if (scheduleDate in scheduleModifiedDataForStation) {
                    var scheduleModifiedDataForStationDate = scheduleModifiedDataForStation[scheduleDate];
                    //console.log(JSON.stringify(scheduleModifiedDataForStationDate, null, 4));
                    if (scheduleModifiedDataForStationDate.md5 != scheduleValidity.md5) {
                        scheduleValidity.downloadedNeeded = true;
                    }
                    // TODO - else, also check modified date??
                }
            }
        }
    });

    // at this point, the system knows which station/date records need updates from the service - scheduleValidityByStationDate
    var stationIdDatesNeedingUpdates = [];
    var lastStationId = "";
    var stationDates = {};

    $.each(scheduleValidityByStationDate, function (index, scheduleValidity) {
        if (scheduleValidity.downloadedNeeded) {
            var stationId = scheduleValidity.stationId;
            var scheduleDate = scheduleValidity.scheduleDate;

            if (stationId != lastStationId) {

                // capture data before moving to new stationId
                if (lastStationId != "") {
                    stationIdDatesNeedingUpdates.push(stationDates);
                }
                lastStationId = stationId;

                stationDates = {};
                stationDates.stationID = stationId;
                stationDates.dates = [];
            }
            stationDates.dates.push(scheduleValidity.scheduleDate);
        }
    });

    // TODO - check to see if stationIdDatesNeedingUpdates.length > 0 and/or if stationDates.length > 0

    // capture prior data if needed
    if (lastStationId != "") {
        stationIdDatesNeedingUpdates.push(stationDates);
    }

    //console.log(JSON.stringify(stationIdDatesNeedingUpdates, null, 4));

    getSchedulesDirectProgramSchedules(stationIdDatesNeedingUpdates, null);
}


function getSchedulesDirectToken(nextFunction) {

    // cors tutorial
    //http://www.html5rocks.com/en/tutorials/cors/

    $(document).ajaxError(function () {
        console.log("Triggered ajaxError handler.");
    });
    postData = {}

    postData.username = "jtrDev";
    postData.password = "3bacdc30b9598fb498dfefc00b2f2ad52150eef4";
    var postDataStr = JSON.stringify(postData);

    var url = "https://json.schedulesdirect.org/20141201/token";

    $.post(url, postDataStr, function (data) {
        console.log("returned from selectChannelGuide post");
        console.log(JSON.stringify(data, null, 4));
        //console.log(retVal);
        //console.log(data);
        //{"code":0,"message":"OK","serverID":"20141201.web.1","token":"5801004984e3ccb3f9289232b745f797"}
        console.log("code: " + data.code);
        console.log("message: " + data.message);
        console.log("serverID: " + data.serverID);
        console.log("token: " + data.token);

        schedulesDirectToken = data.token;

        if (nextFunction != null) {
            nextFunction();
        }
    });
}


function getStations(nextFunction) {

    console.log("getStations() invoked");

    var url = baseURL + "getStations";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
    })
    .done(function (result) {
        console.log("successful return from getStations");
        stations = result.stations;
        
        if (nextFunction != null) {
            nextFunction();
        }
    })
    .fail(function () {
        alert("getStations failure");
    })
    .always(function () {
        alert("getStations complete");
    });
}


function getSchedulesDirectScheduleModificationData(stationIds, dates, nextFunction) {

    console.log("getSchedulesDirectScheduleModificationData");

    // same as in getSchedulesDirectProgramSchedules - make common?
    var postData = [];

    $.each(stationIds, function (index, stationId) {

        var stationData = {};

        stationData.stationID = stationId;

        stationData.date = [];
        for (dateIndex in dates) {
            stationData.date.push(dates[dateIndex]);
        }

        postData.push(stationData);
    });
    var postDataStr = JSON.stringify(postData);

    //console.log(postDataStr);

    var url = "https://json.schedulesdirect.org/20141201/schedules/md5";

    console.log("getSchedulesDirectScheduleModificationData - invoke post");

    var jqxhr = $.ajax({
        type: "POST",
        url: url,
        data: postDataStr,
        dataType: "json",
        headers: { "token": schedulesDirectToken }
    })
    .done(function (result) {
        console.log("done in getSchedulesDirectScheduleModificationData");
        console.log(JSON.stringify(result, null, 4));

        scheduleModificationData = result;

        if (nextFunction != null) {
            nextFunction();
        }
    })
    .fail(function () {
        alert("getSchedulesDirectScheduleModificationData failure");
    })
    .always(function () {
        alert("getSchedulesDirectScheduleModificationData complete");
    });
}


function getSchedulesDirectProgramSchedules(stationIdDatesNeedingUpdates, nextFunction) {

    console.log("getSchedulesDirectProgramSchedules");

    var postDataStr = JSON.stringify(stationIdDatesNeedingUpdates);

    console.log(postDataStr);
    return;

    var url = "https://json.schedulesdirect.org/20141201/schedules";

    var jqxhr = $.ajax({
        type: "POST",
        url: url,
        data: postDataStr,
        dataType: "json",
        headers: { "token": schedulesDirectToken }
    })
    .done(function (result) {
        console.log("successful return from json.schedulesdirect.org/20141201/schedules");
        //console.log(JSON.stringify(result, null, 4));

        var jtrStationSchedulesForSingleDay = [];

        // to do - convert to $.each
        for (index in result) {
            var jtrStationScheduleForSingleDay = {};
            var stationScheduleForSingleDay = result[index];
            jtrStationScheduleForSingleDay.stationId = stationScheduleForSingleDay.stationID;
            jtrStationScheduleForSingleDay.scheduleDate = stationScheduleForSingleDay.metadata.startDate;
            jtrStationScheduleForSingleDay.modifiedDate = stationScheduleForSingleDay.metadata.modified;
            jtrStationScheduleForSingleDay.md5 = stationScheduleForSingleDay.metadata.md5;
            jtrStationSchedulesForSingleDay.push(jtrStationScheduleForSingleDay);

            // to do - convert to $.each
            var jtrProgramsForStations = [];
            for (programIndex in stationScheduleForSingleDay.programs) {
                var program = stationScheduleForSingleDay.programs[programIndex];
                var jtrProgramForStation = {};
                jtrProgramForStation.stationId = jtrStationScheduleForSingleDay.stationId;
                jtrProgramForStation.scheduleDate = jtrStationScheduleForSingleDay.scheduleDate;
                jtrProgramForStation.programId = program.programID;
                jtrProgramForStation.airDateTime = program.airDateTime;
                jtrProgramForStation.duration = program.duration;
                jtrProgramForStation.md5 = program.md5;
                jtrProgramsForStations.push(jtrProgramForStation);
            }
        }

        var jtrStationSchedulesForSingleDayStr = JSON.stringify(jtrStationSchedulesForSingleDay);
        bsMessage.PostBSMessage({ command: "addDBStationSchedulesForSingleDay", "schedules": jtrStationSchedulesForSingleDayStr });

        var jtrProgramsForStationsStr = JSON.stringify(jtrProgramsForStations);
        bsMessage.PostBSMessage({ command: "addDBProgramsForStations", "programs": jtrProgramsForStationsStr });

        console.log("done for now");

        if (nextFunction != null) {
            nextFunction();
        }
    })
    .fail(function () {
        alert("getSchedulesDirectProgramSchedules failure");
    })
    .always(function () {
        alert("getSchedulesDirectProgramSchedules complete");
    });

}


function getSchedulesDirectPrograms(token, programIds) {

    console.log("getSchedulesDirectPrograms");

    var postDataStr = JSON.stringify(programIds);

    var url = "https://json.schedulesdirect.org/20141201/programs";

    var jqxhr = $.ajax({
        type: "POST",
        url: url,
        data: postDataStr,
        dataType: "json",
        headers: { "token": schedulesDirectToken }
    })
    .done(function (result) {
        console.log("done in getSchedulesDirectPrograms");
        console.log(JSON.stringify(result, null, 4));

        var jtrPrograms = [];
        $.each(result, function (index, program) {

            var jtrProgram = {};
            jtrProgram.programId = program.programID;
            jtrProgram.title = program.titles[0].title120;
            jtrProgram.description = "";
            if (("descriptions" in program) && ("description100" in program.descriptions)) {
                jtrProgram.description = program.descriptions.description100[0].description;
            }
            jtrPrograms.push(jtrProgram);
        });
        console.log(JSON.stringify(jtrPrograms, null, 4));

        var jtrProgramsStr = JSON.stringify(jtrPrograms);
        bsMessage.PostBSMessage({ command: "addDBPrograms", "programs": jtrProgramsStr });
    })
    .fail(function () {
        alert("getSchedulesDirectPrograms failure");
    })
    .always(function () {
        alert("getSchedulesDirectPrograms complete");
    });
}


function getSchedulesDirectStation(stations, atscMajor, atscMinor) {

    for (var key in stations) {
        if (stations.hasOwnProperty(key)) {
            var station = stations[key];
            //console.log(JSON.stringify(station, null, 4));
            if (station.atscMajor == atscMajor && station.atscMinor == atscMinor) {
                return station;
            }
        }
    }
}


function getSchedulesDirectLineupMappings(token, lineup) {

    var url = "https://json.schedulesdirect.org/20141201/lineups/" + lineup;

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        headers: { "token": token }
    })
    .done(function (result) {
        //console.log("done in getSchedulesDirectLineupMappings");
        //console.log(JSON.stringify(result, null, 4));

        var stations = {};
        for (mapIndex in result.map) {
            var stationMap = result.map[mapIndex];
            var station = {};
            station.stationId = stationMap.stationID;
            station.atscMajor = stationMap.atscMajor;
            station.atscMinor = stationMap.atscMinor;
            stations[station.stationId] = station;
        }
        for (stationIndex in result.stations) {
            var stationDescription = result.stations[stationIndex];
            //console.log(JSON.stringify(stationDescription, null, 4));
            var matchingStation = stations[stationDescription.stationID];
            matchingStation.name = stationDescription.name;
            matchingStation.callsign = stationDescription.callsign;
            //console.log(JSON.stringify(matchingStation, null, 4));
        }
        //for (var key in stations) {
        //    if (stations.hasOwnProperty(key))
        //        console.log(JSON.stringify(stations[key], null, 4));
        //}

        // get jtr stations
        //var channel2 = getSchedulesDirectStation(stations, 2, 1);
        //console.log(JSON.stringify(channel2, null, 4));
        //var channel4 = getSchedulesDirectStation(stations, 4, 1);
        //console.log(JSON.stringify(channel4, null, 4));
        //var channel5 = getSchedulesDirectStation(stations, 5, 1);
        //console.log(JSON.stringify(channel5, null, 4));
        //var channel7 = getSchedulesDirectStation(stations, 7, 1);
        //console.log(JSON.stringify(channel7, null, 4));
        //var channel91 = getSchedulesDirectStation(stations, 9, 1);
        //console.log(JSON.stringify(channel91, null, 4));
        //var channel92 = getSchedulesDirectStation(stations, 9, 2);
        //console.log(JSON.stringify(channel92, null, 4));
        //var channel93 = getSchedulesDirectStation(stations, 9, 3);
        //console.log(JSON.stringify(channel93, null, 4));
        //var channel11 = getSchedulesDirectStation(stations, 11, 1);
        //console.log(JSON.stringify(channel11, null, 4));
        //var channel36 = getSchedulesDirectStation(stations, 36, 1);
        //console.log(JSON.stringify(channel36, null, 4));
        //var channel44 = getSchedulesDirectStation(stations, 44, 1);
        //console.log(JSON.stringify(channel44, null, 4));

        var stations = [];
        //stations.push(ktvu);
        stations.push(channel2);

        var dates = [];
        dates.push("2015-06-21");
        dates.push("2015-06-22");

        // getSchedulesDirectProgramSchedules(token, stations, dates);
    })
    .fail(function () {
        alert("getSchedulesDirectLineupMappings failure");
    })
    .always(function () {
        alert("getSchedulesDirectLineupMappings complete");
    });
}


function getSchedulesDirectUsersLineups(token, desiredLineup) {
    var url = "https://json.schedulesdirect.org/20141201/lineups";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        headers: { "token": token }
    })
    .done(function (result) {
        //console.log("done in getSchedulesDirectUsersLineups");
        //console.log(JSON.stringify(result, null, 4));
        var lineup = parseScheduledDirectHeadends(result)
        //console.log("parseScheduledDirectHeadends returned lineup " + lineup);

        // ensure that desired lineup is subscribed to - if not add the new lineup (TBD)
        var lineupResults = result;
        for (lineUpIndex in lineupResults.lineups) {
            var lineup = lineupResults.lineups[lineUpIndex];
            if (lineup.lineup == desiredLineup) {
                console.log("found desired lineup");
                getSchedulesDirectLineupMappings(token, desiredLineup);
            }
        }
    })
    .fail(function () {
        alert("getSchedulesDirectUsersLineups failure");
    })
    .always(function () {
        alert("getSchedulesDirectUsersLineups complete");
    });
}


function parseScheduledDirectHeadends(headends) {

    for (var headendIndex in headends) {
        var headend = headends[headendIndex];
        if (headend.headend == "94022" && headend.transport == "Antenna" && headend.location == "94022") {
            var lineup = headend.lineups[0].lineup;
            return lineup;
        }
    }

    return "";
}


function getSchedulesDirectHeadends(token) {
    var url = "https://json.schedulesdirect.org/20141201/headends?country=USA&postalcode=94022";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        headers: { "token": token }
    })
    .done(function (result) {
        //console.log("done in getSchedulesDirectHeadends");
        //console.log(JSON.stringify(result, null, 4));
        var lineup = parseScheduledDirectHeadends(result)
        console.log("parseScheduledDirectHeadends returned lineup " + lineup);
        getSchedulesDirectUsersLineups(token, lineup);
    })
    .fail(function () {
        alert("getSchedulesDirectHeadends failure");
    })
    .always(function () {
        alert("getSchedulesDirectHeadends complete");
    });
}


function getSchedulesDirectStatus(token) {

    console.log("getSchedulesDirectStatus");

    var url = "https://json.schedulesdirect.org/20141201/status";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        headers: { "token": token }
    })
    .done(function (result) {
        console.log("done in getSchedulesDirectStatus");
        console.log(JSON.stringify(result, null, 4));
        var systemStatus = result.systemStatus[0].status;
        console.log("status = " + systemStatus);
    })
    .fail(function () {
        alert("getSchedulesDirectStatus failure");
    })
    .always(function () {
        alert("getSchedulesDirectStatus complete");
    });
}
