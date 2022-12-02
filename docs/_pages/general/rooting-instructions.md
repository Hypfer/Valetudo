---
title: Rooting instructions
category: General
order: 12
---
# Rooting instructions

This page contains an incomplete overview of installation instructions for various robots.

## Requirements

### Skills

Rooting robots is an advanced topic the same way working on a car, your electrical installation or any complex machinery is.
All these things require prior knowledge before attempting to do them or else they may fail catastrophically killing you and/or other people in the process.

While messing up the robot root procedure likely won't harm you, it may still cause a **permanently bricked robot** or
at least annoy the people supporting other Valetudo users in their free time.

Thus, to safely root your robot and install Valetudo, you will need prior knowledge in:
- GNU+Linux-based operating systems
- usage of a text-based shell (the Terminal)
- an understanding of how networks work, what an IP address is, what a webserver is, etc.
- and more.

If you don't know these and don't want to research them yourself, consider asking a friend, relative, colleague or your
nearest computer repair shop for help as teaching these basics is beyond the scope of the Valetudo docs.

It's also not feasible, since different people might start with different knowledge and therefore would require different information.
We can't mirror half of Wikipedia here.


### Software

This guide expects you to run some **GNU+Linux distribution** such as Debian, Fedora, Arch, Ubuntu or similar.
You don't have to install it. Booting from a live USB/DVD will be sufficient.

If you're running **Windows**, usage of the Windows Subsystem for Linux (WSL) is also often possible. If you haven't heard of that yet,
I'd strongly suggest researching it. It's basically the best of both worlds.

**MacOS** is not supported and will cause all sorts of trouble during some rooting procedures due to e.g., the `md5sum` command
behaving differently from the one that you'd find in most linux distributions.

## General high-level notes on rooting

Because understanding what you're doing and why you're doing it is desirable in a world full over overly complex black boxes
that almost no one even bothers to understand (e.g. k8s), here's a short overview on how vacuum robot rooting works.

While the exact procedures vary greatly based on the device in question, the general ideas behind the different rooting methods is always the same.

Please note that this overview is greatly oversimplified and mostly describes what you - the user - does during rooting.
There's much more to the whole process of rooting a previously unknown vacuum robot.
Figuring out each of these (and more!) steps does take a very long time and tons of work.

### 1. Gain write access to the system storage

First, we need some way of writing to the system storage.
Most of the time this means getting a root shell on the vendor firmware either through exploits or backdoors or similar.
Sometimes, there can also be a SoC bootrom that allow such kind of write access independent of the OS.

As a last resort, it's also sometimes possible to desolder the storage chip entirely and program it outside of the system.
That is of course very advanced and something that most people can't do.

During research for a new root, the challenging parts here are usually stuff such as encryption, signed filesystems,
signed executables, finding vulnerabilities/exploits, getting them to work reliably and easy to use etc.

### 2. Achieve persistence

Once we have a way to write to the system storage, we can leverage that to open up easier ways of getting to that point.

This usually means setting up something that exploits a vulnerability on startup, changing the root password to something known,
spawning a (password-less) shell on some UART or deploying an SSHd or a very retro telnetd with a known or no password.

During research for a new root, the challenging parts here are usually the same as above. Encryption, signed filesystems,
signed executables but also stuff such as firewalls, missing libraries and more

### 3. Do the thing

Now that we have full and easy access to the system, we can finally do what we came there for.

This means deploying Valetudo, figuring some way of running it on system start, modifying the vendor software so that it stops talking to the cloud and more

During research for a new root, the challenging part here is understanding the whole business logic of the robots operating system
and of course getting it to work without the cloud.
Sometimes, previous knowledge from other robots can be reused while in other situations you'll start reverse engineering from scratch.


## Dreame

Dreame rooting is currently possible for

* Dreame L10 Pro
* Dreame Z10 Pro
* Dreame W10
* Dreame F9
* Dreame D9
* Dreame D9 Pro
* Xiaomi Vacuum Robot 1C
* Xiaomi Vacuum Robot 1T
* Mova Z500
* Dreame P2148 Xiaomi Mijia Ultra Slim

