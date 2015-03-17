var clientType;
var baseURL;

// BrightSign only
var bsMessage;
var ir_receiver;

var _currentRecordings;
var _currentRecording;

// progress bar parameters
var numTicks;
var numMinutes;
var minutesPerTick;
var currentOffset;
var pbRecordingDuration;

// miscellaneous variables
var currentActiveElementId = "#homePage";

var _showRecordingId;
var recordedPageIds = [];

var modalDialogDisplayed = false;
var selectedDeleteShowDlgElement = "#deleteShowDlgDelete";
var unselectedDeleteShowDlgElement = "#deleteShowDlgClose";

// BrightSign specific functionality
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

// delete dialog - BrightSign only for now
function displayDeleteShowDlg(showTitle, showRecordingId) {

    console.log("displayDeleteShowDlg() invoked, showTitle=" + showTitle + ", showRecordingId=" + showRecordingId);

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

// home page
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

// progress bar
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
    //console.log("currentOffset is " + currentOffset + ", elapsedTimeLabel is " + elapsedTimeLabel);

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

// process action selected from Recorded Shows screens
function executeRecordedShowAction(actionButtonId) {
    if (actionButtonId.lastIndexOf("recording") === 0) {
        console.log("selected recording");
        var recordingId = actionButtonId.substring("recording".length);

        if (recordingId in _currentRecordings) {
            _currentRecording = _currentRecordings[recordingId];
            //executePlaySelectedShow(selectedRecording);
            executePlaySelectedShow(recordingId);
        }
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

// send trick commands to device via message port - this function only exists on the device
function executeRemoteCommand(remoteCommand) {
    console.log("executeRemoteCommand:" + remoteCommand);
    bsMessage.PostBSMessage({ command: "remoteCommand", "remoteCommand": remoteCommand });
}


// HTMLWidget handler - send message to bs to play show (SELECT pressed while Play icon highlighted in Recorded Shows page) or from browser
function executePlaySelectedShow(recordingId) {

    console.log("executePlaySelectedShow " + recordingId);

    // save lastSelectedShowId in server's persistent memory
    var parts = [];
    parts.push("lastSelectedShowId" + '=' + recordingId.toString());
    var paramString = parts.join('&');

    var url = baseURL + "lastSelectedShow";

    $.post(url, paramString);

    eraseUI();

    bsMessage.PostBSMessage({ command: "playRecordedShow", "recordingId": recordingId });
}


function executeDeleteSelectedShow(recordingId) {

    console.log("executeDeleteSelectedShow " + recordingId);

    bsMessage.PostBSMessage({ command: "deleteRecordedShow", "recordingId": recordingId });
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

    if (clientType != "BrightSign") {
        baseURL = document.baseURI.replace("?", "");
        console.log("baseURL from document.baseURI is: " + baseURL);
    }
    else {

        // Create displayEngine state machine
        displayEngineHSM = new displayEngineStateMachine();
        registerStateMachine(displayEngineHSM);
        displayEngineHSM.Initialize();

        // Create recordingEngine state machine
        recordingEngineHSM = new recordingEngineStateMachine();
        registerStateMachine(recordingEngineHSM);
        recordingEngineHSM.Initialize();

        // ir receiver
        ir_receiver = new BSIRReceiver("Iguana", "NEC");
        console.log("typeof ir_receiver is " + typeof ir_receiver);

        ir_receiver.onremotedown = function (e) {
            console.log('############ onremotedown: ' + e.irType + " - " + e.code);
            console.log('############ onremotedown: remoteCommand=' + GetRemoteCommand(e.code));

            var event = {};
            event["EventType"] = "REMOTE";
            event["EventData"] = GetRemoteCommand(e.code);
            postMessage(event);
        }

        ir_receiver.onremoteup = function (e) {
            console.log('############ onremoteup: ' + e.irType + " - " + e.code);
        }

        // message port for getting messages from the BrightSign via roMessagePort
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
                    console.log("baseURL from BrightSign message is: " + baseURL);
                }
                else if (name == "remoteCommand") {
                    var remoteCommand = msg.data[name];
                    console.log("remoteCommand: " + remoteCommand);

                    var event = {};
                    event["EventType"] = "REMOTE";
                    event["EventData"] = remoteCommand;
                    postMessage(event);
                }
                else if (name == "commandPlayRecordedShow") {
                    var recordingId = msg.data[name];
                    console.log("playRecordedShow " + recordingId);

                    var event = {};
                    event["EventType"] = "PLAY_RECORDED_SHOW";
                    event["EventData"] = recordingId;
                    postMessage(event);
                }
                else if (name == "commandDeleteRecordedShow") {
                    var recordingId = msg.data[name];
                    console.log("deleteRecordedShow " + recordingId);

                    var event = {};
                    event["EventType"] = "DELETE_RECORDED_SHOW";
                    event["EventData"] = recordingId;
                    postMessage(event);
                }
                else if (name.lastIndexOf("commandRecordNow") == 0) {
                    console.log("commandRecordNow invoked");
                    var parameterValue = msg.data[name];
                    if (name == "commandRecordNow[duration]") {
                        recordingDuration = parameterValue;
                        console.log("duration=" + recordingDuration);
                    }
                    else if (name == "commandRecordNow[title]") {
                        recordingTitle = parameterValue;
                        console.log("title=" + recordingTitle);

                        // hack? title is the last parameter so post message now
                        var event = {}
                        event["EventType"] = "RECORD_NOW";
                        event["Title"] = recordingTitle;
                        event["Duration"] = recordingDuration;
                        postMessage(event);
                    }
                }
                else if (name == "bsMessage") {
                    var command$ = msg.data[name].toLowerCase();
                    if (command$ == "updateprogressbar" && $("#progressBar").length) {

                        console.log("UPDATEPROGRESSBAR ********************************************************");
                        // currentOffset in seconds
                        currentOffset = msg.data["currentOffset"];
                        console.log('### currentOffset : ' + currentOffset);

                        // duration in seconds
                        pbRecordingDuration = msg.data["recordingDuration"];
                        console.log('### recordingDuration : ' + pbRecordingDuration);

                        UpdateProgressBarGraphics(currentOffset, pbRecordingDuration);

                        return;
                    }
                }
            }
        }
    }
});