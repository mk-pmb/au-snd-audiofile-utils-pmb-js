import assert from 'assert';

import ifFun from 'if-fun';


const obAss = Object.assign;

let nextId = 1;
function verifyNextId(expected) { assert.strictEqual(nextId, expected); }

const bitsPerByte = 8;
const bitWidthProp = 'bitsPerValue';

const encs = obAss([], {

  describe: function describeEncoding(enc) {
    if (!enc) { return 'invalid encoding record: ' + String(enc); }
    let descr = 'encoding ID ' + enc.id;
    function q(k, f) {
      const v = enc[k];
      descr += ', ' + k + ' ' + (v ? JSON.stringify(v) : f);
    }
    q('type', '(unknown)');
    q('subtype', '(none)');
    q('bitsPerValue', '(unknown)');
    return descr;
  },

});


function reg(...details) {
  if (encs[nextId]) { throw new Error('Duplicate encoding ID: ' + nextId); }
  const enc = Object.assign({ id: nextId }, ...details);
  enc.bytesPerValue = enc.bitsPerValue / bitsPerByte;
  encs[nextId] = enc;
  nextId += 1;
  return enc;
}
function multi(common, key, variants) {
  return variants.map(v => reg(common, (key ? { [key]: v } : v)));
}
function exo(subtype, info) { reg({ type: 'exotic', subtype }, info); }
function itut(subtype, info) { reg({ type: 'ITU-T', subtype }, info); }


itut('G.711', { [bitWidthProp]: 8, scale: 'u-law' });

const bigEndianIntReaders = {
  '1': (buf, pos) => buf.readInt8BE(pos),
  '2': (buf, pos) => buf.readInt16BE(pos),
  '4': (buf, pos) => buf.readInt32BE(pos),
};

multi({ type: 'PCM', scale: 'linear' }, bitWidthProp, [8, 16, 24, 32])
.forEach(function bitStuff(enc) {
  const pot = 2 ** (enc.bitsPerValue - 1);
  enc.valuesRange = {
    signed: true,
    max: pot - 1,
    mid: 0,
    min: -pot,
    factor: 1 / pot,
  };
  enc.bufRead = ifFun(bigEndianIntReaders[enc.bytesPerValue], null);
});

multi({ type: 'IEEE float' }, bitWidthProp, [32, 64]);
exo('Fragmented sample data');
exo('DSP program');
multi({ type: 'fixed' }, bitWidthProp, [8, 16, 24, 32]);
verifyNextId(14);

nextId = 18;
multi({ [bitWidthProp]: 16 }, 'scale', [
  'linear with emphasis',
  'linear compressed',
  'linear compressed with emphasis',
]);
exo('Music kit DSP commands');
verifyNextId(22);

nextId = 23;
itut('G.721 ADPCM', { [bitWidthProp]: 4 });
itut('G.722 SB-ADPCM');
itut('G.723 ADPCM', { [bitWidthProp]: 3 });
itut('G.723 ADPCM', { [bitWidthProp]: 5 });
itut('G.711', { [bitWidthProp]: 8, scale: 'A-law' });
verifyNextId(28);

export default encs;
