# How?

Declarative method for managing Hue rules.
Method of working is to delete all Rules and Sensors created by this software,
followed by recreating them.

# Why?

Compared to writing rules by hand, TypeScript + Hue Node API:

- Uses abstraction to avoid repetition
- Uses named variables - way more readable rules!
- Does not use the API Debug tool

# How to use?

Create a file named .env.  
Provide environment variables:

```
HUE_USERNAME=<Username>
HUE_HOST=<Hue IP>
PREFIX=hue-rules-manager
```

Then run:

```
npm install
npm run start
```

# Logic

The system centers around (1) activities and (2) time of day.

1. The activity is cycled by pressing the on-button on the dimmer switch.
   See activities.ts, dimmer_switch_rules.ts and variables.ts.
2. Time of day is day, early night, and late night.
   - The system automatically decides between day or night using the builtin
     daylight sensor, which uses a configured location to calculate the day cycle.
     See motion_base_rules.ts.
   - Early night passes into late night automatically at 22:20 but pressing
     the off-button on the dimmer switch toggles between early and late night,
     allowing for overrides.
     See dimmer_switch_rules.ts.

Motion triggers lights to turn on in the room,
setting the scene based on activity and time of day.

Dimmer also allows changing the living room brightness.
