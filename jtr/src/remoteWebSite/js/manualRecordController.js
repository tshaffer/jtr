/**
 * Created by tedshaffer on 10/27/15.
 */
define(['manualRecordModel','manualRecordView'], function (ManualRecordModel, ManualRecordView) {

    var manualRecordController = {

        manualRecordModel: null,
        manualRecordView: null,

        init: function() {

            //var foo = new ManualRecordModel();

            this.manualRecordModel = new ManualRecordModel({
                title: 'Title',
                duration: '69'
            });

            this.manualRecordView = new ManualRecordView({
                el: $("#manualRecordPage"),
                model: this.manualRecordModel
            });

            _.extend(this, Backbone.Events);

            this.listenTo(this.manualRecordView, "executeManualRecord", function() {
                console.log("ManualRecordController:: executeManualRecord event received");
                return false;
            });
        },

        show: function() {
            console.log("manualRecordController:show() invoked");
            this.manualRecordView.render();
        },

        pizza: "pizza"
    };

    manualRecordController.init();
    return manualRecordController;
});
