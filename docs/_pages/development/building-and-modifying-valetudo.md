---
title: Building and Modifying Valetudo
category: Development
order: 41
---
# Building and Modifying Valetudo

These are instructions for quickly setting up an environment where you can build
and modify Valetudo according to your needs.

Please note that working with Valetudo requires at least NPM v7 and Nodejs v15.

### 1. Clone the repository

```
cd ~
git clone https://github.com/Hypfer/Valetudo.git
```

### 2. Install dependencies

```
cd Valetudo
npm install
```

### 3. Create default configuration by running valetudo

```
npm run start:dev --workspace=backend
CTRL + C
```

On first launch, Valetudo will generate a default config file at the location set in the `VALETUDO_CONFIG_PATH`
environment variable and automatically shut down, because it won't be able to autodetect the robot it is running on.

The `start:dev` script chooses `./local/valetudo_config.json`, relative to the root of the project, as the config location.

You need to edit the newly created file in order to be able to talk with your robot from your dev host:
```json
{
  "embedded": false,
  "robot": {
    "implementation": "RoborockS5ValetudoRobot",
    "implementationSpecificConfig": {
      "ip": "192.168.xxx.robotIp",
      "deviceId": 12345678,
      "cloudSecret": "aBcdEfgh",
      "localSecret": "123456788989074560w34aaffasf"
    }
  }
}
```

Setting embedded to `false` disables all functionality that assumes that Valetudo runs on the robot such as some file-system related things.

For a list of possible values for `implementation` consult the robot implementations in
[https://github.com/Hypfer/Valetudo/tree/master/backend/lib/robots](https://github.com/Hypfer/Valetudo/tree/master/backend/lib/robots).
Valetudo is also capable of running without a real robot. The `MockValetudoRobot` implementation provides a virtual robot
that has a few basic capabilities. It requires no further implementation specific configuration.

The config key `robot` specifies the ValetudoRobot implementation Valetudo should use as well as some implementation-specific configuration parameters.
When running on the robot itself, these are usually detected automatically.

| Vendor   | Config Key    | Robot Location                          | Robot Key |
|----------|---------------|-----------------------------------------|-----------|
| Roborock | valetudo.conf | /mnt/data/valetudo/valetudo_config.json |           |
|          | deviceId      | /mnt/default/device.conf                | did       |
|          | cloudSecret   | /mnt/default/device.conf                | key       |
|          | localSecret   | /mnt/data/miio/device.token             |           |
| Dreame   | valetudo.conf | /data/valetudo_config.json              |           |
|          | deviceId      | /data/config/miio/device.conf           | did       |
|          | cloudSecret   | /data/config/miio/device.conf           | key       |
|          | localSecret   | /data/config/miio/device.token          |           |

Since `deviceId` and `cloudSecret` are static, you'll only need to do that once.
Note that `localSecret` might change when you're switching wireless networks etc.

It's possible to specify both secrets as either hex or a regular string.

Please note that Valetudo will replace the configuration with a default one if it fails to parse it correctly.

The logfile is also configured via an environment variable: `VALETUDO_LOG_PATH` and defaults to `os.tmpdir()` if unset. <br/>
To just use stdout in your dev setup, you'll need

`VALETUDO_LOG_PATH=/dev/null` for linux/osx and

`VALETUDO_LOG_PATH=\\\\.\\NUL` for windows hosts.<br/>
That's `four backslash dot two backslash NUL` if it's not displayed correctly due to escaping issues.

### 4. Verify configuration and run
```
npm run start:dev --workspace=backend
```

If your configuration is correct, Valetudo should now be working on your development host.

### 5. Code!

Modify the source code according to your needs, and restart the server as needed -- you can always run it as:

```
npm run start:dev --workspace=backend
```

### 7. Build and install on the device

When you're done with your modifications, here's how to build the executable for the robot:

```
npm run build
```

The output file `valetudo` is a binary file that you can copy to the device:

```
scp ./build/armv7/valetudo root@vacuum:/usr/local/bin/
```

Once you're that far, you hopefully don't need any further advice.
