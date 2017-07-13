# Coco

Part of the UCOSP Code Coverage Team working with Mozilla to bring code coverage data to the people who need it.

*I can bear-ly contain my excitement*

## Overview

A zero knowledge interface for ActiveData queries. Primarily directed toward distributing code coverage data. Built for stakeholders to access pertinent data housed in ActiveData without struggling with query language or schemas.

## Skip the details
*Okay,* just head over [here](https://ericdesj.github.io/moz-coco-w17-preview/) (updated March 2017)

### Problem

Mozilla has no way for stakeholders to access line level code coverage data without using clunky tools themselves. With Coco we are able to use ActiveData to query the data stakeholders need without burdening them with external tools.

### Limitations

Coco is intended to be used without a server side application. This means we cannot store user data (globally) or restrict access in the current state.

Additionally due to the restrictions on browser based applications and the way ActiveData does queries we cannot run queries that will timeout in the browser without some kind of server and significant changes.

## Goals

Coco must be able to display line level coverage data of multiple languages used by Mozilla. Ideally we could explore the source tree interactively aggregating by directory allow stakeholders to recognize where improvements can be made.

Coco is intended to be used without a server side application. This, practically allows one to host their own Coco application without relying on an external server. But also reduces the burden on infrastructure that Mozilla has to use to host the application to near zero.

## Non Goals

Not meant to replace ActiveData or custom dashboards that currently exist. Simple dashboards, however, could be implemented to use Coco as an interface and shared among stakeholders. However, not meant to replace the ActiveData query tool either.

Mobile support, long tabular data is difficult to display on tall viewports. This may change if the need arises.

## Dependencies

Coco heavily depends on **ActiveData** for data but could be modified to accept other document stores.

Very few dependencies are actually required to run a development version of the application. Most of the dev-dependencies are used to transpile the various utility languages into the languages that modern browsers will accept (JavaScript, CSS). Therefore with local file hosting the application can use **zero dependencies** after being compiled.

**React** is the biggest dependency of the project it allows the developer to focus on designing elements and how these components are update without creating technical debt when doing partial updates, or causing poor performance. We also use **Flux** to maintain component state with event driven programming.

**Babel/Browserify/Uglifyify** is used to create our browser bundle.

**Less & Bootstrap** are used for aesthetically pleasing styles.

Various JavaScript libraries/frameworks are pulled in order to compile a browser bundle that can be used to present the application. These JavaScript libraries managed using **npm**, the application is written with **Node.js** APIs and therefore depends on **Node.js** itself.

## Install & Run Locally

1. git clone the repository to a local directory
2. `npm install`
3. wait for code compilation
4. `npm start` (runs a local webserver)

See docs for more info [here](docs/project/development.md)

## Code
https://github.com/mozilla/moz-coco

## Contact

### Mentor

Kyle Lahnakoski  
IRC: ekyle@irc.mozilla.org  
Email: klahnakoski@mozilla.org  
Bugzilla: :ekyle  

### Participant

Brad Kennedy  
IRC: co60ca@irc.mozilla.org  
Email: bk@co60.ca  
Bugzilla: :co60ca  

Eric Desjardins  
Email: ericd@dal.ca  
Bugzilla: :ericd  
