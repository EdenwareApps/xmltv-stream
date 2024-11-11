"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Programme = exports.Parser = void 0;
var _sax = _interopRequireDefault(require("sax"));
var _stream = require("stream");
var _dateFns = require("date-fns");
var _dateFnsTz = require("date-fns-tz");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
// Mapping XML fields to object properties
var PROGRAMME_MULTI_FIELDS = Object.freeze({
  title: 'title',
  'sub-title': 'secondaryTitle',
  desc: 'desc',
  descgen: 'descgen',
  category: 'category',
  country: 'country'
});

// Mapping new fields for parsing
var EXTRA_FIELDS = Object.freeze({
  subtitles: 'subtitles',
  'star-rating': 'starRating',
  url: 'url',
  video: 'video',
  audio: 'audio',
  'previously-shown': 'previouslyShown',
  premiere: 'premiere',
  'last-chance': 'lastChance',
  'new': 'isNew',
  review: 'review'
});

// Mapping credits fields
var CREDITS_FIELDS = Object.freeze({
  actor: 'actor',
  director: 'director',
  producer: 'producer',
  presenter: 'presenter'
});

// Mapping image fields
var IMAGE_FIELDS = Object.freeze({
  'large-image-url': 'large',
  'medium-image-url': 'medium',
  'small-image-url': 'small'
});
var TIMEZONE_FIX_REGEX = new RegExp('([+-]\\d{2})(\\d{2})$');

// Conversion factors for length units
var LENGTH_UNITS = Object.freeze({
  seconds: 1,
  minutes: 60,
  hours: 3600
});

