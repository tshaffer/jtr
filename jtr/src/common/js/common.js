define(["placeholder"], function (placeholder) {

    return {
        
        clientType: "",
        browserTypeIsSafari: false,
        
        baseURL: "",
        baseIP: "",
    
        _settingsRetrieved: false,
        _settings: { recordingBitRate: 10, segmentRecordings: 0 },

        _currentRecordings: {},
        
        currentActiveElementId: "#homePage",
        
        recordedPageIds: [],
        scheduledRecordingIds: [],
        
        cgPopupId: "",
        cgPopupTitle: "",
        cgPopupElements: null,
        cgPopupHandlers: null,
        
        cgRecordEpisodeId: null,
        cgRecordSeriesId: null,
        cgTuneEpisodeId: null,
        cgCloseEpisodeId: null,
        
        cgRecordSetOptionsId: null,
        cgRecordViewUpcomingEpisodesId: null,
        cgCancelRecordingId: null,
        cgCancelSeriesId: null,
        
        cgSelectedStationId: null,
        cgSelectedProgram: null,
        cgPopupSelectedIndex: null,
    
        cgPopupEpisodeElements: ["#cgProgramRecord", "#cgProgramRecordSetOptions", "#cgProgramViewUpcomingEpisodes", "#cgProgramTune", "#cgProgramClose"],
        cgPopupEpisodeHandlers: [this.cgRecordSelectedProgram, this.cgRecordProgramSetOptions, this.cgRecordProgramViewUpcomingEpisodes, this.cgTune, this.cgModalClose],
    
        cgPopupScheduledProgramElement: ["#cgCancelScheduledRecording", "#cgScheduledRecordChangeOptions", "#cgScheduledRecordingViewUpcomingEpisodes", "#cgScheduledRecordingTune", "#cgScheduledRecordingClose"],
        cgPopupScheduledProgramHandlers: [this.cgCancelScheduledRecording, this.cgChangeScheduledRecordingOptions, this.cgScheduledRecordingViewUpcomingEpisodes, this.cgScheduledRecordingTune, this.cgScheduledRecordingClose],
        
        cgPopupSeriesElements: ["#cgEpisodeRecord", "cgSeriesRecordSetProgramOptions", "#cgSeriesRecord", "#cgSeriesTune", "#cgSeriesClose"],
        cgPopupSeriesHandlers: [this.cgRecordSelectedProgram, this.cgRecordProgramSetOptions, this.cgRecordSelectedSeries, this.cgTune, this.cgModalClose],
        
        cgPopupScheduledSeriesElements: ["cgSeriesCancelEpisode", "cgSeriesCancelSeries", "cgSeriesViewUpcoming", "cgSeriesRecordingTune", "cgSeriesRecordingClose"],
        cgPopupSchedulesSeriesHandlers: [this.cgCancelScheduledRecording, this.cgCancelScheduledSeries, this.cgScheduledSeriesViewUpcoming, this.cgTune, this.cgModalClose],
        
        stopTimeOptions: ["30 minutes early", "15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late", "30 minute late", "1 hour late", "1 1/2 hours late", "2 hours late", "3 hours late"],
        stopTimeOffsets: [-30, -15, -10, -5, 0, 5, 10, 15, 30, 60, 90, 120, 180],
    
        stopTimeOnTimeIndex: 4,
        stopTimeIndex: null,
    
        startTimeOptions: ["15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late"],
        startTimeOnTimeIndex: 3,
        startTimeOffsets: [-15, -10, -5, 0, 5, 10, 15],
        startTimeIndex: null,

// home page
        mainMenuIds: [
            ['recordedShows', 'liveVideo'],
            ['recordNow', 'channelGuide'],
            ['manualRecord', 'toDoList'],
            ['', 'settings']
        ],

        addMinutes: function(date, minutes) {
            return new Date(date.getTime() + minutes * 60000);
        },

        addMilliseconds: function(date, milliseconds) {
            return new Date(date.getTime() + milliseconds);
        },

        msecToMinutes: function (msec) {
            return msec / 60000;
        },

        minutesToMsec: function (minutes) {
            return minutes * 60000;
        },

        switchToPage: function (newPage) {

            var newPageId = "#" + newPage;
            $(this.currentActiveElementId).css("display", "none");
            this.currentActiveElementId = newPageId;
            $(this.currentActiveElementId).removeAttr("style");
            if (this.currentActiveElementId == "#homePage") {
                this.setFooterVisibility(true, false)
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
                this.setFooterVisibility(true, true)
                $("#ipAddress").css("display", "none");
            }
        },


        selectHomePage: function () {
            this.switchToPage("homePage");
        },


        selectRecordedShows: function () {
            this.switchToPage("recordedShowsPage");
            getRecordedShows();
        },


        getRecordedShows: function () {

            console.log("getRecordedShows() invoked");

            var aUrl = this.baseURL + "getRecordings";

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

                    this._currentRecordings = {};

                    $.each(jtrRecordings, function (index, jtrRecording) {
                        toAppend += addRecordedShowsLine(jtrRecording);
                        recordingIds.push(jtrRecording.RecordingId);
                        this._currentRecordings[jtrRecording.RecordingId] = jtrRecording;
                    });

                    // is there a reason to do this all at the end instead of once for each row?
                    $("#recordedShowsTableBody").append(toAppend);

                    this.recordedPageIds.length = 0;

                    // get last selected show from local storage - navigate to it. null if not defined
                    var url = this.baseURL + "lastSelectedShow";

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
                                this.recordedPageIds.push(recordedPageRow);

                            });

                            if (!focusApplied) {
                                // REQUIREDTODO
                                $(this.recordedPageIds[0][0]).focus();
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
        },


        addRecordedShowsLine: function (jtrRecording) {

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
                "<td>" + position + "</td>" +
                "</tr>";

            return toAppend;
        },


        retrieveSettings: function (nextFunction) {

            // get settings from db
            var url = this.baseURL + "getSettings";
            $.get(url, {})
                .done(function (result) {
                    consoleLog("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX retrieveSettings success ************************************");
                    this._settingsRetrieved = true;
                    this._settings.recordingBitRate = result.RecordingBitRate;
                    this._settings.segmentRecordings = result.SegmentRecordings;
                    nextFunction();
                })
            .fail(function (jqXHR, textStatus, errorThrown) {
                debugger;
                console.log("getSettings failure");
            })
            .always(function () {
            });
        },

        selectSettings: function () {

            this.switchToPage("settingsPage");

            // REQUIREDTODO
            consoleLog("selectSettings invoked");

            this.retrieveSettings(initializeSettingsUIElements);

            $(".recordingQuality").change(function () {
                this._settings.recordingBitRate = $('input:radio[name=recordingQuality]:checked').val();
                this.updateSettings();
            });

            $("#segmentRecordingsCheckBox").change(function () {
                var segmentRecordings = $("#segmentRecordingsCheckBox").is(':checked');
                this._settings.segmentRecordings = segmentRecordings ? 1 : 0;
                this.updateSettings();
            });
        },


        initializeSettingsUIElements: function () {

            // initialize UI on settings page
            // TODO - don't hard code these values; read through html
            switch (this._settings.recordingBitRate) {
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

            switch (this._settings.segmentRecordings) {
                case 0:
                    $("#segmentRecordingsCheckBox").prop('checked', false);
                    break;
                case 1:
                    $("#segmentRecordingsCheckBox").prop('checked', true);
                    break;
            }
        },

        updateSettings: function () {
            var url = this.baseURL + "setSettings";
            var settingsData = { "recordingBitRate": this._settings.recordingBitRate, "segmentRecordings": this._settings.segmentRecordings };
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
        },


        selectToDoList: function () {
            this.switchToPage("toDoListPage");
            this.getToDoList();
        },


        getToDoList: function () {

            console.log("getToDoList() invoked");

            var getStationsPromise = new Promise(function (resolve, reject) {

                var aUrl = this.baseURL + "getStations";

                $.get(
                    aUrl
                ).then(function (stations) {
                        resolve(stations);
                    }, function () {
                        reject();
                    });
            });

            getStationsPromise.then(function(stations) {

                var aUrl = this.baseURL + "getScheduledRecordings";
                var currentDateTimeIso = new Date().toISOString();
                var currentDateTime = { "currentDateTime": currentDateTimeIso };

                $.get(aUrl, currentDateTime)
                    .done(function (scheduledRecordings) {
                        console.log("getScheduledRecordings success");

                        // display scheduled recordings
                        var toAppend = "";

                        $("#scheduledRecordingsTableBody").empty();

                        $.each(scheduledRecordings, function (index, scheduledRecording) {
                            toAppend += addScheduledRecordingShowLine(scheduledRecording, stations);
                        });

                        $("#scheduledRecordingsTableBody").append(toAppend);

                        this.scheduledRecordingIds.length = 0;

                        // add button handlers for each recording - note, the handlers need to be added after the html has been added!!
                        $.each(scheduledRecordings, function (index, scheduledRecording) {

                            var scheduledRecordingId = scheduledRecording.Id;

                            // only one of the next two handlers can be invoked - that is, either btnIdStop or btnIdDelete exists

                            // stop an active recording
                            var btnIdStop = "#stop" + scheduledRecordingId;
                            // REQUIREDTODO
                            $(btnIdStop).click({ scheduledRecordingId: scheduledRecordingId }, stopActiveRecording);

                            // delete a scheduled recording
                            var btnIdDelete = "#delete" + scheduledRecordingId;
                            // REQUIREDTODO
                            $(btnIdDelete).click({ scheduledRecordingId: scheduledRecordingId }, deleteScheduledRecordingHandler);

                            var scheduledRecordingRow = [];
                            scheduledRecordingRow.push(btnIdDelete);
                            this.scheduledRecordingIds.push(scheduledRecordingRow);
                        });
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        debugger;
                        console.log("browserCommand failure");
                    })
                    .always(function () {
                        //alert("recording transmission finished");
                    });
            });
        },

        addScheduledRecordingShowLine: function (scheduledRecording, stations) {

            /*
            Delete / Stop icon
            DayOfWeek
            Date
            Time
            Channel
            Station Name
            Title
             */

            var weekday = new Array(7);
            weekday[0] = "Sun";
            weekday[1] = "Mon";
            weekday[2] = "Tue";
            weekday[3] = "Wed";
            weekday[4] = "Thu";
            weekday[5] = "Fri";
            weekday[6] = "Sat";

            var currentDateTime = new Date();
            var date = new Date(scheduledRecording.DateTime);
            var endDateTime = new Date(scheduledRecording.EndDateTime);

            var clickAction = "delete";
            var icon = 'glyphicon-remove';
            if (date <= currentDateTime && currentDateTime < endDateTime) {
                clickAction = "stop";
                icon = 'glyphicon-stop';
            }

            var dayOfWeek = weekday[date.getDay()];

            var monthDay = (date.getMonth() + 1).toString() + "/" + date.getDate().toString();

            var amPM = "am";

            var numHours = date.getHours();
            if (numHours == 0)
            {
                numHours = 12;
            }
            else if (numHours > 12) {
                numHours -= 12;
                amPM = "pm";
            }
            else if (numHours == 12) {
                amPM = "pm";
            }
            var hoursLbl = numHours.toString();
            if (hoursLbl.length == 1) hoursLbl = "&nbsp" + hoursLbl;

            var minutesLbl = twoDigitFormat(date.getMinutes().toString());

            var timeOfDay = hoursLbl + ":" + minutesLbl + amPM;

            var channel = scheduledRecording.Channel;
            var channelParts = channel.split('-');
            if (channelParts.length == 2 && channelParts[1] == "1") {
                channel = channelParts[0];
            }

            var station = getStationFromAtsc(stations, channelParts[0], channelParts[1]);

            var stationName = "TBD";
            if (station != null) {
                stationName = station.CommonName;
            }

            var title = scheduledRecording.Title;

            var toAppend =
                "<tr>" +
                "<td><button type='button' class='btn btn-default recorded-shows-icon' id='" + clickAction + scheduledRecording.Id.toString() + "' aria-label='Left Align'><span class='glyphicon " + icon + "' aria-hidden='true'></span></button></td>" +
                "<td>" + dayOfWeek + "</td>" +
                "<td>" + monthDay + "</td>" +
                "<td>" + timeOfDay + "</td>" +
                "<td>" + channel + "</td>" +
                "<td>" + stationName + "</td>" +
                "<td>" + title + "</td>" +
                "</tr>";

            return toAppend;
        },


        selectLiveVideo: function () {

        },


        setElementVisibility: function (divId, show) {
            if (show) {
                $(divId).show();
            }
            else {
                $(divId).hide();
            }
        },


        selectRecordNow: function () {
            this.switchToPage("recordNowPage");

            $("#rbRecordNowTuner").change(function () {
                this.setElementVisibility("#recordNowChannelDiv", true);
            });

            $("#rbRecordNowRoku").change(function () {
                this.setElementVisibility("#recordNowChannelDiv", false);
            });

            $("#rbRecordNowTivo").change(function () {
                this.setElementVisibility("#recordNowChannelDiv", false);
            });

            this.setDefaultDateTimeFields();
            $("#recordNowTitle").focus();
        },


        selectManualRecord: function () {

            this.switchToPage("manualRecordPage");

            $("#rbManualRecordTuner").change(function () {
                this.setElementVisibility("#manualRecordChannelDiv", true);
            });

            $("#rbManualRecordRoku").change(function () {
                this.setElementVisibility("#manualRecordChannelDiv", false);
            });

            $("#rbManualRecordTivo").change(function () {
                this.setElementVisibility("#manualRecordChannelDiv", false);
            });

            this.setDefaultDateTimeFields();
            $("#manualRecordTitle").focus();
        },


        twoDigitFormat: function (val) {
            val = '' + val;
            if (val.length === 1) {
                val = '0' + val.slice(-2);
            }
            return val;
        },


        setDefaultDateTimeFields: function () {

            var date = new Date();

            var dateVal = date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate());
            $("#manualRecordDate").val(dateVal);

            var timeVal = this.twoDigitFormat(date.getHours()) + ":" + twoDigitFormat(date.getMinutes());
            $("#manualRecordTime").val(timeVal);
        },

        getRecordingTitle: function (titleId, dateObj, inputSource, channel) {

            var title = $(titleId).val();
            if (!title) {
                title = 'MR ' + dateObj.getFullYear() + "-" + this.twoDigitFormat((dateObj.getMonth() + 1)) + "-" + this.twoDigitFormat(dateObj.getDate()) + " " + this.twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
                if (inputSource == "tuner") {
                    title += " Channel " + channel;
                } else if (inputSource == "tivo") {
                    title += " Tivo";
                } else {
                    title += " Roku";
                }
            }

            return title;
        },

        recordedShowDetails: function (showId) {
            // body...
            this.switchToPage("recordedShowDetailsPage");
            var showTitle = this.getShowTitle(showId);
            var showDescription = this.getShowDescription(showId);

            var toAppend = "<h3>" + showTitle + "</h3><br><br>"
                + "<p>" + showDescription + "</p><br><br>"
                + "<button>Play</button><br><br>"
                + "<button>Delete</button>";

            $("#recordedShowDetailsPage").append(toAppend);
        },

        getShowTitle: function (showId) {
            // body...
        },

        getShowDescription: function (showId) {
            // body...
        },


        cgTune: function () {

            // enter live video
            var event = {};
            event["EventType"] = "TUNE_LIVE_VIDEO";
            // REQUIREDTODO
            postMessage(event);

            // tune to selected channel
            // REQUIREDTODO
            var stationName = getStationFromId(this.cgSelectedStationId);
            stationName = stationName.replace(".", "-");
            event["EventType"] = "TUNE_LIVE_VIDEO_CHANNEL";
            event["EnteredChannel"] = stationName;
            // REQUIREDTODO
            postMessage(event);

            return "tune";
        },


        cgTuneFromClient: function () {

            // REQUIREDTODO
            var stationName = getStationFromId(this.cgSelectedStationId);
            stationName = stationName.replace(".", "-");

            var aUrl = this.baseURL + "browserCommand";
            var commandData = { "command": "tuneLiveVideoChannel", "enteredChannel": stationName };
            console.log(commandData);

            $.get(aUrl, commandData)
                .done(function (result) {
                    console.log("browserCommand successfully sent");
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("browserCommand failure");
                })
                .always(function () {
                    //alert("recording transmission finished");
                });
        },


        updateCGProgramDlgSelection: function () {

            for (i = 0; i < this.cgPopupElements.length; i++) {
                $(this.cgPopupElements[i]).removeClass("btn-primary");
                $(this.cgPopupElements[i]).addClass("btn-secondary");
            }

            $(this.cgPopupElements[this.cgPopupSelectedIndex]).removeClass("btn-secondary");
            $(this.cgPopupElements[this.cgPopupSelectedIndex]).addClass("btn-primary");
        },

        // EXTENDOMATIC TODO - do the work associated with extendomatic here
        cgRecordProgram: function () {
            // redundant in some cases (when selected from pop up); not when record button pressed
            // REQUIREDTODO
            var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            this.cgSelectedStationId = programData.stationId;

            var event = {};
            event["EventType"] = "ADD_RECORD";
            event["DateTime"] = this.cgSelectedProgram.date;
            event["Title"] = this.cgSelectedProgram.title;
            event["Duration"] = this.cgSelectedProgram.duration;
            event["InputSource"] = "tuner";
            event["ScheduledSeriesRecordingId"] = this.cgSelectedProgram.scheduledSeriesRecordingId;
            event["StartTimeOffset"] = 0;
            event["StopTimeOffset"] = 0;

            // REQUIREDTODO
            var stationName = getStationFromId(this.cgSelectedStationId);

            stationName = stationName.replace(".", "-");

            event["Channel"] = stationName;

            event["RecordingBitRate"] = this._settings.recordingBitRate;
            event["SegmentRecording"] = this._settings.segmentRecordings;

            // REQUIREDTODO
            postMessage(event);

            return "record";
        },


        cgRecordSelectedProgram: function () {

            // setting this.cgSelectedProgram and this.cgSelectedStationId is redundant in some cases (when selected from pop up); not when record button pressed
            // REQUIREDTODO
            var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            this.cgSelectedStationId = programData.stationId;

            this.cgRecordProgram();
        },

        cgRecordProgramFromClient: function (addRecording, nextFunction) {

            console.log("cgRecordProgramFromClient invoked");

            // REQUIREDTODO
            var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            this.cgSelectedStationId = programData.stationId;

            this.cgSelectedProgram.startTimeOffset = this.startTimeOffsets[this.startTimeIndex];
            this.cgSelectedProgram.stopTimeOffset = this.stopTimeOffsets[this.stopTimeIndex];

            var aUrl = this.baseURL + "browserCommand";

            if (addRecording) {
                // REQUIREDTODO
                var stationName = getStationFromId(this.cgSelectedStationId);
                stationName = stationName.replace(".", "-");

                var commandData = { "command": "addRecord", "dateTime": this.cgSelectedProgram.date, "title": this.cgSelectedProgram.title, "duration": this.cgSelectedProgram.duration,
                    "inputSource": "tuner", "channel": stationName, "recordingBitRate": this._settings.recordingBitRate, "segmentRecording": this._settings.segmentRecordings,
                    "scheduledSeriesRecordingId": this.cgSelectedProgram.scheduledSeriesRecordingId,
                    "startTimeOffset": this.cgSelectedProgram.startTimeOffset, "stopTimeOffset": this.cgSelectedProgram.stopTimeOffset };
            }
            else {
                var commandData = { "command": "updateScheduledRecording", "id": this.cgSelectedProgram.scheduledRecordingId,
                    "startTimeOffset": this.cgSelectedProgram.startTimeOffset, "stopTimeOffset": this.cgSelectedProgram.stopTimeOffset };
            }

            console.log(commandData);

            $.get(aUrl, commandData)
                .done(function (result) {
                    console.log("cgRecordProgramFromClient: add or update record processing complete");
                    if (nextFunction != null) {
                        nextFunction();
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("browserCommand failure");
                })
                .always(function () {
                    //alert("recording transmission finished");
                });
        },


        cgRecordSelectedSeriesFromClient: function (nextFunction) {

            // REQUIREDTODO
            var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            this.cgSelectedStationId = programData.stationId;

            // REQUIREDTODO
            var stationName = getStationFromId(this.cgSelectedStationId);
            stationName = stationName.replace(".", "-");

            var aUrl = this.baseURL + "browserCommand";
            var commandData = { "command": "addSeries", "title": this.cgSelectedProgram.title,
                "inputSource": "tuner", "channel": stationName, "recordingBitRate": this._settings.recordingBitRate, "segmentRecording": this._settings.segmentRecordings };
            console.log(commandData);

            $.get(aUrl, commandData)
                .done(function (result) {
                    console.log("browserCommand addSeries successfully sent");
                    if (nextFunction != null) {
                        nextFunction();
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("browserCommand failure");
                })
                .always(function () {
                    //alert("recording transmission finished");
                });

            //return cgRecordProgramFromClient();
        },

        cgRecordSelectedSeries: function () {
            return this.cgRecordProgram();
        },


        // new handlers
        cgCancelScheduledRecording: function () {
            console.log("cgCancelScheduledRecording invoked");
        },

        cgCancelScheduledSeries: function () {
            console.log("cgCancelScheduledSeries invoked");
        },


        cgScheduledSeriesViewUpcoming: function () {
            console.log("cgScheduledSeriesViewUpcoming invoked");
        },

        cgCancelScheduledRecordingFromClient: function (nextFunction) {
            console.log("cgCancelScheduledRecordingFromClient invoked");
            // REQUIREDTODO
            var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            // REQUIREDTODO
            deleteScheduledRecording(this.cgSelectedProgram.scheduledRecordingId, nextFunction);
        },


        cgCancelScheduledSeriesFromClient: function (nextFunction) {
            console.log("cgCancelScheduledSeriesFromClient invoked");
            // REQUIREDTODO
            var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            // REQUIREDTODO
            deleteScheduledSeries(this.cgSelectedProgram.scheduledSeriesRecordingId, nextFunction);
        },

        cgRecordProgramSetOptions: function () {
            console.log("cgRecordProgramSetOptions invoked");

            // erase existing dialog, show new one
            this.cgProgramDlgCloseInvoked();

            // use common code in displayCGPopUp??
            var options = {
                "backdrop": "true"
            }
            $("#cgRecordingOptionsDlg").modal(options);
            $("#cgRecordingOptionsTitle").html(this.cgSelectedProgram.title);

            // for a program that has not been setup to record, this.cgSelectedProgram.startTimeOffset = 0, etc.
            this.stopTimeIndex = this.stopTimeOnTimeIndex;
            this.startTimeIndex = this.startTimeOnTimeIndex;

            $.each(this.startTimeOffsets, function (index, startTimeOffset) {
                if (startTimeOffset == this.cgSelectedProgram.startTimeOffset) {
                    this.startTimeIndex = index;
                    return false;
                }
            });

            $.each(this.stopTimeOffsets, function (index, stopTimeOffset) {
                if (stopTimeOffset == this.cgSelectedProgram.stopTimeOffset) {
                    this.stopTimeIndex = index;
                    return false;
                }
            });

            this.displayStartTimeSetting();
            this.displayStopTimeSetting();

            // highlight first button; unhighlight other buttons
            $("#cgRecordOptionsStopTime").removeClass("btn-secondary");
            $("#cgRecordOptionsStopTime").addClass("btn-primary");
            $("#cgRecordOptionsStartTime").removeClass("btn-primary");
            $("#cgRecordOptionsStartTime").addClass("btn-secondary");
            $("#cgRecordOptionsSave").removeClass("btn-primary");
            $("#cgRecordOptionsSave").addClass("btn-secondary");
            $("#cgRecordOptionsCancel").removeClass("btn-primary");
            $("#cgRecordOptionsCancel").addClass("btn-secondary");


            var addRecordToDB = true;
            if (this.cgSelectedProgram.scheduledRecordingId > 0) {
                addRecordToDB = false;
            }
            $("#cgRecordOptionsSave").click(function (event) {
                $("#cgRecordOptionsSave").unbind("click");
                $("#cgRecordingOptionsDlg").modal('hide');
                // REQUIREDTODO
                cgRecordProgramFromClient(addRecordToDB, ChannelGuideSingleton.getInstance().retrieveScheduledRecordings);
                // REQUIREDTODO
                ChannelGuideSingleton.getInstance().reselectCurrentProgram();
            });

            $("#cgRecordOptionsCancel").click(function (event) {
                $("#cgRecordingOptionsDlg").modal('hide');
                // REQUIREDTODO
                ChannelGuideSingleton.getInstance().reselectCurrentProgram();
            });
        },

        cgRecordOptionsNextEarlyStopTime: function () {
            console.log("cgRecordOptionsNextEarlyStopTime invoked");

            if (this.stopTimeIndex > 0) {
                this.stopTimeIndex--;
                this.displayStopTimeSetting();
            }
        },

        displayStopTimeSetting: function () {
            $("#cgRecordOptionsStopTimeLabel")[0].innerHTML = this.stopTimeOptions[this.stopTimeIndex];
        },

        cgRecordOptionsNextLateStopTime: function () {
            console.log("cgRecordOptionsNextLateStopTime invoked");

            if (this.stopTimeIndex < (this.stopTimeOptions.length-1)) {
                this.stopTimeIndex++;
                this.displayStopTimeSetting();
            }
        },

        cgRecordOptionsNextEarlyStartTime: function () {
            console.log("cgRecordOptionsNextEarlyStartTime invoked");

            if (this.startTimeIndex > 0) {
                this.startTimeIndex--;
                this.displayStartTimeSetting();
            }
        },

        displayStartTimeSetting: function () {
            $("#cgRecordOptionsStartTimeLabel")[0].innerHTML = this.startTimeOptions[this.startTimeIndex];
        },

        cgRecordOptionsNextLateStartTime: function () {
            console.log("cgRecordOptionsNextLateStartTime invoked");

            if (this.startTimeIndex < (this.startTimeOptions.length-1)) {
                this.startTimeIndex++;
                this.displayStartTimeSetting();
            }
        },

        cgRecordProgramViewUpcomingEpisodes: function () {
            console.log("cgRecordProgramViewUpcomingEpisodes invoked");
        },

        cgChangeScheduledRecordingOptions: function () {
            console.log("cgChangeScheduledRecordingOptions invoked");
        },

        cgScheduledRecordingViewUpcomingEpisodes: function () {
            console.log("cgScheduledRecordingViewUpcomingEpisodes invoked");
        },

        cgScheduledRecordingTune: function () {
            console.log("cgScheduledRecordingTune invoked");
        },

        cgScheduledRecordingClose: function () {
            console.log("cgScheduledRecordingClose invoked");
        },

        displayCGPopUp: function () {

            consoleLog("displayCGPopUp() invoked");

            // REQUIREDTODO
            var channelGuide = ChannelGuideSingleton.getInstance();

            var programData = channelGuide.getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            this.cgSelectedStationId = programData.stationId;

            this.stopTimeIndex = this.stopTimeOnTimeIndex;
            this.startTimeIndex = this.startTimeOnTimeIndex;

            // check the program that the user has clicked
            // display different pop ups based on
            //      single vs. series
            //      already scheduled to record or not
            var cgSelectedProgramScheduledToRecord = false;
            this.cgSelectedProgram.scheduledRecordingId = -1;
            this.cgSelectedProgram.scheduledSeriesRecordingId = -1;
            this.cgSelectedProgram.startTimeOffset = 0;
            this.cgSelectedProgram.stopTimeOffset = 0;
            if (channelGuide.scheduledRecordings != null) {
                $.each(channelGuide.scheduledRecordings, function (index, scheduledRecording) {
                    cgSelectedProgramScheduledToRecord = this.programsMatch(scheduledRecording, this.cgSelectedProgram, this.cgSelectedStationId);
                    if (cgSelectedProgramScheduledToRecord) {
                        this.cgSelectedProgram.scheduledRecordingId = scheduledRecording.Id;
                        this.cgSelectedProgram.scheduledSeriesRecordingId = scheduledRecording.ScheduledSeriesRecordingId;
                        this.cgSelectedProgram.startTimeOffset = scheduledRecording.StartTimeOffset;
                        this.cgSelectedProgram.stopTimeOffset = scheduledRecording.StopTimeOffset;
                        return false;
                    }
                });
                console.log("cgSelectedProgramScheduledToRecord=" + cgSelectedProgramScheduledToRecord.toString());
            }

            this.cgRecordEpisodeId = null;
            this.cgRecordSeriesId = null;
            this.cgCancelRecordingId = null;
            this.cgCancelSeriesId = null;
            this.cgRecordSetOptionsId = null;
            this.cgRecordViewUpcomingEpisodesId = null;
            this.cgTuneEpisodeId = null;

            // JTRTODO - optimize the logic here - I think I can make it simpler
            if (this.cgSelectedProgram.showType == "Series") {
                if (this.cgSelectedProgram.scheduledRecordingId == -1) {
                    // not yet scheduled to record
                    this.cgPopupId = '#cgSeriesDlg';
                    this.cgPopupTitle = '#cgSeriesDlgShowTitle';
                    this.cgPopupElements = this.cgPopupSeriesElements;
                    this.cgPopupHandlers = this.cgPopupSeriesHandlers;

                    this.cgRecordEpisodeId = "#cgEpisodeRecord";
                    this.cgRecordSetOptionsId = "#cgSeriesRecordSetProgramOptions";
                    this.cgRecordSeriesId = "#cgSeriesRecord";
                    this.cgTuneEpisodeId = "#cgSeriesTune";
                    this.cgCloseEpisodeId = "#cgSeriesClose";
                }
                else {
                    // previously scheduled to record
                    if (this.cgSelectedProgram.scheduledSeriesRecordingId > 0) {
                        this.cgPopupId = '#cgScheduledSeriesDlg';
                        this.cgPopupTitle = '#cgScheduledSeriesDlgTitle';
                        this.cgPopupElements = this.cgPopupScheduledSeriesElements;
                        this.cgPopupHandlers = this.cgPopupSchedulesSeriesHandlers;

                        this.cgCancelRecordingId = "#cgSeriesCancelEpisode";
                        this.cgCancelSeriesId = "#cgSeriesCancelSeries";
                        this.cgRecordViewUpcomingEpisodesId = "#cgSeriesViewUpcoming";
                        this.cgTuneEpisodeId = "#cgSeriesRecordingTune";
                        this.cgCloseEpisodeId = "#cgSeriesRecordingClose";
                    }
                    else {
                        this.cgPopupId = '#cgScheduledRecordingDlg';
                        this.cgPopupTitle = '#cgProgramScheduledDlgShowTitle';
                        this.cgPopupElements = this.cgPopupScheduledProgramElement;
                        this.cgPopupHandlers = this.cgPopupScheduledProgramHandlers;

                        this.cgCancelRecordingId = "#cgCancelScheduledRecording";
                        this.cgRecordSetOptionsId = "#cgScheduledRecordChangeOptions";
                        this.cgRecordViewUpcomingEpisodesId = "#cgScheduledRecordingViewUpcomingEpisodes";
                        this.cgTuneEpisodeId = "#cgScheduledRecordingTune";
                        this.cgCloseEpisodeId = "#cgScheduledRecordingClose";
                    }
                }
            }
            else        // single program recordings (not series)
            {
                if (this.cgSelectedProgram.scheduledRecordingId == -1) {         // no recording set
                    this.cgPopupId = '#cgProgramDlg';
                    this.cgPopupTitle = '#cgProgramDlgShowTitle';
                    this.cgPopupElements = this.cgPopupEpisodeElements;
                    this.cgPopupHandlers = this.cgPopupEpisodeHandlers;

                    this.cgRecordEpisodeId = "#cgProgramRecord";
                    this.cgRecordSetOptionsId = "#cgProgramRecordSetOptions";
                    this.cgRecordViewUpcomingEpisodesId = "#cgProgramViewUpcomingEpisodes";
                    this.cgTuneEpisodeId = "#cgProgramTune";
                    this.cgCloseEpisodeId = "#cgProgramClose";
                }
            else {                                                          // recording already setup
                    this.cgPopupId = '#cgScheduledRecordingDlg';
                    this.cgPopupTitle = '#cgProgramScheduledDlgShowTitle';
                    this.cgPopupElements = this.cgPopupScheduledProgramElement;
                    this.cgPopupHandlers = this.cgPopupScheduledProgramHandlers;

                    this.cgCancelRecordingId = "#cgCancelScheduledRecording";
                    this.cgRecordSetOptionsId = "#cgScheduledRecordChangeOptions";
                    this.cgRecordViewUpcomingEpisodesId = "#cgScheduledRecordingViewUpcomingEpisodes";
                    this.cgTuneEpisodeId = "#cgScheduledRecordingTune";
                    this.cgCloseEpisodeId = "#cgScheduledRecordingClose";
                }
            }

            // setup handlers for browser
            if (this.cgRecordEpisodeId) {
                $(this.cgRecordEpisodeId).off();
                $(this.cgRecordEpisodeId).click(function (event) {
                    $(this.cgRecordEpisodeId).unbind("click");
                    // REQUIREDTODO
                    cgRecordProgramFromClient(true, ChannelGuideSingleton.getInstance().retrieveScheduledRecordings);
                    this.cgProgramDlgCloseInvoked();
                    // REQUIREDTODO
                    ChannelGuideSingleton.getInstance().reselectCurrentProgram();
            });
        }
            if (this.cgRecordSeriesId) {
                $(this.cgRecordSeriesId).off();
                $(this.cgRecordSeriesId).click(function (event) {
                    // REQUIREDTODO
                    cgRecordSelectedSeriesFromClient(ChannelGuideSingleton.getInstance().retrieveScheduledRecordings);
                    this.cgProgramDlgCloseInvoked();
                    // REQUIREDTODO
                    ChannelGuideSingleton.getInstance().reselectCurrentProgram();
                });
            }

            if (this.cgTuneEpisodeId){
                $(this.cgTuneEpisodeId).off();
                $(this.cgTuneEpisodeId).click(function (event) {
                    this.cgTuneFromClient();
                    this.cgProgramDlgCloseInvoked();
                    // REQUIREDTODO
                    ChannelGuideSingleton.getInstance().reselectCurrentProgram();
                });
            }

            if (this.cgCancelRecordingId) {
                $(this.cgCancelRecordingId).off();
                $(this.cgCancelRecordingId).click(function (event) {
                    console.log("CancelRecording invoked");
                    // REQUIREDTODO
                    cgCancelScheduledRecordingFromClient(ChannelGuideSingleton.getInstance().retrieveScheduledRecordings);
                    this.cgProgramDlgCloseInvoked();
                    // REQUIREDTODO
                    ChannelGuideSingleton.getInstance().reselectCurrentProgram();
                });
            }

            if (this.cgCancelSeriesId) {
                $(this.cgCancelSeriesId).off();
                $(this.cgCancelSeriesId).click(function (event) {
                    console.log("CancelSeriesRecording invoked");
                    // REQUIREDTODO
                    cgCancelScheduledSeriesFromClient(ChannelGuideSingleton.getInstance().retrieveScheduledRecordings);
                    this.cgProgramDlgCloseInvoked();
                    // REQUIREDTODO
                    ChannelGuideSingleton.getInstance().reselectCurrentProgram();
                });
            }

            if (this.cgRecordSetOptionsId) {
                $(this.cgRecordSetOptionsId).off();
                $(this.cgRecordSetOptionsId).click(function (event) {
                    console.log("recordSetOptions invoked");
                    cgRecordProgramSetOptions();
                    this.cgProgramDlgCloseInvoked();
                    // REQUIREDTODO
                    ChannelGuideSingleton.getInstance().reselectCurrentProgram();
                });
            }

            if (this.cgRecordViewUpcomingEpisodesId) {
                $(this.cgRecordViewUpcomingEpisodesId).off();
                $(this.cgRecordViewUpcomingEpisodesId).click(function (event) {
                    console.log("ViewUpcomingEpisodes invoked")
                    this.cgProgramDlgCloseInvoked();
                    // REQUIREDTODO
                    ChannelGuideSingleton.getInstance().reselectCurrentProgram();
                });
            }

            if (this.cgCloseEpisodeId) {
                $(this.cgCloseEpisodeId).off();
                $(this.cgCloseEpisodeId).click(function (event) {
                    this.cgProgramDlgCloseInvoked();
                    // REQUIREDTODO
                    ChannelGuideSingleton.getInstance().reselectCurrentProgram();
                });
            }


            this.cgPopupSelectedIndex = 0;

            var options = {
                "backdrop": "true"
            }
            $(this.cgPopupId).modal(options);
            $(this.cgPopupTitle).html(this.cgSelectedProgram.title);

            // highlight first button; unhighlight other buttons
            $(this.cgPopupElements[0]).removeClass("btn-secondary");
            $(this.cgPopupElements[0]).addClass("btn-primary");

            for (i = 1; i < this.cgPopupElements.length; i++) {
                $(this.cgPopupElements[i]).removeClass("btn-primary");
                $(this.cgPopupElements[i]).addClass("btn-secondary");
            }

            $(this.cgPopupId).off("keydown");
            $(this.cgPopupId).keydown(function (keyEvent) {
                var keyIdentifier = event.keyIdentifier;
                console.log("Key " + keyIdentifier.toString() + "pressed")
                if (keyIdentifier == "Up") {
                    this.cgProgramDlgUp();
                }
                else if (keyIdentifier == "Down") {
                    this.cgProgramDlgDown();
                }
                else if (keyIdentifier == "Enter") {
                    var functionInvoked = this.cgPopupHandlers[this.cgPopupSelectedIndex]();
                    this.cgProgramDlgCloseInvoked();
                    // ?? JTRTODO - update scheduled recordings

                }
            });
            // browser event handlers - browser.js - this approach didn't work - why?
            //for (i = 0; i < this.cgPopupEpisodeElements.length; i++) {
            //    var foo = this.cgPopupEpisodeHandlers[i];
            //    var foo2 = this.cgPopupEpisodeElements[i];
            //    $(foo2).click(function () {
            //        foo();
            //    });

            //$(this.cgPopupEpisodeElements[i]).click(function () {
            //    //this.cgPopupEpisodeHandlers[i]();
            //    foo();
            //    cgProgramDlgCloseInvoked();
            //});

            //click(this.cgPopupEpisodeHandlers[i]);
            //}
        },

        programsMatch: function (scheduledRecording, cgProgram, cgStationId) {

            // JTRTODO - what other criteria should be used?
            // REQUIREDTODO
            var channelGuide = ChannelGuideSingleton.getInstance();
            var channel = channelGuide.getChannelFromStationIndex(cgStationId);
            if (channel != scheduledRecording.Channel) return false;

            if (scheduledRecording.Title != this.cgSelectedProgram.title) return false;

            if (new Date(scheduledRecording.DateTime).getTime() != this.cgSelectedProgram.date.getTime()) return false;

            return true;
        },

        cgModalClose: function () {
            // don't need to do anything other than close the dialog
            return "close";
        },


        // brightsign.js only?
        cgSelectEventHandler: function () {
            var functionInvoked = this.cgPopupHandlers[this.cgPopupSelectedIndex]();
            this.cgProgramDlgCloseInvoked();
            // ?? JTRTODO - update scheduled recordings
            return functionInvoked;
        },


        cgProgramDlgUp: function () {

            if (this.cgPopupSelectedIndex > 0) {

                this.cgPopupSelectedIndex--;
                this.updateCGProgramDlgSelection();
            }
        },


        cgProgramDlgDown: function () {
            if (this.cgPopupSelectedIndex < this.cgPopupElements.length - 1) {

                this.cgPopupSelectedIndex++;
                this.updateCGProgramDlgSelection();
            }
        },


        cgProgramDlgCloseInvoked: function () {
            $(this.cgPopupId).modal('hide');
        },


        eraseUI: function () {
            $("#ipAddress").css("display", "none");
            $(this.currentActiveElementId).css("display", "none");
            $("#footerArea").css("display", "none");
        },

        setFooterVisibility: function (trickModeKeysVisibility, homeButtonVisibility) {

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
    }
});
