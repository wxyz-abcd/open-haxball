const StreamReader = require("./StreamReader");

function getCharCode(str, index) {
  var code = str.charCodeAt(index);
  if (code == code)
    return code;
};

function StreamWriter(dataView, littleEndian) { // w
  this.dataView = dataView; // o
  this.littleEndian = !!littleEndian; // Sa
  this.byteOffset = 0; // a
}

// creates and returns a new StreamWriter object with given byteLength, littleEndian properties
StreamWriter.create = function(byteLength, littleEndian) { // w.ha
  return new StreamWriter(new DataView(new ArrayBuffer(byteLength || 16)), littleEndian);
};

// writes an utf8 character with given UTF8CharCode to given dataView at given byteOffset
StreamWriter.writeUTF8Char = function(UTF8CharCode, dataView, byteOffset) { // w.uo
  var oldByteOffset = byteOffset;
  if (0 > UTF8CharCode)
    throw new q("Cannot encode UTF8 character: charCode (" + a + ") is negative");
  if (128 > UTF8CharCode) dataView.setUint8(byteOffset, UTF8CharCode & 127), ++byteOffset;
  else if (2048 > UTF8CharCode)
    dataView.setUint8(byteOffset, ((UTF8CharCode >> 6) & 31) | 192),
      dataView.setUint8(byteOffset + 1, (UTF8CharCode & 63) | 128),
      (byteOffset += 2);
  else if (65536 > UTF8CharCode)
    dataView.setUint8(byteOffset, ((UTF8CharCode >> 12) & 15) | 224),
      dataView.setUint8(byteOffset + 1, ((UTF8CharCode >> 6) & 63) | 128),
      dataView.setUint8(byteOffset + 2, (UTF8CharCode & 63) | 128),
      (byteOffset += 3);
  else if (2097152 > UTF8CharCode)
    dataView.setUint8(byteOffset, ((UTF8CharCode >> 18) & 7) | 240),
      dataView.setUint8(byteOffset + 1, ((UTF8CharCode >> 12) & 63) | 128),
      dataView.setUint8(byteOffset + 2, ((UTF8CharCode >> 6) & 63) | 128),
      dataView.setUint8(byteOffset + 3, (UTF8CharCode & 63) | 128),
      (byteOffset += 4);
  else if (67108864 > UTF8CharCode)
    dataView.setUint8(byteOffset, ((UTF8CharCode >> 24) & 3) | 248),
      dataView.setUint8(byteOffset + 1, ((UTF8CharCode >> 18) & 63) | 128),
      dataView.setUint8(byteOffset + 2, ((UTF8CharCode >> 12) & 63) | 128),
      dataView.setUint8(byteOffset + 3, ((UTF8CharCode >> 6) & 63) | 128),
      dataView.setUint8(byteOffset + 4, (UTF8CharCode & 63) | 128),
      (byteOffset += 5);
  else if (-2147483648 > UTF8CharCode)
    dataView.setUint8(byteOffset, ((UTF8CharCode >> 30) & 1) | 252),
      dataView.setUint8(byteOffset + 1, ((UTF8CharCode >> 24) & 63) | 128),
      dataView.setUint8(byteOffset + 2, ((UTF8CharCode >> 18) & 63) | 128),
      dataView.setUint8(byteOffset + 3, ((UTF8CharCode >> 12) & 63) | 128),
      dataView.setUint8(byteOffset + 4, ((UTF8CharCode >> 6) & 63) | 128),
      dataView.setUint8(byteOffset + 5, (UTF8CharCode & 63) | 128),
      (byteOffset += 6);
  else
    throw new q("Cannot encode UTF8 character: charCode (" + UTF8CharCode + ") is too large (>= 0x80000000)");
  return byteOffset - oldByteOffset;
};

// calculates the byte length of an utf8 character with given UTF8CharCode
StreamWriter.calculateUTF8CharLength = function(UTF8CharCode) { // En
  if (0 > UTF8CharCode)
    throw new q("Cannot calculate length of UTF8 character: charCode (" + UTF8CharCode + ") is negative");
  if (128 > UTF8CharCode) return 1;
  if (2048 > UTF8CharCode) return 2;
  if (65536 > UTF8CharCode) return 3;
  if (2097152 > UTF8CharCode) return 4;
  if (67108864 > UTF8CharCode) return 5;
  if (-2147483648 > UTF8CharCode) return 6;
  throw new q("Cannot calculate length of UTF8 character: charCode (" + UTF8CharCode +") is too large (>= 0x80000000)");
};

