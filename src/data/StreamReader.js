function StreamReader(dataView, littleEndian) { // F
  null == littleEndian && (littleEndian = !1);
  this.dataView = dataView; // o
  this.littleEndian = littleEndian; // Sa
  this.offset = 0; // a
}

StreamReader.readUTF8Char = function (dataView, offset) { // jo
  var c = dataView.getUint8(offset), d, e, f, g, k, l = offset;
  if (0 == (c & 128)) ++offset;
  else if (192 == (c & 224))
    (d = dataView.getUint8(offset + 1)), (c = ((c & 31) << 6) | (d & 63)), (offset += 2);
  else if (224 == (c & 240))
    (d = dataView.getUint8(offset + 1)),
      (e = dataView.getUint8(offset + 2)),
      (c = ((c & 15) << 12) | ((d & 63) << 6) | (e & 63)),
      (offset += 3);
  else if (240 == (c & 248))
    (d = dataView.getUint8(offset + 1)),
      (e = dataView.getUint8(offset + 2)),
      (f = dataView.getUint8(offset + 3)),
      (c = ((c & 7) << 18) | ((d & 63) << 12) | ((e & 63) << 6) | (f & 63)),
      (offset += 4);
  else if (248 == (c & 252))
    (d = dataView.getUint8(offset + 1)),
      (e = dataView.getUint8(offset + 2)),
      (f = dataView.getUint8(offset + 3)),
      (g = dataView.getUint8(offset + 4)),
      (c =
        ((c & 3) << 24) |
        ((d & 63) << 18) |
        ((e & 63) << 12) |
        ((f & 63) << 6) |
        (g & 63)),
      (offset += 5);
  else if (252 == (c & 254))
    (d = dataView.getUint8(offset + 1)),
      (e = dataView.getUint8(offset + 2)),
      (f = dataView.getUint8(offset + 3)),
      (g = dataView.getUint8(offset + 4)),
      (k = dataView.getUint8(offset + 5)),
      (c =
        ((c & 1) << 30) |
        ((d & 63) << 24) |
        ((e & 63) << 18) |
        ((f & 63) << 12) |
        ((g & 63) << 6) |
        (k & 63)),
      (offset += 6);
  else
    throw new q(
      "Cannot decode UTF8 character at offset " +
        offset +
        ": charCode (" +
        c +
        ") is invalid"
    );
  return { char: c, length: offset - l };
};

StreamReader.prototype = {
  readUint8Array: function (len) { // sb
    null == len && (len = this.dataView.byteLength - this.offset);
    if (this.offset + len > this.dataView.byteLength) throw new q("Read too much");
    var b = new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, len);
    this.offset += len;
    return b;
  },
  readArrayBuffer: function (len) { // Cl
    var b = this.readUint8Array(len);
    len = new ArrayBuffer(len);
    new Uint8Array(len).set(b);
    return len;
  },
  readInt8: function () { // lf
    return this.dataView.getInt8(this.offset++);
  },
  readUint8: function () { // B
    return this.dataView.getUint8(this.offset++);
  },
  readInt16: function () { // ni
    var val = this.dataView.getInt16(this.offset, this.littleEndian);
    this.offset += 2;
    return val;
  },
  readUint16: function () { // Ob
    var val = this.dataView.getUint16(this.offset, this.littleEndian);
    this.offset += 2;
    return val;
  },
  readInt32: function () { // M
    var val = this.dataView.getInt32(this.offset, this.littleEndian);
    this.offset += 4;
    return val;
  },
  readUint32: function () { // hb
    var val = this.dataView.getUint32(this.offset, this.littleEndian);
    this.offset += 4;
    return val;
  },
  readFloat32: function () { // mi
    var val = this.dataView.getFloat32(this.offset, this.littleEndian);
    this.offset += 4;
    return val;
  },
  readFloat64: function () { // u
    var val = this.dataView.getFloat64(this.offset, this.littleEndian);
    this.offset += 8;
    return val;
  },
  readUTF8Char: function () { // Ab
    for (
      var oldOffset = this.offset, i = 0, val, total = 0;
      (val = this.dataView.getUint8(oldOffset + i)),
        5 > i && (total |= ((val & 127) << (7 * i)) >>> 0),
        ++i,
        0 != (val & 128);

    );
    this.offset += i;
    return total | 0;
  },
  readStringContents: function (len) { // ie
    var oldOffset = this.offset, c, str = "";
    for (len = oldOffset + len; oldOffset < len; )
      (c = StreamReader.readUTF8Char(this.dataView, oldOffset)),
        (oldOffset += c.length),
        (str += String.fromCodePoint(c["char"]));
    if (oldOffset != len)
      throw new q(
        "Actual string length differs from the specified: " +
          (oldOffset - len) +
          " bytes"
      );
    this.offset = oldOffset;
    return str;
  },
  readNullableString: function () { // zb
    var n = this.readUTF8Char();
    return 0 >= n ? null : this.readStringContents(n - 1);
  },
  readString: function () { // ic
    return this.readStringContents(this.readUTF8Char());
  },
  readString2: function () { // El
    return this.readStringContents(this.readUint8());
  },
  readString3: function () {
    return this.readStringContents(this.readUint16());
  },
  readJSON: function () { // wg
    var str = this.readString();
    return JSON.parse(str);
  }
};

module.exports = StreamReader;
