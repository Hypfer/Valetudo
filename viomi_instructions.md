# Development Instructions for Viomi

Current state of viomi support:

*   Reading basic status properties work, cloud & local connection work.
*   Map upload is very experimental, fragile and incomplete.
*   None of the UI actions work at this point. As end users you probably don't want to use this yet.

## Remaining Items (TODOs)

The follow are nice to have additions:

* Implement most of the `Roborock` commands for `Viomi`
* More decoupling: move `Roborock` specific result handling from MQTT & Webserver into Roborock.
* Fix viomi map parser (current `Pose` seems to actually be the outline of detected rooms).
* Add multiroom support to the UI.

## Robot setup

First, you need to [get root access to your Robot](https://itooktheredpill.irgendwo.org/2020/rooting-xiaomi-vacuum-robot/).

Then, set up the robot to talk to your host instead of the xiaomi cloud:

```shell
ssh root@viomi
echo "110.43.0.83 ot.io.mi.com ott.io.mi.com" >> /etc/hosts
cat >/etc/rc.d/S51valetudo <<EOF
#!/bin/sh
iptables         -F OUTPUT
iptables  -t nat -F OUTPUT
dest=192.168.1.10  # enter your local development host here
for host in 110.43.0.83 110.43.0.85; do
  iptables  -t nat -A OUTPUT -p tcp --dport 80   -d $host -j DNAT --to-destination $dest:8080
  iptables  -t nat -A OUTPUT -p udp --dport 8053 -d $host -j DNAT --to-destination $dest:8053
  iptables         -A OUTPUT                     -d $host/32  -j REJECT
done
EOF
chmod +x /etc/rc.d/S51valetudo
reboot
```

Note: To temporarily revert this while needing to use the Mi Home App,
you can do a `iptables -F; iptables -F -t nat` and comment out the line in `/etc/hosts`.

## Valetudo setup

You can get the values for the following by doing `cat /etc/miio/device.conf` and 
`hexdump -C /etc/miio/device.token | cut -b 10-60 | head -n1 | sed 's/ //g'` on the robot.

Put those into `develop/local/env`, e.g.:

```shell
export VAC_WEBPORT=8080
export VAC_ADDRESS=192.168.1.11
export VAC_TOKEN=00000000000000000000000000000000
export VAC_CLOUDKEY=AAAAAAAAAAAAAAAA
export VAC_MODEL=viomi.vacuum.v7
export VAC_DID=234567890
```

Update the `Configuration.js` file, change these settings:

    spoofedIP: "110.43.0.83"
    "map_upload_host": "http://110.43.0.83"

Then run

    ./develop/run
