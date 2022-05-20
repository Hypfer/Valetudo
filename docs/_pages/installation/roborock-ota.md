---
title: Roborock OTA
category: Installation
order: 10
---
# Roborock OTA Installation Guide

This guide applies to the following robot models
* Gen 1 Xiaomi Mi SDJQR02RR aka Mi Robot Vacuum *rockrobo.vacuum.v1* (made before 2020-03)
* Gen 2 Roborock S50/S51/S55 (depending on color) *roborock.vacuum.s5*

If your roborock model is newer or not listed here,
there's no point in following this guide since the instructions will be different.

For newer Gen 1 robots, you will need to follow the instructions to root an S6, which can be found on the 
[rooting instructions](https://valetudo.cloud/pages/general/rooting-instructions.html) page.

## Preamble
Valetudo is not a custom firmware.
It is simply an alternative App implementation + mock cloud which runs on the robot itself.<br/>

To do that, some secret data is required. Those being the `did`, the `cloudKey` and the current `local token`.
Running on the robot itself enables Valetudo to access those as well as work while in AP mode.

It's also very neat to have a completely self-contained appliance with a web interface.

Therefore, installing Valetudo simply means taking the stock firmware and injecting Valetudo into it.<br/>
Sadly though, this process has to be done by each user individually because hosting firmware images with Valetudo preinstalled would probably be copyright infringement.

## Building the Firmware Image
It is recommended to use the Dustbuilder to build your firmware image.
It can be found here: [https://builder.dontvacuum.me/](https://builder.dontvacuum.me/)

In DustBuilder, make sure to use the "Build update package" option, as it is the only file type supported by valetudo-helper-miioota.

The service is provided by Dennis who is also the reason, why Valetudo can exist in the first place.

The reason this guide switched to dustbuilder only is that it provides a controlled environment, which eliminates common support issues.
The irony that this guide suggests using "the cloud" to uncloud your device is not lost on me.


## Flashing the firmware image

Flashing the firmware .pkg file can easily be done by using [valetudo-helper-miioota](https://github.com/Hypfer/valetudo-helper-miioota),
which is a standalone tool that does the right thing.

Just connect your laptop to the robots Wi-Fi access point and use the tool to install the firmware.
A successful run should look similar to this:

```
./valetudo-helper-miioota install-firmware v11_2034.pkg 
Starting installer.
If you experience issues, make sure to disable your firewall and/or VPN.
Also, make sure that the robot is docked during the firmware update procedure.
If the install still fails, try turning the robot off and back on again and/or moving the laptop closer to it.

Robot discovery started...
Scan done.
Successfully discovered robot at 192.168.8.1
Reading firmware image..
Successfully read firmware image. Size: 78.62 MiB MD5Sum: fe820a713ec9efdfa3990b5d776e2cda

Listing for firmware download requests on http://192.168.8.10:34505/firmware
Response from robot: [ 'ok' ]
Received firmware download request from ::ffff:192.168.8.1..

Download seems to have finished.
The robot should now install the firmware. It will take 5-10 minutes.
Exiting..
```

Please keep the distance between your WiFi antenna and your robot as short as possible or the connection might get lost.

After the successful transfer of the image to the robot, the robot will start flashing the image. This will take about 5~10 minutes.
After the process is done, the robot will state that the update was successful.

You can now return to the [getting started guide](https://valetudo.cloud/pages/general/getting-started.html#joining_wifi).

### Troubleshooting

 * Firewall active? - Disable your personal firewall.
 * Using a VM to flash the image? - Try to flash the image from your Host
 * Your PC does not know how to route, is more than one network interfaces active? Maybe disable LAN?
 * Did you make an update of the robot firmware via the Xiaomi App? Then go back to original using factory reset: while holding the plug button shortly press the reset button.
 * Distance between WiFi devices is to big. Try putting the robo near your PC.
 * Battery is lower than 20%. Please Charge. Place the Vacuum in the dock.
