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
Don't worry though as the `install.sh` script included in the firmware built using [the Dustbuilder](https://builder.dontvacuum.me/) will take care of that for you.

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


### Fastboot <a id="fastboot"></a>

**Note:** <br/>
This rooting method currently does not meet the usual quality standards. I, too, am unhappy with that. Stay tuned for updates.

At the time of writing, this unfortunately requires a Windows install plus some proprietary vendor tools.
We're currently looking into getting rid of those requirements.

I'd recommend picking up an old used laptop for 50€ or less and installing Windows on that.
Such a system will come in handy on other occasions as well so it's good to have one around.

If you have an existing Windows system, you _can_ use that, but since the proprietary tools are sourced from _somewhere_ on the internet,
I would advise against doing that as they can't be trusted.

I've used a Thinkpad T420 where I've swapped out the SSD with a blank 15€ 128GB one and just installed a fresh and clean Windows 10 from USB.

For now, rooting instructions can be found here: [https://builder.dontvacuum.me/nextgen/dreame_gen3.pdf](https://builder.dontvacuum.me/nextgen/dreame_gen3.pdf)