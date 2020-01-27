import binary from 'binary-pmb';

import encodingsDetails from './encodingsDetails';
import kisi from './kisi';

const obAss = Object.assign;
const headerWordWidthBytes = 4;
const headerUints = [
  'dataOffsetBytes',
  'dataLengthBytes',
  'encoding.id',
  'sampleRateHz',
  'nChannels',
];
const headerLengthWords = (
  1 // magicNum
  + headerUints.length
);
const headerLengthBytes = headerLengthWords * headerWordWidthBytes;


function describeHeader() {
  const meta = (this || false);
  return `${encodingsDetails.describe(meta.encoding)}, ${
    meta.nChannels} channel(s)`;
}


function parseAuHeader(buf) {
  const reader = binary.parse(buf);
  reader.str('magicNum', headerWordWidthBytes);
  headerUints.forEach(key => reader.word32bu(key));
  const meta = reader.vars;
  const warn = {};
  const { nChannels } = meta;
  if (!kisi.ifPosFin(nChannels)) { warn.badNumberOfChannels = true; }

  switch (meta.magicNum) {
    case '.snd':
      break;
    default:
      throw kisi.unsupp('file type: magic number', meta.magicNum);
  }

  const dOffs = meta.dataOffsetBytes;
  if (dOffs % 8) { warn.dataMisaligned = true; }
  const annotLen = dOffs - headerLengthBytes;
  meta.annotationLengthBytes = annotLen;
  if (annotLen < 0) { warn.dataInHeader = true; }
  if (annotLen > 0) {
    const lastAnnotByte = buf.readUInt8(dOffs - 1);
    if (lastAnnotByte !== 0) { warn.annotNotZeroTerminated = lastAnnotByte; }
  }

  const enc = meta.encoding;
  obAss(enc, encodingsDetails[enc.id]);
  const bytesPerSample = nChannels * enc.bytesPerValue;
  if (!kisi.ifPosFin(bytesPerSample)) { warn.badSampleWidth = true; }
  obAss(meta, {
    describeHeader,
    bytesPerSample,
  });

  meta.warnings = (Object.keys(warn).length ? warn : false);
  return meta;
}


obAss(parseAuHeader, {
  headerLengthBytes,
});
export default parseAuHeader;
