/**
 * Created by tedshaffer on 10/27/15.
 */
define([], function () {

    var mainMenuController = {
        p1: 69,

        init: function() {
            var mainMenuView = new MainMenuView({el: $("#homePage")});

            _.extend(this, Backbone.Events);

            this.listenTo(mainMenuView, "invokeRecordedShows", function () {
                console.log("MainMenuController:: invokeRecordedShowsHandler event received");
            });

            this.listenTo(mainMenuView, "invokeManualRecord", function () {
                console.log("MainMenuController:: invokeManualRecord event received");
                $(mainMenuView.el).hide();

                var manualRecordController = new ManualRecordController();
            });
        }
    };

    mainMenuController.init();
    return mainMenuController;
});
