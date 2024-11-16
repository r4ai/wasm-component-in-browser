import "./style.css"
import javascriptLogo from "./javascript.svg"
import viteLogo from "/vite.svg"
import { setupCounter } from "./counter.js"
import cowsayBuffer from "./cowsay/cowsay.wasm?uint8array"
import { rollup } from "@rollup/browser"

import preview2_shim_cli from "./node_modules/@bytecodealliance/preview2-shim/lib/browser/cli.js?raw"
import preview2_shim_clocks from "./node_modules/@bytecodealliance/preview2-shim/lib/browser/clocks.js?raw"
import preview2_shim_filesystem from "./node_modules/@bytecodealliance/preview2-shim/lib/browser/filesystem.js?raw"
import preview2_shim_http from "./node_modules/@bytecodealliance/preview2-shim/lib/browser/http.js?raw"
import preview2_shim_index from "./node_modules/@bytecodealliance/preview2-shim/lib/browser/index.js?raw"
import preview2_shim_io from "./node_modules/@bytecodealliance/preview2-shim/lib/browser/io.js?raw"
import preview2_shim_random from "./node_modules/@bytecodealliance/preview2-shim/lib/browser/random.js?raw"
import preview2_shim_sockets from "./node_modules/@bytecodealliance/preview2-shim/lib/browser/sockets.js?raw"

document.querySelector("#app").innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`

setupCounter(document.querySelector("#counter"))

const run = async () => {
  const { generate } = await import("@bytecodealliance/jco/component")
  const res = await generate(cowsayBuffer, {
    name: "cowsay",
    noTypescript: true,
    noNodejsCompat: true,
    tlaCompat: false,
    base64Cutoff: 4096,
    validLiftingOptimization: false,
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
  console.log(res)

  const decoder = new TextDecoder()
  const modules = Object.fromEntries(
    res.files.map(([name, buffer]) => {
      return [name, buffer]
    })
  )
  modules["@bytecodealliance/preview2-shim/cli"] = preview2_shim_cli
  modules["@bytecodealliance/preview2-shim/clocks"] = preview2_shim_clocks
  modules["@bytecodealliance/preview2-shim/filesystem"] =
    preview2_shim_filesystem
  modules["@bytecodealliance/preview2-shim/http"] = preview2_shim_http
  modules["@bytecodealliance/preview2-shim"] = preview2_shim_index
  modules["@bytecodealliance/preview2-shim/io"] = preview2_shim_io
  modules["@bytecodealliance/preview2-shim/random"] = preview2_shim_random
  modules["@bytecodealliance/preview2-shim/sockets"] = preview2_shim_sockets

  const code = await rollup({
    input: "cowsay.js",
    plugins: [
      {
        name: "virtual",
        resolveId(source, importer) {
          console.log("resolveId", source)
          if (source in modules) {
            return source
          }

          // resolve relative imports from "@bytecodealliance/preview2-shim"
          if (importer.startsWith("@bytecodealliance/preview2-shim")) {
            const sourceModuleName = source.match(/(\.\/)?(.*?)(\.js)?$/)[2]
            return ["@bytecodealliance/preview2-shim", sourceModuleName]
              .filter(Boolean)
              .join("/")
          }

          console.error("failed to resolveId", source, "from", importer)
        },
        load(id) {
          console.log("load", id)
          if (id in modules) {
            const buffer = modules[id]
            if (typeof buffer === "string") return buffer
            if (id.endsWith(".wasm")) return buffer
            return decoder.decode(buffer)
          }
          console.error("failed to load", id)
        },
        transform(code, id) {
          if (!id.endsWith(".js")) return

          const urls = code.matchAll(
            /new\s+URL\(([^)]+),\s+import\.meta\.url\)/g
          )
          for (const url of urls) {
            const [_, src] = url
            if (!src) continue
            const urlStr = src.replaceAll(/['"]/g, "").replace(/^\.\//, "")
            console.log("transform", urlStr)
            const mod = modules[urlStr]
            if (mod) {
              const url = URL.createObjectURL(
                new Blob([mod], { type: "application/wasm" })
              )
              if (!url) continue
              code = code.replace(
                new RegExp(`new\\s+URL\\(${src},\\s+import\\.meta\\.url\\)`),
                `"${url}"`
              )
            }
          }

          return {
            code,
            map: { mappings: "" },
          }
        },
      },
    ],
  })
    .then((bundle) => bundle.generate({ format: "es" }))
    .then(({ output }) => output[0].code)

  const mod = await import(
    /* @vite-ignore */
    URL.createObjectURL(new Blob([code], { type: "application/javascript" }))
  )
  const { cow } = mod
  console.log(cow.say("Hello, World!"))
}
await run()
