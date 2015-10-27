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

    ManualRecordModel = Backbone.Model.extend({
        defaults: {
            title: '',
            duration: '',
            date: 0,
            time: 0,
            inputSource: 0
        }
    });

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
        },

        events: {
            "click #btnSetManualRecord": "executeManualRecordHandler"
        },

        executeManualRecordHandler: function( event ) {
            console.log("executeManualRecordHandler, trigger executeManualRecord");
            this.trigger("executeManualRecord");
            return false;
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

    // hack until Joel tells me how to do this or I figure it out
    var manualRecordView;
    var ManualRecordController;

    var MainMenuController = {
        initialize: function() {
            this.listenTo(mainMenuView, "invokeRecordedShows", function() {
                console.log("MainMenuController:: invokeRecordedShowsHandler event received");
            });
            this.listenTo(mainMenuView, "invokeManualRecord", function() {

                console.log("MainMenuController:: invokeManualRecord event received");

                $(mainMenuView.el).hide();

                ManualRecordController.initialize();
                //var manualRecordView = new ManualRecordView({el: $("#manualRecordPage")});
                manualRecordView = new ManualRecordView({el: $("#manualRecordPage")});
                ManualRecordController.setHandlers();
            });
        }
    };
    _.extend(MainMenuController, Backbone.Events);
    MainMenuController.initialize();

    //var ManualRecordController = {
    ManualRecordController = {
        initialize: function() {

            var manualRecordModel = new ManualRecordModel({
                title: 'Title',
                duration: '69'
            });

            // initialize values (just use defaults in real life for some of the items
            $('#manualRecordTitle').val(manualRecordModel.get('title'));
            $('#manualRecordDuration').val(manualRecordModel.get('duration'));
        },
        setHandlers: function() {
            this.listenTo(manualRecordView, "executeManualRecord", function() {
                console.log("ManualRecordController:: executeManualRecord event received");
                return false;
            });
        }
    };
    _.extend(ManualRecordController, Backbone.Events);
    //ManualRecordController.initialize();

});