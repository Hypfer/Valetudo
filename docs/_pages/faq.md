---
title: FAQ
category: Misc
order: 30
---
# Frequently asked questions

## Why the name?

Valetudo is the roman name for the greek goddess Hygieia, which is the goddess of health, cleanliness and hygiene.

## Can I use Valetudo without an internet connection? <a name="offline"></a>

Yes!<br/>
That's the whole idea behind it.

In Valetudo, there are only two things that connect to the internet:

1. The NTP client <- You can either disable that or change the NTP server to something locally
2. The Updater <- This only ever contacts the GitHub API if you, the user, explicitly click on "Check for Updates"

Additionally, some robot firmwares include connectivity checks that:

1. Ping the default gateway (e.g. your local router) <- This is required. You will see issues if you block that
2. Ping the internet (e.g. `8.8.8.8`) <- You can block that but that's up to you.

Firmware ML/AI features such as obstacle avoidance based on AI image recognition will continue to function offline,
as such things can't be cloud based for latency-reasons alone.

The SoCs on the supported robots are more than fast enough to handle such workloads. No cloud required. 

## Can you support Robot Model XY? <a name="newbot"></a>

Sure! We'd be glad to look into your case. To help us help you, we only require you to buy and permanently
donate 3 units of the robot in question to us. (2 for HW Hacking, 1 for SW Hacking)

Though we can't promise to be successful, we strive to achieve a success rate of at least 3%.<br/>
As with any R&D project though, we unfortunately can't offer any refunds if we fail to get the robot support.

We thank you for your understanding and are looking forward to doing business with you!

## Why is there no iOS companion app? <a name="ios"></a>

Because I don't want the app to be a paid yearly subscription supporting only some small garage startups in Cupertino
and not the actual project.

You might not be aware of this, but since there's no sideloading and no alternative stores on iDevices, the only way
to get your software on there is through the official distribution channel of the vendor which comes with a yearly 80€ fee.

Furthermore, development for iApps can only be done on a Mac which needs to be bought and also won't last forever.
Assuming a reasonable 5 years of lifetime for the hardware, picking the cheapest Mac mini and a 2-gen-behind base-spec
iPhone, at the time of writing, I end up with this calculation for 5 years:

- Store Fee: 5 * 80€ = 400€
- Mac Mini: 699€
- iPhone 13: 729€

Sum: 1828€

This money needs to be earned somehow, and it needs to be earned yearly, which forces you to find some way of generating
recurring revenue - something I do not want to do with this project.

### But what if you did it anyway?

Fine. If you insist, we can go along with that:

Excluding any compensation for my time spent on actually building and supporting that app, by dividing that number by 5,
you end up with 365.50€. 365.50€ that would need to be donated or paid by users every year just so that I don't lose money
out of my own pocket on paying the cloud landlord for wanting to exist.

But it gets worse, because the platform also takes a 15% (previously 30%) fee on everything sold there, meaning that people
would actually have to buy apps/subscriptions for 420.44€ every year; all of it ending up at the platform and nothing
benefiting the actual project people would've wanted to support.

<br/>

Imagine donating 10€ to a FOSS project you really liked and wanted to support only to then a little while later discover
that you've actually been donating to billion-dollar big tech destroyers of worlds all along.

Now imagine 40+ people living through that every year for 5 years.<br/>
And after those 5 years, the App just vanishes from the storefront with no way of installing it anymore.

Sounds quite crushing, doesn't it?

### But don't I need an app?

No! You don't.

The app is just being used for robot discovery on your network and can be completely replaced by
- looking at your routers webinterface and creating a bookmark with the IP 

OR
- not looking at the routers interface and just creating a bookmark for the mDNS hostname,

All the android one does is discover Valetudo instances and then open a browser.<br/>
You already have a browser on your iDevice.

...though, one that is frequently broken with no way for you to switch to a different browser, because on iDevices,
every browser is Safari as required by the ToS of their digital storefront.

There is no Blink or Gecko. There's only Apples special blend of WebKit including all its bugs and quirks.<br/>
But this is a different rant.

### Why is there an Android app then?

On Android, it's different:
- You can use any computer running Windows/Linux/Mac to develop an app for it
- You don't have to use a store; you can just distribute the APK for side-loading
- You don't have to use the vendor store; you can just use F-Droid which is free
- If you want to use the vendor store, you need to pay a one-time $25 and that's it

With effectively no barrier of entry, you can just start hacking something together
without first having to worry about some kind of business plan ensuring recurring revenue.
This allows for creation of tools that on other platforms would never exist because you
just can't (or don't want to) monetize them.

While Google - as all big tech - is of course following the exact same playbook, slowly chipping away at all that,
for now at least, it's way less bad and thus the best and _only_ thing we have. :(

### Final remarks

Just for reference, I'm not interested in any special Apple sponsorships or donations of iHardware.<br/>
If you even think about doing that, you've completely missed the point of the previous wall of text.

It's not about money. It's about not enabling these business practices.

Further reading:
- [2011, 28c3: The coming war on general computation, Talk by Cory Doctorow](https://archive.org/details/GeneralComputation)
- [2023, Technofeudalism, Book by Yanis Varoufakis](https://www.penguin.co.uk/books/451795/technofeudalism-by-varoufakis-yanis/9781847927279)
