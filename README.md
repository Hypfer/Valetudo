# Valetudo - Free your vacuum from the cloud

[![Build Status](https://travis-ci.com/Hypfer/Valetudo.svg?branch=master)](https://travis-ci.com/Hypfer/Valetudo)

Valetudo provides all settings and controls of the Xiaomi Vacuum in a mobile-friendly webinterface.
It runs directly on the vacuum and requires no cloud connection whatsoever.

**Please note that Valetudo may require a patched rrlogd:**
* Gen1 Firmwares >= 3514
* Gen2 Firmwares > 1518

**Also, please refrain from disabling logging since it will break the archived map view**

### Features:
* Live Map View
* Configure Timers
* Start/Stop/Pause Robot
* Find Robot/Send robot to charging dock
* Power settings
* Consumables status
* Wifi settings

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


### Getting started
See [https://github.com/dgiese/dustcloud/wiki/Cloud-Free-Firmware-Image-With-Valetudo](https://github.com/dgiese/dustcloud/wiki/Cloud-Free-Firmware-Image-With-Valetudo)

### Manual Installation
You'll find information on how to install/build valetudo in the deployment folder.

If your vacuum is already rooted **and you know what you're doing** just:
1. download the latest valetudo binary from the releases page or build it from source.
2. scp it to `/usr/local/bin/`.
3. grab the `valetudo.conf` from the deployment folder put it inside `/etc/init/`.
4. run `service valetudo start` and you're good. Don't forget to `chmod +x /usr/local/bin/valetudo` the binary.

#### Updating to newer versions
1. Stop the running service `service valetudo stop`.
2. Replace the binary `/usr/local/bin/valetudo` by the new one (make sure to `chmod +x` it).
3. Start the service again `service valetudo start`.

### Remote API
If you are looking forward getting support for the map on any other device (like OpenHab, FHEM,..), this is now supported using Valetudo.
The current API can be found at:
`YourRobotID/api/remote/map`

The current implementation allows you to _grab_/**set**:
* The recent generated map as PNG (grab it at: `YOUR.VACUUM.ROBOT.IP/_mapsrc_`)
* The map contains the 2D contour and configurable:
   - `**drawPath**` [**true**|undefined]
   - `**drawCharger**` [**true**|undefined]
   - `**drawRobot**` [**true**|undefined]
   - `**border**` (in px around the map, will be scaled as well!), default: **2**
   - `**doCropping**` (for debug purpose) [**true**|undefined]
   - `**scale**` [1,..n], default: **4**
* The position of the charger (`_charger_[X,Y]`: position in px to overlay on the generated image)
* The position of the robot (`_robot_[X,Y]`: position in px to overlay on the generated image)
* The angle of the robot defined by the last path (`_robotAngle_`: angle in [0-360] of the robot; 0: oriented to the top, 90: oriented to the right)

A fully configured call would look like that:
`YOUR.VACUUM.ROBOT.IP/api/remote/map?drawRobot=false&drawCharger=true&scale=5&border=3&doCropping=true&drawPath=true`.
The json answer would look like the following:
```json
{"scale":5, "border":15, "doCropping":true, "drawPath":true, "mapsrc":"/maps/2018-08-19_10-43-50.png", "drawCharger":true, "charger":[65,620], "drawRobot":false, "robot":[51,625], "robotAngle":90}
```
If a parameter has not been defined/set, the default value will be used (marked bold above).

### Misc
The current version of valetudo is the result of 8 not so rainy afternoons. Expect bugs.

Theres a Todo.md with stuff that needs to be done


Valetudo does not feature access controls and I'm not planning on adding it since I trust my local network.
You could just put a reverse proxy with authentication in front of it if you really need it.

Please don't just forward the port to make it accessible on the go..

### Zoned Cleanup and Go To
In order to use the zoned cleanup and the go to functionality, a config.json file has to be create in the folder with the binary. The format is:
```json
{"spots": [["Wohnzimmer",-2000,1000],
           ["Küche",-3800,4000],
            ["Bad",3000,2500]],
 "areas": [["Küche",[[-3100,0,-4150,4200,2],[-3100,3700,-2100,2300,1]] ],
           ["Schlafzimmer",[[-20000,10000,-19000,12000,1]]]
          ]
}
```
The correct values can be checked with the functions at the Zone tab. All coordinates are relative to the docking station in mm. When you stand in front of the docking station, y increases whenever the docked robot comes to you. X increases if the robot drives to your left. One area can consist out of multiple zones.
Syntax for spots: ```[Name, x, y]```. Syntax for areas: ```[Name, [[x1, y1, x2, y2, itterations],...]]```

### FAQ
**Q:** Why the name?

**A:** Valetudo is the roman name for the greek goddess Hygieia which is the goddess of health, cleanliness and hygiene. Also I'm bad at naming things.
