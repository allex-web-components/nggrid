(function () {
  'use strict';

  angular.module('ui.grid').directive('uiGridFooterCell', ['$timeout', 'gridUtil', 'uiGridConstants', '$compile',
  function ($timeout, gridUtil, uiGridConstants, $compile) {

    function updateClassF ( $scope, $elm, _tmp, grid ){
      if ( _tmp.classAdded ){
        $elm.removeClass( _tmp.classAdded );
        _tmp.classAdded = null;
      }

      if (angular.isFunction($scope.col.footerCellClass)) {
        _tmp.classAdded = $scope.col.footerCellClass($scope.grid, $scope.row, $scope.col, $scope.rowRenderIndex, $scope.colRenderIndex);
      }
      else {
        _tmp.classAdded = $scope.col.footerCellClass;
      }
      $elm.addClass(_tmp.classAdded);
    }

    var uiGridFooterCell = {
      priority: 0,
      scope: {
        col: '=',
        row: '=',
        renderIndex: '='
      },
      replace: true,
      require: '^uiGrid',
      compile: function compile(tElement, tAttrs, transclude) {
        return {
          pre: function ($scope, $elm, $attrs, uiGridCtrl) {
            var cellFooter = $compile($scope.col.footerCellTemplate)($scope);
            $elm.append(cellFooter);
          },
          post: function ($scope, $elm, $attrs, uiGridCtrl) {
            //$elm.addClass($scope.col.getColClass(false));
            $scope.grid = uiGridCtrl.grid;

            var initColClass = $scope.col.getColClass(false);
            $elm.addClass(initColClass);

            // apply any footerCellClass
            var _tmp = {
              classAdded : null
            },
            updateClass = updateClassF.bind(null, $scope, $elm, _tmp);

  
            if ($scope.col.footerCellClass) {
              updateClass();
            }

            $scope.col.updateAggregationValue();

            // Watch for column changes so we can alter the col cell class properly
/* shouldn't be needed any more, given track by col.name
            $scope.$watch('col', function (n, o) {
              if (n !== o) {
                // See if the column's internal class has changed
                var newColClass = $scope.col.getColClass(false);
                if (newColClass !== initColClass) {
                  $elm.removeClass(initColClass);
                  $elm.addClass(newColClass);
                  initColClass = newColClass;
                }
              }
            });
*/


            // Register a data change watch that would get triggered whenever someone edits a cell or modifies column defs
            var dataChangeDereg = $scope.grid.registerDataChangeCallback( updateClass, [uiGridConstants.dataChange.COLUMN]);
            // listen for visible rows change and update aggregation values
            $scope.grid.api.core.on.rowsRendered( $scope, $scope.col.updateAggregationValue );
            $scope.grid.api.core.on.rowsRendered( $scope, updateClass );
            $scope.$on( '$destroy', dataChangeDereg );
          }
        };
      }
    };

    return uiGridFooterCell;
  }]);

})();
