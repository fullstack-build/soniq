/*! Auxin WordPress Framework - v5.2.22 (2020-02-10)
 *  All required javascript plugins for admin 
 *  http://averta.net
 *  Place any jQuery/helper plugins in here, instead of separate, slower script files!
 */

if( typeof Object.create !== 'function' ){ Object.create = function (obj){ function F(){} F.prototype = obj; return new F();}; }

/*! 
 * ================== js/libs/plugins/plugins-config.js =================== 
 **/ 


if( typeof Object.create !== 'function' ){ Object.create = function (obj){ function F(){} F.prototype = obj; return new F();}; }

// config for lazysizes
window.lazySizesConfig = window.lazySizesConfig || {};
window.lazySizesConfig.lazyClass    = 'aux-preload';
window.lazySizesConfig.loadingClass = 'aux-preloading';
window.lazySizesConfig.loadedClass  = 'aux-preloaded';

// On Loading
// an event right before of the "unveil" transformation of lazyload
document.addEventListener('lazybeforeunveil', function( e ){
    var color = e.target.getAttribute( 'data-bg-color' );
    if( color ){
        e.target.style.backgroundColor = color;
    }
});

document.addEventListener('lazyloaded', function( e ){
    if( e.target.getAttribute('data-bg-color') ){
    	e.target.style.backgroundColor = 'initial';
    }
    if( e.target.classList.contains('aux-has-preload-height') ){
        e.target.classList.remove('aux-has-preload-height');
        e.target.style.height = 'auto';
    }

    // Lazyload videos
    if( e.target.nodeName === "VIDEO" ){
        var video = e.target;

        for (var source in video.children) {
            var videoSource = video.children[source];
            if ( videoSource.tagName === "SOURCE" && videoSource.getAttribute('data-src') ) {
                videoSource.src = videoSource.getAttribute('data-src');
            }
        }
        video.load();

        // autoPlay video
        if( video.classList.contains('aux-autoplay') ){
            video.play();
        }
    }
});

(function($, window, document, undefined){
    "use strict";

    var resposiveNotLoadedImages = function(){
        var width, height, lazysizeImages = document.querySelectorAll('.aux-preload');

        Array.prototype.forEach.call(lazysizeImages, function(el, i){
            if( ( width = el.getAttribute('width') ) && ( height = el.getAttribute('height') ) ){
                el.style.height = el.clientWidth/(width/height) + 'px';
                el.classList.add('aux-has-preload-height');
            }
        });
    };

    window.addEventListener("orientationchange", resposiveNotLoadedImages);
    window.addEventListener('resize', resposiveNotLoadedImages);
    $(resposiveNotLoadedImages);

})(jQuery, window, document);


/*! 
 * ================== auxin/js/solo/grapick/grapick.min.js =================== 
 **/ 

/*! grapick - 0.1.7 */
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.Grapick=t():e.Grapick=t()}(this,function(){return function(e){function t(i){if(n[i])return n[i].exports;var r=n[i]={i:i,l:!1,exports:{}};return e[i].call(r.exports,r,r.exports,t),r.l=!0,r.exports}var n={};return t.m=e,t.c=n,t.d=function(e,n,i){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:i})},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=1)}([function(e,t,n){"use strict";function i(e,t,n){t=t.split(/\s+/);for(var i=0;i<t.length;++i)e.addEventListener(t[i],n)}function r(e,t,n){t=t.split(/\s+/);for(var i=0;i<t.length;++i)e.removeEventListener(t[i],n)}Object.defineProperty(t,"__esModule",{value:!0}),t.on=i,t.off=r},function(e,t,n){"use strict";var i=n(2),r=function(e){return e&&e.__esModule?e:{default:e}}(i);e.exports=function(e){return new r.default(e)}},function(e,t,n){"use strict";function i(e){return e&&e.__esModule?e:{default:e}}function r(e){if(Array.isArray(e)){for(var t=0,n=Array(e.length);t<e.length;t++)n[t]=e[t];return n}return Array.from(e)}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function l(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(t,"__esModule",{value:!0});var s=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),c=n(3),u=i(c),h=n(4),d=i(h),f=n(0),v=function(e,t){return e.position-t.position},g=function(e){return e+"-gradient("},p=function(e){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};o(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));e=Object.assign({},e);var i={pfx:"grp",el:".grp",colorEl:"",min:0,max:100,direction:"90deg",type:"linear",height:"30px",width:"100%"};for(var r in i)r in e||(e[r]=i[r]);var l=e.el;if(!((l="string"==typeof l?document.querySelector(l):l)instanceof HTMLElement))throw"Element not found, given "+l;return n.el=l,n.handlers=[],n.options=e,n.on("handler:color:change",function(e,t){return n.change(t)}),n.on("handler:position:change",function(e,t){return n.change(t)}),n.on("handler:remove",function(e){return n.change(1)}),n.on("handler:add",function(e){return n.change(1)}),n.render(),n}return l(t,e),s(t,[{key:"setColorPicker",value:function(e){this.colorPicker=e}},{key:"getValue",value:function(e,t){var n=this.getColorValue(),i=e||this.getType(),r=t||this.getDirection();return n?i+"-gradient("+r+", "+n+")":""}},{key:"getSafeValue",value:function(e,t){var n=this.previewEl,i=this.getValue(e,t);if(!this.sandEl&&(this.sandEl=document.createElement("div")),!n||!i)return"";for(var o=this.sandEl.style,a=[i].concat(r(this.getPrefixedValues(e,t))),l=void 0,s=0;s<a.length&&(l=a[s],o.backgroundImage=l,o.backgroundImage!=l);s++);return o.backgroundImage}},{key:"setValue",value:function(){var e=this,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},i=this.type,r=this.direction,o=t.indexOf("(")+1,a=t.lastIndexOf(")"),l=t.substring(o,a),s=l.split(/,(?![^(]*\)) /);if(this.clear(n),!l)return void this.updatePreview();s.length>2&&(r=s.shift());var c=void 0;["repeating-linear","repeating-radial","linear","radial"].forEach(function(e){t.indexOf(g(e))>-1&&!c&&(c=1,i=e)}),this.setDirection(r,n),this.setType(i,n),s.forEach(function(t){var i=t.split(" "),r=parseFloat(i.pop()),o=i.join("");e.addHandler(r,o,0,n)}),this.updatePreview()}},{key:"getColorValue",value:function(){var e=this.handlers;return e.sort(v),e=1==e.length?[e[0],e[0]]:e,e.map(function(e){return e.getValue()}).join(", ")}},{key:"getPrefixedValues",value:function(e,t){var n=this.getValue(e,t);return["-moz-","-webkit-","-o-","-ms-"].map(function(e){return""+e+n})}},{key:"change",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.updatePreview(),!t.silent&&this.emit("change",e)}},{key:"setDirection",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.options.direction=e,this.change(1,t)}},{key:"getDirection",value:function(){return this.options.direction}},{key:"setType",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.options.type=e,this.change(1,t)}},{key:"getType",value:function(){return this.options.type}},{key:"addHandler",value:function(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1,i=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{},r=new d.default(this,e,t,n);return!i.silent&&this.emit("handler:add",r),r}},{key:"getHandler",value:function(e){return this.handlers[e]}},{key:"getHandlers",value:function(){return this.handlers}},{key:"clear",value:function(){for(var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=this.handlers,n=t.length-1;n>=0;n--)t[n].remove(e)}},{key:"getSelected",value:function(){for(var e=this.getHandlers(),t=0;t<e.length;t++){var n=e[t];if(n.isSelected())return n}return null}},{key:"updatePreview",value:function(){var e=this.previewEl;e&&(e.style.backgroundImage=this.getSafeValue("linear","to right"))}},{key:"initEvents",value:function(){var e=this,t=this.options,n=t.min,i=t.max,r=this.previewEl,o=0,a={};r&&(0,f.on)(r,"click",function(t){a.w=r.clientWidth,a.h=r.clientHeight;var l=t.offsetX-r.clientLeft,s=t.offsetY-r.clientTop;if(!((o=l/a.w*100)>i||o<n)){var c=document.createElement("canvas"),u=c.getContext("2d");c.width=a.w,c.height=a.h;var h=u.createLinearGradient(0,0,a.w,a.h);e.getHandlers().forEach(function(e){return h.addColorStop(e.position/100,e.color)}),u.fillStyle=h,u.fillRect(0,0,c.width,c.height),c.style.background="black";var d=c.getContext("2d").getImageData(l,s,1,1).data,f="rgba("+d[0]+", "+d[1]+", "+d[2]+", "+d[3]+")";e.addHandler(o,f)}})}},{key:"render",value:function(){var e=this.options,t=this.el,n=e.pfx,i=e.height,r=e.width;if(t){var o=n+"-wrapper",a=n+"-preview";t.innerHTML='\n      <div class="'+o+'">\n        <div class="'+a+'"></div>\n      </div>\n    ';var l=t.querySelector("."+o),s=t.querySelector("."+a),c=l.style;c.position="relative",this.wrapperEl=l,this.previewEl=s,i&&(c.height=i),r&&(c.width=r),this.initEvents(),this.updatePreview()}}}]),t}(u.default);t.default=p},function(e,t){function n(){}n.prototype={on:function(e,t,n){var i=this.e||(this.e={});return(i[e]||(i[e]=[])).push({fn:t,ctx:n}),this},once:function(e,t,n){function i(){r.off(e,i),t.apply(n,arguments)}var r=this;return i._=t,this.on(e,i,n)},emit:function(e){var t=[].slice.call(arguments,1),n=((this.e||(this.e={}))[e]||[]).slice(),i=0,r=n.length;for(i;i<r;i++)n[i].fn.apply(n[i].ctx,t);return this},off:function(e,t){var n=this.e||(this.e={}),i=n[e],r=[];if(i&&t)for(var o=0,a=i.length;o<a;o++)i[o].fn!==t&&i[o].fn._!==t&&r.push(i[o]);return r.length?n[e]=r:delete n[e],this}},e.exports=n},function(e,t,n){"use strict";function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),o=n(0),a=function(){function e(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"black",o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:1;i(this,e),t.getHandlers().push(this),this.gp=t,this.position=n,this.color=r,this.selected=0,this.render(),o&&this.select()}return r(e,[{key:"toJSON",value:function(){return{position:this.position,selected:this.selected,color:this.color}}},{key:"setColor",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1;this.color=e,this.emit("handler:color:change",this,t)}},{key:"setPosition",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1,n=this.getEl();this.position=e,n&&(n.style.left=e+"%"),this.emit("handler:position:change",this,t)}},{key:"getColor",value:function(){return this.color}},{key:"getPosition",value:function(){return this.position}},{key:"isSelected",value:function(){return!!this.selected}},{key:"getValue",value:function(){return this.getColor()+" "+this.getPosition()+"%"}},{key:"select",value:function(){var e=this.getEl();this.gp.getHandlers().forEach(function(e){return e.deselect()}),this.selected=1;var t=this.getSelectedCls();e&&(e.className+=" "+t),this.emit("handler:select",this)}},{key:"deselect",value:function(){var e=this.getEl();this.selected=0;var t=this.getSelectedCls();e&&(e.className=e.className.replace(t,"").trim()),this.emit("handler:deselect",this)}},{key:"getSelectedCls",value:function(){return this.gp.options.pfx+"-handler-selected"}},{key:"remove",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=this.getEl(),n=this.gp.getHandlers(),i=n.splice(n.indexOf(this),1)[0];return t&&t.parentNode.removeChild(t),!e.silent&&this.emit("handler:remove",i),i}},{key:"getEl",value:function(){return this.el}},{key:"initEvents",value:function(){var e=this,t=this.getEl(),n=this.gp.previewEl,i=this.gp.options,r=i.min,a=i.max,l=t.querySelector("[data-toggle=handler-close]"),s=t.querySelector("[data-toggle=handler-color-c]"),c=t.querySelector("[data-toggle=handler-color-wrap]"),u=t.querySelector("[data-toggle=handler-color]"),h=t.querySelector("[data-toggle=handler-drag]");if(s&&(0,o.on)(s,"click",function(e){return e.stopPropagation()}),l&&(0,o.on)(l,"click",function(t){t.stopPropagation(),e.remove()}),u&&(0,o.on)(u,"change",function(t){var n=t.target,i=n.value;e.setColor(i),c&&(c.style.backgroundColor=i)}),h){var d=0,f=0,v=0,g={},p={},y={},m=function(t){v=1,y.x=t.clientX-p.x,y.y=t.clientY-p.y,d=100*y.x,d/=g.w,d=f+d,d=d<r?r:d,d=d>a?a:d,e.setPosition(d,0),e.emit("handler:drag",e,d),0===t.which&&k(t)},k=function t(n){v&&(v=0,e.setPosition(d),(0,o.off)(document,"touchmove mousemove",m),(0,o.off)(document,"touchend mouseup",t),e.emit("handler:drag:end",e,d))},b=function(t){0===t.button&&(e.select(),f=e.position,g.w=n.clientWidth,g.h=n.clientHeight,p.x=t.clientX,p.y=t.clientY,(0,o.on)(document,"touchmove mousemove",m),(0,o.on)(document,"touchend mouseup",k),e.emit("handler:drag:start",e))};(0,o.on)(h,"touchstart mousedown",b),(0,o.on)(h,"click",function(e){return e.stopPropagation()})}}},{key:"emit",value:function(){var e;(e=this.gp).emit.apply(e,arguments)}},{key:"render",value:function(){var e=this.gp,t=e.options,n=e.previewEl,i=e.colorPicker,r=t.pfx,o=t.colorEl,a=this.getColor();if(n){var l=document.createElement("div"),s=l.style,c=r+"-handler";return l.className=c,l.innerHTML='\n      <div class="'+c+'-close-c">\n        <div class="'+c+'-close" data-toggle="handler-close">&Cross;</div>\n      </div>\n      <div class="'+c+'-drag" data-toggle="handler-drag"></div>\n      <div class="'+c+'-cp-c" data-toggle="handler-color-c">\n        '+(o||'\n          <div class="'+c+'-cp-wrap" data-toggle="handler-color-wrap" style="background-color: '+a+'">\n            <input type="color" data-toggle="handler-color" value="'+a+'">\n          </div>')+"\n      </div>\n    ",s.position="absolute",s.top=0,s.left=this.position+"%",n.appendChild(l),this.el=l,this.initEvents(),i&&i(this),l}}}]),e}();t.default=a}])});


/*! 
 * ================== auxin/js/libs/averta-prototypes.js =================== 
 **/ 

/* Javascript prototypes
 *=========================================================================*/
String.prototype.capFirstLetter  = function() { return this.charAt(0).toUpperCase() + this.slice(1); };
String.prototype.capFirstLetters = function() { return this.toLowerCase().replace(/\b[a-z]/g, function(letter) { return letter.toUpperCase(); });};
// add array.indexOf support for IE
if(!Array.prototype.indexOf){Array.prototype.indexOf=function(elt){var len=this.length>>>0;var from=Number(arguments[1])||0;from=(from<0)?Math.ceil(from):Math.floor(from);if(from<0)from+=len;for(;from<len;from++){if(from in this&&this[from]===elt)return from}return-1}};
// switch a checkbox on and off
jQuery.fn.auxSwitch = function( status ) { if( this.prop("checked") != status ){ this.trigger("click"); } return this; };
// create js namespace by string
function auxinCreateNamespace(n){for(var e=n.split("."),a=window,i="",r=e.length,t=0;r>t;t++)"window"!=e[t]&&(i=e[t],a[i]=a[i]||{},a=a[i]);return a;}

String.prototype.auxReplaceAll = function(search, replacement) { var target = this; return target.split(search).join(replacement); };

// set post meta key and value in local storage
Storage.prototype.setPostMeta = function( postID, metaKey, metaValue ) {
    if( ! ( postID && metaKey && metaValue ) ){ return; }

    var postMetaObj = this.getItem('auxin_post_meta');
    postMetaObj = JSON.parse(postMetaObj) || {};
    postMetaObj[ metaKey+'_'+postID ] = { "id": postID, "meta_key": metaKey, "meta_value": metaValue };
    return this.setItem( 'auxin_post_meta', JSON.stringify( postMetaObj ) );
};

// get post meta key and value in local storage
Storage.prototype.getPostMeta = function( postID, metaKey, defaultValue ) {
    if( ! ( postID && metaKey) ){ return; }
    defaultValue = defaultValue || '';

    var postMetaObj = this.getItem('auxin_post_meta');
    postMetaObj = JSON.parse(postMetaObj) || {};
    return ( postMetaObj[ metaKey+'_'+postID ] && postMetaObj[ metaKey+'_'+postID ][ 'meta_value' ] ) || '';
};

// set url hash on page start in admin edit pages
window.location.hash = localStorage.getPostMeta( auxin.post && auxin.post.id, 'edit_fragment' );

// serialize the form to JSON
jQuery.fn.serializeObject=function(){"use strict";var a={},b=function(b,c){var d=a[c.name];"undefined"!=typeof d&&d!==null?jQuery.isArray(d)?d.push(c.value):a[c.name]=[d,c.value]:a[c.name]=c.value};return jQuery.each(this.serializeArray(),b),a};



/**
 * jQuery alterClass plugin
 *
 * Remove element classes with wildcard matching. Optionally add classes:
 *   $( '#foo' ).alterClass( 'foo-* bar-*', 'foobar' )
 *
 * Copyright (c) 2011 Pete Boere (the-echoplex.net)
 * Free under terms of the MIT license: http://www.opensource.org/licenses/mit-license.php
 * https://gist.github.com/peteboere/1517285
 */
(function ( $ ) {

$.fn.alterClass = function ( removals, additions ) {

    var self = this;

    if ( removals.indexOf( '*' ) === -1 ) {
        // Use native jQuery methods if there is no wildcard matching
        self.removeClass( removals );
        return !additions ? self : self.addClass( additions );
    }

    var patt = new RegExp( '\\s' +
            removals.
                replace( /\*/g, '[A-Za-z0-9-_]+' ).
                split( ' ' ).
                join( '\\s|\\s' ) +
            '\\s', 'g' );

    self.each( function ( i, it ) {
        var cn = ' ' + it.className + ' ';
        while ( patt.test( cn ) ) {
            cn = cn.replace( patt, ' ' );
        }
        it.className = $.trim( cn );
    });

    return !additions ? self : self.addClass( additions );
};

})( jQuery );


function inArray( needle, haystack ) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}

function auxinIsTrue( variable ) {
    if( typeof(variable) === "boolean" ){
        return variable;
    }

    if( typeof(variable) === "string" ){
        variable = variable.toLowerCase();
        if( inArray( variable, ['yes', 'on', 'true', 'checked'] ) ){
            return true;
        }
    }
    // if is nummeric
    if ( !isNaN(parseFloat(variable)) && isFinite(variable) ) {
        return Boolean(variable);
    }

    return false;
}

;


/*! 
 * ================== auxin/js/libs/select2/select2.js =================== 
 **/ 

/*!
 * Select2 4.0.3
 * https://select2.github.io
 *
 * Released under the MIT license
 * https://github.com/select2/select2/blob/master/LICENSE.md
 */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function (jQuery) {
  // This is needed so we can catch the AMD loader configuration and use it
  // The inner file should be wrapped (by `banner.start.js`) in a function that
  // returns the AMD loader references.
  var S2 =
(function () {
  // Restore the Select2 AMD loader so it can be used
  // Needed mostly in the language files, where the loader is not inserted
  if (jQuery && jQuery.fn && jQuery.fn.select2 && jQuery.fn.select2.amd) {
    var S2 = jQuery.fn.select2.amd;
  }
var S2;(function () { if (!S2 || !S2.requirejs) {
if (!S2) { S2 = {}; } else { require = S2; }
/**
 * @license almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                //Lop off the last part of baseParts, so that . matches the
                //"directory" and not name of the baseName's module. For instance,
                //baseName of "one/two/three", maps to "one/two/three.js", but we
                //want the directory, "one/two" for this normalization.
                name = baseParts.slice(0, baseParts.length - 1).concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

S2.requirejs = requirejs;S2.require = require;S2.define = define;
}
}());
S2.define("almond", function(){});

/* global jQuery:false, $:false */
S2.define('jquery',[],function () {
  var _$ = jQuery || $;

  if (_$ == null && console && console.error) {
    console.error(
      'Select2: An instance of jQuery or a jQuery-compatible library was not ' +
      'found. Make sure that you are including jQuery before Select2 on your ' +
      'web page.'
    );
  }

  return _$;
});

S2.define('select2/utils',[
  'jquery'
], function ($) {
  var Utils = {};

  Utils.Extend = function (ChildClass, SuperClass) {
    var __hasProp = {}.hasOwnProperty;

    function BaseConstructor () {
      this.constructor = ChildClass;
    }

    for (var key in SuperClass) {
      if (__hasProp.call(SuperClass, key)) {
        ChildClass[key] = SuperClass[key];
      }
    }

    BaseConstructor.prototype = SuperClass.prototype;
    ChildClass.prototype = new BaseConstructor();
    ChildClass.__super__ = SuperClass.prototype;

    return ChildClass;
  };

  function getMethods (theClass) {
    var proto = theClass.prototype;

    var methods = [];

    for (var methodName in proto) {
      var m = proto[methodName];

      if (typeof m !== 'function') {
        continue;
      }

      if (methodName === 'constructor') {
        continue;
      }

      methods.push(methodName);
    }

    return methods;
  }

  Utils.Decorate = function (SuperClass, DecoratorClass) {
    var decoratedMethods = getMethods(DecoratorClass);
    var superMethods = getMethods(SuperClass);

    function DecoratedClass () {
      var unshift = Array.prototype.unshift;

      var argCount = DecoratorClass.prototype.constructor.length;

      var calledConstructor = SuperClass.prototype.constructor;

      if (argCount > 0) {
        unshift.call(arguments, SuperClass.prototype.constructor);

        calledConstructor = DecoratorClass.prototype.constructor;
      }

      calledConstructor.apply(this, arguments);
    }

    DecoratorClass.displayName = SuperClass.displayName;

    function ctr () {
      this.constructor = DecoratedClass;
    }

    DecoratedClass.prototype = new ctr();

    for (var m = 0; m < superMethods.length; m++) {
        var superMethod = superMethods[m];

        DecoratedClass.prototype[superMethod] =
          SuperClass.prototype[superMethod];
    }

    var calledMethod = function (methodName) {
      // Stub out the original method if it's not decorating an actual method
      var originalMethod = function () {};

      if (methodName in DecoratedClass.prototype) {
        originalMethod = DecoratedClass.prototype[methodName];
      }

      var decoratedMethod = DecoratorClass.prototype[methodName];

      return function () {
        var unshift = Array.prototype.unshift;

        unshift.call(arguments, originalMethod);

        return decoratedMethod.apply(this, arguments);
      };
    };

    for (var d = 0; d < decoratedMethods.length; d++) {
      var decoratedMethod = decoratedMethods[d];

      DecoratedClass.prototype[decoratedMethod] = calledMethod(decoratedMethod);
    }

    return DecoratedClass;
  };

  var Observable = function () {
    this.listeners = {};
  };

  Observable.prototype.on = function (event, callback) {
    this.listeners = this.listeners || {};

    if (event in this.listeners) {
      this.listeners[event].push(callback);
    } else {
      this.listeners[event] = [callback];
    }
  };

  Observable.prototype.trigger = function (event) {
    var slice = Array.prototype.slice;
    var params = slice.call(arguments, 1);

    this.listeners = this.listeners || {};

    // Params should always come in as an array
    if (params == null) {
      params = [];
    }

    // If there are no arguments to the event, use a temporary object
    if (params.length === 0) {
      params.push({});
    }

    // Set the `_type` of the first object to the event
    params[0]._type = event;

    if (event in this.listeners) {
      this.invoke(this.listeners[event], slice.call(arguments, 1));
    }

    if ('*' in this.listeners) {
      this.invoke(this.listeners['*'], arguments);
    }
  };

  Observable.prototype.invoke = function (listeners, params) {
    for (var i = 0, len = listeners.length; i < len; i++) {
      listeners[i].apply(this, params);
    }
  };

  Utils.Observable = Observable;

  Utils.generateChars = function (length) {
    var chars = '';

    for (var i = 0; i < length; i++) {
      var randomChar = Math.floor(Math.random() * 36);
      chars += randomChar.toString(36);
    }

    return chars;
  };

  Utils.bind = function (func, context) {
    return function () {
      func.apply(context, arguments);
    };
  };

  Utils._convertData = function (data) {
    for (var originalKey in data) {
      var keys = originalKey.split('-');

      var dataLevel = data;

      if (keys.length === 1) {
        continue;
      }

      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];

        // Lowercase the first letter
        // By default, dash-separated becomes camelCase
        key = key.substring(0, 1).toLowerCase() + key.substring(1);

        if (!(key in dataLevel)) {
          dataLevel[key] = {};
        }

        if (k == keys.length - 1) {
          dataLevel[key] = data[originalKey];
        }

        dataLevel = dataLevel[key];
      }

      delete data[originalKey];
    }

    return data;
  };

  Utils.hasScroll = function (index, el) {
    // Adapted from the function created by @ShadowScripter
    // and adapted by @BillBarry on the Stack Exchange Code Review website.
    // The original code can be found at
    // http://codereview.stackexchange.com/q/13338
    // and was designed to be used with the Sizzle selector engine.

    var $el = $(el);
    var overflowX = el.style.overflowX;
    var overflowY = el.style.overflowY;

    //Check both x and y declarations
    if (overflowX === overflowY &&
        (overflowY === 'hidden' || overflowY === 'visible')) {
      return false;
    }

    if (overflowX === 'scroll' || overflowY === 'scroll') {
      return true;
    }

    return ($el.innerHeight() < el.scrollHeight ||
      $el.innerWidth() < el.scrollWidth);
  };

  Utils.escapeMarkup = function (markup) {
    var replaceMap = {
      '\\': '&#92;',
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#39;',
      '/': '&#47;'
    };

    // Do not try to escape the markup if it's not a string
    if (typeof markup !== 'string') {
      return markup;
    }

    return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
      return replaceMap[match];
    });
  };

  // Append an array of jQuery nodes to a given element.
  Utils.appendMany = function ($element, $nodes) {
    // jQuery 1.7.x does not support $.fn.append() with an array
    // Fall back to a jQuery object collection using $.fn.add()
    if ($.fn.jquery.substr(0, 3) === '1.7') {
      var $jqNodes = $();

      $.map($nodes, function (node) {
        $jqNodes = $jqNodes.add(node);
      });

      $nodes = $jqNodes;
    }

    $element.append($nodes);
  };

  return Utils;
});

S2.define('select2/results',[
  'jquery',
  './utils'
], function ($, Utils) {
  function Results ($element, options, dataAdapter) {
    this.$element = $element;
    this.data = dataAdapter;
    this.options = options;

    Results.__super__.constructor.call(this);
  }

  Utils.Extend(Results, Utils.Observable);

  Results.prototype.render = function () {
    var $results = $(
      '<ul class="select2-results__options" role="tree"></ul>'
    );

    if (this.options.get('multiple')) {
      $results.attr('aria-multiselectable', 'true');
    }

    this.$results = $results;

    return $results;
  };

  Results.prototype.clear = function () {
    this.$results.empty();
  };

  Results.prototype.displayMessage = function (params) {
    var escapeMarkup = this.options.get('escapeMarkup');

    this.clear();
    this.hideLoading();

    var $message = $(
      '<li role="treeitem" aria-live="assertive"' +
      ' class="select2-results__option"></li>'
    );

    var message = this.options.get('translations').get(params.message);

    $message.append(
      escapeMarkup(
        message(params.args)
      )
    );

    $message[0].className += ' select2-results__message';

    this.$results.append($message);
  };

  Results.prototype.hideMessages = function () {
    this.$results.find('.select2-results__message').remove();
  };

  Results.prototype.append = function (data) {
    this.hideLoading();

    var $options = [];

    if (data.results == null || data.results.length === 0) {
      if (this.$results.children().length === 0) {
        this.trigger('results:message', {
          message: 'noResults'
        });
      }

      return;
    }

    data.results = this.sort(data.results);

    for (var d = 0; d < data.results.length; d++) {
      var item = data.results[d];

      var $option = this.option(item);

      $options.push($option);
    }

    this.$results.append($options);
  };

  Results.prototype.position = function ($results, $dropdown) {
    var $resultsContainer = $dropdown.find('.select2-results');
    $resultsContainer.append($results);
  };

  Results.prototype.sort = function (data) {
    var sorter = this.options.get('sorter');

    return sorter(data);
  };

  Results.prototype.highlightFirstItem = function () {
    var $options = this.$results
      .find('.select2-results__option[aria-selected]');

    var $selected = $options.filter('[aria-selected=true]');

    // Check if there are any selected options
    if ($selected.length > 0) {
      // If there are selected options, highlight the first
      $selected.first().trigger('mouseenter');
    } else {
      // If there are no selected options, highlight the first option
      // in the dropdown
      $options.first().trigger('mouseenter');
    }

    this.ensureHighlightVisible();
  };

  Results.prototype.setClasses = function () {
    var self = this;

    this.data.current(function (selected) {
      var selectedIds = $.map(selected, function (s) {
        return s.id.toString();
      });

      var $options = self.$results
        .find('.select2-results__option[aria-selected]');

      $options.each(function () {
        var $option = $(this);

        var item = $.data(this, 'data');

        // id needs to be converted to a string when comparing
        var id = '' + item.id;

        if ((item.element != null && item.element.selected) ||
            (item.element == null && $.inArray(id, selectedIds) > -1)) {
          $option.attr('aria-selected', 'true');
        } else {
          $option.attr('aria-selected', 'false');
        }
      });

    });
  };

  Results.prototype.showLoading = function (params) {
    this.hideLoading();

    var loadingMore = this.options.get('translations').get('searching');

    var loading = {
      disabled: true,
      loading: true,
      text: loadingMore(params)
    };
    var $loading = this.option(loading);
    $loading.className += ' loading-results';

    this.$results.prepend($loading);
  };

  Results.prototype.hideLoading = function () {
    this.$results.find('.loading-results').remove();
  };

  Results.prototype.option = function (data) {
    var option = document.createElement('li');
    option.className = 'select2-results__option';

    var attrs = {
      'role': 'treeitem',
      'aria-selected': 'false'
    };

    if (data.disabled) {
      delete attrs['aria-selected'];
      attrs['aria-disabled'] = 'true';
    }

    if (data.id == null) {
      delete attrs['aria-selected'];
    }

    if (data._resultId != null) {
      option.id = data._resultId;
    }

    if (data.title) {
      option.title = data.title;
    }

    if (data.children) {
      attrs.role = 'group';
      attrs['aria-label'] = data.text;
      delete attrs['aria-selected'];
    }

    for (var attr in attrs) {
      var val = attrs[attr];

      option.setAttribute(attr, val);
    }

    if (data.children) {
      var $option = $(option);

      var label = document.createElement('strong');
      label.className = 'select2-results__group';

      var $label = $(label);
      this.template(data, label);

      var $children = [];

      for (var c = 0; c < data.children.length; c++) {
        var child = data.children[c];

        var $child = this.option(child);

        $children.push($child);
      }

      var $childrenContainer = $('<ul></ul>', {
        'class': 'select2-results__options select2-results__options--nested'
      });

      $childrenContainer.append($children);

      $option.append(label);
      $option.append($childrenContainer);
    } else {
      this.template(data, option);
    }

    $.data(option, 'data', data);

    return option;
  };

  Results.prototype.bind = function (container, $container) {
    var self = this;

    var id = container.id + '-results';

    this.$results.attr('id', id);

    container.on('results:all', function (params) {
      self.clear();
      self.append(params.data);

      if (container.isOpen()) {
        self.setClasses();
        self.highlightFirstItem();
      }
    });

    container.on('results:append', function (params) {
      self.append(params.data);

      if (container.isOpen()) {
        self.setClasses();
      }
    });

    container.on('query', function (params) {
      self.hideMessages();
      self.showLoading(params);
    });

    container.on('select', function () {
      if (!container.isOpen()) {
        return;
      }

      self.setClasses();
      self.highlightFirstItem();
    });

    container.on('unselect', function () {
      if (!container.isOpen()) {
        return;
      }

      self.setClasses();
      self.highlightFirstItem();
    });

    container.on('open', function () {
      // When the dropdown is open, aria-expended="true"
      self.$results.attr('aria-expanded', 'true');
      self.$results.attr('aria-hidden', 'false');

      self.setClasses();
      self.ensureHighlightVisible();
    });

    container.on('close', function () {
      // When the dropdown is closed, aria-expended="false"
      self.$results.attr('aria-expanded', 'false');
      self.$results.attr('aria-hidden', 'true');
      self.$results.removeAttr('aria-activedescendant');
    });

    container.on('results:toggle', function () {
      var $highlighted = self.getHighlightedResults();

      if ($highlighted.length === 0) {
        return;
      }

      $highlighted.trigger('mouseup');
    });

    container.on('results:select', function () {
      var $highlighted = self.getHighlightedResults();

      if ($highlighted.length === 0) {
        return;
      }

      var data = $highlighted.data('data');

      if ($highlighted.attr('aria-selected') == 'true') {
        self.trigger('close', {});
      } else {
        self.trigger('select', {
          data: data
        });
      }
    });

    container.on('results:previous', function () {
      var $highlighted = self.getHighlightedResults();

      var $options = self.$results.find('[aria-selected]');

      var currentIndex = $options.index($highlighted);

      // If we are already at te top, don't move further
      if (currentIndex === 0) {
        return;
      }

      var nextIndex = currentIndex - 1;

      // If none are highlighted, highlight the first
      if ($highlighted.length === 0) {
        nextIndex = 0;
      }

      var $next = $options.eq(nextIndex);

      $next.trigger('mouseenter');

      var currentOffset = self.$results.offset().top;
      var nextTop = $next.offset().top;
      var nextOffset = self.$results.scrollTop() + (nextTop - currentOffset);

      if (nextIndex === 0) {
        self.$results.scrollTop(0);
      } else if (nextTop - currentOffset < 0) {
        self.$results.scrollTop(nextOffset);
      }
    });

    container.on('results:next', function () {
      var $highlighted = self.getHighlightedResults();

      var $options = self.$results.find('[aria-selected]');

      var currentIndex = $options.index($highlighted);

      var nextIndex = currentIndex + 1;

      // If we are at the last option, stay there
      if (nextIndex >= $options.length) {
        return;
      }

      var $next = $options.eq(nextIndex);

      $next.trigger('mouseenter');

      var currentOffset = self.$results.offset().top +
        self.$results.outerHeight(false);
      var nextBottom = $next.offset().top + $next.outerHeight(false);
      var nextOffset = self.$results.scrollTop() + nextBottom - currentOffset;

      if (nextIndex === 0) {
        self.$results.scrollTop(0);
      } else if (nextBottom > currentOffset) {
        self.$results.scrollTop(nextOffset);
      }
    });

    container.on('results:focus', function (params) {
      params.element.addClass('select2-results__option--highlighted');
    });

    container.on('results:message', function (params) {
      self.displayMessage(params);
    });

    if ($.fn.mousewheel) {
      this.$results.on('mousewheel', function (e) {
        var top = self.$results.scrollTop();

        var bottom = self.$results.get(0).scrollHeight - top + e.deltaY;

        var isAtTop = e.deltaY > 0 && top - e.deltaY <= 0;
        var isAtBottom = e.deltaY < 0 && bottom <= self.$results.height();

        if (isAtTop) {
          self.$results.scrollTop(0);

          e.preventDefault();
          e.stopPropagation();
        } else if (isAtBottom) {
          self.$results.scrollTop(
            self.$results.get(0).scrollHeight - self.$results.height()
          );

          e.preventDefault();
          e.stopPropagation();
        }
      });
    }

    this.$results.on('mouseup', '.select2-results__option[aria-selected]',
      function (evt) {
      var $this = $(this);

      var data = $this.data('data');

      if ($this.attr('aria-selected') === 'true') {
        if (self.options.get('multiple')) {
          self.trigger('unselect', {
            originalEvent: evt,
            data: data
          });
        } else {
          self.trigger('close', {});
        }

        return;
      }

      self.trigger('select', {
        originalEvent: evt,
        data: data
      });
    });

    this.$results.on('mouseenter', '.select2-results__option[aria-selected]',
      function (evt) {
      var data = $(this).data('data');

      self.getHighlightedResults()
          .removeClass('select2-results__option--highlighted');

      self.trigger('results:focus', {
        data: data,
        element: $(this)
      });
    });
  };

  Results.prototype.getHighlightedResults = function () {
    var $highlighted = this.$results
    .find('.select2-results__option--highlighted');

    return $highlighted;
  };

  Results.prototype.destroy = function () {
    this.$results.remove();
  };

  Results.prototype.ensureHighlightVisible = function () {
    var $highlighted = this.getHighlightedResults();

    if ($highlighted.length === 0) {
      return;
    }

    var $options = this.$results.find('[aria-selected]');

    var currentIndex = $options.index($highlighted);

    var currentOffset = this.$results.offset().top;
    var nextTop = $highlighted.offset().top;
    var nextOffset = this.$results.scrollTop() + (nextTop - currentOffset);

    var offsetDelta = nextTop - currentOffset;
    nextOffset -= $highlighted.outerHeight(false) * 2;

    if (currentIndex <= 2) {
      this.$results.scrollTop(0);
    } else if (offsetDelta > this.$results.outerHeight() || offsetDelta < 0) {
      this.$results.scrollTop(nextOffset);
    }
  };

  Results.prototype.template = function (result, container) {
    var template = this.options.get('templateResult');
    var escapeMarkup = this.options.get('escapeMarkup');

    var content = template(result, container);

    if (content == null) {
      container.style.display = 'none';
    } else if (typeof content === 'string') {
      container.innerHTML = escapeMarkup(content);
    } else {
      $(container).append(content);
    }
  };

  return Results;
});

S2.define('select2/keys',[

], function () {
  var KEYS = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    ESC: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    DELETE: 46
  };

  return KEYS;
});

S2.define('select2/selection/base',[
  'jquery',
  '../utils',
  '../keys'
], function ($, Utils, KEYS) {
  function BaseSelection ($element, options) {
    this.$element = $element;
    this.options = options;

    BaseSelection.__super__.constructor.call(this);
  }

  Utils.Extend(BaseSelection, Utils.Observable);

  BaseSelection.prototype.render = function () {
    var $selection = $(
      '<span class="select2-selection" role="combobox" ' +
      ' aria-haspopup="true" aria-expanded="false">' +
      '</span>'
    );

    this._tabindex = 0;

    if (this.$element.data('old-tabindex') != null) {
      this._tabindex = this.$element.data('old-tabindex');
    } else if (this.$element.attr('tabindex') != null) {
      this._tabindex = this.$element.attr('tabindex');
    }

    $selection.attr('title', this.$element.attr('title'));
    $selection.attr('tabindex', this._tabindex);

    this.$selection = $selection;

    return $selection;
  };

  BaseSelection.prototype.bind = function (container, $container) {
    var self = this;

    var id = container.id + '-container';
    var resultsId = container.id + '-results';

    this.container = container;

    this.$selection.on('focus', function (evt) {
      self.trigger('focus', evt);
    });

    this.$selection.on('blur', function (evt) {
      self._handleBlur(evt);
    });

    this.$selection.on('keydown', function (evt) {
      self.trigger('keypress', evt);

      if (evt.which === KEYS.SPACE) {
        evt.preventDefault();
      }
    });

    container.on('results:focus', function (params) {
      self.$selection.attr('aria-activedescendant', params.data._resultId);
    });

    container.on('selection:update', function (params) {
      self.update(params.data);
    });

    container.on('open', function () {
      // When the dropdown is open, aria-expanded="true"
      self.$selection.attr('aria-expanded', 'true');
      self.$selection.attr('aria-owns', resultsId);

      self._attachCloseHandler(container);
    });

    container.on('close', function () {
      // When the dropdown is closed, aria-expanded="false"
      self.$selection.attr('aria-expanded', 'false');
      self.$selection.removeAttr('aria-activedescendant');
      self.$selection.removeAttr('aria-owns');

      self.$selection.focus();

      self._detachCloseHandler(container);
    });

    container.on('enable', function () {
      self.$selection.attr('tabindex', self._tabindex);
    });

    container.on('disable', function () {
      self.$selection.attr('tabindex', '-1');
    });
  };

  BaseSelection.prototype._handleBlur = function (evt) {
    var self = this;

    // This needs to be delayed as the active element is the body when the tab
    // key is pressed, possibly along with others.
    window.setTimeout(function () {
      // Don't trigger `blur` if the focus is still in the selection
      if (
        (document.activeElement == self.$selection[0]) ||
        ($.contains(self.$selection[0], document.activeElement))
      ) {
        return;
      }

      self.trigger('blur', evt);
    }, 1);
  };

  BaseSelection.prototype._attachCloseHandler = function (container) {
    var self = this;

    $(document.body).on('mousedown.select2.' + container.id, function (e) {
      var $target = $(e.target);

      var $select = $target.closest('.select2');

      var $all = $('.select2.select2-container--open');

      $all.each(function () {
        var $this = $(this);

        if (this == $select[0]) {
          return;
        }

        var $element = $this.data('element');

        $element.select2('close');
      });
    });
  };

  BaseSelection.prototype._detachCloseHandler = function (container) {
    $(document.body).off('mousedown.select2.' + container.id);
  };

  BaseSelection.prototype.position = function ($selection, $container) {
    var $selectionContainer = $container.find('.selection');
    $selectionContainer.append($selection);
  };

  BaseSelection.prototype.destroy = function () {
    this._detachCloseHandler(this.container);
  };

  BaseSelection.prototype.update = function (data) {
    throw new Error('The `update` method must be defined in child classes.');
  };

  return BaseSelection;
});

S2.define('select2/selection/single',[
  'jquery',
  './base',
  '../utils',
  '../keys'
], function ($, BaseSelection, Utils, KEYS) {
  function SingleSelection () {
    SingleSelection.__super__.constructor.apply(this, arguments);
  }

  Utils.Extend(SingleSelection, BaseSelection);

  SingleSelection.prototype.render = function () {
    var $selection = SingleSelection.__super__.render.call(this);

    $selection.addClass('select2-selection--single');

    $selection.html(
      '<span class="select2-selection__rendered"></span>' +
      '<span class="select2-selection__arrow" role="presentation">' +
        '<b role="presentation"></b>' +
      '</span>'
    );

    return $selection;
  };

  SingleSelection.prototype.bind = function (container, $container) {
    var self = this;

    SingleSelection.__super__.bind.apply(this, arguments);

    var id = container.id + '-container';

    this.$selection.find('.select2-selection__rendered').attr('id', id);
    this.$selection.attr('aria-labelledby', id);

    this.$selection.on('mousedown', function (evt) {
      // Only respond to left clicks
      if (evt.which !== 1) {
        return;
      }

      self.trigger('toggle', {
        originalEvent: evt
      });
    });

    this.$selection.on('focus', function (evt) {
      // User focuses on the container
    });

    this.$selection.on('blur', function (evt) {
      // User exits the container
    });

    container.on('focus', function (evt) {
      if (!container.isOpen()) {
        self.$selection.focus();
      }
    });

    container.on('selection:update', function (params) {
      self.update(params.data);
    });
  };

  SingleSelection.prototype.clear = function () {
    this.$selection.find('.select2-selection__rendered').empty();
  };

  SingleSelection.prototype.display = function (data, container) {
    var template = this.options.get('templateSelection');
    var escapeMarkup = this.options.get('escapeMarkup');

    return escapeMarkup(template(data, container));
  };

  SingleSelection.prototype.selectionContainer = function () {
    return $('<span></span>');
  };

  SingleSelection.prototype.update = function (data) {
    if (data.length === 0) {
      this.clear();
      return;
    }

    var selection = data[0];

    var $rendered = this.$selection.find('.select2-selection__rendered');
    var formatted = this.display(selection, $rendered);

    $rendered.empty().append(formatted);
    $rendered.prop('title', selection.title || selection.text);
  };

  return SingleSelection;
});

S2.define('select2/selection/multiple',[
  'jquery',
  './base',
  '../utils'
], function ($, BaseSelection, Utils) {
  function MultipleSelection ($element, options) {
    MultipleSelection.__super__.constructor.apply(this, arguments);
  }

  Utils.Extend(MultipleSelection, BaseSelection);

  MultipleSelection.prototype.render = function () {
    var $selection = MultipleSelection.__super__.render.call(this);

    $selection.addClass('select2-selection--multiple');

    $selection.html(
      '<ul class="select2-selection__rendered"></ul>'
    );

    return $selection;
  };

  MultipleSelection.prototype.bind = function (container, $container) {
    var self = this;

    MultipleSelection.__super__.bind.apply(this, arguments);

    this.$selection.on('click', function (evt) {
      self.trigger('toggle', {
        originalEvent: evt
      });
    });

    this.$selection.on(
      'click',
      '.select2-selection__choice__remove',
      function (evt) {
        // Ignore the event if it is disabled
        if (self.options.get('disabled')) {
          return;
        }

        var $remove = $(this);
        var $selection = $remove.parent();

        var data = $selection.data('data');

        self.trigger('unselect', {
          originalEvent: evt,
          data: data
        });
      }
    );
  };

  MultipleSelection.prototype.clear = function () {
    this.$selection.find('.select2-selection__rendered').empty();
  };

  MultipleSelection.prototype.display = function (data, container) {
    var template = this.options.get('templateSelection');
    var escapeMarkup = this.options.get('escapeMarkup');

    return escapeMarkup(template(data, container));
  };

  MultipleSelection.prototype.selectionContainer = function () {
    var $container = $(
      '<li class="select2-selection__choice">' +
        '<span class="select2-selection__choice__remove" role="presentation">' +
          '&times;' +
        '</span>' +
      '</li>'
    );

    return $container;
  };

  MultipleSelection.prototype.update = function (data) {
    this.clear();

    if (data.length === 0) {
      return;
    }

    var $selections = [];

    for (var d = 0; d < data.length; d++) {
      var selection = data[d];

      var $selection = this.selectionContainer();
      var formatted = this.display(selection, $selection);

      $selection.append(formatted);
      $selection.prop('title', selection.title || selection.text);

      $selection.data('data', selection);

      $selections.push($selection);
    }

    var $rendered = this.$selection.find('.select2-selection__rendered');

    Utils.appendMany($rendered, $selections);
  };

  return MultipleSelection;
});

S2.define('select2/selection/placeholder',[
  '../utils'
], function (Utils) {
  function Placeholder (decorated, $element, options) {
    this.placeholder = this.normalizePlaceholder(options.get('placeholder'));

    decorated.call(this, $element, options);
  }

  Placeholder.prototype.normalizePlaceholder = function (_, placeholder) {
    if (typeof placeholder === 'string') {
      placeholder = {
        id: '',
        text: placeholder
      };
    }

    return placeholder;
  };

  Placeholder.prototype.createPlaceholder = function (decorated, placeholder) {
    var $placeholder = this.selectionContainer();

    $placeholder.html(this.display(placeholder));
    $placeholder.addClass('select2-selection__placeholder')
                .removeClass('select2-selection__choice');

    return $placeholder;
  };

  Placeholder.prototype.update = function (decorated, data) {
    var singlePlaceholder = (
      data.length == 1 && data[0].id != this.placeholder.id
    );
    var multipleSelections = data.length > 1;

    if (multipleSelections || singlePlaceholder) {
      return decorated.call(this, data);
    }

    this.clear();

    var $placeholder = this.createPlaceholder(this.placeholder);

    this.$selection.find('.select2-selection__rendered').append($placeholder);
  };

  return Placeholder;
});

S2.define('select2/selection/allowClear',[
  'jquery',
  '../keys'
], function ($, KEYS) {
  function AllowClear () { }

  AllowClear.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    if (this.placeholder == null) {
      if (this.options.get('debug') && window.console && console.error) {
        console.error(
          'Select2: The `allowClear` option should be used in combination ' +
          'with the `placeholder` option.'
        );
      }
    }

    this.$selection.on('mousedown', '.select2-selection__clear',
      function (evt) {
        self._handleClear(evt);
    });

    container.on('keypress', function (evt) {
      self._handleKeyboardClear(evt, container);
    });
  };

  AllowClear.prototype._handleClear = function (_, evt) {
    // Ignore the event if it is disabled
    if (this.options.get('disabled')) {
      return;
    }

    var $clear = this.$selection.find('.select2-selection__clear');

    // Ignore the event if nothing has been selected
    if ($clear.length === 0) {
      return;
    }

    evt.stopPropagation();

    var data = $clear.data('data');

    for (var d = 0; d < data.length; d++) {
      var unselectData = {
        data: data[d]
      };

      // Trigger the `unselect` event, so people can prevent it from being
      // cleared.
      this.trigger('unselect', unselectData);

      // If the event was prevented, don't clear it out.
      if (unselectData.prevented) {
        return;
      }
    }

    this.$element.val(this.placeholder.id).trigger('change');

    this.trigger('toggle', {});
  };

  AllowClear.prototype._handleKeyboardClear = function (_, evt, container) {
    if (container.isOpen()) {
      return;
    }

    if (evt.which == KEYS.DELETE || evt.which == KEYS.BACKSPACE) {
      this._handleClear(evt);
    }
  };

  AllowClear.prototype.update = function (decorated, data) {
    decorated.call(this, data);

    if (this.$selection.find('.select2-selection__placeholder').length > 0 ||
        data.length === 0) {
      return;
    }

    var $remove = $(
      '<span class="select2-selection__clear">' +
        '&times;' +
      '</span>'
    );
    $remove.data('data', data);

    this.$selection.find('.select2-selection__rendered').prepend($remove);
  };

  return AllowClear;
});

S2.define('select2/selection/search',[
  'jquery',
  '../utils',
  '../keys'
], function ($, Utils, KEYS) {
  function Search (decorated, $element, options) {
    decorated.call(this, $element, options);
  }

  Search.prototype.render = function (decorated) {
    var $search = $(
      '<li class="select2-search select2-search--inline">' +
        '<input class="select2-search__field" type="search" tabindex="-1"' +
        ' autocomplete="off" autocorrect="off" autocapitalize="off"' +
        ' spellcheck="false" role="textbox" aria-autocomplete="list" />' +
      '</li>'
    );

    this.$searchContainer = $search;
    this.$search = $search.find('input');

    var $rendered = decorated.call(this);

    this._transferTabIndex();

    return $rendered;
  };

  Search.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    container.on('open', function () {
      self.$search.trigger('focus');
    });

    container.on('close', function () {
      self.$search.val('');
      self.$search.removeAttr('aria-activedescendant');
      self.$search.trigger('focus');
    });

    container.on('enable', function () {
      self.$search.prop('disabled', false);

      self._transferTabIndex();
    });

    container.on('disable', function () {
      self.$search.prop('disabled', true);
    });

    container.on('focus', function (evt) {
      self.$search.trigger('focus');
    });

    container.on('results:focus', function (params) {
      self.$search.attr('aria-activedescendant', params.id);
    });

    this.$selection.on('focusin', '.select2-search--inline', function (evt) {
      self.trigger('focus', evt);
    });

    this.$selection.on('focusout', '.select2-search--inline', function (evt) {
      self._handleBlur(evt);
    });

    this.$selection.on('keydown', '.select2-search--inline', function (evt) {
      evt.stopPropagation();

      self.trigger('keypress', evt);

      self._keyUpPrevented = evt.isDefaultPrevented();

      var key = evt.which;

      if (key === KEYS.BACKSPACE && self.$search.val() === '') {
        var $previousChoice = self.$searchContainer
          .prev('.select2-selection__choice');

        if ($previousChoice.length > 0) {
          var item = $previousChoice.data('data');

          self.searchRemoveChoice(item);

          evt.preventDefault();
        }
      }
    });

    // Try to detect the IE version should the `documentMode` property that
    // is stored on the document. This is only implemented in IE and is
    // slightly cleaner than doing a user agent check.
    // This property is not available in Edge, but Edge also doesn't have
    // this bug.
    var msie = document.documentMode;
    var disableInputEvents = msie && msie <= 11;

    // Workaround for browsers which do not support the `input` event
    // This will prevent double-triggering of events for browsers which support
    // both the `keyup` and `input` events.
    this.$selection.on(
      'input.searchcheck',
      '.select2-search--inline',
      function (evt) {
        // IE will trigger the `input` event when a placeholder is used on a
        // search box. To get around this issue, we are forced to ignore all
        // `input` events in IE and keep using `keyup`.
        if (disableInputEvents) {
          self.$selection.off('input.search input.searchcheck');
          return;
        }

        // Unbind the duplicated `keyup` event
        self.$selection.off('keyup.search');
      }
    );

    this.$selection.on(
      'keyup.search input.search',
      '.select2-search--inline',
      function (evt) {
        // IE will trigger the `input` event when a placeholder is used on a
        // search box. To get around this issue, we are forced to ignore all
        // `input` events in IE and keep using `keyup`.
        if (disableInputEvents && evt.type === 'input') {
          self.$selection.off('input.search input.searchcheck');
          return;
        }

        var key = evt.which;

        // We can freely ignore events from modifier keys
        if (key == KEYS.SHIFT || key == KEYS.CTRL || key == KEYS.ALT) {
          return;
        }

        // Tabbing will be handled during the `keydown` phase
        if (key == KEYS.TAB) {
          return;
        }

        self.handleSearch(evt);
      }
    );
  };

  /**
   * This method will transfer the tabindex attribute from the rendered
   * selection to the search box. This allows for the search box to be used as
   * the primary focus instead of the selection container.
   *
   * @private
   */
  Search.prototype._transferTabIndex = function (decorated) {
    this.$search.attr('tabindex', this.$selection.attr('tabindex'));
    this.$selection.attr('tabindex', '-1');
  };

  Search.prototype.createPlaceholder = function (decorated, placeholder) {
    this.$search.attr('placeholder', placeholder.text);
  };

  Search.prototype.update = function (decorated, data) {
    var searchHadFocus = this.$search[0] == document.activeElement;

    this.$search.attr('placeholder', '');

    decorated.call(this, data);

    this.$selection.find('.select2-selection__rendered')
                   .append(this.$searchContainer);

    this.resizeSearch();
    if (searchHadFocus) {
      this.$search.focus();
    }
  };

  Search.prototype.handleSearch = function () {
    this.resizeSearch();

    if (!this._keyUpPrevented) {
      var input = this.$search.val();

      this.trigger('query', {
        term: input
      });
    }

    this._keyUpPrevented = false;
  };

  Search.prototype.searchRemoveChoice = function (decorated, item) {
    this.trigger('unselect', {
      data: item
    });

    this.$search.val(item.text);
    this.handleSearch();
  };

  Search.prototype.resizeSearch = function () {
    this.$search.css('width', '25px');

    var width = '';

    if (this.$search.attr('placeholder') !== '') {
      width = this.$selection.find('.select2-selection__rendered').innerWidth();
    } else {
      var minimumWidth = this.$search.val().length + 1;

      width = (minimumWidth * 0.75) + 'em';
    }

    this.$search.css('width', width);
  };

  return Search;
});

S2.define('select2/selection/eventRelay',[
  'jquery'
], function ($) {
  function EventRelay () { }

  EventRelay.prototype.bind = function (decorated, container, $container) {
    var self = this;
    var relayEvents = [
      'open', 'opening',
      'close', 'closing',
      'select', 'selecting',
      'unselect', 'unselecting'
    ];

    var preventableEvents = ['opening', 'closing', 'selecting', 'unselecting'];

    decorated.call(this, container, $container);

    container.on('*', function (name, params) {
      // Ignore events that should not be relayed
      if ($.inArray(name, relayEvents) === -1) {
        return;
      }

      // The parameters should always be an object
      params = params || {};

      // Generate the jQuery event for the Select2 event
      var evt = $.Event('select2:' + name, {
        params: params
      });

      self.$element.trigger(evt);

      // Only handle preventable events if it was one
      if ($.inArray(name, preventableEvents) === -1) {
        return;
      }

      params.prevented = evt.isDefaultPrevented();
    });
  };

  return EventRelay;
});

S2.define('select2/translation',[
  'jquery',
  'require'
], function ($, require) {
  function Translation (dict) {
    this.dict = dict || {};
  }

  Translation.prototype.all = function () {
    return this.dict;
  };

  Translation.prototype.get = function (key) {
    return this.dict[key];
  };

  Translation.prototype.extend = function (translation) {
    this.dict = $.extend({}, translation.all(), this.dict);
  };

  // Static functions

  Translation._cache = {};

  Translation.loadPath = function (path) {
    if (!(path in Translation._cache)) {
      var translations = require(path);

      Translation._cache[path] = translations;
    }

    return new Translation(Translation._cache[path]);
  };

  return Translation;
});

S2.define('select2/diacritics',[

], function () {
  var diacritics = {
    '\u24B6': 'A',
    '\uFF21': 'A',
    '\u00C0': 'A',
    '\u00C1': 'A',
    '\u00C2': 'A',
    '\u1EA6': 'A',
    '\u1EA4': 'A',
    '\u1EAA': 'A',
    '\u1EA8': 'A',
    '\u00C3': 'A',
    '\u0100': 'A',
    '\u0102': 'A',
    '\u1EB0': 'A',
    '\u1EAE': 'A',
    '\u1EB4': 'A',
    '\u1EB2': 'A',
    '\u0226': 'A',
    '\u01E0': 'A',
    '\u00C4': 'A',
    '\u01DE': 'A',
    '\u1EA2': 'A',
    '\u00C5': 'A',
    '\u01FA': 'A',
    '\u01CD': 'A',
    '\u0200': 'A',
    '\u0202': 'A',
    '\u1EA0': 'A',
    '\u1EAC': 'A',
    '\u1EB6': 'A',
    '\u1E00': 'A',
    '\u0104': 'A',
    '\u023A': 'A',
    '\u2C6F': 'A',
    '\uA732': 'AA',
    '\u00C6': 'AE',
    '\u01FC': 'AE',
    '\u01E2': 'AE',
    '\uA734': 'AO',
    '\uA736': 'AU',
    '\uA738': 'AV',
    '\uA73A': 'AV',
    '\uA73C': 'AY',
    '\u24B7': 'B',
    '\uFF22': 'B',
    '\u1E02': 'B',
    '\u1E04': 'B',
    '\u1E06': 'B',
    '\u0243': 'B',
    '\u0182': 'B',
    '\u0181': 'B',
    '\u24B8': 'C',
    '\uFF23': 'C',
    '\u0106': 'C',
    '\u0108': 'C',
    '\u010A': 'C',
    '\u010C': 'C',
    '\u00C7': 'C',
    '\u1E08': 'C',
    '\u0187': 'C',
    '\u023B': 'C',
    '\uA73E': 'C',
    '\u24B9': 'D',
    '\uFF24': 'D',
    '\u1E0A': 'D',
    '\u010E': 'D',
    '\u1E0C': 'D',
    '\u1E10': 'D',
    '\u1E12': 'D',
    '\u1E0E': 'D',
    '\u0110': 'D',
    '\u018B': 'D',
    '\u018A': 'D',
    '\u0189': 'D',
    '\uA779': 'D',
    '\u01F1': 'DZ',
    '\u01C4': 'DZ',
    '\u01F2': 'Dz',
    '\u01C5': 'Dz',
    '\u24BA': 'E',
    '\uFF25': 'E',
    '\u00C8': 'E',
    '\u00C9': 'E',
    '\u00CA': 'E',
    '\u1EC0': 'E',
    '\u1EBE': 'E',
    '\u1EC4': 'E',
    '\u1EC2': 'E',
    '\u1EBC': 'E',
    '\u0112': 'E',
    '\u1E14': 'E',
    '\u1E16': 'E',
    '\u0114': 'E',
    '\u0116': 'E',
    '\u00CB': 'E',
    '\u1EBA': 'E',
    '\u011A': 'E',
    '\u0204': 'E',
    '\u0206': 'E',
    '\u1EB8': 'E',
    '\u1EC6': 'E',
    '\u0228': 'E',
    '\u1E1C': 'E',
    '\u0118': 'E',
    '\u1E18': 'E',
    '\u1E1A': 'E',
    '\u0190': 'E',
    '\u018E': 'E',
    '\u24BB': 'F',
    '\uFF26': 'F',
    '\u1E1E': 'F',
    '\u0191': 'F',
    '\uA77B': 'F',
    '\u24BC': 'G',
    '\uFF27': 'G',
    '\u01F4': 'G',
    '\u011C': 'G',
    '\u1E20': 'G',
    '\u011E': 'G',
    '\u0120': 'G',
    '\u01E6': 'G',
    '\u0122': 'G',
    '\u01E4': 'G',
    '\u0193': 'G',
    '\uA7A0': 'G',
    '\uA77D': 'G',
    '\uA77E': 'G',
    '\u24BD': 'H',
    '\uFF28': 'H',
    '\u0124': 'H',
    '\u1E22': 'H',
    '\u1E26': 'H',
    '\u021E': 'H',
    '\u1E24': 'H',
    '\u1E28': 'H',
    '\u1E2A': 'H',
    '\u0126': 'H',
    '\u2C67': 'H',
    '\u2C75': 'H',
    '\uA78D': 'H',
    '\u24BE': 'I',
    '\uFF29': 'I',
    '\u00CC': 'I',
    '\u00CD': 'I',
    '\u00CE': 'I',
    '\u0128': 'I',
    '\u012A': 'I',
    '\u012C': 'I',
    '\u0130': 'I',
    '\u00CF': 'I',
    '\u1E2E': 'I',
    '\u1EC8': 'I',
    '\u01CF': 'I',
    '\u0208': 'I',
    '\u020A': 'I',
    '\u1ECA': 'I',
    '\u012E': 'I',
    '\u1E2C': 'I',
    '\u0197': 'I',
    '\u24BF': 'J',
    '\uFF2A': 'J',
    '\u0134': 'J',
    '\u0248': 'J',
    '\u24C0': 'K',
    '\uFF2B': 'K',
    '\u1E30': 'K',
    '\u01E8': 'K',
    '\u1E32': 'K',
    '\u0136': 'K',
    '\u1E34': 'K',
    '\u0198': 'K',
    '\u2C69': 'K',
    '\uA740': 'K',
    '\uA742': 'K',
    '\uA744': 'K',
    '\uA7A2': 'K',
    '\u24C1': 'L',
    '\uFF2C': 'L',
    '\u013F': 'L',
    '\u0139': 'L',
    '\u013D': 'L',
    '\u1E36': 'L',
    '\u1E38': 'L',
    '\u013B': 'L',
    '\u1E3C': 'L',
    '\u1E3A': 'L',
    '\u0141': 'L',
    '\u023D': 'L',
    '\u2C62': 'L',
    '\u2C60': 'L',
    '\uA748': 'L',
    '\uA746': 'L',
    '\uA780': 'L',
    '\u01C7': 'LJ',
    '\u01C8': 'Lj',
    '\u24C2': 'M',
    '\uFF2D': 'M',
    '\u1E3E': 'M',
    '\u1E40': 'M',
    '\u1E42': 'M',
    '\u2C6E': 'M',
    '\u019C': 'M',
    '\u24C3': 'N',
    '\uFF2E': 'N',
    '\u01F8': 'N',
    '\u0143': 'N',
    '\u00D1': 'N',
    '\u1E44': 'N',
    '\u0147': 'N',
    '\u1E46': 'N',
    '\u0145': 'N',
    '\u1E4A': 'N',
    '\u1E48': 'N',
    '\u0220': 'N',
    '\u019D': 'N',
    '\uA790': 'N',
    '\uA7A4': 'N',
    '\u01CA': 'NJ',
    '\u01CB': 'Nj',
    '\u24C4': 'O',
    '\uFF2F': 'O',
    '\u00D2': 'O',
    '\u00D3': 'O',
    '\u00D4': 'O',
    '\u1ED2': 'O',
    '\u1ED0': 'O',
    '\u1ED6': 'O',
    '\u1ED4': 'O',
    '\u00D5': 'O',
    '\u1E4C': 'O',
    '\u022C': 'O',
    '\u1E4E': 'O',
    '\u014C': 'O',
    '\u1E50': 'O',
    '\u1E52': 'O',
    '\u014E': 'O',
    '\u022E': 'O',
    '\u0230': 'O',
    '\u00D6': 'O',
    '\u022A': 'O',
    '\u1ECE': 'O',
    '\u0150': 'O',
    '\u01D1': 'O',
    '\u020C': 'O',
    '\u020E': 'O',
    '\u01A0': 'O',
    '\u1EDC': 'O',
    '\u1EDA': 'O',
    '\u1EE0': 'O',
    '\u1EDE': 'O',
    '\u1EE2': 'O',
    '\u1ECC': 'O',
    '\u1ED8': 'O',
    '\u01EA': 'O',
    '\u01EC': 'O',
    '\u00D8': 'O',
    '\u01FE': 'O',
    '\u0186': 'O',
    '\u019F': 'O',
    '\uA74A': 'O',
    '\uA74C': 'O',
    '\u01A2': 'OI',
    '\uA74E': 'OO',
    '\u0222': 'OU',
    '\u24C5': 'P',
    '\uFF30': 'P',
    '\u1E54': 'P',
    '\u1E56': 'P',
    '\u01A4': 'P',
    '\u2C63': 'P',
    '\uA750': 'P',
    '\uA752': 'P',
    '\uA754': 'P',
    '\u24C6': 'Q',
    '\uFF31': 'Q',
    '\uA756': 'Q',
    '\uA758': 'Q',
    '\u024A': 'Q',
    '\u24C7': 'R',
    '\uFF32': 'R',
    '\u0154': 'R',
    '\u1E58': 'R',
    '\u0158': 'R',
    '\u0210': 'R',
    '\u0212': 'R',
    '\u1E5A': 'R',
    '\u1E5C': 'R',
    '\u0156': 'R',
    '\u1E5E': 'R',
    '\u024C': 'R',
    '\u2C64': 'R',
    '\uA75A': 'R',
    '\uA7A6': 'R',
    '\uA782': 'R',
    '\u24C8': 'S',
    '\uFF33': 'S',
    '\u1E9E': 'S',
    '\u015A': 'S',
    '\u1E64': 'S',
    '\u015C': 'S',
    '\u1E60': 'S',
    '\u0160': 'S',
    '\u1E66': 'S',
    '\u1E62': 'S',
    '\u1E68': 'S',
    '\u0218': 'S',
    '\u015E': 'S',
    '\u2C7E': 'S',
    '\uA7A8': 'S',
    '\uA784': 'S',
    '\u24C9': 'T',
    '\uFF34': 'T',
    '\u1E6A': 'T',
    '\u0164': 'T',
    '\u1E6C': 'T',
    '\u021A': 'T',
    '\u0162': 'T',
    '\u1E70': 'T',
    '\u1E6E': 'T',
    '\u0166': 'T',
    '\u01AC': 'T',
    '\u01AE': 'T',
    '\u023E': 'T',
    '\uA786': 'T',
    '\uA728': 'TZ',
    '\u24CA': 'U',
    '\uFF35': 'U',
    '\u00D9': 'U',
    '\u00DA': 'U',
    '\u00DB': 'U',
    '\u0168': 'U',
    '\u1E78': 'U',
    '\u016A': 'U',
    '\u1E7A': 'U',
    '\u016C': 'U',
    '\u00DC': 'U',
    '\u01DB': 'U',
    '\u01D7': 'U',
    '\u01D5': 'U',
    '\u01D9': 'U',
    '\u1EE6': 'U',
    '\u016E': 'U',
    '\u0170': 'U',
    '\u01D3': 'U',
    '\u0214': 'U',
    '\u0216': 'U',
    '\u01AF': 'U',
    '\u1EEA': 'U',
    '\u1EE8': 'U',
    '\u1EEE': 'U',
    '\u1EEC': 'U',
    '\u1EF0': 'U',
    '\u1EE4': 'U',
    '\u1E72': 'U',
    '\u0172': 'U',
    '\u1E76': 'U',
    '\u1E74': 'U',
    '\u0244': 'U',
    '\u24CB': 'V',
    '\uFF36': 'V',
    '\u1E7C': 'V',
    '\u1E7E': 'V',
    '\u01B2': 'V',
    '\uA75E': 'V',
    '\u0245': 'V',
    '\uA760': 'VY',
    '\u24CC': 'W',
    '\uFF37': 'W',
    '\u1E80': 'W',
    '\u1E82': 'W',
    '\u0174': 'W',
    '\u1E86': 'W',
    '\u1E84': 'W',
    '\u1E88': 'W',
    '\u2C72': 'W',
    '\u24CD': 'X',
    '\uFF38': 'X',
    '\u1E8A': 'X',
    '\u1E8C': 'X',
    '\u24CE': 'Y',
    '\uFF39': 'Y',
    '\u1EF2': 'Y',
    '\u00DD': 'Y',
    '\u0176': 'Y',
    '\u1EF8': 'Y',
    '\u0232': 'Y',
    '\u1E8E': 'Y',
    '\u0178': 'Y',
    '\u1EF6': 'Y',
    '\u1EF4': 'Y',
    '\u01B3': 'Y',
    '\u024E': 'Y',
    '\u1EFE': 'Y',
    '\u24CF': 'Z',
    '\uFF3A': 'Z',
    '\u0179': 'Z',
    '\u1E90': 'Z',
    '\u017B': 'Z',
    '\u017D': 'Z',
    '\u1E92': 'Z',
    '\u1E94': 'Z',
    '\u01B5': 'Z',
    '\u0224': 'Z',
    '\u2C7F': 'Z',
    '\u2C6B': 'Z',
    '\uA762': 'Z',
    '\u24D0': 'a',
    '\uFF41': 'a',
    '\u1E9A': 'a',
    '\u00E0': 'a',
    '\u00E1': 'a',
    '\u00E2': 'a',
    '\u1EA7': 'a',
    '\u1EA5': 'a',
    '\u1EAB': 'a',
    '\u1EA9': 'a',
    '\u00E3': 'a',
    '\u0101': 'a',
    '\u0103': 'a',
    '\u1EB1': 'a',
    '\u1EAF': 'a',
    '\u1EB5': 'a',
    '\u1EB3': 'a',
    '\u0227': 'a',
    '\u01E1': 'a',
    '\u00E4': 'a',
    '\u01DF': 'a',
    '\u1EA3': 'a',
    '\u00E5': 'a',
    '\u01FB': 'a',
    '\u01CE': 'a',
    '\u0201': 'a',
    '\u0203': 'a',
    '\u1EA1': 'a',
    '\u1EAD': 'a',
    '\u1EB7': 'a',
    '\u1E01': 'a',
    '\u0105': 'a',
    '\u2C65': 'a',
    '\u0250': 'a',
    '\uA733': 'aa',
    '\u00E6': 'ae',
    '\u01FD': 'ae',
    '\u01E3': 'ae',
    '\uA735': 'ao',
    '\uA737': 'au',
    '\uA739': 'av',
    '\uA73B': 'av',
    '\uA73D': 'ay',
    '\u24D1': 'b',
    '\uFF42': 'b',
    '\u1E03': 'b',
    '\u1E05': 'b',
    '\u1E07': 'b',
    '\u0180': 'b',
    '\u0183': 'b',
    '\u0253': 'b',
    '\u24D2': 'c',
    '\uFF43': 'c',
    '\u0107': 'c',
    '\u0109': 'c',
    '\u010B': 'c',
    '\u010D': 'c',
    '\u00E7': 'c',
    '\u1E09': 'c',
    '\u0188': 'c',
    '\u023C': 'c',
    '\uA73F': 'c',
    '\u2184': 'c',
    '\u24D3': 'd',
    '\uFF44': 'd',
    '\u1E0B': 'd',
    '\u010F': 'd',
    '\u1E0D': 'd',
    '\u1E11': 'd',
    '\u1E13': 'd',
    '\u1E0F': 'd',
    '\u0111': 'd',
    '\u018C': 'd',
    '\u0256': 'd',
    '\u0257': 'd',
    '\uA77A': 'd',
    '\u01F3': 'dz',
    '\u01C6': 'dz',
    '\u24D4': 'e',
    '\uFF45': 'e',
    '\u00E8': 'e',
    '\u00E9': 'e',
    '\u00EA': 'e',
    '\u1EC1': 'e',
    '\u1EBF': 'e',
    '\u1EC5': 'e',
    '\u1EC3': 'e',
    '\u1EBD': 'e',
    '\u0113': 'e',
    '\u1E15': 'e',
    '\u1E17': 'e',
    '\u0115': 'e',
    '\u0117': 'e',
    '\u00EB': 'e',
    '\u1EBB': 'e',
    '\u011B': 'e',
    '\u0205': 'e',
    '\u0207': 'e',
    '\u1EB9': 'e',
    '\u1EC7': 'e',
    '\u0229': 'e',
    '\u1E1D': 'e',
    '\u0119': 'e',
    '\u1E19': 'e',
    '\u1E1B': 'e',
    '\u0247': 'e',
    '\u025B': 'e',
    '\u01DD': 'e',
    '\u24D5': 'f',
    '\uFF46': 'f',
    '\u1E1F': 'f',
    '\u0192': 'f',
    '\uA77C': 'f',
    '\u24D6': 'g',
    '\uFF47': 'g',
    '\u01F5': 'g',
    '\u011D': 'g',
    '\u1E21': 'g',
    '\u011F': 'g',
    '\u0121': 'g',
    '\u01E7': 'g',
    '\u0123': 'g',
    '\u01E5': 'g',
    '\u0260': 'g',
    '\uA7A1': 'g',
    '\u1D79': 'g',
    '\uA77F': 'g',
    '\u24D7': 'h',
    '\uFF48': 'h',
    '\u0125': 'h',
    '\u1E23': 'h',
    '\u1E27': 'h',
    '\u021F': 'h',
    '\u1E25': 'h',
    '\u1E29': 'h',
    '\u1E2B': 'h',
    '\u1E96': 'h',
    '\u0127': 'h',
    '\u2C68': 'h',
    '\u2C76': 'h',
    '\u0265': 'h',
    '\u0195': 'hv',
    '\u24D8': 'i',
    '\uFF49': 'i',
    '\u00EC': 'i',
    '\u00ED': 'i',
    '\u00EE': 'i',
    '\u0129': 'i',
    '\u012B': 'i',
    '\u012D': 'i',
    '\u00EF': 'i',
    '\u1E2F': 'i',
    '\u1EC9': 'i',
    '\u01D0': 'i',
    '\u0209': 'i',
    '\u020B': 'i',
    '\u1ECB': 'i',
    '\u012F': 'i',
    '\u1E2D': 'i',
    '\u0268': 'i',
    '\u0131': 'i',
    '\u24D9': 'j',
    '\uFF4A': 'j',
    '\u0135': 'j',
    '\u01F0': 'j',
    '\u0249': 'j',
    '\u24DA': 'k',
    '\uFF4B': 'k',
    '\u1E31': 'k',
    '\u01E9': 'k',
    '\u1E33': 'k',
    '\u0137': 'k',
    '\u1E35': 'k',
    '\u0199': 'k',
    '\u2C6A': 'k',
    '\uA741': 'k',
    '\uA743': 'k',
    '\uA745': 'k',
    '\uA7A3': 'k',
    '\u24DB': 'l',
    '\uFF4C': 'l',
    '\u0140': 'l',
    '\u013A': 'l',
    '\u013E': 'l',
    '\u1E37': 'l',
    '\u1E39': 'l',
    '\u013C': 'l',
    '\u1E3D': 'l',
    '\u1E3B': 'l',
    '\u017F': 'l',
    '\u0142': 'l',
    '\u019A': 'l',
    '\u026B': 'l',
    '\u2C61': 'l',
    '\uA749': 'l',
    '\uA781': 'l',
    '\uA747': 'l',
    '\u01C9': 'lj',
    '\u24DC': 'm',
    '\uFF4D': 'm',
    '\u1E3F': 'm',
    '\u1E41': 'm',
    '\u1E43': 'm',
    '\u0271': 'm',
    '\u026F': 'm',
    '\u24DD': 'n',
    '\uFF4E': 'n',
    '\u01F9': 'n',
    '\u0144': 'n',
    '\u00F1': 'n',
    '\u1E45': 'n',
    '\u0148': 'n',
    '\u1E47': 'n',
    '\u0146': 'n',
    '\u1E4B': 'n',
    '\u1E49': 'n',
    '\u019E': 'n',
    '\u0272': 'n',
    '\u0149': 'n',
    '\uA791': 'n',
    '\uA7A5': 'n',
    '\u01CC': 'nj',
    '\u24DE': 'o',
    '\uFF4F': 'o',
    '\u00F2': 'o',
    '\u00F3': 'o',
    '\u00F4': 'o',
    '\u1ED3': 'o',
    '\u1ED1': 'o',
    '\u1ED7': 'o',
    '\u1ED5': 'o',
    '\u00F5': 'o',
    '\u1E4D': 'o',
    '\u022D': 'o',
    '\u1E4F': 'o',
    '\u014D': 'o',
    '\u1E51': 'o',
    '\u1E53': 'o',
    '\u014F': 'o',
    '\u022F': 'o',
    '\u0231': 'o',
    '\u00F6': 'o',
    '\u022B': 'o',
    '\u1ECF': 'o',
    '\u0151': 'o',
    '\u01D2': 'o',
    '\u020D': 'o',
    '\u020F': 'o',
    '\u01A1': 'o',
    '\u1EDD': 'o',
    '\u1EDB': 'o',
    '\u1EE1': 'o',
    '\u1EDF': 'o',
    '\u1EE3': 'o',
    '\u1ECD': 'o',
    '\u1ED9': 'o',
    '\u01EB': 'o',
    '\u01ED': 'o',
    '\u00F8': 'o',
    '\u01FF': 'o',
    '\u0254': 'o',
    '\uA74B': 'o',
    '\uA74D': 'o',
    '\u0275': 'o',
    '\u01A3': 'oi',
    '\u0223': 'ou',
    '\uA74F': 'oo',
    '\u24DF': 'p',
    '\uFF50': 'p',
    '\u1E55': 'p',
    '\u1E57': 'p',
    '\u01A5': 'p',
    '\u1D7D': 'p',
    '\uA751': 'p',
    '\uA753': 'p',
    '\uA755': 'p',
    '\u24E0': 'q',
    '\uFF51': 'q',
    '\u024B': 'q',
    '\uA757': 'q',
    '\uA759': 'q',
    '\u24E1': 'r',
    '\uFF52': 'r',
    '\u0155': 'r',
    '\u1E59': 'r',
    '\u0159': 'r',
    '\u0211': 'r',
    '\u0213': 'r',
    '\u1E5B': 'r',
    '\u1E5D': 'r',
    '\u0157': 'r',
    '\u1E5F': 'r',
    '\u024D': 'r',
    '\u027D': 'r',
    '\uA75B': 'r',
    '\uA7A7': 'r',
    '\uA783': 'r',
    '\u24E2': 's',
    '\uFF53': 's',
    '\u00DF': 's',
    '\u015B': 's',
    '\u1E65': 's',
    '\u015D': 's',
    '\u1E61': 's',
    '\u0161': 's',
    '\u1E67': 's',
    '\u1E63': 's',
    '\u1E69': 's',
    '\u0219': 's',
    '\u015F': 's',
    '\u023F': 's',
    '\uA7A9': 's',
    '\uA785': 's',
    '\u1E9B': 's',
    '\u24E3': 't',
    '\uFF54': 't',
    '\u1E6B': 't',
    '\u1E97': 't',
    '\u0165': 't',
    '\u1E6D': 't',
    '\u021B': 't',
    '\u0163': 't',
    '\u1E71': 't',
    '\u1E6F': 't',
    '\u0167': 't',
    '\u01AD': 't',
    '\u0288': 't',
    '\u2C66': 't',
    '\uA787': 't',
    '\uA729': 'tz',
    '\u24E4': 'u',
    '\uFF55': 'u',
    '\u00F9': 'u',
    '\u00FA': 'u',
    '\u00FB': 'u',
    '\u0169': 'u',
    '\u1E79': 'u',
    '\u016B': 'u',
    '\u1E7B': 'u',
    '\u016D': 'u',
    '\u00FC': 'u',
    '\u01DC': 'u',
    '\u01D8': 'u',
    '\u01D6': 'u',
    '\u01DA': 'u',
    '\u1EE7': 'u',
    '\u016F': 'u',
    '\u0171': 'u',
    '\u01D4': 'u',
    '\u0215': 'u',
    '\u0217': 'u',
    '\u01B0': 'u',
    '\u1EEB': 'u',
    '\u1EE9': 'u',
    '\u1EEF': 'u',
    '\u1EED': 'u',
    '\u1EF1': 'u',
    '\u1EE5': 'u',
    '\u1E73': 'u',
    '\u0173': 'u',
    '\u1E77': 'u',
    '\u1E75': 'u',
    '\u0289': 'u',
    '\u24E5': 'v',
    '\uFF56': 'v',
    '\u1E7D': 'v',
    '\u1E7F': 'v',
    '\u028B': 'v',
    '\uA75F': 'v',
    '\u028C': 'v',
    '\uA761': 'vy',
    '\u24E6': 'w',
    '\uFF57': 'w',
    '\u1E81': 'w',
    '\u1E83': 'w',
    '\u0175': 'w',
    '\u1E87': 'w',
    '\u1E85': 'w',
    '\u1E98': 'w',
    '\u1E89': 'w',
    '\u2C73': 'w',
    '\u24E7': 'x',
    '\uFF58': 'x',
    '\u1E8B': 'x',
    '\u1E8D': 'x',
    '\u24E8': 'y',
    '\uFF59': 'y',
    '\u1EF3': 'y',
    '\u00FD': 'y',
    '\u0177': 'y',
    '\u1EF9': 'y',
    '\u0233': 'y',
    '\u1E8F': 'y',
    '\u00FF': 'y',
    '\u1EF7': 'y',
    '\u1E99': 'y',
    '\u1EF5': 'y',
    '\u01B4': 'y',
    '\u024F': 'y',
    '\u1EFF': 'y',
    '\u24E9': 'z',
    '\uFF5A': 'z',
    '\u017A': 'z',
    '\u1E91': 'z',
    '\u017C': 'z',
    '\u017E': 'z',
    '\u1E93': 'z',
    '\u1E95': 'z',
    '\u01B6': 'z',
    '\u0225': 'z',
    '\u0240': 'z',
    '\u2C6C': 'z',
    '\uA763': 'z',
    '\u0386': '\u0391',
    '\u0388': '\u0395',
    '\u0389': '\u0397',
    '\u038A': '\u0399',
    '\u03AA': '\u0399',
    '\u038C': '\u039F',
    '\u038E': '\u03A5',
    '\u03AB': '\u03A5',
    '\u038F': '\u03A9',
    '\u03AC': '\u03B1',
    '\u03AD': '\u03B5',
    '\u03AE': '\u03B7',
    '\u03AF': '\u03B9',
    '\u03CA': '\u03B9',
    '\u0390': '\u03B9',
    '\u03CC': '\u03BF',
    '\u03CD': '\u03C5',
    '\u03CB': '\u03C5',
    '\u03B0': '\u03C5',
    '\u03C9': '\u03C9',
    '\u03C2': '\u03C3'
  };

  return diacritics;
});

S2.define('select2/data/base',[
  '../utils'
], function (Utils) {
  function BaseAdapter ($element, options) {
    BaseAdapter.__super__.constructor.call(this);
  }

  Utils.Extend(BaseAdapter, Utils.Observable);

  BaseAdapter.prototype.current = function (callback) {
    throw new Error('The `current` method must be defined in child classes.');
  };

  BaseAdapter.prototype.query = function (params, callback) {
    throw new Error('The `query` method must be defined in child classes.');
  };

  BaseAdapter.prototype.bind = function (container, $container) {
    // Can be implemented in subclasses
  };

  BaseAdapter.prototype.destroy = function () {
    // Can be implemented in subclasses
  };

  BaseAdapter.prototype.generateResultId = function (container, data) {
    var id = container.id + '-result-';

    id += Utils.generateChars(4);

    if (data.id != null) {
      id += '-' + data.id.toString();
    } else {
      id += '-' + Utils.generateChars(4);
    }
    return id;
  };

  return BaseAdapter;
});

S2.define('select2/data/select',[
  './base',
  '../utils',
  'jquery'
], function (BaseAdapter, Utils, $) {
  function SelectAdapter ($element, options) {
    this.$element = $element;
    this.options = options;

    SelectAdapter.__super__.constructor.call(this);
  }

  Utils.Extend(SelectAdapter, BaseAdapter);

  SelectAdapter.prototype.current = function (callback) {
    var data = [];
    var self = this;

    this.$element.find(':selected').each(function () {
      var $option = $(this);

      var option = self.item($option);

      data.push(option);
    });

    callback(data);
  };

  SelectAdapter.prototype.select = function (data) {
    var self = this;

    data.selected = true;

    // If data.element is a DOM node, use it instead
    if ($(data.element).is('option')) {
      data.element.selected = true;

      this.$element.trigger('change');

      return;
    }

    if (this.$element.prop('multiple')) {
      this.current(function (currentData) {
        var val = [];

        data = [data];
        data.push.apply(data, currentData);

        for (var d = 0; d < data.length; d++) {
          var id = data[d].id;

          if ($.inArray(id, val) === -1) {
            val.push(id);
          }
        }

        self.$element.val(val);
        self.$element.trigger('change');
      });
    } else {
      var val = data.id;

      this.$element.val(val);
      this.$element.trigger('change');
    }
  };

  SelectAdapter.prototype.unselect = function (data) {
    var self = this;

    if (!this.$element.prop('multiple')) {
      return;
    }

    data.selected = false;

    if ($(data.element).is('option')) {
      data.element.selected = false;

      this.$element.trigger('change');

      return;
    }

    this.current(function (currentData) {
      var val = [];

      for (var d = 0; d < currentData.length; d++) {
        var id = currentData[d].id;

        if (id !== data.id && $.inArray(id, val) === -1) {
          val.push(id);
        }
      }

      self.$element.val(val);

      self.$element.trigger('change');
    });
  };

  SelectAdapter.prototype.bind = function (container, $container) {
    var self = this;

    this.container = container;

    container.on('select', function (params) {
      self.select(params.data);
    });

    container.on('unselect', function (params) {
      self.unselect(params.data);
    });
  };

  SelectAdapter.prototype.destroy = function () {
    // Remove anything added to child elements
    this.$element.find('*').each(function () {
      // Remove any custom data set by Select2
      $.removeData(this, 'data');
    });
  };

  SelectAdapter.prototype.query = function (params, callback) {
    var data = [];
    var self = this;

    var $options = this.$element.children();

    $options.each(function () {
      var $option = $(this);

      if (!$option.is('option') && !$option.is('optgroup')) {
        return;
      }

      var option = self.item($option);

      var matches = self.matches(params, option);

      if (matches !== null) {
        data.push(matches);
      }
    });

    callback({
      results: data
    });
  };

  SelectAdapter.prototype.addOptions = function ($options) {
    Utils.appendMany(this.$element, $options);
  };

  SelectAdapter.prototype.option = function (data) {
    var option;

    if (data.children) {
      option = document.createElement('optgroup');
      option.label = data.text;
    } else {
      option = document.createElement('option');

      if (option.textContent !== undefined) {
        option.textContent = data.text;
      } else {
        option.innerText = data.text;
      }
    }

    if (data.id) {
      option.value = data.id;
    }

    if (data.disabled) {
      option.disabled = true;
    }

    if (data.selected) {
      option.selected = true;
    }

    if (data.title) {
      option.title = data.title;
    }

    var $option = $(option);

    var normalizedData = this._normalizeItem(data);
    normalizedData.element = option;

    // Override the option's data with the combined data
    $.data(option, 'data', normalizedData);

    return $option;
  };

  SelectAdapter.prototype.item = function ($option) {
    var data = {};

    data = $.data($option[0], 'data');

    if (data != null) {
      return data;
    }

    if ($option.is('option')) {
      data = {
        id: $option.val(),
        text: $option.text(),
        disabled: $option.prop('disabled'),
        selected: $option.prop('selected'),
        title: $option.prop('title')
      };
    } else if ($option.is('optgroup')) {
      data = {
        text: $option.prop('label'),
        children: [],
        title: $option.prop('title')
      };

      var $children = $option.children('option');
      var children = [];

      for (var c = 0; c < $children.length; c++) {
        var $child = $($children[c]);

        var child = this.item($child);

        children.push(child);
      }

      data.children = children;
    }

    data = this._normalizeItem(data);
    data.element = $option[0];

    $.data($option[0], 'data', data);

    return data;
  };

  SelectAdapter.prototype._normalizeItem = function (item) {
    if (!$.isPlainObject(item)) {
      item = {
        id: item,
        text: item
      };
    }

    item = $.extend({}, {
      text: ''
    }, item);

    var defaults = {
      selected: false,
      disabled: false
    };

    if (item.id != null) {
      item.id = item.id.toString();
    }

    if (item.text != null) {
      item.text = item.text.toString();
    }

    if (item._resultId == null && item.id && this.container != null) {
      item._resultId = this.generateResultId(this.container, item);
    }

    return $.extend({}, defaults, item);
  };

  SelectAdapter.prototype.matches = function (params, data) {
    var matcher = this.options.get('matcher');

    return matcher(params, data);
  };

  return SelectAdapter;
});

S2.define('select2/data/array',[
  './select',
  '../utils',
  'jquery'
], function (SelectAdapter, Utils, $) {
  function ArrayAdapter ($element, options) {
    var data = options.get('data') || [];

    ArrayAdapter.__super__.constructor.call(this, $element, options);

    this.addOptions(this.convertToOptions(data));
  }

  Utils.Extend(ArrayAdapter, SelectAdapter);

  ArrayAdapter.prototype.select = function (data) {
    var $option = this.$element.find('option').filter(function (i, elm) {
      return elm.value == data.id.toString();
    });

    if ($option.length === 0) {
      $option = this.option(data);

      this.addOptions($option);
    }

    ArrayAdapter.__super__.select.call(this, data);
  };

  ArrayAdapter.prototype.convertToOptions = function (data) {
    var self = this;

    var $existing = this.$element.find('option');
    var existingIds = $existing.map(function () {
      return self.item($(this)).id;
    }).get();

    var $options = [];

    // Filter out all items except for the one passed in the argument
    function onlyItem (item) {
      return function () {
        return $(this).val() == item.id;
      };
    }

    for (var d = 0; d < data.length; d++) {
      var item = this._normalizeItem(data[d]);

      // Skip items which were pre-loaded, only merge the data
      if ($.inArray(item.id, existingIds) >= 0) {
        var $existingOption = $existing.filter(onlyItem(item));

        var existingData = this.item($existingOption);
        var newData = $.extend(true, {}, item, existingData);

        var $newOption = this.option(newData);

        $existingOption.replaceWith($newOption);

        continue;
      }

      var $option = this.option(item);

      if (item.children) {
        var $children = this.convertToOptions(item.children);

        Utils.appendMany($option, $children);
      }

      $options.push($option);
    }

    return $options;
  };

  return ArrayAdapter;
});

S2.define('select2/data/ajax',[
  './array',
  '../utils',
  'jquery'
], function (ArrayAdapter, Utils, $) {
  function AjaxAdapter ($element, options) {
    this.ajaxOptions = this._applyDefaults(options.get('ajax'));

    if (this.ajaxOptions.processResults != null) {
      this.processResults = this.ajaxOptions.processResults;
    }

    AjaxAdapter.__super__.constructor.call(this, $element, options);
  }

  Utils.Extend(AjaxAdapter, ArrayAdapter);

  AjaxAdapter.prototype._applyDefaults = function (options) {
    var defaults = {
      data: function (params) {
        return $.extend({}, params, {
          q: params.term
        });
      },
      transport: function (params, success, failure) {
        var $request = $.ajax(params);

        $request.then(success);
        $request.fail(failure);

        return $request;
      }
    };

    return $.extend({}, defaults, options, true);
  };

  AjaxAdapter.prototype.processResults = function (results) {
    return results;
  };

  AjaxAdapter.prototype.query = function (params, callback) {
    var matches = [];
    var self = this;

    if (this._request != null) {
      // JSONP requests cannot always be aborted
      if ($.isFunction(this._request.abort)) {
        this._request.abort();
      }

      this._request = null;
    }

    var options = $.extend({
      type: 'GET'
    }, this.ajaxOptions);

    if (typeof options.url === 'function') {
      options.url = options.url.call(this.$element, params);
    }

    if (typeof options.data === 'function') {
      options.data = options.data.call(this.$element, params);
    }

    function request () {
      var $request = options.transport(options, function (data) {
        var results = self.processResults(data, params);

        if (self.options.get('debug') && window.console && console.error) {
          // Check to make sure that the response included a `results` key.
          if (!results || !results.results || !$.isArray(results.results)) {
            console.error(
              'Select2: The AJAX results did not return an array in the ' +
              '`results` key of the response.'
            );
          }
        }

        callback(results);
      }, function () {
        // Attempt to detect if a request was aborted
        // Only works if the transport exposes a status property
        if ($request.status && $request.status === '0') {
          return;
        }

        self.trigger('results:message', {
          message: 'errorLoading'
        });
      });

      self._request = $request;
    }

    if (this.ajaxOptions.delay && params.term != null) {
      if (this._queryTimeout) {
        window.clearTimeout(this._queryTimeout);
      }

      this._queryTimeout = window.setTimeout(request, this.ajaxOptions.delay);
    } else {
      request();
    }
  };

  return AjaxAdapter;
});

S2.define('select2/data/tags',[
  'jquery'
], function ($) {
  function Tags (decorated, $element, options) {
    var tags = options.get('tags');

    var createTag = options.get('createTag');

    if (createTag !== undefined) {
      this.createTag = createTag;
    }

    var insertTag = options.get('insertTag');

    if (insertTag !== undefined) {
        this.insertTag = insertTag;
    }

    decorated.call(this, $element, options);

    if ($.isArray(tags)) {
      for (var t = 0; t < tags.length; t++) {
        var tag = tags[t];
        var item = this._normalizeItem(tag);

        var $option = this.option(item);

        this.$element.append($option);
      }
    }
  }

  Tags.prototype.query = function (decorated, params, callback) {
    var self = this;

    this._removeOldTags();

    if (params.term == null || params.page != null) {
      decorated.call(this, params, callback);
      return;
    }

    function wrapper (obj, child) {
      var data = obj.results;

      for (var i = 0; i < data.length; i++) {
        var option = data[i];

        var checkChildren = (
          option.children != null &&
          !wrapper({
            results: option.children
          }, true)
        );

        var checkText = option.text === params.term;

        if (checkText || checkChildren) {
          if (child) {
            return false;
          }

          obj.data = data;
          callback(obj);

          return;
        }
      }

      if (child) {
        return true;
      }

      var tag = self.createTag(params);

      if (tag != null) {
        var $option = self.option(tag);
        $option.attr('data-select2-tag', true);

        self.addOptions([$option]);

        self.insertTag(data, tag);
      }

      obj.results = data;

      callback(obj);
    }

    decorated.call(this, params, wrapper);
  };

  Tags.prototype.createTag = function (decorated, params) {
    var term = $.trim(params.term);

    if (term === '') {
      return null;
    }

    return {
      id: term,
      text: term
    };
  };

  Tags.prototype.insertTag = function (_, data, tag) {
    data.unshift(tag);
  };

  Tags.prototype._removeOldTags = function (_) {
    var tag = this._lastTag;

    var $options = this.$element.find('option[data-select2-tag]');

    $options.each(function () {
      if (this.selected) {
        return;
      }

      $(this).remove();
    });
  };

  return Tags;
});

S2.define('select2/data/tokenizer',[
  'jquery'
], function ($) {
  function Tokenizer (decorated, $element, options) {
    var tokenizer = options.get('tokenizer');

    if (tokenizer !== undefined) {
      this.tokenizer = tokenizer;
    }

    decorated.call(this, $element, options);
  }

  Tokenizer.prototype.bind = function (decorated, container, $container) {
    decorated.call(this, container, $container);

    this.$search =  container.dropdown.$search || container.selection.$search ||
      $container.find('.select2-search__field');
  };

  Tokenizer.prototype.query = function (decorated, params, callback) {
    var self = this;

    function createAndSelect (data) {
      // Normalize the data object so we can use it for checks
      var item = self._normalizeItem(data);

      // Check if the data object already exists as a tag
      // Select it if it doesn't
      var $existingOptions = self.$element.find('option').filter(function () {
        return $(this).val() === item.id;
      });

      // If an existing option wasn't found for it, create the option
      if (!$existingOptions.length) {
        var $option = self.option(item);
        $option.attr('data-select2-tag', true);

        self._removeOldTags();
        self.addOptions([$option]);
      }

      // Select the item, now that we know there is an option for it
      select(item);
    }

    function select (data) {
      self.trigger('select', {
        data: data
      });
    }

    params.term = params.term || '';

    var tokenData = this.tokenizer(params, this.options, createAndSelect);

    if (tokenData.term !== params.term) {
      // Replace the search term if we have the search box
      if (this.$search.length) {
        this.$search.val(tokenData.term);
        this.$search.focus();
      }

      params.term = tokenData.term;
    }

    decorated.call(this, params, callback);
  };

  Tokenizer.prototype.tokenizer = function (_, params, options, callback) {
    var separators = options.get('tokenSeparators') || [];
    var term = params.term;
    var i = 0;

    var createTag = this.createTag || function (params) {
      return {
        id: params.term,
        text: params.term
      };
    };

    while (i < term.length) {
      var termChar = term[i];

      if ($.inArray(termChar, separators) === -1) {
        i++;

        continue;
      }

      var part = term.substr(0, i);
      var partParams = $.extend({}, params, {
        term: part
      });

      var data = createTag(partParams);

      if (data == null) {
        i++;
        continue;
      }

      callback(data);

      // Reset the term to not include the tokenized portion
      term = term.substr(i + 1) || '';
      i = 0;
    }

    return {
      term: term
    };
  };

  return Tokenizer;
});

S2.define('select2/data/minimumInputLength',[

], function () {
  function MinimumInputLength (decorated, $e, options) {
    this.minimumInputLength = options.get('minimumInputLength');

    decorated.call(this, $e, options);
  }

  MinimumInputLength.prototype.query = function (decorated, params, callback) {
    params.term = params.term || '';

    if (params.term.length < this.minimumInputLength) {
      this.trigger('results:message', {
        message: 'inputTooShort',
        args: {
          minimum: this.minimumInputLength,
          input: params.term,
          params: params
        }
      });

      return;
    }

    decorated.call(this, params, callback);
  };

  return MinimumInputLength;
});

S2.define('select2/data/maximumInputLength',[

], function () {
  function MaximumInputLength (decorated, $e, options) {
    this.maximumInputLength = options.get('maximumInputLength');

    decorated.call(this, $e, options);
  }

  MaximumInputLength.prototype.query = function (decorated, params, callback) {
    params.term = params.term || '';

    if (this.maximumInputLength > 0 &&
        params.term.length > this.maximumInputLength) {
      this.trigger('results:message', {
        message: 'inputTooLong',
        args: {
          maximum: this.maximumInputLength,
          input: params.term,
          params: params
        }
      });

      return;
    }

    decorated.call(this, params, callback);
  };

  return MaximumInputLength;
});

S2.define('select2/data/maximumSelectionLength',[

], function (){
  function MaximumSelectionLength (decorated, $e, options) {
    this.maximumSelectionLength = options.get('maximumSelectionLength');

    decorated.call(this, $e, options);
  }

  MaximumSelectionLength.prototype.query =
    function (decorated, params, callback) {
      var self = this;

      this.current(function (currentData) {
        var count = currentData != null ? currentData.length : 0;
        if (self.maximumSelectionLength > 0 &&
          count >= self.maximumSelectionLength) {
          self.trigger('results:message', {
            message: 'maximumSelected',
            args: {
              maximum: self.maximumSelectionLength
            }
          });
          return;
        }
        decorated.call(self, params, callback);
      });
  };

  return MaximumSelectionLength;
});

S2.define('select2/dropdown',[
  'jquery',
  './utils'
], function ($, Utils) {
  function Dropdown ($element, options) {
    this.$element = $element;
    this.options = options;

    Dropdown.__super__.constructor.call(this);
  }

  Utils.Extend(Dropdown, Utils.Observable);

  Dropdown.prototype.render = function () {
    var $dropdown = $(
      '<span class="select2-dropdown">' +
        '<span class="select2-results"></span>' +
      '</span>'
    );

    $dropdown.attr('dir', this.options.get('dir'));

    this.$dropdown = $dropdown;

    return $dropdown;
  };

  Dropdown.prototype.bind = function () {
    // Should be implemented in subclasses
  };

  Dropdown.prototype.position = function ($dropdown, $container) {
    // Should be implmented in subclasses
  };

  Dropdown.prototype.destroy = function () {
    // Remove the dropdown from the DOM
    this.$dropdown.remove();
  };

  return Dropdown;
});

S2.define('select2/dropdown/search',[
  'jquery',
  '../utils'
], function ($, Utils) {
  function Search () { }

  Search.prototype.render = function (decorated) {
    var $rendered = decorated.call(this);

    var $search = $(
      '<span class="select2-search select2-search--dropdown">' +
        '<input class="select2-search__field" type="search" tabindex="-1"' +
        ' autocomplete="off" autocorrect="off" autocapitalize="off"' +
        ' spellcheck="false" role="textbox" />' +
      '</span>'
    );

    this.$searchContainer = $search;
    this.$search = $search.find('input');

    $rendered.prepend($search);

    return $rendered;
  };

  Search.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    this.$search.on('keydown', function (evt) {
      self.trigger('keypress', evt);

      self._keyUpPrevented = evt.isDefaultPrevented();
    });

    // Workaround for browsers which do not support the `input` event
    // This will prevent double-triggering of events for browsers which support
    // both the `keyup` and `input` events.
    this.$search.on('input', function (evt) {
      // Unbind the duplicated `keyup` event
      $(this).off('keyup');
    });

    this.$search.on('keyup input', function (evt) {
      self.handleSearch(evt);
    });

    container.on('open', function () {
      self.$search.attr('tabindex', 0);

      self.$search.focus();

      window.setTimeout(function () {
        self.$search.focus();
      }, 0);
    });

    container.on('close', function () {
      self.$search.attr('tabindex', -1);

      self.$search.val('');
    });

    container.on('focus', function () {
      if (container.isOpen()) {
        self.$search.focus();
      }
    });

    container.on('results:all', function (params) {
      if (params.query.term == null || params.query.term === '') {
        var showSearch = self.showSearch(params);

        if (showSearch) {
          self.$searchContainer.removeClass('select2-search--hide');
        } else {
          self.$searchContainer.addClass('select2-search--hide');
        }
      }
    });
  };

  Search.prototype.handleSearch = function (evt) {
    if (!this._keyUpPrevented) {
      var input = this.$search.val();

      this.trigger('query', {
        term: input
      });
    }

    this._keyUpPrevented = false;
  };

  Search.prototype.showSearch = function (_, params) {
    return true;
  };

  return Search;
});

S2.define('select2/dropdown/hidePlaceholder',[

], function () {
  function HidePlaceholder (decorated, $element, options, dataAdapter) {
    this.placeholder = this.normalizePlaceholder(options.get('placeholder'));

    decorated.call(this, $element, options, dataAdapter);
  }

  HidePlaceholder.prototype.append = function (decorated, data) {
    data.results = this.removePlaceholder(data.results);

    decorated.call(this, data);
  };

  HidePlaceholder.prototype.normalizePlaceholder = function (_, placeholder) {
    if (typeof placeholder === 'string') {
      placeholder = {
        id: '',
        text: placeholder
      };
    }

    return placeholder;
  };

  HidePlaceholder.prototype.removePlaceholder = function (_, data) {
    var modifiedData = data.slice(0);

    for (var d = data.length - 1; d >= 0; d--) {
      var item = data[d];

      if (this.placeholder.id === item.id) {
        modifiedData.splice(d, 1);
      }
    }

    return modifiedData;
  };

  return HidePlaceholder;
});

S2.define('select2/dropdown/infiniteScroll',[
  'jquery'
], function ($) {
  function InfiniteScroll (decorated, $element, options, dataAdapter) {
    this.lastParams = {};

    decorated.call(this, $element, options, dataAdapter);

    this.$loadingMore = this.createLoadingMore();
    this.loading = false;
  }

  InfiniteScroll.prototype.append = function (decorated, data) {
    this.$loadingMore.remove();
    this.loading = false;

    decorated.call(this, data);

    if (this.showLoadingMore(data)) {
      this.$results.append(this.$loadingMore);
    }
  };

  InfiniteScroll.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    container.on('query', function (params) {
      self.lastParams = params;
      self.loading = true;
    });

    container.on('query:append', function (params) {
      self.lastParams = params;
      self.loading = true;
    });

    this.$results.on('scroll', function () {
      var isLoadMoreVisible = $.contains(
        document.documentElement,
        self.$loadingMore[0]
      );

      if (self.loading || !isLoadMoreVisible) {
        return;
      }

      var currentOffset = self.$results.offset().top +
        self.$results.outerHeight(false);
      var loadingMoreOffset = self.$loadingMore.offset().top +
        self.$loadingMore.outerHeight(false);

      if (currentOffset + 50 >= loadingMoreOffset) {
        self.loadMore();
      }
    });
  };

  InfiniteScroll.prototype.loadMore = function () {
    this.loading = true;

    var params = $.extend({}, {page: 1}, this.lastParams);

    params.page++;

    this.trigger('query:append', params);
  };

  InfiniteScroll.prototype.showLoadingMore = function (_, data) {
    return data.pagination && data.pagination.more;
  };

  InfiniteScroll.prototype.createLoadingMore = function () {
    var $option = $(
      '<li ' +
      'class="select2-results__option select2-results__option--load-more"' +
      'role="treeitem" aria-disabled="true"></li>'
    );

    var message = this.options.get('translations').get('loadingMore');

    $option.html(message(this.lastParams));

    return $option;
  };

  return InfiniteScroll;
});

S2.define('select2/dropdown/attachBody',[
  'jquery',
  '../utils'
], function ($, Utils) {
  function AttachBody (decorated, $element, options) {
    this.$dropdownParent = options.get('dropdownParent') || $(document.body);

    decorated.call(this, $element, options);
  }

  AttachBody.prototype.bind = function (decorated, container, $container) {
    var self = this;

    var setupResultsEvents = false;

    decorated.call(this, container, $container);

    container.on('open', function () {
      self._showDropdown();
      self._attachPositioningHandler(container);

      if (!setupResultsEvents) {
        setupResultsEvents = true;

        container.on('results:all', function () {
          self._positionDropdown();
          self._resizeDropdown();
        });

        container.on('results:append', function () {
          self._positionDropdown();
          self._resizeDropdown();
        });
      }
    });

    container.on('close', function () {
      self._hideDropdown();
      self._detachPositioningHandler(container);
    });

    this.$dropdownContainer.on('mousedown', function (evt) {
      evt.stopPropagation();
    });
  };

  AttachBody.prototype.destroy = function (decorated) {
    decorated.call(this);

    this.$dropdownContainer.remove();
  };

  AttachBody.prototype.position = function (decorated, $dropdown, $container) {
    // Clone all of the container classes
    $dropdown.attr('class', $container.attr('class'));

    $dropdown.removeClass('select2');
    $dropdown.addClass('select2-container--open');

    $dropdown.css({
      position: 'absolute',
      top: -999999
    });

    this.$container = $container;
  };

  AttachBody.prototype.render = function (decorated) {
    var $container = $('<span></span>');

    var $dropdown = decorated.call(this);
    $container.append($dropdown);

    this.$dropdownContainer = $container;

    return $container;
  };

  AttachBody.prototype._hideDropdown = function (decorated) {
    this.$dropdownContainer.detach();
  };

  AttachBody.prototype._attachPositioningHandler =
      function (decorated, container) {
    var self = this;

    var scrollEvent = 'scroll.select2.' + container.id;
    var resizeEvent = 'resize.select2.' + container.id;
    var orientationEvent = 'orientationchange.select2.' + container.id;

    var $watchers = this.$container.parents().filter(Utils.hasScroll);
    $watchers.each(function () {
      $(this).data('select2-scroll-position', {
        x: $(this).scrollLeft(),
        y: $(this).scrollTop()
      });
    });

    $watchers.on(scrollEvent, function (ev) {
      var position = $(this).data('select2-scroll-position');
      $(this).scrollTop(position.y);
    });

    $(window).on(scrollEvent + ' ' + resizeEvent + ' ' + orientationEvent,
      function (e) {
      self._positionDropdown();
      self._resizeDropdown();
    });
  };

  AttachBody.prototype._detachPositioningHandler =
      function (decorated, container) {
    var scrollEvent = 'scroll.select2.' + container.id;
    var resizeEvent = 'resize.select2.' + container.id;
    var orientationEvent = 'orientationchange.select2.' + container.id;

    var $watchers = this.$container.parents().filter(Utils.hasScroll);
    $watchers.off(scrollEvent);

    $(window).off(scrollEvent + ' ' + resizeEvent + ' ' + orientationEvent);
  };

  AttachBody.prototype._positionDropdown = function () {
    var $window = $(window);

    var isCurrentlyAbove = this.$dropdown.hasClass('select2-dropdown--above');
    var isCurrentlyBelow = this.$dropdown.hasClass('select2-dropdown--below');

    var newDirection = null;

    var offset = this.$container.offset();

    offset.bottom = offset.top + this.$container.outerHeight(false);

    var container = {
      height: this.$container.outerHeight(false)
    };

    container.top = offset.top;
    container.bottom = offset.top + container.height;

    var dropdown = {
      height: this.$dropdown.outerHeight(false)
    };

    var viewport = {
      top: $window.scrollTop(),
      bottom: $window.scrollTop() + $window.height()
    };

    var enoughRoomAbove = viewport.top < (offset.top - dropdown.height);
    var enoughRoomBelow = viewport.bottom > (offset.bottom + dropdown.height);

    var css = {
      left: offset.left,
      top: container.bottom
    };

    // Determine what the parent element is to use for calciulating the offset
    var $offsetParent = this.$dropdownParent;

    // For statically positoned elements, we need to get the element
    // that is determining the offset
    if ($offsetParent.css('position') === 'static') {
      $offsetParent = $offsetParent.offsetParent();
    }

    var parentOffset = $offsetParent.offset();

    css.top -= parentOffset.top;
    css.left -= parentOffset.left;

    if (!isCurrentlyAbove && !isCurrentlyBelow) {
      newDirection = 'below';
    }

    if (!enoughRoomBelow && enoughRoomAbove && !isCurrentlyAbove) {
      newDirection = 'above';
    } else if (!enoughRoomAbove && enoughRoomBelow && isCurrentlyAbove) {
      newDirection = 'below';
    }

    if (newDirection == 'above' ||
      (isCurrentlyAbove && newDirection !== 'below')) {
      css.top = container.top - parentOffset.top - dropdown.height;
    }

    if (newDirection != null) {
      this.$dropdown
        .removeClass('select2-dropdown--below select2-dropdown--above')
        .addClass('select2-dropdown--' + newDirection);
      this.$container
        .removeClass('select2-container--below select2-container--above')
        .addClass('select2-container--' + newDirection);
    }

    this.$dropdownContainer.css(css);
  };

  AttachBody.prototype._resizeDropdown = function () {
    var css = {
      width: this.$container.outerWidth(false) + 'px'
    };

    if (this.options.get('dropdownAutoWidth')) {
      css.minWidth = css.width;
      css.position = 'relative';
      css.width = 'auto';
    }

    this.$dropdown.css(css);
  };

  AttachBody.prototype._showDropdown = function (decorated) {
    this.$dropdownContainer.appendTo(this.$dropdownParent);

    this._positionDropdown();
    this._resizeDropdown();
  };

  return AttachBody;
});

S2.define('select2/dropdown/minimumResultsForSearch',[

], function () {
  function countResults (data) {
    var count = 0;

    for (var d = 0; d < data.length; d++) {
      var item = data[d];

      if (item.children) {
        count += countResults(item.children);
      } else {
        count++;
      }
    }

    return count;
  }

  function MinimumResultsForSearch (decorated, $element, options, dataAdapter) {
    this.minimumResultsForSearch = options.get('minimumResultsForSearch');

    if (this.minimumResultsForSearch < 0) {
      this.minimumResultsForSearch = Infinity;
    }

    decorated.call(this, $element, options, dataAdapter);
  }

  MinimumResultsForSearch.prototype.showSearch = function (decorated, params) {
    if (countResults(params.data.results) < this.minimumResultsForSearch) {
      return false;
    }

    return decorated.call(this, params);
  };

  return MinimumResultsForSearch;
});

S2.define('select2/dropdown/selectOnClose',[

], function () {
  function SelectOnClose () { }

  SelectOnClose.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    container.on('close', function (params) {
      self._handleSelectOnClose(params);
    });
  };

  SelectOnClose.prototype._handleSelectOnClose = function (_, params) {
    if (params && params.originalSelect2Event != null) {
      var event = params.originalSelect2Event;

      // Don't select an item if the close event was triggered from a select or
      // unselect event
      if (event._type === 'select' || event._type === 'unselect') {
        return;
      }
    }

    var $highlightedResults = this.getHighlightedResults();

    // Only select highlighted results
    if ($highlightedResults.length < 1) {
      return;
    }

    var data = $highlightedResults.data('data');

    // Don't re-select already selected resulte
    if (
      (data.element != null && data.element.selected) ||
      (data.element == null && data.selected)
    ) {
      return;
    }

    this.trigger('select', {
        data: data
    });
  };

  return SelectOnClose;
});

S2.define('select2/dropdown/closeOnSelect',[

], function () {
  function CloseOnSelect () { }

  CloseOnSelect.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    container.on('select', function (evt) {
      self._selectTriggered(evt);
    });

    container.on('unselect', function (evt) {
      self._selectTriggered(evt);
    });
  };

  CloseOnSelect.prototype._selectTriggered = function (_, evt) {
    var originalEvent = evt.originalEvent;

    // Don't close if the control key is being held
    if (originalEvent && originalEvent.ctrlKey) {
      return;
    }

    this.trigger('close', {
      originalEvent: originalEvent,
      originalSelect2Event: evt
    });
  };

  return CloseOnSelect;
});

S2.define('select2/i18n/en',[],function () {
  // English
  return {
    errorLoading: function () {
      return 'The results could not be loaded.';
    },
    inputTooLong: function (args) {
      var overChars = args.input.length - args.maximum;

      var message = 'Please delete ' + overChars + ' character';

      if (overChars != 1) {
        message += 's';
      }

      return message;
    },
    inputTooShort: function (args) {
      var remainingChars = args.minimum - args.input.length;

      var message = 'Please enter ' + remainingChars + ' or more characters';

      return message;
    },
    loadingMore: function () {
      return 'Loading more results…';
    },
    maximumSelected: function (args) {
      var message = 'You can only select ' + args.maximum + ' item';

      if (args.maximum != 1) {
        message += 's';
      }

      return message;
    },
    noResults: function () {
      return 'No results found';
    },
    searching: function () {
      return 'Searching…';
    }
  };
});

S2.define('select2/defaults',[
  'jquery',
  'require',

  './results',

  './selection/single',
  './selection/multiple',
  './selection/placeholder',
  './selection/allowClear',
  './selection/search',
  './selection/eventRelay',

  './utils',
  './translation',
  './diacritics',

  './data/select',
  './data/array',
  './data/ajax',
  './data/tags',
  './data/tokenizer',
  './data/minimumInputLength',
  './data/maximumInputLength',
  './data/maximumSelectionLength',

  './dropdown',
  './dropdown/search',
  './dropdown/hidePlaceholder',
  './dropdown/infiniteScroll',
  './dropdown/attachBody',
  './dropdown/minimumResultsForSearch',
  './dropdown/selectOnClose',
  './dropdown/closeOnSelect',

  './i18n/en'
], function ($, require,

             ResultsList,

             SingleSelection, MultipleSelection, Placeholder, AllowClear,
             SelectionSearch, EventRelay,

             Utils, Translation, DIACRITICS,

             SelectData, ArrayData, AjaxData, Tags, Tokenizer,
             MinimumInputLength, MaximumInputLength, MaximumSelectionLength,

             Dropdown, DropdownSearch, HidePlaceholder, InfiniteScroll,
             AttachBody, MinimumResultsForSearch, SelectOnClose, CloseOnSelect,

             EnglishTranslation) {
  function Defaults () {
    this.reset();
  }

  Defaults.prototype.apply = function (options) {
    options = $.extend(true, {}, this.defaults, options);

    if (options.dataAdapter == null) {
      if (options.ajax != null) {
        options.dataAdapter = AjaxData;
      } else if (options.data != null) {
        options.dataAdapter = ArrayData;
      } else {
        options.dataAdapter = SelectData;
      }

      if (options.minimumInputLength > 0) {
        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          MinimumInputLength
        );
      }

      if (options.maximumInputLength > 0) {
        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          MaximumInputLength
        );
      }

      if (options.maximumSelectionLength > 0) {
        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          MaximumSelectionLength
        );
      }

      if (options.tags) {
        options.dataAdapter = Utils.Decorate(options.dataAdapter, Tags);
      }

      if (options.tokenSeparators != null || options.tokenizer != null) {
        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          Tokenizer
        );
      }

      if (options.query != null) {
        var Query = require(options.amdBase + 'compat/query');

        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          Query
        );
      }

      if (options.initSelection != null) {
        var InitSelection = require(options.amdBase + 'compat/initSelection');

        options.dataAdapter = Utils.Decorate(
          options.dataAdapter,
          InitSelection
        );
      }
    }

    if (options.resultsAdapter == null) {
      options.resultsAdapter = ResultsList;

      if (options.ajax != null) {
        options.resultsAdapter = Utils.Decorate(
          options.resultsAdapter,
          InfiniteScroll
        );
      }

      if (options.placeholder != null) {
        options.resultsAdapter = Utils.Decorate(
          options.resultsAdapter,
          HidePlaceholder
        );
      }

      if (options.selectOnClose) {
        options.resultsAdapter = Utils.Decorate(
          options.resultsAdapter,
          SelectOnClose
        );
      }
    }

    if (options.dropdownAdapter == null) {
      if (options.multiple) {
        options.dropdownAdapter = Dropdown;
      } else {
        var SearchableDropdown = Utils.Decorate(Dropdown, DropdownSearch);

        options.dropdownAdapter = SearchableDropdown;
      }

      if (options.minimumResultsForSearch !== 0) {
        options.dropdownAdapter = Utils.Decorate(
          options.dropdownAdapter,
          MinimumResultsForSearch
        );
      }

      if (options.closeOnSelect) {
        options.dropdownAdapter = Utils.Decorate(
          options.dropdownAdapter,
          CloseOnSelect
        );
      }

      if (
        options.dropdownCssClass != null ||
        options.dropdownCss != null ||
        options.adaptDropdownCssClass != null
      ) {
        var DropdownCSS = require(options.amdBase + 'compat/dropdownCss');

        options.dropdownAdapter = Utils.Decorate(
          options.dropdownAdapter,
          DropdownCSS
        );
      }

      options.dropdownAdapter = Utils.Decorate(
        options.dropdownAdapter,
        AttachBody
      );
    }

    if (options.selectionAdapter == null) {
      if (options.multiple) {
        options.selectionAdapter = MultipleSelection;
      } else {
        options.selectionAdapter = SingleSelection;
      }

      // Add the placeholder mixin if a placeholder was specified
      if (options.placeholder != null) {
        options.selectionAdapter = Utils.Decorate(
          options.selectionAdapter,
          Placeholder
        );
      }

      if (options.allowClear) {
        options.selectionAdapter = Utils.Decorate(
          options.selectionAdapter,
          AllowClear
        );
      }

      if (options.multiple) {
        options.selectionAdapter = Utils.Decorate(
          options.selectionAdapter,
          SelectionSearch
        );
      }

      if (
        options.containerCssClass != null ||
        options.containerCss != null ||
        options.adaptContainerCssClass != null
      ) {
        var ContainerCSS = require(options.amdBase + 'compat/containerCss');

        options.selectionAdapter = Utils.Decorate(
          options.selectionAdapter,
          ContainerCSS
        );
      }

      options.selectionAdapter = Utils.Decorate(
        options.selectionAdapter,
        EventRelay
      );
    }

    if (typeof options.language === 'string') {
      // Check if the language is specified with a region
      if (options.language.indexOf('-') > 0) {
        // Extract the region information if it is included
        var languageParts = options.language.split('-');
        var baseLanguage = languageParts[0];

        options.language = [options.language, baseLanguage];
      } else {
        options.language = [options.language];
      }
    }

    if ($.isArray(options.language)) {
      var languages = new Translation();
      options.language.push('en');

      var languageNames = options.language;

      for (var l = 0; l < languageNames.length; l++) {
        var name = languageNames[l];
        var language = {};

        try {
          // Try to load it with the original name
          language = Translation.loadPath(name);
        } catch (e) {
          try {
            // If we couldn't load it, check if it wasn't the full path
            name = this.defaults.amdLanguageBase + name;
            language = Translation.loadPath(name);
          } catch (ex) {
            // The translation could not be loaded at all. Sometimes this is
            // because of a configuration problem, other times this can be
            // because of how Select2 helps load all possible translation files.
            if (options.debug && window.console && console.warn) {
              console.warn(
                'Select2: The language file for "' + name + '" could not be ' +
                'automatically loaded. A fallback will be used instead.'
              );
            }

            continue;
          }
        }

        languages.extend(language);
      }

      options.translations = languages;
    } else {
      var baseTranslation = Translation.loadPath(
        this.defaults.amdLanguageBase + 'en'
      );
      var customTranslation = new Translation(options.language);

      customTranslation.extend(baseTranslation);

      options.translations = customTranslation;
    }

    return options;
  };

  Defaults.prototype.reset = function () {
    function stripDiacritics (text) {
      // Used 'uni range + named function' from http://jsperf.com/diacritics/18
      function match(a) {
        return DIACRITICS[a] || a;
      }

      return text.replace(/[^\u0000-\u007E]/g, match);
    }

    function matcher (params, data) {
      // Always return the object if there is nothing to compare
      if ($.trim(params.term) === '') {
        return data;
      }

      // Do a recursive check for options with children
      if (data.children && data.children.length > 0) {
        // Clone the data object if there are children
        // This is required as we modify the object to remove any non-matches
        var match = $.extend(true, {}, data);

        // Check each child of the option
        for (var c = data.children.length - 1; c >= 0; c--) {
          var child = data.children[c];

          var matches = matcher(params, child);

          // If there wasn't a match, remove the object in the array
          if (matches == null) {
            match.children.splice(c, 1);
          }
        }

        // If any children matched, return the new object
        if (match.children.length > 0) {
          return match;
        }

        // If there were no matching children, check just the plain object
        return matcher(params, match);
      }

      var original = stripDiacritics(data.text).toUpperCase();
      var term = stripDiacritics(params.term).toUpperCase();

      // Check if the text contains the term
      if (original.indexOf(term) > -1) {
        return data;
      }

      // If it doesn't contain the term, don't return anything
      return null;
    }

    this.defaults = {
      amdBase: './',
      amdLanguageBase: './i18n/',
      closeOnSelect: true,
      debug: false,
      dropdownAutoWidth: false,
      escapeMarkup: Utils.escapeMarkup,
      language: EnglishTranslation,
      matcher: matcher,
      minimumInputLength: 0,
      maximumInputLength: 0,
      maximumSelectionLength: 0,
      minimumResultsForSearch: 0,
      selectOnClose: false,
      sorter: function (data) {
        return data;
      },
      templateResult: function (result) {
        return result.text;
      },
      templateSelection: function (selection) {
        return selection.text;
      },
      theme: 'default',
      width: 'resolve'
    };
  };

  Defaults.prototype.set = function (key, value) {
    var camelKey = $.camelCase(key);

    var data = {};
    data[camelKey] = value;

    var convertedData = Utils._convertData(data);

    $.extend(this.defaults, convertedData);
  };

  var defaults = new Defaults();

  return defaults;
});

S2.define('select2/options',[
  'require',
  'jquery',
  './defaults',
  './utils'
], function (require, $, Defaults, Utils) {
  function Options (options, $element) {
    this.options = options;

    if ($element != null) {
      this.fromElement($element);
    }

    this.options = Defaults.apply(this.options);

    if ($element && $element.is('input')) {
      var InputCompat = require(this.get('amdBase') + 'compat/inputData');

      this.options.dataAdapter = Utils.Decorate(
        this.options.dataAdapter,
        InputCompat
      );
    }
  }

  Options.prototype.fromElement = function ($e) {
    var excludedData = ['select2'];

    if (this.options.multiple == null) {
      this.options.multiple = $e.prop('multiple');
    }

    if (this.options.disabled == null) {
      this.options.disabled = $e.prop('disabled');
    }

    if (this.options.language == null) {
      if ($e.prop('lang')) {
        this.options.language = $e.prop('lang').toLowerCase();
      } else if ($e.closest('[lang]').prop('lang')) {
        this.options.language = $e.closest('[lang]').prop('lang');
      }
    }

    if (this.options.dir == null) {
      if ($e.prop('dir')) {
        this.options.dir = $e.prop('dir');
      } else if ($e.closest('[dir]').prop('dir')) {
        this.options.dir = $e.closest('[dir]').prop('dir');
      } else {
        this.options.dir = 'ltr';
      }
    }

    $e.prop('disabled', this.options.disabled);
    $e.prop('multiple', this.options.multiple);

    if ($e.data('select2Tags')) {
      if (this.options.debug && window.console && console.warn) {
        console.warn(
          'Select2: The `data-select2-tags` attribute has been changed to ' +
          'use the `data-data` and `data-tags="true"` attributes and will be ' +
          'removed in future versions of Select2.'
        );
      }

      $e.data('data', $e.data('select2Tags'));
      $e.data('tags', true);
    }

    if ($e.data('ajaxUrl')) {
      if (this.options.debug && window.console && console.warn) {
        console.warn(
          'Select2: The `data-ajax-url` attribute has been changed to ' +
          '`data-ajax--url` and support for the old attribute will be removed' +
          ' in future versions of Select2.'
        );
      }

      $e.attr('ajax--url', $e.data('ajaxUrl'));
      $e.data('ajax--url', $e.data('ajaxUrl'));
    }

    var dataset = {};

    // Prefer the element's `dataset` attribute if it exists
    // jQuery 1.x does not correctly handle data attributes with multiple dashes
    if ($.fn.jquery && $.fn.jquery.substr(0, 2) == '1.' && $e[0].dataset) {
      dataset = $.extend(true, {}, $e[0].dataset, $e.data());
    } else {
      dataset = $e.data();
    }

    var data = $.extend(true, {}, dataset);

    data = Utils._convertData(data);

    for (var key in data) {
      if ($.inArray(key, excludedData) > -1) {
        continue;
      }

      if ($.isPlainObject(this.options[key])) {
        $.extend(this.options[key], data[key]);
      } else {
        this.options[key] = data[key];
      }
    }

    return this;
  };

  Options.prototype.get = function (key) {
    return this.options[key];
  };

  Options.prototype.set = function (key, val) {
    this.options[key] = val;
  };

  return Options;
});

S2.define('select2/core',[
  'jquery',
  './options',
  './utils',
  './keys'
], function ($, Options, Utils, KEYS) {
  var Select2 = function ($element, options) {
    if ($element.data('select2') != null) {
      $element.data('select2').destroy();
    }

    this.$element = $element;

    this.id = this._generateId($element);

    options = options || {};

    this.options = new Options(options, $element);

    Select2.__super__.constructor.call(this);

    // Set up the tabindex

    var tabindex = $element.attr('tabindex') || 0;
    $element.data('old-tabindex', tabindex);
    $element.attr('tabindex', '-1');

    // Set up containers and adapters

    var DataAdapter = this.options.get('dataAdapter');
    this.dataAdapter = new DataAdapter($element, this.options);

    var $container = this.render();

    this._placeContainer($container);

    var SelectionAdapter = this.options.get('selectionAdapter');
    this.selection = new SelectionAdapter($element, this.options);
    this.$selection = this.selection.render();

    this.selection.position(this.$selection, $container);

    var DropdownAdapter = this.options.get('dropdownAdapter');
    this.dropdown = new DropdownAdapter($element, this.options);
    this.$dropdown = this.dropdown.render();

    this.dropdown.position(this.$dropdown, $container);

    var ResultsAdapter = this.options.get('resultsAdapter');
    this.results = new ResultsAdapter($element, this.options, this.dataAdapter);
    this.$results = this.results.render();

    this.results.position(this.$results, this.$dropdown);

    // Bind events

    var self = this;

    // Bind the container to all of the adapters
    this._bindAdapters();

    // Register any DOM event handlers
    this._registerDomEvents();

    // Register any internal event handlers
    this._registerDataEvents();
    this._registerSelectionEvents();
    this._registerDropdownEvents();
    this._registerResultsEvents();
    this._registerEvents();

    // Set the initial state
    this.dataAdapter.current(function (initialData) {
      self.trigger('selection:update', {
        data: initialData
      });
    });

    // Hide the original select
    $element.addClass('select2-hidden-accessible');
    $element.attr('aria-hidden', 'true');

    // Synchronize any monitored attributes
    this._syncAttributes();

    $element.data('select2', this);
  };

  Utils.Extend(Select2, Utils.Observable);

  Select2.prototype._generateId = function ($element) {
    var id = '';

    if ($element.attr('id') != null) {
      id = $element.attr('id');
    } else if ($element.attr('name') != null) {
      id = $element.attr('name') + '-' + Utils.generateChars(2);
    } else {
      id = Utils.generateChars(4);
    }

    id = id.replace(/(:|\.|\[|\]|,)/g, '');
    id = 'select2-' + id;

    return id;
  };

  Select2.prototype._placeContainer = function ($container) {
    $container.insertAfter(this.$element);

    var width = this._resolveWidth(this.$element, this.options.get('width'));

    if (width != null) {
      $container.css('width', width);
    }
  };

  Select2.prototype._resolveWidth = function ($element, method) {
    var WIDTH = /^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i;

    if (method == 'resolve') {
      var styleWidth = this._resolveWidth($element, 'style');

      if (styleWidth != null) {
        return styleWidth;
      }

      return this._resolveWidth($element, 'element');
    }

    if (method == 'element') {
      var elementWidth = $element.outerWidth(false);

      if (elementWidth <= 0) {
        return 'auto';
      }

      return elementWidth + 'px';
    }

    if (method == 'style') {
      var style = $element.attr('style');

      if (typeof(style) !== 'string') {
        return null;
      }

      var attrs = style.split(';');

      for (var i = 0, l = attrs.length; i < l; i = i + 1) {
        var attr = attrs[i].replace(/\s/g, '');
        var matches = attr.match(WIDTH);

        if (matches !== null && matches.length >= 1) {
          return matches[1];
        }
      }

      return null;
    }

    return method;
  };

  Select2.prototype._bindAdapters = function () {
    this.dataAdapter.bind(this, this.$container);
    this.selection.bind(this, this.$container);

    this.dropdown.bind(this, this.$container);
    this.results.bind(this, this.$container);
  };

  Select2.prototype._registerDomEvents = function () {
    var self = this;

    this.$element.on('change.select2', function () {
      self.dataAdapter.current(function (data) {
        self.trigger('selection:update', {
          data: data
        });
      });
    });

    this.$element.on('focus.select2', function (evt) {
      self.trigger('focus', evt);
    });

    this._syncA = Utils.bind(this._syncAttributes, this);
    this._syncS = Utils.bind(this._syncSubtree, this);

    if (this.$element[0].attachEvent) {
      this.$element[0].attachEvent('onpropertychange', this._syncA);
    }

    var observer = window.MutationObserver ||
      window.WebKitMutationObserver ||
      window.MozMutationObserver
    ;

    if (observer != null) {
      this._observer = new observer(function (mutations) {
        $.each(mutations, self._syncA);
        $.each(mutations, self._syncS);
      });
      this._observer.observe(this.$element[0], {
        attributes: true,
        childList: true,
        subtree: false
      });
    } else if (this.$element[0].addEventListener) {
      this.$element[0].addEventListener(
        'DOMAttrModified',
        self._syncA,
        false
      );
      this.$element[0].addEventListener(
        'DOMNodeInserted',
        self._syncS,
        false
      );
      this.$element[0].addEventListener(
        'DOMNodeRemoved',
        self._syncS,
        false
      );
    }
  };

  Select2.prototype._registerDataEvents = function () {
    var self = this;

    this.dataAdapter.on('*', function (name, params) {
      self.trigger(name, params);
    });
  };

  Select2.prototype._registerSelectionEvents = function () {
    var self = this;
    var nonRelayEvents = ['toggle', 'focus'];

    this.selection.on('toggle', function () {
      self.toggleDropdown();
    });

    this.selection.on('focus', function (params) {
      self.focus(params);
    });

    this.selection.on('*', function (name, params) {
      if ($.inArray(name, nonRelayEvents) !== -1) {
        return;
      }

      self.trigger(name, params);
    });
  };

  Select2.prototype._registerDropdownEvents = function () {
    var self = this;

    this.dropdown.on('*', function (name, params) {
      self.trigger(name, params);
    });
  };

  Select2.prototype._registerResultsEvents = function () {
    var self = this;

    this.results.on('*', function (name, params) {
      self.trigger(name, params);
    });
  };

  Select2.prototype._registerEvents = function () {
    var self = this;

    this.on('open', function () {
      self.$container.addClass('select2-container--open');
    });

    this.on('close', function () {
      self.$container.removeClass('select2-container--open');
    });

    this.on('enable', function () {
      self.$container.removeClass('select2-container--disabled');
    });

    this.on('disable', function () {
      self.$container.addClass('select2-container--disabled');
    });

    this.on('blur', function () {
      self.$container.removeClass('select2-container--focus');
    });

    this.on('query', function (params) {
      if (!self.isOpen()) {
        self.trigger('open', {});
      }

      this.dataAdapter.query(params, function (data) {
        self.trigger('results:all', {
          data: data,
          query: params
        });
      });
    });

    this.on('query:append', function (params) {
      this.dataAdapter.query(params, function (data) {
        self.trigger('results:append', {
          data: data,
          query: params
        });
      });
    });

    this.on('keypress', function (evt) {
      var key = evt.which;

      if (self.isOpen()) {
        if (key === KEYS.ESC || key === KEYS.TAB ||
            (key === KEYS.UP && evt.altKey)) {
          self.close();

          evt.preventDefault();
        } else if (key === KEYS.ENTER) {
          self.trigger('results:select', {});

          evt.preventDefault();
        } else if ((key === KEYS.SPACE && evt.ctrlKey)) {
          self.trigger('results:toggle', {});

          evt.preventDefault();
        } else if (key === KEYS.UP) {
          self.trigger('results:previous', {});

          evt.preventDefault();
        } else if (key === KEYS.DOWN) {
          self.trigger('results:next', {});

          evt.preventDefault();
        }
      } else {
        if (key === KEYS.ENTER || key === KEYS.SPACE ||
            (key === KEYS.DOWN && evt.altKey)) {
          self.open();

          evt.preventDefault();
        }
      }
    });
  };

  Select2.prototype._syncAttributes = function () {
    this.options.set('disabled', this.$element.prop('disabled'));

    if (this.options.get('disabled')) {
      if (this.isOpen()) {
        this.close();
      }

      this.trigger('disable', {});
    } else {
      this.trigger('enable', {});
    }
  };

  Select2.prototype._syncSubtree = function (evt, mutations) {
    var changed = false;
    var self = this;

    // Ignore any mutation events raised for elements that aren't options or
    // optgroups. This handles the case when the select element is destroyed
    if (
      evt && evt.target && (
        evt.target.nodeName !== 'OPTION' && evt.target.nodeName !== 'OPTGROUP'
      )
    ) {
      return;
    }

    if (!mutations) {
      // If mutation events aren't supported, then we can only assume that the
      // change affected the selections
      changed = true;
    } else if (mutations.addedNodes && mutations.addedNodes.length > 0) {
      for (var n = 0; n < mutations.addedNodes.length; n++) {
        var node = mutations.addedNodes[n];

        if (node.selected) {
          changed = true;
        }
      }
    } else if (mutations.removedNodes && mutations.removedNodes.length > 0) {
      changed = true;
    }

    // Only re-pull the data if we think there is a change
    if (changed) {
      this.dataAdapter.current(function (currentData) {
        self.trigger('selection:update', {
          data: currentData
        });
      });
    }
  };

  /**
   * Override the trigger method to automatically trigger pre-events when
   * there are events that can be prevented.
   */
  Select2.prototype.trigger = function (name, args) {
    var actualTrigger = Select2.__super__.trigger;
    var preTriggerMap = {
      'open': 'opening',
      'close': 'closing',
      'select': 'selecting',
      'unselect': 'unselecting'
    };

    if (args === undefined) {
      args = {};
    }

    if (name in preTriggerMap) {
      var preTriggerName = preTriggerMap[name];
      var preTriggerArgs = {
        prevented: false,
        name: name,
        args: args
      };

      actualTrigger.call(this, preTriggerName, preTriggerArgs);

      if (preTriggerArgs.prevented) {
        args.prevented = true;

        return;
      }
    }

    actualTrigger.call(this, name, args);
  };

  Select2.prototype.toggleDropdown = function () {
    if (this.options.get('disabled')) {
      return;
    }

    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  };

  Select2.prototype.open = function () {
    if (this.isOpen()) {
      return;
    }

    this.trigger('query', {});
  };

  Select2.prototype.close = function () {
    if (!this.isOpen()) {
      return;
    }

    this.trigger('close', {});
  };

  Select2.prototype.isOpen = function () {
    return this.$container.hasClass('select2-container--open');
  };

  Select2.prototype.hasFocus = function () {
    return this.$container.hasClass('select2-container--focus');
  };

  Select2.prototype.focus = function (data) {
    // No need to re-trigger focus events if we are already focused
    if (this.hasFocus()) {
      return;
    }

    this.$container.addClass('select2-container--focus');
    this.trigger('focus', {});
  };

  Select2.prototype.enable = function (args) {
    if (this.options.get('debug') && window.console && console.warn) {
      console.warn(
        'Select2: The `select2("enable")` method has been deprecated and will' +
        ' be removed in later Select2 versions. Use $element.prop("disabled")' +
        ' instead.'
      );
    }

    if (args == null || args.length === 0) {
      args = [true];
    }

    var disabled = !args[0];

    this.$element.prop('disabled', disabled);
  };

  Select2.prototype.data = function () {
    if (this.options.get('debug') &&
        arguments.length > 0 && window.console && console.warn) {
      console.warn(
        'Select2: Data can no longer be set using `select2("data")`. You ' +
        'should consider setting the value instead using `$element.val()`.'
      );
    }

    var data = [];

    this.dataAdapter.current(function (currentData) {
      data = currentData;
    });

    return data;
  };

  Select2.prototype.val = function (args) {
    if (this.options.get('debug') && window.console && console.warn) {
      console.warn(
        'Select2: The `select2("val")` method has been deprecated and will be' +
        ' removed in later Select2 versions. Use $element.val() instead.'
      );
    }

    if (args == null || args.length === 0) {
      return this.$element.val();
    }

    var newVal = args[0];

    if ($.isArray(newVal)) {
      newVal = $.map(newVal, function (obj) {
        return obj.toString();
      });
    }

    this.$element.val(newVal).trigger('change');
  };

  Select2.prototype.destroy = function () {
    this.$container.remove();

    if (this.$element[0].detachEvent) {
      this.$element[0].detachEvent('onpropertychange', this._syncA);
    }

    if (this._observer != null) {
      this._observer.disconnect();
      this._observer = null;
    } else if (this.$element[0].removeEventListener) {
      this.$element[0]
        .removeEventListener('DOMAttrModified', this._syncA, false);
      this.$element[0]
        .removeEventListener('DOMNodeInserted', this._syncS, false);
      this.$element[0]
        .removeEventListener('DOMNodeRemoved', this._syncS, false);
    }

    this._syncA = null;
    this._syncS = null;

    this.$element.off('.select2');
    this.$element.attr('tabindex', this.$element.data('old-tabindex'));

    this.$element.removeClass('select2-hidden-accessible');
    this.$element.attr('aria-hidden', 'false');
    this.$element.removeData('select2');

    this.dataAdapter.destroy();
    this.selection.destroy();
    this.dropdown.destroy();
    this.results.destroy();

    this.dataAdapter = null;
    this.selection = null;
    this.dropdown = null;
    this.results = null;
  };

  Select2.prototype.render = function () {
    var $container = $(
      '<span class="select2 select2-container">' +
        '<span class="selection"></span>' +
        '<span class="dropdown-wrapper" aria-hidden="true"></span>' +
      '</span>'
    );

    $container.attr('dir', this.options.get('dir'));

    this.$container = $container;

    this.$container.addClass('select2-container--' + this.options.get('theme'));

    $container.data('element', this.$element);

    return $container;
  };

  return Select2;
});

S2.define('jquery-mousewheel',[
  'jquery'
], function ($) {
  // Used to shim jQuery.mousewheel for non-full builds.
  return $;
});

S2.define('jquery.select2',[
  'jquery',
  'jquery-mousewheel',

  './select2/core',
  './select2/defaults'
], function ($, _, Select2, Defaults) {
  if ($.fn.select2 == null) {
    // All methods that should return the element
    var thisMethods = ['open', 'close', 'destroy'];

    $.fn.select2 = function (options) {
      options = options || {};

      if (typeof options === 'object') {
        this.each(function () {
          var instanceOptions = $.extend(true, {}, options);

          var instance = new Select2($(this), instanceOptions);
        });

        return this;
      } else if (typeof options === 'string') {
        var ret;
        var args = Array.prototype.slice.call(arguments, 1);

        this.each(function () {
          var instance = $(this).data('select2');

          if (instance == null && window.console && console.error) {
            console.error(
              'The select2(\'' + options + '\') method was called on an ' +
              'element that is not using Select2.'
            );
          }

          ret = instance[options].apply(instance, args);
        });

        // Check if we should be returning `this`
        if ($.inArray(options, thisMethods) > -1) {
          return this;
        }

        return ret;
      } else {
        throw new Error('Invalid arguments for Select2: ' + options);
      }
    };
  }

  if ($.fn.select2.defaults == null) {
    $.fn.select2.defaults = Defaults;
  }

  return Select2;
});

  // Return the AMD loader configuration so it can be used outside of this file
  return {
    define: S2.define,
    require: S2.require
  };
}());

  // Autoload the jQuery bindings
  // We know that all of the modules exist above this, so we're safe
  var select2 = S2.require('jquery.select2');

  // Hold the AMD module references on the jQuery function that was just loaded
  // This allows Select2 to use the internal loader outside of this file, such
  // as in the language files.
  jQuery.fn.select2.amd = S2;

  // Return the Select2 instance for anyone who is importing it.
  return select2;
}));


/*! 
 * ================== auxin/js/libs/perfect-scrollbar/perfect-scrollbar.js =================== 
 **/ 

/*!
 * perfect-scrollbar v1.1.0
 * (c) 2017 Hyunje Jun
 * @license MIT
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.PerfectScrollbar = factory());
}(this, (function () { 'use strict';

function get(element) {
  return getComputedStyle(element);
}

function set(element, obj) {
  for (var key in obj) {
    var val = obj[key];
    if (typeof val === 'number') {
      val = val + "px";
    }
    element.style[key] = val;
  }
  return element;
}

function div(className) {
  var div = document.createElement('div');
  div.className = className;
  return div;
}

var elMatches =
  Element.prototype.matches ||
  Element.prototype.webkitMatchesSelector ||
  Element.prototype.msMatchesSelector;

function matches(element, query) {
  if (!elMatches) {
    throw new Error('No element matching method supported');
  }

  return elMatches.call(element, query);
}

function remove(element) {
  if (element.remove) {
    element.remove();
  } else {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}

function queryChildren(element, selector) {
  return Array.prototype.filter.call(element.children, function (child) { return matches(child, selector); }
  );
}

var cls = {
  main: 'ps',
  element: {
    thumb: function (x) { return ("ps__thumb-" + x); },
    rail: function (x) { return ("ps__rail-" + x); },
    consuming: 'ps__child--consume',
  },
  state: {
    focus: 'ps--focus',
    active: function (x) { return ("ps--active-" + x); },
    scrolling: function (x) { return ("ps--scrolling-" + x); },
  },
};

/*
 * Helper methods
 */
var scrollingClassTimeout = { x: null, y: null };

function addScrollingClass(i, x) {
  var classList = i.element.classList;
  var className = cls.state.scrolling(x);

  if (classList.contains(className)) {
    clearTimeout(scrollingClassTimeout[x]);
  } else {
    classList.add(className);
  }
}

function removeScrollingClass(i, x) {
  scrollingClassTimeout[x] = setTimeout(
    function () { return i.element.classList.remove(cls.state.scrolling(x)); },
    i.settings.scrollingThreshold
  );
}

function setScrollingClassInstantly(i, x) {
  addScrollingClass(i, x);
  removeScrollingClass(i, x);
}

var EventElement = function EventElement(element) {
  this.element = element;
  this.handlers = {};
};

var prototypeAccessors$1 = { isEmpty: { configurable: true } };

EventElement.prototype.bind = function bind (eventName, handler) {
  if (typeof this.handlers[eventName] === 'undefined') {
    this.handlers[eventName] = [];
  }
  this.handlers[eventName].push(handler);
  this.element.addEventListener(eventName, handler, false);
};

EventElement.prototype.unbind = function unbind (eventName, target) {
    var this$1 = this;

  this.handlers[eventName] = this.handlers[eventName].filter(function (handler) {
    if (target && handler !== target) {
      return true;
    }
    this$1.element.removeEventListener(eventName, handler, false);
    return false;
  });
};

EventElement.prototype.unbindAll = function unbindAll () {
    var this$1 = this;

  for (var name in this$1.handlers) {
    this$1.unbind(name);
  }
};

prototypeAccessors$1.isEmpty.get = function () {
    var this$1 = this;

  return Object.keys(this.handlers).every(
    function (key) { return this$1.handlers[key].length === 0; }
  );
};

Object.defineProperties( EventElement.prototype, prototypeAccessors$1 );

var EventManager = function EventManager() {
  this.eventElements = [];
};

EventManager.prototype.eventElement = function eventElement (element) {
  var ee = this.eventElements.filter(function (ee) { return ee.element === element; })[0];
  if (!ee) {
    ee = new EventElement(element);
    this.eventElements.push(ee);
  }
  return ee;
};

EventManager.prototype.bind = function bind (element, eventName, handler) {
  this.eventElement(element).bind(eventName, handler);
};

EventManager.prototype.unbind = function unbind (element, eventName, handler) {
  var ee = this.eventElement(element);
  ee.unbind(eventName, handler);

  if (ee.isEmpty) {
    // remove
    this.eventElements.splice(this.eventElements.indexOf(ee), 1);
  }
};

EventManager.prototype.unbindAll = function unbindAll () {
  this.eventElements.forEach(function (e) { return e.unbindAll(); });
  this.eventElements = [];
};

EventManager.prototype.once = function once (element, eventName, handler) {
  var ee = this.eventElement(element);
  var onceHandler = function (evt) {
    ee.unbind(eventName, onceHandler);
    handler(evt);
  };
  ee.bind(eventName, onceHandler);
};

function createEvent(name) {
  if (typeof window.CustomEvent === 'function') {
    return new CustomEvent(name);
  } else {
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(name, false, false, undefined);
    return evt;
  }
}

var updateScroll = function(i, axis, value, useScrollingClass) {
  if ( useScrollingClass === void 0 ) useScrollingClass = true;

  var fields;
  if (axis === 'top') {
    fields = [
      'contentHeight',
      'containerHeight',
      'scrollTop',
      'y',
      'up',
      'down' ];
  } else if (axis === 'left') {
    fields = [
      'contentWidth',
      'containerWidth',
      'scrollLeft',
      'x',
      'left',
      'right' ];
  } else {
    throw new Error('A proper axis should be provided');
  }

  updateScroll$1(i, value, fields, useScrollingClass);
};

function updateScroll$1(
  i,
  value,
  ref,
  useScrollingClass
) {
  var contentHeight = ref[0];
  var containerHeight = ref[1];
  var scrollTop = ref[2];
  var y = ref[3];
  var up = ref[4];
  var down = ref[5];

  var element = i.element;

  var mitigated = false;

  // reset reach
  i.reach[y] = null;

  // don't allow negative scroll offset
  if (value <= 0) {
    value = 0;
    i.reach[y] = 'start';
  }

  // don't allow scroll past container
  if (value >= i[contentHeight] - i[containerHeight]) {
    value = i[contentHeight] - i[containerHeight];

    // mitigates rounding errors on non-subpixel scroll values
    if (value - element[scrollTop] <= 2) {
      mitigated = true;
    }

    i.reach[y] = 'end';
  }

  var diff = element[scrollTop] - value;

  if (diff) {
    element.dispatchEvent(createEvent(("ps-scroll-" + y)));

    if (diff > 0) {
      element.dispatchEvent(createEvent(("ps-scroll-" + up)));
    } else {
      element.dispatchEvent(createEvent(("ps-scroll-" + down)));
    }

    if (!mitigated) {
      element[scrollTop] = value;
    }

    if (i.reach[y]) {
      element.dispatchEvent(createEvent(("ps-" + y + "-reach-" + (i.reach[y]))));
    }

    if (useScrollingClass) {
      setScrollingClassInstantly(i, y);
    }
  }
}

function toInt(x) {
  return parseInt(x, 10) || 0;
}

function isEditable(el) {
  return (
    matches(el, 'input,[contenteditable]') ||
    matches(el, 'select,[contenteditable]') ||
    matches(el, 'textarea,[contenteditable]') ||
    matches(el, 'button,[contenteditable]')
  );
}

function outerWidth(element) {
  var styles = get(element);
  return (
    toInt(styles.width) +
    toInt(styles.paddingLeft) +
    toInt(styles.paddingRight) +
    toInt(styles.borderLeftWidth) +
    toInt(styles.borderRightWidth)
  );
}

var env = {
  isWebKit: document && 'WebkitAppearance' in document.documentElement.style,
  supportsTouch:
    window &&
    ('ontouchstart' in window ||
      (window.DocumentTouch && document instanceof window.DocumentTouch)),
  supportsIePointer: navigator && navigator.msMaxTouchPoints,
};

var updateGeometry = function(i) {
  var element = i.element;

  i.containerWidth = element.clientWidth;
  i.containerHeight = element.clientHeight;
  i.contentWidth = element.scrollWidth;
  i.contentHeight = element.scrollHeight;

  if (!element.contains(i.scrollbarXRail)) {
    // clean up and append
    queryChildren(element, cls.element.rail('x')).forEach(function (el) { return remove(el); }
    );
    element.appendChild(i.scrollbarXRail);
  }
  if (!element.contains(i.scrollbarYRail)) {
    // clean up and append
    queryChildren(element, cls.element.rail('y')).forEach(function (el) { return remove(el); }
    );
    element.appendChild(i.scrollbarYRail);
  }

  if (
    !i.settings.suppressScrollX &&
    i.containerWidth + i.settings.scrollXMarginOffset < i.contentWidth
  ) {
    i.scrollbarXActive = true;
    i.railXWidth = i.containerWidth - i.railXMarginWidth;
    i.railXRatio = i.containerWidth / i.railXWidth;
    i.scrollbarXWidth = getThumbSize(
      i,
      toInt(i.railXWidth * i.containerWidth / i.contentWidth)
    );
    i.scrollbarXLeft = toInt(
      (i.negativeScrollAdjustment + element.scrollLeft) *
        (i.railXWidth - i.scrollbarXWidth) /
        (i.contentWidth - i.containerWidth)
    );
  } else {
    i.scrollbarXActive = false;
  }

  if (
    !i.settings.suppressScrollY &&
    i.containerHeight + i.settings.scrollYMarginOffset < i.contentHeight
  ) {
    i.scrollbarYActive = true;
    i.railYHeight = i.containerHeight - i.railYMarginHeight;
    i.railYRatio = i.containerHeight / i.railYHeight;
    i.scrollbarYHeight = getThumbSize(
      i,
      toInt(i.railYHeight * i.containerHeight / i.contentHeight)
    );
    i.scrollbarYTop = toInt(
      element.scrollTop *
        (i.railYHeight - i.scrollbarYHeight) /
        (i.contentHeight - i.containerHeight)
    );
  } else {
    i.scrollbarYActive = false;
  }

  if (i.scrollbarXLeft >= i.railXWidth - i.scrollbarXWidth) {
    i.scrollbarXLeft = i.railXWidth - i.scrollbarXWidth;
  }
  if (i.scrollbarYTop >= i.railYHeight - i.scrollbarYHeight) {
    i.scrollbarYTop = i.railYHeight - i.scrollbarYHeight;
  }

  updateCss(element, i);

  if (i.scrollbarXActive) {
    element.classList.add(cls.state.active('x'));
  } else {
    element.classList.remove(cls.state.active('x'));
    i.scrollbarXWidth = 0;
    i.scrollbarXLeft = 0;
    updateScroll(i, 'left', 0);
  }
  if (i.scrollbarYActive) {
    element.classList.add(cls.state.active('y'));
  } else {
    element.classList.remove(cls.state.active('y'));
    i.scrollbarYHeight = 0;
    i.scrollbarYTop = 0;
    updateScroll(i, 'top', 0);
  }
};

function getThumbSize(i, thumbSize) {
  if (i.settings.minScrollbarLength) {
    thumbSize = Math.max(thumbSize, i.settings.minScrollbarLength);
  }
  if (i.settings.maxScrollbarLength) {
    thumbSize = Math.min(thumbSize, i.settings.maxScrollbarLength);
  }
  return thumbSize;
}

function updateCss(element, i) {
  var xRailOffset = { width: i.railXWidth };
  if (i.isRtl) {
    xRailOffset.left =
      i.negativeScrollAdjustment +
      element.scrollLeft +
      i.containerWidth -
      i.contentWidth;
  } else {
    xRailOffset.left = element.scrollLeft;
  }
  if (i.isScrollbarXUsingBottom) {
    xRailOffset.bottom = i.scrollbarXBottom - element.scrollTop;
  } else {
    xRailOffset.top = i.scrollbarXTop + element.scrollTop;
  }
  set(i.scrollbarXRail, xRailOffset);

  var yRailOffset = { top: element.scrollTop, height: i.railYHeight };
  if (i.isScrollbarYUsingRight) {
    if (i.isRtl) {
      yRailOffset.right =
        i.contentWidth -
        (i.negativeScrollAdjustment + element.scrollLeft) -
        i.scrollbarYRight -
        i.scrollbarYOuterWidth;
    } else {
      yRailOffset.right = i.scrollbarYRight - element.scrollLeft;
    }
  } else {
    if (i.isRtl) {
      yRailOffset.left =
        i.negativeScrollAdjustment +
        element.scrollLeft +
        i.containerWidth * 2 -
        i.contentWidth -
        i.scrollbarYLeft -
        i.scrollbarYOuterWidth;
    } else {
      yRailOffset.left = i.scrollbarYLeft + element.scrollLeft;
    }
  }
  set(i.scrollbarYRail, yRailOffset);

  set(i.scrollbarX, {
    left: i.scrollbarXLeft,
    width: i.scrollbarXWidth - i.railBorderXWidth,
  });
  set(i.scrollbarY, {
    top: i.scrollbarYTop,
    height: i.scrollbarYHeight - i.railBorderYWidth,
  });
}

var clickRail = function(i) {
  var element = i.element;

  i.event.bind(i.scrollbarY, 'mousedown', function (e) { return e.stopPropagation(); });
  i.event.bind(i.scrollbarYRail, 'mousedown', function (e) {
    var positionTop =
      e.pageY -
      window.pageYOffset -
      i.scrollbarYRail.getBoundingClientRect().top;
    var direction = positionTop > i.scrollbarYTop ? 1 : -1;

    updateScroll(i, 'top', element.scrollTop + direction * i.containerHeight);
    updateGeometry(i);

    e.stopPropagation();
  });

  i.event.bind(i.scrollbarX, 'mousedown', function (e) { return e.stopPropagation(); });
  i.event.bind(i.scrollbarXRail, 'mousedown', function (e) {
    var positionLeft =
      e.pageX -
      window.pageXOffset -
      i.scrollbarXRail.getBoundingClientRect().left;
    var direction = positionLeft > i.scrollbarXLeft ? 1 : -1;

    updateScroll(i, 'left', element.scrollLeft + direction * i.containerWidth);
    updateGeometry(i);

    e.stopPropagation();
  });
};

var dragThumb = function(i) {
  bindMouseScrollHandler(i, [
    'containerWidth',
    'contentWidth',
    'pageX',
    'railXWidth',
    'scrollbarX',
    'scrollbarXWidth',
    'scrollLeft',
    'left',
    'x' ]);
  bindMouseScrollHandler(i, [
    'containerHeight',
    'contentHeight',
    'pageY',
    'railYHeight',
    'scrollbarY',
    'scrollbarYHeight',
    'scrollTop',
    'top',
    'y' ]);
};

function bindMouseScrollHandler(
  i,
  ref
) {
  var containerHeight = ref[0];
  var contentHeight = ref[1];
  var pageY = ref[2];
  var railYHeight = ref[3];
  var scrollbarY = ref[4];
  var scrollbarYHeight = ref[5];
  var scrollTop = ref[6];
  var top = ref[7];
  var y = ref[8];

  var element = i.element;

  var startingScrollTop = null;
  var startingMousePageY = null;
  var scrollBy = null;

  function mouseMoveHandler(e) {
    updateScroll(
      i,
      top,
      startingScrollTop + scrollBy * (e[pageY] - startingMousePageY),
      false
    );
    addScrollingClass(i, y);
    updateGeometry(i);

    e.stopPropagation();
    e.preventDefault();
  }

  function mouseUpHandler() {
    removeScrollingClass(i, y);
    i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
  }

  i.event.bind(i[scrollbarY], 'mousedown', function (e) {
    startingScrollTop = element[scrollTop];
    startingMousePageY = e[pageY];
    scrollBy =
      (i[contentHeight] - i[containerHeight]) /
      (i[railYHeight] - i[scrollbarYHeight]);

    i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
    i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

    e.stopPropagation();
    e.preventDefault();
  });
}

var keyboard = function(i) {
  var element = i.element;

  var elementHovered = function () { return matches(element, ':hover'); };
  var scrollbarFocused = function () { return matches(i.scrollbarX, ':focus') || matches(i.scrollbarY, ':focus'); };

  function shouldPreventDefault(deltaX, deltaY) {
    var scrollTop = element.scrollTop;
    if (deltaX === 0) {
      if (!i.scrollbarYActive) {
        return false;
      }
      if (
        (scrollTop === 0 && deltaY > 0) ||
        (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)
      ) {
        return !i.settings.wheelPropagation;
      }
    }

    var scrollLeft = element.scrollLeft;
    if (deltaY === 0) {
      if (!i.scrollbarXActive) {
        return false;
      }
      if (
        (scrollLeft === 0 && deltaX < 0) ||
        (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)
      ) {
        return !i.settings.wheelPropagation;
      }
    }
    return true;
  }

  i.event.bind(i.ownerDocument, 'keydown', function (e) {
    if (
      (e.isDefaultPrevented && e.isDefaultPrevented()) ||
      e.defaultPrevented
    ) {
      return;
    }

    if (!elementHovered() && !scrollbarFocused()) {
      return;
    }

    var activeElement = document.activeElement
      ? document.activeElement
      : i.ownerDocument.activeElement;
    if (activeElement) {
      if (activeElement.tagName === 'IFRAME') {
        activeElement = activeElement.contentDocument.activeElement;
      } else {
        // go deeper if element is a webcomponent
        while (activeElement.shadowRoot) {
          activeElement = activeElement.shadowRoot.activeElement;
        }
      }
      if (isEditable(activeElement)) {
        return;
      }
    }

    var deltaX = 0;
    var deltaY = 0;

    switch (e.which) {
      case 37: // left
        if (e.metaKey) {
          deltaX = -i.contentWidth;
        } else if (e.altKey) {
          deltaX = -i.containerWidth;
        } else {
          deltaX = -30;
        }
        break;
      case 38: // up
        if (e.metaKey) {
          deltaY = i.contentHeight;
        } else if (e.altKey) {
          deltaY = i.containerHeight;
        } else {
          deltaY = 30;
        }
        break;
      case 39: // right
        if (e.metaKey) {
          deltaX = i.contentWidth;
        } else if (e.altKey) {
          deltaX = i.containerWidth;
        } else {
          deltaX = 30;
        }
        break;
      case 40: // down
        if (e.metaKey) {
          deltaY = -i.contentHeight;
        } else if (e.altKey) {
          deltaY = -i.containerHeight;
        } else {
          deltaY = -30;
        }
        break;
      case 32: // space bar
        if (e.shiftKey) {
          deltaY = i.containerHeight;
        } else {
          deltaY = -i.containerHeight;
        }
        break;
      case 33: // page up
        deltaY = i.containerHeight;
        break;
      case 34: // page down
        deltaY = -i.containerHeight;
        break;
      case 36: // home
        deltaY = i.contentHeight;
        break;
      case 35: // end
        deltaY = -i.contentHeight;
        break;
      default:
        return;
    }

    if (i.settings.suppressScrollX && deltaX !== 0) {
      return;
    }
    if (i.settings.suppressScrollY && deltaY !== 0) {
      return;
    }

    updateScroll(i, 'top', element.scrollTop - deltaY);
    updateScroll(i, 'left', element.scrollLeft + deltaX);
    updateGeometry(i);

    if (shouldPreventDefault(deltaX, deltaY)) {
      e.preventDefault();
    }
  });
};

var wheel = function(i) {
  var element = i.element;

  function shouldPreventDefault(deltaX, deltaY) {
    var scrollTop = element.scrollTop;
    if (deltaX === 0) {
      if (!i.scrollbarYActive) {
        return false;
      }
      if (
        (scrollTop === 0 && deltaY > 0) ||
        (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)
      ) {
        return !i.settings.wheelPropagation;
      }
    }

    var scrollLeft = element.scrollLeft;
    if (deltaY === 0) {
      if (!i.scrollbarXActive) {
        return false;
      }
      if (
        (scrollLeft === 0 && deltaX < 0) ||
        (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)
      ) {
        return !i.settings.wheelPropagation;
      }
    }
    return true;
  }

  function getDeltaFromEvent(e) {
    var deltaX = e.deltaX;
    var deltaY = -1 * e.deltaY;

    if (typeof deltaX === 'undefined' || typeof deltaY === 'undefined') {
      // OS X Safari
      deltaX = -1 * e.wheelDeltaX / 6;
      deltaY = e.wheelDeltaY / 6;
    }

    if (e.deltaMode && e.deltaMode === 1) {
      // Firefox in deltaMode 1: Line scrolling
      deltaX *= 10;
      deltaY *= 10;
    }

    if (deltaX !== deltaX && deltaY !== deltaY /* NaN checks */) {
      // IE in some mouse drivers
      deltaX = 0;
      deltaY = e.wheelDelta;
    }

    if (e.shiftKey) {
      // reverse axis with shift key
      return [-deltaY, -deltaX];
    }
    return [deltaX, deltaY];
  }

  function shouldBeConsumedByChild(target, deltaX, deltaY) {
    // FIXME: this is a workaround for <select> issue in FF and IE #571
    if (!env.isWebKit && element.querySelector('select:focus')) {
      return true;
    }

    if (!element.contains(target)) {
      return false;
    }

    var cursor = target;

    while (cursor && cursor !== element) {
      if (cursor.classList.contains(cls.element.consuming)) {
        return true;
      }

      var style = get(cursor);
      var overflow = [style.overflow, style.overflowX, style.overflowY].join(
        ''
      );

      // if scrollable
      if (overflow.match(/(scroll|auto)/)) {
        var maxScrollTop = cursor.scrollHeight - cursor.clientHeight;
        if (maxScrollTop > 0) {
          if (
            !(cursor.scrollTop === 0 && deltaY > 0) &&
            !(cursor.scrollTop === maxScrollTop && deltaY < 0)
          ) {
            return true;
          }
        }
        var maxScrollLeft = cursor.scrollLeft - cursor.clientWidth;
        if (maxScrollLeft > 0) {
          if (
            !(cursor.scrollLeft === 0 && deltaX < 0) &&
            !(cursor.scrollLeft === maxScrollLeft && deltaX > 0)
          ) {
            return true;
          }
        }
      }

      cursor = cursor.parentNode;
    }

    return false;
  }

  function mousewheelHandler(e) {
    var ref = getDeltaFromEvent(e);
    var deltaX = ref[0];
    var deltaY = ref[1];

    if (shouldBeConsumedByChild(e.target, deltaX, deltaY)) {
      return;
    }

    var shouldPrevent = false;
    if (!i.settings.useBothWheelAxes) {
      // deltaX will only be used for horizontal scrolling and deltaY will
      // only be used for vertical scrolling - this is the default
      updateScroll(
        i,
        'top',
        element.scrollTop - deltaY * i.settings.wheelSpeed
      );
      updateScroll(
        i,
        'left',
        element.scrollLeft + deltaX * i.settings.wheelSpeed
      );
    } else if (i.scrollbarYActive && !i.scrollbarXActive) {
      // only vertical scrollbar is active and useBothWheelAxes option is
      // active, so let's scroll vertical bar using both mouse wheel axes
      if (deltaY) {
        updateScroll(
          i,
          'top',
          element.scrollTop - deltaY * i.settings.wheelSpeed
        );
      } else {
        updateScroll(
          i,
          'top',
          element.scrollTop + deltaX * i.settings.wheelSpeed
        );
      }
      shouldPrevent = true;
    } else if (i.scrollbarXActive && !i.scrollbarYActive) {
      // useBothWheelAxes and only horizontal bar is active, so use both
      // wheel axes for horizontal bar
      if (deltaX) {
        updateScroll(
          i,
          'left',
          element.scrollLeft + deltaX * i.settings.wheelSpeed
        );
      } else {
        updateScroll(
          i,
          'left',
          element.scrollLeft - deltaY * i.settings.wheelSpeed
        );
      }
      shouldPrevent = true;
    }

    updateGeometry(i);

    shouldPrevent = shouldPrevent || shouldPreventDefault(deltaX, deltaY);
    if (shouldPrevent) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  if (typeof window.onwheel !== 'undefined') {
    i.event.bind(element, 'wheel', mousewheelHandler);
  } else if (typeof window.onmousewheel !== 'undefined') {
    i.event.bind(element, 'mousewheel', mousewheelHandler);
  }
};

var touch = function(i) {
  if (!env.supportsTouch && !env.supportsIePointer) {
    return;
  }

  var element = i.element;

  function shouldStopOrPrevent(deltaX, deltaY) {
    var scrollTop = element.scrollTop;
    var scrollLeft = element.scrollLeft;
    var magnitudeX = Math.abs(deltaX);
    var magnitudeY = Math.abs(deltaY);

    if (magnitudeY > magnitudeX) {
      // user is perhaps trying to swipe up/down the page

      if (
        (deltaY < 0 && scrollTop === i.contentHeight - i.containerHeight) ||
        (deltaY > 0 && scrollTop === 0)
      ) {
        // set prevent for mobile Chrome refresh
        return {
          stop: !i.settings.swipePropagation,
          prevent: window.scrollY === 0,
        };
      }
    } else if (magnitudeX > magnitudeY) {
      // user is perhaps trying to swipe left/right across the page

      if (
        (deltaX < 0 && scrollLeft === i.contentWidth - i.containerWidth) ||
        (deltaX > 0 && scrollLeft === 0)
      ) {
        return { stop: !i.settings.swipePropagation, prevent: true };
      }
    }

    return { stop: true, prevent: true };
  }

  function applyTouchMove(differenceX, differenceY) {
    updateScroll(i, 'top', element.scrollTop - differenceY);
    updateScroll(i, 'left', element.scrollLeft - differenceX);

    updateGeometry(i);
  }

  var startOffset = {};
  var startTime = 0;
  var speed = {};
  var easingLoop = null;
  var inGlobalTouch = false;
  var inLocalTouch = false;

  function globalTouchStart() {
    inGlobalTouch = true;
  }
  function globalTouchEnd() {
    inGlobalTouch = false;
  }

  function getTouch(e) {
    if (e.targetTouches) {
      return e.targetTouches[0];
    } else {
      // Maybe IE pointer
      return e;
    }
  }

  function shouldHandle(e) {
    if (e.pointerType && e.pointerType === 'pen' && e.buttons === 0) {
      return false;
    }
    if (e.targetTouches && e.targetTouches.length === 1) {
      return true;
    }
    if (
      e.pointerType &&
      e.pointerType !== 'mouse' &&
      e.pointerType !== e.MSPOINTER_TYPE_MOUSE
    ) {
      return true;
    }
    return false;
  }

  function touchStart(e) {
    if (!shouldHandle(e)) {
      return;
    }

    inLocalTouch = true;

    var touch = getTouch(e);

    startOffset.pageX = touch.pageX;
    startOffset.pageY = touch.pageY;

    startTime = new Date().getTime();

    if (easingLoop !== null) {
      clearInterval(easingLoop);
    }

    e.stopPropagation();
  }

  function touchMove(e) {
    if (!inLocalTouch && i.settings.swipePropagation) {
      touchStart(e);
    }
    if (!inGlobalTouch && inLocalTouch && shouldHandle(e)) {
      var touch = getTouch(e);

      var currentOffset = { pageX: touch.pageX, pageY: touch.pageY };

      var differenceX = currentOffset.pageX - startOffset.pageX;
      var differenceY = currentOffset.pageY - startOffset.pageY;

      applyTouchMove(differenceX, differenceY);
      startOffset = currentOffset;

      var currentTime = new Date().getTime();

      var timeGap = currentTime - startTime;
      if (timeGap > 0) {
        speed.x = differenceX / timeGap;
        speed.y = differenceY / timeGap;
        startTime = currentTime;
      }

      var ref = shouldStopOrPrevent(differenceX, differenceY);
      var stop = ref.stop;
      var prevent = ref.prevent;
      if (stop) { e.stopPropagation(); }
      if (prevent) { e.preventDefault(); }
    }
  }
  function touchEnd() {
    if (!inGlobalTouch && inLocalTouch) {
      inLocalTouch = false;

      if (i.settings.swipeEasing) {
        clearInterval(easingLoop);
        easingLoop = setInterval(function() {
          if (i.isInitialized) {
            clearInterval(easingLoop);
            return;
          }

          if (!speed.x && !speed.y) {
            clearInterval(easingLoop);
            return;
          }

          if (Math.abs(speed.x) < 0.01 && Math.abs(speed.y) < 0.01) {
            clearInterval(easingLoop);
            return;
          }

          applyTouchMove(speed.x * 30, speed.y * 30);

          speed.x *= 0.8;
          speed.y *= 0.8;
        }, 10);
      }
    }
  }

  if (env.supportsTouch) {
    i.event.bind(window, 'touchstart', globalTouchStart);
    i.event.bind(window, 'touchend', globalTouchEnd);
    i.event.bind(element, 'touchstart', touchStart);
    i.event.bind(element, 'touchmove', touchMove);
    i.event.bind(element, 'touchend', touchEnd);
  } else if (env.supportsIePointer) {
    if (window.PointerEvent) {
      i.event.bind(window, 'pointerdown', globalTouchStart);
      i.event.bind(window, 'pointerup', globalTouchEnd);
      i.event.bind(element, 'pointerdown', touchStart);
      i.event.bind(element, 'pointermove', touchMove);
      i.event.bind(element, 'pointerup', touchEnd);
    } else if (window.MSPointerEvent) {
      i.event.bind(window, 'MSPointerDown', globalTouchStart);
      i.event.bind(window, 'MSPointerUp', globalTouchEnd);
      i.event.bind(element, 'MSPointerDown', touchStart);
      i.event.bind(element, 'MSPointerMove', touchMove);
      i.event.bind(element, 'MSPointerUp', touchEnd);
    }
  }
};

var defaultSettings = function () { return ({
  handlers: ['click-rail', 'drag-thumb', 'keyboard', 'wheel', 'touch'],
  maxScrollbarLength: null,
  minScrollbarLength: null,
  scrollingThreshold: 1000,
  scrollXMarginOffset: 0,
  scrollYMarginOffset: 0,
  suppressScrollX: false,
  suppressScrollY: false,
  swipePropagation: true,
  swipeEasing: true,
  useBothWheelAxes: false,
  wheelPropagation: false,
  wheelSpeed: 1,
}); };

var handlers = {
  'click-rail': clickRail,
  'drag-thumb': dragThumb,
  keyboard: keyboard,
  wheel: wheel,
  touch: touch,
};

var PerfectScrollbar = function PerfectScrollbar(element, userSettings) {
  var this$1 = this;
  if ( userSettings === void 0 ) userSettings = {};

  if (typeof element === 'string') {
    element = document.querySelector(element);
  }

  if (!element || !element.nodeName) {
    throw new Error('no element is specified to initialize PerfectScrollbar');
  }

  this.element = element;

  element.classList.add(cls.main);

  this.settings = defaultSettings();
  for (var key in userSettings) {
    this$1.settings[key] = userSettings[key];
  }

  this.containerWidth = null;
  this.containerHeight = null;
  this.contentWidth = null;
  this.contentHeight = null;

  var focus = function () { return element.classList.add(cls.state.focus); };
  var blur = function () { return element.classList.remove(cls.state.focus); };

  this.isRtl = get(element).direction === 'rtl';
  this.isNegativeScroll = (function () {
    var originalScrollLeft = element.scrollLeft;
    var result = null;
    element.scrollLeft = -1;
    result = element.scrollLeft < 0;
    element.scrollLeft = originalScrollLeft;
    return result;
  })();
  this.negativeScrollAdjustment = this.isNegativeScroll
    ? element.scrollWidth - element.clientWidth
    : 0;
  this.event = new EventManager();
  this.ownerDocument = element.ownerDocument || document;

  this.scrollbarXRail = div(cls.element.rail('x'));
  element.appendChild(this.scrollbarXRail);
  this.scrollbarX = div(cls.element.thumb('x'));
  this.scrollbarXRail.appendChild(this.scrollbarX);
  this.scrollbarX.setAttribute('tabindex', 0);
  this.event.bind(this.scrollbarX, 'focus', focus);
  this.event.bind(this.scrollbarX, 'blur', blur);
  this.scrollbarXActive = null;
  this.scrollbarXWidth = null;
  this.scrollbarXLeft = null;
  var railXStyle = get(this.scrollbarXRail);
  this.scrollbarXBottom = parseInt(railXStyle.bottom, 10);
  if (isNaN(this.scrollbarXBottom)) {
    this.isScrollbarXUsingBottom = false;
    this.scrollbarXTop = toInt(railXStyle.top);
  } else {
    this.isScrollbarXUsingBottom = true;
  }
  this.railBorderXWidth =
    toInt(railXStyle.borderLeftWidth) + toInt(railXStyle.borderRightWidth);
  // Set rail to display:block to calculate margins
  set(this.scrollbarXRail, { display: 'block' });
  this.railXMarginWidth =
    toInt(railXStyle.marginLeft) + toInt(railXStyle.marginRight);
  set(this.scrollbarXRail, { display: '' });
  this.railXWidth = null;
  this.railXRatio = null;

  this.scrollbarYRail = div(cls.element.rail('y'));
  element.appendChild(this.scrollbarYRail);
  this.scrollbarY = div(cls.element.thumb('y'));
  this.scrollbarYRail.appendChild(this.scrollbarY);
  this.scrollbarY.setAttribute('tabindex', 0);
  this.event.bind(this.scrollbarY, 'focus', focus);
  this.event.bind(this.scrollbarY, 'blur', blur);
  this.scrollbarYActive = null;
  this.scrollbarYHeight = null;
  this.scrollbarYTop = null;
  var railYStyle = get(this.scrollbarYRail);
  this.scrollbarYRight = parseInt(railYStyle.right, 10);
  if (isNaN(this.scrollbarYRight)) {
    this.isScrollbarYUsingRight = false;
    this.scrollbarYLeft = toInt(railYStyle.left);
  } else {
    this.isScrollbarYUsingRight = true;
  }
  this.scrollbarYOuterWidth = this.isRtl ? outerWidth(this.scrollbarY) : null;
  this.railBorderYWidth =
    toInt(railYStyle.borderTopWidth) + toInt(railYStyle.borderBottomWidth);
  set(this.scrollbarYRail, { display: 'block' });
  this.railYMarginHeight =
    toInt(railYStyle.marginTop) + toInt(railYStyle.marginBottom);
  set(this.scrollbarYRail, { display: '' });
  this.railYHeight = null;
  this.railYRatio = null;

  this.reach = {
    x:
      element.scrollLeft <= 0
        ? 'start'
        : element.scrollLeft >= this.contentWidth - this.containerWidth
          ? 'end'
          : null,
    y:
      element.scrollTop <= 0
        ? 'start'
        : element.scrollTop >= this.contentHeight - this.containerHeight
          ? 'end'
          : null,
  };

  this.settings.handlers.forEach(function (handlerName) { return handlers[handlerName](this$1); });

  this.event.bind(this.element, 'scroll', function () { return updateGeometry(this$1); });
  updateGeometry(this);
};

var prototypeAccessors = { isInitialized: { configurable: true } };

prototypeAccessors.isInitialized.get = function () {
  return this.element.classList.contains(cls.main);
};

PerfectScrollbar.prototype.update = function update () {
  if (!this.isInitialized) {
    return;
  }

  // Recalcuate negative scrollLeft adjustment
  this.negativeScrollAdjustment = this.isNegativeScroll
    ? this.element.scrollWidth - this.element.clientWidth
    : 0;

  // Recalculate rail margins
  set(this.scrollbarXRail, { display: 'block' });
  set(this.scrollbarYRail, { display: 'block' });
  this.railXMarginWidth =
    toInt(get(this.scrollbarXRail).marginLeft) +
    toInt(get(this.scrollbarXRail).marginRight);
  this.railYMarginHeight =
    toInt(get(this.scrollbarYRail).marginTop) +
    toInt(get(this.scrollbarYRail).marginBottom);

  // Hide scrollbars not to affect scrollWidth and scrollHeight
  set(this.scrollbarXRail, { display: 'none' });
  set(this.scrollbarYRail, { display: 'none' });

  updateGeometry(this);

  set(this.scrollbarXRail, { display: '' });
  set(this.scrollbarYRail, { display: '' });
};

PerfectScrollbar.prototype.destroy = function destroy () {
  if (!this.isInitialized) {
    return;
  }

  this.event.unbindAll();
  remove(this.scrollbarX);
  remove(this.scrollbarY);
  remove(this.scrollbarXRail);
  remove(this.scrollbarYRail);
  this.removePsClasses();

  // unset elements
  this.element = null;
  this.scrollbarX = null;
  this.scrollbarY = null;
  this.scrollbarXRail = null;
  this.scrollbarYRail = null;
};

PerfectScrollbar.prototype.removePsClasses = function removePsClasses () {
  this.element.className = this.element.className
    .split(' ')
    .filter(function (name) { return !name.match(/^ps([-_].+|)$/); })
    .join(' ');
};

Object.defineProperties( PerfectScrollbar.prototype, prototypeAccessors );

return PerfectScrollbar;

})));


/*! 
 * ================== js/libs/plugins/averta/averta-jquery.multitabs.js =================== 
 **/ 

/*
 *  Averta LiveTabs - v1.5.0 (2014-11-22)
 *  https://bitbucket.org/averta/
 *
 *  A jQuery plugin for enabling multi level tabs.
 *
 *  Copyright (c) 2010-2014  <>
 *  License: 
 */
/**
 * USAGE : 
 * -----------------------------------------------------------------------------------------------------
 * HTML:
   <div id="container">
      <ul class="tabs">
        <li class="active"><a href="#s1">Tab1</a></li>
        <li><a href="#s2">Tab2</a></li>
        <li><a href="#s3">Tab3</a></li>
      </ul>
   
      <ul class="tabs-content">
        <li id="s1">Contnt1</li>
        <li id="s2">Contnt2</li>
        <li id="s3">Contnt3</li>
      </ul> 
   </div>
 * 
 * JS:
   $('#container').avertaMultiTabs({
      tabs:            'ul.tabs > li',            // Tabs selector
      subTabsList:     'ul',                      // Relative selector for second level tabs list
      subTabs:         '> li',                    // Relative selector for second level tabs
      tabsActiveClass: 'active',                  // A Class that indicates active tab
      contents:        'ul.tabs-content > li',    // Tabs content selector    
      contentsActiveClass: 'active',              // A Class that indicates active tab-content    
      transition:      'fade',                    // Animation type white swiching tabs
      duration :       '500',                     // Animation duration in mili seconds
      connectType:     'index',                   // connect tabs and contents by 'index' or 'id'
      enableHash:      false ,                    // check to select initial tab based on hash address
      updateHash:      false ,                    // update hash in browser while switching between tabs
      hashSuffix:      '-tab'                     // suffix to add at the end of hash url to prevent page scroll
   });
 
 * ---------------------------------------------------------------------------------------------------------
 **/

 if( typeof Object.create !== 'function' ){ Object.create = function (obj){ function F(){} F.prototype = obj; return new F();}; }

;(function($){
    
    var Container = {
        
        init : function(el, options){
            //cache this
            var self        = this;
            self.options    = $.extend({} ,$.fn.avertaMultiTabs.defaultOptions, options || {} );
            
            // Access to jQuery and DOM versions of element
            self.$el        = $(el);
            self.el         = el;
            
            self.$tabs      = self.$el.find(self.options.tabs); // select all main tabs
            self.$subList   = self.$tabs.find(self.options.subTabsList); // select sub lists (ul doms)
            self.$subTabs   = self.$subList.find(self.options.subTabs); // select all sub tabs
            self.$contents  = self.$el.find(self.options.contents); // select contents
            
            self.setup();
        },
        
        setup: function(){
            var self = this,
                $activeTab;

            // click event when new tab clicked
            self.$tabs.on('click', {self:self}, self.onTabClicked);
            self.$subTabs.on('click', {self:self}, self.onSubTabClicked);

            // if hash is enabled in options get current hash and select related tab
            if(self.options.enableHash && window.location.hash !== '') {
                var id      = self.trimID( window.location.hash );
                $activeTab  = self.getTabById('#'+id);
            } else {
                // find the tab with tabsActiveClass
                $activeTab  = self.$tabs.filter('.'+self.options.tabsActiveClass);
            }
            // validate to select the active tab for start
            $activeTab      = $activeTab.length ? $activeTab : self.$tabs.first();
            $activeTab.trigger('click', true);
            
        },
        
        onTabClicked: function(event, fromSetup){
            event.preventDefault();
            var self   = event.data.self,
                $this  = $(this),
                $currentSubList;

            if( !fromSetup && $this.hasClass('active') ){
                return;
            } 
            
            // Add active class to current tab
            self.$tabs.removeClass(self.options.tabsActiveClass);
            $this.addClass(self.options.tabsActiveClass);

            self.$subList.removeClass(self.options.tabsActiveClass);
            $currentSubList = $this.find(self.options.subTabsList);
            $currentSubList.addClass(self.options.tabsActiveClass);

            var $firstCurrentSubTab = $currentSubList.find(self.options.subTabs).first();
            if( $firstCurrentSubTab.length ){
                $firstCurrentSubTab.trigger( 'click' );
            } else {
                self.showRelatedContent( $this );
            }

            // update hash in page address if updateHash is enabled
            if( self.options.updateHash ){
                self.updateHash( $this );
            }
        },

        onSubTabClicked: function(event, fromSetup){
            event.preventDefault();
            var self   = event.data.self,
                $this  = $(this);
            
            // Add active class to current tab
            $this.siblings().removeClass(self.options.tabsActiveClass);
            $this.addClass(self.options.tabsActiveClass);
            
            // show tab related content
            self.showRelatedContent( $this );
        },

        getTabById:function(id){
            // remove hashSuffix (if exist) from id hash to get real element id
            id = id.split(this.options.hashSuffix)[0];
            // search for hash in tabs markup - generaly should be direct children of tab
            // check for href="#id" format
            var $activeTab = this.$tabs.find('[href="#'+ id +'"]').eq(0);
            // if no match found, check for href="id" format too
            if( ! $activeTab.length )
                $activeTab = this.$tabs.find('[href="'+ id +'"]').eq(0);
            // get the tab if hash found in it
            return $activeTab.length?$activeTab.parent():$activeTab;
        },

        getContentById:function(id){
            return this.$contents.filter( '#'+ this.trimID( id ) );
        },

        getIdByTab:function($tab){
            var $anchor = $tab.find('[href]').eq(0);
            return $anchor.length?$anchor.attr('href'):false;
        },

        trimID:function(id){
            return id.replace( /^\s+|\s+$|#/g, '' );
        },

        showRelatedContent: function( $tab ){
            var self = this,
                $tabContent;
            
            self.$contents.hide();
            if( self.options.connectType === 'id' ){
                var activeId = self.getIdByTab( $tab );
                $tabContent = self.getContentById( activeId );
            } else{
                $tabContent = self.$contents.eq( $tab.index() );
            }
            $tabContent.fadeIn(self.options.duration);

            // trigger custom event
            self.$el.trigger('avtMultiTabChange', $tabContent.attr('id'));
        },

        updateHash: function( $tab ){
            var self = this,
                activeId;

            activeId  = self.getIdByTab( $tab );
            activeId  = self.trimID( activeId ); 
            activeId  = activeId?activeId+self.options.hashSuffix:'';

            if( window.history && window.history.pushState ){
                window.history.pushState( null, null, window.location.href.split('#')[0]+'#'+activeId );
            } else {
                window.location.hash = activeId;
            }
        }
    };
    
    
     $.fn.avertaMultiTabs = function(options){
        return this.each(function(){
            var container = Object.create(Container);
            container.init(this, options);
        });
    };
    
    $.fn.avertaMultiTabs.defaultOptions = {
        tabs:            'ul.tabs > li',            // Tabs selector
        subTabsList:     'ul',                      // Relative selector for second level tabs list
        subTabs:         '> li:not(.not-tab)',    // Relative selector for second level tabs
        tabsActiveClass: 'active',                  // A Class that indicates active tab
        contents:        'ul.tabs-content > li',    // Tabs content selector    
        contentsActiveClass: 'active',              // A Class that indicates active tab-content    
        transition:      'fade',                    // Animation type white swiching tabs
        duration :       '500',                     // Animation duration in mili seconds
        connectType:     'id',                      // connect tabs and contents by 'index' or 'id'
        enableHash:      false ,                    // check to select initial tab based on hash address
        updateHash:      false ,                    // update hash in browser while switching between tabs
        hashSuffix:      '-tab'                     // suffix to add at the end of hash url to prevent page scroll
    };
    
})(jQuery);


/*! 
 * ================== js/libs/plugins/averta/averta-jquery.livetabs.js =================== 
 **/ 

/*
 *  Averta LiveTabs - v1.6.0 (2014-11-22)
 *  https://bitbucket.org/averta/averta-livetabs/
 *
 *  A jQuery plugin for enabling tabs.
 *
 *  Copyright (c) 2010-2014  <>
 *  License: 
 */
/**
 * USAGE : 
 * -----------------------------------------------------------------------------------------------------
 * HTML:
   <div id="container">
      <ul class="tabs">
        <li class="active"><a href="#s1">Tab1</a></li>
        <li><a href="#s2">Tab2</a></li>
        <li><a href="#s3">Tab3</a></li>
      </ul>
   
      <ul class="tabs-content">
        <li id="s1">Contnt1</li>
        <li id="s2">Contnt2</li>
        <li id="s3">Contnt3</li>
      </ul> 
   </div>
 * 
 * JS:
   $('#container').avertaLiveTabs({
      tabs:            'ul.tabs > li',            // Tabs selector
      tabsActiveClass: 'active',                  // A Class that indicates active tab
      contents:        'ul.tabs-content > li',    // Tabs content selector    
      contentsActiveClass: 'active',              // A Class that indicates active tab-content    
      transition:      'fade',                    // Animation type white swiching tabs
      duration :       '500',                     // Animation duration in mili seconds
      connectType:     'index',                   // connect tabs and contents by 'index' or 'id'
      enableHash:      false ,                    // check to select initial tab based on hash address
      updateHash:      false ,                    // update hash in browser while switching between tabs
      hashSuffix:      '-tab'                     // suffix to add at the end of hash url to prevent page scroll
   });
 
 * ---------------------------------------------------------------------------------------------------------
 **/

 if( typeof Object.create !== 'function' ){ Object.create = function (obj){ function F(){} F.prototype = obj; return new F();}; }

;(function($){

    var Container = {

        init : function(el, options){
            //cache this
            var self        = this;
            self.options    = $.extend({} ,$.fn.avertaLiveTabs.defaultOptions, options || {} );
            
            // Access to jQuery and DOM versions of element
            self.$el        = $(el);
            self.el         = el;
            
            self.$tabs      = self.$el.find(self.options.tabs);
            self.$contents  = self.$el.find(self.options.contents);
            
            self.setup();
        },
        
        setup: function(){
            var self = this,
                $activeTab;
            // click event when new tab selected
            self.$tabs.on('click', {self:self}, self.onTabClicked);

            // if hash is enabled in options get current hash and select related tab
            if(self.options.enableHash && window.location.hash !== '') {
                var id      = self.trimID( window.location.hash );
                $activeTab = self.getTabById(id);
            } else {
                // find the tab with tabsActiveClass
                $activeTab = self.$tabs.filter('.'+self.options.tabsActiveClass);
            }
            // validate to select the active tab for start
            $activeTab     = ($activeTab.length)?$activeTab:self.$tabs.first();
            $activeTab.trigger('click', true);
            
        },
        
        onTabClicked:function(event, fromSetup){
            event.preventDefault();
            var self   = event.data.self,
                $this  = $(this),
                $tabContent,
                activeId;

            if( !fromSetup && $this.hasClass('active') ){
                return;
            } 
            
            self.$tabs.removeClass(self.options.tabsActiveClass);
            $this.addClass(self.options.tabsActiveClass);
            
            self.$contents.hide();
            if( self.options.connectType === 'id' ){
                activeId     = self.getIdByTab( $this );
                $tabContent = self.getContentById( activeId );
            } else {
                $tabContent = self.$contents.eq( $this.index() );
            }
            $tabContent.fadeIn(self.options.duration);

            // update hash in page address if updateHash is enabled
            if( self.options.updateHash ){
                activeId  = self.getIdByTab( $this );
                activeId  = self.trimID( activeId );
                activeId  = activeId ? activeId + self.options.hashSuffix : '';

                if( window.history && window.history.pushState )
                    window.history.pushState(null, null, window.location.href.split('#')[0]+'#'+activeId);
                else
                    window.location.hash = activeId;
            }

            // trigger custom event
            self.$el.trigger('avtTabChange', $tabContent.attr('id'));

        },

        getTabById:function(id){
            // remove hashSuffix (if exist) from id hash to get real element id
            id = id.split(this.options.hashSuffix)[0];
            // search for hash in tabs markup - generaly should be direct children of tab
            // check for href="#id" format
            var $activeTab = this.$tabs.find('[href="#'+ id +'"]').eq(0);
            // if no match found, check for href="id" format too
            if(!$activeTab.length)
                $activeTab = this.$tabs.find('[href="'+ id +'"]').eq(0);
            // get the tab if hash found in it
            return $activeTab.length ? $activeTab.parent() : $activeTab;
        },

        getContentById:function(id){
            return this.$contents.filter( '#'+ this.trimID(id) );
        },

        trimID:function(id){
            return id.replace( /^\s+|\s+$|#/g, '' );
        },

        getIdByTab:function($tab){
            var $anchor = $tab.find('[href]').eq(0);
            return $anchor.length?$anchor.attr('href'):false;
        }
    };
    
    
     $.fn.avertaLiveTabs = function(options){
        return this.each(function(){
            var container = Object.create(Container);
            container.init(this, options);
        });
    };
    
    $.fn.avertaLiveTabs.defaultOptions = {
        tabs:            'ul.tabs > li',            // Tabs selector
        tabsActiveClass: 'active',                  // A Class that indicates active tab
        contents:        'ul.tabs-content > li',    // Tabs content selector    
        contentsActiveClass: 'active',              // A Class that indicates active tab-content    
        transition:      'fade',                    // Animation type white swiching tabs
        duration :       '500',                     // Animation duration in mili seconds
        connectType:     'index',                   // connect tabs and contents by 'index' or 'id'
        enableHash:      false ,                    // check to select initial tab based on hash address
        updateHash:      false ,                    // update hash in browser while switching between tabs
        hashSuffix:      '-tab'                     // suffix to add at the end of hash url to prevent page scroll
    };
    
})(jQuery);


/*! 
 * ================== js/libs/plugins/averta/averta-jquery.visualselect.js =================== 
 **/ 

/*!
 * Visual Select - A jQuery plugin for replacing HTML select element with a visual selection tool.
 *
 * @version     1.3.0
 * @requires    jQuery 1.9+
 * @author      Averta [averta.net]
 * @package     Axiom Framework
 * @copyright   Copyright © 2017 Averta, all rights reserved
 */

;(function ( $, window, document, undefined ) {

    "use strict";

    // Create the defaults once
    var pluginName = 'avertaVisualSelect',
        defaults = {
            item             : 'axi-select-item',              // visual select item [class name]
            selected         : 'axi-selected',                 // selected item [class name]
            caption          : 'axi-select-caption',           // caption under visual item [class name]
            container        : 'axi-visual-select',            // select items container [class name]

            insertCaption    : false,                          // whether insert captions to visual items
            insertSymbol     : true,                           // whether insert symbol to visual items
            insertTitleAttr  : true,                           // adds title attribute to visual item
            autoHideElement  : true,                           // hide HTML select element after init
            imgTest          : /\.jpg|\.png|\.gif|.jpeg|\.svg/ // test for image src
        },

        attributesMap = {
            'type'             : 'symbolType',
            'title-attr'       : 'insertTitleAttr',
            'auto-hide'        : 'autoHideElement',
            'caption'          : 'insertCaption'
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        this.$element = $(element);
        this.options = $.extend( {}, defaults, options) ;

        // read attributes
        for ( var key in attributesMap ) {
            var value = attributesMap[ key ],
                dataAttr = this.$element.data( key );

            if ( dataAttr === undefined ) {
                continue;
            }

            this.options[ value ] = dataAttr;
        }

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    $.extend(Plugin.prototype, {

        init : function(){
            var self = this,
                st = self.options;

            self.multiple = self.$element.attr('multiple') === 'multiple';

            if ( st.autoHideElement ) {
                self.$element.css('display', 'none');
            }

            // generate select items
            self.$selectCont = $('<div class="' + st.container + '"></div>').insertAfter(self.$element);
            self.generate();

            self.$element.on( 'change', this.update.bind( this ) );

        },

        /**
         * on visual select item clicked
         * @private
         * @param  {jQuery Event} event
         */
        _onItemClick : function (event) {
            var $visualItem = $(event.currentTarget),
                $selectOption = $visualItem.data('selectOption'),
                st = this.options;

            if ( this.multiple ) {

                if ( $visualItem.hasClass(st.selected) ) {
                    $visualItem.removeClass(st.selected);
                    $selectOption.removeAttr('selected');
                } else {
                    $visualItem.addClass(st.selected);
                    $selectOption.attr('selected', 'selected');

                    var val = this.$element.val();
                    if ( val === null ) {
                        val = [];
                    }

                    val.push( $selectOption.attr( 'value' ) );

                    this.$element.val( val );
                }

            } else if ( !$visualItem.hasClass(st.selected) ) {

                $visualItem.addClass(st.selected);
                $selectOption.attr('selected', 'selected');
                this.$element.val( $selectOption.attr( 'value' ) );

                if ( this.$selectedItem ) {
                    this.$selectedItem.removeClass(st.selected);
                    this.$selectedItem.data('selectOption').removeAttr('selected');
                }

                this.$selectedItem = $visualItem;
            }

            this._internalTrigger = true;
            this.$element.trigger('change');

        },

        /**
         * Generates video element sources by parsing the data-video-src attribute on element
         */
        _generateVideoSource: function( videoSrc ) {
            var source = '';
            videoSrc.split( ',' ).forEach( function( src ) {
                src = src.split( ' ' );
                source += '<source src="' + src[0] + '" type="video/' + src[1] + '">';
            } );

            return source;
        },

        /**
         * On video ready to play
         */
        _videoInit: function( event ) {
            $(event.currentTarget).on( 'mouseenter', function() {
                this.play();
            }).on( 'mouseleave', function() {
                this.pause();
                this.currentTime = 0;
            });
        },

        /**
         * updates selected items in visual form
         */
        update: function() {
            if ( this._internalTrigger ) {
                this._internalTrigger = false;
                return;
            }

            var self = this,
                st = this.options,
                $items = self.$selectCont.find( '.' + st.item ),
                val = self.$element.val();

            self.$element.find( 'option' ).each( function( index, option ) {
                var $option = $(option),
                    $visualItem = $items.eq( index );
                if ( val.indexOf( $option.val() ) !== -1 ) {
                    self.$selectedItem = $visualItem.addClass( st.selected );
                } else {
                    $visualItem.removeClass( st.selected );
                }

            } );
        },

        /**
         * create visual items from HTML select element
         * @param {boolean} reset Remove old visual items [it's useful for updating visual select]
         * @public
         */
        generate : function (reset) {
            var self = this,
                st = self.options;

            if ( reset ) {
                this.$selectCont.find('.' + st.item).remove();
            }

            self.$element.find('option').each(function(){
                var $selectOption = $(this),
                    $visualItem = $('<div class="' + st.item + '"></div>'),
                    symbol = $selectOption.data('symbol'),
                    videoSrc = $selectOption.data('video-src'),
                    caption = $selectOption.html(),
                    cssClass = $selectOption.data('class');

                if ( cssClass ) {
                    $visualItem.addClass(cssClass);
                }

                // insert visual symbol to select item

                if ( st.insertSymbol ) {
                    if ( videoSrc ) {
                        $visualItem.attr('item-type', 'video');
                        var $videoElement = $('<video></video>').attr( 'muted', '' ).attr( 'loop', '' )
                                                                .append( self._generateVideoSource( videoSrc ) )
                                                                .appendTo( $visualItem );

                        $videoElement[0].addEventListener( 'loadedmetadata', self._videoInit );
                    } else if ( st.imgTest.test( symbol ) || $selectOption.data( 'type' ) === 'image' ) {
                        $('<img/>').attr('src', symbol)
                                   .attr('alt', caption)
                                   .appendTo($visualItem);
                    } else {
                        $('<span></span>').addClass(symbol)
                                          .appendTo($visualItem);
                    }
                }

                // insert caption
                if ( st.insertCaption ) {
                    $('<span class="' + st.caption + '">' + caption + '</span>').appendTo($visualItem);
                }

                $visualItem.click($.proxy(self._onItemClick, self))
                           .data('selectOption', $selectOption)
                           .appendTo(self.$selectCont);

                if ( st.insertTitleAttr ) {
                    $visualItem.attr('title', caption);
                }

                if ( $selectOption.attr('selected') === 'selected' ) {
                    self.$selectedItem = $visualItem.addClass(st.selected);
                }

            });
        }

    });


    $.fn[pluginName] = function ( options ) {
        var args = arguments;

        // Is the first parameter an object (options), or was omitted,
        // instantiate a new instance of the plugin.
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {

                // Only allow the plugin to be instantiated once,
                // so we check that the element has no plugin instantiation yet
                if (!$.data(this, 'plugin_' + pluginName)) {

                    // if it has no instance, create a new one,
                    // pass options to our plugin constructor,
                    // and store the plugin instance
                    // in the elements jQuery data object.
                    $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
                }
            });

        // If the first parameter is a string and it doesn't start
        // with an underscore or "contains" the `init`-function,
        // treat this as a call to a public method.
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            // Cache the method call
            // to make it possible
            // to return a value
            var returns;

            this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);

                // Tests that there's already a plugin-instance
                // and checks that the requested public method exists
                if (instance instanceof Plugin && typeof instance[options] === 'function') {

                    // Call the method of our plugin instance,
                    // and pass it the supplied arguments.
                    returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                  $.data(this, 'plugin_' + pluginName, null);
                }
            });

            // If the earlier cached method
            // gives a value back return the value,
            // otherwise return this to preserve chainability.
            return returns !== undefined ? returns : this;
        }
    }

}(jQuery, window, document));


/*! 
 * ================== js/libs/plugins/lazysizes.js =================== 
 **/ 

(function(window, factory) {
	var lazySizes = factory(window, window.document);
	window.lazySizes = lazySizes;
	if(typeof module == 'object' && module.exports){
		module.exports = lazySizes;
	}
}(window, function l(window, document) {
	'use strict';
	/*jshint eqnull:true */
	if(!document.getElementsByClassName){return;}

	var lazysizes, lazySizesConfig;

	var docElem = document.documentElement;

	var Date = window.Date;

	var supportPicture = window.HTMLPictureElement;

	var _addEventListener = 'addEventListener';

	var _getAttribute = 'getAttribute';

	var addEventListener = window[_addEventListener];

	var setTimeout = window.setTimeout;

	var requestAnimationFrame = window.requestAnimationFrame || setTimeout;

	var requestIdleCallback = window.requestIdleCallback;

	var regPicture = /^picture$/i;

	var loadEvents = ['load', 'error', 'lazyincluded', '_lazyloaded'];

	var regClassCache = {};

	var forEach = Array.prototype.forEach;

	var hasClass = function(ele, cls) {
		if(!regClassCache[cls]){
			regClassCache[cls] = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		}
		return regClassCache[cls].test(ele[_getAttribute]('class') || '') && regClassCache[cls];
	};

	var addClass = function(ele, cls) {
		if (!hasClass(ele, cls)){
			ele.setAttribute('class', (ele[_getAttribute]('class') || '').trim() + ' ' + cls);
		}
	};

	var removeClass = function(ele, cls) {
		var reg;
		if ((reg = hasClass(ele,cls))) {
			ele.setAttribute('class', (ele[_getAttribute]('class') || '').replace(reg, ' '));
		}
	};

	var addRemoveLoadEvents = function(dom, fn, add){
		var action = add ? _addEventListener : 'removeEventListener';
		if(add){
			addRemoveLoadEvents(dom, fn);
		}
		loadEvents.forEach(function(evt){
			dom[action](evt, fn);
		});
	};

	var triggerEvent = function(elem, name, detail, noBubbles, noCancelable){
		var event = document.createEvent('CustomEvent');

		if(!detail){
			detail = {};
		}

		detail.instance = lazysizes;

		event.initCustomEvent(name, !noBubbles, !noCancelable, detail);

		elem.dispatchEvent(event);
		return event;
	};

	var updatePolyfill = function (el, full){
		var polyfill;
		if( !supportPicture && ( polyfill = (window.picturefill || lazySizesConfig.pf) ) ){
			polyfill({reevaluate: true, elements: [el]});
		} else if(full && full.src){
			el.src = full.src;
		}
	};

	var getCSS = function (elem, style){
		return (getComputedStyle(elem, null) || {})[style];
	};

	var getWidth = function(elem, parent, width){
		width = width || elem.offsetWidth;

		while(width < lazySizesConfig.minSize && parent && !elem._lazysizesWidth){
			width =  parent.offsetWidth;
			parent = parent.parentNode;
		}

		return width;
	};

	var rAF = (function(){
		var running, waiting;
		var firstFns = [];
		var secondFns = [];
		var fns = firstFns;

		var run = function(){
			var runFns = fns;

			fns = firstFns.length ? secondFns : firstFns;

			running = true;
			waiting = false;

			while(runFns.length){
				runFns.shift()();
			}

			running = false;
		};

		var rafBatch = function(fn, queue){
			if(running && !queue){
				fn.apply(this, arguments);
			} else {
				fns.push(fn);

				if(!waiting){
					waiting = true;
					(document.hidden ? setTimeout : requestAnimationFrame)(run);
				}
			}
		};

		rafBatch._lsFlush = run;

		return rafBatch;
	})();

	var rAFIt = function(fn, simple){
		return simple ?
			function() {
				rAF(fn);
			} :
			function(){
				var that = this;
				var args = arguments;
				rAF(function(){
					fn.apply(that, args);
				});
			}
		;
	};

	var throttle = function(fn){
		var running;
		var lastTime = 0;
		var gDelay = 125;
		var rICTimeout = lazySizesConfig.ricTimeout;
		var run = function(){
			running = false;
			lastTime = Date.now();
			fn();
		};
		var idleCallback = requestIdleCallback && lazySizesConfig.ricTimeout ?
			function(){
				requestIdleCallback(run, {timeout: rICTimeout});

				if(rICTimeout !== lazySizesConfig.ricTimeout){
					rICTimeout = lazySizesConfig.ricTimeout;
				}
			} :
			rAFIt(function(){
				setTimeout(run);
			}, true)
		;

		return function(isPriority){
			var delay;

			if((isPriority = isPriority === true)){
				rICTimeout = 33;
			}

			if(running){
				return;
			}

			running =  true;

			delay = gDelay - (Date.now() - lastTime);

			if(delay < 0){
				delay = 0;
			}

			if(isPriority || (delay < 9 && requestIdleCallback)){
				idleCallback();
			} else {
				setTimeout(idleCallback, delay);
			}
		};
	};

	//based on http://modernjavascript.blogspot.de/2013/08/building-better-debounce.html
	var debounce = function(func) {
		var timeout, timestamp;
		var wait = 99;
		var run = function(){
			timeout = null;
			func();
		};
		var later = function() {
			var last = Date.now() - timestamp;

			if (last < wait) {
				setTimeout(later, wait - last);
			} else {
				(requestIdleCallback || run)(run);
			}
		};

		return function() {
			timestamp = Date.now();

			if (!timeout) {
				timeout = setTimeout(later, wait);
			}
		};
	};

	(function(){
		var prop;

		var lazySizesDefaults = {
			lazyClass: 'lazyload',
			loadedClass: 'lazyloaded',
			loadingClass: 'lazyloading',
			preloadClass: 'lazypreload',
			errorClass: 'lazyerror',
			//strictClass: 'lazystrict',
			autosizesClass: 'lazyautosizes',
			srcAttr: 'data-src',
			srcsetAttr: 'data-srcset',
			sizesAttr: 'data-sizes',
			//preloadAfterLoad: false,
			minSize: 40,
			customMedia: {},
			init: true,
			expFactor: 1.5,
			hFac: 0.8,
			loadMode: 2,
			loadHidden: true,
			ricTimeout: 300,
		};

		lazySizesConfig = window.lazySizesConfig || window.lazysizesConfig || {};

		for(prop in lazySizesDefaults){
			if(!(prop in lazySizesConfig)){
				lazySizesConfig[prop] = lazySizesDefaults[prop];
			}
		}

		window.lazySizesConfig = lazySizesConfig;

		setTimeout(function(){
			if(lazySizesConfig.init){
				init();
			}
		});
	})();

	var loader = (function(){
		var preloadElems, isCompleted, resetPreloadingTimer, loadMode, started;

		var eLvW, elvH, eLtop, eLleft, eLright, eLbottom;

		var defaultExpand, preloadExpand, hFac;

		var regImg = /^img$/i;
		var regIframe = /^iframe$/i;

		var supportScroll = ('onscroll' in window) && !(/glebot/.test(navigator.userAgent));

		var shrinkExpand = 0;
		var currentExpand = 0;

		var isLoading = 0;
		var lowRuns = -1;

		var resetPreloading = function(e){
			isLoading--;
			if(e && e.target){
				addRemoveLoadEvents(e.target, resetPreloading);
			}

			if(!e || isLoading < 0 || !e.target){
				isLoading = 0;
			}
		};

		var isNestedVisible = function(elem, elemExpand){
			var outerRect;
			var parent = elem;
			var visible = getCSS(document.body, 'visibility') == 'hidden' || getCSS(elem, 'visibility') != 'hidden';

			eLtop -= elemExpand;
			eLbottom += elemExpand;
			eLleft -= elemExpand;
			eLright += elemExpand;

			while(visible && (parent = parent.offsetParent) && parent != document.body && parent != docElem){
				visible = ((getCSS(parent, 'opacity') || 1) > 0);

				if(visible && getCSS(parent, 'overflow') != 'visible'){
					outerRect = parent.getBoundingClientRect();
					visible = eLright > outerRect.left &&
						eLleft < outerRect.right &&
						eLbottom > outerRect.top - 1 &&
						eLtop < outerRect.bottom + 1
					;
				}
			}

			return visible;
		};

		var checkElements = function() {
			var eLlen, i, rect, autoLoadElem, loadedSomething, elemExpand, elemNegativeExpand, elemExpandVal, beforeExpandVal;

			var lazyloadElems = lazysizes.elements;

			if((loadMode = lazySizesConfig.loadMode) && isLoading < 8 && (eLlen = lazyloadElems.length)){

				i = 0;

				lowRuns++;

				if(preloadExpand == null){
					if(!('expand' in lazySizesConfig)){
						lazySizesConfig.expand = docElem.clientHeight > 500 && docElem.clientWidth > 500 ? 500 : 370;
					}

					defaultExpand = lazySizesConfig.expand;
					preloadExpand = defaultExpand * lazySizesConfig.expFactor;
				}

				if(currentExpand < preloadExpand && isLoading < 1 && lowRuns > 2 && loadMode > 2 && !document.hidden){
					currentExpand = preloadExpand;
					lowRuns = 0;
				} else if(loadMode > 1 && lowRuns > 1 && isLoading < 6){
					currentExpand = defaultExpand;
				} else {
					currentExpand = shrinkExpand;
				}

				for(; i < eLlen; i++){

					if(!lazyloadElems[i] || lazyloadElems[i]._lazyRace){continue;}

					if(!supportScroll){unveilElement(lazyloadElems[i]);continue;}

					if(!(elemExpandVal = lazyloadElems[i][_getAttribute]('data-expand')) || !(elemExpand = elemExpandVal * 1)){
						elemExpand = currentExpand;
					}

					if(beforeExpandVal !== elemExpand){
						eLvW = innerWidth + (elemExpand * hFac);
						elvH = innerHeight + elemExpand;
						elemNegativeExpand = elemExpand * -1;
						beforeExpandVal = elemExpand;
					}

					rect = lazyloadElems[i].getBoundingClientRect();

					if ((eLbottom = rect.bottom) >= elemNegativeExpand &&
						(eLtop = rect.top) <= elvH &&
						(eLright = rect.right) >= elemNegativeExpand * hFac &&
						(eLleft = rect.left) <= eLvW &&
						(eLbottom || eLright || eLleft || eLtop) &&
						(lazySizesConfig.loadHidden || getCSS(lazyloadElems[i], 'visibility') != 'hidden') &&
						((isCompleted && isLoading < 3 && !elemExpandVal && (loadMode < 3 || lowRuns < 4)) || isNestedVisible(lazyloadElems[i], elemExpand))){
						unveilElement(lazyloadElems[i]);
						loadedSomething = true;
						if(isLoading > 9){break;}
					} else if(!loadedSomething && isCompleted && !autoLoadElem &&
						isLoading < 4 && lowRuns < 4 && loadMode > 2 &&
						(preloadElems[0] || lazySizesConfig.preloadAfterLoad) &&
						(preloadElems[0] || (!elemExpandVal && ((eLbottom || eLright || eLleft || eLtop) || lazyloadElems[i][_getAttribute](lazySizesConfig.sizesAttr) != 'auto')))){
						autoLoadElem = preloadElems[0] || lazyloadElems[i];
					}
				}

				if(autoLoadElem && !loadedSomething){
					unveilElement(autoLoadElem);
				}
			}
		};

		var throttledCheckElements = throttle(checkElements);

		var switchLoadingClass = function(e){
			addClass(e.target, lazySizesConfig.loadedClass);
			removeClass(e.target, lazySizesConfig.loadingClass);
			addRemoveLoadEvents(e.target, rafSwitchLoadingClass);
			triggerEvent(e.target, 'lazyloaded');
		};
		var rafedSwitchLoadingClass = rAFIt(switchLoadingClass);
		var rafSwitchLoadingClass = function(e){
			rafedSwitchLoadingClass({target: e.target});
		};

		var changeIframeSrc = function(elem, src){
			try {
				elem.contentWindow.location.replace(src);
			} catch(e){
				elem.src = src;
			}
		};

		var handleSources = function(source){
			var customMedia;

			var sourceSrcset = source[_getAttribute](lazySizesConfig.srcsetAttr);

			if( (customMedia = lazySizesConfig.customMedia[source[_getAttribute]('data-media') || source[_getAttribute]('media')]) ){
				source.setAttribute('media', customMedia);
			}

			if(sourceSrcset){
				source.setAttribute('srcset', sourceSrcset);
			}
		};

		var lazyUnveil = rAFIt(function (elem, detail, isAuto, sizes, isImg){
			var src, srcset, parent, isPicture, event, firesLoad;

			if(!(event = triggerEvent(elem, 'lazybeforeunveil', detail)).defaultPrevented){

				if(sizes){
					if(isAuto){
						addClass(elem, lazySizesConfig.autosizesClass);
					} else {
						elem.setAttribute('sizes', sizes);
					}
				}

				srcset = elem[_getAttribute](lazySizesConfig.srcsetAttr);
				src = elem[_getAttribute](lazySizesConfig.srcAttr);

				if(isImg) {
					parent = elem.parentNode;
					isPicture = parent && regPicture.test(parent.nodeName || '');
				}

				firesLoad = detail.firesLoad || (('src' in elem) && (srcset || src || isPicture));

				event = {target: elem};

				if(firesLoad){
					addRemoveLoadEvents(elem, resetPreloading, true);
					clearTimeout(resetPreloadingTimer);
					resetPreloadingTimer = setTimeout(resetPreloading, 2500);

					addClass(elem, lazySizesConfig.loadingClass);
					addRemoveLoadEvents(elem, rafSwitchLoadingClass, true);
				}

				if(isPicture){
					forEach.call(parent.getElementsByTagName('source'), handleSources);
				}

				if(srcset){
					elem.setAttribute('srcset', srcset);
				} else if(src && !isPicture){
					if(regIframe.test(elem.nodeName)){
						changeIframeSrc(elem, src);
					} else {
						elem.src = src;
					}
				}

				if(isImg && (srcset || isPicture)){
					updatePolyfill(elem, {src: src});
				}
			}

			if(elem._lazyRace){
				delete elem._lazyRace;
			}
			removeClass(elem, lazySizesConfig.lazyClass);

			rAF(function(){
				if( !firesLoad || (elem.complete && elem.naturalWidth > 1)){
					if(firesLoad){
						resetPreloading(event);
					} else {
						isLoading--;
					}
					switchLoadingClass(event);
				}
			}, true);
		});

		var unveilElement = function (elem){
			var detail;

			var isImg = regImg.test(elem.nodeName);

			//allow using sizes="auto", but don't use. it's invalid. Use data-sizes="auto" or a valid value for sizes instead (i.e.: sizes="80vw")
			var sizes = isImg && (elem[_getAttribute](lazySizesConfig.sizesAttr) || elem[_getAttribute]('sizes'));
			var isAuto = sizes == 'auto';

			if( (isAuto || !isCompleted) && isImg && (elem[_getAttribute]('src') || elem.srcset) && !elem.complete && !hasClass(elem, lazySizesConfig.errorClass) && hasClass(elem, lazySizesConfig.lazyClass)){return;}

			detail = triggerEvent(elem, 'lazyunveilread').detail;

			if(isAuto){
				 autoSizer.updateElem(elem, true, elem.offsetWidth);
			}

			elem._lazyRace = true;
			isLoading++;

			lazyUnveil(elem, detail, isAuto, sizes, isImg);
		};

		var onload = function(){
			if(isCompleted){return;}
			if(Date.now() - started < 999){
				setTimeout(onload, 999);
				return;
			}
			var afterScroll = debounce(function(){
				lazySizesConfig.loadMode = 3;
				throttledCheckElements();
			});

			isCompleted = true;

			lazySizesConfig.loadMode = 3;

			throttledCheckElements();

			addEventListener('scroll', function(){
				if(lazySizesConfig.loadMode == 3){
					lazySizesConfig.loadMode = 2;
				}
				afterScroll();
			}, true);
		};

		return {
			_: function(){
				started = Date.now();

				lazysizes.elements = document.getElementsByClassName(lazySizesConfig.lazyClass);
				preloadElems = document.getElementsByClassName(lazySizesConfig.lazyClass + ' ' + lazySizesConfig.preloadClass);
				hFac = lazySizesConfig.hFac;

				addEventListener('scroll', throttledCheckElements, true);

				addEventListener('resize', throttledCheckElements, true);

				if(window.MutationObserver){
					new MutationObserver( throttledCheckElements ).observe( docElem, {childList: true, subtree: true, attributes: true} );
				} else {
					docElem[_addEventListener]('DOMNodeInserted', throttledCheckElements, true);
					docElem[_addEventListener]('DOMAttrModified', throttledCheckElements, true);
					setInterval(throttledCheckElements, 999);
				}

				addEventListener('hashchange', throttledCheckElements, true);

				//, 'fullscreenchange'
				['focus', 'mouseover', 'click', 'load', 'transitionend', 'animationend', 'webkitAnimationEnd'].forEach(function(name){
					document[_addEventListener](name, throttledCheckElements, true);
				});

				if((/d$|^c/.test(document.readyState))){
					onload();
				} else {
					addEventListener('load', onload);
					document[_addEventListener]('DOMContentLoaded', throttledCheckElements);
					setTimeout(onload, 20000);
				}

				if(lazysizes.elements.length){
					checkElements();
					rAF._lsFlush();
				} else {
					throttledCheckElements();
				}
			},
			checkElems: throttledCheckElements,
			unveil: unveilElement
		};
	})();


	var autoSizer = (function(){
		var autosizesElems;

		var sizeElement = rAFIt(function(elem, parent, event, width){
			var sources, i, len;
			elem._lazysizesWidth = width;
			width += 'px';

			elem.setAttribute('sizes', width);

			if(regPicture.test(parent.nodeName || '')){
				sources = parent.getElementsByTagName('source');
				for(i = 0, len = sources.length; i < len; i++){
					sources[i].setAttribute('sizes', width);
				}
			}

			if(!event.detail.dataAttr){
				updatePolyfill(elem, event.detail);
			}
		});
		var getSizeElement = function (elem, dataAttr, width){
			var event;
			var parent = elem.parentNode;

			if(parent){
				width = getWidth(elem, parent, width);
				event = triggerEvent(elem, 'lazybeforesizes', {width: width, dataAttr: !!dataAttr});

				if(!event.defaultPrevented){
					width = event.detail.width;

					if(width && width !== elem._lazysizesWidth){
						sizeElement(elem, parent, event, width);
					}
				}
			}
		};

		var updateElementsSizes = function(){
			var i;
			var len = autosizesElems.length;
			if(len){
				i = 0;

				for(; i < len; i++){
					getSizeElement(autosizesElems[i]);
				}
			}
		};

		var debouncedUpdateElementsSizes = debounce(updateElementsSizes);

		return {
			_: function(){
				autosizesElems = document.getElementsByClassName(lazySizesConfig.autosizesClass);
				addEventListener('resize', debouncedUpdateElementsSizes);
			},
			checkElems: debouncedUpdateElementsSizes,
			updateElem: getSizeElement
		};
	})();

	var init = function(){
		if(!init.i){
			init.i = true;
			autoSizer._();
			loader._();
		}
	};

	lazysizes = {
		cfg: lazySizesConfig,
		autoSizer: autoSizer,
		loader: loader,
		init: init,
		uP: updatePolyfill,
		aC: addClass,
		rC: removeClass,
		hC: hasClass,
		fire: triggerEvent,
		gW: getWidth,
		rAF: rAF,
	};

	return lazysizes;
}
));


/*! 
 * ================== js/libs/plugins/averta/averta-jquery.attachmedia.js =================== 
 **/ 

/*!
 * Averta Attach Media - A jQuery plugin for attaching and managing media files in WordPress meta fields with thumbnail preview
 *
 * @version     1.2.0
 * @requires    jQuery 1.9+ | jQuery-ui 1.11+
 * @author      Averta [averta.net]
 * @package     Axiom Framework
 * @copyright   Copyright © 2016 Averta, all rights reserved
 */

/**
 * USAGE :
 * -----------------------------------------------------------------------------------------------------
 * HTML:
 *
 * JS:
   $('#container').avertaAttachMedia({
        //Options
   });

 * ---------------------------------------------------------------------------------------------------------
 **/

;(function ( $, window, document, undefined ) {

    var pluginName = 'avertaAttachMedia',
        defaults = {

            item            : 'am-item',                // attached media item in dragable list [css class name]
            thumbnail       : 'am-img-holder',          // thumbnail image [css class name]
            caption         : 'am-img-caption',         // thumbnail caption [css class name]
            removeItem      : 'am-remove',              // remove item button [class name]
            sortable        : 'axi-attach-items',       // soratable container
            addItem         : 'axi-add-new',            // add attachment button
            addItemDisable  : 'axi-add-new-disabled',   // add attachment button
            srcMap          : null,                     // id:src map object
            nameMap         : null,                     // id:name map object
            sortableOptions : {},                       // extend jquery ui sortable options
            autoHideElement : true,                     // hide input element after init
            confirmOnRemove : true,                     // ask before removing attachment
            multiple        : true,                     // enables multiple section in wp's media uploader
            limit           : 9999,                     // specifies maximum number of items
            type            : null,                     // select media uploader attachment type
            insertCaption   : false,                    // whether insert caption or not

            // Alternative image when the thumbnail was undefined in src map.
            altSrc          : 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',

            l10n            : {                         // localization object
                addToList       : 'Add image(s)',
                uploaderTitle   : 'Select Image',
                uploderSubmit   : 'Add image',
                removeConfirm   : 'Are you sure that you want to remove this attachment?'
            },
        },

        attributesMap = {
            'media-type'       : 'type',
            'multiple'         : 'multiple',
            'limit'            : 'limit',
            'confirm'          : 'confirmOnRemove',
            'caption'          : 'insertCaption',
            'uploader-submite' : { l10n: 'uploderSubmit' },
            'uploader-title'   : { l10n: 'uploaderTitle'},
            'add-to-list'      : { l10n: 'addToList' },
            'confirm-text'     : { l10n: 'removeConfirm' }
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        this.$element = $(element);
        this.options = $.extend({}, defaults, options) ;

        // read attributes
        for ( var key in attributesMap ) {
            var value = attributesMap[ key ],
                dataAttr = this.$element.data( key );

            if ( dataAttr === undefined ) {
                continue;
            }

            if ( typeof value === 'object' ) {
                this.options.l10n[ value.l10n ] = dataAttr;
            } else {
                this.options[ value ] = dataAttr;
            }
        }

        this._defaults = defaults;
        this._name = pluginName;
        this._full = false;
        this.count = 0;
        this.init();
    }

    $.extend(Plugin.prototype, {

        init : function(){
            var item,
                st = this.options;

            // hide element
            if ( st.autoHideElement ) {
                this.$element.css('display', 'none');
            }


            var val = this.$element.val();
            if ( val.replace(/\s*/, '') === '' ) {
                this.ids = [];
            } else {
                this.ids = val.split(',');
            }

            this.$itemList = $('<div class="' + st.sortable + '"></div>');

            // count
            this.count = Math.min(this.ids.length, st.limit);

            // create add button
            this.$addItem = $('<a href="#" class="' + st.addItem + '">' + st.l10n.addToList + '</a>')
                .click($.proxy(this.addItem, this));

            // generate items
            for ( var i = 0, l = this.count; i !== l; i++ ) {
                if( item = this._generateItem(this.ids[i]) ) {
                    item.appendTo(this.$itemList);
                }
            }

            // setup jquery ui sortable
            this.$itemList.sortable($.extend({
                update: $.proxy(this.update, this)
            }, st.sortableOptions ));


            this.$element.after(this.$itemList);
            this.$itemList.after(this.$addItem);

            // create media uploader frame
            this.uploaderFrame = wp.media.frames.frame = wp.media({
                title: st.l10n.uploaderTitle , // the select button label in media uploader
                multiple: st.multiple,         // use single image upload or multiple?
                frame: 'select',
                library: { type: st.type },
                button : { text : st.l10n.uploderSubmit }
            });

            this.uploaderFrame.on('select', $.proxy(this._onImageSelect, this));

            // check limit on init
            this._checkLimit();
        },

        /**
         * checks items count and enable or disables add new item button.
         */
        _checkLimit : function () {
            var st = this.options;

            if ( !this._full && this.count >= st.limit ) {
                this.count = st.limit;
                this._full = true;
                this.$addItem.addClass(st.addItemDisable);
            } else if ( this._full ) {
                this._full = false;
                this.$addItem.removeClass(st.addItemDisable);
            }

        },

        /**
         * Generates a new attachment item
         * @private
         * @param   {String} attachmentId   WordPress attachment id
         * @param   {String} src            thumbnail src
         * @param   {String} name           attachment name
         * @return  {jQuery Element}        generated item
         */
        _generateItem : function (attachmentId, src, name ) {
            var st = this.options;

            if ( src == null ) {
                if ( !st.srcMap ) { src = st.altSrc; }
                src = st.srcMap[attachmentId] || st.altSrc;
            }

            // if the altSrc was null too, skip the item
            if ( src === null ) {
                return false;
            }

            if ( name == null && st.nameMap ) {
                name = st.nameMap[attachmentId];
            }

            var item =  $('<div class="' + st.item + ' axi-media-' + attachmentId + '" data-attachment-id="' + attachmentId + '">' +
                          '     <img class="' + st.thumbnail + '" src="' + src + '" alt="Attachment image (' + attachmentId + ')" />' +
                          '</div>');

            if ( st.insertCaption ) {
                item.append( '<span class="' + st.caption + '" >' + name + '</span>' );
            }

            // add remove btn element
            $('<div class="' + st.removeItem + '"></div>').appendTo(item).click($.proxy(this.removeItem, this));

            return item;
        },


        /**
         * When an image is selected
         * @private
         */
        _onImageSelect : function () {
            var selection = this.uploaderFrame.state().get('selection'),
                self = this;

            selection.map(function(attachment) {
                attachment = attachment.toJSON();
                //console
                if ( self.options.limit > self.count ) {
                    self.count ++;

                    // select based on type
                    var image;
                    if ( attachment.type === 'image' ) {
                        if ( attachment.sizes ) {
                            image = (attachment.sizes.thumbnail || attachment.sizes.full).url;
                        } else {
                            image = attachment.url;
                        }
                    } else if ( attachment.image ) {
                        image = attachment.image.src;
                    } else {
                        image = attachment.icon;
                    }

                    self._generateItem(attachment.id, image, attachment.name)
                        .appendTo(self.$itemList);
                    self._checkLimit();
                }
            });

            this.update();
        },

        /**
         * Updates input element
         * @public
         */
        update : function () {
            this.ids = this.$itemList.sortable('toArray', {attribute:'data-attachment-id'});
            this.$element.val(this.ids).trigger('change');
        },


        /**
         * Removes attachment item
         * This method can be used as public method also it's a event handler for remove button onclick event.
         * @public
         * @param  {jQuery Event | String} item
         */
        removeItem : function (item) {

            if ( this.options.confirmOnRemove && !confirm(this.options.l10n.removeConfirm)) {
                return;
            }

            if ( typeof item === 'string' ) {
                this.$itemList.find('.axi-media-' + item).remove();
            } else {
                $(item.target).parent().remove();
            }

            this.count --;
            this.update();
            this._checkLimit();
        },

        /**
         * Opens WP media uploader
         * @public
         */
        addItem : function (e) {

            // is there space for new item?
            if ( this._full ) {
                return;
            }

            this.uploaderFrame.open();

            if ( e ) {
                e.preventDefault();
            }
        }

    });

    $.fn[pluginName] = function ( options ) {
        var args = arguments;

        // Is the first parameter an object (options), or was omitted,
        // instantiate a new instance of the plugin.
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {

                // Only allow the plugin to be instantiated once,
                // so we check that the element has no plugin instantiation yet
                if (!$.data(this, 'plugin_' + pluginName)) {

                    // if it has no instance, create a new one,
                    // pass options to our plugin constructor,
                    // and store the plugin instance
                    // in the elements jQuery data object.
                    $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
                }
            });

        // If the first parameter is a string and it doesn't start
        // with an underscore or "contains" the `init`-function,
        // treat this as a call to a public method.
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            // Cache the method call
            // to make it possible
            // to return a value
            var returns;

            this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);

                // Tests that there's already a plugin-instance
                // and checks that the requested public method exists
                if (instance instanceof Plugin && typeof instance[options] === 'function') {

                    // Call the method of our plugin instance,
                    // and pass it the supplied arguments.
                    returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                  $.data(this, 'plugin_' + pluginName, null);
                }
            });

            // If the earlier cached method
            // gives a value back return the value,
            // otherwise return this to preserve chainability.
            return returns !== undefined ? returns : this;
        }
    };

}(jQuery, window, document));


/*! 
 * ================== js/libs/plugins/averta/averta-jquery.fontselector.js =================== 
 **/ 

/*!
 * Averta jQuery Font Selector - A jQuery visual font selecting tool with supporting Google fonts.
 *
 * @version     1.0.0
 * @requires    jQuery 1.9+ | averta.gfonts.js
 * @author      Averta [averta.net]
 * @package     Axiom Framework
 * @copyright   Copyright © 2018-06-12 Averta, all rights reserved
 */

;(function($){

	var api = 'AIzaSyBYkMl1dDDRSmAyHjKInEk9nCgb9-tDQqo',
		url = 'https://www.googleapis.com/webfonts/v1/webfonts',
		list = null,
		options = null;

	var GFonts = function(){},
		waitingList = [];

	GFonts.isLoading = -1;

	GFonts.loadedFonts = [];

	/**
	 * Load and cache list of google fonts
	 * @param  {callback} onLoad
	 * @return {void}
	 */
 	GFonts.getList = function(onLoad){
 		if( list && onLoad ){
 			onLoad.call(null, list)
 			return;
 		}

 		if ( GFonts.isLoading === 1 ) {
 			if ( onLoad ) {
 				waitingList.push(onLoad);
 			}
 			return;
 		}

 		GFonts.isLoading = 1;

 		$.getJSON( url + '?key=' + api, function(data, success, context){
 			GFonts.isLoading = 0;
 			GFonts.listLoaded = true;
	 		GFonts.list = data;
 			if( onLoad ){
 				onLoad.call(null, data, context.responseText);
 			}

 			// call wating list callbacks
 			for ( var i = 0, l = waitingList.length; i !== l; i++ ) {
 				waitingList[i].call(null, data, context.responseText);
 			}

 		});
 	};

 	/**
 	 * generates an option list
 	 * stores variants as data('variants') in each <option></option>
 	 * @return {string}
 	 */
 	GFonts.generateSelectList = function(){
 		if( !list ) return;

 		if( options ) return options;

 		var _options = '';

 		$.each(list.items, function (index, value) {

 			_options += '<option value="' + value.family + '" data-variants="' + value.variants.join(',')  + '">' + value.family + '</option>';
           /* select.append($("<option></option>")
                  .attr("value" , value.family)
                  .data('variants' , value.variants)
                  .text(value.family));*/
        });

 		options = _options;

        return options;
 	}

 	/**
 	 * Load new google font
 	 * @param  {string} font     font family
 	 * @param  {string} variants  list of font variants (100,200,300,...)
 	 */
 	GFonts.load = function(font, variants){
 		if( GFonts.loadedFonts.indexOf(font) === -1 ){
 			$('head').append('<link rel="stylesheet" href="//fonts.googleapis.com/css?family=' + escape(font) + ':' + variants + '" >');
			GFonts.loadedFonts.push(font);
		}
 	};

 	window.GFonts = GFonts;

})(jQuery);
;(function ( $, window, document, undefined ) {

	"use strict";

	// Create the defaults once
	var pluginName = 'avertaFontSelector',
		localStorageCached = false,
		cachedGFontsList = null,
		loadedFonts = [],
		defaults = {
			preview     	 	: 'axi-fs-preview',        	// font preview element [class name]
			fontSelect	     	: 'axi-fs-font',         	// fonts select list [class name]
			thicknessSelect  	: 'axi-fs-thickness',    	// font thickness select list [class name]
			previwTextInput  	: 'axi-fs-preview-input',	// font preview text input element [class name]
			container 			: 'axi-fs-container',		// font select div container element [class name]
			lodaing 			: 'axi-fs-loading', 		// font select loading element [class name]

			autoHideElement  	: true,                     // hide HTML select element after init
			insertThickness  	: true,                   	// whether insert font thickness select list element
			insertPreview 	 	: true,						// whether insert font preview
			insertPreviewText	: true,						// whether insert font preview text input element
			previewText 		: 'Lorem ipsum sit amet.',	// preview text

			googleFontsPrefix 	: '-gf-', 					// Google fonts prefix
			systemFontsPrefix 	: '-sys-',					// System fonts prefix
			geaFontsPrefix		: '-gea-',					// Google Early Access fonts prefix
			customFontsPrefix	: '-cus-', 					// Custom fonts prefix

			useGoogleFonts 		: true, 					// whether load google fonts
			systemFonts 		: [],						// system font list DS -> [..,{name:'', thickness:'300,bold,600'},..]
			geaFonts 			: [], 						// Google Early Access fonts DS -> [..,{name:'', thickness:'300,bold,600', url:''},..]
			customFonts 		: [], 						// Custom fonts DS -> [..,{name:'', thickness:'300,bold,600', url:''},..]

			saveToLocalStorage 	: true,						// whether save Google fonts list in localStorage
			lsExpireTime		: 5,						// expire duration for cached fonts in localStorage [days]

			l10n : {										// localization object
				previewTextLabel 		: 'Preview text:',
				fontLabel		 		: 'Font:',
				fontSizeLabel 	 		: 'Size:',
				fontStyleLabel			: 'Style:',
				googleFonts 	 		: 'Google Fonts',
				systemFonts 	 		: 'System Fonts',
				geaFonts 		 		: 'Early Access Fonts',
				customFonts 	 		: 'Custom Fonts'
			}

		};

	// The actual plugin constructor
	function Plugin( element, options ) {
		this.element = element;
		this.$element = $(element);
		this.options = $.extend( {}, defaults, options) ;

		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	}

	$.extend(Plugin.prototype, {

		init : function(){
			var self = this,
				st = self.options;

			if ( st.autoHideElement ) {
				this.$element.css('display', 'none');
			}

			// initial value for previewStr
			self.previewStr = st.previewText;

			// plugin html elements
			self.$container = $('<div class="' + st.container + '"></div>').insertAfter(this.$element).css('display', 'none');
			self.$loading 	= $('<div class="' + st.loading + '"></div>').insertAfter(this.$element)

			// font select html element
			self.$fontSelectList = $('<select class="' + st.fontSelect + '"></select>')
								   .appendTo(self.$container);
			$('<div class="' + st.fontSelect + '-cont"><label>' + st.l10n.fontLabel + '</label></div>')
					.appendTo(self.$container)
					.append(self.$fontSelectList);

			// font thickness html element
			if ( st.insertThickness ) {
				self.$thicknessSelectList = $('<select class=" '+ st.thicknessSelect + '"></select>')
											.on('change', $.proxy(self._onThicknessChange, self));

				$('<div class="' + st.thicknessSelect + '-cont"><label>' + st.l10n.fontStyleLabel	 + '</label></div>')
					.appendTo(self.$container)
					.append(self.$thicknessSelectList);
			}

			// preview element
			if ( st.insertPreview ) {
				self.$preview = $('<div class=" '+ st.preview + '"></div>');

				// preview text input element
				if ( st.insertPreviewText ) {
					self.$previewTextInput = $('<input type="text" class="' + st.previwTextInput + '" value="' + st.previewText + '" />')
										     .on('change keydown', function(){
										     	// update preview test
										     	self.previewStr = $(this).val();
										     	self._updatePreview();
										     });
					$('<div class="' + st.previwTextInput + '-cont"><label>' + st.l10n.previewTextLabel + '</label></div>')
						.appendTo(self.$container)
						.append(self.$previewTextInput);
				}

				self.$preview.appendTo(self.$container);
			}

			// parse input value
			var val = self.$element.val(),
				prefixLen = 0;

			if ( val.length > 1 ){
				// prefix:
				if ( val.indexOf(st.googleFontsPrefix) !== -1 ) {
					self.currentFontType = 'gfont';
					prefixLen = st.googleFontsPrefix.length;
				} else if ( val.indexOf(st.systemFontsPrefix) !== -1 ) {
					self.currentFontType = 'sysfont';
					prefixLen = st.systemFontsPrefix.length;
				} else if ( val.indexOf(st.customFontsPrefix) !== -1 ) {
					self.currentFontType = 'cusfont';
					prefixLen = st.customFontsPrefix.length;
				} else if ( val.indexOf(st.geaFontsPrefix) !== -1 ) {
					self.currentFontType = 'geafont';
					prefixLen = st.geaFontsPrefix.length;
				}

				// is value contains font thickness
				if ( val.indexOf(':') !== -1 ) {
					self.currentThikness = val.slice(val.lastIndexOf(':') + 1);
					self.currentFont = val.slice(prefixLen, val.lastIndexOf(':'));
				} else {
					self.currentFont = val.slice(prefixLen);
				}
			}

			self._getFonts();
			//self._updatePreview();
		},

		/**
		 * calculates numbers of days between two dates
		 * @private
		 * @param  {Date} date1  End date
		 * @param  {Date} date2  Start date
		 * @return {Number}
		 */
		_daysBetween : function (date1, date2) {

		    // The number of milliseconds in one day
		    var ONE_DAY = 1000 * 60 * 60 * 24;

		    // Calculate the difference in milliseconds
		    var difference_ms = Math.abs(date1 - date2);

		    // Convert back to days and return
		    return Math.round(difference_ms/ONE_DAY);

		},

		/**
		 * Prepare google fonts, it first looks localStorage (if enabled) for cached Google fonts if it is not available there or expired
		 * 	loads new list from Google font api.
		 *
		 * @private
		 */
		_getFonts : function () {
			var self = this,
				st = self.options,
				isls = typeof(Storage) !== "undefined"; // is local storage available

			if ( cachedGFontsList || !st.useGoogleFonts ) {
				self.gFontsList = cachedGFontsList;
				self._generateFontList();
				return;
			}

			// if local storage enabled
			if ( st.saveToLocalStorage && isls ) {
				// is it already cached?
				var gfs = localStorage.AxiGoogleFonts,
					expireDate = Date.parse(localStorage.AxiGoogleFontsDate);

				if ( gfs && expireDate && self._daysBetween(new Date().getTime(), expireDate) < st.lsExpireTime) {
					self.gFontsList = JSON.parse(gfs);
					cachedGFontsList = self.gFontsList;
					self._generateFontList();
					return;
				}
			}

			// it is not cached so lets load it
			GFonts.getList(function(list, data){
				// save to local storage
				if ( st.saveToLocalStorage && isls && !localStorageCached ) {
					localStorageCached = true;
					localStorage.AxiGoogleFonts = data;
					localStorage.AxiGoogleFontsDate = new Date();
				}

				self.gFontsList = list;
				cachedGFontsList = list;
				self._generateFontList();
			});


		},

		/**
		 * Generates fonts list select element
		 * @private
		 */
		_generateFontList : function () {
			var self = this,
				st = self.options,
				selectOptions = '', i, l;

			// remove loading
			self.$loading.remove();
			self.$container.css('display', '');

			// system fonts
			if ( st.systemFonts.length !== 0 ) {
	 			selectOptions += '<optgroup label="' + st.l10n.systemFonts + '">';
				for ( i = 0, l = st.systemFonts.length; i !== l; i++ ) {
					selectOptions += '<option value="' + st.systemFonts[i].name + '" data-type="sysfont" data-thickness="' + st.systemFonts[i].thickness  + '">' + st.systemFonts[i].name + '</option>';
				}
				selectOptions += '</optgroup>';
			}

			// google fonts
			if ( st.useGoogleFonts ) {
				cachedGFontsList = self.gFontsList;
				selectOptions += '<optgroup label="' + st.l10n.googleFonts + '">';
				$.each(self.gFontsList.items, function (index, value) {
		 			selectOptions += '<option value="' + value.family + '" data-type="gfont" data-thickness="' + value.variants.join(',')  + '">' + value.family + '</option>';
		        });
		        selectOptions += '</optgroup>';
			}

			// gea fonts
			if ( st.geaFonts.length !== 0 ) {
	 			selectOptions += '<optgroup label="' + st.l10n.geaFonts + '">';
				for ( i = 0, l = st.geaFonts.length; i !== l; i++ ) {
					selectOptions += '<option value="' + st.geaFonts[i].name + '" data-type="geafont" data-thickness="' + st.geaFonts[i].thickness  + '">' + st.geaFonts[i].name + '</option>';
				}
				selectOptions += '</optgroup>';
			}

			// custom fonts
			if ( st.customFonts.length !== 0 ) {
	 			selectOptions += '<optgroup label="' + st.l10n.customFonts + '">';
				for ( i = 0, l = st.customFonts.length; i !== l; i++ ) {
					selectOptions += '<option value="' + st.customFonts[i].name + '" data-type="cusfont" data-thickness="' + st.customFonts[i].thickness  + '">' + st.customFonts[i].name + '</option>';
				}
				selectOptions += '</optgroup>';
			}

			self.$fontSelectList.html(selectOptions)
				.on('change', $.proxy(self._onFontChange, self));

			if ( !self.currentFont ) {
				self.currentFont = self.$fontSelectList.find('option:first').val();
			}

			self.$fontSelectList.val(self.currentFont).trigger('change');
		},

		/**
		 * on font changed in font select list element
		 * @private
		 */
		_onFontChange : function (event) {

			var $this = $(event.currentTarget),
				self = this,
				st = self.options,
				foundThinkess = false,
				$selected = $this.find('option:selected');

			self.currentFont = $this.val();
			self.currentFontType = $selected.data('type');

			if ( st.insertThickness ) {
				// generate thickness select
				var options = '';
				self.currentFontThickness = $selected.data('thickness') || '';
				$.each(self.currentFontThickness.split(','), function (index, thickness) {
					var label = (thickness.indexOf('italic') !== -1 ? thickness.replace(/italic/, ' italic') : thickness);
					if ( thickness === self.currentThikness ) {
						options += '<option value="' + thickness + '" selected>' + label + '</option>';
						foundThinkess = true;
					} else {
						options += '<option value="' + thickness + '">' + label + '</option>';
					}
				});

				self.$thicknessSelectList.html(options);

				if ( !foundThinkess ) {
					self.$thicknessSelectList.find('option:first').prop('selected', true).trigger('change');
				}
			}

			self._updatePreview();
			self._updateInputValue();
		},

		/**
		 * on thickness changed in thickness select element
		 * @private
		 * @param  {jQuery event} event
		 */
		_onThicknessChange : function (event) {
			var $this = $(event.currentTarget),
				self = this

			self.currentThikness = $this.val();
			self._updatePreview();
			self._updateInputValue();
		},

		/**
		 * loads Google early access or custom fonts
		 * @private
		 * @param {string} fontName
		 * @param {string} type
		 */
		_loadFont : function (fontName, type) {
			if ( loadedFonts.indexOf(fontName) !== -1 ) {
				return;
			}

			var st = this.options,
				list, url;

			if ( type === 'cusfont' ) {
				list = st.customFonts
			} else if ( type === 'geafont') {
				list = st.geaFonts;
			} else {
				return;
			}

			// find font
			$.each(list, function(index, font){
				if ( font.name === fontName ) {
					url = font.url;
					return false;
				}
			});

			if ( !url ) {
				return;
			}

			$('head').append('<link rel="stylesheet" href="' + url + '" >');
			loadedFonts.push(fontName);
		},

		/**
		 * updates font preview
		 * @private
		 */
		_updatePreview : function () {

			if ( !this.options.insertPreview ) {
				return;
			}

			var self = this,
				st = self.options,
				prv = self.$preview;

			prv.html(self.previewStr)
			prv.css('font-family', self.currentFont);

			if ( self.currentThikness ) {
				prv.css('font-weight', self.currentThikness.replace(/italic/, ''));

				// italic style
				if ( self.currentThikness.indexOf('italic') !== -1 ) {
					prv.css('font-style', 'italic');
				} else {
					prv.css('font-style', '');
				}
			}

			// load fonts
			if ( st.useGoogleFonts && self.currentFontType === 'gfont' ) {
				GFonts.load(self.currentFont, self.currentFontThickness || '');
			} else if ( self.currentFontType === 'geafont' || self.currentFontType === 'cusfont'){
				self._loadFont(self.currentFont, self.currentFontType);
			}

		},

		/**
		 * updates font selector hidden input value
		 * @private
		 */
		_updateInputValue : function () {
			var self = this,
				st = self.options,
				val = '';

			switch ( self.currentFontType ) {
				case 'sysfont':
					val = st.systemFontsPrefix;
					break;
				case 'gfont':
					val = st.googleFontsPrefix;
					break;
				case 'geafont':
					val = st.geaFontsPrefix;
					break;
				case 'cusfont':
					val = st.customFontsPrefix;
			}

			val += self.currentFont;

			if ( st.insertThickness ) {
				val += ':' + self.currentThikness;
			}

			self.$element.val(val).trigger('change');
		}


	});


	$.fn[pluginName] = function ( options ) {
		var args = arguments;

		// Is the first parameter an object (options), or was omitted,
		// instantiate a new instance of the plugin.
		if (options === undefined || typeof options === 'object') {
		    return this.each(function () {

		        // Only allow the plugin to be instantiated once,
		        // so we check that the element has no plugin instantiation yet
		        if (!$.data(this, 'plugin_' + pluginName)) {

		            // if it has no instance, create a new one,
		            // pass options to our plugin constructor,
		            // and store the plugin instance
		            // in the elements jQuery data object.
		            $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
		        }
		    });
		}
		// If the first parameter is a string and it doesn't start
		// with an underscore or "contains" the `init`-function,
		// treat this as a call to a public method.
		// } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

		//     // Cache the method call
		//     // to make it possible
		//     // to return a value
		//     var returns;

		//     this.each(function () {
		//         var instance = $.data(this, 'plugin_' + pluginName);

		//         // Tests that there's already a plugin-instance
		//         // and checks that the requested public method exists
		//         if (instance instanceof Plugin && typeof instance[options] === 'function') {

		//             // Call the method of our plugin instance,
		//             // and pass it the supplied arguments.
		//             returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
		//         }

		//         // Allow instances to be destroyed via the 'destroy' method
		//         if (options === 'destroy') {
		//           $.data(this, 'plugin_' + pluginName, null);
		//         }
		//     });

		//     // If the earlier cached method
		//     // gives a value back return the value,
		//     // otherwise return this to preserve chainability.
		//     return returns !== undefined ? returns : this;
		// }
	}

}(jQuery, window, document));


/*! 
 * ================== js/libs/plugins/averta/jquery.sortableInput.js =================== 
 **/ 

/*
 * jQuery Sortable Input Plugin
 * Author: Averta
 * Version: 1.0.3
 */
// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;( function( $, window, document, undefined ) {

    "use strict";

        // undefined is used here as the undefined global variable in ECMAScript 3 is
        // mutable (ie. it can be changed by someone else). undefined isn't really being
        // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
        // can no longer be modified.

        // window and document are passed through as local variables rather than global
        // as this (slightly) quickens the resolution process and can be more efficiently
        // minified (especially when both are regularly referenced in your plugin).

        // Create the defaults once
        var pluginName = "sortableInput",
            defaults   = {
                sortable          : true,
                fields            : '',
                fieldsDataAttr    : 'fields',
                wrapperClass      : "sortin-wrapper",
                selectWrapperClass: "sortin-select-wrapper",
                fieldsWrapperClass: "sortin-fields",
                fieldsInnerClass  : "sortin-fields-inner",
                selectboxClass    : "sortin-selectbox",
                addButtonClass    : "sortin-add-btn",
                addButtonText     : "Add",
                removeButtonClass : "sortin-remove-btn",
                removeButtonText  : "x",
                inputClass        : "sortin-input",
                noOptionText      : "No More Option",
                handlerClass      : "sortin-handler",
            },
            // jQuery UI Sortable defaults
            sortableDefaults = {
                axis  : "y",
                cursor: "move",
                handle: ".sortin-handler"
            };


        // The actual plugin constructor
        function Plugin ( element, options, sortableOptions ) {
            this.element  = element;
            this.$element = $( element );

            // jQuery has an extend method which merges the contents of two or
            // more objects, storing the result in the first object. The first object
            // is generally empty as we don't want to alter the default options for
            // future instances of the plugin
            this.settings         = $.extend( {}, defaults, options );
            this.sortableSettings = $.extend( {}, sortableDefaults, sortableOptions );
            this._defaults        = defaults;
            this._name            = pluginName;
            this.init();
        }

        // Avoid Plugin.prototype conflicts
        $.extend( Plugin.prototype, {
            init: function() {

                // Place initialization logic here
                // You already have access to the DOM element and
                // the options via the instance, e.g. this.element
                // and this.settings
                // you can add more functions like the one below and
                // call them like the example below

                // Try to get inline custom fields if available
                var customFields = this.$element.data( this.settings.fieldsDataAttr );

                // Hide the selected element
                this.$element.hide();
                // Main wrapper
                this.$wrapper       = $( '<div/>', {class: this.settings.wrapperClass} );
                // Inner wrapper for selectbox and add button
                this.$inner         = $( '<div/>', {class: this.settings.selectWrapperClass} );
                // Wrapper for input fields
                this.$fieldsWrapper = $( '<div/>', {class: this.settings.fieldsWrapperClass} );
                // Generate an empty selectbox
                this.$selectbox     = $( '<select/>', {class: this.settings.selectboxClass} );
                // Generate add button (Button under select box for adding input fields)
                this.$addButton     = $( '<button/>', {class: this.settings.addbuttonClass, type: 'button', text: this.settings.addButtonText} );
                // Read and parse JSON data from input field
                this._data          = $.trim( this.$element.val() ) ? JSON.parse( this.$element.val() ) : [];
                // Use custom inline fields rather than default fields in options
                this.settings.fields = undefined === customFields || [] == customFields ? this.settings.fields : customFields;
                // Generate plugin markup
                this.$element.after( this.$wrapper.append( this.$inner.append( this.$selectbox ).append( this.$addButton ) ).append( this.$fieldsWrapper ) );
                // Create Selectbox regarding to 'fields' option
                this._createSelectbox();
                // Create input fields regarding to parsed JSON data in 'this._data'
                this._createFields();
                // Add new field by clicking on 'Add' button
                this.$addButton.click( this._addField.bind( this ) );
                // Update main input element data after keyup, click, blur
                $( this.$wrapper ).on( 'keyup click blur', this._update.bind( this ) );
                // Disable the 'add button' if all fields are already added to list
                if( this._data.length == this.settings.fields.length ){
                    this._toggleControllers( false );
                }
                // Check for sortable option
                if ( true === this.settings.sortable && $.fn.sortable ) {
                    // Select Handler
                    this.sortableSettings.handle = this.sortableSettings.handle ? this.sortableSettings.handle : this.settings.handlerClass;
                    // Add callback for sortable update. (Update main input element after re-ordering fields)
                    this.sortableSettings.update = this._update.bind( this );
                    //Init sortable
                    this.$fieldsWrapper.sortable( this.sortableSettings );
                    // Disable selection in sortable elements
                    this.$fieldsWrapper.disableSelection();
                }

            },

            // Function for Creating selectbox regarding to 'fields' option
            _createSelectbox: function() {
                var _fields = this.settings.fields,
                    self    = this;
                // Add 'option' tag for each field
                $.each( _fields, function( index, obj ){
                    self.$selectbox.append( '<option id="' + obj.id + '">' + obj.label + '</option>' );
                });
            },

            // Function for Creating input fields
            _createFields: function() {
                var self = this,
                    $wrapper = this.$fieldsWrapper;
                // Add an input field for each parsed JSON data (form main input element)
                $.each( self._data, function( index, obj ){
                    $( '#' + obj.id ).remove();
                    self._generateField( $wrapper, obj );
                });
            },

            // Function for adding field after clicking on 'Add' button
            _addField: function() {
                var self      = this,
                    $option   = this.$selectbox.children( 'option' ),
                    $wrapper  = this.$fieldsWrapper,
                    $selected = $option.filter( ':selected' );
                self._generateField( $wrapper, $selected );
                // Hide selectbox if no more option exists.
                if ( 1 == $option.length ) {
                    this._toggleControllers( false );
                }
                // Remove selected item from selectbox after adding input field for it
                $selected.remove();
            },

            // Function for removing input fields and adding it back to selectbox
            _removeField: function( element ) {
                var $input     = element.children( 'input' ),
                    label      = element.children( 'label' ).text(),
                    $selectbox = this.$selectbox;
                $selectbox.append( '<option id="' + $input.attr( 'name' ) + '">' + label + '</option>' );
                this._toggleControllers( true );
                element.remove();
            },

            // Generate fields regarding to (selected item to add, or parsed JSON data from main input element)
            _generateField: function( element, obj ) {
                var self          = this,
                    id            = obj.id ? obj.id : obj.attr( 'id' ),
                    label         = obj.label ? obj.label : obj.text(),
                    $wrapper      = $( '<div/>', {class: this.settings.fieldsInnerClass} ),
                    $label        = $( '<label for="' + id + '">' + label + '</label>' ),
                    $inputField   = $( '<input type="text" name="' + id + '"></input>' ),
                    $handler      = $( '<div/>', {class: this.settings.handlerClass} ),
                    $removeButton = $( '<button/>', {class: this.settings.removeButtonClass, text: this.settings.removeButtonText} );
                if ( -1 !== obj.value ) {
                    $inputField.val( obj.value );
                }
                // Custom event
                self.$element.trigger( 'beforeAddField' );
                // Check for sortable option, whether add handler or not
                if ( true === this.settings.sortable && $.fn.sortable ) {
                    $wrapper.append( $handler );
                }
                // Add field with handler for sortable input, label and 'Remove' button
                element.append( $wrapper.append( $label ).append( $inputField ).append( $removeButton ) );
                // Custom event
                self.$element.trigger( 'afterAddField' );
                // Remove added field by clicking on 'Remove' button
                $removeButton.click( function(){
                    // Custom event
                    self.$element.trigger( 'beforeRemoveField' );
                    //
                    self._removeField( $wrapper );
                    // Custom event
                    self.$element.trigger( 'afterRemoveField' );
                } );
            },

            // Function to Enable/Disable the 'Add' button and select element
            _toggleControllers: function( enable ){
                if( enable ){
                    this.$inner.removeClass( 'sortin-disabled' ).next( 'p' ).remove();
                } else if( this.settings.noOptionText ){
                    this.$inner.addClass( 'sortin-disabled' ).after( $( '<p/>', { text: this.settings.noOptionText } ) );
                }
                this.$addButton.add( this.$selectbox ).prop('disabled', ! enable );
            },

            // Function for updating input field
            _update: function() {
                    var $inputs = this.$wrapper.find( 'input' ),
                        arr     = [];
                $.each( $inputs, function( index, obj ){
                    var $obj    = $( obj ),
                        $main   = $();
                    $main.value = $obj.val();
                    $main.label = $obj.prev( 'label' ).text();
                    $main.id    = $obj.attr( 'name' );
                    arr.push( $main );
                } );
                this.$element.val( JSON.stringify( arr ) ).trigger( 'change' );
            },

            // Destroy method
            destroy: function( keep ) {
                // If passed true, keep main input element
                if ( true !== keep ) {
                    this.$element.remove();
                }
                    this.$wrapper.remove();
            }


        } );

        // A really lightweight plugin wrapper around the constructor,
        // preventing against multiple instantiations
        $.fn[pluginName] = function ( options ) {
            var args = arguments;

            // Is the first parameter an object (options), or was omitted,
            // instantiate a new instance of the plugin.
            if (options === undefined || typeof options === 'object') {
                return this.each(function () {

                    // Only allow the plugin to be instantiated once,
                    // so we check that the element has no plugin instantiation yet
                    if (!$.data(this, 'plugin_' + pluginName)) {

                        // if it has no instance, create a new one,
                        // pass options to our plugin constructor,
                        // and store the plugin instance
                        // in the elements jQuery data object.
                        $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
                    }
                });

            // If the first parameter is a string and it doesn't start
            // with an underscore or "contains" the `init`-function,
            // treat this as a call to a public method.
            } else if (typeof options === 'string' && !(options[0].match("^_")) && options !== 'init') {

                // Cache the method call
                // to make it possible
                // to return a value
                var returns;

                this.each(function () {
                    var instance = $.data(this, 'plugin_' + pluginName);

                    // Tests that there's already a plugin-instance
                    // and checks that the requested public method exists
                    if (instance instanceof Plugin && typeof instance[options] === 'function') {

                        // Call the method of our plugin instance,
                        // and pass it the supplied arguments.
                        returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                    }

                });

                // If the earlier cached method
                // gives a value back return the value,
                // otherwise return this to preserve chainability.
                return returns !== undefined ? returns : this;
            }
        };

}(jQuery, window, document));


/*! 
 * ================== js/libs/modules/switchery.min.js =================== 
 **/ 

(function(){function require(name){var module=require.modules[name];if(!module)throw new Error('failed to require "'+name+'"');if(!("exports"in module)&&typeof module.definition==="function"){module.client=module.component=true;module.definition.call(this,module.exports={},module);delete module.definition}return module.exports}require.loader="component";require.helper={};require.helper.semVerSort=function(a,b){var aArray=a.version.split(".");var bArray=b.version.split(".");for(var i=0;i<aArray.length;++i){var aInt=parseInt(aArray[i],10);var bInt=parseInt(bArray[i],10);if(aInt===bInt){var aLex=aArray[i].substr((""+aInt).length);var bLex=bArray[i].substr((""+bInt).length);if(aLex===""&&bLex!=="")return 1;if(aLex!==""&&bLex==="")return-1;if(aLex!==""&&bLex!=="")return aLex>bLex?1:-1;continue}else if(aInt>bInt){return 1}else{return-1}}return 0};require.latest=function(name,returnPath){function showError(name){throw new Error('failed to find latest module of "'+name+'"')}var versionRegexp=/(.*)~(.*)@v?(\d+\.\d+\.\d+[^\/]*)$/;var remoteRegexp=/(.*)~(.*)/;if(!remoteRegexp.test(name))showError(name);var moduleNames=Object.keys(require.modules);var semVerCandidates=[];var otherCandidates=[];for(var i=0;i<moduleNames.length;i++){var moduleName=moduleNames[i];if(new RegExp(name+"@").test(moduleName)){var version=moduleName.substr(name.length+1);var semVerMatch=versionRegexp.exec(moduleName);if(semVerMatch!=null){semVerCandidates.push({version:version,name:moduleName})}else{otherCandidates.push({version:version,name:moduleName})}}}if(semVerCandidates.concat(otherCandidates).length===0){showError(name)}if(semVerCandidates.length>0){var module=semVerCandidates.sort(require.helper.semVerSort).pop().name;if(returnPath===true){return module}return require(module)}var module=otherCandidates.sort(function(a,b){return a.name>b.name})[0].name;if(returnPath===true){return module}return require(module)};require.modules={};require.register=function(name,definition){require.modules[name]={definition:definition}};require.define=function(name,exports){require.modules[name]={exports:exports}};require.register("abpetkov~transitionize@0.0.3",function(exports,module){module.exports=Transitionize;function Transitionize(element,props){if(!(this instanceof Transitionize))return new Transitionize(element,props);this.element=element;this.props=props||{};this.init()}Transitionize.prototype.isSafari=function(){return/Safari/.test(navigator.userAgent)&&/Apple Computer/.test(navigator.vendor)};Transitionize.prototype.init=function(){var transitions=[];for(var key in this.props){transitions.push(key+" "+this.props[key])}this.element.style.transition=transitions.join(", ");if(this.isSafari())this.element.style.webkitTransition=transitions.join(", ")}});require.register("ftlabs~fastclick@v0.6.11",function(exports,module){function FastClick(layer){"use strict";var oldOnClick,self=this;this.trackingClick=false;this.trackingClickStart=0;this.targetElement=null;this.touchStartX=0;this.touchStartY=0;this.lastTouchIdentifier=0;this.touchBoundary=10;this.layer=layer;if(!layer||!layer.nodeType){throw new TypeError("Layer must be a document node")}this.onClick=function(){return FastClick.prototype.onClick.apply(self,arguments)};this.onMouse=function(){return FastClick.prototype.onMouse.apply(self,arguments)};this.onTouchStart=function(){return FastClick.prototype.onTouchStart.apply(self,arguments)};this.onTouchMove=function(){return FastClick.prototype.onTouchMove.apply(self,arguments)};this.onTouchEnd=function(){return FastClick.prototype.onTouchEnd.apply(self,arguments)};this.onTouchCancel=function(){return FastClick.prototype.onTouchCancel.apply(self,arguments)};if(FastClick.notNeeded(layer)){return}if(this.deviceIsAndroid){layer.addEventListener("mouseover",this.onMouse,true);layer.addEventListener("mousedown",this.onMouse,true);layer.addEventListener("mouseup",this.onMouse,true)}layer.addEventListener("click",this.onClick,true);layer.addEventListener("touchstart",this.onTouchStart,false);layer.addEventListener("touchmove",this.onTouchMove,false);layer.addEventListener("touchend",this.onTouchEnd,false);layer.addEventListener("touchcancel",this.onTouchCancel,false);if(!Event.prototype.stopImmediatePropagation){layer.removeEventListener=function(type,callback,capture){var rmv=Node.prototype.removeEventListener;if(type==="click"){rmv.call(layer,type,callback.hijacked||callback,capture)}else{rmv.call(layer,type,callback,capture)}};layer.addEventListener=function(type,callback,capture){var adv=Node.prototype.addEventListener;if(type==="click"){adv.call(layer,type,callback.hijacked||(callback.hijacked=function(event){if(!event.propagationStopped){callback(event)}}),capture)}else{adv.call(layer,type,callback,capture)}}}if(typeof layer.onclick==="function"){oldOnClick=layer.onclick;layer.addEventListener("click",function(event){oldOnClick(event)},false);layer.onclick=null}}FastClick.prototype.deviceIsAndroid=navigator.userAgent.indexOf("Android")>0;FastClick.prototype.deviceIsIOS=/iP(ad|hone|od)/.test(navigator.userAgent);FastClick.prototype.deviceIsIOS4=FastClick.prototype.deviceIsIOS&&/OS 4_\d(_\d)?/.test(navigator.userAgent);FastClick.prototype.deviceIsIOSWithBadTarget=FastClick.prototype.deviceIsIOS&&/OS ([6-9]|\d{2})_\d/.test(navigator.userAgent);FastClick.prototype.needsClick=function(target){"use strict";switch(target.nodeName.toLowerCase()){case"button":case"select":case"textarea":if(target.disabled){return true}break;case"input":if(this.deviceIsIOS&&target.type==="file"||target.disabled){return true}break;case"label":case"video":return true}return/\bneedsclick\b/.test(target.className)};FastClick.prototype.needsFocus=function(target){"use strict";switch(target.nodeName.toLowerCase()){case"textarea":return true;case"select":return!this.deviceIsAndroid;case"input":switch(target.type){case"button":case"checkbox":case"file":case"image":case"radio":case"submit":return false}return!target.disabled&&!target.readOnly;default:return/\bneedsfocus\b/.test(target.className)}};FastClick.prototype.sendClick=function(targetElement,event){"use strict";var clickEvent,touch;if(document.activeElement&&document.activeElement!==targetElement){document.activeElement.blur()}touch=event.changedTouches[0];clickEvent=document.createEvent("MouseEvents");clickEvent.initMouseEvent(this.determineEventType(targetElement),true,true,window,1,touch.screenX,touch.screenY,touch.clientX,touch.clientY,false,false,false,false,0,null);clickEvent.forwardedTouchEvent=true;targetElement.dispatchEvent(clickEvent)};FastClick.prototype.determineEventType=function(targetElement){"use strict";if(this.deviceIsAndroid&&targetElement.tagName.toLowerCase()==="select"){return"mousedown"}return"click"};FastClick.prototype.focus=function(targetElement){"use strict";var length;if(this.deviceIsIOS&&targetElement.setSelectionRange&&targetElement.type.indexOf("date")!==0&&targetElement.type!=="time"){length=targetElement.value.length;targetElement.setSelectionRange(length,length)}else{targetElement.focus()}};FastClick.prototype.updateScrollParent=function(targetElement){"use strict";var scrollParent,parentElement;scrollParent=targetElement.fastClickScrollParent;if(!scrollParent||!scrollParent.contains(targetElement)){parentElement=targetElement;do{if(parentElement.scrollHeight>parentElement.offsetHeight){scrollParent=parentElement;targetElement.fastClickScrollParent=parentElement;break}parentElement=parentElement.parentElement}while(parentElement)}if(scrollParent){scrollParent.fastClickLastScrollTop=scrollParent.scrollTop}};FastClick.prototype.getTargetElementFromEventTarget=function(eventTarget){"use strict";if(eventTarget.nodeType===Node.TEXT_NODE){return eventTarget.parentNode}return eventTarget};FastClick.prototype.onTouchStart=function(event){"use strict";var targetElement,touch,selection;if(event.targetTouches.length>1){return true}targetElement=this.getTargetElementFromEventTarget(event.target);touch=event.targetTouches[0];if(this.deviceIsIOS){selection=window.getSelection();if(selection.rangeCount&&!selection.isCollapsed){return true}if(!this.deviceIsIOS4){if(touch.identifier===this.lastTouchIdentifier){event.preventDefault();return false}this.lastTouchIdentifier=touch.identifier;this.updateScrollParent(targetElement)}}this.trackingClick=true;this.trackingClickStart=event.timeStamp;this.targetElement=targetElement;this.touchStartX=touch.pageX;this.touchStartY=touch.pageY;if(event.timeStamp-this.lastClickTime<200){event.preventDefault()}return true};FastClick.prototype.touchHasMoved=function(event){"use strict";var touch=event.changedTouches[0],boundary=this.touchBoundary;if(Math.abs(touch.pageX-this.touchStartX)>boundary||Math.abs(touch.pageY-this.touchStartY)>boundary){return true}return false};FastClick.prototype.onTouchMove=function(event){"use strict";if(!this.trackingClick){return true}if(this.targetElement!==this.getTargetElementFromEventTarget(event.target)||this.touchHasMoved(event)){this.trackingClick=false;this.targetElement=null}return true};FastClick.prototype.findControl=function(labelElement){"use strict";if(labelElement.control!==undefined){return labelElement.control}if(labelElement.htmlFor){return document.getElementById(labelElement.htmlFor)}return labelElement.querySelector("button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea")};FastClick.prototype.onTouchEnd=function(event){"use strict";var forElement,trackingClickStart,targetTagName,scrollParent,touch,targetElement=this.targetElement;if(!this.trackingClick){return true}if(event.timeStamp-this.lastClickTime<200){this.cancelNextClick=true;return true}this.cancelNextClick=false;this.lastClickTime=event.timeStamp;trackingClickStart=this.trackingClickStart;this.trackingClick=false;this.trackingClickStart=0;if(this.deviceIsIOSWithBadTarget){touch=event.changedTouches[0];targetElement=document.elementFromPoint(touch.pageX-window.pageXOffset,touch.pageY-window.pageYOffset)||targetElement;targetElement.fastClickScrollParent=this.targetElement.fastClickScrollParent}targetTagName=targetElement.tagName.toLowerCase();if(targetTagName==="label"){forElement=this.findControl(targetElement);if(forElement){this.focus(targetElement);if(this.deviceIsAndroid){return false}targetElement=forElement}}else if(this.needsFocus(targetElement)){if(event.timeStamp-trackingClickStart>100||this.deviceIsIOS&&window.top!==window&&targetTagName==="input"){this.targetElement=null;return false}this.focus(targetElement);if(!this.deviceIsIOS4||targetTagName!=="select"){this.targetElement=null;event.preventDefault()}return false}if(this.deviceIsIOS&&!this.deviceIsIOS4){scrollParent=targetElement.fastClickScrollParent;if(scrollParent&&scrollParent.fastClickLastScrollTop!==scrollParent.scrollTop){return true}}if(!this.needsClick(targetElement)){event.preventDefault();this.sendClick(targetElement,event)}return false};FastClick.prototype.onTouchCancel=function(){"use strict";this.trackingClick=false;this.targetElement=null};FastClick.prototype.onMouse=function(event){"use strict";if(!this.targetElement){return true}if(event.forwardedTouchEvent){return true}if(!event.cancelable){return true}if(!this.needsClick(this.targetElement)||this.cancelNextClick){if(event.stopImmediatePropagation){event.stopImmediatePropagation()}else{event.propagationStopped=true}event.stopPropagation();event.preventDefault();return false}return true};FastClick.prototype.onClick=function(event){"use strict";var permitted;if(this.trackingClick){this.targetElement=null;this.trackingClick=false;return true}if(event.target.type==="submit"&&event.detail===0){return true}permitted=this.onMouse(event);if(!permitted){this.targetElement=null}return permitted};FastClick.prototype.destroy=function(){"use strict";var layer=this.layer;if(this.deviceIsAndroid){layer.removeEventListener("mouseover",this.onMouse,true);layer.removeEventListener("mousedown",this.onMouse,true);layer.removeEventListener("mouseup",this.onMouse,true)}layer.removeEventListener("click",this.onClick,true);layer.removeEventListener("touchstart",this.onTouchStart,false);layer.removeEventListener("touchmove",this.onTouchMove,false);layer.removeEventListener("touchend",this.onTouchEnd,false);layer.removeEventListener("touchcancel",this.onTouchCancel,false)};FastClick.notNeeded=function(layer){"use strict";var metaViewport;var chromeVersion;if(typeof window.ontouchstart==="undefined"){return true}chromeVersion=+(/Chrome\/([0-9]+)/.exec(navigator.userAgent)||[,0])[1];if(chromeVersion){if(FastClick.prototype.deviceIsAndroid){metaViewport=document.querySelector("meta[name=viewport]");if(metaViewport){if(metaViewport.content.indexOf("user-scalable=no")!==-1){return true}if(chromeVersion>31&&window.innerWidth<=window.screen.width){return true}}}else{return true}}if(layer.style.msTouchAction==="none"){return true}return false};FastClick.attach=function(layer){"use strict";return new FastClick(layer)};if(typeof define!=="undefined"&&define.amd){define(function(){"use strict";return FastClick})}else if(typeof module!=="undefined"&&module.exports){module.exports=FastClick.attach;module.exports.FastClick=FastClick}else{window.FastClick=FastClick}});require.register("component~indexof@0.0.3",function(exports,module){module.exports=function(arr,obj){if(arr.indexOf)return arr.indexOf(obj);for(var i=0;i<arr.length;++i){if(arr[i]===obj)return i}return-1}});require.register("component~classes@1.2.1",function(exports,module){var index=require("component~indexof@0.0.3");var re=/\s+/;var toString=Object.prototype.toString;module.exports=function(el){return new ClassList(el)};function ClassList(el){if(!el)throw new Error("A DOM element reference is required");this.el=el;this.list=el.classList}ClassList.prototype.add=function(name){if(this.list){this.list.add(name);return this}var arr=this.array();var i=index(arr,name);if(!~i)arr.push(name);this.el.className=arr.join(" ");return this};ClassList.prototype.remove=function(name){if("[object RegExp]"==toString.call(name)){return this.removeMatching(name)}if(this.list){this.list.remove(name);return this}var arr=this.array();var i=index(arr,name);if(~i)arr.splice(i,1);this.el.className=arr.join(" ");return this};ClassList.prototype.removeMatching=function(re){var arr=this.array();for(var i=0;i<arr.length;i++){if(re.test(arr[i])){this.remove(arr[i])}}return this};ClassList.prototype.toggle=function(name,force){if(this.list){if("undefined"!==typeof force){if(force!==this.list.toggle(name,force)){this.list.toggle(name)}}else{this.list.toggle(name)}return this}if("undefined"!==typeof force){if(!force){this.remove(name)}else{this.add(name)}}else{if(this.has(name)){this.remove(name)}else{this.add(name)}}return this};ClassList.prototype.array=function(){var str=this.el.className.replace(/^\s+|\s+$/g,"");var arr=str.split(re);if(""===arr[0])arr.shift();return arr};ClassList.prototype.has=ClassList.prototype.contains=function(name){return this.list?this.list.contains(name):!!~index(this.array(),name)}});require.register("component~event@0.1.4",function(exports,module){var bind=window.addEventListener?"addEventListener":"attachEvent",unbind=window.removeEventListener?"removeEventListener":"detachEvent",prefix=bind!=="addEventListener"?"on":"";exports.bind=function(el,type,fn,capture){el[bind](prefix+type,fn,capture||false);return fn};exports.unbind=function(el,type,fn,capture){el[unbind](prefix+type,fn,capture||false);return fn}});require.register("component~query@0.0.3",function(exports,module){function one(selector,el){return el.querySelector(selector)}exports=module.exports=function(selector,el){el=el||document;return one(selector,el)};exports.all=function(selector,el){el=el||document;return el.querySelectorAll(selector)};exports.engine=function(obj){if(!obj.one)throw new Error(".one callback required");if(!obj.all)throw new Error(".all callback required");one=obj.one;exports.all=obj.all;return exports}});require.register("component~matches-selector@0.1.5",function(exports,module){var query=require("component~query@0.0.3");var proto=Element.prototype;var vendor=proto.matches||proto.webkitMatchesSelector||proto.mozMatchesSelector||proto.msMatchesSelector||proto.oMatchesSelector;module.exports=match;function match(el,selector){if(!el||el.nodeType!==1)return false;if(vendor)return vendor.call(el,selector);var nodes=query.all(selector,el.parentNode);for(var i=0;i<nodes.length;++i){if(nodes[i]==el)return true}return false}});require.register("component~closest@0.1.4",function(exports,module){var matches=require("component~matches-selector@0.1.5");module.exports=function(element,selector,checkYoSelf,root){element=checkYoSelf?{parentNode:element}:element;root=root||document;while((element=element.parentNode)&&element!==document){if(matches(element,selector))return element;if(element===root)return}}});require.register("component~delegate@0.2.3",function(exports,module){var closest=require("component~closest@0.1.4"),event=require("component~event@0.1.4");exports.bind=function(el,selector,type,fn,capture){return event.bind(el,type,function(e){var target=e.target||e.srcElement;e.delegateTarget=closest(target,selector,true,el);if(e.delegateTarget)fn.call(el,e)},capture)};exports.unbind=function(el,type,fn,capture){event.unbind(el,type,fn,capture)}});require.register("component~events@1.0.9",function(exports,module){var events=require("component~event@0.1.4");var delegate=require("component~delegate@0.2.3");module.exports=Events;function Events(el,obj){if(!(this instanceof Events))return new Events(el,obj);if(!el)throw new Error("element required");if(!obj)throw new Error("object required");this.el=el;this.obj=obj;this._events={}}Events.prototype.sub=function(event,method,cb){this._events[event]=this._events[event]||{};this._events[event][method]=cb};Events.prototype.bind=function(event,method){var e=parse(event);var el=this.el;var obj=this.obj;var name=e.name;var method=method||"on"+name;var args=[].slice.call(arguments,2);function cb(){var a=[].slice.call(arguments).concat(args);obj[method].apply(obj,a)}if(e.selector){cb=delegate.bind(el,e.selector,name,cb)}else{events.bind(el,name,cb)}this.sub(name,method,cb);return cb};Events.prototype.unbind=function(event,method){if(0==arguments.length)return this.unbindAll();if(1==arguments.length)return this.unbindAllOf(event);var bindings=this._events[event];if(!bindings)return;var cb=bindings[method];if(!cb)return;events.unbind(this.el,event,cb)};Events.prototype.unbindAll=function(){for(var event in this._events){this.unbindAllOf(event)}};Events.prototype.unbindAllOf=function(event){var bindings=this._events[event];if(!bindings)return;for(var method in bindings){this.unbind(event,method)}};function parse(event){var parts=event.split(/ +/);return{name:parts.shift(),selector:parts.join(" ")}}});require.register("switchery",function(exports,module){var transitionize=require("abpetkov~transitionize@0.0.3"),fastclick=require("ftlabs~fastclick@v0.6.11"),classes=require("component~classes@1.2.1"),events=require("component~events@1.0.9");module.exports=Switchery;var defaults={color:"#64bd63",secondaryColor:"#dfdfdf",jackColor:"#fff",jackSecondaryColor:null,className:"switchery",disabled:false,disabledOpacity:.5,speed:"0.4s",size:"default"};function Switchery(element,options){if(!(this instanceof Switchery))return new Switchery(element,options);this.element=element;this.options=options||{};for(var i in defaults){if(this.options[i]==null){this.options[i]=defaults[i]}}if(this.element!=null&&this.element.type=="checkbox")this.init();if(this.isDisabled()===true)this.disable()}Switchery.prototype.hide=function(){this.element.style.display="none"};Switchery.prototype.show=function(){var switcher=this.create();this.insertAfter(this.element,switcher)};Switchery.prototype.create=function(){this.switcher=document.createElement("span");this.jack=document.createElement("small");this.switcher.appendChild(this.jack);this.switcher.className=this.options.className;this.events=events(this.switcher,this);return this.switcher};Switchery.prototype.insertAfter=function(reference,target){reference.parentNode.insertBefore(target,reference.nextSibling)};Switchery.prototype.setPosition=function(clicked){var checked=this.isChecked(),switcher=this.switcher,jack=this.jack;if(clicked&&checked)checked=false;else if(clicked&&!checked)checked=true;if(checked===true){this.element.checked=true;if(window.getComputedStyle)jack.style.left=parseInt(window.getComputedStyle(switcher).width)-parseInt(window.getComputedStyle(jack).width)+"px";else jack.style.left=parseInt(switcher.currentStyle["width"])-parseInt(jack.currentStyle["width"])+"px";if(this.options.color)this.colorize();this.setSpeed()}else{jack.style.left=0;this.element.checked=false;this.switcher.style.boxShadow="inset 0 0 0 0 "+this.options.secondaryColor;this.switcher.style.borderColor=this.options.secondaryColor;this.switcher.style.backgroundColor=this.options.secondaryColor!==defaults.secondaryColor?this.options.secondaryColor:"#fff";this.jack.style.backgroundColor=this.options.jackSecondaryColor!==this.options.jackColor?this.options.jackSecondaryColor:this.options.jackColor;this.setSpeed()}};Switchery.prototype.setSpeed=function(){var switcherProp={},jackProp={"background-color":this.options.speed,left:this.options.speed.replace(/[a-z]/,"")/2+"s"};if(this.isChecked()){switcherProp={border:this.options.speed,"box-shadow":this.options.speed,"background-color":this.options.speed.replace(/[a-z]/,"")*3+"s"}}else{switcherProp={border:this.options.speed,"box-shadow":this.options.speed}}transitionize(this.switcher,switcherProp);transitionize(this.jack,jackProp)};Switchery.prototype.setSize=function(){var small="switchery-small",normal="switchery-default",large="switchery-large";switch(this.options.size){case"small":classes(this.switcher).add(small);break;case"large":classes(this.switcher).add(large);break;default:classes(this.switcher).add(normal);break}};Switchery.prototype.colorize=function(){var switcherHeight=this.switcher.offsetHeight/2;this.switcher.style.backgroundColor=this.options.color;this.switcher.style.borderColor=this.options.color;this.switcher.style.boxShadow="inset 0 0 0 "+switcherHeight+"px "+this.options.color;this.jack.style.backgroundColor=this.options.jackColor};Switchery.prototype.handleOnchange=function(state){if(document.dispatchEvent){var event=document.createEvent("HTMLEvents");event.initEvent("change",true,true);this.element.dispatchEvent(event)}else{this.element.fireEvent("onchange")}};Switchery.prototype.handleChange=function(){var self=this,el=this.element;if(el.addEventListener){el.addEventListener("change",function(){self.setPosition()})}else{el.attachEvent("onchange",function(){self.setPosition()})}};Switchery.prototype.handleClick=function(){var switcher=this.switcher;fastclick(switcher);this.events.bind("click","bindClick")};Switchery.prototype.bindClick=function(){var parent=this.element.parentNode.tagName.toLowerCase(),labelParent=parent==="label"?false:true;this.setPosition(labelParent);this.handleOnchange(this.element.checked)};Switchery.prototype.markAsSwitched=function(){this.element.setAttribute("data-switchery",true)};Switchery.prototype.markedAsSwitched=function(){return this.element.getAttribute("data-switchery")};Switchery.prototype.init=function(){this.hide();this.show();this.setSize();this.setPosition();this.markAsSwitched();this.handleChange();this.handleClick()};Switchery.prototype.isChecked=function(){return this.element.checked};Switchery.prototype.isDisabled=function(){return this.options.disabled||this.element.disabled||this.element.readOnly};Switchery.prototype.destroy=function(){this.events.unbind()};Switchery.prototype.enable=function(){if(this.options.disabled)this.options.disabled=false;if(this.element.disabled)this.element.disabled=false;if(this.element.readOnly)this.element.readOnly=false;this.switcher.style.opacity=1;this.events.bind("click","bindClick")};Switchery.prototype.disable=function(){if(!this.options.disabled)this.options.disabled=true;if(!this.element.disabled)this.element.disabled=true;if(!this.element.readOnly)this.element.readOnly=true;this.switcher.style.opacity=this.options.disabledOpacity;this.destroy()}});if(typeof exports=="object"){module.exports=require("switchery")}else if(typeof define=="function"&&define.amd){define("Switchery",[],function(){return require("switchery")})}else{(this||window)["Switchery"]=require("switchery")}})();


/*! 
 * ================== js/libs/plugins/jquery.tipsy.js =================== 
 **/ 

(function($) {
    $.fn.tipsy = function(options) {

        options = $.extend({}, $.fn.tipsy.defaults, options);
        
        return this.each(function() {
            
            var opts = $.fn.tipsy.elementOptions(this, options);
            
            $(this).hover(function() {

                $.data(this, 'cancel.tipsy', true);

                var tip = $.data(this, 'active.tipsy');
                if (!tip) {
                    tip = $('<div class="tipsy"><div class="tipsy-inner"/></div>');
                    tip.css({position: 'absolute', zIndex: 100000});
                    $.data(this, 'active.tipsy', tip);
                }

                if ($(this).attr('title') || typeof($(this).attr('original-title')) != 'string') {
                    $(this).attr('original-title', $(this).attr('title') || '').removeAttr('title');
                }

                var title;
                if (typeof opts.title == 'string') {
                    title = $(this).attr(opts.title == 'title' ? 'original-title' : opts.title);
                } else if (typeof opts.title == 'function') {
                    title = opts.title.call(this);
                }

                tip.find('.tipsy-inner')[opts.html ? 'html' : 'text'](title || opts.fallback);

                var pos = $.extend({}, $(this).offset(), {width: this.offsetWidth, height: this.offsetHeight});
                tip.get(0).className = 'tipsy'; // reset classname in case of dynamic gravity
                tip.remove().css({top: 0, left: 0, visibility: 'hidden', display: 'block'}).appendTo(document.body);
                var actualWidth = tip[0].offsetWidth, actualHeight = tip[0].offsetHeight;
                var gravity = (typeof opts.gravity == 'function') ? opts.gravity.call(this) : opts.gravity;

                switch (gravity.charAt(0)) {
                    case 'n':
                        tip.css({top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}).addClass('tipsy-north');
                        break;
                    case 's':
                        tip.css({top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}).addClass('tipsy-south');
                        break;
                    case 'e':
                        tip.css({top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}).addClass('tipsy-east');
                        break;
                    case 'w':
                        tip.css({top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}).addClass('tipsy-west');
                        break;
                }

                if (opts.fade) {
                    tip.css({opacity: 0, display: 'block', visibility: 'visible'}).animate({opacity: 0.8});
                } else {
                    tip.css({visibility: 'visible'});
                }

            }, function() {
                $.data(this, 'cancel.tipsy', false);
                var self = this;
                setTimeout(function() {
                    if ($.data(this, 'cancel.tipsy')) return;
                    var tip = $.data(self, 'active.tipsy');
                    if (opts.fade) {
                        tip.stop().fadeOut(function() { $(this).remove(); });
                    } else {
                        tip.remove();
                    }
                }, 100);

            });
            
        });
        
    };
    
    // Overwrite this method to provide options on a per-element basis.
    // For example, you could store the gravity in a 'tipsy-gravity' attribute:
    // return $.extend({}, options, {gravity: $(ele).attr('tipsy-gravity') || 'n' });
    // (remember - do not modify 'options' in place!)
    $.fn.tipsy.elementOptions = function(ele, options) {
        return $.metadata ? $.extend({}, options, $(ele).metadata()) : options;
    };
    
    $.fn.tipsy.defaults = {
        fade: false,
        fallback: '',
        gravity: 'n',
        html: false,
        title: 'title'
    };
    
    $.fn.tipsy.autoNS = function() {
        return $(this).offset().top > ($(document).scrollTop() + $(window).height() / 2) ? 's' : 'n';
    };
    
    $.fn.tipsy.autoWE = function() {
        return $(this).offset().left > ($(document).scrollLeft() + $(window).width() / 2) ? 'e' : 'w';
    };
    
})(jQuery);


/*! 
 * ================== auxin/js/libs/snippets.js =================== 
 **/ 


/*========================================================================================
 *  An jQuery plugin to serialize checkbox and radio elements
 *========================================================================================*/
;(function ($) {

     $.fn.serialize = function (options) {
         return $.param(this.serializeArray(options));
     };

     $.fn.serializeArray = function (options) {
         var o = $.extend({
         checkboxesAsBools: false
     }, options || {});

     var rselectTextarea = /select|textarea/i;
     var rinput = /text|number|hidden|password|search/i;

     return this.map(function () {
         return this.elements ? $.makeArray(this.elements) : this;
     })
     .filter(function () {
         return this.name && !this.disabled &&
             (this.checked
             || (o.checkboxesAsBools && this.type === 'checkbox')
             || rselectTextarea.test(this.nodeName)
             || rinput.test(this.type));
         })
         .map(function (i, elem) {
             var val = $(this).val();
             return val == null ?
             null :
             $.isArray(val) ?
             $.map(val, function (val, i) {
                 return { name: elem.name, value: val };
             }) :
             {
                 name: elem.name,
                 value: ((o.checkboxesAsBools && this.type === 'checkbox') ? (this.checked ? 'true' : 'false') :val)
             };
         }).get();
     };

})(jQuery);

/*======================================================================================
 * jQuery Noty Plugin v1.1.1
 * Authors: Nedim Arabacı (http://ned.im), Muhittin Özer (http://muhittinozer.com) http://needim.github.com/noty/
 * Licensed under the MIT licenses: http://www.opensource.org/licenses/mit-license.php
 *======================================================================================*/
;(function($){$.noty=function(options,customContainer){var base=this;var $noty=null;var isCustom=false;base.init=function(options){base.options=$.extend({},$.noty.defaultOptions,options);base.options.type=base.options.cssPrefix+base.options.type;base.options.id=base.options.type+'_'+new Date().getTime();base.options.layout=base.options.cssPrefix+'layout_'+base.options.layout;if(base.options.custom.container)customContainer=base.options.custom.container;isCustom=($.type(customContainer)==='object')?true:false;return base.addQueue()};base.addQueue=function(){var isGrowl=($.inArray(base.options.layout,$.noty.growls)==-1)?false:true;if(!isGrowl)(base.options.force)?$.noty.queue.unshift({options:base.options}):$.noty.queue.push({options:base.options});return base.render(isGrowl)};base.render=function(isGrowl){var container=(isCustom)?customContainer.addClass(base.options.theme+' '+base.options.layout+' noty_custom_container'):$('body');if(isGrowl){if($('ul.noty_cont.'+base.options.layout).length==0)container.prepend($('<ul/>').addClass('noty_cont '+base.options.layout));container=$('ul.noty_cont.'+base.options.layout)}else{if($.noty.available){var fromQueue=$.noty.queue.shift();if($.type(fromQueue)==='object'){$.noty.available=false;base.options=fromQueue.options}else{$.noty.available=true;return base.options.id}}else{return base.options.id}}base.container=container;base.bar=$('<div class="noty_bar"/>').attr('id',base.options.id).addClass(base.options.theme+' '+base.options.layout+' '+base.options.type);$noty=base.bar;$noty.append(base.options.template).find('.noty_text').html(base.options.text);$noty.data('noty_options',base.options);(base.options.closeButton)?$noty.addClass('noty_closable').find('.noty_close').show():$noty.find('.noty_close').remove();$noty.find('.noty_close').bind('click',function(){$noty.trigger('noty.close')});if(base.options.buttons)base.options.closeOnSelfClick=base.options.closeOnSelfOver=false;if(base.options.closeOnSelfClick)$noty.bind('click',function(){$noty.trigger('noty.close')}).css('cursor','pointer');if(base.options.closeOnSelfOver)$noty.bind('mouseover',function(){$noty.trigger('noty.close')}).css('cursor','pointer');if(base.options.buttons){$buttons=$('<div/>').addClass('noty_buttons');$noty.find('.noty_message').append($buttons);$.each(base.options.buttons,function(i,button){bclass=(button.type)?button.type:'gray';$button=$('<button/>').addClass(bclass).html(button.text).appendTo($noty.find('.noty_buttons')).bind('click',function(){if($.isFunction(button.click)){button.click.call($button,$noty)}})})}return base.show(isGrowl)};base.show=function(isGrowl){if(base.options.modal)$('<div/>').addClass('noty_modal').addClass(base.options.theme).prependTo($('body')).fadeIn('fast');$noty.close=function(){return this.trigger('noty.close')};(isGrowl)?base.container.prepend($('<li/>').append($noty)):base.container.prepend($noty);if(base.options.layout=='noty_layout_topCenter'||base.options.layout=='noty_layout_center'){$.noty.reCenter($noty)}$noty.bind('noty.setText',function(event,text){$noty.find('.noty_text').html(text);$.noty.reCenter($noty)});$noty.bind('noty.getId',function(event){return $noty.data('noty_options').id});$noty.one('noty.close',function(event){var options=$noty.data('noty_options');if(options.modal)$('.noty_modal').fadeOut('fast',function(){$(this).remove()});$noty.clearQueue().stop().animate($noty.data('noty_options').animateClose,$noty.data('noty_options').speed,$noty.data('noty_options').easing,$noty.data('noty_options').onClose).promise().done(function(){if($.inArray($noty.data('noty_options').layout,$.noty.growls)>-1){$noty.parent().remove()}else{$noty.remove();$.noty.available=true;base.render(false)}})});$noty.animate(base.options.animateOpen,base.options.speed,base.options.easing,base.options.onShow);if(base.options.timeout)$noty.delay(base.options.timeout).promise().done(function(){$noty.trigger('noty.close')});return base.options.id};return base.init(options)};$.noty.get=function(id){return $('#'+id)};$.noty.close=function(id){$.noty.get(id).trigger('noty.close')};$.noty.setText=function(id,text){$.noty.get(id).trigger('noty.setText',text)};$.noty.closeAll=function(){$.noty.clearQueue();$('.noty_bar').trigger('noty.close')};$.noty.reCenter=function(noty){noty.css({'left':($(window).width()-noty.outerWidth())/2+'px'})};$.noty.clearQueue=function(){$.noty.queue=[]};$.noty.queue=[];$.noty.growls=['noty_layout_topLeft','noty_layout_topRight','noty_layout_bottomLeft','noty_layout_bottomRight'];$.noty.available=true;$.noty.defaultOptions={layout:'top',theme:'noty_theme_default',animateOpen:{height:'toggle'},animateClose:{height:'toggle'},easing:'swing',text:'',type:'alert',speed:500,timeout:5000,closeButton:false,closeOnSelfClick:true,closeOnSelfOver:false,force:false,onShow:false,onClose:false,buttons:false,modal:false,template:'<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',cssPrefix:'noty_',custom:{container:null}};$.fn.noty=function(options){return this.each(function(){(new $.noty(options,$(this)))})}})(jQuery);function noty(options){return jQuery.noty(options)};


/*! 
 * ================== auxin/js/libs/spectrum/spectrum.js =================== 
 **/ 

// Spectrum Colorpicker v1.8.0
// https://github.com/bgrins/spectrum
// Author: Brian Grinstead
// License: MIT

(function (factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) { // AMD
        define(['jquery'], factory);
    }
    else if (typeof exports == "object" && typeof module == "object") { // CommonJS
        module.exports = factory(require('jquery'));
    }
    else { // Browser
        factory(jQuery);
    }
})(function($, undefined) {
    "use strict";

    var defaultOpts = {

        // Callbacks
        beforeShow: noop,
        move: noop,
        change: noop,
        show: noop,
        hide: noop,

        // Options
        color: false,
        flat: false,
        showInput: false,
        allowEmpty: false,
        showButtons: true,
        clickoutFiresChange: true,
        showInitial: false,
        showPalette: false,
        showPaletteOnly: false,
        hideAfterPaletteSelect: false,
        togglePaletteOnly: false,
        showSelectionPalette: true,
        localStorageKey: false,
        appendTo: "body",
        maxSelectionSize: 7,
        cancelText: "cancel",
        chooseText: "choose",
        togglePaletteMoreText: "more",
        togglePaletteLessText: "less",
        clearText: "Clear Color Selection",
        noColorSelectedText: "No Color Selected",
        preferredFormat: false,
        className: "", // Deprecated - use containerClassName and replacerClassName instead.
        containerClassName: "",
        replacerClassName: "",
        showAlpha: false,
        theme: "sp-light",
        palette: [["#ffffff", "#000000", "#ff0000", "#ff8000", "#ffff00", "#008000", "#0000ff", "#4b0082", "#9400d3"]],
        selectionPalette: [],
        disabled: false,
        offset: null
    },
    spectrums = [],
    IE = !!/msie/i.exec( window.navigator.userAgent ),
    rgbaSupport = (function() {
        function contains( str, substr ) {
            return !!~('' + str).indexOf(substr);
        }

        var elem = document.createElement('div');
        var style = elem.style;
        style.cssText = 'background-color:rgba(0,0,0,.5)';
        return contains(style.backgroundColor, 'rgba') || contains(style.backgroundColor, 'hsla');
    })(),
    replaceInput = [
        "<div class='sp-replacer'>",
            "<div class='sp-preview'><div class='sp-preview-inner'></div></div>",
            "<div class='sp-dd'>&#9660;</div>",
        "</div>"
    ].join(''),
    markup = (function () {

        // IE does not support gradients with multiple stops, so we need to simulate
        //  that for the rainbow slider with 8 divs that each have a single gradient
        var gradientFix = "";
        if (IE) {
            for (var i = 1; i <= 6; i++) {
                gradientFix += "<div class='sp-" + i + "'></div>";
            }
        }

        return [
            "<div class='sp-container sp-hidden'>",
                "<div class='sp-palette-container'>",
                    "<div class='sp-palette sp-thumb sp-cf'></div>",
                    "<div class='sp-palette-button-container sp-cf'>",
                        "<button type='button' class='sp-palette-toggle'></button>",
                    "</div>",
                "</div>",
                "<div class='sp-picker-container'>",
                    "<div class='sp-top sp-cf'>",
                        "<div class='sp-fill'></div>",
                        "<div class='sp-top-inner'>",
                            "<div class='sp-color'>",
                                "<div class='sp-sat'>",
                                    "<div class='sp-val'>",
                                        "<div class='sp-dragger'></div>",
                                    "</div>",
                                "</div>",
                            "</div>",
                            "<div class='sp-clear sp-clear-display'>",
                            "</div>",
                            "<div class='sp-hue'>",
                                "<div class='sp-slider'></div>",
                                gradientFix,
                            "</div>",
                        "</div>",
                        "<div class='sp-alpha'><div class='sp-alpha-inner'><div class='sp-alpha-handle'></div></div></div>",
                    "</div>",
                    "<div class='sp-input-container sp-cf'>",
                        "<input class='sp-input' type='text' spellcheck='false'  />",
                    "</div>",
                    "<div class='sp-initial sp-thumb sp-cf'></div>",
                    "<div class='sp-button-container sp-cf'>",
                        "<a class='sp-cancel' href='#'></a>",
                        "<button type='button' class='sp-choose'></button>",
                    "</div>",
                "</div>",
            "</div>"
        ].join("");
    })();

    function paletteTemplate (p, color, className, opts) {
        var html = [];
        for (var i = 0; i < p.length; i++) {
            var current = p[i];
            if(current) {
                var tiny = tinycolor(current);
                var c = tiny.toHsl().l < 0.5 ? "sp-thumb-el sp-thumb-dark" : "sp-thumb-el sp-thumb-light";
                c += (tinycolor.equals(color, current)) ? " sp-thumb-active" : "";
                var formattedString = tiny.toString(opts.preferredFormat || "rgb");
                var swatchStyle = rgbaSupport ? ("background-color:" + tiny.toRgbString()) : "filter:" + tiny.toFilter();
                html.push('<span title="' + formattedString + '" data-color="' + tiny.toRgbString() + '" class="' + c + '"><span class="sp-thumb-inner" style="' + swatchStyle + ';" /></span>');
            } else {
                var cls = 'sp-clear-display';
                html.push($('<div />')
                    .append($('<span data-color="" style="background-color:transparent;" class="' + cls + '"></span>')
                        .attr('title', opts.noColorSelectedText)
                    )
                    .html()
                );
            }
        }
        return "<div class='sp-cf " + className + "'>" + html.join('') + "</div>";
    }

    function hideAll() {
        for (var i = 0; i < spectrums.length; i++) {
            if (spectrums[i]) {
                spectrums[i].hide();
            }
        }
    }

    function instanceOptions(o, callbackContext) {
        var opts = $.extend({}, defaultOpts, o);
        opts.callbacks = {
            'move': bind(opts.move, callbackContext),
            'change': bind(opts.change, callbackContext),
            'show': bind(opts.show, callbackContext),
            'hide': bind(opts.hide, callbackContext),
            'beforeShow': bind(opts.beforeShow, callbackContext)
        };

        return opts;
    }

    function spectrum(element, o) {

        var opts = instanceOptions(o, element),
            flat = opts.flat,
            showSelectionPalette = opts.showSelectionPalette,
            localStorageKey = opts.localStorageKey,
            theme = opts.theme,
            callbacks = opts.callbacks,
            resize = throttle(reflow, 10),
            visible = false,
            isDragging = false,
            dragWidth = 0,
            dragHeight = 0,
            dragHelperHeight = 0,
            slideHeight = 0,
            slideWidth = 0,
            alphaWidth = 0,
            alphaSlideHelperWidth = 0,
            slideHelperHeight = 0,
            currentHue = 0,
            currentSaturation = 0,
            currentValue = 0,
            currentAlpha = 1,
            palette = [],
            paletteArray = [],
            paletteLookup = {},
            selectionPalette = opts.selectionPalette.slice(0),
            maxSelectionSize = opts.maxSelectionSize,
            draggingClass = "sp-dragging",
            shiftMovementDirection = null;

        var doc = element.ownerDocument,
            body = doc.body,
            boundElement = $(element),
            disabled = false,
            container = $(markup, doc).addClass(theme),
            pickerContainer = container.find(".sp-picker-container"),
            dragger = container.find(".sp-color"),
            dragHelper = container.find(".sp-dragger"),
            slider = container.find(".sp-hue"),
            slideHelper = container.find(".sp-slider"),
            alphaSliderInner = container.find(".sp-alpha-inner"),
            alphaSlider = container.find(".sp-alpha"),
            alphaSlideHelper = container.find(".sp-alpha-handle"),
            textInput = container.find(".sp-input"),
            paletteContainer = container.find(".sp-palette"),
            initialColorContainer = container.find(".sp-initial"),
            cancelButton = container.find(".sp-cancel"),
            clearButton = container.find(".sp-clear"),
            chooseButton = container.find(".sp-choose"),
            toggleButton = container.find(".sp-palette-toggle"),
            isInput = boundElement.is("input"),
            isInputTypeColor = isInput && boundElement.attr("type") === "color" && inputTypeColorSupport(),
            shouldReplace = isInput && !flat,
            replacer = (shouldReplace) ? $(replaceInput).addClass(theme).addClass(opts.className).addClass(opts.replacerClassName) : $([]),
            offsetElement = (shouldReplace) ? replacer : boundElement,
            previewElement = replacer.find(".sp-preview-inner"),
            initialColor = opts.color || (isInput && boundElement.val()),
            colorOnShow = false,
            currentPreferredFormat = opts.preferredFormat,
            clickoutFiresChange = !opts.showButtons || opts.clickoutFiresChange,
            isEmpty = !initialColor,
            allowEmpty = opts.allowEmpty && !isInputTypeColor;

        function applyOptions() {

            if (opts.showPaletteOnly) {
                opts.showPalette = true;
            }

            toggleButton.text(opts.showPaletteOnly ? opts.togglePaletteMoreText : opts.togglePaletteLessText);

            if (opts.palette) {
                palette = opts.palette.slice(0);
                paletteArray = $.isArray(palette[0]) ? palette : [palette];
                paletteLookup = {};
                for (var i = 0; i < paletteArray.length; i++) {
                    for (var j = 0; j < paletteArray[i].length; j++) {
                        var rgb = tinycolor(paletteArray[i][j]).toRgbString();
                        paletteLookup[rgb] = true;
                    }
                }
            }

            container.toggleClass("sp-flat", flat);
            container.toggleClass("sp-input-disabled", !opts.showInput);
            container.toggleClass("sp-alpha-enabled", opts.showAlpha);
            container.toggleClass("sp-clear-enabled", allowEmpty);
            container.toggleClass("sp-buttons-disabled", !opts.showButtons);
            container.toggleClass("sp-palette-buttons-disabled", !opts.togglePaletteOnly);
            container.toggleClass("sp-palette-disabled", !opts.showPalette);
            container.toggleClass("sp-palette-only", opts.showPaletteOnly);
            container.toggleClass("sp-initial-disabled", !opts.showInitial);
            container.addClass(opts.className).addClass(opts.containerClassName);

            reflow();
        }

        function initialize() {

            if (IE) {
                container.find("*:not(input)").attr("unselectable", "on");
            }

            applyOptions();

            if (shouldReplace) {
                boundElement.after(replacer).hide();
            }

            if (!allowEmpty) {
                clearButton.hide();
            }

            if (flat) {
                boundElement.after(container).hide();
            }
            else {

                var appendTo = opts.appendTo === "parent" ? boundElement.parent() : $(opts.appendTo);
                if (appendTo.length !== 1) {
                    appendTo = $("body");
                }

                appendTo.append(container);
            }

            updateSelectionPaletteFromStorage();

            offsetElement.bind("click.spectrum touchstart.spectrum", function (e) {
                if (!disabled) {
                    toggle();
                }

                e.stopPropagation();

                if (!$(e.target).is("input")) {
                    e.preventDefault();
                }
            });

            if(boundElement.is(":disabled") || (opts.disabled === true)) {
                disable();
            }

            // Prevent clicks from bubbling up to document.  This would cause it to be hidden.
            container.click(stopPropagation);

            // Handle user typed input
            textInput.change(setFromTextInput);
            textInput.bind("paste", function () {
                setTimeout(setFromTextInput, 1);
            });
            textInput.keydown(function (e) { if (e.keyCode == 13) { setFromTextInput(); } });

            cancelButton.text(opts.cancelText);
            cancelButton.bind("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();
                revert();
                hide();
            });

            clearButton.attr("title", opts.clearText);
            clearButton.bind("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();
                isEmpty = true;
                move();

                if(flat) {
                    //for the flat style, this is a change event
                    updateOriginalInput(true);
                }
            });

            chooseButton.text(opts.chooseText);
            chooseButton.bind("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();

                if (IE && textInput.is(":focus")) {
                    textInput.trigger('change');
                }

                if (isValid()) {
                    updateOriginalInput(true);
                    hide();
                }
            });

            toggleButton.text(opts.showPaletteOnly ? opts.togglePaletteMoreText : opts.togglePaletteLessText);
            toggleButton.bind("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();

                opts.showPaletteOnly = !opts.showPaletteOnly;

                // To make sure the Picker area is drawn on the right, next to the
                // Palette area (and not below the palette), first move the Palette
                // to the left to make space for the picker, plus 5px extra.
                // The 'applyOptions' function puts the whole container back into place
                // and takes care of the button-text and the sp-palette-only CSS class.
                if (!opts.showPaletteOnly && !flat) {
                    container.css('left', '-=' + (pickerContainer.outerWidth(true) + 5));
                }
                applyOptions();
            });

            draggable(alphaSlider, function (dragX, dragY, e) {
                currentAlpha = (dragX / alphaWidth);
                isEmpty = false;
                if (e.shiftKey) {
                    currentAlpha = Math.round(currentAlpha * 10) / 10;
                }

                move();
            }, dragStart, dragStop);

            draggable(slider, function (dragX, dragY) {
                currentHue = parseFloat(dragY / slideHeight);
                isEmpty = false;
                if (!opts.showAlpha) {
                    currentAlpha = 1;
                }
                move();
            }, dragStart, dragStop);

            draggable(dragger, function (dragX, dragY, e) {

                // shift+drag should snap the movement to either the x or y axis.
                if (!e.shiftKey) {
                    shiftMovementDirection = null;
                }
                else if (!shiftMovementDirection) {
                    var oldDragX = currentSaturation * dragWidth;
                    var oldDragY = dragHeight - (currentValue * dragHeight);
                    var furtherFromX = Math.abs(dragX - oldDragX) > Math.abs(dragY - oldDragY);

                    shiftMovementDirection = furtherFromX ? "x" : "y";
                }

                var setSaturation = !shiftMovementDirection || shiftMovementDirection === "x";
                var setValue = !shiftMovementDirection || shiftMovementDirection === "y";

                if (setSaturation) {
                    currentSaturation = parseFloat(dragX / dragWidth);
                }
                if (setValue) {
                    currentValue = parseFloat((dragHeight - dragY) / dragHeight);
                }

                isEmpty = false;
                if (!opts.showAlpha) {
                    currentAlpha = 1;
                }

                move();

            }, dragStart, dragStop);

            if (!!initialColor) {
                set(initialColor);

                // In case color was black - update the preview UI and set the format
                // since the set function will not run (default color is black).
                updateUI();
                currentPreferredFormat = opts.preferredFormat || tinycolor(initialColor).format;

                addColorToSelectionPalette(initialColor);
            }
            else {
                updateUI();
            }

            if (flat) {
                show();
            }

            function paletteElementClick(e) {
                if (e.data && e.data.ignore) {
                    set($(e.target).closest(".sp-thumb-el").data("color"));
                    move();
                }
                else {
                    set($(e.target).closest(".sp-thumb-el").data("color"));
                    move();
                    updateOriginalInput(true);
                    if (opts.hideAfterPaletteSelect) {
                      hide();
                    }
                }

                return false;
            }

            var paletteEvent = IE ? "mousedown.spectrum" : "click.spectrum touchstart.spectrum";
            paletteContainer.delegate(".sp-thumb-el", paletteEvent, paletteElementClick);
            initialColorContainer.delegate(".sp-thumb-el:nth-child(1)", paletteEvent, { ignore: true }, paletteElementClick);
        }

        function updateSelectionPaletteFromStorage() {

            if (localStorageKey && window.localStorage) {

                // Migrate old palettes over to new format.  May want to remove this eventually.
                try {
                    var oldPalette = window.localStorage[localStorageKey].split(",#");
                    if (oldPalette.length > 1) {
                        delete window.localStorage[localStorageKey];
                        $.each(oldPalette, function(i, c) {
                             addColorToSelectionPalette(c);
                        });
                    }
                }
                catch(e) { }

                try {
                    selectionPalette = window.localStorage[localStorageKey].split(";");
                }
                catch (e) { }
            }
        }

        function addColorToSelectionPalette(color) {
            if (showSelectionPalette) {
                var rgb = tinycolor(color).toRgbString();
                if (!paletteLookup[rgb] && $.inArray(rgb, selectionPalette) === -1) {
                    selectionPalette.push(rgb);
                    while(selectionPalette.length > maxSelectionSize) {
                        selectionPalette.shift();
                    }
                }

                if (localStorageKey && window.localStorage) {
                    try {
                        window.localStorage[localStorageKey] = selectionPalette.join(";");
                    }
                    catch(e) { }
                }
            }
        }

        function getUniqueSelectionPalette() {
            var unique = [];
            if (opts.showPalette) {
                for (var i = 0; i < selectionPalette.length; i++) {
                    var rgb = tinycolor(selectionPalette[i]).toRgbString();

                    if (!paletteLookup[rgb]) {
                        unique.push(selectionPalette[i]);
                    }
                }
            }

            return unique.reverse().slice(0, opts.maxSelectionSize);
        }

        function drawPalette() {

            var currentColor = get();

            var html = $.map(paletteArray, function (palette, i) {
                return paletteTemplate(palette, currentColor, "sp-palette-row sp-palette-row-" + i, opts);
            });

            updateSelectionPaletteFromStorage();

            if (selectionPalette) {
                html.push(paletteTemplate(getUniqueSelectionPalette(), currentColor, "sp-palette-row sp-palette-row-selection", opts));
            }

            paletteContainer.html(html.join(""));
        }

        function drawInitial() {
            if (opts.showInitial) {
                var initial = colorOnShow;
                var current = get();
                initialColorContainer.html(paletteTemplate([initial, current], current, "sp-palette-row-initial", opts));
            }
        }

        function dragStart() {
            if (dragHeight <= 0 || dragWidth <= 0 || slideHeight <= 0) {
                reflow();
            }
            isDragging = true;
            container.addClass(draggingClass);
            shiftMovementDirection = null;
            boundElement.trigger('dragstart.spectrum', [ get() ]);
        }

        function dragStop() {
            isDragging = false;
            container.removeClass(draggingClass);
            boundElement.trigger('dragstop.spectrum', [ get() ]);
        }

        function setFromTextInput() {

            var value = textInput.val();

            if ((value === null || value === "") && allowEmpty) {
                set(null);
                updateOriginalInput(true);
            }
            else {
                var tiny = tinycolor(value);
                if (tiny.isValid()) {
                    set(tiny);
                    updateOriginalInput(true);
                }
                else {
                    textInput.addClass("sp-validation-error");
                }
            }
        }

        function toggle() {
            if (visible) {
                hide();
            }
            else {
                show();
            }
        }

        function show() {
            var event = $.Event('beforeShow.spectrum');

            if (visible) {
                reflow();
                return;
            }

            boundElement.trigger(event, [ get() ]);

            if (callbacks.beforeShow(get()) === false || event.isDefaultPrevented()) {
                return;
            }

            hideAll();
            visible = true;

            $(doc).bind("keydown.spectrum", onkeydown);
            $(doc).bind("click.spectrum", clickout);
            $(window).bind("resize.spectrum", resize);
            replacer.addClass("sp-active");
            container.removeClass("sp-hidden");

            reflow();
            updateUI();

            colorOnShow = get();

            drawInitial();
            callbacks.show(colorOnShow);
            boundElement.trigger('show.spectrum', [ colorOnShow ]);
        }

        function onkeydown(e) {
            // Close on ESC
            if (e.keyCode === 27) {
                hide();
            }
        }

        function clickout(e) {
            // Return on right click.
            if (e.button == 2) { return; }

            // If a drag event was happening during the mouseup, don't hide
            // on click.
            if (isDragging) { return; }

            if (clickoutFiresChange) {
                updateOriginalInput(true);
            }
            else {
                revert();
            }
            hide();
        }

        function hide() {
            // Return if hiding is unnecessary
            if (!visible || flat) { return; }
            visible = false;

            $(doc).unbind("keydown.spectrum", onkeydown);
            $(doc).unbind("click.spectrum", clickout);
            $(window).unbind("resize.spectrum", resize);

            replacer.removeClass("sp-active");
            container.addClass("sp-hidden");

            callbacks.hide(get());
            boundElement.trigger('hide.spectrum', [ get() ]);
        }

        function revert() {
            set(colorOnShow, true);
        }

        function set(color, ignoreFormatChange) {
            if (tinycolor.equals(color, get())) {
                // Update UI just in case a validation error needs
                // to be cleared.
                updateUI();
                return;
            }

            var newColor, newHsv;
            if (!color && allowEmpty) {
                isEmpty = true;
            } else {
                isEmpty = false;
                newColor = tinycolor(color);
                newHsv = newColor.toHsv();

                currentHue = (newHsv.h % 360) / 360;
                currentSaturation = newHsv.s;
                currentValue = newHsv.v;
                currentAlpha = newHsv.a;
            }
            updateUI();

            if (newColor && newColor.isValid() && !ignoreFormatChange) {
                currentPreferredFormat = opts.preferredFormat || newColor.getFormat();
            }
        }

        function get(opts) {
            opts = opts || { };

            if (allowEmpty && isEmpty) {
                return null;
            }

            return tinycolor.fromRatio({
                h: currentHue,
                s: currentSaturation,
                v: currentValue,
                a: Math.round(currentAlpha * 100) / 100
            }, { format: opts.format || currentPreferredFormat });
        }

        function isValid() {
            return !textInput.hasClass("sp-validation-error");
        }

        function move() {
            updateUI();

            callbacks.move(get());
            boundElement.trigger('move.spectrum', [ get() ]);
        }

        function updateUI() {

            textInput.removeClass("sp-validation-error");

            updateHelperLocations();

            // Update dragger background color (gradients take care of saturation and value).
            var flatColor = tinycolor.fromRatio({ h: currentHue, s: 1, v: 1 });
            dragger.css("background-color", flatColor.toHexString());

            // Get a format that alpha will be included in (hex and names ignore alpha)
            var format = currentPreferredFormat;
            if (currentAlpha < 1 && !(currentAlpha === 0 && format === "name")) {
                if (format === "hex" || format === "hex3" || format === "hex6" || format === "name") {
                    format = "rgb";
                }
            }

            var realColor = get({ format: format }),
                displayColor = '';

             //reset background info for preview element
            previewElement.removeClass("sp-clear-display");
            previewElement.css('background-color', 'transparent');

            if (!realColor && allowEmpty) {
                // Update the replaced elements background with icon indicating no color selection
                previewElement.addClass("sp-clear-display");
            }
            else {
                var realHex = realColor.toHexString(),
                    realRgb = realColor.toRgbString();

                // Update the replaced elements background color (with actual selected color)
                if (rgbaSupport || realColor.alpha === 1) {
                    previewElement.css("background-color", realRgb);
                }
                else {
                    previewElement.css("background-color", "transparent");
                    previewElement.css("filter", realColor.toFilter());
                }

                if (opts.showAlpha) {
                    var rgb = realColor.toRgb();
                    rgb.a = 0;
                    var realAlpha = tinycolor(rgb).toRgbString();
                    var gradient = "linear-gradient(left, " + realAlpha + ", " + realHex + ")";

                    if (IE) {
                        alphaSliderInner.css("filter", tinycolor(realAlpha).toFilter({ gradientType: 1 }, realHex));
                    }
                    else {
                        alphaSliderInner.css("background", "-webkit-" + gradient);
                        alphaSliderInner.css("background", "-moz-" + gradient);
                        alphaSliderInner.css("background", "-ms-" + gradient);
                        // Use current syntax gradient on unprefixed property.
                        alphaSliderInner.css("background",
                            "linear-gradient(to right, " + realAlpha + ", " + realHex + ")");
                    }
                }

                displayColor = realColor.toString(format);
            }

            // Update the text entry input as it changes happen
            if (opts.showInput) {
                textInput.val(displayColor);
            }

            if (opts.showPalette) {
                drawPalette();
            }

            drawInitial();
        }

        function updateHelperLocations() {
            var s = currentSaturation;
            var v = currentValue;

            if(allowEmpty && isEmpty) {
                //if selected color is empty, hide the helpers
                alphaSlideHelper.hide();
                slideHelper.hide();
                dragHelper.hide();
            }
            else {
                //make sure helpers are visible
                alphaSlideHelper.show();
                slideHelper.show();
                dragHelper.show();

                // Where to show the little circle in that displays your current selected color
                var dragX = s * dragWidth;
                var dragY = dragHeight - (v * dragHeight);
                dragX = Math.max(
                    -dragHelperHeight,
                    Math.min(dragWidth - dragHelperHeight, dragX - dragHelperHeight)
                );
                dragY = Math.max(
                    -dragHelperHeight,
                    Math.min(dragHeight - dragHelperHeight, dragY - dragHelperHeight)
                );
                dragHelper.css({
                    "top": dragY + "px",
                    "left": dragX + "px"
                });

                var alphaX = currentAlpha * alphaWidth;
                alphaSlideHelper.css({
                    "left": (alphaX - (alphaSlideHelperWidth / 2)) + "px"
                });

                // Where to show the bar that displays your current selected hue
                var slideY = (currentHue) * slideHeight;
                slideHelper.css({
                    "top": (slideY - slideHelperHeight) + "px"
                });
            }
        }

        function updateOriginalInput(fireCallback) {
            var color = get(),
                displayColor = '',
                hasChanged = !tinycolor.equals(color, colorOnShow);

            if (color) {
                displayColor = color.toString(currentPreferredFormat);
                // Update the selection palette with the current color
                addColorToSelectionPalette(color);
            }

            if (isInput) {
                boundElement.val(displayColor);
            }

            if (fireCallback && hasChanged) {
                callbacks.change(color);
                boundElement.trigger('change', [ color ]);
            }
        }

        function reflow() {
            if (!visible) {
                return; // Calculations would be useless and wouldn't be reliable anyways
            }
            dragWidth = dragger.width();
            dragHeight = dragger.height();
            dragHelperHeight = dragHelper.height();
            slideWidth = slider.width();
            slideHeight = slider.height();
            slideHelperHeight = slideHelper.height();
            alphaWidth = alphaSlider.width();
            alphaSlideHelperWidth = alphaSlideHelper.width();

            if (!flat) {
                container.css("position", "absolute");
                if (opts.offset) {
                    container.offset(opts.offset);
                } else {
                    container.offset(getOffset(container, offsetElement));
                }
            }

            updateHelperLocations();

            if (opts.showPalette) {
                drawPalette();
            }

            boundElement.trigger('reflow.spectrum');
        }

        function destroy() {
            boundElement.show();
            offsetElement.unbind("click.spectrum touchstart.spectrum");
            container.remove();
            replacer.remove();
            spectrums[spect.id] = null;
        }

        function option(optionName, optionValue) {
            if (optionName === undefined) {
                return $.extend({}, opts);
            }
            if (optionValue === undefined) {
                return opts[optionName];
            }

            opts[optionName] = optionValue;

            if (optionName === "preferredFormat") {
                currentPreferredFormat = opts.preferredFormat;
            }
            applyOptions();
        }

        function enable() {
            disabled = false;
            boundElement.attr("disabled", false);
            offsetElement.removeClass("sp-disabled");
        }

        function disable() {
            hide();
            disabled = true;
            boundElement.attr("disabled", true);
            offsetElement.addClass("sp-disabled");
        }

        function setOffset(coord) {
            opts.offset = coord;
            reflow();
        }

        initialize();

        var spect = {
            show: show,
            hide: hide,
            toggle: toggle,
            reflow: reflow,
            option: option,
            enable: enable,
            disable: disable,
            offset: setOffset,
            set: function (c) {
                set(c);
                updateOriginalInput();
            },
            get: get,
            destroy: destroy,
            container: container
        };

        spect.id = spectrums.push(spect) - 1;

        return spect;
    }

    /**
    * checkOffset - get the offset below/above and left/right element depending on screen position
    * Thanks https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.datepicker.js
    */
    function getOffset(picker, input) {
        var extraY = 0;
        var dpWidth = picker.outerWidth();
        var dpHeight = picker.outerHeight();
        var inputHeight = input.outerHeight();
        var doc = picker[0].ownerDocument;
        var docElem = doc.documentElement;
        var viewWidth = docElem.clientWidth + $(doc).scrollLeft();
        var viewHeight = docElem.clientHeight + $(doc).scrollTop();
        var offset = input.offset();
        offset.top += inputHeight;

        offset.left -=
            Math.min(offset.left, (offset.left + dpWidth > viewWidth && viewWidth > dpWidth) ?
            Math.abs(offset.left + dpWidth - viewWidth) : 0);

        offset.top -=
            Math.min(offset.top, ((offset.top + dpHeight > viewHeight && viewHeight > dpHeight) ?
            Math.abs(dpHeight + inputHeight - extraY) : extraY));

        return offset;
    }

    /**
    * noop - do nothing
    */
    function noop() {

    }

    /**
    * stopPropagation - makes the code only doing this a little easier to read in line
    */
    function stopPropagation(e) {
        e.stopPropagation();
    }

    /**
    * Create a function bound to a given object
    * Thanks to underscore.js
    */
    function bind(func, obj) {
        var slice = Array.prototype.slice;
        var args = slice.call(arguments, 2);
        return function () {
            return func.apply(obj, args.concat(slice.call(arguments)));
        };
    }

    /**
    * Lightweight drag helper.  Handles containment within the element, so that
    * when dragging, the x is within [0,element.width] and y is within [0,element.height]
    */
    function draggable(element, onmove, onstart, onstop) {
        onmove = onmove || function () { };
        onstart = onstart || function () { };
        onstop = onstop || function () { };
        var doc = document;
        var dragging = false;
        var offset = {};
        var maxHeight = 0;
        var maxWidth = 0;
        var hasTouch = ('ontouchstart' in window);

        var duringDragEvents = {};
        duringDragEvents["selectstart"] = prevent;
        duringDragEvents["dragstart"] = prevent;
        duringDragEvents["touchmove mousemove"] = move;
        duringDragEvents["touchend mouseup"] = stop;

        function prevent(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.returnValue = false;
        }

        function move(e) {
            if (dragging) {
                // Mouseup happened outside of window
                if (IE && doc.documentMode < 9 && !e.button) {
                    return stop();
                }

                var t0 = e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0];
                var pageX = t0 && t0.pageX || e.pageX;
                var pageY = t0 && t0.pageY || e.pageY;

                var dragX = Math.max(0, Math.min(pageX - offset.left, maxWidth));
                var dragY = Math.max(0, Math.min(pageY - offset.top, maxHeight));

                if (hasTouch) {
                    // Stop scrolling in iOS
                    prevent(e);
                }

                onmove.apply(element, [dragX, dragY, e]);
            }
        }

        function start(e) {
            var rightclick = (e.which) ? (e.which == 3) : (e.button == 2);

            if (!rightclick && !dragging) {
                if (onstart.apply(element, arguments) !== false) {
                    dragging = true;
                    maxHeight = $(element).height();
                    maxWidth = $(element).width();
                    offset = $(element).offset();

                    $(doc).bind(duringDragEvents);
                    $(doc.body).addClass("sp-dragging");

                    move(e);

                    prevent(e);
                }
            }
        }

        function stop() {
            if (dragging) {
                $(doc).unbind(duringDragEvents);
                $(doc.body).removeClass("sp-dragging");

                // Wait a tick before notifying observers to allow the click event
                // to fire in Chrome.
                setTimeout(function() {
                    onstop.apply(element, arguments);
                }, 0);
            }
            dragging = false;
        }

        $(element).bind("touchstart mousedown", start);
    }

    function throttle(func, wait, debounce) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var throttler = function () {
                timeout = null;
                func.apply(context, args);
            };
            if (debounce) clearTimeout(timeout);
            if (debounce || !timeout) timeout = setTimeout(throttler, wait);
        };
    }

    function inputTypeColorSupport() {
        return $.fn.spectrum.inputTypeColorSupport();
    }

    /**
    * Define a jQuery plugin
    */
    var dataID = "spectrum.id";
    $.fn.spectrum = function (opts, extra) {

        if (typeof opts == "string") {

            var returnValue = this;
            var args = Array.prototype.slice.call( arguments, 1 );

            this.each(function () {
                var spect = spectrums[$(this).data(dataID)];
                if (spect) {
                    var method = spect[opts];
                    if (!method) {
                        throw new Error( "Spectrum: no such method: '" + opts + "'" );
                    }

                    if (opts == "get") {
                        returnValue = spect.get();
                    }
                    else if (opts == "container") {
                        returnValue = spect.container;
                    }
                    else if (opts == "option") {
                        returnValue = spect.option.apply(spect, args);
                    }
                    else if (opts == "destroy") {
                        spect.destroy();
                        $(this).removeData(dataID);
                    }
                    else {
                        method.apply(spect, args);
                    }
                }
            });

            return returnValue;
        }

        // Initializing a new instance of spectrum
        return this.spectrum("destroy").each(function () {
            var options = $.extend({}, opts, $(this).data());
            var spect = spectrum(this, options);
            $(this).data(dataID, spect.id);
        });
    };

    $.fn.spectrum.load = true;
    $.fn.spectrum.loadOpts = {};
    $.fn.spectrum.draggable = draggable;
    $.fn.spectrum.defaults = defaultOpts;
    $.fn.spectrum.inputTypeColorSupport = function inputTypeColorSupport() {
        if (typeof inputTypeColorSupport._cachedResult === "undefined") {
            var colorInput = $("<input type='color'/>")[0]; // if color element is supported, value will default to not null
            inputTypeColorSupport._cachedResult = colorInput.type === "color" && colorInput.value !== "";
        }
        return inputTypeColorSupport._cachedResult;
    };

    $.spectrum = { };
    $.spectrum.localization = { };
    $.spectrum.palettes = { };

    $.fn.spectrum.processNativeColorInputs = function () {
        var colorInputs = $("input[type=color]");
        if (colorInputs.length && !inputTypeColorSupport()) {
            colorInputs.spectrum({
                preferredFormat: "hex6"
            });
        }
    };

    // TinyColor v1.1.2
    // https://github.com/bgrins/TinyColor
    // Brian Grinstead, MIT License

    (function() {

    var trimLeft = /^[\s,#]+/,
        trimRight = /\s+$/,
        tinyCounter = 0,
        math = Math,
        mathRound = math.round,
        mathMin = math.min,
        mathMax = math.max,
        mathRandom = math.random;

    var tinycolor = function(color, opts) {

        color = (color) ? color : '';
        opts = opts || { };

        // If input is already a tinycolor, return itself
        if (color instanceof tinycolor) {
           return color;
        }
        // If we are called as a function, call using new instead
        if (!(this instanceof tinycolor)) {
            return new tinycolor(color, opts);
        }

        var rgb = inputToRGB(color);
        this._originalInput = color,
        this._r = rgb.r,
        this._g = rgb.g,
        this._b = rgb.b,
        this._a = rgb.a,
        this._roundA = mathRound(100*this._a) / 100,
        this._format = opts.format || rgb.format;
        this._gradientType = opts.gradientType;

        // Don't let the range of [0,255] come back in [0,1].
        // Potentially lose a little bit of precision here, but will fix issues where
        // .5 gets interpreted as half of the total, instead of half of 1
        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
        if (this._r < 1) { this._r = mathRound(this._r); }
        if (this._g < 1) { this._g = mathRound(this._g); }
        if (this._b < 1) { this._b = mathRound(this._b); }

        this._ok = rgb.ok;
        this._tc_id = tinyCounter++;
    };

    tinycolor.prototype = {
        isDark: function() {
            return this.getBrightness() < 128;
        },
        isLight: function() {
            return !this.isDark();
        },
        isValid: function() {
            return this._ok;
        },
        getOriginalInput: function() {
          return this._originalInput;
        },
        getFormat: function() {
            return this._format;
        },
        getAlpha: function() {
            return this._a;
        },
        getBrightness: function() {
            var rgb = this.toRgb();
            return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        },
        setAlpha: function(value) {
            this._a = boundAlpha(value);
            this._roundA = mathRound(100*this._a) / 100;
            return this;
        },
        toHsv: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
        },
        toHsvString: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
            return (this._a == 1) ?
              "hsv("  + h + ", " + s + "%, " + v + "%)" :
              "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
        },
        toHsl: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
        },
        toHslString: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
            return (this._a == 1) ?
              "hsl("  + h + ", " + s + "%, " + l + "%)" :
              "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
        },
        toHex: function(allow3Char) {
            return rgbToHex(this._r, this._g, this._b, allow3Char);
        },
        toHexString: function(allow3Char) {
            return '#' + this.toHex(allow3Char);
        },
        toHex8: function() {
            return rgbaToHex(this._r, this._g, this._b, this._a);
        },
        toHex8String: function() {
            return '#' + this.toHex8();
        },
        toRgb: function() {
            return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
        },
        toRgbString: function() {
            return (this._a == 1) ?
              "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
              "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
        },
        toPercentageRgb: function() {
            return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
        },
        toPercentageRgbString: function() {
            return (this._a == 1) ?
              "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
              "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
        },
        toName: function() {
            if (this._a === 0) {
                return "transparent";
            }

            if (this._a < 1) {
                return false;
            }

            return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
        },
        toFilter: function(secondColor) {
            var hex8String = '#' + rgbaToHex(this._r, this._g, this._b, this._a);
            var secondHex8String = hex8String;
            var gradientType = this._gradientType ? "GradientType = 1, " : "";

            if (secondColor) {
                var s = tinycolor(secondColor);
                secondHex8String = s.toHex8String();
            }

            return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
        },
        toString: function(format) {
            var formatSet = !!format;
            format = format || this._format;

            var formattedString = false;
            var hasAlpha = this._a < 1 && this._a >= 0;
            var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "name");

            if (needsAlphaFormat) {
                // Special case for "transparent", all other non-alpha formats
                // will return rgba when there is transparency.
                if (format === "name" && this._a === 0) {
                    return this.toName();
                }
                return this.toRgbString();
            }
            if (format === "rgb") {
                formattedString = this.toRgbString();
            }
            if (format === "prgb") {
                formattedString = this.toPercentageRgbString();
            }
            if (format === "hex" || format === "hex6") {
                formattedString = this.toHexString();
            }
            if (format === "hex3") {
                formattedString = this.toHexString(true);
            }
            if (format === "hex8") {
                formattedString = this.toHex8String();
            }
            if (format === "name") {
                formattedString = this.toName();
            }
            if (format === "hsl") {
                formattedString = this.toHslString();
            }
            if (format === "hsv") {
                formattedString = this.toHsvString();
            }

            return formattedString || this.toHexString();
        },

        _applyModification: function(fn, args) {
            var color = fn.apply(null, [this].concat([].slice.call(args)));
            this._r = color._r;
            this._g = color._g;
            this._b = color._b;
            this.setAlpha(color._a);
            return this;
        },
        lighten: function() {
            return this._applyModification(lighten, arguments);
        },
        brighten: function() {
            return this._applyModification(brighten, arguments);
        },
        darken: function() {
            return this._applyModification(darken, arguments);
        },
        desaturate: function() {
            return this._applyModification(desaturate, arguments);
        },
        saturate: function() {
            return this._applyModification(saturate, arguments);
        },
        greyscale: function() {
            return this._applyModification(greyscale, arguments);
        },
        spin: function() {
            return this._applyModification(spin, arguments);
        },

        _applyCombination: function(fn, args) {
            return fn.apply(null, [this].concat([].slice.call(args)));
        },
        analogous: function() {
            return this._applyCombination(analogous, arguments);
        },
        complement: function() {
            return this._applyCombination(complement, arguments);
        },
        monochromatic: function() {
            return this._applyCombination(monochromatic, arguments);
        },
        splitcomplement: function() {
            return this._applyCombination(splitcomplement, arguments);
        },
        triad: function() {
            return this._applyCombination(triad, arguments);
        },
        tetrad: function() {
            return this._applyCombination(tetrad, arguments);
        }
    };

    // If input is an object, force 1 into "1.0" to handle ratios properly
    // String input requires "1.0" as input, so 1 will be treated as 1
    tinycolor.fromRatio = function(color, opts) {
        if (typeof color == "object") {
            var newColor = {};
            for (var i in color) {
                if (color.hasOwnProperty(i)) {
                    if (i === "a") {
                        newColor[i] = color[i];
                    }
                    else {
                        newColor[i] = convertToPercentage(color[i]);
                    }
                }
            }
            color = newColor;
        }

        return tinycolor(color, opts);
    };

    // Given a string or object, convert that input to RGB
    // Possible string inputs:
    //
    //     "red"
    //     "#f00" or "f00"
    //     "#ff0000" or "ff0000"
    //     "#ff000000" or "ff000000"
    //     "rgb 255 0 0" or "rgb (255, 0, 0)"
    //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
    //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
    //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
    //     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
    //     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
    //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
    //
    function inputToRGB(color) {

        var rgb = { r: 0, g: 0, b: 0 };
        var a = 1;
        var ok = false;
        var format = false;

        if (typeof color == "string") {
            color = stringInputToObject(color);
        }

        if (typeof color == "object") {
            if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
                rgb = rgbToRgb(color.r, color.g, color.b);
                ok = true;
                format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
            }
            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
                color.s = convertToPercentage(color.s);
                color.v = convertToPercentage(color.v);
                rgb = hsvToRgb(color.h, color.s, color.v);
                ok = true;
                format = "hsv";
            }
            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l")) {
                color.s = convertToPercentage(color.s);
                color.l = convertToPercentage(color.l);
                rgb = hslToRgb(color.h, color.s, color.l);
                ok = true;
                format = "hsl";
            }

            if (color.hasOwnProperty("a")) {
                a = color.a;
            }
        }

        a = boundAlpha(a);

        return {
            ok: ok,
            format: color.format || format,
            r: mathMin(255, mathMax(rgb.r, 0)),
            g: mathMin(255, mathMax(rgb.g, 0)),
            b: mathMin(255, mathMax(rgb.b, 0)),
            a: a
        };
    }


    // Conversion Functions
    // --------------------

    // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
    // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

    // `rgbToRgb`
    // Handle bounds / percentage checking to conform to CSS color spec
    // <http://www.w3.org/TR/css3-color/>
    // *Assumes:* r, g, b in [0, 255] or [0, 1]
    // *Returns:* { r, g, b } in [0, 255]
    function rgbToRgb(r, g, b){
        return {
            r: bound01(r, 255) * 255,
            g: bound01(g, 255) * 255,
            b: bound01(b, 255) * 255
        };
    }

    // `rgbToHsl`
    // Converts an RGB color value to HSL.
    // *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
    // *Returns:* { h, s, l } in [0,1]
    function rgbToHsl(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min) {
            h = s = 0; // achromatic
        }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h, s: s, l: l };
    }

    // `hslToRgb`
    // Converts an HSL color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
    function hslToRgb(h, s, l) {
        var r, g, b;

        h = bound01(h, 360);
        s = bound01(s, 100);
        l = bound01(l, 100);

        function hue2rgb(p, q, t) {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        if(s === 0) {
            r = g = b = l; // achromatic
        }
        else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHsv`
    // Converts an RGB color value to HSV
    // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
    // *Returns:* { h, s, v } in [0,1]
    function rgbToHsv(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max === 0 ? 0 : d / max;

        if(max == min) {
            h = 0; // achromatic
        }
        else {
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h, s: s, v: v };
    }

    // `hsvToRgb`
    // Converts an HSV color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
     function hsvToRgb(h, s, v) {

        h = bound01(h, 360) * 6;
        s = bound01(s, 100);
        v = bound01(v, 100);

        var i = math.floor(h),
            f = h - i,
            p = v * (1 - s),
            q = v * (1 - f * s),
            t = v * (1 - (1 - f) * s),
            mod = i % 6,
            r = [v, q, p, p, t, v][mod],
            g = [t, v, v, q, p, p][mod],
            b = [p, p, t, v, v, q][mod];

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHex`
    // Converts an RGB color to hex
    // Assumes r, g, and b are contained in the set [0, 255]
    // Returns a 3 or 6 character hex
    function rgbToHex(r, g, b, allow3Char) {

        var hex = [
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        // Return a 3 character hex if possible
        if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
        }

        return hex.join("");
    }
        // `rgbaToHex`
        // Converts an RGBA color plus alpha transparency to hex
        // Assumes r, g, b and a are contained in the set [0, 255]
        // Returns an 8 character hex
        function rgbaToHex(r, g, b, a) {

            var hex = [
                pad2(convertDecimalToHex(a)),
                pad2(mathRound(r).toString(16)),
                pad2(mathRound(g).toString(16)),
                pad2(mathRound(b).toString(16))
            ];

            return hex.join("");
        }

    // `equals`
    // Can be called with any tinycolor input
    tinycolor.equals = function (color1, color2) {
        if (!color1 || !color2) { return false; }
        return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    };
    tinycolor.random = function() {
        return tinycolor.fromRatio({
            r: mathRandom(),
            g: mathRandom(),
            b: mathRandom()
        });
    };


    // Modification Functions
    // ----------------------
    // Thanks to less.js for some of the basics here
    // <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

    function desaturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s -= amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function saturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s += amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function greyscale(color) {
        return tinycolor(color).desaturate(100);
    }

    function lighten (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l += amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    function brighten(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var rgb = tinycolor(color).toRgb();
        rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
        rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
        rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
        return tinycolor(rgb);
    }

    function darken (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l -= amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    // Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
    // Values outside of this range will be wrapped into this range.
    function spin(color, amount) {
        var hsl = tinycolor(color).toHsl();
        var hue = (mathRound(hsl.h) + amount) % 360;
        hsl.h = hue < 0 ? 360 + hue : hue;
        return tinycolor(hsl);
    }

    // Combination Functions
    // ---------------------
    // Thanks to jQuery xColor for some of the ideas behind these
    // <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

    function complement(color) {
        var hsl = tinycolor(color).toHsl();
        hsl.h = (hsl.h + 180) % 360;
        return tinycolor(hsl);
    }

    function triad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function tetrad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function splitcomplement(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
            tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
        ];
    }

    function analogous(color, results, slices) {
        results = results || 6;
        slices = slices || 30;

        var hsl = tinycolor(color).toHsl();
        var part = 360 / slices;
        var ret = [tinycolor(color)];

        for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
            hsl.h = (hsl.h + part) % 360;
            ret.push(tinycolor(hsl));
        }
        return ret;
    }

    function monochromatic(color, results) {
        results = results || 6;
        var hsv = tinycolor(color).toHsv();
        var h = hsv.h, s = hsv.s, v = hsv.v;
        var ret = [];
        var modification = 1 / results;

        while (results--) {
            ret.push(tinycolor({ h: h, s: s, v: v}));
            v = (v + modification) % 1;
        }

        return ret;
    }

    // Utility Functions
    // ---------------------

    tinycolor.mix = function(color1, color2, amount) {
        amount = (amount === 0) ? 0 : (amount || 50);

        var rgb1 = tinycolor(color1).toRgb();
        var rgb2 = tinycolor(color2).toRgb();

        var p = amount / 100;
        var w = p * 2 - 1;
        var a = rgb2.a - rgb1.a;

        var w1;

        if (w * a == -1) {
            w1 = w;
        } else {
            w1 = (w + a) / (1 + w * a);
        }

        w1 = (w1 + 1) / 2;

        var w2 = 1 - w1;

        var rgba = {
            r: rgb2.r * w1 + rgb1.r * w2,
            g: rgb2.g * w1 + rgb1.g * w2,
            b: rgb2.b * w1 + rgb1.b * w2,
            a: rgb2.a * p  + rgb1.a * (1 - p)
        };

        return tinycolor(rgba);
    };


    // Readability Functions
    // ---------------------
    // <http://www.w3.org/TR/AERT#color-contrast>

    // `readability`
    // Analyze the 2 colors and returns an object with the following properties:
    //    `brightness`: difference in brightness between the two colors
    //    `color`: difference in color/hue between the two colors
    tinycolor.readability = function(color1, color2) {
        var c1 = tinycolor(color1);
        var c2 = tinycolor(color2);
        var rgb1 = c1.toRgb();
        var rgb2 = c2.toRgb();
        var brightnessA = c1.getBrightness();
        var brightnessB = c2.getBrightness();
        var colorDiff = (
            Math.max(rgb1.r, rgb2.r) - Math.min(rgb1.r, rgb2.r) +
            Math.max(rgb1.g, rgb2.g) - Math.min(rgb1.g, rgb2.g) +
            Math.max(rgb1.b, rgb2.b) - Math.min(rgb1.b, rgb2.b)
        );

        return {
            brightness: Math.abs(brightnessA - brightnessB),
            color: colorDiff
        };
    };

    // `readable`
    // http://www.w3.org/TR/AERT#color-contrast
    // Ensure that foreground and background color combinations provide sufficient contrast.
    // *Example*
    //    tinycolor.isReadable("#000", "#111") => false
    tinycolor.isReadable = function(color1, color2) {
        var readability = tinycolor.readability(color1, color2);
        return readability.brightness > 125 && readability.color > 500;
    };

    // `mostReadable`
    // Given a base color and a list of possible foreground or background
    // colors for that base, returns the most readable color.
    // *Example*
    //    tinycolor.mostReadable("#123", ["#fff", "#000"]) => "#000"
    tinycolor.mostReadable = function(baseColor, colorList) {
        var bestColor = null;
        var bestScore = 0;
        var bestIsReadable = false;
        for (var i=0; i < colorList.length; i++) {

            // We normalize both around the "acceptable" breaking point,
            // but rank brightness constrast higher than hue.

            var readability = tinycolor.readability(baseColor, colorList[i]);
            var readable = readability.brightness > 125 && readability.color > 500;
            var score = 3 * (readability.brightness / 125) + (readability.color / 500);

            if ((readable && ! bestIsReadable) ||
                (readable && bestIsReadable && score > bestScore) ||
                ((! readable) && (! bestIsReadable) && score > bestScore)) {
                bestIsReadable = readable;
                bestScore = score;
                bestColor = tinycolor(colorList[i]);
            }
        }
        return bestColor;
    };


    // Big List of Colors
    // ------------------
    // <http://www.w3.org/TR/css3-color/#svg-color>
    var names = tinycolor.names = {
        aliceblue: "f0f8ff",
        antiquewhite: "faebd7",
        aqua: "0ff",
        aquamarine: "7fffd4",
        azure: "f0ffff",
        beige: "f5f5dc",
        bisque: "ffe4c4",
        black: "000",
        blanchedalmond: "ffebcd",
        blue: "00f",
        blueviolet: "8a2be2",
        brown: "a52a2a",
        burlywood: "deb887",
        burntsienna: "ea7e5d",
        cadetblue: "5f9ea0",
        chartreuse: "7fff00",
        chocolate: "d2691e",
        coral: "ff7f50",
        cornflowerblue: "6495ed",
        cornsilk: "fff8dc",
        crimson: "dc143c",
        cyan: "0ff",
        darkblue: "00008b",
        darkcyan: "008b8b",
        darkgoldenrod: "b8860b",
        darkgray: "a9a9a9",
        darkgreen: "006400",
        darkgrey: "a9a9a9",
        darkkhaki: "bdb76b",
        darkmagenta: "8b008b",
        darkolivegreen: "556b2f",
        darkorange: "ff8c00",
        darkorchid: "9932cc",
        darkred: "8b0000",
        darksalmon: "e9967a",
        darkseagreen: "8fbc8f",
        darkslateblue: "483d8b",
        darkslategray: "2f4f4f",
        darkslategrey: "2f4f4f",
        darkturquoise: "00ced1",
        darkviolet: "9400d3",
        deeppink: "ff1493",
        deepskyblue: "00bfff",
        dimgray: "696969",
        dimgrey: "696969",
        dodgerblue: "1e90ff",
        firebrick: "b22222",
        floralwhite: "fffaf0",
        forestgreen: "228b22",
        fuchsia: "f0f",
        gainsboro: "dcdcdc",
        ghostwhite: "f8f8ff",
        gold: "ffd700",
        goldenrod: "daa520",
        gray: "808080",
        green: "008000",
        greenyellow: "adff2f",
        grey: "808080",
        honeydew: "f0fff0",
        hotpink: "ff69b4",
        indianred: "cd5c5c",
        indigo: "4b0082",
        ivory: "fffff0",
        khaki: "f0e68c",
        lavender: "e6e6fa",
        lavenderblush: "fff0f5",
        lawngreen: "7cfc00",
        lemonchiffon: "fffacd",
        lightblue: "add8e6",
        lightcoral: "f08080",
        lightcyan: "e0ffff",
        lightgoldenrodyellow: "fafad2",
        lightgray: "d3d3d3",
        lightgreen: "90ee90",
        lightgrey: "d3d3d3",
        lightpink: "ffb6c1",
        lightsalmon: "ffa07a",
        lightseagreen: "20b2aa",
        lightskyblue: "87cefa",
        lightslategray: "789",
        lightslategrey: "789",
        lightsteelblue: "b0c4de",
        lightyellow: "ffffe0",
        lime: "0f0",
        limegreen: "32cd32",
        linen: "faf0e6",
        magenta: "f0f",
        maroon: "800000",
        mediumaquamarine: "66cdaa",
        mediumblue: "0000cd",
        mediumorchid: "ba55d3",
        mediumpurple: "9370db",
        mediumseagreen: "3cb371",
        mediumslateblue: "7b68ee",
        mediumspringgreen: "00fa9a",
        mediumturquoise: "48d1cc",
        mediumvioletred: "c71585",
        midnightblue: "191970",
        mintcream: "f5fffa",
        mistyrose: "ffe4e1",
        moccasin: "ffe4b5",
        navajowhite: "ffdead",
        navy: "000080",
        oldlace: "fdf5e6",
        olive: "808000",
        olivedrab: "6b8e23",
        orange: "ffa500",
        orangered: "ff4500",
        orchid: "da70d6",
        palegoldenrod: "eee8aa",
        palegreen: "98fb98",
        paleturquoise: "afeeee",
        palevioletred: "db7093",
        papayawhip: "ffefd5",
        peachpuff: "ffdab9",
        peru: "cd853f",
        pink: "ffc0cb",
        plum: "dda0dd",
        powderblue: "b0e0e6",
        purple: "800080",
        rebeccapurple: "663399",
        red: "f00",
        rosybrown: "bc8f8f",
        royalblue: "4169e1",
        saddlebrown: "8b4513",
        salmon: "fa8072",
        sandybrown: "f4a460",
        seagreen: "2e8b57",
        seashell: "fff5ee",
        sienna: "a0522d",
        silver: "c0c0c0",
        skyblue: "87ceeb",
        slateblue: "6a5acd",
        slategray: "708090",
        slategrey: "708090",
        snow: "fffafa",
        springgreen: "00ff7f",
        steelblue: "4682b4",
        tan: "d2b48c",
        teal: "008080",
        thistle: "d8bfd8",
        tomato: "ff6347",
        turquoise: "40e0d0",
        violet: "ee82ee",
        wheat: "f5deb3",
        white: "fff",
        whitesmoke: "f5f5f5",
        yellow: "ff0",
        yellowgreen: "9acd32"
    };

    // Make it easy to access colors via `hexNames[hex]`
    var hexNames = tinycolor.hexNames = flip(names);


    // Utilities
    // ---------

    // `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
    function flip(o) {
        var flipped = { };
        for (var i in o) {
            if (o.hasOwnProperty(i)) {
                flipped[o[i]] = i;
            }
        }
        return flipped;
    }

    // Return a valid alpha value [0,1] with all invalid values being set to 1
    function boundAlpha(a) {
        a = parseFloat(a);

        if (isNaN(a) || a < 0 || a > 1) {
            a = 1;
        }

        return a;
    }

    // Take input from [0, n] and return it as [0, 1]
    function bound01(n, max) {
        if (isOnePointZero(n)) { n = "100%"; }

        var processPercent = isPercentage(n);
        n = mathMin(max, mathMax(0, parseFloat(n)));

        // Automatically convert percentage into number
        if (processPercent) {
            n = parseInt(n * max, 10) / 100;
        }

        // Handle floating point rounding errors
        if ((math.abs(n - max) < 0.000001)) {
            return 1;
        }

        // Convert into [0, 1] range if it isn't already
        return (n % max) / parseFloat(max);
    }

    // Force a number between 0 and 1
    function clamp01(val) {
        return mathMin(1, mathMax(0, val));
    }

    // Parse a base-16 hex value into a base-10 integer
    function parseIntFromHex(val) {
        return parseInt(val, 16);
    }

    // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
    // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
    function isOnePointZero(n) {
        return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
    }

    // Check to see if string passed in is a percentage
    function isPercentage(n) {
        return typeof n === "string" && n.indexOf('%') != -1;
    }

    // Force a hex value to have 2 characters
    function pad2(c) {
        return c.length == 1 ? '0' + c : '' + c;
    }

    // Replace a decimal with it's percentage value
    function convertToPercentage(n) {
        if (n <= 1) {
            n = (n * 100) + "%";
        }

        return n;
    }

    // Converts a decimal to a hex value
    function convertDecimalToHex(d) {
        return Math.round(parseFloat(d) * 255).toString(16);
    }
    // Converts a hex value to a decimal
    function convertHexToDecimal(h) {
        return (parseIntFromHex(h) / 255);
    }

    var matchers = (function() {

        // <http://www.w3.org/TR/css3-values/#integers>
        var CSS_INTEGER = "[-\\+]?\\d+%?";

        // <http://www.w3.org/TR/css3-values/#number-value>
        var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

        // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
        var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

        // Actual matching.
        // Parentheses and commas are optional, but not required.
        // Whitespace can take the place of commas or opening paren
        var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
        var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

        return {
            rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
            rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
            hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
            hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
            hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
            hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
            hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
            hex8: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
        };
    })();

    // `stringInputToObject`
    // Permissive string parsing.  Take in a number of formats, and output an object
    // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
    function stringInputToObject(color) {

        color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
        var named = false;
        if (names[color]) {
            color = names[color];
            named = true;
        }
        else if (color == 'transparent') {
            return { r: 0, g: 0, b: 0, a: 0, format: "name" };
        }

        // Try to match string input using regular expressions.
        // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
        // Just return an object and let the conversion functions handle that.
        // This way the result will be the same whether the tinycolor is initialized with string or object.
        var match;
        if ((match = matchers.rgb.exec(color))) {
            return { r: match[1], g: match[2], b: match[3] };
        }
        if ((match = matchers.rgba.exec(color))) {
            return { r: match[1], g: match[2], b: match[3], a: match[4] };
        }
        if ((match = matchers.hsl.exec(color))) {
            return { h: match[1], s: match[2], l: match[3] };
        }
        if ((match = matchers.hsla.exec(color))) {
            return { h: match[1], s: match[2], l: match[3], a: match[4] };
        }
        if ((match = matchers.hsv.exec(color))) {
            return { h: match[1], s: match[2], v: match[3] };
        }
        if ((match = matchers.hsva.exec(color))) {
            return { h: match[1], s: match[2], v: match[3], a: match[4] };
        }
        if ((match = matchers.hex8.exec(color))) {
            return {
                a: convertHexToDecimal(match[1]),
                r: parseIntFromHex(match[2]),
                g: parseIntFromHex(match[3]),
                b: parseIntFromHex(match[4]),
                format: named ? "name" : "hex8"
            };
        }
        if ((match = matchers.hex6.exec(color))) {
            return {
                r: parseIntFromHex(match[1]),
                g: parseIntFromHex(match[2]),
                b: parseIntFromHex(match[3]),
                format: named ? "name" : "hex"
            };
        }
        if ((match = matchers.hex3.exec(color))) {
            return {
                r: parseIntFromHex(match[1] + '' + match[1]),
                g: parseIntFromHex(match[2] + '' + match[2]),
                b: parseIntFromHex(match[3] + '' + match[3]),
                format: named ? "name" : "hex"
            };
        }

        return false;
    }

    window.tinycolor = tinycolor;
    })();

    $(function () {
        if ($.fn.spectrum.load) {
            $.fn.spectrum.processNativeColorInputs();
        }
    });

});


/*! 
 * ================== auxin/js/solo/fonticonpicker/jquery.fonticonpicker.js =================== 
 **/ 

/**
 *  jQuery fontIconPicker - v2.0.0
 *
 *  An icon picker built on top of font icons and jQuery
 *
 *  http://codeb.it/fontIconPicker
 *
 *  Made by Alessandro Benoit & Swashata
 *  Under MIT License
 *
 * {@link https://github.com/micc83/fontIconPicker}
 */

;(function ($) {

	'use strict';

	// Create the defaults once
	var defaults = {
			theme             : 'fip-grey',              // The CSS theme to use with this fontIconPicker. You can set different themes on multiple elements on the same page
			source            : false,                   // Icons source (array|false|object)
			emptyIcon         : true,                    // Empty icon should be shown?
			emptyIconValue    : '',                      // The value of the empty icon, change if you select has something else, say "none"
			iconsPerPage      : 20,                      // Number of icons per page
			hasSearch         : true,                    // Is search enabled?
			searchSource      : false,                   // Give a manual search values. If using attributes then for proper search feature we also need to pass icon names under the same order of source
			useAttribute      : false,                   // Whether to use attribute selector for printing icons
			attributeName     : 'data-icon',             // HTML Attribute name
			convertToHex      : true,                    // Whether or not to convert to hexadecimal for attribute value. If true then please pass decimal integer value to the source (or as value="" attribute of the select field)
			allCategoryText   : 'From all categories',   // The text for the select all category option
			unCategorizedText : 'Uncategorized'          // The text for the select uncategorized option
		};

	// The actual plugin constructor
	function Plugin(element, options) {
		this.element = $(element);
		this.settings = $.extend({}, defaults, options);
		if (this.settings.emptyIcon) {
			this.settings.iconsPerPage--;
		}
		this.iconPicker = $('<div/>', {
			'class':    'icons-selector',
			style:      'position: relative',
			html:       '<div class="selector">' +
							'<span class="selected-icon">' +
								'<i class="fip-icon-block"></i>' +
							'</span>' +
							'<span class="selector-button">' +
								'<i class="fip-icon-down-dir"></i>' +
							'</span>' +
						 '</div>' +
						 '<div class="selector-popup" style="display: none;">' + ((this.settings.hasSearch) ?
							 '<div class="selector-search">' +
								 '<input type="text" name="" value="" placeholder="Search icon" class="icons-search-input"/>' +
								 '<i class="fip-icon-search"></i>' +
							 '</div>' : '') +
							 '<div class="selector-category">' +
								 '<select name="" class="icon-category-select" style="display: none">' +
								 '</select>' +
							 '</div>' +
							 '<div class="fip-icons-container"></div>' +
							 '<div class="selector-footer" style="display:none;">' +
								 '<span class="selector-pages">1/2</span>' +
								 '<span class="selector-arrows">' +
									 '<span class="selector-arrow-left" style="display:none;">' +
										 '<i class="fip-icon-left-dir"></i>' +
									 '</span>' +
									 '<span class="selector-arrow-right">' +
										 '<i class="fip-icon-right-dir"></i>' +
									 '</span>' +
								 '</span>' +
							 '</div>' +
						 '</div>'
		});
		this.iconContainer = this.iconPicker.find('.fip-icons-container');
		this.searchIcon = this.iconPicker.find('.selector-search i');
		this.iconsSearched = [];
		this.isSearch = false;
		this.totalPage = 1;
		this.currentPage = 1;
		this.currentIcon = false;
		this.iconsCount = 0;
		this.open = false;

		// Set the default values for the search related variables
		this.searchValues = [];
		this.availableCategoriesSearch = [];

		// The trigger event for change
		this.triggerEvent = null;

		// Backups
		this.backupSource = [];
		this.backupSearch = [];

		// Set the default values of the category related variables
		this.isCategorized = false; // Automatically detects if the icon listing is categorized
		this.selectCategory = this.iconPicker.find('.icon-category-select'); // The category SELECT input field
		this.selectedCategory = false; // false means all categories are selected
		this.availableCategories = []; // Available categories, it is a two dimensional array which holds categorized icons
		this.unCategorizedKey = null; // Key of the uncategorized category

		// Initialize plugin
		this.init();

	}

	Plugin.prototype = {
		/**
		 * Init
		 */
		init: function () {

			// Add the theme CSS to the iconPicker
			this.iconPicker.addClass(this.settings.theme);

			// To properly calculate iconPicker height and width
			// We will first append it to body (with left: -9999px so that it is not visible)
			this.iconPicker.css({
				left: -9999
			}).appendTo('body');
			var iconPickerHeight = this.iconPicker.outerHeight(),
			iconPickerWidth = this.iconPicker.outerWidth();

			// Now reset the iconPicker CSS
			this.iconPicker.css({
				left: ''
			});

			// Add the icon picker after the select
			this.element.before(this.iconPicker);


			// Hide source element
			// Instead of doing a display:none, we would rather
			// make the element invisible
			// and adjust the margin
			this.element.css({
				visibility: 'hidden',
				top: 0,
				position: 'relative',
				zIndex: '-1',
				left: '-' + iconPickerWidth + 'px',
				display: 'inline-block',
				height: iconPickerHeight + 'px',
				width: iconPickerWidth + 'px',
				// Reset all margin, border and padding
				padding: '0',
				margin: '0 -' + iconPickerWidth + 'px 0 0', // Left margin adjustment to account for dangling space
				border: '0 none',
				verticalAlign: 'top'
			});

			// Set the trigger event
			if ( ! this.element.is('select') ) {
				// Determine the event that is fired when user change the field value
				// Most modern browsers supports input event except IE 7, 8.
				// IE 9 supports input event but the event is still not fired if I press the backspace key.
				// Get IE version
				// https://gist.github.com/padolsey/527683/#comment-7595
				var ieVersion = (function() {
				    var v = 3, div = document.createElement('div'), a = div.all || [];
				    while (div.innerHTML = '<!--[if gt IE '+(++v)+']><br><![endif]-->', a[0]);
				    return v > 4 ? v : !v;
				}());
				var el = document.createElement('div');
				this.triggerEvent = (ieVersion === 9 || !('oninput' in el)) ? ['keyup'] : ['input', 'keyup']; // Let's keep the keyup event for scripts that listens to it
			}

			// If current element is SELECT populate settings.source
			if (!this.settings.source && this.element.is('select')) {
				// Reset the source and searchSource
				// These will be populated according to the available options
				this.settings.source = [];
				this.settings.searchSource = [];

				// Check if optgroup is present within the select
				// If it is present then the source has to be grouped
				if ( this.element.find('optgroup').length ) {
					// Set the categorized to true
					this.isCategorized = true;
					this.element.find('optgroup').each($.proxy(function(i, el) {
						// Get the key of the new category array
						var thisCategoryKey = this.availableCategories.length,
						// Create the new option for the selectCategory SELECT field
						categoryOption = $('<option />');

						// Set the value to this categorykey
						categoryOption.attr('value', thisCategoryKey);
						// Set the label
						categoryOption.html($(el).attr('label'));

						// Append to the DOM
						this.selectCategory.append(categoryOption);

						// Init the availableCategories array
						this.availableCategories[thisCategoryKey] = [];
						this.availableCategoriesSearch[thisCategoryKey] = [];

						// Now loop through it's option elements and add the icons
						$(el).find('option').each($.proxy(function(i, cel) {
							var newIconValue = $(cel).val(),
							newIconLabel = $(cel).html();

							// Check if the option element has value and this value does not equal to the empty value
							if (newIconValue && newIconValue !== this.settings.emptyIconValue) {
								// Push to the source, because at first all icons are selected
								this.settings.source.push(newIconValue);

								// Push to the availableCategories child array
								this.availableCategories[thisCategoryKey].push(newIconValue);

								// Push to the search values
								this.searchValues.push(newIconLabel);
								this.availableCategoriesSearch[thisCategoryKey].push(newIconLabel);
							}
						}, this));
					}, this));

					// Additionally check for any first label option child
					if ( this.element.find('> option').length ) {
						this.element.find('> option').each($.proxy(function(i, el) {
							var newIconValue = $(el).val(),
							newIconLabel = $(el).html();

							// Don't do anything if the new icon value is empty
							if ( !newIconValue || newIconValue === '' || newIconValue == this.settings.emptyIconValue ) {
								return true;
							}

							// Set the uncategorized key if not set already
							if ( this.unCategorizedKey === null ) {
								this.unCategorizedKey = this.availableCategories.length;
								this.availableCategories[this.unCategorizedKey] = [];
								this.availableCategoriesSearch[this.unCategorizedKey] = [];
								// Create an option and append to the category selector
								$('<option />').attr('value', this.unCategorizedKey).html(this.settings.unCategorizedText).appendTo(this.selectCategory);
							}

							// Push the icon to the category
							this.settings.source.push(newIconValue);
							this.availableCategories[this.unCategorizedKey].push(newIconValue);

							// Push the icon to the search
							this.searchValues.push(newIconLabel);
							this.availableCategoriesSearch[this.unCategorizedKey].push(newIconLabel);
						}, this));
					}
				// Not categorized
				} else {
					this.element.find('option').each($.proxy(function (i, el) {
						var newIconValue = $(el).val(),
						newIconLabel = $(el).html();
						if (newIconValue) {
							this.settings.source.push(newIconValue);
							this.searchValues.push(newIconLabel);
						}
					}, this));
				}

				// Clone and backup the original source and search
				this.backupSource = this.settings.source.slice(0);
				this.backupSearch = this.searchValues.slice(0);

				// load the categories
				this.loadCategories();
			// Normalize the given source
			} else {
				this.initSourceIndex();
				// No need to call loadCategories or take backups because these are called from the initSourceIndex
			}

			// Load icons
			this.loadIcons();

			/**
			 * Category changer
			 */
			this.selectCategory.on('change keyup', $.proxy(function(e) {
				// Don't do anything if not categorized
				if ( this.isCategorized === false ) {
					return false;
				}
				var targetSelect = $(e.currentTarget),
				currentCategory = targetSelect.val();
				// Check if all categories are selected
				if (targetSelect.val() === 'all') {
					// Restore from the backups
					// @note These backups must be rebuild on source change, otherwise it will lead to error
					this.settings.source = this.backupSource;
					this.searchValues = this.backupSearch;
				// No? So there is a specified category
				} else {
					var key = parseInt(currentCategory, 10);
					if (this.availableCategories[key]) {
						this.settings.source = this.availableCategories[key];
						this.searchValues = this.availableCategoriesSearch[key];
					}
				}
				this.resetSearch();
				this.loadIcons();
			}, this));

			/**
			 * On down arrow click
			 */
			this.iconPicker.find('.selector-button').click($.proxy(function () {

				// Open/Close the icon picker
				this.toggleIconSelector();

			}, this));

			/**
			 * Next page
			 */
			this.iconPicker.find('.selector-arrow-right').click($.proxy(function (e) {

				if (this.currentPage < this.totalPage) {
					this.iconPicker.find('.selector-arrow-left').show();
					this.currentPage = this.currentPage + 1;
					this.renderIconContainer();
				}

				if (this.currentPage === this.totalPage) {
					$(e.currentTarget).hide();
				}

			}, this));

			/**
			 * Prev page
			 */
			this.iconPicker.find('.selector-arrow-left').click($.proxy(function (e) {

				if (this.currentPage > 1) {
					this.iconPicker.find('.selector-arrow-right').show();
					this.currentPage = this.currentPage - 1;
					this.renderIconContainer();
				}

				if (this.currentPage === 1) {
					$(e.currentTarget).hide();
				}

			}, this));

			/**
			 * Realtime Icon Search
			 */
			this.iconPicker.find('.icons-search-input').keyup($.proxy(function (e) {

				// Get the search string
				var searchString = $(e.currentTarget).val();

				// If the string is not empty
				if (searchString === '') {
					this.resetSearch();
					return;
				}

				// Set icon search to X to reset search
				this.searchIcon.removeClass('fip-icon-search');
				this.searchIcon.addClass('fip-icon-cancel');

				// Set this as a search
				this.isSearch = true;

				// Reset current page
				this.currentPage = 1;

				// Actual search
				// This has been modified to search the searchValues instead
				// Then return the value from the source if match is found
				this.iconsSearched = [];
				$.grep(this.searchValues, $.proxy(function (n, i) {
					if (n.toLowerCase().search(searchString.toLowerCase()) >= 0) {
						this.iconsSearched[this.iconsSearched.length] = this.settings.source[i];
						return true;
					}
				}, this));

				// Render icon list
				this.renderIconContainer();
			}, this));

			/**
			 * Quit search
			 */
			this.iconPicker.find('.selector-search').on('click', '.fip-icon-cancel', $.proxy(function () {
				this.iconPicker.find('.icons-search-input').focus();
				this.resetSearch();
			}, this));

			/**
			 * On icon selected
			 */
			this.iconContainer.on('click', '.fip-box', $.proxy(function (e) {
				this.setSelectedIcon($(e.currentTarget).find('i').attr('data-fip-value'));
				this.toggleIconSelector();
			}, this));

			/**
			 * Stop click propagation on iconpicker
			 */
			this.iconPicker.click(function (event) {
				event.stopPropagation();
				return false;
			});

			/**
			 * On click out
			 */
			$('html').click($.proxy(function () {
				if (this.open) {
					this.toggleIconSelector();
				}
			}, this));

		},

		/**
		 * Init the source & search index from the current settings
		 * @return {void}
		 */
		initSourceIndex: function() {
			// First check for any sorts of errors
			if ( typeof(this.settings.source) !== 'object' ) {
				return;
			}

			// We are going to check if the passed source is an array or an object
			// If it is an array, then don't do anything
			// otherwise it has to be an object and therefore is it a categorized icon set
			if ($.isArray(this.settings.source)) {
				// This is not categorized since it is 1D array
				this.isCategorized = false;
				this.selectCategory.html('').hide();

				// We are going to convert the source items to string
				// This is necessary because passed source might not be "strings" for attribute related icons
				this.settings.source = $.map(this.settings.source, function(e, i) {
					if ( typeof(e.toString) == 'function' ) {
						return e.toString();
					} else {
						return e;
					}
				});

				// Now update the search
				// First check if the search is given by user
				if ( $.isArray(this.settings.searchSource) ) {
					// Convert everything inside the searchSource to string
					this.searchValues = $.map(this.settings.searchSource, function(e, i) {
						if ( typeof(e.toString) == 'function' ) {
							return e.toString();
						} else {
							return e;
						}
					}); // Clone the searchSource
				// Not given so use the source instead
				} else {
					this.searchValues = this.settings.source.slice(0); // Clone the source
				}
			// Categorized icon set
			} else {
				var originalSource = $.extend(true, {}, this.settings.source);

				// Reset the source
				this.settings.source = [];

				// Reset other variables
				this.searchValues = [];
				this.availableCategoriesSearch = [];
				this.selectedCategory = false;
				this.availableCategories = [];
				this.unCategorizedKey = null;

				// Set the categorized to true and reset the HTML
				this.isCategorized = true;
				this.selectCategory.html('');

				// Now loop through the source and add to the list
				for (var categoryLabel in originalSource) {
					// Get the key of the new category array
					var thisCategoryKey = this.availableCategories.length,
					// Create the new option for the selectCategory SELECT field
					categoryOption = $('<option />');

					// Set the value to this categorykey
					categoryOption.attr('value', thisCategoryKey);
					// Set the label
					categoryOption.html(categoryLabel);

					// Append to the DOM
					this.selectCategory.append(categoryOption);

					// Init the availableCategories array
					this.availableCategories[thisCategoryKey] = [];
					this.availableCategoriesSearch[thisCategoryKey] = [];

					// Now loop through it's icons and add to the list
					for ( var newIconKey in originalSource[categoryLabel] ) {
						// Get the new icon value
						var newIconValue = originalSource[categoryLabel][newIconKey];
						// Get the label either from the searchSource if set, otherwise from the source itself
						var newIconLabel = (this.settings.searchSource && this.settings.searchSource[categoryLabel] && this.settings.searchSource[categoryLabel][newIconKey]) ?
											this.settings.searchSource[categoryLabel][newIconKey] : newIconValue;

						// Try to convert to the source value string
						// This is to avoid attribute related icon sets
						// Where hexadecimal or decimal numbers might be passed
						if ( typeof(newIconValue.toString) == 'function' ) {
							newIconValue = newIconValue.toString();
						}
						// Check if the option element has value and this value does not equal to the empty value
						if (newIconValue && newIconValue !== this.settings.emptyIconValue) {
							// Push to the source, because at first all icons are selected
							this.settings.source.push(newIconValue);

							// Push to the availableCategories child array
							this.availableCategories[thisCategoryKey].push(newIconValue);

							// Push to the search values
							this.searchValues.push(newIconLabel);
							this.availableCategoriesSearch[thisCategoryKey].push(newIconLabel);
						}
					}
				}
			}

			// Clone and backup the original source and search
			this.backupSource = this.settings.source.slice(0);
			this.backupSearch = this.searchValues.slice(0);

			// Call the loadCategories
			this.loadCategories();
		},

		/**
		 * Load Categories
		 * @return {void}
		 */
		loadCategories: function() {
			// Dont do anything if it is not categorized
			if ( this.isCategorized === false ) {
				return;
			}

			// Now append all to the category selector
			$('<option value="all">' + this.settings.allCategoryText + '</option>').prependTo(this.selectCategory);

			// Show it and set default value to all categories
			this.selectCategory.show().val('all').trigger('change');
		},

		/**
		 * Load icons
		 */
		loadIcons: function () {

			// Set the content of the popup as loading
			this.iconContainer.html('<i class="fip-icon-spin3 animate-spin loading"></i>');

			// If source is set
			if (this.settings.source instanceof Array) {

				// Render icons
				this.renderIconContainer();

			}

		},

		/**
		 * Render icons inside the popup
		 */
		renderIconContainer: function () {

			var offset, iconsPaged = [];

			// Set a temporary array for icons
			if (this.isSearch) {
				iconsPaged = this.iconsSearched;
			} else {
				iconsPaged = this.settings.source;
			}

			// Count elements
			this.iconsCount = iconsPaged.length;

			// Calculate total page number
			this.totalPage = Math.ceil(this.iconsCount / this.settings.iconsPerPage);

			// Hide footer if no pagination is needed
			if (this.totalPage > 1) {
				this.iconPicker.find('.selector-footer').show();
			} else {
				this.iconPicker.find('.selector-footer').hide();
			}

			// Set the text for page number index and total icons
			this.iconPicker.find('.selector-pages').html(this.currentPage + '/' + this.totalPage + ' <em>(' + this.iconsCount + ')</em>');

			// Set the offset for slice
			offset = (this.currentPage - 1) * this.settings.iconsPerPage;

			// Should empty icon be shown?
			if (this.settings.emptyIcon) {
				// Reset icon container HTML and prepend empty icon
				this.iconContainer.html('<span class="fip-box"><i class="fip-icon-block" data-fip-value="fip-icon-block"></i></span>');

			// If not show an error when no icons are found
			} else if (iconsPaged.length < 1) {
				this.iconContainer.html('<span class="icons-picker-error"><i class="fip-icon-block" data-fip-value="fip-icon-block"></i></span>');
				return;

			// else empty the container
			} else {
				this.iconContainer.html('');
			}

			// Set an array of current page icons
			iconsPaged = iconsPaged.slice(offset, offset + this.settings.iconsPerPage);

			// List icons
			for (var i = 0, item; item = iconsPaged[i++];) {
				// Set the icon title
				var flipBoxTitle = item;
				$.grep(this.settings.source, $.proxy(function(e, i) {
					if ( e === item ) {
						flipBoxTitle =  this.searchValues[i];
						return true;
					}
					return false;
				}, this));

				// Set the icon box
				$('<span/>', {
					html:      '<i data-fip-value="' + item + '" ' + (this.settings.useAttribute ? (this.settings.attributeName + '="' + ( this.settings.convertToHex ? '&#x' + parseInt(item, 10).toString(16) + ';' : item ) + '"') : 'class="' + item + '"') + '></i>',
					'class':   'fip-box',
					title: flipBoxTitle
				}).appendTo(this.iconContainer);
			}

			// If no empty icon is allowed and no current value is set or current value is not inside the icon set
			if (!this.settings.emptyIcon && (!this.element.val() || $.inArray(this.element.val(), this.settings.source) === -1)) {

				// Get the first icon
				this.setSelectedIcon(iconsPaged[0]);

			} else if ($.inArray(this.element.val(), this.settings.source) === -1) {

				// Set empty
				this.setSelectedIcon();

			} else {

				// Set the default selected icon even if not set
				this.setSelectedIcon(this.element.val());
			}

		},

		/**
		 * Set Highlighted icon
		 */
		setHighlightedIcon: function () {
			this.iconContainer.find('.current-icon').removeClass('current-icon');
			if (this.currentIcon) {
				this.iconContainer.find('[data-fip-value="' + this.currentIcon + '"]').parent('span').addClass('current-icon');
			}
		},

		/**
		 * Set selected icon
		 *
		 * @param {string} theIcon
		 */
		setSelectedIcon: function (theIcon) {
			if (theIcon === 'fip-icon-block') {
				theIcon = '';
			}

			// Check if attribute is to be used
			if ( this.settings.useAttribute ) {
				if ( theIcon ) {
					this.iconPicker.find('.selected-icon').html('<i ' + this.settings.attributeName + '="' + ( this.settings.convertToHex ? '&#x' + parseInt(theIcon, 10).toString(16) + ';' : theIcon ) + '"></i>' );
				} else {
					this.iconPicker.find('.selected-icon').html('<i class="fip-icon-block"></i>');
				}
			// Use class
			} else {
				this.iconPicker.find('.selected-icon').html('<i class="' + (theIcon || 'fip-icon-block') + '"></i>');
			}
			// Set the value of the element and trigger change event
			this.element.val((theIcon === '' ? this.settings.emptyIconValue : theIcon )).trigger('change');
			if ( this.triggerEvent !== null ) {
				// Trigger other events
				for ( var eventKey in this.triggerEvent ) {
					this.element.trigger(this.triggerEvent[eventKey]);
				}
			}
			this.currentIcon = theIcon;
			this.setHighlightedIcon();
		},

		/**
		 * Open/close popup (toggle)
		 */
		toggleIconSelector: function () {
			this.open = (!this.open) ? 1 : 0;
			this.iconPicker.find('.selector-popup').slideToggle(300);
			this.iconPicker.find('.selector-button i').toggleClass('fip-icon-down-dir');
			this.iconPicker.find('.selector-button i').toggleClass('fip-icon-up-dir');
			if (this.open) {
				this.iconPicker.find('.icons-search-input').focus().select();
			}
		},

		/**
		 * Reset search
		 */
		resetSearch: function () {

			// Empty input
			this.iconPicker.find('.icons-search-input').val('');

			// Reset search icon class
			this.searchIcon.removeClass('fip-icon-cancel');
			this.searchIcon.addClass('fip-icon-search');

			// Go back to page 1 and remove back arrow
			this.iconPicker.find('.selector-arrow-left').hide();
			this.currentPage = 1;
			this.isSearch = false;

			// Rerender icons
			this.renderIconContainer();

			// Restore pagination if needed
			if (this.totalPage > 1) {
				this.iconPicker.find('.selector-arrow-right').show();
			}
		}
	};

	// Lightweight plugin wrapper
	$.fn.fontIconPicker = function (options) {

		// Instantiate the plugin
		this.each(function () {
			if (!$.data(this, "fontIconPicker")) {
				$.data(this, "fontIconPicker", new Plugin(this, options));
			}
		});

		// setIcons method
		this.setIcons = $.proxy(function (newIcons, iconSearch) {
			if ( undefined === newIcons ) {
				newIcons = false;
			}
			if ( undefined === iconSearch ) {
				iconSearch = false;
			}
			this.each(function () {
				$.data(this, "fontIconPicker").settings.source = newIcons;
				$.data(this, "fontIconPicker").settings.searchSource = iconSearch;
				$.data(this, "fontIconPicker").initSourceIndex();
				$.data(this, "fontIconPicker").resetSearch();
				$.data(this, "fontIconPicker").loadIcons();
			});
		}, this);

		// destroy method
		this.destroyPicker = $.proxy(function() {
			this.each(function() {
				if (!$.data(this, "fontIconPicker")) {
					return;
				}
				// Remove the iconPicker
				$.data(this, "fontIconPicker").iconPicker.remove();
				// Reset the CSS
				$.data(this, "fontIconPicker").element.css({
					visibility: '',
					top: '',
					position: '',
					zIndex: '',
					left: '',
					display: '',
					height: '',
					width: '',
					padding: '',
					margin: '',
					border: '',
					verticalAlign: ''
				});

				// destroy data
				$.removeData(this, "fontIconPicker");
			});
		}, this);

		// reInit method
		this.refreshPicker = $.proxy(function(newOptions) {
			if ( ! newOptions ) {
				newOptions = options;
			}
			// First destroy
			this.destroyPicker();

			// Now reset
			this.each(function() {
				if (!$.data(this, "fontIconPicker")) {
					$.data(this, "fontIconPicker", new Plugin(this, newOptions));
				}
			});
		}, this);

		return this;
	};

})(jQuery);


/*! 
 * ================== js/libs/plugins/jquery.avt.isotope.js =================== 
 **/ 

/*!
 * Isotope PACKAGED v3.0.6
 *
 * Licensed GPLv3 for open source use
 * or Isotope Commercial License for commercial use
 *
 * https://isotope.metafizzy.co
 * Copyright 2010-2018 Metafizzy
 */

/**
 * Bridget makes jQuery widgets
 * v2.0.1
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /* globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'jquery-bridget/jquery-bridget',[ 'jquery' ], function( jQuery ) {
      return factory( window, jQuery );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('jquery')
    );
  } else {
    // browser global
    window.jQueryBridget = factory(
      window,
      window.jQuery
    );
  }

}( window, function factory( window, jQuery ) {
'use strict';

// ----- utils ----- //

var arraySlice = Array.prototype.slice;

// helper function for logging errors
// $.error breaks jQuery chaining
var console = window.console;
var logError = typeof console == 'undefined' ? function() {} :
  function( message ) {
    console.error( message );
  };

// ----- jQueryBridget ----- //

function jQueryBridget( namespace, PluginClass, $ ) {
  $ = $ || jQuery || window.jQuery;
  if ( !$ ) {
    return;
  }

  // add option method -> $().plugin('option', {...})
  if ( !PluginClass.prototype.option ) {
    // option setter
    PluginClass.prototype.option = function( opts ) {
      // bail out if not an object
      if ( !$.isPlainObject( opts ) ){
        return;
      }
      this.options = $.extend( true, this.options, opts );
    };
  }

  // make jQuery plugin
  $.fn[ namespace ] = function( arg0 /*, arg1 */ ) {
    if ( typeof arg0 == 'string' ) {
      // method call $().plugin( 'methodName', { options } )
      // shift arguments by 1
      var args = arraySlice.call( arguments, 1 );
      return methodCall( this, arg0, args );
    }
    // just $().plugin({ options })
    plainCall( this, arg0 );
    return this;
  };

  // $().plugin('methodName')
  function methodCall( $elems, methodName, args ) {
    var returnValue;
    var pluginMethodStr = '$().' + namespace + '("' + methodName + '")';

    $elems.each( function( i, elem ) {
      // get instance
      var instance = $.data( elem, namespace );
      if ( !instance ) {
        logError( namespace + ' not initialized. Cannot call methods, i.e. ' +
          pluginMethodStr );
        return;
      }

      var method = instance[ methodName ];
      if ( !method || methodName.charAt(0) == '_' ) {
        logError( pluginMethodStr + ' is not a valid method' );
        return;
      }

      // apply method, get return value
      var value = method.apply( instance, args );
      // set return value if value is returned, use only first value
      returnValue = returnValue === undefined ? value : returnValue;
    });

    return returnValue !== undefined ? returnValue : $elems;
  }

  function plainCall( $elems, options ) {
    $elems.each( function( i, elem ) {
      var instance = $.data( elem, namespace );
      if ( instance ) {
        // set options & init
        instance.option( options );
        instance._init();
      } else {
        // initialize new instance
        instance = new PluginClass( elem, options );
        $.data( elem, namespace, instance );
      }
    });
  }

  updateJQuery( $ );

}

// ----- updateJQuery ----- //

// set $.bridget for v1 backwards compatibility
function updateJQuery( $ ) {
  if ( !$ || ( $ && $.bridget ) ) {
    return;
  }
  $.bridget = jQueryBridget;
}

updateJQuery( jQuery || window.jQuery );

// -----  ----- //

return jQueryBridget;

}));

/**
 * EvEmitter v1.1.0
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */

( function( global, factory ) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module, window */
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'ev-emitter/ev-emitter',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.EvEmitter = factory();
  }

}( typeof window != 'undefined' ? window : this, function() {



function EvEmitter() {}

var proto = EvEmitter.prototype;

proto.on = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // set events hash
  var events = this._events = this._events || {};
  // set listeners array
  var listeners = events[ eventName ] = events[ eventName ] || [];
  // only add once
  if ( listeners.indexOf( listener ) == -1 ) {
    listeners.push( listener );
  }

  return this;
};

proto.once = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // add event
  this.on( eventName, listener );
  // set once flag
  // set onceEvents hash
  var onceEvents = this._onceEvents = this._onceEvents || {};
  // set onceListeners object
  var onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
  // set flag
  onceListeners[ listener ] = true;

  return this;
};

proto.off = function( eventName, listener ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  var index = listeners.indexOf( listener );
  if ( index != -1 ) {
    listeners.splice( index, 1 );
  }

  return this;
};

proto.emitEvent = function( eventName, args ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  // copy over to avoid interference if .off() in listener
  listeners = listeners.slice(0);
  args = args || [];
  // once stuff
  var onceListeners = this._onceEvents && this._onceEvents[ eventName ];

  for ( var i=0; i < listeners.length; i++ ) {
    var listener = listeners[i]
    var isOnce = onceListeners && onceListeners[ listener ];
    if ( isOnce ) {
      // remove listener
      // remove before trigger to prevent recursion
      this.off( eventName, listener );
      // unset once flag
      delete onceListeners[ listener ];
    }
    // trigger listener
    listener.apply( this, args );
  }

  return this;
};

proto.allOff = function() {
  delete this._events;
  delete this._onceEvents;
};

return EvEmitter;

}));

/*!
 * getSize v2.0.3
 * measure size of elements
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */
/* globals console: false */

( function( window, factory ) {
  /* jshint strict: false */ /* globals define, module */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'get-size/get-size',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.getSize = factory();
  }

})( window, function factory() {
'use strict';

// -------------------------- helpers -------------------------- //

// get a number from a string, not a percentage
function getStyleSize( value ) {
  var num = parseFloat( value );
  // not a percent like '100%', and a number
  var isValid = value.indexOf('%') == -1 && !isNaN( num );
  return isValid && num;
}

function noop() {}

var logError = typeof console == 'undefined' ? noop :
  function( message ) {
    console.error( message );
  };

// -------------------------- measurements -------------------------- //

var measurements = [
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'borderBottomWidth'
];

var measurementsLength = measurements.length;

function getZeroSize() {
  var size = {
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0
  };
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    size[ measurement ] = 0;
  }
  return size;
}

// -------------------------- getStyle -------------------------- //

/**
 * getStyle, get style of element, check for Firefox bug
 * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
function getStyle( elem ) {
  var style = getComputedStyle( elem );
  if ( !style ) {
    logError( 'Style returned ' + style +
      '. Are you running this code in a hidden iframe on Firefox? ' +
      'See https://bit.ly/getsizebug1' );
  }
  return style;
}

// -------------------------- setup -------------------------- //

var isSetup = false;

var isBoxSizeOuter;

/**
 * setup
 * check isBoxSizerOuter
 * do on first getSize() rather than on page load for Firefox bug
 */
function setup() {
  // setup once
  if ( isSetup ) {
    return;
  }
  isSetup = true;

  // -------------------------- box sizing -------------------------- //

  /**
   * Chrome & Safari measure the outer-width on style.width on border-box elems
   * IE11 & Firefox<29 measures the inner-width
   */
  var div = document.createElement('div');
  div.style.width = '200px';
  div.style.padding = '1px 2px 3px 4px';
  div.style.borderStyle = 'solid';
  div.style.borderWidth = '1px 2px 3px 4px';
  div.style.boxSizing = 'border-box';

  var body = document.body || document.documentElement;
  body.appendChild( div );
  var style = getStyle( div );
  // round value for browser zoom. desandro/masonry#928
  isBoxSizeOuter = Math.round( getStyleSize( style.width ) ) == 200;
  getSize.isBoxSizeOuter = isBoxSizeOuter;

  body.removeChild( div );
}

// -------------------------- getSize -------------------------- //

function getSize( elem ) {
  setup();

  // use querySeletor if elem is string
  if ( typeof elem == 'string' ) {
    elem = document.querySelector( elem );
  }

  // do not proceed on non-objects
  if ( !elem || typeof elem != 'object' || !elem.nodeType ) {
    return;
  }

  var style = getStyle( elem );

  // if hidden, everything is 0
  if ( style.display == 'none' ) {
    return getZeroSize();
  }

  var size = {};
  size.width = elem.offsetWidth;
  size.height = elem.offsetHeight;

  var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box';

  // get all measurements
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    var value = style[ measurement ];
    var num = parseFloat( value );
    // any 'auto', 'medium' value will be 0
    size[ measurement ] = !isNaN( num ) ? num : 0;
  }

  var paddingWidth = size.paddingLeft + size.paddingRight;
  var paddingHeight = size.paddingTop + size.paddingBottom;
  var marginWidth = size.marginLeft + size.marginRight;
  var marginHeight = size.marginTop + size.marginBottom;
  var borderWidth = size.borderLeftWidth + size.borderRightWidth;
  var borderHeight = size.borderTopWidth + size.borderBottomWidth;

  var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

  // overwrite width and height if we can get it from style
  var styleWidth = getStyleSize( style.width );
  if ( styleWidth !== false ) {
    size.width = styleWidth +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
  }

  var styleHeight = getStyleSize( style.height );
  if ( styleHeight !== false ) {
    size.height = styleHeight +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
  }

  size.innerWidth = size.width - ( paddingWidth + borderWidth );
  size.innerHeight = size.height - ( paddingHeight + borderHeight );

  size.outerWidth = size.width + marginWidth;
  size.outerHeight = size.height + marginHeight;

  return size;
}

return getSize;

});

/**
 * matchesSelector v2.0.2
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  /*global define: false, module: false */
  'use strict';
  // universal module definition
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'desandro-matches-selector/matches-selector',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.matchesSelector = factory();
  }

}( window, function factory() {
  'use strict';

  var matchesMethod = ( function() {
    var ElemProto = window.Element.prototype;
    // check for the standard method name first
    if ( ElemProto.matches ) {
      return 'matches';
    }
    // check un-prefixed
    if ( ElemProto.matchesSelector ) {
      return 'matchesSelector';
    }
    // check vendor prefixes
    var prefixes = [ 'webkit', 'moz', 'ms', 'o' ];

    for ( var i=0; i < prefixes.length; i++ ) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';
      if ( ElemProto[ method ] ) {
        return method;
      }
    }
  })();

  return function matchesSelector( elem, selector ) {
    return elem[ matchesMethod ]( selector );
  };

}));

/**
 * Fizzy UI utils v2.0.7
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /*globals define, module, require */

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'fizzy-ui-utils/utils',[
      'desandro-matches-selector/matches-selector'
    ], function( matchesSelector ) {
      return factory( window, matchesSelector );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('desandro-matches-selector')
    );
  } else {
    // browser global
    window.fizzyUIUtils = factory(
      window,
      window.matchesSelector
    );
  }

}( window, function factory( window, matchesSelector ) {



var utils = {};

// ----- extend ----- //

// extends objects
utils.extend = function( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
};

// ----- modulo ----- //

utils.modulo = function( num, div ) {
  return ( ( num % div ) + div ) % div;
};

// ----- makeArray ----- //

var arraySlice = Array.prototype.slice;

// turn element or nodeList into an array
utils.makeArray = function( obj ) {
  if ( Array.isArray( obj ) ) {
    // use object if already an array
    return obj;
  }
  // return empty array if undefined or null. #6
  if ( obj === null || obj === undefined ) {
    return [];
  }

  var isArrayLike = typeof obj == 'object' && typeof obj.length == 'number';
  if ( isArrayLike ) {
    // convert nodeList to array
    return arraySlice.call( obj );
  }

  // array of single index
  return [ obj ];
};

// ----- removeFrom ----- //

utils.removeFrom = function( ary, obj ) {
  var index = ary.indexOf( obj );
  if ( index != -1 ) {
    ary.splice( index, 1 );
  }
};

// ----- getParent ----- //

utils.getParent = function( elem, selector ) {
  while ( elem.parentNode && elem != document.body ) {
    elem = elem.parentNode;
    if ( matchesSelector( elem, selector ) ) {
      return elem;
    }
  }
};

// ----- getQueryElement ----- //

// use element as selector string
utils.getQueryElement = function( elem ) {
  if ( typeof elem == 'string' ) {
    return document.querySelector( elem );
  }
  return elem;
};

// ----- handleEvent ----- //

// enable .ontype to trigger from .addEventListener( elem, 'type' )
utils.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

// ----- filterFindElements ----- //

utils.filterFindElements = function( elems, selector ) {
  // make array of elems
  elems = utils.makeArray( elems );
  var ffElems = [];

  elems.forEach( function( elem ) {
    // check that elem is an actual element
    if ( !( elem instanceof HTMLElement ) ) {
      return;
    }
    // add elem if no selector
    if ( !selector ) {
      ffElems.push( elem );
      return;
    }
    // filter & find items if we have a selector
    // filter
    if ( matchesSelector( elem, selector ) ) {
      ffElems.push( elem );
    }
    // find children
    var childElems = elem.querySelectorAll( selector );
    // concat childElems to filterFound array
    for ( var i=0; i < childElems.length; i++ ) {
      ffElems.push( childElems[i] );
    }
  });

  return ffElems;
};

// ----- debounceMethod ----- //

utils.debounceMethod = function( _class, methodName, threshold ) {
  threshold = threshold || 100;
  // original method
  var method = _class.prototype[ methodName ];
  var timeoutName = methodName + 'Timeout';

  _class.prototype[ methodName ] = function() {
    var timeout = this[ timeoutName ];
    clearTimeout( timeout );

    var args = arguments;
    var _this = this;
    this[ timeoutName ] = setTimeout( function() {
      method.apply( _this, args );
      delete _this[ timeoutName ];
    }, threshold );
  };
};

// ----- docReady ----- //

utils.docReady = function( callback ) {
  var readyState = document.readyState;
  if ( readyState == 'complete' || readyState == 'interactive' ) {
    // do async to allow for other scripts to run. metafizzy/flickity#441
    setTimeout( callback );
  } else {
    document.addEventListener( 'DOMContentLoaded', callback );
  }
};

// ----- htmlInit ----- //

// http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
utils.toDashed = function( str ) {
  return str.replace( /(.)([A-Z])/g, function( match, $1, $2 ) {
    return $1 + '-' + $2;
  }).toLowerCase();
};

var console = window.console;
/**
 * allow user to initialize classes via [data-namespace] or .js-namespace class
 * htmlInit( Widget, 'widgetName' )
 * options are parsed from data-namespace-options
 */
utils.htmlInit = function( WidgetClass, namespace ) {
  utils.docReady( function() {
    var dashedNamespace = utils.toDashed( namespace );
    var dataAttr = 'data-' + dashedNamespace;
    var dataAttrElems = document.querySelectorAll( '[' + dataAttr + ']' );
    var jsDashElems = document.querySelectorAll( '.js-' + dashedNamespace );
    var elems = utils.makeArray( dataAttrElems )
      .concat( utils.makeArray( jsDashElems ) );
    var dataOptionsAttr = dataAttr + '-options';
    var jQuery = window.jQuery;

    elems.forEach( function( elem ) {
      var attr = elem.getAttribute( dataAttr ) ||
        elem.getAttribute( dataOptionsAttr );
      var options;
      try {
        options = attr && JSON.parse( attr );
      } catch ( error ) {
        // log error, do not initialize
        if ( console ) {
          console.error( 'Error parsing ' + dataAttr + ' on ' + elem.className +
          ': ' + error );
        }
        return;
      }
      // initialize
      var instance = new WidgetClass( elem, options );
      // make available via $().data('namespace')
      if ( jQuery ) {
        jQuery.data( elem, namespace, instance );
      }
    });

  });
};

// -----  ----- //

return utils;

}));

/**
 * Outlayer Item
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'outlayer/item',[
        'ev-emitter/ev-emitter',
        'get-size/get-size'
      ],
      factory
    );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory(
      require('ev-emitter'),
      require('get-size')
    );
  } else {
    // browser global
    window.Outlayer = {};
    window.Outlayer.Item = factory(
      window.EvEmitter,
      window.getSize
    );
  }

}( window, function factory( EvEmitter, getSize ) {
'use strict';

// ----- helpers ----- //

function isEmptyObj( obj ) {
  for ( var prop in obj ) {
    return false;
  }
  prop = null;
  return true;
}

// -------------------------- CSS3 support -------------------------- //


var docElemStyle = document.documentElement.style;

var transitionProperty = typeof docElemStyle.transition == 'string' ?
  'transition' : 'WebkitTransition';
var transformProperty = typeof docElemStyle.transform == 'string' ?
  'transform' : 'WebkitTransform';

var transitionEndEvent = {
  WebkitTransition: 'webkitTransitionEnd',
  transition: 'transitionend'
}[ transitionProperty ];

// cache all vendor properties that could have vendor prefix
var vendorProperties = {
  transform: transformProperty,
  transition: transitionProperty,
  transitionDuration: transitionProperty + 'Duration',
  transitionProperty: transitionProperty + 'Property',
  transitionDelay: transitionProperty + 'Delay'
};

// -------------------------- Item -------------------------- //

function Item( element, layout ) {
  if ( !element ) {
    return;
  }

  this.element = element;
  // parent layout class, i.e. Masonry, Isotope, or Packery
  this.layout = layout;
  this.position = {
    x: 0,
    y: 0
  };

  this._create();
}

// inherit EvEmitter
var proto = Item.prototype = Object.create( EvEmitter.prototype );
proto.constructor = Item;

proto._create = function() {
  // transition objects
  this._transn = {
    ingProperties: {},
    clean: {},
    onEnd: {}
  };

  this.css({
    position: 'absolute'
  });
};

// trigger specified handler for event type
proto.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

proto.getSize = function() {
  this.size = getSize( this.element );
};

/**
 * apply CSS styles to element
 * @param {Object} style
 */
proto.css = function( style ) {
  var elemStyle = this.element.style;

  for ( var prop in style ) {
    // use vendor property if available
    var supportedProp = vendorProperties[ prop ] || prop;
    elemStyle[ supportedProp ] = style[ prop ];
  }
};

 // measure position, and sets it
proto.getPosition = function() {
  var style = getComputedStyle( this.element );
  var isOriginLeft = this.layout._getOption('originLeft');
  var isOriginTop = this.layout._getOption('originTop');
  var xValue = style[ isOriginLeft ? 'left' : 'right' ];
  var yValue = style[ isOriginTop ? 'top' : 'bottom' ];
  var x = parseFloat( xValue );
  var y = parseFloat( yValue );
  // convert percent to pixels
  var layoutSize = this.layout.size;
  if ( xValue.indexOf('%') != -1 ) {
    x = ( x / 100 ) * layoutSize.width;
  }
  if ( yValue.indexOf('%') != -1 ) {
    y = ( y / 100 ) * layoutSize.height;
  }
  // clean up 'auto' or other non-integer values
  x = isNaN( x ) ? 0 : x;
  y = isNaN( y ) ? 0 : y;
  // remove padding from measurement
  x -= isOriginLeft ? layoutSize.paddingLeft : layoutSize.paddingRight;
  y -= isOriginTop ? layoutSize.paddingTop : layoutSize.paddingBottom;

  this.position.x = x;
  this.position.y = y;
};

// set settled position, apply padding
proto.layoutPosition = function() {
  var layoutSize = this.layout.size;
  var style = {};
  var isOriginLeft = this.layout._getOption('originLeft');
  var isOriginTop = this.layout._getOption('originTop');

  // x
  var xPadding = isOriginLeft ? 'paddingLeft' : 'paddingRight';
  var xProperty = isOriginLeft ? 'left' : 'right';
  var xResetProperty = isOriginLeft ? 'right' : 'left';

  var x = this.position.x + layoutSize[ xPadding ];
  // set in percentage or pixels
  style[ xProperty ] = this.getXValue( x );
  // reset other property
  style[ xResetProperty ] = '';

  // y
  var yPadding = isOriginTop ? 'paddingTop' : 'paddingBottom';
  var yProperty = isOriginTop ? 'top' : 'bottom';
  var yResetProperty = isOriginTop ? 'bottom' : 'top';

  var y = this.position.y + layoutSize[ yPadding ];
  // set in percentage or pixels
  style[ yProperty ] = this.getYValue( y );
  // reset other property
  style[ yResetProperty ] = '';

  this.css( style );
  this.emitEvent( 'layout', [ this ] );
};

proto.getXValue = function( x ) {
  var isHorizontal = this.layout._getOption('horizontal');
  return this.layout.options.percentPosition && !isHorizontal ?
    ( ( x / this.layout.size.width ) * 100 ) + '%' : x + 'px';
};

proto.getYValue = function( y ) {
  var isHorizontal = this.layout._getOption('horizontal');
  return this.layout.options.percentPosition && isHorizontal ?
    ( ( y / this.layout.size.height ) * 100 ) + '%' : y + 'px';
};

proto._transitionTo = function( x, y ) {
  this.getPosition();
  // get current x & y from top/left
  var curX = this.position.x;
  var curY = this.position.y;

  var didNotMove = x == this.position.x && y == this.position.y;

  // save end position
  this.setPosition( x, y );

  // if did not move and not transitioning, just go to layout
  if ( didNotMove && !this.isTransitioning ) {
    this.layoutPosition();
    return;
  }

  var transX = x - curX;
  var transY = y - curY;
  var transitionStyle = {};
  transitionStyle.transform = this.getTranslate( transX, transY );

  this.transition({
    to: transitionStyle,
    onTransitionEnd: {
      transform: this.layoutPosition
    },
    isCleaning: true
  });
};

proto.getTranslate = function( x, y ) {
  // flip cooridinates if origin on right or bottom
  var isOriginLeft = this.layout._getOption('originLeft');
  var isOriginTop = this.layout._getOption('originTop');
  x = isOriginLeft ? x : -x;
  y = isOriginTop ? y : -y;
  return 'translate3d(' + x + 'px, ' + y + 'px, 0)';
};

// non transition + transform support
proto.goTo = function( x, y ) {
  this.setPosition( x, y );
  this.layoutPosition();
};

proto.moveTo = proto._transitionTo;

proto.setPosition = function( x, y ) {
  this.position.x = parseFloat( x );
  this.position.y = parseFloat( y );
};

// ----- transition ----- //

/**
 * @param {Object} style - CSS
 * @param {Function} onTransitionEnd
 */

// non transition, just trigger callback
proto._nonTransition = function( args ) {
  this.css( args.to );
  if ( args.isCleaning ) {
    this._removeStyles( args.to );
  }
  for ( var prop in args.onTransitionEnd ) {
    args.onTransitionEnd[ prop ].call( this );
  }
};

/**
 * proper transition
 * @param {Object} args - arguments
 *   @param {Object} to - style to transition to
 *   @param {Object} from - style to start transition from
 *   @param {Boolean} isCleaning - removes transition styles after transition
 *   @param {Function} onTransitionEnd - callback
 */
proto.transition = function( args ) {
  // redirect to nonTransition if no transition duration
  if ( !parseFloat( this.layout.options.transitionDuration ) ) {
    this._nonTransition( args );
    return;
  }

  var _transition = this._transn;
  // keep track of onTransitionEnd callback by css property
  for ( var prop in args.onTransitionEnd ) {
    _transition.onEnd[ prop ] = args.onTransitionEnd[ prop ];
  }
  // keep track of properties that are transitioning
  for ( prop in args.to ) {
    _transition.ingProperties[ prop ] = true;
    // keep track of properties to clean up when transition is done
    if ( args.isCleaning ) {
      _transition.clean[ prop ] = true;
    }
  }

  // set from styles
  if ( args.from ) {
    this.css( args.from );
    // force redraw. http://blog.alexmaccaw.com/css-transitions
    var h = this.element.offsetHeight;
    // hack for JSHint to hush about unused var
    h = null;
  }
  // enable transition
  this.enableTransition( args.to );
  // set styles that are transitioning
  this.css( args.to );

  this.isTransitioning = true;

};

// dash before all cap letters, including first for
// WebkitTransform => -webkit-transform
function toDashedAll( str ) {
  return str.replace( /([A-Z])/g, function( $1 ) {
    return '-' + $1.toLowerCase();
  });
}

var transitionProps = 'opacity,' + toDashedAll( transformProperty );

proto.enableTransition = function(/* style */) {
  // HACK changing transitionProperty during a transition
  // will cause transition to jump
  if ( this.isTransitioning ) {
    return;
  }

  // make `transition: foo, bar, baz` from style object
  // HACK un-comment this when enableTransition can work
  // while a transition is happening
  // var transitionValues = [];
  // for ( var prop in style ) {
  //   // dash-ify camelCased properties like WebkitTransition
  //   prop = vendorProperties[ prop ] || prop;
  //   transitionValues.push( toDashedAll( prop ) );
  // }
  // munge number to millisecond, to match stagger
  var duration = this.layout.options.transitionDuration;
  duration = typeof duration == 'number' ? duration + 'ms' : duration;
  // enable transition styles
  this.css({
    transitionProperty: transitionProps,
    transitionDuration: duration,
    transitionDelay: this.staggerDelay || 0
  });
  // listen for transition end event
  this.element.addEventListener( transitionEndEvent, this, false );
};

// ----- events ----- //

proto.onwebkitTransitionEnd = function( event ) {
  this.ontransitionend( event );
};

proto.onotransitionend = function( event ) {
  this.ontransitionend( event );
};

// properties that I munge to make my life easier
var dashedVendorProperties = {
  '-webkit-transform': 'transform'
};

proto.ontransitionend = function( event ) {
  // disregard bubbled events from children
  if ( event.target !== this.element ) {
    return;
  }
  var _transition = this._transn;
  // get property name of transitioned property, convert to prefix-free
  var propertyName = dashedVendorProperties[ event.propertyName ] || event.propertyName;

  // remove property that has completed transitioning
  delete _transition.ingProperties[ propertyName ];
  // check if any properties are still transitioning
  if ( isEmptyObj( _transition.ingProperties ) ) {
    // all properties have completed transitioning
    this.disableTransition();
  }
  // clean style
  if ( propertyName in _transition.clean ) {
    // clean up style
    this.element.style[ event.propertyName ] = '';
    delete _transition.clean[ propertyName ];
  }
  // trigger onTransitionEnd callback
  if ( propertyName in _transition.onEnd ) {
    var onTransitionEnd = _transition.onEnd[ propertyName ];
    onTransitionEnd.call( this );
    delete _transition.onEnd[ propertyName ];
  }

  this.emitEvent( 'transitionEnd', [ this ] );
};

proto.disableTransition = function() {
  this.removeTransitionStyles();
  this.element.removeEventListener( transitionEndEvent, this, false );
  this.isTransitioning = false;
};

/**
 * removes style property from element
 * @param {Object} style
**/
proto._removeStyles = function( style ) {
  // clean up transition styles
  var cleanStyle = {};
  for ( var prop in style ) {
    cleanStyle[ prop ] = '';
  }
  this.css( cleanStyle );
};

var cleanTransitionStyle = {
  transitionProperty: '',
  transitionDuration: '',
  transitionDelay: ''
};

proto.removeTransitionStyles = function() {
  // remove transition
  this.css( cleanTransitionStyle );
};

// ----- stagger ----- //

proto.stagger = function( delay ) {
  delay = isNaN( delay ) ? 0 : delay;
  this.staggerDelay = delay + 'ms';
};

// ----- show/hide/remove ----- //

// remove element from DOM
proto.removeElem = function() {
  this.element.parentNode.removeChild( this.element );
  // remove display: none
  this.css({ display: '' });
  this.emitEvent( 'remove', [ this ] );
};

proto.remove = function() {
  // just remove element if no transition support or no transition
  if ( !transitionProperty || !parseFloat( this.layout.options.transitionDuration ) ) {
    this.removeElem();
    return;
  }

  // start transition
  this.once( 'transitionEnd', function() {
    this.removeElem();
  });
  this.hide();
};

proto.reveal = function() {
  delete this.isHidden;
  // remove display: none
  this.css({ display: '' });

  var options = this.layout.options;

  var onTransitionEnd = {};
  var transitionEndProperty = this.getHideRevealTransitionEndProperty('visibleStyle');
  onTransitionEnd[ transitionEndProperty ] = this.onRevealTransitionEnd;

  this.transition({
    from: options.hiddenStyle,
    to: options.visibleStyle,
    isCleaning: true,
    onTransitionEnd: onTransitionEnd
  });
};

proto.onRevealTransitionEnd = function() {
  // check if still visible
  // during transition, item may have been hidden
  if ( !this.isHidden ) {
    this.emitEvent('reveal');
  }
};

/**
 * get style property use for hide/reveal transition end
 * @param {String} styleProperty - hiddenStyle/visibleStyle
 * @returns {String}
 */
proto.getHideRevealTransitionEndProperty = function( styleProperty ) {
  var optionStyle = this.layout.options[ styleProperty ];
  // use opacity
  if ( optionStyle.opacity ) {
    return 'opacity';
  }
  // get first property
  for ( var prop in optionStyle ) {
    return prop;
  }
};

proto.hide = function() {
  // set flag
  this.isHidden = true;
  // remove display: none
  this.css({ display: '' });

  var options = this.layout.options;

  var onTransitionEnd = {};
  var transitionEndProperty = this.getHideRevealTransitionEndProperty('hiddenStyle');
  onTransitionEnd[ transitionEndProperty ] = this.onHideTransitionEnd;

  this.transition({
    from: options.visibleStyle,
    to: options.hiddenStyle,
    // keep hidden stuff hidden
    isCleaning: true,
    onTransitionEnd: onTransitionEnd
  });
};

proto.onHideTransitionEnd = function() {
  // check if still hidden
  // during transition, item may have been un-hidden
  if ( this.isHidden ) {
    this.css({ display: 'none' });
    this.emitEvent('hide');
  }
};

proto.destroy = function() {
  this.css({
    position: '',
    left: '',
    right: '',
    top: '',
    bottom: '',
    transition: '',
    transform: ''
  });
};

return Item;

}));

/*!
 * Outlayer v2.1.1
 * the brains and guts of a layout library
 * MIT license
 */

( function( window, factory ) {
  'use strict';
  // universal module definition
  /* jshint strict: false */ /* globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'outlayer/outlayer',[
        'ev-emitter/ev-emitter',
        'get-size/get-size',
        'fizzy-ui-utils/utils',
        './item'
      ],
      function( EvEmitter, getSize, utils, Item ) {
        return factory( window, EvEmitter, getSize, utils, Item);
      }
    );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory(
      window,
      require('ev-emitter'),
      require('get-size'),
      require('fizzy-ui-utils'),
      require('./item')
    );
  } else {
    // browser global
    window.Outlayer = factory(
      window,
      window.EvEmitter,
      window.getSize,
      window.fizzyUIUtils,
      window.Outlayer.Item
    );
  }

}( window, function factory( window, EvEmitter, getSize, utils, Item ) {
'use strict';

// ----- vars ----- //

var console = window.console;
var jQuery = window.jQuery;
var noop = function() {};

// -------------------------- Outlayer -------------------------- //

// globally unique identifiers
var GUID = 0;
// internal store of all Outlayer intances
var instances = {};


/**
 * @param {Element, String} element
 * @param {Object} options
 * @constructor
 */
function Outlayer( element, options ) {
  var queryElement = utils.getQueryElement( element );
  if ( !queryElement ) {
    if ( console ) {
      console.error( 'Bad element for ' + this.constructor.namespace +
        ': ' + ( queryElement || element ) );
    }
    return;
  }
  this.element = queryElement;
  // add jQuery
  if ( jQuery ) {
    this.$element = jQuery( this.element );
  }

  // options
  this.options = utils.extend( {}, this.constructor.defaults );
  this.option( options );

  // add id for Outlayer.getFromElement
  var id = ++GUID;
  this.element.outlayerGUID = id; // expando
  instances[ id ] = this; // associate via id

  // kick it off
  this._create();

  var isInitLayout = this._getOption('initLayout');
  if ( isInitLayout ) {
    this.layout();
  }
}

// settings are for internal use only
Outlayer.namespace = 'outlayer';
Outlayer.Item = Item;

// default options
Outlayer.defaults = {
  containerStyle: {
    position: 'relative'
  },
  initLayout: true,
  originLeft: true,
  originTop: true,
  resize: true,
  resizeContainer: true,
  // item options
  transitionDuration: '0.4s',
  hiddenStyle: {
    opacity: 0,
    transform: 'scale(0.001)'
  },
  visibleStyle: {
    opacity: 1,
    transform: 'scale(1)'
  }
};

var proto = Outlayer.prototype;
// inherit EvEmitter
utils.extend( proto, EvEmitter.prototype );

/**
 * set options
 * @param {Object} opts
 */
proto.option = function( opts ) {
  utils.extend( this.options, opts );
};

/**
 * get backwards compatible option value, check old name
 */
proto._getOption = function( option ) {
  var oldOption = this.constructor.compatOptions[ option ];
  return oldOption && this.options[ oldOption ] !== undefined ?
    this.options[ oldOption ] : this.options[ option ];
};

Outlayer.compatOptions = {
  // currentName: oldName
  initLayout: 'isInitLayout',
  horizontal: 'isHorizontal',
  layoutInstant: 'isLayoutInstant',
  originLeft: 'isOriginLeft',
  originTop: 'isOriginTop',
  resize: 'isResizeBound',
  resizeContainer: 'isResizingContainer'
};

proto._create = function() {
  // get items from children
  this.reloadItems();
  // elements that affect layout, but are not laid out
  this.stamps = [];
  this.stamp( this.options.stamp );
  // set container style
  utils.extend( this.element.style, this.options.containerStyle );

  // bind resize method
  var canBindResize = this._getOption('resize');
  if ( canBindResize ) {
    this.bindResize();
  }
};

// goes through all children again and gets bricks in proper order
proto.reloadItems = function() {
  // collection of item elements
  this.items = this._itemize( this.element.children );
};


/**
 * turn elements into Outlayer.Items to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - collection of new Outlayer Items
 */
proto._itemize = function( elems ) {

  var itemElems = this._filterFindItemElements( elems );
  var Item = this.constructor.Item;

  // create new Outlayer Items for collection
  var items = [];
  for ( var i=0; i < itemElems.length; i++ ) {
    var elem = itemElems[i];
    var item = new Item( elem, this );
    items.push( item );
  }

  return items;
};

/**
 * get item elements to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - item elements
 */
proto._filterFindItemElements = function( elems ) {
  return utils.filterFindElements( elems, this.options.itemSelector );
};

/**
 * getter method for getting item elements
 * @returns {Array} elems - collection of item elements
 */
proto.getItemElements = function() {
  return this.items.map( function( item ) {
    return item.element;
  });
};

// ----- init & layout ----- //

/**
 * lays out all items
 */
proto.layout = function() {
  this._resetLayout();
  this._manageStamps();

  // don't animate first layout
  var layoutInstant = this._getOption('layoutInstant');
  var isInstant = layoutInstant !== undefined ?
    layoutInstant : !this._isLayoutInited;
  this.layoutItems( this.items, isInstant );

  // flag for initalized
  this._isLayoutInited = true;
};

// _init is alias for layout
proto._init = proto.layout;

/**
 * logic before any new layout
 */
proto._resetLayout = function() {
  this.getSize();
};


proto.getSize = function() {
  this.size = getSize( this.element );
};

/**
 * get measurement from option, for columnWidth, rowHeight, gutter
 * if option is String -> get element from selector string, & get size of element
 * if option is Element -> get size of element
 * else use option as a number
 *
 * @param {String} measurement
 * @param {String} size - width or height
 * @private
 */
proto._getMeasurement = function( measurement, size ) {
  var option = this.options[ measurement ];
  var elem;
  if ( !option ) {
    // default to 0
    this[ measurement ] = 0;
  } else {
    // use option as an element
    if ( typeof option == 'string' ) {
      elem = this.element.querySelector( option );
    } else if ( option instanceof HTMLElement ) {
      elem = option;
    }
    // use size of element, if element
    this[ measurement ] = elem ? getSize( elem )[ size ] : option;
  }
};

/**
 * layout a collection of item elements
 * @api public
 */
proto.layoutItems = function( items, isInstant ) {
  items = this._getItemsForLayout( items );

  this._layoutItems( items, isInstant );

  this._postLayout();
};

/**
 * get the items to be laid out
 * you may want to skip over some items
 * @param {Array} items
 * @returns {Array} items
 */
proto._getItemsForLayout = function( items ) {
  return items.filter( function( item ) {
    return !item.isIgnored;
  });
};

/**
 * layout items
 * @param {Array} items
 * @param {Boolean} isInstant
 */
proto._layoutItems = function( items, isInstant ) {
  this._emitCompleteOnItems( 'layout', items );

  if ( !items || !items.length ) {
    // no items, emit event with empty array
    return;
  }

  var queue = [];

  items.forEach( function( item ) {
    // get x/y object from method
    var position = this._getItemLayoutPosition( item );
    // enqueue
    position.item = item;
    position.isInstant = isInstant || item.isLayoutInstant;
    queue.push( position );
  }, this );

  this._processLayoutQueue( queue );
};

/**
 * get item layout position
 * @param {Outlayer.Item} item
 * @returns {Object} x and y position
 */
proto._getItemLayoutPosition = function( /* item */ ) {
  return {
    x: 0,
    y: 0
  };
};

/**
 * iterate over array and position each item
 * Reason being - separating this logic prevents 'layout invalidation'
 * thx @paul_irish
 * @param {Array} queue
 */
proto._processLayoutQueue = function( queue ) {
  this.updateStagger();
  queue.forEach( function( obj, i ) {
    this._positionItem( obj.item, obj.x, obj.y, obj.isInstant, i );
  }, this );
};

// set stagger from option in milliseconds number
proto.updateStagger = function() {
  var stagger = this.options.stagger;
  if ( stagger === null || stagger === undefined ) {
    this.stagger = 0;
    return;
  }
  this.stagger = getMilliseconds( stagger );
  return this.stagger;
};

/**
 * Sets position of item in DOM
 * @param {Outlayer.Item} item
 * @param {Number} x - horizontal position
 * @param {Number} y - vertical position
 * @param {Boolean} isInstant - disables transitions
 */
proto._positionItem = function( item, x, y, isInstant, i ) {
  if ( isInstant ) {
    // if not transition, just set CSS
    item.goTo( x, y );
  } else {
    item.stagger( i * this.stagger );
    item.moveTo( x, y );
  }
};

/**
 * Any logic you want to do after each layout,
 * i.e. size the container
 */
proto._postLayout = function() {
  this.resizeContainer();
};

proto.resizeContainer = function() {
  var isResizingContainer = this._getOption('resizeContainer');
  if ( !isResizingContainer ) {
    return;
  }
  var size = this._getContainerSize();
  if ( size ) {
    this._setContainerMeasure( size.width, true );
    this._setContainerMeasure( size.height, false );
  }
};

/**
 * Sets width or height of container if returned
 * @returns {Object} size
 *   @param {Number} width
 *   @param {Number} height
 */
proto._getContainerSize = noop;

/**
 * @param {Number} measure - size of width or height
 * @param {Boolean} isWidth
 */
proto._setContainerMeasure = function( measure, isWidth ) {
  if ( measure === undefined ) {
    return;
  }

  var elemSize = this.size;
  // add padding and border width if border box
  if ( elemSize.isBorderBox ) {
    measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight +
      elemSize.borderLeftWidth + elemSize.borderRightWidth :
      elemSize.paddingBottom + elemSize.paddingTop +
      elemSize.borderTopWidth + elemSize.borderBottomWidth;
  }

  measure = Math.max( measure, 0 );
  this.element.style[ isWidth ? 'width' : 'height' ] = measure + 'px';
};

/**
 * emit eventComplete on a collection of items events
 * @param {String} eventName
 * @param {Array} items - Outlayer.Items
 */
proto._emitCompleteOnItems = function( eventName, items ) {
  var _this = this;
  function onComplete() {
    _this.dispatchEvent( eventName + 'Complete', null, [ items ] );
  }

  var count = items.length;
  if ( !items || !count ) {
    onComplete();
    return;
  }

  var doneCount = 0;
  function tick() {
    doneCount++;
    if ( doneCount == count ) {
      onComplete();
    }
  }

  // bind callback
  items.forEach( function( item ) {
    item.once( eventName, tick );
  });
};

/**
 * emits events via EvEmitter and jQuery events
 * @param {String} type - name of event
 * @param {Event} event - original event
 * @param {Array} args - extra arguments
 */
proto.dispatchEvent = function( type, event, args ) {
  // add original event to arguments
  var emitArgs = event ? [ event ].concat( args ) : args;
  this.emitEvent( type, emitArgs );

  if ( jQuery ) {
    // set this.$element
    this.$element = this.$element || jQuery( this.element );
    if ( event ) {
      // create jQuery event
      var $event = jQuery.Event( event );
      $event.type = type;
      this.$element.trigger( $event, args );
    } else {
      // just trigger with type if no event available
      this.$element.trigger( type, args );
    }
  }
};

// -------------------------- ignore & stamps -------------------------- //


/**
 * keep item in collection, but do not lay it out
 * ignored items do not get skipped in layout
 * @param {Element} elem
 */
proto.ignore = function( elem ) {
  var item = this.getItem( elem );
  if ( item ) {
    item.isIgnored = true;
  }
};

/**
 * return item to layout collection
 * @param {Element} elem
 */
proto.unignore = function( elem ) {
  var item = this.getItem( elem );
  if ( item ) {
    delete item.isIgnored;
  }
};

/**
 * adds elements to stamps
 * @param {NodeList, Array, Element, or String} elems
 */
proto.stamp = function( elems ) {
  elems = this._find( elems );
  if ( !elems ) {
    return;
  }

  this.stamps = this.stamps.concat( elems );
  // ignore
  elems.forEach( this.ignore, this );
};

/**
 * removes elements to stamps
 * @param {NodeList, Array, or Element} elems
 */
proto.unstamp = function( elems ) {
  elems = this._find( elems );
  if ( !elems ){
    return;
  }

  elems.forEach( function( elem ) {
    // filter out removed stamp elements
    utils.removeFrom( this.stamps, elem );
    this.unignore( elem );
  }, this );
};

/**
 * finds child elements
 * @param {NodeList, Array, Element, or String} elems
 * @returns {Array} elems
 */
proto._find = function( elems ) {
  if ( !elems ) {
    return;
  }
  // if string, use argument as selector string
  if ( typeof elems == 'string' ) {
    elems = this.element.querySelectorAll( elems );
  }
  elems = utils.makeArray( elems );
  return elems;
};

proto._manageStamps = function() {
  if ( !this.stamps || !this.stamps.length ) {
    return;
  }

  this._getBoundingRect();

  this.stamps.forEach( this._manageStamp, this );
};

// update boundingLeft / Top
proto._getBoundingRect = function() {
  // get bounding rect for container element
  var boundingRect = this.element.getBoundingClientRect();
  var size = this.size;
  this._boundingRect = {
    left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
    top: boundingRect.top + size.paddingTop + size.borderTopWidth,
    right: boundingRect.right - ( size.paddingRight + size.borderRightWidth ),
    bottom: boundingRect.bottom - ( size.paddingBottom + size.borderBottomWidth )
  };
};

/**
 * @param {Element} stamp
**/
proto._manageStamp = noop;

/**
 * get x/y position of element relative to container element
 * @param {Element} elem
 * @returns {Object} offset - has left, top, right, bottom
 */
proto._getElementOffset = function( elem ) {
  var boundingRect = elem.getBoundingClientRect();
  var thisRect = this._boundingRect;
  var size = getSize( elem );
  var offset = {
    left: boundingRect.left - thisRect.left - size.marginLeft,
    top: boundingRect.top - thisRect.top - size.marginTop,
    right: thisRect.right - boundingRect.right - size.marginRight,
    bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom
  };
  return offset;
};

// -------------------------- resize -------------------------- //

// enable event handlers for listeners
// i.e. resize -> onresize
proto.handleEvent = utils.handleEvent;

/**
 * Bind layout to window resizing
 */
proto.bindResize = function() {
  window.addEventListener( 'resize', this );
  this.isResizeBound = true;
};

/**
 * Unbind layout to window resizing
 */
proto.unbindResize = function() {
  window.removeEventListener( 'resize', this );
  this.isResizeBound = false;
};

proto.onresize = function() {
  this.resize();
};

utils.debounceMethod( Outlayer, 'onresize', 100 );

proto.resize = function() {
  // don't trigger if size did not change
  // or if resize was unbound. See #9
  if ( !this.isResizeBound || !this.needsResizeLayout() ) {
    return;
  }

  this.layout();
};

/**
 * check if layout is needed post layout
 * @returns Boolean
 */
proto.needsResizeLayout = function() {
  var size = getSize( this.element );
  // check that this.size and size are there
  // IE8 triggers resize on body size change, so they might not be
  var hasSizes = this.size && size;
  return hasSizes && size.innerWidth !== this.size.innerWidth;
};

// -------------------------- methods -------------------------- //

/**
 * add items to Outlayer instance
 * @param {Array or NodeList or Element} elems
 * @returns {Array} items - Outlayer.Items
**/
proto.addItems = function( elems ) {
  var items = this._itemize( elems );
  // add items to collection
  if ( items.length ) {
    this.items = this.items.concat( items );
  }
  return items;
};

/**
 * Layout newly-appended item elements
 * @param {Array or NodeList or Element} elems
 */
proto.appended = function( elems ) {
  var items = this.addItems( elems );
  if ( !items.length ) {
    return;
  }
  // layout and reveal just the new items
  this.layoutItems( items, true );
  this.reveal( items );
};

/**
 * Layout prepended elements
 * @param {Array or NodeList or Element} elems
 */
proto.prepended = function( elems ) {
  var items = this._itemize( elems );
  if ( !items.length ) {
    return;
  }
  // add items to beginning of collection
  var previousItems = this.items.slice(0);
  this.items = items.concat( previousItems );
  // start new layout
  this._resetLayout();
  this._manageStamps();
  // layout new stuff without transition
  this.layoutItems( items, true );
  this.reveal( items );
  // layout previous items
  this.layoutItems( previousItems );
};

/**
 * reveal a collection of items
 * @param {Array of Outlayer.Items} items
 */
proto.reveal = function( items ) {
  this._emitCompleteOnItems( 'reveal', items );
  if ( !items || !items.length ) {
    return;
  }
  var stagger = this.updateStagger();
  items.forEach( function( item, i ) {
    item.stagger( i * stagger );
    item.reveal();
  });
};

/**
 * hide a collection of items
 * @param {Array of Outlayer.Items} items
 */
proto.hide = function( items ) {
  this._emitCompleteOnItems( 'hide', items );
  if ( !items || !items.length ) {
    return;
  }
  var stagger = this.updateStagger();
  items.forEach( function( item, i ) {
    item.stagger( i * stagger );
    item.hide();
  });
};

/**
 * reveal item elements
 * @param {Array}, {Element}, {NodeList} items
 */
proto.revealItemElements = function( elems ) {
  var items = this.getItems( elems );
  this.reveal( items );
};

/**
 * hide item elements
 * @param {Array}, {Element}, {NodeList} items
 */
proto.hideItemElements = function( elems ) {
  var items = this.getItems( elems );
  this.hide( items );
};

/**
 * get Outlayer.Item, given an Element
 * @param {Element} elem
 * @param {Function} callback
 * @returns {Outlayer.Item} item
 */
proto.getItem = function( elem ) {
  // loop through items to get the one that matches
  for ( var i=0; i < this.items.length; i++ ) {
    var item = this.items[i];
    if ( item.element == elem ) {
      // return item
      return item;
    }
  }
};

/**
 * get collection of Outlayer.Items, given Elements
 * @param {Array} elems
 * @returns {Array} items - Outlayer.Items
 */
proto.getItems = function( elems ) {
  elems = utils.makeArray( elems );
  var items = [];
  elems.forEach( function( elem ) {
    var item = this.getItem( elem );
    if ( item ) {
      items.push( item );
    }
  }, this );

  return items;
};

/**
 * remove element(s) from instance and DOM
 * @param {Array or NodeList or Element} elems
 */
proto.remove = function( elems ) {
  var removeItems = this.getItems( elems );

  this._emitCompleteOnItems( 'remove', removeItems );

  // bail if no items to remove
  if ( !removeItems || !removeItems.length ) {
    return;
  }

  removeItems.forEach( function( item ) {
    item.remove();
    // remove item from collection
    utils.removeFrom( this.items, item );
  }, this );
};

// ----- destroy ----- //

// remove and disable Outlayer instance
proto.destroy = function() {
  // clean up dynamic styles
  var style = this.element.style;
  style.height = '';
  style.position = '';
  style.width = '';
  // destroy items
  this.items.forEach( function( item ) {
    item.destroy();
  });

  this.unbindResize();

  var id = this.element.outlayerGUID;
  delete instances[ id ]; // remove reference to instance by id
  delete this.element.outlayerGUID;
  // remove data for jQuery
  if ( jQuery ) {
    jQuery.removeData( this.element, this.constructor.namespace );
  }

};

// -------------------------- data -------------------------- //

/**
 * get Outlayer instance from element
 * @param {Element} elem
 * @returns {Outlayer}
 */
Outlayer.data = function( elem ) {
  elem = utils.getQueryElement( elem );
  var id = elem && elem.outlayerGUID;
  return id && instances[ id ];
};


// -------------------------- create Outlayer class -------------------------- //

/**
 * create a layout class
 * @param {String} namespace
 */
Outlayer.create = function( namespace, options ) {
  // sub-class Outlayer
  var Layout = subclass( Outlayer );
  // apply new options and compatOptions
  Layout.defaults = utils.extend( {}, Outlayer.defaults );
  utils.extend( Layout.defaults, options );
  Layout.compatOptions = utils.extend( {}, Outlayer.compatOptions  );

  Layout.namespace = namespace;

  Layout.data = Outlayer.data;

  // sub-class Item
  Layout.Item = subclass( Item );

  // -------------------------- declarative -------------------------- //

  utils.htmlInit( Layout, namespace );

  // -------------------------- jQuery bridge -------------------------- //

  // make into jQuery plugin
  if ( jQuery && jQuery.bridget ) {
    jQuery.bridget( namespace, Layout );
  }

  return Layout;
};

function subclass( Parent ) {
  function SubClass() {
    Parent.apply( this, arguments );
  }

  SubClass.prototype = Object.create( Parent.prototype );
  SubClass.prototype.constructor = SubClass;

  return SubClass;
}

// ----- helpers ----- //

// how many milliseconds are in each unit
var msUnits = {
  ms: 1,
  s: 1000
};

// munge time-like parameter into millisecond number
// '0.4s' -> 40
function getMilliseconds( time ) {
  if ( typeof time == 'number' ) {
    return time;
  }
  var matches = time.match( /(^\d*\.?\d*)(\w*)/ );
  var num = matches && matches[1];
  var unit = matches && matches[2];
  if ( !num.length ) {
    return 0;
  }
  num = parseFloat( num );
  var mult = msUnits[ unit ] || 1;
  return num * mult;
}

// ----- fin ----- //

// back in global
Outlayer.Item = Item;

return Outlayer;

}));

/**
 * Isotope Item
**/

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'isotope-layout/js/item',[
        'outlayer/outlayer'
      ],
      factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      require('outlayer')
    );
  } else {
    // browser global
    window.Isotope = window.Isotope || {};
    window.Isotope.Item = factory(
      window.Outlayer
    );
  }

}( window, function factory( Outlayer ) {
'use strict';

// -------------------------- Item -------------------------- //

// sub-class Outlayer Item
function Item() {
  Outlayer.Item.apply( this, arguments );
}

var proto = Item.prototype = Object.create( Outlayer.Item.prototype );

var _create = proto._create;
proto._create = function() {
  // assign id, used for original-order sorting
  this.id = this.layout.itemGUID++;
  _create.call( this );
  this.sortData = {};
};

proto.updateSortData = function() {
  if ( this.isIgnored ) {
    return;
  }
  // default sorters
  this.sortData.id = this.id;
  // for backward compatibility
  this.sortData['original-order'] = this.id;
  this.sortData.random = Math.random();
  // go thru getSortData obj and apply the sorters
  var getSortData = this.layout.options.getSortData;
  var sorters = this.layout._sorters;
  for ( var key in getSortData ) {
    var sorter = sorters[ key ];
    this.sortData[ key ] = sorter( this.element, this );
  }
};

// override reveal method
var _setPosition = proto.setPosition;
proto.setPosition = function() {  
  _setPosition.apply( this, arguments );

  if ( this.layout.options.imgSizes ) {
    if ( !this.imageElements ) {
      this.imageElements = this.element.querySelectorAll( 'img[sizes="auto"]' );
    }
    
    var images = this.imageElements;
    
    for ( var i = 0, len = images.length; i !== len; i++ ) {
      var img = images[i];
      img.setAttribute( 'sizes', img.offsetWidth + 'px' );
    }
  }
  
  if ( !this._lazyloadStarted && this.layout.options.lazyload ) {
    this._lazyloadStarted = true;
    this._lazyload();
  }
};

proto._lazyload = function() {
  this.layout.dispatchEvent( 'beforeItemLoading', null, [ this ] );

  var images = this.element.querySelectorAll('img[data-src]');
  for ( var i = 0, len = images.length; i !== len; i++ ) {
    var img = images[i];
    img.setAttribute('src', img.getAttribute('data-src'));
    img.removeAttribute('data-src');

    var srcset = img.getAttribute('data-srcset');
    if ( srcset ) {
      img.setAttribute('srcset', img.getAttribute('data-srcset'));
      img.removeAttribute('data-srcset');
    }

  }

  var imagesLoadedInstance;
  if ( this.layout.options.useImagesLoaded && window.imagesLoaded ) {
    imagesLoadedInstance = window.imagesLoaded( this.element );
  }

  this.layout.dispatchEvent( 'itemLoading', null, [ this, imagesLoadedInstance ] );
};

var _destroy = proto.destroy;
proto.destroy = function() {
  // call super
  _destroy.apply( this, arguments );
  // reset display, #741
  this.css({
    display: ''
  });
};

return Item;

}));

/**
 * Isotope LayoutMode
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'isotope-layout/js/layout-mode',[
        'get-size/get-size',
        'outlayer/outlayer'
      ],
      factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      require('get-size'),
      require('outlayer')
    );
  } else {
    // browser global
    window.Isotope = window.Isotope || {};
    window.Isotope.LayoutMode = factory(
      window.getSize,
      window.Outlayer
    );
  }

}( window, function factory( getSize, Outlayer ) {
  'use strict';

  // layout mode class
  function LayoutMode( isotope ) {
    this.isotope = isotope;
    // link properties
    if ( isotope ) {
      this.options = isotope.options[ this.namespace ];
      this.element = isotope.element;
      this.items = isotope.filteredItems;
      this.size = isotope.size;
    }
  }

  var proto = LayoutMode.prototype;

  /**
   * some methods should just defer to default Outlayer method
   * and reference the Isotope instance as `this`
  **/
  var facadeMethods = [
    '_resetLayout',
    '_getItemLayoutPosition',
    '_manageStamp',
    '_getContainerSize',
    '_getElementOffset',
    'needsResizeLayout',
    '_getOption'
  ];

  facadeMethods.forEach( function( methodName ) {
    proto[ methodName ] = function() {
      return Outlayer.prototype[ methodName ].apply( this.isotope, arguments );
    };
  });

  // -----  ----- //

  // for horizontal layout modes, check vertical size
  proto.needsVerticalResizeLayout = function() {
    // don't trigger if size did not change
    var size = getSize( this.isotope.element );
    // check that this.size and size are there
    // IE8 triggers resize on body size change, so they might not be
    var hasSizes = this.isotope.size && size;
    return hasSizes && size.innerHeight != this.isotope.size.innerHeight;
  };

  // ----- measurements ----- //

  proto._getMeasurement = function() {
    this.isotope._getMeasurement.apply( this, arguments );
  };

  proto.getColumnWidth = function() {
    this.getSegmentSize( 'column', 'Width' );
  };

  proto.getRowHeight = function() {
    this.getSegmentSize( 'row', 'Height' );
  };

  /**
   * get columnWidth or rowHeight
   * segment: 'column' or 'row'
   * size 'Width' or 'Height'
  **/
  proto.getSegmentSize = function( segment, size ) {
    var segmentName = segment + size;
    var outerSize = 'outer' + size;
    // columnWidth / outerWidth // rowHeight / outerHeight
    this._getMeasurement( segmentName, outerSize );
    // got rowHeight or columnWidth, we can chill
    if ( this[ segmentName ] ) {
      return;
    }
    // fall back to item of first element
    var firstItemSize = this.getFirstItemSize();
    this[ segmentName ] = firstItemSize && firstItemSize[ outerSize ] ||
      // or size of container
      this.isotope.size[ 'inner' + size ];
  };

  proto.getFirstItemSize = function() {
    var firstItem = this.isotope.filteredItems[0];
    return firstItem && firstItem.element && getSize( firstItem.element );
  };

  // ----- methods that should reference isotope ----- //

  proto.layout = function() {
    this.isotope.layout.apply( this.isotope, arguments );
  };

  proto.getSize = function() {
    this.isotope.getSize();
    this.size = this.isotope.size;
  };

  // -------------------------- create -------------------------- //

  LayoutMode.modes = {};

  LayoutMode.create = function( namespace, options ) {

    function Mode() {
      LayoutMode.apply( this, arguments );
    }

    Mode.prototype = Object.create( proto );
    Mode.prototype.constructor = Mode;

    // default options
    if ( options ) {
      Mode.options = options;
    }

    Mode.prototype.namespace = namespace;
    // register in Isotope
    LayoutMode.modes[ namespace ] = Mode;

    return Mode;
  };

  return LayoutMode;

}));

/*!
 * Masonry v4.2.1
 * Cascading grid layout library
 * https://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'masonry-layout/masonry',[
        'outlayer/outlayer',
        'get-size/get-size'
      ],
      factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      require('outlayer'),
      require('get-size')
    );
  } else {
    // browser global
    window.Masonry = factory(
      window.Outlayer,
      window.getSize
    );
  }

}( window, function factory( Outlayer, getSize ) {



// -------------------------- masonryDefinition -------------------------- //

  // create an Outlayer layout class
  var Masonry = Outlayer.create('masonry');
  // isFitWidth -> fitWidth
  Masonry.compatOptions.fitWidth = 'isFitWidth';

  var proto = Masonry.prototype;

  proto._resetLayout = function() {
    this.getSize();
    this._getMeasurement( 'columnWidth', 'outerWidth' );
    this._getMeasurement( 'gutter', 'outerWidth' );
    this.measureColumns();

    // reset column Y
    this.colYs = [];
    for ( var i=0; i < this.cols; i++ ) {
      this.colYs.push( 0 );
    }

    this.maxY = 0;
    this.horizontalColIndex = 0;
  };

  proto.measureColumns = function() {
    this.getContainerWidth();
    // if columnWidth is 0, default to outerWidth of first item
    if ( !this.columnWidth ) {
      var firstItem = this.items[0];
      var firstItemElem = firstItem && firstItem.element;
      // columnWidth fall back to item of first element
      this.columnWidth = firstItemElem && getSize( firstItemElem ).outerWidth ||
        // if first elem has no width, default to size of container
        this.containerWidth;
    }

    var columnWidth = this.columnWidth += this.gutter;

    // calculate columns
    var containerWidth = this.containerWidth + this.gutter;
    var cols = containerWidth / columnWidth;
    // fix rounding errors, typically with gutters
    var excess = columnWidth - containerWidth % columnWidth;
    // if overshoot is less than a pixel, round up, otherwise floor it
    var mathMethod = excess && excess < 1 ? 'round' : 'floor';
    cols = Math[ mathMethod ]( cols );
    this.cols = Math.max( cols, 1 );
  };

  proto.getContainerWidth = function() {
    // container is parent if fit width
    var isFitWidth = this._getOption('fitWidth');
    var container = isFitWidth ? this.element.parentNode : this.element;
    // check that this.size and size are there
    // IE8 triggers resize on body size change, so they might not be
    var size = getSize( container );
    this.containerWidth = size && size.innerWidth;
  };

  proto._getItemLayoutPosition = function( item ) {
    item.getSize();
    // how many columns does this brick span
    var remainder = item.size.outerWidth % this.columnWidth;
    var mathMethod = remainder && remainder < 1 ? 'round' : 'ceil';
    // round if off by 1 pixel, otherwise use ceil
    var colSpan = Math[ mathMethod ]( item.size.outerWidth / this.columnWidth );
    colSpan = Math.min( colSpan, this.cols );
    // use horizontal or top column position
    var colPosMethod = this.options.horizontalOrder ?
      '_getHorizontalColPosition' : '_getTopColPosition';
    var colPosition = this[ colPosMethod ]( colSpan, item );
    // position the brick
    var position = {
      x: this.columnWidth * colPosition.col,
      y: colPosition.y
    };
    // apply setHeight to necessary columns
    var setHeight = colPosition.y + item.size.outerHeight;
    var setMax = colSpan + colPosition.col;
    for ( var i = colPosition.col; i < setMax; i++ ) {
      this.colYs[i] = setHeight;
    }

    return position;
  };

  proto._getTopColPosition = function( colSpan ) {
    var colGroup = this._getTopColGroup( colSpan );
    // get the minimum Y value from the columns
    var minimumY = Math.min.apply( Math, colGroup );

    return {
      col: colGroup.indexOf( minimumY ),
      y: minimumY,
    };
  };

  /**
   * @param {Number} colSpan - number of columns the element spans
   * @returns {Array} colGroup
   */
  proto._getTopColGroup = function( colSpan ) {
    if ( colSpan < 2 ) {
      // if brick spans only one column, use all the column Ys
      return this.colYs;
    }

    var colGroup = [];
    // how many different places could this brick fit horizontally
    var groupCount = this.cols + 1 - colSpan;
    // for each group potential horizontal position
    for ( var i = 0; i < groupCount; i++ ) {
      colGroup[i] = this._getColGroupY( i, colSpan );
    }
    return colGroup;
  };

  proto._getColGroupY = function( col, colSpan ) {
    if ( colSpan < 2 ) {
      return this.colYs[ col ];
    }
    // make an array of colY values for that one group
    var groupColYs = this.colYs.slice( col, col + colSpan );
    // and get the max value of the array
    return Math.max.apply( Math, groupColYs );
  };

  // get column position based on horizontal index. #873
  proto._getHorizontalColPosition = function( colSpan, item ) {
    var col = this.horizontalColIndex % this.cols;
    var isOver = colSpan > 1 && col + colSpan > this.cols;
    // shift to next row if item can't fit on current row
    col = isOver ? 0 : col;
    // don't let zero-size items take up space
    var hasSize = item.size.outerWidth && item.size.outerHeight;
    this.horizontalColIndex = hasSize ? col + colSpan : this.horizontalColIndex;

    return {
      col: col,
      y: this._getColGroupY( col, colSpan ),
    };
  };

  proto._manageStamp = function( stamp ) {
    var stampSize = getSize( stamp );
    var offset = this._getElementOffset( stamp );
    // get the columns that this stamp affects
    var isOriginLeft = this._getOption('originLeft');
    var firstX = isOriginLeft ? offset.left : offset.right;
    var lastX = firstX + stampSize.outerWidth;
    var firstCol = Math.floor( firstX / this.columnWidth );
    firstCol = Math.max( 0, firstCol );
    var lastCol = Math.floor( lastX / this.columnWidth );
    // lastCol should not go over if multiple of columnWidth #425
    lastCol -= lastX % this.columnWidth ? 0 : 1;
    lastCol = Math.min( this.cols - 1, lastCol );
    // set colYs to bottom of the stamp

    var isOriginTop = this._getOption('originTop');
    var stampMaxY = ( isOriginTop ? offset.top : offset.bottom ) +
      stampSize.outerHeight;
    for ( var i = firstCol; i <= lastCol; i++ ) {
      this.colYs[i] = Math.max( stampMaxY, this.colYs[i] );
    }
  };

  proto._getContainerSize = function() {
    this.maxY = Math.max.apply( Math, this.colYs );
    var size = {
      height: this.maxY
    };

    if ( this._getOption('fitWidth') ) {
      size.width = this._getContainerFitWidth();
    }

    return size;
  };

  proto._getContainerFitWidth = function() {
    var unusedCols = 0;
    // count unused columns
    var i = this.cols;
    while ( --i ) {
      if ( this.colYs[i] !== 0 ) {
        break;
      }
      unusedCols++;
    }
    // fit container to columns that have been used
    return ( this.cols - unusedCols ) * this.columnWidth - this.gutter;
  };

  proto.needsResizeLayout = function() {
    var previousWidth = this.containerWidth;
    this.getContainerWidth();
    return previousWidth != this.containerWidth;
  };

  return Masonry;

}));

/*!
 * Masonry layout mode
 * sub-classes Masonry
 * https://masonry.desandro.com
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'isotope-layout/js/layout-modes/masonry',[
        '../layout-mode',
        'masonry-layout/masonry'
      ],
      factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      require('../layout-mode')
      //require('masonry-layout')
    );
  } else {
    // browser global
    factory(
      window.Isotope.LayoutMode,
      window.Masonry
    );
  }

}( window, function factory( LayoutMode, Masonry ) {
'use strict';

// -------------------------- masonryDefinition -------------------------- //

  // create an Outlayer layout class
  var MasonryMode = LayoutMode.create('masonry');

  var proto = MasonryMode.prototype;

  var keepModeMethods = {
    _getElementOffset: true,
    layout: true,
    _getMeasurement: true
  };

  // inherit Masonry prototype
  for ( var method in Masonry.prototype ) {
    // do not inherit mode methods
    if ( !keepModeMethods[ method ] ) {
      proto[ method ] = Masonry.prototype[ method ];
    }
  }

  var measureColumns = proto.measureColumns;
  proto.measureColumns = function() {
    // set items, used if measuring first item
    this.items = this.isotope.filteredItems;
    measureColumns.call( this );
  };

  // point to mode options for fitWidth
  var _getOption = proto._getOption;
  proto._getOption = function( option ) {
    if ( option == 'fitWidth' ) {
      return this.options.isFitWidth !== undefined ?
        this.options.isFitWidth : this.options.fitWidth;
    }
    return _getOption.apply( this.isotope, arguments );
  };

  return MasonryMode;

}));

/**
 * justifyRows layout mode
 */

( function( window, factory ) {
  'use strict';
  // universal module definition
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'isotope-layout/js/layout-modes/justify-rows',[
        '../layout-mode'
      ],
      factory );
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      require('../layout-mode')
    );
  } else {
    // browser global
    factory(
      window.Isotope.LayoutMode
    );
  }

}( window, function factory( LayoutMode ) {
'use strict';

var JustifyRows = LayoutMode.create('justifyRows');

var proto = JustifyRows.prototype;

proto._resetLayout = function() {
  this.x = 0;
  this.y = 0;
  this.maxY = 0;
  this._getMeasurement( 'gutter', 'outerWidth' );
};

proto._getRowHeight = function( rowItems, containerWidth ) {
  containerWidth = containerWidth - rowItems.length * this.gutter;
  var totalHeight = 0;
  for ( var i = 0, len = rowItems.length; i !== len; i++ ) {
    var itemEle = rowItems[i].element,
        w = parseInt( itemEle.getAttribute( 'data-width' ), 10 ) || rowItems[i].size.outerWidth,
        h = parseInt( itemEle.getAttribute( 'data-height' ), 10 ) || rowItems[i].size.outerHeight;

    totalHeight += w / h;
  }

  return containerWidth / totalHeight;
};

proto._resizeItems = function( rowItems, rowHeight ) {
  for ( var i = 0, len = rowItems.length; i !== len; i++ ) {
    var itemEle = rowItems[i].element,
        w = parseInt( itemEle.getAttribute( 'data-width' ), 10 ) || rowItems[i].size.outerWidth,
        h = parseInt( itemEle.getAttribute( 'data-height' ), 10 ) || rowItems[i].size.outerHeight;

    itemEle.style.width = rowHeight * w / h + 'px';
    itemEle.style.height = rowHeight + 'px';
  }
};

proto._beforeLayout = function() {
  var maxHeight = this.options.maxHeight || 200,
      containerWidth = this.isotope.size.innerWidth + this.gutter;

  var checkItems = this.isotope.filteredItems.slice( 0 ),
      row, rowHeight;
  
  newRow: while ( checkItems.length > 0 ) {
    
    for ( var i = 0, len = checkItems.length; i !== len; i++ ) {
      row = checkItems.slice( 0, i + 1 ),
      rowHeight = this._getRowHeight( row, containerWidth );

      if ( rowHeight < maxHeight ) {
        this._resizeItems( row, rowHeight );
        checkItems = checkItems.slice( i + 1 );
        continue newRow;
      }
    }

    // last row
    this._resizeItems( row, Math.min( rowHeight, maxHeight ) );
    break;  
  }
};

proto._getItemLayoutPosition = function( item ) {
  item.getSize();
  var itemWidth = item.size.outerWidth + this.gutter;
  // if this element cannot fit in the current row
  var containerWidth = this.isotope.size.innerWidth + this.gutter;
  if ( this.x !== 0 && itemWidth + this.x > containerWidth ) {
    this.x = 0;
    this.y = this.maxY;
  }

  var position = {
    x: this.x,
    y: this.y
  };

  this.maxY = Math.max( this.maxY, this.y + item.size.outerHeight );
  this.x += itemWidth;

  return position;
};

proto._getContainerSize = function() {
  return { height: this.maxY };
};

return JustifyRows;

}));

/**
 * fitRows layout mode
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'isotope-layout/js/layout-modes/fit-rows',[
        '../layout-mode'
      ],
      factory );
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      require('../layout-mode')
    );
  } else {
    // browser global
    factory(
      window.Isotope.LayoutMode
    );
  }

}( window, function factory( LayoutMode ) {
'use strict';

var FitRows = LayoutMode.create('fitRows');

var proto = FitRows.prototype;

proto._resetLayout = function() {
  this.x = 0;
  this.y = 0;
  this.maxY = 0;
  this._getMeasurement( 'gutter', 'outerWidth' );
};

proto._getItemLayoutPosition = function( item ) {
  item.getSize();

  var itemWidth = item.size.outerWidth + this.gutter;
  // if this element cannot fit in the current row
  var containerWidth = this.isotope.size.innerWidth + this.gutter;
  if ( this.x !== 0 && itemWidth + this.x > containerWidth ) {
    this.x = 0;
    this.y = this.maxY;
  }

  var position = {
    x: this.x,
    y: this.y
  };

  this.maxY = Math.max( this.maxY, this.y + item.size.outerHeight );
  this.x += itemWidth;

  return position;
};

proto._getContainerSize = function() {
  return { height: this.maxY };
};

return FitRows;

}));

/**
 * vertical layout mode
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'isotope-layout/js/layout-modes/vertical',[
        '../layout-mode'
      ],
      factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      require('../layout-mode')
    );
  } else {
    // browser global
    factory(
      window.Isotope.LayoutMode
    );
  }

}( window, function factory( LayoutMode ) {
'use strict';

var Vertical = LayoutMode.create( 'vertical', {
  horizontalAlignment: 0
});

var proto = Vertical.prototype;

proto._resetLayout = function() {
  this.y = 0;
};

proto._getItemLayoutPosition = function( item ) {
  item.getSize();
  var x = ( this.isotope.size.innerWidth - item.size.outerWidth ) *
    this.options.horizontalAlignment;
  var y = this.y;
  this.y += item.size.outerHeight;
  return { x: x, y: y };
};

proto._getContainerSize = function() {
  return { height: this.y };
};

return Vertical;

}));

/*!
 * Isotope v3.0.6
 *
 * Licensed GPLv3 for open source use
 * or Isotope Commercial License for commercial use
 *
 * https://isotope.metafizzy.co
 * Copyright 2010-2018 Metafizzy
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
        'outlayer/outlayer',
        'get-size/get-size',
        'desandro-matches-selector/matches-selector',
        'fizzy-ui-utils/utils',
        'isotope-layout/js/item',
        'isotope-layout/js/layout-mode',
        // include default layout modes
        'isotope-layout/js/layout-modes/masonry',
        'isotope-layout/js/layout-modes/justify-rows',
        'isotope-layout/js/layout-modes/fit-rows',
        'isotope-layout/js/layout-modes/vertical'
      ],
      function( Outlayer, getSize, matchesSelector, utils, Item, LayoutMode ) {
        return factory( window, Outlayer, getSize, matchesSelector, utils, Item, LayoutMode );
      });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('outlayer'),
      require('get-size'),
      require('desandro-matches-selector'),
      require('fizzy-ui-utils'),
      require('isotope-layout/js/item'),
      require('isotope-layout/js/layout-mode'),
      // include default layout modes
      require('isotope-layout/js/layout-modes/masonry'),
      require('isotope-layout/js/layout-modes/fit-rows'),
      require('isotope-layout/js/layout-modes/justify-rows'),
      require('isotope-layout/js/layout-modes/vertical')
    );
  } else {
    // browser global
    window.Isotope = factory(
      window,
      window.Outlayer,
      window.getSize,
      window.matchesSelector,
      window.fizzyUIUtils,
      window.Isotope.Item,
      window.Isotope.LayoutMode
    );
  }

}( window, function factory( window, Outlayer, getSize, matchesSelector, utils,
  Item, LayoutMode ) {



// -------------------------- vars -------------------------- //

var jQuery = window.jQuery;

// -------------------------- helpers -------------------------- //

var trim = String.prototype.trim ?
  function( str ) {
    return str.trim();
  } :
  function( str ) {
    return str.replace( /^\s+|\s+$/g, '' );
  };

// -------------------------- isotopeDefinition -------------------------- //

  // create an Outlayer layout class
  var Isotope = Outlayer.create( 'isotope', {
    layoutMode: 'masonry',
    isJQueryFiltering: true,
    sortAscending: true,
    pagination: false,
    inPage: 20,
    page:1,
    useImagesLoaded: true,
    lazyload:false,
    resizeTransition: true
  });

  Isotope.Item = Item;
  Isotope.LayoutMode = LayoutMode;

  var proto = Isotope.prototype;

  proto._create = function() {
    this.itemGUID = 0;
    // functions that sort items
    this._sorters = {};
    this._getSorters();
    // call super
    Outlayer.prototype._create.call( this );

    // create layout modes
    this.modes = {};
    // start filteredItems with all items
    this.filteredItems = this.items;
    // keep of track of sortBys
    this.sortHistory = [ 'original-order' ];
    // create from registered layout modes
    for ( var name in LayoutMode.modes ) {
      this._initLayoutMode( name );
    }
  };

  proto.reloadItems = function() {
    // reset item ID counter
    this.itemGUID = 0;
    // call super
    Outlayer.prototype.reloadItems.call( this );
  };

  proto._itemize = function() {
    var items = Outlayer.prototype._itemize.apply( this, arguments );
    // assign ID for original-order
    for ( var i=0; i < items.length; i++ ) {
      var item = items[i];
      item.id = this.itemGUID++;
    }
    this._updateItemsSortData( items );
    return items;
  };


  // -------------------------- layout -------------------------- //

  proto._initLayoutMode = function( name ) {
    var Mode = LayoutMode.modes[ name ];
    // set mode options
    // HACK extend initial options, back-fill in default options
    var initialOpts = this.options[ name ] || {};
    this.options[ name ] = Mode.options ?
      utils.extend( Mode.options, initialOpts ) : initialOpts;
    // init layout mode instance
    this.modes[ name ] = new Mode( this );
  };


  proto.layout = function() {
    // if first time doing layout, do all magic
    if ( !this._isLayoutInited && this._getOption('initLayout') ) {
      this.arrange();
      return;
    }
    this._layout();
  };

  // private method to be used in layout() & magic()
  proto._layout = function() {
    // don't animate first layout
    var isInstant = this._getIsInstant();
    // layout flow
    this._resetLayout();
    this._manageStamps();

    this.layoutItems( this.filteredItems, isInstant );

    // flag for initalized
    this._isLayoutInited = true;
  };

  //override layoutItems method
  var _layoutItems = Isotope.prototype.layoutItems;
  Isotope.prototype.layoutItems = function( items, isInstant ) {
    this._beforeLayout( items, isInstant );
    _layoutItems.apply( this, arguments );
  };

  // filter + sort + layout
  proto.arrange = function( opts ) {
    // set any options pass
    this.option( opts );
    this._getIsInstant();
    // filter, sort, and layout

    // filter
    var filtered = this._filter( this.items );
    this.filteredItems = filtered.matches;
    this.notPaginatedItems = this.filteredItems;

    this._sort(); 

    if ( this.options.pagination ) {
      var paginationResult = this._pagination();
      filtered.needHide = filtered.needHide.concat( paginationResult.needHide );
      filtered.needReveal = paginationResult.needReveal;
    }

    this._bindArrangeComplete();
    this._hideRevealItems( filtered );

    this._layout();

    // reset isLayoutInstant
    if ( this.options.pagination ) {
      for ( var i = 0, l = this.filteredItems.length; i !== l; i++ ) {
        this.filteredItems[i].isLayoutInstant = false;
      }
    }

  };
  // alias to _init for main plugin method
  Isotope.prototype._init = Isotope.prototype.arrange;

  // hide and reveal items
  proto._hideRevealItems = function( items ) {
    if ( this._isInstant ) {
      this._noTransition( this._hideReveal, [ items ] );
    } else {
      this._hideReveal( items );
    }
  };
  // alias to _init for main plugin method
  proto._init = proto.arrange;

  proto._hideReveal = function( filtered ) {
    this.reveal( filtered.needReveal );
    this.hide( filtered.needHide );
  };


  // HACK
  // Don't animate/transition first layout
  // Or don't animate/transition other layouts
  proto._getIsInstant = function() {
    var isLayoutInstant = this._getOption('layoutInstant');
    var isInstant = isLayoutInstant !== undefined ? isLayoutInstant :
      !this._isLayoutInited;
    this._isInstant = isInstant;
    return isInstant;
  };

  // listen for layoutComplete, hideComplete and revealComplete
  // to trigger arrangeComplete
  proto._bindArrangeComplete = function() {
    // listen for 3 events to trigger arrangeComplete
    var isLayoutComplete, isHideComplete, isRevealComplete;
    var _this = this;
    function arrangeParallelCallback() {
      if ( isLayoutComplete && isHideComplete && isRevealComplete ) {
        _this.dispatchEvent( 'arrangeComplete', null, [ _this.filteredItems ] );
      }
    }
    this.once( 'layoutComplete', function() {
      isLayoutComplete = true;
      arrangeParallelCallback();
    });
    this.once( 'hideComplete', function() {
      isHideComplete = true;
      arrangeParallelCallback();
    });
    this.once( 'revealComplete', function() {
      isRevealComplete = true;
      arrangeParallelCallback();
    });
  };

  // -------------------------- page -------------------------- //
  
  // private method to devide filtered items to pages
  proto._pagination = function() {
    // move to fist page if filter changed
    if ( this._lastFilter !== this.options.filter ) {
      this._lastFilter = this.options.filter;
      this.options.page = 1;
    }

    if ( !this.notPaginatedItems ) {
      // make a copy from filtered items
      this.notPaginatedItems = this.filteredItems;
    }

    var page = this.options.page,
        items = this.notPaginatedItems,
        startItemInPage = ( page - 1 ) * this.options.inPage,
        endItemInPage = startItemInPage + this.options.inPage - 1,
        inPage = [], needHide = [], needReveal = [];

    var totalPages = Math.ceil( items.length / this.options.inPage ),
        pageChanged = this._lastPage !== page || this._totalPages !== totalPages;

    this._lastPage = page;
    this._totalPages = totalPages;

    for ( var i = 0, len = items.length; i !== len; i++ ) {
      var item = items[i];
      // is it in page?
      if ( i >= startItemInPage && i <= endItemInPage ) {
        inPage.push( item );
        if ( item.isHidden ) {
          needReveal.push( item );
          item.isLayoutInstant = true;
        }
      } else if ( !item.isHidden ) {
        needHide.push( item );
      }
    }
    
    // update filtered items
    this.filteredItems = inPage;

    if ( pageChanged ) {
      this.dispatchEvent( 'paginationUpdate', null, [ page, totalPages, inPage ] );
    }

    return {
      matches: inPage,
      needHide: needHide,
      needReveal: needReveal
    };

  };

  // change current page of isotope
  proto.page = function( pageNum ) {
    this.options.page = Math.max( 1, Math.min( pageNum, this.totalPages() ) );
    this._hideRevealItems( this._pagination() );
    this._layout();
  };

  // go to next page
  proto.nextPage = function() {
    this.page( this.options.page + 1 );
  };

  // go to previous page
  proto.previousPage = function() {
    this.page( this.options.page - 1 );
  };

  // go to last page
  proto.lastPage = function() {
    this.page( this.totalPages() );
  };

  // go to first page
  proto.firstPage = function() {
    this.page( 1 );
  };

  // get total pages
  proto.totalPages = function() {
    return this._totalPages;
  };

  // get current page
  proto.currentPage = function() {
    return this.options.page;
  };

  // -------------------------- filter -------------------------- //

  proto._filter = function( items ) {
    var filter = this.options.filter;
    filter = filter || '*';
    var matches = [];
    var hiddenMatched = [];
    var visibleUnmatched = [];

    var test = this._getFilterTest( filter );

    // test each item
    for ( var i=0; i < items.length; i++ ) {
      var item = items[i];
      if ( item.isIgnored ) {
        continue;
      }
      // add item to either matched or unmatched group
      var isMatched = test( item );
      // item.isFilterMatched = isMatched;
      // add to matches if its a match
      if ( isMatched ) {
          matches.push( item );
      }
      // add to additional group if item needs to be hidden or revealed
      if ( isMatched && item.isHidden ) {
        hiddenMatched.push( item );
      } else if ( !isMatched && !item.isHidden ) {
        visibleUnmatched.push( item );
      }
    }

    // return collections of items to be manipulated
    return {
      matches: matches,
      needReveal: hiddenMatched,
      needHide: visibleUnmatched
    };
  };

  // get a jQuery, function, or a matchesSelector test given the filter
  proto._getFilterTest = function( filter ) {
    if ( jQuery && this.options.isJQueryFiltering ) {
      // use jQuery
      return function( item ) {
        return jQuery( item.element ).is( filter );
      };
    }
    if ( typeof filter == 'function' ) {
      // use filter as function
      return function( item ) {
        return filter( item.element );
      };
    }
    // default, use filter as selector string
    return function( item ) {
      return matchesSelector( item.element, filter );
    };
  };

  // -------------------------- sorting -------------------------- //

  /**
   * @params {Array} elems
   * @public
   */
  proto.updateSortData = function( elems ) {
    // get items
    var items;
    if ( elems ) {
      elems = utils.makeArray( elems );
      items = this.getItems( elems );
    } else {
      // update all items if no elems provided
      items = this.items;
    }

    this._getSorters();
    this._updateItemsSortData( items );
  };

  proto._getSorters = function() {
    var getSortData = this.options.getSortData;
    for ( var key in getSortData ) {
      var sorter = getSortData[ key ];
      this._sorters[ key ] = mungeSorter( sorter );
    }
  };

  /**
   * @params {Array} items - of Isotope.Items
   * @private
   */
  proto._updateItemsSortData = function( items ) {
    // do not update if no items
    var len = items && items.length;

    for ( var i=0; len && i < len; i++ ) {
      var item = items[i];
      item.updateSortData();
    }
  };

  // ----- munge sorter ----- //

  // encapsulate this, as we just need mungeSorter
  // other functions in here are just for munging
  var mungeSorter = ( function() {
    // add a magic layer to sorters for convienent shorthands
    // `.foo-bar` will use the text of .foo-bar querySelector
    // `[foo-bar]` will use attribute
    // you can also add parser
    // `.foo-bar parseInt` will parse that as a number
    function mungeSorter( sorter ) {
      // if not a string, return function or whatever it is
      if ( typeof sorter != 'string' ) {
        return sorter;
      }
      // parse the sorter string
      var args = trim( sorter ).split(' ');
      var query = args[0];
      // check if query looks like [an-attribute]
      var attrMatch = query.match( /^\[(.+)\]$/ );
      var attr = attrMatch && attrMatch[1];
      var getValue = getValueGetter( attr, query );
      // use second argument as a parser
      var parser = Isotope.sortDataParsers[ args[1] ];
      // parse the value, if there was a parser
      sorter = parser ? function( elem ) {
        return elem && parser( getValue( elem ) );
      } :
      // otherwise just return value
      function( elem ) {
        return elem && getValue( elem );
      };

      return sorter;
    }

    // get an attribute getter, or get text of the querySelector
    function getValueGetter( attr, query ) {
      // if query looks like [foo-bar], get attribute
      if ( attr ) {
        return function getAttribute( elem ) {
          return elem.getAttribute( attr );
        };
      }

      // otherwise, assume its a querySelector, and get its text
      return function getChildText( elem ) {
        var child = elem.querySelector( query );
        return child && child.textContent;
      };
    }

    return mungeSorter;
  })();

  // parsers used in getSortData shortcut strings
  Isotope.sortDataParsers = {
    'parseInt': function( val ) {
      return parseInt( val, 10 );
    },
    'parseFloat': function( val ) {
      return parseFloat( val );
    }
  };

  // ----- sort method ----- //

  // sort filteredItem order
  proto._sort = function() {
    if ( !this.options.sortBy ) {
      return;
    }
    // keep track of sortBy History
    var sortBys = utils.makeArray( this.options.sortBy );
    if ( !this._getIsSameSortBy( sortBys ) ) {
      // concat all sortBy and sortHistory, add to front, oldest goes in last
      this.sortHistory = sortBys.concat( this.sortHistory );
    }
    // sort magic
    var itemSorter = getItemSorter( this.sortHistory, this.options.sortAscending );
    if ( this.options.pagination ) {
      this.notPaginatedItems.sort( itemSorter );
    } else {
      this.filteredItems.sort( itemSorter );
    }
  };

  // check if sortBys is same as start of sortHistory
  proto._getIsSameSortBy = function( sortBys ) {
    for ( var i=0; i < sortBys.length; i++ ) {
      if ( sortBys[i] != this.sortHistory[i] ) {
        return false;
      }
    }
    return true;
  };

  // returns a function used for sorting
  function getItemSorter( sortBys, sortAsc ) {
    return function sorter( itemA, itemB ) {
      // cycle through all sortKeys
      for ( var i = 0; i < sortBys.length; i++ ) {
        var sortBy = sortBys[i];
        var a = itemA.sortData[ sortBy ];
        var b = itemB.sortData[ sortBy ];
        if ( a > b || a < b ) {
          // if sortAsc is an object, use the value given the sortBy key
          var isAscending = sortAsc[ sortBy ] !== undefined ? sortAsc[ sortBy ] : sortAsc;
          var direction = isAscending ? 1 : -1;
          return ( a > b ? 1 : -1 ) * direction;
        }
      }
      return 0;
    };
  }

  // -------------------------- methods -------------------------- //

  // get layout mode
  proto._mode = function() {
    var layoutMode = this.options.layoutMode;
    var mode = this.modes[ layoutMode ];
    if ( !mode ) {
      // TODO console.error
      throw new Error( 'No layout mode: ' + layoutMode );
    }
    // HACK sync mode's options
    // any options set after init for layout mode need to be synced
    mode.options = this.options[ layoutMode ];
    return mode;
  };

  proto._resetLayout = function() {
    // trigger original reset layout
    Outlayer.prototype._resetLayout.call( this );
    this._mode()._resetLayout();
  };
  
  Isotope.prototype._beforeLayout = function ( items, isInstant ) {
    var mode = this._mode();
    if ( mode._beforeLayout ) {
      mode._beforeLayout( items, isInstant );
    }
  };  

  proto._getItemLayoutPosition = function( item  ) {
    return this._mode()._getItemLayoutPosition( item );
  };

  proto._manageStamp = function( stamp ) {
    this._mode()._manageStamp( stamp );
  };

  proto._getContainerSize = function() {
    return this._mode()._getContainerSize();
  };

  proto.needsResizeLayout = function() {
    return this._mode().needsResizeLayout();
  };

  // override resize method from outlayer
  Isotope.prototype.resize = function() {
    // don't trigger if size did not change
    // or if resize was unbound. See #9
    if ( !this.isResizeBound || !this.needsResizeLayout() ) {
      return;
    }

    // disable transition effect on page resize
    if ( !this.options.resizeTransition ) {
      this._noTransition( this.layout );
    } else {
      this.layout();
    }

  };

  // -------------------------- adding & removing -------------------------- //

  // HEADS UP overwrites default Outlayer appended
  proto.appended = function( elems ) {
    var items = this.addItems( elems );
    if ( !items.length ) {
      return;
    }

    var pagination = this.options.pagination;

    // filter, layout, reveal new items
    var filteredItems = this._filterRevealAdded( items, !pagination );
    if ( !pagination ) {
      // add to filteredItems
      this.filteredItems = this.filteredItems.concat( filteredItems );
    } else {
      // add new items to the notPaginatedItems instead of filtered items, it will be filtered again by pagination method next.
      this.notPaginatedItems = this.notPaginatedItems.concat( filteredItems );
      // start new layout
      this._resetLayout();
      this._manageStamps();
      var paginateResult = this._pagination();
      this._hideRevealItems( paginateResult );
      this.layoutItems( this.filteredItems );
    }

  };

  // HEADS UP overwrites default Outlayer prepended
  proto.prepended = function( elems ) {
    var items = this._itemize( elems );
    if ( !items.length ) {
      return;
    }

    // start new layout
    this._resetLayout();
    this._manageStamps();
    var pagination = this.options.pagination;

    // filter, layout, reveal new items
    var filteredItems = this._filterRevealAdded( items, !pagination );

    // layout previous items
    if ( !pagination )  { 
      this.layoutItems( this.filteredItems );
      // add to items and filteredItems
      this.filteredItems = filteredItems.concat( this.filteredItems );
    } else {
      // add new items to the notPaginatedItems instead of filtered items, it will be filtered again by pagination method next.
      this.notPaginatedItems = filteredItems.concat( this.notPaginatedItems );
      var paginateResult = this._pagination(); 
      this._hideRevealItems( paginateResult );
      this.layoutItems( this.filteredItems );
    }

    this.items = items.concat( this.items );
  };

  proto._filterRevealAdded = function( items ) {
    var filtered = this._filter( items );
    this.hide( filtered.needHide );
    // reveal all new items
    this.reveal( filtered.matches );
    // layout new items, no transition
    this.layoutItems( filtered.matches, true );
    return filtered.matches;
  };

  /**
   * Filter, sort, and layout newly-appended item elements
   * @param {Array or NodeList or Element} elems
   */
  proto.insert = function( elems ) {
    var items = this.addItems( elems );
    if ( !items.length ) {
      return;
    }
    // append item elements
    var i, item;
    var len = items.length;
    for ( i=0; i < len; i++ ) {
      item = items[i];
      this.element.appendChild( item.element );
    }
    // filter new stuff
    var filteredInsertItems = this._filter( items ).matches;
    // set flag
    for ( i=0; i < len; i++ ) {
      items[i].isLayoutInstant = true;
    }
    this.arrange();
    // reset flag
    for ( i=0; i < len; i++ ) {
      delete items[i].isLayoutInstant;
    }
    this.reveal( filteredInsertItems );
  };

  var _remove = proto.remove;
  proto.remove = function( elems ) {
    elems = utils.makeArray( elems );
    var removeItems = this.getItems( elems );
    // do regular thing
    _remove.call( this, elems );
    // bail if no items to remove
    var len = removeItems && removeItems.length;
    // remove elems from filteredItems
    for ( var i=0; len && i < len; i++ ) {
      var item = removeItems[i];
      // remove item from collection
      utils.removeFrom( this.filteredItems, item );
    }
  };

  proto.shuffle = function() {
    // update random sortData
    for ( var i=0; i < this.items.length; i++ ) {
      var item = this.items[i];
      item.sortData.random = Math.random();
    }
    this.options.sortBy = 'random';
    this._sort();
    this._layout();
  };

  /**
   * trigger fn without transition
   * kind of hacky to have this in the first place
   * @param {Function} fn
   * @param {Array} args
   * @returns ret
   * @private
   */
  proto._noTransition = function( fn, args ) {
    // save transitionDuration before disabling
    var transitionDuration = this.options.transitionDuration;
    // disable transition
    this.options.transitionDuration = 0;
    // do it
    var returnValue = fn.apply( this, args );
    // re-enable transition for reveal
    this.options.transitionDuration = transitionDuration;
    return returnValue;
  };

  // ----- helper methods ----- //

  /**
   * getter method for getting filtered item elements
   * @returns {Array} elems - collection of item elements
   */
  proto.getFilteredItemElements = function() {
    return this.filteredItems.map( function( item ) {
      return item.element;
    });
  };

  // -----  ----- //

  return Isotope;

}));


/*! 
 * ================== js/src/plugins/auxin-jquery.isoxin.js =================== 
 **/ 

;(function ( $, window, document, undefined ) {

    "use strict";

    // Create the defaults once
    var pluginName = "AuxIsotope",
        defaults = {
            space                   : -1,
            layoutMode              : 'masonry',
            lazyload                : false,
            paginationLoc           : null,
            loadingHeight           : 500,
            searchFilter            : false,
            grouping                : null,
            deeplink                : true,
            isOriginLeft            : true,
            slug                    : 'recent',
            filters                 : '.aux-isotope-filters',

            // isoxin animation timing options
            revealTransitionDelay       : 50,
            revealTransitionDuration    : 50,
            revealBetweenDelay          : 200,
            hideTransitionDuration      : null,
            hideTransitionDelay         : 0,
            hideBetweenDelay            : 200,
            loadingTransitionDuration   : 600,
            imgSizes                    : true,

            resizeTransition        : false,
            paginationClass         : 'aux-pagination aux-round aux-page-no-border aux-iso-pagination',
            loadingClass            : 'aux-loading',
            afterInitClass          : 'aux-isotope-ready',
            groupingPrefix          : '.aux-grouping-',
            searchClass             : '.aux-isotope-search',
            updateUponResize        : false,
            isInitLayout            : false, // prevent auto initialization in isotope
            transitionDuration      : 0, // isotope animation duration ( 0 recommended )

            itemsLoading    : '.aux-items-loading',
            loadingVisible  : 'aux-loading-visible',
            loadingHide     : 'aux-loading-hide',

            // transition helper class names
            transitionHelpers   : {
                hiding          : 'aux-iso-hiding',
                hidden          : 'aux-iso-hidden',
                revealing       : 'aux-iso-revealing',
                visible         : 'aux-iso-visible'
            }

    }, attributeOptionsMap = {
        'pagination'       : 'pagination',
        'perpage'          : 'inPage',
        'layout'           : 'layoutMode',
        'lazyload'         : 'lazyload',
        'space'            : 'space',
        'loading-height'   : 'loadingHeight',
        'search-filter'    : 'searchFilter',
        'grouping'         : 'grouping',
        'deeplink'         : 'deeplink',
        'slug'             : 'slug',
        'filters'          : 'filters',
        'pagination-class' : 'paginationClass'
    };

    // The actual plugin constructor
    function Plugin ( element, options ) {

        if ( !window.Isotope && !$.fn.isotope ) {
            // isotope is not available in this page.
            $.error( 'isotope is not available in this page.' );
            return;
        }

        this.element = element;
        this.$element = $( element );
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;

        // read options from the element
        /* ------------------------------------------------------------------------------ */
        for ( var attr in attributeOptionsMap ) {
            var value = this.$element.data( attr );
            if ( value !== undefined ) {
                this.settings[ attributeOptionsMap[attr] ] = value;
            }
        }

        // check layout
        if ( this.settings.layoutMode === 'grid' ) {
            this.settings.layoutMode = 'masonry';
        }
        /* ------------------------------------------------------------------------------ */

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend( Plugin.prototype, {
        init: function() {
            this.$element.addClass( this.settings.afterInitClass );

            if ( this.settings.lazyload ) {
                this.$element.height( this.settings.loadingHeight );
            }

            if ( this.$element.parents('.rtl').length ) {
                this.settings.isOriginLeft  = false;
            }

            this._isoElement = this.$element[0];

            if ( this.settings.space >= 0 ) {
                this.$element.children( this.settings.itemSelector ).css({
                    'margin-bottom': this.settings.space + 'px',
                    'padding-right': this.settings.space + 'px'
                });

               this.$element.css( 'margin-right', -this.settings.space + 'px' );
            }

            // Retrieve custom transition settings
            this.settings.revealTransitionDuration = this.$element.data("reveal-transition-duration") || this.settings.revealTransitionDuration;
            this.settings.revealBetweenDelay       = this.$element.data("reveal-between-delay"      ) || this.settings.revealBetweenDelay;
            this.settings.revealTransitionDelay    = this.$element.data("reveal-transition-delay"   ) || this.settings.revealTransitionDelay;

            this.settings.hideTransitionDuration   = this.$element.data("hide-transition-duration"  ) || this.settings.hideTransitionDuration;
            this.settings.hideBetweenDelay         = this.$element.data("hide-between-delay"        ) || this.settings.hideBetweenDelay;
            this.settings.hideTransitionDelay      = this.$element.data("hide-transition-delay"     ) || this.settings.hideTransitionDelay;

            // initialize isotope
            this._isotope = new Isotope( this._isoElement, this.settings );

            // disable default transitions in isotope
            this._isotope.options.hiddenStyle = {};
            this._isotope.options.visibleStyle = {};

            // store isotope on element
            this.$element.data( 'isotope', this._isotope );

            var self = this;
            this._isotope.options.filter = function() {
                return self._filtering( this );
            };

            this._groupValue    = null;
            this._filterValue   = null;
            this._searchValue   = null;
            this._currentFilter = null;
            this._currentSearch = null;
            this._currentGroup  = null;

            if( this.settings.grouping ){
                this._setGroupValue();
            }

            if ( this.settings.deeplink ) {
                this._initDeeplink();
            }

            if ( this.settings.pagination ) {
                // create pagination markup
                this._isotope.options.pagination = true;
                this._initPagination();
            }

            if ( this.settings.lazyload && window.imagesLoaded ) {
                this._isotope.on( 'itemLoading', this._setLazyload.bind(this) );
            } else if ( window.imagesLoaded ) {
                this.$element.imagesLoaded().always( function( instance, image ) {
                    this._arrangeIsotope();
                }.bind( this ) );
            }

            // arrange items
            this._isotope.arrange();
            this._currentPage = this._isotope.options.page;

            this._isotope.items.forEach( function( item ){
                // define $element in item
                if ( !item.$element ) {
                    item.$element = $(item.element);
                }
            }, this );

            if ( this.settings.lazyload ){
                // generate the loading
                this.$loading = this.$element.find( this.settings.itemsLoading )
                                             .addClass( this.settings.loadingHide )
                                             .appendTo( this.$element );
                this._instantlyHideItems();
                this._revealItems();
            }

            // update upon resize
            if ( this.settings.updateUponResize ) {
                $(window).on( 'resize', this._arrangeIsotope.bind( this ) );
            }

            this.ـinitFilters();
        },

        arrange: function( method, options ) {
            var io = this._isotope.options;

            // check filter and page
            if ( this._currentFilter === this._filterValue && ( !this.settings.grouping || this._currentGroup === this._groupValue ) && ( !this.settings.searchFilter || this._currentSearch === this._searchValue   ) && ( !this.settings.pagination || this._currentPage === io.page ) ) {
                return;
            } else {
                this._currentPage   = io.page;
                this._currentFilter = this._filterValue;
                this._currentSearch = this._searchValue;
                this._currentGroup  = this._groupValue;
            }

            var items = this._isotope.filteredItems,
                totalHideDuration = this.settings.transitionDelay,
                totalRevealDuration = 0,
                helpers = this.settings.transitionHelpers,
                i = 0,
                st = this.settings,
                self = this;

            items.forEach ( function( item ){
                self._hideItem( item, self.settings.hideBetweenDelay * (++i) + st.hideTransitionDelay, st.hideTransitionDuration );
            });

            totalHideDuration = st.hideBetweenDelay * i + st.hideTransitionDelay + st.hideTransitionDuration;

            clearTimeout( this._hidingTimeout );
            clearTimeout( this._revealingTimeout );

            this._hidingTimeout = setTimeout( function(){
                self._instantlyHideItems();
                
                if ( !method || method === 'arrange' ) {
                    self._isotope._noTransition( self._isotope.arrange );
                } else {
                    self._isotope[method].apply( self._isotope, options );
                }

                self._revealItems();

            }, totalHideDuration );

            if ( st.deeplink ) {
                self._updateHash();
            }

            this.$element.trigger( 'auxinIsotopeArrange' );

        },

        insert: function( $item ) {
            if ( this.settings.space >= 0 ) {
                $item.css({
                    'margin-bottom': this.settings.space + 'px',
                    'padding-right': this.settings.space + 'px'
                });
            }

            this._isotope.insert($item);
            this._isotope.items.forEach( function( item ){
                // define $element in item
                if ( !item.$element ) {
                    item.$element = $(item.element);
                }
            }, this );

            this._instantlyHideItems();
            this._revealItems();
        },

        remove: function( items ) {
            if ( !Array.isArray( items ) ) {
                items = [items];
            }

            this._isotope.remove( items.map( function( item ) { return item.element; } ) );
            this._isotope.arrange();
        },

        removeAll: function() {
            this._isotope.remove( this._isotope.items.map( function( item ) { return item.element; } ) );
            this.updateIsotope();
            this._isotope.options.page = 1;
        },

        updateIsotope: function(){
            this._arrangeIsotope();
        },

        /**
         * destroys the plugin
         * @public
         */
        destroy: function() {
            if ( this.settings.pagination ) {
                this.$pagination.remove();
            }

            if ( this.settings.updateUponResize ) {
                $(window).off( 'resize', this._arrangeIsotope.bind( this ) );
            }

            this.$element.data( 'isotope', null );
            this._isotope.destroy();
            this.$element.remove();
        },

        changeGroup: function( groupName ){
            // Keep old group name
            this._oldGroup   =  this._groupValue;
            // Update group value
            this._groupValue = groupName;
            // Set localStorage
            localStorage.setItem( 'auxinIsotopeGroup', this._groupValue );
            // Change Filter List View
            this.$filters.find( this.settings.groupingPrefix + this._groupValue ).removeClass( this.settings.transitionHelpers.hidden );
            this.$filters.find( this.settings.groupingPrefix + this._oldGroup ).addClass( this.settings.transitionHelpers.hidden );
            // Arrange isotope
            if ( !this._internalFilterChange ) {
                this.arrange( 'arrange' );
            } else {
                this._internalFilterChange = false;
            }
        },
        
        /* ------------------------------------------------------------------------------ */
        // loading
        showLoading: function(){
            if ( this._loadingIsVisible ) {
                return;
            }

            this.$element.height( this.settings.loadingHeight );

            this._loadingIsVisible = true;
            clearTimeout( this._loadingTimeout );
            this.$loading.show()

            setTimeout(function(){
                this.$loading.addClass( this.settings.loadingVisible )
                .removeClass( this.settings.loadingHide );
            }.bind(this), 1);
            
                         
        },

        hideLoading: function(){
            if ( !this._loadingIsVisible ) {
                return;
            }

            this._loadingIsVisible = false;
            this.$loading.removeClass( this.settings.loadingVisible )
                         .addClass( this.settings.loadingHide );

            clearTimeout( this._loadingTimeout );
            this._loadingTimeout = setTimeout( function(){
                this.$loading.hide();
            }.bind(this), this.settings.loadingTransitionDuration );
        },
        
        /* ------------------------------------------------------------------------------ */
        // Private methods

        _instantlyHideItems: function() {
            this._isotope.items.forEach( function( item ){
                item.element.style[window._jcsspfx + 'TransitionDelay']    = '0';
                item.element.style[window._jcsspfx + 'TransitionDuration'] = '0';
                this._removeHelpers( item.$element );
                item.$element.addClass( this.settings.transitionHelpers.hidden );
            }, this);
        },

        _isFilteredItemsLoaded: function() {
            var items = this._isotope.filteredItems;
            for ( var i = 0, l = items.length; i !== l; i++ ) {
                if( !items[i].loaded ) {
                    return false;
                }
            }

            return true;
        },

        _revealItems: function() {
            var items = this._isotope.filteredItems,
                st = this.settings,
                i = 0;

            if ( !st.lazyload || this._isFilteredItemsLoaded() ) {
                if ( st.lazyload ) {
                    this.hideLoading();
                    this._isotope._noTransition(this._isotope.layout);
                    this._waitForLoad = false;
                }

                this._revealingTimeout = setTimeout( function() {
                    items.forEach( function( item ){
                        this._removeHelpers( item.$element );
                        item.$element.addClass( st.transitionHelpers.hidden );
                        this._revealItem( item, st.revealBetweenDelay * (++i) , st.revealTransitionDuration );
                    }, this);
                }.bind(this), Math.max(st.revealTransitionDelay, 10) );

                this.$element.trigger( 'auxinIsotopeReveal', [items] );
            } else {
                this.showLoading();
                this._waitForLoad = true;
            }
        },

        _revealItem: function( item, delay, duration ) {
            item.element.style[window._jcsspfx + 'TransitionDelay']    = delay + 'ms';
            item.element.style[window._jcsspfx + 'TransitionDuration'] = duration + 'ms';
            this._removeHelpers( item.$element );
            item.$element.addClass( this.settings.transitionHelpers.revealing );

            clearTimeout( item._animTimeout );
            item._animTimeout = setTimeout( function(){
                this._removeHelpers( item.$element );
                item.element.style[window._jcsspfx + 'TransitionDelay']    = '';
                item.element.style[window._jcsspfx + 'TransitionDuration'] = '';
                item.$element.addClass( this.settings.transitionHelpers.visible );
            }.bind(this), delay + duration );
        },

        _hideItem: function( item, delay, duration ) {
            item.element.style[window._jcsspfx + 'TransitionDelay']    = delay + 'ms';
            item.element.style[window._jcsspfx + 'TransitionDuration'] = duration + 'ms';
            this._removeHelpers( item.$element );
            item.$element.addClass( this.settings.transitionHelpers.hiding );

            clearTimeout( item._animTimeout );
            item._animTimeout = setTimeout( function(){
                this._removeHelpers( item.$element );
                item.element.style[window._jcsspfx + 'TransitionDelay']    = '';
                item.element.style[window._jcsspfx + 'TransitionDuration'] = '';
                item.$element.addClass( this.settings.transitionHelpers.hidden );
            }.bind(this), delay + duration );
        },


        _arrangeIsotope: function(){
            this._isotope.layout();
        },

        /**
         * removes transition helpers class name from item.
         * @return {[type]}      [description]
         */
        _removeHelpers: function( $item ) {
           var helpers = this.settings.transitionHelpers;

            // remove old classNames
            for ( var classKey in helpers ) {
                $item.removeClass( helpers[classKey] );
            }
        },


        _setLazyload: function( item, imagesloaded ) {
            var iso = this._isotope,
                that = this;
                imagesloaded.on( 'always', function(e) {
                item.loaded = true;

                // We need to reset isotope item width and height to make sure it calculates the items size correctly
                item.element.style.height = '';
                item.element.style.width = '';

                setTimeout( function() {
                    this.elements.forEach( function( element ) {
                            $(element).removeClass( this.settings.loadingClass );
                    }, that );

                    that._revealItems();
                }.bind( this ) );
            });
        },

        /* ------------------------------------------------------------------------------ */
        // filters
        _filtering: function( itemElement ){
            var $item = $(itemElement);

            // Item list filter
            if( this._filterValue && this._filterValue !== 'all' && !$item.is( this._filterValue ) ){
                return false;
            }

            // Serach value filter
            if( this._searchValue && !( $item.text().match( this._searchValue ) || itemElement.className.match( this._searchValue ) ) ) {
                return false;
            }

            // Grouping filter
            if( this._groupValue && !$item.is( this.settings.groupingPrefix + this._groupValue ) ) {
                return false;
            }

            return true;
        },

        ـinitFilters: function() {
            if ( this.settings.filters ) {
                this.$filters = this.$element.siblings( this.settings.filters ).eq(0);

                if ( !this.$filters ) {
                    return;
                }

                var self = this;
                // List Filters
                this.$filters.find( 'li' ).on( 'click', function( e ) {
                    var $this = $(this),
                        filter = $this.data( 'filter' );

                    if ( filter.length ) {
                        if ( filter === 'all' ) {
                            self._filterValue = false;
                        } else {
                            self._filterValue = '.' + filter;
                        }
                    } else {
                        self._filterValue = false;
                    }

                    if ( !self._internalFilterChange && e.originalEvent ) {
                        self.arrange( 'arrange' );
                    } else {
                        self._internalFilterChange = false;
                    }

                    e.preventDefault();
                });

                // Search Filter
                this.$filters.find( self.settings.searchClass ).keyup( this._debounce( function( e ) {
                    var $this = $(this),
                        filter = $this.val();

                    if( filter.length > 2 ) {
                        self._searchValue = new RegExp( filter, 'gi' );
                    } else {
                        self._searchValue = false;
                    }

                    if ( !self._internalFilterChange && e.originalEvent ) {
                        self.arrange( 'arrange' );
                    } else {
                        self._internalFilterChange = false;
                    }
                }, 200 ) );

                setTimeout( this._updateSelectedFilter.bind(this), 300 );
            }
        },

        _setGroupValue: function(){
            this._localGroupValue = localStorage.getItem("auxinIsotopeGroup");
            this._groupValue = this._localGroupValue ? this._localGroupValue : this.settings.grouping;
        },

        _updateSelectedFilter: function() {
            this._internalFilterChange = true;
            this.$filters.find( '[data-filter="' + (this._filterValue || 'all').replace('.' ,'') + '"] a' ).trigger( 'click' );
        },

        _debounce: function( fn, threshold ) {
            var timeout;
            threshold = threshold || 100;
            return function debounced() {
                clearTimeout( timeout );
                var args  = arguments;
                var _this = this;
                function delayed() {
                    fn.apply( _this, args );
                }
                timeout = setTimeout( delayed, threshold );
            };
        },

        /* ------------------------------------------------------------------------------ */
        // pagination

        /**
         * initialize the pagination control
         */
        _initPagination: function() {

            this.$pagination = $('<nav></nav>').addClass( this.settings.paginationClass );

            if ( this.settings.paginationLoc ) {
                this.$pagination.appendTo( this.settings.paginationLoc );
            } else {
                this.$pagination.insertAfter( this.$element );
            }

            this.$pagination.on( 'click', this._updatePage.bind(this) );

            // update pagination buttons
            this._isotope.on( 'paginationUpdate', this._updatePagination.bind(this) );

        },

        /**
         * updates the pagination control
         * @param  {Number} currentPage
         * @param  {Number} totalPage
         * @param  {Array} items
         */
        _updatePagination: function( currentPage, totalPage, items ) {

            if ( this._internalPaginate ) {
                this._internalPaginate = false;
                return;
            }

            // generate pagination markup
            var html = '<ul class="pagination">';

            if ( totalPage > 1 ) {
                //if ( currentPage !== 1 ) {
                    html += '<li class="prev"><a href="#" data-prev="true">Previous</a></li>';
                //}

                for ( var i = 0; i !== totalPage; i++ ) {
                    var page =  i + 1;
                    html += '<li class="page ' + ( page === currentPage ? 'active' : '' ) + ' "><a data-page="' + page + '" href="#">' + page + '</a>';
                }

                //if ( currentPage !== totalPage ) {
                    html += '<li class="next"><a href="#" data-next="true">Next</a></li>';
                //}
            }

            html += '</ul>';

            this.$pagination.html( html );
        },

        /**
         * pagination click listener
         */
        _updatePage: function( event ) {
            var $btn = $( event.target ),
                page;

            if ( $btn.data( 'page' ) !== undefined ) {
                page = $btn.data( 'page' );
            } else if ( $btn.data( 'next' ) ) {
                page = Math.min( this._isotope.currentPage() + 1 , this._isotope.totalPages() );
            } else if ( $btn.data( 'prev' ) ) {
                page = Math.max( this._isotope.currentPage() - 1 , 1 );
            } else {
                return;
            }

            this._isotope.options.page = page;
            this.$pagination.find('.page').removeClass('active')
                                          .eq( page - 1  )
                                          .addClass('active');
            this._internalPaginate = true;
            this.arrange('arrange');
            event.preventDefault();
        },

        /* ------------------------------------------------------------------------------ */
        // deeplink

        _initDeeplink: function() {
            this._readHash( false );
            $(window).on( 'hashchange', this._readHash.bind(this) );
            //this._isotope.on( 'arrangeComplete', this._updateHash.bind(this) );
        },

        _findHashData: function() {
            var hash = window.location.hash.slice(1).split(','),
                result

            for ( var i = 0, l = hash.length; i !== l; i++ ) {
                result = hash[i].split( '/' );
                if ( result.indexOf( this.settings.slug ) !== -1 ) {
                    return result;
                }
            }

            return false;
        },

        _readHash: function( arrange ) {
            if ( this._internalHashUpdate ) {
                this._internalHashUpdate = false;
                return;
            }

            // #/slug/filter/page
            // #/recent/all/1

            var result = this._findHashData();
            if ( !result ) {
                return;
            }

            var io = this._isotope.options,
                oldFilter = this._filterValue,
                oldPage   = io.page;

            this._filterValue = this._parseFilter( result[2] );
            if ( this.settings.pagination ){
                io.page = this._checkPagePolicy( parseInt( result[3] ) );
            }

            if ( !arrange || ( this._filterValue === oldFilter && ( !this.settings.pagination || io.page === oldPage ) ) ) {
                return;
            }

            if ( this.$filters ) {
                this._updateSelectedFilter();
            }

            this._internalHashRead = true;
            this.arrange('arrange');
        },

        _updateHash: function() {
            if ( this._internalHashRead ) {
                this._internalHashRead = false;

                return;
            }

            var hashStr = '/' + this.settings.slug + '/' + this._sanitizeFilter(this._filterValue),
                currentHash = window.location.hash.slice(1);

            if ( this.settings.pagination ) {
                hashStr += '/' + this._isotope.options.page;
            }

            var inHash = this._findHashData();

            this._internalHashUpdate = true;

            if ( inHash ) {
                var hash = currentHash.split(',');
                for ( var i = 0, l = hash.length; i !== l; i++ ) {
                    if ( hash[i].split( '/' ).indexOf( this.settings.slug ) !== -1 ) {
                        hash[i] = hashStr;
                        break;
                    }
                }

                window.location.hash = hash.join(',');
            } else if ( currentHash.length ) {
                window.location.hash = currentHash + ',' + hashStr;
            } else {
                window.location.hash = hashStr;
            }
        },

        _checkPagePolicy: function( page ) {
            if ( !this._isotope.options.pagination ) {
                return undefined;
            }

            if ( page <= 0 ) {
                return 1;
            }

            if ( page > this._isotope.totalPages() ) {
                return this._isotope.totalPages();
            }

            if ( isNaN(page) ) {
                return 1;
            }

            return page;
        },

        _sanitizeFilter: function( filter ) {
            if ( !filter ) {
                return 'all';
            }

            return filter.replace(/\s/g, '&').replace('.', '');
        },

        _parseFilter: function( filter ) {
            if ( filter === 'all' || filter === undefined ) {
                return undefined;
            }

            return '.' + $.trim( filter.replace('&', ' .') );
        }

    });

    $.fn[pluginName] = function (options) {
        var args = arguments,
            plugin = 'plugin_' + pluginName;
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!$.data(this, plugin)) {
                    $.data(this, plugin, new Plugin( this, options ));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            var returns;

            this.each(function () {
                var instance = $.data(this, plugin);
                if (instance instanceof Plugin && typeof instance[options] === 'function') {
                    returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }
                if (options === 'destroy') {
                  $.data(this, plugin, null);
                }
            });
            return returns !== undefined ? returns : this;
        }
    };

})( jQuery, window, document );


/*! 
 * ================== js/src/plugins/auxin-jquery.toggleSelected.js =================== 
 **/ 

;(function ( $, window, document, undefined ) {

    "use strict";

    var pluginName = "AuxinToggleSelected",
        defaults = {
            isotope       : null, // isotope element
            overlayClass  : 'aux-overlay',
            overlay       : 'aux-select-overlay',
            event         : 'click',
            target        : 'li>a',
            selected      : 'aux-selected',
            resizeOverlay : true
        };

    function Plugin ( element, options ) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function() {
            this.$targets = this.$element.find( this.settings.target );

            this.$targets.on( this.settings.event, this._toggleSelected.bind(this) );

            if ( this.$element.hasClass( this.settings.overlayClass ) ) {
                this.overlay = this.$element.find( '.' + this.settings.overlay )[0];
                $(window).resize( this._locateOverlay.bind( this ) );
            }

            // select first if nothing selected
            if ( this.$element.find( '.' + this.settings.selected ).length === 0 ) {
                this.$current = this.$targets.eq(0);
                this._toggleSelected( { currentTarget: this.$current[0] } );
            }

            this._locateOverlay();

        },

        _toggleSelected: function( event ) {
            this.$targets.removeClass( this.settings.selected );
            var $this = $(event.currentTarget);
            $this.addClass( this.settings.selected );

            // update isotope, applies data-filter to isotope instance
            if ( this.settings.isotope ) {
                 this.settings.isotope.arrange( { filter: $this.data('filter') } );
            }

            this.$current = $this;
            this._locateOverlay();
        },

        _locateOverlay: function() {
            if ( !this.overlay || !this.$current ) {
                return;
            }

            this.overlay.style[window._jcsspfx + 'Transform'] = 'translate(' +
                                    ( this.$current.offset().left - this.$element.offset().left ) + 'px, ' +
                                    ( this.$current.offset().top  - this.$element.offset().top  ) + 'px  )';

            if ( this.settings.resizeOverlay ) {
                this.overlay.style.width  = ( this.$current.outerWidth() - 1 ) + 'px';
                this.overlay.style.height = ( this.$current.outerHeight() - 1 ) + 'px';
            }

        },

        destroy: function() {
            $(window).off( 'resize', this._locateOverlay );
            this.$overlay = null;
            this.$element.remove();
        }

    });


    $.fn[pluginName] = function (options) {
        var args = arguments,
            plugin = 'plugin_' + pluginName;

        if (options === undefined || typeof options === 'object') {
            return this.each(function () {

                if (!$.data(this, plugin)) {
                    $.data(this, plugin, new Plugin( this, options ));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            var returns;

            this.each(function () {
                var instance = $.data(this, plugin);

                if (instance instanceof Plugin && typeof instance[options] === 'function') {
                    returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                  $.data(this, plugin, null);
                }
            });

            return returns !== undefined ? returns : this;
        }
    };

})( jQuery, window, document );


/*! 
 * ================== js/libs/plugins/averta/averta-option-controls.js =================== 
 **/ 

var OptionControls=function(e){var t={};function o(n){if(t[n])return t[n].exports;var s=t[n]={i:n,l:!1,exports:{}};return e[n].call(s.exports,s,s.exports,o),s.l=!0,s.exports}return o.m=e,o.c=t,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)o.d(n,s,function(t){return e[t]}.bind(null,s));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="",o(o.s="./src/index.js")}({"./node_modules/@fdaciuk/ajax/dist/ajax.min.js":
/*!*****************************************************!*\
  !*** ./node_modules/@fdaciuk/ajax/dist/ajax.min.js ***!
  \*****************************************************/
/*! no static exports found */function(e,t,o){var n,s;
/**!
 * ajax - v2.3.0
 * Ajax module in Vanilla JS
 * https://github.com/fdaciuk/ajax

 * Sun Jul 23 2017 10:55:09 GMT-0300 (BRT)
 * MIT (c) Fernando Daciuk
*/!function(a,r){"use strict";void 0===(s="function"==typeof(n=function(){function e(e){return e||null}function t(e,t,s,r){var l=["then","catch","always"].reduce(function(e,t){return e[t]=function(o){return e[t]=o,e},e},{}),i=new XMLHttpRequest,u=function(e,t,o){if("get"!==o.toLowerCase()||!t)return e;var n=a(t),s=e.indexOf("?")>-1?"&":"?";return e+s+n}(t,s,e);return i.open(e,u,!0),i.withCredentials=r.hasOwnProperty("withCredentials"),o(i,r.headers),i.addEventListener("readystatechange",n(l,i),!1),i.send(a(s)),l.abort=function(){return i.abort()},l}function o(e,t){(function(e){return Object.keys(e).some(function(e){return"content-type"===e.toLowerCase()})})(t=t||{})||(t["Content-Type"]="application/x-www-form-urlencoded"),Object.keys(t).forEach(function(o){t[o]&&e.setRequestHeader(o,t[o])})}function n(e,t){return function o(){t.readyState===t.DONE&&(t.removeEventListener("readystatechange",o,!1),e.always.apply(e,s(t)),t.status>=200&&t.status<300?e.then.apply(e,s(t)):e.catch.apply(e,s(t)))}}function s(e){var t;try{t=JSON.parse(e.responseText)}catch(o){t=e.responseText}return[t,e]}function a(e){return function(e){return"[object Object]"===Object.prototype.toString.call(e)}(e)?function(e){return Object.keys(e).reduce(function(t,o){var n=t?t+"&":"";return n+r(o)+"="+r(e[o])},"")}(e):e}function r(e){return encodeURIComponent(e)}return function(o){return(o=o||{}).baseUrl=o.baseUrl||"",o.method&&o.url?t(o.method,o.baseUrl+o.url,e(o.data),o):["get","post","put","delete"].reduce(function(n,s){return n[s]=function(n,a){return t(s,o.baseUrl+n,e(a),o)},n},{})}})?n.call(t,o,t,e):n)||(e.exports=s)}()},"./node_modules/lodash/_DataView.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_DataView.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getNative */"./node_modules/lodash/_getNative.js")(o(/*! ./_root */"./node_modules/lodash/_root.js"),"DataView");e.exports=n},"./node_modules/lodash/_Hash.js":
/*!**************************************!*\
  !*** ./node_modules/lodash/_Hash.js ***!
  \**************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_hashClear */"./node_modules/lodash/_hashClear.js"),s=o(/*! ./_hashDelete */"./node_modules/lodash/_hashDelete.js"),a=o(/*! ./_hashGet */"./node_modules/lodash/_hashGet.js"),r=o(/*! ./_hashHas */"./node_modules/lodash/_hashHas.js"),l=o(/*! ./_hashSet */"./node_modules/lodash/_hashSet.js");function i(e){var t=-1,o=null==e?0:e.length;for(this.clear();++t<o;){var n=e[t];this.set(n[0],n[1])}}i.prototype.clear=n,i.prototype.delete=s,i.prototype.get=a,i.prototype.has=r,i.prototype.set=l,e.exports=i},"./node_modules/lodash/_ListCache.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_ListCache.js ***!
  \*******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_listCacheClear */"./node_modules/lodash/_listCacheClear.js"),s=o(/*! ./_listCacheDelete */"./node_modules/lodash/_listCacheDelete.js"),a=o(/*! ./_listCacheGet */"./node_modules/lodash/_listCacheGet.js"),r=o(/*! ./_listCacheHas */"./node_modules/lodash/_listCacheHas.js"),l=o(/*! ./_listCacheSet */"./node_modules/lodash/_listCacheSet.js");function i(e){var t=-1,o=null==e?0:e.length;for(this.clear();++t<o;){var n=e[t];this.set(n[0],n[1])}}i.prototype.clear=n,i.prototype.delete=s,i.prototype.get=a,i.prototype.has=r,i.prototype.set=l,e.exports=i},"./node_modules/lodash/_Map.js":
/*!*************************************!*\
  !*** ./node_modules/lodash/_Map.js ***!
  \*************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getNative */"./node_modules/lodash/_getNative.js")(o(/*! ./_root */"./node_modules/lodash/_root.js"),"Map");e.exports=n},"./node_modules/lodash/_MapCache.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_MapCache.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_mapCacheClear */"./node_modules/lodash/_mapCacheClear.js"),s=o(/*! ./_mapCacheDelete */"./node_modules/lodash/_mapCacheDelete.js"),a=o(/*! ./_mapCacheGet */"./node_modules/lodash/_mapCacheGet.js"),r=o(/*! ./_mapCacheHas */"./node_modules/lodash/_mapCacheHas.js"),l=o(/*! ./_mapCacheSet */"./node_modules/lodash/_mapCacheSet.js");function i(e){var t=-1,o=null==e?0:e.length;for(this.clear();++t<o;){var n=e[t];this.set(n[0],n[1])}}i.prototype.clear=n,i.prototype.delete=s,i.prototype.get=a,i.prototype.has=r,i.prototype.set=l,e.exports=i},"./node_modules/lodash/_Promise.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_Promise.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getNative */"./node_modules/lodash/_getNative.js")(o(/*! ./_root */"./node_modules/lodash/_root.js"),"Promise");e.exports=n},"./node_modules/lodash/_Set.js":
/*!*************************************!*\
  !*** ./node_modules/lodash/_Set.js ***!
  \*************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getNative */"./node_modules/lodash/_getNative.js")(o(/*! ./_root */"./node_modules/lodash/_root.js"),"Set");e.exports=n},"./node_modules/lodash/_SetCache.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_SetCache.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_MapCache */"./node_modules/lodash/_MapCache.js"),s=o(/*! ./_setCacheAdd */"./node_modules/lodash/_setCacheAdd.js"),a=o(/*! ./_setCacheHas */"./node_modules/lodash/_setCacheHas.js");function r(e){var t=-1,o=null==e?0:e.length;for(this.__data__=new n;++t<o;)this.add(e[t])}r.prototype.add=r.prototype.push=s,r.prototype.has=a,e.exports=r},"./node_modules/lodash/_Stack.js":
/*!***************************************!*\
  !*** ./node_modules/lodash/_Stack.js ***!
  \***************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_ListCache */"./node_modules/lodash/_ListCache.js"),s=o(/*! ./_stackClear */"./node_modules/lodash/_stackClear.js"),a=o(/*! ./_stackDelete */"./node_modules/lodash/_stackDelete.js"),r=o(/*! ./_stackGet */"./node_modules/lodash/_stackGet.js"),l=o(/*! ./_stackHas */"./node_modules/lodash/_stackHas.js"),i=o(/*! ./_stackSet */"./node_modules/lodash/_stackSet.js");function u(e){var t=this.__data__=new n(e);this.size=t.size}u.prototype.clear=s,u.prototype.delete=a,u.prototype.get=r,u.prototype.has=l,u.prototype.set=i,e.exports=u},"./node_modules/lodash/_Symbol.js":
/*!****************************************!*\
  !*** ./node_modules/lodash/_Symbol.js ***!
  \****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_root */"./node_modules/lodash/_root.js").Symbol;e.exports=n},"./node_modules/lodash/_Uint8Array.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_Uint8Array.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_root */"./node_modules/lodash/_root.js").Uint8Array;e.exports=n},"./node_modules/lodash/_WeakMap.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_WeakMap.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getNative */"./node_modules/lodash/_getNative.js")(o(/*! ./_root */"./node_modules/lodash/_root.js"),"WeakMap");e.exports=n},"./node_modules/lodash/_arrayEach.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_arrayEach.js ***!
  \*******************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){for(var o=-1,n=null==e?0:e.length;++o<n&&!1!==t(e[o],o,e););return e}},"./node_modules/lodash/_arrayFilter.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_arrayFilter.js ***!
  \*********************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){for(var o=-1,n=null==e?0:e.length,s=0,a=[];++o<n;){var r=e[o];t(r,o,e)&&(a[s++]=r)}return a}},"./node_modules/lodash/_arrayIncludes.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_arrayIncludes.js ***!
  \***********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseIndexOf */"./node_modules/lodash/_baseIndexOf.js");e.exports=function(e,t){return!(null==e||!e.length)&&n(e,t,0)>-1}},"./node_modules/lodash/_arrayIncludesWith.js":
/*!***************************************************!*\
  !*** ./node_modules/lodash/_arrayIncludesWith.js ***!
  \***************************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t,o){for(var n=-1,s=null==e?0:e.length;++n<s;)if(o(t,e[n]))return!0;return!1}},"./node_modules/lodash/_arrayLikeKeys.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_arrayLikeKeys.js ***!
  \***********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseTimes */"./node_modules/lodash/_baseTimes.js"),s=o(/*! ./isArguments */"./node_modules/lodash/isArguments.js"),a=o(/*! ./isArray */"./node_modules/lodash/isArray.js"),r=o(/*! ./isBuffer */"./node_modules/lodash/isBuffer.js"),l=o(/*! ./_isIndex */"./node_modules/lodash/_isIndex.js"),i=o(/*! ./isTypedArray */"./node_modules/lodash/isTypedArray.js"),u=Object.prototype.hasOwnProperty;e.exports=function(e,t){var o=a(e),c=!o&&s(e),d=!o&&!c&&r(e),h=!o&&!c&&!d&&i(e),f=o||c||d||h,p=f?n(e.length,String):[],_=p.length;for(var m in e)!t&&!u.call(e,m)||f&&("length"==m||d&&("offset"==m||"parent"==m)||h&&("buffer"==m||"byteLength"==m||"byteOffset"==m)||l(m,_))||p.push(m);return p}},"./node_modules/lodash/_arrayMap.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_arrayMap.js ***!
  \******************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){for(var o=-1,n=null==e?0:e.length,s=Array(n);++o<n;)s[o]=t(e[o],o,e);return s}},"./node_modules/lodash/_arrayPush.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_arrayPush.js ***!
  \*******************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){for(var o=-1,n=t.length,s=e.length;++o<n;)e[s+o]=t[o];return e}},"./node_modules/lodash/_arraySome.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_arraySome.js ***!
  \*******************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){for(var o=-1,n=null==e?0:e.length;++o<n;)if(t(e[o],o,e))return!0;return!1}},"./node_modules/lodash/_assignValue.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_assignValue.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseAssignValue */"./node_modules/lodash/_baseAssignValue.js"),s=o(/*! ./eq */"./node_modules/lodash/eq.js"),a=Object.prototype.hasOwnProperty;e.exports=function(e,t,o){var r=e[t];a.call(e,t)&&s(r,o)&&(void 0!==o||t in e)||n(e,t,o)}},"./node_modules/lodash/_assocIndexOf.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_assocIndexOf.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./eq */"./node_modules/lodash/eq.js");e.exports=function(e,t){for(var o=e.length;o--;)if(n(e[o][0],t))return o;return-1}},"./node_modules/lodash/_baseAssign.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_baseAssign.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_copyObject */"./node_modules/lodash/_copyObject.js"),s=o(/*! ./keys */"./node_modules/lodash/keys.js");e.exports=function(e,t){return e&&n(t,s(t),e)}},"./node_modules/lodash/_baseAssignIn.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_baseAssignIn.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_copyObject */"./node_modules/lodash/_copyObject.js"),s=o(/*! ./keysIn */"./node_modules/lodash/keysIn.js");e.exports=function(e,t){return e&&n(t,s(t),e)}},"./node_modules/lodash/_baseAssignValue.js":
/*!*************************************************!*\
  !*** ./node_modules/lodash/_baseAssignValue.js ***!
  \*************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_defineProperty */"./node_modules/lodash/_defineProperty.js");e.exports=function(e,t,o){"__proto__"==t&&n?n(e,t,{configurable:!0,enumerable:!0,value:o,writable:!0}):e[t]=o}},"./node_modules/lodash/_baseClone.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_baseClone.js ***!
  \*******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Stack */"./node_modules/lodash/_Stack.js"),s=o(/*! ./_arrayEach */"./node_modules/lodash/_arrayEach.js"),a=o(/*! ./_assignValue */"./node_modules/lodash/_assignValue.js"),r=o(/*! ./_baseAssign */"./node_modules/lodash/_baseAssign.js"),l=o(/*! ./_baseAssignIn */"./node_modules/lodash/_baseAssignIn.js"),i=o(/*! ./_cloneBuffer */"./node_modules/lodash/_cloneBuffer.js"),u=o(/*! ./_copyArray */"./node_modules/lodash/_copyArray.js"),c=o(/*! ./_copySymbols */"./node_modules/lodash/_copySymbols.js"),d=o(/*! ./_copySymbolsIn */"./node_modules/lodash/_copySymbolsIn.js"),h=o(/*! ./_getAllKeys */"./node_modules/lodash/_getAllKeys.js"),f=o(/*! ./_getAllKeysIn */"./node_modules/lodash/_getAllKeysIn.js"),p=o(/*! ./_getTag */"./node_modules/lodash/_getTag.js"),_=o(/*! ./_initCloneArray */"./node_modules/lodash/_initCloneArray.js"),m=o(/*! ./_initCloneByTag */"./node_modules/lodash/_initCloneByTag.js"),y=o(/*! ./_initCloneObject */"./node_modules/lodash/_initCloneObject.js"),v=o(/*! ./isArray */"./node_modules/lodash/isArray.js"),j=o(/*! ./isBuffer */"./node_modules/lodash/isBuffer.js"),b=o(/*! ./isMap */"./node_modules/lodash/isMap.js"),g=o(/*! ./isObject */"./node_modules/lodash/isObject.js"),w=o(/*! ./isSet */"./node_modules/lodash/isSet.js"),S=o(/*! ./keys */"./node_modules/lodash/keys.js"),k=1,O=2,x=4,C="[object Arguments]",A="[object Function]",E="[object GeneratorFunction]",P="[object Object]",T={};T[C]=T["[object Array]"]=T["[object ArrayBuffer]"]=T["[object DataView]"]=T["[object Boolean]"]=T["[object Date]"]=T["[object Float32Array]"]=T["[object Float64Array]"]=T["[object Int8Array]"]=T["[object Int16Array]"]=T["[object Int32Array]"]=T["[object Map]"]=T["[object Number]"]=T[P]=T["[object RegExp]"]=T["[object Set]"]=T["[object String]"]=T["[object Symbol]"]=T["[object Uint8Array]"]=T["[object Uint8ClampedArray]"]=T["[object Uint16Array]"]=T["[object Uint32Array]"]=!0,T["[object Error]"]=T[A]=T["[object WeakMap]"]=!1,e.exports=function e(t,o,I,L,V,D){var M,N=o&k,F=o&O,U=o&x;if(I&&(M=V?I(t,L,V,D):I(t)),void 0!==M)return M;if(!g(t))return t;var q=v(t);if(q){if(M=_(t),!N)return u(t,M)}else{var B=p(t),K=B==A||B==E;if(j(t))return i(t,N);if(B==P||B==C||K&&!V){if(M=F||K?{}:y(t),!N)return F?d(t,l(M,t)):c(t,r(M,t))}else{if(!T[B])return V?t:{};M=m(t,B,N)}}D||(D=new n);var H=D.get(t);if(H)return H;if(D.set(t,M),w(t))return t.forEach(function(n){M.add(e(n,o,I,n,t,D))}),M;if(b(t))return t.forEach(function(n,s){M.set(s,e(n,o,I,s,t,D))}),M;var R=U?F?f:h:F?keysIn:S,G=q?void 0:R(t);return s(G||t,function(n,s){G&&(n=t[s=n]),a(M,s,e(n,o,I,s,t,D))}),M}},"./node_modules/lodash/_baseCreate.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_baseCreate.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./isObject */"./node_modules/lodash/isObject.js"),s=Object.create,a=function(){function e(){}return function(t){if(!n(t))return{};if(s)return s(t);e.prototype=t;var o=new e;return e.prototype=void 0,o}}();e.exports=a},"./node_modules/lodash/_baseEach.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_baseEach.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseForOwn */"./node_modules/lodash/_baseForOwn.js"),s=o(/*! ./_createBaseEach */"./node_modules/lodash/_createBaseEach.js")(n);e.exports=s},"./node_modules/lodash/_baseFindIndex.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_baseFindIndex.js ***!
  \***********************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t,o,n){for(var s=e.length,a=o+(n?1:-1);n?a--:++a<s;)if(t(e[a],a,e))return a;return-1}},"./node_modules/lodash/_baseFlatten.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_baseFlatten.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_arrayPush */"./node_modules/lodash/_arrayPush.js"),s=o(/*! ./_isFlattenable */"./node_modules/lodash/_isFlattenable.js");e.exports=function e(t,o,a,r,l){var i=-1,u=t.length;for(a||(a=s),l||(l=[]);++i<u;){var c=t[i];o>0&&a(c)?o>1?e(c,o-1,a,r,l):n(l,c):r||(l[l.length]=c)}return l}},"./node_modules/lodash/_baseFor.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_baseFor.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_createBaseFor */"./node_modules/lodash/_createBaseFor.js")();e.exports=n},"./node_modules/lodash/_baseForOwn.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_baseForOwn.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseFor */"./node_modules/lodash/_baseFor.js"),s=o(/*! ./keys */"./node_modules/lodash/keys.js");e.exports=function(e,t){return e&&n(e,t,s)}},"./node_modules/lodash/_baseGet.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_baseGet.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_castPath */"./node_modules/lodash/_castPath.js"),s=o(/*! ./_toKey */"./node_modules/lodash/_toKey.js");e.exports=function(e,t){for(var o=0,a=(t=n(t,e)).length;null!=e&&o<a;)e=e[s(t[o++])];return o&&o==a?e:void 0}},"./node_modules/lodash/_baseGetAllKeys.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_baseGetAllKeys.js ***!
  \************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_arrayPush */"./node_modules/lodash/_arrayPush.js"),s=o(/*! ./isArray */"./node_modules/lodash/isArray.js");e.exports=function(e,t,o){var a=t(e);return s(e)?a:n(a,o(e))}},"./node_modules/lodash/_baseGetTag.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_baseGetTag.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Symbol */"./node_modules/lodash/_Symbol.js"),s=o(/*! ./_getRawTag */"./node_modules/lodash/_getRawTag.js"),a=o(/*! ./_objectToString */"./node_modules/lodash/_objectToString.js"),r="[object Null]",l="[object Undefined]",i=n?n.toStringTag:void 0;e.exports=function(e){return null==e?void 0===e?l:r:i&&i in Object(e)?s(e):a(e)}},"./node_modules/lodash/_baseHas.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_baseHas.js ***!
  \*****************************************/
/*! no static exports found */function(e,t){var o=Object.prototype.hasOwnProperty;e.exports=function(e,t){return null!=e&&o.call(e,t)}},"./node_modules/lodash/_baseHasIn.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_baseHasIn.js ***!
  \*******************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){return null!=e&&t in Object(e)}},"./node_modules/lodash/_baseIndexOf.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_baseIndexOf.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseFindIndex */"./node_modules/lodash/_baseFindIndex.js"),s=o(/*! ./_baseIsNaN */"./node_modules/lodash/_baseIsNaN.js"),a=o(/*! ./_strictIndexOf */"./node_modules/lodash/_strictIndexOf.js");e.exports=function(e,t,o){return t==t?a(e,t,o):n(e,s,o)}},"./node_modules/lodash/_baseIsArguments.js":
/*!*************************************************!*\
  !*** ./node_modules/lodash/_baseIsArguments.js ***!
  \*************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseGetTag */"./node_modules/lodash/_baseGetTag.js"),s=o(/*! ./isObjectLike */"./node_modules/lodash/isObjectLike.js"),a="[object Arguments]";e.exports=function(e){return s(e)&&n(e)==a}},"./node_modules/lodash/_baseIsEqual.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_baseIsEqual.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseIsEqualDeep */"./node_modules/lodash/_baseIsEqualDeep.js"),s=o(/*! ./isObjectLike */"./node_modules/lodash/isObjectLike.js");e.exports=function e(t,o,a,r,l){return t===o||(null==t||null==o||!s(t)&&!s(o)?t!=t&&o!=o:n(t,o,a,r,e,l))}},"./node_modules/lodash/_baseIsEqualDeep.js":
/*!*************************************************!*\
  !*** ./node_modules/lodash/_baseIsEqualDeep.js ***!
  \*************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Stack */"./node_modules/lodash/_Stack.js"),s=o(/*! ./_equalArrays */"./node_modules/lodash/_equalArrays.js"),a=o(/*! ./_equalByTag */"./node_modules/lodash/_equalByTag.js"),r=o(/*! ./_equalObjects */"./node_modules/lodash/_equalObjects.js"),l=o(/*! ./_getTag */"./node_modules/lodash/_getTag.js"),i=o(/*! ./isArray */"./node_modules/lodash/isArray.js"),u=o(/*! ./isBuffer */"./node_modules/lodash/isBuffer.js"),c=o(/*! ./isTypedArray */"./node_modules/lodash/isTypedArray.js"),d=1,h="[object Arguments]",f="[object Array]",p="[object Object]",_=Object.prototype.hasOwnProperty;e.exports=function(e,t,o,m,y,v){var j=i(e),b=i(t),g=j?f:l(e),w=b?f:l(t),S=(g=g==h?p:g)==p,k=(w=w==h?p:w)==p,O=g==w;if(O&&u(e)){if(!u(t))return!1;j=!0,S=!1}if(O&&!S)return v||(v=new n),j||c(e)?s(e,t,o,m,y,v):a(e,t,g,o,m,y,v);if(!(o&d)){var x=S&&_.call(e,"__wrapped__"),C=k&&_.call(t,"__wrapped__");if(x||C){var A=x?e.value():e,E=C?t.value():t;return v||(v=new n),y(A,E,o,m,v)}}return!!O&&(v||(v=new n),r(e,t,o,m,y,v))}},"./node_modules/lodash/_baseIsMap.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_baseIsMap.js ***!
  \*******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getTag */"./node_modules/lodash/_getTag.js"),s=o(/*! ./isObjectLike */"./node_modules/lodash/isObjectLike.js"),a="[object Map]";e.exports=function(e){return s(e)&&n(e)==a}},"./node_modules/lodash/_baseIsMatch.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_baseIsMatch.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Stack */"./node_modules/lodash/_Stack.js"),s=o(/*! ./_baseIsEqual */"./node_modules/lodash/_baseIsEqual.js"),a=1,r=2;e.exports=function(e,t,o,l){var i=o.length,u=i,c=!l;if(null==e)return!u;for(e=Object(e);i--;){var d=o[i];if(c&&d[2]?d[1]!==e[d[0]]:!(d[0]in e))return!1}for(;++i<u;){var h=(d=o[i])[0],f=e[h],p=d[1];if(c&&d[2]){if(void 0===f&&!(h in e))return!1}else{var _=new n;if(l)var m=l(f,p,h,e,t,_);if(!(void 0===m?s(p,f,a|r,l,_):m))return!1}}return!0}},"./node_modules/lodash/_baseIsNaN.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_baseIsNaN.js ***!
  \*******************************************/
/*! no static exports found */function(e,t){e.exports=function(e){return e!=e}},"./node_modules/lodash/_baseIsNative.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_baseIsNative.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./isFunction */"./node_modules/lodash/isFunction.js"),s=o(/*! ./_isMasked */"./node_modules/lodash/_isMasked.js"),a=o(/*! ./isObject */"./node_modules/lodash/isObject.js"),r=o(/*! ./_toSource */"./node_modules/lodash/_toSource.js"),l=/^\[object .+?Constructor\]$/,i=Function.prototype,u=Object.prototype,c=i.toString,d=u.hasOwnProperty,h=RegExp("^"+c.call(d).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");e.exports=function(e){return!(!a(e)||s(e))&&(n(e)?h:l).test(r(e))}},"./node_modules/lodash/_baseIsSet.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_baseIsSet.js ***!
  \*******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getTag */"./node_modules/lodash/_getTag.js"),s=o(/*! ./isObjectLike */"./node_modules/lodash/isObjectLike.js"),a="[object Set]";e.exports=function(e){return s(e)&&n(e)==a}},"./node_modules/lodash/_baseIsTypedArray.js":
/*!**************************************************!*\
  !*** ./node_modules/lodash/_baseIsTypedArray.js ***!
  \**************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseGetTag */"./node_modules/lodash/_baseGetTag.js"),s=o(/*! ./isLength */"./node_modules/lodash/isLength.js"),a=o(/*! ./isObjectLike */"./node_modules/lodash/isObjectLike.js"),r={};r["[object Float32Array]"]=r["[object Float64Array]"]=r["[object Int8Array]"]=r["[object Int16Array]"]=r["[object Int32Array]"]=r["[object Uint8Array]"]=r["[object Uint8ClampedArray]"]=r["[object Uint16Array]"]=r["[object Uint32Array]"]=!0,r["[object Arguments]"]=r["[object Array]"]=r["[object ArrayBuffer]"]=r["[object Boolean]"]=r["[object DataView]"]=r["[object Date]"]=r["[object Error]"]=r["[object Function]"]=r["[object Map]"]=r["[object Number]"]=r["[object Object]"]=r["[object RegExp]"]=r["[object Set]"]=r["[object String]"]=r["[object WeakMap]"]=!1,e.exports=function(e){return a(e)&&s(e.length)&&!!r[n(e)]}},"./node_modules/lodash/_baseIteratee.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_baseIteratee.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseMatches */"./node_modules/lodash/_baseMatches.js"),s=o(/*! ./_baseMatchesProperty */"./node_modules/lodash/_baseMatchesProperty.js"),a=o(/*! ./identity */"./node_modules/lodash/identity.js"),r=o(/*! ./isArray */"./node_modules/lodash/isArray.js"),l=o(/*! ./property */"./node_modules/lodash/property.js");e.exports=function(e){return"function"==typeof e?e:null==e?a:"object"==typeof e?r(e)?s(e[0],e[1]):n(e):l(e)}},"./node_modules/lodash/_baseKeys.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_baseKeys.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_isPrototype */"./node_modules/lodash/_isPrototype.js"),s=o(/*! ./_nativeKeys */"./node_modules/lodash/_nativeKeys.js"),a=Object.prototype.hasOwnProperty;e.exports=function(e){if(!n(e))return s(e);var t=[];for(var o in Object(e))a.call(e,o)&&"constructor"!=o&&t.push(o);return t}},"./node_modules/lodash/_baseKeysIn.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_baseKeysIn.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./isObject */"./node_modules/lodash/isObject.js"),s=o(/*! ./_isPrototype */"./node_modules/lodash/_isPrototype.js"),a=o(/*! ./_nativeKeysIn */"./node_modules/lodash/_nativeKeysIn.js"),r=Object.prototype.hasOwnProperty;e.exports=function(e){if(!n(e))return a(e);var t=s(e),o=[];for(var l in e)("constructor"!=l||!t&&r.call(e,l))&&o.push(l);return o}},"./node_modules/lodash/_baseMatches.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_baseMatches.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseIsMatch */"./node_modules/lodash/_baseIsMatch.js"),s=o(/*! ./_getMatchData */"./node_modules/lodash/_getMatchData.js"),a=o(/*! ./_matchesStrictComparable */"./node_modules/lodash/_matchesStrictComparable.js");e.exports=function(e){var t=s(e);return 1==t.length&&t[0][2]?a(t[0][0],t[0][1]):function(o){return o===e||n(o,e,t)}}},"./node_modules/lodash/_baseMatchesProperty.js":
/*!*****************************************************!*\
  !*** ./node_modules/lodash/_baseMatchesProperty.js ***!
  \*****************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseIsEqual */"./node_modules/lodash/_baseIsEqual.js"),s=o(/*! ./get */"./node_modules/lodash/get.js"),a=o(/*! ./hasIn */"./node_modules/lodash/hasIn.js"),r=o(/*! ./_isKey */"./node_modules/lodash/_isKey.js"),l=o(/*! ./_isStrictComparable */"./node_modules/lodash/_isStrictComparable.js"),i=o(/*! ./_matchesStrictComparable */"./node_modules/lodash/_matchesStrictComparable.js"),u=o(/*! ./_toKey */"./node_modules/lodash/_toKey.js"),c=1,d=2;e.exports=function(e,t){return r(e)&&l(t)?i(u(e),t):function(o){var r=s(o,e);return void 0===r&&r===t?a(o,e):n(t,r,c|d)}}},"./node_modules/lodash/_baseProperty.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_baseProperty.js ***!
  \**********************************************/
/*! no static exports found */function(e,t){e.exports=function(e){return function(t){return null==t?void 0:t[e]}}},"./node_modules/lodash/_basePropertyDeep.js":
/*!**************************************************!*\
  !*** ./node_modules/lodash/_basePropertyDeep.js ***!
  \**************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseGet */"./node_modules/lodash/_baseGet.js");e.exports=function(e){return function(t){return n(t,e)}}},"./node_modules/lodash/_baseSome.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_baseSome.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseEach */"./node_modules/lodash/_baseEach.js");e.exports=function(e,t){var o;return n(e,function(e,n,s){return!(o=t(e,n,s))}),!!o}},"./node_modules/lodash/_baseTimes.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_baseTimes.js ***!
  \*******************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){for(var o=-1,n=Array(e);++o<e;)n[o]=t(o);return n}},"./node_modules/lodash/_baseToString.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_baseToString.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Symbol */"./node_modules/lodash/_Symbol.js"),s=o(/*! ./_arrayMap */"./node_modules/lodash/_arrayMap.js"),a=o(/*! ./isArray */"./node_modules/lodash/isArray.js"),r=o(/*! ./isSymbol */"./node_modules/lodash/isSymbol.js"),l=1/0,i=n?n.prototype:void 0,u=i?i.toString:void 0;e.exports=function e(t){if("string"==typeof t)return t;if(a(t))return s(t,e)+"";if(r(t))return u?u.call(t):"";var o=t+"";return"0"==o&&1/t==-l?"-0":o}},"./node_modules/lodash/_baseUnary.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_baseUnary.js ***!
  \*******************************************/
/*! no static exports found */function(e,t){e.exports=function(e){return function(t){return e(t)}}},"./node_modules/lodash/_baseUniq.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_baseUniq.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_SetCache */"./node_modules/lodash/_SetCache.js"),s=o(/*! ./_arrayIncludes */"./node_modules/lodash/_arrayIncludes.js"),a=o(/*! ./_arrayIncludesWith */"./node_modules/lodash/_arrayIncludesWith.js"),r=o(/*! ./_cacheHas */"./node_modules/lodash/_cacheHas.js"),l=o(/*! ./_createSet */"./node_modules/lodash/_createSet.js"),i=o(/*! ./_setToArray */"./node_modules/lodash/_setToArray.js"),u=200;e.exports=function(e,t,o){var c=-1,d=s,h=e.length,f=!0,p=[],_=p;if(o)f=!1,d=a;else if(h>=u){var m=t?null:l(e);if(m)return i(m);f=!1,d=r,_=new n}else _=t?[]:p;e:for(;++c<h;){var y=e[c],v=t?t(y):y;if(y=o||0!==y?y:0,f&&v==v){for(var j=_.length;j--;)if(_[j]===v)continue e;t&&_.push(v),p.push(y)}else d(_,v,o)||(_!==p&&_.push(v),p.push(y))}return p}},"./node_modules/lodash/_cacheHas.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_cacheHas.js ***!
  \******************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){return e.has(t)}},"./node_modules/lodash/_castPath.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_castPath.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./isArray */"./node_modules/lodash/isArray.js"),s=o(/*! ./_isKey */"./node_modules/lodash/_isKey.js"),a=o(/*! ./_stringToPath */"./node_modules/lodash/_stringToPath.js"),r=o(/*! ./toString */"./node_modules/lodash/toString.js");e.exports=function(e,t){return n(e)?e:s(e,t)?[e]:a(r(e))}},"./node_modules/lodash/_cloneArrayBuffer.js":
/*!**************************************************!*\
  !*** ./node_modules/lodash/_cloneArrayBuffer.js ***!
  \**************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Uint8Array */"./node_modules/lodash/_Uint8Array.js");e.exports=function(e){var t=new e.constructor(e.byteLength);return new n(t).set(new n(e)),t}},"./node_modules/lodash/_cloneBuffer.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_cloneBuffer.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){(function(e){var n=o(/*! ./_root */"./node_modules/lodash/_root.js"),s="object"==typeof t&&t&&!t.nodeType&&t,a=s&&"object"==typeof e&&e&&!e.nodeType&&e,r=a&&a.exports===s?n.Buffer:void 0,l=r?r.allocUnsafe:void 0;e.exports=function(e,t){if(t)return e.slice();var o=e.length,n=l?l(o):new e.constructor(o);return e.copy(n),n}}).call(this,o(/*! ./../webpack/buildin/module.js */"./node_modules/webpack/buildin/module.js")(e))},"./node_modules/lodash/_cloneDataView.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_cloneDataView.js ***!
  \***********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_cloneArrayBuffer */"./node_modules/lodash/_cloneArrayBuffer.js");e.exports=function(e,t){var o=t?n(e.buffer):e.buffer;return new e.constructor(o,e.byteOffset,e.byteLength)}},"./node_modules/lodash/_cloneRegExp.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_cloneRegExp.js ***!
  \*********************************************/
/*! no static exports found */function(e,t){var o=/\w*$/;e.exports=function(e){var t=new e.constructor(e.source,o.exec(e));return t.lastIndex=e.lastIndex,t}},"./node_modules/lodash/_cloneSymbol.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_cloneSymbol.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Symbol */"./node_modules/lodash/_Symbol.js"),s=n?n.prototype:void 0,a=s?s.valueOf:void 0;e.exports=function(e){return a?Object(a.call(e)):{}}},"./node_modules/lodash/_cloneTypedArray.js":
/*!*************************************************!*\
  !*** ./node_modules/lodash/_cloneTypedArray.js ***!
  \*************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_cloneArrayBuffer */"./node_modules/lodash/_cloneArrayBuffer.js");e.exports=function(e,t){var o=t?n(e.buffer):e.buffer;return new e.constructor(o,e.byteOffset,e.length)}},"./node_modules/lodash/_copyArray.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_copyArray.js ***!
  \*******************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){var o=-1,n=e.length;for(t||(t=Array(n));++o<n;)t[o]=e[o];return t}},"./node_modules/lodash/_copyObject.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_copyObject.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_assignValue */"./node_modules/lodash/_assignValue.js"),s=o(/*! ./_baseAssignValue */"./node_modules/lodash/_baseAssignValue.js");e.exports=function(e,t,o,a){var r=!o;o||(o={});for(var l=-1,i=t.length;++l<i;){var u=t[l],c=a?a(o[u],e[u],u,o,e):void 0;void 0===c&&(c=e[u]),r?s(o,u,c):n(o,u,c)}return o}},"./node_modules/lodash/_copySymbols.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_copySymbols.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_copyObject */"./node_modules/lodash/_copyObject.js"),s=o(/*! ./_getSymbols */"./node_modules/lodash/_getSymbols.js");e.exports=function(e,t){return n(e,s(e),t)}},"./node_modules/lodash/_copySymbolsIn.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_copySymbolsIn.js ***!
  \***********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_copyObject */"./node_modules/lodash/_copyObject.js"),s=o(/*! ./_getSymbolsIn */"./node_modules/lodash/_getSymbolsIn.js");e.exports=function(e,t){return n(e,s(e),t)}},"./node_modules/lodash/_coreJsData.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_coreJsData.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_root */"./node_modules/lodash/_root.js")["__core-js_shared__"];e.exports=n},"./node_modules/lodash/_createBaseEach.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_createBaseEach.js ***!
  \************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./isArrayLike */"./node_modules/lodash/isArrayLike.js");e.exports=function(e,t){return function(o,s){if(null==o)return o;if(!n(o))return e(o,s);for(var a=o.length,r=t?a:-1,l=Object(o);(t?r--:++r<a)&&!1!==s(l[r],r,l););return o}}},"./node_modules/lodash/_createBaseFor.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_createBaseFor.js ***!
  \***********************************************/
/*! no static exports found */function(e,t){e.exports=function(e){return function(t,o,n){for(var s=-1,a=Object(t),r=n(t),l=r.length;l--;){var i=r[e?l:++s];if(!1===o(a[i],i,a))break}return t}}},"./node_modules/lodash/_createSet.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_createSet.js ***!
  \*******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Set */"./node_modules/lodash/_Set.js"),s=o(/*! ./noop */"./node_modules/lodash/noop.js"),a=o(/*! ./_setToArray */"./node_modules/lodash/_setToArray.js"),r=n&&1/a(new n([,-0]))[1]==1/0?function(e){return new n(e)}:s;e.exports=r},"./node_modules/lodash/_defineProperty.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_defineProperty.js ***!
  \************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getNative */"./node_modules/lodash/_getNative.js"),s=function(){try{var e=n(Object,"defineProperty");return e({},"",{}),e}catch(e){}}();e.exports=s},"./node_modules/lodash/_equalArrays.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_equalArrays.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_SetCache */"./node_modules/lodash/_SetCache.js"),s=o(/*! ./_arraySome */"./node_modules/lodash/_arraySome.js"),a=o(/*! ./_cacheHas */"./node_modules/lodash/_cacheHas.js"),r=1,l=2;e.exports=function(e,t,o,i,u,c){var d=o&r,h=e.length,f=t.length;if(h!=f&&!(d&&f>h))return!1;var p=c.get(e);if(p&&c.get(t))return p==t;var _=-1,m=!0,y=o&l?new n:void 0;for(c.set(e,t),c.set(t,e);++_<h;){var v=e[_],j=t[_];if(i)var b=d?i(j,v,_,t,e,c):i(v,j,_,e,t,c);if(void 0!==b){if(b)continue;m=!1;break}if(y){if(!s(t,function(e,t){if(!a(y,t)&&(v===e||u(v,e,o,i,c)))return y.push(t)})){m=!1;break}}else if(v!==j&&!u(v,j,o,i,c)){m=!1;break}}return c.delete(e),c.delete(t),m}},"./node_modules/lodash/_equalByTag.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_equalByTag.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Symbol */"./node_modules/lodash/_Symbol.js"),s=o(/*! ./_Uint8Array */"./node_modules/lodash/_Uint8Array.js"),a=o(/*! ./eq */"./node_modules/lodash/eq.js"),r=o(/*! ./_equalArrays */"./node_modules/lodash/_equalArrays.js"),l=o(/*! ./_mapToArray */"./node_modules/lodash/_mapToArray.js"),i=o(/*! ./_setToArray */"./node_modules/lodash/_setToArray.js"),u=1,c=2,d="[object Boolean]",h="[object Date]",f="[object Error]",p="[object Map]",_="[object Number]",m="[object RegExp]",y="[object Set]",v="[object String]",j="[object Symbol]",b="[object ArrayBuffer]",g="[object DataView]",w=n?n.prototype:void 0,S=w?w.valueOf:void 0;e.exports=function(e,t,o,n,w,k,O){switch(o){case g:if(e.byteLength!=t.byteLength||e.byteOffset!=t.byteOffset)return!1;e=e.buffer,t=t.buffer;case b:return!(e.byteLength!=t.byteLength||!k(new s(e),new s(t)));case d:case h:case _:return a(+e,+t);case f:return e.name==t.name&&e.message==t.message;case m:case v:return e==t+"";case p:var x=l;case y:var C=n&u;if(x||(x=i),e.size!=t.size&&!C)return!1;var A=O.get(e);if(A)return A==t;n|=c,O.set(e,t);var E=r(x(e),x(t),n,w,k,O);return O.delete(e),E;case j:if(S)return S.call(e)==S.call(t)}return!1}},"./node_modules/lodash/_equalObjects.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_equalObjects.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getAllKeys */"./node_modules/lodash/_getAllKeys.js"),s=1,a=Object.prototype.hasOwnProperty;e.exports=function(e,t,o,r,l,i){var u=o&s,c=n(e),d=c.length;if(d!=n(t).length&&!u)return!1;for(var h=d;h--;){var f=c[h];if(!(u?f in t:a.call(t,f)))return!1}var p=i.get(e);if(p&&i.get(t))return p==t;var _=!0;i.set(e,t),i.set(t,e);for(var m=u;++h<d;){var y=e[f=c[h]],v=t[f];if(r)var j=u?r(v,y,f,t,e,i):r(y,v,f,e,t,i);if(!(void 0===j?y===v||l(y,v,o,r,i):j)){_=!1;break}m||(m="constructor"==f)}if(_&&!m){var b=e.constructor,g=t.constructor;b!=g&&"constructor"in e&&"constructor"in t&&!("function"==typeof b&&b instanceof b&&"function"==typeof g&&g instanceof g)&&(_=!1)}return i.delete(e),i.delete(t),_}},"./node_modules/lodash/_freeGlobal.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_freeGlobal.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){(function(t){var o="object"==typeof t&&t&&t.Object===Object&&t;e.exports=o}).call(this,o(/*! ./../webpack/buildin/global.js */"./node_modules/webpack/buildin/global.js"))},"./node_modules/lodash/_getAllKeys.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_getAllKeys.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseGetAllKeys */"./node_modules/lodash/_baseGetAllKeys.js"),s=o(/*! ./_getSymbols */"./node_modules/lodash/_getSymbols.js"),a=o(/*! ./keys */"./node_modules/lodash/keys.js");e.exports=function(e){return n(e,a,s)}},"./node_modules/lodash/_getAllKeysIn.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_getAllKeysIn.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseGetAllKeys */"./node_modules/lodash/_baseGetAllKeys.js"),s=o(/*! ./_getSymbolsIn */"./node_modules/lodash/_getSymbolsIn.js"),a=o(/*! ./keysIn */"./node_modules/lodash/keysIn.js");e.exports=function(e){return n(e,a,s)}},"./node_modules/lodash/_getMapData.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_getMapData.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_isKeyable */"./node_modules/lodash/_isKeyable.js");e.exports=function(e,t){var o=e.__data__;return n(t)?o["string"==typeof t?"string":"hash"]:o.map}},"./node_modules/lodash/_getMatchData.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_getMatchData.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_isStrictComparable */"./node_modules/lodash/_isStrictComparable.js"),s=o(/*! ./keys */"./node_modules/lodash/keys.js");e.exports=function(e){for(var t=s(e),o=t.length;o--;){var a=t[o],r=e[a];t[o]=[a,r,n(r)]}return t}},"./node_modules/lodash/_getNative.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_getNative.js ***!
  \*******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseIsNative */"./node_modules/lodash/_baseIsNative.js"),s=o(/*! ./_getValue */"./node_modules/lodash/_getValue.js");e.exports=function(e,t){var o=s(e,t);return n(o)?o:void 0}},"./node_modules/lodash/_getPrototype.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_getPrototype.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_overArg */"./node_modules/lodash/_overArg.js")(Object.getPrototypeOf,Object);e.exports=n},"./node_modules/lodash/_getRawTag.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_getRawTag.js ***!
  \*******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Symbol */"./node_modules/lodash/_Symbol.js"),s=Object.prototype,a=s.hasOwnProperty,r=s.toString,l=n?n.toStringTag:void 0;e.exports=function(e){var t=a.call(e,l),o=e[l];try{e[l]=void 0;var n=!0}catch(e){}var s=r.call(e);return n&&(t?e[l]=o:delete e[l]),s}},"./node_modules/lodash/_getSymbols.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_getSymbols.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_arrayFilter */"./node_modules/lodash/_arrayFilter.js"),s=o(/*! ./stubArray */"./node_modules/lodash/stubArray.js"),a=Object.prototype.propertyIsEnumerable,r=Object.getOwnPropertySymbols,l=r?function(e){return null==e?[]:(e=Object(e),n(r(e),function(t){return a.call(e,t)}))}:s;e.exports=l},"./node_modules/lodash/_getSymbolsIn.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_getSymbolsIn.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_arrayPush */"./node_modules/lodash/_arrayPush.js"),s=o(/*! ./_getPrototype */"./node_modules/lodash/_getPrototype.js"),a=o(/*! ./_getSymbols */"./node_modules/lodash/_getSymbols.js"),r=o(/*! ./stubArray */"./node_modules/lodash/stubArray.js"),l=Object.getOwnPropertySymbols?function(e){for(var t=[];e;)n(t,a(e)),e=s(e);return t}:r;e.exports=l},"./node_modules/lodash/_getTag.js":
/*!****************************************!*\
  !*** ./node_modules/lodash/_getTag.js ***!
  \****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_DataView */"./node_modules/lodash/_DataView.js"),s=o(/*! ./_Map */"./node_modules/lodash/_Map.js"),a=o(/*! ./_Promise */"./node_modules/lodash/_Promise.js"),r=o(/*! ./_Set */"./node_modules/lodash/_Set.js"),l=o(/*! ./_WeakMap */"./node_modules/lodash/_WeakMap.js"),i=o(/*! ./_baseGetTag */"./node_modules/lodash/_baseGetTag.js"),u=o(/*! ./_toSource */"./node_modules/lodash/_toSource.js"),c=u(n),d=u(s),h=u(a),f=u(r),p=u(l),_=i;(n&&"[object DataView]"!=_(new n(new ArrayBuffer(1)))||s&&"[object Map]"!=_(new s)||a&&"[object Promise]"!=_(a.resolve())||r&&"[object Set]"!=_(new r)||l&&"[object WeakMap]"!=_(new l))&&(_=function(e){var t=i(e),o="[object Object]"==t?e.constructor:void 0,n=o?u(o):"";if(n)switch(n){case c:return"[object DataView]";case d:return"[object Map]";case h:return"[object Promise]";case f:return"[object Set]";case p:return"[object WeakMap]"}return t}),e.exports=_},"./node_modules/lodash/_getValue.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_getValue.js ***!
  \******************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){return null==e?void 0:e[t]}},"./node_modules/lodash/_hasPath.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_hasPath.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_castPath */"./node_modules/lodash/_castPath.js"),s=o(/*! ./isArguments */"./node_modules/lodash/isArguments.js"),a=o(/*! ./isArray */"./node_modules/lodash/isArray.js"),r=o(/*! ./_isIndex */"./node_modules/lodash/_isIndex.js"),l=o(/*! ./isLength */"./node_modules/lodash/isLength.js"),i=o(/*! ./_toKey */"./node_modules/lodash/_toKey.js");e.exports=function(e,t,o){for(var u=-1,c=(t=n(t,e)).length,d=!1;++u<c;){var h=i(t[u]);if(!(d=null!=e&&o(e,h)))break;e=e[h]}return d||++u!=c?d:!!(c=null==e?0:e.length)&&l(c)&&r(h,c)&&(a(e)||s(e))}},"./node_modules/lodash/_hashClear.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_hashClear.js ***!
  \*******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_nativeCreate */"./node_modules/lodash/_nativeCreate.js");e.exports=function(){this.__data__=n?n(null):{},this.size=0}},"./node_modules/lodash/_hashDelete.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_hashDelete.js ***!
  \********************************************/
/*! no static exports found */function(e,t){e.exports=function(e){var t=this.has(e)&&delete this.__data__[e];return this.size-=t?1:0,t}},"./node_modules/lodash/_hashGet.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_hashGet.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_nativeCreate */"./node_modules/lodash/_nativeCreate.js"),s="__lodash_hash_undefined__",a=Object.prototype.hasOwnProperty;e.exports=function(e){var t=this.__data__;if(n){var o=t[e];return o===s?void 0:o}return a.call(t,e)?t[e]:void 0}},"./node_modules/lodash/_hashHas.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_hashHas.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_nativeCreate */"./node_modules/lodash/_nativeCreate.js"),s=Object.prototype.hasOwnProperty;e.exports=function(e){var t=this.__data__;return n?void 0!==t[e]:s.call(t,e)}},"./node_modules/lodash/_hashSet.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_hashSet.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_nativeCreate */"./node_modules/lodash/_nativeCreate.js"),s="__lodash_hash_undefined__";e.exports=function(e,t){var o=this.__data__;return this.size+=this.has(e)?0:1,o[e]=n&&void 0===t?s:t,this}},"./node_modules/lodash/_initCloneArray.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_initCloneArray.js ***!
  \************************************************/
/*! no static exports found */function(e,t){var o=Object.prototype.hasOwnProperty;e.exports=function(e){var t=e.length,n=new e.constructor(t);return t&&"string"==typeof e[0]&&o.call(e,"index")&&(n.index=e.index,n.input=e.input),n}},"./node_modules/lodash/_initCloneByTag.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_initCloneByTag.js ***!
  \************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_cloneArrayBuffer */"./node_modules/lodash/_cloneArrayBuffer.js"),s=o(/*! ./_cloneDataView */"./node_modules/lodash/_cloneDataView.js"),a=o(/*! ./_cloneRegExp */"./node_modules/lodash/_cloneRegExp.js"),r=o(/*! ./_cloneSymbol */"./node_modules/lodash/_cloneSymbol.js"),l=o(/*! ./_cloneTypedArray */"./node_modules/lodash/_cloneTypedArray.js"),i="[object Boolean]",u="[object Date]",c="[object Map]",d="[object Number]",h="[object RegExp]",f="[object Set]",p="[object String]",_="[object Symbol]",m="[object ArrayBuffer]",y="[object DataView]",v="[object Float32Array]",j="[object Float64Array]",b="[object Int8Array]",g="[object Int16Array]",w="[object Int32Array]",S="[object Uint8Array]",k="[object Uint8ClampedArray]",O="[object Uint16Array]",x="[object Uint32Array]";e.exports=function(e,t,o){var C=e.constructor;switch(t){case m:return n(e);case i:case u:return new C(+e);case y:return s(e,o);case v:case j:case b:case g:case w:case S:case k:case O:case x:return l(e,o);case c:return new C;case d:case p:return new C(e);case h:return a(e);case f:return new C;case _:return r(e)}}},"./node_modules/lodash/_initCloneObject.js":
/*!*************************************************!*\
  !*** ./node_modules/lodash/_initCloneObject.js ***!
  \*************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseCreate */"./node_modules/lodash/_baseCreate.js"),s=o(/*! ./_getPrototype */"./node_modules/lodash/_getPrototype.js"),a=o(/*! ./_isPrototype */"./node_modules/lodash/_isPrototype.js");e.exports=function(e){return"function"!=typeof e.constructor||a(e)?{}:n(s(e))}},"./node_modules/lodash/_isFlattenable.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_isFlattenable.js ***!
  \***********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Symbol */"./node_modules/lodash/_Symbol.js"),s=o(/*! ./isArguments */"./node_modules/lodash/isArguments.js"),a=o(/*! ./isArray */"./node_modules/lodash/isArray.js"),r=n?n.isConcatSpreadable:void 0;e.exports=function(e){return a(e)||s(e)||!!(r&&e&&e[r])}},"./node_modules/lodash/_isIndex.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_isIndex.js ***!
  \*****************************************/
/*! no static exports found */function(e,t){var o=9007199254740991,n=/^(?:0|[1-9]\d*)$/;e.exports=function(e,t){var s=typeof e;return!!(t=null==t?o:t)&&("number"==s||"symbol"!=s&&n.test(e))&&e>-1&&e%1==0&&e<t}},"./node_modules/lodash/_isIterateeCall.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_isIterateeCall.js ***!
  \************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./eq */"./node_modules/lodash/eq.js"),s=o(/*! ./isArrayLike */"./node_modules/lodash/isArrayLike.js"),a=o(/*! ./_isIndex */"./node_modules/lodash/_isIndex.js"),r=o(/*! ./isObject */"./node_modules/lodash/isObject.js");e.exports=function(e,t,o){if(!r(o))return!1;var l=typeof t;return!!("number"==l?s(o)&&a(t,o.length):"string"==l&&t in o)&&n(o[t],e)}},"./node_modules/lodash/_isKey.js":
/*!***************************************!*\
  !*** ./node_modules/lodash/_isKey.js ***!
  \***************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./isArray */"./node_modules/lodash/isArray.js"),s=o(/*! ./isSymbol */"./node_modules/lodash/isSymbol.js"),a=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,r=/^\w*$/;e.exports=function(e,t){if(n(e))return!1;var o=typeof e;return!("number"!=o&&"symbol"!=o&&"boolean"!=o&&null!=e&&!s(e))||r.test(e)||!a.test(e)||null!=t&&e in Object(t)}},"./node_modules/lodash/_isKeyable.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_isKeyable.js ***!
  \*******************************************/
/*! no static exports found */function(e,t){e.exports=function(e){var t=typeof e;return"string"==t||"number"==t||"symbol"==t||"boolean"==t?"__proto__"!==e:null===e}},"./node_modules/lodash/_isMasked.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_isMasked.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_coreJsData */"./node_modules/lodash/_coreJsData.js"),s=function(){var e=/[^.]+$/.exec(n&&n.keys&&n.keys.IE_PROTO||"");return e?"Symbol(src)_1."+e:""}();e.exports=function(e){return!!s&&s in e}},"./node_modules/lodash/_isPrototype.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_isPrototype.js ***!
  \*********************************************/
/*! no static exports found */function(e,t){var o=Object.prototype;e.exports=function(e){var t=e&&e.constructor;return e===("function"==typeof t&&t.prototype||o)}},"./node_modules/lodash/_isStrictComparable.js":
/*!****************************************************!*\
  !*** ./node_modules/lodash/_isStrictComparable.js ***!
  \****************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./isObject */"./node_modules/lodash/isObject.js");e.exports=function(e){return e==e&&!n(e)}},"./node_modules/lodash/_listCacheClear.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_listCacheClear.js ***!
  \************************************************/
/*! no static exports found */function(e,t){e.exports=function(){this.__data__=[],this.size=0}},"./node_modules/lodash/_listCacheDelete.js":
/*!*************************************************!*\
  !*** ./node_modules/lodash/_listCacheDelete.js ***!
  \*************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_assocIndexOf */"./node_modules/lodash/_assocIndexOf.js"),s=Array.prototype.splice;e.exports=function(e){var t=this.__data__,o=n(t,e);return!(o<0||(o==t.length-1?t.pop():s.call(t,o,1),--this.size,0))}},"./node_modules/lodash/_listCacheGet.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_listCacheGet.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_assocIndexOf */"./node_modules/lodash/_assocIndexOf.js");e.exports=function(e){var t=this.__data__,o=n(t,e);return o<0?void 0:t[o][1]}},"./node_modules/lodash/_listCacheHas.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_listCacheHas.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_assocIndexOf */"./node_modules/lodash/_assocIndexOf.js");e.exports=function(e){return n(this.__data__,e)>-1}},"./node_modules/lodash/_listCacheSet.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_listCacheSet.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_assocIndexOf */"./node_modules/lodash/_assocIndexOf.js");e.exports=function(e,t){var o=this.__data__,s=n(o,e);return s<0?(++this.size,o.push([e,t])):o[s][1]=t,this}},"./node_modules/lodash/_mapCacheClear.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_mapCacheClear.js ***!
  \***********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_Hash */"./node_modules/lodash/_Hash.js"),s=o(/*! ./_ListCache */"./node_modules/lodash/_ListCache.js"),a=o(/*! ./_Map */"./node_modules/lodash/_Map.js");e.exports=function(){this.size=0,this.__data__={hash:new n,map:new(a||s),string:new n}}},"./node_modules/lodash/_mapCacheDelete.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_mapCacheDelete.js ***!
  \************************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getMapData */"./node_modules/lodash/_getMapData.js");e.exports=function(e){var t=n(this,e).delete(e);return this.size-=t?1:0,t}},"./node_modules/lodash/_mapCacheGet.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_mapCacheGet.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getMapData */"./node_modules/lodash/_getMapData.js");e.exports=function(e){return n(this,e).get(e)}},"./node_modules/lodash/_mapCacheHas.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_mapCacheHas.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getMapData */"./node_modules/lodash/_getMapData.js");e.exports=function(e){return n(this,e).has(e)}},"./node_modules/lodash/_mapCacheSet.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_mapCacheSet.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getMapData */"./node_modules/lodash/_getMapData.js");e.exports=function(e,t){var o=n(this,e),s=o.size;return o.set(e,t),this.size+=o.size==s?0:1,this}},"./node_modules/lodash/_mapToArray.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_mapToArray.js ***!
  \********************************************/
/*! no static exports found */function(e,t){e.exports=function(e){var t=-1,o=Array(e.size);return e.forEach(function(e,n){o[++t]=[n,e]}),o}},"./node_modules/lodash/_matchesStrictComparable.js":
/*!*********************************************************!*\
  !*** ./node_modules/lodash/_matchesStrictComparable.js ***!
  \*********************************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){return function(o){return null!=o&&o[e]===t&&(void 0!==t||e in Object(o))}}},"./node_modules/lodash/_memoizeCapped.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_memoizeCapped.js ***!
  \***********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./memoize */"./node_modules/lodash/memoize.js"),s=500;e.exports=function(e){var t=n(e,function(e){return o.size===s&&o.clear(),e}),o=t.cache;return t}},"./node_modules/lodash/_nativeCreate.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_nativeCreate.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_getNative */"./node_modules/lodash/_getNative.js")(Object,"create");e.exports=n},"./node_modules/lodash/_nativeKeys.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_nativeKeys.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_overArg */"./node_modules/lodash/_overArg.js")(Object.keys,Object);e.exports=n},"./node_modules/lodash/_nativeKeysIn.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_nativeKeysIn.js ***!
  \**********************************************/
/*! no static exports found */function(e,t){e.exports=function(e){var t=[];if(null!=e)for(var o in Object(e))t.push(o);return t}},"./node_modules/lodash/_nodeUtil.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_nodeUtil.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){(function(e){var n=o(/*! ./_freeGlobal */"./node_modules/lodash/_freeGlobal.js"),s="object"==typeof t&&t&&!t.nodeType&&t,a=s&&"object"==typeof e&&e&&!e.nodeType&&e,r=a&&a.exports===s&&n.process,l=function(){try{var e=a&&a.require&&a.require("util").types;return e||r&&r.binding&&r.binding("util")}catch(e){}}();e.exports=l}).call(this,o(/*! ./../webpack/buildin/module.js */"./node_modules/webpack/buildin/module.js")(e))},"./node_modules/lodash/_objectToString.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_objectToString.js ***!
  \************************************************/
/*! no static exports found */function(e,t){var o=Object.prototype.toString;e.exports=function(e){return o.call(e)}},"./node_modules/lodash/_overArg.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_overArg.js ***!
  \*****************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){return function(o){return e(t(o))}}},"./node_modules/lodash/_root.js":
/*!**************************************!*\
  !*** ./node_modules/lodash/_root.js ***!
  \**************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_freeGlobal */"./node_modules/lodash/_freeGlobal.js"),s="object"==typeof self&&self&&self.Object===Object&&self,a=n||s||Function("return this")();e.exports=a},"./node_modules/lodash/_setCacheAdd.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_setCacheAdd.js ***!
  \*********************************************/
/*! no static exports found */function(e,t){var o="__lodash_hash_undefined__";e.exports=function(e){return this.__data__.set(e,o),this}},"./node_modules/lodash/_setCacheHas.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_setCacheHas.js ***!
  \*********************************************/
/*! no static exports found */function(e,t){e.exports=function(e){return this.__data__.has(e)}},"./node_modules/lodash/_setToArray.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_setToArray.js ***!
  \********************************************/
/*! no static exports found */function(e,t){e.exports=function(e){var t=-1,o=Array(e.size);return e.forEach(function(e){o[++t]=e}),o}},"./node_modules/lodash/_stackClear.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_stackClear.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_ListCache */"./node_modules/lodash/_ListCache.js");e.exports=function(){this.__data__=new n,this.size=0}},"./node_modules/lodash/_stackDelete.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_stackDelete.js ***!
  \*********************************************/
/*! no static exports found */function(e,t){e.exports=function(e){var t=this.__data__,o=t.delete(e);return this.size=t.size,o}},"./node_modules/lodash/_stackGet.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_stackGet.js ***!
  \******************************************/
/*! no static exports found */function(e,t){e.exports=function(e){return this.__data__.get(e)}},"./node_modules/lodash/_stackHas.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_stackHas.js ***!
  \******************************************/
/*! no static exports found */function(e,t){e.exports=function(e){return this.__data__.has(e)}},"./node_modules/lodash/_stackSet.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_stackSet.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_ListCache */"./node_modules/lodash/_ListCache.js"),s=o(/*! ./_Map */"./node_modules/lodash/_Map.js"),a=o(/*! ./_MapCache */"./node_modules/lodash/_MapCache.js"),r=200;e.exports=function(e,t){var o=this.__data__;if(o instanceof n){var l=o.__data__;if(!s||l.length<r-1)return l.push([e,t]),this.size=++o.size,this;o=this.__data__=new a(l)}return o.set(e,t),this.size=o.size,this}},"./node_modules/lodash/_strictIndexOf.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_strictIndexOf.js ***!
  \***********************************************/
/*! no static exports found */function(e,t){e.exports=function(e,t,o){for(var n=o-1,s=e.length;++n<s;)if(e[n]===t)return n;return-1}},"./node_modules/lodash/_stringToPath.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_stringToPath.js ***!
  \**********************************************/
/*! no static exports found */function(e,t,o){var n=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,s=/\\(\\)?/g,a=o(/*! ./_memoizeCapped */"./node_modules/lodash/_memoizeCapped.js")(function(e){var t=[];return 46===e.charCodeAt(0)&&t.push(""),e.replace(n,function(e,o,n,a){t.push(n?a.replace(s,"$1"):o||e)}),t});e.exports=a},"./node_modules/lodash/_toKey.js":
/*!***************************************!*\
  !*** ./node_modules/lodash/_toKey.js ***!
  \***************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./isSymbol */"./node_modules/lodash/isSymbol.js"),s=1/0;e.exports=function(e){if("string"==typeof e||n(e))return e;var t=e+"";return"0"==t&&1/e==-s?"-0":t}},"./node_modules/lodash/_toSource.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_toSource.js ***!
  \******************************************/
/*! no static exports found */function(e,t){var o=Function.prototype.toString;e.exports=function(e){if(null!=e){try{return o.call(e)}catch(e){}try{return e+""}catch(e){}}return""}},"./node_modules/lodash/cloneDeep.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/cloneDeep.js ***!
  \******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseClone */"./node_modules/lodash/_baseClone.js"),s=1,a=4;e.exports=function(e){return n(e,s|a)}},"./node_modules/lodash/eq.js":
/*!***********************************!*\
  !*** ./node_modules/lodash/eq.js ***!
  \***********************************/
/*! no static exports found */function(e,t){e.exports=function(e,t){return e===t||e!=e&&t!=t}},"./node_modules/lodash/flatten.js":
/*!****************************************!*\
  !*** ./node_modules/lodash/flatten.js ***!
  \****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseFlatten */"./node_modules/lodash/_baseFlatten.js");e.exports=function(e){return null!=e&&e.length?n(e,1):[]}},"./node_modules/lodash/get.js":
/*!************************************!*\
  !*** ./node_modules/lodash/get.js ***!
  \************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseGet */"./node_modules/lodash/_baseGet.js");e.exports=function(e,t,o){var s=null==e?void 0:n(e,t);return void 0===s?o:s}},"./node_modules/lodash/has.js":
/*!************************************!*\
  !*** ./node_modules/lodash/has.js ***!
  \************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseHas */"./node_modules/lodash/_baseHas.js"),s=o(/*! ./_hasPath */"./node_modules/lodash/_hasPath.js");e.exports=function(e,t){return null!=e&&s(e,t,n)}},"./node_modules/lodash/hasIn.js":
/*!**************************************!*\
  !*** ./node_modules/lodash/hasIn.js ***!
  \**************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseHasIn */"./node_modules/lodash/_baseHasIn.js"),s=o(/*! ./_hasPath */"./node_modules/lodash/_hasPath.js");e.exports=function(e,t){return null!=e&&s(e,t,n)}},"./node_modules/lodash/identity.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/identity.js ***!
  \*****************************************/
/*! no static exports found */function(e,t){e.exports=function(e){return e}},"./node_modules/lodash/isArguments.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/isArguments.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseIsArguments */"./node_modules/lodash/_baseIsArguments.js"),s=o(/*! ./isObjectLike */"./node_modules/lodash/isObjectLike.js"),a=Object.prototype,r=a.hasOwnProperty,l=a.propertyIsEnumerable,i=n(function(){return arguments}())?n:function(e){return s(e)&&r.call(e,"callee")&&!l.call(e,"callee")};e.exports=i},"./node_modules/lodash/isArray.js":
/*!****************************************!*\
  !*** ./node_modules/lodash/isArray.js ***!
  \****************************************/
/*! no static exports found */function(e,t){var o=Array.isArray;e.exports=o},"./node_modules/lodash/isArrayLike.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/isArrayLike.js ***!
  \********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./isFunction */"./node_modules/lodash/isFunction.js"),s=o(/*! ./isLength */"./node_modules/lodash/isLength.js");e.exports=function(e){return null!=e&&s(e.length)&&!n(e)}},"./node_modules/lodash/isBuffer.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/isBuffer.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){(function(e){var n=o(/*! ./_root */"./node_modules/lodash/_root.js"),s=o(/*! ./stubFalse */"./node_modules/lodash/stubFalse.js"),a="object"==typeof t&&t&&!t.nodeType&&t,r=a&&"object"==typeof e&&e&&!e.nodeType&&e,l=r&&r.exports===a?n.Buffer:void 0,i=(l?l.isBuffer:void 0)||s;e.exports=i}).call(this,o(/*! ./../webpack/buildin/module.js */"./node_modules/webpack/buildin/module.js")(e))},"./node_modules/lodash/isEqual.js":
/*!****************************************!*\
  !*** ./node_modules/lodash/isEqual.js ***!
  \****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseIsEqual */"./node_modules/lodash/_baseIsEqual.js");e.exports=function(e,t){return n(e,t)}},"./node_modules/lodash/isFunction.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/isFunction.js ***!
  \*******************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseGetTag */"./node_modules/lodash/_baseGetTag.js"),s=o(/*! ./isObject */"./node_modules/lodash/isObject.js"),a="[object AsyncFunction]",r="[object Function]",l="[object GeneratorFunction]",i="[object Proxy]";e.exports=function(e){if(!s(e))return!1;var t=n(e);return t==r||t==l||t==a||t==i}},"./node_modules/lodash/isLength.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/isLength.js ***!
  \*****************************************/
/*! no static exports found */function(e,t){var o=9007199254740991;e.exports=function(e){return"number"==typeof e&&e>-1&&e%1==0&&e<=o}},"./node_modules/lodash/isMap.js":
/*!**************************************!*\
  !*** ./node_modules/lodash/isMap.js ***!
  \**************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseIsMap */"./node_modules/lodash/_baseIsMap.js"),s=o(/*! ./_baseUnary */"./node_modules/lodash/_baseUnary.js"),a=o(/*! ./_nodeUtil */"./node_modules/lodash/_nodeUtil.js"),r=a&&a.isMap,l=r?s(r):n;e.exports=l},"./node_modules/lodash/isObject.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/isObject.js ***!
  \*****************************************/
/*! no static exports found */function(e,t){e.exports=function(e){var t=typeof e;return null!=e&&("object"==t||"function"==t)}},"./node_modules/lodash/isObjectLike.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/isObjectLike.js ***!
  \*********************************************/
/*! no static exports found */function(e,t){e.exports=function(e){return null!=e&&"object"==typeof e}},"./node_modules/lodash/isSet.js":
/*!**************************************!*\
  !*** ./node_modules/lodash/isSet.js ***!
  \**************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseIsSet */"./node_modules/lodash/_baseIsSet.js"),s=o(/*! ./_baseUnary */"./node_modules/lodash/_baseUnary.js"),a=o(/*! ./_nodeUtil */"./node_modules/lodash/_nodeUtil.js"),r=a&&a.isSet,l=r?s(r):n;e.exports=l},"./node_modules/lodash/isSymbol.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/isSymbol.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseGetTag */"./node_modules/lodash/_baseGetTag.js"),s=o(/*! ./isObjectLike */"./node_modules/lodash/isObjectLike.js"),a="[object Symbol]";e.exports=function(e){return"symbol"==typeof e||s(e)&&n(e)==a}},"./node_modules/lodash/isTypedArray.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/isTypedArray.js ***!
  \*********************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseIsTypedArray */"./node_modules/lodash/_baseIsTypedArray.js"),s=o(/*! ./_baseUnary */"./node_modules/lodash/_baseUnary.js"),a=o(/*! ./_nodeUtil */"./node_modules/lodash/_nodeUtil.js"),r=a&&a.isTypedArray,l=r?s(r):n;e.exports=l},"./node_modules/lodash/keys.js":
/*!*************************************!*\
  !*** ./node_modules/lodash/keys.js ***!
  \*************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_arrayLikeKeys */"./node_modules/lodash/_arrayLikeKeys.js"),s=o(/*! ./_baseKeys */"./node_modules/lodash/_baseKeys.js"),a=o(/*! ./isArrayLike */"./node_modules/lodash/isArrayLike.js");e.exports=function(e){return a(e)?n(e):s(e)}},"./node_modules/lodash/keysIn.js":
/*!***************************************!*\
  !*** ./node_modules/lodash/keysIn.js ***!
  \***************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_arrayLikeKeys */"./node_modules/lodash/_arrayLikeKeys.js"),s=o(/*! ./_baseKeysIn */"./node_modules/lodash/_baseKeysIn.js"),a=o(/*! ./isArrayLike */"./node_modules/lodash/isArrayLike.js");e.exports=function(e){return a(e)?n(e,!0):s(e)}},"./node_modules/lodash/memoize.js":
/*!****************************************!*\
  !*** ./node_modules/lodash/memoize.js ***!
  \****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_MapCache */"./node_modules/lodash/_MapCache.js"),s="Expected a function";function a(e,t){if("function"!=typeof e||null!=t&&"function"!=typeof t)throw new TypeError(s);var o=function(){var n=arguments,s=t?t.apply(this,n):n[0],a=o.cache;if(a.has(s))return a.get(s);var r=e.apply(this,n);return o.cache=a.set(s,r)||a,r};return o.cache=new(a.Cache||n),o}a.Cache=n,e.exports=a},"./node_modules/lodash/noop.js":
/*!*************************************!*\
  !*** ./node_modules/lodash/noop.js ***!
  \*************************************/
/*! no static exports found */function(e,t){e.exports=function(){}},"./node_modules/lodash/property.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/property.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseProperty */"./node_modules/lodash/_baseProperty.js"),s=o(/*! ./_basePropertyDeep */"./node_modules/lodash/_basePropertyDeep.js"),a=o(/*! ./_isKey */"./node_modules/lodash/_isKey.js"),r=o(/*! ./_toKey */"./node_modules/lodash/_toKey.js");e.exports=function(e){return a(e)?n(r(e)):s(e)}},"./node_modules/lodash/some.js":
/*!*************************************!*\
  !*** ./node_modules/lodash/some.js ***!
  \*************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_arraySome */"./node_modules/lodash/_arraySome.js"),s=o(/*! ./_baseIteratee */"./node_modules/lodash/_baseIteratee.js"),a=o(/*! ./_baseSome */"./node_modules/lodash/_baseSome.js"),r=o(/*! ./isArray */"./node_modules/lodash/isArray.js"),l=o(/*! ./_isIterateeCall */"./node_modules/lodash/_isIterateeCall.js");e.exports=function(e,t,o){var i=r(e)?n:a;return o&&l(e,t,o)&&(t=void 0),i(e,s(t,3))}},"./node_modules/lodash/stubArray.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/stubArray.js ***!
  \******************************************/
/*! no static exports found */function(e,t){e.exports=function(){return[]}},"./node_modules/lodash/stubFalse.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/stubFalse.js ***!
  \******************************************/
/*! no static exports found */function(e,t){e.exports=function(){return!1}},"./node_modules/lodash/toString.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/toString.js ***!
  \*****************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseToString */"./node_modules/lodash/_baseToString.js");e.exports=function(e){return null==e?"":n(e)}},"./node_modules/lodash/uniq.js":
/*!*************************************!*\
  !*** ./node_modules/lodash/uniq.js ***!
  \*************************************/
/*! no static exports found */function(e,t,o){var n=o(/*! ./_baseUniq */"./node_modules/lodash/_baseUniq.js");e.exports=function(e){return e&&e.length?n(e):[]}},"./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */function(e,t){var o;o=function(){return this}();try{o=o||Function("return this")()||(0,eval)("this")}catch(e){"object"==typeof window&&(o=window)}e.exports=o},"./node_modules/webpack/buildin/module.js":
/*!***********************************!*\
  !*** (webpack)/buildin/module.js ***!
  \***********************************/
/*! no static exports found */function(e,t){e.exports=function(e){return e.webpackPolyfill||(e.deprecate=function(){},e.paths=[],e.children||(e.children=[]),Object.defineProperty(e,"loaded",{enumerable:!0,get:function(){return e.l}}),Object.defineProperty(e,"id",{enumerable:!0,get:function(){return e.i}}),e.webpackPolyfill=1),e}},"./src/CSSParser.js":
/*!**************************!*\
  !*** ./src/CSSParser.js ***!
  \**************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},s={},a="desktop",r="",l=!1,i=function(e){return Object.keys(e).map(function(t){return t+" { "+e[t].join("\n")+" }"}).join("\n")};t.default=function(e){if(!e)return"";var t="";return s={},a="desktop",r="",l=!1,function e(t){Object.keys(t).forEach(function(o){var i=t[o];if(i.styles)r=i.selector,e(i.styles);else if("string"==typeof i){s[a]||(s[a]={});var u=l?r+":hover":r;s[a][u]||(s[a][u]=[]),s[a][u].push(i)}else"object"===(void 0===i?"undefined":n(i))&&(i.desktop?Object.keys(i).forEach(function(t){a=t,e(i[t])}):i.normal&&Object.keys(i).forEach(function(t){l="hover"===t,e(i[t]),l=!1}))})}(e),Object.keys(s).reverse().forEach(function(e){t+="desktop"===e?"\n"+i(s[e]):"\n@media screen and (max-width:"+e+"px) { "+i(s[e])+" }"}),t}},"./src/config.js":
/*!***********************!*\
  !*** ./src/config.js ***!
  \***********************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={classNames:{control:"aux-control"}}},"./src/controlFactory.js":
/*!*******************************!*\
  !*** ./src/controlFactory.js ***!
  \*******************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.types=void 0,t.default=function(e,t,o){var n=e.getAttribute("data-type");if(!n)return console.warn("This control does not have data-type attribute.",e),null;return new m[n](e,t,o)};var n=_(o(/*! ./controls/Choose */"./src/controls/Choose.js")),s=_(o(/*! ./controls/FontFace */"./src/controls/FontFace.js")),a=_(o(/*! ./controls/Select */"./src/controls/Select.js")),r=_(o(/*! ./controls/Slider */"./src/controls/Slider.js")),l=_(o(/*! ./controls/Popover */"./src/controls/Popover.js")),i=_(o(/*! ./controls/Color */"./src/controls/Color.js")),u=_(o(/*! ./controls/Dimension */"./src/controls/Dimension.js")),c=_(o(/*! ./controls/Text */"./src/controls/Text.js")),d=_(o(/*! ./helpers/Container */"./src/helpers/Container.js")),h=_(o(/*! ./helpers/Responsive */"./src/helpers/Responsive.js")),f=_(o(/*! ./helpers/Hover */"./src/helpers/Hover.js")),p=_(o(/*! ./helpers/Repeater */"./src/helpers/Repeater.js"));function _(e){return e&&e.__esModule?e:{default:e}}var m=t.types={choose:n.default,responsive:h.default,hover:f.default,font:s.default,select:a.default,slider:r.default,container:d.default,popover:l.default,color:i.default,dimension:u.default,text:c.default,repeater:p.default}},"./src/controls/BaseControl.js":
/*!*************************************!*\
  !*** ./src/controls/BaseControl.js ***!
  \*************************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=r(o(/*! ../middlewares */"./src/middlewares/index.js")),a=r(o(/*! lodash/isEqual */"./node_modules/lodash/isEqual.js"));function r(e){return e&&e.__esModule?e:{default:e}}var l=0,i=function(){function e(t,o,n){var a=this;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.element=t,this.name=t.getAttribute("data-name"),this._value=this.element.getAttribute("data-default"),this.rootContainer=o,this.parentContainer=n,this._defaultValue=this._value,this.hasDefaultValue=!0,this.type=t.getAttribute("data-type"),["DIV","SECTION","UL"].includes(this.element.tagName)||console.warn('Use "div", "ul" or "section" for defining a control.'),this.middlewares=s.default.map(function(e){return e(a)}).filter(function(e){return null!==e}),this.onchange=null,this.resetButton=this.element.querySelector(":scope > .aux-reset"),this.resetButton&&this.resetButton.addEventListener("click",function(e){e.preventDefault(),a.reset()}),this.cssValue="",this.styleTemplate=t.getAttribute("data-style-template"),l+=1,this.uniqueID=l}return n(e,[{key:"update",value:function(){}},{key:"internalSetValue",value:function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],o=arguments.length>2&&void 0!==arguments[2]&&arguments[2];void 0!==e&&((0,a.default)(this._value,e)&&!o||(this._value=e,this.hasDefaultValue=!1,t&&this.onchange&&this.onchange()))}},{key:"reset",value:function(){var e=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.middlewares.forEach(function(e){return e.reset(!1)}),this.value=this._defaultValue,this.hasDefaultValue=!0,e&&this.onchange&&this.onchange()}},{key:"generateCSS",value:function(){var e=!(arguments.length>0&&void 0!==arguments[0])||arguments[0],t=this.middlewares.reduce(function(e,t){return t.generateCSS(e)},this._value);return(t||"0"===t)&&this._defaultValue!==this._value||this.styleTemplate?(this.styleTemplate?this.cssValue=this.replaceCSS(this.styleTemplate,t):this.cssValue=e?this.name+": "+t+";":""+t,function(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}({},this.uniqueID,this.cssValue)):(this.cssValue="",this.cssValue)}},{key:"replaceCSS",value:function(e,t){var o=this;return e.replace(/{{VALUE}}|{{PROPERTY}}/gi,function(e,n,s){return"{{VALUE}}"===e?t:"{{PROPERTY}}"===e?o.name:s})}},{key:"value",set:function(e){e=this.middlewares.reduceRight(function(e,t){return t.set(e)},e),this.internalSetValue(e,!1),this.update()},get:function(){return this.middlewares.reduce(function(e,t){return t.get(e)},this._value)}}]),e}();t.default=i},"./src/controls/Choose.js":
/*!********************************!*\
  !*** ./src/controls/Choose.js ***!
  \********************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=function(e){return e&&e.__esModule?e:{default:e}}(o(/*! ./BaseControl */"./src/controls/BaseControl.js"));var a=function(e){function t(e,o,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var s=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n));if(s.options=s.element.querySelectorAll(".aux-option-item"),!s.options.length)throw new Error('Choose control should contain at lease one option element specified by "aux-option-item" class name.');return s.options.forEach(function(e){e.addEventListener("click",function(){s.internalSetValue(e.getAttribute("data-value")),s.update()})}),s.update(),s}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,s.default),n(t,[{key:"update",value:function(){var e=this;this.options.forEach(function(t){t.getAttribute("data-value")===e._value?t.classList.add("aux-option-selected"):t.classList.remove("aux-option-selected")})}}]),t}();t.default=a},"./src/controls/Color.js":
/*!*******************************!*\
  !*** ./src/controls/Color.js ***!
  \*******************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=function(e){return e&&e.__esModule?e:{default:e}}(o(/*! ./BaseControl */"./src/controls/BaseControl.js"));var a=function(e){function t(e,o,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var s=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n));if(s.colorInput=s.element.querySelector('input[type="text"]'),!s.colorInput)throw new Error("Color input element is missing. Every color control should contain one color input element.");return s.colorInput.value=s._value,s.colorInput.addEventListener("change",function(){var e=s.colorInput.value;s.internalSetValue(e),s.spectrumUI&&s.spectrumUI.spectrum("set",s._value)}),window.jQuery&&window.jQuery.fn.spectrum&&(s.spectrumUI=window.jQuery(s.colorInput).spectrum({value:s._value,preferredFormat:"rgb",showAlpha:!0,allowEmpty:!0,showInput:!0,disabled:!1,showSelectionPalette:!0,showPalette:!0,hideAfterPaletteSelect:!0,palette:[["black","white"," "]],clickoutFiresChange:!0,showInitial:!0,change:function(e){if(e){var t=e.toRgbString();s._value!==t&&(s._lastValue=t,s.colorInput.value=t,s.internalSetValue(t))}}})),s}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,s.default),n(t,[{key:"update",value:function(){this.colorInput.value=this._value,this.spectrumUI&&this.spectrumUI.spectrum("set",this._value)}}]),t}();t.default=a},"./src/controls/Dimension.js":
/*!***********************************!*\
  !*** ./src/controls/Dimension.js ***!
  \***********************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=r(o(/*! lodash/isEqual */"./node_modules/lodash/isEqual.js")),a=r(o(/*! ./BaseControl */"./src/controls/BaseControl.js"));function r(e){return e&&e.__esModule?e:{default:e}}var l=function(e){function t(e,o,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var s=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n));s.finalValue=[],s.dimensionInputs=s.element.querySelectorAll('input[type="number"]');var a=s._defaultValue;if(s._defaultValue={},s.isLinked=!0,s.dimensionInputs.forEach(function(e){var t=e.getAttribute("data-side-name");s._defaultValue[t]=a,e.value=a}),s._defaultValue.isLinked=!0,!s.dimensionInputs||s.dimensionInputs.length<4)throw new Error("Number input element is missing or the number of number inputs is less than 4, Every Dimension control should contain four number input elements.");if(s.linkValuesButton=s.element.querySelector("button"),!s.linkValuesButton)throw new Error("Button element is missing. Every dimension control should contain one button element.");return s.linkValuesButton.addEventListener("click",s.linkValuesHandler.bind(s)),s.inputValuesHandler=s.inputValuesHandler.bind(s),s.dimensionInputs.forEach(function(e){e.addEventListener("change",s.inputValuesHandler)}),s.populateValue(),s.hasDefaultValue=!0,s}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,a.default),n(t,[{key:"populateValue",value:function(){var e={};this.dimensionInputs.forEach(function(t){var o=t.getAttribute("data-side-name");e[o]=t.value}),e.isLinked=this.isLinked,this.hasDefaultValue=!1,this.internalSetValue(e)}},{key:"linkValuesHandler",value:function(e){e.preventDefault(),this.isLinked=!this.isLinked,this.isLinked?this.linkValuesButton.classList.add("aux-is-active"):(this.linkValuesButton.classList.remove("aux-is-active"),this.dimensionInputs.forEach(function(e){e.value="0"})),this.populateValue()}},{key:"inputValuesHandler",value:function(e){this.isLinked&&this.dimensionInputs.forEach(function(t){""===e.target.value?t.value="0":t.value=e.target.value}),this.populateValue()}},{key:"update",value:function(){var e=this;Object.keys(this._value).forEach(function(t){e.dimensionInputs.forEach(function(o){o.getAttribute("data-side-name")===t&&(o.value=e._value[t])})}),Object.hasOwnProperty.call(this._value,"isLinked")&&(this.isLinked=this._value.isLinked,this.isLinked&&this.linkValuesButton.classList.add("aux-is-active"))}},{key:"reset",value:function(){var e=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.isLinked=!0,this.hasDefaultValue=!0,function e(t,o,n){null===t&&(t=Function.prototype);var s=Object.getOwnPropertyDescriptor(t,o);if(void 0===s){var a=Object.getPrototypeOf(t);return null===a?void 0:e(a,o,n)}if("value"in s)return s.value;var r=s.get;return void 0!==r?r.call(n):void 0}(t.prototype.__proto__||Object.getPrototypeOf(t.prototype),"reset",this).call(this,e)}},{key:"generateCSS",value:function(){var e=this,t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0],o="";return Object.keys(this._value).forEach(function(t){"isLinked"!==t&&(o+=e.middlewares.reduce(function(e,t){return t.generateCSS(e)},e._value[t])+" ")}),(0,s.default)(this._value,this._defaultValue)&&!this.styleTemplate?(this.cssValue="",this.cssValue):(this.styleTemplate?this.cssValue=this.replaceCSS(this.styleTemplate,this._value):this.cssValue=t?this.name+": "+o+";":""+o,function(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}({},this.uniqueID,this.cssValue))}},{key:"replaceCSS",value:function(e,t){var o=this;return e.replace(/{{PROPERTY}}|{{TOP}}|{{RIGHT}}|{{BOTTOM}}|{{LEFT}}|{{UNIT}}/gi,function(e,n,s){switch(e){case"{{PROPERTY}}":return o.name;case"{{TOP}}":return t.top;case"{{RIGHT}}":return t.right;case"{{BOTTOM}}":return t.bottom;case"{{LEFT}}":return t.left;case"{{UNIT}}":return o.middlewares.reduce(function(e,t){return t.get(e)},t).unit;default:return s}})}}]),t}();t.default=l},"./src/controls/FontFace.js":
/*!**********************************!*\
  !*** ./src/controls/FontFace.js ***!
  \**********************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){return function(e,t){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return function(e,t){var o=[],n=!0,s=!1,a=void 0;try{for(var r,l=e[Symbol.iterator]();!(n=(r=l.next()).done)&&(o.push(r.value),!t||o.length!==t);n=!0);}catch(e){s=!0,a=e}finally{try{!n&&l.return&&l.return()}finally{if(s)throw a}}return o}(e,t);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),s=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),a=l(o(/*! ./BaseControl */"./src/controls/BaseControl.js")),r=l(o(/*! ../utils/gFonts */"./src/utils/gFonts.js"));function l(e){return e&&e.__esModule?e:{default:e}}var i=function(e){function t(e,o,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var s=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n)),a=e.querySelector(".aux-loading");if(s.fontList={},s.useEarly="true"===s.element.getAttribute("data-early"),s.select=s.element.querySelector("select"),s.select||(s.select=document.createElement("select")),s.gFontUrl="//fonts.googleapis.com/css?family={{NAME}}",s.earlyUrl="//fonts.googleapis.com/earlyaccess/{{NAME}}.css",s.customFontUrl="",s.urlTarget=s.element.getAttribute("data-target"),s.useEarly&&s.gEarlyList(r.default.googleEarlyAccesFonts()),s.select.querySelectorAll("option").length){var l=s.select.querySelectorAll("select option");s.cFontsList(l)}return s._value={value:s._defaultValue.split("|")[0],type:s._defaultValue.split("|")[1]},r.default.getList(function(e){a&&s.element.removeChild(a),s.loadingDone=!0,s.gFontList(e),s.listHandle(s.fontList)}),s}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,a.default),s(t,[{key:"listHandle",value:function(e){var t=this;this.selectOptions='<option value="none">Select</option>',Object.keys(e).forEach(function(o){var n=e[o].join("");if(1!==Object.keys(e).length)switch(o){case"cFont":n='<optgroup label="System Fonts">'+n+"</optgroup>";break;case"gEarly":n='<optgroup label="Google EarlyAccess">'+n+"</optgroup>";break;default:n='<optgroup label="Google Fonts">'+n+"</optgroup>"}t.selectOptions+=n}),this.select.innerHTML=this.selectOptions,this.element.appendChild(this.select),window.jQuery&&window.jQuery.fn.select2?(this.select2=window.jQuery(this.select).select2(),this.isSelect2=!0,this.select2.on("change",function(){var e=t.select.options[t.select.selectedIndex],o={};o.value=t.select.value,o.type=e.getAttribute("data-type"),"cFont"===o.type&&(t.customFontUrl=e.getAttribute("data-url")),t.internalSetValue(o)})):this.select.addEventListener("change",function(){var e=t.select.options[t.select.selectedIndex],o={};o.value=t.select.value,o.type=e.getAttribute("data-type"),"cFont"===o.type&&(t.customFontUrl=e.getAttribute("data-url")),t.internalSetValue(o)}),this.update()}},{key:"cFontsList",value:function(e){e=Array.from(e),this.fontList.cFont=e.map(function(e){return e.outerHTML})}},{key:"gEarlyList",value:function(e){this.fontList.gEarly=Object.keys(e).map(function(t){var o=e[t];return'<option value="'+o.name+'" data-type="gEarly">'+o.title+"</option>"})}},{key:"gFontList",value:function(e){this.fontList.gFont=e.items.map(function(e){return'<option value="'+e.family+":"+e.variants.join(",")+'" data-type="gFont">'+e.family+"</option>"})}},{key:"update",value:function(){if("string"==typeof this._value||Object.hasOwnProperty.call(this._value,"url")){var e=void 0;if(Object.hasOwnProperty.call(this._value,"url")){var t=this._value.value;delete this._value.url,e=t}else e=this._value;var o=Object.values(this.select.options).find(function(t){return t.value===e}),n=void 0;n=o?o.getAttribute("data-type"):"gFont",this.internalSetValue({value:e,type:n},!0,!0),this.update()}this.loadingDone&&(this.select.value=this._value.value,this.isSelect2&&window.jQuery(this.select).trigger("change.select2"))}},{key:"reset",value:function(){var e=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.value={value:this._defaultValue.split("|")[0],type:this._defaultValue.split("|")[1]},this.hasDefaultValue=!0,e&&this.onchange&&this.onchange()}},{key:"generateCSS",value:function(){var e=!(arguments.length>0&&void 0!==arguments[0])||arguments[0],t=this._value.value.split(":"),o=n(t,1)[0],s=this._defaultValue.split("|")[0];return!o&&"0"!==o||o===s?(this.cssValue="",this.cssValue):(this.cssValue=e?this.name+": '"+o+"';":""+o,function(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}({},this.uniqueID,this.cssValue))}},{key:"getURL",value:function(){var e=this._value,t=e.value,o=e.type,n="";return"gFont"===o?n=this.gFontUrl.replace("{{NAME}}",t):"gEarly"===o?(t=t.replace(/\s+/g,"").toLowerCase(),n=this.earlyUrl.replace("{{NAME}}",t)):n=this.customFontUrl,n}}]),t}();t.default=i},"./src/controls/Popover.js":
/*!*********************************!*\
  !*** ./src/controls/Popover.js ***!
  \*********************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=l(o(/*! lodash/cloneDeep */"./node_modules/lodash/cloneDeep.js")),a=l(o(/*! ./BaseControl */"./src/controls/BaseControl.js")),r=l(o(/*! ../helpers/Container */"./src/helpers/Container.js"));function l(e){return e&&e.__esModule?e:{default:e}}var i={},u=Object.prototype.hasOwnProperty,c=function(e){function t(e,o,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var a=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n));if(a.templateId=a.element.getAttribute("data-template"),!a.templateId)throw new Error("Template ID is missing.");if(a.template=document.getElementById(a.element.getAttribute("data-template")),!a.template)throw new Error('The template "'+a.templateId+'" is missing in the page.');return u.call(i,a.templateId)||(i[a.templateId]=new r.default(a.template,o,n)),a.popoverContainer=i[a.templateId],a._value=(0,s.default)(a.popoverContainer.value),a._defaultValue=a._value,a.popoverCSS="",a.element.addEventListener("click",a.openPopover.bind(a)),document.addEventListener("click",a.closePopover.bind(a)),a}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,a.default),n(t,[{key:"reset",value:function(){var e=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.element.classList.remove("aux-popover-changed"),this.popoverContainer.reset(!1),this.internalSetValue((0,s.default)(this.popoverContainer.value),e,!0),this.hasDefaultValue=!0}},{key:"locatePopover",value:function(){var e=this.element.getBoundingClientRect();if(this.container){var t=this.container.getBoundingClientRect();this.template.style.top=this.container.scrollTop+e.bottom-t.top+"px",this.template.style.left=this.container.scrollLeft+e.left-t.left+"px"}else this.template.style.top=e.bottom+window.scrollY+"px",this.template.style.left=e.left+window.scrollX+"px"}},{key:"openPopover",value:function(e){var t=this;if(this.popoverContainer._value=(0,s.default)(this._value),this.popoverContainer.parentContainer=this.parentContainer,this.popoverContainer.rootContainer=this.rootContainer,this.popoverContainer.selector=this.popoverContainer.defineSelector(),this.popoverContainer.onchange=null,this.popoverContainer.update(),this.generateCSS(),this.templateContainer=this.element.getAttribute("data-container"),this.popoverContainer.onchange=function(){t.suppressChangeEvent||(t.element.classList.contains("aux-popover-changed")||t.element.classList.add("aux-popover-changed"),t.hasDefaultValue=!1,t.internalSetValue((0,s.default)(t.popoverContainer.value),!0,!0))},this.templateContainer){if(this.container=document.querySelector(this.templateContainer),!this.container)throw new Error('The container of template "'+this.templateId+'" is missing in the page.');this.template.parentNode!==this.container&&this.container.appendChild(this.template)}if(this.template.classList.contains("aux-is-open"))return this.template.classList.remove("aux-is-open"),void e.preventDefault();this.locatePopover(),e.preventDefault(),e.stopImmediatePropagation(),this.template.classList.remove("aux-is-open"),setTimeout(function(){t.template.classList.add("aux-is-open")},1);var o=document.createEvent("HTMLEvents");o.initEvent("PopOverIsOpen",!1,!0),this.template.dispatchEvent(o)}},{key:"closePopover",value:function(e){var t=this.template.querySelector(".select2-container");if(!(e.target.closest("#"+this.templateId)||t&&e.target.closest(".select2-container"))){this.template.classList.remove("aux-is-open");var o=document.createEvent("HTMLEvents");o.initEvent("PopOverIsClosed",!1,!0),this.template.dispatchEvent(o)}}},{key:"generateCSS",value:function(){var e=this.popoverContainer,t=e.parentContainer,o=e.rootContainer,n=e.selector,a=e._value,r=e.onchange;this.popoverContainer.parentContainer=this.parentContainer,this.popoverContainer.rootContainer=this.rootContainer,this.popoverContainer.selector=this.popoverContainer.defineSelector(),this.popoverContainer._value=(0,s.default)(this._value),this.popoverContainer.onchange=null,this.popoverContainer.update();var l=(0,s.default)(this.popoverContainer.generateCSS());return this.popoverContainer.parentContainer=t,this.popoverContainer.rootContainer=o,this.popoverContainer.selector=n,this.popoverContainer._value=a,this.popoverContainer.update(),this.popoverContainer.onchange=r,l?function(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}({},this.uniqueID,l[this.popoverContainer.uniqueID]):null}}]),t}();t.default=c},"./src/controls/Select.js":
/*!********************************!*\
  !*** ./src/controls/Select.js ***!
  \********************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=function(e){return e&&e.__esModule?e:{default:e}}(o(/*! ./BaseControl */"./src/controls/BaseControl.js"));var a=function(e){function t(e,o,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var s=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n));if(s.select=e.querySelector("select"),!s.select)throw new Error("Select element is missing. Select control should contain a select element");return window.jQuery&&window.jQuery.fn.select2&&"true"===s.element.getAttribute("data-select2")?(s.select2=window.jQuery(s.select).select2(),s.isSelect2=!0,s.select2.on("change",function(){return s.internalSetValue(s.select.value)})):s.select.addEventListener("change",function(){return s.internalSetValue(s.select.value)}),s.update(),s}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,s.default),n(t,[{key:"update",value:function(){this.select.value=this._value,this.isSelect2&&window.jQuery(this.select).trigger("change.select2")}}]),t}();t.default=a},"./src/controls/Slider.js":
/*!********************************!*\
  !*** ./src/controls/Slider.js ***!
  \********************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=function(e){return e&&e.__esModule?e:{default:e}}(o(/*! ./BaseControl */"./src/controls/BaseControl.js"));var a=function(e){function t(e,o,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var s=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n));if(s.numInput=s.element.querySelector('input[type="number"]'),!s.numInput)throw new Error("Number input element is missing. Every slider control should contain one number input element.");if(s.numInput.value=s._value,s.numInput.addEventListener("change",function(){var e=s.numInput.value;e=parseFloat(e),s.internalSetValue(e),s.sliderUI&&s.sliderUI.slider("option","value",e)}),window.jQuery&&window.jQuery.fn.slider){var a=document.createElement("div"),r=s.numInput,l=r.min,i=r.max,u=r.step;s.sliderUI=window.jQuery(a).slider({min:parseFloat(l),max:parseFloat(i),step:parseFloat(u),value:s._value}),s.element.appendChild(a),s.sliderUI.on("slide",function(e,t){var o=t.value;s._value!==o&&(s._lastValue=o,s.numInput.value=o,s.internalSetValue(o))})}return s}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,s.default),n(t,[{key:"update",value:function(){this.numInput.value=this._value,this.sliderUI&&this.sliderUI.slider("option","value",this._value)}}]),t}();t.default=a},"./src/controls/Text.js":
/*!******************************!*\
  !*** ./src/controls/Text.js ***!
  \******************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=function(e){return e&&e.__esModule?e:{default:e}}(o(/*! ./BaseControl */"./src/controls/BaseControl.js"));var a=function(e){function t(e,o,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var s=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n));if(s.textInput=s.element.querySelector('input[type="text"]'),!s.textInput)throw new Error("Text input element is missing. Every text control should contain one text input element.");return s.textInput.value=s._value,s.textInput.addEventListener("change",function(){var e=s.textInput.value;s.internalSetValue(e)}),s}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,s.default),n(t,[{key:"update",value:function(){this.textInput.value=this._value}}]),t}();t.default=a},"./src/helpers/Container.js":
/*!**********************************!*\
  !*** ./src/helpers/Container.js ***!
  \**********************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=u(o(/*! lodash/flatten */"./node_modules/lodash/flatten.js")),a=u(o(/*! lodash/uniq */"./node_modules/lodash/uniq.js")),r=u(o(/*! ../controlFactory */"./src/controlFactory.js")),l=u(o(/*! ../controls/BaseControl */"./src/controls/BaseControl.js")),i=u(o(/*! ../config */"./src/config.js"));function u(e){return e&&e.__esModule?e:{default:e}}var c=function(e){function t(e,o,n){var s;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var a=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n)),l=Array.prototype.filter;return a._value={},a.children=[],a.removeDefaults="true"===a.element.getAttribute("data-remove-defaults"),a.rootContainer=o||a,a.parentContainer=n||a,a.parentContainer!==a&&a.parentContainer.children.push(a),a.inheritedSelector=!1,a.selector=a.defineSelector(),a.controlsCSS={},a.rootContainerCSS={},a.controls=(s=a.element.querySelectorAll("."+i.default.classNames.control),l).call(s,function(e){return e.parentElement.closest("."+i.default.classNames.control)===a.element}).map(function(e){return(0,r.default)(e,a.rootContainer,a)}).filter(function(e){return!!e}),a.controls.forEach(function(e){a._value[e.name]=e.value,e.onchange=function(){e.hasDefaultValue&&a.removeDefaults?delete a._value[e.name]:a._value[e.name]=e.value,a.hasDefaultValue&&(a.hasDefaultValue=e.hasDefaultValue),a.onchange&&a.onchange()}}),a}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,l.default),n(t,[{key:"update",value:function(){var e=this;this.controls.forEach(function(t){t.value=e._value[t.name]})}},{key:"reset",value:function(){var e=this,t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.controls.forEach(function(t){t.reset(!1),e.removeDefaults?delete e._value[t.name]:e._value[t.name]=t.value}),this.hasDefaultValue=!0,t&&this.onchange&&this.onchange()}},{key:"defineSelector",value:function(){var e=this.element.getAttribute("data-selector");if(!e)throw new Error("The container doesn't have specific selector");return"inherit"===e?(this.inheritedSelector=!0,this.parentContainer.selector):e}},{key:"generateCSS",value:function(){var e={};return this.controls.forEach(function(t){var o=t.uniqueID,n=t.generateCSS();n&&(e[o]=n[o])}),Object.keys(e).length?function(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}({},this.uniqueID,{selector:this.selector,styles:e}):null}},{key:"cssString",value:function(e){var t=this,o="",n="";return Object.keys(e).forEach(function(s){"desktop"===s&&(Object.keys(e[s]).forEach(function(t){o+=""+e[s][t]}),n+=t.selector+" { "+o+" } ")}),n}},{key:"getFonts",value:function(){var e=this.children,t=this.controls.filter(function(e){return"font"===e.type}),o=[];return e.length&&e.forEach(function(e){o.push(e.getFonts())}),t.forEach(function(e){o.push(e.getURL())}),(0,a.default)((0,s.default)(o))}}]),t}();t.default=c},"./src/helpers/Hover.js":
/*!******************************!*\
  !*** ./src/helpers/Hover.js ***!
  \******************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=d(o(/*! lodash/some */"./node_modules/lodash/some.js")),a=d(o(/*! lodash/has */"./node_modules/lodash/has.js")),r=d(o(/*! lodash/isEqual */"./node_modules/lodash/isEqual.js")),l=d(o(/*! lodash/cloneDeep */"./node_modules/lodash/cloneDeep.js")),i=d(o(/*! ../controls/BaseControl */"./src/controls/BaseControl.js")),u=d(o(/*! ../controls/Choose */"./src/controls/Choose.js")),c=d(o(/*! ../controlFactory */"./src/controlFactory.js"));function d(e){return e&&e.__esModule?e:{default:e}}var h=function(e){function t(e,o,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var s=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n)),a=s.element.querySelector(".aux-states");if(!a)throw new Error("States control element not found inside the hover control. It should specifies by `.aux-states`");s.states=new u.default(a),s.states.onchange=function(){return s.update()};var r=s.element.querySelector(".aux-control");if(!r)throw new Error("Inner control element not found inside the hover control. It should specifies by `.aux-control`");return s.control=(0,c.default)(r,o,n),s._value={normal:s.control.value},s.control.onchange=function(){s._value[s.states.value]=(0,l.default)(s.control.value),s.hasDefaultValue=s.states.hasDefaultValue&&s.control.hasDefaultValue,s.onchange(),s.generateCSS()},s.cssValue={},s}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,i.default),n(t,[{key:"update",value:function(){var e=this;if(this.hasDefaultValue=this.states.hasDefaultValue&&this.control.hasDefaultValue,Object.keys(this._value).forEach(function(t){e.control.value=(0,l.default)(e._value[t]),e.cssValue[t]=e.control.generateCSS()}),Object.hasOwnProperty.call(this._value,this.states.value)?this.control.value=(0,l.default)(this._value[this.states.value]):this.control.value=this.control._defaultValue,!Object.hasOwnProperty.call(this.rootContainer._value,this.name)){var t=(0,l.default)(this.rootContainer._value[this.control.name]);!(0,r.default)(t,this.control._value)&&Object.hasOwnProperty.call(this.rootContainer._value,this.control.name)&&(this.control.value=t,this._value.normal=this.control.value,delete this.rootContainer._value[this.control.name],this.internalSetValue(this._value,!0,!0))}}},{key:"reset",value:function(){var e=this,t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.states.reset(!1),this.control.reset(t),this._value[this.states.value]=this.control.value,Object.keys(this._value).forEach(function(t){t!==e.states._defaultValue&&(delete e._value[t],delete e.cssValue[t])}),this.hasDefaultValue=!0}},{key:"generateCSS",value:function(){var e=this.states.value;Object.hasOwnProperty.call(this.cssValue,e)||(this.cssValue[e]={});var t=this.control.generateCSS();return t?(this.cssValue[e]=(0,l.default)(t),function(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}({},this.uniqueID,this.cssValue)):null}},{key:"deepCheck",value:function(e,t){return(0,s.default)(e,function(e){return(0,a.default)(e,t)})}}]),t}();t.default=h},"./src/helpers/Repeater.js":
/*!*********************************!*\
  !*** ./src/helpers/Repeater.js ***!
  \*********************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=r(o(/*! ../controls/BaseControl */"./src/controls/BaseControl.js")),a=r(o(/*! ./Container */"./src/helpers/Container.js"));function r(e){return e&&e.__esModule?e:{default:e}}var l=function(e){function t(e,o,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var s=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n));if(s._value={},s.items=new Map,s.item=s.element.querySelector(".aux-repeater-item"),!s.item)throw new Error("The repeater template is missing in the page.");if(s.add=s.element.querySelector(".aux-add"),!s.add)throw new Error("Add button element is missing. Every repeater control should contain add button element.");if(s.delete=s.item.querySelector(".aux-delete"),!s.delete)throw new Error("Delete button element is missing. Every repeater item should contain add button element.");return s.newItem=s.item.cloneNode(!0),s.setupRepeater(s.item,o,n),s.add.addEventListener("click",s.createItem.bind(s)),window.jQuery&&window.jQuery.fn.sortable&&(s.sortableUI=window.jQuery(s.element).sortable({items:".aux-repeater-item"})),s.sortableUI.on("sortstop",function(e,t){var o=parseInt(t.item[0].getAttribute("data-id"),10),n=t.item.index();s.sortMap(o,n),s.items.get(o).onchange()}),s}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,s.default),n(t,[{key:"createItem",value:function(){var e=this.newItem.cloneNode(!0);return window.jQuery&&window.jQuery.fn.sortable&&this.sortableUI.sortable("option","appendTo",e),this.setupRepeater(e,this.rootContainer,this.parentContainer),this.element.appendChild(e),e}},{key:"removeItem",value:function(e){var t=this.items.get(e);t.element.remove(),this.items.delete(e),t.onchange()}},{key:"setupRepeater",value:function(e,t,o){var n=this,s=new a.default(e,t,o);e.setAttribute("data-id",s.uniqueID),this.items.set(s.uniqueID,s);var r=e.querySelector(".aux-delete");s.onchange=function(){n._value=n.getValue(),n.internalSetValue(n._value,!0,!0)},r.addEventListener("click",this.removeItem.bind(this,s.uniqueID)),s.onchange()}},{key:"getValue",value:function(){var e=[];return this.items.forEach(function(t){e.push(t.value)}),e}},{key:"sortMap",value:function(e,t){var o=this,n=[],s=void 0;t-=1,this.items.forEach(function(t,o){var a=[o,t];n.push(a),e===o&&(s=a)});var a=n.indexOf(s);return(n=n.slice()).splice(t<0?n.length+t:t,0,n.splice(a,1)[0]),this.items=new Map,n.forEach(function(e){o.items.set(e[0],e[1])}),this.items}},{key:"update",value:function(){var e=this;this._value.forEach(function(t,o){if(o){var n=e.createItem(),s=parseInt(n.getAttribute("data-id"),10);e.items.get(s).value=t}else{var a=parseInt(e.item.getAttribute("data-id"),10);e.items.get(a).value=t}})}},{key:"reset",value:function(){var e=this,t=(!(arguments.length>0&&void 0!==arguments[0])||arguments[0],parseInt(this.item.getAttribute("data-id"),10));this.items.forEach(function(o,n){o.reset(!1),n!==t&&(e.items.delete(n),o.element.remove())})}}]),t}();t.default=l},"./src/helpers/Responsive.js":
/*!***********************************!*\
  !*** ./src/helpers/Responsive.js ***!
  \***********************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),s=i(o(/*! lodash/cloneDeep */"./node_modules/lodash/cloneDeep.js")),a=i(o(/*! ../controls/BaseControl */"./src/controls/BaseControl.js")),r=i(o(/*! ../controls/Choose */"./src/controls/Choose.js")),l=i(o(/*! ../controlFactory */"./src/controlFactory.js"));function i(e){return e&&e.__esModule?e:{default:e}}var u=null,c=[],d=function(e){function t(e,o,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var a=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n));c.push(a);var i=a.element.querySelector(".aux-devices");if(!i)throw new Error("Devices control element not found inside the responsive control. It should specifies by `.aux-devices`");a.devices=new r.default(i),a.devices.onchange=function(){return a.update()};var u=a.element.querySelector(".aux-control");if(!u)throw new Error("Inner control element not found inside the responsive control. It should specifies by `.aux-inner-control`");return a.control=(0,l.default)(u,o,n),a._value={desktop:a.control.value},a.control.onchange=function(){a._value[a.devices.value]=(0,s.default)(a.control.value),a.hasDefaultValue=a.devices.hasDefaultValue&&a.control.hasDefaultValue,a.onchange(),a.generateCSS()},a.cssValue={},a}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,a.default),n(t,[{key:"syncBreakPoint",value:function(){this.devices.value!==u&&(this.devices.value=u,this.update())}},{key:"update",value:function(){var e=this;u=this.devices.value,this.hasDefaultValue=this.devices.hasDefaultValue&&this.control.hasDefaultValue,c.forEach(function(e){e.syncBreakPoint()}),Object.keys(this._value).forEach(function(t){e.control.value=(0,s.default)(e._value[t]),e.cssValue[t]=e.control.generateCSS()}),Object.hasOwnProperty.call(this._value,this.devices.value)?this.control.value=(0,s.default)(this._value[this.devices.value]):this.control.value=(0,s.default)(this._value.desktop)}},{key:"reset",value:function(){var e=this,t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.devices.reset(!1),this.control.reset(t),this._value[this.devices.value]=this.control.value,Object.keys(this._value).forEach(function(t){t!==e.devices._defaultValue&&(delete e._value[t],delete e.cssValue[t])}),this.hasDefaultValue=!0}},{key:"generateCSS",value:function(){var e=this.devices.value;Object.hasOwnProperty.call(this.cssValue,e)||(this.cssValue[e]={});var t=this.control.generateCSS();return t?(this.cssValue[e]=(0,s.default)(t),function(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}({},this.uniqueID,this.cssValue)):null}}]),t}();t.default=d},"./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.setup=l,t.inputAdapter=function(e,t,o,n){var a=l(t)[0];a.toCSS=function(){return(0,s.default)(a.generateCSS())};var r=void 0,i="true"===e.getAttribute("data-is-json");if(i)if(r=e.value,i=!0,r.length<1)r={};else try{r=JSON.parse(e.value)}catch(e){throw new Error("There is an issue on parsing input value to object.")}a.onchange=function(){o&&o(a),i&&(e.value=JSON.stringify(a.value),e.dispatchEvent(new Event("change")),window.jQuery&&window.jQuery(e).trigger("change"))},a.value=r,n&&n(a)};var n=a(o(/*! ./controlFactory */"./src/controlFactory.js"));o(/*! ./middlewares */"./src/middlewares/index.js");var s=a(o(/*! ./CSSParser */"./src/CSSParser.js"));a(o(/*! ./helpers/Container */"./src/helpers/Container.js"));function a(e){return e&&e.__esModule?e:{default:e}}var r=Array.prototype.map;function l(e){var t;return"string"==typeof e?(t=document.querySelectorAll(e),r).call(t,function(e){return(0,n.default)(e)}):e.tagName?[(0,n.default)(e)]:null}},"./src/middlewares/index.js":
/*!**********************************!*\
  !*** ./src/middlewares/index.js ***!
  \**********************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=[function(e){return e&&e.__esModule?e:{default:e}}(o(/*! ./units */"./src/middlewares/units.js")).default];t.default=n},"./src/middlewares/units.js":
/*!**********************************!*\
  !*** ./src/middlewares/units.js ***!
  \**********************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},s=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),a=function(e){return e&&e.__esModule?e:{default:e}}(o(/*! ../controls/Choose */"./src/controls/Choose.js"));var r=function(){function e(t,o){var n=this;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.units=o,this.control=t,this.unitsControl=new a.default(this.units),this.unitsControl.onchange=function(){return n.control.onchange()},this.cssValue=""}return s(e,[{key:"set",value:function(e){return"object"===(void 0===e?"undefined":n(e))&&Object.hasOwnProperty.call(e,"unit")?(this.unitsControl.value=e.unit,e.value):e}},{key:"get",value:function(e){return{value:e,unit:this.unitsControl.value}}},{key:"reset",value:function(){var e=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.unitsControl.reset(e)}},{key:"generateCSS",value:function(e){var t=this.control.value.unit;return this.cssValue=""+e+t,this.cssValue}}]),e}();t.default=function(e){var t=e.element.querySelector(":scope > .aux-units");return t?new r(e,t):null}},"./src/utils/gFonts.js":
/*!*****************************!*\
  !*** ./src/utils/gFonts.js ***!
  \*****************************/
/*! no static exports found */function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(e){return e&&e.__esModule?e:{default:e}}(o(/*! @fdaciuk/ajax */"./node_modules/@fdaciuk/ajax/dist/ajax.min.js"));var s="AIzaSyBYkMl1dDDRSmAyHjKInEk9nCgb9-tDQqo",a="https://www.googleapis.com/webfonts/v1/webfonts",r=[],l=[],i=null,u=null,c=-1,d=!1;t.default={listLoaded:d,isLoading:c,fontsData:i,load:function(e,t){-1===l.indexOf(e)&&(document.getElementsByName("head").innerHTML='<link rel="stylesheet" href="//fonts.googleapis.com/css?family='+escape(e)+":"+t+'" >',l.push(e))},generateSelectList:function(){if(!i)return"";if(u)return u;var e="";return i.items.forEach(function(t){e+='<option value="'+t.family+'" data-variants="'+t.variants.join(",")+'">'+t.family+"</option>"}),u=e},getList:function(e){i&&e?e.call(null,i):1!==c?(c=1,(0,n.default)({url:a,method:"GET",data:{key:s}}).then(function(t,o){c=0,d=!0,i=t,e&&e.call(null,t,o.responseText),r.forEach(function(e){return e.call(null,t,o.responseText)})})):e&&r.push(e)},googleEarlyAccesFonts:function(){return[{name:"Alef Hebrew",title:"Alef Hebrew (Hebrew)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/alefhebrew.css"},{name:"Amiri",title:"Amiri (Arabic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/amiri.css"},{name:"Dhurjati",title:"Dhurjati (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/dhurjati.css"},{name:"Dhyana",title:"Dhyana (Lao)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/dhyana.css"},{name:"Droid Arabic Kufi",title:"Droid Arabic Kufi (Arabic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/droidarabickufi.css"},{name:"Droid Arabic Naskh",title:"Droid Arabic Naskh (Arabic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/droidarabicnaskh.css"},{name:"Droid Sans Ethiopic",title:"Droid Sans Ethiopic (Ethiopic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/droidsansethiopic.css"},{name:"Droid Sans Tamil",title:"Droid Sans Tamil (Tamil)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/droidsanstamil.css"},{name:"Droid Sans Thai",title:"Droid Sans Thai (Thai)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/droidsansthai.css"},{name:"Droid Serif Thai",title:"Droid Serif Thai (Thai)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/droidserifthai.css"},{name:"Gidugu",title:"Gidugu (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/gidugu.css"},{name:"Gurajada",title:"Gurajada (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/gurajada.css"},{name:"Hanna",title:"Hanna (Korean)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/hanna.css"},{name:"Jeju Gothic",title:"Jeju Gothic (Korean)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/jejugothic.css"},{name:"Jeju Hallasan",title:"Jeju Hallasan (Korean)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/jejuhallasan.css"},{name:"Jeju Myeongjo",title:"Jeju Myeongjo (Korean)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/jejumyeongjo.css"},{name:"Karla Tamil Inclined",title:"Karla Tamil Inclined (Tamil)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/karlatamilinclined.css"},{name:"Karla Tamil Upright",title:"Karla Tamil Upright (Tamil)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/karlatamilupright.css"},{name:"KoPub Batang",title:"KoPub Batang (Korean)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/kopubbatang.css"},{name:"Lakki Reddy",title:"Lakki Reddy (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/lakkireddy.css"},{name:"Lao Muang Don",title:"Lao Muang Don (Lao)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/laomuangdon.css"},{name:"Lao Muang Khong",title:"Lao Muang Khong (Lao)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/laomuangkhong.css"},{name:"Lao Sans Pro",title:"Lao Sans Pro (Lao)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/laosanspro.css"},{name:"Lateef",title:"Lateef (Arabic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/lateef.css"},{name:"Lohit Bengali",title:"Lohit Bengali (Bengali)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/lohitbengali.css"},{name:"Lohit Devanagari",title:"Lohit Devanagari (Hindi)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/lohitdevanagari.css"},{name:"Lohit Tamil",title:"Lohit Tamil (Tamil)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/lohittamil.css"},{name:"Mallanna",title:"Mallanna (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/mallanna.css"},{name:"Mandali",title:"Mandali (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/mandali.css"},{name:"Myanmar Sans Pro",title:"Myanmar Sans Pro (Myanmar)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/myanmarsanspro.css"},{name:"NATS",title:"NATS (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/nats.css"},{name:"NTR",title:"NTR (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/ntr.css"},{name:"Nanum Brush Script",title:"Nanum Brush Script (Korean)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/nanumbrushscript.css"},{name:"Nanum Gothic",title:"Nanum Gothic (Korean)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/nanumgothic.css"},{name:"Nanum Gothic Coding",title:"Nanum Gothic Coding (Korean)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/nanumgothiccoding.css"},{name:"Nanum Myeongjo",title:"Nanum Myeongjo (Korean)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/nanummyeongjo.css"},{name:"Nanum Pen Script",title:"Nanum Pen Script (Korean)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/nanumpenscript.css"},{name:"Noto Kufi Arabic",title:"Noto Kufi Arabic (Arabic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notokufiarabic.css"},{name:"Noto Naskh Arabic",title:"Noto Naskh Arabic (Arabic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notonaskharabic.css"},{name:"Noto Nastaliq Urdu Draft",title:"Noto Nastaliq Urdu Draft (Arabic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notonastaliqurdudraft.css"},{name:"Noto Sans Armenian",title:"Noto Sans Armenian (Armenian)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansarmenian.css"},{name:"Noto Sans Bengali",title:"Noto Sans Bengali (Bengali)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansbengali.css"},{name:"Noto Sans Cherokee",title:"Noto Sans Cherokee (Cherokee)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosanscherokee.css"},{name:"Noto Sans Devanagari",title:"Noto Sans Devanagari (Hindi)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansdevanagari.css"},{name:"Noto Sans Devanagari UI",title:"Noto Sans Devanagari UI (Hindi)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansdevanagariui.css"},{name:"Noto Sans Ethiopic",title:"Noto Sans Ethiopic (Ethiopic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansethiopic.css"},{name:"Noto Sans Georgian",title:"Noto Sans Georgian (Georgian)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansgeorgian.css"},{name:"Noto Sans Gujarati",title:"Noto Sans Gujarati (Gujarati)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansgujarati.css"},{name:"Noto Sans Gurmukhi",title:"Noto Sans Gurmukhi (Gurmukhi)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansgurmukhi.css"},{name:"Noto Sans Hebrew",title:"Noto Sans Hebrew (Hebrew)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosanshebrew.css"},{name:"Noto Sans Japanese",title:"Noto Sans Japanese (Japanese)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansjapanese.css"},{name:"Noto Sans Kannada",title:"Noto Sans Kannada (Kannada)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosanskannada.css"},{name:"Noto Sans Khmer",title:"Noto Sans Khmer (Khmer)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosanskhmer.css"},{name:"Noto Sans Kufi Arabic",title:"Noto Sans Kufi Arabic (Arabic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosanskufiarabic.css"},{name:"Noto Sans Lao",title:"Noto Sans Lao (Lao)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosanslao.css"},{name:"Noto Sans Lao UI",title:"Noto Sans Lao UI (Lao)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosanslaoui.css"},{name:"Noto Sans Malayalam",title:"Noto Sans Malayalam (Malayalam)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansmalayalam.css"},{name:"Noto Sans Myanmar",title:"Noto Sans Myanmar (Myanmar)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansmyanmar.css"},{name:"Noto Sans Osmanya",title:"Noto Sans Osmanya (Osmanya)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansosmanya.css"},{name:"Noto Sans Sinhala",title:"Noto Sans Sinhala (Sinhala)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosanssinhala.css"},{name:"Noto Sans Tamil",title:"Noto Sans Tamil (Tamil)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosanstamil.css"},{name:"Noto Sans Tamil UI",title:"Noto Sans Tamil UI (Tamil)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosanstamilui.css"},{name:"Noto Sans Telugu",title:"Noto Sans Telugu (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosanstelugu.css"},{name:"Noto Sans Thai",title:"Noto Sans Thai (Thai)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansthai.css"},{name:"Noto Sans Thai UI",title:"Noto Sans Thai UI (Thai)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notosansthaiui.css"},{name:"Noto Serif Armenian",title:"Noto Serif Armenian (Armenian)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notoserifarmenian.css"},{name:"Noto Serif Georgian",title:"Noto Serif Georgian (Georgian)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notoserifgeorgian.css"},{name:"Noto Serif Khmer",title:"Noto Serif Khmer (Khmer)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notoserifkhmer.css"},{name:"Noto Serif Lao",title:"Noto Serif Lao (Lao)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notoseriflao.css"},{name:"Noto Serif Thai",title:"Noto Serif Thai (Thai)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/notoserifthai.css"},{name:"Open Sans Hebrew",title:"Open Sans Hebrew (Hebrew)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/opensanshebrew.css"},{name:"Open Sans Hebrew Condensed",title:"Open Sans Hebrew Condensed (Hebrew)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/opensanshebrewcondensed.css"},{name:"Padauk",title:"Padauk (Myanmar)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/padauk.css"},{name:"Peddana",title:"Peddana (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/peddana.css"},{name:"Phetsarath",title:"Phetsarath (Lao)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/phetsarath.css"},{name:"Ponnala",title:"Ponnala (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/ponnala.css"},{name:"Ramabhadra",title:"Ramabhadra (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/ramabhadra.css"},{name:"Ravi Prakash",title:"Ravi Prakash (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/raviprakash.css"},{name:"Scheherazade",title:"Scheherazade (Arabic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/scheherazade.css"},{name:"Souliyo",title:"Souliyo (Lao)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/souliyo.css"},{name:"Sree Krushnadevaraya",title:"Sree Krushnadevaraya (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/sreekrushnadevaraya.css"},{name:"Suranna",title:"Suranna (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/suranna.css"},{name:"Suravaram",title:"Suravaram (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/suravaram.css"},{name:"Tenali Ramakrishna",title:"Tenali Ramakrishna (Telugu)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/tenaliramakrishna.css"},{name:"Thabit",title:"Thabit (Arabic)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/thabit.css"},{name:"Tharlon",title:"Tharlon (Myanmar)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/tharlon.css"},{name:"cwTeXFangSong",title:"cwTeXFangSong (Chinese_traditional)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/cwtexfangsong.css"},{name:"cwTeXHei",title:"cwTeXHei (Chinese-traditional)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/cwtexhei.css"},{name:"cwTeXKai",title:"cwTeXKai (Chinese_traditional)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/cwtexkai.css"},{name:"cwTeXMing",title:"cwTeXMing (Chinese_traditional)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/cwtexming.css"},{name:"cwTeXYen",title:"cwTeXYen (Chinese_traditional)",thickness:"400,700",url:"//fonts.googleapis.com/earlyaccess/cwtexyen.css"}]}}}});
//# sourceMappingURL=averta-option-controls.min.js.map
;