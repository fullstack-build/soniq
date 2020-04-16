/*!
 * modernizr v3.5.0
 * Build https://modernizr.com/download?-audio-boxshadow-canvas-cssanimations-csscalc-csscolumns-cssgradients-csstransforms-csstransforms3d-csstransitions-flexbox-flexboxtweener-fullscreen-input-inputtypes-objectfit-svg-video-addtest-setclasses-shiv-testprop-dontmin
 *
 * Copyright (c)
 *  Faruk Ates
 *  Paul Irish
 *  Alex Sexton
 *  Ryan Seddon
 *  Patrick Kettner
 *  Stu Cox
 *  Richard Herrera
 * MIT License
 */
!function(window,document,undefined){function is(obj,type){return typeof obj===type}function testRunner(){var featureNames,feature,aliasIdx,result,nameIdx,featureName,featureNameSplit;for(var featureIdx in tests)if(tests.hasOwnProperty(featureIdx)){if(featureNames=[],feature=tests[featureIdx],feature.name&&(featureNames.push(feature.name.toLowerCase()),feature.options&&feature.options.aliases&&feature.options.aliases.length))for(aliasIdx=0;aliasIdx<feature.options.aliases.length;aliasIdx++)featureNames.push(feature.options.aliases[aliasIdx].toLowerCase());for(result=is(feature.fn,"function")?feature.fn():feature.fn,nameIdx=0;nameIdx<featureNames.length;nameIdx++)featureName=featureNames[nameIdx],featureNameSplit=featureName.split("."),1===featureNameSplit.length?Modernizr[featureNameSplit[0]]=result:(!Modernizr[featureNameSplit[0]]||Modernizr[featureNameSplit[0]]instanceof Boolean||(Modernizr[featureNameSplit[0]]=new Boolean(Modernizr[featureNameSplit[0]])),Modernizr[featureNameSplit[0]][featureNameSplit[1]]=result),classes.push((result?"":"no-")+featureNameSplit.join("-"))}}function setClasses(classes){var className=docElement.className,classPrefix=Modernizr._config.classPrefix||"";if(isSVG&&(className=className.baseVal),Modernizr._config.enableJSClass){var reJS=new RegExp("(^|\\s)"+classPrefix+"no-js(\\s|$)");className=className.replace(reJS,"$1"+classPrefix+"js$2")}Modernizr._config.enableClasses&&(className+=" "+classPrefix+classes.join(" "+classPrefix),isSVG?docElement.className.baseVal=className:docElement.className=className)}function addTest(feature,test){if("object"==typeof feature)for(var key in feature)hasOwnProp(feature,key)&&addTest(key,feature[key]);else{feature=feature.toLowerCase();var featureNameSplit=feature.split("."),last=Modernizr[featureNameSplit[0]];if(2==featureNameSplit.length&&(last=last[featureNameSplit[1]]),"undefined"!=typeof last)return Modernizr;test="function"==typeof test?test():test,1==featureNameSplit.length?Modernizr[featureNameSplit[0]]=test:(!Modernizr[featureNameSplit[0]]||Modernizr[featureNameSplit[0]]instanceof Boolean||(Modernizr[featureNameSplit[0]]=new Boolean(Modernizr[featureNameSplit[0]])),Modernizr[featureNameSplit[0]][featureNameSplit[1]]=test),setClasses([(test&&0!=test?"":"no-")+featureNameSplit.join("-")]),Modernizr._trigger(feature,test)}return Modernizr}function contains(str,substr){return!!~(""+str).indexOf(substr)}function createElement(){return"function"!=typeof document.createElement?document.createElement(arguments[0]):isSVG?document.createElementNS.call(document,"http://www.w3.org/2000/svg",arguments[0]):document.createElement.apply(document,arguments)}function getBody(){var body=document.body;return body||(body=createElement(isSVG?"svg":"body"),body.fake=!0),body}function injectElementWithStyles(rule,callback,nodes,testnames){var style,ret,node,docOverflow,mod="modernizr",div=createElement("div"),body=getBody();if(parseInt(nodes,10))for(;nodes--;)node=createElement("div"),node.id=testnames?testnames[nodes]:mod+(nodes+1),div.appendChild(node);return style=createElement("style"),style.type="text/css",style.id="s"+mod,(body.fake?body:div).appendChild(style),body.appendChild(div),style.styleSheet?style.styleSheet.cssText=rule:style.appendChild(document.createTextNode(rule)),div.id=mod,body.fake&&(body.style.background="",body.style.overflow="hidden",docOverflow=docElement.style.overflow,docElement.style.overflow="hidden",docElement.appendChild(body)),ret=callback(div,rule),body.fake?(body.parentNode.removeChild(body),docElement.style.overflow=docOverflow,docElement.offsetHeight):div.parentNode.removeChild(div),!!ret}function domToCSS(name){return name.replace(/([A-Z])/g,function(str,m1){return"-"+m1.toLowerCase()}).replace(/^ms-/,"-ms-")}function computedStyle(elem,pseudo,prop){var result;if("getComputedStyle"in window){result=getComputedStyle.call(window,elem,pseudo);var console=window.console;if(null!==result)prop&&(result=result.getPropertyValue(prop));else if(console){var method=console.error?"error":"log";console[method].call(console,"getComputedStyle returning null, its possible modernizr test results are inaccurate")}}else result=!pseudo&&elem.currentStyle&&elem.currentStyle[prop];return result}function nativeTestProps(props,value){var i=props.length;if("CSS"in window&&"supports"in window.CSS){for(;i--;)if(window.CSS.supports(domToCSS(props[i]),value))return!0;return!1}if("CSSSupportsRule"in window){for(var conditionText=[];i--;)conditionText.push("("+domToCSS(props[i])+":"+value+")");return conditionText=conditionText.join(" or "),injectElementWithStyles("@supports ("+conditionText+") { #modernizr { position: absolute; } }",function(node){return"absolute"==computedStyle(node,null,"position")})}return undefined}function cssToDOM(name){return name.replace(/([a-z])-([a-z])/g,function(str,m1,m2){return m1+m2.toUpperCase()}).replace(/^-/,"")}function testProps(props,prefixed,value,skipValueTest){function cleanElems(){afterInit&&(delete mStyle.style,delete mStyle.modElem)}if(skipValueTest=is(skipValueTest,"undefined")?!1:skipValueTest,!is(value,"undefined")){var result=nativeTestProps(props,value);if(!is(result,"undefined"))return result}for(var afterInit,i,propsLength,prop,before,elems=["modernizr","tspan","samp"];!mStyle.style&&elems.length;)afterInit=!0,mStyle.modElem=createElement(elems.shift()),mStyle.style=mStyle.modElem.style;for(propsLength=props.length,i=0;propsLength>i;i++)if(prop=props[i],before=mStyle.style[prop],contains(prop,"-")&&(prop=cssToDOM(prop)),mStyle.style[prop]!==undefined){if(skipValueTest||is(value,"undefined"))return cleanElems(),"pfx"==prefixed?prop:!0;try{mStyle.style[prop]=value}catch(e){}if(mStyle.style[prop]!=before)return cleanElems(),"pfx"==prefixed?prop:!0}return cleanElems(),!1}function fnBind(fn,that){return function(){return fn.apply(that,arguments)}}function testDOMProps(props,obj,elem){var item;for(var i in props)if(props[i]in obj)return elem===!1?props[i]:(item=obj[props[i]],is(item,"function")?fnBind(item,elem||obj):item);return!1}function testPropsAll(prop,prefixed,elem,value,skipValueTest){var ucProp=prop.charAt(0).toUpperCase()+prop.slice(1),props=(prop+" "+cssomPrefixes.join(ucProp+" ")+ucProp).split(" ");return is(prefixed,"string")||is(prefixed,"undefined")?testProps(props,prefixed,value,skipValueTest):(props=(prop+" "+domPrefixes.join(ucProp+" ")+ucProp).split(" "),testDOMProps(props,prefixed,elem))}function testAllProps(prop,value,skipValueTest){return testPropsAll(prop,undefined,undefined,value,skipValueTest)}var tests=[],ModernizrProto={_version:"3.5.0",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(test,cb){var self=this;setTimeout(function(){cb(self[test])},0)},addTest:function(name,fn,options){tests.push({name:name,fn:fn,options:options})},addAsyncTest:function(fn){tests.push({name:null,fn:fn})}},Modernizr=function(){};Modernizr.prototype=ModernizrProto,Modernizr=new Modernizr;var classes=[],docElement=document.documentElement,isSVG="svg"===docElement.nodeName.toLowerCase();isSVG||!function(window,document){function addStyleSheet(ownerDocument,cssText){var p=ownerDocument.createElement("p"),parent=ownerDocument.getElementsByTagName("head")[0]||ownerDocument.documentElement;return p.innerHTML="x<style>"+cssText+"</style>",parent.insertBefore(p.lastChild,parent.firstChild)}function getElements(){var elements=html5.elements;return"string"==typeof elements?elements.split(" "):elements}function addElements(newElements,ownerDocument){var elements=html5.elements;"string"!=typeof elements&&(elements=elements.join(" ")),"string"!=typeof newElements&&(newElements=newElements.join(" ")),html5.elements=elements+" "+newElements,shivDocument(ownerDocument)}function getExpandoData(ownerDocument){var data=expandoData[ownerDocument[expando]];return data||(data={},expanID++,ownerDocument[expando]=expanID,expandoData[expanID]=data),data}function createElement(nodeName,ownerDocument,data){if(ownerDocument||(ownerDocument=document),supportsUnknownElements)return ownerDocument.createElement(nodeName);data||(data=getExpandoData(ownerDocument));var node;return node=data.cache[nodeName]?data.cache[nodeName].cloneNode():saveClones.test(nodeName)?(data.cache[nodeName]=data.createElem(nodeName)).cloneNode():data.createElem(nodeName),!node.canHaveChildren||reSkip.test(nodeName)||node.tagUrn?node:data.frag.appendChild(node)}function createDocumentFragment(ownerDocument,data){if(ownerDocument||(ownerDocument=document),supportsUnknownElements)return ownerDocument.createDocumentFragment();data=data||getExpandoData(ownerDocument);for(var clone=data.frag.cloneNode(),i=0,elems=getElements(),l=elems.length;l>i;i++)clone.createElement(elems[i]);return clone}function shivMethods(ownerDocument,data){data.cache||(data.cache={},data.createElem=ownerDocument.createElement,data.createFrag=ownerDocument.createDocumentFragment,data.frag=data.createFrag()),ownerDocument.createElement=function(nodeName){return html5.shivMethods?createElement(nodeName,ownerDocument,data):data.createElem(nodeName)},ownerDocument.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+getElements().join().replace(/[\w\-:]+/g,function(nodeName){return data.createElem(nodeName),data.frag.createElement(nodeName),'c("'+nodeName+'")'})+");return n}")(html5,data.frag)}function shivDocument(ownerDocument){ownerDocument||(ownerDocument=document);var data=getExpandoData(ownerDocument);return!html5.shivCSS||supportsHtml5Styles||data.hasCSS||(data.hasCSS=!!addStyleSheet(ownerDocument,"article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}")),supportsUnknownElements||shivMethods(ownerDocument,data),ownerDocument}var supportsHtml5Styles,supportsUnknownElements,version="3.7.3",options=window.html5||{},reSkip=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,saveClones=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,expando="_html5shiv",expanID=0,expandoData={};!function(){try{var a=document.createElement("a");a.innerHTML="<xyz></xyz>",supportsHtml5Styles="hidden"in a,supportsUnknownElements=1==a.childNodes.length||function(){document.createElement("a");var frag=document.createDocumentFragment();return"undefined"==typeof frag.cloneNode||"undefined"==typeof frag.createDocumentFragment||"undefined"==typeof frag.createElement}()}catch(e){supportsHtml5Styles=!0,supportsUnknownElements=!0}}();var html5={elements:options.elements||"abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output picture progress section summary template time video",version:version,shivCSS:options.shivCSS!==!1,supportsUnknownElements:supportsUnknownElements,shivMethods:options.shivMethods!==!1,type:"default",shivDocument:shivDocument,createElement:createElement,createDocumentFragment:createDocumentFragment,addElements:addElements};window.html5=html5,shivDocument(document),"object"==typeof module&&module.exports&&(module.exports=html5)}("undefined"!=typeof window?window:this,document);var hasOwnProp;!function(){var _hasOwnProperty={}.hasOwnProperty;hasOwnProp=is(_hasOwnProperty,"undefined")||is(_hasOwnProperty.call,"undefined")?function(object,property){return property in object&&is(object.constructor.prototype[property],"undefined")}:function(object,property){return _hasOwnProperty.call(object,property)}}(),ModernizrProto._l={},ModernizrProto.on=function(feature,cb){this._l[feature]||(this._l[feature]=[]),this._l[feature].push(cb),Modernizr.hasOwnProperty(feature)&&setTimeout(function(){Modernizr._trigger(feature,Modernizr[feature])},0)},ModernizrProto._trigger=function(feature,res){if(this._l[feature]){var cbs=this._l[feature];setTimeout(function(){var i,cb;for(i=0;i<cbs.length;i++)(cb=cbs[i])(res)},0),delete this._l[feature]}},Modernizr._q.push(function(){ModernizrProto.addTest=addTest});var modElem={elem:createElement("modernizr")};Modernizr._q.push(function(){delete modElem.elem});var mStyle={style:modElem.elem.style};Modernizr._q.unshift(function(){delete mStyle.style});ModernizrProto.testProp=function(prop,value,useValue){return testProps([prop],undefined,value,useValue)};/*!
{
  "name" : "HTML5 Audio Element",
  "property": "audio",
  "tags" : ["html5", "audio", "media"]
}
!*/
Modernizr.addTest("audio",function(){var elem=createElement("audio"),bool=!1;try{bool=!!elem.canPlayType,bool&&(bool=new Boolean(bool),bool.ogg=elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),bool.mp3=elem.canPlayType('audio/mpeg; codecs="mp3"').replace(/^no$/,""),bool.opus=elem.canPlayType('audio/ogg; codecs="opus"')||elem.canPlayType('audio/webm; codecs="opus"').replace(/^no$/,""),bool.wav=elem.canPlayType('audio/wav; codecs="1"').replace(/^no$/,""),bool.m4a=(elem.canPlayType("audio/x-m4a;")||elem.canPlayType("audio/aac;")).replace(/^no$/,""))}catch(e){}return bool}),/*!
{
  "name": "Canvas",
  "property": "canvas",
  "caniuse": "canvas",
  "tags": ["canvas", "graphics"],
  "polyfills": ["flashcanvas", "excanvas", "slcanvas", "fxcanvas"]
}
!*/
Modernizr.addTest("canvas",function(){var elem=createElement("canvas");return!(!elem.getContext||!elem.getContext("2d"))});var omPrefixes="Moz O ms Webkit",cssomPrefixes=ModernizrProto._config.usePrefixes?omPrefixes.split(" "):[];ModernizrProto._cssomPrefixes=cssomPrefixes;var domPrefixes=ModernizrProto._config.usePrefixes?omPrefixes.toLowerCase().split(" "):[];ModernizrProto._domPrefixes=domPrefixes,ModernizrProto.testAllProps=testPropsAll;var atRule=function(prop){var rule,length=prefixes.length,cssrule=window.CSSRule;if("undefined"==typeof cssrule)return undefined;if(!prop)return!1;if(prop=prop.replace(/^@/,""),rule=prop.replace(/-/g,"_").toUpperCase()+"_RULE",rule in cssrule)return"@"+prop;for(var i=0;length>i;i++){var prefix=prefixes[i],thisRule=prefix.toUpperCase()+"_"+rule;if(thisRule in cssrule)return"@-"+prefix.toLowerCase()+"-"+prop}return!1};ModernizrProto.atRule=atRule;var prefixed=ModernizrProto.prefixed=function(prop,obj,elem){return 0===prop.indexOf("@")?atRule(prop):(-1!=prop.indexOf("-")&&(prop=cssToDOM(prop)),obj?testPropsAll(prop,obj,elem):testPropsAll(prop,"pfx"))};/*!
{
  "name": "Fullscreen API",
  "property": "fullscreen",
  "caniuse": "fullscreen",
  "notes": [{
    "name": "MDN documentation",
    "href": "https://developer.mozilla.org/en/API/Fullscreen"
  }],
  "polyfills": ["screenfulljs"],
  "builderAliases": ["fullscreen_api"]
}
!*/
Modernizr.addTest("fullscreen",!(!prefixed("exitFullscreen",document,!1)&&!prefixed("cancelFullScreen",document,!1)));var inputElem=createElement("input"),inputattrs="autocomplete autofocus list placeholder max min multiple pattern required step".split(" "),attrs={};Modernizr.input=function(props){for(var i=0,len=props.length;len>i;i++)attrs[props[i]]=!!(props[i]in inputElem);return attrs.list&&(attrs.list=!(!createElement("datalist")||!window.HTMLDataListElement)),attrs}(inputattrs);/*!
{
  "name": "Form input types",
  "property": "inputtypes",
  "caniuse": "forms",
  "tags": ["forms"],
  "authors": ["Mike Taylor"],
  "polyfills": [
    "jquerytools",
    "webshims",
    "h5f",
    "webforms2",
    "nwxforms",
    "fdslider",
    "html5slider",
    "galleryhtml5forms",
    "jscolor",
    "html5formshim",
    "selectedoptionsjs",
    "formvalidationjs"
  ]
}
!*/
var inputtypes="search tel url email datetime date month week time datetime-local number range color".split(" "),inputs={};Modernizr.inputtypes=function(props){for(var inputElemType,defaultView,bool,len=props.length,smile="1)",i=0;len>i;i++)inputElem.setAttribute("type",inputElemType=props[i]),bool="text"!==inputElem.type&&"style"in inputElem,bool&&(inputElem.value=smile,inputElem.style.cssText="position:absolute;visibility:hidden;",/^range$/.test(inputElemType)&&inputElem.style.WebkitAppearance!==undefined?(docElement.appendChild(inputElem),defaultView=document.defaultView,bool=defaultView.getComputedStyle&&"textfield"!==defaultView.getComputedStyle(inputElem,null).WebkitAppearance&&0!==inputElem.offsetHeight,docElement.removeChild(inputElem)):/^(search|tel)$/.test(inputElemType)||(bool=/^(url|email)$/.test(inputElemType)?inputElem.checkValidity&&inputElem.checkValidity()===!1:inputElem.value!=smile)),inputs[props[i]]=!!bool;return inputs}(inputtypes),/*!
{
  "name": "SVG",
  "property": "svg",
  "caniuse": "svg",
  "tags": ["svg"],
  "authors": ["Erik Dahlstrom"],
  "polyfills": [
    "svgweb",
    "raphael",
    "amplesdk",
    "canvg",
    "svg-boilerplate",
    "sie",
    "dojogfx",
    "fabricjs"
  ]
}
!*/
Modernizr.addTest("svg",!!document.createElementNS&&!!document.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect),/*!
{
  "name": "HTML5 Video",
  "property": "video",
  "caniuse": "video",
  "tags": ["html5"],
  "knownBugs": [
    "Without QuickTime, `Modernizr.video.h264` will be `undefined`; https://github.com/Modernizr/Modernizr/issues/546"
  ],
  "polyfills": [
    "html5media",
    "mediaelementjs",
    "sublimevideo",
    "videojs",
    "leanbackplayer",
    "videoforeverybody"
  ]
}
!*/
Modernizr.addTest("video",function(){var elem=createElement("video"),bool=!1;try{bool=!!elem.canPlayType,bool&&(bool=new Boolean(bool),bool.ogg=elem.canPlayType('video/ogg; codecs="theora"').replace(/^no$/,""),bool.h264=elem.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/,""),bool.webm=elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,""),bool.vp9=elem.canPlayType('video/webm; codecs="vp9"').replace(/^no$/,""),bool.hls=elem.canPlayType('application/x-mpegURL; codecs="avc1.42E01E"').replace(/^no$/,""))}catch(e){}return bool}),ModernizrProto.testAllProps=testAllProps,/*!
{
  "name": "CSS Animations",
  "property": "cssanimations",
  "caniuse": "css-animation",
  "polyfills": ["transformie", "csssandpaper"],
  "tags": ["css"],
  "warnings": ["Android < 4 will pass this test, but can only animate a single property at a time"],
  "notes": [{
    "name" : "Article: 'Dispelling the Android CSS animation myths'",
    "href": "https://goo.gl/OGw5Gm"
  }]
}
!*/
Modernizr.addTest("cssanimations",testAllProps("animationName","a",!0)),/*!
{
  "name": "Box Shadow",
  "property": "boxshadow",
  "caniuse": "css-boxshadow",
  "tags": ["css"],
  "knownBugs": [
    "WebOS false positives on this test.",
    "The Kindle Silk browser false positives"
  ]
}
!*/
Modernizr.addTest("boxshadow",testAllProps("boxShadow","1px 1px",!0)),/*!
{
  "name": "CSS Columns",
  "property": "csscolumns",
  "caniuse": "multicolumn",
  "polyfills": ["css3multicolumnjs"],
  "tags": ["css"]
}
!*/
function(){Modernizr.addTest("csscolumns",function(){var bool=!1,test=testAllProps("columnCount");try{bool=!!test,bool&&(bool=new Boolean(bool))}catch(e){}return bool});for(var name,test,props=["Width","Span","Fill","Gap","Rule","RuleColor","RuleStyle","RuleWidth","BreakBefore","BreakAfter","BreakInside"],i=0;i<props.length;i++)name=props[i].toLowerCase(),test=testAllProps("column"+props[i]),("breakbefore"===name||"breakafter"===name||"breakinside"==name)&&(test=test||testAllProps(props[i])),Modernizr.addTest("csscolumns."+name,test)}(),/*!
{
  "name": "Flexbox",
  "property": "flexbox",
  "caniuse": "flexbox",
  "tags": ["css"],
  "notes": [{
    "name": "The _new_ flexbox",
    "href": "http://dev.w3.org/csswg/css3-flexbox"
  }],
  "warnings": [
    "A `true` result for this detect does not imply that the `flex-wrap` property is supported; see the `flexwrap` detect."
  ]
}
!*/
Modernizr.addTest("flexbox",testAllProps("flexBasis","1px",!0));var prefixes=ModernizrProto._config.usePrefixes?" -webkit- -moz- -o- -ms- ".split(" "):["",""];ModernizrProto._prefixes=prefixes,/*!
{
  "name": "CSS Calc",
  "property": "csscalc",
  "caniuse": "calc",
  "tags": ["css"],
  "builderAliases": ["css_calc"],
  "authors": ["@calvein"]
}
!*/
Modernizr.addTest("csscalc",function(){var prop="width:",value="calc(10px);",el=createElement("a");return el.style.cssText=prop+prefixes.join(value+prop),!!el.style.length}),/*!
{
  "name": "Flexbox (tweener)",
  "property": "flexboxtweener",
  "tags": ["css"],
  "polyfills": ["flexie"],
  "notes": [{
    "name": "The _inbetween_ flexbox",
    "href": "https://www.w3.org/TR/2011/WD-css3-flexbox-20111129/"
  }],
  "warnings": ["This represents an old syntax, not the latest standard syntax."]
}
!*/
Modernizr.addTest("flexboxtweener",testAllProps("flexAlign","end",!0)),/*!
{
  "name": "CSS Gradients",
  "caniuse": "css-gradients",
  "property": "cssgradients",
  "tags": ["css"],
  "knownBugs": ["False-positives on webOS (https://github.com/Modernizr/Modernizr/issues/202)"],
  "notes": [{
    "name": "Webkit Gradient Syntax",
    "href": "https://webkit.org/blog/175/introducing-css-gradients/"
  },{
    "name": "Linear Gradient Syntax",
    "href": "https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient"
  },{
    "name": "W3C Gradient Spec",
    "href": "https://drafts.csswg.org/css-images-3/#gradients"
  }]
}
!*/
Modernizr.addTest("cssgradients",function(){for(var angle,str1="background-image:",str2="gradient(linear,left top,right bottom,from(#9f9),to(white));",css="",i=0,len=prefixes.length-1;len>i;i++)angle=0===i?"to ":"",css+=str1+prefixes[i]+"linear-gradient("+angle+"left top, #9f9, white);";Modernizr._config.usePrefixes&&(css+=str1+"-webkit-"+str2);var elem=createElement("a"),style=elem.style;return style.cssText=css,(""+style.backgroundImage).indexOf("gradient")>-1}),/*!
{
  "name": "CSS Transforms",
  "property": "csstransforms",
  "caniuse": "transforms2d",
  "tags": ["css"]
}
!*/
Modernizr.addTest("csstransforms",function(){return-1===navigator.userAgent.indexOf("Android 2.")&&testAllProps("transform","scale(1)",!0)});var testStyles=ModernizrProto.testStyles=injectElementWithStyles,newSyntax="CSS"in window&&"supports"in window.CSS,oldSyntax="supportsCSS"in window;Modernizr.addTest("supports",newSyntax||oldSyntax),/*!
{
  "name": "CSS Transforms 3D",
  "property": "csstransforms3d",
  "caniuse": "transforms3d",
  "tags": ["css"],
  "warnings": [
    "Chrome may occassionally fail this test on some systems; more info: https://code.google.com/p/chromium/issues/detail?id=129004"
  ]
}
!*/
Modernizr.addTest("csstransforms3d",function(){var ret=!!testAllProps("perspective","1px",!0),usePrefix=Modernizr._config.usePrefixes;if(ret&&(!usePrefix||"webkitPerspective"in docElement.style)){var mq,defaultStyle="#modernizr{width:0;height:0}";Modernizr.supports?mq="@supports (perspective: 1px)":(mq="@media (transform-3d)",usePrefix&&(mq+=",(-webkit-transform-3d)")),mq+="{#modernizr{width:7px;height:18px;margin:0;padding:0;border:0}}",testStyles(defaultStyle+mq,function(elem){ret=7===elem.offsetWidth&&18===elem.offsetHeight})}return ret}),/*!
{
  "name": "CSS Transitions",
  "property": "csstransitions",
  "caniuse": "css-transitions",
  "tags": ["css"]
}
!*/
Modernizr.addTest("csstransitions",testAllProps("transition","all",!0)),/*!
{
  "name": "CSS Object Fit",
  "caniuse": "object-fit",
  "property": "objectfit",
  "tags": ["css"],
  "builderAliases": ["css_objectfit"],
  "notes": [{
    "name": "Opera Article on Object Fit",
    "href": "https://dev.opera.com/articles/css3-object-fit-object-position/"
  }]
}
!*/
Modernizr.addTest("objectfit",!!prefixed("objectFit"),{aliases:["object-fit"]}),testRunner(),setClasses(classes),delete ModernizrProto.addTest,delete ModernizrProto.addAsyncTest;for(var i=0;i<Modernizr._q.length;i++)Modernizr._q[i]();window.Modernizr=Modernizr}(window,document),function(Modernizr){for(var name,value,prop,tests=[{name:"svg",value:"url(#test)"},{name:"inset",value:"inset(10px 20px 30px 40px)"},{name:"circle",value:"circle(60px at center)"},{name:"ellipse",value:"ellipse(50% 50% at 50% 50%)"},{name:"polygon",value:"polygon(50% 0%, 0% 100%, 100% 100%)"}],t=0;t<tests.length;t++)name=tests[t].name,value=tests[t].value,Modernizr.addTest("cssclippath"+name,function(){if("CSS"in window&&"supports"in window.CSS){for(var i=0;i<Modernizr._prefixes.length;i++)if(prop=Modernizr._prefixes[i]+"clip-path",window.CSS.supports(prop,value))return!0;return!1}return Modernizr.testStyles("#modernizr { "+Modernizr._prefixes.join("clip-path:"+value+"; ")+" }",function(elem){var style=getComputedStyle(elem),clip=style.clipPath;if(!clip||"none"==clip){clip=!1;for(var i=0;i<Modernizr._domPrefixes.length;i++)if(test=Modernizr._domPrefixes[i]+"ClipPath",style[test]&&"none"!==style[test]){clip=!0;break}}return Modernizr.testProp("clipPath")&&clip})})}(Modernizr);