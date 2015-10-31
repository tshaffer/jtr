/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    var manualRecordModel = Backbone.Model.extend({

        urlRoot : '/manualRecording',

        defaults: {
            title: '',
            duration: '',
            channel: '',
            dateTime: '',
            inputSource: 'tuner',
            segmentRecordings: 0,
            scheduledSeriesRecordingId: -1,
            startTimeOffset: 0,
            stopTimeOffset: 0
        },
        //save: function(attributes, options) {
        //    debugger;
        //}
        sync: function (method, model, options) {
            debugger;
        }
    });
    return manualRecordModel;
});
