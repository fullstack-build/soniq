/**
 *  Auxin backend menu extension
 *
 *  @package Auxin
 *  @author Averta
 */
(function($, window, document, undefined){
    "use strict";

    var AuxinMenuExtend = function() {

        // cache the jQuery sortable in page.
        this.$sortable = window.wpNavMenu.menuList || $('#menu-to-edit');

        if ( !this.$sortable || !this.$sortable.length ) {
            $.error( 'Sortable is not defined in page.' );
            return;
        }

        this.updateItems();
        this.$sortable.on( 'sortstop', this._update.bind(this) );

        // override add menu item
        var _superRegisterChange = wpNavMenu.addItemToMenu,
            that = this;
        wpNavMenu.addItemToMenu = function( menuItem, processMethod, callback ) {
            if ( callback ) {
                var _callback = callback;
                callback = function() {
                    _callback();
                    that.updateItems( true );
                }
            }

            that.updateItems();
            return _superRegisterChange.call( this, menuItem, processMethod, callback );
        };
    };

    var _instance;
    AuxinMenuExtend.init = function() {
        if ( _instance ) {
            return _instance;
        } else {
            return ( _instance = new AuxinMenuExtend() );
        }
    };

    /* ------------------------------------------------------------------------------ */
    var p = AuxinMenuExtend.prototype;
    /* ------------------------------------------------------------------------------ */

    /**
     * Updates items in list
     * @param  {Boolean} onlyNewItems whether update only new items or not.
     */
    p.updateItems = function( onlyNewItems ) {
        this.$sortable.find( '>.menu-item' ).each( function( index, item ) {
            var $this = $(item);
            if ( onlyNewItems ) {
                if ( !$this.data( 'notNew' ) ) {
                    this._updateItem.apply( this, arguments );
                    this._initIconPicker( item );
                    $this.data( 'notNew', true );
                }
            } else {
                this._updateItem.apply( this, arguments );
            }
        }.bind(this) );
    };

    /* ------------------------------------------------------------------------------ */

    /**
     * Sortable event listener
     * @param  {jQuery Event}   event
     * @param  {Object}         data  Sortable data
     */
    p._update = function( event, data ) {
        var $item = data.item;
        setTimeout( function() {
            this._updateItem( 0, $item, true );
        }.bind(this), 10 );
    };

    /**
     * Updates an item in menu list
     * @param  {Number} index           not used, just added for working correctly in each function
     * @param  {Element} $item          Menu item element
     * @param  {Boolean} checkChildren  Whether check children menu items
     */
    p._updateItem = function( index, $item, checkChildren ) {

        var depth, parentType;

        // convert to jQuery
        if ( !$item.css ) {
            $item = $($item);
        }

        depth = parseInt( $item[0].className.match( /-depth-(\d+)/ )[1] );

        if ( depth > 0 ) {
            parentType = $item.prevAll( '.menu-item-depth-' + ( depth - 1 ) ).first().data( 'type' );
        }

        // update options
        $item.find( 'p[class*=aux-mm-setting]' ).each( this._checkOption.bind( this, depth ) );

        // update type
        $item.find( '.aux-mm-mega-badge, .aux-mm-col-badge' ).css( 'display', 'none' );
        $item.data( 'type', 'classic' );

        switch( depth ) {
            case 0:
                var $megamenuCheckbox = $item.find( '.aux-mm-setting-megamenu input[type="checkbox"]' );
                if ( $megamenuCheckbox.length ) {
                    // add change event
                    if ( !$megamenuCheckbox.data( 'eventAdded' ) ) {
                        $megamenuCheckbox.on( 'change', function() {
                            this._updateItem( 0, $item, true );
                        }.bind(this) ).data( 'eventAdded', true );
                    }

                    if ( $megamenuCheckbox[0].checked ) {
                        $item.find( '.aux-mm-setting-col_num, .aux-mm-mega-badge').css( 'display', '' );
                        $item.data( 'type', 'mega' );
                    } else {
                        $item.find( '.aux-mm-setting-col_num' ).css( 'display', 'none' );
                    }
                }
                break;
            case 1:
                if ( parentType === 'mega' ) {
                    $item.find( '.aux-mm-col-badge' ).css( 'display', '' );
                    $item.data( 'type', 'column' );
                }
                break;
        }

        // update children
        // childMenuItems method is added by wpNavMenu
        if ( checkChildren ) {
            $.each( $item.childMenuItems(), this._updateItem.bind(this) );
        }
    };

    /**
     * Checkes menu item option for appearing or disappearing based on the item depth
     * @param  {Number}      depth
     * @param  {Number}      index
     * @param  {Element}     option
     */
    p._checkOption = function( depth, index, option ) {
        var $option = $(option),
            minDepth = $option.data('min-depth') || 0,
            maxDepth = $option.data('max-depth') || 0;
        $option.css( 'display',  ( depth <= maxDepth && depth >= minDepth  ? '' : 'none' ) );
    };

    /**
     * initilize the icon picker for new added items to menu list
     * @param  {Element} $target
     */
    p._initIconPicker = function( target ) {
        $(target).find('> .menu-item-settings > .aux-master-menu-setting-wrapper > .field-icon .aux-fonticonpicker').fontIconPicker({
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
        });
    };

    /* ------------------------------------------------------------------------------ */

    // init after dom ready
    $(function(){
        AuxinMenuExtend.init();
    });

})(jQuery, window, document);
