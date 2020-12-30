---
title: Troubleshooting
category: Misc
order: 33
---
# Troubleshooting

## Home
### State keeps "loading state ???"
The msgid is out of sync.

Restart the robot or run this command using ssh:
`killall miio_client && service valetudo restart `

## Map
### Map only shows „No Map Data“
The map wasn’t created till now, is gone or seems to be incorrect. 

Start a full cleaning first to let the robot create the map. 

If that doesn’t help and „persistent Maps“ are activated on the Gen2 Robot, reset and activate them again. Then start a new full cleaning again. 

### Viomi V8 Specific: Map only shows „No Map Data“
Check your config under: /mnt/data/valetudo/config.json

    "map_upload_host": "http://127.0.0.1",

And check your Firewall-initscript /etc/rc.d/S51valetudo:

    […]
    dest=127.0.0.1
    port=80 #(Some People had success with changing the Port to 8080)
    
    for host in 203.0.113.1 203.0.113.5; do
    […]
