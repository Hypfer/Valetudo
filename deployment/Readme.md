I'f you're using this in a network somewhere in 10.0.0.0/8 you may want to think this through.


For buildung, pkg and a raspberry pi (3 ?) is needed since the pi is armv7
```
npm install -g pkg
git clone http://github.com/hypfer/Valetudo
cd Valetudo
npm install
pkg --targets latest-linux-armv7 .
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
