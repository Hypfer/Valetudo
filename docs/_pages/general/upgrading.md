---
title: Upgrading
category: General
order: 9
---
# Upgrading Valetudo
If you're a long time user of Valetudo, you will probably at some point want to upgrade to a newer Valetudo version.

The release notes of a new version can always be found in the releases section.


This information will most likely become outdated rather quickly so make sure to check this page on each update.


## Upgrading Roborock Vacuums
### The recommended way
Since we're still seeing changes and fixes to the image building process for these devices,
it is recommended to reflash a new firmware on each Valetudo upgrade.

Your settings will not be reset by this. Still, it's always recommended to make a backup beforehand.
See [Files to backup](../important-files-and-folders.html) for this.

### Alternate approaches

If you for some reason do not want to reflash your vacuum, it's also possible to stop the Valetudo service, scp the new binary to `/usr/local/bin/valetudo` and start the service or reboot.

There are different commands to do so depending on your firmware version. e.g. `service valetudo stop` or `/etc/init/S11valetudo stop`.
