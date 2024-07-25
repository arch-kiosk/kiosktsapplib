// noinspection DuplicatedCode
import { expect, test } from 'vitest'
import "fake-indexeddb/auto";
import { KioskTimeZones } from "../kiosktimezones.ts"
import { KioskApi } from "../kioskapi.ts";
import { DevKioskApi } from "../devkioskapi.ts";
import { loadEnv } from "vite";
import { getKioskApiforTest } from "../kiosktesttools.js";

test("test KioskTimeZones init", () => {
    const kioskApi = new DevKioskApi()
    const kioskTimeZones = new KioskTimeZones(kioskApi)
    expect(kioskApi).not.toBeNull()
    expect(kioskTimeZones).not.toBeNull()
});

test("test KioskTimeZones fetchFavouriteTimeZones", async () => {
    const kioskApi = await getKioskApiforTest()
    const kioskTimeZones = new KioskTimeZones(kioskApi)
    const jsonTimeZones = await kioskTimeZones.fetchFavouriteTimeZones()
    expect(jsonTimeZones.length).toBeGreaterThan(30)
});

//The rest needs to be tested with the browser active
