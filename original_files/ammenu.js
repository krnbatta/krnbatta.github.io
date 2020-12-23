define([
    'jquery'
], function ($) {

    $.widget('amasty.megaMenu', {
        options: {
            hambStatus: 0,
            desktopStatus: 0,
            stickyStatus: 0,
            openClass: '-opened'
        },

        _create: function () {
            var self = this,
                isMobile = $(window).width() <= 1024 ? 1 : 0,
                isDesktop = self.options.desktopStatus,
                isHamb = self.options.hambStatus,
                isSticky = self.options.stickyStatus;

            $('[data-ammenu-js="menu-toggle"]').off('click').on('click', function () {
                self.toggleMenu();
            });

            if (!isHamb) {
                $('[data-ammenu-js="menu-overlay"]').on('swipeleft click', function () {
                    self.toggleMenu();
                });

                $('[data-ammenu-js="tab-content"]').on('swipeleft', function () {
                    self.toggleMenu();
                });

                if (isMobile) {
                    $(window).on('swiperight', function (e) {
                        var target = $(e.target);

                        if (e.swipestart.coords[0] < 50
                            && !target.parents().is('.ammenu-nav-sections')
                            && !target.is('.ammenu-nav-sections')) {
                            self.toggleMenu();
                        }
                    });
                }
            }

            if (isDesktop && isSticky) {
                var menu = $('[data-ammenu-js="desktop-menu"]'),
                    menuOffsetTop = menu.offset().top;

                $(window).on('scroll', function () {
                    menu.toggleClass('-sticky', window.pageYOffset >= menuOffsetTop);
                });
            }

            this.removeEmptyPageBuilderItems();
        },

        toggleMenu: function () {
            $('[data-ammenu-js="menu-toggle"]').toggleClass('-active');
            $('[data-ammenu-js="desktop-menu"]').toggleClass('-hide');
            $('[data-ammenu-js="nav-sections"]').toggleClass(this.options.openClass);
            $('[data-ammenu-js="menu-overlay"]').fadeToggle(50);
        },

        removeEmptyPageBuilderItems: function () {
            $('[data-ammenu-js="menu-submenu"]').each(function () {
                var element = $(this),
                    childsPageBuilder = element.find('[data-element="inner"]');

                if (childsPageBuilder.length) {
                    //remove empty child categories
                    $('[data-content-type="ammega_menu_widget"]').each(function () {
                        if (!$(this).children().length) {
                            $(this).remove();
                        }
                    });

                    var isEmpty = true;
                    $(childsPageBuilder).each(function () {
                        if ($(this).children().length) {
                            isEmpty = false;
                            return true;
                        }
                    });

                    if (isEmpty) {
                        element.remove();
                    }
                }
            });
        }
    });

    return $.amasty.megaMenu;
});
