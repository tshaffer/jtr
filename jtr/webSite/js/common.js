var clientType;
var browserTypeIsSafari;

var baseURL;
var baseIP;

var _settingsRetrieved = false;
var _settings = {};
_settings.recordingBitRate = 10;
_settings.segmentRecordings = 0;

var _currentRecordings = {};

var currentActiveElementId = "#homePage";

var recordedPageIds = [];

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

function addMilliseconds(date, milliseconds) {
    return new Date(date.getTime() + milliseconds);
}

function switchToPage(newPage) {

    var newPageId = "#" + newPage;
    $(currentActiveElementId).css("display", "none");
    currentActiveElementId = newPageId;
    $(currentActiveElementId).removeAttr("style");
    if (currentActiveElementId == "#homePage") {
        setFooterVisibility(true, false)
        $("#trickModeKeys").css("display", "block");

        // ensure that the first element is highlighted and has focus
        // TODO - make this more general purpose?
        for (i = 0; i < mainMenuIds.length; i++) {
            for (j = 0; j < mainMenuIds[i].length; j++) {
                var elementId = "#" + mainMenuIds[i][j];

                if (i != 0 || j != 0) {
                    $(elementId).removeClass("btn-primary");
                    $(elementId).addClass("btn-secondary");
                }
                else {
                    $(elementId).removeClass("btn-secondary");
                    $(elementId).addClass("btn-primary");
                    $(elementId).focus();
                }
            }
        }

    } else {
        setFooterVisibility(true, true)
        $("#ipAddress").css("display", "none");
    }
}


function selectHomePage() {
    switchToPage("homePage");
}


function selectRecordedShows() {
    switchToPage("recordedShowsPage");
    getRecordedShows();
}


