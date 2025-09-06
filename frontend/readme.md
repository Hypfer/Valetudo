# Valetudo Frontend

This is the new Valetudo Frontend written in React

## Getting started

As it's much easier to work with a real Valetudo instead of a mock server, this project uses `cra-build-watch` to allow
us to do just that. See also: https://github.com/facebook/create-react-app/issues/1070

To work on this, it is recommended to spin up a local Valetudo instance (e.g. by using the MockValetudoRobot implementation)
and then running `npm run watch` in this folder.
That will start webpack watch. When it's done doing the initial build, you can reach the frontend in your browser.
