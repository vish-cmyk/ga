import { readFile } from "node:fs/promises";
const cases = JSON.parse(await readFile(new URL("./test-cases.json", import.meta.url), "utf8"));
const failures = [];
for (const c of cases) {
  if (!c.business?.concern) failures.push(c.id + ": missing concern");
  if (c.turns.length < 6) failures.push(c.id + ": too few turns");
  if (!Array.isArray(c.must_test) || c.must_test.length < 3) failures.push(c.id + ": weak acceptance tests");
}
console.log(JSON.stringify({cases: cases.length, failures}, null, 2));
process.exitCode = failures.length ? 1 : 0;
