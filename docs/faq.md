# Frequently asked questions

## Why the name?

Valetudo is the roman name for the greek goddess Hygieia which is the goddess of health, cleanliness and hygiene. Also I'm bad at naming things.

## Is it possible to remove Valetudo from my robot completely? 

Yes. Simply reset your robot to factory defaults.

## Why does my robot speak Chinese?

Because it's language is set to Chinese!

Edit `/mnt/default/roborock.conf` and change `language=prc` to `language=en`.

## How do I install a different language sound pack?

The python-miio project offers a commandline tool to communitcate with the robot. This can upload a language pack and install the sound file in your preferred language.

1. Download the language pack

   [English](https://dustbuilder.xvm.mit.edu/pkg/voice/english.pkg) | [German](https://dustbuilder.xvm.mit.edu/pkg/voice/de.pkg) | [more](https://dustbuilder.xvm.mit.edu/pkg/voice/)

2. Setup python-miio

   For this the following packages need to be installed:

   * python3
   * python3-pip
   * python3-venv

   Setup a python virtual env:

       mkdir miio
       cd miio
       python3 -m venv venv

   Install python-miio:

       source venv/bin/activate
       pip3 install wheel
       pip3 install python-miio

   Now you can install the sound pack with:

       mirobo --ip <ip> --token <token> install-sound /path/to/<lang>.pkg

## Where do I find the log file?

    tail -f /var/log/upstart/valetudo.log

## How to cleanup maps before Valetudo version 0.3.0?

First stop the watch daemon and then delete the files and start it again.

    stop rrwatchdoge
    rm -rf /mnt/data/rockrobo/rrlog/*
    start rrwatchdoge

## How can I get the token from the robots FileSystem?

`printf $(cat /mnt/data/miio/device.token) | xxd -p`

## How can I add password authentication?

Password authentication isn't directly supported by valetudo, but you can setup a reverse proxy. For nginx you can use the following configuration. You can also use your reverse proxy to add ssl encryption.

```
server {
    server_name valetudo.org; # put your server name here
    listen 192.168.178.10:80; # put the IP address of the server here 

    #access_log            /var/log/nginx/foo.access.log;
    location / {
      proxy_set_header        Authorization "";
      auth_basic              "Valetudo"; # This string will be shown at the authentication window
      auth_basic_user_file    /etc/nginx/basic_auth; # file with user credentials
      proxy_http_version      1.1;
      proxy_set_header        X-Real-IP $remote_addr;
      proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header        X-Forwarded-Proto $scheme;
      proxy_set_header        Host $host;
      proxy_set_header        Accept-Encoding "";
      proxy_set_header        Upgrade $http_upgrade;
      proxy_set_header        Connection "upgrade";
      proxy_pass              http://192.168.4.199:80; # the ip address of the robot
      proxy_read_timeout      90;
    }
}
```

## How to keep map data after reboot
In default the robot will lose map data after each reboot. To prevent the map reset use the mirobo command line tool (same tool you use for the installation process) and execute `mirobo raw-command set_lab_status 1`.
This can be also done via filesystem access `echo -n "1" > /mnt/data/rockrobo/lab.cfg` on the robot itself.

## No map displayed
Since v0.3.0 Valetudo now use the cloud interface and that requires the robot to be provisioned (wifi configured). Therefore, the map will not be displayed in AP mode! Ensure you added your device to your own wifi network.
In AP mode, a map will nevertheless be created, that map can later be displayed once connected to the wifi network. 

## My map does not persist / zone co-ordinates change

By default, the robot will generate a new map on each clean, it is likely that this will void any saved zones. To mitigate this, you can enable persistent maps on the device. 

Use the `python-miio` library to issue the following commands:

```sh
mirobo raw-command set_lab_status 1 # Enabling the lab status allows advanced commands to be issued
mirobo raw-command save_map # Enable persistent maps!
```

## What is the "Sensor" consumable?
The sensors don't wear out, but Xiaomi recommends cleaning them after each 30 hours of vacuuming as they collect dust. This includes four cliff sensors on the bottom and the wall sensor on the side of the robot. Just reset the sensor consumable after cleaning.