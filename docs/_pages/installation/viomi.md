---
title: Viomi
category: Installation
order: 11
---
# Development Instructions for Viomi

Current state of viomi support:

*   Cloud & local connection work.
*   Reading basic status properties work though the rendering within the web UI
    may not always be accurate.
*   Map upload should be working. Failed attempts to parse maps are stored in `/tmp`.
    If you encounter such an instance, please file a bug and share the map file.
*   Some of the UI actions don't work
    *   Spot Cleaning (at current location)
    *   Goto (starts spot cleaning at target location)
    *   Find (locate robot)
    *   Setting suction, enabling mop mode etc.

As end users you can start using this, but beware of rough edges.

## Remaining Items (TODOs)

The follow are nice to have additions:

* Improve / automate installation procedure.
* Implement more of the `MiioVacuum` commands for `Viomi`
* More decoupling: move `Roborock` specific result handling from MQTT & Webserver into Roborock.
* Improve viomi map parser (current `Pose` seems to actually be the outline of detected rooms).
* Add multiroom support to the UI.

## Robot setup

First, you need to [get root access to your Robot](https://itooktheredpill.irgendwo.org/2020/rooting-xiaomi-vacuum-robot/).

Then, set up the robot to talk to your host instead of the xiaomi cloud:

```shell
ssh root@viomi
echo "110.43.0.83 ot.io.mi.com ott.io.mi.com" >> /etc/hosts
cat >/etc/rc.d/S51valetudo <<EOF
#!/bin/sh
iptables         -F OUTPUT
iptables  -t nat -F OUTPUT
dest=192.168.1.10  # enter your local development host here
for host in 110.43.0.83 110.43.0.85; do
  iptables  -t nat -A OUTPUT -p tcp --dport 80   -d $host -j DNAT --to-destination $dest:8080
  iptables  -t nat -A OUTPUT -p udp --dport 8053 -d $host -j DNAT --to-destination $dest:8053
  iptables         -A OUTPUT                     -d $host/32  -j REJECT
done
EOF
chmod +x /etc/rc.d/S51valetudo
reboot
```

Note: To temporarily revert this while needing to use the Mi Home App,
you can do a `iptables -F; iptables -F -t nat` and comment out the line in `/etc/hosts`.

## Valetudo setup

You can get the values for the following by doing `cat /etc/miio/device.conf` and 
`hexdump -C /etc/miio/device.token | cut -b 10-60 | head -n1 | sed 's/ //g'` on the robot.

Put those into `develop/local/env`, e.g.:

```shell
export VAC_WEBPORT=8080
export VAC_ADDRESS=192.168.1.11
```

Update the `Configuration.js` file, change these settings:

    "spoofedIP": "110.43.0.83"
    "map_upload_host": "http://110.43.0.83"

Then run

    ./develop/run

## Deploying

Do build the binary for the viomi (which runs on OpenWRT with musl libc), you need a corresponding build for pkg.

    mkdir -p ~/.pkg-cache/v2.5
    (cd ~/.pkg-cache/v2.5; wget https://github.com/robertsLando/pkg-binaries/raw/master/arm32/fetched-v10.4.1-alpine-armv6)

Now you can run

    npm run build_viomi

And deploy the `valetudo` binary to your robot:

    scp valetudo root@vacuum:/mnt/UDISK/

    # Setup init scripts (only needed once)
    (cd deployment/viomi; tar cv . | ssh root@vacuum "cd /; tar x")

## Firmware updates

You can perform firmware updates up to v3.5.3_0046 without risking root (see the
[firmware update analysis](https://itooktheredpill.irgendwo.org/2020/viomi-firmware-update-analysis/)
for details). Make sure you use ssh-keys and don't rely on password login.

For this you currently need to:

*   uninstall Valetudo (because the diskspace is needed for the upgrade) and
*   use the app to perform the upgrade (because upgrades are unsupported by
    Valetudo / only supported via cloud interface and there's no public source
    for the binaries in the first place).

## Uninstall Valetudo

This will remove Valetudo, free the diskspace and re-enable the cloud interface.

```shell
ssh root@vacuum
/etc/init.d/valetudo stop
rm /etc/rc.d/S51valetudo /etc/init.d/valetudo /mnt/UDISK/valetudo
```

## Enable logging

Add the following to the `system` section in `/etc/config/system` (adjust ip and port as necessary):

	option log_ip 192.168.1.10
	option log_port 8054
	option log_proto tcp

After a reboot you can receive logs using netcat:

    netcat -l4 8054

See the [OpenWrt Runtime Logging Guide](https://openwrt.org/docs/guide-user/base-system/log.essentials)
for details.
