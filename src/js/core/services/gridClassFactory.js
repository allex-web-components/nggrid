(function () {
  'use strict';
  /**
   *  @ngdoc object
   *  @name ui.grid.service:gridClassFactory
   *
   *  @description factory to return dom specific instances of a grid
   *
   */
  angular.module('ui.grid').service('gridClassFactory', ['gridUtil', '$q', '$compile', '$templateCache', 'uiGridConstants', 'Grid', 'GridColumn', 'GridRow',
    function (gridUtil, $q, $compile, $templateCache, uiGridConstants, Grid, GridColumn, GridRow) {

      function GridClassFactory (){
      }

        /**
         * @ngdoc method
         * @name createGrid
         * @methodOf ui.grid.service:gridClassFactory
         * @description Creates a new grid instance. Each instance will have a unique id
         * @param {object} options An object map of options to pass into the created grid instance.
         * @returns {Grid} grid
         */

      function onGotTemplate (rowTemplateFnPromise, template) {
        var rowTemplateFn = $compile(template);
        rowTemplateFnPromise.resolve(rowTemplateFn);
      }
      function onTemplateFaied (grid, res) {
        throw new Error("Couldn't fetch/use row template '" + grid.options.rowTemplate + "'");
      }

      function traverseVisibleRows (row) {
        row.evaluateRowVisibility( true );
      }

      function allRowsVisible(rows) {
        rows.forEach(traverseVisibleRows);
        return rows;
      }

      function setVisible(column) {
        column.visible = true;
      }

      function allColumnsVisible (columns) {
        columns.forEach(setVisible);
        return columns;
      }

      function decideVisible (column){
        if (column.colDef.visible === false) {
            column.visible = false;
        }
      }

      function allRendColumnsVisible (renderableColumns) {
        renderableColumns.forEach(decideVisible);
        return renderableColumns;
      }

      GridClassFactory.prototype.createGrid = function(options) {
        options = (typeof(options) !== 'undefined') ? options : {};
        options.id = gridUtil.newId();
        var grid = new Grid(options);

        // NOTE/TODO: rowTemplate should always be defined...
        if (grid.options.rowTemplate) {
          var rowTemplateFnPromise = $q.defer();
          grid.getRowTemplateFn = rowTemplateFnPromise.promise;
          
          gridUtil.getTemplate(grid.options.rowTemplate)
            .then(onGotTemplate.bind(null, rowTemplateFnPromise), onTemplateFaied.bind(null, grid));
        }

      grid.registerColumnBuilder(this.defaultColumnBuilder);

      // Row builder for custom row templates
      grid.registerRowBuilder(this.rowTemplateAssigner);

      // Reset all rows to visible initially
      grid.registerRowsProcessor(allRowsVisible, 50);
      grid.registerColumnsProcessor(allColumnsVisible, 50);
      grid.registerColumnsProcessor(allRendColumnsVisible, 50);

      grid.registerRowsProcessor(grid.searchRows, 100);

      // Register the default row processor, it sorts rows by selected columns
      if (grid.options.externalSort && angular.isFunction(grid.options.externalSort)) {
        grid.registerRowsProcessor(grid.options.externalSort, 200);
      }
      else {
        grid.registerRowsProcessor(grid.sortByColumn, 200);
      }

      return grid;
    };

      /**
       * @ngdoc function
       * @name defaultColumnBuilder
       * @methodOf ui.grid.service:gridClassFactory
       * @description Processes designTime column definitions and applies them to col for the
       *              core grid features
       * @param {object} colDef reference to column definition
       * @param {GridColumn} col reference to gridCol
       * @param {object} gridOptions reference to grid options
       */

    function onGridUtilTemplate (tooltipType, col, filterType, templateType, template) {
      if ( angular.isFunction(template) ) { template = template();    }
      var tooltipCall = ( tooltipType === 'cellTooltip' ) ? 'col.cellTooltip(row,col)' : 'col.headerTooltip(col)';
      if ( tooltipType && col[tooltipType] === false ){
        template = template.replace(uiGridConstants.TOOLTIP, '');
      } else if ( tooltipType && col[tooltipType] ){
        template = template.replace(uiGridConstants.TOOLTIP, 'title="{{' + tooltipCall + ' CUSTOM_FILTERS }}"');
      }

      if ( filterType ){
        col[templateType] = template.replace(uiGridConstants.CUSTOM_FILTERS, function() {
          return col[filterType] ? "|" + col[filterType] : "";
        });
      } else {
        col[templateType] = template;
      }
    }

    function onGridUtilTemplateFailed (templateType, colDef, res) {
      throw new Error("Couldn't fetch/use colDef." + templateType + " '" + colDef[templateType] + "'");
    }

    function processTemplateF (colDef, col, gridOptions, templateGetPromises,  templateType, providedType, defaultTemplate, filterType, tooltipType ) {
      if ( !colDef[templateType] ){
        col[providedType] = defaultTemplate;
      } else {
        col[providedType] = colDef[templateType];
      }

       templateGetPromises.push(gridUtil.getTemplate(col[providedType])
          .then(onGridUtilTemplate.bind(null, tooltipType, col, filterType, templateType), onGridUtilTemplateFailed.bind(null, templateType, colDef))
      );
    }

    GridClassFactory.prototype.defaultColumnBuilder = function (colDef, col, gridOptions) {

        var templateGetPromises = [];

        // Abstracts the standard template processing we do for every template type.
        


        /**
         * @ngdoc property
         * @name cellTemplate
         * @propertyOf ui.grid.class:GridOptions.columnDef
         * @description a custom template for each cell in this column.  The default
         * is ui-grid/uiGridCell.  If you are using the cellNav feature, this template
         * must contain a div that can receive focus.
         *
         */
         var processTemplate = processTemplateF.bind(null, colDef, col, gridOptions, templateGetPromises);
        processTemplate( 'cellTemplate', 'providedCellTemplate', 'ui-grid/uiGridCell', 'cellFilter', 'cellTooltip' );
        col.cellTemplatePromise = templateGetPromises[0];

        /**
         * @ngdoc property
         * @name headerCellTemplate
         * @propertyOf ui.grid.class:GridOptions.columnDef
         * @description a custom template for the header for this column.  The default
         * is ui-grid/uiGridHeaderCell
         *
         */
        processTemplate( 'headerCellTemplate', 'providedHeaderCellTemplate', 'ui-grid/uiGridHeaderCell', 'headerCellFilter', 'headerTooltip' );

        /**
         * @ngdoc property
         * @name footerCellTemplate
         * @propertyOf ui.grid.class:GridOptions.columnDef
         * @description a custom template for the footer for this column.  The default
         * is ui-grid/uiGridFooterCell
         *
         */
        processTemplate( 'footerCellTemplate', 'providedFooterCellTemplate', 'ui-grid/uiGridFooterCell', 'footerCellFilter' );

        /**
         * @ngdoc property
         * @name filterHeaderTemplate
         * @propertyOf ui.grid.class:GridOptions.columnDef
         * @description a custom template for the filter input.  The default is ui-grid/ui-grid-filter
         *
         */
        processTemplate( 'filterHeaderTemplate', 'providedFilterHeaderTemplate', 'ui-grid/ui-grid-filter' );

        // Create a promise for the compiled element function
        col.compiledElementFnDefer = $q.defer();

        return $q.all(templateGetPromises);
      };


      function onRowTemplate (perRowTemplateFnPromise, template) {
        // Compile the template
        var rowTemplateFn = $compile(template);
        // Resolve the compiled template function promise
        perRowTemplateFnPromise.resolve(rowTemplateFn);
      }

      function onRowTemplateFailed (row, res){
        // Todo handle response error here?
        throw new Error("Couldn't fetch/use row template '" + row.rowTemplate + "'");
      }
      

      GridClassFactory.prototype.rowTemplateAssigner = function rowTemplateAssigner(row) {
        var grid = this;

        // Row has no template assigned to it
        if (!row.rowTemplate) {
          // Use the default row template from the grid
          row.rowTemplate = grid.options.rowTemplate;

          // Use the grid's function for fetching the compiled row template function
          row.getRowTemplateFn = grid.getRowTemplateFn;
        }
        // Row has its own template assigned
        else {
          // Create a promise for the compiled row template function
          var perRowTemplateFnPromise = $q.defer();
          row.getRowTemplateFn = perRowTemplateFnPromise.promise;

          // Get the row template
          gridUtil.getTemplate(row.rowTemplate)
            .then(onRowTemplate.bind(null, perRowTemplateFnPromise), onRowTemplateFailed.bind(null, row));
        }

        return row.getRowTemplateFn;
      };

  //class definitions (moved to separate factories)

      return new GridClassFactory();
    }]);

})();
