/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    var manualRecordModel = Backbone.Model.extend({
        defaults: {
            title: '',
            duration: '',
            date: 0,
            time: 0,
            inputSource: 0
        }
    });
    return manualRecordModel;
});
