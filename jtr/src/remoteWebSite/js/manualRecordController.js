/**
 * Created by tedshaffer on 10/27/15.
 */
ManualRecordController = function() {

    return (function () {

        var manualRecordModel = new ManualRecordModel({
            title: 'Title',
            duration: '69'
        });

        var manualRecordView = new ManualRecordView({
            el: $("#manualRecordPage"),
            model: manualRecordModel
        });

        _.extend(this, Backbone.Events);

        this.listenTo(manualRecordView, "executeManualRecord", function() {
            console.log("ManualRecordController:: executeManualRecord event received");
            return false;
        });
    })();
};
