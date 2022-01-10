export const QuirksHelp = `
## Quirks

Valetudo aims to be a generic abstraction. That means that it tries to unify vendor-specific commands and concepts
into generic ones so that you don't have to worry about which brand of robot you buy as Valetudo will work
the same on all of them.

Sometimes however there might be things that only one Vendor or even only one model of robot does.
Adding that to the core infrastructure of Valetudo wouldn't make sense as the generic interface would soon become an 
interface specific to one particular robot which would go against the core goal of being vendor-agnostic.

Still, limiting features to the least common denominator may at times also not be ideal.
This is where quirks come in.

**A quirk is a vendor, robot or firmware-specific tunable that doesn't fit into Valetudo (yet?).**

The availability of a quirk may change at any time depending on various factors.
If there are similar quirks across multiple vendors, these will likely at one point become a real capability with
real REST endpoints etc.

Think of quirks as some kind of convenience playground testing section.
Usually, they will be tunables that you change once and then likely never touch again.

Please don't try to automate changing quirks as there are no guarantees whatsoever in regards to both stability
as well as availability. They just exist for this UI.

`;
