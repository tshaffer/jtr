function displayEngineStateMachine() {

    HSM.call(this); //call super constructor.

    this.InitialPseudoStateHandler = this.InitializeDisplayEngineHSM;

    this.stTop = new HState(this, "Top");
    this.stTop.HStateEventHandler = STTopEventHandler;

    this.stShowingUI = new HState(this, "ShowingUI")
    this.stShowingUI.HStateEventHandler = this.STShowingUIEventHandler
    this.stShowingUI.superState = this.stTop

    this.stShowingVideo = new HState(this, "ShowingVideo")
    this.stShowingVideo.HStateEventHandler = this.STShowingVideoEventHandler
    this.stShowingVideo.superState = this.stTop

    this.stPlaying = new HState(this, "Playing")
    this.stPlaying.HStateEventHandler = this.STPlayingEventHandler
    this.stPlaying.superState = this.stShowingVideo

    this.stPaused = new HState(this, "Paused")
    this.stPaused.HStateEventHandler = this.STPausedEventHandler
    this.stPaused.superState = this.stShowingVideo

    this.stFastForwarding = new HState(this, "FastForwarding")
    this.stFastForwarding.HStateEventHandler = this.STFastForwardingEventHandler
    this.stFastForwarding.superState = this.stShowingVideo

    this.stRewinding = new HState(this, "Rewinding")
    this.stRewinding.HStateEventHandler = this.STRewindingEventHandler
    this.stRewinding.superState = this.stShowingVideo

    this.topState = this.stTop;
}

//subclass extends superclass
displayEngineStateMachine.prototype = Object.create(HSM.prototype);
displayEngineStateMachine.prototype.constructor = displayEngineStateMachine;


displayEngineStateMachine.prototype.InitializeDisplayEngineHSM = function () {

    console.log("InitializeDisplayEngineHSM invoked");

    return this.stShowingUI;
}


displayEngineStateMachine.prototype.STShowingUIEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    // events to expect include
    //      user chooses play, etc. from Recorded Shows page (SELECT)
    //      remote navigation commands
    //          MENU, EXIT, RECORDED_SHOWS, UP, DOWN, LEFT, RIGHT, SELECT
    // TODO - should support PLAY if a show is highlighted
    else if (event["EventType"] == "PLAY_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        executePlaySelectedShow(recordingId);
        stateData.nextState = this.stateMachine.stPlaying
        return "TRANSITION"
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);

        switch (eventData) {
            case "UP":
            case "DOWN":
            case "LEFT":
            case "RIGHT":
                var command = eventData.toLowerCase();
                console.log("currentActiveElementId is " + currentActiveElementId);
                switch (currentActiveElementId) {
                    case "#homePage":
                        console.log("navigation remote key pressed while homePage visible");
                        navigateHomePage(command)
                        break;
                    case "#recordedShowsPage":
                        console.log("navigation remote key pressed while recordedShowsPage visible");
                        navigateRecordedShowsPage(command)
                        break;
                }
                return "HANDLED";
                break;
            case "SELECT":
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
                        // for play, could just call executePlaySelectedShow

                        // TODO - only do transition when command is Play (not delete)
                        stateData.nextState = this.stateMachine.stPlaying
                        return "TRANSITION"

                        break;
                }
                break;
        }
    }
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


function calculateProgressBarParameters() {

    // number of ticks to display is based on the duration of the recording
    // 0 < duration <= 5 minutes
    // every 1 minute
    // 5 minutes < duration <= 40 minutes
    // every 5 minutes
    // 40 minutes < duration <= 1 hour
    // every 10 minutes
    // 1 hour < duration <= 3 hours
    // every 15 minutes
    // 3 hours < duration <= 4 hours
    // every 30 minutes
    // 4 hours < duration
    // every hour
    var recordingDuration = _currentRecording.Duration * 60
    var numMinutes = Math.floor(recordingDuration / 60);

    console.log("toggleProgressBar: duration = " + _currentRecording.Duration);
    console.log("toggleProgressBar: numMinutes = " + numMinutes);

    var numTicks = 8;
    var minutesPerTick = 1;
    if (numMinutes > 240) {
        minutesPerTick = 60;
    }
    else if (numMinutes > 180) {
        minutesPerTick = 30;
    }
    else if (numMinutes > 60) {
        minutesPerTick = 15;
    }
    else if (numMinutes > 40) {
        minutesPerTick = 10;
    }
    else if (numMinutes > 5) {
        minutesPerTick = 5;
    }
    else {
        minutesPerTick = 1;
    }
    numTicks = Math.floor(numMinutes / minutesPerTick);

    console.log("toggleProgressBar: numTicks = " + numTicks);
    console.log("toggleProgressBar: minutesPerTick = " + minutesPerTick);

    // determine whether or not to draw last tick - don't draw it if it is at the end of the progress bar
    if (Math.floor(numMinutes) % (Math.floor(minutesPerTick) * numTicks) == 0) {
        numTicks--;
    }
    console.log("toggleProgressBar: numTicks = " + numTicks);

    var params = {};
    params.currentOffset = 0;
    params.recordingDuration = recordingDuration;
    params.numMinutes = numMinutes;
    params.minutesPerTick = minutesPerTick;
    params.numTicks = numTicks;

    return params;

}


