(function(){
  'use strict';

  angular.module('ui.grid').directive('uiGridFilter', ['$compile', '$templateCache', 'i18nService', 'gridUtil', function ($compile, $templateCache, i18nService, gridUtil) {

    function updateFilters($scope, $elm, filterable ){
      $elm.children().remove();
      if (!filterable) {
        return;
      }
      $elm.append($compile($scope.col.filterHeaderTemplate)($scope));
    }
    function _onDestroy($scope) {
      delete $scope.col.updateFilters;
    }
    function preCompile ($scope, $elm, $attrs, controllers) {
      $scope.col.updateFilters = updateFilters.bind(null, $scope, $elm);
      $scope.$on( '$destroy', _onDestroy.bind(null, $scope));
    }

    function removeFilter ($elm, colFilter, index) {
      colFilter.term = null;
      //Set the focus to the filter input after the action disables the button
      gridUtil.focus.bySelector($elm, '.ui-grid-filter-input-' + index);
    }

    function postCompile ($scope, $elm, $attrs, controllers){
      $scope.aria = i18nService.getSafeText('headerCell.aria');
      $scope.removeFilter = removeFilter.bind($elm);
    }


    return {
      compile: function() {
        return {
          pre: preCompile,
          post: postCompile
        };
      }
    };
  }]);
})();
