;
/*! Auxin portfolio - v1.8.5 (2020-02-10)
 *  All required plugins 
 *  http://averta.net/phlox/
 */
/*! 
 * 
 * ================== public/assets/js/src/init.general.js =================== 
 **/
(function($){var filterList=$('.aux-widget-recent-portfolios .aux-ajax-filters li[data-filter]');filterList.on('click',function(e){e.preventDefault();var $this=$(this),$container=$this.parents('.aux-widget-recent-portfolios').find('.aux-ajax-view'),data={action:'aux_recent_portfolio_filter_content',term:$this.data('category-id'),taxonomy:$container.data('taxonomy'),num:$container.data('num'),order:$container.data('order'),orderby:$container.data('orderby'),n:$container.data('n'),args:eval($container.data('element-id')+'AjaxConfig')};$container.AuxIsotope('removeAll');$container.AuxIsotope('showLoading');$.post(auxpfo.ajax_url,data,function(res){if(res){var $data=$(res.data)
setTimeout(function(){$data.each(function(index,element){$item=$(element);if($item.hasClass('aux-iso-item')){$container.AuxIsotope('insert',$item);$item.AuxTwoWayHover();$item.photoSwipe({target:'.aux-lightbox-btn',bgOpacity:0.97,shareEl:true});}});},1000);}});});})(jQuery);