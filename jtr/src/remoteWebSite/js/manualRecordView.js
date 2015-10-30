/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    var manualRecordView = Backbone.View.extend({

        initialize: function () {
            console.log("ManualRecordView::initialize");
            this.template = _.template($('#manualRecordTemplate').html());
        },

        show: function() {
            this.setDefaultDateTime();
            this.render();
        },

        setDefaultDateTime: function () {
            this.model.set('dateTime', new Date());
        },

        render: function () {
            console.log("ManualRecordView::render");
            this.$el.html(this.template()); // this.$el is a jQuery wrapped el var

            var title = this.model.get('title');
            $("#manualRecordTitle").val(title);

            var duration = this.model.get('duration');
            $("#manualRecordDuration").val(duration);

            var date = this.model.get('dateTime');

            var dateVal = date.getFullYear() + "-" + this.twoDigitFormat((date.getMonth() + 1)) + "-" + this.twoDigitFormat(date.getDate());
            $("#manualRecordDate").val(dateVal);

            var timeVal = this.twoDigitFormat(date.getHours()) + ":" + this.twoDigitFormat(date.getMinutes());
            $("#manualRecordTime").val(timeVal);

            var inputSource = this.model.get('inputSource');
            //$("#manualRecordDuration").val(duration);

            var channel = this.model.get('channel');
            $("#manualRecordChannel").val(channel);

            $("#manualRecordPage").css("display", "block");

            return this;
        },

        twoDigitFormat: function (val) {
            val = '' + val;
            if (val.length === 1) {
                val = '0' + val.slice(-2);
            }
            return val;
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
