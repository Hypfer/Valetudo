---
title: Dreame
category: Installation
order: 10
---
# Dreame rooting and installation

Please check the [supported robots](/pages/general/supported-robots/) page to find out which method applies to your model of robot.

Also note that all rooting guides assume a factory-new robot that has never been connected to the vendor cloud.<br/>
If you've used any vendor apps before, make sure to do a full factory-reset before starting with the rooting procedure.

<div class="section-box">

## UART shell

To root using this method, you'll need:

- The [Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter)
- A 3.3V USB to TTL Serial UART Adapter (like CP2102 or Pl2303)
- A FAT32 & MBR-formatted USB Stick preferably with an activity LED
- Some dupont cables

Basic linux knowledge and a pry tool will help as well.

#### High-level overview

This rooting method works by using a nice debug feature Dreame left in the firmware:<br/>
In the stock firmware of p-dreames, there's a udev (well, mdev technically) rule that runs a script once it sees a new
block device appear in `/dev/sd[a-z][0-9]`. This script then proceeds to mount the filesystem on it and if successful spawns
a login shell on the UART accessible on the debug connector.

The root password is calculated from the serial number that can be found on a sticker on the robot and the debug
connector also provides access to USB-OTG-functionality. And that's **almost** it.

**Almost**, because on some p-dreames (check the [supported robots](/pages/general/supported-robots/) page for more info), Dreame introduced a secure boot scheme 
with a key burned into the SoC that then verifies the signature of the U-Boot bootloader, which in turn verifies the signature of the rootfs etc.

On these robots, you **MUST** defeat the secure boot mechanism before making any modifications to the filesystem **or else you will brick your robot**.
Don't worry though as the `install.sh` script included in the firmware built using <a href="https://fab.valetudo.cloud" rel="noopener" target="_blank">the Dustfab</a> will take care of that for you.

#### Note for advanced users

While the Dreame Breakout PCB greatly simplifies the process, it is not strictly _required_ but
just _highly recommended_ to avoid people breaking the connector by jamming in 2.54mm pitch cables or shorting 5V to something.<br/>

<details>
<summary>If you know what you're doing, here's the relevant pinout for you (click me)</summary>
<br/>
<img src="../img/dreame_debug_connector_pinout.png" width="700" height="479"/>
<br/>
On some dreames, the debug connector is rotated by 90°:<br/>
<img src="../img/dreame_debug_connector_pinout_90.png" width="800" height="438"/>
<br/>
while on others, it might be flipped backwards:<br/>
<img src="../img/dreame_debug_connector_w10.jpg" width="800" height="429"/>
<br/>
<p>
If you <strong>don't</strong> know what you're doing and start bothering the support chat with questions on what to do with this pinout,
I will send you pictures of sad kittens. You have been warned.
</p>
</details>

<br/>

#### Phase 0: Preparation

{% alert "note" %}
  Before you do anything, if you've ever used the robot with the vendor app, make sure to factory-reset it first.
  <br/>
  For that, with the robot turned on, press and hold the button labelled "reset" next to the Wi-Fi LED until it talks to you.
{% endalert %}

To prepare the USB Stick used for rooting, just download [this zip archive](../res/dreame_uart_root_img.zip),
unzip it and flash the contained `.img` to the USB stick using e.g. `dd` or other tooling used to flash images to block devices.

While you can also just create an MBR-formatted 1-FAT32-partition USB stick on your own, rooting feedback has shown that
sometimes, things do go wrong, causing either no shell or multiple shells to spawn, which both prevents successful rooting.

Therefore, it's recommended to use this known-good image that has been tested on a real robot.

#### Phase 1: Connecting to the Robot

For this rooting method, you will first have to gain access to the 16-pin Dreame Debug Connector.
For all round-shaped dreames, this means removing the top plastic cover with a pry tool or your fingers like so:

<img src="../img/how_to_open_a_dreame.jpg" alt="How to open a Dreame" width="1200" height="463">

If your Dreame is the P2148 Ultra Slim, just remove the whole top cover.<br/>
If your Dreame is a D-shaped Mop such as the W10, simply take out the dustbin and open the rubber flap in front of that port.

