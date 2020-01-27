import 'p-fatal';

import readAuOrJson from './readAuOrJson';

async function runFromCLI() {
  const [action, inputFileName, ...args] = process.argv.slice(2);
  if (/\W/.test(action)) { throw new Error('Invalid action name: ' + action); }
  const impl = (await import('./' + action)).default;
  const inputData = await readAuOrJson(inputFileName);
  await impl(inputData, ...args);
}

runFromCLI();
