/**
 * Ajax install the Theme Core Plugin
 *
 */
(function($, window, document, undefined){
    "use strict";

    $(function(){

        $('.auxin-install-now').on( 'click', function( event ) {
            var $button = $( event.target );
            event.preventDefault();

            if ( $button.hasClass( 'updating-message' ) || $button.hasClass( 'button-disabled' ) ) {
                return;
            }

            /**
             * Install a plugin
             *
             * @return void
             */
            function installPlugin(){

                $.ajax({
                    url : $button.data('install-url'),
                    type: 'GET',
                    data: {},
                    beforeSend: function () {
                        buttonStatusInProgress( wp.updates.l10n.installingMsg );
                    },
                    success: function( reposnse ) {
                        buttonStatusInstalled( wp.updates.l10n.pluginInstalled );
                        activatePlugin();
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        // Installation failed
                        buttonStatusDisabled( wp.updates.l10n.installFailedShort );
                    }
                });
            }

            /**
             * Activate a plugin
             *
             * @return void
             */
            function activatePlugin(){

                $.ajax({
                    url : $button.data('activate-url'),
                    type: 'GET',
                    data: {},
                    beforeSend: function () {
                        buttonStatusInProgress( $button.data('activating-label') );
                    },
                    success: function( reposnse ) {
                        buttonStatusDisabled( wp.updates.l10n.installedMsg );
                        location.replace( $button.data('redirect-url') );
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        // Activation failed
                        console.log( xhr.responseText );
                        buttonStatusDisabled( wp.updates.l10n.unknownError );
                    }
                });
            }

            /**
             * Change button status to in-progress
             *
             * @return void
             */
            function buttonStatusInProgress( message ){
                $button.addClass('updating-message').removeClass('button-disabled aux-not-installed installed').text( message );
            }

            /**
             * Change button status to disabled
             *
             * @return void
             */
            function buttonStatusDisabled( message ){
                $button.removeClass('updating-message aux-not-installed installed')
                        .addClass('button-disabled')
                        .text( message );
            }

            /**
             * Change button status to installed
             *
             * @return void
             */
            function buttonStatusInstalled( message ){
                $button.removeClass('updating-message aux-not-installed')
                        .addClass('installed')
                        .text( message );
            }


            if( $button.data('action') === 'install' ){
                installPlugin();
            } else if( $button.data('action') === 'activate' ){
                activatePlugin();
            }

        });

    });

})(jQuery, window, document);
