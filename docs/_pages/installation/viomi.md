---
title: Viomi
category: Installation
order: 11
---
# Viomi

These pages guide you through the installation steps for viomi robots.
Support is still somewhat experimental, [see below](#current-state-of-viomi-support) for details.

The default settings here will be for running Valetudo on the robot itself.
If you want to develop as well, check out the [Local Development section](#local-development-setup).

There’s a tool that aims to automate rooting and Valetudo installation at
https://github.com/rumpeltux/viomi-rooting/.
Please give it a try and [file any issues that you encounter there](https://github.com/rumpeltux/viomi-rooting/issues).

## Current state of viomi support

*   Cloud & local connection work.
*   Reading basic status properties work though the rendering within the web UI
    may not always be accurate.
*   Room & zone cleaning works, along with pause & stop buttons.
*   Zone editing works, but not room editing.
*   Automatically (de)selects mopping if a mop is (un)installed.
*   Map upload should be working. Failed attempts to parse maps are stored in `/tmp`.
    If you encounter such an instance, please file a bug and share the map file.
*   Some of the UI actions don't work
    *   Spot Cleaning (at current location)
    *   Goto (starts spot cleaning at target location)
    *   Find (locate robot)

As end users you can start using this, but beware of rough edges.

### Remaining Items (TODOs)

The follow are nice to have additions:

* Improve / automate installation procedure.
* Implement more of the `MiioVacuum` commands for `Viomi`
* More decoupling: move `Roborock` specific result handling from MQTT & Webserver into Roborock.
* Improve viomi map parser (current `Pose` seems to actually be the outline of detected rooms).
* Add multifloor support to the UI.

## Robot setup

First, you need to [get root access to your Robot](https://github.com/rumpeltux/viomi-rooting/).

If you decide to install Valetudo manually, you’ll need to set up the robot to talk to your host
instead of the xiaomi cloud:

```shell
ssh root@vacuum
for domain in "" de. ea. in. pv. ru. sg. st. tw. us.; do
  echo "203.0.113.1 ${domain}ot.io.mi.com ${domain}ott.io.mi.com" >> /etc/hosts
done
cat >/etc/rc.d/S51valetudo <<EOF
#!/bin/sh
iptables         -F OUTPUT
iptables  -t nat -F OUTPUT
# for local development enter your local development host here
# and change port to 8080
dest=127.0.0.1
port=80
for host in 203.0.113.1 203.0.113.5; do
  iptables  -t nat -A OUTPUT -p tcp --dport 80   -d \$host -j DNAT --to-destination \$dest:\$port
  iptables  -t nat -A OUTPUT -p udp --dport 8053 -d \$host -j DNAT --to-destination \$dest:8053
  iptables         -A OUTPUT                     -d \$host/32  -j REJECT
done
EOF
chmod +x /etc/rc.d/S51valetudo
reboot
```

Note: To temporarily revert this while needing to use the Mi Home App,
you can do a `iptables -F; iptables -F -t nat` and comment out the line in `/etc/hosts`.

## Deploying

Run

    npm run build

And deploy the `valetudo` binary to your robot:

    scp valetudo root@vacuum:/mnt/UDISK/

    # Setup init scripts (only needed once and only if not already done by rooting script)
    (cd deployment/viomi; tar cv . | ssh root@vacuum "cd /; tar x")

## Local Development Setup

Follow the [development guide](https://valetudo.cloud/pages/development/building-and-modifying-valetudo.html)
in spirit, but note that path names etc. may be different.
You can get the required settings by doing `cat /etc/miio/device.conf` and 
`cat /etc/miio/device.token` on the robot.

## Firmware updates

You can perform firmware updates up to v3.5.3_0047 without risking root (see the
[firmware update analysis](https://itooktheredpill.irgendwo.org/2020/viomi-firmware-update-analysis/)
for details).

**Important:** Make sure you use ssh-keys and don't rely on password login
otherwise your root access may be lost.

To perform a firmware upgrade you currently need to:

*   [uninstall Valetudo](#uninstall-valetudo) (because the diskspace is needed for the upgrade) and
*   use the Xiaomi Home App to perform the upgrade (because upgrades are
    unsupported by Valetudo / only supported via cloud interface and there's
    no public source for the binaries in the first place).
*   [reinstall Valetudo](#deploying)

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
