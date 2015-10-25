/**
 * Created by tedshaffer on 10/24/15.
 */

$(document).ready(function () {

    var Surfboard = Backbone.Model.extend({
        defaults: {
            manufacturer: '',
            model: '',
            stock: 0
        }
    });

    var board1 = new Surfboard({
        manufacturer: 'Channel Islands',
        model: 'Whip',
        stock: 12
    });

    //var manufacturer = board1.get('manufacturer');
    //var b1Mfg = document.getElementById("board1-manufacturer");
    //b1Mfg.innerHTML = manufacturer;
    //$("#board1-manufacturer").html(manufacturer);
    $('#board1-manufacturer').html(board1.get('manufacturer'));
    $('#board1-model').html(board1.get('model'));
    $('#board1-stock').html(board1.get('stock'));

    var board2 = new Surfboard({
        manufacturer: 'Lost',
        model: 'Sub Scorcher',
        stock: 9
    });

    $('#board2-manufacturer').html(board2.get('manufacturer'));
    $('#board2-model').html(board2.get('model'));
    $('#board2-stock').html(board2.get('stock'));

});