Once you have access to the debug port, plug in your [Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and then
connect your USB to Serial UART adapter to the SoC breakout on the PCB. **Make sure your adapter is set to 3.3V**.
You will only need 3 wires for this connection: (GND, RX, and TX).

<img src="../img/dreame_breakout_in_p2150.jpg" alt="Dreame Breakout PCB connected" width="1200" height="700">

#### Phase 2: Logging in

Now that you're all wired up, the next step is to open a serial connection to the device. For that, you can use screen: `screen /dev/ttyUSB0 115200,ixoff`.
Your user also needs to have permission to access `/dev/ttyUSB0` which usually either means being root or part of the `dialout` group.

Once your connection is ready, turn on the vacuum by pressing and holding the middle button (POWER) for at least 3 seconds.

You should see some logs and one of the last ones will say root password changed.
If you don't see any logs, try swapping RX and TX. If you instead see some random characters, check your cabling.

Ensure that the OTG ID Jumper on the breakout PCB is connected and insert your USB Stick.
If you don't have a jumper soldered, you can also use a jumper wire on the breakout header to connect ID OTG to GND.

After some flashing of the activity LED of your USB Stick, your UART connection should show a login prompt like `"p2029_release login”`.
Don't be confused about it not being `p2029` on your robot. `p2029` is just the model ID of the L10 Pro and thus will vary depending on the robot.

{% alert "tip" %}
  There are other processes running on the robot that write stuff to the terminal the shell is running on.
  You can ignore that output as it is purely visual and does not affect your shell. Just keep typing.
{% endalert %}

For logging in, use the user `root`. It will then ask for a password.
To calculate the password use the full serial number of your robot, which can be found on the sticker below the dustbin.
**Not the one on the bottom of the robot nor the one on the packaging. You'll have to take out the dustbin and look below it into the now empty space.**

<img src="../img/dreame_dustbin_sticker.jpg" alt="Dreame Dustbin Sticker" width="1074" height="626">

To get the password, use the following [Calculator](https://gchq.github.io/CyberChef/#recipe=Find_/_Replace(%7B'option':'Regex','string':'(%5C%5Cn%7C%5C%5Cr)'%7D,'',true,false,true,false)MD5()Find_/_Replace(%7B'option':'Regex','string':'$'%7D,'%20%20-%5C%5Cn',false,false,false,false)To_Base64('A-Za-z0-9%2B/%3D')&input=UDIwMDkwMDAwRVUwMDAwMFpN)
or enter the full SN (all uppercase) into this shell command
`echo -n "P20290000US00000ZM" | md5sum | base64`

If your Dreame is Xiaomi-branded, your SN might instead look similar to `41717/BFACWF3Z000000`.<br/>
In that case, use the full string including the `41717/` part as the SN.

#### Phase 3: Installing the patched Firmware + Valetudo

Once logged in, build a patched firmware as an installer package via the <a href="https://fab.valetudo.cloud" rel="noopener" target="_blank">Dustfab</a>.

Wait for the build job to complete, then download the tarball to your laptop.

With it downloaded, head over to <a href="https://github.com/Hypfer/valetudo-helper-httpbridge" rel="noopener" target="_blank">https://github.com/Hypfer/valetudo-helper-httpbridge</a>
and download a matching binary for your laptops operating system.

Now, connect the laptop to the Wi-Fi Access Point of the robot. If you can't see the robots Wi-Fi AP to connect to, it might have disabled itself because 30 minutes passed since the last boot.
In that case, press and hold the two outer buttons until it starts talking to you.

The next step is to start the utility webserver. On Windows, a simple double-click on the exe should do the trick. **Don't close that window until you're done.**
The server will create a new `www` directory right next to itself as well as print out a few sample commands explaining how to download from and upload to it.

Make sure that it is listening on an IP in the range of `192.168.5.0/24` and then copy the downloaded `tar.gz` to the newly created `www` folder.

<div class="emphasis-box">
{% alert "important" %}
  Before you continue with the rooting procedure of your robot, please make sure to create a backup of your calibration and identity data to allow for disaster recovery.
{% endalert %}

The easiest way of doing this is by creating a tar archive of everything important and then uploading it to your laptop,
which at this point should be connected to the robots Wi-Fi AP.

To do that, head back to the UART shell and create a tar file of all the required files like so:

```
tar cvf /tmp/backup.tar /mnt/private/ /mnt/misc/ /etc/OTA_Key_pub.pem /etc/publickey.pem
```

Then, look at the output of the `valetudo-helper-httpbridge` instance you've started previously.
It contains an example curl command usable for uploading that should look similar to this one:

```
curl -X POST http://192.168.5.101:1337/upload -F 'file=@./file.tar'
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
Built by Dustfab (https://fab.valetudo.cloud)
Fri 04 Feb 2022 10:08:21 PM UTC
1099
```

If you see that MOTD, the rooting procedure was successful.

You now have a rooted Dreame vacuum robot running Valetudo.

Now continue with the [getting started guide](/pages/general/getting-started/#joining_wifi).

</div>

<div class="section-box">

## Fastboot

This Guide assumes that you have booted a fresh copy of Debian 13 Live with some kind of GUI (e.g. KDE).<br/>
Please use a native environment for this, as VMs will usually be troublesome.

{% alert "important" %}
  Make sure to fully read through the guide a few times before attempting the root.<br/>
  You need to understand what you're going to do before you start attempting to do it.
{% endalert %}

### High-level overview

This is a multi-staged rooting method, consisting of three phases:

1. First, we start with a recon phase, where we analyze the robot and the software on it to determine the right way to patch
out security features that would otherwise prevent the root.
2. Using the information gathered, in phase 2, we apply the necessary changes to the robot and flash a rooted firmware image.
3. Lastly, in phase 3, we install Valetudo to that rooted firmware.

### Phase 0: Preparation

{% alert "note" %}
  Before you do anything, if you've ever used the robot with the vendor app, make sure to factory-reset it first.
  <br/>
  For that, with the robot turned on, press and hold the button labelled "reset" next to the Wi-Fi LED until it talks to you.
{% endalert %}

#### Software preparation

For this root, you will need a Laptop natively running Debian 13. A live USB thing is fine.<br/>
You can of course use any linux distribution you want, however, if you want to receive support, please stick with Debian.

It went through a few iterations, starting with a proprietary vendor tool, then switching to `sunxi-tools`.
In the latest revision you are reading now however, all you need is provided as a single static amd64 linux binary by the Dustfab.

So now all you need to do is boot Debian on your x86 laptop.

You will also need to run all the upcoming commands in a **rootshell**.<br/>
The guide assumes that you are in one (e.g. through running `sudo -i`).

#### Gain access to the debug connector

Next, you have to gain access to the 16-pin Dreame Debug Connector.
For most round-shaped dreames, this means removing the top plastic cover with a pry tool or your fingers like so:

<img src="../img/how_to_open_a_dreame.jpg" alt="How to open a Dreame" width="1200" height="463">

If your Dreame is a D-shaped Mop such as the W10 Pro, simply take out the dustbin and open the rubber flap in front of that port.

#### Note for advanced users

While the Dreame Breakout PCB greatly simplifies the process, it is not strictly _required_ but
just _highly recommended_ to avoid various pitfalls like using the wrong pitch and breaking the connector, shorting stuff etc.

Just remember that you will be running USB 2.0 at 480MBit/s over that connection. And, while some random unshielded untwisted
dupont cables might work for UART at 115200 baud, that UART connection is doing less than 1% of the data rate of USB 2.0.

Since high-speed protocols have far higher demands on signal integrity, the connection will likely either not work at all
or break down during data transfers, leading to confusion.

You should _really_ be using the PCB.

<details>
<summary>If you know what you're doing, here's the relevant pinout for you (click me)</summary>
<br/>
<img src="../img/dreame_debug_connector_pinout.png" width="700" height="479"/>
<br/>
On some dreames, the debug connector is rotated by 90°:<br/>
<img src="../img/dreame_debug_connector_pinout_90.png" width="800" height="438"/>
<br/>
while on others, it might be flipped backwards:<br/>
<img src="../img/dreame_debug_connector_w10.jpg" width="800" height="429"/>
<br/>
<p>
If you <strong>don't</strong> know what you're doing and start bothering the support chat with questions on what to do with this pinout,
I will send you pictures of sad kittens. You have been warned.
</p>
</details>

<br/>

### Phase 1: Recon

As described in the high-level overview, we start by doing some reconnaissance on the robot.
To do that, it needs to be turned off first.

#### Get the config value

To get the FEL recon package for your robot, navigate to <a href="https://builder.dontvacuum.me/nextgen/dust-fel-mr813.tar.gz" rel="noopener" target="_blank">the Dustfab</a>
and navigate to the builder for your model of robot.

There will be a banner below the picture of the model you can click on to download the right tarball for that model.

Download it, then unpack it.
In it, you will find the latest helper binary, the right `fsbl.bin` and the right `payload.bin`.

Follow these steps to enter fastboot:

<div class="emphasis-box">
<strong>Entering fastboot</strong><br/>

We're starting with a robot that is **off**.

Plug the Breakout PCB into your robot. Make sure that the USB OTG ID Jumper is **NOT** set and plug a cable into
the Micro USB port.

<img src="../img/dreame_breakout_breakout_fel.jpg" alt="Dreame Breakout PCB connected" width="1200" height="700">
<img src="../img/dreame_breakout_fel.jpg" alt="Dreame Breakout PCB connected" width="1200" height="700">

1. Press and hold the button on the PCB.
2. Then, press and hold the power button of the robot. Keep pressing the button on the PCB.
3. After 5s, release the power button of the robot.
4. Continue holding the button on the PCB for 3 additional seconds.

On older robots, the button LEDs of the robot should now be pulsing.
On newer ones, the WiFi LED glowing can give you visual feedback.

With that, plug the USB cable into your computer.

Now, run the helper:
```
~/Downloads/dust-fel-recon-r2228$ ./valetudo-helper-felroot-amd64 boot fsbl.bin payload.bin
[*] looking for robot in FEL mode
[*] found MR813-based robot
[*] writing fsbl...
100% [================================] 0.28 MB/s
[*] jumping to fsbl...
[*] waiting 3s for DRAM training...
[*] writing payload...
100% [================================] 0.49 MB/s
[*] jumping to payload...
[*] waiting for the robot to come up as a fastboot device...
[*] reported dustversion: 2026.10.00
```

Remember: rootshell.

As you can see, it will do the right thing and give nice feedback while doing so.

**Note**: On old robots, you're on a timer now, so move quickly before the watchdog resets the system.
</div>

Our next step is to get the config value:

```
~/Downloads/dust-fel-recon-r2228$ ./valetudo-helper-felroot-amd64 getvar config
a7f391b4c6e8d205f913a4c5e7b2d186
```

The config value is what is used to ensure that a rooting attempt doesn't end in a brick.

#### Further recon

For disaster recovery and to support us determine which changes are required for which config value, you will need to
sample about 0.8 to 1.2GB of data from the robot.

{% alert "tip" %}
  Depending on how fast you are with the terminal, on older bots, the watchdog might reboot the robot mid-execution.
  At this stage of the guide, that is nothing to worry about. If it happens, just enter fastboot again and continue where you left off.
{% endalert %}

To start sampling, first, run `oem stage0`, then `get_samples` to `dustx100.bin`:
```
~/Downloads/dust-fel-recon-r2228$ ./valetudo-helper-felroot-amd64 oem stage0
[*] OKAY
~/Downloads/dust-fel-recon-r2228$ ./valetudo-helper-felroot-amd64 get_samples ./dustx100.bin
[*] receiving samples
100% [================================] 11.81 MB/s
```

Do not be alarmed if the speed fluctuates.

Once done, move one to `oem stage1`, then `get_samples` to `dustx101.bin`:
```
~/Downloads/dust-fel-recon-r2228$ ./valetudo-helper-felroot-amd64 oem stage1
[*] OKAY
~/Downloads/dust-fel-recon-r2228$ ./valetudo-helper-felroot-amd64 get_samples ./dustx101.bin
[*] receiving samples
100% [================================] 11.83 MB/s
```

On older bots, at this point, the watchdog might've rebooted the system mid-transfer.
If that happens, delete the partial file, do the dance again, then continue at the stage you were at.

Lastly, finish up with `oem stage2`, then `get_samples` to `dustx102.bin`:
```
~/Downloads/dust-fel-recon-r2228$ ./valetudo-helper-felroot-amd64 oem stage2
[*] OKAY
~/Downloads/dust-fel-recon-r2228$ ./valetudo-helper-felroot-amd64 get_samples ./dustx102.bin
[*] receiving samples
100% [================================] 11.92 MB/s
```

With that done, you can reboot the system:
```
~/Downloads/dust-fel-recon-r2228$ ./valetudo-helper-felroot-amd64 reboot
[*] rebooting
```

Once it booted up, you can turn it back off for now.

Now, zip up everything and store the file in a safe place:
```
~/Downloads/dust-fel-recon-r2228$ zip samples.zip dustx100.bin dustx101.bin dustx102.bin
 adding: dustx100.bin (deflated 0%)
 adding: dustx101.bin (deflated 0%)
 adding: dustx102.bin (deflated 0%)
```

#### Build the firmware image

Now that you have the correct config value for your robot, head over to <a href="https://fab.valetudo.cloud" rel="noopener" target="_blank">the Dustfab</a>
and build a new firmware for your robot. Make sure to select the `FEL package` output format.

{% alert "warning" %}
  If building a firmware fails due to an invalid config value, the Dustfab will guide you to the check page for your robot, where you can upload the samples.zip you've just collected.<br/>
  You will then queue a job for that, which will come with a status page that contains further instructions (if required).
  <br/><br/>
  I did my best to automate the process there, however, I also needed to keep it actually safe, so at times, it might require a human to look at it.<br/>
  That human is yours truly and does have a real life that extends beyond vacuum robots, so that might take a while.
{% endalert %}

### Phase 2: Rooting

Now that we know everything we need to know, we can continue with flashing the rooted firmware image.

#### Prepare for rooting

Once the firmware build has finished, download the tarball, unpack, and once again you will have the helper, the fsbl and the payload.<br/>
However, the rooting tarball also comes with even more files you will need shortly.

The first of them being the `check.txt`. Open it, and copy the content into your clipboard.

We will now boot to fastboot once more:
```
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 boot fsbl.bin payload.bin
[*] looking for robot in FEL mode
[*] found MR813-based robot
[*] writing fsbl...
100% [================================] 0.29 MB/s
[*] jumping to fsbl...
[*] waiting 3s for DRAM training...
[*] writing payload...
100% [================================] 0.49 MB/s
[*] jumping to payload...
[*] waiting for the robot to come up as a fastboot device...
[*] reported dustversion: 2026.10.00
```

Remember that on old bots, you might only have **160s to finish the procedure** before the watchdog reboots the system,
leaving it in a possibly soft-bricked state.<br/>
Preparing copy-pasteable commands in a text editor has proven to be very helpful to handle that timer.

Here are the steps again, but this time of course using our new tarball:

<div class="emphasis-box">
<strong>Entering fastboot</strong><br/>

We're starting with a robot that is **off**.

Plug the Breakout PCB into your robot. Make sure that the USB OTG ID Jumper is **NOT** set and plug a cable into
the Micro USB port.

<img src="../img/dreame_breakout_breakout_fel.jpg" alt="Dreame Breakout PCB connected" width="1200" height="700">
<img src="../img/dreame_breakout_fel.jpg" alt="Dreame Breakout PCB connected" width="1200" height="700">

1. Press and hold the button on the PCB.
2. Then, press and hold the power button of the robot. Keep pressing the button on the PCB.
3. After 5s, release the power button of the robot.
4. Continue holding the button on the PCB for 3 additional seconds.

On older robots, the button LEDs of the robot should now be pulsing.
On newer ones, the WiFi LED glowing can give you visual feedback.

With that, plug the USB cable into your computer.

Now, run the helper:
```
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 boot fsbl.bin payload.bin
[*] looking for robot in FEL mode
[*] found MR813-based robot
[*] writing fsbl...
100% [================================] 0.28 MB/s
[*] jumping to fsbl...
[*] waiting 3s for DRAM training...
[*] writing payload...
100% [================================] 0.49 MB/s
[*] jumping to payload...
[*] waiting for the robot to come up as a fastboot device...
[*] reported dustversion: 2026.10.00
```

Remember: rootshell.
</div>

#### Root the robot

Once the robot is back in fastboot, we once again get the config value:
```
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 getvar config
a7f391b4c6e8d205f913a4c5e7b2d186
```

Then, we run `oem dust <checkvalue>` with the value from our `check.txt`:
```
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 oem dust 12345xx
[*] OKAY
```

The next step is `oem prep`:
```
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 oem prep
[*] OKAY
```

With that done, now we will flash the partitions.<br/>
This will always be `boot` and `rootfs`, but also `dtbo` on newer bots, as determined by the files you got in that tarball.

We start with system A:
```
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 flash boot1 boot.img
[*] sending 'boot.img' (10835968 bytes)
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 flash rootfs1 rootfs.img
[*] Sending sparse 'rootfs1' 1/3 (32764 KB)
[*] Writing 'rootfs1'
[*] Sending sparse 'rootfs1' 2/3 (32764 KB)
[*] Writing 'rootfs1'
[*] Sending sparse 'rootfs1' 3/3 (14424 KB)
[*] Writing 'rootfs1'
```
And, on bots with a dtbo partition:
```
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 flash dtbo1 dtbo.img
```

And continue with system B:
```
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 flash boot2 boot.img
[*] sending 'boot.img' (10835968 bytes)
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 flash rootfs2 rootfs.img
[*] Sending sparse 'rootfs2' 1/3 (32764 KB)
[*] Writing 'rootfs2'
[*] Sending sparse 'rootfs2' 2/3 (32764 KB)
[*] Writing 'rootfs2'
[*] Sending sparse 'rootfs2' 3/3 (14424 KB)
[*] Writing 'rootfs2'
```
And, on bots with a dtbo partition:
```
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 flash dtbo2 dtbo.img
```

Lastly, we reboot:
```
~/Downloads/dreame.vacuum.r2228_3407_fel$ ./valetudo-helper-felroot-amd64 reboot
[*] rebooting
```

If it boots up normally, you have successfully rooted your robot.<br/>
If not, the support chat is the right place.

Though first, ensure that you actually followed all the steps here. Usually, when stuff fails, it's due to not all being done correctly.

### Phase 3: Install Valetudo

With the rooted firmware installed, we finish the procedure by installing Valetudo to it.

For that, first, check the [Supported Robots](/pages/general/supported-robots/) page and look up which `Valetudo Binary` is the right one for your robot.

Once you know that, download the latest matching Valetudo binary to your laptop:
`https://github.com/Hypfer/Valetudo/releases/latest/download/valetudo-{armv7,armv7-lowmem,aarch64}`

With the Valetudo binary downloaded, head over to <a href="https://github.com/Hypfer/valetudo-helper-httpbridge" rel="noopener" target="_blank">https://github.com/Hypfer/valetudo-helper-httpbridge</a>
and download a matching binary for your laptops operating system.

Now, connect the laptop to the Wi-Fi Access Point of the robot. If you can't see the robots Wi-Fi AP to connect to, it might have disabled itself.
In that case, press and hold the two outer buttons until it starts talking to you.

Once connected via Wi-Fi, you should be able to connect to it using ssh. Do that now and keep the shell open: `ssh -i ./your/keyfile root@192.168.5.1`

The next step is to start the utility webserver. Open a new terminal and run the `./valetudo-helper-httpbridge-amd64` binary **Don't close that window until you're done.**
The server will create a new `www` directory right next to itself as well as print out a few sample commands explaining how to download from and upload to it.

Make sure that it is listening on an IP in the range of `192.168.5.0/24` and then copy the downloaded valetudo binary to the newly created `www` folder.
Remove the `{-aarch64,lowmem,..}` etc. suffix. It should just be called `valetudo`.

<div class="emphasis-box">
{% alert "important" %}
  Before you continue with the rooting procedure of your robot, please make sure to create a backup of your calibration and identity data to allow for disaster recovery.
{% endalert %}

The easiest way of doing this is by creating a tar archive of everything important and then uploading it to your laptop,
which at this point should be connected to the robots Wi-Fi AP.

To do that, use the ssh shell to create a tar file of all the required files like so:

```
tar cvf /tmp/backup.tar /mnt/private/ /mnt/misc/
```

Then, look at the output of the `valetudo-helper-httpbridge` instance you've started previously.
It contains an example curl command usable for uploading that should look similar to this one:

```
curl -X POST http://192.168.5.101:1337/upload -F 'file=@./file.tar'
```

Change the file parameter to `file=@/tmp/backup.tar`, execute the command and verify that the upload to your laptop
was successful. If everything worked out correctly, you should now see a backup.tar with a non-zero size in `www/uploads`.

If you're experiencing issues, make sure that you've specified the correct port.

</div>

After uploading the backup and storing it in a safe place, you can now download the valetudo binary that you've
previously put in the `www` directory. `valetudo-helper-httpbridge` will tell you the correct command, which should look
similar to this:

```
wget http://192.168.5.101:1337/valetudo
```

After downloading the Valetudo binary, finish the install by running these commands on the robot:
```
mv /tmp/valetudo /data/valetudo
chmod +x /data/valetudo
cp /misc/_root_postboot.sh.tpl /data/_root_postboot.sh
chmod +x /data/_root_postboot.sh

reboot
```

Once the robot has rebooted, you can continue with the [getting started guide](/pages/general/getting-started/#joining_wifi).

</div>
