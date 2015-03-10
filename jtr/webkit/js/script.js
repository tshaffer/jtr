var currentActiveElementId = "#homePage";
//var baseURL = "http://192.168.2.6:8080/";
//var baseURL = "http://192.168.2.7:8080/";
//var baseURL = "http://192.168.2.12:8080/";
//var baseURL = "http://10.1.0.90:8080/";

var bsMessage;
var ir_receiver;
var recordedPageIds = [];

var modalDialogDisplayed = false;
var selectedDeleteShowDlgElement = "#deleteShowDlgDelete";
var unselectedDeleteShowDlgElement = "#deleteShowDlgClose";

var _showRecordingId;

function setNav() {

}


function selectChannelGuide() {

}

function selectRecordedShows() {
	switchToPage("recordedShowsPage");
	getRecordedShows();
}

function navigateRecordedShowsPage(navigationCommand$) {

    console.log("navigateRecordedShowsPage entry");

    var rowIndex = -1;
    var colIndex = -1;

    var currentElement = document.activeElement;
    var currentElementId = currentElement.id;

    if (currentElementId == "" || currentElementId == "recordedShows") {
        rowIndex = 0;
        colIndex = 0;
    }
    else {
        currentElementId = "#" + currentElementId;
        for (i = 0; i < recordedPageIds.length; i++) {

            var recordingId = recordedPageIds[i][0];
            var deleteId = recordedPageIds[i][1];

            if (recordingId == currentElementId) {
                rowIndex = i;
                colIndex = 0;
                break;
            }
            else if (deleteId == currentElementId) {
                rowIndex = i;
                colIndex = 1;
                break;
            }
        }

        switch (navigationCommand$) {
            case "up":
                if (rowIndex > 0) rowIndex--;
                break;
            case "down":
                if (rowIndex < recordedPageIds.length) rowIndex++;
                break;
            case "left":
                if (colIndex > 0) colIndex--;
                break;
            case "right":
                if (colIndex < 1) colIndex++;
                break;
        }
    }

    $(recordedPageIds[rowIndex][colIndex]).focus();
}

function selectToDoList() {
    switchToPage("toDoListPage");
	getToDoList();
}

function displayDeleteShowDlg(showTitle, showRecordingId) {

    _showRecordingId = showRecordingId;

    var options = {
        "backdrop": "true"
    }
    $('#deleteShowDlg').modal(options);
    $('#deleteShowDlgShowTitle').html("Delete '" + showTitle + "'?");

    modalDialogDisplayed = true;
    selectedDeleteShowDlgElement = "#deleteShowDlgDelete";
}

