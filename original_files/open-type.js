/**
 * Mobile SubMenu items open types
 */

define([
    'jquery',
    'mage/accordion',
    'mage/translate'
], function ($, accordion) {

    $.widget('amasty.menuOpenType', {
        options: {
            openType: 0,
            openClass: '-drill-opened',
            hamburgerStatus: false,
            closeClass: '-drill-closed',
            menu: '[data-ammenu-js="mobile-menu"]',
            menuItem: 'ammenu-item',
            menuItemMain: '-main',
            menuItems: '[data-ammenu-js="menu-items"]',
            menuLink: 'ammenu-link',
            collapseClass: '-collapsed',
            collapseContent: '[data-ammenu-js="collapse-content"]',
            collapseTrigger: '[data-ammenu-js="collapse-trigger"]',
            tabsCont: '[data-ammenu-js="tabs-container"]',
            submenuTrigger: '[data-ammenu-js="submenu-toggle"]',
            mainBtn: $('<button class="ammenu-drill-btn">' + $.mage.__("Main Menu") + '</button>'),
            drillDeep: '-deep',
            drillRight: '-slide-right',
            animateDelay: 50
        },

        _create: function () {
            var self = this,
                isMobile = $(window).width() <= 1024 ? 1 : 0,
                options = self.options,
                openType = options.openType,
                isHamburger = +options.hamburgerStatus;

            options.menu = isHamburger ? self.element.find(options.tabsCont) : self.element.find(options.menu);

            if (openType && isMobile) {
                self.element.addClass('-' + openType);
            }

            /**
             * Init
             * Showing submenu item from categories like drill
             */

            if (openType === 'drill' && isMobile) {
                self.element.find(options.collapseTrigger).click(function (e) {
                    self.drillToggle(e.target);
                });

                self.element.find(options.submenuTrigger).on('click', function (e) {
                    self.drillToggle(e.target);
                });

                options.mainBtn.click(function () {
                    options.mainBtn.hide();
                    self.drillMain();
                });

                options.menu.prepend(options.mainBtn);
            }

            /**
             * Init
             * Showing submenu item from categories like accordion
             */

            if (openType === 'accordion' ||
                openType === 'drill' && !isMobile) {
                var options = this.options;

                accordion({
                    animate: options.animateDelay,
                    closedState: options.collapseClass,
                    content: options.collapseContent,
                    collapsibleElement: options.collapseContent,
                    trigger: options.collapseTrigger,
                    collapsible: true,
                    active: false
                }, self.element.find(options.menuItems));

                $(options.submenuTrigger).on('click', function () {
                    $(this)
                        .toggleClass('-down')
                        .closest('.ammenu-wrapper').find('.' + options.menuItem).slideToggle(options.animateDelay);
                });
            }

            /**
             * Only on desktop menu
             * Showing submenu item from categories in blocks
             *
             */

            if (!isMobile) {
                var options = this.options,
                    margin = 20;

                $('[data-ammenu-js="parent-subitem"]')
                    .on('mouseenter', function () {
                        $(this).children('.' + options.menuLink).addClass('-hovered');
                        $(this).children('.' + options.menuItem + '.-child')
                            .css('left', ($(this).find('> .' + options.menuLink).outerWidth() + margin) + 'px').fadeIn(options.animateDelay);
                    })
                    .on('mouseleave', function () {
                        $(this).children('.' + options.menuLink).removeClass('-hovered');
                        $(this).children('.' + options.menuItem + '.-child').fadeOut(options.animateDelay);
                    });
            }
        },

        drillNext: function (element) {
            var options = this.options,
                item = $(element).closest('li');

            this.drillClear();

            if (!item.hasClass(options.menuItemMain)) {
                item.addClass(options.drillDeep);
                options.mainBtn.show();
            }

            options.menu.addClass(options.closeClass);
            item.addClass(options.openClass).addClass(options.drillRight);
            item.find('> .' + options.menuItem).show();
        },

        drillPrev: function (element) {
            var options = this.options,
                item = $(element).closest('.' + options.openClass),
                parentItem = item.parents('.' + options.drillDeep).length
                    ? item.parents('.' + options.drillDeep).first()
                    : item.parents('.' + options.menuItem + '.' + options.menuItemMain);

            this.drillClear();

            if (parentItem.hasClass(options.menuItemMain)) {
                options.mainBtn.hide();
            }

            item.find('> .' + options.menuItem).hide();
            parentItem.addClass(options.openClass);
        },

        drillMain: function () {
            var options = this.options;

            this.drillClear();

            options.mainBtn.hide();
            options.menu.removeClass(options.closeClass);
            options.menu.find('.' + options.drillDeep + '> .' + options.menuItem).hide();
        },


        drillToggle: function (element) {
            var options = this.options;

            if ($(element).closest('li').is('.' + options.menuItemMain + '.' + options.openClass)) {
                this.drillMain();

                return false;
            }

            if ($(element).closest('li').hasClass(options.openClass)) {
                this.drillPrev(element);

                return false;
            }

            this.drillNext(element);
        },

        drillClear: function () {
            var options = this.options;

            options.menu.find('.' + options.openClass).removeClass(options.openClass);
            options.menu.find('.' + options.drillRight).removeClass(options.drillRight);
        }
    });

    return $.amasty.menuOpenType;
});