// calculates the byte length of a utf8 string
StreamWriter.calculateStringLength = function(str) { // Kf
  var b = 0, c = str.length;
  for (var d=0;d<c;d++) 
    b += StreamWriter.calculateUTF8CharLength(getCharCode(str, d));
  return b;
};
StreamWriter.calculateCustomCharLength_noCheck = function (customCharCode) { // Fn
  customCharCode >>>= 0;
  return 128 > customCharCode
    ? 1
    : 16384 > customCharCode
    ? 2
    : 2097152 > customCharCode
    ? 3
    : 268435456 > customCharCode
    ? 4
    : 5;
};
StreamWriter.prototype = {
  toArrayBuffer: function () { // Kg
    var buf = new ArrayBuffer(this.byteOffset), arr = new Uint8Array(this.dataView.buffer, this.dataView.byteOffset, this.byteOffset);
    new Uint8Array(buf).set(arr);
    return buf;
  },
  toUint8Array: function () { // Sb
    return new Uint8Array(this.dataView.buffer, this.dataView.byteOffset, this.byteOffset);
  },
  toDataView: function () { // Hd
    return new DataView(this.dataView.buffer, this.dataView.byteOffset, this.byteOffset);
  },
  createStreamReader: function () { // Gr
    return new StreamReader(this.toDataView(), this.littleEndian);
  },
  doubleSizeIfNecessary: function (newLength) { // rc
    if (this.dataView.byteLength < newLength)
      this.resize(2 * this.dataView.byteLength >= newLength ? 2 * this.dataView.byteLength : newLength);
  },
  resize: function(newLength) { // Yq
    if (1 > newLength) throw new q("Can't resize buffer to a capacity lower than 1");
    if (this.dataView.byteLength < newLength) {
      var b = new Uint8Array(this.dataView.buffer);
      var buf = new ArrayBuffer(newLength);
      new Uint8Array(buf).set(b);
      this.dataView = new DataView(buf);
    }
  },
  writeUint8: function (x) { // l
    var offset = this.byteOffset++;
    this.doubleSizeIfNecessary(this.byteOffset);
    this.dataView.setUint8(offset, x);
  },
  writeInt16: function (x) { // Xi
    var offset = this.byteOffset;
    this.byteOffset += 2;
    this.doubleSizeIfNecessary(this.byteOffset);
    this.dataView.setInt16(offset, x, this.littleEndian);
  },
  writeUint16: function (x) { // Ub
    var offset = this.byteOffset;
    this.byteOffset += 2;
    this.doubleSizeIfNecessary(this.byteOffset);
    this.dataView.setUint16(offset, x, this.littleEndian);
  },
  writeInt32: function (x) { // O
    var offset = this.byteOffset;
    this.byteOffset += 4;
    this.doubleSizeIfNecessary(this.byteOffset);
    this.dataView.setInt32(offset, x, this.littleEndian);
  },
  writeUint32: function (x) { // tb
    var offset = this.byteOffset;
    this.byteOffset += 4;
    this.doubleSizeIfNecessary(this.byteOffset);
    this.dataView.setUint32(offset, x, this.littleEndian);
  },
  writeFloat32: function (x) { // Wi
    var offset = this.byteOffset;
    this.byteOffset += 4;
    this.doubleSizeIfNecessary(this.byteOffset);
    this.dataView.setFloat32(offset, x, this.littleEndian);
  },
  writeFloat64: function (x) { // s
    var offset = this.byteOffset;
    this.byteOffset += 8;
    this.doubleSizeIfNecessary(this.byteOffset);
    this.dataView.setFloat64(offset, x, this.littleEndian);
  },
  writeUint8Array: function (array) { // Vb
    var offset = this.byteOffset;
    this.byteOffset += array.byteLength;
    this.doubleSizeIfNecessary(this.byteOffset);
    new Uint8Array(this.dataView.buffer, this.dataView.byteOffset, this.dataView.byteLength).set(array, offset);
  },
  writeArrayBuffer: function (arrayBuffer) { // Mg
    this.writeUint8Array(new Uint8Array(arrayBuffer));
  },
  writeString: function(str) { // mc
    this.writeUTF8Char(StreamWriter.calculateStringLength(str));
    this.writeStringContents(str);
  },
  writeNullableString: function(str) { // Db
    null == str ? this.writeUTF8Char(0) : (this.writeUTF8Char(StreamWriter.calculateStringLength(str) + 1), this.writeStringContents(str));
  },
  writeString2: function(str) { // Im
    var len = StreamWriter.calculateStringLength(str);
    if (255 < len) throw new q(null);
    this.writeUint8(len);
    this.writeStringContents(str);
  },
  writeString3: function(str) {
    var len = StreamWriter.calculateStringLength(str);
    this.writeUint16(len);
    this.writeStringContents(str);
  },
  writeJSON: function(json) { // Ng
    this.writeString(JSON.stringify(json));
  },
  writeStringContents: function(str) { // Og
    var offset = this.byteOffset, len = str.length;
    this.doubleSizeIfNecessary(offset + StreamWriter.calculateStringLength(str));
    for (var i=0;i<len;i++) offset += StreamWriter.writeUTF8Char(getCharCode(str, i), this.dataView, offset);
    this.byteOffset = offset;
  },
  writeUTF8Char: function(UTF8CharCode) { // lb
    var oldByteOffset = this.byteOffset;
    UTF8CharCode >>>= 0;
    this.doubleSizeIfNecessary(oldByteOffset + StreamWriter.calculateCustomCharLength_noCheck(UTF8CharCode));
    this.dataView.setUint8(oldByteOffset, UTF8CharCode | 128);
    128 <= UTF8CharCode
      ? (this.dataView.setUint8(oldByteOffset + 1, (UTF8CharCode >> 7) | 128),
        16384 <= UTF8CharCode
          ? (this.dataView.setUint8(oldByteOffset + 2, (UTF8CharCode >> 14) | 128),
            2097152 <= UTF8CharCode
              ? (this.dataView.setUint8(oldByteOffset + 3, (UTF8CharCode >> 21) | 128),
                268435456 <= UTF8CharCode
                  ? (this.dataView.setUint8(oldByteOffset + 4, (UTF8CharCode >> 28) & 127), (UTF8CharCode = 5))
                  : (this.dataView.setUint8(oldByteOffset + 3, this.dataView.getUint8(oldByteOffset + 3) & 127),
                    (UTF8CharCode = 4)))
              : (this.dataView.setUint8(oldByteOffset + 2, this.dataView.getUint8(oldByteOffset + 2) & 127),
                (UTF8CharCode = 3)))
          : (this.dataView.setUint8(oldByteOffset + 1, this.dataView.getUint8(oldByteOffset + 1) & 127), (UTF8CharCode = 2)))
      : (this.dataView.setUint8(oldByteOffset, this.dataView.getUint8(oldByteOffset) & 127), (UTF8CharCode = 1));
    this.byteOffset += UTF8CharCode;
  }
};

module.exports = StreamWriter;