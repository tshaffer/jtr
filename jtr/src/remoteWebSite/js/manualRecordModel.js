/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    // the following works:
    //var foo = manualRecordModel;
    //var foo2 = new manualRecordModel();
    // OR
    // var manualRecordModel = new ManualRecordModel();

    // tried the following but don't see any way to access it
    //var classPizza = 42;

    var manualRecordModel = Backbone.Model.extend({
        defaults: {
            title: '',
            duration: '',
            date: 0,
            time: 0,
            inputSource: 0
        }
        // can add properties as seen below
        //pizza: 69
    });
    return manualRecordModel;

    // the following works:
    //var foo = manualRecordModel;
    //var foo2 = new foo.manualRecordModel();
    //
    //return {
    //    pizza: 69,
    //    manualRecordModel: Backbone.Model.extend({
    //        defaults: {
    //            title: '',
    //            duration: '',
    //            date: 0,
    //            time: 0,
    //            inputSource: 0
    //        }
    //    })
    //}
});
