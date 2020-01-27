# Development Instructions for Viomi

## Robot setup

Set up the robot to talk to your host instead of the xiaomi cloud:

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
`hexdump -C /etc/miio/device.token | cut -b 10-60 | head -n1 | sed 's/ //g'`

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
