/**
 * How to run:
 *
 * ```shell
 * bun run jco transpile cowsay.wasm -o dist
 * node run.js
 * ```
 */

import { cow } from "./dist/cowsay.js"

console.log(cow.say("Hello, World!"))
