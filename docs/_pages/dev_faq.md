---
title: Frequently requested features
category: Misc
order: 31
---
# Frequently requested features

## Translation support

While a lot of people are asking for this feature, I'm afraid it won't happen anytime soon if ever.

Let me explain the reasoning behind this with an example. Consider this car radio in a car made for the german market:

![Bosch Car Radio](./img/car_radio.jpg)

In fact, the radio is engineered by Bosch in Hildesheim. Still, the button isn't labeled `Karte`.

Now, let's take a look at the Valetudo UI (Version 0.6.1):

![Valetudo 0.6.1 UI](./img/valetudo-ui.png)

Regarding overall complexity, it's comparable to the buttons on the radio.
It's even easier to understand, because there are a lot more icons. <br/>
Considering that people do in fact manage to use their car radios even if their english skills may be lacking,
I'd say that **accessibility** isn't a problem here.


As a matter of fact, Internationalization isn't free. It always introduces more work, more complexity etc.<br/>
Of course **accessibility** is often worth the effort, however since we've already established that this factor isn't relevant here, 
we can take a look at a non-exhaustive list of downsides of i18n:

* Getting support is harder when screenshots/error messages are in a language that isn't english, because supporters may not speak it
* Development of new features, refactoring etc. is always blocked by having to translate everything new to all languages
* Increased codebase complexity
    * Harder to read
    * Harder to work with
* Lots of initial work to translate everything
    * Time/effort that could be spent better elsewhere

# Multiple Maps / Multi-Floor

Multiple maps are a feature that is inherently linked to a huge increase in code complexity since most functionality
of the robot needs to be aware of not only that there are multiple maps but also, which one is the current one.

It gets even worse when there are multiple versions of each map due to stuff like automated snapshots/backups.

This change costs time and therefore money, but it is not just a one-time payment. The increase in complexity is permanent
and therefore the cost of maintaining the codebase is also increased permanently.

This means that even if there was a PR to reduce the initial cost, it would still not be merged due to its permanent impact
on the running costs.


I'm talking a lot about the word `cost` here, because `cost` is also why vendors started to implement Multi-Floor features
in the first place.

"Hey, you don't need to buy one robot for each floor. Instead, simply use this feature. It's much cheaper for you.", is 
what the vendor is saying to you.

And indeed, having multiple maps is cheaper for you. However, there ain't no such thing as a free lunch.<br/>
It's not cheaper in general but instead the costs are simply moved from you to me and that ain't happening.


Furthermore, as of now (2021-02-12), you can get a supported vacuum for less than 300€. Soon™ you should even be able to
get a supported vacuum for less than 200€.<br/>
If you're owning a multi-floor home, there is absolutely no possibility that you're not able to afford that.

And of course since vacuum robots cannot climb stairs and there's also no way to buy a second charging station for many models,
the whole multi-floor experience is just objectively inferior.
However as one can clearly see, this isn't the main point here, since you're free to suffer as much as you want to if you so desire.<br/><br/>
Just don't pull me into that.
