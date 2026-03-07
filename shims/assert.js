/**
 * shims/assert.js
 * A minimal no-op shim for Node.js's `assert` module.
 * Required because expo-notifications → @ide/backoff imports `assert`,
 * which does not exist in React Native's Metro bundler environment.
 */
function assert(value, message) {
    if (!value) {
        throw new Error(message || 'Assertion failed');
    }
}

assert.ok = assert;
assert.equal = function (a, b, msg) { assert(a == b, msg); };
assert.strictEqual = function (a, b, msg) { assert(a === b, msg); };
assert.notEqual = function (a, b, msg) { assert(a != b, msg); };
assert.notStrictEqual = function (a, b, msg) { assert(a !== b, msg); };
assert.deepEqual = assert.ok;
assert.deepStrictEqual = assert.ok;
assert.fail = function (msg) { throw new Error(msg || 'Assertion failed'); };

module.exports = assert;
