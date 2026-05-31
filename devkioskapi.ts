import {
    KioskApi,
    FetchException,
    API_STATE_ERROR,
    API_STATE_INITIALIZING,
    API_STATE_READY,
} from "./kioskapi";

import Cookies from "js-cookie"

export class DevKioskApi extends KioskApi {
    kioskRoutes: { [key: string]: string } = {}
    public kioskTZIndex: number

    constructor(...args: ConstructorParameters<typeof KioskApi>) {
        super(...args);
        this.kioskTZIndex = 0
    }

    getKioskRoute(routeName: string) {
        if (!this.kioskRoutes) {
            console.log("devKioskApi: No kiosk routes registered. Please call registerRoute to register routes for the dev instance.")
            return ""
        }
        if (!(routeName in this.kioskRoutes)) {
            console.log(`devKioskApi: The kiosk route ${routeName} is not registered. Please call registerRoute to register this route explicitly for the dev instance.`)
            return ""
        }
        // return "/" + this.kioskRoutes[routeName]
        return "http://localhost:5000/" + this.kioskRoutes[routeName]
    }

    registerRoute(routeName: string, url: string) {
        if (!this.kioskRoutes) this.kioskRoutes = {}
        this.kioskRoutes[routeName] = url
    }

    getApiUrl(apiAddress = "") {

        console.log("dekioskapi", this)
        let route = this.apiURL;
        if (apiAddress) {
            return `${route}${this.apiRoot}v1/${apiAddress}`;
        } else {
            return route;
        }
    }

    getHeaders(mimetype:string)  {
        let headers = super.getHeaders(mimetype)
        headers.append("webapp-user-id", this.apiUser);
        headers.append("webapp-user-pwd",this.apiPwd);
        try {
            if (this.kioskTZIndex == 0) this.kioskTZIndex = parseInt(Cookies.get("kiosk_tz_index") ?? "0")
        } catch {}
        headers.append("X-Kiosk-tz-index",this.kioskTZIndex.toString());
        return headers
    }

    async initApi() {
        this.status = API_STATE_INITIALIZING;
        let headers = new Headers()
        headers.append("Content-Type", "application/json");
        headers.append("Accept", "application/json");
        headers.append("Origin", this.apiURL);

        console.log("@arch_kiosk/kiosktsapplib: initializing DevKioskApi...");
        let address = this.getApiUrl("login");
        let response;
        try {
            response = await fetch(address, {
                headers: headers,
                body: JSON.stringify({
                    userid: this.apiUser,
                    password: this.apiPwd
                }),
                method: "POST",
            });
        } catch (e: any) {
            // console.log(`throwing FetchException after caught ${e}`)
            this.status = API_STATE_ERROR;
            this.lastErrorMessage = e.message;
            throw new FetchException(e, null);
        }
        if (response.ok) {
            let data = await response.json();
            this.token = data["token"];
            this.status = API_STATE_READY;
        } else {
            // console.log(`throwing FetchException ${response.statusText}`)
            this.status = API_STATE_ERROR;
            this.lastErrorMessage = response.statusText;
            throw new FetchException(response.statusText, response);
        }
    }
}
