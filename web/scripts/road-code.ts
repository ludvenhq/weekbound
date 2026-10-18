// `npm run code -- <road.json>` checks a road file against the schema and prints its code.
// `npm run code -- --decode <code or file>` prints the road a code holds, or why it does not open.
import { existsSync, readFileSync } from 'node:fs';
import { DECODE_MESSAGES, decodeRoad, encodeRoad, MAX_CODE_BYTES } from '../src/lib/road/code.ts';

const args = process.argv.slice(2);
const decode = args[0] === '--decode';
const target = decode ? args[1] : args[0];
if (!target) {
  console.error('usage: npm run code -- <road.json> | --decode <code or file>');
  process.exit(2);
}

if (decode) {
  const result = decodeRoad(existsSync(target) ? readFileSync(target, 'utf8') : target);
  if (!result.ok) {
    console.error(`${result.error}: ${DECODE_MESSAGES[result.error]}`);
    if (result.detail) console.error(result.detail);
    process.exit(1);
  }
  console.log(JSON.stringify(result.road, null, 2));
} else {
  let road: unknown;
  try {
    road = JSON.parse(readFileSync(target, 'utf8'));
  } catch (error) {
    console.error(`${target}: ${(error as Error).message}`);
    process.exit(1);
  }
  const result = encodeRoad(road);
  if (!result.ok) {
    console.error(`${target}: ${result.error}\n${result.detail}`);
    process.exit(1);
  }
  console.log(result.code);
  console.error(`${result.code.length} of ${MAX_CODE_BYTES} bytes`);
}
