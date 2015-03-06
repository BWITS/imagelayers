'use strict';

angular.module('iLayers')
  .directive('grid', ['$timeout', 'commandService', 'gridService', function($timeout, commandService, gridService) {
    var constants = {
      col_width: 210,
      box_width: 180,
      small_class: 'small',
      medium_class: 'medium',
      large_class: 'large'
    };

    return {
      templateUrl: 'app/views/grid.html',
      restrict: 'A',
      replace: false,
      scope: {
        graph: '='
      },
      controller: function($scope) {
        $scope.makeLeaves = function(grid) {
          var leaves = [];

          for (var c=0; c < grid.cols; c++) {
            var id = grid.matrix.map[c][0].layer.id;
            leaves.push(grid.matrix.inventory[id].image.repo);
          }

          return leaves;
        };

        $scope.unwrapGrid = function(grid) {
          var data = [],
              map = grid.matrix.map,
              findType = function(thing, count) {
                var classes = ['box'],
                    cmd = (thing.container_config === undefined) ? [] : (thing.container_config.Cmd !== null) ? thing.container_config.Cmd.join(" ") : "";

                if (count === 0) {
                  return 'noop';
                }
                if (thing.Size > 100 * 1000) {
                  classes.push(constants.large_class);
                }
                if (thing.Size > 20 * 1000) {
                   classes.push(constants.medium_class);
                } else {
                   classes.push(constants.small_class);
                }

                if (cmd.lastIndexOf(" curl ") !== -1) {
                  classes.push("curl");
                }

                if (cmd.lastIndexOf(" ADD ") !== -1) {
                  classes.push("add");
                }

                if (cmd.lastIndexOf(" ENV ") !== -1) {
                  classes.push("env");
                }

                if (cmd.lastIndexOf(" apt-get") !== -1 || cmd.lastIndexOf(" cmd ") !== -1) {
                  classes.push("cmd");
                }

                return classes.join(" ");
              },
              findWidth = function(count) {
                if (count === 0) return 0;
                return count * constants.box_width + (count-1)*20;
              };

          for (var row=0; row < grid.rows; row++) {
            for (var col=0; col < grid.cols; col++) {
              var layer = map[col][row].layer,
                  count =0;

              if (grid.matrix.inventory[layer.id] !== undefined) {
                count = grid.matrix.inventory[layer.id].count
                grid.matrix.inventory[layer.id].count = 0;
              }

              data.push({ 'type': findType(layer, count),
                          'width':  findWidth(count),
                          'layer': layer });
            }
          }

          return data;
        }

      },
      link: function(scope, element, attrs) {
        scope.highlightCommand = function(layerId) {
          var item = gridService.inventory(layerId);

          if (item !== undefined) {
            commandService.highlight(item.image.layers.slice(item.row, item.image.layers.length));
          };
        };

        scope.clearCommands = function() {
          commandService.clear();
        };

        scope.$watch('graph', function(graph) {
          var grid_data = gridService.buildGrid(graph);

          element.find('.matrix').css('width', (grid_data.cols * constants.col_width) + 'px');
          scope.leaves = scope.makeLeaves(grid_data);
          scope.grid = scope.unwrapGrid(grid_data);
        });
      }
    }
  }]);
