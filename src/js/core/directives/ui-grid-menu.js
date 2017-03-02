(function(){

/**
 * @ngdoc directive
 * @name ui.grid.directive:uiGridMenu
 * @element style
 * @restrict A
 *
 * @description
 * Allows us to interpolate expressions in `<style>` elements. Angular doesn't do this by default as it can/will/might? break in IE8.
 *
 * @example
 <doc:example module="app">
 <doc:source>
 <script>
 var app = angular.module('app', ['ui.grid']);

 app.controller('MainCtrl', ['$scope', function ($scope) {

 }]);
 </script>

 <div ng-controller="MainCtrl">
   <div ui-grid-menu shown="true"  ></div>
 </div>
 </doc:source>
 <doc:scenario>
 </doc:scenario>
 </doc:example>
 */
angular.module('ui.grid')

.directive('uiGridMenu', ['$compile', '$timeout', '$window', '$document', 'gridUtil', 'uiGridConstants', 'i18nService',
function ($compile, $timeout, $window, $document, gridUtil, uiGridConstants, i18nService) {

  function onDestroy ($scope, ctx, uiGridCtrl) {
    angular.element(document).off('click touchstart', ctx.applyHideMenu);
    angular.element($window).off('resize', ctx.applyHideMenu);
    if (uiGridCtrl) {
      uiGridCtrl.grid.api.core.on.scrollBegin($scope, ctx.applyHideMenu )();
    }
    $scope.$on(uiGridConstants.events.ITEM_DRAGGING, ctx.applyHideMenu )();
  }

  function setupHeightStyle ($scope, uiGridCtrl, gridHeight) {
    // magic number of 30 because the grid menu displays somewhat below
    // the top of the grid. It is approximately 30px.
    var gridMenuMaxHeight = gridHeight - 30;
$scope.dynamicStyles = [
      '.grid' + uiGridCtrl.grid.id + ' .ui-grid-menu-mid {',
      'max-height: ' + gridMenuMaxHeight + 'px;',
      '}'
    ].join(' ');
  }

  function onGridDimensionChanged (ctx, oldGridHeight, oldGridWidth, newGridHeight, newGridWidth) {
    ctx.setupHeightStyle(newGridHeight);
  }

  function emitMenuShown ($scope) {
    $scope.shownMid = true;
    $scope.$emit('menu-shown');
  }

  function emitMenuHidden ($scope) {
    if ( $scope.shownMid ) { return; }

    $scope.shown = false;
    $scope.$emit('menu-hidden');
  }

  function turnOnDocClickHandler ($scope, $elm, ctx, docEventType){
    angular.element(document).on(docEventType, ctx.applyHideMenu);
    $timeout (function () {
      $elm.on('keyup', ctx.checkKeyUp);
      $elm.on('keydown', ctx.checkKeyDown);
    });
  }

  function showMenu ($scope, $elm, ctx, event, args) {
    if ( !$scope.shown ){

      /*
       * In order to animate cleanly we remove the ng-if, wait a digest cycle, then
       * animate the removal of the ng-hide.  We can't successfully (so far as I can tell)
       * animate removal of the ng-if, as the menu items aren't there yet.  And we don't want
       * to rely on ng-show only, as that leaves elements in the DOM that are needlessly evaluated
       * on scroll events.
       *
       * Note when testing animation that animations don't run on the tutorials.  When debugging it looks
       * like they do, but angular has a default $animate provider that is just a stub, and that's what's
       * being called.  ALso don't be fooled by the fact that your browser has actually loaded the
       * angular-translate.js, it's not using it.  You need to test animations in an external application.
       */
      $scope.shown = true;

      $timeout(emitMenuShown.bind(null, $scope));
    } else if ( !$scope.shownMid ) {
      // we're probably doing a hide then show, so we don't need to wait for ng-if
      emitMenuShown($scope);
    }

    var docEventType = 'click';
    if (args && args.originalEvent && args.originalEvent.type && args.originalEvent.type === 'touchstart') {
      docEventType = args.originalEvent.type;
    }

    // Turn off an existing document click handler
    angular.element(document).off('click touchstart', ctx.applyHideMenu);
    $elm.off('keyup', ctx.checkKeyUp);
    $elm.off('keydown', ctx.checkKeyDown);

    // Turn on the document click handler, but in a timeout so it doesn't apply to THIS click if there is one
    $timeout(turnOnDocClickHandler.bind(null, $scope, $elm, ctx, docEventType));
    //automatically set the focus to the first button element in the now open menu.
    gridUtil.focus.bySelector($elm, 'button[type=button]', true);
  }

  function applyHideMenu ($scope){
    if (!$scope.shown) { 
      return; 
    }
    $scope.$apply($scope.hideMenu.bind($scope));
  }

  // close menu on ESC and keep tab cyclical
  function checkKeyUp ($scope, event) {
    if (event.keyCode !== 27) { return; }
    $scope.hideMenu();
  }

  function setFocus (elm, event) {
    elm.focus();
    event.preventDefault();
    return false;
  }

  function checkKeyDown ($scope, $elm, event) {
    if (event.keyCode !== 9) { return; }

    var firstMenuItem, lastMenuItem,
      menuItemButtons = $elm[0].querySelectorAll('button:not(.ng-hide)');

    if (menuItemButtons.length > 0) {
      firstMenuItem = menuItemButtons[0];
      lastMenuItem = menuItemButtons[menuItemButtons.length - 1];
      if (event.target === lastMenuItem && !event.shiftKey) {
        setFocus(firstMenuItem, event);
      } else if (event.target === firstMenuItem && event.shiftKey) {
        setFocus(lastMenuItem, event);
      }
    }
  }

  function hideMenu ($scope, $elm, ctx, event) {
    if ( $scope.shown ){
      /*
       * In order to animate cleanly we animate the addition of ng-hide, then use a $timeout to
       * set the ng-if (shown = false) after the animation runs.  In theory we can cascade off the
       * callback on the addClass method, but it is very unreliable with unit tests for no discernable reason.
       *
       * The user may have clicked on the menu again whilst
       * we're waiting, so we check that the mid isn't shown before applying the ng-if.
       */
      $scope.shownMid = false;
      $timeout( emitMenuHidden.bind(null, $scope), 200);
    }

    angular.element(document).off('click touchstart', ctx.applyHideMenu);
    $elm.off('keyup', ctx.checkKeyUp);
    $elm.off('keydown', ctx.checkKeyDown);
  }





  var uiGridMenu = {
    priority: 0,
    scope: {
      // shown: '&',
      menuItems: '=',
      autoHide: '=?'
    },
    require: '?^uiGrid',
    templateUrl: 'ui-grid/uiGridMenu',
    replace: false,
    link: function ($scope, $elm, $attrs, uiGridCtrl) {
      $scope.dynamicStyles = '';
      var ctx = {
          checkKeyUp : checkKeyUp.bind(null, $scope),
          checkKeyDown : checkKeyDown.bind(null, $scope, $elm),
          applyHideMenu : applyHideMenu.bind(null, $scope),
          setupHeightStyle : setupHeightStyle.bind(null, $scope, uiGridCtrl)
        };

      if (uiGridCtrl) {
        ctx.setupHeightStyle(uiGridCtrl.grid.gridHeight);
        uiGridCtrl.grid.api.core.on.gridDimensionChanged($scope, onGridDimensionChanged.bind(null, ctx));
      }

      $scope.i18n = {
        close: i18nService.getSafeText('columnMenu.close')
      };

      $scope.showMenu = showMenu.bind(null, $scope, $elm, ctx);
      $scope.hideMenu = hideMenu.bind(null, $scope, $elm, ctx);

      $scope.$on('hide-menu', $scope.hideMenu);
      $scope.$on('show-menu', $scope.showMenu);
      //TODO: and what about $off?

      if (typeof($scope.autoHide) === 'undefined' || $scope.autoHide === undefined) {
        $scope.autoHide = true;
      }

      if ($scope.autoHide) {
        angular.element($window).on('resize', ctx.applyHideMenu);
      }
      $scope.$on('$destroy', onDestroy.bind(null, $scope, ctx, uiGridCtrl));
    }
  };

  return uiGridMenu;
}])

.directive('uiGridMenuItem', ['gridUtil', '$compile', 'i18nService', function (gridUtil, $compile, i18nService) {
  function onGotTemplate ($scope, $elm, contents) {
    var template = angular.element(contents),
      newElm = $compile(template)($scope);

    $elm.replaceWith(newElm);
  }

  function returnTrue () { return true; }

  function itemAction ($scope, $elm, uiGridCtrl, $event, title) {
    $event.stopPropagation();

    if (typeof($scope.action) === 'function') {
      var context = {};

      if ($scope.context) {
        context.context = $scope.context;
      }

      // Add the grid to the function call context if the uiGrid controller is present
      if (typeof(uiGridCtrl) !== 'undefined' && uiGridCtrl) {
        context.grid = uiGridCtrl.grid;
      }

      $scope.action.call(context, $event, title);

      if ( !$scope.leaveOpen ){
        $scope.$emit('hide-menu');
      } else {
        /*
         * XXX: Fix after column refactor
         * Ideally the focus would remain on the item.
         * However, since there are two menu items that have their 'show' property toggled instead. This is a quick fix.
         */
        gridUtil.focus.bySelector(angular.element(gridUtil.closestElm($elm, ".ui-grid-menu-items")), 'button[type=button]', true);
      }
    }
  }

  function itemShown ($scope, uiGridCtrl) {
    var context = {};
    if ($scope.context) {
      context.context = $scope.context;
    }

    if (typeof(uiGridCtrl) !== 'undefined' && uiGridCtrl) {
      context.grid = uiGridCtrl.grid;
    }

    return $scope.shown.call(context);
  }


  var uiGridMenuItem = {
    priority: 0,
    scope: {
      name: '=',
      active: '=',
      action: '=',
      icon: '=',
      shown: '=',
      context: '=',
      templateUrl: '=',
      leaveOpen: '=',
      screenReaderOnly: '='
    },
    require: ['?^uiGrid'],
    templateUrl: 'ui-grid/uiGridMenuItem',
    replace: false,
    compile: function() {
      return {
        pre: function ($scope, $elm) {
          if (!$scope.templateUrl) { return; }

          gridUtil.getTemplate($scope.templateUrl)
              .then(onGotTemplate.bind($scope, $elm));
        },

        post: function ($scope, $elm, $attrs, controllers) {
          var uiGridCtrl = controllers[0];

          // TODO(c0bra): validate that shown and active are functions if they're defined. An exception is already thrown above this though
          // if (typeof($scope.shown) !== 'undefined' && $scope.shown && typeof($scope.shown) !== 'function') {
          //   throw new TypeError("$scope.shown is defined but not a function");
          // }
          if (typeof($scope.shown) === 'undefined' || $scope.shown === null) {
            $scope.shown = returnTrue;
          }

          $scope.itemShown = itemShown.bind(null, $scope, uiGridCtrl);
          $scope.itemAction = itemAction.bind(null, $scope, $elm, uiGridCtrl);

          $scope.i18n = i18nService.get();
        }
      };
    }
  };

  return uiGridMenuItem;
}]);

})();
