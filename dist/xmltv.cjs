"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Programme = exports.Parser = void 0;
var _sax = _interopRequireDefault(require("sax"));
var _stream = require("stream");
var _moment = _interopRequireDefault(require("moment"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
// mapping of XML field names to object property names
var PROGRAMME_MULTI_FIELDS = Object.freeze({
  title: 'title',
  'sub-title': 'secondaryTitle',
  desc: 'desc',
  descgen: 'descgen',
  category: 'category',
  country: 'country'
});

// mapping of credit-related XML tags to object property names
var CREDITS_FIELDS = Object.freeze({
  actor: 'actor',
  director: 'director',
  producer: 'producer',
  presenter: 'presenter'
});

// mapping of image-related XML tags to object property names
var IMAGE_FIELDS = Object.freeze({
  'large-image-url': 'large',
  'medium-image-url': 'medium',
  'small-image-url': 'small'
});

// conversion factors for length units
var LENGTH_UNITS = Object.freeze({
  seconds: 1,
  minutes: 60,
  hours: 3600
});

// represents a single channel entry
var Channel = /*#__PURE__*/_createClass(function Channel() {
  _classCallCheck(this, Channel);
  this.name = null;
  this.icon = null;
}); // represents a single programme entry
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
  }

  // parses the season number from the episode number string (xmltv_ns format)
  return _createClass(Programme, [{
    key: "getSeason",
    value: function getSeason(epNum) {
      var _this$episodeNum$find;
      epNum = epNum || ((_this$episodeNum$find = this.episodeNum.find(function (item) {
        return item.system === 'xmltv_ns';
      })) === null || _this$episodeNum$find === void 0 ? void 0 : _this$episodeNum$find.value);
      if (!epNum) return null;
      var _epNum$split = epNum.split('.'),
        _epNum$split2 = _slicedToArray(_epNum$split, 1),
        seasonPart = _epNum$split2[0];
      if (!seasonPart) return null;
      var seasonNum = parseInt(seasonPart.split('/')[0].trim(), 10);
      return Number.isNaN(seasonNum) ? null : seasonNum + 1;
    }
  }]);
}(); // main parser class for XMLTV
var Parser = exports.Parser = /*#__PURE__*/function (_Writable) {
  function Parser() {
    var _options$strictTime;
    var _this;
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck(this, Parser);
    _this = _callSuper(this, Parser);
    _this.options = {
      timeFmt: options.timeFmt || 'YYYYMMDDHHmmss Z',
      outputTimeFmt: options.outputTimeFmt || null,
      strictTime: (_options$strictTime = options.strictTime) !== null && _options$strictTime !== void 0 ? _options$strictTime : true
    };
    var parserOptions = {
      trim: true,
      position: false,
      lowercase: true
    };
    _this.xmlParser = _sax["default"].createStream(true, parserOptions);
    _this.xmlParser.on('end', _this.emit.bind(_this, 'end'));
    _this.xmlParser.on('error', _this.emit.bind(_this, 'error'));
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
        case 'programme':
          programme = new Programme();
          programme.channel = node.attributes.channel;
          programme.start = _this.parseDate(node.attributes.start);
          programme.end = _this.parseDate(node.attributes.stop); // not mandatory but usually present
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
      if (currentNode.name === 'display-name' && channel) {
        channel.displayName = text;
      } else if (programme) {
        var _currentNode$parentNo;
        if (PROGRAMME_MULTI_FIELDS[currentNode.name]) {
          programme[PROGRAMME_MULTI_FIELDS[currentNode.name]].push(text);
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

    // closes the SAX parser when the writable stream ends
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
      var parsed = (0, _moment["default"])(date, this.options.timeFmt, this.options.strictTime);
      return parsed.isValid() ? this.options.outputTimeFmt ? parsed.format(this.options.outputTimeFmt) : parsed.toDate() : null;
    }
  }]);
}(_stream.Writable);
var _default = exports["default"] = {
  Parser: Parser,
  Programme: Programme
};