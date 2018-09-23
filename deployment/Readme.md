I'f you're using this in a network somewhere in 10.0.0.0/8 you may want to think this through.


For building, you need a reasonably new NodeJS. You can install this from your
distro (preferred), or using one of the official pre-compiled binaries on the
node-website …. `pkg` is able to create armv7-binaries on x86 (and other
platforms) just fine — as long as it doesn’t need to pre-compile its JS
bytecode. This is why we specify `--no-bytecode`.
```
git clone http://github.com/hypfer/Valetudo
cd Valetudo
npm install
./node_modules/.bin/pkg --targets latest-linux-armv7 --no-bytecode --public-packages=exif-parser,omggif,trim,prettycron ."
```
After that you'll find a binary named valetudo in that folder which you should scp to /usr/local/bin/


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

* Create /etc/init/valetudo.conf using the file located in this directory
* Reboot robot (or just run service valetudo start)
