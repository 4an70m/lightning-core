# lightning-core

## What is this?
lightning-core is a small library to use features of lightning in es6 style. It allows to eliminate the most common boilerplate code such as:
- Toasts
- Server calling
- Creating components, modals
- Downloading files
- Working with local/session storage
- Working with libraries (overlay, navigation, notification)

## Why do I need this?
Lots of projects I've ran into has either custom library-like component or JS resource file or they are stuck with each component defining a "new solution" for each pain-point, e.g. method for creating a Toast in every single component.
The purpose of this library component is to stop this madness.

## Lightning?
Lightnig is still something viable for a new project or for refactoring an old one and, I guess, will be for a couple more years, considering how many beautiful and functional things are already created for it.

## How to use?
The library is really simple and intuitive to use. You add it onse in the top level component, it immutably writes itself into the window object and after that you can use it anywhere. The variable in the window object is setted only once in a singleton manner, so don't worry if you reference the library somwhere else in your component hierarchy - the top-level lightning-dml component will initiallize first.

Start with:
```html
<aura:component>
	<c:lightningCore/>
	<!--other code...-->
</aura:component>
```
And now you can use it anywhere in your project!


## Architecture
Everything in this library is a class.  Each use-case of lightning-core is represented by a single class. The classes are combined into a variable, that serves as an export list and then attached to a window object as a namespace.
E.g.
```javascript
new window.core.Toast().fire();
```
Example shows how you can access one of the exported classes - `Toast` and fire it. But you may also skip window in your reference to the class:
```javascript
new core.Toast().fire();
```

### Use-cases: Toast
There are a number of classes, which are designed to ease the way of creating Toasts:

```javascript
/*base toast*/
new core.Toast({
	/*standard toast params*/
}).fire();

/*defaults mode to dismissable, time to 4s*/
new core.ToastQuick(type, title, message).fire();

/*defaults mode to dismissable, time to 8s*/
new core.ToastLong(type, title, message).fire();


/*defaults mode to dismissable, type to success, title to Success!, time to 4s*/
new core.ToastQuickSuccess(type, title, message).fire();

/*defaults mode to dismissable, type to error, title to Something went wrong!, time to 4s*/
new core.ToastQuickError(type, title, message).fire();

/*defaults mode to dismissable, type to success, title to Success!, time to 8s*/
new core.ToastLongSuccess(type, title, message).fire();

/*defaults mode to dismissable, type to error, title to Something went wrong!, time to 8s*/
new core.ToastLongError(type, title, message).fire();
```
The classes can be configured for each project independenlty and updated with default time, message, etc.

### Use-cases: Server calling
Several classes are dedicated to perform server calls with or without Promises as well as providing a way to parse error messages and autohandle errors.

```javascript
/*designed to perform promise-like async operations of calling the server, but that can be used with @AuraEnabled(cacheable=true). However, this cannot be chained like an actual promise*/
new core.ServerAction(component, actionName, params).execute()
	.then(result => {
		//result handling
	})
	.catch(error => {
		//error handling
	})
	.finally(() => {
		//some operation regardles of result
	})

/*default promise, that is designed to perform server calling, but that doesnt require to be wrapped with $A.getCallback(...)*/
new core.ServerActionPromise(component, actionName, params).execute()
	.then(result => {
		//result handling
	})
	.catch(error => {
		//error handling
	})
	.finally(() => {
		//some operation regardles of result
	})

/*...Handled classes are similar to the same classes without Handled, except for they automatically parse an error from response and show a toast with core.ToastLongError class*/
new core.ServerActionHandled()/*...*/
new core.ServerActionPromiseHandled()/*...*/
```

### Use-cases: Components
With lightning-core dynamically creating new components is designed to be intuitive and easy - no need to check documentation every time you need a dynamically generated component.

```javascript
/*each dynamic component is represented with a single instance of core.Component class and onyl requires a name and desired attributes. .create() method returns a Promsie*/
new core.Component(name, params).create()
	.then((component) => {
		/*do smth with newly generated component*/
	})
	.catch((error) => {
		/*handle errors*/
	});

/*there's also a way to create component in bulk*/
new core.Components()
	.addComponent(new core.Component(name, params))
	.addComponent(new core.Component(name, params))
	.addComponent(new core.Component(name, params))
	.create()
	.then((components) => {
		/*do smth with newly generated components*/
	})
	.catch((error) => {
		/*handle errors*/
	});
```

### Use-cases: Modals
Creating modals is usually also a drag. With lightning-dml creating modals is as easy as creating component. But! Modals are created based on the `lightning:overlayLibrary`. To use this library in lightning-core component you need to include this library into your instance of the library - simply include a library instance into the markup between opening and closing tags of `<c:lightningCore>`:

```html
<aura:component>
	<c:lightningCore>
		<lightning:overlayLibrary/>
	</c:lightningCore>
	<!--other code...-->
</aura:component>
```
After that, you can use any supported functionality for the library, for example - Modal creation.
```javascript
new core.Modal()
	.setBody(new Component(name, params))
	.setFooter(new Component(name, params))
	.show()
		.then((overlay) => {
			/*success callback*/
		})
		.catch((error) => {
			/*error callback*/
		});
```

### Use-cases: Files
There's a small class for downloading files, instantiated from base64 or Blob.
```javascript
/*new file*/
new core.File(base64Data);
new core.File(blobData);

/*converting file*/
new core.File(blobData).toBase64();
new core.File(base64Data).toBlob();

/*downlaoding*/
new core.File(base64Data).download(filename);
new core.File(blobData).download(filename);
```

### Use-cases: Local/Session Storage
There's a small class for working with local or session storage.
```javascript
const storage = new core.LocalStorage(); 
//or new core.SessionStorage() - can be used instead, both classes has identical interface
storage.set('key1', 'value');
storage.setObject('key2', {'object-key': 'object-value'}); //performs JSON.stringify(...)

storage.get('key1');
storage.getObject('key2'); //performs JSON.parse(...)

storage.clear();
storage.print();
```

### Use-cases: Libraries
As was mentioned before in the Modals section, to work with a library and it's functionality you need to include library markup into the body of lightning-core component:
```html
<aura:component>
	<!--currently supported libraries-->
	<c:lightningCore>
		<lightning:overlayLibrary/>
		<lightning:navigation/>
		<lightning:notificationsLibrary/>
	</c:lightningCore>
	<!--other code...-->
</aura:component>
```
Functionality which is supported through these libraries:
- Page reference navigation (lightning:navigation)
- Notices and Toasts (lightning:notificationsLibrary)
- Modals and Popovers (lightning:overlayLibrary)

Examples:
```javascript
/*Navigation*/
const navigation = new core.Navigation();
navigation.navigate(new core.PageReferenceWebPage().setUrl(url));

/*Notice*/
new core.Notice()
	.setTitle(title)
	.setMessage(message)
	.show();

/*Toast - toasts has the same classes, as regular toast, but it has X in it's name. E.g.*/
new core.ToastXLongError(message).fire();

/*Modal*/
new core.Modal()
	.setBody(new Component(name, params))
	.setFooter(new Component(name, params))
	.show()
		.then((overlay) => {
			/*success callback*/
		})
		.catch((error) => {
			/*error callback*/
		});

/*Popover*/
new core.Popover()
	.setBody(body)
	.setReferenceSelector(referenceElementSelector)
	.show()
	.then((overlay) => {
			/*success callback*/
		})
		.catch((error) => {
			/*error callback*/
		});
```



##ToDo
- Complete readme
