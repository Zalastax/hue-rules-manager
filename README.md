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
   - Early night passes into late night automatically at 22:20 but clicking
     the off-button on the dimmer switch toggles between early and late night,
     allowing for overrides.
     See dimmer_switch_rules.ts.

The basis of the rules is fritsr's post:[
Better rules for motion sensor ](https://developers.meethue.com/forum/t/better-rules-for-motion-sensor/4937). Each motion sensor has rules following the pattern below. Each motion sensor is assigned to one room.

1. Each motion rule starts in the ARMED state. See motion_base_rules.ts.
2. When there isn't enough light and when there is also presence,
   the state transitions from ARMED to SHOULD_TRIGGER_SCENE. See motion_base_rules.ts.
3. A scene is selected, corresponding to the activity and time of day.
   See static_resources.ts.
   The scene covers the full home and the same scene is selected for all rooms.
   The scene is activated, but only in the room belonging to this sensor.
   The state transitions from SHOULD_TRIGGER_SCENE to SCENE_TRIGGERED. See activities.ts.
4. If the brightness override is active, brightness is decreased or increased.
5. If too long time passes, lights will dim.
   The state transitions from SCENE_TRIGGERED to DIMMED.
   See motion_base_rules.ts.
6. If presence is detected while the state is SCENE_TRIGGERED,
   the state will be set to SCENE_TRIGGERED again.
   This causes the dim-timer to reset without triggering the scene again
   and without triggering the brightness override again.
   See motion_base_rules.ts.
7. If presence is detected while the state is DIMMED,
   the state will be set to SHOULD_TRIGGER_SCENE.
   This causes the dim-timer to reset and causes the scene and brightness override
   to trigger again, thus removing the dimmed effect.
   See motion_base_rules.ts.
8. If 1 minute passes when the state is DIMMED,
   the lights in the room are turned of.
   The state transitions from DIMMED to ARMED.
   See motion_base_rules.ts.

It is possible to turn off all lights by holding the dimmer switch off button.

Several variables are reset if all lights are off.
Some variables reset if all lights in a room are off.
See motion_base_rules.ts.
Other variables reset if all lights in the home are off.
See dimmer_switch_rules.ts.
