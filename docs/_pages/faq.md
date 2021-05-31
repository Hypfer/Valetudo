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

#### How do I install a different language sound pack?

The python-miio project offers a commandline tool to communitcate with the robot. This can upload a language pack and install the sound file in your preferred language.

1. Download the language pack

   Go to [https://dontvacuum.me/robotinfo/](https://dontvacuum.me/robotinfo/) and check out the links in "Soundfiles" column.

2. Setup python-miio

   For this the following packages need to be installed:

   * python3
   * python3-pip
   * python3-venv

   Setup a python virtual env:

       mkdir miio
       cd miio
       python3 -m venv venv

   Install python-miio:

       source venv/bin/activate
       pip3 install wheel
       pip3 install python-miio

   Now you can install the sound pack with:

       mirobo --ip <ip> --token <token> install-sound /path/to/<lang>.pkg

#### Where do I find the log file?

    tail -f /var/log/upstart/valetudo.log

#### How can I get the token from the robots FileSystem?

`printf $(cat /mnt/data/miio/device.token) | xxd -p`


#### No map displayed
Since v0.3.0 Valetudo now use the cloud interface and that requires the robot to be provisioned (wifi configured). Therefore, the map will not be displayed in AP mode! Ensure you added your device to your own wifi network.
In AP mode, a map will nevertheless be created, that map can later be displayed once connected to the wifi network.

#### My map does not persist / zone co-ordinates change

By default, the robot will generate a new map on each clean, and it is likely
this will void any saved zones.

For Gen1, the only way to mitigate this is to not use full cleans, as the feature
to save maps [is not supported](https://github.com/dgiese/dustcloud/issues/211#issuecomment-491733796).
Perform a full clean once for the map to be created, then create zones that you
can use individually.

For Gen2, you can enable persistent maps on the device by opening up Valetudo, navigating to Settings > Persistent data and
enabling the feature.

It's also possible to do this using the `python-miio` library:

```sh
mirobo --ip <ip> --token <token> raw-command set_lab_status 1 # Enabling the lab status allows advanced commands to be issued
mirobo --ip <ip> --token <token> raw-command save_map # Enable persistent maps!
```

#### What is the "Sensor" consumable?
The sensors don't wear out, but Xiaomi recommends cleaning them after each 30 hours of vacuuming as they collect dust. This includes four cliff sensors on the bottom and the wall sensor on the side of the robot. Just reset the sensor consumable after cleaning.

#### Why am I seeing timeouts when I'm trying to flash my roborock vacuum?
Flashing via the local OTA method is only possible with older firmwares, since newer ones don't allow that anymore.

If your robot is older than 2019-09, you can simply factory reset and then install Valetudo.

However if your robot is newer and already came with a non-flashable firmware from the factory,
you're pretty much out of luck.
Installing Valetudo on such devices requires disassembly and thus voiding the warranty.
