(function(){
  'use strict';

  angular.module('ui.grid').directive('uiGridRow', ['gridUtil', function(gridUtil) {

    function onCompiled ($elm, ctx, newScope, newElm, scope){
      // If we already have a cloned element, we need to remove it and destroy its scope
      if (ctx.clonedElement) {
        ctx.clonedElement.remove();
        ctx.cloneScope.$destroy();
      }

      // Empty the row and append the new element
      $elm.empty().append(newElm);

      // Save the new cloned element and scope
      ctx.clonedElement = newElm;
      ctx.cloneScope = newScope;
    }

    function onCompiledTemplate ($scope, $elm, ctx, compiledElementFn) {
      // var compiledElementFn = $scope.row.compiledElementFn;

      // Create a new scope for the contents of this row, so we can destroy it later if need be
      var newScope = $scope.$new();
      compiledElementFn(newScope, onCompiled.bind(null, $elm, ctx, newScope));
    }

    function compileTemplate($scope, $elm, ctx) {
      $scope.row.getRowTemplateFn.then(onCompiledTemplate.bind(null, $scope, $elm, ctx));
    }

    return {
      replace: true,
      // priority: 2001,
      // templateUrl: 'ui-grid/ui-grid-row',
      require: ['^uiGrid', '^uiGridRenderContainer'],
      scope: {
         row: '=uiGridRow',
         //rowRenderIndex is added to scope to give the true visual index of the row to any directives that need it
         rowRenderIndex: '='
      },
      compile: function() {
        return {
          pre: function($scope, $elm, $attrs, controllers) {
            var ctx = {
              uiGridCtrl : controllers[0],
              containerCtrl : controllers[1],
              grid : controllers[0].grid,
              clonedElement : null,
              cloneScope : null
            };

            $scope.grid = ctx.uiGridCtrl.grid;
            $scope.colContainer = ctx.containerCtrl.colContainer;

            // Function for attaching the template to this scope
            // Initially attach the compiled template to this scope
            compileTemplate($scope, $elm, ctx);

            // If the row's compiled element function changes, we need to replace this element's contents with the new compiled template
            $scope.$watch('row.getRowTemplateFn', function (newFunc, oldFunc) {
              if (newFunc !== oldFunc) {
                compileTemplate();
              }
            });
          },
          post: function($scope, $elm, $attrs, controllers) {

          }
        };
      }
    };
  }]);

})();
