import { expect } from "vitest";
import { DevKioskApi } from "./devkioskapi";
import { KioskApi } from "./kioskapi";

export async function getKioskApiforTest() {
    expect(import.meta.env.VITE_DEV_API_URL).not.toBeUndefined()
    expect(import.meta.env.VITE_DEV_API_USER).not.toBeUndefined()

    const kioskApi = new DevKioskApi(undefined,import.meta.env.VITE_DEV_API_URL,
        import.meta.env.VITE_DEV_API_USER, import.meta.env.VITE_DEV_API_PWD)
    try {
        await kioskApi.initApi()
        return kioskApi
    } catch(e) {
        throw `Kiosk Api could not be initialized: ${e}`
    }
}
