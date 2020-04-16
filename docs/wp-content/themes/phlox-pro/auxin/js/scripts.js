/*! Auxin WordPress Framework - v5.2.22 - 2020-02-10
 *  Scripts for initializing admin plugins 

 *  http://averta.net
 *  (c) 2014-2020 averta;
 */



/* ================== auxin/js/src/_dependency-manager.js =================== */


/**
 * Auxin dependency manager
 *
 * @package Auxin Framework
 * @author Averta
 */

(function($, window, document, undefined){
  "use strict";

    // default options
    var dependencyDefaultOptions = {
        fieldContainer : '.field-row',
        relation       : 'and',
        fieldMapper    : function( target ) { return '#' + target; },
        observerMapper : function( target ) { return '#' + target; }
    };

    /**
    * Constructor
    * @param {Object}  $wrapper         Container of fields
    * @param {Object}  options          Object of dependency options
    * @param {Object}  dependencyGraph  Object which maps dependency graph
    */
    function DependencyManager( $wrapper, options, dependencyGraph ){
        this.options = $.extend( dependencyDefaultOptions, options );
        this.$wrapper = $wrapper;
        this.dependencyGraph = dependencyGraph;
        this.$observers = [];
    }

    var p = DependencyManager.prototype;

    p.setup = function() {
        for ( var depField in this.dependencyGraph ) {
            for ( var observeField in this.dependencyGraph[depField] ) {
                if ( observeField === 'relation' ) {
                    continue;
                }
                var $observer = this.$wrapper.find( this.options.observerMapper( observeField ) );
                if ( !$observer.data( 'added-before' ) ) {
                    this.$observers.push( $observer.on( 'change', this._toggleDependecies.bind(this) ) );
                    $observer.data( 'added-before', true );
                }
            }
        }

        // call dependency for all at starting
        this._toggleDependecies();
    };

    /* ------------------------------------------------------------------------------ */
    /**
    * Check observers value and show or hide dependency fields
    * @return {void}
    */
    p._toggleDependecies = function( e ) {

        var $depField, $observerField, observerValue, isDepValueSelected,
            finalVisibleStatus, goalObserverValue, relation, ObserverCompareOperator;

        for ( var depField in this.dependencyGraph ){

            if( !depField ) {
                continue;
            }

            var depFieldSelector = this.options.fieldMapper( depField );

            // depField is the field that we are looking for its observers
            $depField = this.$wrapper.find( depFieldSelector );

            // A fix for selecting typography elements
            if( ! $depField.length ){
                $depField = this.$wrapper.find( depFieldSelector + '_font' );
            }

            // Let's check what is the relation of field dependencies
            relation = (this.dependencyGraph[depField].relation || this.options.relation).toLowerCase();

            // define initial value for finalVisibleStatus according to relation
            finalVisibleStatus = "and" === relation ? true : false;

            // loop in dependencies of field
            for( var observerField in this.dependencyGraph[depField] ){

                if ( observerField === 'relation' ) {
                    continue;
                }

                $observerField = this.$wrapper.find( this.options.observerMapper( observerField ) );

                if( ! $observerField.length ) {
                    continue;
                }

                observerValue            = $observerField.val();
                goalObserverValue        = this.dependencyGraph[depField][observerField].value; // what value we are waiting for
                ObserverCompareOperator  = this.dependencyGraph[depField][observerField].operator || '=='; // what is the comparison operator

                // Make sure goalObserverValue is array
                if( !goalObserverValue instanceof Array ) {
                    goalObserverValue = goalObserverValue.split("^");
                }

                // @if DEV
                // console.log('Observers value for ' + observerField + ': '    + observerValue);
                // console.log('Observers goal value : ' + ObserverCompareOperator + goalObserverValue);
                // @endif

                // Check if current value of observer field is the value which script is waiting for
                if( $observerField[0].type === 'checkbox' ){ // an exception, if observer value is check box
                    observerValue = $observerField[0].checked ? '1' : '0';
                    // @if DEV
                    // console.log( "The result of comparison of  " + observerValue + ObserverCompareOperator + goalObserverValue + " is :" ,
                    //              this._inArray( observerValue, goalObserverValue, ObserverCompareOperator )
                    // );
                    // @endif
                } else if ( $observerField[0].type === 'hidden' ) {
                    continue;
                }

                isDepValueSelected = this._inArray( observerValue, goalObserverValue, ObserverCompareOperator );

                if( "and" === relation ){
                    finalVisibleStatus = finalVisibleStatus && isDepValueSelected;
                } else {
                    finalVisibleStatus = finalVisibleStatus || isDepValueSelected;
                }
            }

            // console.log( 'result of observers status for "'+ depField +'" field is: ' + isDepValueSelected );

            // at the end, let's hide or show the field based on result
            if( finalVisibleStatus ){
                $depField.closest( this.options.fieldContainer ).show();
            } else {
                $depField.closest( this.options.fieldContainer ).hide();
            }

        }

        // Add a css class to wrapper of observer field, when it is enabled
        if ( e ) {
            var $target = $(e.target);
            if( $target[0].checked ){
              $target.closest('.field-row').addClass('open');
            } else {
              $target.closest('.field-row').removeClass('open');
            }
        }

    };

  /**
   * Check whether value exist in list or not
   *
   * @param  {string|init} needle     Value which we are looking for in list
   * @param  {array} haystack         List of items which we are searching in
   * @return {boolean}                True if the value exist in list
   */
    p._inArray = function( needle, haystack, operator ) {
        if( undefined === operator ){
            operator = '==';
        }
        var result;
        // make sure the haystack is array
        if( haystack.constructor !== Array ){
            haystack = typeof haystack == 'string' ? haystack.split(',') : [haystack];
        }

        for( var i = 0, length = haystack.length; i < length; i++ ) {
            switch( operator ) {
                case '==':
                    result = needle == haystack[i];
                    break;
                case '===':
                    result = needle === haystack[i];
                    break;
                case '!=':
                    result = needle != haystack[i];
                    break;
                case '!==':
                    result = needle !== haystack[i];
                    break;
                case '>=':
                    result = needle >= haystack[i];
                    break;
                case '<=':
                    result = needle <= haystack[i];
                    break;
                case '>':
                    result = needle > haystack[i];
                    break;
                case '<':
                    result = needle < haystack[i];
                    break;
            }

            if ( result ) {
                return true;
            }
            // @if DEV
            // we had no luck on using eval on comparison check with strings
            // return eval( needle + operator + haystack[i] );
            // @endif
        }

        return false;
    };

    window.DependencyManager = DependencyManager;

    /* ------------------------------------------------------------------------------ */

    $(function(){
        var $metabox, opsDeps;

        // Start to watch for field dependencies in metaboxes
        if ( auxin.metabox ) {
            for ( var metaboxID in auxin.metabox ) {

                var metaboxDepData = auxin.metabox[ metaboxID ].dependencies;
                $metabox = $('#'+ metaboxID );

                if ( $metabox.length ) {
                    // Create a depene watcher for each metabox
                    opsDeps = new DependencyManager( $metabox, {} , metaboxDepData );
                    opsDeps.setup();
                }
            }
        }

        // Start to watch for option panel dependencies
        var $panel = $('.auxin_options_form');

        if ( $panel.length && auxin.optionpanel ) {
            opsDeps = new DependencyManager( $panel, {}, auxin.optionpanel );
            opsDeps.setup();
        }
    });

})(jQuery, window, document);


