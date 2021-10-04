---
title: FAQ
category: Misc
order: 30
---
# Frequently asked questions

## Why the name?

Valetudo is the roman name for the greek goddess Hygieia which is the goddess of health, cleanliness and hygiene. Also I'm bad at naming things.

## Are there still random factory resets? <a name="random-factory-resets"></a>

No. We know what caused them, and it's not happening anymore.

To add some context:<br/>
Roborock V1 and Roborock S5 up to firmware version 1898 hat an issue with random factory resets.
This only applies to these two models of vacuum robot. Nothing else.

Those resets were caused by the watchdog of the firmware sometimes noticing that there was less free ram than expected, due to
Valetudo running on the vacuum. This set a "broken" flag for the partition and if on the daily reboot both system A and B were flagged,
the robot would reset itself to factory defaults.

This isn't happening anymore on the S5 FW 2008+ due to roborock having optimized their software quite significantly
so that they could manufacture the S5 Max with only 256MB RAM as opposed to the 512MB on the S5.

However we've also found a mitigation which prevents this issue from appearing on the V1 which hasn't yet received the
new and memory-optimized roborock firmware code.

If you build your firmware with the fix reset option (on by default), it will contain a script that on each reboot checks
both System A and System B for the "broken" flag and unsets that.

Therefore, it will never have two "broken" flags, unless stuff is _actually_ broken.

## Where do I configure the Timezone?

The timezone on the device **cannot** be changed. It is always UTC.

Every feature in Valetudo that uses time will automatically use the local time reported by your browser. This means you do not have to worry about it. It is handled by the application itself.

The only instance where the time is relevant, is when looking at the Valetudo logs, which are in UTC (as mentioned above).

On the other hand, when travelling aboard, please be aware that the local time will be different than where the robot is hosted. Keep this in mind.

## Vendor-specific FAQ

### Roborock

#### Is it possible to remove Valetudo from my robot completely?

Yes. Simply reset your robot to factory defaults.

#### Can I still use the Mi Home app after installing Valetudo?

No. Valetudo removes the connection to Xiaomi's cloud, which the Mi Home app relies on, and thus it won't work anymore. This is by design to improve your privacy. You should be able to do anything you want to do, also on phones, by just connecting to your vacuum's IP address through your browser. It will open an user-friendly control interface.

#### Why does my robot speak Chinese?

Because it's language is set to Chinese!

Edit `/mnt/default/roborock.conf` and change `language=prc` to `language=en`.

**NEVER EDIT THIS FILE ON AN S5 MAX OR NEWER**

Starting with the S5 Max, Roborock started signing the config files to prevent people from bypassing the region lock.
Your robot will stop working if the signature doesn't match.

Simply changing back whatever you edited is **not enough** to get it back to a working state due to invisible characters
like newlines being automatically replaced by your editor.

You have been warned.

#### Why am I seeing timeouts when I'm trying to flash my roborock vacuum?
Flashing via the local OTA method is only possible with older firmwares, since newer ones don't allow that anymore.

If your robot is older than 2019-09, you can simply factory reset and then install Valetudo.

However if your robot is newer and already came with a non-flashable firmware from the factory,
you're pretty much out of luck.
Installing Valetudo on such devices requires disassembly and thus voiding the warranty.
