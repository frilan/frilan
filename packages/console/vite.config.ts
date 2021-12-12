import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import visualizer from "rollup-plugin-visualizer"
import svgLoader from "vite-svg-loader"

export default defineConfig(({ mode }) => ({
    plugins: [
        vue({ reactivityTransform: true }),
        svgLoader(),
        visualizer({ open: mode === "stats" }),
    ],
    resolve: { alias: { "typeorm": "typeorm/typeorm-model-shim" } },
    build: { outDir: "build" },
}))
