---
layout: ../../layouts/BlogPost.astro
title: An accessible & effective dark theme switch in React
description: "Creating a proper dark theme switch requires more consideration
  than you might think. "
pubDate: 2022-06-15T22:00:00.000Z
heroImage: /placeholder-hero.jpg
slug: accessible-dark-theme-switch-in-react
author: Martin Ryberg Laude
---

## A "proper" dark theme switch
Upon hearing "build a dark theme switch", most developers would likely consider it to be an effortless task. Write markup for a button, have it change colors on the site on click with some js. Easy!

Except it isn't, at least not *that* simple. On a second pass of thinking, some issues and questions come to mind. What should the default theme be? Should the button override OS-level theme? If so, from the start or from the moment the user clicks the theme switch? What about behavior when OS-level theme is changed live? Is such an event detectable? Should it even be a button?

It was obvious I needed answers to these questions before I could proceed to any actual implementations, so eventually I came to define the exact behavior I thought best given technical complexity and making sense to the user, while remaining accessible. **This system would:**

* **Use OS-level theme by default**
* **Allow for live change of OS-level theme**
* **Store and use user preference if switch had been interacted with**
* **Be accessible to a high standard (WCAG 3.0 compliance)**

These criteria were the result of consideration of all aspects I could think of as relevant in the situation, and thereby what I would consider to be a *proper* dark theme switch. 

## Result
Given the criteria above, I developed a solution ticking all the boxes. This is hence what we will be making: 

