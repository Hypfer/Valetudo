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

There’s a [tool to automate rooting and Valetudo installation](https://github.com/rumpeltux/viomi-rooting/).

Please give it a try and [file any issues that you encounter there](https://github.com/rumpeltux/viomi-rooting/issues).

## Robot setup

First, you need to [get root access to your Robot](https://github.com/rumpeltux/viomi-rooting/).

If you decide to install Valetudo manually, you’ll need to set up the robot to talk to your host
instead of the xiaomi cloud:

```shell
ssh root@vacuum
sed -i 's/110.43.0.8./127.00.00.1/g' /usr/bin/miio_client
for domain in "" de. ea. in. pv. ru. sg. st. tw. us.; do
  echo "127.0.0.1 ${domain}ot.io.mi.com ${domain}ott.io.mi.com" >> /etc/hosts
done
reboot
```

## Deploying

Run

    npm run build

And deploy the `valetudo` binary to your robot:

    scp valetudo root@vacuum:/mnt/UDISK/

    # Setup init scripts (only needed once and only if not already done by rooting script)
    (cd deployment/viomi; tar cv . | ssh root@vacuum "cd /; tar x")

## Local Development Setup

Follow the [development guide](https://valetudo.cloud/pages/development/building-and-modifying-valetudo.html).

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
rm /etc/init.d/valetudo /mnt/UDISK/valetudo
rm /overlay/usr/bin/miio_client
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
