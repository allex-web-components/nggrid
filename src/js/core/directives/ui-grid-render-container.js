(function () {
  'use strict';

  var module = angular.module('ui.grid');

  module.directive('uiGridRenderContainer', ['$timeout', '$document', 'uiGridConstants', 'gridUtil', 'ScrollEvent',
    function($timeout, $document, uiGridConstants, gridUtil, ScrollEvent) {
      function unbind ($elm, eventName) {
        return $elm.unbind(eventName);
      }

      // TODO(c0bra): Handle resizing the inner canvas based on the number of elements
      function update($scope, $elm, ctx, renderContainer) {
        var ret = '';

        var canvasWidth = ctx.colContainer.canvasWidth;
        var viewportWidth = ctx.colContainer.getViewportWidth();

        var canvasHeight = ctx.rowContainer.getCanvasHeight();

        //add additional height for scrollbar on left and right container
        //if ($scope.containerId !== 'body') {
        //  canvasHeight -= grid.scrollbarHeight;
        //}

        var viewportHeight = ctx.rowContainer.getViewportHeight();
        //shorten the height to make room for a scrollbar placeholder
        if (ctx.colContainer.needsHScrollbarPlaceholder()) {
          viewportHeight -= ctx.grid.scrollbarHeight;
        }

        var headerViewportWidth,
            footerViewportWidth;
        headerViewportWidth = footerViewportWidth = ctx.colContainer.getHeaderViewportWidth();

        // Set canvas dimensions
        ret += '\n .grid' + ctx.uiGridCtrl.grid.id + ' .ui-grid-render-container-' + $scope.containerId + ' .ui-grid-canvas { width: ' + canvasWidth + 'px; height: ' + canvasHeight + 'px; }';

        ret += '\n .grid' + ctx.uiGridCtrl.grid.id + ' .ui-grid-render-container-' + $scope.containerId + ' .ui-grid-header-canvas { width: ' + (canvasWidth + ctx.grid.scrollbarWidth) + 'px; }';

        if (renderContainer.explicitHeaderCanvasHeight) {
          ret += '\n .grid' + ctx.uiGridCtrl.grid.id + ' .ui-grid-render-container-' + $scope.containerId + ' .ui-grid-header-canvas { height: ' + renderContainer.explicitHeaderCanvasHeight + 'px; }';
        }
        else {
          ret += '\n .grid' + ctx.uiGridCtrl.grid.id + ' .ui-grid-render-container-' + $scope.containerId + ' .ui-grid-header-canvas { height: inherit; }';
        }

        ret += '\n .grid' + ctx.uiGridCtrl.grid.id + ' .ui-grid-render-container-' + $scope.containerId + ' .ui-grid-viewport { width: ' + viewportWidth + 'px; height: ' + viewportHeight + 'px; }';
        ret += '\n .grid' + ctx.uiGridCtrl.grid.id + ' .ui-grid-render-container-' + $scope.containerId + ' .ui-grid-header-viewport { width: ' + headerViewportWidth + 'px; }';

        ret += '\n .grid' + ctx.uiGridCtrl.grid.id + ' .ui-grid-render-container-' + $scope.containerId + ' .ui-grid-footer-canvas { width: ' + (canvasWidth + ctx.grid.scrollbarWidth) + 'px; }';
        ret += '\n .grid' + ctx.uiGridCtrl.grid.id + ' .ui-grid-render-container-' + $scope.containerId + ' .ui-grid-footer-viewport { width: ' + footerViewportWidth + 'px; }';

        return ret;
      }


      function onMouseWheel (ctx, event){
        var scrollEvent = new ScrollEvent(ctx.grid, ctx.rowContainer, ctx.colContainer, ScrollEvent.Sources.RenderContainerMouseWheel);
        if (event.deltaY !== 0) {
          var scrollYAmount = event.deltaY * -1 * event.deltaFactor;

          ctx.scrollTop = ctx.containerCtrl.viewport[0].scrollTop;

          // Get the scroll percentage
          scrollEvent.verticalScrollLength = ctx.rowContainer.getVerticalScrollLength();
          var scrollYPercentage = (ctx.scrollTop + scrollYAmount) / scrollEvent.verticalScrollLength;

          // If we should be scrolled 100%, make sure the scrollTop matches the maximum scroll length
          //   Viewports that have "overflow: hidden" don't let the mousewheel scroll all the way to the bottom without this check
          if (scrollYPercentage >= 1 && ctx.scrollTop < scrollEvent.verticalScrollLength) {
            ctx.containerCtrl.viewport[0].scrollTop = scrollEvent.verticalScrollLength;
          }

          // Keep scrollPercentage within the range 0-1.
          if (scrollYPercentage < 0) { scrollYPercentage = 0; }
          else if (scrollYPercentage > 1) { scrollYPercentage = 1; }

          scrollEvent.y = { percentage: scrollYPercentage, pixels: scrollYAmount };
        }
        if (event.deltaX !== 0) {
          var scrollXAmount = event.deltaX * event.deltaFactor;

          // Get the scroll percentage
          ctx.scrollLeft = gridUtil.normalizeScrollLeft(ctx.containerCtrl.viewport, ctx.grid);
          scrollEvent.horizontalScrollLength = (ctx.colContainer.getCanvasWidth() - ctx.colContainer.getViewportWidth());
          var scrollXPercentage = (ctx.scrollLeft + scrollXAmount) / scrollEvent.horizontalScrollLength;

          // Keep scrollPercentage within the range 0-1.
          if (scrollXPercentage < 0) { scrollXPercentage = 0; }
          else if (scrollXPercentage > 1) { scrollXPercentage = 1; }

          scrollEvent.x = { percentage: scrollXPercentage, pixels: scrollXAmount };
        }

        // Let the parent container scroll if the grid is already at the top/bottom
        if ((event.deltaY !== 0 && (scrollEvent.atTop(ctx.scrollTop) || scrollEvent.atBottom(ctx.scrollTop))) ||
            (event.deltaX !== 0 && (scrollEvent.atLeft(ctx.scrollLeft) || scrollEvent.atRight(ctx.scrollLeft)))) {
          //parent controller scrolls
        }
        else {
          event.preventDefault();
          event.stopPropagation();
          scrollEvent.fireThrottledScrollingEvent('', scrollEvent);
        }

      }


    return {
      replace: true,
      transclude: true,
      templateUrl: 'ui-grid/uiGridRenderContainer',
      require: ['^uiGrid', 'uiGridRenderContainer'],
      scope: {
        containerId: '=',
        rowContainerName: '=',
        colContainerName: '=',
        bindScrollHorizontal: '=',
        bindScrollVertical: '=',
        enableVerticalScrollbar: '=',
        enableHorizontalScrollbar: '='
      },
      controller: 'uiGridRenderContainer as RenderContainer',
      compile: function () {
        return {
          pre: function prelink($scope, $elm, $attrs, controllers) {

            var uiGridCtrl = controllers[0];
            var containerCtrl = controllers[1];
            var grid = $scope.grid = uiGridCtrl.grid;

            // Verify that the render container for this element exists
            if (!$scope.rowContainerName) {
              throw "No row render container name specified";
            }
            if (!$scope.colContainerName) {
              throw "No column render container name specified";
            }

            if (!grid.renderContainers[$scope.rowContainerName]) {
              throw "Row render container '" + $scope.rowContainerName + "' is not registered.";
            }
            if (!grid.renderContainers[$scope.colContainerName]) {
              throw "Column render container '" + $scope.colContainerName + "' is not registered.";
            }

            var rowContainer = $scope.rowContainer = grid.renderContainers[$scope.rowContainerName];
            var colContainer = $scope.colContainer = grid.renderContainers[$scope.colContainerName];

            containerCtrl.containerId = $scope.containerId;
            containerCtrl.rowContainer = rowContainer;
            containerCtrl.colContainer = colContainer;
          },
          post: function postlink($scope, $elm, $attrs, controllers) {
            var ctx = {
              uiGridCtrl : controllers[0],
              containerCtrl : controllers[1],
              grid : controllers[0].grid,
              rowContainer : controllers[1].rowContainer,
              colContainer : controllers[1].colContainer,
              scrollTop : null,
              scrollLeft : null
            };


            var renderContainer = ctx.grid.renderContainers[$scope.containerId];

            // Put the container name on this element as a class
            $elm.addClass('ui-grid-render-container-' + $scope.containerId);

            // Scroll the render container viewport when the mousewheel is used
            gridUtil.on.mousewheel($elm, onMouseWheel.bind(null, ctx));

            $elm.bind('$destroy', function() {
              $elm.unbind('keydown');

              ['touchstart', 'touchmove', 'touchend','keydown', 'wheel', 'mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'].forEach(unbind.bind(null, $elm));
            });


            ctx.uiGridCtrl.grid.registerStyleComputation({
              priority: 6,
              func: update.bind(null, $scope, $elm, ctx, renderContainer)
            });
          }
        };
      }
    };

  }]);

  module.controller('uiGridRenderContainer', ['$scope', 'gridUtil', function ($scope, gridUtil) {

  }]);

})();