![Dark theme switch](//images.ctfassets.net/i5kwj2n2u0ae/10VvcAbj0Elg60sCrboRAa/3119045e50a7c981ffd0e2c697681a65/dark_theme.gif)

But of course, this visual doesn't answer any of the criteria. At least it shows it doesn't look horrible! It does follow the criteria strictly, but you'll have to take my word for it for now. Onto the implementation!

## Implementation
### The switch itself
First and foremost, an accessible switch has to exist for us to work with, so that's what we're making first, in a new component. If you boil it down to the very basics, a switch is really a checkbox with the additional feature of changing something live. It makes sense to therefore build the switch out of a semantic checkbox, in other words an input tag with checkbox type. As we are working with react, we want the input to be a [controlled component](https://reactjs.org/docs/forms.html#controlled-components) as well, so we need an onClick handler as well. Additionally, we add an aria-label to make sure the input remains accessible to screen readers.

```tsx
<input
  aria-label="dark mode on"
  type="checkbox"
  checked={checked}
  onClick={() => handleCheck()}
  onChange={() => controlledComponentWorkAround()}
/>
```
*themeToggle.tsx*

But what's this, you say? An onChange handler? It turns out that the onClick function refuses to fire on first press on initial page load when the user has dark theme enabled on OS-level for some obscure reason. An onChange leading to an empty function simply returning right away fixes the issue. Not sure what that's all about, but if you know, please notify me. The workaround function simply looks like this:

```tsx
function controlledComponentWorkAround() {
  return
}
```
*themeToggle.tsx*

And what about the `handleCheck()` function? It needs to actually set the theme for starters, but it should also save whatever theme got selected into the localstorage. Since we are working with a controlled component we also need to set the state of the input.

```tsx
function handleCheck() {
  // Required browser checks for Gatsby
  //const isBrowser = typeof window !== "undefined"
  //if (!isBrowser) return

  if (!checked) {
    localStorage.setItem("theme", "dark")
    document.documentElement.setAttribute("data-theme", "dark")
    setChecked(true)
  } else {
    localStorage.setItem("theme", "light")
    document.documentElement.setAttribute("data-theme", "light")
    setChecked(false)
  }
}
```
*themeToggle.tsx*

> If you're using Gatsby, uncomment the first couple lines. NodeJS can't understand browser-specific code when pre-generating the pages, hence this necessity.

### The CSS
We have now set "data-theme" as an attribute on the document. This means that you can't simply use a media query for your dark theme, but don't worry, the alternative is even easier. When defining your theme using CSS variables, define the dark theme colors under the `data-theme="dark"` attribute. Here's how this website's theme looks in CSS:

```scss
:root {
  --color-primary: #009985;
  --color-primary-rgb: 0, 153, 133;
  --color-text: #000000;
  --color-text-secondary: #3d3d4d;
  --color-text-light: #748092;
  --color-heading: #1a202c;
  --color-heading-black: black;
  --color-light: #e6e6e6;
  --color-background: #f6f8f7;
}
[data-theme="dark"] {
  --color-primary: #00ddbf;
  --color-primary-rgb: 0, 221, 191;
  --color-text: #ffffff;
  --color-text-secondary: #d8d8e7;
  --color-text-light: #a5b0c2;
  --color-heading: #f2f3f6;
  --color-heading-black: white;
  --color-light: #2e313a;
  --color-background: #1f242a;
}
```
*global.scss*

Great! We still want to mimic the behavior of the media query however, as per the criteria. To do this we have to find a component that renders on every themable page (all pages in my case). In the case of a single page app this might be App.tsx, but in my case it's layout.tsx. In this component we need to use hooks to

1. Detect the current OS theme and any changes to it
2. Set the document data-theme attribute to this theme or to a saved local storage theme if it exists. 

### Automatic theme detection
Starting at step one, we need a hook to detect OS-level theme changes. 

```ts
import { useEffect, useState } from "react";

export const useThemeDetector = () => {
  // Required browser checks for Gatsby
  //const isBrowser = typeof window !== "undefined"
  //if (!isBrowser) return false
  const getCurrentTheme = () => window.matchMedia("(prefers-color-scheme: dark)").matches
  const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme()) 
  const mqListener = (e => {
    setIsDarkTheme(e.matches)
  })

  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)")
    darkThemeMq.addEventListener("change", mqListener)
    return () => darkThemeMq.removeEventListener("change",mqListener)
  }, [])
  return isDarkTheme
}
```
*utils.ts*

Basically we use an event listener for prefers-color-scheme and turn it into a custom hook. Works wonders. Now, back to the layout component:

```ts
const isDarkTheme = useThemeDetector()

useEffect(() => {
  applyCorrectTheme()
}, [isDarkTheme])
```
*layout.tsx*

We don't actually care which theme it is yet, we check that in the `applyCorrectTheme()` function below, in the same component:

```ts
 function applyCorrectTheme() {
   let theme = "light"

   if (localStorage.getItem("theme")) {
     localStorage.getItem("theme") == "dark"
       ? (theme = "dark")
     : (theme = "light")
   } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
     theme = "dark"
   }
   if (theme === "dark") {
     document.documentElement.setAttribute("data-theme", "dark")
   } else {
     document.documentElement.setAttribute("data-theme", "light")
   }
}
```
*layout.tsx*

This function does exactly what it's supposed to. It takes the theme from local storage if it exists, and the OS-level theme otherwise, and applies accordingly. 

### Final piece
Now back to the switch component! We implement the custom hook and a similar function to `applyCorrectTheme()`, but this time simply returning whichever theme is chosen:

```ts
const [checked, setChecked] = useState(isSelectedDarkTheme)
const isDarkTheme = useThemeDetector()

useEffect(() => {
  setChecked(isSelectedDarkTheme)
}, [isDarkTheme])

function isSelectedDarkTheme(): boolean {
  // Required browser checks for Gatsby
  //const isBrowser = typeof window !== "undefined"
  //if (!isBrowser) return false
  let theme = "light"

  if (localStorage.getItem("theme")) {
    localStorage.getItem("theme") == "dark"
      ? (theme = "dark")
    : (theme = "light")
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    theme = "dark"
  }
  if (theme === "dark") {
    return true
  }
  return false
}
```
*themeToggle.tsx*

From this point, the only thing left to do is style the checkbox based on checked or unchecked state. This has to be done **accessibly** though. For info on how to do this reliably, please check out [Sara Soueidan's blog post on styling checkboxes accessibly](https://www.sarasoueidan.com/blog/inclusively-hiding-and-styling-checkboxes-and-radio-buttons/) — it covers all you need to know. 

For the exact look I use, here's the markup and css:

```tsx
<div className={styles.container}>
      <input
        aria-label="dark mode on"
        type="checkbox"
        checked={checked}
        onClick={() => handleCheck()}
        onChange={() => controlledComponentWorkAround()}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="-4 -4 39 39"
        aria-hidden="true"
        focusable="false"
      >
        <rect
          className={styles.checkboxBg}
          width="35"
          height="35"
          x="-2"
          y="-2"
          stroke="none"
          fill="none"
          rx="100"
          ry="100"
        ></rect>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          className={styles.sun}
          x="5.5"
          y="5.5"
          width="20"
          height="20"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          ></path>
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          className={styles.moon}
          x="5.5"
          y="5.5"
          width="20"
          height="20"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          ></path>
        </svg>
      </svg>
    </div>
```
*themeToggle.tsx*

```scss
.container {
  position: relative;
  height: 48px;
  width: 48px;
}
.container input {
  position: absolute;
  width: 48px;
  height: 48px;
  opacity: 0.00001;
  &:hover {
    cursor: pointer;
  }
}
.sun,
.moon {
  transition: 200ms ease-in-out all;
}
.container svg {
  width: 48px;
  height: 48px;
  .checkboxBg {
    fill: var(--color-light);
  }
  .sun {
    opacity: 0;
    stroke: var(--color-heading-black);
  }
  .moon {
    transform: rotate(90deg);
    stroke: var(--color-heading-black);
  }
}
.container input:checked + svg {
  .sun {
    opacity: 1;
  }
  .moon {
    opacity: 0;
  }
}
.container input:focus + svg {
  outline: 3px solid var(--color-primary);
  outline-offset: 4px;
}
.container input:focus:not(:focus-visible) + svg {
  outline: none;
}
```
*themeToggle.module.scss*

## Conclusion

In the end, it's not quite as simple as I wished it was, and the solution isn't *quite* optimal. There is room for improvement, for instance introducing a way to revert back to automatic detection after the user has used the switch. Maybe a third state on the input? That said, I hope this helped you create a more inclusive and thoughtful dark mode switch!

## References
* Soueidan, S. (2020). [Inclusively Hiding & Styling Checkboxes and Radio Buttons](https://www.sarasoueidan.com/blog/inclusively-hiding-and-styling-checkboxes-and-radio-buttons/). (Accessed: 2022-01-15).