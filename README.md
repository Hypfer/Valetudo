# Valetudo - Free your vacuum from the cloud

[![Build Status](https://travis-ci.com/Hypfer/Valetudo.svg?branch=master)](https://travis-ci.com/Hypfer/Valetudo)

Valetudo is a standalone binary which runs on **rooted Xiaomi Vacuums** and aims to enable the user to operate the robot vacuum without any Cloud Connection whatsoever.

Valetudo **provides (almost) all settings and controls** of the Xiaomi Vacuum in a **mobile-friendly webinterface** as well as optional **MQTT** Connectivity which supports **Home Assistant Autodiscovery**.

This Project is made possible by the work of many voluntary contributers. ❤

### Supported Hardware
As of now, only **Gen1 + Gen2 Xiaomi Vacuums** are rootable and hence supported by Valetudo.

### Getting started
For newcomers, there is [a simple Guide](https://github.com/dgiese/dustcloud/wiki/Cloud-Free-Firmware-Image-With-Valetudo) which will walk you through the process of rooting a factory-new Vacuum and installing Valetudo on it.

The configuration file stored in `/mnt/data/valetudo/config.json` survives firmware upgrades.
The Valetudo binary however does not so if you are upgrading your firmware, you will have to follow said guide again.

### Currently supported Features
* Live Map View
* Go-To
* Zoned Cleanup
* Configure Timers
* MQTT
* MQTT HomeAssistant Autodiscovery
* Start/Stop/Pause Robot
* Find Robot/Send robot to charging dock
* Power settings
* Consumables status
* Wifi settings
* Carpet Mode
* Cleaning History
* Volume Control

### Screenshots:

![image](https://user-images.githubusercontent.com/974410/53036687-88f52d80-3478-11e9-8e9d-e3af35161de0.png)
![image](https://user-images.githubusercontent.com/974410/53036893-1cc6f980-3479-11e9-9cc5-efefea03eb90.png)
![image](https://user-images.githubusercontent.com/974410/53036815-e7221080-3478-11e9-9dc0-db5bedc741af.png)
![image](https://user-images.githubusercontent.com/974410/53036921-2a7c7f00-3479-11e9-87da-633a7319c1bf.png)
![image](https://user-images.githubusercontent.com/974410/53036855-028d1b80-3479-11e9-93a1-3ac7764f1089.png)
![image](https://user-images.githubusercontent.com/974410/53036928-2fd9c980-3479-11e9-8fe9-7ae1e124e4d7.png)
![image](https://user-images.githubusercontent.com/974410/53036939-35cfaa80-3479-11e9-9276-ff5333c98dd6.png)
![image](https://user-images.githubusercontent.com/974410/53036947-3a945e80-3479-11e9-9c40-71775322635b.png)
![image](https://user-images.githubusercontent.com/974410/53037020-657eb280-3479-11e9-9cf4-c9e69740d0e1.png)
![image](https://user-images.githubusercontent.com/974410/53036972-45e78a00-3479-11e9-83c3-c55320ced3ca.png)

#### Updating to newer versions
1. Stop the running service `service valetudo stop`.
2. Replace the binary `/usr/local/bin/valetudo` by the new one (make sure to `chmod +x` it).
3. Start the service again `service valetudo start`.

### Misc
Valetudo does not feature access controls and I'm not planning on adding it since I trust my local network.
You could just put a reverse proxy with authentication in front of it if you really need it.

Please don't just forward the port to make it accessible on the go..

### FAQ
**Q:** Why the name?

**A:** Valetudo is the roman name for the greek goddess Hygieia which is the goddess of health, cleanliness and hygiene. Also I'm bad at naming things.
