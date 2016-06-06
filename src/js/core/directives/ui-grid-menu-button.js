(function(){

angular.module('ui.grid')
.service('uiGridGridMenuService', [ 'gridUtil', 'i18nService', 'uiGridConstants', function( gridUtil, i18nService, uiGridConstants ) {
  /**
   *  @ngdoc service
   *  @name ui.grid.gridMenuService
   *
   *  @description Methods for working with the grid menu
   */

   function sortOrder (a, b) {
    return a.order - b.order;
   }


   function Service () {
   }
   /**
    * @ngdoc method
    * @methodOf ui.grid.gridMenuService
    * @name initialize
    * @description Sets up the gridMenu. Most importantly, sets our
    * scope onto the grid object as grid.gridMenuScope, allowing us
    * to operate when passed only the grid.  Second most importantly,
    * we register the 'addToGridMenu' and 'removeFromGridMenu' methods
    * on the core api.
    * @param {$scope} $scope the scope of this gridMenu
    * @param {Grid} grid the grid to which this gridMenu is associated
    */

    function onDestroy ($scope) {
      if ( $scope.grid && $scope.grid.gridMenuScope ){
        $scope.grid.gridMenuScope = null;
      }
      if ( $scope.grid ){
        $scope.grid = null;
      }
      if ( $scope.registeredMenuItems ){
        $scope.registeredMenuItems = null;
      }
    }
    Service.prototype.initialize = function( $scope, grid ){
      grid.gridMenuScope = $scope;
      $scope.grid = grid;
      $scope.registeredMenuItems = [];

      // not certain this is needed, but would be bad to create a memory leak
      $scope.$on('$destroy', onDestroy.bind(null,$scope));

      $scope.registeredMenuItems = [];

      /**
       * @ngdoc function
       * @name addToGridMenu
       * @methodOf ui.grid.core.api:PublicApi
       * @description add items to the grid menu.  Used by features
       * to add their menu items if they are enabled, can also be used by
       * end users to add menu items.  This method has the advantage of allowing
       * remove again, which can simplify management of which items are included
       * in the menu when.  (Noting that in most cases the shown and active functions
       * provide a better way to handle visibility of menu items)
       * @param {Grid} grid the grid on which we are acting
       * @param {array} items menu items in the format as described in the tutorial, with
       * the added note that if you want to use remove you must also specify an `id` field,
       * which is provided when you want to remove an item.  The id should be unique.
       *
       */
      grid.api.registerMethod( 'core', 'addToGridMenu', this.addToGridMenu.bind(this) );

      /**
       * @ngdoc function
       * @name removeFromGridMenu
       * @methodOf ui.grid.core.api:PublicApi
       * @description Remove an item from the grid menu based on a provided id. Assumes
       * that the id is unique, removes only the last instance of that id. Does nothing if
       * the specified id is not found
       * @param {Grid} grid the grid on which we are acting
       * @param {string} id the id we'd like to remove from the menu
       *
       */
      grid.api.registerMethod( 'core', 'removeFromGridMenu', this.removeFromGridMenu.bind(this) );
    };


    /**
     * @ngdoc function
     * @name addToGridMenu
     * @propertyOf ui.grid.gridMenuService
     * @description add items to the grid menu.  Used by features
     * to add their menu items if they are enabled, can also be used by
     * end users to add menu items.  This method has the advantage of allowing
     * remove again, which can simplify management of which items are included
     * in the menu when.  (Noting that in most cases the shown and active functions
     * provide a better way to handle visibility of menu items)
     * @param {Grid} grid the grid on which we are acting
     * @param {array} items menu items in the format as described in the tutorial, with
     * the added note that if you want to use remove you must also specify an `id` field,
     * which is provided when you want to remove an item.  The id should be unique.
     *
     */
    Service.prototype.addToGridMenu = function( grid, menuItems ) {
      if ( !angular.isArray( menuItems ) ) {
        gridUtil.logError( 'addToGridMenu: menuItems must be an array, and is not, not adding any items');
      } else {
        if ( grid.gridMenuScope ){
          grid.gridMenuScope.registeredMenuItems = grid.gridMenuScope.registeredMenuItems ? grid.gridMenuScope.registeredMenuItems : [];
          grid.gridMenuScope.registeredMenuItems = grid.gridMenuScope.registeredMenuItems.concat( menuItems );
        } else {
          gridUtil.logError( 'Asked to addToGridMenu, but gridMenuScope not present.  Timing issue?  Please log issue with ui-grid');
        }
      }
    };


    /**
     * @ngdoc function
     * @name removeFromGridMenu
     * @methodOf ui.grid.gridMenuService
     * @description Remove an item from the grid menu based on a provided id.  Assumes
     * that the id is unique, removes only the last instance of that id.  Does nothing if
     * the specified id is not found.  If there is no gridMenuScope or registeredMenuItems
     * then do nothing silently - the desired result is those menu items not be present and they
     * aren't.
     * @param {Grid} grid the grid on which we are acting
     * @param {string} id the id we'd like to remove from the menu
     *
     */

    function findIndex (id, prev, value, index) {
      if ( value.id === id ){
        if (prev > -1) {
          gridUtil.logError( 'removeFromGridMenu: found multiple items with the same id, removing only the last' );
        } else {
          return index;
        }
      }
      return prev;
    }
    Service.prototype.removeFromGridMenu = function( grid, id ){
      var foundIndex = -1;

      if ( grid && grid.gridMenuScope ){
        foundIndex = grid.gridMenuScope.registeredMenuItems.reduce( findIndex.bind(null, id), foundIndex );
      }

      if ( foundIndex > -1 ){
        grid.gridMenuScope.registeredMenuItems.splice( foundIndex, 1 );
      }
    };


    /**
     * @ngdoc array
     * @name gridMenuCustomItems
     * @propertyOf ui.grid.class:GridOptions
     * @description (optional) An array of menu items that should be added to
     * the gridMenu.  Follow the format documented in the tutorial for column
     * menu customisation.  The context provided to the action function will
     * include context.grid.  An alternative if working with dynamic menus is to use the
     * provided api - core.addToGridMenu and core.removeFromGridMenu, which handles
     * some of the management of items for you.
     *
     */
    /**
     * @ngdoc boolean
     * @name gridMenuShowHideColumns
     * @propertyOf ui.grid.class:GridOptions
     * @description true by default, whether the grid menu should allow hide/show
     * of columns
     *
     */
    /**
     * @ngdoc method
     * @methodOf ui.grid.gridMenuService
     * @name getMenuItems
     * @description Decides the menu items to show in the menu.  This is a
     * combination of:
     *
     * - the default menu items that are always included,
     * - any menu items that have been provided through the addMenuItem api. These
     *   are typically added by features within the grid
     * - any menu items included in grid.options.gridMenuCustomItems.  These can be
     *   changed dynamically, as they're always recalculated whenever we show the
     *   menu
     * @param {$scope} $scope the scope of this gridMenu, from which we can find all
     * the information that we need
     * @returns {array} an array of menu items that can be shown
     */

    function _clearFlters ($scope, $event){
      $scope.grid.clearAllFilters(undefined, true, undefined);
    }
    function _shown ($scope) {
      return $scope.grid.options.enableFiltering;
    }
    Service.prototype.getMenuItems = function( $scope ) {
      var menuItems = [
        // this is where we add any menu items we want to always include
      ];

      if ( $scope.grid.options.gridMenuCustomItems ){
        if ( !angular.isArray( $scope.grid.options.gridMenuCustomItems ) ){
          gridUtil.logError( 'gridOptions.gridMenuCustomItems must be an array, and is not');
        } else {
          menuItems = Array.prototype.push.apply(menuItems, $scope.grid.options.gridMenuCustomItems );
        }
      }

      var clearFilters = [{
        title: i18nService.getSafeText('gridMenu.clearAllFilters'),
        action: _clearFlters.bind(null, $scope),
        shown: _shown.bind(null, $scope),
        order: 100
      }];
      Array.prototype.push.apply(menuItems, clearFilters );
      Array.prototype.push.apply(menuItems, $scope.registeredMenuItems );

      if ( $scope.grid.options.gridMenuShowHideColumns !== false ){
        Array.prototype.push.apply(menuItems, this.showHideColumns( $scope ) );
      }

      menuItems.sort(sortOrder);
      return menuItems;
    };


    /**
     * @ngdoc array
     * @name gridMenuTitleFilter
     * @propertyOf ui.grid.class:GridOptions
     * @description (optional) A function that takes a title string
     * (usually the col.displayName), and converts it into a display value.  The function
     * must return either a string or a promise.
     *
     * Used for internationalization of the grid menu column names - for angular-translate
     * you can pass $translate as the function, for i18nService you can pass getSafeText as the
     * function
     * @example
     * <pre>
     *   gridOptions = {
     *     gridMenuTitleFilter: $translate
     *   }
     * </pre>
     */
    /**
     * @ngdoc method
     * @methodOf ui.grid.gridMenuService
     * @name showHideColumns
     * @description Adds two menu items for each of the columns in columnDefs.  One
     * menu item for hide, one menu item for show.  Each is visible when appropriate
     * (show when column is not visible, hide when column is visible).  Each toggles
     * the visible property on the columnDef using toggleColumnVisibility
     * @param {$scope} $scope of a gridMenu, which contains a reference to the grid
     */

    function menuItemAction (menuitem, service, $event){
      $event.stopPropagation();
      service.toggleColumnVisibility( menuitem.context.gridCol );
    }

    //ovde nesto lepo pucka ;)
    function isItemShown (item) {
      var f = item.context.gridCol.colDef.visible === true || item.context.gridCol.colDef.visible === undefined; 
      return item.odd ? f : !f;
    }

    function MenuItem ($scope, service, colDef, icon, index, odd) {
      this.icon = icon;
      this.context = {
        gridCol : $scope.grid.getColumn(colDef.name || colDef.field)
      };
      this.leaveOpen = true;
      this.order = 301 + index*2 + (odd ? 1 : 0);
      this.service = service;
      this.action = menuItemAction.bind(null, this, this.service, event);
      this.shown = isItemShown.bind(null, this);
      this.odd = odd;
    }

    function traverseColDef($scope, service, showHideColumns, colDef, index ){
      if ( colDef.enableHiding !== false ){
        // add hide menu item - shows an OK icon as we only show when column is already visible

        var menuItem = new MenuItem($scope, service, colDef, 'ui-grid-icon-ok', index, false);
        service.setMenuItemTitle( menuItem, colDef, $scope.grid );
        showHideColumns.push( menuItem );

        // add show menu item - shows no icon as we only show when column is invisible
        menuItem = new MenuItem($scope, service, colDef, 'ui-grid-icon-cancel', index, true);
        service.setMenuItemTitle( menuItem, colDef, $scope.grid );
        showHideColumns.push( menuItem );
      }
    }

    Service.prototype.showHideColumns = function( $scope ){
      var showHideColumns = [];
      if ( !$scope.grid.options.columnDefs || $scope.grid.options.columnDefs.length === 0 || $scope.grid.columns.length === 0 ) {
        return showHideColumns;
      }

      // add header for columns
      showHideColumns.push({
        title: i18nService.getSafeText('gridMenu.columns'),
        order: 300
      });

      $scope.grid.options.gridMenuTitleFilter = $scope.grid.options.gridMenuTitleFilter ? $scope.grid.options.gridMenuTitleFilter : function( title ) { return title; };

      $scope.grid.options.columnDefs.forEach(traverseColDef.bind(null, $scope, this, showHideColumns));
      return showHideColumns;
    };


    /**
     * @ngdoc method
     * @methodOf ui.grid.gridMenuService
     * @name setMenuItemTitle
     * @description Handles the response from gridMenuTitleFilter, adding it directly to the menu
     * item if it returns a string, otherwise waiting for the promise to resolve or reject then
     * putting the result into the title
     * @param {object} menuItem the menuItem we want to put the title on
     * @param {object} colDef the colDef from which we can get displayName, name or field
     * @param {Grid} grid the grid, from which we can get the options.gridMenuTitleFilter
     *
     */

    function onTitle (menuItem, val) {
      menuItem.title = val;
    }

    Service.prototype.setMenuItemTitle = function( menuItem, colDef, grid ){
      var title = grid.options.gridMenuTitleFilter( colDef.displayName || gridUtil.readableColumnName(colDef.name) || colDef.field );

      if ( typeof(title) === 'string' ){
        menuItem.title = title;
      } else if ( title.then ){
        // must be a promise
        menuItem.title = "";
        title.then( onTitle.bind(null, menuItem), onTitle.bind(null, menuItem));
      } else {
        gridUtil.logError('Expected gridMenuTitleFilter to return a string or a promise, it has returned neither, bad config');
        menuItem.title = 'badconfig';
      }
    };

    /**
     * @ngdoc method
     * @methodOf ui.grid.gridMenuService
     * @name toggleColumnVisibility
     * @description Toggles the visibility of an individual column.  Expects to be
     * provided a context that has on it a gridColumn, which is the column that
     * we'll operate upon.  We change the visibility, and refresh the grid as appropriate
     * @param {GridCol} gridCol the column that we want to toggle
     *
     */
    Service.prototype.toggleColumnVisibility = function( gridCol ) {
      gridCol.colDef.visible = !( gridCol.colDef.visible === true || gridCol.colDef.visible === undefined );

      gridCol.grid.refresh();
      gridCol.grid.api.core.notifyDataChange( uiGridConstants.dataChange.COLUMN );
      gridCol.grid.api.core.raise.columnVisibilityChanged( gridCol );
    };
  return new Service();
}])



.directive('uiGridMenuButton', ['gridUtil', 'uiGridConstants', 'uiGridGridMenuService', 'i18nService',
function (gridUtil, uiGridConstants, uiGridGridMenuService, i18nService) {

  return {
    priority: 0,
    scope: true,
    require: ['^uiGrid'],
    templateUrl: 'ui-grid/ui-grid-menu-button',
    replace: true,

    link: function ($scope, $elm, $attrs, controllers) {
      var uiGridCtrl = controllers[0];

      // For the aria label
      $scope.i18n = {
        aria: i18nService.getSafeText('gridMenu.aria')
      };

      uiGridGridMenuService.initialize($scope, uiGridCtrl.grid);

      $scope.shown = false;

      $scope.toggleMenu = function () {
        if ( $scope.shown ){
          $scope.$broadcast('hide-menu');
          $scope.shown = false;
        } else {
          $scope.menuItems = uiGridGridMenuService.getMenuItems( $scope );
          $scope.$broadcast('show-menu');
          $scope.shown = true;
        }
      };

      $scope.$on('menu-hidden', function() {
        $scope.shown = false;
        gridUtil.focus.bySelector($elm, '.ui-grid-icon-container');
      });
    }
  };

}]);

})();