function deleteShowDlgCloseInvoked() {
    console.log("deleteShowDlgCloseInvoked");
    $('#deleteShowDlg').modal('hide');
    modalDialogDisplayed = false;
    switchToPage("homePage");

    var aUrl = baseURL + "showUI";
    var placeholderData = {};

    $.get(aUrl, placeholderData)
        .done(function (result) {
            console.log("showUI successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("showUI failure");
        })
        .always(function () {
            alert("finished");
        });

}


function deleteShowDlgDeleteInvoked() {
    console.log("deleteShowDlgDeleteInvoked");
    $('#deleteShowDlg').modal('hide');
    modalDialogDisplayed = false;
    executeDeleteSelectedShow(_showRecordingId);
    switchToPage("homePage");

    var aUrl = baseURL + "showUI";
    var placeholderData = {};

    $.get(aUrl, placeholderData)
        .done(function (result) {
            console.log("showUI successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("showUI failure");
        })
        .always(function () {
            alert("finished");
        });
}


function selectSetManualRecord() {
	switchToPage("manualRecordPage");
	setDefaultDateTimeFields();
	$("#manualRecordTitle").focus();
}
 
function selectUserSelection() {

}

function selectHomePage() {
	switchToPage("homePage");
}

var mainMenuIds = [
    ['recordedShows', 'setManualRecord'],
    ['channelGuide', 'userSelection'],
    ['toDoList', 'myPlayVideo']
];

function navigateHomePage(navigationCommand$) {

    var rowIndex = -1;
    var colIndex = -1;

    var currentElement = document.activeElement;
    var currentElementId = currentElement.id;

    for (i = 0; i < mainMenuIds.length; i++) {
        for (j = 0; j < mainMenuIds[i].length; j++) {
            if (mainMenuIds[i][j] == currentElementId) {
                rowIndex = i;
                colIndex = j;
                break;
            }
            // break again if necessary?
        }
    }

    if (rowIndex >= 0 && colIndex >= 0) {
        switch (navigationCommand$) {
            case "up":
                if (rowIndex > 0) rowIndex--;
                break;
            case "down":
                if (rowIndex < mainMenuIds.length) rowIndex++;
                break;
            case "left":
                if (colIndex > 0) colIndex--;
                break;
            case "right":
                if (colIndex < mainMenuIds[0].length) colIndex++;
                break;
        }
    }
    else {
        rowIndex = 0;
        colIndex = 0;
    }

    console.log("currentElementId is " + currentElementId);

    var newElementId = "#" + mainMenuIds[rowIndex][colIndex];

    $("#" + currentElementId).removeClass("btn-primary");
    $("#" + currentElementId).addClass("btn-secondary");

    $(newElementId).removeClass("btn-secondary");
    $(newElementId).addClass("btn-primary");

    $(newElementId).focus();
}


function here (argument) {
	console.log(argument);
}

function togglePlayIcon() {
    console.log("script.js:: togglePlayIcon invoked");
    if (!$("#playIcon").length) {
        console.log("script.js:: display play icon");
        var toAppend = '<span id="playIcon" class="glyphicon glyphicon-play controlIcon" aria-hidden="true"></span>';
        $("#videoControlRegion").append(toAppend);
    } else {
        console.log("script.js:: remove play icon");
        $("#playIcon").remove();
    }
}

function SecondsToHourMinuteLabel(numSeconds) {

    // convert seconds to hh:mm
    var hours = Math.floor(Number(numSeconds) / 3600).toString();
    hours = twoDigitFormat(hours);
    console.log("hours = " + hours);

    var minutes = Math.floor((Number(numSeconds) / 60) % 60).toString();
    minutes = twoDigitFormat(minutes);
    console.log("minutes = " + minutes);

    return hours + ":" + minutes;
}

function UpdateProgressBarGraphics(currentOffset, recordingDuration) {

    // currentOffset in seconds
    console.log('### currentOffset : ' + currentOffset);

    // duration in seconds
    console.log('### recordingDuration : ' + recordingDuration);

    var percentCompleteVal = (currentOffset / recordingDuration * 100);
    var percentComplete = percentCompleteVal.toString() + "%";
    console.log("percentComplete = " + percentComplete);

    $("#progressBarSpan").width(percentComplete);

    // TODO - should retrieve these attributes dynamically
    var leftOffset = 5.5;
    var rightOffset = 89.6;
    var offset = leftOffset + (rightOffset - leftOffset) * (currentOffset / recordingDuration);
    console.log("offset = " + offset);

    // update progress bar position (width is 4%)
    var labelOffset = offset - 4.0 / 2;
    $("#progressBarElapsedTime").css({ left: labelOffset.toString() + '%' });

    // update progress bar position tick (width is 0.25%)
    var tickOffset = offset - 0.25 / 2;
    $("#progressBarTickCurrent").css({ left: tickOffset.toString() + '%' });

    // to show where the tick is when all the way on the left (time=0)
    // var eOffset = leftOffset.toString() + "%";
    // $("#progressBarTickCurrent").css({ left: eOffset });

    // to show where the tick is when all the way on the right
    //var eOffset = rightOffset.toString() + "%";
    //$("#progressBarTickCurrent").css({ left: eOffset });

    var elapsedTimeLabel = SecondsToHourMinuteLabel(currentOffset);
    $("#progressBarElapsedTime").html("<p>" + elapsedTimeLabel + "</p>");

    // TODO - should only need to do this when progress bar is first updated with a recording
    var totalTimeLabel = SecondsToHourMinuteLabel(recordingDuration);
    $("#progressBarTotalTime").html("<p>" + totalTimeLabel + "</p>");

}

function toggleProgressBar(currentOffset, recordingDuration, numMinutes, minutesPerTick, numTicks) {
    if (!$("#progressBar").length) {
        var percentComplete = 50;
        var toAppend = '<div id="progressBar" class="meter"><span id="progressBarSpan" class="meter-span" style="width: ' + percentComplete + '%;"></span></div>';

        var timeLabel = SecondsToHourMinuteLabel(recordingDuration)
        toAppend += '<div id="progressBarTotalTime" class="meterTotalTime"><p>' + timeLabel + '</p></div>';

        // number of ticks to display is basedon the duration of the recording
        //0 < duration <= 5 minutes
        //every 1 minute
        //5 minutes < duration <= 40 minutes
        //every 5 minutes
        //40 minutes < duration <= 1 hour
        //every 10minutes
        //1 hour < duration <= 3 hours
        //every 15 minutes
        //3 hours < duration <= 4 hours
        //every 30 minutes
        //4 hours < duration
        //every hour
        //var numMinutes = Math.floor(recordingDuration / 60);

        //console.log("toggleProgressBar: duration = " + recordingDuration);
        //console.log("toggleProgressBar: numMinutes = " + numMinutes);

        //var numTicks = 8;
        //var minutesPerTick = 1;
        //if (numMinutes > 240) {
        //    minutesPerTick = 60;
        //}
        //else if (numMinutes > 180) {
        //    minutesPerTick = 30;
        //}
        //else if (numMinutes > 60) {
        //    minutesPerTick = 15;
        //}
        //else if (numMinutes > 40) {
        //    minutesPerTick = 10;
        //}
        //else if (numMinutes > 5) {
        //    minutesPerTick = 5;
        //}
        //else {
        //    minutesPerTick = 1;
        //}
        //numTicks = Math.floor(numMinutes / minutesPerTick);

        //console.log("toggleProgressBar: numTicks = " + numTicks);
        //console.log("toggleProgressBar: minutesPerTick = " + minutesPerTick);

        //// determine whether or not to draw last tick - don't draw it if it is at the end of the progress bar
        //if (Math.floor(numMinutes) % (Math.floor(minutesPerTick) * numTicks) == 0) {
        //    numTicks--;
        //}
        //console.log("toggleProgressBar: numTicks = " + numTicks);

        for (i = 1; i <= numTicks; i++) {
            var theId = "progressBarTick" + i.toString()
            toAppend += '<div id=' + theId + ' class="meterTick"><p></p></div>';
        }

        toAppend += '<div id="progressBarElapsedTime" class="meterCurrentPositionLabel"><p>1:00</p></div>';
        toAppend += '<div id="progressBarTickCurrent" class="meterCurrentPositionTick"><p></p></div>';

        $("#videoControlRegion").append(toAppend);

        // TODO - should retrieve these attributes dynamically - good luck with that!!
        var leftOffset = 5.5;
        var rightOffset = 89.6;
        for (i = 1; i <= numTicks; i++) {

            var durationAtTick = i * minutesPerTick;
            var totalDuration = numMinutes;

            var tickOffset = leftOffset + (rightOffset - leftOffset) * (durationAtTick / totalDuration);
            tickOffset = tickOffset - 0.25 / 2; // move to left a little to account for width of tick

            console.log("tickOffset=" + tickOffset.toString());
            $("#progressBarTick" + i.toString()).css({ left: tickOffset.toString() + '%', position: 'absolute' });
        }

        UpdateProgressBarGraphics(currentOffset, recordingDuration);

    } else {
        $("#progressBar").remove();
        $("#progressBarTotalTime").remove();
        $("#progressBarElapsedTime").remove();
        $("#progressBarTickCurrent").remove();

        for (i = 1; i < 8; i++) {
            var theId = "#progressBarTick" + i.toString()
            $(theId).remove();
        }
    }
}

function twoDigitFormat(val) {
    val = '' + val;
    if(val.length === 1) {
        val = '0' + val.slice(-2);
    }
    return val;
}

function setDefaultDateTimeFields () {
	var date = new Date();

	var toAppendDate = "<input id=\"manualRecordDate\"  type=\"date\" class=\"form-control\" value=\"" +  date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate()) + "\">";
	var toAppendTime = "<input id=\"manualRecordTime\" type=\"time\" class=\"form-control\" value=\"" + twoDigitFormat(date.getHours()) + ":" + twoDigitFormat(date.getMinutes()) + "\">";

	if($("#manualRecordDate").length) {   
		$("#manualRecordDate").remove();
		$("#manualRecordTime").remove();
	}

	$("#manualRecordDateId").append(toAppendDate);
	$("#manualRecordTimeId").append(toAppendTime);
}


function createManualRecording() {

    var date = $("#manualRecordDate").val();
    var time = $("#manualRecordTime").val();
    var dateObj = new Date(date + " " + time);
    var duration = $("#manualRecordDuration").val();
    var channel = $("#manualRecordChannel").val();
    var useTuner = !$("#manualRecordAuxInCheckbox").is(':checked');
    var title = $("#manualRecordTitle").val();
    if(!title) {
        title = 'MR ' + dateObj.getFullYear() + "-" + twoDigitFormat((dateObj.getMonth() + 1)) + "-" + twoDigitFormat(dateObj.getDate()) + " " + twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
        if(useTuner) {
            title += " " + channel;
        } else {
            title += " Aux-In";
        }
    }
	
	var aUrl = baseURL + "manualRecord";
	var recordData = {"year" : dateObj.getFullYear(), "month" : dateObj.getMonth(), "day" : dateObj.getDate(), "startTimeHours" : dateObj.getHours(), "startTimeMinutes" : dateObj.getMinutes(), "duration" : duration, "channel" :  channel, "title" : title, "useTuner" : useTuner}

	$.get(aUrl, recordData)
        .done(function (result) {
            console.log("manual record successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("manual record failure");
        })
        .always(function () {
            alert("finished");
        });
}


function executeRecordedShowAction(actionButtonId) {
    if (actionButtonId.lastIndexOf("recording") === 0) {
        console.log("selected recording");
        var recordingId = actionButtonId.substring("recording".length);
        executePlaySelectedShow(recordingId);
    }
    else if (actionButtonId.lastIndexOf("delete") === 0) {
        console.log("selected delete");
        var recordingId = actionButtonId.substring("delete".length);
        executeDeleteSelectedShow(recordingId);
        getRecordedShows();
    }
    else {
        console.log("executeRecordedShowAction - no matching action found for " + actionButtonId);
    }
}

function playSelectedShow(event) {
    var recordingId = event.data.recordingId;
    executePlaySelectedShow(recordingId);
}

function executePlaySelectedShow(recordingId)
{
    console.log("executePlaySelectedShow " + recordingId);

    // save selected show in local storage
    localStorage.setItem("lastSelectedShowId", recordingId.toString());

    var aUrl = baseURL + "recording";

    var recordingData = { "recordingId": recordingId };

    $.get(aUrl, recordingData)
        .done(function (result) {
            console.log("recording successfully sent");
            eraseUI();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("recording failure");
        })
        .always(function () {
            alert("recording transmission finished");
        });
}


function deleteSelectedShow(event) {
    var recordingId = event.data.recordingId;
    executeDeleteSelectedShow(recordingId);
    getRecordedShows();
}

function executeDeleteSelectedShow(recordingId)
{
    console.log("executeDeleteSelectedShow " + recordingId);

    var aUrl = baseURL + "deleteRecording";

    var deleteRecordingData = { "recordingId": recordingId };

    $.get(aUrl, deleteRecordingData)
        .done(function (result) {
            console.log("deleteRecording successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("deleteRecording failure");
        })
        .always(function () {
            alert("deleteRecording transmission finished");
        });
}


function addRecordedShowsLine(jtrRecording) {

    /*
        Play icon
        Delete icon
        Title
        Date
        Day of week
        Info icon
        Position
    */

    // new try for iOS devices

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
        "<td>" + jtrRecording.Title + "</td>" +
        "<td>" + formattedDayDate + "</td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon' id='delete" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-info-sign' aria-hidden='true'></span></button></td>" +
        "<td>" + position + "</td>";

    return toAppend;
}

function getRecordedShows() {
    var aUrl = baseURL + "recordings";

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

            $.each(jtrRecordings, function (index, jtrRecording) {
                toAppend += addRecordedShowsLine(jtrRecording);
                recordingIds.push(jtrRecording.RecordingId);
            });

            // is there a reason do this all at the end instead of once for each row?
            $("#recordedShowsTableBody").append(toAppend);

            recordedPageIds.length = 0;

            // get last selected show from local storage - navigate to it. null if not defined
            var lastSelectedShowId = localStorage.getItem("lastSelectedShowId");

            var focusApplied = false;

            // add button handlers for each recording - note, the handlers need to be added after the html has been added!!
            $.each(recordingIds, function (index, recordingId) {

                // play a recording
                var btnIdRecording = "#recording" + recordingId;
                $(btnIdRecording).click({ recordingId: recordingId }, playSelectedShow);

                // delete a recording
                var btnIdDelete = "#delete" + recordingId;
                $(btnIdDelete).click({ recordingId: recordingId }, deleteSelectedShow);

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
        }
    });
}


function getToDoList() {
	var aUrl = baseURL + "toDoList";

    $.ajax({
        type: "GET",
        url: aUrl
    })
    .done(function( result ) {
        var toAppend = "";

        for (i = 0; i < result.length; i++) {
            toAppend += "<tr id=\"toDoListRow" +  i + " \"><td>date to record</td><td>title</td></tr>";
        }
        $("#recordedShowsTableBody").append(toAppend);
    });
}

function recordedShowDetails (showId) {
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

function getShowTitle (showId) {
	// body...
}

function getShowDescription (showId) {
	// body...
}


function eraseUI() {
    $("#ipAddress").css("display", "none");
    $(currentActiveElementId).css("display", "none");
    $("#footerArea").css("display", "none");
//    $("#footerArea").removeAttr("style");
}


function switchToPage(newPage) {
    bsMessage.PostBSMessage({ message: "switch to " + newPage });

    var newPageId = "#" + newPage;
	$(currentActiveElementId).css("display" ,"none");
	currentActiveElementId = newPageId;
	$(currentActiveElementId).removeAttr("style");
	if(currentActiveElementId == "#homePage") {
	    $("#footerArea").empty();

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
	    $("#ipAddress").css("display", "none");
		$("#footerArea").append("<button class=\"btn btn-primary\" onclick=\"selectHomePage()\">Home</button><br><br>");
	}
}

//keyboard event listener
$(document).ready(function () {

    //baseURL = document.baseURI.replace("?", "");

    console.log("JTR javascript .ready invoked");
    console.log("why isn't baseURL " + document.baseURI.replace("?", ""));

    console.log("User Agent: " + navigator.userAgent);

    // message port
    bsMessage = new BSMessagePort();
    console.log("typeof bsMessage is " + typeof bsMessage);
    bsMessage.PostBSMessage({ message: "javascript ready" });

    bsMessage.onbsmessage = function (msg) {
        console.log("onbsmessage invoked");
        for (name in msg.data) {
            console.log('### ' + name + ': ' + msg.data[name]);

            if (name == "ipAddress") {
                var brightSignIPAddress = msg.data[name];
                $("#ipAddress").html("ip address: " + brightSignIPAddress);
                baseURL = "http://" + brightSignIPAddress + ":8080/";
            }

            else if (name == "bsMessage") {
                var command$ = msg.data[name].toLowerCase();
                if (command$ == "showmenu") {
                    console.log("selectHomePage");
                    selectHomePage();
                    $("#footerArea").removeAttr("style");
                    // $("#footerArea").css("display", "block");

                    // give focus to first element
                    var elementId = "#" + mainMenuIds[0][0];
                    $(elementId).focus();

                }
                else if (command$ == "showrecordedshows") {
                    selectRecordedShows();
                }
                else if (command$ == "exituI") {
                    eraseUI();
                }
                else if (command$ == "promptdelete") {
                    displayDeleteShowDlg(msg.data["showTitle"], msg.data["showRecordingId"]);
                }
                else if (command$ == "toggleplayicon") {
                    togglePlayIcon();
                }
                else if (command$ == "up" || command$ == "down" || command$ == "left" || command$ == "right") {
                    if (modalDialogDisplayed) {
                        console.log("navigation key invoked while modal dialog displayed");

                        // temporary code; make it more general purpose when a second dialog is added
                        console.log("selected element was: " + selectedDeleteShowDlgElement);

                        $(selectedDeleteShowDlgElement).removeClass("btn-primary");
                        $(selectedDeleteShowDlgElement).addClass("btn-secondary");

                        $(unselectedDeleteShowDlgElement).removeClass("btn-secondary");
                        $(unselectedDeleteShowDlgElement).addClass("btn-primary");

                        $(unselectedDeleteShowDlgElement).focus();

                        var tmp = unselectedDeleteShowDlgElement;
                        unselectedDeleteShowDlgElement = selectedDeleteShowDlgElement;
                        selectedDeleteShowDlgElement = tmp;
                    }
                    else {
                        console.log("currentActiveElementId is " + currentActiveElementId);
                        switch (currentActiveElementId) {
                            case "#homePage":
                                console.log("navigation entered while homePage visible");
                                navigateHomePage(command$)
                                break;
                            case "#recordedShowsPage":
                                console.log("navigation entered while recordedShowsPage visible");
                                navigateRecordedShowsPage(command$)
                                break;
                        }
                    }
                }
                else if (command$ == "enter") {
                    if (modalDialogDisplayed) {
                        console.log("enter key invoked while modal dialog displayed");

                        // temporary code; make it more general purpose when a second dialog is added
                        if (selectedDeleteShowDlgElement == "#deleteShowDlgDelete") {
                            deleteShowDlgDeleteInvoked();
                        }
                        else {
                            deleteShowDlgCloseInvoked();
                        }
                    }
                    else {
                        switch (currentActiveElementId) {
                            case "#homePage":
                                var currentElement = document.activeElement;
                                var currentElementId = currentElement.id;
                                console.log("active home page item is " + currentElementId);
                                switch (currentElementId) {
                                    case "channelGuide":
                                        selectChannelGuide();
                                        break;
                                    case "setManualRecord":
                                        selectSetManualRecord();
                                        break;
                                    case "recordedShows":
                                        selectRecordedShows();
                                        break;
                                    case "userSelection":
                                        selectUserSelection();
                                        break;
                                    case "toDoList":
                                        selectToDoList();
                                        break;
                                    case "myPlayVideo":
                                        break;
                                }
                                break;
                            case "#recordedShowsPage":
                                var currentElement = document.activeElement;
                                var currentElementId = currentElement.id;
                                console.log("active recorded shows page item is " + currentElementId);
                                executeRecordedShowAction(currentElementId);
                                break;
                        }
                    }
                }
                else if (command$ == "toggleprogressbar") {

                    // currentOffset in seconds
                    var currentOffset = msg.data["currentOffset"];
                    console.log('### currentOffset : ' + currentOffset);

                    // duration in seconds
                    var recordingDuration = msg.data["recordingDuration"];
                    console.log('### recordingDuration : ' + recordingDuration);

                    var numMinutes = msg.data["numMinutes"];
                    console.log('### numMinutes : ' + numMinutes);

                    var minutesPerTick = msg.data["minutesPerTick"];
                    console.log('### minutesPerTick : ' + recordingDuration);

                    var numTicks = msg.data["numTicks"];
                    console.log('### numTicks : ' + numTicks);

                    toggleProgressBar(currentOffset, recordingDuration, numMinutes, minutesPerTick, numTicks);
                }
                else if (command$ == "updateprogressbar" && $("#progressBar").length) {

                    // currentOffset in seconds
                    var currentOffset = msg.data["currentOffset"];
                    console.log('### currentOffset : ' + currentOffset);

                    // duration in seconds
                    var recordingDuration = msg.data["recordingDuration"];
                    console.log('### recordingDuration : ' + recordingDuration);

                    UpdateProgressBarGraphics(currentOffset, recordingDuration);

                    return;
                }
            }
        }
    }

    // ir receiver
//    ir_receiver = new BSIRReceiver("Iguana", "NEC");
//    console.log("typeof ir_receiver is " + typeof ir_receiver);

//    ir_receiver.onremotedown = function (e) {
//        console.log('############ onremotedown: ' + e.irType + " - " + e.code);
//    }

//    ir_receiver.onremoteup = function (e) {
//        console.log('############ onremoteup: ' + e.irType + " - " + e.code);
//    }

    $("body").keydown(function (e) {
        console.log(e.which);

        // if(e.which == 9) {
        // 	$("#channelGuide").removeClass("btn-primary");
        // 	$("#recordedShows").addClass("btn-primary");
        // }

        //        if (e.which === 80) { //'p'
        //            if (!$("#playIcon").length) {
        //                var toAppend = '<span id="playIcon" class="glyphicon glyphicon-play controlIcon" aria-hidden="true"></span>';
        //                $("#videoControlRegion").append(toAppend);
        //            } else {
        //                $("#playIcon").remove();
        //            }
        //        } else if (e.which === 72) { //'h'
        //            switchToPage("homePage");
        //        } else if (e.which === 32) { //' '
        //            if (!$("#progressBar").length) {
        //                var percentComplete = 25;
        //                var toAppend = '<div id="progressBar" class="meter"><span class="meter-span" style="width: ' + percentComplete + '%;"></span></div>';
        //                $("#videoControlRegion").append(toAppend);
        //            } else {
        //                $("#progressBar").remove();
        //            }

        //        }

    });
});