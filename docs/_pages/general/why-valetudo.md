---
title: Why Valetudo?
category: General
order: 6
---

# Why Valetudo?


First of all, please do **not** try to convince people to use Valetudo.

We all know how terribly it usually turns out when people try to convince their friends to use linux on their desktop.
Using Valetudo only makes sense if you understand its goals and feel like they are important to you. Everything else will fail.

It is perfectly fine to continue using the cloud if you don't really care about its downsides.
Do not flame people for doing that. You can be a bit snarky about downtimes, lag and other cloud shenanigans though :)

## Table of Contents
1. [An actually good vacuum robot that just works](#good_robot)
2. [A vendor-agnostic abstraction](#vendor_agnostic)
3. [No cloud connectivity](#no_cloud)
    1. [Your data stays at home](#data_at_home)
    2. [No server dependency](#no_server_dependency)
    3. [No sudden in-app pop-up ads](#no_popup_ads)
    4. [No forced updates](#no_forced_updates)
    5. [No sudden redesigns](#no_sudden_redesigns)
    6. [No account required](#no_account_required)
    7. [No marketing](#no_marketing)
    8. [Downsides](#downsides)
4. [Good integration into FOSS smarthome systems](#good_integration)
5. [No phone app requirement](#no_phone_app)
6. [Open Knowledge](#open_knowledge)

## Goals

### An actually good vacuum robot that just works<a id='good_robot'></a>

The reason Valetudo exists is that I really wanted a vacuum robot but didn't like that it wanted me to install an app.<br/>
But I didn't just want a vacuum robot. I wanted a good vacuum robot.

I also wanted it to just work like it would with the app and I wanted it to work reliably, so that I don't have to bother with it much.<br/>
(that did **not** work out for me personally, lol)

That was 2018 and it didn't change since then.

### A vendor-agnostic abstraction<a id='vendor_agnostic'></a>

As a vendor, lock-in is great. As a user, it is not.

While most vendor apps eventually converged to look and behave quite similar, that is always just "quite".
And, just because the app looks similar, doesn't mean that the integrations into other systems are too.

Valetudo is Valetudo. Everything implemented on the Valetudo level is mostly independent from the lower layers.
This means that buying a supported robot means getting the known experience.
It doesn't matter much who actually made that thing. You will still use Valetudo the same way you did on your other robot running Valetudo.

Another nice benefit of this is that you can easily mix and match robots (e.g. for availability or price reasons) without
suffering from having to use 3 different apps.

The only downside of this approach is that Valetudo will always be limited to a smaller common denominator between vendors,
meaning that this one cool thing just one vendor does might not be available.<br/>
Experience however has shown that if something is _actually good_ other vendors will eventually copy it.

### No cloud connectivity<a id='no_cloud'></a>

Removing the cloud has a wide range of benefits:

#### Your data stays at home<a id='data_at_home'></a>

With the rise of robots with cameras that use AI image classification based obstacle avoidance, what was "just" your
floor plan a few years ago might now be a picture of you sitting on your toilet ending up in an S3 bucket and, soon after, on the internet.

By not uploading these images to the cloud, this and other very unpleasant scenarios become a lot less likely.

Have I mentioned that many new robots also come with microphone arrays?

#### No server dependency<a id='no_server_dependency'></a>

Beside the data aspect, this also means that you won't need to have a working internet connection just to control your local vacuum robot anymore.

Commands usually execute much faster and more reliable, as they don't have to detour through some server in a datacenter
far away from you, which might be overloaded or even on fire.


Furthermore, the robot will continue working even after the vendor has ended support for that model and shut down the
corresponding servers. This is a recurring theme with IoT devices. They regularly brick because the vendor
- gets sold
- decided to move on
- wants to sell a newer generation
- changes its business model
- runs out of venture capital
- is bankrupt
- gets hacked

and more.

#### No sudden in-app pop-up ads<a id='no_popup_ads'></a>

Yes, this happens. Regularly.

#### No forced updates<a id='no_forced_updates'></a>

Without the cloud, you won't have to fear forced firmware updates that paywall or even entirely remove a previously available feature.

Bricked devices caused by faulty forced firmware updates are an issue that seems to happen from time to time.
One might for example push an update with extremely verbose logs enabled, leading to your flash wearing out and bricking your whole car.<br/>
You can't just not update to prevent those situations. It is also very hard/impossible to prove that a defect was caused
by the manufacturer.

#### No sudden redesigns<a id='no_sudden_redesigns'></a>

This is an extension of the "no forced updates", as it is what they usually facilitate.

I do miss the blades dashboard, but that was nothing compared to what we've been seeing in the last few years.<br/>
**Everything** we use regularly changes _completely_ for _absolutely no reason_ other than probably some microbenchmarks
showing that users are 0.3% more likely to buy when the button is at the other end of the application.

> Focus groups have shown that round edges are now bad.
> They will be edgy again for the next 72h, then return to being round every second sunday.


All that nonsense just doesn't happen when your device isn't internet-connected.

#### No account required<a id='no_account_required'></a>

By using Valetudo, you don't need to give anyone your phone number or e-mail address just to use the robot you've bought.
This way, it will never be part of a data breach as it was never stored in the first place.
Did you know that there's a german word for that? *Datensparsamkeit* — privacy by design

You also don't have to periodically read some hard-to-understand 200-page ToS where you're basically forced to agree,
as there often is no way to deny it while continuing to use the product.

#### No marketing<a id='no_marketing'></a>

With Valetudo, you won't get any ads. You won't get push notifications notifying you about new product launches.
You won't get nagged by the thing you own to upgrade to a new model or buy these new accessories for your existing one.

You also won't get emails from a third party trying to cross-sell you something.

#### Downsides<a id='downsides'></a>

The downside of not using the manufacturer-provided cloud services is that now you're responsible for installing (security)
updates and coming up with some way of remote connectivity (if desired).<br/>
All that fancy cloud stuff.

### Good integration into FOSS smarthome systems<a id='good_integration'></a>

This was actually somewhat new to me, as I had literally never seen the sorry state of integrating a lot of cloud-connected
devices into e.g. Home Assistant, but it is apparently really bad.

_If_ there is anything at all, they often just expose a subset of not just what is available but also what you would actually want to do.<br/>
A $1300 vacuum robot where all you can do with HA is press the "start" button. What a joke.

Valetudo offers a much more featureful integration and I strongly encourage you to use it to get the most out of your robot.

It is however worth noting that Valetudo is not a tool meant to integrate a robot into a smarthome system.<br/>
Its primary goal is to **uncloud**.

### No phone app requirement<a id='no_phone_app'></a>

Many consumer IoT devices require you to have a smartphone to run the vendor app to provision and control it with no way of using your
desktop computer, laptop or a smartphone with a different operating system than android/iOS for that.

With Valetudo, you get a webinterface that can be used by any device with any operating system capable of running a recent
multi-platform browser including desktops, laptops, smartphones and maybe even your smart fridge.

At times, thanks to the fully responsive design, the experience can even be _objectively_ superior to what the vendor provides.
Some users for example reported that some vendor apps do not play well with tablets and instead just display the phone-optimized
views in an upscaled way on the large tablet screen, wasting all that screen real estate on black borders.

### Open Knowledge<a id='open_knowledge'></a>

Valetudo is released under a permissive license. You're free to understand and modify your instance of Valetudo as you like.
There's a lot of documentation. The code is pretty well-structured and features comments where required.

Even if for example the Valetudo Companion App were to become delisted from the store-thingy of your operating system,
you'd still have everything you need to be independent of that. Even if GitHub goes down, it doesn't matter.
Git is decentralized by default. Use a local backup. Use a backup somewhere else.
