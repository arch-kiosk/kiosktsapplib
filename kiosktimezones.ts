import { FetchException, KioskApi } from "./kioskapi";
import Dexie, { EntityTable } from "dexie";

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
    private apiContext: KioskApi | undefined = undefined
    private db: KioskTimeZoneDb | undefined = undefined
    private hasRefreshedFavourites: boolean = false
    private hasRefreshedAll: boolean = false
    private localCache: Map<number, TimeZone> = new Map()

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

    public getLocalCache() {
        return this.localCache
    }

    public async getFavouriteTimeZones(includeDeprecated = false, refreshAfterwards=false): Promise<Array<TimeZone>> {
        if (this.db) {
            const c = await this.db.kioskTimeZones.count()
            let favourites: Array<TimeZone>
            if (c == 0) {
                await this.refreshFavourites()
            }
            if (!includeDeprecated) {
                favourites = await this.db.kioskTimeZones.where({ "deprecated": 0, "favourite": 1 }).toArray()
            } else {
                favourites = await this.db.kioskTimeZones.where({ "favourite": 1 }).toArray()
            }
            if (refreshAfterwards) {
                this.refreshFavourites().finally(() => {
                    console.log("refreshed favourites")
                })
            }
            return (favourites)
        } else return []
    }

    private async refreshFavourites () {
        if (!this.db) return []
        if (!this.hasRefreshedFavourites) {
            const json = await this.fetchFavouriteTimeZones()
            if (json && json.length > 0) {
                let cDeleted = await this.db?.kioskTimeZones.where("favourite").equals(1).delete()
                console.log(`Deleted ${cDeleted} favourite time zones`)
                const timeZones: Array<TimeZone> = json.map((tz:ApiResultKioskTimeZone) => {
                    return {
                        id: tz.id, tz_IANA: tz.tz_IANA,
                        tz_long: tz.tz_long,
                        deprecated: tz.deprecated?1:0,
                        version: tz.version,
                        favourite: 1 } as TimeZone
                }) as Array<TimeZone>
                try {
                    let c = await this.db?.kioskTimeZones.bulkAdd(timeZones)
                    console.log(`Added ${c} new favourite time zones`)
                } catch (e) {
                    console.error(`KioskTimeZones.refreshFavourites: Error when bulk adding time zones ${e}`)
                }
                this.hasRefreshedFavourites = true
                return timeZones
            }
        }
        return [] as Array<TimeZone>
    }

    async fetchFavouriteTimeZones() {
        return await this.apiContext?.fetchFromApi(
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
        return await this.apiContext?.fetchFromApi(
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
        await this.refreshAllTimeZones(forceReload);
        let allTimeZones = await this.db?.kioskTimeZones.toArray()
        return allTimeZones?.filter(tz => tz.deprecated == 0 || deprecated)
    }

    async getTimeZoneByIndex(tzIndex: number, forceReload = false) {
        if (!this.db) return
        await this.refreshAllTimeZones(forceReload);
        let results = (await this.db.kioskTimeZones.where("id").equals(tzIndex).toArray())
        return results.length>0?results[0]:undefined
    }

    /**
     * Asynchronously caches the time zone information locally based on the provided timezone index.
     * Locally cached time zone information can be retrieved synchronously using getTimeZoneInfoFromLocalCache
     * @param tzIndex a Kiosk Time Zone Index
     * @param tryRefresh Flag indicating whether to refresh the timezone information if not found in the cache.
     * @returns A Promise that resolves to the cached TimeZone object if found, otherwise undefined.
     */
    async cacheLocally(tzIndex: number | undefined | string, tryRefresh = false): Promise<undefined | TimeZone> {
        if (!this.db) return undefined
        if (typeof tzIndex !== "number") return undefined

        let tzInfo: TimeZone | undefined = this.localCache.get(tzIndex)
        if (tzInfo) return tzInfo

        tzInfo = await this.getTimeZoneByIndex(tzIndex)
        if (!tzInfo) {
            if (!tryRefresh) return undefined
            await this.refreshAllTimeZones(false);
            tzInfo = await this.getTimeZoneByIndex(tzIndex)
        }
        if (tzInfo) {
            console.log("Cached TimeZone", tzInfo)
            this.localCache.set(tzIndex, tzInfo)
        }
        return this.localCache.get(tzIndex)
    }

    /**
     * Retrieves timezone information from the local cache based on the provided timezone index.
     * Unlike other methods this is synchronous.
     * @param tzIndex - The index of the timezone to retrieve information for.
     * @returns a TimeZone instance if found in the local cache, otherwise undefined.
     */
    public getTimeZoneInfoFromLocalCache(tzIndex: number | undefined | string): undefined | TimeZone {
        if (typeof tzIndex === "string") tzIndex = parseInt(tzIndex)
        if (!tzIndex) return
        return this.localCache.get(tzIndex)
    }

    private async refreshAllTimeZones(forceReload: boolean) {
        let allTimeZones: Array<TimeZone> = []
        if (!this.db) return
        if (forceReload || !this.hasRefreshedAll) {
            // await this.db.kioskTimeZones.where("favourite").equals(0).count()
            let maxVersion = 0
            const favourites = (await this.getFavouriteTimeZones()).filter(t => t.favourite == 1).map(t => t.id);

            if (!forceReload) {
                try {
                    maxVersion = (await this.db.kioskTimeZones.where("favourite").equals(0).reverse().sortBy("version"))[0].version
                    console.log(`max version was ${maxVersion}`)
                } catch {}
            }

            const json = await this.fetchAllTimeZones(maxVersion);

            if (json && json.length > 0) {
                let c = await this.db.kioskTimeZones.where("version").above(maxVersion).delete()
                console.log(`delete ${c} time zones above version ${maxVersion}`)
                allTimeZones = json.map((tz: ApiResultKioskTimeZone) => {
                    return {
                        id: tz.id, tz_IANA: tz.tz_IANA,
                        tz_long: tz.tz_long,
                        deprecated: tz.deprecated ? 1 : 0,
                        version: tz.version,
                        favourite: favourites.includes(tz.id) ? 1 : 0,
                    } as TimeZone;
                }) as Array<TimeZone>;
                try {
                    c = await this.db.kioskTimeZones.bulkAdd(allTimeZones)
                    console.log(`added ${c} new time zones `)
                } catch (e) {
                    console.error(`KioskTimeZones.refreshAllTimeZones: Error when bulk adding time zones ${e}`)
                }
            }
            this.hasRefreshedAll = true
        }
    }
}