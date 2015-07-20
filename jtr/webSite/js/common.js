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

var epgProgramSchedule = null;
var epgProgramScheduleStartDateTime;

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


function refreshChannelGuide() {

    // get current date/time - display channel guide data starting at current date/time
    var currentDate = new Date();

    // display channel guide one station at a time, from current time for the duration of the channel guide
    getStations(buildChannelGuideWithStations);
}


function buildChannelGuideWithStations() {

    // JTRTODO set constants - some temporary
    var hoursToDisplayPerLine = 6;
    var minutesToDisplayPerLine = hoursToDisplayPerLine * 60;

    // start date/time for channel guide display is current time, rounded down to nearest 30 minutes
    var currentDate = new Date();
    var startMinute = (parseInt(currentDate.getMinutes() / 30) * 30) % 60;
    var startHour = currentDate.getHours();
    var displayChannelGuideStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour, startMinute, 0, 0);

    // get start date/time of data structure containing channel guide data
    var channelGuideDataStructureStartDate = epgProgramScheduleStartDateTime;

    // display day/date
    var weekday = new Array(7);
    weekday[0] = "Sun";
    weekday[1] = "Mon";
    weekday[2] = "Tue";
    weekday[3] = "Wed";
    weekday[4] = "Thu";
    weekday[5] = "Fri";
    weekday[6] = "Sat";
    $("#cgDayDate").text(weekday[displayChannelGuideStartDate.getDay()]  + " " + (displayChannelGuideStartDate.getMonth() + 1).toString() + "/" + displayChannelGuideStartDate.getDate().toString());

    // display timeline
    var toAppend = "";
    $("#cgTimeLine").empty();
    var timeLineCurrentValue = displayChannelGuideStartDate;
    for (i = 0; i < (hoursToDisplayPerLine * 2) - 1; i++) {

        var hoursLbl = "";
        var amPm = " am";
        var hours = timeLineCurrentValue.getHours();
        if (hours == 0) {
            hoursLbl = "12";
        }
        else if (hours < 12) {
            hoursLbl = hours.toString();
        }
        else if (hours == 12) {
            hoursLbl = "12";
            amPm = "pm";
        }
        else {
            hoursLbl = (hours - 12).toString();
            amPm = "pm";
        }

        var minutesLbl = twoDigitFormat(timeLineCurrentValue.getMinutes().toString());

        var timeLabel = hoursLbl + ":" + minutesLbl + amPm;
        toAppend += "<span class='thirtyMinuteTime'>" + timeLabel + "</span>";

        timeLineCurrentValue = new Date(timeLineCurrentValue.getTime() + 30 * 60000);
    }
    $("#cgTimeLine").append(toAppend);

    // time delta between start of channel guide display and start of channel guide data
    var timeDiffInMsec = displayChannelGuideStartDate - channelGuideDataStructureStartDate;
    var timeDiffInSeconds = timeDiffInMsec / 1000;
    var timeDiffInMinutes = timeDiffInSeconds / 60;

    // index into data structure containing show to display based on time offset into channel guide data
    var currentChannelGuideOffsetIndex = parseInt(timeDiffInMinutes / 30);

    firstRow = true;

    $.each(stations, function (stationIndex, station) {

        // channel guide data for this station
        var programStationData = epgProgramSchedule[station.StationId]

        // iterate through initialShowsByTimeSlot to get programs to display
        var programSlotIndices = programStationData.initialShowsByTimeSlot;
        var programList = programStationData.programList;

        var indexIntoProgramList = programSlotIndices[currentChannelGuideOffsetIndex];

        var minutesAlreadyDisplayed = 0;

        var cgProgramLineName = "#cgStation" + stationIndex.toString() + "Data";
        $(cgProgramLineName).empty();

        // first show to display for this station
        showToDisplay = programList[indexIntoProgramList];

        // calculate the time delta between the time of the channel guide display start and the start of the first show to display
        timeDiffInMsec = displayChannelGuideStartDate - new Date(showToDisplay.date);
        var timeDiffInSeconds = timeDiffInMsec / 1000;
        var timeDiffInMinutes = timeDiffInSeconds / 60;
        // subtract this from the first show

        var toAppend = "";
        while (minutesAlreadyDisplayed < minutesToDisplayPerLine) {

            var durationInMinutes = Number(showToDisplay.duration);
            if (toAppend == "") {
                durationInMinutes -= timeDiffInMinutes;
            }

            var cssClass = "";
            var widthSpec = "";
            if (durationInMinutes == 30) {
                cssClass = "'thirtyMinuteButton'";
            }
            else if (durationInMinutes == 60) {
                cssClass = "'sixtyMinuteButton'";
            }
            else {
                cssClass = "'variableButton'";
                var width = (durationInMinutes / 60) * 240;
                widthSpec = " style='width:" + width.toString() + "px'";
            }
            var id = "show-" + station.StationId + "-" + indexIntoProgramList.toString();
            toAppend +=
                "<button id='" + id + "' class=" + cssClass + widthSpec + ">" + showToDisplay.title + "</button>";

            minutesAlreadyDisplayed += durationInMinutes;
            indexIntoProgramList++;
            showToDisplay = programList[indexIntoProgramList];
        }
        $(cgProgramLineName).append(toAppend);

        // setup handlers on children - use for testing on Chrome
        var buttonsInCGLine = $(cgProgramLineName).children();
        $.each(buttonsInCGLine, function (buttonIndex, buttonInCGLine) {
            if (firstRow && buttonIndex == 0) {
                $(buttonInCGLine).focus();
                firstRow = false;
                lastActiveButton = buttonInCGLine;
            }
        });

    });
}


