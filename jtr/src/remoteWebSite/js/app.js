/**
 * Created by tedshaffer on 10/25/15.
 */

$(document).ready(function () {


    ManualRecordView = Backbone.View.extend({

        initialize: function () {
            console.log("ManualRecordView::initialize");
            this.template = _.template($('#manualRecordTemplate').html());
            this.render();
        },

        render: function () {
            console.log("ManualRecordView::render");
            this.$el.html(this.template()); // this.$el is a jQuery wrapped el var
            $("#manualRecordPage").css("display", "block");
            return this;
        }
    }),

    MainMenuView = Backbone.View.extend({

        initialize: function () {
            console.log("mainMenuView::initialize");

            //this.on('invokeRecordedShows', this.invokeRecordedShowsHandler, this);

        },

        events: {
            "click #recordedShows": "recordedShowsHandler",
            "click #manualRecord": "manualRecordHandler"
        },

        recordedShowsHandler: function( event ){
            // Button clicked, you can access the element that was clicked with event.currentTarget
            console.log("recordedShowsHandler, trigger invokeRecordedShows");
            this.trigger("invokeRecordedShows");
        },

        manualRecordHandler: function( event ) {
            console.log("manualRecordHandler, trigger invokeManualRecord");
            this.trigger("invokeManualRecord");
        }
    });


    var mainMenuView = new MainMenuView({el: $("#homePage")});

    //var MainMenuController = {};
    //_.extend(MainMenuController, Backbone.Events);
    //MainMenuController.listenTo(mainMenuView, "invokeRecordedShows", function() {
    //    console.log("MainMenuController:: invokeRecordedShowsHandler event received");
    //});
    //MainMenuController.listenTo(mainMenuView, "invokeManualRecord", function() {
    //    console.log("MainMenuController:: invokeManualRecord event received");
    //    $(mainMenuView.el).hide();
    //    var manualRecordView = new ManualRecordView({el: $("#manualRecordPage")});
    //
    //});


    //MainMenuController = ({
    //
    //    initialize: function() {
    //            this.listenTo(mainMenuView, "invokeRecordedShows", function() {
    //                console.log("MainMenuController:: invokeRecordedShowsHandler event received");
    //            });
    //            this.listenTo(mainMenuView, "invokeManualRecord", function() {
    //                console.log("MainMenuController:: invokeManualRecord event received");
    //                $(mainMenuView.el).hide();
    //                var manualRecordView = new ManualRecordView({el: $("#manualRecordPage")});
    //            });
    //        },
    //    },
    //
    //    _.extend(this, Backbone.Events),
    //    this.initialize()
    //);

    //var mainMenuController = new MainMenuController();
    //mainMenuController.initialize();

    var MainMenuController = {
        initialize: function() {
            this.listenTo(mainMenuView, "invokeRecordedShows", function() {
                console.log("MainMenuController:: invokeRecordedShowsHandler event received");
            });
            this.listenTo(mainMenuView, "invokeManualRecord", function() {
                console.log("MainMenuController:: invokeManualRecord event received");
                $(mainMenuView.el).hide();
                var manualRecordView = new ManualRecordView({el: $("#manualRecordPage")});
            });
        }
    };
    _.extend(MainMenuController, Backbone.Events);
    MainMenuController.initialize();

});