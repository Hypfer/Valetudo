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

The service is provided by Dennis who is also the reason, why Valetudo can exist in the first place.

If you however don't trust us that's perfectly fine. You can use [https://github.com/zvldz/vacuum](https://github.com/zvldz/vacuum) to build the image yourself.<br/>

The reason this guide switched to dustbuilder only is that it provides a controlled environment, which eliminates common support issues.
The irony that this guide suggests using "the cloud" to uncloud your device is not lost on me.


## Flashing the firmware image

To flash the image we are going to use [mirobo](https://github.com/haim0n/python-mirobo) - a tool to control a vacuum cleaner from a terminal.

First, we need to get it and for this we recommend to create a python virtual environment for it.
<details>
  <summary>Dependencies (Click me)</summary>
  <ul>
    <li>python3</li>
    <li>python3-pip</li>
    <li>python3-venv</li>
  </ul>
</details>


```
cd ..
mkdir flasher
cd flasher
python3 -m venv venv
```

Now, when the virtual environment is ready we are going to activate it and install [miio](https://github.com/rytilahti/python-miio) python package which provides `mirobo`:

```
source venv/bin/activate
pip3 install wheel
pip3 install python-miio
cd ..
```

Flashing an image requires providing your robot's token.
To acquire it, connect to your robot's WiFi Access Point and run the following command:
`mirobo --debug discover --handshake true`

You're looking for a similar line:
```
INFO:miio.miioprotocol:  IP 192.168.8.1 (ID: 0f90319a) - token: b'ffffffffffffffffffffffffffffffff'
```

If your robot doesn't show up check if you have multiple connected network interfaces. Either disable all other (those not connected to your robot's WiFi) or use a VM which you explicitly connect to your host's WiFi interface. Another possibility is an internal firewall blocking it. On RedHat-based Linux systems using Firewalld (CentOS, Fedora, etc.), make sure the firewall zone for your connection to the robot's WiFi Access Point is set to "trusted" instead of "public".
In case all of the above failed, check [mirobo's "finding-the-token"](https://github.com/haim0n/python-mirobo#finding-the-token)

With token in out hand we can upload the firmware to the robot:
```
mirobo --token XXXXXXXXXXXXXXXX --ip ROBOT_IP_ADDRESS update-firmware path/to/built/image.pkg
```

`ROBOT_IP_ADDRESS` is `192.168.8.1` by default but if you're upgrading Valetudo to a new version, you need to replace it with the robot's current IP address.
Also please keep the distance between your WiFi antenna and your robot as short as possible or the connection might get lost.

After the successful transfer of the image to the robot, the robot will start flashing the image. This will take about 5~10 minutes. After the process is done, the robot will state that the update was successful.
You should then reboot the Robot either via ssh command `ssh root@192.168.8.1` and typing `reboot` or simply by taking it out of dock and push the ON switch to prevent valetudo stuck on LOADING STATE???

### Firmware Installation fails
#### ... before the download bar appears:

 * Warnings about lack of IP or Token - Check [mirobo's usage](https://github.com/haim0n/python-mirobo#usage)
 * Firewall active? - Disable your personal firewall.
 * Using a VM to flash the image? - Try to flash the image from your Host (just copy the firmware image)
 * Token wrong? - Did you initiate a WiFi reset on the robot? Then you have to refetch the token, see above.
 * Your PC does not know how to route, is more than one network interfaces active? Maybe disable LAN?
 * Wrong IP address on your WiFi? - Check that DHCP is active on your WiFi device.

#### ... after the download bar appeared:

 * Did you make an update of the robot firmware via the Xiaomi App? Then go back to original using factory reset: while holding the plug button shortly press the reset button.
 * Distance between WiFi devices is to big. Try putting the robo near your PC.
 * Battery is lower than 20%. Please Charge. Place the Vacuum in the dock.

## Connect your robot to your Wifi

To connect the robot to your home Wifi, just connect to http://192.168.8.1 and use Valetudos settings dialog to enter your wifi credentials. Please note that only *WPA2-PSK* is supported.
After updating the Wifi settings, you should reboot your robot. 

## Open Valetudo
You need to get the IP of your robot (e.g. from your router) and connect to it using your browser e.g. http://192.168.Y.Z