// get the index of the button in a row / div
function getActiveButtonIndex(activeButton, buttonsInRow) {

    var positionOfActiveElement = $(activeButton).position();

    var indexOfActiveButton = -1;
    $.each(buttonsInRow, function (buttonIndex, buttonInRow) {
        var buttonPosition = $(buttonInRow).position();
        if (buttonPosition.left == positionOfActiveElement.left) {
            indexOfActiveButton = buttonIndex;
            return false;
        }
    });
    return indexOfActiveButton;
}

function getActiveRowIndex(activeRow) {

    var rowPosition = $(activeRow).position();

    var cgStationDiv = activeRow.parentElement;
    var stationDivs = $(cgStationDiv).children();
    var indexOfActiveRow = -1;
    $.each(stationDivs, function (stationDivIndex, stationDiv) {
        if (stationDivIndex > 0) {          // div 0 is the timeline; skip it
            var stationDivPosition = $(stationDiv).position();
            if (stationDivPosition.top == rowPosition.top) {
                indexOfActiveRow = stationDivIndex;
                return false;
            }
        }
    });
    return indexOfActiveRow - 1;    // 0 is the first station
}

function updateActiveButton(activeButton, newActiveButton) {

    $(activeButton).removeClass("btn-primary");
    $(activeButton).addClass("btn-secondary");

    $(newActiveButton).removeClass("btn-secondary");
    $(newActiveButton).addClass("btn-primary");

    $(newActiveButton).focus();

    lastActiveButton = newActiveButton;
}

function navigateChannelGuide(direction) {

    var activeButton = lastActiveButton;
    //var currentElementId = currentElement.id;

    // get div for current active button
    var parentDivOfActiveElement = activeButton.parentElement;          // current row of the channel guide
    var buttonsInRow = $(parentDivOfActiveElement).children();          // programs in that row
    var positionOfActiveElement = $(activeButton).position();           // returns members 'top' and 'left'
    var stationDivsElement = parentDivOfActiveElement.parentElement;    // element representing all rows (why not just use #myDIV)
    var stationDivs = $(stationDivsElement).children();                 // stations in the channel guide (the rows)

    var indexOfActiveButton = getActiveButtonIndex(activeButton, buttonsInRow);
    if (indexOfActiveButton >= 0) {
        if (direction == "right") {
            // JTRTODO - check for limit on right side; either get more data or stop scrolling at the end
            var indexOfNewButton = indexOfActiveButton + 1;
            if (indexOfNewButton < $(buttonsInRow).length) {
                var newActiveButton = $(buttonsInRow)[indexOfNewButton];
                updateActiveButton(activeButton, newActiveButton);
            }
        }
        else if (direction == "left") {
            if (indexOfActiveButton > 0) {
                var indexOfNewButton = indexOfActiveButton - 1;
                if (indexOfNewButton < $(buttonsInRow).length) {
                    var newActiveButton = $(buttonsInRow)[indexOfNewButton];
                    updateActiveButton(activeButton, newActiveButton);
                }
            }
        }
        else if (direction == "down" || direction == "up") {
            var xPosition = positionOfActiveElement.left;
            var activeRowIndex = getActiveRowIndex(parentDivOfActiveElement);
            if ((activeRowIndex < stations.length - 1 && direction == "down")  || (activeRowIndex > 0 && direction == "up")) {

                var newRowIndex;
                if (direction == "down") {
                    newRowIndex = activeRowIndex + 1;
                }
                else {
                    newRowIndex = activeRowIndex - 1;
                }

                // find program whose x value is closest to the x value of the last program
                var newActiveRow = stationDivs[newRowIndex + 1];
                var programsInStation = $(newActiveRow).children();

                var minDistance = 1920;
                $.each(programsInStation, function (programInStationIndex, programInStation) {
                    var programPosition = $(programInStation).position();
                    var xProgramPosition = programPosition.left;
                    var distanceFromPreviousProgram = Math.abs(xProgramPosition - xPosition);
                    if (distanceFromPreviousProgram < minDistance) {
                        minDistance = distanceFromPreviousProgram;
                        newActiveProgram = programInStation;
                    }
                });
                updateActiveButton(activeButton, newActiveProgram);
            }
        }
    }
}

