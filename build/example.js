(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Example = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} [once=false] Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Hold the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var events = this._events
    , names = []
    , name;

  if (!events) return names;

  for (name in events) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(require,module,exports){
module.exports = function(strings) {
  if (typeof strings === 'string') strings = [strings]
  var exprs = [].slice.call(arguments,1)
  var parts = []
  for (var i = 0; i < strings.length-1; i++) {
    parts.push(strings[i], exprs[i] || '')
  }
  parts.push(strings[i])
  return parts.join('')
}

},{}],3:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WebVRManager = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Emitter = _dereq_('./emitter.js');
var Modes = _dereq_('./modes.js');
var Util = _dereq_('./util.js');

/**
 * Everything having to do with the WebVR button.
 * Emits a 'click' event when it's clicked.
 */
function ButtonManager(opt_root) {
  var root = opt_root || document.body;
  this.loadIcons_();

  // Make the fullscreen button.
  var fsButton = this.createButton();
  fsButton.src = this.ICONS.fullscreen;
  fsButton.title = 'Fullscreen mode';
  var s = fsButton.style;
  s.bottom = 0;
  s.right = 0;
  fsButton.addEventListener('click', this.createClickHandler_('fs'));
  root.appendChild(fsButton);
  this.fsButton = fsButton;

  // Make the VR button.
  var vrButton = this.createButton();
  vrButton.src = this.ICONS.cardboard;
  vrButton.title = 'Virtual reality mode';
  var s = vrButton.style;
  s.bottom = 0;
  s.right = '48px';
  vrButton.addEventListener('click', this.createClickHandler_('vr'));
  root.appendChild(vrButton);
  this.vrButton = vrButton;

  this.isVisible = true;

}
ButtonManager.prototype = new Emitter();

ButtonManager.prototype.createButton = function() {
  var button = document.createElement('img');
  button.className = 'webvr-button';
  var s = button.style;
  s.position = 'absolute';
  s.width = '24px'
  s.height = '24px';
  s.backgroundSize = 'cover';
  s.backgroundColor = 'transparent';
  s.border = 0;
  s.userSelect = 'none';
  s.webkitUserSelect = 'none';
  s.MozUserSelect = 'none';
  s.cursor = 'pointer';
  s.padding = '12px';
  s.zIndex = 1;
  s.display = 'none';
  s.boxSizing = 'content-box';

  // Prevent button from being selected and dragged.
  button.draggable = false;
  button.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });

  // Style it on hover.
  button.addEventListener('mouseenter', function(e) {
    s.filter = s.webkitFilter = 'drop-shadow(0 0 5px rgba(255,255,255,1))';
  });
  button.addEventListener('mouseleave', function(e) {
    s.filter = s.webkitFilter = '';
  });
  return button;
};

ButtonManager.prototype.setMode = function(mode, isVRCompatible) {
  isVRCompatible = isVRCompatible || WebVRConfig.FORCE_ENABLE_VR;
  if (!this.isVisible) {
    return;
  }
  switch (mode) {
    case Modes.NORMAL:
      this.fsButton.style.display = 'block';
      this.fsButton.src = this.ICONS.fullscreen;
      this.vrButton.style.display = (isVRCompatible ? 'block' : 'none');
      break;
    case Modes.MAGIC_WINDOW:
      this.fsButton.style.display = 'block';
      this.fsButton.src = this.ICONS.exitFullscreen;
      this.vrButton.style.display = 'none';
      break;
    case Modes.VR:
      this.fsButton.style.display = 'none';
      this.vrButton.style.display = 'none';
      break;
  }

  // Hack for Safari Mac/iOS to force relayout (svg-specific issue)
  // http://goo.gl/hjgR6r
  var oldValue = this.fsButton.style.display;
  this.fsButton.style.display = 'inline-block';
  this.fsButton.offsetHeight;
  this.fsButton.style.display = oldValue;
};

ButtonManager.prototype.setVisibility = function(isVisible) {
  this.isVisible = isVisible;
  this.fsButton.style.display = isVisible ? 'block' : 'none';
  this.vrButton.style.display = isVisible ? 'block' : 'none';
};

ButtonManager.prototype.createClickHandler_ = function(eventName) {
  return function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.emit(eventName);
  }.bind(this);
};

ButtonManager.prototype.loadIcons_ = function() {
  // Preload some hard-coded SVG.
  this.ICONS = {};
  this.ICONS.cardboard = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMjAuNzQgNkgzLjIxQzIuNTUgNiAyIDYuNTcgMiA3LjI4djEwLjQ0YzAgLjcuNTUgMS4yOCAxLjIzIDEuMjhoNC43OWMuNTIgMCAuOTYtLjMzIDEuMTQtLjc5bDEuNC0zLjQ4Yy4yMy0uNTkuNzktMS4wMSAxLjQ0LTEuMDFzMS4yMS40MiAxLjQ1IDEuMDFsMS4zOSAzLjQ4Yy4xOS40Ni42My43OSAxLjExLjc5aDQuNzljLjcxIDAgMS4yNi0uNTcgMS4yNi0xLjI4VjcuMjhjMC0uNy0uNTUtMS4yOC0xLjI2LTEuMjh6TTcuNSAxNC42MmMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTMgMS4xOCAwIDIuMTIuOTYgMi4xMiAyLjEzcy0uOTUgMi4xMi0yLjEyIDIuMTJ6bTkgMGMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTNzMi4xMi45NiAyLjEyIDIuMTMtLjk1IDIuMTItMi4xMiAyLjEyeiIvPgogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgwVjB6Ii8+Cjwvc3ZnPgo=');
  this.ICONS.fullscreen = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNyAxNEg1djVoNXYtMkg3di0zem0tMi00aDJWN2gzVjVINXY1em0xMiA3aC0zdjJoNXYtNWgtMnYzek0xNCA1djJoM3YzaDJWNWgtNXoiLz4KPC9zdmc+Cg==');
  this.ICONS.exitFullscreen = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNSAxNmgzdjNoMnYtNUg1djJ6bTMtOEg1djJoNVY1SDh2M3ptNiAxMWgydi0zaDN2LTJoLTV2NXptMi0xMVY1aC0ydjVoNVY4aC0zeiIvPgo8L3N2Zz4K');
  this.ICONS.settings = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMTkuNDMgMTIuOThjLjA0LS4zMi4wNy0uNjQuMDctLjk4cy0uMDMtLjY2LS4wNy0uOThsMi4xMS0xLjY1Yy4xOS0uMTUuMjQtLjQyLjEyLS42NGwtMi0zLjQ2Yy0uMTItLjIyLS4zOS0uMy0uNjEtLjIybC0yLjQ5IDFjLS41Mi0uNC0xLjA4LS43My0xLjY5LS45OGwtLjM4LTIuNjVDMTQuNDYgMi4xOCAxNC4yNSAyIDE0IDJoLTRjLS4yNSAwLS40Ni4xOC0uNDkuNDJsLS4zOCAyLjY1Yy0uNjEuMjUtMS4xNy41OS0xLjY5Ljk4bC0yLjQ5LTFjLS4yMy0uMDktLjQ5IDAtLjYxLjIybC0yIDMuNDZjLS4xMy4yMi0uMDcuNDkuMTIuNjRsMi4xMSAxLjY1Yy0uMDQuMzItLjA3LjY1LS4wNy45OHMuMDMuNjYuMDcuOThsLTIuMTEgMS42NWMtLjE5LjE1LS4yNC40Mi0uMTIuNjRsMiAzLjQ2Yy4xMi4yMi4zOS4zLjYxLjIybDIuNDktMWMuNTIuNCAxLjA4LjczIDEuNjkuOThsLjM4IDIuNjVjLjAzLjI0LjI0LjQyLjQ5LjQyaDRjLjI1IDAgLjQ2LS4xOC40OS0uNDJsLjM4LTIuNjVjLjYxLS4yNSAxLjE3LS41OSAxLjY5LS45OGwyLjQ5IDFjLjIzLjA5LjQ5IDAgLjYxLS4yMmwyLTMuNDZjLjEyLS4yMi4wNy0uNDktLjEyLS42NGwtMi4xMS0xLjY1ek0xMiAxNS41Yy0xLjkzIDAtMy41LTEuNTctMy41LTMuNXMxLjU3LTMuNSAzLjUtMy41IDMuNSAxLjU3IDMuNSAzLjUtMS41NyAzLjUtMy41IDMuNXoiLz4KPC9zdmc+Cg==');
};

module.exports = ButtonManager;

},{"./emitter.js":2,"./modes.js":3,"./util.js":4}],2:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function Emitter() {
  this.callbacks = {};
}

Emitter.prototype.emit = function(eventName) {
  var callbacks = this.callbacks[eventName];
  if (!callbacks) {
    //console.log('No valid callback specified.');
    return;
  }
  var args = [].slice.call(arguments);
  // Eliminate the first param (the callback).
  args.shift();
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i].apply(this, args);
  }
};

Emitter.prototype.on = function(eventName, callback) {
  if (eventName in this.callbacks) {
    this.callbacks[eventName].push(callback);
  } else {
    this.callbacks[eventName] = [callback];
  }
};

module.exports = Emitter;

},{}],3:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Modes = {
  UNKNOWN: 0,
  // Not fullscreen, just tracking.
  NORMAL: 1,
  // Magic window immersive mode.
  MAGIC_WINDOW: 2,
  // Full screen split screen VR mode.
  VR: 3,
};

module.exports = Modes;

},{}],4:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = {};

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.isFirefox = function() {
  return /firefox/i.test(navigator.userAgent);
};

Util.isIOS = function() {
  return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
};

Util.isIFrame = function() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

Util.appendQueryParameter = function(url, key, value) {
  // Determine delimiter based on if the URL already GET parameters in it.
  var delimiter = (url.indexOf('?') < 0 ? '?' : '&');
  url += delimiter + key + '=' + value;
  return url;
};

// From http://goo.gl/4WX3tg
Util.getQueryParameter = function(name) {
  var name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

Util.isLandscapeMode = function() {
  return (window.orientation == 90 || window.orientation == -90);
};

Util.getScreenWidth = function() {
  return Math.max(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.getScreenHeight = function() {
  return Math.min(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

module.exports = Util;

},{}],5:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ButtonManager = _dereq_('./button-manager.js');
var Emitter = _dereq_('./emitter.js');
var Modes = _dereq_('./modes.js');
var Util = _dereq_('./util.js');

/**
 * Helper for getting in and out of VR mode.
 */
function WebVRManager(renderer, effect, params) {
  this.params = params || {};
  this.mode = Modes.UNKNOWN;

  // Set option to hide the button.
  this.hideButton = this.params.hideButton || false;
  // Whether or not the FOV should be distorted or un-distorted. By default, it
  // should be distorted, but in the case of vertex shader based distortion,
  // ensure that we use undistorted parameters.
  this.predistorted = !!this.params.predistorted;

  // Save the THREE.js renderer and effect for later.
  this.renderer = renderer;
  this.effect = effect;
  var polyfillWrapper = document.querySelector('.webvr-polyfill-fullscreen-wrapper');
  this.button = new ButtonManager(polyfillWrapper);

  this.isFullscreenDisabled = !!Util.getQueryParameter('no_fullscreen');
  this.startMode = Modes.NORMAL;
  var startModeParam = parseInt(Util.getQueryParameter('start_mode'));
  if (!isNaN(startModeParam)) {
    this.startMode = startModeParam;
  }

  if (this.hideButton) {
    this.button.setVisibility(false);
  }

  // Check if the browser is compatible with WebVR.
  this.getDeviceByType_(VRDisplay).then(function(hmd) {
    this.hmd = hmd;
    // Only enable VR mode if there's a VR device attached or we are running the
    // polyfill on mobile.
    if (!this.isVRCompatibleOverride) {
      this.isVRCompatible =  !VRDisplay.isPolyfilled || Util.isMobile();
    }

    switch (this.startMode) {
      case Modes.MAGIC_WINDOW:
        this.setMode_(Modes.MAGIC_WINDOW);
        break;
      case Modes.VR:
        this.enterVRMode_();
        this.setMode_(Modes.VR);
        break;
      default:
        this.setMode_(Modes.NORMAL);
    }

    this.emit('initialized');
  }.bind(this));

  // Hook up button listeners.
  this.button.on('fs', this.onFSClick_.bind(this));
  this.button.on('vr', this.onVRClick_.bind(this));

  // Bind to fullscreen events.
  document.addEventListener('webkitfullscreenchange',
      this.onFullscreenChange_.bind(this));
  document.addEventListener('mozfullscreenchange',
      this.onFullscreenChange_.bind(this));
  document.addEventListener('msfullscreenchange',
      this.onFullscreenChange_.bind(this));

  // Bind to VR* specific events.
  window.addEventListener('vrdisplaypresentchange',
      this.onVRDisplayPresentChange_.bind(this));
  window.addEventListener('vrdisplaydeviceparamschange',
      this.onVRDisplayDeviceParamsChange_.bind(this));
}

WebVRManager.prototype = new Emitter();

// Expose these values externally.
WebVRManager.Modes = Modes;

WebVRManager.prototype.render = function(scene, camera, timestamp) {
  // Scene may be an array of two scenes, one for each eye.
  if (scene instanceof Array) {
    this.effect.render(scene[0], camera);
  } else {
    this.effect.render(scene, camera);
  }
};

WebVRManager.prototype.setVRCompatibleOverride = function(isVRCompatible) {
  this.isVRCompatible = isVRCompatible;
  this.isVRCompatibleOverride = true;

  // Don't actually change modes, just update the buttons.
  this.button.setMode(this.mode, this.isVRCompatible);
};

WebVRManager.prototype.setFullscreenCallback = function(callback) {
  this.fullscreenCallback = callback;
};

WebVRManager.prototype.setVRCallback = function(callback) {
  this.vrCallback = callback;
};

WebVRManager.prototype.setExitFullscreenCallback = function(callback) {
  this.exitFullscreenCallback = callback;
}

/**
 * Promise returns true if there is at least one HMD device available.
 */
WebVRManager.prototype.getDeviceByType_ = function(type) {
  return new Promise(function(resolve, reject) {
    navigator.getVRDisplays().then(function(displays) {
      // Promise succeeds, but check if there are any displays actually.
      for (var i = 0; i < displays.length; i++) {
        // console.log(displays[i], displays[i].constructor, type);
        // if (displays[i] instanceof type) {
          resolve(displays[i]);
        //   break;
        // }
      }
      resolve(null);
    }, function() {
      // No displays are found.
      resolve(null);
    });
  });
};

/**
 * Helper for entering VR mode.
 */
WebVRManager.prototype.enterVRMode_ = function() {
  this.hmd.requestPresent([{
    source: this.renderer.domElement,
    predistorted: this.predistorted
  }]);
};

WebVRManager.prototype.setMode_ = function(mode) {
  var oldMode = this.mode;
  if (mode == this.mode) {
    console.warn('Not changing modes, already in %s', mode);
    return;
  }
  // console.log('Mode change: %s => %s', this.mode, mode);
  this.mode = mode;
  this.button.setMode(mode, this.isVRCompatible);

  // Emit an event indicating the mode changed.
  this.emit('modechange', mode, oldMode);
};

/**
 * Main button was clicked.
 */
WebVRManager.prototype.onFSClick_ = function() {
  switch (this.mode) {
    case Modes.NORMAL:
      // TODO: Remove this hack if/when iOS gets real fullscreen mode.
      // If this is an iframe on iOS, break out and open in no_fullscreen mode.
      if (Util.isIOS() && Util.isIFrame()) {
        if (this.fullscreenCallback) {
          this.fullscreenCallback();
        } else {
          var url = window.location.href;
          url = Util.appendQueryParameter(url, 'no_fullscreen', 'true');
          url = Util.appendQueryParameter(url, 'start_mode', Modes.MAGIC_WINDOW);
          top.location.href = url;
          return;
        }
      }
      this.setMode_(Modes.MAGIC_WINDOW);
      this.requestFullscreen_();
      break;
    case Modes.MAGIC_WINDOW:
      if (this.isFullscreenDisabled) {
        window.history.back();
        return;
      }
      if (this.exitFullscreenCallback) {
        this.exitFullscreenCallback();
      }
      this.setMode_(Modes.NORMAL);
      this.exitFullscreen_();
      break;
  }
};

/**
 * The VR button was clicked.
 */
WebVRManager.prototype.onVRClick_ = function() {
  // TODO: Remove this hack when iOS has fullscreen mode.
  // If this is an iframe on iOS, break out and open in no_fullscreen mode.
  if (this.mode == Modes.NORMAL && Util.isIOS() && Util.isIFrame()) {
    if (this.vrCallback) {
      this.vrCallback();
    } else {
      var url = window.location.href;
      url = Util.appendQueryParameter(url, 'no_fullscreen', 'true');
      url = Util.appendQueryParameter(url, 'start_mode', Modes.VR);
      top.location.href = url;
      return;
    }
  }
  this.enterVRMode_();
};

WebVRManager.prototype.requestFullscreen_ = function() {
  var canvas = document.body;
  //var canvas = this.renderer.domElement;
  if (canvas.requestFullscreen) {
    canvas.requestFullscreen();
  } else if (canvas.mozRequestFullScreen) {
    canvas.mozRequestFullScreen();
  } else if (canvas.webkitRequestFullscreen) {
    canvas.webkitRequestFullscreen();
  } else if (canvas.msRequestFullscreen) {
    canvas.msRequestFullscreen();
  }
};

WebVRManager.prototype.exitFullscreen_ = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

WebVRManager.prototype.onVRDisplayPresentChange_ = function(e) {
  console.log('onVRDisplayPresentChange_', e);
  if (this.hmd.isPresenting) {
    this.setMode_(Modes.VR);
  } else {
    this.setMode_(Modes.NORMAL);
  }
};

WebVRManager.prototype.onVRDisplayDeviceParamsChange_ = function(e) {
  console.log('onVRDisplayDeviceParamsChange_', e);
};

WebVRManager.prototype.onFullscreenChange_ = function(e) {
  // If we leave full-screen, go back to normal mode.
  if (document.webkitFullscreenElement === null ||
      document.mozFullScreenElement === null) {
    this.setMode_(Modes.NORMAL);
  }
};

module.exports = WebVRManager;

},{"./button-manager.js":1,"./emitter.js":2,"./modes.js":3,"./util.js":4}]},{},[5])(5)
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],4:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WebVRPolyfill = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(_dereq_,module,exports){
'use strict';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],3:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');
var WakeLock = _dereq_('./wakelock.js');

// Start at a higher number to reduce chance of conflict.
var nextDisplayId = 1000;
var hasShowDeprecationWarning = false;

var defaultLeftBounds = [0, 0, 0.5, 1];
var defaultRightBounds = [0.5, 0, 0.5, 1];

/**
 * The base class for all VR frame data.
 */

function VRFrameData() {
  this.leftProjectionMatrix = new Float32Array(16);
  this.leftViewMatrix = new Float32Array(16);
  this.rightProjectionMatrix = new Float32Array(16);
  this.rightViewMatrix = new Float32Array(16);
  this.pose = null;
};

/**
 * The base class for all VR displays.
 */
function VRDisplay() {
  this.isPolyfilled = true;
  this.displayId = nextDisplayId++;
  this.displayName = 'webvr-polyfill displayName';

  this.depthNear = 0.01;
  this.depthFar = 10000.0;

  this.isConnected = true;
  this.isPresenting = false;
  this.capabilities = {
    hasPosition: false,
    hasOrientation: false,
    hasExternalDisplay: false,
    canPresent: false,
    maxLayers: 1
  };
  this.stageParameters = null;

  // "Private" members.
  this.waitingForPresent_ = false;
  this.layer_ = null;

  this.fullscreenElement_ = null;
  this.fullscreenWrapper_ = null;
  this.fullscreenElementCachedStyle_ = null;

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;

  this.wakelock_ = new WakeLock();
}

VRDisplay.prototype.getFrameData = function(frameData) {
  // TODO: Technically this should retain it's value for the duration of a frame
  // but I doubt that's practical to do in javascript.
  return Util.frameDataFromPose(frameData, this.getPose(), this);
};

VRDisplay.prototype.getPose = function() {
  // TODO: Technically this should retain it's value for the duration of a frame
  // but I doubt that's practical to do in javascript.
  return this.getImmediatePose();
};

VRDisplay.prototype.requestAnimationFrame = function(callback) {
  return window.requestAnimationFrame(callback);
};

VRDisplay.prototype.cancelAnimationFrame = function(id) {
  return window.cancelAnimationFrame(id);
};

VRDisplay.prototype.wrapForFullscreen = function(element) {
  // Don't wrap in iOS.
  if (Util.isIOS()) {
    return element;
  }
  if (!this.fullscreenWrapper_) {
    this.fullscreenWrapper_ = document.createElement('div');
    var cssProperties = [
      'height: ' + Math.min(screen.height, screen.width) + 'px !important',
      'top: 0 !important',
      'left: 0 !important',
      'right: 0 !important',
      'border: 0',
      'margin: 0',
      'padding: 0',
      'z-index: 999999 !important',
      'position: fixed',
    ];
    this.fullscreenWrapper_.setAttribute('style', cssProperties.join('; ') + ';');
    this.fullscreenWrapper_.classList.add('webvr-polyfill-fullscreen-wrapper');
  }

  if (this.fullscreenElement_ == element) {
    return this.fullscreenWrapper_;
  }

  // Remove any previously applied wrappers
  this.removeFullscreenWrapper();

  this.fullscreenElement_ = element;
  var parent = this.fullscreenElement_.parentElement;
  parent.insertBefore(this.fullscreenWrapper_, this.fullscreenElement_);
  parent.removeChild(this.fullscreenElement_);
  this.fullscreenWrapper_.insertBefore(this.fullscreenElement_, this.fullscreenWrapper_.firstChild);
  this.fullscreenElementCachedStyle_ = this.fullscreenElement_.getAttribute('style');

  var self = this;
  function applyFullscreenElementStyle() {
    if (!self.fullscreenElement_) {
      return;
    }

    var cssProperties = [
      'position: absolute',
      'top: 0',
      'left: 0',
      'width: ' + Math.max(screen.width, screen.height) + 'px',
      'height: ' + Math.min(screen.height, screen.width) + 'px',
      'border: 0',
      'margin: 0',
      'padding: 0',
    ];
    self.fullscreenElement_.setAttribute('style', cssProperties.join('; ') + ';');
  }

  applyFullscreenElementStyle();

  return this.fullscreenWrapper_;
};

VRDisplay.prototype.removeFullscreenWrapper = function() {
  if (!this.fullscreenElement_) {
    return;
  }

  var element = this.fullscreenElement_;
  if (this.fullscreenElementCachedStyle_) {
    element.setAttribute('style', this.fullscreenElementCachedStyle_);
  } else {
    element.removeAttribute('style');
  }
  this.fullscreenElement_ = null;
  this.fullscreenElementCachedStyle_ = null;

  var parent = this.fullscreenWrapper_.parentElement;
  this.fullscreenWrapper_.removeChild(element);
  parent.insertBefore(element, this.fullscreenWrapper_);
  parent.removeChild(this.fullscreenWrapper_);

  return element;
};

VRDisplay.prototype.requestPresent = function(layers) {
  var wasPresenting = this.isPresenting;
  var self = this;

  if (!(layers instanceof Array)) {
    if (!hasShowDeprecationWarning) {
      console.warn("Using a deprecated form of requestPresent. Should pass in an array of VRLayers.");
      hasShowDeprecationWarning = true;
    }
    layers = [layers];
  }

  return new Promise(function(resolve, reject) {
    if (!self.capabilities.canPresent) {
      reject(new Error('VRDisplay is not capable of presenting.'));
      return;
    }

    if (layers.length == 0 || layers.length > self.capabilities.maxLayers) {
      reject(new Error('Invalid number of layers.'));
      return;
    }

    var incomingLayer = layers[0];
    if (!incomingLayer.source) {
      /*
      todo: figure out the correct behavior if the source is not provided.
      see https://github.com/w3c/webvr/issues/58
      */
      resolve();
      return;
    }

    var leftBounds = incomingLayer.leftBounds || defaultLeftBounds;
    var rightBounds = incomingLayer.rightBounds || defaultRightBounds;
    if (wasPresenting) {
      // Already presenting, just changing configuration
      var layer = self.layer_;
      if (layer.source !== incomingLayer.source) {
        layer.source = incomingLayer.source;
      }

      for (var i = 0; i < 4; i++) {
        if (layer.leftBounds[i] !== leftBounds[i]) {
          layer.leftBounds[i] = leftBounds[i];
        }
        if (layer.rightBounds[i] !== rightBounds[i]) {
          layer.rightBounds[i] = rightBounds[i];
        }
      }

      resolve();
      return;
    }

    // Was not already presenting.
    self.layer_ = {
      predistorted: incomingLayer.predistorted,
      source: incomingLayer.source,
      leftBounds: leftBounds.slice(0),
      rightBounds: rightBounds.slice(0)
    };

    self.waitingForPresent_ = false;
    if (self.layer_ && self.layer_.source) {
      var fullscreenElement = self.wrapForFullscreen(self.layer_.source);

      function onFullscreenChange() {
        var actualFullscreenElement = Util.getFullscreenElement();

        self.isPresenting = (fullscreenElement === actualFullscreenElement);
        if (self.isPresenting) {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape-primary').catch(function(error){
                    console.error('screen.orientation.lock() failed due to', error.message)
            });
          }
          self.waitingForPresent_ = false;
          self.beginPresent_();
          resolve();
        } else {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
          self.removeFullscreenWrapper();
          self.wakelock_.release();
          self.endPresent_();
          self.removeFullscreenListeners_();
        }
        self.fireVRDisplayPresentChange_();
      }
      function onFullscreenError() {
        if (!self.waitingForPresent_) {
          return;
        }

        self.removeFullscreenWrapper();
        self.removeFullscreenListeners_();

        self.wakelock_.release();
        self.waitingForPresent_ = false;
        self.isPresenting = false;

        reject(new Error('Unable to present.'));
      }

      self.addFullscreenListeners_(fullscreenElement,
          onFullscreenChange, onFullscreenError);

      if (Util.requestFullscreen(fullscreenElement)) {
        self.wakelock_.request();
        self.waitingForPresent_ = true;
      } else if (Util.isIOS()) {
        // *sigh* Just fake it.
        self.wakelock_.request();
        self.isPresenting = true;
        self.beginPresent_();
        self.fireVRDisplayPresentChange_();
        resolve();
      }
    }

    if (!self.waitingForPresent_ && !Util.isIOS()) {
      Util.exitFullscreen();
      reject(new Error('Unable to present.'));
    }
  });
};

VRDisplay.prototype.exitPresent = function() {
  var wasPresenting = this.isPresenting;
  var self = this;
  this.isPresenting = false;
  this.layer_ = null;
  this.wakelock_.release();

  return new Promise(function(resolve, reject) {
    if (wasPresenting) {
      if (!Util.exitFullscreen() && Util.isIOS()) {
        self.endPresent_();
        self.fireVRDisplayPresentChange_();
      }

      resolve();
    } else {
      reject(new Error('Was not presenting to VRDisplay.'));
    }
  });
};

VRDisplay.prototype.getLayers = function() {
  if (this.layer_) {
    return [this.layer_];
  }
  return [];
};

VRDisplay.prototype.fireVRDisplayPresentChange_ = function() {
  var event = new CustomEvent('vrdisplaypresentchange', {detail: {display: this}});
  window.dispatchEvent(event);
};

VRDisplay.prototype.addFullscreenListeners_ = function(element, changeHandler, errorHandler) {
  this.removeFullscreenListeners_();

  this.fullscreenEventTarget_ = element;
  this.fullscreenChangeHandler_ = changeHandler;
  this.fullscreenErrorHandler_ = errorHandler;

  if (changeHandler) {
    if (document.fullscreenEnabled) {
      element.addEventListener('fullscreenchange', changeHandler, false);
    } else if (document.webkitFullscreenEnabled) {
      element.addEventListener('webkitfullscreenchange', changeHandler, false);
    } else if (document.mozFullScreenEnabled) {
      document.addEventListener('mozfullscreenchange', changeHandler, false);
    } else if (document.msFullscreenEnabled) {
      element.addEventListener('msfullscreenchange', changeHandler, false);
    }
  }

  if (errorHandler) {
    if (document.fullscreenEnabled) {
      element.addEventListener('fullscreenerror', errorHandler, false);
    } else if (document.webkitFullscreenEnabled) {
      element.addEventListener('webkitfullscreenerror', errorHandler, false);
    } else if (document.mozFullScreenEnabled) {
      document.addEventListener('mozfullscreenerror', errorHandler, false);
    } else if (document.msFullscreenEnabled) {
      element.addEventListener('msfullscreenerror', errorHandler, false);
    }
  }
};

VRDisplay.prototype.removeFullscreenListeners_ = function() {
  if (!this.fullscreenEventTarget_)
    return;

  var element = this.fullscreenEventTarget_;

  if (this.fullscreenChangeHandler_) {
    var changeHandler = this.fullscreenChangeHandler_;
    element.removeEventListener('fullscreenchange', changeHandler, false);
    element.removeEventListener('webkitfullscreenchange', changeHandler, false);
    document.removeEventListener('mozfullscreenchange', changeHandler, false);
    element.removeEventListener('msfullscreenchange', changeHandler, false);
  }

  if (this.fullscreenErrorHandler_) {
    var errorHandler = this.fullscreenErrorHandler_;
    element.removeEventListener('fullscreenerror', errorHandler, false);
    element.removeEventListener('webkitfullscreenerror', errorHandler, false);
    document.removeEventListener('mozfullscreenerror', errorHandler, false);
    element.removeEventListener('msfullscreenerror', errorHandler, false);
  }

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;
};

VRDisplay.prototype.beginPresent_ = function() {
  // Override to add custom behavior when presentation begins.
};

VRDisplay.prototype.endPresent_ = function() {
  // Override to add custom behavior when presentation ends.
};

VRDisplay.prototype.submitFrame = function(pose) {
  // Override to add custom behavior for frame submission.
};

VRDisplay.prototype.getEyeParameters = function(whichEye) {
  // Override to return accurate eye parameters if canPresent is true.
  return null;
};

/*
 * Deprecated classes
 */

/**
 * The base class for all VR devices. (Deprecated)
 */
function VRDevice() {
  this.isPolyfilled = true;
  this.hardwareUnitId = 'webvr-polyfill hardwareUnitId';
  this.deviceId = 'webvr-polyfill deviceId';
  this.deviceName = 'webvr-polyfill deviceName';
}

/**
 * The base class for all VR HMD devices. (Deprecated)
 */
function HMDVRDevice() {
}
HMDVRDevice.prototype = new VRDevice();

/**
 * The base class for all VR position sensor devices. (Deprecated)
 */
function PositionSensorVRDevice() {
}
PositionSensorVRDevice.prototype = new VRDevice();

module.exports.VRFrameData = VRFrameData;
module.exports.VRDisplay = VRDisplay;
module.exports.VRDevice = VRDevice;
module.exports.HMDVRDevice = HMDVRDevice;
module.exports.PositionSensorVRDevice = PositionSensorVRDevice;

},{"./util.js":22,"./wakelock.js":24}],4:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var CardboardUI = _dereq_('./cardboard-ui.js');
var Util = _dereq_('./util.js');
var WGLUPreserveGLState = _dereq_('./deps/wglu-preserve-state.js');

var distortionVS = [
  'attribute vec2 position;',
  'attribute vec3 texCoord;',

  'varying vec2 vTexCoord;',

  'uniform vec4 viewportOffsetScale[2];',

  'void main() {',
  '  vec4 viewport = viewportOffsetScale[int(texCoord.z)];',
  '  vTexCoord = (texCoord.xy * viewport.zw) + viewport.xy;',
  '  gl_Position = vec4( position, 1.0, 1.0 );',
  '}',
].join('\n');

var distortionFS = [
  'precision mediump float;',
  'uniform sampler2D diffuse;',

  'varying vec2 vTexCoord;',

  'void main() {',
  '  gl_FragColor = texture2D(diffuse, vTexCoord);',
  '}',
].join('\n');

/**
 * A mesh-based distorter.
 */
function CardboardDistorter(gl) {
  this.gl = gl;
  this.ctxAttribs = gl.getContextAttributes();

  this.meshWidth = 20;
  this.meshHeight = 20;

  this.bufferScale = WebVRConfig.BUFFER_SCALE;

  this.bufferWidth = gl.drawingBufferWidth;
  this.bufferHeight = gl.drawingBufferHeight;

  // Patching support
  this.realBindFramebuffer = gl.bindFramebuffer;
  this.realEnable = gl.enable;
  this.realDisable = gl.disable;
  this.realColorMask = gl.colorMask;
  this.realClearColor = gl.clearColor;
  this.realViewport = gl.viewport;

  if (!Util.isIOS()) {
    this.realCanvasWidth = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'width');
    this.realCanvasHeight = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'height');
  }

  this.isPatched = false;

  // State tracking
  this.lastBoundFramebuffer = null;
  this.cullFace = false;
  this.depthTest = false;
  this.blend = false;
  this.scissorTest = false;
  this.stencilTest = false;
  this.viewport = [0, 0, 0, 0];
  this.colorMask = [true, true, true, true];
  this.clearColor = [0, 0, 0, 0];

  this.attribs = {
    position: 0,
    texCoord: 1
  };
  this.program = Util.linkProgram(gl, distortionVS, distortionFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.viewportOffsetScale = new Float32Array(8);
  this.setTextureBounds();

  this.vertexBuffer = gl.createBuffer();
  this.indexBuffer = gl.createBuffer();
  this.indexCount = 0;

  this.renderTarget = gl.createTexture();
  this.framebuffer = gl.createFramebuffer();

  this.depthStencilBuffer = null;
  this.depthBuffer = null;
  this.stencilBuffer = null;

  if (this.ctxAttribs.depth && this.ctxAttribs.stencil) {
    this.depthStencilBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.depth) {
    this.depthBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.stencil) {
    this.stencilBuffer = gl.createRenderbuffer();
  }

  this.patch();

  this.onResize();

  if (!WebVRConfig.CARDBOARD_UI_DISABLED) {
    this.cardboardUI = new CardboardUI(gl);
  }
};

/**
 * Tears down all the resources created by the distorter and removes any
 * patches.
 */
CardboardDistorter.prototype.destroy = function() {
  var gl = this.gl;

  this.unpatch();

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
  gl.deleteBuffer(this.indexBuffer);
  gl.deleteTexture(this.renderTarget);
  gl.deleteFramebuffer(this.framebuffer);
  if (this.depthStencilBuffer) {
    gl.deleteRenderbuffer(this.depthStencilBuffer);
  }
  if (this.depthBuffer) {
    gl.deleteRenderbuffer(this.depthBuffer);
  }
  if (this.stencilBuffer) {
    gl.deleteRenderbuffer(this.stencilBuffer);
  }

  if (this.cardboardUI) {
    this.cardboardUI.destroy();
  }
};


/**
 * Resizes the backbuffer to match the canvas width and height.
 */
CardboardDistorter.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.RENDERBUFFER_BINDING,
    gl.TEXTURE_BINDING_2D, gl.TEXTURE0
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind real backbuffer and clear it once. We don't need to clear it again
    // after that because we're overwriting the same area every frame.
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Put things in a good state
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    self.realClearColor.call(gl, 0, 0, 0, 1);

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Now bind and resize the fake backbuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.framebuffer);

    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);
    gl.texImage2D(gl.TEXTURE_2D, 0, self.ctxAttribs.alpha ? gl.RGBA : gl.RGB,
        self.bufferWidth, self.bufferHeight, 0,
        self.ctxAttribs.alpha ? gl.RGBA : gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, self.renderTarget, 0);

    if (self.ctxAttribs.depth && self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthStencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.depthStencilBuffer);
    } else if (self.ctxAttribs.depth) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
          gl.RENDERBUFFER, self.depthBuffer);
    } else if (self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.stencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.stencilBuffer);
    }

    if (!gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer incomplete!');
    }

    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);

    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    self.realClearColor.apply(gl, self.clearColor);
  });

  if (this.cardboardUI) {
    this.cardboardUI.onResize();
  }
};

CardboardDistorter.prototype.patch = function() {
  if (this.isPatched) {
    return;
  }

  var self = this;
  var canvas = this.gl.canvas;
  var gl = this.gl;

  if (!Util.isIOS()) {
    canvas.width = Util.getScreenWidth() * this.bufferScale;
    canvas.height = Util.getScreenHeight() * this.bufferScale;

    Object.defineProperty(canvas, 'width', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferWidth;
      },
      set: function(value) {
        self.bufferWidth = value;
        self.realCanvasWidth.set.call(canvas, value);
        self.onResize();
      }
    });

    Object.defineProperty(canvas, 'height', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferHeight;
      },
      set: function(value) {
        self.bufferHeight = value;
        self.realCanvasHeight.set.call(canvas, value);
        self.onResize();
      }
    });
  }

  this.lastBoundFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  if (this.lastBoundFramebuffer == null) {
    this.lastBoundFramebuffer = this.framebuffer;
    this.gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  }

  this.gl.bindFramebuffer = function(target, framebuffer) {
    self.lastBoundFramebuffer = framebuffer ? framebuffer : self.framebuffer;
    // Silently make calls to bind the default framebuffer bind ours instead.
    self.realBindFramebuffer.call(gl, target, self.lastBoundFramebuffer);
  };

  this.cullFace = gl.getParameter(gl.CULL_FACE);
  this.depthTest = gl.getParameter(gl.DEPTH_TEST);
  this.blend = gl.getParameter(gl.BLEND);
  this.scissorTest = gl.getParameter(gl.SCISSOR_TEST);
  this.stencilTest = gl.getParameter(gl.STENCIL_TEST);

  gl.enable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = true; break;
      case gl.DEPTH_TEST: self.depthTest = true; break;
      case gl.BLEND: self.blend = true; break;
      case gl.SCISSOR_TEST: self.scissorTest = true; break;
      case gl.STENCIL_TEST: self.stencilTest = true; break;
    }
    self.realEnable.call(gl, pname);
  };

  gl.disable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = false; break;
      case gl.DEPTH_TEST: self.depthTest = false; break;
      case gl.BLEND: self.blend = false; break;
      case gl.SCISSOR_TEST: self.scissorTest = false; break;
      case gl.STENCIL_TEST: self.stencilTest = false; break;
    }
    self.realDisable.call(gl, pname);
  };

  this.colorMask = gl.getParameter(gl.COLOR_WRITEMASK);
  gl.colorMask = function(r, g, b, a) {
    self.colorMask[0] = r;
    self.colorMask[1] = g;
    self.colorMask[2] = b;
    self.colorMask[3] = a;
    self.realColorMask.call(gl, r, g, b, a);
  };

  this.clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
  gl.clearColor = function(r, g, b, a) {
    self.clearColor[0] = r;
    self.clearColor[1] = g;
    self.clearColor[2] = b;
    self.clearColor[3] = a;
    self.realClearColor.call(gl, r, g, b, a);
  };

  this.viewport = gl.getParameter(gl.VIEWPORT);
  gl.viewport = function(x, y, w, h) {
    self.viewport[0] = x;
    self.viewport[1] = y;
    self.viewport[2] = w;
    self.viewport[3] = h;
    self.realViewport.call(gl, x, y, w, h);
  };

  this.isPatched = true;
  Util.safariCssSizeWorkaround(canvas);
};

CardboardDistorter.prototype.unpatch = function() {
  if (!this.isPatched) {
    return;
  }

  var gl = this.gl;
  var canvas = this.gl.canvas;

  if (!Util.isIOS()) {
    Object.defineProperty(canvas, 'width', this.realCanvasWidth);
    Object.defineProperty(canvas, 'height', this.realCanvasHeight);
  }
  canvas.width = this.bufferWidth;
  canvas.height = this.bufferHeight;

  gl.bindFramebuffer = this.realBindFramebuffer;
  gl.enable = this.realEnable;
  gl.disable = this.realDisable;
  gl.colorMask = this.realColorMask;
  gl.clearColor = this.realClearColor;
  gl.viewport = this.realViewport;

  // Check to see if our fake backbuffer is bound and bind the real backbuffer
  // if that's the case.
  if (this.lastBoundFramebuffer == this.framebuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  this.isPatched = false;

  setTimeout(function() {
    Util.safariCssSizeWorkaround(canvas);
  }, 1);
};

CardboardDistorter.prototype.setTextureBounds = function(leftBounds, rightBounds) {
  if (!leftBounds) {
    leftBounds = [0, 0, 0.5, 1];
  }

  if (!rightBounds) {
    rightBounds = [0.5, 0, 0.5, 1];
  }

  // Left eye
  this.viewportOffsetScale[0] = leftBounds[0]; // X
  this.viewportOffsetScale[1] = leftBounds[1]; // Y
  this.viewportOffsetScale[2] = leftBounds[2]; // Width
  this.viewportOffsetScale[3] = leftBounds[3]; // Height

  // Right eye
  this.viewportOffsetScale[4] = rightBounds[0]; // X
  this.viewportOffsetScale[5] = rightBounds[1]; // Y
  this.viewportOffsetScale[6] = rightBounds[2]; // Width
  this.viewportOffsetScale[7] = rightBounds[3]; // Height
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardDistorter.prototype.submitFrame = function() {
  var gl = this.gl;
  var self = this;

  var glState = [];

  if (!WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
    glState.push(
      gl.CURRENT_PROGRAM,
      gl.ARRAY_BUFFER_BINDING,
      gl.ELEMENT_ARRAY_BUFFER_BINDING,
      gl.TEXTURE_BINDING_2D, gl.TEXTURE0
    );
  }

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind the real default framebuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Make sure the GL state is in a good place
    if (self.cullFace) { self.realDisable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realDisable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realDisable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realDisable.call(gl, gl.STENCIL_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // If the backbuffer has an alpha channel clear every frame so the page
    // doesn't show through.
    if (self.ctxAttribs.alpha || Util.isIOS()) {
      self.realClearColor.call(gl, 0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // Bind distortion program and mesh
    gl.useProgram(self.program);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.enableVertexAttribArray(self.attribs.position);
    gl.enableVertexAttribArray(self.attribs.texCoord);
    gl.vertexAttribPointer(self.attribs.position, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(self.attribs.texCoord, 3, gl.FLOAT, false, 20, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(self.uniforms.diffuse, 0);
    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);

    gl.uniform4fv(self.uniforms.viewportOffsetScale, self.viewportOffsetScale);

    // Draws both eyes
    gl.drawElements(gl.TRIANGLES, self.indexCount, gl.UNSIGNED_SHORT, 0);

    if (self.cardboardUI) {
      self.cardboardUI.renderNoState();
    }

    // Bind the fake default framebuffer again
    self.realBindFramebuffer.call(self.gl, gl.FRAMEBUFFER, self.framebuffer);

    // If preserveDrawingBuffer == false clear the framebuffer
    if (!self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.call(gl, 0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    if (!WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
      self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);
    }

    // Restore state
    if (self.cullFace) { self.realEnable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realEnable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realEnable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realEnable.call(gl, gl.STENCIL_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    if (self.ctxAttribs.alpha || !self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.apply(gl, self.clearColor);
    }
  });

  // Workaround for the fact that Safari doesn't allow us to patch the canvas
  // width and height correctly. After each submit frame check to see what the
  // real backbuffer size has been set to and resize the fake backbuffer size
  // to match.
  if (Util.isIOS()) {
    var canvas = gl.canvas;
    if (canvas.width != self.bufferWidth || canvas.height != self.bufferHeight) {
      self.bufferWidth = canvas.width;
      self.bufferHeight = canvas.height;
      self.onResize();
    }
  }
};

/**
 * Call when the deviceInfo has changed. At this point we need
 * to re-calculate the distortion mesh.
 */
CardboardDistorter.prototype.updateDeviceInfo = function(deviceInfo) {
  var gl = this.gl;
  var self = this;

  var glState = [gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING];
  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = self.computeMeshVertices_(self.meshWidth, self.meshHeight, deviceInfo);
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Indices don't change based on device parameters, so only compute once.
    if (!self.indexCount) {
      var indices = self.computeMeshIndices_(self.meshWidth, self.meshHeight);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      self.indexCount = indices.length;
    }
  });
};

/**
 * Build the distortion mesh vertices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshVertices_ = function(width, height, deviceInfo) {
  var vertices = new Float32Array(2 * width * height * 5);

  var lensFrustum = deviceInfo.getLeftEyeVisibleTanAngles();
  var noLensFrustum = deviceInfo.getLeftEyeNoLensTanAngles();
  var viewport = deviceInfo.getLeftEyeVisibleScreenRect(noLensFrustum);
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        var u = i / (width - 1);
        var v = j / (height - 1);

        // Grid points regularly spaced in StreoScreen, and barrel distorted in
        // the mesh.
        var s = u;
        var t = v;
        var x = Util.lerp(lensFrustum[0], lensFrustum[2], u);
        var y = Util.lerp(lensFrustum[3], lensFrustum[1], v);
        var d = Math.sqrt(x * x + y * y);
        var r = deviceInfo.distortion.distortInverse(d);
        var p = x * r / d;
        var q = y * r / d;
        u = (p - noLensFrustum[0]) / (noLensFrustum[2] - noLensFrustum[0]);
        v = (q - noLensFrustum[3]) / (noLensFrustum[1] - noLensFrustum[3]);

        // Convert u,v to mesh screen coordinates.
        var aspect = deviceInfo.device.widthMeters / deviceInfo.device.heightMeters;

        // FIXME: The original Unity plugin multiplied U by the aspect ratio
        // and didn't multiply either value by 2, but that seems to get it
        // really close to correct looking for me. I hate this kind of "Don't
        // know why it works" code though, and wold love a more logical
        // explanation of what needs to happen here.
        u = (viewport.x + u * viewport.width - 0.5) * 2.0; //* aspect;
        v = (viewport.y + v * viewport.height - 0.5) * 2.0;

        vertices[(vidx * 5) + 0] = u; // position.x
        vertices[(vidx * 5) + 1] = v; // position.y
        vertices[(vidx * 5) + 2] = s; // texCoord.x
        vertices[(vidx * 5) + 3] = t; // texCoord.y
        vertices[(vidx * 5) + 4] = e; // texCoord.z (viewport index)
      }
    }
    var w = lensFrustum[2] - lensFrustum[0];
    lensFrustum[0] = -(w + lensFrustum[0]);
    lensFrustum[2] = w - lensFrustum[2];
    w = noLensFrustum[2] - noLensFrustum[0];
    noLensFrustum[0] = -(w + noLensFrustum[0]);
    noLensFrustum[2] = w - noLensFrustum[2];
    viewport.x = 1 - (viewport.x + viewport.width);
  }
  return vertices;
}

/**
 * Build the distortion mesh indices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshIndices_ = function(width, height) {
  var indices = new Uint16Array(2 * (width - 1) * (height - 1) * 6);
  var halfwidth = width / 2;
  var halfheight = height / 2;
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        if (i == 0 || j == 0)
          continue;
        // Build a quad.  Lower right and upper left quadrants have quads with
        // the triangle diagonal flipped to get the vignette to interpolate
        // correctly.
        if ((i <= halfwidth) == (j <= halfheight)) {
          // Quad diagonal lower left to upper right.
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - 1;
        } else {
          // Quad diagonal upper left to lower right.
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width - 1;
        }
      }
    }
  }
  return indices;
};

CardboardDistorter.prototype.getOwnPropertyDescriptor_ = function(proto, attrName) {
  var descriptor = Object.getOwnPropertyDescriptor(proto, attrName);
  // In some cases (ahem... Safari), the descriptor returns undefined get and
  // set fields. In this case, we need to create a synthetic property
  // descriptor. This works around some of the issues in
  // https://github.com/borismus/webvr-polyfill/issues/46
  if (descriptor.get === undefined || descriptor.set === undefined) {
    descriptor.configurable = true;
    descriptor.enumerable = true;
    descriptor.get = function() {
      return this.getAttribute(attrName);
    };
    descriptor.set = function(val) {
      this.setAttribute(attrName, val);
    };
  }
  return descriptor;
};

module.exports = CardboardDistorter;

},{"./cardboard-ui.js":5,"./deps/wglu-preserve-state.js":7,"./util.js":22}],5:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');
var WGLUPreserveGLState = _dereq_('./deps/wglu-preserve-state.js');

var uiVS = [
  'attribute vec2 position;',

  'uniform mat4 projectionMat;',

  'void main() {',
  '  gl_Position = projectionMat * vec4( position, -1.0, 1.0 );',
  '}',
].join('\n');

var uiFS = [
  'precision mediump float;',

  'uniform vec4 color;',

  'void main() {',
  '  gl_FragColor = color;',
  '}',
].join('\n');

var DEG2RAD = Math.PI/180.0;

// The gear has 6 identical sections, each spanning 60 degrees.
var kAnglePerGearSection = 60;

// Half-angle of the span of the outer rim.
var kOuterRimEndAngle = 12;

// Angle between the middle of the outer rim and the start of the inner rim.
var kInnerRimBeginAngle = 20;

// Distance from center to outer rim, normalized so that the entire model
// fits in a [-1, 1] x [-1, 1] square.
var kOuterRadius = 1;

// Distance from center to depressed rim, in model units.
var kMiddleRadius = 0.75;

// Radius of the inner hollow circle, in model units.
var kInnerRadius = 0.3125;

// Center line thickness in DP.
var kCenterLineThicknessDp = 4;

// Button width in DP.
var kButtonWidthDp = 28;

// Factor to scale the touch area that responds to the touch.
var kTouchSlopFactor = 1.5;

var Angles = [
  0, kOuterRimEndAngle, kInnerRimBeginAngle,
  kAnglePerGearSection - kInnerRimBeginAngle,
  kAnglePerGearSection - kOuterRimEndAngle
];

/**
 * Renders the alignment line and "options" gear. It is assumed that the canvas
 * this is rendered into covers the entire screen (or close to it.)
 */
function CardboardUI(gl) {
  this.gl = gl;

  this.attribs = {
    position: 0
  };
  this.program = Util.linkProgram(gl, uiVS, uiFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.vertexBuffer = gl.createBuffer();
  this.gearOffset = 0;
  this.gearVertexCount = 0;
  this.arrowOffset = 0;
  this.arrowVertexCount = 0;

  this.projMat = new Float32Array(16);

  this.listener = null;

  this.onResize();
};

/**
 * Tears down all the resources created by the UI renderer.
 */
CardboardUI.prototype.destroy = function() {
  var gl = this.gl;

  if (this.listener) {
    gl.canvas.removeEventListener('click', this.listener, false);
  }

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
};

/**
 * Adds a listener to clicks on the gear and back icons
 */
CardboardUI.prototype.listen = function(optionsCallback, backCallback) {
  var canvas = this.gl.canvas;
  this.listener = function(event) {
    var midline = canvas.clientWidth / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor;
    // Check to see if the user clicked on (or around) the gear icon
    if (event.clientX > midline - buttonSize &&
        event.clientX < midline + buttonSize &&
        event.clientY > canvas.clientHeight - buttonSize) {
      optionsCallback(event);
    }
    // Check to see if the user clicked on (or around) the back icon
    else if (event.clientX < buttonSize && event.clientY < buttonSize) {
      backCallback(event);
    }
  };
  canvas.addEventListener('click', this.listener, false);
};

/**
 * Builds the UI mesh.
 */
CardboardUI.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = [];

    var midline = gl.drawingBufferWidth / 2;

    // Assumes your canvas width and height is scaled proportionately.
    // TODO(smus): The following causes buttons to become huge on iOS, but seems
    // like the right thing to do. For now, added a hack. But really, investigate why.
    var dps = (gl.drawingBufferWidth / (screen.width * window.devicePixelRatio));
    if (!Util.isIOS()) {
      dps *= window.devicePixelRatio;
    }

    var lineWidth = kCenterLineThicknessDp * dps / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor * dps;
    var buttonScale = kButtonWidthDp * dps / 2;
    var buttonBorder = ((kButtonWidthDp * kTouchSlopFactor) - kButtonWidthDp) * dps;

    // Build centerline
    vertices.push(midline - lineWidth, buttonSize);
    vertices.push(midline - lineWidth, gl.drawingBufferHeight);
    vertices.push(midline + lineWidth, buttonSize);
    vertices.push(midline + lineWidth, gl.drawingBufferHeight);

    // Build gear
    self.gearOffset = (vertices.length / 2);

    function addGearSegment(theta, r) {
      var angle = (90 - theta) * DEG2RAD;
      var x = Math.cos(angle);
      var y = Math.sin(angle);
      vertices.push(kInnerRadius * x * buttonScale + midline, kInnerRadius * y * buttonScale + buttonScale);
      vertices.push(r * x * buttonScale + midline, r * y * buttonScale + buttonScale);
    }

    for (var i = 0; i <= 6; i++) {
      var segmentTheta = i * kAnglePerGearSection;

      addGearSegment(segmentTheta, kOuterRadius);
      addGearSegment(segmentTheta + kOuterRimEndAngle, kOuterRadius);
      addGearSegment(segmentTheta + kInnerRimBeginAngle, kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kInnerRimBeginAngle), kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kOuterRimEndAngle), kOuterRadius);
    }

    self.gearVertexCount = (vertices.length / 2) - self.gearOffset;

    // Build back arrow
    self.arrowOffset = (vertices.length / 2);

    function addArrowVertex(x, y) {
      vertices.push(buttonBorder + x, gl.drawingBufferHeight - buttonBorder - y);
    }

    var angledLineWidth = lineWidth / Math.sin(45 * DEG2RAD);

    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, 0);
    addArrowVertex(buttonScale + angledLineWidth, angledLineWidth);
    addArrowVertex(angledLineWidth, buttonScale + angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, buttonScale * 2);
    addArrowVertex(buttonScale + angledLineWidth, (buttonScale * 2) - angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);

    addArrowVertex(angledLineWidth, buttonScale - lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale - lineWidth);
    addArrowVertex(angledLineWidth, buttonScale + lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale + lineWidth);

    self.arrowVertexCount = (vertices.length / 2) - self.arrowOffset;

    // Buffer data
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  });
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardUI.prototype.render = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.CULL_FACE,
    gl.DEPTH_TEST,
    gl.BLEND,
    gl.SCISSOR_TEST,
    gl.STENCIL_TEST,
    gl.COLOR_WRITEMASK,
    gl.VIEWPORT,

    gl.CURRENT_PROGRAM,
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Make sure the GL state is in a good place
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    self.renderNoState();
  });
};

CardboardUI.prototype.renderNoState = function() {
  var gl = this.gl;

  // Bind distortion program and mesh
  gl.useProgram(this.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.enableVertexAttribArray(this.attribs.position);
  gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 8, 0);

  gl.uniform4f(this.uniforms.color, 1.0, 1.0, 1.0, 1.0);

  Util.orthoMatrix(this.projMat, 0, gl.drawingBufferWidth, 0, gl.drawingBufferHeight, 0.1, 1024.0);
  gl.uniformMatrix4fv(this.uniforms.projectionMat, false, this.projMat);

  // Draws UI element
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.gearOffset, this.gearVertexCount);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.arrowOffset, this.arrowVertexCount);
};

module.exports = CardboardUI;

},{"./deps/wglu-preserve-state.js":7,"./util.js":22}],6:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var CardboardDistorter = _dereq_('./cardboard-distorter.js');
var CardboardUI = _dereq_('./cardboard-ui.js');
var DeviceInfo = _dereq_('./device-info.js');
var Dpdb = _dereq_('./dpdb/dpdb.js');
var FusionPoseSensor = _dereq_('./sensor-fusion/fusion-pose-sensor.js');
var RotateInstructions = _dereq_('./rotate-instructions.js');
var ViewerSelector = _dereq_('./viewer-selector.js');
var VRDisplay = _dereq_('./base.js').VRDisplay;
var Util = _dereq_('./util.js');

var Eye = {
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * VRDisplay based on mobile device parameters and DeviceMotion APIs.
 */
function CardboardVRDisplay() {
  this.displayName = 'Cardboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;
  this.capabilities.canPresent = true;

  // "Private" members.
  this.bufferScale_ = WebVRConfig.BUFFER_SCALE;
  this.poseSensor_ = new FusionPoseSensor();
  this.distorter_ = null;
  this.cardboardUI_ = null;

  this.dpdb_ = new Dpdb(true, this.onDeviceParamsUpdated_.bind(this));
  this.deviceInfo_ = new DeviceInfo(this.dpdb_.getDeviceParams());

  this.viewerSelector_ = new ViewerSelector();
  this.viewerSelector_.on('change', this.onViewerChanged_.bind(this));

  // Set the correct initial viewer.
  this.deviceInfo_.setViewer(this.viewerSelector_.getCurrentViewer());

  if (!WebVRConfig.ROTATE_INSTRUCTIONS_DISABLED) {
    this.rotateInstructions_ = new RotateInstructions();
  }

  if (Util.isIOS()) {
    // Listen for resize events to workaround this awful Safari bug.
    window.addEventListener('resize', this.onResize_.bind(this));
  }
}
CardboardVRDisplay.prototype = new VRDisplay();

CardboardVRDisplay.prototype.getImmediatePose = function() {
  return {
    position: this.poseSensor_.getPosition(),
    orientation: this.poseSensor_.getOrientation(),
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

CardboardVRDisplay.prototype.resetPose = function() {
  this.poseSensor_.resetPose();
};

CardboardVRDisplay.prototype.getEyeParameters = function(whichEye) {
  var offset = [this.deviceInfo_.viewer.interLensDistance * 0.5, 0.0, 0.0];
  var fieldOfView;

  // TODO: FoV can be a little expensive to compute. Cache when device params change.
  if (whichEye == Eye.LEFT) {
    offset[0] *= -1.0;
    fieldOfView = this.deviceInfo_.getFieldOfViewLeftEye();
  } else if (whichEye == Eye.RIGHT) {
    fieldOfView = this.deviceInfo_.getFieldOfViewRightEye();
  } else {
    console.error('Invalid eye provided: %s', whichEye);
    return null;
  }

  return {
    fieldOfView: fieldOfView,
    offset: offset,
    // TODO: Should be able to provide better values than these.
    renderWidth: this.deviceInfo_.device.width * 0.5 * this.bufferScale_,
    renderHeight: this.deviceInfo_.device.height * this.bufferScale_,
  };
};

CardboardVRDisplay.prototype.onDeviceParamsUpdated_ = function(newParams) {
  if (Util.isDebug()) {
    console.log('DPDB reported that device params were updated.');
  }
  this.deviceInfo_.updateDeviceParams(newParams);

  if (this.distorter_) {
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
  }
};

CardboardVRDisplay.prototype.updateBounds_ = function () {
  if (this.layer_ && this.distorter_ && (this.layer_.leftBounds || this.layer_.rightBounds)) {
    this.distorter_.setTextureBounds(this.layer_.leftBounds, this.layer_.rightBounds);
  }
};

CardboardVRDisplay.prototype.beginPresent_ = function() {
  var gl = this.layer_.source.getContext('webgl');
  if (!gl)
    gl = this.layer_.source.getContext('experimental-webgl');
  if (!gl)
    gl = this.layer_.source.getContext('webgl2');

  if (!gl)
    return; // Can't do distortion without a WebGL context.

  // Provides a way to opt out of distortion
  if (this.layer_.predistorted) {
    if (!WebVRConfig.CARDBOARD_UI_DISABLED) {
      gl.canvas.width = Util.getScreenWidth() * this.bufferScale_;
      gl.canvas.height = Util.getScreenHeight() * this.bufferScale_;
      this.cardboardUI_ = new CardboardUI(gl);
    }
  } else {
    // Create a new distorter for the target context
    this.distorter_ = new CardboardDistorter(gl);
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
    this.cardboardUI_ = this.distorter_.cardboardUI;
  }

  if (this.cardboardUI_) {
    this.cardboardUI_.listen(function(e) {
      // Options clicked.
      this.viewerSelector_.show(this.layer_.source.parentElement);
      e.stopPropagation();
      e.preventDefault();
    }.bind(this), function(e) {
      // Back clicked.
      this.exitPresent();
      e.stopPropagation();
      e.preventDefault();
    }.bind(this));
  }

  if (this.rotateInstructions_) {
    if (Util.isLandscapeMode() && Util.isMobile()) {
      // In landscape mode, temporarily show the "put into Cardboard"
      // interstitial. Otherwise, do the default thing.
      this.rotateInstructions_.showTemporarily(3000, this.layer_.source.parentElement);
    } else {
      this.rotateInstructions_.update();
    }
  }

  // Listen for orientation change events in order to show interstitial.
  this.orientationHandler = this.onOrientationChange_.bind(this);
  window.addEventListener('orientationchange', this.orientationHandler);

  // Listen for present display change events in order to update distorter dimensions
  this.vrdisplaypresentchangeHandler = this.updateBounds_.bind(this);
  window.addEventListener('vrdisplaypresentchange', this.vrdisplaypresentchangeHandler);

  // Fire this event initially, to give geometry-distortion clients the chance
  // to do something custom.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.endPresent_ = function() {
  if (this.distorter_) {
    this.distorter_.destroy();
    this.distorter_ = null;
  }
  if (this.cardboardUI_) {
    this.cardboardUI_.destroy();
    this.cardboardUI_ = null;
  }

  if (this.rotateInstructions_) {
    this.rotateInstructions_.hide();
  }
  this.viewerSelector_.hide();

  window.removeEventListener('orientationchange', this.orientationHandler);
  window.removeEventListener('vrdisplaypresentchange', this.vrdisplaypresentchangeHandler);
};

CardboardVRDisplay.prototype.submitFrame = function(pose) {
  if (this.distorter_) {
    this.distorter_.submitFrame();
  } else if (this.cardboardUI_ && this.layer_) {
    // Hack for predistorted: true.
    var canvas = this.layer_.source.getContext('webgl').canvas;
    if (canvas.width != this.lastWidth || canvas.height != this.lastHeight) {
      this.cardboardUI_.onResize();
    }
    this.lastWidth = canvas.width;
    this.lastHeight = canvas.height;

    // Render the Cardboard UI.
    this.cardboardUI_.render();
  }
};

CardboardVRDisplay.prototype.onOrientationChange_ = function(e) {
  // Hide the viewer selector.
  this.viewerSelector_.hide();

  // Update the rotate instructions.
  if (this.rotateInstructions_) {
    this.rotateInstructions_.update();
  }

  this.onResize_();
};

CardboardVRDisplay.prototype.onResize_ = function(e) {
  if (this.layer_) {
    var gl = this.layer_.source.getContext('webgl');
    // Size the CSS canvas.
    // Added padding on right and bottom because iPhone 5 will not
    // hide the URL bar unless content is bigger than the screen.
    // This will not be visible as long as the container element (e.g. body)
    // is set to 'overflow: hidden'.
    var cssProperties = [
      'position: absolute',
      'top: 0',
      'left: 0',
      'width: ' + Math.max(screen.width, screen.height) + 'px',
      'height: ' + Math.min(screen.height, screen.width) + 'px',
      'border: 0',
      'margin: 0',
      'padding: 0 10px 10px 0',
    ];
    gl.canvas.setAttribute('style', cssProperties.join('; ') + ';');

    Util.safariCssSizeWorkaround(gl.canvas);
  }
};

CardboardVRDisplay.prototype.onViewerChanged_ = function(viewer) {
  this.deviceInfo_.setViewer(viewer);

  if (this.distorter_) {
    // Update the distortion appropriately.
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
  }

  // Fire a new event containing viewer and device parameters for clients that
  // want to implement their own geometry-based distortion.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.fireVRDisplayDeviceParamsChange_ = function() {
  var event = new CustomEvent('vrdisplaydeviceparamschange', {
    detail: {
      vrdisplay: this,
      deviceInfo: this.deviceInfo_,
    }
  });
  window.dispatchEvent(event);
};

module.exports = CardboardVRDisplay;

},{"./base.js":3,"./cardboard-distorter.js":4,"./cardboard-ui.js":5,"./device-info.js":8,"./dpdb/dpdb.js":12,"./rotate-instructions.js":16,"./sensor-fusion/fusion-pose-sensor.js":18,"./util.js":22,"./viewer-selector.js":23}],7:[function(_dereq_,module,exports){
/*
Copyright (c) 2016, Brandon Jones.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
Caches specified GL state, runs a callback, and restores the cached state when
done.

Example usage:

var savedState = [
  gl.ARRAY_BUFFER_BINDING,

  // TEXTURE_BINDING_2D or _CUBE_MAP must always be followed by the texure unit.
  gl.TEXTURE_BINDING_2D, gl.TEXTURE0,

  gl.CLEAR_COLOR,
];
// After this call the array buffer, texture unit 0, active texture, and clear
// color will be restored. The viewport will remain changed, however, because
// gl.VIEWPORT was not included in the savedState list.
WGLUPreserveGLState(gl, savedState, function(gl) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, ....);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, ...);

  gl.clearColor(1, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
});

Note that this is not intended to be fast. Managing state in your own code to
avoid redundant state setting and querying will always be faster. This function
is most useful for cases where you may not have full control over the WebGL
calls being made, such as tooling or effect injectors.
*/

function WGLUPreserveGLState(gl, bindings, callback) {
  if (!bindings) {
    callback(gl);
    return;
  }

  var boundValues = [];

  var activeTexture = null;
  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    switch (binding) {
      case gl.TEXTURE_BINDING_2D:
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31) {
          console.error("TEXTURE_BINDING_2D or TEXTURE_BINDING_CUBE_MAP must be followed by a valid texture unit");
          boundValues.push(null, null);
          break;
        }
        if (!activeTexture) {
          activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        }
        gl.activeTexture(textureUnit);
        boundValues.push(gl.getParameter(binding), null);
        break;
      case gl.ACTIVE_TEXTURE:
        activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        boundValues.push(null);
        break;
      default:
        boundValues.push(gl.getParameter(binding));
        break;
    }
  }

  callback(gl);

  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    var boundValue = boundValues[i];
    switch (binding) {
      case gl.ACTIVE_TEXTURE:
        break; // Ignore this binding, since we special-case it to happen last.
      case gl.ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ARRAY_BUFFER, boundValue);
        break;
      case gl.COLOR_CLEAR_VALUE:
        gl.clearColor(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.COLOR_WRITEMASK:
        gl.colorMask(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.CURRENT_PROGRAM:
        gl.useProgram(boundValue);
        break;
      case gl.ELEMENT_ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boundValue);
        break;
      case gl.FRAMEBUFFER_BINDING:
        gl.bindFramebuffer(gl.FRAMEBUFFER, boundValue);
        break;
      case gl.RENDERBUFFER_BINDING:
        gl.bindRenderbuffer(gl.RENDERBUFFER, boundValue);
        break;
      case gl.TEXTURE_BINDING_2D:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, boundValue);
        break;
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, boundValue);
        break;
      case gl.VIEWPORT:
        gl.viewport(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.BLEND:
      case gl.CULL_FACE:
      case gl.DEPTH_TEST:
      case gl.SCISSOR_TEST:
      case gl.STENCIL_TEST:
        if (boundValue) {
          gl.enable(binding);
        } else {
          gl.disable(binding);
        }
        break;
      default:
        console.log("No GL restore behavior for 0x" + binding.toString(16));
        break;
    }

    if (activeTexture) {
      gl.activeTexture(activeTexture);
    }
  }
}

module.exports = WGLUPreserveGLState;
},{}],8:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Distortion = _dereq_('./distortion/distortion.js');
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

function Device(params) {
  this.width = params.width || Util.getScreenWidth();
  this.height = params.height || Util.getScreenHeight();
  this.widthMeters = params.widthMeters;
  this.heightMeters = params.heightMeters;
  this.bevelMeters = params.bevelMeters;
}


// Fallback Android device (based on Nexus 5 measurements) for use when
// we can't recognize an Android device.
var DEFAULT_ANDROID = new Device({
  widthMeters: 0.110,
  heightMeters: 0.062,
  bevelMeters: 0.004
});

// Fallback iOS device (based on iPhone6) for use when
// we can't recognize an Android device.
var DEFAULT_IOS = new Device({
  widthMeters: 0.1038,
  heightMeters: 0.0584,
  bevelMeters: 0.004
});


var Viewers = {
  CardboardV1: new CardboardViewer({
    id: 'CardboardV1',
    label: 'Cardboard I/O 2014',
    fov: 40,
    interLensDistance: 0.060,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.042,
    distortionCoefficients: [0.441, 0.156],
    inverseCoefficients: [-0.4410035, 0.42756155, -0.4804439, 0.5460139,
      -0.58821183, 0.5733938, -0.48303202, 0.33299083, -0.17573841,
      0.0651772, -0.01488963, 0.001559834]
  }),
  CardboardV2: new CardboardViewer({
    id: 'CardboardV2',
    label: 'Cardboard I/O 2015',
    fov: 60,
    interLensDistance: 0.064,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.039,
    distortionCoefficients: [0.34, 0.55],
    inverseCoefficients: [-0.33836704, -0.18162185, 0.862655, -1.2462051,
      1.0560602, -0.58208317, 0.21609078, -0.05444823, 0.009177956,
      -9.904169E-4, 6.183535E-5, -1.6981803E-6]
  })
};


var DEFAULT_LEFT_CENTER = {x: 0.5, y: 0.5};
var DEFAULT_RIGHT_CENTER = {x: 0.5, y: 0.5};

/**
 * Manages information about the device and the viewer.
 *
 * deviceParams indicates the parameters of the device to use (generally
 * obtained from dpdb.getDeviceParams()). Can be null to mean no device
 * params were found.
 */
function DeviceInfo(deviceParams) {
  this.viewer = Viewers.CardboardV2;
  this.updateDeviceParams(deviceParams);
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
}

DeviceInfo.prototype.updateDeviceParams = function(deviceParams) {
  this.device = this.determineDevice_(deviceParams) || this.device;
};

DeviceInfo.prototype.getDevice = function() {
  return this.device;
};

DeviceInfo.prototype.setViewer = function(viewer) {
  this.viewer = viewer;
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
};

DeviceInfo.prototype.determineDevice_ = function(deviceParams) {
  if (!deviceParams) {
    // No parameters, so use a default.
    if (Util.isIOS()) {
      console.warn('Using fallback iOS device measurements.');
      return DEFAULT_IOS;
    } else {
      console.warn('Using fallback Android device measurements.');
      return DEFAULT_ANDROID;
    }
  }

  // Compute device screen dimensions based on deviceParams.
  var METERS_PER_INCH = 0.0254;
  var metersPerPixelX = METERS_PER_INCH / deviceParams.xdpi;
  var metersPerPixelY = METERS_PER_INCH / deviceParams.ydpi;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();
  return new Device({
    widthMeters: metersPerPixelX * width,
    heightMeters: metersPerPixelY * height,
    bevelMeters: deviceParams.bevelMm * 0.001,
  });
};

/**
 * Calculates field of view for the left eye.
 */
DeviceInfo.prototype.getDistortedFieldOfViewLeftEye = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Device.height and device.width for device in portrait mode, so transpose.
  var eyeToScreenDistance = viewer.screenLensDistance;

  var outerDist = (device.widthMeters - viewer.interLensDistance) / 2;
  var innerDist = viewer.interLensDistance / 2;
  var bottomDist = viewer.baselineLensDistance - device.bevelMeters;
  var topDist = device.heightMeters - bottomDist;

  var outerAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(outerDist / eyeToScreenDistance));
  var innerAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(innerDist / eyeToScreenDistance));
  var bottomAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(bottomDist / eyeToScreenDistance));
  var topAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(topDist / eyeToScreenDistance));

  return {
    leftDegrees: Math.min(outerAngle, viewer.fov),
    rightDegrees: Math.min(innerAngle, viewer.fov),
    downDegrees: Math.min(bottomAngle, viewer.fov),
    upDegrees: Math.min(topAngle, viewer.fov)
  };
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Tan-angles from the max FOV.
  var fovLeft = Math.tan(-MathUtil.degToRad * viewer.fov);
  var fovTop = Math.tan(MathUtil.degToRad * viewer.fov);
  var fovRight = Math.tan(MathUtil.degToRad * viewer.fov);
  var fovBottom = Math.tan(-MathUtil.degToRad * viewer.fov);
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = distortion.distort((centerX - halfWidth) / centerZ);
  var screenTop = distortion.distort((centerY + halfHeight) / centerZ);
  var screenRight = distortion.distort((centerX + halfWidth) / centerZ);
  var screenBottom = distortion.distort((centerY - halfHeight) / centerZ);
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  var result = new Float32Array(4);
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters, assuming no lenses.
 */
DeviceInfo.prototype.getLeftEyeNoLensTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  var result = new Float32Array(4);
  // Tan-angles from the max FOV.
  var fovLeft = distortion.distortInverse(Math.tan(-MathUtil.degToRad * viewer.fov));
  var fovTop = distortion.distortInverse(Math.tan(MathUtil.degToRad * viewer.fov));
  var fovRight = distortion.distortInverse(Math.tan(MathUtil.degToRad * viewer.fov));
  var fovBottom = distortion.distortInverse(Math.tan(-MathUtil.degToRad * viewer.fov));
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = (centerX - halfWidth) / centerZ;
  var screenTop = (centerY + halfHeight) / centerZ;
  var screenRight = (centerX + halfWidth) / centerZ;
  var screenBottom = (centerY - halfHeight) / centerZ;
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the screen rectangle visible from the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleScreenRect = function(undistortedFrustum) {
  var viewer = this.viewer;
  var device = this.device;

  var dist = viewer.screenLensDistance;
  var eyeX = (device.widthMeters - viewer.interLensDistance) / 2;
  var eyeY = viewer.baselineLensDistance - device.bevelMeters;
  var left = (undistortedFrustum[0] * dist + eyeX) / device.widthMeters;
  var top = (undistortedFrustum[1] * dist + eyeY) / device.heightMeters;
  var right = (undistortedFrustum[2] * dist + eyeX) / device.widthMeters;
  var bottom = (undistortedFrustum[3] * dist + eyeY) / device.heightMeters;
  return {
    x: left,
    y: bottom,
    width: right - left,
    height: top - bottom
  };
};

DeviceInfo.prototype.getFieldOfViewLeftEye = function(opt_isUndistorted) {
  return opt_isUndistorted ? this.getUndistortedFieldOfViewLeftEye() :
      this.getDistortedFieldOfViewLeftEye();
};

DeviceInfo.prototype.getFieldOfViewRightEye = function(opt_isUndistorted) {
  var fov = this.getFieldOfViewLeftEye(opt_isUndistorted);
  return {
    leftDegrees: fov.rightDegrees,
    rightDegrees: fov.leftDegrees,
    upDegrees: fov.upDegrees,
    downDegrees: fov.downDegrees
  };
};

/**
 * Calculates undistorted field of view for the left eye.
 */
DeviceInfo.prototype.getUndistortedFieldOfViewLeftEye = function() {
  var p = this.getUndistortedParams_();

  return {
    leftDegrees: MathUtil.radToDeg * Math.atan(p.outerDist),
    rightDegrees: MathUtil.radToDeg * Math.atan(p.innerDist),
    downDegrees: MathUtil.radToDeg * Math.atan(p.bottomDist),
    upDegrees: MathUtil.radToDeg * Math.atan(p.topDist)
  };
};

DeviceInfo.prototype.getUndistortedViewportLeftEye = function() {
  var p = this.getUndistortedParams_();
  var viewer = this.viewer;
  var device = this.device;

  // Distances stored in local variables are in tan-angle units unless otherwise
  // noted.
  var eyeToScreenDistance = viewer.screenLensDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;
  var xPxPerTanAngle = device.width / screenWidth;
  var yPxPerTanAngle = device.height / screenHeight;

  var x = Math.round((p.eyePosX - p.outerDist) * xPxPerTanAngle);
  var y = Math.round((p.eyePosY - p.bottomDist) * yPxPerTanAngle);
  return {
    x: x,
    y: y,
    width: Math.round((p.eyePosX + p.innerDist) * xPxPerTanAngle) - x,
    height: Math.round((p.eyePosY + p.topDist) * yPxPerTanAngle) - y
  };
};

DeviceInfo.prototype.getUndistortedParams_ = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Most of these variables in tan-angle units.
  var eyeToScreenDistance = viewer.screenLensDistance;
  var halfLensDistance = viewer.interLensDistance / 2 / eyeToScreenDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;

  var eyePosX = screenWidth / 2 - halfLensDistance;
  var eyePosY = (viewer.baselineLensDistance - device.bevelMeters) / eyeToScreenDistance;

  var maxFov = viewer.fov;
  var viewerMax = distortion.distortInverse(Math.tan(MathUtil.degToRad * maxFov));
  var outerDist = Math.min(eyePosX, viewerMax);
  var innerDist = Math.min(halfLensDistance, viewerMax);
  var bottomDist = Math.min(eyePosY, viewerMax);
  var topDist = Math.min(screenHeight - eyePosY, viewerMax);

  return {
    outerDist: outerDist,
    innerDist: innerDist,
    topDist: topDist,
    bottomDist: bottomDist,
    eyePosX: eyePosX,
    eyePosY: eyePosY
  };
};


function CardboardViewer(params) {
  // A machine readable ID.
  this.id = params.id;
  // A human readable label.
  this.label = params.label;

  // Field of view in degrees (per side).
  this.fov = params.fov;

  // Distance between lens centers in meters.
  this.interLensDistance = params.interLensDistance;
  // Distance between viewer baseline and lens center in meters.
  this.baselineLensDistance = params.baselineLensDistance;
  // Screen-to-lens distance in meters.
  this.screenLensDistance = params.screenLensDistance;

  // Distortion coefficients.
  this.distortionCoefficients = params.distortionCoefficients;
  // Inverse distortion coefficients.
  // TODO: Calculate these from distortionCoefficients in the future.
  this.inverseCoefficients = params.inverseCoefficients;
}

// Export viewer information.
DeviceInfo.Viewers = Viewers;
module.exports = DeviceInfo;

},{"./distortion/distortion.js":10,"./math-util.js":14,"./util.js":22}],9:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var VRDisplay = _dereq_('./base.js').VRDisplay;
var HMDVRDevice = _dereq_('./base.js').HMDVRDevice;
var PositionSensorVRDevice = _dereq_('./base.js').PositionSensorVRDevice;

/**
 * Wraps a VRDisplay and exposes it as a HMDVRDevice
 */
function VRDisplayHMDDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-polyfill:HMD:' + display.displayId;
  this.deviceName = display.displayName + ' (HMD)';
}
VRDisplayHMDDevice.prototype = new HMDVRDevice();

VRDisplayHMDDevice.prototype.getEyeParameters = function(whichEye) {
  var eyeParameters = this.display.getEyeParameters(whichEye);

  return {
    currentFieldOfView: eyeParameters.fieldOfView,
    maximumFieldOfView: eyeParameters.fieldOfView,
    minimumFieldOfView: eyeParameters.fieldOfView,
    recommendedFieldOfView: eyeParameters.fieldOfView,
    eyeTranslation: { x: eyeParameters.offset[0], y: eyeParameters.offset[1], z: eyeParameters.offset[2] },
    renderRect: {
      x: (whichEye == 'right') ? eyeParameters.renderWidth : 0,
      y: 0,
      width: eyeParameters.renderWidth,
      height: eyeParameters.renderHeight
    }
  };
};

VRDisplayHMDDevice.prototype.setFieldOfView =
    function(opt_fovLeft, opt_fovRight, opt_zNear, opt_zFar) {
  // Not supported. getEyeParameters reports that the min, max, and recommended
  // FoV is all the same, so no adjustment can be made.
};

// TODO: Need to hook requestFullscreen to see if a wrapped VRDisplay was passed
// in as an option. If so we should prevent the default fullscreen behavior and
// call VRDisplay.requestPresent instead.

/**
 * Wraps a VRDisplay and exposes it as a PositionSensorVRDevice
 */
function VRDisplayPositionSensorDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-polyfill:PositionSensor: ' + display.displayId;
  this.deviceName = display.displayName + ' (PositionSensor)';
}
VRDisplayPositionSensorDevice.prototype = new PositionSensorVRDevice();

VRDisplayPositionSensorDevice.prototype.getState = function() {
  var pose = this.display.getPose();
  return {
    position: pose.position ? { x: pose.position[0], y: pose.position[1], z: pose.position[2] } : null,
    orientation: pose.orientation ? { x: pose.orientation[0], y: pose.orientation[1], z: pose.orientation[2], w: pose.orientation[3] } : null,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

VRDisplayPositionSensorDevice.prototype.resetState = function() {
  return this.positionDevice.resetPose();
};


module.exports.VRDisplayHMDDevice = VRDisplayHMDDevice;
module.exports.VRDisplayPositionSensorDevice = VRDisplayPositionSensorDevice;


},{"./base.js":3}],10:[function(_dereq_,module,exports){
/**
 * TODO(smus): Implement coefficient inversion.
 */
function Distortion(coefficients) {
  this.coefficients = coefficients;
}

/**
 * Calculates the inverse distortion for a radius.
 * </p><p>
 * Allows to compute the original undistorted radius from a distorted one.
 * See also getApproximateInverseDistortion() for a faster but potentially
 * less accurate method.
 *
 * @param {Number} radius Distorted radius from the lens center in tan-angle units.
 * @return {Number} The undistorted radius in tan-angle units.
 */
Distortion.prototype.distortInverse = function(radius) {
  // Secant method.
  var r0 = 0;
  var r1 = 1;
  var dr0 = radius - this.distort(r0);
  while (Math.abs(r1 - r0) > 0.0001 /** 0.1mm */) {
    var dr1 = radius - this.distort(r1);
    var r2 = r1 - dr1 * ((r1 - r0) / (dr1 - dr0));
    r0 = r1;
    r1 = r2;
    dr0 = dr1;
  }
  return r1;
};

/**
 * Distorts a radius by its distortion factor from the center of the lenses.
 *
 * @param {Number} radius Radius from the lens center in tan-angle units.
 * @return {Number} The distorted radius in tan-angle units.
 */
Distortion.prototype.distort = function(radius) {
  var r2 = radius * radius;
  var ret = 0;
  for (var i = 0; i < this.coefficients.length; i++) {
    ret = r2 * (ret + this.coefficients[i]);
  }
  return (ret + 1) * radius;
};

// Functions below roughly ported from
// https://github.com/googlesamples/cardboard-unity/blob/master/Cardboard/Scripts/CardboardProfile.cs#L412

// Solves a small linear equation via destructive gaussian
// elimination and back substitution.  This isn't generic numeric
// code, it's just a quick hack to work with the generally
// well-behaved symmetric matrices for least-squares fitting.
// Not intended for reuse.
//
// @param a Input positive definite symmetrical matrix. Destroyed
//     during calculation.
// @param y Input right-hand-side values. Destroyed during calculation.
// @return Resulting x value vector.
//
Distortion.prototype.solveLinear_ = function(a, y) {
  var n = a.length;

  // Gaussian elimination (no row exchange) to triangular matrix.
  // The input matrix is a A^T A product which should be a positive
  // definite symmetrical matrix, and if I remember my linear
  // algebra right this implies that the pivots will be nonzero and
  // calculations sufficiently accurate without needing row
  // exchange.
  for (var j = 0; j < n - 1; ++j) {
    for (var k = j + 1; k < n; ++k) {
      var p = a[j][k] / a[j][j];
      for (var i = j + 1; i < n; ++i) {
        a[i][k] -= p * a[i][j];
      }
      y[k] -= p * y[j];
    }
  }
  // From this point on, only the matrix elements a[j][i] with i>=j are
  // valid. The elimination doesn't fill in eliminated 0 values.

  var x = new Array(n);

  // Back substitution.
  for (var j = n - 1; j >= 0; --j) {
    var v = y[j];
    for (var i = j + 1; i < n; ++i) {
      v -= a[i][j] * x[i];
    }
    x[j] = v / a[j][j];
  }

  return x;
};

// Solves a least-squares matrix equation.  Given the equation A * x = y, calculate the
// least-square fit x = inverse(A * transpose(A)) * transpose(A) * y.  The way this works
// is that, while A is typically not a square matrix (and hence not invertible), A * transpose(A)
// is always square.  That is:
//   A * x = y
//   transpose(A) * (A * x) = transpose(A) * y   <- multiply both sides by transpose(A)
//   (transpose(A) * A) * x = transpose(A) * y   <- associativity
//   x = inverse(transpose(A) * A) * transpose(A) * y  <- solve for x
// Matrix A's row count (first index) must match y's value count.  A's column count (second index)
// determines the length of the result vector x.
Distortion.prototype.solveLeastSquares_ = function(matA, vecY) {
  var i, j, k, sum;
  var numSamples = matA.length;
  var numCoefficients = matA[0].length;
  if (numSamples != vecY.Length) {
    throw new Error("Matrix / vector dimension mismatch");
  }

  // Calculate transpose(A) * A
  var matATA = new Array(numCoefficients);
  for (k = 0; k < numCoefficients; ++k) {
    matATA[k] = new Array(numCoefficients);
    for (j = 0; j < numCoefficients; ++j) {
      sum = 0;
      for (i = 0; i < numSamples; ++i) {
        sum += matA[j][i] * matA[k][i];
      }
      matATA[k][j] = sum;
    }
  }

  // Calculate transpose(A) * y
  var vecATY = new Array(numCoefficients);
  for (j = 0; j < numCoefficients; ++j) {
    sum = 0;
    for (i = 0; i < numSamples; ++i) {
      sum += matA[j][i] * vecY[i];
    }
    vecATY[j] = sum;
  }

  // Now solve (A * transpose(A)) * x = transpose(A) * y.
  return this.solveLinear_(matATA, vecATY);
};

/// Calculates an approximate inverse to the given radial distortion parameters.
Distortion.prototype.approximateInverse = function(maxRadius, numSamples) {
  maxRadius = maxRadius || 1;
  numSamples = numSamples || 100;
  var numCoefficients = 6;
  var i, j;

  // R + K1*R^3 + K2*R^5 = r, with R = rp = distort(r)
  // Repeating for numSamples:
  //   [ R0^3, R0^5 ] * [ K1 ] = [ r0 - R0 ]
  //   [ R1^3, R1^5 ]   [ K2 ]   [ r1 - R1 ]
  //   [ R2^3, R2^5 ]            [ r2 - R2 ]
  //   [ etc... ]                [ etc... ]
  // That is:
  //   matA * [K1, K2] = y
  // Solve:
  //   [K1, K2] = inverse(transpose(matA) * matA) * transpose(matA) * y
  var matA = new Array(numCoefficients);
  for (j = 0; j < numCoefficients; ++j) {
    matA[j] = new Array(numSamples);
  }
  var vecY = new Array(numSamples);

  for (i = 0; i < numSamples; ++i) {
    var r = maxRadius * (i + 1) / numSamples;
    var rp = this.distort(r);
    var v = rp;
    for (j = 0; j < numCoefficients; ++j) {
      v *= rp * rp;
      matA[j][i] = v;
    }
    vecY[i] = r - rp;
  }

  var inverseCoefficients = this.solveLeastSquares_(matA, vecY);

  return new Distortion(inverseCoefficients);
};

module.exports = Distortion;

},{}],11:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * DPDB cache.
 */
var DPDB_CACHE = {
  "format": 1,
  "last_updated": "2016-01-20T00:18:35Z",
  "devices": [

  {
    "type": "android",
    "rules": [
      { "mdmh": "asus/*/Nexus 7/*" },
      { "ua": "Nexus 7" }
    ],
    "dpi": [ 320.8, 323.0 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "asus/*/ASUS_Z00AD/*" },
      { "ua": "ASUS_Z00AD" }
    ],
    "dpi": [ 403.0, 404.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC6435LVW/*" },
      { "ua": "HTC6435LVW" }
    ],
    "dpi": [ 449.7, 443.3 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One XL/*" },
      { "ua": "HTC One XL" }
    ],
    "dpi": [ 315.3, 314.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "htc/*/Nexus 9/*" },
      { "ua": "Nexus 9" }
    ],
    "dpi": 289.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One M9/*" },
      { "ua": "HTC One M9" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One_M8/*" },
      { "ua": "HTC One_M8" }
    ],
    "dpi": [ 449.7, 447.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One/*" },
      { "ua": "HTC One" }
    ],
    "dpi": 472.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Huawei/*/Nexus 6P/*" },
      { "ua": "Nexus 6P" }
    ],
    "dpi": [ 515.1, 518.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 5X/*" },
      { "ua": "Nexus 5X" }
    ],
    "dpi": [ 422.0, 419.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGMS345/*" },
      { "ua": "LGMS345" }
    ],
    "dpi": [ 221.7, 219.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-D800/*" },
      { "ua": "LG-D800" }
    ],
    "dpi": [ 422.0, 424.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-D850/*" },
      { "ua": "LG-D850" }
    ],
    "dpi": [ 537.9, 541.9 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/VS985 4G/*" },
      { "ua": "VS985 4G" }
    ],
    "dpi": [ 537.9, 535.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 5/*" },
      { "ua": "Nexus 5 " }
    ],
    "dpi": [ 442.4, 444.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 4/*" },
      { "ua": "Nexus 4" }
    ],
    "dpi": [ 319.8, 318.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-P769/*" },
      { "ua": "LG-P769" }
    ],
    "dpi": [ 240.6, 247.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGMS323/*" },
      { "ua": "LGMS323" }
    ],
    "dpi": [ 206.6, 204.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGLS996/*" },
      { "ua": "LGLS996" }
    ],
    "dpi": [ 403.4, 401.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/4560MMX/*" },
      { "ua": "4560MMX" }
    ],
    "dpi": [ 240.0, 219.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/A250/*" },
      { "ua": "Micromax A250" }
    ],
    "dpi": [ 480.0, 446.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/Micromax AQ4501/*" },
      { "ua": "Micromax AQ4501" }
    ],
    "dpi": 240.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/DROID RAZR/*" },
      { "ua": "DROID RAZR" }
    ],
    "dpi": [ 368.1, 256.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT830C/*" },
      { "ua": "XT830C" }
    ],
    "dpi": [ 254.0, 255.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1021/*" },
      { "ua": "XT1021" }
    ],
    "dpi": [ 254.0, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1023/*" },
      { "ua": "XT1023" }
    ],
    "dpi": [ 254.0, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1028/*" },
      { "ua": "XT1028" }
    ],
    "dpi": [ 326.6, 327.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1034/*" },
      { "ua": "XT1034" }
    ],
    "dpi": [ 326.6, 328.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1053/*" },
      { "ua": "XT1053" }
    ],
    "dpi": [ 315.3, 316.1 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1562/*" },
      { "ua": "XT1562" }
    ],
    "dpi": [ 403.4, 402.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/Nexus 6/*" },
      { "ua": "Nexus 6 " }
    ],
    "dpi": [ 494.3, 489.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1063/*" },
      { "ua": "XT1063" }
    ],
    "dpi": [ 295.0, 296.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1064/*" },
      { "ua": "XT1064" }
    ],
    "dpi": [ 295.0, 295.6 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1092/*" },
      { "ua": "XT1092" }
    ],
    "dpi": [ 422.0, 424.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1095/*" },
      { "ua": "XT1095" }
    ],
    "dpi": [ 422.0, 423.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/A0001/*" },
      { "ua": "A0001" }
    ],
    "dpi": [ 403.4, 401.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/ONE E1005/*" },
      { "ua": "ONE E1005" }
    ],
    "dpi": [ 442.4, 441.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/ONE A2005/*" },
      { "ua": "ONE A2005" }
    ],
    "dpi": [ 391.9, 405.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OPPO/*/X909/*" },
      { "ua": "X909" }
    ],
    "dpi": [ 442.4, 444.1 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9082/*" },
      { "ua": "GT-I9082" }
    ],
    "dpi": [ 184.7, 185.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G360P/*" },
      { "ua": "SM-G360P" }
    ],
    "dpi": [ 196.7, 205.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/Nexus S/*" },
      { "ua": "Nexus S" }
    ],
    "dpi": [ 234.5, 229.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300/*" },
      { "ua": "GT-I9300" }
    ],
    "dpi": [ 304.8, 303.9 ],
    "bw": 5,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-T230NU/*" },
      { "ua": "SM-T230NU" }
    ],
    "dpi": 216.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SGH-T399/*" },
      { "ua": "SGH-T399" }
    ],
    "dpi": [ 217.7, 231.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N9005/*" },
      { "ua": "SM-N9005" }
    ],
    "dpi": [ 386.4, 387.0 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SAMSUNG-SM-N900A/*" },
      { "ua": "SAMSUNG-SM-N900A" }
    ],
    "dpi": [ 386.4, 387.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9500/*" },
      { "ua": "GT-I9500" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9505/*" },
      { "ua": "GT-I9505" }
    ],
    "dpi": 439.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G900F/*" },
      { "ua": "SM-G900F" }
    ],
    "dpi": [ 415.6, 431.6 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G900M/*" },
      { "ua": "SM-G900M" }
    ],
    "dpi": [ 415.6, 431.6 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G800F/*" },
      { "ua": "SM-G800F" }
    ],
    "dpi": 326.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G906S/*" },
      { "ua": "SM-G906S" }
    ],
    "dpi": [ 562.7, 572.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300/*" },
      { "ua": "GT-I9300" }
    ],
    "dpi": [ 306.7, 304.8 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-T535/*" },
      { "ua": "SM-T535" }
    ],
    "dpi": [ 142.6, 136.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N920C/*" },
      { "ua": "SM-N920C" }
    ],
    "dpi": [ 515.1, 518.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300I/*" },
      { "ua": "GT-I9300I" }
    ],
    "dpi": [ 304.8, 305.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9195/*" },
      { "ua": "GT-I9195" }
    ],
    "dpi": [ 249.4, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SPH-L520/*" },
      { "ua": "SPH-L520" }
    ],
    "dpi": [ 249.4, 255.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SAMSUNG-SGH-I717/*" },
      { "ua": "SAMSUNG-SGH-I717" }
    ],
    "dpi": 285.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SPH-D710/*" },
      { "ua": "SPH-D710" }
    ],
    "dpi": [ 217.7, 204.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-N7100/*" },
      { "ua": "GT-N7100" }
    ],
    "dpi": 265.1,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SCH-I605/*" },
      { "ua": "SCH-I605" }
    ],
    "dpi": 265.1,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/Galaxy Nexus/*" },
      { "ua": "Galaxy Nexus" }
    ],
    "dpi": [ 315.3, 314.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N910H/*" },
      { "ua": "SM-N910H" }
    ],
    "dpi": [ 515.1, 518.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N910C/*" },
      { "ua": "SM-N910C" }
    ],
    "dpi": [ 515.2, 520.2 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G130M/*" },
      { "ua": "SM-G130M" }
    ],
    "dpi": [ 165.9, 164.8 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G928I/*" },
      { "ua": "SM-G928I" }
    ],
    "dpi": [ 515.1, 518.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G920F/*" },
      { "ua": "SM-G920F" }
    ],
    "dpi": 580.6,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G920P/*" },
      { "ua": "SM-G920P" }
    ],
    "dpi": [ 522.5, 577.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G925F/*" },
      { "ua": "SM-G925F" }
    ],
    "dpi": 580.6,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G925V/*" },
      { "ua": "SM-G925V" }
    ],
    "dpi": [ 522.5, 576.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/C6903/*" },
      { "ua": "C6903" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/D6653/*" },
      { "ua": "D6653" }
    ],
    "dpi": [ 428.6, 427.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/E6653/*" },
      { "ua": "E6653" }
    ],
    "dpi": [ 428.6, 425.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/E6853/*" },
      { "ua": "E6853" }
    ],
    "dpi": [ 403.4, 401.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/SGP321/*" },
      { "ua": "SGP321" }
    ],
    "dpi": [ 224.7, 224.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "TCT/*/ALCATEL ONE TOUCH Fierce/*" },
      { "ua": "ALCATEL ONE TOUCH Fierce" }
    ],
    "dpi": [ 240.0, 247.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "THL/*/thl 5000/*" },
      { "ua": "thl 5000" }
    ],
    "dpi": [ 480.0, 443.3 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "ZTE/*/ZTE Blade L2/*" },
      { "ua": "ZTE Blade L2" }
    ],
    "dpi": 240.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 960 ] } ],
    "dpi": [ 325.1, 328.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 960 ] } ],
    "dpi": [ 325.1, 328.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 1136 ] } ],
    "dpi": [ 317.1, 320.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 1136 ] } ],
    "dpi": [ 317.1, 320.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 750, 1334 ] } ],
    "dpi": 326.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 750, 1334 ] } ],
    "dpi": 326.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 1242, 2208 ] } ],
    "dpi": [ 453.6, 458.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 1242, 2208 ] } ],
    "dpi": [ 453.6, 458.4 ],
    "bw": 4,
    "ac": 1000
  }
]};

module.exports = DPDB_CACHE;

},{}],12:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Offline cache of the DPDB, to be used until we load the online one (and
// as a fallback in case we can't load the online one).
var DPDB_CACHE = _dereq_('./dpdb-cache.js');
var Util = _dereq_('../util.js');

// Online DPDB URL.
var ONLINE_DPDB_URL = 'https://storage.googleapis.com/cardboard-dpdb/dpdb.json';

/**
 * Calculates device parameters based on the DPDB (Device Parameter Database).
 * Initially, uses the cached DPDB values.
 *
 * If fetchOnline == true, then this object tries to fetch the online version
 * of the DPDB and updates the device info if a better match is found.
 * Calls the onDeviceParamsUpdated callback when there is an update to the
 * device information.
 */
function Dpdb(fetchOnline, onDeviceParamsUpdated) {
  // Start with the offline DPDB cache while we are loading the real one.
  this.dpdb = DPDB_CACHE;

  // Calculate device params based on the offline version of the DPDB.
  this.recalculateDeviceParams_();

  // XHR to fetch online DPDB file, if requested.
  if (fetchOnline) {
    // Set the callback.
    this.onDeviceParamsUpdated = onDeviceParamsUpdated;

    var xhr = new XMLHttpRequest();
    var obj = this;
    xhr.open('GET', ONLINE_DPDB_URL, true);
    xhr.addEventListener('load', function() {
      obj.loading = false;
      if (xhr.status >= 200 && xhr.status <= 299) {
        // Success.
        obj.dpdb = JSON.parse(xhr.response);
        obj.recalculateDeviceParams_();
      } else {
        // Error loading the DPDB.
        console.error('Error loading online DPDB!');
      }
    });
    xhr.send();
  }
}

// Returns the current device parameters.
Dpdb.prototype.getDeviceParams = function() {
  return this.deviceParams;
};

// Recalculates this device's parameters based on the DPDB.
Dpdb.prototype.recalculateDeviceParams_ = function() {
  var newDeviceParams = this.calcDeviceParams_();
  if (newDeviceParams) {
    this.deviceParams = newDeviceParams;
    // Invoke callback, if it is set.
    if (this.onDeviceParamsUpdated) {
      this.onDeviceParamsUpdated(this.deviceParams);
    }
  } else {
    console.error('Failed to recalculate device parameters.');
  }
};

// Returns a DeviceParams object that represents the best guess as to this
// device's parameters. Can return null if the device does not match any
// known devices.
Dpdb.prototype.calcDeviceParams_ = function() {
  var db = this.dpdb; // shorthand
  if (!db) {
    console.error('DPDB not available.');
    return null;
  }
  if (db.format != 1) {
    console.error('DPDB has unexpected format version.');
    return null;
  }
  if (!db.devices || !db.devices.length) {
    console.error('DPDB does not have a devices section.');
    return null;
  }

  // Get the actual user agent and screen dimensions in pixels.
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();

  if (!db.devices) {
    console.error('DPDB has no devices section.');
    return null;
  }

  for (var i = 0; i < db.devices.length; i++) {
    var device = db.devices[i];
    if (!device.rules) {
      console.warn('Device[' + i + '] has no rules section.');
      continue;
    }

    if (device.type != 'ios' && device.type != 'android') {
      console.warn('Device[' + i + '] has invalid type.');
      continue;
    }

    // See if this device is of the appropriate type.
    if (Util.isIOS() != (device.type == 'ios')) continue;

    // See if this device matches any of the rules:
    var matched = false;
    for (var j = 0; j < device.rules.length; j++) {
      var rule = device.rules[j];
      if (this.matchRule_(rule, userAgent, width, height)) {
        matched = true;
        break;
      }
    }
    if (!matched) continue;

    // device.dpi might be an array of [ xdpi, ydpi] or just a scalar.
    var xdpi = device.dpi[0] || device.dpi;
    var ydpi = device.dpi[1] || device.dpi;

    return new DeviceParams({ xdpi: xdpi, ydpi: ydpi, bevelMm: device.bw });
  }

  console.warn('No DPDB device match.');
  return null;
};

Dpdb.prototype.matchRule_ = function(rule, ua, screenWidth, screenHeight) {
  // We can only match 'ua' and 'res' rules, not other types like 'mdmh'
  // (which are meant for native platforms).
  if (!rule.ua && !rule.res) return false;

  // If our user agent string doesn't contain the indicated user agent string,
  // the match fails.
  if (rule.ua && ua.indexOf(rule.ua) < 0) return false;

  // If the rule specifies screen dimensions that don't correspond to ours,
  // the match fails.
  if (rule.res) {
    if (!rule.res[0] || !rule.res[1]) return false;
    var resX = rule.res[0];
    var resY = rule.res[1];
    // Compare min and max so as to make the order not matter, i.e., it should
    // be true that 640x480 == 480x640.
    if (Math.min(screenWidth, screenHeight) != Math.min(resX, resY) ||
        (Math.max(screenWidth, screenHeight) != Math.max(resX, resY))) {
      return false;
    }
  }

  return true;
}

function DeviceParams(params) {
  this.xdpi = params.xdpi;
  this.ydpi = params.ydpi;
  this.bevelMm = params.bevelMm;
}

module.exports = Dpdb;

},{"../util.js":22,"./dpdb-cache.js":11}],13:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Util = _dereq_('./util.js');
var WebVRPolyfill = _dereq_('./webvr-polyfill.js').WebVRPolyfill;

// Initialize a WebVRConfig just in case.
window.WebVRConfig = Util.extend({
  // Forces availability of VR mode, even for non-mobile devices.
  FORCE_ENABLE_VR: false,

  // Complementary filter coefficient. 0 for accelerometer, 1 for gyro.
  K_FILTER: 0.98,

  // How far into the future to predict during fast motion (in seconds).
  PREDICTION_TIME_S: 0.040,

  // Flag to enable touch panner. In case you have your own touch controls.
  TOUCH_PANNER_DISABLED: true,

  // Flag to disabled the UI in VR Mode.
  CARDBOARD_UI_DISABLED: false, // Default: false

  // Flag to disable the instructions to rotate your device.
  ROTATE_INSTRUCTIONS_DISABLED: false, // Default: false.

  // Enable yaw panning only, disabling roll and pitch. This can be useful
  // for panoramas with nothing interesting above or below.
  YAW_ONLY: false,

  // To disable keyboard and mouse controls, if you want to use your own
  // implementation.
  MOUSE_KEYBOARD_CONTROLS_DISABLED: false,

  // Prevent the polyfill from initializing immediately. Requires the app
  // to call InitializeWebVRPolyfill() before it can be used.
  DEFER_INITIALIZATION: false,

  // Enable the deprecated version of the API (navigator.getVRDevices).
  ENABLE_DEPRECATED_API: false,

  // Scales the recommended buffer size reported by WebVR, which can improve
  // performance.
  // UPDATE(2016-05-03): Setting this to 0.5 by default since 1.0 does not
  // perform well on many mobile devices.
  BUFFER_SCALE: 0.5,

  // Allow VRDisplay.submitFrame to change gl bindings, which is more
  // efficient if the application code will re-bind its resources on the
  // next frame anyway. This has been seen to cause rendering glitches with
  // THREE.js.
  // Dirty bindings include: gl.FRAMEBUFFER_BINDING, gl.CURRENT_PROGRAM,
  // gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING,
  // and gl.TEXTURE_BINDING_2D for texture unit 0.
  DIRTY_SUBMIT_FRAME_BINDINGS: false,

  // When set to true, this will cause a polyfilled VRDisplay to always be
  // appended to the list returned by navigator.getVRDisplays(), even if that
  // list includes a native VRDisplay.
  ALWAYS_APPEND_POLYFILL_DISPLAY: false
}, window.WebVRConfig);

if (!window.WebVRConfig.DEFER_INITIALIZATION) {
  new WebVRPolyfill();
} else {
  window.InitializeWebVRPolyfill = function() {
    new WebVRPolyfill();
  }
}

},{"./util.js":22,"./webvr-polyfill.js":25}],14:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var MathUtil = window.MathUtil || {};

MathUtil.degToRad = Math.PI / 180;
MathUtil.radToDeg = 180 / Math.PI;

// Some minimal math functionality borrowed from THREE.Math and stripped down
// for the purposes of this library.


MathUtil.Vector2 = function ( x, y ) {
  this.x = x || 0;
  this.y = y || 0;
};

MathUtil.Vector2.prototype = {
  constructor: MathUtil.Vector2,

  set: function ( x, y ) {
    this.x = x;
    this.y = y;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;

    return this;
  },

  subVectors: function ( a, b ) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;

    return this;
  },
};

MathUtil.Vector3 = function ( x, y, z ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
};

MathUtil.Vector3.prototype = {
  constructor: MathUtil.Vector3,

  set: function ( x, y, z ) {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;

    return this;
  },

  length: function () {
    return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
  },

  normalize: function () {
    var scalar = this.length();

    if ( scalar !== 0 ) {
      var invScalar = 1 / scalar;

      this.multiplyScalar(invScalar);
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }

    return this;
  },

  multiplyScalar: function ( scalar ) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
  },

  applyQuaternion: function ( q ) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var qx = q.x;
    var qy = q.y;
    var qz = q.z;
    var qw = q.w;

    // calculate quat * vector
    var ix =  qw * x + qy * z - qz * y;
    var iy =  qw * y + qz * x - qx * z;
    var iz =  qw * z + qx * y - qy * x;
    var iw = - qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
    this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
    this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

    return this;
  },

  dot: function ( v ) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  },

  crossVectors: function ( a, b ) {
    var ax = a.x, ay = a.y, az = a.z;
    var bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  },
};

MathUtil.Quaternion = function ( x, y, z, w ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.w = ( w !== undefined ) ? w : 1;
};

MathUtil.Quaternion.prototype = {
  constructor: MathUtil.Quaternion,

  set: function ( x, y, z, w ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    return this;
  },

  copy: function ( quaternion ) {
    this.x = quaternion.x;
    this.y = quaternion.y;
    this.z = quaternion.z;
    this.w = quaternion.w;

    return this;
  },

  setFromEulerXYZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;

    return this;
  },

  setFromEulerYXZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 - s1 * s2 * c3;
    this.w = c1 * c2 * c3 + s1 * s2 * s3;

    return this;
  },

  setFromAxisAngle: function ( axis, angle ) {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
    // assumes axis is normalized

    var halfAngle = angle / 2, s = Math.sin( halfAngle );

    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos( halfAngle );

    return this;
  },

  multiply: function ( q ) {
    return this.multiplyQuaternions( this, q );
  },

  multiplyQuaternions: function ( a, b ) {
    // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

    var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    var qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

    return this;
  },

  inverse: function () {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;

    this.normalize();

    return this;
  },

  normalize: function () {
    var l = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

    if ( l === 0 ) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;

      this.x = this.x * l;
      this.y = this.y * l;
      this.z = this.z * l;
      this.w = this.w * l;
    }

    return this;
  },

  slerp: function ( qb, t ) {
    if ( t === 0 ) return this;
    if ( t === 1 ) return this.copy( qb );

    var x = this.x, y = this.y, z = this.z, w = this.w;

    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

    var cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

    if ( cosHalfTheta < 0 ) {
      this.w = - qb.w;
      this.x = - qb.x;
      this.y = - qb.y;
      this.z = - qb.z;

      cosHalfTheta = - cosHalfTheta;
    } else {
      this.copy( qb );
    }

    if ( cosHalfTheta >= 1.0 ) {
      this.w = w;
      this.x = x;
      this.y = y;
      this.z = z;

      return this;
    }

    var halfTheta = Math.acos( cosHalfTheta );
    var sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

    if ( Math.abs( sinHalfTheta ) < 0.001 ) {
      this.w = 0.5 * ( w + this.w );
      this.x = 0.5 * ( x + this.x );
      this.y = 0.5 * ( y + this.y );
      this.z = 0.5 * ( z + this.z );

      return this;
    }

    var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
    ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

    this.w = ( w * ratioA + this.w * ratioB );
    this.x = ( x * ratioA + this.x * ratioB );
    this.y = ( y * ratioA + this.y * ratioB );
    this.z = ( z * ratioA + this.z * ratioB );

    return this;
  },

  setFromUnitVectors: function () {
    // http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final
    // assumes direction vectors vFrom and vTo are normalized

    var v1, r;
    var EPS = 0.000001;

    return function ( vFrom, vTo ) {
      if ( v1 === undefined ) v1 = new MathUtil.Vector3();

      r = vFrom.dot( vTo ) + 1;

      if ( r < EPS ) {
        r = 0;

        if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {
          v1.set( - vFrom.y, vFrom.x, 0 );
        } else {
          v1.set( 0, - vFrom.z, vFrom.y );
        }
      } else {
        v1.crossVectors( vFrom, vTo );
      }

      this.x = v1.x;
      this.y = v1.y;
      this.z = v1.z;
      this.w = r;

      this.normalize();

      return this;
    }
  }(),
};

module.exports = MathUtil;

},{}],15:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var VRDisplay = _dereq_('./base.js').VRDisplay;
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

// How much to rotate per key stroke.
var KEY_SPEED = 0.15;
var KEY_ANIMATION_DURATION = 80;

// How much to rotate for mouse events.
var MOUSE_SPEED_X = 0.5;
var MOUSE_SPEED_Y = 0.3;

/**
 * VRDisplay based on mouse and keyboard input. Designed for desktops/laptops
 * where orientation events aren't supported. Cannot present.
 */
function MouseKeyboardVRDisplay() {
  this.displayName = 'Mouse and Keyboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;

  // Attach to mouse and keyboard events.
  window.addEventListener('keydown', this.onKeyDown_.bind(this));
  window.addEventListener('mousemove', this.onMouseMove_.bind(this));
  window.addEventListener('mousedown', this.onMouseDown_.bind(this));
  window.addEventListener('mouseup', this.onMouseUp_.bind(this));

  // "Private" members.
  this.phi_ = 0;
  this.theta_ = 0;

  // Variables for keyboard-based rotation animation.
  this.targetAngle_ = null;
  this.angleAnimation_ = null;

  // State variables for calculations.
  this.orientation_ = new MathUtil.Quaternion();

  // Variables for mouse-based rotation.
  this.rotateStart_ = new MathUtil.Vector2();
  this.rotateEnd_ = new MathUtil.Vector2();
  this.rotateDelta_ = new MathUtil.Vector2();
  this.isDragging_ = false;

  this.orientationOut_ = new Float32Array(4);
}
MouseKeyboardVRDisplay.prototype = new VRDisplay();

MouseKeyboardVRDisplay.prototype.getImmediatePose = function() {
  this.orientation_.setFromEulerYXZ(this.phi_, this.theta_, 0);

  this.orientationOut_[0] = this.orientation_.x;
  this.orientationOut_[1] = this.orientation_.y;
  this.orientationOut_[2] = this.orientation_.z;
  this.orientationOut_[3] = this.orientation_.w;

  return {
    position: null,
    orientation: this.orientationOut_,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

MouseKeyboardVRDisplay.prototype.onKeyDown_ = function(e) {
  // Track WASD and arrow keys.
  if (e.keyCode == 38) { // Up key.
    this.animatePhi_(this.phi_ + KEY_SPEED);
  } else if (e.keyCode == 39) { // Right key.
    this.animateTheta_(this.theta_ - KEY_SPEED);
  } else if (e.keyCode == 40) { // Down key.
    this.animatePhi_(this.phi_ - KEY_SPEED);
  } else if (e.keyCode == 37) { // Left key.
    this.animateTheta_(this.theta_ + KEY_SPEED);
  }
};

MouseKeyboardVRDisplay.prototype.animateTheta_ = function(targetAngle) {
  this.animateKeyTransitions_('theta_', targetAngle);
};

MouseKeyboardVRDisplay.prototype.animatePhi_ = function(targetAngle) {
  // Prevent looking too far up or down.
  targetAngle = Util.clamp(targetAngle, -Math.PI/2, Math.PI/2);
  this.animateKeyTransitions_('phi_', targetAngle);
};

/**
 * Start an animation to transition an angle from one value to another.
 */
MouseKeyboardVRDisplay.prototype.animateKeyTransitions_ = function(angleName, targetAngle) {
  // If an animation is currently running, cancel it.
  if (this.angleAnimation_) {
    cancelAnimationFrame(this.angleAnimation_);
  }
  var startAngle = this[angleName];
  var startTime = new Date();
  // Set up an interval timer to perform the animation.
  this.angleAnimation_ = requestAnimationFrame(function animate() {
    // Once we're finished the animation, we're done.
    var elapsed = new Date() - startTime;
    if (elapsed >= KEY_ANIMATION_DURATION) {
      this[angleName] = targetAngle;
      cancelAnimationFrame(this.angleAnimation_);
      return;
    }
    // loop with requestAnimationFrame
    this.angleAnimation_ = requestAnimationFrame(animate.bind(this))
    // Linearly interpolate the angle some amount.
    var percent = elapsed / KEY_ANIMATION_DURATION;
    this[angleName] = startAngle + (targetAngle - startAngle) * percent;
  }.bind(this));
};

MouseKeyboardVRDisplay.prototype.onMouseDown_ = function(e) {
  this.rotateStart_.set(e.clientX, e.clientY);
  this.isDragging_ = true;
};

// Very similar to https://gist.github.com/mrflix/8351020
MouseKeyboardVRDisplay.prototype.onMouseMove_ = function(e) {
  if (!this.isDragging_ && !this.isPointerLocked_()) {
    return;
  }
  // Support pointer lock API.
  if (this.isPointerLocked_()) {
    var movementX = e.movementX || e.mozMovementX || 0;
    var movementY = e.movementY || e.mozMovementY || 0;
    this.rotateEnd_.set(this.rotateStart_.x - movementX, this.rotateStart_.y - movementY);
  } else {
    this.rotateEnd_.set(e.clientX, e.clientY);
  }
  // Calculate how much we moved in mouse space.
  this.rotateDelta_.subVectors(this.rotateEnd_, this.rotateStart_);
  this.rotateStart_.copy(this.rotateEnd_);

  // Keep track of the cumulative euler angles.
  this.phi_ += 2 * Math.PI * this.rotateDelta_.y / screen.height * MOUSE_SPEED_Y;
  this.theta_ += 2 * Math.PI * this.rotateDelta_.x / screen.width * MOUSE_SPEED_X;

  // Prevent looking too far up or down.
  this.phi_ = Util.clamp(this.phi_, -Math.PI/2, Math.PI/2);
};

MouseKeyboardVRDisplay.prototype.onMouseUp_ = function(e) {
  this.isDragging_ = false;
};

MouseKeyboardVRDisplay.prototype.isPointerLocked_ = function() {
  var el = document.pointerLockElement || document.mozPointerLockElement ||
      document.webkitPointerLockElement;
  return el !== undefined;
};

MouseKeyboardVRDisplay.prototype.resetPose = function() {
  this.phi_ = 0;
  this.theta_ = 0;
};

module.exports = MouseKeyboardVRDisplay;

},{"./base.js":3,"./math-util.js":14,"./util.js":22}],16:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');

function RotateInstructions() {
  this.loadIcon_();

  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.top = 0;
  s.right = 0;
  s.bottom = 0;
  s.left = 0;
  s.backgroundColor = 'gray';
  s.fontFamily = 'sans-serif';
  // Force this to be above the fullscreen canvas, which is at zIndex: 999999.
  s.zIndex = 1000000;

  var img = document.createElement('img');
  img.src = this.icon;
  var s = img.style;
  s.marginLeft = '25%';
  s.marginTop = '25%';
  s.width = '50%';
  overlay.appendChild(img);

  var text = document.createElement('div');
  var s = text.style;
  s.textAlign = 'center';
  s.fontSize = '16px';
  s.lineHeight = '24px';
  s.margin = '24px 25%';
  s.width = '50%';
  text.innerHTML = 'Place your phone into your Cardboard viewer.';
  overlay.appendChild(text);

  var snackbar = document.createElement('div');
  var s = snackbar.style;
  s.backgroundColor = '#CFD8DC';
  s.position = 'fixed';
  s.bottom = 0;
  s.width = '100%';
  s.height = '48px';
  s.padding = '14px 24px';
  s.boxSizing = 'border-box';
  s.color = '#656A6B';
  overlay.appendChild(snackbar);

  var snackbarText = document.createElement('div');
  snackbarText.style.float = 'left';
  snackbarText.innerHTML = 'No Cardboard viewer?';

  var snackbarButton = document.createElement('a');
  snackbarButton.href = 'https://www.google.com/get/cardboard/get-cardboard/';
  snackbarButton.innerHTML = 'get one';
  snackbarButton.target = '_blank';
  var s = snackbarButton.style;
  s.float = 'right';
  s.fontWeight = 600;
  s.textTransform = 'uppercase';
  s.borderLeft = '1px solid gray';
  s.paddingLeft = '24px';
  s.textDecoration = 'none';
  s.color = '#656A6B';

  snackbar.appendChild(snackbarText);
  snackbar.appendChild(snackbarButton);

  this.overlay = overlay;
  this.text = text;

  this.hide();
}

RotateInstructions.prototype.show = function(parent) {
  if (!parent && !this.overlay.parentElement) {
    document.body.appendChild(this.overlay);
  } else if (parent) {
    if (this.overlay.parentElement && this.overlay.parentElement != parent)
      this.overlay.parentElement.removeChild(this.overlay);

    parent.appendChild(this.overlay);
  }

  this.overlay.style.display = 'block';

  var img = this.overlay.querySelector('img');
  var s = img.style;

  if (Util.isLandscapeMode()) {
    s.width = '20%';
    s.marginLeft = '40%';
    s.marginTop = '3%';
  } else {
    s.width = '50%';
    s.marginLeft = '25%';
    s.marginTop = '25%';
  }
};

RotateInstructions.prototype.hide = function() {
  this.overlay.style.display = 'none';
};

RotateInstructions.prototype.showTemporarily = function(ms, parent) {
  this.show(parent);
  this.timer = setTimeout(this.hide.bind(this), ms);
};

RotateInstructions.prototype.disableShowTemporarily = function() {
  clearTimeout(this.timer);
};

RotateInstructions.prototype.update = function() {
  this.disableShowTemporarily();
  // In portrait VR mode, tell the user to rotate to landscape. Otherwise, hide
  // the instructions.
  if (!Util.isLandscapeMode() && Util.isMobile()) {
    this.show();
  } else {
    this.hide();
  }
};

RotateInstructions.prototype.loadIcon_ = function() {
  // Encoded asset_src/rotate-instructions.svg
  this.icon = Util.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjE5OHB4IiBoZWlnaHQ9IjI0MHB4IiB2aWV3Qm94PSIwIDAgMTk4IDI0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczpza2V0Y2g9Imh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaC9ucyI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDMuMy4zICgxMjA4MSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+dHJhbnNpdGlvbjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHNrZXRjaDp0eXBlPSJNU1BhZ2UiPgogICAgICAgIDxnIGlkPSJ0cmFuc2l0aW9uIiBza2V0Y2g6dHlwZT0iTVNBcnRib2FyZEdyb3VwIj4KICAgICAgICAgICAgPGcgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTQtKy1JbXBvcnRlZC1MYXllcnMtQ29weS0rLUltcG9ydGVkLUxheWVycy1Db3B5LTItQ29weSIgc2tldGNoOnR5cGU9Ik1TTGF5ZXJHcm91cCI+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHktNCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsIDEwNy4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjYyNSwyLjUyNyBDMTQ5LjYyNSwyLjUyNyAxNTUuODA1LDYuMDk2IDE1Ni4zNjIsNi40MTggTDE1Ni4zNjIsNy4zMDQgQzE1Ni4zNjIsNy40ODEgMTU2LjM3NSw3LjY2NCAxNTYuNCw3Ljg1MyBDMTU2LjQxLDcuOTM0IDE1Ni40Miw4LjAxNSAxNTYuNDI3LDguMDk1IEMxNTYuNTY3LDkuNTEgMTU3LjQwMSwxMS4wOTMgMTU4LjUzMiwxMi4wOTQgTDE2NC4yNTIsMTcuMTU2IEwxNjQuMzMzLDE3LjA2NiBDMTY0LjMzMywxNy4wNjYgMTY4LjcxNSwxNC41MzYgMTY5LjU2OCwxNC4wNDIgQzE3MS4wMjUsMTQuODgzIDE5NS41MzgsMjkuMDM1IDE5NS41MzgsMjkuMDM1IEwxOTUuNTM4LDgzLjAzNiBDMTk1LjUzOCw4My44MDcgMTk1LjE1Miw4NC4yNTMgMTk0LjU5LDg0LjI1MyBDMTk0LjM1Nyw4NC4yNTMgMTk0LjA5NSw4NC4xNzcgMTkzLjgxOCw4NC4wMTcgTDE2OS44NTEsNzAuMTc5IEwxNjkuODM3LDcwLjIwMyBMMTQyLjUxNSw4NS45NzggTDE0MS42NjUsODQuNjU1IEMxMzYuOTM0LDgzLjEyNiAxMzEuOTE3LDgxLjkxNSAxMjYuNzE0LDgxLjA0NSBDMTI2LjcwOSw4MS4wNiAxMjYuNzA3LDgxLjA2OSAxMjYuNzA3LDgxLjA2OSBMMTIxLjY0LDk4LjAzIEwxMTMuNzQ5LDEwMi41ODYgTDExMy43MTIsMTAyLjUyMyBMMTEzLjcxMiwxMzAuMTEzIEMxMTMuNzEyLDEzMC44ODUgMTEzLjMyNiwxMzEuMzMgMTEyLjc2NCwxMzEuMzMgQzExMi41MzIsMTMxLjMzIDExMi4yNjksMTMxLjI1NCAxMTEuOTkyLDEzMS4wOTQgTDY5LjUxOSwxMDYuNTcyIEM2OC41NjksMTA2LjAyMyA2Ny43OTksMTA0LjY5NSA2Ny43OTksMTAzLjYwNSBMNjcuNzk5LDEwMi41NyBMNjcuNzc4LDEwMi42MTcgQzY3LjI3LDEwMi4zOTMgNjYuNjQ4LDEwMi4yNDkgNjUuOTYyLDEwMi4yMTggQzY1Ljg3NSwxMDIuMjE0IDY1Ljc4OCwxMDIuMjEyIDY1LjcwMSwxMDIuMjEyIEM2NS42MDYsMTAyLjIxMiA2NS41MTEsMTAyLjIxNSA2NS40MTYsMTAyLjIxOSBDNjUuMTk1LDEwMi4yMjkgNjQuOTc0LDEwMi4yMzUgNjQuNzU0LDEwMi4yMzUgQzY0LjMzMSwxMDIuMjM1IDYzLjkxMSwxMDIuMjE2IDYzLjQ5OCwxMDIuMTc4IEM2MS44NDMsMTAyLjAyNSA2MC4yOTgsMTAxLjU3OCA1OS4wOTQsMTAwLjg4MiBMMTIuNTE4LDczLjk5MiBMMTIuNTIzLDc0LjAwNCBMMi4yNDUsNTUuMjU0IEMxLjI0NCw1My40MjcgMi4wMDQsNTEuMDM4IDMuOTQzLDQ5LjkxOCBMNTkuOTU0LDE3LjU3MyBDNjAuNjI2LDE3LjE4NSA2MS4zNSwxNy4wMDEgNjIuMDUzLDE3LjAwMSBDNjMuMzc5LDE3LjAwMSA2NC42MjUsMTcuNjYgNjUuMjgsMTguODU0IEw2NS4yODUsMTguODUxIEw2NS41MTIsMTkuMjY0IEw2NS41MDYsMTkuMjY4IEM2NS45MDksMjAuMDAzIDY2LjQwNSwyMC42OCA2Ni45ODMsMjEuMjg2IEw2Ny4yNiwyMS41NTYgQzY5LjE3NCwyMy40MDYgNzEuNzI4LDI0LjM1NyA3NC4zNzMsMjQuMzU3IEM3Ni4zMjIsMjQuMzU3IDc4LjMyMSwyMy44NCA4MC4xNDgsMjIuNzg1IEM4MC4xNjEsMjIuNzg1IDg3LjQ2NywxOC41NjYgODcuNDY3LDE4LjU2NiBDODguMTM5LDE4LjE3OCA4OC44NjMsMTcuOTk0IDg5LjU2NiwxNy45OTQgQzkwLjg5MiwxNy45OTQgOTIuMTM4LDE4LjY1MiA5Mi43OTIsMTkuODQ3IEw5Ni4wNDIsMjUuNzc1IEw5Ni4wNjQsMjUuNzU3IEwxMDIuODQ5LDI5LjY3NCBMMTAyLjc0NCwyOS40OTIgTDE0OS42MjUsMi41MjcgTTE0OS42MjUsMC44OTIgQzE0OS4zNDMsMC44OTIgMTQ5LjA2MiwwLjk2NSAxNDguODEsMS4xMSBMMTAyLjY0MSwyNy42NjYgTDk3LjIzMSwyNC41NDIgTDk0LjIyNiwxOS4wNjEgQzkzLjMxMywxNy4zOTQgOTEuNTI3LDE2LjM1OSA4OS41NjYsMTYuMzU4IEM4OC41NTUsMTYuMzU4IDg3LjU0NiwxNi42MzIgODYuNjQ5LDE3LjE1IEM4My44NzgsMTguNzUgNzkuNjg3LDIxLjE2OSA3OS4zNzQsMjEuMzQ1IEM3OS4zNTksMjEuMzUzIDc5LjM0NSwyMS4zNjEgNzkuMzMsMjEuMzY5IEM3Ny43OTgsMjIuMjU0IDc2LjA4NCwyMi43MjIgNzQuMzczLDIyLjcyMiBDNzIuMDgxLDIyLjcyMiA2OS45NTksMjEuODkgNjguMzk3LDIwLjM4IEw2OC4xNDUsMjAuMTM1IEM2Ny43MDYsMTkuNjcyIDY3LjMyMywxOS4xNTYgNjcuMDA2LDE4LjYwMSBDNjYuOTg4LDE4LjU1OSA2Ni45NjgsMTguNTE5IDY2Ljk0NiwxOC40NzkgTDY2LjcxOSwxOC4wNjUgQzY2LjY5LDE4LjAxMiA2Ni42NTgsMTcuOTYgNjYuNjI0LDE3LjkxMSBDNjUuNjg2LDE2LjMzNyA2My45NTEsMTUuMzY2IDYyLjA1MywxNS4zNjYgQzYxLjA0MiwxNS4zNjYgNjAuMDMzLDE1LjY0IDU5LjEzNiwxNi4xNTggTDMuMTI1LDQ4LjUwMiBDMC40MjYsNTAuMDYxIC0wLjYxMyw1My40NDIgMC44MTEsNTYuMDQgTDExLjA4OSw3NC43OSBDMTEuMjY2LDc1LjExMyAxMS41MzcsNzUuMzUzIDExLjg1LDc1LjQ5NCBMNTguMjc2LDEwMi4yOTggQzU5LjY3OSwxMDMuMTA4IDYxLjQzMywxMDMuNjMgNjMuMzQ4LDEwMy44MDYgQzYzLjgxMiwxMDMuODQ4IDY0LjI4NSwxMDMuODcgNjQuNzU0LDEwMy44NyBDNjUsMTAzLjg3IDY1LjI0OSwxMDMuODY0IDY1LjQ5NCwxMDMuODUyIEM2NS41NjMsMTAzLjg0OSA2NS42MzIsMTAzLjg0NyA2NS43MDEsMTAzLjg0NyBDNjUuNzY0LDEwMy44NDcgNjUuODI4LDEwMy44NDkgNjUuODksMTAzLjg1MiBDNjUuOTg2LDEwMy44NTYgNjYuMDgsMTAzLjg2MyA2Ni4xNzMsMTAzLjg3NCBDNjYuMjgyLDEwNS40NjcgNjcuMzMyLDEwNy4xOTcgNjguNzAyLDEwNy45ODggTDExMS4xNzQsMTMyLjUxIEMxMTEuNjk4LDEzMi44MTIgMTEyLjIzMiwxMzIuOTY1IDExMi43NjQsMTMyLjk2NSBDMTE0LjI2MSwxMzIuOTY1IDExNS4zNDcsMTMxLjc2NSAxMTUuMzQ3LDEzMC4xMTMgTDExNS4zNDcsMTAzLjU1MSBMMTIyLjQ1OCw5OS40NDYgQzEyMi44MTksOTkuMjM3IDEyMy4wODcsOTguODk4IDEyMy4yMDcsOTguNDk4IEwxMjcuODY1LDgyLjkwNSBDMTMyLjI3OSw4My43MDIgMTM2LjU1Nyw4NC43NTMgMTQwLjYwNyw4Ni4wMzMgTDE0MS4xNCw4Ni44NjIgQzE0MS40NTEsODcuMzQ2IDE0MS45NzcsODcuNjEzIDE0Mi41MTYsODcuNjEzIEMxNDIuNzk0LDg3LjYxMyAxNDMuMDc2LDg3LjU0MiAxNDMuMzMzLDg3LjM5MyBMMTY5Ljg2NSw3Mi4wNzYgTDE5Myw4NS40MzMgQzE5My41MjMsODUuNzM1IDE5NC4wNTgsODUuODg4IDE5NC41OSw4NS44ODggQzE5Ni4wODcsODUuODg4IDE5Ny4xNzMsODQuNjg5IDE5Ny4xNzMsODMuMDM2IEwxOTcuMTczLDI5LjAzNSBDMTk3LjE3MywyOC40NTEgMTk2Ljg2MSwyNy45MTEgMTk2LjM1NSwyNy42MTkgQzE5Ni4zNTUsMjcuNjE5IDE3MS44NDMsMTMuNDY3IDE3MC4zODUsMTIuNjI2IEMxNzAuMTMyLDEyLjQ4IDE2OS44NSwxMi40MDcgMTY5LjU2OCwxMi40MDcgQzE2OS4yODUsMTIuNDA3IDE2OS4wMDIsMTIuNDgxIDE2OC43NDksMTIuNjI3IEMxNjguMTQzLDEyLjk3OCAxNjUuNzU2LDE0LjM1NyAxNjQuNDI0LDE1LjEyNSBMMTU5LjYxNSwxMC44NyBDMTU4Ljc5NiwxMC4xNDUgMTU4LjE1NCw4LjkzNyAxNTguMDU0LDcuOTM0IEMxNTguMDQ1LDcuODM3IDE1OC4wMzQsNy43MzkgMTU4LjAyMSw3LjY0IEMxNTguMDA1LDcuNTIzIDE1Ny45OTgsNy40MSAxNTcuOTk4LDcuMzA0IEwxNTcuOTk4LDYuNDE4IEMxNTcuOTk4LDUuODM0IDE1Ny42ODYsNS4yOTUgMTU3LjE4MSw1LjAwMiBDMTU2LjYyNCw0LjY4IDE1MC40NDIsMS4xMTEgMTUwLjQ0MiwxLjExMSBDMTUwLjE4OSwwLjk2NSAxNDkuOTA3LDAuODkyIDE0OS42MjUsMC44OTIiIGlkPSJGaWxsLTEiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTYuMDI3LDI1LjYzNiBMMTQyLjYwMyw1Mi41MjcgQzE0My44MDcsNTMuMjIyIDE0NC41ODIsNTQuMTE0IDE0NC44NDUsNTUuMDY4IEwxNDQuODM1LDU1LjA3NSBMNjMuNDYxLDEwMi4wNTcgTDYzLjQ2LDEwMi4wNTcgQzYxLjgwNiwxMDEuOTA1IDYwLjI2MSwxMDEuNDU3IDU5LjA1NywxMDAuNzYyIEwxMi40ODEsNzMuODcxIEw5Ni4wMjcsMjUuNjM2IiBpZD0iRmlsbC0yIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYzLjQ2MSwxMDIuMTc0IEM2My40NTMsMTAyLjE3NCA2My40NDYsMTAyLjE3NCA2My40MzksMTAyLjE3MiBDNjEuNzQ2LDEwMi4wMTYgNjAuMjExLDEwMS41NjMgNTguOTk4LDEwMC44NjMgTDEyLjQyMiw3My45NzMgQzEyLjM4Niw3My45NTIgMTIuMzY0LDczLjkxNCAxMi4zNjQsNzMuODcxIEMxMi4zNjQsNzMuODMgMTIuMzg2LDczLjc5MSAxMi40MjIsNzMuNzcgTDk1Ljk2OCwyNS41MzUgQzk2LjAwNCwyNS41MTQgOTYuMDQ5LDI1LjUxNCA5Ni4wODUsMjUuNTM1IEwxNDIuNjYxLDUyLjQyNiBDMTQzLjg4OCw1My4xMzQgMTQ0LjY4Miw1NC4wMzggMTQ0Ljk1Nyw1NS4wMzcgQzE0NC45Nyw1NS4wODMgMTQ0Ljk1Myw1NS4xMzMgMTQ0LjkxNSw1NS4xNjEgQzE0NC45MTEsNTUuMTY1IDE0NC44OTgsNTUuMTc0IDE0NC44OTQsNTUuMTc3IEw2My41MTksMTAyLjE1OCBDNjMuNTAxLDEwMi4xNjkgNjMuNDgxLDEwMi4xNzQgNjMuNDYxLDEwMi4xNzQgTDYzLjQ2MSwxMDIuMTc0IFogTTEyLjcxNCw3My44NzEgTDU5LjExNSwxMDAuNjYxIEM2MC4yOTMsMTAxLjM0MSA2MS43ODYsMTAxLjc4MiA2My40MzUsMTAxLjkzNyBMMTQ0LjcwNyw1NS4wMTUgQzE0NC40MjgsNTQuMTA4IDE0My42ODIsNTMuMjg1IDE0Mi41NDQsNTIuNjI4IEw5Ni4wMjcsMjUuNzcxIEwxMi43MTQsNzMuODcxIEwxMi43MTQsNzMuODcxIFoiIGlkPSJGaWxsLTMiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ4LjMyNyw1OC40NzEgQzE0OC4xNDUsNTguNDggMTQ3Ljk2Miw1OC40OCAxNDcuNzgxLDU4LjQ3MiBDMTQ1Ljg4Nyw1OC4zODkgMTQ0LjQ3OSw1Ny40MzQgMTQ0LjYzNiw1Ni4zNCBDMTQ0LjY4OSw1NS45NjcgMTQ0LjY2NCw1NS41OTcgMTQ0LjU2NCw1NS4yMzUgTDYzLjQ2MSwxMDIuMDU3IEM2NC4wODksMTAyLjExNSA2NC43MzMsMTAyLjEzIDY1LjM3OSwxMDIuMDk5IEM2NS41NjEsMTAyLjA5IDY1Ljc0MywxMDIuMDkgNjUuOTI1LDEwMi4wOTggQzY3LjgxOSwxMDIuMTgxIDY5LjIyNywxMDMuMTM2IDY5LjA3LDEwNC4yMyBMMTQ4LjMyNyw1OC40NzEiIGlkPSJGaWxsLTQiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNjkuMDcsMTA0LjM0NyBDNjkuMDQ4LDEwNC4zNDcgNjkuMDI1LDEwNC4zNCA2OS4wMDUsMTA0LjMyNyBDNjguOTY4LDEwNC4zMDEgNjguOTQ4LDEwNC4yNTcgNjguOTU1LDEwNC4yMTMgQzY5LDEwMy44OTYgNjguODk4LDEwMy41NzYgNjguNjU4LDEwMy4yODggQzY4LjE1MywxMDIuNjc4IDY3LjEwMywxMDIuMjY2IDY1LjkyLDEwMi4yMTQgQzY1Ljc0MiwxMDIuMjA2IDY1LjU2MywxMDIuMjA3IDY1LjM4NSwxMDIuMjE1IEM2NC43NDIsMTAyLjI0NiA2NC4wODcsMTAyLjIzMiA2My40NSwxMDIuMTc0IEM2My4zOTksMTAyLjE2OSA2My4zNTgsMTAyLjEzMiA2My4zNDcsMTAyLjA4MiBDNjMuMzM2LDEwMi4wMzMgNjMuMzU4LDEwMS45ODEgNjMuNDAyLDEwMS45NTYgTDE0NC41MDYsNTUuMTM0IEMxNDQuNTM3LDU1LjExNiAxNDQuNTc1LDU1LjExMyAxNDQuNjA5LDU1LjEyNyBDMTQ0LjY0Miw1NS4xNDEgMTQ0LjY2OCw1NS4xNyAxNDQuNjc3LDU1LjIwNCBDMTQ0Ljc4MSw1NS41ODUgMTQ0LjgwNiw1NS45NzIgMTQ0Ljc1MSw1Ni4zNTcgQzE0NC43MDYsNTYuNjczIDE0NC44MDgsNTYuOTk0IDE0NS4wNDcsNTcuMjgyIEMxNDUuNTUzLDU3Ljg5MiAxNDYuNjAyLDU4LjMwMyAxNDcuNzg2LDU4LjM1NSBDMTQ3Ljk2NCw1OC4zNjMgMTQ4LjE0Myw1OC4zNjMgMTQ4LjMyMSw1OC4zNTQgQzE0OC4zNzcsNTguMzUyIDE0OC40MjQsNTguMzg3IDE0OC40MzksNTguNDM4IEMxNDguNDU0LDU4LjQ5IDE0OC40MzIsNTguNTQ1IDE0OC4zODUsNTguNTcyIEw2OS4xMjksMTA0LjMzMSBDNjkuMTExLDEwNC4zNDIgNjkuMDksMTA0LjM0NyA2OS4wNywxMDQuMzQ3IEw2OS4wNywxMDQuMzQ3IFogTTY1LjY2NSwxMDEuOTc1IEM2NS43NTQsMTAxLjk3NSA2NS44NDIsMTAxLjk3NyA2NS45MywxMDEuOTgxIEM2Ny4xOTYsMTAyLjAzNyA2OC4yODMsMTAyLjQ2OSA2OC44MzgsMTAzLjEzOSBDNjkuMDY1LDEwMy40MTMgNjkuMTg4LDEwMy43MTQgNjkuMTk4LDEwNC4wMjEgTDE0Ny44ODMsNTguNTkyIEMxNDcuODQ3LDU4LjU5MiAxNDcuODExLDU4LjU5MSAxNDcuNzc2LDU4LjU4OSBDMTQ2LjUwOSw1OC41MzMgMTQ1LjQyMiw1OC4xIDE0NC44NjcsNTcuNDMxIEMxNDQuNTg1LDU3LjA5MSAxNDQuNDY1LDU2LjcwNyAxNDQuNTIsNTYuMzI0IEMxNDQuNTYzLDU2LjAyMSAxNDQuNTUyLDU1LjcxNiAxNDQuNDg4LDU1LjQxNCBMNjMuODQ2LDEwMS45NyBDNjQuMzUzLDEwMi4wMDIgNjQuODY3LDEwMi4wMDYgNjUuMzc0LDEwMS45ODIgQzY1LjQ3MSwxMDEuOTc3IDY1LjU2OCwxMDEuOTc1IDY1LjY2NSwxMDEuOTc1IEw2NS42NjUsMTAxLjk3NSBaIiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTIuMjA4LDU1LjEzNCBDMS4yMDcsNTMuMzA3IDEuOTY3LDUwLjkxNyAzLjkwNiw0OS43OTcgTDU5LjkxNywxNy40NTMgQzYxLjg1NiwxNi4zMzMgNjQuMjQxLDE2LjkwNyA2NS4yNDMsMTguNzM0IEw2NS40NzUsMTkuMTQ0IEM2NS44NzIsMTkuODgyIDY2LjM2OCwyMC41NiA2Ni45NDUsMjEuMTY1IEw2Ny4yMjMsMjEuNDM1IEM3MC41NDgsMjQuNjQ5IDc1LjgwNiwyNS4xNTEgODAuMTExLDIyLjY2NSBMODcuNDMsMTguNDQ1IEM4OS4zNywxNy4zMjYgOTEuNzU0LDE3Ljg5OSA5Mi43NTUsMTkuNzI3IEw5Ni4wMDUsMjUuNjU1IEwxMi40ODYsNzMuODg0IEwyLjIwOCw1NS4xMzQgWiIgaWQ9IkZpbGwtNiIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMi40ODYsNzQuMDAxIEMxMi40NzYsNzQuMDAxIDEyLjQ2NSw3My45OTkgMTIuNDU1LDczLjk5NiBDMTIuNDI0LDczLjk4OCAxMi4zOTksNzMuOTY3IDEyLjM4NCw3My45NCBMMi4xMDYsNTUuMTkgQzEuMDc1LDUzLjMxIDEuODU3LDUwLjg0NSAzLjg0OCw0OS42OTYgTDU5Ljg1OCwxNy4zNTIgQzYwLjUyNSwxNi45NjcgNjEuMjcxLDE2Ljc2NCA2Mi4wMTYsMTYuNzY0IEM2My40MzEsMTYuNzY0IDY0LjY2NiwxNy40NjYgNjUuMzI3LDE4LjY0NiBDNjUuMzM3LDE4LjY1NCA2NS4zNDUsMTguNjYzIDY1LjM1MSwxOC42NzQgTDY1LjU3OCwxOS4wODggQzY1LjU4NCwxOS4xIDY1LjU4OSwxOS4xMTIgNjUuNTkxLDE5LjEyNiBDNjUuOTg1LDE5LjgzOCA2Ni40NjksMjAuNDk3IDY3LjAzLDIxLjA4NSBMNjcuMzA1LDIxLjM1MSBDNjkuMTUxLDIzLjEzNyA3MS42NDksMjQuMTIgNzQuMzM2LDI0LjEyIEM3Ni4zMTMsMjQuMTIgNzguMjksMjMuNTgyIDgwLjA1MywyMi41NjMgQzgwLjA2NCwyMi41NTcgODAuMDc2LDIyLjU1MyA4MC4wODgsMjIuNTUgTDg3LjM3MiwxOC4zNDQgQzg4LjAzOCwxNy45NTkgODguNzg0LDE3Ljc1NiA4OS41MjksMTcuNzU2IEM5MC45NTYsMTcuNzU2IDkyLjIwMSwxOC40NzIgOTIuODU4LDE5LjY3IEw5Ni4xMDcsMjUuNTk5IEM5Ni4xMzgsMjUuNjU0IDk2LjExOCwyNS43MjQgOTYuMDYzLDI1Ljc1NiBMMTIuNTQ1LDczLjk4NSBDMTIuNTI2LDczLjk5NiAxMi41MDYsNzQuMDAxIDEyLjQ4Niw3NC4wMDEgTDEyLjQ4Niw3NC4wMDEgWiBNNjIuMDE2LDE2Ljk5NyBDNjEuMzEyLDE2Ljk5NyA2MC42MDYsMTcuMTkgNTkuOTc1LDE3LjU1NCBMMy45NjUsNDkuODk5IEMyLjA4Myw1MC45ODUgMS4zNDEsNTMuMzA4IDIuMzEsNTUuMDc4IEwxMi41MzEsNzMuNzIzIEw5NS44NDgsMjUuNjExIEw5Mi42NTMsMTkuNzgyIEM5Mi4wMzgsMTguNjYgOTAuODcsMTcuOTkgODkuNTI5LDE3Ljk5IEM4OC44MjUsMTcuOTkgODguMTE5LDE4LjE4MiA4Ny40ODksMTguNTQ3IEw4MC4xNzIsMjIuNzcyIEM4MC4xNjEsMjIuNzc4IDgwLjE0OSwyMi43ODIgODAuMTM3LDIyLjc4NSBDNzguMzQ2LDIzLjgxMSA3Ni4zNDEsMjQuMzU0IDc0LjMzNiwyNC4zNTQgQzcxLjU4OCwyNC4zNTQgNjkuMDMzLDIzLjM0NyA2Ny4xNDIsMjEuNTE5IEw2Ni44NjQsMjEuMjQ5IEM2Ni4yNzcsMjAuNjM0IDY1Ljc3NCwxOS45NDcgNjUuMzY3LDE5LjIwMyBDNjUuMzYsMTkuMTkyIDY1LjM1NiwxOS4xNzkgNjUuMzU0LDE5LjE2NiBMNjUuMTYzLDE4LjgxOSBDNjUuMTU0LDE4LjgxMSA2NS4xNDYsMTguODAxIDY1LjE0LDE4Ljc5IEM2NC41MjUsMTcuNjY3IDYzLjM1NywxNi45OTcgNjIuMDE2LDE2Ljk5NyBMNjIuMDE2LDE2Ljk5NyBaIiBpZD0iRmlsbC03IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTQyLjQzNCw0OC44MDggTDQyLjQzNCw0OC44MDggQzM5LjkyNCw0OC44MDcgMzcuNzM3LDQ3LjU1IDM2LjU4Miw0NS40NDMgQzM0Ljc3MSw0Mi4xMzkgMzYuMTQ0LDM3LjgwOSAzOS42NDEsMzUuNzg5IEw1MS45MzIsMjguNjkxIEM1My4xMDMsMjguMDE1IDU0LjQxMywyNy42NTggNTUuNzIxLDI3LjY1OCBDNTguMjMxLDI3LjY1OCA2MC40MTgsMjguOTE2IDYxLjU3MywzMS4wMjMgQzYzLjM4NCwzNC4zMjcgNjIuMDEyLDM4LjY1NyA1OC41MTQsNDAuNjc3IEw0Ni4yMjMsNDcuNzc1IEM0NS4wNTMsNDguNDUgNDMuNzQyLDQ4LjgwOCA0Mi40MzQsNDguODA4IEw0Mi40MzQsNDguODA4IFogTTU1LjcyMSwyOC4xMjUgQzU0LjQ5NSwyOC4xMjUgNTMuMjY1LDI4LjQ2MSA1Mi4xNjYsMjkuMDk2IEwzOS44NzUsMzYuMTk0IEMzNi41OTYsMzguMDg3IDM1LjMwMiw0Mi4xMzYgMzYuOTkyLDQ1LjIxOCBDMzguMDYzLDQ3LjE3MyA0MC4wOTgsNDguMzQgNDIuNDM0LDQ4LjM0IEM0My42NjEsNDguMzQgNDQuODksNDguMDA1IDQ1Ljk5LDQ3LjM3IEw1OC4yODEsNDAuMjcyIEM2MS41NiwzOC4zNzkgNjIuODUzLDM0LjMzIDYxLjE2NCwzMS4yNDggQzYwLjA5MiwyOS4yOTMgNTguMDU4LDI4LjEyNSA1NS43MjEsMjguMTI1IEw1NS43MjEsMjguMTI1IFoiIGlkPSJGaWxsLTgiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjU4OCwyLjQwNyBDMTQ5LjU4OCwyLjQwNyAxNTUuNzY4LDUuOTc1IDE1Ni4zMjUsNi4yOTcgTDE1Ni4zMjUsNy4xODQgQzE1Ni4zMjUsNy4zNiAxNTYuMzM4LDcuNTQ0IDE1Ni4zNjIsNy43MzMgQzE1Ni4zNzMsNy44MTQgMTU2LjM4Miw3Ljg5NCAxNTYuMzksNy45NzUgQzE1Ni41Myw5LjM5IDE1Ny4zNjMsMTAuOTczIDE1OC40OTUsMTEuOTc0IEwxNjUuODkxLDE4LjUxOSBDMTY2LjA2OCwxOC42NzUgMTY2LjI0OSwxOC44MTQgMTY2LjQzMiwxOC45MzQgQzE2OC4wMTEsMTkuOTc0IDE2OS4zODIsMTkuNCAxNjkuNDk0LDE3LjY1MiBDMTY5LjU0MywxNi44NjggMTY5LjU1MSwxNi4wNTcgMTY5LjUxNywxNS4yMjMgTDE2OS41MTQsMTUuMDYzIEwxNjkuNTE0LDEzLjkxMiBDMTcwLjc4LDE0LjY0MiAxOTUuNTAxLDI4LjkxNSAxOTUuNTAxLDI4LjkxNSBMMTk1LjUwMSw4Mi45MTUgQzE5NS41MDEsODQuMDA1IDE5NC43MzEsODQuNDQ1IDE5My43ODEsODMuODk3IEwxNTEuMzA4LDU5LjM3NCBDMTUwLjM1OCw1OC44MjYgMTQ5LjU4OCw1Ny40OTcgMTQ5LjU4OCw1Ni40MDggTDE0OS41ODgsMjIuMzc1IiBpZD0iRmlsbC05IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE5NC41NTMsODQuMjUgQzE5NC4yOTYsODQuMjUgMTk0LjAxMyw4NC4xNjUgMTkzLjcyMiw4My45OTcgTDE1MS4yNSw1OS40NzYgQzE1MC4yNjksNTguOTA5IDE0OS40NzEsNTcuNTMzIDE0OS40NzEsNTYuNDA4IEwxNDkuNDcxLDIyLjM3NSBMMTQ5LjcwNSwyMi4zNzUgTDE0OS43MDUsNTYuNDA4IEMxNDkuNzA1LDU3LjQ1OSAxNTAuNDUsNTguNzQ0IDE1MS4zNjYsNTkuMjc0IEwxOTMuODM5LDgzLjc5NSBDMTk0LjI2Myw4NC4wNCAxOTQuNjU1LDg0LjA4MyAxOTQuOTQyLDgzLjkxNyBDMTk1LjIyNyw4My43NTMgMTk1LjM4NCw4My4zOTcgMTk1LjM4NCw4Mi45MTUgTDE5NS4zODQsMjguOTgyIEMxOTQuMTAyLDI4LjI0MiAxNzIuMTA0LDE1LjU0MiAxNjkuNjMxLDE0LjExNCBMMTY5LjYzNCwxNS4yMiBDMTY5LjY2OCwxNi4wNTIgMTY5LjY2LDE2Ljg3NCAxNjkuNjEsMTcuNjU5IEMxNjkuNTU2LDE4LjUwMyAxNjkuMjE0LDE5LjEyMyAxNjguNjQ3LDE5LjQwNSBDMTY4LjAyOCwxOS43MTQgMTY3LjE5NywxOS41NzggMTY2LjM2NywxOS4wMzIgQzE2Ni4xODEsMTguOTA5IDE2NS45OTUsMTguNzY2IDE2NS44MTQsMTguNjA2IEwxNTguNDE3LDEyLjA2MiBDMTU3LjI1OSwxMS4wMzYgMTU2LjQxOCw5LjQzNyAxNTYuMjc0LDcuOTg2IEMxNTYuMjY2LDcuOTA3IDE1Ni4yNTcsNy44MjcgMTU2LjI0Nyw3Ljc0OCBDMTU2LjIyMSw3LjU1NSAxNTYuMjA5LDcuMzY1IDE1Ni4yMDksNy4xODQgTDE1Ni4yMDksNi4zNjQgQzE1NS4zNzUsNS44ODMgMTQ5LjUyOSwyLjUwOCAxNDkuNTI5LDIuNTA4IEwxNDkuNjQ2LDIuMzA2IEMxNDkuNjQ2LDIuMzA2IDE1NS44MjcsNS44NzQgMTU2LjM4NCw2LjE5NiBMMTU2LjQ0Miw2LjIzIEwxNTYuNDQyLDcuMTg0IEMxNTYuNDQyLDcuMzU1IDE1Ni40NTQsNy41MzUgMTU2LjQ3OCw3LjcxNyBDMTU2LjQ4OSw3LjggMTU2LjQ5OSw3Ljg4MiAxNTYuNTA3LDcuOTYzIEMxNTYuNjQ1LDkuMzU4IDE1Ny40NTUsMTAuODk4IDE1OC41NzIsMTEuODg2IEwxNjUuOTY5LDE4LjQzMSBDMTY2LjE0MiwxOC41ODQgMTY2LjMxOSwxOC43MiAxNjYuNDk2LDE4LjgzNyBDMTY3LjI1NCwxOS4zMzYgMTY4LDE5LjQ2NyAxNjguNTQzLDE5LjE5NiBDMTY5LjAzMywxOC45NTMgMTY5LjMyOSwxOC40MDEgMTY5LjM3NywxNy42NDUgQzE2OS40MjcsMTYuODY3IDE2OS40MzQsMTYuMDU0IDE2OS40MDEsMTUuMjI4IEwxNjkuMzk3LDE1LjA2NSBMMTY5LjM5NywxMy43MSBMMTY5LjU3MiwxMy44MSBDMTcwLjgzOSwxNC41NDEgMTk1LjU1OSwyOC44MTQgMTk1LjU1OSwyOC44MTQgTDE5NS42MTgsMjguODQ3IEwxOTUuNjE4LDgyLjkxNSBDMTk1LjYxOCw4My40ODQgMTk1LjQyLDgzLjkxMSAxOTUuMDU5LDg0LjExOSBDMTk0LjkwOCw4NC4yMDYgMTk0LjczNyw4NC4yNSAxOTQuNTUzLDg0LjI1IiBpZD0iRmlsbC0xMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDUuNjg1LDU2LjE2MSBMMTY5LjgsNzAuMDgzIEwxNDMuODIyLDg1LjA4MSBMMTQyLjM2LDg0Ljc3NCBDMTM1LjgyNiw4Mi42MDQgMTI4LjczMiw4MS4wNDYgMTIxLjM0MSw4MC4xNTggQzExNi45NzYsNzkuNjM0IDExMi42NzgsODEuMjU0IDExMS43NDMsODMuNzc4IEMxMTEuNTA2LDg0LjQxNCAxMTEuNTAzLDg1LjA3MSAxMTEuNzMyLDg1LjcwNiBDMTEzLjI3LDg5Ljk3MyAxMTUuOTY4LDk0LjA2OSAxMTkuNzI3LDk3Ljg0MSBMMTIwLjI1OSw5OC42ODYgQzEyMC4yNiw5OC42ODUgOTQuMjgyLDExMy42ODMgOTQuMjgyLDExMy42ODMgTDcwLjE2Nyw5OS43NjEgTDE0NS42ODUsNTYuMTYxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik05NC4yODIsMTEzLjgxOCBMOTQuMjIzLDExMy43ODUgTDY5LjkzMyw5OS43NjEgTDcwLjEwOCw5OS42NiBMMTQ1LjY4NSw1Ni4wMjYgTDE0NS43NDMsNTYuMDU5IEwxNzAuMDMzLDcwLjA4MyBMMTQzLjg0Miw4NS4yMDUgTDE0My43OTcsODUuMTk1IEMxNDMuNzcyLDg1LjE5IDE0Mi4zMzYsODQuODg4IDE0Mi4zMzYsODQuODg4IEMxMzUuNzg3LDgyLjcxNCAxMjguNzIzLDgxLjE2MyAxMjEuMzI3LDgwLjI3NCBDMTIwLjc4OCw4MC4yMDkgMTIwLjIzNiw4MC4xNzcgMTE5LjY4OSw4MC4xNzcgQzExNS45MzEsODAuMTc3IDExMi42MzUsODEuNzA4IDExMS44NTIsODMuODE5IEMxMTEuNjI0LDg0LjQzMiAxMTEuNjIxLDg1LjA1MyAxMTEuODQyLDg1LjY2NyBDMTEzLjM3Nyw4OS45MjUgMTE2LjA1OCw5My45OTMgMTE5LjgxLDk3Ljc1OCBMMTE5LjgyNiw5Ny43NzkgTDEyMC4zNTIsOTguNjE0IEMxMjAuMzU0LDk4LjYxNyAxMjAuMzU2LDk4LjYyIDEyMC4zNTgsOTguNjI0IEwxMjAuNDIyLDk4LjcyNiBMMTIwLjMxNyw5OC43ODcgQzEyMC4yNjQsOTguODE4IDk0LjU5OSwxMTMuNjM1IDk0LjM0LDExMy43ODUgTDk0LjI4MiwxMTMuODE4IEw5NC4yODIsMTEzLjgxOCBaIE03MC40MDEsOTkuNzYxIEw5NC4yODIsMTEzLjU0OSBMMTE5LjA4NCw5OS4yMjkgQzExOS42Myw5OC45MTQgMTE5LjkzLDk4Ljc0IDEyMC4xMDEsOTguNjU0IEwxMTkuNjM1LDk3LjkxNCBDMTE1Ljg2NCw5NC4xMjcgMTEzLjE2OCw5MC4wMzMgMTExLjYyMiw4NS43NDYgQzExMS4zODIsODUuMDc5IDExMS4zODYsODQuNDA0IDExMS42MzMsODMuNzM4IEMxMTIuNDQ4LDgxLjUzOSAxMTUuODM2LDc5Ljk0MyAxMTkuNjg5LDc5Ljk0MyBDMTIwLjI0Niw3OS45NDMgMTIwLjgwNiw3OS45NzYgMTIxLjM1NSw4MC4wNDIgQzEyOC43NjcsODAuOTMzIDEzNS44NDYsODIuNDg3IDE0Mi4zOTYsODQuNjYzIEMxNDMuMjMyLDg0LjgzOCAxNDMuNjExLDg0LjkxNyAxNDMuNzg2LDg0Ljk2NyBMMTY5LjU2Niw3MC4wODMgTDE0NS42ODUsNTYuMjk1IEw3MC40MDEsOTkuNzYxIEw3MC40MDEsOTkuNzYxIFoiIGlkPSJGaWxsLTEyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2Ny4yMywxOC45NzkgTDE2Ny4yMyw2OS44NSBMMTM5LjkwOSw4NS42MjMgTDEzMy40NDgsNzEuNDU2IEMxMzIuNTM4LDY5LjQ2IDEzMC4wMiw2OS43MTggMTI3LjgyNCw3Mi4wMyBDMTI2Ljc2OSw3My4xNCAxMjUuOTMxLDc0LjU4NSAxMjUuNDk0LDc2LjA0OCBMMTE5LjAzNCw5Ny42NzYgTDkxLjcxMiwxMTMuNDUgTDkxLjcxMiw2Mi41NzkgTDE2Ny4yMywxOC45NzkiIGlkPSJGaWxsLTEzIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTkxLjcxMiwxMTMuNTY3IEM5MS42OTIsMTEzLjU2NyA5MS42NzIsMTEzLjU2MSA5MS42NTMsMTEzLjU1MSBDOTEuNjE4LDExMy41MyA5MS41OTUsMTEzLjQ5MiA5MS41OTUsMTEzLjQ1IEw5MS41OTUsNjIuNTc5IEM5MS41OTUsNjIuNTM3IDkxLjYxOCw2Mi40OTkgOTEuNjUzLDYyLjQ3OCBMMTY3LjE3MiwxOC44NzggQzE2Ny4yMDgsMTguODU3IDE2Ny4yNTIsMTguODU3IDE2Ny4yODgsMTguODc4IEMxNjcuMzI0LDE4Ljg5OSAxNjcuMzQ3LDE4LjkzNyAxNjcuMzQ3LDE4Ljk3OSBMMTY3LjM0Nyw2OS44NSBDMTY3LjM0Nyw2OS44OTEgMTY3LjMyNCw2OS45MyAxNjcuMjg4LDY5Ljk1IEwxMzkuOTY3LDg1LjcyNSBDMTM5LjkzOSw4NS43NDEgMTM5LjkwNSw4NS43NDUgMTM5Ljg3Myw4NS43MzUgQzEzOS44NDIsODUuNzI1IDEzOS44MTYsODUuNzAyIDEzOS44MDIsODUuNjcyIEwxMzMuMzQyLDcxLjUwNCBDMTMyLjk2Nyw3MC42ODIgMTMyLjI4LDcwLjIyOSAxMzEuNDA4LDcwLjIyOSBDMTMwLjMxOSw3MC4yMjkgMTI5LjA0NCw3MC45MTUgMTI3LjkwOCw3Mi4xMSBDMTI2Ljg3NCw3My4yIDEyNi4wMzQsNzQuNjQ3IDEyNS42MDYsNzYuMDgyIEwxMTkuMTQ2LDk3LjcwOSBDMTE5LjEzNyw5Ny43MzggMTE5LjExOCw5Ny43NjIgMTE5LjA5Miw5Ny43NzcgTDkxLjc3LDExMy41NTEgQzkxLjc1MiwxMTMuNTYxIDkxLjczMiwxMTMuNTY3IDkxLjcxMiwxMTMuNTY3IEw5MS43MTIsMTEzLjU2NyBaIE05MS44MjksNjIuNjQ3IEw5MS44MjksMTEzLjI0OCBMMTE4LjkzNSw5Ny41OTggTDEyNS4zODIsNzYuMDE1IEMxMjUuODI3LDc0LjUyNSAxMjYuNjY0LDczLjA4MSAxMjcuNzM5LDcxLjk1IEMxMjguOTE5LDcwLjcwOCAxMzAuMjU2LDY5Ljk5NiAxMzEuNDA4LDY5Ljk5NiBDMTMyLjM3Nyw2OS45OTYgMTMzLjEzOSw3MC40OTcgMTMzLjU1NCw3MS40MDcgTDEzOS45NjEsODUuNDU4IEwxNjcuMTEzLDY5Ljc4MiBMMTY3LjExMywxOS4xODEgTDkxLjgyOSw2Mi42NDcgTDkxLjgyOSw2Mi42NDcgWiIgaWQ9IkZpbGwtMTQiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTY4LjU0MywxOS4yMTMgTDE2OC41NDMsNzAuMDgzIEwxNDEuMjIxLDg1Ljg1NyBMMTM0Ljc2MSw3MS42ODkgQzEzMy44NTEsNjkuNjk0IDEzMS4zMzMsNjkuOTUxIDEyOS4xMzcsNzIuMjYzIEMxMjguMDgyLDczLjM3NCAxMjcuMjQ0LDc0LjgxOSAxMjYuODA3LDc2LjI4MiBMMTIwLjM0Niw5Ny45MDkgTDkzLjAyNSwxMTMuNjgzIEw5My4wMjUsNjIuODEzIEwxNjguNTQzLDE5LjIxMyIgaWQ9IkZpbGwtMTUiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTMuMDI1LDExMy44IEM5My4wMDUsMTEzLjggOTIuOTg0LDExMy43OTUgOTIuOTY2LDExMy43ODUgQzkyLjkzMSwxMTMuNzY0IDkyLjkwOCwxMTMuNzI1IDkyLjkwOCwxMTMuNjg0IEw5Mi45MDgsNjIuODEzIEM5Mi45MDgsNjIuNzcxIDkyLjkzMSw2Mi43MzMgOTIuOTY2LDYyLjcxMiBMMTY4LjQ4NCwxOS4xMTIgQzE2OC41MiwxOS4wOSAxNjguNTY1LDE5LjA5IDE2OC42MDEsMTkuMTEyIEMxNjguNjM3LDE5LjEzMiAxNjguNjYsMTkuMTcxIDE2OC42NiwxOS4yMTIgTDE2OC42Niw3MC4wODMgQzE2OC42Niw3MC4xMjUgMTY4LjYzNyw3MC4xNjQgMTY4LjYwMSw3MC4xODQgTDE0MS4yOCw4NS45NTggQzE0MS4yNTEsODUuOTc1IDE0MS4yMTcsODUuOTc5IDE0MS4xODYsODUuOTY4IEMxNDEuMTU0LDg1Ljk1OCAxNDEuMTI5LDg1LjkzNiAxNDEuMTE1LDg1LjkwNiBMMTM0LjY1NSw3MS43MzggQzEzNC4yOCw3MC45MTUgMTMzLjU5Myw3MC40NjMgMTMyLjcyLDcwLjQ2MyBDMTMxLjYzMiw3MC40NjMgMTMwLjM1Nyw3MS4xNDggMTI5LjIyMSw3Mi4zNDQgQzEyOC4xODYsNzMuNDMzIDEyNy4zNDcsNzQuODgxIDEyNi45MTksNzYuMzE1IEwxMjAuNDU4LDk3Ljk0MyBDMTIwLjQ1LDk3Ljk3MiAxMjAuNDMxLDk3Ljk5NiAxMjAuNDA1LDk4LjAxIEw5My4wODMsMTEzLjc4NSBDOTMuMDY1LDExMy43OTUgOTMuMDQ1LDExMy44IDkzLjAyNSwxMTMuOCBMOTMuMDI1LDExMy44IFogTTkzLjE0Miw2Mi44ODEgTDkzLjE0MiwxMTMuNDgxIEwxMjAuMjQ4LDk3LjgzMiBMMTI2LjY5NSw3Ni4yNDggQzEyNy4xNCw3NC43NTggMTI3Ljk3Nyw3My4zMTUgMTI5LjA1Miw3Mi4xODMgQzEzMC4yMzEsNzAuOTQyIDEzMS41NjgsNzAuMjI5IDEzMi43Miw3MC4yMjkgQzEzMy42ODksNzAuMjI5IDEzNC40NTIsNzAuNzMxIDEzNC44NjcsNzEuNjQxIEwxNDEuMjc0LDg1LjY5MiBMMTY4LjQyNiw3MC4wMTYgTDE2OC40MjYsMTkuNDE1IEw5My4xNDIsNjIuODgxIEw5My4xNDIsNjIuODgxIFoiIGlkPSJGaWxsLTE2IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS44LDcwLjA4MyBMMTQyLjQ3OCw4NS44NTcgTDEzNi4wMTgsNzEuNjg5IEMxMzUuMTA4LDY5LjY5NCAxMzIuNTksNjkuOTUxIDEzMC4zOTMsNzIuMjYzIEMxMjkuMzM5LDczLjM3NCAxMjguNSw3NC44MTkgMTI4LjA2NCw3Ni4yODIgTDEyMS42MDMsOTcuOTA5IEw5NC4yODIsMTEzLjY4MyBMOTQuMjgyLDYyLjgxMyBMMTY5LjgsMTkuMjEzIEwxNjkuOCw3MC4wODMgWiIgaWQ9IkZpbGwtMTciIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTQuMjgyLDExMy45MTcgQzk0LjI0MSwxMTMuOTE3IDk0LjIwMSwxMTMuOTA3IDk0LjE2NSwxMTMuODg2IEM5NC4wOTMsMTEzLjg0NSA5NC4wNDgsMTEzLjc2NyA5NC4wNDgsMTEzLjY4NCBMOTQuMDQ4LDYyLjgxMyBDOTQuMDQ4LDYyLjczIDk0LjA5Myw2Mi42NTIgOTQuMTY1LDYyLjYxMSBMMTY5LjY4MywxOS4wMSBDMTY5Ljc1NSwxOC45NjkgMTY5Ljg0NCwxOC45NjkgMTY5LjkxNywxOS4wMSBDMTY5Ljk4OSwxOS4wNTIgMTcwLjAzMywxOS4xMjkgMTcwLjAzMywxOS4yMTIgTDE3MC4wMzMsNzAuMDgzIEMxNzAuMDMzLDcwLjE2NiAxNjkuOTg5LDcwLjI0NCAxNjkuOTE3LDcwLjI4NSBMMTQyLjU5NSw4Ni4wNiBDMTQyLjUzOCw4Ni4wOTIgMTQyLjQ2OSw4Ni4xIDE0Mi40MDcsODYuMDggQzE0Mi4zNDQsODYuMDYgMTQyLjI5Myw4Ni4wMTQgMTQyLjI2Niw4NS45NTQgTDEzNS44MDUsNzEuNzg2IEMxMzUuNDQ1LDcwLjk5NyAxMzQuODEzLDcwLjU4IDEzMy45NzcsNzAuNTggQzEzMi45MjEsNzAuNTggMTMxLjY3Niw3MS4yNTIgMTMwLjU2Miw3Mi40MjQgQzEyOS41NCw3My41MDEgMTI4LjcxMSw3NC45MzEgMTI4LjI4Nyw3Ni4zNDggTDEyMS44MjcsOTcuOTc2IEMxMjEuODEsOTguMDM0IDEyMS43NzEsOTguMDgyIDEyMS43Miw5OC4xMTIgTDk0LjM5OCwxMTMuODg2IEM5NC4zNjIsMTEzLjkwNyA5NC4zMjIsMTEzLjkxNyA5NC4yODIsMTEzLjkxNyBMOTQuMjgyLDExMy45MTcgWiBNOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDExMy4yNzkgTDEyMS40MDYsOTcuNzU0IEwxMjcuODQsNzYuMjE1IEMxMjguMjksNzQuNzA4IDEyOS4xMzcsNzMuMjQ3IDEzMC4yMjQsNzIuMTAzIEMxMzEuNDI1LDcwLjgzOCAxMzIuNzkzLDcwLjExMiAxMzMuOTc3LDcwLjExMiBDMTM0Ljk5NSw3MC4xMTIgMTM1Ljc5NSw3MC42MzggMTM2LjIzLDcxLjU5MiBMMTQyLjU4NCw4NS41MjYgTDE2OS41NjYsNjkuOTQ4IEwxNjkuNTY2LDE5LjYxNyBMOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDYyLjk0OCBaIiBpZD0iRmlsbC0xOCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMDkuODk0LDkyLjk0MyBMMTA5Ljg5NCw5Mi45NDMgQzEwOC4xMiw5Mi45NDMgMTA2LjY1Myw5Mi4yMTggMTA1LjY1LDkwLjgyMyBDMTA1LjU4Myw5MC43MzEgMTA1LjU5Myw5MC42MSAxMDUuNjczLDkwLjUyOSBDMTA1Ljc1Myw5MC40NDggMTA1Ljg4LDkwLjQ0IDEwNS45NzQsOTAuNTA2IEMxMDYuNzU0LDkxLjA1MyAxMDcuNjc5LDkxLjMzMyAxMDguNzI0LDkxLjMzMyBDMTEwLjA0Nyw5MS4zMzMgMTExLjQ3OCw5MC44OTQgMTEyLjk4LDkwLjAyNyBDMTE4LjI5MSw4Ni45NiAxMjIuNjExLDc5LjUwOSAxMjIuNjExLDczLjQxNiBDMTIyLjYxMSw3MS40ODkgMTIyLjE2OSw2OS44NTYgMTIxLjMzMyw2OC42OTIgQzEyMS4yNjYsNjguNiAxMjEuMjc2LDY4LjQ3MyAxMjEuMzU2LDY4LjM5MiBDMTIxLjQzNiw2OC4zMTEgMTIxLjU2Myw2OC4yOTkgMTIxLjY1Niw2OC4zNjUgQzEyMy4zMjcsNjkuNTM3IDEyNC4yNDcsNzEuNzQ2IDEyNC4yNDcsNzQuNTg0IEMxMjQuMjQ3LDgwLjgyNiAxMTkuODIxLDg4LjQ0NyAxMTQuMzgyLDkxLjU4NyBDMTEyLjgwOCw5Mi40OTUgMTExLjI5OCw5Mi45NDMgMTA5Ljg5NCw5Mi45NDMgTDEwOS44OTQsOTIuOTQzIFogTTEwNi45MjUsOTEuNDAxIEMxMDcuNzM4LDkyLjA1MiAxMDguNzQ1LDkyLjI3OCAxMDkuODkzLDkyLjI3OCBMMTA5Ljg5NCw5Mi4yNzggQzExMS4yMTUsOTIuMjc4IDExMi42NDcsOTEuOTUxIDExNC4xNDgsOTEuMDg0IEMxMTkuNDU5LDg4LjAxNyAxMjMuNzgsODAuNjIxIDEyMy43OCw3NC41MjggQzEyMy43OCw3Mi41NDkgMTIzLjMxNyw3MC45MjkgMTIyLjQ1NCw2OS43NjcgQzEyMi44NjUsNzAuODAyIDEyMy4wNzksNzIuMDQyIDEyMy4wNzksNzMuNDAyIEMxMjMuMDc5LDc5LjY0NSAxMTguNjUzLDg3LjI4NSAxMTMuMjE0LDkwLjQyNSBDMTExLjY0LDkxLjMzNCAxMTAuMTMsOTEuNzQyIDEwOC43MjQsOTEuNzQyIEMxMDguMDgzLDkxLjc0MiAxMDcuNDgxLDkxLjU5MyAxMDYuOTI1LDkxLjQwMSBMMTA2LjkyNSw5MS40MDEgWiIgaWQ9IkZpbGwtMTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjA5Nyw5MC4yMyBDMTE4LjQ4MSw4Ny4xMjIgMTIyLjg0NSw3OS41OTQgMTIyLjg0NSw3My40MTYgQzEyMi44NDUsNzEuMzY1IDEyMi4zNjIsNjkuNzI0IDEyMS41MjIsNjguNTU2IEMxMTkuNzM4LDY3LjMwNCAxMTcuMTQ4LDY3LjM2MiAxMTQuMjY1LDY5LjAyNiBDMTA4Ljg4MSw3Mi4xMzQgMTA0LjUxNyw3OS42NjIgMTA0LjUxNyw4NS44NCBDMTA0LjUxNyw4Ny44OTEgMTA1LDg5LjUzMiAxMDUuODQsOTAuNyBDMTA3LjYyNCw5MS45NTIgMTEwLjIxNCw5MS44OTQgMTEzLjA5Nyw5MC4yMyIgaWQ9IkZpbGwtMjAiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTA4LjcyNCw5MS42MTQgTDEwOC43MjQsOTEuNjE0IEMxMDcuNTgyLDkxLjYxNCAxMDYuNTY2LDkxLjQwMSAxMDUuNzA1LDkwLjc5NyBDMTA1LjY4NCw5MC43ODMgMTA1LjY2NSw5MC44MTEgMTA1LjY1LDkwLjc5IEMxMDQuNzU2LDg5LjU0NiAxMDQuMjgzLDg3Ljg0MiAxMDQuMjgzLDg1LjgxNyBDMTA0LjI4Myw3OS41NzUgMTA4LjcwOSw3MS45NTMgMTE0LjE0OCw2OC44MTIgQzExNS43MjIsNjcuOTA0IDExNy4yMzIsNjcuNDQ5IDExOC42MzgsNjcuNDQ5IEMxMTkuNzgsNjcuNDQ5IDEyMC43OTYsNjcuNzU4IDEyMS42NTYsNjguMzYyIEMxMjEuNjc4LDY4LjM3NyAxMjEuNjk3LDY4LjM5NyAxMjEuNzEyLDY4LjQxOCBDMTIyLjYwNiw2OS42NjIgMTIzLjA3OSw3MS4zOSAxMjMuMDc5LDczLjQxNSBDMTIzLjA3OSw3OS42NTggMTE4LjY1Myw4Ny4xOTggMTEzLjIxNCw5MC4zMzggQzExMS42NCw5MS4yNDcgMTEwLjEzLDkxLjYxNCAxMDguNzI0LDkxLjYxNCBMMTA4LjcyNCw5MS42MTQgWiBNMTA2LjAwNiw5MC41MDUgQzEwNi43OCw5MS4wMzcgMTA3LjY5NCw5MS4yODEgMTA4LjcyNCw5MS4yODEgQzExMC4wNDcsOTEuMjgxIDExMS40NzgsOTAuODY4IDExMi45OCw5MC4wMDEgQzExOC4yOTEsODYuOTM1IDEyMi42MTEsNzkuNDk2IDEyMi42MTEsNzMuNDAzIEMxMjIuNjExLDcxLjQ5NCAxMjIuMTc3LDY5Ljg4IDEyMS4zNTYsNjguNzE4IEMxMjAuNTgyLDY4LjE4NSAxMTkuNjY4LDY3LjkxOSAxMTguNjM4LDY3LjkxOSBDMTE3LjMxNSw2Ny45MTkgMTE1Ljg4Myw2OC4zNiAxMTQuMzgyLDY5LjIyNyBDMTA5LjA3MSw3Mi4yOTMgMTA0Ljc1MSw3OS43MzMgMTA0Ljc1MSw4NS44MjYgQzEwNC43NTEsODcuNzM1IDEwNS4xODUsODkuMzQzIDEwNi4wMDYsOTAuNTA1IEwxMDYuMDA2LDkwLjUwNSBaIiBpZD0iRmlsbC0yMSIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDkuMzE4LDcuMjYyIEwxMzkuMzM0LDE2LjE0IEwxNTUuMjI3LDI3LjE3MSBMMTYwLjgxNiwyMS4wNTkgTDE0OS4zMTgsNy4yNjIiIGlkPSJGaWxsLTIyIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS42NzYsMTMuODQgTDE1OS45MjgsMTkuNDY3IEMxNTYuMjg2LDIxLjU3IDE1MC40LDIxLjU4IDE0Ni43ODEsMTkuNDkxIEMxNDMuMTYxLDE3LjQwMiAxNDMuMTgsMTQuMDAzIDE0Ni44MjIsMTEuOSBMMTU2LjMxNyw2LjI5MiBMMTQ5LjU4OCwyLjQwNyBMNjcuNzUyLDQ5LjQ3OCBMMTEzLjY3NSw3NS45OTIgTDExNi43NTYsNzQuMjEzIEMxMTcuMzg3LDczLjg0OCAxMTcuNjI1LDczLjMxNSAxMTcuMzc0LDcyLjgyMyBDMTE1LjAxNyw2OC4xOTEgMTE0Ljc4MSw2My4yNzcgMTE2LjY5MSw1OC41NjEgQzEyMi4zMjksNDQuNjQxIDE0MS4yLDMzLjc0NiAxNjUuMzA5LDMwLjQ5MSBDMTczLjQ3OCwyOS4zODggMTgxLjk4OSwyOS41MjQgMTkwLjAxMywzMC44ODUgQzE5MC44NjUsMzEuMDMgMTkxLjc4OSwzMC44OTMgMTkyLjQyLDMwLjUyOCBMMTk1LjUwMSwyOC43NSBMMTY5LjY3NiwxMy44NCIgaWQ9IkZpbGwtMjMiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3Ni40NTkgQzExMy41OTQsNzYuNDU5IDExMy41MTQsNzYuNDM4IDExMy40NDIsNzYuMzk3IEw2Ny41MTgsNDkuODgyIEM2Ny4zNzQsNDkuNzk5IDY3LjI4NCw0OS42NDUgNjcuMjg1LDQ5LjQ3OCBDNjcuMjg1LDQ5LjMxMSA2Ny4zNzQsNDkuMTU3IDY3LjUxOSw0OS4wNzMgTDE0OS4zNTUsMi4wMDIgQzE0OS40OTksMS45MTkgMTQ5LjY3NywxLjkxOSAxNDkuODIxLDIuMDAyIEwxNTYuNTUsNS44ODcgQzE1Ni43NzQsNi4wMTcgMTU2Ljg1LDYuMzAyIDE1Ni43MjIsNi41MjYgQzE1Ni41OTIsNi43NDkgMTU2LjMwNyw2LjgyNiAxNTYuMDgzLDYuNjk2IEwxNDkuNTg3LDIuOTQ2IEw2OC42ODcsNDkuNDc5IEwxMTMuNjc1LDc1LjQ1MiBMMTE2LjUyMyw3My44MDggQzExNi43MTUsNzMuNjk3IDExNy4xNDMsNzMuMzk5IDExNi45NTgsNzMuMDM1IEMxMTQuNTQyLDY4LjI4NyAxMTQuMyw2My4yMjEgMTE2LjI1OCw1OC4zODUgQzExOS4wNjQsNTEuNDU4IDEyNS4xNDMsNDUuMTQzIDEzMy44NCw0MC4xMjIgQzE0Mi40OTcsMzUuMTI0IDE1My4zNTgsMzEuNjMzIDE2NS4yNDcsMzAuMDI4IEMxNzMuNDQ1LDI4LjkyMSAxODIuMDM3LDI5LjA1OCAxOTAuMDkxLDMwLjQyNSBDMTkwLjgzLDMwLjU1IDE5MS42NTIsMzAuNDMyIDE5Mi4xODYsMzAuMTI0IEwxOTQuNTY3LDI4Ljc1IEwxNjkuNDQyLDE0LjI0NCBDMTY5LjIxOSwxNC4xMTUgMTY5LjE0MiwxMy44MjkgMTY5LjI3MSwxMy42MDYgQzE2OS40LDEzLjM4MiAxNjkuNjg1LDEzLjMwNiAxNjkuOTA5LDEzLjQzNSBMMTk1LjczNCwyOC4zNDUgQzE5NS44NzksMjguNDI4IDE5NS45NjgsMjguNTgzIDE5NS45NjgsMjguNzUgQzE5NS45NjgsMjguOTE2IDE5NS44NzksMjkuMDcxIDE5NS43MzQsMjkuMTU0IEwxOTIuNjUzLDMwLjkzMyBDMTkxLjkzMiwzMS4zNSAxOTAuODksMzEuNTA4IDE4OS45MzUsMzEuMzQ2IEMxODEuOTcyLDI5Ljk5NSAxNzMuNDc4LDI5Ljg2IDE2NS4zNzIsMzAuOTU0IEMxNTMuNjAyLDMyLjU0MyAxNDIuODYsMzUuOTkzIDEzNC4zMDcsNDAuOTMxIEMxMjUuNzkzLDQ1Ljg0NyAxMTkuODUxLDUyLjAwNCAxMTcuMTI0LDU4LjczNiBDMTE1LjI3LDYzLjMxNCAxMTUuNTAxLDY4LjExMiAxMTcuNzksNzIuNjExIEMxMTguMTYsNzMuMzM2IDExNy44NDUsNzQuMTI0IDExNi45OSw3NC42MTcgTDExMy45MDksNzYuMzk3IEMxMTMuODM2LDc2LjQzOCAxMTMuNzU2LDc2LjQ1OSAxMTMuNjc1LDc2LjQ1OSIgaWQ9IkZpbGwtMjQiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUzLjMxNiwyMS4yNzkgQzE1MC45MDMsMjEuMjc5IDE0OC40OTUsMjAuNzUxIDE0Ni42NjQsMTkuNjkzIEMxNDQuODQ2LDE4LjY0NCAxNDMuODQ0LDE3LjIzMiAxNDMuODQ0LDE1LjcxOCBDMTQzLjg0NCwxNC4xOTEgMTQ0Ljg2LDEyLjc2MyAxNDYuNzA1LDExLjY5OCBMMTU2LjE5OCw2LjA5MSBDMTU2LjMwOSw2LjAyNSAxNTYuNDUyLDYuMDYyIDE1Ni41MTgsNi4xNzMgQzE1Ni41ODMsNi4yODQgMTU2LjU0Nyw2LjQyNyAxNTYuNDM2LDYuNDkzIEwxNDYuOTQsMTIuMTAyIEMxNDUuMjQ0LDEzLjA4MSAxNDQuMzEyLDE0LjM2NSAxNDQuMzEyLDE1LjcxOCBDMTQ0LjMxMiwxNy4wNTggMTQ1LjIzLDE4LjMyNiAxNDYuODk3LDE5LjI4OSBDMTUwLjQ0NiwyMS4zMzggMTU2LjI0LDIxLjMyNyAxNTkuODExLDE5LjI2NSBMMTY5LjU1OSwxMy42MzcgQzE2OS42NywxMy41NzMgMTY5LjgxMywxMy42MTEgMTY5Ljg3OCwxMy43MjMgQzE2OS45NDMsMTMuODM0IDE2OS45MDQsMTMuOTc3IDE2OS43OTMsMTQuMDQyIEwxNjAuMDQ1LDE5LjY3IEMxNTguMTg3LDIwLjc0MiAxNTUuNzQ5LDIxLjI3OSAxNTMuMzE2LDIxLjI3OSIgaWQ9IkZpbGwtMjUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3NS45OTIgTDY3Ljc2Miw0OS40ODQiIGlkPSJGaWxsLTI2IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMy42NzUsNzYuMzQyIEMxMTMuNjE1LDc2LjM0MiAxMTMuNTU1LDc2LjMyNyAxMTMuNSw3Ni4yOTUgTDY3LjU4Nyw0OS43ODcgQzY3LjQxOSw0OS42OSA2Ny4zNjIsNDkuNDc2IDY3LjQ1OSw0OS4zMDkgQzY3LjU1Niw0OS4xNDEgNjcuNzcsNDkuMDgzIDY3LjkzNyw0OS4xOCBMMTEzLjg1LDc1LjY4OCBDMTE0LjAxOCw3NS43ODUgMTE0LjA3NSw3NiAxMTMuOTc4LDc2LjE2NyBDMTEzLjkxNCw3Ni4yNzkgMTEzLjc5Niw3Ni4zNDIgMTEzLjY3NSw3Ni4zNDIiIGlkPSJGaWxsLTI3IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY3Ljc2Miw0OS40ODQgTDY3Ljc2MiwxMDMuNDg1IEM2Ny43NjIsMTA0LjU3NSA2OC41MzIsMTA1LjkwMyA2OS40ODIsMTA2LjQ1MiBMMTExLjk1NSwxMzAuOTczIEMxMTIuOTA1LDEzMS41MjIgMTEzLjY3NSwxMzEuMDgzIDExMy42NzUsMTI5Ljk5MyBMMTEzLjY3NSw3NS45OTIiIGlkPSJGaWxsLTI4IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMi43MjcsMTMxLjU2MSBDMTEyLjQzLDEzMS41NjEgMTEyLjEwNywxMzEuNDY2IDExMS43OCwxMzEuMjc2IEw2OS4zMDcsMTA2Ljc1NSBDNjguMjQ0LDEwNi4xNDIgNjcuNDEyLDEwNC43MDUgNjcuNDEyLDEwMy40ODUgTDY3LjQxMiw0OS40ODQgQzY3LjQxMiw0OS4yOSA2Ny41NjksNDkuMTM0IDY3Ljc2Miw0OS4xMzQgQzY3Ljk1Niw0OS4xMzQgNjguMTEzLDQ5LjI5IDY4LjExMyw0OS40ODQgTDY4LjExMywxMDMuNDg1IEM2OC4xMTMsMTA0LjQ0NSA2OC44MiwxMDUuNjY1IDY5LjY1NywxMDYuMTQ4IEwxMTIuMTMsMTMwLjY3IEMxMTIuNDc0LDEzMC44NjggMTEyLjc5MSwxMzAuOTEzIDExMywxMzAuNzkyIEMxMTMuMjA2LDEzMC42NzMgMTEzLjMyNSwxMzAuMzgxIDExMy4zMjUsMTI5Ljk5MyBMMTEzLjMyNSw3NS45OTIgQzExMy4zMjUsNzUuNzk4IDExMy40ODIsNzUuNjQxIDExMy42NzUsNzUuNjQxIEMxMTMuODY5LDc1LjY0MSAxMTQuMDI1LDc1Ljc5OCAxMTQuMDI1LDc1Ljk5MiBMMTE0LjAyNSwxMjkuOTkzIEMxMTQuMDI1LDEzMC42NDggMTEzLjc4NiwxMzEuMTQ3IDExMy4zNSwxMzEuMzk5IEMxMTMuMTYyLDEzMS41MDcgMTEyLjk1MiwxMzEuNTYxIDExMi43MjcsMTMxLjU2MSIgaWQ9IkZpbGwtMjkiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEyLjg2LDQwLjUxMiBDMTEyLjg2LDQwLjUxMiAxMTIuODYsNDAuNTEyIDExMi44NTksNDAuNTEyIEMxMTAuNTQxLDQwLjUxMiAxMDguMzYsMzkuOTkgMTA2LjcxNywzOS4wNDEgQzEwNS4wMTIsMzguMDU3IDEwNC4wNzQsMzYuNzI2IDEwNC4wNzQsMzUuMjkyIEMxMDQuMDc0LDMzLjg0NyAxMDUuMDI2LDMyLjUwMSAxMDYuNzU0LDMxLjUwNCBMMTE4Ljc5NSwyNC41NTEgQzEyMC40NjMsMjMuNTg5IDEyMi42NjksMjMuMDU4IDEyNS4wMDcsMjMuMDU4IEMxMjcuMzI1LDIzLjA1OCAxMjkuNTA2LDIzLjU4MSAxMzEuMTUsMjQuNTMgQzEzMi44NTQsMjUuNTE0IDEzMy43OTMsMjYuODQ1IDEzMy43OTMsMjguMjc4IEMxMzMuNzkzLDI5LjcyNCAxMzIuODQxLDMxLjA2OSAxMzEuMTEzLDMyLjA2NyBMMTE5LjA3MSwzOS4wMTkgQzExNy40MDMsMzkuOTgyIDExNS4xOTcsNDAuNTEyIDExMi44Niw0MC41MTIgTDExMi44Niw0MC41MTIgWiBNMTI1LjAwNywyMy43NTkgQzEyMi43OSwyMy43NTkgMTIwLjcwOSwyNC4yNTYgMTE5LjE0NiwyNS4xNTggTDEwNy4xMDQsMzIuMTEgQzEwNS42MDIsMzIuOTc4IDEwNC43NzQsMzQuMTA4IDEwNC43NzQsMzUuMjkyIEMxMDQuNzc0LDM2LjQ2NSAxMDUuNTg5LDM3LjU4MSAxMDcuMDY3LDM4LjQzNCBDMTA4LjYwNSwzOS4zMjMgMTEwLjY2MywzOS44MTIgMTEyLjg1OSwzOS44MTIgTDExMi44NiwzOS44MTIgQzExNS4wNzYsMzkuODEyIDExNy4xNTgsMzkuMzE1IDExOC43MjEsMzguNDEzIEwxMzAuNzYyLDMxLjQ2IEMxMzIuMjY0LDMwLjU5MyAxMzMuMDkyLDI5LjQ2MyAxMzMuMDkyLDI4LjI3OCBDMTMzLjA5MiwyNy4xMDYgMTMyLjI3OCwyNS45OSAxMzAuOCwyNS4xMzYgQzEyOS4yNjEsMjQuMjQ4IDEyNy4yMDQsMjMuNzU5IDEyNS4wMDcsMjMuNzU5IEwxMjUuMDA3LDIzLjc1OSBaIiBpZD0iRmlsbC0zMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNjUuNjMsMTYuMjE5IEwxNTkuODk2LDE5LjUzIEMxNTYuNzI5LDIxLjM1OCAxNTEuNjEsMjEuMzY3IDE0OC40NjMsMTkuNTUgQzE0NS4zMTYsMTcuNzMzIDE0NS4zMzIsMTQuNzc4IDE0OC40OTksMTIuOTQ5IEwxNTQuMjMzLDkuNjM5IEwxNjUuNjMsMTYuMjE5IiBpZD0iRmlsbC0zMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNTQuMjMzLDEwLjQ0OCBMMTY0LjIyOCwxNi4yMTkgTDE1OS41NDYsMTguOTIzIEMxNTguMTEyLDE5Ljc1IDE1Ni4xOTQsMjAuMjA2IDE1NC4xNDcsMjAuMjA2IEMxNTIuMTE4LDIwLjIwNiAxNTAuMjI0LDE5Ljc1NyAxNDguODE0LDE4Ljk0MyBDMTQ3LjUyNCwxOC4xOTkgMTQ2LjgxNCwxNy4yNDkgMTQ2LjgxNCwxNi4yNjkgQzE0Ni44MTQsMTUuMjc4IDE0Ny41MzcsMTQuMzE0IDE0OC44NSwxMy41NTYgTDE1NC4yMzMsMTAuNDQ4IE0xNTQuMjMzLDkuNjM5IEwxNDguNDk5LDEyLjk0OSBDMTQ1LjMzMiwxNC43NzggMTQ1LjMxNiwxNy43MzMgMTQ4LjQ2MywxOS41NSBDMTUwLjAzMSwyMC40NTUgMTUyLjA4NiwyMC45MDcgMTU0LjE0NywyMC45MDcgQzE1Ni4yMjQsMjAuOTA3IDE1OC4zMDYsMjAuNDQ3IDE1OS44OTYsMTkuNTMgTDE2NS42MywxNi4yMTkgTDE1NC4yMzMsOS42MzkiIGlkPSJGaWxsLTMyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NS40NDUsNzIuNjY3IEwxNDUuNDQ1LDcyLjY2NyBDMTQzLjY3Miw3Mi42NjcgMTQyLjIwNCw3MS44MTcgMTQxLjIwMiw3MC40MjIgQzE0MS4xMzUsNzAuMzMgMTQxLjE0NSw3MC4xNDcgMTQxLjIyNSw3MC4wNjYgQzE0MS4zMDUsNjkuOTg1IDE0MS40MzIsNjkuOTQ2IDE0MS41MjUsNzAuMDExIEMxNDIuMzA2LDcwLjU1OSAxNDMuMjMxLDcwLjgyMyAxNDQuMjc2LDcwLjgyMiBDMTQ1LjU5OCw3MC44MjIgMTQ3LjAzLDcwLjM3NiAxNDguNTMyLDY5LjUwOSBDMTUzLjg0Miw2Ni40NDMgMTU4LjE2Myw1OC45ODcgMTU4LjE2Myw1Mi44OTQgQzE1OC4xNjMsNTAuOTY3IDE1Ny43MjEsNDkuMzMyIDE1Ni44ODQsNDguMTY4IEMxNTYuODE4LDQ4LjA3NiAxNTYuODI4LDQ3Ljk0OCAxNTYuOTA4LDQ3Ljg2NyBDMTU2Ljk4OCw0Ny43ODYgMTU3LjExNCw0Ny43NzQgMTU3LjIwOCw0Ny44NCBDMTU4Ljg3OCw0OS4wMTIgMTU5Ljc5OCw1MS4yMiAxNTkuNzk4LDU0LjA1OSBDMTU5Ljc5OCw2MC4zMDEgMTU1LjM3Myw2OC4wNDYgMTQ5LjkzMyw3MS4xODYgQzE0OC4zNiw3Mi4wOTQgMTQ2Ljg1LDcyLjY2NyAxNDUuNDQ1LDcyLjY2NyBMMTQ1LjQ0NSw3Mi42NjcgWiBNMTQyLjQ3Niw3MSBDMTQzLjI5LDcxLjY1MSAxNDQuMjk2LDcyLjAwMiAxNDUuNDQ1LDcyLjAwMiBDMTQ2Ljc2Nyw3Mi4wMDIgMTQ4LjE5OCw3MS41NSAxNDkuNyw3MC42ODIgQzE1NS4wMSw2Ny42MTcgMTU5LjMzMSw2MC4xNTkgMTU5LjMzMSw1NC4wNjUgQzE1OS4zMzEsNTIuMDg1IDE1OC44NjgsNTAuNDM1IDE1OC4wMDYsNDkuMjcyIEMxNTguNDE3LDUwLjMwNyAxNTguNjMsNTEuNTMyIDE1OC42Myw1Mi44OTIgQzE1OC42Myw1OS4xMzQgMTU0LjIwNSw2Ni43NjcgMTQ4Ljc2NSw2OS45MDcgQzE0Ny4xOTIsNzAuODE2IDE0NS42ODEsNzEuMjgzIDE0NC4yNzYsNzEuMjgzIEMxNDMuNjM0LDcxLjI4MyAxNDMuMDMzLDcxLjE5MiAxNDIuNDc2LDcxIEwxNDIuNDc2LDcxIFoiIGlkPSJGaWxsLTMzIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0OC42NDgsNjkuNzA0IEMxNTQuMDMyLDY2LjU5NiAxNTguMzk2LDU5LjA2OCAxNTguMzk2LDUyLjg5MSBDMTU4LjM5Niw1MC44MzkgMTU3LjkxMyw0OS4xOTggMTU3LjA3NCw0OC4wMyBDMTU1LjI4OSw0Ni43NzggMTUyLjY5OSw0Ni44MzYgMTQ5LjgxNiw0OC41MDEgQzE0NC40MzMsNTEuNjA5IDE0MC4wNjgsNTkuMTM3IDE0MC4wNjgsNjUuMzE0IEMxNDAuMDY4LDY3LjM2NSAxNDAuNTUyLDY5LjAwNiAxNDEuMzkxLDcwLjE3NCBDMTQzLjE3Niw3MS40MjcgMTQ1Ljc2NSw3MS4zNjkgMTQ4LjY0OCw2OS43MDQiIGlkPSJGaWxsLTM0IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NC4yNzYsNzEuMjc2IEwxNDQuMjc2LDcxLjI3NiBDMTQzLjEzMyw3MS4yNzYgMTQyLjExOCw3MC45NjkgMTQxLjI1Nyw3MC4zNjUgQzE0MS4yMzYsNzAuMzUxIDE0MS4yMTcsNzAuMzMyIDE0MS4yMDIsNzAuMzExIEMxNDAuMzA3LDY5LjA2NyAxMzkuODM1LDY3LjMzOSAxMzkuODM1LDY1LjMxNCBDMTM5LjgzNSw1OS4wNzMgMTQ0LjI2LDUxLjQzOSAxNDkuNyw0OC4yOTggQzE1MS4yNzMsNDcuMzkgMTUyLjc4NCw0Ni45MjkgMTU0LjE4OSw0Ni45MjkgQzE1NS4zMzIsNDYuOTI5IDE1Ni4zNDcsNDcuMjM2IDE1Ny4yMDgsNDcuODM5IEMxNTcuMjI5LDQ3Ljg1NCAxNTcuMjQ4LDQ3Ljg3MyAxNTcuMjYzLDQ3Ljg5NCBDMTU4LjE1Nyw0OS4xMzggMTU4LjYzLDUwLjg2NSAxNTguNjMsNTIuODkxIEMxNTguNjMsNTkuMTMyIDE1NC4yMDUsNjYuNzY2IDE0OC43NjUsNjkuOTA3IEMxNDcuMTkyLDcwLjgxNSAxNDUuNjgxLDcxLjI3NiAxNDQuMjc2LDcxLjI3NiBMMTQ0LjI3Niw3MS4yNzYgWiBNMTQxLjU1OCw3MC4xMDQgQzE0Mi4zMzEsNzAuNjM3IDE0My4yNDUsNzEuMDA1IDE0NC4yNzYsNzEuMDA1IEMxNDUuNTk4LDcxLjAwNSAxNDcuMDMsNzAuNDY3IDE0OC41MzIsNjkuNiBDMTUzLjg0Miw2Ni41MzQgMTU4LjE2Myw1OS4wMzMgMTU4LjE2Myw1Mi45MzkgQzE1OC4xNjMsNTEuMDMxIDE1Ny43MjksNDkuMzg1IDE1Ni45MDcsNDguMjIzIEMxNTYuMTMzLDQ3LjY5MSAxNTUuMjE5LDQ3LjQwOSAxNTQuMTg5LDQ3LjQwOSBDMTUyLjg2Nyw0Ny40MDkgMTUxLjQzNSw0Ny44NDIgMTQ5LjkzMyw0OC43MDkgQzE0NC42MjMsNTEuNzc1IDE0MC4zMDIsNTkuMjczIDE0MC4zMDIsNjUuMzY2IEMxNDAuMzAyLDY3LjI3NiAxNDAuNzM2LDY4Ljk0MiAxNDEuNTU4LDcwLjEwNCBMMTQxLjU1OCw3MC4xMDQgWiIgaWQ9IkZpbGwtMzUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUwLjcyLDY1LjM2MSBMMTUwLjM1Nyw2NS4wNjYgQzE1MS4xNDcsNjQuMDkyIDE1MS44NjksNjMuMDQgMTUyLjUwNSw2MS45MzggQzE1My4zMTMsNjAuNTM5IDE1My45NzgsNTkuMDY3IDE1NC40ODIsNTcuNTYzIEwxNTQuOTI1LDU3LjcxMiBDMTU0LjQxMiw1OS4yNDUgMTUzLjczMyw2MC43NDUgMTUyLjkxLDYyLjE3MiBDMTUyLjI2Miw2My4yOTUgMTUxLjUyNSw2NC4zNjggMTUwLjcyLDY1LjM2MSIgaWQ9IkZpbGwtMzYiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE1LjkxNyw4NC41MTQgTDExNS41NTQsODQuMjIgQzExNi4zNDQsODMuMjQ1IDExNy4wNjYsODIuMTk0IDExNy43MDIsODEuMDkyIEMxMTguNTEsNzkuNjkyIDExOS4xNzUsNzguMjIgMTE5LjY3OCw3Ni43MTcgTDEyMC4xMjEsNzYuODY1IEMxMTkuNjA4LDc4LjM5OCAxMTguOTMsNzkuODk5IDExOC4xMDYsODEuMzI2IEMxMTcuNDU4LDgyLjQ0OCAxMTYuNzIyLDgzLjUyMSAxMTUuOTE3LDg0LjUxNCIgaWQ9IkZpbGwtMzciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE0LDEzMC40NzYgTDExNCwxMzAuMDA4IEwxMTQsNzYuMDUyIEwxMTQsNzUuNTg0IEwxMTQsNzYuMDUyIEwxMTQsMTMwLjAwOCBMMTE0LDEzMC40NzYiIGlkPSJGaWxsLTM4IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYyLjAwMDAwMCwgMC4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTkuODIyLDM3LjQ3NCBDMTkuODM5LDM3LjMzOSAxOS43NDcsMzcuMTk0IDE5LjU1NSwzNy4wODIgQzE5LjIyOCwzNi44OTQgMTguNzI5LDM2Ljg3MiAxOC40NDYsMzcuMDM3IEwxMi40MzQsNDAuNTA4IEMxMi4zMDMsNDAuNTg0IDEyLjI0LDQwLjY4NiAxMi4yNDMsNDAuNzkzIEMxMi4yNDUsNDAuOTI1IDEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQxLjM3MSBMMTIuMjQ1LDQxLjQxNCBMMTIuMjM4LDQxLjU0MiBDOC4xNDgsNDMuODg3IDUuNjQ3LDQ1LjMyMSA1LjY0Nyw0NS4zMjEgQzUuNjQ2LDQ1LjMyMSAzLjU3LDQ2LjM2NyAyLjg2LDUwLjUxMyBDMi44Niw1MC41MTMgMS45NDgsNTcuNDc0IDEuOTYyLDcwLjI1OCBDMS45NzcsODIuODI4IDIuNTY4LDg3LjMyOCAzLjEyOSw5MS42MDkgQzMuMzQ5LDkzLjI5MyA2LjEzLDkzLjczNCA2LjEzLDkzLjczNCBDNi40NjEsOTMuNzc0IDYuODI4LDkzLjcwNyA3LjIxLDkzLjQ4NiBMODIuNDgzLDQ5LjkzNSBDODQuMjkxLDQ4Ljg2NiA4NS4xNSw0Ni4yMTYgODUuNTM5LDQzLjY1MSBDODYuNzUyLDM1LjY2MSA4Ny4yMTQsMTAuNjczIDg1LjI2NCwzLjc3MyBDODUuMDY4LDMuMDggODQuNzU0LDIuNjkgODQuMzk2LDIuNDkxIEw4Mi4zMSwxLjcwMSBDODEuNTgzLDEuNzI5IDgwLjg5NCwyLjE2OCA4MC43NzYsMi4yMzYgQzgwLjYzNiwyLjMxNyA0MS44MDcsMjQuNTg1IDIwLjAzMiwzNy4wNzIgTDE5LjgyMiwzNy40NzQiIGlkPSJGaWxsLTEiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNODIuMzExLDEuNzAxIEw4NC4zOTYsMi40OTEgQzg0Ljc1NCwyLjY5IDg1LjA2OCwzLjA4IDg1LjI2NCwzLjc3MyBDODcuMjEzLDEwLjY3MyA4Ni43NTEsMzUuNjYgODUuNTM5LDQzLjY1MSBDODUuMTQ5LDQ2LjIxNiA4NC4yOSw0OC44NjYgODIuNDgzLDQ5LjkzNSBMNy4yMSw5My40ODYgQzYuODk3LDkzLjY2NyA2LjU5NSw5My43NDQgNi4zMTQsOTMuNzQ0IEw2LjEzMSw5My43MzMgQzYuMTMxLDkzLjczNCAzLjM0OSw5My4yOTMgMy4xMjgsOTEuNjA5IEMyLjU2OCw4Ny4zMjcgMS45NzcsODIuODI4IDEuOTYzLDcwLjI1OCBDMS45NDgsNTcuNDc0IDIuODYsNTAuNTEzIDIuODYsNTAuNTEzIEMzLjU3LDQ2LjM2NyA1LjY0Nyw0NS4zMjEgNS42NDcsNDUuMzIxIEM1LjY0Nyw0NS4zMjEgOC4xNDgsNDMuODg3IDEyLjIzOCw0MS41NDIgTDEyLjI0NSw0MS40MTQgTDEyLjI0NSw0MS4zNzEgQzEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQwLjkyNSAxMi4yNDMsNDAuNzkzIEMxMi4yNCw0MC42ODYgMTIuMzAyLDQwLjU4MyAxMi40MzQsNDAuNTA4IEwxOC40NDYsMzcuMDM2IEMxOC41NzQsMzYuOTYyIDE4Ljc0NiwzNi45MjYgMTguOTI3LDM2LjkyNiBDMTkuMTQ1LDM2LjkyNiAxOS4zNzYsMzYuOTc5IDE5LjU1NCwzNy4wODIgQzE5Ljc0NywzNy4xOTQgMTkuODM5LDM3LjM0IDE5LjgyMiwzNy40NzQgTDIwLjAzMywzNy4wNzIgQzQxLjgwNiwyNC41ODUgODAuNjM2LDIuMzE4IDgwLjc3NywyLjIzNiBDODAuODk0LDIuMTY4IDgxLjU4MywxLjcyOSA4Mi4zMTEsMS43MDEgTTgyLjMxMSwwLjcwNCBMODIuMjcyLDAuNzA1IEM4MS42NTQsMC43MjggODAuOTg5LDAuOTQ5IDgwLjI5OCwxLjM2MSBMODAuMjc3LDEuMzczIEM4MC4xMjksMS40NTggNTkuNzY4LDEzLjEzNSAxOS43NTgsMzYuMDc5IEMxOS41LDM1Ljk4MSAxOS4yMTQsMzUuOTI5IDE4LjkyNywzNS45MjkgQzE4LjU2MiwzNS45MjkgMTguMjIzLDM2LjAxMyAxNy45NDcsMzYuMTczIEwxMS45MzUsMzkuNjQ0IEMxMS40OTMsMzkuODk5IDExLjIzNiw0MC4zMzQgMTEuMjQ2LDQwLjgxIEwxMS4yNDcsNDAuOTYgTDUuMTY3LDQ0LjQ0NyBDNC43OTQsNDQuNjQ2IDIuNjI1LDQ1Ljk3OCAxLjg3Nyw1MC4zNDUgTDEuODcxLDUwLjM4NCBDMS44NjIsNTAuNDU0IDAuOTUxLDU3LjU1NyAwLjk2NSw3MC4yNTkgQzAuOTc5LDgyLjg3OSAxLjU2OCw4Ny4zNzUgMi4xMzcsOTEuNzI0IEwyLjEzOSw5MS43MzkgQzIuNDQ3LDk0LjA5NCA1LjYxNCw5NC42NjIgNS45NzUsOTQuNzE5IEw2LjAwOSw5NC43MjMgQzYuMTEsOTQuNzM2IDYuMjEzLDk0Ljc0MiA2LjMxNCw5NC43NDIgQzYuNzksOTQuNzQyIDcuMjYsOTQuNjEgNy43MSw5NC4zNSBMODIuOTgzLDUwLjc5OCBDODQuNzk0LDQ5LjcyNyA4NS45ODIsNDcuMzc1IDg2LjUyNSw0My44MDEgQzg3LjcxMSwzNS45ODcgODguMjU5LDEwLjcwNSA4Ni4yMjQsMy41MDIgQzg1Ljk3MSwyLjYwOSA4NS41MiwxLjk3NSA4NC44ODEsMS42MiBMODQuNzQ5LDEuNTU4IEw4Mi42NjQsMC43NjkgQzgyLjU1MSwwLjcyNSA4Mi40MzEsMC43MDQgODIuMzExLDAuNzA0IiBpZD0iRmlsbC0yIiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY2LjI2NywxMS41NjUgTDY3Ljc2MiwxMS45OTkgTDExLjQyMyw0NC4zMjUiIGlkPSJGaWxsLTMiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMjAyLDkwLjU0NSBDMTIuMDI5LDkwLjU0NSAxMS44NjIsOTAuNDU1IDExLjc2OSw5MC4yOTUgQzExLjYzMiw5MC4wNTcgMTEuNzEzLDg5Ljc1MiAxMS45NTIsODkuNjE0IEwzMC4zODksNzguOTY5IEMzMC42MjgsNzguODMxIDMwLjkzMyw3OC45MTMgMzEuMDcxLDc5LjE1MiBDMzEuMjA4LDc5LjM5IDMxLjEyNyw3OS42OTYgMzAuODg4LDc5LjgzMyBMMTIuNDUxLDkwLjQ3OCBMMTIuMjAyLDkwLjU0NSIgaWQ9IkZpbGwtNCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMy43NjQsNDIuNjU0IEwxMy42NTYsNDIuNTkyIEwxMy43MDIsNDIuNDIxIEwxOC44MzcsMzkuNDU3IEwxOS4wMDcsMzkuNTAyIEwxOC45NjIsMzkuNjczIEwxMy44MjcsNDIuNjM3IEwxMy43NjQsNDIuNjU0IiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTguNTIsOTAuMzc1IEw4LjUyLDQ2LjQyMSBMOC41ODMsNDYuMzg1IEw3NS44NCw3LjU1NCBMNzUuODQsNTEuNTA4IEw3NS43NzgsNTEuNTQ0IEw4LjUyLDkwLjM3NSBMOC41Miw5MC4zNzUgWiBNOC43Nyw0Ni41NjQgTDguNzcsODkuOTQ0IEw3NS41OTEsNTEuMzY1IEw3NS41OTEsNy45ODUgTDguNzcsNDYuNTY0IEw4Ljc3LDQ2LjU2NCBaIiBpZD0iRmlsbC02IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTI0Ljk4Niw4My4xODIgQzI0Ljc1Niw4My4zMzEgMjQuMzc0LDgzLjU2NiAyNC4xMzcsODMuNzA1IEwxMi42MzIsOTAuNDA2IEMxMi4zOTUsOTAuNTQ1IDEyLjQyNiw5MC42NTggMTIuNyw5MC42NTggTDEzLjI2NSw5MC42NTggQzEzLjU0LDkwLjY1OCAxMy45NTgsOTAuNTQ1IDE0LjE5NSw5MC40MDYgTDI1LjcsODMuNzA1IEMyNS45MzcsODMuNTY2IDI2LjEyOCw4My40NTIgMjYuMTI1LDgzLjQ0OSBDMjYuMTIyLDgzLjQ0NyAyNi4xMTksODMuMjIgMjYuMTE5LDgyLjk0NiBDMjYuMTE5LDgyLjY3MiAyNS45MzEsODIuNTY5IDI1LjcwMSw4Mi43MTkgTDI0Ljk4Niw4My4xODIiIGlkPSJGaWxsLTciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuMjY2LDkwLjc4MiBMMTIuNyw5MC43ODIgQzEyLjUsOTAuNzgyIDEyLjM4NCw5MC43MjYgMTIuMzU0LDkwLjYxNiBDMTIuMzI0LDkwLjUwNiAxMi4zOTcsOTAuMzk5IDEyLjU2OSw5MC4yOTkgTDI0LjA3NCw4My41OTcgQzI0LjMxLDgzLjQ1OSAyNC42ODksODMuMjI2IDI0LjkxOCw4My4wNzggTDI1LjYzMyw4Mi42MTQgQzI1LjcyMyw4Mi41NTUgMjUuODEzLDgyLjUyNSAyNS44OTksODIuNTI1IEMyNi4wNzEsODIuNTI1IDI2LjI0NCw4Mi42NTUgMjYuMjQ0LDgyLjk0NiBDMjYuMjQ0LDgzLjE2IDI2LjI0NSw4My4zMDkgMjYuMjQ3LDgzLjM4MyBMMjYuMjUzLDgzLjM4NyBMMjYuMjQ5LDgzLjQ1NiBDMjYuMjQ2LDgzLjUzMSAyNi4yNDYsODMuNTMxIDI1Ljc2Myw4My44MTIgTDE0LjI1OCw5MC41MTQgQzE0LDkwLjY2NSAxMy41NjQsOTAuNzgyIDEzLjI2Niw5MC43ODIgTDEzLjI2Niw5MC43ODIgWiBNMTIuNjY2LDkwLjUzMiBMMTIuNyw5MC41MzMgTDEzLjI2Niw5MC41MzMgQzEzLjUxOCw5MC41MzMgMTMuOTE1LDkwLjQyNSAxNC4xMzIsOTAuMjk5IEwyNS42MzcsODMuNTk3IEMyNS44MDUsODMuNDk5IDI1LjkzMSw4My40MjQgMjUuOTk4LDgzLjM4MyBDMjUuOTk0LDgzLjI5OSAyNS45OTQsODMuMTY1IDI1Ljk5NCw4Mi45NDYgTDI1Ljg5OSw4Mi43NzUgTDI1Ljc2OCw4Mi44MjQgTDI1LjA1NCw4My4yODcgQzI0LjgyMiw4My40MzcgMjQuNDM4LDgzLjY3MyAyNC4yLDgzLjgxMiBMMTIuNjk1LDkwLjUxNCBMMTIuNjY2LDkwLjUzMiBMMTIuNjY2LDkwLjUzMiBaIiBpZD0iRmlsbC04IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEzLjI2Niw4OS44NzEgTDEyLjcsODkuODcxIEMxMi41LDg5Ljg3MSAxMi4zODQsODkuODE1IDEyLjM1NCw4OS43MDUgQzEyLjMyNCw4OS41OTUgMTIuMzk3LDg5LjQ4OCAxMi41NjksODkuMzg4IEwyNC4wNzQsODIuNjg2IEMyNC4zMzIsODIuNTM1IDI0Ljc2OCw4Mi40MTggMjUuMDY3LDgyLjQxOCBMMjUuNjMyLDgyLjQxOCBDMjUuODMyLDgyLjQxOCAyNS45NDgsODIuNDc0IDI1Ljk3OCw4Mi41ODQgQzI2LjAwOCw4Mi42OTQgMjUuOTM1LDgyLjgwMSAyNS43NjMsODIuOTAxIEwxNC4yNTgsODkuNjAzIEMxNCw4OS43NTQgMTMuNTY0LDg5Ljg3MSAxMy4yNjYsODkuODcxIEwxMy4yNjYsODkuODcxIFogTTEyLjY2Niw4OS42MjEgTDEyLjcsODkuNjIyIEwxMy4yNjYsODkuNjIyIEMxMy41MTgsODkuNjIyIDEzLjkxNSw4OS41MTUgMTQuMTMyLDg5LjM4OCBMMjUuNjM3LDgyLjY4NiBMMjUuNjY3LDgyLjY2OCBMMjUuNjMyLDgyLjY2NyBMMjUuMDY3LDgyLjY2NyBDMjQuODE1LDgyLjY2NyAyNC40MTgsODIuNzc1IDI0LjIsODIuOTAxIEwxMi42OTUsODkuNjAzIEwxMi42NjYsODkuNjIxIEwxMi42NjYsODkuNjIxIFoiIGlkPSJGaWxsLTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMzcsOTAuODAxIEwxMi4zNyw4OS41NTQgTDEyLjM3LDkwLjgwMSIgaWQ9IkZpbGwtMTAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNi4xMyw5My45MDEgQzUuMzc5LDkzLjgwOCA0LjgxNiw5My4xNjQgNC42OTEsOTIuNTI1IEMzLjg2LDg4LjI4NyAzLjU0LDgzLjc0MyAzLjUyNiw3MS4xNzMgQzMuNTExLDU4LjM4OSA0LjQyMyw1MS40MjggNC40MjMsNTEuNDI4IEM1LjEzNCw0Ny4yODIgNy4yMSw0Ni4yMzYgNy4yMSw0Ni4yMzYgQzcuMjEsNDYuMjM2IDgxLjY2NywzLjI1IDgyLjA2OSwzLjAxNyBDODIuMjkyLDIuODg4IDg0LjU1NiwxLjQzMyA4NS4yNjQsMy45NCBDODcuMjE0LDEwLjg0IDg2Ljc1MiwzNS44MjcgODUuNTM5LDQzLjgxOCBDODUuMTUsNDYuMzgzIDg0LjI5MSw0OS4wMzMgODIuNDgzLDUwLjEwMSBMNy4yMSw5My42NTMgQzYuODI4LDkzLjg3NCA2LjQ2MSw5My45NDEgNi4xMyw5My45MDEgQzYuMTMsOTMuOTAxIDMuMzQ5LDkzLjQ2IDMuMTI5LDkxLjc3NiBDMi41NjgsODcuNDk1IDEuOTc3LDgyLjk5NSAxLjk2Miw3MC40MjUgQzEuOTQ4LDU3LjY0MSAyLjg2LDUwLjY4IDIuODYsNTAuNjggQzMuNTcsNDYuNTM0IDUuNjQ3LDQ1LjQ4OSA1LjY0Nyw0NS40ODkgQzUuNjQ2LDQ1LjQ4OSA4LjA2NSw0NC4wOTIgMTIuMjQ1LDQxLjY3OSBMMTMuMTE2LDQxLjU2IEwxOS43MTUsMzcuNzMgTDE5Ljc2MSwzNy4yNjkgTDYuMTMsOTMuOTAxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjMxNyw5NC4xNjEgTDYuMTAyLDk0LjE0OCBMNi4xMDEsOTQuMTQ4IEw1Ljg1Nyw5NC4xMDEgQzUuMTM4LDkzLjk0NSAzLjA4NSw5My4zNjUgMi44ODEsOTEuODA5IEMyLjMxMyw4Ny40NjkgMS43MjcsODIuOTk2IDEuNzEzLDcwLjQyNSBDMS42OTksNTcuNzcxIDIuNjA0LDUwLjcxOCAyLjYxMyw1MC42NDggQzMuMzM4LDQ2LjQxNyA1LjQ0NSw0NS4zMSA1LjUzNSw0NS4yNjYgTDEyLjE2Myw0MS40MzkgTDEzLjAzMyw0MS4zMiBMMTkuNDc5LDM3LjU3OCBMMTkuNTEzLDM3LjI0NCBDMTkuNTI2LDM3LjEwNyAxOS42NDcsMzcuMDA4IDE5Ljc4NiwzNy4wMjEgQzE5LjkyMiwzNy4wMzQgMjAuMDIzLDM3LjE1NiAyMC4wMDksMzcuMjkzIEwxOS45NSwzNy44ODIgTDEzLjE5OCw0MS44MDEgTDEyLjMyOCw0MS45MTkgTDUuNzcyLDQ1LjcwNCBDNS43NDEsNDUuNzIgMy43ODIsNDYuNzcyIDMuMTA2LDUwLjcyMiBDMy4wOTksNTAuNzgyIDIuMTk4LDU3LjgwOCAyLjIxMiw3MC40MjQgQzIuMjI2LDgyLjk2MyAyLjgwOSw4Ny40MiAzLjM3Myw5MS43MjkgQzMuNDY0LDkyLjQyIDQuMDYyLDkyLjg4MyA0LjY4Miw5My4xODEgQzQuNTY2LDkyLjk4NCA0LjQ4Niw5Mi43NzYgNC40NDYsOTIuNTcyIEMzLjY2NSw4OC41ODggMy4yOTEsODQuMzcgMy4yNzYsNzEuMTczIEMzLjI2Miw1OC41MiA0LjE2Nyw1MS40NjYgNC4xNzYsNTEuMzk2IEM0LjkwMSw0Ny4xNjUgNy4wMDgsNDYuMDU5IDcuMDk4LDQ2LjAxNCBDNy4wOTQsNDYuMDE1IDgxLjU0MiwzLjAzNCA4MS45NDQsMi44MDIgTDgxLjk3MiwyLjc4NSBDODIuODc2LDIuMjQ3IDgzLjY5MiwyLjA5NyA4NC4zMzIsMi4zNTIgQzg0Ljg4NywyLjU3MyA4NS4yODEsMy4wODUgODUuNTA0LDMuODcyIEM4Ny41MTgsMTEgODYuOTY0LDM2LjA5MSA4NS43ODUsNDMuODU1IEM4NS4yNzgsNDcuMTk2IDg0LjIxLDQ5LjM3IDgyLjYxLDUwLjMxNyBMNy4zMzUsOTMuODY5IEM2Ljk5OSw5NC4wNjMgNi42NTgsOTQuMTYxIDYuMzE3LDk0LjE2MSBMNi4zMTcsOTQuMTYxIFogTTYuMTcsOTMuNjU0IEM2LjQ2Myw5My42OSA2Ljc3NCw5My42MTcgNy4wODUsOTMuNDM3IEw4Mi4zNTgsNDkuODg2IEM4NC4xODEsNDguODA4IDg0Ljk2LDQ1Ljk3MSA4NS4yOTIsNDMuNzggQzg2LjQ2NiwzNi4wNDkgODcuMDIzLDExLjA4NSA4NS4wMjQsNC4wMDggQzg0Ljg0NiwzLjM3NyA4NC41NTEsMi45NzYgODQuMTQ4LDIuODE2IEM4My42NjQsMi42MjMgODIuOTgyLDIuNzY0IDgyLjIyNywzLjIxMyBMODIuMTkzLDMuMjM0IEM4MS43OTEsMy40NjYgNy4zMzUsNDYuNDUyIDcuMzM1LDQ2LjQ1MiBDNy4zMDQsNDYuNDY5IDUuMzQ2LDQ3LjUyMSA0LjY2OSw1MS40NzEgQzQuNjYyLDUxLjUzIDMuNzYxLDU4LjU1NiAzLjc3NSw3MS4xNzMgQzMuNzksODQuMzI4IDQuMTYxLDg4LjUyNCA0LjkzNiw5Mi40NzYgQzUuMDI2LDkyLjkzNyA1LjQxMiw5My40NTkgNS45NzMsOTMuNjE1IEM2LjA4Nyw5My42NCA2LjE1OCw5My42NTIgNi4xNjksOTMuNjU0IEw2LjE3LDkzLjY1NCBMNi4xNyw5My42NTQgWiIgaWQ9IkZpbGwtMTIiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4zMTcsNjguOTgyIEM3LjgwNiw2OC43MDEgOC4yMDIsNjguOTI2IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNi44MjksNzEuMjk0IDYuNDMzLDcxLjA2OSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIiBpZD0iRmlsbC0xMyIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjkyLDcxLjEzMyBDNi42MzEsNzEuMTMzIDYuNDMzLDcwLjkwNSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIEM3LjQ2LDY4LjkgNy41OTUsNjguODYxIDcuNzE0LDY4Ljg2MSBDOC4wMDMsNjguODYxIDguMjAyLDY5LjA5IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNy4xNzQsNzEuMDk0IDcuMDM5LDcxLjEzMyA2LjkyLDcxLjEzMyBNNy43MTQsNjguNjc0IEM3LjU1Nyw2OC42NzQgNy4zOTIsNjguNzIzIDcuMjI0LDY4LjgyMSBDNi42NzYsNjkuMTM4IDYuMjQ2LDY5Ljg3OSA2LjI0Niw3MC41MDggQzYuMjQ2LDcwLjk5NCA2LjUxNyw3MS4zMiA2LjkyLDcxLjMyIEM3LjA3OCw3MS4zMiA3LjI0Myw3MS4yNzEgNy40MTEsNzEuMTc0IEM3Ljk1OSw3MC44NTcgOC4zODksNzAuMTE3IDguMzg5LDY5LjQ4NyBDOC4zODksNjkuMDAxIDguMTE3LDY4LjY3NCA3LjcxNCw2OC42NzQiIGlkPSJGaWxsLTE0IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYuOTIsNzAuOTQ3IEM2LjY0OSw3MC45NDcgNi42MjEsNzAuNjQgNi42MjEsNzAuNTA4IEM2LjYyMSw3MC4wMTcgNi45ODIsNjkuMzkyIDcuNDExLDY5LjE0NSBDNy41MjEsNjkuMDgyIDcuNjI1LDY5LjA0OSA3LjcxNCw2OS4wNDkgQzcuOTg2LDY5LjA0OSA4LjAxNSw2OS4zNTUgOC4wMTUsNjkuNDg3IEM4LjAxNSw2OS45NzggNy42NTIsNzAuNjAzIDcuMjI0LDcwLjg1MSBDNy4xMTUsNzAuOTE0IDcuMDEsNzAuOTQ3IDYuOTIsNzAuOTQ3IE03LjcxNCw2OC44NjEgQzcuNTk1LDY4Ljg2MSA3LjQ2LDY4LjkgNy4zMTcsNjguOTgyIEM2LjgyOSw2OS4yNjUgNi40MzMsNjkuOTQ4IDYuNDMzLDcwLjUwOCBDNi40MzMsNzAuOTA1IDYuNjMxLDcxLjEzMyA2LjkyLDcxLjEzMyBDNy4wMzksNzEuMTMzIDcuMTc0LDcxLjA5NCA3LjMxNyw3MS4wMTIgQzcuODA2LDcwLjczIDguMjAyLDcwLjA0NyA4LjIwMiw2OS40ODcgQzguMjAyLDY5LjA5IDguMDAzLDY4Ljg2MSA3LjcxNCw2OC44NjEiIGlkPSJGaWxsLTE1IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTcuNDQ0LDg1LjM1IEM3LjcwOCw4NS4xOTggNy45MjEsODUuMzE5IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuOTI1IDcuNzA4LDg2LjI5MiA3LjQ0NCw4Ni40NDQgQzcuMTgxLDg2LjU5NyA2Ljk2Nyw4Ni40NzUgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IiBpZD0iRmlsbC0xNiIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik03LjIzLDg2LjUxIEM3LjA3NCw4Ni41MSA2Ljk2Nyw4Ni4zODcgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IEM3LjUyMSw4NS4zMDUgNy41OTQsODUuMjg0IDcuNjU4LDg1LjI4NCBDNy44MTQsODUuMjg0IDcuOTIxLDg1LjQwOCA3LjkyMSw4NS42MjIgQzcuOTIxLDg1LjkyNSA3LjcwOCw4Ni4yOTIgNy40NDQsODYuNDQ0IEM3LjM2Nyw4Ni40ODkgNy4yOTQsODYuNTEgNy4yMyw4Ni41MSBNNy42NTgsODUuMDk4IEM3LjU1OCw4NS4wOTggNy40NTUsODUuMTI3IDcuMzUxLDg1LjE4OCBDNy4wMzEsODUuMzczIDYuNzgxLDg1LjgwNiA2Ljc4MSw4Ni4xNzMgQzYuNzgxLDg2LjQ4MiA2Ljk2Niw4Ni42OTcgNy4yMyw4Ni42OTcgQzcuMzMsODYuNjk3IDcuNDMzLDg2LjY2NiA3LjUzOCw4Ni42MDcgQzcuODU4LDg2LjQyMiA4LjEwOCw4NS45ODkgOC4xMDgsODUuNjIyIEM4LjEwOCw4NS4zMTMgNy45MjMsODUuMDk4IDcuNjU4LDg1LjA5OCIgaWQ9IkZpbGwtMTciIGZpbGw9IiM4MDk3QTIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4yMyw4Ni4zMjIgTDcuMTU0LDg2LjE3MyBDNy4xNTQsODUuOTM4IDcuMzMzLDg1LjYyOSA3LjUzOCw4NS41MTIgTDcuNjU4LDg1LjQ3MSBMNy43MzQsODUuNjIyIEM3LjczNCw4NS44NTYgNy41NTUsODYuMTY0IDcuMzUxLDg2LjI4MiBMNy4yMyw4Ni4zMjIgTTcuNjU4LDg1LjI4NCBDNy41OTQsODUuMjg0IDcuNTIxLDg1LjMwNSA3LjQ0NCw4NS4zNSBDNy4xODEsODUuNTAyIDYuOTY3LDg1Ljg3MSA2Ljk2Nyw4Ni4xNzMgQzYuOTY3LDg2LjM4NyA3LjA3NCw4Ni41MSA3LjIzLDg2LjUxIEM3LjI5NCw4Ni41MSA3LjM2Nyw4Ni40ODkgNy40NDQsODYuNDQ0IEM3LjcwOCw4Ni4yOTIgNy45MjEsODUuOTI1IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuNDA4IDcuODE0LDg1LjI4NCA3LjY1OCw4NS4yODQiIGlkPSJGaWxsLTE4IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTc3LjI3OCw3Ljc2OSBMNzcuMjc4LDUxLjQzNiBMMTAuMjA4LDkwLjE2IEwxMC4yMDgsNDYuNDkzIEw3Ny4yNzgsNy43NjkiIGlkPSJGaWxsLTE5IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEwLjA4Myw5MC4zNzUgTDEwLjA4Myw0Ni40MjEgTDEwLjE0Niw0Ni4zODUgTDc3LjQwMyw3LjU1NCBMNzcuNDAzLDUxLjUwOCBMNzcuMzQxLDUxLjU0NCBMMTAuMDgzLDkwLjM3NSBMMTAuMDgzLDkwLjM3NSBaIE0xMC4zMzMsNDYuNTY0IEwxMC4zMzMsODkuOTQ0IEw3Ny4xNTQsNTEuMzY1IEw3Ny4xNTQsNy45ODUgTDEwLjMzMyw0Ni41NjQgTDEwLjMzMyw0Ni41NjQgWiIgaWQ9IkZpbGwtMjAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMjUuNzM3LDg4LjY0NyBMMTE4LjA5OCw5MS45ODEgTDExOC4wOTgsODQgTDEwNi42MzksODguNzEzIEwxMDYuNjM5LDk2Ljk4MiBMOTksMTAwLjMxNSBMMTEyLjM2OSwxMDMuOTYxIEwxMjUuNzM3LDg4LjY0NyIgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTIiIGZpbGw9IiM0NTVBNjQiIHNrZXRjaDp0eXBlPSJNU1NoYXBlR3JvdXAiPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+');
};

module.exports = RotateInstructions;

},{"./util.js":22}],17:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var SensorSample = _dereq_('./sensor-sample.js');
var MathUtil = _dereq_('../math-util.js');
var Util = _dereq_('../util.js');

/**
 * An implementation of a simple complementary filter, which fuses gyroscope and
 * accelerometer data from the 'devicemotion' event.
 *
 * Accelerometer data is very noisy, but stable over the long term.
 * Gyroscope data is smooth, but tends to drift over the long term.
 *
 * This fusion is relatively simple:
 * 1. Get orientation estimates from accelerometer by applying a low-pass filter
 *    on that data.
 * 2. Get orientation estimates from gyroscope by integrating over time.
 * 3. Combine the two estimates, weighing (1) in the long term, but (2) for the
 *    short term.
 */
function ComplementaryFilter(kFilter) {
  this.kFilter = kFilter;

  // Raw sensor measurements.
  this.currentAccelMeasurement = new SensorSample();
  this.currentGyroMeasurement = new SensorSample();
  this.previousGyroMeasurement = new SensorSample();

  // Set default look direction to be in the correct direction.
  if (Util.isIOS()) {
    this.filterQ = new MathUtil.Quaternion(-1, 0, 0, 1);
  } else {
    this.filterQ = new MathUtil.Quaternion(1, 0, 0, 1);
  }
  this.previousFilterQ = new MathUtil.Quaternion();
  this.previousFilterQ.copy(this.filterQ);

  // Orientation based on the accelerometer.
  this.accelQ = new MathUtil.Quaternion();
  // Whether or not the orientation has been initialized.
  this.isOrientationInitialized = false;
  // Running estimate of gravity based on the current orientation.
  this.estimatedGravity = new MathUtil.Vector3();
  // Measured gravity based on accelerometer.
  this.measuredGravity = new MathUtil.Vector3();

  // Debug only quaternion of gyro-based orientation.
  this.gyroIntegralQ = new MathUtil.Quaternion();
}

ComplementaryFilter.prototype.addAccelMeasurement = function(vector, timestampS) {
  this.currentAccelMeasurement.set(vector, timestampS);
};

ComplementaryFilter.prototype.addGyroMeasurement = function(vector, timestampS) {
  this.currentGyroMeasurement.set(vector, timestampS);

  var deltaT = timestampS - this.previousGyroMeasurement.timestampS;
  if (Util.isTimestampDeltaValid(deltaT)) {
    this.run_();
  }

  this.previousGyroMeasurement.copy(this.currentGyroMeasurement);
};

ComplementaryFilter.prototype.run_ = function() {

  if (!this.isOrientationInitialized) {
    this.accelQ = this.accelToQuaternion_(this.currentAccelMeasurement.sample);
    this.previousFilterQ.copy(this.accelQ);
    this.isOrientationInitialized = true;
    return;
  }

  var deltaT = this.currentGyroMeasurement.timestampS -
      this.previousGyroMeasurement.timestampS;

  // Convert gyro rotation vector to a quaternion delta.
  var gyroDeltaQ = this.gyroToQuaternionDelta_(this.currentGyroMeasurement.sample, deltaT);
  this.gyroIntegralQ.multiply(gyroDeltaQ);

  // filter_1 = K * (filter_0 + gyro * dT) + (1 - K) * accel.
  this.filterQ.copy(this.previousFilterQ);
  this.filterQ.multiply(gyroDeltaQ);

  // Calculate the delta between the current estimated gravity and the real
  // gravity vector from accelerometer.
  var invFilterQ = new MathUtil.Quaternion();
  invFilterQ.copy(this.filterQ);
  invFilterQ.inverse();

  this.estimatedGravity.set(0, 0, -1);
  this.estimatedGravity.applyQuaternion(invFilterQ);
  this.estimatedGravity.normalize();

  this.measuredGravity.copy(this.currentAccelMeasurement.sample);
  this.measuredGravity.normalize();

  // Compare estimated gravity with measured gravity, get the delta quaternion
  // between the two.
  var deltaQ = new MathUtil.Quaternion();
  deltaQ.setFromUnitVectors(this.estimatedGravity, this.measuredGravity);
  deltaQ.inverse();

  if (Util.isDebug()) {
    console.log('Delta: %d deg, G_est: (%s, %s, %s), G_meas: (%s, %s, %s)',
                MathUtil.radToDeg * Util.getQuaternionAngle(deltaQ),
                (this.estimatedGravity.x).toFixed(1),
                (this.estimatedGravity.y).toFixed(1),
                (this.estimatedGravity.z).toFixed(1),
                (this.measuredGravity.x).toFixed(1),
                (this.measuredGravity.y).toFixed(1),
                (this.measuredGravity.z).toFixed(1));
  }

  // Calculate the SLERP target: current orientation plus the measured-estimated
  // quaternion delta.
  var targetQ = new MathUtil.Quaternion();
  targetQ.copy(this.filterQ);
  targetQ.multiply(deltaQ);

  // SLERP factor: 0 is pure gyro, 1 is pure accel.
  this.filterQ.slerp(targetQ, 1 - this.kFilter);

  this.previousFilterQ.copy(this.filterQ);
};

ComplementaryFilter.prototype.getOrientation = function() {
  return this.filterQ;
};

ComplementaryFilter.prototype.accelToQuaternion_ = function(accel) {
  var normAccel = new MathUtil.Vector3();
  normAccel.copy(accel);
  normAccel.normalize();
  var quat = new MathUtil.Quaternion();
  quat.setFromUnitVectors(new MathUtil.Vector3(0, 0, -1), normAccel);
  quat.inverse();
  return quat;
};

ComplementaryFilter.prototype.gyroToQuaternionDelta_ = function(gyro, dt) {
  // Extract axis and angle from the gyroscope data.
  var quat = new MathUtil.Quaternion();
  var axis = new MathUtil.Vector3();
  axis.copy(gyro);
  axis.normalize();
  quat.setFromAxisAngle(axis, gyro.length() * dt);
  return quat;
};


module.exports = ComplementaryFilter;

},{"../math-util.js":14,"../util.js":22,"./sensor-sample.js":20}],18:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var ComplementaryFilter = _dereq_('./complementary-filter.js');
var PosePredictor = _dereq_('./pose-predictor.js');
var TouchPanner = _dereq_('../touch-panner.js');
var MathUtil = _dereq_('../math-util.js');
var Util = _dereq_('../util.js');

/**
 * The pose sensor, implemented using DeviceMotion APIs.
 */
function FusionPoseSensor() {
  this.deviceId = 'webvr-polyfill:fused';
  this.deviceName = 'VR Position Device (webvr-polyfill:fused)';

  this.accelerometer = new MathUtil.Vector3();
  this.gyroscope = new MathUtil.Vector3();

  this.start();

  this.filter = new ComplementaryFilter(WebVRConfig.K_FILTER);
  this.posePredictor = new PosePredictor(WebVRConfig.PREDICTION_TIME_S);
  this.touchPanner = new TouchPanner();

  this.filterToWorldQ = new MathUtil.Quaternion();

  // Set the filter to world transform, depending on OS.
  if (Util.isIOS()) {
    this.filterToWorldQ.setFromAxisAngle(new MathUtil.Vector3(1, 0, 0), Math.PI / 2);
  } else {
    this.filterToWorldQ.setFromAxisAngle(new MathUtil.Vector3(1, 0, 0), -Math.PI / 2);
  }

  this.inverseWorldToScreenQ = new MathUtil.Quaternion();
  this.worldToScreenQ = new MathUtil.Quaternion();
  this.originalPoseAdjustQ = new MathUtil.Quaternion();
  this.originalPoseAdjustQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1),
                                           -window.orientation * Math.PI / 180);

  this.setScreenTransform_();
  // Adjust this filter for being in landscape mode.
  if (Util.isLandscapeMode()) {
    this.filterToWorldQ.multiply(this.inverseWorldToScreenQ);
  }

  // Keep track of a reset transform for resetSensor.
  this.resetQ = new MathUtil.Quaternion();

  this.isFirefoxAndroid = Util.isFirefoxAndroid();
  this.isIOS = Util.isIOS();

  this.orientationOut_ = new Float32Array(4);
}

FusionPoseSensor.prototype.getPosition = function() {
  // This PoseSensor doesn't support position
  return null;
};

FusionPoseSensor.prototype.getOrientation = function() {
  // Convert from filter space to the the same system used by the
  // deviceorientation event.
  var orientation = this.filter.getOrientation();

  // Predict orientation.
  this.predictedQ = this.posePredictor.getPrediction(orientation, this.gyroscope, this.previousTimestampS);

  // Convert to THREE coordinate system: -Z forward, Y up, X right.
  var out = new MathUtil.Quaternion();
  out.copy(this.filterToWorldQ);
  out.multiply(this.resetQ);
  if (!WebVRConfig.TOUCH_PANNER_DISABLED) {
    out.multiply(this.touchPanner.getOrientation());
  }
  out.multiply(this.predictedQ);
  out.multiply(this.worldToScreenQ);

  // Handle the yaw-only case.
  if (WebVRConfig.YAW_ONLY) {
    // Make a quaternion that only turns around the Y-axis.
    out.x = 0;
    out.z = 0;
    out.normalize();
  }

  this.orientationOut_[0] = out.x;
  this.orientationOut_[1] = out.y;
  this.orientationOut_[2] = out.z;
  this.orientationOut_[3] = out.w;
  return this.orientationOut_;
};

FusionPoseSensor.prototype.resetPose = function() {
  // Reduce to inverted yaw-only.
  this.resetQ.copy(this.filter.getOrientation());
  this.resetQ.x = 0;
  this.resetQ.y = 0;
  this.resetQ.z *= -1;
  this.resetQ.normalize();

  // Take into account extra transformations in landscape mode.
  if (Util.isLandscapeMode()) {
    this.resetQ.multiply(this.inverseWorldToScreenQ);
  }

  // Take into account original pose.
  this.resetQ.multiply(this.originalPoseAdjustQ);

  if (!WebVRConfig.TOUCH_PANNER_DISABLED) {
    this.touchPanner.resetSensor();
  }
};

FusionPoseSensor.prototype.onDeviceMotion_ = function(deviceMotion) {
  this.updateDeviceMotion_(deviceMotion);
};

FusionPoseSensor.prototype.updateDeviceMotion_ = function(deviceMotion) {
  var accGravity = deviceMotion.accelerationIncludingGravity;
  var rotRate = deviceMotion.rotationRate;
  var timestampS = deviceMotion.timeStamp / 1000;

  // Firefox Android timeStamp returns one thousandth of a millisecond.
  if (this.isFirefoxAndroid) {
    timestampS /= 1000;
  }

  var deltaS = timestampS - this.previousTimestampS;
  if (deltaS <= Util.MIN_TIMESTEP || deltaS > Util.MAX_TIMESTEP) {
    console.warn('Invalid timestamps detected. Time step between successive ' +
                 'gyroscope sensor samples is very small or not monotonic');
    this.previousTimestampS = timestampS;
    return;
  }
  this.accelerometer.set(-accGravity.x, -accGravity.y, -accGravity.z);
  this.gyroscope.set(rotRate.alpha, rotRate.beta, rotRate.gamma);

  // With iOS and Firefox Android, rotationRate is reported in degrees,
  // so we first convert to radians.
  if (this.isIOS || this.isFirefoxAndroid) {
    this.gyroscope.multiplyScalar(Math.PI / 180);
  }

  this.filter.addAccelMeasurement(this.accelerometer, timestampS);
  this.filter.addGyroMeasurement(this.gyroscope, timestampS);

  this.previousTimestampS = timestampS;
};

FusionPoseSensor.prototype.onOrientationChange_ = function(screenOrientation) {
  this.setScreenTransform_();
};

/**
 * This is only needed if we are in an cross origin iframe on iOS to work around
 * this issue: https://bugs.webkit.org/show_bug.cgi?id=152299.
 */
FusionPoseSensor.prototype.onMessage_ = function(event) {
  var message = event.data;

  // If there's no message type, ignore it.
  if (!message || !message.type) {
    return;
  }

  // Ignore all messages that aren't devicemotion.
  var type = message.type.toLowerCase();
  if (type !== 'devicemotion') {
    return;
  }

  // Update device motion.
  this.updateDeviceMotion_(message.deviceMotionEvent);
};

FusionPoseSensor.prototype.setScreenTransform_ = function() {
  this.worldToScreenQ.set(0, 0, 0, 1);
  switch (window.orientation) {
    case 0:
      break;
    case 90:
      this.worldToScreenQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1), -Math.PI / 2);
      break;
    case -90:
      this.worldToScreenQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1), Math.PI / 2);
      break;
    case 180:
      // TODO.
      break;
  }
  this.inverseWorldToScreenQ.copy(this.worldToScreenQ);
  this.inverseWorldToScreenQ.inverse();
};

FusionPoseSensor.prototype.start = function() {
  this.onDeviceMotionCallback_ = this.onDeviceMotion_.bind(this);
  this.onOrientationChangeCallback_ = this.onOrientationChange_.bind(this);
  this.onMessageCallback_ = this.onMessage_.bind(this);

  // Only listen for postMessages if we're in an iOS and embedded inside a cross
  // domain IFrame. In this case, the polyfill can still work if the containing
  // page sends synthetic devicemotion events. For an example of this, see
  // iframe-message-sender.js in VR View: https://goo.gl/XDtvFZ
  if (Util.isIOS() && Util.isInsideCrossDomainIFrame()) {
    window.addEventListener('message', this.onMessageCallback_);
  }
  window.addEventListener('orientationchange', this.onOrientationChangeCallback_);
  window.addEventListener('devicemotion', this.onDeviceMotionCallback_);
};

FusionPoseSensor.prototype.stop = function() {
  window.removeEventListener('devicemotion', this.onDeviceMotionCallback_);
  window.removeEventListener('orientationchange', this.onOrientationChangeCallback_);
  window.removeEventListener('message', this.onMessageCallback_);
};

module.exports = FusionPoseSensor;

},{"../math-util.js":14,"../touch-panner.js":21,"../util.js":22,"./complementary-filter.js":17,"./pose-predictor.js":19}],19:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MathUtil = _dereq_('../math-util');
var Util = _dereq_('../util');

/**
 * Given an orientation and the gyroscope data, predicts the future orientation
 * of the head. This makes rendering appear faster.
 *
 * Also see: http://msl.cs.uiuc.edu/~lavalle/papers/LavYerKatAnt14.pdf
 *
 * @param {Number} predictionTimeS time from head movement to the appearance of
 * the corresponding image.
 */
function PosePredictor(predictionTimeS) {
  this.predictionTimeS = predictionTimeS;

  // The quaternion corresponding to the previous state.
  this.previousQ = new MathUtil.Quaternion();
  // Previous time a prediction occurred.
  this.previousTimestampS = null;

  // The delta quaternion that adjusts the current pose.
  this.deltaQ = new MathUtil.Quaternion();
  // The output quaternion.
  this.outQ = new MathUtil.Quaternion();
}

PosePredictor.prototype.getPrediction = function(currentQ, gyro, timestampS) {
  if (!this.previousTimestampS) {
    this.previousQ.copy(currentQ);
    this.previousTimestampS = timestampS;
    return currentQ;
  }

  // Calculate axis and angle based on gyroscope rotation rate data.
  var axis = new MathUtil.Vector3();
  axis.copy(gyro);
  axis.normalize();

  var angularSpeed = gyro.length();

  // If we're rotating slowly, don't do prediction.
  if (angularSpeed < MathUtil.degToRad * 20) {
    if (Util.isDebug()) {
      console.log('Moving slowly, at %s deg/s: no prediction',
                  (MathUtil.radToDeg * angularSpeed).toFixed(1));
    }
    this.outQ.copy(currentQ);
    this.previousQ.copy(currentQ);
    return this.outQ;
  }

  // Get the predicted angle based on the time delta and latency.
  var deltaT = timestampS - this.previousTimestampS;
  var predictAngle = angularSpeed * this.predictionTimeS;

  this.deltaQ.setFromAxisAngle(axis, predictAngle);
  this.outQ.copy(this.previousQ);
  this.outQ.multiply(this.deltaQ);

  this.previousQ.copy(currentQ);
  this.previousTimestampS = timestampS;

  return this.outQ;
};


module.exports = PosePredictor;

},{"../math-util":14,"../util":22}],20:[function(_dereq_,module,exports){
function SensorSample(sample, timestampS) {
  this.set(sample, timestampS);
};

SensorSample.prototype.set = function(sample, timestampS) {
  this.sample = sample;
  this.timestampS = timestampS;
};

SensorSample.prototype.copy = function(sensorSample) {
  this.set(sensorSample.sample, sensorSample.timestampS);
};

module.exports = SensorSample;

},{}],21:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

var ROTATE_SPEED = 0.5;
/**
 * Provides a quaternion responsible for pre-panning the scene before further
 * transformations due to device sensors.
 */
function TouchPanner() {
  window.addEventListener('touchstart', this.onTouchStart_.bind(this));
  window.addEventListener('touchmove', this.onTouchMove_.bind(this));
  window.addEventListener('touchend', this.onTouchEnd_.bind(this));

  this.isTouching = false;
  this.rotateStart = new MathUtil.Vector2();
  this.rotateEnd = new MathUtil.Vector2();
  this.rotateDelta = new MathUtil.Vector2();

  this.theta = 0;
  this.orientation = new MathUtil.Quaternion();
}

TouchPanner.prototype.getOrientation = function() {
  this.orientation.setFromEulerXYZ(0, 0, this.theta);
  return this.orientation;
};

TouchPanner.prototype.resetSensor = function() {
  this.theta = 0;
};

TouchPanner.prototype.onTouchStart_ = function(e) {
  // Only respond if there is exactly one touch.
  if (e.touches.length != 1) {
    return;
  }
  this.rotateStart.set(e.touches[0].pageX, e.touches[0].pageY);
  this.isTouching = true;
};

TouchPanner.prototype.onTouchMove_ = function(e) {
  if (!this.isTouching) {
    return;
  }
  this.rotateEnd.set(e.touches[0].pageX, e.touches[0].pageY);
  this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
  this.rotateStart.copy(this.rotateEnd);

  // On iOS, direction is inverted.
  if (Util.isIOS()) {
    this.rotateDelta.x *= -1;
  }

  var element = document.body;
  this.theta += 2 * Math.PI * this.rotateDelta.x / element.clientWidth * ROTATE_SPEED;
};

TouchPanner.prototype.onTouchEnd_ = function(e) {
  this.isTouching = false;
};

module.exports = TouchPanner;

},{"./math-util.js":14,"./util.js":22}],22:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var objectAssign = _dereq_('object-assign');

var Util = window.Util || {};

Util.MIN_TIMESTEP = 0.001;
Util.MAX_TIMESTEP = 1;

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.clamp = function(value, min, max) {
  return Math.min(Math.max(min, value), max);
};

Util.lerp = function(a, b, t) {
  return a + ((b - a) * t);
};

Util.isIOS = (function() {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.platform);
  return function() {
    return isIOS;
  };
})();

Util.isSafari = (function() {
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return function() {
    return isSafari;
  };
})();

Util.isFirefoxAndroid = (function() {
  var isFirefoxAndroid = navigator.userAgent.indexOf('Firefox') !== -1 &&
      navigator.userAgent.indexOf('Android') !== -1;
  return function() {
    return isFirefoxAndroid;
  };
})();

Util.isLandscapeMode = function() {
  return (window.orientation == 90 || window.orientation == -90);
};

// Helper method to validate the time steps of sensor timestamps.
Util.isTimestampDeltaValid = function(timestampDeltaS) {
  if (isNaN(timestampDeltaS)) {
    return false;
  }
  if (timestampDeltaS <= Util.MIN_TIMESTEP) {
    return false;
  }
  if (timestampDeltaS > Util.MAX_TIMESTEP) {
    return false;
  }
  return true;
};

Util.getScreenWidth = function() {
  return Math.max(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.getScreenHeight = function() {
  return Math.min(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.requestFullscreen = function(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.exitFullscreen = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.getFullscreenElement = function() {
  return document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
};

Util.linkProgram = function(gl, vertexSource, fragmentSource, attribLocationMap) {
  // No error checking for brevity.
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  for (var attribName in attribLocationMap)
    gl.bindAttribLocation(program, attribLocationMap[attribName], attribName);

  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
};

Util.getProgramUniforms = function(gl, program) {
  var uniforms = {};
  var uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  var uniformName = '';
  for (var i = 0; i < uniformCount; i++) {
    var uniformInfo = gl.getActiveUniform(program, i);
    uniformName = uniformInfo.name.replace('[0]', '');
    uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
  }
  return uniforms;
};

Util.orthoMatrix = function (out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right),
      bt = 1 / (bottom - top),
      nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.extend = objectAssign;

Util.safariCssSizeWorkaround = function(canvas) {
  // TODO(smus): Remove this workaround when Safari for iOS is fixed.
  // iOS only workaround (for https://bugs.webkit.org/show_bug.cgi?id=152556).
  //
  // "To the last I grapple with thee;
  //  from hell's heart I stab at thee;
  //  for hate's sake I spit my last breath at thee."
  // -- Moby Dick, by Herman Melville
  if (Util.isIOS()) {
    var width = canvas.style.width;
    var height = canvas.style.height;
    canvas.style.width = (parseInt(width) + 1) + 'px';
    canvas.style.height = (parseInt(height)) + 'px';
    setTimeout(function() {
      canvas.style.width = width;
      canvas.style.height = height;
    }, 100);
  }

  // Debug only.
  window.Util = Util;
  window.canvas = canvas;
};

Util.isDebug = function() {
  return Util.getQueryParameter('debug');
};

Util.getQueryParameter = function(name) {
  var name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

Util.frameDataFromPose = (function() {
  var piOver180 = Math.PI / 180.0;
  var rad45 = Math.PI * 0.25;

  // Borrowed from glMatrix.
  function mat4_perspectiveFromFieldOfView(out, fov, near, far) {
    var upTan = Math.tan(fov ? (fov.upDegrees * piOver180) : rad45),
    downTan = Math.tan(fov ? (fov.downDegrees * piOver180) : rad45),
    leftTan = Math.tan(fov ? (fov.leftDegrees * piOver180) : rad45),
    rightTan = Math.tan(fov ? (fov.rightDegrees * piOver180) : rad45),
    xScale = 2.0 / (leftTan + rightTan),
    yScale = 2.0 / (upTan + downTan);

    out[0] = xScale;
    out[1] = 0.0;
    out[2] = 0.0;
    out[3] = 0.0;
    out[4] = 0.0;
    out[5] = yScale;
    out[6] = 0.0;
    out[7] = 0.0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = ((upTan - downTan) * yScale * 0.5);
    out[10] = far / (near - far);
    out[11] = -1.0;
    out[12] = 0.0;
    out[13] = 0.0;
    out[14] = (far * near) / (near - far);
    out[15] = 0.0;
    return out;
  }

  function mat4_fromRotationTranslation(out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;

    return out;
  };

  function mat4_translate(out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
      a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
      a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

      out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
      out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
      out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
  };

  function mat4_invert(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
      return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
  };

  var defaultOrientation = new Float32Array([0, 0, 0, 1]);
  var defaultPosition = new Float32Array([0, 0, 0]);

  function updateEyeMatrices(projection, view, pose, parameters, vrDisplay) {
    mat4_perspectiveFromFieldOfView(projection, parameters ? parameters.fieldOfView : null, vrDisplay.depthNear, vrDisplay.depthFar);

    var orientation = pose.orientation || defaultOrientation;
    var position = pose.position || defaultPosition;

    mat4_fromRotationTranslation(view, orientation, position);
    if (parameters)
      mat4_translate(view, view, parameters.offset);
    mat4_invert(view, view);
  }

  return function(frameData, pose, vrDisplay) {
    if (!frameData || !pose)
      return false;

    frameData.pose = pose;
    frameData.timestamp = pose.timestamp;

    updateEyeMatrices(
        frameData.leftProjectionMatrix, frameData.leftViewMatrix,
        pose, vrDisplay.getEyeParameters("left"), vrDisplay);
    updateEyeMatrices(
        frameData.rightProjectionMatrix, frameData.rightViewMatrix,
        pose, vrDisplay.getEyeParameters("right"), vrDisplay);

    return true;
  };
})();

Util.isInsideCrossDomainIFrame = function() {
  var isFramed = (window.self !== window.top);
  var refDomain = Util.getDomainFromUrl(document.referrer);
  var thisDomain = Util.getDomainFromUrl(window.location.href);

  return isFramed && (refDomain !== thisDomain);
};

// From http://stackoverflow.com/a/23945027.
Util.getDomainFromUrl = function(url) {
  var domain;
  // Find & remove protocol (http, ftp, etc.) and get domain.
  if (url.indexOf("://") > -1) {
    domain = url.split('/')[2];
  }
  else {
    domain = url.split('/')[0];
  }

  //find & remove port number
  domain = domain.split(':')[0];

  return domain;
}

module.exports = Util;

},{"object-assign":2}],23:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var DeviceInfo = _dereq_('./device-info.js');
var EventEmitter3 = _dereq_('eventemitter3');
var Util = _dereq_('./util.js');

var DEFAULT_VIEWER = 'CardboardV1';
var VIEWER_KEY = 'WEBVR_CARDBOARD_VIEWER';
var CLASS_NAME = 'webvr-polyfill-viewer-selector';

/**
 * Creates a viewer selector with the options specified. Supports being shown
 * and hidden. Generates events when viewer parameters change. Also supports
 * saving the currently selected index in localStorage.
 */
function ViewerSelector() {
  // Try to load the selected key from local storage. If none exists, use the
  // default key.
  try {
    this.selectedKey = localStorage.getItem(VIEWER_KEY) || DEFAULT_VIEWER;
  } catch (error) {
    console.error('Failed to load viewer profile: %s', error);
  }
  this.dialog = this.createDialog_(DeviceInfo.Viewers);
  this.root = null;
}
ViewerSelector.prototype = new EventEmitter3();

ViewerSelector.prototype.show = function(root) {
  this.root = root;

  root.appendChild(this.dialog);

  // Ensure the currently selected item is checked.
  var selected = this.dialog.querySelector('#' + this.selectedKey);
  selected.checked = true;

  // Show the UI.
  this.dialog.style.display = 'block';
};

ViewerSelector.prototype.hide = function() {
  if (this.root && this.root.contains(this.dialog)) {
    this.root.removeChild(this.dialog);
  }
  this.dialog.style.display = 'none';
};

ViewerSelector.prototype.getCurrentViewer = function() {
  return DeviceInfo.Viewers[this.selectedKey];
};

ViewerSelector.prototype.getSelectedKey_ = function() {
  var input = this.dialog.querySelector('input[name=field]:checked');
  if (input) {
    return input.id;
  }
  return null;
};

ViewerSelector.prototype.onSave_ = function() {
  this.selectedKey = this.getSelectedKey_();
  if (!this.selectedKey || !DeviceInfo.Viewers[this.selectedKey]) {
    console.error('ViewerSelector.onSave_: this should never happen!');
    return;
  }

  this.emit('change', DeviceInfo.Viewers[this.selectedKey]);

  // Attempt to save the viewer profile, but fails in private mode.
  try {
    localStorage.setItem(VIEWER_KEY, this.selectedKey);
  } catch(error) {
    console.error('Failed to save viewer profile: %s', error);
  }
  this.hide();
};

/**
 * Creates the dialog.
 */
ViewerSelector.prototype.createDialog_ = function(options) {
  var container = document.createElement('div');
  container.classList.add(CLASS_NAME);
  container.style.display = 'none';
  // Create an overlay that dims the background, and which goes away when you
  // tap it.
  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.left = 0;
  s.top = 0;
  s.width = '100%';
  s.height = '100%';
  s.background = 'rgba(0, 0, 0, 0.3)';
  overlay.addEventListener('click', this.hide.bind(this));

  var width = 280;
  var dialog = document.createElement('div');
  var s = dialog.style;
  s.boxSizing = 'border-box';
  s.position = 'fixed';
  s.top = '24px';
  s.left = '50%';
  s.marginLeft = (-width/2) + 'px';
  s.width = width + 'px';
  s.padding = '24px';
  s.overflow = 'hidden';
  s.background = '#fafafa';
  s.fontFamily = "'Roboto', sans-serif";
  s.boxShadow = '0px 5px 20px #666';

  dialog.appendChild(this.createH1_('Select your viewer'));
  for (var id in options) {
    dialog.appendChild(this.createChoice_(id, options[id].label));
  }
  dialog.appendChild(this.createButton_('Save', this.onSave_.bind(this)));

  container.appendChild(overlay);
  container.appendChild(dialog);

  return container;
};

ViewerSelector.prototype.createH1_ = function(name) {
  var h1 = document.createElement('h1');
  var s = h1.style;
  s.color = 'black';
  s.fontSize = '20px';
  s.fontWeight = 'bold';
  s.marginTop = 0;
  s.marginBottom = '24px';
  h1.innerHTML = name;
  return h1;
};

ViewerSelector.prototype.createChoice_ = function(id, name) {
  /*
  <div class="choice">
  <input id="v1" type="radio" name="field" value="v1">
  <label for="v1">Cardboard V1</label>
  </div>
  */
  var div = document.createElement('div');
  div.style.marginTop = '8px';
  div.style.color = 'black';

  var input = document.createElement('input');
  input.style.fontSize = '30px';
  input.setAttribute('id', id);
  input.setAttribute('type', 'radio');
  input.setAttribute('value', id);
  input.setAttribute('name', 'field');

  var label = document.createElement('label');
  label.style.marginLeft = '4px';
  label.setAttribute('for', id);
  label.innerHTML = name;

  div.appendChild(input);
  div.appendChild(label);

  return div;
};

ViewerSelector.prototype.createButton_ = function(label, onclick) {
  var button = document.createElement('button');
  button.innerHTML = label;
  var s = button.style;
  s.float = 'right';
  s.textTransform = 'uppercase';
  s.color = '#1094f7';
  s.fontSize = '14px';
  s.letterSpacing = 0;
  s.border = 0;
  s.background = 'none';
  s.marginTop = '16px';

  button.addEventListener('click', onclick);

  return button;
};

module.exports = ViewerSelector;

},{"./device-info.js":8,"./util.js":22,"eventemitter3":1}],24:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');

/**
 * Android and iOS compatible wakelock implementation.
 *
 * Refactored thanks to dkovalev@.
 */
function AndroidWakeLock() {
  var video = document.createElement('video');

  video.addEventListener('ended', function() {
    video.play();
  });

  this.request = function() {
    if (video.paused) {
      // Base64 version of videos_src/no-sleep-120s.mp4.
      video.src = Util.base64('video/mp4', 'AAAAGGZ0eXBpc29tAAAAAG1wNDFhdmMxAAAIA21vb3YAAABsbXZoZAAAAADSa9v60mvb+gABX5AAlw/gAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAdkdHJhawAAAFx0a2hkAAAAAdJr2/rSa9v6AAAAAQAAAAAAlw/gAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAQAAAAHAAAAAAAJGVkdHMAAAAcZWxzdAAAAAAAAAABAJcP4AAAAAAAAQAAAAAG3G1kaWEAAAAgbWRoZAAAAADSa9v60mvb+gAPQkAGjneAFccAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAABodtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAZHc3RibAAAAJdzdHNkAAAAAAAAAAEAAACHYXZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAMABwASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAADFhdmNDAWQAC//hABlnZAALrNlfllw4QAAAAwBAAAADAKPFCmWAAQAFaOvssiwAAAAYc3R0cwAAAAAAAAABAAAAbgAPQkAAAAAUc3RzcwAAAAAAAAABAAAAAQAAA4BjdHRzAAAAAAAAAG4AAAABAD0JAAAAAAEAehIAAAAAAQA9CQAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEALcbAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAABuAAAAAQAAAcxzdHN6AAAAAAAAAAAAAABuAAADCQAAABgAAAAOAAAADgAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABMAAAAUc3RjbwAAAAAAAAABAAAIKwAAACt1ZHRhAAAAI6llbmMAFwAAdmxjIDIuMi4xIHN0cmVhbSBvdXRwdXQAAAAId2lkZQAACRRtZGF0AAACrgX//6vcRem95tlIt5Ys2CDZI+7veDI2NCAtIGNvcmUgMTQyIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDEzIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MTIgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTEgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1hYnIgbWJ0cmVlPTEgYml0cmF0ZT0xMDAgcmF0ZXRvbD0xLjAgcWNvbXA9MC42MCBxcG1pbj0xMCBxcG1heD01MSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAU2WIhAAQ/8ltlOe+cTZuGkKg+aRtuivcDZ0pBsfsEi9p/i1yU9DxS2lq4dXTinViF1URBKXgnzKBd/Uh1bkhHtMrwrRcOJslD01UB+fyaL6ef+DBAAAAFEGaJGxBD5B+v+a+4QqF3MgBXz9MAAAACkGeQniH/+94r6EAAAAKAZ5hdEN/8QytwAAAAAgBnmNqQ3/EgQAAAA5BmmhJqEFomUwIIf/+4QAAAApBnoZFESw//76BAAAACAGepXRDf8SBAAAACAGep2pDf8SAAAAADkGarEmoQWyZTAgh//7gAAAACkGeykUVLD//voEAAAAIAZ7pdEN/xIAAAAAIAZ7rakN/xIAAAAAOQZrwSahBbJlMCCH//uEAAAAKQZ8ORRUsP/++gQAAAAgBny10Q3/EgQAAAAgBny9qQ3/EgAAAAA5BmzRJqEFsmUwIIf/+4AAAAApBn1JFFSw//76BAAAACAGfcXRDf8SAAAAACAGfc2pDf8SAAAAADkGbeEmoQWyZTAgh//7hAAAACkGflkUVLD//voAAAAAIAZ+1dEN/xIEAAAAIAZ+3akN/xIEAAAAOQZu8SahBbJlMCCH//uAAAAAKQZ/aRRUsP/++gQAAAAgBn/l0Q3/EgAAAAAgBn/tqQ3/EgQAAAA5Bm+BJqEFsmUwIIf/+4QAAAApBnh5FFSw//76AAAAACAGePXRDf8SAAAAACAGeP2pDf8SBAAAADkGaJEmoQWyZTAgh//7gAAAACkGeQkUVLD//voEAAAAIAZ5hdEN/xIAAAAAIAZ5jakN/xIEAAAAOQZpoSahBbJlMCCH//uEAAAAKQZ6GRRUsP/++gQAAAAgBnqV0Q3/EgQAAAAgBnqdqQ3/EgAAAAA5BmqxJqEFsmUwIIf/+4AAAAApBnspFFSw//76BAAAACAGe6XRDf8SAAAAACAGe62pDf8SAAAAADkGa8EmoQWyZTAgh//7hAAAACkGfDkUVLD//voEAAAAIAZ8tdEN/xIEAAAAIAZ8vakN/xIAAAAAOQZs0SahBbJlMCCH//uAAAAAKQZ9SRRUsP/++gQAAAAgBn3F0Q3/EgAAAAAgBn3NqQ3/EgAAAAA5Bm3hJqEFsmUwIIf/+4QAAAApBn5ZFFSw//76AAAAACAGftXRDf8SBAAAACAGft2pDf8SBAAAADkGbvEmoQWyZTAgh//7gAAAACkGf2kUVLD//voEAAAAIAZ/5dEN/xIAAAAAIAZ/7akN/xIEAAAAOQZvgSahBbJlMCCH//uEAAAAKQZ4eRRUsP/++gAAAAAgBnj10Q3/EgAAAAAgBnj9qQ3/EgQAAAA5BmiRJqEFsmUwIIf/+4AAAAApBnkJFFSw//76BAAAACAGeYXRDf8SAAAAACAGeY2pDf8SBAAAADkGaaEmoQWyZTAgh//7hAAAACkGehkUVLD//voEAAAAIAZ6ldEN/xIEAAAAIAZ6nakN/xIAAAAAOQZqsSahBbJlMCCH//uAAAAAKQZ7KRRUsP/++gQAAAAgBnul0Q3/EgAAAAAgBnutqQ3/EgAAAAA5BmvBJqEFsmUwIIf/+4QAAAApBnw5FFSw//76BAAAACAGfLXRDf8SBAAAACAGfL2pDf8SAAAAADkGbNEmoQWyZTAgh//7gAAAACkGfUkUVLD//voEAAAAIAZ9xdEN/xIAAAAAIAZ9zakN/xIAAAAAOQZt4SahBbJlMCCH//uEAAAAKQZ+WRRUsP/++gAAAAAgBn7V0Q3/EgQAAAAgBn7dqQ3/EgQAAAA5Bm7xJqEFsmUwIIf/+4AAAAApBn9pFFSw//76BAAAACAGf+XRDf8SAAAAACAGf+2pDf8SBAAAADkGb4EmoQWyZTAgh//7hAAAACkGeHkUVLD//voAAAAAIAZ49dEN/xIAAAAAIAZ4/akN/xIEAAAAOQZokSahBbJlMCCH//uAAAAAKQZ5CRRUsP/++gQAAAAgBnmF0Q3/EgAAAAAgBnmNqQ3/EgQAAAA5BmmhJqEFsmUwIIf/+4QAAAApBnoZFFSw//76BAAAACAGepXRDf8SBAAAACAGep2pDf8SAAAAADkGarEmoQWyZTAgh//7gAAAACkGeykUVLD//voEAAAAIAZ7pdEN/xIAAAAAIAZ7rakN/xIAAAAAPQZruSahBbJlMFEw3//7B');
      video.play();
    }
  };

  this.release = function() {
    video.pause();
    video.src = '';
  };
}

function iOSWakeLock() {
  var timer = null;

  this.request = function() {
    if (!timer) {
      timer = setInterval(function() {
        window.location = window.location;
        setTimeout(window.stop, 0);
      }, 30000);
    }
  }

  this.release = function() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
}


function getWakeLock() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
    return iOSWakeLock;
  } else {
    return AndroidWakeLock;
  }
}

module.exports = getWakeLock();
},{"./util.js":22}],25:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');
var CardboardVRDisplay = _dereq_('./cardboard-vr-display.js');
var MouseKeyboardVRDisplay = _dereq_('./mouse-keyboard-vr-display.js');
// Uncomment to add positional tracking via webcam.
//var WebcamPositionSensorVRDevice = require('./webcam-position-sensor-vr-device.js');
var VRDisplay = _dereq_('./base.js').VRDisplay;
var VRFrameData = _dereq_('./base.js').VRFrameData;
var HMDVRDevice = _dereq_('./base.js').HMDVRDevice;
var PositionSensorVRDevice = _dereq_('./base.js').PositionSensorVRDevice;
var VRDisplayHMDDevice = _dereq_('./display-wrappers.js').VRDisplayHMDDevice;
var VRDisplayPositionSensorDevice = _dereq_('./display-wrappers.js').VRDisplayPositionSensorDevice;

function WebVRPolyfill() {
  this.displays = [];
  this.devices = []; // For deprecated objects
  this.devicesPopulated = false;
  this.nativeWebVRAvailable = this.isWebVRAvailable();
  this.nativeLegacyWebVRAvailable = this.isDeprecatedWebVRAvailable();
  this.nativeGetVRDisplaysFunc = this.nativeWebVRAvailable ?
                                 navigator.getVRDisplays :
                                 null;

  if (!this.nativeLegacyWebVRAvailable) {
    this.enablePolyfill();
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.enableDeprecatedPolyfill();
    }
  }

  // Put a shim in place to update the API to 1.1 if needed.
  InstallWebVRSpecShim();
}

WebVRPolyfill.prototype.isWebVRAvailable = function() {
  return ('getVRDisplays' in navigator);
};

WebVRPolyfill.prototype.isDeprecatedWebVRAvailable = function() {
  return ('getVRDevices' in navigator) || ('mozGetVRDevices' in navigator);
};

WebVRPolyfill.prototype.populateDevices = function() {
  if (this.devicesPopulated) {
    return;
  }

  // Initialize our virtual VR devices.
  var vrDisplay = null;

  // Add a Cardboard VRDisplay on compatible mobile devices
  if (this.isCardboardCompatible()) {
    vrDisplay = new CardboardVRDisplay();
    this.displays.push(vrDisplay);

    // For backwards compatibility
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Add a Mouse and Keyboard driven VRDisplay for desktops/laptops
  if (!this.isMobile() && !WebVRConfig.MOUSE_KEYBOARD_CONTROLS_DISABLED) {
    vrDisplay = new MouseKeyboardVRDisplay();
    this.displays.push(vrDisplay);

    // For backwards compatibility
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Uncomment to add positional tracking via webcam.
  //if (!this.isMobile() && WebVRConfig.ENABLE_DEPRECATED_API) {
  //  positionDevice = new WebcamPositionSensorVRDevice();
  //  this.devices.push(positionDevice);
  //}

  this.devicesPopulated = true;
};

WebVRPolyfill.prototype.enablePolyfill = function() {
  // Provide navigator.getVRDisplays.
  navigator.getVRDisplays = this.getVRDisplays.bind(this);

  // Provide the VRDisplay object.
  window.VRDisplay = VRDisplay;

  // Provide navigator.vrEnabled.
  var self = this;
  Object.defineProperty(navigator, 'vrEnabled', {
    get: function () {
      return self.isCardboardCompatible() &&
          (self.isFullScreenAvailable() || Util.isIOS());
    }
  });

  if (!'VRFrameData' in window) {
    // Provide the VRFrameData object.
    window.VRFrameData = VRFrameData;
  }
};

WebVRPolyfill.prototype.enableDeprecatedPolyfill = function() {
  // Provide navigator.getVRDevices.
  navigator.getVRDevices = this.getVRDevices.bind(this);

  // Provide the CardboardHMDVRDevice and PositionSensorVRDevice objects.
  window.HMDVRDevice = HMDVRDevice;
  window.PositionSensorVRDevice = PositionSensorVRDevice;
};

WebVRPolyfill.prototype.getVRDisplays = function() {
  this.populateDevices();
  var polyfillDisplays = this.displays;

  if (this.nativeWebVRAvailable) {
    return this.nativeGetVRDisplaysFunc.call(navigator).then(function(nativeDisplays) {
      if (WebVRConfig.ALWAYS_APPEND_POLYFILL_DISPLAY) {
        return nativeDisplays.concat(polyfillDisplays);
      } else {
        return nativeDisplays.length > 0 ? nativeDisplays : polyfillDisplays;
      }
    });
  } else {
    return new Promise(function(resolve, reject) {
      try {
        resolve(polyfillDisplays);
      } catch (e) {
        reject(e);
      }
    });
  }
};

WebVRPolyfill.prototype.getVRDevices = function() {
  console.warn('getVRDevices is deprecated. Please update your code to use getVRDisplays instead.');
  var self = this;
  return new Promise(function(resolve, reject) {
    try {
      if (!self.devicesPopulated) {
        if (self.nativeWebVRAvailable) {
          return navigator.getVRDisplays(function(displays) {
            for (var i = 0; i < displays.length; ++i) {
              self.devices.push(new VRDisplayHMDDevice(displays[i]));
              self.devices.push(new VRDisplayPositionSensorDevice(displays[i]));
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }

        if (self.nativeLegacyWebVRAvailable) {
          return (navigator.getVRDDevices || navigator.mozGetVRDevices)(function(devices) {
            for (var i = 0; i < devices.length; ++i) {
              if (devices[i] instanceof HMDVRDevice) {
                self.devices.push(devices[i]);
              }
              if (devices[i] instanceof PositionSensorVRDevice) {
                self.devices.push(devices[i]);
              }
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }
      }

      self.populateDevices();
      resolve(self.devices);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Determine if a device is mobile.
 */
WebVRPolyfill.prototype.isMobile = function() {
  return /Android/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

WebVRPolyfill.prototype.isCardboardCompatible = function() {
  // For now, support all iOS and Android devices.
  // Also enable the WebVRConfig.FORCE_VR flag for debugging.
  return this.isMobile() || WebVRConfig.FORCE_ENABLE_VR;
};

WebVRPolyfill.prototype.isFullScreenAvailable = function() {
  return (document.fullscreenEnabled ||
          document.mozFullScreenEnabled ||
          document.webkitFullscreenEnabled ||
          false);
};

// Installs a shim that updates a WebVR 1.0 spec implementation to WebVR 1.1
function InstallWebVRSpecShim() {
  if ('VRDisplay' in window && !('VRFrameData' in window)) {
    // Provide the VRFrameData object.
    window.VRFrameData = VRFrameData;

    // A lot of Chrome builds don't have depthNear and depthFar, even
    // though they're in the WebVR 1.0 spec. Patch them in if they're not present.
    if(!('depthNear' in window.VRDisplay.prototype)) {
      window.VRDisplay.prototype.depthNear = 0.01;
    }

    if(!('depthFar' in window.VRDisplay.prototype)) {
      window.VRDisplay.prototype.depthFar = 10000.0;
    }

    window.VRDisplay.prototype.getFrameData = function(frameData) {
      return Util.frameDataFromPose(frameData, this.getPose(), this);
    }
  }
};

module.exports.WebVRPolyfill = WebVRPolyfill;

},{"./base.js":3,"./cardboard-vr-display.js":6,"./display-wrappers.js":9,"./mouse-keyboard-vr-display.js":15,"./util.js":22}]},{},[13])(13)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],5:[function(require,module,exports){
'use strict';

var _renderer = require('./renderer.js');

var _renderer2 = _interopRequireDefault(_renderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var renderer = void 0; /*
                        * Copyright 2016 Google Inc. All Rights Reserved.
                        * Licensed under the Apache License, Version 2.0 (the "License");
                        * you may not use this file except in compliance with the License.
                        * You may obtain a copy of the License at
                        *
                        *     http://www.apache.org/licenses/LICENSE-2.0
                        *
                        * Unless required by applicable law or agreed to in writing, software
                        * distributed under the License is distributed on an "AS IS" BASIS,
                        * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                        * See the License for the specific language governing permissions and
                        * limitations under the License.
                        */

var vrDisplay = void 0;

function onLoad() {
  renderer = new _renderer2.default();

  window.addEventListener('resize', function () {
    renderer.resize();
  });

  navigator.getVRDisplays().then(function (displays) {
    if (displays.length > 0) {
      vrDisplay = displays[0];
      vrDisplay.requestAnimationFrame(render);
    }
  });
}

function render() {
  renderer.render();

  vrDisplay.requestAnimationFrame(render);
}

window.addEventListener('load', onLoad);

},{"./renderer.js":6}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _webvrBoilerplate = require('webvr-boilerplate');

var _webvrBoilerplate2 = _interopRequireDefault(_webvrBoilerplate);

var _webvrPolyfill = require('webvr-polyfill');

var _webvrPolyfill2 = _interopRequireDefault(_webvrPolyfill);

var _rayInput = require('../ray-input');

var _rayInput2 = _interopRequireDefault(_rayInput);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WIDTH = 2;
var HEIGHT = 2;
var DEFAULT_COLOR = new THREE.Color(0x00FF00);
var HIGHLIGHT_COLOR = new THREE.Color(0x1E90FF);
var ACTIVE_COLOR = new THREE.Color(0xFF3333);

/**
 * Renders a menu of items that can be interacted with.
 */

var MenuRenderer = function () {
  function MenuRenderer() {
    var _this = this;

    _classCallCheck(this, MenuRenderer);

    var scene = new THREE.Scene();

    var aspect = window.innerWidth / window.innerHeight;
    var camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
    scene.add(camera);

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    var effect = new THREE.VREffect(renderer);
    var controls = new THREE.VRControls(camera);
    controls.standing = true;

    var manager = new _webvrBoilerplate2.default(renderer, effect);
    document.body.appendChild(renderer.domElement);

    // Input manager.
    var rayInput = new _rayInput2.default(camera);
    rayInput.setSize(renderer.getSize());
    rayInput.on('raydown', function (opt_mesh) {
      _this.handleRayDown_(opt_mesh);
    });
    rayInput.on('rayup', function (opt_mesh) {
      _this.handleRayUp_(opt_mesh);
    });
    rayInput.on('raycancel', function (opt_mesh) {
      _this.handleRayCancel_(opt_mesh);
    });
    rayInput.on('rayover', function (mesh) {
      _this.setSelected_(mesh, true);
    });
    rayInput.on('rayout', function (mesh) {
      _this.setSelected_(mesh, false);
    });

    // Add the ray input mesh to the scene.
    scene.add(rayInput.getMesh());

    this.manager = manager;
    this.camera = camera;
    this.scene = scene;
    this.controls = controls;
    this.rayInput = rayInput;
    this.effect = effect;
    this.renderer = renderer;

    // Add a small fake menu to interact with.
    var menu = this.createMenu_();
    scene.add(menu);

    // Add a floor.
    var floor = this.createFloor_();
    scene.add(floor);

    menu.children.forEach(function (menuItem) {
      //console.log('menuItem', menuItem);
      rayInput.add(menuItem);
    });
  }

  _createClass(MenuRenderer, [{
    key: 'render',
    value: function render() {
      this.controls.update();
      this.rayInput.update();
      this.effect.render(this.scene, this.camera);
    }
  }, {
    key: 'resize',
    value: function resize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.rayInput.setSize(this.renderer.getSize());
    }
  }, {
    key: 'handleRayDown_',
    value: function handleRayDown_(opt_mesh) {
      this.setAction_(opt_mesh, true);
    }
  }, {
    key: 'handleRayUp_',
    value: function handleRayUp_(opt_mesh) {
      this.setAction_(opt_mesh, false);
    }
  }, {
    key: 'handleRayCancel_',
    value: function handleRayCancel_(opt_mesh) {
      this.setAction_(opt_mesh, false);
    }
  }, {
    key: 'setSelected_',
    value: function setSelected_(mesh, isSelected) {
      //console.log('setSelected_', isSelected);
      var newColor = isSelected ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
      mesh.material.color = newColor;
    }
  }, {
    key: 'setAction_',
    value: function setAction_(opt_mesh, isActive) {
      //console.log('setAction_', !!opt_mesh, isActive);
      if (opt_mesh) {
        var newColor = isActive ? ACTIVE_COLOR : HIGHLIGHT_COLOR;
        opt_mesh.material.color = newColor;
        if (!isActive) {
          opt_mesh.material.wireframe = !opt_mesh.material.wireframe;
        }
      }
    }
  }, {
    key: 'createMenu_',
    value: function createMenu_() {
      var menu = new THREE.Object3D();

      // Create a 2x2 grid of menu items (green rectangles).
      for (var i = 0; i < WIDTH; i++) {
        for (var j = 0; j < HEIGHT; j++) {
          var item = this.createMenuItem_();
          item.position.set(i, j, 0);
          item.scale.set(0.9, 0.9, 0.1);
          menu.add(item);
        }
      }

      menu.position.set(-WIDTH / 4, HEIGHT / 2, -3);
      return menu;
    }
  }, {
    key: 'createMenuItem_',
    value: function createMenuItem_() {
      var geometry = new THREE.BoxGeometry(1, 1, 1);
      var material = new THREE.MeshBasicMaterial({ color: DEFAULT_COLOR });
      var cube = new THREE.Mesh(geometry, material);

      return cube;
    }
  }, {
    key: 'createFloor_',
    value: function createFloor_() {
      var boxSize = 10;
      var loader = new THREE.TextureLoader();
      loader.load('img/box.png', onTextureLoaded);
      var out = new THREE.Object3D();

      function onTextureLoaded(texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(boxSize, boxSize);

        var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
        var material = new THREE.MeshBasicMaterial({
          map: texture,
          color: 0x015500,
          side: THREE.BackSide
        });

        // Align the skybox to the floor (which is at y=0).
        var skybox = new THREE.Mesh(geometry, material);
        skybox.position.y = boxSize / 2;

        out.add(skybox);
      }
      return out;
    }
  }]);

  return MenuRenderer;
}();

exports.default = MenuRenderer;

},{"../ray-input":9,"webvr-boilerplate":3,"webvr-polyfill":4}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var HEAD_ELBOW_OFFSET_RIGHTHANDED = new THREE.Vector3(0.155, -0.465, -0.15);
var HEAD_ELBOW_OFFSET_LEFTHANDED = new THREE.Vector3(-0.155, -0.465, -0.15);
var head_elbow_offset = HEAD_ELBOW_OFFSET_RIGHTHANDED;
var ELBOW_WRIST_OFFSET = new THREE.Vector3(0, 0, -0.25);
var WRIST_CONTROLLER_OFFSET = new THREE.Vector3(0, 0, 0.05);
var ARM_EXTENSION_OFFSET = new THREE.Vector3(-0.08, 0.14, 0.08);

var ELBOW_BEND_RATIO = 0.4; // 40% elbow, 60% wrist.
var EXTENSION_RATIO_WEIGHT = 0.4;

var MIN_ANGULAR_SPEED = 0.61; // 35 degrees per second (in radians).

/**
 * Represents the arm model for the Daydream controller. Feed it a camera and
 * the controller. Update it on a RAF.
 *
 * Get the model's pose using getPose().
 */

var OrientationArmModel = function () {
  function OrientationArmModel() {
    _classCallCheck(this, OrientationArmModel);

    this.isLeftHanded = false;

    // Current and previous controller orientations.
    this.controllerQ = new THREE.Quaternion();
    this.lastControllerQ = new THREE.Quaternion();

    // Current and previous head orientations.
    this.headQ = new THREE.Quaternion();

    // Current head position.
    this.headPos = new THREE.Vector3();

    // Positions of other joints (mostly for debugging).
    this.elbowPos = new THREE.Vector3();
    this.wristPos = new THREE.Vector3();

    // Current and previous times the model was updated.
    this.time = null;
    this.lastTime = null;

    // Root rotation.
    this.rootQ = new THREE.Quaternion();

    // Current pose that this arm model calculates.
    this.pose = {
      orientation: new THREE.Quaternion(),
      position: new THREE.Vector3()
    };
  }

  /**
   * Methods to set controller and head pose (in world coordinates).
   */


  _createClass(OrientationArmModel, [{
    key: 'setControllerOrientation',
    value: function setControllerOrientation(quaternion) {
      this.lastControllerQ.copy(this.controllerQ);
      this.controllerQ.copy(quaternion);
    }
  }, {
    key: 'setHeadOrientation',
    value: function setHeadOrientation(quaternion) {
      this.headQ.copy(quaternion);
    }
  }, {
    key: 'setHeadPosition',
    value: function setHeadPosition(position) {
      this.headPos.copy(position);
    }
  }, {
    key: 'setLeftHanded',
    value: function setLeftHanded(isLeftHanded) {
      this.isLeftHanded = isLeftHanded;
      if (isLeftHanded) {
        head_elbow_offset = HEAD_ELBOW_OFFSET_LEFTHANDED;
      } else {
        head_elbow_offset = HEAD_ELBOW_OFFSET_RIGHTHANDED;
      }
    }

    /**
     * Called on a RAF.
     */

  }, {
    key: 'update',
    value: function update() {
      this.time = performance.now();

      // If the controller's angular velocity is above a certain amount, we can
      // assume torso rotation and move the elbow joint relative to the
      // camera orientation.
      var headYawQ = this.getHeadYawOrientation_();
      var timeDelta = (this.time - this.lastTime) / 1000;
      var angleDelta = this.quatAngle_(this.lastControllerQ, this.controllerQ);
      var controllerAngularSpeed = angleDelta / timeDelta;
      if (controllerAngularSpeed > MIN_ANGULAR_SPEED) {
        // Attenuate the Root rotation slightly.
        this.rootQ.slerp(headYawQ, angleDelta / 10);
      } else {
        this.rootQ.copy(headYawQ);
      }

      // We want to move the elbow up and to the center as the user points the
      // controller upwards, so that they can easily see the controller and its
      // tool tips.
      var controllerEuler = new THREE.Euler().setFromQuaternion(this.controllerQ, 'YXZ');
      var controllerXDeg = THREE.Math.radToDeg(controllerEuler.x);
      var extensionRatio = this.clamp_((controllerXDeg - 11) / (50 - 11), 0, 1);

      // Controller orientation in camera space.
      var controllerCameraQ = this.rootQ.clone().inverse();
      controllerCameraQ.multiply(this.controllerQ);

      // Calculate elbow position.
      var elbowPos = this.elbowPos;
      elbowPos.copy(this.headPos).add(head_elbow_offset);
      var elbowOffset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
      elbowOffset.multiplyScalar(extensionRatio);
      elbowPos.add(elbowOffset);

      // Calculate joint angles. Generally 40% of rotation applied to elbow, 60%
      // to wrist, but if controller is raised higher, more rotation comes from
      // the wrist.
      var totalAngle = this.quatAngle_(controllerCameraQ, new THREE.Quaternion());
      var totalAngleDeg = THREE.Math.radToDeg(totalAngle);
      var lerpSuppression = 1 - Math.pow(totalAngleDeg / 180, 4); // TODO(smus): ???

      var elbowRatio = ELBOW_BEND_RATIO;
      var wristRatio = 1 - ELBOW_BEND_RATIO;
      var lerpValue = lerpSuppression * (elbowRatio + wristRatio * extensionRatio * EXTENSION_RATIO_WEIGHT);

      var wristQ = new THREE.Quaternion().slerp(controllerCameraQ, lerpValue);
      var invWristQ = wristQ.inverse();
      var elbowQ = controllerCameraQ.clone().multiply(invWristQ);

      // Calculate our final controller position based on all our joint rotations
      // and lengths.
      /*
      position_ =
        root_rot_ * (
          controller_root_offset_ +
      2:      (arm_extension_ * amt_extension) +
      1:      elbow_rot * (kControllerForearm + (wrist_rot * kControllerPosition))
        );
      */
      var wristPos = this.wristPos;
      wristPos.copy(WRIST_CONTROLLER_OFFSET);
      wristPos.applyQuaternion(wristQ);
      wristPos.add(ELBOW_WRIST_OFFSET);
      wristPos.applyQuaternion(elbowQ);
      wristPos.add(this.elbowPos);

      var offset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
      offset.multiplyScalar(extensionRatio);

      var position = new THREE.Vector3().copy(this.wristPos);
      position.add(offset);
      position.applyQuaternion(this.rootQ);

      var orientation = new THREE.Quaternion().copy(this.controllerQ);

      // Set the resulting pose orientation and position.
      this.pose.orientation.copy(orientation);
      this.pose.position.copy(position);

      this.lastTime = this.time;
    }

    /**
     * Returns the pose calculated by the model.
     */

  }, {
    key: 'getPose',
    value: function getPose() {
      return this.pose;
    }

    /**
     * Debug methods for rendering the arm model.
     */

  }, {
    key: 'getForearmLength',
    value: function getForearmLength() {
      return ELBOW_WRIST_OFFSET.length();
    }
  }, {
    key: 'getElbowPosition',
    value: function getElbowPosition() {
      var out = this.elbowPos.clone();
      return out.applyQuaternion(this.rootQ);
    }
  }, {
    key: 'getWristPosition',
    value: function getWristPosition() {
      var out = this.wristPos.clone();
      return out.applyQuaternion(this.rootQ);
    }
  }, {
    key: 'getHeadYawOrientation_',
    value: function getHeadYawOrientation_() {
      var headEuler = new THREE.Euler().setFromQuaternion(this.headQ, 'YXZ');
      headEuler.x = 0;
      headEuler.z = 0;
      var destinationQ = new THREE.Quaternion().setFromEuler(headEuler);
      return destinationQ;
    }
  }, {
    key: 'clamp_',
    value: function clamp_(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }
  }, {
    key: 'quatAngle_',
    value: function quatAngle_(q1, q2) {
      var vec1 = new THREE.Vector3(0, 0, -1);
      var vec2 = new THREE.Vector3(0, 0, -1);
      vec1.applyQuaternion(q1);
      vec2.applyQuaternion(q2);
      return vec1.angleTo(vec2);
    }
  }]);

  return OrientationArmModel;
}();

exports.default = OrientationArmModel;

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _rayInteractionModes = require('./ray-interaction-modes');

var _rayInteractionModes2 = _interopRequireDefault(_rayInteractionModes);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var DRAG_DISTANCE_PX = 10;

/**
 * Enumerates all possible interaction modes. Sets up all event handlers (mouse,
 * touch, etc), interfaces with gamepad API.
 *
 * Emits events:
 *    action: Input is activated (mousedown, touchstart, daydream click, vive
 *    trigger).
 *    release: Input is deactivated (mouseup, touchend, daydream release, vive
 *    release).
 *    cancel: Input is canceled (eg. we scrolled instead of tapping on
 *    mobile/desktop).
 *    pointermove(2D position): The pointer is moved (mouse or touch).
 */

var RayController = function (_EventEmitter) {
  _inherits(RayController, _EventEmitter);

  function RayController(opt_el) {
    _classCallCheck(this, RayController);

    var _this = _possibleConstructorReturn(this, (RayController.__proto__ || Object.getPrototypeOf(RayController)).call(this));

    var el = opt_el || window;

    // Handle interactions.
    el.addEventListener('mousedown', _this.onMouseDown_.bind(_this));
    el.addEventListener('mousemove', _this.onMouseMove_.bind(_this));
    el.addEventListener('mouseup', _this.onMouseUp_.bind(_this));
    el.addEventListener('touchstart', _this.onTouchStart_.bind(_this));
    el.addEventListener('touchmove', _this.onTouchMove_.bind(_this));
    el.addEventListener('touchend', _this.onTouchEnd_.bind(_this));

    // The position of the pointer.
    _this.pointer = new THREE.Vector2();
    // The previous position of the pointer.
    _this.lastPointer = new THREE.Vector2();
    // Position of pointer in Normalized Device Coordinates (NDC).
    _this.pointerNdc = new THREE.Vector2();
    // How much we have dragged (if we are dragging).
    _this.dragDistance = 0;
    // Are we dragging or not.
    _this.isDragging = false;
    // Is pointer active or not.
    _this.isTouchActive = false;
    // Is this a synthetic mouse event?
    _this.isSyntheticMouseEvent = false;

    // Gamepad events.
    _this.gamepad = null;

    _this.isLeftHanded = false;

    // VR Events.
    if (!navigator.getVRDisplays) {
      console.warn('WebVR API not available! Consider using the webvr-polyfill.');
    } else {
      navigator.getVRDisplays().then(function (displays) {
        _this.vrDisplay = displays[0];
      });
    }
    return _this;
  }

  _createClass(RayController, [{
    key: 'getInteractionMode',
    value: function getInteractionMode() {
      // TODO: Debugging only.
      //return InteractionModes.DAYDREAM;

      var gamepad = this.getVRGamepad_();
      this.gamepad = gamepad;
      if (gamepad) {
        if (gamepad.hand) {
          if (gamepad.hand === 'left') {
            this.isLeftHanded = true;
          } else {
            this.isLeftHanded = false;
          }
        }
        var pose = gamepad.pose;
        // If there's a gamepad connected, determine if it's Daydream or a Vive.
        if (pose.hasPosition) {
          return _rayInteractionModes2.default.VR_6DOF;
        }

        if (pose.hasOrientation) {
          return _rayInteractionModes2.default.VR_3DOF;
        }
      } else {
        // If there's no gamepad, it might be Cardboard, magic window or desktop.
        if ((0, _util.isMobile)()) {
          // Either Cardboard or magic window, depending on whether we are
          // presenting.
          if (this.vrDisplay && this.vrDisplay.isPresenting) {
            return _rayInteractionModes2.default.VR_0DOF;
          } else {
            return _rayInteractionModes2.default.TOUCH;
          }
        } else {
          // We must be on desktop.
          return _rayInteractionModes2.default.MOUSE;
        }
      }
      // By default, use TOUCH.
      return _rayInteractionModes2.default.TOUCH;
    }
  }, {
    key: 'getGamepadPose',
    value: function getGamepadPose() {
      var gamepad = this.getVRGamepad_();
      return gamepad.pose;
    }

    /**
     * Get if there is an active touch event going on.
     * Only relevant on touch devices
     */

  }, {
    key: 'getIsTouchActive',
    value: function getIsTouchActive() {
      return this.isTouchActive;
    }

    /**
     * Checks if this click is the cardboard-compatible fallback
     * click on Daydream controllers so that we can deduplicate it.
     * TODO(klausw): It would be nice to be able to move interactions
     * to this event since it counts as a user action while controller
     * clicks don't. But that would require larger refactoring.
     */

  }, {
    key: 'isCardboardCompatClick',
    value: function isCardboardCompatClick(e) {
      var mode = this.getInteractionMode();
      if (mode == _rayInteractionModes2.default.VR_3DOF && e.screenX == 0 && e.screenY == 0) {
        return true;
      }
      return false;
    }
  }, {
    key: 'setSize',
    value: function setSize(size) {
      this.size = size;
    }
  }, {
    key: 'setOffset',
    value: function setOffset(offset) {
      this.offset = offset;
    }
  }, {
    key: 'update',
    value: function update() {
      var mode = this.getInteractionMode();
      if (mode == _rayInteractionModes2.default.VR_3DOF || mode == _rayInteractionModes2.default.VR_6DOF) {
        // If we're dealing with a gamepad, check every animation frame for a
        // pressed action.
        var isGamepadPressed = this.getGamepadButtonPressed_();
        if (isGamepadPressed && !this.wasGamepadPressed) {
          this.emit('raydown');
        }
        if (!isGamepadPressed && this.wasGamepadPressed) {
          this.emit('rayup');
        }
        this.wasGamepadPressed = isGamepadPressed;
      }
    }
  }, {
    key: 'getGamepadButtonPressed_',
    value: function getGamepadButtonPressed_() {
      var gamepad = this.getVRGamepad_();
      if (!gamepad) {
        // If there's no gamepad, the button was not pressed.
        return false;
      }
      // Check for clicks.
      for (var j = 0; j < gamepad.buttons.length; ++j) {
        if (gamepad.buttons[j].pressed) {
          return true;
        }
      }
      return false;
    }
  }, {
    key: 'onMouseDown_',
    value: function onMouseDown_(e) {
      if (this.isSyntheticMouseEvent) return;
      if (this.isCardboardCompatClick(e)) return;

      this.startDragging_(e);
      this.emit('raydown');
    }
  }, {
    key: 'onMouseMove_',
    value: function onMouseMove_(e) {
      if (this.isSyntheticMouseEvent) return;

      this.updatePointer_(e);
      this.updateDragDistance_();
      this.emit('pointermove', this.pointerNdc);
    }
  }, {
    key: 'onMouseUp_',
    value: function onMouseUp_(e) {
      var isSynthetic = this.isSyntheticMouseEvent;
      this.isSyntheticMouseEvent = false;
      if (isSynthetic) return;
      if (this.isCardboardCompatClick(e)) return;

      this.endDragging_();
    }
  }, {
    key: 'onTouchStart_',
    value: function onTouchStart_(e) {
      this.isTouchActive = true;
      var t = e.touches[0];
      this.startDragging_(t);
      this.updateTouchPointer_(e);

      this.emit('pointermove', this.pointerNdc);
      this.emit('raydown');
    }
  }, {
    key: 'onTouchMove_',
    value: function onTouchMove_(e) {
      this.updateTouchPointer_(e);
      this.updateDragDistance_();
    }
  }, {
    key: 'onTouchEnd_',
    value: function onTouchEnd_(e) {
      this.endDragging_();

      // Suppress duplicate events from synthetic mouse events.
      this.isSyntheticMouseEvent = true;
      this.isTouchActive = false;
    }
  }, {
    key: 'updateTouchPointer_',
    value: function updateTouchPointer_(e) {
      // If there's no touches array, ignore.
      if (e.touches.length === 0) {
        console.warn('Received touch event with no touches.');
        return;
      }
      var t = e.touches[0];
      this.updatePointer_(t);
    }
  }, {
    key: 'updatePointer_',
    value: function updatePointer_(e) {
      // How much the pointer moved.
      this.pointer.set(e.clientX - this.offset.left, e.clientY - this.offset.top);
      this.pointerNdc.x = (e.clientX - this.offset.left) / this.size.width * 2 - 1;
      this.pointerNdc.y = -((e.clientY - this.offset.top) / this.size.height) * 2 + 1;
    }
  }, {
    key: 'updateDragDistance_',
    value: function updateDragDistance_() {
      if (this.isDragging) {
        var distance = this.lastPointer.sub(this.pointer).length();
        this.dragDistance += distance;
        this.lastPointer.copy(this.pointer);

        //console.log('dragDistance', this.dragDistance);
        if (this.dragDistance > DRAG_DISTANCE_PX) {
          this.emit('raycancel');
          this.isDragging = false;
        }
      }
    }
  }, {
    key: 'startDragging_',
    value: function startDragging_(e) {
      this.isDragging = true;
      this.lastPointer.set(e.clientX - this.offset.left, e.clientY - this.offset.top);
    }
  }, {
    key: 'endDragging_',
    value: function endDragging_() {
      if (this.dragDistance < DRAG_DISTANCE_PX) {
        this.emit('rayup');
      }
      this.dragDistance = 0;
      this.isDragging = false;
    }

    /**
     * Gets the first VR-enabled gamepad.
     */

  }, {
    key: 'getVRGamepad_',
    value: function getVRGamepad_() {
      // If there's no gamepad API, there's no gamepad.
      if (!navigator.getGamepads) {
        return null;
      }

      var gamepads = navigator.getGamepads();
      for (var i = 0; i < gamepads.length; ++i) {
        var gamepad = gamepads[i];
        // The array may contain undefined gamepads, so check for that as well as
        // a non-null pose.
        if (gamepad && gamepad.pose) {
          return gamepad;
        }
      }
      return null;
    }
  }]);

  return RayController;
}(_eventemitter2.default);

exports.default = RayController;

},{"./ray-interaction-modes":10,"./util":12,"eventemitter3":1}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _orientationArmModel = require('./orientation-arm-model');

var _orientationArmModel2 = _interopRequireDefault(_orientationArmModel);

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _rayRenderer = require('./ray-renderer');

var _rayRenderer2 = _interopRequireDefault(_rayRenderer);

var _rayController = require('./ray-controller');

var _rayController2 = _interopRequireDefault(_rayController);

var _rayInteractionModes = require('./ray-interaction-modes');

var _rayInteractionModes2 = _interopRequireDefault(_rayInteractionModes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

/**
 * API wrapper for the input library.
 */
var RayInput = function (_EventEmitter) {
  _inherits(RayInput, _EventEmitter);

  function RayInput(camera, opt_el) {
    _classCallCheck(this, RayInput);

    var _this = _possibleConstructorReturn(this, (RayInput.__proto__ || Object.getPrototypeOf(RayInput)).call(this));

    _this.camera = camera;
    _this.renderer = new _rayRenderer2.default(camera);
    _this.controller = new _rayController2.default(opt_el);

    // Arm model needed to transform controller orientation into proper pose.
    _this.armModel = new _orientationArmModel2.default();

    _this.controller.on('raydown', _this.onRayDown_.bind(_this));
    _this.controller.on('rayup', _this.onRayUp_.bind(_this));
    _this.controller.on('raycancel', _this.onRayCancel_.bind(_this));
    _this.controller.on('pointermove', _this.onPointerMove_.bind(_this));
    _this.renderer.on('rayover', function (mesh) {
      _this.emit('rayover', mesh);
    });
    _this.renderer.on('rayout', function (mesh) {
      _this.emit('rayout', mesh);
    });

    // By default, put the pointer offscreen.
    _this.pointerNdc = new THREE.Vector2(1, 1);

    // Event handlers.
    _this.handlers = {};
    return _this;
  }

  _createClass(RayInput, [{
    key: 'add',
    value: function add(object, handlers) {
      this.renderer.add(object, handlers);
      this.handlers[object.id] = handlers;
    }
  }, {
    key: 'remove',
    value: function remove(object) {
      this.renderer.remove(object);
      delete this.handlers[object.id];
    }
  }, {
    key: 'update',
    value: function update() {
      var lookAt = new THREE.Vector3(0, 0, -1);
      lookAt.applyQuaternion(this.camera.quaternion);

      var mode = this.controller.getInteractionMode();
      switch (mode) {
        case _rayInteractionModes2.default.MOUSE:
          // Desktop mouse mode, mouse coordinates are what matters.
          this.renderer.setPointer(this.pointerNdc);
          // Hide the ray and reticle.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(false);

          // In mouse mode ray renderer is always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.TOUCH:
          // Mobile magic window mode. Touch coordinates matter, but we want to
          // hide the reticle.
          this.renderer.setPointer(this.pointerNdc);

          // Hide the ray and the reticle.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(false);

          // In touch mode the ray renderer is only active on touch.
          this.renderer.setActive(this.controller.getIsTouchActive());
          break;

        case _rayInteractionModes2.default.VR_0DOF:
          // Cardboard mode, we're dealing with a gaze reticle.
          this.renderer.setPosition(this.camera.position);
          this.renderer.setOrientation(this.camera.quaternion);

          // Reticle only.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.VR_3DOF:
          // Daydream, our origin is slightly off (depending on handedness).
          // But we should be using the orientation from the gamepad.
          // TODO(smus): Implement the real arm model.
          var pose = this.controller.getGamepadPose();
          // Debug only: use camera as input controller.
          //let controllerOrientation = this.camera.quaternion;
          var controllerOrientation = new THREE.Quaternion().fromArray(pose.orientation);

          // Transform the controller into the camera coordinate system.
          /*
          controllerOrientation.multiply(
              new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
          controllerOrientation.x *= -1;
          controllerOrientation.z *= -1;
          */

          // Feed camera and controller into the arm model.
          this.armModel.setHeadOrientation(this.camera.quaternion);
          this.armModel.setHeadPosition(this.camera.position);
          this.armModel.setControllerOrientation(controllerOrientation);
          this.armModel.update();

          // Get resulting pose and configure the renderer.
          var modelPose = this.armModel.getPose();
          this.renderer.setPosition(modelPose.position);
          //this.renderer.setPosition(new THREE.Vector3());
          this.renderer.setOrientation(modelPose.orientation);
          //this.renderer.setOrientation(controllerOrientation);
          this.armModel.setLeftHanded(this.controller.isLeftHanded);
          // Show ray and reticle.
          this.renderer.setRayVisibility(true);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.VR_6DOF:
          // Vive, origin depends on the position of the controller.
          // TODO(smus)...
          var pose = this.controller.getGamepadPose();

          // Check that the pose is valid.
          if (!pose.orientation || !pose.position) {
            console.warn('Invalid gamepad pose. Can\'t update ray.');
            break;
          }
          var orientation = new THREE.Quaternion().fromArray(pose.orientation);
          var position = new THREE.Vector3().fromArray(pose.position);

          this.renderer.setOrientation(orientation);
          this.renderer.setPosition(position);

          // Show ray and reticle.
          this.renderer.setRayVisibility(true);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        default:
          console.error('Unknown interaction mode.');
      }
      this.renderer.update();
      this.controller.update();
    }
  }, {
    key: 'setSize',
    value: function setSize(size) {
      this.controller.setSize(size);
    }
  }, {
    key: 'setOffset',
    value: function setOffset(offset) {
      this.controller.setOffset(offset);
    }
  }, {
    key: 'getMesh',
    value: function getMesh() {
      return this.renderer.getReticleRayMesh();
    }
  }, {
    key: 'getOrigin',
    value: function getOrigin() {
      return this.renderer.getOrigin();
    }
  }, {
    key: 'getDirection',
    value: function getDirection() {
      return this.renderer.getDirection();
    }
  }, {
    key: 'getRightDirection',
    value: function getRightDirection() {
      var lookAt = new THREE.Vector3(0, 0, -1);
      lookAt.applyQuaternion(this.camera.quaternion);
      return new THREE.Vector3().crossVectors(lookAt, this.camera.up);
    }
  }, {
    key: 'onRayDown_',
    value: function onRayDown_(e) {
      //console.log('onRayDown_');

      // Force the renderer to raycast.
      this.renderer.update();
      var mesh = this.renderer.getSelectedMesh();
      this.emit('raydown', mesh);

      this.renderer.setActive(true);
    }
  }, {
    key: 'onRayUp_',
    value: function onRayUp_(e) {
      //console.log('onRayUp_');
      var mesh = this.renderer.getSelectedMesh();
      this.emit('rayup', mesh);

      this.renderer.setActive(false);
    }
  }, {
    key: 'onRayCancel_',
    value: function onRayCancel_(e) {
      //console.log('onRayCancel_');
      var mesh = this.renderer.getSelectedMesh();
      this.emit('raycancel', mesh);
    }
  }, {
    key: 'onPointerMove_',
    value: function onPointerMove_(ndc) {
      this.pointerNdc.copy(ndc);
    }
  }]);

  return RayInput;
}(_eventemitter2.default);

exports.default = RayInput;

},{"./orientation-arm-model":7,"./ray-controller":8,"./ray-interaction-modes":10,"./ray-renderer":11,"eventemitter3":1}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var InteractionModes = {
  MOUSE: 1,
  TOUCH: 2,
  VR_0DOF: 3,
  VR_3DOF: 4,
  VR_6DOF: 5
};

exports.default = InteractionModes;

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require('./util');

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var glslify = require('glslify');

var RETICLE_DISTANCE = 1;
var INNER_RADIUS = 0.01;
var OUTER_RADIUS = 0.02;
var RAY_RADIUS = 0.002;
/**
 * Handles ray input selection from frame of reference of an arbitrary object.
 *
 * The source of the ray is from various locations:
 *
 * Desktop: mouse.
 * Magic window: touch.
 * Cardboard: camera.
 * Daydream: 3DOF controller via gamepad (and show ray).
 * Vive: 6DOF controller via gamepad (and show ray).
 *
 * Emits selection events:
 *     rayover(mesh): This mesh was selected.
 *     rayout(mesh): This mesh was unselected.
 */

var RayRenderer = function (_EventEmitter) {
  _inherits(RayRenderer, _EventEmitter);

  function RayRenderer(camera, opt_params) {
    _classCallCheck(this, RayRenderer);

    var _this = _possibleConstructorReturn(this, (RayRenderer.__proto__ || Object.getPrototypeOf(RayRenderer)).call(this));

    _this.camera = camera;

    var params = opt_params || {};

    // Which objects are interactive (keyed on id).
    _this.meshes = {};

    // Which objects are currently selected (keyed on id).
    _this.selected = {};

    // The raycaster.
    _this.raycaster = new THREE.Raycaster();

    // Position and orientation, in addition.
    _this.position = new THREE.Vector3();
    _this.orientation = new THREE.Quaternion();

    _this.root = new THREE.Object3D();

    // Add the reticle mesh to the root of the object.
    _this.reticle = _this.createReticle_();
    _this.root.add(_this.reticle);

    // Add the ray to the root of the object.
    _this.ray = _this.createRay_();
    _this.root.add(_this.ray);

    // How far the reticle is currently from the reticle origin.
    _this.reticleDistance = RETICLE_DISTANCE;
    return _this;
  }

  /**
   * Register an object so that it can be interacted with.
   */


  _createClass(RayRenderer, [{
    key: 'add',
    value: function add(object) {
      this.meshes[object.id] = object;
    }

    /**
     * Prevent an object from being interacted with.
     */

  }, {
    key: 'remove',
    value: function remove(object) {
      var id = object.id;
      if (this.meshes[id]) {
        // If there's no existing mesh, we can't remove it.
        delete this.meshes[id];
      }
      // If the object is currently selected, remove it.
      if (this.selected[id]) {
        delete this.selected[object.id];
      }
    }
  }, {
    key: 'update',
    value: function update() {
      // Do the raycasting and issue various events as needed.
      for (var id in this.meshes) {
        var mesh = this.meshes[id];
        var intersects = this.raycaster.intersectObject(mesh, true);
        if (intersects.length > 1) {
          // console.warn('Unexpected: multiple meshes intersected.');
        }
        var isIntersected = intersects.length > 0;
        var isSelected = this.selected[id];

        // If it's newly selected, send rayover.
        if (isIntersected && !isSelected) {
          this.selected[id] = true;
          if (this.isActive) {
            this.emit('rayover', mesh);
          }
        }

        // If it's no longer intersected, send rayout.
        if (!isIntersected && isSelected) {
          delete this.selected[id];
          this.moveReticle_(null);
          if (this.isActive) {
            this.emit('rayout', mesh);
          }
        }

        if (isIntersected) {
          this.moveReticle_(intersects);
        }
      }
    }

    /**
     * Sets the origin of the ray.
     * @param {Vector} vector Position of the origin of the picking ray.
     */

  }, {
    key: 'setPosition',
    value: function setPosition(vector) {
      this.position.copy(vector);
      this.raycaster.ray.origin.copy(vector);
      this.updateRaycaster_();
    }
  }, {
    key: 'getOrigin',
    value: function getOrigin() {
      return this.raycaster.ray.origin;
    }

    /**
     * Sets the direction of the ray.
     * @param {Vector} vector Unit vector corresponding to direction.
     */

  }, {
    key: 'setOrientation',
    value: function setOrientation(quaternion) {
      this.orientation.copy(quaternion);

      var pointAt = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
      this.raycaster.ray.direction.copy(pointAt);
      this.updateRaycaster_();
    }
  }, {
    key: 'getDirection',
    value: function getDirection() {
      return this.raycaster.ray.direction;
    }

    /**
     * Sets the pointer on the screen for camera + pointer based picking. This
     * superscedes origin and direction.
     *
     * @param {Vector2} vector The position of the pointer (screen coords).
     */

  }, {
    key: 'setPointer',
    value: function setPointer(vector) {
      this.raycaster.setFromCamera(vector, this.camera);
      this.updateRaycaster_();
    }

    /**
     * Gets the mesh, which includes reticle and/or ray. This mesh is then added
     * to the scene.
     */

  }, {
    key: 'getReticleRayMesh',
    value: function getReticleRayMesh() {
      return this.root;
    }

    /**
     * Gets the currently selected object in the scene.
     */

  }, {
    key: 'getSelectedMesh',
    value: function getSelectedMesh() {
      var count = 0;
      var mesh = null;
      for (var id in this.selected) {
        count += 1;
        mesh = this.meshes[id];
      }
      if (count > 1) {
        console.warn('More than one mesh selected.');
      }
      return mesh;
    }

    /**
     * Hides and shows the reticle.
     */

  }, {
    key: 'setReticleVisibility',
    value: function setReticleVisibility(isVisible) {
      this.reticle.visible = isVisible;
    }

    /**
     * Enables or disables the raycasting ray which gradually fades out from
     * the origin.
     */

  }, {
    key: 'setRayVisibility',
    value: function setRayVisibility(isVisible) {
      this.ray.visible = isVisible;
    }

    /**
     * Enables and disables the raycaster. For touch, where finger up means we
     * shouldn't be raycasting.
     */

  }, {
    key: 'setActive',
    value: function setActive(isActive) {
      // If nothing changed, do nothing.
      if (this.isActive == isActive) {
        return;
      }
      // TODO(smus): Show the ray or reticle adjust in response.
      this.isActive = isActive;

      if (!isActive) {
        this.moveReticle_(null);
        for (var id in this.selected) {
          var mesh = this.meshes[id];
          delete this.selected[id];
          this.emit('rayout', mesh);
        }
      }
    }
  }, {
    key: 'updateRaycaster_',
    value: function updateRaycaster_() {
      var ray = this.raycaster.ray;

      // Position the reticle at a distance, as calculated from the origin and
      // direction.
      var position = this.reticle.position;
      position.copy(ray.direction);
      position.multiplyScalar(this.reticleDistance);
      position.add(ray.origin);

      // Set position and orientation of the ray so that it goes from origin to
      // reticle.
      var delta = new THREE.Vector3().copy(ray.direction);
      delta.multiplyScalar(this.reticleDistance);
      this.ray.scale.y = delta.length();
      var arrow = new THREE.ArrowHelper(ray.direction, ray.origin);
      this.ray.rotation.copy(arrow.rotation);
      this.ray.position.addVectors(ray.origin, delta.multiplyScalar(0.5));
    }

    /**
     * Creates the geometry of the reticle.
     */

  }, {
    key: 'createReticle_',
    value: function createReticle_() {
      // Create a spherical reticle.
      var innerGeometry = new THREE.SphereGeometry(INNER_RADIUS, 32, 32);
      var innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      var inner = new THREE.Mesh(innerGeometry, innerMaterial);

      var outerGeometry = new THREE.SphereGeometry(OUTER_RADIUS, 32, 32);
      var outerMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.3
      });
      var outer = new THREE.Mesh(outerGeometry, outerMaterial);

      var reticle = new THREE.Group();
      reticle.add(inner);
      reticle.add(outer);
      return reticle;
    }

    /**
     * Moves the reticle to a position so that it's just in front of the mesh that
     * it intersected with.
     */

  }, {
    key: 'moveReticle_',
    value: function moveReticle_(intersections) {
      // If no intersection, return the reticle to the default position.
      var distance = RETICLE_DISTANCE;
      if (intersections) {
        // Otherwise, determine the correct distance.
        var inter = intersections[0];
        distance = inter.distance;
      }

      this.reticleDistance = distance;
      this.updateRaycaster_();
      return;
    }
  }, {
    key: 'createRay_',
    value: function createRay_() {
      // Create a cylindrical ray.
      var geometry = new THREE.CylinderGeometry(RAY_RADIUS, RAY_RADIUS, 1, 32, 8, true);
      var material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          color: { type: 'c', value: new THREE.Color(0xffffff) }
        },
        vertexShader: glslify(["#define GLSLIFY 1\nvarying float gradient;\n\n//  Function from Iñigo Quiles\n//  www.iquilezles.org/www/articles/functions/functions.htm\nfloat parabola( float x, float k ){\n    return pow( 4.0*x*(1.0-x), k );\n}\n\nfloat cubicPulse( float c, float w, float x ){\n    x = abs(x - c);\n    if( x>w ) return 0.0;\n    x /= w;\n    return 1.0 - x*x*(3.0-2.0*x);\n}\n\nfloat pcurve( float x, float a, float b ){\n    float k = pow(a+b,a+b) / (pow(a,a)*pow(b,b));\n    return k * pow( x, a ) * pow( 1.0-x, b );\n}\n\nvoid main(void) {\n\n\tvec2 vUv = uv;\n\t// gradient = cubicPulse(0.25,0.2,vUv.y);\n    gradient = pcurve(vUv.y,6.0,12.0);\n\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n}\n"]),
        fragmentShader: glslify(["#define GLSLIFY 1\nuniform vec3 color;\n\nvarying float gradient;\n\nvoid main()\n{\n\n\tgl_FragColor = vec4(color, gradient);\n\n}\n"])
      });
      var mesh = new THREE.Mesh(geometry, material);
      return mesh;
    }
  }]);

  return RayRenderer;
}(_eventemitter2.default);

exports.default = RayRenderer;

},{"./util":12,"eventemitter3":1,"glslify":2}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isMobile = isMobile;
exports.base64 = base64;
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function isMobile() {
  var check = false;
  (function (a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

function base64(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
}

},{}]},{},[5])(5)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsc2xpZnkvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1ib2lsZXJwbGF0ZS9idWlsZC93ZWJ2ci1tYW5hZ2VyLmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL2J1aWxkL3dlYnZyLXBvbHlmaWxsLmpzIiwic3JjL2V4YW1wbGUvbWFpbi5qcyIsInNyYy9leGFtcGxlL3JlbmRlcmVyLmpzIiwic3JjL29yaWVudGF0aW9uLWFybS1tb2RlbC5qcyIsInNyYy9yYXktY29udHJvbGxlci5qcyIsInNyYy9yYXktaW5wdXQuanMiLCJzcmMvcmF5LWludGVyYWN0aW9uLW1vZGVzLmpzIiwic3JjL3JheS1yZW5kZXJlci5qcyIsInNyYy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM5akJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDeHBNQTs7Ozs7O0FBRUEsSUFBSSxpQkFBSixDLENBakJBOzs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsSUFBSSxrQkFBSjs7QUFFQSxTQUFTLE1BQVQsR0FBa0I7QUFDaEIsYUFBVyx3QkFBWDs7QUFFQSxTQUFPLGdCQUFQLENBQXdCLFFBQXhCLEVBQWtDLFlBQU07QUFBRSxhQUFTLE1BQVQ7QUFBbUIsR0FBN0Q7O0FBRUEsWUFBVSxhQUFWLEdBQTBCLElBQTFCLENBQStCLFVBQVMsUUFBVCxFQUFtQjtBQUNoRCxRQUFJLFNBQVMsTUFBVCxHQUFrQixDQUF0QixFQUF5QjtBQUN2QixrQkFBWSxTQUFTLENBQVQsQ0FBWjtBQUNBLGdCQUFVLHFCQUFWLENBQWdDLE1BQWhDO0FBQ0Q7QUFDRixHQUxEO0FBTUQ7O0FBRUQsU0FBUyxNQUFULEdBQWtCO0FBQ2hCLFdBQVMsTUFBVDs7QUFFQSxZQUFVLHFCQUFWLENBQWdDLE1BQWhDO0FBQ0Q7O0FBRUQsT0FBTyxnQkFBUCxDQUF3QixNQUF4QixFQUFnQyxNQUFoQzs7Ozs7Ozs7O3FqQkN2Q0E7Ozs7Ozs7Ozs7Ozs7OztBQWVBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7QUFFQSxJQUFNLFFBQVEsQ0FBZDtBQUNBLElBQU0sU0FBUyxDQUFmO0FBQ0EsSUFBTSxnQkFBZ0IsSUFBSSxNQUFNLEtBQVYsQ0FBZ0IsUUFBaEIsQ0FBdEI7QUFDQSxJQUFNLGtCQUFrQixJQUFJLE1BQU0sS0FBVixDQUFnQixRQUFoQixDQUF4QjtBQUNBLElBQU0sZUFBZSxJQUFJLE1BQU0sS0FBVixDQUFnQixRQUFoQixDQUFyQjs7QUFFQTs7OztJQUdxQixZO0FBRW5CLDBCQUFjO0FBQUE7O0FBQUE7O0FBQ1osUUFBSSxRQUFRLElBQUksTUFBTSxLQUFWLEVBQVo7O0FBRUEsUUFBSSxTQUFTLE9BQU8sVUFBUCxHQUFvQixPQUFPLFdBQXhDO0FBQ0EsUUFBSSxTQUFTLElBQUksTUFBTSxpQkFBVixDQUE0QixFQUE1QixFQUFnQyxNQUFoQyxFQUF3QyxHQUF4QyxFQUE2QyxHQUE3QyxDQUFiO0FBQ0EsVUFBTSxHQUFOLENBQVUsTUFBVjs7QUFFQSxRQUFJLFdBQVcsSUFBSSxNQUFNLGFBQVYsRUFBZjtBQUNBLGFBQVMsT0FBVCxDQUFpQixPQUFPLFVBQXhCLEVBQW9DLE9BQU8sV0FBM0M7O0FBRUEsUUFBSSxTQUFTLElBQUksTUFBTSxRQUFWLENBQW1CLFFBQW5CLENBQWI7QUFDQSxRQUFJLFdBQVcsSUFBSSxNQUFNLFVBQVYsQ0FBcUIsTUFBckIsQ0FBZjtBQUNBLGFBQVMsUUFBVCxHQUFvQixJQUFwQjs7QUFFQSxRQUFJLFVBQVUsK0JBQWlCLFFBQWpCLEVBQTJCLE1BQTNCLENBQWQ7QUFDQSxhQUFTLElBQVQsQ0FBYyxXQUFkLENBQTBCLFNBQVMsVUFBbkM7O0FBRUE7QUFDQSxRQUFJLFdBQVcsdUJBQWEsTUFBYixDQUFmO0FBQ0EsYUFBUyxPQUFULENBQWlCLFNBQVMsT0FBVCxFQUFqQjtBQUNBLGFBQVMsRUFBVCxDQUFZLFNBQVosRUFBdUIsVUFBQyxRQUFELEVBQWM7QUFBRSxZQUFLLGNBQUwsQ0FBb0IsUUFBcEI7QUFBK0IsS0FBdEU7QUFDQSxhQUFTLEVBQVQsQ0FBWSxPQUFaLEVBQXFCLFVBQUMsUUFBRCxFQUFjO0FBQUUsWUFBSyxZQUFMLENBQWtCLFFBQWxCO0FBQTZCLEtBQWxFO0FBQ0EsYUFBUyxFQUFULENBQVksV0FBWixFQUF5QixVQUFDLFFBQUQsRUFBYztBQUFFLFlBQUssZ0JBQUwsQ0FBc0IsUUFBdEI7QUFBaUMsS0FBMUU7QUFDQSxhQUFTLEVBQVQsQ0FBWSxTQUFaLEVBQXVCLFVBQUMsSUFBRCxFQUFVO0FBQUUsWUFBSyxZQUFMLENBQWtCLElBQWxCLEVBQXdCLElBQXhCO0FBQStCLEtBQWxFO0FBQ0EsYUFBUyxFQUFULENBQVksUUFBWixFQUFzQixVQUFDLElBQUQsRUFBVTtBQUFFLFlBQUssWUFBTCxDQUFrQixJQUFsQixFQUF3QixLQUF4QjtBQUFnQyxLQUFsRTs7QUFFQTtBQUNBLFVBQU0sR0FBTixDQUFVLFNBQVMsT0FBVCxFQUFWOztBQUVBLFNBQUssT0FBTCxHQUFlLE9BQWY7QUFDQSxTQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0EsU0FBSyxLQUFMLEdBQWEsS0FBYjtBQUNBLFNBQUssUUFBTCxHQUFnQixRQUFoQjtBQUNBLFNBQUssUUFBTCxHQUFnQixRQUFoQjtBQUNBLFNBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsUUFBaEI7O0FBRUE7QUFDQSxRQUFJLE9BQU8sS0FBSyxXQUFMLEVBQVg7QUFDQSxVQUFNLEdBQU4sQ0FBVSxJQUFWOztBQUVBO0FBQ0EsUUFBSSxRQUFRLEtBQUssWUFBTCxFQUFaO0FBQ0EsVUFBTSxHQUFOLENBQVUsS0FBVjs7QUFFQSxTQUFLLFFBQUwsQ0FBYyxPQUFkLENBQXNCLFVBQVMsUUFBVCxFQUFtQjtBQUN2QztBQUNBLGVBQVMsR0FBVCxDQUFhLFFBQWI7QUFDRCxLQUhEO0FBSUQ7Ozs7NkJBR1E7QUFDUCxXQUFLLFFBQUwsQ0FBYyxNQUFkO0FBQ0EsV0FBSyxRQUFMLENBQWMsTUFBZDtBQUNBLFdBQUssTUFBTCxDQUFZLE1BQVosQ0FBbUIsS0FBSyxLQUF4QixFQUErQixLQUFLLE1BQXBDO0FBQ0Q7Ozs2QkFFUTtBQUNQLFdBQUssTUFBTCxDQUFZLE1BQVosR0FBcUIsT0FBTyxVQUFQLEdBQW9CLE9BQU8sV0FBaEQ7QUFDQSxXQUFLLE1BQUwsQ0FBWSxzQkFBWjtBQUNBLFdBQUssUUFBTCxDQUFjLE9BQWQsQ0FBc0IsT0FBTyxVQUE3QixFQUF5QyxPQUFPLFdBQWhEO0FBQ0EsV0FBSyxRQUFMLENBQWMsT0FBZCxDQUFzQixLQUFLLFFBQUwsQ0FBYyxPQUFkLEVBQXRCO0FBQ0Q7OzttQ0FFYyxRLEVBQVU7QUFDdkIsV0FBSyxVQUFMLENBQWdCLFFBQWhCLEVBQTBCLElBQTFCO0FBQ0Q7OztpQ0FFWSxRLEVBQVU7QUFDckIsV0FBSyxVQUFMLENBQWdCLFFBQWhCLEVBQTBCLEtBQTFCO0FBQ0Q7OztxQ0FFZ0IsUSxFQUFVO0FBQ3pCLFdBQUssVUFBTCxDQUFnQixRQUFoQixFQUEwQixLQUExQjtBQUNEOzs7aUNBRVksSSxFQUFNLFUsRUFBWTtBQUM3QjtBQUNBLFVBQUksV0FBVyxhQUFhLGVBQWIsR0FBK0IsYUFBOUM7QUFDQSxXQUFLLFFBQUwsQ0FBYyxLQUFkLEdBQXNCLFFBQXRCO0FBQ0Q7OzsrQkFFVSxRLEVBQVUsUSxFQUFVO0FBQzdCO0FBQ0EsVUFBSSxRQUFKLEVBQWM7QUFDWixZQUFJLFdBQVcsV0FBVyxZQUFYLEdBQTBCLGVBQXpDO0FBQ0EsaUJBQVMsUUFBVCxDQUFrQixLQUFsQixHQUEwQixRQUExQjtBQUNBLFlBQUksQ0FBQyxRQUFMLEVBQWU7QUFDYixtQkFBUyxRQUFULENBQWtCLFNBQWxCLEdBQThCLENBQUMsU0FBUyxRQUFULENBQWtCLFNBQWpEO0FBQ0Q7QUFDRjtBQUNGOzs7a0NBRWE7QUFDWixVQUFJLE9BQU8sSUFBSSxNQUFNLFFBQVYsRUFBWDs7QUFFQTtBQUNBLFdBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFwQixFQUEyQixHQUEzQixFQUFnQztBQUM5QixhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksTUFBcEIsRUFBNEIsR0FBNUIsRUFBaUM7QUFDL0IsY0FBSSxPQUFPLEtBQUssZUFBTCxFQUFYO0FBQ0EsZUFBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixDQUFsQixFQUFxQixDQUFyQixFQUF3QixDQUF4QjtBQUNBLGVBQUssS0FBTCxDQUFXLEdBQVgsQ0FBZSxHQUFmLEVBQW9CLEdBQXBCLEVBQXlCLEdBQXpCO0FBQ0EsZUFBSyxHQUFMLENBQVMsSUFBVDtBQUNEO0FBQ0Y7O0FBRUQsV0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixDQUFDLEtBQUQsR0FBTyxDQUF6QixFQUE0QixTQUFPLENBQW5DLEVBQXNDLENBQUMsQ0FBdkM7QUFDQSxhQUFPLElBQVA7QUFDRDs7O3NDQUVpQjtBQUNoQixVQUFJLFdBQVcsSUFBSSxNQUFNLFdBQVYsQ0FBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsQ0FBZjtBQUNBLFVBQUksV0FBVyxJQUFJLE1BQU0saUJBQVYsQ0FBNEIsRUFBQyxPQUFPLGFBQVIsRUFBNUIsQ0FBZjtBQUNBLFVBQUksT0FBTyxJQUFJLE1BQU0sSUFBVixDQUFlLFFBQWYsRUFBeUIsUUFBekIsQ0FBWDs7QUFFQSxhQUFPLElBQVA7QUFDRDs7O21DQUVjO0FBQ2IsVUFBSSxVQUFVLEVBQWQ7QUFDQSxVQUFJLFNBQVMsSUFBSSxNQUFNLGFBQVYsRUFBYjtBQUNBLGFBQU8sSUFBUCxDQUFZLGFBQVosRUFBMkIsZUFBM0I7QUFDQSxVQUFJLE1BQU0sSUFBSSxNQUFNLFFBQVYsRUFBVjs7QUFFQSxlQUFTLGVBQVQsQ0FBeUIsT0FBekIsRUFBa0M7QUFDaEMsZ0JBQVEsS0FBUixHQUFnQixNQUFNLGNBQXRCO0FBQ0EsZ0JBQVEsS0FBUixHQUFnQixNQUFNLGNBQXRCO0FBQ0EsZ0JBQVEsTUFBUixDQUFlLEdBQWYsQ0FBbUIsT0FBbkIsRUFBNEIsT0FBNUI7O0FBRUEsWUFBSSxXQUFXLElBQUksTUFBTSxXQUFWLENBQXNCLE9BQXRCLEVBQStCLE9BQS9CLEVBQXdDLE9BQXhDLENBQWY7QUFDQSxZQUFJLFdBQVcsSUFBSSxNQUFNLGlCQUFWLENBQTRCO0FBQ3pDLGVBQUssT0FEb0M7QUFFekMsaUJBQU8sUUFGa0M7QUFHekMsZ0JBQU0sTUFBTTtBQUg2QixTQUE1QixDQUFmOztBQU1BO0FBQ0EsWUFBSSxTQUFTLElBQUksTUFBTSxJQUFWLENBQWUsUUFBZixFQUF5QixRQUF6QixDQUFiO0FBQ0EsZUFBTyxRQUFQLENBQWdCLENBQWhCLEdBQW9CLFVBQVEsQ0FBNUI7O0FBRUEsWUFBSSxHQUFKLENBQVEsTUFBUjtBQUNEO0FBQ0QsYUFBTyxHQUFQO0FBQ0Q7Ozs7OztrQkFsSmtCLFk7Ozs7Ozs7Ozs7Ozs7QUM1QnJCOzs7Ozs7Ozs7Ozs7Ozs7QUFlQSxJQUFNLGdDQUFnQyxJQUFJLE1BQU0sT0FBVixDQUFrQixLQUFsQixFQUF5QixDQUFDLEtBQTFCLEVBQWlDLENBQUMsSUFBbEMsQ0FBdEM7QUFDQSxJQUFNLCtCQUErQixJQUFJLE1BQU0sT0FBVixDQUFrQixDQUFDLEtBQW5CLEVBQTBCLENBQUMsS0FBM0IsRUFBa0MsQ0FBQyxJQUFuQyxDQUFyQztBQUNBLElBQUksb0JBQW9CLDZCQUF4QjtBQUNBLElBQU0scUJBQXFCLElBQUksTUFBTSxPQUFWLENBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLENBQUMsSUFBekIsQ0FBM0I7QUFDQSxJQUFNLDBCQUEwQixJQUFJLE1BQU0sT0FBVixDQUFrQixDQUFsQixFQUFxQixDQUFyQixFQUF3QixJQUF4QixDQUFoQztBQUNBLElBQU0sdUJBQXVCLElBQUksTUFBTSxPQUFWLENBQWtCLENBQUMsSUFBbkIsRUFBeUIsSUFBekIsRUFBK0IsSUFBL0IsQ0FBN0I7O0FBRUEsSUFBTSxtQkFBbUIsR0FBekIsQyxDQUE4QjtBQUM5QixJQUFNLHlCQUF5QixHQUEvQjs7QUFFQSxJQUFNLG9CQUFvQixJQUExQixDLENBQWdDOztBQUVoQzs7Ozs7OztJQU1xQixtQjtBQUNuQixpQ0FBYztBQUFBOztBQUNaLFNBQUssWUFBTCxHQUFvQixLQUFwQjs7QUFFQTtBQUNBLFNBQUssV0FBTCxHQUFtQixJQUFJLE1BQU0sVUFBVixFQUFuQjtBQUNBLFNBQUssZUFBTCxHQUF1QixJQUFJLE1BQU0sVUFBVixFQUF2Qjs7QUFFQTtBQUNBLFNBQUssS0FBTCxHQUFhLElBQUksTUFBTSxVQUFWLEVBQWI7O0FBRUE7QUFDQSxTQUFLLE9BQUwsR0FBZSxJQUFJLE1BQU0sT0FBVixFQUFmOztBQUVBO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLElBQUksTUFBTSxPQUFWLEVBQWhCO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLElBQUksTUFBTSxPQUFWLEVBQWhCOztBQUVBO0FBQ0EsU0FBSyxJQUFMLEdBQVksSUFBWjtBQUNBLFNBQUssUUFBTCxHQUFnQixJQUFoQjs7QUFFQTtBQUNBLFNBQUssS0FBTCxHQUFhLElBQUksTUFBTSxVQUFWLEVBQWI7O0FBRUE7QUFDQSxTQUFLLElBQUwsR0FBWTtBQUNWLG1CQUFhLElBQUksTUFBTSxVQUFWLEVBREg7QUFFVixnQkFBVSxJQUFJLE1BQU0sT0FBVjtBQUZBLEtBQVo7QUFJRDs7QUFFRDs7Ozs7Ozs2Q0FHeUIsVSxFQUFZO0FBQ25DLFdBQUssZUFBTCxDQUFxQixJQUFyQixDQUEwQixLQUFLLFdBQS9CO0FBQ0EsV0FBSyxXQUFMLENBQWlCLElBQWpCLENBQXNCLFVBQXRCO0FBQ0Q7Ozt1Q0FFa0IsVSxFQUFZO0FBQzdCLFdBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsVUFBaEI7QUFDRDs7O29DQUVlLFEsRUFBVTtBQUN4QixXQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLFFBQWxCO0FBQ0Q7OztrQ0FFYSxZLEVBQWM7QUFDMUIsV0FBSyxZQUFMLEdBQW9CLFlBQXBCO0FBQ0EsVUFBRyxZQUFILEVBQWdCO0FBQ2QsNEJBQW9CLDRCQUFwQjtBQUNELE9BRkQsTUFFSztBQUNILDRCQUFvQiw2QkFBcEI7QUFDRDtBQUNGOztBQUVEOzs7Ozs7NkJBR1M7QUFDUCxXQUFLLElBQUwsR0FBWSxZQUFZLEdBQVosRUFBWjs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxVQUFJLFdBQVcsS0FBSyxzQkFBTCxFQUFmO0FBQ0EsVUFBSSxZQUFZLENBQUMsS0FBSyxJQUFMLEdBQVksS0FBSyxRQUFsQixJQUE4QixJQUE5QztBQUNBLFVBQUksYUFBYSxLQUFLLFVBQUwsQ0FBZ0IsS0FBSyxlQUFyQixFQUFzQyxLQUFLLFdBQTNDLENBQWpCO0FBQ0EsVUFBSSx5QkFBeUIsYUFBYSxTQUExQztBQUNBLFVBQUkseUJBQXlCLGlCQUE3QixFQUFnRDtBQUM5QztBQUNBLGFBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsUUFBakIsRUFBMkIsYUFBYSxFQUF4QztBQUNELE9BSEQsTUFHTztBQUNMLGFBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsUUFBaEI7QUFDRDs7QUFFRDtBQUNBO0FBQ0E7QUFDQSxVQUFJLGtCQUFrQixJQUFJLE1BQU0sS0FBVixHQUFrQixpQkFBbEIsQ0FBb0MsS0FBSyxXQUF6QyxFQUFzRCxLQUF0RCxDQUF0QjtBQUNBLFVBQUksaUJBQWlCLE1BQU0sSUFBTixDQUFXLFFBQVgsQ0FBb0IsZ0JBQWdCLENBQXBDLENBQXJCO0FBQ0EsVUFBSSxpQkFBaUIsS0FBSyxNQUFMLENBQVksQ0FBQyxpQkFBaUIsRUFBbEIsS0FBeUIsS0FBSyxFQUE5QixDQUFaLEVBQStDLENBQS9DLEVBQWtELENBQWxELENBQXJCOztBQUVBO0FBQ0EsVUFBSSxvQkFBb0IsS0FBSyxLQUFMLENBQVcsS0FBWCxHQUFtQixPQUFuQixFQUF4QjtBQUNBLHdCQUFrQixRQUFsQixDQUEyQixLQUFLLFdBQWhDOztBQUVBO0FBQ0EsVUFBSSxXQUFXLEtBQUssUUFBcEI7QUFDQSxlQUFTLElBQVQsQ0FBYyxLQUFLLE9BQW5CLEVBQTRCLEdBQTVCLENBQWdDLGlCQUFoQztBQUNBLFVBQUksY0FBYyxJQUFJLE1BQU0sT0FBVixHQUFvQixJQUFwQixDQUF5QixvQkFBekIsQ0FBbEI7QUFDQSxrQkFBWSxjQUFaLENBQTJCLGNBQTNCO0FBQ0EsZUFBUyxHQUFULENBQWEsV0FBYjs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxVQUFJLGFBQWEsS0FBSyxVQUFMLENBQWdCLGlCQUFoQixFQUFtQyxJQUFJLE1BQU0sVUFBVixFQUFuQyxDQUFqQjtBQUNBLFVBQUksZ0JBQWdCLE1BQU0sSUFBTixDQUFXLFFBQVgsQ0FBb0IsVUFBcEIsQ0FBcEI7QUFDQSxVQUFJLGtCQUFrQixJQUFJLEtBQUssR0FBTCxDQUFTLGdCQUFnQixHQUF6QixFQUE4QixDQUE5QixDQUExQixDQXhDTyxDQXdDcUQ7O0FBRTVELFVBQUksYUFBYSxnQkFBakI7QUFDQSxVQUFJLGFBQWEsSUFBSSxnQkFBckI7QUFDQSxVQUFJLFlBQVksbUJBQ1gsYUFBYSxhQUFhLGNBQWIsR0FBOEIsc0JBRGhDLENBQWhCOztBQUdBLFVBQUksU0FBUyxJQUFJLE1BQU0sVUFBVixHQUF1QixLQUF2QixDQUE2QixpQkFBN0IsRUFBZ0QsU0FBaEQsQ0FBYjtBQUNBLFVBQUksWUFBWSxPQUFPLE9BQVAsRUFBaEI7QUFDQSxVQUFJLFNBQVMsa0JBQWtCLEtBQWxCLEdBQTBCLFFBQTFCLENBQW1DLFNBQW5DLENBQWI7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7OztBQVFBLFVBQUksV0FBVyxLQUFLLFFBQXBCO0FBQ0EsZUFBUyxJQUFULENBQWMsdUJBQWQ7QUFDQSxlQUFTLGVBQVQsQ0FBeUIsTUFBekI7QUFDQSxlQUFTLEdBQVQsQ0FBYSxrQkFBYjtBQUNBLGVBQVMsZUFBVCxDQUF5QixNQUF6QjtBQUNBLGVBQVMsR0FBVCxDQUFhLEtBQUssUUFBbEI7O0FBRUEsVUFBSSxTQUFTLElBQUksTUFBTSxPQUFWLEdBQW9CLElBQXBCLENBQXlCLG9CQUF6QixDQUFiO0FBQ0EsYUFBTyxjQUFQLENBQXNCLGNBQXRCOztBQUVBLFVBQUksV0FBVyxJQUFJLE1BQU0sT0FBVixHQUFvQixJQUFwQixDQUF5QixLQUFLLFFBQTlCLENBQWY7QUFDQSxlQUFTLEdBQVQsQ0FBYSxNQUFiO0FBQ0EsZUFBUyxlQUFULENBQXlCLEtBQUssS0FBOUI7O0FBRUEsVUFBSSxjQUFjLElBQUksTUFBTSxVQUFWLEdBQXVCLElBQXZCLENBQTRCLEtBQUssV0FBakMsQ0FBbEI7O0FBRUE7QUFDQSxXQUFLLElBQUwsQ0FBVSxXQUFWLENBQXNCLElBQXRCLENBQTJCLFdBQTNCO0FBQ0EsV0FBSyxJQUFMLENBQVUsUUFBVixDQUFtQixJQUFuQixDQUF3QixRQUF4Qjs7QUFFQSxXQUFLLFFBQUwsR0FBZ0IsS0FBSyxJQUFyQjtBQUNEOztBQUVEOzs7Ozs7OEJBR1U7QUFDUixhQUFPLEtBQUssSUFBWjtBQUNEOztBQUVEOzs7Ozs7dUNBR21CO0FBQ2pCLGFBQU8sbUJBQW1CLE1BQW5CLEVBQVA7QUFDRDs7O3VDQUVrQjtBQUNqQixVQUFJLE1BQU0sS0FBSyxRQUFMLENBQWMsS0FBZCxFQUFWO0FBQ0EsYUFBTyxJQUFJLGVBQUosQ0FBb0IsS0FBSyxLQUF6QixDQUFQO0FBQ0Q7Ozt1Q0FFa0I7QUFDakIsVUFBSSxNQUFNLEtBQUssUUFBTCxDQUFjLEtBQWQsRUFBVjtBQUNBLGFBQU8sSUFBSSxlQUFKLENBQW9CLEtBQUssS0FBekIsQ0FBUDtBQUNEOzs7NkNBRXdCO0FBQ3ZCLFVBQUksWUFBWSxJQUFJLE1BQU0sS0FBVixHQUFrQixpQkFBbEIsQ0FBb0MsS0FBSyxLQUF6QyxFQUFnRCxLQUFoRCxDQUFoQjtBQUNBLGdCQUFVLENBQVYsR0FBYyxDQUFkO0FBQ0EsZ0JBQVUsQ0FBVixHQUFjLENBQWQ7QUFDQSxVQUFJLGVBQWUsSUFBSSxNQUFNLFVBQVYsR0FBdUIsWUFBdkIsQ0FBb0MsU0FBcEMsQ0FBbkI7QUFDQSxhQUFPLFlBQVA7QUFDRDs7OzJCQUVNLEssRUFBTyxHLEVBQUssRyxFQUFLO0FBQ3RCLGFBQU8sS0FBSyxHQUFMLENBQVMsS0FBSyxHQUFMLENBQVMsS0FBVCxFQUFnQixHQUFoQixDQUFULEVBQStCLEdBQS9CLENBQVA7QUFDRDs7OytCQUVVLEUsRUFBSSxFLEVBQUk7QUFDakIsVUFBSSxPQUFPLElBQUksTUFBTSxPQUFWLENBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLENBQUMsQ0FBekIsQ0FBWDtBQUNBLFVBQUksT0FBTyxJQUFJLE1BQU0sT0FBVixDQUFrQixDQUFsQixFQUFxQixDQUFyQixFQUF3QixDQUFDLENBQXpCLENBQVg7QUFDQSxXQUFLLGVBQUwsQ0FBcUIsRUFBckI7QUFDQSxXQUFLLGVBQUwsQ0FBcUIsRUFBckI7QUFDQSxhQUFPLEtBQUssT0FBTCxDQUFhLElBQWIsQ0FBUDtBQUNEOzs7Ozs7a0JBMUxrQixtQjs7Ozs7Ozs7Ozs7QUNsQnJCOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7K2VBakJBOzs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsSUFBTSxtQkFBbUIsRUFBekI7O0FBRUE7Ozs7Ozs7Ozs7Ozs7O0lBYXFCLGE7OztBQUNuQix5QkFBWSxNQUFaLEVBQW9CO0FBQUE7O0FBQUE7O0FBRWxCLFFBQUksS0FBSyxVQUFVLE1BQW5COztBQUVBO0FBQ0EsT0FBRyxnQkFBSCxDQUFvQixXQUFwQixFQUFpQyxNQUFLLFlBQUwsQ0FBa0IsSUFBbEIsT0FBakM7QUFDQSxPQUFHLGdCQUFILENBQW9CLFdBQXBCLEVBQWlDLE1BQUssWUFBTCxDQUFrQixJQUFsQixPQUFqQztBQUNBLE9BQUcsZ0JBQUgsQ0FBb0IsU0FBcEIsRUFBK0IsTUFBSyxVQUFMLENBQWdCLElBQWhCLE9BQS9CO0FBQ0EsT0FBRyxnQkFBSCxDQUFvQixZQUFwQixFQUFrQyxNQUFLLGFBQUwsQ0FBbUIsSUFBbkIsT0FBbEM7QUFDQSxPQUFHLGdCQUFILENBQW9CLFdBQXBCLEVBQWlDLE1BQUssWUFBTCxDQUFrQixJQUFsQixPQUFqQztBQUNBLE9BQUcsZ0JBQUgsQ0FBb0IsVUFBcEIsRUFBZ0MsTUFBSyxXQUFMLENBQWlCLElBQWpCLE9BQWhDOztBQUVBO0FBQ0EsVUFBSyxPQUFMLEdBQWUsSUFBSSxNQUFNLE9BQVYsRUFBZjtBQUNBO0FBQ0EsVUFBSyxXQUFMLEdBQW1CLElBQUksTUFBTSxPQUFWLEVBQW5CO0FBQ0E7QUFDQSxVQUFLLFVBQUwsR0FBa0IsSUFBSSxNQUFNLE9BQVYsRUFBbEI7QUFDQTtBQUNBLFVBQUssWUFBTCxHQUFvQixDQUFwQjtBQUNBO0FBQ0EsVUFBSyxVQUFMLEdBQWtCLEtBQWxCO0FBQ0E7QUFDQSxVQUFLLGFBQUwsR0FBcUIsS0FBckI7QUFDQTtBQUNBLFVBQUsscUJBQUwsR0FBNkIsS0FBN0I7O0FBRUE7QUFDQSxVQUFLLE9BQUwsR0FBZSxJQUFmOztBQUVBLFVBQUssWUFBTCxHQUFvQixLQUFwQjs7QUFFQTtBQUNBLFFBQUksQ0FBQyxVQUFVLGFBQWYsRUFBOEI7QUFDNUIsY0FBUSxJQUFSLENBQWEsNkRBQWI7QUFDRCxLQUZELE1BRU87QUFDTCxnQkFBVSxhQUFWLEdBQTBCLElBQTFCLENBQStCLFVBQUMsUUFBRCxFQUFjO0FBQzNDLGNBQUssU0FBTCxHQUFpQixTQUFTLENBQVQsQ0FBakI7QUFDRCxPQUZEO0FBR0Q7QUF2Q2lCO0FBd0NuQjs7Ozt5Q0FFb0I7QUFDbkI7QUFDQTs7QUFFQSxVQUFJLFVBQVUsS0FBSyxhQUFMLEVBQWQ7QUFDQSxXQUFLLE9BQUwsR0FBZSxPQUFmO0FBQ0EsVUFBSSxPQUFKLEVBQWE7QUFDWCxZQUFHLFFBQVEsSUFBWCxFQUFnQjtBQUNkLGNBQUcsUUFBUSxJQUFSLEtBQWlCLE1BQXBCLEVBQTJCO0FBQ3pCLGlCQUFLLFlBQUwsR0FBb0IsSUFBcEI7QUFDRCxXQUZELE1BRUs7QUFDSCxpQkFBSyxZQUFMLEdBQW9CLEtBQXBCO0FBQ0Q7QUFDRjtBQUNELFlBQUksT0FBTyxRQUFRLElBQW5CO0FBQ0E7QUFDQSxZQUFJLEtBQUssV0FBVCxFQUFzQjtBQUNwQixpQkFBTyw4QkFBaUIsT0FBeEI7QUFDRDs7QUFFRCxZQUFJLEtBQUssY0FBVCxFQUF5QjtBQUN2QixpQkFBTyw4QkFBaUIsT0FBeEI7QUFDRDtBQUVGLE9BbEJELE1Ba0JPO0FBQ0w7QUFDQSxZQUFJLHFCQUFKLEVBQWdCO0FBQ2Q7QUFDQTtBQUNBLGNBQUksS0FBSyxTQUFMLElBQWtCLEtBQUssU0FBTCxDQUFlLFlBQXJDLEVBQW1EO0FBQ2pELG1CQUFPLDhCQUFpQixPQUF4QjtBQUNELFdBRkQsTUFFTztBQUNMLG1CQUFPLDhCQUFpQixLQUF4QjtBQUNEO0FBQ0YsU0FSRCxNQVFPO0FBQ0w7QUFDQSxpQkFBTyw4QkFBaUIsS0FBeEI7QUFDRDtBQUNGO0FBQ0Q7QUFDQSxhQUFPLDhCQUFpQixLQUF4QjtBQUNEOzs7cUNBRWdCO0FBQ2YsVUFBSSxVQUFVLEtBQUssYUFBTCxFQUFkO0FBQ0EsYUFBTyxRQUFRLElBQWY7QUFDRDs7QUFFRDs7Ozs7Ozt1Q0FJbUI7QUFDakIsYUFBTyxLQUFLLGFBQVo7QUFDRDs7QUFFRDs7Ozs7Ozs7OzsyQ0FPdUIsQyxFQUFHO0FBQ3hCLFVBQUksT0FBTyxLQUFLLGtCQUFMLEVBQVg7QUFDQSxVQUFJLFFBQVEsOEJBQWlCLE9BQXpCLElBQW9DLEVBQUUsT0FBRixJQUFhLENBQWpELElBQXNELEVBQUUsT0FBRixJQUFhLENBQXZFLEVBQTBFO0FBQ3hFLGVBQU8sSUFBUDtBQUNEO0FBQ0QsYUFBTyxLQUFQO0FBQ0Q7Ozs0QkFFTyxJLEVBQU07QUFDWixXQUFLLElBQUwsR0FBWSxJQUFaO0FBQ0Q7Ozs4QkFFUyxNLEVBQU87QUFDZixXQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0Q7Ozs2QkFFUTtBQUNQLFVBQUksT0FBTyxLQUFLLGtCQUFMLEVBQVg7QUFDQSxVQUFJLFFBQVEsOEJBQWlCLE9BQXpCLElBQW9DLFFBQVEsOEJBQWlCLE9BQWpFLEVBQTBFO0FBQ3hFO0FBQ0E7QUFDQSxZQUFJLG1CQUFtQixLQUFLLHdCQUFMLEVBQXZCO0FBQ0EsWUFBSSxvQkFBb0IsQ0FBQyxLQUFLLGlCQUE5QixFQUFpRDtBQUMvQyxlQUFLLElBQUwsQ0FBVSxTQUFWO0FBQ0Q7QUFDRCxZQUFJLENBQUMsZ0JBQUQsSUFBcUIsS0FBSyxpQkFBOUIsRUFBaUQ7QUFDL0MsZUFBSyxJQUFMLENBQVUsT0FBVjtBQUNEO0FBQ0QsYUFBSyxpQkFBTCxHQUF5QixnQkFBekI7QUFDRDtBQUNGOzs7K0NBRTBCO0FBQ3pCLFVBQUksVUFBVSxLQUFLLGFBQUwsRUFBZDtBQUNBLFVBQUksQ0FBQyxPQUFMLEVBQWM7QUFDWjtBQUNBLGVBQU8sS0FBUDtBQUNEO0FBQ0Q7QUFDQSxXQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksUUFBUSxPQUFSLENBQWdCLE1BQXBDLEVBQTRDLEVBQUUsQ0FBOUMsRUFBaUQ7QUFDL0MsWUFBSSxRQUFRLE9BQVIsQ0FBZ0IsQ0FBaEIsRUFBbUIsT0FBdkIsRUFBZ0M7QUFDOUIsaUJBQU8sSUFBUDtBQUNEO0FBQ0Y7QUFDRCxhQUFPLEtBQVA7QUFDRDs7O2lDQUVZLEMsRUFBRztBQUNkLFVBQUksS0FBSyxxQkFBVCxFQUFnQztBQUNoQyxVQUFJLEtBQUssc0JBQUwsQ0FBNEIsQ0FBNUIsQ0FBSixFQUFvQzs7QUFFcEMsV0FBSyxjQUFMLENBQW9CLENBQXBCO0FBQ0EsV0FBSyxJQUFMLENBQVUsU0FBVjtBQUNEOzs7aUNBRVksQyxFQUFHO0FBQ2QsVUFBSSxLQUFLLHFCQUFULEVBQWdDOztBQUVoQyxXQUFLLGNBQUwsQ0FBb0IsQ0FBcEI7QUFDQSxXQUFLLG1CQUFMO0FBQ0EsV0FBSyxJQUFMLENBQVUsYUFBVixFQUF5QixLQUFLLFVBQTlCO0FBQ0Q7OzsrQkFFVSxDLEVBQUc7QUFDWixVQUFJLGNBQWMsS0FBSyxxQkFBdkI7QUFDQSxXQUFLLHFCQUFMLEdBQTZCLEtBQTdCO0FBQ0EsVUFBSSxXQUFKLEVBQWlCO0FBQ2pCLFVBQUksS0FBSyxzQkFBTCxDQUE0QixDQUE1QixDQUFKLEVBQW9DOztBQUVwQyxXQUFLLFlBQUw7QUFDRDs7O2tDQUVhLEMsRUFBRztBQUNmLFdBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNBLFVBQUksSUFBSSxFQUFFLE9BQUYsQ0FBVSxDQUFWLENBQVI7QUFDQSxXQUFLLGNBQUwsQ0FBb0IsQ0FBcEI7QUFDQSxXQUFLLG1CQUFMLENBQXlCLENBQXpCOztBQUVBLFdBQUssSUFBTCxDQUFVLGFBQVYsRUFBeUIsS0FBSyxVQUE5QjtBQUNBLFdBQUssSUFBTCxDQUFVLFNBQVY7QUFDRDs7O2lDQUVZLEMsRUFBRztBQUNkLFdBQUssbUJBQUwsQ0FBeUIsQ0FBekI7QUFDQSxXQUFLLG1CQUFMO0FBQ0Q7OztnQ0FFVyxDLEVBQUc7QUFDYixXQUFLLFlBQUw7O0FBRUE7QUFDQSxXQUFLLHFCQUFMLEdBQTZCLElBQTdCO0FBQ0EsV0FBSyxhQUFMLEdBQXFCLEtBQXJCO0FBQ0Q7Ozt3Q0FFbUIsQyxFQUFHO0FBQ3JCO0FBQ0EsVUFBSSxFQUFFLE9BQUYsQ0FBVSxNQUFWLEtBQXFCLENBQXpCLEVBQTRCO0FBQzFCLGdCQUFRLElBQVIsQ0FBYSx1Q0FBYjtBQUNBO0FBQ0Q7QUFDRCxVQUFJLElBQUksRUFBRSxPQUFGLENBQVUsQ0FBVixDQUFSO0FBQ0EsV0FBSyxjQUFMLENBQW9CLENBQXBCO0FBQ0Q7OzttQ0FFYyxDLEVBQUc7QUFDaEI7QUFDQSxXQUFLLE9BQUwsQ0FBYSxHQUFiLENBQWlCLEVBQUUsT0FBRixHQUFZLEtBQUssTUFBTCxDQUFZLElBQXpDLEVBQStDLEVBQUUsT0FBRixHQUFZLEtBQUssTUFBTCxDQUFZLEdBQXZFO0FBQ0EsV0FBSyxVQUFMLENBQWdCLENBQWhCLEdBQXFCLENBQUMsRUFBRSxPQUFGLEdBQVksS0FBSyxNQUFMLENBQVksSUFBekIsSUFBaUMsS0FBSyxJQUFMLENBQVUsS0FBNUMsR0FBcUQsQ0FBckQsR0FBeUQsQ0FBN0U7QUFDQSxXQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsR0FBb0IsRUFBRyxDQUFDLEVBQUUsT0FBRixHQUFZLEtBQUssTUFBTCxDQUFZLEdBQXpCLElBQWdDLEtBQUssSUFBTCxDQUFVLE1BQTdDLElBQXVELENBQXZELEdBQTJELENBQS9FO0FBQ0Q7OzswQ0FFcUI7QUFDcEIsVUFBSSxLQUFLLFVBQVQsRUFBcUI7QUFDbkIsWUFBSSxXQUFXLEtBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixLQUFLLE9BQTFCLEVBQW1DLE1BQW5DLEVBQWY7QUFDQSxhQUFLLFlBQUwsSUFBcUIsUUFBckI7QUFDQSxhQUFLLFdBQUwsQ0FBaUIsSUFBakIsQ0FBc0IsS0FBSyxPQUEzQjs7QUFHQTtBQUNBLFlBQUksS0FBSyxZQUFMLEdBQW9CLGdCQUF4QixFQUEwQztBQUN4QyxlQUFLLElBQUwsQ0FBVSxXQUFWO0FBQ0EsZUFBSyxVQUFMLEdBQWtCLEtBQWxCO0FBQ0Q7QUFDRjtBQUNGOzs7bUNBRWMsQyxFQUFHO0FBQ2hCLFdBQUssVUFBTCxHQUFrQixJQUFsQjtBQUNBLFdBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixFQUFFLE9BQUYsR0FBWSxLQUFLLE1BQUwsQ0FBWSxJQUE3QyxFQUFtRCxFQUFFLE9BQUYsR0FBWSxLQUFLLE1BQUwsQ0FBWSxHQUEzRTtBQUNEOzs7bUNBRWM7QUFDYixVQUFJLEtBQUssWUFBTCxHQUFvQixnQkFBeEIsRUFBMEM7QUFDeEMsYUFBSyxJQUFMLENBQVUsT0FBVjtBQUNEO0FBQ0QsV0FBSyxZQUFMLEdBQW9CLENBQXBCO0FBQ0EsV0FBSyxVQUFMLEdBQWtCLEtBQWxCO0FBQ0Q7O0FBRUQ7Ozs7OztvQ0FHZ0I7QUFDZDtBQUNBLFVBQUksQ0FBQyxVQUFVLFdBQWYsRUFBNEI7QUFDMUIsZUFBTyxJQUFQO0FBQ0Q7O0FBRUQsVUFBSSxXQUFXLFVBQVUsV0FBVixFQUFmO0FBQ0EsV0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFNBQVMsTUFBN0IsRUFBcUMsRUFBRSxDQUF2QyxFQUEwQztBQUN4QyxZQUFJLFVBQVUsU0FBUyxDQUFULENBQWQ7QUFDQTtBQUNBO0FBQ0EsWUFBSSxXQUFXLFFBQVEsSUFBdkIsRUFBNkI7QUFDM0IsaUJBQU8sT0FBUDtBQUNEO0FBQ0Y7QUFDRCxhQUFPLElBQVA7QUFDRDs7Ozs7O2tCQXpRa0IsYTs7Ozs7Ozs7Ozs7QUNuQnJCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBbkJBOzs7Ozs7Ozs7Ozs7Ozs7QUFxQkE7OztJQUdxQixROzs7QUFDbkIsb0JBQVksTUFBWixFQUFvQixNQUFwQixFQUE0QjtBQUFBOztBQUFBOztBQUcxQixVQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0EsVUFBSyxRQUFMLEdBQWdCLDBCQUFnQixNQUFoQixDQUFoQjtBQUNBLFVBQUssVUFBTCxHQUFrQiw0QkFBa0IsTUFBbEIsQ0FBbEI7O0FBRUE7QUFDQSxVQUFLLFFBQUwsR0FBZ0IsbUNBQWhCOztBQUVBLFVBQUssVUFBTCxDQUFnQixFQUFoQixDQUFtQixTQUFuQixFQUE4QixNQUFLLFVBQUwsQ0FBZ0IsSUFBaEIsT0FBOUI7QUFDQSxVQUFLLFVBQUwsQ0FBZ0IsRUFBaEIsQ0FBbUIsT0FBbkIsRUFBNEIsTUFBSyxRQUFMLENBQWMsSUFBZCxPQUE1QjtBQUNBLFVBQUssVUFBTCxDQUFnQixFQUFoQixDQUFtQixXQUFuQixFQUFnQyxNQUFLLFlBQUwsQ0FBa0IsSUFBbEIsT0FBaEM7QUFDQSxVQUFLLFVBQUwsQ0FBZ0IsRUFBaEIsQ0FBbUIsYUFBbkIsRUFBa0MsTUFBSyxjQUFMLENBQW9CLElBQXBCLE9BQWxDO0FBQ0EsVUFBSyxRQUFMLENBQWMsRUFBZCxDQUFpQixTQUFqQixFQUE0QixVQUFDLElBQUQsRUFBVTtBQUFFLFlBQUssSUFBTCxDQUFVLFNBQVYsRUFBcUIsSUFBckI7QUFBNEIsS0FBcEU7QUFDQSxVQUFLLFFBQUwsQ0FBYyxFQUFkLENBQWlCLFFBQWpCLEVBQTJCLFVBQUMsSUFBRCxFQUFVO0FBQUUsWUFBSyxJQUFMLENBQVUsUUFBVixFQUFvQixJQUFwQjtBQUEyQixLQUFsRTs7QUFFQTtBQUNBLFVBQUssVUFBTCxHQUFrQixJQUFJLE1BQU0sT0FBVixDQUFrQixDQUFsQixFQUFxQixDQUFyQixDQUFsQjs7QUFFQTtBQUNBLFVBQUssUUFBTCxHQUFnQixFQUFoQjtBQXJCMEI7QUFzQjNCOzs7O3dCQUVHLE0sRUFBUSxRLEVBQVU7QUFDcEIsV0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixNQUFsQixFQUEwQixRQUExQjtBQUNBLFdBQUssUUFBTCxDQUFjLE9BQU8sRUFBckIsSUFBMkIsUUFBM0I7QUFDRDs7OzJCQUVNLE0sRUFBUTtBQUNiLFdBQUssUUFBTCxDQUFjLE1BQWQsQ0FBcUIsTUFBckI7QUFDQSxhQUFPLEtBQUssUUFBTCxDQUFjLE9BQU8sRUFBckIsQ0FBUDtBQUNEOzs7NkJBRVE7QUFDUCxVQUFJLFNBQVMsSUFBSSxNQUFNLE9BQVYsQ0FBa0IsQ0FBbEIsRUFBcUIsQ0FBckIsRUFBd0IsQ0FBQyxDQUF6QixDQUFiO0FBQ0EsYUFBTyxlQUFQLENBQXVCLEtBQUssTUFBTCxDQUFZLFVBQW5DOztBQUVBLFVBQUksT0FBTyxLQUFLLFVBQUwsQ0FBZ0Isa0JBQWhCLEVBQVg7QUFDQSxjQUFRLElBQVI7QUFDRSxhQUFLLDhCQUFpQixLQUF0QjtBQUNFO0FBQ0EsZUFBSyxRQUFMLENBQWMsVUFBZCxDQUF5QixLQUFLLFVBQTlCO0FBQ0E7QUFDQSxlQUFLLFFBQUwsQ0FBYyxnQkFBZCxDQUErQixLQUEvQjtBQUNBLGVBQUssUUFBTCxDQUFjLG9CQUFkLENBQW1DLEtBQW5DOztBQUVBO0FBQ0EsZUFBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixJQUF4QjtBQUNBOztBQUVGLGFBQUssOEJBQWlCLEtBQXRCO0FBQ0U7QUFDQTtBQUNBLGVBQUssUUFBTCxDQUFjLFVBQWQsQ0FBeUIsS0FBSyxVQUE5Qjs7QUFFQTtBQUNBLGVBQUssUUFBTCxDQUFjLGdCQUFkLENBQStCLEtBQS9CO0FBQ0EsZUFBSyxRQUFMLENBQWMsb0JBQWQsQ0FBbUMsS0FBbkM7O0FBRUE7QUFDQSxlQUFLLFFBQUwsQ0FBYyxTQUFkLENBQXdCLEtBQUssVUFBTCxDQUFnQixnQkFBaEIsRUFBeEI7QUFDQTs7QUFFRixhQUFLLDhCQUFpQixPQUF0QjtBQUNFO0FBQ0EsZUFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixLQUFLLE1BQUwsQ0FBWSxRQUF0QztBQUNBLGVBQUssUUFBTCxDQUFjLGNBQWQsQ0FBNkIsS0FBSyxNQUFMLENBQVksVUFBekM7O0FBRUE7QUFDQSxlQUFLLFFBQUwsQ0FBYyxnQkFBZCxDQUErQixLQUEvQjtBQUNBLGVBQUssUUFBTCxDQUFjLG9CQUFkLENBQW1DLElBQW5DOztBQUVBO0FBQ0EsZUFBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixJQUF4QjtBQUNBOztBQUVGLGFBQUssOEJBQWlCLE9BQXRCO0FBQ0U7QUFDQTtBQUNBO0FBQ0EsY0FBSSxPQUFPLEtBQUssVUFBTCxDQUFnQixjQUFoQixFQUFYO0FBQ0E7QUFDQTtBQUNBLGNBQUksd0JBQXdCLElBQUksTUFBTSxVQUFWLEdBQXVCLFNBQXZCLENBQWlDLEtBQUssV0FBdEMsQ0FBNUI7O0FBRUE7QUFDQTs7Ozs7OztBQU9BO0FBQ0EsZUFBSyxRQUFMLENBQWMsa0JBQWQsQ0FBaUMsS0FBSyxNQUFMLENBQVksVUFBN0M7QUFDQSxlQUFLLFFBQUwsQ0FBYyxlQUFkLENBQThCLEtBQUssTUFBTCxDQUFZLFFBQTFDO0FBQ0EsZUFBSyxRQUFMLENBQWMsd0JBQWQsQ0FBdUMscUJBQXZDO0FBQ0EsZUFBSyxRQUFMLENBQWMsTUFBZDs7QUFFQTtBQUNBLGNBQUksWUFBWSxLQUFLLFFBQUwsQ0FBYyxPQUFkLEVBQWhCO0FBQ0EsZUFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixVQUFVLFFBQXBDO0FBQ0E7QUFDQSxlQUFLLFFBQUwsQ0FBYyxjQUFkLENBQTZCLFVBQVUsV0FBdkM7QUFDQTtBQUNBLGVBQUssUUFBTCxDQUFjLGFBQWQsQ0FBNEIsS0FBSyxVQUFMLENBQWdCLFlBQTVDO0FBQ0E7QUFDQSxlQUFLLFFBQUwsQ0FBYyxnQkFBZCxDQUErQixJQUEvQjtBQUNBLGVBQUssUUFBTCxDQUFjLG9CQUFkLENBQW1DLElBQW5DOztBQUVBO0FBQ0EsZUFBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixJQUF4QjtBQUNBOztBQUVGLGFBQUssOEJBQWlCLE9BQXRCO0FBQ0U7QUFDQTtBQUNBLGNBQUksT0FBTyxLQUFLLFVBQUwsQ0FBZ0IsY0FBaEIsRUFBWDs7QUFFQTtBQUNBLGNBQUksQ0FBQyxLQUFLLFdBQU4sSUFBcUIsQ0FBQyxLQUFLLFFBQS9CLEVBQXlDO0FBQ3ZDLG9CQUFRLElBQVIsQ0FBYSwwQ0FBYjtBQUNBO0FBQ0Q7QUFDRCxjQUFJLGNBQWMsSUFBSSxNQUFNLFVBQVYsR0FBdUIsU0FBdkIsQ0FBaUMsS0FBSyxXQUF0QyxDQUFsQjtBQUNBLGNBQUksV0FBVyxJQUFJLE1BQU0sT0FBVixHQUFvQixTQUFwQixDQUE4QixLQUFLLFFBQW5DLENBQWY7O0FBRUEsZUFBSyxRQUFMLENBQWMsY0FBZCxDQUE2QixXQUE3QjtBQUNBLGVBQUssUUFBTCxDQUFjLFdBQWQsQ0FBMEIsUUFBMUI7O0FBRUE7QUFDQSxlQUFLLFFBQUwsQ0FBYyxnQkFBZCxDQUErQixJQUEvQjtBQUNBLGVBQUssUUFBTCxDQUFjLG9CQUFkLENBQW1DLElBQW5DOztBQUVBO0FBQ0EsZUFBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixJQUF4QjtBQUNBOztBQUVGO0FBQ0Usa0JBQVEsS0FBUixDQUFjLDJCQUFkO0FBckdKO0FBdUdBLFdBQUssUUFBTCxDQUFjLE1BQWQ7QUFDQSxXQUFLLFVBQUwsQ0FBZ0IsTUFBaEI7QUFDRDs7OzRCQUVPLEksRUFBTTtBQUNaLFdBQUssVUFBTCxDQUFnQixPQUFoQixDQUF3QixJQUF4QjtBQUNEOzs7OEJBRVMsTSxFQUFPO0FBQ2YsV0FBSyxVQUFMLENBQWdCLFNBQWhCLENBQTBCLE1BQTFCO0FBQ0Q7Ozs4QkFFUztBQUNSLGFBQU8sS0FBSyxRQUFMLENBQWMsaUJBQWQsRUFBUDtBQUNEOzs7Z0NBRVc7QUFDVixhQUFPLEtBQUssUUFBTCxDQUFjLFNBQWQsRUFBUDtBQUNEOzs7bUNBRWM7QUFDYixhQUFPLEtBQUssUUFBTCxDQUFjLFlBQWQsRUFBUDtBQUNEOzs7d0NBRW1CO0FBQ2xCLFVBQUksU0FBUyxJQUFJLE1BQU0sT0FBVixDQUFrQixDQUFsQixFQUFxQixDQUFyQixFQUF3QixDQUFDLENBQXpCLENBQWI7QUFDQSxhQUFPLGVBQVAsQ0FBdUIsS0FBSyxNQUFMLENBQVksVUFBbkM7QUFDQSxhQUFPLElBQUksTUFBTSxPQUFWLEdBQW9CLFlBQXBCLENBQWlDLE1BQWpDLEVBQXlDLEtBQUssTUFBTCxDQUFZLEVBQXJELENBQVA7QUFDRDs7OytCQUVVLEMsRUFBRztBQUNaOztBQUVBO0FBQ0EsV0FBSyxRQUFMLENBQWMsTUFBZDtBQUNBLFVBQUksT0FBTyxLQUFLLFFBQUwsQ0FBYyxlQUFkLEVBQVg7QUFDQSxXQUFLLElBQUwsQ0FBVSxTQUFWLEVBQXFCLElBQXJCOztBQUVBLFdBQUssUUFBTCxDQUFjLFNBQWQsQ0FBd0IsSUFBeEI7QUFDRDs7OzZCQUVRLEMsRUFBRztBQUNWO0FBQ0EsVUFBSSxPQUFPLEtBQUssUUFBTCxDQUFjLGVBQWQsRUFBWDtBQUNBLFdBQUssSUFBTCxDQUFVLE9BQVYsRUFBbUIsSUFBbkI7O0FBRUEsV0FBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixLQUF4QjtBQUNEOzs7aUNBRVksQyxFQUFHO0FBQ2Q7QUFDQSxVQUFJLE9BQU8sS0FBSyxRQUFMLENBQWMsZUFBZCxFQUFYO0FBQ0EsV0FBSyxJQUFMLENBQVUsV0FBVixFQUF1QixJQUF2QjtBQUNEOzs7bUNBRWMsRyxFQUFLO0FBQ2xCLFdBQUssVUFBTCxDQUFnQixJQUFoQixDQUFxQixHQUFyQjtBQUNEOzs7Ozs7a0JBeE1rQixROzs7Ozs7OztBQ3hCckI7Ozs7Ozs7Ozs7Ozs7OztBQWVBLElBQUksbUJBQW1CO0FBQ3JCLFNBQU8sQ0FEYztBQUVyQixTQUFPLENBRmM7QUFHckIsV0FBUyxDQUhZO0FBSXJCLFdBQVMsQ0FKWTtBQUtyQixXQUFTO0FBTFksQ0FBdkI7O1FBUTZCLE8sR0FBcEIsZ0I7Ozs7Ozs7Ozs7O0FDUlQ7O0FBQ0E7Ozs7Ozs7Ozs7K2VBaEJBOzs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsSUFBTSxVQUFVLFFBQVEsU0FBUixDQUFoQjs7QUFFQSxJQUFNLG1CQUFtQixDQUF6QjtBQUNBLElBQU0sZUFBZSxJQUFyQjtBQUNBLElBQU0sZUFBZSxJQUFyQjtBQUNBLElBQU0sYUFBYSxLQUFuQjtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0lBZXFCLFc7OztBQUNuQix1QkFBWSxNQUFaLEVBQW9CLFVBQXBCLEVBQWdDO0FBQUE7O0FBQUE7O0FBRzlCLFVBQUssTUFBTCxHQUFjLE1BQWQ7O0FBRUEsUUFBSSxTQUFTLGNBQWMsRUFBM0I7O0FBRUE7QUFDQSxVQUFLLE1BQUwsR0FBYyxFQUFkOztBQUVBO0FBQ0EsVUFBSyxRQUFMLEdBQWdCLEVBQWhCOztBQUVBO0FBQ0EsVUFBSyxTQUFMLEdBQWlCLElBQUksTUFBTSxTQUFWLEVBQWpCOztBQUVBO0FBQ0EsVUFBSyxRQUFMLEdBQWdCLElBQUksTUFBTSxPQUFWLEVBQWhCO0FBQ0EsVUFBSyxXQUFMLEdBQW1CLElBQUksTUFBTSxVQUFWLEVBQW5COztBQUVBLFVBQUssSUFBTCxHQUFZLElBQUksTUFBTSxRQUFWLEVBQVo7O0FBRUE7QUFDQSxVQUFLLE9BQUwsR0FBZSxNQUFLLGNBQUwsRUFBZjtBQUNBLFVBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxNQUFLLE9BQW5COztBQUVBO0FBQ0EsVUFBSyxHQUFMLEdBQVcsTUFBSyxVQUFMLEVBQVg7QUFDQSxVQUFLLElBQUwsQ0FBVSxHQUFWLENBQWMsTUFBSyxHQUFuQjs7QUFFQTtBQUNBLFVBQUssZUFBTCxHQUF1QixnQkFBdkI7QUEvQjhCO0FBZ0MvQjs7QUFFRDs7Ozs7Ozt3QkFHSSxNLEVBQVE7QUFDVixXQUFLLE1BQUwsQ0FBWSxPQUFPLEVBQW5CLElBQXlCLE1BQXpCO0FBQ0Q7O0FBRUQ7Ozs7OzsyQkFHTyxNLEVBQVE7QUFDYixVQUFJLEtBQUssT0FBTyxFQUFoQjtBQUNBLFVBQUksS0FBSyxNQUFMLENBQVksRUFBWixDQUFKLEVBQXFCO0FBQ25CO0FBQ0EsZUFBTyxLQUFLLE1BQUwsQ0FBWSxFQUFaLENBQVA7QUFDRDtBQUNEO0FBQ0EsVUFBSSxLQUFLLFFBQUwsQ0FBYyxFQUFkLENBQUosRUFBdUI7QUFDckIsZUFBTyxLQUFLLFFBQUwsQ0FBYyxPQUFPLEVBQXJCLENBQVA7QUFDRDtBQUNGOzs7NkJBRVE7QUFDUDtBQUNBLFdBQUssSUFBSSxFQUFULElBQWUsS0FBSyxNQUFwQixFQUE0QjtBQUMxQixZQUFJLE9BQU8sS0FBSyxNQUFMLENBQVksRUFBWixDQUFYO0FBQ0EsWUFBSSxhQUFhLEtBQUssU0FBTCxDQUFlLGVBQWYsQ0FBK0IsSUFBL0IsRUFBcUMsSUFBckMsQ0FBakI7QUFDQSxZQUFJLFdBQVcsTUFBWCxHQUFvQixDQUF4QixFQUEyQjtBQUN6QjtBQUNEO0FBQ0QsWUFBSSxnQkFBaUIsV0FBVyxNQUFYLEdBQW9CLENBQXpDO0FBQ0EsWUFBSSxhQUFhLEtBQUssUUFBTCxDQUFjLEVBQWQsQ0FBakI7O0FBRUE7QUFDQSxZQUFJLGlCQUFpQixDQUFDLFVBQXRCLEVBQWtDO0FBQ2hDLGVBQUssUUFBTCxDQUFjLEVBQWQsSUFBb0IsSUFBcEI7QUFDQSxjQUFJLEtBQUssUUFBVCxFQUFtQjtBQUNqQixpQkFBSyxJQUFMLENBQVUsU0FBVixFQUFxQixJQUFyQjtBQUNEO0FBQ0Y7O0FBRUQ7QUFDQSxZQUFJLENBQUMsYUFBRCxJQUFrQixVQUF0QixFQUFrQztBQUNoQyxpQkFBTyxLQUFLLFFBQUwsQ0FBYyxFQUFkLENBQVA7QUFDQSxlQUFLLFlBQUwsQ0FBa0IsSUFBbEI7QUFDQSxjQUFJLEtBQUssUUFBVCxFQUFtQjtBQUNqQixpQkFBSyxJQUFMLENBQVUsUUFBVixFQUFvQixJQUFwQjtBQUNEO0FBQ0Y7O0FBRUQsWUFBSSxhQUFKLEVBQW1CO0FBQ2pCLGVBQUssWUFBTCxDQUFrQixVQUFsQjtBQUNEO0FBQ0Y7QUFDRjs7QUFFRDs7Ozs7OztnQ0FJWSxNLEVBQVE7QUFDbEIsV0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixNQUFuQjtBQUNBLFdBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsTUFBbkIsQ0FBMEIsSUFBMUIsQ0FBK0IsTUFBL0I7QUFDQSxXQUFLLGdCQUFMO0FBQ0Q7OztnQ0FFVztBQUNWLGFBQU8sS0FBSyxTQUFMLENBQWUsR0FBZixDQUFtQixNQUExQjtBQUNEOztBQUVEOzs7Ozs7O21DQUllLFUsRUFBWTtBQUN6QixXQUFLLFdBQUwsQ0FBaUIsSUFBakIsQ0FBc0IsVUFBdEI7O0FBRUEsVUFBSSxVQUFVLElBQUksTUFBTSxPQUFWLENBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLENBQUMsQ0FBekIsRUFBNEIsZUFBNUIsQ0FBNEMsVUFBNUMsQ0FBZDtBQUNBLFdBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsU0FBbkIsQ0FBNkIsSUFBN0IsQ0FBa0MsT0FBbEM7QUFDQSxXQUFLLGdCQUFMO0FBQ0Q7OzttQ0FFYztBQUNiLGFBQU8sS0FBSyxTQUFMLENBQWUsR0FBZixDQUFtQixTQUExQjtBQUNEOztBQUVEOzs7Ozs7Ozs7K0JBTVcsTSxFQUFRO0FBQ2pCLFdBQUssU0FBTCxDQUFlLGFBQWYsQ0FBNkIsTUFBN0IsRUFBcUMsS0FBSyxNQUExQztBQUNBLFdBQUssZ0JBQUw7QUFDRDs7QUFFRDs7Ozs7Ozt3Q0FJb0I7QUFDbEIsYUFBTyxLQUFLLElBQVo7QUFDRDs7QUFFRDs7Ozs7O3NDQUdrQjtBQUNoQixVQUFJLFFBQVEsQ0FBWjtBQUNBLFVBQUksT0FBTyxJQUFYO0FBQ0EsV0FBSyxJQUFJLEVBQVQsSUFBZSxLQUFLLFFBQXBCLEVBQThCO0FBQzVCLGlCQUFTLENBQVQ7QUFDQSxlQUFPLEtBQUssTUFBTCxDQUFZLEVBQVosQ0FBUDtBQUNEO0FBQ0QsVUFBSSxRQUFRLENBQVosRUFBZTtBQUNiLGdCQUFRLElBQVIsQ0FBYSw4QkFBYjtBQUNEO0FBQ0QsYUFBTyxJQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozt5Q0FHcUIsUyxFQUFXO0FBQzlCLFdBQUssT0FBTCxDQUFhLE9BQWIsR0FBdUIsU0FBdkI7QUFDRDs7QUFFRDs7Ozs7OztxQ0FJaUIsUyxFQUFXO0FBQzFCLFdBQUssR0FBTCxDQUFTLE9BQVQsR0FBbUIsU0FBbkI7QUFDRDs7QUFFRDs7Ozs7Ozs4QkFJVSxRLEVBQVU7QUFDbEI7QUFDQSxVQUFJLEtBQUssUUFBTCxJQUFpQixRQUFyQixFQUErQjtBQUM3QjtBQUNEO0FBQ0Q7QUFDQSxXQUFLLFFBQUwsR0FBZ0IsUUFBaEI7O0FBRUEsVUFBSSxDQUFDLFFBQUwsRUFBZTtBQUNiLGFBQUssWUFBTCxDQUFrQixJQUFsQjtBQUNBLGFBQUssSUFBSSxFQUFULElBQWUsS0FBSyxRQUFwQixFQUE4QjtBQUM1QixjQUFJLE9BQU8sS0FBSyxNQUFMLENBQVksRUFBWixDQUFYO0FBQ0EsaUJBQU8sS0FBSyxRQUFMLENBQWMsRUFBZCxDQUFQO0FBQ0EsZUFBSyxJQUFMLENBQVUsUUFBVixFQUFvQixJQUFwQjtBQUNEO0FBQ0Y7QUFDRjs7O3VDQUVrQjtBQUNqQixVQUFJLE1BQU0sS0FBSyxTQUFMLENBQWUsR0FBekI7O0FBRUE7QUFDQTtBQUNBLFVBQUksV0FBVyxLQUFLLE9BQUwsQ0FBYSxRQUE1QjtBQUNBLGVBQVMsSUFBVCxDQUFjLElBQUksU0FBbEI7QUFDQSxlQUFTLGNBQVQsQ0FBd0IsS0FBSyxlQUE3QjtBQUNBLGVBQVMsR0FBVCxDQUFhLElBQUksTUFBakI7O0FBRUE7QUFDQTtBQUNBLFVBQUksUUFBUSxJQUFJLE1BQU0sT0FBVixHQUFvQixJQUFwQixDQUF5QixJQUFJLFNBQTdCLENBQVo7QUFDQSxZQUFNLGNBQU4sQ0FBcUIsS0FBSyxlQUExQjtBQUNBLFdBQUssR0FBTCxDQUFTLEtBQVQsQ0FBZSxDQUFmLEdBQW1CLE1BQU0sTUFBTixFQUFuQjtBQUNBLFVBQUksUUFBUSxJQUFJLE1BQU0sV0FBVixDQUFzQixJQUFJLFNBQTFCLEVBQXFDLElBQUksTUFBekMsQ0FBWjtBQUNBLFdBQUssR0FBTCxDQUFTLFFBQVQsQ0FBa0IsSUFBbEIsQ0FBdUIsTUFBTSxRQUE3QjtBQUNBLFdBQUssR0FBTCxDQUFTLFFBQVQsQ0FBa0IsVUFBbEIsQ0FBNkIsSUFBSSxNQUFqQyxFQUF5QyxNQUFNLGNBQU4sQ0FBcUIsR0FBckIsQ0FBekM7QUFDRDs7QUFFRDs7Ozs7O3FDQUdpQjtBQUNmO0FBQ0EsVUFBSSxnQkFBZ0IsSUFBSSxNQUFNLGNBQVYsQ0FBeUIsWUFBekIsRUFBdUMsRUFBdkMsRUFBMkMsRUFBM0MsQ0FBcEI7QUFDQSxVQUFJLGdCQUFnQixJQUFJLE1BQU0saUJBQVYsQ0FBNEI7QUFDOUMsZUFBTyxRQUR1QztBQUU5QyxxQkFBYSxJQUZpQztBQUc5QyxpQkFBUztBQUhxQyxPQUE1QixDQUFwQjtBQUtBLFVBQUksUUFBUSxJQUFJLE1BQU0sSUFBVixDQUFlLGFBQWYsRUFBOEIsYUFBOUIsQ0FBWjs7QUFFQSxVQUFJLGdCQUFnQixJQUFJLE1BQU0sY0FBVixDQUF5QixZQUF6QixFQUF1QyxFQUF2QyxFQUEyQyxFQUEzQyxDQUFwQjtBQUNBLFVBQUksZ0JBQWdCLElBQUksTUFBTSxpQkFBVixDQUE0QjtBQUM5QyxlQUFPLFFBRHVDO0FBRTlDLHFCQUFhLElBRmlDO0FBRzlDLGlCQUFTO0FBSHFDLE9BQTVCLENBQXBCO0FBS0EsVUFBSSxRQUFRLElBQUksTUFBTSxJQUFWLENBQWUsYUFBZixFQUE4QixhQUE5QixDQUFaOztBQUVBLFVBQUksVUFBVSxJQUFJLE1BQU0sS0FBVixFQUFkO0FBQ0EsY0FBUSxHQUFSLENBQVksS0FBWjtBQUNBLGNBQVEsR0FBUixDQUFZLEtBQVo7QUFDQSxhQUFPLE9BQVA7QUFDRDs7QUFFRDs7Ozs7OztpQ0FJYSxhLEVBQWU7QUFDMUI7QUFDQSxVQUFJLFdBQVcsZ0JBQWY7QUFDQSxVQUFJLGFBQUosRUFBbUI7QUFDakI7QUFDQSxZQUFJLFFBQVEsY0FBYyxDQUFkLENBQVo7QUFDQSxtQkFBVyxNQUFNLFFBQWpCO0FBQ0Q7O0FBRUQsV0FBSyxlQUFMLEdBQXVCLFFBQXZCO0FBQ0EsV0FBSyxnQkFBTDtBQUNBO0FBQ0Q7OztpQ0FFWTtBQUNYO0FBQ0EsVUFBSSxXQUFXLElBQUksTUFBTSxnQkFBVixDQUEyQixVQUEzQixFQUF1QyxVQUF2QyxFQUFtRCxDQUFuRCxFQUFzRCxFQUF0RCxFQUF5RCxDQUF6RCxFQUEyRCxJQUEzRCxDQUFmO0FBQ0EsVUFBSSxXQUFXLElBQUksTUFBTSxjQUFWLENBQ2Y7QUFDRSxxQkFBYSxJQURmO0FBRUUsa0JBQVU7QUFDUixpQkFBTyxFQUFFLE1BQU0sR0FBUixFQUFhLE9BQU8sSUFBSSxNQUFNLEtBQVYsQ0FBZ0IsUUFBaEIsQ0FBcEI7QUFEQyxTQUZaO0FBS0Usc0JBQWMsUUFBUSxvQkFBUixDQUxoQjtBQU1FLHdCQUFnQixRQUFRLG9CQUFSO0FBTmxCLE9BRGUsQ0FBZjtBQVVBLFVBQUksT0FBTyxJQUFJLE1BQU0sSUFBVixDQUFlLFFBQWYsRUFBeUIsUUFBekIsQ0FBWDtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7Ozs7a0JBalJrQixXOzs7Ozs7OztRQ3hCTCxRLEdBQUEsUTtRQU1BLE0sR0FBQSxNO0FBckJoQjs7Ozs7Ozs7Ozs7Ozs7O0FBZU8sU0FBUyxRQUFULEdBQW9CO0FBQ3pCLE1BQUksUUFBUSxLQUFaO0FBQ0EsR0FBQyxVQUFTLENBQVQsRUFBVztBQUFDLFFBQUcsMlRBQTJULElBQTNULENBQWdVLENBQWhVLEtBQW9VLDBrREFBMGtELElBQTFrRCxDQUEra0QsRUFBRSxNQUFGLENBQVMsQ0FBVCxFQUFXLENBQVgsQ0FBL2tELENBQXZVLEVBQXE2RCxRQUFRLElBQVI7QUFBYSxHQUEvN0QsRUFBaThELFVBQVUsU0FBVixJQUFxQixVQUFVLE1BQS9CLElBQXVDLE9BQU8sS0FBLytEO0FBQ0EsU0FBTyxLQUFQO0FBQ0Q7O0FBRU0sU0FBUyxNQUFULENBQWdCLFFBQWhCLEVBQTBCLE1BQTFCLEVBQWtDO0FBQ3ZDLFNBQU8sVUFBVSxRQUFWLEdBQXFCLFVBQXJCLEdBQWtDLE1BQXpDO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy9cbi8vIFdlIHN0b3JlIG91ciBFRSBvYmplY3RzIGluIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGB+YCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdCBvdmVycmlkZGVuIG9yXG4vLyB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vLyBXZSBhbHNvIGFzc3VtZSB0aGF0IGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBhdmFpbGFibGUgd2hlbiB0aGUgZXZlbnQgbmFtZVxuLy8gaXMgYW4gRVM2IFN5bWJvbC5cbi8vXG52YXIgcHJlZml4ID0gdHlwZW9mIE9iamVjdC5jcmVhdGUgIT09ICdmdW5jdGlvbicgPyAnficgOiBmYWxzZTtcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBFdmVudEVtaXR0ZXIgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRXZlbnQgaGFuZGxlciB0byBiZSBjYWxsZWQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IENvbnRleHQgZm9yIGZ1bmN0aW9uIGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29uY2U9ZmFsc2VdIE9ubHkgZW1pdCBvbmNlXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgRXZlbnRFbWl0dGVyIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkgeyAvKiBOb3RoaW5nIHRvIHNldCAqLyB9XG5cbi8qKlxuICogSG9sZCB0aGUgYXNzaWduZWQgRXZlbnRFbWl0dGVycyBieSBuYW1lLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzXG4gICAgLCBuYW1lcyA9IFtdXG4gICAgLCBuYW1lO1xuXG4gIGlmICghZXZlbnRzKSByZXR1cm4gbmFtZXM7XG5cbiAgZm9yIChuYW1lIGluIGV2ZW50cykge1xuICAgIGlmIChoYXMuY2FsbChldmVudHMsIG5hbWUpKSBuYW1lcy5wdXNoKHByZWZpeCA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgcmV0dXJuIG5hbWVzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGV2ZW50cykpO1xuICB9XG5cbiAgcmV0dXJuIG5hbWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBsaXN0IG9mIGFzc2lnbmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50cyB0aGF0IHNob3VsZCBiZSBsaXN0ZWQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBXZSBvbmx5IG5lZWQgdG8ga25vdyBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGV4aXN0cykgcmV0dXJuICEhYXZhaWxhYmxlO1xuICBpZiAoIWF2YWlsYWJsZSkgcmV0dXJuIFtdO1xuICBpZiAoYXZhaWxhYmxlLmZuKSByZXR1cm4gW2F2YWlsYWJsZS5mbl07XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdmFpbGFibGUubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gYXZhaWxhYmxlW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IHRvIGFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHJldHVybnMge0Jvb2xlYW59IEluZGljYXRpb24gaWYgd2UndmUgZW1pdHRlZCBhbiBldmVudC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgRXZlbnRMaXN0ZW5lciBmb3IgdGhlIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcylcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGFuIEV2ZW50TGlzdGVuZXIgdGhhdCdzIG9ubHkgY2FsbGVkIG9uY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcywgdHJ1ZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdlIHdhbnQgdG8gcmVtb3ZlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIHRoYXQgd2UgbmVlZCB0byBmaW5kLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSBsaXN0ZW5lcnMgbWF0Y2hpbmcgdGhpcyBjb250ZXh0LlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIE9ubHkgcmVtb3ZlIG9uY2UgbGlzdGVuZXJzLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgZXZlbnRzID0gW107XG5cbiAgaWYgKGZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnMuZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnMub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICAgKSB7XG4gICAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgLy9cbiAgaWYgKGV2ZW50cy5sZW5ndGgpIHtcbiAgICB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gIH0gZWxzZSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzIG9yIG9ubHkgdGhlIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdhbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuXG4gIGlmIChldmVudCkgZGVsZXRlIHRoaXMuX2V2ZW50c1twcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XTtcbiAgZWxzZSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gQWxpYXMgbWV0aG9kcyBuYW1lcyBiZWNhdXNlIHBlb3BsZSByb2xsIGxpa2UgdGhhdC5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLy9cbi8vIFRoaXMgZnVuY3Rpb24gZG9lc24ndCBhcHBseSBhbnltb3JlLlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cmluZ3MpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmdzID09PSAnc3RyaW5nJykgc3RyaW5ncyA9IFtzdHJpbmdzXVxuICB2YXIgZXhwcnMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywxKVxuICB2YXIgcGFydHMgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZ3MubGVuZ3RoLTE7IGkrKykge1xuICAgIHBhcnRzLnB1c2goc3RyaW5nc1tpXSwgZXhwcnNbaV0gfHwgJycpXG4gIH1cbiAgcGFydHMucHVzaChzdHJpbmdzW2ldKVxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsIihmdW5jdGlvbihmKXtpZih0eXBlb2YgZXhwb3J0cz09PVwib2JqZWN0XCImJnR5cGVvZiBtb2R1bGUhPT1cInVuZGVmaW5lZFwiKXttb2R1bGUuZXhwb3J0cz1mKCl9ZWxzZSBpZih0eXBlb2YgZGVmaW5lPT09XCJmdW5jdGlvblwiJiZkZWZpbmUuYW1kKXtkZWZpbmUoW10sZil9ZWxzZXt2YXIgZztpZih0eXBlb2Ygd2luZG93IT09XCJ1bmRlZmluZWRcIil7Zz13aW5kb3d9ZWxzZSBpZih0eXBlb2YgZ2xvYmFsIT09XCJ1bmRlZmluZWRcIil7Zz1nbG9iYWx9ZWxzZSBpZih0eXBlb2Ygc2VsZiE9PVwidW5kZWZpbmVkXCIpe2c9c2VsZn1lbHNle2c9dGhpc31nLldlYlZSTWFuYWdlciA9IGYoKX19KShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBFbWl0dGVyID0gX2RlcmVxXygnLi9lbWl0dGVyLmpzJyk7XG52YXIgTW9kZXMgPSBfZGVyZXFfKCcuL21vZGVzLmpzJyk7XG52YXIgVXRpbCA9IF9kZXJlcV8oJy4vdXRpbC5qcycpO1xuXG4vKipcbiAqIEV2ZXJ5dGhpbmcgaGF2aW5nIHRvIGRvIHdpdGggdGhlIFdlYlZSIGJ1dHRvbi5cbiAqIEVtaXRzIGEgJ2NsaWNrJyBldmVudCB3aGVuIGl0J3MgY2xpY2tlZC5cbiAqL1xuZnVuY3Rpb24gQnV0dG9uTWFuYWdlcihvcHRfcm9vdCkge1xuICB2YXIgcm9vdCA9IG9wdF9yb290IHx8IGRvY3VtZW50LmJvZHk7XG4gIHRoaXMubG9hZEljb25zXygpO1xuXG4gIC8vIE1ha2UgdGhlIGZ1bGxzY3JlZW4gYnV0dG9uLlxuICB2YXIgZnNCdXR0b24gPSB0aGlzLmNyZWF0ZUJ1dHRvbigpO1xuICBmc0J1dHRvbi5zcmMgPSB0aGlzLklDT05TLmZ1bGxzY3JlZW47XG4gIGZzQnV0dG9uLnRpdGxlID0gJ0Z1bGxzY3JlZW4gbW9kZSc7XG4gIHZhciBzID0gZnNCdXR0b24uc3R5bGU7XG4gIHMuYm90dG9tID0gMDtcbiAgcy5yaWdodCA9IDA7XG4gIGZzQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5jcmVhdGVDbGlja0hhbmRsZXJfKCdmcycpKTtcbiAgcm9vdC5hcHBlbmRDaGlsZChmc0J1dHRvbik7XG4gIHRoaXMuZnNCdXR0b24gPSBmc0J1dHRvbjtcblxuICAvLyBNYWtlIHRoZSBWUiBidXR0b24uXG4gIHZhciB2ckJ1dHRvbiA9IHRoaXMuY3JlYXRlQnV0dG9uKCk7XG4gIHZyQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuY2FyZGJvYXJkO1xuICB2ckJ1dHRvbi50aXRsZSA9ICdWaXJ0dWFsIHJlYWxpdHkgbW9kZSc7XG4gIHZhciBzID0gdnJCdXR0b24uc3R5bGU7XG4gIHMuYm90dG9tID0gMDtcbiAgcy5yaWdodCA9ICc0OHB4JztcbiAgdnJCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmNyZWF0ZUNsaWNrSGFuZGxlcl8oJ3ZyJykpO1xuICByb290LmFwcGVuZENoaWxkKHZyQnV0dG9uKTtcbiAgdGhpcy52ckJ1dHRvbiA9IHZyQnV0dG9uO1xuXG4gIHRoaXMuaXNWaXNpYmxlID0gdHJ1ZTtcblxufVxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUgPSBuZXcgRW1pdHRlcigpO1xuXG5CdXR0b25NYW5hZ2VyLnByb3RvdHlwZS5jcmVhdGVCdXR0b24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBidXR0b24uY2xhc3NOYW1lID0gJ3dlYnZyLWJ1dHRvbic7XG4gIHZhciBzID0gYnV0dG9uLnN0eWxlO1xuICBzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgcy53aWR0aCA9ICcyNHB4J1xuICBzLmhlaWdodCA9ICcyNHB4JztcbiAgcy5iYWNrZ3JvdW5kU2l6ZSA9ICdjb3Zlcic7XG4gIHMuYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgcy5ib3JkZXIgPSAwO1xuICBzLnVzZXJTZWxlY3QgPSAnbm9uZSc7XG4gIHMud2Via2l0VXNlclNlbGVjdCA9ICdub25lJztcbiAgcy5Nb3pVc2VyU2VsZWN0ID0gJ25vbmUnO1xuICBzLmN1cnNvciA9ICdwb2ludGVyJztcbiAgcy5wYWRkaW5nID0gJzEycHgnO1xuICBzLnpJbmRleCA9IDE7XG4gIHMuZGlzcGxheSA9ICdub25lJztcbiAgcy5ib3hTaXppbmcgPSAnY29udGVudC1ib3gnO1xuXG4gIC8vIFByZXZlbnQgYnV0dG9uIGZyb20gYmVpbmcgc2VsZWN0ZWQgYW5kIGRyYWdnZWQuXG4gIGJ1dHRvbi5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gIC8vIFN0eWxlIGl0IG9uIGhvdmVyLlxuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICBzLmZpbHRlciA9IHMud2Via2l0RmlsdGVyID0gJ2Ryb3Atc2hhZG93KDAgMCA1cHggcmdiYSgyNTUsMjU1LDI1NSwxKSknO1xuICB9KTtcbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgcy5maWx0ZXIgPSBzLndlYmtpdEZpbHRlciA9ICcnO1xuICB9KTtcbiAgcmV0dXJuIGJ1dHRvbjtcbn07XG5cbkJ1dHRvbk1hbmFnZXIucHJvdG90eXBlLnNldE1vZGUgPSBmdW5jdGlvbihtb2RlLCBpc1ZSQ29tcGF0aWJsZSkge1xuICBpc1ZSQ29tcGF0aWJsZSA9IGlzVlJDb21wYXRpYmxlIHx8IFdlYlZSQ29uZmlnLkZPUkNFX0VOQUJMRV9WUjtcbiAgaWYgKCF0aGlzLmlzVmlzaWJsZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBzd2l0Y2ggKG1vZGUpIHtcbiAgICBjYXNlIE1vZGVzLk5PUk1BTDpcbiAgICAgIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICB0aGlzLmZzQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuZnVsbHNjcmVlbjtcbiAgICAgIHRoaXMudnJCdXR0b24uc3R5bGUuZGlzcGxheSA9IChpc1ZSQ29tcGF0aWJsZSA/ICdibG9jaycgOiAnbm9uZScpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNb2Rlcy5NQUdJQ19XSU5ET1c6XG4gICAgICB0aGlzLmZzQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgdGhpcy5mc0J1dHRvbi5zcmMgPSB0aGlzLklDT05TLmV4aXRGdWxsc2NyZWVuO1xuICAgICAgdGhpcy52ckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNb2Rlcy5WUjpcbiAgICAgIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMudnJCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gSGFjayBmb3IgU2FmYXJpIE1hYy9pT1MgdG8gZm9yY2UgcmVsYXlvdXQgKHN2Zy1zcGVjaWZpYyBpc3N1ZSlcbiAgLy8gaHR0cDovL2dvby5nbC9oamdSNnJcbiAgdmFyIG9sZFZhbHVlID0gdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5O1xuICB0aGlzLmZzQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJztcbiAgdGhpcy5mc0J1dHRvbi5vZmZzZXRIZWlnaHQ7XG4gIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9IG9sZFZhbHVlO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUuc2V0VmlzaWJpbGl0eSA9IGZ1bmN0aW9uKGlzVmlzaWJsZSkge1xuICB0aGlzLmlzVmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gaXNWaXNpYmxlID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgdGhpcy52ckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gaXNWaXNpYmxlID8gJ2Jsb2NrJyA6ICdub25lJztcbn07XG5cbkJ1dHRvbk1hbmFnZXIucHJvdG90eXBlLmNyZWF0ZUNsaWNrSGFuZGxlcl8gPSBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmVtaXQoZXZlbnROYW1lKTtcbiAgfS5iaW5kKHRoaXMpO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUubG9hZEljb25zXyA9IGZ1bmN0aW9uKCkge1xuICAvLyBQcmVsb2FkIHNvbWUgaGFyZC1jb2RlZCBTVkcuXG4gIHRoaXMuSUNPTlMgPSB7fTtcbiAgdGhpcy5JQ09OUy5jYXJkYm9hcmQgPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NakF1TnpRZ05rZ3pMakl4UXpJdU5UVWdOaUF5SURZdU5UY2dNaUEzTGpJNGRqRXdMalEwWXpBZ0xqY3VOVFVnTVM0eU9DQXhMakl6SURFdU1qaG9OQzQzT1dNdU5USWdNQ0F1T1RZdExqTXpJREV1TVRRdExqYzViREV1TkMwekxqUTRZeTR5TXkwdU5Ua3VOemt0TVM0d01TQXhMalEwTFRFdU1ERnpNUzR5TVM0ME1pQXhMalExSURFdU1ERnNNUzR6T1NBekxqUTRZeTR4T1M0ME5pNDJNeTQzT1NBeExqRXhMamM1YURRdU56bGpMamN4SURBZ01TNHlOaTB1TlRjZ01TNHlOaTB4TGpJNFZqY3VNamhqTUMwdU55MHVOVFV0TVM0eU9DMHhMakkyTFRFdU1qaDZUVGN1TlNBeE5DNDJNbU10TVM0eE55QXdMVEl1TVRNdExqazFMVEl1TVRNdE1pNHhNaUF3TFRFdU1UY3VPVFl0TWk0eE15QXlMakV6TFRJdU1UTWdNUzR4T0NBd0lESXVNVEl1T1RZZ01pNHhNaUF5TGpFemN5MHVPVFVnTWk0eE1pMHlMakV5SURJdU1USjZiVGtnTUdNdE1TNHhOeUF3TFRJdU1UTXRMamsxTFRJdU1UTXRNaTR4TWlBd0xURXVNVGN1T1RZdE1pNHhNeUF5TGpFekxUSXVNVE56TWk0eE1pNDVOaUF5TGpFeUlESXVNVE10TGprMUlESXVNVEl0TWk0eE1pQXlMakV5ZWlJdlBnb2dJQ0FnUEhCaGRHZ2dabWxzYkQwaWJtOXVaU0lnWkQwaVRUQWdNR2d5TkhZeU5FZ3dWakI2SWk4K0Nqd3ZjM1puUGdvPScpO1xuICB0aGlzLklDT05TLmZ1bGxzY3JlZW4gPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NQ0F3YURJMGRqSTBTREI2SWlCbWFXeHNQU0p1YjI1bElpOCtDaUFnSUNBOGNHRjBhQ0JrUFNKTk55QXhORWcxZGpWb05YWXRNa2czZGkwemVtMHRNaTAwYURKV04yZ3pWalZJTlhZMWVtMHhNaUEzYUMwemRqSm9OWFl0TldndE1uWXplazB4TkNBMWRqSm9NM1l6YURKV05XZ3ROWG9pTHo0S1BDOXpkbWMrQ2c9PScpO1xuICB0aGlzLklDT05TLmV4aXRGdWxsc2NyZWVuID0gVXRpbC5iYXNlNjQoJ2ltYWdlL3N2Zyt4bWwnLCAnUEhOMlp5QjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIZHBaSFJvUFNJeU5IQjRJaUJvWldsbmFIUTlJakkwY0hnaUlIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSWdabWxzYkQwaUkwWkdSa1pHUmlJK0NpQWdJQ0E4Y0dGMGFDQmtQU0pOTUNBd2FESTBkakkwU0RCNklpQm1hV3hzUFNKdWIyNWxJaTgrQ2lBZ0lDQThjR0YwYUNCa1BTSk5OU0F4Tm1nemRqTm9Nbll0TlVnMWRqSjZiVE10T0VnMWRqSm9OVlkxU0RoMk0zcHROaUF4TVdneWRpMHphRE4yTFRKb0xUVjJOWHB0TWkweE1WWTFhQzB5ZGpWb05WWTRhQzB6ZWlJdlBnbzhMM04yWno0SycpO1xuICB0aGlzLklDT05TLnNldHRpbmdzID0gVXRpbC5iYXNlNjQoJ2ltYWdlL3N2Zyt4bWwnLCAnUEhOMlp5QjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIZHBaSFJvUFNJeU5IQjRJaUJvWldsbmFIUTlJakkwY0hnaUlIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSWdabWxzYkQwaUkwWkdSa1pHUmlJK0NpQWdJQ0E4Y0dGMGFDQmtQU0pOTUNBd2FESTBkakkwU0RCNklpQm1hV3hzUFNKdWIyNWxJaTgrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NVGt1TkRNZ01USXVPVGhqTGpBMExTNHpNaTR3TnkwdU5qUXVNRGN0TGprNGN5MHVNRE10TGpZMkxTNHdOeTB1T1Roc01pNHhNUzB4TGpZMVl5NHhPUzB1TVRVdU1qUXRMalF5TGpFeUxTNDJOR3d0TWkwekxqUTJZeTB1TVRJdExqSXlMUzR6T1MwdU15MHVOakV0TGpJeWJDMHlMalE1SURGakxTNDFNaTB1TkMweExqQTRMUzQzTXkweExqWTVMUzQ1T0d3dExqTTRMVEl1TmpWRE1UUXVORFlnTWk0eE9DQXhOQzR5TlNBeUlERTBJREpvTFRSakxTNHlOU0F3TFM0ME5pNHhPQzB1TkRrdU5ESnNMUzR6T0NBeUxqWTFZeTB1TmpFdU1qVXRNUzR4Tnk0MU9TMHhMalk1TGprNGJDMHlMalE1TFRGakxTNHlNeTB1TURrdExqUTVJREF0TGpZeExqSXliQzB5SURNdU5EWmpMUzR4TXk0eU1pMHVNRGN1TkRrdU1USXVOalJzTWk0eE1TQXhMalkxWXkwdU1EUXVNekl0TGpBM0xqWTFMUzR3Tnk0NU9ITXVNRE11TmpZdU1EY3VPVGhzTFRJdU1URWdNUzQyTldNdExqRTVMakUxTFM0eU5DNDBNaTB1TVRJdU5qUnNNaUF6TGpRMll5NHhNaTR5TWk0ek9TNHpMall4TGpJeWJESXVORGt0TVdNdU5USXVOQ0F4TGpBNExqY3pJREV1TmprdU9UaHNMak00SURJdU5qVmpMakF6TGpJMExqSTBMalF5TGpRNUxqUXlhRFJqTGpJMUlEQWdMalEyTFM0eE9DNDBPUzB1TkRKc0xqTTRMVEl1TmpWakxqWXhMUzR5TlNBeExqRTNMUzQxT1NBeExqWTVMUzQ1T0d3eUxqUTVJREZqTGpJekxqQTVMalE1SURBZ0xqWXhMUzR5TW13eUxUTXVORFpqTGpFeUxTNHlNaTR3TnkwdU5Ea3RMakV5TFM0Mk5Hd3RNaTR4TVMweExqWTFlazB4TWlBeE5TNDFZeTB4TGpreklEQXRNeTQxTFRFdU5UY3RNeTQxTFRNdU5YTXhMalUzTFRNdU5TQXpMalV0TXk0MUlETXVOU0F4TGpVM0lETXVOU0F6TGpVdE1TNDFOeUF6TGpVdE15NDFJRE11TlhvaUx6NEtQQzl6ZG1jK0NnPT0nKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uTWFuYWdlcjtcblxufSx7XCIuL2VtaXR0ZXIuanNcIjoyLFwiLi9tb2Rlcy5qc1wiOjMsXCIuL3V0aWwuanNcIjo0fV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5mdW5jdGlvbiBFbWl0dGVyKCkge1xuICB0aGlzLmNhbGxiYWNrcyA9IHt9O1xufVxuXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnROYW1lKSB7XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdO1xuICBpZiAoIWNhbGxiYWNrcykge1xuICAgIC8vY29uc29sZS5sb2coJ05vIHZhbGlkIGNhbGxiYWNrIHNwZWNpZmllZC4nKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gIC8vIEVsaW1pbmF0ZSB0aGUgZmlyc3QgcGFyYW0gKHRoZSBjYWxsYmFjaykuXG4gIGFyZ3Muc2hpZnQoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBjYWxsYmFja3NbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cbn07XG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICBpZiAoZXZlbnROYW1lIGluIHRoaXMuY2FsbGJhY2tzKSB7XG4gICAgdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdID0gW2NhbGxiYWNrXTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xuXG59LHt9XSwzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBNb2RlcyA9IHtcbiAgVU5LTk9XTjogMCxcbiAgLy8gTm90IGZ1bGxzY3JlZW4sIGp1c3QgdHJhY2tpbmcuXG4gIE5PUk1BTDogMSxcbiAgLy8gTWFnaWMgd2luZG93IGltbWVyc2l2ZSBtb2RlLlxuICBNQUdJQ19XSU5ET1c6IDIsXG4gIC8vIEZ1bGwgc2NyZWVuIHNwbGl0IHNjcmVlbiBWUiBtb2RlLlxuICBWUjogMyxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZXM7XG5cbn0se31dLDQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSB7fTtcblxuVXRpbC5iYXNlNjQgPSBmdW5jdGlvbihtaW1lVHlwZSwgYmFzZTY0KSB7XG4gIHJldHVybiAnZGF0YTonICsgbWltZVR5cGUgKyAnO2Jhc2U2NCwnICsgYmFzZTY0O1xufTtcblxuVXRpbC5pc01vYmlsZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2hlY2sgPSBmYWxzZTtcbiAgKGZ1bmN0aW9uKGEpe2lmKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcmlzfGtpbmRsZXxsZ2UgfG1hZW1vfG1pZHB8bW1wfG1vYmlsZS4rZmlyZWZveHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyBjZXx4ZGF8eGlpbm8vaS50ZXN0KGEpfHwvMTIwN3w2MzEwfDY1OTB8M2dzb3w0dGhwfDUwWzEtNl1pfDc3MHN8ODAyc3xhIHdhfGFiYWN8YWMoZXJ8b298c1xcLSl8YWkoa298cm4pfGFsKGF2fGNhfGNvKXxhbW9pfGFuKGV4fG55fHl3KXxhcHR1fGFyKGNofGdvKXxhcyh0ZXx1cyl8YXR0d3xhdShkaXxcXC1tfHIgfHMgKXxhdmFufGJlKGNrfGxsfG5xKXxiaShsYnxyZCl8YmwoYWN8YXopfGJyKGV8dil3fGJ1bWJ8YndcXC0obnx1KXxjNTVcXC98Y2FwaXxjY3dhfGNkbVxcLXxjZWxsfGNodG18Y2xkY3xjbWRcXC18Y28obXB8bmQpfGNyYXd8ZGEoaXR8bGx8bmcpfGRidGV8ZGNcXC1zfGRldml8ZGljYXxkbW9ifGRvKGN8cClvfGRzKDEyfFxcLWQpfGVsKDQ5fGFpKXxlbShsMnx1bCl8ZXIoaWN8azApfGVzbDh8ZXooWzQtN10wfG9zfHdhfHplKXxmZXRjfGZseShcXC18Xyl8ZzEgdXxnNTYwfGdlbmV8Z2ZcXC01fGdcXC1tb3xnbyhcXC53fG9kKXxncihhZHx1bil8aGFpZXxoY2l0fGhkXFwtKG18cHx0KXxoZWlcXC18aGkocHR8dGEpfGhwKCBpfGlwKXxoc1xcLWN8aHQoYyhcXC18IHxffGF8Z3xwfHN8dCl8dHApfGh1KGF3fHRjKXxpXFwtKDIwfGdvfG1hKXxpMjMwfGlhYyggfFxcLXxcXC8pfGlicm98aWRlYXxpZzAxfGlrb218aW0xa3xpbm5vfGlwYXF8aXJpc3xqYSh0fHYpYXxqYnJvfGplbXV8amlnc3xrZGRpfGtlaml8a2d0KCB8XFwvKXxrbG9ufGtwdCB8a3djXFwtfGt5byhjfGspfGxlKG5vfHhpKXxsZyggZ3xcXC8oa3xsfHUpfDUwfDU0fFxcLVthLXddKXxsaWJ3fGx5bnh8bTFcXC13fG0zZ2F8bTUwXFwvfG1hKHRlfHVpfHhvKXxtYygwMXwyMXxjYSl8bVxcLWNyfG1lKHJjfHJpKXxtaShvOHxvYXx0cyl8bW1lZnxtbygwMXwwMnxiaXxkZXxkb3x0KFxcLXwgfG98dil8enopfG10KDUwfHAxfHYgKXxtd2JwfG15d2F8bjEwWzAtMl18bjIwWzItM118bjMwKDB8Mil8bjUwKDB8Mnw1KXxuNygwKDB8MSl8MTApfG5lKChjfG0pXFwtfG9ufHRmfHdmfHdnfHd0KXxub2soNnxpKXxuenBofG8yaW18b3AodGl8d3YpfG9yYW58b3dnMXxwODAwfHBhbihhfGR8dCl8cGR4Z3xwZygxM3xcXC0oWzEtOF18YykpfHBoaWx8cGlyZXxwbChheXx1Yyl8cG5cXC0yfHBvKGNrfHJ0fHNlKXxwcm94fHBzaW98cHRcXC1nfHFhXFwtYXxxYygwN3wxMnwyMXwzMnw2MHxcXC1bMi03XXxpXFwtKXxxdGVrfHIzODB8cjYwMHxyYWtzfHJpbTl8cm8odmV8em8pfHM1NVxcL3xzYShnZXxtYXxtbXxtc3xueXx2YSl8c2MoMDF8aFxcLXxvb3xwXFwtKXxzZGtcXC98c2UoYyhcXC18MHwxKXw0N3xtY3xuZHxyaSl8c2doXFwtfHNoYXJ8c2llKFxcLXxtKXxza1xcLTB8c2woNDV8aWQpfHNtKGFsfGFyfGIzfGl0fHQ1KXxzbyhmdHxueSl8c3AoMDF8aFxcLXx2XFwtfHYgKXxzeSgwMXxtYil8dDIoMTh8NTApfHQ2KDAwfDEwfDE4KXx0YShndHxsayl8dGNsXFwtfHRkZ1xcLXx0ZWwoaXxtKXx0aW1cXC18dFxcLW1vfHRvKHBsfHNoKXx0cyg3MHxtXFwtfG0zfG01KXx0eFxcLTl8dXAoXFwuYnxnMXxzaSl8dXRzdHx2NDAwfHY3NTB8dmVyaXx2aShyZ3x0ZSl8dmsoNDB8NVswLTNdfFxcLXYpfHZtNDB8dm9kYXx2dWxjfHZ4KDUyfDUzfDYwfDYxfDcwfDgwfDgxfDgzfDg1fDk4KXx3M2MoXFwtfCApfHdlYmN8d2hpdHx3aShnIHxuY3xudyl8d21sYnx3b251fHg3MDB8eWFzXFwtfHlvdXJ8emV0b3x6dGVcXC0vaS50ZXN0KGEuc3Vic3RyKDAsNCkpKWNoZWNrID0gdHJ1ZX0pKG5hdmlnYXRvci51c2VyQWdlbnR8fG5hdmlnYXRvci52ZW5kb3J8fHdpbmRvdy5vcGVyYSk7XG4gIHJldHVybiBjaGVjaztcbn07XG5cblV0aWwuaXNGaXJlZm94ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAvZmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59O1xuXG5VdGlsLmlzSU9TID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAvKGlQYWR8aVBob25lfGlQb2QpL2cudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbn07XG5cblV0aWwuaXNJRnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93LnNlbGYgIT09IHdpbmRvdy50b3A7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTtcblxuVXRpbC5hcHBlbmRRdWVyeVBhcmFtZXRlciA9IGZ1bmN0aW9uKHVybCwga2V5LCB2YWx1ZSkge1xuICAvLyBEZXRlcm1pbmUgZGVsaW1pdGVyIGJhc2VkIG9uIGlmIHRoZSBVUkwgYWxyZWFkeSBHRVQgcGFyYW1ldGVycyBpbiBpdC5cbiAgdmFyIGRlbGltaXRlciA9ICh1cmwuaW5kZXhPZignPycpIDwgMCA/ICc/JyA6ICcmJyk7XG4gIHVybCArPSBkZWxpbWl0ZXIgKyBrZXkgKyAnPScgKyB2YWx1ZTtcbiAgcmV0dXJuIHVybDtcbn07XG5cbi8vIEZyb20gaHR0cDovL2dvby5nbC80V1gzdGdcblV0aWwuZ2V0UXVlcnlQYXJhbWV0ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXS8sIFwiXFxcXFtcIikucmVwbGFjZSgvW1xcXV0vLCBcIlxcXFxdXCIpO1xuICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiW1xcXFw/Jl1cIiArIG5hbWUgKyBcIj0oW14mI10qKVwiKSxcbiAgICAgIHJlc3VsdHMgPSByZWdleC5leGVjKGxvY2F0aW9uLnNlYXJjaCk7XG4gIHJldHVybiByZXN1bHRzID09PSBudWxsID8gXCJcIiA6IGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzFdLnJlcGxhY2UoL1xcKy9nLCBcIiBcIikpO1xufTtcblxuVXRpbC5pc0xhbmRzY2FwZU1vZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh3aW5kb3cub3JpZW50YXRpb24gPT0gOTAgfHwgd2luZG93Lm9yaWVudGF0aW9uID09IC05MCk7XG59O1xuXG5VdGlsLmdldFNjcmVlbldpZHRoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLm1heCh3aW5kb3cuc2NyZWVuLndpZHRoLCB3aW5kb3cuc2NyZWVuLmhlaWdodCkgKlxuICAgICAgd2luZG93LmRldmljZVBpeGVsUmF0aW87XG59O1xuXG5VdGlsLmdldFNjcmVlbkhlaWdodCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5taW4od2luZG93LnNjcmVlbi53aWR0aCwgd2luZG93LnNjcmVlbi5oZWlnaHQpICpcbiAgICAgIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBVdGlsO1xuXG59LHt9XSw1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBCdXR0b25NYW5hZ2VyID0gX2RlcmVxXygnLi9idXR0b24tbWFuYWdlci5qcycpO1xudmFyIEVtaXR0ZXIgPSBfZGVyZXFfKCcuL2VtaXR0ZXIuanMnKTtcbnZhciBNb2RlcyA9IF9kZXJlcV8oJy4vbW9kZXMuanMnKTtcbnZhciBVdGlsID0gX2RlcmVxXygnLi91dGlsLmpzJyk7XG5cbi8qKlxuICogSGVscGVyIGZvciBnZXR0aW5nIGluIGFuZCBvdXQgb2YgVlIgbW9kZS5cbiAqL1xuZnVuY3Rpb24gV2ViVlJNYW5hZ2VyKHJlbmRlcmVyLCBlZmZlY3QsIHBhcmFtcykge1xuICB0aGlzLnBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcbiAgdGhpcy5tb2RlID0gTW9kZXMuVU5LTk9XTjtcblxuICAvLyBTZXQgb3B0aW9uIHRvIGhpZGUgdGhlIGJ1dHRvbi5cbiAgdGhpcy5oaWRlQnV0dG9uID0gdGhpcy5wYXJhbXMuaGlkZUJ1dHRvbiB8fCBmYWxzZTtcbiAgLy8gV2hldGhlciBvciBub3QgdGhlIEZPViBzaG91bGQgYmUgZGlzdG9ydGVkIG9yIHVuLWRpc3RvcnRlZC4gQnkgZGVmYXVsdCwgaXRcbiAgLy8gc2hvdWxkIGJlIGRpc3RvcnRlZCwgYnV0IGluIHRoZSBjYXNlIG9mIHZlcnRleCBzaGFkZXIgYmFzZWQgZGlzdG9ydGlvbixcbiAgLy8gZW5zdXJlIHRoYXQgd2UgdXNlIHVuZGlzdG9ydGVkIHBhcmFtZXRlcnMuXG4gIHRoaXMucHJlZGlzdG9ydGVkID0gISF0aGlzLnBhcmFtcy5wcmVkaXN0b3J0ZWQ7XG5cbiAgLy8gU2F2ZSB0aGUgVEhSRUUuanMgcmVuZGVyZXIgYW5kIGVmZmVjdCBmb3IgbGF0ZXIuXG4gIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgdGhpcy5lZmZlY3QgPSBlZmZlY3Q7XG4gIHZhciBwb2x5ZmlsbFdyYXBwZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcud2VidnItcG9seWZpbGwtZnVsbHNjcmVlbi13cmFwcGVyJyk7XG4gIHRoaXMuYnV0dG9uID0gbmV3IEJ1dHRvbk1hbmFnZXIocG9seWZpbGxXcmFwcGVyKTtcblxuICB0aGlzLmlzRnVsbHNjcmVlbkRpc2FibGVkID0gISFVdGlsLmdldFF1ZXJ5UGFyYW1ldGVyKCdub19mdWxsc2NyZWVuJyk7XG4gIHRoaXMuc3RhcnRNb2RlID0gTW9kZXMuTk9STUFMO1xuICB2YXIgc3RhcnRNb2RlUGFyYW0gPSBwYXJzZUludChVdGlsLmdldFF1ZXJ5UGFyYW1ldGVyKCdzdGFydF9tb2RlJykpO1xuICBpZiAoIWlzTmFOKHN0YXJ0TW9kZVBhcmFtKSkge1xuICAgIHRoaXMuc3RhcnRNb2RlID0gc3RhcnRNb2RlUGFyYW07XG4gIH1cblxuICBpZiAodGhpcy5oaWRlQnV0dG9uKSB7XG4gICAgdGhpcy5idXR0b24uc2V0VmlzaWJpbGl0eShmYWxzZSk7XG4gIH1cblxuICAvLyBDaGVjayBpZiB0aGUgYnJvd3NlciBpcyBjb21wYXRpYmxlIHdpdGggV2ViVlIuXG4gIHRoaXMuZ2V0RGV2aWNlQnlUeXBlXyhWUkRpc3BsYXkpLnRoZW4oZnVuY3Rpb24oaG1kKSB7XG4gICAgdGhpcy5obWQgPSBobWQ7XG4gICAgLy8gT25seSBlbmFibGUgVlIgbW9kZSBpZiB0aGVyZSdzIGEgVlIgZGV2aWNlIGF0dGFjaGVkIG9yIHdlIGFyZSBydW5uaW5nIHRoZVxuICAgIC8vIHBvbHlmaWxsIG9uIG1vYmlsZS5cbiAgICBpZiAoIXRoaXMuaXNWUkNvbXBhdGlibGVPdmVycmlkZSkge1xuICAgICAgdGhpcy5pc1ZSQ29tcGF0aWJsZSA9ICAhVlJEaXNwbGF5LmlzUG9seWZpbGxlZCB8fCBVdGlsLmlzTW9iaWxlKCk7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0aGlzLnN0YXJ0TW9kZSkge1xuICAgICAgY2FzZSBNb2Rlcy5NQUdJQ19XSU5ET1c6XG4gICAgICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuTUFHSUNfV0lORE9XKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE1vZGVzLlZSOlxuICAgICAgICB0aGlzLmVudGVyVlJNb2RlXygpO1xuICAgICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLlZSKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk5PUk1BTCk7XG4gICAgfVxuXG4gICAgdGhpcy5lbWl0KCdpbml0aWFsaXplZCcpO1xuICB9LmJpbmQodGhpcykpO1xuXG4gIC8vIEhvb2sgdXAgYnV0dG9uIGxpc3RlbmVycy5cbiAgdGhpcy5idXR0b24ub24oJ2ZzJywgdGhpcy5vbkZTQ2xpY2tfLmJpbmQodGhpcykpO1xuICB0aGlzLmJ1dHRvbi5vbigndnInLCB0aGlzLm9uVlJDbGlja18uYmluZCh0aGlzKSk7XG5cbiAgLy8gQmluZCB0byBmdWxsc2NyZWVuIGV2ZW50cy5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsXG4gICAgICB0aGlzLm9uRnVsbHNjcmVlbkNoYW5nZV8uYmluZCh0aGlzKSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLFxuICAgICAgdGhpcy5vbkZ1bGxzY3JlZW5DaGFuZ2VfLmJpbmQodGhpcykpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5jaGFuZ2UnLFxuICAgICAgdGhpcy5vbkZ1bGxzY3JlZW5DaGFuZ2VfLmJpbmQodGhpcykpO1xuXG4gIC8vIEJpbmQgdG8gVlIqIHNwZWNpZmljIGV2ZW50cy5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3ZyZGlzcGxheXByZXNlbnRjaGFuZ2UnLFxuICAgICAgdGhpcy5vblZSRGlzcGxheVByZXNlbnRDaGFuZ2VfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndnJkaXNwbGF5ZGV2aWNlcGFyYW1zY2hhbmdlJyxcbiAgICAgIHRoaXMub25WUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfLmJpbmQodGhpcykpO1xufVxuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlID0gbmV3IEVtaXR0ZXIoKTtcblxuLy8gRXhwb3NlIHRoZXNlIHZhbHVlcyBleHRlcm5hbGx5LlxuV2ViVlJNYW5hZ2VyLk1vZGVzID0gTW9kZXM7XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc2NlbmUsIGNhbWVyYSwgdGltZXN0YW1wKSB7XG4gIC8vIFNjZW5lIG1heSBiZSBhbiBhcnJheSBvZiB0d28gc2NlbmVzLCBvbmUgZm9yIGVhY2ggZXllLlxuICBpZiAoc2NlbmUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIHRoaXMuZWZmZWN0LnJlbmRlcihzY2VuZVswXSwgY2FtZXJhKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmVmZmVjdC5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gIH1cbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuc2V0VlJDb21wYXRpYmxlT3ZlcnJpZGUgPSBmdW5jdGlvbihpc1ZSQ29tcGF0aWJsZSkge1xuICB0aGlzLmlzVlJDb21wYXRpYmxlID0gaXNWUkNvbXBhdGlibGU7XG4gIHRoaXMuaXNWUkNvbXBhdGlibGVPdmVycmlkZSA9IHRydWU7XG5cbiAgLy8gRG9uJ3QgYWN0dWFsbHkgY2hhbmdlIG1vZGVzLCBqdXN0IHVwZGF0ZSB0aGUgYnV0dG9ucy5cbiAgdGhpcy5idXR0b24uc2V0TW9kZSh0aGlzLm1vZGUsIHRoaXMuaXNWUkNvbXBhdGlibGUpO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5zZXRGdWxsc2NyZWVuQ2FsbGJhY2sgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB0aGlzLmZ1bGxzY3JlZW5DYWxsYmFjayA9IGNhbGxiYWNrO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5zZXRWUkNhbGxiYWNrID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdGhpcy52ckNhbGxiYWNrID0gY2FsbGJhY2s7XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnNldEV4aXRGdWxsc2NyZWVuQ2FsbGJhY2sgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB0aGlzLmV4aXRGdWxsc2NyZWVuQ2FsbGJhY2sgPSBjYWxsYmFjaztcbn1cblxuLyoqXG4gKiBQcm9taXNlIHJldHVybnMgdHJ1ZSBpZiB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgSE1EIGRldmljZSBhdmFpbGFibGUuXG4gKi9cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuZ2V0RGV2aWNlQnlUeXBlXyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKCkudGhlbihmdW5jdGlvbihkaXNwbGF5cykge1xuICAgICAgLy8gUHJvbWlzZSBzdWNjZWVkcywgYnV0IGNoZWNrIGlmIHRoZXJlIGFyZSBhbnkgZGlzcGxheXMgYWN0dWFsbHkuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpc3BsYXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGRpc3BsYXlzW2ldLCBkaXNwbGF5c1tpXS5jb25zdHJ1Y3RvciwgdHlwZSk7XG4gICAgICAgIC8vIGlmIChkaXNwbGF5c1tpXSBpbnN0YW5jZW9mIHR5cGUpIHtcbiAgICAgICAgICByZXNvbHZlKGRpc3BsYXlzW2ldKTtcbiAgICAgICAgLy8gICBicmVhaztcbiAgICAgICAgLy8gfVxuICAgICAgfVxuICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgIC8vIE5vIGRpc3BsYXlzIGFyZSBmb3VuZC5cbiAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBIZWxwZXIgZm9yIGVudGVyaW5nIFZSIG1vZGUuXG4gKi9cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuZW50ZXJWUk1vZGVfID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuaG1kLnJlcXVlc3RQcmVzZW50KFt7XG4gICAgc291cmNlOiB0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQsXG4gICAgcHJlZGlzdG9ydGVkOiB0aGlzLnByZWRpc3RvcnRlZFxuICB9XSk7XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnNldE1vZGVfID0gZnVuY3Rpb24obW9kZSkge1xuICB2YXIgb2xkTW9kZSA9IHRoaXMubW9kZTtcbiAgaWYgKG1vZGUgPT0gdGhpcy5tb2RlKSB7XG4gICAgY29uc29sZS53YXJuKCdOb3QgY2hhbmdpbmcgbW9kZXMsIGFscmVhZHkgaW4gJXMnLCBtb2RlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gY29uc29sZS5sb2coJ01vZGUgY2hhbmdlOiAlcyA9PiAlcycsIHRoaXMubW9kZSwgbW9kZSk7XG4gIHRoaXMubW9kZSA9IG1vZGU7XG4gIHRoaXMuYnV0dG9uLnNldE1vZGUobW9kZSwgdGhpcy5pc1ZSQ29tcGF0aWJsZSk7XG5cbiAgLy8gRW1pdCBhbiBldmVudCBpbmRpY2F0aW5nIHRoZSBtb2RlIGNoYW5nZWQuXG4gIHRoaXMuZW1pdCgnbW9kZWNoYW5nZScsIG1vZGUsIG9sZE1vZGUpO1xufTtcblxuLyoqXG4gKiBNYWluIGJ1dHRvbiB3YXMgY2xpY2tlZC5cbiAqL1xuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vbkZTQ2xpY2tfID0gZnVuY3Rpb24oKSB7XG4gIHN3aXRjaCAodGhpcy5tb2RlKSB7XG4gICAgY2FzZSBNb2Rlcy5OT1JNQUw6XG4gICAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBoYWNrIGlmL3doZW4gaU9TIGdldHMgcmVhbCBmdWxsc2NyZWVuIG1vZGUuXG4gICAgICAvLyBJZiB0aGlzIGlzIGFuIGlmcmFtZSBvbiBpT1MsIGJyZWFrIG91dCBhbmQgb3BlbiBpbiBub19mdWxsc2NyZWVuIG1vZGUuXG4gICAgICBpZiAoVXRpbC5pc0lPUygpICYmIFV0aWwuaXNJRnJhbWUoKSkge1xuICAgICAgICBpZiAodGhpcy5mdWxsc2NyZWVuQ2FsbGJhY2spIHtcbiAgICAgICAgICB0aGlzLmZ1bGxzY3JlZW5DYWxsYmFjaygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgICB1cmwgPSBVdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyKHVybCwgJ25vX2Z1bGxzY3JlZW4nLCAndHJ1ZScpO1xuICAgICAgICAgIHVybCA9IFV0aWwuYXBwZW5kUXVlcnlQYXJhbWV0ZXIodXJsLCAnc3RhcnRfbW9kZScsIE1vZGVzLk1BR0lDX1dJTkRPVyk7XG4gICAgICAgICAgdG9wLmxvY2F0aW9uLmhyZWYgPSB1cmw7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk1BR0lDX1dJTkRPVyk7XG4gICAgICB0aGlzLnJlcXVlc3RGdWxsc2NyZWVuXygpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNb2Rlcy5NQUdJQ19XSU5ET1c6XG4gICAgICBpZiAodGhpcy5pc0Z1bGxzY3JlZW5EaXNhYmxlZCkge1xuICAgICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmV4aXRGdWxsc2NyZWVuQ2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5leGl0RnVsbHNjcmVlbkNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk5PUk1BTCk7XG4gICAgICB0aGlzLmV4aXRGdWxsc2NyZWVuXygpO1xuICAgICAgYnJlYWs7XG4gIH1cbn07XG5cbi8qKlxuICogVGhlIFZSIGJ1dHRvbiB3YXMgY2xpY2tlZC5cbiAqL1xuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vblZSQ2xpY2tfID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRPRE86IFJlbW92ZSB0aGlzIGhhY2sgd2hlbiBpT1MgaGFzIGZ1bGxzY3JlZW4gbW9kZS5cbiAgLy8gSWYgdGhpcyBpcyBhbiBpZnJhbWUgb24gaU9TLCBicmVhayBvdXQgYW5kIG9wZW4gaW4gbm9fZnVsbHNjcmVlbiBtb2RlLlxuICBpZiAodGhpcy5tb2RlID09IE1vZGVzLk5PUk1BTCAmJiBVdGlsLmlzSU9TKCkgJiYgVXRpbC5pc0lGcmFtZSgpKSB7XG4gICAgaWYgKHRoaXMudnJDYWxsYmFjaykge1xuICAgICAgdGhpcy52ckNhbGxiYWNrKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgIHVybCA9IFV0aWwuYXBwZW5kUXVlcnlQYXJhbWV0ZXIodXJsLCAnbm9fZnVsbHNjcmVlbicsICd0cnVlJyk7XG4gICAgICB1cmwgPSBVdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyKHVybCwgJ3N0YXJ0X21vZGUnLCBNb2Rlcy5WUik7XG4gICAgICB0b3AubG9jYXRpb24uaHJlZiA9IHVybDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbiAgdGhpcy5lbnRlclZSTW9kZV8oKTtcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUucmVxdWVzdEZ1bGxzY3JlZW5fID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5ib2R5O1xuICAvL3ZhciBjYW52YXMgPSB0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQ7XG4gIGlmIChjYW52YXMucmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBjYW52YXMucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChjYW52YXMubW96UmVxdWVzdEZ1bGxTY3JlZW4pIHtcbiAgICBjYW52YXMubW96UmVxdWVzdEZ1bGxTY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChjYW52YXMud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBjYW52YXMud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChjYW52YXMubXNSZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgIGNhbnZhcy5tc1JlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH1cbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuZXhpdEZ1bGxzY3JlZW5fID0gZnVuY3Rpb24oKSB7XG4gIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbikge1xuICAgIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNFeGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4oKTtcbiAgfVxufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vblZSRGlzcGxheVByZXNlbnRDaGFuZ2VfID0gZnVuY3Rpb24oZSkge1xuICBjb25zb2xlLmxvZygnb25WUkRpc3BsYXlQcmVzZW50Q2hhbmdlXycsIGUpO1xuICBpZiAodGhpcy5obWQuaXNQcmVzZW50aW5nKSB7XG4gICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5WUik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5OT1JNQUwpO1xuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLm9uVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgY29uc29sZS5sb2coJ29uVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXycsIGUpO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vbkZ1bGxzY3JlZW5DaGFuZ2VfID0gZnVuY3Rpb24oZSkge1xuICAvLyBJZiB3ZSBsZWF2ZSBmdWxsLXNjcmVlbiwgZ28gYmFjayB0byBub3JtYWwgbW9kZS5cbiAgaWYgKGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50ID09PSBudWxsIHx8XG4gICAgICBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCA9PT0gbnVsbCkge1xuICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuTk9STUFMKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWJWUk1hbmFnZXI7XG5cbn0se1wiLi9idXR0b24tbWFuYWdlci5qc1wiOjEsXCIuL2VtaXR0ZXIuanNcIjoyLFwiLi9tb2Rlcy5qc1wiOjMsXCIuL3V0aWwuanNcIjo0fV19LHt9LFs1XSkoNSlcbn0pO1xuIiwiKGZ1bmN0aW9uKGYpe2lmKHR5cGVvZiBleHBvcnRzPT09XCJvYmplY3RcIiYmdHlwZW9mIG1vZHVsZSE9PVwidW5kZWZpbmVkXCIpe21vZHVsZS5leHBvcnRzPWYoKX1lbHNlIGlmKHR5cGVvZiBkZWZpbmU9PT1cImZ1bmN0aW9uXCImJmRlZmluZS5hbWQpe2RlZmluZShbXSxmKX1lbHNle3ZhciBnO2lmKHR5cGVvZiB3aW5kb3chPT1cInVuZGVmaW5lZFwiKXtnPXdpbmRvd31lbHNlIGlmKHR5cGVvZiBnbG9iYWwhPT1cInVuZGVmaW5lZFwiKXtnPWdsb2JhbH1lbHNlIGlmKHR5cGVvZiBzZWxmIT09XCJ1bmRlZmluZWRcIil7Zz1zZWxmfWVsc2V7Zz10aGlzfWcuV2ViVlJQb2x5ZmlsbCA9IGYoKX19KShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCBwcmVmaXggPSAnfic7XG5cbi8qKlxuICogQ29uc3RydWN0b3IgdG8gY3JlYXRlIGEgc3RvcmFnZSBmb3Igb3VyIGBFRWAgb2JqZWN0cy5cbiAqIEFuIGBFdmVudHNgIGluc3RhbmNlIGlzIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEV2ZW50cygpIHt9XG5cbi8vXG4vLyBXZSB0cnkgdG8gbm90IGluaGVyaXQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuIEluIHNvbWUgZW5naW5lcyBjcmVhdGluZyBhblxuLy8gaW5zdGFuY2UgaW4gdGhpcyB3YXkgaXMgZmFzdGVyIHRoYW4gY2FsbGluZyBgT2JqZWN0LmNyZWF0ZShudWxsKWAgZGlyZWN0bHkuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gY2hhcmFjdGVyIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90XG4vLyBvdmVycmlkZGVuIG9yIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vXG5pZiAoT2JqZWN0LmNyZWF0ZSkge1xuICBFdmVudHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvL1xuICAvLyBUaGlzIGhhY2sgaXMgbmVlZGVkIGJlY2F1c2UgdGhlIGBfX3Byb3RvX19gIHByb3BlcnR5IGlzIHN0aWxsIGluaGVyaXRlZCBpblxuICAvLyBzb21lIG9sZCBicm93c2VycyBsaWtlIEFuZHJvaWQgNCwgaVBob25lIDUuMSwgT3BlcmEgMTEgYW5kIFNhZmFyaSA1LlxuICAvL1xuICBpZiAoIW5ldyBFdmVudHMoKS5fX3Byb3RvX18pIHByZWZpeCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIGV2ZW50IGxpc3RlbmVyLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gU3BlY2lmeSBpZiB0aGUgbGlzdGVuZXIgaXMgYSBvbmUtdGltZSBsaXN0ZW5lci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBgRXZlbnRFbWl0dGVyYCBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xufVxuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIG5hbWVzID0gW11cbiAgICAsIGV2ZW50c1xuICAgICwgbmFtZTtcblxuICBpZiAodGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gKGV2ZW50cyA9IHRoaXMuX2V2ZW50cykpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgT25seSBjaGVjayBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIENhbGxzIGVhY2ggb2YgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBlbHNlIGBmYWxzZWAuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBjYXNlIDQ6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIsIGEzKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogQWRkIGEgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXIsIHRoaXMuX2V2ZW50c0NvdW50Kys7XG4gIGVsc2UgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGEgb25lLXRpbWUgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCB0aGlzLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW3RoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgbGlzdGVuZXJzIG9mIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBtYXRjaCB0aGlzIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgaGF2ZSB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25lLXRpbWUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcbiAgaWYgKCFmbikge1xuICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChcbiAgICAgICAgIGxpc3RlbmVycy5mbiA9PT0gZm5cbiAgICAgICYmICghb25jZSB8fCBsaXN0ZW5lcnMub25jZSlcbiAgICAgICYmICghY29udGV4dCB8fCBsaXN0ZW5lcnMuY29udGV4dCA9PT0gY29udGV4dClcbiAgICApIHtcbiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50cyA9IFtdLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gICAgLy9cbiAgICBpZiAoZXZlbnRzLmxlbmd0aCkgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICAgIGVsc2UgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycywgb3IgdGhvc2Ugb2YgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IFtldmVudF0gVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICB2YXIgZXZ0O1xuXG4gIGlmIChldmVudCkge1xuICAgIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG4gICAgaWYgKHRoaXMuX2V2ZW50c1tldnRdKSB7XG4gICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEFsbG93IGBFdmVudEVtaXR0ZXJgIHRvIGJlIGltcG9ydGVkIGFzIG1vZHVsZSBuYW1lc3BhY2UuXG4vL1xuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cblxufSx7fV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwcm9wSXNFbnVtZXJhYmxlID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuZnVuY3Rpb24gdG9PYmplY3QodmFsKSB7XG5cdGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QuYXNzaWduIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHR9XG5cblx0cmV0dXJuIE9iamVjdCh2YWwpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRVc2VOYXRpdmUoKSB7XG5cdHRyeSB7XG5cdFx0aWYgKCFPYmplY3QuYXNzaWduKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gRGV0ZWN0IGJ1Z2d5IHByb3BlcnR5IGVudW1lcmF0aW9uIG9yZGVyIGluIG9sZGVyIFY4IHZlcnNpb25zLlxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9NDExOFxuXHRcdHZhciB0ZXN0MSA9IG5ldyBTdHJpbmcoJ2FiYycpOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuXHRcdHRlc3QxWzVdID0gJ2RlJztcblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDEpWzBdID09PSAnNScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QyID0ge307XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHR0ZXN0MlsnXycgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGk7XG5cdFx0fVxuXHRcdHZhciBvcmRlcjIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MikubWFwKGZ1bmN0aW9uIChuKSB7XG5cdFx0XHRyZXR1cm4gdGVzdDJbbl07XG5cdFx0fSk7XG5cdFx0aWYgKG9yZGVyMi5qb2luKCcnKSAhPT0gJzAxMjM0NTY3ODknKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MyA9IHt9O1xuXHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGxldHRlcikge1xuXHRcdFx0dGVzdDNbbGV0dGVyXSA9IGxldHRlcjtcblx0XHR9KTtcblx0XHRpZiAoT2JqZWN0LmtleXMoT2JqZWN0LmFzc2lnbih7fSwgdGVzdDMpKS5qb2luKCcnKSAhPT1cblx0XHRcdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0Ly8gV2UgZG9uJ3QgZXhwZWN0IGFueSBvZiB0aGUgYWJvdmUgdG8gdGhyb3csIGJ1dCBiZXR0ZXIgdG8gYmUgc2FmZS5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGRVc2VOYXRpdmUoKSA/IE9iamVjdC5hc3NpZ24gOiBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcblx0dmFyIGZyb207XG5cdHZhciB0byA9IHRvT2JqZWN0KHRhcmdldCk7XG5cdHZhciBzeW1ib2xzO1xuXG5cdGZvciAodmFyIHMgPSAxOyBzIDwgYXJndW1lbnRzLmxlbmd0aDsgcysrKSB7XG5cdFx0ZnJvbSA9IE9iamVjdChhcmd1bWVudHNbc10pO1xuXG5cdFx0Zm9yICh2YXIga2V5IGluIGZyb20pIHtcblx0XHRcdGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGZyb20sIGtleSkpIHtcblx0XHRcdFx0dG9ba2V5XSA9IGZyb21ba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuXHRcdFx0c3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZnJvbSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHByb3BJc0VudW1lcmFibGUuY2FsbChmcm9tLCBzeW1ib2xzW2ldKSkge1xuXHRcdFx0XHRcdHRvW3N5bWJvbHNbaV1dID0gZnJvbVtzeW1ib2xzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG5cbn0se31dLDM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSBfZGVyZXFfKCcuL3V0aWwuanMnKTtcbnZhciBXYWtlTG9jayA9IF9kZXJlcV8oJy4vd2FrZWxvY2suanMnKTtcblxuLy8gU3RhcnQgYXQgYSBoaWdoZXIgbnVtYmVyIHRvIHJlZHVjZSBjaGFuY2Ugb2YgY29uZmxpY3QuXG52YXIgbmV4dERpc3BsYXlJZCA9IDEwMDA7XG52YXIgaGFzU2hvd0RlcHJlY2F0aW9uV2FybmluZyA9IGZhbHNlO1xuXG52YXIgZGVmYXVsdExlZnRCb3VuZHMgPSBbMCwgMCwgMC41LCAxXTtcbnZhciBkZWZhdWx0UmlnaHRCb3VuZHMgPSBbMC41LCAwLCAwLjUsIDFdO1xuXG4vKipcbiAqIFRoZSBiYXNlIGNsYXNzIGZvciBhbGwgVlIgZnJhbWUgZGF0YS5cbiAqL1xuXG5mdW5jdGlvbiBWUkZyYW1lRGF0YSgpIHtcbiAgdGhpcy5sZWZ0UHJvamVjdGlvbk1hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICB0aGlzLmxlZnRWaWV3TWF0cml4ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG4gIHRoaXMucmlnaHRQcm9qZWN0aW9uTWF0cml4ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG4gIHRoaXMucmlnaHRWaWV3TWF0cml4ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG4gIHRoaXMucG9zZSA9IG51bGw7XG59O1xuXG4vKipcbiAqIFRoZSBiYXNlIGNsYXNzIGZvciBhbGwgVlIgZGlzcGxheXMuXG4gKi9cbmZ1bmN0aW9uIFZSRGlzcGxheSgpIHtcbiAgdGhpcy5pc1BvbHlmaWxsZWQgPSB0cnVlO1xuICB0aGlzLmRpc3BsYXlJZCA9IG5leHREaXNwbGF5SWQrKztcbiAgdGhpcy5kaXNwbGF5TmFtZSA9ICd3ZWJ2ci1wb2x5ZmlsbCBkaXNwbGF5TmFtZSc7XG5cbiAgdGhpcy5kZXB0aE5lYXIgPSAwLjAxO1xuICB0aGlzLmRlcHRoRmFyID0gMTAwMDAuMDtcblxuICB0aGlzLmlzQ29ubmVjdGVkID0gdHJ1ZTtcbiAgdGhpcy5pc1ByZXNlbnRpbmcgPSBmYWxzZTtcbiAgdGhpcy5jYXBhYmlsaXRpZXMgPSB7XG4gICAgaGFzUG9zaXRpb246IGZhbHNlLFxuICAgIGhhc09yaWVudGF0aW9uOiBmYWxzZSxcbiAgICBoYXNFeHRlcm5hbERpc3BsYXk6IGZhbHNlLFxuICAgIGNhblByZXNlbnQ6IGZhbHNlLFxuICAgIG1heExheWVyczogMVxuICB9O1xuICB0aGlzLnN0YWdlUGFyYW1ldGVycyA9IG51bGw7XG5cbiAgLy8gXCJQcml2YXRlXCIgbWVtYmVycy5cbiAgdGhpcy53YWl0aW5nRm9yUHJlc2VudF8gPSBmYWxzZTtcbiAgdGhpcy5sYXllcl8gPSBudWxsO1xuXG4gIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Q2FjaGVkU3R5bGVfID0gbnVsbDtcblxuICB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8gPSBudWxsO1xuXG4gIHRoaXMud2FrZWxvY2tfID0gbmV3IFdha2VMb2NrKCk7XG59XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZ2V0RnJhbWVEYXRhID0gZnVuY3Rpb24oZnJhbWVEYXRhKSB7XG4gIC8vIFRPRE86IFRlY2huaWNhbGx5IHRoaXMgc2hvdWxkIHJldGFpbiBpdCdzIHZhbHVlIGZvciB0aGUgZHVyYXRpb24gb2YgYSBmcmFtZVxuICAvLyBidXQgSSBkb3VidCB0aGF0J3MgcHJhY3RpY2FsIHRvIGRvIGluIGphdmFzY3JpcHQuXG4gIHJldHVybiBVdGlsLmZyYW1lRGF0YUZyb21Qb3NlKGZyYW1lRGF0YSwgdGhpcy5nZXRQb3NlKCksIHRoaXMpO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRQb3NlID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRPRE86IFRlY2huaWNhbGx5IHRoaXMgc2hvdWxkIHJldGFpbiBpdCdzIHZhbHVlIGZvciB0aGUgZHVyYXRpb24gb2YgYSBmcmFtZVxuICAvLyBidXQgSSBkb3VidCB0aGF0J3MgcHJhY3RpY2FsIHRvIGRvIGluIGphdmFzY3JpcHQuXG4gIHJldHVybiB0aGlzLmdldEltbWVkaWF0ZVBvc2UoKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgcmV0dXJuIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gIHJldHVybiB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS53cmFwRm9yRnVsbHNjcmVlbiA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgLy8gRG9uJ3Qgd3JhcCBpbiBpT1MuXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuICBpZiAoIXRoaXMuZnVsbHNjcmVlbldyYXBwZXJfKSB7XG4gICAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB2YXIgY3NzUHJvcGVydGllcyA9IFtcbiAgICAgICdoZWlnaHQ6ICcgKyBNYXRoLm1pbihzY3JlZW4uaGVpZ2h0LCBzY3JlZW4ud2lkdGgpICsgJ3B4ICFpbXBvcnRhbnQnLFxuICAgICAgJ3RvcDogMCAhaW1wb3J0YW50JyxcbiAgICAgICdsZWZ0OiAwICFpbXBvcnRhbnQnLFxuICAgICAgJ3JpZ2h0OiAwICFpbXBvcnRhbnQnLFxuICAgICAgJ2JvcmRlcjogMCcsXG4gICAgICAnbWFyZ2luOiAwJyxcbiAgICAgICdwYWRkaW5nOiAwJyxcbiAgICAgICd6LWluZGV4OiA5OTk5OTkgIWltcG9ydGFudCcsXG4gICAgICAncG9zaXRpb246IGZpeGVkJyxcbiAgICBdO1xuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBjc3NQcm9wZXJ0aWVzLmpvaW4oJzsgJykgKyAnOycpO1xuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLmNsYXNzTGlzdC5hZGQoJ3dlYnZyLXBvbHlmaWxsLWZ1bGxzY3JlZW4td3JhcHBlcicpO1xuICB9XG5cbiAgaWYgKHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfID09IGVsZW1lbnQpIHtcbiAgICByZXR1cm4gdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl87XG4gIH1cblxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzbHkgYXBwbGllZCB3cmFwcGVyc1xuICB0aGlzLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG5cbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8gPSBlbGVtZW50O1xuICB2YXIgcGFyZW50ID0gdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8ucGFyZW50RWxlbWVudDtcbiAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXywgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8pO1xuICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcy5mdWxsc2NyZWVuRWxlbWVudF8pO1xuICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5pbnNlcnRCZWZvcmUodGhpcy5mdWxsc2NyZWVuRWxlbWVudF8sIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLmZpcnN0Q2hpbGQpO1xuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Q2FjaGVkU3R5bGVfID0gdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8uZ2V0QXR0cmlidXRlKCdzdHlsZScpO1xuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgZnVuY3Rpb24gYXBwbHlGdWxsc2NyZWVuRWxlbWVudFN0eWxlKCkge1xuICAgIGlmICghc2VsZi5mdWxsc2NyZWVuRWxlbWVudF8pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgY3NzUHJvcGVydGllcyA9IFtcbiAgICAgICdwb3NpdGlvbjogYWJzb2x1dGUnLFxuICAgICAgJ3RvcDogMCcsXG4gICAgICAnbGVmdDogMCcsXG4gICAgICAnd2lkdGg6ICcgKyBNYXRoLm1heChzY3JlZW4ud2lkdGgsIHNjcmVlbi5oZWlnaHQpICsgJ3B4JyxcbiAgICAgICdoZWlnaHQ6ICcgKyBNYXRoLm1pbihzY3JlZW4uaGVpZ2h0LCBzY3JlZW4ud2lkdGgpICsgJ3B4JyxcbiAgICAgICdib3JkZXI6IDAnLFxuICAgICAgJ21hcmdpbjogMCcsXG4gICAgICAncGFkZGluZzogMCcsXG4gICAgXTtcbiAgICBzZWxmLmZ1bGxzY3JlZW5FbGVtZW50Xy5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgY3NzUHJvcGVydGllcy5qb2luKCc7ICcpICsgJzsnKTtcbiAgfVxuXG4gIGFwcGx5RnVsbHNjcmVlbkVsZW1lbnRTdHlsZSgpO1xuXG4gIHJldHVybiB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXztcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUucmVtb3ZlRnVsbHNjcmVlbldyYXBwZXIgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Xykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBlbGVtZW50ID0gdGhpcy5mdWxsc2NyZWVuRWxlbWVudF87XG4gIGlmICh0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Q2FjaGVkU3R5bGVfKSB7XG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5mdWxsc2NyZWVuRWxlbWVudENhY2hlZFN0eWxlXyk7XG4gIH0gZWxzZSB7XG4gICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3N0eWxlJyk7XG4gIH1cbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Q2FjaGVkU3R5bGVfID0gbnVsbDtcblxuICB2YXIgcGFyZW50ID0gdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8ucGFyZW50RWxlbWVudDtcbiAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8ucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG4gIHBhcmVudC5pbnNlcnRCZWZvcmUoZWxlbWVudCwgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8pO1xuICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8pO1xuXG4gIHJldHVybiBlbGVtZW50O1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5yZXF1ZXN0UHJlc2VudCA9IGZ1bmN0aW9uKGxheWVycykge1xuICB2YXIgd2FzUHJlc2VudGluZyA9IHRoaXMuaXNQcmVzZW50aW5nO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKCEobGF5ZXJzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgaWYgKCFoYXNTaG93RGVwcmVjYXRpb25XYXJuaW5nKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJVc2luZyBhIGRlcHJlY2F0ZWQgZm9ybSBvZiByZXF1ZXN0UHJlc2VudC4gU2hvdWxkIHBhc3MgaW4gYW4gYXJyYXkgb2YgVlJMYXllcnMuXCIpO1xuICAgICAgaGFzU2hvd0RlcHJlY2F0aW9uV2FybmluZyA9IHRydWU7XG4gICAgfVxuICAgIGxheWVycyA9IFtsYXllcnNdO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmICghc2VsZi5jYXBhYmlsaXRpZXMuY2FuUHJlc2VudCkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcignVlJEaXNwbGF5IGlzIG5vdCBjYXBhYmxlIG9mIHByZXNlbnRpbmcuJykpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChsYXllcnMubGVuZ3RoID09IDAgfHwgbGF5ZXJzLmxlbmd0aCA+IHNlbGYuY2FwYWJpbGl0aWVzLm1heExheWVycykge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBudW1iZXIgb2YgbGF5ZXJzLicpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaW5jb21pbmdMYXllciA9IGxheWVyc1swXTtcbiAgICBpZiAoIWluY29taW5nTGF5ZXIuc291cmNlKSB7XG4gICAgICAvKlxuICAgICAgdG9kbzogZmlndXJlIG91dCB0aGUgY29ycmVjdCBiZWhhdmlvciBpZiB0aGUgc291cmNlIGlzIG5vdCBwcm92aWRlZC5cbiAgICAgIHNlZSBodHRwczovL2dpdGh1Yi5jb20vdzNjL3dlYnZyL2lzc3Vlcy81OFxuICAgICAgKi9cbiAgICAgIHJlc29sdmUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbGVmdEJvdW5kcyA9IGluY29taW5nTGF5ZXIubGVmdEJvdW5kcyB8fCBkZWZhdWx0TGVmdEJvdW5kcztcbiAgICB2YXIgcmlnaHRCb3VuZHMgPSBpbmNvbWluZ0xheWVyLnJpZ2h0Qm91bmRzIHx8IGRlZmF1bHRSaWdodEJvdW5kcztcbiAgICBpZiAod2FzUHJlc2VudGluZykge1xuICAgICAgLy8gQWxyZWFkeSBwcmVzZW50aW5nLCBqdXN0IGNoYW5naW5nIGNvbmZpZ3VyYXRpb25cbiAgICAgIHZhciBsYXllciA9IHNlbGYubGF5ZXJfO1xuICAgICAgaWYgKGxheWVyLnNvdXJjZSAhPT0gaW5jb21pbmdMYXllci5zb3VyY2UpIHtcbiAgICAgICAgbGF5ZXIuc291cmNlID0gaW5jb21pbmdMYXllci5zb3VyY2U7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgIGlmIChsYXllci5sZWZ0Qm91bmRzW2ldICE9PSBsZWZ0Qm91bmRzW2ldKSB7XG4gICAgICAgICAgbGF5ZXIubGVmdEJvdW5kc1tpXSA9IGxlZnRCb3VuZHNbaV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxheWVyLnJpZ2h0Qm91bmRzW2ldICE9PSByaWdodEJvdW5kc1tpXSkge1xuICAgICAgICAgIGxheWVyLnJpZ2h0Qm91bmRzW2ldID0gcmlnaHRCb3VuZHNbaV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdhcyBub3QgYWxyZWFkeSBwcmVzZW50aW5nLlxuICAgIHNlbGYubGF5ZXJfID0ge1xuICAgICAgcHJlZGlzdG9ydGVkOiBpbmNvbWluZ0xheWVyLnByZWRpc3RvcnRlZCxcbiAgICAgIHNvdXJjZTogaW5jb21pbmdMYXllci5zb3VyY2UsXG4gICAgICBsZWZ0Qm91bmRzOiBsZWZ0Qm91bmRzLnNsaWNlKDApLFxuICAgICAgcmlnaHRCb3VuZHM6IHJpZ2h0Qm91bmRzLnNsaWNlKDApXG4gICAgfTtcblxuICAgIHNlbGYud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gICAgaWYgKHNlbGYubGF5ZXJfICYmIHNlbGYubGF5ZXJfLnNvdXJjZSkge1xuICAgICAgdmFyIGZ1bGxzY3JlZW5FbGVtZW50ID0gc2VsZi53cmFwRm9yRnVsbHNjcmVlbihzZWxmLmxheWVyXy5zb3VyY2UpO1xuXG4gICAgICBmdW5jdGlvbiBvbkZ1bGxzY3JlZW5DaGFuZ2UoKSB7XG4gICAgICAgIHZhciBhY3R1YWxGdWxsc2NyZWVuRWxlbWVudCA9IFV0aWwuZ2V0RnVsbHNjcmVlbkVsZW1lbnQoKTtcblxuICAgICAgICBzZWxmLmlzUHJlc2VudGluZyA9IChmdWxsc2NyZWVuRWxlbWVudCA9PT0gYWN0dWFsRnVsbHNjcmVlbkVsZW1lbnQpO1xuICAgICAgICBpZiAoc2VsZi5pc1ByZXNlbnRpbmcpIHtcbiAgICAgICAgICBpZiAoc2NyZWVuLm9yaWVudGF0aW9uICYmIHNjcmVlbi5vcmllbnRhdGlvbi5sb2NrKSB7XG4gICAgICAgICAgICBzY3JlZW4ub3JpZW50YXRpb24ubG9jaygnbGFuZHNjYXBlLXByaW1hcnknKS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NjcmVlbi5vcmllbnRhdGlvbi5sb2NrKCkgZmFpbGVkIGR1ZSB0bycsIGVycm9yLm1lc3NhZ2UpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2VsZi53YWl0aW5nRm9yUHJlc2VudF8gPSBmYWxzZTtcbiAgICAgICAgICBzZWxmLmJlZ2luUHJlc2VudF8oKTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHNjcmVlbi5vcmllbnRhdGlvbiAmJiBzY3JlZW4ub3JpZW50YXRpb24udW5sb2NrKSB7XG4gICAgICAgICAgICBzY3JlZW4ub3JpZW50YXRpb24udW5sb2NrKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbldyYXBwZXIoKTtcbiAgICAgICAgICBzZWxmLndha2Vsb2NrXy5yZWxlYXNlKCk7XG4gICAgICAgICAgc2VsZi5lbmRQcmVzZW50XygpO1xuICAgICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18oKTtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLmZpcmVWUkRpc3BsYXlQcmVzZW50Q2hhbmdlXygpO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gb25GdWxsc2NyZWVuRXJyb3IoKSB7XG4gICAgICAgIGlmICghc2VsZi53YWl0aW5nRm9yUHJlc2VudF8pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG4gICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18oKTtcblxuICAgICAgICBzZWxmLndha2Vsb2NrXy5yZWxlYXNlKCk7XG4gICAgICAgIHNlbGYud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gICAgICAgIHNlbGYuaXNQcmVzZW50aW5nID0gZmFsc2U7XG5cbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignVW5hYmxlIHRvIHByZXNlbnQuJykpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLmFkZEZ1bGxzY3JlZW5MaXN0ZW5lcnNfKGZ1bGxzY3JlZW5FbGVtZW50LFxuICAgICAgICAgIG9uRnVsbHNjcmVlbkNoYW5nZSwgb25GdWxsc2NyZWVuRXJyb3IpO1xuXG4gICAgICBpZiAoVXRpbC5yZXF1ZXN0RnVsbHNjcmVlbihmdWxsc2NyZWVuRWxlbWVudCkpIHtcbiAgICAgICAgc2VsZi53YWtlbG9ja18ucmVxdWVzdCgpO1xuICAgICAgICBzZWxmLndhaXRpbmdGb3JQcmVzZW50XyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgICAgICAvLyAqc2lnaCogSnVzdCBmYWtlIGl0LlxuICAgICAgICBzZWxmLndha2Vsb2NrXy5yZXF1ZXN0KCk7XG4gICAgICAgIHNlbGYuaXNQcmVzZW50aW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5iZWdpblByZXNlbnRfKCk7XG4gICAgICAgIHNlbGYuZmlyZVZSRGlzcGxheVByZXNlbnRDaGFuZ2VfKCk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXNlbGYud2FpdGluZ0ZvclByZXNlbnRfICYmICFVdGlsLmlzSU9TKCkpIHtcbiAgICAgIFV0aWwuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1VuYWJsZSB0byBwcmVzZW50LicpKTtcbiAgICB9XG4gIH0pO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5leGl0UHJlc2VudCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd2FzUHJlc2VudGluZyA9IHRoaXMuaXNQcmVzZW50aW5nO1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuaXNQcmVzZW50aW5nID0gZmFsc2U7XG4gIHRoaXMubGF5ZXJfID0gbnVsbDtcbiAgdGhpcy53YWtlbG9ja18ucmVsZWFzZSgpO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAod2FzUHJlc2VudGluZykge1xuICAgICAgaWYgKCFVdGlsLmV4aXRGdWxsc2NyZWVuKCkgJiYgVXRpbC5pc0lPUygpKSB7XG4gICAgICAgIHNlbGYuZW5kUHJlc2VudF8oKTtcbiAgICAgICAgc2VsZi5maXJlVlJEaXNwbGF5UHJlc2VudENoYW5nZV8oKTtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdXYXMgbm90IHByZXNlbnRpbmcgdG8gVlJEaXNwbGF5LicpKTtcbiAgICB9XG4gIH0pO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRMYXllcnMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMubGF5ZXJfKSB7XG4gICAgcmV0dXJuIFt0aGlzLmxheWVyX107XG4gIH1cbiAgcmV0dXJuIFtdO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5maXJlVlJEaXNwbGF5UHJlc2VudENoYW5nZV8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCd2cmRpc3BsYXlwcmVzZW50Y2hhbmdlJywge2RldGFpbDoge2Rpc3BsYXk6IHRoaXN9fSk7XG4gIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuYWRkRnVsbHNjcmVlbkxpc3RlbmVyc18gPSBmdW5jdGlvbihlbGVtZW50LCBjaGFuZ2VIYW5kbGVyLCBlcnJvckhhbmRsZXIpIHtcbiAgdGhpcy5yZW1vdmVGdWxsc2NyZWVuTGlzdGVuZXJzXygpO1xuXG4gIHRoaXMuZnVsbHNjcmVlbkV2ZW50VGFyZ2V0XyA9IGVsZW1lbnQ7XG4gIHRoaXMuZnVsbHNjcmVlbkNoYW5nZUhhbmRsZXJfID0gY2hhbmdlSGFuZGxlcjtcbiAgdGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXyA9IGVycm9ySGFuZGxlcjtcblxuICBpZiAoY2hhbmdlSGFuZGxlcikge1xuICAgIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbmFibGVkKSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNGdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVycm9ySGFuZGxlcikge1xuICAgIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbmFibGVkKSB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQubW96RnVsbFNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNGdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIH1cbiAgfVxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5yZW1vdmVGdWxsc2NyZWVuTGlzdGVuZXJzXyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuZnVsbHNjcmVlbkV2ZW50VGFyZ2V0XylcbiAgICByZXR1cm47XG5cbiAgdmFyIGVsZW1lbnQgPSB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF87XG5cbiAgaWYgKHRoaXMuZnVsbHNjcmVlbkNoYW5nZUhhbmRsZXJfKSB7XG4gICAgdmFyIGNoYW5nZUhhbmRsZXIgPSB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXztcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gIH1cblxuICBpZiAodGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXykge1xuICAgIHZhciBlcnJvckhhbmRsZXIgPSB0aGlzLmZ1bGxzY3JlZW5FcnJvckhhbmRsZXJfO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21zZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gIH1cblxuICB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8gPSBudWxsO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5iZWdpblByZXNlbnRfID0gZnVuY3Rpb24oKSB7XG4gIC8vIE92ZXJyaWRlIHRvIGFkZCBjdXN0b20gYmVoYXZpb3Igd2hlbiBwcmVzZW50YXRpb24gYmVnaW5zLlxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5lbmRQcmVzZW50XyA9IGZ1bmN0aW9uKCkge1xuICAvLyBPdmVycmlkZSB0byBhZGQgY3VzdG9tIGJlaGF2aW9yIHdoZW4gcHJlc2VudGF0aW9uIGVuZHMuXG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnN1Ym1pdEZyYW1lID0gZnVuY3Rpb24ocG9zZSkge1xuICAvLyBPdmVycmlkZSB0byBhZGQgY3VzdG9tIGJlaGF2aW9yIGZvciBmcmFtZSBzdWJtaXNzaW9uLlxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRFeWVQYXJhbWV0ZXJzID0gZnVuY3Rpb24od2hpY2hFeWUpIHtcbiAgLy8gT3ZlcnJpZGUgdG8gcmV0dXJuIGFjY3VyYXRlIGV5ZSBwYXJhbWV0ZXJzIGlmIGNhblByZXNlbnQgaXMgdHJ1ZS5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKlxuICogRGVwcmVjYXRlZCBjbGFzc2VzXG4gKi9cblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIGRldmljZXMuIChEZXByZWNhdGVkKVxuICovXG5mdW5jdGlvbiBWUkRldmljZSgpIHtcbiAgdGhpcy5pc1BvbHlmaWxsZWQgPSB0cnVlO1xuICB0aGlzLmhhcmR3YXJlVW5pdElkID0gJ3dlYnZyLXBvbHlmaWxsIGhhcmR3YXJlVW5pdElkJztcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbCBkZXZpY2VJZCc7XG4gIHRoaXMuZGV2aWNlTmFtZSA9ICd3ZWJ2ci1wb2x5ZmlsbCBkZXZpY2VOYW1lJztcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIEhNRCBkZXZpY2VzLiAoRGVwcmVjYXRlZClcbiAqL1xuZnVuY3Rpb24gSE1EVlJEZXZpY2UoKSB7XG59XG5ITURWUkRldmljZS5wcm90b3R5cGUgPSBuZXcgVlJEZXZpY2UoKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIHBvc2l0aW9uIHNlbnNvciBkZXZpY2VzLiAoRGVwcmVjYXRlZClcbiAqL1xuZnVuY3Rpb24gUG9zaXRpb25TZW5zb3JWUkRldmljZSgpIHtcbn1cblBvc2l0aW9uU2Vuc29yVlJEZXZpY2UucHJvdG90eXBlID0gbmV3IFZSRGV2aWNlKCk7XG5cbm1vZHVsZS5leHBvcnRzLlZSRnJhbWVEYXRhID0gVlJGcmFtZURhdGE7XG5tb2R1bGUuZXhwb3J0cy5WUkRpc3BsYXkgPSBWUkRpc3BsYXk7XG5tb2R1bGUuZXhwb3J0cy5WUkRldmljZSA9IFZSRGV2aWNlO1xubW9kdWxlLmV4cG9ydHMuSE1EVlJEZXZpY2UgPSBITURWUkRldmljZTtcbm1vZHVsZS5leHBvcnRzLlBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSBQb3NpdGlvblNlbnNvclZSRGV2aWNlO1xuXG59LHtcIi4vdXRpbC5qc1wiOjIyLFwiLi93YWtlbG9jay5qc1wiOjI0fV0sNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgQ2FyZGJvYXJkVUkgPSBfZGVyZXFfKCcuL2NhcmRib2FyZC11aS5qcycpO1xudmFyIFV0aWwgPSBfZGVyZXFfKCcuL3V0aWwuanMnKTtcbnZhciBXR0xVUHJlc2VydmVHTFN0YXRlID0gX2RlcmVxXygnLi9kZXBzL3dnbHUtcHJlc2VydmUtc3RhdGUuanMnKTtcblxudmFyIGRpc3RvcnRpb25WUyA9IFtcbiAgJ2F0dHJpYnV0ZSB2ZWMyIHBvc2l0aW9uOycsXG4gICdhdHRyaWJ1dGUgdmVjMyB0ZXhDb29yZDsnLFxuXG4gICd2YXJ5aW5nIHZlYzIgdlRleENvb3JkOycsXG5cbiAgJ3VuaWZvcm0gdmVjNCB2aWV3cG9ydE9mZnNldFNjYWxlWzJdOycsXG5cbiAgJ3ZvaWQgbWFpbigpIHsnLFxuICAnICB2ZWM0IHZpZXdwb3J0ID0gdmlld3BvcnRPZmZzZXRTY2FsZVtpbnQodGV4Q29vcmQueildOycsXG4gICcgIHZUZXhDb29yZCA9ICh0ZXhDb29yZC54eSAqIHZpZXdwb3J0Lnp3KSArIHZpZXdwb3J0Lnh5OycsXG4gICcgIGdsX1Bvc2l0aW9uID0gdmVjNCggcG9zaXRpb24sIDEuMCwgMS4wICk7JyxcbiAgJ30nLFxuXS5qb2luKCdcXG4nKTtcblxudmFyIGRpc3RvcnRpb25GUyA9IFtcbiAgJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0OycsXG4gICd1bmlmb3JtIHNhbXBsZXIyRCBkaWZmdXNlOycsXG5cbiAgJ3ZhcnlpbmcgdmVjMiB2VGV4Q29vcmQ7JyxcblxuICAndm9pZCBtYWluKCkgeycsXG4gICcgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRChkaWZmdXNlLCB2VGV4Q29vcmQpOycsXG4gICd9Jyxcbl0uam9pbignXFxuJyk7XG5cbi8qKlxuICogQSBtZXNoLWJhc2VkIGRpc3RvcnRlci5cbiAqL1xuZnVuY3Rpb24gQ2FyZGJvYXJkRGlzdG9ydGVyKGdsKSB7XG4gIHRoaXMuZ2wgPSBnbDtcbiAgdGhpcy5jdHhBdHRyaWJzID0gZ2wuZ2V0Q29udGV4dEF0dHJpYnV0ZXMoKTtcblxuICB0aGlzLm1lc2hXaWR0aCA9IDIwO1xuICB0aGlzLm1lc2hIZWlnaHQgPSAyMDtcblxuICB0aGlzLmJ1ZmZlclNjYWxlID0gV2ViVlJDb25maWcuQlVGRkVSX1NDQUxFO1xuXG4gIHRoaXMuYnVmZmVyV2lkdGggPSBnbC5kcmF3aW5nQnVmZmVyV2lkdGg7XG4gIHRoaXMuYnVmZmVySGVpZ2h0ID0gZ2wuZHJhd2luZ0J1ZmZlckhlaWdodDtcblxuICAvLyBQYXRjaGluZyBzdXBwb3J0XG4gIHRoaXMucmVhbEJpbmRGcmFtZWJ1ZmZlciA9IGdsLmJpbmRGcmFtZWJ1ZmZlcjtcbiAgdGhpcy5yZWFsRW5hYmxlID0gZ2wuZW5hYmxlO1xuICB0aGlzLnJlYWxEaXNhYmxlID0gZ2wuZGlzYWJsZTtcbiAgdGhpcy5yZWFsQ29sb3JNYXNrID0gZ2wuY29sb3JNYXNrO1xuICB0aGlzLnJlYWxDbGVhckNvbG9yID0gZ2wuY2xlYXJDb2xvcjtcbiAgdGhpcy5yZWFsVmlld3BvcnQgPSBnbC52aWV3cG9ydDtcblxuICBpZiAoIVV0aWwuaXNJT1MoKSkge1xuICAgIHRoaXMucmVhbENhbnZhc1dpZHRoID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihnbC5jYW52YXMuX19wcm90b19fLCAnd2lkdGgnKTtcbiAgICB0aGlzLnJlYWxDYW52YXNIZWlnaHQgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGdsLmNhbnZhcy5fX3Byb3RvX18sICdoZWlnaHQnKTtcbiAgfVxuXG4gIHRoaXMuaXNQYXRjaGVkID0gZmFsc2U7XG5cbiAgLy8gU3RhdGUgdHJhY2tpbmdcbiAgdGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IG51bGw7XG4gIHRoaXMuY3VsbEZhY2UgPSBmYWxzZTtcbiAgdGhpcy5kZXB0aFRlc3QgPSBmYWxzZTtcbiAgdGhpcy5ibGVuZCA9IGZhbHNlO1xuICB0aGlzLnNjaXNzb3JUZXN0ID0gZmFsc2U7XG4gIHRoaXMuc3RlbmNpbFRlc3QgPSBmYWxzZTtcbiAgdGhpcy52aWV3cG9ydCA9IFswLCAwLCAwLCAwXTtcbiAgdGhpcy5jb2xvck1hc2sgPSBbdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZV07XG4gIHRoaXMuY2xlYXJDb2xvciA9IFswLCAwLCAwLCAwXTtcblxuICB0aGlzLmF0dHJpYnMgPSB7XG4gICAgcG9zaXRpb246IDAsXG4gICAgdGV4Q29vcmQ6IDFcbiAgfTtcbiAgdGhpcy5wcm9ncmFtID0gVXRpbC5saW5rUHJvZ3JhbShnbCwgZGlzdG9ydGlvblZTLCBkaXN0b3J0aW9uRlMsIHRoaXMuYXR0cmlicyk7XG4gIHRoaXMudW5pZm9ybXMgPSBVdGlsLmdldFByb2dyYW1Vbmlmb3JtcyhnbCwgdGhpcy5wcm9ncmFtKTtcblxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGUgPSBuZXcgRmxvYXQzMkFycmF5KDgpO1xuICB0aGlzLnNldFRleHR1cmVCb3VuZHMoKTtcblxuICB0aGlzLnZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICB0aGlzLmluZGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gIHRoaXMuaW5kZXhDb3VudCA9IDA7XG5cbiAgdGhpcy5yZW5kZXJUYXJnZXQgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gIHRoaXMuZnJhbWVidWZmZXIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuXG4gIHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyID0gbnVsbDtcbiAgdGhpcy5kZXB0aEJ1ZmZlciA9IG51bGw7XG4gIHRoaXMuc3RlbmNpbEJ1ZmZlciA9IG51bGw7XG5cbiAgaWYgKHRoaXMuY3R4QXR0cmlicy5kZXB0aCAmJiB0aGlzLmN0eEF0dHJpYnMuc3RlbmNpbCkge1xuICAgIHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gIH0gZWxzZSBpZiAodGhpcy5jdHhBdHRyaWJzLmRlcHRoKSB7XG4gICAgdGhpcy5kZXB0aEJ1ZmZlciA9IGdsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xuICB9IGVsc2UgaWYgKHRoaXMuY3R4QXR0cmlicy5zdGVuY2lsKSB7XG4gICAgdGhpcy5zdGVuY2lsQnVmZmVyID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gIH1cblxuICB0aGlzLnBhdGNoKCk7XG5cbiAgdGhpcy5vblJlc2l6ZSgpO1xuXG4gIGlmICghV2ViVlJDb25maWcuQ0FSREJPQVJEX1VJX0RJU0FCTEVEKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSSA9IG5ldyBDYXJkYm9hcmRVSShnbCk7XG4gIH1cbn07XG5cbi8qKlxuICogVGVhcnMgZG93biBhbGwgdGhlIHJlc291cmNlcyBjcmVhdGVkIGJ5IHRoZSBkaXN0b3J0ZXIgYW5kIHJlbW92ZXMgYW55XG4gKiBwYXRjaGVzLlxuICovXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcblxuICB0aGlzLnVucGF0Y2goKTtcblxuICBnbC5kZWxldGVQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gIGdsLmRlbGV0ZUJ1ZmZlcih0aGlzLnZlcnRleEJ1ZmZlcik7XG4gIGdsLmRlbGV0ZUJ1ZmZlcih0aGlzLmluZGV4QnVmZmVyKTtcbiAgZ2wuZGVsZXRlVGV4dHVyZSh0aGlzLnJlbmRlclRhcmdldCk7XG4gIGdsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuZnJhbWVidWZmZXIpO1xuICBpZiAodGhpcy5kZXB0aFN0ZW5jaWxCdWZmZXIpIHtcbiAgICBnbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5kZXB0aFN0ZW5jaWxCdWZmZXIpO1xuICB9XG4gIGlmICh0aGlzLmRlcHRoQnVmZmVyKSB7XG4gICAgZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMuZGVwdGhCdWZmZXIpO1xuICB9XG4gIGlmICh0aGlzLnN0ZW5jaWxCdWZmZXIpIHtcbiAgICBnbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5zdGVuY2lsQnVmZmVyKTtcbiAgfVxuXG4gIGlmICh0aGlzLmNhcmRib2FyZFVJKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSS5kZXN0cm95KCk7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBSZXNpemVzIHRoZSBiYWNrYnVmZmVyIHRvIG1hdGNoIHRoZSBjYW52YXMgd2lkdGggYW5kIGhlaWdodC5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5vblJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXG4gICAgZ2wuUkVOREVSQlVGRkVSX0JJTkRJTkcsXG4gICAgZ2wuVEVYVFVSRV9CSU5ESU5HXzJELCBnbC5URVhUVVJFMFxuICBdO1xuXG4gIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGdsU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gICAgLy8gQmluZCByZWFsIGJhY2tidWZmZXIgYW5kIGNsZWFyIGl0IG9uY2UuIFdlIGRvbid0IG5lZWQgdG8gY2xlYXIgaXQgYWdhaW5cbiAgICAvLyBhZnRlciB0aGF0IGJlY2F1c2Ugd2UncmUgb3ZlcndyaXRpbmcgdGhlIHNhbWUgYXJlYSBldmVyeSBmcmFtZS5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuXG4gICAgLy8gUHV0IHRoaW5ncyBpbiBhIGdvb2Qgc3RhdGVcbiAgICBpZiAoc2VsZi5zY2lzc29yVGVzdCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLlNDSVNTT1JfVEVTVCk7IH1cbiAgICBzZWxmLnJlYWxDb2xvck1hc2suY2FsbChnbCwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuY2FsbChnbCwgMCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcbiAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmNhbGwoZ2wsIDAsIDAsIDAsIDEpO1xuXG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG5cbiAgICAvLyBOb3cgYmluZCBhbmQgcmVzaXplIHRoZSBmYWtlIGJhY2tidWZmZXJcbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYuZnJhbWVidWZmZXIpO1xuXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgc2VsZi5yZW5kZXJUYXJnZXQpO1xuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgc2VsZi5jdHhBdHRyaWJzLmFscGhhID8gZ2wuUkdCQSA6IGdsLlJHQixcbiAgICAgICAgc2VsZi5idWZmZXJXaWR0aCwgc2VsZi5idWZmZXJIZWlnaHQsIDAsXG4gICAgICAgIHNlbGYuY3R4QXR0cmlicy5hbHBoYSA/IGdsLlJHQkEgOiBnbC5SR0IsIGdsLlVOU0lHTkVEX0JZVEUsIG51bGwpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgc2VsZi5yZW5kZXJUYXJnZXQsIDApO1xuXG4gICAgaWYgKHNlbGYuY3R4QXR0cmlicy5kZXB0aCAmJiBzZWxmLmN0eEF0dHJpYnMuc3RlbmNpbCkge1xuICAgICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIHNlbGYuZGVwdGhTdGVuY2lsQnVmZmVyKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoZ2wuUkVOREVSQlVGRkVSLCBnbC5ERVBUSF9TVEVOQ0lMLFxuICAgICAgICAgIHNlbGYuYnVmZmVyV2lkdGgsIHNlbGYuYnVmZmVySGVpZ2h0KTtcbiAgICAgIGdsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9TVEVOQ0lMX0FUVEFDSE1FTlQsXG4gICAgICAgICAgZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoU3RlbmNpbEJ1ZmZlcik7XG4gICAgfSBlbHNlIGlmIChzZWxmLmN0eEF0dHJpYnMuZGVwdGgpIHtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoQnVmZmVyKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoZ2wuUkVOREVSQlVGRkVSLCBnbC5ERVBUSF9DT01QT05FTlQxNixcbiAgICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoLCBzZWxmLmJ1ZmZlckhlaWdodCk7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfQVRUQUNITUVOVCxcbiAgICAgICAgICBnbC5SRU5ERVJCVUZGRVIsIHNlbGYuZGVwdGhCdWZmZXIpO1xuICAgIH0gZWxzZSBpZiAoc2VsZi5jdHhBdHRyaWJzLnN0ZW5jaWwpIHtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBzZWxmLnN0ZW5jaWxCdWZmZXIpO1xuICAgICAgZ2wucmVuZGVyYnVmZmVyU3RvcmFnZShnbC5SRU5ERVJCVUZGRVIsIGdsLlNURU5DSUxfSU5ERVg4LFxuICAgICAgICAgIHNlbGYuYnVmZmVyV2lkdGgsIHNlbGYuYnVmZmVySGVpZ2h0KTtcbiAgICAgIGdsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBnbC5TVEVOQ0lMX0FUVEFDSE1FTlQsXG4gICAgICAgICAgZ2wuUkVOREVSQlVGRkVSLCBzZWxmLnN0ZW5jaWxCdWZmZXIpO1xuICAgIH1cblxuICAgIGlmICghZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhnbC5GUkFNRUJVRkZFUikgPT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdGcmFtZWJ1ZmZlciBpbmNvbXBsZXRlIScpO1xuICAgIH1cblxuICAgIHNlbGYucmVhbEJpbmRGcmFtZWJ1ZmZlci5jYWxsKGdsLCBnbC5GUkFNRUJVRkZFUiwgc2VsZi5sYXN0Qm91bmRGcmFtZWJ1ZmZlcik7XG5cbiAgICBpZiAoc2VsZi5zY2lzc29yVGVzdCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuU0NJU1NPUl9URVNUKTsgfVxuXG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmFwcGx5KGdsLCBzZWxmLmNvbG9yTWFzayk7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuYXBwbHkoZ2wsIHNlbGYudmlld3BvcnQpO1xuICAgIHNlbGYucmVhbENsZWFyQ29sb3IuYXBwbHkoZ2wsIHNlbGYuY2xlYXJDb2xvcik7XG4gIH0pO1xuXG4gIGlmICh0aGlzLmNhcmRib2FyZFVJKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSS5vblJlc2l6ZSgpO1xuICB9XG59O1xuXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnBhdGNoID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmlzUGF0Y2hlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGNhbnZhcyA9IHRoaXMuZ2wuY2FudmFzO1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gIGlmICghVXRpbC5pc0lPUygpKSB7XG4gICAgY2FudmFzLndpZHRoID0gVXRpbC5nZXRTY3JlZW5XaWR0aCgpICogdGhpcy5idWZmZXJTY2FsZTtcbiAgICBjYW52YXMuaGVpZ2h0ID0gVXRpbC5nZXRTY3JlZW5IZWlnaHQoKSAqIHRoaXMuYnVmZmVyU2NhbGU7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FudmFzLCAnd2lkdGgnLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuYnVmZmVyV2lkdGg7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoID0gdmFsdWU7XG4gICAgICAgIHNlbGYucmVhbENhbnZhc1dpZHRoLnNldC5jYWxsKGNhbnZhcywgdmFsdWUpO1xuICAgICAgICBzZWxmLm9uUmVzaXplKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FudmFzLCAnaGVpZ2h0Jywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzZWxmLmJ1ZmZlckhlaWdodDtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHNlbGYuYnVmZmVySGVpZ2h0ID0gdmFsdWU7XG4gICAgICAgIHNlbGYucmVhbENhbnZhc0hlaWdodC5zZXQuY2FsbChjYW52YXMsIHZhbHVlKTtcbiAgICAgICAgc2VsZi5vblJlc2l6ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IGdsLmdldFBhcmFtZXRlcihnbC5GUkFNRUJVRkZFUl9CSU5ESU5HKTtcblxuICBpZiAodGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9PSBudWxsKSB7XG4gICAgdGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IHRoaXMuZnJhbWVidWZmZXI7XG4gICAgdGhpcy5nbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHRoaXMuZnJhbWVidWZmZXIpO1xuICB9XG5cbiAgdGhpcy5nbC5iaW5kRnJhbWVidWZmZXIgPSBmdW5jdGlvbih0YXJnZXQsIGZyYW1lYnVmZmVyKSB7XG4gICAgc2VsZi5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IGZyYW1lYnVmZmVyID8gZnJhbWVidWZmZXIgOiBzZWxmLmZyYW1lYnVmZmVyO1xuICAgIC8vIFNpbGVudGx5IG1ha2UgY2FsbHMgdG8gYmluZCB0aGUgZGVmYXVsdCBmcmFtZWJ1ZmZlciBiaW5kIG91cnMgaW5zdGVhZC5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgdGFyZ2V0LCBzZWxmLmxhc3RCb3VuZEZyYW1lYnVmZmVyKTtcbiAgfTtcblxuICB0aGlzLmN1bGxGYWNlID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNVTExfRkFDRSk7XG4gIHRoaXMuZGVwdGhUZXN0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkRFUFRIX1RFU1QpO1xuICB0aGlzLmJsZW5kID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkJMRU5EKTtcbiAgdGhpcy5zY2lzc29yVGVzdCA9IGdsLmdldFBhcmFtZXRlcihnbC5TQ0lTU09SX1RFU1QpO1xuICB0aGlzLnN0ZW5jaWxUZXN0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlNURU5DSUxfVEVTVCk7XG5cbiAgZ2wuZW5hYmxlID0gZnVuY3Rpb24ocG5hbWUpIHtcbiAgICBzd2l0Y2ggKHBuYW1lKSB7XG4gICAgICBjYXNlIGdsLkNVTExfRkFDRTogc2VsZi5jdWxsRmFjZSA9IHRydWU7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5ERVBUSF9URVNUOiBzZWxmLmRlcHRoVGVzdCA9IHRydWU7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5CTEVORDogc2VsZi5ibGVuZCA9IHRydWU7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5TQ0lTU09SX1RFU1Q6IHNlbGYuc2Npc3NvclRlc3QgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU1RFTkNJTF9URVNUOiBzZWxmLnN0ZW5jaWxUZXN0ID0gdHJ1ZTsgYnJlYWs7XG4gICAgfVxuICAgIHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBwbmFtZSk7XG4gIH07XG5cbiAgZ2wuZGlzYWJsZSA9IGZ1bmN0aW9uKHBuYW1lKSB7XG4gICAgc3dpdGNoIChwbmFtZSkge1xuICAgICAgY2FzZSBnbC5DVUxMX0ZBQ0U6IHNlbGYuY3VsbEZhY2UgPSBmYWxzZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLkRFUFRIX1RFU1Q6IHNlbGYuZGVwdGhUZXN0ID0gZmFsc2U7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5CTEVORDogc2VsZi5ibGVuZCA9IGZhbHNlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU0NJU1NPUl9URVNUOiBzZWxmLnNjaXNzb3JUZXN0ID0gZmFsc2U7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5TVEVOQ0lMX1RFU1Q6IHNlbGYuc3RlbmNpbFRlc3QgPSBmYWxzZTsgYnJlYWs7XG4gICAgfVxuICAgIHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgcG5hbWUpO1xuICB9O1xuXG4gIHRoaXMuY29sb3JNYXNrID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNPTE9SX1dSSVRFTUFTSyk7XG4gIGdsLmNvbG9yTWFzayA9IGZ1bmN0aW9uKHIsIGcsIGIsIGEpIHtcbiAgICBzZWxmLmNvbG9yTWFza1swXSA9IHI7XG4gICAgc2VsZi5jb2xvck1hc2tbMV0gPSBnO1xuICAgIHNlbGYuY29sb3JNYXNrWzJdID0gYjtcbiAgICBzZWxmLmNvbG9yTWFza1szXSA9IGE7XG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmNhbGwoZ2wsIHIsIGcsIGIsIGEpO1xuICB9O1xuXG4gIHRoaXMuY2xlYXJDb2xvciA9IGdsLmdldFBhcmFtZXRlcihnbC5DT0xPUl9DTEVBUl9WQUxVRSk7XG4gIGdsLmNsZWFyQ29sb3IgPSBmdW5jdGlvbihyLCBnLCBiLCBhKSB7XG4gICAgc2VsZi5jbGVhckNvbG9yWzBdID0gcjtcbiAgICBzZWxmLmNsZWFyQ29sb3JbMV0gPSBnO1xuICAgIHNlbGYuY2xlYXJDb2xvclsyXSA9IGI7XG4gICAgc2VsZi5jbGVhckNvbG9yWzNdID0gYTtcbiAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmNhbGwoZ2wsIHIsIGcsIGIsIGEpO1xuICB9O1xuXG4gIHRoaXMudmlld3BvcnQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVklFV1BPUlQpO1xuICBnbC52aWV3cG9ydCA9IGZ1bmN0aW9uKHgsIHksIHcsIGgpIHtcbiAgICBzZWxmLnZpZXdwb3J0WzBdID0geDtcbiAgICBzZWxmLnZpZXdwb3J0WzFdID0geTtcbiAgICBzZWxmLnZpZXdwb3J0WzJdID0gdztcbiAgICBzZWxmLnZpZXdwb3J0WzNdID0gaDtcbiAgICBzZWxmLnJlYWxWaWV3cG9ydC5jYWxsKGdsLCB4LCB5LCB3LCBoKTtcbiAgfTtcblxuICB0aGlzLmlzUGF0Y2hlZCA9IHRydWU7XG4gIFV0aWwuc2FmYXJpQ3NzU2l6ZVdvcmthcm91bmQoY2FudmFzKTtcbn07XG5cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUudW5wYXRjaCA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuaXNQYXRjaGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIGNhbnZhcyA9IHRoaXMuZ2wuY2FudmFzO1xuXG4gIGlmICghVXRpbC5pc0lPUygpKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNhbnZhcywgJ3dpZHRoJywgdGhpcy5yZWFsQ2FudmFzV2lkdGgpO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYW52YXMsICdoZWlnaHQnLCB0aGlzLnJlYWxDYW52YXNIZWlnaHQpO1xuICB9XG4gIGNhbnZhcy53aWR0aCA9IHRoaXMuYnVmZmVyV2lkdGg7XG4gIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmJ1ZmZlckhlaWdodDtcblxuICBnbC5iaW5kRnJhbWVidWZmZXIgPSB0aGlzLnJlYWxCaW5kRnJhbWVidWZmZXI7XG4gIGdsLmVuYWJsZSA9IHRoaXMucmVhbEVuYWJsZTtcbiAgZ2wuZGlzYWJsZSA9IHRoaXMucmVhbERpc2FibGU7XG4gIGdsLmNvbG9yTWFzayA9IHRoaXMucmVhbENvbG9yTWFzaztcbiAgZ2wuY2xlYXJDb2xvciA9IHRoaXMucmVhbENsZWFyQ29sb3I7XG4gIGdsLnZpZXdwb3J0ID0gdGhpcy5yZWFsVmlld3BvcnQ7XG5cbiAgLy8gQ2hlY2sgdG8gc2VlIGlmIG91ciBmYWtlIGJhY2tidWZmZXIgaXMgYm91bmQgYW5kIGJpbmQgdGhlIHJlYWwgYmFja2J1ZmZlclxuICAvLyBpZiB0aGF0J3MgdGhlIGNhc2UuXG4gIGlmICh0aGlzLmxhc3RCb3VuZEZyYW1lYnVmZmVyID09IHRoaXMuZnJhbWVidWZmZXIpIHtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICB9XG5cbiAgdGhpcy5pc1BhdGNoZWQgPSBmYWxzZTtcblxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIFV0aWwuc2FmYXJpQ3NzU2l6ZVdvcmthcm91bmQoY2FudmFzKTtcbiAgfSwgMSk7XG59O1xuXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnNldFRleHR1cmVCb3VuZHMgPSBmdW5jdGlvbihsZWZ0Qm91bmRzLCByaWdodEJvdW5kcykge1xuICBpZiAoIWxlZnRCb3VuZHMpIHtcbiAgICBsZWZ0Qm91bmRzID0gWzAsIDAsIDAuNSwgMV07XG4gIH1cblxuICBpZiAoIXJpZ2h0Qm91bmRzKSB7XG4gICAgcmlnaHRCb3VuZHMgPSBbMC41LCAwLCAwLjUsIDFdO1xuICB9XG5cbiAgLy8gTGVmdCBleWVcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzBdID0gbGVmdEJvdW5kc1swXTsgLy8gWFxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbMV0gPSBsZWZ0Qm91bmRzWzFdOyAvLyBZXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVsyXSA9IGxlZnRCb3VuZHNbMl07IC8vIFdpZHRoXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVszXSA9IGxlZnRCb3VuZHNbM107IC8vIEhlaWdodFxuXG4gIC8vIFJpZ2h0IGV5ZVxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbNF0gPSByaWdodEJvdW5kc1swXTsgLy8gWFxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbNV0gPSByaWdodEJvdW5kc1sxXTsgLy8gWVxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbNl0gPSByaWdodEJvdW5kc1syXTsgLy8gV2lkdGhcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzddID0gcmlnaHRCb3VuZHNbM107IC8vIEhlaWdodFxufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBkaXN0b3J0aW9uIHBhc3Mgb24gdGhlIGluamVjdGVkIGJhY2tidWZmZXIsIHJlbmRlcmluZyBpdCB0byB0aGUgcmVhbFxuICogYmFja2J1ZmZlci5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5zdWJtaXRGcmFtZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXTtcblxuICBpZiAoIVdlYlZSQ29uZmlnLkRJUlRZX1NVQk1JVF9GUkFNRV9CSU5ESU5HUykge1xuICAgIGdsU3RhdGUucHVzaChcbiAgICAgIGdsLkNVUlJFTlRfUFJPR1JBTSxcbiAgICAgIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HLFxuICAgICAgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVJfQklORElORyxcbiAgICAgIGdsLlRFWFRVUkVfQklORElOR18yRCwgZ2wuVEVYVFVSRTBcbiAgICApO1xuICB9XG5cbiAgV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgZ2xTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgICAvLyBCaW5kIHRoZSByZWFsIGRlZmF1bHQgZnJhbWVidWZmZXJcbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuXG4gICAgLy8gTWFrZSBzdXJlIHRoZSBHTCBzdGF0ZSBpcyBpbiBhIGdvb2QgcGxhY2VcbiAgICBpZiAoc2VsZi5jdWxsRmFjZSkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLkNVTExfRkFDRSk7IH1cbiAgICBpZiAoc2VsZi5kZXB0aFRlc3QpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5ERVBUSF9URVNUKTsgfVxuICAgIGlmIChzZWxmLmJsZW5kKSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuQkxFTkQpOyB9XG4gICAgaWYgKHNlbGYuc2Npc3NvclRlc3QpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5TQ0lTU09SX1RFU1QpOyB9XG4gICAgaWYgKHNlbGYuc3RlbmNpbFRlc3QpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5TVEVOQ0lMX1RFU1QpOyB9XG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmNhbGwoZ2wsIHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xuICAgIHNlbGYucmVhbFZpZXdwb3J0LmNhbGwoZ2wsIDAsIDAsIGdsLmRyYXdpbmdCdWZmZXJXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG5cbiAgICAvLyBJZiB0aGUgYmFja2J1ZmZlciBoYXMgYW4gYWxwaGEgY2hhbm5lbCBjbGVhciBldmVyeSBmcmFtZSBzbyB0aGUgcGFnZVxuICAgIC8vIGRvZXNuJ3Qgc2hvdyB0aHJvdWdoLlxuICAgIGlmIChzZWxmLmN0eEF0dHJpYnMuYWxwaGEgfHwgVXRpbC5pc0lPUygpKSB7XG4gICAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmNhbGwoZ2wsIDAsIDAsIDAsIDEpO1xuICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgfVxuXG4gICAgLy8gQmluZCBkaXN0b3J0aW9uIHByb2dyYW0gYW5kIG1lc2hcbiAgICBnbC51c2VQcm9ncmFtKHNlbGYucHJvZ3JhbSk7XG5cbiAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBzZWxmLmluZGV4QnVmZmVyKTtcblxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBzZWxmLnZlcnRleEJ1ZmZlcik7XG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2VsZi5hdHRyaWJzLnBvc2l0aW9uKTtcbiAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzZWxmLmF0dHJpYnMudGV4Q29vcmQpO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2VsZi5hdHRyaWJzLnBvc2l0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDIwLCAwKTtcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNlbGYuYXR0cmlicy50ZXhDb29yZCwgMywgZ2wuRkxPQVQsIGZhbHNlLCAyMCwgOCk7XG5cbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcbiAgICBnbC51bmlmb3JtMWkoc2VsZi51bmlmb3Jtcy5kaWZmdXNlLCAwKTtcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBzZWxmLnJlbmRlclRhcmdldCk7XG5cbiAgICBnbC51bmlmb3JtNGZ2KHNlbGYudW5pZm9ybXMudmlld3BvcnRPZmZzZXRTY2FsZSwgc2VsZi52aWV3cG9ydE9mZnNldFNjYWxlKTtcblxuICAgIC8vIERyYXdzIGJvdGggZXllc1xuICAgIGdsLmRyYXdFbGVtZW50cyhnbC5UUklBTkdMRVMsIHNlbGYuaW5kZXhDb3VudCwgZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuXG4gICAgaWYgKHNlbGYuY2FyZGJvYXJkVUkpIHtcbiAgICAgIHNlbGYuY2FyZGJvYXJkVUkucmVuZGVyTm9TdGF0ZSgpO1xuICAgIH1cblxuICAgIC8vIEJpbmQgdGhlIGZha2UgZGVmYXVsdCBmcmFtZWJ1ZmZlciBhZ2FpblxuICAgIHNlbGYucmVhbEJpbmRGcmFtZWJ1ZmZlci5jYWxsKHNlbGYuZ2wsIGdsLkZSQU1FQlVGRkVSLCBzZWxmLmZyYW1lYnVmZmVyKTtcblxuICAgIC8vIElmIHByZXNlcnZlRHJhd2luZ0J1ZmZlciA9PSBmYWxzZSBjbGVhciB0aGUgZnJhbWVidWZmZXJcbiAgICBpZiAoIXNlbGYuY3R4QXR0cmlicy5wcmVzZXJ2ZURyYXdpbmdCdWZmZXIpIHtcbiAgICAgIHNlbGYucmVhbENsZWFyQ29sb3IuY2FsbChnbCwgMCwgMCwgMCwgMCk7XG4gICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICB9XG5cbiAgICBpZiAoIVdlYlZSQ29uZmlnLkRJUlRZX1NVQk1JVF9GUkFNRV9CSU5ESU5HUykge1xuICAgICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBzZWxmLmxhc3RCb3VuZEZyYW1lYnVmZmVyKTtcbiAgICB9XG5cbiAgICAvLyBSZXN0b3JlIHN0YXRlXG4gICAgaWYgKHNlbGYuY3VsbEZhY2UpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLkNVTExfRkFDRSk7IH1cbiAgICBpZiAoc2VsZi5kZXB0aFRlc3QpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLkRFUFRIX1RFU1QpOyB9XG4gICAgaWYgKHNlbGYuYmxlbmQpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLkJMRU5EKTsgfVxuICAgIGlmIChzZWxmLnNjaXNzb3JUZXN0KSB7IHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBnbC5TQ0lTU09SX1RFU1QpOyB9XG4gICAgaWYgKHNlbGYuc3RlbmNpbFRlc3QpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLlNURU5DSUxfVEVTVCk7IH1cblxuICAgIHNlbGYucmVhbENvbG9yTWFzay5hcHBseShnbCwgc2VsZi5jb2xvck1hc2spO1xuICAgIHNlbGYucmVhbFZpZXdwb3J0LmFwcGx5KGdsLCBzZWxmLnZpZXdwb3J0KTtcbiAgICBpZiAoc2VsZi5jdHhBdHRyaWJzLmFscGhhIHx8ICFzZWxmLmN0eEF0dHJpYnMucHJlc2VydmVEcmF3aW5nQnVmZmVyKSB7XG4gICAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmFwcGx5KGdsLCBzZWxmLmNsZWFyQ29sb3IpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gV29ya2Fyb3VuZCBmb3IgdGhlIGZhY3QgdGhhdCBTYWZhcmkgZG9lc24ndCBhbGxvdyB1cyB0byBwYXRjaCB0aGUgY2FudmFzXG4gIC8vIHdpZHRoIGFuZCBoZWlnaHQgY29ycmVjdGx5LiBBZnRlciBlYWNoIHN1Ym1pdCBmcmFtZSBjaGVjayB0byBzZWUgd2hhdCB0aGVcbiAgLy8gcmVhbCBiYWNrYnVmZmVyIHNpemUgaGFzIGJlZW4gc2V0IHRvIGFuZCByZXNpemUgdGhlIGZha2UgYmFja2J1ZmZlciBzaXplXG4gIC8vIHRvIG1hdGNoLlxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgdmFyIGNhbnZhcyA9IGdsLmNhbnZhcztcbiAgICBpZiAoY2FudmFzLndpZHRoICE9IHNlbGYuYnVmZmVyV2lkdGggfHwgY2FudmFzLmhlaWdodCAhPSBzZWxmLmJ1ZmZlckhlaWdodCkge1xuICAgICAgc2VsZi5idWZmZXJXaWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICAgIHNlbGYuYnVmZmVySGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcbiAgICAgIHNlbGYub25SZXNpemUoKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ2FsbCB3aGVuIHRoZSBkZXZpY2VJbmZvIGhhcyBjaGFuZ2VkLiBBdCB0aGlzIHBvaW50IHdlIG5lZWRcbiAqIHRvIHJlLWNhbGN1bGF0ZSB0aGUgZGlzdG9ydGlvbiBtZXNoLlxuICovXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnVwZGF0ZURldmljZUluZm8gPSBmdW5jdGlvbihkZXZpY2VJbmZvKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZ2xTdGF0ZSA9IFtnbC5BUlJBWV9CVUZGRVJfQklORElORywgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVJfQklORElOR107XG4gIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGdsU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gICAgdmFyIHZlcnRpY2VzID0gc2VsZi5jb21wdXRlTWVzaFZlcnRpY2VzXyhzZWxmLm1lc2hXaWR0aCwgc2VsZi5tZXNoSGVpZ2h0LCBkZXZpY2VJbmZvKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc2VsZi52ZXJ0ZXhCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB2ZXJ0aWNlcywgZ2wuU1RBVElDX0RSQVcpO1xuXG4gICAgLy8gSW5kaWNlcyBkb24ndCBjaGFuZ2UgYmFzZWQgb24gZGV2aWNlIHBhcmFtZXRlcnMsIHNvIG9ubHkgY29tcHV0ZSBvbmNlLlxuICAgIGlmICghc2VsZi5pbmRleENvdW50KSB7XG4gICAgICB2YXIgaW5kaWNlcyA9IHNlbGYuY29tcHV0ZU1lc2hJbmRpY2VzXyhzZWxmLm1lc2hXaWR0aCwgc2VsZi5tZXNoSGVpZ2h0KTtcbiAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHNlbGYuaW5kZXhCdWZmZXIpO1xuICAgICAgZ2wuYnVmZmVyRGF0YShnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaW5kaWNlcywgZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgc2VsZi5pbmRleENvdW50ID0gaW5kaWNlcy5sZW5ndGg7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogQnVpbGQgdGhlIGRpc3RvcnRpb24gbWVzaCB2ZXJ0aWNlcy5cbiAqIEJhc2VkIG9uIGNvZGUgZnJvbSB0aGUgVW5pdHkgY2FyZGJvYXJkIHBsdWdpbi5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5jb21wdXRlTWVzaFZlcnRpY2VzXyA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIGRldmljZUluZm8pIHtcbiAgdmFyIHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheSgyICogd2lkdGggKiBoZWlnaHQgKiA1KTtcblxuICB2YXIgbGVuc0ZydXN0dW0gPSBkZXZpY2VJbmZvLmdldExlZnRFeWVWaXNpYmxlVGFuQW5nbGVzKCk7XG4gIHZhciBub0xlbnNGcnVzdHVtID0gZGV2aWNlSW5mby5nZXRMZWZ0RXllTm9MZW5zVGFuQW5nbGVzKCk7XG4gIHZhciB2aWV3cG9ydCA9IGRldmljZUluZm8uZ2V0TGVmdEV5ZVZpc2libGVTY3JlZW5SZWN0KG5vTGVuc0ZydXN0dW0pO1xuICB2YXIgdmlkeCA9IDA7XG4gIHZhciBpaWR4ID0gMDtcbiAgZm9yICh2YXIgZSA9IDA7IGUgPCAyOyBlKyspIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGhlaWdodDsgaisrKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdpZHRoOyBpKyssIHZpZHgrKykge1xuICAgICAgICB2YXIgdSA9IGkgLyAod2lkdGggLSAxKTtcbiAgICAgICAgdmFyIHYgPSBqIC8gKGhlaWdodCAtIDEpO1xuXG4gICAgICAgIC8vIEdyaWQgcG9pbnRzIHJlZ3VsYXJseSBzcGFjZWQgaW4gU3RyZW9TY3JlZW4sIGFuZCBiYXJyZWwgZGlzdG9ydGVkIGluXG4gICAgICAgIC8vIHRoZSBtZXNoLlxuICAgICAgICB2YXIgcyA9IHU7XG4gICAgICAgIHZhciB0ID0gdjtcbiAgICAgICAgdmFyIHggPSBVdGlsLmxlcnAobGVuc0ZydXN0dW1bMF0sIGxlbnNGcnVzdHVtWzJdLCB1KTtcbiAgICAgICAgdmFyIHkgPSBVdGlsLmxlcnAobGVuc0ZydXN0dW1bM10sIGxlbnNGcnVzdHVtWzFdLCB2KTtcbiAgICAgICAgdmFyIGQgPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSk7XG4gICAgICAgIHZhciByID0gZGV2aWNlSW5mby5kaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKGQpO1xuICAgICAgICB2YXIgcCA9IHggKiByIC8gZDtcbiAgICAgICAgdmFyIHEgPSB5ICogciAvIGQ7XG4gICAgICAgIHUgPSAocCAtIG5vTGVuc0ZydXN0dW1bMF0pIC8gKG5vTGVuc0ZydXN0dW1bMl0gLSBub0xlbnNGcnVzdHVtWzBdKTtcbiAgICAgICAgdiA9IChxIC0gbm9MZW5zRnJ1c3R1bVszXSkgLyAobm9MZW5zRnJ1c3R1bVsxXSAtIG5vTGVuc0ZydXN0dW1bM10pO1xuXG4gICAgICAgIC8vIENvbnZlcnQgdSx2IHRvIG1lc2ggc2NyZWVuIGNvb3JkaW5hdGVzLlxuICAgICAgICB2YXIgYXNwZWN0ID0gZGV2aWNlSW5mby5kZXZpY2Uud2lkdGhNZXRlcnMgLyBkZXZpY2VJbmZvLmRldmljZS5oZWlnaHRNZXRlcnM7XG5cbiAgICAgICAgLy8gRklYTUU6IFRoZSBvcmlnaW5hbCBVbml0eSBwbHVnaW4gbXVsdGlwbGllZCBVIGJ5IHRoZSBhc3BlY3QgcmF0aW9cbiAgICAgICAgLy8gYW5kIGRpZG4ndCBtdWx0aXBseSBlaXRoZXIgdmFsdWUgYnkgMiwgYnV0IHRoYXQgc2VlbXMgdG8gZ2V0IGl0XG4gICAgICAgIC8vIHJlYWxseSBjbG9zZSB0byBjb3JyZWN0IGxvb2tpbmcgZm9yIG1lLiBJIGhhdGUgdGhpcyBraW5kIG9mIFwiRG9uJ3RcbiAgICAgICAgLy8ga25vdyB3aHkgaXQgd29ya3NcIiBjb2RlIHRob3VnaCwgYW5kIHdvbGQgbG92ZSBhIG1vcmUgbG9naWNhbFxuICAgICAgICAvLyBleHBsYW5hdGlvbiBvZiB3aGF0IG5lZWRzIHRvIGhhcHBlbiBoZXJlLlxuICAgICAgICB1ID0gKHZpZXdwb3J0LnggKyB1ICogdmlld3BvcnQud2lkdGggLSAwLjUpICogMi4wOyAvLyogYXNwZWN0O1xuICAgICAgICB2ID0gKHZpZXdwb3J0LnkgKyB2ICogdmlld3BvcnQuaGVpZ2h0IC0gMC41KSAqIDIuMDtcblxuICAgICAgICB2ZXJ0aWNlc1sodmlkeCAqIDUpICsgMF0gPSB1OyAvLyBwb3NpdGlvbi54XG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyAxXSA9IHY7IC8vIHBvc2l0aW9uLnlcbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDJdID0gczsgLy8gdGV4Q29vcmQueFxuICAgICAgICB2ZXJ0aWNlc1sodmlkeCAqIDUpICsgM10gPSB0OyAvLyB0ZXhDb29yZC55XG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyA0XSA9IGU7IC8vIHRleENvb3JkLnogKHZpZXdwb3J0IGluZGV4KVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgdyA9IGxlbnNGcnVzdHVtWzJdIC0gbGVuc0ZydXN0dW1bMF07XG4gICAgbGVuc0ZydXN0dW1bMF0gPSAtKHcgKyBsZW5zRnJ1c3R1bVswXSk7XG4gICAgbGVuc0ZydXN0dW1bMl0gPSB3IC0gbGVuc0ZydXN0dW1bMl07XG4gICAgdyA9IG5vTGVuc0ZydXN0dW1bMl0gLSBub0xlbnNGcnVzdHVtWzBdO1xuICAgIG5vTGVuc0ZydXN0dW1bMF0gPSAtKHcgKyBub0xlbnNGcnVzdHVtWzBdKTtcbiAgICBub0xlbnNGcnVzdHVtWzJdID0gdyAtIG5vTGVuc0ZydXN0dW1bMl07XG4gICAgdmlld3BvcnQueCA9IDEgLSAodmlld3BvcnQueCArIHZpZXdwb3J0LndpZHRoKTtcbiAgfVxuICByZXR1cm4gdmVydGljZXM7XG59XG5cbi8qKlxuICogQnVpbGQgdGhlIGRpc3RvcnRpb24gbWVzaCBpbmRpY2VzLlxuICogQmFzZWQgb24gY29kZSBmcm9tIHRoZSBVbml0eSBjYXJkYm9hcmQgcGx1Z2luLlxuICovXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLmNvbXB1dGVNZXNoSW5kaWNlc18gPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gIHZhciBpbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KDIgKiAod2lkdGggLSAxKSAqIChoZWlnaHQgLSAxKSAqIDYpO1xuICB2YXIgaGFsZndpZHRoID0gd2lkdGggLyAyO1xuICB2YXIgaGFsZmhlaWdodCA9IGhlaWdodCAvIDI7XG4gIHZhciB2aWR4ID0gMDtcbiAgdmFyIGlpZHggPSAwO1xuICBmb3IgKHZhciBlID0gMDsgZSA8IDI7IGUrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgaGVpZ2h0OyBqKyspIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2lkdGg7IGkrKywgdmlkeCsrKSB7XG4gICAgICAgIGlmIChpID09IDAgfHwgaiA9PSAwKVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAvLyBCdWlsZCBhIHF1YWQuICBMb3dlciByaWdodCBhbmQgdXBwZXIgbGVmdCBxdWFkcmFudHMgaGF2ZSBxdWFkcyB3aXRoXG4gICAgICAgIC8vIHRoZSB0cmlhbmdsZSBkaWFnb25hbCBmbGlwcGVkIHRvIGdldCB0aGUgdmlnbmV0dGUgdG8gaW50ZXJwb2xhdGVcbiAgICAgICAgLy8gY29ycmVjdGx5LlxuICAgICAgICBpZiAoKGkgPD0gaGFsZndpZHRoKSA9PSAoaiA8PSBoYWxmaGVpZ2h0KSkge1xuICAgICAgICAgIC8vIFF1YWQgZGlhZ29uYWwgbG93ZXIgbGVmdCB0byB1cHBlciByaWdodC5cbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4O1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aCAtIDE7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aCAtIDE7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBRdWFkIGRpYWdvbmFsIHVwcGVyIGxlZnQgdG8gbG93ZXIgcmlnaHQuXG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIDE7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSAxO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aCAtIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGljZXM7XG59O1xuXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLmdldE93blByb3BlcnR5RGVzY3JpcHRvcl8gPSBmdW5jdGlvbihwcm90bywgYXR0ck5hbWUpIHtcbiAgdmFyIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvLCBhdHRyTmFtZSk7XG4gIC8vIEluIHNvbWUgY2FzZXMgKGFoZW0uLi4gU2FmYXJpKSwgdGhlIGRlc2NyaXB0b3IgcmV0dXJucyB1bmRlZmluZWQgZ2V0IGFuZFxuICAvLyBzZXQgZmllbGRzLiBJbiB0aGlzIGNhc2UsIHdlIG5lZWQgdG8gY3JlYXRlIGEgc3ludGhldGljIHByb3BlcnR5XG4gIC8vIGRlc2NyaXB0b3IuIFRoaXMgd29ya3MgYXJvdW5kIHNvbWUgb2YgdGhlIGlzc3VlcyBpblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYm9yaXNtdXMvd2VidnItcG9seWZpbGwvaXNzdWVzLzQ2XG4gIGlmIChkZXNjcmlwdG9yLmdldCA9PT0gdW5kZWZpbmVkIHx8IGRlc2NyaXB0b3Iuc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7XG4gICAgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gdHJ1ZTtcbiAgICBkZXNjcmlwdG9yLmdldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICB9O1xuICAgIGRlc2NyaXB0b3Iuc2V0ID0gZnVuY3Rpb24odmFsKSB7XG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgdmFsKTtcbiAgICB9O1xuICB9XG4gIHJldHVybiBkZXNjcmlwdG9yO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYXJkYm9hcmREaXN0b3J0ZXI7XG5cbn0se1wiLi9jYXJkYm9hcmQtdWkuanNcIjo1LFwiLi9kZXBzL3dnbHUtcHJlc2VydmUtc3RhdGUuanNcIjo3LFwiLi91dGlsLmpzXCI6MjJ9XSw1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gX2RlcmVxXygnLi91dGlsLmpzJyk7XG52YXIgV0dMVVByZXNlcnZlR0xTdGF0ZSA9IF9kZXJlcV8oJy4vZGVwcy93Z2x1LXByZXNlcnZlLXN0YXRlLmpzJyk7XG5cbnZhciB1aVZTID0gW1xuICAnYXR0cmlidXRlIHZlYzIgcG9zaXRpb247JyxcblxuICAndW5pZm9ybSBtYXQ0IHByb2plY3Rpb25NYXQ7JyxcblxuICAndm9pZCBtYWluKCkgeycsXG4gICcgIGdsX1Bvc2l0aW9uID0gcHJvamVjdGlvbk1hdCAqIHZlYzQoIHBvc2l0aW9uLCAtMS4wLCAxLjAgKTsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgdWlGUyA9IFtcbiAgJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0OycsXG5cbiAgJ3VuaWZvcm0gdmVjNCBjb2xvcjsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcbiAgJyAgZ2xfRnJhZ0NvbG9yID0gY29sb3I7JyxcbiAgJ30nLFxuXS5qb2luKCdcXG4nKTtcblxudmFyIERFRzJSQUQgPSBNYXRoLlBJLzE4MC4wO1xuXG4vLyBUaGUgZ2VhciBoYXMgNiBpZGVudGljYWwgc2VjdGlvbnMsIGVhY2ggc3Bhbm5pbmcgNjAgZGVncmVlcy5cbnZhciBrQW5nbGVQZXJHZWFyU2VjdGlvbiA9IDYwO1xuXG4vLyBIYWxmLWFuZ2xlIG9mIHRoZSBzcGFuIG9mIHRoZSBvdXRlciByaW0uXG52YXIga091dGVyUmltRW5kQW5nbGUgPSAxMjtcblxuLy8gQW5nbGUgYmV0d2VlbiB0aGUgbWlkZGxlIG9mIHRoZSBvdXRlciByaW0gYW5kIHRoZSBzdGFydCBvZiB0aGUgaW5uZXIgcmltLlxudmFyIGtJbm5lclJpbUJlZ2luQW5nbGUgPSAyMDtcblxuLy8gRGlzdGFuY2UgZnJvbSBjZW50ZXIgdG8gb3V0ZXIgcmltLCBub3JtYWxpemVkIHNvIHRoYXQgdGhlIGVudGlyZSBtb2RlbFxuLy8gZml0cyBpbiBhIFstMSwgMV0geCBbLTEsIDFdIHNxdWFyZS5cbnZhciBrT3V0ZXJSYWRpdXMgPSAxO1xuXG4vLyBEaXN0YW5jZSBmcm9tIGNlbnRlciB0byBkZXByZXNzZWQgcmltLCBpbiBtb2RlbCB1bml0cy5cbnZhciBrTWlkZGxlUmFkaXVzID0gMC43NTtcblxuLy8gUmFkaXVzIG9mIHRoZSBpbm5lciBob2xsb3cgY2lyY2xlLCBpbiBtb2RlbCB1bml0cy5cbnZhciBrSW5uZXJSYWRpdXMgPSAwLjMxMjU7XG5cbi8vIENlbnRlciBsaW5lIHRoaWNrbmVzcyBpbiBEUC5cbnZhciBrQ2VudGVyTGluZVRoaWNrbmVzc0RwID0gNDtcblxuLy8gQnV0dG9uIHdpZHRoIGluIERQLlxudmFyIGtCdXR0b25XaWR0aERwID0gMjg7XG5cbi8vIEZhY3RvciB0byBzY2FsZSB0aGUgdG91Y2ggYXJlYSB0aGF0IHJlc3BvbmRzIHRvIHRoZSB0b3VjaC5cbnZhciBrVG91Y2hTbG9wRmFjdG9yID0gMS41O1xuXG52YXIgQW5nbGVzID0gW1xuICAwLCBrT3V0ZXJSaW1FbmRBbmdsZSwga0lubmVyUmltQmVnaW5BbmdsZSxcbiAga0FuZ2xlUGVyR2VhclNlY3Rpb24gLSBrSW5uZXJSaW1CZWdpbkFuZ2xlLFxuICBrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtPdXRlclJpbUVuZEFuZ2xlXG5dO1xuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGFsaWdubWVudCBsaW5lIGFuZCBcIm9wdGlvbnNcIiBnZWFyLiBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIGNhbnZhc1xuICogdGhpcyBpcyByZW5kZXJlZCBpbnRvIGNvdmVycyB0aGUgZW50aXJlIHNjcmVlbiAob3IgY2xvc2UgdG8gaXQuKVxuICovXG5mdW5jdGlvbiBDYXJkYm9hcmRVSShnbCkge1xuICB0aGlzLmdsID0gZ2w7XG5cbiAgdGhpcy5hdHRyaWJzID0ge1xuICAgIHBvc2l0aW9uOiAwXG4gIH07XG4gIHRoaXMucHJvZ3JhbSA9IFV0aWwubGlua1Byb2dyYW0oZ2wsIHVpVlMsIHVpRlMsIHRoaXMuYXR0cmlicyk7XG4gIHRoaXMudW5pZm9ybXMgPSBVdGlsLmdldFByb2dyYW1Vbmlmb3JtcyhnbCwgdGhpcy5wcm9ncmFtKTtcblxuICB0aGlzLnZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICB0aGlzLmdlYXJPZmZzZXQgPSAwO1xuICB0aGlzLmdlYXJWZXJ0ZXhDb3VudCA9IDA7XG4gIHRoaXMuYXJyb3dPZmZzZXQgPSAwO1xuICB0aGlzLmFycm93VmVydGV4Q291bnQgPSAwO1xuXG4gIHRoaXMucHJvak1hdCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuXG4gIHRoaXMubGlzdGVuZXIgPSBudWxsO1xuXG4gIHRoaXMub25SZXNpemUoKTtcbn07XG5cbi8qKlxuICogVGVhcnMgZG93biBhbGwgdGhlIHJlc291cmNlcyBjcmVhdGVkIGJ5IHRoZSBVSSByZW5kZXJlci5cbiAqL1xuQ2FyZGJvYXJkVUkucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcblxuICBpZiAodGhpcy5saXN0ZW5lcikge1xuICAgIGdsLmNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMubGlzdGVuZXIsIGZhbHNlKTtcbiAgfVxuXG4gIGdsLmRlbGV0ZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMudmVydGV4QnVmZmVyKTtcbn07XG5cbi8qKlxuICogQWRkcyBhIGxpc3RlbmVyIHRvIGNsaWNrcyBvbiB0aGUgZ2VhciBhbmQgYmFjayBpY29uc1xuICovXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUubGlzdGVuID0gZnVuY3Rpb24ob3B0aW9uc0NhbGxiYWNrLCBiYWNrQ2FsbGJhY2spIHtcbiAgdmFyIGNhbnZhcyA9IHRoaXMuZ2wuY2FudmFzO1xuICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgbWlkbGluZSA9IGNhbnZhcy5jbGllbnRXaWR0aCAvIDI7XG4gICAgdmFyIGJ1dHRvblNpemUgPSBrQnV0dG9uV2lkdGhEcCAqIGtUb3VjaFNsb3BGYWN0b3I7XG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSB1c2VyIGNsaWNrZWQgb24gKG9yIGFyb3VuZCkgdGhlIGdlYXIgaWNvblxuICAgIGlmIChldmVudC5jbGllbnRYID4gbWlkbGluZSAtIGJ1dHRvblNpemUgJiZcbiAgICAgICAgZXZlbnQuY2xpZW50WCA8IG1pZGxpbmUgKyBidXR0b25TaXplICYmXG4gICAgICAgIGV2ZW50LmNsaWVudFkgPiBjYW52YXMuY2xpZW50SGVpZ2h0IC0gYnV0dG9uU2l6ZSkge1xuICAgICAgb3B0aW9uc0NhbGxiYWNrKGV2ZW50KTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSB1c2VyIGNsaWNrZWQgb24gKG9yIGFyb3VuZCkgdGhlIGJhY2sgaWNvblxuICAgIGVsc2UgaWYgKGV2ZW50LmNsaWVudFggPCBidXR0b25TaXplICYmIGV2ZW50LmNsaWVudFkgPCBidXR0b25TaXplKSB7XG4gICAgICBiYWNrQ2FsbGJhY2soZXZlbnQpO1xuICAgIH1cbiAgfTtcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5saXN0ZW5lciwgZmFsc2UpO1xufTtcblxuLyoqXG4gKiBCdWlsZHMgdGhlIFVJIG1lc2guXG4gKi9cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5vblJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXG4gICAgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkdcbiAgXTtcblxuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIHZhciB2ZXJ0aWNlcyA9IFtdO1xuXG4gICAgdmFyIG1pZGxpbmUgPSBnbC5kcmF3aW5nQnVmZmVyV2lkdGggLyAyO1xuXG4gICAgLy8gQXNzdW1lcyB5b3VyIGNhbnZhcyB3aWR0aCBhbmQgaGVpZ2h0IGlzIHNjYWxlZCBwcm9wb3J0aW9uYXRlbHkuXG4gICAgLy8gVE9ETyhzbXVzKTogVGhlIGZvbGxvd2luZyBjYXVzZXMgYnV0dG9ucyB0byBiZWNvbWUgaHVnZSBvbiBpT1MsIGJ1dCBzZWVtc1xuICAgIC8vIGxpa2UgdGhlIHJpZ2h0IHRoaW5nIHRvIGRvLiBGb3Igbm93LCBhZGRlZCBhIGhhY2suIEJ1dCByZWFsbHksIGludmVzdGlnYXRlIHdoeS5cbiAgICB2YXIgZHBzID0gKGdsLmRyYXdpbmdCdWZmZXJXaWR0aCAvIChzY3JlZW4ud2lkdGggKiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbykpO1xuICAgIGlmICghVXRpbC5pc0lPUygpKSB7XG4gICAgICBkcHMgKj0gd2luZG93LmRldmljZVBpeGVsUmF0aW87XG4gICAgfVxuXG4gICAgdmFyIGxpbmVXaWR0aCA9IGtDZW50ZXJMaW5lVGhpY2tuZXNzRHAgKiBkcHMgLyAyO1xuICAgIHZhciBidXR0b25TaXplID0ga0J1dHRvbldpZHRoRHAgKiBrVG91Y2hTbG9wRmFjdG9yICogZHBzO1xuICAgIHZhciBidXR0b25TY2FsZSA9IGtCdXR0b25XaWR0aERwICogZHBzIC8gMjtcbiAgICB2YXIgYnV0dG9uQm9yZGVyID0gKChrQnV0dG9uV2lkdGhEcCAqIGtUb3VjaFNsb3BGYWN0b3IpIC0ga0J1dHRvbldpZHRoRHApICogZHBzO1xuXG4gICAgLy8gQnVpbGQgY2VudGVybGluZVxuICAgIHZlcnRpY2VzLnB1c2gobWlkbGluZSAtIGxpbmVXaWR0aCwgYnV0dG9uU2l6ZSk7XG4gICAgdmVydGljZXMucHVzaChtaWRsaW5lIC0gbGluZVdpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcbiAgICB2ZXJ0aWNlcy5wdXNoKG1pZGxpbmUgKyBsaW5lV2lkdGgsIGJ1dHRvblNpemUpO1xuICAgIHZlcnRpY2VzLnB1c2gobWlkbGluZSArIGxpbmVXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG5cbiAgICAvLyBCdWlsZCBnZWFyXG4gICAgc2VsZi5nZWFyT2Zmc2V0ID0gKHZlcnRpY2VzLmxlbmd0aCAvIDIpO1xuXG4gICAgZnVuY3Rpb24gYWRkR2VhclNlZ21lbnQodGhldGEsIHIpIHtcbiAgICAgIHZhciBhbmdsZSA9ICg5MCAtIHRoZXRhKSAqIERFRzJSQUQ7XG4gICAgICB2YXIgeCA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgIHZhciB5ID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgdmVydGljZXMucHVzaChrSW5uZXJSYWRpdXMgKiB4ICogYnV0dG9uU2NhbGUgKyBtaWRsaW5lLCBrSW5uZXJSYWRpdXMgKiB5ICogYnV0dG9uU2NhbGUgKyBidXR0b25TY2FsZSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHIgKiB4ICogYnV0dG9uU2NhbGUgKyBtaWRsaW5lLCByICogeSAqIGJ1dHRvblNjYWxlICsgYnV0dG9uU2NhbGUpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IDY7IGkrKykge1xuICAgICAgdmFyIHNlZ21lbnRUaGV0YSA9IGkgKiBrQW5nbGVQZXJHZWFyU2VjdGlvbjtcblxuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhLCBrT3V0ZXJSYWRpdXMpO1xuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhICsga091dGVyUmltRW5kQW5nbGUsIGtPdXRlclJhZGl1cyk7XG4gICAgICBhZGRHZWFyU2VnbWVudChzZWdtZW50VGhldGEgKyBrSW5uZXJSaW1CZWdpbkFuZ2xlLCBrTWlkZGxlUmFkaXVzKTtcbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSArIChrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtJbm5lclJpbUJlZ2luQW5nbGUpLCBrTWlkZGxlUmFkaXVzKTtcbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSArIChrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtPdXRlclJpbUVuZEFuZ2xlKSwga091dGVyUmFkaXVzKTtcbiAgICB9XG5cbiAgICBzZWxmLmdlYXJWZXJ0ZXhDb3VudCA9ICh2ZXJ0aWNlcy5sZW5ndGggLyAyKSAtIHNlbGYuZ2Vhck9mZnNldDtcblxuICAgIC8vIEJ1aWxkIGJhY2sgYXJyb3dcbiAgICBzZWxmLmFycm93T2Zmc2V0ID0gKHZlcnRpY2VzLmxlbmd0aCAvIDIpO1xuXG4gICAgZnVuY3Rpb24gYWRkQXJyb3dWZXJ0ZXgoeCwgeSkge1xuICAgICAgdmVydGljZXMucHVzaChidXR0b25Cb3JkZXIgKyB4LCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0IC0gYnV0dG9uQm9yZGVyIC0geSk7XG4gICAgfVxuXG4gICAgdmFyIGFuZ2xlZExpbmVXaWR0aCA9IGxpbmVXaWR0aCAvIE1hdGguc2luKDQ1ICogREVHMlJBRCk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleCgwLCBidXR0b25TY2FsZSk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYnV0dG9uU2NhbGUsIDApO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlICsgYW5nbGVkTGluZVdpZHRoLCBhbmdsZWRMaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgKyBhbmdsZWRMaW5lV2lkdGgpO1xuXG4gICAgYWRkQXJyb3dWZXJ0ZXgoYW5nbGVkTGluZVdpZHRoLCBidXR0b25TY2FsZSAtIGFuZ2xlZExpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoMCwgYnV0dG9uU2NhbGUpO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlLCBidXR0b25TY2FsZSAqIDIpO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlICsgYW5nbGVkTGluZVdpZHRoLCAoYnV0dG9uU2NhbGUgKiAyKSAtIGFuZ2xlZExpbmVXaWR0aCk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlIC0gYW5nbGVkTGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleCgwLCBidXR0b25TY2FsZSk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlIC0gbGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleChrQnV0dG9uV2lkdGhEcCAqIGRwcywgYnV0dG9uU2NhbGUgLSBsaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgKyBsaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGtCdXR0b25XaWR0aERwICogZHBzLCBidXR0b25TY2FsZSArIGxpbmVXaWR0aCk7XG5cbiAgICBzZWxmLmFycm93VmVydGV4Q291bnQgPSAodmVydGljZXMubGVuZ3RoIC8gMikgLSBzZWxmLmFycm93T2Zmc2V0O1xuXG4gICAgLy8gQnVmZmVyIGRhdGFcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc2VsZi52ZXJ0ZXhCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzKSwgZ2wuU1RBVElDX0RSQVcpO1xuICB9KTtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgZGlzdG9ydGlvbiBwYXNzIG9uIHRoZSBpbmplY3RlZCBiYWNrYnVmZmVyLCByZW5kZXJpbmcgaXQgdG8gdGhlIHJlYWxcbiAqIGJhY2tidWZmZXIuXG4gKi9cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW1xuICAgIGdsLkNVTExfRkFDRSxcbiAgICBnbC5ERVBUSF9URVNULFxuICAgIGdsLkJMRU5ELFxuICAgIGdsLlNDSVNTT1JfVEVTVCxcbiAgICBnbC5TVEVOQ0lMX1RFU1QsXG4gICAgZ2wuQ09MT1JfV1JJVEVNQVNLLFxuICAgIGdsLlZJRVdQT1JULFxuXG4gICAgZ2wuQ1VSUkVOVF9QUk9HUkFNLFxuICAgIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HXG4gIF07XG5cbiAgV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgZ2xTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgICAvLyBNYWtlIHN1cmUgdGhlIEdMIHN0YXRlIGlzIGluIGEgZ29vZCBwbGFjZVxuICAgIGdsLmRpc2FibGUoZ2wuQ1VMTF9GQUNFKTtcbiAgICBnbC5kaXNhYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xuICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5kaXNhYmxlKGdsLlNURU5DSUxfVEVTVCk7XG4gICAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xuICAgIGdsLnZpZXdwb3J0KDAsIDAsIGdsLmRyYXdpbmdCdWZmZXJXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG5cbiAgICBzZWxmLnJlbmRlck5vU3RhdGUoKTtcbiAgfSk7XG59O1xuXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUucmVuZGVyTm9TdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gIC8vIEJpbmQgZGlzdG9ydGlvbiBwcm9ncmFtIGFuZCBtZXNoXG4gIGdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcblxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXIpO1xuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh0aGlzLmF0dHJpYnMucG9zaXRpb24pO1xuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRoaXMuYXR0cmlicy5wb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCA4LCAwKTtcblxuICBnbC51bmlmb3JtNGYodGhpcy51bmlmb3Jtcy5jb2xvciwgMS4wLCAxLjAsIDEuMCwgMS4wKTtcblxuICBVdGlsLm9ydGhvTWF0cml4KHRoaXMucHJvak1hdCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCAwLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0LCAwLjEsIDEwMjQuMCk7XG4gIGdsLnVuaWZvcm1NYXRyaXg0ZnYodGhpcy51bmlmb3Jtcy5wcm9qZWN0aW9uTWF0LCBmYWxzZSwgdGhpcy5wcm9qTWF0KTtcblxuICAvLyBEcmF3cyBVSSBlbGVtZW50XG4gIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIDQpO1xuICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFX1NUUklQLCB0aGlzLmdlYXJPZmZzZXQsIHRoaXMuZ2VhclZlcnRleENvdW50KTtcbiAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRV9TVFJJUCwgdGhpcy5hcnJvd09mZnNldCwgdGhpcy5hcnJvd1ZlcnRleENvdW50KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FyZGJvYXJkVUk7XG5cbn0se1wiLi9kZXBzL3dnbHUtcHJlc2VydmUtc3RhdGUuanNcIjo3LFwiLi91dGlsLmpzXCI6MjJ9XSw2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBDYXJkYm9hcmREaXN0b3J0ZXIgPSBfZGVyZXFfKCcuL2NhcmRib2FyZC1kaXN0b3J0ZXIuanMnKTtcbnZhciBDYXJkYm9hcmRVSSA9IF9kZXJlcV8oJy4vY2FyZGJvYXJkLXVpLmpzJyk7XG52YXIgRGV2aWNlSW5mbyA9IF9kZXJlcV8oJy4vZGV2aWNlLWluZm8uanMnKTtcbnZhciBEcGRiID0gX2RlcmVxXygnLi9kcGRiL2RwZGIuanMnKTtcbnZhciBGdXNpb25Qb3NlU2Vuc29yID0gX2RlcmVxXygnLi9zZW5zb3ItZnVzaW9uL2Z1c2lvbi1wb3NlLXNlbnNvci5qcycpO1xudmFyIFJvdGF0ZUluc3RydWN0aW9ucyA9IF9kZXJlcV8oJy4vcm90YXRlLWluc3RydWN0aW9ucy5qcycpO1xudmFyIFZpZXdlclNlbGVjdG9yID0gX2RlcmVxXygnLi92aWV3ZXItc2VsZWN0b3IuanMnKTtcbnZhciBWUkRpc3BsYXkgPSBfZGVyZXFfKCcuL2Jhc2UuanMnKS5WUkRpc3BsYXk7XG52YXIgVXRpbCA9IF9kZXJlcV8oJy4vdXRpbC5qcycpO1xuXG52YXIgRXllID0ge1xuICBMRUZUOiAnbGVmdCcsXG4gIFJJR0hUOiAncmlnaHQnXG59O1xuXG4vKipcbiAqIFZSRGlzcGxheSBiYXNlZCBvbiBtb2JpbGUgZGV2aWNlIHBhcmFtZXRlcnMgYW5kIERldmljZU1vdGlvbiBBUElzLlxuICovXG5mdW5jdGlvbiBDYXJkYm9hcmRWUkRpc3BsYXkoKSB7XG4gIHRoaXMuZGlzcGxheU5hbWUgPSAnQ2FyZGJvYXJkIFZSRGlzcGxheSAod2VidnItcG9seWZpbGwpJztcblxuICB0aGlzLmNhcGFiaWxpdGllcy5oYXNPcmllbnRhdGlvbiA9IHRydWU7XG4gIHRoaXMuY2FwYWJpbGl0aWVzLmNhblByZXNlbnQgPSB0cnVlO1xuXG4gIC8vIFwiUHJpdmF0ZVwiIG1lbWJlcnMuXG4gIHRoaXMuYnVmZmVyU2NhbGVfID0gV2ViVlJDb25maWcuQlVGRkVSX1NDQUxFO1xuICB0aGlzLnBvc2VTZW5zb3JfID0gbmV3IEZ1c2lvblBvc2VTZW5zb3IoKTtcbiAgdGhpcy5kaXN0b3J0ZXJfID0gbnVsbDtcbiAgdGhpcy5jYXJkYm9hcmRVSV8gPSBudWxsO1xuXG4gIHRoaXMuZHBkYl8gPSBuZXcgRHBkYih0cnVlLCB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZF8uYmluZCh0aGlzKSk7XG4gIHRoaXMuZGV2aWNlSW5mb18gPSBuZXcgRGV2aWNlSW5mbyh0aGlzLmRwZGJfLmdldERldmljZVBhcmFtcygpKTtcblxuICB0aGlzLnZpZXdlclNlbGVjdG9yXyA9IG5ldyBWaWV3ZXJTZWxlY3RvcigpO1xuICB0aGlzLnZpZXdlclNlbGVjdG9yXy5vbignY2hhbmdlJywgdGhpcy5vblZpZXdlckNoYW5nZWRfLmJpbmQodGhpcykpO1xuXG4gIC8vIFNldCB0aGUgY29ycmVjdCBpbml0aWFsIHZpZXdlci5cbiAgdGhpcy5kZXZpY2VJbmZvXy5zZXRWaWV3ZXIodGhpcy52aWV3ZXJTZWxlY3Rvcl8uZ2V0Q3VycmVudFZpZXdlcigpKTtcblxuICBpZiAoIVdlYlZSQ29uZmlnLlJPVEFURV9JTlNUUlVDVElPTlNfRElTQUJMRUQpIHtcbiAgICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18gPSBuZXcgUm90YXRlSW5zdHJ1Y3Rpb25zKCk7XG4gIH1cblxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgLy8gTGlzdGVuIGZvciByZXNpemUgZXZlbnRzIHRvIHdvcmthcm91bmQgdGhpcyBhd2Z1bCBTYWZhcmkgYnVnLlxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLm9uUmVzaXplXy5iaW5kKHRoaXMpKTtcbiAgfVxufVxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZSA9IG5ldyBWUkRpc3BsYXkoKTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRJbW1lZGlhdGVQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcG9zaXRpb246IHRoaXMucG9zZVNlbnNvcl8uZ2V0UG9zaXRpb24oKSxcbiAgICBvcmllbnRhdGlvbjogdGhpcy5wb3NlU2Vuc29yXy5nZXRPcmllbnRhdGlvbigpLFxuICAgIGxpbmVhclZlbG9jaXR5OiBudWxsLFxuICAgIGxpbmVhckFjY2VsZXJhdGlvbjogbnVsbCxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG51bGwsXG4gICAgYW5ndWxhckFjY2VsZXJhdGlvbjogbnVsbFxuICB9O1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5yZXNldFBvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wb3NlU2Vuc29yXy5yZXNldFBvc2UoKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuZ2V0RXllUGFyYW1ldGVycyA9IGZ1bmN0aW9uKHdoaWNoRXllKSB7XG4gIHZhciBvZmZzZXQgPSBbdGhpcy5kZXZpY2VJbmZvXy52aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgKiAwLjUsIDAuMCwgMC4wXTtcbiAgdmFyIGZpZWxkT2ZWaWV3O1xuXG4gIC8vIFRPRE86IEZvViBjYW4gYmUgYSBsaXR0bGUgZXhwZW5zaXZlIHRvIGNvbXB1dGUuIENhY2hlIHdoZW4gZGV2aWNlIHBhcmFtcyBjaGFuZ2UuXG4gIGlmICh3aGljaEV5ZSA9PSBFeWUuTEVGVCkge1xuICAgIG9mZnNldFswXSAqPSAtMS4wO1xuICAgIGZpZWxkT2ZWaWV3ID0gdGhpcy5kZXZpY2VJbmZvXy5nZXRGaWVsZE9mVmlld0xlZnRFeWUoKTtcbiAgfSBlbHNlIGlmICh3aGljaEV5ZSA9PSBFeWUuUklHSFQpIHtcbiAgICBmaWVsZE9mVmlldyA9IHRoaXMuZGV2aWNlSW5mb18uZ2V0RmllbGRPZlZpZXdSaWdodEV5ZSgpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgZXllIHByb3ZpZGVkOiAlcycsIHdoaWNoRXllKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZmllbGRPZlZpZXc6IGZpZWxkT2ZWaWV3LFxuICAgIG9mZnNldDogb2Zmc2V0LFxuICAgIC8vIFRPRE86IFNob3VsZCBiZSBhYmxlIHRvIHByb3ZpZGUgYmV0dGVyIHZhbHVlcyB0aGFuIHRoZXNlLlxuICAgIHJlbmRlcldpZHRoOiB0aGlzLmRldmljZUluZm9fLmRldmljZS53aWR0aCAqIDAuNSAqIHRoaXMuYnVmZmVyU2NhbGVfLFxuICAgIHJlbmRlckhlaWdodDogdGhpcy5kZXZpY2VJbmZvXy5kZXZpY2UuaGVpZ2h0ICogdGhpcy5idWZmZXJTY2FsZV8sXG4gIH07XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uRGV2aWNlUGFyYW1zVXBkYXRlZF8gPSBmdW5jdGlvbihuZXdQYXJhbXMpIHtcbiAgaWYgKFV0aWwuaXNEZWJ1ZygpKSB7XG4gICAgY29uc29sZS5sb2coJ0RQREIgcmVwb3J0ZWQgdGhhdCBkZXZpY2UgcGFyYW1zIHdlcmUgdXBkYXRlZC4nKTtcbiAgfVxuICB0aGlzLmRldmljZUluZm9fLnVwZGF0ZURldmljZVBhcmFtcyhuZXdQYXJhbXMpO1xuXG4gIGlmICh0aGlzLmRpc3RvcnRlcl8pIHtcbiAgICB0aGlzLmRpc3RvcnRlcl8udXBkYXRlRGV2aWNlSW5mbyh0aGlzLmRldmljZUluZm9fKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS51cGRhdGVCb3VuZHNfID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5sYXllcl8gJiYgdGhpcy5kaXN0b3J0ZXJfICYmICh0aGlzLmxheWVyXy5sZWZ0Qm91bmRzIHx8IHRoaXMubGF5ZXJfLnJpZ2h0Qm91bmRzKSkge1xuICAgIHRoaXMuZGlzdG9ydGVyXy5zZXRUZXh0dXJlQm91bmRzKHRoaXMubGF5ZXJfLmxlZnRCb3VuZHMsIHRoaXMubGF5ZXJfLnJpZ2h0Qm91bmRzKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5iZWdpblByZXNlbnRfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMubGF5ZXJfLnNvdXJjZS5nZXRDb250ZXh0KCd3ZWJnbCcpO1xuICBpZiAoIWdsKVxuICAgIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpO1xuICBpZiAoIWdsKVxuICAgIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ3dlYmdsMicpO1xuXG4gIGlmICghZ2wpXG4gICAgcmV0dXJuOyAvLyBDYW4ndCBkbyBkaXN0b3J0aW9uIHdpdGhvdXQgYSBXZWJHTCBjb250ZXh0LlxuXG4gIC8vIFByb3ZpZGVzIGEgd2F5IHRvIG9wdCBvdXQgb2YgZGlzdG9ydGlvblxuICBpZiAodGhpcy5sYXllcl8ucHJlZGlzdG9ydGVkKSB7XG4gICAgaWYgKCFXZWJWUkNvbmZpZy5DQVJEQk9BUkRfVUlfRElTQUJMRUQpIHtcbiAgICAgIGdsLmNhbnZhcy53aWR0aCA9IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKSAqIHRoaXMuYnVmZmVyU2NhbGVfO1xuICAgICAgZ2wuY2FudmFzLmhlaWdodCA9IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCkgKiB0aGlzLmJ1ZmZlclNjYWxlXztcbiAgICAgIHRoaXMuY2FyZGJvYXJkVUlfID0gbmV3IENhcmRib2FyZFVJKGdsKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gQ3JlYXRlIGEgbmV3IGRpc3RvcnRlciBmb3IgdGhlIHRhcmdldCBjb250ZXh0XG4gICAgdGhpcy5kaXN0b3J0ZXJfID0gbmV3IENhcmRib2FyZERpc3RvcnRlcihnbCk7XG4gICAgdGhpcy5kaXN0b3J0ZXJfLnVwZGF0ZURldmljZUluZm8odGhpcy5kZXZpY2VJbmZvXyk7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8gPSB0aGlzLmRpc3RvcnRlcl8uY2FyZGJvYXJkVUk7XG4gIH1cblxuICBpZiAodGhpcy5jYXJkYm9hcmRVSV8pIHtcbiAgICB0aGlzLmNhcmRib2FyZFVJXy5saXN0ZW4oZnVuY3Rpb24oZSkge1xuICAgICAgLy8gT3B0aW9ucyBjbGlja2VkLlxuICAgICAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8uc2hvdyh0aGlzLmxheWVyXy5zb3VyY2UucGFyZW50RWxlbWVudCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0uYmluZCh0aGlzKSwgZnVuY3Rpb24oZSkge1xuICAgICAgLy8gQmFjayBjbGlja2VkLlxuICAgICAgdGhpcy5leGl0UHJlc2VudCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9XG5cbiAgaWYgKHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXykge1xuICAgIGlmIChVdGlsLmlzTGFuZHNjYXBlTW9kZSgpICYmIFV0aWwuaXNNb2JpbGUoKSkge1xuICAgICAgLy8gSW4gbGFuZHNjYXBlIG1vZGUsIHRlbXBvcmFyaWx5IHNob3cgdGhlIFwicHV0IGludG8gQ2FyZGJvYXJkXCJcbiAgICAgIC8vIGludGVyc3RpdGlhbC4gT3RoZXJ3aXNlLCBkbyB0aGUgZGVmYXVsdCB0aGluZy5cbiAgICAgIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXy5zaG93VGVtcG9yYXJpbHkoMzAwMCwgdGhpcy5sYXllcl8uc291cmNlLnBhcmVudEVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18udXBkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gTGlzdGVuIGZvciBvcmllbnRhdGlvbiBjaGFuZ2UgZXZlbnRzIGluIG9yZGVyIHRvIHNob3cgaW50ZXJzdGl0aWFsLlxuICB0aGlzLm9yaWVudGF0aW9uSGFuZGxlciA9IHRoaXMub25PcmllbnRhdGlvbkNoYW5nZV8uYmluZCh0aGlzKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgdGhpcy5vcmllbnRhdGlvbkhhbmRsZXIpO1xuXG4gIC8vIExpc3RlbiBmb3IgcHJlc2VudCBkaXNwbGF5IGNoYW5nZSBldmVudHMgaW4gb3JkZXIgdG8gdXBkYXRlIGRpc3RvcnRlciBkaW1lbnNpb25zXG4gIHRoaXMudnJkaXNwbGF5cHJlc2VudGNoYW5nZUhhbmRsZXIgPSB0aGlzLnVwZGF0ZUJvdW5kc18uYmluZCh0aGlzKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3ZyZGlzcGxheXByZXNlbnRjaGFuZ2UnLCB0aGlzLnZyZGlzcGxheXByZXNlbnRjaGFuZ2VIYW5kbGVyKTtcblxuICAvLyBGaXJlIHRoaXMgZXZlbnQgaW5pdGlhbGx5LCB0byBnaXZlIGdlb21ldHJ5LWRpc3RvcnRpb24gY2xpZW50cyB0aGUgY2hhbmNlXG4gIC8vIHRvIGRvIHNvbWV0aGluZyBjdXN0b20uXG4gIHRoaXMuZmlyZVZSRGlzcGxheURldmljZVBhcmFtc0NoYW5nZV8oKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuZW5kUHJlc2VudF8gPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGlzdG9ydGVyXykge1xuICAgIHRoaXMuZGlzdG9ydGVyXy5kZXN0cm95KCk7XG4gICAgdGhpcy5kaXN0b3J0ZXJfID0gbnVsbDtcbiAgfVxuICBpZiAodGhpcy5jYXJkYm9hcmRVSV8pIHtcbiAgICB0aGlzLmNhcmRib2FyZFVJXy5kZXN0cm95KCk7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8gPSBudWxsO1xuICB9XG5cbiAgaWYgKHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXykge1xuICAgIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXy5oaWRlKCk7XG4gIH1cbiAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8uaGlkZSgpO1xuXG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHRoaXMub3JpZW50YXRpb25IYW5kbGVyKTtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3ZyZGlzcGxheXByZXNlbnRjaGFuZ2UnLCB0aGlzLnZyZGlzcGxheXByZXNlbnRjaGFuZ2VIYW5kbGVyKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuc3VibWl0RnJhbWUgPSBmdW5jdGlvbihwb3NlKSB7XG4gIGlmICh0aGlzLmRpc3RvcnRlcl8pIHtcbiAgICB0aGlzLmRpc3RvcnRlcl8uc3VibWl0RnJhbWUoKTtcbiAgfSBlbHNlIGlmICh0aGlzLmNhcmRib2FyZFVJXyAmJiB0aGlzLmxheWVyXykge1xuICAgIC8vIEhhY2sgZm9yIHByZWRpc3RvcnRlZDogdHJ1ZS5cbiAgICB2YXIgY2FudmFzID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ3dlYmdsJykuY2FudmFzO1xuICAgIGlmIChjYW52YXMud2lkdGggIT0gdGhpcy5sYXN0V2lkdGggfHwgY2FudmFzLmhlaWdodCAhPSB0aGlzLmxhc3RIZWlnaHQpIHtcbiAgICAgIHRoaXMuY2FyZGJvYXJkVUlfLm9uUmVzaXplKCk7XG4gICAgfVxuICAgIHRoaXMubGFzdFdpZHRoID0gY2FudmFzLndpZHRoO1xuICAgIHRoaXMubGFzdEhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG5cbiAgICAvLyBSZW5kZXIgdGhlIENhcmRib2FyZCBVSS5cbiAgICB0aGlzLmNhcmRib2FyZFVJXy5yZW5kZXIoKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbk9yaWVudGF0aW9uQ2hhbmdlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgLy8gSGlkZSB0aGUgdmlld2VyIHNlbGVjdG9yLlxuICB0aGlzLnZpZXdlclNlbGVjdG9yXy5oaWRlKCk7XG5cbiAgLy8gVXBkYXRlIHRoZSByb3RhdGUgaW5zdHJ1Y3Rpb25zLlxuICBpZiAodGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfKSB7XG4gICAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfLnVwZGF0ZSgpO1xuICB9XG5cbiAgdGhpcy5vblJlc2l6ZV8oKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25SZXNpemVfID0gZnVuY3Rpb24oZSkge1xuICBpZiAodGhpcy5sYXllcl8pIHtcbiAgICB2YXIgZ2wgPSB0aGlzLmxheWVyXy5zb3VyY2UuZ2V0Q29udGV4dCgnd2ViZ2wnKTtcbiAgICAvLyBTaXplIHRoZSBDU1MgY2FudmFzLlxuICAgIC8vIEFkZGVkIHBhZGRpbmcgb24gcmlnaHQgYW5kIGJvdHRvbSBiZWNhdXNlIGlQaG9uZSA1IHdpbGwgbm90XG4gICAgLy8gaGlkZSB0aGUgVVJMIGJhciB1bmxlc3MgY29udGVudCBpcyBiaWdnZXIgdGhhbiB0aGUgc2NyZWVuLlxuICAgIC8vIFRoaXMgd2lsbCBub3QgYmUgdmlzaWJsZSBhcyBsb25nIGFzIHRoZSBjb250YWluZXIgZWxlbWVudCAoZS5nLiBib2R5KVxuICAgIC8vIGlzIHNldCB0byAnb3ZlcmZsb3c6IGhpZGRlbicuXG4gICAgdmFyIGNzc1Byb3BlcnRpZXMgPSBbXG4gICAgICAncG9zaXRpb246IGFic29sdXRlJyxcbiAgICAgICd0b3A6IDAnLFxuICAgICAgJ2xlZnQ6IDAnLFxuICAgICAgJ3dpZHRoOiAnICsgTWF0aC5tYXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KSArICdweCcsXG4gICAgICAnaGVpZ2h0OiAnICsgTWF0aC5taW4oc2NyZWVuLmhlaWdodCwgc2NyZWVuLndpZHRoKSArICdweCcsXG4gICAgICAnYm9yZGVyOiAwJyxcbiAgICAgICdtYXJnaW46IDAnLFxuICAgICAgJ3BhZGRpbmc6IDAgMTBweCAxMHB4IDAnLFxuICAgIF07XG4gICAgZ2wuY2FudmFzLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBjc3NQcm9wZXJ0aWVzLmpvaW4oJzsgJykgKyAnOycpO1xuXG4gICAgVXRpbC5zYWZhcmlDc3NTaXplV29ya2Fyb3VuZChnbC5jYW52YXMpO1xuICB9XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uVmlld2VyQ2hhbmdlZF8gPSBmdW5jdGlvbih2aWV3ZXIpIHtcbiAgdGhpcy5kZXZpY2VJbmZvXy5zZXRWaWV3ZXIodmlld2VyKTtcblxuICBpZiAodGhpcy5kaXN0b3J0ZXJfKSB7XG4gICAgLy8gVXBkYXRlIHRoZSBkaXN0b3J0aW9uIGFwcHJvcHJpYXRlbHkuXG4gICAgdGhpcy5kaXN0b3J0ZXJfLnVwZGF0ZURldmljZUluZm8odGhpcy5kZXZpY2VJbmZvXyk7XG4gIH1cblxuICAvLyBGaXJlIGEgbmV3IGV2ZW50IGNvbnRhaW5pbmcgdmlld2VyIGFuZCBkZXZpY2UgcGFyYW1ldGVycyBmb3IgY2xpZW50cyB0aGF0XG4gIC8vIHdhbnQgdG8gaW1wbGVtZW50IHRoZWlyIG93biBnZW9tZXRyeS1iYXNlZCBkaXN0b3J0aW9uLlxuICB0aGlzLmZpcmVWUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfKCk7XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmZpcmVWUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCgndnJkaXNwbGF5ZGV2aWNlcGFyYW1zY2hhbmdlJywge1xuICAgIGRldGFpbDoge1xuICAgICAgdnJkaXNwbGF5OiB0aGlzLFxuICAgICAgZGV2aWNlSW5mbzogdGhpcy5kZXZpY2VJbmZvXyxcbiAgICB9XG4gIH0pO1xuICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcmRib2FyZFZSRGlzcGxheTtcblxufSx7XCIuL2Jhc2UuanNcIjozLFwiLi9jYXJkYm9hcmQtZGlzdG9ydGVyLmpzXCI6NCxcIi4vY2FyZGJvYXJkLXVpLmpzXCI6NSxcIi4vZGV2aWNlLWluZm8uanNcIjo4LFwiLi9kcGRiL2RwZGIuanNcIjoxMixcIi4vcm90YXRlLWluc3RydWN0aW9ucy5qc1wiOjE2LFwiLi9zZW5zb3ItZnVzaW9uL2Z1c2lvbi1wb3NlLXNlbnNvci5qc1wiOjE4LFwiLi91dGlsLmpzXCI6MjIsXCIuL3ZpZXdlci1zZWxlY3Rvci5qc1wiOjIzfV0sNzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuQ29weXJpZ2h0IChjKSAyMDE2LCBCcmFuZG9uIEpvbmVzLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuXG4qL1xuXG4vKlxuQ2FjaGVzIHNwZWNpZmllZCBHTCBzdGF0ZSwgcnVucyBhIGNhbGxiYWNrLCBhbmQgcmVzdG9yZXMgdGhlIGNhY2hlZCBzdGF0ZSB3aGVuXG5kb25lLlxuXG5FeGFtcGxlIHVzYWdlOlxuXG52YXIgc2F2ZWRTdGF0ZSA9IFtcbiAgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkcsXG5cbiAgLy8gVEVYVFVSRV9CSU5ESU5HXzJEIG9yIF9DVUJFX01BUCBtdXN0IGFsd2F5cyBiZSBmb2xsb3dlZCBieSB0aGUgdGV4dXJlIHVuaXQuXG4gIGdsLlRFWFRVUkVfQklORElOR18yRCwgZ2wuVEVYVFVSRTAsXG5cbiAgZ2wuQ0xFQVJfQ09MT1IsXG5dO1xuLy8gQWZ0ZXIgdGhpcyBjYWxsIHRoZSBhcnJheSBidWZmZXIsIHRleHR1cmUgdW5pdCAwLCBhY3RpdmUgdGV4dHVyZSwgYW5kIGNsZWFyXG4vLyBjb2xvciB3aWxsIGJlIHJlc3RvcmVkLiBUaGUgdmlld3BvcnQgd2lsbCByZW1haW4gY2hhbmdlZCwgaG93ZXZlciwgYmVjYXVzZVxuLy8gZ2wuVklFV1BPUlQgd2FzIG5vdCBpbmNsdWRlZCBpbiB0aGUgc2F2ZWRTdGF0ZSBsaXN0LlxuV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgc2F2ZWRTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgZ2wudmlld3BvcnQoMCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcblxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKTtcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIC4uLi4pO1xuXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApO1xuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKTtcbiAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAuLi4pO1xuXG4gIGdsLmNsZWFyQ29sb3IoMSwgMCwgMCwgMSk7XG4gIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xufSk7XG5cbk5vdGUgdGhhdCB0aGlzIGlzIG5vdCBpbnRlbmRlZCB0byBiZSBmYXN0LiBNYW5hZ2luZyBzdGF0ZSBpbiB5b3VyIG93biBjb2RlIHRvXG5hdm9pZCByZWR1bmRhbnQgc3RhdGUgc2V0dGluZyBhbmQgcXVlcnlpbmcgd2lsbCBhbHdheXMgYmUgZmFzdGVyLiBUaGlzIGZ1bmN0aW9uXG5pcyBtb3N0IHVzZWZ1bCBmb3IgY2FzZXMgd2hlcmUgeW91IG1heSBub3QgaGF2ZSBmdWxsIGNvbnRyb2wgb3ZlciB0aGUgV2ViR0xcbmNhbGxzIGJlaW5nIG1hZGUsIHN1Y2ggYXMgdG9vbGluZyBvciBlZmZlY3QgaW5qZWN0b3JzLlxuKi9cblxuZnVuY3Rpb24gV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgYmluZGluZ3MsIGNhbGxiYWNrKSB7XG4gIGlmICghYmluZGluZ3MpIHtcbiAgICBjYWxsYmFjayhnbCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGJvdW5kVmFsdWVzID0gW107XG5cbiAgdmFyIGFjdGl2ZVRleHR1cmUgPSBudWxsO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tpXTtcbiAgICBzd2l0Y2ggKGJpbmRpbmcpIHtcbiAgICAgIGNhc2UgZ2wuVEVYVFVSRV9CSU5ESU5HXzJEOlxuICAgICAgY2FzZSBnbC5URVhUVVJFX0JJTkRJTkdfQ1VCRV9NQVA6XG4gICAgICAgIHZhciB0ZXh0dXJlVW5pdCA9IGJpbmRpbmdzWysraV07XG4gICAgICAgIGlmICh0ZXh0dXJlVW5pdCA8IGdsLlRFWFRVUkUwIHx8IHRleHR1cmVVbml0ID4gZ2wuVEVYVFVSRTMxKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlRFWFRVUkVfQklORElOR18yRCBvciBURVhUVVJFX0JJTkRJTkdfQ1VCRV9NQVAgbXVzdCBiZSBmb2xsb3dlZCBieSBhIHZhbGlkIHRleHR1cmUgdW5pdFwiKTtcbiAgICAgICAgICBib3VuZFZhbHVlcy5wdXNoKG51bGwsIG51bGwpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYWN0aXZlVGV4dHVyZSkge1xuICAgICAgICAgIGFjdGl2ZVRleHR1cmUgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQUNUSVZFX1RFWFRVUkUpO1xuICAgICAgICB9XG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUodGV4dHVyZVVuaXQpO1xuICAgICAgICBib3VuZFZhbHVlcy5wdXNoKGdsLmdldFBhcmFtZXRlcihiaW5kaW5nKSwgbnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5BQ1RJVkVfVEVYVFVSRTpcbiAgICAgICAgYWN0aXZlVGV4dHVyZSA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSk7XG4gICAgICAgIGJvdW5kVmFsdWVzLnB1c2gobnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYm91bmRWYWx1ZXMucHVzaChnbC5nZXRQYXJhbWV0ZXIoYmluZGluZykpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBjYWxsYmFjayhnbCk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaW5kaW5ncy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBiaW5kaW5nID0gYmluZGluZ3NbaV07XG4gICAgdmFyIGJvdW5kVmFsdWUgPSBib3VuZFZhbHVlc1tpXTtcbiAgICBzd2l0Y2ggKGJpbmRpbmcpIHtcbiAgICAgIGNhc2UgZ2wuQUNUSVZFX1RFWFRVUkU6XG4gICAgICAgIGJyZWFrOyAvLyBJZ25vcmUgdGhpcyBiaW5kaW5nLCBzaW5jZSB3ZSBzcGVjaWFsLWNhc2UgaXQgdG8gaGFwcGVuIGxhc3QuXG4gICAgICBjYXNlIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HOlxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5DT0xPUl9DTEVBUl9WQUxVRTpcbiAgICAgICAgZ2wuY2xlYXJDb2xvcihib3VuZFZhbHVlWzBdLCBib3VuZFZhbHVlWzFdLCBib3VuZFZhbHVlWzJdLCBib3VuZFZhbHVlWzNdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkNPTE9SX1dSSVRFTUFTSzpcbiAgICAgICAgZ2wuY29sb3JNYXNrKGJvdW5kVmFsdWVbMF0sIGJvdW5kVmFsdWVbMV0sIGJvdW5kVmFsdWVbMl0sIGJvdW5kVmFsdWVbM10pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuQ1VSUkVOVF9QUk9HUkFNOlxuICAgICAgICBnbC51c2VQcm9ncmFtKGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVJfQklORElORzpcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5GUkFNRUJVRkZFUl9CSU5ESU5HOlxuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuUkVOREVSQlVGRkVSX0JJTkRJTkc6XG4gICAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLlRFWFRVUkVfQklORElOR18yRDpcbiAgICAgICAgdmFyIHRleHR1cmVVbml0ID0gYmluZGluZ3NbKytpXTtcbiAgICAgICAgaWYgKHRleHR1cmVVbml0IDwgZ2wuVEVYVFVSRTAgfHwgdGV4dHVyZVVuaXQgPiBnbC5URVhUVVJFMzEpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUodGV4dHVyZVVuaXQpO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLlRFWFRVUkVfQklORElOR19DVUJFX01BUDpcbiAgICAgICAgdmFyIHRleHR1cmVVbml0ID0gYmluZGluZ3NbKytpXTtcbiAgICAgICAgaWYgKHRleHR1cmVVbml0IDwgZ2wuVEVYVFVSRTAgfHwgdGV4dHVyZVVuaXQgPiBnbC5URVhUVVJFMzEpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUodGV4dHVyZVVuaXQpO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLlZJRVdQT1JUOlxuICAgICAgICBnbC52aWV3cG9ydChib3VuZFZhbHVlWzBdLCBib3VuZFZhbHVlWzFdLCBib3VuZFZhbHVlWzJdLCBib3VuZFZhbHVlWzNdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkJMRU5EOlxuICAgICAgY2FzZSBnbC5DVUxMX0ZBQ0U6XG4gICAgICBjYXNlIGdsLkRFUFRIX1RFU1Q6XG4gICAgICBjYXNlIGdsLlNDSVNTT1JfVEVTVDpcbiAgICAgIGNhc2UgZ2wuU1RFTkNJTF9URVNUOlxuICAgICAgICBpZiAoYm91bmRWYWx1ZSkge1xuICAgICAgICAgIGdsLmVuYWJsZShiaW5kaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBnbC5kaXNhYmxlKGJpbmRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5sb2coXCJObyBHTCByZXN0b3JlIGJlaGF2aW9yIGZvciAweFwiICsgYmluZGluZy50b1N0cmluZygxNikpO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoYWN0aXZlVGV4dHVyZSkge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShhY3RpdmVUZXh0dXJlKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXR0xVUHJlc2VydmVHTFN0YXRlO1xufSx7fV0sODpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgRGlzdG9ydGlvbiA9IF9kZXJlcV8oJy4vZGlzdG9ydGlvbi9kaXN0b3J0aW9uLmpzJyk7XG52YXIgTWF0aFV0aWwgPSBfZGVyZXFfKCcuL21hdGgtdXRpbC5qcycpO1xudmFyIFV0aWwgPSBfZGVyZXFfKCcuL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gRGV2aWNlKHBhcmFtcykge1xuICB0aGlzLndpZHRoID0gcGFyYW1zLndpZHRoIHx8IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKTtcbiAgdGhpcy5oZWlnaHQgPSBwYXJhbXMuaGVpZ2h0IHx8IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCk7XG4gIHRoaXMud2lkdGhNZXRlcnMgPSBwYXJhbXMud2lkdGhNZXRlcnM7XG4gIHRoaXMuaGVpZ2h0TWV0ZXJzID0gcGFyYW1zLmhlaWdodE1ldGVycztcbiAgdGhpcy5iZXZlbE1ldGVycyA9IHBhcmFtcy5iZXZlbE1ldGVycztcbn1cblxuXG4vLyBGYWxsYmFjayBBbmRyb2lkIGRldmljZSAoYmFzZWQgb24gTmV4dXMgNSBtZWFzdXJlbWVudHMpIGZvciB1c2Ugd2hlblxuLy8gd2UgY2FuJ3QgcmVjb2duaXplIGFuIEFuZHJvaWQgZGV2aWNlLlxudmFyIERFRkFVTFRfQU5EUk9JRCA9IG5ldyBEZXZpY2Uoe1xuICB3aWR0aE1ldGVyczogMC4xMTAsXG4gIGhlaWdodE1ldGVyczogMC4wNjIsXG4gIGJldmVsTWV0ZXJzOiAwLjAwNFxufSk7XG5cbi8vIEZhbGxiYWNrIGlPUyBkZXZpY2UgKGJhc2VkIG9uIGlQaG9uZTYpIGZvciB1c2Ugd2hlblxuLy8gd2UgY2FuJ3QgcmVjb2duaXplIGFuIEFuZHJvaWQgZGV2aWNlLlxudmFyIERFRkFVTFRfSU9TID0gbmV3IERldmljZSh7XG4gIHdpZHRoTWV0ZXJzOiAwLjEwMzgsXG4gIGhlaWdodE1ldGVyczogMC4wNTg0LFxuICBiZXZlbE1ldGVyczogMC4wMDRcbn0pO1xuXG5cbnZhciBWaWV3ZXJzID0ge1xuICBDYXJkYm9hcmRWMTogbmV3IENhcmRib2FyZFZpZXdlcih7XG4gICAgaWQ6ICdDYXJkYm9hcmRWMScsXG4gICAgbGFiZWw6ICdDYXJkYm9hcmQgSS9PIDIwMTQnLFxuICAgIGZvdjogNDAsXG4gICAgaW50ZXJMZW5zRGlzdGFuY2U6IDAuMDYwLFxuICAgIGJhc2VsaW5lTGVuc0Rpc3RhbmNlOiAwLjAzNSxcbiAgICBzY3JlZW5MZW5zRGlzdGFuY2U6IDAuMDQyLFxuICAgIGRpc3RvcnRpb25Db2VmZmljaWVudHM6IFswLjQ0MSwgMC4xNTZdLFxuICAgIGludmVyc2VDb2VmZmljaWVudHM6IFstMC40NDEwMDM1LCAwLjQyNzU2MTU1LCAtMC40ODA0NDM5LCAwLjU0NjAxMzksXG4gICAgICAtMC41ODgyMTE4MywgMC41NzMzOTM4LCAtMC40ODMwMzIwMiwgMC4zMzI5OTA4MywgLTAuMTc1NzM4NDEsXG4gICAgICAwLjA2NTE3NzIsIC0wLjAxNDg4OTYzLCAwLjAwMTU1OTgzNF1cbiAgfSksXG4gIENhcmRib2FyZFYyOiBuZXcgQ2FyZGJvYXJkVmlld2VyKHtcbiAgICBpZDogJ0NhcmRib2FyZFYyJyxcbiAgICBsYWJlbDogJ0NhcmRib2FyZCBJL08gMjAxNScsXG4gICAgZm92OiA2MCxcbiAgICBpbnRlckxlbnNEaXN0YW5jZTogMC4wNjQsXG4gICAgYmFzZWxpbmVMZW5zRGlzdGFuY2U6IDAuMDM1LFxuICAgIHNjcmVlbkxlbnNEaXN0YW5jZTogMC4wMzksXG4gICAgZGlzdG9ydGlvbkNvZWZmaWNpZW50czogWzAuMzQsIDAuNTVdLFxuICAgIGludmVyc2VDb2VmZmljaWVudHM6IFstMC4zMzgzNjcwNCwgLTAuMTgxNjIxODUsIDAuODYyNjU1LCAtMS4yNDYyMDUxLFxuICAgICAgMS4wNTYwNjAyLCAtMC41ODIwODMxNywgMC4yMTYwOTA3OCwgLTAuMDU0NDQ4MjMsIDAuMDA5MTc3OTU2LFxuICAgICAgLTkuOTA0MTY5RS00LCA2LjE4MzUzNUUtNSwgLTEuNjk4MTgwM0UtNl1cbiAgfSlcbn07XG5cblxudmFyIERFRkFVTFRfTEVGVF9DRU5URVIgPSB7eDogMC41LCB5OiAwLjV9O1xudmFyIERFRkFVTFRfUklHSFRfQ0VOVEVSID0ge3g6IDAuNSwgeTogMC41fTtcblxuLyoqXG4gKiBNYW5hZ2VzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBkZXZpY2UgYW5kIHRoZSB2aWV3ZXIuXG4gKlxuICogZGV2aWNlUGFyYW1zIGluZGljYXRlcyB0aGUgcGFyYW1ldGVycyBvZiB0aGUgZGV2aWNlIHRvIHVzZSAoZ2VuZXJhbGx5XG4gKiBvYnRhaW5lZCBmcm9tIGRwZGIuZ2V0RGV2aWNlUGFyYW1zKCkpLiBDYW4gYmUgbnVsbCB0byBtZWFuIG5vIGRldmljZVxuICogcGFyYW1zIHdlcmUgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIERldmljZUluZm8oZGV2aWNlUGFyYW1zKSB7XG4gIHRoaXMudmlld2VyID0gVmlld2Vycy5DYXJkYm9hcmRWMjtcbiAgdGhpcy51cGRhdGVEZXZpY2VQYXJhbXMoZGV2aWNlUGFyYW1zKTtcbiAgdGhpcy5kaXN0b3J0aW9uID0gbmV3IERpc3RvcnRpb24odGhpcy52aWV3ZXIuZGlzdG9ydGlvbkNvZWZmaWNpZW50cyk7XG59XG5cbkRldmljZUluZm8ucHJvdG90eXBlLnVwZGF0ZURldmljZVBhcmFtcyA9IGZ1bmN0aW9uKGRldmljZVBhcmFtcykge1xuICB0aGlzLmRldmljZSA9IHRoaXMuZGV0ZXJtaW5lRGV2aWNlXyhkZXZpY2VQYXJhbXMpIHx8IHRoaXMuZGV2aWNlO1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0RGV2aWNlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmRldmljZTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLnNldFZpZXdlciA9IGZ1bmN0aW9uKHZpZXdlcikge1xuICB0aGlzLnZpZXdlciA9IHZpZXdlcjtcbiAgdGhpcy5kaXN0b3J0aW9uID0gbmV3IERpc3RvcnRpb24odGhpcy52aWV3ZXIuZGlzdG9ydGlvbkNvZWZmaWNpZW50cyk7XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5kZXRlcm1pbmVEZXZpY2VfID0gZnVuY3Rpb24oZGV2aWNlUGFyYW1zKSB7XG4gIGlmICghZGV2aWNlUGFyYW1zKSB7XG4gICAgLy8gTm8gcGFyYW1ldGVycywgc28gdXNlIGEgZGVmYXVsdC5cbiAgICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1VzaW5nIGZhbGxiYWNrIGlPUyBkZXZpY2UgbWVhc3VyZW1lbnRzLicpO1xuICAgICAgcmV0dXJuIERFRkFVTFRfSU9TO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1VzaW5nIGZhbGxiYWNrIEFuZHJvaWQgZGV2aWNlIG1lYXN1cmVtZW50cy4nKTtcbiAgICAgIHJldHVybiBERUZBVUxUX0FORFJPSUQ7XG4gICAgfVxuICB9XG5cbiAgLy8gQ29tcHV0ZSBkZXZpY2Ugc2NyZWVuIGRpbWVuc2lvbnMgYmFzZWQgb24gZGV2aWNlUGFyYW1zLlxuICB2YXIgTUVURVJTX1BFUl9JTkNIID0gMC4wMjU0O1xuICB2YXIgbWV0ZXJzUGVyUGl4ZWxYID0gTUVURVJTX1BFUl9JTkNIIC8gZGV2aWNlUGFyYW1zLnhkcGk7XG4gIHZhciBtZXRlcnNQZXJQaXhlbFkgPSBNRVRFUlNfUEVSX0lOQ0ggLyBkZXZpY2VQYXJhbXMueWRwaTtcbiAgdmFyIHdpZHRoID0gVXRpbC5nZXRTY3JlZW5XaWR0aCgpO1xuICB2YXIgaGVpZ2h0ID0gVXRpbC5nZXRTY3JlZW5IZWlnaHQoKTtcbiAgcmV0dXJuIG5ldyBEZXZpY2Uoe1xuICAgIHdpZHRoTWV0ZXJzOiBtZXRlcnNQZXJQaXhlbFggKiB3aWR0aCxcbiAgICBoZWlnaHRNZXRlcnM6IG1ldGVyc1BlclBpeGVsWSAqIGhlaWdodCxcbiAgICBiZXZlbE1ldGVyczogZGV2aWNlUGFyYW1zLmJldmVsTW0gKiAwLjAwMSxcbiAgfSk7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgZmllbGQgb2YgdmlldyBmb3IgdGhlIGxlZnQgZXllLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXREaXN0b3J0ZWRGaWVsZE9mVmlld0xlZnRFeWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG4gIHZhciBkaXN0b3J0aW9uID0gdGhpcy5kaXN0b3J0aW9uO1xuXG4gIC8vIERldmljZS5oZWlnaHQgYW5kIGRldmljZS53aWR0aCBmb3IgZGV2aWNlIGluIHBvcnRyYWl0IG1vZGUsIHNvIHRyYW5zcG9zZS5cbiAgdmFyIGV5ZVRvU2NyZWVuRGlzdGFuY2UgPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuXG4gIHZhciBvdXRlckRpc3QgPSAoZGV2aWNlLndpZHRoTWV0ZXJzIC0gdmlld2VyLmludGVyTGVuc0Rpc3RhbmNlKSAvIDI7XG4gIHZhciBpbm5lckRpc3QgPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyO1xuICB2YXIgYm90dG9tRGlzdCA9IHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycztcbiAgdmFyIHRvcERpc3QgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC0gYm90dG9tRGlzdDtcblxuICB2YXIgb3V0ZXJBbmdsZSA9IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKFxuICAgICAgZGlzdG9ydGlvbi5kaXN0b3J0KG91dGVyRGlzdCAvIGV5ZVRvU2NyZWVuRGlzdGFuY2UpKTtcbiAgdmFyIGlubmVyQW5nbGUgPSBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihcbiAgICAgIGRpc3RvcnRpb24uZGlzdG9ydChpbm5lckRpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSk7XG4gIHZhciBib3R0b21BbmdsZSA9IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKFxuICAgICAgZGlzdG9ydGlvbi5kaXN0b3J0KGJvdHRvbURpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSk7XG4gIHZhciB0b3BBbmdsZSA9IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKFxuICAgICAgZGlzdG9ydGlvbi5kaXN0b3J0KHRvcERpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBsZWZ0RGVncmVlczogTWF0aC5taW4ob3V0ZXJBbmdsZSwgdmlld2VyLmZvdiksXG4gICAgcmlnaHREZWdyZWVzOiBNYXRoLm1pbihpbm5lckFuZ2xlLCB2aWV3ZXIuZm92KSxcbiAgICBkb3duRGVncmVlczogTWF0aC5taW4oYm90dG9tQW5nbGUsIHZpZXdlci5mb3YpLFxuICAgIHVwRGVncmVlczogTWF0aC5taW4odG9wQW5nbGUsIHZpZXdlci5mb3YpXG4gIH07XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHRhbi1hbmdsZXMgZnJvbSB0aGUgbWF4aW11bSBGT1YgZm9yIHRoZSBsZWZ0IGV5ZSBmb3IgdGhlXG4gKiBjdXJyZW50IGRldmljZSBhbmQgc2NyZWVuIHBhcmFtZXRlcnMuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldExlZnRFeWVWaXNpYmxlVGFuQW5nbGVzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICAvLyBUYW4tYW5nbGVzIGZyb20gdGhlIG1heCBGT1YuXG4gIHZhciBmb3ZMZWZ0ID0gTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdik7XG4gIHZhciBmb3ZUb3AgPSBNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpO1xuICB2YXIgZm92UmlnaHQgPSBNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpO1xuICB2YXIgZm92Qm90dG9tID0gTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdik7XG4gIC8vIFZpZXdwb3J0IHNpemUuXG4gIHZhciBoYWxmV2lkdGggPSBkZXZpY2Uud2lkdGhNZXRlcnMgLyA0O1xuICB2YXIgaGFsZkhlaWdodCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLyAyO1xuICAvLyBWaWV3cG9ydCBjZW50ZXIsIG1lYXN1cmVkIGZyb20gbGVmdCBsZW5zIHBvc2l0aW9uLlxuICB2YXIgdmVydGljYWxMZW5zT2Zmc2V0ID0gKHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycyAtIGhhbGZIZWlnaHQpO1xuICB2YXIgY2VudGVyWCA9IHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSAvIDIgLSBoYWxmV2lkdGg7XG4gIHZhciBjZW50ZXJZID0gLXZlcnRpY2FsTGVuc09mZnNldDtcbiAgdmFyIGNlbnRlclogPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuICAvLyBUYW4tYW5nbGVzIG9mIHRoZSB2aWV3cG9ydCBlZGdlcywgYXMgc2VlbiB0aHJvdWdoIHRoZSBsZW5zLlxuICB2YXIgc2NyZWVuTGVmdCA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWCAtIGhhbGZXaWR0aCkgLyBjZW50ZXJaKTtcbiAgdmFyIHNjcmVlblRvcCA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWSArIGhhbGZIZWlnaHQpIC8gY2VudGVyWik7XG4gIHZhciBzY3JlZW5SaWdodCA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWCArIGhhbGZXaWR0aCkgLyBjZW50ZXJaKTtcbiAgdmFyIHNjcmVlbkJvdHRvbSA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWSAtIGhhbGZIZWlnaHQpIC8gY2VudGVyWik7XG4gIC8vIENvbXBhcmUgdGhlIHR3byBzZXRzIG9mIHRhbi1hbmdsZXMgYW5kIHRha2UgdGhlIHZhbHVlIGNsb3NlciB0byB6ZXJvIG9uIGVhY2ggc2lkZS5cbiAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gIHJlc3VsdFswXSA9IE1hdGgubWF4KGZvdkxlZnQsIHNjcmVlbkxlZnQpO1xuICByZXN1bHRbMV0gPSBNYXRoLm1pbihmb3ZUb3AsIHNjcmVlblRvcCk7XG4gIHJlc3VsdFsyXSA9IE1hdGgubWluKGZvdlJpZ2h0LCBzY3JlZW5SaWdodCk7XG4gIHJlc3VsdFszXSA9IE1hdGgubWF4KGZvdkJvdHRvbSwgc2NyZWVuQm90dG9tKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgdGFuLWFuZ2xlcyBmcm9tIHRoZSBtYXhpbXVtIEZPViBmb3IgdGhlIGxlZnQgZXllIGZvciB0aGVcbiAqIGN1cnJlbnQgZGV2aWNlIGFuZCBzY3JlZW4gcGFyYW1ldGVycywgYXNzdW1pbmcgbm8gbGVuc2VzLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRMZWZ0RXllTm9MZW5zVGFuQW5nbGVzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICB2YXIgcmVzdWx0ID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgLy8gVGFuLWFuZ2xlcyBmcm9tIHRoZSBtYXggRk9WLlxuICB2YXIgZm92TGVmdCA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdikpO1xuICB2YXIgZm92VG9wID0gZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpKTtcbiAgdmFyIGZvdlJpZ2h0ID0gZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpKTtcbiAgdmFyIGZvdkJvdHRvbSA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdikpO1xuICAvLyBWaWV3cG9ydCBzaXplLlxuICB2YXIgaGFsZldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gNDtcbiAgdmFyIGhhbGZIZWlnaHQgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC8gMjtcbiAgLy8gVmlld3BvcnQgY2VudGVyLCBtZWFzdXJlZCBmcm9tIGxlZnQgbGVucyBwb3NpdGlvbi5cbiAgdmFyIHZlcnRpY2FsTGVuc09mZnNldCA9ICh2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnMgLSBoYWxmSGVpZ2h0KTtcbiAgdmFyIGNlbnRlclggPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyIC0gaGFsZldpZHRoO1xuICB2YXIgY2VudGVyWSA9IC12ZXJ0aWNhbExlbnNPZmZzZXQ7XG4gIHZhciBjZW50ZXJaID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgLy8gVGFuLWFuZ2xlcyBvZiB0aGUgdmlld3BvcnQgZWRnZXMsIGFzIHNlZW4gdGhyb3VnaCB0aGUgbGVucy5cbiAgdmFyIHNjcmVlbkxlZnQgPSAoY2VudGVyWCAtIGhhbGZXaWR0aCkgLyBjZW50ZXJaO1xuICB2YXIgc2NyZWVuVG9wID0gKGNlbnRlclkgKyBoYWxmSGVpZ2h0KSAvIGNlbnRlclo7XG4gIHZhciBzY3JlZW5SaWdodCA9IChjZW50ZXJYICsgaGFsZldpZHRoKSAvIGNlbnRlclo7XG4gIHZhciBzY3JlZW5Cb3R0b20gPSAoY2VudGVyWSAtIGhhbGZIZWlnaHQpIC8gY2VudGVyWjtcbiAgLy8gQ29tcGFyZSB0aGUgdHdvIHNldHMgb2YgdGFuLWFuZ2xlcyBhbmQgdGFrZSB0aGUgdmFsdWUgY2xvc2VyIHRvIHplcm8gb24gZWFjaCBzaWRlLlxuICByZXN1bHRbMF0gPSBNYXRoLm1heChmb3ZMZWZ0LCBzY3JlZW5MZWZ0KTtcbiAgcmVzdWx0WzFdID0gTWF0aC5taW4oZm92VG9wLCBzY3JlZW5Ub3ApO1xuICByZXN1bHRbMl0gPSBNYXRoLm1pbihmb3ZSaWdodCwgc2NyZWVuUmlnaHQpO1xuICByZXN1bHRbM10gPSBNYXRoLm1heChmb3ZCb3R0b20sIHNjcmVlbkJvdHRvbSk7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNjcmVlbiByZWN0YW5nbGUgdmlzaWJsZSBmcm9tIHRoZSBsZWZ0IGV5ZSBmb3IgdGhlXG4gKiBjdXJyZW50IGRldmljZSBhbmQgc2NyZWVuIHBhcmFtZXRlcnMuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldExlZnRFeWVWaXNpYmxlU2NyZWVuUmVjdCA9IGZ1bmN0aW9uKHVuZGlzdG9ydGVkRnJ1c3R1bSkge1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcblxuICB2YXIgZGlzdCA9IHZpZXdlci5zY3JlZW5MZW5zRGlzdGFuY2U7XG4gIHZhciBleWVYID0gKGRldmljZS53aWR0aE1ldGVycyAtIHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSkgLyAyO1xuICB2YXIgZXllWSA9IHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycztcbiAgdmFyIGxlZnQgPSAodW5kaXN0b3J0ZWRGcnVzdHVtWzBdICogZGlzdCArIGV5ZVgpIC8gZGV2aWNlLndpZHRoTWV0ZXJzO1xuICB2YXIgdG9wID0gKHVuZGlzdG9ydGVkRnJ1c3R1bVsxXSAqIGRpc3QgKyBleWVZKSAvIGRldmljZS5oZWlnaHRNZXRlcnM7XG4gIHZhciByaWdodCA9ICh1bmRpc3RvcnRlZEZydXN0dW1bMl0gKiBkaXN0ICsgZXllWCkgLyBkZXZpY2Uud2lkdGhNZXRlcnM7XG4gIHZhciBib3R0b20gPSAodW5kaXN0b3J0ZWRGcnVzdHVtWzNdICogZGlzdCArIGV5ZVkpIC8gZGV2aWNlLmhlaWdodE1ldGVycztcbiAgcmV0dXJuIHtcbiAgICB4OiBsZWZ0LFxuICAgIHk6IGJvdHRvbSxcbiAgICB3aWR0aDogcmlnaHQgLSBsZWZ0LFxuICAgIGhlaWdodDogdG9wIC0gYm90dG9tXG4gIH07XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRGaWVsZE9mVmlld0xlZnRFeWUgPSBmdW5jdGlvbihvcHRfaXNVbmRpc3RvcnRlZCkge1xuICByZXR1cm4gb3B0X2lzVW5kaXN0b3J0ZWQgPyB0aGlzLmdldFVuZGlzdG9ydGVkRmllbGRPZlZpZXdMZWZ0RXllKCkgOlxuICAgICAgdGhpcy5nZXREaXN0b3J0ZWRGaWVsZE9mVmlld0xlZnRFeWUoKTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmdldEZpZWxkT2ZWaWV3UmlnaHRFeWUgPSBmdW5jdGlvbihvcHRfaXNVbmRpc3RvcnRlZCkge1xuICB2YXIgZm92ID0gdGhpcy5nZXRGaWVsZE9mVmlld0xlZnRFeWUob3B0X2lzVW5kaXN0b3J0ZWQpO1xuICByZXR1cm4ge1xuICAgIGxlZnREZWdyZWVzOiBmb3YucmlnaHREZWdyZWVzLFxuICAgIHJpZ2h0RGVncmVlczogZm92LmxlZnREZWdyZWVzLFxuICAgIHVwRGVncmVlczogZm92LnVwRGVncmVlcyxcbiAgICBkb3duRGVncmVlczogZm92LmRvd25EZWdyZWVzXG4gIH07XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdW5kaXN0b3J0ZWQgZmllbGQgb2YgdmlldyBmb3IgdGhlIGxlZnQgZXllLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRVbmRpc3RvcnRlZEZpZWxkT2ZWaWV3TGVmdEV5ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcCA9IHRoaXMuZ2V0VW5kaXN0b3J0ZWRQYXJhbXNfKCk7XG5cbiAgcmV0dXJuIHtcbiAgICBsZWZ0RGVncmVlczogTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4ocC5vdXRlckRpc3QpLFxuICAgIHJpZ2h0RGVncmVlczogTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4ocC5pbm5lckRpc3QpLFxuICAgIGRvd25EZWdyZWVzOiBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihwLmJvdHRvbURpc3QpLFxuICAgIHVwRGVncmVlczogTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4ocC50b3BEaXN0KVxuICB9O1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0VW5kaXN0b3J0ZWRWaWV3cG9ydExlZnRFeWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHAgPSB0aGlzLmdldFVuZGlzdG9ydGVkUGFyYW1zXygpO1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcblxuICAvLyBEaXN0YW5jZXMgc3RvcmVkIGluIGxvY2FsIHZhcmlhYmxlcyBhcmUgaW4gdGFuLWFuZ2xlIHVuaXRzIHVubGVzcyBvdGhlcndpc2VcbiAgLy8gbm90ZWQuXG4gIHZhciBleWVUb1NjcmVlbkRpc3RhbmNlID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgdmFyIHNjcmVlbldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHNjcmVlbkhlaWdodCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuICB2YXIgeFB4UGVyVGFuQW5nbGUgPSBkZXZpY2Uud2lkdGggLyBzY3JlZW5XaWR0aDtcbiAgdmFyIHlQeFBlclRhbkFuZ2xlID0gZGV2aWNlLmhlaWdodCAvIHNjcmVlbkhlaWdodDtcblxuICB2YXIgeCA9IE1hdGgucm91bmQoKHAuZXllUG9zWCAtIHAub3V0ZXJEaXN0KSAqIHhQeFBlclRhbkFuZ2xlKTtcbiAgdmFyIHkgPSBNYXRoLnJvdW5kKChwLmV5ZVBvc1kgLSBwLmJvdHRvbURpc3QpICogeVB4UGVyVGFuQW5nbGUpO1xuICByZXR1cm4ge1xuICAgIHg6IHgsXG4gICAgeTogeSxcbiAgICB3aWR0aDogTWF0aC5yb3VuZCgocC5leWVQb3NYICsgcC5pbm5lckRpc3QpICogeFB4UGVyVGFuQW5nbGUpIC0geCxcbiAgICBoZWlnaHQ6IE1hdGgucm91bmQoKHAuZXllUG9zWSArIHAudG9wRGlzdCkgKiB5UHhQZXJUYW5BbmdsZSkgLSB5XG4gIH07XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRVbmRpc3RvcnRlZFBhcmFtc18gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG4gIHZhciBkaXN0b3J0aW9uID0gdGhpcy5kaXN0b3J0aW9uO1xuXG4gIC8vIE1vc3Qgb2YgdGhlc2UgdmFyaWFibGVzIGluIHRhbi1hbmdsZSB1bml0cy5cbiAgdmFyIGV5ZVRvU2NyZWVuRGlzdGFuY2UgPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuICB2YXIgaGFsZkxlbnNEaXN0YW5jZSA9IHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSAvIDIgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuICB2YXIgc2NyZWVuV2lkdGggPSBkZXZpY2Uud2lkdGhNZXRlcnMgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuICB2YXIgc2NyZWVuSGVpZ2h0ID0gZGV2aWNlLmhlaWdodE1ldGVycyAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG5cbiAgdmFyIGV5ZVBvc1ggPSBzY3JlZW5XaWR0aCAvIDIgLSBoYWxmTGVuc0Rpc3RhbmNlO1xuICB2YXIgZXllUG9zWSA9ICh2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnMpIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcblxuICB2YXIgbWF4Rm92ID0gdmlld2VyLmZvdjtcbiAgdmFyIHZpZXdlck1heCA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oTWF0aFV0aWwuZGVnVG9SYWQgKiBtYXhGb3YpKTtcbiAgdmFyIG91dGVyRGlzdCA9IE1hdGgubWluKGV5ZVBvc1gsIHZpZXdlck1heCk7XG4gIHZhciBpbm5lckRpc3QgPSBNYXRoLm1pbihoYWxmTGVuc0Rpc3RhbmNlLCB2aWV3ZXJNYXgpO1xuICB2YXIgYm90dG9tRGlzdCA9IE1hdGgubWluKGV5ZVBvc1ksIHZpZXdlck1heCk7XG4gIHZhciB0b3BEaXN0ID0gTWF0aC5taW4oc2NyZWVuSGVpZ2h0IC0gZXllUG9zWSwgdmlld2VyTWF4KTtcblxuICByZXR1cm4ge1xuICAgIG91dGVyRGlzdDogb3V0ZXJEaXN0LFxuICAgIGlubmVyRGlzdDogaW5uZXJEaXN0LFxuICAgIHRvcERpc3Q6IHRvcERpc3QsXG4gICAgYm90dG9tRGlzdDogYm90dG9tRGlzdCxcbiAgICBleWVQb3NYOiBleWVQb3NYLFxuICAgIGV5ZVBvc1k6IGV5ZVBvc1lcbiAgfTtcbn07XG5cblxuZnVuY3Rpb24gQ2FyZGJvYXJkVmlld2VyKHBhcmFtcykge1xuICAvLyBBIG1hY2hpbmUgcmVhZGFibGUgSUQuXG4gIHRoaXMuaWQgPSBwYXJhbXMuaWQ7XG4gIC8vIEEgaHVtYW4gcmVhZGFibGUgbGFiZWwuXG4gIHRoaXMubGFiZWwgPSBwYXJhbXMubGFiZWw7XG5cbiAgLy8gRmllbGQgb2YgdmlldyBpbiBkZWdyZWVzIChwZXIgc2lkZSkuXG4gIHRoaXMuZm92ID0gcGFyYW1zLmZvdjtcblxuICAvLyBEaXN0YW5jZSBiZXR3ZWVuIGxlbnMgY2VudGVycyBpbiBtZXRlcnMuXG4gIHRoaXMuaW50ZXJMZW5zRGlzdGFuY2UgPSBwYXJhbXMuaW50ZXJMZW5zRGlzdGFuY2U7XG4gIC8vIERpc3RhbmNlIGJldHdlZW4gdmlld2VyIGJhc2VsaW5lIGFuZCBsZW5zIGNlbnRlciBpbiBtZXRlcnMuXG4gIHRoaXMuYmFzZWxpbmVMZW5zRGlzdGFuY2UgPSBwYXJhbXMuYmFzZWxpbmVMZW5zRGlzdGFuY2U7XG4gIC8vIFNjcmVlbi10by1sZW5zIGRpc3RhbmNlIGluIG1ldGVycy5cbiAgdGhpcy5zY3JlZW5MZW5zRGlzdGFuY2UgPSBwYXJhbXMuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuXG4gIC8vIERpc3RvcnRpb24gY29lZmZpY2llbnRzLlxuICB0aGlzLmRpc3RvcnRpb25Db2VmZmljaWVudHMgPSBwYXJhbXMuZGlzdG9ydGlvbkNvZWZmaWNpZW50cztcbiAgLy8gSW52ZXJzZSBkaXN0b3J0aW9uIGNvZWZmaWNpZW50cy5cbiAgLy8gVE9ETzogQ2FsY3VsYXRlIHRoZXNlIGZyb20gZGlzdG9ydGlvbkNvZWZmaWNpZW50cyBpbiB0aGUgZnV0dXJlLlxuICB0aGlzLmludmVyc2VDb2VmZmljaWVudHMgPSBwYXJhbXMuaW52ZXJzZUNvZWZmaWNpZW50cztcbn1cblxuLy8gRXhwb3J0IHZpZXdlciBpbmZvcm1hdGlvbi5cbkRldmljZUluZm8uVmlld2VycyA9IFZpZXdlcnM7XG5tb2R1bGUuZXhwb3J0cyA9IERldmljZUluZm87XG5cbn0se1wiLi9kaXN0b3J0aW9uL2Rpc3RvcnRpb24uanNcIjoxMCxcIi4vbWF0aC11dGlsLmpzXCI6MTQsXCIuL3V0aWwuanNcIjoyMn1dLDk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBWUkRpc3BsYXkgPSBfZGVyZXFfKCcuL2Jhc2UuanMnKS5WUkRpc3BsYXk7XG52YXIgSE1EVlJEZXZpY2UgPSBfZGVyZXFfKCcuL2Jhc2UuanMnKS5ITURWUkRldmljZTtcbnZhciBQb3NpdGlvblNlbnNvclZSRGV2aWNlID0gX2RlcmVxXygnLi9iYXNlLmpzJykuUG9zaXRpb25TZW5zb3JWUkRldmljZTtcblxuLyoqXG4gKiBXcmFwcyBhIFZSRGlzcGxheSBhbmQgZXhwb3NlcyBpdCBhcyBhIEhNRFZSRGV2aWNlXG4gKi9cbmZ1bmN0aW9uIFZSRGlzcGxheUhNRERldmljZShkaXNwbGF5KSB7XG4gIHRoaXMuZGlzcGxheSA9IGRpc3BsYXk7XG5cbiAgdGhpcy5oYXJkd2FyZVVuaXRJZCA9IGRpc3BsYXkuZGlzcGxheUlkO1xuICB0aGlzLmRldmljZUlkID0gJ3dlYnZyLXBvbHlmaWxsOkhNRDonICsgZGlzcGxheS5kaXNwbGF5SWQ7XG4gIHRoaXMuZGV2aWNlTmFtZSA9IGRpc3BsYXkuZGlzcGxheU5hbWUgKyAnIChITUQpJztcbn1cblZSRGlzcGxheUhNRERldmljZS5wcm90b3R5cGUgPSBuZXcgSE1EVlJEZXZpY2UoKTtcblxuVlJEaXNwbGF5SE1ERGV2aWNlLnByb3RvdHlwZS5nZXRFeWVQYXJhbWV0ZXJzID0gZnVuY3Rpb24od2hpY2hFeWUpIHtcbiAgdmFyIGV5ZVBhcmFtZXRlcnMgPSB0aGlzLmRpc3BsYXkuZ2V0RXllUGFyYW1ldGVycyh3aGljaEV5ZSk7XG5cbiAgcmV0dXJuIHtcbiAgICBjdXJyZW50RmllbGRPZlZpZXc6IGV5ZVBhcmFtZXRlcnMuZmllbGRPZlZpZXcsXG4gICAgbWF4aW11bUZpZWxkT2ZWaWV3OiBleWVQYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3LFxuICAgIG1pbmltdW1GaWVsZE9mVmlldzogZXllUGFyYW1ldGVycy5maWVsZE9mVmlldyxcbiAgICByZWNvbW1lbmRlZEZpZWxkT2ZWaWV3OiBleWVQYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3LFxuICAgIGV5ZVRyYW5zbGF0aW9uOiB7IHg6IGV5ZVBhcmFtZXRlcnMub2Zmc2V0WzBdLCB5OiBleWVQYXJhbWV0ZXJzLm9mZnNldFsxXSwgejogZXllUGFyYW1ldGVycy5vZmZzZXRbMl0gfSxcbiAgICByZW5kZXJSZWN0OiB7XG4gICAgICB4OiAod2hpY2hFeWUgPT0gJ3JpZ2h0JykgPyBleWVQYXJhbWV0ZXJzLnJlbmRlcldpZHRoIDogMCxcbiAgICAgIHk6IDAsXG4gICAgICB3aWR0aDogZXllUGFyYW1ldGVycy5yZW5kZXJXaWR0aCxcbiAgICAgIGhlaWdodDogZXllUGFyYW1ldGVycy5yZW5kZXJIZWlnaHRcbiAgICB9XG4gIH07XG59O1xuXG5WUkRpc3BsYXlITUREZXZpY2UucHJvdG90eXBlLnNldEZpZWxkT2ZWaWV3ID1cbiAgICBmdW5jdGlvbihvcHRfZm92TGVmdCwgb3B0X2ZvdlJpZ2h0LCBvcHRfek5lYXIsIG9wdF96RmFyKSB7XG4gIC8vIE5vdCBzdXBwb3J0ZWQuIGdldEV5ZVBhcmFtZXRlcnMgcmVwb3J0cyB0aGF0IHRoZSBtaW4sIG1heCwgYW5kIHJlY29tbWVuZGVkXG4gIC8vIEZvViBpcyBhbGwgdGhlIHNhbWUsIHNvIG5vIGFkanVzdG1lbnQgY2FuIGJlIG1hZGUuXG59O1xuXG4vLyBUT0RPOiBOZWVkIHRvIGhvb2sgcmVxdWVzdEZ1bGxzY3JlZW4gdG8gc2VlIGlmIGEgd3JhcHBlZCBWUkRpc3BsYXkgd2FzIHBhc3NlZFxuLy8gaW4gYXMgYW4gb3B0aW9uLiBJZiBzbyB3ZSBzaG91bGQgcHJldmVudCB0aGUgZGVmYXVsdCBmdWxsc2NyZWVuIGJlaGF2aW9yIGFuZFxuLy8gY2FsbCBWUkRpc3BsYXkucmVxdWVzdFByZXNlbnQgaW5zdGVhZC5cblxuLyoqXG4gKiBXcmFwcyBhIFZSRGlzcGxheSBhbmQgZXhwb3NlcyBpdCBhcyBhIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2VcbiAqL1xuZnVuY3Rpb24gVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UoZGlzcGxheSkge1xuICB0aGlzLmRpc3BsYXkgPSBkaXNwbGF5O1xuXG4gIHRoaXMuaGFyZHdhcmVVbml0SWQgPSBkaXNwbGF5LmRpc3BsYXlJZDtcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbDpQb3NpdGlvblNlbnNvcjogJyArIGRpc3BsYXkuZGlzcGxheUlkO1xuICB0aGlzLmRldmljZU5hbWUgPSBkaXNwbGF5LmRpc3BsYXlOYW1lICsgJyAoUG9zaXRpb25TZW5zb3IpJztcbn1cblZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlLnByb3RvdHlwZSA9IG5ldyBQb3NpdGlvblNlbnNvclZSRGV2aWNlKCk7XG5cblZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlLnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcG9zZSA9IHRoaXMuZGlzcGxheS5nZXRQb3NlKCk7XG4gIHJldHVybiB7XG4gICAgcG9zaXRpb246IHBvc2UucG9zaXRpb24gPyB7IHg6IHBvc2UucG9zaXRpb25bMF0sIHk6IHBvc2UucG9zaXRpb25bMV0sIHo6IHBvc2UucG9zaXRpb25bMl0gfSA6IG51bGwsXG4gICAgb3JpZW50YXRpb246IHBvc2Uub3JpZW50YXRpb24gPyB7IHg6IHBvc2Uub3JpZW50YXRpb25bMF0sIHk6IHBvc2Uub3JpZW50YXRpb25bMV0sIHo6IHBvc2Uub3JpZW50YXRpb25bMl0sIHc6IHBvc2Uub3JpZW50YXRpb25bM10gfSA6IG51bGwsXG4gICAgbGluZWFyVmVsb2NpdHk6IG51bGwsXG4gICAgbGluZWFyQWNjZWxlcmF0aW9uOiBudWxsLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbnVsbCxcbiAgICBhbmd1bGFyQWNjZWxlcmF0aW9uOiBudWxsXG4gIH07XG59O1xuXG5WUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZS5wcm90b3R5cGUucmVzZXRTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5wb3NpdGlvbkRldmljZS5yZXNldFBvc2UoKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMuVlJEaXNwbGF5SE1ERGV2aWNlID0gVlJEaXNwbGF5SE1ERGV2aWNlO1xubW9kdWxlLmV4cG9ydHMuVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UgPSBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZTtcblxuXG59LHtcIi4vYmFzZS5qc1wiOjN9XSwxMDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIFRPRE8oc211cyk6IEltcGxlbWVudCBjb2VmZmljaWVudCBpbnZlcnNpb24uXG4gKi9cbmZ1bmN0aW9uIERpc3RvcnRpb24oY29lZmZpY2llbnRzKSB7XG4gIHRoaXMuY29lZmZpY2llbnRzID0gY29lZmZpY2llbnRzO1xufVxuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGludmVyc2UgZGlzdG9ydGlvbiBmb3IgYSByYWRpdXMuXG4gKiA8L3A+PHA+XG4gKiBBbGxvd3MgdG8gY29tcHV0ZSB0aGUgb3JpZ2luYWwgdW5kaXN0b3J0ZWQgcmFkaXVzIGZyb20gYSBkaXN0b3J0ZWQgb25lLlxuICogU2VlIGFsc28gZ2V0QXBwcm94aW1hdGVJbnZlcnNlRGlzdG9ydGlvbigpIGZvciBhIGZhc3RlciBidXQgcG90ZW50aWFsbHlcbiAqIGxlc3MgYWNjdXJhdGUgbWV0aG9kLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWRpdXMgRGlzdG9ydGVkIHJhZGl1cyBmcm9tIHRoZSBsZW5zIGNlbnRlciBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSB1bmRpc3RvcnRlZCByYWRpdXMgaW4gdGFuLWFuZ2xlIHVuaXRzLlxuICovXG5EaXN0b3J0aW9uLnByb3RvdHlwZS5kaXN0b3J0SW52ZXJzZSA9IGZ1bmN0aW9uKHJhZGl1cykge1xuICAvLyBTZWNhbnQgbWV0aG9kLlxuICB2YXIgcjAgPSAwO1xuICB2YXIgcjEgPSAxO1xuICB2YXIgZHIwID0gcmFkaXVzIC0gdGhpcy5kaXN0b3J0KHIwKTtcbiAgd2hpbGUgKE1hdGguYWJzKHIxIC0gcjApID4gMC4wMDAxIC8qKiAwLjFtbSAqLykge1xuICAgIHZhciBkcjEgPSByYWRpdXMgLSB0aGlzLmRpc3RvcnQocjEpO1xuICAgIHZhciByMiA9IHIxIC0gZHIxICogKChyMSAtIHIwKSAvIChkcjEgLSBkcjApKTtcbiAgICByMCA9IHIxO1xuICAgIHIxID0gcjI7XG4gICAgZHIwID0gZHIxO1xuICB9XG4gIHJldHVybiByMTtcbn07XG5cbi8qKlxuICogRGlzdG9ydHMgYSByYWRpdXMgYnkgaXRzIGRpc3RvcnRpb24gZmFjdG9yIGZyb20gdGhlIGNlbnRlciBvZiB0aGUgbGVuc2VzLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWRpdXMgUmFkaXVzIGZyb20gdGhlIGxlbnMgY2VudGVyIGluIHRhbi1hbmdsZSB1bml0cy5cbiAqIEByZXR1cm4ge051bWJlcn0gVGhlIGRpc3RvcnRlZCByYWRpdXMgaW4gdGFuLWFuZ2xlIHVuaXRzLlxuICovXG5EaXN0b3J0aW9uLnByb3RvdHlwZS5kaXN0b3J0ID0gZnVuY3Rpb24ocmFkaXVzKSB7XG4gIHZhciByMiA9IHJhZGl1cyAqIHJhZGl1cztcbiAgdmFyIHJldCA9IDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb2VmZmljaWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICByZXQgPSByMiAqIChyZXQgKyB0aGlzLmNvZWZmaWNpZW50c1tpXSk7XG4gIH1cbiAgcmV0dXJuIChyZXQgKyAxKSAqIHJhZGl1cztcbn07XG5cbi8vIEZ1bmN0aW9ucyBiZWxvdyByb3VnaGx5IHBvcnRlZCBmcm9tXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlc2FtcGxlcy9jYXJkYm9hcmQtdW5pdHkvYmxvYi9tYXN0ZXIvQ2FyZGJvYXJkL1NjcmlwdHMvQ2FyZGJvYXJkUHJvZmlsZS5jcyNMNDEyXG5cbi8vIFNvbHZlcyBhIHNtYWxsIGxpbmVhciBlcXVhdGlvbiB2aWEgZGVzdHJ1Y3RpdmUgZ2F1c3NpYW5cbi8vIGVsaW1pbmF0aW9uIGFuZCBiYWNrIHN1YnN0aXR1dGlvbi4gIFRoaXMgaXNuJ3QgZ2VuZXJpYyBudW1lcmljXG4vLyBjb2RlLCBpdCdzIGp1c3QgYSBxdWljayBoYWNrIHRvIHdvcmsgd2l0aCB0aGUgZ2VuZXJhbGx5XG4vLyB3ZWxsLWJlaGF2ZWQgc3ltbWV0cmljIG1hdHJpY2VzIGZvciBsZWFzdC1zcXVhcmVzIGZpdHRpbmcuXG4vLyBOb3QgaW50ZW5kZWQgZm9yIHJldXNlLlxuLy9cbi8vIEBwYXJhbSBhIElucHV0IHBvc2l0aXZlIGRlZmluaXRlIHN5bW1ldHJpY2FsIG1hdHJpeC4gRGVzdHJveWVkXG4vLyAgICAgZHVyaW5nIGNhbGN1bGF0aW9uLlxuLy8gQHBhcmFtIHkgSW5wdXQgcmlnaHQtaGFuZC1zaWRlIHZhbHVlcy4gRGVzdHJveWVkIGR1cmluZyBjYWxjdWxhdGlvbi5cbi8vIEByZXR1cm4gUmVzdWx0aW5nIHggdmFsdWUgdmVjdG9yLlxuLy9cbkRpc3RvcnRpb24ucHJvdG90eXBlLnNvbHZlTGluZWFyXyA9IGZ1bmN0aW9uKGEsIHkpIHtcbiAgdmFyIG4gPSBhLmxlbmd0aDtcblxuICAvLyBHYXVzc2lhbiBlbGltaW5hdGlvbiAobm8gcm93IGV4Y2hhbmdlKSB0byB0cmlhbmd1bGFyIG1hdHJpeC5cbiAgLy8gVGhlIGlucHV0IG1hdHJpeCBpcyBhIEFeVCBBIHByb2R1Y3Qgd2hpY2ggc2hvdWxkIGJlIGEgcG9zaXRpdmVcbiAgLy8gZGVmaW5pdGUgc3ltbWV0cmljYWwgbWF0cml4LCBhbmQgaWYgSSByZW1lbWJlciBteSBsaW5lYXJcbiAgLy8gYWxnZWJyYSByaWdodCB0aGlzIGltcGxpZXMgdGhhdCB0aGUgcGl2b3RzIHdpbGwgYmUgbm9uemVybyBhbmRcbiAgLy8gY2FsY3VsYXRpb25zIHN1ZmZpY2llbnRseSBhY2N1cmF0ZSB3aXRob3V0IG5lZWRpbmcgcm93XG4gIC8vIGV4Y2hhbmdlLlxuICBmb3IgKHZhciBqID0gMDsgaiA8IG4gLSAxOyArK2opIHtcbiAgICBmb3IgKHZhciBrID0gaiArIDE7IGsgPCBuOyArK2spIHtcbiAgICAgIHZhciBwID0gYVtqXVtrXSAvIGFbal1bal07XG4gICAgICBmb3IgKHZhciBpID0gaiArIDE7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgYVtpXVtrXSAtPSBwICogYVtpXVtqXTtcbiAgICAgIH1cbiAgICAgIHlba10gLT0gcCAqIHlbal07XG4gICAgfVxuICB9XG4gIC8vIEZyb20gdGhpcyBwb2ludCBvbiwgb25seSB0aGUgbWF0cml4IGVsZW1lbnRzIGFbal1baV0gd2l0aCBpPj1qIGFyZVxuICAvLyB2YWxpZC4gVGhlIGVsaW1pbmF0aW9uIGRvZXNuJ3QgZmlsbCBpbiBlbGltaW5hdGVkIDAgdmFsdWVzLlxuXG4gIHZhciB4ID0gbmV3IEFycmF5KG4pO1xuXG4gIC8vIEJhY2sgc3Vic3RpdHV0aW9uLlxuICBmb3IgKHZhciBqID0gbiAtIDE7IGogPj0gMDsgLS1qKSB7XG4gICAgdmFyIHYgPSB5W2pdO1xuICAgIGZvciAodmFyIGkgPSBqICsgMTsgaSA8IG47ICsraSkge1xuICAgICAgdiAtPSBhW2ldW2pdICogeFtpXTtcbiAgICB9XG4gICAgeFtqXSA9IHYgLyBhW2pdW2pdO1xuICB9XG5cbiAgcmV0dXJuIHg7XG59O1xuXG4vLyBTb2x2ZXMgYSBsZWFzdC1zcXVhcmVzIG1hdHJpeCBlcXVhdGlvbi4gIEdpdmVuIHRoZSBlcXVhdGlvbiBBICogeCA9IHksIGNhbGN1bGF0ZSB0aGVcbi8vIGxlYXN0LXNxdWFyZSBmaXQgeCA9IGludmVyc2UoQSAqIHRyYW5zcG9zZShBKSkgKiB0cmFuc3Bvc2UoQSkgKiB5LiAgVGhlIHdheSB0aGlzIHdvcmtzXG4vLyBpcyB0aGF0LCB3aGlsZSBBIGlzIHR5cGljYWxseSBub3QgYSBzcXVhcmUgbWF0cml4IChhbmQgaGVuY2Ugbm90IGludmVydGlibGUpLCBBICogdHJhbnNwb3NlKEEpXG4vLyBpcyBhbHdheXMgc3F1YXJlLiAgVGhhdCBpczpcbi8vICAgQSAqIHggPSB5XG4vLyAgIHRyYW5zcG9zZShBKSAqIChBICogeCkgPSB0cmFuc3Bvc2UoQSkgKiB5ICAgPC0gbXVsdGlwbHkgYm90aCBzaWRlcyBieSB0cmFuc3Bvc2UoQSlcbi8vICAgKHRyYW5zcG9zZShBKSAqIEEpICogeCA9IHRyYW5zcG9zZShBKSAqIHkgICA8LSBhc3NvY2lhdGl2aXR5XG4vLyAgIHggPSBpbnZlcnNlKHRyYW5zcG9zZShBKSAqIEEpICogdHJhbnNwb3NlKEEpICogeSAgPC0gc29sdmUgZm9yIHhcbi8vIE1hdHJpeCBBJ3Mgcm93IGNvdW50IChmaXJzdCBpbmRleCkgbXVzdCBtYXRjaCB5J3MgdmFsdWUgY291bnQuICBBJ3MgY29sdW1uIGNvdW50IChzZWNvbmQgaW5kZXgpXG4vLyBkZXRlcm1pbmVzIHRoZSBsZW5ndGggb2YgdGhlIHJlc3VsdCB2ZWN0b3IgeC5cbkRpc3RvcnRpb24ucHJvdG90eXBlLnNvbHZlTGVhc3RTcXVhcmVzXyA9IGZ1bmN0aW9uKG1hdEEsIHZlY1kpIHtcbiAgdmFyIGksIGosIGssIHN1bTtcbiAgdmFyIG51bVNhbXBsZXMgPSBtYXRBLmxlbmd0aDtcbiAgdmFyIG51bUNvZWZmaWNpZW50cyA9IG1hdEFbMF0ubGVuZ3RoO1xuICBpZiAobnVtU2FtcGxlcyAhPSB2ZWNZLkxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk1hdHJpeCAvIHZlY3RvciBkaW1lbnNpb24gbWlzbWF0Y2hcIik7XG4gIH1cblxuICAvLyBDYWxjdWxhdGUgdHJhbnNwb3NlKEEpICogQVxuICB2YXIgbWF0QVRBID0gbmV3IEFycmF5KG51bUNvZWZmaWNpZW50cyk7XG4gIGZvciAoayA9IDA7IGsgPCBudW1Db2VmZmljaWVudHM7ICsraykge1xuICAgIG1hdEFUQVtrXSA9IG5ldyBBcnJheShudW1Db2VmZmljaWVudHMpO1xuICAgIGZvciAoaiA9IDA7IGogPCBudW1Db2VmZmljaWVudHM7ICsraikge1xuICAgICAgc3VtID0gMDtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBudW1TYW1wbGVzOyArK2kpIHtcbiAgICAgICAgc3VtICs9IG1hdEFbal1baV0gKiBtYXRBW2tdW2ldO1xuICAgICAgfVxuICAgICAgbWF0QVRBW2tdW2pdID0gc3VtO1xuICAgIH1cbiAgfVxuXG4gIC8vIENhbGN1bGF0ZSB0cmFuc3Bvc2UoQSkgKiB5XG4gIHZhciB2ZWNBVFkgPSBuZXcgQXJyYXkobnVtQ29lZmZpY2llbnRzKTtcbiAgZm9yIChqID0gMDsgaiA8IG51bUNvZWZmaWNpZW50czsgKytqKSB7XG4gICAgc3VtID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbnVtU2FtcGxlczsgKytpKSB7XG4gICAgICBzdW0gKz0gbWF0QVtqXVtpXSAqIHZlY1lbaV07XG4gICAgfVxuICAgIHZlY0FUWVtqXSA9IHN1bTtcbiAgfVxuXG4gIC8vIE5vdyBzb2x2ZSAoQSAqIHRyYW5zcG9zZShBKSkgKiB4ID0gdHJhbnNwb3NlKEEpICogeS5cbiAgcmV0dXJuIHRoaXMuc29sdmVMaW5lYXJfKG1hdEFUQSwgdmVjQVRZKTtcbn07XG5cbi8vLyBDYWxjdWxhdGVzIGFuIGFwcHJveGltYXRlIGludmVyc2UgdG8gdGhlIGdpdmVuIHJhZGlhbCBkaXN0b3J0aW9uIHBhcmFtZXRlcnMuXG5EaXN0b3J0aW9uLnByb3RvdHlwZS5hcHByb3hpbWF0ZUludmVyc2UgPSBmdW5jdGlvbihtYXhSYWRpdXMsIG51bVNhbXBsZXMpIHtcbiAgbWF4UmFkaXVzID0gbWF4UmFkaXVzIHx8IDE7XG4gIG51bVNhbXBsZXMgPSBudW1TYW1wbGVzIHx8IDEwMDtcbiAgdmFyIG51bUNvZWZmaWNpZW50cyA9IDY7XG4gIHZhciBpLCBqO1xuXG4gIC8vIFIgKyBLMSpSXjMgKyBLMipSXjUgPSByLCB3aXRoIFIgPSBycCA9IGRpc3RvcnQocilcbiAgLy8gUmVwZWF0aW5nIGZvciBudW1TYW1wbGVzOlxuICAvLyAgIFsgUjBeMywgUjBeNSBdICogWyBLMSBdID0gWyByMCAtIFIwIF1cbiAgLy8gICBbIFIxXjMsIFIxXjUgXSAgIFsgSzIgXSAgIFsgcjEgLSBSMSBdXG4gIC8vICAgWyBSMl4zLCBSMl41IF0gICAgICAgICAgICBbIHIyIC0gUjIgXVxuICAvLyAgIFsgZXRjLi4uIF0gICAgICAgICAgICAgICAgWyBldGMuLi4gXVxuICAvLyBUaGF0IGlzOlxuICAvLyAgIG1hdEEgKiBbSzEsIEsyXSA9IHlcbiAgLy8gU29sdmU6XG4gIC8vICAgW0sxLCBLMl0gPSBpbnZlcnNlKHRyYW5zcG9zZShtYXRBKSAqIG1hdEEpICogdHJhbnNwb3NlKG1hdEEpICogeVxuICB2YXIgbWF0QSA9IG5ldyBBcnJheShudW1Db2VmZmljaWVudHMpO1xuICBmb3IgKGogPSAwOyBqIDwgbnVtQ29lZmZpY2llbnRzOyArK2opIHtcbiAgICBtYXRBW2pdID0gbmV3IEFycmF5KG51bVNhbXBsZXMpO1xuICB9XG4gIHZhciB2ZWNZID0gbmV3IEFycmF5KG51bVNhbXBsZXMpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBudW1TYW1wbGVzOyArK2kpIHtcbiAgICB2YXIgciA9IG1heFJhZGl1cyAqIChpICsgMSkgLyBudW1TYW1wbGVzO1xuICAgIHZhciBycCA9IHRoaXMuZGlzdG9ydChyKTtcbiAgICB2YXIgdiA9IHJwO1xuICAgIGZvciAoaiA9IDA7IGogPCBudW1Db2VmZmljaWVudHM7ICsraikge1xuICAgICAgdiAqPSBycCAqIHJwO1xuICAgICAgbWF0QVtqXVtpXSA9IHY7XG4gICAgfVxuICAgIHZlY1lbaV0gPSByIC0gcnA7XG4gIH1cblxuICB2YXIgaW52ZXJzZUNvZWZmaWNpZW50cyA9IHRoaXMuc29sdmVMZWFzdFNxdWFyZXNfKG1hdEEsIHZlY1kpO1xuXG4gIHJldHVybiBuZXcgRGlzdG9ydGlvbihpbnZlcnNlQ29lZmZpY2llbnRzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRGlzdG9ydGlvbjtcblxufSx7fV0sMTE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBEUERCIGNhY2hlLlxuICovXG52YXIgRFBEQl9DQUNIRSA9IHtcbiAgXCJmb3JtYXRcIjogMSxcbiAgXCJsYXN0X3VwZGF0ZWRcIjogXCIyMDE2LTAxLTIwVDAwOjE4OjM1WlwiLFxuICBcImRldmljZXNcIjogW1xuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcImFzdXMvKi9OZXh1cyA3LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTmV4dXMgN1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzIwLjgsIDMyMy4wIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiYXN1cy8qL0FTVVNfWjAwQUQvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJBU1VTX1owMEFEXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MDMuMCwgNDA0LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiSFRDLyovSFRDNjQzNUxWVy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkhUQzY0MzVMVldcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0OS43LCA0NDMuMyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIVEMvKi9IVEMgT25lIFhMLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiSFRDIE9uZSBYTFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzE1LjMsIDMxNC42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcImh0Yy8qL05leHVzIDkvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA5XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjg5LjAsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiSFRDLyovSFRDIE9uZSBNOS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkhUQyBPbmUgTTlcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0Mi41LCA0NDMuMyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkhUQy8qL0hUQyBPbmVfTTgvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJIVEMgT25lX004XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0NDkuNywgNDQ3LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIVEMvKi9IVEMgT25lLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiSFRDIE9uZVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDQ3Mi44LFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIdWF3ZWkvKi9OZXh1cyA2UC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk5leHVzIDZQXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MTUuMSwgNTE4LjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTmV4dXMgNVgvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA1WFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDIyLjAsIDQxOS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL0xHTVMzNDUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJMR01TMzQ1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMjEuNywgMjE5LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9MRy1EODAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTEctRDgwMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDIyLjAsIDQyNC4xIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTEctRDg1MC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkxHLUQ4NTBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUzNy45LCA1NDEuOSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL1ZTOTg1IDRHLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiVlM5ODUgNEdcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUzNy45LCA1MzUuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9OZXh1cyA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTmV4dXMgNSBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0Mi40LCA0NDQuOCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9OZXh1cyA0LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTmV4dXMgNFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzE5LjgsIDMxOC40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL0xHLVA3NjkvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJMRy1QNzY5XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyNDAuNiwgMjQ3LjUgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTEdNUzMyMy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkxHTVMzMjNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDIwNi42LCAyMDQuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9MR0xTOTk2LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTEdMUzk5NlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDAzLjQsIDQwMS41IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk1pY3JvbWF4LyovNDU2ME1NWC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIjQ1NjBNTVhcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI0MC4wLCAyMTkuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJNaWNyb21heC8qL0EyNTAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJNaWNyb21heCBBMjUwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0ODAuMCwgNDQ2LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTWljcm9tYXgvKi9NaWNyb21heCBBUTQ1MDEvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJNaWNyb21heCBBUTQ1MDFcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyNDAuMCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL0RST0lEIFJBWlIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJEUk9JRCBSQVpSXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzNjguMSwgMjU2LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDgzMEMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDgzMENcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI1NC4wLCAyNTUuOSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTAyMS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTAyMVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjU0LjAsIDI1Ni43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwMjMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwMjNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI1NC4wLCAyNTYuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDI4LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDI4XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMjYuNiwgMzI3LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwMzQvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwMzRcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMyNi42LCAzMjguNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDUzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDUzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMTUuMywgMzE2LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDE1NjIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDE1NjJcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQwMy40LCA0MDIuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL05leHVzIDYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA2IFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDk0LjMsIDQ4OS43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDYzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDYzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyOTUuMCwgMjk2LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwNjQvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwNjRcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI5NS4wLCAyOTUuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDkyLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDkyXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjIuMCwgNDI0LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTA5NS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTA5NVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDIyLjAsIDQyMy40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk9uZVBsdXMvKi9BMDAwMS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkEwMDAxXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MDMuNCwgNDAxLjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiT25lUGx1cy8qL09ORSBFMTAwNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk9ORSBFMTAwNVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjQsIDQ0MS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk9uZVBsdXMvKi9PTkUgQTIwMDUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJPTkUgQTIwMDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDM5MS45LCA0MDUuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJPUFBPLyovWDkwOS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlg5MDlcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0Mi40LCA0NDQuMSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkwODIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTA4MlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMTg0LjcsIDE4NS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HMzYwUC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUczNjBQXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAxOTYuNywgMjA1LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL05leHVzIFMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyBTXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMzQuNSwgMjI5LjggXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MzAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTkzMDBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMwNC44LCAzMDMuOSBdLFxuICAgIFwiYndcIjogNSxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1UMjMwTlUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1UMjMwTlVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyMTYuMCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU0dILVQzOTkvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTR0gtVDM5OVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjE3LjcsIDIzMS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTAwNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLU45MDA1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzODYuNCwgMzg3LjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU0FNU1VORy1TTS1OOTAwQS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNBTVNVTkctU00tTjkwMEFcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDM4Ni40LCAzODcuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTk1MDAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTUwMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjUsIDQ0My4zIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5NTA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTk1MDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiA0MzkuNCxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MDBGLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkwMEZcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQxNS42LCA0MzEuNiBdLFxuICAgIFwiYndcIjogNSxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkwME0vKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTAwTVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDE1LjYsIDQzMS42IF0sXG4gICAgXCJid1wiOiA1LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HODAwRi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc4MDBGXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMzI2LjgsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTA2Uy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MDZTXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1NjIuNywgNTcyLjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MzAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTkzMDBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMwNi43LCAzMDQuOCBdLFxuICAgIFwiYndcIjogNSxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tVDUzNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLVQ1MzVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDE0Mi42LCAxMzYuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTIwQy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLU45MjBDXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MTUuMSwgNTE4LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MzAwSS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULUk5MzAwSVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzA0LjgsIDMwNS44IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1JOTE5NS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULUk5MTk1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyNDkuNCwgMjU2LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU1BILUw1MjAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTUEgtTDUyMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjQ5LjQsIDI1NS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TQU1TVU5HLVNHSC1JNzE3LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU0FNU1VORy1TR0gtSTcxN1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDI4NS44LFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU1BILUQ3MTAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTUEgtRDcxMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjE3LjcsIDIwNC4yIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1ONzEwMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULU43MTAwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjY1LjEsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TQ0gtSTYwNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNDSC1JNjA1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjY1LjEsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HYWxheHkgTmV4dXMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHYWxheHkgTmV4dXNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMxNS4zLCAzMTQuMiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tTjkxMEgvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1OOTEwSFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTE1LjEsIDUxOC4wIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTEwQy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLU45MTBDXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MTUuMiwgNTIwLjIgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzEzME0vKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HMTMwTVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMTY1LjksIDE2NC44IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MjhJLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkyOElcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUxNS4xLCA1MTguNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyMEYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTIwRlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDU4MC42LFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTIwUC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MjBQXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MjIuNSwgNTc3LjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MjVGLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkyNUZcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiA1ODAuNixcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyNVYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTI1VlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTIyLjUsIDU3Ni42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlNvbnkvKi9DNjkwMy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkM2OTAzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0NDIuNSwgNDQzLjMgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJTb255LyovRDY2NTMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJENjY1M1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDI4LjYsIDQyNy42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlNvbnkvKi9FNjY1My8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkU2NjUzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjguNiwgNDI1LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiU29ueS8qL0U2ODUzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiRTY4NTNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQwMy40LCA0MDEuOSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJTb255LyovU0dQMzIxLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU0dQMzIxXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMjQuNywgMjI0LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJUQ1QvKi9BTENBVEVMIE9ORSBUT1VDSCBGaWVyY2UvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJBTENBVEVMIE9ORSBUT1VDSCBGaWVyY2VcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI0MC4wLCAyNDcuNSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJUSEwvKi90aGwgNTAwMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcInRobCA1MDAwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0ODAuMCwgNDQzLjMgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiWlRFLyovWlRFIEJsYWRlIEwyLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWlRFIEJsYWRlIEwyXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjQwLjAsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNjQwLCA5NjAgXSB9IF0sXG4gICAgXCJkcGlcIjogWyAzMjUuMSwgMzI4LjQgXSxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNjQwLCA5NjAgXSB9IF0sXG4gICAgXCJkcGlcIjogWyAzMjUuMSwgMzI4LjQgXSxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNjQwLCAxMTM2IF0gfSBdLFxuICAgIFwiZHBpXCI6IFsgMzE3LjEsIDMyMC4yIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICBcInJ1bGVzXCI6IFsgeyBcInJlc1wiOiBbIDY0MCwgMTEzNiBdIH0gXSxcbiAgICBcImRwaVwiOiBbIDMxNy4xLCAzMjAuMiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyA3NTAsIDEzMzQgXSB9IF0sXG4gICAgXCJkcGlcIjogMzI2LjQsXG4gICAgXCJid1wiOiA0LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICBcInJ1bGVzXCI6IFsgeyBcInJlc1wiOiBbIDc1MCwgMTMzNCBdIH0gXSxcbiAgICBcImRwaVwiOiAzMjYuNCxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgMTI0MiwgMjIwOCBdIH0gXSxcbiAgICBcImRwaVwiOiBbIDQ1My42LCA0NTguNCBdLFxuICAgIFwiYndcIjogNCxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyAxMjQyLCAyMjA4IF0gfSBdLFxuICAgIFwiZHBpXCI6IFsgNDUzLjYsIDQ1OC40IF0sXG4gICAgXCJid1wiOiA0LFxuICAgIFwiYWNcIjogMTAwMFxuICB9XG5dfTtcblxubW9kdWxlLmV4cG9ydHMgPSBEUERCX0NBQ0hFO1xuXG59LHt9XSwxMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBPZmZsaW5lIGNhY2hlIG9mIHRoZSBEUERCLCB0byBiZSB1c2VkIHVudGlsIHdlIGxvYWQgdGhlIG9ubGluZSBvbmUgKGFuZFxuLy8gYXMgYSBmYWxsYmFjayBpbiBjYXNlIHdlIGNhbid0IGxvYWQgdGhlIG9ubGluZSBvbmUpLlxudmFyIERQREJfQ0FDSEUgPSBfZGVyZXFfKCcuL2RwZGItY2FjaGUuanMnKTtcbnZhciBVdGlsID0gX2RlcmVxXygnLi4vdXRpbC5qcycpO1xuXG4vLyBPbmxpbmUgRFBEQiBVUkwuXG52YXIgT05MSU5FX0RQREJfVVJMID0gJ2h0dHBzOi8vc3RvcmFnZS5nb29nbGVhcGlzLmNvbS9jYXJkYm9hcmQtZHBkYi9kcGRiLmpzb24nO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgZGV2aWNlIHBhcmFtZXRlcnMgYmFzZWQgb24gdGhlIERQREIgKERldmljZSBQYXJhbWV0ZXIgRGF0YWJhc2UpLlxuICogSW5pdGlhbGx5LCB1c2VzIHRoZSBjYWNoZWQgRFBEQiB2YWx1ZXMuXG4gKlxuICogSWYgZmV0Y2hPbmxpbmUgPT0gdHJ1ZSwgdGhlbiB0aGlzIG9iamVjdCB0cmllcyB0byBmZXRjaCB0aGUgb25saW5lIHZlcnNpb25cbiAqIG9mIHRoZSBEUERCIGFuZCB1cGRhdGVzIHRoZSBkZXZpY2UgaW5mbyBpZiBhIGJldHRlciBtYXRjaCBpcyBmb3VuZC5cbiAqIENhbGxzIHRoZSBvbkRldmljZVBhcmFtc1VwZGF0ZWQgY2FsbGJhY2sgd2hlbiB0aGVyZSBpcyBhbiB1cGRhdGUgdG8gdGhlXG4gKiBkZXZpY2UgaW5mb3JtYXRpb24uXG4gKi9cbmZ1bmN0aW9uIERwZGIoZmV0Y2hPbmxpbmUsIG9uRGV2aWNlUGFyYW1zVXBkYXRlZCkge1xuICAvLyBTdGFydCB3aXRoIHRoZSBvZmZsaW5lIERQREIgY2FjaGUgd2hpbGUgd2UgYXJlIGxvYWRpbmcgdGhlIHJlYWwgb25lLlxuICB0aGlzLmRwZGIgPSBEUERCX0NBQ0hFO1xuXG4gIC8vIENhbGN1bGF0ZSBkZXZpY2UgcGFyYW1zIGJhc2VkIG9uIHRoZSBvZmZsaW5lIHZlcnNpb24gb2YgdGhlIERQREIuXG4gIHRoaXMucmVjYWxjdWxhdGVEZXZpY2VQYXJhbXNfKCk7XG5cbiAgLy8gWEhSIHRvIGZldGNoIG9ubGluZSBEUERCIGZpbGUsIGlmIHJlcXVlc3RlZC5cbiAgaWYgKGZldGNoT25saW5lKSB7XG4gICAgLy8gU2V0IHRoZSBjYWxsYmFjay5cbiAgICB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZCA9IG9uRGV2aWNlUGFyYW1zVXBkYXRlZDtcblxuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB2YXIgb2JqID0gdGhpcztcbiAgICB4aHIub3BlbignR0VUJywgT05MSU5FX0RQREJfVVJMLCB0cnVlKTtcbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgb2JqLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDw9IDI5OSkge1xuICAgICAgICAvLyBTdWNjZXNzLlxuICAgICAgICBvYmouZHBkYiA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlKTtcbiAgICAgICAgb2JqLnJlY2FsY3VsYXRlRGV2aWNlUGFyYW1zXygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRXJyb3IgbG9hZGluZyB0aGUgRFBEQi5cbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgbG9hZGluZyBvbmxpbmUgRFBEQiEnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB4aHIuc2VuZCgpO1xuICB9XG59XG5cbi8vIFJldHVybnMgdGhlIGN1cnJlbnQgZGV2aWNlIHBhcmFtZXRlcnMuXG5EcGRiLnByb3RvdHlwZS5nZXREZXZpY2VQYXJhbXMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZGV2aWNlUGFyYW1zO1xufTtcblxuLy8gUmVjYWxjdWxhdGVzIHRoaXMgZGV2aWNlJ3MgcGFyYW1ldGVycyBiYXNlZCBvbiB0aGUgRFBEQi5cbkRwZGIucHJvdG90eXBlLnJlY2FsY3VsYXRlRGV2aWNlUGFyYW1zXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbmV3RGV2aWNlUGFyYW1zID0gdGhpcy5jYWxjRGV2aWNlUGFyYW1zXygpO1xuICBpZiAobmV3RGV2aWNlUGFyYW1zKSB7XG4gICAgdGhpcy5kZXZpY2VQYXJhbXMgPSBuZXdEZXZpY2VQYXJhbXM7XG4gICAgLy8gSW52b2tlIGNhbGxiYWNrLCBpZiBpdCBpcyBzZXQuXG4gICAgaWYgKHRoaXMub25EZXZpY2VQYXJhbXNVcGRhdGVkKSB7XG4gICAgICB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZCh0aGlzLmRldmljZVBhcmFtcyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWNhbGN1bGF0ZSBkZXZpY2UgcGFyYW1ldGVycy4nKTtcbiAgfVxufTtcblxuLy8gUmV0dXJucyBhIERldmljZVBhcmFtcyBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBiZXN0IGd1ZXNzIGFzIHRvIHRoaXNcbi8vIGRldmljZSdzIHBhcmFtZXRlcnMuIENhbiByZXR1cm4gbnVsbCBpZiB0aGUgZGV2aWNlIGRvZXMgbm90IG1hdGNoIGFueVxuLy8ga25vd24gZGV2aWNlcy5cbkRwZGIucHJvdG90eXBlLmNhbGNEZXZpY2VQYXJhbXNfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBkYiA9IHRoaXMuZHBkYjsgLy8gc2hvcnRoYW5kXG4gIGlmICghZGIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEUERCIG5vdCBhdmFpbGFibGUuJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKGRiLmZvcm1hdCAhPSAxKSB7XG4gICAgY29uc29sZS5lcnJvcignRFBEQiBoYXMgdW5leHBlY3RlZCBmb3JtYXQgdmVyc2lvbi4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoIWRiLmRldmljZXMgfHwgIWRiLmRldmljZXMubGVuZ3RoKSB7XG4gICAgY29uc29sZS5lcnJvcignRFBEQiBkb2VzIG5vdCBoYXZlIGEgZGV2aWNlcyBzZWN0aW9uLicpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBhY3R1YWwgdXNlciBhZ2VudCBhbmQgc2NyZWVuIGRpbWVuc2lvbnMgaW4gcGl4ZWxzLlxuICB2YXIgdXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCBuYXZpZ2F0b3IudmVuZG9yIHx8IHdpbmRvdy5vcGVyYTtcbiAgdmFyIHdpZHRoID0gVXRpbC5nZXRTY3JlZW5XaWR0aCgpO1xuICB2YXIgaGVpZ2h0ID0gVXRpbC5nZXRTY3JlZW5IZWlnaHQoKTtcblxuICBpZiAoIWRiLmRldmljZXMpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEUERCIGhhcyBubyBkZXZpY2VzIHNlY3Rpb24uJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRiLmRldmljZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZGV2aWNlID0gZGIuZGV2aWNlc1tpXTtcbiAgICBpZiAoIWRldmljZS5ydWxlcykge1xuICAgICAgY29uc29sZS53YXJuKCdEZXZpY2VbJyArIGkgKyAnXSBoYXMgbm8gcnVsZXMgc2VjdGlvbi4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChkZXZpY2UudHlwZSAhPSAnaW9zJyAmJiBkZXZpY2UudHlwZSAhPSAnYW5kcm9pZCcpIHtcbiAgICAgIGNvbnNvbGUud2FybignRGV2aWNlWycgKyBpICsgJ10gaGFzIGludmFsaWQgdHlwZS4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFNlZSBpZiB0aGlzIGRldmljZSBpcyBvZiB0aGUgYXBwcm9wcmlhdGUgdHlwZS5cbiAgICBpZiAoVXRpbC5pc0lPUygpICE9IChkZXZpY2UudHlwZSA9PSAnaW9zJykpIGNvbnRpbnVlO1xuXG4gICAgLy8gU2VlIGlmIHRoaXMgZGV2aWNlIG1hdGNoZXMgYW55IG9mIHRoZSBydWxlczpcbiAgICB2YXIgbWF0Y2hlZCA9IGZhbHNlO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGV2aWNlLnJ1bGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICB2YXIgcnVsZSA9IGRldmljZS5ydWxlc1tqXTtcbiAgICAgIGlmICh0aGlzLm1hdGNoUnVsZV8ocnVsZSwgdXNlckFnZW50LCB3aWR0aCwgaGVpZ2h0KSkge1xuICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghbWF0Y2hlZCkgY29udGludWU7XG5cbiAgICAvLyBkZXZpY2UuZHBpIG1pZ2h0IGJlIGFuIGFycmF5IG9mIFsgeGRwaSwgeWRwaV0gb3IganVzdCBhIHNjYWxhci5cbiAgICB2YXIgeGRwaSA9IGRldmljZS5kcGlbMF0gfHwgZGV2aWNlLmRwaTtcbiAgICB2YXIgeWRwaSA9IGRldmljZS5kcGlbMV0gfHwgZGV2aWNlLmRwaTtcblxuICAgIHJldHVybiBuZXcgRGV2aWNlUGFyYW1zKHsgeGRwaTogeGRwaSwgeWRwaTogeWRwaSwgYmV2ZWxNbTogZGV2aWNlLmJ3IH0pO1xuICB9XG5cbiAgY29uc29sZS53YXJuKCdObyBEUERCIGRldmljZSBtYXRjaC4nKTtcbiAgcmV0dXJuIG51bGw7XG59O1xuXG5EcGRiLnByb3RvdHlwZS5tYXRjaFJ1bGVfID0gZnVuY3Rpb24ocnVsZSwgdWEsIHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpIHtcbiAgLy8gV2UgY2FuIG9ubHkgbWF0Y2ggJ3VhJyBhbmQgJ3JlcycgcnVsZXMsIG5vdCBvdGhlciB0eXBlcyBsaWtlICdtZG1oJ1xuICAvLyAod2hpY2ggYXJlIG1lYW50IGZvciBuYXRpdmUgcGxhdGZvcm1zKS5cbiAgaWYgKCFydWxlLnVhICYmICFydWxlLnJlcykgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIG91ciB1c2VyIGFnZW50IHN0cmluZyBkb2Vzbid0IGNvbnRhaW4gdGhlIGluZGljYXRlZCB1c2VyIGFnZW50IHN0cmluZyxcbiAgLy8gdGhlIG1hdGNoIGZhaWxzLlxuICBpZiAocnVsZS51YSAmJiB1YS5pbmRleE9mKHJ1bGUudWEpIDwgMCkgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIHRoZSBydWxlIHNwZWNpZmllcyBzY3JlZW4gZGltZW5zaW9ucyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gb3VycyxcbiAgLy8gdGhlIG1hdGNoIGZhaWxzLlxuICBpZiAocnVsZS5yZXMpIHtcbiAgICBpZiAoIXJ1bGUucmVzWzBdIHx8ICFydWxlLnJlc1sxXSkgcmV0dXJuIGZhbHNlO1xuICAgIHZhciByZXNYID0gcnVsZS5yZXNbMF07XG4gICAgdmFyIHJlc1kgPSBydWxlLnJlc1sxXTtcbiAgICAvLyBDb21wYXJlIG1pbiBhbmQgbWF4IHNvIGFzIHRvIG1ha2UgdGhlIG9yZGVyIG5vdCBtYXR0ZXIsIGkuZS4sIGl0IHNob3VsZFxuICAgIC8vIGJlIHRydWUgdGhhdCA2NDB4NDgwID09IDQ4MHg2NDAuXG4gICAgaWYgKE1hdGgubWluKHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpICE9IE1hdGgubWluKHJlc1gsIHJlc1kpIHx8XG4gICAgICAgIChNYXRoLm1heChzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSAhPSBNYXRoLm1heChyZXNYLCByZXNZKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gRGV2aWNlUGFyYW1zKHBhcmFtcykge1xuICB0aGlzLnhkcGkgPSBwYXJhbXMueGRwaTtcbiAgdGhpcy55ZHBpID0gcGFyYW1zLnlkcGk7XG4gIHRoaXMuYmV2ZWxNbSA9IHBhcmFtcy5iZXZlbE1tO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERwZGI7XG5cbn0se1wiLi4vdXRpbC5qc1wiOjIyLFwiLi9kcGRiLWNhY2hlLmpzXCI6MTF9XSwxMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIFV0aWwgPSBfZGVyZXFfKCcuL3V0aWwuanMnKTtcbnZhciBXZWJWUlBvbHlmaWxsID0gX2RlcmVxXygnLi93ZWJ2ci1wb2x5ZmlsbC5qcycpLldlYlZSUG9seWZpbGw7XG5cbi8vIEluaXRpYWxpemUgYSBXZWJWUkNvbmZpZyBqdXN0IGluIGNhc2UuXG53aW5kb3cuV2ViVlJDb25maWcgPSBVdGlsLmV4dGVuZCh7XG4gIC8vIEZvcmNlcyBhdmFpbGFiaWxpdHkgb2YgVlIgbW9kZSwgZXZlbiBmb3Igbm9uLW1vYmlsZSBkZXZpY2VzLlxuICBGT1JDRV9FTkFCTEVfVlI6IGZhbHNlLFxuXG4gIC8vIENvbXBsZW1lbnRhcnkgZmlsdGVyIGNvZWZmaWNpZW50LiAwIGZvciBhY2NlbGVyb21ldGVyLCAxIGZvciBneXJvLlxuICBLX0ZJTFRFUjogMC45OCxcblxuICAvLyBIb3cgZmFyIGludG8gdGhlIGZ1dHVyZSB0byBwcmVkaWN0IGR1cmluZyBmYXN0IG1vdGlvbiAoaW4gc2Vjb25kcykuXG4gIFBSRURJQ1RJT05fVElNRV9TOiAwLjA0MCxcblxuICAvLyBGbGFnIHRvIGVuYWJsZSB0b3VjaCBwYW5uZXIuIEluIGNhc2UgeW91IGhhdmUgeW91ciBvd24gdG91Y2ggY29udHJvbHMuXG4gIFRPVUNIX1BBTk5FUl9ESVNBQkxFRDogdHJ1ZSxcblxuICAvLyBGbGFnIHRvIGRpc2FibGVkIHRoZSBVSSBpbiBWUiBNb2RlLlxuICBDQVJEQk9BUkRfVUlfRElTQUJMRUQ6IGZhbHNlLCAvLyBEZWZhdWx0OiBmYWxzZVxuXG4gIC8vIEZsYWcgdG8gZGlzYWJsZSB0aGUgaW5zdHJ1Y3Rpb25zIHRvIHJvdGF0ZSB5b3VyIGRldmljZS5cbiAgUk9UQVRFX0lOU1RSVUNUSU9OU19ESVNBQkxFRDogZmFsc2UsIC8vIERlZmF1bHQ6IGZhbHNlLlxuXG4gIC8vIEVuYWJsZSB5YXcgcGFubmluZyBvbmx5LCBkaXNhYmxpbmcgcm9sbCBhbmQgcGl0Y2guIFRoaXMgY2FuIGJlIHVzZWZ1bFxuICAvLyBmb3IgcGFub3JhbWFzIHdpdGggbm90aGluZyBpbnRlcmVzdGluZyBhYm92ZSBvciBiZWxvdy5cbiAgWUFXX09OTFk6IGZhbHNlLFxuXG4gIC8vIFRvIGRpc2FibGUga2V5Ym9hcmQgYW5kIG1vdXNlIGNvbnRyb2xzLCBpZiB5b3Ugd2FudCB0byB1c2UgeW91ciBvd25cbiAgLy8gaW1wbGVtZW50YXRpb24uXG4gIE1PVVNFX0tFWUJPQVJEX0NPTlRST0xTX0RJU0FCTEVEOiBmYWxzZSxcblxuICAvLyBQcmV2ZW50IHRoZSBwb2x5ZmlsbCBmcm9tIGluaXRpYWxpemluZyBpbW1lZGlhdGVseS4gUmVxdWlyZXMgdGhlIGFwcFxuICAvLyB0byBjYWxsIEluaXRpYWxpemVXZWJWUlBvbHlmaWxsKCkgYmVmb3JlIGl0IGNhbiBiZSB1c2VkLlxuICBERUZFUl9JTklUSUFMSVpBVElPTjogZmFsc2UsXG5cbiAgLy8gRW5hYmxlIHRoZSBkZXByZWNhdGVkIHZlcnNpb24gb2YgdGhlIEFQSSAobmF2aWdhdG9yLmdldFZSRGV2aWNlcykuXG4gIEVOQUJMRV9ERVBSRUNBVEVEX0FQSTogZmFsc2UsXG5cbiAgLy8gU2NhbGVzIHRoZSByZWNvbW1lbmRlZCBidWZmZXIgc2l6ZSByZXBvcnRlZCBieSBXZWJWUiwgd2hpY2ggY2FuIGltcHJvdmVcbiAgLy8gcGVyZm9ybWFuY2UuXG4gIC8vIFVQREFURSgyMDE2LTA1LTAzKTogU2V0dGluZyB0aGlzIHRvIDAuNSBieSBkZWZhdWx0IHNpbmNlIDEuMCBkb2VzIG5vdFxuICAvLyBwZXJmb3JtIHdlbGwgb24gbWFueSBtb2JpbGUgZGV2aWNlcy5cbiAgQlVGRkVSX1NDQUxFOiAwLjUsXG5cbiAgLy8gQWxsb3cgVlJEaXNwbGF5LnN1Ym1pdEZyYW1lIHRvIGNoYW5nZSBnbCBiaW5kaW5ncywgd2hpY2ggaXMgbW9yZVxuICAvLyBlZmZpY2llbnQgaWYgdGhlIGFwcGxpY2F0aW9uIGNvZGUgd2lsbCByZS1iaW5kIGl0cyByZXNvdXJjZXMgb24gdGhlXG4gIC8vIG5leHQgZnJhbWUgYW55d2F5LiBUaGlzIGhhcyBiZWVuIHNlZW4gdG8gY2F1c2UgcmVuZGVyaW5nIGdsaXRjaGVzIHdpdGhcbiAgLy8gVEhSRUUuanMuXG4gIC8vIERpcnR5IGJpbmRpbmdzIGluY2x1ZGU6IGdsLkZSQU1FQlVGRkVSX0JJTkRJTkcsIGdsLkNVUlJFTlRfUFJPR1JBTSxcbiAgLy8gZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkcsIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSX0JJTkRJTkcsXG4gIC8vIGFuZCBnbC5URVhUVVJFX0JJTkRJTkdfMkQgZm9yIHRleHR1cmUgdW5pdCAwLlxuICBESVJUWV9TVUJNSVRfRlJBTUVfQklORElOR1M6IGZhbHNlLFxuXG4gIC8vIFdoZW4gc2V0IHRvIHRydWUsIHRoaXMgd2lsbCBjYXVzZSBhIHBvbHlmaWxsZWQgVlJEaXNwbGF5IHRvIGFsd2F5cyBiZVxuICAvLyBhcHBlbmRlZCB0byB0aGUgbGlzdCByZXR1cm5lZCBieSBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cygpLCBldmVuIGlmIHRoYXRcbiAgLy8gbGlzdCBpbmNsdWRlcyBhIG5hdGl2ZSBWUkRpc3BsYXkuXG4gIEFMV0FZU19BUFBFTkRfUE9MWUZJTExfRElTUExBWTogZmFsc2Vcbn0sIHdpbmRvdy5XZWJWUkNvbmZpZyk7XG5cbmlmICghd2luZG93LldlYlZSQ29uZmlnLkRFRkVSX0lOSVRJQUxJWkFUSU9OKSB7XG4gIG5ldyBXZWJWUlBvbHlmaWxsKCk7XG59IGVsc2Uge1xuICB3aW5kb3cuSW5pdGlhbGl6ZVdlYlZSUG9seWZpbGwgPSBmdW5jdGlvbigpIHtcbiAgICBuZXcgV2ViVlJQb2x5ZmlsbCgpO1xuICB9XG59XG5cbn0se1wiLi91dGlsLmpzXCI6MjIsXCIuL3dlYnZyLXBvbHlmaWxsLmpzXCI6MjV9XSwxNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgTWF0aFV0aWwgPSB3aW5kb3cuTWF0aFV0aWwgfHwge307XG5cbk1hdGhVdGlsLmRlZ1RvUmFkID0gTWF0aC5QSSAvIDE4MDtcbk1hdGhVdGlsLnJhZFRvRGVnID0gMTgwIC8gTWF0aC5QSTtcblxuLy8gU29tZSBtaW5pbWFsIG1hdGggZnVuY3Rpb25hbGl0eSBib3Jyb3dlZCBmcm9tIFRIUkVFLk1hdGggYW5kIHN0cmlwcGVkIGRvd25cbi8vIGZvciB0aGUgcHVycG9zZXMgb2YgdGhpcyBsaWJyYXJ5LlxuXG5cbk1hdGhVdGlsLlZlY3RvcjIgPSBmdW5jdGlvbiAoIHgsIHkgKSB7XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xufTtcblxuTWF0aFV0aWwuVmVjdG9yMi5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBNYXRoVXRpbC5WZWN0b3IyLFxuXG4gIHNldDogZnVuY3Rpb24gKCB4LCB5ICkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGNvcHk6IGZ1bmN0aW9uICggdiApIHtcbiAgICB0aGlzLnggPSB2Lng7XG4gICAgdGhpcy55ID0gdi55O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc3ViVmVjdG9yczogZnVuY3Rpb24gKCBhLCBiICkge1xuICAgIHRoaXMueCA9IGEueCAtIGIueDtcbiAgICB0aGlzLnkgPSBhLnkgLSBiLnk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbn07XG5cbk1hdGhVdGlsLlZlY3RvcjMgPSBmdW5jdGlvbiAoIHgsIHksIHogKSB7XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xuICB0aGlzLnogPSB6IHx8IDA7XG59O1xuXG5NYXRoVXRpbC5WZWN0b3IzLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IE1hdGhVdGlsLlZlY3RvcjMsXG5cbiAgc2V0OiBmdW5jdGlvbiAoIHgsIHksIHogKSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMueiA9IHo7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb3B5OiBmdW5jdGlvbiAoIHYgKSB7XG4gICAgdGhpcy54ID0gdi54O1xuICAgIHRoaXMueSA9IHYueTtcbiAgICB0aGlzLnogPSB2Lno7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBsZW5ndGg6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCB0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkgKyB0aGlzLnogKiB0aGlzLnogKTtcbiAgfSxcblxuICBub3JtYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2NhbGFyID0gdGhpcy5sZW5ndGgoKTtcblxuICAgIGlmICggc2NhbGFyICE9PSAwICkge1xuICAgICAgdmFyIGludlNjYWxhciA9IDEgLyBzY2FsYXI7XG5cbiAgICAgIHRoaXMubXVsdGlwbHlTY2FsYXIoaW52U2NhbGFyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy54ID0gMDtcbiAgICAgIHRoaXMueSA9IDA7XG4gICAgICB0aGlzLnogPSAwO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG11bHRpcGx5U2NhbGFyOiBmdW5jdGlvbiAoIHNjYWxhciApIHtcbiAgICB0aGlzLnggKj0gc2NhbGFyO1xuICAgIHRoaXMueSAqPSBzY2FsYXI7XG4gICAgdGhpcy56ICo9IHNjYWxhcjtcbiAgfSxcblxuICBhcHBseVF1YXRlcm5pb246IGZ1bmN0aW9uICggcSApIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHZhciBxeCA9IHEueDtcbiAgICB2YXIgcXkgPSBxLnk7XG4gICAgdmFyIHF6ID0gcS56O1xuICAgIHZhciBxdyA9IHEudztcblxuICAgIC8vIGNhbGN1bGF0ZSBxdWF0ICogdmVjdG9yXG4gICAgdmFyIGl4ID0gIHF3ICogeCArIHF5ICogeiAtIHF6ICogeTtcbiAgICB2YXIgaXkgPSAgcXcgKiB5ICsgcXogKiB4IC0gcXggKiB6O1xuICAgIHZhciBpeiA9ICBxdyAqIHogKyBxeCAqIHkgLSBxeSAqIHg7XG4gICAgdmFyIGl3ID0gLSBxeCAqIHggLSBxeSAqIHkgLSBxeiAqIHo7XG5cbiAgICAvLyBjYWxjdWxhdGUgcmVzdWx0ICogaW52ZXJzZSBxdWF0XG4gICAgdGhpcy54ID0gaXggKiBxdyArIGl3ICogLSBxeCArIGl5ICogLSBxeiAtIGl6ICogLSBxeTtcbiAgICB0aGlzLnkgPSBpeSAqIHF3ICsgaXcgKiAtIHF5ICsgaXogKiAtIHF4IC0gaXggKiAtIHF6O1xuICAgIHRoaXMueiA9IGl6ICogcXcgKyBpdyAqIC0gcXogKyBpeCAqIC0gcXkgLSBpeSAqIC0gcXg7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBkb3Q6IGZ1bmN0aW9uICggdiApIHtcbiAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55ICsgdGhpcy56ICogdi56O1xuICB9LFxuXG4gIGNyb3NzVmVjdG9yczogZnVuY3Rpb24gKCBhLCBiICkge1xuICAgIHZhciBheCA9IGEueCwgYXkgPSBhLnksIGF6ID0gYS56O1xuICAgIHZhciBieCA9IGIueCwgYnkgPSBiLnksIGJ6ID0gYi56O1xuXG4gICAgdGhpcy54ID0gYXkgKiBieiAtIGF6ICogYnk7XG4gICAgdGhpcy55ID0gYXogKiBieCAtIGF4ICogYno7XG4gICAgdGhpcy56ID0gYXggKiBieSAtIGF5ICogYng7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbn07XG5cbk1hdGhVdGlsLlF1YXRlcm5pb24gPSBmdW5jdGlvbiAoIHgsIHksIHosIHcgKSB7XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xuICB0aGlzLnogPSB6IHx8IDA7XG4gIHRoaXMudyA9ICggdyAhPT0gdW5kZWZpbmVkICkgPyB3IDogMTtcbn07XG5cbk1hdGhVdGlsLlF1YXRlcm5pb24ucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogTWF0aFV0aWwuUXVhdGVybmlvbixcblxuICBzZXQ6IGZ1bmN0aW9uICggeCwgeSwgeiwgdyApIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy56ID0gejtcbiAgICB0aGlzLncgPSB3O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29weTogZnVuY3Rpb24gKCBxdWF0ZXJuaW9uICkge1xuICAgIHRoaXMueCA9IHF1YXRlcm5pb24ueDtcbiAgICB0aGlzLnkgPSBxdWF0ZXJuaW9uLnk7XG4gICAgdGhpcy56ID0gcXVhdGVybmlvbi56O1xuICAgIHRoaXMudyA9IHF1YXRlcm5pb24udztcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNldEZyb21FdWxlclhZWjogZnVuY3Rpb24oIHgsIHksIHogKSB7XG4gICAgdmFyIGMxID0gTWF0aC5jb3MoIHggLyAyICk7XG4gICAgdmFyIGMyID0gTWF0aC5jb3MoIHkgLyAyICk7XG4gICAgdmFyIGMzID0gTWF0aC5jb3MoIHogLyAyICk7XG4gICAgdmFyIHMxID0gTWF0aC5zaW4oIHggLyAyICk7XG4gICAgdmFyIHMyID0gTWF0aC5zaW4oIHkgLyAyICk7XG4gICAgdmFyIHMzID0gTWF0aC5zaW4oIHogLyAyICk7XG5cbiAgICB0aGlzLnggPSBzMSAqIGMyICogYzMgKyBjMSAqIHMyICogczM7XG4gICAgdGhpcy55ID0gYzEgKiBzMiAqIGMzIC0gczEgKiBjMiAqIHMzO1xuICAgIHRoaXMueiA9IGMxICogYzIgKiBzMyArIHMxICogczIgKiBjMztcbiAgICB0aGlzLncgPSBjMSAqIGMyICogYzMgLSBzMSAqIHMyICogczM7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzZXRGcm9tRXVsZXJZWFo6IGZ1bmN0aW9uKCB4LCB5LCB6ICkge1xuICAgIHZhciBjMSA9IE1hdGguY29zKCB4IC8gMiApO1xuICAgIHZhciBjMiA9IE1hdGguY29zKCB5IC8gMiApO1xuICAgIHZhciBjMyA9IE1hdGguY29zKCB6IC8gMiApO1xuICAgIHZhciBzMSA9IE1hdGguc2luKCB4IC8gMiApO1xuICAgIHZhciBzMiA9IE1hdGguc2luKCB5IC8gMiApO1xuICAgIHZhciBzMyA9IE1hdGguc2luKCB6IC8gMiApO1xuXG4gICAgdGhpcy54ID0gczEgKiBjMiAqIGMzICsgYzEgKiBzMiAqIHMzO1xuICAgIHRoaXMueSA9IGMxICogczIgKiBjMyAtIHMxICogYzIgKiBzMztcbiAgICB0aGlzLnogPSBjMSAqIGMyICogczMgLSBzMSAqIHMyICogYzM7XG4gICAgdGhpcy53ID0gYzEgKiBjMiAqIGMzICsgczEgKiBzMiAqIHMzO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2V0RnJvbUF4aXNBbmdsZTogZnVuY3Rpb24gKCBheGlzLCBhbmdsZSApIHtcbiAgICAvLyBodHRwOi8vd3d3LmV1Y2xpZGVhbnNwYWNlLmNvbS9tYXRocy9nZW9tZXRyeS9yb3RhdGlvbnMvY29udmVyc2lvbnMvYW5nbGVUb1F1YXRlcm5pb24vaW5kZXguaHRtXG4gICAgLy8gYXNzdW1lcyBheGlzIGlzIG5vcm1hbGl6ZWRcblxuICAgIHZhciBoYWxmQW5nbGUgPSBhbmdsZSAvIDIsIHMgPSBNYXRoLnNpbiggaGFsZkFuZ2xlICk7XG5cbiAgICB0aGlzLnggPSBheGlzLnggKiBzO1xuICAgIHRoaXMueSA9IGF4aXMueSAqIHM7XG4gICAgdGhpcy56ID0gYXhpcy56ICogcztcbiAgICB0aGlzLncgPSBNYXRoLmNvcyggaGFsZkFuZ2xlICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBtdWx0aXBseTogZnVuY3Rpb24gKCBxICkge1xuICAgIHJldHVybiB0aGlzLm11bHRpcGx5UXVhdGVybmlvbnMoIHRoaXMsIHEgKTtcbiAgfSxcblxuICBtdWx0aXBseVF1YXRlcm5pb25zOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG4gICAgLy8gZnJvbSBodHRwOi8vd3d3LmV1Y2xpZGVhbnNwYWNlLmNvbS9tYXRocy9hbGdlYnJhL3JlYWxOb3JtZWRBbGdlYnJhL3F1YXRlcm5pb25zL2NvZGUvaW5kZXguaHRtXG5cbiAgICB2YXIgcWF4ID0gYS54LCBxYXkgPSBhLnksIHFheiA9IGEueiwgcWF3ID0gYS53O1xuICAgIHZhciBxYnggPSBiLngsIHFieSA9IGIueSwgcWJ6ID0gYi56LCBxYncgPSBiLnc7XG5cbiAgICB0aGlzLnggPSBxYXggKiBxYncgKyBxYXcgKiBxYnggKyBxYXkgKiBxYnogLSBxYXogKiBxYnk7XG4gICAgdGhpcy55ID0gcWF5ICogcWJ3ICsgcWF3ICogcWJ5ICsgcWF6ICogcWJ4IC0gcWF4ICogcWJ6O1xuICAgIHRoaXMueiA9IHFheiAqIHFidyArIHFhdyAqIHFieiArIHFheCAqIHFieSAtIHFheSAqIHFieDtcbiAgICB0aGlzLncgPSBxYXcgKiBxYncgLSBxYXggKiBxYnggLSBxYXkgKiBxYnkgLSBxYXogKiBxYno7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBpbnZlcnNlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy54ICo9IC0xO1xuICAgIHRoaXMueSAqPSAtMTtcbiAgICB0aGlzLnogKj0gLTE7XG5cbiAgICB0aGlzLm5vcm1hbGl6ZSgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbm9ybWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGwgPSBNYXRoLnNxcnQoIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueiArIHRoaXMudyAqIHRoaXMudyApO1xuXG4gICAgaWYgKCBsID09PSAwICkge1xuICAgICAgdGhpcy54ID0gMDtcbiAgICAgIHRoaXMueSA9IDA7XG4gICAgICB0aGlzLnogPSAwO1xuICAgICAgdGhpcy53ID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgbCA9IDEgLyBsO1xuXG4gICAgICB0aGlzLnggPSB0aGlzLnggKiBsO1xuICAgICAgdGhpcy55ID0gdGhpcy55ICogbDtcbiAgICAgIHRoaXMueiA9IHRoaXMueiAqIGw7XG4gICAgICB0aGlzLncgPSB0aGlzLncgKiBsO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNsZXJwOiBmdW5jdGlvbiAoIHFiLCB0ICkge1xuICAgIGlmICggdCA9PT0gMCApIHJldHVybiB0aGlzO1xuICAgIGlmICggdCA9PT0gMSApIHJldHVybiB0aGlzLmNvcHkoIHFiICk7XG5cbiAgICB2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgeiA9IHRoaXMueiwgdyA9IHRoaXMudztcblxuICAgIC8vIGh0dHA6Ly93d3cuZXVjbGlkZWFuc3BhY2UuY29tL21hdGhzL2FsZ2VicmEvcmVhbE5vcm1lZEFsZ2VicmEvcXVhdGVybmlvbnMvc2xlcnAvXG5cbiAgICB2YXIgY29zSGFsZlRoZXRhID0gdyAqIHFiLncgKyB4ICogcWIueCArIHkgKiBxYi55ICsgeiAqIHFiLno7XG5cbiAgICBpZiAoIGNvc0hhbGZUaGV0YSA8IDAgKSB7XG4gICAgICB0aGlzLncgPSAtIHFiLnc7XG4gICAgICB0aGlzLnggPSAtIHFiLng7XG4gICAgICB0aGlzLnkgPSAtIHFiLnk7XG4gICAgICB0aGlzLnogPSAtIHFiLno7XG5cbiAgICAgIGNvc0hhbGZUaGV0YSA9IC0gY29zSGFsZlRoZXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvcHkoIHFiICk7XG4gICAgfVxuXG4gICAgaWYgKCBjb3NIYWxmVGhldGEgPj0gMS4wICkge1xuICAgICAgdGhpcy53ID0gdztcbiAgICAgIHRoaXMueCA9IHg7XG4gICAgICB0aGlzLnkgPSB5O1xuICAgICAgdGhpcy56ID0gejtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIGhhbGZUaGV0YSA9IE1hdGguYWNvcyggY29zSGFsZlRoZXRhICk7XG4gICAgdmFyIHNpbkhhbGZUaGV0YSA9IE1hdGguc3FydCggMS4wIC0gY29zSGFsZlRoZXRhICogY29zSGFsZlRoZXRhICk7XG5cbiAgICBpZiAoIE1hdGguYWJzKCBzaW5IYWxmVGhldGEgKSA8IDAuMDAxICkge1xuICAgICAgdGhpcy53ID0gMC41ICogKCB3ICsgdGhpcy53ICk7XG4gICAgICB0aGlzLnggPSAwLjUgKiAoIHggKyB0aGlzLnggKTtcbiAgICAgIHRoaXMueSA9IDAuNSAqICggeSArIHRoaXMueSApO1xuICAgICAgdGhpcy56ID0gMC41ICogKCB6ICsgdGhpcy56ICk7XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciByYXRpb0EgPSBNYXRoLnNpbiggKCAxIC0gdCApICogaGFsZlRoZXRhICkgLyBzaW5IYWxmVGhldGEsXG4gICAgcmF0aW9CID0gTWF0aC5zaW4oIHQgKiBoYWxmVGhldGEgKSAvIHNpbkhhbGZUaGV0YTtcblxuICAgIHRoaXMudyA9ICggdyAqIHJhdGlvQSArIHRoaXMudyAqIHJhdGlvQiApO1xuICAgIHRoaXMueCA9ICggeCAqIHJhdGlvQSArIHRoaXMueCAqIHJhdGlvQiApO1xuICAgIHRoaXMueSA9ICggeSAqIHJhdGlvQSArIHRoaXMueSAqIHJhdGlvQiApO1xuICAgIHRoaXMueiA9ICggeiAqIHJhdGlvQSArIHRoaXMueiAqIHJhdGlvQiApO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2V0RnJvbVVuaXRWZWN0b3JzOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gaHR0cDovL2xvbGVuZ2luZS5uZXQvYmxvZy8yMDE0LzAyLzI0L3F1YXRlcm5pb24tZnJvbS10d28tdmVjdG9ycy1maW5hbFxuICAgIC8vIGFzc3VtZXMgZGlyZWN0aW9uIHZlY3RvcnMgdkZyb20gYW5kIHZUbyBhcmUgbm9ybWFsaXplZFxuXG4gICAgdmFyIHYxLCByO1xuICAgIHZhciBFUFMgPSAwLjAwMDAwMTtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoIHZGcm9tLCB2VG8gKSB7XG4gICAgICBpZiAoIHYxID09PSB1bmRlZmluZWQgKSB2MSA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG5cbiAgICAgIHIgPSB2RnJvbS5kb3QoIHZUbyApICsgMTtcblxuICAgICAgaWYgKCByIDwgRVBTICkge1xuICAgICAgICByID0gMDtcblxuICAgICAgICBpZiAoIE1hdGguYWJzKCB2RnJvbS54ICkgPiBNYXRoLmFicyggdkZyb20ueiApICkge1xuICAgICAgICAgIHYxLnNldCggLSB2RnJvbS55LCB2RnJvbS54LCAwICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdjEuc2V0KCAwLCAtIHZGcm9tLnosIHZGcm9tLnkgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdjEuY3Jvc3NWZWN0b3JzKCB2RnJvbSwgdlRvICk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMueCA9IHYxLng7XG4gICAgICB0aGlzLnkgPSB2MS55O1xuICAgICAgdGhpcy56ID0gdjEuejtcbiAgICAgIHRoaXMudyA9IHI7XG5cbiAgICAgIHRoaXMubm9ybWFsaXplKCk7XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSgpLFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRoVXRpbDtcblxufSx7fV0sMTU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFZSRGlzcGxheSA9IF9kZXJlcV8oJy4vYmFzZS5qcycpLlZSRGlzcGxheTtcbnZhciBNYXRoVXRpbCA9IF9kZXJlcV8oJy4vbWF0aC11dGlsLmpzJyk7XG52YXIgVXRpbCA9IF9kZXJlcV8oJy4vdXRpbC5qcycpO1xuXG4vLyBIb3cgbXVjaCB0byByb3RhdGUgcGVyIGtleSBzdHJva2UuXG52YXIgS0VZX1NQRUVEID0gMC4xNTtcbnZhciBLRVlfQU5JTUFUSU9OX0RVUkFUSU9OID0gODA7XG5cbi8vIEhvdyBtdWNoIHRvIHJvdGF0ZSBmb3IgbW91c2UgZXZlbnRzLlxudmFyIE1PVVNFX1NQRUVEX1ggPSAwLjU7XG52YXIgTU9VU0VfU1BFRURfWSA9IDAuMztcblxuLyoqXG4gKiBWUkRpc3BsYXkgYmFzZWQgb24gbW91c2UgYW5kIGtleWJvYXJkIGlucHV0LiBEZXNpZ25lZCBmb3IgZGVza3RvcHMvbGFwdG9wc1xuICogd2hlcmUgb3JpZW50YXRpb24gZXZlbnRzIGFyZW4ndCBzdXBwb3J0ZWQuIENhbm5vdCBwcmVzZW50LlxuICovXG5mdW5jdGlvbiBNb3VzZUtleWJvYXJkVlJEaXNwbGF5KCkge1xuICB0aGlzLmRpc3BsYXlOYW1lID0gJ01vdXNlIGFuZCBLZXlib2FyZCBWUkRpc3BsYXkgKHdlYnZyLXBvbHlmaWxsKSc7XG5cbiAgdGhpcy5jYXBhYmlsaXRpZXMuaGFzT3JpZW50YXRpb24gPSB0cnVlO1xuXG4gIC8vIEF0dGFjaCB0byBtb3VzZSBhbmQga2V5Ym9hcmQgZXZlbnRzLlxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmVfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlRG93bl8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlVXBfLmJpbmQodGhpcykpO1xuXG4gIC8vIFwiUHJpdmF0ZVwiIG1lbWJlcnMuXG4gIHRoaXMucGhpXyA9IDA7XG4gIHRoaXMudGhldGFfID0gMDtcblxuICAvLyBWYXJpYWJsZXMgZm9yIGtleWJvYXJkLWJhc2VkIHJvdGF0aW9uIGFuaW1hdGlvbi5cbiAgdGhpcy50YXJnZXRBbmdsZV8gPSBudWxsO1xuICB0aGlzLmFuZ2xlQW5pbWF0aW9uXyA9IG51bGw7XG5cbiAgLy8gU3RhdGUgdmFyaWFibGVzIGZvciBjYWxjdWxhdGlvbnMuXG4gIHRoaXMub3JpZW50YXRpb25fID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcblxuICAvLyBWYXJpYWJsZXMgZm9yIG1vdXNlLWJhc2VkIHJvdGF0aW9uLlxuICB0aGlzLnJvdGF0ZVN0YXJ0XyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRW5kXyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRGVsdGFfID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcbiAgdGhpcy5pc0RyYWdnaW5nXyA9IGZhbHNlO1xuXG4gIHRoaXMub3JpZW50YXRpb25PdXRfID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbn1cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlID0gbmV3IFZSRGlzcGxheSgpO1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRJbW1lZGlhdGVQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub3JpZW50YXRpb25fLnNldEZyb21FdWxlcllYWih0aGlzLnBoaV8sIHRoaXMudGhldGFfLCAwKTtcblxuICB0aGlzLm9yaWVudGF0aW9uT3V0X1swXSA9IHRoaXMub3JpZW50YXRpb25fLng7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzFdID0gdGhpcy5vcmllbnRhdGlvbl8ueTtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMl0gPSB0aGlzLm9yaWVudGF0aW9uXy56O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1szXSA9IHRoaXMub3JpZW50YXRpb25fLnc7XG5cbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbjogbnVsbCxcbiAgICBvcmllbnRhdGlvbjogdGhpcy5vcmllbnRhdGlvbk91dF8sXG4gICAgbGluZWFyVmVsb2NpdHk6IG51bGwsXG4gICAgbGluZWFyQWNjZWxlcmF0aW9uOiBudWxsLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbnVsbCxcbiAgICBhbmd1bGFyQWNjZWxlcmF0aW9uOiBudWxsXG4gIH07XG59O1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbktleURvd25fID0gZnVuY3Rpb24oZSkge1xuICAvLyBUcmFjayBXQVNEIGFuZCBhcnJvdyBrZXlzLlxuICBpZiAoZS5rZXlDb2RlID09IDM4KSB7IC8vIFVwIGtleS5cbiAgICB0aGlzLmFuaW1hdGVQaGlfKHRoaXMucGhpXyArIEtFWV9TUEVFRCk7XG4gIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM5KSB7IC8vIFJpZ2h0IGtleS5cbiAgICB0aGlzLmFuaW1hdGVUaGV0YV8odGhpcy50aGV0YV8gLSBLRVlfU1BFRUQpO1xuICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSA0MCkgeyAvLyBEb3duIGtleS5cbiAgICB0aGlzLmFuaW1hdGVQaGlfKHRoaXMucGhpXyAtIEtFWV9TUEVFRCk7XG4gIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM3KSB7IC8vIExlZnQga2V5LlxuICAgIHRoaXMuYW5pbWF0ZVRoZXRhXyh0aGlzLnRoZXRhXyArIEtFWV9TUEVFRCk7XG4gIH1cbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVUaGV0YV8gPSBmdW5jdGlvbih0YXJnZXRBbmdsZSkge1xuICB0aGlzLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18oJ3RoZXRhXycsIHRhcmdldEFuZ2xlKTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVQaGlfID0gZnVuY3Rpb24odGFyZ2V0QW5nbGUpIHtcbiAgLy8gUHJldmVudCBsb29raW5nIHRvbyBmYXIgdXAgb3IgZG93bi5cbiAgdGFyZ2V0QW5nbGUgPSBVdGlsLmNsYW1wKHRhcmdldEFuZ2xlLCAtTWF0aC5QSS8yLCBNYXRoLlBJLzIpO1xuICB0aGlzLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18oJ3BoaV8nLCB0YXJnZXRBbmdsZSk7XG59O1xuXG4vKipcbiAqIFN0YXJ0IGFuIGFuaW1hdGlvbiB0byB0cmFuc2l0aW9uIGFuIGFuZ2xlIGZyb20gb25lIHZhbHVlIHRvIGFub3RoZXIuXG4gKi9cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18gPSBmdW5jdGlvbihhbmdsZU5hbWUsIHRhcmdldEFuZ2xlKSB7XG4gIC8vIElmIGFuIGFuaW1hdGlvbiBpcyBjdXJyZW50bHkgcnVubmluZywgY2FuY2VsIGl0LlxuICBpZiAodGhpcy5hbmdsZUFuaW1hdGlvbl8pIHtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuZ2xlQW5pbWF0aW9uXyk7XG4gIH1cbiAgdmFyIHN0YXJ0QW5nbGUgPSB0aGlzW2FuZ2xlTmFtZV07XG4gIHZhciBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAvLyBTZXQgdXAgYW4gaW50ZXJ2YWwgdGltZXIgdG8gcGVyZm9ybSB0aGUgYW5pbWF0aW9uLlxuICB0aGlzLmFuZ2xlQW5pbWF0aW9uXyA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiBhbmltYXRlKCkge1xuICAgIC8vIE9uY2Ugd2UncmUgZmluaXNoZWQgdGhlIGFuaW1hdGlvbiwgd2UncmUgZG9uZS5cbiAgICB2YXIgZWxhcHNlZCA9IG5ldyBEYXRlKCkgLSBzdGFydFRpbWU7XG4gICAgaWYgKGVsYXBzZWQgPj0gS0VZX0FOSU1BVElPTl9EVVJBVElPTikge1xuICAgICAgdGhpc1thbmdsZU5hbWVdID0gdGFyZ2V0QW5nbGU7XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuZ2xlQW5pbWF0aW9uXyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGxvb3Agd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB0aGlzLmFuZ2xlQW5pbWF0aW9uXyA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlLmJpbmQodGhpcykpXG4gICAgLy8gTGluZWFybHkgaW50ZXJwb2xhdGUgdGhlIGFuZ2xlIHNvbWUgYW1vdW50LlxuICAgIHZhciBwZXJjZW50ID0gZWxhcHNlZCAvIEtFWV9BTklNQVRJT05fRFVSQVRJT047XG4gICAgdGhpc1thbmdsZU5hbWVdID0gc3RhcnRBbmdsZSArICh0YXJnZXRBbmdsZSAtIHN0YXJ0QW5nbGUpICogcGVyY2VudDtcbiAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uTW91c2VEb3duXyA9IGZ1bmN0aW9uKGUpIHtcbiAgdGhpcy5yb3RhdGVTdGFydF8uc2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgdGhpcy5pc0RyYWdnaW5nXyA9IHRydWU7XG59O1xuXG4vLyBWZXJ5IHNpbWlsYXIgdG8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vbXJmbGl4LzgzNTEwMjBcbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uTW91c2VNb3ZlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKCF0aGlzLmlzRHJhZ2dpbmdfICYmICF0aGlzLmlzUG9pbnRlckxvY2tlZF8oKSkge1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBTdXBwb3J0IHBvaW50ZXIgbG9jayBBUEkuXG4gIGlmICh0aGlzLmlzUG9pbnRlckxvY2tlZF8oKSkge1xuICAgIHZhciBtb3ZlbWVudFggPSBlLm1vdmVtZW50WCB8fCBlLm1vek1vdmVtZW50WCB8fCAwO1xuICAgIHZhciBtb3ZlbWVudFkgPSBlLm1vdmVtZW50WSB8fCBlLm1vek1vdmVtZW50WSB8fCAwO1xuICAgIHRoaXMucm90YXRlRW5kXy5zZXQodGhpcy5yb3RhdGVTdGFydF8ueCAtIG1vdmVtZW50WCwgdGhpcy5yb3RhdGVTdGFydF8ueSAtIG1vdmVtZW50WSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5yb3RhdGVFbmRfLnNldChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gIH1cbiAgLy8gQ2FsY3VsYXRlIGhvdyBtdWNoIHdlIG1vdmVkIGluIG1vdXNlIHNwYWNlLlxuICB0aGlzLnJvdGF0ZURlbHRhXy5zdWJWZWN0b3JzKHRoaXMucm90YXRlRW5kXywgdGhpcy5yb3RhdGVTdGFydF8pO1xuICB0aGlzLnJvdGF0ZVN0YXJ0Xy5jb3B5KHRoaXMucm90YXRlRW5kXyk7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiB0aGUgY3VtdWxhdGl2ZSBldWxlciBhbmdsZXMuXG4gIHRoaXMucGhpXyArPSAyICogTWF0aC5QSSAqIHRoaXMucm90YXRlRGVsdGFfLnkgLyBzY3JlZW4uaGVpZ2h0ICogTU9VU0VfU1BFRURfWTtcbiAgdGhpcy50aGV0YV8gKz0gMiAqIE1hdGguUEkgKiB0aGlzLnJvdGF0ZURlbHRhXy54IC8gc2NyZWVuLndpZHRoICogTU9VU0VfU1BFRURfWDtcblxuICAvLyBQcmV2ZW50IGxvb2tpbmcgdG9vIGZhciB1cCBvciBkb3duLlxuICB0aGlzLnBoaV8gPSBVdGlsLmNsYW1wKHRoaXMucGhpXywgLU1hdGguUEkvMiwgTWF0aC5QSS8yKTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uTW91c2VVcF8gPSBmdW5jdGlvbihlKSB7XG4gIHRoaXMuaXNEcmFnZ2luZ18gPSBmYWxzZTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmlzUG9pbnRlckxvY2tlZF8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGVsID0gZG9jdW1lbnQucG9pbnRlckxvY2tFbGVtZW50IHx8IGRvY3VtZW50Lm1velBvaW50ZXJMb2NrRWxlbWVudCB8fFxuICAgICAgZG9jdW1lbnQud2Via2l0UG9pbnRlckxvY2tFbGVtZW50O1xuICByZXR1cm4gZWwgIT09IHVuZGVmaW5lZDtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLnJlc2V0UG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBoaV8gPSAwO1xuICB0aGlzLnRoZXRhXyA9IDA7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vdXNlS2V5Ym9hcmRWUkRpc3BsYXk7XG5cbn0se1wiLi9iYXNlLmpzXCI6MyxcIi4vbWF0aC11dGlsLmpzXCI6MTQsXCIuL3V0aWwuanNcIjoyMn1dLDE2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gX2RlcmVxXygnLi91dGlsLmpzJyk7XG5cbmZ1bmN0aW9uIFJvdGF0ZUluc3RydWN0aW9ucygpIHtcbiAgdGhpcy5sb2FkSWNvbl8oKTtcblxuICB2YXIgb3ZlcmxheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IG92ZXJsYXkuc3R5bGU7XG4gIHMucG9zaXRpb24gPSAnZml4ZWQnO1xuICBzLnRvcCA9IDA7XG4gIHMucmlnaHQgPSAwO1xuICBzLmJvdHRvbSA9IDA7XG4gIHMubGVmdCA9IDA7XG4gIHMuYmFja2dyb3VuZENvbG9yID0gJ2dyYXknO1xuICBzLmZvbnRGYW1pbHkgPSAnc2Fucy1zZXJpZic7XG4gIC8vIEZvcmNlIHRoaXMgdG8gYmUgYWJvdmUgdGhlIGZ1bGxzY3JlZW4gY2FudmFzLCB3aGljaCBpcyBhdCB6SW5kZXg6IDk5OTk5OS5cbiAgcy56SW5kZXggPSAxMDAwMDAwO1xuXG4gIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgaW1nLnNyYyA9IHRoaXMuaWNvbjtcbiAgdmFyIHMgPSBpbWcuc3R5bGU7XG4gIHMubWFyZ2luTGVmdCA9ICcyNSUnO1xuICBzLm1hcmdpblRvcCA9ICcyNSUnO1xuICBzLndpZHRoID0gJzUwJSc7XG4gIG92ZXJsYXkuYXBwZW5kQ2hpbGQoaW1nKTtcblxuICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IHRleHQuc3R5bGU7XG4gIHMudGV4dEFsaWduID0gJ2NlbnRlcic7XG4gIHMuZm9udFNpemUgPSAnMTZweCc7XG4gIHMubGluZUhlaWdodCA9ICcyNHB4JztcbiAgcy5tYXJnaW4gPSAnMjRweCAyNSUnO1xuICBzLndpZHRoID0gJzUwJSc7XG4gIHRleHQuaW5uZXJIVE1MID0gJ1BsYWNlIHlvdXIgcGhvbmUgaW50byB5b3VyIENhcmRib2FyZCB2aWV3ZXIuJztcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZCh0ZXh0KTtcblxuICB2YXIgc25hY2tiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHMgPSBzbmFja2Jhci5zdHlsZTtcbiAgcy5iYWNrZ3JvdW5kQ29sb3IgPSAnI0NGRDhEQyc7XG4gIHMucG9zaXRpb24gPSAnZml4ZWQnO1xuICBzLmJvdHRvbSA9IDA7XG4gIHMud2lkdGggPSAnMTAwJSc7XG4gIHMuaGVpZ2h0ID0gJzQ4cHgnO1xuICBzLnBhZGRpbmcgPSAnMTRweCAyNHB4JztcbiAgcy5ib3hTaXppbmcgPSAnYm9yZGVyLWJveCc7XG4gIHMuY29sb3IgPSAnIzY1NkE2Qic7XG4gIG92ZXJsYXkuYXBwZW5kQ2hpbGQoc25hY2tiYXIpO1xuXG4gIHZhciBzbmFja2JhclRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgc25hY2tiYXJUZXh0LnN0eWxlLmZsb2F0ID0gJ2xlZnQnO1xuICBzbmFja2JhclRleHQuaW5uZXJIVE1MID0gJ05vIENhcmRib2FyZCB2aWV3ZXI/JztcblxuICB2YXIgc25hY2tiYXJCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gIHNuYWNrYmFyQnV0dG9uLmhyZWYgPSAnaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9nZXQvY2FyZGJvYXJkL2dldC1jYXJkYm9hcmQvJztcbiAgc25hY2tiYXJCdXR0b24uaW5uZXJIVE1MID0gJ2dldCBvbmUnO1xuICBzbmFja2JhckJ1dHRvbi50YXJnZXQgPSAnX2JsYW5rJztcbiAgdmFyIHMgPSBzbmFja2JhckJ1dHRvbi5zdHlsZTtcbiAgcy5mbG9hdCA9ICdyaWdodCc7XG4gIHMuZm9udFdlaWdodCA9IDYwMDtcbiAgcy50ZXh0VHJhbnNmb3JtID0gJ3VwcGVyY2FzZSc7XG4gIHMuYm9yZGVyTGVmdCA9ICcxcHggc29saWQgZ3JheSc7XG4gIHMucGFkZGluZ0xlZnQgPSAnMjRweCc7XG4gIHMudGV4dERlY29yYXRpb24gPSAnbm9uZSc7XG4gIHMuY29sb3IgPSAnIzY1NkE2Qic7XG5cbiAgc25hY2tiYXIuYXBwZW5kQ2hpbGQoc25hY2tiYXJUZXh0KTtcbiAgc25hY2tiYXIuYXBwZW5kQ2hpbGQoc25hY2tiYXJCdXR0b24pO1xuXG4gIHRoaXMub3ZlcmxheSA9IG92ZXJsYXk7XG4gIHRoaXMudGV4dCA9IHRleHQ7XG5cbiAgdGhpcy5oaWRlKCk7XG59XG5cblJvdGF0ZUluc3RydWN0aW9ucy5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uKHBhcmVudCkge1xuICBpZiAoIXBhcmVudCAmJiAhdGhpcy5vdmVybGF5LnBhcmVudEVsZW1lbnQpIHtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMub3ZlcmxheSk7XG4gIH0gZWxzZSBpZiAocGFyZW50KSB7XG4gICAgaWYgKHRoaXMub3ZlcmxheS5wYXJlbnRFbGVtZW50ICYmIHRoaXMub3ZlcmxheS5wYXJlbnRFbGVtZW50ICE9IHBhcmVudClcbiAgICAgIHRoaXMub3ZlcmxheS5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMub3ZlcmxheSk7XG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodGhpcy5vdmVybGF5KTtcbiAgfVxuXG4gIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICB2YXIgaW1nID0gdGhpcy5vdmVybGF5LnF1ZXJ5U2VsZWN0b3IoJ2ltZycpO1xuICB2YXIgcyA9IGltZy5zdHlsZTtcblxuICBpZiAoVXRpbC5pc0xhbmRzY2FwZU1vZGUoKSkge1xuICAgIHMud2lkdGggPSAnMjAlJztcbiAgICBzLm1hcmdpbkxlZnQgPSAnNDAlJztcbiAgICBzLm1hcmdpblRvcCA9ICczJSc7XG4gIH0gZWxzZSB7XG4gICAgcy53aWR0aCA9ICc1MCUnO1xuICAgIHMubWFyZ2luTGVmdCA9ICcyNSUnO1xuICAgIHMubWFyZ2luVG9wID0gJzI1JSc7XG4gIH1cbn07XG5cblJvdGF0ZUluc3RydWN0aW9ucy5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbn07XG5cblJvdGF0ZUluc3RydWN0aW9ucy5wcm90b3R5cGUuc2hvd1RlbXBvcmFyaWx5ID0gZnVuY3Rpb24obXMsIHBhcmVudCkge1xuICB0aGlzLnNob3cocGFyZW50KTtcbiAgdGhpcy50aW1lciA9IHNldFRpbWVvdXQodGhpcy5oaWRlLmJpbmQodGhpcyksIG1zKTtcbn07XG5cblJvdGF0ZUluc3RydWN0aW9ucy5wcm90b3R5cGUuZGlzYWJsZVNob3dUZW1wb3JhcmlseSA9IGZ1bmN0aW9uKCkge1xuICBjbGVhclRpbWVvdXQodGhpcy50aW1lcik7XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmRpc2FibGVTaG93VGVtcG9yYXJpbHkoKTtcbiAgLy8gSW4gcG9ydHJhaXQgVlIgbW9kZSwgdGVsbCB0aGUgdXNlciB0byByb3RhdGUgdG8gbGFuZHNjYXBlLiBPdGhlcndpc2UsIGhpZGVcbiAgLy8gdGhlIGluc3RydWN0aW9ucy5cbiAgaWYgKCFVdGlsLmlzTGFuZHNjYXBlTW9kZSgpICYmIFV0aWwuaXNNb2JpbGUoKSkge1xuICAgIHRoaXMuc2hvdygpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuaGlkZSgpO1xuICB9XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLmxvYWRJY29uXyA9IGZ1bmN0aW9uKCkge1xuICAvLyBFbmNvZGVkIGFzc2V0X3NyYy9yb3RhdGUtaW5zdHJ1Y3Rpb25zLnN2Z1xuICB0aGlzLmljb24gPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtDanh6ZG1jZ2QybGtkR2c5SWpFNU9IQjRJaUJvWldsbmFIUTlJakkwTUhCNElpQjJhV1YzUW05NFBTSXdJREFnTVRrNElESTBNQ0lnZG1WeWMybHZiajBpTVM0eElpQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIaHRiRzV6T25oc2FXNXJQU0pvZEhSd09pOHZkM2QzTG5jekxtOXlaeTh4T1RrNUwzaHNhVzVySWlCNGJXeHVjenB6YTJWMFkyZzlJbWgwZEhBNkx5OTNkM2N1WW05b1pXMXBZVzVqYjJScGJtY3VZMjl0TDNOclpYUmphQzl1Y3lJK0NpQWdJQ0E4SVMwdElFZGxibVZ5WVhSdmNqb2dVMnRsZEdOb0lETXVNeTR6SUNneE1qQTRNU2tnTFNCb2RIUndPaTh2ZDNkM0xtSnZhR1Z0YVdGdVkyOWthVzVuTG1OdmJTOXphMlYwWTJnZ0xTMCtDaUFnSUNBOGRHbDBiR1UrZEhKaGJuTnBkR2x2Ymp3dmRHbDBiR1UrQ2lBZ0lDQThaR1Z6WXo1RGNtVmhkR1ZrSUhkcGRHZ2dVMnRsZEdOb0xqd3ZaR1Z6WXo0S0lDQWdJRHhrWldaelBqd3ZaR1ZtY3o0S0lDQWdJRHhuSUdsa1BTSlFZV2RsTFRFaUlITjBjbTlyWlQwaWJtOXVaU0lnYzNSeWIydGxMWGRwWkhSb1BTSXhJaUJtYVd4c1BTSnViMjVsSWlCbWFXeHNMWEoxYkdVOUltVjJaVzV2WkdRaUlITnJaWFJqYURwMGVYQmxQU0pOVTFCaFoyVWlQZ29nSUNBZ0lDQWdJRHhuSUdsa1BTSjBjbUZ1YzJsMGFXOXVJaUJ6YTJWMFkyZzZkSGx3WlQwaVRWTkJjblJpYjJGeVpFZHliM1Z3SWo0S0lDQWdJQ0FnSUNBZ0lDQWdQR2NnYVdROUlrbHRjRzl5ZEdWa0xVeGhlV1Z5Y3kxRGIzQjVMVFF0S3kxSmJYQnZjblJsWkMxTVlYbGxjbk10UTI5d2VTMHJMVWx0Y0c5eWRHVmtMVXhoZVdWeWN5MURiM0I1TFRJdFEyOXdlU0lnYzJ0bGRHTm9PblI1Y0dVOUlrMVRUR0Y1WlhKSGNtOTFjQ0krQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4WnlCcFpEMGlTVzF3YjNKMFpXUXRUR0Y1WlhKekxVTnZjSGt0TkNJZ2RISmhibk5tYjNKdFBTSjBjbUZ1YzJ4aGRHVW9NQzR3TURBd01EQXNJREV3Tnk0d01EQXdNREFwSWlCemEyVjBZMmc2ZEhsd1pUMGlUVk5UYUdGd1pVZHliM1Z3SWo0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFE1TGpZeU5Td3lMalV5TnlCRE1UUTVMall5TlN3eUxqVXlOeUF4TlRVdU9EQTFMRFl1TURrMklERTFOaTR6TmpJc05pNDBNVGdnVERFMU5pNHpOaklzTnk0ek1EUWdRekUxTmk0ek5qSXNOeTQwT0RFZ01UVTJMak0zTlN3M0xqWTJOQ0F4TlRZdU5DdzNMamcxTXlCRE1UVTJMalF4TERjdU9UTTBJREUxTmk0ME1pdzRMakF4TlNBeE5UWXVOREkzTERndU1EazFJRU14TlRZdU5UWTNMRGt1TlRFZ01UVTNMalF3TVN3eE1TNHdPVE1nTVRVNExqVXpNaXd4TWk0d09UUWdUREUyTkM0eU5USXNNVGN1TVRVMklFd3hOalF1TXpNekxERTNMakEyTmlCRE1UWTBMak16TXl3eE55NHdOallnTVRZNExqY3hOU3d4TkM0MU16WWdNVFk1TGpVMk9Dd3hOQzR3TkRJZ1F6RTNNUzR3TWpVc01UUXVPRGd6SURFNU5TNDFNemdzTWprdU1ETTFJREU1TlM0MU16Z3NNamt1TURNMUlFd3hPVFV1TlRNNExEZ3pMakF6TmlCRE1UazFMalV6T0N3NE15NDRNRGNnTVRrMUxqRTFNaXc0TkM0eU5UTWdNVGswTGpVNUxEZzBMakkxTXlCRE1UazBMak0xTnl3NE5DNHlOVE1nTVRrMExqQTVOU3c0TkM0eE56Y2dNVGt6TGpneE9DdzROQzR3TVRjZ1RERTJPUzQ0TlRFc056QXVNVGM1SUV3eE5qa3VPRE0zTERjd0xqSXdNeUJNTVRReUxqVXhOU3c0TlM0NU56Z2dUREUwTVM0Mk5qVXNPRFF1TmpVMUlFTXhNell1T1RNMExEZ3pMakV5TmlBeE16RXVPVEUzTERneExqa3hOU0F4TWpZdU56RTBMRGd4TGpBME5TQkRNVEkyTGpjd09TdzRNUzR3TmlBeE1qWXVOekEzTERneExqQTJPU0F4TWpZdU56QTNMRGd4TGpBMk9TQk1NVEl4TGpZMExEazRMakF6SUV3eE1UTXVOelE1TERFd01pNDFPRFlnVERFeE15NDNNVElzTVRBeUxqVXlNeUJNTVRFekxqY3hNaXd4TXpBdU1URXpJRU14TVRNdU56RXlMREV6TUM0NE9EVWdNVEV6TGpNeU5pd3hNekV1TXpNZ01URXlMamMyTkN3eE16RXVNek1nUXpFeE1pNDFNeklzTVRNeExqTXpJREV4TWk0eU5qa3NNVE14TGpJMU5DQXhNVEV1T1RreUxERXpNUzR3T1RRZ1REWTVMalV4T1N3eE1EWXVOVGN5SUVNMk9DNDFOamtzTVRBMkxqQXlNeUEyTnk0M09Ua3NNVEEwTGpZNU5TQTJOeTQzT1Rrc01UQXpMall3TlNCTU5qY3VOems1TERFd01pNDFOeUJNTmpjdU56YzRMREV3TWk0Mk1UY2dRelkzTGpJM0xERXdNaTR6T1RNZ05qWXVOalE0TERFd01pNHlORGtnTmpVdU9UWXlMREV3TWk0eU1UZ2dRelkxTGpnM05Td3hNREl1TWpFMElEWTFMamM0T0N3eE1ESXVNakV5SURZMUxqY3dNU3d4TURJdU1qRXlJRU0yTlM0Mk1EWXNNVEF5TGpJeE1pQTJOUzQxTVRFc01UQXlMakl4TlNBMk5TNDBNVFlzTVRBeUxqSXhPU0JETmpVdU1UazFMREV3TWk0eU1qa2dOalF1T1RjMExERXdNaTR5TXpVZ05qUXVOelUwTERFd01pNHlNelVnUXpZMExqTXpNU3d4TURJdU1qTTFJRFl6TGpreE1Td3hNREl1TWpFMklEWXpMalE1T0N3eE1ESXVNVGM0SUVNMk1TNDRORE1zTVRBeUxqQXlOU0EyTUM0eU9UZ3NNVEF4TGpVM09DQTFPUzR3T1RRc01UQXdMamc0TWlCTU1USXVOVEU0TERjekxqazVNaUJNTVRJdU5USXpMRGMwTGpBd05DQk1NaTR5TkRVc05UVXVNalUwSUVNeExqSTBOQ3cxTXk0ME1qY2dNaTR3TURRc05URXVNRE00SURNdU9UUXpMRFE1TGpreE9DQk1OVGt1T1RVMExERTNMalUzTXlCRE5qQXVOakkyTERFM0xqRTROU0EyTVM0ek5Td3hOeTR3TURFZ05qSXVNRFV6TERFM0xqQXdNU0JETmpNdU16YzVMREUzTGpBd01TQTJOQzQyTWpVc01UY3VOallnTmpVdU1qZ3NNVGd1T0RVMElFdzJOUzR5T0RVc01UZ3VPRFV4SUV3Mk5TNDFNVElzTVRrdU1qWTBJRXcyTlM0MU1EWXNNVGt1TWpZNElFTTJOUzQ1TURrc01qQXVNREF6SURZMkxqUXdOU3d5TUM0Mk9DQTJOaTQ1T0RNc01qRXVNamcySUV3Mk55NHlOaXd5TVM0MU5UWWdRelk1TGpFM05Dd3lNeTQwTURZZ056RXVOekk0TERJMExqTTFOeUEzTkM0ek56TXNNalF1TXpVM0lFTTNOaTR6TWpJc01qUXVNelUzSURjNExqTXlNU3d5TXk0NE5DQTRNQzR4TkRnc01qSXVOemcxSUVNNE1DNHhOakVzTWpJdU56ZzFJRGczTGpRMk55d3hPQzQxTmpZZ09EY3VORFkzTERFNExqVTJOaUJET0RndU1UTTVMREU0TGpFM09DQTRPQzQ0TmpNc01UY3VPVGswSURnNUxqVTJOaXd4Tnk0NU9UUWdRemt3TGpnNU1pd3hOeTQ1T1RRZ09USXVNVE00TERFNExqWTFNaUE1TWk0M09USXNNVGt1T0RRM0lFdzVOaTR3TkRJc01qVXVOemMxSUV3NU5pNHdOalFzTWpVdU56VTNJRXd4TURJdU9EUTVMREk1TGpZM05DQk1NVEF5TGpjME5Dd3lPUzQwT1RJZ1RERTBPUzQyTWpVc01pNDFNamNnVFRFME9TNDJNalVzTUM0NE9USWdRekUwT1M0ek5ETXNNQzQ0T1RJZ01UUTVMakEyTWl3d0xqazJOU0F4TkRndU9ERXNNUzR4TVNCTU1UQXlMalkwTVN3eU55NDJOallnVERrM0xqSXpNU3d5TkM0MU5ESWdURGswTGpJeU5pd3hPUzR3TmpFZ1F6a3pMak14TXl3eE55NHpPVFFnT1RFdU5USTNMREUyTGpNMU9TQTRPUzQxTmpZc01UWXVNelU0SUVNNE9DNDFOVFVzTVRZdU16VTRJRGczTGpVME5pd3hOaTQyTXpJZ09EWXVOalE1TERFM0xqRTFJRU00TXk0NE56Z3NNVGd1TnpVZ056a3VOamczTERJeExqRTJPU0EzT1M0ek56UXNNakV1TXpRMUlFTTNPUzR6TlRrc01qRXVNelV6SURjNUxqTTBOU3d5TVM0ek5qRWdOemt1TXpNc01qRXVNelk1SUVNM055NDNPVGdzTWpJdU1qVTBJRGMyTGpBNE5Dd3lNaTQzTWpJZ056UXVNemN6TERJeUxqY3lNaUJETnpJdU1EZ3hMREl5TGpjeU1pQTJPUzQ1TlRrc01qRXVPRGtnTmpndU16azNMREl3TGpNNElFdzJPQzR4TkRVc01qQXVNVE0xSUVNMk55NDNNRFlzTVRrdU5qY3lJRFkzTGpNeU15d3hPUzR4TlRZZ05qY3VNREEyTERFNExqWXdNU0JETmpZdU9UZzRMREU0TGpVMU9TQTJOaTQ1Tmpnc01UZ3VOVEU1SURZMkxqazBOaXd4T0M0ME56a2dURFkyTGpjeE9Td3hPQzR3TmpVZ1F6WTJMalk1TERFNExqQXhNaUEyTmk0Mk5UZ3NNVGN1T1RZZ05qWXVOakkwTERFM0xqa3hNU0JETmpVdU5qZzJMREUyTGpNek55QTJNeTQ1TlRFc01UVXVNelkySURZeUxqQTFNeXd4TlM0ek5qWWdRell4TGpBME1pd3hOUzR6TmpZZ05qQXVNRE16TERFMUxqWTBJRFU1TGpFek5pd3hOaTR4TlRnZ1RETXVNVEkxTERRNExqVXdNaUJETUM0ME1qWXNOVEF1TURZeElDMHdMall4TXl3MU15NDBORElnTUM0NE1URXNOVFl1TURRZ1RERXhMakE0T1N3M05DNDNPU0JETVRFdU1qWTJMRGMxTGpFeE15QXhNUzQxTXpjc056VXVNelV6SURFeExqZzFMRGMxTGpRNU5DQk1OVGd1TWpjMkxERXdNaTR5T1RnZ1F6VTVMalkzT1N3eE1ETXVNVEE0SURZeExqUXpNeXd4TURNdU5qTWdOak11TXpRNExERXdNeTQ0TURZZ1F6WXpMamd4TWl3eE1ETXVPRFE0SURZMExqSTROU3d4TURNdU9EY2dOalF1TnpVMExERXdNeTQ0TnlCRE5qVXNNVEF6TGpnM0lEWTFMakkwT1N3eE1ETXVPRFkwSURZMUxqUTVOQ3d4TURNdU9EVXlJRU0yTlM0MU5qTXNNVEF6TGpnME9TQTJOUzQyTXpJc01UQXpMamcwTnlBMk5TNDNNREVzTVRBekxqZzBOeUJETmpVdU56WTBMREV3TXk0NE5EY2dOalV1T0RJNExERXdNeTQ0TkRrZ05qVXVPRGtzTVRBekxqZzFNaUJETmpVdU9UZzJMREV3TXk0NE5UWWdOall1TURnc01UQXpMamcyTXlBMk5pNHhOek1zTVRBekxqZzNOQ0JETmpZdU1qZ3lMREV3TlM0ME5qY2dOamN1TXpNeUxERXdOeTR4T1RjZ05qZ3VOekF5TERFd055NDVPRGdnVERFeE1TNHhOelFzTVRNeUxqVXhJRU14TVRFdU5qazRMREV6TWk0NE1USWdNVEV5TGpJek1pd3hNekl1T1RZMUlERXhNaTQzTmpRc01UTXlMamsyTlNCRE1URTBMakkyTVN3eE16SXVPVFkxSURFeE5TNHpORGNzTVRNeExqYzJOU0F4TVRVdU16UTNMREV6TUM0eE1UTWdUREV4TlM0ek5EY3NNVEF6TGpVMU1TQk1NVEl5TGpRMU9DdzVPUzQwTkRZZ1F6RXlNaTQ0TVRrc09Ua3VNak0zSURFeU15NHdPRGNzT1RndU9EazRJREV5TXk0eU1EY3NPVGd1TkRrNElFd3hNamN1T0RZMUxEZ3lMamt3TlNCRE1UTXlMakkzT1N3NE15NDNNRElnTVRNMkxqVTFOeXc0TkM0M05UTWdNVFF3TGpZd055dzROaTR3TXpNZ1RERTBNUzR4TkN3NE5pNDROaklnUXpFME1TNDBOVEVzT0RjdU16UTJJREUwTVM0NU56Y3NPRGN1TmpFeklERTBNaTQxTVRZc09EY3VOakV6SUVNeE5ESXVOemswTERnM0xqWXhNeUF4TkRNdU1EYzJMRGczTGpVME1pQXhORE11TXpNekxEZzNMak01TXlCTU1UWTVMamcyTlN3M01pNHdOellnVERFNU15dzROUzQwTXpNZ1F6RTVNeTQxTWpNc09EVXVOek0xSURFNU5DNHdOVGdzT0RVdU9EZzRJREU1TkM0MU9TdzROUzQ0T0RnZ1F6RTVOaTR3T0Rjc09EVXVPRGc0SURFNU55NHhOek1zT0RRdU5qZzVJREU1Tnk0eE56TXNPRE11TURNMklFd3hPVGN1TVRjekxESTVMakF6TlNCRE1UazNMakUzTXl3eU9DNDBOVEVnTVRrMkxqZzJNU3d5Tnk0NU1URWdNVGsyTGpNMU5Td3lOeTQyTVRrZ1F6RTVOaTR6TlRVc01qY3VOakU1SURFM01TNDRORE1zTVRNdU5EWTNJREUzTUM0ek9EVXNNVEl1TmpJMklFTXhOekF1TVRNeUxERXlMalE0SURFMk9TNDROU3d4TWk0ME1EY2dNVFk1TGpVMk9Dd3hNaTQwTURjZ1F6RTJPUzR5T0RVc01USXVOREEzSURFMk9TNHdNRElzTVRJdU5EZ3hJREUyT0M0M05Ea3NNVEl1TmpJM0lFTXhOamd1TVRRekxERXlMamszT0NBeE5qVXVOelUyTERFMExqTTFOeUF4TmpRdU5ESTBMREUxTGpFeU5TQk1NVFU1TGpZeE5Td3hNQzQ0TnlCRE1UVTRMamM1Tml3eE1DNHhORFVnTVRVNExqRTFOQ3c0TGprek55QXhOVGd1TURVMExEY3VPVE0wSUVNeE5UZ3VNRFExTERjdU9ETTNJREUxT0M0d016UXNOeTQzTXprZ01UVTRMakF5TVN3M0xqWTBJRU14TlRndU1EQTFMRGN1TlRJeklERTFOeTQ1T1Rnc055NDBNU0F4TlRjdU9UazRMRGN1TXpBMElFd3hOVGN1T1RrNExEWXVOREU0SUVNeE5UY3VPVGs0TERVdU9ETTBJREUxTnk0Mk9EWXNOUzR5T1RVZ01UVTNMakU0TVN3MUxqQXdNaUJETVRVMkxqWXlOQ3cwTGpZNElERTFNQzQwTkRJc01TNHhNVEVnTVRVd0xqUTBNaXd4TGpFeE1TQkRNVFV3TGpFNE9Td3dMamsyTlNBeE5Ea3VPVEEzTERBdU9Ea3lJREUwT1M0Mk1qVXNNQzQ0T1RJaUlHbGtQU0pHYVd4c0xURWlJR1pwYkd3OUlpTTBOVFZCTmpRaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5PVFl1TURJM0xESTFMall6TmlCTU1UUXlMall3TXl3MU1pNDFNamNnUXpFME15NDRNRGNzTlRNdU1qSXlJREUwTkM0MU9ESXNOVFF1TVRFMElERTBOQzQ0TkRVc05UVXVNRFk0SUV3eE5EUXVPRE0xTERVMUxqQTNOU0JNTmpNdU5EWXhMREV3TWk0d05UY2dURFl6TGpRMkxERXdNaTR3TlRjZ1F6WXhMamd3Tml3eE1ERXVPVEExSURZd0xqSTJNU3d4TURFdU5EVTNJRFU1TGpBMU55d3hNREF1TnpZeUlFd3hNaTQwT0RFc056TXVPRGN4SUV3NU5pNHdNamNzTWpVdU5qTTJJaUJwWkQwaVJtbHNiQzB5SWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRZekxqUTJNU3d4TURJdU1UYzBJRU0yTXk0ME5UTXNNVEF5TGpFM05DQTJNeTQwTkRZc01UQXlMakUzTkNBMk15NDBNemtzTVRBeUxqRTNNaUJETmpFdU56UTJMREV3TWk0d01UWWdOakF1TWpFeExERXdNUzQxTmpNZ05UZ3VPVGs0TERFd01DNDROak1nVERFeUxqUXlNaXczTXk0NU56TWdRekV5TGpNNE5pdzNNeTQ1TlRJZ01USXVNelkwTERjekxqa3hOQ0F4TWk0ek5qUXNOek11T0RjeElFTXhNaTR6TmpRc056TXVPRE1nTVRJdU16ZzJMRGN6TGpjNU1TQXhNaTQwTWpJc056TXVOemNnVERrMUxqazJPQ3d5TlM0MU16VWdRemsyTGpBd05Dd3lOUzQxTVRRZ09UWXVNRFE1TERJMUxqVXhOQ0E1Tmk0d09EVXNNalV1TlRNMUlFd3hOREl1TmpZeExEVXlMalF5TmlCRE1UUXpMamc0T0N3MU15NHhNelFnTVRRMExqWTRNaXcxTkM0d016Z2dNVFEwTGprMU55dzFOUzR3TXpjZ1F6RTBOQzQ1Tnl3MU5TNHdPRE1nTVRRMExqazFNeXcxTlM0eE16TWdNVFEwTGpreE5TdzFOUzR4TmpFZ1F6RTBOQzQ1TVRFc05UVXVNVFkxSURFME5DNDRPVGdzTlRVdU1UYzBJREUwTkM0NE9UUXNOVFV1TVRjM0lFdzJNeTQxTVRrc01UQXlMakUxT0NCRE5qTXVOVEF4TERFd01pNHhOamtnTmpNdU5EZ3hMREV3TWk0eE56UWdOak11TkRZeExERXdNaTR4TnpRZ1REWXpMalEyTVN3eE1ESXVNVGMwSUZvZ1RURXlMamN4TkN3M015NDROekVnVERVNUxqRXhOU3d4TURBdU5qWXhJRU0yTUM0eU9UTXNNVEF4TGpNME1TQTJNUzQzT0RZc01UQXhMamM0TWlBMk15NDBNelVzTVRBeExqa3pOeUJNTVRRMExqY3dOeXcxTlM0d01UVWdRekUwTkM0ME1qZ3NOVFF1TVRBNElERTBNeTQyT0RJc05UTXVNamcxSURFME1pNDFORFFzTlRJdU5qSTRJRXc1Tmk0d01qY3NNalV1TnpjeElFd3hNaTQzTVRRc056TXVPRGN4SUV3eE1pNDNNVFFzTnpNdU9EY3hJRm9pSUdsa1BTSkdhV3hzTFRNaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UUTRMak15Tnl3MU9DNDBOekVnUXpFME9DNHhORFVzTlRndU5EZ2dNVFEzTGprMk1pdzFPQzQwT0NBeE5EY3VOemd4TERVNExqUTNNaUJETVRRMUxqZzROeXcxT0M0ek9Ea2dNVFEwTGpRM09TdzFOeTQwTXpRZ01UUTBMall6Tml3MU5pNHpOQ0JETVRRMExqWTRPU3cxTlM0NU5qY2dNVFEwTGpZMk5DdzFOUzQxT1RjZ01UUTBMalUyTkN3MU5TNHlNelVnVERZekxqUTJNU3d4TURJdU1EVTNJRU0yTkM0d09Ea3NNVEF5TGpFeE5TQTJOQzQzTXpNc01UQXlMakV6SURZMUxqTTNPU3d4TURJdU1EazVJRU0yTlM0MU5qRXNNVEF5TGpBNUlEWTFMamMwTXl3eE1ESXVNRGtnTmpVdU9USTFMREV3TWk0d09UZ2dRelkzTGpneE9Td3hNREl1TVRneElEWTVMakl5Tnl3eE1ETXVNVE0ySURZNUxqQTNMREV3TkM0eU15Qk1NVFE0TGpNeU55dzFPQzQwTnpFaUlHbGtQU0pHYVd4c0xUUWlJR1pwYkd3OUlpTkdSa1pHUmtZaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5Oamt1TURjc01UQTBMak0wTnlCRE5qa3VNRFE0TERFd05DNHpORGNnTmprdU1ESTFMREV3TkM0ek5DQTJPUzR3TURVc01UQTBMak15TnlCRE5qZ3VPVFk0TERFd05DNHpNREVnTmpndU9UUTRMREV3TkM0eU5UY2dOamd1T1RVMUxERXdOQzR5TVRNZ1F6WTVMREV3TXk0NE9UWWdOamd1T0RrNExERXdNeTQxTnpZZ05qZ3VOalU0TERFd015NHlPRGdnUXpZNExqRTFNeXd4TURJdU5qYzRJRFkzTGpFd015d3hNREl1TWpZMklEWTFMamt5TERFd01pNHlNVFFnUXpZMUxqYzBNaXd4TURJdU1qQTJJRFkxTGpVMk15d3hNREl1TWpBM0lEWTFMak00TlN3eE1ESXVNakUxSUVNMk5DNDNORElzTVRBeUxqSTBOaUEyTkM0d09EY3NNVEF5TGpJek1pQTJNeTQwTlN3eE1ESXVNVGMwSUVNMk15NHpPVGtzTVRBeUxqRTJPU0EyTXk0ek5UZ3NNVEF5TGpFek1pQTJNeTR6TkRjc01UQXlMakE0TWlCRE5qTXVNek0yTERFd01pNHdNek1nTmpNdU16VTRMREV3TVM0NU9ERWdOak11TkRBeUxERXdNUzQ1TlRZZ1RERTBOQzQxTURZc05UVXVNVE0wSUVNeE5EUXVOVE0zTERVMUxqRXhOaUF4TkRRdU5UYzFMRFUxTGpFeE15QXhORFF1TmpBNUxEVTFMakV5TnlCRE1UUTBMalkwTWl3MU5TNHhOREVnTVRRMExqWTJPQ3cxTlM0eE55QXhORFF1TmpjM0xEVTFMakl3TkNCRE1UUTBMamM0TVN3MU5TNDFPRFVnTVRRMExqZ3dOaXcxTlM0NU56SWdNVFEwTGpjMU1TdzFOaTR6TlRjZ1F6RTBOQzQzTURZc05UWXVOamN6SURFME5DNDRNRGdzTlRZdU9UazBJREUwTlM0d05EY3NOVGN1TWpneUlFTXhORFV1TlRVekxEVTNMamc1TWlBeE5EWXVOakF5TERVNExqTXdNeUF4TkRjdU56ZzJMRFU0TGpNMU5TQkRNVFEzTGprMk5DdzFPQzR6TmpNZ01UUTRMakUwTXl3MU9DNHpOak1nTVRRNExqTXlNU3cxT0M0ek5UUWdRekUwT0M0ek56Y3NOVGd1TXpVeUlERTBPQzQwTWpRc05UZ3VNemczSURFME9DNDBNemtzTlRndU5ETTRJRU14TkRndU5EVTBMRFU0TGpRNUlERTBPQzQwTXpJc05UZ3VOVFExSURFME9DNHpPRFVzTlRndU5UY3lJRXcyT1M0eE1qa3NNVEEwTGpNek1TQkROamt1TVRFeExERXdOQzR6TkRJZ05qa3VNRGtzTVRBMExqTTBOeUEyT1M0d055d3hNRFF1TXpRM0lFdzJPUzR3Tnl3eE1EUXVNelEzSUZvZ1RUWTFMalkyTlN3eE1ERXVPVGMxSUVNMk5TNDNOVFFzTVRBeExqazNOU0EyTlM0NE5ESXNNVEF4TGprM055QTJOUzQ1TXl3eE1ERXVPVGd4SUVNMk55NHhPVFlzTVRBeUxqQXpOeUEyT0M0eU9ETXNNVEF5TGpRMk9TQTJPQzQ0TXpnc01UQXpMakV6T1NCRE5qa3VNRFkxTERFd015NDBNVE1nTmprdU1UZzRMREV3TXk0M01UUWdOamt1TVRrNExERXdOQzR3TWpFZ1RERTBOeTQ0T0RNc05UZ3VOVGt5SUVNeE5EY3VPRFEzTERVNExqVTVNaUF4TkRjdU9ERXhMRFU0TGpVNU1TQXhORGN1TnpjMkxEVTRMalU0T1NCRE1UUTJMalV3T1N3MU9DNDFNek1nTVRRMUxqUXlNaXcxT0M0eElERTBOQzQ0Tmpjc05UY3VORE14SUVNeE5EUXVOVGcxTERVM0xqQTVNU0F4TkRRdU5EWTFMRFUyTGpjd055QXhORFF1TlRJc05UWXVNekkwSUVNeE5EUXVOVFl6TERVMkxqQXlNU0F4TkRRdU5UVXlMRFUxTGpjeE5pQXhORFF1TkRnNExEVTFMalF4TkNCTU5qTXVPRFEyTERFd01TNDVOeUJETmpRdU16VXpMREV3TWk0d01ESWdOalF1T0RZM0xERXdNaTR3TURZZ05qVXVNemMwTERFd01TNDVPRElnUXpZMUxqUTNNU3d4TURFdU9UYzNJRFkxTGpVMk9Dd3hNREV1T1RjMUlEWTFMalkyTlN3eE1ERXVPVGMxSUV3Mk5TNDJOalVzTVRBeExqazNOU0JhSWlCcFpEMGlSbWxzYkMwMUlpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUSXVNakE0TERVMUxqRXpOQ0JETVM0eU1EY3NOVE11TXpBM0lERXVPVFkzTERVd0xqa3hOeUF6TGprd05pdzBPUzQzT1RjZ1REVTVMamt4Tnl3eE55NDBOVE1nUXpZeExqZzFOaXd4Tmk0ek16TWdOalF1TWpReExERTJMamt3TnlBMk5TNHlORE1zTVRndU56TTBJRXcyTlM0ME56VXNNVGt1TVRRMElFTTJOUzQ0TnpJc01Ua3VPRGd5SURZMkxqTTJPQ3d5TUM0MU5pQTJOaTQ1TkRVc01qRXVNVFkxSUV3Mk55NHlNak1zTWpFdU5ETTFJRU0zTUM0MU5EZ3NNalF1TmpRNUlEYzFMamd3Tml3eU5TNHhOVEVnT0RBdU1URXhMREl5TGpZMk5TQk1PRGN1TkRNc01UZ3VORFExSUVNNE9TNHpOeXd4Tnk0ek1qWWdPVEV1TnpVMExERTNMamc1T1NBNU1pNDNOVFVzTVRrdU56STNJRXc1Tmk0d01EVXNNalV1TmpVMUlFd3hNaTQwT0RZc056TXVPRGcwSUV3eUxqSXdPQ3cxTlM0eE16UWdXaUlnYVdROUlrWnBiR3d0TmlJZ1ptbHNiRDBpSTBaQlJrRkdRU0krUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE1pNDBPRFlzTnpRdU1EQXhJRU14TWk0ME56WXNOelF1TURBeElERXlMalEyTlN3M015NDVPVGtnTVRJdU5EVTFMRGN6TGprNU5pQkRNVEl1TkRJMExEY3pMams0T0NBeE1pNHpPVGtzTnpNdU9UWTNJREV5TGpNNE5DdzNNeTQ1TkNCTU1pNHhNRFlzTlRVdU1Ua2dRekV1TURjMUxEVXpMak14SURFdU9EVTNMRFV3TGpnME5TQXpMamcwT0N3ME9TNDJPVFlnVERVNUxqZzFPQ3d4Tnk0ek5USWdRell3TGpVeU5Td3hOaTQ1TmpjZ05qRXVNamN4TERFMkxqYzJOQ0EyTWk0d01UWXNNVFl1TnpZMElFTTJNeTQwTXpFc01UWXVOelkwSURZMExqWTJOaXd4Tnk0ME5qWWdOalV1TXpJM0xERTRMalkwTmlCRE5qVXVNek0zTERFNExqWTFOQ0EyTlM0ek5EVXNNVGd1TmpZeklEWTFMak0xTVN3eE9DNDJOelFnVERZMUxqVTNPQ3d4T1M0d09EZ2dRelkxTGpVNE5Dd3hPUzR4SURZMUxqVTRPU3d4T1M0eE1USWdOalV1TlRreExERTVMakV5TmlCRE5qVXVPVGcxTERFNUxqZ3pPQ0EyTmk0ME5qa3NNakF1TkRrM0lEWTNMakF6TERJeExqQTROU0JNTmpjdU16QTFMREl4TGpNMU1TQkROamt1TVRVeExESXpMakV6TnlBM01TNDJORGtzTWpRdU1USWdOelF1TXpNMkxESTBMakV5SUVNM05pNHpNVE1zTWpRdU1USWdOemd1TWprc01qTXVOVGd5SURnd0xqQTFNeXd5TWk0MU5qTWdRemd3TGpBMk5Dd3lNaTQxTlRjZ09EQXVNRGMyTERJeUxqVTFNeUE0TUM0d09EZ3NNakl1TlRVZ1REZzNMak0zTWl3eE9DNHpORFFnUXpnNExqQXpPQ3d4Tnk0NU5Ua2dPRGd1TnpnMExERTNMamMxTmlBNE9TNDFNamtzTVRjdU56VTJJRU01TUM0NU5UWXNNVGN1TnpVMklEa3lMakl3TVN3eE9DNDBOeklnT1RJdU9EVTRMREU1TGpZM0lFdzVOaTR4TURjc01qVXVOVGs1SUVNNU5pNHhNemdzTWpVdU5qVTBJRGsyTGpFeE9Dd3lOUzQzTWpRZ09UWXVNRFl6TERJMUxqYzFOaUJNTVRJdU5UUTFMRGN6TGprNE5TQkRNVEl1TlRJMkxEY3pMams1TmlBeE1pNDFNRFlzTnpRdU1EQXhJREV5TGpRNE5pdzNOQzR3TURFZ1RERXlMalE0Tml3M05DNHdNREVnV2lCTk5qSXVNREUyTERFMkxqazVOeUJETmpFdU16RXlMREUyTGprNU55QTJNQzQyTURZc01UY3VNVGtnTlRrdU9UYzFMREUzTGpVMU5DQk1NeTQ1TmpVc05Ea3VPRGs1SUVNeUxqQTRNeXcxTUM0NU9EVWdNUzR6TkRFc05UTXVNekE0SURJdU16RXNOVFV1TURjNElFd3hNaTQxTXpFc056TXVOekl6SUV3NU5TNDRORGdzTWpVdU5qRXhJRXc1TWk0Mk5UTXNNVGt1TnpneUlFTTVNaTR3TXpnc01UZ3VOallnT1RBdU9EY3NNVGN1T1RrZ09Ea3VOVEk1TERFM0xqazVJRU00T0M0NE1qVXNNVGN1T1RrZ09EZ3VNVEU1TERFNExqRTRNaUE0Tnk0ME9Ea3NNVGd1TlRRM0lFdzRNQzR4TnpJc01qSXVOemN5SUVNNE1DNHhOakVzTWpJdU56YzRJRGd3TGpFME9Td3lNaTQzT0RJZ09EQXVNVE0zTERJeUxqYzROU0JETnpndU16UTJMREl6TGpneE1TQTNOaTR6TkRFc01qUXVNelUwSURjMExqTXpOaXd5TkM0ek5UUWdRemN4TGpVNE9Dd3lOQzR6TlRRZ05qa3VNRE16TERJekxqTTBOeUEyTnk0eE5ESXNNakV1TlRFNUlFdzJOaTQ0TmpRc01qRXVNalE1SUVNMk5pNHlOemNzTWpBdU5qTTBJRFkxTGpjM05Dd3hPUzQ1TkRjZ05qVXVNelkzTERFNUxqSXdNeUJETmpVdU16WXNNVGt1TVRreUlEWTFMak0xTml3eE9TNHhOemtnTmpVdU16VTBMREU1TGpFMk5pQk1OalV1TVRZekxERTRMamd4T1NCRE5qVXVNVFUwTERFNExqZ3hNU0EyTlM0eE5EWXNNVGd1T0RBeElEWTFMakUwTERFNExqYzVJRU0yTkM0MU1qVXNNVGN1TmpZM0lEWXpMak0xTnl3eE5pNDVPVGNnTmpJdU1ERTJMREUyTGprNU55Qk1Oakl1TURFMkxERTJMams1TnlCYUlpQnBaRDBpUm1sc2JDMDNJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFF5TGpRek5DdzBPQzQ0TURnZ1REUXlMalF6TkN3ME9DNDRNRGdnUXpNNUxqa3lOQ3cwT0M0NE1EY2dNemN1TnpNM0xEUTNMalUxSURNMkxqVTRNaXcwTlM0ME5ETWdRek0wTGpjM01TdzBNaTR4TXprZ016WXVNVFEwTERNM0xqZ3dPU0F6T1M0Mk5ERXNNelV1TnpnNUlFdzFNUzQ1TXpJc01qZ3VOamt4SUVNMU15NHhNRE1zTWpndU1ERTFJRFUwTGpReE15d3lOeTQyTlRnZ05UVXVOekl4TERJM0xqWTFPQ0JETlRndU1qTXhMREkzTGpZMU9DQTJNQzQwTVRnc01qZ3VPVEUySURZeExqVTNNeXd6TVM0d01qTWdRell6TGpNNE5Dd3pOQzR6TWpjZ05qSXVNREV5TERNNExqWTFOeUExT0M0MU1UUXNOREF1TmpjM0lFdzBOaTR5TWpNc05EY3VOemMxSUVNME5TNHdOVE1zTkRndU5EVWdORE11TnpReUxEUTRMamd3T0NBME1pNDBNelFzTkRndU9EQTRJRXcwTWk0ME16UXNORGd1T0RBNElGb2dUVFUxTGpjeU1Td3lPQzR4TWpVZ1F6VTBMalE1TlN3eU9DNHhNalVnTlRNdU1qWTFMREk0TGpRMk1TQTFNaTR4TmpZc01qa3VNRGsySUV3ek9TNDROelVzTXpZdU1UazBJRU16Tmk0MU9UWXNNemd1TURnM0lETTFMak13TWl3ME1pNHhNellnTXpZdU9Ua3lMRFExTGpJeE9DQkRNemd1TURZekxEUTNMakUzTXlBME1DNHdPVGdzTkRndU16UWdOREl1TkRNMExEUTRMak0wSUVNME15NDJOakVzTkRndU16UWdORFF1T0Rrc05EZ3VNREExSURRMUxqazVMRFEzTGpNM0lFdzFPQzR5T0RFc05EQXVNamN5SUVNMk1TNDFOaXd6T0M0ek56a2dOakl1T0RVekxETTBMak16SURZeExqRTJOQ3d6TVM0eU5EZ2dRell3TGpBNU1pd3lPUzR5T1RNZ05UZ3VNRFU0TERJNExqRXlOU0ExTlM0M01qRXNNamd1TVRJMUlFdzFOUzQzTWpFc01qZ3VNVEkxSUZvaUlHbGtQU0pHYVd4c0xUZ2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFE1TGpVNE9Dd3lMalF3TnlCRE1UUTVMalU0T0N3eUxqUXdOeUF4TlRVdU56WTRMRFV1T1RjMUlERTFOaTR6TWpVc05pNHlPVGNnVERFMU5pNHpNalVzTnk0eE9EUWdRekUxTmk0ek1qVXNOeTR6TmlBeE5UWXVNek00TERjdU5UUTBJREUxTmk0ek5qSXNOeTQzTXpNZ1F6RTFOaTR6TnpNc055NDRNVFFnTVRVMkxqTTRNaXczTGpnNU5DQXhOVFl1TXprc055NDVOelVnUXpFMU5pNDFNeXc1TGpNNUlERTFOeTR6TmpNc01UQXVPVGN6SURFMU9DNDBPVFVzTVRFdU9UYzBJRXd4TmpVdU9Ea3hMREU0TGpVeE9TQkRNVFkyTGpBMk9Dd3hPQzQyTnpVZ01UWTJMakkwT1N3eE9DNDRNVFFnTVRZMkxqUXpNaXd4T0M0NU16UWdRekUyT0M0d01URXNNVGt1T1RjMElERTJPUzR6T0RJc01Ua3VOQ0F4TmprdU5EazBMREUzTGpZMU1pQkRNVFk1TGpVME15d3hOaTQ0TmpnZ01UWTVMalUxTVN3eE5pNHdOVGNnTVRZNUxqVXhOeXd4TlM0eU1qTWdUREUyT1M0MU1UUXNNVFV1TURZeklFd3hOamt1TlRFMExERXpMamt4TWlCRE1UY3dMamM0TERFMExqWTBNaUF4T1RVdU5UQXhMREk0TGpreE5TQXhPVFV1TlRBeExESTRMamt4TlNCTU1UazFMalV3TVN3NE1pNDVNVFVnUXpFNU5TNDFNREVzT0RRdU1EQTFJREU1TkM0M016RXNPRFF1TkRRMUlERTVNeTQzT0RFc09ETXVPRGszSUV3eE5URXVNekE0TERVNUxqTTNOQ0JETVRVd0xqTTFPQ3cxT0M0NE1qWWdNVFE1TGpVNE9DdzFOeTQwT1RjZ01UUTVMalU0T0N3MU5pNDBNRGdnVERFME9TNDFPRGdzTWpJdU16YzFJaUJwWkQwaVJtbHNiQzA1SWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFNU5DNDFOVE1zT0RRdU1qVWdRekU1TkM0eU9UWXNPRFF1TWpVZ01UazBMakF4TXl3NE5DNHhOalVnTVRrekxqY3lNaXc0TXk0NU9UY2dUREUxTVM0eU5TdzFPUzQwTnpZZ1F6RTFNQzR5Tmprc05UZ3VPVEE1SURFME9TNDBOekVzTlRjdU5UTXpJREUwT1M0ME56RXNOVFl1TkRBNElFd3hORGt1TkRjeExESXlMak0zTlNCTU1UUTVMamN3TlN3eU1pNHpOelVnVERFME9TNDNNRFVzTlRZdU5EQTRJRU14TkRrdU56QTFMRFUzTGpRMU9TQXhOVEF1TkRVc05UZ3VOelEwSURFMU1TNHpOallzTlRrdU1qYzBJRXd4T1RNdU9ETTVMRGd6TGpjNU5TQkRNVGswTGpJMk15dzROQzR3TkNBeE9UUXVOalUxTERnMExqQTRNeUF4T1RRdU9UUXlMRGd6TGpreE55QkRNVGsxTGpJeU55dzRNeTQzTlRNZ01UazFMak00TkN3NE15NHpPVGNnTVRrMUxqTTROQ3c0TWk0NU1UVWdUREU1TlM0ek9EUXNNamd1T1RneUlFTXhPVFF1TVRBeUxESTRMakkwTWlBeE56SXVNVEEwTERFMUxqVTBNaUF4TmprdU5qTXhMREUwTGpFeE5DQk1NVFk1TGpZek5Dd3hOUzR5TWlCRE1UWTVMalkyT0N3eE5pNHdOVElnTVRZNUxqWTJMREUyTGpnM05DQXhOamt1TmpFc01UY3VOalU1SUVNeE5qa3VOVFUyTERFNExqVXdNeUF4TmprdU1qRTBMREU1TGpFeU15QXhOamd1TmpRM0xERTVMalF3TlNCRE1UWTRMakF5T0N3eE9TNDNNVFFnTVRZM0xqRTVOeXd4T1M0MU56Z2dNVFkyTGpNMk55d3hPUzR3TXpJZ1F6RTJOaTR4T0RFc01UZ3VPVEE1SURFMk5TNDVPVFVzTVRndU56WTJJREUyTlM0NE1UUXNNVGd1TmpBMklFd3hOVGd1TkRFM0xERXlMakEyTWlCRE1UVTNMakkxT1N3eE1TNHdNellnTVRVMkxqUXhPQ3c1TGpRek55QXhOVFl1TWpjMExEY3VPVGcySUVNeE5UWXVNalkyTERjdU9UQTNJREUxTmk0eU5UY3NOeTQ0TWpjZ01UVTJMakkwTnl3M0xqYzBPQ0JETVRVMkxqSXlNU3czTGpVMU5TQXhOVFl1TWpBNUxEY3VNelkxSURFMU5pNHlNRGtzTnk0eE9EUWdUREUxTmk0eU1Ea3NOaTR6TmpRZ1F6RTFOUzR6TnpVc05TNDRPRE1nTVRRNUxqVXlPU3d5TGpVd09DQXhORGt1TlRJNUxESXVOVEE0SUV3eE5Ea3VOalEyTERJdU16QTJJRU14TkRrdU5qUTJMREl1TXpBMklERTFOUzQ0TWpjc05TNDROelFnTVRVMkxqTTROQ3cyTGpFNU5pQk1NVFUyTGpRME1pdzJMakl6SUV3eE5UWXVORFF5TERjdU1UZzBJRU14TlRZdU5EUXlMRGN1TXpVMUlERTFOaTQwTlRRc055NDFNelVnTVRVMkxqUTNPQ3czTGpjeE55QkRNVFUyTGpRNE9TdzNMamdnTVRVMkxqUTVPU3czTGpnNE1pQXhOVFl1TlRBM0xEY3VPVFl6SUVNeE5UWXVOalExTERrdU16VTRJREUxTnk0ME5UVXNNVEF1T0RrNElERTFPQzQxTnpJc01URXVPRGcySUV3eE5qVXVPVFk1TERFNExqUXpNU0JETVRZMkxqRTBNaXd4T0M0MU9EUWdNVFkyTGpNeE9Td3hPQzQzTWlBeE5qWXVORGsyTERFNExqZ3pOeUJETVRZM0xqSTFOQ3d4T1M0ek16WWdNVFk0TERFNUxqUTJOeUF4TmpndU5UUXpMREU1TGpFNU5pQkRNVFk1TGpBek15d3hPQzQ1TlRNZ01UWTVMak15T1N3eE9DNDBNREVnTVRZNUxqTTNOeXd4Tnk0Mk5EVWdRekUyT1M0ME1qY3NNVFl1T0RZM0lERTJPUzQwTXpRc01UWXVNRFUwSURFMk9TNDBNREVzTVRVdU1qSTRJRXd4TmprdU16azNMREUxTGpBMk5TQk1NVFk1TGpNNU55d3hNeTQzTVNCTU1UWTVMalUzTWl3eE15NDRNU0JETVRjd0xqZ3pPU3d4TkM0MU5ERWdNVGsxTGpVMU9Td3lPQzQ0TVRRZ01UazFMalUxT1N3eU9DNDRNVFFnVERFNU5TNDJNVGdzTWpndU9EUTNJRXd4T1RVdU5qRTRMRGd5TGpreE5TQkRNVGsxTGpZeE9DdzRNeTQwT0RRZ01UazFMalF5TERnekxqa3hNU0F4T1RVdU1EVTVMRGcwTGpFeE9TQkRNVGswTGprd09DdzROQzR5TURZZ01UazBMamN6Tnl3NE5DNHlOU0F4T1RRdU5UVXpMRGcwTGpJMUlpQnBaRDBpUm1sc2JDMHhNQ0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TkRVdU5qZzFMRFUyTGpFMk1TQk1NVFk1TGpnc056QXVNRGd6SUV3eE5ETXVPREl5TERnMUxqQTRNU0JNTVRReUxqTTJMRGcwTGpjM05DQkRNVE0xTGpneU5pdzRNaTQyTURRZ01USTRMamN6TWl3NE1TNHdORFlnTVRJeExqTTBNU3c0TUM0eE5UZ2dRekV4Tmk0NU56WXNOemt1TmpNMElERXhNaTQyTnpnc09ERXVNalUwSURFeE1TNDNORE1zT0RNdU56YzRJRU14TVRFdU5UQTJMRGcwTGpReE5DQXhNVEV1TlRBekxEZzFMakEzTVNBeE1URXVOek15TERnMUxqY3dOaUJETVRFekxqSTNMRGc1TGprM015QXhNVFV1T1RZNExEazBMakEyT1NBeE1Ua3VOekkzTERrM0xqZzBNU0JNTVRJd0xqSTFPU3c1T0M0Mk9EWWdRekV5TUM0eU5pdzVPQzQyT0RVZ09UUXVNamd5TERFeE15NDJPRE1nT1RRdU1qZ3lMREV4TXk0Mk9ETWdURGN3TGpFMk55dzVPUzQzTmpFZ1RERTBOUzQyT0RVc05UWXVNVFl4SWlCcFpEMGlSbWxzYkMweE1TSWdabWxzYkQwaUkwWkdSa1pHUmlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMDVOQzR5T0RJc01URXpMamd4T0NCTU9UUXVNakl6TERFeE15NDNPRFVnVERZNUxqa3pNeXc1T1M0M05qRWdURGN3TGpFd09DdzVPUzQyTmlCTU1UUTFMalk0TlN3MU5pNHdNallnVERFME5TNDNORE1zTlRZdU1EVTVJRXd4TnpBdU1ETXpMRGN3TGpBNE15Qk1NVFF6TGpnME1pdzROUzR5TURVZ1RERTBNeTQzT1Rjc09EVXVNVGsxSUVNeE5ETXVOemN5TERnMUxqRTVJREUwTWk0ek16WXNPRFF1T0RnNElERTBNaTR6TXpZc09EUXVPRGc0SUVNeE16VXVOemczTERneUxqY3hOQ0F4TWpndU56SXpMRGd4TGpFMk15QXhNakV1TXpJM0xEZ3dMakkzTkNCRE1USXdMamM0T0N3NE1DNHlNRGtnTVRJd0xqSXpOaXc0TUM0eE56Y2dNVEU1TGpZNE9TdzRNQzR4TnpjZ1F6RXhOUzQ1TXpFc09EQXVNVGMzSURFeE1pNDJNelVzT0RFdU56QTRJREV4TVM0NE5USXNPRE11T0RFNUlFTXhNVEV1TmpJMExEZzBMalF6TWlBeE1URXVOakl4TERnMUxqQTFNeUF4TVRFdU9EUXlMRGcxTGpZMk55QkRNVEV6TGpNM055dzRPUzQ1TWpVZ01URTJMakExT0N3NU15NDVPVE1nTVRFNUxqZ3hMRGszTGpjMU9DQk1NVEU1TGpneU5pdzVOeTQzTnprZ1RERXlNQzR6TlRJc09UZ3VOakUwSUVNeE1qQXVNelUwTERrNExqWXhOeUF4TWpBdU16VTJMRGs0TGpZeUlERXlNQzR6TlRnc09UZ3VOakkwSUV3eE1qQXVOREl5TERrNExqY3lOaUJNTVRJd0xqTXhOeXc1T0M0M09EY2dRekV5TUM0eU5qUXNPVGd1T0RFNElEazBMalU1T1N3eE1UTXVOak0xSURrMExqTTBMREV4TXk0M09EVWdURGswTGpJNE1pd3hNVE11T0RFNElFdzVOQzR5T0RJc01URXpMamd4T0NCYUlFMDNNQzQwTURFc09Ua3VOell4SUV3NU5DNHlPRElzTVRFekxqVTBPU0JNTVRFNUxqQTROQ3c1T1M0eU1qa2dRekV4T1M0Mk15dzVPQzQ1TVRRZ01URTVMamt6TERrNExqYzBJREV5TUM0eE1ERXNPVGd1TmpVMElFd3hNVGt1TmpNMUxEazNMamt4TkNCRE1URTFMamcyTkN3NU5DNHhNamNnTVRFekxqRTJPQ3c1TUM0d016TWdNVEV4TGpZeU1pdzROUzQzTkRZZ1F6RXhNUzR6T0RJc09EVXVNRGM1SURFeE1TNHpPRFlzT0RRdU5EQTBJREV4TVM0Mk16TXNPRE11TnpNNElFTXhNVEl1TkRRNExEZ3hMalV6T1NBeE1UVXVPRE0yTERjNUxqazBNeUF4TVRrdU5qZzVMRGM1TGprME15QkRNVEl3TGpJME5pdzNPUzQ1TkRNZ01USXdMamd3Tml3M09TNDVOellnTVRJeExqTTFOU3c0TUM0d05ESWdRekV5T0M0M05qY3NPREF1T1RNeklERXpOUzQ0TkRZc09ESXVORGczSURFME1pNHpPVFlzT0RRdU5qWXpJRU14TkRNdU1qTXlMRGcwTGpnek9DQXhORE11TmpFeExEZzBMamt4TnlBeE5ETXVOemcyTERnMExqazJOeUJNTVRZNUxqVTJOaXczTUM0d09ETWdUREUwTlM0Mk9EVXNOVFl1TWprMUlFdzNNQzQwTURFc09Ua3VOell4SUV3M01DNDBNREVzT1RrdU56WXhJRm9pSUdsa1BTSkdhV3hzTFRFeUlpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTJOeTR5TXl3eE9DNDVOemtnVERFMk55NHlNeXcyT1M0NE5TQk1NVE01TGprd09TdzROUzQyTWpNZ1RERXpNeTQwTkRnc056RXVORFUySUVNeE16SXVOVE00TERZNUxqUTJJREV6TUM0d01pdzJPUzQzTVRnZ01USTNMamd5TkN3M01pNHdNeUJETVRJMkxqYzJPU3czTXk0eE5DQXhNalV1T1RNeExEYzBMalU0TlNBeE1qVXVORGswTERjMkxqQTBPQ0JNTVRFNUxqQXpOQ3c1Tnk0Mk56WWdURGt4TGpjeE1pd3hNVE11TkRVZ1REa3hMamN4TWl3Mk1pNDFOemtnVERFMk55NHlNeXd4T0M0NU56a2lJR2xrUFNKR2FXeHNMVEV6SWlCbWFXeHNQU0lqUmtaR1JrWkdJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRreExqY3hNaXd4TVRNdU5UWTNJRU01TVM0Mk9USXNNVEV6TGpVMk55QTVNUzQyTnpJc01URXpMalUyTVNBNU1TNDJOVE1zTVRFekxqVTFNU0JET1RFdU5qRTRMREV4TXk0MU15QTVNUzQxT1RVc01URXpMalE1TWlBNU1TNDFPVFVzTVRFekxqUTFJRXc1TVM0MU9UVXNOakl1TlRjNUlFTTVNUzQxT1RVc05qSXVOVE0zSURreExqWXhPQ3cyTWk0ME9Ua2dPVEV1TmpVekxEWXlMalEzT0NCTU1UWTNMakUzTWl3eE9DNDROemdnUXpFMk55NHlNRGdzTVRndU9EVTNJREUyTnk0eU5USXNNVGd1T0RVM0lERTJOeTR5T0Rnc01UZ3VPRGM0SUVNeE5qY3VNekkwTERFNExqZzVPU0F4TmpjdU16UTNMREU0TGprek55QXhOamN1TXpRM0xERTRMamszT1NCTU1UWTNMak0wTnl3Mk9TNDROU0JETVRZM0xqTTBOeXcyT1M0NE9URWdNVFkzTGpNeU5DdzJPUzQ1TXlBeE5qY3VNamc0TERZNUxqazFJRXd4TXprdU9UWTNMRGcxTGpjeU5TQkRNVE01TGprek9TdzROUzQzTkRFZ01UTTVMamt3TlN3NE5TNDNORFVnTVRNNUxqZzNNeXc0TlM0M016VWdRekV6T1M0NE5ESXNPRFV1TnpJMUlERXpPUzQ0TVRZc09EVXVOekF5SURFek9TNDRNRElzT0RVdU5qY3lJRXd4TXpNdU16UXlMRGN4TGpVd05DQkRNVE15TGprMk55dzNNQzQyT0RJZ01UTXlMakk0TERjd0xqSXlPU0F4TXpFdU5EQTRMRGN3TGpJeU9TQkRNVE13TGpNeE9TdzNNQzR5TWprZ01USTVMakEwTkN3M01DNDVNVFVnTVRJM0xqa3dPQ3czTWk0eE1TQkRNVEkyTGpnM05DdzNNeTR5SURFeU5pNHdNelFzTnpRdU5qUTNJREV5TlM0Mk1EWXNOell1TURneUlFd3hNVGt1TVRRMkxEazNMamN3T1NCRE1URTVMakV6Tnl3NU55NDNNemdnTVRFNUxqRXhPQ3c1Tnk0M05qSWdNVEU1TGpBNU1pdzVOeTQzTnpjZ1REa3hMamMzTERFeE15NDFOVEVnUXpreExqYzFNaXd4TVRNdU5UWXhJRGt4TGpjek1pd3hNVE11TlRZM0lEa3hMamN4TWl3eE1UTXVOVFkzSUV3NU1TNDNNVElzTVRFekxqVTJOeUJhSUUwNU1TNDRNamtzTmpJdU5qUTNJRXc1TVM0NE1qa3NNVEV6TGpJME9DQk1NVEU0TGprek5TdzVOeTQxT1RnZ1RERXlOUzR6T0RJc056WXVNREUxSUVNeE1qVXVPREkzTERjMExqVXlOU0F4TWpZdU5qWTBMRGN6TGpBNE1TQXhNamN1TnpNNUxEY3hMamsxSUVNeE1qZ3VPVEU1TERjd0xqY3dPQ0F4TXpBdU1qVTJMRFk1TGprNU5pQXhNekV1TkRBNExEWTVMams1TmlCRE1UTXlMak0zTnl3Mk9TNDVPVFlnTVRNekxqRXpPU3czTUM0ME9UY2dNVE16TGpVMU5DdzNNUzQwTURjZ1RERXpPUzQ1TmpFc09EVXVORFU0SUV3eE5qY3VNVEV6TERZNUxqYzRNaUJNTVRZM0xqRXhNeXd4T1M0eE9ERWdURGt4TGpneU9TdzJNaTQyTkRjZ1REa3hMamd5T1N3Mk1pNDJORGNnV2lJZ2FXUTlJa1pwYkd3dE1UUWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFk0TGpVME15d3hPUzR5TVRNZ1RERTJPQzQxTkRNc056QXVNRGd6SUV3eE5ERXVNakl4TERnMUxqZzFOeUJNTVRNMExqYzJNU3czTVM0Mk9Ea2dRekV6TXk0NE5URXNOamt1TmprMElERXpNUzR6TXpNc05qa3VPVFV4SURFeU9TNHhNemNzTnpJdU1qWXpJRU14TWpndU1EZ3lMRGN6TGpNM05DQXhNamN1TWpRMExEYzBMamd4T1NBeE1qWXVPREEzTERjMkxqSTRNaUJNTVRJd0xqTTBOaXc1Tnk0NU1Ea2dURGt6TGpBeU5Td3hNVE11TmpneklFdzVNeTR3TWpVc05qSXVPREV6SUV3eE5qZ3VOVFF6TERFNUxqSXhNeUlnYVdROUlrWnBiR3d0TVRVaUlHWnBiR3c5SWlOR1JrWkdSa1lpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk9UTXVNREkxTERFeE15NDRJRU01TXk0d01EVXNNVEV6TGpnZ09USXVPVGcwTERFeE15NDNPVFVnT1RJdU9UWTJMREV4TXk0M09EVWdRemt5TGprek1Td3hNVE11TnpZMElEa3lMamt3T0N3eE1UTXVOekkxSURreUxqa3dPQ3d4TVRNdU5qZzBJRXc1TWk0NU1EZ3NOakl1T0RFeklFTTVNaTQ1TURnc05qSXVOemN4SURreUxqa3pNU3cyTWk0M016TWdPVEl1T1RZMkxEWXlMamN4TWlCTU1UWTRMalE0TkN3eE9TNHhNVElnUXpFMk9DNDFNaXd4T1M0d09TQXhOamd1TlRZMUxERTVMakE1SURFMk9DNDJNREVzTVRrdU1URXlJRU14TmpndU5qTTNMREU1TGpFek1pQXhOamd1TmpZc01Ua3VNVGN4SURFMk9DNDJOaXd4T1M0eU1USWdUREUyT0M0Mk5pdzNNQzR3T0RNZ1F6RTJPQzQyTml3M01DNHhNalVnTVRZNExqWXpOeXczTUM0eE5qUWdNVFk0TGpZd01TdzNNQzR4T0RRZ1RERTBNUzR5T0N3NE5TNDVOVGdnUXpFME1TNHlOVEVzT0RVdU9UYzFJREUwTVM0eU1UY3NPRFV1T1RjNUlERTBNUzR4T0RZc09EVXVPVFk0SUVNeE5ERXVNVFUwTERnMUxqazFPQ0F4TkRFdU1USTVMRGcxTGprek5pQXhOREV1TVRFMUxEZzFMamt3TmlCTU1UTTBMalkxTlN3M01TNDNNemdnUXpFek5DNHlPQ3czTUM0NU1UVWdNVE16TGpVNU15dzNNQzQwTmpNZ01UTXlMamN5TERjd0xqUTJNeUJETVRNeExqWXpNaXczTUM0ME5qTWdNVE13TGpNMU55dzNNUzR4TkRnZ01USTVMakl5TVN3M01pNHpORFFnUXpFeU9DNHhPRFlzTnpNdU5ETXpJREV5Tnk0ek5EY3NOelF1T0RneElERXlOaTQ1TVRrc056WXVNekUxSUV3eE1qQXVORFU0TERrM0xqazBNeUJETVRJd0xqUTFMRGszTGprM01pQXhNakF1TkRNeExEazNMams1TmlBeE1qQXVOREExTERrNExqQXhJRXc1TXk0d09ETXNNVEV6TGpjNE5TQkRPVE11TURZMUxERXhNeTQzT1RVZ09UTXVNRFExTERFeE15NDRJRGt6TGpBeU5Td3hNVE11T0NCTU9UTXVNREkxTERFeE15NDRJRm9nVFRrekxqRTBNaXcyTWk0NE9ERWdURGt6TGpFME1pd3hNVE11TkRneElFd3hNakF1TWpRNExEazNMamd6TWlCTU1USTJMalk1TlN3M05pNHlORGdnUXpFeU55NHhOQ3czTkM0M05UZ2dNVEkzTGprM055dzNNeTR6TVRVZ01USTVMakExTWl3M01pNHhPRE1nUXpFek1DNHlNekVzTnpBdU9UUXlJREV6TVM0MU5qZ3NOekF1TWpJNUlERXpNaTQzTWl3M01DNHlNamtnUXpFek15NDJPRGtzTnpBdU1qSTVJREV6TkM0ME5USXNOekF1TnpNeElERXpOQzQ0Tmpjc056RXVOalF4SUV3eE5ERXVNamMwTERnMUxqWTVNaUJNTVRZNExqUXlOaXczTUM0d01UWWdUREUyT0M0ME1qWXNNVGt1TkRFMUlFdzVNeTR4TkRJc05qSXVPRGd4SUV3NU15NHhORElzTmpJdU9EZ3hJRm9pSUdsa1BTSkdhV3hzTFRFMklpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTJPUzQ0TERjd0xqQTRNeUJNTVRReUxqUTNPQ3c0TlM0NE5UY2dUREV6Tmk0d01UZ3NOekV1TmpnNUlFTXhNelV1TVRBNExEWTVMalk1TkNBeE16SXVOVGtzTmprdU9UVXhJREV6TUM0ek9UTXNOekl1TWpZeklFTXhNamt1TXpNNUxEY3pMak0zTkNBeE1qZ3VOU3czTkM0NE1Ua2dNVEk0TGpBMk5DdzNOaTR5T0RJZ1RERXlNUzQyTURNc09UY3VPVEE1SUV3NU5DNHlPRElzTVRFekxqWTRNeUJNT1RRdU1qZ3lMRFl5TGpneE15Qk1NVFk1TGpnc01Ua3VNakV6SUV3eE5qa3VPQ3czTUM0d09ETWdXaUlnYVdROUlrWnBiR3d0TVRjaUlHWnBiR3c5SWlOR1FVWkJSa0VpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk9UUXVNamd5TERFeE15NDVNVGNnUXprMExqSTBNU3d4TVRNdU9URTNJRGswTGpJd01Td3hNVE11T1RBM0lEazBMakUyTlN3eE1UTXVPRGcySUVNNU5DNHdPVE1zTVRFekxqZzBOU0E1TkM0d05EZ3NNVEV6TGpjMk55QTVOQzR3TkRnc01URXpMalk0TkNCTU9UUXVNRFE0TERZeUxqZ3hNeUJET1RRdU1EUTRMRFl5TGpjeklEazBMakE1TXl3Mk1pNDJOVElnT1RRdU1UWTFMRFl5TGpZeE1TQk1NVFk1TGpZNE15d3hPUzR3TVNCRE1UWTVMamMxTlN3eE9DNDVOamtnTVRZNUxqZzBOQ3d4T0M0NU5qa2dNVFk1TGpreE55d3hPUzR3TVNCRE1UWTVMams0T1N3eE9TNHdOVElnTVRjd0xqQXpNeXd4T1M0eE1qa2dNVGN3TGpBek15d3hPUzR5TVRJZ1RERTNNQzR3TXpNc056QXVNRGd6SUVNeE56QXVNRE16TERjd0xqRTJOaUF4TmprdU9UZzVMRGN3TGpJME5DQXhOamt1T1RFM0xEY3dMakk0TlNCTU1UUXlMalU1TlN3NE5pNHdOaUJETVRReUxqVXpPQ3c0Tmk0d09USWdNVFF5TGpRMk9TdzROaTR4SURFME1pNDBNRGNzT0RZdU1EZ2dRekUwTWk0ek5EUXNPRFl1TURZZ01UUXlMakk1TXl3NE5pNHdNVFFnTVRReUxqSTJOaXc0TlM0NU5UUWdUREV6TlM0NE1EVXNOekV1TnpnMklFTXhNelV1TkRRMUxEY3dMams1TnlBeE16UXVPREV6TERjd0xqVTRJREV6TXk0NU56Y3NOekF1TlRnZ1F6RXpNaTQ1TWpFc056QXVOVGdnTVRNeExqWTNOaXczTVM0eU5USWdNVE13TGpVMk1pdzNNaTQwTWpRZ1F6RXlPUzQxTkN3M015NDFNREVnTVRJNExqY3hNU3czTkM0NU16RWdNVEk0TGpJNE55dzNOaTR6TkRnZ1RERXlNUzQ0TWpjc09UY3VPVGMySUVNeE1qRXVPREVzT1RndU1ETTBJREV5TVM0M056RXNPVGd1TURneUlERXlNUzQzTWl3NU9DNHhNVElnVERrMExqTTVPQ3d4TVRNdU9EZzJJRU01TkM0ek5qSXNNVEV6TGprd055QTVOQzR6TWpJc01URXpMamt4TnlBNU5DNHlPRElzTVRFekxqa3hOeUJNT1RRdU1qZ3lMREV4TXk0NU1UY2dXaUJOT1RRdU5URTFMRFl5TGprME9DQk1PVFF1TlRFMUxERXhNeTR5TnprZ1RERXlNUzQwTURZc09UY3VOelUwSUV3eE1qY3VPRFFzTnpZdU1qRTFJRU14TWpndU1qa3NOelF1TnpBNElERXlPUzR4TXpjc056TXVNalEzSURFek1DNHlNalFzTnpJdU1UQXpJRU14TXpFdU5ESTFMRGN3TGpnek9DQXhNekl1TnprekxEY3dMakV4TWlBeE16TXVPVGMzTERjd0xqRXhNaUJETVRNMExqazVOU3czTUM0eE1USWdNVE0xTGpjNU5TdzNNQzQyTXpnZ01UTTJMakl6TERjeExqVTVNaUJNTVRReUxqVTROQ3c0TlM0MU1qWWdUREUyT1M0MU5qWXNOamt1T1RRNElFd3hOamt1TlRZMkxERTVMall4TnlCTU9UUXVOVEUxTERZeUxqazBPQ0JNT1RRdU5URTFMRFl5TGprME9DQmFJaUJwWkQwaVJtbHNiQzB4T0NJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE1Ea3VPRGswTERreUxqazBNeUJNTVRBNUxqZzVOQ3c1TWk0NU5ETWdRekV3T0M0eE1pdzVNaTQ1TkRNZ01UQTJMalkxTXl3NU1pNHlNVGdnTVRBMUxqWTFMRGt3TGpneU15QkRNVEExTGpVNE15dzVNQzQzTXpFZ01UQTFMalU1TXl3NU1DNDJNU0F4TURVdU5qY3pMRGt3TGpVeU9TQkRNVEExTGpjMU15dzVNQzQwTkRnZ01UQTFMamc0TERrd0xqUTBJREV3TlM0NU56UXNPVEF1TlRBMklFTXhNRFl1TnpVMExEa3hMakExTXlBeE1EY3VOamM1TERreExqTXpNeUF4TURndU56STBMRGt4TGpNek15QkRNVEV3TGpBME55dzVNUzR6TXpNZ01URXhMalEzT0N3NU1DNDRPVFFnTVRFeUxqazRMRGt3TGpBeU55QkRNVEU0TGpJNU1TdzROaTQ1TmlBeE1qSXVOakV4TERjNUxqVXdPU0F4TWpJdU5qRXhMRGN6TGpReE5pQkRNVEl5TGpZeE1TdzNNUzQwT0RrZ01USXlMakUyT1N3Mk9TNDROVFlnTVRJeExqTXpNeXcyT0M0Mk9USWdRekV5TVM0eU5qWXNOamd1TmlBeE1qRXVNamMyTERZNExqUTNNeUF4TWpFdU16VTJMRFk0TGpNNU1pQkRNVEl4TGpRek5pdzJPQzR6TVRFZ01USXhMalUyTXl3Mk9DNHlPVGtnTVRJeExqWTFOaXcyT0M0ek5qVWdRekV5TXk0ek1qY3NOamt1TlRNM0lERXlOQzR5TkRjc056RXVOelEySURFeU5DNHlORGNzTnpRdU5UZzBJRU14TWpRdU1qUTNMRGd3TGpneU5pQXhNVGt1T0RJeExEZzRMalEwTnlBeE1UUXVNemd5TERreExqVTROeUJETVRFeUxqZ3dPQ3c1TWk0ME9UVWdNVEV4TGpJNU9DdzVNaTQ1TkRNZ01UQTVMamc1TkN3NU1pNDVORE1nVERFd09TNDRPVFFzT1RJdU9UUXpJRm9nVFRFd05pNDVNalVzT1RFdU5EQXhJRU14TURjdU56TTRMRGt5TGpBMU1pQXhNRGd1TnpRMUxEa3lMakkzT0NBeE1Ea3VPRGt6TERreUxqSTNPQ0JNTVRBNUxqZzVOQ3c1TWk0eU56Z2dRekV4TVM0eU1UVXNPVEl1TWpjNElERXhNaTQyTkRjc09URXVPVFV4SURFeE5DNHhORGdzT1RFdU1EZzBJRU14TVRrdU5EVTVMRGc0TGpBeE55QXhNak11Tnpnc09EQXVOakl4SURFeU15NDNPQ3czTkM0MU1qZ2dRekV5TXk0M09DdzNNaTQxTkRrZ01USXpMak14Tnl3M01DNDVNamtnTVRJeUxqUTFOQ3cyT1M0M05qY2dRekV5TWk0NE5qVXNOekF1T0RBeUlERXlNeTR3Tnprc056SXVNRFF5SURFeU15NHdOemtzTnpNdU5EQXlJRU14TWpNdU1EYzVMRGM1TGpZME5TQXhNVGd1TmpVekxEZzNMakk0TlNBeE1UTXVNakUwTERrd0xqUXlOU0JETVRFeExqWTBMRGt4TGpNek5DQXhNVEF1TVRNc09URXVOelF5SURFd09DNDNNalFzT1RFdU56UXlJRU14TURndU1EZ3pMRGt4TGpjME1pQXhNRGN1TkRneExEa3hMalU1TXlBeE1EWXVPVEkxTERreExqUXdNU0JNTVRBMkxqa3lOU3c1TVM0ME1ERWdXaUlnYVdROUlrWnBiR3d0TVRraUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URXpMakE1Tnl3NU1DNHlNeUJETVRFNExqUTRNU3c0Tnk0eE1qSWdNVEl5TGpnME5TdzNPUzQxT1RRZ01USXlMamcwTlN3M015NDBNVFlnUXpFeU1pNDRORFVzTnpFdU16WTFJREV5TWk0ek5qSXNOamt1TnpJMElERXlNUzQxTWpJc05qZ3VOVFUySUVNeE1Ua3VOek00TERZM0xqTXdOQ0F4TVRjdU1UUTRMRFkzTGpNMk1pQXhNVFF1TWpZMUxEWTVMakF5TmlCRE1UQTRMamc0TVN3M01pNHhNelFnTVRBMExqVXhOeXczT1M0Mk5qSWdNVEEwTGpVeE55dzROUzQ0TkNCRE1UQTBMalV4Tnl3NE55NDRPVEVnTVRBMUxEZzVMalV6TWlBeE1EVXVPRFFzT1RBdU55QkRNVEEzTGpZeU5DdzVNUzQ1TlRJZ01URXdMakl4TkN3NU1TNDRPVFFnTVRFekxqQTVOeXc1TUM0eU15SWdhV1E5SWtacGJHd3RNakFpSUdacGJHdzlJaU5HUVVaQlJrRWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRBNExqY3lOQ3c1TVM0Mk1UUWdUREV3T0M0M01qUXNPVEV1TmpFMElFTXhNRGN1TlRneUxEa3hMall4TkNBeE1EWXVOVFkyTERreExqUXdNU0F4TURVdU56QTFMRGt3TGpjNU55QkRNVEExTGpZNE5DdzVNQzQzT0RNZ01UQTFMalkyTlN3NU1DNDRNVEVnTVRBMUxqWTFMRGt3TGpjNUlFTXhNRFF1TnpVMkxEZzVMalUwTmlBeE1EUXVNamd6TERnM0xqZzBNaUF4TURRdU1qZ3pMRGcxTGpneE55QkRNVEEwTGpJNE15dzNPUzQxTnpVZ01UQTRMamN3T1N3M01TNDVOVE1nTVRFMExqRTBPQ3cyT0M0NE1USWdRekV4TlM0M01qSXNOamN1T1RBMElERXhOeTR5TXpJc05qY3VORFE1SURFeE9DNDJNemdzTmpjdU5EUTVJRU14TVRrdU56Z3NOamN1TkRRNUlERXlNQzQzT1RZc05qY3VOelU0SURFeU1TNDJOVFlzTmpndU16WXlJRU14TWpFdU5qYzRMRFk0TGpNM055QXhNakV1TmprM0xEWTRMak01TnlBeE1qRXVOekV5TERZNExqUXhPQ0JETVRJeUxqWXdOaXcyT1M0Mk5qSWdNVEl6TGpBM09TdzNNUzR6T1NBeE1qTXVNRGM1TERjekxqUXhOU0JETVRJekxqQTNPU3czT1M0Mk5UZ2dNVEU0TGpZMU15dzROeTR4T1RnZ01URXpMakl4TkN3NU1DNHpNemdnUXpFeE1TNDJOQ3c1TVM0eU5EY2dNVEV3TGpFekxEa3hMall4TkNBeE1EZ3VOekkwTERreExqWXhOQ0JNTVRBNExqY3lOQ3c1TVM0Mk1UUWdXaUJOTVRBMkxqQXdOaXc1TUM0MU1EVWdRekV3Tmk0M09DdzVNUzR3TXpjZ01UQTNMalk1TkN3NU1TNHlPREVnTVRBNExqY3lOQ3c1TVM0eU9ERWdRekV4TUM0d05EY3NPVEV1TWpneElERXhNUzQwTnpnc09UQXVPRFk0SURFeE1pNDVPQ3c1TUM0d01ERWdRekV4T0M0eU9URXNPRFl1T1RNMUlERXlNaTQyTVRFc056a3VORGsySURFeU1pNDJNVEVzTnpNdU5EQXpJRU14TWpJdU5qRXhMRGN4TGpRNU5DQXhNakl1TVRjM0xEWTVMamc0SURFeU1TNHpOVFlzTmpndU56RTRJRU14TWpBdU5UZ3lMRFk0TGpFNE5TQXhNVGt1TmpZNExEWTNMamt4T1NBeE1UZ3VOak00TERZM0xqa3hPU0JETVRFM0xqTXhOU3cyTnk0NU1Ua2dNVEUxTGpnNE15dzJPQzR6TmlBeE1UUXVNemd5TERZNUxqSXlOeUJETVRBNUxqQTNNU3czTWk0eU9UTWdNVEEwTGpjMU1TdzNPUzQzTXpNZ01UQTBMamMxTVN3NE5TNDRNallnUXpFd05DNDNOVEVzT0RjdU56TTFJREV3TlM0eE9EVXNPRGt1TXpReklERXdOaTR3TURZc09UQXVOVEExSUV3eE1EWXVNREEyTERrd0xqVXdOU0JhSWlCcFpEMGlSbWxzYkMweU1TSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhORGt1TXpFNExEY3VNall5SUV3eE16a3VNek0wTERFMkxqRTBJRXd4TlRVdU1qSTNMREkzTGpFM01TQk1NVFl3TGpneE5pd3lNUzR3TlRrZ1RERTBPUzR6TVRnc055NHlOaklpSUdsa1BTSkdhV3hzTFRJeUlpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTJPUzQyTnpZc01UTXVPRFFnVERFMU9TNDVNamdzTVRrdU5EWTNJRU14TlRZdU1qZzJMREl4TGpVM0lERTFNQzQwTERJeExqVTRJREUwTmk0M09ERXNNVGt1TkRreElFTXhORE11TVRZeExERTNMalF3TWlBeE5ETXVNVGdzTVRRdU1EQXpJREUwTmk0NE1qSXNNVEV1T1NCTU1UVTJMak14Tnl3MkxqSTVNaUJNTVRRNUxqVTRPQ3d5TGpRd055Qk1OamN1TnpVeUxEUTVMalEzT0NCTU1URXpMalkzTlN3M05TNDVPVElnVERFeE5pNDNOVFlzTnpRdU1qRXpJRU14TVRjdU16ZzNMRGN6TGpnME9DQXhNVGN1TmpJMUxEY3pMak14TlNBeE1UY3VNemMwTERjeUxqZ3lNeUJETVRFMUxqQXhOeXcyT0M0eE9URWdNVEUwTGpjNE1TdzJNeTR5TnpjZ01URTJMalk1TVN3MU9DNDFOakVnUXpFeU1pNHpNamtzTkRRdU5qUXhJREUwTVM0eUxETXpMamMwTmlBeE5qVXVNekE1TERNd0xqUTVNU0JETVRjekxqUTNPQ3d5T1M0ek9EZ2dNVGd4TGprNE9Td3lPUzQxTWpRZ01Ua3dMakF4TXl3ek1DNDRPRFVnUXpFNU1DNDROalVzTXpFdU1ETWdNVGt4TGpjNE9Td3pNQzQ0T1RNZ01Ua3lMalF5TERNd0xqVXlPQ0JNTVRrMUxqVXdNU3d5T0M0M05TQk1NVFk1TGpZM05pd3hNeTQ0TkNJZ2FXUTlJa1pwYkd3dE1qTWlJR1pwYkd3OUlpTkdRVVpCUmtFaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEV6TGpZM05TdzNOaTQwTlRrZ1F6RXhNeTQxT1RRc056WXVORFU1SURFeE15NDFNVFFzTnpZdU5ETTRJREV4TXk0ME5ESXNOell1TXprM0lFdzJOeTQxTVRnc05Ea3VPRGd5SUVNMk55NHpOelFzTkRrdU56azVJRFkzTGpJNE5DdzBPUzQyTkRVZ05qY3VNamcxTERRNUxqUTNPQ0JETmpjdU1qZzFMRFE1TGpNeE1TQTJOeTR6TnpRc05Ea3VNVFUzSURZM0xqVXhPU3cwT1M0d056TWdUREUwT1M0ek5UVXNNaTR3TURJZ1F6RTBPUzQwT1Rrc01TNDVNVGtnTVRRNUxqWTNOeXd4TGpreE9TQXhORGt1T0RJeExESXVNREF5SUV3eE5UWXVOVFVzTlM0NE9EY2dRekUxTmk0M056UXNOaTR3TVRjZ01UVTJMamcxTERZdU16QXlJREUxTmk0M01qSXNOaTQxTWpZZ1F6RTFOaTQxT1RJc05pNDNORGtnTVRVMkxqTXdOeXcyTGpneU5pQXhOVFl1TURnekxEWXVOamsySUV3eE5Ea3VOVGczTERJdU9UUTJJRXcyT0M0Mk9EY3NORGt1TkRjNUlFd3hNVE11TmpjMUxEYzFMalExTWlCTU1URTJMalV5TXl3M015NDRNRGdnUXpFeE5pNDNNVFVzTnpNdU5qazNJREV4Tnk0eE5ETXNOek11TXprNUlERXhOaTQ1TlRnc056TXVNRE0xSUVNeE1UUXVOVFF5TERZNExqSTROeUF4TVRRdU15dzJNeTR5TWpFZ01URTJMakkxT0N3MU9DNHpPRFVnUXpFeE9TNHdOalFzTlRFdU5EVTRJREV5TlM0eE5ETXNORFV1TVRReklERXpNeTQ0TkN3ME1DNHhNaklnUXpFME1pNDBPVGNzTXpVdU1USTBJREUxTXk0ek5UZ3NNekV1TmpNeklERTJOUzR5TkRjc016QXVNREk0SUVNeE56TXVORFExTERJNExqa3lNU0F4T0RJdU1ETTNMREk1TGpBMU9DQXhPVEF1TURreExETXdMalF5TlNCRE1Ua3dMamd6TERNd0xqVTFJREU1TVM0Mk5USXNNekF1TkRNeUlERTVNaTR4T0RZc016QXVNVEkwSUV3eE9UUXVOVFkzTERJNExqYzFJRXd4TmprdU5EUXlMREUwTGpJME5DQkRNVFk1TGpJeE9Td3hOQzR4TVRVZ01UWTVMakUwTWl3eE15NDRNamtnTVRZNUxqSTNNU3d4TXk0Mk1EWWdRekUyT1M0MExERXpMak00TWlBeE5qa3VOamcxTERFekxqTXdOaUF4TmprdU9UQTVMREV6TGpRek5TQk1NVGsxTGpjek5Dd3lPQzR6TkRVZ1F6RTVOUzQ0Tnprc01qZ3VOREk0SURFNU5TNDVOamdzTWpndU5UZ3pJREU1TlM0NU5qZ3NNamd1TnpVZ1F6RTVOUzQ1Tmpnc01qZ3VPVEUySURFNU5TNDROemtzTWprdU1EY3hJREU1TlM0M016UXNNamt1TVRVMElFd3hPVEl1TmpVekxETXdMamt6TXlCRE1Ua3hMamt6TWl3ek1TNHpOU0F4T1RBdU9Ea3NNekV1TlRBNElERTRPUzQ1TXpVc016RXVNelEySUVNeE9ERXVPVGN5TERJNUxqazVOU0F4TnpNdU5EYzRMREk1TGpnMklERTJOUzR6TnpJc016QXVPVFUwSUVNeE5UTXVOakF5TERNeUxqVTBNeUF4TkRJdU9EWXNNelV1T1RreklERXpOQzR6TURjc05EQXVPVE14SUVNeE1qVXVOemt6TERRMUxqZzBOeUF4TVRrdU9EVXhMRFV5TGpBd05DQXhNVGN1TVRJMExEVTRMamN6TmlCRE1URTFMakkzTERZekxqTXhOQ0F4TVRVdU5UQXhMRFk0TGpFeE1pQXhNVGN1Tnprc056SXVOakV4SUVNeE1UZ3VNVFlzTnpNdU16TTJJREV4Tnk0NE5EVXNOelF1TVRJMElERXhOaTQ1T1N3M05DNDJNVGNnVERFeE15NDVNRGtzTnpZdU16azNJRU14TVRNdU9ETTJMRGMyTGpRek9DQXhNVE11TnpVMkxEYzJMalExT1NBeE1UTXVOamMxTERjMkxqUTFPU0lnYVdROUlrWnBiR3d0TWpRaUlHWnBiR3c5SWlNME5UVkJOalFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UVXpMak14Tml3eU1TNHlOemtnUXpFMU1DNDVNRE1zTWpFdU1qYzVJREUwT0M0ME9UVXNNakF1TnpVeElERTBOaTQyTmpRc01Ua3VOamt6SUVNeE5EUXVPRFEyTERFNExqWTBOQ0F4TkRNdU9EUTBMREUzTGpJek1pQXhORE11T0RRMExERTFMamN4T0NCRE1UUXpMamcwTkN3eE5DNHhPVEVnTVRRMExqZzJMREV5TGpjMk15QXhORFl1TnpBMUxERXhMalk1T0NCTU1UVTJMakU1T0N3MkxqQTVNU0JETVRVMkxqTXdPU3cyTGpBeU5TQXhOVFl1TkRVeUxEWXVNRFl5SURFMU5pNDFNVGdzTmk0eE56TWdRekUxTmk0MU9ETXNOaTR5T0RRZ01UVTJMalUwTnl3MkxqUXlOeUF4TlRZdU5ETTJMRFl1TkRreklFd3hORFl1T1RRc01USXVNVEF5SUVNeE5EVXVNalEwTERFekxqQTRNU0F4TkRRdU16RXlMREUwTGpNMk5TQXhORFF1TXpFeUxERTFMamN4T0NCRE1UUTBMak14TWl3eE55NHdOVGdnTVRRMUxqSXpMREU0TGpNeU5pQXhORFl1T0RrM0xERTVMakk0T1NCRE1UVXdMalEwTml3eU1TNHpNemdnTVRVMkxqSTBMREl4TGpNeU55QXhOVGt1T0RFeExERTVMakkyTlNCTU1UWTVMalUxT1N3eE15NDJNemNnUXpFMk9TNDJOeXd4TXk0MU56TWdNVFk1TGpneE15d3hNeTQyTVRFZ01UWTVMamczT0N3eE15NDNNak1nUXpFMk9TNDVORE1zTVRNdU9ETTBJREUyT1M0NU1EUXNNVE11T1RjM0lERTJPUzQzT1RNc01UUXVNRFF5SUV3eE5qQXVNRFExTERFNUxqWTNJRU14TlRndU1UZzNMREl3TGpjME1pQXhOVFV1TnpRNUxESXhMakkzT1NBeE5UTXVNekUyTERJeExqSTNPU0lnYVdROUlrWnBiR3d0TWpVaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URXpMalkzTlN3M05TNDVPVElnVERZM0xqYzJNaXcwT1M0ME9EUWlJR2xrUFNKR2FXeHNMVEkySWlCbWFXeHNQU0lqTkRVMVFUWTBJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFeE15NDJOelVzTnpZdU16UXlJRU14TVRNdU5qRTFMRGMyTGpNME1pQXhNVE11TlRVMUxEYzJMak15TnlBeE1UTXVOU3czTmk0eU9UVWdURFkzTGpVNE55dzBPUzQzT0RjZ1F6WTNMalF4T1N3ME9TNDJPU0EyTnk0ek5qSXNORGt1TkRjMklEWTNMalExT1N3ME9TNHpNRGtnUXpZM0xqVTFOaXcwT1M0eE5ERWdOamN1Tnpjc05Ea3VNRGd6SURZM0xqa3pOeXcwT1M0eE9DQk1NVEV6TGpnMUxEYzFMalk0T0NCRE1URTBMakF4T0N3M05TNDNPRFVnTVRFMExqQTNOU3czTmlBeE1UTXVPVGM0TERjMkxqRTJOeUJETVRFekxqa3hOQ3czTmk0eU56a2dNVEV6TGpjNU5pdzNOaTR6TkRJZ01URXpMalkzTlN3M05pNHpORElpSUdsa1BTSkdhV3hzTFRJM0lpQm1hV3hzUFNJak5EVTFRVFkwSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUWTNMamMyTWl3ME9TNDBPRFFnVERZM0xqYzJNaXd4TURNdU5EZzFJRU0yTnk0M05qSXNNVEEwTGpVM05TQTJPQzQxTXpJc01UQTFMamt3TXlBMk9TNDBPRElzTVRBMkxqUTFNaUJNTVRFeExqazFOU3d4TXpBdU9UY3pJRU14TVRJdU9UQTFMREV6TVM0MU1qSWdNVEV6TGpZM05Td3hNekV1TURneklERXhNeTQyTnpVc01USTVMams1TXlCTU1URXpMalkzTlN3M05TNDVPVElpSUdsa1BTSkdhV3hzTFRJNElpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURXhNaTQzTWpjc01UTXhMalUyTVNCRE1URXlMalF6TERFek1TNDFOakVnTVRFeUxqRXdOeXd4TXpFdU5EWTJJREV4TVM0M09Dd3hNekV1TWpjMklFdzJPUzR6TURjc01UQTJMamMxTlNCRE5qZ3VNalEwTERFd05pNHhORElnTmpjdU5ERXlMREV3TkM0M01EVWdOamN1TkRFeUxERXdNeTQwT0RVZ1REWTNMalF4TWl3ME9TNDBPRFFnUXpZM0xqUXhNaXcwT1M0eU9TQTJOeTQxTmprc05Ea3VNVE0wSURZM0xqYzJNaXcwT1M0eE16UWdRelkzTGprMU5pdzBPUzR4TXpRZ05qZ3VNVEV6TERRNUxqSTVJRFk0TGpFeE15dzBPUzQwT0RRZ1REWTRMakV4TXl3eE1ETXVORGcxSUVNMk9DNHhNVE1zTVRBMExqUTBOU0EyT0M0NE1pd3hNRFV1TmpZMUlEWTVMalkxTnl3eE1EWXVNVFE0SUV3eE1USXVNVE1zTVRNd0xqWTNJRU14TVRJdU5EYzBMREV6TUM0NE5qZ2dNVEV5TGpjNU1Td3hNekF1T1RFeklERXhNeXd4TXpBdU56a3lJRU14TVRNdU1qQTJMREV6TUM0Mk56TWdNVEV6TGpNeU5Td3hNekF1TXpneElERXhNeTR6TWpVc01USTVMams1TXlCTU1URXpMak15TlN3M05TNDVPVElnUXpFeE15NHpNalVzTnpVdU56azRJREV4TXk0ME9ESXNOelV1TmpReElERXhNeTQyTnpVc056VXVOalF4SUVNeE1UTXVPRFk1TERjMUxqWTBNU0F4TVRRdU1ESTFMRGMxTGpjNU9DQXhNVFF1TURJMUxEYzFMams1TWlCTU1URTBMakF5TlN3eE1qa3VPVGt6SUVNeE1UUXVNREkxTERFek1DNDJORGdnTVRFekxqYzROaXd4TXpFdU1UUTNJREV4TXk0ek5Td3hNekV1TXprNUlFTXhNVE11TVRZeUxERXpNUzQxTURjZ01URXlMamsxTWl3eE16RXVOVFl4SURFeE1pNDNNamNzTVRNeExqVTJNU0lnYVdROUlrWnBiR3d0TWpraUlHWnBiR3c5SWlNME5UVkJOalFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URXlMamcyTERRd0xqVXhNaUJETVRFeUxqZzJMRFF3TGpVeE1pQXhNVEl1T0RZc05EQXVOVEV5SURFeE1pNDROVGtzTkRBdU5URXlJRU14TVRBdU5UUXhMRFF3TGpVeE1pQXhNRGd1TXpZc016a3VPVGtnTVRBMkxqY3hOeXd6T1M0d05ERWdRekV3TlM0d01USXNNemd1TURVM0lERXdOQzR3TnpRc016WXVOekkySURFd05DNHdOelFzTXpVdU1qa3lJRU14TURRdU1EYzBMRE16TGpnME55QXhNRFV1TURJMkxETXlMalV3TVNBeE1EWXVOelUwTERNeExqVXdOQ0JNTVRFNExqYzVOU3d5TkM0MU5URWdRekV5TUM0ME5qTXNNak11TlRnNUlERXlNaTQyTmprc01qTXVNRFU0SURFeU5TNHdNRGNzTWpNdU1EVTRJRU14TWpjdU16STFMREl6TGpBMU9DQXhNamt1TlRBMkxESXpMalU0TVNBeE16RXVNVFVzTWpRdU5UTWdRekV6TWk0NE5UUXNNalV1TlRFMElERXpNeTQzT1RNc01qWXVPRFExSURFek15NDNPVE1zTWpndU1qYzRJRU14TXpNdU56a3pMREk1TGpjeU5DQXhNekl1T0RReExETXhMakEyT1NBeE16RXVNVEV6TERNeUxqQTJOeUJNTVRFNUxqQTNNU3d6T1M0d01Ua2dRekV4Tnk0ME1ETXNNemt1T1RneUlERXhOUzR4T1Rjc05EQXVOVEV5SURFeE1pNDROaXcwTUM0MU1USWdUREV4TWk0NE5pdzBNQzQxTVRJZ1dpQk5NVEkxTGpBd055d3lNeTQzTlRrZ1F6RXlNaTQzT1N3eU15NDNOVGtnTVRJd0xqY3dPU3d5TkM0eU5UWWdNVEU1TGpFME5pd3lOUzR4TlRnZ1RERXdOeTR4TURRc016SXVNVEVnUXpFd05TNDJNRElzTXpJdU9UYzRJREV3TkM0M056UXNNelF1TVRBNElERXdOQzQzTnpRc016VXVNamt5SUVNeE1EUXVOemMwTERNMkxqUTJOU0F4TURVdU5UZzVMRE0zTGpVNE1TQXhNRGN1TURZM0xETTRMalF6TkNCRE1UQTRMall3TlN3ek9TNHpNak1nTVRFd0xqWTJNeXd6T1M0NE1USWdNVEV5TGpnMU9Td3pPUzQ0TVRJZ1RERXhNaTQ0Tml3ek9TNDRNVElnUXpFeE5TNHdOellzTXprdU9ERXlJREV4Tnk0eE5UZ3NNemt1TXpFMUlERXhPQzQzTWpFc016Z3VOREV6SUV3eE16QXVOell5TERNeExqUTJJRU14TXpJdU1qWTBMRE13TGpVNU15QXhNek11TURreUxESTVMalEyTXlBeE16TXVNRGt5TERJNExqSTNPQ0JETVRNekxqQTVNaXd5Tnk0eE1EWWdNVE15TGpJM09Dd3lOUzQ1T1NBeE16QXVPQ3d5TlM0eE16WWdRekV5T1M0eU5qRXNNalF1TWpRNElERXlOeTR5TURRc01qTXVOelU1SURFeU5TNHdNRGNzTWpNdU56VTVJRXd4TWpVdU1EQTNMREl6TGpjMU9TQmFJaUJwWkQwaVJtbHNiQzB6TUNJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE5qVXVOak1zTVRZdU1qRTVJRXd4TlRrdU9EazJMREU1TGpVeklFTXhOVFl1TnpJNUxESXhMak0xT0NBeE5URXVOakVzTWpFdU16WTNJREUwT0M0ME5qTXNNVGt1TlRVZ1F6RTBOUzR6TVRZc01UY3VOek16SURFME5TNHpNeklzTVRRdU56YzRJREUwT0M0ME9Ua3NNVEl1T1RRNUlFd3hOVFF1TWpNekxEa3VOak01SUV3eE5qVXVOak1zTVRZdU1qRTVJaUJwWkQwaVJtbHNiQzB6TVNJZ1ptbHNiRDBpSTBaQlJrRkdRU0krUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE5UUXVNak16TERFd0xqUTBPQ0JNTVRZMExqSXlPQ3d4Tmk0eU1Ua2dUREUxT1M0MU5EWXNNVGd1T1RJeklFTXhOVGd1TVRFeUxERTVMamMxSURFMU5pNHhPVFFzTWpBdU1qQTJJREUxTkM0eE5EY3NNakF1TWpBMklFTXhOVEl1TVRFNExESXdMakl3TmlBeE5UQXVNakkwTERFNUxqYzFOeUF4TkRndU9ERTBMREU0TGprME15QkRNVFEzTGpVeU5Dd3hPQzR4T1RrZ01UUTJMamd4TkN3eE55NHlORGtnTVRRMkxqZ3hOQ3d4Tmk0eU5qa2dRekUwTmk0NE1UUXNNVFV1TWpjNElERTBOeTQxTXpjc01UUXVNekUwSURFME9DNDROU3d4TXk0MU5UWWdUREUxTkM0eU16TXNNVEF1TkRRNElFMHhOVFF1TWpNekxEa3VOak01SUV3eE5EZ3VORGs1TERFeUxqazBPU0JETVRRMUxqTXpNaXd4TkM0M056Z2dNVFExTGpNeE5pd3hOeTQzTXpNZ01UUTRMalEyTXl3eE9TNDFOU0JETVRVd0xqQXpNU3d5TUM0ME5UVWdNVFV5TGpBNE5pd3lNQzQ1TURjZ01UVTBMakUwTnl3eU1DNDVNRGNnUXpFMU5pNHlNalFzTWpBdU9UQTNJREUxT0M0ek1EWXNNakF1TkRRM0lERTFPUzQ0T1RZc01Ua3VOVE1nVERFMk5TNDJNeXd4Tmk0eU1Ua2dUREUxTkM0eU16TXNPUzQyTXpraUlHbGtQU0pHYVd4c0xUTXlJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUwTlM0ME5EVXNOekl1TmpZM0lFd3hORFV1TkRRMUxEY3lMalkyTnlCRE1UUXpMalkzTWl3M01pNDJOamNnTVRReUxqSXdOQ3czTVM0NE1UY2dNVFF4TGpJd01pdzNNQzQwTWpJZ1F6RTBNUzR4TXpVc056QXVNek1nTVRReExqRTBOU3czTUM0eE5EY2dNVFF4TGpJeU5TdzNNQzR3TmpZZ1F6RTBNUzR6TURVc05qa3VPVGcxSURFME1TNDBNeklzTmprdU9UUTJJREUwTVM0MU1qVXNOekF1TURFeElFTXhOREl1TXpBMkxEY3dMalUxT1NBeE5ETXVNak14TERjd0xqZ3lNeUF4TkRRdU1qYzJMRGN3TGpneU1pQkRNVFExTGpVNU9DdzNNQzQ0TWpJZ01UUTNMakF6TERjd0xqTTNOaUF4TkRndU5UTXlMRFk1TGpVd09TQkRNVFV6TGpnME1pdzJOaTQwTkRNZ01UVTRMakUyTXl3MU9DNDVPRGNnTVRVNExqRTJNeXcxTWk0NE9UUWdRekUxT0M0eE5qTXNOVEF1T1RZM0lERTFOeTQzTWpFc05Ea3VNek15SURFMU5pNDRPRFFzTkRndU1UWTRJRU14TlRZdU9ERTRMRFE0TGpBM05pQXhOVFl1T0RJNExEUTNMamswT0NBeE5UWXVPVEE0TERRM0xqZzJOeUJETVRVMkxqazRPQ3cwTnk0M09EWWdNVFUzTGpFeE5DdzBOeTQzTnpRZ01UVTNMakl3T0N3ME55NDROQ0JETVRVNExqZzNPQ3cwT1M0d01USWdNVFU1TGpjNU9DdzFNUzR5TWlBeE5Ua3VOems0TERVMExqQTFPU0JETVRVNUxqYzVPQ3cyTUM0ek1ERWdNVFUxTGpNM015dzJPQzR3TkRZZ01UUTVMamt6TXl3M01TNHhPRFlnUXpFME9DNHpOaXczTWk0d09UUWdNVFEyTGpnMUxEY3lMalkyTnlBeE5EVXVORFExTERjeUxqWTJOeUJNTVRRMUxqUTBOU3czTWk0Mk5qY2dXaUJOTVRReUxqUTNOaXczTVNCRE1UUXpMakk1TERjeExqWTFNU0F4TkRRdU1qazJMRGN5TGpBd01pQXhORFV1TkRRMUxEY3lMakF3TWlCRE1UUTJMamMyTnl3M01pNHdNRElnTVRRNExqRTVPQ3czTVM0MU5TQXhORGt1Tnl3M01DNDJPRElnUXpFMU5TNHdNU3cyTnk0Mk1UY2dNVFU1TGpNek1TdzJNQzR4TlRrZ01UVTVMak16TVN3MU5DNHdOalVnUXpFMU9TNHpNekVzTlRJdU1EZzFJREUxT0M0NE5qZ3NOVEF1TkRNMUlERTFPQzR3TURZc05Ea3VNamN5SUVNeE5UZ3VOREUzTERVd0xqTXdOeUF4TlRndU5qTXNOVEV1TlRNeUlERTFPQzQyTXl3MU1pNDRPVElnUXpFMU9DNDJNeXcxT1M0eE16UWdNVFUwTGpJd05TdzJOaTQzTmpjZ01UUTRMamMyTlN3Mk9TNDVNRGNnUXpFME55NHhPVElzTnpBdU9ERTJJREUwTlM0Mk9ERXNOekV1TWpneklERTBOQzR5TnpZc056RXVNamd6SUVNeE5ETXVOak0wTERjeExqSTRNeUF4TkRNdU1ETXpMRGN4TGpFNU1pQXhOREl1TkRjMkxEY3hJRXd4TkRJdU5EYzJMRGN4SUZvaUlHbGtQU0pHYVd4c0xUTXpJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUwT0M0Mk5EZ3NOamt1TnpBMElFTXhOVFF1TURNeUxEWTJMalU1TmlBeE5UZ3VNemsyTERVNUxqQTJPQ0F4TlRndU16azJMRFV5TGpnNU1TQkRNVFU0TGpNNU5pdzFNQzQ0TXprZ01UVTNMamt4TXl3ME9TNHhPVGdnTVRVM0xqQTNOQ3cwT0M0d015QkRNVFUxTGpJNE9TdzBOaTQzTnpnZ01UVXlMalk1T1N3ME5pNDRNellnTVRRNUxqZ3hOaXcwT0M0MU1ERWdRekUwTkM0ME16TXNOVEV1TmpBNUlERTBNQzR3Tmpnc05Ua3VNVE0zSURFME1DNHdOamdzTmpVdU16RTBJRU14TkRBdU1EWTRMRFkzTGpNMk5TQXhOREF1TlRVeUxEWTVMakF3TmlBeE5ERXVNemt4TERjd0xqRTNOQ0JETVRRekxqRTNOaXczTVM0ME1qY2dNVFExTGpjMk5TdzNNUzR6TmprZ01UUTRMalkwT0N3Mk9TNDNNRFFpSUdsa1BTSkdhV3hzTFRNMElpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTBOQzR5TnpZc056RXVNamMySUV3eE5EUXVNamMyTERjeExqSTNOaUJETVRRekxqRXpNeXczTVM0eU56WWdNVFF5TGpFeE9DdzNNQzQ1TmprZ01UUXhMakkxTnl3M01DNHpOalVnUXpFME1TNHlNellzTnpBdU16VXhJREUwTVM0eU1UY3NOekF1TXpNeUlERTBNUzR5TURJc056QXVNekV4SUVNeE5EQXVNekEzTERZNUxqQTJOeUF4TXprdU9ETTFMRFkzTGpNek9TQXhNemt1T0RNMUxEWTFMak14TkNCRE1UTTVMamd6TlN3MU9TNHdOek1nTVRRMExqSTJMRFV4TGpRek9TQXhORGt1Tnl3ME9DNHlPVGdnUXpFMU1TNHlOek1zTkRjdU16a2dNVFV5TGpjNE5DdzBOaTQ1TWprZ01UVTBMakU0T1N3ME5pNDVNamtnUXpFMU5TNHpNeklzTkRZdU9USTVJREUxTmk0ek5EY3NORGN1TWpNMklERTFOeTR5TURnc05EY3VPRE01SUVNeE5UY3VNakk1TERRM0xqZzFOQ0F4TlRjdU1qUTRMRFEzTGpnM015QXhOVGN1TWpZekxEUTNMamc1TkNCRE1UVTRMakUxTnl3ME9TNHhNemdnTVRVNExqWXpMRFV3TGpnMk5TQXhOVGd1TmpNc05USXVPRGt4SUVNeE5UZ3VOak1zTlRrdU1UTXlJREUxTkM0eU1EVXNOall1TnpZMklERTBPQzQzTmpVc05qa3VPVEEzSUVNeE5EY3VNVGt5TERjd0xqZ3hOU0F4TkRVdU5qZ3hMRGN4TGpJM05pQXhORFF1TWpjMkxEY3hMakkzTmlCTU1UUTBMakkzTml3M01TNHlOellnV2lCTk1UUXhMalUxT0N3M01DNHhNRFFnUXpFME1pNHpNekVzTnpBdU5qTTNJREUwTXk0eU5EVXNOekV1TURBMUlERTBOQzR5TnpZc056RXVNREExSUVNeE5EVXVOVGs0TERjeExqQXdOU0F4TkRjdU1ETXNOekF1TkRZM0lERTBPQzQxTXpJc05qa3VOaUJETVRVekxqZzBNaXcyTmk0MU16UWdNVFU0TGpFMk15dzFPUzR3TXpNZ01UVTRMakUyTXl3MU1pNDVNemtnUXpFMU9DNHhOak1zTlRFdU1ETXhJREUxTnk0M01qa3NORGt1TXpnMUlERTFOaTQ1TURjc05EZ3VNakl6SUVNeE5UWXVNVE16TERRM0xqWTVNU0F4TlRVdU1qRTVMRFEzTGpRd09TQXhOVFF1TVRnNUxEUTNMalF3T1NCRE1UVXlMamcyTnl3ME55NDBNRGtnTVRVeExqUXpOU3cwTnk0NE5ESWdNVFE1TGprek15dzBPQzQzTURrZ1F6RTBOQzQyTWpNc05URXVOemMxSURFME1DNHpNRElzTlRrdU1qY3pJREUwTUM0ek1ESXNOalV1TXpZMklFTXhOREF1TXpBeUxEWTNMakkzTmlBeE5EQXVOek0yTERZNExqazBNaUF4TkRFdU5UVTRMRGN3TGpFd05DQk1NVFF4TGpVMU9DdzNNQzR4TURRZ1dpSWdhV1E5SWtacGJHd3RNelVpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRVd0xqY3lMRFkxTGpNMk1TQk1NVFV3TGpNMU55dzJOUzR3TmpZZ1F6RTFNUzR4TkRjc05qUXVNRGt5SURFMU1TNDROamtzTmpNdU1EUWdNVFV5TGpVd05TdzJNUzQ1TXpnZ1F6RTFNeTR6TVRNc05qQXVOVE01SURFMU15NDVOemdzTlRrdU1EWTNJREUxTkM0ME9ESXNOVGN1TlRZeklFd3hOVFF1T1RJMUxEVTNMamN4TWlCRE1UVTBMalF4TWl3MU9TNHlORFVnTVRVekxqY3pNeXcyTUM0M05EVWdNVFV5TGpreExEWXlMakUzTWlCRE1UVXlMakkyTWl3Mk15NHlPVFVnTVRVeExqVXlOU3cyTkM0ek5qZ2dNVFV3TGpjeUxEWTFMak0yTVNJZ2FXUTlJa1pwYkd3dE16WWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEUxTGpreE55dzROQzQxTVRRZ1RERXhOUzQxTlRRc09EUXVNaklnUXpFeE5pNHpORFFzT0RNdU1qUTFJREV4Tnk0d05qWXNPREl1TVRrMElERXhOeTQzTURJc09ERXVNRGt5SUVNeE1UZ3VOVEVzTnprdU5qa3lJREV4T1M0eE56VXNOemd1TWpJZ01URTVMalkzT0N3M05pNDNNVGNnVERFeU1DNHhNakVzTnpZdU9EWTFJRU14TVRrdU5qQTRMRGM0TGpNNU9DQXhNVGd1T1RNc056a3VPRGs1SURFeE9DNHhNRFlzT0RFdU16STJJRU14TVRjdU5EVTRMRGd5TGpRME9DQXhNVFl1TnpJeUxEZ3pMalV5TVNBeE1UVXVPVEUzTERnMExqVXhOQ0lnYVdROUlrWnBiR3d0TXpjaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URTBMREV6TUM0ME56WWdUREV4TkN3eE16QXVNREE0SUV3eE1UUXNOell1TURVeUlFd3hNVFFzTnpVdU5UZzBJRXd4TVRRc056WXVNRFV5SUV3eE1UUXNNVE13TGpBd09DQk1NVEUwTERFek1DNDBOellpSUdsa1BTSkdhV3hzTFRNNElpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4TDJjK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOFp5QnBaRDBpU1cxd2IzSjBaV1F0VEdGNVpYSnpMVU52Y0hraUlIUnlZVzV6Wm05eWJUMGlkSEpoYm5Oc1lYUmxLRFl5TGpBd01EQXdNQ3dnTUM0d01EQXdNREFwSWlCemEyVjBZMmc2ZEhsd1pUMGlUVk5UYUdGd1pVZHliM1Z3SWo0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVGt1T0RJeUxETTNMalEzTkNCRE1Ua3VPRE01TERNM0xqTXpPU0F4T1M0M05EY3NNemN1TVRrMElERTVMalUxTlN3ek55NHdPRElnUXpFNUxqSXlPQ3d6Tmk0NE9UUWdNVGd1TnpJNUxETTJMamczTWlBeE9DNDBORFlzTXpjdU1ETTNJRXd4TWk0ME16UXNOREF1TlRBNElFTXhNaTR6TURNc05EQXVOVGcwSURFeUxqSTBMRFF3TGpZNE5pQXhNaTR5TkRNc05EQXVOemt6SUVNeE1pNHlORFVzTkRBdU9USTFJREV5TGpJME5TdzBNUzR5TlRRZ01USXVNalExTERReExqTTNNU0JNTVRJdU1qUTFMRFF4TGpReE5DQk1NVEl1TWpNNExEUXhMalUwTWlCRE9DNHhORGdzTkRNdU9EZzNJRFV1TmpRM0xEUTFMak15TVNBMUxqWTBOeXcwTlM0ek1qRWdRelV1TmpRMkxEUTFMak15TVNBekxqVTNMRFEyTGpNMk55QXlMamcyTERVd0xqVXhNeUJETWk0NE5pdzFNQzQxTVRNZ01TNDVORGdzTlRjdU5EYzBJREV1T1RZeUxEY3dMakkxT0NCRE1TNDVOemNzT0RJdU9ESTRJREl1TlRZNExEZzNMak15T0NBekxqRXlPU3c1TVM0Mk1Ea2dRek11TXpRNUxEa3pMakk1TXlBMkxqRXpMRGt6TGpjek5DQTJMakV6TERrekxqY3pOQ0JETmk0ME5qRXNPVE11TnpjMElEWXVPREk0TERrekxqY3dOeUEzTGpJeExEa3pMalE0TmlCTU9ESXVORGd6TERRNUxqa3pOU0JET0RRdU1qa3hMRFE0TGpnMk5pQTROUzR4TlN3ME5pNHlNVFlnT0RVdU5UTTVMRFF6TGpZMU1TQkRPRFl1TnpVeUxETTFMalkyTVNBNE55NHlNVFFzTVRBdU5qY3pJRGcxTGpJMk5Dd3pMamMzTXlCRE9EVXVNRFk0TERNdU1EZ2dPRFF1TnpVMExESXVOamtnT0RRdU16azJMREl1TkRreElFdzRNaTR6TVN3eExqY3dNU0JET0RFdU5UZ3pMREV1TnpJNUlEZ3dMamc1TkN3eUxqRTJPQ0E0TUM0M056WXNNaTR5TXpZZ1F6Z3dMall6Tml3eUxqTXhOeUEwTVM0NE1EY3NNalF1TlRnMUlESXdMakF6TWl3ek55NHdOeklnVERFNUxqZ3lNaXd6Tnk0ME56UWlJR2xrUFNKR2FXeHNMVEVpSUdacGJHdzlJaU5HUmtaR1JrWWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOT0RJdU16RXhMREV1TnpBeElFdzROQzR6T1RZc01pNDBPVEVnUXpnMExqYzFOQ3d5TGpZNUlEZzFMakEyT0N3ekxqQTRJRGcxTGpJMk5Dd3pMamMzTXlCRE9EY3VNakV6TERFd0xqWTNNeUE0Tmk0M05URXNNelV1TmpZZ09EVXVOVE01TERRekxqWTFNU0JET0RVdU1UUTVMRFEyTGpJeE5pQTROQzR5T1N3ME9DNDROallnT0RJdU5EZ3pMRFE1TGprek5TQk1OeTR5TVN3NU15NDBPRFlnUXpZdU9EazNMRGt6TGpZMk55QTJMalU1TlN3NU15NDNORFFnTmk0ek1UUXNPVE11TnpRMElFdzJMakV6TVN3NU15NDNNek1nUXpZdU1UTXhMRGt6TGpjek5DQXpMak0wT1N3NU15NHlPVE1nTXk0eE1qZ3NPVEV1TmpBNUlFTXlMalUyT0N3NE55NHpNamNnTVM0NU56Y3NPREl1T0RJNElERXVPVFl6TERjd0xqSTFPQ0JETVM0NU5EZ3NOVGN1TkRjMElESXVPRFlzTlRBdU5URXpJREl1T0RZc05UQXVOVEV6SUVNekxqVTNMRFEyTGpNMk55QTFMalkwTnl3ME5TNHpNakVnTlM0Mk5EY3NORFV1TXpJeElFTTFMalkwTnl3ME5TNHpNakVnT0M0eE5EZ3NORE11T0RnM0lERXlMakl6T0N3ME1TNDFORElnVERFeUxqSTBOU3cwTVM0ME1UUWdUREV5TGpJME5TdzBNUzR6TnpFZ1F6RXlMakkwTlN3ME1TNHlOVFFnTVRJdU1qUTFMRFF3TGpreU5TQXhNaTR5TkRNc05EQXVOemt6SUVNeE1pNHlOQ3cwTUM0Mk9EWWdNVEl1TXpBeUxEUXdMalU0TXlBeE1pNDBNelFzTkRBdU5UQTRJRXd4T0M0ME5EWXNNemN1TURNMklFTXhPQzQxTnpRc016WXVPVFl5SURFNExqYzBOaXd6Tmk0NU1qWWdNVGd1T1RJM0xETTJMamt5TmlCRE1Ua3VNVFExTERNMkxqa3lOaUF4T1M0ek56WXNNell1T1RjNUlERTVMalUxTkN3ek55NHdPRElnUXpFNUxqYzBOeXd6Tnk0eE9UUWdNVGt1T0RNNUxETTNMak0wSURFNUxqZ3lNaXd6Tnk0ME56UWdUREl3TGpBek15d3pOeTR3TnpJZ1F6UXhMamd3Tml3eU5DNDFPRFVnT0RBdU5qTTJMREl1TXpFNElEZ3dMamMzTnl3eUxqSXpOaUJET0RBdU9EazBMREl1TVRZNElEZ3hMalU0TXl3eExqY3lPU0E0TWk0ek1URXNNUzQzTURFZ1RUZ3lMak14TVN3d0xqY3dOQ0JNT0RJdU1qY3lMREF1TnpBMUlFTTRNUzQyTlRRc01DNDNNamdnT0RBdU9UZzVMREF1T1RRNUlEZ3dMakk1T0N3eExqTTJNU0JNT0RBdU1qYzNMREV1TXpjeklFTTRNQzR4TWprc01TNDBOVGdnTlRrdU56WTRMREV6TGpFek5TQXhPUzQzTlRnc016WXVNRGM1SUVNeE9TNDFMRE0xTGprNE1TQXhPUzR5TVRRc016VXVPVEk1SURFNExqa3lOeXd6TlM0NU1qa2dRekU0TGpVMk1pd3pOUzQ1TWprZ01UZ3VNakl6TERNMkxqQXhNeUF4Tnk0NU5EY3NNell1TVRjeklFd3hNUzQ1TXpVc016a3VOalEwSUVNeE1TNDBPVE1zTXprdU9EazVJREV4TGpJek5pdzBNQzR6TXpRZ01URXVNalEyTERRd0xqZ3hJRXd4TVM0eU5EY3NOREF1T1RZZ1REVXVNVFkzTERRMExqUTBOeUJETkM0M09UUXNORFF1TmpRMklESXVOakkxTERRMUxqazNPQ0F4TGpnM055dzFNQzR6TkRVZ1RERXVPRGN4TERVd0xqTTROQ0JETVM0NE5qSXNOVEF1TkRVMElEQXVPVFV4TERVM0xqVTFOeUF3TGprMk5TdzNNQzR5TlRrZ1F6QXVPVGM1TERneUxqZzNPU0F4TGpVMk9DdzROeTR6TnpVZ01pNHhNemNzT1RFdU56STBJRXd5TGpFek9TdzVNUzQzTXprZ1F6SXVORFEzTERrMExqQTVOQ0ExTGpZeE5DdzVOQzQyTmpJZ05TNDVOelVzT1RRdU56RTVJRXcyTGpBd09TdzVOQzQzTWpNZ1F6WXVNVEVzT1RRdU56TTJJRFl1TWpFekxEazBMamMwTWlBMkxqTXhOQ3c1TkM0M05ESWdRell1Tnprc09UUXVOelF5SURjdU1qWXNPVFF1TmpFZ055NDNNU3c1TkM0ek5TQk1PREl1T1RnekxEVXdMamM1T0NCRE9EUXVOemswTERRNUxqY3lOeUE0TlM0NU9ESXNORGN1TXpjMUlEZzJMalV5TlN3ME15NDRNREVnUXpnM0xqY3hNU3d6TlM0NU9EY2dPRGd1TWpVNUxERXdMamN3TlNBNE5pNHlNalFzTXk0MU1ESWdRemcxTGprM01Td3lMall3T1NBNE5TNDFNaXd4TGprM05TQTROQzQ0T0RFc01TNDJNaUJNT0RRdU56UTVMREV1TlRVNElFdzRNaTQyTmpRc01DNDNOamtnUXpneUxqVTFNU3d3TGpjeU5TQTRNaTQwTXpFc01DNDNNRFFnT0RJdU16RXhMREF1TnpBMElpQnBaRDBpUm1sc2JDMHlJaUJtYVd4c1BTSWpORFUxUVRZMElqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFkyTGpJMk55d3hNUzQxTmpVZ1REWTNMamMyTWl3eE1TNDVPVGtnVERFeExqUXlNeXcwTkM0ek1qVWlJR2xrUFNKR2FXeHNMVE1pSUdacGJHdzlJaU5HUmtaR1JrWWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRJdU1qQXlMRGt3TGpVME5TQkRNVEl1TURJNUxEa3dMalUwTlNBeE1TNDROaklzT1RBdU5EVTFJREV4TGpjMk9TdzVNQzR5T1RVZ1F6RXhMall6TWl3NU1DNHdOVGNnTVRFdU56RXpMRGc1TGpjMU1pQXhNUzQ1TlRJc09Ea3VOakUwSUV3ek1DNHpPRGtzTnpndU9UWTVJRU16TUM0Mk1qZ3NOemd1T0RNeElETXdMamt6TXl3M09DNDVNVE1nTXpFdU1EY3hMRGM1TGpFMU1pQkRNekV1TWpBNExEYzVMak01SURNeExqRXlOeXczT1M0Mk9UWWdNekF1T0RnNExEYzVMamd6TXlCTU1USXVORFV4TERrd0xqUTNPQ0JNTVRJdU1qQXlMRGt3TGpVME5TSWdhV1E5SWtacGJHd3ROQ0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TXk0M05qUXNOREl1TmpVMElFd3hNeTQyTlRZc05ESXVOVGt5SUV3eE15NDNNRElzTkRJdU5ESXhJRXd4T0M0NE16Y3NNemt1TkRVM0lFd3hPUzR3TURjc016a3VOVEF5SUV3eE9DNDVOaklzTXprdU5qY3pJRXd4TXk0NE1qY3NOREl1TmpNM0lFd3hNeTQzTmpRc05ESXVOalUwSWlCcFpEMGlSbWxzYkMwMUlpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUZ3VOVElzT1RBdU16YzFJRXc0TGpVeUxEUTJMalF5TVNCTU9DNDFPRE1zTkRZdU16ZzFJRXczTlM0NE5DdzNMalUxTkNCTU56VXVPRFFzTlRFdU5UQTRJRXczTlM0M056Z3NOVEV1TlRRMElFdzRMalV5TERrd0xqTTNOU0JNT0M0MU1pdzVNQzR6TnpVZ1dpQk5PQzQzTnl3ME5pNDFOalFnVERndU56Y3NPRGt1T1RRMElFdzNOUzQxT1RFc05URXVNelkxSUV3M05TNDFPVEVzTnk0NU9EVWdURGd1Tnpjc05EWXVOVFkwSUV3NExqYzNMRFEyTGpVMk5DQmFJaUJwWkQwaVJtbHNiQzAySWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRJMExqazROaXc0TXk0eE9ESWdRekkwTGpjMU5pdzRNeTR6TXpFZ01qUXVNemMwTERnekxqVTJOaUF5TkM0eE16Y3NPRE11TnpBMUlFd3hNaTQyTXpJc09UQXVOREEySUVNeE1pNHpPVFVzT1RBdU5UUTFJREV5TGpReU5pdzVNQzQyTlRnZ01USXVOeXc1TUM0Mk5UZ2dUREV6TGpJMk5TdzVNQzQyTlRnZ1F6RXpMalUwTERrd0xqWTFPQ0F4TXk0NU5UZ3NPVEF1TlRRMUlERTBMakU1TlN3NU1DNDBNRFlnVERJMUxqY3NPRE11TnpBMUlFTXlOUzQ1TXpjc09ETXVOVFkySURJMkxqRXlPQ3c0TXk0ME5USWdNall1TVRJMUxEZ3pMalEwT1NCRE1qWXVNVEl5TERnekxqUTBOeUF5Tmk0eE1Ua3NPRE11TWpJZ01qWXVNVEU1TERneUxqazBOaUJETWpZdU1URTVMRGd5TGpZM01pQXlOUzQ1TXpFc09ESXVOVFk1SURJMUxqY3dNU3c0TWk0M01Ua2dUREkwTGprNE5pdzRNeTR4T0RJaUlHbGtQU0pHYVd4c0xUY2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVE11TWpZMkxEa3dMamM0TWlCTU1USXVOeXc1TUM0M09ESWdRekV5TGpVc09UQXVOemd5SURFeUxqTTROQ3c1TUM0M01qWWdNVEl1TXpVMExEa3dMall4TmlCRE1USXVNekkwTERrd0xqVXdOaUF4TWk0ek9UY3NPVEF1TXprNUlERXlMalUyT1N3NU1DNHlPVGtnVERJMExqQTNOQ3c0TXk0MU9UY2dRekkwTGpNeExEZ3pMalExT1NBeU5DNDJPRGtzT0RNdU1qSTJJREkwTGpreE9DdzRNeTR3TnpnZ1RESTFMall6TXl3NE1pNDJNVFFnUXpJMUxqY3lNeXc0TWk0MU5UVWdNalV1T0RFekxEZ3lMalV5TlNBeU5TNDRPVGtzT0RJdU5USTFJRU15Tmk0d056RXNPREl1TlRJMUlESTJMakkwTkN3NE1pNDJOVFVnTWpZdU1qUTBMRGd5TGprME5pQkRNall1TWpRMExEZ3pMakUySURJMkxqSTBOU3c0TXk0ek1Ea2dNall1TWpRM0xEZ3pMak00TXlCTU1qWXVNalV6TERnekxqTTROeUJNTWpZdU1qUTVMRGd6TGpRMU5pQkRNall1TWpRMkxEZ3pMalV6TVNBeU5pNHlORFlzT0RNdU5UTXhJREkxTGpjMk15dzRNeTQ0TVRJZ1RERTBMakkxT0N3NU1DNDFNVFFnUXpFMExEa3dMalkyTlNBeE15NDFOalFzT1RBdU56Z3lJREV6TGpJMk5pdzVNQzQzT0RJZ1RERXpMakkyTml3NU1DNDNPRElnV2lCTk1USXVOalkyTERrd0xqVXpNaUJNTVRJdU55dzVNQzQxTXpNZ1RERXpMakkyTml3NU1DNDFNek1nUXpFekxqVXhPQ3c1TUM0MU16TWdNVE11T1RFMUxEa3dMalF5TlNBeE5DNHhNeklzT1RBdU1qazVJRXd5TlM0Mk16Y3NPRE11TlRrM0lFTXlOUzQ0TURVc09ETXVORGs1SURJMUxqa3pNU3c0TXk0ME1qUWdNalV1T1RrNExEZ3pMak00TXlCRE1qVXVPVGswTERnekxqSTVPU0F5TlM0NU9UUXNPRE11TVRZMUlESTFMams1TkN3NE1pNDVORFlnVERJMUxqZzVPU3c0TWk0M056VWdUREkxTGpjMk9DdzRNaTQ0TWpRZ1RESTFMakExTkN3NE15NHlPRGNnUXpJMExqZ3lNaXc0TXk0ME16Y2dNalF1TkRNNExEZ3pMalkzTXlBeU5DNHlMRGd6TGpneE1pQk1NVEl1TmprMUxEa3dMalV4TkNCTU1USXVOalkyTERrd0xqVXpNaUJNTVRJdU5qWTJMRGt3TGpVek1pQmFJaUJwWkQwaVJtbHNiQzA0SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFekxqSTJOaXc0T1M0NE56RWdUREV5TGpjc09Ea3VPRGN4SUVNeE1pNDFMRGc1TGpnM01TQXhNaTR6T0RRc09Ea3VPREUxSURFeUxqTTFOQ3c0T1M0M01EVWdRekV5TGpNeU5DdzRPUzQxT1RVZ01USXVNemszTERnNUxqUTRPQ0F4TWk0MU5qa3NPRGt1TXpnNElFd3lOQzR3TnpRc09ESXVOamcySUVNeU5DNHpNeklzT0RJdU5UTTFJREkwTGpjMk9DdzRNaTQwTVRnZ01qVXVNRFkzTERneUxqUXhPQ0JNTWpVdU5qTXlMRGd5TGpReE9DQkRNalV1T0RNeUxEZ3lMalF4T0NBeU5TNDVORGdzT0RJdU5EYzBJREkxTGprM09DdzRNaTQxT0RRZ1F6STJMakF3T0N3NE1pNDJPVFFnTWpVdU9UTTFMRGd5TGpnd01TQXlOUzQzTmpNc09ESXVPVEF4SUV3eE5DNHlOVGdzT0RrdU5qQXpJRU14TkN3NE9TNDNOVFFnTVRNdU5UWTBMRGc1TGpnM01TQXhNeTR5TmpZc09Ea3VPRGN4SUV3eE15NHlOallzT0RrdU9EY3hJRm9nVFRFeUxqWTJOaXc0T1M0Mk1qRWdUREV5TGpjc09Ea3VOakl5SUV3eE15NHlOallzT0RrdU5qSXlJRU14TXk0MU1UZ3NPRGt1TmpJeUlERXpMamt4TlN3NE9TNDFNVFVnTVRRdU1UTXlMRGc1TGpNNE9DQk1NalV1TmpNM0xEZ3lMalk0TmlCTU1qVXVOalkzTERneUxqWTJPQ0JNTWpVdU5qTXlMRGd5TGpZMk55Qk1NalV1TURZM0xEZ3lMalkyTnlCRE1qUXVPREUxTERneUxqWTJOeUF5TkM0ME1UZ3NPREl1TnpjMUlESTBMaklzT0RJdU9UQXhJRXd4TWk0Mk9UVXNPRGt1TmpBeklFd3hNaTQyTmpZc09Ea3VOakl4SUV3eE1pNDJOallzT0RrdU5qSXhJRm9pSUdsa1BTSkdhV3hzTFRraUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1USXVNemNzT1RBdU9EQXhJRXd4TWk0ek55dzRPUzQxTlRRZ1RERXlMak0zTERrd0xqZ3dNU0lnYVdROUlrWnBiR3d0TVRBaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk5pNHhNeXc1TXk0NU1ERWdRelV1TXpjNUxEa3pMamd3T0NBMExqZ3hOaXc1TXk0eE5qUWdOQzQyT1RFc09USXVOVEkxSUVNekxqZzJMRGc0TGpJNE55QXpMalUwTERnekxqYzBNeUF6TGpVeU5pdzNNUzR4TnpNZ1F6TXVOVEV4TERVNExqTTRPU0EwTGpReU15dzFNUzQwTWpnZ05DNDBNak1zTlRFdU5ESTRJRU0xTGpFek5DdzBOeTR5T0RJZ055NHlNU3cwTmk0eU16WWdOeTR5TVN3ME5pNHlNellnUXpjdU1qRXNORFl1TWpNMklEZ3hMalkyTnl3ekxqSTFJRGd5TGpBMk9Td3pMakF4TnlCRE9ESXVNamt5TERJdU9EZzRJRGcwTGpVMU5pd3hMalF6TXlBNE5TNHlOalFzTXk0NU5DQkRPRGN1TWpFMExERXdMamcwSURnMkxqYzFNaXd6TlM0NE1qY2dPRFV1TlRNNUxEUXpMamd4T0NCRE9EVXVNVFVzTkRZdU16Z3pJRGcwTGpJNU1TdzBPUzR3TXpNZ09ESXVORGd6TERVd0xqRXdNU0JNTnk0eU1TdzVNeTQyTlRNZ1F6WXVPREk0TERrekxqZzNOQ0EyTGpRMk1TdzVNeTQ1TkRFZ05pNHhNeXc1TXk0NU1ERWdRell1TVRNc09UTXVPVEF4SURNdU16UTVMRGt6TGpRMklETXVNVEk1TERreExqYzNOaUJETWk0MU5qZ3NPRGN1TkRrMUlERXVPVGMzTERneUxqazVOU0F4TGprMk1pdzNNQzQwTWpVZ1F6RXVPVFE0TERVM0xqWTBNU0F5TGpnMkxEVXdMalk0SURJdU9EWXNOVEF1TmpnZ1F6TXVOVGNzTkRZdU5UTTBJRFV1TmpRM0xEUTFMalE0T1NBMUxqWTBOeXcwTlM0ME9Ea2dRelV1TmpRMkxEUTFMalE0T1NBNExqQTJOU3cwTkM0d09USWdNVEl1TWpRMUxEUXhMalkzT1NCTU1UTXVNVEUyTERReExqVTJJRXd4T1M0M01UVXNNemN1TnpNZ1RERTVMamMyTVN3ek55NHlOamtnVERZdU1UTXNPVE11T1RBeElpQnBaRDBpUm1sc2JDMHhNU0lnWm1sc2JEMGlJMFpCUmtGR1FTSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazAyTGpNeE55dzVOQzR4TmpFZ1REWXVNVEF5TERrMExqRTBPQ0JNTmk0eE1ERXNPVFF1TVRRNElFdzFMamcxTnl3NU5DNHhNREVnUXpVdU1UTTRMRGt6TGprME5TQXpMakE0TlN3NU15NHpOalVnTWk0NE9ERXNPVEV1T0RBNUlFTXlMak14TXl3NE55NDBOamtnTVM0M01qY3NPREl1T1RrMklERXVOekV6TERjd0xqUXlOU0JETVM0Mk9Ua3NOVGN1TnpjeElESXVOakEwTERVd0xqY3hPQ0F5TGpZeE15dzFNQzQyTkRnZ1F6TXVNek00TERRMkxqUXhOeUExTGpRME5TdzBOUzR6TVNBMUxqVXpOU3cwTlM0eU5qWWdUREV5TGpFMk15dzBNUzQwTXprZ1RERXpMakF6TXl3ME1TNHpNaUJNTVRrdU5EYzVMRE0zTGpVM09DQk1NVGt1TlRFekxETTNMakkwTkNCRE1Ua3VOVEkyTERNM0xqRXdOeUF4T1M0Mk5EY3NNemN1TURBNElERTVMamM0Tml3ek55NHdNakVnUXpFNUxqa3lNaXd6Tnk0d016UWdNakF1TURJekxETTNMakUxTmlBeU1DNHdNRGtzTXpjdU1qa3pJRXd4T1M0NU5Td3pOeTQ0T0RJZ1RERXpMakU1T0N3ME1TNDRNREVnVERFeUxqTXlPQ3cwTVM0NU1Ua2dURFV1TnpjeUxEUTFMamN3TkNCRE5TNDNOREVzTkRVdU56SWdNeTQzT0RJc05EWXVOemN5SURNdU1UQTJMRFV3TGpjeU1pQkRNeTR3T1Rrc05UQXVOemd5SURJdU1UazRMRFUzTGpnd09DQXlMakl4TWl3M01DNDBNalFnUXpJdU1qSTJMRGd5TGprMk15QXlMamd3T1N3NE55NDBNaUF6TGpNM015dzVNUzQzTWprZ1F6TXVORFkwTERreUxqUXlJRFF1TURZeUxEa3lMamc0TXlBMExqWTRNaXc1TXk0eE9ERWdRelF1TlRZMkxEa3lMams0TkNBMExqUTROaXc1TWk0M056WWdOQzQwTkRZc09USXVOVGN5SUVNekxqWTJOU3c0T0M0MU9EZ2dNeTR5T1RFc09EUXVNemNnTXk0eU56WXNOekV1TVRjeklFTXpMakkyTWl3MU9DNDFNaUEwTGpFMk55dzFNUzQwTmpZZ05DNHhOellzTlRFdU16azJJRU0wTGprd01TdzBOeTR4TmpVZ055NHdNRGdzTkRZdU1EVTVJRGN1TURrNExEUTJMakF4TkNCRE55NHdPVFFzTkRZdU1ERTFJRGd4TGpVME1pd3pMakF6TkNBNE1TNDVORFFzTWk0NE1ESWdURGd4TGprM01pd3lMamM0TlNCRE9ESXVPRGMyTERJdU1qUTNJRGd6TGpZNU1pd3lMakE1TnlBNE5DNHpNeklzTWk0ek5USWdRemcwTGpnNE55d3lMalUzTXlBNE5TNHlPREVzTXk0d09EVWdPRFV1TlRBMExETXVPRGN5SUVNNE55NDFNVGdzTVRFZ09EWXVPVFkwTERNMkxqQTVNU0E0TlM0M09EVXNORE11T0RVMUlFTTROUzR5Tnpnc05EY3VNVGsySURnMExqSXhMRFE1TGpNM0lEZ3lMall4TERVd0xqTXhOeUJNTnk0ek16VXNPVE11T0RZNUlFTTJMams1T1N3NU5DNHdOak1nTmk0Mk5UZ3NPVFF1TVRZeElEWXVNekUzTERrMExqRTJNU0JNTmk0ek1UY3NPVFF1TVRZeElGb2dUVFl1TVRjc09UTXVOalUwSUVNMkxqUTJNeXc1TXk0Mk9TQTJMamMzTkN3NU15NDJNVGNnTnk0d09EVXNPVE11TkRNM0lFdzRNaTR6TlRnc05Ea3VPRGcySUVNNE5DNHhPREVzTkRndU9EQTRJRGcwTGprMkxEUTFMamszTVNBNE5TNHlPVElzTkRNdU56Z2dRemcyTGpRMk5pd3pOaTR3TkRrZ09EY3VNREl6TERFeExqQTROU0E0TlM0d01qUXNOQzR3TURnZ1F6ZzBMamcwTml3ekxqTTNOeUE0TkM0MU5URXNNaTQ1TnpZZ09EUXVNVFE0TERJdU9ERTJJRU00TXk0Mk5qUXNNaTQyTWpNZ09ESXVPVGd5TERJdU56WTBJRGd5TGpJeU55d3pMakl4TXlCTU9ESXVNVGt6TERNdU1qTTBJRU00TVM0M09URXNNeTQwTmpZZ055NHpNelVzTkRZdU5EVXlJRGN1TXpNMUxEUTJMalExTWlCRE55NHpNRFFzTkRZdU5EWTVJRFV1TXpRMkxEUTNMalV5TVNBMExqWTJPU3cxTVM0ME56RWdRelF1TmpZeUxEVXhMalV6SURNdU56WXhMRFU0TGpVMU5pQXpMamMzTlN3M01TNHhOek1nUXpNdU56a3NPRFF1TXpJNElEUXVNVFl4TERnNExqVXlOQ0EwTGprek5pdzVNaTQwTnpZZ1F6VXVNREkyTERreUxqa3pOeUExTGpReE1pdzVNeTQwTlRrZ05TNDVOek1zT1RNdU5qRTFJRU0yTGpBNE55dzVNeTQyTkNBMkxqRTFPQ3c1TXk0Mk5USWdOaTR4Tmprc09UTXVOalUwSUV3MkxqRTNMRGt6TGpZMU5DQk1OaTR4Tnl3NU15NDJOVFFnV2lJZ2FXUTlJa1pwYkd3dE1USWlJR1pwYkd3OUlpTTBOVFZCTmpRaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5OeTR6TVRjc05qZ3VPVGd5SUVNM0xqZ3dOaXcyT0M0M01ERWdPQzR5TURJc05qZ3VPVEkySURndU1qQXlMRFk1TGpRNE55QkRPQzR5TURJc056QXVNRFEzSURjdU9EQTJMRGN3TGpjeklEY3VNekUzTERjeExqQXhNaUJETmk0NE1qa3NOekV1TWprMElEWXVORE16TERjeExqQTJPU0EyTGpRek15dzNNQzQxTURnZ1F6WXVORE16TERZNUxqazBPQ0EyTGpneU9TdzJPUzR5TmpVZ055NHpNVGNzTmpndU9UZ3lJaUJwWkQwaVJtbHNiQzB4TXlJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWswMkxqa3lMRGN4TGpFek15QkROaTQyTXpFc056RXVNVE16SURZdU5ETXpMRGN3TGprd05TQTJMalF6TXl3M01DNDFNRGdnUXpZdU5ETXpMRFk1TGprME9DQTJMamd5T1N3Mk9TNHlOalVnTnk0ek1UY3NOamd1T1RneUlFTTNMalEyTERZNExqa2dOeTQxT1RVc05qZ3VPRFl4SURjdU56RTBMRFk0TGpnMk1TQkRPQzR3TURNc05qZ3VPRFl4SURndU1qQXlMRFk1TGpBNUlEZ3VNakF5TERZNUxqUTROeUJET0M0eU1ESXNOekF1TURRM0lEY3VPREEyTERjd0xqY3pJRGN1TXpFM0xEY3hMakF4TWlCRE55NHhOelFzTnpFdU1EazBJRGN1TURNNUxEY3hMakV6TXlBMkxqa3lMRGN4TGpFek15Qk5OeTQzTVRRc05qZ3VOamMwSUVNM0xqVTFOeXcyT0M0Mk56UWdOeTR6T1RJc05qZ3VOekl6SURjdU1qSTBMRFk0TGpneU1TQkROaTQyTnpZc05qa3VNVE00SURZdU1qUTJMRFk1TGpnM09TQTJMakkwTml3M01DNDFNRGdnUXpZdU1qUTJMRGN3TGprNU5DQTJMalV4Tnl3M01TNHpNaUEyTGpreUxEY3hMak15SUVNM0xqQTNPQ3czTVM0ek1pQTNMakkwTXl3M01TNHlOekVnTnk0ME1URXNOekV1TVRjMElFTTNMamsxT1N3M01DNDROVGNnT0M0ek9Ea3NOekF1TVRFM0lEZ3VNemc1TERZNUxqUTROeUJET0M0ek9Ea3NOamt1TURBeElEZ3VNVEUzTERZNExqWTNOQ0EzTGpjeE5DdzJPQzQyTnpRaUlHbGtQU0pHYVd4c0xURTBJaUJtYVd4c1BTSWpPREE1TjBFeUlqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFl1T1RJc056QXVPVFEzSUVNMkxqWTBPU3czTUM0NU5EY2dOaTQyTWpFc056QXVOalFnTmk0Mk1qRXNOekF1TlRBNElFTTJMall5TVN3M01DNHdNVGNnTmk0NU9ESXNOamt1TXpreUlEY3VOREV4TERZNUxqRTBOU0JETnk0MU1qRXNOamt1TURneUlEY3VOakkxTERZNUxqQTBPU0EzTGpjeE5DdzJPUzR3TkRrZ1F6Y3VPVGcyTERZNUxqQTBPU0E0TGpBeE5TdzJPUzR6TlRVZ09DNHdNVFVzTmprdU5EZzNJRU00TGpBeE5TdzJPUzQ1TnpnZ055NDJOVElzTnpBdU5qQXpJRGN1TWpJMExEY3dMamcxTVNCRE55NHhNVFVzTnpBdU9URTBJRGN1TURFc056QXVPVFEzSURZdU9USXNOekF1T1RRM0lFMDNMamN4TkN3Mk9DNDROakVnUXpjdU5UazFMRFk0TGpnMk1TQTNMalEyTERZNExqa2dOeTR6TVRjc05qZ3VPVGd5SUVNMkxqZ3lPU3cyT1M0eU5qVWdOaTQwTXpNc05qa3VPVFE0SURZdU5ETXpMRGN3TGpVd09DQkROaTQwTXpNc056QXVPVEExSURZdU5qTXhMRGN4TGpFek15QTJMamt5TERjeExqRXpNeUJETnk0d016a3NOekV1TVRNeklEY3VNVGMwTERjeExqQTVOQ0EzTGpNeE55dzNNUzR3TVRJZ1F6Y3VPREEyTERjd0xqY3pJRGd1TWpBeUxEY3dMakEwTnlBNExqSXdNaXcyT1M0ME9EY2dRemd1TWpBeUxEWTVMakE1SURndU1EQXpMRFk0TGpnMk1TQTNMamN4TkN3Mk9DNDROakVpSUdsa1BTSkdhV3hzTFRFMUlpQm1hV3hzUFNJak9EQTVOMEV5SWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUY3VORFEwTERnMUxqTTFJRU0zTGpjd09DdzROUzR4T1RnZ055NDVNakVzT0RVdU16RTVJRGN1T1RJeExEZzFMall5TWlCRE55NDVNakVzT0RVdU9USTFJRGN1TnpBNExEZzJMakk1TWlBM0xqUTBOQ3c0Tmk0ME5EUWdRemN1TVRneExEZzJMalU1TnlBMkxqazJOeXc0Tmk0ME56VWdOaTQ1Tmpjc09EWXVNVGN6SUVNMkxqazJOeXc0TlM0NE56RWdOeTR4T0RFc09EVXVOVEF5SURjdU5EUTBMRGcxTGpNMUlpQnBaRDBpUm1sc2JDMHhOaUlnWm1sc2JEMGlJMFpHUmtaR1JpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazAzTGpJekxEZzJMalV4SUVNM0xqQTNOQ3c0Tmk0MU1TQTJMamsyTnl3NE5pNHpPRGNnTmk0NU5qY3NPRFl1TVRjeklFTTJMamsyTnl3NE5TNDROekVnTnk0eE9ERXNPRFV1TlRBeUlEY3VORFEwTERnMUxqTTFJRU0zTGpVeU1TdzROUzR6TURVZ055NDFPVFFzT0RVdU1qZzBJRGN1TmpVNExEZzFMakk0TkNCRE55NDRNVFFzT0RVdU1qZzBJRGN1T1RJeExEZzFMalF3T0NBM0xqa3lNU3c0TlM0Mk1qSWdRemN1T1RJeExEZzFMamt5TlNBM0xqY3dPQ3c0Tmk0eU9USWdOeTQwTkRRc09EWXVORFEwSUVNM0xqTTJOeXc0Tmk0ME9Ea2dOeTR5T1RRc09EWXVOVEVnTnk0eU15dzROaTQxTVNCTk55NDJOVGdzT0RVdU1EazRJRU0zTGpVMU9DdzROUzR3T1RnZ055NDBOVFVzT0RVdU1USTNJRGN1TXpVeExEZzFMakU0T0NCRE55NHdNekVzT0RVdU16Y3pJRFl1TnpneExEZzFMamd3TmlBMkxqYzRNU3c0Tmk0eE56TWdRell1TnpneExEZzJMalE0TWlBMkxqazJOaXc0Tmk0Mk9UY2dOeTR5TXl3NE5pNDJPVGNnUXpjdU16TXNPRFl1TmprM0lEY3VORE16TERnMkxqWTJOaUEzTGpVek9DdzROaTQyTURjZ1F6Y3VPRFU0TERnMkxqUXlNaUE0TGpFd09DdzROUzQ1T0RrZ09DNHhNRGdzT0RVdU5qSXlJRU00TGpFd09DdzROUzR6TVRNZ055NDVNak1zT0RVdU1EazRJRGN1TmpVNExEZzFMakE1T0NJZ2FXUTlJa1pwYkd3dE1UY2lJR1pwYkd3OUlpTTRNRGszUVRJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5OeTR5TXl3NE5pNHpNaklnVERjdU1UVTBMRGcyTGpFM015QkROeTR4TlRRc09EVXVPVE00SURjdU16TXpMRGcxTGpZeU9TQTNMalV6T0N3NE5TNDFNVElnVERjdU5qVTRMRGcxTGpRM01TQk1OeTQzTXpRc09EVXVOakl5SUVNM0xqY3pOQ3c0TlM0NE5UWWdOeTQxTlRVc09EWXVNVFkwSURjdU16VXhMRGcyTGpJNE1pQk1OeTR5TXl3NE5pNHpNaklnVFRjdU5qVTRMRGcxTGpJNE5DQkROeTQxT1RRc09EVXVNamcwSURjdU5USXhMRGcxTGpNd05TQTNMalEwTkN3NE5TNHpOU0JETnk0eE9ERXNPRFV1TlRBeUlEWXVPVFkzTERnMUxqZzNNU0EyTGprMk55dzROaTR4TnpNZ1F6WXVPVFkzTERnMkxqTTROeUEzTGpBM05DdzROaTQxTVNBM0xqSXpMRGcyTGpVeElFTTNMakk1TkN3NE5pNDFNU0EzTGpNMk55dzROaTQwT0RrZ055NDBORFFzT0RZdU5EUTBJRU0zTGpjd09DdzROaTR5T1RJZ055NDVNakVzT0RVdU9USTFJRGN1T1RJeExEZzFMall5TWlCRE55NDVNakVzT0RVdU5EQTRJRGN1T0RFMExEZzFMakk0TkNBM0xqWTFPQ3c0TlM0eU9EUWlJR2xrUFNKR2FXeHNMVEU0SWlCbWFXeHNQU0lqT0RBNU4wRXlJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRjM0xqSTNPQ3czTGpjMk9TQk1OemN1TWpjNExEVXhMalF6TmlCTU1UQXVNakE0TERrd0xqRTJJRXd4TUM0eU1EZ3NORFl1TkRreklFdzNOeTR5Tnpnc055NDNOamtpSUdsa1BTSkdhV3hzTFRFNUlpQm1hV3hzUFNJak5EVTFRVFkwSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURXdMakE0TXl3NU1DNHpOelVnVERFd0xqQTRNeXcwTmk0ME1qRWdUREV3TGpFME5pdzBOaTR6T0RVZ1REYzNMalF3TXl3M0xqVTFOQ0JNTnpjdU5EQXpMRFV4TGpVd09DQk1OemN1TXpReExEVXhMalUwTkNCTU1UQXVNRGd6TERrd0xqTTNOU0JNTVRBdU1EZ3pMRGt3TGpNM05TQmFJRTB4TUM0ek16TXNORFl1TlRZMElFd3hNQzR6TXpNc09Ea3VPVFEwSUV3M055NHhOVFFzTlRFdU16WTFJRXczTnk0eE5UUXNOeTQ1T0RVZ1RERXdMak16TXl3ME5pNDFOalFnVERFd0xqTXpNeXcwTmk0MU5qUWdXaUlnYVdROUlrWnBiR3d0TWpBaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHd2Wno0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE1qVXVOek0zTERnNExqWTBOeUJNTVRFNExqQTVPQ3c1TVM0NU9ERWdUREV4T0M0d09UZ3NPRFFnVERFd05pNDJNemtzT0RndU56RXpJRXd4TURZdU5qTTVMRGsyTGprNE1pQk1PVGtzTVRBd0xqTXhOU0JNTVRFeUxqTTJPU3d4TURNdU9UWXhJRXd4TWpVdU56TTNMRGc0TGpZME55SWdhV1E5SWtsdGNHOXlkR1ZrTFV4aGVXVnljeTFEYjNCNUxUSWlJR1pwYkd3OUlpTTBOVFZCTmpRaUlITnJaWFJqYURwMGVYQmxQU0pOVTFOb1lYQmxSM0p2ZFhBaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdQQzluUGdvZ0lDQWdJQ0FnSUR3dlp6NEtJQ0FnSUR3dlp6NEtQQzl6ZG1jKycpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSb3RhdGVJbnN0cnVjdGlvbnM7XG5cbn0se1wiLi91dGlsLmpzXCI6MjJ9XSwxNzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgU2Vuc29yU2FtcGxlID0gX2RlcmVxXygnLi9zZW5zb3Itc2FtcGxlLmpzJyk7XG52YXIgTWF0aFV0aWwgPSBfZGVyZXFfKCcuLi9tYXRoLXV0aWwuanMnKTtcbnZhciBVdGlsID0gX2RlcmVxXygnLi4vdXRpbC5qcycpO1xuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIGEgc2ltcGxlIGNvbXBsZW1lbnRhcnkgZmlsdGVyLCB3aGljaCBmdXNlcyBneXJvc2NvcGUgYW5kXG4gKiBhY2NlbGVyb21ldGVyIGRhdGEgZnJvbSB0aGUgJ2RldmljZW1vdGlvbicgZXZlbnQuXG4gKlxuICogQWNjZWxlcm9tZXRlciBkYXRhIGlzIHZlcnkgbm9pc3ksIGJ1dCBzdGFibGUgb3ZlciB0aGUgbG9uZyB0ZXJtLlxuICogR3lyb3Njb3BlIGRhdGEgaXMgc21vb3RoLCBidXQgdGVuZHMgdG8gZHJpZnQgb3ZlciB0aGUgbG9uZyB0ZXJtLlxuICpcbiAqIFRoaXMgZnVzaW9uIGlzIHJlbGF0aXZlbHkgc2ltcGxlOlxuICogMS4gR2V0IG9yaWVudGF0aW9uIGVzdGltYXRlcyBmcm9tIGFjY2VsZXJvbWV0ZXIgYnkgYXBwbHlpbmcgYSBsb3ctcGFzcyBmaWx0ZXJcbiAqICAgIG9uIHRoYXQgZGF0YS5cbiAqIDIuIEdldCBvcmllbnRhdGlvbiBlc3RpbWF0ZXMgZnJvbSBneXJvc2NvcGUgYnkgaW50ZWdyYXRpbmcgb3ZlciB0aW1lLlxuICogMy4gQ29tYmluZSB0aGUgdHdvIGVzdGltYXRlcywgd2VpZ2hpbmcgKDEpIGluIHRoZSBsb25nIHRlcm0sIGJ1dCAoMikgZm9yIHRoZVxuICogICAgc2hvcnQgdGVybS5cbiAqL1xuZnVuY3Rpb24gQ29tcGxlbWVudGFyeUZpbHRlcihrRmlsdGVyKSB7XG4gIHRoaXMua0ZpbHRlciA9IGtGaWx0ZXI7XG5cbiAgLy8gUmF3IHNlbnNvciBtZWFzdXJlbWVudHMuXG4gIHRoaXMuY3VycmVudEFjY2VsTWVhc3VyZW1lbnQgPSBuZXcgU2Vuc29yU2FtcGxlKCk7XG4gIHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudCA9IG5ldyBTZW5zb3JTYW1wbGUoKTtcbiAgdGhpcy5wcmV2aW91c0d5cm9NZWFzdXJlbWVudCA9IG5ldyBTZW5zb3JTYW1wbGUoKTtcblxuICAvLyBTZXQgZGVmYXVsdCBsb29rIGRpcmVjdGlvbiB0byBiZSBpbiB0aGUgY29ycmVjdCBkaXJlY3Rpb24uXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICB0aGlzLmZpbHRlclEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigtMSwgMCwgMCwgMSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5maWx0ZXJRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oMSwgMCwgMCwgMSk7XG4gIH1cbiAgdGhpcy5wcmV2aW91c0ZpbHRlclEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB0aGlzLnByZXZpb3VzRmlsdGVyUS5jb3B5KHRoaXMuZmlsdGVyUSk7XG5cbiAgLy8gT3JpZW50YXRpb24gYmFzZWQgb24gdGhlIGFjY2VsZXJvbWV0ZXIuXG4gIHRoaXMuYWNjZWxRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgLy8gV2hldGhlciBvciBub3QgdGhlIG9yaWVudGF0aW9uIGhhcyBiZWVuIGluaXRpYWxpemVkLlxuICB0aGlzLmlzT3JpZW50YXRpb25Jbml0aWFsaXplZCA9IGZhbHNlO1xuICAvLyBSdW5uaW5nIGVzdGltYXRlIG9mIGdyYXZpdHkgYmFzZWQgb24gdGhlIGN1cnJlbnQgb3JpZW50YXRpb24uXG4gIHRoaXMuZXN0aW1hdGVkR3Jhdml0eSA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG4gIC8vIE1lYXN1cmVkIGdyYXZpdHkgYmFzZWQgb24gYWNjZWxlcm9tZXRlci5cbiAgdGhpcy5tZWFzdXJlZEdyYXZpdHkgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuXG4gIC8vIERlYnVnIG9ubHkgcXVhdGVybmlvbiBvZiBneXJvLWJhc2VkIG9yaWVudGF0aW9uLlxuICB0aGlzLmd5cm9JbnRlZ3JhbFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xufVxuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5hZGRBY2NlbE1lYXN1cmVtZW50ID0gZnVuY3Rpb24odmVjdG9yLCB0aW1lc3RhbXBTKSB7XG4gIHRoaXMuY3VycmVudEFjY2VsTWVhc3VyZW1lbnQuc2V0KHZlY3RvciwgdGltZXN0YW1wUyk7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5hZGRHeXJvTWVhc3VyZW1lbnQgPSBmdW5jdGlvbih2ZWN0b3IsIHRpbWVzdGFtcFMpIHtcbiAgdGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50LnNldCh2ZWN0b3IsIHRpbWVzdGFtcFMpO1xuXG4gIHZhciBkZWx0YVQgPSB0aW1lc3RhbXBTIC0gdGhpcy5wcmV2aW91c0d5cm9NZWFzdXJlbWVudC50aW1lc3RhbXBTO1xuICBpZiAoVXRpbC5pc1RpbWVzdGFtcERlbHRhVmFsaWQoZGVsdGFUKSkge1xuICAgIHRoaXMucnVuXygpO1xuICB9XG5cbiAgdGhpcy5wcmV2aW91c0d5cm9NZWFzdXJlbWVudC5jb3B5KHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudCk7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5ydW5fID0gZnVuY3Rpb24oKSB7XG5cbiAgaWYgKCF0aGlzLmlzT3JpZW50YXRpb25Jbml0aWFsaXplZCkge1xuICAgIHRoaXMuYWNjZWxRID0gdGhpcy5hY2NlbFRvUXVhdGVybmlvbl8odGhpcy5jdXJyZW50QWNjZWxNZWFzdXJlbWVudC5zYW1wbGUpO1xuICAgIHRoaXMucHJldmlvdXNGaWx0ZXJRLmNvcHkodGhpcy5hY2NlbFEpO1xuICAgIHRoaXMuaXNPcmllbnRhdGlvbkluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgZGVsdGFUID0gdGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50LnRpbWVzdGFtcFMgLVxuICAgICAgdGhpcy5wcmV2aW91c0d5cm9NZWFzdXJlbWVudC50aW1lc3RhbXBTO1xuXG4gIC8vIENvbnZlcnQgZ3lybyByb3RhdGlvbiB2ZWN0b3IgdG8gYSBxdWF0ZXJuaW9uIGRlbHRhLlxuICB2YXIgZ3lyb0RlbHRhUSA9IHRoaXMuZ3lyb1RvUXVhdGVybmlvbkRlbHRhXyh0aGlzLmN1cnJlbnRHeXJvTWVhc3VyZW1lbnQuc2FtcGxlLCBkZWx0YVQpO1xuICB0aGlzLmd5cm9JbnRlZ3JhbFEubXVsdGlwbHkoZ3lyb0RlbHRhUSk7XG5cbiAgLy8gZmlsdGVyXzEgPSBLICogKGZpbHRlcl8wICsgZ3lybyAqIGRUKSArICgxIC0gSykgKiBhY2NlbC5cbiAgdGhpcy5maWx0ZXJRLmNvcHkodGhpcy5wcmV2aW91c0ZpbHRlclEpO1xuICB0aGlzLmZpbHRlclEubXVsdGlwbHkoZ3lyb0RlbHRhUSk7XG5cbiAgLy8gQ2FsY3VsYXRlIHRoZSBkZWx0YSBiZXR3ZWVuIHRoZSBjdXJyZW50IGVzdGltYXRlZCBncmF2aXR5IGFuZCB0aGUgcmVhbFxuICAvLyBncmF2aXR5IHZlY3RvciBmcm9tIGFjY2VsZXJvbWV0ZXIuXG4gIHZhciBpbnZGaWx0ZXJRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgaW52RmlsdGVyUS5jb3B5KHRoaXMuZmlsdGVyUSk7XG4gIGludkZpbHRlclEuaW52ZXJzZSgpO1xuXG4gIHRoaXMuZXN0aW1hdGVkR3Jhdml0eS5zZXQoMCwgMCwgLTEpO1xuICB0aGlzLmVzdGltYXRlZEdyYXZpdHkuYXBwbHlRdWF0ZXJuaW9uKGludkZpbHRlclEpO1xuICB0aGlzLmVzdGltYXRlZEdyYXZpdHkubm9ybWFsaXplKCk7XG5cbiAgdGhpcy5tZWFzdXJlZEdyYXZpdHkuY29weSh0aGlzLmN1cnJlbnRBY2NlbE1lYXN1cmVtZW50LnNhbXBsZSk7XG4gIHRoaXMubWVhc3VyZWRHcmF2aXR5Lm5vcm1hbGl6ZSgpO1xuXG4gIC8vIENvbXBhcmUgZXN0aW1hdGVkIGdyYXZpdHkgd2l0aCBtZWFzdXJlZCBncmF2aXR5LCBnZXQgdGhlIGRlbHRhIHF1YXRlcm5pb25cbiAgLy8gYmV0d2VlbiB0aGUgdHdvLlxuICB2YXIgZGVsdGFRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgZGVsdGFRLnNldEZyb21Vbml0VmVjdG9ycyh0aGlzLmVzdGltYXRlZEdyYXZpdHksIHRoaXMubWVhc3VyZWRHcmF2aXR5KTtcbiAgZGVsdGFRLmludmVyc2UoKTtcblxuICBpZiAoVXRpbC5pc0RlYnVnKCkpIHtcbiAgICBjb25zb2xlLmxvZygnRGVsdGE6ICVkIGRlZywgR19lc3Q6ICglcywgJXMsICVzKSwgR19tZWFzOiAoJXMsICVzLCAlcyknLFxuICAgICAgICAgICAgICAgIE1hdGhVdGlsLnJhZFRvRGVnICogVXRpbC5nZXRRdWF0ZXJuaW9uQW5nbGUoZGVsdGFRKSxcbiAgICAgICAgICAgICAgICAodGhpcy5lc3RpbWF0ZWRHcmF2aXR5LngpLnRvRml4ZWQoMSksXG4gICAgICAgICAgICAgICAgKHRoaXMuZXN0aW1hdGVkR3Jhdml0eS55KS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgICAgICh0aGlzLmVzdGltYXRlZEdyYXZpdHkueikudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5tZWFzdXJlZEdyYXZpdHkueCkudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5tZWFzdXJlZEdyYXZpdHkueSkudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5tZWFzdXJlZEdyYXZpdHkueikudG9GaXhlZCgxKSk7XG4gIH1cblxuICAvLyBDYWxjdWxhdGUgdGhlIFNMRVJQIHRhcmdldDogY3VycmVudCBvcmllbnRhdGlvbiBwbHVzIHRoZSBtZWFzdXJlZC1lc3RpbWF0ZWRcbiAgLy8gcXVhdGVybmlvbiBkZWx0YS5cbiAgdmFyIHRhcmdldFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB0YXJnZXRRLmNvcHkodGhpcy5maWx0ZXJRKTtcbiAgdGFyZ2V0US5tdWx0aXBseShkZWx0YVEpO1xuXG4gIC8vIFNMRVJQIGZhY3RvcjogMCBpcyBwdXJlIGd5cm8sIDEgaXMgcHVyZSBhY2NlbC5cbiAgdGhpcy5maWx0ZXJRLnNsZXJwKHRhcmdldFEsIDEgLSB0aGlzLmtGaWx0ZXIpO1xuXG4gIHRoaXMucHJldmlvdXNGaWx0ZXJRLmNvcHkodGhpcy5maWx0ZXJRKTtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLmdldE9yaWVudGF0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmZpbHRlclE7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5hY2NlbFRvUXVhdGVybmlvbl8gPSBmdW5jdGlvbihhY2NlbCkge1xuICB2YXIgbm9ybUFjY2VsID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgbm9ybUFjY2VsLmNvcHkoYWNjZWwpO1xuICBub3JtQWNjZWwubm9ybWFsaXplKCk7XG4gIHZhciBxdWF0ID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgcXVhdC5zZXRGcm9tVW5pdFZlY3RvcnMobmV3IE1hdGhVdGlsLlZlY3RvcjMoMCwgMCwgLTEpLCBub3JtQWNjZWwpO1xuICBxdWF0LmludmVyc2UoKTtcbiAgcmV0dXJuIHF1YXQ7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5neXJvVG9RdWF0ZXJuaW9uRGVsdGFfID0gZnVuY3Rpb24oZ3lybywgZHQpIHtcbiAgLy8gRXh0cmFjdCBheGlzIGFuZCBhbmdsZSBmcm9tIHRoZSBneXJvc2NvcGUgZGF0YS5cbiAgdmFyIHF1YXQgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB2YXIgYXhpcyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG4gIGF4aXMuY29weShneXJvKTtcbiAgYXhpcy5ub3JtYWxpemUoKTtcbiAgcXVhdC5zZXRGcm9tQXhpc0FuZ2xlKGF4aXMsIGd5cm8ubGVuZ3RoKCkgKiBkdCk7XG4gIHJldHVybiBxdWF0O1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBsZW1lbnRhcnlGaWx0ZXI7XG5cbn0se1wiLi4vbWF0aC11dGlsLmpzXCI6MTQsXCIuLi91dGlsLmpzXCI6MjIsXCIuL3NlbnNvci1zYW1wbGUuanNcIjoyMH1dLDE4OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgQ29tcGxlbWVudGFyeUZpbHRlciA9IF9kZXJlcV8oJy4vY29tcGxlbWVudGFyeS1maWx0ZXIuanMnKTtcbnZhciBQb3NlUHJlZGljdG9yID0gX2RlcmVxXygnLi9wb3NlLXByZWRpY3Rvci5qcycpO1xudmFyIFRvdWNoUGFubmVyID0gX2RlcmVxXygnLi4vdG91Y2gtcGFubmVyLmpzJyk7XG52YXIgTWF0aFV0aWwgPSBfZGVyZXFfKCcuLi9tYXRoLXV0aWwuanMnKTtcbnZhciBVdGlsID0gX2RlcmVxXygnLi4vdXRpbC5qcycpO1xuXG4vKipcbiAqIFRoZSBwb3NlIHNlbnNvciwgaW1wbGVtZW50ZWQgdXNpbmcgRGV2aWNlTW90aW9uIEFQSXMuXG4gKi9cbmZ1bmN0aW9uIEZ1c2lvblBvc2VTZW5zb3IoKSB7XG4gIHRoaXMuZGV2aWNlSWQgPSAnd2VidnItcG9seWZpbGw6ZnVzZWQnO1xuICB0aGlzLmRldmljZU5hbWUgPSAnVlIgUG9zaXRpb24gRGV2aWNlICh3ZWJ2ci1wb2x5ZmlsbDpmdXNlZCknO1xuXG4gIHRoaXMuYWNjZWxlcm9tZXRlciA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG4gIHRoaXMuZ3lyb3Njb3BlID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcblxuICB0aGlzLnN0YXJ0KCk7XG5cbiAgdGhpcy5maWx0ZXIgPSBuZXcgQ29tcGxlbWVudGFyeUZpbHRlcihXZWJWUkNvbmZpZy5LX0ZJTFRFUik7XG4gIHRoaXMucG9zZVByZWRpY3RvciA9IG5ldyBQb3NlUHJlZGljdG9yKFdlYlZSQ29uZmlnLlBSRURJQ1RJT05fVElNRV9TKTtcbiAgdGhpcy50b3VjaFBhbm5lciA9IG5ldyBUb3VjaFBhbm5lcigpO1xuXG4gIHRoaXMuZmlsdGVyVG9Xb3JsZFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuXG4gIC8vIFNldCB0aGUgZmlsdGVyIHRvIHdvcmxkIHRyYW5zZm9ybSwgZGVwZW5kaW5nIG9uIE9TLlxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgdGhpcy5maWx0ZXJUb1dvcmxkUS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBNYXRoVXRpbC5WZWN0b3IzKDEsIDAsIDApLCBNYXRoLlBJIC8gMik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5maWx0ZXJUb1dvcmxkUS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBNYXRoVXRpbC5WZWN0b3IzKDEsIDAsIDApLCAtTWF0aC5QSSAvIDIpO1xuICB9XG5cbiAgdGhpcy5pbnZlcnNlV29ybGRUb1NjcmVlblEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB0aGlzLndvcmxkVG9TY3JlZW5RID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdGhpcy5vcmlnaW5hbFBvc2VBZGp1c3RRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdGhpcy5vcmlnaW5hbFBvc2VBZGp1c3RRLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMCwgMCwgMSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLXdpbmRvdy5vcmllbnRhdGlvbiAqIE1hdGguUEkgLyAxODApO1xuXG4gIHRoaXMuc2V0U2NyZWVuVHJhbnNmb3JtXygpO1xuICAvLyBBZGp1c3QgdGhpcyBmaWx0ZXIgZm9yIGJlaW5nIGluIGxhbmRzY2FwZSBtb2RlLlxuICBpZiAoVXRpbC5pc0xhbmRzY2FwZU1vZGUoKSkge1xuICAgIHRoaXMuZmlsdGVyVG9Xb3JsZFEubXVsdGlwbHkodGhpcy5pbnZlcnNlV29ybGRUb1NjcmVlblEpO1xuICB9XG5cbiAgLy8gS2VlcCB0cmFjayBvZiBhIHJlc2V0IHRyYW5zZm9ybSBmb3IgcmVzZXRTZW5zb3IuXG4gIHRoaXMucmVzZXRRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcblxuICB0aGlzLmlzRmlyZWZveEFuZHJvaWQgPSBVdGlsLmlzRmlyZWZveEFuZHJvaWQoKTtcbiAgdGhpcy5pc0lPUyA9IFV0aWwuaXNJT1MoKTtcblxuICB0aGlzLm9yaWVudGF0aW9uT3V0XyA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG59XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLmdldFBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRoaXMgUG9zZVNlbnNvciBkb2Vzbid0IHN1cHBvcnQgcG9zaXRpb25cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5nZXRPcmllbnRhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAvLyBDb252ZXJ0IGZyb20gZmlsdGVyIHNwYWNlIHRvIHRoZSB0aGUgc2FtZSBzeXN0ZW0gdXNlZCBieSB0aGVcbiAgLy8gZGV2aWNlb3JpZW50YXRpb24gZXZlbnQuXG4gIHZhciBvcmllbnRhdGlvbiA9IHRoaXMuZmlsdGVyLmdldE9yaWVudGF0aW9uKCk7XG5cbiAgLy8gUHJlZGljdCBvcmllbnRhdGlvbi5cbiAgdGhpcy5wcmVkaWN0ZWRRID0gdGhpcy5wb3NlUHJlZGljdG9yLmdldFByZWRpY3Rpb24ob3JpZW50YXRpb24sIHRoaXMuZ3lyb3Njb3BlLCB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyk7XG5cbiAgLy8gQ29udmVydCB0byBUSFJFRSBjb29yZGluYXRlIHN5c3RlbTogLVogZm9yd2FyZCwgWSB1cCwgWCByaWdodC5cbiAgdmFyIG91dCA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIG91dC5jb3B5KHRoaXMuZmlsdGVyVG9Xb3JsZFEpO1xuICBvdXQubXVsdGlwbHkodGhpcy5yZXNldFEpO1xuICBpZiAoIVdlYlZSQ29uZmlnLlRPVUNIX1BBTk5FUl9ESVNBQkxFRCkge1xuICAgIG91dC5tdWx0aXBseSh0aGlzLnRvdWNoUGFubmVyLmdldE9yaWVudGF0aW9uKCkpO1xuICB9XG4gIG91dC5tdWx0aXBseSh0aGlzLnByZWRpY3RlZFEpO1xuICBvdXQubXVsdGlwbHkodGhpcy53b3JsZFRvU2NyZWVuUSk7XG5cbiAgLy8gSGFuZGxlIHRoZSB5YXctb25seSBjYXNlLlxuICBpZiAoV2ViVlJDb25maWcuWUFXX09OTFkpIHtcbiAgICAvLyBNYWtlIGEgcXVhdGVybmlvbiB0aGF0IG9ubHkgdHVybnMgYXJvdW5kIHRoZSBZLWF4aXMuXG4gICAgb3V0LnggPSAwO1xuICAgIG91dC56ID0gMDtcbiAgICBvdXQubm9ybWFsaXplKCk7XG4gIH1cblxuICB0aGlzLm9yaWVudGF0aW9uT3V0X1swXSA9IG91dC54O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1sxXSA9IG91dC55O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1syXSA9IG91dC56O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1szXSA9IG91dC53O1xuICByZXR1cm4gdGhpcy5vcmllbnRhdGlvbk91dF87XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5yZXNldFBvc2UgPSBmdW5jdGlvbigpIHtcbiAgLy8gUmVkdWNlIHRvIGludmVydGVkIHlhdy1vbmx5LlxuICB0aGlzLnJlc2V0US5jb3B5KHRoaXMuZmlsdGVyLmdldE9yaWVudGF0aW9uKCkpO1xuICB0aGlzLnJlc2V0US54ID0gMDtcbiAgdGhpcy5yZXNldFEueSA9IDA7XG4gIHRoaXMucmVzZXRRLnogKj0gLTE7XG4gIHRoaXMucmVzZXRRLm5vcm1hbGl6ZSgpO1xuXG4gIC8vIFRha2UgaW50byBhY2NvdW50IGV4dHJhIHRyYW5zZm9ybWF0aW9ucyBpbiBsYW5kc2NhcGUgbW9kZS5cbiAgaWYgKFV0aWwuaXNMYW5kc2NhcGVNb2RlKCkpIHtcbiAgICB0aGlzLnJlc2V0US5tdWx0aXBseSh0aGlzLmludmVyc2VXb3JsZFRvU2NyZWVuUSk7XG4gIH1cblxuICAvLyBUYWtlIGludG8gYWNjb3VudCBvcmlnaW5hbCBwb3NlLlxuICB0aGlzLnJlc2V0US5tdWx0aXBseSh0aGlzLm9yaWdpbmFsUG9zZUFkanVzdFEpO1xuXG4gIGlmICghV2ViVlJDb25maWcuVE9VQ0hfUEFOTkVSX0RJU0FCTEVEKSB7XG4gICAgdGhpcy50b3VjaFBhbm5lci5yZXNldFNlbnNvcigpO1xuICB9XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5vbkRldmljZU1vdGlvbl8gPSBmdW5jdGlvbihkZXZpY2VNb3Rpb24pIHtcbiAgdGhpcy51cGRhdGVEZXZpY2VNb3Rpb25fKGRldmljZU1vdGlvbik7XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS51cGRhdGVEZXZpY2VNb3Rpb25fID0gZnVuY3Rpb24oZGV2aWNlTW90aW9uKSB7XG4gIHZhciBhY2NHcmF2aXR5ID0gZGV2aWNlTW90aW9uLmFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHk7XG4gIHZhciByb3RSYXRlID0gZGV2aWNlTW90aW9uLnJvdGF0aW9uUmF0ZTtcbiAgdmFyIHRpbWVzdGFtcFMgPSBkZXZpY2VNb3Rpb24udGltZVN0YW1wIC8gMTAwMDtcblxuICAvLyBGaXJlZm94IEFuZHJvaWQgdGltZVN0YW1wIHJldHVybnMgb25lIHRob3VzYW5kdGggb2YgYSBtaWxsaXNlY29uZC5cbiAgaWYgKHRoaXMuaXNGaXJlZm94QW5kcm9pZCkge1xuICAgIHRpbWVzdGFtcFMgLz0gMTAwMDtcbiAgfVxuXG4gIHZhciBkZWx0YVMgPSB0aW1lc3RhbXBTIC0gdGhpcy5wcmV2aW91c1RpbWVzdGFtcFM7XG4gIGlmIChkZWx0YVMgPD0gVXRpbC5NSU5fVElNRVNURVAgfHwgZGVsdGFTID4gVXRpbC5NQVhfVElNRVNURVApIHtcbiAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgdGltZXN0YW1wcyBkZXRlY3RlZC4gVGltZSBzdGVwIGJldHdlZW4gc3VjY2Vzc2l2ZSAnICtcbiAgICAgICAgICAgICAgICAgJ2d5cm9zY29wZSBzZW5zb3Igc2FtcGxlcyBpcyB2ZXJ5IHNtYWxsIG9yIG5vdCBtb25vdG9uaWMnKTtcbiAgICB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuYWNjZWxlcm9tZXRlci5zZXQoLWFjY0dyYXZpdHkueCwgLWFjY0dyYXZpdHkueSwgLWFjY0dyYXZpdHkueik7XG4gIHRoaXMuZ3lyb3Njb3BlLnNldChyb3RSYXRlLmFscGhhLCByb3RSYXRlLmJldGEsIHJvdFJhdGUuZ2FtbWEpO1xuXG4gIC8vIFdpdGggaU9TIGFuZCBGaXJlZm94IEFuZHJvaWQsIHJvdGF0aW9uUmF0ZSBpcyByZXBvcnRlZCBpbiBkZWdyZWVzLFxuICAvLyBzbyB3ZSBmaXJzdCBjb252ZXJ0IHRvIHJhZGlhbnMuXG4gIGlmICh0aGlzLmlzSU9TIHx8IHRoaXMuaXNGaXJlZm94QW5kcm9pZCkge1xuICAgIHRoaXMuZ3lyb3Njb3BlLm11bHRpcGx5U2NhbGFyKE1hdGguUEkgLyAxODApO1xuICB9XG5cbiAgdGhpcy5maWx0ZXIuYWRkQWNjZWxNZWFzdXJlbWVudCh0aGlzLmFjY2VsZXJvbWV0ZXIsIHRpbWVzdGFtcFMpO1xuICB0aGlzLmZpbHRlci5hZGRHeXJvTWVhc3VyZW1lbnQodGhpcy5neXJvc2NvcGUsIHRpbWVzdGFtcFMpO1xuXG4gIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTID0gdGltZXN0YW1wUztcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLm9uT3JpZW50YXRpb25DaGFuZ2VfID0gZnVuY3Rpb24oc2NyZWVuT3JpZW50YXRpb24pIHtcbiAgdGhpcy5zZXRTY3JlZW5UcmFuc2Zvcm1fKCk7XG59O1xuXG4vKipcbiAqIFRoaXMgaXMgb25seSBuZWVkZWQgaWYgd2UgYXJlIGluIGFuIGNyb3NzIG9yaWdpbiBpZnJhbWUgb24gaU9TIHRvIHdvcmsgYXJvdW5kXG4gKiB0aGlzIGlzc3VlOiBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTUyMjk5LlxuICovXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5vbk1lc3NhZ2VfID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgdmFyIG1lc3NhZ2UgPSBldmVudC5kYXRhO1xuXG4gIC8vIElmIHRoZXJlJ3Mgbm8gbWVzc2FnZSB0eXBlLCBpZ25vcmUgaXQuXG4gIGlmICghbWVzc2FnZSB8fCAhbWVzc2FnZS50eXBlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSWdub3JlIGFsbCBtZXNzYWdlcyB0aGF0IGFyZW4ndCBkZXZpY2Vtb3Rpb24uXG4gIHZhciB0eXBlID0gbWVzc2FnZS50eXBlLnRvTG93ZXJDYXNlKCk7XG4gIGlmICh0eXBlICE9PSAnZGV2aWNlbW90aW9uJykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFVwZGF0ZSBkZXZpY2UgbW90aW9uLlxuICB0aGlzLnVwZGF0ZURldmljZU1vdGlvbl8obWVzc2FnZS5kZXZpY2VNb3Rpb25FdmVudCk7XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5zZXRTY3JlZW5UcmFuc2Zvcm1fID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMud29ybGRUb1NjcmVlblEuc2V0KDAsIDAsIDAsIDEpO1xuICBzd2l0Y2ggKHdpbmRvdy5vcmllbnRhdGlvbikge1xuICAgIGNhc2UgMDpcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgOTA6XG4gICAgICB0aGlzLndvcmxkVG9TY3JlZW5RLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMCwgMCwgMSksIC1NYXRoLlBJIC8gMik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIC05MDpcbiAgICAgIHRoaXMud29ybGRUb1NjcmVlblEuc2V0RnJvbUF4aXNBbmdsZShuZXcgTWF0aFV0aWwuVmVjdG9yMygwLCAwLCAxKSwgTWF0aC5QSSAvIDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAxODA6XG4gICAgICAvLyBUT0RPLlxuICAgICAgYnJlYWs7XG4gIH1cbiAgdGhpcy5pbnZlcnNlV29ybGRUb1NjcmVlblEuY29weSh0aGlzLndvcmxkVG9TY3JlZW5RKTtcbiAgdGhpcy5pbnZlcnNlV29ybGRUb1NjcmVlblEuaW52ZXJzZSgpO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vbkRldmljZU1vdGlvbkNhbGxiYWNrXyA9IHRoaXMub25EZXZpY2VNb3Rpb25fLmJpbmQodGhpcyk7XG4gIHRoaXMub25PcmllbnRhdGlvbkNoYW5nZUNhbGxiYWNrXyA9IHRoaXMub25PcmllbnRhdGlvbkNoYW5nZV8uYmluZCh0aGlzKTtcbiAgdGhpcy5vbk1lc3NhZ2VDYWxsYmFja18gPSB0aGlzLm9uTWVzc2FnZV8uYmluZCh0aGlzKTtcblxuICAvLyBPbmx5IGxpc3RlbiBmb3IgcG9zdE1lc3NhZ2VzIGlmIHdlJ3JlIGluIGFuIGlPUyBhbmQgZW1iZWRkZWQgaW5zaWRlIGEgY3Jvc3NcbiAgLy8gZG9tYWluIElGcmFtZS4gSW4gdGhpcyBjYXNlLCB0aGUgcG9seWZpbGwgY2FuIHN0aWxsIHdvcmsgaWYgdGhlIGNvbnRhaW5pbmdcbiAgLy8gcGFnZSBzZW5kcyBzeW50aGV0aWMgZGV2aWNlbW90aW9uIGV2ZW50cy4gRm9yIGFuIGV4YW1wbGUgb2YgdGhpcywgc2VlXG4gIC8vIGlmcmFtZS1tZXNzYWdlLXNlbmRlci5qcyBpbiBWUiBWaWV3OiBodHRwczovL2dvby5nbC9YRHR2RlpcbiAgaWYgKFV0aWwuaXNJT1MoKSAmJiBVdGlsLmlzSW5zaWRlQ3Jvc3NEb21haW5JRnJhbWUoKSkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5vbk1lc3NhZ2VDYWxsYmFja18pO1xuICB9XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHRoaXMub25PcmllbnRhdGlvbkNoYW5nZUNhbGxiYWNrXyk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2Vtb3Rpb24nLCB0aGlzLm9uRGV2aWNlTW90aW9uQ2FsbGJhY2tfKTtcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RldmljZW1vdGlvbicsIHRoaXMub25EZXZpY2VNb3Rpb25DYWxsYmFja18pO1xuICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignb3JpZW50YXRpb25jaGFuZ2UnLCB0aGlzLm9uT3JpZW50YXRpb25DaGFuZ2VDYWxsYmFja18pO1xuICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMub25NZXNzYWdlQ2FsbGJhY2tfKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRnVzaW9uUG9zZVNlbnNvcjtcblxufSx7XCIuLi9tYXRoLXV0aWwuanNcIjoxNCxcIi4uL3RvdWNoLXBhbm5lci5qc1wiOjIxLFwiLi4vdXRpbC5qc1wiOjIyLFwiLi9jb21wbGVtZW50YXJ5LWZpbHRlci5qc1wiOjE3LFwiLi9wb3NlLXByZWRpY3Rvci5qc1wiOjE5fV0sMTk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBNYXRoVXRpbCA9IF9kZXJlcV8oJy4uL21hdGgtdXRpbCcpO1xudmFyIFV0aWwgPSBfZGVyZXFfKCcuLi91dGlsJyk7XG5cbi8qKlxuICogR2l2ZW4gYW4gb3JpZW50YXRpb24gYW5kIHRoZSBneXJvc2NvcGUgZGF0YSwgcHJlZGljdHMgdGhlIGZ1dHVyZSBvcmllbnRhdGlvblxuICogb2YgdGhlIGhlYWQuIFRoaXMgbWFrZXMgcmVuZGVyaW5nIGFwcGVhciBmYXN0ZXIuXG4gKlxuICogQWxzbyBzZWU6IGh0dHA6Ly9tc2wuY3MudWl1Yy5lZHUvfmxhdmFsbGUvcGFwZXJzL0xhdlllckthdEFudDE0LnBkZlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVkaWN0aW9uVGltZVMgdGltZSBmcm9tIGhlYWQgbW92ZW1lbnQgdG8gdGhlIGFwcGVhcmFuY2Ugb2ZcbiAqIHRoZSBjb3JyZXNwb25kaW5nIGltYWdlLlxuICovXG5mdW5jdGlvbiBQb3NlUHJlZGljdG9yKHByZWRpY3Rpb25UaW1lUykge1xuICB0aGlzLnByZWRpY3Rpb25UaW1lUyA9IHByZWRpY3Rpb25UaW1lUztcblxuICAvLyBUaGUgcXVhdGVybmlvbiBjb3JyZXNwb25kaW5nIHRvIHRoZSBwcmV2aW91cyBzdGF0ZS5cbiAgdGhpcy5wcmV2aW91c1EgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICAvLyBQcmV2aW91cyB0aW1lIGEgcHJlZGljdGlvbiBvY2N1cnJlZC5cbiAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSBudWxsO1xuXG4gIC8vIFRoZSBkZWx0YSBxdWF0ZXJuaW9uIHRoYXQgYWRqdXN0cyB0aGUgY3VycmVudCBwb3NlLlxuICB0aGlzLmRlbHRhUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIC8vIFRoZSBvdXRwdXQgcXVhdGVybmlvbi5cbiAgdGhpcy5vdXRRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbn1cblxuUG9zZVByZWRpY3Rvci5wcm90b3R5cGUuZ2V0UHJlZGljdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRRLCBneXJvLCB0aW1lc3RhbXBTKSB7XG4gIGlmICghdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMpIHtcbiAgICB0aGlzLnByZXZpb3VzUS5jb3B5KGN1cnJlbnRRKTtcbiAgICB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG4gICAgcmV0dXJuIGN1cnJlbnRRO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIGF4aXMgYW5kIGFuZ2xlIGJhc2VkIG9uIGd5cm9zY29wZSByb3RhdGlvbiByYXRlIGRhdGEuXG4gIHZhciBheGlzID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgYXhpcy5jb3B5KGd5cm8pO1xuICBheGlzLm5vcm1hbGl6ZSgpO1xuXG4gIHZhciBhbmd1bGFyU3BlZWQgPSBneXJvLmxlbmd0aCgpO1xuXG4gIC8vIElmIHdlJ3JlIHJvdGF0aW5nIHNsb3dseSwgZG9uJ3QgZG8gcHJlZGljdGlvbi5cbiAgaWYgKGFuZ3VsYXJTcGVlZCA8IE1hdGhVdGlsLmRlZ1RvUmFkICogMjApIHtcbiAgICBpZiAoVXRpbC5pc0RlYnVnKCkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNb3Zpbmcgc2xvd2x5LCBhdCAlcyBkZWcvczogbm8gcHJlZGljdGlvbicsXG4gICAgICAgICAgICAgICAgICAoTWF0aFV0aWwucmFkVG9EZWcgKiBhbmd1bGFyU3BlZWQpLnRvRml4ZWQoMSkpO1xuICAgIH1cbiAgICB0aGlzLm91dFEuY29weShjdXJyZW50USk7XG4gICAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG4gICAgcmV0dXJuIHRoaXMub3V0UTtcbiAgfVxuXG4gIC8vIEdldCB0aGUgcHJlZGljdGVkIGFuZ2xlIGJhc2VkIG9uIHRoZSB0aW1lIGRlbHRhIGFuZCBsYXRlbmN5LlxuICB2YXIgZGVsdGFUID0gdGltZXN0YW1wUyAtIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTO1xuICB2YXIgcHJlZGljdEFuZ2xlID0gYW5ndWxhclNwZWVkICogdGhpcy5wcmVkaWN0aW9uVGltZVM7XG5cbiAgdGhpcy5kZWx0YVEuc2V0RnJvbUF4aXNBbmdsZShheGlzLCBwcmVkaWN0QW5nbGUpO1xuICB0aGlzLm91dFEuY29weSh0aGlzLnByZXZpb3VzUSk7XG4gIHRoaXMub3V0US5tdWx0aXBseSh0aGlzLmRlbHRhUSk7XG5cbiAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG4gIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTID0gdGltZXN0YW1wUztcblxuICByZXR1cm4gdGhpcy5vdXRRO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2VQcmVkaWN0b3I7XG5cbn0se1wiLi4vbWF0aC11dGlsXCI6MTQsXCIuLi91dGlsXCI6MjJ9XSwyMDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5mdW5jdGlvbiBTZW5zb3JTYW1wbGUoc2FtcGxlLCB0aW1lc3RhbXBTKSB7XG4gIHRoaXMuc2V0KHNhbXBsZSwgdGltZXN0YW1wUyk7XG59O1xuXG5TZW5zb3JTYW1wbGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKHNhbXBsZSwgdGltZXN0YW1wUykge1xuICB0aGlzLnNhbXBsZSA9IHNhbXBsZTtcbiAgdGhpcy50aW1lc3RhbXBTID0gdGltZXN0YW1wUztcbn07XG5cblNlbnNvclNhbXBsZS5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uKHNlbnNvclNhbXBsZSkge1xuICB0aGlzLnNldChzZW5zb3JTYW1wbGUuc2FtcGxlLCBzZW5zb3JTYW1wbGUudGltZXN0YW1wUyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbnNvclNhbXBsZTtcblxufSx7fV0sMjE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBNYXRoVXRpbCA9IF9kZXJlcV8oJy4vbWF0aC11dGlsLmpzJyk7XG52YXIgVXRpbCA9IF9kZXJlcV8oJy4vdXRpbC5qcycpO1xuXG52YXIgUk9UQVRFX1NQRUVEID0gMC41O1xuLyoqXG4gKiBQcm92aWRlcyBhIHF1YXRlcm5pb24gcmVzcG9uc2libGUgZm9yIHByZS1wYW5uaW5nIHRoZSBzY2VuZSBiZWZvcmUgZnVydGhlclxuICogdHJhbnNmb3JtYXRpb25zIGR1ZSB0byBkZXZpY2Ugc2Vuc29ycy5cbiAqL1xuZnVuY3Rpb24gVG91Y2hQYW5uZXIoKSB7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5vblRvdWNoU3RhcnRfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZV8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZF8uYmluZCh0aGlzKSk7XG5cbiAgdGhpcy5pc1RvdWNoaW5nID0gZmFsc2U7XG4gIHRoaXMucm90YXRlU3RhcnQgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMigpO1xuICB0aGlzLnJvdGF0ZUVuZCA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRGVsdGEgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMigpO1xuXG4gIHRoaXMudGhldGEgPSAwO1xuICB0aGlzLm9yaWVudGF0aW9uID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbn1cblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLmdldE9yaWVudGF0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub3JpZW50YXRpb24uc2V0RnJvbUV1bGVyWFlaKDAsIDAsIHRoaXMudGhldGEpO1xuICByZXR1cm4gdGhpcy5vcmllbnRhdGlvbjtcbn07XG5cblRvdWNoUGFubmVyLnByb3RvdHlwZS5yZXNldFNlbnNvciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnRoZXRhID0gMDtcbn07XG5cblRvdWNoUGFubmVyLnByb3RvdHlwZS5vblRvdWNoU3RhcnRfID0gZnVuY3Rpb24oZSkge1xuICAvLyBPbmx5IHJlc3BvbmQgaWYgdGhlcmUgaXMgZXhhY3RseSBvbmUgdG91Y2guXG4gIGlmIChlLnRvdWNoZXMubGVuZ3RoICE9IDEpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5yb3RhdGVTdGFydC5zZXQoZS50b3VjaGVzWzBdLnBhZ2VYLCBlLnRvdWNoZXNbMF0ucGFnZVkpO1xuICB0aGlzLmlzVG91Y2hpbmcgPSB0cnVlO1xufTtcblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLm9uVG91Y2hNb3ZlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKCF0aGlzLmlzVG91Y2hpbmcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5yb3RhdGVFbmQuc2V0KGUudG91Y2hlc1swXS5wYWdlWCwgZS50b3VjaGVzWzBdLnBhZ2VZKTtcbiAgdGhpcy5yb3RhdGVEZWx0YS5zdWJWZWN0b3JzKHRoaXMucm90YXRlRW5kLCB0aGlzLnJvdGF0ZVN0YXJ0KTtcbiAgdGhpcy5yb3RhdGVTdGFydC5jb3B5KHRoaXMucm90YXRlRW5kKTtcblxuICAvLyBPbiBpT1MsIGRpcmVjdGlvbiBpcyBpbnZlcnRlZC5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHRoaXMucm90YXRlRGVsdGEueCAqPSAtMTtcbiAgfVxuXG4gIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcbiAgdGhpcy50aGV0YSArPSAyICogTWF0aC5QSSAqIHRoaXMucm90YXRlRGVsdGEueCAvIGVsZW1lbnQuY2xpZW50V2lkdGggKiBST1RBVEVfU1BFRUQ7XG59O1xuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUub25Ub3VjaEVuZF8gPSBmdW5jdGlvbihlKSB7XG4gIHRoaXMuaXNUb3VjaGluZyA9IGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb3VjaFBhbm5lcjtcblxufSx7XCIuL21hdGgtdXRpbC5qc1wiOjE0LFwiLi91dGlsLmpzXCI6MjJ9XSwyMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgb2JqZWN0QXNzaWduID0gX2RlcmVxXygnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgVXRpbCA9IHdpbmRvdy5VdGlsIHx8IHt9O1xuXG5VdGlsLk1JTl9USU1FU1RFUCA9IDAuMDAxO1xuVXRpbC5NQVhfVElNRVNURVAgPSAxO1xuXG5VdGlsLmJhc2U2NCA9IGZ1bmN0aW9uKG1pbWVUeXBlLCBiYXNlNjQpIHtcbiAgcmV0dXJuICdkYXRhOicgKyBtaW1lVHlwZSArICc7YmFzZTY0LCcgKyBiYXNlNjQ7XG59O1xuXG5VdGlsLmNsYW1wID0gZnVuY3Rpb24odmFsdWUsIG1pbiwgbWF4KSB7XG4gIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChtaW4sIHZhbHVlKSwgbWF4KTtcbn07XG5cblV0aWwubGVycCA9IGZ1bmN0aW9uKGEsIGIsIHQpIHtcbiAgcmV0dXJuIGEgKyAoKGIgLSBhKSAqIHQpO1xufTtcblxuVXRpbC5pc0lPUyA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGlzSU9TID0gL2lQYWR8aVBob25lfGlQb2QvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBpc0lPUztcbiAgfTtcbn0pKCk7XG5cblV0aWwuaXNTYWZhcmkgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBpc1NhZmFyaSA9IC9eKCg/IWNocm9tZXxhbmRyb2lkKS4pKnNhZmFyaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gaXNTYWZhcmk7XG4gIH07XG59KSgpO1xuXG5VdGlsLmlzRmlyZWZveEFuZHJvaWQgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBpc0ZpcmVmb3hBbmRyb2lkID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdGaXJlZm94JykgIT09IC0xICYmXG4gICAgICBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSAhPT0gLTE7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gaXNGaXJlZm94QW5kcm9pZDtcbiAgfTtcbn0pKCk7XG5cblV0aWwuaXNMYW5kc2NhcGVNb2RlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAod2luZG93Lm9yaWVudGF0aW9uID09IDkwIHx8IHdpbmRvdy5vcmllbnRhdGlvbiA9PSAtOTApO1xufTtcblxuLy8gSGVscGVyIG1ldGhvZCB0byB2YWxpZGF0ZSB0aGUgdGltZSBzdGVwcyBvZiBzZW5zb3IgdGltZXN0YW1wcy5cblV0aWwuaXNUaW1lc3RhbXBEZWx0YVZhbGlkID0gZnVuY3Rpb24odGltZXN0YW1wRGVsdGFTKSB7XG4gIGlmIChpc05hTih0aW1lc3RhbXBEZWx0YVMpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0aW1lc3RhbXBEZWx0YVMgPD0gVXRpbC5NSU5fVElNRVNURVApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHRpbWVzdGFtcERlbHRhUyA+IFV0aWwuTUFYX1RJTUVTVEVQKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxuVXRpbC5nZXRTY3JlZW5XaWR0aCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5tYXgod2luZG93LnNjcmVlbi53aWR0aCwgd2luZG93LnNjcmVlbi5oZWlnaHQpICpcbiAgICAgIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xufTtcblxuVXRpbC5nZXRTY3JlZW5IZWlnaHQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIE1hdGgubWluKHdpbmRvdy5zY3JlZW4ud2lkdGgsIHdpbmRvdy5zY3JlZW4uaGVpZ2h0KSAqXG4gICAgICB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbn07XG5cblV0aWwucmVxdWVzdEZ1bGxzY3JlZW4gPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gIGlmIChlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbikge1xuICAgIGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblV0aWwuZXhpdEZ1bGxzY3JlZW4gPSBmdW5jdGlvbigpIHtcbiAgaWYgKGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKSB7XG4gICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbikge1xuICAgIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC5tc0V4aXRGdWxsc2NyZWVuKSB7XG4gICAgZG9jdW1lbnQubXNFeGl0RnVsbHNjcmVlbigpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuVXRpbC5nZXRGdWxsc2NyZWVuRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgIGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fFxuICAgICAgZG9jdW1lbnQubXNGdWxsc2NyZWVuRWxlbWVudDtcbn07XG5cblV0aWwubGlua1Byb2dyYW0gPSBmdW5jdGlvbihnbCwgdmVydGV4U291cmNlLCBmcmFnbWVudFNvdXJjZSwgYXR0cmliTG9jYXRpb25NYXApIHtcbiAgLy8gTm8gZXJyb3IgY2hlY2tpbmcgZm9yIGJyZXZpdHkuXG4gIHZhciB2ZXJ0ZXhTaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUik7XG4gIGdsLnNoYWRlclNvdXJjZSh2ZXJ0ZXhTaGFkZXIsIHZlcnRleFNvdXJjZSk7XG4gIGdsLmNvbXBpbGVTaGFkZXIodmVydGV4U2hhZGVyKTtcblxuICB2YXIgZnJhZ21lbnRTaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuRlJBR01FTlRfU0hBREVSKTtcbiAgZ2wuc2hhZGVyU291cmNlKGZyYWdtZW50U2hhZGVyLCBmcmFnbWVudFNvdXJjZSk7XG4gIGdsLmNvbXBpbGVTaGFkZXIoZnJhZ21lbnRTaGFkZXIpO1xuXG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdmVydGV4U2hhZGVyKTtcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZyYWdtZW50U2hhZGVyKTtcblxuICBmb3IgKHZhciBhdHRyaWJOYW1lIGluIGF0dHJpYkxvY2F0aW9uTWFwKVxuICAgIGdsLmJpbmRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBhdHRyaWJMb2NhdGlvbk1hcFthdHRyaWJOYW1lXSwgYXR0cmliTmFtZSk7XG5cbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG5cbiAgZ2wuZGVsZXRlU2hhZGVyKHZlcnRleFNoYWRlcik7XG4gIGdsLmRlbGV0ZVNoYWRlcihmcmFnbWVudFNoYWRlcik7XG5cbiAgcmV0dXJuIHByb2dyYW07XG59O1xuXG5VdGlsLmdldFByb2dyYW1Vbmlmb3JtcyA9IGZ1bmN0aW9uKGdsLCBwcm9ncmFtKSB7XG4gIHZhciB1bmlmb3JtcyA9IHt9O1xuICB2YXIgdW5pZm9ybUNvdW50ID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5BQ1RJVkVfVU5JRk9STVMpO1xuICB2YXIgdW5pZm9ybU5hbWUgPSAnJztcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB1bmlmb3JtQ291bnQ7IGkrKykge1xuICAgIHZhciB1bmlmb3JtSW5mbyA9IGdsLmdldEFjdGl2ZVVuaWZvcm0ocHJvZ3JhbSwgaSk7XG4gICAgdW5pZm9ybU5hbWUgPSB1bmlmb3JtSW5mby5uYW1lLnJlcGxhY2UoJ1swXScsICcnKTtcbiAgICB1bmlmb3Jtc1t1bmlmb3JtTmFtZV0gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgdW5pZm9ybU5hbWUpO1xuICB9XG4gIHJldHVybiB1bmlmb3Jtcztcbn07XG5cblV0aWwub3J0aG9NYXRyaXggPSBmdW5jdGlvbiAob3V0LCBsZWZ0LCByaWdodCwgYm90dG9tLCB0b3AsIG5lYXIsIGZhcikge1xuICB2YXIgbHIgPSAxIC8gKGxlZnQgLSByaWdodCksXG4gICAgICBidCA9IDEgLyAoYm90dG9tIC0gdG9wKSxcbiAgICAgIG5mID0gMSAvIChuZWFyIC0gZmFyKTtcbiAgb3V0WzBdID0gLTIgKiBscjtcbiAgb3V0WzFdID0gMDtcbiAgb3V0WzJdID0gMDtcbiAgb3V0WzNdID0gMDtcbiAgb3V0WzRdID0gMDtcbiAgb3V0WzVdID0gLTIgKiBidDtcbiAgb3V0WzZdID0gMDtcbiAgb3V0WzddID0gMDtcbiAgb3V0WzhdID0gMDtcbiAgb3V0WzldID0gMDtcbiAgb3V0WzEwXSA9IDIgKiBuZjtcbiAgb3V0WzExXSA9IDA7XG4gIG91dFsxMl0gPSAobGVmdCArIHJpZ2h0KSAqIGxyO1xuICBvdXRbMTNdID0gKHRvcCArIGJvdHRvbSkgKiBidDtcbiAgb3V0WzE0XSA9IChmYXIgKyBuZWFyKSAqIG5mO1xuICBvdXRbMTVdID0gMTtcbiAgcmV0dXJuIG91dDtcbn07XG5cblV0aWwuaXNNb2JpbGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNoZWNrID0gZmFsc2U7XG4gIChmdW5jdGlvbihhKXtpZigvKGFuZHJvaWR8YmJcXGQrfG1lZWdvKS4rbW9iaWxlfGF2YW50Z298YmFkYVxcL3xibGFja2JlcnJ5fGJsYXplcnxjb21wYWx8ZWxhaW5lfGZlbm5lY3xoaXB0b3B8aWVtb2JpbGV8aXAoaG9uZXxvZCl8aXJpc3xraW5kbGV8bGdlIHxtYWVtb3xtaWRwfG1tcHxtb2JpbGUuK2ZpcmVmb3h8bmV0ZnJvbnR8b3BlcmEgbShvYnxpbilpfHBhbG0oIG9zKT98cGhvbmV8cChpeGl8cmUpXFwvfHBsdWNrZXJ8cG9ja2V0fHBzcHxzZXJpZXMoNHw2KTB8c3ltYmlhbnx0cmVvfHVwXFwuKGJyb3dzZXJ8bGluayl8dm9kYWZvbmV8d2FwfHdpbmRvd3MgY2V8eGRhfHhpaW5vL2kudGVzdChhKXx8LzEyMDd8NjMxMHw2NTkwfDNnc298NHRocHw1MFsxLTZdaXw3NzBzfDgwMnN8YSB3YXxhYmFjfGFjKGVyfG9vfHNcXC0pfGFpKGtvfHJuKXxhbChhdnxjYXxjbyl8YW1vaXxhbihleHxueXx5dyl8YXB0dXxhcihjaHxnbyl8YXModGV8dXMpfGF0dHd8YXUoZGl8XFwtbXxyIHxzICl8YXZhbnxiZShja3xsbHxucSl8YmkobGJ8cmQpfGJsKGFjfGF6KXxicihlfHYpd3xidW1ifGJ3XFwtKG58dSl8YzU1XFwvfGNhcGl8Y2N3YXxjZG1cXC18Y2VsbHxjaHRtfGNsZGN8Y21kXFwtfGNvKG1wfG5kKXxjcmF3fGRhKGl0fGxsfG5nKXxkYnRlfGRjXFwtc3xkZXZpfGRpY2F8ZG1vYnxkbyhjfHApb3xkcygxMnxcXC1kKXxlbCg0OXxhaSl8ZW0obDJ8dWwpfGVyKGljfGswKXxlc2w4fGV6KFs0LTddMHxvc3x3YXx6ZSl8ZmV0Y3xmbHkoXFwtfF8pfGcxIHV8ZzU2MHxnZW5lfGdmXFwtNXxnXFwtbW98Z28oXFwud3xvZCl8Z3IoYWR8dW4pfGhhaWV8aGNpdHxoZFxcLShtfHB8dCl8aGVpXFwtfGhpKHB0fHRhKXxocCggaXxpcCl8aHNcXC1jfGh0KGMoXFwtfCB8X3xhfGd8cHxzfHQpfHRwKXxodShhd3x0Yyl8aVxcLSgyMHxnb3xtYSl8aTIzMHxpYWMoIHxcXC18XFwvKXxpYnJvfGlkZWF8aWcwMXxpa29tfGltMWt8aW5ub3xpcGFxfGlyaXN8amEodHx2KWF8amJyb3xqZW11fGppZ3N8a2RkaXxrZWppfGtndCggfFxcLyl8a2xvbnxrcHQgfGt3Y1xcLXxreW8oY3xrKXxsZShub3x4aSl8bGcoIGd8XFwvKGt8bHx1KXw1MHw1NHxcXC1bYS13XSl8bGlid3xseW54fG0xXFwtd3xtM2dhfG01MFxcL3xtYSh0ZXx1aXx4byl8bWMoMDF8MjF8Y2EpfG1cXC1jcnxtZShyY3xyaSl8bWkobzh8b2F8dHMpfG1tZWZ8bW8oMDF8MDJ8Yml8ZGV8ZG98dChcXC18IHxvfHYpfHp6KXxtdCg1MHxwMXx2ICl8bXdicHxteXdhfG4xMFswLTJdfG4yMFsyLTNdfG4zMCgwfDIpfG41MCgwfDJ8NSl8bjcoMCgwfDEpfDEwKXxuZSgoY3xtKVxcLXxvbnx0Znx3Znx3Z3x3dCl8bm9rKDZ8aSl8bnpwaHxvMmltfG9wKHRpfHd2KXxvcmFufG93ZzF8cDgwMHxwYW4oYXxkfHQpfHBkeGd8cGcoMTN8XFwtKFsxLThdfGMpKXxwaGlsfHBpcmV8cGwoYXl8dWMpfHBuXFwtMnxwbyhja3xydHxzZSl8cHJveHxwc2lvfHB0XFwtZ3xxYVxcLWF8cWMoMDd8MTJ8MjF8MzJ8NjB8XFwtWzItN118aVxcLSl8cXRla3xyMzgwfHI2MDB8cmFrc3xyaW05fHJvKHZlfHpvKXxzNTVcXC98c2EoZ2V8bWF8bW18bXN8bnl8dmEpfHNjKDAxfGhcXC18b298cFxcLSl8c2RrXFwvfHNlKGMoXFwtfDB8MSl8NDd8bWN8bmR8cmkpfHNnaFxcLXxzaGFyfHNpZShcXC18bSl8c2tcXC0wfHNsKDQ1fGlkKXxzbShhbHxhcnxiM3xpdHx0NSl8c28oZnR8bnkpfHNwKDAxfGhcXC18dlxcLXx2ICl8c3koMDF8bWIpfHQyKDE4fDUwKXx0NigwMHwxMHwxOCl8dGEoZ3R8bGspfHRjbFxcLXx0ZGdcXC18dGVsKGl8bSl8dGltXFwtfHRcXC1tb3x0byhwbHxzaCl8dHMoNzB8bVxcLXxtM3xtNSl8dHhcXC05fHVwKFxcLmJ8ZzF8c2kpfHV0c3R8djQwMHx2NzUwfHZlcml8dmkocmd8dGUpfHZrKDQwfDVbMC0zXXxcXC12KXx2bTQwfHZvZGF8dnVsY3x2eCg1Mnw1M3w2MHw2MXw3MHw4MHw4MXw4M3w4NXw5OCl8dzNjKFxcLXwgKXx3ZWJjfHdoaXR8d2koZyB8bmN8bncpfHdtbGJ8d29udXx4NzAwfHlhc1xcLXx5b3VyfHpldG98enRlXFwtL2kudGVzdChhLnN1YnN0cigwLDQpKSljaGVjayA9IHRydWV9KShuYXZpZ2F0b3IudXNlckFnZW50fHxuYXZpZ2F0b3IudmVuZG9yfHx3aW5kb3cub3BlcmEpO1xuICByZXR1cm4gY2hlY2s7XG59O1xuXG5VdGlsLmV4dGVuZCA9IG9iamVjdEFzc2lnbjtcblxuVXRpbC5zYWZhcmlDc3NTaXplV29ya2Fyb3VuZCA9IGZ1bmN0aW9uKGNhbnZhcykge1xuICAvLyBUT0RPKHNtdXMpOiBSZW1vdmUgdGhpcyB3b3JrYXJvdW5kIHdoZW4gU2FmYXJpIGZvciBpT1MgaXMgZml4ZWQuXG4gIC8vIGlPUyBvbmx5IHdvcmthcm91bmQgKGZvciBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTUyNTU2KS5cbiAgLy9cbiAgLy8gXCJUbyB0aGUgbGFzdCBJIGdyYXBwbGUgd2l0aCB0aGVlO1xuICAvLyAgZnJvbSBoZWxsJ3MgaGVhcnQgSSBzdGFiIGF0IHRoZWU7XG4gIC8vICBmb3IgaGF0ZSdzIHNha2UgSSBzcGl0IG15IGxhc3QgYnJlYXRoIGF0IHRoZWUuXCJcbiAgLy8gLS0gTW9ieSBEaWNrLCBieSBIZXJtYW4gTWVsdmlsbGVcbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHZhciB3aWR0aCA9IGNhbnZhcy5zdHlsZS53aWR0aDtcbiAgICB2YXIgaGVpZ2h0ID0gY2FudmFzLnN0eWxlLmhlaWdodDtcbiAgICBjYW52YXMuc3R5bGUud2lkdGggPSAocGFyc2VJbnQod2lkdGgpICsgMSkgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSAocGFyc2VJbnQoaGVpZ2h0KSkgKyAncHgnO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBjYW52YXMuc3R5bGUud2lkdGggPSB3aWR0aDtcbiAgICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfSwgMTAwKTtcbiAgfVxuXG4gIC8vIERlYnVnIG9ubHkuXG4gIHdpbmRvdy5VdGlsID0gVXRpbDtcbiAgd2luZG93LmNhbnZhcyA9IGNhbnZhcztcbn07XG5cblV0aWwuaXNEZWJ1ZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gVXRpbC5nZXRRdWVyeVBhcmFtZXRlcignZGVidWcnKTtcbn07XG5cblV0aWwuZ2V0UXVlcnlQYXJhbWV0ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXS8sIFwiXFxcXFtcIikucmVwbGFjZSgvW1xcXV0vLCBcIlxcXFxdXCIpO1xuICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiW1xcXFw/Jl1cIiArIG5hbWUgKyBcIj0oW14mI10qKVwiKSxcbiAgICAgIHJlc3VsdHMgPSByZWdleC5leGVjKGxvY2F0aW9uLnNlYXJjaCk7XG4gIHJldHVybiByZXN1bHRzID09PSBudWxsID8gXCJcIiA6IGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzFdLnJlcGxhY2UoL1xcKy9nLCBcIiBcIikpO1xufTtcblxuVXRpbC5mcmFtZURhdGFGcm9tUG9zZSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHBpT3ZlcjE4MCA9IE1hdGguUEkgLyAxODAuMDtcbiAgdmFyIHJhZDQ1ID0gTWF0aC5QSSAqIDAuMjU7XG5cbiAgLy8gQm9ycm93ZWQgZnJvbSBnbE1hdHJpeC5cbiAgZnVuY3Rpb24gbWF0NF9wZXJzcGVjdGl2ZUZyb21GaWVsZE9mVmlldyhvdXQsIGZvdiwgbmVhciwgZmFyKSB7XG4gICAgdmFyIHVwVGFuID0gTWF0aC50YW4oZm92ID8gKGZvdi51cERlZ3JlZXMgKiBwaU92ZXIxODApIDogcmFkNDUpLFxuICAgIGRvd25UYW4gPSBNYXRoLnRhbihmb3YgPyAoZm92LmRvd25EZWdyZWVzICogcGlPdmVyMTgwKSA6IHJhZDQ1KSxcbiAgICBsZWZ0VGFuID0gTWF0aC50YW4oZm92ID8gKGZvdi5sZWZ0RGVncmVlcyAqIHBpT3ZlcjE4MCkgOiByYWQ0NSksXG4gICAgcmlnaHRUYW4gPSBNYXRoLnRhbihmb3YgPyAoZm92LnJpZ2h0RGVncmVlcyAqIHBpT3ZlcjE4MCkgOiByYWQ0NSksXG4gICAgeFNjYWxlID0gMi4wIC8gKGxlZnRUYW4gKyByaWdodFRhbiksXG4gICAgeVNjYWxlID0gMi4wIC8gKHVwVGFuICsgZG93blRhbik7XG5cbiAgICBvdXRbMF0gPSB4U2NhbGU7XG4gICAgb3V0WzFdID0gMC4wO1xuICAgIG91dFsyXSA9IDAuMDtcbiAgICBvdXRbM10gPSAwLjA7XG4gICAgb3V0WzRdID0gMC4wO1xuICAgIG91dFs1XSA9IHlTY2FsZTtcbiAgICBvdXRbNl0gPSAwLjA7XG4gICAgb3V0WzddID0gMC4wO1xuICAgIG91dFs4XSA9IC0oKGxlZnRUYW4gLSByaWdodFRhbikgKiB4U2NhbGUgKiAwLjUpO1xuICAgIG91dFs5XSA9ICgodXBUYW4gLSBkb3duVGFuKSAqIHlTY2FsZSAqIDAuNSk7XG4gICAgb3V0WzEwXSA9IGZhciAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMTFdID0gLTEuMDtcbiAgICBvdXRbMTJdID0gMC4wO1xuICAgIG91dFsxM10gPSAwLjA7XG4gICAgb3V0WzE0XSA9IChmYXIgKiBuZWFyKSAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMTVdID0gMC4wO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBmdW5jdGlvbiBtYXQ0X2Zyb21Sb3RhdGlvblRyYW5zbGF0aW9uKG91dCwgcSwgdikge1xuICAgIC8vIFF1YXRlcm5pb24gbWF0aFxuICAgIHZhciB4ID0gcVswXSwgeSA9IHFbMV0sIHogPSBxWzJdLCB3ID0gcVszXSxcbiAgICAgICAgeDIgPSB4ICsgeCxcbiAgICAgICAgeTIgPSB5ICsgeSxcbiAgICAgICAgejIgPSB6ICsgeixcblxuICAgICAgICB4eCA9IHggKiB4MixcbiAgICAgICAgeHkgPSB4ICogeTIsXG4gICAgICAgIHh6ID0geCAqIHoyLFxuICAgICAgICB5eSA9IHkgKiB5MixcbiAgICAgICAgeXogPSB5ICogejIsXG4gICAgICAgIHp6ID0geiAqIHoyLFxuICAgICAgICB3eCA9IHcgKiB4MixcbiAgICAgICAgd3kgPSB3ICogeTIsXG4gICAgICAgIHd6ID0gdyAqIHoyO1xuXG4gICAgb3V0WzBdID0gMSAtICh5eSArIHp6KTtcbiAgICBvdXRbMV0gPSB4eSArIHd6O1xuICAgIG91dFsyXSA9IHh6IC0gd3k7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSB4eSAtIHd6O1xuICAgIG91dFs1XSA9IDEgLSAoeHggKyB6eik7XG4gICAgb3V0WzZdID0geXogKyB3eDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IHh6ICsgd3k7XG4gICAgb3V0WzldID0geXogLSB3eDtcbiAgICBvdXRbMTBdID0gMSAtICh4eCArIHl5KTtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gdlswXTtcbiAgICBvdXRbMTNdID0gdlsxXTtcbiAgICBvdXRbMTRdID0gdlsyXTtcbiAgICBvdXRbMTVdID0gMTtcblxuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgZnVuY3Rpb24gbWF0NF90cmFuc2xhdGUob3V0LCBhLCB2KSB7XG4gICAgdmFyIHggPSB2WzBdLCB5ID0gdlsxXSwgeiA9IHZbMl0sXG4gICAgICAgIGEwMCwgYTAxLCBhMDIsIGEwMyxcbiAgICAgICAgYTEwLCBhMTEsIGExMiwgYTEzLFxuICAgICAgICBhMjAsIGEyMSwgYTIyLCBhMjM7XG5cbiAgICBpZiAoYSA9PT0gb3V0KSB7XG4gICAgICBvdXRbMTJdID0gYVswXSAqIHggKyBhWzRdICogeSArIGFbOF0gKiB6ICsgYVsxMl07XG4gICAgICBvdXRbMTNdID0gYVsxXSAqIHggKyBhWzVdICogeSArIGFbOV0gKiB6ICsgYVsxM107XG4gICAgICBvdXRbMTRdID0gYVsyXSAqIHggKyBhWzZdICogeSArIGFbMTBdICogeiArIGFbMTRdO1xuICAgICAgb3V0WzE1XSA9IGFbM10gKiB4ICsgYVs3XSAqIHkgKyBhWzExXSAqIHogKyBhWzE1XTtcbiAgICB9IGVsc2Uge1xuICAgICAgYTAwID0gYVswXTsgYTAxID0gYVsxXTsgYTAyID0gYVsyXTsgYTAzID0gYVszXTtcbiAgICAgIGExMCA9IGFbNF07IGExMSA9IGFbNV07IGExMiA9IGFbNl07IGExMyA9IGFbN107XG4gICAgICBhMjAgPSBhWzhdOyBhMjEgPSBhWzldOyBhMjIgPSBhWzEwXTsgYTIzID0gYVsxMV07XG5cbiAgICAgIG91dFswXSA9IGEwMDsgb3V0WzFdID0gYTAxOyBvdXRbMl0gPSBhMDI7IG91dFszXSA9IGEwMztcbiAgICAgIG91dFs0XSA9IGExMDsgb3V0WzVdID0gYTExOyBvdXRbNl0gPSBhMTI7IG91dFs3XSA9IGExMztcbiAgICAgIG91dFs4XSA9IGEyMDsgb3V0WzldID0gYTIxOyBvdXRbMTBdID0gYTIyOyBvdXRbMTFdID0gYTIzO1xuXG4gICAgICBvdXRbMTJdID0gYTAwICogeCArIGExMCAqIHkgKyBhMjAgKiB6ICsgYVsxMl07XG4gICAgICBvdXRbMTNdID0gYTAxICogeCArIGExMSAqIHkgKyBhMjEgKiB6ICsgYVsxM107XG4gICAgICBvdXRbMTRdID0gYTAyICogeCArIGExMiAqIHkgKyBhMjIgKiB6ICsgYVsxNF07XG4gICAgICBvdXRbMTVdID0gYTAzICogeCArIGExMyAqIHkgKyBhMjMgKiB6ICsgYVsxNV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbiAgfTtcblxuICBmdW5jdGlvbiBtYXQ0X2ludmVydChvdXQsIGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XSxcblxuICAgICAgICBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsXG4gICAgICAgIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMCxcbiAgICAgICAgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLFxuICAgICAgICBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsXG4gICAgICAgIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMSxcbiAgICAgICAgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLFxuICAgICAgICBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsXG4gICAgICAgIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMCxcbiAgICAgICAgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLFxuICAgICAgICBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsXG4gICAgICAgIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMSxcbiAgICAgICAgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyLFxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgICAgICAgZGV0ID0gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xuXG4gICAgaWYgKCFkZXQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMV0gPSAoYTAyICogYjEwIC0gYTAxICogYjExIC0gYTAzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMl0gPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldDtcbiAgICBvdXRbM10gPSAoYTIyICogYjA0IC0gYTIxICogYjA1IC0gYTIzICogYjAzKSAqIGRldDtcbiAgICBvdXRbNF0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcbiAgICBvdXRbNV0gPSAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGRldDtcbiAgICBvdXRbNl0gPSAoYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxKSAqIGRldDtcbiAgICBvdXRbN10gPSAoYTIwICogYjA1IC0gYTIyICogYjAyICsgYTIzICogYjAxKSAqIGRldDtcbiAgICBvdXRbOF0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcbiAgICBvdXRbOV0gPSAoYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTBdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzExXSA9IChhMjEgKiBiMDIgLSBhMjAgKiBiMDQgLSBhMjMgKiBiMDApICogZGV0O1xuICAgIG91dFsxMl0gPSAoYTExICogYjA3IC0gYTEwICogYjA5IC0gYTEyICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTNdID0gKGEwMCAqIGIwOSAtIGEwMSAqIGIwNyArIGEwMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzE0XSA9IChhMzEgKiBiMDEgLSBhMzAgKiBiMDMgLSBhMzIgKiBiMDApICogZGV0O1xuICAgIG91dFsxNV0gPSAoYTIwICogYjAzIC0gYTIxICogYjAxICsgYTIyICogYjAwKSAqIGRldDtcblxuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgdmFyIGRlZmF1bHRPcmllbnRhdGlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKTtcbiAgdmFyIGRlZmF1bHRQb3NpdGlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDBdKTtcblxuICBmdW5jdGlvbiB1cGRhdGVFeWVNYXRyaWNlcyhwcm9qZWN0aW9uLCB2aWV3LCBwb3NlLCBwYXJhbWV0ZXJzLCB2ckRpc3BsYXkpIHtcbiAgICBtYXQ0X3BlcnNwZWN0aXZlRnJvbUZpZWxkT2ZWaWV3KHByb2plY3Rpb24sIHBhcmFtZXRlcnMgPyBwYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3IDogbnVsbCwgdnJEaXNwbGF5LmRlcHRoTmVhciwgdnJEaXNwbGF5LmRlcHRoRmFyKTtcblxuICAgIHZhciBvcmllbnRhdGlvbiA9IHBvc2Uub3JpZW50YXRpb24gfHwgZGVmYXVsdE9yaWVudGF0aW9uO1xuICAgIHZhciBwb3NpdGlvbiA9IHBvc2UucG9zaXRpb24gfHwgZGVmYXVsdFBvc2l0aW9uO1xuXG4gICAgbWF0NF9mcm9tUm90YXRpb25UcmFuc2xhdGlvbih2aWV3LCBvcmllbnRhdGlvbiwgcG9zaXRpb24pO1xuICAgIGlmIChwYXJhbWV0ZXJzKVxuICAgICAgbWF0NF90cmFuc2xhdGUodmlldywgdmlldywgcGFyYW1ldGVycy5vZmZzZXQpO1xuICAgIG1hdDRfaW52ZXJ0KHZpZXcsIHZpZXcpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGZyYW1lRGF0YSwgcG9zZSwgdnJEaXNwbGF5KSB7XG4gICAgaWYgKCFmcmFtZURhdGEgfHwgIXBvc2UpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBmcmFtZURhdGEucG9zZSA9IHBvc2U7XG4gICAgZnJhbWVEYXRhLnRpbWVzdGFtcCA9IHBvc2UudGltZXN0YW1wO1xuXG4gICAgdXBkYXRlRXllTWF0cmljZXMoXG4gICAgICAgIGZyYW1lRGF0YS5sZWZ0UHJvamVjdGlvbk1hdHJpeCwgZnJhbWVEYXRhLmxlZnRWaWV3TWF0cml4LFxuICAgICAgICBwb3NlLCB2ckRpc3BsYXkuZ2V0RXllUGFyYW1ldGVycyhcImxlZnRcIiksIHZyRGlzcGxheSk7XG4gICAgdXBkYXRlRXllTWF0cmljZXMoXG4gICAgICAgIGZyYW1lRGF0YS5yaWdodFByb2plY3Rpb25NYXRyaXgsIGZyYW1lRGF0YS5yaWdodFZpZXdNYXRyaXgsXG4gICAgICAgIHBvc2UsIHZyRGlzcGxheS5nZXRFeWVQYXJhbWV0ZXJzKFwicmlnaHRcIiksIHZyRGlzcGxheSk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn0pKCk7XG5cblV0aWwuaXNJbnNpZGVDcm9zc0RvbWFpbklGcmFtZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXNGcmFtZWQgPSAod2luZG93LnNlbGYgIT09IHdpbmRvdy50b3ApO1xuICB2YXIgcmVmRG9tYWluID0gVXRpbC5nZXREb21haW5Gcm9tVXJsKGRvY3VtZW50LnJlZmVycmVyKTtcbiAgdmFyIHRoaXNEb21haW4gPSBVdGlsLmdldERvbWFpbkZyb21Vcmwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXG4gIHJldHVybiBpc0ZyYW1lZCAmJiAocmVmRG9tYWluICE9PSB0aGlzRG9tYWluKTtcbn07XG5cbi8vIEZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjM5NDUwMjcuXG5VdGlsLmdldERvbWFpbkZyb21VcmwgPSBmdW5jdGlvbih1cmwpIHtcbiAgdmFyIGRvbWFpbjtcbiAgLy8gRmluZCAmIHJlbW92ZSBwcm90b2NvbCAoaHR0cCwgZnRwLCBldGMuKSBhbmQgZ2V0IGRvbWFpbi5cbiAgaWYgKHVybC5pbmRleE9mKFwiOi8vXCIpID4gLTEpIHtcbiAgICBkb21haW4gPSB1cmwuc3BsaXQoJy8nKVsyXTtcbiAgfVxuICBlbHNlIHtcbiAgICBkb21haW4gPSB1cmwuc3BsaXQoJy8nKVswXTtcbiAgfVxuXG4gIC8vZmluZCAmIHJlbW92ZSBwb3J0IG51bWJlclxuICBkb21haW4gPSBkb21haW4uc3BsaXQoJzonKVswXTtcblxuICByZXR1cm4gZG9tYWluO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWw7XG5cbn0se1wib2JqZWN0LWFzc2lnblwiOjJ9XSwyMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgRGV2aWNlSW5mbyA9IF9kZXJlcV8oJy4vZGV2aWNlLWluZm8uanMnKTtcbnZhciBFdmVudEVtaXR0ZXIzID0gX2RlcmVxXygnZXZlbnRlbWl0dGVyMycpO1xudmFyIFV0aWwgPSBfZGVyZXFfKCcuL3V0aWwuanMnKTtcblxudmFyIERFRkFVTFRfVklFV0VSID0gJ0NhcmRib2FyZFYxJztcbnZhciBWSUVXRVJfS0VZID0gJ1dFQlZSX0NBUkRCT0FSRF9WSUVXRVInO1xudmFyIENMQVNTX05BTUUgPSAnd2VidnItcG9seWZpbGwtdmlld2VyLXNlbGVjdG9yJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgdmlld2VyIHNlbGVjdG9yIHdpdGggdGhlIG9wdGlvbnMgc3BlY2lmaWVkLiBTdXBwb3J0cyBiZWluZyBzaG93blxuICogYW5kIGhpZGRlbi4gR2VuZXJhdGVzIGV2ZW50cyB3aGVuIHZpZXdlciBwYXJhbWV0ZXJzIGNoYW5nZS4gQWxzbyBzdXBwb3J0c1xuICogc2F2aW5nIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaW5kZXggaW4gbG9jYWxTdG9yYWdlLlxuICovXG5mdW5jdGlvbiBWaWV3ZXJTZWxlY3RvcigpIHtcbiAgLy8gVHJ5IHRvIGxvYWQgdGhlIHNlbGVjdGVkIGtleSBmcm9tIGxvY2FsIHN0b3JhZ2UuIElmIG5vbmUgZXhpc3RzLCB1c2UgdGhlXG4gIC8vIGRlZmF1bHQga2V5LlxuICB0cnkge1xuICAgIHRoaXMuc2VsZWN0ZWRLZXkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShWSUVXRVJfS0VZKSB8fCBERUZBVUxUX1ZJRVdFUjtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gbG9hZCB2aWV3ZXIgcHJvZmlsZTogJXMnLCBlcnJvcik7XG4gIH1cbiAgdGhpcy5kaWFsb2cgPSB0aGlzLmNyZWF0ZURpYWxvZ18oRGV2aWNlSW5mby5WaWV3ZXJzKTtcbiAgdGhpcy5yb290ID0gbnVsbDtcbn1cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIzKCk7XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24ocm9vdCkge1xuICB0aGlzLnJvb3QgPSByb290O1xuXG4gIHJvb3QuYXBwZW5kQ2hpbGQodGhpcy5kaWFsb2cpO1xuXG4gIC8vIEVuc3VyZSB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW0gaXMgY2hlY2tlZC5cbiAgdmFyIHNlbGVjdGVkID0gdGhpcy5kaWFsb2cucXVlcnlTZWxlY3RvcignIycgKyB0aGlzLnNlbGVjdGVkS2V5KTtcbiAgc2VsZWN0ZWQuY2hlY2tlZCA9IHRydWU7XG5cbiAgLy8gU2hvdyB0aGUgVUkuXG4gIHRoaXMuZGlhbG9nLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMucm9vdCAmJiB0aGlzLnJvb3QuY29udGFpbnModGhpcy5kaWFsb2cpKSB7XG4gICAgdGhpcy5yb290LnJlbW92ZUNoaWxkKHRoaXMuZGlhbG9nKTtcbiAgfVxuICB0aGlzLmRpYWxvZy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmdldEN1cnJlbnRWaWV3ZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIERldmljZUluZm8uVmlld2Vyc1t0aGlzLnNlbGVjdGVkS2V5XTtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5nZXRTZWxlY3RlZEtleV8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGlucHV0ID0gdGhpcy5kaWFsb2cucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1maWVsZF06Y2hlY2tlZCcpO1xuICBpZiAoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQuaWQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUub25TYXZlXyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNlbGVjdGVkS2V5ID0gdGhpcy5nZXRTZWxlY3RlZEtleV8oKTtcbiAgaWYgKCF0aGlzLnNlbGVjdGVkS2V5IHx8ICFEZXZpY2VJbmZvLlZpZXdlcnNbdGhpcy5zZWxlY3RlZEtleV0pIHtcbiAgICBjb25zb2xlLmVycm9yKCdWaWV3ZXJTZWxlY3Rvci5vblNhdmVfOiB0aGlzIHNob3VsZCBuZXZlciBoYXBwZW4hJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5lbWl0KCdjaGFuZ2UnLCBEZXZpY2VJbmZvLlZpZXdlcnNbdGhpcy5zZWxlY3RlZEtleV0pO1xuXG4gIC8vIEF0dGVtcHQgdG8gc2F2ZSB0aGUgdmlld2VyIHByb2ZpbGUsIGJ1dCBmYWlscyBpbiBwcml2YXRlIG1vZGUuXG4gIHRyeSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oVklFV0VSX0tFWSwgdGhpcy5zZWxlY3RlZEtleSk7XG4gIH0gY2F0Y2goZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2F2ZSB2aWV3ZXIgcHJvZmlsZTogJXMnLCBlcnJvcik7XG4gIH1cbiAgdGhpcy5oaWRlKCk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGRpYWxvZy5cbiAqL1xuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmNyZWF0ZURpYWxvZ18gPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoQ0xBU1NfTkFNRSk7XG4gIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAvLyBDcmVhdGUgYW4gb3ZlcmxheSB0aGF0IGRpbXMgdGhlIGJhY2tncm91bmQsIGFuZCB3aGljaCBnb2VzIGF3YXkgd2hlbiB5b3VcbiAgLy8gdGFwIGl0LlxuICB2YXIgb3ZlcmxheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IG92ZXJsYXkuc3R5bGU7XG4gIHMucG9zaXRpb24gPSAnZml4ZWQnO1xuICBzLmxlZnQgPSAwO1xuICBzLnRvcCA9IDA7XG4gIHMud2lkdGggPSAnMTAwJSc7XG4gIHMuaGVpZ2h0ID0gJzEwMCUnO1xuICBzLmJhY2tncm91bmQgPSAncmdiYSgwLCAwLCAwLCAwLjMpJztcbiAgb3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGlkZS5iaW5kKHRoaXMpKTtcblxuICB2YXIgd2lkdGggPSAyODA7XG4gIHZhciBkaWFsb2cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHMgPSBkaWFsb2cuc3R5bGU7XG4gIHMuYm94U2l6aW5nID0gJ2JvcmRlci1ib3gnO1xuICBzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgcy50b3AgPSAnMjRweCc7XG4gIHMubGVmdCA9ICc1MCUnO1xuICBzLm1hcmdpbkxlZnQgPSAoLXdpZHRoLzIpICsgJ3B4JztcbiAgcy53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgcy5wYWRkaW5nID0gJzI0cHgnO1xuICBzLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gIHMuYmFja2dyb3VuZCA9ICcjZmFmYWZhJztcbiAgcy5mb250RmFtaWx5ID0gXCInUm9ib3RvJywgc2Fucy1zZXJpZlwiO1xuICBzLmJveFNoYWRvdyA9ICcwcHggNXB4IDIwcHggIzY2Nic7XG5cbiAgZGlhbG9nLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlSDFfKCdTZWxlY3QgeW91ciB2aWV3ZXInKSk7XG4gIGZvciAodmFyIGlkIGluIG9wdGlvbnMpIHtcbiAgICBkaWFsb2cuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVDaG9pY2VfKGlkLCBvcHRpb25zW2lkXS5sYWJlbCkpO1xuICB9XG4gIGRpYWxvZy5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUJ1dHRvbl8oJ1NhdmUnLCB0aGlzLm9uU2F2ZV8uYmluZCh0aGlzKSkpO1xuXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChvdmVybGF5KTtcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGRpYWxvZyk7XG5cbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5jcmVhdGVIMV8gPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBoMSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gxJyk7XG4gIHZhciBzID0gaDEuc3R5bGU7XG4gIHMuY29sb3IgPSAnYmxhY2snO1xuICBzLmZvbnRTaXplID0gJzIwcHgnO1xuICBzLmZvbnRXZWlnaHQgPSAnYm9sZCc7XG4gIHMubWFyZ2luVG9wID0gMDtcbiAgcy5tYXJnaW5Cb3R0b20gPSAnMjRweCc7XG4gIGgxLmlubmVySFRNTCA9IG5hbWU7XG4gIHJldHVybiBoMTtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5jcmVhdGVDaG9pY2VfID0gZnVuY3Rpb24oaWQsIG5hbWUpIHtcbiAgLypcbiAgPGRpdiBjbGFzcz1cImNob2ljZVwiPlxuICA8aW5wdXQgaWQ9XCJ2MVwiIHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJmaWVsZFwiIHZhbHVlPVwidjFcIj5cbiAgPGxhYmVsIGZvcj1cInYxXCI+Q2FyZGJvYXJkIFYxPC9sYWJlbD5cbiAgPC9kaXY+XG4gICovXG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LnN0eWxlLm1hcmdpblRvcCA9ICc4cHgnO1xuICBkaXYuc3R5bGUuY29sb3IgPSAnYmxhY2snO1xuXG4gIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0LnN0eWxlLmZvbnRTaXplID0gJzMwcHgnO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ2lkJywgaWQpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKCd2YWx1ZScsIGlkKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKCduYW1lJywgJ2ZpZWxkJyk7XG5cbiAgdmFyIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgbGFiZWwuc3R5bGUubWFyZ2luTGVmdCA9ICc0cHgnO1xuICBsYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsIGlkKTtcbiAgbGFiZWwuaW5uZXJIVE1MID0gbmFtZTtcblxuICBkaXYuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICBkaXYuYXBwZW5kQ2hpbGQobGFiZWwpO1xuXG4gIHJldHVybiBkaXY7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuY3JlYXRlQnV0dG9uXyA9IGZ1bmN0aW9uKGxhYmVsLCBvbmNsaWNrKSB7XG4gIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgYnV0dG9uLmlubmVySFRNTCA9IGxhYmVsO1xuICB2YXIgcyA9IGJ1dHRvbi5zdHlsZTtcbiAgcy5mbG9hdCA9ICdyaWdodCc7XG4gIHMudGV4dFRyYW5zZm9ybSA9ICd1cHBlcmNhc2UnO1xuICBzLmNvbG9yID0gJyMxMDk0ZjcnO1xuICBzLmZvbnRTaXplID0gJzE0cHgnO1xuICBzLmxldHRlclNwYWNpbmcgPSAwO1xuICBzLmJvcmRlciA9IDA7XG4gIHMuYmFja2dyb3VuZCA9ICdub25lJztcbiAgcy5tYXJnaW5Ub3AgPSAnMTZweCc7XG5cbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb25jbGljayk7XG5cbiAgcmV0dXJuIGJ1dHRvbjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld2VyU2VsZWN0b3I7XG5cbn0se1wiLi9kZXZpY2UtaW5mby5qc1wiOjgsXCIuL3V0aWwuanNcIjoyMixcImV2ZW50ZW1pdHRlcjNcIjoxfV0sMjQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSBfZGVyZXFfKCcuL3V0aWwuanMnKTtcblxuLyoqXG4gKiBBbmRyb2lkIGFuZCBpT1MgY29tcGF0aWJsZSB3YWtlbG9jayBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBSZWZhY3RvcmVkIHRoYW5rcyB0byBka292YWxldkAuXG4gKi9cbmZ1bmN0aW9uIEFuZHJvaWRXYWtlTG9jaygpIHtcbiAgdmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcblxuICB2aWRlby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsIGZ1bmN0aW9uKCkge1xuICAgIHZpZGVvLnBsYXkoKTtcbiAgfSk7XG5cbiAgdGhpcy5yZXF1ZXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHZpZGVvLnBhdXNlZCkge1xuICAgICAgLy8gQmFzZTY0IHZlcnNpb24gb2YgdmlkZW9zX3NyYy9uby1zbGVlcC0xMjBzLm1wNC5cbiAgICAgIHZpZGVvLnNyYyA9IFV0aWwuYmFzZTY0KCd2aWRlby9tcDQnLCAnQUFBQUdHWjBlWEJwYzI5dEFBQUFBRzF3TkRGaGRtTXhBQUFJQTIxdmIzWUFBQUJzYlhab1pBQUFBQURTYTl2NjBtdmIrZ0FCWDVBQWx3L2dBQUVBQUFFQUFBQUFBQUFBQUFBQUFBQUJBQUFBQUFBQUFBQUFBQUFBQUFBQUFRQUFBQUFBQUFBQUFBQUFBQUFBUUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBSUFBQWRrZEhKaGF3QUFBRngwYTJoa0FBQUFBZEpyMi9yU2E5djZBQUFBQVFBQUFBQUFsdy9nQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFCQUFBQUFBQUFBQUFBQUFBQUFBQUFBUUFBQUFBQUFBQUFBQUFBQUFBQVFBQUFBQUFRQUFBQUhBQUFBQUFBSkdWa2RITUFBQUFjWld4emRBQUFBQUFBQUFBQkFKY1A0QUFBQUFBQUFRQUFBQUFHM0cxa2FXRUFBQUFnYldSb1pBQUFBQURTYTl2NjBtdmIrZ0FQUWtBR2puZUFGY2NBQUFBQUFDMW9aR3h5QUFBQUFBQUFBQUIyYVdSbEFBQUFBQUFBQUFBQUFBQUFWbWxrWlc5SVlXNWtiR1Z5QUFBQUJvZHRhVzVtQUFBQUZIWnRhR1FBQUFBQkFBQUFBQUFBQUFBQUFBQWtaR2x1WmdBQUFCeGtjbVZtQUFBQUFBQUFBQUVBQUFBTWRYSnNJQUFBQUFFQUFBWkhjM1JpYkFBQUFKZHpkSE5rQUFBQUFBQUFBQUVBQUFDSFlYWmpNUUFBQUFBQUFBQUJBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU1BQndBU0FBQUFFZ0FBQUFBQUFBQUFRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUJqLy93QUFBREZoZG1OREFXUUFDLy9oQUJsblpBQUxyTmxmbGx3NFFBQUFBd0JBQUFBREFLUEZDbVdBQVFBRmFPdnNzaXdBQUFBWWMzUjBjd0FBQUFBQUFBQUJBQUFBYmdBUFFrQUFBQUFVYzNSemN3QUFBQUFBQUFBQkFBQUFBUUFBQTRCamRIUnpBQUFBQUFBQUFHNEFBQUFCQUQwSkFBQUFBQUVBZWhJQUFBQUFBUUE5Q1FBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBTGNiQUFBQUFISE4wYzJNQUFBQUFBQUFBQVFBQUFBRUFBQUJ1QUFBQUFRQUFBY3h6ZEhONkFBQUFBQUFBQUFBQUFBQnVBQUFEQ1FBQUFCZ0FBQUFPQUFBQURnQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCTUFBQUFVYzNSamJ3QUFBQUFBQUFBQkFBQUlLd0FBQUN0MVpIUmhBQUFBSTZsbGJtTUFGd0FBZG14aklESXVNaTR4SUhOMGNtVmhiU0J2ZFhSd2RYUUFBQUFJZDJsa1pRQUFDUlJ0WkdGMEFBQUNyZ1gvLzZ2Y1JlbTk1dGxJdDVZczJDRFpJKzd2ZURJMk5DQXRJR052Y21VZ01UUXlJQzBnU0M0eU5qUXZUVkJGUnkwMElFRldReUJqYjJSbFl5QXRJRU52Y0hsc1pXWjBJREl3TURNdE1qQXhOQ0F0SUdoMGRIQTZMeTkzZDNjdWRtbGtaVzlzWVc0dWIzSm5MM2d5TmpRdWFIUnRiQ0F0SUc5d2RHbHZibk02SUdOaFltRmpQVEVnY21WbVBUTWdaR1ZpYkc5amF6MHhPakE2TUNCaGJtRnNlWE5sUFRCNE16b3dlREV6SUcxbFBXaGxlQ0J6ZFdKdFpUMDNJSEJ6ZVQweElIQnplVjl5WkQweExqQXdPakF1TURBZ2JXbDRaV1JmY21WbVBURWdiV1ZmY21GdVoyVTlNVFlnWTJoeWIyMWhYMjFsUFRFZ2RISmxiR3hwY3oweElEaDRPR1JqZEQweElHTnhiVDB3SUdSbFlXUjZiMjVsUFRJeExERXhJR1poYzNSZmNITnJhWEE5TVNCamFISnZiV0ZmY1hCZmIyWm1jMlYwUFMweUlIUm9jbVZoWkhNOU1USWdiRzl2YTJGb1pXRmtYM1JvY21WaFpITTlNU0J6YkdsalpXUmZkR2h5WldGa2N6MHdJRzV5UFRBZ1pHVmphVzFoZEdVOU1TQnBiblJsY214aFkyVmtQVEFnWW14MWNtRjVYMk52YlhCaGREMHdJR052Ym5OMGNtRnBibVZrWDJsdWRISmhQVEFnWW1aeVlXMWxjejB6SUdKZmNIbHlZVzFwWkQweUlHSmZZV1JoY0hROU1TQmlYMkpwWVhNOU1DQmthWEpsWTNROU1TQjNaV2xuYUhSaVBURWdiM0JsYmw5bmIzQTlNQ0IzWldsbmFIUndQVElnYTJWNWFXNTBQVEkxTUNCclpYbHBiblJmYldsdVBURWdjMk5sYm1WamRYUTlOREFnYVc1MGNtRmZjbVZtY21WemFEMHdJSEpqWDJ4dmIydGhhR1ZoWkQwME1DQnlZejFoWW5JZ2JXSjBjbVZsUFRFZ1ltbDBjbUYwWlQweE1EQWdjbUYwWlhSdmJEMHhMakFnY1dOdmJYQTlNQzQyTUNCeGNHMXBiajB4TUNCeGNHMWhlRDAxTVNCeGNITjBaWEE5TkNCcGNGOXlZWFJwYnoweExqUXdJR0Z4UFRFNk1TNHdNQUNBQUFBQVUyV0loQUFRLzhsdGxPZStjVFp1R2tLZythUnR1aXZjRFowcEJzZnNFaTlwL2kxeVU5RHhTMmxxNGRYVGluVmlGMVVSQktYZ256S0JkL1VoMWJraEh0TXJ3clJjT0pzbEQwMVVCK2Z5YUw2ZWYrREJBQUFBRkVHYUpHeEJENUIrdithKzRRcUYzTWdCWHo5TUFBQUFDa0dlUW5pSC8rOTRyNkVBQUFBS0FaNWhkRU4vOFF5dHdBQUFBQWdCbm1OcVEzL0VnUUFBQUE1Qm1taEpxRUZvbVV3SUlmLys0UUFBQUFwQm5vWkZFU3cvLzc2QkFBQUFDQUdlcFhSRGY4U0JBQUFBQ0FHZXAycERmOFNBQUFBQURrR2FyRW1vUVd5WlRBZ2gvLzdnQUFBQUNrR2V5a1VWTEQvL3ZvRUFBQUFJQVo3cGRFTi94SUFBQUFBSUFaN3Jha04veElBQUFBQU9RWnJ3U2FoQmJKbE1DQ0gvL3VFQUFBQUtRWjhPUlJVc1AvKytnUUFBQUFnQm55MTBRMy9FZ1FBQUFBZ0JueTlxUTMvRWdBQUFBQTVCbXpSSnFFRnNtVXdJSWYvKzRBQUFBQXBCbjFKRkZTdy8vNzZCQUFBQUNBR2ZjWFJEZjhTQUFBQUFDQUdmYzJwRGY4U0FBQUFBRGtHYmVFbW9RV3laVEFnaC8vN2hBQUFBQ2tHZmxrVVZMRC8vdm9BQUFBQUlBWisxZEVOL3hJRUFBQUFJQVorM2FrTi94SUVBQUFBT1FadThTYWhCYkpsTUNDSC8vdUFBQUFBS1FaL2FSUlVzUC8rK2dRQUFBQWdCbi9sMFEzL0VnQUFBQUFnQm4vdHFRMy9FZ1FBQUFBNUJtK0JKcUVGc21Vd0lJZi8rNFFBQUFBcEJuaDVGRlN3Ly83NkFBQUFBQ0FHZVBYUkRmOFNBQUFBQUNBR2VQMnBEZjhTQkFBQUFEa0dhSkVtb1FXeVpUQWdoLy83Z0FBQUFDa0dlUWtVVkxELy92b0VBQUFBSUFaNWhkRU4veElBQUFBQUlBWjVqYWtOL3hJRUFBQUFPUVpwb1NhaEJiSmxNQ0NILy91RUFBQUFLUVo2R1JSVXNQLysrZ1FBQUFBZ0JucVYwUTMvRWdRQUFBQWdCbnFkcVEzL0VnQUFBQUE1Qm1xeEpxRUZzbVV3SUlmLys0QUFBQUFwQm5zcEZGU3cvLzc2QkFBQUFDQUdlNlhSRGY4U0FBQUFBQ0FHZTYycERmOFNBQUFBQURrR2E4RW1vUVd5WlRBZ2gvLzdoQUFBQUNrR2ZEa1VWTEQvL3ZvRUFBQUFJQVo4dGRFTi94SUVBQUFBSUFaOHZha04veElBQUFBQU9RWnMwU2FoQmJKbE1DQ0gvL3VBQUFBQUtRWjlTUlJVc1AvKytnUUFBQUFnQm4zRjBRMy9FZ0FBQUFBZ0JuM05xUTMvRWdBQUFBQTVCbTNoSnFFRnNtVXdJSWYvKzRRQUFBQXBCbjVaRkZTdy8vNzZBQUFBQUNBR2Z0WFJEZjhTQkFBQUFDQUdmdDJwRGY4U0JBQUFBRGtHYnZFbW9RV3laVEFnaC8vN2dBQUFBQ2tHZjJrVVZMRC8vdm9FQUFBQUlBWi81ZEVOL3hJQUFBQUFJQVovN2FrTi94SUVBQUFBT1FadmdTYWhCYkpsTUNDSC8vdUVBQUFBS1FaNGVSUlVzUC8rK2dBQUFBQWdCbmoxMFEzL0VnQUFBQUFnQm5qOXFRMy9FZ1FBQUFBNUJtaVJKcUVGc21Vd0lJZi8rNEFBQUFBcEJua0pGRlN3Ly83NkJBQUFBQ0FHZVlYUkRmOFNBQUFBQUNBR2VZMnBEZjhTQkFBQUFEa0dhYUVtb1FXeVpUQWdoLy83aEFBQUFDa0dlaGtVVkxELy92b0VBQUFBSUFaNmxkRU4veElFQUFBQUlBWjZuYWtOL3hJQUFBQUFPUVpxc1NhaEJiSmxNQ0NILy91QUFBQUFLUVo3S1JSVXNQLysrZ1FBQUFBZ0JudWwwUTMvRWdBQUFBQWdCbnV0cVEzL0VnQUFBQUE1Qm12QkpxRUZzbVV3SUlmLys0UUFBQUFwQm53NUZGU3cvLzc2QkFBQUFDQUdmTFhSRGY4U0JBQUFBQ0FHZkwycERmOFNBQUFBQURrR2JORW1vUVd5WlRBZ2gvLzdnQUFBQUNrR2ZVa1VWTEQvL3ZvRUFBQUFJQVo5eGRFTi94SUFBQUFBSUFaOXpha04veElBQUFBQU9RWnQ0U2FoQmJKbE1DQ0gvL3VFQUFBQUtRWitXUlJVc1AvKytnQUFBQUFnQm43VjBRMy9FZ1FBQUFBZ0JuN2RxUTMvRWdRQUFBQTVCbTd4SnFFRnNtVXdJSWYvKzRBQUFBQXBCbjlwRkZTdy8vNzZCQUFBQUNBR2YrWFJEZjhTQUFBQUFDQUdmKzJwRGY4U0JBQUFBRGtHYjRFbW9RV3laVEFnaC8vN2hBQUFBQ2tHZUhrVVZMRC8vdm9BQUFBQUlBWjQ5ZEVOL3hJQUFBQUFJQVo0L2FrTi94SUVBQUFBT1Fab2tTYWhCYkpsTUNDSC8vdUFBQUFBS1FaNUNSUlVzUC8rK2dRQUFBQWdCbm1GMFEzL0VnQUFBQUFnQm5tTnFRMy9FZ1FBQUFBNUJtbWhKcUVGc21Vd0lJZi8rNFFBQUFBcEJub1pGRlN3Ly83NkJBQUFBQ0FHZXBYUkRmOFNCQUFBQUNBR2VwMnBEZjhTQUFBQUFEa0dhckVtb1FXeVpUQWdoLy83Z0FBQUFDa0dleWtVVkxELy92b0VBQUFBSUFaN3BkRU4veElBQUFBQUlBWjdyYWtOL3hJQUFBQUFQUVpydVNhaEJiSmxNRkV3My8vN0InKTtcbiAgICAgIHZpZGVvLnBsYXkoKTtcbiAgICB9XG4gIH07XG5cbiAgdGhpcy5yZWxlYXNlID0gZnVuY3Rpb24oKSB7XG4gICAgdmlkZW8ucGF1c2UoKTtcbiAgICB2aWRlby5zcmMgPSAnJztcbiAgfTtcbn1cblxuZnVuY3Rpb24gaU9TV2FrZUxvY2soKSB7XG4gIHZhciB0aW1lciA9IG51bGw7XG5cbiAgdGhpcy5yZXF1ZXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aW1lcikge1xuICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xuICAgICAgICBzZXRUaW1lb3V0KHdpbmRvdy5zdG9wLCAwKTtcbiAgICAgIH0sIDMwMDAwKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLnJlbGVhc2UgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGltZXIpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgICAgdGltZXIgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuXG5cbmZ1bmN0aW9uIGdldFdha2VMb2NrKCkge1xuICB2YXIgdXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCBuYXZpZ2F0b3IudmVuZG9yIHx8IHdpbmRvdy5vcGVyYTtcbiAgaWYgKHVzZXJBZ2VudC5tYXRjaCgvaVBob25lL2kpIHx8IHVzZXJBZ2VudC5tYXRjaCgvaVBvZC9pKSkge1xuICAgIHJldHVybiBpT1NXYWtlTG9jaztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gQW5kcm9pZFdha2VMb2NrO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0V2FrZUxvY2soKTtcbn0se1wiLi91dGlsLmpzXCI6MjJ9XSwyNTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IF9kZXJlcV8oJy4vdXRpbC5qcycpO1xudmFyIENhcmRib2FyZFZSRGlzcGxheSA9IF9kZXJlcV8oJy4vY2FyZGJvYXJkLXZyLWRpc3BsYXkuanMnKTtcbnZhciBNb3VzZUtleWJvYXJkVlJEaXNwbGF5ID0gX2RlcmVxXygnLi9tb3VzZS1rZXlib2FyZC12ci1kaXNwbGF5LmpzJyk7XG4vLyBVbmNvbW1lbnQgdG8gYWRkIHBvc2l0aW9uYWwgdHJhY2tpbmcgdmlhIHdlYmNhbS5cbi8vdmFyIFdlYmNhbVBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSByZXF1aXJlKCcuL3dlYmNhbS1wb3NpdGlvbi1zZW5zb3ItdnItZGV2aWNlLmpzJyk7XG52YXIgVlJEaXNwbGF5ID0gX2RlcmVxXygnLi9iYXNlLmpzJykuVlJEaXNwbGF5O1xudmFyIFZSRnJhbWVEYXRhID0gX2RlcmVxXygnLi9iYXNlLmpzJykuVlJGcmFtZURhdGE7XG52YXIgSE1EVlJEZXZpY2UgPSBfZGVyZXFfKCcuL2Jhc2UuanMnKS5ITURWUkRldmljZTtcbnZhciBQb3NpdGlvblNlbnNvclZSRGV2aWNlID0gX2RlcmVxXygnLi9iYXNlLmpzJykuUG9zaXRpb25TZW5zb3JWUkRldmljZTtcbnZhciBWUkRpc3BsYXlITUREZXZpY2UgPSBfZGVyZXFfKCcuL2Rpc3BsYXktd3JhcHBlcnMuanMnKS5WUkRpc3BsYXlITUREZXZpY2U7XG52YXIgVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UgPSBfZGVyZXFfKCcuL2Rpc3BsYXktd3JhcHBlcnMuanMnKS5WUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZTtcblxuZnVuY3Rpb24gV2ViVlJQb2x5ZmlsbCgpIHtcbiAgdGhpcy5kaXNwbGF5cyA9IFtdO1xuICB0aGlzLmRldmljZXMgPSBbXTsgLy8gRm9yIGRlcHJlY2F0ZWQgb2JqZWN0c1xuICB0aGlzLmRldmljZXNQb3B1bGF0ZWQgPSBmYWxzZTtcbiAgdGhpcy5uYXRpdmVXZWJWUkF2YWlsYWJsZSA9IHRoaXMuaXNXZWJWUkF2YWlsYWJsZSgpO1xuICB0aGlzLm5hdGl2ZUxlZ2FjeVdlYlZSQXZhaWxhYmxlID0gdGhpcy5pc0RlcHJlY2F0ZWRXZWJWUkF2YWlsYWJsZSgpO1xuICB0aGlzLm5hdGl2ZUdldFZSRGlzcGxheXNGdW5jID0gdGhpcy5uYXRpdmVXZWJWUkF2YWlsYWJsZSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsO1xuXG4gIGlmICghdGhpcy5uYXRpdmVMZWdhY3lXZWJWUkF2YWlsYWJsZSkge1xuICAgIHRoaXMuZW5hYmxlUG9seWZpbGwoKTtcbiAgICBpZiAoV2ViVlJDb25maWcuRU5BQkxFX0RFUFJFQ0FURURfQVBJKSB7XG4gICAgICB0aGlzLmVuYWJsZURlcHJlY2F0ZWRQb2x5ZmlsbCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1dCBhIHNoaW0gaW4gcGxhY2UgdG8gdXBkYXRlIHRoZSBBUEkgdG8gMS4xIGlmIG5lZWRlZC5cbiAgSW5zdGFsbFdlYlZSU3BlY1NoaW0oKTtcbn1cblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuaXNXZWJWUkF2YWlsYWJsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKCdnZXRWUkRpc3BsYXlzJyBpbiBuYXZpZ2F0b3IpO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuaXNEZXByZWNhdGVkV2ViVlJBdmFpbGFibGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICgnZ2V0VlJEZXZpY2VzJyBpbiBuYXZpZ2F0b3IpIHx8ICgnbW96R2V0VlJEZXZpY2VzJyBpbiBuYXZpZ2F0b3IpO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUucG9wdWxhdGVEZXZpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRldmljZXNQb3B1bGF0ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBJbml0aWFsaXplIG91ciB2aXJ0dWFsIFZSIGRldmljZXMuXG4gIHZhciB2ckRpc3BsYXkgPSBudWxsO1xuXG4gIC8vIEFkZCBhIENhcmRib2FyZCBWUkRpc3BsYXkgb24gY29tcGF0aWJsZSBtb2JpbGUgZGV2aWNlc1xuICBpZiAodGhpcy5pc0NhcmRib2FyZENvbXBhdGlibGUoKSkge1xuICAgIHZyRGlzcGxheSA9IG5ldyBDYXJkYm9hcmRWUkRpc3BsYXkoKTtcbiAgICB0aGlzLmRpc3BsYXlzLnB1c2godnJEaXNwbGF5KTtcblxuICAgIC8vIEZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgIGlmIChXZWJWUkNvbmZpZy5FTkFCTEVfREVQUkVDQVRFRF9BUEkpIHtcbiAgICAgIHRoaXMuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlITUREZXZpY2UodnJEaXNwbGF5KSk7XG4gICAgICB0aGlzLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UodnJEaXNwbGF5KSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIGEgTW91c2UgYW5kIEtleWJvYXJkIGRyaXZlbiBWUkRpc3BsYXkgZm9yIGRlc2t0b3BzL2xhcHRvcHNcbiAgaWYgKCF0aGlzLmlzTW9iaWxlKCkgJiYgIVdlYlZSQ29uZmlnLk1PVVNFX0tFWUJPQVJEX0NPTlRST0xTX0RJU0FCTEVEKSB7XG4gICAgdnJEaXNwbGF5ID0gbmV3IE1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkoKTtcbiAgICB0aGlzLmRpc3BsYXlzLnB1c2godnJEaXNwbGF5KTtcblxuICAgIC8vIEZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgIGlmIChXZWJWUkNvbmZpZy5FTkFCTEVfREVQUkVDQVRFRF9BUEkpIHtcbiAgICAgIHRoaXMuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlITUREZXZpY2UodnJEaXNwbGF5KSk7XG4gICAgICB0aGlzLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UodnJEaXNwbGF5KSk7XG4gICAgfVxuICB9XG5cbiAgLy8gVW5jb21tZW50IHRvIGFkZCBwb3NpdGlvbmFsIHRyYWNraW5nIHZpYSB3ZWJjYW0uXG4gIC8vaWYgKCF0aGlzLmlzTW9iaWxlKCkgJiYgV2ViVlJDb25maWcuRU5BQkxFX0RFUFJFQ0FURURfQVBJKSB7XG4gIC8vICBwb3NpdGlvbkRldmljZSA9IG5ldyBXZWJjYW1Qb3NpdGlvblNlbnNvclZSRGV2aWNlKCk7XG4gIC8vICB0aGlzLmRldmljZXMucHVzaChwb3NpdGlvbkRldmljZSk7XG4gIC8vfVxuXG4gIHRoaXMuZGV2aWNlc1BvcHVsYXRlZCA9IHRydWU7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5lbmFibGVQb2x5ZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAvLyBQcm92aWRlIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzLlxuICBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cyA9IHRoaXMuZ2V0VlJEaXNwbGF5cy5iaW5kKHRoaXMpO1xuXG4gIC8vIFByb3ZpZGUgdGhlIFZSRGlzcGxheSBvYmplY3QuXG4gIHdpbmRvdy5WUkRpc3BsYXkgPSBWUkRpc3BsYXk7XG5cbiAgLy8gUHJvdmlkZSBuYXZpZ2F0b3IudnJFbmFibGVkLlxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShuYXZpZ2F0b3IsICd2ckVuYWJsZWQnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gc2VsZi5pc0NhcmRib2FyZENvbXBhdGlibGUoKSAmJlxuICAgICAgICAgIChzZWxmLmlzRnVsbFNjcmVlbkF2YWlsYWJsZSgpIHx8IFV0aWwuaXNJT1MoKSk7XG4gICAgfVxuICB9KTtcblxuICBpZiAoISdWUkZyYW1lRGF0YScgaW4gd2luZG93KSB7XG4gICAgLy8gUHJvdmlkZSB0aGUgVlJGcmFtZURhdGEgb2JqZWN0LlxuICAgIHdpbmRvdy5WUkZyYW1lRGF0YSA9IFZSRnJhbWVEYXRhO1xuICB9XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5lbmFibGVEZXByZWNhdGVkUG9seWZpbGwgPSBmdW5jdGlvbigpIHtcbiAgLy8gUHJvdmlkZSBuYXZpZ2F0b3IuZ2V0VlJEZXZpY2VzLlxuICBuYXZpZ2F0b3IuZ2V0VlJEZXZpY2VzID0gdGhpcy5nZXRWUkRldmljZXMuYmluZCh0aGlzKTtcblxuICAvLyBQcm92aWRlIHRoZSBDYXJkYm9hcmRITURWUkRldmljZSBhbmQgUG9zaXRpb25TZW5zb3JWUkRldmljZSBvYmplY3RzLlxuICB3aW5kb3cuSE1EVlJEZXZpY2UgPSBITURWUkRldmljZTtcbiAgd2luZG93LlBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSBQb3NpdGlvblNlbnNvclZSRGV2aWNlO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuZ2V0VlJEaXNwbGF5cyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBvcHVsYXRlRGV2aWNlcygpO1xuICB2YXIgcG9seWZpbGxEaXNwbGF5cyA9IHRoaXMuZGlzcGxheXM7XG5cbiAgaWYgKHRoaXMubmF0aXZlV2ViVlJBdmFpbGFibGUpIHtcbiAgICByZXR1cm4gdGhpcy5uYXRpdmVHZXRWUkRpc3BsYXlzRnVuYy5jYWxsKG5hdmlnYXRvcikudGhlbihmdW5jdGlvbihuYXRpdmVEaXNwbGF5cykge1xuICAgICAgaWYgKFdlYlZSQ29uZmlnLkFMV0FZU19BUFBFTkRfUE9MWUZJTExfRElTUExBWSkge1xuICAgICAgICByZXR1cm4gbmF0aXZlRGlzcGxheXMuY29uY2F0KHBvbHlmaWxsRGlzcGxheXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZURpc3BsYXlzLmxlbmd0aCA+IDAgPyBuYXRpdmVEaXNwbGF5cyA6IHBvbHlmaWxsRGlzcGxheXM7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZShwb2x5ZmlsbERpc3BsYXlzKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5nZXRWUkRldmljZXMgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS53YXJuKCdnZXRWUkRldmljZXMgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVwZGF0ZSB5b3VyIGNvZGUgdG8gdXNlIGdldFZSRGlzcGxheXMgaW5zdGVhZC4nKTtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghc2VsZi5kZXZpY2VzUG9wdWxhdGVkKSB7XG4gICAgICAgIGlmIChzZWxmLm5hdGl2ZVdlYlZSQXZhaWxhYmxlKSB7XG4gICAgICAgICAgcmV0dXJuIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKGZ1bmN0aW9uKGRpc3BsYXlzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpc3BsYXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgIHNlbGYuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlITUREZXZpY2UoZGlzcGxheXNbaV0pKTtcbiAgICAgICAgICAgICAgc2VsZi5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlKGRpc3BsYXlzW2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLmRldmljZXNQb3B1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZShzZWxmLmRldmljZXMpO1xuICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZi5uYXRpdmVMZWdhY3lXZWJWUkF2YWlsYWJsZSkge1xuICAgICAgICAgIHJldHVybiAobmF2aWdhdG9yLmdldFZSRERldmljZXMgfHwgbmF2aWdhdG9yLm1vekdldFZSRGV2aWNlcykoZnVuY3Rpb24oZGV2aWNlcykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXZpY2VzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgIGlmIChkZXZpY2VzW2ldIGluc3RhbmNlb2YgSE1EVlJEZXZpY2UpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmRldmljZXMucHVzaChkZXZpY2VzW2ldKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoZGV2aWNlc1tpXSBpbnN0YW5jZW9mIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmRldmljZXMucHVzaChkZXZpY2VzW2ldKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5kZXZpY2VzUG9wdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUoc2VsZi5kZXZpY2VzKTtcbiAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNlbGYucG9wdWxhdGVEZXZpY2VzKCk7XG4gICAgICByZXNvbHZlKHNlbGYuZGV2aWNlcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmVqZWN0KGUpO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIERldGVybWluZSBpZiBhIGRldmljZSBpcyBtb2JpbGUuXG4gKi9cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzTW9iaWxlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAvQW5kcm9pZC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHxcbiAgICAgIC9pUGhvbmV8aVBhZHxpUG9kL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzQ2FyZGJvYXJkQ29tcGF0aWJsZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBGb3Igbm93LCBzdXBwb3J0IGFsbCBpT1MgYW5kIEFuZHJvaWQgZGV2aWNlcy5cbiAgLy8gQWxzbyBlbmFibGUgdGhlIFdlYlZSQ29uZmlnLkZPUkNFX1ZSIGZsYWcgZm9yIGRlYnVnZ2luZy5cbiAgcmV0dXJuIHRoaXMuaXNNb2JpbGUoKSB8fCBXZWJWUkNvbmZpZy5GT1JDRV9FTkFCTEVfVlI7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5pc0Z1bGxTY3JlZW5BdmFpbGFibGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIChkb2N1bWVudC5mdWxsc2NyZWVuRW5hYmxlZCB8fFxuICAgICAgICAgIGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbmFibGVkIHx8XG4gICAgICAgICAgZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVuYWJsZWQgfHxcbiAgICAgICAgICBmYWxzZSk7XG59O1xuXG4vLyBJbnN0YWxscyBhIHNoaW0gdGhhdCB1cGRhdGVzIGEgV2ViVlIgMS4wIHNwZWMgaW1wbGVtZW50YXRpb24gdG8gV2ViVlIgMS4xXG5mdW5jdGlvbiBJbnN0YWxsV2ViVlJTcGVjU2hpbSgpIHtcbiAgaWYgKCdWUkRpc3BsYXknIGluIHdpbmRvdyAmJiAhKCdWUkZyYW1lRGF0YScgaW4gd2luZG93KSkge1xuICAgIC8vIFByb3ZpZGUgdGhlIFZSRnJhbWVEYXRhIG9iamVjdC5cbiAgICB3aW5kb3cuVlJGcmFtZURhdGEgPSBWUkZyYW1lRGF0YTtcblxuICAgIC8vIEEgbG90IG9mIENocm9tZSBidWlsZHMgZG9uJ3QgaGF2ZSBkZXB0aE5lYXIgYW5kIGRlcHRoRmFyLCBldmVuXG4gICAgLy8gdGhvdWdoIHRoZXkncmUgaW4gdGhlIFdlYlZSIDEuMCBzcGVjLiBQYXRjaCB0aGVtIGluIGlmIHRoZXkncmUgbm90IHByZXNlbnQuXG4gICAgaWYoISgnZGVwdGhOZWFyJyBpbiB3aW5kb3cuVlJEaXNwbGF5LnByb3RvdHlwZSkpIHtcbiAgICAgIHdpbmRvdy5WUkRpc3BsYXkucHJvdG90eXBlLmRlcHRoTmVhciA9IDAuMDE7XG4gICAgfVxuXG4gICAgaWYoISgnZGVwdGhGYXInIGluIHdpbmRvdy5WUkRpc3BsYXkucHJvdG90eXBlKSkge1xuICAgICAgd2luZG93LlZSRGlzcGxheS5wcm90b3R5cGUuZGVwdGhGYXIgPSAxMDAwMC4wO1xuICAgIH1cblxuICAgIHdpbmRvdy5WUkRpc3BsYXkucHJvdG90eXBlLmdldEZyYW1lRGF0YSA9IGZ1bmN0aW9uKGZyYW1lRGF0YSkge1xuICAgICAgcmV0dXJuIFV0aWwuZnJhbWVEYXRhRnJvbVBvc2UoZnJhbWVEYXRhLCB0aGlzLmdldFBvc2UoKSwgdGhpcyk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5XZWJWUlBvbHlmaWxsID0gV2ViVlJQb2x5ZmlsbDtcblxufSx7XCIuL2Jhc2UuanNcIjozLFwiLi9jYXJkYm9hcmQtdnItZGlzcGxheS5qc1wiOjYsXCIuL2Rpc3BsYXktd3JhcHBlcnMuanNcIjo5LFwiLi9tb3VzZS1rZXlib2FyZC12ci1kaXNwbGF5LmpzXCI6MTUsXCIuL3V0aWwuanNcIjoyMn1dfSx7fSxbMTNdKSgxMylcbn0pOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBNZW51UmVuZGVyZXIgZnJvbSAnLi9yZW5kZXJlci5qcyc7XG5cbmxldCByZW5kZXJlcjtcbmxldCB2ckRpc3BsYXk7XG5cbmZ1bmN0aW9uIG9uTG9hZCgpIHtcbiAgcmVuZGVyZXIgPSBuZXcgTWVudVJlbmRlcmVyKCk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHsgcmVuZGVyZXIucmVzaXplKCkgfSk7XG5cbiAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoKS50aGVuKGZ1bmN0aW9uKGRpc3BsYXlzKSB7XG4gICAgaWYgKGRpc3BsYXlzLmxlbmd0aCA+IDApIHtcbiAgICAgIHZyRGlzcGxheSA9IGRpc3BsYXlzWzBdO1xuICAgICAgdnJEaXNwbGF5LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgcmVuZGVyZXIucmVuZGVyKCk7XG5cbiAgdnJEaXNwbGF5LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIG9uTG9hZCk7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgV2ViVlJNYW5hZ2VyIGZyb20gJ3dlYnZyLWJvaWxlcnBsYXRlJ1xuaW1wb3J0IFdlYlZSUG9seWZpbGwgZnJvbSAnd2VidnItcG9seWZpbGwnXG5pbXBvcnQgUmF5SW5wdXQgZnJvbSAnLi4vcmF5LWlucHV0J1xuXG5jb25zdCBXSURUSCA9IDI7XG5jb25zdCBIRUlHSFQgPSAyO1xuY29uc3QgREVGQVVMVF9DT0xPUiA9IG5ldyBUSFJFRS5Db2xvcigweDAwRkYwMCk7XG5jb25zdCBISUdITElHSFRfQ09MT1IgPSBuZXcgVEhSRUUuQ29sb3IoMHgxRTkwRkYpO1xuY29uc3QgQUNUSVZFX0NPTE9SID0gbmV3IFRIUkVFLkNvbG9yKDB4RkYzMzMzKTtcblxuLyoqXG4gKiBSZW5kZXJzIGEgbWVudSBvZiBpdGVtcyB0aGF0IGNhbiBiZSBpbnRlcmFjdGVkIHdpdGguXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1lbnVSZW5kZXJlciB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdmFyIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG5cbiAgICB2YXIgYXNwZWN0ID0gd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgdmFyIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg3NSwgYXNwZWN0LCAwLjEsIDEwMCk7XG4gICAgc2NlbmUuYWRkKGNhbWVyYSk7XG5cbiAgICB2YXIgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcigpO1xuICAgIHJlbmRlcmVyLnNldFNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG5cbiAgICB2YXIgZWZmZWN0ID0gbmV3IFRIUkVFLlZSRWZmZWN0KHJlbmRlcmVyKTtcbiAgICB2YXIgY29udHJvbHMgPSBuZXcgVEhSRUUuVlJDb250cm9scyhjYW1lcmEpO1xuICAgIGNvbnRyb2xzLnN0YW5kaW5nID0gdHJ1ZTtcblxuICAgIHZhciBtYW5hZ2VyID0gbmV3IFdlYlZSTWFuYWdlcihyZW5kZXJlciwgZWZmZWN0KTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgLy8gSW5wdXQgbWFuYWdlci5cbiAgICB2YXIgcmF5SW5wdXQgPSBuZXcgUmF5SW5wdXQoY2FtZXJhKVxuICAgIHJheUlucHV0LnNldFNpemUocmVuZGVyZXIuZ2V0U2l6ZSgpKTtcbiAgICByYXlJbnB1dC5vbigncmF5ZG93bicsIChvcHRfbWVzaCkgPT4geyB0aGlzLmhhbmRsZVJheURvd25fKG9wdF9tZXNoKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5dXAnLCAob3B0X21lc2gpID0+IHsgdGhpcy5oYW5kbGVSYXlVcF8ob3B0X21lc2gpIH0pO1xuICAgIHJheUlucHV0Lm9uKCdyYXljYW5jZWwnLCAob3B0X21lc2gpID0+IHsgdGhpcy5oYW5kbGVSYXlDYW5jZWxfKG9wdF9tZXNoKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5b3ZlcicsIChtZXNoKSA9PiB7IHRoaXMuc2V0U2VsZWN0ZWRfKG1lc2gsIHRydWUpIH0pO1xuICAgIHJheUlucHV0Lm9uKCdyYXlvdXQnLCAobWVzaCkgPT4geyB0aGlzLnNldFNlbGVjdGVkXyhtZXNoLCBmYWxzZSkgfSk7XG5cbiAgICAvLyBBZGQgdGhlIHJheSBpbnB1dCBtZXNoIHRvIHRoZSBzY2VuZS5cbiAgICBzY2VuZS5hZGQocmF5SW5wdXQuZ2V0TWVzaCgpKTtcblxuICAgIHRoaXMubWFuYWdlciA9IG1hbmFnZXI7XG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lO1xuICAgIHRoaXMuY29udHJvbHMgPSBjb250cm9scztcbiAgICB0aGlzLnJheUlucHV0ID0gcmF5SW5wdXQ7XG4gICAgdGhpcy5lZmZlY3QgPSBlZmZlY3Q7XG4gICAgdGhpcy5yZW5kZXJlciA9IHJlbmRlcmVyO1xuXG4gICAgLy8gQWRkIGEgc21hbGwgZmFrZSBtZW51IHRvIGludGVyYWN0IHdpdGguXG4gICAgdmFyIG1lbnUgPSB0aGlzLmNyZWF0ZU1lbnVfKCk7XG4gICAgc2NlbmUuYWRkKG1lbnUpO1xuXG4gICAgLy8gQWRkIGEgZmxvb3IuXG4gICAgdmFyIGZsb29yID0gdGhpcy5jcmVhdGVGbG9vcl8oKTtcbiAgICBzY2VuZS5hZGQoZmxvb3IpO1xuXG4gICAgbWVudS5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKG1lbnVJdGVtKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdtZW51SXRlbScsIG1lbnVJdGVtKTtcbiAgICAgIHJheUlucHV0LmFkZChtZW51SXRlbSk7XG4gICAgfSk7XG4gIH1cblxuXG4gIHJlbmRlcigpIHtcbiAgICB0aGlzLmNvbnRyb2xzLnVwZGF0ZSgpO1xuICAgIHRoaXMucmF5SW5wdXQudXBkYXRlKCk7XG4gICAgdGhpcy5lZmZlY3QucmVuZGVyKHRoaXMuc2NlbmUsIHRoaXMuY2FtZXJhKTtcbiAgfVxuXG4gIHJlc2l6ZSgpIHtcbiAgICB0aGlzLmNhbWVyYS5hc3BlY3QgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB0aGlzLmNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRTaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICAgIHRoaXMucmF5SW5wdXQuc2V0U2l6ZSh0aGlzLnJlbmRlcmVyLmdldFNpemUoKSk7XG4gIH1cblxuICBoYW5kbGVSYXlEb3duXyhvcHRfbWVzaCkge1xuICAgIHRoaXMuc2V0QWN0aW9uXyhvcHRfbWVzaCwgdHJ1ZSk7XG4gIH1cblxuICBoYW5kbGVSYXlVcF8ob3B0X21lc2gpIHtcbiAgICB0aGlzLnNldEFjdGlvbl8ob3B0X21lc2gsIGZhbHNlKTtcbiAgfVxuXG4gIGhhbmRsZVJheUNhbmNlbF8ob3B0X21lc2gpIHtcbiAgICB0aGlzLnNldEFjdGlvbl8ob3B0X21lc2gsIGZhbHNlKTtcbiAgfVxuXG4gIHNldFNlbGVjdGVkXyhtZXNoLCBpc1NlbGVjdGVkKSB7XG4gICAgLy9jb25zb2xlLmxvZygnc2V0U2VsZWN0ZWRfJywgaXNTZWxlY3RlZCk7XG4gICAgdmFyIG5ld0NvbG9yID0gaXNTZWxlY3RlZCA/IEhJR0hMSUdIVF9DT0xPUiA6IERFRkFVTFRfQ09MT1I7XG4gICAgbWVzaC5tYXRlcmlhbC5jb2xvciA9IG5ld0NvbG9yO1xuICB9XG5cbiAgc2V0QWN0aW9uXyhvcHRfbWVzaCwgaXNBY3RpdmUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdzZXRBY3Rpb25fJywgISFvcHRfbWVzaCwgaXNBY3RpdmUpO1xuICAgIGlmIChvcHRfbWVzaCkge1xuICAgICAgdmFyIG5ld0NvbG9yID0gaXNBY3RpdmUgPyBBQ1RJVkVfQ09MT1IgOiBISUdITElHSFRfQ09MT1I7XG4gICAgICBvcHRfbWVzaC5tYXRlcmlhbC5jb2xvciA9IG5ld0NvbG9yO1xuICAgICAgaWYgKCFpc0FjdGl2ZSkge1xuICAgICAgICBvcHRfbWVzaC5tYXRlcmlhbC53aXJlZnJhbWUgPSAhb3B0X21lc2gubWF0ZXJpYWwud2lyZWZyYW1lO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZU1lbnVfKCkge1xuICAgIHZhciBtZW51ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG5cbiAgICAvLyBDcmVhdGUgYSAyeDIgZ3JpZCBvZiBtZW51IGl0ZW1zIChncmVlbiByZWN0YW5nbGVzKS5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IFdJRFRIOyBpKyspIHtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgSEVJR0hUOyBqKyspIHtcbiAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLmNyZWF0ZU1lbnVJdGVtXygpO1xuICAgICAgICBpdGVtLnBvc2l0aW9uLnNldChpLCBqLCAwKTtcbiAgICAgICAgaXRlbS5zY2FsZS5zZXQoMC45LCAwLjksIDAuMSk7XG4gICAgICAgIG1lbnUuYWRkKGl0ZW0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1lbnUucG9zaXRpb24uc2V0KC1XSURUSC80LCBIRUlHSFQvMiwgLTMpO1xuICAgIHJldHVybiBtZW51O1xuICB9XG5cbiAgY3JlYXRlTWVudUl0ZW1fKCkge1xuICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSgxLCAxLCAxKTtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe2NvbG9yOiBERUZBVUxUX0NPTE9SfSk7XG4gICAgdmFyIGN1YmUgPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuXG4gICAgcmV0dXJuIGN1YmU7XG4gIH1cblxuICBjcmVhdGVGbG9vcl8oKSB7XG4gICAgdmFyIGJveFNpemUgPSAxMDtcbiAgICB2YXIgbG9hZGVyID0gbmV3IFRIUkVFLlRleHR1cmVMb2FkZXIoKTtcbiAgICBsb2FkZXIubG9hZCgnaW1nL2JveC5wbmcnLCBvblRleHR1cmVMb2FkZWQpO1xuICAgIHZhciBvdXQgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuICAgIGZ1bmN0aW9uIG9uVGV4dHVyZUxvYWRlZCh0ZXh0dXJlKSB7XG4gICAgICB0ZXh0dXJlLndyYXBTID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gICAgICB0ZXh0dXJlLndyYXBUID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gICAgICB0ZXh0dXJlLnJlcGVhdC5zZXQoYm94U2l6ZSwgYm94U2l6ZSk7XG5cbiAgICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5Cb3hHZW9tZXRyeShib3hTaXplLCBib3hTaXplLCBib3hTaXplKTtcbiAgICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICAgIG1hcDogdGV4dHVyZSxcbiAgICAgICAgY29sb3I6IDB4MDE1NTAwLFxuICAgICAgICBzaWRlOiBUSFJFRS5CYWNrU2lkZVxuICAgICAgfSk7XG5cbiAgICAgIC8vIEFsaWduIHRoZSBza3lib3ggdG8gdGhlIGZsb29yICh3aGljaCBpcyBhdCB5PTApLlxuICAgICAgbGV0IHNreWJveCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gICAgICBza3lib3gucG9zaXRpb24ueSA9IGJveFNpemUvMjtcblxuICAgICAgb3V0LmFkZChza3lib3gpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5jb25zdCBIRUFEX0VMQk9XX09GRlNFVF9SSUdIVEhBTkRFRCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAuMTU1LCAtMC40NjUsIC0wLjE1KTtcbmNvbnN0IEhFQURfRUxCT1dfT0ZGU0VUX0xFRlRIQU5ERUQgPSBuZXcgVEhSRUUuVmVjdG9yMygtMC4xNTUsIC0wLjQ2NSwgLTAuMTUpO1xubGV0IGhlYWRfZWxib3dfb2Zmc2V0ID0gSEVBRF9FTEJPV19PRkZTRVRfUklHSFRIQU5ERUQ7XG5jb25zdCBFTEJPV19XUklTVF9PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMC4yNSk7XG5jb25zdCBXUklTVF9DT05UUk9MTEVSX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDAuMDUpO1xuY29uc3QgQVJNX0VYVEVOU0lPTl9PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygtMC4wOCwgMC4xNCwgMC4wOCk7XG5cbmNvbnN0IEVMQk9XX0JFTkRfUkFUSU8gPSAwLjQ7IC8vIDQwJSBlbGJvdywgNjAlIHdyaXN0LlxuY29uc3QgRVhURU5TSU9OX1JBVElPX1dFSUdIVCA9IDAuNDtcblxuY29uc3QgTUlOX0FOR1VMQVJfU1BFRUQgPSAwLjYxOyAvLyAzNSBkZWdyZWVzIHBlciBzZWNvbmQgKGluIHJhZGlhbnMpLlxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGFybSBtb2RlbCBmb3IgdGhlIERheWRyZWFtIGNvbnRyb2xsZXIuIEZlZWQgaXQgYSBjYW1lcmEgYW5kXG4gKiB0aGUgY29udHJvbGxlci4gVXBkYXRlIGl0IG9uIGEgUkFGLlxuICpcbiAqIEdldCB0aGUgbW9kZWwncyBwb3NlIHVzaW5nIGdldFBvc2UoKS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT3JpZW50YXRpb25Bcm1Nb2RlbCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuaXNMZWZ0SGFuZGVkID0gZmFsc2U7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyBjb250cm9sbGVyIG9yaWVudGF0aW9ucy5cbiAgICB0aGlzLmNvbnRyb2xsZXJRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICB0aGlzLmxhc3RDb250cm9sbGVyUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyBoZWFkIG9yaWVudGF0aW9ucy5cbiAgICB0aGlzLmhlYWRRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIC8vIEN1cnJlbnQgaGVhZCBwb3NpdGlvbi5cbiAgICB0aGlzLmhlYWRQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLy8gUG9zaXRpb25zIG9mIG90aGVyIGpvaW50cyAobW9zdGx5IGZvciBkZWJ1Z2dpbmcpLlxuICAgIHRoaXMuZWxib3dQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHRoaXMud3Jpc3RQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLy8gQ3VycmVudCBhbmQgcHJldmlvdXMgdGltZXMgdGhlIG1vZGVsIHdhcyB1cGRhdGVkLlxuICAgIHRoaXMudGltZSA9IG51bGw7XG4gICAgdGhpcy5sYXN0VGltZSA9IG51bGw7XG5cbiAgICAvLyBSb290IHJvdGF0aW9uLlxuICAgIHRoaXMucm9vdFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgLy8gQ3VycmVudCBwb3NlIHRoYXQgdGhpcyBhcm0gbW9kZWwgY2FsY3VsYXRlcy5cbiAgICB0aGlzLnBvc2UgPSB7XG4gICAgICBvcmllbnRhdGlvbjogbmV3IFRIUkVFLlF1YXRlcm5pb24oKSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgVEhSRUUuVmVjdG9yMygpXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZXRob2RzIHRvIHNldCBjb250cm9sbGVyIGFuZCBoZWFkIHBvc2UgKGluIHdvcmxkIGNvb3JkaW5hdGVzKS5cbiAgICovXG4gIHNldENvbnRyb2xsZXJPcmllbnRhdGlvbihxdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5sYXN0Q29udHJvbGxlclEuY29weSh0aGlzLmNvbnRyb2xsZXJRKTtcbiAgICB0aGlzLmNvbnRyb2xsZXJRLmNvcHkocXVhdGVybmlvbik7XG4gIH1cblxuICBzZXRIZWFkT3JpZW50YXRpb24ocXVhdGVybmlvbikge1xuICAgIHRoaXMuaGVhZFEuY29weShxdWF0ZXJuaW9uKTtcbiAgfVxuXG4gIHNldEhlYWRQb3NpdGlvbihwb3NpdGlvbikge1xuICAgIHRoaXMuaGVhZFBvcy5jb3B5KHBvc2l0aW9uKTtcbiAgfVxuXG4gIHNldExlZnRIYW5kZWQoaXNMZWZ0SGFuZGVkKSB7XG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBpc0xlZnRIYW5kZWQ7XG4gICAgaWYoaXNMZWZ0SGFuZGVkKXtcbiAgICAgIGhlYWRfZWxib3dfb2Zmc2V0ID0gSEVBRF9FTEJPV19PRkZTRVRfTEVGVEhBTkRFRDtcbiAgICB9ZWxzZXtcbiAgICAgIGhlYWRfZWxib3dfb2Zmc2V0ID0gSEVBRF9FTEJPV19PRkZTRVRfUklHSFRIQU5ERUQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBvbiBhIFJBRi5cbiAgICovXG4gIHVwZGF0ZSgpIHtcbiAgICB0aGlzLnRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIC8vIElmIHRoZSBjb250cm9sbGVyJ3MgYW5ndWxhciB2ZWxvY2l0eSBpcyBhYm92ZSBhIGNlcnRhaW4gYW1vdW50LCB3ZSBjYW5cbiAgICAvLyBhc3N1bWUgdG9yc28gcm90YXRpb24gYW5kIG1vdmUgdGhlIGVsYm93IGpvaW50IHJlbGF0aXZlIHRvIHRoZVxuICAgIC8vIGNhbWVyYSBvcmllbnRhdGlvbi5cbiAgICBsZXQgaGVhZFlhd1EgPSB0aGlzLmdldEhlYWRZYXdPcmllbnRhdGlvbl8oKTtcbiAgICBsZXQgdGltZURlbHRhID0gKHRoaXMudGltZSAtIHRoaXMubGFzdFRpbWUpIC8gMTAwMDtcbiAgICBsZXQgYW5nbGVEZWx0YSA9IHRoaXMucXVhdEFuZ2xlXyh0aGlzLmxhc3RDb250cm9sbGVyUSwgdGhpcy5jb250cm9sbGVyUSk7XG4gICAgbGV0IGNvbnRyb2xsZXJBbmd1bGFyU3BlZWQgPSBhbmdsZURlbHRhIC8gdGltZURlbHRhO1xuICAgIGlmIChjb250cm9sbGVyQW5ndWxhclNwZWVkID4gTUlOX0FOR1VMQVJfU1BFRUQpIHtcbiAgICAgIC8vIEF0dGVudWF0ZSB0aGUgUm9vdCByb3RhdGlvbiBzbGlnaHRseS5cbiAgICAgIHRoaXMucm9vdFEuc2xlcnAoaGVhZFlhd1EsIGFuZ2xlRGVsdGEgLyAxMClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yb290US5jb3B5KGhlYWRZYXdRKTtcbiAgICB9XG5cbiAgICAvLyBXZSB3YW50IHRvIG1vdmUgdGhlIGVsYm93IHVwIGFuZCB0byB0aGUgY2VudGVyIGFzIHRoZSB1c2VyIHBvaW50cyB0aGVcbiAgICAvLyBjb250cm9sbGVyIHVwd2FyZHMsIHNvIHRoYXQgdGhleSBjYW4gZWFzaWx5IHNlZSB0aGUgY29udHJvbGxlciBhbmQgaXRzXG4gICAgLy8gdG9vbCB0aXBzLlxuICAgIGxldCBjb250cm9sbGVyRXVsZXIgPSBuZXcgVEhSRUUuRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbih0aGlzLmNvbnRyb2xsZXJRLCAnWVhaJyk7XG4gICAgbGV0IGNvbnRyb2xsZXJYRGVnID0gVEhSRUUuTWF0aC5yYWRUb0RlZyhjb250cm9sbGVyRXVsZXIueCk7XG4gICAgbGV0IGV4dGVuc2lvblJhdGlvID0gdGhpcy5jbGFtcF8oKGNvbnRyb2xsZXJYRGVnIC0gMTEpIC8gKDUwIC0gMTEpLCAwLCAxKTtcblxuICAgIC8vIENvbnRyb2xsZXIgb3JpZW50YXRpb24gaW4gY2FtZXJhIHNwYWNlLlxuICAgIGxldCBjb250cm9sbGVyQ2FtZXJhUSA9IHRoaXMucm9vdFEuY2xvbmUoKS5pbnZlcnNlKCk7XG4gICAgY29udHJvbGxlckNhbWVyYVEubXVsdGlwbHkodGhpcy5jb250cm9sbGVyUSk7XG5cbiAgICAvLyBDYWxjdWxhdGUgZWxib3cgcG9zaXRpb24uXG4gICAgbGV0IGVsYm93UG9zID0gdGhpcy5lbGJvd1BvcztcbiAgICBlbGJvd1Bvcy5jb3B5KHRoaXMuaGVhZFBvcykuYWRkKGhlYWRfZWxib3dfb2Zmc2V0KTtcbiAgICBsZXQgZWxib3dPZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkoQVJNX0VYVEVOU0lPTl9PRkZTRVQpO1xuICAgIGVsYm93T2Zmc2V0Lm11bHRpcGx5U2NhbGFyKGV4dGVuc2lvblJhdGlvKTtcbiAgICBlbGJvd1Bvcy5hZGQoZWxib3dPZmZzZXQpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGpvaW50IGFuZ2xlcy4gR2VuZXJhbGx5IDQwJSBvZiByb3RhdGlvbiBhcHBsaWVkIHRvIGVsYm93LCA2MCVcbiAgICAvLyB0byB3cmlzdCwgYnV0IGlmIGNvbnRyb2xsZXIgaXMgcmFpc2VkIGhpZ2hlciwgbW9yZSByb3RhdGlvbiBjb21lcyBmcm9tXG4gICAgLy8gdGhlIHdyaXN0LlxuICAgIGxldCB0b3RhbEFuZ2xlID0gdGhpcy5xdWF0QW5nbGVfKGNvbnRyb2xsZXJDYW1lcmFRLCBuZXcgVEhSRUUuUXVhdGVybmlvbigpKTtcbiAgICBsZXQgdG90YWxBbmdsZURlZyA9IFRIUkVFLk1hdGgucmFkVG9EZWcodG90YWxBbmdsZSk7XG4gICAgbGV0IGxlcnBTdXBwcmVzc2lvbiA9IDEgLSBNYXRoLnBvdyh0b3RhbEFuZ2xlRGVnIC8gMTgwLCA0KTsgLy8gVE9ETyhzbXVzKTogPz8/XG5cbiAgICBsZXQgZWxib3dSYXRpbyA9IEVMQk9XX0JFTkRfUkFUSU87XG4gICAgbGV0IHdyaXN0UmF0aW8gPSAxIC0gRUxCT1dfQkVORF9SQVRJTztcbiAgICBsZXQgbGVycFZhbHVlID0gbGVycFN1cHByZXNzaW9uICpcbiAgICAgICAgKGVsYm93UmF0aW8gKyB3cmlzdFJhdGlvICogZXh0ZW5zaW9uUmF0aW8gKiBFWFRFTlNJT05fUkFUSU9fV0VJR0hUKTtcblxuICAgIGxldCB3cmlzdFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNsZXJwKGNvbnRyb2xsZXJDYW1lcmFRLCBsZXJwVmFsdWUpO1xuICAgIGxldCBpbnZXcmlzdFEgPSB3cmlzdFEuaW52ZXJzZSgpO1xuICAgIGxldCBlbGJvd1EgPSBjb250cm9sbGVyQ2FtZXJhUS5jbG9uZSgpLm11bHRpcGx5KGludldyaXN0USk7XG5cbiAgICAvLyBDYWxjdWxhdGUgb3VyIGZpbmFsIGNvbnRyb2xsZXIgcG9zaXRpb24gYmFzZWQgb24gYWxsIG91ciBqb2ludCByb3RhdGlvbnNcbiAgICAvLyBhbmQgbGVuZ3Rocy5cbiAgICAvKlxuICAgIHBvc2l0aW9uXyA9XG4gICAgICByb290X3JvdF8gKiAoXG4gICAgICAgIGNvbnRyb2xsZXJfcm9vdF9vZmZzZXRfICtcbjI6ICAgICAgKGFybV9leHRlbnNpb25fICogYW10X2V4dGVuc2lvbikgK1xuMTogICAgICBlbGJvd19yb3QgKiAoa0NvbnRyb2xsZXJGb3JlYXJtICsgKHdyaXN0X3JvdCAqIGtDb250cm9sbGVyUG9zaXRpb24pKVxuICAgICAgKTtcbiAgICAqL1xuICAgIGxldCB3cmlzdFBvcyA9IHRoaXMud3Jpc3RQb3M7XG4gICAgd3Jpc3RQb3MuY29weShXUklTVF9DT05UUk9MTEVSX09GRlNFVCk7XG4gICAgd3Jpc3RQb3MuYXBwbHlRdWF0ZXJuaW9uKHdyaXN0USk7XG4gICAgd3Jpc3RQb3MuYWRkKEVMQk9XX1dSSVNUX09GRlNFVCk7XG4gICAgd3Jpc3RQb3MuYXBwbHlRdWF0ZXJuaW9uKGVsYm93USk7XG4gICAgd3Jpc3RQb3MuYWRkKHRoaXMuZWxib3dQb3MpO1xuXG4gICAgbGV0IG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShBUk1fRVhURU5TSU9OX09GRlNFVCk7XG4gICAgb2Zmc2V0Lm11bHRpcGx5U2NhbGFyKGV4dGVuc2lvblJhdGlvKTtcblxuICAgIGxldCBwb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weSh0aGlzLndyaXN0UG9zKTtcbiAgICBwb3NpdGlvbi5hZGQob2Zmc2V0KTtcbiAgICBwb3NpdGlvbi5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG5cbiAgICBsZXQgb3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLmNvcHkodGhpcy5jb250cm9sbGVyUSk7XG5cbiAgICAvLyBTZXQgdGhlIHJlc3VsdGluZyBwb3NlIG9yaWVudGF0aW9uIGFuZCBwb3NpdGlvbi5cbiAgICB0aGlzLnBvc2Uub3JpZW50YXRpb24uY29weShvcmllbnRhdGlvbik7XG4gICAgdGhpcy5wb3NlLnBvc2l0aW9uLmNvcHkocG9zaXRpb24pO1xuXG4gICAgdGhpcy5sYXN0VGltZSA9IHRoaXMudGltZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwb3NlIGNhbGN1bGF0ZWQgYnkgdGhlIG1vZGVsLlxuICAgKi9cbiAgZ2V0UG9zZSgpIHtcbiAgICByZXR1cm4gdGhpcy5wb3NlO1xuICB9XG5cbiAgLyoqXG4gICAqIERlYnVnIG1ldGhvZHMgZm9yIHJlbmRlcmluZyB0aGUgYXJtIG1vZGVsLlxuICAgKi9cbiAgZ2V0Rm9yZWFybUxlbmd0aCgpIHtcbiAgICByZXR1cm4gRUxCT1dfV1JJU1RfT0ZGU0VULmxlbmd0aCgpO1xuICB9XG5cbiAgZ2V0RWxib3dQb3NpdGlvbigpIHtcbiAgICBsZXQgb3V0ID0gdGhpcy5lbGJvd1Bvcy5jbG9uZSgpO1xuICAgIHJldHVybiBvdXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucm9vdFEpO1xuICB9XG5cbiAgZ2V0V3Jpc3RQb3NpdGlvbigpIHtcbiAgICBsZXQgb3V0ID0gdGhpcy53cmlzdFBvcy5jbG9uZSgpO1xuICAgIHJldHVybiBvdXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucm9vdFEpO1xuICB9XG5cbiAgZ2V0SGVhZFlhd09yaWVudGF0aW9uXygpIHtcbiAgICBsZXQgaGVhZEV1bGVyID0gbmV3IFRIUkVFLkV1bGVyKCkuc2V0RnJvbVF1YXRlcm5pb24odGhpcy5oZWFkUSwgJ1lYWicpO1xuICAgIGhlYWRFdWxlci54ID0gMDtcbiAgICBoZWFkRXVsZXIueiA9IDA7XG4gICAgbGV0IGRlc3RpbmF0aW9uUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKGhlYWRFdWxlcik7XG4gICAgcmV0dXJuIGRlc3RpbmF0aW9uUTtcbiAgfVxuXG4gIGNsYW1wXyh2YWx1ZSwgbWluLCBtYXgpIHtcbiAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgodmFsdWUsIG1pbiksIG1heCk7XG4gIH1cblxuICBxdWF0QW5nbGVfKHExLCBxMikge1xuICAgIGxldCB2ZWMxID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIGxldCB2ZWMyID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIHZlYzEuYXBwbHlRdWF0ZXJuaW9uKHExKTtcbiAgICB2ZWMyLmFwcGx5UXVhdGVybmlvbihxMik7XG4gICAgcmV0dXJuIHZlYzEuYW5nbGVUbyh2ZWMyKTtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xuaW1wb3J0IEludGVyYWN0aW9uTW9kZXMgZnJvbSAnLi9yYXktaW50ZXJhY3Rpb24tbW9kZXMnXG5pbXBvcnQge2lzTW9iaWxlfSBmcm9tICcuL3V0aWwnXG5cbmNvbnN0IERSQUdfRElTVEFOQ0VfUFggPSAxMDtcblxuLyoqXG4gKiBFbnVtZXJhdGVzIGFsbCBwb3NzaWJsZSBpbnRlcmFjdGlvbiBtb2Rlcy4gU2V0cyB1cCBhbGwgZXZlbnQgaGFuZGxlcnMgKG1vdXNlLFxuICogdG91Y2gsIGV0YyksIGludGVyZmFjZXMgd2l0aCBnYW1lcGFkIEFQSS5cbiAqXG4gKiBFbWl0cyBldmVudHM6XG4gKiAgICBhY3Rpb246IElucHV0IGlzIGFjdGl2YXRlZCAobW91c2Vkb3duLCB0b3VjaHN0YXJ0LCBkYXlkcmVhbSBjbGljaywgdml2ZVxuICogICAgdHJpZ2dlcikuXG4gKiAgICByZWxlYXNlOiBJbnB1dCBpcyBkZWFjdGl2YXRlZCAobW91c2V1cCwgdG91Y2hlbmQsIGRheWRyZWFtIHJlbGVhc2UsIHZpdmVcbiAqICAgIHJlbGVhc2UpLlxuICogICAgY2FuY2VsOiBJbnB1dCBpcyBjYW5jZWxlZCAoZWcuIHdlIHNjcm9sbGVkIGluc3RlYWQgb2YgdGFwcGluZyBvblxuICogICAgbW9iaWxlL2Rlc2t0b3ApLlxuICogICAgcG9pbnRlcm1vdmUoMkQgcG9zaXRpb24pOiBUaGUgcG9pbnRlciBpcyBtb3ZlZCAobW91c2Ugb3IgdG91Y2gpLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSYXlDb250cm9sbGVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3Iob3B0X2VsKSB7XG4gICAgc3VwZXIoKTtcbiAgICBsZXQgZWwgPSBvcHRfZWwgfHwgd2luZG93O1xuXG4gICAgLy8gSGFuZGxlIGludGVyYWN0aW9ucy5cbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2VEb3duXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlVXBfLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydF8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZV8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmRfLmJpbmQodGhpcykpO1xuXG4gICAgLy8gVGhlIHBvc2l0aW9uIG9mIHRoZSBwb2ludGVyLlxuICAgIHRoaXMucG9pbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgLy8gVGhlIHByZXZpb3VzIHBvc2l0aW9uIG9mIHRoZSBwb2ludGVyLlxuICAgIHRoaXMubGFzdFBvaW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIC8vIFBvc2l0aW9uIG9mIHBvaW50ZXIgaW4gTm9ybWFsaXplZCBEZXZpY2UgQ29vcmRpbmF0ZXMgKE5EQykuXG4gICAgdGhpcy5wb2ludGVyTmRjID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICAvLyBIb3cgbXVjaCB3ZSBoYXZlIGRyYWdnZWQgKGlmIHdlIGFyZSBkcmFnZ2luZykuXG4gICAgdGhpcy5kcmFnRGlzdGFuY2UgPSAwO1xuICAgIC8vIEFyZSB3ZSBkcmFnZ2luZyBvciBub3QuXG4gICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgLy8gSXMgcG9pbnRlciBhY3RpdmUgb3Igbm90LlxuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IGZhbHNlO1xuICAgIC8vIElzIHRoaXMgYSBzeW50aGV0aWMgbW91c2UgZXZlbnQ/XG4gICAgdGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQgPSBmYWxzZTtcblxuICAgIC8vIEdhbWVwYWQgZXZlbnRzLlxuICAgIHRoaXMuZ2FtZXBhZCA9IG51bGw7XG5cbiAgICB0aGlzLmlzTGVmdEhhbmRlZCA9IGZhbHNlO1xuXG4gICAgLy8gVlIgRXZlbnRzLlxuICAgIGlmICghbmF2aWdhdG9yLmdldFZSRGlzcGxheXMpIHtcbiAgICAgIGNvbnNvbGUud2FybignV2ViVlIgQVBJIG5vdCBhdmFpbGFibGUhIENvbnNpZGVyIHVzaW5nIHRoZSB3ZWJ2ci1wb2x5ZmlsbC4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoKS50aGVuKChkaXNwbGF5cykgPT4ge1xuICAgICAgICB0aGlzLnZyRGlzcGxheSA9IGRpc3BsYXlzWzBdO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0SW50ZXJhY3Rpb25Nb2RlKCkge1xuICAgIC8vIFRPRE86IERlYnVnZ2luZyBvbmx5LlxuICAgIC8vcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuREFZRFJFQU07XG5cbiAgICB2YXIgZ2FtZXBhZCA9IHRoaXMuZ2V0VlJHYW1lcGFkXygpO1xuICAgIHRoaXMuZ2FtZXBhZCA9IGdhbWVwYWQ7XG4gICAgaWYgKGdhbWVwYWQpIHtcbiAgICAgIGlmKGdhbWVwYWQuaGFuZCl7XG4gICAgICAgIGlmKGdhbWVwYWQuaGFuZCA9PT0gJ2xlZnQnKXtcbiAgICAgICAgICB0aGlzLmlzTGVmdEhhbmRlZCA9IHRydWU7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIHRoaXMuaXNMZWZ0SGFuZGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCBwb3NlID0gZ2FtZXBhZC5wb3NlO1xuICAgICAgLy8gSWYgdGhlcmUncyBhIGdhbWVwYWQgY29ubmVjdGVkLCBkZXRlcm1pbmUgaWYgaXQncyBEYXlkcmVhbSBvciBhIFZpdmUuXG4gICAgICBpZiAocG9zZS5oYXNQb3NpdGlvbikge1xuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9zZS5oYXNPcmllbnRhdGlvbikge1xuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCwgaXQgbWlnaHQgYmUgQ2FyZGJvYXJkLCBtYWdpYyB3aW5kb3cgb3IgZGVza3RvcC5cbiAgICAgIGlmIChpc01vYmlsZSgpKSB7XG4gICAgICAgIC8vIEVpdGhlciBDYXJkYm9hcmQgb3IgbWFnaWMgd2luZG93LCBkZXBlbmRpbmcgb24gd2hldGhlciB3ZSBhcmVcbiAgICAgICAgLy8gcHJlc2VudGluZy5cbiAgICAgICAgaWYgKHRoaXMudnJEaXNwbGF5ICYmIHRoaXMudnJEaXNwbGF5LmlzUHJlc2VudGluZykge1xuICAgICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzBET0Y7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVE9VQ0g7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIG11c3QgYmUgb24gZGVza3RvcC5cbiAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuTU9VU0U7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEJ5IGRlZmF1bHQsIHVzZSBUT1VDSC5cbiAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDtcbiAgfVxuXG4gIGdldEdhbWVwYWRQb3NlKCkge1xuICAgIHZhciBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XG4gICAgcmV0dXJuIGdhbWVwYWQucG9zZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgaWYgdGhlcmUgaXMgYW4gYWN0aXZlIHRvdWNoIGV2ZW50IGdvaW5nIG9uLlxuICAgKiBPbmx5IHJlbGV2YW50IG9uIHRvdWNoIGRldmljZXNcbiAgICovXG4gIGdldElzVG91Y2hBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNUb3VjaEFjdGl2ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBjbGljayBpcyB0aGUgY2FyZGJvYXJkLWNvbXBhdGlibGUgZmFsbGJhY2tcbiAgICogY2xpY2sgb24gRGF5ZHJlYW0gY29udHJvbGxlcnMgc28gdGhhdCB3ZSBjYW4gZGVkdXBsaWNhdGUgaXQuXG4gICAqIFRPRE8oa2xhdXN3KTogSXQgd291bGQgYmUgbmljZSB0byBiZSBhYmxlIHRvIG1vdmUgaW50ZXJhY3Rpb25zXG4gICAqIHRvIHRoaXMgZXZlbnQgc2luY2UgaXQgY291bnRzIGFzIGEgdXNlciBhY3Rpb24gd2hpbGUgY29udHJvbGxlclxuICAgKiBjbGlja3MgZG9uJ3QuIEJ1dCB0aGF0IHdvdWxkIHJlcXVpcmUgbGFyZ2VyIHJlZmFjdG9yaW5nLlxuICAgKi9cbiAgaXNDYXJkYm9hcmRDb21wYXRDbGljayhlKSB7XG4gICAgbGV0IG1vZGUgPSB0aGlzLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIGlmIChtb2RlID09IEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRiAmJiBlLnNjcmVlblggPT0gMCAmJiBlLnNjcmVlblkgPT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHNldFNpemUoc2l6ZSkge1xuICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gIH1cblxuICBzZXRPZmZzZXQob2Zmc2V0KXtcbiAgICB0aGlzLm9mZnNldCA9IG9mZnNldDtcbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICBsZXQgbW9kZSA9IHRoaXMuZ2V0SW50ZXJhY3Rpb25Nb2RlKCk7XG4gICAgaWYgKG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GIHx8IG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GKSB7XG4gICAgICAvLyBJZiB3ZSdyZSBkZWFsaW5nIHdpdGggYSBnYW1lcGFkLCBjaGVjayBldmVyeSBhbmltYXRpb24gZnJhbWUgZm9yIGFcbiAgICAgIC8vIHByZXNzZWQgYWN0aW9uLlxuICAgICAgbGV0IGlzR2FtZXBhZFByZXNzZWQgPSB0aGlzLmdldEdhbWVwYWRCdXR0b25QcmVzc2VkXygpO1xuICAgICAgaWYgKGlzR2FtZXBhZFByZXNzZWQgJiYgIXRoaXMud2FzR2FtZXBhZFByZXNzZWQpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG4gICAgICB9XG4gICAgICBpZiAoIWlzR2FtZXBhZFByZXNzZWQgJiYgdGhpcy53YXNHYW1lcGFkUHJlc3NlZCkge1xuICAgICAgICB0aGlzLmVtaXQoJ3JheXVwJyk7XG4gICAgICB9XG4gICAgICB0aGlzLndhc0dhbWVwYWRQcmVzc2VkID0gaXNHYW1lcGFkUHJlc3NlZDtcbiAgICB9XG4gIH1cblxuICBnZXRHYW1lcGFkQnV0dG9uUHJlc3NlZF8oKSB7XG4gICAgdmFyIGdhbWVwYWQgPSB0aGlzLmdldFZSR2FtZXBhZF8oKTtcbiAgICBpZiAoIWdhbWVwYWQpIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCwgdGhlIGJ1dHRvbiB3YXMgbm90IHByZXNzZWQuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGZvciBjbGlja3MuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBnYW1lcGFkLmJ1dHRvbnMubGVuZ3RoOyArK2opIHtcbiAgICAgIGlmIChnYW1lcGFkLmJ1dHRvbnNbal0ucHJlc3NlZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgb25Nb3VzZURvd25fKGUpIHtcbiAgICBpZiAodGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQpIHJldHVybjtcbiAgICBpZiAodGhpcy5pc0NhcmRib2FyZENvbXBhdENsaWNrKGUpKSByZXR1cm47XG5cbiAgICB0aGlzLnN0YXJ0RHJhZ2dpbmdfKGUpO1xuICAgIHRoaXMuZW1pdCgncmF5ZG93bicpO1xuICB9XG5cbiAgb25Nb3VzZU1vdmVfKGUpIHtcbiAgICBpZiAodGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQpIHJldHVybjtcblxuICAgIHRoaXMudXBkYXRlUG9pbnRlcl8oZSk7XG4gICAgdGhpcy51cGRhdGVEcmFnRGlzdGFuY2VfKCk7XG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XG4gIH1cblxuICBvbk1vdXNlVXBfKGUpIHtcbiAgICB2YXIgaXNTeW50aGV0aWMgPSB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudDtcbiAgICB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCA9IGZhbHNlO1xuICAgIGlmIChpc1N5bnRoZXRpYykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmlzQ2FyZGJvYXJkQ29tcGF0Q2xpY2soZSkpIHJldHVybjtcblxuICAgIHRoaXMuZW5kRHJhZ2dpbmdfKCk7XG4gIH1cblxuICBvblRvdWNoU3RhcnRfKGUpIHtcbiAgICB0aGlzLmlzVG91Y2hBY3RpdmUgPSB0cnVlO1xuICAgIHZhciB0ID0gZS50b3VjaGVzWzBdO1xuICAgIHRoaXMuc3RhcnREcmFnZ2luZ18odCk7XG4gICAgdGhpcy51cGRhdGVUb3VjaFBvaW50ZXJfKGUpO1xuXG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG4gIH1cblxuICBvblRvdWNoTW92ZV8oZSkge1xuICAgIHRoaXMudXBkYXRlVG91Y2hQb2ludGVyXyhlKTtcbiAgICB0aGlzLnVwZGF0ZURyYWdEaXN0YW5jZV8oKTtcbiAgfVxuXG4gIG9uVG91Y2hFbmRfKGUpIHtcbiAgICB0aGlzLmVuZERyYWdnaW5nXygpO1xuXG4gICAgLy8gU3VwcHJlc3MgZHVwbGljYXRlIGV2ZW50cyBmcm9tIHN5bnRoZXRpYyBtb3VzZSBldmVudHMuXG4gICAgdGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQgPSB0cnVlO1xuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlVG91Y2hQb2ludGVyXyhlKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyB0b3VjaGVzIGFycmF5LCBpZ25vcmUuXG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUud2FybignUmVjZWl2ZWQgdG91Y2ggZXZlbnQgd2l0aCBubyB0b3VjaGVzLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdCA9IGUudG91Y2hlc1swXTtcbiAgICB0aGlzLnVwZGF0ZVBvaW50ZXJfKHQpO1xuICB9XG5cbiAgdXBkYXRlUG9pbnRlcl8oZSkge1xuICAgIC8vIEhvdyBtdWNoIHRoZSBwb2ludGVyIG1vdmVkLlxuICAgIHRoaXMucG9pbnRlci5zZXQoZS5jbGllbnRYIC0gdGhpcy5vZmZzZXQubGVmdCwgZS5jbGllbnRZIC0gdGhpcy5vZmZzZXQudG9wKTtcbiAgICB0aGlzLnBvaW50ZXJOZGMueCA9ICgoZS5jbGllbnRYIC0gdGhpcy5vZmZzZXQubGVmdCkgLyB0aGlzLnNpemUud2lkdGgpICogMiAtIDE7XG4gICAgdGhpcy5wb2ludGVyTmRjLnkgPSAtICgoZS5jbGllbnRZIC0gdGhpcy5vZmZzZXQudG9wKSAvIHRoaXMuc2l6ZS5oZWlnaHQpICogMiArIDE7XG4gIH1cblxuICB1cGRhdGVEcmFnRGlzdGFuY2VfKCkge1xuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgIHZhciBkaXN0YW5jZSA9IHRoaXMubGFzdFBvaW50ZXIuc3ViKHRoaXMucG9pbnRlcikubGVuZ3RoKCk7XG4gICAgICB0aGlzLmRyYWdEaXN0YW5jZSArPSBkaXN0YW5jZTtcbiAgICAgIHRoaXMubGFzdFBvaW50ZXIuY29weSh0aGlzLnBvaW50ZXIpO1xuXG5cbiAgICAgIC8vY29uc29sZS5sb2coJ2RyYWdEaXN0YW5jZScsIHRoaXMuZHJhZ0Rpc3RhbmNlKTtcbiAgICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA+IERSQUdfRElTVEFOQ0VfUFgpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXljYW5jZWwnKTtcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhcnREcmFnZ2luZ18oZSkge1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgdGhpcy5sYXN0UG9pbnRlci5zZXQoZS5jbGllbnRYIC0gdGhpcy5vZmZzZXQubGVmdCwgZS5jbGllbnRZIC0gdGhpcy5vZmZzZXQudG9wKTtcbiAgfVxuXG4gIGVuZERyYWdnaW5nXygpIHtcbiAgICBpZiAodGhpcy5kcmFnRGlzdGFuY2UgPCBEUkFHX0RJU1RBTkNFX1BYKSB7XG4gICAgICB0aGlzLmVtaXQoJ3JheXVwJyk7XG4gICAgfVxuICAgIHRoaXMuZHJhZ0Rpc3RhbmNlID0gMDtcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBmaXJzdCBWUi1lbmFibGVkIGdhbWVwYWQuXG4gICAqL1xuICBnZXRWUkdhbWVwYWRfKCkge1xuICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCBBUEksIHRoZXJlJ3Mgbm8gZ2FtZXBhZC5cbiAgICBpZiAoIW5hdmlnYXRvci5nZXRHYW1lcGFkcykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGdhbWVwYWRzID0gbmF2aWdhdG9yLmdldEdhbWVwYWRzKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lcGFkcy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIGdhbWVwYWQgPSBnYW1lcGFkc1tpXTtcbiAgICAgIC8vIFRoZSBhcnJheSBtYXkgY29udGFpbiB1bmRlZmluZWQgZ2FtZXBhZHMsIHNvIGNoZWNrIGZvciB0aGF0IGFzIHdlbGwgYXNcbiAgICAgIC8vIGEgbm9uLW51bGwgcG9zZS5cbiAgICAgIGlmIChnYW1lcGFkICYmIGdhbWVwYWQucG9zZSkge1xuICAgICAgICByZXR1cm4gZ2FtZXBhZDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBPcmllbnRhdGlvbkFybU1vZGVsIGZyb20gJy4vb3JpZW50YXRpb24tYXJtLW1vZGVsJ1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xuaW1wb3J0IFJheVJlbmRlcmVyIGZyb20gJy4vcmF5LXJlbmRlcmVyJ1xuaW1wb3J0IFJheUNvbnRyb2xsZXIgZnJvbSAnLi9yYXktY29udHJvbGxlcidcbmltcG9ydCBJbnRlcmFjdGlvbk1vZGVzIGZyb20gJy4vcmF5LWludGVyYWN0aW9uLW1vZGVzJ1xuXG4vKipcbiAqIEFQSSB3cmFwcGVyIGZvciB0aGUgaW5wdXQgbGlicmFyeS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmF5SW5wdXQgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihjYW1lcmEsIG9wdF9lbCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICB0aGlzLnJlbmRlcmVyID0gbmV3IFJheVJlbmRlcmVyKGNhbWVyYSk7XG4gICAgdGhpcy5jb250cm9sbGVyID0gbmV3IFJheUNvbnRyb2xsZXIob3B0X2VsKTtcblxuICAgIC8vIEFybSBtb2RlbCBuZWVkZWQgdG8gdHJhbnNmb3JtIGNvbnRyb2xsZXIgb3JpZW50YXRpb24gaW50byBwcm9wZXIgcG9zZS5cbiAgICB0aGlzLmFybU1vZGVsID0gbmV3IE9yaWVudGF0aW9uQXJtTW9kZWwoKTtcblxuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5ZG93bicsIHRoaXMub25SYXlEb3duXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheXVwJywgdGhpcy5vblJheVVwXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheWNhbmNlbCcsIHRoaXMub25SYXlDYW5jZWxfLmJpbmQodGhpcykpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbigncG9pbnRlcm1vdmUnLCB0aGlzLm9uUG9pbnRlck1vdmVfLmJpbmQodGhpcykpO1xuICAgIHRoaXMucmVuZGVyZXIub24oJ3JheW92ZXInLCAobWVzaCkgPT4geyB0aGlzLmVtaXQoJ3JheW92ZXInLCBtZXNoKSB9KTtcbiAgICB0aGlzLnJlbmRlcmVyLm9uKCdyYXlvdXQnLCAobWVzaCkgPT4geyB0aGlzLmVtaXQoJ3JheW91dCcsIG1lc2gpIH0pO1xuXG4gICAgLy8gQnkgZGVmYXVsdCwgcHV0IHRoZSBwb2ludGVyIG9mZnNjcmVlbi5cbiAgICB0aGlzLnBvaW50ZXJOZGMgPSBuZXcgVEhSRUUuVmVjdG9yMigxLCAxKTtcblxuICAgIC8vIEV2ZW50IGhhbmRsZXJzLlxuICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgfVxuXG4gIGFkZChvYmplY3QsIGhhbmRsZXJzKSB7XG4gICAgdGhpcy5yZW5kZXJlci5hZGQob2JqZWN0LCBoYW5kbGVycyk7XG4gICAgdGhpcy5oYW5kbGVyc1tvYmplY3QuaWRdID0gaGFuZGxlcnM7XG4gIH1cblxuICByZW1vdmUob2JqZWN0KSB7XG4gICAgdGhpcy5yZW5kZXJlci5yZW1vdmUob2JqZWN0KTtcbiAgICBkZWxldGUgdGhpcy5oYW5kbGVyc1tvYmplY3QuaWRdXG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgbGV0IGxvb2tBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICBsb29rQXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuXG4gICAgbGV0IG1vZGUgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0SW50ZXJhY3Rpb25Nb2RlKCk7XG4gICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuTU9VU0U6XG4gICAgICAgIC8vIERlc2t0b3AgbW91c2UgbW9kZSwgbW91c2UgY29vcmRpbmF0ZXMgYXJlIHdoYXQgbWF0dGVycy5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb2ludGVyKHRoaXMucG9pbnRlck5kYyk7XG4gICAgICAgIC8vIEhpZGUgdGhlIHJheSBhbmQgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eShmYWxzZSk7XG5cbiAgICAgICAgLy8gSW4gbW91c2UgbW9kZSByYXkgcmVuZGVyZXIgaXMgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVE9VQ0g6XG4gICAgICAgIC8vIE1vYmlsZSBtYWdpYyB3aW5kb3cgbW9kZS4gVG91Y2ggY29vcmRpbmF0ZXMgbWF0dGVyLCBidXQgd2Ugd2FudCB0b1xuICAgICAgICAvLyBoaWRlIHRoZSByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvaW50ZXIodGhpcy5wb2ludGVyTmRjKTtcblxuICAgICAgICAvLyBIaWRlIHRoZSByYXkgYW5kIHRoZSByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkoZmFsc2UpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KGZhbHNlKTtcblxuICAgICAgICAvLyBJbiB0b3VjaCBtb2RlIHRoZSByYXkgcmVuZGVyZXIgaXMgb25seSBhY3RpdmUgb24gdG91Y2guXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRoaXMuY29udHJvbGxlci5nZXRJc1RvdWNoQWN0aXZlKCkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlZSXzBET0Y6XG4gICAgICAgIC8vIENhcmRib2FyZCBtb2RlLCB3ZSdyZSBkZWFsaW5nIHdpdGggYSBnYXplIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24odGhpcy5jYW1lcmEucG9zaXRpb24pO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuXG4gICAgICAgIC8vIFJldGljbGUgb25seS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eSh0cnVlKTtcblxuICAgICAgICAvLyBSYXkgcmVuZGVyZXIgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRjpcbiAgICAgICAgLy8gRGF5ZHJlYW0sIG91ciBvcmlnaW4gaXMgc2xpZ2h0bHkgb2ZmIChkZXBlbmRpbmcgb24gaGFuZGVkbmVzcykuXG4gICAgICAgIC8vIEJ1dCB3ZSBzaG91bGQgYmUgdXNpbmcgdGhlIG9yaWVudGF0aW9uIGZyb20gdGhlIGdhbWVwYWQuXG4gICAgICAgIC8vIFRPRE8oc211cyk6IEltcGxlbWVudCB0aGUgcmVhbCBhcm0gbW9kZWwuXG4gICAgICAgIHZhciBwb3NlID0gdGhpcy5jb250cm9sbGVyLmdldEdhbWVwYWRQb3NlKCk7XG4gICAgICAgIC8vIERlYnVnIG9ubHk6IHVzZSBjYW1lcmEgYXMgaW5wdXQgY29udHJvbGxlci5cbiAgICAgICAgLy9sZXQgY29udHJvbGxlck9yaWVudGF0aW9uID0gdGhpcy5jYW1lcmEucXVhdGVybmlvbjtcbiAgICAgICAgbGV0IGNvbnRyb2xsZXJPcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuZnJvbUFycmF5KHBvc2Uub3JpZW50YXRpb24pO1xuXG4gICAgICAgIC8vIFRyYW5zZm9ybSB0aGUgY29udHJvbGxlciBpbnRvIHRoZSBjYW1lcmEgY29vcmRpbmF0ZSBzeXN0ZW0uXG4gICAgICAgIC8qXG4gICAgICAgIGNvbnRyb2xsZXJPcmllbnRhdGlvbi5tdWx0aXBseShcbiAgICAgICAgICAgIG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUF4aXNBbmdsZShuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKSwgTWF0aC5QSSkpO1xuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ueCAqPSAtMTtcbiAgICAgICAgY29udHJvbGxlck9yaWVudGF0aW9uLnogKj0gLTE7XG4gICAgICAgICovXG5cbiAgICAgICAgLy8gRmVlZCBjYW1lcmEgYW5kIGNvbnRyb2xsZXIgaW50byB0aGUgYXJtIG1vZGVsLlxuICAgICAgICB0aGlzLmFybU1vZGVsLnNldEhlYWRPcmllbnRhdGlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRIZWFkUG9zaXRpb24odGhpcy5jYW1lcmEucG9zaXRpb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnNldENvbnRyb2xsZXJPcmllbnRhdGlvbihjb250cm9sbGVyT3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnVwZGF0ZSgpO1xuXG4gICAgICAgIC8vIEdldCByZXN1bHRpbmcgcG9zZSBhbmQgY29uZmlndXJlIHRoZSByZW5kZXJlci5cbiAgICAgICAgbGV0IG1vZGVsUG9zZSA9IHRoaXMuYXJtTW9kZWwuZ2V0UG9zZSgpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKG1vZGVsUG9zZS5wb3NpdGlvbik7XG4gICAgICAgIC8vdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbihuZXcgVEhSRUUuVmVjdG9yMygpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbihtb2RlbFBvc2Uub3JpZW50YXRpb24pO1xuICAgICAgICAvL3RoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24oY29udHJvbGxlck9yaWVudGF0aW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRMZWZ0SGFuZGVkKHRoaXMuY29udHJvbGxlci5pc0xlZnRIYW5kZWQpO1xuICAgICAgICAvLyBTaG93IHJheSBhbmQgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KHRydWUpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KHRydWUpO1xuXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GOlxuICAgICAgICAvLyBWaXZlLCBvcmlnaW4gZGVwZW5kcyBvbiB0aGUgcG9zaXRpb24gb2YgdGhlIGNvbnRyb2xsZXIuXG4gICAgICAgIC8vIFRPRE8oc211cykuLi5cbiAgICAgICAgdmFyIHBvc2UgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0R2FtZXBhZFBvc2UoKTtcblxuICAgICAgICAvLyBDaGVjayB0aGF0IHRoZSBwb3NlIGlzIHZhbGlkLlxuICAgICAgICBpZiAoIXBvc2Uub3JpZW50YXRpb24gfHwgIXBvc2UucG9zaXRpb24pIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgZ2FtZXBhZCBwb3NlLiBDYW5cXCd0IHVwZGF0ZSByYXkuJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5mcm9tQXJyYXkocG9zZS5vcmllbnRhdGlvbik7XG4gICAgICAgIGxldCBwb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuZnJvbUFycmF5KHBvc2UucG9zaXRpb24pO1xuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24ob3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKHBvc2l0aW9uKTtcblxuICAgICAgICAvLyBTaG93IHJheSBhbmQgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KHRydWUpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KHRydWUpO1xuXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Vua25vd24gaW50ZXJhY3Rpb24gbW9kZS4nKTtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXJlci51cGRhdGUoKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIudXBkYXRlKCk7XG4gIH1cblxuICBzZXRTaXplKHNpemUpIHtcbiAgICB0aGlzLmNvbnRyb2xsZXIuc2V0U2l6ZShzaXplKTtcbiAgfVxuXG4gIHNldE9mZnNldChvZmZzZXQpe1xuICAgIHRoaXMuY29udHJvbGxlci5zZXRPZmZzZXQob2Zmc2V0KTtcbiAgfVxuXG4gIGdldE1lc2goKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZ2V0UmV0aWNsZVJheU1lc2goKTtcbiAgfVxuXG4gIGdldE9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXRPcmlnaW4oKTtcbiAgfVxuXG4gIGdldERpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXREaXJlY3Rpb24oKTtcbiAgfVxuXG4gIGdldFJpZ2h0RGlyZWN0aW9uKCkge1xuICAgIGxldCBsb29rQXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbG9va0F0LmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcbiAgICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoKS5jcm9zc1ZlY3RvcnMobG9va0F0LCB0aGlzLmNhbWVyYS51cCk7XG4gIH1cblxuICBvblJheURvd25fKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdvblJheURvd25fJyk7XG5cbiAgICAvLyBGb3JjZSB0aGUgcmVuZGVyZXIgdG8gcmF5Y2FzdC5cbiAgICB0aGlzLnJlbmRlcmVyLnVwZGF0ZSgpO1xuICAgIGxldCBtZXNoID0gdGhpcy5yZW5kZXJlci5nZXRTZWxlY3RlZE1lc2goKTtcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nLCBtZXNoKTtcblxuICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICB9XG5cbiAgb25SYXlVcF8oZSkge1xuICAgIC8vY29uc29sZS5sb2coJ29uUmF5VXBfJyk7XG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xuICAgIHRoaXMuZW1pdCgncmF5dXAnLCBtZXNoKTtcblxuICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKGZhbHNlKTtcbiAgfVxuXG4gIG9uUmF5Q2FuY2VsXyhlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnb25SYXlDYW5jZWxfJyk7XG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xuICAgIHRoaXMuZW1pdCgncmF5Y2FuY2VsJywgbWVzaCk7XG4gIH1cblxuICBvblBvaW50ZXJNb3ZlXyhuZGMpIHtcbiAgICB0aGlzLnBvaW50ZXJOZGMuY29weShuZGMpO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgSW50ZXJhY3Rpb25Nb2RlcyA9IHtcbiAgTU9VU0U6IDEsXG4gIFRPVUNIOiAyLFxuICBWUl8wRE9GOiAzLFxuICBWUl8zRE9GOiA0LFxuICBWUl82RE9GOiA1XG59O1xuXG5leHBvcnQgeyBJbnRlcmFjdGlvbk1vZGVzIGFzIGRlZmF1bHQgfTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7YmFzZTY0fSBmcm9tICcuL3V0aWwnXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnXG5cbmNvbnN0IGdsc2xpZnkgPSByZXF1aXJlKCdnbHNsaWZ5Jyk7XG5cbmNvbnN0IFJFVElDTEVfRElTVEFOQ0UgPSAxO1xuY29uc3QgSU5ORVJfUkFESVVTID0gMC4wMTtcbmNvbnN0IE9VVEVSX1JBRElVUyA9IDAuMDI7XG5jb25zdCBSQVlfUkFESVVTID0gMC4wMDI7XG4vKipcbiAqIEhhbmRsZXMgcmF5IGlucHV0IHNlbGVjdGlvbiBmcm9tIGZyYW1lIG9mIHJlZmVyZW5jZSBvZiBhbiBhcmJpdHJhcnkgb2JqZWN0LlxuICpcbiAqIFRoZSBzb3VyY2Ugb2YgdGhlIHJheSBpcyBmcm9tIHZhcmlvdXMgbG9jYXRpb25zOlxuICpcbiAqIERlc2t0b3A6IG1vdXNlLlxuICogTWFnaWMgd2luZG93OiB0b3VjaC5cbiAqIENhcmRib2FyZDogY2FtZXJhLlxuICogRGF5ZHJlYW06IDNET0YgY29udHJvbGxlciB2aWEgZ2FtZXBhZCAoYW5kIHNob3cgcmF5KS5cbiAqIFZpdmU6IDZET0YgY29udHJvbGxlciB2aWEgZ2FtZXBhZCAoYW5kIHNob3cgcmF5KS5cbiAqXG4gKiBFbWl0cyBzZWxlY3Rpb24gZXZlbnRzOlxuICogICAgIHJheW92ZXIobWVzaCk6IFRoaXMgbWVzaCB3YXMgc2VsZWN0ZWQuXG4gKiAgICAgcmF5b3V0KG1lc2gpOiBUaGlzIG1lc2ggd2FzIHVuc2VsZWN0ZWQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheVJlbmRlcmVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoY2FtZXJhLCBvcHRfcGFyYW1zKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXG4gICAgdmFyIHBhcmFtcyA9IG9wdF9wYXJhbXMgfHwge307XG5cbiAgICAvLyBXaGljaCBvYmplY3RzIGFyZSBpbnRlcmFjdGl2ZSAoa2V5ZWQgb24gaWQpLlxuICAgIHRoaXMubWVzaGVzID0ge307XG5cbiAgICAvLyBXaGljaCBvYmplY3RzIGFyZSBjdXJyZW50bHkgc2VsZWN0ZWQgKGtleWVkIG9uIGlkKS5cbiAgICB0aGlzLnNlbGVjdGVkID0ge307XG5cbiAgICAvLyBUaGUgcmF5Y2FzdGVyLlxuICAgIHRoaXMucmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuXG4gICAgLy8gUG9zaXRpb24gYW5kIG9yaWVudGF0aW9uLCBpbiBhZGRpdGlvbi5cbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICB0aGlzLm9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIHRoaXMucm9vdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgLy8gQWRkIHRoZSByZXRpY2xlIG1lc2ggdG8gdGhlIHJvb3Qgb2YgdGhlIG9iamVjdC5cbiAgICB0aGlzLnJldGljbGUgPSB0aGlzLmNyZWF0ZVJldGljbGVfKCk7XG4gICAgdGhpcy5yb290LmFkZCh0aGlzLnJldGljbGUpO1xuXG4gICAgLy8gQWRkIHRoZSByYXkgdG8gdGhlIHJvb3Qgb2YgdGhlIG9iamVjdC5cbiAgICB0aGlzLnJheSA9IHRoaXMuY3JlYXRlUmF5XygpO1xuICAgIHRoaXMucm9vdC5hZGQodGhpcy5yYXkpO1xuXG4gICAgLy8gSG93IGZhciB0aGUgcmV0aWNsZSBpcyBjdXJyZW50bHkgZnJvbSB0aGUgcmV0aWNsZSBvcmlnaW4uXG4gICAgdGhpcy5yZXRpY2xlRGlzdGFuY2UgPSBSRVRJQ0xFX0RJU1RBTkNFO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGFuIG9iamVjdCBzbyB0aGF0IGl0IGNhbiBiZSBpbnRlcmFjdGVkIHdpdGguXG4gICAqL1xuICBhZGQob2JqZWN0KSB7XG4gICAgdGhpcy5tZXNoZXNbb2JqZWN0LmlkXSA9IG9iamVjdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmV2ZW50IGFuIG9iamVjdCBmcm9tIGJlaW5nIGludGVyYWN0ZWQgd2l0aC5cbiAgICovXG4gIHJlbW92ZShvYmplY3QpIHtcbiAgICB2YXIgaWQgPSBvYmplY3QuaWQ7XG4gICAgaWYgKHRoaXMubWVzaGVzW2lkXSkge1xuICAgICAgLy8gSWYgdGhlcmUncyBubyBleGlzdGluZyBtZXNoLCB3ZSBjYW4ndCByZW1vdmUgaXQuXG4gICAgICBkZWxldGUgdGhpcy5tZXNoZXNbaWRdO1xuICAgIH1cbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGN1cnJlbnRseSBzZWxlY3RlZCwgcmVtb3ZlIGl0LlxuICAgIGlmICh0aGlzLnNlbGVjdGVkW2lkXSkge1xuICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbb2JqZWN0LmlkXTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgLy8gRG8gdGhlIHJheWNhc3RpbmcgYW5kIGlzc3VlIHZhcmlvdXMgZXZlbnRzIGFzIG5lZWRlZC5cbiAgICBmb3IgKGxldCBpZCBpbiB0aGlzLm1lc2hlcykge1xuICAgICAgbGV0IG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XG4gICAgICBsZXQgaW50ZXJzZWN0cyA9IHRoaXMucmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdChtZXNoLCB0cnVlKTtcbiAgICAgIGlmIChpbnRlcnNlY3RzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgLy8gY29uc29sZS53YXJuKCdVbmV4cGVjdGVkOiBtdWx0aXBsZSBtZXNoZXMgaW50ZXJzZWN0ZWQuJyk7XG4gICAgICB9XG4gICAgICBsZXQgaXNJbnRlcnNlY3RlZCA9IChpbnRlcnNlY3RzLmxlbmd0aCA+IDApO1xuICAgICAgbGV0IGlzU2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkW2lkXTtcblxuICAgICAgLy8gSWYgaXQncyBuZXdseSBzZWxlY3RlZCwgc2VuZCByYXlvdmVyLlxuICAgICAgaWYgKGlzSW50ZXJzZWN0ZWQgJiYgIWlzU2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFtpZF0gPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgIHRoaXMuZW1pdCgncmF5b3ZlcicsIG1lc2gpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0J3Mgbm8gbG9uZ2VyIGludGVyc2VjdGVkLCBzZW5kIHJheW91dC5cbiAgICAgIGlmICghaXNJbnRlcnNlY3RlZCAmJiBpc1NlbGVjdGVkKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW2lkXTtcbiAgICAgICAgdGhpcy5tb3ZlUmV0aWNsZV8obnVsbCk7XG4gICAgICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNJbnRlcnNlY3RlZCkge1xuICAgICAgICB0aGlzLm1vdmVSZXRpY2xlXyhpbnRlcnNlY3RzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luIG9mIHRoZSByYXkuXG4gICAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3IgUG9zaXRpb24gb2YgdGhlIG9yaWdpbiBvZiB0aGUgcGlja2luZyByYXkuXG4gICAqL1xuICBzZXRQb3NpdGlvbih2ZWN0b3IpIHtcbiAgICB0aGlzLnBvc2l0aW9uLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgfVxuXG4gIGdldE9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHJheS5cbiAgICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvciBVbml0IHZlY3RvciBjb3JyZXNwb25kaW5nIHRvIGRpcmVjdGlvbi5cbiAgICovXG4gIHNldE9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLm9yaWVudGF0aW9uLmNvcHkocXVhdGVybmlvbik7XG5cbiAgICB2YXIgcG9pbnRBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKS5hcHBseVF1YXRlcm5pb24ocXVhdGVybmlvbik7XG4gICAgdGhpcy5yYXljYXN0ZXIucmF5LmRpcmVjdGlvbi5jb3B5KHBvaW50QXQpXG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICBnZXREaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmF5Y2FzdGVyLnJheS5kaXJlY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9pbnRlciBvbiB0aGUgc2NyZWVuIGZvciBjYW1lcmEgKyBwb2ludGVyIGJhc2VkIHBpY2tpbmcuIFRoaXNcbiAgICogc3VwZXJzY2VkZXMgb3JpZ2luIGFuZCBkaXJlY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gdmVjdG9yIFRoZSBwb3NpdGlvbiBvZiB0aGUgcG9pbnRlciAoc2NyZWVuIGNvb3JkcykuXG4gICAqL1xuICBzZXRQb2ludGVyKHZlY3Rvcikge1xuICAgIHRoaXMucmF5Y2FzdGVyLnNldEZyb21DYW1lcmEodmVjdG9yLCB0aGlzLmNhbWVyYSk7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWVzaCwgd2hpY2ggaW5jbHVkZXMgcmV0aWNsZSBhbmQvb3IgcmF5LiBUaGlzIG1lc2ggaXMgdGhlbiBhZGRlZFxuICAgKiB0byB0aGUgc2NlbmUuXG4gICAqL1xuICBnZXRSZXRpY2xlUmF5TWVzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBvYmplY3QgaW4gdGhlIHNjZW5lLlxuICAgKi9cbiAgZ2V0U2VsZWN0ZWRNZXNoKCkge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgbGV0IG1lc2ggPSBudWxsO1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgIGNvdW50ICs9IDE7XG4gICAgICBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgIH1cbiAgICBpZiAoY291bnQgPiAxKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ01vcmUgdGhhbiBvbmUgbWVzaCBzZWxlY3RlZC4nKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc2g7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgYW5kIHNob3dzIHRoZSByZXRpY2xlLlxuICAgKi9cbiAgc2V0UmV0aWNsZVZpc2liaWxpdHkoaXNWaXNpYmxlKSB7XG4gICAgdGhpcy5yZXRpY2xlLnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBvciBkaXNhYmxlcyB0aGUgcmF5Y2FzdGluZyByYXkgd2hpY2ggZ3JhZHVhbGx5IGZhZGVzIG91dCBmcm9tXG4gICAqIHRoZSBvcmlnaW4uXG4gICAqL1xuICBzZXRSYXlWaXNpYmlsaXR5KGlzVmlzaWJsZSkge1xuICAgIHRoaXMucmF5LnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhbmQgZGlzYWJsZXMgdGhlIHJheWNhc3Rlci4gRm9yIHRvdWNoLCB3aGVyZSBmaW5nZXIgdXAgbWVhbnMgd2VcbiAgICogc2hvdWxkbid0IGJlIHJheWNhc3RpbmcuXG4gICAqL1xuICBzZXRBY3RpdmUoaXNBY3RpdmUpIHtcbiAgICAvLyBJZiBub3RoaW5nIGNoYW5nZWQsIGRvIG5vdGhpbmcuXG4gICAgaWYgKHRoaXMuaXNBY3RpdmUgPT0gaXNBY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVE9ETyhzbXVzKTogU2hvdyB0aGUgcmF5IG9yIHJldGljbGUgYWRqdXN0IGluIHJlc3BvbnNlLlxuICAgIHRoaXMuaXNBY3RpdmUgPSBpc0FjdGl2ZTtcblxuICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgIHRoaXMubW92ZVJldGljbGVfKG51bGwpO1xuICAgICAgZm9yIChsZXQgaWQgaW4gdGhpcy5zZWxlY3RlZCkge1xuICAgICAgICBsZXQgbWVzaCA9IHRoaXMubWVzaGVzW2lkXTtcbiAgICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbaWRdO1xuICAgICAgICB0aGlzLmVtaXQoJ3JheW91dCcsIG1lc2gpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVJheWNhc3Rlcl8oKSB7XG4gICAgdmFyIHJheSA9IHRoaXMucmF5Y2FzdGVyLnJheTtcblxuICAgIC8vIFBvc2l0aW9uIHRoZSByZXRpY2xlIGF0IGEgZGlzdGFuY2UsIGFzIGNhbGN1bGF0ZWQgZnJvbSB0aGUgb3JpZ2luIGFuZFxuICAgIC8vIGRpcmVjdGlvbi5cbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLnJldGljbGUucG9zaXRpb247XG4gICAgcG9zaXRpb24uY29weShyYXkuZGlyZWN0aW9uKTtcbiAgICBwb3NpdGlvbi5tdWx0aXBseVNjYWxhcih0aGlzLnJldGljbGVEaXN0YW5jZSk7XG4gICAgcG9zaXRpb24uYWRkKHJheS5vcmlnaW4pO1xuXG4gICAgLy8gU2V0IHBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiBvZiB0aGUgcmF5IHNvIHRoYXQgaXQgZ29lcyBmcm9tIG9yaWdpbiB0b1xuICAgIC8vIHJldGljbGUuXG4gICAgdmFyIGRlbHRhID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHJheS5kaXJlY3Rpb24pO1xuICAgIGRlbHRhLm11bHRpcGx5U2NhbGFyKHRoaXMucmV0aWNsZURpc3RhbmNlKTtcbiAgICB0aGlzLnJheS5zY2FsZS55ID0gZGVsdGEubGVuZ3RoKCk7XG4gICAgdmFyIGFycm93ID0gbmV3IFRIUkVFLkFycm93SGVscGVyKHJheS5kaXJlY3Rpb24sIHJheS5vcmlnaW4pO1xuICAgIHRoaXMucmF5LnJvdGF0aW9uLmNvcHkoYXJyb3cucm90YXRpb24pO1xuICAgIHRoaXMucmF5LnBvc2l0aW9uLmFkZFZlY3RvcnMocmF5Lm9yaWdpbiwgZGVsdGEubXVsdGlwbHlTY2FsYXIoMC41KSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgZ2VvbWV0cnkgb2YgdGhlIHJldGljbGUuXG4gICAqL1xuICBjcmVhdGVSZXRpY2xlXygpIHtcbiAgICAvLyBDcmVhdGUgYSBzcGhlcmljYWwgcmV0aWNsZS5cbiAgICBsZXQgaW5uZXJHZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeShJTk5FUl9SQURJVVMsIDMyLCAzMik7XG4gICAgbGV0IGlubmVyTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IDB4ZmZmZmZmLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjlcbiAgICB9KTtcbiAgICBsZXQgaW5uZXIgPSBuZXcgVEhSRUUuTWVzaChpbm5lckdlb21ldHJ5LCBpbm5lck1hdGVyaWFsKTtcblxuICAgIGxldCBvdXRlckdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KE9VVEVSX1JBRElVUywgMzIsIDMyKTtcbiAgICBsZXQgb3V0ZXJNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICBjb2xvcjogMHgzMzMzMzMsXG4gICAgICB0cmFuc3BhcmVudDogdHJ1ZSxcbiAgICAgIG9wYWNpdHk6IDAuM1xuICAgIH0pO1xuICAgIGxldCBvdXRlciA9IG5ldyBUSFJFRS5NZXNoKG91dGVyR2VvbWV0cnksIG91dGVyTWF0ZXJpYWwpO1xuXG4gICAgbGV0IHJldGljbGUgPSBuZXcgVEhSRUUuR3JvdXAoKTtcbiAgICByZXRpY2xlLmFkZChpbm5lcik7XG4gICAgcmV0aWNsZS5hZGQob3V0ZXIpO1xuICAgIHJldHVybiByZXRpY2xlO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vdmVzIHRoZSByZXRpY2xlIHRvIGEgcG9zaXRpb24gc28gdGhhdCBpdCdzIGp1c3QgaW4gZnJvbnQgb2YgdGhlIG1lc2ggdGhhdFxuICAgKiBpdCBpbnRlcnNlY3RlZCB3aXRoLlxuICAgKi9cbiAgbW92ZVJldGljbGVfKGludGVyc2VjdGlvbnMpIHtcbiAgICAvLyBJZiBubyBpbnRlcnNlY3Rpb24sIHJldHVybiB0aGUgcmV0aWNsZSB0byB0aGUgZGVmYXVsdCBwb3NpdGlvbi5cbiAgICBsZXQgZGlzdGFuY2UgPSBSRVRJQ0xFX0RJU1RBTkNFO1xuICAgIGlmIChpbnRlcnNlY3Rpb25zKSB7XG4gICAgICAvLyBPdGhlcndpc2UsIGRldGVybWluZSB0aGUgY29ycmVjdCBkaXN0YW5jZS5cbiAgICAgIGxldCBpbnRlciA9IGludGVyc2VjdGlvbnNbMF07XG4gICAgICBkaXN0YW5jZSA9IGludGVyLmRpc3RhbmNlO1xuICAgIH1cblxuICAgIHRoaXMucmV0aWNsZURpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY3JlYXRlUmF5XygpIHtcbiAgICAvLyBDcmVhdGUgYSBjeWxpbmRyaWNhbCByYXkuXG4gICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkN5bGluZGVyR2VvbWV0cnkoUkFZX1JBRElVUywgUkFZX1JBRElVUywgMSwgMzIsOCx0cnVlKTtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuU2hhZGVyTWF0ZXJpYWwoXG4gICAge1xuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICB1bmlmb3Jtczoge1xuICAgICAgICBjb2xvcjogeyB0eXBlOiAnYycsIHZhbHVlOiBuZXcgVEhSRUUuQ29sb3IoMHhmZmZmZmYpIH0sXG4gICAgICB9LFxuICAgICAgdmVydGV4U2hhZGVyOiBnbHNsaWZ5KCcuL3NoYWRlcnMvcmF5LnZlcnQnKSxcbiAgICAgIGZyYWdtZW50U2hhZGVyOiBnbHNsaWZ5KCcuL3NoYWRlcnMvcmF5LmZyYWcnKVxuICAgIH1cbiAgKTtcbiAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gICAgcmV0dXJuIG1lc2g7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBpc01vYmlsZSgpIHtcbiAgdmFyIGNoZWNrID0gZmFsc2U7XG4gIChmdW5jdGlvbihhKXtpZigvKGFuZHJvaWR8YmJcXGQrfG1lZWdvKS4rbW9iaWxlfGF2YW50Z298YmFkYVxcL3xibGFja2JlcnJ5fGJsYXplcnxjb21wYWx8ZWxhaW5lfGZlbm5lY3xoaXB0b3B8aWVtb2JpbGV8aXAoaG9uZXxvZCl8aXJpc3xraW5kbGV8bGdlIHxtYWVtb3xtaWRwfG1tcHxtb2JpbGUuK2ZpcmVmb3h8bmV0ZnJvbnR8b3BlcmEgbShvYnxpbilpfHBhbG0oIG9zKT98cGhvbmV8cChpeGl8cmUpXFwvfHBsdWNrZXJ8cG9ja2V0fHBzcHxzZXJpZXMoNHw2KTB8c3ltYmlhbnx0cmVvfHVwXFwuKGJyb3dzZXJ8bGluayl8dm9kYWZvbmV8d2FwfHdpbmRvd3MgY2V8eGRhfHhpaW5vL2kudGVzdChhKXx8LzEyMDd8NjMxMHw2NTkwfDNnc298NHRocHw1MFsxLTZdaXw3NzBzfDgwMnN8YSB3YXxhYmFjfGFjKGVyfG9vfHNcXC0pfGFpKGtvfHJuKXxhbChhdnxjYXxjbyl8YW1vaXxhbihleHxueXx5dyl8YXB0dXxhcihjaHxnbyl8YXModGV8dXMpfGF0dHd8YXUoZGl8XFwtbXxyIHxzICl8YXZhbnxiZShja3xsbHxucSl8YmkobGJ8cmQpfGJsKGFjfGF6KXxicihlfHYpd3xidW1ifGJ3XFwtKG58dSl8YzU1XFwvfGNhcGl8Y2N3YXxjZG1cXC18Y2VsbHxjaHRtfGNsZGN8Y21kXFwtfGNvKG1wfG5kKXxjcmF3fGRhKGl0fGxsfG5nKXxkYnRlfGRjXFwtc3xkZXZpfGRpY2F8ZG1vYnxkbyhjfHApb3xkcygxMnxcXC1kKXxlbCg0OXxhaSl8ZW0obDJ8dWwpfGVyKGljfGswKXxlc2w4fGV6KFs0LTddMHxvc3x3YXx6ZSl8ZmV0Y3xmbHkoXFwtfF8pfGcxIHV8ZzU2MHxnZW5lfGdmXFwtNXxnXFwtbW98Z28oXFwud3xvZCl8Z3IoYWR8dW4pfGhhaWV8aGNpdHxoZFxcLShtfHB8dCl8aGVpXFwtfGhpKHB0fHRhKXxocCggaXxpcCl8aHNcXC1jfGh0KGMoXFwtfCB8X3xhfGd8cHxzfHQpfHRwKXxodShhd3x0Yyl8aVxcLSgyMHxnb3xtYSl8aTIzMHxpYWMoIHxcXC18XFwvKXxpYnJvfGlkZWF8aWcwMXxpa29tfGltMWt8aW5ub3xpcGFxfGlyaXN8amEodHx2KWF8amJyb3xqZW11fGppZ3N8a2RkaXxrZWppfGtndCggfFxcLyl8a2xvbnxrcHQgfGt3Y1xcLXxreW8oY3xrKXxsZShub3x4aSl8bGcoIGd8XFwvKGt8bHx1KXw1MHw1NHxcXC1bYS13XSl8bGlid3xseW54fG0xXFwtd3xtM2dhfG01MFxcL3xtYSh0ZXx1aXx4byl8bWMoMDF8MjF8Y2EpfG1cXC1jcnxtZShyY3xyaSl8bWkobzh8b2F8dHMpfG1tZWZ8bW8oMDF8MDJ8Yml8ZGV8ZG98dChcXC18IHxvfHYpfHp6KXxtdCg1MHxwMXx2ICl8bXdicHxteXdhfG4xMFswLTJdfG4yMFsyLTNdfG4zMCgwfDIpfG41MCgwfDJ8NSl8bjcoMCgwfDEpfDEwKXxuZSgoY3xtKVxcLXxvbnx0Znx3Znx3Z3x3dCl8bm9rKDZ8aSl8bnpwaHxvMmltfG9wKHRpfHd2KXxvcmFufG93ZzF8cDgwMHxwYW4oYXxkfHQpfHBkeGd8cGcoMTN8XFwtKFsxLThdfGMpKXxwaGlsfHBpcmV8cGwoYXl8dWMpfHBuXFwtMnxwbyhja3xydHxzZSl8cHJveHxwc2lvfHB0XFwtZ3xxYVxcLWF8cWMoMDd8MTJ8MjF8MzJ8NjB8XFwtWzItN118aVxcLSl8cXRla3xyMzgwfHI2MDB8cmFrc3xyaW05fHJvKHZlfHpvKXxzNTVcXC98c2EoZ2V8bWF8bW18bXN8bnl8dmEpfHNjKDAxfGhcXC18b298cFxcLSl8c2RrXFwvfHNlKGMoXFwtfDB8MSl8NDd8bWN8bmR8cmkpfHNnaFxcLXxzaGFyfHNpZShcXC18bSl8c2tcXC0wfHNsKDQ1fGlkKXxzbShhbHxhcnxiM3xpdHx0NSl8c28oZnR8bnkpfHNwKDAxfGhcXC18dlxcLXx2ICl8c3koMDF8bWIpfHQyKDE4fDUwKXx0NigwMHwxMHwxOCl8dGEoZ3R8bGspfHRjbFxcLXx0ZGdcXC18dGVsKGl8bSl8dGltXFwtfHRcXC1tb3x0byhwbHxzaCl8dHMoNzB8bVxcLXxtM3xtNSl8dHhcXC05fHVwKFxcLmJ8ZzF8c2kpfHV0c3R8djQwMHx2NzUwfHZlcml8dmkocmd8dGUpfHZrKDQwfDVbMC0zXXxcXC12KXx2bTQwfHZvZGF8dnVsY3x2eCg1Mnw1M3w2MHw2MXw3MHw4MHw4MXw4M3w4NXw5OCl8dzNjKFxcLXwgKXx3ZWJjfHdoaXR8d2koZyB8bmN8bncpfHdtbGJ8d29udXx4NzAwfHlhc1xcLXx5b3VyfHpldG98enRlXFwtL2kudGVzdChhLnN1YnN0cigwLDQpKSljaGVjayA9IHRydWV9KShuYXZpZ2F0b3IudXNlckFnZW50fHxuYXZpZ2F0b3IudmVuZG9yfHx3aW5kb3cub3BlcmEpO1xuICByZXR1cm4gY2hlY2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjQobWltZVR5cGUsIGJhc2U2NCkge1xuICByZXR1cm4gJ2RhdGE6JyArIG1pbWVUeXBlICsgJztiYXNlNjQsJyArIGJhc2U2NDtcbn1cbiJdfQ==
