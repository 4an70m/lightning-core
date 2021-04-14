({

    /**
     * Function to import lightning-core into the window object.<br/>
     * Returns init() function, which should be explicitly called.
     *
     * @version 1.0
     * @author github/4an70m
     * @param cmp
     * @returns {{init}}
     */
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

            /**
             * Checks if current environment is an Application
             * @returns {boolean}
             */
            isApp() {
                return this.environment === "App";
            }

            /**
             * Checks if current environment is a lightning org runtime
             * @returns {boolean}
             */
            isLightning() {
                return this.environment === "Lightning";
            }
        }


        /* classes for creating toasts */
        /**
         * Simple class for creation toasts.<br/>
         * Use this format:<br/>
         * <code>
         *     new core.Toast({...}).fire();
         * </code>
         */
        class Toast {

            constructor(params = {}) {
                this.params = params;
            }

            /**
             * Sets the type of the toast. Accepted values are:<br/>
             * <ul>
             *     <li>success</li>
             *     <li>warning</li>
             *     <li>error</li>
             *     <li>info</li>
             * </ul>
             *
             * @param type
             * @returns {Toast}
             */
            setType(type) {
                this.params.type = type;
                return this;
            }

            /**
             * Sets the title of the toast.
             *
             * @param title
             * @returns {Toast}
             */
            setTitle(title) {
                this.params.title = title;
                return this;
            }

            /**
             * Sets the message of the toast.
             *
             * @param message
             * @returns {Toast}
             */
            setMessage(message) {
                this.params.message = message;
                return this;
            }

            /**
             * Sets the mode of the toast.
             * Supported values are:
             * <ul>
             *     <li>dismissible</li>
             *     <li>pester</li>
             *     <li>sticky</li>
             * </ul>
             *
             * @param mode
             * @returns {Toast}
             */
            setMode(mode) {
                this.params.mode = mode;
                return this;
            }

            /**
             * Sets the duration of the toast.
             *
             * @param duration
             * @returns {Toast}
             */
            setDuration(duration) {
                this.params.duration = duration;
                return this;
            }

            /**
             * Fires a toast<br/>
             * Displays an error in console, if toast is not supported in this environment
             */
            fire() {
                try {
                    if (new Environment().isApp()) {
                        throw new Error("$A.e.force:showToast is not supported in App");
                    }
                    const toastEvent = $A.get("e.force:showToast");
                    toastEvent.setParams(this.params);
                    toastEvent.fire();
                } catch (e) {
                    console.error(`Core:\nRunning e.force:showToast raised an exception:\n${e}`)
                }
            }
        }

        /**
         * Toast with predefined mode = "dismissible" and duration = 4s <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastQuick(type, title, message).fire();
         * </code>
         */
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

        /**
         * Toast with predefined mode = "dismissible" and duration = 8s <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastLong(type, title, message).fire();
         * </code>
         */
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

        /**
         * Toast with predefined
         * <br/>mode = "dismissible"
         * <br/>duration = 4s
         * <br/>type = "success"
         * <br/>title = "Success!"
         * <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastQuickSuccess(message).fire();
         * </code>
         */
        class ToastQuickSuccess extends ToastQuick {

            constructor(message) {
                super(
                    "success",
                    "Success!",
                    message
                );
            }
        }

        /**
         * Toast with predefined
         * <br/>mode = "dismissible"
         * <br/>duration = 4s
         * <br/>type = "error"
         * <br/>title = "Something went wrong!"
         * <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastQuickError(message).fire();
         * </code>
         */
        class ToastQuickError extends ToastQuick {

            constructor(message) {
                super(
                    "error",
                    "Something went wrong!",
                    message
                );
            }
        }

        /**
         * Toast with predefined
         * <br/>mode = "dismissible"
         * <br/>duration = 8s
         * <br/>type = "success"
         * <br/>title = "Success!"
         * <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastLongSuccess(message).fire();
         * </code>
         */
        class ToastLongSuccess extends ToastLong {

            constructor(message) {
                super(
                    "success",
                    "Success!",
                    message
                );
            }
        }

        /**
         * Toast with predefined
         * <br/>mode = "dismissible"
         * <br/>duration = 8s
         * <br/>type = "error"
         * <br/>title = "Something went wrong!"
         * <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastLongError(message).fire();
         * </code>
         */
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
        /**
         * Promise-like class for server action calling.<br/>
         * Doesn't support chaining yet.
         * Use this format:<br/>
         * <code>
         *     new core.ServerAction(component, actionName, (opt) params).execute();
         * </code>
         */
        class ServerAction {

            constructor(component, action, params) {
                this.action = ServerAction.getAction(component, action, params);
            }

            /**
             * Default message for parseResponseMessage() method, when the message cannot be parsed<br/>
             * <br/><b>Replace default message this with appropriate label, if you support multiple languages</b>
             *
             * @see ServerAction.parseResponseMessage
             * @returns {string}
             */
            static get messageUndefinedResponse() {
                return "Undefined response";
            }

            /**
             * Default message for parseResponseMessage() method, when the error is unknown
             * <br/><b>Replace default message this with appropriate label, if you support multiple languages</b>
             *
             * @see ServerAction.parseResponseMessage
             * @returns {string}
             */
            static get messageUnknownError() {
                return "Unknown error";
            }

            /**
             * Default message for parseResponseMessage() method, when action was interrupted
             * <br/><b>Replace default message this with appropriate label, if you support multiple languages</b>
             *
             * @see ServerAction.parseResponseMessage
             * @returns {string}
             */
            static get messageIncompleteAction() {
                return "No response from server or client is offline";
            }

            /**
             * Default message for parseResponseMessage() method, when the error was unexpected and no other error was applicable
             * <br/><b>Replace default message this with appropriate label, if you support multiple languages</b>
             *
             * @see ServerAction.parseResponseMessage
             * @returns {string}
             */
            static get messageUnexpectedError() {
                return "Unexpected error";
            }

            /**
             * Method for getting apex-based action.<br/>
             * Supports action name without "c." prefix.<br/>
             * params parameter is optional and can be omitted.<br/>
             *
             * <br/>Displays an error in console if the action was not found.
             *
             * @param cmp
             * @param actionName
             * @param params
             * @returns {*}
             */
            static getAction(cmp, actionName, params) {
                if (actionName.indexOf("c.") <= -1) {
                    actionName = "c." + actionName;
                }
                let action = null;

                try {
                    action = cmp.get(actionName);
                } catch (error) {
                    console.error(`\nCore:\n${actionName} is invalid action.\n + ${error}`);
                    return action;
                }

                if (!$A.util.isUndefinedOrNull(params)) {
                    action.setParams(params);
                }
                return action;
            }

            /**
             * Executes an action. Performs a server call.
             *
             * @returns {LightningAction}
             */
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

            /**
             * Multipurpose method, which parses any response, that lightning actions might though
             *
             * @param response
             * @returns {*}
             */
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

        /**
         * Promise-like class for server action calling.<br/>
         * Automatically handles an error with core.ToastLongError(...)<br/>
         * Doesn't support chaining yet.
         * Use this format:<br/>
         * <code>
         *     new core.ServerActionHandled(component, actionName, (opt) params).execute();
         * </code>
         */
        class ServerActionHandled extends ServerAction {

            constructor(component, action, params) {
                super(component, action, params);
            }

            /**
             * Executes an action. Performs a server call<br/>
             * If the action fails, a ToastLongError will be thrown.
             *
             * @see ToastLongError
             * @returns {LightningAction}
             */
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

        /**
         * Promise class for server action calling.<br/>
         * Use this format:<br/>
         * <code>
         *     new core.ServerActionPromise(component, actionName, (opt) params).execute();
         * </code>
         */
        class ServerActionPromise extends ServerAction {

            constructor(component, action, params) {
                super(component, action, params);
            }

            /**
             * Executes an action. Performs a Promise server call.
             *
             * @returns {LightningAction}
             */
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

        /**
         * Promise class for server action calling.<br/>
         * Automatically handles an error with core.ToastLongError(...)<br/>
         * Use this format:<br/>
         * <code>
         *     new core.ServerActionPromiseHandled(component, actionName, (opt) params).execute();
         * </code>
         */
        class ServerActionPromiseHandled extends ServerAction {

            constructor(component, action, params) {
                super(component, action, params);
            }

            /**
             * Executes an action. Performs a Promise server call<br/>
             * If the action fails, a ToastLongError will be thrown.
             *
             * @see ToastLongError
             * @returns {LightningAction}
             */
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

        /**
         * Promise substitute class.<br/>
         * Built with a single purpose - to execute server actions in a Promise-like manner for cacheable=true actions
         */
        class LightningAction {

            constructor(action) {
                this.action = action;
                this._resolve();
            }

            /**
             * Adds a handler function for success callback
             *
             * @param onSuccess
             * @returns {LightningAction}
             */
            then(onSuccess) {
                this.onSuccess = onSuccess;
                return this;
            }

            /**
             * Adds a handler function for error callback
             *
             * @param onError
             * @returns {LightningAction}
             */
            catch(onError) {
                this.onError = onError;
                return this;
            }

            /**
             * Adds a handler function for any outcome callback
             *
             * @param onFinally
             * @returns {LightningAction}
             */
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

        /**
         * Child class of Promise class.<br/>
         * Wraps most of the common functions with $A.getCallback(...) to eliminate the need of wrapping callback functions
         */
        class LightningPromise extends Promise {

            constructor(fn) {
                super($A.getCallback(fn));
            }

            /**
             * Adds a handler function on Success and Error outcome
             *
             * @param onSuccess
             * @param onError
             * @returns {Promise<T | never>}
             */
            then(onSuccess, onError) {
                return super.then(
                    (onSuccess ? $A.getCallback(onSuccess) : undefined),
                    (onError ? $A.getCallback(onError) : undefined)
                );
            }

            /**
             * Adds a handle function on Error outcome
             *
             * @param onError
             * @returns {Promise<T | never>}
             */
            catch(onError) {
                return super.catch(
                    onError ? $A.getCallback(onError) : undefined
                );
            }

            /**
             * Adds a handler function on any outcome
             *
             * @param onFinally
             * @returns {Promise<any>}
             */
            finally(onFinally) {
                return super.finally(
                    onFinally ? $A.getCallback(onFinally) : undefined
                );
            }
        }


        /* classes for component creation*/
        /**
         * Class, which represents a container for a single component<br/>
         * Supports creation of the component with a Promise
         *
         * @see LightningPromise
         */
        class Component {

            constructor(name, params = {}) {
                this.name = name;
                this.params = params;
            }

            /**
             * Adds a parameter to component
             *
             * @param name
             * @param value
             * @returns {Component}
             */
            addParam(name, value) {
                this.params[name] = value;
                return this;
            }

            /**
             * Removes a parameter from component
             * @param name
             * @returns {Component}
             */
            removeParam(name) {
                delete this.params[name];
                return this;
            }

            /**
             * Converts component to the format, which is acceptable for $A.createComponents
             * @returns {*[]}
             */
            toParams() {
                return [
                    this.name,
                    this.params
                ];
            }

            /**
             * Creates a component using LightningPromise
             *
             * @see LightningPromise
             * @returns {LightningPromise}
             */
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

        /**
         * Container class for bulk-creation of components
         */
        class Components {

            constructor() {
                this.components = [];
            }

            /**
             * Adds a component to the container
             *
             * @param component
             * @returns {Components}
             */
            addComponent(component) {
                if (component instanceof Component) {
                    this.components.push(component);
                }
                return this;
            }

            /**
             * Performs bulk creation of components<br/>
             * Returns null if there's no components to create<br/>
             * Returns LightningPromise if there are components to create<br/>
             *
             * @see LightningPromise
             * @returns {*}
             */
            create() {
                if (this.components.length === 0) {
                    return null;
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
        /**
         * Files wrapper class, built for convenient conversion and downloading of a file
         */
        class File {

            /**
             * Accepts Base64 or Blob representation of a file
             *
             * @param fileData
             * @param fileName
             */
            constructor(fileData, fileName = "download") {
                this.fileData = fileData;
                this.fileName = fileName;
            }

            /**
             * Converts file to Base64 format
             *
             * @returns {LightningPromise}
             */
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

            /**
             * Converts file to Blob format
             *
             * @returns {Blob}
             */
            toBlob() {
                let sliceSize = 512;
                let byteCharacters = atob(this.fileData);
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

            /**
             * Performs a client-side downloading of a file
             *
             * @param fileName
             */
            download(fileName) {
                const a = document.createElement("a");
                a.download = this.fileName || fileName;
                a.rel = "noopener";
                a.target = "_blank";

                if (this.fileData instanceof Blob) {
                    a.href = window.URL.createObjectURL(this.fileData);
                } else {
                    a.href = this.toBlob();
                }
                a.click();

            }
        }


        /* library class */
        /**
         * Class, which represents a dependency to a specific library<br/>
         * Retrieves it from the body and checks if there's a library<br/>
         * Throws specific errors, if there's no library attached
         */
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


        /* classes to work with lightning:navigation */
        /**
         * Navigation library, wraps lightning:navigation<br/>
         * Supports old-style navigation through "e.force:navigateTo..." as well as PageReference navigations
         */
        class Navigation extends Library {

            constructor() {
                super("lightning:navigation");
            }

            /**
             * Navigation with a PageReference classes<br/>
             * Supports a preNavigateCallback function, which is executed after url is generated, but before the navigation occurs.<br/>
             *
             * @see PageReference
             * @param pageReference
             * @param preNavigateCallback
             */
            navigate(pageReference, preNavigateCallback = null) {
                if (!(pageReference instanceof PageReference)) {
                    const message = `Core:\nnavigate() method should be called with PageReference parameter\n`;
                    console.error(message);
                    throw new Error(message);
                }
                this.library.generateUrl(pageReference.toPageReference())
                    .then($A.getCallback((url) => {
                        if (preNavigateCallback) {
                            url = preNavigateCallback(url);
                        }
                        this.library.navigate(url);
                    }))
                    .catch($A.getCallback((error) => {
                        console.error(`Core:\nUrl generation encountered an error: \n ${error}\n`);
                    }));
            }

            /**
             * Base method for navigation
             *
             * @deprecated
             * @param type
             * @param params
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
             *
             * @deprecated
             * @param componentDef
             * @param componentAttributes
             */
            oldNavigateToComponent(componentDef, componentAttributes = {}) {
                this.oldNavigateTo("e.force:navigateToComponent", {
                    "componentDef": componentDef,
                    "componentAttributes": componentAttributes
                });
            }


            /**
             * This event enables you to navigate to the list view specified by listViewId.
             *
             * @deprecated
             * @param componentDef
             * @param listViewId
             * @param listViewName
             * @param scope
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
             *
             * @deprecated
             * @param scope
             */
            oldNavigateToObjectHome(scope) {
                this.oldNavigateTo("e.force:navigateToObjectHome", {
                    "scope": scope
                })
            }

            /**
             * This event enables you to navigate to the related list specified by parentRecordId.
             *
             * @deprecated
             * @param relatedListId
             * @param parentRecordId
             */
            oldNavigateToRelatedList(relatedListId, parentRecordId) {
                this.oldNavigateTo("e.force:navigateToRelatedList", {
                    "relatedListId": relatedListId,
                    "parentRecordId": parentRecordId
                })
            }


            /**
             * This event enables you to navigate to an sObject record specified by recordId.
             *
             * @deprecated
             * @param recordId
             * @param slideDevName
             */
            oldNavigateToSObject(recordId, slideDevName) {
                this.oldNavigateTo("e.force:navigateToSObject", {
                    "recordId": recordId,
                    "slideDevName": slideDevName
                })
            }

            /**
             * Relative and absolute URLs are supported. Relative URLs are relative to the Salesforce mobile web domain, and retain navigation history. External URLs open in a separate browser window.
             *
             * @param url
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

            /**
             * Sets a type of a PageReference
             *
             * @param type
             * @returns {PageReference}
             */
            setType(type) {
                this.type = type;
                return this;
            }

            /**
             * Sets attributes for a PageReference
             *
             * @param attributes
             * @returns {PageReference}
             */
            setAttributes(attributes) {
                this.attributes = attributes;
                return this;
            }

            /**
             * Adds an attribute to PageReference
             *
             * @param name
             * @param value
             * @returns {PageReference}
             */
            addAttribute(name, value) {
                this.attributes[name] = value;
                return this;
            }

            /**
             * Removes an attribute from PageReference
             *
             * @param name
             * @returns {PageReference}
             */
            removeAttribute(name) {
                delete this.attributes[name];
                return this;
            }

            /**
             * Converts object to PageReference
             */
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

            /**
             * Sets a state of the StatefulPageReference
             *
             * @param state
             * @returns {StatefulPageReference}
             */
            setState(state) {
                this.state = state;
                return this;
            }

            /**
             * Adds a state value to StatefulPageReference
             *
             * @param name
             * @param value
             * @returns {StatefulPageReference}
             */
            addState(name, value) {
                this.state[name] = value;
                return this;
            }

            /**
             * Removes a state value from StatefulPageReference
             *
             * @param name
             * @returns {StatefulPageReference}
             */
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

            /**
             * Sets the action to be "login"
             *
             * @returns {PageReference}
             */
            setActionLogin() {
                return this.addAttribute("actionName", "login");
            }

            /**
             * Sets the action to be "logout"
             *
             * @returns {PageReference}
             */
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

            /**
             * Sets articleType attribute
             *
             * @param articleType
             * @returns {PageReference}
             */
            setArticleType(articleType) {
                return this.addAttribute("articleType", articleType);
            }


            /**
             * Sets urlName attribute
             *
             * @param urlName
             * @returns {PageReference}
             */
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

            /**
             * Sets pageName attribute
             *
             * @param pageName
             * @returns {PageReference}
             */
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

            /**
             * Sets apiName attribute
             *
             * @param apiName
             * @returns {PageReference}
             */
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

            /**
             * Sets objectApiName attribute
             *
             * @param objectApiName
             * @returns {PageReference}
             */
            setObjectApiName(objectApiName) {
                return this.addAttribute("objectApiName", objectApiName);
            }

            /**
             * Sets actionName attribute
             *
             * @param actionName
             * @returns {PageReference}
             */
            setActionName(actionName) {
                return this.addAttribute("actionName", actionName);
            }

            /**
             * Sets filterName attribute
             *
             * @param filterName
             * @returns {StatefulPageReference}
             */
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

            /**
             * Sets actionName attribute
             *
             * @param actionName
             * @returns {PageReference}
             */
            setActionName(actionName) {
                return this.addAttribute("actionName", actionName);
            }

            /**
             * Sets objectApiName attribute
             *
             * @param objectApiName
             * @returns {PageReference}
             */
            setObjectApiName(objectApiName) {
                return this.addAttribute("objectApiName", objectApiName);
            }

            /**
             * Sets recordId attribute
             *
             * @param recordId
             * @returns {PageReference}
             */
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

            /**
             * Sets recordId attribute
             *
             * @param recordId
             * @returns {PageReference}
             */
            setRecordId(recordId) {
                return this.addAttribute("recordId", recordId);
            }

            /**
             * Sets objectApiName attribute
             *
             * @param objectApiName
             * @returns {PageReference}
             */
            setObjectApiName(objectApiName) {
                return this.addAttribute("objectApiName", objectApiName);
            }

            /**
             * Sets relationshipApiName attribute
             *
             * @param relationshipApiName
             * @returns {PageReference}
             */
            setRelationshipApiName(relationshipApiName) {
                return this.addAttribute("relationshipApiName", relationshipApiName);
            }

            /**
             * Sets actionName attribute
             *
             * @param actionName
             * @returns {PageReference}
             */
            setActionName(actionName) {
                return this.addAttribute("actionName", actionName);
            }
        }

        /**
         * An external URL.
         * <a href="https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_navigation_page_definitions.htm#webpage">
         */
        class PageReferenceWebPage extends PageReference {

            constructor(url) {
                super();
                this.setType("standard__webPage");
                this.setUrl(url);
            }

            /**
             * Sets url attribute
             *
             * @param url
             * @returns {PageReference}
             */
            setUrl(url) {
                return this.addAttribute("url", url);
            }
        }


        /* classes to work with lightning:notificationsLibrary */
        /**
         * Creates a notice object, based on lightning:notificationsLibrary
         */
        class Notice extends Library {

            /**
             * Creates a new Notice with params
             *
             * @param params
             */
            constructor(params) {
                super("lightning:notificationsLibrary");
                this.setParams(params)
            }

            /**
             * Sets params for the Notice
             *
             * @param params
             * @returns {Notice}
             */
            setParams(params = {}) {
                this.params = params;
                return this;
            }

            /**
             * Sets header for the Notice
             *
             * @param header
             * @returns {Notice}
             */
            setHeader(header) {
                this.params.header = header;
                return this;
            }

            /**
             * Sets title for the Notice
             *
             * @param title
             * @returns {Notice}
             */
            setTitle(title) {
                this.params.title = title;
                return this;
            }

            /**
             * Sets message for the Notice
             *
             * @param message
             * @returns {Notice}
             */
            setMessage(message) {
                this.params.message = message;
                return this;
            }

            /**
             * Sets variant for the Notice<br/>
             * Supported values:
             * <ul>
             *     <li>info</li>
             *     <li>warning</li>
             *     <li>error</li>
             * </ul>
             * @param variant
             * @returns {Notice}
             */
            setVariant(variant) {
                this.params.variant = variant;
                return this;
            }

            /**
             * A callback function called, when Notice is closed
             *
             * @param closeCallback
             * @returns {Notice}
             */
            setCloseCallback(closeCallback) {
                this.params.closeCallback = closeCallback;
                return this;
            }

            /**
             * Creates and shows a Notice component.<br/>
             * Throws an error if Notice is not supported in this environment.<br/>
             * Returns a Promise, if Notice is supported for this environment
             *
             * @returns {*}
             */
            show() {
                try {
                    if (new Environment().isApp()) {
                        throw new Error("lightning:notificationsLibrary is not supported in App");
                    }
                    return this.library.showNotice(this.params);
                } catch (e) {
                    console.error(`Core:\nRunning lightning:notificationsLibrary -> showNotice() raised an exception:\n${e}`)
                }
            }
        }

        /**
         * Simple class for creation toasts through lightning:notificationsLibrary.<br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastX({...}).fire();
         * </code>
         */
        class ToastX extends Library {

            constructor(params) {
                super("lightning:notificationsLibrary");
                this.params = params;
            }

            /**
             * Sets the type of the toast. Accepted values are:<br/>
             * <ul>
             *     <li>success</li>
             *     <li>warning</li>
             *     <li>error</li>
             *     <li>info</li>
             * </ul>
             *
             * @param type
             * @returns {Toast}
             */
            setType(type) {
                this.params.type = type;
                return this;
            }

            /**
             * Sets the title of the toast.
             *
             * @param title
             * @returns {Toast}
             */
            setTitle(title) {
                this.params.title = title;
                return this;
            }

            /**
             * Sets the message of the toast.
             *
             * @param message
             * @returns {Toast}
             */
            setMessage(message) {
                this.params.message = message;
                return this;
            }

            /**
             * Sets the mode of the toast.
             * Supported values are:
             * <ul>
             *     <li>dismissible</li>
             *     <li>pester</li>
             *     <li>sticky</li>
             * </ul>
             *
             * @param mode
             * @returns {Toast}
             */
            setMode(mode) {
                this.params.mode = mode;
                return this;
            }

            /**
             * Sets the duration of the toast.
             *
             * @param duration
             * @returns {Toast}
             */
            setDuration(duration) {
                this.params.duration = duration;
                return this;
            }

            /**
             * Fires a toast<br/>
             * Displays an error in console, if toast is not supported in this environment
             */
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

        /**
         * Toast through lightning:notificationsLibrary with predefined mode = "dismissible" and duration = 4s <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastXQuick(type, title, message).fire();
         * </code>
         */
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

        /**
         * Toast through lightning:notificationsLibrary with predefined mode = "dismissible" and duration = 8s <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastXLong(type, title, message).fire();
         * </code>
         */
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

        /**
         * Toast through lightning:notificationsLibrary with predefined
         * <br/>mode = "dismissible"
         * <br/>duration = 4s
         * <br/>type = "success"
         * <br/>title = "Success!"
         * <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastXQuickSuccess(message).fire();
         * </code>
         */
        class ToastXQuickSuccess extends ToastXQuick {

            constructor(message) {
                super(
                    "success",
                    "Success!",
                    message
                );
            }
        }

        /**
         * Toast through lightning:notificationsLibrary with predefined
         * <br/>mode = "dismissible"
         * <br/>duration = 4s
         * <br/>type = "error"
         * <br/>title = "Something went wrong!"
         * <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastXQuickError(message).fire();
         * </code>
         */
        class ToastXQuickError extends ToastXQuick {

            constructor(message) {
                super(
                    "error",
                    "Something went wrong!",
                    message
                );
            }
        }

        /**
         * Toast through lightning:notificationsLibrary with predefined
         * <br/>mode = "dismissible"
         * <br/>duration = 8s
         * <br/>type = "success"
         * <br/>title = "Success!"
         * <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastXLongSuccess(message).fire();
         * </code>
         */
        class ToastXLongSuccess extends ToastXLong {

            constructor(message) {
                super(
                    "success",
                    "Success!",
                    message
                );
            }
        }

        /**
         * Toast through lightning:notificationsLibrary with predefined
         * <br/>mode = "dismissible"
         * <br/>duration = 8s
         * <br/>type = "error"
         * <br/>title = "Something went wrong!"
         * <br/>
         * Use this format:<br/>
         * <code>
         *     new core.ToastXLongError(message).fire();
         * </code>
         */
        class ToastXLongError extends ToastXLong {

            constructor(message) {
                super(
                    "error",
                    "Something went wrong!",
                    message
                );
            }
        }


        /* classes to work with lightning:overlayLibrary */
        /**
         * Creates a Modal with lightning:overlayLibrary
         */
        class Modal extends Library {

            /**
             * Creates a new Modal with body and Footer
             *
             * @param body
             * @param footer
             */
            constructor(body = null, footer = null) {
                super("lightning:overlayLibrary");
                this.setBody(body);
                this.setFooter(footer);
            }

            /**
             * Sets the body for the Modal
             *
             * @param body
             * @returns {Modal}
             */
            setBody(body = null) {
                this._checkAttribute(body);
                this.body = body;
                return this;
            }

            /**
             * Sets footer for the Modal
             *
             * @param footer
             * @returns {Modal}
             */
            setFooter(footer = null) {
                this._checkAttribute(footer);
                this.footer = footer;
                return this;
            }

            /**
             * Sets header for the Modal
             *
             * @param header
             * @returns {Modal}
             */
            setHeader(header = "") {
                this.header = header;
                return this;
            }

            /**
             * Sets show close button for the Modal
             *
             * @param showCloseButton
             * @returns {Modal}
             */
            setShowCloseButton(showCloseButton = true) {
                this.showCloseButton = showCloseButton;
                return this;
            }

            /**
             * Sets css class for the Modal
             *
             * @param cssClass
             * @returns {Modal}
             */
            setCssClass(cssClass = "") {
                this.cssClass = cssClass;
                return this;
            }

            /**
             * Sets close callback for the Modal
             *
             * @param closeCallback
             * @returns {Modal}
             */
            setCloseCallback(closeCallback) {
                this.closeCallback = closeCallback;
                return this;
            }

            /**
             * Builds component for Body and Footer and builds a Modal from them
             *
             * @returns {LightningPromise}
             */
            show() {
                try {
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
                                if (components.length >= 1) {
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
                    });
                } catch (e) {
                    console.error(`Core:\nRunning lightning:overlayLibrary -> Modal.show() raised an exception:\n${e}`)
                }
            }

            /**
             * Converts the Modal class to params, which are applicable to create a new Modal with lightning:overlayLibrary
             *
             * @param body
             * @param footer
             * @returns {{header: string, body: *, footer: *, showCloseButton: boolean, cssClass: string, closeCallback: *}}
             */
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

        /**
         * Creates a Popover with lightning:overlayLibrary
         */
        class Popover extends Library {

            constructor(body) {
                super("lightning:overlayLibrary");
                this.setBody(body);
            }

            /**
             * Sets the body for the Popover
             *
             * @param body
             */
            setBody(body) {
                this.body = body;
                return this;
            }

            /**
             * Sets reference selector for the Popover
             *
             * @param referenceElementSelector
             * @returns {Popover}
             */
            setReferenceSelector(referenceElementSelector) {
                this.referenceElementSelector = referenceElementSelector;
                return this;
            }

            /**
             * Sets reference selector for the Popover
             *
             * @param cssClassList
             * @returns {Popover}
             */
            setCssClass(cssClassList) {
                this.cssClassList = cssClassList;
                return this;
            }

            /**
             * Creates a Popover and shows it in UI
             *
             * @returns {LightningPromise}
             */
            show() {
                try {
                    if (new Environment().isApp()) {
                        throw new Error(`Core:\nlightning:overlayLibrary is not supported in App`);
                    }

                    return this.library.showCustomPopover(this.toParams());
                } catch (e) {
                    console.error(`Core:\nRunning lightning:overlayLibrary -> Popover.show() raised an exception:\n${e}`)
                }
            }

            /**
             * Converts the Popover class to params, which are applicable to create a new Popover with lightning:overlayLibrary
             *
             * @returns {{body: (*|string), referenceSelector: *, cssClass: *}}
             */
            toParams() {
                return {
                    body: this.body || "",
                    referenceSelector: this.referenceElementSelector,
                    cssClass: this.cssClassList
                };
            }
        }


        /* classes to work with browser storage */
        /**
         * Base class for the Local- and Session Storage
         * @see LocalStorage
         * @see SessionStorage
         */
        class Storage {

            constructor(sourceName) {
                this.domain = new URL(window.location).origin;
                this.source = window[sourceName];
            }

            /**
             * Returns domain name for current Storage
             *
             * @returns {string | *}
             */
            getDomain() {
                return this.domain;
            }

            /**
             * Returns a named items from the Storage
             *
             * @param name
             * @returns {Object|SVGPoint|SVGTransform|SVGNumber|string|T|SVGLength|SVGPathSeg}
             */
            get(name) {
                return this.source.getItem(name);
            }

            /**
             * REturns a named object from the Storage
             *
             * @param name
             * @returns {any}
             */
            getObject(name) {
                return JSON.parse(this.get(name));
            }

            /**
             * Returns all the items from the Storage
             *
             * @returns {*}
             */
            getAll() {
                return this.source;
            }

            /**
             * Sets a named item into the Storage
             *
             * @param name
             * @param value
             */
            set(name, value) {
                this.source.setItem(name, value);
            }

            /**
             * Sets a named object into the Storage
             *
             * @param name
             * @param value
             */
            setObject(name, value) {
                this.source.setItem(name, JSON.stringify(value));
            }

            /**
             * Checks if there's a named item in the Storage
             *
             * @param name
             * @returns {boolean}
             */
            has(name) {
                return !$A.util.isUndefinedOrNull(this.get(name));
            }

            /**
             * Removes a named items from the Storage
             *
             * @param name
             */
            remove(name) {
                delete this.source[name];
            }

            /**
             * Removes all named items from the Storage
             */
            clear() {
                this.source.clear();
            }

            /**
             * Prints everything from the Storage
             */
            print() {
                console.log(`Storage for ${this.getDomain()}`);
                const keys = Object.keys(localStorage);
                for (let key of keys) {
                    console.log(`${key}: ${this.get(key)}`);
                }
            }
        }

        /**
         * Storage class, which represents a Local Storage
         */
        class LocalStorage extends Storage {

            constructor() {
                super("localStorage");
            }
        }

        /**
         * Storage class, which represents a Session Storage
         */
        class SessionStorage extends Storage {

            constructor() {
                super("sessionStorage")
            }
        }

        const core = {
            "File": File,

            "Toast": Toast,
            "ToastQuick": ToastQuick,
            "ToastLong": ToastLong,
            "ToastQuickSuccess": ToastQuickSuccess,
            "ToastQuickError": ToastQuickError,
            "ToastLongSuccess": ToastLongSuccess,
            "ToastLongError": ToastLongError,

            "Notice": Notice,
            "ToastX": ToastX,
            "ToastXQuick": ToastXQuick,
            "ToastXLong": ToastXLong,
            "ToastXQuickSuccess": ToastXQuickSuccess,
            "ToastXQuickError": ToastXQuickError,
            "ToastXLongSuccess": ToastXLongSuccess,
            "ToastXLongError": ToastXLongError,


            "ServerAction": ServerAction,
            "ServerActionHandled": ServerActionHandled,
            "ServerActionPromise": ServerActionPromise,
            "ServerActionPromiseHandled": ServerActionPromiseHandled,
            "LightningPromise": LightningPromise,


            "Component": Component,
            "Components": Components,


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


            "Modal": Modal,
            "Popover": Popover,


            "LocalStorage": LocalStorage,
            "SessionStorage": SessionStorage
        };

        return ((component) => {

            const loadModules = (component, core) => {
                const body = component.get("v.body");
                body.filter(component => {
                    return component.isInstanceOf("c:lightningCoreModule");
                })
                    .forEach(module => {
                        let exported = null;
                        try {
                            exported = module.export()
                        } catch (e) {
                            console.error(`Core:\nModule ${module.getName()} does not implement export method\n${e}`);
                            return;
                        }
                        if (!exported || !Array.isArray(exported) || exported.length !== 2 || typeof exported[0] !== 'string') {
                            console.error(`Core:\nModule ${module.getName()} has wrong return format.\nReturn format should be [module_name, {exported_classes}]`);
                            return;
                        }
                        if (core[exported[0]]) {
                            console.error(`Core:\n${exported[0]} namespace from module ${module.getName()} is already defined in lightning-core. Please, consider other module name`);
                            return;
                        }
                        core[exported[0]] = exported[1];
                    });
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
                        loadModules(component, core);
                    }
                }
            };
        })(component);

    }
})
