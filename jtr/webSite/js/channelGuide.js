var epgProgramSchedule = null;
var epgProgramScheduleStartDateTime;

var channelGuideDisplayStartDateTime;
var channelGuideDisplayCurrentDateTime;
var channelGuideDisplayCurrrentEndDateTime;

var _currentSelectedProgramButton;
var _currentStationIndex;

var widthOfThirtyMinutes = 240;

function msecToMinutes(msec) {
    return msec / 60000;
}

function selectChannelGuide() {

    //initializeEpgData();

    if (epgProgramSchedule == null) {

        // first time displaying channel guide; retrieve epg data from database
        epgProgramSchedule = {};

        epgProgramScheduleStartDateTime = new Date();
        epgProgramScheduleStartDateTime.setFullYear(2100, 0, 0);

        // retrieve data from db starting on today's date
        var startDate = new Date();
        var year = startDate.getFullYear().toString();
        var month = (startDate.getMonth() + 1).toString();
        var dayInMonth = startDate.getDate().toString();
        var epgStartDate = year + "-" + twoDigitFormat(month) + "-" + twoDigitFormat(dayInMonth);
        var url = baseURL + "getEpg";
        var epgData = { "startDate": epgStartDate };
        $.get(url, epgData)
        .done(function (result) {

            consoleLog("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX getEpg success ************************************");

            // for each station, generate an ordered list (by airDateTime) of all shows in the current epg data
            $.each(result, function (index, sdProgram) {

                // convert to local time zone
                var localDate = new Date(sdProgram.AirDateTime);

                // capture the earliest date in the epg data (in local time, so may be earlier than date passed to db)
                if (localDate < epgProgramScheduleStartDateTime) {
                    epgProgramScheduleStartDateTime = localDate;
                }

                // create program from data in db
                var program = {}
                program.date = localDate;
                program.title = sdProgram.Title;
                program.duration = sdProgram.Duration;
                program.episodeTitle = sdProgram.EpisodeTitle;
                program.shortDescription = sdProgram.ShortDescription;
                program.longDescription = sdProgram.LongDescription;
                program.showType = sdProgram.ShowType;

                if (sdProgram.NewShow == undefined) {
                    program.newShow = 1;
                }
                else {
                    program.newShow = sdProgram.NewShow;
                }
                if (sdProgram.OriginalAirDate == undefined) {
                    program.originalAirDate = "";
                }
                else {
                    program.originalAirDate = sdProgram.OriginalAirDate;
                }
                if (sdProgram.SeasonEpisode == undefined) {
                    program.seasonEpisode = "";
                }
                else {
                    program.seasonEpisode = sdProgram.SeasonEpisode;
                }

                program.movieYear = sdProgram.movieYear;
                program.movieRating = sdProgram.movieRating;
                program.movieMinRating = sdProgram.movieMinRating;
                program.movieMaxRating = sdProgram.movieMaxRating;
                program.movieRatingIncrement = sdProgram.movieRatingIncrement;

                var aggregatedCastMembers = sdProgram.CastMembers;
                var castMembersArray = aggregatedCastMembers.split(',');
                var castMembers = "";
                $.each(castMembersArray, function (index, castMemberEntry) {
                    // JTRTODO - probably needs something more sophisticated and thought through for small devices
                    // limit number of cast members due to screen size
                    if (index < 11) {
                        if (index > 0) {
                            castMembers += ", ";
                        }
                        castMembers += castMemberEntry.substring(2);
                    }
                });
                program.castMembers = castMembers;

                // append to program list for  this station (create new station object if necessary)
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

                // append program to list of programs for this station
                var programList = epgProgramSchedule[stationId].programList;
                programList.push(program);
            });

            // generate data for each time slot in the schedule - indicator of the first program to display at any given time slot
            for (var stationId in epgProgramSchedule) {
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
                                // this program starts at some time after the current time slot - use prior show when navigating to this timeslot
                                if (lastProgram != null) {
                                    lastProgram.indexIntoProgramList = programIndex - 1;
                                }
                                programSlotIndices.push(programIndex - 1);
                                // leave program index as it is - wait for timeslot to catch up
                                break;
                            }
                            else if (programTimeOffsetSinceStartOfEPGData < slotTimeOffsetSinceStartOfEpgData) {
                                // this program starts at sometime before the current time slot - continue to look for the last show that starts before the current time slot (or == to the current time slot)
                                programIndex++;
                                lastProgram = program;
                            }
                        }
                    }

                    programStationData.initialShowsByTimeSlot = programSlotIndices;
                }
            }

            switchToPage("channelGuidePage");
            initiateRenderChannelGuide();
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
        initiateRenderChannelGuide();
    }

    $("#cgData").keydown(function (keyEvent) {
        var keyIdentifier = event.keyIdentifier;
        if (keyIdentifier == "Right" || keyIdentifier == "Left" || keyIdentifier == "Up" || keyIdentifier == "Down") {
            navigateChannelGuide(keyIdentifier.toLowerCase());
            return false;
        }

    });
}


