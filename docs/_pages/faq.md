---
title: FAQ
category: Misc
order: 30
---
# Frequently asked questions

To preface this with some general thoughts providing context:

In a similar fashion to the [Why not Valetudo?](https://valetudo.cloud/pages/general/why-not-valetudo.html) page,
the way an FAQ grows is not proactive but reactive.<br/>
Specifically, what you can find here will likely to some degree look defensive, because it is defensive; usually being the result
of a post-mortem analysis of or just a rebuttal against a common conflict or pain-point.

It is here to and will provide you with answers, but those answers will also come with some remnants of the emotions that forged them.
This is intentional, as it offers additional context, dry words might not be able to fully convey.

## Table of Contents
1. [Why the name?](#why_the_name)
2. [Can I use Valetudo without an internet connection?](#offline)
3. [Can I run Valetudo elsewhere and just redirect the cloud DNS?](#elsewhere)
4. [Can I use Valetudo to bypass region locks?](#regionlock)
5. [Can you support Robot Model XY?](#newbot)
6. [Why is there no reboot button in Valetudo?](#reboot)
7. [Why is there no HTTPS support?](#https)
8. [Why is there no iOS companion app?](#ios)
9. [Why is there no Matter support?](#matter)
10. [Why aren't you doing X?](#x)
11. [What is the contingency plan for Valetudo?](#contingency)


## Why the name?<a id='why_the_name'></a>

Valetudo is the roman name for the greek goddess Hygieia, which is the goddess of health, cleanliness and hygiene.

## Can I use Valetudo without an internet connection?<a id='offline'></a>

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

## Can I run Valetudo elsewhere and just redirect the cloud DNS?<a id='elsewhere'></a>

**No.**

Think about it. Why would we go through all this rooting trouble if there was an easier way?<br/>
Especially since that _easier way_ is so trivial, **everyone** has already come up with it 20s after learning about Valetudo existing.

No, life isn't that simple, sorry. Or not sorry, actually, because that is a good thing. IoT **should** be secure for the regular user.<br/>
It would be terrible if you could easily take over a whole fleet of expensive vacuum robots in peoples home networks just by messing with DNS.

For us as people who want to own our devices it's bad, yes, but insecure IoT devices aren't the solution to that.<br/>
Them being hackable just by-accident happens to be a super inefficient band-aid "solution" with lots of collateral damage.<br/>
_e.g. regarding End-User privacy, security, DDoS Botnets etc._

The proper solution is strong legislation enforcing product usage either without the cloud or with your own cloud
in a controlled fashion right out of the box.
The vendor cloud can still be an option, but it must not be the only way to use an IoT Device.

## Can I use Valetudo to bypass region locks?<a id='regionlock'></a>

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

**2025 Update**

With the geopolitical difficulties of the current century also come new nuances to this topic.
Specifically, we have seen vendors disable IoT devices also as part of international sanctions.

Wherever you might stand on these conflicts and wherever you might be coming from, I think we can agree that even just
dipping your toe into that topic is a massive business liability. Thus, I won't.

I enjoy geopolitics as something watched from afar; not something where I suddenly find myself on the chessboard.


## Can you support Robot Model XY?<a id='newbot'></a>

While Valetudo tries its best to be generic and reuse code wherever possible, since it is not a custom firmware,
the backend is basically a few huge chunks of code that are very specific to the respective vendor firmware and cloud architecture they try to emulate.

Supporting any new vendors is thus quite a large task because not only requires it to write large parts of the backend
again from scratch but also do the reverse engineering of data formats, authentication, communication and various functionality
with no documentation from the vendor available.

It's a time-consuming process that mostly involves random chance and that can only start once security vulnerabilities
leading to system administrator level access on the hardware in question has been found. A similar reverse-engineering process
without any documentation that is also quite time-consuming and mostly involves random chance.

<br/>

Valetudo only runs on the supported robots because security researcher [Dennis Giese](https://dontvacuum.me) found ways
to root them.

Rooting in this context means taking these locked-down IoT devices, finding and exploiting security flaws in their design
and gaining permanent system administrator level access to them to allow for running additional custom software such as Valetudo
and modifying the system to make the unclouding possible.

These security flaws are all 0days of which we sometimes need multiple to achieve the rooting.<br/>
They're also specific to one specific vendor's implementation of something on one specific piece of hardware.

With a public root release, these get burned and usually quickly fixed by the vendors, making finding a working exploit chain
for newer models after the release harder or sometimes even impossible.

<br/>

Therefore, please refrain from asking if something that isn't on this list is supported.<br/>
Please do not ask if someone "tried" it. Please do not state that you would like it if something would be supported.

Without explicitly mentioning this, readers often expect that something not being supported just means that
no one has tried it yet, which is more akin to how e.g. running GNU+Linux on some random laptop works.

Thank you for your understanding

## Why is there no reboot button in Valetudo?<a id='reboot'></a>

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


## Why is there no HTTPS support?<a id='https'></a>

While this could be a text about why HTTPS isn't really required for the Valetudo use-case, a more interesting answer is the following:

Because unfortunately, the way HTTPS is spec'd simply does not really account for private local usage.

What do I mean by that? Well if you think about how properly implemented HTTPS works, you'll see the following:

You have a **public-facing host** with a **globally unique identity** `(the Domain)` provided by some kind of **global authority** `(the Institution behind the TLD)` that
is **aware of your identity** in exchange for **a monthly rent**.<br/>
Before LetsEncrypt or if you're a serious entity, you'd also have another **global authority** `(the Certificate Authority)` that is **aware of your identity**
who issues and assures a different **globally unique identity** `(the Certificate)` based on the other **globally unique identity** `(the Domain)` in exchange for **a monthly rent**.


If all of these things have a nice green check mark ✅, everything is fine. If not, however, the browser will do
everything it can to stop your grandma from giving away her credit card information to a talking moose.

This is great if HTTPS is something exclusively used by serious institutions like your bank as it was before Snowden 2013.<br/>
However, it is not great if HTTPS is used everywhere for everything, because of all the global, public and rental components in there.

IMO, it really shows that the protocol has never fully left its historic roots behind. It solved the problems at the time
and since then we've been modifying our problems so that they fit the existing solution by just putting everything
into the cloud.

### But there are workarounds!

Yes, there are indeed workarounds. But, as the word states, they are just workarounds around a problem that needs fixing.

- You can eat up the domain and public host requirement and do something with LetsEncrypt wildcard certificates.
- You can run a public-facing reverse proxy with an LE cert that only allows communication from the local network.
- You can "just" run your own CA, import that root cert into every device you own and maintain that till the end of time.
- You can use a self-signed cert and live with the browser screaming at you that you're about to die and the world is going to end + breakage where you can't accept a self-signed one.

I'm sure that there are more options, but they all have one thing in common: <br/>
They're not a solution. They're all hacks that require money, knowledge, maintenance and (cloud) infrastructure.

They might be good enough most of the time, but they still suck in one way or another.

### But this is how it has to be!

Well.. does it really?<br/>
Did you ever ssh into a raspberry pi sitting next to you?

That connection was secure, wasn't it? And yet the thing was entirely local.

Imagine ssh having the same requirements as https.<br/>
Imagine it throwing the same big red warnings at you every time you use it without some public cloud identity that costs money.

Because why wouldn't you imagine it. What makes it different?<br/>
The problem space it solves certainly is quite similar in that regard at least.

Yes, your grandma isn't doing online banking over ssh, but is your grandma really the only stakeholder we should be considering
in how we design basically all our software and connectivity?

After all, _everything_ is HTTPS so shouldn't HTTPS also be for everything?

### What do you propose instead?

One approach could be to un-hack the hacks and take the pain out of running a CA at home similar to what LetsEncrypt did for everything non-local.
Make that something mere mortals can do. Make it so easy, it could be a feature of a prosumer router.
Make it something that works reliably 10 years into the future.

My vision there would be to have a CA-in-a-Box that is e.g. just a Docker Image that you spin up and then point all your
IoT devices to so that they can pull certs via ACME or similar. Something specifically targeting home use by people that
don't have homelabbing as their currently pursued main hobby and thus featuring UX suited for that:<br/>
Management, metrics etc. would be done via a Webinterface and that Webinterface also comes with a Help section where you
get step-by-step guides on how to install the root cert written for all relevant devices (Android, iOS, Windows, Mac, etc.)

And with that, you suddenly have HTTPS at home in a way that works, that scales and that doesn't require constant maintenance.

I'm sure that there are other approaches as well, however, I actually quite like this one, because it doesn't require
any change of the spec itself. It could be implemented right now. We have everything we need to do so. It's not even that complex.

We could have proper offline, anonymous, accessible, compliant and cloud-free HTTPS at home tomorrow. Someone simply needs to do it.
However, that will never happen if we always resort to workarounds that are just "good enough" and then not bother anymore.


## Why is there no iOS companion app?<a id='ios'></a>

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


## Why is there no Matter support?<a id='matter'></a>

A few reasons, actually.

The most important one being that Matter attempts to be a solution to a problem Valetudo simply doesn't have.
Any smarthome software that respects you and thus is suited to run something as vital to your
life as your home _already has open interfaces where you can connect Valetudo_.
We've had them since years. Decades even.

The only "smart" home "solutions" that won't nicely integrate with FOSS are those cloud-based Big Tech ones and supporting
these is a strong non-goal for the project for obvious reasons. Besides, why would you even uncloud to then recloud again?
The stock vendor apps for our vacuum robots already integrate with Google Home/Alexa/etc.


Secondly, if you look at the spec, you'll find that Matter was designed exclusively to solve Big Techs use-case of being
able to talk to other Big Tech products.
This of course didn't happen because they wanted to but because it was the absolute bare minimum they _had_ to do.
Customers disliked the interoperability issues of IoT crap _so much_ that they decided to just don't buy any IoT products at all anymore.


If you look at the Matter spec, this shows, because you'll see that to use it, you will need one of the 65535 possible
Vendor IDs that you can get for $7000 a year from the Connectivity Standards Alliance that is behind Matter. A maximum of
65535 Parties _forever_ and all of them required to pay thousands of dollars yearly for the right to use a protocol.

Does this sound open to you? Does this sound like something designed to "solve smarthome" in a way that
goes beyond the needs of few large corpo players?

<br/>

Nearly everything FOSS you've seen so far that talks Matter uses one of the reserved "Test Vendor 1-4" Vendor IDs that
are supposed to be used for development only. Don't think that is the intentional escape hatch for that fee though,
because the vendors thought of that.

If you want to use your home-built Matter device with Google Home, you will have to jump through 6(!) hoops for every
single device you want to use as documented in [the Tasmota documentation](https://tasmota.github.io/docs/Matter-with-Google/).
It is only a matter (heh) of time until the other Vendors will follow. So much for an "open standard".

And even if you don't want to build your own devices, remember that with Matter, you will still need all the vendor apps
for most product features because anything beyond the basics can't be exposed via matter.<br/>
"Solving smarthome" but you'll still need all the vendor apps with all their accounts. What was the point of it again?

Lastly, if you've followed the launch of Matter and are also following the current state of it, you will see just
how much of a dumpster fire that is. It just doesn't work even for the bare minimum it promised to do.<br/>
By-design of the spec, it is unsuited to solve what people wanted it to solve and yet even the tiny subset that it would want to solve doesn't work properly.

<br/>

Matter is purely marketing that doesn't deliver on any of its promises. Don't let it fool you. Especially since the real thing is already here.<br/>
The FOSS smarthome actually _is_ what Matter _pretends_ to be. It's here right now and has been since years.

<details>
<summary>Click here for some additional thoughts on the matter (heh)</summary>
<br/>
<p>
The following was a reply by me to a reddit post titled "What do you folks think of Valetudo's criticism of Matter/Thread?":
</p>

<p>
Please keep in mind that the FAQ entry exists as a defense against hyped people wanting Matter support in Valetudo. The takeaway shouldn't necessarily be that Matter is genuinely bad. It's just bad for the use case.
</p>
<p>
Personally, I don't think that Matter is terrible. For what it is, it is a step forward.<br/>
It's a small step and it shouldn't be how it is in the first place, but as things are the way they are, it's a good development that the big tech vendors are opening up their devices even if it's just a little.
</p>
<p>
I also think that It's a very good thing that Nabu Casa is a member of the CSA-IOT (the standard body behind Matter) and does what they can to influence Matter to be as useful and local (and open?) as they can get it to be.<br/>
Without them, it would probably only be cloud-based big tech speaking with other cloud-based big tech.
</p>
<p>
One unfortunate downside of that however is that their involvement with Matter breaks the "if HA endorses it, it must be open, good and correct" heuristic people in this space tend to rely on.
</p>
<p>
Thus, what I'm missing a bit from Nabu Casa there is the "hey, this is bad and we know that this is bad but we're doing it anyway so that it is less bad for the community" talk. But otoh that's just me the idealist rambling while they are out there actually making real money to feed their families with something that is foss but also a commercial product.
</p>
<p>
Anyway, Matter hasn't failed and also isn't useless.<br/>
It isn't "the solution to smarthome" as it is being sold all the time though either.<br/>
It's somewhat local APIs for products that would otherwise never gain those and that's definitely a good thing.
</p>
<p>
The better thing however would be to not buy products like that in the first place. Because why buy something that does the absolute bare minimum? Why give people money for something that is actually bad but by pure circumstance became less bad?
</p>
<p>
If you want a takeaway about Matter (or anything in this space, really) then it's that you shouldn't get hyped up about new thing by people pretending to be tech journalists that are actually just an extension of the marketing team of whatever electronics manufacturer they're reporting about.<br/>
Just see and wait how things develop. Do not buy based on hype.
</p>
</details>
<br/>

## Why aren't you doing X?<a id='x'></a>

Alternative headline: You should be doing X

This usually comes as more of an imperative pretending to be a question - not always consciously.
Often framed as best practice, industry standard or the morally right thing to do.

While from the outside it might not always seem like it, most of the decisions I make are done so deliberately and as part of a bigger coherent vision and picture of the world.
Specifically, I have spent a lot of time thinking about open source, sustainability, resource management and other related topics.

What I am doing, I am doing because I have deemed it optimal and as the best course of action for the specific given circumstances and constraints.
Which is not to say that I would be above learning or feedback, but it does mean that I can't simply just "try doing something else", when I know beforehand that I consciously decided against that specific "something else".

It also isn't to say that I won't be very wrong sometimes. I will be very wrong sometimes. And then I will iterate.
That iteration however will be intrinsic with me plotting the path deduced from the situation by me through me and for me.

I do not need any unsolicited logical or conceptual prefabs (n.b. prefab != input), as they are - by their nature - a worse solution and unnecessary shortcut.
Unless of course I feel like I absolutely need this shortcut, but then I will be the one looking for it. It will not find me.

I simply do not have the lifetime to run experiments against my own better judgement.<br/>
I simply cannot live for someone else.<br/>
There is no time for that.

Thus, if I do not do something even though you're convinced that the world would be better if I just did this one thing, rest assured, I'm not doing that out of malice or ignorance.
We're simply all dying, and I just cannot waste this limited time by playing a role other people believe I should be playing.

## What is the contingency plan for Valetudo?<a id='contingency'></a>

Well, you see, software developers are actually artists.<br/>
They create something out of nothing just by using their imagination and inspiration from the real world.

This also shows in their general views, sleep cycle etc. etc. which all tend to match the ones of people working in 
creative jobs/projects much more than the ones of people that work in "regular" jobs.

As with every piece of art, there's always a part of the creator in it.<br/>
If you take the creator away mid-creation and replace them with someone else, the piece also becomes something else.

Even if you try to emulate what there was previously, the result will still be something different.<br/>
Worse, the result will not only be something different but also _limited_ by the constraint of trying to be how it was before,
even though it could be so much more if it was to stand on its own instead of just continue what came before.

<br/>

This is the main reason why there won't ever be a maintainer handover. Because doing that is impossible.<br/>
As soon as you hand over maintainership, the old thing is gone and something new emerges.

And, as said, that's bad.<br/>
Not only because it limits what the new thing could become but also because name, branding, website, etc. still imply
that it's the same old thing. It creates a deceptive mismatch of what people expect vs what is the actual reality.

This is not only a theoretical issue. It is something that is being exploited in various ways all the time in the real world.

For example:
- Management of a company changing entirely with the brand and reputation staying the same (e.g. Aircraft manufacturers)
- A brand being bought by some other company that now sells products that have been engineered by entirely different people under that same old badge (e.g. Household appliance manufacturers)
- The 2024 supply-chain attack against openssh sshd via xz's deceptive insertion of a malicious new maintainer by gaslighting the old one

<br/>

I don't plan to stop maintaining Valetudo in the foreseeable future. I like maintaining Valetudo.<br/>
However, reality exist, diseases exist, buses that can run you over exist, jobs change, priorities change etc etc.

If for whatever reason I will stop maintaining Valetudo, Valetudo will die.<br/>
At that moment, it will be over.

However, since it's foss, its spirit will live on.<br/>
Someone can and will pick it up, slap a new name on it - clearly communicating that change - and then life will go on.

Being local-only and fully self-contained, the frozen-in-time Valetudo will continue to work indefinitely up until rot and entropy consumes it;
giving users peace of mind that what they have will continue to be forever, but also giving a successor a significantly large time window to come up with something new.

Therefore, I'm not worried about "not having a contingency plan" or "not having any additional maintainers", because the license _is_ the contingency plan.<br/>
It's not a fallback either. It's the best contingency plan there can be.
