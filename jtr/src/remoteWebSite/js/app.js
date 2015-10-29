/**
 * Created by tedshaffer on 10/25/15.
 */
define(function() {
    $(document).ready(function () {
        require(['mainMenuController'], function(MainMenuController) {
            console.log("mainMenuController loaded");
        });

        // below works
        //require(['manualRecordModel'], function(ManualRecordModel) {
        //    console.log("");
        //    var manualRecordModel = new ManualRecordModel();
        //});
    });
});
