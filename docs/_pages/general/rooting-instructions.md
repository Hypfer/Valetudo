---
title: Rooting instructions
category: General
order: 9
---
# Rooting instructions

This page contains an incomplete overview of installation instructions for various robots

## Roborock

For more information, simply click on the link if there is one.
Overall, things got harder as time went by.

### OTA

The ***O**ver-**t**he-**A**ir[-Update]* rooting method is the easiest one requiring no disassembly nor attaching any cables. However, since Xiaomi disabled local OTA in newer versions of the `miio_client` (> 3.3.9), you might need to downgrade your firmware by factory resetting your robot.

Unfortunately, robots made after 2020-03 come with a non-local-OTA capable recovery firmware version so for those robots
you will need to follow the instructions below.

This works by using the official OTA update mechanism to push a customized (rooted + valetudo) firmware image to the robot.
It will happily accept that, because they aren't signed. For more information, check out the talk
[Unleash your smart-home devices: Vacuum Cleaning Robot Hacking](https://media.ccc.de/v/34c3-9147-unleash_your_smart-home_devices_vacuum_cleaning_robot_hacking). 


The procedure is documented here: [https://valetudo.cloud/pages/installation/roborock-ota.html](https://valetudo.cloud/pages/installation/roborock-ota.html)

This method applies to the following robots:
* Roborock V1 pre 2020-03
* Roborock S5

### Vinda

The vinda file method unfortunately requires full disassembly of the robot as well as soldering some wires which will
void your warranty.

In short, there's a file called `vinda` which contains the root password XOR'd with `0x37`.
By dropping into the u-boot shell, you can use the `ext4load` u-boot command usually used for loading a kernel to load
that file into memory and therefore read out the root password.

Then, you simply use an interactive shell via UART to achieve persistence.

Dennis made two videos explaining both disassembly as well as the actual root procedure.
They can be found here: [https://www.youtube.com/playlist?list=PL9PoaNtZCJRZc61c792VCr_I6jQK_IdSb](https://www.youtube.com/playlist?list=PL9PoaNtZCJRZc61c792VCr_I6jQK_IdSb)

This method applies to the following robots:
* Roborock V1 post 2020-03
* Roborock S6 pre 2020-06 (?)
* Roborock S4

Don't be confused by the Video not mentioning your particular robot model.
It's the same procedure for all robots listed here.

Also, your robot might come with a newer firmware which doesn't feature a `vinda` file.
In that case, you'll need to follow the instructions below.

### Init override

Since there's no `vinda` file on these robots/firmwares, the approach here is to drop into the u-boot shell and edit the
kernel commandline so that `init` becomes `/bin/sh` which also gives you a rootshell, but requires you to quickly do some
initializing, because otherwise the hardware watchdog will reboot the robot.

Furthermore, due to limited storage, the new firmware is actually streamed onto the device.

The disassembly process plus the testpoints used are the same as the vinda method above so make sure to watch those videos
before attempting this.

The procedure is documented here: [https://builder.dontvacuum.me/s5e-cheatsheet.txt](https://builder.dontvacuum.me/s5e-cheatsheet.txt)

This method applies to the following robots:
* Roborock S6 post 2020-06 (?)
* Roborock S5 Max
* Roborock S6 Pure
* Roborock S4 Max

## Dreame

Dreame rooting is currently possible for

* Xiaomi Vacuum Robot 1C
* Dreame F9
* Dreame D9
* Xiaomi Vacuum Robot 1T
* Dreame L10 Pro
* Dreame Z10 Pro

It has been released with Dennis Giese's DEF CON 29 Talk [Robots with lasers and cameras but no security Liberating your vacuum](https://youtu.be/EWqFxQpRbv8?t=1525).
For more information, head over to the [Dustbuilder](https://builder.dontvacuum.me/).

It is also recommended to join the [Dreame Robot Vacuum Telegram Usergroup](https://t.me/joinchat/VwEy4UeBrf45MTZi) for rooting support etc.

### Reset-Button UART

**Dreame is aware of this and might patch it in newer firmwares. Therefore, don't update your robot**

There are other ways to root as well, however this one is very easy and very reliable so use that if you can.
What we're doing is basically just injecting a custom OTA update including hooks for valetudo, and sshd etc.

To do this, you'll only need a pry tool, and a 3.3V USB UART Adapter (Like CP2102 or Pl2303) as well as basic linux knowledge.

Pressing the Wi-Fi Reset Button under the Lid for less than 3s will spawn a shell on the UART that is available via the
Debug Port that can be found below the plastic cover.

Check out Dennis' Talk (Slides at 28:00 and 28:30) on how to get to that connector, take it slow, this is probably the hardest step.

Once you have the cover open, connect your USB UART adapters as following, TX(adapter) -> RX(robot), RX(adapter) -> TX(Robot), GND -> GND and plug it into your laptop.
Make sure your device is docked since this will be needed in the next step.

Now you have to open a serial connection from your laptop to the device, this can be done with putty or through a tool like screen with the following command: `screen /dev/ttyUSB0 115200,ixoff`. 

When connected, you can log in as `root`.
To calculate the password use the full serial number of your robot, which can be seen on the sticker below the dustbin. 

To get the password, enter the full SN all uppercase into this command
`echo -n "P20290000US00000ZM" | md5sum | base64` or use the following [Calculator](https://gchq.github.io/CyberChef/#recipe=Find_/_Replace(%7B'option':'Regex','string':'(%5C%5Cn%7C%5C%5Cr)'%7D,'',true,false,true,false)MD5()Find_/_Replace(%7B'option':'Regex','string':'$'%7D,'%20%20-%5C%5Cn',false,false,false,false)To_Base64('A-Za-z0-9%2B/%3D')&input=UDIwMDkwMDAwRVUwMDAwMFpN)

When logged in, build a patched firmware image for manual installation via the dustbuilder, download it on your laptop,
spin up a temporary webserver (e.g. by using `python3 -m http.server`) in the directory where you downloaded your firmware image to, connect the laptop to the robots Wi-Fi access point
and download the firmware image to the robot via e.g. `wget http://<your-laptop-ip>/dreame.vacuum.p2028_fw.tar.gz`.

Verify the md5 hash is correct by running `md5sum dreame.vacuum.p2028_fw.tar.gz` and comparing it to the md5 hash dustbuilder provides.

Then, untar `tar -xvzf dreame.vacuum.p2028_fw.tar.gz` it and execute the `./install.sh` script. Note that the robot needs to be docked during that.
The robot will then reboot and greet you with a shell mentioning the dustbuilder in the MOTD.

Switch to the tmp folder `cd /tmp` and repeat the previous steps (from wget to install.sh) to also install the firmware on the second partition which you are now booted to.

After that, check out the `/misc/how_to_modify.txt`, copy the `_root_postboot.sh.tpl` to `/data` (`cp /misc/_root_postboot.sh.tpl /data/_root_postboot.sh`), make it executable (`chmod +x /data/_root_postboot.sh`),
put a matching Valetudo binary for your robot in `/data` (same webserver wget thing as above), call it `valetudo` and make that executable (`chmod +x valetudo`).

To select the correct Valetudo binary for your robot, refer to this list:

* valetudo (1C, F9, Z500)
* valetudo-lowmem (D9)
* valetudo-aarch64 (everything else, Dreame Z10 Pro requires version 2021.09.0 or later)

Reboot, connect to the robots Wi-Fi AP again, open up a browser, point it to `http://192.168.5.1` and then set up Wi-Fi via Valetudo.
Don't be confused by the UI not loading the state. The robot needs to be provisioned (connected to a Wi-Fi) for that to work.

You now have a rooted Dreame vacuum robot running Valetudo.

It is recommended to now back up your calibration and identity data. One way of doing that is by creating a tar
like so: `cd / ; tar cvf /tmp/backup.tar /mnt/private/ /mnt/misc/` and then using `scp root@<robot-ip>:/tmp/backup.tar .` to copy it to a safe location
that isn't the robot.

## Viomi

3irobotix is the manufacturer of vacuum robots sold under various brand names including
- Viomi 
- Cecotec
- Prosenic
- Kyvol
- Neabot

For now, only one vacuum robot is supported (WIP):
* Mijia STYJ02YM **viomi.vacuum.v7**

To install Valetudo on your Viomi V7, follow the instructions found [here](https://valetudo.cloud/pages/installation/viomi.html).

We're currently looking into the possibility of reflashing other brands to Viomi so that they work with Valetudo without
any additional code.
