import ifFun from 'if-fun';

import kisi from './kisi';

const obAss = Object.assign;
const displayModes = {};

async function au2json(input, dMode, ...args) {
  if (!dMode) { return console.log(JSON.stringify(input, null, 2)); }

  const impl = ifFun(displayModes[dMode]);
  if (!impl) { kisi.unsupp('display mode:', dMode); };
  await impl(input, ...args);
}


obAss(displayModes, {

  scaled(input) {
    const { factor } = input.encoding.valuesRange;
    function scaleValue(x) { return x * factor; }
    function printScaledList(list) { console.log(list.map(scaleValue)); }
    input.data.forEach(printScaledList);
  },

};















export default au2json;