function getRecordedShows() {

    console.log("getRecordedShows() invoked");

    var aUrl = baseURL + "getRecordings";

    $.ajax({
        type: "GET",
        url: aUrl,
        dataType: "json",
        success: function (recordings) {

            // convert freespace from disk space to time (approximation) and display it
            var freeSpace = recordings.freespace;
            // 44934K per minute - sample 1 - long recording
            // 43408K per minute - sample 2 - 11 minute recording
            // use 44Mb per minute
            var freeSpaceInMegabytes = Number(freeSpace);
            var freeSpaceInMinutes = Math.floor(freeSpaceInMegabytes / 44);
            var freeSpaceInHours = Math.floor(freeSpaceInMinutes / 60);

            var freeSpace = "Free space: ";
            if (freeSpaceInHours > 0) {
                if (freeSpaceInHours > 1) {
                    freeSpace += freeSpaceInHours.toString() + " hours";
                }
                else {
                    freeSpace += "1 hour";
                }
                var partialFreeSpaceInMinutes = freeSpaceInMinutes % (freeSpaceInHours * 60);
                if (partialFreeSpaceInMinutes > 0) {
                    freeSpace += ", " + partialFreeSpaceInMinutes.toString() + " minutes";
                }
            }
            else {
                freeSpace += freeSpaceInMinutes.toString() + " minutes";
            }
            $("#recordedShowsRemainingSpace").text(freeSpace);

            // display show recordings
            var jtrRecordings = recordings.recordings;

            var toAppend = "";
            var recordingIds = [];

            $("#recordedShowsTableBody").empty();

            _currentRecordings = {};

            $.each(jtrRecordings, function (index, jtrRecording) {
                toAppend += addRecordedShowsLine(jtrRecording);
                recordingIds.push(jtrRecording.RecordingId);
                _currentRecordings[jtrRecording.RecordingId] = jtrRecording;
            });

            // is there a reason to do this all at the end instead of once for each row?
            $("#recordedShowsTableBody").append(toAppend);

            recordedPageIds.length = 0;

            // get last selected show from local storage - navigate to it. null if not defined
            var url = baseURL + "lastSelectedShow";

            $.get(url, {})
                .done(function (result) {
                    console.log("lastSelectedShow successfully sent");
                    var lastSelectedShowId = result;

                    var focusApplied = false;

                    // add button handlers for each recording - note, the handlers need to be added after the html has been added!!
                    $.each(jtrRecordings, function (index, recording) {
                        
                        var recordingId = recording.RecordingId;

                        // play a recording
                        var btnIdRecording = "#recording" + recordingId;
                        $(btnIdRecording).click({ recordingId: recordingId }, playSelectedShow);

                        // delete a recording
                        var btnIdDelete = "#delete" + recordingId;
                        $(btnIdDelete).click({ recordingId: recordingId }, deleteSelectedShow);

                        // play from beginning
                        var btnIdPlayFromBeginning = "#repeat" + recordingId;
                        $(btnIdPlayFromBeginning).click({ recordingId: recordingId }, playSelectedShowFromBeginning);

                        // stream a recording
                        var btnIdStream = "#stream" + recordingId;
                        $(btnIdStream).click({ recordingId: recordingId, hlsUrl: recording.HLSUrl }, streamSelectedShow);

                        // highlight the last selected show
                        if (recordingId == lastSelectedShowId) {
                            focusApplied = true;
                            $(btnIdRecording).focus();
                        }

                        var recordedPageRow = [];
                        recordedPageRow.push(btnIdRecording);
                        recordedPageRow.push(btnIdDelete);
                        recordedPageIds.push(recordedPageRow);

                    });

                    if (!focusApplied) {
                        $(recordedPageIds[0][0]).focus();
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("lastSelectedShow failure");
                })
                .always(function () {
                    //alert("lastSelectedShow finished");
                });
        }
    });
}


function addRecordedShowsLine(jtrRecording) {

    /*
        Play icon
        Delete icon
        Play From Beginning icon
        Stream icon
        Download icon
        Title
        Date
        Day of week ??
        Info icon
        Position
    */

    var weekday = new Array(7);
    weekday[0] = "Sun";
    weekday[1] = "Mon";
    weekday[2] = "Tue";
    weekday[3] = "Wed";
    weekday[4] = "Thu";
    weekday[5] = "Fri";
    weekday[6] = "Sat";

    var dt = jtrRecording.StartDateTime;
    var n = dt.indexOf(".");
    var formattedDayDate;
    if (n >= 0) {
        var dtCompatible = dt.substring(0, n);
        var date = new Date(dtCompatible);
        formattedDayDate = weekday[date.getDay()] + " " + (date.getMonth() + 1).toString() + "/" + date.getDate().toString();
    }
    else {
        formattedDayDate = "poop";
    }

    var lastViewedPositionInMinutes = Math.floor(jtrRecording.LastViewedPosition / 60);
    var position = lastViewedPositionInMinutes.toString() + " of " + jtrRecording.Duration.toString() + " minutes";

    var toAppend =
        "<tr>" +
        "<td><button type='button' class='btn btn-default recorded-shows-icon' id='recording" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-play' aria-hidden='true'></span></button></td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon' id='delete" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-remove' aria-hidden='true'></span></button></td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon' id='repeat" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-repeat' aria-hidden='true'></span></button></td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon streamIcon' id='stream" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-random' aria-hidden='true'></span></button></td>" +
        "<td><a class='downloadIcon' id='download' href='" + jtrRecording.path + "' download='" + jtrRecording.Title + "'><span class='glyphicon glyphicon-cloud-download' aria-hidden='true'></span></a></td>" +
        "<td>" + jtrRecording.Title + "</td>" +
        "<td>" + formattedDayDate + "</td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon' id='info" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-info-sign' aria-hidden='true'></span></button></td>" +
        "<td>" + position + "</td>";

    return toAppend;
}


function retrieveSettings(nextFunction) {

    // get settings from db
    var url = baseURL + "getSettings";
    $.get(url, {})
        .done(function (result) {
            consoleLog("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX retrieveSettings success ************************************");
            _settingsRetrieved = true;
            _settings.recordingBitRate = result.RecordingBitRate;
            _settings.segmentRecordings = result.SegmentRecordings;
            nextFunction();
        })
    .fail(function (jqXHR, textStatus, errorThrown) {
        debugger;
        console.log("getSettings failure");
    })
    .always(function () {
    });
}

function selectSettings() {

    switchToPage("settingsPage");

    consoleLog("selectSettings invoked");

    retrieveSettings(initializeSettingsUIElements);

    $(".recordingQuality").change(function () {
        _settings.recordingBitRate = $('input:radio[name=recordingQuality]:checked').val();
        updateSettings();
    });

    $("#segmentRecordingsCheckBox").change(function () {
        var segmentRecordings = $("#segmentRecordingsCheckBox").is(':checked');
        _settings.segmentRecordings = segmentRecordings ? 1 : 0;
        updateSettings();
    });
}


function initializeSettingsUIElements() {

    // initialize UI on settings page
    // TODO - don't hard code these values; read through html
    switch (_settings.recordingBitRate) {
        case 4:
            $("#recordingQualityLow").prop('checked', true);
            break;
        case 6:
            $("#recordingQualityMedium").prop('checked', true);
            break;
        case 10:
            $("#recordingQualityHigh").prop('checked', true);
            break;
    }

    switch (_settings.segmentRecordings) {
        case 0:
            $("#segmentRecordingsCheckBox").prop('checked', false);
            break;
        case 1:
            $("#segmentRecordingsCheckBox").prop('checked', true);
            break;
    }
}

function updateSettings() {
    var url = baseURL + "setSettings";
    var settingsData = { "recordingBitRate": _settings.recordingBitRate, "segmentRecordings": _settings.segmentRecordings };
    $.get(url, settingsData)
        .done(function (result) {
            console.log("setSettings success");
        })
    .fail(function (jqXHR, textStatus, errorThrown) {
        debugger;
        console.log("setSettings failure");
    })
    .always(function () {
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
    .always(function() {
        alert("getSchedulesDirectStatus complete");
    });
}

function getSchedulesDirectToken() {

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

        //getSchedulesDirectStatus(data.token)
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


function initializeChannelGuide() {

    //getSchedulesDirectToken();

    //var token = "43c1aa7031d4b92f198a5d1d8e660961"; // as of 6/21 at 12:10 PM
    var token = "3bfee352aced350fa2b56e384caf94e3"; // as of 6/22 at 4:32 PM
    var programIds = [];
    programIds.push("SH000212230000");
    programIds.push("SH021831230000");
    getSchedulesDirectPrograms(token, programIds)

    //getStations(token);

    // get status of schedules direct server
    //getSchedulesDirectStatus(token);

    // get the headends for 94022
    //getSchedulesDirectHeadends(token)
}


function selectChannelGuide() {

}


function selectToDoList() {
    switchToPage("toDoListPage");
    getToDoList();
}


function getToDoList() {
    var aUrl = baseURL + "toDoList";

    $.ajax({
        type: "GET",
        url: aUrl
    })
    .done(function (result) {
        var toAppend = "";

        for (i = 0; i < result.length; i++) {
            toAppend += "<tr id=\"toDoListRow" + i + " \"><td>date to record</td><td>title</td></tr>";
        }
        $("#recordedShowsTableBody").append(toAppend);
    });
}


function selectLiveVideo() {

}


function setElementVisibility(divId, show) {
    if (show) {
        $(divId).show();
    }
    else {
        $(divId).hide();
    }
}


function selectRecordNow() {
    switchToPage("recordNowPage");

    $("#rbRecordNowTuner").change(function () {
        setElementVisibility("#recordNowChannelDiv", true);
    });

    $("#rbRecordNowRoku").change(function () {
        setElementVisibility("#recordNowChannelDiv", false);
    });

    $("#rbRecordNowTivo").change(function () {
        setElementVisibility("#recordNowChannelDiv", false);
    });

    setDefaultDateTimeFields();
    $("#recordNowTitle").focus();
}


function selectManualRecord() {

    switchToPage("manualRecordPage");

    $("#rbManualRecordTuner").change(function () {
        setElementVisibility("#manualRecordChannelDiv", true);
    });

    $("#rbManualRecordRoku").change(function () {
        setElementVisibility("#manualRecordChannelDiv", false);
    });

    $("#rbManualRecordTivo").change(function () {
        setElementVisibility("#manualRecordChannelDiv", false);
    });

    setDefaultDateTimeFields();
    $("#manualRecordTitle").focus();
}


function twoDigitFormat(val) {
    val = '' + val;
    if (val.length === 1) {
        val = '0' + val.slice(-2);
    }
    return val;
}


function setDefaultDateTimeFields() {

    var date = new Date();

    var dateVal = date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate());
    $("#manualRecordDate").val(dateVal);

    var timeVal = twoDigitFormat(date.getHours()) + ":" + twoDigitFormat(date.getMinutes());
    $("#manualRecordTime").val(timeVal);
}

function getRecordingTitle(titleId, dateObj, inputSource, channel) {

    var title = $(titleId).val();
    if (!title) {
        title = 'MR ' + dateObj.getFullYear() + "-" + twoDigitFormat((dateObj.getMonth() + 1)) + "-" + twoDigitFormat(dateObj.getDate()) + " " + twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
        if (inputSource == "tuner") {
            title += " Channel " + channel;
        } else if (inputSource == "tivo") {
            title += " Tivo";
        } else {
            title += " Roku";
        }
    }

    return title;
}

function recordedShowDetails(showId) {
    // body...
    switchToPage("recordedShowDetailsPage");
    var showTitle = getShowTitle(showId);
    var showDescription = getShowDescription(showId);

    var toAppend = "<h3>" + showTitle + "</h3><br><br>"
        + "<p>" + showDescription + "</p><br><br>"
        + "<button>Play</button><br><br>"
        + "<button>Delete</button>";

    $("#recordedShowDetailsPage").append(toAppend);
}

function getShowTitle(showId) {
    // body...
}

function getShowDescription(showId) {
    // body...
}

function eraseUI() {
    $("#ipAddress").css("display", "none");
    $(currentActiveElementId).css("display", "none");
    $("#footerArea").css("display", "none");
}

function setFooterVisibility(trickModeKeysVisibility, homeButtonVisibility) {

    if (homeButtonVisibility) {
        $("#homeButton").html("<button class='btn btn-primary' onclick='selectHomePage()'>Home</button><br><br>");
    }
    else {
        $("#homeButton").text("");
    }

    if (trickModeKeysVisibility) {
        $("#trickModeKeys").removeClass("clearDisplay");
        $("#trickModeKeys").addClass("inlineDisplay");
    }
    else {
        $("#trickModeKeys").removeClass("inlineDisplay");
        $("#trickModeKeys").addClass("clearDisplay");
    }
}

$(document).ready(function () {

    var recordingDuration;
    var recordingTitle;

    console.log("JTR javascript .ready invoked");
    console.log("User Agent: " + navigator.userAgent);

    // get client from user agent
    var userAgent = navigator.userAgent;
    if (userAgent.indexOf("BrightSign") >= 0) {
        clientType = "BrightSign"
    }
    else if (userAgent.indexOf("iPad")) {
        clientType = "iPad"
    }

    if (userAgent.indexOf("Mac") >= 0 && userAgent.indexOf("Chrome") < 0) {
        browserTypeIsSafari = true;
    }
    else {
        browserTypeIsSafari = false;
    }

    if (clientType != "BrightSign") {
        baseURL = document.baseURI.replace("?", "");
        baseIP = document.baseURI.substr(0, document.baseURI.lastIndexOf(":"));

        console.log("baseURL from document.baseURI is: " + baseURL + ", baseIP is: " + baseIP);
    }
    else {
        initializeBrightSign();
    }
});