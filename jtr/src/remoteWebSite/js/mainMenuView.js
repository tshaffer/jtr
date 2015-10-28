/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    var mainMenuView = Backbone.View.extend({

            initialize: function () {
                console.log("mainMenuView::initialize");

                //this.on('invokeRecordedShows', this.invokeRecordedShowsHandler, this);

            },

            events: {
                "click #recordedShows": "recordedShowsHandler",
                "click #manualRecord": "manualRecordHandler"
            },

            recordedShowsHandler: function (event) {
                // Button clicked, you can access the element that was clicked with event.currentTarget
                console.log("recordedShowsHandler, trigger invokeRecordedShows");
                this.trigger("invokeRecordedShows");
            },

            manualRecordHandler: function (event) {
                console.log("manualRecordHandler, trigger invokeManualRecord");
                this.trigger("invokeManualRecord");
            }
        });

    return mainMenuView;
});
