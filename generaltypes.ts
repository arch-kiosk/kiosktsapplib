export type AnyDict = {
    [key: string]: any
}

export class Constant {
    path : string
    key: string
    value: string
}

export type ApiResultContextsFull={
    identifiers: Array<ApiResultContextsFullIdentifierInformation>
}

export type ApiResultContextsFullIdentifierInformation={
    field: string
    record_type: string
    identifier: string
}
