---
title: Building and Modifying Valetudo
category: Development
order: 41
---
# Building and Modifying Valetudo

These are instructions for quickly setting up an environment where you can build
and modify Valetudo according to your needs.

It shows a complete setup from scratch, on a freshly installed Ubuntu 18.04 system.

Your mileage may vary if you're using a different OS, or if you start from a different setup.
However, it should be rather easy to understand the steps, and to adapt them to your situation.

### 1. Install prerequisites

Install git and npm:

`sudo apt install git npm`

### 2. Clone the repository

```
cd ~
git clone https://github.com/Hypfer/Valetudo.git
```

### 3. Install dependencies

```
cd Valetudo
npm install
```

### 4. Create default configuration by running valetudo

```
npm run start
CTRL + C
```

On first launch, Valetudo will generate a default config file at the location set in the `VALETUDO_CONFIG_PATH`
environment variable and automatically shut down, because it won't be able to autodetect the robot it is running on.

Something like `VALETUDO_CONFIG_PATH=./local/valetudo_config.json` should work fine.

Therefore, you need to edit the newly created file in order to be able to talk with your robot from your dev host:
```json
{
  "embedded": false,
  "robot": {
    "implementation": "RoborockS5ValetudoRobot",
    "implementationSpecificConfig": {
      "ip": "192.168.xxx.robotIp",
      "deviceId": 12345678,
      "cloudSecret": "aBcdEfgh",
      "localSecret": "123456788989074560w34aaffasf",
      "mapUploadUrlPrefix": "http://192.168.xxx.valetudoIp:8079"
    }
  }
}
```

Setting embedded to `false` disables all functionality that assumes that Valetudo runs on the robot such as some file-system related things.

For a list of possible values for `implementation` consult
https://github.com/Hypfer/Valetudo/blob/master/lib/core/ValetudoRobotFactory.js#L57

The config key `robot` specifies the ValetudoRobot implementation Valetudo should use as well as some implementation-specific configuration parameters.
When running on the robot itself, these are usually detected automatically.

| Vendor   | Config Key    | Robot Location                          | Robot Key |
|----------|---------------|-----------------------------------------|-----------|
| Roborock | valetudo.conf | /mnt/data/valetudo/valetudo_config.json |           |
|          | deviceId      | /mnt/default/device.conf                | did       |
|          | cloudSecret   | /mnt/default/device.conf                | key       |
|          | localSecret   | /mnt/data/miio/device.token             |           |
| Viomi    | valetudo.conf | /mnt/data/valetudo/config.json          |           |
|          | deviceId      | /etc/miio/device.conf                   | did       |
|          | cloudSecret   | /etc/miio/device.conf                   | key       |
|          | localSecret   | /etc/miio/device.token                  |           |

Since `deviceId` and `cloudSecret` are static, you'll only need to do that once.
Note that `localSecret` might change when you're switching wireless networks etc.

It's possible to specify both secrets as either hex or a regular string.

Once you finished editing the configuration, you should be all set.

Please note that Valetudo will replace the configuration with a default one if it fails to parse it correctly.

### 5. Verify configuration and run
```
npm run start
```

If your configuration is correct, Valetudo should now be working on your development host.

### 6. Enable dummycloud connection

The dummycloud is implemented by Valetudo, but the robot needs to connect to it.
To enable this mode (which is required for many of the functionalities such as map uploading):

1. Install Valetudo on the robot (if you haven’t done so already)
2. `ssh root@vacuum`, then stop Valetudo: `/etc/init.d/valetudo stop`.
3. Edit the `valetudo.conf` _on the robot_ and point `robot.implementationSpecificConfig.dummycloudIp`
   to your local development host.
   This will instruct the Valetudo process on the robot to tell the miio_client app that it should
   try to connect to your development host instead.
4. `reboot`

### 7. Code!

Modify the source code according to your needs, and restart the server as needed -- you can always run it as:

```
npm run start
```

### 8. Build and install on the device

When you're done with your modifications, here's how to build the executable for the robot:

```
npm run build
```

The output file `valetudo` is a binary file that you can copy to the device:

```
scp ./valetudo root@vacuum:/usr/local/bin/
```

Once you're that far, you hopefully don't need any further advice.
