(function () {
  'use strict';

  function onEvaledAsync (ctrl, ctx) {
    ctrl.grid.refreshCanvas(true);
    ctrl.grid.callDataChangeCallbacks(ctx.uiGridConstants.dataChange.ROW);
  }

  function onRowsModified ($scope, ctrl, ctx) {
    ctrl.grid.redrawInPlace(true);
    $scope.$evalAsync(onEvaledAsync.bind(null, ctrl, ctx));
  }

  function checkSize($elm, ctx, init) {
    // If the grid has no width and we haven't checked more than <maxSizeChecks> times, check again in <sizeCheckInterval> milliseconds
    if ($elm[0].offsetWidth <= 0 && ctx.sizeChecks < ctx.maxSizeChecks) {
      ctx.$timeout(checkSize.bind(null, $elm, ctx, init), ctx.sizeCheckInterval);
      ctx.sizeChecks++;
    }
    else {
      ctx.$timeout(init);
    }
  }

  // Setup event listeners and watchers
  function onElementDestroyed (ctx) {
    angular.element(ctx.$window).off('resize', ctx.gridResize);
  }

  function refreshCanvas (ctx, newValue, oldValue) {
    if (newValue === oldValue) { return; }
    ctx.grid.refreshCanvas(true);

  }
  function setup(ctx) {
    // Bind to window resize events
    angular.element(ctx.$window).on('resize', ctx.gridResize);

    // Unbind from window resize events when the grid is destroyed
    ctx.$elm.on('$destroy', onElementDestroyed.bind(null, ctx));

    // If we add a left container after render, we need to watch and react
    ctx.$scope.$watch(ctx.grid.hasLeftContainer.bind(ctx.grid), refreshCanvas.bind(null, ctx));
    // If we add a right container after render, we need to watch and react
    ctx.$scope.$watch(ctx.grid.hasRightContainer.bind(ctx.grid), refreshCanvas.bind(null, ctx));
  }

  // Initialize the directive
  function init($scope, ctx) {
    ctx.grid.gridWidth = ctx.$scope.gridWidth = ctx.gridUtil.elementWidth(ctx.$elm);

    // Default canvasWidth to the grid width, in case we don't get any column definitions to calculate it from
    ctx.grid.canvasWidth = ctx.uiGridCtrl.grid.gridWidth;

    ctx.grid.gridHeight = $scope.gridHeight = ctx.gridUtil.elementHeight(ctx.$elm);

    // If the grid isn't tall enough to fit a single row, it's kind of useless. Resize it to fit a minimum number of rows
    if (ctx.grid.gridHeight <= ctx.grid.options.rowHeight && ctx.grid.options.enableMinHeightCheck) {
      autoAdjustHeight(ctx);
    }

    // Run initial canvas refresh
    ctx.grid.refreshCanvas(true);
  }

  function traverseColumnDefs (_tmp, col) {
    if (col.hasOwnProperty('filter')) {
      if (_tmp.maxNumberOfFilters < 1) {
          _tmp.maxNumberOfFilters = 1;
      }
    }
    else if (col.hasOwnProperty('filters')) {
      if (_tmp.maxNumberOfFilters < col.filters.length) {
          _tmp.maxNumberOfFilters = col.filters.length;
      }
    }
  }

  // Set the grid's height ourselves in the case that its height would be unusably small
  function autoAdjustHeight(ctx) {
    // Figure out the new height
    var contentHeight = ctx.grid.options.minRowsToShow * ctx.grid.options.rowHeight;
    var headerHeight = ctx.grid.options.showHeader ? ctx.grid.options.headerRowHeight : 0;
    var footerHeight = ctx.grid.calcFooterHeight();

    var scrollbarHeight = 0;
    if (ctx.grid.options.enableHorizontalScrollbar === ctx.uiGridConstants.scrollbars.ALWAYS) {
      scrollbarHeight = ctx.gridUtil.getScrollbarWidth();
    }

    // Calculates the maximum number of filters in the columns
    var _tmp = {
      maxNumberOfFilters : 0
    };
    angular.forEach(ctx.grid.options.columnDefs,traverseColumnDefs.bind(null, _tmp));
    var maxNumberOfFilters = _tmp.maxNumberOfFilters;
    _tmp = null;

    if (ctx.grid.options.enableFiltering  && !maxNumberOfFilters) {
      var allColumnsHaveFilteringTurnedOff = ctx.grid.options.columnDefs.length && ctx.grid.options.columnDefs.every(function(col) {
        return col.enableFiltering === false;
      });

      if (!allColumnsHaveFilteringTurnedOff) {
        maxNumberOfFilters = 1;
      }
    }

    var filterHeight = maxNumberOfFilters * headerHeight;

    var newHeight = headerHeight + contentHeight + footerHeight + scrollbarHeight + filterHeight;

    ctx.$elm.css('height', newHeight + 'px');

    ctx.grid.gridHeight = ctx.$scope.gridHeight = ctx.gridUtil.elementHeight(ctx.$elm);
  }

  // Resize the grid on window resize events
  function gridResize(ctx, $event) {
    ctx.grid.gridWidth = ctx.$scope.gridWidth = ctx.gridUtil.elementWidth(ctx.$elm);
    ctx.grid.gridHeight = ctx.$scope.gridHeight = ctx.gridUtil.elementHeight(ctx.$elm);

    ctx.grid.refreshCanvas(true);
  }


  function onColumnsBuild (ctrl) {
    ctrl.grid.preCompileCellTemplates();
    ctrl.grid.refreshCanvas(true);
  }

  function onGridColumnsBuilt (ctrl, uiGridConstants) {
    ctrl.grid.preCompileCellTemplates();
    ctrl.grid.callDataChangeCallbacks(uiGridConstants.dataChange.COLUMN);
  }

  function observeColumns(ctrl, value) {
    ctrl.grid.options.columnDefs = value;
    ctrl.grid.buildColumns().then(onColumnsBuild.bind(null, ctrl));
  }

  function watchParent (ctrl, $scope){
    return ( ctrl.grid.appScope[$scope.uiGrid.data] ) ? ctrl.grid.appScope[$scope.uiGrid.data].length : undefined;
  }

  function watchData ($scope) {
    return $scope.uiGrid.data;
  }

  function watchDataLen ($scope) {
    return $scope.uiGrid.data.length;
  }

  function watchColumnDefs ($scope) {
    return $scope.uiGrid.columnDefs;
  }

  function watchColumnDefsLen ($scope) {
    return $scope.uiGrid.columnDefs.length;
  }

  function watchUiGrid ($scope) {
    return $scope.uiGrid.data;
  }

  function watchUiGridData ($scope) {
    return $scope.uiGrid.columnDefs; 
  }

  function watchStyle (ctrl) {
    return ctrl.grid.styleComputations;
  }

  function onDestroy (deregFunctions){
    for (var i in deregFunctions) {
      deregFunctions[i]();
    }
  }

  function fireEvent ($scope, ctrl, eventName, args) {
    // Add the grid to the event arguments if it's not there
    if (typeof(args) === 'undefined' || args === undefined) {
      args = {};
    }

    if (typeof(args.grid) === 'undefined' || args.grid === undefined) {
      args.grid = ctrl.grid;
    }

    $scope.$broadcast(eventName, args);
  }

  function innerCompile ($scope, $compile, elm) {
    $compile(elm)($scope);
  }


  function columnDefsWatch(ctrl, $scope, uiGridConstants, n, o) {
    if (!(n && n !== o))  { return; }

    ctrl.grid.options.columnDefs = $scope.uiGrid.columnDefs;
    ctrl.grid.buildColumns({ orderByColumnDefs: true }).then(onGridColumnsBuilt.bind(null, ctrl, uiGridConstants));
  }

  function dataWatch(ctrl, uiGridConstants, $scope, ctx, $attrs, $q, newData) {
    // gridUtil.logDebug('dataWatch fired');
    var promises = [];

    if ( ctrl.grid.options.fastWatch ){
      if (angular.isString($scope.uiGrid.data)) {
        newData = ctrl.grid.appScope[$scope.uiGrid.data];
      } else {
        newData = $scope.uiGrid.data;
      }
    }

    ctx.mostRecentData = newData;

    if (newData) {
      // columns length is greater than the number of row header columns, which don't count because they're created automatically
      var hasColumns = ctrl.grid.columns.length > (ctrl.grid.rowHeaderColumns ? ctrl.grid.rowHeaderColumns.length : 0);

      if (newData.length) {
        for (var i = 0; i < newData.length; i++) {
          //remove old hashKey data ... newData should be as clean as possible ...
          delete newData[i].$$hashKey;
        }
      }

      if (
        // If we have no columns
        !hasColumns &&
        // ... and we don't have a ui-grid-columns attribute, which would define columns for us
        !$attrs.uiGridColumns &&
        // ... and we have no pre-defined columns
        ctrl.grid.options.columnDefs.length === 0 &&
        // ... but we DO have data
        newData.length > 0
      ) {
        // ... then build the column definitions from the data that we have
        ctrl.grid.buildColumnDefsFromData(newData);
      }

      // If we haven't built columns before and either have some columns defined or some data defined
      if (!hasColumns && (ctrl.grid.options.columnDefs.length > 0 || newData.length > 0)) {
        // Build the column set, then pre-compile the column cell templates
        promises.push(ctrl.grid.buildColumns()
          .then(function() {
            ctrl.grid.preCompileCellTemplates();
          }));
      }

      $q.all(promises).then(function() {
        // use most recent data, rather than the potentially outdated data passed into watcher handler
        ctrl.grid.modifyRows(ctx.mostRecentData)
          .then(onRowsModified.bind(null, $scope, ctrl, ctx));
      });
    }
  }



  angular.module('ui.grid').controller('uiGridController', ['$scope', '$element', '$attrs', 'gridUtil', '$q', 'uiGridConstants',
                    '$templateCache', 'gridClassFactory', '$timeout', '$parse', '$compile',
    function ($scope, $elm, $attrs, gridUtil, $q, uiGridConstants,
              $templateCache, gridClassFactory, $timeout, $parse, $compile) {
      // gridUtil.logDebug('ui-grid controller');

      var ctx = {
        mostRecentData : null,
        uiGridConstants : uiGridConstants
      };

      this.grid = gridClassFactory.createGrid($scope.uiGrid);

      //assign $scope.$parent if appScope not already assigned
      this.grid.appScope = this.grid.appScope || $scope.$parent;

      $elm.addClass('grid' + this.grid.id);
      this.grid.rtl = gridUtil.getStyles($elm[0])['direction'] === 'rtl';


      // angular.extend(ctrl.grid.options, );

      //all properties of grid are available on scope
      $scope.grid = this.grid;

      if ($attrs.uiGridColumns) {
        $attrs.$observe('uiGridColumns', observeColumns.bind(null, this));
      }

      var dataWatchFunction = dataWatch.bind(null, this, uiGridConstants, $scope, ctx, $attrs, $q);


      // if fastWatch is set we watch only the length and the reference, not every individual object
      var deregFunctions = [],
        columnDefsWatchFunction = columnDefsWatch.bind(null, this, $scope, uiGridConstants);
      if (this.grid.options.fastWatch) {
        this.uiGrid = $scope.uiGrid;
        if (angular.isString($scope.uiGrid.data)) {
          deregFunctions.push( $scope.$parent.$watch($scope.uiGrid.data, dataWatchFunction) );
          deregFunctions.push( $scope.$parent.$watch(watchParent.bind(null, this, $scope), dataWatchFunction) );
        } else {
          deregFunctions.push( $scope.$parent.$watch(watchData.bind(null, $scope), dataWatchFunction) );
          deregFunctions.push( $scope.$parent.$watch(watchDataLen.bind(null, $scope),dataWatchFunction.bind(null,$scope.uiGrid.data)));
        }
        deregFunctions.push( $scope.$parent.$watch(watchColumnDefs.bind(null, $scope), columnDefsWatchFunction) );
        deregFunctions.push( $scope.$parent.$watch(watchColumnDefsLen, columnDefsWatchFunction.bind(null, $scope.uiGrid.columnDefs)));
      } else {
        if (angular.isString($scope.uiGrid.data)) {
          deregFunctions.push( $scope.$parent.$watchCollection($scope.uiGrid.data, dataWatchFunction) );
        } else {
          deregFunctions.push( $scope.$parent.$watchCollection(watchUiGrid.bind(null, $scope), dataWatchFunction) );
        }
        deregFunctions.push( $scope.$parent.$watchCollection(watchUiGridData.bind(null, $scope), columnDefsWatchFunction) );
      }

      deregFunctions.push($scope.$watch(watchStyle.bind(null, this), this.grid.refreshCanvas.bind(this.grid, true)));

      $scope.$on('$destroy', onDestroy.bind(null, deregFunctions));

      this.fireEvent = fireEvent.bind(null, $scope, this);
      this.innerCompile = innerCompile.bind(null, $scope, $compile);
    }]);

/**
 *  @ngdoc directive
 *  @name ui.grid.directive:uiGrid
 *  @element div
 *  @restrict EA
 *  @param {Object} uiGrid Options for the grid to use
 *
 *  @description Create a very basic grid.
 *
 *  @example
    <example module="app">
      <file name="app.js">
        var app = angular.module('app', ['ui.grid']);

        app.controller('MainCtrl', ['$scope', function ($scope) {
          $scope.data = [
            { name: 'Bob', title: 'CEO' },
            { name: 'Frank', title: 'Lowly Developer' }
          ];
        }]);
      </file>
      <file name="index.html">
        <div ng-controller="MainCtrl">
          <div ui-grid="{ data: data }"></div>
        </div>
      </file>
    </example>
 */
angular.module('ui.grid').directive('uiGrid', uiGridDirective);

uiGridDirective.$inject = ['$compile', '$templateCache', '$timeout', '$window', 'gridUtil', 'uiGridConstants'];
function uiGridDirective($compile, $templateCache, $timeout, $window, gridUtil, uiGridConstants) {
  return {
    templateUrl: 'ui-grid/ui-grid',
    scope: {
      uiGrid: '='
    },
    replace: true,
    transclude: true,
    controller: 'uiGridController',
    compile: function () {
      return {
        post: function ($scope, $elm, $attrs, uiGridCtrl) {
          // Initialize scrollbars (TODO: move to controller??)
          uiGridCtrl.scrollbars = [];
          var ctx = {
            sizeCheckInterval : 100, // ms
            maxSizeChecks : 20, // 2 seconds total
            sizeChecks : 0,
            grid : uiGridCtrl.grid,
            uiGridConstants : uiGridConstants,
            gridUtil : gridUtil,
            $scope : $scope,
            $timeout : $timeout,
            $window : $window,
            $elm: $elm,
            uiGridCtrl: uiGridCtrl
          };
          ctx.gridResize = gridResize.bind(null, ctx);
          ctx.grid.element = $elm;



          // See if the grid has a rendered width, if not, wait a bit and try again

          // Setup (event listeners) the grid
          var _doInit = init.bind(null, $scope, ctx);
          setup(ctx, _doInit);

          // And initialize it
          _doInit();

          // Mark rendering complete so API events can happen
          ctx.grid.renderingComplete();

          // If the grid doesn't have size currently, wait for a bit to see if it gets size
          checkSize($elm, ctx, _doInit);

          /*-- Methods --*/
        }
      };
    }
  };
}

})();