// Represents a channel entry
var Channel = /*#__PURE__*/_createClass(function Channel() {
  _classCallCheck(this, Channel);
  this.name = null;
  this.icon = null;
  this.displayName = null; // initializes with null to avoid redundant checks
}); // Represents a programme entry
var Programme = exports.Programme = /*#__PURE__*/function () {
  function Programme() {
    _classCallCheck(this, Programme);
    this.channel = null;
    this.start = null;
    this.end = null;
    this.length = null;
    this.title = [];
    this.secondaryTitle = [];
    this.desc = [];
    this.descgen = [];
    this.category = [];
    this.country = [];
    this.rating = [];
    this.episodeNum = [];
    this.credits = [];
    this.images = [];
    this.date = null;
    this.subtitles = [];
    this.starRating = [];
    this.url = [];
    this.video = [];
    this.audio = [];
    this.previouslyShown = false;
    this.premiere = false;
    this.lastChance = false;
    this.isNew = false;
    this.review = [];
  }

  /**
   * Parses episodeNum with xmltv_ns system format and returns the season number
   *
   * xmltv_ns format lookgs like this:
   * season[/total] . episode-num[/total] . episode-part[/total]
   * If the number is not included it's unknown.
   * So: "1.4/5." - is episode 5 out of 5 of season 2.
   * And: "0.0.0/2" - is part 1 of episode 1 of season 1
   * (The count starts from 0)
   *
   * If no arguments are given it looks for the episode number in the episodeNum
   * attribute.
   */
  return _createClass(Programme, [{
    key: "getSeason",
    value: function getSeason(epNum) {
      var _this$episodeNum$find;
      if (!epNum) epNum = (_this$episodeNum$find = this.episodeNum.find(function (item) {
        return item.system === 'xmltv_ns';
      })) === null || _this$episodeNum$find === void 0 ? void 0 : _this$episodeNum$find.value;
      if (!epNum) return null;
      var parts = epNum.split('.');
      if (parts.length !== 3) return null;
      var seasonPart = parts[0];
      var seasonNum = parseInt(seasonPart.split('/')[0].trim(), 10);
      if (seasonPart.length !== 0) {
        return Number(seasonNum) + 1;
      }
      return null;
    }
  }]);
}(); // main parser class for XMLTV
var Parser = exports.Parser = /*#__PURE__*/function (_Writable) {
  function Parser() {
    var _this;
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck(this, Parser);
    _this = _callSuper(this, Parser);
    _this.options = Object.assign({
      timeFmt: 'yyyyMMddHHmmss XXX',
      // using date-fns format
      outputTimeFmt: null,
      silent: true
    }, options);
    var parserOptions = {
      trim: true,
      position: false,
      lowercase: true
    };
    _this.xmlParser = _sax["default"].createStream(true, parserOptions);
    _this.xmlParser.on('end', _this.emit.bind(_this, 'end'));
    _this.xmlParser.on('error', function (err) {
      if (!_this.options.silent) {
        if (_this.listenerCount('error')) {
          _this.emit('error', err);
        } else {
          console.error(err);
        }
      }
    });
    var programme = null,
      channel = null,
      currentNode = null;
    _this.xmlParser.on('opentag', function (node) {
      node.parentNode = currentNode;
      currentNode = node;
      switch (node.name) {
        case 'channel':
          channel = new Channel();
          channel.name = node.attributes.id;
          break;
        case 'display-name':
          _this.currentDisplay = {
            target: channel || programme
          };
          break;
        case 'icon':
          if (programme) {
            programme.icon = node.attributes.src;
          } else if (channel) {
            channel.icon = node.attributes.src;
          }
          break;
        case 'programme':
          programme = new Programme();
          programme.channel = node.attributes.channel;
          programme.start = _this.parseDate(node.attributes.start);
          programme.end = _this.parseDate(node.attributes.stop); // not mandatory, but usually present
          break;
      }
    });
    _this.xmlParser.on('closetag', function (tagName) {
      if (tagName === 'programme') {
        _this.emit('programme', programme);
        programme = null;
      } else if (tagName === 'channel') {
        _this.emit('channel', channel);
        channel = null;
      }
      // restores the parent node as the current node
      currentNode = currentNode.parentNode;
    });
    _this.xmlParser.on('text', function (text) {
      if (!currentNode) return;
      if (_this.currentDisplay && text.trim()) {
        _this.currentDisplay.target.displayName = text;
        _this.currentDisplay = null;
      } else if (programme) {
        var _currentNode$parentNo;
        if (PROGRAMME_MULTI_FIELDS[currentNode.name]) {
          if (text.trim()) {
            programme[PROGRAMME_MULTI_FIELDS[currentNode.name]].push(text);
          }
        } else if (CREDITS_FIELDS[currentNode.name]) {
          programme.credits.push({
            type: currentNode.name,
            role: currentNode.name === 'actor' ? currentNode.attributes.role || null : null,
            name: text
          });
        } else if (IMAGE_FIELDS[currentNode.name]) {
          programme.images.push({
            size: IMAGE_FIELDS[currentNode.name],
            url: text
          });
        } else if (EXTRA_FIELDS[currentNode.name]) {
          if (Array.isArray(programme[EXTRA_FIELDS[currentNode.name]])) {
            programme[EXTRA_FIELDS[currentNode.name]].push(text);
          } else {
            programme[EXTRA_FIELDS[currentNode.name]] = text.trim().toLowerCase() === 'true' || text.trim() === 'yes';
          }
        } else if (currentNode.name === 'length' && LENGTH_UNITS[currentNode.attributes.units]) {
          programme.length = parseInt(text, 10) * LENGTH_UNITS[currentNode.attributes.units];
        } else if (currentNode.name === 'episode-num') {
          programme.episodeNum.push({
            system: currentNode.attributes.system,
            value: text
          });
        } else if (((_currentNode$parentNo = currentNode.parentNode) === null || _currentNode$parentNo === void 0 ? void 0 : _currentNode$parentNo.name) === 'rating' && currentNode.name === 'value') {
          programme.rating.push({
            system: currentNode.parentNode.attributes.system,
            value: text
          });
        }
      }
    });

    // closes the SAX parser when the stream finishes
    _this.on('finish', function () {
      return _this.xmlParser.end();
    });
    return _this;
  }
  _inherits(Parser, _Writable);
  return _createClass(Parser, [{
    key: "_write",
    value: function _write(chunk, encoding, callback) {
      this.xmlParser.write(chunk, encoding);
      callback();
    }

    // parses a date string and returns a Date object or null if invalid
  }, {
    key: "parseDate",
    value: function parseDate(date) {
      if (typeof date !== 'string' || !date) return null;
      var err;
      date = String(date).trim().replace(TIMEZONE_FIX_REGEX, '$1:$2'); // common fixes
      try {
        var parsed = (0, _dateFns.parse)(date, this.options.timeFmt, new Date());
        if ((0, _dateFns.isValid)(parsed)) {
          if (!this.options.outputTimeFmt) return parsed;
          var timezone = this.options.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
          return (0, _dateFnsTz.formatInTimeZone)(parsed, timezone, this.options.outputTimeFmt || 'yyyy-MM-dd HH:mm:ss');
        } else {
          err = new Error("Invalid date format: ".concat(date, " ").concat(this.options.timeFmt));
        }
      } catch (e) {
        err = e;
      }
      if (!this.options.silent) {
        if (this.listenerCount('error')) {
          this.emit('error', err);
        } else {
          console.error(err);
        }
      }
      return null;
    }
  }]);
}(_stream.Writable);