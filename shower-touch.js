/**
 * @fileOverview
 * Touch events plugin for shower.
 */
modules.define('shower-touch', [
    'util.extend',
    'util.bind'
], function (provide, extend, bind) {

    var INTERACTIVE_ELEMENTS = [
        'VIDEO', 'AUDIO', 
        'A', 'BUTTON', 'INPUT'
    ];

    /**
     * @class
     * Touch events plugin for shower.
     * @name plugin.Touch
     * @param {Shower} shower
     * @param {Object} [options] Plugin options.
     * @constructor
     */
    function Touch (shower, options) {
        options = options || {};
        this._shower = shower;

        // TODO: Gestures: pan, pinch, tap, swipe etc.
        // HammerJS?
        this._gestures = options.gestures;
    }

    extend(Touch.prototype, /** @lends plugin.Touch.prototype */{

        init: function () {
            this._setupListeners();
        },

        destroy: function () {
            this._clearListeners();
            this._shower = null;
        },

        _setupListeners: function () {
            var shower = this._shower;

            this._showerListeners = shower.events.group()
                .on('destroy', this.destroy, this);

            this._bindedTouchStart = bind(this._onTouchStart, this);
            this._bindedTouchMove = bind(this._onTouchMove.bind, this);

            document.addEventListener('touchstart', this._bindedTouchStart, false);
            document.addEventListener('touchmove', this._bindedTouchMove, false);
        },

        _clearListeners: function () {
            this._showerListeners.offAll();
            document.removeEventListener('touchstart', this._bindedTouchStart, false);
            document.removeEventListener('touchmove', this._bindedTouchMove, false);
        },

        _onTouchStart: function (e) {
            var shower = this._shower,
                isSlideMode = shower.container.isSlideMode(),
                element = e.target,
                slide = this._getSlideByElement(element),
                x;

            if (slide) {
                if (isSlideMode && !this._isInteractiveElement(element)) {
                    x = e.touches[0].pageX;
                    if (x > window.innerWidth / 2) {
                        shower.next();
                    } else {
                        shower.prev();
                    }
                }

                if (!isSlideMode) {
                    // Go && turn on slide mode.
                    slide.activate();
                }
            }
        },

        _onTouchMove: function (e) {
            if (this._shower.container.isSlideMode()) {
                e.preventDefault();
            }
        },

        _getSlideByElement: function (element) {
            var slides = this._shower.getSlidesArray(),
                result = null;

            for (var i = 0, k = slides.length; i < k; i++) {
                if (element.id == slides[i].getId()) {
                    result = this._shower.get(i);
                    break;
                }
            }

            return result;
        },

        _isInteractiveElement: function (element) {
            return INTERACTIVE_ELEMENTS.some(function (elName) { 
                return elName == element.tagName;
            });
        }
    });

    provide(Touch);
});

modules.require(['shower'], function (shower) {
    shower.plugins.add('shower-touch');
});
