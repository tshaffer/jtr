/**
 * Created by tedshaffer on 10/27/15.
 */
define(['mainMenuView','manualRecordController'], function (MainMenuView, ManualRecordController) {

    var mainMenuController = {
        p1: 69,

        init: function() {
            var mainMenuView = new MainMenuView({el: $("#homePage")});

            _.extend(this, Backbone.Events);

            // following lines were a test that didn't necessarily pass.
            // unclear at all what this and self are now and later
            //this.mainMenuView = mainMenuView;
            //var self = this;

            this.listenTo(mainMenuView, "invokeRecordedShows", function () {
                console.log("MainMenuController:: invokeRecordedShowsHandler event received");
            });

            this.listenTo(mainMenuView, "invokeManualRecord", function () {
                console.log("MainMenuController:: invokeManualRecord event received");
                $(mainMenuView.el).hide();

                // change code so that the manual record view is not displayed when the object is created
                // add a method that the manualRecordController can invoke to show the manual record view

                //var manualRecordController = new ManualRecordController();
                var manualRecordController = ManualRecordController;
                manualRecordController.show();
            });
        }
    };

    mainMenuController.init();
    return mainMenuController;
});
