---
title: Roborock, Files to backup
category: Misc
order: 33
---
## Important Roborock Stuff

These is a list of important files on the robot. I am mainly writing this down here so everyone can backup these and restore them in case of full reset+reflashing.


***


####  List of files/folder

Zones + Spots configuration, mqtt + other config

`/mnt/data/valetudo/valetudo_config.json`

Status to keep map

`/mnt/data/rockrobo/lab.cfg`

various map data

`mnt/data/rockrobo/user_map0` current map

`mnt/data/rockrobo/last_map` previous map, will be used if robot does not recognize where it is

`mnt/data/rockrobo/robot.db` last cleaning path

`mnt/data/rockrobo/PersistData` virtual zones and walls?

`mnt/data/rockrobo/ChargerPos.data`
`mnt/data/rockrobo/StartPos.data` named positions

***

To backup copy the files from the robot to a safe place. (lab.cfg can be easily set, see FAQ)

To restore just copy the files over to the robot and reboot valetudo.
