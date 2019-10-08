(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var customInspectSymbol = typeof Symbol === 'function' ? Symbol.for('nodejs.util.inspect.custom') : null

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    var proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":3,"ieee754":7}],4:[function(require,module,exports){
module.exports = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "208": "Already Reported",
  "226": "IM Used",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "416": "Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a teapot",
  "421": "Misdirected Request",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Unordered Collection",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "451": "Unavailable For Legal Reasons",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "508": "Loop Detected",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required"
}

},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],6:[function(require,module,exports){
var http = require('http')
var url = require('url')

var https = module.exports

for (var key in http) {
  if (http.hasOwnProperty(key)) https[key] = http[key]
}

https.request = function (params, cb) {
  params = validateParams(params)
  return http.request.call(this, params, cb)
}

https.get = function (params, cb) {
  params = validateParams(params)
  return http.get.call(this, params, cb)
}

function validateParams (params) {
  if (typeof params === 'string') {
    params = url.parse(params)
  }
  if (!params.protocol) {
    params.protocol = 'https:'
  }
  if (params.protocol !== 'https:') {
    throw new Error('Protocol "' + params.protocol + '" not supported. Expected "https:"')
  }
  return params
}

},{"http":15,"url":36}],7:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],8:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],9:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],10:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],12:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],13:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":11,"./encode":12}],14:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.prototype = Object.create(Buffer.prototype)

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":3}],15:[function(require,module,exports){
(function (global){
var ClientRequest = require('./lib/request')
var response = require('./lib/response')
var extend = require('xtend')
var statusCodes = require('builtin-status-codes')
var url = require('url')

var http = exports

http.request = function (opts, cb) {
	if (typeof opts === 'string')
		opts = url.parse(opts)
	else
		opts = extend(opts)

	// Normally, the page is loaded from http or https, so not specifying a protocol
	// will result in a (valid) protocol-relative url. However, this won't work if
	// the protocol is something else, like 'file:'
	var defaultProtocol = global.location.protocol.search(/^https?:$/) === -1 ? 'http:' : ''

	var protocol = opts.protocol || defaultProtocol
	var host = opts.hostname || opts.host
	var port = opts.port
	var path = opts.path || '/'

	// Necessary for IPv6 addresses
	if (host && host.indexOf(':') !== -1)
		host = '[' + host + ']'

	// This may be a relative url. The browser should always be able to interpret it correctly.
	opts.url = (host ? (protocol + '//' + host) : '') + (port ? ':' + port : '') + path
	opts.method = (opts.method || 'GET').toUpperCase()
	opts.headers = opts.headers || {}

	// Also valid opts.auth, opts.mode

	var req = new ClientRequest(opts)
	if (cb)
		req.on('response', cb)
	return req
}

http.get = function get (opts, cb) {
	var req = http.request(opts, cb)
	req.end()
	return req
}

http.ClientRequest = ClientRequest
http.IncomingMessage = response.IncomingMessage

http.Agent = function () {}
http.Agent.defaultMaxSockets = 4

http.globalAgent = new http.Agent()

http.STATUS_CODES = statusCodes

http.METHODS = [
	'CHECKOUT',
	'CONNECT',
	'COPY',
	'DELETE',
	'GET',
	'HEAD',
	'LOCK',
	'M-SEARCH',
	'MERGE',
	'MKACTIVITY',
	'MKCOL',
	'MOVE',
	'NOTIFY',
	'OPTIONS',
	'PATCH',
	'POST',
	'PROPFIND',
	'PROPPATCH',
	'PURGE',
	'PUT',
	'REPORT',
	'SEARCH',
	'SUBSCRIBE',
	'TRACE',
	'UNLOCK',
	'UNSUBSCRIBE'
]
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lib/request":17,"./lib/response":18,"builtin-status-codes":4,"url":36,"xtend":42}],16:[function(require,module,exports){
(function (global){
exports.fetch = isFunction(global.fetch) && isFunction(global.ReadableStream)

exports.writableStream = isFunction(global.WritableStream)

exports.abortController = isFunction(global.AbortController)

// The xhr request to example.com may violate some restrictive CSP configurations,
// so if we're running in a browser that supports `fetch`, avoid calling getXHR()
// and assume support for certain features below.
var xhr
function getXHR () {
	// Cache the xhr value
	if (xhr !== undefined) return xhr

	if (global.XMLHttpRequest) {
		xhr = new global.XMLHttpRequest()
		// If XDomainRequest is available (ie only, where xhr might not work
		// cross domain), use the page location. Otherwise use example.com
		// Note: this doesn't actually make an http request.
		try {
			xhr.open('GET', global.XDomainRequest ? '/' : 'https://example.com')
		} catch(e) {
			xhr = null
		}
	} else {
		// Service workers don't have XHR
		xhr = null
	}
	return xhr
}

function checkTypeSupport (type) {
	var xhr = getXHR()
	if (!xhr) return false
	try {
		xhr.responseType = type
		return xhr.responseType === type
	} catch (e) {}
	return false
}

// If fetch is supported, then arraybuffer will be supported too. Skip calling
// checkTypeSupport(), since that calls getXHR().
exports.arraybuffer = exports.fetch || checkTypeSupport('arraybuffer')

// These next two tests unavoidably show warnings in Chrome. Since fetch will always
// be used if it's available, just return false for these to avoid the warnings.
exports.msstream = !exports.fetch && checkTypeSupport('ms-stream')
exports.mozchunkedarraybuffer = !exports.fetch && checkTypeSupport('moz-chunked-arraybuffer')

// If fetch is supported, then overrideMimeType will be supported too. Skip calling
// getXHR().
exports.overrideMimeType = exports.fetch || (getXHR() ? isFunction(getXHR().overrideMimeType) : false)

function isFunction (value) {
	return typeof value === 'function'
}

xhr = null // Help gc

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],17:[function(require,module,exports){
(function (process,global,Buffer){
var capability = require('./capability')
var inherits = require('inherits')
var response = require('./response')
var stream = require('readable-stream')

var IncomingMessage = response.IncomingMessage
var rStates = response.readyStates

function decideMode (preferBinary, useFetch) {
	if (capability.fetch && useFetch) {
		return 'fetch'
	} else if (capability.mozchunkedarraybuffer) {
		return 'moz-chunked-arraybuffer'
	} else if (capability.msstream) {
		return 'ms-stream'
	} else if (capability.arraybuffer && preferBinary) {
		return 'arraybuffer'
	} else {
		return 'text'
	}
}

var ClientRequest = module.exports = function (opts) {
	var self = this
	stream.Writable.call(self)

	self._opts = opts
	self._body = []
	self._headers = {}
	if (opts.auth)
		self.setHeader('Authorization', 'Basic ' + Buffer.from(opts.auth).toString('base64'))
	Object.keys(opts.headers).forEach(function (name) {
		self.setHeader(name, opts.headers[name])
	})

	var preferBinary
	var useFetch = true
	if (opts.mode === 'disable-fetch' || ('requestTimeout' in opts && !capability.abortController)) {
		// If the use of XHR should be preferred. Not typically needed.
		useFetch = false
		preferBinary = true
	} else if (opts.mode === 'prefer-streaming') {
		// If streaming is a high priority but binary compatibility and
		// the accuracy of the 'content-type' header aren't
		preferBinary = false
	} else if (opts.mode === 'allow-wrong-content-type') {
		// If streaming is more important than preserving the 'content-type' header
		preferBinary = !capability.overrideMimeType
	} else if (!opts.mode || opts.mode === 'default' || opts.mode === 'prefer-fast') {
		// Use binary if text streaming may corrupt data or the content-type header, or for speed
		preferBinary = true
	} else {
		throw new Error('Invalid value for opts.mode')
	}
	self._mode = decideMode(preferBinary, useFetch)
	self._fetchTimer = null

	self.on('finish', function () {
		self._onFinish()
	})
}

inherits(ClientRequest, stream.Writable)

ClientRequest.prototype.setHeader = function (name, value) {
	var self = this
	var lowerName = name.toLowerCase()
	// This check is not necessary, but it prevents warnings from browsers about setting unsafe
	// headers. To be honest I'm not entirely sure hiding these warnings is a good thing, but
	// http-browserify did it, so I will too.
	if (unsafeHeaders.indexOf(lowerName) !== -1)
		return

	self._headers[lowerName] = {
		name: name,
		value: value
	}
}

ClientRequest.prototype.getHeader = function (name) {
	var header = this._headers[name.toLowerCase()]
	if (header)
		return header.value
	return null
}

ClientRequest.prototype.removeHeader = function (name) {
	var self = this
	delete self._headers[name.toLowerCase()]
}

ClientRequest.prototype._onFinish = function () {
	var self = this

	if (self._destroyed)
		return
	var opts = self._opts

	var headersObj = self._headers
	var body = null
	if (opts.method !== 'GET' && opts.method !== 'HEAD') {
        body = new Blob(self._body, {
            type: (headersObj['content-type'] || {}).value || ''
        });
    }

	// create flattened list of headers
	var headersList = []
	Object.keys(headersObj).forEach(function (keyName) {
		var name = headersObj[keyName].name
		var value = headersObj[keyName].value
		if (Array.isArray(value)) {
			value.forEach(function (v) {
				headersList.push([name, v])
			})
		} else {
			headersList.push([name, value])
		}
	})

	if (self._mode === 'fetch') {
		var signal = null
		var fetchTimer = null
		if (capability.abortController) {
			var controller = new AbortController()
			signal = controller.signal
			self._fetchAbortController = controller

			if ('requestTimeout' in opts && opts.requestTimeout !== 0) {
				self._fetchTimer = global.setTimeout(function () {
					self.emit('requestTimeout')
					if (self._fetchAbortController)
						self._fetchAbortController.abort()
				}, opts.requestTimeout)
			}
		}

		global.fetch(self._opts.url, {
			method: self._opts.method,
			headers: headersList,
			body: body || undefined,
			mode: 'cors',
			credentials: opts.withCredentials ? 'include' : 'same-origin',
			signal: signal
		}).then(function (response) {
			self._fetchResponse = response
			self._connect()
		}, function (reason) {
			global.clearTimeout(self._fetchTimer)
			if (!self._destroyed)
				self.emit('error', reason)
		})
	} else {
		var xhr = self._xhr = new global.XMLHttpRequest()
		try {
			xhr.open(self._opts.method, self._opts.url, true)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}

		// Can't set responseType on really old browsers
		if ('responseType' in xhr)
			xhr.responseType = self._mode

		if ('withCredentials' in xhr)
			xhr.withCredentials = !!opts.withCredentials

		if (self._mode === 'text' && 'overrideMimeType' in xhr)
			xhr.overrideMimeType('text/plain; charset=x-user-defined')

		if ('requestTimeout' in opts) {
			xhr.timeout = opts.requestTimeout
			xhr.ontimeout = function () {
				self.emit('requestTimeout')
			}
		}

		headersList.forEach(function (header) {
			xhr.setRequestHeader(header[0], header[1])
		})

		self._response = null
		xhr.onreadystatechange = function () {
			switch (xhr.readyState) {
				case rStates.LOADING:
				case rStates.DONE:
					self._onXHRProgress()
					break
			}
		}
		// Necessary for streaming in Firefox, since xhr.response is ONLY defined
		// in onprogress, not in onreadystatechange with xhr.readyState = 3
		if (self._mode === 'moz-chunked-arraybuffer') {
			xhr.onprogress = function () {
				self._onXHRProgress()
			}
		}

		xhr.onerror = function () {
			if (self._destroyed)
				return
			self.emit('error', new Error('XHR error'))
		}

		try {
			xhr.send(body)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}
	}
}

/**
 * Checks if xhr.status is readable and non-zero, indicating no error.
 * Even though the spec says it should be available in readyState 3,
 * accessing it throws an exception in IE8
 */
function statusValid (xhr) {
	try {
		var status = xhr.status
		return (status !== null && status !== 0)
	} catch (e) {
		return false
	}
}

ClientRequest.prototype._onXHRProgress = function () {
	var self = this

	if (!statusValid(self._xhr) || self._destroyed)
		return

	if (!self._response)
		self._connect()

	self._response._onXHRProgress()
}

ClientRequest.prototype._connect = function () {
	var self = this

	if (self._destroyed)
		return

	self._response = new IncomingMessage(self._xhr, self._fetchResponse, self._mode, self._fetchTimer)
	self._response.on('error', function(err) {
		self.emit('error', err)
	})

	self.emit('response', self._response)
}

ClientRequest.prototype._write = function (chunk, encoding, cb) {
	var self = this

	self._body.push(chunk)
	cb()
}

ClientRequest.prototype.abort = ClientRequest.prototype.destroy = function () {
	var self = this
	self._destroyed = true
	global.clearTimeout(self._fetchTimer)
	if (self._response)
		self._response._destroyed = true
	if (self._xhr)
		self._xhr.abort()
	else if (self._fetchAbortController)
		self._fetchAbortController.abort()
}

ClientRequest.prototype.end = function (data, encoding, cb) {
	var self = this
	if (typeof data === 'function') {
		cb = data
		data = undefined
	}

	stream.Writable.prototype.end.call(self, data, encoding, cb)
}

ClientRequest.prototype.flushHeaders = function () {}
ClientRequest.prototype.setTimeout = function () {}
ClientRequest.prototype.setNoDelay = function () {}
ClientRequest.prototype.setSocketKeepAlive = function () {}

// Taken from http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader%28%29-method
var unsafeHeaders = [
	'accept-charset',
	'accept-encoding',
	'access-control-request-headers',
	'access-control-request-method',
	'connection',
	'content-length',
	'cookie',
	'cookie2',
	'date',
	'dnt',
	'expect',
	'host',
	'keep-alive',
	'origin',
	'referer',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'via'
]

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":16,"./response":18,"_process":9,"buffer":3,"inherits":8,"readable-stream":33}],18:[function(require,module,exports){
(function (process,global,Buffer){
var capability = require('./capability')
var inherits = require('inherits')
var stream = require('readable-stream')

var rStates = exports.readyStates = {
	UNSENT: 0,
	OPENED: 1,
	HEADERS_RECEIVED: 2,
	LOADING: 3,
	DONE: 4
}

var IncomingMessage = exports.IncomingMessage = function (xhr, response, mode, fetchTimer) {
	var self = this
	stream.Readable.call(self)

	self._mode = mode
	self.headers = {}
	self.rawHeaders = []
	self.trailers = {}
	self.rawTrailers = []

	// Fake the 'close' event, but only once 'end' fires
	self.on('end', function () {
		// The nextTick is necessary to prevent the 'request' module from causing an infinite loop
		process.nextTick(function () {
			self.emit('close')
		})
	})

	if (mode === 'fetch') {
		self._fetchResponse = response

		self.url = response.url
		self.statusCode = response.status
		self.statusMessage = response.statusText
		
		response.headers.forEach(function (header, key){
			self.headers[key.toLowerCase()] = header
			self.rawHeaders.push(key, header)
		})

		if (capability.writableStream) {
			var writable = new WritableStream({
				write: function (chunk) {
					return new Promise(function (resolve, reject) {
						if (self._destroyed) {
							reject()
						} else if(self.push(Buffer.from(chunk))) {
							resolve()
						} else {
							self._resumeFetch = resolve
						}
					})
				},
				close: function () {
					global.clearTimeout(fetchTimer)
					if (!self._destroyed)
						self.push(null)
				},
				abort: function (err) {
					if (!self._destroyed)
						self.emit('error', err)
				}
			})

			try {
				response.body.pipeTo(writable).catch(function (err) {
					global.clearTimeout(fetchTimer)
					if (!self._destroyed)
						self.emit('error', err)
				})
				return
			} catch (e) {} // pipeTo method isn't defined. Can't find a better way to feature test this
		}
		// fallback for when writableStream or pipeTo aren't available
		var reader = response.body.getReader()
		function read () {
			reader.read().then(function (result) {
				if (self._destroyed)
					return
				if (result.done) {
					global.clearTimeout(fetchTimer)
					self.push(null)
					return
				}
				self.push(Buffer.from(result.value))
				read()
			}).catch(function (err) {
				global.clearTimeout(fetchTimer)
				if (!self._destroyed)
					self.emit('error', err)
			})
		}
		read()
	} else {
		self._xhr = xhr
		self._pos = 0

		self.url = xhr.responseURL
		self.statusCode = xhr.status
		self.statusMessage = xhr.statusText
		var headers = xhr.getAllResponseHeaders().split(/\r?\n/)
		headers.forEach(function (header) {
			var matches = header.match(/^([^:]+):\s*(.*)/)
			if (matches) {
				var key = matches[1].toLowerCase()
				if (key === 'set-cookie') {
					if (self.headers[key] === undefined) {
						self.headers[key] = []
					}
					self.headers[key].push(matches[2])
				} else if (self.headers[key] !== undefined) {
					self.headers[key] += ', ' + matches[2]
				} else {
					self.headers[key] = matches[2]
				}
				self.rawHeaders.push(matches[1], matches[2])
			}
		})

		self._charset = 'x-user-defined'
		if (!capability.overrideMimeType) {
			var mimeType = self.rawHeaders['mime-type']
			if (mimeType) {
				var charsetMatch = mimeType.match(/;\s*charset=([^;])(;|$)/)
				if (charsetMatch) {
					self._charset = charsetMatch[1].toLowerCase()
				}
			}
			if (!self._charset)
				self._charset = 'utf-8' // best guess
		}
	}
}

inherits(IncomingMessage, stream.Readable)

IncomingMessage.prototype._read = function () {
	var self = this

	var resolve = self._resumeFetch
	if (resolve) {
		self._resumeFetch = null
		resolve()
	}
}

IncomingMessage.prototype._onXHRProgress = function () {
	var self = this

	var xhr = self._xhr

	var response = null
	switch (self._mode) {
		case 'text':
			response = xhr.responseText
			if (response.length > self._pos) {
				var newData = response.substr(self._pos)
				if (self._charset === 'x-user-defined') {
					var buffer = Buffer.alloc(newData.length)
					for (var i = 0; i < newData.length; i++)
						buffer[i] = newData.charCodeAt(i) & 0xff

					self.push(buffer)
				} else {
					self.push(newData, self._charset)
				}
				self._pos = response.length
			}
			break
		case 'arraybuffer':
			if (xhr.readyState !== rStates.DONE || !xhr.response)
				break
			response = xhr.response
			self.push(Buffer.from(new Uint8Array(response)))
			break
		case 'moz-chunked-arraybuffer': // take whole
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING || !response)
				break
			self.push(Buffer.from(new Uint8Array(response)))
			break
		case 'ms-stream':
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING)
				break
			var reader = new global.MSStreamReader()
			reader.onprogress = function () {
				if (reader.result.byteLength > self._pos) {
					self.push(Buffer.from(new Uint8Array(reader.result.slice(self._pos))))
					self._pos = reader.result.byteLength
				}
			}
			reader.onload = function () {
				self.push(null)
			}
			// reader.onerror = ??? // TODO: this
			reader.readAsArrayBuffer(response)
			break
	}

	// The ms-stream case handles end separately in reader.onload()
	if (self._xhr.readyState === rStates.DONE && self._mode !== 'ms-stream') {
		self.push(null)
	}
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":16,"_process":9,"buffer":3,"inherits":8,"readable-stream":33}],19:[function(require,module,exports){
'use strict';

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var codes = {};

function createErrorType(code, message, Base) {
  if (!Base) {
    Base = Error;
  }

  function getMessage(arg1, arg2, arg3) {
    if (typeof message === 'string') {
      return message;
    } else {
      return message(arg1, arg2, arg3);
    }
  }

  var NodeError =
  /*#__PURE__*/
  function (_Base) {
    _inheritsLoose(NodeError, _Base);

    function NodeError(arg1, arg2, arg3) {
      return _Base.call(this, getMessage(arg1, arg2, arg3)) || this;
    }

    return NodeError;
  }(Base);

  NodeError.prototype.name = Base.name;
  NodeError.prototype.code = code;
  codes[code] = NodeError;
} // https://github.com/nodejs/node/blob/v10.8.0/lib/internal/errors.js


function oneOf(expected, thing) {
  if (Array.isArray(expected)) {
    var len = expected.length;
    expected = expected.map(function (i) {
      return String(i);
    });

    if (len > 2) {
      return "one of ".concat(thing, " ").concat(expected.slice(0, len - 1).join(', '), ", or ") + expected[len - 1];
    } else if (len === 2) {
      return "one of ".concat(thing, " ").concat(expected[0], " or ").concat(expected[1]);
    } else {
      return "of ".concat(thing, " ").concat(expected[0]);
    }
  } else {
    return "of ".concat(thing, " ").concat(String(expected));
  }
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith


function startsWith(str, search, pos) {
  return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith


function endsWith(str, search, this_len) {
  if (this_len === undefined || this_len > str.length) {
    this_len = str.length;
  }

  return str.substring(this_len - search.length, this_len) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes


function includes(str, search, start) {
  if (typeof start !== 'number') {
    start = 0;
  }

  if (start + search.length > str.length) {
    return false;
  } else {
    return str.indexOf(search, start) !== -1;
  }
}

createErrorType('ERR_INVALID_OPT_VALUE', function (name, value) {
  return 'The value "' + value + '" is invalid for option "' + name + '"';
}, TypeError);
createErrorType('ERR_INVALID_ARG_TYPE', function (name, expected, actual) {
  // determiner: 'must be' or 'must not be'
  var determiner;

  if (typeof expected === 'string' && startsWith(expected, 'not ')) {
    determiner = 'must not be';
    expected = expected.replace(/^not /, '');
  } else {
    determiner = 'must be';
  }

  var msg;

  if (endsWith(name, ' argument')) {
    // For cases like 'first argument'
    msg = "The ".concat(name, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  } else {
    var type = includes(name, '.') ? 'property' : 'argument';
    msg = "The \"".concat(name, "\" ").concat(type, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  }

  msg += ". Received type ".concat(typeof actual);
  return msg;
}, TypeError);
createErrorType('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF');
createErrorType('ERR_METHOD_NOT_IMPLEMENTED', function (name) {
  return 'The ' + name + ' method is not implemented';
});
createErrorType('ERR_STREAM_PREMATURE_CLOSE', 'Premature close');
createErrorType('ERR_STREAM_DESTROYED', function (name) {
  return 'Cannot call ' + name + ' after a stream was destroyed';
});
createErrorType('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times');
createErrorType('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable');
createErrorType('ERR_STREAM_WRITE_AFTER_END', 'write after end');
createErrorType('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError);
createErrorType('ERR_UNKNOWN_ENCODING', function (arg) {
  return 'Unknown encoding: ' + arg;
}, TypeError);
createErrorType('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event');
module.exports.codes = codes;

},{}],20:[function(require,module,exports){
(function (process){
'use strict'

var experimentalWarnings = new Set();

function emitExperimentalWarning(feature) {
  if (experimentalWarnings.has(feature)) return;
  var msg = feature + ' is an experimental feature. This feature could ' +
       'change at any time';
  experimentalWarnings.add(feature);
  process.emitWarning(msg, 'ExperimentalWarning');
}

function noop() {}

module.exports.emitExperimentalWarning = process.emitWarning
  ? emitExperimentalWarning
  : noop;

}).call(this,require('_process'))
},{"_process":9}],21:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.
'use strict';
/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];

  for (var key in obj) {
    keys.push(key);
  }

  return keys;
};
/*</replacement>*/


module.exports = Duplex;

var Readable = require('./_stream_readable');

var Writable = require('./_stream_writable');

require('inherits')(Duplex, Readable);

{
  // Allow the keys array to be GC'ed.
  var keys = objectKeys(Writable.prototype);

  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);
  Readable.call(this, options);
  Writable.call(this, options);
  this.allowHalfOpen = true;

  if (options) {
    if (options.readable === false) this.readable = false;
    if (options.writable === false) this.writable = false;

    if (options.allowHalfOpen === false) {
      this.allowHalfOpen = false;
      this.once('end', onend);
    }
  }
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
});
Object.defineProperty(Duplex.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});
Object.defineProperty(Duplex.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
}); // the no-half-open enforcer

function onend() {
  // If the writable side ended, then we're ok.
  if (this._writableState.ended) return; // no more data can be written.
  // But allow more writes to happen in this tick.

  process.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }

    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});
}).call(this,require('_process'))
},{"./_stream_readable":23,"./_stream_writable":25,"_process":9,"inherits":8}],22:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.
'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

require('inherits')(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);
  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":24,"inherits":8}],23:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';

module.exports = Readable;
/*<replacement>*/

var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;
/*<replacement>*/

var EE = require('events').EventEmitter;

var EElistenerCount = function EElistenerCount(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/


var Stream = require('./internal/streams/stream');
/*</replacement>*/


var Buffer = require('buffer').Buffer;

var OurUint8Array = global.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
/*<replacement>*/


var debugUtil = require('util');

var debug;

if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function debug() {};
}
/*</replacement>*/


var BufferList = require('./internal/streams/buffer_list');

var destroyImpl = require('./internal/streams/destroy');

var _require = require('./internal/streams/state'),
    getHighWaterMark = _require.getHighWaterMark;

var _require$codes = require('../errors').codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;

var _require2 = require('../experimentalWarning'),
    emitExperimentalWarning = _require2.emitExperimentalWarning; // Lazy loaded to improve the startup performance.


var StringDecoder;
var createReadableStreamAsyncIterator;

require('inherits')(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn); // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.

  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream, isDuplex) {
  Duplex = Duplex || require('./_stream_duplex');
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex; // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode; // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"

  this.highWaterMark = getHighWaterMark(this, options, 'readableHighWaterMark', isDuplex); // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()

  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false; // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.

  this.sync = true; // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.

  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;
  this.paused = true; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // has it been destroyed

  this.destroyed = false; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // the number of writers that are awaiting a drain event in .pipe()s

  this.awaitDrain = 0; // if true, a maybeReadMore has been scheduled

  this.readingMore = false;
  this.decoder = null;
  this.encoding = null;

  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');
  if (!(this instanceof Readable)) return new Readable(options); // Checking for a Stream.Duplex instance is faster here instead of inside
  // the ReadableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex;
  this._readableState = new ReadableState(options, this, isDuplex); // legacy

  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined) {
      return false;
    }

    return this._readableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
  }
});
Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;

Readable.prototype._destroy = function (err, cb) {
  cb(err);
}; // Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.


Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;

      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }

      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
}; // Unshift should *always* be something directly out of read()


Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  debug('readableAddChunk', chunk);
  var state = stream._readableState;

  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);

    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new ERR_STREAM_PUSH_AFTER_EOF());
      } else if (state.destroyed) {
        return false;
      } else {
        state.reading = false;

        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
      maybeReadMore(stream, state);
    }
  } // We can push more data if we are below the highWaterMark.
  // Also, if we have no data yet, we can stand some more bytes.
  // This is to work around cases where hwm=0, such as the repl.


  return !state.ended && (state.length < state.highWaterMark || state.length === 0);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    state.awaitDrain = 0;
    stream.emit('data', chunk);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
    if (state.needReadable) emitReadable(stream);
  }

  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;

  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk);
  }

  return er;
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
}; // backwards compatibility.


Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc); // if setEncoding(null), decoder.encoding equals utf8

  this._readableState.encoding = this._readableState.decoder.encoding;
  return this;
}; // Don't raise the hwm > 8MB


var MAX_HWM = 0x800000;

function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }

  return n;
} // This function is designed to be inlinable, so please take care when making
// changes to the function body.


function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;

  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  } // If we're asking for more than the current hwm, then raise the hwm.


  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n; // Don't have enough

  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }

  return state.length;
} // you can override either this method, or the async _read(n) below.


Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;
  if (n !== 0) state.emittedReadable = false; // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.

  if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state); // if we've ended, and we're now clear, then finish it up.

  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  } // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.
  // if we need a readable event, then we need to do some reading.


  var doRead = state.needReadable;
  debug('need readable', doRead); // if we currently have less than the highWaterMark, then also read some

  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  } // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.


  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true; // if the length is currently zero, then we *need* a readable event.

    if (state.length === 0) state.needReadable = true; // call internal read method

    this._read(state.highWaterMark);

    state.sync = false; // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.

    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
    state.awaitDrain = 0;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true; // If we tried to read() past the EOF, then emit end on the next tick.

    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);
  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;

  if (state.decoder) {
    var chunk = state.decoder.end();

    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }

  state.ended = true;

  if (state.sync) {
    // if we are sync, wait until next tick to emit the data.
    // Otherwise we risk emitting data in the flow()
    // the readable code triggers during a read() call
    emitReadable(stream);
  } else {
    // emit 'readable' now to make sure it gets picked up.
    state.needReadable = false;

    if (!state.emittedReadable) {
      state.emittedReadable = true;
      emitReadable_(stream);
    }
  }
} // Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.


function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;

  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    process.nextTick(emitReadable_, stream);
  }
}

function emitReadable_(stream) {
  var state = stream._readableState;
  debug('emitReadable_', state.destroyed, state.length, state.ended);

  if (!state.destroyed && (state.length || state.ended)) {
    stream.emit('readable');
  } // The stream needs another readable event if
  // 1. It is not flowing, as the flow mechanism will take
  //    care of it.
  // 2. It is not ended.
  // 3. It is below the highWaterMark, so we can schedule
  //    another readable later.


  state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
  flow(stream);
} // at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.


function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  // Attempt to read more data if we should.
  //
  // The conditions for reading more data are (one of):
  // - Not enough data buffered (state.length < state.highWaterMark). The loop
  //   is responsible for filling the buffer with enough data if such data
  //   is available. If highWaterMark is 0 and we are not in the flowing mode
  //   we should _not_ attempt to buffer any extra data. We'll get more data
  //   when the stream consumer calls read() instead.
  // - No data in the buffer, and the stream is in flowing mode. In this mode
  //   the loop below is responsible for ensuring read() is called. Failing to
  //   call read here would abort the flow and there's no other mechanism for
  //   continuing the flow if the stream consumer has just subscribed to the
  //   'data' event.
  //
  // In addition to the above conditions to keep reading data, the following
  // conditions prevent the data from being read:
  // - The stream has ended (state.ended).
  // - There is already a pending 'read' operation (state.reading). This is a
  //   case where the the stream has called the implementation defined _read()
  //   method, but they are processing the call asynchronously and have _not_
  //   called push() with new data. In this case we skip performing more
  //   read()s. The execution ends in this method again after the _read() ends
  //   up calling push() with more data.
  while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
    var len = state.length;
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length) // didn't get any data, stop spinning.
      break;
  }

  state.readingMore = false;
} // abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.


Readable.prototype._read = function (n) {
  this.emit('error', new ERR_METHOD_NOT_IMPLEMENTED('_read()'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;

    case 1:
      state.pipes = [state.pipes, dest];
      break;

    default:
      state.pipes.push(dest);
      break;
  }

  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) process.nextTick(endFn);else src.once('end', endFn);
  dest.on('unpipe', onunpipe);

  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');

    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  } // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.


  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);
  var cleanedUp = false;

  function cleanup() {
    debug('cleanup'); // cleanup event handlers once the pipe is broken

    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);
    cleanedUp = true; // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.

    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  src.on('data', ondata);

  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    debug('dest.write', ret);

    if (ret === false) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', state.awaitDrain);
        state.awaitDrain++;
      }

      src.pause();
    }
  } // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.


  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  } // Make sure our error handler is attached before userland ones.


  prependListener(dest, 'error', onerror); // Both close and finish should trigger unpipe, but only once.

  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }

  dest.once('close', onclose);

  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }

  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  } // tell the dest that it's being piped to


  dest.emit('pipe', src); // start the flow if it hasn't been started already.

  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function pipeOnDrainFunctionResult() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;

    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = {
    hasUnpiped: false
  }; // if we're not piping anywhere, then do nothing.

  if (state.pipesCount === 0) return this; // just one destination.  most common case.

  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;
    if (!dest) dest = state.pipes; // got a match.

    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  } // slow case. multiple pipe destinations.


  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, {
        hasUnpiped: false
      });
    }

    return this;
  } // try to find the right one.


  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;
  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];
  dest.emit('unpipe', this, unpipeInfo);
  return this;
}; // set up data events if they are asked for
// Ensure readable listeners eventually get something


Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);
  var state = this._readableState;

  if (ev === 'data') {
    // update readableListening so that resume() may be a no-op
    // a few lines down. This is needed to support once('readable').
    state.readableListening = this.listenerCount('readable') > 0; // Try start flowing on next tick if stream isn't explicitly paused

    if (state.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.flowing = false;
      state.emittedReadable = false;
      debug('on readable', state.length, state.reading);

      if (state.length) {
        emitReadable(this);
      } else if (!state.reading) {
        process.nextTick(nReadingNextTick, this);
      }
    }
  }

  return res;
};

Readable.prototype.addListener = Readable.prototype.on;

Readable.prototype.removeListener = function (ev, fn) {
  var res = Stream.prototype.removeListener.call(this, ev, fn);

  if (ev === 'readable') {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

Readable.prototype.removeAllListeners = function (ev) {
  var res = Stream.prototype.removeAllListeners.apply(this, arguments);

  if (ev === 'readable' || ev === undefined) {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

function updateReadableListening(self) {
  var state = self._readableState;
  state.readableListening = self.listenerCount('readable') > 0;

  if (state.resumeScheduled && !state.paused) {
    // flowing needs to be set to true now, otherwise
    // the upcoming resume will not flow.
    state.flowing = true; // crude way to check if we should resume
  } else if (self.listenerCount('data') > 0) {
    self.resume();
  }
}

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
} // pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.


Readable.prototype.resume = function () {
  var state = this._readableState;

  if (!state.flowing) {
    debug('resume'); // we flow only if there is no one listening
    // for readable, but we still have to call
    // resume()

    state.flowing = !state.readableListening;
    resume(this, state);
  }

  state.paused = false;
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  debug('resume', state.reading);

  if (!state.reading) {
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);

  if (this._readableState.flowing !== false) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }

  this._readableState.paused = true;
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);

  while (state.flowing && stream.read() !== null) {
    ;
  }
} // wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.


Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;
  stream.on('end', function () {
    debug('wrapped end');

    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });
  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk); // don't skip over falsy values in objectMode

    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);

    if (!ret) {
      paused = true;
      stream.pause();
    }
  }); // proxy all the other methods.
  // important when wrapping filters and duplexes.

  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function methodWrap(method) {
        return function methodWrapReturnFunction() {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  } // proxy certain important events.


  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  } // when we try to consume some more bytes, simply unpause the
  // underlying stream.


  this._read = function (n) {
    debug('wrapped _read', n);

    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

if (typeof Symbol === 'function') {
  Readable.prototype[Symbol.asyncIterator] = function () {
    emitExperimentalWarning('Readable[Symbol.asyncIterator]');

    if (createReadableStreamAsyncIterator === undefined) {
      createReadableStreamAsyncIterator = require('./internal/streams/async_iterator');
    }

    return createReadableStreamAsyncIterator(this);
  };
}

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.highWaterMark;
  }
});
Object.defineProperty(Readable.prototype, 'readableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState && this._readableState.buffer;
  }
});
Object.defineProperty(Readable.prototype, 'readableFlowing', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.flowing;
  },
  set: function set(state) {
    if (this._readableState) {
      this._readableState.flowing = state;
    }
  }
}); // exposed for testing purposes only.

Readable._fromList = fromList;
Object.defineProperty(Readable.prototype, 'readableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.length;
  }
}); // Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.

function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;
  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.first();else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = state.buffer.consume(n, state.decoder);
  }
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;
  debug('endReadable', state.endEmitted);

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  debug('endReadableNT', state.endEmitted, state.length); // Check that we didn't get one last unshift.

  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }

  return -1;
}
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../errors":19,"../experimentalWarning":20,"./_stream_duplex":21,"./internal/streams/async_iterator":26,"./internal/streams/buffer_list":27,"./internal/streams/destroy":28,"./internal/streams/state":31,"./internal/streams/stream":32,"_process":9,"buffer":3,"events":5,"inherits":8,"string_decoder/":34,"util":2}],24:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.
'use strict';

module.exports = Transform;

var _require$codes = require('../errors').codes,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,
    ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;

var Duplex = require('./_stream_duplex');

require('inherits')(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;
  var cb = ts.writecb;

  if (cb === null) {
    return this.emit('error', new ERR_MULTIPLE_CALLBACK());
  }

  ts.writechunk = null;
  ts.writecb = null;
  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);
  cb(er);
  var rs = this._readableState;
  rs.reading = false;

  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);
  Duplex.call(this, options);
  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  }; // start out asking for a readable event once data is transformed.

  this._readableState.needReadable = true; // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.

  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;
    if (typeof options.flush === 'function') this._flush = options.flush;
  } // When the writable side finishes, then flush out anything remaining.


  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function' && !this._readableState.destroyed) {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
}; // This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.


Transform.prototype._transform = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_transform()'));
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;

  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
}; // Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.


Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && !ts.transforming) {
    ts.transforming = true;

    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);
  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data); // TODO(BridgeAR): Write a test for these two error cases
  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided

  if (stream._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
  if (stream._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
  return stream.push(null);
}
},{"../errors":19,"./_stream_duplex":21,"inherits":8}],25:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.
'use strict';

module.exports = Writable;
/* <replacement> */

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
} // It seems a linked list but it is not
// there will be only 2 of these for each stream


function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/


var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;
/*<replacement>*/

var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/

var Stream = require('./internal/streams/stream');
/*</replacement>*/


var Buffer = require('buffer').Buffer;

var OurUint8Array = global.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

var destroyImpl = require('./internal/streams/destroy');

var _require = require('./internal/streams/state'),
    getHighWaterMark = _require.getHighWaterMark;

var _require$codes = require('../errors').codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
    ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
    ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
    ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;

require('inherits')(Writable, Stream);

function nop() {}

function WritableState(options, stream, isDuplex) {
  Duplex = Duplex || require('./_stream_duplex');
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream,
  // e.g. options.readableObjectMode vs. options.writableObjectMode, etc.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex; // object stream flag to indicate whether or not this stream
  // contains buffers or objects.

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode; // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()

  this.highWaterMark = getHighWaterMark(this, options, 'writableHighWaterMark', isDuplex); // if _final has been called

  this.finalCalled = false; // drain event flag.

  this.needDrain = false; // at the start of calling end()

  this.ending = false; // when end() has been called, and returned

  this.ended = false; // when 'finish' is emitted

  this.finished = false; // has it been destroyed

  this.destroyed = false; // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.

  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.

  this.length = 0; // a flag to see when we're in the middle of a write.

  this.writing = false; // when true all writes will be buffered until .uncork() call

  this.corked = 0; // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.

  this.sync = true; // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.

  this.bufferProcessing = false; // the callback that's passed to _write(chunk,cb)

  this.onwrite = function (er) {
    onwrite(stream, er);
  }; // the callback that the user supplies to write(chunk,encoding,cb)


  this.writecb = null; // the amount that is being written when _write is called.

  this.writelen = 0;
  this.bufferedRequest = null;
  this.lastBufferedRequest = null; // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted

  this.pendingcb = 0; // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams

  this.prefinished = false; // True if the error was already emitted and should not be thrown again

  this.errorEmitted = false; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // count buffered requests

  this.bufferedRequestCount = 0; // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two

  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];

  while (current) {
    out.push(current);
    current = current.next;
  }

  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function writableStateBufferGetter() {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})(); // Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.


var realHasInstance;

if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function value(object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;
      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function realHasInstance(object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex'); // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.
  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the WritableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex;
  if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
  this._writableState = new WritableState(options, this, isDuplex); // legacy.

  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;
    if (typeof options.writev === 'function') this._writev = options.writev;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
} // Otherwise people can pipe Writable streams, which is just wrong.


Writable.prototype.pipe = function () {
  this.emit('error', new ERR_STREAM_CANNOT_PIPE());
};

function writeAfterEnd(stream, cb) {
  var er = new ERR_STREAM_WRITE_AFTER_END(); // TODO: defer error events consistently everywhere, not just the cb

  stream.emit('error', er);
  process.nextTick(cb, er);
} // Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.


function validChunk(stream, state, chunk, cb) {
  var er;

  if (chunk === null) {
    er = new ERR_STREAM_NULL_VALUES();
  } else if (typeof chunk !== 'string' && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer'], chunk);
  }

  if (er) {
    stream.emit('error', er);
    process.nextTick(cb, er);
    return false;
  }

  return true;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
  if (typeof cb !== 'function') cb = nop;
  if (state.ending) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }
  return ret;
};

Writable.prototype.cork = function () {
  this._writableState.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;
    if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

Object.defineProperty(Writable.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }

  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
}); // if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.

function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);

    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }

  var len = state.objectMode ? 1 : chunk.length;
  state.length += len;
  var ret = state.length < state.highWaterMark; // we must ensure that previous needDrain will not be reset to false.

  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };

    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }

    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED('write'));else if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    process.nextTick(cb, er); // this can emit finish, and it will always happen
    // after error

    process.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er); // this can emit finish, but finish must
    // always follow error

    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;
  if (typeof cb !== 'function') throw new ERR_MULTIPLE_CALLBACK();
  onwriteStateUpdate(state);
  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state) || stream.destroyed;

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
} // Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.


function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
} // if there's something in the buffer waiting, then process it


function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;
    var count = 0;
    var allBuffers = true;

    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }

    buffer.allBuffers = allBuffers;
    doWrite(stream, state, true, state.length, buffer, '', holder.finish); // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite

    state.pendingcb++;
    state.lastBufferedRequest = null;

    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }

    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;
      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--; // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.

      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_write()'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding); // .end() fully uncorks

  if (state.corked) {
    state.corked = 1;
    this.uncork();
  } // ignore unnecessary end() calls.


  if (!state.ending) endWritable(this, state, cb);
  return this;
};

Object.defineProperty(Writable.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
});

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;

    if (err) {
      stream.emit('error', err);
    }

    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}

function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function' && !state.destroyed) {
      state.pendingcb++;
      state.finalCalled = true;
      process.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);

  if (need) {
    prefinish(stream, state);

    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }

  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);

  if (cb) {
    if (state.finished) process.nextTick(cb);else stream.once('finish', cb);
  }

  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;

  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  } // reuse the free corkReq.


  state.corkedRequestsFree.next = corkReq;
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._writableState === undefined) {
      return false;
    }

    return this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._writableState.destroyed = value;
  }
});
Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;

Writable.prototype._destroy = function (err, cb) {
  cb(err);
};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../errors":19,"./_stream_duplex":21,"./internal/streams/destroy":28,"./internal/streams/state":31,"./internal/streams/stream":32,"_process":9,"buffer":3,"inherits":8,"util-deprecate":38}],26:[function(require,module,exports){
(function (process){
'use strict';

var _Object$setPrototypeO;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var finished = require('./end-of-stream');

var kLastResolve = Symbol('lastResolve');
var kLastReject = Symbol('lastReject');
var kError = Symbol('error');
var kEnded = Symbol('ended');
var kLastPromise = Symbol('lastPromise');
var kHandlePromise = Symbol('handlePromise');
var kStream = Symbol('stream');

function createIterResult(value, done) {
  return {
    value: value,
    done: done
  };
}

function readAndResolve(iter) {
  var resolve = iter[kLastResolve];

  if (resolve !== null) {
    var data = iter[kStream].read(); // we defer if data is null
    // we can be expecting either 'end' or
    // 'error'

    if (data !== null) {
      iter[kLastPromise] = null;
      iter[kLastResolve] = null;
      iter[kLastReject] = null;
      resolve(createIterResult(data, false));
    }
  }
}

function onReadable(iter) {
  // we wait for the next tick, because it might
  // emit an error with process.nextTick
  process.nextTick(readAndResolve, iter);
}

function wrapForNext(lastPromise, iter) {
  return function (resolve, reject) {
    lastPromise.then(function () {
      if (iter[kEnded]) {
        resolve(createIterResult(undefined, true));
        return;
      }

      iter[kHandlePromise](resolve, reject);
    }, reject);
  };
}

var AsyncIteratorPrototype = Object.getPrototypeOf(function () {});
var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
  get stream() {
    return this[kStream];
  },

  next: function next() {
    var _this = this;

    // if we have detected an error in the meanwhile
    // reject straight away
    var error = this[kError];

    if (error !== null) {
      return Promise.reject(error);
    }

    if (this[kEnded]) {
      return Promise.resolve(createIterResult(undefined, true));
    }

    if (this[kStream].destroyed) {
      // We need to defer via nextTick because if .destroy(err) is
      // called, the error will be emitted via nextTick, and
      // we cannot guarantee that there is no error lingering around
      // waiting to be emitted.
      return new Promise(function (resolve, reject) {
        process.nextTick(function () {
          if (_this[kError]) {
            reject(_this[kError]);
          } else {
            resolve(createIterResult(undefined, true));
          }
        });
      });
    } // if we have multiple next() calls
    // we will wait for the previous Promise to finish
    // this logic is optimized to support for await loops,
    // where next() is only called once at a time


    var lastPromise = this[kLastPromise];
    var promise;

    if (lastPromise) {
      promise = new Promise(wrapForNext(lastPromise, this));
    } else {
      // fast path needed to support multiple this.push()
      // without triggering the next() queue
      var data = this[kStream].read();

      if (data !== null) {
        return Promise.resolve(createIterResult(data, false));
      }

      promise = new Promise(this[kHandlePromise]);
    }

    this[kLastPromise] = promise;
    return promise;
  }
}, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function () {
  return this;
}), _defineProperty(_Object$setPrototypeO, "return", function _return() {
  var _this2 = this;

  // destroy(err, cb) is a private API
  // we can guarantee we have that here, because we control the
  // Readable class this is attached to
  return new Promise(function (resolve, reject) {
    _this2[kStream].destroy(null, function (err) {
      if (err) {
        reject(err);
        return;
      }

      resolve(createIterResult(undefined, true));
    });
  });
}), _Object$setPrototypeO), AsyncIteratorPrototype);

var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator(stream) {
  var _Object$create;

  var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
    value: stream,
    writable: true
  }), _defineProperty(_Object$create, kLastResolve, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kLastReject, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kError, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kEnded, {
    value: stream._readableState.endEmitted,
    writable: true
  }), _defineProperty(_Object$create, kHandlePromise, {
    value: function value(resolve, reject) {
      var data = iterator[kStream].read();

      if (data) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        resolve(createIterResult(data, false));
      } else {
        iterator[kLastResolve] = resolve;
        iterator[kLastReject] = reject;
      }
    },
    writable: true
  }), _Object$create));
  iterator[kLastPromise] = null;
  finished(stream, function (err) {
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      var reject = iterator[kLastReject]; // reject if we are waiting for data in the Promise
      // returned by next() and store the error

      if (reject !== null) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        reject(err);
      }

      iterator[kError] = err;
      return;
    }

    var resolve = iterator[kLastResolve];

    if (resolve !== null) {
      iterator[kLastPromise] = null;
      iterator[kLastResolve] = null;
      iterator[kLastReject] = null;
      resolve(createIterResult(undefined, true));
    }

    iterator[kEnded] = true;
  });
  stream.on('readable', onReadable.bind(null, iterator));
  return iterator;
};

module.exports = createReadableStreamAsyncIterator;
}).call(this,require('_process'))
},{"./end-of-stream":29,"_process":9}],27:[function(require,module,exports){
'use strict';

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('buffer'),
    Buffer = _require.Buffer;

var _require2 = require('util'),
    inspect = _require2.inspect;

var custom = inspect && inspect.custom || 'inspect';

function copyBuffer(src, target, offset) {
  Buffer.prototype.copy.call(src, target, offset);
}

module.exports =
/*#__PURE__*/
function () {
  function BufferList() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  var _proto = BufferList.prototype;

  _proto.push = function push(v) {
    var entry = {
      data: v,
      next: null
    };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  _proto.unshift = function unshift(v) {
    var entry = {
      data: v,
      next: this.head
    };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  _proto.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  _proto.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  _proto.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;

    while (p = p.next) {
      ret += s + p.data;
    }

    return ret;
  };

  _proto.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;

    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }

    return ret;
  } // Consumes a specified amount of bytes or characters from the buffered data.
  ;

  _proto.consume = function consume(n, hasStrings) {
    var ret;

    if (n < this.head.data.length) {
      // `slice` is the same for buffers and strings.
      ret = this.head.data.slice(0, n);
      this.head.data = this.head.data.slice(n);
    } else if (n === this.head.data.length) {
      // First chunk is a perfect match.
      ret = this.shift();
    } else {
      // Result spans more than one buffer.
      ret = hasStrings ? this._getString(n) : this._getBuffer(n);
    }

    return ret;
  };

  _proto.first = function first() {
    return this.head.data;
  } // Consumes a specified amount of characters from the buffered data.
  ;

  _proto._getString = function _getString(n) {
    var p = this.head;
    var c = 1;
    var ret = p.data;
    n -= ret.length;

    while (p = p.next) {
      var str = p.data;
      var nb = n > str.length ? str.length : n;
      if (nb === str.length) ret += str;else ret += str.slice(0, n);
      n -= nb;

      if (n === 0) {
        if (nb === str.length) {
          ++c;
          if (p.next) this.head = p.next;else this.head = this.tail = null;
        } else {
          this.head = p;
          p.data = str.slice(nb);
        }

        break;
      }

      ++c;
    }

    this.length -= c;
    return ret;
  } // Consumes a specified amount of bytes from the buffered data.
  ;

  _proto._getBuffer = function _getBuffer(n) {
    var ret = Buffer.allocUnsafe(n);
    var p = this.head;
    var c = 1;
    p.data.copy(ret);
    n -= p.data.length;

    while (p = p.next) {
      var buf = p.data;
      var nb = n > buf.length ? buf.length : n;
      buf.copy(ret, ret.length - n, 0, nb);
      n -= nb;

      if (n === 0) {
        if (nb === buf.length) {
          ++c;
          if (p.next) this.head = p.next;else this.head = this.tail = null;
        } else {
          this.head = p;
          p.data = buf.slice(nb);
        }

        break;
      }

      ++c;
    }

    this.length -= c;
    return ret;
  } // Make sure the linked list only shows the minimal necessary information.
  ;

  _proto[custom] = function (_, options) {
    return inspect(this, _objectSpread({}, options, {
      // Only inspect one level.
      depth: 0,
      // It should not recurse.
      customInspect: false
    }));
  };

  return BufferList;
}();
},{"buffer":3,"util":2}],28:[function(require,module,exports){
(function (process){
'use strict'; // undocumented cb() API, needed for core, not for public API

function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      process.nextTick(emitErrorNT, this, err);
    }

    return this;
  } // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks


  if (this._readableState) {
    this._readableState.destroyed = true;
  } // if this is a duplex stream mark the writable part as destroyed as well


  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      process.nextTick(emitErrorAndCloseNT, _this, err);

      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      process.nextTick(emitCloseNT, _this);
      cb(err);
    } else {
      process.nextTick(emitCloseNT, _this);
    }
  });

  return this;
}

function emitErrorAndCloseNT(self, err) {
  emitErrorNT(self, err);
  emitCloseNT(self);
}

function emitCloseNT(self) {
  if (self._writableState && !self._writableState.emitClose) return;
  if (self._readableState && !self._readableState.emitClose) return;
  self.emit('close');
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finalCalled = false;
    this._writableState.prefinished = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
}).call(this,require('_process'))
},{"_process":9}],29:[function(require,module,exports){
// Ported from https://github.com/mafintosh/end-of-stream with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';

var ERR_STREAM_PREMATURE_CLOSE = require('../../../errors').codes.ERR_STREAM_PREMATURE_CLOSE;

function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    callback.apply(this, args);
  };
}

function noop() {}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function eos(stream, opts, callback) {
  if (typeof opts === 'function') return eos(stream, null, opts);
  if (!opts) opts = {};
  callback = once(callback || noop);
  var readable = opts.readable || opts.readable !== false && stream.readable;
  var writable = opts.writable || opts.writable !== false && stream.writable;

  var onlegacyfinish = function onlegacyfinish() {
    if (!stream.writable) onfinish();
  };

  var writableEnded = stream._writableState && stream._writableState.finished;

  var onfinish = function onfinish() {
    writable = false;
    writableEnded = true;
    if (!readable) callback.call(stream);
  };

  var readableEnded = stream._readableState && stream._readableState.endEmitted;

  var onend = function onend() {
    readable = false;
    readableEnded = true;
    if (!writable) callback.call(stream);
  };

  var onerror = function onerror(err) {
    callback.call(stream, err);
  };

  var onclose = function onclose() {
    var err;

    if (readable && !readableEnded) {
      if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }

    if (writable && !writableEnded) {
      if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
  };

  var onrequest = function onrequest() {
    stream.req.on('finish', onfinish);
  };

  if (isRequest(stream)) {
    stream.on('complete', onfinish);
    stream.on('abort', onclose);
    if (stream.req) onrequest();else stream.on('request', onrequest);
  } else if (writable && !stream._writableState) {
    // legacy streams
    stream.on('end', onlegacyfinish);
    stream.on('close', onlegacyfinish);
  }

  stream.on('end', onend);
  stream.on('finish', onfinish);
  if (opts.error !== false) stream.on('error', onerror);
  stream.on('close', onclose);
  return function () {
    stream.removeListener('complete', onfinish);
    stream.removeListener('abort', onclose);
    stream.removeListener('request', onrequest);
    if (stream.req) stream.req.removeListener('finish', onfinish);
    stream.removeListener('end', onlegacyfinish);
    stream.removeListener('close', onlegacyfinish);
    stream.removeListener('finish', onfinish);
    stream.removeListener('end', onend);
    stream.removeListener('error', onerror);
    stream.removeListener('close', onclose);
  };
}

module.exports = eos;
},{"../../../errors":19}],30:[function(require,module,exports){
// Ported from https://github.com/mafintosh/pump with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';

var eos;

function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    callback.apply(void 0, arguments);
  };
}

var _require$codes = require('../../../errors').codes,
    ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;

function noop(err) {
  // Rethrow the error if it exists to avoid swallowing it
  if (err) throw err;
}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function destroyer(stream, reading, writing, callback) {
  callback = once(callback);
  var closed = false;
  stream.on('close', function () {
    closed = true;
  });
  if (eos === undefined) eos = require('./end-of-stream');
  eos(stream, {
    readable: reading,
    writable: writing
  }, function (err) {
    if (err) return callback(err);
    closed = true;
    callback();
  });
  var destroyed = false;
  return function (err) {
    if (closed) return;
    if (destroyed) return;
    destroyed = true; // request.destroy just do .end - .abort is what we want

    if (isRequest(stream)) return stream.abort();
    if (typeof stream.destroy === 'function') return stream.destroy();
    callback(err || new ERR_STREAM_DESTROYED('pipe'));
  };
}

function call(fn) {
  fn();
}

function pipe(from, to) {
  return from.pipe(to);
}

function popCallback(streams) {
  if (!streams.length) return noop;
  if (typeof streams[streams.length - 1] !== 'function') return noop;
  return streams.pop();
}

function pipeline() {
  for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
    streams[_key] = arguments[_key];
  }

  var callback = popCallback(streams);
  if (Array.isArray(streams[0])) streams = streams[0];

  if (streams.length < 2) {
    throw new ERR_MISSING_ARGS('streams');
  }

  var error;
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1;
    var writing = i > 0;
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err;
      if (err) destroys.forEach(call);
      if (reading) return;
      destroys.forEach(call);
      callback(error);
    });
  });
  return streams.reduce(pipe);
}

module.exports = pipeline;
},{"../../../errors":19,"./end-of-stream":29}],31:[function(require,module,exports){
'use strict';

var ERR_INVALID_OPT_VALUE = require('../../../errors').codes.ERR_INVALID_OPT_VALUE;

function highWaterMarkFrom(options, isDuplex, duplexKey) {
  return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
}

function getHighWaterMark(state, options, duplexKey, isDuplex) {
  var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);

  if (hwm != null) {
    if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
      var name = isDuplex ? duplexKey : 'highWaterMark';
      throw new ERR_INVALID_OPT_VALUE(name, hwm);
    }

    return Math.floor(hwm);
  } // Default value


  return state.objectMode ? 16 : 16 * 1024;
}

module.exports = {
  getHighWaterMark: getHighWaterMark
};
},{"../../../errors":19}],32:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":5}],33:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');
exports.finished = require('./lib/internal/streams/end-of-stream.js');
exports.pipeline = require('./lib/internal/streams/pipeline.js');

},{"./lib/_stream_duplex.js":21,"./lib/_stream_passthrough.js":22,"./lib/_stream_readable.js":23,"./lib/_stream_transform.js":24,"./lib/_stream_writable.js":25,"./lib/internal/streams/end-of-stream.js":29,"./lib/internal/streams/pipeline.js":30}],34:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":14}],35:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":9,"timers":35}],36:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":37,"punycode":10,"querystring":13}],37:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],38:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],39:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],40:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],41:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":40,"_process":9,"inherits":39}],42:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],43:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  //!/usr/bin/env coffee

  //  app.coffee

  var App, DB_RMI_Client, ImageElements, app, background_image_64, conference_logos_64, db_schema, nunjucks, options, templates;

  ({DB_RMI_Client} = require('web-worm-client'));

  ({db_schema} = require('./db_schema'));

  options = require('./settings').remote_options;

  nunjucks = require('nunjucks/browser/nunjucks-slim');

  templates = require('./templates.js');

  // { team_logos_64 } = require('./team_logos_64')
  ({conference_logos_64} = require('./conference_logos_64'));

  ({background_image_64} = require('./background_image_64'));

  ({ImageElements} = require('./image_elements'));

  App = class App {
    constructor(options1, db_schema1) {
      var div, title_h1;
      this.start = this.start.bind(this);
      this.conferences_view = this.conferences_view.bind(this);
      this.conference_view = this.conference_view.bind(this);
      this.ticket_lot_view = this.ticket_lot_view.bind(this);
      this.user_view = this.user_view.bind(this);
      this.game_tickets_view = this.game_tickets_view.bind(this);
      this.delete_image_view = this.delete_image_view.bind(this);
      this.delete_tickets_view = this.delete_tickets_view.bind(this);
      this.edit_tickets_view = this.edit_tickets_view.bind(this);
      this.landing_view = this.landing_view.bind(this);
      this.layout_view = this.layout_view.bind(this);
      this.login_view = this.login_view.bind(this);
      this.sell_tickets_view = this.sell_tickets_view.bind(this);
      this.options = options1;
      this.db_schema = db_schema1;
      this.client = new DB_RMI_Client(this.options);
      this.header = document.getElementById('header');
      this.header_title - (div = document.getElementById('header-title-div'));
      this.header - (title_h1 = document.getElementById('header-title-h1'));
      this.header_login_div = document.getElementById('header-login-div');
      this.main = document.getElementById('main');
      this.footer = document.getElementById('footer');
      this.flash_messages = document.getElementsByClassName('flash-messages');
      this.image_elements = new ImageElements({
        conference_logos_64: conference_logos_64
      });
      this.start();
    }

    start() {
      return this.client.connect().then(async(conn) => {
        this.connection = conn;
        return this.db = (await conn.init_db());
      }).catch((error) => {
        console.log("trouble starting app :-(");
        return console.log(error);
      });
    }

    async conferences_view(db) {
      var conf, conference, conferences, cs, html, i, len, teams;
      conferences = (await this.db.tables.conference.find_all());
      cs = [];
      for (i = 0, len = conferences.length; i < len; i++) {
        conference = conferences[i];
        conf = conference.simple_obj();
        teams = (await conference.teams());
        conf.teams = teams.map(function(team) {
          return team.simple_obj();
        });
        cs.push(conf);
      }
      html = nunjucks.render('conferences.html', {
        conferences: cs
      });
      return this.main.innerHTML = html;
    }

    conference_view(conference) {}

    ticket_lot_view() {}

    user_view() {}

    game_tickets_view() {}

    delete_image_view() {}

    delete_tickets_view() {}

    edit_tickets_view() {}

    landing_view() {}

    layout_view() {}

    login_view() {}

    sell_tickets_view() {}

  };

  if (typeof window !== "undefined" && window !== null) {
    app = new App(options, db_schema);
    window.app = app;
  } else {
    app = new App(options, db_schema);
    exports.app = app;
  }

}).call(this);

},{"./background_image_64":44,"./conference_logos_64":45,"./db_schema":46,"./image_elements":47,"./settings":49,"./templates.js":50,"nunjucks/browser/nunjucks-slim":51,"web-worm-client":54}],44:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var images;

  images = {
    background_image_64: "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkz\nODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2Nj\nY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wgARCATeBj4DAREA\nAhEBAxEB/8QAGgABAQEBAQEBAAAAAAAAAAAAAAECAwQFBv/EABcBAQEBAQAAAAAAAAAAAAAAAAAB\nAgP/2gAMAwEAAhADEAAAAfNuCgoAgAAoqACgLkhAAUoQohAAUAAoBQAACAEIQAAgAKAAAAQIKCiq\nUAAhQCgIAAAAAAAACigAFBQCgFBQCgoAKAEAigAACFAABAAAEAEAAAqAgICBAIAKgABEUAM42KUA\nsAAApFUAQBFyAQFKACAgBQAUAFAAAAICEBAAQAoAAAACACgVSlIAAQoBQgEKAAAUAAAFCgAUFAKC\ngFAKAUAJSABREKQFAFABAAAEAgAAFQAhAQIIAQUAIEChAEmOgApQIFoCApQCQBCKIACgAgAAABQU\ngBQAAAQEIAQAAAAAoCQAoABaoAAJAUgWhQZBQlKAUAAAoAAWoC0AoABQCgAqAAAAAQKKAAEAKBAg\nACgIARCiAiAQAgFARAFCBArPPoKCgoIUAAoAEAQgUQJQAsAAIACgAoIUAAAAgICAEAAABQAgAAAU\nKAUAgIIoFUEICgpUFKAQFC0AAqFAFAAKAUFACUAAAAAAABSApCiAIBQKECQLAQIIACAVAAlBKgCB\nQzz6AClAAAAKQQKKpIEAIAAARQAAAAKAQAoAAABCAEAAIUAAIFBFFAQFAAKQEgBVAIAUFKlBQACl\nCwAAAoAKCgFBQgFAAIAUEBQAAACKCFIABSCyAEBAAQACoAEFoQgCCUM8+gFBQAACkAJFKWgEQAgA\nAIFEABQAAACAFAKQFBAQEIAAAAAgUKACAFAAABIUAAKCAFKVKAUBalCiAAAFAKCgoBQEoABAAAAA\ntpAIABCkAAAAqIBACAAAlAEAFFQgSCgMc+goBQAACggAKUoAIIEABAQKAAAAAAAAKAAAAQEICFBA\nAAgAUABQAACggBAAChCgQpSpQUBalACiAAFAKCgoKAEoAIAAAAUCkUEAAAAAIAKJACAAEAFAlIBQ\nIICUATnz60AAFAAKCAoKClBAASAIAQAAKAAABCgAAACkAEiiIABCKACAQtACgAAFCVYCAgAKgBYA\nUppKAFpUBakUQApQQoKCgoIVAAAAABQACgAAAAAAIJQgBAQAACiCghKoQQAlEA58+ooICgoAAAKC\ngpSAAEECAgBQQgUUAAEBQCAAlUCCARSCAEIoAIBBVAKUgABSoIARYAAAAADRSpSrCgoKCAAFKQAp\nQAEAoAAABQAAUAAAUABUgKCEBACAAAUQACCiUEAsEArny6gAAUFAAAKUAoQFEEACAgBSEAACigAg\nQFJKAhQUARAQEBAAAQEFUAoAIAUpUgWAgAAAAAKaKU0hYAUpAAUFAIUFQsKEAoAAAKAAUAVYAUAA\nCAAAQgBAAALIAABYAAFgEArny6gSqIAoCAtASlBAUAKBIUECAgBACgAoCwIIBQgAAKAIgqEAEQCg\nICAFAAABSggIIAUAAKQFKUpSmkyoRaAAFKgAEWgAoCCgAAoABQCgUKCAAFCAACAgBACBFAAALAAI\nKJSACznz6iBQi0gEoAAKUgUCoAAUBEpEBAQApQAAAQEoCAAAAoJAlAAQRKAgIACgAAAoAEQACgBQ\nQFKUpSmkEUAAAlKQoKQKBQEFAAKACgCgigUAAAQUAAAAgAICIFAAAigAILAAFg58+ogABYAoBAAV\nSACgoACwEAIIhAFJoFBAACEFQAEBQABACgBAQAhAAAACggBSgggAKAFIAUFKUppKAAoIBCgFKQAK\nCAUAAoABRQQKABQEKgAAFAAQFIBACUACAKAERQAIArnz6iAAFEUAAgAAKACqQAFEBAQRCAFKUEAA\nqAgIQAFICgAAAEAIAQgABQCAAoKlIoAAqQLAClSgqjRSpQAACAAFKCAAAAoAAKBSKKFgCAUACACg\nFCAUAAAgFQBAFARAFAEAUOfPrAUgAKUsAQAAgBQAUAEUCAEJAlBAFKBQEBAQhACkAAKCggAICAAh\nAAChCgUAqAAAACBQKmgUoKVagAAgAIAaAAAABQAAAUUBSgQIKAAIAKAUBKAUAAgFRAAFEgAoQIKK\nA5c+oFIACligEAAIAAAUAKAIAQgIAAIooAQEBAQAEBAUFAgKAgAIgEUEEKUAoKACAoABAQFKUpSl\nBQAAQgBApKFqAUAFAAAKAKFAKBChAAEFAABQgoKAUEAFkAAJYAAJRAKADljqCAoAqFsEKIAACApA\nCgAKAICAAEAAAAICAgIACAhQCiAoCAIWIAAICgAoKAAAAAAQFBoFKUoAAIQgUhQBQVBQAUAAoAoC\ngoAEKABAAABQEFAKCgABBKAAlgAAlEAoKDjjrEoAABQWIAoEAAABCgABQBACAAAAAEICAgIACEBQ\nCiFAAQAgQAACgEKCgAAAAAAoKUFKUoBACEIFAAFCUoAAKAACigKCgFAAQAQAoACCgoAKChABKAEs\nAAAlgFKAWOGegAAAAoIBKAABAAAACggCwAEAAAABAQgIAQEAAAKCgBIACEAAAKUgBQAAUoBAUAVR\nApQUoIACEIFAAoKhagApCgACgKCgoBQAEhQCAoAQUFABQVAAAoEgFAEAUBYFKajzToIAAAAABAAV\nIUgoAAEKACBSRQIAAAACJFEIAQEAAKAUIKCAEBAQAAoBQUgAKUoBABQoEUFKUEIQAEIAtQCgoKAU\nAEKAKFAKCgoCAAAAAAlAKAAUJQACioEAUCAAUFBY0DzzoICAAAAACAFQACCgCAAAEAIAsAAAQAQG\nVEIARAUAUJQUAAEBCAEAKUApAAUFKCAAVQCwKClIQhAAQAKKgpQUAoAAAFCgFBQUBAAAAAQCgFAB\nUAoABQKBAAsAoAKWKUErjjpKgIACkAAAAAICACUACAAEAIACKACCkBAQixBAQAAoBSgAAEBAQAAA\noKQFAKCgAlCgARQUoIQgWAAAFQUFKAUAACgBQCgoKgAAAAAFQCgAoQAUAooCwsAAIFUAFjQABLOO\netIQgAAAAAAAIAQKAiAAAEIFBIACAAAAgIQgIAAABVgUAAEAIAQAFAAKAUAoAJQAAsCgoIQKIEAA\noKCgpQAAAKAoBSgoQAAAACgIKAUBBQACgFFAlgKBAKAUGoChYlkOE6ikIAQAFAAABBCoCAKgAACA\ngICAEAAAIACAgJQEAAALAoABAAQEABQCkBQUoABBQggUAoAABAAACgpQUoAAAAoUAoSlAKAAAAAg\nFBQAlABQCgBLQRQBRAKAUsUlCxUlDzzqABAQEKCgAAEICAAAQIoAAhAQVAQQIAAAAQEoQAgAABYo\nAAIAQEAoIoABQUoBACCoIFKAUAAEAABQUFKCgFIAAKoBUFKAUAAAApEoBQAVAKAUAoQAUFACKAoK\nWKQFKEgPO6wFBCEAAKAAAQgABAAIAAgBCKJQgICAACABBUAIAQAAoLAFBAQEBKAAFgAUFAABBUIW\nBQUFAAAIAAWhYpQUAoSBQSi0CoKUFAAAKAgAFABUAoBQChBQAUAoQAUFKUgKCwqIPO6wApCEBACg\nAAqRRACAAgAgACAhKLELCAAgAAEKgICAAgKACiKAQEBAi2AAoBYAFAAAJQgEUFKAAACUABQWKUoB\nQECgABQUpQCgAABKAAUBBQCgFAKgFABQCoBQAUoAKI0QIPNesAAIQgBChAC1BSAiiAgABCkAAIQE\nIQBRAEAAigQJAQAAAAq2AAICBIBQAAoVApQCAtkUCEEUoKAUEAJQAoKWBSlCFBAoACgpQUoABQAg\nFAAKgAoBQUIKACgIKCgFAKWApFBSxKA87oqEABkhKAIgFAqUAgIRQBAAACAEBCEBAAAAACEBCAgA\nAAKURVEQQEoSFAAAUQWlQFCyAigBFBQCgEAqAFBQVLFBQBSAoCgoKUFBQAgAoAKAEoAKAVAKCgAo\nQCgoKIFBQCgFighThesIgigZsyKiQABQBZBQQgBAFAEAQoEBCEBACAFAAICEIQEAAAKURQCAgqAg\nAABQURQApJRYCFgUFFWAAJQgKAUqUsClAJQAFAKUFKUBKAAAUAJQAUAFQUAoKAEoAKCgsCgpYlIo\nKFpAlXz3cBACrDFkJUQFiAoIBREBSAEABAAAQLCAgIAAACggIQhCAgAAKClgAQEqAgAAKAUsCkAq\nEACiwLQoAgKgAAKUqCxSgUAIUAFKClBUFAABQAVAKAChBQUAoBQEoAKIoKURVoABQVQAl8+qIQEK\nFykrNQiACBQAICpYEAIAQAAAgIFhACAURAoUkBFhCCpAgAKClEUgJUBAQAAoKUFgCUIQALQUAoKC\nAEABUFKUsUFoQAAFBQUoKlAABQAVAKAUAqAUFAKAEoLAAoKClloWkQChaJaCqPPUJQhACEqGagSA\nAloEAElKIgJQEAEAACAgISgICiAAICEtgSBRAIApSiBKEIQAgAKClKAAQgBChaAlKAFJAAAClKUo\nKACAAoKClQUoABQAVAKAUAqCgFBQEsoIKCgAoKCy0qgEALQWUtLNU8+pEhKgIUyZoQlRIKgBAQAC\nKACAEIAWAKQAhASoAQFAgAQEqEBACAoloKACEBCAAAFBSlABCAgBQUFBQCAgAKClBSlAAICgFBSp\nQUAFAAKgoBQCoKAUFASwKAUAoBQCwWlUUEQtALKWllql4XMoRISgiVmoQGaiShACAgIUFiAAgIAC\ngQBBUICAgAKAIAhKEICAAAstBQCEIgEUAAUFKUAgIQAFAKCgAEBAUApSlKgABQQCgpSgoKAAAVBQ\nUAqCgoBQEsCgoBQCgAogtKoFlCwWUCqLLVKOSCWQlQiCGalQErKQVAQEBAAAAQAgEACgEBCEBKEB\nYFAABCEBACAApYoWkCQgJQACAKVaAAQgICgFBQAAQAAFSlKUFAIAAUFKUoKAAAUJQUAoQUFBQCoi\ngoBQCgAFEVRQFpZQBVBRYqlAzEFQiZslCJipUQFzZCEoQgICAAEBAEBQQIoUCEISoQEKEq2AABCE\nBACAFBSxQFiCEFCAARShaUAgSLAACgoKAQJBQApYpSgoAIAKsClKClAABQgoKAUJQUAoKERQUFBQ\nAAUCKooC0S6UCyloACgCSwEFkTNSyJioSwWWVlJQhmoQVCACFQgICyAAAUQIQlsMkICpSgoirAQE\nJUBCkgUFKWABCEFCFABYFKVQIRBFAAFBSgiCUICgojRQUAAEoUFigpSgAAJQUFBQEoKCgFQIpQCg\noAKABFC0Aqiy1qy0KAAAAJKBASombM2ZsgQtISyEJUM1CEqAgBCAgAQCwBQCAyQiwhLBSxSlEAQl\nQhFIUABFKWKAQhKgAAKCxSgAhAQKKBQsUBBBUABQUsUpQCAUAKCxSlACACgFKChKCgoBYIKCgoBQ\nCgCBQFoUlUWWrZqqAAABQCQoSUQlRMaziwAAZshCUIQzUqJAsCCEBFIAALAoICEISsghQailAAIQ\nhCAABRYpSxSAhKgIAAUoLFAIQVCwFAUsCggqEAKClLFKACUABQUsUoQUAAApQUJQUFAKgFgUFBQC\ngCBQAtC0AsFrWpSgCggBQCAAksFQxc5siSohaRJUIShCErNkIACEBAAQAoLAAhCVCEIAU1FAAIDI\nICAAoKtjQgQlQEBAAUFKUAhAAAClBYAEqAAFKUpYJQCWwoBQUsgpQAKAoLAoSgoKAlBRAoKCgFEA\nCgBaCqALLVstaAoABACkKAQgllDNmLImbIUpCJKEJUIDNmagBAQEBAAACiABCVCEIQFKUsUAhCEJ\nQQAANFirYEJUISiRQAKWKUAhAABQsUpYAlCEAqwKaKiKASgAKCgpYoAoACgslBQUAqCgFEUFQtAL\nAAFABVAqgCy1bNVQKAAQAAoBCRFUIkszZmsoNSiCspLJWQRBmpUAIQEBAEECkoBYEUZqESWogKUp\n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\nCmqkFhCiIACFFEKgCEqAoQFAJKAgKqFgEAAAAIAAAADMtAAAACUACgKBAAAKKIAAUAEUtUyEtaSG\nFktBbIAUlIFUAgFWkLAAAoAAKCxBQFKtNJSGDJAACgQKUUIQgAAESqLAWEAAIAgFKVMrIoNWbKYl\nysNCIQEBQAACEoAgAAEoAIKRQEAAAAABAAACSgAAAUBBSChQBAAAKBRCgAAABSAJagIWUgUAABVQ\nLZAVUCgUEUgKAACgAAFNAhkgAAKACwqAEAAAICkAoQIVAgsAAFIJQTVbSpmayo0IyQgFIoABASgK\nkAAFQAQAFAQQoAAAAAAAQSgAAAAEoAFAIAABQBQAAAAAAECoUAAAAAFCoUQWUAWoUQABSAoCAoAF\nBSEIAUAFAAIAAAACULEAFRAlAgsAAASiCqmipmUo0QkCAUgAABUBUAgFAABAgACgEgAApCgAAAJK\nBQAAAACpACgAAEUCgAAAAAAIBKAoAAAABQAoCKAAUAAFSUEtRQSoCoAAQpCgoAELACggKIABQQAI\nKIlAlEAAACWWCgCCikAAAAEBQgQUAAUIABAECkAAABSACFqAACCgAAAAUAAAAAAAAAAAAAAAIAFA\nAAAAUABUKQBQAUEBQWyAShYgtiUABAAAUAoEKWBLBZREUAAAQACgAIEAAAAhSACKFAAAAAAEQAUA\nAUBAUkAAACABQQAAAAAAoAAAAAFAIAUAEAAAAAABQARAAFAAAAIoAUAAAUAFQsBQgUgoAAAEAAAB\nQAAAABZREUAAAQAAlEBSAAAAACAQKFABAAUAAEAAAAUAAgCAAABQACAAAAAQqgAAAAAAAAAAAAAA\nAAAAAgAACkBQQAAAUEKBQAAVIoAAAoAAABAAAAUAIUAAAEKAASkWAAAJAKAAAAAAAQAAAAAAAAAA\nAAAoBAAABSAFgAQAAAAACqAgAAAAAAKACAoAAAAAAACIAAAABQQFAAUAAAAAAAhRQAAAAACAAAFA\nCAoAAAAAAIUCABAAFAQAAAACAABQQAAAAAAoAAAAAAIoAIAUAEAAAABQLAAAAoAAAAAAAAAAAAAA\nBKABAAAAAAAAAAACgChAAACgAAAAACAAoAAAAAAIAAAgBQCAAACAAAUEAAAAAAAAAAAAUAAEAKFB\nItIAAAAAAgAABQNQABQAAAAUEAAKAAAAAAQABAAAAAAoAIAAAAABSFIAACkBQAAAAAIAACpAAFBA\npCgAAAABAAAAAAAAAACAAAoAAAAAAAAAAAAAAAUAAAAEKAAABDcWAKAAUAAAoAAAAAAAAAAAQAAA\nQAAAAAAAAAAAAAAAAAAAAAEAFAACAAAAAgAAAAABKpAAAAAAAAAAQoAAAAAAhQCAAAAAAACkAKQA\nAApAFIKoQ65UCKAUAoAAKAAAAAAAAAAAEAAAAgAAAAIAAAAAABQCFBAAAAAEAAoAAQAAEAAABKCF\nAAQpAUgAAAAAAAAAAAAAAAAAAAAAKAQAAAAKQAAAAAQKATvmixQUAoABYAFAAAAAAAAQBaEEAAlA\nACAAAgAIUAAAAAAAAAAAApAQAAoICkAAIBQAAEAFIlAAAACAAAAAAhQAIVYAAAAAAAgAoApACgCA\nAAAABAAABAoCz086KCgCKAUAFAAAAABQAhYEAqgEgCikQAFAIFQqkgAUgAFBAIACkBaAAAKEkCAA\nAlUEAWAgAFCkQAAQAChAAUgIAACUgAAAAUEAAKQoABAACAKQAoAAAAAIUhaQFIgAEFD086AKJKUA\nqkoAAi0EBQBUgUABQAQAAAAhSC2pIUUAUIIFJVApCAsAEKCC0CoEAQQAgAIBVKZIACAAEpCgAIAU\nlBEBSFLQyQAgAKAQoAKAQsAAAUAoBAAAAAFFIAAACUAAAAABAQ7ZWASgsCgFAKCFgAAKAAFBQCEA\nAAAAAAAAKAAAAK0CEKoABEAQ1VrMIAAgAAABAaqmIAAgAFCAAAEAAABAClqmSAEAKQAAAFAIUAAC\nABS0BCQAAKoAAAAAlAAAAQAAgrWZYoALAAFAKAAUAAAFLVBIhAAACAAAAAoAAAKQA1WiGSRaAFJA\nAAFqQAAAAAAAIdKhiAABCkKQAAhahSAAAEAKDVaMmYgAAAAoBAAUEKAQKQAA1VAMkgAACFtIgKhV\nJCrAUgKQAAELIilABQAWFIFAAABapTVQzEJAEAKAKgAAAAAKQFAAButGTEAAAACggKBAAAAAAAAH\nXTMYgQAAVItQAAhQQAAAAAAputVkxEAgBSBaAggAACkAAAApCqaNVDMZAiUAAICgEAKAFABCgQsg\nsAUoAABQAAAaNVqhmMxCAAgJFoCggABRSIAACkABqulU5xiBQUAAgKACARSVSIgoAtACFi1305xz\ngAACAApKRACioAARBQRRQDpXSocsswFCkAAKASApFqkIAIVSFBAClrdUzGIyQAAgAFIAAoAABVAS\nQoECgFAAABS1ut1TJzyzEBTVaoZjBIIVXStGTnABNHTVhzygAKdahziFOldKzHKMoKuk3VXJiSQW\n1DSdLYc4gLFrdU5ySBAVemlOcSAN16NuGXOEK60OUCkBqutYOeUIDVdahyiESEi10rduJMyhFobr\nvpI45YgWutYjEACnSt1yjEAU3W6xGIgEK0dNKcozAgFaOlarMczMQkKAEKAAAUgBSygQSAUApAlV\nCgSrqtHTTRDEc4zEEKFKKzIWAAGqhJCxAqmlhICqAUEjVdtNVyw5wBAaLUiECVQLVJGQUIWoIFIi\nLa0DIKQ616NvLhiAKDILQFAMggBaEiECVRTVDMAUFNV6NLXHLlkKQAghVNAyBAGqEiAAFqkJAgoS\nFarpW6GI5xiBAAUAAAoALAEAABQQpSQrRquum6GMuUZjKWWAIAtJAFopEBSUgAAC1JChSAS29a76\nQ4YYgAQoAEKIUiIUAKQVYgFWBCwtABFO+3bbyc2IAJAAtIAAAAQItAAoAEKoIWBuvTtvTz4ccIAA\nAUFpEICkBQCAAAhQKkQAVTpp0rVYy5xzjIKAAIVRAFAAIhQLAApbN29K6aUxHPLnEiAAAiACCkUW\ngRC0GUqxBVECAUKQWvTq9tOOXDDKAWCqiCkgVSCAqiIKCApVgASrARABpfT0dNPHyYkAlIUAEBQQ\noAABCgUEFUCgAA3Xp266cMOGGQSFUQoUtSBAAAIEBCggqkBACCkarVda6aSOccsskgAUhQACiBak\nAKsBWzrp001UjllyyzEASqJJRaIhQIkKQUAEKEAAIUAAFOtendtefDlmSAAABQpBQoiAtIAACJVo\nIUEKDKAaX2dVrx8mYCspYUICrEgAikoCFgKAoIWAAKAAar1bvfbjl5sM5BQAFAgQAhQAQESqpAlR\nEqgBCiFQ3XTTtWq55cY55QFAKBChYhTCVaLNr0066dKhyy5ZYkktBACkIUpAUhLJFUZssQUEKgAK\nAACwLXfV9G3OPNiZyhSApCFAFWAKUgKoEKACBKpIUgKFhQar29WY8fJACAEQLQBlBQQoIAACwAKC\nAoBClLXo1fR0Yjzc3PIICgKAQFICRapAQAAhEKAFQCFQA0ddO2nSsxxy5RmIAUQqiAJZpeunXTpV\nOcccsZYgUoLEqFBCFKQoIQhQAQlAQEKQlWNEQVSdLfVt0rz5efEyWKpKuQltCQQzRbJVBBoqiESq\nktVclIgsFiFIoVRuvb2csvJyQAIURAAURApAAEoQ0IFICkANCFQFhVOunq6Uebm45kgCikVRAASy\nyghVSJZChQAIUlQAEAKUtbrtXXQco8+WIFgCgFj09XWtHOOMc8sZkKFpSmTUCUikoQogQoMiwoiC\nqBCkBKFghVaO2no2h5ubnlEBaCkEWhACApSASCqIKSUCkAAtIAkAKddX2dnmw83OICoAQAhSkIAA\nAAKpAaEAACwJQsUEFdtPV0trzc3DEyCwKAQoISrChI0QWkqwUIIgFCFBACVYoBuumnbTVZjllzy5\nwKIlaPd1csuWWIySKAhbIVUNxEssqggCQgKUiqiRSACrLLKIAAg1Xp6Xvpww82JIFUAhaSCVYgEN\nAhq2QQApCkhQQoESqBSUgiip33fX1ePk4YghSUiEFAQ0CAgBRVJAGRVKaBIEKWBSkKZqg6V6et61\n58PPzmYApKssQCFpCggpKsFACAEoQFIAKhSwFQVTrXbTrQ45ccswjJopIhQIAIAWkSiKSiikIUJC\nLQkVUSqBEEKtIRKVaddvRto82HDMkCgAoECAFABCgAoBCgEAKBEqkABViUHp6X09Hi5OGIAABBQE\nABKgiloUEEKARapYRKQKAQGa0CHSvX0vbTjl5ebnJVBC0gMoKAtIUEAAJSKSgABKCFUooQUBTVdq\n66aOcccMRkYiAKtIgBSItoASC2ikAIBUghVQCS2xESoACm69G7305x5+blJCxAShYoKAQFKQgABQ\nAUEBClIAUkBUBQQp7Ot7beHjOOQFqQFZLCgBASkCgAAFAJQ1FBRKoIAUqxCJpdV6ejvtyy8mGMyA\nq6jJBUNAhSAAAhTISrRUABBSKCkq0iFoRLVB00727Ico8/BEkUGraSAIlKFiVSSLaAAAM1JKCAAU\nhaMpClOmnq3emnDm8+JmAoUsQgAKUEBSggIIUikqlBIlAUGQaBSEBAC17ut6aeDjOeQzUBS1kkKR\nQQENCkSpFJQSaUUopAFgSqCllugEJFLWq77d9sx5sOOQCMaZs6y0kElopCBAgtIWrQyRBBAKKKQA\nBQSiClLGq629dPFwZIlUaNEiJ0t6aWsxiMZgAqjRrTVSOeUIQBBK0dNXKYlzAINW+jT0bQ8vNzyy\niBa66vTRHLM55DJSgA1XXV3WI5YmYUhViVuu27o55ccyApCApqu2mq45YyGTNDoe/tR4OMxAEpGt\nPRuxPNhmJYlpBQ2enbS8pPPlAUwaLHWvRuxOOXPKlBClWFs76vTTMcsOaQ1LaV209Ow8+HDKWKla\nOtdbYc5OcYhShYzEhQp206205JwyxAQICna3pUOGZhYghRA6120hyyxA1lAVYlXpXSt1usmMuWWU\nRpZSN1003UOeWIzAGUGjervTVZy5RmMiFnS31dHXTjl5sOeYBTrXXV3pzjlic4RCGigh0076u655\ncMzMUgIaN136XdYy8+JzigAgKdtu2rzk8+EgDNDpX0O1xHz+UzAFBvT1bsPJzmYzQCJVKerbtq5P\nJznOBSAGz07vbTnHn5zmCiKUFN6vfbpWY4YcpBViU66vq6NHny4ySpVKbOtu6xHGTAqmYgBmIU66\ndq2uI4ScYzEKSBut13tpyjhJiswEQ0dK76dF5R55N80KaMlN27rRmMRCxlBaRa6W6JHOImSlUQpr\nU3blOeUJAlU9G76dqebDz4ZQCnSultMSc4kZKCFKCnXTVYyxEgKEBTdatGMzJCkBSiFaqriTAKUy\nDtt7+t45eHlMwqUiGjWiMxCVCAgKdKaUxlkRKsUAtdtKc8sxCVYAFNGq61qpHLLJAKR109fS9a4x\n5czEQkSzdvWt0MGEhmBohiALQ6L1oco4RkpAgLo7V1rmcYxBIohZLXW3rWY48lLFAW0gUiIqywIA\nAoBAChSCVkRoErVend9G3PLy4nLKwtkgpQsSkBAUgoSKRKoQBKpRFqCLUKAQEBoRKRayAAD0dHt6\n3zc3j5yQFZJQA1AlQpCEKUlQohULAAlUsUohQEIU0IJQqKQtCA6aevd7bcsvLicsoZBaAtZoklhQ\nLNAiolUVkggashQULqzK2ISyEhLSgVI1zCkBRbYsEUgSrAoICwpEqEKCkIClB129XS7rhh5cTECx\nSAApAUAAFIQpASrFhUKWIUAlQGgCUEKsZAIUFIK9fS+ro8nN5OcQM1mhQCAlCwIShqBKEKWKQAtS\nBqKUEJUNAsAhRDUCgAG69XS99sR5ObjmCrEsoWQAAhQAS0RFABFJSKKQoWVWbEUktBCgzIKACgRQ\nUhmhDcACkAAISoWKAar0dL6dsx5ubjmYAilIAACkqwBClgKpikUpSEKCFBCkJQpCkiGgQpCFAIaP\nZ2vo28HN5ucFBioUoMgpKsQpmhY0QzUrUDUQtCGoAAoBCFNQiVoEKQoBRA1Xp6X0bQ8vNwxJAoBB\nFJQoloM1KFhQQBKBKpEFpSVBFICxKoMWApIU0sQIoKqsoAgAKhqBAZqFNwOu76duunHLzc5zyySr\nFAKZpFKShAajINCBaGK1CFUhSEKAZNAEBQUkKAlSAFQpq339XXT53JwxBSCoQpSAgABKsShYAoBD\nVDMaKVc2QsCwqmSlighKRQAaikqCvRq+vop5sPPzmYCJUIaESqUFlVEAFgtBBQiQsWkolIoM1Cgp\nTlqDUssikpYRaEBTJTJoFIZM10iiM1AU2d931dFPNh5ucyIFqARQSoU1AlIFMVkpqNAAQqFBSEKU\nkKAgNQAJUKCFJFoSobt+h2aPncpxypCUBACkJQCJQsCA0Q0AQpogBoEABSkgUoiUpEKQsaFJYkqn\nXb2dLuuGHm5TGQgJQhSUNQALKIgFAlWJc2KsAVYBYUEShQ56gq4ssaIWBC1YhSAxW4pSAhCmolZB\n2r1dL305R5uc5ZZiApQSkCVqFBFAEWsmaFjQAESqACkAABSEBYpKhBUBYAFBvd+h1D5vKc8gFQhK\nCFWJQgKBEoCwBQUFIUgLFKAAWLQkUhKoECxSUAAO2nq63ppyw8vJzksS2IiFBKRKGopIlCkBYUJU\nBYUgKgICgAmmCmasaBYlAUsCkM1Y0ubIWJQsAK9Or6tt15svFiTLUSkCkoWAqFgKhqAIDRCFAKQh\nSmahqAIQoAAFWKQpDNZKQApQdtvo9byj5vKYiggBSAzWozWasUpCxKEKAUCBYIWikkNKiikUoFUh\nAAXJUAABQddPV0vbbGXk5TjlDJRFESpoImpQEKCBagjOgJZQKQgpFJQAVAACxTFUsADRmsmo3LKz\nZYpADpb6ej06ZPJzefMwDUCEKQFABTNagUFgAQEoUEBqJWUzW5aWM2ZKUhmgKURChSFpBUIAevb3\n9L54+XzzmNKBClICEqxKRSVYEpIKpIKFECwKKQAKI3XS3ZqqKggSBCEICQiGTNljpb6+l9O2Y8nO\nebLMWCVQM2VYDNgsVQkKqVYhQCCFkVURLS0iUhQFBmtQBQDJSnOqbyoM1mkaNHe319HXTjl48OOZ\nCwBSCoCwApAlhSCyikKACmUpitRVzYEVQQSgMgpAACVYoAJUAB7933bvky+biZkAtIAEFuUohQCK\nSrGaoIAaII0WFQsKARTdb1eh0qmIhkQBQWtFN10tHOOcnOOWZV9W3r6VHlw8vORO270rS2sxlJAy\nQgEZjJkyghSxmhVgIBSFlWmY2LUEgNLutVo0QzSFDUQySTmcqydT3W+rZXlw8+HKSVooFUGogICA\nRkhSEsLqBYlEGpRKQoQiVedgq6ksASpVgAZKCVCkKVYkBYafS3r16eHLwc5lBKhTUFJmrAlpBCxR\nUAIAAUENRQUAELFBKGoA1Lz1KWALEoWuy+7pe+rEGY8uZ4cTFezV927o82HCT2bvWgPJh5cTIhVL\nWjdtrVEkc45RiTBAAUEIUVApO2bmtSjIsHW3oDISropuvTtuoZjjHiyp7NvTXOPJlyy2m9N26MxD\nMQzZYGlpqtVsyYjjJxyzAgNRQCFABSkMgxoCWNSgUxZDSwAAAEqFhUQtjdfS6Xvp8/Dw4ghKhSpZ\nZUigErNRNxZRKiAClUmSgoihYgFNRClURKU1LipZYspKXTpb3rvq9dNLExHLLzYnnjJbPRq+3d6V\nxy5SdbeumjEeXM8+HKTIJVloq10rvXa3dZjhJwjlGEQLGalahWQU6TWU0tgEhvV7VoUNmi1TVZjE\nYjB0r1abrlHPLddK1WI4ZeaTlCESoWBohpe2nv6trEh5cvHykMgFEASoagUFiFoQlQQsq6jINAGK\nhSwBmqQzULCutfT6XpXzubyZiFAQlWKSJUKKhDRYAlZJSKUFAKIEpIKWKQFLLKBNLAE3b1O23fV6\nVoLE5x58zz5cpAlRmynfV9vS9q5R48SnfV7VusxwjhmccsEiEsQqmq6299PRbuuccMzzZcUkQlCg\nEOk1SghKR0rqUadK9WnRYmTlHlw8+Z1t9e3o0hzjZu3QOUniw8+ZmIUFBQCFPTq+/q0oHHM+fzmY\nkUVkFgDNIEJZqWVqNglYJSKQlajUBWTNWNRAKgISrA7av0+qnzeTzSQohViUKSJQEoZKaiVYEoAB\nFpEFWKQiCliULAoCrNS7rrXbV7adK0VRlOOXDM45c4zSoWKDJa61793tXOPFicMzVdbe+r1qkOWX\nOTlHOMmSJAtOmnt1fXoOZ5svFic0ySkUpDtNbEKxUBTUbq1209em1Jk5ZeOB7dOtcY4ZenTrbQRP\nFh4sQIgqGo1CsmpdWdt32bdbRE5x5MPNiZNRQQyUpYlSkCVSFjRSVAIlYoaixKgM1lNLqBmqCEKQ\n9er9LoyfL5ThEAKAWFUhkoJUIUApCkAAKQGoAAEshDcpKWVqei3vb206FqgAGY5xCAFIACApuutU\nyeLE8eZiKbrrb0rou6oIZMxLEUp11e9CGI+fiebMi5rNmiwPq70gFWQpSlLQhzjnHOIenT06U8uX\njy1Ht276aCjlJ5csRmMpirGo0u6V1rtXTSmY5nDLhmcYyQ0byEoaLFIZBS0iAFBK1LKymKGo1EqA\nzWSlLEqwJQA9e79HblHysTnlmoUpBFKCAlQpYGalagCwrNWKQIlVqBKBNSxFJaQFi6nW3RQUlASA\npFAKCgRCVKsAd9PXq08mXhxOSZBosqtpuXRqlUFoAQzGDlEiVEhLRU+g0ECVCEBIhDJAd69u3auc\neLLyyYjS6O1da2bqlJSJULFABkhziRzjMZSGSVCxuIKGoFpEgWqQsCEFAABEFQ0ZICUKIlCxSFPf\n0vs24x8vnOcSoABFKQlCA0I0ZqAlWNAyAQoBQQEsRSgstIEAgqxVmmSSUoIWNLSkIml1GahK1Aha\n9mns1dV58vDicIlgqwFksW2FgCVBZCFWFCRYShU7Z1QCmTFQFLCodj16erbRwy8WXCMVkpqLFKlK\nFzWjNU1CJREozUSxKRSghADNQIJVixqWoXUZrQikFKwCkLAlQpkFABTIpFEar6PS+rV82Z87mymS\nUIaiApSEqxC1CxmtRKzVjQMgCJSkUhKsSxEqxaRqWmiEqGU2uoGakWqCFEUoIUEqxDUDNRNr6NPd\nu9K4x4MThlmwWCrLLAWABKzWbAEFpKEAO+bQUpDNYrJTcWO1e3bvq5Ty4eTLEQzQCSFtskLbTJYp\nSiRUC6IRIZJVKAZJZDFbiFM0jctNxlC0pk2IpazApmgBzoCGiwAIShYG6+r0ve3x5nzsSRCihDJQ\nUEBQQgKCUKIAEKSrAAEBz1KWWlkq0pkiDQUWKQWAVZAWWVSBKpE1BRELU9Gr7t3tXKPDmeXMwCFq\nFhFqxViUxbLLECqAsQWQ751ogi1DFZqVY6x6dPbp0t4yeTDzxiBmsUNxADUSgICpY0DNAIzVNRis\n0BqAIZqpZRSmaQKCxSUq5SzUoQqghDNCUEWJUJViVAUHWvsavWvn5fOzIIpQCAChmkaIIoBmrSBk\n0AAIllUkNKiVKRUKQDRDJSwFCiFWKubLFBCVqKRREoCwINHa33bvorJ4szxZciUklUsDRSRTFUgU\nCJSmQSvTjShYpDNSs16D216NC+bM8WWIsZBjQIoBYlUyUgsRSxpZZkAzWstkrnWTRcqCVKsmbbGo\n0SrEJQRLItpCtRBEqiBKzQEEKEJQpqIKh6T6+7o+Zl4JBAmpRYAlAYpWswURKpKqolkUEhossJYK\nFRLCioBYAFM22QAKRQUEBSxkUABYC0URTNg6W/Q1fXUPJl4MznEsCkAVSCEFtgQEqEKg9OdZNEIU\npqu2ntrtbzTxZeTLAjZkGahQWSFBmoaICghSliGgIVCGaFjQImbaRLEtpZANEhaJUETQWAEUEqFB\nkAAzQ0URAezT6uqPlZnigCBC6kAFIQUilIZqFLCoCghmrFAAKQEqiJViwKCUAKpIWJQENwABKsDN\no3JCqCCEKdLffp7LaeaPn4nBAAJbYhKESruISoKsQgO0uixDnpY7ns09WlOEeHLzxkoi1mkDJKpq\nSApigKWJWKG8hohYtAIiSi0sZoSyLqNSZoAQApoikLAEAhYUIFJBQQpBc0oWKe/T6luD5OJ5YoCS\nhqISkUGaApYhnVJYBYgpLbIJUNEiVYACoFoBZJVighoyKhqBLYlLFKSM0NxAQoqxSEoUhm3rHtr3\n6uzzx8+TzxhLBc1ohmqIlagQlUsCErrKLFJXqPdp3rB5I8mHIySgimKoIWRVgCGKlaimolQAsBVg\ngLqJZCLUlRaljNF1IKQlZOerqNRpKIQoAZoIoqCAoQAojNqoaktfSuvo1zPj5nCELIUFgAQEoQpT\nIqwFIVYEWUSApYzQoAUQoIEFBCmohiijQSiANEABLSWMVqKAUsVc1Am19VfR1epyPnR48wkWFM1C\niJQoAAEK7SxMr1PZp7q2vBPBHkzLCoRSQpihYoIUoMkqFimgQEKQhSlMmoWZVVkLAVMqrUgstSVF\nxW4plNFiApKpkgKQyUpC1AWFSFIVY0fW3r2LxT4+JxkorJLSaiwBQBWaS1OerDUmoUigEUZsApYl\nQpAFqQoWApELUsFlkC0pRJTINCJVM2wFkAoJWoRSUUhaeivpavcweCPFmcykIZqgAEIUAA9WCumr\n7q9NpPLHzjzyWKZoClgZpFBAAKGQUENQBQCAFBCkoWKhclJQsEoBTNWEZqkpLUpAQhQQEtsglCGx\nEABK6L9nV9S+VPi5mJKUGNXUWQUAoESqDnaKlikAFQGSghQAQUVIKAAFoEiqDK6NSQpAClICVhSa\nLEKCVCiKCggPRb9HV9JDxx8+TjApBUIUEJVEUzVPZh6tX2adF5p448WZgyCEKSqQsAAQlAQApYlS\nkQpqAKEiyqWAAFIhSULIKAQAoIYtoTUZqEBSxKsShQQAsCkqA7L9vV6r40+LJJNxQZosKligAEBQ\nCAVAUhlVEsCWolCyCVYlIVVELJVJQWBTNWKQEqwKUEqCFWABDNUpCwBKgKdrfo2+0HkPm5nGBKGa\nhYpSCoU1SPtL6apwjwx5ZJEqiICVmtQIIlCkJQgKQpYpKhk0UAhZCqSCqKYqkBosRAWpApIClISo\nsSkAAIWKSoUgBSFLEqxK9S/Z1dr4JPkJJKUoimbYakGgQVCFgQooQoBlZQpCGogqIgVZYKtRGbbA\nlmoApQBCoCFBQQpYlsSgsQlpKFBIQltkpK6r9C33mjznzZPLGRWRVimoUqA6VI/RLk80eHM5RIlC\nApDNAUgAIUlABEqligyZrQECVCgQoWKShYENILC2JFpCWQRLaVMkKSrAFiVBViFM1ACxLaiNEPdb\n9i2nzJPmnMFNyWKZqLUFLFqEIWBmqDRADJQuapklaiyBUUmV0WIlBLYUIUCyAUFABCrZIK1AGLSU\nARSVCrDREzaLJLbJtfdq/RNnE+dJ4zBoVQUkQiLRI/RW+LLy5nIRSFM1Y0Ws0rMCELAzWiCFAZoa\nigzQ0Q1GQSkSgIaBqBAlNLopK5iIZsFESotTNsKhbEQbCqEkzbklQlWKIpULo+lX1Fh8lPBEIaNS\nCAWkhY0dDVvKTBqIZpQikFXJZNEVQpTICIlRaWBmykUAkVWo0CQSLU0CEqxSkBYpm0kBSlWVksgA\nlsKAVOq+yvevRcJ89PBEsRKksAIUkD6MefLIqRSkFaPRp1q1DlHHLjEqxCghQSqQAFNHXTrUEco5\nRihAWJVAigWdLfTXcpg4RwjhWTUCwsLZJbmoQ3ETdvY7V1rJxjzGIhTNZNCKWM10Pq2/QXKfHk8Y\ngmikM22SgptfTp2B544ZmQZqUOa1KozVjcghu3011M1iOJxyzQFLEJQsCVmuh6zpQxHCOIk0WJUJ\nWopi2lkoKQHpt6G6VzjjGJOdpLGqkqxGqtJfQfRt7mTwnz5OKRYVC2JQsDvhDFaMgpqN16dPbu9Q\nSvLHh5zhEKCmRVgCkpAtdK9NevV6Va5R4szxZYqxYlWFCyRVajpXs09lvUGK80fPzPOIsKAgKZrI\nBs7Ht09dvQ5nmk8GXGJViAhK1AzXU+vb7V5p8fM8wSFKZEWtRBXot+jq+gh5U+fhyREthDNWKSoW\nSgi+ivo7vpByPJJ8/LmEKNQBmhYVDrX1bfVUOR5MzwRksliVBSKSqtktCmYp7Lfbq9ima80nky88\nkIBUEFWIp6F+jq+oh4z5icIgKDJSwPRgM0M1DUbPTp7tX0VYVzPnyeLDMZBSkJVIaiVCxuu1evV9\nVdSkPPXzcTymY1FM1SENRKHY9mntt7FlWc68GZ86MRQhRYVk1EqEJXU9tfQ1e0Dlp4cz5+GEltiU\ngKogdT7Or6V4p8bM4oBCwoWKBXrt+lq9gcT5+Z5JMxACWwiaMqIWrHo0+pq+mKc68x8vE84SKBqF\nQzWoIXtX1NX2xTNec+dmeWEgoqxawDUaqEikKda+jq+tdEMnkTw5cZMxm0EzbAVLFOtv0rfaU8x8\nyTykLGazSKD0YUGQWt16q9ur2NCWWcD52Z5ssCJQpSEIaIQtdz36vsrZZRmzxnz8TjELCoSkKRS1\n6a+jq+ksolnCvm4nmyxYIpKUSywCBadq+hp7V3LLONfKzPJESLSFCRaWB2r7dvZfOnxsziE0ZWpY\npmqWN17NX6Vu5RizwSeKOciIUgtklM2wUNR6dPqW+hRE4V8vM8cQhSFLCsVYpK7n0tPfLqVZivFJ\n8/LnJClKXTEDQiGSkLGq9ur9C3qqCc68CeDMxBclkzbmlCFgdK+mv0DS8U+YniiEBCVY74SoaNne\nvTq+uuhZQrCeU+fmcY5xqFQgKCFBa2evV+hXYspJXGvBHjxMQBSAlAWO1e3b3L0lCzFfPjwZnOAT\nNqNAQrIqFOh6tPo2+iLLLPLXyczzwBUi0ICix6a+1b0Xyp8fM5oLGbabkLmyqTR7tX6Nu5Riz58n\nijnCSgyW1JDNFJSr6a+lq+ksquVnzpPn5YIAUAhSg7V9HT3LvNCzjXz5PJmc4VYCoIEAAAPTb9HV\n9ZZRLPNXzMzywggBZUAM1TrH0K+iu15p80+enOKSoU7YBXQ9Fey31VtUCVlPPXjy8cnOMm4pDNUy\nbjNStxuvTXv1fVFlGbPPXjjzR55LAEBogKdD16e63uWVWbPIfNzPPGTUUyC1YEFQFr0Hv1fbG5Rm\nz59fNzOUAUhSmQaB7a+wtXxp8jMgLFJViCgLXvr6Nu5RizwJ4MuRDcQyaIQUgCnfT6Wr7IsozqeK\nPmScIgABKsClN17a9+r6MrKJZ46+dJ5oSUytSxVzZhRqJVBDpXsr6dvaEoxZ4K+fmcoyQ0AQoIAb\nPbb9I7LlPnnzU4mRQ6y9I6nbT216Y3BQrnZ5zyR5Y5RghssUyKhYxpk7R6tPdXsjUolnnrwR5o5n\nM3FiGNIaipDovpr316jUolnGvmR5IzEQCwJVMhakW1o9dfSr0RZVcbPlniiRIlaRApFWWKv0NPqw\nXwJ8qSQoaiUKSNErR7tX6JuUYs8B4ZOMZrUZJQoMVqLEqnU+lq++NSiWeevkx5RENJFEJVTRY1XW\nvbb7o6wlVxs+YnkjMIzVLAlZWGpM1uM25rR6K+oeyLKJZwr50eKTBADRlRE1EtzWpKvtr651lynh\nPj1yqxD/xAAnEAACAgEEAgMBAQEBAQEAAAAAAQIREgMQIDATUDFAYCFwgKCQwP/aAAgBAQABBQL/\nAPekP/xUXyssssvpf+goXJ70UV/lVlll732La+pj/wAlssssssssv6Fllll7rdj3SMSh/wCPWWWX\n9W974WWWZFjeyFsyXCv3652WWX9Cyyyyy/q2WWWXwsvghMsbG9kJGI0P9zRW64Peyy+2+my/RJmR\nkXtEWzHskYmI1+uordC3e1llll/Tv1l8ExMyGx7RKGiQ96K/R0VwW73TLLG97LL+tZfRZfpLLMi9\nkRZY2Se8UJDRJD/QIooe6YmWNj2sssv71ll9Nll+kTMjIb2REQyQ90jEaHwor8VXFIxGuERbMe1m\nRkWX+VsvgmKQ5De6IlEiWyEjEcR70V7+it0JGI0PZEdmPdMUjIbL3ssv83ZZZe6IsyJSG9okdpEt\nooURxJb0UV7Sit0JGJJbIjtIlsmRZkNje9lll/p7FIyHIvZMjIzJSGxEBMkyWyIxMSSHshRMRrei\nivvUVukYjiPeKMRxHtEi9pDLFIyHIb2sUjIyL/X3xsyL2sUjMcxvaJDaY9okUNExiIxMCS2SFAcR\niFEwGtkhQHEYhRMRrZIURxGIUTEa2ijElEe0BIkiWyICJEtkxSMxyL2syLL4WX+6ssvdMjMzJSG9\nosjIcyctokCyb2gImSIkBk9oCRMkIgUT2gIkSEQ2ntARIltFikSkSe8ZGY5je9ll/wCFWWZF72KR\nmN7JkZnkJSLISFMlMbEyMxzJS2hIUyUxsTIyMyUtosUyUxsTIyMyUixSMxzG9rMjIveyyy/8Wsvh\nZZe1mRkWWZGRe1mRlumZF7WZGRZZkZF7WWXxv/1LLd/6Kiyy/wD4erdj/wBFsv8AML9fZf6Ov+an\n/wBQr2L/AMOQtnzviivd0P8AeIQ2PsWz+vX3aHyfOiv2tl9qZfah9K2f20IY+tCGP/ELL6rH9yxv\ntTL/AF1l/wDeF/8AnkrnW9FFFFcK/wAMooornRRRXGiiiiiiiiiv8noooornRRRRRRRRRRRRRRRR\nRRRRW9FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF\nFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFbUUUUUUVtRRRRRRRRXqKK9vW1FFFFFFFFFb0VvRR\nRRRRRRRRRRRW9f4fX36KK4UUUVxooroooooooooooooooooooooooooooooooooooooooooooooo\noooooooooooooooooooooooooooooxKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK+/RXoa9bW\n1FFbUUVvW9FcqKKKKKKKKKKKKKKK+nRRXvaK/DP0NFejor3FFekr0iH6FbNekoor2VFFekor0i2f\nZX1ls0VxrvruvaiivW0YlbWWXxr7L4KJQ3yrprvXJbS4IfJbPm+aKK5JiGhri+S2fFbNdFDXKy9s\nSivT0YmO1mRfOy+m+d9F7pCjs3zvpvnfdHaXZZfKy+i+hMTGhx67530302ZbUYleioxFEosci/Sq\nIkNjfpojH6VMiyiUfS2KReziOJX3cRRMdshyL9KkRifBKRfp4Eh+mTIyPklEa9NkKW2I4FfYxFAx\n2yHIv06iKI3Q5eoRAkP06ZGR8kojXp7FMUihwHEr6VCiKO1jmZF+nojAqiUhy7L+6iJP1KZGRdji\nNeosUhSPkcRwK7UhQFAoscxyL9SokYnwSkP1URE/VxkJjQ4+qUhTLKHAcSulQFHZyHMyL9VGIlQ5\nDl6yIjU9ZFiY0Sj6uxTFI/jMBwGueQ5mXrEiMT4JSG/Ww2n61SIyPklEr1dikKZZQ4GPG/WqIojd\nEpevhtP1yIy2lEa9amKYpH8Y4jiV61IjE+ByHL2EBk/XojLaURx9epCltiOHq1EjE+CUhvjRXqkQ\nJEuh9dfejLZolHi9qK7qKK+xkKZl1JGJXVRXVRiVySIwEqGxy5KJjs+pRKH0JCiUPqSKHyREkPkh\nRHEfQhIxJR6IlDiNdKEUOI1yjITGiUeSKMTEa61tQ4ldCKHEa3sssssW1DW2XNFCjtY5F8qFHazI\nvnRjtY3xUSMT4JTHLikJbOQ5dKQls2N80hLZsb6VtJ84kSY973QmMfQiLLGS5ojLZofSmJ7NDXKM\nhPaUSuFikJ7NDiVxrimKWzQ4lcrFITKHEa5WKQpHyOI1zTMjIvpsyLL6bHIvlGIojdEpckWZDfWm\nZGXTZkZF9Vlj5wETHzyMuqzIyG+hMzMxvqTFIyLHyUiMtpRHwsyFMzMhssssssvjYpmRkMfNMUjI\nfSmZF+lSIwPglIlL20NtT2yZGW0ojj+RURRPglIb9vDbU+vfoEyMtnElH8ckRgJUOQ5e509tT3CZ\nGQmNEo/jFEjE+CUxy9yiAyfubIzE7GiURr3V9yRGAlQ2SmN+6iRGT93GQntKI1+GUSMD4JSHL3kS\nJIl7yMhS2lEa/BojAUT4JzHIv1Vl/RgIn8SZfu7FIjLZxJR7b9TfWokYFDkSmNle909tQfXf3qMT\nAwMDAxMTExMTExMTEoorgpEZ7NEoj6KK9jZZe0YkY7SkSkX7/S21R+oszPIKZmeQzMzMzMzMzMjI\nyR/DEwPGPTHAoTohMTGiUBrZQPGeMwMCiijExMTExMSvt0YmJiYmBgYHjPGYGBiOJW0UQgJDdEpj\ne9FGJiYmJiYmJiYlFey0ttUfuI2Q4UTQxMhMTvacBKnHhMyMjIyMjMzMjJH8MUYD0xwK+smZGRkZ\nmRkWJiKKKRJIkhQsjDZyJOzFmB4zxmKP4fwtFmRkZFlo/hSMDxnjHAa+nRX2Uae2r7ahQFpihwyH\nMlLatoTIy2lEuhTL2cbJaY4FcrLFMWoKSP4xwHpj0xxK7VxSMTAwPGeM8ZgUZGZ5DyF2KAo7NlWK\nBiUN0OZKZkXzssjIjvROJXrI/MPhmp7OhQFpigVvY5ktQczIvjGRGW0ojVCmLUFLZxHpj0xxK55C\n1BagpWVY4D0xwK+gmZGZmKZF70OJNVtGNkYFDZdiXCUqJy7YRFwmP1kPmPwzU9fRiKAtMUCuLkOQ\n7KMTEooooraLZF7SjZKB8CmLUFqGR/CkOA9McDEorimyEt3ElpklXRW9FFFFFGJgR0xKt8hzJOyM\nCMdpTLtxXHU7MSMCMa4ORKffX3tMRL4n8+tURREkfzayyyy9qMUYoxRijFGKMUYoxRijFGKEXs0T\ngNbWZi1DyHkMzJH8KRijAwMDxnjFGtrLHIm+jAwMDExMTFGKKR/C0ZGY9Q8g5itkYCVDZOY5WRZG\nZfCUbHpmBgYmJiYiiYHjFAUdrMhzHqDkWWWX9Z/U0tp/E/n1iZmeQ8h5DyHkPIeQ8h5DyHkPIeQ8\nh5DyHkMzMzPIeQ8h5DyEdQTGicCUeVmRkZmZmZnkPIeQ8p5TyHkHMvo8h5DMzMzMzPIZmZkZF7Ij\nAjDaUqJag5FlmQpnkPIeQ8hmZItFo/h/D+FoyRmjyHkPKeQzL5LnfokaW2p8S/EJkJie04Eo+kvj\nFEYCjtKZKV9NlllmRZZkWWWX22XtZZZZfoUae2oP2lFfVjMjLaUSUPTxgRhs2SmOX3b9bH50/g1R\n/irIzIy2lGycB72WWWX9xIjAjHaUiUx/Vvay/oUUV6GHzD4NZj7rL97GVEJ7NE4DXoKIwIwEiycy\nUy/uv1+n8x+Ga34K+yMiExMaJwJR+3Ze1EdMjGtnKieoN918rLL9xpCGav49SITE9pwJRr617veM\nSMBLaUyU/VLnZZf3dERL41Pn8fFkNQUr2nCyUKH9a9kRgRhs3RLUHK/yOitp/E/n8gmQ1CMr2lGy\nemNfWirIaYo1tKdE9Qv2dC+6jR21Pifz+ShMhO9nGyemNV9OiMLIaZRZOZOV/k4/Ol8Gr8S+fpV+\nBhOiGps0T0yUa+jRGAo7OVE9Qk72r8lp/MPg1viXz+UjKjT1BPaemShXdW0YCW0p0Tn+W0vmPwax\nL8tGVGnqCd7ThZOFfQbJTJS/L6IttYf5dOjT1CMr2lGyemNb0V0uROY300UUV6eihr6dFFd2iIZr\nPhXVRQ19GivU1tXYiEyMr2lGzU0xqt7L6JTG+hIUTAwMBwGvo0KB4zxmA49yRGB4zxjgYEkPuQkK\nB4zxjgNb0VzRorZmt88XySFA8ZgSj9BIUDxnjPGOPdFCgeM8Z4xx+ihRMDxnjHpjiV1WQ1CE72aN\nTTJRrsfNEYkYlFFEyTH3UKJGAomJiNExvsSIRIxK2aJE33xRGIolDRIl1xNH4JfGr89cCKKKJoku\n+BBFFDRNEu2BpooxHEnEa+giDIlFGJKI4jXXCdENS9mjU0yUK+ikRiRjwkajH3IiiMBR4TJj64kI\nkY8GajJd0SCIrdmoxvrj86XwT+NT564IjvJE0PugQ3aJomu2Jpi2olEnHnXVEgxbtE4kl12RnRp6\ngntPTsnp13UKJCBGPGZMfdEhES4MmyXZBEFxmybH3RNNC3maj7NP5h8Gp8T+epGmLdkx9qIEOEjU\nXbE0xbtGpEa+giDI8GjUQ+yMqNPVE72lCzU0xrrQokYCjxbJsk+5IhEiuMpE5DfUhIhES4NmpIbL\n7UQRBcNRk+zS+Y/Bq/EvnguSNMW7NQfaiBDhI1EPsiaYuEkTQ+my+UGQlxmia6a4RdGnqEZXtKNm\nppjVcr3RGJGIlxbJSJSG+1EYkI8ZSJTJPrSIxIrgyciTH3RRCIt2arJdmiLbWH89SNMW7Jku6Jpv\ngzURLsRCRGXHURLueyZCRF8GakRrtTNPVIzvZqzU0iUa4oQkRRFCXFskyTG+t7IiiCFwmychsfUi\nKIIXCRqPvRAhwkaj7dAW2sPrRpi3ZqDH2xNMXCZqdsSDI8Jkx9r3gQfGSNRD7bNKZF7NGrAmv7v/\nAP/EAB4RAAICAwEBAQEAAAAAAAAAAAERACBQYHAQMNDg/9oACAEDAQE/Afwyd86f0fO3H447uPmj\njj+bjjjjj5eMs+Gqojzh4KPDV5t2W9qoMcOijw7yPDpjqtwEUNHHqLjqotjUVQY9dGyDbDq5s9qd\nR4aLRzV7u7GqzQs+DjLnjDwp/io//8QAIxEAAwEAAgIDAQADAQAAAAAAAAERECBQMGACQHASgJDA\n0P/aAAgBAgEBPwH/AMP4hP1a/lk+8vyiE++tpS/oEITXwX6Ix6tpS/oEITXqFtL71CE9EZCCWvVw\npfzuE4PVrKUXt0J6jCcHq4UpfVqXg9XCEJ65CcXiFrZS8KX0C8aXWPVwhCe0NEEuDxayl756teIW\nshBe3zi0QS14ha2UXCl6S8aXgyl16thCcYT3uE4PFweLWyi2l2l4Uu0vCl2l1lE9eIWvELYQn4XC\ncWiC14seLXix4teLHiFjxY8QsZCC4Qn47OEJrROEEtaILGQS1ogthP8AujKX79KUpSlKUpS7SlKX\nwX1i/wCuSbS9LekWP0m9bCbelmX698yx+Sl536F81+1dnSQm0vSwhS9MsfS0TxrpqXIT70ITKUvT\nJY31CH1CeNdPS5CfZhCZSl6eExvqUPqU8a6ilLkJ9OEJlKXqUsbL1KEPqk8aGuppchCeWEITKUvU\nwSxvq0I+XVplGhrqqXIQnihMpS9WkQbG+sWfLrExPGuspcg0TnSl6yCWNl63458utTE8a62lyEJx\nvWpEKN9f8c+XXUTxonXXYQhOsgljY32HxGPr0J40Tr6XITq0hLGy9j8Rj7FPWuU2E4QnghPr0pS+\nKEJ4oTxQhOaRBsb5QmPxQnhhCD8UIPkhDHyRCeKEJ4EQhPHCc7rWzhCE8E+lPHCeKEylLzmUvghM\npeKQljfKEyl8MJjZea1vxLG+aEPmsfiWMfgWMfiuQnJMWTlfvQnihPBSl8VL4qUvJIhRvnSl8dKX\nxUvjpfB8c+XgpfHS+Kl8lKXmmXjdpSl9LgljY323xz5dtRPGMuXKUpSlylKUpSlKUvOl43wUvSpC\nWN9x8c+Xb0Txoa8FKXhSl40pcpSlKUpSlKUpSlLlL0UEso33Pxx9ynkGvTEhLGy90sfdJ616UkTG\n+7Qhj7tMTxofo0EsbG+8Qhj7xMTxoa9ESJjffLGPvaJ40NegpCWUb79Y+qhD+T+SEIQhD+SEIQhO\nSeNDXeTUhLGy+gLH1dKUpSlKUpSl2H8n8n8kJietbD+T+T+SEIQhCEIQn3IQhCEIQhCE4pExvlCE\nIQhCEJ2ax90uL1PWicXwpSlLsIQn2KXaUvhmUuQhCcLlKUuwhCdesfbwhOFKN8Ey5MvCE8FKXYQn\n1YQhCH8kJlKXJxhNpS+GifFrrULH2cP5P5JxpS80xPJlKXIQhPDS7CE+lSlLxmwS8LflS4vrVr7C\nEITlS+Ra1lKUuQhCEJyonwn0YQhONyEyl5PypCXCjfWrX10J44QhCEIQhCE4tcaUpeMIQhOT8EIQ\nhCE40pSlxLaPE+MIQhCEIQhD+ScKUvXLGPrqUpSlKUpSlKUpSlKUpSlKUuteGlKUpSlKUpS+GlKU\npSlKUvGE28aUpSl8NKUpS9isfpSetdWlrZfNSlL3Kx+lp7Brp4Ja36YsfpifBrpZwvp79RnRzb6i\n/Umvc16tCfdm0vVPqX+kP/Pufo84X9Gv6Pf1GEIQn1IQn0IQnaz2Zcn+gzk+qf1X9xezTm/rP6j9\nFXJ9Kvx1cn6RCfoj+wvw5dF//8QAFBABAAAAAAAAAAAAAAAAAAAA4P/aAAgBAQAGPwJzwf/EACQQ\nAAMBAQADAQEBAQEAAwEAAAABERAgITAxQFBwYEFRgJCg/9oACAEBAAE/If8A+WqE/own/wCUa/8A\nsiv+ihCE/wDpRCf/AJYT/op/0E5hP9DhCEJk/wBChCf6LCf6NCf6PP8AR5/o8/dP80nT/wBChCE1\nr/R4Qa/0hoa/0mf59P8AUX/oM7fD/wA8hCEJw+Wv8+hBrXzCf6A1j6aIQhP8+fE7hCf50x+5r/ST\nX+cvH7mv84hBoa2EIQnb/wA4g0NEEiEIQg0Pl/pn+OLhjxIhCEGhoa/yNfgpSlKXKUpRsbELloaG\nP/HJ1SlL62ylxSlLj4FiiF2YyEJ/i6Fj5pSlKXmlKNjZSlKUpRsbKUpRPDC4epqw0P8AxCE5pSl5\npS5SlKUuGHhS4pSlGylKXEMJiCZSjY3iEiCZeQhP8KQiDHlKUpSlKUpSlKUvAYfIKUpSlKUpS4hM\nogsGGKUYTKMOMS0MoP8AwJCRCahMo2NjZSlKUpSlKUpSl5BsbKUpSl4pSlLtKIUTxSjeEFk+JUgg\ng8mGv+6hMWEQYylFgwxSlKUpSlKUpSl7AbGylKUQsZSlKXaUvIMUpdKNlH6hJwlNhP8As0JYYaxh\nMo2MNl4FKUpSlKUpS4pSlKUpdLxRCZSjZeKUpSlKUpSlKXLlE9TDC9DiDwP/AKxIWDXI8NiCzZYp\nSlKUpSlKUpSlKXFKUpSlKUpSjZSlKUvNKUpSlKUpSlylLlLilE+ZbCEFgTSQiy0P/oEhYNYspDQg\nxPS8DZeBSlKUpSlKUpSlKUpSl0pdbKXS9UpSlKUu0pSlLlKUpSlKUpSiCyZo2C2jYvQKIQn/AC04\nQogwoxPYeJiixZYpSlKUpSlKUpSlKUpSlKUpSlLwKUpSlKXgUu0pSl6pSlKUpSl27SlKUTxReWjD\njDD6SK5iJqWX/wASSw1q4C8TGGGxxiiCwZYpSlKUpSlKUpSlKUpSlKUpSlKUpSlKXmlLlKUpcWPK\nUTKUpSlKUpSlKUpSlKUvNLpSiZPVuN7U+BNIXzITEhFlr+6hYtdNptCC5YnqPKxS8ClKUpSlKUpS\nlKUpSlKUpS8UpSl/FRMo3zSlKXilKUpSlKUu0uUpSlKUouGomPyiuv8A5simkkHixfCE/kzlLDwh\nc3gfUXoXNl5alKUpSlKUpSlKUpSlKUpSlKUpSlKNlL6L776qUpeaUpSlLl2lKUpSlKUpSlKLgRi9\nSRhhEEQcYtKD8SekpYZmPFi9QmwnEJxOITYTUsvVBZEmIoLxyWY2DfgcYXK1RaLDFKUpSlKUpSlK\nUpSlKUpSlKUpS90pf30vtvNKUpSlKUpSlKUpSlKUuKUomLJmiEhZrlHGQ2oOPxkQU+hCx8ExryXw\nmJBC4/AnlsJiQQsMyy2MhBCwzPKC8SAsEIImljDDKDIcumxYYosmWKUulKUpSlKUpSlKUpSlKUpS\nlKX8V9z/AArHxSl7pSlKUpSlKUpSlKUpSlKUpSlKUvDpSRAfiVwun4Cg35G8joaTJvzlVBFD7PoV\nCKZ/9FFQRQ+j7EQ0gp/7hVBVD6PsRDSmP/RhlB0MJkzx6jYmQFmuUurFKUpSlKUpSlKUpSlKUpSl\nKUpSlKUpfei/jf4aUvoXdKUpSlKUpSlKUpSlKUpSlKUpSlKUuFkxSiERipcID8Cp9EDwli7PMSPC\nWL5IHhLHmPITH4Fi+SZ4imXkJj8Cw/IkI2KFEUWWKUXDUpSlKUpSlKUpSlKUpSlKUpSlKUpS+ql4\nX4J/ARR9UvdKUpSlKUpSlKUpSlKUpSlKUpSlKUpSl0pS7sUU5dDCCjLNEUXRRMjl2UQQYeCxZurN\nKUuKUpSlKUpSlKUpSlKUpSlKUpcpSlKUpS/wYQn8Cl1Y+L6KUpSlKUpS5dpSlKUpSlKUpSlKUpSl\nKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpS/lX40QhP4lKXFzS6+\n6X10pSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpS\nl/Cic38SFjH/AB6XFj4v67tKUpeLxfdSlKUpSlKUpSlKUpSlKUpSlKUpSlKUv6KXl6mX86EyjH/K\npS4hj7f9KlKUpSlKUpSlKUpSl6uUv51xeJqKP9lLj/nUuof9qlKUpf4y9CJiKP8AoQn8SjeLH63/\nAMo+kQeJl2/z0JEINE/jXVjyf8zMQh4mX+qhCEhoaH/Ku0eLIT0v+zPbNWPKX+ymMJjYw2Uv85eh\nD/srudPExvi/3UNhhh/0UUbLl1/2Vj1cvL/OSEiEx++8JlKX/sVtGUpRMTGX+ghCRBoY/wAlKUv9\nBe6E/tX+jRPC0w/x0u0pf7aEiD969iJ+CE9qH/QQmLBsbL/yxj6hCEJyvYthBZCehCQ0P+9dGxvb\n/Zf6kN9QhCYaGifihCZCE7Qhj/vUpS/uTL+a9QaH/ASJqRCDQ0P8M5g/+Gpdpf3Uv60J4f70Lhax\nj/KhoaH/AA0T/oKUo/wz3oXTGP3IXSxof8JCRB83/m76UJEGu08D4hOkTELpj96Fj9ae2fhQij/W\nmX/jiDWHynhvUJhrlF2l4o36IT0Io30x6sfUJwsJ0iE9CKUv66Uv/DQg+GGwYvV4WWN6KUomIaGP\n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\nQS1lE8LaX9DXwWQhCEIQhCEIQhCEIQQQhCEIQhMhCdNEGhohBIhBoaIJCCGPBBP9BspS6xkEhISI\nQhCEIQhCEIQhCEIJEIQhOoQhOYNEGiEEhIg0PBBLTZRMYWUpf91S6x4hEIQgkJEIQhCEIQhCEIQh\nCEIQSJ08XhMhCEIQSIQhCExBCCQmNjwQT2l/2bGyiYnjQ0QSEhIhCEIQhCEIQhCEIQhCEITzntCE\n2bNaHiglp8jYwgn/AK1lKJ4x4hCRB4IJEIQhCEIQhCEIQhCEJ5Uv4CExiD0EhjDYmMLG9E/9C2Uo\nnjGNlEIaGiCQkJEIQhCEIQhCEIQhPlvNL9kHgljEGhIQQxhhBhbSl/y14Y2NiYmIg0NEEhIg1okQ\nhCEIQhP8M0MIJYxBoSwteKCe0pf8TSl1jeEFjEGsQRBoeCCRCEIQhP8AJtDCCWsYo2m9CCy4Qv51\njeE8Y3hBPgonqDQwggkQhCEJ/m4Th8AWPgWMMIJ7Sl/HXlspdYbKMIfQaEwghMhCE/1Ewlr4AtNC\naehuHgnxfivFLtLreE9bGEE8YwwgnpogghoeCCWtYQS/2sJrWFp8KxjCY3IbGxhaYQTxsYWmEU8b\nGUExseKeMPAnpsbTw+BoeC1CE/QzxS14IJjEJwN4QxhPgbGEMYTH02Nh4T2o1wIMIJrQygl+loTh\nrCWNDC4CCWNDwLgJiDwJD0JjVGUFsJ+sJzOITYT/AIXUv/X9S/lKUv6tpflpS/rClL/xepSl/wAZ\nSly80pf0Pfw1L8FKUpS7Sl/Q1KXzv56/5WlLxdpS/iKUpf8AA0v+LvlSlKUpfa/TSlL/AIm/n6X8\nHS/Tfyl/CUv+guX0pSl/O36qX9A0pf8ABz6Z+n6UvrCD9KX8Nf0A/R9IpfG/Bfhpf0S/O8vaX6b5\nL85S/wCepfwV86XyX6Oer8EvKl/36/xK/cT/AGQ//OzS7S7dpSl6pf0feqUpSlKUpSlKUpSlKUpS\nlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpS/6alKUpSlKUpSlKUpSlKU\npSlKUpSlKUpSlKUpSlKUpSlL99ylKUvdKUpSlKUpSlKUpSlKXwvFKUpSl2lKUpSlKUpSlKUpSlKU\npSlKUpSlKUpSl+ylKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSl\nKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKXaUpSlKUpSlKUpSlKUpSlKUvz\n0pSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSl9qUpSlKUpSlKUpSlKUpSlKUpSlK\nUpSlKUpSl8aUpSlKX8nfO9X5qUpSlKUpSlKUpSlKXKUpeaUpSlKXKUpcpSlKUpSlKUpSlLzeLlKI\nm0pSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpdKUpSlKUpSlKUpSlKUpSlKUpSl9QAKXoF\nKUpSlxSlKUpSlKUu3ml8qUvjdvNKUpSlKUpSlKUpSlKUpcpSlLtKUuUTw2UpSlKUpSlKUpSlKUpS\nlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpSlKUpe77UpSlKUpSlKUpSly83KUpfqpe6XwpS\n+NKXilKUpSlKXKXKUpdpe6XllKUvVLxS5SlylKUpSlKUvFKUpSlKUpSlKUpSlKUpSlKUpSlL4Uvd\n7pSlKUpSlKUvwUvF2EylLzfrmX8BcQ/ivunk9KUpSlKUpS+NKUuzulL4Uu0u0pSlLtKX4EiEKUpf\nwCQkNjZfC/ShIf4JMQ0MpS80pfO+VylLkJ9V8qUvcEJjDF4SJj6SIPlISGPpD4SP6GLyll6SIPlI\nSHB8oQx9l1D6QkNcoQ10hY10mJjQ1qEPpEHysay5coiDylKUQTyE6pcpeL434YIISDYxS9Upe6Xq\nlL3S4kIP+Bi80pS9Uo2UpSlxe6Xi6bil5pdLzcXqlKXmiCY0NZSlLzcXmlL3Sl8KIJkGGvalKUpf\ndIQQiRUMMX8IgoHA/ZS/Be1H/XmvhS5Sl87lFgauD+a+yYghExhifZBBFIipDLLF2l/AJYfwsW9v\n4X/Qb/AUpeE5hLi1O73fGl9KUQQqYww188EEUf4Q4GWL+CvCoUDcwvpfrQuX9d9E8f7xan4N7RBF\nIyJjLE+JBFGJDRDLDfnPhnmliklg/BOYT7m/K/cninShDKUomXKUvw31ogh/DGHlCcrsiikQ2kMs\nsX2vF+B9Ksali3+ApfC4/phlL7X6biqKYtdXaUvlPK+NEEU0yGMsTxRSH8IZZYb8qX4aXm5eKJYq\nCGF8KUvFKXaXyvleK/oYf2QnS8Sg1cWvjpfmTEUP4Y/EmoyxfR8UvwLyVY/wsXX41D/4N9S2/BAo\n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\nLLLO5BBJ/q34bbbzbbfoyyyyyyyyyyyyyyyzqWWWWWWWWWWWWWWWWWQWfEMsss6WfRllllkk2WdG\nI+L1skmfo3ufUyfZlkRzLLLLLLJ+IQWWWQQQR8c+ZHH79/153LLLLLLLLOZZZZZZ3PhlllnMssss\nssggssskssssss4fA+GcyyyySTmWWcPhlnXrM8O7zbYftSz6Mssssg+OWWWWTJzLIILLIhAg+e22\n222w222/5D/KfDLLLLLLLLLLLO5ZZZZZZZzLLO5zLLLII4TPxyz68s+KWWWWWWfQ9eZJEz8j7cks\nss4cyyyyyyyz55ZZZZERERBZZ8WWW22W3uw2/wCDLILP9uWWWWWWcyyyyyyyyyyyyyyyyzuWWQWR\n9WWfZlllllllllllnwzr16/Sf4cssg/xZZBBBZERZZZ8Gej8jh/gPnllllnzyz7Mssssssssssss\nssssssssssssssssss4fLLLP9WWcyyyyeP0P2Z9mWT0PnllnMssssggssggj5s/UR/gP9GWcPjll\nllnMsssssssssssssgiZZZZZZZZZ8cssssss5ncs/wBDMz9D9WcyyyyST5nHgWfEgs4yyyyyyyzo\nREdW23jM/M4f+MfM+nLLLLLLLLLOMssgiEyyyyyyyyz5ZZZ8c5lllllnxyyyz7WSSSev1ncsssss\nssk+RzLIPiRHX5HwOHWbbbbZfoOn+/PhlnM+/OZZZZZZZZZ0IQxxiWWWWWWWWWWWWdyyyyzmWf7U\nkn7TmfJ+CWT0j55BEfYcI4sss222y/I6f+Flllnzz6cssssssssssssiHAOMkkkllnMss5llllll\nlllllllnxyz4v+JJJOPwyz4kfNn45ZZw+gLO5ZZ8dtth4RxZZfsIj/FkffllnM5nMs5llnxyyyyy\nyyyyyyyyITOBMlvEkss+OWWWWWWWWWWWWWfHLLLLLLJLP8TJJZZZ9BH+k+nbfgc222X7iD/AQWWf\nbn05ZzLLLLLLLOZZZZZZZZZZZZEOGCySzhxLLLPiFlllnMs+L3LLPmkn1bbbbb8kmyz6Nhh/zkfQ\n22w282222236jhER/gI/wZzPhllllllllllllllllllllllllkEdZBZJZZZFklnyO5JZZJP+FJLJ\n/wAT9ZEfHLOM/LfoPjttstvBht/wEREf4CLO59GWcyyyzmWfDLLLLOZZZZZZZZzLLLLLLIImcyCC\n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\njZPGJj4nWY4wzws4/OAksWEF6l4OF5tv2Z9efIjm222/DIIPgFqcLb3bbbbbbbbbeNth6Xks9222\n223m8Puz5JJ95LLPS3q8OZbMRbx4TBZZJ0PgT8SelkEnwOsxBJEnjphyIojDoFM3/AH+fbbbbenB\n+Hjw/HbbbbbbbbbbYYYZjCHDNttttttvD47b1+OWWWfDJJPuL4nr8N48COCWWfQRM8DbJ6fRnSCS\nzjFtts8GbLZht4Ms8IiLP3kH+fbebbbbbHAplviXBT8Nt5ttttttttsMPDFtjoW2222222Obbbbb\nbbb96fcz9OWQ5PjCz4FllllnGzgk8T9QmJZBBJJZZ8sgiNT4bb8h4H3BBZ8c+57vw22222GVn8fz\nNttttttttttttttthtttttttttt+G2xFtttttttv05JzPgk/HLPm/TllkSl4n3LII+AsSyzpZ+s2\ncEEkxmST8m14IyWfSQz9wWfHLLLPtebbbbbbbbwiMRDpFt4WW222222222222G23m22222wxJNts\nW2222229PmRM9yySH+LLLPiSzg2cCCIQh8JWJZ9gQQWRCEThjEks+Jy8cZZZZ9B9wR8Ms+vbbfgz\nbbbbbbbEc2eBGLLbbbbb89tttttthtt7ttsPBi22w2222229Obbbb0Yi/AI8bCM/J4fVllnCyDjx\nsg4ECDoegFlnc+eQQQQRAssgmCSSTuQQ2+J/x5Z8SCzucLPp22222222ebbbbbbDDwxbY4LLbbbb\nbbb1bbbbbbbbbbYbbbbbYeGLbDbbbbbbbbEfRtttvCUGS5fk8Jn5ZZ3OFnF+IhBBB0whCyyyyyz5\nhBBBZ0ht4OQknp0ksnmWWWf4ghwlnSyZ+TzbbbbbbeNtsPdtttttttttltttttttttlltttttttt\ntttttltttttthtttttttthh5vwebbbbbbEKxTx6cyCfkGx4yZ8Mg+QQQdjhE/BZJZZZZZZ8TgQT0\nnPngZmyz4D1OZZzLPmTw+Ytr1hPR4WfhtvHm222222y22wxJLbbbb8Ntllttttttttlttttttttt\ntttttm2223p8dttthhttttttlthttttt42W3jLbDeVrOeCWdIawYZ4RrhPgQvSffChjg2ylMcyyS\nySfkuQ8cPAhyGXxKeBwmT8Us+AcJ8iSyPoOxk55tttv0M22222222y2w8GLbbbbzbbZbbbbbbbbb\nbbbbbbbbbbbbbbbbbZ+Iw222/DbYYbbbbbbZbbbbbbbbePWeELw2ZeEpZeFleltbzytZwWU/BZel\nuwxCDbx4F4RZZZwxPkTjw4bDHNlKejM5fgHDienY8LCfhkOGJktvDqjixbfhv0LLbbbbbbbbLbbH\nRtttttttttttttttttttttttttttttttttttvw22222223uw2222222y222228bYeHAWWReSHIMv\nLM23gw8L33sTMvNL8dh4IcB2wJyl4R0baFnGfkPDB4DhMlw8G9Jd+BHbQsY482fmDktnhw5aFlHJ\nthjmw2222222222222222yy22222222y2222222w22222222222222222222/Hbbbbbbbbe7bbDb\nbbbbbzYbbbbbbbbbbbbYYmWHgQ4W23hgWst+O222223ksLctuHHm22wwy8wR5eeZvCGHntEyxy22\n222228GXDyjwz3bfgN5pGSMvbo8MXm2xPJIyxl7/AAFlkW22222222w222222yy2222/Fm22222L\nbbbbbbbbbbbbbbbbbbbbbbbbflttttvx2222222222G22222222222HosPDwdl4bD03m22222222\nwxG7vNttt7tsMTAtJebbbDEGfmwLecttttttsNtsMTO3lKX4nHjyzLQvJbLbbLb3bbKxLctm3eZB\nEYy2xbbbbbbDbbbbbbbLbb3bbbbZe7bFttttttttttttttttttttttvz3u/DebbbbbzbbbbbYbbb\nbbbbbbbbYYrV6DwtJm28222G222223u2w22wy222823uw9NlttthiHwEctttttttttsNsVrFt+O2\n282I6ltttttttt6ORm9eA8EXA4WImW2222G2222222W3u2222222/Dbbbbbbbbbbbbbbbbe7bbbb\n/iLbbbbbbbebbbbbbbbbbbbbbxtsdG22w22222222222222w222222222222222w222222xCFa8m\n222222222x8AZtttttttttsttstttttttttttttsttvwP4eCwxKW22222222222WW2Lbbbbbbbbb\ne7bbbbbbbbbbbbbbbb8tt+3bebbbbbbbbbbbbbbbbbbbbbbbbbbbbLbbbbbbbbbbbbbbbbbbbbbD\nbbbbbbbbbbbbbbbbbbbbbbbHWxm2w2222222222222222222222222y222222222222w2y22w2PD\nwIVq22222222222y2w2222222222922222369ttt7tv+Tebb3fhttttttttttttttttttttttttt\ntttttttttttttttttvNtttttlttttttttttt6M222G2222222222222222222222222222222222\n22222223m28bDbxtttttttttttttttttttttttttvd7vw34b9O/7Nt+e2222293m222222222922\n222222222222222Hm22222y222222222222222222222222222222xLbbbbbbbbbbbbbbbbbbbbb\nbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb8Nttt5vN/9vbfq223m22222222222222w2y22\n22222222222222222222222222222222228bbbbbbzbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\nbbbbbbbe7bbbbbbbbbbbb3f/AMBv+jbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\nbbbbYbZbbbbbbbbbbbbbbbbbbbfhtttttttvN7tttttvz23u2/8A6bfv237dt5tvdttttt7ttttv\n+vf/AF87llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll\nnMssss+nLOZ88/8A0+WWWWWdMss4yyyz/wBIAAAAAAABllllllllllllllllllllllllllllllll\nlllllllllllllllllllllllllllllllllllllllllllllllllllllllllllnMs5lnMs7llllncss\nssssssssssssssssssss5n/68AD/AP8A/wD/AP37B3//AP8A4AAyyyyyyyyyyyyyyyyyyyyyyyyy\nyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyz/3B8Pw8AP8A\n/AGWdM+Ayz5AzjOMsss+kAz/APUgAAYAAAAAf/8AwAAAABlnGWclIf8AsB+AAAMAA/8Au3/t/wD/\nAPn37v8A/f8ASL//AO3/APE4ACAgD4AhH/8Aw/8ADR//APv/AJ/6u/8A/oAZgeF+F5sTzK/XALOM\nssss4z4hlllllnDMsssssksssssssssssssnYGyyyyzmcatWWcPzDbtWrVq39cAZZZ9QAyzocDoP\n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\n"
  };

  exports.background_image_64 = images.background_image_64;

}).call(this);

},{}],45:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var images;

  images = {
    "conference_logos_64": {
      "American_Athletic_Conference.png-64": "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\ndEVYdGRhdGU6Y3JlYXRlADIwMTUtMDctMDFUMTk6MTY6MTkrMDA6MDBanrOBAAAAJXRFWHRkYXRl\nOm1vZGlmeQAyMDE1LTA3LTAxVDE5OjE2OjE5KzAwOjAwK8MLPQAAAEZ0RVh0c29mdHdhcmUASW1h\nZ2VNYWdpY2sgNi42LjktNyAyMDE0LTAzLTA2IFExNiBodHRwOi8vd3d3LmltYWdlbWFnaWNrLm9y\nZ4HTs8MAAAAYdEVYdFRodW1iOjpEb2N1bWVudDo6UGFnZXMAMaf/uy8AAAAYdEVYdFRodW1iOjpJ\nbWFnZTo6aGVpZ2h0ADQ0NSIBW4AAAAAXdEVYdFRodW1iOjpJbWFnZTo6V2lkdGgAMzAw7+QvAwAA\nABl0RVh0VGh1bWI6Ok1pbWV0eXBlAGltYWdlL3BuZz+yVk4AAAAXdEVYdFRodW1iOjpNVGltZQAx\nNDM1Nzc4MTc5rYD/sgAAABJ0RVh0VGh1bWI6OlNpemUANTM1S0JCYmGGCAAAADN0RVh0VGh1bWI6\nOlVSSQBmaWxlOi8vL3RtcC9sb2NhbGNvcHlfYzY0MDJmNWE1NzY2LTEucG5n2csgnQAAAABJRU5E\nrkJggg==\n",
      "Atlantic_Coast_Conference.png-64": "iVBORw0KGgoAAAANSUhEUgAAASwAAABWCAYAAAB1s6tmAAAABmJLR0QA/wD/AP+gvaeTAAAACXBI\nWXMAAABIAAAASABGyWs+AAAtHUlEQVR42u1dd3xUxfY/c+/u3ZrN7mbTA6kkpBBaCAkklNCLIogi\nigrIw/J7ovgU7ChWRJ8+fepDEUQEREDpPZTQQhJID+m9brK9l3vn9wfi871HUNwNhM39fj7JPzt3\n5t4zc75zzsyZMwhY3DEobWiH+NAAWP7Fieisy4bPi6vNEx1O3OPtYgwQ5Mepu3ecfAqDUdXnz05w\nW9151fUQESgldpys9CmtM0U1d5pj27ocsQ4HTnDQdCTt5EbozXZSb3KA3nj1XTwBXiJkGtCfuyVt\nqPcbRjPd9s3zU//QcxfKr4CPN0Uczen0rWy0RLV0mge2ddlj7Q4Y5GDoCMbJidAZHYTG6ACjyXPG\nvkSM9JEh3L2IpYE7A4dyKmDqiH7k4g/Oj7tQrHmrptkx0ukE4la0jRDA4Gj+sXefiL63rYsxLJ6W\n6FJ9ZQ2tEOovIr7YcyU4v1KTVFpnHGm2ojSTmYkymGmpzY4pmgaEAYBhrr0EwJ0+WDEG4HAA/ORk\n5YB+1Mdjh8q35pSp9Ic+mA0Idf91xQ110N9fSH68vTK4qNqYXNtqHGm2wmijmYk0mBhvmwPzaCfA\nb+WFPECzMQbgcgD7+RDlMaH8D9MSpTs5LBX0fvzz50tgtDiEU144/mBZrfXN1k5n0K20NLgcALEQ\nTk8bsdRwMv+7P13Pqm/PQlyoiPfPn8qGF1YbZ3WoHdNVOjrKaGL4Tvrf1tNvlQ150JTqJUKW8GBq\n97AY8ZqNK5OKNh+pw6sXjQW09nrKiuGFdcchMVLG+2xH7ciCKuPdSrV9mlpPR5qtDI/uA/Ly9kKm\n8CBq19AY0doNK6aU7M/OBZawejmWfXoGDGZH8LbjzSuKqy2LDSZGfKtnOQGPNAb6iHIznn0ZRgTx\nb7qOHaeKID5MSn2yq2LE7qyORR1dzrs0BtrPZv9PJUMeaO//YiVAgIJTGRvO/yhjuHxbh8ZmQMin\n22d2ZpVATkU9r0uLR360rWFxW6dzhkbPKK65/x4vLy5AkC/nSkKk8MM54/x+rGm2Ga9ZoCxh9VLU\ntFZAZNBwsNgtQzfsV65uVtpnWKwY3Y5B6ivjNI8eJK/UmRwg9g+5icHHAEIEFNcb+n+5u+GvlY3m\nRztUtJ/DeVXZUB9YkPAWE+aofrw9IxMkaz5/JqNoT3YJfnH+oOuWLWlogITQULhUoQ774ueaZ67U\n2RZ0qp0KJ9135CX1IkwDw/i7UuK9137813El1W0V8NjUgb/+zhJWL8Tz/zoCp0tbybmv75x7NFu7\nqkXpjL02aG81CAJAJEDnl82Jbf4pq/kPP1dY0wgADLnwveNjdhxvf6uu1Z5qtWGiLygeBgAuCRDi\nT1UOHiD6aEaaYltBldoAAHBP6vXJ6kxxA8T3D+I8/O7h8TtPdL7V1GEbYbVB35AXBqC4CPoFcK8M\niRZ9OGu034+NSrvxerMzS1i9quMMELngJ/CVeknX/6x8qrze+qxGz/jeTvOfRyFaJCCyvKf97NQf\nfvgPPfP5vhyQ+zDkA6uPzc8uNr3X2G4P8VQX5nqQiEAfGy7YMzrR56OPnkwv2nexGH++bAp8vuz6\n5T/aeR4QR0/OfrXskfxKw9tN7c5AjPuOvOTepDk2TLBzfJJ87VuLRpeo9C2g8L6+Jc8SVi/BkctF\ngEZuhr/Mi4jYcaLjndIa62yLFfNu56DFGEAiIjrjI8RFIf482H7495/ZcrwQHpwwiJj50v4H88rM\na5Vqxr9vTDYAPAogwIdb1i+As3reZMXe3Vn1FoB0uDul+13Vb48Ww7yJQZy7nr/wyKUrpjUaA61A\nfUReFBdBkC+nMCFSsGbJzIh9lU164++teRAsVdx+7D1fBZOHRpP3TQ/NOJat/76w0jLPYru9ZHXN\nIpKIOFfGDfGpGzZA/rvlc8tb4aFVl+DBt47NKKiwftBXyAoAwEtE6OMiqHXzJ/s9cOaze7b3k0ss\nmR8+fMNwhR3n82Hh5D3w6Fs5s4qqzO9r9H2DrBAC8PZC2thw6p8PTg6Yv//9mdsGR3gbV8xP+d1n\nWQvrNuOr/ZeBIG1eM1ZmLrxcYVypVNPBGPeOmCMuB4GvjJP94ISh2m8PlvzOjIlh/tuHYNn8/gP3\nn1G/0drpDOgbVgLgQF+yICpEsGbGKMWehnaT9Y/sjBRWVsPTn5fAkx+nJB44p17VpXH69oW1Ki4H\nMUF+xKX4SP77d48KPFDbarQBAIQHBf8xsmMp4/Zh9quHIDZMFHziUtfKygb7X9Q6ht9bBi3GABIx\nMo5P8nqgtF59oGrTAkCc7g3y1ZvPQnK8hP/S5zX/KK2xLHU4Pb//pF5IHxFCbUmOl/z9i2cmVhc3\nVEFiWPQfeva1jVkQEcQXfLK96cuyGtujTtrz5SXzRtqIIP7m4TGSj9c9v63ucuVqGBYddFN1sBbW\nbcCFylJIGRAHf/3HqdQ9Z5SraxodGVb71R203gSxgGgKCxQUhQeG3JCsMMaAxv4LZo4OGVXXYptj\nd3jugvEva1U4xJ9bMChKuGZ6iu/eNrXNcjPxJmfL6uDBVRcgNICfVttsv+tamIenyovPQ7hfAOdS\nfITw/XkZQQcaOyxWgPUwLHr9TdfHrmHdYrz41WloVyJq1isH7999unNjRZ19os3R+8iKJAGC/aiy\n1xYNUKYPvrF399H2HDj56VhBi9L5uMHMKDzZtVFISd3wWOG/7hnrc//ut2dsHxYjtax6JP2m6vj5\nZB28tjBU2Kx0LDRZsNxT5YUQgEJGaJPjhf+8L8N/3u63t+8aHBFkXTl/1J+uk7WwbtlMg+GxtYeA\nohjpP3bUPF9QaXpKZ2BkvfV9uRzESMTEaYVone1kwcIbfJcV7nn1KFQ06wa1KG1jaNrzrIVrVlVo\nIFUwbKDXmoXTg/Y0ddisAABJA6Jvur7iOj0otfzhRjOewjCeKS8BDzHhwdTloTGi92elBe1vU1ls\nAN9BXNh3LtXNEtYtQFZxDSAUDE/8fXPMTydVr9e1OOaaLJjqrQMVYwAvIaENCxDm3f9GGowfMqDb\nshsOVcKedw7B+GenZOhNTIA7v+m3sUgEAUAQtz5VAwIAIZ/o7BfA3TAt1ffrDx4fW/P0nAL4y4yk\nP1XfmeJ6SB8UBilP7s7QGhifnpIXSQIgdDvkhUAkQMrEKOHWySN9P3tlwbjaD9VdECiXuKV+lrB6\nGF8fzIH0BBEx6+X1E47nqt+vb3UMdToB9eZZFSEAfx9O/ehEea1a54Qfb1BWZ7DBxsOLJB9835Bh\nd7hJ8QCAQABiIbJ6i4kaIZ8s85fzzRLxrd8kIgnEiAXE3jHDRPvL6iwOAIDRCUP+dH2Hcxrgk13n\n5Z/taJ3gdLpdXhaZN6oWcLlXgvwoi1CAENxizuKQiBbzOT+lDBIeblKanAB2t5EVS1g9jFfXnwE+\nxRVP+lv2wvwK6wq1jul3jRDc77IgIAkEFhvjupKSAF4i8vyiKcM6Mwsablj2bGkbeIuouC4dPcRd\n7o2ITziC/Tgno0N5G6NCBGcfnRqiHBIRczv3HZmr/YZc7CcMY5/ZDf4yfrxa50xwRzQ7BgCxgLAH\n+3GOR/cXbIoN5597ZHL/zvjQqDteXixh3cL1KtT/FegymIIO/tD5SnWTbaHBhIU95b5JxMiUFCs+\n29JpT62ot0lcGScYAwh5hD08UJAdMvc7pmXXo92WPXC+EmaMeh4mLH9snNHE+LpH+ZB6SDT/4zlj\ng9Y9t6ais/ZgPET4R3jEuDhT3AhZn86GjOV7JpitjMwd+iz1gs5BUYKP5o4PXH+mUKn6YOkE+MCD\ndYvdJXT3elXRFQAAtPCpcSlHsw3fllRbH9cbe4asEAII8iPbxwz1fiUimL9VqXZQ7qhXLCTavMWc\n3MkjbhwjU9aogZ2nV0s61I4Mq9114hULkDE2nPf6q4sD32/X6Dvh0sMeQ1YAALlXlPDFnlxZi9Lh\nsvt8daICXXwk9+V3nwj9sE1lUO18c6bH6xdLWG7E+9vOQafeQt3zypFHj+dqv29odUxyOIHsCReQ\nw8E4PJiTm5EkXbjvvWlfVDRahhrMrgeeEgRAoIJ7ZcGU/q0p8Yobls0uU8GxvK64Li091NWEglwO\nggH9BT/+bX7YxoslTucHj0/0uPFxpqQV8irUCSqtM95VefEogNgwwdY3FkZ/f67ASL//lwl9QsdY\nwnIDjNY2mPPqEQBMKv6+reHVrHztJy1KZyTTQwueIgHhSIwS7JiYLHlw3/maI+v250m6tPaRtBui\npSkugkAFL3t03ABj8sDu46+a21Wwa/V+qGiwjtXoXYu9whggQMHpyBgu+zrzktq86tHRHjdGfjpT\nAbvfmgX1bfYJRgsjd1VevjJO45ghsq82HWmzvvhQWp/RNZawXMSPpwvBd+ZBCPRFcdsz29bnl1tf\n0ugZ755qT+5NdKUMEr776PR+T7Wr6erxw0Ihv1Ifp9LSMa7O2r/Ez2gEfDg1fvkuGDogsNuye7Mb\n4GD2/3lrjXaXL8IgCABfGXnuqbmRRfeNj/TIcVLbqoUfTuTL2jod420uus8cEiBQQZ17ZWFM2ah4\nvz6lbyxhuYAdp4tgemoQZ8bowOn7z2o2ldRYZpmtmNMTLiBJAAT7EcWpiV6Pv/dU/Dtai1m1dOZA\n2P3Wt9CltY8xWhi5q5v+CAFIvVDNoEjxlbRE/xu8Ty3klnfB4dyOgUq1czDjwsYkBgA+DzklIrQ/\ncu5Bc2m1yiPHypkiJWQVqgdpDI5BrkwsGAB4FLIHyLlHvCVf2ueMjuxTOscS1p/EA6v3QGl9l/Du\nFdnLzhboNzS10UlOZ8+ELAj4iI4J5R+ePspnYVOL8KejORWO1x8aC2qtCXIr3hbUtppH2OzY5SAl\nkgDwk/OKXluQrkqO6j6dzMl8Eja++C3UtVrHaQ20wqWGMYCvlNOZNliR/8z9A2D5vCSPGys1re2w\n5537oaLRkqHRu7g7iAG8xWSjn4I8+8jqVAjw9e5TescS1k0TiAUA5kOQQhq6+7Tm44slxtXtKsa/\np+LzZBLClBjF/3jeZL9FTsZ5uWDTOHj1oekAAHC8oAW+PlAf1NbliHd1/eqXQ6oOhYw8g0Z9SRM8\nXrdlOzQmOHb5NUmz0jbRascu6R9BAEi9iItTR/pVJYTLPHLMbDtRCxuPZnm1q6xpDofr7nOADydv\nzZOJLfPGR/U5/WMJ6yaQVVwJAHzir58uGXfofOf3pTX2JWYrFvVE+DWBAIJ8OU0TRng/v3LBgFUy\nkaB9w4ppvwbjYSeGnPIuaFPZhpmtVwNSXYWXiFBGBQsvL54dCTOSu3c1sopa4URe10Cl2pHokjuI\nAYR8xIT4U8fSlpw0PTxloOdNcIwJsks74UKRJkGpcQ5iXHQH+TxkFwpgb9i9R601TVqWsFhcHx/8\ncAFaukz8aSv2L9h9SrWxstGe5qSx2+WHAYBDAhPVn5s1aaT3gh1vjv1KJCTMT88Z/h/l3t6WDWUb\nFxB1zY7RZiu4nJ0UIQCRABUnRolrQnxF3ZbbsLcAvvyqEs4Vq5LUetrlzAwyCalMjPK++MR9UcDn\n8D1u3Gw+Wgv73/sBWrvsE01m7Oeq+6zw5rSPTvQpfGRqP1g2dwRLWCz+a/2h8yL83yengca0/xe7\nmt++WGL6Z4vSGcYw7m8LA4BIgEzRobyvxifJFny7rjTrQE4dM2V43P+UpWkMH++66Gex4nR3nEnj\nchAE+vDzHps6zzQtqfvsj1qbHQ5vHiPqUDsm2eyuETZBAPjJOfmThvtWJIRLPXL8qIxW+O743yRV\nTeZUq4vrjCQB4O/DvbR4Znjd6ISAPqmP7NGcG+B0UR1E+obD0g9PDPp2f+ebTe2Ou81WTPbEwWWE\nAHylRHtilPjD9KHUlzlXdGaoew5mjuzm3QqV4CfjxWgMTpdDwTEGEAmQOSpEkGt9Yi2kDgrvtmxh\ntRaqWwxRBhMe6crZQQwAQh7CIb684xlD/27MKVnlkWPoSr0GFN6CwSYLuCYvDCAUEkxoAD8zJuNn\nCy79CzzUB3WStbC6wdofs8DH20re/8ah2cdzVVurm+yze4KsMAbgkAiCfLl5Y4d5Lf7qxbhPhDy+\n+cB793b7TG2zEk5+vAzau5xjjGYsdcc7eYlQvZ+czE+J6353ENN22PRKNpTWGlI1etrP1d0uqYTo\niAwRnF6ydi4kJ4R43BjacKQEvnolDy6UqkeodLTLZwelXkRrdD9R1pNLEwCRwj6plyxh/Q+BYFj8\n4X4Q8LmSZZ9UPnc8R/dFfasjoScSrWEMIBIiZ0IU/+c54/wWZRejQ1qLhn5h3pgbPneysA2OXz7i\nZTA5xzpp1/cnSRIgUMEvfWlBrHJIVPfHcTZlVsCFKw+KjGa4y+bApKvuoELKuTxlpH9F2qBAjxxL\nXWoT/Hh0uqS1yz7BZsfI1T7ylXHy7kn3rx7YX9Jn9ZMlrP8iK4QQcEmq/6b97Z/llplWa/RMAO6h\nmAVfOWlIiuW9++CkgKUSIaekcdc0GBY2/Hff8WRBG+w/3xHR1uWIcXUt7ZedJxwawM+WCpfbxg/t\nfsNx79kG+HxXVVhThy3e1XZ5FML+cu7xKSN2GR0045Hj6UqDDs4UqAcajDjZ5eBaCtHBvrzjyfGb\nLSMGBvZZHWUJ6xcczbsCAGbiwbeOjMnM0W0uqLQsMBihR7atCAIgLIhbk5Eke/qdpXHv+cn5XW8v\nGf2H8gfty66CXSdbobbVNMJgZlwfuVeP43SIBPj0nFXzISLw+i7hd0cK4acf66FFaR9lMDMhrp6F\nk4iIjrAA0Zn7XkuGJdMTPW48NTYqYeOLF6CoRp+i1jvlLrvPXkRbVIjg9NI1aTDKA91nlrBuAv/Y\nlQtGMxbe98appafzdZtrmx1jnE4geibRHjhjwqijk5NlD/7w+qTvOITQ+ujkoX+4jtpmPZiPLUK1\nLebhFhtDuiOcQSYhKwcPkNQMj+7+XJrVAXBx70R+h9o5yWZ3hztIXJ4xWlGemiAHhDxvGG46XQXb\nTs8QdqgdE+0OcHk31UdK5s0e41+TGhfQp3W1TxPW6dIiePido2CwWAM+2Fb+5olcw0etSmf/nnIB\nxUKkjw3nf3pXuvTRdd9fzsmvq8cpcf1vqo7yJjU8/ekx/y4tneSO0AouByDYl7r8zOxUXdoNtsqz\nClvgm32NESqtc6Sr7VJcBApvXuas1APGe5PDPXJpIbdcBYfOdw1Q6ehhLrvPXET7yaijY6YftTCA\n+7LK9l3Cen9LFsx7owGkXpzh2491biistC5X65geS7Tn70M2jRsueemBCUGvNLTa2qFgBQyLuHll\nLao2QbuKGWqxwUB3ZGfg85BVLuGeCXtgK5YKrp//r6CqDb5fVwG1LbbRehMT5Ko76O0F7VH9qdP3\nvJoAoaG+Hje2vjlYCHs/LYVWpW2s0YwDXXafxWR7qL/o3LzH4uCx6UNYwupr+HjnOZiSquCMHEDO\n+flU17fl9dZpFmvPJNrjchCEB3POjh0meWTfe2lfSmW09YdVM/5UfV/uuQTnv1gPDe3mEWYLI3bH\n+8olZOvAUFHx3aMDYHD09QNGT+Q3QV7mdH6H2jHZZscuxe4hBOAt4uZnDJVVDI6QeuT4cjIMHDo9\nXdimckxwR3Ct3BvlzB4nrx4W03d3B/skYWGMYcyybdClc3it+Lz6pfPF+nUtSmeCk+6ZkAUvEbIl\nRAq23J8R+JjVhk4BIPz4tD+fnK5TZ4NvDr8h1RmZce642pwgAIQCyJ01RtEYFuDVbbnSeh18e6gl\nXKV1Jrvq3vB5gAN8iMyHJm4yDgz2zMPOZ4raYc8pZbQ73HaKixi5hDo+c+El84q7vKGvo88QltHa\nBQghGBYdEHXwvOrzc4Wml7s0jKJHXEAA8JESHUNjRK8tmRX4V6GAqNzz7lRAyLUZsqbFDLllhgE6\nIzPIHetsFAeBn1SYNzLtlO25GdfPf2XWquCb9eVQ3WRO0xroIHD1ggs+0RHkR52a+fIkmD9lkMeN\ns/NFdbBldQHUtFjTDS7e0/hL3vbWyBDq7D33+QMSx7GE1Rc+8ujlChDxhMSc1/eOOXBOtaWkxrbA\nbMU9ErJAkgABvuSlkQmCRVtWDftYzONrX3vY9ZS/RgsNm9ZegNpWY5Le5HQ5avqqBUjoYsNEl+9a\nEgpIFHrdctvONUN55kx+u8ox2WrHHFeaRQhA5kXmZwxTVIyO98zdrktVKjiTN0fUoXJMtLrBHQz2\npYofmBhSkxqrABZ94Czh2h3ZYLDYRVNXZC4orDK/pFQxoRhDj9zIyeMiR2wEdWjoQMFL3zw/rQzD\nGWL+ZA4xH593Q0edhtaaBYI5LxVNttuBdMf7ioVEZWgQt1gi9oJ93ZQpqOmEmjZthErnGOFqtD+X\nA9jbizi2dMZR4yc7p3smYVVroLrVEKXSOV2WF48CRiHlHJs+YoopuySHZStPJqyfsi7B+1vroVVp\nCth6uOX5+lbHkxo9I+zJG5e9xOCwOxnqVJ7+xcgHtrvbesUUt0ug0uFxtBuOCXE4AEEKftHKeaPV\nm4+WXLfMnqxKmPXMEZgzIypNZ6Bdilb8JVi0KyyIf9Z/5RB4dq7nZRbVqtQgjfwapj8eP0ZjoP1d\ndZ+9xUR7kC914v7V6yClDweLejxhbTtRArPT4+HoJXXS4WzVmzVNzsl2B3B6+nr4Lg0WqrSOqT3X\nAgNuuS346lqSMzyYn42G/ZPWZi26vgvHwaA+P5s36em8CUaLawe/EQII8uVVPjQptLZDZYeDHjju\ndmU3wsXse4RPri2bZLVhwlX3OUjBq1gyM7JepcXw4+ssWXkkYa3+Lgu8RHbOw+8evf9sgX5Vs9IZ\nTffALuCNyOBOAJ9CzRIROrvogQEg9RJft8zZknYoqCYjVXr7SFfdG4IA4FHo4py0BFVZbYdHKlNe\nhQoqmzkDlBrnMFflRXEBhEKUnZ4wSbfl+CGWqa6NI0/5EIwxcCauASGfkK3Z3PTSwXOafzS2O6Ld\ncVff7fsm+NWiorgICDf11tXYHrJ0crKiYWjU9QM3K+ub4YfMJiiu1ado9LTL/gjFBYgKEZoAVkJc\nhL/HKdLuc1Xw5Rs5UNlkGaPR04GuuoNcDgFhAWITwFwY2F8GLDyIsGwOLSD0ICyaOjTqx0zluvwK\n06tqHaPAd9gphv8kKMAyCWEI8SdLBkUJfpw0UrLLW0w43PFNHBKwRIyy7hn1jiWm3/WV4XhhJ+St\nz6DKG0zpRrPrecAYBkBrdACA2CMVCTMMFBfPEzZ1WCdZbIxL7iCgqxOwwWwHAApalEaWqTzFJTyS\nVw6IcJAPrH4kIzNPs7qpjR7poP9Q4oNeQVAAV0MhKC4wfIo0ioWoSSImixUSbq6fDye/vz+/6sMn\nxrdPfeHAMosNz3HH+pWAh/T+cl7OuGcegskjrn88qLxJC5/8qO9nNEG6O1xqhxOgvtUcmV97P/9c\n4TTrX2d71qJ7Zn4znCki+7V22hNddQcRAFjtGGqaLZEYP03tPquzs1TlAYT12AdHobpZJ/xga/mj\nZbX21zpUdGBPhSy4TE6//ruam5tHIUYoQAYRn2z2kZLFvjIyVyER5IcGcqtGD/btnJ4UbwMAeOf7\nC3CquJRf22pNdTUJ3DVt8JVxmlLjpVV6k7NbZi+oVIPMixep0dNuCZhiGACVjpn0xobqVK2eObnk\n73th/XN3e8xyRNIT2yDEVxxjsjrdchUzTQOodM5pC94tGNHYYT+359x5mDV6FEtYd+JLH8u7Ai9v\nKILQQEG/jQdbVpTX2RaaLFjcawmKvJokT8gnDN4iolEi4pYE+HDyQvx5+f18BRXTRwV2DouMsAPA\n/xDIss9Owsk8TaTdziS7I+spiQCEAnTxpQcTOjYdbeq2XFZmI4yfFDbQaqeF7jBXEQLo0tK+5woM\nb04ZKbV8vTw9Z0FGMTNuyJ0f7X48rxYurSsF8bLkWKsNBO6w7hECUKrpgKx83eopKT4v3j0qNe9g\nbjmePmIgS1h3Er46mAcThw+Erw/UDttyuP29xnbHRIvV/bmr/qy7hdAvO2JcxEjEhEksIOspiskZ\n0E9cFiinCgaGiitnpgYoI4NC7QAmQEgMr92gzn3nWiExQjpYY2CC3EGifB6iQ/z4F6kJO52OE0uu\nW65VqYVAX2+U8sTeMIfTfZLFGECtY9JPXTZsn7D85MbQQO6PW0/m1MwfN8IOYMMI3ZnXfDV0aAHj\nt4nkJ3aFujN5KsMAtClxxuHzuu1T2/dvCA3k7th9/nL9rNShdgDAd8S6h5txx3wxxhje+PYkDIv2\npr7e1z43v8LwensXE8Pg209QJAlAEsgpFhB6fx9Om0TEKRTwcVZ8uHdlVLCwKj7cu12ltzgfGD/0\npuo/llcHE4eHkaOe2vtFTqlpqcvpkDFAsD/ZOW+i3wy9yZm7/oVJ1y1XWN0BiZFywZTnj/2Ymaud\n6e4rzX5Ja8OIBKjBx5ss8vHmXvH34XYEK8S2i2UdlZ06q603KiNJABoxUNa17bUZFdWNSmZA6NXd\nzm3HS2DySF/h3Stzfz5fpJ/cE20L+ECLhUS9r5RTLJOQZX4yqjNALraeK2mv0Bptjt4oLwIBSolT\nKLe8OrUyp7wVj4wN7hsWFsYYHn73MEQEeck/3dm2oqDC+Lhaz0hvNTldM9VJAoCiEE1xkMZbTNb7\nSMkCsYDM8ZfziqYk+zfPSA3pbOo02pNjXEtOdzSvHnIqmhVKjW2YO0gDIQCxgCyJj/CqalF2v46r\nM9rBTpvA6qDJnpAlQgA2OyasNhyu0TPhda2OWTwKAYcwMlY7bWIYstcleccAwKMQ0puYDxBC71wo\nqv31N5PVCRqDFaw2IHEPWQFmK5BmCxPZpbFHcjhwD49rBZIwMhYbbcK4d8pLwEPIaMZvIZTy4dmi\nXX3DJdSa1QAA4COlYndndbxR1WC/x2LHFLoFAoffuHgCHqLFQqQW8sh6HylZKJNwc+ReZEFMf3Hd\n4ukhmtDQOBpbLG7bntTpdHDXq5kQHiRO1OiZaHdEuHM4AIE+VO7iKcN1hy7WdFtOyOcARfKBQyBn\nT8oYoasTgdMJ4HBgAKAJhMCrNxr+GAN4CUmdj0RwYfyzeyEy+N+577lcBCIBFygKOwnUM8HD6Jd/\nGAM4HAB2e++Xl1xCqkP8eBfnvbkKvPQFnk9Yn+25AAypJ+5bdWFyQaXlvYZ2+2CHs2eC1n9rQXFI\nAIqLaC8RoZFJiFovIVXkKyNz+/lTBVHBotqZqaGamJBg+mp5BG/+qoDue7OCeh1kfTYHxC/uTzdb\nscQ94QyExUtEnEl+4iec86/uDVSpiAcAPIta76gAgLtuydpEL1+cQAggQEGWpQ/2LurUisDP59/y\n69JaIEAaaLHYLdUEAVNuRbDynSAvPzm3cPxw32KtAWBwWqJnE9ZzX54EP6nI694VxYuLa0wvqHVM\ncE+FLJAEgICPaCGf1PB5uDQ0gFfuLaIu9QvgFSUNlNXeNzZC/cWBn+kV9y4EhBA8fwu+P7e8Hbae\nzBW+taE+ye5wz5StkJItKfHyK1YHAwildVsuqp8cYOA/IXV8cANJAmYY6Huru/8FigsQ4MM9sXRm\ncldRdQe88pvf+gd6AULv4ZQnYxsIRAPdx/Ouw1X3Gfzl3FP3jVmm3X1undvq7XWEtedCMXywuQHk\nYn7kpz/WvlxcbZ2vNzKCnroePlDBbQtUkLvCgviF/jJBUf8AbtXy+xL0XML7Vwtq8S/lV8KiWyaH\ni+XtIKzjhHZqnHHuCGcgCAC5hFv4zH0RLbllFnjrd8pPv6c/SEXc8spGu1mlpUWoD1PW1cPipM5f\nzjuR9vQuSIz6z6NFc9PjIP3pCghUCK5U1NssGj0W9HV5eYmQKjSQnzl15XK4a1SU2+ruVUdz9l24\nAnenJKAB/bmpW4+2bLhUZlnUE2SFAYDLASY6lLowfZTs4dx1k5c/Ni1i/efPjs9Z+UCahiKlNELo\ntoXLN7apYMfmMjCYcJrNjoPdUSfFBZpHMZniqC3WknrN75ZPivGBpIGyCpkXWd3XrQWEABRSonTo\nAElR2iC/6/yOYGKSPwyP8S6RScg6Vl4ACimnJDXBuzRtkAJIRHoeYX360wVApI038W975h3N1n1f\n0WAfY3O4P9QEYwCxAJkHx/A2zhileOjrF3ZmVrVanNNSek9A3ubMK4CrHuFUNdpGma2up8XBGEAs\nRKrQQF7e3Y9EwV/v+f3wCl8pBcvnjmwKUHD383l92yPkcgD8fbgnVzwwqmtwxPUvmk2M8IcV81Ia\nAxXUYR7Vt+XFowCCFFTmkmnJ2jljot1a920nLIwxjFu+DUxW2ve9TfWr8sstX7Z1OSOYHtqolUuJ\n1iExopcXTPF7tqVLXwfwL4gO6V1XTemMDLz5XU2g3kQnuWMB92pqYm5dSpy8dli0/A9Zjk/PHgGL\n1hyFUYOkPymkZA3uo8syV8me0AUqeCfHPbsbHphw/bzq44cEwqQX9jCpg2Q75N5kY1+Wl4BHqn2l\n3BMZy3dDXH/36tZtJazTpQXATf8JYvv5D9qRqfwmv8LyglqHpT0hRC4HIMSfkzMiTvDI2mcjP9OY\nsPGH13vnWbajue2QV66P1RjoUHfUxyEBpBJ0/unZKerkqD+e2mVmcgisWTrmcmy48GuxEDn7ohJe\nvRmbKE2O8yoYP9S3W7KXeolg0nBfWPt4ek5ChGCDSIDoviovhZQoToqTliUNlLu9/ttGWFsyCyDc\n349zT4boroMXujYVVVvvMlswpydcQCEf2WPD+T/Mn+S/8MjaksxACcG88fCYXtnhlyubIX/9faDR\n0+MtVuzllnAGPrL19+dfjHroezx99B830e8dHwfP/+skTB/l83VMf+Fuiov63P4XlwMgk3BPvXB/\nmiou9MZ5qVbOHw2PvneEmTjC98vYcMEBHnXnJHR0n7wQ+Mo4x5+/7y5NQpjbbY/bs0s48oktoNSY\nxEvez3uyoML6QqfG6XuNnd0NPzmpjQ3nfTwl2e+zqiaTBuOXe3XumVOFrVDe3CXVGhyjnbR7RrvU\ni1RG9xMXhweI4cOtNzNbXpXT3NeOqGeN8X+VZtrlZXWWDLsDQ1/YBftl7U8bEUxlcv9vO8T08/nd\nZza9NAWC536tfPzu+JcdznbZlTpbut0BfUle6iBf/qkJy7+BR6Ykur2NW2phncivBfB+ESaMCAnf\nfEj5yblC4xvXyMqtgoOr5/vCg7nlE5K9n/x42eA1A/p5aTa+NKlXkxXGWjhT2AUnLnUNUKqd0e6Y\nnQkCwEvIKRg/XFbvJ6P+VB3rXx4Ca7dWVtyV5vuXqP7cb71EyNFX3BuxkLySEC4uHBmrgMRI/z/w\nDIL1z4+BDYeqS6elKpZEhHC39BV3+mrefqrq7rSA8rnj+/dIG7eMsA5evALjh4QTs59OT9mZ2fVd\naa1lsckMwp5geQGF6LgIav/UVJ+Htr46ZTvDcG33je39aUxOXNLAz28fA63BOdZsZfzcEa5JcQGC\n/bgXJw8bY06N/3MJH6QCf9AffhgwomsXzwx5LjVR9HKAgqjhcjzb5eFwAPxknKzXHh6jGhz5x+fV\n6akDoeGHR8HhhMqFMwKfTU4Qvh6gIOq4XM+Xl5BPHH544pCu8UPuYML6eGcOmKw2weS/HVx4odi4\ntarRlmazu9fYuXb2z1uMtHER/A/uSvN5TK23Xb5QVoyTou+MK5KMDid0mVbw6tssIy0215L1Yfj1\ndhydVEKcmbJiA6Qn/vk1fIQQvL14DEi8sObzlQM+mpnmc29yvOjTkABOtYAHdoL4d5sYwx2/1nU1\n/IUwJkZKziUu3g6Lpt28e/PRU2PBAbauN5dGrJmZLps7MkH4RVgwt5lPIce1c5TX/n4dw3ewvGRe\nhC4mjHdq5sv7gDb1zEUjPb6G9fL6M+CkGcXnP9c9V17nWKY1MCI+5X6eRAiD3JusjepPvbpgauBP\nzR022w+vT4Mf7qDrkUpquqCiQR1msuAkHkWAa9dEoWsmen1KnG+1wwFwxA3vuHRaKmCM8eRkR+Fj\nM8V/+/ZQ9aeVjaaxZgua1qm1D1TraB8MWOpwEDyMgbhTLQoMGKReZLFcAhdS4+RQ/CfreW3+BAAA\nZv2h3MtLZipKDpxvW3cst3240YwnmizMYK3B6UMz2NvuICgCAXkny0sm4ZZOGB5Q1qm1QXxs3J1J\nWARCgBnkE+QjMPA51FqCQD3SJQiBIzSQd+rzZ8ZevHClllkyNfqO63QxnwtcgjClD5Z/OXgAzXeF\nsLgkARIRBUIB5M8dF6Y0GAFWuk3Wv76ZE2OmBgDVlNY3btl3vlleXKf1N5idITKRJNrpZMQGix1o\n5g7UQgTIX8Yv/NuDMeq9Z1y3FpZMGwEAYAeAos0ni4tiQ6gtB7O7FBVNWv+2LnughC8KE/AIhcHi\nAOYOlBdCgAJ8qEuPThqi/DkzH1iwYMGCBQsWLFiwYMGCBQsWLFiwYMGCBQsWLFiwYMGCBQsWLPoY\nbjrUJycnBwCA09za1s9isfAQK0MWLPokMADw+Xza39+vkaZp29j09B5v86YCR0+dOQtOhvHSaLRP\n2h3Ox4AghWy6fRYs+ixlERigkEOSCxGA8la0+IcIy2w2wxf/WgeAmdD2DuVLNpv9UQZjPtthLFj0\nbQeNJMldI5OTuwoLC29Ji7+bHf5yQT70C+kHJos5TavTf2GzO2ZjjLlsZ7Fg0bdBEIRZJBSsLSgq\nLp+QMf6WtHlDC+tCTg5QFMXfd/DQPIvF+oqTpgew3cSCBYurhIUqeRSVx+Xcujyg102bgBknrN+4\nCTgEEVhX3/i22WL5lCUrFixY/BYUl3s2Y/y4drFIeMva/J9NvpqqKoiIioLMEycGGUzm96xW21QG\nY5LtHhYsWPxq6SBkEouF861W276YAVFclUoVb7PbBYAxAwiRMpmsy2gwWLlcLj8hLq6aLxDgvEuX\nIp007cwYN64+OzsbUlJSXHMJc3NzgMEM51jmiVlavf4Nh8OZwHYNCxYs/htcituskMuLEELgdDr5\ndrt9gs1qS6QxM4zics84HY5zer0+huRwUqtra+8X8PlYbzB8ydB0MQA8ZzabXXMJs86eBYbB3lcq\nq5drdfp1LFmxYMGiO/AoKjt5+NBWPz8/sDkchvjE4I8wQl8BEMoA/4B3AhSKLTRNIwCI1On18V0q\nVTRD0+EYYw7GGOg/eeEmYbXZgCfzA0BoQLuy8zOTxfqWw+n0YbuEBQsW1yUNgrCSJLFv554DDovF\nDKnJyZCXWwcIIRoAMMXl0i0dHeCkaQtN05dpp3M0xngSAFzGGBsB/nwyXU5nextx6KftGV0q9XtW\nq204xpgNXmfBgkW3oLjcZoWPolDq7Q3xcfH/8zsGACdNA8aYS9N0BcMwwy0WC22z249xOJxwl8iy\noqb2EZVG96XFYk1iyYoFCxa/T1icyxGhIU1ymbTbMr+k0cY0TRc7aRoYhvFCCLUAxi5d6PD/pqBf\noerN3WIAAABjdEVYdGNvbW1lbnQARmlsZSBzb3VyY2U6IGh0dHA6Ly9jb21tb25zLndpa2ltZWRp\nYS5vcmcvd2lraS9GaWxlOkF0bGFudGljX0NvYXN0X0NvbmZlcmVuY2VfMjAxNF9sb2dvLnBuZ8aO\npBIAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTQtMTItMThUMjA6MTI6NTQrMDA6MDBbBERTAAAAJXRF\nWHRkYXRlOm1vZGlmeQAyMDE0LTEyLTE4VDIwOjEyOjU0KzAwOjAwKln87wAAAEZ0RVh0c29mdHdh\ncmUASW1hZ2VNYWdpY2sgNi42LjktNyAyMDE0LTAzLTA2IFExNiBodHRwOi8vd3d3LmltYWdlbWFn\naWNrLm9yZ4HTs8MAAAAYdEVYdFRodW1iOjpEb2N1bWVudDo6UGFnZXMAMaf/uy8AAAAYdEVYdFRo\ndW1iOjpJbWFnZTo6aGVpZ2h0ADIyOXlgzJ8AAAAXdEVYdFRodW1iOjpJbWFnZTo6V2lkdGgAODAw\n47HA4gAAABl0RVh0VGh1bWI6Ok1pbWV0eXBlAGltYWdlL3BuZz+yVk4AAAAXdEVYdFRodW1iOjpN\nVGltZQAxNDE4OTMzNTc070EN3wAAABN0RVh0VGh1bWI6OlNpemUAMTkuOUtCQshq1PsAAAAzdEVY\ndFRodW1iOjpVUkkAZmlsZTovLy90bXAvbG9jYWxjb3B5XzY2ZTY0NTEwNGEzYi0xLnBuZ2qQWZUA\nAAAASUVORK5CYII=\n",
      "Big_12_Conference.png-64": "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\nj7bUdmwu0RwHjoyTTlcuc/8A2CmvP3/YmpMxGZqYUFCQdfKc7Mg5YlQJVmlFxaUsxdaW/9tUfPJH\nS8ebUsccjbo0zxFz5ZyEyMLcqWQx27yqdwAoBmErS9pqVrRtxgRqBsPBzoqKqYqkeQQxl4H5AOcB\n6JuL3nWq8VT7hp3VHZ9sc3TuPZwYd/3CxtTvPXg5QI8W5GX//hyaPuKMKsHaXVb5XwR8j92ai1TF\n5FUkAewHYSuYtkmizw7unVa+eDENeHSVgcFwU1FREeViZQ4z5hN4LoC5AJJ0qv69IC/nCyNs3jll\nVAlWSVllJXpGPxcD2EnEO5l4p7u7e39RUZHrHJtnYBCQ3qQ+gxaAeSF6LvSw29GZ5LkQMCoYNYK1\ndi0rU7OrFjpt6u7RPgmawYVPVVVVtMOhXeKyqqXG+D0DAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD\nAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD\nAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD\nAwMDAwMDAwMDAwMDAwMDAwMDAwMDA4OLFtoclzNJqmqSbqkLhxe1ljWH2tmWMblTNRaxAKBocM5v\nLisbqkGbkrKiSZpnMCODCZEEblEIZfMayyuH2teZsn5MTqbiVq5a2Fz++8Hqbk2YmeYm7SpmYQHQ\nTML5wcKGfe3DaR8z0++Wv5ankTKDBEcxqEvRqLI+1lT27OLFzjPt9+WXXzZpJtt8ZprEBCskt7Ei\nKp746t3lRMSh9vPSqtcLXG6q/ebX7jo1xO1HaCIqBwDYadr3+OOLO3T7f2ltFJldWYP151a4+6kH\n7tmrV/abtWtt1g5Xaih21R8bd+zZZ69069qyfPVU8hzz3kiz+8gT993XGEr/ffa0uqaHUtemOivu\nv/9+u17ZiytW3/Hkg0veDnW7vSxd/vokwe5YMqPx0fvuOzmUti+sWRMjuvlSEE2AYBWQp9yaaWuo\n3/8Lr6xJU0Epg9VzC+lWIdSfkeSv6NZQwJviZ6wHie8tbNqzdbAOWdJvifkmANAIJwBMCMVgANiS\nmHuJZHoGEjcx2AwCyFOmMbApYUYtgVbARC8uOLWnPtR+h8rG+Bk3kYY/gWh5UHtjchOkiX7qZvkg\n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\n",
      "Big_Ten_Conference.png-64": "iVBORw0KGgoAAAANSUhEUgAAASwAAAByCAYAAADpjuxGAAAABmJLR0QA/wD/AP+gvaeTAAAMCklE\nQVR4nO3de5SUdR3H8fdvZtxdRG6aJWVaHCoRRHZBssxEM7vr8RLlpePlpB4rb6nsQlaTnthdKDIt\nKqPb8VBK94slpmAdM629gB5LRFFTE8VUBFlYd+bXHw8awQI7O5fv7/fs53XOnrNzeX7zYYf5zDzP\n/J7ncUAHMlgZYNTWn5FAAdgEvAA8Dqza+vMXoBPoq2m6tq4LgIU1fcyqcHfS0nikdYodeO9oX3kw\nzh9FsTgR594KHAiMAYYDw2wD1sR64CWcfw7vVuF5EFw33t/BnKZ1lX6wHDC10oMOYXsADcDewDjg\nqG1u2wAsAxYDvwN6ap5Oypf3GYZ1H413p9Pe/UHgdXjAOetkVpI3bO9eD0zCAXhweFq77iPDzygW\nFjP7sDWVeLBcJQaRARkBnLD1Zz3wI2A+8IRlKBmg+SuH09d3HnRfjOdA8NaJQudwTMYzGZf9Em1d\ny/GZdmZPubWcQTOVSiclGQVcBDwMfBt4rW0c2an88hytXZdRKDyCcwtwHGgdKUIOOAZXXEpb1z3M\n6xz06r0Ky1YdcD7Jdq5PoecjLPM6j2TYyG4cXwH2tY6TEtMpuj/R2vVDvtLxmlIX1gskDKOBbwK3\nAfsZZ5ElS7K0dl1F0d2Bd5Os46SQw3EmfZkVtK84upQFVVhhORro5v831ksttd47hjXjb8XxefT6\nqLY34It/pLWreaAL6AkJz37AUuAU6yBDzpc7xpJ5+c/AMdZRhpAsjjbaOq/B+91+1arCClM9cCPw\nSesgQ0b7yv3JZu7SKqAVdzFt3T/YXWmpsMKVJfkG8WTrIKnX1jEKX/g98CbrKEOa40zau+fu6i4q\nrLBlgR8D77YOklr55Tlc5mbgEOsoAkALrZ3n7exGFVb46khWDzVXqxrqR12F5wjrGLIN565lXkdT\nfzepsOIwFriBZAKeVEpr17E4WqxjyA7qKWZuYv7K4dvfoMKKx3HAWdYhUiO/vAHHQvQmEKrxFApX\nbn+lCisu7cA+1iFSYdioK4C3WMeQXfosczsO2vYKFVZc9gXmWIeI3tx79sEzyzqG7FYdmczV216h\nworP+Wi/tvK43IXAXtYxZEBO2vZTlgorPsOBi61DRCu/vAHnLrSOIQOWIZu57H8XJEbnkMzRklI1\njDye5ACLEgvPTPIde4IKK1ZjgWOtQ0TJZz5hHUFKNpKGzPGgworZx6wDRCffsSfOH2cdQwbDnQgq\nrJi91zpAdBrckSR7Dkh0/NF471RY8dofzSMqkZthnUAGbV/aOyepsOJ2uHWAqDgmW0eQMrjsZBVW\n3CZYB4iKdwft/k4SrCITVFhxe6t1gGjk768DrzPexCzjx6uw4vZ66wDRqNs4As1di5v3Y1RYcRth\nHSAadXtoV5zYOTciR3JqqVLlgBmVTVMRPcDmCo7nSE7BFaqRu7zV+W5w7SWN6F09+EvKCRWkvuLI\nCGbxPG/8+HUku36FybNXjsHN5xkFvFDhOOXaTLJT8EsVHncCcAtwQIXHrb7mqXcDd5e0TFvHKMik\nr7DCdh2ONpqb/m2awntH+4p3gL8GOMw0y04E/5ZTgi1UvqwA/glcU4VxK2GTdQAp2xdpabrIvKwA\nnPO0NN7F5uIMYIV1nP6kqbCq6WnrADux3jqAlOUZNte3WYfYQX7aJoruc9Yx+qPCitsT1gGkLH8l\nP7HXOkS/egt3WEfojworbmusA0hZqrEJozLy04Lc3KDCittK6wAitaTCiluHdQCRWlJhxetJYJV1\nCJFaUmHF61brACK1lrMOIIO2xDqApJyjtL0kqs6vVWHF6SkGt0uVyMA1N7VYR9ieVgnjtBDosw4h\nUmsqrPhsAr5rHULEggorPtcR7q5CIlWlwhqYUM60sg6YZx1CxEqaCstVcezjqzh2KWYBz1mHELGS\npm8JRwLXkkyorJQ9gPcQxsEKfwn8yDqEiKU0FRbAhdYBquRB4GzAWweRFJi/cjh9LpTNHAO3ZVMh\nbYWVRpuAk9Cxr6RSCoXrcZxmHaNkDXX3pWkbVhr1AqcC91sHEQmBPmGFawtwCvA76yAioVBhhemV\n1cCl1kFEQqJVwvA8SvLNpMpKZDsqrLDcCEyh1FNziQwRKqwwPAucRbKBXd8GiuyEtmHZehFYAHwV\n2GicRSR4Kiw7jwEnAt3WQURioVVCOwcCncA9wLnAcNs4IuFTYdlywHTgepKTol4NjDZNJBIwFVY4\nRgNXAo8Al6DVdZEdqLDCMxr4Gsmq4qHGWUSCosIKVxPJfKxPWwcRCYUKK2wNwDeA75Mcm0tkSFNh\nxeFs4GZgT+sgIpZUWPF4L/BbVFoyhKmw4nIM8BMgax1ExELavjrfDPRUeMwcMKLCY5bjeGA+8Fnr\nICK1lqbC6gXGAi9UYex3kayOhTKp81KSaQ83WQcRqaU0FVYP1SkrgDtJTmD6+SqNPxjfAu4CHrcO\nIpHJZq+kr2/Bbu/nXEcN0pQkTYVVbQ9YB9jOGJLS+rB1EInMFYc+QrJHxa61dVU/S4m00T1uH9r6\nIzIkqLDiNw89jzJE6D96/A4GTrYOIVILKqx0uMI6gEgtqLDS4TBgsnUIkWpTYaXHOdYBRKpNhZUe\nH7EOIFJtKqz0GAdMsg4hUk0qrHQ5wjqASDWpsNLlcOsAItWkwkoXrRJKqqmw0uXN1gFEqkmFlS77\noBOyxqTBOsBOXbu63jpCf1RY6bO3dQAZsGnkfZivwc0vTreO0J8w/1hhGmcdYICGWQeQATuAhq5z\nrUPsYMmSLEV3lXWM/qSpsBqo3gkaJgMXVWnsSkvTczoEuOto7bosmFWwto4DeHj8L4AZ1lH644DB\nHFUwC0ypcJZKeI7KH3U0B7yR5G8Vg/2BJwGY13UU3p1W0tK+WAfurMrHKstanPtNSUv4Yg8tUy95\n9fLcroPJcH+lg1WO3wA8BK5oGGJP4G2E+6Z3Xw6Yap2igvZG23A2vPpbkYPBn1fa4kH28n74kv8d\n64H/FVamuDHc1yGAGwE0WqcIm1sf8jMopdsEvGgdIkj1Wf1douc3qLDS5UHrAMF6w+oNJKeBk3it\nU2GlS2gnygjHzJkFnH/IOoaUwbkHVFjp0m0dIGje6RNo1PxqFVa6LLMOELi/WweQMvji31RY6fE8\n+oS1a8XicusIMmgP0zLtXyqs9PgNULAOEbTxazqA9dYxZBCcux3CnpgipbnBOkDwZs4sAD+3jiGD\n4ZeACistHgO0ujMQ3qnY4/MEPY3LQYWVFgsAy1064rFlyp8BTW+Iyw/JJ7ssqbDi9zTwXesQ0ci7\nIo426xgyYC+RK379lQsqrPh9GeixDhGVnvobcDxuHUMG5DtcPu3ZVy6osOK2AlhoHSI6+Ym9eNdi\nHUN2ax3Fl+due4UKK14F4AI0lWFwWhp/DF5fVITMuznMeft/tr1KhRWvq4C7rUNELZM5f+txqCQ8\nt9Ey5XvbX6nCitPtJNuupByzGlfjMhdYx5AdrKWwxxk457e/QYUVn38Ap6JVwcpoblwM7pvWMeRV\nvWT4OJ875On+blRhxeUJ4H3AOusgqTJu9cV4SjsEs1SDx7lzmNX0p53dQYUVj0eB95CUllTSzJkF\nthRPxXGLdZQhrIhzn0k+8e6cCisO9wLvREcUrZ78tE301J8A3GgdZQjqxfvTaG7c7RQdFVb4FgNH\nAE9ZB0m9/MReNjeejudqtKtTrawlw3HMnnrTQO6swgrXRuB84Iytv0st5F2R2U1fwGc+ADxjHSfl\nlpHpa9zVNqvtqbDC9FNgAnC9dZAha/aUW8kVJ+JYBOzw9bqU5Vm8O5fmxmOZNX1tKQuqsMJyO3AU\nMBNtXLd3+bRnaW46F+ffCSy1jpMCLwELyBUnMLtxUX/zrHYnV4VQUpqNwK+Bb6CZ62Fqnno38H7a\nOw/HZy4F/xFgmHWsaDgex/sbKLprmNNU1pQcFZaNp0gOuPcH4FdoG1UckuL6GG0do/DZj+L4IPgZ\nwBjjZAHyq8Atw/MLNjcue+V4VuXKAbdVYiDZwQiS08a/QHI25tUk0xLuB1bVJIFjHZ7OmjxWaHwV\n3wRapq0HFgGLWLIky6NvOYSCnwBMAD8O5/YC9gJGVy1DGF4GNuJ4HtzzeFaTKT5Ab7abK6c8WY0H\n/C8/g4GLGpQ5QwAAAABJRU5ErkJggg==\n",
      "Conference_USA.png-64": "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\nADIwMTUtMDctMDdUMTc6MjU6MzArMDA6MDBWgUl5AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE1LTA3\nLTA3VDE3OjI1OjMwKzAwOjAwJ9zxxQAAAEZ0RVh0c29mdHdhcmUASW1hZ2VNYWdpY2sgNi42Ljkt\nNyAyMDE0LTAzLTA2IFExNiBodHRwOi8vd3d3LmltYWdlbWFnaWNrLm9yZ4HTs8MAAAAYdEVYdFRo\ndW1iOjpEb2N1bWVudDo6UGFnZXMAMaf/uy8AAAAYdEVYdFRodW1iOjpJbWFnZTo6aGVpZ2h0ADEz\nN4WFboAAAAAXdEVYdFRodW1iOjpJbWFnZTo6V2lkdGgANzI41ABtbwAAABl0RVh0VGh1bWI6Ok1p\nbWV0eXBlAGltYWdlL3BuZz+yVk4AAAAXdEVYdFRodW1iOjpNVGltZQAxNDM2Mjg5OTMw5eqoMAAA\nABN0RVh0VGh1bWI6OlNpemUANzQuNUtCQl3yTacAAAAzdEVYdFRodW1iOjpVUkkAZmlsZTovLy90\nbXAvbG9jYWxjb3B5X2U0ZWEwMjMxYzljMS0xLnBuZ0mvZc8AAAAASUVORK5CYII=\n",
      "Mid-American_Conference.png-64": "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\n",
      "Mountain_West_Conference.png-64": "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\n",
      "Pacific_12_Conference.png-64": "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\nsO7+h0EIoX7w3PMjc3NHvaVQaByXR+mFQjmRSFTkcokmFMrZ6Oikw0uXrlp6/sIFcUpq9p0NxX9B\ngDSUVVFRBj9HobOzsys2NuasRCpV2G32TJfLFeDHpsBxXJCesXeJxWJPWlraoeycrJ/Mmz//YGlp\nqf+zTz++01B6Zw1e0dEJ+OOf/ho1fvzU/4mMjGuhg0Qk4gFGukKpdaSkZr3+8NceH0EIob7/gx/f\n2bw7Euvqy2az4KP1GxwLFy0oczqdBqvVlup2uXR97WWARqMxjSoc9fbkyRN/V1Jyri4mJgbf+fZT\ndzbvzho+HAEA77z3AbNw0fLZWVn5R8VipZemJUQXnVA/Zcqsb//6Ny9rAeD733/+zoZdYQnubMHg\n1VtWLBQK2Z07Nh96/ImnvicQMN/yeDxxcXHx/3jyG4/vbm9rdwLAq6/+7s6GXWkP72zB0Ku8ogLL\nV9yN5cuWxLlcbvnihQtqG5qauGe/9507mzPE+n8/DhU4PjwkfAAAAFZ0RVh0Y29tbWVudABGaWxl\nIHNvdXJjZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmlsZTpQYWNpZmljLTEyX0Nv\nbmZlcmVuY2VfbG9nby5wbmeLXlSeAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE1LTEwLTA1VDAwOjU0\nOjI1KzAwOjAwRm9qvQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNS0xMC0wNVQwMDo1NDoyNSswMDow\nMDcy0gEAAABHdEVYdHNvZnR3YXJlAEltYWdlTWFnaWNrIDYuNy43LTEwIDIwMTQtMDMtMDYgUTE2\nIGh0dHA6Ly93d3cuaW1hZ2VtYWdpY2sub3Jnb5+iogAAABh0RVh0VGh1bWI6OkRvY3VtZW50OjpQ\nYWdlcwAxp/+7LwAAABh0RVh0VGh1bWI6OkltYWdlOjpoZWlnaHQAMjQwVubTvQAAABd0RVh0VGh1\nbWI6OkltYWdlOjpXaWR0aAAxOTFKpXCyAAAAGXRFWHRUaHVtYjo6TWltZXR5cGUAaW1hZ2UvcG5n\nP7JWTgAAABd0RVh0VGh1bWI6Ok1UaW1lADE0NDQwMDY0NjVYrtkFAAAAE3RFWHRUaHVtYjo6U2l6\nZQAzNy43S0JChSDTkQAAAABJRU5ErkJggg==\n",
      "Southeastern_Conference.png-64": "iVBORw0KGgoAAAANSUhEUgAAAOEAAADWCAYAAAAnzOVvAAAABmJLR0QA/wD/AP+gvaeTAAAgAElE\nQVR4nOydd3gU1RqHf2dLeiUNQguBEEIJJQQSIIUioqBYsaFeRLEgdizXa+9dr9desYuoKKiACoQW\nWujpvZdN3d5mzv0jxS2zZWY3hbDv8+SBOTNz5mQz355zvgp48OChXyH9PQAP1lBKowAMBRAMIKTr\n3+7/RwAI7/q3++9HAbQDaOv61/T/LQDqANQSQtr77rfw4CweIewHKKVSAPEAJgGYAmA0gFEAhgMY\nAcC7lx6tBlALoAZAIYCCrp9CAJWEENpLz/VgB48Q9jJdAjcdQCqA2QAmA5gAQNqf4+JABSAHwJGu\nn8OEkPL+HdK5gUcI3Qyl1A9ABoBMAHMAJAHw7c8xuUATgD0Adnf95HlmS/fjEUI3QCmdAuB8AIsB\npAHw4dsHw7JMY7NCVlIlkxVXyZSlVc36phYlbW5XidrlKqlcqfNW6/S+AMAYWR+WUglXP1KJSO3j\n46UODvDRhgb5G8JD/NmY4UNE8WMifeNGRwbHRIdGhgT5hQj8VZvQKYxbAfxGCGkV2I8HEzxCKBBK\n6TQAV3f9jHb2PoVapzx6prLsyOnqjpOFtWxReaN/S4c6ysgwwwBwCpa7IYDC38+7Zmh4YNv40ZH6\nqQkjpPOmx0ZNHDd0jFgkEjvZjRHAXgC/APiFEFLRawMe5HiEkAeU0nEArkWn4CU4c09eaUPZjv0F\ndX8fLKCFFbKhWp0hFoCzL3pfowoJ9C2dHDesbVFqvNeyjMnjIsMCI5y4jwLYB+ALAD8QQjp6d5iD\nC48QOoBS6gPgCgA3A0iHg88sr7ShbPPfp2p27M+XVtS1jmNZ6sxLPGDx9pKUJo4fXnvxgilelyxI\nTAgO9Al2cIsGnbPj5wB2ePaQjvEIoQ0opZMBrAGwEkCorev0BiOzdXdu/ic/ZWvzSuvHMgy1ee0g\ngA0M8ClZNDu+9Ybls0YkTRo5wsH1hQD+C+ALQoiyD8Z3VuIRQgsopekAHgawBDY+H0op/Su76NRb\nX+6Snympn8iyNKxPBzlA8PWWFC3NmFJ3z/UZcaOihwy3c2kHgE8AvO3ZO1rjEUIAlFICYBk6hW+O\nresKyhvLX/10Z+Xfh4riGIax99Kda9CQQN/T1y5L6lh7Tca0QH/vQBvXGQB8DeAFQkhRH45vQHNO\nC2GX8F0C4Cl0eq5YodEZDB98t+/URz9lByqU2vF9OsCzE11cTMSZh1YvCjovdUIcIZyvGANgI4Dn\nCSFn+nZ4A49zVggppYsBPI9OY7oVTS0K2ZPvbcv9I+tMAsPSqL4d3eAgwNc7767rM9pvvmLOLIlY\nxGV+oegUxscIIcV9PLwBwzknhJTSNAAvA0jhOn/wZEXe3S/8qKqXdSQBEPXp4AYphJDmpemTcp+/\nZ9lUG44CLIAfAfybEFLSx8Prd84ZIaSUjgLwDDq1nVbCtS+n9Mz61zarahs7krnOe3AdQkjrRZmT\nT71w78VJNvaNGgAvAXiREKLr4+H1G4NeCLvsfI8CeAAc7mRHz1SV3fb0RkVTi3xqnw/uHIUQqBal\nJpx8df0liaFBvgEcl+QDWEMI2dfXY+sPBrUQUkrnAPgYHN4tVQ1tdbc+8W1ZbklDKgauBwtLgA6J\nRKyUSsVKXx+pNsDXS2fLAK7WGrwYlhVptAYfyrJinYEJHcjOAoSQ1quWTD/97N3LUrykEsvwLQrg\nQwAPD/Y4yEEphJTSIQDeROfS0+x3VOsM8juf3pj918HCdAyA6AaxSNQQFupfO2pYqCpudCSdODbK\ne8KYqOBxoyKiwkL8h7jav8HI6Bta5M3lNa2tVfVtqlMFNdrTxXXiytq2ISqtbjSl8HfH7+EKErG4\n8t9rziu6+Yo5C2G9FWhDpyB+2A9D6xMGnRBSSheic/aLsWinH/+Ynf38BztiGJaN7pfBAYgMFp26\ncP7MtrkzxgYnTx41akiw64ImFEopraprq80+WV6340CB+nheTUirXBXXX4I5JNjv5GfPrfSdnjCC\nyxT0M4A7CSF1fT2u3mbQCCGl1AvAcwDuh8XvVVDeWL7ivs/k7XJ1v+/7Xly0L2vZ4gW+QUn/mdXf\nY+GCYVnmdFF96fUPf6HrUGg4bae9jHH+7PH7P3jiqlk+3lLLlUoHgNsJId/2w7h6jUGhBewKKzqB\nTuVLjwAaGVZ357M/bFt88zvD+koA/XykhfbOE0KpqujzWW17bsnqi/HwRSwSiadNGD4+LNhf0U9D\nkOw6VJQx8aLnm37ZeWqvxblgAN9QSjdRSoXGRA44znohpJSuAbAfFsqXnLyawkkXP1f+667TSyAg\nyJYP3lJJ1aULEw//+fGdDblbHh3nzD3a2l0ZbVm37O7NcfUWvlKjEp3pMHoNI8OMXvfcprSL1n6w\nV63VWz7rcgAHKKWJvTmGvqJPgkh7A0qpLzqdgq+xaKePvrV1z1dbjqSg9xImgRCopsWPPPbImvPC\nUqbGTERnoiYwLMs424e2bldmy19XHwxb9G2K2Qra2N4MQ2MLdLVy6Bt10NUZwagJGLkIjFYEVicB\n1f+To4aIWBBvAyR+Roj8WIh8KCQRBD7RXvCK9odXZDC8ooaCSN3yeUyJlFW8tz5V/t2pcdLPfj7o\n19ymnIhe2tqcLKhNS7zkhYqvXrqxsutz7iYBwEFK6RpCyFe98ey+4qwUQkrpCACbYeFy1tisaFp6\nx/vVTS2KjN56tp+PtGLVZalta69JSwjw805ztT+97GiK6uBNv/sPCQiGoSUUrGY4QMPRmdaQZ2d2\nz7KAqA5ifxmkYQr4xTMITApGwKSxEPlzGM6pXaEy5r407s4VRwLWXZfuV1bTUv3s+9tK/84unErt\nhH0JRW9gYlbc96nhsvOm7n79ocvSRYR0r+B8AXxJKU0CsJ4QYnT3s/uCs04IKaVz0eniZObP+cvO\n0zl3Pb9pdNcfxO1EDAnMef6eZeLz5yZMg4Xm1VVEulI/6IbMdWefXI8B2GgwimgwCkBbAbRuBwAK\nkV8eJn0z0cH95lAmsnXv7VlhC77OiB0RNvLTZ68bqdLo9W9s2Hnks58PRRuMbo8ykf7058nMvTll\nOTs+umOMhfnmHgBTKaUrCCHNbn5ur3NW7QkppasB7ISJAFJK6brnNu1e99wP0yml/GcPB0RHBJ/4\n9tV/leb8sD6pSwDdDkv6VUtNQLVDhdyobzw0Ty/L6XG89vf18vrPbUuSC39/LOrfaxYf8PISl7lv\nmJ3IWhVJM698Rbsnp9Qy+mI+OveJY939zN7mrBFCSukz6LT/eXW3yZVa+Zzr3jjyy85TmXDz7xIZ\nFpjz7av/yj343f3T5k6P7dU/rKi/LUXU2gHHyZwU4tbdq4ygjNk+WCIWSW67at6cwt8eG/PQ6kVH\npBJxrVvG2QXDstErH9wQ/9S7f+yxOBUHYD+ldKY7n9fbDHghpJRKKaUfA/iPaXthRVPF9Mtfaq1t\nbHervS3A16v0w6euLji6cX3S3Omxk9zZty2I6OzNw0KN6gT5iZcPcp0Ti0Rk7bXpyQW//Sfi1hVz\n94hERObGR0s/+TE7fcV9n2WxlLIm7VEAdlFKl7jxWb3KgBZCSmkQgN8BrDZt/3XX6dzFN78TbjAy\nMe56llhEKh+7bcmu3C2Pjlkyb+IEx4NjjJD9cgAFt3G+gLzodxG0r4RxhKrg00RGXd9g67xUIvZ6\n9Nbz0/O3/sd/WcbkLABaV55nysGT5RkpV792WqnWaUyaAwBsoZTe5K7n9CYDVgi7jLE7ACwybf/k\np+zsO5/9YSyllMv7XghM5qy4rNwtj4bfcuWc+eQfzZuNq+UKVL2RjdwrO9Dw2RwYZKNcHsFZ77dE\nA9uybnIYB+jrLfV79/EVGTs+Xls/NCzwqLue3tAsnzr76tdKZW3KFpNmCYCPKaVPuOs5vcWAFMIu\nB+y/0Fm7oYd/v7kl66l3/kiBm4zvPt7S4o2v31T4xQvXZ/j5eNn3lzS2NKL8qSzk30DRkZUKyg7q\n5E6UY59o93pVRSzOXFmDpu+PgTKsvWsnjIkac3jj+plPrr0gWyQiLfaudRaFSjs55erXVIUVTRUm\nzQTAk5TSN7pSmQxIBpwQUkoj0KkBNTM1rHtu0+6vthzJgHvmDf1l5009lPvrv8dYGICtYZQdKPvP\nHuSvDoXyeAYogtzwfAv6+/3gTgTDG2oYgcZvZyD36ko0/bAfoHaF8abLUlOPbFxPR0eHur6kB2Aw\nMqMW3/xO0IETZbkWp+4B8O5AFcQBJYSU0mAAfwIw8/O85fFvd3dpQF3G20tS9sv/1lS8+fDls6US\nsW07KTUYUfv+YeRdT6E6kw4TrazbGZCvhgtQwxg0fj0XuSuq0fLHcXub3ojQgPC9X96b8tjtSw6Q\nzrAl1x5N6ZBrHtgw8uDJijyLU7ehM2p/wDFghLArAv4XWAjgDY98mbV9f36mO56ROD5676nNjwy1\nESrzD+07jyD32iq0bpsF9IGjcL8rZqy/Bih1w+zIGkaj7oPpyP/XcWiK7KY4vOWKOXP2fnmPOtDf\nx+Xsa5TSoKvu/3T4oVMV+Ran1lNK73W1f3czIISwq4bfJnSWFOthxX2fZe0+XOyyC5pIRJre+c+V\nOVvfuy3N11vqZ/NCfWMdCm46iur/JoMaYp3r3Q0SNNhmQkuMHdNR8uA4lK7fC0Ylt3XZqOghw09t\nfjihS4PqtA8uF5QieMW9n47YZ23Uf22gaU0HhBAC+B+ApaYNj7zxa9bBk+UuC6Cvt6Ro1+d36S6a\nP8WOOxulqPvgKApvC4WhtR8MvfykkMI7x6jV7Teo1Flahbznx6DR7GGMhsOUZQvQWcas/+fYfxBB\nXZyGvBsUaN95xNZFYpFI/O7jKzJee/DSY4TApcIyFAi87sENw3NyqwpMmgmA9yili2zd19f0u+8o\npfRhdNZ86OHlT/7e+/XWo+mu9h0zPCznjw9un+Tv62Vbm6qtKEPZoyowqj4RPi5xc2AUsb5+9D2i\n1p0P+jKa+hl2ryNEL5JImqU+Po1Sf3+Ft78fJF7egUQkGglC/nHxI32psGCGo/q/w9H4QzbGvhgP\nSTBnZoErz5+enBgXXb30jg/a9Qaj06XnLKFA6GV3f0I3v31Lkck2xAvAT5TSeYSQU0L7dhf9OhNS\nSleiMwFvD6989vfe/32TNQ+uLdLYSxcl7sjacNd0uwLY8NVeFN8TBUbVHxHk/8Dy/TOIScSy7QlE\n4m83gJhS6sUYDNFahWK6oqEhvbm0LL0hP396fW5uuKy4uELZJNtn1Gj3UZZwuJXZVWy6jr4+Ffk3\nadGRfdzWJfGxUSOP//hQUFRYYLYrj6KUDrn0ro/CSyqbK02aAwFso5SOdKVvd9BvQkgpTQbwAUyE\n7Yftx4+8/VVWClwTQP2/1yw++NYjVyy2aXhnVGoU3n4Msk1pQP8nOqKE5f37Eomfb+RFuyKIyKtC\nyDONOl2Moqlxnqy0ZF5D7ukEZeFnLr3owmCiUfXSdJT9+wiokXMPGOjvHZr9zX0zp04YbhllzwuW\npUOW3v6uTqHWmVaHGgbgh67Y1H6jX4SQUjocnZrQHiXJ8fyaovtf/nkiAKnNGx1ACFTvP3F14W1X\nzbNZ1AWaoiIU3NgEvf2lnFB42rg7EfiVI/IZMiTs/J9YwPWUgIpjz8exmqb+SaKkyktGwY25MDQ3\ncp2WSMTSLe/cmrYsY9IBVx6j0RnHL7jxvwVGhjWNO5wN4NP+tCH2+Z6w61tnKzq/hQAAslZl/WV3\nf+QLF2YlkYi0fffaqtaUxBjbS8u6D/eg5fdZcGe6C+swJN5iyDuSyeQGaciE2Mu33HFI0dEwPtJP\n3RYVoFEMC1Rqhgcq9bGhbXRUsNIn1Fc3xEdkHA4C25ph0HDZjssORS3fO6wzEw7f38JFjKpEFN7a\ngJgncxEwhdNx/t3Hr5oT+uaWrC+3HHFYrNUWja2KmZes+2jX1ndvnW/SfDWAUwBeENKnq/SHYuZN\nAD1xeUYjo1t409sNDEOnC+1QLCb1v713u2bi2KE2Qo4oi/LH90J5utci7vsW6/evQ+sd2qH1Di1u\ntR3YHumvbkyKbqqeH1OtTIxqCgn10cYBpOeLj1U3zFYcf2lP4PSHeSvF3CKzlBmK8seGIGrlYURe\nwRkd89w9F2VEhQfte/Wzv1Mg8P09VVg7f/2rm/965YFLTDWkz1JKjxNCtgnp0xX6VAgppdfAQhN6\nxb2fHWpXaARrQsUiUcPfn64zxo4I47brsToditedgb5pkAigcJpUflF/FMdE/VEcAwCQiqhxUlRz\n/rK40qZFY6qifKXGCcqCj2d5jzr/dD8O0wuNX82C8sQexD4zj0t3fNfKjHl+vl5Hnn73jxkQmD39\n+z+OLUiePPrwiiXTu4VdBOBzSulMQkiNC+PnTZ/tCSmlEwB8ZNr29Dt/7D+WV+WCAJLGvz69Ux87\nIoxbw2XsaEHBv0qgb+qVlBdnOwaWSE7URyQ8uyclI3PDignLv19evzF3/OGCLWtbfYjGcQe9iepM\nOorvOwDKnTjr5stTk59ce+E+AELzyojWv7p5QkVtS71JWxSArymlfaor6ZOHdSXm/Qome779x8ty\nP/4pW3BALiHo+Om/azRjR4ZzhxLpaipRsFoFRtMngbmDgQaF/7DXsmemL/tyUUZpvSa5v8cDbfk8\nFKw6BVbLmV7xpstSMtavWngCAu0plNKgi9d+KLNQ1KQDWC+kP6H0lcSbFeNUqvXt1z/8hT8EakIJ\ngerLl26snp4wPIbzAm1FGYrukoIaXY/16wOoizsq2gs2PYaSgVEkx9gxHQW3FoPVKLlOr1uZMXP1\n5amCqze1KzSJtz31nWUi5mcppbM5b+gFel0IKaXpAMycZq+89+MzRiMbI7BL41uPXJGfnjR2MudZ\nbXk1Su4NBvqq3oSbwoA82IbpmIaC1RW2BPGJOy5IX5AyXrAg7thfkLnjQP4JkyYJOs0WvZo0upte\nFcKu6PcvTJ/zwQ8HDueWNMwT2ud9Ny44eMnCRG4XM11tFUoekILSQR1we07CqCej4OZyW0vTz569\nbu6EMVFCBVF8y+PfjWholreatE0E0CdR+b09Ez4LoMfvr6axvf7597fFCe1szrTY/ffckMktwLr6\nGhStk4AygtL3eTgLYFRTULQ2D5QxWJ4ihJAt7946MyTQV5AvKKU0/JJ1H1mm6HiAUuGmM2fpNSHs\nStK7rvuYYVnmglvfaxaaoXlEVOihb169MZXzpKG5EcXrmL5bgnroNwwtySi68yhX1L63l8Rnzxd3\nj5JKxNVCuq5r6pj1zjd795s0SQBs6FIs9hq9IoSUUgmAd0z7f/GjP/cLLbXlLZWUb//ojokiLl9Q\nVqdG0bo2UOGe9mZQWgYKzr1HrzGQAo7OBvT1qSh7hHPpGRLkF/Lli9dr4agogA1e+eyvuHa52tQN\ncAo602P0Gr01E94Lkwj5epm85cON+wVN64QQ5db3byOB/t5c9RJYFK07DVbjOEWhExg1mr0N+XnR\nIFC7o7/eQ2ShDDoHlUOqgnTUf26Z/BcAMGd6bNzaa9MF+ZmyLI28Zv0Gy9QYj3X5O/cKbhdCSukw\nAI+btv3r31/m0s7QEd6suzb9dHxMZAznyZo3dsHQ5A5VMtW0tWXJSkvTKEt9BLphn9uQfkhg3Lx5\nHtp3n+Q69dDqRZlxoyL2c51zRG5JferOQ4U5Jk0B6HS37BV6YyZ8Cp2DBgBs359/Ir+sUZBXzIQx\nUfseuGkh9z6wZWs22vYsEDZEM9TyutrD7bW1PW5tPJP98ZqFiGft2Yl7CreIUP3WSOhqOXOebnnv\n1mneUkm5gH7JLY9/F6bTG02TFF9BKT1f2DDt41YhpJQmAFjVfcywLHP385sExWpJJeKKH/97M3cB\nFm1FGeo/ngTXs7OoW6sqi1StbWazKenjXRohonNPMv0m5hlZ752ud0SHoOReymW68PPx8v/4mWuV\nEJCvxmBkYu5/+WfLVIwv9oZLm7s7fAUmTuGPv/1btlpriBfQD/PVSzfIA/28rbNss1oVStbDDfk/\nNW2VVeU6uYJL0M89oehrKKjKkCDRdrTvhqufN6uPQ+mDnBm9M5LHTVmaOUlQQPCvu06nVDe2m8Y4\nTkNn2JNbcZsQdpkkepI1dSi0HV9tOcrt1eKAudPHZqdOG8NdCrn80WPOZ0KzAaWq1sqKEq1C7vEr\n7UcCJ989ua26Zo5SJtsHV/NpaKsy0LSRM4nw249cMdfP18sy/aEz+Nz5zEbLFCJPd2UHdBvunAnN\nEqve9cKmE131JHjh7SUp2/DCddzOw61/H4a61LXquJSq2iqrS3UKpW1ziavOnL2O+Sqcb8r6gYLI\nJ3SIyH/4KUVjY5qqpcWl9BUAgMZvJ0FXXWrZLJGIpT+8fpMUAswWx/Nr5uaWNJj2ORbAHS6M0gq3\nCCGlNANAT6XZxhZFy+7DxUK88NlPnr1O7SWVWNdWZxQy1L3jqkM2015Xl6dVyrln2S6oK2+1kHt7\nOafSQCYwYY0RAOT19RlauVKw/2cnNBClD2m4wp+mjI8etzAlXoigi29/+jvLehkPudOv1F0zoVnG\ntHtf+OkUpdROKgVuJscNO2DTMbtkfSUo65JLmqJJlq1pa3NviM5ZOgsNFHxjr5hGCOkAgLaqirkG\nteYvlzpk1JNR8xansL37+Ip5QrxpKmpbkw+dqjB1hxsGi+B0V3BZCCmlaQB6EivVy+SN+46XpvDt\nhwCKz59bya3Ekf1yAPoGl/KC6pTKPcqmRi6/U6tvTSI6B7WV/QQRe/tIQid3R/KT5rLSTNZgPOZS\np+1ZKdBWWJXq9vWWer/+0GVNQoZ5xzM/WPqr3uuuvaE7ZsL7TQ/WPruxEABvs8SKJTNORIYFRlid\nYOStaPjcJY8Yo15/qLWy0koA91SN+IthxVypDDxC2IcETrnHVNMtaS4tHgtKXSmx7YOyf6u5linL\nF0xJGhoeZDMDuC1krYqkPw8UmjoGxAC4zoUx9uCSEFJKxwO4qPu4prG9/uiZKt6zoFQirn327mXc\nni+VL50EKGeWZqfGyLLFzaUlk2Bh3yltDdn/4J/pCznvGehLTIv0bJSe3dUsvKPTp0Ak6VkmMkYm\nuKWsXAW44D7IqCej4RvOPeYnz1wXAQG2w8fe3qqzaFrvjlSJrs6E6037ePTNLUUQUELsqXVLa7y9\nJNb3qc7kQZUrPEEThbKptNSHMqyZvbFOGXDw+p8vSKEUhFLOxLsDXAoHHgSuuK0R4jN8gZlWU69R\nj5fXN56wdYdTNG9KAKO0qmcxZfywmBkTR/F2aatr6kjOK20wXeZOBHCBK0MEXBBCSulQANd3H+v0\nRtXuI8W87YKB/t651y1N4sg1QykqX6CujFEpazrK6nRmSaD0jLhk5Y8XTLGXvoHQfvCDPIsgveAn\nWuZ7gx9LiWlQLVQtsjlGjUa46YLScFS/zinI7z2+Ih4AZ4CwHch/3tpaZdF2l6CxmeDKTHgLgB5T\nwn+/3H2CUvCOaH/mrmVKQjiiAGS/ZoNRCTamGw2Go4qmpkzTNkohX/nzEqnKIP0nyTBX5l2Pg2ef\nU9nmJ3pyd2oNLAw2zWXlM8Gi0sZtjlEcS4G+wer+YRFBUfNnxXF62djjaG7VrNYOlensel7Xtkww\ngoSwy3/uFtO2T37KtlaqOMDfV1p06cJE670gNerR+IVgmyBl2dqWkhKrCP63Ds44WdkebBZ36HoQ\n0DkYRtRLbC+NSTxQM8IsPIlS1relqrwFwusVeqPiWU4lz4v3LZ8IwHKf5wi/Vz7923R2FaGzCrBg\nhM6EiwH0LPN2HCg4ptYaeH8bPHzz4nauSRBNG7NBmRECx4aO2toGlmGCTdvyZGF7v82d4JS3zYB3\nmBmEUMpSAFi/I22uyigxSz6sV6pm6JRKQWFJAABdTSpUeQWWzcMigiKmJ4zkrSn99o9jY40Ma2qy\nuIFSau1g4iRChXCl6cHT7/7B2x3I20tSfv3yWdaGc1avgWyTYJOEUafbr+noMEv2a2BFxWu2nsed\nAJi7LPQAl0ILt7WBPlweGFkivWnzBb6AeXaDtuqqmZTSBoHdElS/yVlw9I2HLxsNngmEWYYd8f22\nY6a2zDAASwSOjb8QUkpDAVzefdzSoZJV1bfxznC99pr0WhHXNNiwIQeUjeLbX+fgoGipKLdchjL3\nbV+gNDAipz14+jqUyQMAEzNLRXvguE35cTlmpxnWr62mpgJC/zaGptlQF1r5lcaOCBsZOyKM92z4\n3rf7LJ0NVwsaF4TNhFfApKrRe9/tLQTPJL6EkOa116ZZCy5lDGjdNk7AmAAAGnn7CdZgjDRtO1Qb\nte9wbaTN1BqUIyaxN+2ElokpPHRhMZ2/fmBmmlJvHvmg6+hIYfT6w4KfUfsOZ+m3p9cttQ6Zc0BV\nfWtSm1wtN2laQikNt3mDHYQI4Y2mBxu3neCdtmLejLG5UonY2qumeesRoSkLKaVVHbW1ZstbhpLq\nh//M5O3uRlm2jVJa7dwPhLhBeXAAQ4lo3bYFBICZu1hrZWWUZZvTaKvmQFdraWJA+sxxU3y9pZzR\n+Xbw2rD5sKk/qRTApUKGxasqE6V0BEz8RKsb2mra5Wq+GdTYp+68kHu2a/pWUDpEAOiormmmLDXT\nqL68L7labRQ7KodsNTc1FhTwWV6P9Gq9KSss89NzvuqTK7Acq8y8piETcuqjspKGNfZ8tkadLsag\n0eyV+voKCWkTo+7jcox5wkrzvuqy2fXvfruP1ypsw+ZDvvfckGnadDUsih45A9+Z8GKYvLRvfbm7\nmG8fUeGBJ8aNCrfOXKU6fRqsNoHneAAAlDGe0Mg7zCrvynVepzYXjrNdsdeN6Ov3ZMiPPfN3Xzyr\nE5GlZmbQ8tCfaYmUErNQotbKygTBaSmVJ6aB1Wktm9ddlzmDAAo+XbV0qKY1yOSmVZ0yKKW89Rl8\nhXCZ6cGW3WeG2brQFndfP597KVH3geBcn+01NZbeL8y9OzKdmuXdZeVTFaPH8WwAACAASURBVG5Y\noMp9j/cGf9DgYm1fakPFq9B7hW7KG2eWVZs1GsO1CjlvQ3vXk4LR/LPVvf6+Xv6Tx0fzzd4tfvvr\nrCLTY3ROVLxwWggppUEAerKbFVY0VWi0Bl6mBAIoVpw/zTqnCyNvhbZGUA15yhhPaC2i5Mvagw6e\naQyfKKQ/FyDyU68l6mq2C0rD7sE2bx1OmmNkRWZKlY7a2umg/GauHlp+DQJlrUKp77l+Pm8Fzead\npyyVMcs4L7QDnz3hUpi4qX299UgFOsM5nGZ8TOQpL6lkrtUJ2S+5AASlreioa7Sy8Ty2c67TM/QD\n29ObfSRGofYnKzQ7fiVApOMLPTiNgRF5f30qofTGabk9ZQ5YhgnWqVW7vf39M3l0Va/t6DjRUVcw\nlZ5MaPQell4YkHjvSGnoxLEAsCh1fKJEIqoxGlmnHUUUKl1Cc7uqOTzEv1sYF1FKfQghVkteW/AV\nwh527C/gHTl/8xVzuCMs2rYFc7Y7gFJapuloM5tBtdT/eElrqNPZvg/URNtNdeGhb2CtJyYzPjw2\nZfZ1ifl1EtE/9UbkdfWjI+LGsXCwoqOUPaVobGpQt7TMpZT2RD1o63YN09btgsgr+JT/pLVK//HX\nz7w2RZ/7xT4JH28t0U9/nixac+WcbiH0AzAPgNMZAvjsCTO7/2M0MoZ6mZzXco8AiksWJlovRfWy\nGhhVgrKyqVvbqgHSIfKPPuI3dkVW+IXbK/+UvtfPdZ499AZGVuT1Q954MzOCUacdwxqNx23cwjJG\n49H26tqjDbl5U1TNzYsppf6cF+o7EhXHn5/T8P1E7Qz/fbxzx2zacdxyP3shn/udmgkppXEAejSa\ne4+V5lFKp9q5xYppsUHHvb3E1ktO2aZSAEL8RDX+M14N9g9KDgFIj31wzZVjR2efLN/9d3ZhpoA+\nz07cEFja51gHJjtU7Hyckzjj6kkFckL+yTkrr29gQkaavj60Stsuz+9orE9gDUanbMQGo7ji15Kx\nlZ/kTJrUovHlbWoqqmiKo5Sy5J+CRYv43O/sctRMeL7//Vgbn4cAAKMuiaz7dnw7EYmVIklgi8gv\nUiUJHG0ICW72FvgG+aLuQw2CkhlY/B6fPnNtxsKb3j5UUtXcZyWPXUJ0Dqdb44HSIAk4Wh+1Kzm6\ncX53m6ajPTl4eHQJazDKFI2N3hqFfBoodSYCR1PWFrL31f0zQ3IaIpPBU79hCsvSyGN51QVJk0Z1\nKyonUUpDCCHtdm/swtnlaKbpwb5jpbzjBk81RE54YtecQrDGYay+bZqxvXCutnpHpqzwTCxlKac7\nkUMMzakofSDbspkQQv744I4ZocF+uYL69TBgeT07aQzMLaOksaAguqm4KFUj75hhmcbEEpaSpqzK\nkbuXf7+8/ZofL1yc0xA5C66XU8DPf50yVe6JADhdf8VZIexJkqTS6FVylU6QUX176eiUz09MzDJt\nYwz6qJbyUjUATi93h6hL01D7YZZls7eXRLrz03WjvKRiKzclDwMPLo8ZLsraQmIUei+zSkyUZR0p\nCZlGle/ux3el7p77ydUhD/6Zltmg8Odt47bHvmOllqFM1lYAGzgUwq66bGO6jw+dqigDT3c3U947\nOm1hds0wM6ExaLTj2qurS8AzpKSH1t/T0LrjkGVzWIh/4J+f3ElEIiITNloPA5HvzsQ55djBUtKa\nXR2dddWmZbUXf3tp5vbSMZksSK9U3a2sb42xaHLaW8uZmdDMj3L3kWLLbMS8uXf7/Hk18kCzCGpN\nR0eSUiazWlo6iQi17yZCedpq+TlmeNjIz567rhX8I6gHMIMvmp+Pv813ZyYmwk5Kez0jLvnmzMQ9\n531xpdc92zMzKtqDXM3c7hCGocPqzV3YZlBKbeYxMsUZITQzKxw8USF4FuyGUoiv/enCZKVeesa0\nXdHYmKZTKqyWlk7ii/LHw6FvtNpfzp81Pv6Zu5YexyBNOD8QMjSyfZh1UamXBslUvuaeSRTqPFnY\n3jVbzstP++yqcW8dnJauNEh4e8C4wo4D+aa5bPwAOFWRzBkhNHMJq6xrcYs7iM4o9r1i40XhRiqq\nMG1vrahMN+q0gkodAzQKxevUYFRyyzM3Lp+dcunCRIH9euhtOLzI7LK9LEYFAAaGlHx/Jv63RV9d\nIV/1y/lpJxsjBOkr3MHOg0WWqy3u+poW8JoJdXqjVqMzjrF3MR/atD5DV21eoqMUpqpc0lxSNoNl\nmDM2b7QHqx+H4nVFoIzV/vLNRy6fNzluGGf5LA/9C+UZC/L9mfgJrxxIPjh/w9Uxrx9MWqrQeblU\np8Qd5Jc1WiqInPKHduDuQ4PQWQoKAHDkdGUJeEbRO6KoJST+wb8yKmGyxqeU9WkqKooWnOrO0DoT\nZQ9ymS6w5d1bk4dFBPdbtAMZnCviPqdJ5Re1KS8uxcASl7dH7qK5XWmpcXXKq8zRTGhWknpPTmmr\nnWsFs6dy+NRPj08yS1lOGWZIc1kJA8Apg6cVNkwXYpFIvP3DOxJ8vKRCapl76CUGwr7WVYxGNlqj\nM5im7rdKu8mFIyE0izQ+UVDbax/VBzlTF+yvit5t2mbQamPbKisrIVSzacN0ERLkG5D1xd1+YjGp\n57pt4GMR08uVwNhDfyA6XVRnunob40wqREdCaKbarWtqd1thRC7u/zMzo6IjxCy/pFahmKqor8+B\nsPhxm6aLYRFBUT+8vrqDEN6p0D30CoNgKgRwNLfK1KVTDMBhaXdHQmimhGntUAfZutAdUApy/U/n\nT1fqpWbqZ2VLyxytvMPtpouZk0dNeO7uiwoxSE0XHvqe04V1lvZLh4pMXkKo1uqF5QPlgZ4R+13+\n/cUjjKy4wrS9rao6w6jVCczCbNt0sfKi5BmrLklxvV66Bw8AqupbLQ30DiOEHAlhTPd/1Fq9imWF\n1wnkQ7vOe8iNmxezlBJz00VpySzKMLbix+xjx3Tx1LoLM2ZPjRE603pwA6yzzqMDHFmr0jKVp3VS\nMwtsCmFX0ZceKa6qa+vT/JolraGxD/yZYaaUoZRKZUUlMZRSYZpNQ+tMlD3M6Rr3/Wur0kZEhVop\ncQYknAU8PAwEOpQayy1bNOeFJtizsYTApOBnSbWsDU6sb93Jvqroqf87Mu3vO5NPLECXSpBhDKHN\nJcXKiHFxzSCEf8ZjdXEa6j7ej+ibzbzcRYSItn90x8SZV75UpNEZXSp11dd888qNYe1yTb7jK53n\n9qc3qmWtCqfzrxIXC2JQOji25ToDYxnm5zBaw54Qmi09iypkwksXu8CXJycunBIl+ztjVG1PaWuj\nTj+ypaI8L2xMrB86ffT40bI1FT6jDmHIYrOg30B/78C/P7tLk3b9m00Mw5412ZrGj46McXefgX7e\nB2StwpKZncuwLB2iNxh1XlJJt2nCYUJre3tCM4mub2oXWh/OZR76M2NBaau56UKvUk+U19edhDDN\npk3TxYiokMgt76yRE0KslDgePDgBaW1Xm+oyQhzdYE8IzWbC5g51v22cKQW5YfOS5Datt1npY1VL\na6q2o3WPrfscYNN0MTkuetxbj1xeBKHxjYOCvs1bMyi0Ml3I1VrTZGMuzYRmN3coNK6U1nYZIyvy\nuvqHZaMMRgvTRXVdpkGjFiiItk0XlyxMnLluZYbQ+EYP5zAKpdY056jDdJ5O7wk75BqnAhR7k3ad\n95Cbtixu+/LSbR0A7fnlWsrKUyLj40+KJBJeGeAAdJku7s7GhI+SAXNn4PWrFqYdOll54PDpij6p\naeE05U/5gIjdp4ghYiMmfs23sI9bYdnB4D3aSYdSa2qwd+hlZk8IzRQeeiPb70IIAEUtoWPv3ZZx\n6o0lu+PRlRGcUurVVFwUGxWfUEREhL9m09CcitIH92LsK1YpGTe+sSpl3nVvHqppbBs4mduoIRZU\nWHUwG1jlah00EtEPtCvMhFBEKRUTQmzqVOwtMc2EzsgYB4xt6kBNdOLbR2YcgMm7Qhk2UFZUFAQI\nLKmsLuaMuhARItrx8R2J/r6869d5OEdRqDSWugS7E5g9ITSLG2QGyEzYzVcnJ8zfWTHKPHOb0TC0\npay8DRDolG0j6iLAz9t312d3B0rEImGpGT04ZPAsRjm9f+xGUjg9EzJ04IXL/PvveRnlbcFmShm9\nWp3QXlubB0CIScWm6WJoRFDUxtdv0hJCXLKXElG/6rdsYSUCvVkyfLAjEll5NNn1H3V6JhSTgbdN\noBRk5c8Xprapfcz8STVtbcmqttZ9tu5zgL2oi9i3Hrk8D+e06QIYgK/CgEIsFlkKYbO96+0JoZnS\nRiwRD0i/IiNLpFf9tDTGwIrN/EnltXUZOrXHdNFXiEQeyexGbO3aa9f1yJ4QmsVFScRkQAohAHRo\nvUOv3bRUwoKYfeO0lpXPNRoNhwV1aifqYv2qhWlzZ8QOpqgLjuWox0lcKBKJ1Z7D7srJnhCaJfn1\nkkoGrBACQJU8YOS6P+ZXgsJkz0bFzUXFkyjLFgrq1E7UxZcv3pA2LCJYWFiVh0GNVCK2/AKzq5+w\nJ4Rms0pwoO+A3wcdrR2a9Hp2kpk/KWVZf1lRcQiowKIzNkwXErFIlLXhrgkBft6eojMezIgIDTA1\n0BsIIXaX6vaE0Kz8WUig74CeCbv5Pi8+dVvJGLO9IGM0RMlKytQgVJhTtg3ThY+31Hfnp+vCB6fp\nom//3INp8RsW6m9ajNRh0Vp7Qmj2sYSF+J81H9MTu1MzzzSFmwmiUacZ115VJ9Qp267p4td31qg9\nURceugkL8TdNv+8wL6q9C8yq10SGBQ5IA5ctbt163uzfrvn5aIivtqdaq6ajbabE22tvQGSEdcVg\nx3SaLuLfr4NXlFm09OS46HEv37/82PpXN08DvxLkgqChS3e2nfwwiBp1/3zjUoiNLGOZWsEpCKWs\nn9dnpwLiV6W6bZDnMCGBvqZO23JKaZC9L2l7L4yZlX9MdJjD/IkDCSNLvC//4aJ4LSMpNm1XNDWm\n6VQqgZpN26aLqy6YMWPdygyBiaj4QUJThwbO/SpMr9EO0avVCXq1OkGvUY9ndbqRQn4YvX604thz\nKW377ur5XDy2esGopBKx6QT2g6NVkj0h3AKgpx7EyGEhgS4Ors9R6qWBK3+8QMpS8/qErRUVaUa9\nXlg+mc6oi1JQxmrTtH7VwrTpCSOExjfyQhoSPyZ8ya8qQOSu3D9EW/17Rstf12bxrs7ioQeJWGyZ\npd5hPUSbQkgIUcDEfhQdFewwLmogUi0PjLnzj4U1AP3Hn5RSUXNxSSJlWWFFZwzN01H2KKf98bPn\nrpssbKT8kYZMiA1b9FULIURYlWMO9LLDGc07Lt0/gM3CA5ogfx/L+p0Oc4Q42jT2KDGGhgWFo1Mo\nzxoFTTc5dZHTX89O3ntf6tG56PrioZT1bSouioyMG19LRCKHaemsUBekoPbDLAxfk2HaLJVI3Fow\nxxFeEbMSLvv1DneHWqUBHX2azoTD3/KsJDIswLKKsEPNuSMlQm33f6QSsZdYJDpLazcA3+eOT9tS\nFGuW5Jc1GCOby8u0AITNJDZMF4MEXlEz1MVsa4OFcaMiLL+8HKbndCSEpaYHwQG+fZp71N08uycl\n41SjhelCox3bVlNdBaFRF3Uf8J9FPQxa4sdEWn55VTi6x5EQlpkeDI8KOutz4N3+23kprRqfo6Zt\n2vaOKYommUCnbNqny08PA5v4mEhTQz2FhQxx4UgIzYzT8WOG9lvaQ3dhZInXlRsvnqAzSopM25VN\njfN0SuXufhqWh0HCjIkjTWMHa51x4nAkhGbJhKZOGN6rpdH4IBKRpsVzEnZPHDuUd9yg0iAJuGHz\nEh+WJWaarNbKynTGaHCpiq8nGLbvSEsal+XnIxXmnN8LEEKaI8MCI0yaimxebIJdISSE1AHosXvM\nmxHb3/sfGjUkMPf5uy86XfzH4+EfP3NN5gOrFgoynVS0B426Z8f8OpgWIKVU1FJaPgquOU7alUJC\nWSstoKsZ4OkgqOzGVzVKAMWG56+bW/DbY/FfvnhDUdzoyGPo52Dr8BD/KosmpzLiOVPvuwDAHACI\nHRE2ghB0UOo4l6I7IYQ0L02flPuf286Pj44MnmR6bv7suImEkFZK+VeMOlQzdIqBFZdLRUxPjQ3G\noI8CUAMnSlp56D9GRYflSiTiFADISB43/u/kOyFrUza//PGfuZt2nIxjWNZhIRZ3M3HcMMulp1MR\nNs74OfYoMQghJDjAt9Lexe4kKNC3aP2qhUcLfvtP0LuPr8iIjgweanmNWCQSjxk+xL1LEnpup684\nG7h4wWSrnI8RoQHhr6y/NCN/66Ohd12fudfPR+rUctBdpE6LsfSOOcp5oQXOCGGO6UF8bFSbrQvd\nhGZy3LB9P7xxU/6ZzY+MX7cyY6avt9Su68+Nl6S4dwQDMKmVBzMMqy9LmWTrpI+31PeBfy1IK/jt\nsfGfPHPdydHRoQfRB0vVudNjTfeDRpi4fdqD10wIAOelTugVlbyXRFJ7/cWzDp38+RHm9/dvnzc7\nMSbB2XuvXZqURIhZQVEPg5joyJCTQ4L9ndp+nDcnfureL+9Nyf7m/vZlGZMOiMXmfsRuRD1p7NAY\nk+M8QojDWELAOSEsgIn/24XpE91Zo5BGhAYce/n+5YeLtj027Lm7l80ODfINsH8HY4Qix6ymvbeX\nxGta/IjTbhyXYDyeI73PTZelmNeFpyzjKO5jeFRw+LuPXzWn6PfHg59Ye0F2SJDfSXeOKTwkoEAi\nEZtOUE57UjkUQkIIC6AnRGdEVMgwiVhczW+IFn0CipTEmD07Pl5bkbPpwRlXX5g0S0SI/bEYGptR\n+UI2cq9oR8UzU6CrN3Ohu3/VfIclqAYvA8Hv0rUhOPrzdyMipP2Gi5PNi5fKNmbjzBWNqHgmiytV\npSlSidhr9WWpqad+fnjq7+/fXp0yNSabEGLp78mbtJmxlo4sezkv5MAZ7SgAZAFY0n0wblR4ZUF5\n40hnH9JNoL/PmQdWLVRctyxphpdUku74DkrRkX0c9Z8wMLQkAfgn6LThqyKMXt9TBTV95rgpAb7e\neUqNbiLfcVk9lVBCPNvCAUl68riTPt5SM6d5NG8NAGWGQpEzFIW36uAVuRNDV4kQnJIGEJs+sJPj\nho3c+PpNI/UGo+7rrTnZr2/YGdCh0AgqjHPl4umWFXqdtl87GwVuJtVL0vi/5zNHafcf+zCNXXXp\n7FSTKqbcsFot6j89jNyrqlH18gwYWpKtxio/OM5yCXLrVXMtY7mcwbN87BcE2Tbpo7eeP9qsRVtV\nAUZpWo3LG/qmBah6KRNnVlSi9sMssCq77pZeUon3qktnp57e/MiUd2+N2k74ZzdWpUyNiTc5rieE\nOHTc7sZZITwCk/oO11yYFAeeL29pE+Jbd62a1PBdfH3bnluyGHmZpWET0NcXofzx7ci7RoXmX2eB\n1Y+y3SMzHPKjZikHb7963myRqNc23h76maFhgTnxMRalwRs2VMLWWpgaYtH6ewZyVwLlj2VBV2v9\nzgEAZRhN1R/HZL9fsH+a4a3JlKd2PGJIoOV+cCef+51ajhJC9JTSLAAXAsCwiKAoPx9pkVprcLoM\nWZvWJ1ypl+YGeBkmaWt3DdPW7mJEvkOPBE66jfGLiJGi4QsjDE0zAThf2qz+Ux2CknsOvaQS6QXp\nE3N/252b6XQfHs4aXnrgErNyfWC1KihyEh3fSQOhPJ2BorWAOOA0oq5WYsiFyfqmw8cUp15vM7Qc\nn0opnQEAp2XhewDw8gxLT7LaD27jcz+fpERbTQ9Sp8fyLkG2v3qE6SwlZjUNyR1Hn0wxlj6rhqFp\nNnjGsEFfPxvaMrNwqxfvWZ5EiMD4wH8QvCGklPUsb3uBkCC/k/NnxZnvgxq/yYET5ajNYJRTUPdx\navuf8w607Fw5S9987HxKaY8TyAdHp4bzHdvNl8+JMTlk0YtCuN304PqLknlrIz/ImTIGHMvYjtp6\n3i5nXYhQ/baZljQ40Cfw4vlT3Kp+HnBYeIkPBqdxkcj+F99L915svomkjBEtv/EvCAsAlDZrW2VW\nHh46o6ToWH0UL4WHl5e4bFLcsBiTpuOEELsFYCxxWggJIWUw8YXLnBU3WSwijXweVisPGK3QeVl5\nEehVqkmUYYSVf9aWz4a+sda06aX7lyfx/SA8DFyiwoIOXZA+cbpZY/PWw6CMlRujMxg0qjxKqZUX\n1ray0bwzRyyaHW+5z/yZbx98c2T2LElFhIimTxzJ22dza3Esp9ubqqVVqNBIUfuOWRVdPx8v/2uX\nJnnS0w8O2I+fuTbSrIUyBjR9KdRBm7bXNnAp/Iwf5STynllvWTFvmEXTZr598BXCb0wPbl0xj/eS\n9OOcxBmUWmegUjXLZkBorhflqRTo6ipMm55et3Sut5fEoZqYcHwGZCDYvj0AACbHDTswNT7a3Eur\n8buDYI0xQvqjDHPCqNNa3dus9j0pU/laCpRdpBJxVdLEEaamiTxCCO8vf15CSAg5BaAnme6i1PGT\n+JoElAZJwLH6CCvvcpZl/XVKudAqR94of9pMUSSViCVvPHSZY6GmrFszZp/9u7OBg4iQ9i9euN48\nhSSrUaJ5k9N+xZZ01NZx/on+d2QabwfveTNiLb/kec+CgLCU7d93/0csEolnTYnJ49vBKwdmxYDD\nWtteUzcZThTQ4MTQkAJFjtm30LLMydNGRIXa9eEjDhQCAjhX5dDtv/cd16SfDg8NMF9t1b5/FJTy\n1mB2wpZo5B0zLFsNjKh0W8mYZK477HHfvxZYLom/4bzQAUKE8GvTg0dvXcx7bV7eHjymSeNnlUaC\nNRrDDWrNMQFj6qT6ddbSi+bHt1bHEIsKU6ZQatut6WyBr3F5YGL+K4QE+p564KYFc80a9Y21aM/i\nLSzdKJpaOM1qm/LH11LKTxYC/X3OTI0fHmfSdEzIUhQQIISEkAKY+MVNjR8eFxTgyzuC4d1D0zhD\notpra4ZDWPpBgFFNQcOXu02bhkUERb1433KbwZ02nEQHwUt99kIIad/24R2RVk79pQ81APDnvss+\nlGXLlE1NVgVvKEjr+zmJM7nuscetK+Zahs59LmRcgPAKQl+YHtxw8SzesXzbS0ZP0zOiUst2o04X\nY9RqeCdv6kH20yxL96RrlibNjh8TeZDrcgL37gk9uM79/1pQYJVFQfbLARjbk2zc4hBFQ2MdQK1W\nPYdqhp7WGiR+XPfYggCKm69INTWZ6GGyTeOL0Bfwe+CfstS3XzNvOnEi574pLIjovSPTOO0yrZVV\ncTBNwMQPf5Q92m65Rdn0xs0JUglHCJazMTQe+oSY4UOy71qZYW5IZxTtaNwwVmiflGXLVK2tczlO\nKZ7aM2cC3/6mTRh5ws/Hy3RG/pkQIjgxtqAXsCuX4nfdx4F+3gHzksY6lU/DlO/OxM/RM+ISy3bG\nYIg2qNXCUw8a2xPR9IPZbBoc6BP8839vUQKmNe0BsL1fT9Ax56ouxxxvL0nJtg/vsPQFpSi5/wwo\nGyW0X0VTQxNArbYYB6qHnWhVe/Pu98k7L7AMW3pf6NgA1wpavm168Ozdy8aB516OBRF9fmIi52a5\nrao6DtSkkhJfGr+dCl21mYAnxkcn3HPDfDOPHS7tKGWt0xI6Cx0MPmT9QHCAj/ePb90stZhhgPpP\n90LfNE9ov6zRmKNqbuVKQtTx+O65vE0dQQG+p6cnjDB1bctHZ7ytYAQLISHkBICeug5jhoeNHDUs\nlPfsteHk5NkGVmxlVGeMhihNW7sLxVZoIEoeIGB1WtPW+26cPytxfHRPfCTh6zQ+ABkMGTWWL5gy\nLXF8tHmsoKa4HM2/ulJtythSWcHpULKzfOQxhc6Lt6njiTuWaC2a/kcIcekP4OpSzGw2fOaupbw2\nuABgZIn0hX3JnD6o7XW16ZSlwtPWsbqxKH3E6oth8//WzBkWEXwcACilA2A5enYh6oU6vsTSTYnV\nKFH2KAOLitF8MKg1h4wardVekoK0Prc3xcpe6Ahfb0nRFYunmWpSWwFsEDq+blx9AX+GSeWm+bPG\nJw4J5p9A57ei2JQOrTfXfZKOmhrX8n9oy9LQssWs2ItELBLv/GzdeD9fr3zAI4QDD8qgaN1psPpx\nLvTR0lJZwbnc/Kkg7rRSL+WdwPr+VYuaLb4s3ieECN8ydeHSC0gIYQC8aNr2omXIiZM8+He6Fzi8\naDTyjhlGrXq3oAF2U/fJdCiOm0Vp+Pt6+Wd9fncYIWKOD9HjPNqvVL6wG4ZmK5seHxT1TYWUYaxC\n5LRGcckbB5K4NKV2kUrEVasvTzFdGusB/M+VMXbjjllgA0wKIS5JmzhdyGx4oj4i4URjOKd9sLm8\nIomy1GHFUzv4oOKpodBWmJWpigoPjPQddSFvtzszLFZmHrWMi7RszYb88AJXumAM+qPKFtkcjlP0\nwb8yNAaWOJvgrIe116ZXiUUiU/3Bh4QQtxTNdVkICSEGAG+Ytj1151JB2Y4f2LEgkaGw+sUowwa2\nV9c0wjVdfihK7pfC2GJmzwlKfmIq4PqSwoMbkGcfRt3HM+Cax1JHa1k5pytlRVtw9qGaobyzqUkl\n4qp116XPMmnSAXhZ6AAtcdd+6AOYFENcvmBKUviQgBN8O1HoJCFvH5rBGX6kVXRMN2i0+7nOOQ1l\nRqJoXRNYbY/QibxCQ70ikw+bXiYg21b/MjBG69oSXnn8NCpfmgwXFDEA0F5bd8ZoMFgJIaVQ3Ll9\nvqA95hN3LGmQSsSmQcDvE0Jcyr1riluEkBCih8Xe8KOnrvWFgLx2356ZMEem8uU0/LeUl05zSVsK\nAIx6MvJXVYOR96RHDEl5OR6AaYERz56wL9HVVqH8mSgAvLXrphg0mgOaNk7PGHyUk3hMpvSL5Dpn\nj6AA39PXXzzL1GlcA+AVoWPkwp2awU8B9OyvkiaOiE8cHy1o5rrxlwvHsNTaDYiyNKC5tEwEoeFO\n3bCaCShY0wxjRwcAiP1HREuCxrlUHLRvGRhTn1vQVhahaJ0EYHkLcIFtCAAAFx1JREFUiCmU0vLW\n8vKpXOfqlf45n5yYnMF1zgHshuevk1poRF8hhNTavEMAbhPCLk3p06Zt7z959ThYuok5QYvaO+y1\n7Jmctb6NOs04VVvrYa5zvGC141F4Wx0YRTsADEl7Jwr9XGTy7EbAF4OmqAgl9wwBXKwlSKi8uaSU\nsCxrFWHBUtK4avMSO/lrbTNmRNihpEmjTH1LmwC8JnSYtnC3jWwjTKo4jYgKGXbF4umCBGZTXlxK\nblP4bq5z8tq6DING44I3TResJgH5q5qhqy0VB40d647ZkHXktuaac8WAhfBdwuvqAlHycIjwAN1/\nkNc1FHGlrABAn8pKLW3TekdwnHOE7rPnVloWin3KmRr0fHGrEHa579wOEx/Sl+6/eI63l4RzVnPE\nuj/mJxtYMee9LWVlUynLCA8A7oYax6Fo7RDID58ImfdONDpnQ0vXJA+O4LuLNnZMd3UJCgA6peJv\nVUsLZzxgYcuQfdtKYrhMFQ5ZviAxO3ZEmGm9lTMAPhTSlyPc7i1CCDkK4K3uY6lE7PXhU1crIWC9\nojJI/Vf/slhMKbVa0lJKfWRFJcMByjsJMQehqHw+Xmosqhd5BedTlnH7t12vQq0jBM4FGKPxaGtF\nJedeT2OUFN6y5bxZXOcc4efrlf/Gw5eZOo2zAG4ihPTKdqW3XLaeAtBjXJ8/a3xifEzkASEdFbaE\njv7v4SRObSljNEQ1l5apwTOW0Qa+qPtgZtioSDmIyMcN/Z1TsGzfapQpy56WFRZNAkcpB5aS5mt+\nXOqnM4qFmDuYz59bSSVikWm/XxNCek1x1ytC2LVuvte07fvXVyWIeCYL7uab0xPSc2VhnPXeDBpN\nbFtlVRHcs4SUSHy85xKRiHegp4e+g1Ja3lRcNJxS1pfjtPHRv+eV1yv8eZfuA4B5M2L3pUyNMQ1V\nagfwoKCBOkmvOS8TQjYC+KX7eEiw/5B3HruyFgL162u2LJ4jU/lzOgBoFfIkRWNjDgTW2/JwFkGp\nrLmklLAGI2fphN9LxmTvrBgpKBmUt5ek7PPnV1rGHq4jhLhjy2OT3o4guAcmJoql6ZNnTBw7VJDt\n0MgS8YpNS2N1RnEB13mlTDZX0dCYjf4XxMGp/nQA7YuqqhRNspKSNhuaUJS1B+1/OitVaAAw+7//\nXCm3qJ35JyyyC/YGvSqEhJAKAE+atm18/aZEiURUI6Q/tUESdM2PSwO5DPkAoGyWzVXKmnah/wXR\ng/tpbS4r7TDqdJyp6htV/vtX/rh0ltD0jxemTdxz/tyEaSZNSgBrXA3YdYa+iKV7DSZFE4MCfIJ+\neusWNQR6vdQqAoav3nKeBiCc2bUVjU0LVS2te3EOzUgDIXJD1KsfN21rKS+vN2g0cVxnlXqv/Kt/\nXDqDoYQzjaYjIkIDjr37xFWW5dvXdk0ivU6vCyEhhAVwA4CW7rZpE4aPX315qmBtU15T+Ojbf1tQ\nSzu/rayQ19dlyOsbs2HuD+rhbITSOllxabtepZrEdVpnlBQt/275cLVewqWkcYhIRBq3fXTHKIsc\np98RQr6weZOb6ZOo8i5fu3WmbY/fviQtOjJYsPvZsfqoif/+a14ebGhFVS2yOW2V1WdAuQXVAzcS\niagmddqYrEB/H6sSdnahvRIIXd1UXGI06rRjuE4aWVHttT8v8VPqpUEC+6evP3R5dURogKnXTj0s\n3tXeps9SOxBCvgXwnskx2fbB7eOlEnGF0D53Voya9eK+WSdhI0epVtExvbWyqgyduUD6BMoOhMUh\nL6ivj7Rgaeak3T+/vaawbPuTI75/bVVGRKi/O2yvwgfFGE805RcGMHodp9+nkRUVX7pxOa3pCLJ0\nLXOaBbPHZ122yCz7NgPghr6ubck7wthF7gKQACATAEKC/EL++vROxfx//beVZamgar0/F4ybLVP7\nnXx18e6xBAiwPK9TyhNlxUXV4ePi2gghghPIDhYIIa1Dw4NK05Ni1UszJw2ZNSUm1s/HawIAl2yj\nlCOvp1CMOt2+5pKSWVyFPAFAz4hLLv1+eUiz2keITygAIHZE+IHPnrvO0tvmEULIX0L7FEqfCiEh\nxEgpvQpADoARQGeqxDcfvvzEXc9vCobA9IP7qqKn3vnHgpz/LdkZS4h1DXOjTj+ysSBfGTEu7ohY\nKhVcUOQswigSkbYAP5+GkUODOxJihxmnJQz3mT5hRHjC2KExErHI4WfQT9M51crlWW1VVRmw4Y1q\nZMUVV25a5u+KAPr7Sku2vnfrdIsQpU0AXhXapyv09UwIQkgTpfQadGpMpQBwycLEaYdPV2Z9teWI\nkJgvAMDR2qFJd/6+MPftpTsZEaw98ynDBsiKiqaGxYzJkvr7CX7OQOT9J68K0BmMuUPDg4PCQ/yD\ngwJ8ggBEdP2cJVBZW011kbZdnmnrCq1RUnjlD8tCmlR+grNxi0REtv3Dtb4Bft6mipxS9JE5gnNM\n/fFQQsg+AHeatj1/z0UZC2aP3+1Kv0froyYt/3Y5ozVIOKPvKaVezeVlGe21tUcAarNc2tlG0qRR\nE+ZMi50UOyJsZJcAugzvROIuOJFTlj0jKywyaNvlNrOgVXUEZp/35eWjXRFAAKpNb6xuGRU9ZLhJ\nWzOA8wgh/fY+9FvOTULIh7Co7vTpc9eljxsVLsjRu5smlV/UJd9fHK7US21q9zRtbcnNJSVyyrCu\nZVo722F1aihyTqH2Q5fSuLsANWjUexoLCmK58sJ0kycL23vtj8uS9YzYFcd65qk7l56aOdksSLdb\nEeOwrHpv0ufLUQtuBTAeQAoAiAgRbf9o7cyUq187JmtT8s6Q3E2b1mfI+V9d4ffBsj//nBzZfB7X\nNQatbnRDfh4NjBq6NyAifAYE1r2zhA7UnPSMog2aslqo89uhPM1CUxoBVhsHIBGAGsPXuNQ932mQ\nUlS0VVY06ZRKSyO5KcYfC8bvf3nfTFe3D/S+Gxdkr7p0tqVL2wOEkD9c7Ntl+lUICSFaSulSALvQ\n+TJAKhF77fnynviUq1871aHUWFbocRojS3xW/7r4vAfmHM26cmLRXHD/rkTR2JCmlXcUh40Zw/RF\n9IRbVIiKIy1glNYBzYzSAGOLHvpmFoZWwNgmhrElCIxyOCgNA6yVVl1YfXHQ3rH7AQCMWt3+1oqy\nSYyRibF1DcuSlof/nledVTnS5f37TZel7L3nhkxLYX+NEPKmq327g/6eCUEIaaWULgawF0Ac0Jkd\n+8C398XOufb10x0KDe88kaa8emBmRk7d0OPPL9o7kkthAwAGjSauIS+PCYyI2hEwNCIJFJalrwYW\nzVvSgS39PQoLHMsspbS4rbqqQydX2M2ArTZK8lf+eEFwrSJwmr3rnOHy86bufnLthZkWzV8BWO9q\n3+5iQNRhIIQ0ArgIQI8/aKCfd8CBr++LCebrucHBrooR0y/65lLarPbNsXOZWCFrXNyUX2g06nTZ\ndq7zwIGDKAqdTinf3ZiXP0InV9grTU1z6qOyzv/y8jG1ikDXkj8BOH9uwu43Hr4806L5D3RGyQ+Y\nbcOAEEIAIIQUAlgKoCe1RKC/d+CBb+8fHRzoe9rV/pvVPhFLv7l0xqfHJ28DbNc9ZIyGKFlxcWpL\nWVk+ZRje6fzPTrheSLcEojAGtWZvU0Fhe2tFVaaNINzOCympvHtb5uE7fluY4aICBkDnDPjR09dk\nWjRnA7iiK2v8gGHACCEAEEL2AzgPndHMADoF8dB398eGhwS4ntQJIB/kJC5Z/ev5tVqDhDMusRu9\nWp3QkJ+fqGhs3M+nDsY5WyOUNTdRsEbjiZbyssLmstI0xmiwa1aoUwYcvOjbywIO1kS7UouwG7r6\n8tQ9HDPgaQBLCSG8U3D2NgNKCAGAEHIYwBzgn5oUfj5e/oe/v39KzPAhblkmnmkKHz9/w5XjPz8x\naa+9WREAUcpkcxvy84a219YeoZTJt3NtN2ejFLprzKxRq9vfXFpe1FhQME2vUk+0dzHDimqezJpz\n9NLvLk5pUXu7Yx9ueGLtBQefuOMCSyXMYQDp/WkLtMeAE0IAIITkA1iCzmSrAACJRCzd+em6mRPH\nDuWs3MQXFkT03tGpaf/6ZUm9PZsiAIBSkaatLbkhryBeXl+XTVkm1x1jGDAQ6+mb74TOUiagpbys\nQFZSPNegUXEG3pp2f6YpfM/iry4P+qM4xt4ekQ/aZ+5amrP6slTLkmrH0TkDtnPdNBAYkEIIAISQ\nUwDmw2RGlEjE0m0f3jH3mqVJ2+CmTUu+LGzcwi+unPzMnpQjDOsg4p9SkaqlNbUhL3+SrLikXKdU\n7gEVeXKUotMt0NHMBwBNGt8j1/10QfnqXxenuxCCZIZYRGp//u8tRTcun22ZH2YjOmfAPo2K4MuA\nFUIAIITk/b+9cw9q6srj+PfcJCQBAkEIL0EQER+rsihSX8ha1xZrWWvro7XWdl9Vu9u1VbdsHZ3t\nOuvO1tmturWddsdpLeq61drZXbTrY7aCitYHioIvxAdUITEQIJCEJPfes39c4sSQ8DKEJOQzw8Dc\n3OQeBr733HN+v9/3B6Hiwt4AmLy/am7ump/OPAWhUaNbOFCZMvGpXS+Ef3cvrhguSqPsYc1tQ3V3\n707X3Lgi501ar/4jdwl1ulPo1jihhRNVrv926vG83fMmVukiUtz1uTKpuKpox0o64QeJjjHlTwC8\nSAjx+npSrxYhABBCKgFkAvif/fHfLMmZtmvT0mqRiGjdda1Wi0Sx8tCMnGd2P68tVcf+F92wUeRZ\nNrrx9Fv+9XjqRngQ7b6racVPFixIOnI7qbPsmB6TGBtRduGr/ISkwYMcawo3EEJWeFMYojO8XoQA\n0L6gngNgp/3x6RNSh5fsWsWFBkvdKoIGkyzhjQNPzn7xqznqu43hp2Bn6+8Mi/rMRN6kqQN8c1cG\nfTBsnhLNnvKRh7I/XxT8l1OZOVaOeay+gw7QnMzU4uM7V44NDZbahzNYAKsJIb9347X6HJ8QIQAQ\nQswAXgWwDnb/NPHR4bFlX+enpo8c7NQc+HG40xSevGj/nCkL9+bVlmmijoO66DBFENx4etXj9U3s\nVzpuw/C9XHFzlKktrEwpnrVzvnzLmfG5LMe4JSfXBsMQ3eZ3nj+/8/2lOQ7tq+sBPEUI+cCd1/ME\n/Z621hPaHy82UkpLAXwJIAwAgiRiaeFHy7L3HCy99O6W/wzheeoqR7JXVOsVicsKn0pUSs261VNK\nz85MqUkTkUfbeVk0ZyZx+jt3gMgeN7rkrByBsA5152zRGQbK83dZc1tDW4uBMbe2qEJC9lfJU17o\nbcEzbWyTlWz5brz1SFVSNg/y2NkuzlBFhJYXfrwsPj463HGcZwA8TwjpdjzXm/ApEdoghByilM4C\nsA/AQw+Sl+ZMSM+ZmKp+ZsUnF3VNhgx3X7fJLB20/tiUH60/NoXLHKw+uXrSBWNKRFM2ADkAaUPR\naw8wuTC5p58ruMPVcYw06HupTPZAIpcbxDIZz4glEpFYJCMME04YRgpAAaHaw7m1H6F6SmEilJgo\nz+l5ljPwrNXCsVZqMZqDWLMxzNpmjuVZNgrAI+5lTWfeMYhC4i4FxUxx2mjTOaT5siby0razGapL\nGlVvTXe7A/fsjLEnPlz7QrbD7AcIN+OfeWMQvrv4dDcfSmkEhHZV8+2P85Ty7207eGLHv85mQRBI\nnxEdYtS8nlF+fdbw6niZiE21jN5UlL2qbIar87fmHiuelFDnpZX9pDFqdmGjRDkyZfLiv565r2l2\nmsGSrNTXTE26d29fxYjx7kgx6wxpkLhqx5+WmKdmpDhaHloBrIVQDeGjS3EBnxahDUrpAghiVNof\nr6zW1s5fub2pqcXUZfzKHcSEGtUjottuHb89yGWVgHeLECBEVKfK+xbTfvnPGlci9BDWvBljz23O\nn5cVJBE7PrGVA3iJEOIXu9I+szHTGYSQfQCmArhsfzwtSRV/8ev8Ea/OzSom7mmf1ima1uDYzgTo\nC1DKxWm/mW0MFhv67QYdLA+69u9tr9/5aN2CKU4E+A8A0/xFgICfzIQ2KKUyAJsg+Nc88ruptXrN\ny/lf3LpZrZ3s+Jon+XlGxcnXflgRFyTik9FLd7k+gDWz4tt3m8M0Z+/H0hPVg1VXtFGpLN87W/ne\nQgjRv/xs5sUNb86Z6tAfEBCS+t8ihHzhyTF5Ar8SoQ1K6dMAPgWQ5Pja0VM3Lr25ca/c2GbtKr+x\nT5FJWOO4aO3tyYkaXUasmsSGGhRhUkukiNA49N2GGeUouddglKtv6ZTGyw+iRBfUMZHX6yOS2qzi\nHu/quhE+fUR8yWcbl4xycMO2UQhgua/ufnaFX4oQeDgr/g7C4v2ROzrH8/TD3cdLtxQUJfM877Ta\nvr+QMJSNUbSohymb6weHtRpjQ41slNzER4YYGaXUIlYEWaQM09F6guXAt3Fia4s5iDVaRHwrK6V1\nLSHMnaYwaW2LIrSmWRHZYJRHenp264pIZWjFZ39crMgYldDhhgngPgTxHfD0uDyJ34rQBqV0EoBt\nACY4vtZiMLe8/eevS4+evp5JKe3g3h2g75BJJTfXLX+6YelPshyTrgEhGaMAQH6764Jf4/ciBAAq\neGLOh9CmrUMbZYPJYnhv28Hzew+XpVNKlR0+IIDbUIRIr2xaM9c8Z/oYV256hwG83V7ONiAYECK0\n0R5XXAvgV3ASP2xoMuje3VJ4+fDJa+Mo7V1vjADOCZZJKtcue1r3St7EJxzs523UQlg+7PL1uF9P\nGVAitEEF+7/fAlgJoEOw2cpylk+/LDm3dVdRrNnCDvgmMo+BKX3k4PPrl+dGZY1NGuXinFoAfwDw\nubd5v3iKASlCG5TS4QA2AFgIJzFTjue5fYculm4uKCJ12ubx8J6QglcjYogmd9roa+tX5I6Mjw6P\ndXGaHsAHADYTQvQuzhkQDGgR2qCUjgCQD2AJXORl3tM01W38++EbR05eT7GynNOeeQMcTjVIUfbr\nxdMtr+RlZorFIle7sFoAHwP4GyHEY30jvZmACO2glCYCWAPgFwBcxs2Ol96q2FpQpCu9WjOmt30V\n/QReqZBXLMwd37Rs0dTRLmJ8NiohzHwFhBCTh8bnEwRE6ARKqQqCEJfBScDfBsvx7NGS6+Xb959u\nuXD1+zSO5109evkTNDRYevW5mePq33gpOy0hRhnXybk8gKMQZr4DhBC3+AL5GwERdgKllAHwDIAV\nENzfXObaUkrp6Ut3ru45eEF7orQqQtdsHAXAaadZX0MsYmpHpsTcfm5mOjPvx+PSupjxAMGc63MA\n2/u745EvEBBhN6GUDoVQ2b8I3WgtbWyzGI6UXL92sPhK67nyGqVOb0hDJ4+43oRYxNTGR4fX5E4b\nbVmQmzFkRHJ0cjfe1gbgGwh9Hg4M1J3O3hAQYS+glI6DIMaFAFK78x6W49nSKzU3i8/dqj9fUU0r\nqx+EN+pNSf2cHEAlElFNQoyyNmvMEEtO1nDF5PShyZHKkO6uczkARRAqG/YTQpo7Pz2AMwIifEwo\npRkAZrd/TUIPk68b9cbGm9Va9bXb6uYrN+vM1XWNqNe1ihv1JnmryaywWNnw9s2fniZ1GxiGtIrF\njEERImtWKUMNwxKj2GFJKtHwIarg1CEqZUpiZJxcKunp7FwPYZ13CMDhgZBW1tcEROhG2me1WRDW\nj9lob/XmDrSNrQ0tBvNDC4fmFpPJynIPXeBEDCER4SEhEWHy0LBQWZgTG4je0grgFITWdYcBlAY2\nWNxLQIR9CKU0CsATEGbISRD8U705N5VCMFq+CKAEwEkAZYQQtl9H5ecEROhhKKUJAEYDGAtgVPv3\noQBUnhwGgHsAqiDE78oguBKUE0L63IEgwKMEROglUErlAJIhuMcNgVDtoYTQ4lpp97Mt8Twcj4ZM\nTBB2KPUQTHAbIKzfGux+roUgvCpCSKCHRoAAAQIECBDAC/g/+U2JAJjwHbcAAAAASUVORK5CYII=\n",
      "Sun_Belt_Conference.png-64": "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\n1tJJJ96i9Xk/Fi8tuMFIuq4z993BgCa3vbIqsSjpU9iI5lXaevry8mdWN7umsmYdVy5rSY01HwBW\nrQ0vnlnU6zZpF5gaFFldX1sDtKaTijLNmYUrmpcEdOHNPunxMFP7PCYGiKRshpjX2f0FgOlLXG+W\n+PqtALSyNfO8taHvgEZcce9nOP2YvT4zZOCyAk+0BGSgOuZeEwlXRjqaIyEIl971Qeu+u+789z8e\nOWiBR8RLmKCdcUCEE0b1I++2vP/FzBOj59z2MToOfARNW+Z/f2Wur9bR0ZIfS+2sEolYghsX1zWH\ngFXZxN7tTaZMWvPMYFYbN6sFqHv3vHY26Ybgl+3OkXkk0ucA0GmBDNPdM/nb1oa/nVHgI/V6KP1e\nZym9HTdpnbXZuUidj61zwTxrEw1fG8G8KK2ib+h2ePLqMWB+Lz3WzOvpYH7bORvbjaOLDWg7tvlT\nc7EKzM0Z4w5vxCw7GufG4E+nddMmxkFO92fahNDhdEOUzs5T+fphG+0+/ZLo/wDfm+Avjj9E2AAA\nAF90RVh0Y29tbWVudABGaWxlIHNvdXJjZTogaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9G\naWxlOk5ld19sb2dvX2Zvcl90aGVfU3VuX0JlbHRfQ29uZmVyZW5jZS5wbmfFykw1AAAAJXRFWHRk\nYXRlOmNyZWF0ZQAyMDE1LTA2LTEyVDEyOjU2OjUwKzAwOjAwZdDLYAAAACV0RVh0ZGF0ZTptb2Rp\nZnkAMjAxNS0wNi0xMlQxMjo1Njo1MCswMDowMBSNc9wAAABGdEVYdHNvZnR3YXJlAEltYWdlTWFn\naWNrIDYuNi45LTcgMjAxNC0wMy0wNiBRMTYgaHR0cDovL3d3dy5pbWFnZW1hZ2ljay5vcmeB07PD\nAAAAGHRFWHRUaHVtYjo6RG9jdW1lbnQ6OlBhZ2VzADGn/7svAAAAGHRFWHRUaHVtYjo6SW1hZ2U6\nOmhlaWdodAAyNzKTxeFSAAAAF3RFWHRUaHVtYjo6SW1hZ2U6OldpZHRoADM2NlDdLbAAAAAZdEVY\ndFRodW1iOjpNaW1ldHlwZQBpbWFnZS9wbmc/slZOAAAAF3RFWHRUaHVtYjo6TVRpbWUAMTQzNDEx\nMzgxMKW4QRcAAAATdEVYdFRodW1iOjpTaXplADQ3LjRLQkJSMkLxAAAAM3RFWHRUaHVtYjo6VVJJ\nAGZpbGU6Ly8vdG1wL2xvY2FsY29weV8wMTRiOWQ3NjBkYTQtMS5wbmdWvn3wAAAAAElFTkSuQmCC\n"
    }
  };

  exports.conference_logos_64 = images.conference_logos_64;

}).call(this);

},{}],46:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  //!/usr/bin/env coffee
  // -*- coding: utf-8 -*-

  //  db_schema.coffee

  // comparison function suitable for sorting by column

  var _by_, db_schema;

  _by_ = function(col) {
    return function(a, b) {
      var a_val, b_val;
      a_val = a[col]().valueOf();
      b_val = b[col]().valueOf();
      return (a_val < b_val ? -1 : 1);
    };
  };

  db_schema = {
    conference: {
      abbrev_name: {
        string: {
          primary_key: true
        }
      },
      name: {
        string: {}
      },
      logo: {
        string: {}
      },
      teams: {
        back_reference: {
          table_name: 'team',
          col_name: 'conference_name'
        }
      }
    },
    team: {
      id: {
        integer: {
          primary_key: true
        }
      },
      name: {
        string: {}
      },
      nickname: {
        string: {}
      },
      logo: {
        string: {}
      },
      espn_id: {
        integer: {}
      },
      city: {
        string: {}
      },
      state: {
        string: {}
      },
      conference_name: {
        string: {}
      },
      conference: {
        reference: {
          table_name: 'conference',
          col_name: 'conference_name'
        }
      },
      home_games: {
        back_reference: {
          table_name: 'game',
          col_name: 'home_team_id'
        }
      },
      away_games: {
        back_reference: {
          table_name: 'game',
          col_name: 'visiting_team_id'
        }
      },
      full_name: {
        local_method: {
          method: function() {
            return `${this.name()} ${this.nickname()}`;
          }
        }
      },
      games: {
        local_method: {
          method: async function() {
            var away_games, games, home_games;
            away_games = (await this.away_games());
            home_games = (await this.home_games());
            games = away_games.concat(home_games);
            return games.sort(_by_('date'));
          }
        }
      }
    },
    game: {
      id: {
        integer: {
          primary_key: true
        }
      },
      home_team_id: {
        integer: {}
      },
      visiting_team_id: {
        integer: {}
      },
      date: {
        date: {}
      },
      home_team: {
        reference: {
          table_name: 'team',
          col_name: 'home_team_id'
        }
      },
      visiting_team: {
        reference: {
          table_name: 'team',
          col_name: 'visiting_team_id'
        }
      },
      tickets: {
        back_reference: {
          table_name: 'ticket_lot',
          col_name: 'game_id'
        }
      }
    },
    ticket_user: {
      id: {
        integer: {
          primary_key: true
        }
      },
      name: {
        string: {}
      },
      email: {
        string: {}
      },
      picture: {
        string: {}
      },
      ticket_lots: {
        back_reference: {
          table_name: 'ticket_lot',
          col_name: 'user_id'
        }
      }
    },
    ticket_lot: {
      id: {
        integer: {
          primary_key: true
        }
      },
      user_id: {
        integer: {}
      },
      game_id: {
        integer: {}
      },
      section: {
        string: {}
      },
      row: {
        string: {}
      },
      price: {
        string: {}
      },
      img_path: {
        string: {}
      },
      seller: {
        reference: {
          table_name: 'ticket_user',
          col_name: 'seller_id'
        }
      },
      buyer: {
        reference: {
          table_name: 'ticket_user',
          col_name: 'buyer_id'
        }
      },
      game: {
        reference: {
          table_name: 'game',
          col_name: 'game_id'
        }
      },
      tickets: {
        back_reference: {
          table_name: 'ticket',
          col_name: 'lot_id'
        }
      },
      num_seats: {
        local_method: {
          method: async function() {
            return ((await this.tickets())).length;
          }
        }
      },
      seats: {
        local_method: {
          method: async function() {
            var i, len, ref, results, ticket;
            ref = ((await tickets())).sort();
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              ticket = ref[i];
              results.push(ticket.seat());
            }
            return results;
          }
        }
      }
    },
    ticket: {
      id: {
        string: {
          primary_key: true
        }
      },
      lot_id: {
        string: {}
      },
      seat: {
        string: {}
      },
      lot: {
        reference: {
          name_name: 'ticket_lot',
          col_name: 'lot_id'
        }
      }
    }
  };

  if (typeof window === "undefined" || window === null) {
    exports.db_schema = db_schema;
  }

}).call(this);

},{}],47:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var ImageElements;

  ImageElements = class ImageElements {
    constructor(images) {
      this.add_conference_logos = this.add_conference_logos.bind(this);
      this.add_team_logos = this.add_team_logos.bind(this);
      this.images = images;
      this.div = document.createElement('div');
      this.div.setAttribute('id', 'images');
      this.html = "";
      this.add_conference_logos();
      this.add_team_logos();
      this.div.innerHTML = this.html;
      document.body.appendChild(this.div);
    }

    add_conference_logos() {
      var alt, id, k, ref, results, src, v;
      ref = this.images.conference_logos_64;
      results = [];
      for (k in ref) {
        v = ref[k];
        id = `conference-logo-${k}`;
        src = `data:image/png;base64, ${v}`;
        alt = `logo for ${k}`;
        results.push(this.html += `<img id="${id}" src="${src}" alt="${alt}"> \n`);
      }
      return results;
    }

    add_team_logos() {
      var alt, id, k, ref, results, src, v;
      ref = this.images.team_logos_64;
      results = [];
      for (k in ref) {
        v = ref[k];
        id = `team-logo-${k}`;
        src = `data:image/png;base64, ${v}`;
        alt = `logo for ${k}`;
        results.push(this.html += `<img id="${id}" src="${src}" alt="${alt}"> \n`);
      }
      return results;
    }

  };

  exports.ImageElements = ImageElements;

}).call(this);

},{}],48:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  //!/usr/bin/env coffee

  //  logger.coffee

  // The code below works great in nodejs in which console.log has a
  // shallow depth by default.  The conditional inclusion (not window?)
  // also worked well before I started using browserify to bundle the js,
  // but browserify ignores the condition and chokes on the
  // require('util').  It's ok that it is not included in the browser but
  // I'd like it for CLI clients and servers.
  var inspect, log;

  inspect = require('util').inspect;

  inspect = function(obj) {
    var options;
    options = {
      showHidden: false,
      depth: null,
      colors: true
    };
    return util.inspect(obj, options);
  };

  log = function(heading, ...args) {
    args = args.map(inspect).join('\n');
    return console.log(`\n\n${heading}\n${args}\n\n`);
  };

  exports.log = log;

}).call(this);

},{"util":41}],49:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  //!/usr/bin/env coffee

  //  settings.coffee

  var local_options, log, pg_options, remote_options;

  ({log} = require('./logger'));

  pg_options = {
    host: '/var/run/postgresql',
    database: 'tickets'
  };

  local_options = {
    host: 'localhost',
    port: 8086,
    path: '',
    protocol: 'ws',
    log_level: 2,
    log: log
  };

  remote_options = {
    host: 'alcarruth.net',
    port: 443,
    path: '/wss/tickets_coffee',
    protocol: 'wss',
    log_level: 2,
    log: console.log
  };

  exports.pg_options = pg_options;

  exports.local_options = local_options;

  exports.remote_options = remote_options;

}).call(this);

},{"./logger":48}],50:[function(require,module,exports){
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["conference.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<h1 class=\"main-h1\"> Step 2 - Pick a Game: </h1>\n<div class=\"controls-div\">\n  <p>\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "conference")),"name"), env.opts.autoescape);
output += " schedules - home games in bold\n  </p>\n</div>\n\n";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "conference")),"teams");
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("team", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n\n<div class=\"box\">\n\n  <img class=\"team-logo\"\n       src=\"";
output += runtime.suppressValue((lineno = 13, colno = 22, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((t_4),"logo")})])), env.opts.autoescape);
output += "\">\n  <h3 class=\"team-name\"> ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"name"), env.opts.autoescape);
output += " ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"nickname"), env.opts.autoescape);
output += " </h3>\n\n  <p class=\"schedule-p\">\n    ";
frame = frame.push();
var t_7 = (lineno = 17, colno = 32, runtime.callWrap(runtime.memberLookup((t_4),"schedule"), "team[\"schedule\"]", context, []));
if(t_7) {t_7 = runtime.fromIterator(t_7);
var t_6 = t_7.length;
for(var t_5=0; t_5 < t_7.length; t_5++) {
var t_8 = t_7[t_5];
frame.set("game", t_8);
frame.set("loop.index", t_5 + 1);
frame.set("loop.index0", t_5);
frame.set("loop.revindex", t_6 - t_5);
frame.set("loop.revindex0", t_6 - t_5 - 1);
frame.set("loop.first", t_5 === 0);
frame.set("loop.last", t_5 === t_6 - 1);
frame.set("loop.length", t_6);
output += "\n    ";
if(t_4 == runtime.memberLookup((t_8),"home_team")) {
output += "\n    <a class=\"game-a\" href=\"";
output += runtime.suppressValue((lineno = 19, colno = 38, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["game",runtime.makeKeywordArgs({"game_id": runtime.memberLookup((t_8),"id")})])), env.opts.autoescape);
output += "\">\n      <span class=\"schedule-home-span\">\n        <img class=\"schedule-team-logo\"\n             src=\"";
output += runtime.suppressValue((lineno = 22, colno = 28, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((t_8),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n        ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_8),"visiting_team")),"name"), env.opts.autoescape);
output += " <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_8),"visiting_team")),"nickname"), env.opts.autoescape);
output += " --> \n        ";
output += runtime.suppressValue((lineno = 24, colno = 28, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((t_8),"date")),"strftime"), "game[\"date\"][\"strftime\"]", context, ["%a %b %d"])), env.opts.autoescape);
output += "\n      </span>\n    </a> <br>\n    ";
;
}
else {
output += "\n    <a class=\"game-a\" href=\"";
output += runtime.suppressValue((lineno = 28, colno = 38, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["game",runtime.makeKeywordArgs({"game_id": runtime.memberLookup((t_8),"id")})])), env.opts.autoescape);
output += "\">\n      <span class=\"schedule-away-span\">\n        <img class=\"schedule-team-logo\"\n             src=\"";
output += runtime.suppressValue((lineno = 31, colno = 28, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((t_8),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n        ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_8),"home_team")),"name"), env.opts.autoescape);
output += " <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_8),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n        ";
output += runtime.suppressValue((lineno = 33, colno = 28, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((t_8),"date")),"strftime"), "game[\"date\"][\"strftime\"]", context, ["%a %b %d"])), env.opts.autoescape);
output += "\n      </span>\n    </a> <br>\n    ";
;
}
output += "\n    ";
;
}
}
frame = frame.pop();
output += "\n  </p> <!-- schedule-p -->\n\n</div>\n\n";
;
}
}
frame = frame.pop();
output += "\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["conferences.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<h1 class=\"main-h1\"> Step 1 - Pick a Conference:</h1>\n<div class=\"controls-div\">\n</div>\n\n";
frame = frame.push();
var t_3 = runtime.contextOrFrameLookup(context, frame, "conferences");
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("conference", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n\n<div class=\"conference-box\">\n  <a class=\"conference-a\" href=\"";
output += runtime.suppressValue(runtime.memberLookup((t_4),"abbrev_name"), env.opts.autoescape);
output += "\">\n    <img class=\"conference-logo-img\" src=\"images/conference_logos/";
output += runtime.suppressValue(runtime.memberLookup((t_4),"logo"), env.opts.autoescape);
output += "\">\n\n    <h3> ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"name"), env.opts.autoescape);
output += " </h3>\n    <p>\n      ";
frame = frame.push();
var t_7 = runtime.memberLookup((t_4),"teams");
if(t_7) {t_7 = runtime.fromIterator(t_7);
var t_6 = t_7.length;
for(var t_5=0; t_5 < t_7.length; t_5++) {
var t_8 = t_7[t_5];
frame.set("team", t_8);
frame.set("loop.index", t_5 + 1);
frame.set("loop.index0", t_5);
frame.set("loop.revindex", t_6 - t_5);
frame.set("loop.revindex0", t_6 - t_5 - 1);
frame.set("loop.first", t_5 === 0);
frame.set("loop.last", t_5 === t_6 - 1);
frame.set("loop.length", t_6);
output += "\n      <span class=\"team-name-span\"> ";
output += runtime.suppressValue(runtime.memberLookup((t_8),"name"), env.opts.autoescape);
output += " ";
output += runtime.suppressValue(runtime.memberLookup((t_8),"nickname"), env.opts.autoescape);
output += " </span> <br>\n      ";
;
}
}
frame = frame.pop();
output += "\n    </p>\n  </a>\n</div>\n\n";
;
}
}
frame = frame.pop();
output += "\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["conferences_bak.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<h1 class=\"main-h1\"> Step 1 - Pick a Conference:</h1>\n<div class=\"controls-div\">\n</div>\n\n";
frame = frame.push();
var t_3 = runtime.contextOrFrameLookup(context, frame, "conferences");
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("conference", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n\n<div class=\"conference-box\">\n  <a class=\"conference-a\"\n     href=\"";
output += runtime.suppressValue(runtime.memberLookup((t_4),"abbrev_name"), env.opts.autoescape);
output += "\">\n\n    <h3> ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"name"), env.opts.autoescape);
output += " </h3>\n    <p>\n      ";
frame = frame.push();
var t_7 = runtime.memberLookup((t_4),"teams");
if(t_7) {t_7 = runtime.fromIterator(t_7);
var t_6 = t_7.length;
for(var t_5=0; t_5 < t_7.length; t_5++) {
var t_8 = t_7[t_5];
frame.set("team", t_8);
frame.set("loop.index", t_5 + 1);
frame.set("loop.index0", t_5);
frame.set("loop.revindex", t_6 - t_5);
frame.set("loop.revindex0", t_6 - t_5 - 1);
frame.set("loop.first", t_5 === 0);
frame.set("loop.last", t_5 === t_6 - 1);
frame.set("loop.length", t_6);
output += "\n      <img class=\"team-logo-img\" src=\"";
output += runtime.suppressValue(runtime.memberLookup((t_8),"logo"), env.opts.autoescape);
output += "\">\n      <span class=\"team-name-span\"> ";
output += runtime.suppressValue(runtime.memberLookup((t_8),"name"), env.opts.autoescape);
output += " ";
output += runtime.suppressValue(runtime.memberLookup((t_8),"nickname"), env.opts.autoescape);
output += " </span> <br>\n      ";
;
}
}
frame = frame.pop();
output += "\n    </p>\n  </a>\n</div>\n\n";
;
}
}
frame = frame.pop();
output += "\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["delete_image.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"game-heading\">\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 4, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n  <div class=\"game-at\">\n    at\n  </div>\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 13, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n</div> <!-- game-heading -->\n\n<h3> ";
output += runtime.suppressValue((lineno = 19, colno = 36, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"date")),"strftime"), "ticket_lot[\"game\"][\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " </h3>\n\n\n<div class=\"game-tickets\">\n  Are you sure you want to delete the image for these tickets? <br>\n  <form action=\"";
output += runtime.suppressValue((lineno = 24, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["delete_image",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])), env.opts.autoescape);
output += "\" method = \"POST\">\n    Section: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"section"), env.opts.autoescape);
output += " <br>\n    Row: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"row"), env.opts.autoescape);
output += " <br>\n    First seat: ";
output += runtime.suppressValue(runtime.memberLookup(((lineno = 27, colno = 34, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seats"), "ticket_lot[\"seats\"]", context, []))),0), env.opts.autoescape);
output += " <br>\n    Number of seats: ";
output += runtime.suppressValue((lineno = 28, colno = 43, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"num_seats"), "ticket_lot[\"num_seats\"]", context, [])), env.opts.autoescape);
output += " <br>\n    Price per ticket: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"price"), env.opts.autoescape);
output += " <br>\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")) {
output += "\n    <div class=\"full-row\">\n      <img class=\"tickets-img\"\n           src=\"";
output += runtime.suppressValue((lineno = 33, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")})])), env.opts.autoescape);
output += "\">\n    </div>\n    ";
;
}
output += "\n    <input type=\"hidden\" name=\"_csrf_token\" value=\"";
output += runtime.suppressValue((lineno = 36, colno = 64, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "csrf_token"), "csrf_token", context, [])), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"game_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"id"), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"user_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"user_id"), env.opts.autoescape);
output += "\">\n    <input type=\"submit\" value=\"Confirm Delete Image\">\n  </form>\n</div> <!-- game-tickets -->\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["delete_tickets.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"game-heading\">\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 4, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n  <div class=\"game-at\">\n    at\n  </div>\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 13, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"logo")])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n</div> <!-- game-heading -->\n\n<h3> ";
output += runtime.suppressValue((lineno = 19, colno = 36, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"date")),"strftime"), "ticket_lot[\"game\"][\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " </h3>\n\n\n<div class=\"game-tickets\">\n  Are you sure you want to delete these tickets? <br>\n  <form action=\"";
output += runtime.suppressValue((lineno = 24, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["delete_tickets",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])), env.opts.autoescape);
output += "\" method = \"POST\">\n    Section: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"section"), env.opts.autoescape);
output += " <br>\n    Row: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"row"), env.opts.autoescape);
output += " <br>\n    First seat: ";
output += runtime.suppressValue(runtime.memberLookup(((lineno = 27, colno = 34, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seats"), "ticket_lot[\"seats\"]", context, []))),0), env.opts.autoescape);
output += " <br>\n    Number of seats: ";
output += runtime.suppressValue((lineno = 28, colno = 43, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"num_seats"), "ticket_lot[\"num_seats\"]", context, [])), env.opts.autoescape);
output += " <br>\n    Price per ticket: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"price"), env.opts.autoescape);
output += " <br>\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")) {
output += "\n    <div class=\"full-row\">\n      <img class=\"tickets-img\"\n           src=\"";
output += runtime.suppressValue((lineno = 33, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")})])), env.opts.autoescape);
output += "\">\n    </div>\n    ";
;
}
output += "\n    <input type=\"hidden\" name=\"_csrf_token\" value=\"";
output += runtime.suppressValue((lineno = 36, colno = 64, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "csrf_token"), "csrf_token", context, [])), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"game_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"id"), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"user_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"user_id"), env.opts.autoescape);
output += "\">\n    <input type=\"submit\" value=\"Confirm Delete\">\n  </form>\n</div> <!-- game-tickets -->\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["edit_tickets.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"game-heading\">\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 4, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n  <div class=\"game-at\">\n    at\n  </div>\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 13, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n</div> <!-- game-heading -->\n\n<h3> ";
output += runtime.suppressValue((lineno = 19, colno = 36, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"date")),"strftime"), "ticket_lot[\"game\"][\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " </h3>\n\n<div class=\"game-tickets\">\n  <form method=\"post\"\n        action=\"";
output += runtime.suppressValue((lineno = 23, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["edit_tickets",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])), env.opts.autoescape);
output += "\"\n        enctype=\"multipart/form-data\">\n    Section: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"section"), env.opts.autoescape);
output += " <br>\n    Row: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"row"), env.opts.autoescape);
output += " <br>\n    First seat: ";
output += runtime.suppressValue(runtime.memberLookup(((lineno = 27, colno = 34, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seats"), "ticket_lot[\"seats\"]", context, []))),0), env.opts.autoescape);
output += " <br>\n    Number of seats: ";
output += runtime.suppressValue((lineno = 28, colno = 43, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"num_seats"), "ticket_lot[\"num_seats\"]", context, [])), env.opts.autoescape);
output += " <br>\n    Price per ticket:\n    <input type=\"text\" maxlength=\"10\" name=\"price\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"price"), env.opts.autoescape);
output += "\"> <br>\n    Image: <input type=\"file\" name=\"img\" accept=\"image/*\"> <br>\n    <input type=\"hidden\" name=\"_csrf_token\" value=\"";
output += runtime.suppressValue((lineno = 32, colno = 64, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "csrf_token"), "csrf_token", context, [])), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"game_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"id"), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"user_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"user_id"), env.opts.autoescape);
output += "\">\n    <input type=\"submit\" value=\"Submit\">\n  </form>\n</div> <!-- game-tickets -->\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["game_tickets.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"game-heading\">\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 4, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n  <div class=\"game-at\">\n    at\n  </div>\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 13, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n</div> <!-- game-heading -->\n\n<h3> ";
output += runtime.suppressValue((lineno = 19, colno = 25, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"date")),"strftime"), "game[\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " </h3>\n\n<div class=\"full-row\">\n  <p> Want to sell tickets to this game? Click here: \n    <a class=\"sell-tickets-a\" href=\"";
output += runtime.suppressValue((lineno = 23, colno = 46, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["game",runtime.makeKeywordArgs({"game_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"id")})])) + "/sell", env.opts.autoescape);
output += "\">\n      <button> Sell Tickets </button>\n    </a>\n  </p>\n</div>\n\n<div class=\"game-tickets\">\n  <table class=\"tickets\">\n    <tr class=\"ticket-lot\">\n      <th class=\"section\"> Section </th>\n      <th class=\"row\"> Row </th>\n      <th class=\"seats\"> Sets </th>\n      <th class=\"price\"> Price (ea) </th>\n    </tr>\n    ";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"ticket_lots");
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("ticket_lot", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n    <tr class=\"ticket-lot\">\n      <td class=\"section\"> Section ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"section"), env.opts.autoescape);
output += " </td>\n      <td class=\"row\"> Row ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"row"), env.opts.autoescape);
output += " </td>\n      <td class=\"seats\"> ";
output += runtime.suppressValue((lineno = 41, colno = 47, runtime.callWrap(runtime.memberLookup((t_4),"seats_str"), "ticket_lot[\"seats_str\"]", context, [])), env.opts.autoescape);
output += " </td>\n      <td class=\"price\"> $";
output += runtime.suppressValue(runtime.memberLookup((t_4),"price"), env.opts.autoescape);
output += " </td>\n      <td class=\"view-button\">\n        <a class=\"ticket-lot-a\" href=\"";
output += runtime.suppressValue((lineno = 44, colno = 48, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["ticket_lot",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((t_4),"id")})])), env.opts.autoescape);
output += "\">\n          <button> View Tickets </button>\n        </a>\n      </td>\n    </tr>\n    ";
;
}
}
frame = frame.pop();
output += "\n  </table>\n</div> <!-- game-tickets -->\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["landing.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<h1 class=\"main-h1\"> Welcome to Tickets'R'Us </h1>\n<h2 class=\"main-h2\"> Step 1 - Pick a Conference </h2>\n<h2 class=\"main-h2\"> Step 2 - Pick a Team </h2>\n<h2 class=\"main-h2\"> Step 3 - Pick a Game </h2>\n<div class=\"controls-div\">\n</div>\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["layout.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "<!DOCTYPE=html>\n\n<html>\n  <head>\n    <meta charset=\"UTF-8\">\n    <title> ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "title"), env.opts.autoescape);
output += " </title>\n    <link rel=\"stylesheet\" href=\"";
output += runtime.suppressValue((lineno = 6, colno = 43, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": "style/tickets.css"})])), env.opts.autoescape);
output += "\">\n    <script src=\"";
output += runtime.suppressValue((lineno = 7, colno = 27, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": "images.js"})])), env.opts.autoescape);
output += "\" async >  </script>\n    <script src=\"";
output += runtime.suppressValue((lineno = 8, colno = 27, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": "image_elements.js"})])), env.opts.autoescape);
output += "\" async >  </script>\n    <!--\n    <script src=\"";
output += runtime.suppressValue((lineno = 10, colno = 27, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": "images.zip"})])), env.opts.autoescape);
output += "\" async >  </script>\n    <script src=\"/js/jszip.min.js\"> </script>\n        -->\n    ";
if(runtime.contextOrFrameLookup(context, frame, "google_sign_in")) {
output += "\n    <script src=\"//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js\"> </script>\n    <script src=\"//apis.google.com/js/platform.js?onload=start\"> </script>\n    ";
;
}
output += "  \n  </head>\n\n  <body>\n\n    <div id=\"container\">\n\n      <div id=\"header\">\n\n        <div id=\"header-title-div\">\n          <h1 id=\"header-title-h1\">\n            <a id=\"title-a\" href=\"";
output += runtime.suppressValue((lineno = 27, colno = 44, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["conferences"])), env.opts.autoescape);
output += "\"> Tickets 'R' Us </a>\n          </h1>\n          <p>\n            Buy and Sell College Football Tickets!\n          </p>\n        </div>\n\n        <div id=\"header-login-div\">\n\n          ";
if(runtime.inOperator("login",runtime.contextOrFrameLookup(context, frame, "app_session"))) {
output += "\n          ";
var t_1;
t_1 = (lineno = 37, colno = 42, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"get"), "app_session[\"get\"]", context, ["user_id"]));
frame.set("user_id", t_1, true);
if(frame.topLevel) {
context.setVariable("user_id", t_1);
}
if(frame.topLevel) {
context.addExport("user_id", t_1);
}
output += "\n          ";
var t_2;
t_2 = (lineno = 38, colno = 44, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"get"), "app_session[\"get\"]", context, ["user_name"]));
frame.set("user_name", t_2, true);
if(frame.topLevel) {
context.setVariable("user_name", t_2);
}
if(frame.topLevel) {
context.addExport("user_name", t_2);
}
output += "\n\n          <a class=\"header-login-a\" href=\"";
output += runtime.suppressValue((lineno = 40, colno = 52, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["user",runtime.makeKeywordArgs({"user_id": runtime.contextOrFrameLookup(context, frame, "user_id")})])), env.opts.autoescape);
output += "\">\n            ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "user_name"), env.opts.autoescape);
output += " </a>\n          <a class=\"header-login-a\" href=\"";
output += runtime.suppressValue((lineno = 42, colno = 52, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["disconnect"])), env.opts.autoescape);
output += "\"> \n            <button> Logout </button> </a>\n\n          ";
;
}
else {
output += "\n\n          <a class=\"header-login-a\" href=\"";
output += runtime.suppressValue((lineno = 47, colno = 52, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["login"])), env.opts.autoescape);
output += "\">\n            <button> Login </button> </a>\n\n          ";
;
}
output += "\n        </div>\n\n        <p class=\"flash-messages\">\n          ";
frame = frame.push();
var t_5 = (lineno = 54, colno = 48, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "get_flashed_messages"), "get_flashed_messages", context, []));
if(t_5) {t_5 = runtime.fromIterator(t_5);
var t_4 = t_5.length;
for(var t_3=0; t_3 < t_5.length; t_3++) {
var t_6 = t_5[t_3];
frame.set("message", t_6);
frame.set("loop.index", t_3 + 1);
frame.set("loop.index0", t_3);
frame.set("loop.revindex", t_4 - t_3);
frame.set("loop.revindex0", t_4 - t_3 - 1);
frame.set("loop.first", t_3 === 0);
frame.set("loop.last", t_3 === t_4 - 1);
frame.set("loop.length", t_4);
output += "\n          ";
output += runtime.suppressValue(t_6, env.opts.autoescape);
output += "<br>\n          ";
;
}
}
frame = frame.pop();
output += "\n        </p> <!-- flash-messages -->\n\n      </div> <!-- header -->\n\n\n      <div id=\"main\">\n        ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "main"), env.opts.autoescape);
output += "\n      </div> <!-- main -->\n\n\n      <div id=\"footer\">\n        ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "footer"), env.opts.autoescape);
output += "\n      </div>  <!-- footer -->\n\n    </div> <!-- container -->\n\n  </body>\n\n</html>\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["login.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "<!DOCTYPE=html>\n\n<html>\n<head>\n    <meta charset=\"UTF-8\">\n    <title> ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "title"), env.opts.autoescape);
output += " </title>\n    <link rel=\"stylesheet\" href=\"";
output += runtime.suppressValue((lineno = 6, colno = 43, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": "style/tickets.css"})])), env.opts.autoescape);
output += "\">\n    ";
if(runtime.contextOrFrameLookup(context, frame, "google_sign_in")) {
output += "\n    <script src=\"//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js\"> </script>\n    <script src=\"//apis.google.com/js/platform.js?onload=start\"> </script>\n    ";
;
}
output += "  \n</head>\n\n<body>\n\n<div id=\"container\">\n\n    <div id=\"header\">\n        <h1 id=\"header-title-h1\">\n            <a id=\"title-a\" href=\"";
output += runtime.suppressValue((lineno = 19, colno = 44, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["conferences"])), env.opts.autoescape);
output += "\"> Tickets 'R' Us </a>\n        </h1>\n        <div id=\"header-login-div\">\n            <p>\n                ";
frame = frame.push();
var t_3 = (lineno = 23, colno = 54, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "get_flashed_messages"), "get_flashed_messages", context, []));
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("message", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n                ";
output += runtime.suppressValue(t_4, env.opts.autoescape);
output += "<br>\n                ";
;
}
}
frame = frame.pop();
output += "\n            </p>\n        </div>\n    </div> <!-- header -->\n\n    <div id=\"main\">\n        <div>\n            <h1> Login via Google or Facebook </h1>\n            <!-- GOOGLE PLUS SIGN IN-->\n\n            <div id=\"signInButton\">\n                <span class=\"g-signin\"\n                      data-scope=\"openid email\"\n                      data-clientid=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "google_app_id"), env.opts.autoescape);
output += "\"\n                      data-redirecturi=\"postmessage\"\n                      data-accesstype=\"offline\"\n                      data-cookiepolicy=\"single_host_origin\"\n                      data-callback=\"signInCallback\"\n                      data-approvalprompt=\"force\">\n                </span>\n            </div>\n\n            <div id=\"result\"></div>\n            \n            <script>\n                ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "google_connect_js"), env.opts.autoescape);
output += "\n            </script>\n\n            <!--END GOOGLE PLUS SIGN IN -->\n\n            <!--FACEBOOK SIGN IN -->\n            <div id=\"fb-root\"></div>\n            <!--\n            <script async defer src=\"https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.2&appId=907786629329598&autoLogAppEvents=1\"></script>\n\n            <div class=\"fb-login-button\"\n                 data-size=\"medium\"\n                 data-button-type=\"continue_with\"\n                 data-auto-logout-link=\"false\"\n                 data-use-continue-as=\"false\">\n            </div>\n            -->\n            <script>\n              ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "fb_connect_js"), env.opts.autoescape);
output += "\n            </script>\n            <fb:login-button\n              scope=\"\"\n              onlogin=\"sendTokenToServer();\">\n              <a href='javascript:sendTokenToServer()'>Login with Facebook</a>\n            </fb:login-button>\n            <!--END FACEBOOK SIGN IN -->\n            \n            <div class=\"rant\">\n                <p>\n                    Notice how the Facebook login button messes up my layout?\n                    Reload this page and see how it jumps around.\n                    What's up with that?  \n                </p>\n                <p>\n                    The fb javascript code for the button creates some\n                    weird hidden &lt;iframe&gt;s and they\n                    don't seem to play well with flex-box.\n                    Is that really necessary?  Why can't I have a simple\n                    button with a simple onclick function? C'mon Facebook!\n                </p>\n            </div>\n        </div>\n    </div> <!-- main -->\n\n</div> <!-- container -->\n\n</body>\n\n</html>\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["sell_tickets.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"game-heading\">\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 4, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n  <div class=\"game-at\">\n    at\n  </div>\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 13, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n</div> <!-- game-heading -->\n\n<h3> ";
output += runtime.suppressValue((lineno = 19, colno = 25, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"date")),"strftime"), "game[\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " </h3>\n\n<div class=\"game-tickets\">\n  <form method=\"post\"\n        action=\"";
output += runtime.suppressValue((lineno = 23, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["sell_tickets",runtime.makeKeywordArgs({"game_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"id")})])), env.opts.autoescape);
output += "\"\n        enctype=\"multipart/form-data\">\n    Section: <input type=\"text\" maxlength=\"10\" name=\"section\"> <br>\n    Row: <input type=\"text\" maxlength=\"10\" name=\"row\"> <br>\n    First seat: <input type=\"text\" maxlength=\"10\" name=\"first_seat\"> <br>\n    Number of seats: <input type=\"text\" maxlength=\"10\" name=\"num_seats\"> <br>\n    Price per ticket: <input type=\"text\" maxlength=\"10\" name=\"price\"> <br>\n    Image: <input type=\"file\" name=\"img\" accept=\"image/*\"> <br>\n    <input type=\"hidden\" name=\"_csrf_token\" value=\"";
output += runtime.suppressValue((lineno = 31, colno = 64, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "csrf_token"), "csrf_token", context, [])), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"game_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"id"), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"user_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"user_id"), env.opts.autoescape);
output += "\">\n    <input type=\"submit\" value=\"Submit\">\n  </form>\n</div> <!-- game-tickets -->\n\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["ticket_lot.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"controls-div\">\n\n  <h3>\n    <a href=\"";
output += runtime.suppressValue((lineno = 3, colno = 23, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["game",runtime.makeKeywordArgs({"game_id": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"id")})])), env.opts.autoescape);
output += "\">\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n      at \n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"name"), env.opts.autoescape);
output += "\n  </h3>\n  <p> \n    ";
output += runtime.suppressValue((lineno = 9, colno = 35, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"date")),"strftime"), "ticket_lot[\"game\"][\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " <br>\n    Price each: $";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"price"), env.opts.autoescape);
output += " <br>\n    Seller: <a href=\"";
output += runtime.suppressValue((lineno = 11, colno = 31, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["user",runtime.makeKeywordArgs({"user_id": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seller")),"id")})])), env.opts.autoescape);
output += "\"> \n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seller")),"name"), env.opts.autoescape);
output += " </a> <br>\n    Contact: <a href=\"mailto:";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seller")),"email"), env.opts.autoescape);
output += "\">\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seller")),"email"), env.opts.autoescape);
output += " </a>\n  </p>\n</div>\n\n<div class=\"controls-div\">\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"user_id") == runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"user_id")) {
output += "\n\n  <p> <a class=\"sell-tickets-a\" href=\"";
output += runtime.suppressValue((lineno = 21, colno = 48, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["ticket_lot",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])) + "/edit", env.opts.autoescape);
output += "\">\n      <button> Edit Tickets </button> </a> </p>\n  \n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")) {
output += "\n  <p> <a class=\"sell-tickets-a\" href=\"";
output += runtime.suppressValue((lineno = 25, colno = 48, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["ticket_lot",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])) + "/delete_image", env.opts.autoescape);
output += "\" method=\"Post\">\n      <button> Delete Image </button> </a> </p>\n  ";
;
}
output += "\n\n  <p> <a class=\"sell-tickets-a\" href=\"";
output += runtime.suppressValue((lineno = 29, colno = 48, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["ticket_lot",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])) + "/delete", env.opts.autoescape);
output += "\">\n      <button> Delete Tickets </button> </a> </p>\n  ";
;
}
output += "\n</div>\n\n";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")) {
output += "\n\n<img class=\"tickets-img\"\n     src=\"";
output += runtime.suppressValue((lineno = 37, colno = 20, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")})])), env.opts.autoescape);
output += "\">\n\n";
;
}
else {
output += "\n\n";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"tickets");
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("ticket", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n<div class=\"ticket\">\n  <div class=\"college-football\">\n    College Football\n  </div>\n  <div class=\"team\" class=\"visiting\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 48, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    <span class=\"team-name\">\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += "\n    </span>\n  </div>\n  <div class=\"at\"> at </div>\n  <div class=\"team\" class=\"home\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 57, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    <span class=\"team-name\">\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"name"), env.opts.autoescape);
output += "\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"nickname"), env.opts.autoescape);
output += "\n    </span>\n  </div>\n  <div class=\"date\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"date"), env.opts.autoescape);
output += "\n  </div>\n  <div class=\"seat\">\n    <p class=\"seat\">\n      Sec: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"section"), env.opts.autoescape);
output += " \n      Row: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"row"), env.opts.autoescape);
output += " <br>\n      Seat: ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"seat"), env.opts.autoescape);
output += "\n    </p>\n  </div>\n</div>\n\n";
;
}
}
frame = frame.pop();
output += "\n\n";
;
}
output += "\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["user.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"user-div\">\n  <h1>  \n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "user")),"name"), env.opts.autoescape);
output += " <br>\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "user")),"email"), env.opts.autoescape);
output += "\n  </h1>\n\n  <div class=\"game-tickets\">\n    <table class=\"tickets\">\n      <tr class=\"ticket-lot\">\n        <th> Game </th>\n        <th> Date </th>\n        <th class=\"section\"> Section </th>\n        <th class=\"row\"> Row </th>\n        <th class=\"seats\"> Seats </th>\n        <th class=\"price\"> Price (ea) </th>\n      </tr>\n      ";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "user")),"ticket_lots");
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("ticket_lot", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n      <tr class=\"ticket-lot\">\n        <td class=\"game\">\n          ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_4),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += " @ ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_4),"game")),"home_team")),"name"), env.opts.autoescape);
output += " </td>\n        <td class=\"date\"> ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_4),"game")),"date"), env.opts.autoescape);
output += " </td>\n        <td class=\"section\"> ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"section"), env.opts.autoescape);
output += " </td>\n        <td class=\"row\"> ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"row"), env.opts.autoescape);
output += " </td>\n        <td class=\"seats\"> ";
output += runtime.suppressValue((lineno = 24, colno = 49, runtime.callWrap(runtime.memberLookup((t_4),"seats_str"), "ticket_lot[\"seats_str\"]", context, [])), env.opts.autoescape);
output += " </td>\n        <td class=\"price\"> $";
output += runtime.suppressValue(runtime.memberLookup((t_4),"price"), env.opts.autoescape);
output += " </td>\n        <td class=\"view-button\">\n          <a class=\"ticket-lot-a\"\n             href=\"";
output += runtime.suppressValue((lineno = 28, colno = 29, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["ticket_lot",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((t_4),"id")})])), env.opts.autoescape);
output += "\">\n            <button> View Tickets </button>\n          </a>\n        </td>\n      </tr>\n      ";
;
}
}
frame = frame.pop();
output += "\n    </table>\n  </div> <!-- game-tickets -->\n</div> <!-- user-div -->\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();


},{}],51:[function(require,module,exports){
(function (process,setImmediate){
/*! Browser bundle of nunjucks 3.2.0 (slim, only works with precompiled templates) */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["nunjucks"] = factory();
	else
		root["nunjucks"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {



/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var ArrayProto = Array.prototype;
var ObjProto = Object.prototype;
var escapeMap = {
  '&': '&amp;',
  '"': '&quot;',
  '\'': '&#39;',
  '<': '&lt;',
  '>': '&gt;'
};
var escapeRegex = /[&"'<>]/g;
var exports = module.exports = {};

function hasOwnProp(obj, k) {
  return ObjProto.hasOwnProperty.call(obj, k);
}

exports.hasOwnProp = hasOwnProp;

function lookupEscape(ch) {
  return escapeMap[ch];
}

function _prettifyError(path, withInternals, err) {
  if (!err.Update) {
    // not one of ours, cast it
    err = new exports.TemplateError(err);
  }

  err.Update(path); // Unless they marked the dev flag, show them a trace from here

  if (!withInternals) {
    var old = err;
    err = new Error(old.message);
    err.name = old.name;
  }

  return err;
}

exports._prettifyError = _prettifyError;

function TemplateError(message, lineno, colno) {
  var err;
  var cause;

  if (message instanceof Error) {
    cause = message;
    message = cause.name + ": " + cause.message;
  }

  if (Object.setPrototypeOf) {
    err = new Error(message);
    Object.setPrototypeOf(err, TemplateError.prototype);
  } else {
    err = this;
    Object.defineProperty(err, 'message', {
      enumerable: false,
      writable: true,
      value: message
    });
  }

  Object.defineProperty(err, 'name', {
    value: 'Template render error'
  });

  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, this.constructor);
  }

  var getStack;

  if (cause) {
    var stackDescriptor = Object.getOwnPropertyDescriptor(cause, 'stack');

    getStack = stackDescriptor && (stackDescriptor.get || function () {
      return stackDescriptor.value;
    });

    if (!getStack) {
      getStack = function getStack() {
        return cause.stack;
      };
    }
  } else {
    var stack = new Error(message).stack;

    getStack = function getStack() {
      return stack;
    };
  }

  Object.defineProperty(err, 'stack', {
    get: function get() {
      return getStack.call(err);
    }
  });
  Object.defineProperty(err, 'cause', {
    value: cause
  });
  err.lineno = lineno;
  err.colno = colno;
  err.firstUpdate = true;

  err.Update = function Update(path) {
    var msg = '(' + (path || 'unknown path') + ')'; // only show lineno + colno next to path of template
    // where error occurred

    if (this.firstUpdate) {
      if (this.lineno && this.colno) {
        msg += " [Line " + this.lineno + ", Column " + this.colno + "]";
      } else if (this.lineno) {
        msg += " [Line " + this.lineno + "]";
      }
    }

    msg += '\n ';

    if (this.firstUpdate) {
      msg += ' ';
    }

    this.message = msg + (this.message || '');
    this.firstUpdate = false;
    return this;
  };

  return err;
}

if (Object.setPrototypeOf) {
  Object.setPrototypeOf(TemplateError.prototype, Error.prototype);
} else {
  TemplateError.prototype = Object.create(Error.prototype, {
    constructor: {
      value: TemplateError
    }
  });
}

exports.TemplateError = TemplateError;

function escape(val) {
  return val.replace(escapeRegex, lookupEscape);
}

exports.escape = escape;

function isFunction(obj) {
  return ObjProto.toString.call(obj) === '[object Function]';
}

exports.isFunction = isFunction;

function isArray(obj) {
  return ObjProto.toString.call(obj) === '[object Array]';
}

exports.isArray = isArray;

function isString(obj) {
  return ObjProto.toString.call(obj) === '[object String]';
}

exports.isString = isString;

function isObject(obj) {
  return ObjProto.toString.call(obj) === '[object Object]';
}

exports.isObject = isObject;

function groupBy(obj, val) {
  var result = {};
  var iterator = isFunction(val) ? val : function (o) {
    return o[val];
  };

  for (var i = 0; i < obj.length; i++) {
    var value = obj[i];
    var key = iterator(value, i);
    (result[key] || (result[key] = [])).push(value);
  }

  return result;
}

exports.groupBy = groupBy;

function toArray(obj) {
  return Array.prototype.slice.call(obj);
}

exports.toArray = toArray;

function without(array) {
  var result = [];

  if (!array) {
    return result;
  }

  var length = array.length;
  var contains = toArray(arguments).slice(1);
  var index = -1;

  while (++index < length) {
    if (indexOf(contains, array[index]) === -1) {
      result.push(array[index]);
    }
  }

  return result;
}

exports.without = without;

function repeat(char_, n) {
  var str = '';

  for (var i = 0; i < n; i++) {
    str += char_;
  }

  return str;
}

exports.repeat = repeat;

function each(obj, func, context) {
  if (obj == null) {
    return;
  }

  if (ArrayProto.forEach && obj.forEach === ArrayProto.forEach) {
    obj.forEach(func, context);
  } else if (obj.length === +obj.length) {
    for (var i = 0, l = obj.length; i < l; i++) {
      func.call(context, obj[i], i, obj);
    }
  }
}

exports.each = each;

function map(obj, func) {
  var results = [];

  if (obj == null) {
    return results;
  }

  if (ArrayProto.map && obj.map === ArrayProto.map) {
    return obj.map(func);
  }

  for (var i = 0; i < obj.length; i++) {
    results[results.length] = func(obj[i], i);
  }

  if (obj.length === +obj.length) {
    results.length = obj.length;
  }

  return results;
}

exports.map = map;

function asyncIter(arr, iter, cb) {
  var i = -1;

  function next() {
    i++;

    if (i < arr.length) {
      iter(arr[i], i, next, cb);
    } else {
      cb();
    }
  }

  next();
}

exports.asyncIter = asyncIter;

function asyncFor(obj, iter, cb) {
  var keys = keys_(obj || {});
  var len = keys.length;
  var i = -1;

  function next() {
    i++;
    var k = keys[i];

    if (i < len) {
      iter(k, obj[k], i, len, next);
    } else {
      cb();
    }
  }

  next();
}

exports.asyncFor = asyncFor;

function indexOf(arr, searchElement, fromIndex) {
  return Array.prototype.indexOf.call(arr || [], searchElement, fromIndex);
}

exports.indexOf = indexOf;

function keys_(obj) {
  /* eslint-disable no-restricted-syntax */
  var arr = [];

  for (var k in obj) {
    if (hasOwnProp(obj, k)) {
      arr.push(k);
    }
  }

  return arr;
}

exports.keys = keys_;

function _entries(obj) {
  return keys_(obj).map(function (k) {
    return [k, obj[k]];
  });
}

exports._entries = _entries;

function _values(obj) {
  return keys_(obj).map(function (k) {
    return obj[k];
  });
}

exports._values = _values;

function extend(obj1, obj2) {
  obj1 = obj1 || {};
  keys_(obj2).forEach(function (k) {
    obj1[k] = obj2[k];
  });
  return obj1;
}

exports._assign = exports.extend = extend;

function inOperator(key, val) {
  if (isArray(val) || isString(val)) {
    return val.indexOf(key) !== -1;
  } else if (isObject(val)) {
    return key in val;
  }

  throw new Error('Cannot use "in" operator to search for "' + key + '" in unexpected types.');
}

exports.inOperator = inOperator;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var lib = __webpack_require__(1);

var arrayFrom = Array.from;
var supportsIterators = typeof Symbol === 'function' && Symbol.iterator && typeof arrayFrom === 'function'; // Frames keep track of scoping both at compile-time and run-time so
// we know how to access variables. Block tags can introduce special
// variables, for example.

var Frame =
/*#__PURE__*/
function () {
  function Frame(parent, isolateWrites) {
    this.variables = {};
    this.parent = parent;
    this.topLevel = false; // if this is true, writes (set) should never propagate upwards past
    // this frame to its parent (though reads may).

    this.isolateWrites = isolateWrites;
  }

  var _proto = Frame.prototype;

  _proto.set = function set(name, val, resolveUp) {
    // Allow variables with dots by automatically creating the
    // nested structure
    var parts = name.split('.');
    var obj = this.variables;
    var frame = this;

    if (resolveUp) {
      if (frame = this.resolve(parts[0], true)) {
        frame.set(name, val);
        return;
      }
    }

    for (var i = 0; i < parts.length - 1; i++) {
      var id = parts[i];

      if (!obj[id]) {
        obj[id] = {};
      }

      obj = obj[id];
    }

    obj[parts[parts.length - 1]] = val;
  };

  _proto.get = function get(name) {
    var val = this.variables[name];

    if (val !== undefined) {
      return val;
    }

    return null;
  };

  _proto.lookup = function lookup(name) {
    var p = this.parent;
    var val = this.variables[name];

    if (val !== undefined) {
      return val;
    }

    return p && p.lookup(name);
  };

  _proto.resolve = function resolve(name, forWrite) {
    var p = forWrite && this.isolateWrites ? undefined : this.parent;
    var val = this.variables[name];

    if (val !== undefined) {
      return this;
    }

    return p && p.resolve(name);
  };

  _proto.push = function push(isolateWrites) {
    return new Frame(this, isolateWrites);
  };

  _proto.pop = function pop() {
    return this.parent;
  };

  return Frame;
}();

function makeMacro(argNames, kwargNames, func) {
  var _this = this;

  return function () {
    for (var _len = arguments.length, macroArgs = new Array(_len), _key = 0; _key < _len; _key++) {
      macroArgs[_key] = arguments[_key];
    }

    var argCount = numArgs(macroArgs);
    var args;
    var kwargs = getKeywordArgs(macroArgs);

    if (argCount > argNames.length) {
      args = macroArgs.slice(0, argNames.length); // Positional arguments that should be passed in as
      // keyword arguments (essentially default values)

      macroArgs.slice(args.length, argCount).forEach(function (val, i) {
        if (i < kwargNames.length) {
          kwargs[kwargNames[i]] = val;
        }
      });
      args.push(kwargs);
    } else if (argCount < argNames.length) {
      args = macroArgs.slice(0, argCount);

      for (var i = argCount; i < argNames.length; i++) {
        var arg = argNames[i]; // Keyword arguments that should be passed as
        // positional arguments, i.e. the caller explicitly
        // used the name of a positional arg

        args.push(kwargs[arg]);
        delete kwargs[arg];
      }

      args.push(kwargs);
    } else {
      args = macroArgs;
    }

    return func.apply(_this, args);
  };
}

function makeKeywordArgs(obj) {
  obj.__keywords = true;
  return obj;
}

function isKeywordArgs(obj) {
  return obj && Object.prototype.hasOwnProperty.call(obj, '__keywords');
}

function getKeywordArgs(args) {
  var len = args.length;

  if (len) {
    var lastArg = args[len - 1];

    if (isKeywordArgs(lastArg)) {
      return lastArg;
    }
  }

  return {};
}

function numArgs(args) {
  var len = args.length;

  if (len === 0) {
    return 0;
  }

  var lastArg = args[len - 1];

  if (isKeywordArgs(lastArg)) {
    return len - 1;
  } else {
    return len;
  }
} // A SafeString object indicates that the string should not be
// autoescaped. This happens magically because autoescaping only
// occurs on primitive string objects.


function SafeString(val) {
  if (typeof val !== 'string') {
    return val;
  }

  this.val = val;
  this.length = val.length;
}

SafeString.prototype = Object.create(String.prototype, {
  length: {
    writable: true,
    configurable: true,
    value: 0
  }
});

SafeString.prototype.valueOf = function valueOf() {
  return this.val;
};

SafeString.prototype.toString = function toString() {
  return this.val;
};

function copySafeness(dest, target) {
  if (dest instanceof SafeString) {
    return new SafeString(target);
  }

  return target.toString();
}

function markSafe(val) {
  var type = typeof val;

  if (type === 'string') {
    return new SafeString(val);
  } else if (type !== 'function') {
    return val;
  } else {
    return function wrapSafe(args) {
      var ret = val.apply(this, arguments);

      if (typeof ret === 'string') {
        return new SafeString(ret);
      }

      return ret;
    };
  }
}

function suppressValue(val, autoescape) {
  val = val !== undefined && val !== null ? val : '';

  if (autoescape && !(val instanceof SafeString)) {
    val = lib.escape(val.toString());
  }

  return val;
}

function ensureDefined(val, lineno, colno) {
  if (val === null || val === undefined) {
    throw new lib.TemplateError('attempted to output null or undefined value', lineno + 1, colno + 1);
  }

  return val;
}

function memberLookup(obj, val) {
  if (obj === undefined || obj === null) {
    return undefined;
  }

  if (typeof obj[val] === 'function') {
    return function () {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return obj[val].apply(obj, args);
    };
  }

  return obj[val];
}

function callWrap(obj, name, context, args) {
  if (!obj) {
    throw new Error('Unable to call `' + name + '`, which is undefined or falsey');
  } else if (typeof obj !== 'function') {
    throw new Error('Unable to call `' + name + '`, which is not a function');
  }

  return obj.apply(context, args);
}

function contextOrFrameLookup(context, frame, name) {
  var val = frame.lookup(name);
  return val !== undefined ? val : context.lookup(name);
}

function handleError(error, lineno, colno) {
  if (error.lineno) {
    return error;
  } else {
    return new lib.TemplateError(error, lineno, colno);
  }
}

function asyncEach(arr, dimen, iter, cb) {
  if (lib.isArray(arr)) {
    var len = arr.length;
    lib.asyncIter(arr, function iterCallback(item, i, next) {
      switch (dimen) {
        case 1:
          iter(item, i, len, next);
          break;

        case 2:
          iter(item[0], item[1], i, len, next);
          break;

        case 3:
          iter(item[0], item[1], item[2], i, len, next);
          break;

        default:
          item.push(i, len, next);
          iter.apply(this, item);
      }
    }, cb);
  } else {
    lib.asyncFor(arr, function iterCallback(key, val, i, len, next) {
      iter(key, val, i, len, next);
    }, cb);
  }
}

function asyncAll(arr, dimen, func, cb) {
  var finished = 0;
  var len;
  var outputArr;

  function done(i, output) {
    finished++;
    outputArr[i] = output;

    if (finished === len) {
      cb(null, outputArr.join(''));
    }
  }

  if (lib.isArray(arr)) {
    len = arr.length;
    outputArr = new Array(len);

    if (len === 0) {
      cb(null, '');
    } else {
      for (var i = 0; i < arr.length; i++) {
        var item = arr[i];

        switch (dimen) {
          case 1:
            func(item, i, len, done);
            break;

          case 2:
            func(item[0], item[1], i, len, done);
            break;

          case 3:
            func(item[0], item[1], item[2], i, len, done);
            break;

          default:
            item.push(i, len, done);
            func.apply(this, item);
        }
      }
    }
  } else {
    var keys = lib.keys(arr || {});
    len = keys.length;
    outputArr = new Array(len);

    if (len === 0) {
      cb(null, '');
    } else {
      for (var _i = 0; _i < keys.length; _i++) {
        var k = keys[_i];
        func(k, arr[k], _i, len, done);
      }
    }
  }
}

function fromIterator(arr) {
  if (typeof arr !== 'object' || arr === null || lib.isArray(arr)) {
    return arr;
  } else if (supportsIterators && Symbol.iterator in arr) {
    return arrayFrom(arr);
  } else {
    return arr;
  }
}

module.exports = {
  Frame: Frame,
  makeMacro: makeMacro,
  makeKeywordArgs: makeKeywordArgs,
  numArgs: numArgs,
  suppressValue: suppressValue,
  ensureDefined: ensureDefined,
  memberLookup: memberLookup,
  contextOrFrameLookup: contextOrFrameLookup,
  callWrap: callWrap,
  handleError: handleError,
  isArray: lib.isArray,
  keys: lib.keys,
  SafeString: SafeString,
  copySafeness: copySafeness,
  markSafe: markSafe,
  asyncEach: asyncEach,
  asyncAll: asyncAll,
  inOperator: lib.inOperator,
  fromIterator: fromIterator
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var Loader = __webpack_require__(4);

var PrecompiledLoader =
/*#__PURE__*/
function (_Loader) {
  _inheritsLoose(PrecompiledLoader, _Loader);

  function PrecompiledLoader(compiledTemplates) {
    var _this;

    _this = _Loader.call(this) || this;
    _this.precompiled = compiledTemplates || {};
    return _this;
  }

  var _proto = PrecompiledLoader.prototype;

  _proto.getSource = function getSource(name) {
    if (this.precompiled[name]) {
      return {
        src: {
          type: 'code',
          obj: this.precompiled[name]
        },
        path: name
      };
    }

    return null;
  };

  return PrecompiledLoader;
}(Loader);

module.exports = {
  PrecompiledLoader: PrecompiledLoader
};

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var path = __webpack_require__(0);

var _require = __webpack_require__(5),
    EmitterObj = _require.EmitterObj;

module.exports =
/*#__PURE__*/
function (_EmitterObj) {
  _inheritsLoose(Loader, _EmitterObj);

  function Loader() {
    return _EmitterObj.apply(this, arguments) || this;
  }

  var _proto = Loader.prototype;

  _proto.resolve = function resolve(from, to) {
    return path.resolve(path.dirname(from), to);
  };

  _proto.isRelative = function isRelative(filename) {
    return filename.indexOf('./') === 0 || filename.indexOf('../') === 0;
  };

  return Loader;
}(EmitterObj);

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
 // A simple class system, more documentation to come

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var EventEmitter = __webpack_require__(13);

var lib = __webpack_require__(1);

function parentWrap(parent, prop) {
  if (typeof parent !== 'function' || typeof prop !== 'function') {
    return prop;
  }

  return function wrap() {
    // Save the current parent method
    var tmp = this.parent; // Set parent to the previous method, call, and restore

    this.parent = parent;
    var res = prop.apply(this, arguments);
    this.parent = tmp;
    return res;
  };
}

function extendClass(cls, name, props) {
  props = props || {};
  lib.keys(props).forEach(function (k) {
    props[k] = parentWrap(cls.prototype[k], props[k]);
  });

  var subclass =
  /*#__PURE__*/
  function (_cls) {
    _inheritsLoose(subclass, _cls);

    function subclass() {
      return _cls.apply(this, arguments) || this;
    }

    _createClass(subclass, [{
      key: "typename",
      get: function get() {
        return name;
      }
    }]);

    return subclass;
  }(cls);

  lib._assign(subclass.prototype, props);

  return subclass;
}

var Obj =
/*#__PURE__*/
function () {
  function Obj() {
    // Unfortunately necessary for backwards compatibility
    this.init.apply(this, arguments);
  }

  var _proto = Obj.prototype;

  _proto.init = function init() {};

  Obj.extend = function extend(name, props) {
    if (typeof name === 'object') {
      props = name;
      name = 'anonymous';
    }

    return extendClass(this, name, props);
  };

  _createClass(Obj, [{
    key: "typename",
    get: function get() {
      return this.constructor.name;
    }
  }]);

  return Obj;
}();

var EmitterObj =
/*#__PURE__*/
function (_EventEmitter) {
  _inheritsLoose(EmitterObj, _EventEmitter);

  function EmitterObj() {
    var _this2;

    var _this;

    _this = _EventEmitter.call(this) || this; // Unfortunately necessary for backwards compatibility

    (_this2 = _this).init.apply(_this2, arguments);

    return _this;
  }

  var _proto2 = EmitterObj.prototype;

  _proto2.init = function init() {};

  EmitterObj.extend = function extend(name, props) {
    if (typeof name === 'object') {
      props = name;
      name = 'anonymous';
    }

    return extendClass(this, name, props);
  };

  _createClass(EmitterObj, [{
    key: "typename",
    get: function get() {
      return this.constructor.name;
    }
  }]);

  return EmitterObj;
}(EventEmitter);

module.exports = {
  Obj: Obj,
  EmitterObj: EmitterObj
};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var lib = __webpack_require__(1);

var _require = __webpack_require__(7),
    Environment = _require.Environment,
    Template = _require.Template;

var Loader = __webpack_require__(4);

var loaders = __webpack_require__(3);

var precompile = __webpack_require__(0);

var compiler = __webpack_require__(0);

var parser = __webpack_require__(0);

var lexer = __webpack_require__(0);

var runtime = __webpack_require__(2);

var nodes = __webpack_require__(0);

var installJinjaCompat = __webpack_require__(17); // A single instance of an environment, since this is so commonly used


var e;

function configure(templatesPath, opts) {
  opts = opts || {};

  if (lib.isObject(templatesPath)) {
    opts = templatesPath;
    templatesPath = null;
  }

  var TemplateLoader;

  if (loaders.FileSystemLoader) {
    TemplateLoader = new loaders.FileSystemLoader(templatesPath, {
      watch: opts.watch,
      noCache: opts.noCache
    });
  } else if (loaders.WebLoader) {
    TemplateLoader = new loaders.WebLoader(templatesPath, {
      useCache: opts.web && opts.web.useCache,
      async: opts.web && opts.web.async
    });
  }

  e = new Environment(TemplateLoader, opts);

  if (opts && opts.express) {
    e.express(opts.express);
  }

  return e;
}

module.exports = {
  Environment: Environment,
  Template: Template,
  Loader: Loader,
  FileSystemLoader: loaders.FileSystemLoader,
  NodeResolveLoader: loaders.NodeResolveLoader,
  PrecompiledLoader: loaders.PrecompiledLoader,
  WebLoader: loaders.WebLoader,
  compiler: compiler,
  parser: parser,
  lexer: lexer,
  runtime: runtime,
  lib: lib,
  nodes: nodes,
  installJinjaCompat: installJinjaCompat,
  configure: configure,
  reset: function reset() {
    e = undefined;
  },
  compile: function compile(src, env, path, eagerCompile) {
    if (!e) {
      configure();
    }

    return new Template(src, env, path, eagerCompile);
  },
  render: function render(name, ctx, cb) {
    if (!e) {
      configure();
    }

    return e.render(name, ctx, cb);
  },
  renderString: function renderString(src, ctx, cb) {
    if (!e) {
      configure();
    }

    return e.renderString(src, ctx, cb);
  },
  precompile: precompile ? precompile.precompile : undefined,
  precompileString: precompile ? precompile.precompileString : undefined
};

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var asap = __webpack_require__(8);

var _waterfall = __webpack_require__(11);

var lib = __webpack_require__(1);

var compiler = __webpack_require__(0);

var filters = __webpack_require__(12);

var _require = __webpack_require__(3),
    FileSystemLoader = _require.FileSystemLoader,
    WebLoader = _require.WebLoader,
    PrecompiledLoader = _require.PrecompiledLoader;

var tests = __webpack_require__(14);

var globals = __webpack_require__(15);

var _require2 = __webpack_require__(5),
    Obj = _require2.Obj,
    EmitterObj = _require2.EmitterObj;

var globalRuntime = __webpack_require__(2);

var handleError = globalRuntime.handleError,
    Frame = globalRuntime.Frame;

var expressApp = __webpack_require__(16); // If the user is using the async API, *always* call it
// asynchronously even if the template was synchronous.


function callbackAsap(cb, err, res) {
  asap(function () {
    cb(err, res);
  });
}
/**
 * A no-op template, for use with {% include ignore missing %}
 */


var noopTmplSrc = {
  type: 'code',
  obj: {
    root: function root(env, context, frame, runtime, cb) {
      try {
        cb(null, '');
      } catch (e) {
        cb(handleError(e, null, null));
      }
    }
  }
};

var Environment =
/*#__PURE__*/
function (_EmitterObj) {
  _inheritsLoose(Environment, _EmitterObj);

  function Environment() {
    return _EmitterObj.apply(this, arguments) || this;
  }

  var _proto = Environment.prototype;

  _proto.init = function init(loaders, opts) {
    var _this = this;

    // The dev flag determines the trace that'll be shown on errors.
    // If set to true, returns the full trace from the error point,
    // otherwise will return trace starting from Template.render
    // (the full trace from within nunjucks may confuse developers using
    //  the library)
    // defaults to false
    opts = this.opts = opts || {};
    this.opts.dev = !!opts.dev; // The autoescape flag sets global autoescaping. If true,
    // every string variable will be escaped by default.
    // If false, strings can be manually escaped using the `escape` filter.
    // defaults to true

    this.opts.autoescape = opts.autoescape != null ? opts.autoescape : true; // If true, this will make the system throw errors if trying
    // to output a null or undefined value

    this.opts.throwOnUndefined = !!opts.throwOnUndefined;
    this.opts.trimBlocks = !!opts.trimBlocks;
    this.opts.lstripBlocks = !!opts.lstripBlocks;
    this.loaders = [];

    if (!loaders) {
      // The filesystem loader is only available server-side
      if (FileSystemLoader) {
        this.loaders = [new FileSystemLoader('views')];
      } else if (WebLoader) {
        this.loaders = [new WebLoader('/views')];
      }
    } else {
      this.loaders = lib.isArray(loaders) ? loaders : [loaders];
    } // It's easy to use precompiled templates: just include them
    // before you configure nunjucks and this will automatically
    // pick it up and use it


    if (typeof window !== 'undefined' && window.nunjucksPrecompiled) {
      this.loaders.unshift(new PrecompiledLoader(window.nunjucksPrecompiled));
    }

    this._initLoaders();

    this.globals = globals();
    this.filters = {};
    this.tests = {};
    this.asyncFilters = [];
    this.extensions = {};
    this.extensionsList = [];

    lib._entries(filters).forEach(function (_ref) {
      var name = _ref[0],
          filter = _ref[1];
      return _this.addFilter(name, filter);
    });

    lib._entries(tests).forEach(function (_ref2) {
      var name = _ref2[0],
          test = _ref2[1];
      return _this.addTest(name, test);
    });
  };

  _proto._initLoaders = function _initLoaders() {
    var _this2 = this;

    this.loaders.forEach(function (loader) {
      // Caching and cache busting
      loader.cache = {};

      if (typeof loader.on === 'function') {
        loader.on('update', function (name, fullname) {
          loader.cache[name] = null;

          _this2.emit('update', name, fullname, loader);
        });
        loader.on('load', function (name, source) {
          _this2.emit('load', name, source, loader);
        });
      }
    });
  };

  _proto.invalidateCache = function invalidateCache() {
    this.loaders.forEach(function (loader) {
      loader.cache = {};
    });
  };

  _proto.addExtension = function addExtension(name, extension) {
    extension.__name = name;
    this.extensions[name] = extension;
    this.extensionsList.push(extension);
    return this;
  };

  _proto.removeExtension = function removeExtension(name) {
    var extension = this.getExtension(name);

    if (!extension) {
      return;
    }

    this.extensionsList = lib.without(this.extensionsList, extension);
    delete this.extensions[name];
  };

  _proto.getExtension = function getExtension(name) {
    return this.extensions[name];
  };

  _proto.hasExtension = function hasExtension(name) {
    return !!this.extensions[name];
  };

  _proto.addGlobal = function addGlobal(name, value) {
    this.globals[name] = value;
    return this;
  };

  _proto.getGlobal = function getGlobal(name) {
    if (typeof this.globals[name] === 'undefined') {
      throw new Error('global not found: ' + name);
    }

    return this.globals[name];
  };

  _proto.addFilter = function addFilter(name, func, async) {
    var wrapped = func;

    if (async) {
      this.asyncFilters.push(name);
    }

    this.filters[name] = wrapped;
    return this;
  };

  _proto.getFilter = function getFilter(name) {
    if (!this.filters[name]) {
      throw new Error('filter not found: ' + name);
    }

    return this.filters[name];
  };

  _proto.addTest = function addTest(name, func) {
    this.tests[name] = func;
    return this;
  };

  _proto.getTest = function getTest(name) {
    if (!this.tests[name]) {
      throw new Error('test not found: ' + name);
    }

    return this.tests[name];
  };

  _proto.resolveTemplate = function resolveTemplate(loader, parentName, filename) {
    var isRelative = loader.isRelative && parentName ? loader.isRelative(filename) : false;
    return isRelative && loader.resolve ? loader.resolve(parentName, filename) : filename;
  };

  _proto.getTemplate = function getTemplate(name, eagerCompile, parentName, ignoreMissing, cb) {
    var _this3 = this;

    var that = this;
    var tmpl = null;

    if (name && name.raw) {
      // this fixes autoescape for templates referenced in symbols
      name = name.raw;
    }

    if (lib.isFunction(parentName)) {
      cb = parentName;
      parentName = null;
      eagerCompile = eagerCompile || false;
    }

    if (lib.isFunction(eagerCompile)) {
      cb = eagerCompile;
      eagerCompile = false;
    }

    if (name instanceof Template) {
      tmpl = name;
    } else if (typeof name !== 'string') {
      throw new Error('template names must be a string: ' + name);
    } else {
      for (var i = 0; i < this.loaders.length; i++) {
        var loader = this.loaders[i];
        tmpl = loader.cache[this.resolveTemplate(loader, parentName, name)];

        if (tmpl) {
          break;
        }
      }
    }

    if (tmpl) {
      if (eagerCompile) {
        tmpl.compile();
      }

      if (cb) {
        cb(null, tmpl);
        return undefined;
      } else {
        return tmpl;
      }
    }

    var syncResult;

    var createTemplate = function createTemplate(err, info) {
      if (!info && !err && !ignoreMissing) {
        err = new Error('template not found: ' + name);
      }

      if (err) {
        if (cb) {
          cb(err);
          return;
        } else {
          throw err;
        }
      }

      var newTmpl;

      if (!info) {
        newTmpl = new Template(noopTmplSrc, _this3, '', eagerCompile);
      } else {
        newTmpl = new Template(info.src, _this3, info.path, eagerCompile);

        if (!info.noCache) {
          info.loader.cache[name] = newTmpl;
        }
      }

      if (cb) {
        cb(null, newTmpl);
      } else {
        syncResult = newTmpl;
      }
    };

    lib.asyncIter(this.loaders, function (loader, i, next, done) {
      function handle(err, src) {
        if (err) {
          done(err);
        } else if (src) {
          src.loader = loader;
          done(null, src);
        } else {
          next();
        }
      } // Resolve name relative to parentName


      name = that.resolveTemplate(loader, parentName, name);

      if (loader.async) {
        loader.getSource(name, handle);
      } else {
        handle(null, loader.getSource(name));
      }
    }, createTemplate);
    return syncResult;
  };

  _proto.express = function express(app) {
    return expressApp(this, app);
  };

  _proto.render = function render(name, ctx, cb) {
    if (lib.isFunction(ctx)) {
      cb = ctx;
      ctx = null;
    } // We support a synchronous API to make it easier to migrate
    // existing code to async. This works because if you don't do
    // anything async work, the whole thing is actually run
    // synchronously.


    var syncResult = null;
    this.getTemplate(name, function (err, tmpl) {
      if (err && cb) {
        callbackAsap(cb, err);
      } else if (err) {
        throw err;
      } else {
        syncResult = tmpl.render(ctx, cb);
      }
    });
    return syncResult;
  };

  _proto.renderString = function renderString(src, ctx, opts, cb) {
    if (lib.isFunction(opts)) {
      cb = opts;
      opts = {};
    }

    opts = opts || {};
    var tmpl = new Template(src, this, opts.path);
    return tmpl.render(ctx, cb);
  };

  _proto.waterfall = function waterfall(tasks, callback, forceAsync) {
    return _waterfall(tasks, callback, forceAsync);
  };

  return Environment;
}(EmitterObj);

var Context =
/*#__PURE__*/
function (_Obj) {
  _inheritsLoose(Context, _Obj);

  function Context() {
    return _Obj.apply(this, arguments) || this;
  }

  var _proto2 = Context.prototype;

  _proto2.init = function init(ctx, blocks, env) {
    var _this4 = this;

    // Has to be tied to an environment so we can tap into its globals.
    this.env = env || new Environment(); // Make a duplicate of ctx

    this.ctx = lib.extend({}, ctx);
    this.blocks = {};
    this.exported = [];
    lib.keys(blocks).forEach(function (name) {
      _this4.addBlock(name, blocks[name]);
    });
  };

  _proto2.lookup = function lookup(name) {
    // This is one of the most called functions, so optimize for
    // the typical case where the name isn't in the globals
    if (name in this.env.globals && !(name in this.ctx)) {
      return this.env.globals[name];
    } else {
      return this.ctx[name];
    }
  };

  _proto2.setVariable = function setVariable(name, val) {
    this.ctx[name] = val;
  };

  _proto2.getVariables = function getVariables() {
    return this.ctx;
  };

  _proto2.addBlock = function addBlock(name, block) {
    this.blocks[name] = this.blocks[name] || [];
    this.blocks[name].push(block);
    return this;
  };

  _proto2.getBlock = function getBlock(name) {
    if (!this.blocks[name]) {
      throw new Error('unknown block "' + name + '"');
    }

    return this.blocks[name][0];
  };

  _proto2.getSuper = function getSuper(env, name, block, frame, runtime, cb) {
    var idx = lib.indexOf(this.blocks[name] || [], block);
    var blk = this.blocks[name][idx + 1];
    var context = this;

    if (idx === -1 || !blk) {
      throw new Error('no super block available for "' + name + '"');
    }

    blk(env, context, frame, runtime, cb);
  };

  _proto2.addExport = function addExport(name) {
    this.exported.push(name);
  };

  _proto2.getExported = function getExported() {
    var _this5 = this;

    var exported = {};
    this.exported.forEach(function (name) {
      exported[name] = _this5.ctx[name];
    });
    return exported;
  };

  return Context;
}(Obj);

var Template =
/*#__PURE__*/
function (_Obj2) {
  _inheritsLoose(Template, _Obj2);

  function Template() {
    return _Obj2.apply(this, arguments) || this;
  }

  var _proto3 = Template.prototype;

  _proto3.init = function init(src, env, path, eagerCompile) {
    this.env = env || new Environment();

    if (lib.isObject(src)) {
      switch (src.type) {
        case 'code':
          this.tmplProps = src.obj;
          break;

        case 'string':
          this.tmplStr = src.obj;
          break;

        default:
          throw new Error("Unexpected template object type " + src.type + "; expected 'code', or 'string'");
      }
    } else if (lib.isString(src)) {
      this.tmplStr = src;
    } else {
      throw new Error('src must be a string or an object describing the source');
    }

    this.path = path;

    if (eagerCompile) {
      try {
        this._compile();
      } catch (err) {
        throw lib._prettifyError(this.path, this.env.opts.dev, err);
      }
    } else {
      this.compiled = false;
    }
  };

  _proto3.render = function render(ctx, parentFrame, cb) {
    var _this6 = this;

    if (typeof ctx === 'function') {
      cb = ctx;
      ctx = {};
    } else if (typeof parentFrame === 'function') {
      cb = parentFrame;
      parentFrame = null;
    } // If there is a parent frame, we are being called from internal
    // code of another template, and the internal system
    // depends on the sync/async nature of the parent template
    // to be inherited, so force an async callback


    var forceAsync = !parentFrame; // Catch compile errors for async rendering

    try {
      this.compile();
    } catch (e) {
      var err = lib._prettifyError(this.path, this.env.opts.dev, e);

      if (cb) {
        return callbackAsap(cb, err);
      } else {
        throw err;
      }
    }

    var context = new Context(ctx || {}, this.blocks, this.env);
    var frame = parentFrame ? parentFrame.push(true) : new Frame();
    frame.topLevel = true;
    var syncResult = null;
    var didError = false;
    this.rootRenderFunc(this.env, context, frame, globalRuntime, function (err, res) {
      if (didError) {
        // prevent multiple calls to cb
        if (cb) {
          return;
        } else {
          throw err;
        }
      }

      if (err) {
        err = lib._prettifyError(_this6.path, _this6.env.opts.dev, err);
        didError = true;
      }

      if (cb) {
        if (forceAsync) {
          callbackAsap(cb, err, res);
        } else {
          cb(err, res);
        }
      } else {
        if (err) {
          throw err;
        }

        syncResult = res;
      }
    });
    return syncResult;
  };

  _proto3.getExported = function getExported(ctx, parentFrame, cb) {
    // eslint-disable-line consistent-return
    if (typeof ctx === 'function') {
      cb = ctx;
      ctx = {};
    }

    if (typeof parentFrame === 'function') {
      cb = parentFrame;
      parentFrame = null;
    } // Catch compile errors for async rendering


    try {
      this.compile();
    } catch (e) {
      if (cb) {
        return cb(e);
      } else {
        throw e;
      }
    }

    var frame = parentFrame ? parentFrame.push() : new Frame();
    frame.topLevel = true; // Run the rootRenderFunc to populate the context with exported vars

    var context = new Context(ctx || {}, this.blocks, this.env);
    this.rootRenderFunc(this.env, context, frame, globalRuntime, function (err) {
      if (err) {
        cb(err, null);
      } else {
        cb(null, context.getExported());
      }
    });
  };

  _proto3.compile = function compile() {
    if (!this.compiled) {
      this._compile();
    }
  };

  _proto3._compile = function _compile() {
    var props;

    if (this.tmplProps) {
      props = this.tmplProps;
    } else {
      var source = compiler.compile(this.tmplStr, this.env.asyncFilters, this.env.extensionsList, this.path, this.env.opts);
      var func = new Function(source); // eslint-disable-line no-new-func

      props = func();
    }

    this.blocks = this._getBlocks(props);
    this.rootRenderFunc = props.root;
    this.compiled = true;
  };

  _proto3._getBlocks = function _getBlocks(props) {
    var blocks = {};
    lib.keys(props).forEach(function (k) {
      if (k.slice(0, 2) === 'b_') {
        blocks[k.slice(2)] = props[k];
      }
    });
    return blocks;
  };

  return Template;
}(Obj);

module.exports = {
  Environment: Environment,
  Template: Template
};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// rawAsap provides everything we need except exception management.
var rawAsap = __webpack_require__(9);
// RawTasks are recycled to reduce GC churn.
var freeTasks = [];
// We queue errors to ensure they are thrown in right order (FIFO).
// Array-as-queue is good enough here, since we are just dealing with exceptions.
var pendingErrors = [];
var requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);

function throwFirstError() {
    if (pendingErrors.length) {
        throw pendingErrors.shift();
    }
}

/**
 * Calls a task as soon as possible after returning, in its own event, with priority
 * over other events like animation, reflow, and repaint. An error thrown from an
 * event will not interrupt, nor even substantially slow down the processing of
 * other events, but will be rather postponed to a lower priority event.
 * @param {{call}} task A callable object, typically a function that takes no
 * arguments.
 */
module.exports = asap;
function asap(task) {
    var rawTask;
    if (freeTasks.length) {
        rawTask = freeTasks.pop();
    } else {
        rawTask = new RawTask();
    }
    rawTask.task = task;
    rawAsap(rawTask);
}

// We wrap tasks with recyclable task objects.  A task object implements
// `call`, just like a function.
function RawTask() {
    this.task = null;
}

// The sole purpose of wrapping the task is to catch the exception and recycle
// the task object after its single use.
RawTask.prototype.call = function () {
    try {
        this.task.call();
    } catch (error) {
        if (asap.onerror) {
            // This hook exists purely for testing purposes.
            // Its name will be periodically randomized to break any code that
            // depends on its existence.
            asap.onerror(error);
        } else {
            // In a web browser, exceptions are not fatal. However, to avoid
            // slowing down the queue of pending tasks, we rethrow the error in a
            // lower priority turn.
            pendingErrors.push(error);
            requestErrorThrow();
        }
    } finally {
        this.task = null;
        freeTasks[freeTasks.length] = this;
    }
};


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including IO, animation, reflow, and redraw
// events in browsers.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
module.exports = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Equivalent to push, but avoids a function call.
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// `requestFlush` is an implementation-specific method that attempts to kick
// off a `flush` event as quickly as possible. `flush` will attempt to exhaust
// the event queue before yielding to the browser's own event loop.
var requestFlush;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory exhaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don't
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
    flushing = false;
}

// `requestFlush` is implemented using a strategy based on data collected from
// every available SauceLabs Selenium web driver worker at time of writing.
// https://docs.google.com/spreadsheets/d/1mG-5UYGup5qxGdEMWkhP6BWCz053NUb2E1QoUTU16uA/edit#gid=783724593

// Safari 6 and 6.1 for desktop, iPad, and iPhone are the only browsers that
// have WebKitMutationObserver but not un-prefixed MutationObserver.
// Must use `global` or `self` instead of `window` to work in both frames and web
// workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.

/* globals self */
var scope = typeof global !== "undefined" ? global : self;
var BrowserMutationObserver = scope.MutationObserver || scope.WebKitMutationObserver;

// MutationObservers are desirable because they have high priority and work
// reliably everywhere they are implemented.
// They are implemented in all modern browsers.
//
// - Android 4-4.3
// - Chrome 26-34
// - Firefox 14-29
// - Internet Explorer 11
// - iPad Safari 6-7.1
// - iPhone Safari 7-7.1
// - Safari 6-7
if (typeof BrowserMutationObserver === "function") {
    requestFlush = makeRequestCallFromMutationObserver(flush);

// MessageChannels are desirable because they give direct access to the HTML
// task queue, are implemented in Internet Explorer 10, Safari 5.0-1, and Opera
// 11-12, and in web workers in many engines.
// Although message channels yield to any queued rendering and IO tasks, they
// would be better than imposing the 4ms delay of timers.
// However, they do not work reliably in Internet Explorer or Safari.

// Internet Explorer 10 is the only browser that has setImmediate but does
// not have MutationObservers.
// Although setImmediate yields to the browser's renderer, it would be
// preferrable to falling back to setTimeout since it does not have
// the minimum 4ms penalty.
// Unfortunately there appears to be a bug in Internet Explorer 10 Mobile (and
// Desktop to a lesser extent) that renders both setImmediate and
// MessageChannel useless for the purposes of ASAP.
// https://github.com/kriskowal/q/issues/396

// Timers are implemented universally.
// We fall back to timers in workers in most engines, and in foreground
// contexts in the following browsers.
// However, note that even this simple case requires nuances to operate in a
// broad spectrum of browsers.
//
// - Firefox 3-13
// - Internet Explorer 6-9
// - iPad Safari 4.3
// - Lynx 2.8.7
} else {
    requestFlush = makeRequestCallFromTimer(flush);
}

// `requestFlush` requests that the high priority event queue be flushed as
// soon as possible.
// This is useful to prevent an error thrown in a task from stalling the event
// queue if the exception handled by Node.js’s
// `process.on("uncaughtException")` or by a domain.
rawAsap.requestFlush = requestFlush;

// To request a high priority event, we induce a mutation observer by toggling
// the text of a text node between "1" and "-1".
function makeRequestCallFromMutationObserver(callback) {
    var toggle = 1;
    var observer = new BrowserMutationObserver(callback);
    var node = document.createTextNode("");
    observer.observe(node, {characterData: true});
    return function requestCall() {
        toggle = -toggle;
        node.data = toggle;
    };
}

// The message channel technique was discovered by Malte Ubl and was the
// original foundation for this library.
// http://www.nonblocking.io/2011/06/windownexttick.html

// Safari 6.0.5 (at least) intermittently fails to create message ports on a
// page's first load. Thankfully, this version of Safari supports
// MutationObservers, so we don't need to fall back in that case.

// function makeRequestCallFromMessageChannel(callback) {
//     var channel = new MessageChannel();
//     channel.port1.onmessage = callback;
//     return function requestCall() {
//         channel.port2.postMessage(0);
//     };
// }

// For reasons explained above, we are also unable to use `setImmediate`
// under any circumstances.
// Even if we were, there is another bug in Internet Explorer 10.
// It is not sufficient to assign `setImmediate` to `requestFlush` because
// `setImmediate` must be called *by name* and therefore must be wrapped in a
// closure.
// Never forget.

// function makeRequestCallFromSetImmediate(callback) {
//     return function requestCall() {
//         setImmediate(callback);
//     };
// }

// Safari 6.0 has a problem where timers will get lost while the user is
// scrolling. This problem does not impact ASAP because Safari 6.0 supports
// mutation observers, so that implementation is used instead.
// However, if we ever elect to use timers in Safari, the prevalent work-around
// is to add a scroll event listener that calls for a flush.

// `setTimeout` does not call the passed callback if the delay is less than
// approximately 7 in web workers in Firefox 8 through 18, and sometimes not
// even then.

function makeRequestCallFromTimer(callback) {
    return function requestCall() {
        // We dispatch a timeout with a specified delay of 0 for engines that
        // can reliably accommodate that request. This will usually be snapped
        // to a 4 milisecond delay, but once we're flushing, there's no delay
        // between events.
        var timeoutHandle = setTimeout(handleTimer, 0);
        // However, since this timer gets frequently dropped in Firefox
        // workers, we enlist an interval handle that will try to fire
        // an event 20 times per second until it succeeds.
        var intervalHandle = setInterval(handleTimer, 50);

        function handleTimer() {
            // Whichever timer succeeds will cancel both timers and
            // execute the callback.
            clearTimeout(timeoutHandle);
            clearInterval(intervalHandle);
            callback();
        }
    };
}

// This is for `asap.js` only.
// Its name will be periodically randomized to break any code that depends on
// its existence.
rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;

// ASAP was originally a nextTick shim included in Q. This was factored out
// into this ASAP package. It was later adapted to RSVP which made further
// amendments. These decisions, particularly to marginalize MessageChannel and
// to capture the MutationObserver implementation in a closure, were integrated
// back into ASAP proper.
// https://github.com/tildeio/rsvp.js/blob/cddf7232546a9cf858524b75cde6f9edf72620a7/lib/rsvp/asap.js

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ }),
/* 10 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// MIT license (by Elan Shanker).
(function(globals) {
  'use strict';

  var executeSync = function(){
    var args = Array.prototype.slice.call(arguments);
    if (typeof args[0] === 'function'){
      args[0].apply(null, args.splice(1));
    }
  };

  var executeAsync = function(fn){
    if (typeof setImmediate === 'function') {
      setImmediate(fn);
    } else if (typeof process !== 'undefined' && process.nextTick) {
      process.nextTick(fn);
    } else {
      setTimeout(fn, 0);
    }
  };

  var makeIterator = function (tasks) {
    var makeCallback = function (index) {
      var fn = function () {
        if (tasks.length) {
          tasks[index].apply(null, arguments);
        }
        return fn.next();
      };
      fn.next = function () {
        return (index < tasks.length - 1) ? makeCallback(index + 1): null;
      };
      return fn;
    };
    return makeCallback(0);
  };
  
  var _isArray = Array.isArray || function(maybeArray){
    return Object.prototype.toString.call(maybeArray) === '[object Array]';
  };

  var waterfall = function (tasks, callback, forceAsync) {
    var nextTick = forceAsync ? executeAsync : executeSync;
    callback = callback || function () {};
    if (!_isArray(tasks)) {
      var err = new Error('First argument to waterfall must be an array of functions');
      return callback(err);
    }
    if (!tasks.length) {
      return callback();
    }
    var wrapIterator = function (iterator) {
      return function (err) {
        if (err) {
          callback.apply(null, arguments);
          callback = function () {};
        } else {
          var args = Array.prototype.slice.call(arguments, 1);
          var next = iterator.next();
          if (next) {
            args.push(wrapIterator(next));
          } else {
            args.push(callback);
          }
          nextTick(function () {
            iterator.apply(null, args);
          });
        }
      };
    };
    wrapIterator(makeIterator(tasks))();
  };

  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {
      return waterfall;
    }).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // RequireJS
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = waterfall; // CommonJS
  } else {
    globals.waterfall = waterfall; // <script>
  }
})(this);


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var lib = __webpack_require__(1);

var r = __webpack_require__(2);

var exports = module.exports = {};

function normalize(value, defaultValue) {
  if (value === null || value === undefined || value === false) {
    return defaultValue;
  }

  return value;
}

exports.abs = Math.abs;

function isNaN(num) {
  return num !== num; // eslint-disable-line no-self-compare
}

function batch(arr, linecount, fillWith) {
  var i;
  var res = [];
  var tmp = [];

  for (i = 0; i < arr.length; i++) {
    if (i % linecount === 0 && tmp.length) {
      res.push(tmp);
      tmp = [];
    }

    tmp.push(arr[i]);
  }

  if (tmp.length) {
    if (fillWith) {
      for (i = tmp.length; i < linecount; i++) {
        tmp.push(fillWith);
      }
    }

    res.push(tmp);
  }

  return res;
}

exports.batch = batch;

function capitalize(str) {
  str = normalize(str, '');
  var ret = str.toLowerCase();
  return r.copySafeness(str, ret.charAt(0).toUpperCase() + ret.slice(1));
}

exports.capitalize = capitalize;

function center(str, width) {
  str = normalize(str, '');
  width = width || 80;

  if (str.length >= width) {
    return str;
  }

  var spaces = width - str.length;
  var pre = lib.repeat(' ', spaces / 2 - spaces % 2);
  var post = lib.repeat(' ', spaces / 2);
  return r.copySafeness(str, pre + str + post);
}

exports.center = center;

function default_(val, def, bool) {
  if (bool) {
    return val || def;
  } else {
    return val !== undefined ? val : def;
  }
} // TODO: it is confusing to export something called 'default'


exports['default'] = default_; // eslint-disable-line dot-notation

function dictsort(val, caseSensitive, by) {
  if (!lib.isObject(val)) {
    throw new lib.TemplateError('dictsort filter: val must be an object');
  }

  var array = []; // deliberately include properties from the object's prototype

  for (var k in val) {
    // eslint-disable-line guard-for-in, no-restricted-syntax
    array.push([k, val[k]]);
  }

  var si;

  if (by === undefined || by === 'key') {
    si = 0;
  } else if (by === 'value') {
    si = 1;
  } else {
    throw new lib.TemplateError('dictsort filter: You can only sort by either key or value');
  }

  array.sort(function (t1, t2) {
    var a = t1[si];
    var b = t2[si];

    if (!caseSensitive) {
      if (lib.isString(a)) {
        a = a.toUpperCase();
      }

      if (lib.isString(b)) {
        b = b.toUpperCase();
      }
    }

    return a > b ? 1 : a === b ? 0 : -1; // eslint-disable-line no-nested-ternary
  });
  return array;
}

exports.dictsort = dictsort;

function dump(obj, spaces) {
  return JSON.stringify(obj, null, spaces);
}

exports.dump = dump;

function escape(str) {
  if (str instanceof r.SafeString) {
    return str;
  }

  str = str === null || str === undefined ? '' : str;
  return r.markSafe(lib.escape(str.toString()));
}

exports.escape = escape;

function safe(str) {
  if (str instanceof r.SafeString) {
    return str;
  }

  str = str === null || str === undefined ? '' : str;
  return r.markSafe(str.toString());
}

exports.safe = safe;

function first(arr) {
  return arr[0];
}

exports.first = first;

function forceescape(str) {
  str = str === null || str === undefined ? '' : str;
  return r.markSafe(lib.escape(str.toString()));
}

exports.forceescape = forceescape;

function groupby(arr, attr) {
  return lib.groupBy(arr, attr);
}

exports.groupby = groupby;

function indent(str, width, indentfirst) {
  str = normalize(str, '');

  if (str === '') {
    return '';
  }

  width = width || 4; // let res = '';

  var lines = str.split('\n');
  var sp = lib.repeat(' ', width);
  var res = lines.map(function (l, i) {
    return i === 0 && !indentfirst ? l + "\n" : "" + sp + l + "\n";
  }).join('');
  return r.copySafeness(str, res);
}

exports.indent = indent;

function join(arr, del, attr) {
  del = del || '';

  if (attr) {
    arr = lib.map(arr, function (v) {
      return v[attr];
    });
  }

  return arr.join(del);
}

exports.join = join;

function last(arr) {
  return arr[arr.length - 1];
}

exports.last = last;

function lengthFilter(val) {
  var value = normalize(val, '');

  if (value !== undefined) {
    if (typeof Map === 'function' && value instanceof Map || typeof Set === 'function' && value instanceof Set) {
      // ECMAScript 2015 Maps and Sets
      return value.size;
    }

    if (lib.isObject(value) && !(value instanceof r.SafeString)) {
      // Objects (besides SafeStrings), non-primative Arrays
      return lib.keys(value).length;
    }

    return value.length;
  }

  return 0;
}

exports.length = lengthFilter;

function list(val) {
  if (lib.isString(val)) {
    return val.split('');
  } else if (lib.isObject(val)) {
    return lib._entries(val || {}).map(function (_ref) {
      var key = _ref[0],
          value = _ref[1];
      return {
        key: key,
        value: value
      };
    });
  } else if (lib.isArray(val)) {
    return val;
  } else {
    throw new lib.TemplateError('list filter: type not iterable');
  }
}

exports.list = list;

function lower(str) {
  str = normalize(str, '');
  return str.toLowerCase();
}

exports.lower = lower;

function nl2br(str) {
  if (str === null || str === undefined) {
    return '';
  }

  return r.copySafeness(str, str.replace(/\r\n|\n/g, '<br />\n'));
}

exports.nl2br = nl2br;

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

exports.random = random;

function rejectattr(arr, attr) {
  return arr.filter(function (item) {
    return !item[attr];
  });
}

exports.rejectattr = rejectattr;

function selectattr(arr, attr) {
  return arr.filter(function (item) {
    return !!item[attr];
  });
}

exports.selectattr = selectattr;

function replace(str, old, new_, maxCount) {
  var originalStr = str;

  if (old instanceof RegExp) {
    return str.replace(old, new_);
  }

  if (typeof maxCount === 'undefined') {
    maxCount = -1;
  }

  var res = ''; // Output
  // Cast Numbers in the search term to string

  if (typeof old === 'number') {
    old = '' + old;
  } else if (typeof old !== 'string') {
    // If it is something other than number or string,
    // return the original string
    return str;
  } // Cast numbers in the replacement to string


  if (typeof str === 'number') {
    str = '' + str;
  } // If by now, we don't have a string, throw it back


  if (typeof str !== 'string' && !(str instanceof r.SafeString)) {
    return str;
  } // ShortCircuits


  if (old === '') {
    // Mimic the python behaviour: empty string is replaced
    // by replacement e.g. "abc"|replace("", ".") -> .a.b.c.
    res = new_ + str.split('').join(new_) + new_;
    return r.copySafeness(str, res);
  }

  var nextIndex = str.indexOf(old); // if # of replacements to perform is 0, or the string to does
  // not contain the old value, return the string

  if (maxCount === 0 || nextIndex === -1) {
    return str;
  }

  var pos = 0;
  var count = 0; // # of replacements made

  while (nextIndex > -1 && (maxCount === -1 || count < maxCount)) {
    // Grab the next chunk of src string and add it with the
    // replacement, to the result
    res += str.substring(pos, nextIndex) + new_; // Increment our pointer in the src string

    pos = nextIndex + old.length;
    count++; // See if there are any more replacements to be made

    nextIndex = str.indexOf(old, pos);
  } // We've either reached the end, or done the max # of
  // replacements, tack on any remaining string


  if (pos < str.length) {
    res += str.substring(pos);
  }

  return r.copySafeness(originalStr, res);
}

exports.replace = replace;

function reverse(val) {
  var arr;

  if (lib.isString(val)) {
    arr = list(val);
  } else {
    // Copy it
    arr = lib.map(val, function (v) {
      return v;
    });
  }

  arr.reverse();

  if (lib.isString(val)) {
    return r.copySafeness(val, arr.join(''));
  }

  return arr;
}

exports.reverse = reverse;

function round(val, precision, method) {
  precision = precision || 0;
  var factor = Math.pow(10, precision);
  var rounder;

  if (method === 'ceil') {
    rounder = Math.ceil;
  } else if (method === 'floor') {
    rounder = Math.floor;
  } else {
    rounder = Math.round;
  }

  return rounder(val * factor) / factor;
}

exports.round = round;

function slice(arr, slices, fillWith) {
  var sliceLength = Math.floor(arr.length / slices);
  var extra = arr.length % slices;
  var res = [];
  var offset = 0;

  for (var i = 0; i < slices; i++) {
    var start = offset + i * sliceLength;

    if (i < extra) {
      offset++;
    }

    var end = offset + (i + 1) * sliceLength;
    var currSlice = arr.slice(start, end);

    if (fillWith && i >= extra) {
      currSlice.push(fillWith);
    }

    res.push(currSlice);
  }

  return res;
}

exports.slice = slice;

function sum(arr, attr, start) {
  if (start === void 0) {
    start = 0;
  }

  if (attr) {
    arr = lib.map(arr, function (v) {
      return v[attr];
    });
  }

  return start + arr.reduce(function (a, b) {
    return a + b;
  }, 0);
}

exports.sum = sum;
exports.sort = r.makeMacro(['value', 'reverse', 'case_sensitive', 'attribute'], [], function (arr, reversed, caseSens, attr) {
  // Copy it
  var array = lib.map(arr, function (v) {
    return v;
  });
  array.sort(function (a, b) {
    var x = attr ? a[attr] : a;
    var y = attr ? b[attr] : b;

    if (!caseSens && lib.isString(x) && lib.isString(y)) {
      x = x.toLowerCase();
      y = y.toLowerCase();
    }

    if (x < y) {
      return reversed ? 1 : -1;
    } else if (x > y) {
      return reversed ? -1 : 1;
    } else {
      return 0;
    }
  });
  return array;
});

function string(obj) {
  return r.copySafeness(obj, obj);
}

exports.string = string;

function striptags(input, preserveLinebreaks) {
  input = normalize(input, '');
  var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>|<!--[\s\S]*?-->/gi;
  var trimmedInput = trim(input.replace(tags, ''));
  var res = '';

  if (preserveLinebreaks) {
    res = trimmedInput.replace(/^ +| +$/gm, '') // remove leading and trailing spaces
    .replace(/ +/g, ' ') // squash adjacent spaces
    .replace(/(\r\n)/g, '\n') // normalize linebreaks (CRLF -> LF)
    .replace(/\n\n\n+/g, '\n\n'); // squash abnormal adjacent linebreaks
  } else {
    res = trimmedInput.replace(/\s+/gi, ' ');
  }

  return r.copySafeness(input, res);
}

exports.striptags = striptags;

function title(str) {
  str = normalize(str, '');
  var words = str.split(' ').map(function (word) {
    return capitalize(word);
  });
  return r.copySafeness(str, words.join(' '));
}

exports.title = title;

function trim(str) {
  return r.copySafeness(str, str.replace(/^\s*|\s*$/g, ''));
}

exports.trim = trim;

function truncate(input, length, killwords, end) {
  var orig = input;
  input = normalize(input, '');
  length = length || 255;

  if (input.length <= length) {
    return input;
  }

  if (killwords) {
    input = input.substring(0, length);
  } else {
    var idx = input.lastIndexOf(' ', length);

    if (idx === -1) {
      idx = length;
    }

    input = input.substring(0, idx);
  }

  input += end !== undefined && end !== null ? end : '...';
  return r.copySafeness(orig, input);
}

exports.truncate = truncate;

function upper(str) {
  str = normalize(str, '');
  return str.toUpperCase();
}

exports.upper = upper;

function urlencode(obj) {
  var enc = encodeURIComponent;

  if (lib.isString(obj)) {
    return enc(obj);
  } else {
    var keyvals = lib.isArray(obj) ? obj : lib._entries(obj);
    return keyvals.map(function (_ref2) {
      var k = _ref2[0],
          v = _ref2[1];
      return enc(k) + "=" + enc(v);
    }).join('&');
  }
}

exports.urlencode = urlencode; // For the jinja regexp, see
// https://github.com/mitsuhiko/jinja2/blob/f15b814dcba6aa12bc74d1f7d0c881d55f7126be/jinja2/utils.py#L20-L23

var puncRe = /^(?:\(|<|&lt;)?(.*?)(?:\.|,|\)|\n|&gt;)?$/; // from http://blog.gerv.net/2011/05/html5_email_address_regexp/

var emailRe = /^[\w.!#$%&'*+\-\/=?\^`{|}~]+@[a-z\d\-]+(\.[a-z\d\-]+)+$/i;
var httpHttpsRe = /^https?:\/\/.*$/;
var wwwRe = /^www\./;
var tldRe = /\.(?:org|net|com)(?:\:|\/|$)/;

function urlize(str, length, nofollow) {
  if (isNaN(length)) {
    length = Infinity;
  }

  var noFollowAttr = nofollow === true ? ' rel="nofollow"' : '';
  var words = str.split(/(\s+)/).filter(function (word) {
    // If the word has no length, bail. This can happen for str with
    // trailing whitespace.
    return word && word.length;
  }).map(function (word) {
    var matches = word.match(puncRe);
    var possibleUrl = matches ? matches[1] : word;
    var shortUrl = possibleUrl.substr(0, length); // url that starts with http or https

    if (httpHttpsRe.test(possibleUrl)) {
      return "<a href=\"" + possibleUrl + "\"" + noFollowAttr + ">" + shortUrl + "</a>";
    } // url that starts with www.


    if (wwwRe.test(possibleUrl)) {
      return "<a href=\"http://" + possibleUrl + "\"" + noFollowAttr + ">" + shortUrl + "</a>";
    } // an email address of the form username@domain.tld


    if (emailRe.test(possibleUrl)) {
      return "<a href=\"mailto:" + possibleUrl + "\">" + possibleUrl + "</a>";
    } // url that ends in .com, .org or .net that is not an email address


    if (tldRe.test(possibleUrl)) {
      return "<a href=\"http://" + possibleUrl + "\"" + noFollowAttr + ">" + shortUrl + "</a>";
    }

    return word;
  });
  return words.join('');
}

exports.urlize = urlize;

function wordcount(str) {
  str = normalize(str, '');
  var words = str ? str.match(/\w+/g) : null;
  return words ? words.length : null;
}

exports.wordcount = wordcount;

function float(val, def) {
  var res = parseFloat(val);
  return isNaN(res) ? def : res;
}

exports.float = float;

function int(val, def) {
  var res = parseInt(val, 10);
  return isNaN(res) ? def : res;
}

exports.int = int; // Aliases

exports.d = exports.default;
exports.e = exports.escape;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = $getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  var args = [];
  for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    ReflectApply(this.listener, this.target, args);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var SafeString = __webpack_require__(2).SafeString;
/**
 * Returns `true` if the object is a function, otherwise `false`.
 * @param { any } value
 * @returns { boolean }
 */


function callable(value) {
  return typeof value === 'function';
}

exports.callable = callable;
/**
 * Returns `true` if the object is strictly not `undefined`.
 * @param { any } value
 * @returns { boolean }
 */

function defined(value) {
  return value !== undefined;
}

exports.defined = defined;
/**
 * Returns `true` if the operand (one) is divisble by the test's argument
 * (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */

function divisibleby(one, two) {
  return one % two === 0;
}

exports.divisibleby = divisibleby;
/**
 * Returns true if the string has been escaped (i.e., is a SafeString).
 * @param { any } value
 * @returns { boolean }
 */

function escaped(value) {
  return value instanceof SafeString;
}

exports.escaped = escaped;
/**
 * Returns `true` if the arguments are strictly equal.
 * @param { any } one
 * @param { any } two
 */

function equalto(one, two) {
  return one === two;
}

exports.equalto = equalto; // Aliases

exports.eq = exports.equalto;
exports.sameas = exports.equalto;
/**
 * Returns `true` if the value is evenly divisible by 2.
 * @param { number } value
 * @returns { boolean }
 */

function even(value) {
  return value % 2 === 0;
}

exports.even = even;
/**
 * Returns `true` if the value is falsy - if I recall correctly, '', 0, false,
 * undefined, NaN or null. I don't know if we should stick to the default JS
 * behavior or attempt to replicate what Python believes should be falsy (i.e.,
 * empty arrays, empty dicts, not 0...).
 * @param { any } value
 * @returns { boolean }
 */

function falsy(value) {
  return !value;
}

exports.falsy = falsy;
/**
 * Returns `true` if the operand (one) is greater or equal to the test's
 * argument (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */

function ge(one, two) {
  return one >= two;
}

exports.ge = ge;
/**
 * Returns `true` if the operand (one) is greater than the test's argument
 * (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */

function greaterthan(one, two) {
  return one > two;
}

exports.greaterthan = greaterthan; // alias

exports.gt = exports.greaterthan;
/**
 * Returns `true` if the operand (one) is less than or equal to the test's
 * argument (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */

function le(one, two) {
  return one <= two;
}

exports.le = le;
/**
 * Returns `true` if the operand (one) is less than the test's passed argument
 * (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */

function lessthan(one, two) {
  return one < two;
}

exports.lessthan = lessthan; // alias

exports.lt = exports.lessthan;
/**
 * Returns `true` if the string is lowercased.
 * @param { string } value
 * @returns { boolean }
 */

function lower(value) {
  return value.toLowerCase() === value;
}

exports.lower = lower;
/**
 * Returns `true` if the operand (one) is less than or equal to the test's
 * argument (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */

function ne(one, two) {
  return one !== two;
}

exports.ne = ne;
/**
 * Returns true if the value is strictly equal to `null`.
 * @param { any }
 * @returns { boolean }
 */

function nullTest(value) {
  return value === null;
}

exports.null = nullTest;
/**
 * Returns true if value is a number.
 * @param { any }
 * @returns { boolean }
 */

function number(value) {
  return typeof value === 'number';
}

exports.number = number;
/**
 * Returns `true` if the value is *not* evenly divisible by 2.
 * @param { number } value
 * @returns { boolean }
 */

function odd(value) {
  return value % 2 === 1;
}

exports.odd = odd;
/**
 * Returns `true` if the value is a string, `false` if not.
 * @param { any } value
 * @returns { boolean }
 */

function string(value) {
  return typeof value === 'string';
}

exports.string = string;
/**
 * Returns `true` if the value is not in the list of things considered falsy:
 * '', null, undefined, 0, NaN and false.
 * @param { any } value
 * @returns { boolean }
 */

function truthy(value) {
  return !!value;
}

exports.truthy = truthy;
/**
 * Returns `true` if the value is undefined.
 * @param { any } value
 * @returns { boolean }
 */

function undefinedTest(value) {
  return value === undefined;
}

exports.undefined = undefinedTest;
/**
 * Returns `true` if the string is uppercased.
 * @param { string } value
 * @returns { boolean }
 */

function upper(value) {
  return value.toUpperCase() === value;
}

exports.upper = upper;
/**
 * If ES6 features are available, returns `true` if the value implements the
 * `Symbol.iterator` method. If not, it's a string or Array.
 *
 * Could potentially cause issues if a browser exists that has Set and Map but
 * not Symbol.
 *
 * @param { any } value
 * @returns { boolean }
 */

function iterable(value) {
  if (typeof Symbol !== 'undefined') {
    return !!value[Symbol.iterator];
  } else {
    return Array.isArray(value) || typeof value === 'string';
  }
}

exports.iterable = iterable;
/**
 * If ES6 features are available, returns `true` if the value is an object hash
 * or an ES6 Map. Otherwise just return if it's an object hash.
 * @param { any } value
 * @returns { boolean }
 */

function mapping(value) {
  // only maps and object hashes
  var bool = value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);

  if (Set) {
    return bool && !(value instanceof Set);
  } else {
    return bool;
  }
}

exports.mapping = mapping;

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _cycler(items) {
  var index = -1;
  return {
    current: null,
    reset: function reset() {
      index = -1;
      this.current = null;
    },
    next: function next() {
      index++;

      if (index >= items.length) {
        index = 0;
      }

      this.current = items[index];
      return this.current;
    }
  };
}

function _joiner(sep) {
  sep = sep || ',';
  var first = true;
  return function () {
    var val = first ? '' : sep;
    first = false;
    return val;
  };
} // Making this a function instead so it returns a new object
// each time it's called. That way, if something like an environment
// uses it, they will each have their own copy.


function globals() {
  return {
    range: function range(start, stop, step) {
      if (typeof stop === 'undefined') {
        stop = start;
        start = 0;
        step = 1;
      } else if (!step) {
        step = 1;
      }

      var arr = [];

      if (step > 0) {
        for (var i = start; i < stop; i += step) {
          arr.push(i);
        }
      } else {
        for (var _i = start; _i > stop; _i += step) {
          // eslint-disable-line for-direction
          arr.push(_i);
        }
      }

      return arr;
    },
    cycler: function cycler() {
      return _cycler(Array.prototype.slice.call(arguments));
    },
    joiner: function joiner(sep) {
      return _joiner(sep);
    }
  };
}

module.exports = globals;

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

var path = __webpack_require__(0);

module.exports = function express(env, app) {
  function NunjucksView(name, opts) {
    this.name = name;
    this.path = name;
    this.defaultEngine = opts.defaultEngine;
    this.ext = path.extname(name);

    if (!this.ext && !this.defaultEngine) {
      throw new Error('No default engine was specified and no extension was provided.');
    }

    if (!this.ext) {
      this.name += this.ext = (this.defaultEngine[0] !== '.' ? '.' : '') + this.defaultEngine;
    }
  }

  NunjucksView.prototype.render = function render(opts, cb) {
    env.render(this.name, opts, cb);
  };

  app.set('view', NunjucksView);
  app.set('nunjucksEnv', env);
  return env;
};

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

function installCompat() {
  'use strict';
  /* eslint-disable camelcase */
  // This must be called like `nunjucks.installCompat` so that `this`
  // references the nunjucks instance

  var runtime = this.runtime;
  var lib = this.lib; // Handle slim case where these 'modules' are excluded from the built source

  var Compiler = this.compiler.Compiler;
  var Parser = this.parser.Parser;
  var nodes = this.nodes;
  var lexer = this.lexer;
  var orig_contextOrFrameLookup = runtime.contextOrFrameLookup;
  var orig_memberLookup = runtime.memberLookup;
  var orig_Compiler_assertType;
  var orig_Parser_parseAggregate;

  if (Compiler) {
    orig_Compiler_assertType = Compiler.prototype.assertType;
  }

  if (Parser) {
    orig_Parser_parseAggregate = Parser.prototype.parseAggregate;
  }

  function uninstall() {
    runtime.contextOrFrameLookup = orig_contextOrFrameLookup;
    runtime.memberLookup = orig_memberLookup;

    if (Compiler) {
      Compiler.prototype.assertType = orig_Compiler_assertType;
    }

    if (Parser) {
      Parser.prototype.parseAggregate = orig_Parser_parseAggregate;
    }
  }

  runtime.contextOrFrameLookup = function contextOrFrameLookup(context, frame, key) {
    var val = orig_contextOrFrameLookup.apply(this, arguments);

    if (val !== undefined) {
      return val;
    }

    switch (key) {
      case 'True':
        return true;

      case 'False':
        return false;

      case 'None':
        return null;

      default:
        return undefined;
    }
  };

  function getTokensState(tokens) {
    return {
      index: tokens.index,
      lineno: tokens.lineno,
      colno: tokens.colno
    };
  }

  if (false) {
    // i.e., not slim mode
    var Slice = nodes.Node.extend('Slice', {
      fields: ['start', 'stop', 'step'],
      init: function init(lineno, colno, start, stop, step) {
        start = start || new nodes.Literal(lineno, colno, null);
        stop = stop || new nodes.Literal(lineno, colno, null);
        step = step || new nodes.Literal(lineno, colno, 1);
        this.parent(lineno, colno, start, stop, step);
      }
    });

    Compiler.prototype.assertType = function assertType(node) {
      if (node instanceof Slice) {
        return;
      }

      orig_Compiler_assertType.apply(this, arguments);
    };

    Compiler.prototype.compileSlice = function compileSlice(node, frame) {
      this._emit('(');

      this._compileExpression(node.start, frame);

      this._emit('),(');

      this._compileExpression(node.stop, frame);

      this._emit('),(');

      this._compileExpression(node.step, frame);

      this._emit(')');
    };

    Parser.prototype.parseAggregate = function parseAggregate() {
      var _this = this;

      var origState = getTokensState(this.tokens); // Set back one accounting for opening bracket/parens

      origState.colno--;
      origState.index--;

      try {
        return orig_Parser_parseAggregate.apply(this);
      } catch (e) {
        var errState = getTokensState(this.tokens);

        var rethrow = function rethrow() {
          lib._assign(_this.tokens, errState);

          return e;
        }; // Reset to state before original parseAggregate called


        lib._assign(this.tokens, origState);

        this.peeked = false;
        var tok = this.peekToken();

        if (tok.type !== lexer.TOKEN_LEFT_BRACKET) {
          throw rethrow();
        } else {
          this.nextToken();
        }

        var node = new Slice(tok.lineno, tok.colno); // If we don't encounter a colon while parsing, this is not a slice,
        // so re-raise the original exception.

        var isSlice = false;

        for (var i = 0; i <= node.fields.length; i++) {
          if (this.skip(lexer.TOKEN_RIGHT_BRACKET)) {
            break;
          }

          if (i === node.fields.length) {
            if (isSlice) {
              this.fail('parseSlice: too many slice components', tok.lineno, tok.colno);
            } else {
              break;
            }
          }

          if (this.skip(lexer.TOKEN_COLON)) {
            isSlice = true;
          } else {
            var field = node.fields[i];
            node[field] = this.parseExpression();
            isSlice = this.skip(lexer.TOKEN_COLON) || isSlice;
          }
        }

        if (!isSlice) {
          throw rethrow();
        }

        return new nodes.Array(tok.lineno, tok.colno, [node]);
      }
    };
  }

  function sliceLookup(obj, start, stop, step) {
    obj = obj || [];

    if (start === null) {
      start = step < 0 ? obj.length - 1 : 0;
    }

    if (stop === null) {
      stop = step < 0 ? -1 : obj.length;
    } else if (stop < 0) {
      stop += obj.length;
    }

    if (start < 0) {
      start += obj.length;
    }

    var results = [];

    for (var i = start;; i += step) {
      if (i < 0 || i > obj.length) {
        break;
      }

      if (step > 0 && i >= stop) {
        break;
      }

      if (step < 0 && i <= stop) {
        break;
      }

      results.push(runtime.memberLookup(obj, i));
    }

    return results;
  }

  function hasOwnProp(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  var ARRAY_MEMBERS = {
    pop: function pop(index) {
      if (index === undefined) {
        return this.pop();
      }

      if (index >= this.length || index < 0) {
        throw new Error('KeyError');
      }

      return this.splice(index, 1);
    },
    append: function append(element) {
      return this.push(element);
    },
    remove: function remove(element) {
      for (var i = 0; i < this.length; i++) {
        if (this[i] === element) {
          return this.splice(i, 1);
        }
      }

      throw new Error('ValueError');
    },
    count: function count(element) {
      var count = 0;

      for (var i = 0; i < this.length; i++) {
        if (this[i] === element) {
          count++;
        }
      }

      return count;
    },
    index: function index(element) {
      var i;

      if ((i = this.indexOf(element)) === -1) {
        throw new Error('ValueError');
      }

      return i;
    },
    find: function find(element) {
      return this.indexOf(element);
    },
    insert: function insert(index, elem) {
      return this.splice(index, 0, elem);
    }
  };
  var OBJECT_MEMBERS = {
    items: function items() {
      return lib._entries(this);
    },
    values: function values() {
      return lib._values(this);
    },
    keys: function keys() {
      return lib.keys(this);
    },
    get: function get(key, def) {
      var output = this[key];

      if (output === undefined) {
        output = def;
      }

      return output;
    },
    has_key: function has_key(key) {
      return hasOwnProp(this, key);
    },
    pop: function pop(key, def) {
      var output = this[key];

      if (output === undefined && def !== undefined) {
        output = def;
      } else if (output === undefined) {
        throw new Error('KeyError');
      } else {
        delete this[key];
      }

      return output;
    },
    popitem: function popitem() {
      var keys = lib.keys(this);

      if (!keys.length) {
        throw new Error('KeyError');
      }

      var k = keys[0];
      var val = this[k];
      delete this[k];
      return [k, val];
    },
    setdefault: function setdefault(key, def) {
      if (def === void 0) {
        def = null;
      }

      if (!(key in this)) {
        this[key] = def;
      }

      return this[key];
    },
    update: function update(kwargs) {
      lib._assign(this, kwargs);

      return null; // Always returns None
    }
  };
  OBJECT_MEMBERS.iteritems = OBJECT_MEMBERS.items;
  OBJECT_MEMBERS.itervalues = OBJECT_MEMBERS.values;
  OBJECT_MEMBERS.iterkeys = OBJECT_MEMBERS.keys;

  runtime.memberLookup = function memberLookup(obj, val, autoescape) {
    if (arguments.length === 4) {
      return sliceLookup.apply(this, arguments);
    }

    obj = obj || {}; // If the object is an object, return any of the methods that Python would
    // otherwise provide.

    if (lib.isArray(obj) && hasOwnProp(ARRAY_MEMBERS, val)) {
      return ARRAY_MEMBERS[val].bind(obj);
    }

    if (lib.isObject(obj) && hasOwnProp(OBJECT_MEMBERS, val)) {
      return OBJECT_MEMBERS[val].bind(obj);
    }

    return orig_memberLookup.apply(this, arguments);
  };

  return uninstall;
}

module.exports = installCompat;

/***/ })
/******/ ]);
});

}).call(this,require('_process'),require("timers").setImmediate)
},{"_process":9,"timers":35}],52:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  //!/usr/bin/env coffee
  // -*- coding: utf-8 -*-

  //  db_orm.coffee

  //-------------------------------------------------------------------------------

  //  Column definitions

  //  Each must have a '__method()' method (Yeah, I know. Sorry !-)
  //  which returns a method to be added to the @__Row_Class()
  //  definition in class Table, (q.v.)  It's convoluted but the
  //  end result is that each Table has a corresponding Row_Class
  //  method that is used to to create new Table_Rows from simple
  //  Javascript object such as that returned by a db query.

  var Back_Reference, Column, DB_ORM, Local_Method, Reference, SQL_Column, SQL_Date, SQL_Integer, SQL_String, Table, Table_Row,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

  Column = class Column {
    constructor(spec) {
      this.__method = this.__method.bind(this);
      ({table_name: this.table_name, col_name: this.col_name, options: this.options} = spec);
    }

    __method() {
      var error;
      try {
        return this.__column_method();
      } catch (error1) {
        error = error1;
        return console.log(`Error in ${this.constructor.name} method.`);
      }
    }

  };

  Local_Method = class Local_Method extends Column {
    constructor(spec) {
      super(spec);
      this.__column_method = this.__column_method.bind(this);
      ({method: this.method} = this.options);
      this.sql_column = false;
    }

    __column_method() {
      boundMethodCheck(this, Local_Method);
      return this.method;
    }

  };

  Reference = class Reference extends Column {
    constructor(spec) {
      super(spec);
      this.__column_method = this.__column_method.bind(this);
      this.sql_column = false;
    }

    __column_method() {
      var col_name, table_name;
      boundMethodCheck(this, Reference);
      ({table_name, col_name} = this.options);
      return function() {
        var key, table;
        table = this.__db.tables[table_name];
        key = this.__obj[col_name];
        return table.find_by_primary_key(key);
      };
    }

  };

  Back_Reference = class Back_Reference extends Column {
    constructor(spec) {
      super(spec);
      this.__column_method = this.__column_method.bind(this);
      this.sql_column = false;
    }

    __column_method() {
      var col_name, table_name;
      boundMethodCheck(this, Back_Reference);
      ({table_name, col_name} = this.options);
      return function() {
        var table;
        table = this.__db.tables[table_name];
        return table.find_where(col_name, this.__id);
      };
    }

  };

  SQL_Column = class SQL_Column extends Column {
    constructor(options) {
      super(options);
      this.__column_method = this.__column_method.bind(this);
      this.sql_column = true;
    }

    __column_method() {
      var name;
      boundMethodCheck(this, SQL_Column);
      name = this.col_name;
      return function() {
        return this.__obj[name];
      };
    }

  };

  SQL_String = class SQL_String extends SQL_Column {};

  SQL_Integer = class SQL_Integer extends SQL_Column {};

  SQL_Date = class SQL_Date extends SQL_Column {};

  
  //-------------------------------------------------------------------------------
  // CLASS TABLE_ROW

  // Class Table_Row is the companion to class Table (below) A Table_Row
  // corresponds to a row in the in the PostgreSQL table.  Note that the
  // constructor requires a @__table argument.  Classes which extend
  // Table Row must call super(table) in order to link the row type to
  // the appropriate table instance.

  Table_Row = class Table_Row {
    constructor(__table, __obj) {
      this.simple_obj = this.simple_obj.bind(this);
      this.toJSON = this.toJSON.bind(this);
      this.toString = this.toString.bind(this);
      this.toHTML = this.toHTML.bind(this);
      this.__table = __table;
      this.__obj = __obj;
      this.__db = this.__table.__db;
      this.__id = this.__obj[this.__table.__primary_key];
      this.__unique_id = `${this.__table.__name}-${this.__id}`;
    }

    simple_obj() {
      var col, obj, ref, val;
      obj = {};
      ref = this.__obj;
      for (col in ref) {
        val = ref[col];
        obj[col] = val;
      }
      return obj;
    }

    toJSON() {
      return JSON.stringify(this.simple_obj());
    }

    toString() {
      return this.toJSON();
    }

    toHTML() {}

  };

  // some suitable default

  //-------------------------------------------------------------------------------
  // CLASS TABLE

  // A Table corresponds to a table in the PostgreSQL DB.

  Table = class Table {
    constructor(spec) {
      var column, name, ref;
      
      // TODO: insert into DB
      this.insert = this.insert.bind(this);
      this.__add_row = this.__add_row.bind(this);
      this.find_all = this.find_all.bind(this);
      this.find_by_id = this.find_by_id.bind(this);
      this.find_by_primary_key = this.find_by_primary_key.bind(this);
      this.find_one = this.find_one.bind(this);
      this.find_where = this.find_where.bind(this);
      this.__remove_row = this.__remove_row.bind(this);
      this.__db = spec.db;
      this.__name = spec.name;
      this.__method_names = ['find_by_id', 'find_by_primary_key', 'find_all', 'find_where'];
      this.__primary_key = spec.primary_key || 'id';
      this.__row_methods = {};
      ref = spec.columns;
      for (name in ref) {
        column = ref[name];
        this.__row_methods[name] = column.__method(name);
      }
      this.__Row_Class = this.__row_class(this);
      this.__rows = {};
      this.__unique_id = `table-${this.__name}`;
    }

    __row_class(table) {
      var __Row_Class;
      return __Row_Class = class __Row_Class extends Table_Row {
        constructor(obj) {
          var method, name, ref;
          super(table, obj);
          ref = table.__row_methods;
          for (name in ref) {
            method = ref[name];
            this[name] = method; //.bind(this)
          }
        }

      };
    }

    insert(obj) {
      var col, cols, error, k, text, v, values;
      cols = (function() {
        var ref, results;
        ref = this.__sql_columns;
        results = [];
        for (k in ref) {
          v = ref[k];
          results.push(k);
        }
        return results;
      }).call(this);
      text = `insert into ${this.__name}(${cols.join(',')})`;
      values = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = cols.length; i < len; i++) {
          col = cols[i];
          results.push(obj[col]);
        }
        return results;
      })();
      console.log(`Trying query:\n  text: "${text}"\n  values: [ ${values} ]\n`);
      try {

      } catch (error1) {
        // db.query(text, values)
        error = error1;
        return console.log(error.message);
      }
    }

    __add_row(obj) {
      var row;
      row = new this.__Row_Class(obj);
      return this.__rows[row.get_primary_key()] = row;
    }

    async find_all() {
      var error, row, rows, text, values;
      try {
        text = `select * from ${this.__name}`;
        values = [];
        rows = this.__db.query(text, values);
        return (await (async function() {
          var i, len, ref, results;
          ref = (await rows);
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            row = ref[i];
            results.push(new this.__Row_Class(row));
          }
          return results;
        }).call(this));
      } catch (error1) {
        error = error1;
        return console.log(error.message);
      }
    }

    find_by_id(id) {
      return this.find_one('id', id);
    }

    find_by_primary_key(val) {
      return this.find_one(this.__primary_key, val);
    }

    async find_one(col, val) {
      return ((await this.find_where(col, val)))[0];
    }

    async find_where(col, val) {
      var error, row, rows, text, values;
      try {
        text = `select * from ${this.__name} where ${col} = $1 `;
        values = [val];
        rows = (await this.__db.query(text, values));
        return (await (async function() {
          var i, len, ref, results;
          ref = (await rows);
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            row = ref[i];
            results.push(new this.__Row_Class(row));
          }
          return results;
        }).call(this));
      } catch (error1) {
        error = error1;
        return console.log(error.message);
      }
    }

    __remove_row(id) {
      return delete this.__rows[id];
    }

  };

  DB_ORM = (function() {
    //-------------------------------------------------------------------------------
    // CLASS DB_ORM

    class DB_ORM {
      constructor(db_obj) {
        this.query = this.query.bind(this);
        this.init_tables = this.init_tables.bind(this);
        this.add_table = this.add_table.bind(this);
        this.db_obj = db_obj;
        this.init_tables();
      }

      query(text, values) {
        return this.db_obj.query(text, values);
      }

      async init_tables() {
        var def, name, ref, results;
        this.db_schema = this.db_obj.get_db_schema();
        this.tables = {};
        ref = (await this.db_schema);
        results = [];
        for (name in ref) {
          def = ref[name];
          results.push(this.add_table(name, def));
        }
        return results;
      }

      add_table(table_name, table_def) {
        var Column_Class, col_def, col_name, columns, k, options, primary_key, type, v;
        columns = {};
        for (col_name in table_def) {
          col_def = table_def[col_name];
          // should be just one key and value
          [type, options] = ((function() {
            var results;
            results = [];
            for (k in col_def) {
              v = col_def[k];
              results.push([k, v]);
            }
            return results;
          })())[0];
          if (options.primary_key) {
            primary_key = col_name;
          }
          Column_Class = this.column_Class[type];
          columns[col_name] = new Column_Class({
            table_name: table_name,
            col_name: col_name,
            options: options
          });
        }
        return this.tables[table_name] = new Table({
          db: this,
          name: table_name,
          primary_key: primary_key || 'id',
          columns: columns
        });
      }

    };

    // map DB_WORM column definition to class
    DB_ORM.prototype.column_Class = {
      string: SQL_String,
      integer: SQL_Integer,
      date: SQL_Date,
      reference: Reference,
      back_reference: Back_Reference,
      local_method: Local_Method
    };

    return DB_ORM;

  }).call(this);

  exports.DB_ORM = DB_ORM;

}).call(this);

},{}],53:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  //!/usr/bin/env coffee
  // -*- coding: utf-8 -*-

  //  db_rmi_client.coffee

  var DB_ORM, DB_RMI_Client, DB_RMI_Connection, WS_RMI_Client, WS_RMI_Connection, ws_rmi,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

  ws_rmi = require('ws-rmi');

  WS_RMI_Connection = ws_rmi.Connection;

  WS_RMI_Client = ws_rmi.Client;

  ({DB_ORM} = require('./db_orm'));

  DB_RMI_Connection = class DB_RMI_Connection extends WS_RMI_Connection {
    constructor() {
      super(...arguments);
      this.init_db = this.init_db.bind(this);
    }

    init_db() {
      boundMethodCheck(this, DB_RMI_Connection);
      return this.init_stubs().then(() => {
        this.db = new DB_ORM(this.stubs.db_obj);
        return this.db;
      });
    }

  };

  DB_RMI_Client = class DB_RMI_Client extends WS_RMI_Client {
    constructor(options, log_level) {
      console.log("DB_RMI_Client");
      super(options, [], DB_RMI_Connection, log_level);
    }

  };

  exports.DB_RMI_Client = DB_RMI_Client;

}).call(this);

},{"./db_orm":52,"ws-rmi":55}],54:[function(require,module,exports){


exports.DB_ORM = require('./db_orm').DB_ORM
exports.DB_RMI_Client = require('./db_rmi_client').DB_RMI_Client




},{"./db_orm":52,"./db_rmi_client":53}],55:[function(require,module,exports){

// file: index.js
// package: ws-rmi

lib = require('./lib/index')

exports.Connection = lib.Connection
exports.Object = lib.Object
exports.Stub = lib.Stub

exports.Server = lib.Server
exports.Client = lib.Client

},{"./lib/index":58}],56:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  //!/bin/env/ coffee

  //  ws_rmi_connection

  //----------------------------------------------------------------------
  var WS_RMI_Connection, WS_RMI_Object, WS_RMI_Stub, random_id,
    indexOf = [].indexOf;

  WS_RMI_Connection = class WS_RMI_Connection {
    // WS_RMI_Connection is basically just a wrapper around a websocket
    // and is intendend to be applied on both ends of the socket.  @owner
    // is the ws_rmi_client or the ws_rmi_server which established this
    // end of the websocket.

    // The idea here is that the connection, once established, is
    // symmetrical with both ends having the ability to request a remote
    // method invocation and to respond to such requests.

    // TODO: I have not settled the design as yet.  Previously the RMI's
    // were requested by a WS_RMI_Client and responded to by a
    // WS_RMI_Server.  My current thinking is that that functionality
    // might be better off here.

    constructor(owner, ws, options) {
      var i, len, obj, ref;
      //--------------------------------------------------------------------
      // Event handlers

      // TODO: is this event handled here or in client and server?  Seems
      // like by the time the connection object is constructed it's already
      // open.  Could it be closed and opened again?  I wouldn't think so
      // unless I implement that in the server and client code.  It'd have
      // to keep stale connection objects around and re-activate them when
      // connected again.

      this.onOpen = this.onOpen.bind(this);
      // This is the "main event".  It's what we've all been waiting for!
      this.onMessage = this.onMessage.bind(this);
      // TODO: perhaps somebody should be notified here ?-)
      // Who wanted this connection in the first place?  Do we
      // have their contact info?

      this.onClose = this.onClose.bind(this);
      // TODO: think of something to do here.
      this.onError = this.onError.bind(this);
      //----------------------------------------------------------
      // Object registry methods

      // Register a WS_RMI_Object for RMI
      this.add_object = this.add_object.bind(this);
      this.register = this.register.bind(this);
      // I refuse to comment on what this one does.
      this.del_object = this.del_object.bind(this);
      // Method get_stub_specs() is a built-in remote method.
      this.get_stub_specs = this.get_stub_specs.bind(this);
      // Invoke remote get_stub_specs()
      this.init_stubs = this.init_stubs.bind(this);
      //--------------------------------------------------------------------
      // Generic messaging methods

      // JSON.stringify and send.  Returns a promise.
      this.send_message = this.send_message.bind(this);
      // JSON.parse and handle as appropriate.
      this.recv_message = this.recv_message.bind(this);
      //--------------------------------------------------------------------
      // Methods to Send and Receive RMI Requests

      // Method send_request()
      this.send_request = this.send_request.bind(this);
      // Method recv_request()
      this.recv_request = this.recv_request.bind(this);
      //--------------------------------------------------------------------
      //  Methods to Send and Receive RMI Responses

      // Method send_response()
      this.send_response = this.send_response.bind(this);
      // Method recv_resonse()
      this.recv_response = this.recv_response.bind(this);
      this.owner = owner;
      this.ws = ws;
      this.log_level = options.log_level || 2;
      this.log = options.log || console.log;
      this.waiter = null;
      // TODO: Need a unique id here. Does this work ok?
      // @id = "#{ws._socket.server._connectionKey}"
      this.id = "connection";
      // WS_RMI_Objects are registered here with their id as key.  The
      // registry is used by method recv_request() which receives just an
      // id in the message and must look up the object to invoke it's
      // method.

      this.registry = {};
      this.exclude = [];
      // Pseudo-object 'admin' with method 'init'

      // TODO: Is it better to use this pseudo-object approach or just
      // instantiate WS_RMI_Object to the same effect?  The point is that
      // 'admin' is special in that it is present at Connection creation
      // time.  It should be excluded from init() responses since the
      // caller already has it.  Should it then be excluded from the
      // registry or just skipped over when responding to init?  The
      // benefit of including it in the registry is that it requires no
      // special treatment in method recv_request().  My current choice
      // is to include it in the registry here and skip over it in
      // init().

      // In the future there may be other objects of this administrative
      // sort.  Maybe a more structured general solution should be
      // considered.

      this.admin = {
        id: 'admin',
        name: 'admin',
        get_stub_specs: this.get_stub_specs,
        method_names: ['get_stub_specs']
      };
      this.registry['admin'] = this.admin;
      this.exclude.push('admin');
      this.stubs = {};
      // RMI's are given a unique number and the Promise's resolve() and
      // reject() functions are kept as callbacks to be executed when an
      // RMI response is received. Properties @rmi_cnt and @rmi_hash are
      // each written and read by methods send_request() and
      // recv_response().

      this.rmi_cnt = 0;
      this.rmi_hash = {};
      ref = this.owner.objects;
      // add remote objects
      for (i = 0, len = ref.length; i < len; i++) {
        obj = ref[i];
        this.add_object(obj);
      }
      // Events are mapped to handler methods defined below.
      this.ws.onOpen = this.onOpen;
      this.ws.onmessage = this.onMessage;
      this.ws.onclose = this.onClose;
      this.ws.onerror = this.onError;
      true;
    }

    onOpen(evt) {
      this.log("connection opened: id:", this.id);
      return this.init_stubs();
    }

    onMessage(evt) {
      if (this.log_level > 2) {
        this.log("onMessage:", evt.data);
      }
      return this.recv_message(evt.data);
    }

    onClose(evt) {
      if (this.log_level > 0) {
        return this.log("peer disconnected: id:", this.id);
      }
    }

    onError(evt) {
      this.log(evt.data);
      if (this.waiter) {
        return clearInterval(this.waiter);
      }
    }

    add_object(obj) {
      this.registry[obj.id] = obj;
      return obj.register(this);
    }

    register(obj) {
      return this.registry[obj.id] = obj;
    }

    del_object(id) {
      return delete this.registry[id];
    }

    get_stub_specs() {
      return new Promise((resolve, reject) => {
        var error, id, obj, ref, specs;
        try {
          specs = {};
          ref = this.registry;
          for (id in ref) {
            obj = ref[id];
            if (indexOf.call(this.exclude, id) < 0) {
              specs[id] = {
                name: obj.name,
                method_names: obj.method_names
              };
            }
          }
          if (this.log_level > 0) {
            this.log("get_stub_specs():", specs);
          }
          return resolve(specs);
        } catch (error1) {
          error = error1;
          this.log("Error: init():", specs, error);
          return reject("Error: init():", specs);
        }
      });
    }

    init_stubs() {
      var cb, eh;
      cb = (result) => {
        var id, method_names, name, results, spec, stub;
        if (this.log_level > -1) {
          this.log("init_stubs(): cb(): result:", result);
        }
        results = [];
        for (id in result) {
          spec = result[id];
          ({name, method_names} = spec);
          stub = new WS_RMI_Stub(id, name, method_names, this);
          results.push(this.stubs[stub.name] = stub);
        }
        return results;
      };
      eh = (error) => {
        if (this.log_level > -1) {
          this.log("init_stub(): eh(): received error:", error);
        }
        throw new Error("init_stub(): eh(): received error:");
      };
      if (this.log_level > -1) {
        this.log("init_stubs(): begin");
      }
      // @send_request() returns a promise
      return this.send_request('admin', 'get_stub_specs', []).then(cb).catch(eh);
    }

    send_message(data_obj) {
      var delay, error, max_tries, tries;
      if (this.log_level > -1) {
        this.log("send_message(): data_obj:", data_obj);
        this.log(`@ws.readyState = ${this.ws.readyState}`);
      }
      try {
        // The WebSocket API seems flawed.  When a new ws is created
        // as in 'new WebSocket(url)' it attempts to connect to the server
        // at url.  Until then ws.readyState == ws.CONNECTING and any
        // attempt to send a message will throw an error.  An 'open' event
        // is emmitted when ws.readyState == ws.OPEN and you can set
        // ws.onOpen to handle this event, but only AFTER the attempt to
        // connect has already begun.  So there is a race condition between
        // setting the handler and completing the connect protocol.

        // The code below is intended to handle this.  It runs every time
        // send_message() is called but is really only necessary in the
        // beginning when the ws has just been created.

        // If the ws is connected then proceed as normal.

        if (this.ws.readyState === this.ws.OPEN) {
          return this.ws.send(JSON.stringify(data_obj));
        // If not ready but we're still connecting, then check again
        // every ${delay} ms.

        } else if (this.ws.readyState === this.ws.CONNECTING) {
          delay = 100;
          max_tries = 30;
          tries = 0;
          return this.waiter = setInterval((() => {
            this.log(`waiting ${delay} ms...`);
            tries += 1;
            if (this.ws.readyState === this.ws.OPEN || tries >= max_tries) {
              clearInterval(this.waiter);
              return this.ws.send(JSON.stringify(data_obj));
            }
          }), delay);
        } else {
          // The other possible states are CLOSED and CLOSING.  Either
          // of these is an error.

          throw new Error('ws.readyState not OPEN or CONNECTING');
        }
      } catch (error1) {
        error = error1;
        this.log("Error: send_message(): data_obj:", data_obj);
        return this.log(error);
      }
    }

    recv_message(data) {
      var data_obj, msg, type;
      data_obj = JSON.parse(data);
      if (this.log_level > 2) {
        this.log("recv_message(): data_obj:", data_obj);
      }
      ({type, msg} = data_obj);
      if (type === 'request') {
        return this.recv_request(msg);
      }
      if (type === 'response') {
        return this.recv_response(msg);
      } else {
        throw new Error(`recv_message(): invalid type ${type}`);
      }
    }

    send_request(obj_id, method, args) {
      var msg;
      msg = {
        obj_id: obj_id,
        method: method,
        args: args
      };
      if (this.log_level > 0) {
        this.log("send_request(): msg:", msg);
      }
      return new Promise((resolve, reject) => {
        var error;
        try {
          msg.rmi_id = this.rmi_cnt++;
          this.rmi_hash[msg.rmi_id] = {
            msg: msg,
            resolve: resolve,
            reject: reject
          };
          return this.send_message({
            type: 'request',
            msg: msg
          });
        } catch (error1) {
          error = error1;
          return reject("send_message(): Error: data_obj:", data_obj);
        }
      });
    }

    recv_request(msg) {
      var args, cb, eh, method, obj, obj_id, rmi_id;
      if (this.log_level > 0) {
        this.log("recv_request(): msg:", msg);
      }
      ({obj_id, method, args, rmi_id} = msg);
      // callback used below
      cb = (res) => {
        return this.send_response(rmi_id, res, null);
      };
      // error handler used below
      eh = (err) => {
        return this.send_response(rmi_id, null, err);
      };
      // Look up the object and apply the method to the args.
      // Method is assumed to return a promise.

      obj = this.registry[obj_id];
      return obj[method].apply(obj, args).then(cb).catch(eh);
    }

    send_response(rmi_id, result, error) {
      var msg;
      msg = {
        rmi_id: rmi_id,
        result: result,
        error: error
      };
      if (this.log_level > 0) {
        this.log("send_response(): msg:", msg);
      }
      return new Promise((resolve, reject) => {
        try {
          return this.send_message({
            type: 'response',
            msg: msg
          });
        } catch (error1) {
          error = error1;
          this.log("Error in send_response():", msg);
          return reject({rmi_id, result, error});
        }
      });
    }

    recv_response(response) {
      var error, reject, request, resolve, result, rmi_id;
      if (this.log_level > 0) {
        this.log("recv_response(): response:", response);
      }
      try {
        ({rmi_id, result, error} = response);
        ({request, resolve, reject} = this.rmi_hash[rmi_id]);
        if (error) {
          return reject({request, error});
        } else {
          return resolve(result);
        }
      } catch (error1) {
        error = error1;
        return reject({request, error});
      }
    }

  };

  //----------------------------------------------------------------------
  // WS_RMI_Object

  // used in WS_RMI_Object constructor
  random_id = function(name) {
    return `${name}_${(Math.random().toString().slice(2))}`;
  };

  // WS_RMI_Object wraps a regular coffeescript class instance object,
  // exposing only those methods explicitly intended for RMI.

  WS_RMI_Object = class WS_RMI_Object {
    constructor(name1, obj1, method_names1, log_level) {
      var i, len, name, ref;
      this.register = this.register.bind(this);
      this.name = name1;
      this.obj = obj1;
      this.method_names = method_names1;
      this.log_level = log_level || 0;
      this.id = random_id(this.name);
      ref = this.method_names;
      for (i = 0, len = ref.length; i < len; i++) {
        name = ref[i];
        this[name] = ((name) => {
          return function(...args) {
            return this.invoke(name, args);
          };
        })(name);
      }
    }

    register(connection) {
      return this.connection = connection;
    }

    // Method invoke() is called by connection.recv_request()
    // it executes the appropriate method and returns a promise.

    invoke(method_name, args) {
      var eh;
      // error handler used in .catch() just below.
      eh = (err) => {
        var msg;
        msg = "\nWS_RMI_Object:";
        msg += {
          id: this.id,
          method: name,
          args: args
        }.toString();
        return new Error(msg);
      };
      if (this.log_level > 1) {
        this.log("invoke(): ", {method_name, args});
      }
      // call the method of the underlying object
      return this.obj[method_name].apply(this.obj, args); // .catch(eh)
    }

  };

  
  //-----------------------------------------------------------------------
  // WS_RMI_Stub
  WS_RMI_Stub = class WS_RMI_Stub {
    constructor(id1, name1, method_names1, connection1, log_level) {
      var i, len, name, ref;
      this.id = id1;
      this.name = name1;
      this.method_names = method_names1;
      this.connection = connection1;
      this.log_level = log_level || 0;
      ref = this.method_names;
      for (i = 0, len = ref.length; i < len; i++) {
        name = ref[i];
        this[name] = ((name) => {
          return function(...args) {
            return this.invoke(name, args);
          };
        })(name);
      }
    }

    // Method invoke() implements local stub methods by calling
    // WS_RMI_Connection.send_request() which returns a Promise.

    invoke(name, args) {
      var eh;
      if (this.log_level > 1) {
        this.log("invoke(): ", {name, args});
      }
      eh = (err) => {
        var msg;
        msg = "\nWS_RMI_Stub:";
        msg += {
          id: this.id,
          method: name,
          args: args
        }.toString();
        return new Error(msg);
      };
      return this.connection.send_request(this.id, name, args).catch(eh);
    }

  };

  //----------------------------------------------------------------------
  exports.WS_RMI_Connection = WS_RMI_Connection;

  exports.WS_RMI_Object = WS_RMI_Object;

  exports.WS_RMI_Stub = WS_RMI_Stub;

}).call(this);

},{}],57:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  //!/bin/env/ coffee

  // ws_rmi_client

  // works both in browser and in node
  var WS_RMI_Client, WS_RMI_Connection, WebSocket;

  WebSocket = (typeof window !== "undefined" && window !== null ? window.WebSocket : void 0) || require('ws');

  ({WS_RMI_Connection} = require('./app'));

  WS_RMI_Client = class WS_RMI_Client {
    // Connnection should be a sub-class of WS_RMI_Connection in order to
    // create and register desired WS_RMI_Objects at construction.

    constructor(options, objects, Connection) {
      var host, path, port, protocol;
      //--------------------------------------------------------------------
      // connect() and disconnect() methods

      this.connect = this.connect.bind(this);
      this.disconnect = this.disconnect.bind(this);
      this.options = options;
      this.objects = objects;
      this.log_level = this.options.log_level || 2;
      this.log = this.options.log || console.log;
      ({host, port, path, protocol} = this.options);
      this.url = `${protocol}://${host}:${port}/${path}`;
      this.Connection = Connection || WS_RMI_Connection;
      this.id = `WS_RMI_Client-${(Math.random().toString().slice(2))}`;
    }

    connect(url) {
      return new Promise((resolve, reject) => {
        var connection, error, msg;
        try {
          if (url) {
            this.url = url;
          }
          // Note: This is screwed up !!!
          // new WebSocket(@url) connects automatically but ws.onOpen
          // cannot be set until AFTER the ws object is constructed!
          // So the 'open' event can be emitted BEFORE the handler is set!
          // See note below ...

          this.ws = new WebSocket(this.url);
          this.log("ws_rmi_client: id:", this.id);
          this.log("ws connectiing ...");
          // Note: @ws exists but is not necessarily ready yet.
          // This issue is addressed in the WS_RMI_Connection.send_message()
          // method (q.v.)

          connection = new this.Connection(this, this.ws, this.options);
          return resolve(connection);
        } catch (error1) {
          error = error1;
          this.log(error);
          msg = "\nWS_RMI_Client: connect failed.";
          msg += ` url: ${this.url}`;
          throw new Error(msg);
        }
      });
    }

    disconnect() {
      if (this.log_level > 0) {
        this.log("disconnecting: id: ", this.id);
      }
      return this.ws.close();
    }

  };

  exports.WS_RMI_Client = WS_RMI_Client;

}).call(this);

},{"./app":56,"ws":60}],58:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  //!/usr/bin/env coffee
  var WS_RMI_Client, WS_RMI_Connection, WS_RMI_Object, WS_RMI_Server, WS_RMI_Stub;

  ({WS_RMI_Client} = require('./client'));

  ({WS_RMI_Server} = require('./server'));

  ({WS_RMI_Connection, WS_RMI_Object, WS_RMI_Stub} = require('./app'));

  exports.Server = WS_RMI_Server;

  exports.Client = WS_RMI_Client;

  exports.Connection = WS_RMI_Connection;

  exports.Object = WS_RMI_Object;

  exports.Stub = WS_RMI_Stub;

}).call(this);

},{"./app":56,"./client":57,"./server":59}],59:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  //!/bin/env/ coffee

  //  ws_rmi_server

  var WSS_RMI_Server, WS_RMI_Connection, WS_RMI_Server, WS_RMI_Server_Common, WebSocket, http, https;

  WebSocket = require('ws');

  http = require('http');

  https = require('https');

  ({WS_RMI_Connection} = require('./app'));

  // WS_RMI_Server_Common contains code common to both
  // WS_RMI_Server and WSS_RMI_Server defined below

  WS_RMI_Server_Common = class WS_RMI_Server_Common {
    // Connection should extend WS_RMI_Connection in
    // order to add desired WS_RMI_Objects at construction.

    constructor(server, options1, objects1) {
      // Start the server.
      this.start = this.start.bind(this);
      // Stop the server.
      this.stop = this.stop.bind(this);
      this.server = server;
      this.options = options1;
      this.objects = objects1;
      this.log_level = this.options.log_level || 2;
      this.log = this.options.log || console.log;
      this.id = `WS_RMI_Server-${(Math.random().toString().slice(2))}`;
      this.connections = [];
      ({host: this.host, port: this.port, protocol: this.protocol} = this.options);
      this.url = `${this.protocol}://${this.host}:${this.port}`;
      this.wss = new WebSocket.Server({
        server: this.server
      });
      this.wss.on('connection', (ws) => {
        var conn, error, msg;
        try {
          this.log(`trying new connection: ${ws}`);
          conn = new WS_RMI_Connection(this, ws, this.log_level);
          this.connections.push(conn);
          return this.log(`connection added: ${conn.id}`);
        } catch (error1) {
          error = error1;
          msg = "\nWS_RMI_Server_Common: ";
          msg += "\nError in connection event handler";
          return new Error(msg);
        }
      });
    }

    start() {
      var error;
      try {
        this.server.listen(this.port, this.host);
        return this.log(`server listening at url: ${this.url}`);
      } catch (error1) {
        error = error1;
        return this.log(error);
      }
    }

    stop() {
      this.server.close();
      return this.log("server stopped.");
    }

  };

  // WS_RMI_Server is the insecure version and can be run without root
  // access since it does not require access to the SSL credentials

  WS_RMI_Server = class WS_RMI_Server extends WS_RMI_Server_Common {
    constructor(options, objects) {
      var webserver;
      webserver = http.createServer(null);
      super(webserver, options, objects);
      this.protocol = 'ws';
    }

  };

  // WSS_RMI_Server is the secure version and requires
  // access to SSL credentials for the site.

  WSS_RMI_Server = class WSS_RMI_Server extends WS_RMI_Server_Common {
    constructor(credentials, options, objects) {
      var webserver;
      webserver = https.createServer(null, credentials);
      super(webserver, options, objects);
      this.protocol = 'wss';
    }

  };

  exports.WS_RMI_Server = WS_RMI_Server;

  exports.WSS_RMI_Server = WSS_RMI_Server;

}).call(this);

},{"./app":56,"http":15,"https":6,"ws":60}],60:[function(require,module,exports){
'use strict';

module.exports = function() {
  throw new Error(
    'ws does not work in the browser. Browser clients must use the native ' +
      'WebSocket object'
  );
};

},{}]},{},[43]);
