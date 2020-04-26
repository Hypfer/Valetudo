---
title: Legacy
category: Installation
order: 11
---
# Valetudo legacy installation guide
This guide will take you through the required steps to install the latest version of valetudo onto your rooted Roborock Vacuum. Please note that these instructions may or may not apply to any other version than the latest version of Valetudo.

**If you're reusing the folder structure of an old install, don't forget to `git pull` your dustcloud repo to get the latest firmwarebuilder**

**Currently, the following devices are supported:**
* Xiaomi Vacuum Gen1
* Roborock Vacuum Gen2 S50/S51/S55

We recommend using the following firmware for the ongoing process (the current firmware on your device doesn't matter)
* Xiaomi Vacuum Gen1: **FW v11_003468**
* Roborock Vacuum Gen2 S50/S51/S55: **FW v11_001886**

## Introduction
Before we get to how it's done lets first take a second and talk about how it even works.
There are two Interfaces to control the robot. Both are utilizing the *miio protocol*.

#### The local Interface
This is the interface used by the Mobile app to directly talk to the robot if it's on the same network. It is also used to initially connect the robot to a Wifi Access Point since there are no input devices on the robot to enter Wifi or Xiaomi Account credentials. This process is called *provisioning*.

Authentication is done via a *token* which on unprovisioned robots is available by simply asking for it.
After a reboot, the unprovisioned robot opens up an unencrypted Wifi Access Point where the user can aquire said token and configure wifi credentials. As a security measure, this Wifi Access Point will vanish 30 Minutes after reboot so if you can't find it try rebooting the device.
It's always possible to unprovision the robot by shortly pressing the reset button. Then, your token will be available again.

#### The Cloud Interface
As soon as the robot is connected to a Wi-Fi Access Point, it tries to connect its cloud servers. Communication is encrypted via a *Pre-shared Key which is programmed at the factory*. There's also a unique Device ID called *did* to uniquely identify the robot.

### How Valetudo works
Valetudo (currently) uses both previously described interfaces to control the robot. To be able to use the cloud interface, traffic is redirected to Valetudo which pretends to be the official cloud all while running on the robot itself. Since *Roborock* implemented some countermeasures against this, it is required to utilize the robots firewall to pretend that Valetudo is the official cloud. This may or may not change in the future if someone finds a better way.

### How the installation works
*Roborock* uses encrypted but unsigned fimware images. The encryption key however was found by Security/IoT Researcher Dennis Giese, which enables us to build custom firmware images for this device and just flash them via the official firmware upgrade interface.
Basically we're just adding another service to the robots OS. No magic here.

## Prerequisites
Since we don't have a license to redistribute modified firmware images, the user has to download the firmware image from the manufacturer and patch it by themselves.
For this, a Linux based operating system is required, since we need to mount the *ext4 file System image* of the firmware.

Sadly, neither OSX nor WSL (the Windows Subsystem for Linux) contain ext4 drivers so you definitely need some kind of Linux installation. A VM should be sufficient to build the firmware image, though.

And you need WiFi hardware in your computer because initially you have to connect directly to the Robot-Hotspot to deploy the firmware.

### Dependencies
There are a few dependencies required for building the image. Please refer to your Linux distributions documentation to find out how to install them.
* bash
* openssh (for ssh-keygen)
* ccrypt
* sed
* dos2unix

### Root Access
If you plan on being able to connect to the robot via SSH, you will need a public/private ssh keypair. **This is not required to run valetudo.**
It's useful to fetch logs and assist the development if you encounter any bugs, though.

If you do not have a keypair yet, you can generate one with the following command
```
ssh-keygen -t ed25519 -C "your_email@example.com"
```
Per default, the generated keys will be created in `~/.ssh`. 
If you choose to create the keys in another location, remember your chosen location for later.

## Image Building
If you just need a basic Valetudo enabled Firmware image, you can skip the Image Building steps here by using Dennis's Dustbuilder: https://builder.dontvacuum.me/

### Preparations for building the image

1. Create a new directory for your work

       mkdir rockrobo
       cd rockrobo
    
2. Clone the dustcloud repository (until imagebuilder > 0.1 is available)
       
       git clone https://github.com/dgiese/dustcloud.git
       
3. Create a valetudo directory

       mkdir valetudo
       pushd valetudo
      
4. Download the latest valetudo binary from https://github.com/Hypfer/Valetudo/releases/latest

       wget https://github.com/Hypfer/Valetudo/releases/latest/download/valetudo
       mkdir deployment
       pushd deployment
       wget https://github.com/Hypfer/Valetudo/raw/master/deployment/valetudo.conf
       mkdir etc
       pushd etc
       wget https://github.com/Hypfer/Valetudo/raw/master/deployment/etc/hosts
       wget https://github.com/Hypfer/Valetudo/raw/master/deployment/etc/rc.local
       popd
       popd
       popd

5. Create firmware directory

       mkdir firmware
       pushd firmware
       
6. Download the latest firmware (e.g. v001792)

       wget URL

**URL:**

**Gen1**

```
https://cdn.awsbj0.fds.api.mi-img.com/updpkg/[package name]
https://cdn.awsde0.fds.api.mi-img.com/updpkg/[package name]

Example: https://cdn.awsbj0.fds.api.mi-img.com/updpkg/v11_003468.fullos.pkg
```

**Gen2**

```
https://dustbuilder.xvm.mit.edu/pkg/s5/[package name]
https://cdn.awsbj0.fds.api.mi-img.com/rubys/updpkg/[package name]
https://cdn.cnbj2.fds.api.mi-img.com/rubys/updpkg/[package name]
https://cdn.cnbj0.fds.api.mi-img.com/rubys/updpkg/[package name]
https://cdn.awsde0.fds.api.mi-img.com/rubys/updpkg/[package name]

Example: https://dustbuilder.xvm.mit.edu/pkg/s5/v11_001886.fullos.pkg
```

If you followed the above commands, your `rockrobo` directory structure should now look like this:
```
tree -L 2 rockrobo/
rockrobo/
├── dustcloud
│   ├── cloudprotocol.pdf
│   ├── devices
│   ├── docker
│   ├── dummycloud
│   ├── dustcloud
│   ├── LICENSE
│   ├── Pipfile
│   ├── Pipfile.lock
│   ├── presentations
│   └── README.md
├── firmware
│   └── v11_001712.pkg
└── valetudo
    ├── deployment
    │   ├── valetudo.conf
    │   └── etc
    │       ├── hosts
    │       └── rc.local
    └── valetudo

```
Next, we can create the firmware image.

### Creating the firmware image

To create the firmware image you should run the following commands while changing the name of the firmware file (after 'firmware=') to the one you downloaded:

```
cd firmware  
sudo ../dustcloud/devices/xiaomi.vacuum/firmwarebuilder/imagebuilder.sh \
     --firmware=v11_001748.fullos.pkg \
     --public-key=$HOME/.ssh/id_ed25519.pub \
     --valetudo-path=../valetudo \
     --disable-firmware-updates \
     --ntpserver=192.168.178.1 \
     --replace-adbd
```
Here you need now to remember the location of your generated public ssh-key, `id_ed25519.pub`. If you don't have a public key yet, take a look at the Prerequisites section.
Please note that you need to replace `v11_001748.pkg` with the filename of the firmware you have downloaded.

Note that not all options are required. However if your router runs a ntp server you should use it. Also I would recommend to replace adbd so in case something goes really wrong you can still access it via USB.

## Flashing the firmware image

After the successful build of the firmware image, we can tell the robot to download and flash it.

First, we need to create a virtual environment for it in python. For this the following packages need to be installed:

* python3
* python3-pip
* python3-venv

```
cd ..
mkdir flasher
cd flasher
python3 -m venv venv
```

and install the required miio python packages:

```
source venv/bin/activate
pip3 install wheel
pip3 install python-miio
cd ..
```

Connect to your robot's Wi-Fi Access Point and run the following command to aquire your token:
`mirobo --debug discover --handshake true`

If your robot doesn't show up check if you have multiple connected network interfaces. Either disable all other (those not connected to your robots Wi-Fi) or use a VM which you explicitly connect to your hosts Wi-Fi interface. Another possibility is an internal firewall blocking it. On RedHat-based Linux systems using Firewalld (CentOS, Fedora, etc.), make sure the firewall zone for your connection to the robot's Wi-Fi Access Point is set to "trusted" instead of "public".

```
mirobo --ip 192.168.8.1 --token XXXXXXXXXXXXXXXX update-firmware --ip YOUR_IP_ADDRESS firmware/output/v11_001748.fullos.pkg
```

Please note that you need to replace `v11_001748.fullos.pkg` with the filename of the firmware image you have built. If you're upgrading Valetudo to a new version, you need to replace `192.168.8.1` with the robot's current IP address. Also please keep the distance between your Wi-Fi antenna and your robot as short as possible or the connection might get lost.

After the successful transfer of the image to the robot, the robot will start flashing the image. This will take about 5~10 minutes. After the process is done, the robot will state that the update was successful.
You should then reboot the Robot either via ssh command `ssh root@192.168.8.1` and typing `reboot` or simply by taking it out of dock an push the ON switch to prevent valetudo stuck on LOADING STATE???

### Firmware Installation fails
#### ... before the download bar appears:

 * Firewall active? - Disable your personal firewall.
 * Using a VM to flash the image? - Try to flash the image from your Host (just copy the firmware image)
 * Token wrong? - Did you initiate a WiFi reset on the robo? Then you have to refetch the token, see above.
 * Your PC does not know how to route, is more than one network interfaces active? Maybe disable LAN?
 * Wrong IP address on your WiFi? - Check that DHCP is active on your WiFi device.

#### ... after the download bar appeared:

 * Did you make an update of the robot firmware via the Xiaomi App? Then go back to original using factory reset: while holding the plug button shortly press the reset button.
 * Distance between Wifi devices is to big. Try putting the robo near your PC.
 * Battery is lower than 20%. Please Charge. Place the Vacuum in the dock.

## Connect your robot to your Wifi

To connect the robot to your home Wifi, just connect to http://192.168.8.1 and use Valetudos settings dialog to enter your wifi credentials. Please note that only *WPA2-PSK* is supported.
After updating the Wifi settings, you should reboot your robot. 

## Open Valetudo
You need to get the IP of your robot (e.g. from your router) and connect to it using your browser e.g. http://192.168.Y.Z

## Upgrading Valetudo
If you're upgrading Valetudo to a new version, you don't need to unprovision your robot since you don't need to discover your token via handshake. Just open up Valetudo and use the settings page. Other than that it's basically the same process as the initial installation.