/**
 * Created by tedshaffer on 10/25/15.
 */

$(document).ready(function () {


    MainMenuView = Backbone.View.extend({

        initialize: function () {
            console.log("mainMenuView::initialize");

            //this.on('invokeRecordedShows', this.invokeRecordedShowsHandler, this);

        },

        events: {
            "click #recordedShows": "recordedShowsHandler"
        },

        recordedShowsHandler: function( event ){
            // Button clicked, you can access the element that was clicked with event.currentTarget
            console.log("recordedShowsHandler, trigger invokeRecordedShows");
            this.trigger("invokeRecordedShows");
        },

        //invokeRecordedShowsHandler:function() {
        //    console.log("invoke invokedRecordedShowsHandler");
        //}

    });

    var mainMenuView = new MainMenuView({el: $("#homePage")});

    var MainMenuController = {};
    _.extend(MainMenuController, Backbone.Events);
    //MainMenuController.on("invokeRecordedShows", function() {
    //    console.log("MainMenuController:: invokedRecordedShowsHandler event received");
    //});
    //MainMenuController.trigger("invokeRecordedShows");
    MainMenuController.listenTo(mainMenuView, "invokeRecordedShows", function() {
        console.log("MainMenuController:: invokeRecordedShowsHandler event received");
    })
});