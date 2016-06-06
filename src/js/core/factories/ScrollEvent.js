(function () {
  angular.module('ui.grid')
    .factory('ScrollEvent', ['gridUtil', function (gridUtil) {

      /**
       * @ngdoc function
       * @name ui.grid.class:ScrollEvent
       * @description Model for all scrollEvents
       * @param {Grid} grid that owns the scroll event
       * @param {GridRenderContainer} sourceRowContainer that owns the scroll event. Can be null
       * @param {GridRenderContainer} sourceColContainer that owns the scroll event. Can be null
       * @param {string} source the source of the event - from uiGridConstants.scrollEventSources or a string value of directive/service/factory.functionName
       */
      function ScrollEvent(grid, sourceRowContainer, sourceColContainer, source) {
        if (!grid) {
          throw new Error("grid argument is required");
        }

        /**
         *  @ngdoc object
         *  @name grid
         *  @propertyOf  ui.grid.class:ScrollEvent
         *  @description A reference back to the grid
         */
         this.grid = grid;



        /**
         *  @ngdoc object
         *  @name source
         *  @propertyOf  ui.grid.class:ScrollEvent
         *  @description the source of the scroll event. limited to values from uiGridConstants.scrollEventSources
         */
        this.source = source;


        /**
         *  @ngdoc object
         *  @name noDelay
         *  @propertyOf  ui.grid.class:ScrollEvent
         *  @description most scroll events from the mouse or trackpad require delay to operate properly
         *  set to false to eliminate delay.  Useful for scroll events that the grid causes, such as scrolling to make a row visible.
         */
        this.withDelay = true;

        this.sourceRowContainer = sourceRowContainer;
        this.sourceColContainer = sourceColContainer;

        this.newScrollLeft = null;
        this.newScrollTop = null;
        this.x = null;
        this.y = null;

        this.verticalScrollLength = -9999999;
        this.horizontalScrollLength = -999999;


        /**
         *  @ngdoc function
         *  @name fireThrottledScrollingEvent
         *  @methodOf  ui.grid.class:ScrollEvent
         *  @description fires a throttled event using grid.api.core.raise.scrollEvent
         */
        this.fireThrottledScrollingEvent = gridUtil.throttle(throttleSourceContainerId.bind(null, this), this.grid.options.wheelScrollThrottle, {trailing: true});

      }

      function throttleSourceContainerId (se, sourceContainerId) {
        se.grid.scrollContainers(sourceContainerId, se);
      }


      /**
       *  @ngdoc function
       *  @name getNewScrollLeft
       *  @methodOf  ui.grid.class:ScrollEvent
       *  @description returns newScrollLeft property if available; calculates a new value if it isn't
       */
      ScrollEvent.prototype.getNewScrollLeft = function(colContainer, viewport){
        if (!this.newScrollLeft){
          var scrollWidth = (colContainer.getCanvasWidth() - colContainer.getViewportWidth());

          var oldScrollLeft = gridUtil.normalizeScrollLeft(viewport, this.grid);

          var scrollXPercentage;
          if (typeof(this.x.percentage) !== 'undefined' && this.x.percentage !== undefined) {
            scrollXPercentage = this.x.percentage;
          }
          else if (typeof(this.x.pixels) !== 'undefined' && this.x.pixels !== undefined) {
            scrollXPercentage = this.x.percentage = (oldScrollLeft + this.x.pixels) / scrollWidth;
          }
          else {
            throw new Error("No percentage or pixel value provided for scroll event X axis");
          }

          return Math.max(0, scrollXPercentage * scrollWidth);
        }

        return this.newScrollLeft;
      };


      /**
       *  @ngdoc function
       *  @name getNewScrollTop
       *  @methodOf  ui.grid.class:ScrollEvent
       *  @description returns newScrollTop property if available; calculates a new value if it isn't
       */
      ScrollEvent.prototype.getNewScrollTop = function(rowContainer, viewport){
        if (!this.newScrollTop){
          var scrollLength = rowContainer.getVerticalScrollLength();

          var oldScrollTop = viewport[0].scrollTop;

          var scrollYPercentage;
          if (typeof(this.y.percentage) !== 'undefined' && this.y.percentage !== undefined) {
            scrollYPercentage = this.y.percentage;
          }
          else if (typeof(this.y.pixels) !== 'undefined' && this.y.pixels !== undefined) {
            scrollYPercentage = this.y.percentage = (oldScrollTop + this.y.pixels) / scrollLength;
          }
          else {
            throw new Error("No percentage or pixel value provided for scroll event Y axis");
          }

          return Math.max(0, scrollYPercentage * scrollLength);
        }

        return this.newScrollTop;
      };

      ScrollEvent.prototype.atTop = function(scrollTop) {
        return (this.y && (this.y.percentage === 0 || this.verticalScrollLength < 0) && scrollTop === 0);
      };

      ScrollEvent.prototype.atBottom = function(scrollTop) {
        return (this.y && (this.y.percentage === 1 || this.verticalScrollLength === 0) && scrollTop > 0);
      };

      ScrollEvent.prototype.atLeft = function(scrollLeft) {
        return (this.x && (this.x.percentage === 0 || this.horizontalScrollLength < 0) && scrollLeft === 0);
      };

      ScrollEvent.prototype.atRight = function(scrollLeft) {
        return (this.x && (this.x.percentage === 1 || this.horizontalScrollLength ===0) && scrollLeft > 0);
      };


      ScrollEvent.Sources = {
        ViewPortScroll: 'ViewPortScroll',
        RenderContainerMouseWheel: 'RenderContainerMouseWheel',
        RenderContainerTouchMove: 'RenderContainerTouchMove',
        Other: 99
      };

      return ScrollEvent;
    }]);



})();
