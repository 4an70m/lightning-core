({

    core: function (cmp) {

        const component = cmp;

        /**
         * Class for checking runtime environment.
         * Current implementations relays on if global toast event is supported.
         */
        class Environment {

            constructor() {
                //currently there's no better way to find out the runtime environment
                this.environment = $A.util.isUndefinedOrNull($A.get("e.force:showToast")) ? "App" : "Lightning";
            }

            isApp() {
                return this.environment === "App";
            }

            isLightning() {
                return this.environment === "Lightning";
            }
        }

        /* classes for creating toasts */
        class Toast {

            constructor(params) {
                this.params = params;
            }

            static isGlobalShowToastSupported() {
                return new Environment().isLightning();
            }

            fire() {
                if (Toast.isGlobalShowToastSupported()) {
                    const toastEvent = $A.get("e.force:showToast");
                    toastEvent.setParams(this.params);
                    toastEvent.fire();
                } else {
                    console.error("Core:\ne.force:showToast is not supported in this environment\n");
                }
            }
        }

        class ToastQuick extends Toast {

            constructor(type, title, message) {
                super({
                    "type": type,
                    "title": title,
                    "message": message,
                    "mode": "dismissible",
                    "duration": 4000
                });
            }
        }

        class ToastLong extends Toast {

            constructor(type, title, message) {
                super({
                    "type": type,
                    "title": title,
                    "message": message,
                    "mode": "dismissible",
                    "duration": 8000
                });
            }
        }

        class ToastQuickSuccess extends ToastQuick {

            constructor(message) {
                super(
                    "success",
                    "Success!",
                    message
                );
            }
        }

        class ToastQuickError extends ToastQuick {

            constructor(message) {
                super(
                    "error",
                    "Something went wrong!",
                    message
                );
            }
        }

        class ToastLongSuccess extends ToastLong {

            constructor(message) {
                super(
                    "success",
                    "Success!",
                    message
                );
            }
        }

        class ToastLongError extends ToastLong {

            constructor(message) {
                super(
                    "error",
                    "Something went wrong!",
                    message
                );
            }
        }

        /* classes for server interactions */
        class ServerAction {

            constructor(component, action, params) {
                this.action = ServerAction.getAction(component, action, params);
            }

            /* Override these messages with labels, if you support multiple languages */
            static get messageUndefinedResponse() {
                return "Undefined response";
            }

            static get messageUnknownError() {
                return "Unknown error";
            }

            static get messageIncompleteAction() {
                return "No response from server or client is offline";
            }

            static get messageUnexpectedError() {
                return "Unexpected error";
            }

            static getAction(cmp, actionName, params) {
                if (actionName.indexOf("c.") <= -1) {
                    actionName = "c." + actionName;
                }
                let action = null;

                try {
                    action = cmp.get(actionName);
                } catch(error) {
                    console.error(`\nCore:\n${actionName} is invalid action.\n + ${error}`);
                    return action;
                }

                if (!$A.util.isUndefinedOrNull(params)) {
                    action.setParams(params);
                }
                return action;
            }

            addParam(name, param) {
                if (this.params) {
                    this.params = {};
                }
                this.params[name] = param;
            }

            removeParam(name) {
                delete this.params[name];
            }

            execute() {
                return new LightningAction((context, success, error) => {
                    this.action.setCallback(this, result => {
                        let state = result.getState();
                        if (state === "SUCCESS") {
                            success(context, result.getReturnValue());
                        } else {
                            error(context, result);
                        }
                    });
                    $A.enqueueAction(this.action);
                });
            }

            static parseResponseMessage(response) {
                if ($A.util.isUndefinedOrNull(response)) {
                    return ServerAction.messageUndefinedResponse;
                }

                if (typeof response === "string") {
                    return response;
                }

                if (response.message) {
                    return response.message;
                }

                if (response.getState) {
                    const state = response.getState();
                    let message = ServerAction.messageUnknownError;
                    if (state === "ERROR") {
                        let errors = response.getError();
                        if (errors && errors[0] && errors[0].message) {
                            message = errors[0].message;
                        }
                    } else if (state === "INCOMPLETE") {
                        message = ServerAction.messageIncompleteAction;
                    }
                    return message;
                }
                return ServerAction.messageUnexpectedError;
            }
        }

        class ServerActionHandled extends ServerAction {
            constructor(component, action, params) {
                super(component, action, params);
            }

            execute() {
                return new LightningAction((context, success, error) => {
                    this.action.setCallback(this, result => {
                        let state = result.getState();
                        if (state === "SUCCESS") {
                            success(context, result.getReturnValue());
                        } else {
                            new ToastLongError(ServerAction.parseResponseMessage(result));
                            error(context, result);
                        }
                    });
                    $A.enqueueAction(this.action);
                });
            }
        }

        class ServerActionPromise extends ServerAction {

            constructor(component, action, params) {
                super(component, action, params);
            }

            execute() {
                return new LightningPromise((resolve, reject) => {
                    this.action.setCallback(this, result => {
                        let state = result.getState();
                        if (state === "SUCCESS") {
                            resolve(result.getReturnValue());
                        } else {
                            reject(result);
                        }
                    });
                    $A.enqueueAction(this.action);
                });
            }
        }

        class ServerActionPromiseHandled extends ServerAction {

            constructor(component, action, params) {
                super(component, action, params);
            }

            execute() {
                new LightningPromise((resolve, reject) => {
                    this.action.setCallback(this, result => {
                        let state = result.getState();
                        if (state === "SUCCESS") {
                            resolve(result.getReturnValue());
                        } else {
                            new ToastLongError(ServerAction.parseResponseMessage(result)).fire();
                            reject(result);
                        }
                    });
                    $A.enqueueAction(this.action);
                });
            }
        }

        class LightningAction {

            constructor(action) {
                this.action = action;
                this._resolve();
            }

            then(onSuccess) {
                this.onSuccess = onSuccess;
                return this;
            }

            catch(onError) {
                this.onError = onError;
                return this;
            }

            finally(onFinally) {
                this.onFinally = onFinally;
                return this;
            }

            _success(self, result) {
                try {
                    if (self.onSuccess) {
                        self.onSuccess(result);
                    }
                    if (self.onFinally) {
                        self.onFinally();
                    }
                } catch (e) {
                    self._error(self, e);
                }
            }

            _error(self, error) {
                if (self.onError) {
                    self.onError(error);
                } else {
                    console.error(`Core:\nUnhandled error in Lightning Action: ${error}\n`);
                }
                if (self.onFinally) {
                    self.onFinally();
                }
            }
            
            _resolve() {
                const self = this;
                window.setTimeout($A.getCallback(() => {
                    this.action(self, this._success, this._error);
                }, 0));
            }
        }

        class LightningPromise extends Promise {

            constructor(fn) {
                super($A.getCallback(fn));
            }

            then(onSuccess, onError) {
                return super.then(
                    (onSuccess ? $A.getCallback(onSuccess) : undefined),
                    (onError ? $A.getCallback(onError) : undefined)
                );
            }

            catch(onError) {
                return super.catch(
                    onError ? $A.getCallback(onError) : undefined
                );
            }

            finally(onFinally) {
                return super.finally(
                    onFinally ? $A.getCallback(onFinally) : undefined
                );
            }
        }

        /* classes for component creation*/
        class Component {

            constructor(name, params = {}) {
                this.name = name;
                this.params = params;
            }

            addParam(name, value) {
                this.params[name] = value;
                return this;
            }

            toParams() {
                return [
                    this.name,
                    this.params
                ];
            }

            create() {
                return new LightningPromise((resolve, reject) => {
                    $A.createComponent(this.name, this.params, (components, status, errorMessage) => {
                        if (status === "SUCCESS") {
                            resolve(components);
                        } else {
                            reject(errorMessage, status);
                        }
                    });
                });
            }
        }

        class Components {

            constructor() {
                this.components = [];
            }

            addComponent(component) {
                if (component instanceof Component) {
                    this.components.push(component);
                }
                return this;
            }

            create() {
                if (this.components.length === 0) {
                    return;
                }
                const params = this.components.map((component) => {
                    return component.toParams();
                });
                return new LightningPromise((resolve, reject) => {
                    $A.createComponents(params, (components, status, errorMessage) => {
                        if (status === "SUCCESS") {
                            resolve(components);
                        } else {
                            reject(errorMessage, status);
                        }
                    });
                });
            }
        }

        /* classes for working with files */
        class File {

            constructor(fileData) {
                this.fileData = fileData;
            }

            toBase64() {
                return new LightningPromise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(this.fileData);
                    reader.onloadend = (evt) => {
                        const error = evt.target.error;
                        if (!$A.util.isUndefinedOrNull(error)) {
                            reject(error);
                            return;
                        }
                        resolve(evt.target.result);
                    };
                });
            }

            toBlob() {
                let sliceSize = 512;
                let byteCharacters = atob(b64Data);
                let byteArrays = [];
                for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                    let slice = byteCharacters.slice(offset, offset + sliceSize);
                    let byteNumbers = new Array(slice.length);
                    for (var i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }
                    let byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }
                return new Blob(byteArrays, {type: "application/octet-stream"});
            }

            download(fileName) {
                const a = document.createElement("a");
                a.download = fileName;
                a.rel = "noopener";
                a.target = "_blank";

                if (this.fileData instanceof Blob) {
                    this.toBase64().then((data) => {
                        a.href = window.URL.createObjectURL(data);
                        a.click();
                    })
                } else {
                    a.href = window.URL.createObjectURL(this.fileData);
                    a.click();
                }
            }
        }

        /* library class */
        class Library {

            constructor(name) {
                const body = component.get("v.body") || [];
                this.library = body.find((component) => {
                    return component.isInstanceOf(name);
                });
                if (!this.library) {
                    const message = `Core:\nTo use ${this.constructor.name}, please include ${name} component inside c:lightningCore.\n`;
                    console.error(message);
                    throw new Error(message);
                }
            }
        }

        /* classes to work with navigation*/
        class Navigation extends Library {

            constructor() {
                super("lightning:navigation");
            }

            /**
             * Navigation to use with Page References
             */
            navigate(pageReference, preNavigateCallback = null) {
                if (!(pageReference instanceof PageReference)) {
                    const message = `Core:\nnavigate() method should be called with PageReference parameter\n`;
                    console.error(message);
                    throw new Error(message);
                }
                this.library.generateUrl(pageReference.toPageReference())
                    .then($A.getCallback((url) => {
                        if(preNavigateCallback) {
                            url = preNavigateCallback(url);
                        }
                        this.library.navigate(url);
                    }))
                    .catch($A.getCallback((error) => {
                        console.error(`Core:\nUrl generation encountered an error: \n ${error}\n`);
                    }));
            }

            /**
             * @deprecated
             */
            oldNavigateTo(type, params) {
                console.warn(`Core:\nYou are using deprecated api.\nStarting with api v43 it is recommended to use`,
                    "%clightning:navigation",
                    "font-weight: bold",
                    "for navigation."
                );
                const evt = $A.get(type);
                evt.setParams(params);
                evt.fire();
            }

            /**
             * This event enables you to navigate from one Lightning component to another.
             * @deprecated
             */
            oldNavigateToComponent(componentDef, componentAttributes = {}) {
                this.oldNavigateTo("e.force:navigateToComponent", {
                    "componentDef": componentDef,
                    "componentAttributes": componentAttributes
                });
            }

            /**
             * This event enables you to navigate to the list view specified by listViewId.
             * @deprecated
             */
            oldNavigateToList(componentDef, listViewId, listViewName = null, scope) {
                this.oldNavigateTo("e.force:navigateToList", {
                    "listViewId": listViewId,
                    "listViewName": null,
                    "scope": scope
                });
            }

            /**
             * This event enables you to navigate to the object home specified by the scope attribute.
             * @deprecated
             */
            oldNavigateToObjectHome(scope) {
                this.oldNavigateTo("e.force:navigateToObjectHome", {
                    "scope": scope
                })
            }

            /**
             * This event enables you to navigate to the related list specified by parentRecordId.
             * @deprecated
             */
            oldNavigateToRelatedList(relatedListId, parentRecordId) {
                this.oldNavigateTo("e.force:navigateToRelatedList", {
                    "relatedListId": relatedListId,
                    "parentRecordId": parentRecordId
                })
            }

            /**
             * This event enables you to navigate to an sObject record specified by recordId.
             * @deprecated
             */
            oldNavigateToSObject(recordId, slideDevName) {
                this.oldNavigateTo("e.force:navigateToSObject", {
                    "recordId": recordId,
                    "slideDevName": slideDevName
                })
            }

            /**
             * Relative and absolute URLs are supported. Relative URLs are relative to the Salesforce mobile web domain, and retain navigation history. External URLs open in a separate browser window.
             * @deprecated
             */
            oldNavigateToUrl(url) {
                this.oldNavigateTo("e.force:navigateToURL", {
                    "url": url,
                })
            }
        }

        /**
         * Base page reference without state attribute
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm">doc</a>
         */
        class PageReference {

            constructor() {
                this.attributes = {};
            }

            setType(type) {
                this.type = type;
                return this;
            }

            setAttributes(attributes) {
                this.attributes = attributes;
                return this;
            }

            addAttribute(name, value) {
                this.attributes[name] = value;
                return this;
            }

            removeAttribute(name) {
                delete this.attributes[name];
                return this;
            }

            toPageReference() {
                const preparedPageReference = {};
                if (this.type) {
                    preparedPageReference.type = this.type;
                }
                preparedPageReference.attributes = this.attributes;
                if (this.state) {
                    preparedPageReference.state = this.state;
                }
                return preparedPageReference;
            }
        }

        /**
         * Base page reference with state attribute
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm">doc</a>
         */
        class StatefulPageReference extends PageReference {

            constructor() {
                super();
                this.state = {};
            }

            setState(state) {
                this.state = state;
                return this;
            }

            addState(name, value) {
                this.state[name] = value;
                return this;
            }

            removeState(name) {
                delete this.state[name];
                return this;
            }
        }

        /**
         * A Lightning component that implements the lightning:isUrlAddressable interface, which enables the component to be navigated directly via URL.
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm#lightning_component">doc</a>
         */
        class PageReferenceStandardComponent extends StatefulPageReference {

            constructor(componentName) {
                super();
                this.setType("standard__component");
                this.addAttribute("componentName", componentName);
            }
        }

        /**
         * An authentication for a community.
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm#section_rh1_gqg_phb">
         */
        class PageReferenceCommLoginPage extends PageReference {

            constructor(action = "login") {
                super();
                this.setType("comm__loginPage");
                this.addAttribute("actionName", action);
            }

            setActionLogin() {
                return this.addAttribute("actionName", "login");
            }

            setActionLogout() {
                return this.addAttribute("actionName", "logout");
            }
        }

        /**
         * A page that interacts with a Knowledge Article record.
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm#knowledge_article">
         */
        class PageReferenceKnowledgeArticlePage extends PageReference {

            constructor() {
                super();
                this.setType("standard__knowledgeArticlePage");
            }

            setArticleType(articleType) {
                return this.addAttribute("articleType", articleType);
            }

            setUrlName(urlName) {
                return this.addAttribute("urlName", urlName);
            }
        }

        /**
         * A standard page with a unique name. If an error occurs, the error view loads and the URL isn’t updated.
         * Types: standard__namedPage, comm__namedPage
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm#named_page">
         */
        class PageReferenceNamedPage extends PageReference {

            constructor(pageType = "standard__namedPage") {
                super();
                this.setPageName(pageType);
            }

            setPageName(pageName) {
                return this.addAttribute("pageName", pageName);
            }
        }

        /**
         * A page that displays the content mapped to a CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs are supported.
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm#navigation_item">
         */
        class PageReferenceNavItemPage extends PageReference {

            constructor() {
                super();
                this.setType("standard__navItemPage");
            }

            setApiName(apiName) {
                return this.addAttribute("apiName", apiName);
            }
        }

        /**
         * A page that interacts with a standard or custom object in the org and supports standard actions for that object.
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm#object">
         */
        class PageReferenceObjectPage extends StatefulPageReference {

            constructor() {
                super();
                this.setType("standard__objectPage");
            }

            setObjectApiName(objectApiName) {
                return this.addAttribute("objectApiName", objectApiName);
            }

            setActionName(actionName) {
                return this.addAttribute("actionName", actionName);
            }

            setFilterName(filterName) {
                return this.addState("filterName", filterName);
            }
        }

        /**
         * A page that interacts with a record in the org and supports standard actions for that record.
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm#record">
         */
        class PageReferenceRecordPage extends PageReference {

            constructor() {
                super();
                this.setType("standard__recordPage");
            }

            setActionName(actionName) {
                return this.addAttribute("actionName", actionName);
            }

            setObjectApiName(objectApiName) {
                return this.addAttribute("objectApiName", objectApiName);
            }

            setRecordId(recordId) {
                return this.addAttribute("recordId", recordId);
            }
        }

        /**
         * A page that interacts with a relationship on a particular record in the org. Only related lists are supported.
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm#record_relationship">
         */
        class PageReferenceRecordRelationshipPage extends PageReference {

            constructor() {
                super();
                this.setType("standard__recordRelationshipPage");
            }

            setRecordId(recordId) {
                return this.addAttribute("recordId", recordId);
            }

            setObjectApiName(objectApiName) {
                return this.addAttribute("objectApiName", objectApiName);
            }

            setRelationshipApiName(relationshipApiName) {
                return this.addAttribute("relationshipApiName", relationshipApiName);
            }

            setActionName(actionName) {
                return this.addAttribute("actionName", actionName);
            }
        }

        /**
         * An external URL.
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm#webpage">
         */
        class PageReferenceWebPage extends PageReference {

            constructor() {
                super();
                this.setType("standard__webPage");
            }

            setUrl(url) {
                return this.addAttribute("url", url);
            }
        }

        /* classes to work with notice */
        class Notice extends Library {

            constructor(params = {}) {
                super("lightning:notificationsLibrary");
                this.params = params;
            }

            setParams(params = {}) {
                this.params = params;
                return this;
            }

            setHeader(header) {
                this.params.header = header;
                return this;
            }

            setTitle(title) {
                this.params.title = title;
                return this;
            }

            setMessage(message) {
                this.params.message = message;
                return this;
            }

            setVariant(variant) {
                this.params.variant = variant;
                return this;
            }

            setCallback(closeCallback) {
                this.params.closeCallback = closeCallback;
                return this;
            }

            show() {
                try {
                    if (new Environment().isApp()) {
                        throw new Error("lightning:notificationsLibrary is not supported in App");
                    }
                    this.library.showNotice(this.params);
                } catch (e) {
                    console.error(`Core:\nRunning lightning:notificationsLibrary -> showNotice() raised an exception:\n${e}`)
                }
            }
        }

        class ToastX extends Library {

            constructor(params) {
                super("lightning:notificationsLibrary");
                this.params = params;
            }

            fire() {
                try {
                    if (new Environment().isApp()) {
                        throw new Error("lightning:notificationsLibrary is not supported in App");
                    }
                    this.library.showToast(this.params);
                } catch (e) {
                    console.error(`Core:\nRunning lightning:notificationsLibrary -> showToast() raised an exception:\n${e}`)
                }
            }
        }

        class ToastXQuick extends ToastX {

            constructor(type, title, message) {
                super({
                    "variant": type,
                    "title": title,
                    "message": message,
                    "mode": "dismissible",
                    "duration": 4000
                });
            }
        }

        class ToastXLong extends ToastX {

            constructor(type, title, message) {
                super({
                    "type": type,
                    "title": title,
                    "message": message,
                    "mode": "dismissible",
                    "duration": 8000
                });
            }
        }

        class ToastXQuickSuccess extends ToastXQuick {

            constructor(message) {
                super(
                    "success",
                    "Success!",
                    message
                );
            }
        }

        class ToastXQuickError extends ToastXQuick {

            constructor(message) {
                super(
                    "error",
                    "Something went wrong!",
                    message
                );
            }
        }

        class ToastXLongSuccess extends ToastXLong {

            constructor(message) {
                super(
                    "success",
                    "Success!",
                    message
                );
            }
        }

        class ToastXLongError extends ToastXLong {

            constructor(message) {
                super(
                    "error",
                    "Something went wrong!",
                    message
                );
            }
        }

        /* overlay library modal */
        class Modal extends Library {

            constructor(body = null, footer = null) {
                super("lightning:overlayLibrary");
                this.setBody(body);
                this.setFooter(footer);
            }

            setBody(body = null) {
                this._checkAttribute(body);
                this.body = body;
                return this;
            }

            setFooter(footer = null) {
                this._checkAttribute(footer);
                this.footer = footer;
                return this;
            }

            setHeader(header = "") {
                this.header = header;
                return this;
            }

            setShowCloseButton(showCloseButton = true) {
                this.showCloseButton = showCloseButton;
                return this;
            }

            setCssClass(cssClass = "") {
                this.cssClass = cssClass;
                return this;
            }

            setCloseCallback(closeCallback) {
                this.closeCallback = closeCallback;
                return this;
            }

            show() {
                if (new Environment().isApp()) {
                    throw new Error(`Core:\nlightning:overlayLibrary is not supported in App`);
                }
                const components = new Components();
                if (this.body !== null) {
                    components.addComponent(this.body);
                }
                if (this.footer !== null) {
                    components.addComponent(this.footer);
                }

                return new LightningPromise((resolve, reject) => {
                    components.create()
                        .then((components) => {
                            let body = null;
                            let footer = null;
                            if(components.length === 1) {
                                body = components[0];
                            }
                            if (components.length === 2) {
                                footer = components[1];
                            }
                            try {
                                resolve(this.library.showCustomModal(this.toParams(body, footer)));
                            } catch (e) {
                                console.error(`Core:\nRunning lightning:overlayLibrary -> showCustomModal() raised an exception:\n${e}`)
                                reject(e)
                            }
                        })
                        .catch((error) => {
                            console.error(`Core:\nCreating component(s) for modal raised an exception:\n${error}`);
                            reject(error)
                        });
                })
            }

            toParams(body, footer) {
                return {
                    header: this.header,
                    body: body,
                    footer: footer,
                    showCloseButton: this.showCloseButton,
                    cssClass: this.cssClass,
                    closeCallback: this.closeCallback
                }
            }

            _checkAttribute(component) {
                if (component && !(component instanceof Component)) {
                    const message = `Core:\nArgument must be of type core.Component.\n`;
                    console.error(message);
                    throw new Error(message);
                }
            }
        }

        class Popover extends Library {

            constructor() {
                super("lightning:overlayLibrary");
            }

            setBody(body) {
                this.body = body;
            }

            setReferenceSelector(referenceElementSelector) {
                this.referenceElementSelector = referenceElementSelector;
            }

            setCssClass(cssClassList) {
                this.cssClassList = cssClassList;
            }

            show() {
                if (new Environment().isApp()) {
                    throw new Error(`Core:\nlightning:overlayLibrary is not supported in App`);
                }

                return this.library.showCustomPopover(this.toParams());
            }

            toParams() {
                return {
                    body: this.body || "",
                    referenceSelector: this.referenceElementSelector,
                    cssClass: this.cssClassList
                };
            }
        }

        /* "Abstract" class for storage objects*/
        class Storage {

            constructor(sourceName) {
                this.domain = new URL(window.location).origin;
                this.source = window[sourceName];
            }

            getDomain() {
                return this.domain;
            }

            get(name) {
                return this.source.getItem(name);
            }

            getObject(name) {
                return JSON.parse(this.get(name));
            }

            getAll() {
                return this.source;
            }

            set(name, value) {
                this.source.setItem(name, value);
            }

            setObject(name, value) {
                this.source.setItem(name, JSON.stringify(value));
            }

            has(name) {
                return !$A.util.isUndefinedOrNull(this.get(name));
            }

            remove(name) {
                delete this.source[name];
            }

            clear() {
                this.source.clear();
            }

            print() {
                console.log(`${this.source} for ${this.getDomain()}`);
                const keys = Object.keys(localStorage);
                for(let key of keys) {
                    console.log(`${key}: ${this.get(key)}`);
                }
            }
        }

        class LocalStorage extends Storage {

            constructor() {
                super("localStorage");
            }
        }

        class SessionStorage extends Storage {

            constructor() {
                super("sessionStorage")
            }
        }

        const core = {

            /* classes for creating toasts */
            "Toast": Toast,
            "ToastQuick": ToastQuick,
            "ToastLong": ToastLong,
            "ToastQuickSuccess": ToastQuickSuccess,
            "ToastQuickError": ToastQuickError,
            "ToastLongSuccess": ToastLongSuccess,
            "ToastLongError": ToastLongError,

            /* classes for creating toasts through notifications library*/
            "Notice": Notice,
            "ToastX": ToastX,
            "ToastXQuick": ToastXQuick,
            "ToastXLong": ToastXLong,
            "ToastXQuickSuccess": ToastXQuickSuccess,
            "ToastXQuickError": ToastXQuickError,
            "ToastXLongSuccess": ToastXLongSuccess,
            "ToastXLongError": ToastXLongError,


            /* classes for server interactions */
            "ServerAction": ServerAction,
            "ServerActionHandled": ServerActionHandled,
            "ServerActionPromise": ServerActionPromise,
            "ServerActionPromiseHandled": ServerActionPromiseHandled,
            "LightningPromise": LightningPromise,

            /* components creation */
            "Component": Component,
            "Components": Components,

            /* navigation */
            "Navigation": Navigation,
            "PageReferenceStandardComponent": PageReferenceStandardComponent,
            "PageReferenceCommLoginPage": PageReferenceCommLoginPage,
            "PageReferenceKnowledgeArticlePage": PageReferenceKnowledgeArticlePage,
            "PageReferenceNamedPage": PageReferenceNamedPage,
            "PageReferenceNavItemPage": PageReferenceNavItemPage,
            "PageReferenceObjectPage": PageReferenceObjectPage,
            "PageReferenceRecordPage": PageReferenceRecordPage,
            "PageReferenceRecordRelationshipPage": PageReferenceRecordRelationshipPage,
            "PageReferenceWebPage": PageReferenceWebPage,

            /* modal */
            "Modal": Modal,
            "Popover": Popover,

            /*Storages*/
            "LocalStorage": LocalStorage,
            "SessionStorage": SessionStorage
        };

        return {
            init: () => {
                if ($A.util.isUndefinedOrNull(window.core)) {
                    Object.defineProperty(window, "core", {
                        writable: false,
                        configurable: false,
                        enumerable: false,
                        value: core
                    });
                }
            }
        };

    }
})