/* ================== auxin/js/src/_init.js =================== */


/*=======================================================================================
 *  Init Admin scripts
 *======================================================================================*/

;(function($, window, document, undefined){
    "use strict";

    $(function(){

        var isWidgetsPage = $('body').hasClass( 'widgets-php' );

        ////// init plugins //////////////////////////////////////////////////


        // init tabs for option pnale
        $('.av3_option_panel').avertaMultiTabs({
            enableHash:      true,
            updateHash:      true,
            hashSuffix:      '-group',
            tabs:            'ul.tabs > li:not(.auxin-logo)',
            subTabs:         '> li:not(.not-tab)'
        })
        .find('.tabs li > a').on('click', function(){ // call resize event to update some UI on tab clicked
            if( window.dispatchEvent ){
                setTimeout(function(){
                    window.dispatchEvent( new Event('resize') );
                }, 100);
            }
        });


        $('.axi-metabox-hub').avertaLiveTabs({
            enableHash:      true,
            updateHash:      true,
            hashSuffix:      '-tab',
            tabs:            'ul.tabs > li'
        }).css('display', 'block');

        // remove loading
        $('.axi-metabox-loading').hide();

        // Init sortable element
        $('.sortbox').sortable({
            connectWith:'.draggable-area ul',
            helper:'clone',
            placeholder:'sort-item-heighlight',
            opacity:1,
            revert: true
        });

        // Auxin Base Control Class
        // =====================================================================

        if( wp.customize ){

            /**
             * Auxin base control.
             *
             */
            wp.customize.AuxinControl = wp.customize.Control.extend({
                ready: function() {
                    this.picker;
                    var control = this;

                    wp.customize.bind( 'ready', function() {
                        control.dependencyBind();
                        control.dependencyCheck();
                    });
                },

                update: function( newValue ){
                    if( this.picker ){
                        // if it is new value
                        if( newValue !== this.setting() ){
                            this.setting.set( newValue );
                            this.picker.val( newValue );
                            this.picker.trigger('change');
                        }
                    }
                },

                dependencyBind : function(){
                    var control  = this,
                        depend,
                        dependControl;

                    // Make sure dependency data was defined for this control
                    if( undefined !== control.params.dependencies && control.params.dependencies.length ){

                        for ( var i = 0, l = control.params.dependencies.length; i < l; i++ ) {

                            // get each dependency item
                            depend = control.params.dependencies[ i ];
                            // skip if it is not a dependency item
                            if( depend.relation ){
                                continue;
                            }

                            // get the observer control
                            dependControl = wp.customize.control( depend.id + '_control');
                            if( undefined === dependControl ){
                                console.warn('The dependency ID "' + depend.id + '" was not found for ' + control.id + ' control.' );
                                continue;
                            }
                            if ( $(dependControl.container[0]).hasClass('axi-devices-option-wrapper') ) {
                                var dependControlTablet = wp.customize.control( 'tablet_' + depend.id + '_control');
                                var dependControlMobile = wp.customize.control( 'mobile_' + depend.id + '_control');
                                // watch the changes on dependency controls
                                dependControlTablet.setting.bind( function ( value ) {
                                    control.dependencyCheck();
                                });
                                dependControlMobile.setting.bind( function ( value ) {
                                    control.dependencyCheck();
                                });
                            }
                            // watch the changes on dependency controls
                            dependControl.setting.bind( function ( value ) {
                                control.dependencyCheck();
                            });
                        }
                    }
                },

                dependencyCheck : function(){

                    var control        = this,
                    relation           = 'and',
                    finalResult        = true,
                    depend             = '',
                    isDepValueSelected = true,
                    // collect the result of each dependency item in a list
                    dependencyResults  = [];

                    // Make sure dependency data was defined for this control
                    if( undefined !== control.params.dependencies && control.params.dependencies.length ){


                        for ( var i = 0, l = control.params.dependencies.length; i < l; i++ ) {

                            // get each dependency item
                            depend = control.params.dependencies[ i ];
                            if( depend.relation ){
                                relation = depend.relation;
                                continue;
                            }

                            // get the observer control
                            var dependControl = wp.customize.control( depend.id + '_control');
                            if( undefined === dependControl ){
                                console.warn('The dependency ID "' + depend.id + '" was not found for ' + control.id + ' control.' );
                                continue;
                            }

                            if ( $(dependControl.container[0]).hasClass('axi-devices-option-wrapper') ) {
                                var dependControlTablet = wp.customize.control( 'tablet_' + depend.id + '_control');
                                var dependControlMobile = wp.customize.control( 'mobile_' + depend.id + '_control');
                                isDepValueSelected = control._inArray( dependControl.setting(), depend.value, depend.operator || "==" );
                                var isDepValueSelectedTablet = control._inArray( dependControlTablet.setting(), depend.value, depend.operator || "==" );
                                var isDepValueSelectedMobile = control._inArray( dependControlMobile.setting(), depend.value, depend.operator || "==" );
                                dependencyResults.push( isDepValueSelected || isDepValueSelectedTablet || isDepValueSelectedMobile );
                            } else {
                                // Whether the target control has the goal value or not
                                isDepValueSelected = control._inArray( dependControl.setting(), depend.value, depend.operator || "==" );

                                // Add each dependency check result to result list
                                dependencyResults.push( isDepValueSelected );
                            }

                        }

                        for ( var i = 0, l = dependencyResults.length; i < l; i++ ) {

                            if( relation == 'and' ){
                                if( ! dependencyResults[ i ] ){
                                    finalResult = false;
                                }
                            } else if( dependencyResults[ i ] ){
                                finalResult = true;
                            }
                        }

                        control._toggle( finalResult );
                    }
                },

                _toggle: function( active ){

                    if ( active ) {
                        this.container.slideDown( 'fast', $.noop );
                    } else {
                        this.container.slideUp( 'fast', $.noop );
                    }
                    var initvalue = this.setting();
                    this.setting.set( initvalue );
                },

               /**
                * Check whether value exist in list or not
                *
                * @param  {string|init} needle     Value which we are looking for in list
                * @param  {array} haystack         List of items which we are searching in
                * @return {boolean}                True if the value exist in list
                */
                _inArray : function( needle, haystack, operator ) {
                    if( undefined === operator ){
                        operator = '==';
                    }
                    var result;
                    // make sure the haystack is array
                    if( haystack.constructor !== Array ){
                        haystack = typeof haystack == 'string' ? haystack.split(',') : [haystack];
                    }

                    for( var i = 0, length = haystack.length; i < length; i++ ) {
                        switch( operator ) {
                            case '==':
                                result = needle == haystack[i];
                                break;
                            case '===':
                                result = needle === haystack[i];
                                break;
                            case '!=':
                                result = needle != haystack[i];
                                break;
                            case '!==':
                                result = needle !== haystack[i];
                                break;
                            case '>=':
                                result = needle >= haystack[i];
                                break;
                            case '<=':
                                result = needle <= haystack[i];
                                break;
                            case '>':
                                result = needle > haystack[i];
                                break;
                            case '<':
                                result = needle < haystack[i];
                                break;
                        }

                        if ( result ) {
                            return true;
                        }

                        // we had no luck on using eval on comparison check with strings
                        // return eval( needle + operator + haystack[i] );
                    }

                    return false;
                }
            });

        }

        // Textarea
        // =====================================================================

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_textarea'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( 'textarea' );

                    control.picker.on( 'change', function() {
                        control.setting.set( control.picker.val() );
                    });

                    this.setting.bind( function ( value ) {
                        control.picker.val( value );
                    });

                }

            });
        }

        // Code editor
        // =====================================================================

        var editor_picker = 'textarea[data-code-editor]';

        $( editor_picker ).each( function () {
                var textarea = $(this);

                var mode = textarea.data('code-editor') || 'javascript';

                var editDiv = $('<div>', {
                    width: '100%',
                    'class': textarea.attr('class')
                }).insertBefore(textarea);

                textarea.css('display', 'none');

                var editor = ace.edit(editDiv[0]);
                editor.renderer.setShowGutter( auxin.admin.ace.showGutter );
                editor.getSession().setValue( textarea.val() );
                editor.getSession().setMode( "ace/mode/" + mode );
                editor.$blockScrolling = Infinity;
                editor.setTheme("ace/theme/" + auxin.admin.ace.theme );
                editor.getSession().setTabSize( auxin.admin.ace.tabSize );
                editor.getSession().setUseSoftTabs( auxin.admin.ace.useSoftTabs );
                editor.setOption( "maxLines", auxin.admin.ace.maxLines );
                editor.setOption( "minLines", auxin.admin.ace.minLines );

                editor.setOptions({
                    //enableBasicAutocompletion: auxin.admin.ace.enableBasicAutocompletion
                });

                editor.getSession().on('change', function () {
                    textarea.val(editor.getSession().getValue());
                });

            });


        if( wp.customize ){

            wp.customize.controlConstructor['auxin_code'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( editor_picker);

                        control.picker.each( function () {
                            var textarea    = $(this),
                                execute_btn = textarea.siblings('button'),
                                typingTimer,
                                typingDelay;

                            // The editor mode
                            var mode = textarea.data('code-editor') || 'javascript';

                            // Apply editor changes after this delay
                            typingDelay = ( 'css' === mode ) ? 500 : 1500;

                            var editDiv = $('<div>', {
                                width: '100%',
                                'class': textarea.attr('class')
                            }).insertBefore(textarea);

                            textarea.css('display', 'none');

                            var editor = ace.edit(editDiv[0]);
                            window.lasteditor = editor;
                            editor.$blockScrolling = Infinity;
                            editor.renderer.setShowGutter( auxin.admin.ace.showGutter );
                            editor.getSession().setValue( textarea.val() );
                            editor.getSession().setMode( "ace/mode/" + mode );
                            editor.setTheme("ace/theme/" + auxin.admin.ace.theme );
                            editor.getSession().setTabSize( auxin.admin.ace.tabSize );
                            editor.getSession().setUseSoftTabs( auxin.admin.ace.useSoftTabs );


                            editor.setOption( "maxLines", auxin.admin.ace.maxLines );
                            editor.setOption( "minLines", auxin.admin.ace.minLines );

                            editor.setOptions({
                                //enableBasicAutocompletion: auxin.admin.ace.enableBasicAutocompletion
                            });

                            // apply changes and update setting when user clicked on execute button
                            if( 'javascript' === mode && execute_btn.length ){
                                execute_btn.on( 'click', function(e){
                                    e.preventDefault();

                                    textarea.val(editor.getSession().getValue());

                                    if( control.setting.get() == editor.getSession().getValue() ){
                                        control.setting.set( control.setting.get() + ' ' );
                                    } else {
                                        control.setting.set( editor.getSession().getValue() );
                                    }
                                });

                            // apply changes and update setting when user stoped typing
                            } else {

                                editor.getSession().on('change', function () {
                                    textarea.val(editor.getSession().getValue());

                                    clearTimeout( typingTimer );
                                    typingTimer = setTimeout( function(){
                                        control.setting.set( editor.getSession().getValue() );
                                    }, typingDelay);

                                });

                            }

                            // sync the setting value with editor content
                            control.setting.bind( function ( value ) {
                                textarea.val(value);
                            });

                        });

                },

                update: function( value ){}

            });
        }


        // Color Picker
        // =====================================================================

        // initialize spectrum color picker on text input field
        var spectrum_picker = '.mini-color-wrapper input[type="text"], .aux-colorpicker-field',
            spectrum_args = {
                allowEmpty: true,
                showInput: true,
                showAlpha: true,
                disabled: false,

                showSelectionPalette: true,
                showPalette:true,
                hideAfterPaletteSelect:true,
                palette: [
                    ['black', 'white', ' ']
                ],
                clickoutFiresChange: true,
                showInitial: true,
                chooseText:  auxin.admin.colorpicker.chooseText,
                cancelText:  auxin.admin.colorpicker.cancelText,
                containerClassName: 'axi-sp-wrapper',
                localStorageKey: "auxin.spectrum",
                preferredFormat: "hex6",
                change: function(color) {
                    if( color === null) {
                        $(this).val('');
                    } else {
                        $(this).val( color.toString() );
                    }
                }
            };


         // only in widgets page
        if ( isWidgetsPage ) {
            $('.inactive-sidebar, .widget-liquid-right').find( spectrum_picker ).spectrum( spectrum_args );

            $( document ).on( 'widget-added widget-updated', function() {
                $('.inactive-sidebar, .widget-liquid-right').find( spectrum_picker ).spectrum( spectrum_args );
            });

        // other pages
        } else {
            $( spectrum_picker ).spectrum( spectrum_args );

            $(document).on('panelsopen', function(){
                $( spectrum_picker ).spectrum( spectrum_args );
            });
        }

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_color'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( spectrum_picker );

                    control.picker.val( control.setting() ).spectrum( spectrum_args );

                    control.picker.on("dragstop.spectrum", function(e, color){
                        if( color === null) {
                            control.picker.val('');
                        } else {
                            control.picker.val( color.toString() );
                        }
                        control.setting.set( control.picker.val() );
                        // @if DEV
                        // wp.customize.previewer.refresh();
                        // @endif
                    });

                    this.setting.bind( function ( value ) {
                        control.picker.val( value );
                    });

                }

            });
        }

        // Gradient Select
        // =====================================================================

        // initialize spectrum color picker on text input field
        var gradient_picker  = '.mini-gradient-wrapper input[type="text"]';

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_gradient'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control      = this;
                    control.picker   = this.container.find( gradient_picker );

                    var $typeControl      = this.container.find('.aux-gradient-type'),
                        $directionControl = this.container.find('.aux-gradient-direction');

                    control.picker.val( control.setting() );

                    var grapickPicker = new Grapick({
                        el       : this.container.find( '.aux-grapick-colors' )[0],
                        direction: 'to right',
                        min      : 1,
                        max      : 99
                    });

                    if( control.setting() ){
                        grapickPicker.setValue( control.setting() );
                        $typeControl.val( grapickPicker.getType() );
                        $directionControl.val( grapickPicker.getDirection() );
                    }

                    $typeControl.on('change', function(e) {
                        grapickPicker.setType(this.value);
                    });

                    $directionControl.on('change', function(e) {
                        grapickPicker.setDirection(this.value);
                    });

                    grapickPicker.on('change', function(complete) {
                        control.setting.set( grapickPicker.getSafeValue() );
                    });

                    this.setting.bind( function ( value ) {
                        control.picker.val( value );
                    });

                }

            });
        }

        // Auxin Typography Controller
        // =====================================================================

        function auxin_embed_controller_styles ( prefix, controlID, cssValue ) {
            var optionName = prefix + controlID.split('_control')[0];

            if ( ! Object.hasOwnProperty.call( wp.customize.previewer, 'preview' ) ) {
                return;
            }

            var styleTag = wp.customize.previewer.preview.iframe[0].contentDocument.getElementById(optionName);



            if ( cssValue ) {
                styleTag.innerHTML = cssValue;
            } else {
                styleTag.innerHTML = '';
            }

        }

        function auxin_embed_fonts_url ( fontsList ) {
            if ( fontsList.length ) {

                if ( ! Object.hasOwnProperty.call( wp.customize.previewer, 'preview' ) ) {
                    return;
                }

                var iframeHead = wp.customize.previewer.preview.iframe[0].contentDocument.querySelector('head');


                fontsList.forEach( function(font) {
                    var fontLink = iframeHead.querySelector('link[href="' + font + '"]');
                    if ( ! fontLink ) {
                        var LinkTag = document.createElement( 'link' );
                        LinkTag.rel = 'stylesheet';
                        LinkTag.href = font;
                        iframeHead.appendChild( LinkTag );
                    }
                });
            } else {
                return;
            }
        }

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_group_typography'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this,
                        input = this.container.eq(0).find('.aux-typo-controller-input')[0],
                        container = this.container.eq(0).find('.aux-typo-controller-container')[0]

                    OptionControls.inputAdapter( input, container,
                        function( optionControl ){ // for onchange
                            auxin_embed_controller_styles('auxin-customizer-css-', control.id, optionControl.toCSS() );
                            auxin_embed_fonts_url( optionControl.getFonts() ) ;
                        },
                        function( optionControl ) { // for init
                            wp.customize.previewer.bind('ready', function(){
                                auxin_embed_controller_styles('auxin-customizer-css-', control.id, optionControl.toCSS() );
                                auxin_embed_fonts_url( optionControl.getFonts() ) ;
                            });
                        }
                    );

                }

            });
        }

        // Auxin Responsive Slider Controller
        // =====================================================================

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_responsive_slider'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this,
                        input = this.container.eq(0).find('.aux-slider-controller-input')[0],
                        container = this.container.eq(0).find('.aux-slider-controller-container')[0];

                    OptionControls.inputAdapter( input, container,
                        function( optionControl ){ // for onchange
                            auxin_embed_controller_styles('auxin-customizer-css-', control.id, optionControl.generateCSS() );
                        },
                        function( optionControl ) { // for init
                            wp.customize.previewer.bind('ready', function(){
                                auxin_embed_controller_styles('auxin-customizer-css-', control.id, optionControl.generateCSS() );
                            });
                        }
                    );

                }

            });
        }

        // Auxin Dimension Controller
        // =====================================================================

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_responsive_dimensions'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this,
                        input = this.container.eq(0).find('.aux-dimension-controller-input')[0],
                        container = this.container.eq(0).find('.aux-dimension-controller-container')[0];

                    OptionControls.inputAdapter( input, container,
                        function( optionControl ){ // for onchange
                            auxin_embed_controller_styles('auxin-customizer-css-', control.id, optionControl.generateCSS() );
                        },
                        function( optionControl ) { // for init
                            wp.customize.previewer.bind('ready', function(){
                                auxin_embed_controller_styles('auxin-customizer-css-', control.id, optionControl.generateCSS() );
                            });
                        }
                    );

                }

            });
        }

        // Auxin Pair Repeater 
        // =====================================================================
        var pairRepeaterContainer = document.querySelector('.aux-pair-repeater-container'),
            pairRepeaterInput = document.querySelector('.aux-product-custom-fields');

        if( ! wp.customize && pairRepeaterContainer ){
            OptionControls.inputAdapter( pairRepeaterInput, pairRepeaterContainer );
        }

        // Visual Select
        // =====================================================================
        var visual_select_picker = '.visual-select-wrapper',
            visual_select_args   = {
                insertCaption: false,
                item         : 'axi-select-item'
            };

        // only in widgets page
        if ( isWidgetsPage ) {
            $('.inactive-sidebar, .widget-liquid-right').find( visual_select_picker ).avertaVisualSelect( visual_select_args );

            $( document ).on( 'widget-added widget-updated', function() {
                $('.inactive-sidebar, .widget-liquid-right').find( visual_select_picker ).avertaVisualSelect( visual_select_args );
            });

        // other pages
        } else {
            $( visual_select_picker ).avertaVisualSelect( visual_select_args );

            $(document).on('panelsopen', function(){
               $( visual_select_picker ).avertaVisualSelect( visual_select_args );
            });
        }

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_radio_image'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( visual_select_picker );


                    control.picker.val( control.setting() ).avertaVisualSelect( visual_select_args );

                    control.picker.on( 'change', function() {
                        if ( control.params.presets.constructor === Object && Object.keys(control.params.presets).length ) {

                            var presetID, presetValue, presetControl;

                            for ( presetID in control.params.presets[ control.setting() ] ) {
                                presetValue = control.params.presets[ control.setting() ][ presetID ];
                                wp.customize.control( presetID + "_control" ).update( presetValue );
                            }
                        }

                        control.setting.set( control.picker.val() );
                        //control.setting.preview();
                    });

                    this.setting.bind( function ( value ) {
                        control.picker.val( value );
                    });

                }

            });
        }


        // Visual Select
        // =====================================================================

        var sortable_input_picker = '.aux-sortable-input',
            sortable_input_args   = {
                addButtonText     : "Add to List",
                addbuttonClass    : "sortin-add-btn button button-primary button-large",
                sortable          : true ,
                fields            : [],
                wrapperClass      : "sortin-wrapper auxin-sortin",
                selectboxClass    : "sortin-selectbox aux-select2-single"
            };

        // only in widgets page
        if ( isWidgetsPage ) {
            $('.inactive-sidebar, .widget-liquid-right').find( sortable_input_picker ).sortableInput( sortable_input_args );

            $( document ).on( 'widget-added widget-updated', function() {
                $('.inactive-sidebar, .widget-liquid-right').find( sortable_input_picker ).sortableInput( sortable_input_args );
            });

        // other pages
        } else {
            $( sortable_input_picker ).sortableInput( sortable_input_args );

            $(document).on('panelsopen', function(){
               $( sortable_input_picker ).sortableInput( sortable_input_args );
            });
        }

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_sortable_input'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( sortable_input_picker );


                    control.picker.val( control.setting() ).sortableInput( sortable_input_args );

                    this.setting.bind( function ( value ) {

                    });

                }

            });
        }



        // Switchery
        // =====================================================================

        var switchery_picker = '.av3_container input[type="checkbox"], .aux_switch[type="checkbox"]',
            switchery_args   = {
                color          : '#0074A2',
                secondaryColor : '#C2C2C2',
                className      : 'axi-switch',
                speed          : '0.3s'
            };



        function initSwitchary( $target ){
            $target.each( function ( index, el ) {
                if( ! el.getAttribute("data-switchery") ) {
                    new Switchery( el, switchery_args );
                }
            });
        }

        function disableHiddenSwitch(){
            $(".aux_switch:checkbox:checked").each(function(index, el){
                $(this).prev().prop("disabled", false);
            });
        }

        // only in widgets page
        if ( isWidgetsPage ) {

            initSwitchary( $('.inactive-sidebar, .widget-liquid-right').find( switchery_picker ) );

            $( document ).on( 'widget-added widget-updated', function() {
                initSwitchary( $('.inactive-sidebar, .widget-liquid-right').find( switchery_picker ) );
                disableHiddenSwitch();
            });

        // other pages
        } else {
            var switchery_inputs = $( switchery_picker );
            initSwitchary( switchery_inputs );
            switchery_inputs.on( 'change', function( e ) {
                e.target.setAttribute( 'value', e.target.checked ? '1' : '0' );
            });

            $(document).on('panelsopen', function(){
                initSwitchary( $( switchery_picker ) );
                disableHiddenSwitch();
            });
        }

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_switch'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( switchery_picker );

                    control.picker.val( control.setting() );

                    switchery_args.size = 'small';

                    var switchery = new Switchery( control.picker[0], switchery_args );

                    control.picker.on( 'change', 'input:checkbox', function() {
                        control.setting.set( control.picker.val() );
                    });

                    this.setting.bind( function ( value ) {
                        control.picker.val( value );
                    });

                }

            });
        }




        // Font Selector
        // =====================================================================

        var font_select_picker = '.axi-font-field',
            font_select_args   = {
                insertPreviewText : true,
                googleFontsPrefix : '_gof_',          // Google fonts prefix
                systemFontsPrefix : '_sys_',          // System fonts prefix
                geaFontsPrefix    : '_gea_',          // Google Early Access fonts prefix
                customFontsPrefix : '_cus_',          // Custom fonts prefix

                useGoogleFonts  : true,           // whether load google fonts
                systemFonts     : auxin.admin.fonts.system.faces,           // system font list DS -> [..,{name:'', thickness:'300,bold,600'},..]
                geaFonts        : auxin.admin.fonts.google_early.faces,         // Google Early Access fonts DS -> [..,{name:'', thickness:'300,bold,600', url:''},..]
                customFonts     : auxin.admin.fonts.custom.faces,             // Custom fonts DS -> [..,{name:'', thickness:'300,bold,600', url:''},..]

                l10n : {                    // localization object
                    previewTextLabel    : auxin.admin.fontSelector.previewTextLabel || 'Preview text:',
                    fontLabel           : auxin.admin.fontSelector.fontLabel        || 'Font:',
                    fontSizeLabel       : auxin.admin.fontSelector.fontSizeLabel    || 'Size:',
                    fontStyleLabel      : auxin.admin.fontSelector.fontStyleLabel   || 'Style:',
                    googleFonts         : auxin.admin.fontSelector.googleFonts      || 'Google Fonts',
                    systemFonts         : auxin.admin.fontSelector.systemFonts      || 'System Fonts',
                    geaFonts            : auxin.admin.fontSelector.geaFonts         || 'Google Early Access',
                    customFonts         : auxin.admin.fontSelector.customFonts      || 'Custom Fonts'
                }

            };

        $( font_select_picker ).avertaFontSelector( font_select_args );

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_typography'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( font_select_picker );

                    control.picker.val( control.setting() ).avertaFontSelector( font_select_args );

                    control.picker.on( 'change', function() {
                        control.setting.set( control.picker.val() );
                        // @if DEV
                        // wp.customize.previewer.refresh();
                        // @endif
                    });

                    this.setting.bind( function ( value ) {
                        control.picker.val( value );
                    });

                }

            });
        }


        // Attachmedia
        // =====================================================================

        var attach_media_picker = '.axi-attachmedia-wrapper input[type="text"]',
            $attach_media_elem  = $('.axi-attachmedia-wrapper').find('input[type="text"]'),
            attach_media_args   = {
                item            : 'am-item am-frame',       // attached media item in dragable list [css class name]
                thumbnail       : 'am-img-holder',          // thumbnail image [css class name]
                removeItem      : 'am-remove',              // remove item button [class name]
                sortable        : 'axi-attach-items',       // soratable container
                addItem         : 'am-add-new am-frame',    // add attachment button
                srcMap          : auxin.attachmedia || null,// id:src map object
                sortableOptions : {
                    placeholder   : "am-placeholder",
                    forcePlaceholderSize: true
                },
                autoHideElement : true,                     // hide input element after init
                confirmOnRemove : true,                     // ask before removing attachment
                multiple        : true,                     // enables multiple section in wp's media uploader
                limit           : 9999,                     // specifies maximum number of items
                type            : null,                     // select media uploader attachment type
                insertCaption   : false,                    // whether insert caption or not

                l10n            : {                         // localization object
                    addToList       : 'Add image(s)',
                    uploaderTitle   : 'Select Image',
                    uploderSubmit   : 'Add image',
                    removeConfirm   : 'Are you sure that you want to remove this attachment?'
                }
            };

         // only in widgets page
        if ( isWidgetsPage ) {
            $('.inactive-sidebar, .widget-liquid-right').find( attach_media_picker ).avertaAttachMedia( attach_media_args );

            $( document ).on( 'widget-added widget-updated', function() {
                $('.inactive-sidebar, .widget-liquid-right').find( attach_media_picker ).avertaAttachMedia( attach_media_args );
            });

        // other pages
        } else {
            $( attach_media_picker ).avertaAttachMedia( attach_media_args );

            $(document).on('panelsopen', function(){
                $( attach_media_picker ).avertaAttachMedia( attach_media_args );
            });
        }

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_media'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( attach_media_picker );

                    if( control.params.attachments ) {
                        attach_media_args.srcMap = control.params.attachments
                    }

                    control.picker.val( control.setting() ).avertaAttachMedia( attach_media_args );

                    control.picker.on( 'change', function() {
                        control.setting.set( control.picker.val() );
                    });

                    this.setting.bind( function ( value ) {
                        control.picker.val( value );
                    });

                }

            });

        }

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_text'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( 'input[type]' );

                    control.picker.on( 'change', function() {
                        control.setting.set( control.picker.val() );
                    });

                    this.setting.bind( function ( value ) {
                        control.picker.val( value );
                    });

                }

            });

        }

        if( wp.customize ){
            wp.customize.controlConstructor['auxin_base'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( 'input[type]' );

                    control.picker.on( 'change', function() {
                        control.setting.set( control.picker.val() );
                    });

                    this.setting.bind( function ( value ) {
                        control.picker.val( value );
                    });

                }

            });

        }




        //
        // =====================================================================

        // initialize spectrum color palette on text input field
        var $palette_pickers = $('.auxin-color-palette input[type="text"]');
        var $palette_picker, colors, palette_picker_name;

        for ( var i = 0, l = $palette_pickers.length; i < l; i++ ) {
            $palette_picker     = $palette_pickers.eq(i);
            palette_picker_name = $palette_picker.prop('name');

            if (typeof window.auxin.admin.palette[ palette_picker_name ] != 'undefined') {

                $palette_picker.spectrum({
                    allowEmpty: true,
                    showInput: false,
                    showAlpha: true,
                    disabled: false,

                    showSelectionPalette: true,
                    showPaletteOnly:false,
                    showPalette:true,
                    hideAfterPaletteSelect:true,
                    palette: auxin.admin.palette[palette_picker_name],
                    clickoutFiresChange: true,
                    showInitial: true,
                    chooseText:  auxin.admin.colorpicker.chooseText,
                    cancelText:  auxin.admin.colorpicker.cancelText,
                    containerClassName: 'axi-sp-wrapper',
                    localStorageKey: "auxin.spectrum",
                    preferredFormat: "hex6"
                });

            }
        }



        // Init date fields if exist
        var $dateFields = $('input#custom_news_date');
        if( $dateFields.length ) {
            $dateFields.datepicker({
                dateFormat:'yy-mm-dd'
            });
        }

        // export
        // =====================================================================

        if( wp.customize ){

            wp.customize.controlConstructor['auxin_export'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( 'form' );

                    control.picker.on( 'submit', function(e) {
                        e.preventDefault();
                        var $this = $(this),
                        $button = $this.find('button').addClass('aux-button-loading');

                        $.ajax({
                            url : auxin.ajaxurl,
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                nonce: $this.find('#auxin-export-nonce').val(),
                                action: 'auxin_customizer_export' // the ajax handler
                            },
                            success: function( response ) {
                                $button.removeClass('aux-button-loading');
                                if ( response.success ) {
                                    var element = document.createElement('a');
                                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(response.data.content));
                                    element.setAttribute('download', response.data.fileName);
                                    element.style.display = 'none';
                                    document.body.appendChild(element);
                                    element.click();
                                    document.body.removeChild(element);
                                }
                            }
                        });
                    });
                }

            });
        }


        // import
        // =====================================================================

        if( wp.customize ){

            wp.customize.controlConstructor['auxin_import'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( 'form' );

                    control.picker.on( 'submit', function(e) {
                        e.preventDefault();
                        var $this = $(this),
                        $button = $this.find('button').addClass('aux-button-loading');

                        var data = new FormData();
                        data.append('file', $this.find('#auxin-select-import').prop('files')[0]);
                        data.append('action', 'auxin_customizer_import');
                        data.append('nonce', $this.find('#auxin-import-nonce').val());

                        $.ajax({
                            url : auxin.ajaxurl,
                            type: 'POST',
                            dataType: 'json',
                            processData: false,
                            contentType: false,
                            data: data,
                            success: function( response ) {
                                $button.removeClass('aux-button-loading');
                                if ( response.success ) {
                                    setTimeout(function(){
                                        location.reload();
                                    }, 1000);
                                }
                            }
                        });
                    });

                }

            });
        }


        // select
        // =====================================================================

        if( wp.customize ){

            wp.customize.controlConstructor['auxin_select'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( 'select' );

                    control.picker.val( control.setting() );

                    control.picker.on( 'change', function() {
                        control.setting.set( control.picker.val() );
                        //control.setting.preview();
                    });

                    this.setting.bind( function ( value ) {
                        control.picker.val( value );
                    });

                }

            });
        }


        // select2
        // =====================================================================
        if( $.fn.select2 ){
            var select2_picker       = '.aux-select2-single',
                select2_args         = {
                    theme: "auxin"
                };

            // only in widgets page
            if ( isWidgetsPage ) {
                $('.inactive-sidebar, .widget-liquid-right').find( select2_picker ).select2( select2_args );

                $( document ).on( 'widget-added widget-updated', function() {
                    $('.inactive-sidebar, .widget-liquid-right').find( select2_picker ).select2( select2_args );
                });

            // other pages
            } else {
                $( select2_picker ).select2( select2_args );

                $(document).on('panelsopen', function(){
                    select2_args.dropdownParent = $('.auxin-admin-widget-wrapper');
                    $( select2_picker ).select2( select2_args );
                });
            }

            if( wp.customize ){
                wp.customize.controlConstructor['auxin_select2'] = wp.customize.AuxinControl.extend({

                    ready: function() {
                        // call superclass
                        wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                        var control = this;
                        control.picker = this.container.find( select2_picker );

                        control.picker.val( control.setting() ).select2( select2_args );

                        control.picker.on( 'change', function() {
                            control.setting.set( control.picker.val() );
                            //control.setting.preview();
                        });

                        this.setting.bind( function ( value ) {
                            control.picker.val( value );
                        });

                    }

                });
            }

            // Select 2 multiple ---------------------

            var select2_picker_multi  = '.aux-select2-multiple',
                select2_args_multi         = {
                    theme:       "auxin",
                    placeholder: "Select Options",
                    allowClear: true,
                    dropdownParent: $('#vc_ui-panel-edit-element') // @TODO: we should find an element with id on siteorigin editor as well
                },
                old_name;

            // only in widgets page on widgets the name of multiple select should have [] at the end.
            if ( isWidgetsPage ) {
                $('.inactive-sidebar, .widget-liquid-right').find( select2_picker_multi ).each( function() {
                  old_name = $( this ).attr( "name");
                  if(! old_name.endsWith( '[]' ) ) {
                        $( this ).attr( "name", old_name + '[]');
                      }

                });

                $('.inactive-sidebar, .widget-liquid-right').find( select2_picker_multi ).select2( select2_args_multi );

                $( document ).on( 'widget-added widget-updated', function() {
                    $('.inactive-sidebar, .widget-liquid-right').find( select2_picker_multi ).each( function() {
                      old_name = $( this ).attr( "name");
                      if(! old_name.endsWith( '[]' ) ) {
                        $( this ).attr( "name", old_name + '[]');
                      }

                    });

                    $('.inactive-sidebar, .widget-liquid-right').find( select2_picker_multi ).select2( select2_args_multi );
                });

            // other pages
            } else {
                $( select2_picker_multi ).select2( select2_args_multi );

                $(document).on('panelsopen', function(){
                    select2_args_multi.dropdownParent = $(select2_picker_multi).closest('.aux-element-field.aux-multiple-selector');
                   $( select2_picker_multi ).select2( select2_args_multi );
                });
            }

            if( wp.customize ){
                wp.customize.controlConstructor['auxin_select2_multiple'] = wp.customize.AuxinControl.extend({

                    ready: function() {
                        // call superclass
                        wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                        var control = this;
                        select2_args_multi.dropdownParent = $(select2_picker_multi).closest('.customize-control-auxin_select2_multiple');
                        control.picker = this.container.find( select2_picker_multi );

                        control.picker.val( control.setting() ).select2( select2_args_multi );

                        control.picker.on( 'change', function() {
                            control.setting.set( control.picker.val() );
                            // control.setting.preview();
                        });

                        this.setting.bind( function ( value ) {
                            control.picker.val( value );
                        });

                    }

                });
            }


        }

        if( $.fn.spinner ){

            var $numerics = $('.auxin-admin-numeric');

            for ( var i = 0, l = $numerics.length; i < l; i++ ) {
                var $this = $numerics.eq(i),
                    params = {};

                if( undefined !== ( minVal = $this.data('min') ) ){
                    params.min = parseInt( minVal );
                }
                if( undefined !== ( maxVal = $this.data('max') ) ){
                    params.max = parseInt( maxVal );
                }
                if( undefined !== ( stepVal = $this.data('step') ) ){
                    params.step = parseInt( stepVal );
                }

                $this.spinner( params );
            }
        }

        // iconpicker
        // =====================================================================
        var auxIconPickerOptions = {
            theme             : 'fip-grey',              // The CSS theme to use with this fontIconPicker. You can set different themes on multiple elements on the same page
            source            : false,                   // Icons source (array|false|object)
            emptyIcon         : true,                    // Empty icon should be shown?
            emptyIconValue    : '',                      // The value of the empty icon, change if you select has something else, say "none"
            iconsPerPage      : 36,                      // Number of icons per page
            hasSearch         : true,                    // Is search enabled?
            searchSource      : false,                   // Give a manual search values. If using attributes then for proper search feature we also need to pass icon names under the same order of source
            useAttribute      : false,                   // Whether to use attribute selector for printing icons
            attributeName     : 'data-icon',             // HTML Attribute name
            convertToHex      : true,                    // Whether or not to convert to hexadecimal for attribute value. If true then please pass decimal integer value to the source (or as value="" attribute of the select field)
            allCategoryText   : 'From all categories',   // The text for the select all category option
            unCategorizedText : 'Uncategorized'          // The text for the select uncategorized option
        }, auxIconPickerSelector = '.aux-fonticonpicker';

        // only in widgets page
        if ( isWidgetsPage ) {
            $('.inactive-sidebar, .widget-liquid-right').find( auxIconPickerSelector ).fontIconPicker( auxIconPickerOptions );

            $( document ).on( 'widget-added widget-updated', function() {
                $('.inactive-sidebar, .widget-liquid-right').find( auxIconPickerSelector ).fontIconPicker( auxIconPickerOptions );
            });

        // other pages
        } else {
            $( auxIconPickerSelector ).fontIconPicker( auxIconPickerOptions );

            if( wp.customize ){
                wp.customize.bind( 'ready', function() {
                    $( auxIconPickerSelector ).fontIconPicker( auxIconPickerOptions );
                });
            }
            $(document).on('panelsopen', function(){
                $( auxIconPickerSelector ).fontIconPicker( auxIconPickerOptions );
            });
        }

        if( wp.customize ){

            wp.customize.controlConstructor['auxin_icon'] = wp.customize.AuxinControl.extend({

                ready: function() {
                    // call superclass
                    wp.customize.AuxinControl.prototype.ready.apply( this, arguments );

                    var control = this;
                    control.picker = this.container.find( auxIconPickerSelector );

                    control.picker.val( control.setting() );

                    control.picker.on( 'change', function() {
                        control.setting.set( control.picker.val() );
                    });

                    this.setting.bind( function ( value ) {
                        control.picker.val( value );
                    });

                }

            });
        }

        // Activate the corresponding post format tab on post edit page
        // =====================================================================

        function onWPDataChange() {
            var format = wp.data.select( 'core/editor' ).getPostEdits().format || wp.data.select('core/editor').getCurrentPostAttribute('format');
            if ( format !== lastFormat )  {
                lastFormat = format;
                if( typeof format === 'undefined' ){
                    return;
                }
                $('.aux-format-tab').hide();
                get_format_section( format ).show();
            }
        }
        // Fix gutenberg issue
        if( typeof wp.blocks !== "undefined" ){
            var lastFormat = '';
            wp.data.subscribe( onWPDataChange );
            onWPDataChange();
        }

        var $format_select_buttons = $('#post-formats-select input[type="radio"]');

        function get_format_section( format ){
            format = format.replace('post-format-', '');
            return $('.axi-metabox-container .tabs .aux-tab-post-' + format );
        }

        if( $format_select_buttons.length ){

            var $format_tabs = $('.aux-format-tab'),
                $lastDisplayed  = get_format_section( $format_select_buttons.filter(':checked').prop('id') ).show();

            if ( !window.location.hash ) {
                // find the corresponding tab
                $('.axi-metabox-container .tabs a[href="' + window.location.hash + '"]').parent('li').trigger('click');
            }

            $format_select_buttons.on('change', function(){
                $format_tabs.hide();

                $lastDisplayed = get_format_section( $(this).prop('id') );
                // if no corresponding tab found, activate the layout tab
                if( ! $lastDisplayed.length )
                    $lastDisplayed = get_format_section( 'post-format-sidebar-layout' );

                $lastDisplayed.show().trigger('click');
            });

        }

        /* ------------------------------------------------------------------------------ */
        // setup dependency in widgets
        if ( isWidgetsPage ) {

            // init for active widgets
            $( '.widget-liquid-right .widget' ).each( function( index, element ) {
                auxInitWidgetDependencies( $(this) );
            } );

            $( document ).on( 'widget-added widget-updated', function( e, target ) {
                auxInitWidgetDependencies( target );
            });

        } else {
            jQuery(document).on('panelsopen', function( e ){
                auxInitWidgetDependencies( $(e.target) );
            });
        }

        function auxInitWidgetDependencies( $widget ) {

            var $wrapper = $widget.find( '.auxin-admin-widget-wrapper' ),
                id, deps;

            if ( $wrapper.length === 0 ) {
                return;
            }

            id = $wrapper.attr( 'id' );

            if ( ! window.auxin || !auxin.elements || !auxin.elements[ id ] ) {
                return;
            }

            deps = auxin.elements[id].dependencies;

            var manager = new DependencyManager( $wrapper, {
                fieldContainer : '.aux-element-field',
                fieldMapper    : auxDependencyFieldMapper,
                observerMapper : auxDependencyFieldMapper
            } , deps );

            manager.setup();
        }

        function auxDependencyFieldMapper( target ) { return '[id$="-' + target + '"]'; }


        /**
         * Store URL hash to a field
         * @param  {[type]} $ [description]
         * @return {[type]}   [description]
         */
        (function($){
            var $rating = $(".aux-rating-section input");

            if( ! $rating.length ){
                return;
            }

            var $feedback_form      = $('.aux-feedback-form'),
                $feedback_section   = $feedback_form.find('.aux-feedback-section'),
                $submit_btn         = $feedback_section.find('input[type="submit"]'),
                $status_progress    = $('.aux-sending-status .ajax-progress'),
                $status_response    = $('.aux-sending-status .ajax-response'),
                $rate_us_notice     = $feedback_section.find('.aux-rate-us-offer'),
                rate;


            $rating.on('change', function(){
                rate = $rating.filter(':checked').val();
                if( rate !== undefined ){
                    $feedback_section.removeClass('aux-hide');
                    $rate_us_notice.toggleClass('aux-hide', rate < 9 );
                }
            }).trigger('change');


            $submit_btn.on('click', function(e){
                e.preventDefault();
                if( $submit_btn.prop('disabled') ){ return; }

                $status_progress.removeClass('aux-hide');
                $status_response.removeClass('aux-hide');

                $.ajax({
                    url : auxin.ajaxurl,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        form   : $feedback_form.serializeObject(),
                        action : 'send_feedback' // the ajax handler
                    },
                    success: function( reposnse ) {
                        if ( reposnse.success ) {
                            // sent successfully
                            $status_response.html( '<i class="_success">&#10003;</i>' + reposnse.data ).removeClass('aux-hide');
                            $status_progress.addClass('aux-hide');
                        } else {
                            // authorization failed
                            $status_response.html( '<i class="_fail">&#10008;</i>' + reposnse.data ).removeClass('aux-hide');
                            $status_progress.addClass('aux-hide');
                            submit_btn.prop( 'disabled', false );
                        }
                    }
                });

                $submit_btn.prop( 'disabled', true ).addClass('disabled');
            });


        })(jQuery);



        /**
         * Store URL hash to a field
         */
        (function($){
            $("form#post").submit(function(event) {
                localStorage.setPostMeta( auxin.post && auxin.post.id, 'edit_fragment', window.location.hash );
                return true;
            });
        })(jQuery);

    });

})(jQuery, window, document);


