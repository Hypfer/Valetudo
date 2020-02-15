For local testing use the following environment variables:

* VAC_ADDRESS
* VAC_WEBPORT

For a more detailed guide, see also [develop/HOWTO.md](develop/HOWTO.md).

## Fake Robot

`fakerobot.js` implements a minimal and incomplete interface that mimics the
Robot’s native interface. To use it point to `export VAC_ADDRESS=127.0.0.1`
and run:

    node -r esm fakerobot.js