function initiateRenderChannelGuide() {

    // display channel guide one station at a time, from current time for the duration of the channel guide
    getStations(renderChannelGuide);
}


function renderChannelGuide() {

    // start date/time for channel guide display is current time, rounded down to nearest 30 minutes
    var currentDate = new Date();
    var startMinute = (parseInt(currentDate.getMinutes() / 30) * 30) % 60;
    var startHour = currentDate.getHours();

    channelGuideDisplayStartDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour, startMinute, 0, 0);

    channelGuideDisplayCurrentDateTime = channelGuideDisplayStartDateTime;
    channelGuideDisplayCurrrentEndDateTime = new Date(channelGuideDisplayCurrentDateTime.getTime() + 3 * 60 * 60000);

    renderChannelGuideAtDateTime();
}

// draw the channel guide, starting at channelGuideDisplayStartDateTime
function renderChannelGuideAtDateTime() {

    // start date/time of data structure containing channel guide data
    var channelGuideDataStructureStartDateTime = epgProgramScheduleStartDateTime;

    // time difference between start of channel guide display and start of channel guide data
    var timeDiffInMinutes = msecToMinutes(channelGuideDisplayStartDateTime - channelGuideDataStructureStartDateTime);

    // index into the data structure (time slots) that contains the first show to display in the channel guide based on the time offset into channel guide data
    var currentChannelGuideOffsetIndex = parseInt(timeDiffInMinutes / 30);

    // JTRTODO - remove me
    firstRow = true;

    var maxMinutesToDisplay = 0;
    var minutesToDisplay;

    $.each(stations, function (stationIndex, station) {

        // channel guide data for this station
        var programStationData = epgProgramSchedule[station.StationId]

        // iterate through initialShowsByTimeSlot to get programs to display
        var programSlotIndices = programStationData.initialShowsByTimeSlot;
        var programList = programStationData.programList;

        var indexIntoProgramList = programSlotIndices[currentChannelGuideOffsetIndex];

        var minutesAlreadyDisplayed = 0;

        // build id of div containing the UI elements of the programs for the current station
        var cgProgramLineName = "#cgStation" + stationIndex.toString() + "Data";
        $(cgProgramLineName).empty();

        // first show to display for this station
        showToDisplay = programList[indexIntoProgramList];

        // calculate the time delta between the time of the channel guide display start and the start of the first show to display
        timeDiffInMsec = channelGuideDisplayStartDateTime - new Date(showToDisplay.date);
        var timeDiffInSeconds = timeDiffInMsec / 1000;
        var timeDiffInMinutes = timeDiffInSeconds / 60;
        // reduce the duration of the first show by this amount (time the show would have already been airing as of this time)

        programStationData.programUIElementIndices = [];

        var slotIndex = 0;
        var uiElementCount = 0;

        var toAppend = "";
        minutesToDisplay = 0;
        while (indexIntoProgramList < programList.length) {

            var durationInMinutes = Number(showToDisplay.duration);

            // perform reduction for only the first show in case it's already in progress at the beginning of this station's display
            if (toAppend == "") {
                durationInMinutes -= timeDiffInMinutes;
            }

            minutesToDisplay += durationInMinutes;

            var cssClasses = "";
            var widthSpec = "";
            if (durationInMinutes == 30) {
                cssClasses = "'btn-secondary thirtyMinuteButton'";
            }
            else if (durationInMinutes == 60) {
                cssClasses = "'btn-secondary sixtyMinuteButton'";
            }
            else {
                cssClasses = "'btn-secondary variableButton'";
                var width = (durationInMinutes / 60) * 480;
                widthSpec = " style='width:" + width.toString() + "px'";
                // JTR TODO - maxWidth
            }
            var id = "show-" + station.StationId + "-" + indexIntoProgramList.toString();
            var title = showToDisplay.title;
            toAppend +=
                "<button id='" + id + "' class=" + cssClasses + widthSpec + ">" + title + "</button>";

            var programStartTime = minutesAlreadyDisplayed;                     // offset in minutes
            var programEndTime = minutesAlreadyDisplayed + durationInMinutes;   // offset in minutes
            var slotTime = slotIndex * 30;
            while (programStartTime <= slotTime && slotTime < programEndTime) {
                programStationData.programUIElementIndices[slotIndex] = uiElementCount;
                slotIndex++;
                slotTime = slotIndex * 30;
            }

            minutesAlreadyDisplayed += durationInMinutes;
            indexIntoProgramList++;
            showToDisplay = programList[indexIntoProgramList];

            uiElementCount++;
        }
        $(cgProgramLineName).append(toAppend);

        if (minutesToDisplay > maxMinutesToDisplay) {
            maxMinutesToDisplay = minutesToDisplay;
        }
        // JTRTODO - setup handlers on children for browser - when user clicks on program to record, etc.

        // setup handlers on children - use for testing on Chrome
        var buttonsInCGLine = $(cgProgramLineName).children();
        $.each(buttonsInCGLine, function (buttonIndex, buttonInCGLine) {
            //$(buttonInCGLine).click({ recordingId: recordingId }, selectProgram);
            if (firstRow && buttonIndex == 0) {
                $(buttonInCGLine).focus();
                firstRow = false;
                _currentSelectedProgramButton = buttonInCGLine;
            }
        });
    });

    selectProgram(null, _currentSelectedProgramButton, 0);

    _currentStationIndex = 0;

    // build and display timeline
    var toAppend = "";
    $("#cgTimeLine").empty();
    var timeLineCurrentValue = channelGuideDisplayStartDateTime;
    var minutesDisplayed = 0;
    while (minutesDisplayed < maxMinutesToDisplay) {

        var timeLineTime = timeOfDay(timeLineCurrentValue);

        toAppend += "<button class='thirtyMinuteTime'>" + timeLineTime + "</button>";
        timeLineCurrentValue = new Date(timeLineCurrentValue.getTime() + 30 * 60000);
        minutesDisplayed += 30;
    }
    $("#cgTimeLine").append(toAppend);
}


