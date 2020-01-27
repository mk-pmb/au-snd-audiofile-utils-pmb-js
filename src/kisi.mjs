// kisi = kitchen sink

import isStr from 'is-string';

const kisi = {

  ifPosFin(x, d) { return ((Number.isFinite(x) && (x > 0)) ? x : d); },

  flatDumpObj(o) {
    function dumpKey(k) { return `${k}: ${JSON.stringify(o[k]) || o[k]}`; }
    return Object.keys(o).sort().map(dumpKey).join(', ');
  },

  unsupp(what, data) {
    const err = ('Unsupported '
      + (isStr(what) ? what : kisi.flatDumpObj(what))
      + (data === undefined ? '' : ' ' + JSON.stringify(data)));
    throw new Error(err);
  },

};







export default kisi;
