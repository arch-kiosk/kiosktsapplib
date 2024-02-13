import { KioskApi } from "./kioskapi";
import { Constant } from "./generaltypes";

export async function fetchConstants(apiContext: KioskApi) {
    let json = await apiContext.fetchFromApi(
        "",
        "constants",
        {
            method: "GET",
            caller: "app.fetchConstants",
        })
    return json as Constant[]
}