function buildChannelGuideData() {

    if (epgProgramSchedule == null) {
        epgProgramSchedule = {};

        epgProgramScheduleStartDateTime = new Date();
        epgProgramScheduleStartDateTime.setFullYear(2100, 0, 0);

        var startDate = new Date();
        var year = startDate.getFullYear().toString();
        var month = (startDate.getMonth() + 1).toString();
        var dayInMonth = startDate.getDate().toString();
        var epgStartDate = year + "-" + twoDigitFormat(month) + "-" + twoDigitFormat(dayInMonth);

        // get epg from db
        var url = baseURL + "getEpg";
        var epgData = { "startDate": epgStartDate };
        $.get(url, epgData)
        .done(function (result) {
            consoleLog("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX getEpg success ************************************");

            // for each station, generate an ordered list (by airDateTime) of all shows in the current epg data
            $.each(result, function (index, sdProgram) {

                // convert to local time zone
                var localDate = new Date(sdProgram.AirDateTime);

                if (localDate < epgProgramScheduleStartDateTime) {
                    epgProgramScheduleStartDateTime = localDate;
                }

                var dateStr = localDate.getFullYear().toString() + "-" + twoDigitFormat((localDate.getMonth() + 1).toString()) + "-" + twoDigitFormat(localDate.getDate().toString());

                var minutes = localDate.getMinutes();

                //if (minutes != 0 && minutes != 30) {
                //    debugger;
                //}

                var timeStr = twoDigitFormat(localDate.getHours().toString()) + ":" + twoDigitFormat(localDate.getMinutes().toString());

                // create program
                var program = {}
                program.date = localDate;
                //program.station = sdProgram.AtscMajor.toString() + "." + sdProgram.AtscMinor.toString();
                program.title = sdProgram.Title;
                program.duration = sdProgram.Duration;
                program.episodeTitle = sdProgram.EpisodeTitle;
                program.description = sdProgram.Description;
                program.showType = sdProgram.ShowType;

                // append to program list for  this station (create new record if necessary)
                var stationId = sdProgram.StationId;
                if (stationId == "undefined") {
                    debugger;
                }
                if (!(stationId in epgProgramSchedule)) {
                    var programStationData = {};
                    programStationData.station = sdProgram.AtscMajor.toString() + "." + sdProgram.AtscMinor.toString();
                    programStationData.programList = [];
                    epgProgramSchedule[stationId] = programStationData;
                }

                var programList = epgProgramSchedule[stationId].programList;
                programList.push(program);
            });

            // generate data for each time slot in the schedule - indicator of what the first program to display is at any given time slot
            for (var stationId in epgProgramSchedule)
            {
                if (epgProgramSchedule.hasOwnProperty(stationId)) {
                    var programStationData = epgProgramSchedule[stationId];
                    var programList = programStationData.programList;
                    var programIndex = 0;

                    var programSlotIndices = [];

                    var lastProgram = null;

                    for (var slotIndex = 0; slotIndex < 48 * numDaysEpgData; slotIndex++) {

                        var slotTimeOffsetSinceStartOfEpgData = slotIndex * 30;

                        while (true) {

                            // check for the case where we're at the end of the list of programs - occurs when the last show in the schedule is > 30 minutes
                            if (programIndex >= programList.length) {
                                programSlotIndices.push(programIndex - 1);
                                break;
                            }

                            var program = programList[programIndex];

                            var programTimeOffsetSinceStartOfEPGData = (program.date - epgProgramScheduleStartDateTime) / 60000; // minutes

                            if (programTimeOffsetSinceStartOfEPGData == slotTimeOffsetSinceStartOfEpgData) {
                                // program starts at exactly this time slot
                                programSlotIndices.push(programIndex);
                                programIndex++;
                                lastProgram = program;
                                break;
                            }
                            else if (programTimeOffsetSinceStartOfEPGData > slotTimeOffsetSinceStartOfEpgData) {
                                // program starts at sometime after the current time slot - find an earlier show
                                if (lastProgram != null) {
                                    lastProgram.indexIntoProgramList = programIndex - 1;
                                }
                                programSlotIndices.push(programIndex - 1);
                                // leave program index as it is - wait for timeslot to catch up
                                break;
                            }
                            else if (programTimeOffsetSinceStartOfEPGData < slotTimeOffsetSinceStartOfEpgData) {
                                // program starts at sometime before the current time slot - look for the last show that starts before the current time slot (or == to the current time slot)
                                programIndex++;
                                lastProgram = program;
                            }
                        }
                    }

                    programStationData.initialShowsByTimeSlot = programSlotIndices;
                }
            }

            switchToPage("channelGuidePage");
            refreshChannelGuide();

        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("getEpg failure");
        })
        .always(function () {
        });
    }
    else {
        switchToPage("channelGuidePage");
        refreshChannelGuide();
    }
}

function selectChannelGuide() {

    buildChannelGuideData();
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