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
npm run build
```
After that you'll find a binary named valetudo in that folder which you should scp to /usr/local/bin/

Create /etc/init/valetudo.conf using the file located in this directory

# Preventing communication to the Xiaomi cloud

To prevent the robot from communicating with the Xiaomi cloud you need to setup
iptables and configure the `/etc/hosts` so that xiaomi hostnames are redirected
locally back to Valetudo.

First add the content of `deployment/etc/hosts` to your `/etc/hosts`
file on the robot.

Second edit the `/etc/rc.local` file and add the contet of
`deployment/etc/rc.local` befor the `exit 0` line.

# Reboot

You can now reboot robot.
