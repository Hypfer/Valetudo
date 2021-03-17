---
title: Upgrading
category: General
order: 10
---
# Upgrading Valetudo
If you're a long time user of Valetudo, you will probably at some point want to upgrade to a newer Valetudo version.

The release notes of a new version can always be found in the releases section.


This information will most likely become outdated rather quickly so make sure to check this page on each update.


## Upgrading Roborock Vacuums

### S5 and V1
If you're using an S5 or V1, the recommended way to upgrade Valetudo is to flash a new image.

However, you can of course also just stop the service by running `/etc/init/S11valetudo stop` and then replace the binary via scp + reboot or restart the service.

Just make sure that you try a full reflash if you encounter any issues such as "No Map Data".
