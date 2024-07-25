import { DevKioskApi } from "./kiosktsapplib";
import { KioskApp } from "./kiosktsapplib";

window.addEventListener("load", () => {
    console.log("kiosktsapplib: kioskdevstarter let's start...");
    let api = new DevKioskApi();
    registerDevRoutes(api)
    api.initApi()
        .catch((e) => {
            console.log(`Exception when initializing: ${e}`);
        })
        .finally(() => {
            // @ts-ignore
            apiReady(api)

        });
});

function registerDevRoutes(api: DevKioskApi) {
    api.registerRoute("kioskfilemakerworkstation.workstation_actions", "kioskfilemakerworkstation/actions")
}