(function() {

angular.module('ui.grid')
.directive('uiGridVisible', function uiGridVisibleAction() {
  return function ($scope, $elm, $attr) {
    function watchVisible ($elm, visible) {
      // $elm.css('visibility', visible ? 'visible' : 'hidden');
      $elm[visible ? 'removeClass' : 'addClass']('ui-grid-invisible');
    }

    $scope.$watch($attr.uiGridVisible, watchVisible.bind(null, $elm));
  };
});

})();
