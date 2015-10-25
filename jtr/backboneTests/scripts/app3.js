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
// Create Surfboards View
    var SurfboardsView = Backbone.View.extend({

        el: '#table-body',

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html('');

            Surfboards.each(function(model) {
                var surfboard = new SurfboardView({
                    model: model
                });

                this.$el.append(surfboard.render().el);
            }.bind(this));

            return this;
        }

    });

// Create Surfboard View
    var SurfboardView = Backbone.View.extend({

        tagName: 'tr',

        template: _.template($('#surfboard-template').html()),

        render: function() {
            this.$el.html(this.template(this.model.attributes));
            return this;
        }

    });

// Launch app
    var app = new SurfboardsView;

});
