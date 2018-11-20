# Building and Modifying Valetudo

This file provides instructions for quickly setting up an environment where you can build
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

### 4. Create configuration

```
./develop/run
```

On the first invocation, this script will create the files that you'll need for your local setup, and
it will tell you to to edit them. It is expected behavior for the script to fail on first run, and
you **must** edit at least the `develop/local/env` file.

Once you finished editing the files, you should be all set.

### 5. Verify configuration and run
```
./develop/run
```

If your configuration is correct, Valetudo should now be working on your development host.

### 6. Code!

Modify the source code according to your needs, and restart the server as needed -- you can always run it as:

```
./develop/run
```

### 7. Build and install on the device

When you're done with your modifications, here's how to build the executable for the robot:

```
./node_modules/.bin/pkg --targets latest-linux-armv7 --no-bytecode --options max-old-space-size=72 --public-packages=exif-parser,omggif,trim,prettycron .
```

The output file `valetudo` is a binary file that you can copy to the device:

```
scp ./valetudo root@192.168.1.42:/usr/local/bin/
```

Once you're that far, you hopefully don't need any further advice.

