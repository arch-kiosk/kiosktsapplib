import {LitElement} from 'lit-element';

export const MSG_SEVERITY_CRITICAL = 10
export const MSG_SEVERITY_ERROR = 5
export const MSG_SEVERITY_WARNING = 5
export const MSG_SEVERITY_INFO = 0
export const MSG_SEVERITY_DEBUG = -10

export const MSG_LOGGED_OUT = "MSG_LOGGED_OUT"
export const MSG_NETWORK_ERROR = "MSG_NETWORK_ERROR"

class MESSAGE_DETAIL {
    severity: number

    constructor(severity: number) {
        this.severity = severity
    }
}

let MESSAGE_ID_DETAILS: { [key: string]: MESSAGE_DETAIL } = {
    "MSG_LOGGED_OUT": {
        "severity": 10
    },
    "MSG_NETWORK_ERROR": {
        "severity": 10
    },
}

export class MessageData {
    messageId: string
    headline: string
    body: string

    constructor(messageId: string, headline: string, body: string = "") {
        this.messageId = messageId
        this.headline = headline
        this.body = body
    }
}

export function sendMessage(senderInstance: LitElement, messageId: string, headline: string, body: string = "") {
    let messageData = new MessageData(
        messageId,
        headline,
        body)

    senderInstance.dispatchEvent(new CustomEvent("send-message",
        {bubbles: true, composed: true, detail: messageData}));
}

export function deleteMessage(messageList: { [key: string]: object }, messageId: string) {
    // console.log(`deleting message ${messageId}`)
    if (messageId in messageList) {
        delete messageList[messageId]
    }
}