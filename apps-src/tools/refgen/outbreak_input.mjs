/* Writes the example outbreak line list to tests/ref/outbreak_example.csv for tools/refgen/outbreak_ref.R.
 * Run from apps-src/: node tools/refgen/outbreak_input.mjs */
import { writeFileSync } from 'node:fs';
import { exampleOutbreakCsv } from '../../engine/examples.js';
writeFileSync('tests/ref/outbreak_example.csv', `${exampleOutbreakCsv()}\n`);
console.log('wrote tests/ref/outbreak_example.csv');
