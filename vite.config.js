import { defineConfig } from "vite"
import arraybuffer from "vite-plugin-arraybuffer"

export default defineConfig({
  plugins: [arraybuffer()],
  optimizeDeps: {
    exclude: ["@bytecodealliance/jco/component", "@rollup/browser"],
  },
})
