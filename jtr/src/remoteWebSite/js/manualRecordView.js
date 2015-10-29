/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    var manualRecordView = Backbone.View.extend({

        initialize: function () {
            console.log("ManualRecordView::initialize");
            this.template = _.template($('#manualRecordTemplate').html());
        },

        render: function () {
            console.log("ManualRecordView::render");
            this.$el.html(this.template()); // this.$el is a jQuery wrapped el var

            var title = this.model.get('title');
            $("#manualRecordTitle").val(title);

            var duration = this.model.get('duration');
            $("#manualRecordDuration").val(duration);

            $("#manualRecordPage").css("display", "block");

            return this;
        },

        events: {
            "click #btnSetManualRecord": "executeManualRecordHandler"
        },

        executeManualRecordHandler: function (event) {
            console.log("executeManualRecordHandler, trigger executeManualRecord");
            this.trigger("executeManualRecord");
            return false;
        }
    });

    return manualRecordView;
});