function toggleProgressBarNew(currentOffset, recordingDuration, numMinutes, minutesPerTick, numTicks) {

    if (!$("#progressBar").length) {
        var percentComplete = 50;
        var toAppend = '<div id="progressBar" class="meter"><span id="progressBarSpan" class="meter-span" style="width: ' + percentComplete + '%;"></span></div>';

        var timeLabel = SecondsToHourMinuteLabel(recordingDuration)
        toAppend += '<div id="progressBarTotalTime" class="meterTotalTime"><p>' + timeLabel + '</p></div>';

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

displayEngineStateMachine.prototype.STShowingVideoEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);

        switch (eventData) {
            case "MENU":
                console.log("display the main menu");

                // TODO - undisplay overlay graphics

                selectHomePage();
                $("#footerArea").removeAttr("style");
                // $("#footerArea").css("display", "block");

                // give focus to first element
                var elementId = "#" + mainMenuIds[0][0];
                $(elementId).focus();

                stateData.nextState = this.stateMachine.stShowingUI
                return "TRANSITION";

                break;
            case "RECORDED_SHOWS":
                console.log("display recorded shows");
                break;
            case "PROGRESS_BAR":
                console.log("toggle the progress bar");
                var params = calculateProgressBarParameters();
                toggleProgressBarNew(params.currentOffset, params.recordingDuration, params.numMinutes, params.minutesPerTick, params.numTicks);
                break;

        }
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    // events to expect include
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.STPlayingEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    // events to expect include
    //      PAUSE
    //      FF
    //      RW
    //      INSTANT_REPLAY
    //      QUICK_SKIP
    //      MENU
    //      STOP
    //      RECORDED_SHOWS
    //      JUMP
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);
        switch (eventData) {
            case "PAUSE":
                executeRemoteCommand("pause");
                stateData.nextState = this.stateMachine.stPaused
                return "TRANSITION";
            case "FF":
                stateData.nextState = this.stateMachine.stFastForwarding
                return "TRANSITION";
            case "RW":
                stateData.nextState = this.stateMachine.stRewinding
                return "TRANSITION";
            case "INSTANT_REPLAY":
                executeRemoteCommand("instantReplay");
                return "HANDLED";
            case "QUICK_SKIP":
                executeRemoteCommand("quickSkip");
                return "HANDLED";
            case "MENU":
                // TODO
            case "STOP":
                // TODO
            case "RECORDED_SHOWS":
                // TODO
            case "JUMP":
                // TODO
        }
    }
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.STPausedEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    // events to expect include
    //  PAUSE
    //  PLAY
    //  INSTANT_REPLAY
    //  QUICK_SKIP
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);
        switch (eventData) {
            case "PAUSE":
            case "PLAY":
                executeRemoteCommand("play");
                stateData.nextState = this.stateMachine.stPlaying
                return "TRANSITION";
            case "QUICK_SKIP":
                executeRemoteCommand("quickSkip");
                return "HANDLED";
            case "INSTANT_REPLAY":
                executeRemoteCommand("instantReplay");
                return "HANDLED";
        }
    }
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.STFastForwardingEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        executeRemoteCommand("fastForward");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    // events to expect include
    //  FF
    //  PLAY
    //  PAUSE
    //  INSTANT_REPLAY
    //  QUICK_SKIP
    //  MENU
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);
        switch (eventData) {
            case "PAUSE":
                executeRemoteCommand("pause");
                stateData.nextState = this.stateMachine.stPaused
                return "TRANSITION";
            case "FF":
                executeRemoteCommand("nextFastForward");
                return "HANDLED"
            case "INSTANT_REPLAY":
                // TODO
                //executeRemoteCommand("instantReplay");
                //return "HANDLED";
            case "QUICK_SKIP":
                // TODO
                //executeRemoteCommand("quickSkip");
                //return "HANDLED";
            case "MENU":
                // TODO
            default:
                return "HANDLED";
        }
    }
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.STRewindingEventHandler = function (event, stateData) {
    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        executeRemoteCommand("rewind");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
        // events to expect include
        //  RW
        //  PLAY
        //  PAUSE
        //  INSTANT_REPLAY
        //  QUICK_SKIP
        //  MENU
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);
        switch (eventData) {
            case "PAUSE":
                executeRemoteCommand("pause");
                stateData.nextState = this.stateMachine.stPaused
                return "TRANSITION";
            case "RW":
                executeRemoteCommand("nextRewind");
                return "HANDLED"
            case "INSTANT_REPLAY":
                // TODO
                //executeRemoteCommand("instantReplay");
                //return "HANDLED";
            case "QUICK_SKIP":
                // TODO
                //executeRemoteCommand("quickSkip");
                //return "HANDLED";
            case "MENU":
            // TODO
            default:
                return "HANDLED";
        }
    }
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}



