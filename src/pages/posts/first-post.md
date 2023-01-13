---
layout: ../../layouts/BlogPost.astro
title: A complete React PWA update system
description: Updating a React PWA is a nightmare. Let's fix it.
pubDate: 2021-12-23T23:00:00.000Z
heroImage: /placeholder-hero.jpg
slug: react-pwa-update-system
author: Martin Ryberg Laude
---

## Today's default behavior
When I read up on how updating works in a service worker by default, I was quite annoyed. Inconsistencies and waiting for all tabs to be closed and reopened were not something I wanted my users to experience. As a refresher, this is how service workers work by default:

1. Make a change in the application and push.
2. Your new service worker will be started and the install event will be fired.
3. At this point the old service worker is still controlling the current pages so the new service worker will enter a waiting state.
4. When the currently open pages of your site are closed, the old service worker will be killed and the new service worker will take control.
5. Once your new service worker takes control, its activate event will be fired.

First of all, the user is not informed about any of this out of the box. Second, update only happens from the user's perspective when all open tabs have been closed completely, and another opened. For a considerable amount of people, this never happens.

## What we want
The goal is a system where an update is detected as soon as the user launches the website, and downloaded and installed in the background. When it's done, a user dialog asking the user to update the app is presented, which when pressed sends a "SKIP_WAITING" message to the service worker followed by a page reload. 

So how does this look? 

![PWA update dialog](//images.ctfassets.net/i5kwj2n2u0ae/14XLXNHngn4Sn4F6hGdQ6C/95854ffcbcee0261e4d46e13bc730c7e/Screenshot_20211224-180100.png)
*Simple and effective*

Let's build it!

## Constructing the solution
In my solution I'm using Create React App as a React SPA with a service worker registration file, providing two callbacks. For any other framework or service worker setup, the theory still applies.

### Prerequisites
* Service worker registration
* Loading screen component
* A fresh dialog design!

### The code
In your App.tsx, make sure to always render the loading screen component.

```tsx
function App() {

  return (
    <>
      <ScreenLoading />
      ...
    </>
  )
}
```

Then, in ScreenLoading.tsx, create a state to handle displaying of the update dialog, a state to handle loading screen visibility, and a variable referencing the service worker:

```tsx
let serviceWorker: ServiceWorker | null

export default function ScreenLoading() {

  const [showUpdate, setShowUpdate] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  ...
}
```

Great! Now comes the part where we interact with the service worker. We create a useEffect hook to fire on initial mount, where we call the register function on the service worker registration. We do this with two callbacks, onUpdate and onSuccess. If you don't have a service worker registration file, you could also listen for the corresponding js events instead. Callbacks are safer, though. 

```tsx
  useEffect(() => {
    serviceWorkerRegistration.register({onUpdate: onSWUpdate, onSuccess: onSWSuccess})
  }, [])
```

Now we need to define the callback functions. OnSWUpdate will toggle our showUpdate state and set our serviceWorker variable to the current registration. OnSWSuccess on the other hand will simply announce that the app has been successfully installed as a PWA.

```tsx
function onSWUpdate(registration: ServiceWorkerRegistration) {
    setShowUpdate(true)
    serviceWorker = registration.waiting
  }

  function onSWSuccess() {
    console.log("App installed as a PWA.")
  }
```

> You could add a message visible to the user regarding the successful installation of the service worker. I opted not to, since I didn't deem that information relevant in my case. Your case might differ.

So, what happens when we toggle showUpdate? We show the update dialog! Same story with the showLoading, but for the loading screen, naturally. Our ScreenLoading.tsx return statement will look something like this:

```tsx
return (
    <div>
      {showUpdate && 
        <Dialog title="Update available" body="An update has been found. Please update the app now."
          confirmText="Update" confirmCallback={updateSW} />
      }
      {showLoading &&
        <div>
          <h2>Updating...</h2>
        </div>
      }
    </div>
  )
```

You can use any dialog component of your choice, I used my custom one. You could probably use other forms of UI interaction elements as well, you could be very creative here. In my opinion a blocking dialog serves this purpose excellently, though. 

Finally, we need to define the updateSW function. This is the function that does the magic. Let's have a look:

```tsx
function updateSW() {
    setShowLoading(true)
    if (!serviceWorker) return
    // Add listener for state change of service worker
    serviceWorker.onstatechange = () => {
      if (serviceWorker?.state === "activated" &&
          navigator.serviceWorker.controller) {
        // Reload page if waiting was successfully skipped
        window.location.reload()
      }
    }
    serviceWorker.postMessage({ type: "SKIP_WAITING" })
    setShowUpdate(false)
  }
```
*The magic code*

So, what's going on here? During the update process we want the loading text to show, so naturally we will toggle the showLoading state first. Then, if a service worker exists, we register a listener for the state of the service worker, that reloads the page when the state reaches "activated".

And how does it reach activated state? We skip the waiting state in the `serviceWorker.postMessage({ type: "SKIP_WAITING" })` part, so that the service worker can update right away. 

## Conclusion
With all that, we should be done. The update process should work well across browsers and platforms this way. Remember to style the dialog and loading screen efficiently as well!