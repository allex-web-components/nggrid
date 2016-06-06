(function () {
  'use strict';

  angular.module('ui.grid').directive('uiGridFooter', ['$templateCache', '$compile', 'uiGridConstants', 'gridUtil', '$timeout', function ($templateCache, $compile, uiGridConstants, gridUtil, $timeout) {
    function gotTemplate($scope, $elm, containerCtrl, contents) {
      var template = angular.element(contents);

      var newElm = $compile(template)($scope);
      $elm.append(newElm);

      if (containerCtrl) {
        // Inject a reference to the footer viewport (if it exists) into the grid controller for use in the horizontal scroll handler below
        var footerViewport = $elm[0].getElementsByClassName('ui-grid-footer-viewport')[0];

        if (footerViewport) {
          containerCtrl.footerViewport = footerViewport;
        }
      }
    }

    return {
      restrict: 'EA',
      replace: true,
      // priority: 1000,
      require: ['^uiGrid', '^uiGridRenderContainer'],
      scope: true,
      compile: function ($elm, $attrs) {
        return {
          pre: function ($scope, $elm, $attrs, controllers) {
            var uiGridCtrl = controllers[0];
            var containerCtrl = controllers[1];

            $scope.grid = uiGridCtrl.grid;
            $scope.colContainer = containerCtrl.colContainer;

            containerCtrl.footer = $elm;

            gridUtil.getTemplate($scope.grid.options.footerTemplate).then(gotTemplate.bind(null, $scope, $elm, containerCtrl));
          },

          post: function ($scope, $elm, $attrs, controllers) {
            var uiGridCtrl = controllers[0];
            var containerCtrl = controllers[1];

            // gridUtil.logDebug('ui-grid-footer link');

            var grid = uiGridCtrl.grid;

            // Don't animate footer cells
            gridUtil.disableAnimations($elm);

            containerCtrl.footer = $elm;

            var footerViewport = $elm[0].getElementsByClassName('ui-grid-footer-viewport')[0];
            if (footerViewport) {
              containerCtrl.footerViewport = footerViewport;
            }
          }
        };
      }
    };
  }]);

})();
