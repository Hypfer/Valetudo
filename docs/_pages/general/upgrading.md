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

### S5, V1 and S6
If you're using an S5 or V1, the recommended way to upgrade Valetudo is to flash a new image.

The easiest way to do that is to select the `Build for manual installation (requires SSH to install)` option in the
dustbuilder. You will then receive a link to a tar archive.

The installation procedure is pretty much straightforward. You just need to put your archive onto your robots `/mnt/data`
either by running `wget` on it directly or by using `scp`, extract it using `tar xf` and running the correct install-script,
which should usually be `install_b.sh`, since during normal operation, the robot will use `system_a`.

After the installer has finished, reboot.
You should now be on `system_b` and therefore run `install_a.sh` to complete the upgrade procedure.

After that is done, don't forget to delete the update files from `/mnt/data` using `rm`

However, you can of course also just stop the service by running `/etc/init/S11valetudo stop` and then replace the binary via scp + reboot or restart the service.

Just make sure that you try a full reflash if you encounter any issues such as "No Map Data" or disappearing settings.

If you don't have ssh available, you will need to do a full factory reset to re-enable OTA updates on supported robots 
and then follow the initial installation procedure

## Upgrading Viomi vacuums

1. SSH into the vacuum and kill valetudo: `killall valetudo`
2. Replace the old Valetudo binary in `/mnt/UDISK/valetudo` with the new one
   - If you get a "Text file busy" error, it means Valetudo is still running. Try to kill it again.
   - If the issue still occurs, delete the old binary before uploading the new one
3. If your init script (`/etc/init.d/valetudo`) is outdated or different than the one in this repository
   ([`deployment/viomi/etc/init.d/valetudo`](https://github.com/Hypfer/Valetudo/blob/master/deployment/viomi/etc/init.d/valetudo)),
   you need to update it as well
   1. Run `/etc/init.d/valetudo disable`
   2. Ensure that no files with "valetudo" in the name are still present under `/etc/rc.d`. If there are any, delete
      them.
   2. Upload the new init script to `/etc/init.d/valetudo`
   3. Run `/etc/init.d/valetudo enable`
4. Reboot your vacuum: `reboot`