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

    var board2 = new Surfboard({
        manufacturer: 'Lost',
        model: 'Sub Scorcher',
        stock: 9
    });

    var board3 = new Surfboard({
        manufacturer: 'Firewire',
        model: 'Spitfire',
        stock: 5
    });

    var SurfboardsCollection = Backbone.Collection.extend({
        model: Surfboard
    });

    var Surfboards = new SurfboardsCollection;
    Surfboards.add(board1);
    Surfboards.add(board2);
    Surfboards.add(board3);

    Surfboards.each(function(surfboard) {
        $('#table-body').append(
            '<tr>' +
            '<td>' + surfboard.get('manufacturer') + '</td>' +
            '<td>' + surfboard.get('model') + '</td>' +
            '<td>' + surfboard.get('stock') + '</td>' +
            '</tr>'
        );
    });
});