/* ================== auxin/js/src/_presets-manager.js =================== */


////// Preset for open panel and meta fields ///////////////////////////////////

(function($, window, document, undefined){
    "use strict";

   /**
    * Constructor
    * @param {Object}  $wrapper         Container of fields
    * @param {Object}  presetFields     Object which maps presets graph
    */
    function AuxinPresetManager( $wrapper, presetFields ){
        this.$wrapper = $wrapper;
        this.presetFields = presetFields;
        this.$observers;
    }

    var p = AuxinPresetManager.prototype;


    p.setup = function(){
        var self = this;

        for( var presetFieldId in self.presetFields ){

            self.$wrapper.find( '#' + presetFieldId ).on('change', function(){
                var $this  = $(this),
                observerId = $this.prop('id');
                if( typeof self.presetFields[ observerId ] !== 'undefined' ){
                    self.applyPresets( self.presetFields[ observerId ], $this.val() );
                }
            });

        }
    };

    p.applyPresets = function( presetDataStacks, selectedStack ){
        var self = this;

        var presetTargets = presetDataStacks[ selectedStack ];
        if( typeof presetTargets === 'undefined' ){
            // console.log( "Preset stack with '" + selectedStack + "' ID not found in stacks list." );
            return;
        }

        for( var presetTargetId in presetTargets ){

            var presetTargetValue = presetTargets[ presetTargetId ];
            var $targetField = self.$wrapper.find( '#' + presetTargetId );
            if( ! $targetField.length ){ continue; }

            switch ( $targetField[0].nodeName) {

                case 'INPUT':
                    switch ( $targetField[0].type) {
                        case 'text':
                            // if the field is color picker
                            if( $targetField.hasClass("colorpickerField") ){
                                $targetField.spectrum( "set", presetTargetValue ).change();
                                $targetField.val( presetTargetValue );
                                continue;
                            }

                        case 'checkbox':
                            if( presetTargetValue != $targetField[0].checked ){
                                $targetField.trigger("click");
                            }
                            continue;

                        case 'radio':
                            break;
                    }
                    break;

                case 'TEXTAREA':
                        if( $targetField.hasClass("wp-editor-area") ){
                            if( tinyMCE ){
                                tinyMCE.get( presetTargetId ).setContent( presetTargetValue );
                            }
                            continue;
                        }
                        break;

                case 'SELECT':
                    switch ( $targetField[0].type ) {
                        // if the select dom is NOT multiple
                        case 'select-one':
                            break;

                        // if the select dom is multiple
                        case 'select-multiple':
                            break;
                    }
                    break;
            }

            $targetField.val( presetTargetValue );
        }

    }

    $(function(){
        var $metabox, opsPres;

        // Start to watch for field dependencies in metaboxes
        if( auxin.metabox ){

          for ( var metaboxID in auxin.metabox ) {

            var metaboxpresetData = auxin.metabox[ metaboxID ].presets;
            $metabox = $('#'+ metaboxID );

            if( $metabox.length ){
              // Create a preset watcher for each metabox
              opsPres = new AuxinPresetManager( $metabox, metaboxpresetData );
              // Make sure the setup function is accessible in page builder too
              if( undefined !== opsPres.setup ){
                opsPres.setup();
              }
            }
          }

        }

        // Start to watch for option panel dependencies
        var $panel = $('.auxin_options_form');
        if( $panel.length && auxin.optionpanel.presets ){
          opsPres = new AuxinPresetManager( $panel, auxin.optionpanel.presets );
          opsPres.setup();
        }

    });

})(jQuery, window, document);


