---
title: Getting Started
category: General
order: 8
---

# Getting Started

This page shall help you start using Valetudo. Make sure that you've read the [newcomer guide](https://valetudo.cloud/pages/general/newcomer-guide.html).
If you haven't done that already please do so and then come back here.

Please read the [Why Valetudo?](https://valetudo.cloud/pages/general/why-valetudo.html) and [Why not Valetudo?](https://valetudo.cloud/pages/general/why-not-valetudo.html)
pages before continuing with this guide.

## Table of Contents
0. [Choosing a robot](#choosing_a_robot)
1. [Installing Valetudo](#installing_valetudo)
2. [Joining Wifi](#joining_wifi)
3. [Using Valetudo](#using_valetudo)
4. [Now What?](#now_what)

## Choosing a robot<a id='choosing_a_robot'></a>

First, you'll need to acquire a supported robot. There are many ways to do that, but usually they involve you paying money.
To not waste all that hard-earned money, please make sure to thoroughly read the [buying supported robots](https://valetudo.cloud/pages/general/buying-supported-robots.html)
docs page.

Please refrain from buying any random robot just to then ask how we can make Valetudo on that thing happen.

## Installing Valetudo<a id='installing_valetudo'></a>

After you've acquired your supported vacuum robot, the next step is to do a simple test run **before** you void
your warranty. Usually it's possible to simply use the buttons on the robot to start a cleanup. No need to use an official app.

Since it is your robot, you will have to decide if everything looks fine to you.
However, for your convenience, here are some common things to ask/check:

- Does it die right away? 
- Does it pick up dirt?
- Does it navigate somewhat properly?
- Does it dock and charge successfully on its own?
- Does it auto-empty? (if applicable)
- Does it clean the mops? (if applicable)

If everything seems to be working fine with no unexpected error messages, weird behaviour or things catching fire, you can
now start following the rooting instructions for your [supported robot](https://valetudo.cloud/pages/general/supported-robots.html).

## Joining Wifi<a id='joining_wifi'></a>

With your robot rooted and Valetudo installed, the next step is to join your robot to your Wi-Fi network
so that you can interact with it.
To do that, please **do not** execute any random shell commands or edit some config files as that often leads to breakage.

Instead, you should use Valetudo for that. Simply connect to the Wi-Fi AP of your now rooted robot and open its IP in your browser:

[<img src="https://user-images.githubusercontent.com/974410/198879902-4d1de531-1537-4e89-b85c-17c693ed8fdc.png" height=600>](https://user-images.githubusercontent.com/974410/198879902-4d1de531-1537-4e89-b85c-17c693ed8fdc.png)

The IP may vary based on your model of robot. Usually, it's either `http://192.168.5.1`, `http://192.168.8.1` or `http://10.201.126.1/`.
Note that some browsers might try redirecting you to `https://` without you noticing.

On recent versions of Android, don't forget to disable mobile data and click through about seven nagscreens as otherwise the OS will not route
any traffic to the Wi-Fi AP as it doesn't provide any internet connectivity.

If you're still facing issues connecting to Valetudo, you can also use the [android companion app](https://valetudo.cloud/pages/companion_apps/valetudo_companion.html)
and follow the instructions there after pressing the + button on the bottom right.


## Using Valetudo<a id='using_valetudo'></a>

With your Valetudo-enabled robot being connected to your home network, you can now start using it by simply opening
its webinterface in the browser of your choice unless your choice is the Internet Explorer.

If you don't know how to find said Webinterface, you can use the [android companion app](https://valetudo.cloud/pages/companion_apps/valetudo_companion.html),
which will autodiscover Valetudo instances on your network.

[<img src="https://github.com/Hypfer/valetudo-companion/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/screenshot-02.png" width=250>](https://github.com/Hypfer/valetudo-companion/raw/master/fastlane/metadata/android/en-US/images/phoneScreenshots/screenshot-02.png)

If you're using a computer running Microsoft Windows, you can also open the explorer and navigate to "Network" where your new robot should also be autodiscovered.

<img src="https://user-images.githubusercontent.com/974410/127387044-da7e8c18-390f-40bc-88b1-3ff316e4e6cf.png" alt="image">

## Now What?<a id='now_what'></a>

Congratulations! You have now significantly increased the baseline cleanliness of your living space.

It is strongly recommended to now connect Valetudo to the home automation system of your choice such as [Home Assistant](https://valetudo.cloud/pages/integrations/home-assistant-integration.html).

Using that, you can now do things such as

- running a cleanup after everyone has left the building
- clean a room by double-pressing its light switch

and more.

Also, consider checking out the companion apps section of the docs where you can find stuff like [Valeronoi](https://github.com/ccoors/Valeronoi),
which can build a Wi-Fi signal heatmap from the data provided by Valetudo.

Or maybe you're interested in [importing your floor plan into minecraft or the source game engine](https://valetudo.cloud/pages/companion_apps/fun_games.html)?
