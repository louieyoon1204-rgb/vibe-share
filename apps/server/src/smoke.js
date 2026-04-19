import assert from "node:assert/strict";
import { createPairingCode, formatBytes, isValidRole, otherRole } from "./utils.js";

const code = createPairingCode(new Set());

assert.match(code, /^\d{6}$/);
assert.equal(isValidRole("pc"), true);
assert.equal(isValidRole("phone"), false);
assert.equal(otherRole("pc"), "mobile");
assert.equal(formatBytes(1024), "1.0 KB");

console.log("server smoke ok");
