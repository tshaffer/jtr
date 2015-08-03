var epgProgramSchedule = null;
var epgProgramScheduleStartDateTime;

var channelGuideDisplayStartDateTime;

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

    renderChannelGuideAtDateTime();
}

// draw the channel guide, starting at channelGuideDisplayStartDateTime
function renderChannelGuideAtDateTime() {

    // start date/time of data structure containing channel guide data
    var channelGuideDataStructureStartDateTime = epgProgramScheduleStartDateTime;

    // time difference between start of channel guide display and start of channel guide data
    var timeDiffInMsec = channelGuideDisplayStartDateTime - channelGuideDataStructureStartDateTime;
    var timeDiffInSeconds = timeDiffInMsec / 1000;
    var timeDiffInMinutes = timeDiffInSeconds / 60;

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

        var toAppend = "";
        minutesToDisplay = 0;
        while (indexIntoProgramList < programList.length) {
            try
            {
                var durationInMinutes = Number(showToDisplay.duration);
            }
            catch (err)
            {
                debugger;
            }
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
                //"<button id='" + id + "' class=btn-secondary " + cssClass + widthSpec + ">" + title + "</button>";
                "<button id='" + id + "' class=" + cssClasses + widthSpec + ">" + title + "</button>";

            minutesAlreadyDisplayed += durationInMinutes;
            indexIntoProgramList++;
            showToDisplay = programList[indexIntoProgramList];
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
                lastActiveButton = buttonInCGLine;
            }
        });

        // JTRTODO - change in the future - different algorithm for selecting which program to highlight first
        //$(lastActiveButton).removeClass("btn-secondary");
        //$(lastActiveButton).addClass("btn-primary");

        //$(lastActiveButton).focus();
        selectProgram(null, lastActiveButton, 0);
    });

    // build and display timeline
    var toAppend = "";
    $("#cgTimeLine").empty();
    var timeLineCurrentValue = channelGuideDisplayStartDateTime;
    var minutesDisplayed = 0;
    while (minutesDisplayed < maxMinutesToDisplay) {

        var timeLineTime = timeOfDay(timeLineCurrentValue);

        //toAppend += "<span class='thirtyMinuteTime'>" + timeLineTime + "</span>";
        toAppend += "<button class='thirtyMinuteTime'>" + timeLineTime + "</button>";
        timeLineCurrentValue = new Date(timeLineCurrentValue.getTime() + 30 * 60000);
        minutesDisplayed += 30;
    }
    $("#cgTimeLine").append(toAppend);
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

// direction
//      -1 = left
//      0 = no direction
//      1 = right
function updateActiveProgramUIElement(activeProgramUIElement, newActiveProgramUIElement, direction) {

    if (activeProgramUIElement != null) {
        $(activeProgramUIElement).removeClass("btn-primary");
        $(activeProgramUIElement).addClass("btn-secondary");
    }

    $(newActiveProgramUIElement).removeClass("btn-secondary");
    $(newActiveProgramUIElement).addClass("btn-primary");

    // position cgData to make selected element visible in the proper location
    //      if it's currently visible, don't scroll at all
    //      if not scroll by one 30 minutes slot to make it visible
    var newActiveProgramUIElementVisible = isElementPartiallyVisible(newActiveProgramUIElement);
    if (!newActiveProgramUIElementVisible) {
        // new active element not visible at all, make it visible by scrolling 30 minutes to the left or right
        // on right or on left??
        var currentOffsetLeft = $("#cgData").scrollLeft();
        // JTRTODO - hardcoded value
        if (direction != 0) {
            var newOffsetLeft = currentOffsetLeft + (direction * 240);
            $("#cgData").scrollLeft(newOffsetLeft)
        }
        else {
            makeItemVisible(newActiveProgramUIElement);
        }
    }

    $(newActiveProgramUIElement).focus();

    lastActiveButton = newActiveProgramUIElement;
}

