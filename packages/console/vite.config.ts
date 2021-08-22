import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import visualizer from "rollup-plugin-visualizer"

export default defineConfig(({ mode }) => ({
    plugins: [vue(), visualizer({ open: mode === "stats" })],
    resolve: { alias: { "typeorm": "typeorm/typeorm-model-shim" } },
    build: { outDir: "build" },
}))
