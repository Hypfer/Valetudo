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

## Can I run Valetudo elsewhere and just redirect the cloud DNS? <a name="elsewhere"></a>

**No.**

Think about it. Why would we go through all this rooting trouble if there was an easier way?<br/>
Especially since that _easier way_ is so trivial, **everyone** has already come up with it 20s after learning about Valetudo existing.

No, life isn't that simple, sorry. Or not sorry, actually, because that is a good thing. IoT **should** be secure for the regular user.<br/>
It would be terrible if you could easily take over a whole fleet of expensive vacuum robots in peoples home networks just by messing with DNS.

For us as people who want to own our devices it's bad, yes, but insecure IoT devices aren't the solution to that.<br/>
They being hackable just by-accident happens to be a super inefficient band-aid "solution" with lots of collateral damage.<br/>
_e.g. regarding End-User privacy, security, DDoS Botnets etc._

The proper solution is strong legislation enforcing product usage either without the cloud or with your own cloud
in a controlled fashion right out of the box.
The vendor cloud can still be an option, but it must not be the only way to use an IoT Device.

## Can I use Valetudo to bypass region locks? <a name="regionlock"></a>

**No.**

Valetudo does not support bypassing region locks to e.g. use a CN unit outside of CN.

The reasoning behind this stance is that, as it works right now, Valetudo existing does not have any negative impact
on sales for the vendors.<br/>
In fact, I'd argue that it has an ever-growing **positive** impact on their bottom line, because
lots of people buy their products _only_ because they can use it with Valetudo.

However, as soon as you decide to undermine regional pricing strategies of these vendors, you'd be giving them a
_very good reason_ to try their hardest to shut you down. It would be foolish and short-sighted to do that.
On-top, it would also be futile to do that.
You as some rando hacker and developer can't win against a corporate entity of that scale. At least not long-term.<br/>
If you give them (or rather their investors) a business incentive to stop you, they will stop you.

And what would it be good for anyway?<br/>
Is allowing a few people to save some minor amounts of money worth souring the relations with the vendors?<br/>
Is getting what you want (CN unit with cool features in EU) worth jeopardizing the ability of regular buyers to use their
robot without the cloud?


Yes, I hear you, you bought the HW and now you want total freedom over it because you paid for it.<br/>
It's an understandable perspective, but that's not how the world works. And - most importantly - you won't be able to change
how the world works by just forcefully trying to get what you want without considering the needs of other parties involved.




## Can you support Robot Model XY? <a name="newbot"></a>

Sure! We'd be glad to look into your case. To help us help you, we only require you to buy and permanently
donate 3 units of the robot in question to us. (2 for HW Hacking, 1 for SW Hacking)

Though we can't promise to be successful, we strive to achieve a success rate of at least 3%.<br/>
As with any R&D project though, we unfortunately can't offer any refunds if we fail to get the robot support.

We thank you for your understanding and are looking forward to doing business with you!

## Why is there no reboot button in Valetudo? <a name="reboot"></a>

Because it would be harmful to have that.

You see, people in general are lazy.<br/>
The laziest of the lazy people then usually become programmers and the laziest of those then become the very good programmers.

This is because as a programmer, if you do it right, you only **once** have to teach a computer how to do something and after that it will just do its thing and you can return to doing nothing.
But you can only do nothing in peace if you can ensure that the computer will actually do its work correctly.

Because of that, you'll try your hardest to build bug-free software that just works because the last thing you want to do is actually work in front of a computer.

**This inherent drive to not work at all and especially not with computers is the feedback loop and incentive system that creates great software.**


So what happens if instead of spending 12h debugging some arcane network-related issue that deadlocks the system on each tuesday when there's a full moon, you could just add a nightly reboot?<br/>
You're a programmer. You're lazy. Which option do you pick?

Exactly. You do the auto-reboot thing, shrug, say "eh, good enough" to yourself and then return to not working.

But what else did you do?
- You accepted that the software can just be broken and with that you've lowered its standards. Significantly.
- You gave up on the opportunity to learn something. Something non-trivial even. Understanding of systems that would've likely improved your skills.
- You also misjudged, because the issue doesn't just affect tuesdays when there is a full moon. The underlying issue breaks half of the software. You just didn't notice yet.


Adding a reboot button is accepting mediocrity. It's accepting that you won't understand what is going on. You just decide to not bother.<br/>
And that can be a reasonable choice depending on your situation.

For example, if you're business, it might just make financial sense to just reboot instead of dumping a few hundred engineering hours into a rabbit hole.
"Good enough" is all you need to sell a product.

You might also just be some hacker that wanted to solve an issue in a "good enough" way. That's also fine.
You don't have to always go the extra mile. That doesn't scale. Good enough can be good enough.


With Valetudo however, I don't want the project to just be "good enough". I want it to be great - or at least strive towards being that.<br/>
Because of that, there can't be a reboot button, since as soon as there is one, things will just not get fixed, improved or even just reported anymore.


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
