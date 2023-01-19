import { fileURLToPath, URL } from "url"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import visualizer from "rollup-plugin-visualizer"
import svgLoader from "vite-svg-loader"

export default defineConfig(({ mode }) => ({
    plugins: [
        vue({ reactivityTransform: true }),
        svgLoader(),
        ...mode === "stats" ? [visualizer({ open: true })] : [],
    ],
    resolve: {
        alias: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            typeorm: "typeorm/typeorm-model-shim",
        },
    },
    build: { outDir: "build" },
}))
