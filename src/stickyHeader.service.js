(function() {
    'use strict';

    angular.module('xtable').factory('stickyHeaderFactory', stickyHeaderFactory);

    /* @ngInject */
    function stickyHeaderFactory($window) {

        function StickyHeader(settings) {
            this.clone = undefined;
            this.offset = parseInt(settings.offset, 10);
            this.table = settings.table;
            this.build = settings.buildFn;
            this.container = settings.container;
            this.thead = angular.element(this.table).find('thead');

            this.addListeners();
        }

        StickyHeader.prototype.addListeners = function() {
            $window.addEventListener('scroll', this.onScroll.bind(this));
            $window.addEventListener('resize', this.setWidth.bind(this));
        };

        StickyHeader.prototype.removeListeners = function() {
            $window.removeEventListener('scroll', this.onScroll);
            $window.removeEventListener('resize', this.setWidth);
        };

        StickyHeader.prototype.onScroll = function() {
            var headPos = this.thead[0].getBoundingClientRect().top;
            if (headPos <= this.offset) {
                this.makeClone();
            } else {
                this.destroyClone();
            }
        };

        StickyHeader.prototype.makeClone = function() {
            if (!this.clone) {
                this.clone = this.table.clone();
                var thead = angular.element('<thead></thead>');
                this.build(thead);
                this.clone
                    .addClass('sticky-clone')
                    .css({top: this.offset, 'pointer-events': 'none'})
                    .width(this.table.width())
                    .find('thead').replaceWith(thead);
                this.container.append(this.clone);
            }
        };

        StickyHeader.prototype.destroyClone = function() {
            if (this.clone) {
                this.clone.remove();
                this.clone = undefined;
            }
        };

        StickyHeader.prototype.setWidth = function() {
            if (this.clone) {
                this.clone.width(this.table.width());
            }
        };

        StickyHeader.prototype.destroy = function() {
            this.destroyClone();
            this.removeListeners();
        };

        return {
            create: function(settings) {
                return new StickyHeader(settings);
            }
        };
    }
})();