function getSlotIndex(dateTime) {

    // compute the time difference between the new time and where the channel guide data begins (and could be displayed)
    var timeDiffInMinutes = msecToMinutes(dateTime.getTime() - channelGuideDisplayStartDateTime.getTime());

    // compute number of 30 minute slots to scroll
    return timeDiffInMinutes / 30;
}

function scrollToTime(newScrollToTime) {

    var slotsToScroll = getSlotIndex(newScrollToTime);

    // how many pixels
    // JTRTODO hard coded
    $("#cgData").scrollLeft(slotsToScroll * widthOfThirtyMinutes)

    channelGuideDisplayCurrentDateTime = newScrollToTime;
    channelGuideDisplayCurrrentEndDateTime = new Date(channelGuideDisplayCurrentDateTime.getTime() + 3 * 60 * 60000);
}

function selectProgramAtTimeOnStation(selectProgramTime, stationIndex, currentUIElement) {

    _currentStationIndex = stationIndex;

    var slotIndex = getSlotIndex(selectProgramTime);

    var station = stations[stationIndex];
    var stationId = station.StationId;
    var programStationData = epgProgramSchedule[stationId]

    var buttonIndex = programStationData.programUIElementIndices[slotIndex];

    // get the array of program buttons for this station
    var cgProgramsInStationRowElement = "#cgStation" + stationIndex.toString() + "Data";
    var programUIElementsInStation = $(cgProgramsInStationRowElement).children();       // programs in that row

    var nextActiveUIElement = programUIElementsInStation[buttonIndex];

    selectProgram(currentUIElement, nextActiveUIElement, 0)
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

function updateActiveProgramUIElement(activeProgramUIElement, newActiveProgramUIElement) {

    if (activeProgramUIElement != null) {
        $(activeProgramUIElement).removeClass("btn-primary");
        $(activeProgramUIElement).addClass("btn-secondary");
    }

    $(newActiveProgramUIElement).removeClass("btn-secondary");
    $(newActiveProgramUIElement).addClass("btn-primary");

    $(newActiveProgramUIElement).focus();

    _currentSelectedProgramButton = newActiveProgramUIElement;
}


function updateProgramInfo(programUIElement) {
   
    var programId = $(programUIElement)[0].id;
    var idParts = programId.split("-");
    var stationId = idParts[1];
    var programIndex = idParts[2];

    var programStationData = epgProgramSchedule[stationId];
    var programList = programStationData.programList;
    var selectedProgram = programList[programIndex];

    // display title (prominently)
    $("#cgProgramName").text(selectedProgram.title);

    // display day/date of selected program in upper left of channel guide
    var programDayDate = dayDate(selectedProgram.date);
    $("#cgDayDate").text(programDayDate);

    $("#programInfo").empty();

    // day, date, and time
    var startTime = timeOfDay(selectedProgram.date);

    var endDate = new Date(selectedProgram.date.getTime() + selectedProgram.duration * 60000);
    var endTime = timeOfDay(endDate);

    var dateTimeInfo = programDayDate + " " + startTime + " - " + endTime;

    var episodeInfo = "";
    if (selectedProgram.showType == "Series" && selectedProgram.newShow == 0) {
        episodeInfo = "Rerun.";
        if (selectedProgram.originalAirDate != "") {
            episodeInfo += " The original air date was " + selectedProgram.originalAirDate;
            if (selectedProgram.seasonEpisode != "") {
                episodeInfo += ", " + selectedProgram.seasonEpisode;
            }
        }
    }

    $("#cgDateTimeInfo").html(dateTimeInfo)

    var episodeTitle = selectedProgram.episodeTitle;
    if (episodeTitle == "") {
        episodeTitle = "<br/>";
    }
    $("#cgEpisodeTitle").html(episodeTitle)

    var programDescription = selectedProgram.longDescription;
    if (programDescription == "") {
        programDescription = selectedProgram.shortDescription;
    }
    if (programDescription == "") {
        programDescription = "<br/>";
    }
    $("#cgDescription").html(programDescription)

    var castMembers = selectedProgram.castMembers;
    if (castMembers == "") {
        castMembers = "<br/>";
    }
    $("#cgCastMembers").html(castMembers)

    if (episodeInfo == "") {
        episodeInfo = "<br/>";
    }
    $("#episodeInfo").html(episodeInfo)
}

function selectProgram(activeProgramUIElement, newActiveProgramUIElement) {

    updateActiveProgramUIElement(activeProgramUIElement, newActiveProgramUIElement);

    updateProgramInfo(newActiveProgramUIElement)

}

function dayDate(dateTime) {
    var dayInWeek = dayOfWeek(dateTime);
    var month = (dateTime.getMonth() + 1).toString();
    var date = dateTime.getDate().toString();

    return dayInWeek + " " + month + "/" + date;
}

function dayOfWeek(dateTime) {
    var weekday = new Array(7);
    weekday[0] = "Sun";
    weekday[1] = "Mon";
    weekday[2] = "Tue";
    weekday[3] = "Wed";
    weekday[4] = "Thu";
    weekday[5] = "Fri";
    weekday[6] = "Sat";

    return weekday[dateTime.getDay()];
}

function timeOfDay(dateTime) {

    var hoursLbl = "";
    var amPm = " am";
    var hours = dateTime.getHours();
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

    var minutesLbl = twoDigitFormat(dateTime.getMinutes().toString());

    return (hoursLbl + ":" + minutesLbl + amPm);
}


function navigateBackwardOneScreen() {

    // 6 slots * 30 minutes / slot * time conversion
    newScrollToTime = new Date(channelGuideDisplayCurrentDateTime.getTime() - (6 * 30 * 60000));
    scrollToTime(newScrollToTime)

    selectProgramAtTimeOnStation(newScrollToTime, _currentStationIndex, _currentSelectedProgramButton);
}


function navigateBackwardOneDay() {

    newScrollToTime = new Date(channelGuideDisplayCurrentDateTime.getTime() - (48 * 30 * 60000));
    scrollToTime(newScrollToTime)

    selectProgramAtTimeOnStation(newScrollToTime, _currentStationIndex, _currentSelectedProgramButton);
}


function navigateForwardOneScreen() {

    // 6 slots * 30 minutes / slot * time conversion
    newScrollToTime = new Date(channelGuideDisplayCurrentDateTime.getTime() + (6 * 30 * 60000));
    scrollToTime(newScrollToTime)

    selectProgramAtTimeOnStation(newScrollToTime, _currentStationIndex, _currentSelectedProgramButton);
}

function navigateForwardOneDay() {

    // 6 slots * 30 minutes / slot * time conversion
    newScrollToTime = new Date(channelGuideDisplayCurrentDateTime.getTime() + (48 * 30 * 60000));
    scrollToTime(newScrollToTime)

    selectProgramAtTimeOnStation(newScrollToTime, _currentStationIndex, _currentSelectedProgramButton);
}


function getProgramFromUIElement(element) {

    var programId = $(element)[0].id;
    var idParts = programId.split("-");
    var stationId = idParts[1];
    var programIndex = idParts[2];
    var programStationData = epgProgramSchedule[stationId];
    var programList = programStationData.programList;
    var selectedProgram = programList[programIndex];
    return selectedProgram;
}

function isProgramStartVisible(element) {

    var program = getProgramFromUIElement(element);
    var programDate = program.date;

    if ( (channelGuideDisplayCurrentDateTime <= programDate) && (programDate < channelGuideDisplayCurrrentEndDateTime) ) return true;
    return false;
}


function isProgramEndVisible(element) {

    var program = getProgramFromUIElement(element);
    var programStartDateTime = program.date;
    var programEndDateTime = new Date(programStartDateTime.getTime() + program.duration * 60000);

    if (programEndDateTime > channelGuideDisplayCurrrentEndDateTime) return false;
    if (programEndDateTime <= channelGuideDisplayCurrentDateTime) return false;

    return true;
}

function navigateChannelGuide(direction) {

    var activeProgramUIElement = _currentSelectedProgramButton;

    // get div for current active button
    var activeStationRowUIElement = activeProgramUIElement.parentElement;           // current row of the channel guide
    var programUIElementsInStation = $(activeStationRowUIElement).children();       // programs in that row

    var indexOfActiveProgramUIElement = getActiveButtonIndex(activeProgramUIElement, programUIElementsInStation);
    if (indexOfActiveProgramUIElement >= 0) {
        if (direction == "right") {

            var programEndIsVisible = isProgramEndVisible(activeProgramUIElement);

            // if the end of the current program is fully visible, go to the next program
            // if the start of the next program is not visible, scroll to the left by 30 minutes
            // select the next program
            if (programEndIsVisible) {
                var indexOfNewProgramUIElement = indexOfActiveProgramUIElement + 1;
                if (indexOfNewProgramUIElement < $(programUIElementsInStation).length) {
                    var newActiveProgramUIElement = $(programUIElementsInStation)[indexOfNewProgramUIElement];
                    var programStartIsVisible = isProgramStartVisible(newActiveProgramUIElement);
                    if (!programStartIsVisible) {
                        newScrollToTime = new Date(channelGuideDisplayCurrentDateTime.getTime() + 1 * 30 * 60000);
                        scrollToTime(newScrollToTime);
                    }
                    selectProgram(activeProgramUIElement, newActiveProgramUIElement, 1);
                }
            }

            // else if the current program's end point is not visible, move forward by 30 minutes.
            else {
                newScrollToTime = new Date(channelGuideDisplayCurrentDateTime.getTime() + 1 * 30 * 60000);
                scrollToTime(newScrollToTime);
            }

            // JTRTODO - check for limit on right side; either fetch more epg data or stop scrolling at the end
        }
        else if (direction == "left") {

            var programStartIsVisible = isProgramStartVisible(activeProgramUIElement);

            // if the start of the current program is fully visible, go to the prior program
            // if the end of the prior program is not visible, scroll to the right by 30 minutes
            // select the prior program
            if (programStartIsVisible) {
                if (indexOfActiveProgramUIElement > 0) {
                    var indexOfNewProgramUIElement = indexOfActiveProgramUIElement - 1;
                    if (indexOfNewProgramUIElement < $(programUIElementsInStation).length) {
                        var newActiveProgramUIElement = $(programUIElementsInStation)[indexOfNewProgramUIElement];
                        var programEndIsVisible = isProgramEndVisible(newActiveProgramUIElement);
                        if (!programEndIsVisible) {
                            newScrollToTime = new Date(channelGuideDisplayCurrentDateTime.getTime() - 1 * 30 * 60000);
                            scrollToTime(newScrollToTime);
                        }
                        selectProgram(activeProgramUIElement, newActiveProgramUIElement, -1);
                    }
                }
            }

            // else if the current program's start point is not visible, move backward by 30 minutes.
            else {
                newScrollToTime = new Date(channelGuideDisplayCurrentDateTime.getTime() - 1 * 30 * 60000);
                scrollToTime(newScrollToTime);
            }
        }
        else if (direction == "down" || direction == "up") {
            var activeRowIndex = _currentStationIndex;
            if ((activeRowIndex < stations.length - 1 && direction == "down")  || (activeRowIndex > 0 && direction == "up")) {

                var newRowIndex;
                if (direction == "down") {
                    newRowIndex = activeRowIndex + 1;
                }
                else {
                    newRowIndex = activeRowIndex - 1;
                }

                // when moving up/down, don't scroll
                // select the program at the same time
                // if that program's start is visible, the selectProgramTime is the start time of the current selected program
                // if it's not visible, the selectProgramTime is the current start of display of the channel guide
                var selectProgramTime;
                var programStartIsVisible = isProgramStartVisible(activeProgramUIElement);
                if (programStartIsVisible) {
                    var programId = activeProgramUIElement.id;
                    var idParts = programId.split("-");
                    var stationId = idParts[1];
                    var programIndex = idParts[2];

                    var programStationData = epgProgramSchedule[stationId];
                    var programList = programStationData.programList;
                    selectProgramTime = programList[programIndex].date;
                }
                else {
                    selectProgramTime = channelGuideDisplayCurrentDateTime;
                }

                selectProgramAtTimeOnStation(selectProgramTime, newRowIndex, activeProgramUIElement);
            }
        }
    }
}
