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
                        console.log("navigation entered while homePage visible");
                        navigateHomePage(command)
                        break;
                    case "#recordedShowsPage":
                        console.log("navigation entered while recordedShowsPage visible");
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


displayEngineStateMachine.prototype.STShowingVideoEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        return "HANDLED";
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
                executeRemoteCommand("fastForward");
                stateData.nextState = this.stateMachine.stPaused
                return "TRANSITION";
            case "RW":
                executeRemoteCommand("rewind");
                stateData.nextState = this.stateMachine.stPaused
                return "TRANSITION";
            case "INSTANT_REPLAY":
                executeRemoteCommand("instantReplay");
                return "HANDLED";
            case "QUICK_SKIP":
                executeRemoteCommand("quickSkip");
                return "HANDLED";
            case "MENU":
            case "STOP":
            case "RECORDED_SHOWS":
            case "JUMP":
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
    //      PAUSE
    //      FF
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);
        switch (eventData) {
            case "PAUSE":
            case "PLAY":
                executeRemoteCommand("play");
                stateData.nextState = this.stateMachine.stPlaying
                return "TRANSITION";
        }
    }
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


