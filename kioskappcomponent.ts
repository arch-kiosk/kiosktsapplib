// import { html, css, LitElement } from '/node_modules/lit';
import { html, LitElement, TemplateResult } from "lit";
import { API_STATE_ERROR, API_STATE_READY } from "./kioskapi";
import { state, property } from "lit/decorators.js";

export type BeforeEventDetail = {
    component: KioskAppComponent
    _defer: boolean,
    defer: (e: BeforeEvent)=> {
        cancel: () => void,
        finish: () => void
    }
}

export interface BeforeEvent extends CustomEvent {
    detail: BeforeEventDetail
}

export abstract class KioskAppComponent extends LitElement {

    apiContext: any;

    static properties = {
        /**
         * The Api Context
         */
        apiContext: { type: Object },
    };

    @state()
    protected showProgress: boolean = false

    @property()
    kioskBaseUrl = "";

    protected constructor() {
        super();
        this.apiContext = undefined;
    }

    updated(_changedProperties: any) {
        if (_changedProperties.has("apiContext")) {
            this.showProgress = false;
            // if (this.apiContext && this.apiContext.status === API_STATE_ERROR) {
            //     this.addAppError("Cannot connect to Kiosk API.");
            // }
        }
    }
    abstract apiRender(): TemplateResult;

    /**
     * dispatches a BeforeEvent and coordinates calling cancelCallback and finishCallback either synchronously or asynchronously, if the
     * consumer of the event used .defer on the event object.
     *
     * The dispatched BeforeEvent has a method "defer" which returns a deferrance object that itself has methods finish and cancel.
     * One of those must be called to complete the event asynchronously.
     *
     * example for an emitter:
     *   tryClose() {
     *       if (!this.emitBeforeEvent("beforeClose", {},
     *           () => {
     *               this.closeDeferred = false
     *           },
     *           () => {
     *               this.open = false
     *           })
     *       ) this.closeDeferred = true
     * }
     *
     * example for an async consumer:
     *   beforeCloseLightbox(e: BeforeEvent) {
     *       const defObj = e.detail.defer(e)
     *       setTimeout(()=>defObj.finish(),1000)
     *   }
     *
     * example for a sync consumer that let's the event succeed:
     *   beforeCloseLightbox(e: BeforeEvent) {
     *       e.stopPropagation()
     *   }
     *
     *  example for a sync consumer that cancels the event:
     *   beforeCloseLightbox(e: BeforeEvent) {
     *       e.stopPropagation()
     *       e.preventDefault()
     *   }
     *
     * @param eventName Name a consumer can listen to
     * @param detail additional data to send to the consumer
     * @param cancelCallback the code to run in case the event gets cancelled (either synchronously or asynchronously)
     * @param finishCallback the code to run in case the event's default behaviour may proceed (either synchronously or asynchronously)
     * @returns false if the consumer of the event asked to defer the result of the event,
     *              otherwise true (in which case the default behaviour will run synchronously)
     */
    public emitBeforeEvent(eventName: string, detail: object, cancelCallback: ()=>void, finishCallback: ()=>void): boolean {
        const component = this
        let beforeEventDetail: BeforeEventDetail = {
            // some this math is going on in here: here this points to the beforeEventDetail object. That's why the component's this needed saving
            component: component,
            _defer: false,
            defer: function (e: CustomEvent | undefined = undefined) {
                // as we are in an object literal's function here "this" points to the beforeEventDetail object.
                this._defer = true;
                if (e) {
                    e.stopPropagation()
                    e.preventDefault()
                }
                return {
                    cancel: () =>{
                        // as we are in am arrow function here "this" keeps pointing to the beforeEventDetail object.
                        this.component.updateComplete.then(() => {
                            cancelCallback()
                        })
                    },
                    finish: () =>{
                        // as we are in an arrow function here "this" keeps pointing to the beforeEventDetail object.
                        this.component.updateComplete.then(() => {
                            finishCallback()
                        })
                    }
                }
            },
        }
        Object.assign(beforeEventDetail, detail)

        const event: BeforeEvent = new CustomEvent(eventName, {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: beforeEventDetail,
        })

        if (!this.dispatchEvent(event)) {
            if (beforeEventDetail._defer) {
                return false;
            } else {
                cancelCallback()
            }
        } else {
            finishCallback()
        }
        return true;
    }

    render() {
        let renderedHtml;
        if (this.apiContext && this.apiContext.status === API_STATE_READY) {
            renderedHtml = this.apiRender();
        } else {
            if (this.apiContext && this.apiContext.status === API_STATE_ERROR) renderedHtml = this.renderApiError();
            else renderedHtml = this.renderNoContextYet();
        }
        // noinspection HtmlUnknownTarget
        return html`
            <link rel="stylesheet" href="${this.kioskBaseUrl}static/styles.css" />
            ${renderedHtml}
        `;
    }

    renderNoContextYet(): TemplateResult {
        // noinspection HtmlUnknownTarget
        return html` <link rel="stylesheet" href="${this.kioskBaseUrl}static/styles.css" /> `;
    }
    renderApiError(): TemplateResult|undefined {
        return undefined;
    }

    renderProgress(force = false): TemplateResult |undefined{
        if (force || this.showProgress)
            return html` <div class="loading">
                <div class="loading-progress"></div>
            </div>`;
        else return undefined;
    }

}