It has been released with Dennis Giese's DEF CON 29 Talk [Robots with lasers and cameras but no security Liberating your vacuum](https://youtu.be/EWqFxQpRbv8?t=1525).
For more information, head over to the [Dustbuilder](https://builder.dontvacuum.me/).

It is also recommended to join the [Dreame Robot Vacuum Telegram Usergroup](https://t.me/+L4lvcdTo8sUwZDVi) for rooting support etc.

### Reset-Button UART

**This was patched in many new firmwares. Do NOT update your robot via the Mi Home app if you want to root.**

There are other ways to root as well, however this one is very easy and very reliable so use that if you can.
What we're doing is basically just injecting a custom OTA update including hooks for valetudo, and sshd etc.

To do this, you'll only need a 3.3V USB to TTL Serial UART Adapter (like CP2102 or Pl2303) and dupont cables. Basic linux knowledge and a pry tool will help as well.

<div class="alert alert-tip" role="alert">
  <p>
    <strong>Note:</strong><br/>
    If this doesn't work on your robot, and it is an 1C, D9, F9 or Z500, your firmware might be too old.
    In that case, try <a href="https://gist.github.com/stek29/5c44244ae190f3757a785f432536c22a" rel="noopener" target="_blank">this guide</a>.
  </p>
</div>

![How to open a Dreame](./img/how_to_open_a_dreame.jpg)

To open the robot, gently pry up with a pry tool or your fingers on the smaller half with the buttons. Taking this plastic off is probably the hardest step.

Once you have the cover off, you need to connect your USB to Serial UART adapter to the robot. Make sure your adapter is set to 3.3V if has the option to change to something else.
You only need 3 wires for this connection (GND, RX, and TX).
Connect GND on the adapter to any of ground ports on the robot first and then connect RX on the adapter to TX on the robot and TX on the adapter to RX on the robot. Lastly, plug the adapter into your laptop.


![Dreame Debug Connector](./img/dreame_debug_connector.jpg)

Now you have to open a serial connection from your laptop to the device, this can be done with putty, miniterm, minicom or through a tool like screen with the following command: `screen /dev/ttyUSB0 115200,ixoff`.
The baud rate is 115200 and flow control (XIN, XOUT) needs to be off.
Your user also needs to have permission to access `/dev/ttyUSB0` which usually either means being root or part of the `dialout` group.
If your tool supports it, activate logging of the session to a file, for screen use `screen -L /dev/ttyUSB0 115200,ixoff`, for putty go to Session -> Logging and activate "All session output". When you execute the commands
to backup the calibration and identity data (see below) the output will be saved to the log file. Make sure to check the log file and store it in a secure place.

Once your connection is ready, turn on the vacuum by pressing and holding the middle button (POWER) for at least 3 seconds. 

You should see some logs and one of the last ones will say root password changed.
If you instead see some random characters, check your cabling.

To use the Wifi Reset method, open up the other side of the robot and press the reset button shortly (<1 second) with a pen or paperclip.
Your UART connection should pop up with the login prompt like `"p2029_release login”`

When connected, you can log in as `root` and then it will ask for a password.
To calculate the password use the full serial number of your robot, which can be found on the sticker below the dustbin.
**Not the one on the bottom of the robot nor the one on the packaging. You'll have to take out the dustbin and look below it into the now empty space.**

![Dreame Dustbin Sticker](./img/dreame_dustbin_sticker.jpg)

To get the password, use the following [Calculator](https://gchq.github.io/CyberChef/#recipe=Find_/_Replace(%7B'option':'Regex','string':'(%5C%5Cn%7C%5C%5Cr)'%7D,'',true,false,true,false)MD5()Find_/_Replace(%7B'option':'Regex','string':'$'%7D,'%20%20-%5C%5Cn',false,false,false,false)To_Base64('A-Za-z0-9%2B/%3D')&input=UDIwMDkwMDAwRVUwMDAwMFpN) 
or enter the full SN (all uppercase) into this shell command
`echo -n "P20290000US00000ZM" | md5sum | base64`

Once logged in, build a patched firmware image for manual installation via the [Dustbuilder](https://builder.dontvacuum.me).
**Make sure that both `Prepackage valetudo` and `Patch DNS` are selected before clicking on `Create Job`.**
You will receive an email once it's built. Download the `tar.gz` file from the link in that mail to your laptop.

With the `tar.gz` downloaded, head over to <a href="https://github.com/Hypfer/valetudo-helper-httpbridge" rel="noopener" target="_blank">https://github.com/Hypfer/valetudo-helper-httpbridge</a>
and download a matching binary for your laptops operating system.

Now, connect the laptop to the Wi-Fi Access Point of the robot. If you can't see the robots Wi-Fi AP to connect to, it might have disabled itself because 30 minutes passed since the last boot.
In that case, press and hold the two outer buttons until it starts talking to you.

The next step is to start the utility webserver. On Windows, a simple double-click on the exe should do the trick. **Don't close that window until you're done.**
The server will create a new `www` directory right next to itself as well as print out a few sample commands explaining how to download from and upload to it.

Make sure that it is listening on an IP in the range of `192.168.5.0/24` and then copy the downloaded `tar.gz` to the newly created `www` folder.

<div markdown="1" class="emphasis-box">
<div class="alert alert-important" role="alert">
  <p>
    <strong>Important:</strong><br/>
    Before you continue with the rooting procedure of your robot, please make sure to create a backup of your calibration and identity data to allow for disaster recovery.
</p>
</div>

The easiest way of doing this is by creating a tar archive of everything important and then uploading it to your laptop,
which at this point should be connected to the robots Wi-Fi AP.

To do that, head back to the UART shell and create a tar file of all the required files like so: 

```
tar cvf /tmp/backup.tar /mnt/private/ /mnt/misc/ /etc/OTA_Key_pub.pem /etc/publickey.pem
```

Then, look at the output of the `valetudo-helper-httpbridge` instance you've started previously.
It contains an example curl command usable for uploading that should look similar to this one:

```
curl -X POST http://192.168.5.101:33671/upload -F 'file=@./file.tar'
```

Change the file parameter to `file=@/tmp/backup.tar`, execute the command and verify that the upload to your laptop
was successful. If everything worked out correctly, you should now see a backup.tar with a non-zero size in `www/uploads`.

If you're experiencing issues, make sure that you've specified the correct port.

</div>

After uploading the backup and storing it in a safe place, you can now download the firmware image file that you've
previously put in the `www` directory. `valetudo-helper-httpbridge` will tell you the correct command, which should look
similar to this: 

```
wget http://192.168.5.101:33671/file.tar
```
The `file.tar` part will of course be different.

After downloading the firmware image tar to your working directory (`/tmp`), it should be untared: `tar -xvzf dreame.vacuum.pxxxx_fw.tar.gz`.
Now, make sure that the robot is docked and then run the newly extracted installation script: `./install.sh`.

The robot will install the rooted firmware image and then reboot **on its own**. Please be patient.

After the robot has finished the installation, you should see a new MOTD (message of the day) on your UART shell.
It should look similar to this:

```
built with dustbuilder (https://builder.dontvacuum.me)
Fri 04 Feb 2022 10:08:21 PM UTC
1099
```

If you see that MOTD, the rooting procedure was successful.

You now have a rooted Dreame vacuum robot running Valetudo.

Now continue with the [getting started guide](https://valetudo.cloud/pages/general/getting-started.html#joining_wifi).

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

Also, your robot might come with a newer firmware, which doesn't feature a `vinda` file.
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

### FEL rooting

FEL rooting is the currently recommended method for all NAND-based roborock robots.
Those are:

* S5 Max
* S6 Pure
* S4 Max
* S7
 
<div class="alert alert-warning" role="alert">
  <p>
    <strong>Important:</strong><br/>
    This rooting method is not suited for beginners.<br/>
    If you're inexperienced in linux, hardware, etc., please ask a friend with more experience for help.
</p>
</div>

Essentially, it's booting a live linux image that patches the rootfs on the robot to enable ssh access and then utilize that to install a full rooted firmware image.

While it does not require soldering any wires, the way we get the SoC to let us boot from that live image requires pulling TPA 17 low, which is a test point found
on the underside of the robots mainboard. This means that full disassembly including destruction of all warranty seals is required.

For this root you will need:
* One of the listed NAND-based roborock vacuum robots
* A laptop running linux with `sunxi-tools` installed
* A micro USB cable
* A few screwdrivers
* A jumper wire or a conductive paperclip
* A way to keep track of a lot of different screws


First, head over to the [Dustbuilder](https://builder.dontvacuum.me/) and request a rooted firmware image for your specific robot.
Make sure to select the `Create FEL image (for initial rooting via USB)` option.

Next, download the latest [valetudo-armv7-lowmem.upx binary](https://github.com/Hypfer/Valetudo/releases/latest/download/valetudo-armv7-lowmem.upx).


With the dustbuilder now building your image, you can start the disassembly of the robot until you reach the mainboard.
If you need help on how to do that, there fortunately are a few videos on YouTube. 
Just search for e.g., "s5 max disassembly".

<div class="alert alert-important" role="alert">
  <p>
    <strong>Important:</strong><br/>
    Only disassemble what you absolutely have to disassemble to get to the mainboards underside.<br/>
    Every part you disassemble is a part that could be reassembled incorrectly leading to trouble with the robot.
</p>
</div>

You likely won't have to disconnect all the wires going to the mainboard.
It's enough to disconnect the ones at the front to be able to lift it in a position like this:

![S5e Mainboard FEL root](./img/s5e_mainboard_fel_root.jpg)

By the time you've reached the mainboard, you should've already received a link to download your rooted firmware package from the dustbuilder.

Click on the link and download both the zip and the tar.gz. Those should look similar to this:
```
roborock.vacuum.s5e_1566_fel.zip	2022-12-02 15:11 	4.8M
roborock.vacuum.s5e_1566_fw.tar.gz	2022-12-02 15:08 	26M
```


Now, connect your USB Cable to the robot and your Laptop running Linux.
Then, connect the battery. Do not turn on the robot yet.

![S5e Mainboard testpoint for FEL root](./img/s5e_board_with_testpoint_for_fel.jpg)

Connect the marked TPA17 to GND using your jumper cable or paperclip. You can use anything that is GND. 
The marked SH1 for GND should be close enough to enable you to do the procedure without the help of another person.

Press the power button for 3 seconds and keep the TPA17 connected to GND for 5 more seconds after that.

Now, check that it was successful by running `lsusb`. You should see the following:
```
Bus 001 Device 014: ID 1f3a:efe8 Allwinner Technology sunxi SoC OTG connector in FEL/flashing mode
```

If you don't see that, turn off the robot and try again.
It might be tricky to hold a steady connection while pressing the power button. Consider asking a friend for help.


With the robot showing up on USB as `Allwinner Technology sunxi SoC OTG connector in FEL/flashing mode`, unpack the zip
file, become root enter the directory containing the zips contents and execute the included `run.sh`.

It should look like this:
```
root@crozier:/home/hypfer/playground/roborock/s5e# ./run.sh
waiting for 3 seconds
100% [================================================]   852 kB,  152.2 kB/s
100% [================================================]    66 kB,  162.1 kB/s
100% [================================================]     0 kB,   93.2 kB/s
100% [================================================]  3647 kB,  153.6 kB/s
root@crozier:/home/hypfer/playground/roborock/s5e#
```

Watch the robots' LEDs. It should reboot after a while. It won't play any sounds as the speaker will likely be unplugged.

After that, connect your laptop to the Wi-Fi AP hosted by the robot. It should be named somewhat similar to `roborock-vacuum-s5e_miapFDD5`.

If it's a used robot, you might not see an AP. In that case, press and hold Power and Home until you see the Wi-Fi LED change.
It should then spawn the AP again.


After you've connected to the AP, first `ssh` into it:
```
ssh -i ./your_keyfile root@192.168.8.1
```

Now, create a backup of `/dev/nandb` and `/dev/nandk` like so:
```
dd if=/dev/nandb | gzip > /tmp/nandb.img.gz
dd if=/dev/nandk | gzip > /tmp/nandk.img.gz
```

Disconnect or open a second terminal and pull those backups to your laptop via `scp` and store them in a safe place:
```
scp -O -i ./your_keyfile root@192.168.8.1:/tmp/nand* .
```

Then, push the full rooted firmware image tar to the correct location on the robot using `scp`:
```
scp -O -i ~/.ssh/your_keyfile Downloads/roborock.vacuum.s5e_1566_fw.tar.gz root@192.168.8.1:/mnt/data/
```

Back on the robot via `ssh`, run these:
```
rm -rf /mnt/data/rockrobo/rrlog/*
cd /mnt/data/
tar xvzf roborock.vacuum.s5e_1566_fw.tar.gz
./install.sh

reboot
```

After the reboot, reconnect to the robots' Wi-Fi AP and run the `./install.sh` again like this:
```
cd /mnt/data/
./install.sh

reboot
```

Once again wait for it to reboot and reconnect to the robots' Wi-Fi AP.

Push the downloaded Valetudo binary to the robot using `scp` like so:
```
scp -O -i ~/.ssh/your_keyfile Downloads/valetudo-lowmem.upx root@192.168.8.1:/mnt/data/valetudo
```

Connect to the robot via `ssh`. You will now clean up the installer files and setup valetudo to autostart on boot:
```
cd /mnt/data
rm roborock.vacuum.*.gz boot.img firmware.md5sum rootfs.img install.sh

cp /root/_root.sh.tpl /mnt/reserve/_root.sh
chmod +x /mnt/reserve/_root.sh /mnt/data/valetudo

reboot
```

After the robot has rebooted, connect to its Wi-Fi AP for the final time, wait for a minute or two and then open the
Valetudo Webinterface in your browser to connect the robot to your Wi-Fi network.<br/>
For that, just browse to `http://192.168.8.1`.

You can now continue with the <a href="https://valetudo.cloud/pages/general/getting-started.html#using-valetudo">getting started guide</a>.
