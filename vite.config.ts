import { defineConfig, searchForWorkspaceRoot, loadEnv } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import copy from "rollup-plugin-copy";
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// noinspection JSUnusedGlobalSymbols
export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, "env");
    return {
        plugins: [
            dts({
                rollupTypes: true,
            }),
            createHtmlPlugin({
                inject: {
                    ...env,
                },

            }),
        ],
        esbuild:
            command == "build"
                ? {
                      //No console.logs in the distribution
                      // drop: ["console", "debugger"],
                  }
                : {},
        build: {
            outDir: "./dist",
            emptyOutDir: true,
            minify: true,
            lib: {
                entry: "./kiosktsapplib.ts",
                formats: ["es"],
            },
            rollupOptions: {
                // Externalize all npm packages but keep local files
                // The !id.startsWith('\0') check is for Rollup virtual modules and plugin-generated modules.
                external: (id) =>
                    !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0') && !id.match(/^[A-Za-z]:/)
            },
        },
        server: {
            fs: {
                strict: true,
                host: true,
                allow: [searchForWorkspaceRoot(process.cwd()), "../server/kiosk/kiosk/static/scripts/kioskapplib"],
            },
        },
        publicDir: "/static"
    };
});
