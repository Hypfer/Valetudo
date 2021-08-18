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

If you're using an S5 or V1, the recommended way to upgrade Valetudo is to flash a new image. This requires you to have SSH access to the robot.

1. Select the `Build for manual installation (requires SSH to install)` option in [dustbuilder](https://builder.dontvacuum.me/). You will then receive a link to a tar archive by email.
2. Login to your robot via SSH.
3. Download the tar file to the `/mnt/data` folder and extract it:
```sh
cd /mnt/data
wget <url to tar from dustbuilder>
tar xf <file.tar>
```
4. The robot has two systems, you cannot update a system whilst it is in use. You will be in system A by default, allowing you to update system B. Update system B (from system A) then reboot into system B:
```sh
./install_b.sh
reboot
```
5. Reconnect to your robot via SSH. You'll now be in system B, allowing you to update system A. Update system A (from system B) then reboot back into system A for normal operation:
```sh
./install_a.sh
rm -f <file.tar>
reboot
```

Your robot should now be running the latest version.

---

You can also stop the Valetudo service by running `/etc/init/S11valetudo stop`, and then replace the binary via scp + reboot or restart the service.

Just make sure that you try a full reflash **if you encounter any issues such as "No Map Data" or disappearing settings**.

If you don't have ssh available, you will need to do a full factory reset to re-enable OTA updates on supported robots, and then follow the initial installation procedure.

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

## Upgrading Dreame vacuums

1. SSH into the vacuum and kill valetudo: `killall valetudo`
2. Replace the old Valetudo binary in `/data/valetudo` with the new one
   - `wget https://github.com/Hypfer/Valetudo/releases/latest/download/valetudo-armv7 -O /data/valetudo`
   - Make sure to use the lowmem version if you have a D9.
   - If you get a "Text file busy" error, it means Valetudo is still running. Try to kill it again.
   - If the issue still occurs, delete the old binary before uploading the new one
3. Reboot your vacuum: `reboot`