/* ================== auxin/js/src/_upload.js =================== */


/*=======================================================================================
 *  Image Upload Field
 *======================================================================================*/
(function($){
  
  var $container; 

  $(function(){

    $container = $('.av3_container .uploader');

    if( ! $container.length ) return;

    $container.each(function(index) {
    
      ////////////// get elements ////////////////////////////////////////
      // cache wrapper
      var $this = $(this);
      
      var $input  = $this.find('input[type="text"]').eq(0);
      var $placeholder  = $this.find('.img-placeholder').eq(0);
      var $upload = $this.find('input[type="button"]').eq(0);
      var $remove = $this.find('input[type="button"]').eq(1);
      
      var $imgHolder = $this.find('div.imgHolder').addClass('no-media');
      var $close  = $this.find('strong.close').addClass('no-media');
      
      ////////////// handlers ////////////////////////////////////////////
      
      // on click image close button
      $close.on('click', function(){
        var $this = $(this);
        var $img  = $this.next('img');
        $img.hide();
        $this.addClass('no-media');
        $imgHolder.addClass('no-media');
        $input.val('');
      });
      
      // on click remove button
      $remove.on('click', function(){
        $input.val('');
        $close.trigger('click');
      });
      
      // on input value change
      $input.on('keyup change blur', function(e){
        if(e.type == 'click' && e.ctrlKey){
          $upload.trigger('click');
        }else{
          updateImage($(e.target));
        }
      });
      
      // on upload btn click
      $upload.on( 'click', function() {
        var $this  = $(this);
        // get input field
        var $input = $this.siblings('input[type="text"]');
        
        // open wp media uploader (since 3.5) ---------------
        
              // If the frame already exists, re-open it.
              if ( frame ) {
                  frame.open();
                  return;
              }
              
              var frame = wp.media.frames.frame = wp.media({
                  title: "Select Image",
                  multiple: false,
                  frame: 'select',
                  library: { type: 'image' },
                  button : { text : 'Add Image' }
              });
              
              frame.on( 'select', function() {
                  var attachment = frame.state().get('selection').first().toJSON();
                  $input.val(attachment.url).trigger('change');
              });
          
              // now let's open media uploader
              frame.open();
        // end - open wp media uploader ---------------------
      });


      // on upload btn click
      $placeholder.on( 'click', function() {
        var $this  = $(this);
        // get input field
        var $input = $this.closest('.uploader').find('input[type="text"]');
        
        // open wp media uploader (since 3.5) ---------------
        
              // If the frame already exists, re-open it.
              if ( frame ) {
                  frame.open();
                  return;
              }
              
              var frame = wp.media.frames.frame = wp.media({
                  title: "Select Image",
                  multiple: false,
                  frame: 'select',
                  library: { type: 'image' },
                  button : { text : 'Add Image' }
              });
              
              frame.on( 'select', function() {
                  var attachment = frame.state().get('selection').first().toJSON();
                  $input.val(attachment.url).trigger('change');
              });
          
              // now let's open media uploader
              frame.open();
        // end - open wp media uploader ---------------------
      });
      
      updateImage($input);
    });
    
    ////////////// functions /////////////////////////////////////////////
    
    // updates image preview , if link is changed
    function updateImage($input){
      var $holder = $input.siblings('.imgHolder');
      var $close  = $holder.children('.close');
      var $img    = $close.next('img')
                .load(function(e) {
                  $holder.removeClass('no-media');
                  $close.removeClass('no-media' );
                  $img.show();
                }).error(function(e) {
                  $holder.addClass('no-media');
                  $close.addClass('no-media' );
                  $img.hide();
                });
      
      var imgUrl = $input.val();
      if (imgUrl.indexOf("http://") === -1)
        imgUrl = auxin.uploadbaseurl + '/' + imgUrl;
      $img.attr('src', imgUrl);
    }

  });

})(jQuery);