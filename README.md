# Valetudo - Free your vacuum from the cloud

Valetudo provides all settings and controls of the Xiaomi Vacuum in a mobile-friendly webinterface.
It runs directly on the vacuum and requires no cloud connection whatsoever.

### Features:
* Live Map View
* Configure Timers
* Start/Stop/Pause Robot
* Find Robot/Send robot to charging dock
* Power settings
* Consumables status
* Wifi settings

### Screenshots:

![image](https://user-images.githubusercontent.com/974410/42618909-a9158af4-85b6-11e8-883e-9d6bab7aecc3.png)
![image](https://user-images.githubusercontent.com/974410/42618936-c44d22c8-85b6-11e8-9e61-0a998b97655a.png)
![image](https://user-images.githubusercontent.com/974410/42618944-cd155560-85b6-11e8-9642-9ef9c4b80e57.png)
![image](https://user-images.githubusercontent.com/974410/42618985-f74c827c-85b6-11e8-8eb5-4ea94d5b43bc.png)


### Getting started
You'll find information on how to install valetudo in the deployment folder.

If your vacuum is already rooted **and you know what you're doing** 
just download the latest valetudo binary from the releases page and scp it to `/usr/local/bin/`.
Then grab the `valetudo.conf` from the deployment folder put it inside `/etc/init/`
 run `service valetudo start` and you're good. Don't forget to `chmod +x` the binary.

### Misc
The current version of valetudo is the result of 8 not so rainy afternoons. Expect bugs.

Theres a Todo.md with stuff that needs to be done


Valetudo does not feature access controls and I'm not planning on adding it since I trust my local network.
You could just put a reverse proxy with authentication in front of it if you really need it.

Please don't just forward the port to make it accessible on the go..
### FAQ
**Q:** Why the name?

**A:** Valetudo is the roman name for the greek goddess Hygieia which is the goddess of health, cleanliness and hygiene. Also I'm bad at naming things.