function selectProgram(activeProgramUIElement, newActiveProgramUIElement, direction) {

    updateActiveProgramUIElement(activeProgramUIElement, newActiveProgramUIElement, direction);

    var programId = $(newActiveProgramUIElement)[0].id;
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

   // program title, episode title, and description, and episode info
    //var programInfo = selectedProgram.title;
    //programInfo += "<br>";

    var programInfo = "";
    if (selectedProgram.episodeTitle != "") {
        programInfo += '"' + selectedProgram.episodeTitle + '"';
    }
    programInfo += "<br>";
    if (selectedProgram.description != "") {
        programInfo += selectedProgram.description;
    }
    programInfo += "<br>";
    
    if (selectedProgram.castMembers != 'none') {
        programInfo += selectedProgram.castMembers;        
    }
    programInfo += "<br>";        
    
    var episodeInfo = "";
    if (selectedProgram.showType == "Series" && selectedProgram.newShow == 0) {
        episodeInfo = "Rerun.";
        if (selectedProgram.originalAirDate != "") {
            episodeInfo += " The original air date was " + selectedProgram.originalAirDate;
            if (selectedProgram.gracenoteSeasonEpisode != "") {
                episodeInfo += ", " + selectedProgram.gracenoteSeasonEpisode;
            }
        }
    }
    programInfo += episodeInfo + "<br>";

    var htmlContent = "<p>";
    htmlContent += dateTimeInfo;
    htmlContent += "<br>";
    htmlContent += programInfo;
    htmlContent += "</p>";

    $("#programInfo").html(htmlContent);

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


function getIndexOfFirstVisibleTime() {

    //var cgLeft = $("#cgData").offset().left;
    //var cgWidth = $("#cgData").width();
    //var cgRight = cgLeft + cgWidth - 1;

    //var elementLeft = $(element).offset().left;
    //var elementWidth = $(element).width();
    //var elementRight = elementLeft + elementWidth - 1;

    //if (elementLeft >= cgLeft && elementLeft < cgRight) return true;

    //if (elementRight >= cgLeft && elementRight < cgRight) return true;

    var isVisible = false;

    var cgLeft = $("#cgData").offset().left;
    //var cgWidth = $("#cgData").width();
    //var cgRight = cgLeft + cgWidth - 1;

    var timeLineIndex = 0;
    while (!isVisible) {
        var element = $("#cgTimeLine").children()[timeLineIndex];

        var elementLeft = $(element).offset().left;

        isVisible = elementLeft >= cgLeft;

        if (!isVisible) {
            timeLineIndex++;
        }
        //var elementWidth = $(element).width();
        //var elementRight = elementLeft + elementWidth - 1;

        //if (elementLeft >= cgLeft && elementLeft < cgRight) return true;

        //if (elementRight >= cgLeft && elementRight < cgRight) return true;
    }

    //var cgDataWidth = $("#cgData").width()
    //var cgDataLeft = $("#cgData").offset().left;

    //var timeLineIndex = 0;
    //while (!isVisible) {
    //    var $elem = $("#cgTimeLine").children()[timeLineIndex];
    //    var elemLeft = $elem.offsetLeft;
    //    isVisible = elemLeft >= cgDataLeft;
    //    timeLineIndex++;
    //}

    return timeLineIndex;
}


function navigateBackwardOneScreen() {

    var activeProgramUIElement = lastActiveButton;

    // algorithm
    // scroll left by one screenful
    // figure out the new active program and highlight it
    //      get the timeslot of the first visible time
    //      get the program associated with that time slot (for the current station)
    //      select that program

    // scroll left by one screenful
    var currentOffsetLeft = $("#cgData").scrollLeft();
    // JTRTODO
    // 6 time slots * 240 pixels (width) per timeslot
    var newOffsetLeft = currentOffsetLeft - (6 * 240);
    $("#cgData").scrollLeft(newOffsetLeft)

    selectProgramAtCurrentOffset();

    //// get index of first visible item; display the channel guide one screen back

    //var timeLineIndex = getIndexOfFirstVisibleTime();

    //// JTR TODO - replace by proper calculation
    //timeLineIndex -= 6;
    //if (timeLineIndex < 0) timeLineIndex = 0;

    //channelGuideDisplayStartDateTime = new Date(channelGuideDisplayStartDateTime.getTime() + ((timeLineIndex * 30) * 60000));
    //renderChannelGuideAtDateTime(channelGuideDisplayStartDateTime);
}


function navigateBackwardOneDay() {

    // scroll right by one day
    var currentOffsetLeft = $("#cgData").scrollLeft();
    // JTRTODO
    // 48 time slots * 240 pixels (width) per timeslot
    var newOffsetLeft = currentOffsetLeft - (48 * 240);
    $("#cgData").scrollLeft(newOffsetLeft)

    selectProgramAtCurrentOffset();
}


function getIndexOfFirstInvisibleTime() {

    var isVisible = true;

    var cgDataWidth = $("#cgData").width()

    var timeLineIndex = 0;
    while (isVisible) {
        var $elem = $("#cgTimeLine").children()[timeLineIndex];
        var elemLeft = $elem.offsetLeft;
        isVisible = elemLeft < cgDataWidth;
        timeLineIndex++;
    }

    return timeLineIndex;
}

function navigateForwardOneScreen() {

    // algorithm
    // scroll left by one screenful
    // figure out the new active program and highlight it
    //      get the timeslot of the first visible time
    //      get the program associated with that time slot (for the current station)
    //      select that program

    // scroll left by one screenful
    var currentOffsetLeft = $("#cgData").scrollLeft();
    // JTRTODO
    // 6 time slots * 240 pixels (width) per timeslot
    var newOffsetLeft = currentOffsetLeft + (6 * 240);
    $("#cgData").scrollLeft(newOffsetLeft)

    selectProgramAtCurrentOffset();
}

function navigateForwardOneDay() {

    // scroll left by one day
    var currentOffsetLeft = $("#cgData").scrollLeft();
    // JTRTODO
    // 48 time slots * 240 pixels (width) per timeslot
    var newOffsetLeft = currentOffsetLeft + (48 * 240);
    $("#cgData").scrollLeft(newOffsetLeft)

    selectProgramAtCurrentOffset();
}

function selectProgramAtCurrentOffset() {

    var activeProgramUIElement = lastActiveButton;

    // get the timeslot of the first visible time
    var firstVisibleTimeIndex = getIndexOfFirstVisibleTime();

    // get the program associated with that time slot (for the current station)

    // start date/time of data structure containing channel guide data
    var channelGuideDataStructureStartDateTime = epgProgramScheduleStartDateTime;

    // time difference between start of channel guide display and start of channel guide data
    var timeDiffInMsec = channelGuideDisplayStartDateTime - channelGuideDataStructureStartDateTime;
    var timeDiffInSeconds = timeDiffInMsec / 1000;
    var timeDiffInMinutes = timeDiffInSeconds / 60;

    // add in the delta for the current screen
    timeDiffInMinutes += firstVisibleTimeIndex * 30;

    // index into the data structure (time slots) that contains the first show to display in the channel guide based on the time offset into channel guide data
    var currentChannelGuideOffsetIndex = parseInt(timeDiffInMinutes / 30);

    var programId = $(activeProgramUIElement)[0].id;
    var idParts = programId.split("-");
    var stationId = idParts[1];
    var programIndex = idParts[2];

    var newActiveProgramUIElement = activeProgramUIElement;

    // channel guide data for this station
    var programStationData = epgProgramSchedule[stationId]

    // index into initialShowsByTimeSlot to get programs to display
    var programSlotIndices = programStationData.initialShowsByTimeSlot;
    var programList = programStationData.programList;

    var indexIntoProgramList = programSlotIndices[currentChannelGuideOffsetIndex];
    var newActiveProgram = programList[indexIntoProgramList];

    // get UI element that matches the newActiveProgram
    var activeStationRowUIElement = activeProgramUIElement.parentElement;           // current row of the channel guide
    var programUIElementsInStation = $(activeStationRowUIElement).children();       // programs in that row

    $.each(programUIElementsInStation, function (buttonIndex, programUIElementInStation) {
        var programInStationId = programUIElementInStation.id;
        var programInStationIdParts = programInStationId.split("-");
        var programInStationProgramIndex = programInStationIdParts[2];
        if (programInStationProgramIndex == indexIntoProgramList) {
            newActiveProgramUIElement = programUIElementInStation;
            return false;
        }
    });

    selectProgram(activeProgramUIElement, newActiveProgramUIElement, 1);
}


function makeItemVisible(element) {

    var cgLeft = $("#cgData").offset().left;
    var cgWidth = $("#cgData").width();
    var cgRight = cgLeft + cgWidth - 1;

    var elementLeft = $(element).offset().left;

    if (elementLeft < cgLeft) {

        var distanceFromLeft = cgLeft - elementLeft;

        // scroll to the right by this amount
        var currentOffsetLeft = $("#cgData").scrollLeft();
        // JTRTODO - hardcoded value
        var newOffsetLeft = currentOffsetLeft - distanceFromLeft;
        $("#cgData").scrollLeft(newOffsetLeft)
    }
}


function isElementPartiallyVisible(element) {

    var cgLeft = $("#cgData").offset().left;
    var cgWidth = $("#cgData").width();
    var cgRight = cgLeft + cgWidth - 1;

    var elementLeft = $(element).offset().left;
    var elementWidth = $(element).width();
    var elementRight = elementLeft + elementWidth - 1;

    if (elementLeft >= cgLeft && elementLeft < cgRight) return true;

    if (elementRight >= cgLeft && elementRight < cgRight) return true;

    return false;
}

function isElementFullyVisible(element) {

    var cgLeft = $("#cgData").offset().left;
    var elementLeft = $(element).offset().left;
    if (elementLeft < cgLeft) return false;

    var cgWidth = $("#cgData").width();
    var elementWidth = $(element).width();

    if ((elementLeft + elementWidth) > (cgLeft + cgWidth)) return false;

    return true;
}


function isProgramStartVisible(element) {

    var cgLeft = $("#cgData").offset().left;
    var elementLeft = $(element).offset().left;
    if (elementLeft < cgLeft) return false;

    var cgWidth = $("#cgData").width();
    var elementWidth = $(element).width();

    if (elementLeft > (cgLeft + cgWidth)) return false;

    return true;
}


function isProgramEndVisible(element) {

    var cgLeft = $("#cgData").offset().left;
    var elementLeft = $(element).offset().left;

    var cgWidth = $("#cgData").width();
    var elementWidth = $(element).width();

    if ((elementLeft + elementWidth) > (cgLeft + cgWidth)) return false;

    return true;
}

function navigateChannelGuide(direction) {

    // JTRTODO
    //          var currentElement = document.activeElement;
    var activeProgramUIElement = lastActiveButton;
    // JTRTODO - the following may be necessary for some tbd functionality??
    //var currentElementId = currentElement.id;

    // get div for current active button
    var activeStationRowUIElement = activeProgramUIElement.parentElement;           // current row of the channel guide
    var programUIElementsInStation = $(activeStationRowUIElement).children();       // programs in that row
    var programUIElementPosition = $(activeProgramUIElement).position();            // returns members 'top' and 'left'
    var allRowsUIElement = activeStationRowUIElement.parentElement;                 // element representing all rows (JTRTODO - why not just use #cgData)
    var stationRowsUIElements = $(allRowsUIElement).children();                     // stations in the channel guide (the rows)

    var indexOfActiveProgramUIElement = getActiveButtonIndex(activeProgramUIElement, programUIElementsInStation);
    if (indexOfActiveProgramUIElement >= 0) {
        if (direction == "right") {

            var programEndIsVisible = isProgramEndVisible(activeProgramUIElement);

            // if the end of the current program is fully visible, display the next program
            if (programEndIsVisible) {
                var indexOfNewProgramUIElement = indexOfActiveProgramUIElement + 1;
                if (indexOfNewProgramUIElement < $(programUIElementsInStation).length) {
                    var newActiveProgramUIElement = $(programUIElementsInStation)[indexOfNewProgramUIElement];
                    selectProgram(activeProgramUIElement, newActiveProgramUIElement, 1);
                }
            }

            // else if the current program's end point is not visible, move forward by 30 minutes.
            else {
                var currentOffsetLeft = $("#cgData").scrollLeft();
                // JTRTODO - hardcoded value
                var newOffsetLeft = currentOffsetLeft + 240;
                $("#cgData").scrollLeft(newOffsetLeft)
            }

            // JTRTODO - check for limit on right side; either fetch more epg data or stop scrolling at the end
        }
        else if (direction == "left") {

            var programStartIsVisible = isProgramStartVisible(activeProgramUIElement);

            // if the start of the current program is fully visible, display the prior program
            if (programStartIsVisible) {
                if (indexOfActiveProgramUIElement > 0) {
                    var indexOfNewProgramUIElement = indexOfActiveProgramUIElement - 1;
                    if (indexOfNewProgramUIElement < $(programUIElementsInStation).length) {
                        var newActiveProgramUIElement = $(programUIElementsInStation)[indexOfNewProgramUIElement];
                        selectProgram(activeProgramUIElement, newActiveProgramUIElement, -1);
                    }
                }
            }

            // else if the current program's start point is not visible, move backward by 30 minutes.
            else {
                var currentOffsetLeft = $("#cgData").scrollLeft();
                // JTRTODO - hardcoded value
                var newOffsetLeft = currentOffsetLeft - 240;
                $("#cgData").scrollLeft(newOffsetLeft)
            }
        }
        else if (direction == "down" || direction == "up") {
            var xPosition = programUIElementPosition.left;
            var activeRowIndex = getActiveRowIndex(activeStationRowUIElement);
            if ((activeRowIndex < stations.length - 1 && direction == "down")  || (activeRowIndex > 0 && direction == "up")) {

                var newRowIndex;
                if (direction == "down") {
                    newRowIndex = activeRowIndex + 1;
                }
                else {
                    newRowIndex = activeRowIndex - 1;
                }

                // find program whose x value is closest to the x value of the last program
                var newActiveRow = stationRowsUIElements[newRowIndex + 1];
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
                selectProgram(activeProgramUIElement, newActiveProgram, 0);
            }
        }
    }
}

function displayChannelGuide() {

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
                //program.station = sdProgram.AtscMajor.toString() + "." + sdProgram.AtscMinor.toString();
                program.title = sdProgram.Title;
                program.duration = sdProgram.Duration;
                program.episodeTitle = sdProgram.EpisodeTitle;
                program.description = sdProgram.Description;
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
                if (sdProgram.GracenoteSeasonEpisode == undefined) {
                    program.gracenoteSeasonEpisode = "";
                }
                else {
                    program.gracenoteSeasonEpisode = sdProgram.GracenoteSeasonEpisode;
                }
                
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
                // if (castMembers != "") {
                //     console.log(castMembers);
                // }
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
        
    $( "#cgData" ).keydown(function(keyEvent) {
        var keyIdentifier = event.keyIdentifier;
        if (keyIdentifier == "Right" || keyIdentifier == "Left" || keyIdentifier == "Up" || keyIdentifier == "Down") {
            navigateChannelGuide(keyIdentifier.toLowerCase());
            return false;
        }

    });
}

function selectChannelGuide() {

    // initializeEpgData();
    
    displayChannelGuide();
}

