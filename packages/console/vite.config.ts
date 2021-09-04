import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import visualizer from "rollup-plugin-visualizer"

export default defineConfig(({ mode }) => ({
    plugins: [
        // refTransform doesn't work for now, see https://github.com/vuejs/vue-next/issues/4502
        vue({ script: { refSugar: true } }),
        visualizer({ open: mode === "stats" }),
    ],
    resolve: { alias: { "typeorm": "typeorm/typeorm-model-shim" } },
    build: { outDir: "build" },
}))
