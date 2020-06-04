This folder structure contains fully static stripped armv7 nodejs binaries to bundle valetudo with.

Yes, the directory structure has to be exactly like this with `pkg 4.4.8`.

They were built on a raspberry pi 3.<br/>
See the [pkg-fetch fork](https://github.com/Hypfer/pkg-fetch) to find out how to do that. Spoiler: It sucks.

It is worth noting that simply stripping the nodejs binary reduced the final valetudo binary size by nearly 10mb.

Also, `built-v14.0.0-linux-armv7` is actually node `14.4.0` but pkg needs it to be named that way