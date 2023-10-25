---
title: Dreame
category: Installation
order: 10
---
# Dreame rooting and installation

It is recommended to join the [Dreame Robot Vacuum Telegram Usergroup](https://t.me/+EcpAbJe0cfEyMDky) for rooting support etc.

### UART shell <a id="uart"></a>

To root using this method, you'll need:

- The [Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter)
- A 3.3V USB to TTL Serial UART Adapter (like CP2102 or Pl2303)
- A FAT32 & MBR-formatted USB Stick preferrably with an activity LED
- Some dupont cables

Basic linux knowledge and a pry tool will help as well.

#### High-level overview

This rooting method works by using a nice debug feature Dreame left in the firmware:<br/>
In the stock firmware of p-dreames, there's a udev (well, mdev technically) rule that runs a script once it sees a new
block device appear in `/dev/sd[a-z][0-9]`. This script then proceeds to mount the filesystem on it and if successful spawns
a login shell on the UART accessible on the debug connector.

The root password is calculated from the serial number that can be found on a sticker on the robot and the debug
connector also provides access to USB-OTG-functionality. And that's **almost** it.

**Almost**, because on some p-dreames (check the [supported robots](https://valetudo.cloud/pages/general/supported-robots.html) page for more info), Dreame introduced a secure boot scheme 
with a key burned into the SoC that then verifies the signature of the U-Boot bootloader, which in turn verifies the signature of the rootfs etc.

On these robots, you **MUST** defeat the secure boot mechanism before making any modifications to the filesystem **or else you will brick your robot**.
Don't worry though as the `install.sh` script included in the firmware built using <a href="https://builder.dontvacuum.me" rel="noopener" target="_blank">the dustbuilder</a> will take care of that for you.

#### Note for advanced users

While the Dreame Breakout PCB greatly simplifies the process, it is not strictly _required_ but
just _highly recommended_ to avoid people breaking the connector by jamming in 2.54mm pitch cables or shorting 5V to something.<br/>

<details>
<summary>If you know what you're doing, here's the relevant pinout for you (click me)</summary>
<br/>
<img src="./img/dreame_debug_connector_pinout.png"/>
<br/>
On some dreames, the debug connector is rotated by 90°:<br/>
<img src="./img/dreame_debug_connector_pinout_90.png"/>
<br/>
while on others, it might be flipped backwards:<br/>
<img src="./img/dreame_debug_connector_w10.jpg"/>
<br/>
<p>
If you <strong>don't</strong> know what you're doing and start bothering the support chat with questions on what to do with this pinout,
I will send you pictures of sad kittens. You have been warned.
</p>
</details>

#### Step-by-step guide

For this rooting method, you will first have to gain access to the 16-pin Dreame Debug Connector.
For all round-shaped dreames, this means removing the top plastic cover with a pry tool or your fingers like so:

![How to open a Dreame](./img/how_to_open_a_dreame.jpg)

If your Dreame is the P2148 Ultra Slim, just remove the whole top cover.<br/>
If your Dreame is a D-shaped Mop such as the W10, simply take out the dustbin and open the rubber flap in front of that port.

Once you have access to the debug port, plug in your [Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and then
connect your USB to Serial UART adapter to the SoC breakout on the PCB. **Make sure your adapter is set to 3.3V**.
You will only need 3 wires for this connection: (GND, RX, and TX).

![Dreame Breakout PCB connected](./img/dreame_breakout_in_p2150.jpg)

Now that you're all wired up, the next step is to open a serial connection to the device. For that, you can use screen: `screen /dev/ttyUSB0 115200,ixoff`.
Your user also needs to have permission to access `/dev/ttyUSB0` which usually either means being root or part of the `dialout` group.

Once your connection is ready, turn on the vacuum by pressing and holding the middle button (POWER) for at least 3 seconds.

You should see some logs and one of the last ones will say root password changed.
If you don't see any logs, try swapping RX and TX. If you instead see some random characters, check your cabling.

Ensure that the OTG ID Jumper on the breakout PCB is connected and insert your USB Stick.
If you don't have a jumper soldered, you can also use a jumper wire on the breakout header to connect ID OTG to GND.

After some flashing of the activity LED of your USB Stick, your UART connection should show a login prompt like `"p2029_release login”`.

For logging in, use the user `root`. It will then ask for a password.
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
built with dustbuilder (https://builder.dontvacuum.me)
Fri 04 Feb 2022 10:08:21 PM UTC
1099
```

If you see that MOTD, the rooting procedure was successful.

You now have a rooted Dreame vacuum robot running Valetudo.

Now continue with the [getting started guide](https://valetudo.cloud/pages/general/getting-started.html#joining_wifi).


### Fastboot <a id="fastboot"></a>

This method abuses the proprietary Allwinner LiveSuit tool for Linux with somewhat hacked LiveSuit images.
Because of that, it's a bit janky. You will also need some advanced linux knowledge.

This Guide assumes that you have just installed a fresh copy of Debian Bookworm with some kind of GUI (e.g. KDE).

<div class="alert alert-important" role="alert">
  <p>
    <strong>Important:</strong><br/>
    This method can permanently brick your robot if you're not careful.<br/>
    Make sure to fully read through the guide a few times before attempting the root.<br/>
    You need to understand what you're going to do before you start attempting to do it.
</p>
</div>

#### Gain access to the debug connector

For this rooting method, you will first have to gain access to the 16-pin Dreame Debug Connector.
For most round-shaped dreames, this means removing the top plastic cover with a pry tool or your fingers like so:

![How to open a Dreame](./img/how_to_open_a_dreame.jpg)

If your Dreame is a D-shaped Mop such as the W10 Pro, simply take out the dustbin and open the rubber flap in front of that port.

#### Note for advanced users

While the Dreame Breakout PCB greatly simplifies the process, it is not strictly _required_ but
just _highly recommended_ to avoid people breaking the connector by jamming in 2.54mm pitch cables or shorting 5V to something.<br/>

<details>
<summary>If you know what you're doing, here's the relevant pinout for you (click me)</summary>
<br/>
<img src="./img/dreame_debug_connector_pinout.png"/>
<br/>
On some dreames, the debug connector is rotated by 90°:<br/>
<img src="./img/dreame_debug_connector_pinout_90.png"/>
<br/>
while on others, it might be flipped backwards:<br/>
<img src="./img/dreame_debug_connector_w10.jpg"/>
<br/>
<p>
If you <strong>don't</strong> know what you're doing and start bothering the support chat with questions on what to do with this pinout,
I will send you pictures of sad kittens. You have been warned.
</p>
</details>

#### Prepare your Laptop

Software-wise, the first thing you need to do is head over to <a href="https://github.com/Hypfer/valetudo-sunxi-livesuit" rel="noopener" target="_blank">https://github.com/Hypfer/valetudo-sunxi-livesuit</a>
and follow the instructions in the readme. Do not connect your robot to your Laptop just yet.

#### Get the config value

Once you see a LiveSuit window, download the latest stage1 dustbuilder livesuite image for your robot:
- <a href="https://builder.dontvacuum.me/nextgen/dust-livesuit-mr813-ddr4.img" rel="noopener" target="_blank">L10s Ultra</a>
- <a href="https://builder.dontvacuum.me/nextgen/dust-livesuit-mr813-ddr3.img" rel="noopener" target="_blank">D10s Pro/Plus, W10 Pro</a>

and select that as the Image in the LiveSuit tool.

![Dreame Livesuit Stage1](./img/dreame_livesuit_stage1.png)

🦆 <-- Will be important later

Now, plug the Breakout PCB into your robot. Make sure that the USB OTG ID Jumper is **NOT** set and plug a cable into
the Micro USB port.

![Dreame Breakout PCB connected](./img/dreame_breakout_fel.jpg)

1. Press and hold the button on the PCB.
2. Then, press and hold the power button of the robot. Keep pressing the button on the PCB.
3. After 5s, release the power button of the robot. 
4. Continue holding the button on the PCB for 3 additional seconds.

The button LEDs of the robot should now be pulsing. With that, plug the USB cable into your computer.
LiveSuit should now display this message box:

![Dreame Livesuit Msgbox](./img/dreame_livesuit_msgbox.png)

Click no. This should now have booted your robot into Fastboot. To verify that, open a new terminal and run `fastboot devices`.
If you see your robot, continue with `fastboot getvar config`

```
root@T420:/home/hypfer# fastboot devices 
Android Fastboot        fastboot 
root@T420:/home/hypfer# fastboot getvar config 
config: 836064ae31f4806c844f708ab8398367 
Finished. Total time: 0.215s
```

This config value is important to select the correct bootloader patches and prevent bricks.
Write it down somewhere as you will also need it for updating the firmware in the future.

#### Build the firmware image

Because there's a hardware watchdog that will reset your robot and the dustbuilder firmware build takes some time,
press and hold the power button for 15s to turn off the robot for now. Also, unplug the USB cable from your laptop.<br/>
If you don't do this, you risk bricking the device if it gets rebooted during the install procedure.

Now that you have the correct config value for your robot, head over to <a href="https://builder.dontvacuum.me" rel="noopener" target="_blank">the dustbuilder</a>
and build a new firmware for your robot. Make sure to select `Create FEL image (for initial rooting via USB)`.

#### Prepare for rooting

Once the firmware build has finished, download your `dreame.vacuum.rxxxx_xxxx_fel.zip` to the laptop and unpack it.
Navigate the second terminal for fastboot into the folder containing the contents of that zip file.

Close LiveSuit and open it again. Select the newly generated image from the zip named `_dreame.vacuum.rxxxx_phoenixsuit.img`.
Open the `check.txt` and copy the content into your clipboard.

Jump back to the 🦆 in this guide and follow the same steps once again so that you have fastboot access again.<br/>
Remember that you will have **160s to finish the procedure** or else the watchdog might brick devices.

#### Root the robot

Once the robot is back in fastboot again, run `fastboot getvar config` to start the procedure.

Then, run `fastboot oem dust <value>` with `<value>` being the one you've copied from the `check.txt`.<br/>
Fastboot should confirm this action with `OKAY`. If it doesn't, **DO NOT PROCEED**.

Next step is to run `fastboot oem prep`.<br/>
Fastboot should confirm this action with `OKAY`. If it doesn't, **DO NOT PROCEED**.

Next step is `fastboot flash toc1 toc1.img`.<br/>
Fastboot should confirm this action with `OKAY`. If it doesn't, **DO NOT PROCEED**.


With that done, secure boot should be defeated. But rooting isn't done and the timer is still ticking.
Continue by flashing the boot and rootfs partitions.

```
fastboot flash boot1 boot.img
fastboot flash rootfs1 rootfs.img

fastboot flash boot2 boot.img
fastboot flash rootfs2 rootfs.img
```

This can take a few seconds and may also print an error message like `Invalid sparse file format at header magic`.
You can just ignore that one.<br/>
**BUT** as with the commands above, fastboot should confirm all of this with `OKAY`. If it doesn't, **DO NOT PROCEED**.


Finally, run `fastboot reboot`. If you hear the boot chime, you have successfully rooted your robot.<br/>
If you don't, please open a VAERS ticket at <a href="https://vaers.dontvacuum.me" rel="noopener" target="_blank">vaers.dontvacuum.me</a>

#### Install Valetudo

This rooting method requires you to manually install Valetudo post-root.

For that, first, check the [Supported Robots](https://valetudo.cloud/pages/general/supported-robots.html) page and look up which `Valetudo Binary` is the right one for your robot.

Once you know that, download the latest matching Valetudo binary to your laptop:
`https://github.com/Hypfer/Valetudo/releases/latest/download/valetudo-{armv7,armv7-lowmem,aarch64}`

With the Valetudo binary downloaded, head over to <a href="https://github.com/Hypfer/valetudo-helper-httpbridge" rel="noopener" target="_blank">https://github.com/Hypfer/valetudo-helper-httpbridge</a>
and download a matching binary for your laptops operating system.

Now, connect the laptop to the Wi-Fi Access Point of the robot.<br/>
You should be able to connect to it via ssh. Do that now and keep the shell open: `ssh -i ./your/keyfile root@192.168.5.1`

The next step is to start the utility webserver. Open a new terminal and run the `./valetudo-helper-httpbridge-amd64` binary **Don't close that window until you're done.**
The server will create a new `www` directory right next to itself as well as print out a few sample commands explaining how to download from and upload to it.

Make sure that it is listening on an IP in the range of `192.168.5.0/24` and then copy the downloaded valetudo binary to the newly created `www` folder.
Remove the `{-aarch64,lowmem,..}` etc. suffix. It should just be called `valetudo`.

<div markdown="1" class="emphasis-box">
<div class="alert alert-important" role="alert">
  <p>
    <strong>Important:</strong><br/>
    Before you continue with the rooting procedure of your robot, please make sure to create a backup of your calibration and identity data to allow for disaster recovery.
</p>
</div>

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

Once the robot has rebooted, you can continue with the [getting started guide](https://valetudo.cloud/pages/general/getting-started.html#joining_wifi).
