( function( api, $ ) {

    $(function(){
        $('.aux-devices li').on('click', function(e){
            wp.customize.previewedDevice.set($(e.currentTarget).data("device"));
        })
    });


    api.bind( 'ready', function() {
        //api.section.each( function ( section ) { console.log(section.contentContainer); } );

        $( ".aux-customizer-section-preview-link" ).on( "click", function( event ){
            event.preventDefault();
            api.previewer.previewUrl.set( $( event.currentTarget ).prop("href") );
        });

        $('.axi-devices-option').on('click', function(){
            var $this = $(this);
            $this.siblings().removeClass('axi-selected');
            $this.addClass('axi-selected');
            var device  = $this.data('select-device'),
                $parent = $this.parents('.axi-devices-option-wrapper'),
                option  = $parent.data('option-id'),
                selector;

            $parent.nextAll('[id$=' + option + ']').removeClass('device-option-visible').hide();

            if ( 'desktop' === device ) {
                $('#customize-control-' + option).addClass('device-option-visible').css('display', 'list-item', 'important');
            } else {
                $('#customize-control-' + option).hide();
                $('#customize-control-' + device + '_' + option).addClass('device-option-visible').css('display', 'list-item', 'important');
            }

        });

        // Extends our custom "example-1" section.
        api.sectionConstructor['auxin_link_section'] = api.Section.extend({
            // No events for this type of section.
            attachEvents: function () {},

            // Always make the section active.
            isContextuallyActive: function () {
                return true;
            }
        });

        // @if DEV
        /*
        api.control.each( function( control ) {
            if ( 'dropdown' === control.params.type ) {
            }
        } );
        */
        // @endif

    });
} )( wp.customize, jQuery );
