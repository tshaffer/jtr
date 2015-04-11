function uiEngineStateMachine() {

    HSM.call(this); //call super constructor.

    this.InitialPseudoStateHandler = this.InitializeUIEngineHSM;

    this.stTop = new HState(this, "Top");
    this.stTop.HStateEventHandler = STTopEventHandler;

    this.stNone = new HState(this, "None");
    this.stNone.HStateEventHandler = this.STNoneEventHandler;
    this.stNone.superState = this.stTop;

    this.stMainMenu = new HState(this, "MainMenu");
    this.stMainMenu.HStateEventHandler = this.STMainMenuEventHandler;
    this.stMainMenu.superState = this.stTop;

    this.topState = this.stTop;
}

//subclass extends superclass
uiEngineStateMachine.prototype = Object.create(HSM.prototype);
uiEngineStateMachine.prototype.constructor = uiEngineStateMachine;


uiEngineStateMachine.prototype.InitializeUIEngineHSM = function () {

    console.log("InitializeUIEngineHSM invoked");

    this.currentRecording = null;
    this.priorSelectedRecording = null;

    return this.stMainMenu;
}


uiEngineStateMachine.prototype.STNoneEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");

        eraseUI();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


uiEngineStateMachine.prototype.STMainMenuEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");

        selectHomePage();
        $("#footerArea").css("display", "none");

        // give focus to first element
        var elementId = "#" + mainMenuIds[0][0];
        $(elementId).focus();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }

    stateData.nextState = this.superState;
    return "SUPER";
}

