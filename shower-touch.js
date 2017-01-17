/**
 * @fileOverview
 * Touch events plugin for shower.
 */
shower.modules.define('shower-touch', [
    'util.extend'
], function (provide, extend) {

    var INTERACTIVE_ELEMENTS = [
        'VIDEO', 'AUDIO',
        'A', 'BUTTON', 'INPUT'
    ];

    var TOUCH_THRESHOLD = 50;

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

        this._state = {};

        this._setupListeners();
    }

    extend(Touch.prototype, /** @lends plugin.Touch.prototype */{

        destroy: function () {
            this._clearListeners();
            this._shower = null;
        },

        _setupListeners: function () {
            var shower = this._shower;

            this._showerListeners = shower.events.group()
                .on('add', this._onSlideAdd, this);

            this._bindedTouchStart = this._onTouchStart.bind(this);
            this._bindedTouchMove = this._onTouchMove.bind(this);
            this._bindedTouchEnd = this._onTouchEnd.bind(this);
            this._bindedTouchCancel = this._onTouchCancel.bind(this);

            this._shower.getSlides().forEach(this._addTouchStartListener, this);
            document.addEventListener('touchmove', this._bindedTouchMove, true);
            document.addEventListener('touchend', this._bindedTouchEnd, true);
            document.addEventListener('touchcancel', this._bindedTouchCancel, true);
        },

        _clearListeners: function () {
            this._showerListeners.offAll();
            this._shower.getSlides().forEach(this._removeTouchStartListener, this);
            document.removeEventListener('touchmove', this._bindedTouchMove, false);
            document.removeEventListener('touchend', this._bindedTouchEnd, false);
            document.removeEventListener('touchcancel', this._bindedTouchCancel, false);
        },

        _onSlideAdd: function (event) {
            var slide = event.get('slide');
            this._addTouchStartListener(slide);
        },

        _addTouchStartListener: function (slide) {
            var element = slide.layout.getElement();
            element.addEventListener('touchstart', this._bindedTouchStart, false);
        },

        _removeTouchStartListener: function (slide) {
            var element = slide.layout.getElement();
            element.removeEventListener('touchstart', this._bindedTouchStart, false);
        },

        _onTouchStart: function (e) {
            var shower = this._shower;
            var isSlideMode = shower.container.isSlideMode();
            var element = e.target;
            var slide = this._getSlideByElement(e.currentTarget);

            if (slide) {
                if (isSlideMode && !this._isInteractiveElement(element)) {
                    e.preventDefault();
                    this._state.active = true;
                    this._state.start = e.touches[0];
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

                if (this._state.active) {
                    this._state.last = e.touches[0];
                }
            }
        },

        _onTouchEnd: function () {
            var shower = this._shower;

            if (this._state.active) {
                if (this._isSwipeUp()) {
                    shower.container.exitSlideMode();
                } else {
                    if (this._state.start.pageX > window.innerWidth / 2) {
                        shower.player.next();
                    } else {
                        shower.player.prev();
                    }
                }

                this._state.active = false;
                this._state.start = null;
                this._state.last = null;
            }
        },

        _onTouchCancel: function () {
            if (this._state.active) {
                this._state.active = false;
                this._state.start = null;
                this._state.last = null;
            }
        },

        _getSlideByElement: function (element) {
            var slides = this._shower.getSlides();
            var result = null;

            for (var i = 0, k = slides.length; i < k; i++) {
                if (element.id === slides[i].getId()) {
                    result = this._shower.get(i);
                    break;
                }
            }

            return result;
        },

        _isInteractiveElement: function (element) {
            return INTERACTIVE_ELEMENTS.some(function (elName) {
                return elName === element.tagName;
            });
        },

        _isSwipeUp: function () {
            var isSwipeUp = false;

            if (this._state.active && this._state.last) {
                var deltaX = this._state.last.pageX - this._state.start.pageX;
                var deltaY = this._state.last.pageY - this._state.start.pageY;

                var absDeltaX = Math.abs(deltaX);
                var absDeltaY = Math.abs(deltaY);

                if (absDeltaY >= TOUCH_THRESHOLD && absDeltaY > absDeltaX && deltaY < 0) {
                    isSwipeUp = true;
                }
            }

            return isSwipeUp;
        }
    });

    provide(Touch);
});

shower.modules.require(['shower'], function (sh) {
    sh.plugins.add('shower-touch');
});
