/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    var manualRecordModel = Backbone.Model.extend({
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
        }
    });
    return manualRecordModel;
});
