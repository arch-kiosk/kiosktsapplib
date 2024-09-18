import { getKioskApiforTest } from "../kiosktesttools";
import { KioskTimeZones } from "../kiosktimezones";
import { expect } from "vitest";
import { KioskApi } from "../kioskapi";

let testFunctions: Array<Function> = []

// @ts-ignore
window.runInBrowserTests = function(api: KioskApi) {
    const body:HTMLElement = document.getElementsByTagName('body')[0] as HTMLElement
    if (!api) {
        body.innerHTML = "<div>no Kiosk API</div>"
        return
    }

    function startNextTest(i: number) {
        if (i >= testFunctions.length) return
        const node = document.createElement("div")
        body.append(node)
        const t = testFunctions[i]
        t(api, node)
            .then(() => {
                node.innerHTML = node.innerHTML + " okay."
            })
            .catch((e: any) => {
                node.innerHTML = node.innerHTML + ` FAILED! (${e})`
            })
            .finally(() => {
                startNextTest(i+1)
            })
    }
    startNextTest(0)
}

testFunctions.push(async (api:KioskApi, node: HTMLDivElement) => {
        node.innerHTML = "testing KioskTimeZones.fetchFavouriteTimeZones ...";
        // const kioskApi = await getKioskApiforTest()
        if (!api) throw "no Kiosk API"
        const kioskTimeZones = new KioskTimeZones(api)
        const jsonTimeZones = await kioskTimeZones.fetchFavouriteTimeZones()
        if (!jsonTimeZones) throw "jsonTimeZones is null: fetching favourite time zones failed"
        if (jsonTimeZones.length < 30) throw "jsonTimeZones < 30"
    })

testFunctions.push(async (api:KioskApi, node: HTMLDivElement) => {
    node.innerHTML = "testing KioskTimeZones.refreshFavourites ...";
    const kioskTimeZones = new KioskTimeZones(api)
    // @ts-ignore
    const favouriteKioskTimeZones = await kioskTimeZones.refreshFavourites()
    if (!favouriteKioskTimeZones) throw "favouriteKioskTimeZones is null: refreshing favourite time zones failed"
    if (favouriteKioskTimeZones.length < 30) throw "favouriteKioskTimeZones < 30"
    // @ts-ignore
    if (!kioskTimeZones.hasRefreshedFavourites) throw("favouriteKioskTimeZones not refreshed")
})

testFunctions.push(async (api:KioskApi, node: HTMLDivElement) => {
    node.innerHTML = "testing KioskTimeZones.getFavouriteTimeZones ...";
    const kioskTimeZones = new KioskTimeZones(api)
    // @ts-ignore
    let favouriteKioskTimeZones = await kioskTimeZones.getFavouriteTimeZones()
    if (favouriteKioskTimeZones.length < 30) throw "favouriteKioskTimeZones < 30"

})

testFunctions.push(async (api:KioskApi, node: HTMLDivElement) => {
    node.innerHTML = "testing KioskTimeZones.getAllTimeZones ...";
    const kioskTimeZones = new KioskTimeZones(api)
    // @ts-ignore
    let allKioskTimeZones = await kioskTimeZones.getAllTimeZones(true)
    if (allKioskTimeZones.length < 100) throw "allKioskTimeZones < 100"
    if (allKioskTimeZones.filter(tz => tz.favourite == 1).length < 30)  throw "favourite Kiosk Time Zones < 30 after getAllTimeZones()"
    if (allKioskTimeZones.filter(tz => tz.deprecated == 1).length < 10)  throw "deprecated Kiosk Time Zones < 30 after getAllTimeZones()"
})

testFunctions.push(async (api:KioskApi, node: HTMLDivElement) => {
    node.innerHTML = "testing KioskTimeZones.getTimeZoneByIndex ...";
    const kioskTimeZones = new KioskTimeZones(api)
    // @ts-ignore
    let kioskTimeZone = await kioskTimeZones.getTimeZoneByIndex(1820474)
    if (kioskTimeZone == null) throw "kioskTimeZone 1820474 does not exist"
    if (kioskTimeZone.tz_IANA != "Asia/Calcutta") throw "kioskTimeZone is not Asia/Calcutta"
    kioskTimeZone = await kioskTimeZones.getTimeZoneByIndex(0)
    if (kioskTimeZone != null) throw "kioskTimeZone 0 should not exist"
    kioskTimeZone = await kioskTimeZones.getTimeZoneByIndex(-1)
    if (kioskTimeZone != null) throw "kioskTimeZone -1 should not exist"
})
