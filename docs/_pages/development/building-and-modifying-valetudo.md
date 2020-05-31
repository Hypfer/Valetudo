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

On first launch, Valetudo will generate a default config file as `local/config.json`.
Simply stop Valetudo using CTRL + C and edit the newly created file according to your needs.

You will probably want to replace `webserver.port` with something above 1024 as well as `model` with something that looks like this:

```json
{
    "type": "roborock.vacuum.s5",
    "embedded": false,
    "config": {
        "ip": "192.168.x.x",
        "deviceId": 12345678,
        "cloudSecret": "ffffffffffffffffffffffffffffffff",
        "localSecret": "ffffffffffffffffffffffffffffffff"
    }
}
```

`deviceId` and `cloudSecret` can be found in the `/mnt/default/device.conf` as `did` and `key` on the robot.
Since both values are static, you'll only need to do that once.

The `localSecret` can be found in the robots FS as well: `/mnt/data/miio/device.token`.
Note that this one might change when you're switching wireless networks etc.

It's possible to specify both secrets as either hex or a regular string.


Once you finished editing the configuration, you should be all set.

Please note that Valetudo will replace the configuration with a default one if it fails to parse it correctly.

### 5. Verify configuration and run
```
npm run start
```

If your configuration is correct, Valetudo should now be working on your development host.

### 6. Code!

Modify the source code according to your needs, and restart the server as needed -- you can always run it as:

```
npm run start
```

### 7. Build and install on the device

When you're done with your modifications, here's how to build the executable for the robot:

```
npm run build
```

The output file `valetudo` is a binary file that you can copy to the device:

```
scp ./valetudo root@192.168.1.42:/usr/local/bin/
```

Once you're that far, you hopefully don't need any further advice.

