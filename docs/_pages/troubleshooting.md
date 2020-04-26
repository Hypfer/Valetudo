---
title: Troubleshooting
category: Misc
order: 32
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