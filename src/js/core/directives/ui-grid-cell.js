angular.module('ui.grid').directive('uiGridCell', ['$compile', '$parse', 'gridUtil', 'uiGridConstants', function ($compile, $parse, gridUtil, uiGridConstants) {

  function appendClonedElement ($elm, clonedElement, scope) {
    $elm.append(clonedElement);
  }

  function appendSingle ($el, $what) {
    $el.append($what);
  }

  function doAppendSingle ($scope, $elm, compiledElementFn) {
    compiledElementFn($scope, appendSingle.bind(null, $elm));
  }
  function preCompile($scope, $elm, $attrs, uiGridCtrl) {
    var compileTemplate = $scope.col.compiledElementFn.bind(null, $scope, appendClonedElement.bind(null, $elm));

    // If the grid controller is present, use it to get the compiled cell template function
    if (uiGridCtrl && $scope.col.compiledElementFn) {
       compileTemplate();
    }
    // No controller, compile the element manually (for unit tests)
    else {
      if ( uiGridCtrl && !$scope.col.compiledElementFn ){
        // gridUtil.logError('Render has been called before precompile.  Please log a ui-grid issue');  

        $scope.col.getCompiledElementFn().then(doAppendSingle.bind(null, $scope, $elm));
      }
      else {
        var html = $scope.col.cellTemplate
          .replace(uiGridConstants.MODEL_COL_FIELD, 'row.entity.' + gridUtil.preEval($scope.col.field))
          .replace(uiGridConstants.COL_FIELD, 'grid.getCellValue(row, col)');

        var cellElement = $compile(html)($scope);
        $elm.append(cellElement);
      }
    }
  }
  function updateClassF ($scope, $elm, monitor){
    if ( monitor.classAdded ){
      $elm.removeClass( monitor.classAdded );
      monitor.classAdded = null;
    }

    if (angular.isFunction($scope.col.cellClass)) {
      monitor.classAdded = $scope.col.cellClass($scope.grid, $scope.row, $scope.col, $scope.rowRenderIndex, $scope.colRenderIndex);
    }
    else {
      monitor.classAdded = $scope.col.cellClass;
    }
    $elm.addClass(monitor.classAdded);
  }

  function cellChangeFunction ($scope, $elm, monitor, updateClass, initColClass, n, o ){
    if ( n !== o ) {
      if ( monitor.classAdded || $scope.col.cellClass ){
        updateClass();
      }

      // See if the column's internal class has changed
      var newColClass = $scope.col.getColClass(false);
      if (newColClass !== initColClass) {
        $elm.removeClass(initColClass);
        $elm.addClass(newColClass);
        initColClass = newColClass;
      }
    }
  }

  function deregisterFunction (dataChangeDereg, rowWatchDereg) {
    dataChangeDereg();
//  colWatchDereg();
    rowWatchDereg(); 
  }

  var uiGridCell = {
    priority: 0,
    scope: false,
    require: '?^uiGrid',
    compile: function() {

      //since I have no idea when classAdded will be changed (binded to watch ...')
      var monitor = {
        classAdded : null
      };
      return {
        pre: preCompile,
        post: function($scope, $elm, $attrs, uiGridCtrl) {
          var initColClass = $scope.col.getColClass(false);
          $elm.addClass(initColClass);

          var updateClass = updateClassF.bind(null, $scope, $elm, monitor);
          if ($scope.col.cellClass) {
            updateClass(monitor);
          }
          
          // Register a data change watch that would get triggered whenever someone edits a cell or modifies column defs
          var dataChangeDereg = $scope.grid.registerDataChangeCallback( updateClass, [uiGridConstants.dataChange.COLUMN, uiGridConstants.dataChange.EDIT]);
          
          // watch the col and row to see if they change - which would indicate that we've scrolled or sorted or otherwise
          // changed the row/col that this cell relates to, and we need to re-evaluate cell classes and maybe other things

          // TODO(c0bra): Turn this into a deep array watch
/*        shouldn't be needed any more given track by col.name
          var colWatchDereg = $scope.$watch( 'col', cellChangeFunction );
*/
          var rowWatchDereg = $scope.$watch( 'row', cellChangeFunction.bind(null, $scope, $elm, monitor, updateClass, initColClass));
          var df = deregisterFunction.bind(null, dataChangeDereg, rowWatchDereg );
          $scope.$on( '$destroy', df);
          $elm.on( '$destroy', df);
        }
      };
    }
  };

  return uiGridCell;
}]);

