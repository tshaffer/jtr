var currentActiveElementId = "#homePage";
var baseURL = "http://192.168.2.9:8080/";
//var baseURL = "http://192.168.2.12:8080/";
//var baseURL = "http://10.1.0.134:8080/";
var converter;  //xml to JSON singleton object

function XML2JSON(xml) {
    if (!converter) {
        converter = new X2JS();
    }
    return converter.xml2json(xml);
}


function setNav() {

}


function selectChannelGuide() {

}

function selectRecordedShows() {
	switchToPage("recordedShowsPage");
	getRecordedShows();
}

function selectToDoList() {
	switchToPage("toDoListPage");
	getToDoList();
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

function executeRemoteCommand(endPoint) {

    var aUrl = baseURL + endPoint;

    $.get(aUrl, {})
        .done(function (result) {
            console.log("remote command successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("remote command failure");
        })
        .always(function () {
            //alert("remote command transmission finished");
        });
}

function remotePause() {

    console.log("remotePause");
    executeRemoteCommand("pause");
}

function remotePlay() {

    console.log("remotePlay");
    executeRemoteCommand("play");
}

function remoteInstantReplay() {

    console.log("remoteInstantReplay");
    executeRemoteCommand("instantReplay");
}

function remoteQuickSkip() {

    console.log("remoteQuickSkip");
    executeRemoteCommand("quickSkip");
}

function here(argument) {
	console.log(argument);
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


function getRecordingTitle() {

    var title = $("#manualRecordTitle").val();
    if (!title) {
        title = 'MR ' + dateObj.getFullYear() + "-" + twoDigitFormat((dateObj.getMonth() + 1)) + "-" + twoDigitFormat(dateObj.getDate()) + " " + twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
        if (useTuner) {
            title += " " + channel;
        } else {
            title += " Aux-In";
        }
    }

    return title;
}

function recordNow() {

    var title = getRecordingTitle();
    var duration = $("#manualRecordDuration").val();
    
    var aUrl = baseURL + "recordNow";
    var recordData = { "duration": duration, "title": title }

    $.get(aUrl, recordData)
        .done(function (result) {
            console.log("record now successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("record now failure");
        })
        .always(function () {
            alert("finished");
        });
}

function createManualRecording() {

    var title = getRecordingTitle();
    var date = $("#manualRecordDate").val();
    var time = $("#manualRecordTime").val();
    var dateObj = new Date(date + " " + time);
    var duration = $("#manualRecordDuration").val();
    var channel = $("#manualRecordChannel").val();
    var useTuner = !$("#manualRecordAuxInCheckbox").is(':checked');
	
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


function playSelectedShow(event) {
    var recordingId = event.data.recordingId;
    console.log("playSelectedShow " + recordingId);

    var aUrl = baseURL + "recording";

    var recordingData = { "recordingId": recordingId };

    $.get(aUrl, recordingData)
        .done(function (result) {
            console.log("recording successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("recording failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });
}


function deleteSelectedShow(event) {
    var recordingId = event.data.recordingId;
    console.log("deleteSelectedShow " + recordingId);

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
            //alert("deleteRecording transmission finished");
        });
}


function addRecordedShowsLine(jtrRecording) {
    var toAppend = "<tr><td><button type='button' class='btn btn-default' id='recording" + jtrRecording.recordingId + "' aria-label='Left Align'><span class='glyphicon glyphicon-play-circle' aria-hidden='true'></span></button></td>" +

	            "<td><button type='button' class='btn btn-default' id='delete" + jtrRecording.recordingId + "' aria-label='Left Align'><span class='glyphicon glyphicon-remove' aria-hidden='true'></span></button></td>" +
    //                "<td>" + result[i].series + "</td>" +
    //                "<td>" + result[i].episode + "</td>" +
                "<td>" + jtrRecording.title + "</td>" +
                "<td>" + "" + "</td>" +
                "<td>" + jtrRecording.startDateTime + "</td>" +
    //                "<td>" + result[i].lastPlayedDate + "</td>" +
                "<td>" + "" + "</td>" +
                "<td>" + jtrRecording.duration + "</td>" +
    //                "<td>" + result[i].channel + "</td></tr>";
	            "<td>" + "" + "</td></tr>";

    return toAppend;
}

function getRecordedShows() {
	var aUrl = baseURL + "recordings";

	$.ajax({
	    type: "GET",
	    url: aUrl,
	    dataType: "xml",
	    success: function (xml) {
	        var recordings = XML2JSON(xml);

	        var jtrRecordings = recordings.BrightSignRecordings.BrightSignRecording;

	        var toAppend = "";
	        var recordingIds = [];

	        if (jtrRecordings.constructor == Array) {
	            $.each(jtrRecordings, function (index, jtrRecording) {
	                toAppend += addRecordedShowsLine(jtrRecording);
	                recordingIds.push(jtrRecording.recordingId);
	            });
	        }
	        else {
	            jtrRecording = jtrRecordings;
	            toAppend += addRecordedShowsLine(jtrRecording);
	            recordingIds.push(jtrRecording.recordingId);
	        }

	        // is there a reason do this all at the end instead of once for each row?
	        $("#recordedShowsTableBody").append(toAppend);

	        // add button handlers for each recording - note, the handlers need to be added after the html has been added!!
	        $.each(recordingIds, function (index, recordingId) {

	            // play a recording
	            var btnId = "#recording" + recordingId;
	            $(btnId).click({ recordingId: recordingId }, playSelectedShow);

	            // delete a recording
	            btnId = "#delete" + recordingId;
	            $(btnId).click({ recordingId: recordingId }, deleteSelectedShow);
	        });
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

function switchToPage(newPage) {
	var newPageId = "#" + newPage;
	$(currentActiveElementId).css("display" ,"none");
	currentActiveElementId = newPageId;
	$(currentActiveElementId).removeAttr("style");
	if(currentActiveElementId == "#homePage") {
		$("#footerArea").empty();
	} else {
		$("#footerArea").append("<button class=\"btn btn-primary\" onclick=\"selectHomePage()\">Home</button><br><br>");
	}

}


function displayEngine() {
    
    HSM.call(this); //call super constructor.

    this.InitialPseudoStateHandler = InitializeDisplayEngineStateMachine;

    this.stTop = new HState(this, "Top");
    this.stTop.HStateEventHandler = STTopEventHandler;

    this.stShowingUI = new HState(this, "ShowingUI");
    this.stShowingUI.HStateEventHandler = STShowingUIEventHandler;
    this.stShowingUI.superState = this.stTop;

    this.stShowingVideo = new HState(this, "ShowingVideo");
    this.stShowingVideo.HStateEventHandler = STShowingVideoEventHandler;
    this.stShowingVideo.superState = this.stTop;

    this.stPlaying = new HState(this, "Playing");
    this.stPlaying.HStateEventHandler = STPlayingEventHandler;
    this.stPlaying.superState = this.stShowingVideo;

    this.stPaused = new HState(this, "Paused");
    this.stPaused.HStateEventHandler = STPausedEventHandler;
    this.stPaused.superState = this.stShowingVideo;

    this.stFastForwarding = new HState(this, "FastForwarding");
    this.stFastForwarding.HStateEventHandler = STFastForwardingEventHandler;
    this.stFastForwarding.superState = this.stShowingVideo;

    this.stRewinding = new HState(this, "Rewinding");
    this.stRewinding.HStateEventHandler = STRewindingEventHandler;
    this.stRewinding.superState = this.stShowingVideo;

    this.topState = this.stTop;
}

//subclass extends superclass
displayEngine.prototype = Object.create(HSM.prototype);
displayEngine.prototype.constructor = displayEngine;

function STShowingUIEventHandler(event, stateData) {

    debugger;

    stateData.nextState = null;

    // TODO how to tell if the event is an internal event (or other type of event)?
    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }

    stateData.nextState = this.superState
    return "SUPER"
}

function STShowingVideoEventHandler() {
}

function STPlayingEventHandler() {
}

function STPausedEventHandler() {
}

function STFastForwardingEventHandler() {
}

function STRewindingEventHandler() {
}

function InitializeDisplayEngineStateMachine() {

    console.log("InitializeDisplayEngineStateMachine invoked");

    return this.stShowingUI;
}

//keyboard event listener
$(document).ready(function () {

    debugger;

    var displayEngineStateMachine = new displayEngine();
    displayEngineStateMachine.Initialize();

    $("body").keydown(function (e) {
        console.log(e.which);

        // if(e.which == 9) {
        // 	$("#channelGuide").removeClass("btn-primary");
        // 	$("#recordedShows").addClass("btn-primary");
        // }

        //if (e.which === 80) { //'p'
        //    if (!$("#playIcon").length) {
        //        var toAppend = '<span id="playIcon" class="glyphicon glyphicon-play controlIcon" aria-hidden="true"></span>';
        //        $("#videoControlRegion").append(toAppend);
        //    } else {
        //        $("#playIcon").remove();
        //    }
        //} else if (e.which === 72) { //'h'
        //    switchToPage("homePage");
        //    $("#videoZone").remove();
        //} else if (e.which === 32) { //' '
        //    if (!$("#progressBar").length) {
        //        var percentComplete = 50;
        //        var toAppend = '<div id="progressBar" class="meter"><span id="progressBarSpan" class="meter-span" style="width: ' + percentComplete + '%;"></span></div>';
        //        toAppend += '<div id="progressBarElapsedTime" class="meterCurrentPositionLabel"><p>1:00</p></div>';
        //        toAppend += '<div id="progressBarTotalTime" class="meterTotalTime"><p>2:00</p></div>';

        //        for (i = 1; i < 8; i++) {
        //            var theId = "progressBarTick" + i.toString()
        //            toAppend += '<div id=' + theId + ' class="meterTick"><p></p></div>';
        //        }
        //        toAppend += '<div id="progressBarTickCurrent" class="meterCurrentPositionTick"><p></p></div>';

        //        $("#videoControlRegion").append(toAppend);
        //    } else {
        //        $("#progressBar").remove();
        //        $("#progressBarTotalTime").remove();
        //        $("#progressBarElapsedTime").remove();
        //        $("#progressBarTickCurrent").remove();

        //        for (i = 1; i < 8; i++) {
        //            var theId = "#progressBarTick" + i.toString()
        //            $(theId).remove();
        //        }
        //    }

        //    var leftOffset = 5;
        //    var rightOffset = 90;
        //    for (i = 1; i < 8; i++) {
        //        var tickOffset = leftOffset + (rightOffset - leftOffset) * i / 8.0;
        //        console.log("tickOffset=" + tickOffset.toString());
        //        $("#progressBarTick" + i.toString()).css({ left: tickOffset.toString() + '%', position: 'absolute' });
        //    }

        //    $("#progressBarSpan").width("75%");
        //}
    });
});