# Building Valetudo

For building, you need a reasonably new NodeJS. You can install this from your
distro (preferred), or using one of the official pre-compiled binaries on the
node-website …. `pkg` is able to create armv7-binaries on x86 (and other
platforms) just fine — as long as it does not need to pre-compile its JS
bytecode. This is why we specify `--no-bytecode`.
```
git clone http://github.com/hypfer/Valetudo
cd Valetudo
npm install
./node_modules/.bin/pkg --targets latest-linux-armv7 --no-bytecode --public-packages=exif-parser,omggif,trim,prettycron .
```
After that you'll find a binary named valetudo in that folder which you should scp to /usr/local/bin/

Create /etc/init/valetudo.conf using the file located in this directory

# Preventing communication to the Xiaomi cloud

There are two possibilities how you can prevent the robot from communicating with the Xiaomi cloud.

## Dummycloud

This is the recommended way. You will find the binary as well as detailed information about the setup process here:

https://github.com/dgiese/dustcloud/tree/master/dummycloud

## IP Tables

This approach will lead to massive logging and this could long term eventually harm your flash. Please do this on your own risk.

If you are using this in a network somewhere in 10.0.0.0/8 you may want to think this through.

* Edit /etc/hosts
```
10.5.5.5      ott.io.mi.com
10.5.5.5      ot.io.mi.com
```

* Edit /etc/rc.local
```
iptables -A OUTPUT -d 10.5.5.5 -j REJECT
iptables -A OUTPUT -d 192.168.0.0/16 -j ACCEPT
iptables -A OUTPUT -d 127.0.0.0/8 -j ACCEPT
iptables -A OUTPUT -p udp --dport 123 -j ACCEPT
iptables -A INPUT -p udp --sport 123 -j ACCEPT
iptables -A OUTPUT -j DROP
```

# Reboot

You can now reboot robot.
