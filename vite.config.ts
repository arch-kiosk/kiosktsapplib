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
            // copy({
            //   targets: [ { src: '../../kioskfilemakerworkstationplugin/static/kioskfilemakerworkstation.css',
            //     dest:'./kioskfilemakerworkstation/static'
            //   }, {
            //     src: '../../kioskfilemakerworkstationplugin/static/scripts',
            //     dest:'./kioskfilemakerworkstation/static'
            //   }],
            //   hook: 'buildStart'
            // }),
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
                // external: [/^dexie/]
                external: [/node_modules/,]
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
