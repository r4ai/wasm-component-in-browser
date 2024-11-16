import * as fs from "node:fs/promises"
import { generate } from "@bytecodealliance/jco/component"

const cowsayBuffer = (await fs.readFile("./cowsay.wasm")).buffer

const res = await generate(cowsayBuffer, {
  name: "cowsay",
  noTypescript: true,
  noNodejsCompat: true,
  map: Object.entries(
    // @see https://github.com/bytecodealliance/jco/blob/7b6e3867b02e2546dcd179238f2f1694c981a20c/src/cmd/transpile.js#L156-L166
    {
      "wasi:cli/*": "@bytecodealliance/preview2-shim/cli#*",
      "wasi:clocks/*": "@bytecodealliance/preview2-shim/clocks#*",
      "wasi:filesystem/*": "@bytecodealliance/preview2-shim/filesystem#*",
      "wasi:http/*": "@bytecodealliance/preview2-shim/http#*",
      "wasi:io/*": "@bytecodealliance/preview2-shim/io#*",
      "wasi:random/*": "@bytecodealliance/preview2-shim/random#*",
      "wasi:sockets/*": "@bytecodealliance/preview2-shim/sockets#*",
    }
  ),
})

const decoder = new TextDecoder()
const modules = Object.fromEntries(
  res.files.map(([name, buffer]) => {
    if (name.endsWith(".wasm")) return [name, buffer]
    return [name, decoder.decode(buffer)]
  })
)

await fs.mkdir("./tmp", { recursive: true })
for (const [name, buffer] of Object.entries(modules)) {
  if (typeof buffer === "string") {
    await fs.writeFile(`./tmp/${name}`, buffer)
  } else {
    await fs.writeFile(`./tmp/${name}`, buffer)
  }
}
