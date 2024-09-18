//@ts-ignore
import {FetchException} from "../../../../../static/scripts/kioskapputils.js"
//@ts-ignore
import {MessageData, MSG_NETWORK_ERROR, MSG_LOGGED_OUT, sendMessage} from "./appmessaging"
import {LitElement} from "lit-element";
import {DateTime} from "luxon"
import { AnyDict, Constant } from "./generaltypes";

export const JOB_STATUS_GHOST = 0;
export const JOB_STATUS_REGISTERED = 1;
export const JOB_STATUS_SUSPENDED = 5;
export const JOB_STATUS_STARTED = 8;
export const JOB_STATUS_RUNNING = 10;
export const JOB_STATUS_CANCELLING = 15;
export const JOB_STATUS_DONE = 20;
export const JOB_STATUS_CANCELED = 21;
export const JOB_STATUS_ABORTED = 22;


export function log(obj: any) {
    // @ts-ignore
    if (import.meta.env.VITE_MODE == 'DEVELOPMENT') console.log(obj)
}

export function getSqlDate(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${year}-${month}-${day}`
}

export function fromSqlDate(date: string): Date {
    const parts = date.split("-")
    return new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]))
}

export function getRecordTypeNames(constants: Array<Constant>): {[key:string]: string} {
    let result: {[key:string]: string} = {}

    for (let i=0;i<constants.length;i++) {
        let constant = constants[i]
        try {
            if (constant["path"] === "file_repository/recording_context_aliases") {
                result[constant.key] = constant.value
            }
        } catch (e) {
            console.log(e)
            console.log(constant)
        }
    }

    return result
}

export function getRecordTypeAliases(constants: Constant[]) {
    let recordTypeAliases: AnyDict = { }
    for (const constant of constants) {
        if (constant.path === "glossary") {
            let v  = constant.value
            if (Array.isArray(v)) v = v[0]
            recordTypeAliases[constant.key] = v
        }
    }
    return recordTypeAliases
}

export function recordType2Name(recordTypeNames: {[key:string]: string}, recordType: string): string {
    if (recordTypeNames && recordType in recordTypeNames) {
        return recordTypeNames[recordType]
    } else return recordType.replace("_", " ")}

export function name2RecordType(recordTypeNames: {[key:string]: string}, name: string): string {
    if (recordTypeNames) {
        const recordTypes = Object.keys(recordTypeNames)
        for (let i = 0; i < recordTypes.length; i++) {
            if (recordTypeNames[recordTypes[i]] === name) return recordTypes[i]
        }
    }
    return ""
}

export function handleCommonFetchErrors(handlerInstance: LitElement,
                                        e: FetchException, messagePrefix="",
                                        onUnhandledError: CallableFunction|null=null) {
    if (messagePrefix) messagePrefix += ": "
    if (e.response) {
        if (e.response.status == 403 || e.response.status == 401) {
            sendMessage(handlerInstance, MSG_NETWORK_ERROR,
                `${messagePrefix}You are not logged in properly or your session has timed out`,
                `<a href="/logout">Please log in again.</a>`)
            return
        }

        if (onUnhandledError) {
            onUnhandledError(e)
        } else {
            sendMessage(handlerInstance, MSG_NETWORK_ERROR,
                `${messagePrefix}Kiosk server responded with an error.`, `(${e.msg}). 
                The server might be down or perhaps you are not logged in properly.`)
        }

    } else {
        sendMessage(handlerInstance, MSG_NETWORK_ERROR,
            `${messagePrefix}Kiosk server responded with a network error.`,`(${e}). 
            The server might be down or perhaps you are not logged in properly.`)
        return
    }
}

export function gotoPage(href: string) : void {

    // @ts-ignore
    if (import.meta.env.VITE_MODE == 'DEVELOPMENT') {
        href = "http://localhost:5000" + href
    }
    window.location.href = href
}

/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://stackoverflow.com/a/22429679/11150752 (CC BY-SA 4.0)
 * Ref 1: https://gist.github.com/vaiorabbit/5657561
 * Ref 2: http://isthe.com/chongo/tech/comp/fnv/
 *
 */
export function fowlerNollVo1aHashModern(str: string, offset = 0x811c9dc5, prime = 0x01000193): number {
    let hashValue = offset

    for (let i = 0; i < str.length; i++) {
        hashValue ^= str.charCodeAt(i)
        hashValue = Math.imul(hashValue, prime)
    }

    return hashValue >>> 0
}

export function safeLocaleCompare(d1: string|undefined, d2: string|undefined) {
    if (!d1 && d2) return 1
    if (d1 && !d2) return -1
    if (!d1 && !d2) return 0
    return String(d1).localeCompare(String(d2))
}
export function compareISODateTime(d1: string|undefined, d2: string|undefined): number {
    if (!d1 && d2) return (1)
    if (d1 && !d2) return (-1)
    if (!d1 && !d2) return (0)

    if (d1 && d2) {
        const ld1 = DateTime.fromISO(d1)
        const ld2 = DateTime.fromISO(d2)

        if (ld1 < ld2)
            return -1
        if (ld1 > ld2)
            return 1
    }

    return 0



}

export function FMDictToDict(FMDict: string): AnyDict | undefined {
    const lines = FMDict.split("\r")
    const rc: {[key: string]: string} = {}
    let key, value: string
    for (const line of lines) {
        [key, value] = line.split("=")
        if (key && value) {
            rc[key] = value
        } else {
            return undefined
        }
    }
    return rc
}

export function getLatinDate(dt: DateTime, withTime: boolean = true): string {
    const latinMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
    const dtStr = `${dt.day}.${latinMonths[dt.month-1]}.${dt.year}`
    return withTime?dtStr + " " + dt.toLocaleString(DateTime.TIME_SIMPLE):dtStr
}
