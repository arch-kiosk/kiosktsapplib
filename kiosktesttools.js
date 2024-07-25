import { expect } from "vitest";
import { DevKioskApi } from "./devkioskapi";
import { KioskApi } from "./kioskapi";

export async function getKioskApiforTest() {
    expect(import.meta.env.VITE_DEV_API_URL).not.toBeUndefined()

    const kioskApi = new DevKioskApi()
    try {
        await kioskApi.initApi()
        return kioskApi
    } catch(e) {
        throw `Kiosk Api could not be initialized: ${e}`
    }
}
