/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    var manualRecordView = Backbone.View.extend({

        initialize: function () {
            console.log("ManualRecordView::initialize");
            this.template = _.template($('#manualRecordTemplate').html());

            this.listenTo(this, "executeManualRecord", function() {
                console.log("ManualRecordView:: executeManualRecord event received");
                return false;
            });

            //this.on('click #btnSetManualRecord', function() {
            //    console.log("ManualRecordView:: executeManualRecord event received");
            //    return false;
            //});

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

            // set visual elements based on values in model
            var title = this.model.get('title');
            $("#manualRecordTitle").val(title);

            var duration = this.model.get('duration');
            $("#manualRecordDuration").val(duration);

            var date = this.model.get('dateTime');

            var dateVal = date.getFullYear() + "-" + this.twoDigitFormat((date.getMonth() + 1)) + "-" + this.twoDigitFormat(date.getDate());
            $("#manualRecordDate").val(dateVal);

            var timeVal = this.twoDigitFormat(date.getHours()) + ":" + this.twoDigitFormat(date.getMinutes());
            $("#manualRecordTime").val(timeVal);

            var channel = this.model.get('channel');
            $("#manualRecordChannel").val(channel);

            var inputSource = this.model.get('inputSource');
            this.setElementVisibility("#manualRecordChannelDiv", inputSource == 'tuner');

            $("#manualRecordTitle").focus();

            // handlers
            var self = this;
            $("#rbManualRecordTuner").change(function () {
                self.setElementVisibility("#manualRecordChannelDiv", true);
            });

            $("#rbManualRecordRoku").change(function () {
                self.setElementVisibility("#manualRecordChannelDiv", false);
            });

            $("#rbManualRecordTivo").change(function () {
                self.setElementVisibility("#manualRecordChannelDiv", false);
            });

            $("#manualRecordPage").css("display", "block");

            return this;
        },

        setElementVisibility: function (divId, show) {
            if (show) {
                $(divId).show();
            }
            else {
                $(divId).hide();
            }
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
