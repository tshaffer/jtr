/**
 * Created by tedshaffer on 10/27/15.
 */
define(['mainMenuView','manualRecordController', 'recordedShowsController'], function (MainMenuView, ManualRecordController, RecordedShowsController) {

    var mainMenuController = {
        p1: 69,

        init: function() {
            var mainMenuView = new MainMenuView({el: $("#homePage")});

            _.extend(this, Backbone.Events);

            this.listenTo(mainMenuView, "invokeRecordedShows", function () {
                console.log("MainMenuController:: invokeRecordedShowsHandler event received");
                $(mainMenuView.el).hide();

                var recordedShowsController = RecordedShowsController;
                recordedShowsController.show();
            });

            this.listenTo(mainMenuView, "invokeManualRecord", function () {
                console.log("MainMenuController:: invokeManualRecord event received");
                $(mainMenuView.el).hide();

                // note - do not invoke new on ManualRecordController
                var manualRecordController = ManualRecordController;
                manualRecordController.show();
            });
        }
    };

    mainMenuController.init();
    return mainMenuController;
});