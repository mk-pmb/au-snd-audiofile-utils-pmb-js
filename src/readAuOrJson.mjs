import readDataFile from 'read-data-file';
import promiseFs from 'nofs';
import vTry from 'vtry';

import parseAuHeader from './parseAuHeader';
import makeSampleDecoder from './makeSampleDecoder';

function orf(x) { return (x || false); }

async function readAuOrJson(path) {
  const fext = orf(/\.(\w{1,8})$/.exec(path))[1];
  switch (fext) {
    case 'json':
    case 'yaml':
      return readDataFile(path);
  }
  const fileBuf = await promiseFs.readFile(path);
  const meta = vTry(parseAuHeader, 'Parse header of file ' + path)(fileBuf);

  const decoder = makeSampleDecoder(meta);
  const audioData = fileBuf.subarray(+meta.dataOffsetBytes || 0);
  const matrix = await decoder(audioData);
  return { ...meta, data: matrix };
}


export default readAuOrJson;
