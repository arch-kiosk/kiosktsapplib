import { FetchException, KioskApi } from "./kioskapi";
import Dexie, { EntityTable } from "dexie";
import { ApiResultContextsFull } from "./generaltypes";
import { handleCommonFetchErrors } from "./applib";
import { FALSE } from "sass";

export interface TimeZone {
    id: number,
    tz_IANA: string,
    tz_long: string,
    deprecated: number, //mimicking a boolean
    version: number
    favourite: number, //mimicking a boolean
}

export interface ApiResultKioskTimeZone {
    id: number,
    tz_IANA: string,
    tz_long: string,
    deprecated: boolean,
    version: number
}

type KioskTimeZoneDb = Dexie & {
    kioskTimeZones: EntityTable<TimeZone,'id'>
}

export class KioskTimeZones {
    private apiContext: KioskApi = undefined
    private db: KioskTimeZoneDb = undefined
    private hasRefreshedFavourites: boolean = false
    private hasRefreshedAll: boolean = false

    constructor(kioskApi: KioskApi) {
        this.apiContext = kioskApi
        this.db = this.initDb()
    }

    protected initDb():KioskTimeZoneDb {
        const db = new Dexie('KioskTimeZones') as KioskTimeZoneDb
        db.version(1).stores({
            kioskTimeZones: '&id, tz_long, tz_IANA, deprecated, version, favourite'
        })
        return db
    }

    public async getFavouriteTimeZones(includeDeprecated = false, refreshAfterwards=false): Promise<Array<TimeZone>> {
        const c = await this.db.kioskTimeZones.count()
        let favourites: Array<TimeZone>
        if (c == 0) {
            favourites = await this.refreshFavourites()
        }
        favourites = await this.db.kioskTimeZones.where({ "deprecated": 0, "favourite":1 }).toArray()
        if (refreshAfterwards)
            this.refreshFavourites().finally(() => {console.log("refreshed favourites")})

        return(favourites)
    }

    private async refreshFavourites () {
        if (!this.hasRefreshedFavourites) {
            const json = await this.fetchFavouriteTimeZones()
            if (json.length > 0) {
                const cDeleted = await this.db.kioskTimeZones.where("favourite").equals(1).delete()
                console.log(`Deleted ${cDeleted} favourite time zones`)
                const timeZones: Array<TimeZone> = json.map((tz:ApiResultKioskTimeZone) => {
                    return {
                        id: tz.id, tz_IANA: tz.tz_IANA,
                        tz_long: tz.tz_long,
                        deprecated: tz.deprecated?1:0,
                        version: tz.version,
                        favourite: 1 } as TimeZone
                }) as Array<TimeZone>
                await this.db.kioskTimeZones.bulkAdd(timeZones)
                this.hasRefreshedFavourites = true
                return timeZones
            }
        }
        return [] as Array<TimeZone>
    }

    async fetchFavouriteTimeZones() {
        return await this.apiContext.fetchFromApi(
            "",
            "favouritetimezones",
            {
                method: "GET",
                caller: "app.fetchFavouriteTimeZones",
            })
            .then((json: Array<ApiResultKioskTimeZone>) => {
                console.log("favourite time zone information fetched");
                return json;
            })
            .catch((e: FetchException) => {
                console.log(`fetching time zone information failed: ${e}`);
                return [] as Array<ApiResultKioskTimeZone>
            });
    }

    async fetchAllTimeZones(newerThan = 0) {
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append("include_deprecated", "true");
        if (newerThan > 0) urlSearchParams.append("newer_than", `${newerThan}`);
        return await this.apiContext.fetchFromApi(
            "",
            "timezones",
            {
                method: "GET",
                caller: "app.fetchFavouriteTimeZones",
            },
            "v1",
            urlSearchParams)
            .then((json: Array<ApiResultKioskTimeZone>) => {
                console.log("time zone information fetched");
                return json;
            })
            .catch((e: FetchException) => {
                console.log(`time zone information failed: ${e}`);
                return [] as Array<ApiResultKioskTimeZone>
            });
    }

    async getAllTimeZones(deprecated = false, forceReload = false) {
        let allTimeZones = await this.refreshAllTimeZones(forceReload);
        if (allTimeZones.length == 0) {
            console.log("fetching time zones entirely from database")
           allTimeZones = await this.db.kioskTimeZones.toArray()
        }
        return allTimeZones.filter(tz => tz.deprecated == 0 || deprecated)
    }

    private async refreshAllTimeZones(forceReload: boolean) {
        let allTimeZones: Array<TimeZone> = []
        if (forceReload || !this.hasRefreshedAll) {
            // await this.db.kioskTimeZones.where("favourite").equals(0).count()
            let maxVersion = 0
            const favourites = (await this.getFavouriteTimeZones()).filter(t => t.favourite).map(t => t.id);

            if (!forceReload) {
                try {
                    maxVersion = (await this.db.kioskTimeZones.where("favourite").equals(0).reverse().sortBy("version"))[0].version
                    console.log(`max version was ${maxVersion}`)
                } catch {}
            }

            const json = await this.fetchAllTimeZones(maxVersion);

            if (json.length > 0) {
                this.db.kioskTimeZones.where("version").aboveOrEqual(maxVersion).delete()
                allTimeZones = json.map((tz: ApiResultKioskTimeZone) => {
                    return {
                        id: tz.id, tz_IANA: tz.tz_IANA,
                        tz_long: tz.tz_long,
                        deprecated: tz.deprecated ? 1 : 0,
                        version: tz.version,
                        favourite: favourites.includes(tz.id) ? 1 : 0,
                    } as TimeZone;
                }) as Array<TimeZone>;
                await this.db.kioskTimeZones.bulkAdd(allTimeZones)
                this.hasRefreshedAll = true
            }
        }
        return allTimeZones;
    }
}