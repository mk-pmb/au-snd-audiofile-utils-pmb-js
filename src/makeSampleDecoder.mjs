import pImmediate from 'p-immediate';
import vTry from 'vtry';
import ifFun from 'if-fun';

import kisi from './kisi';
import encodingsDetails from './encodingsDetails';


function makeBigEndianReader(enc) {
  const { bytesPerValue, bufRead } = enc;
  if (!bufRead) { kisi.unsupp({ bytesPerValue }); }
  const rd = function readNextValue(buf) {
    const val = bufRead(buf, rd.pos);
    rd.pos += bytesPerValue;
    return val;
  };
  rd.pos = 0;
  return rd;
}


function matrixAddDistribute(rec) {
  function addValue(chValues, chIdx) { return chValues.push(rec[chIdx]); }
  return Math.max(this.map(addValue));
}


function matrixInit(geom) {
  const mx = Object.assign([], geom);
  const { primaryAxis } = geom;
  const nChan = kisi.ifPosFin(geom.nChannels, 0);
  switch (primaryAxis) {
    case 'channel':
      for (let chIdx = 0; chIdx < nChan; chIdx += 1) { mx[chIdx] = []; }
      mx.addSample = matrixAddDistribute;
      return mx;
    case 'sample':
      mx.addSample = mx.push;
      return mx;
  }
  throw kisi.unsupp({ primaryAxis });
}


function makePcmStyleDecoder(meta, howM) {
  const { nChannels, bytesPerSample } = meta;
  if (!kisi.ifPosFin(nChannels)) {
    throw new RangeError('Reader would be useless with no audio channels');
  }

  const enc = meta.encoding;
  const readNextValue = makeBigEndianReader(enc);

  function decode(buf, howB) {
    const how = { ...howM, ...howB };
    const bufLen = kisi.ifPosFin(buf.length, 0);
    const nSamples = (bufLen
      && Math.ceil(kisi.ifPosFin(bufLen / bytesPerSample, 0)));
    const matrix = matrixInit({
      nChannels,
      nSamples,
      primaryAxis: (how.matrixAlignment || 'channel'),
    });
    if (!nSamples) { return matrix; }

    const maxLoopB = (+how.maxBytesPerLoop || 1e3);
    const hookFunc = ifFun(how.onBeforeDecodeMore);
    const hookCtx = (hookFunc && {
      buf,
      meta,
      how,
      readNextValue,
    });

    function decodeMore() {
      const startPos = readNextValue.pos;
      const stopPos = Math.min(bufLen, startPos + maxLoopB);
      if (hookFunc) { hookFunc({ ...hookCtx, startPos, stopPos }); }
      while (readNextValue.pos < stopPos) {
        const values = [];
        for (let chn = 0; chn < nChannels; chn += 1) {
          values[chn] = readNextValue(buf);
        }
        if (matrix.addSample(values) > nSamples) {
          throw new Error('Unexpected extra samples, probably bad reader.');
        }
      }
      if (stopPos === bufLen) { return matrix; }
      return pImmediate().then(decodeMore);
    }
    return decodeMore();
  }
  return decode;
}


function makeSampleDecoder(meta, opt) {
  const enc = meta.encoding;
  switch (enc.type) {
    case 'PCM':
      return makePcmStyleDecoder(meta, opt);
    default:
      throw kisi.unsupp('file type: ' + encodingsDetails.describe(enc));
  }
}


function tryMakeSampleDecoder(meta, opt) {
  if (!(meta || false).describeHeader) {
    const err = new Error('Invalid header record');
    err.meta = meta;
    throw err;
  }
  return vTry(makeSampleDecoder, `Cannot make sample decoder for ${
    meta.describeHeader()}`)(meta, opt || false);
}


export default tryMakeSampleDecoder;
