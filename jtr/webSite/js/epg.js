function retrieveEpgData(token) {

    scheduleValidityByStationDate = {};

    // get station schedules for single day and populate scheduleValidityByStationDate
    console.log("retrieveEpgData() invoked");

    var url = baseURL + "getStationSchedulesForSingleDay";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
    })
    .done(function (result) {
        console.log("successfully return from getStationSchedulesForSingleDay");
        //var jtrStationSchedulesForSingleDay = result.stationSchedulesForSingleDay;
        var jtrStationSchedulesForSingleDay = result;
        console.log(JSON.stringify(jtrStationSchedulesForSingleDay, null, 4));

        //var stations = [];
        //$.each(jtrStations, function (index, jtrStation) {
        //    stations.push(jtrStation);
        //});
    })
    .fail(function () {
        alert("getStationSchedulesForSingleDay failure");
    })
    .always(function () {
        alert("getStationSchedulesForSingleDay complete");
    });
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

        if (nextFunction != null) {
            nextFunction(data.token);
        }
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
        headers: { "token": token }
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

function getSchedulesDirectScheduleModificationData(token, stations, dates) {

    console.log("getSchedulesDirectScheduleModificationData");

    // same as in getSchedulesDirectProgramSchedules - make common?
    var postData = [];

    $.each(stations, function (index, station) {

        var stationData = {};

        stationData.stationID = station.StationId;

        stationData.date = [];
        for (dateIndex in dates) {
            stationData.date.push(dates[dateIndex]);
        }

        postData.push(stationData);
    });
    var postDataStr = JSON.stringify(postData);

    var url = "https://json.schedulesdirect.org/20141201/schedules/md5";

    var jqxhr = $.ajax({
        type: "POST",
        url: url,
        data: postDataStr,
        dataType: "json",
        headers: { "token": token }
    })
    .done(function (result) {
        console.log("done in getSchedulesDirectScheduleModificationData");
        console.log(JSON.stringify(result, null, 4));
    })
    .fail(function () {
        alert("getSchedulesDirectScheduleModificationData failure");
    })
    .always(function () {
        alert("getSchedulesDirectScheduleModificationData complete");
    });
}


function getSchedulesDirectProgramSchedules(token, stations, dates) {

    console.log("getSchedulesDirectProgramSchedules");

    //console.log(JSON.stringify(stations[0], null, 4));

    var postData = [];

    $.each(stations, function (index, station) {

        var stationData = {};

        stationData.stationID = station.StationId;

        stationData.date = [];
        for (dateIndex in dates) {
            stationData.date.push(dates[dateIndex]);
        }

        postData.push(stationData);
    });

    //console.log(JSON.stringify(postData, null, 4));

    var postDataStr = JSON.stringify(postData);

    var url = "https://json.schedulesdirect.org/20141201/schedules";

    var jqxhr = $.ajax({
        type: "POST",
        url: url,
        data: postDataStr,
        dataType: "json",
        headers: { "token": token }
    })
    .done(function (result) {
        //console.log("done in getSchedulesDirectProgramSchedules");
        //console.log(JSON.stringify(result, null, 4));

        var jtrStationSchedulesForSingleDay = [];

        for (index in result) {
            var jtrStationScheduleForSingleDay = {};
            var stationScheduleForSingleDay = result[index];
            jtrStationScheduleForSingleDay.stationId = stationScheduleForSingleDay.stationID;
            jtrStationScheduleForSingleDay.scheduleDate = stationScheduleForSingleDay.metadata.startDate;
            jtrStationScheduleForSingleDay.modifiedDate = stationScheduleForSingleDay.metadata.modified;
            jtrStationScheduleForSingleDay.md5 = stationScheduleForSingleDay.metadata.md5;
            jtrStationSchedulesForSingleDay.push(jtrStationScheduleForSingleDay);

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
    })
    .fail(function () {
        alert("getSchedulesDirectProgramSchedules failure");
    })
    .always(function () {
        alert("getSchedulesDirectProgramSchedules complete");
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

function getStations(token) {

    console.log("getStations() invoked");

    var url = baseURL + "getStations";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
    })
    .done(function (result) {
        console.log("done in getStations");
        var jtrStations = result.stations;
        //console.log(JSON.stringify(result, null, 4));

        var stations = [];
        $.each(jtrStations, function (index, jtrStation) {
            stations.push(jtrStation);
        });

        //console.log(JSON.stringify(stations, null, 4));

        var myStations = [];
        myStations.push(stations[0]);

        var dates = [];

        var today = new Date();
        var monthStr = (today.getMonth() + 1).toString();
        if (monthStr.length == 1) {
            monthStr = "0" + monthStr;
        }
        var todayStr = today.getFullYear().toString() + "-" + monthStr + "-" + today.getDate().toString();
        dates.push(todayStr);

        getSchedulesDirectProgramSchedules(token, myStations, dates);
        //getSchedulesDirectScheduleModificationData(token, myStations, dates);
    })
    .fail(function () {
        alert("getStations failure");
    })
    .always(function () {
        alert("getStations complete");
    });

}


