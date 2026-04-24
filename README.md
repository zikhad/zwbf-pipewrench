# ZomboLust Being Female

<center>
  <img alt="poster" style="width: 300px;border: 5px solid" src="./src/root/poster.png">
</center>

---

## Overview

**ZomboLust Being Female** is a comprehensive female roleplay enhancement mod for Project Zomboid. This mod introduces realistic female biological systems including menstrual cycles, pregnancy, lactation, and related gameplay mechanics. It provides an immersive experience for players seeking deeper roleplaying opportunities in the zombie apocalypse.

The mod features a complete reproductive system simulation with visual indicators, trait-based modifiers, and extensive UI integration. All systems are designed to be balanced and configurable through sandbox options.

## Features

### 🩸 Menstrual Cycle System
- **Realistic Cycle Tracking**: 28-day menstrual cycle with 6 distinct phases:
  - **Recovery**: Post-pregnancy recovery period
  - **Menstruation**: Bleeding phase with configurable pain effects
  - **Follicular**: Hormone building phase
  - **Ovulation**: Peak fertility window
  - **Luteal**: Pre-menstrual phase
  - **Pregnant**: Pregnancy state
- **Fertility Calculations**: Dynamic fertility rates based on cycle phase and traits
- **Pain Simulation**: Menstrual cramps with trait-based severity modifiers
- **Cycle Visualization**: UI indicators showing current phase and fertility status

### 🤰 Pregnancy System
- **Full Pregnancy Simulation**: gestation period with progress tracking
- **Fertilization Mechanics**: Realistic conception based on fertility rates and timing
- **Labor & Birth**: Animated birthing sequence
- **Postpartum Recovery**: Recovery period affecting future fertility
- **Pregnancy Indicators**: Visual and UI feedback throughout gestation

### 🥛 Lactation System
- **Milk Production**: Dynamic milk generation based on pregnancy and traits
- **Expiration Mechanics**: Milk can dry up if not pumped regularly 
- **Lactation Traits**: Special traits that enhance milk production and duration
- **Visual Feedback**: UI showing milk levels and lactation status
- **Fluid Mechanics**: Integrated with build 42 fluid mechanics.

### 🎭 Character Traits
The mod adds several female-specific traits that modify gameplay:

- **Fertile**: +50% fertility rate
- **Infertile**: Complete infertility (cannot get pregnant)
- **Hyperfertile**: +100% fertility, faster postpartum recovery
- **Pregnant**: Active pregnancy state
- **Dairy Cow**: +25% milk production and +25% lactation duration
- **Bad Menstrual Cramps**: 2x stronger menstrual pain
- **No Menstrual Cramps**: No menstrual pain effects

### 🎨 User Interface
- **ZLBF Panel**: Dedicated UI panel accessible from the character info screen
- **Real-time Monitoring**:
  - Womb status (sperm levels, cycle phase, fertility)
  - Lactation status (milk amount)
  - Pregnancy progress and status
- **Visual Indicators**: Dynamic images showing womb and lactation states
- **Animation Support**: Visual feedback for intercourse and birthing

### 🎬 Animation System
- **Intercourse Animations**: Contextual animations based on pregnancy status and protection
- **Birthing Sequences**: Animated labor sequence
- **Dynamic Rendering**: Animation frames change based on game state

### 🔧 Debug Tools
Built-in debugging utilities for testing and development:
- Womb data manipulation (sperm levels, cycle progression)
- Lactation controls (milk amount, toggle status)
- Pregnancy management (start/stop/advance)
- All accessible through the `Debug` property on component instances


---
## API for Other Mods

This mod provides extensive event hooks for other mods to integrate with:

### Events
#### `ZLBFPregnancyUpdate`: Fired when pregnancy data changes
```lua
Events.ZLBFPregnancyUpdate.Add(function ({
  progress --[[ number ]],
  current --[[ number ]],
  isInLabor --[[ boolean ]]
}) {
  -- called every minute during pregnancy
});
```
#### `ZLBFLactationUpdate`: Fired every minute with lactation data
```lua
Events.ZLBFLactationUpdate.Add(function ({
  isActive --[[ boolean ]],
  milkAmount --[[ number ]],
  multiplier --[[ number ]],
  expiration --[[ how many minues due expiration ]]
}) {
  -- called every minute
});
```
#### `ZLBFWombUpdate`: Fired every minute with womb data
```lua
Events.ZLBFLactationUpdate.Add(function ({
  amount --[[ number ]],
	capacity --[[ number ]],
	total --[[ number ]],
	cycleDay --[[ number ]],
	fertility --[[ number ]],
	onContraceptive --[[ boolean ]],
	chances --[[ Table<CyclePhase, number>]]
}) {
  -- called every minute
  -- chances is a table as follows
  --[[
    {
      Recovery = 0,
      Menstruation = 0,
      Follicular = ZombRandFloat(0, 0.3),
      Ovulation = ZombRandFloat(0, 0.4) ,
      Luteal = ZombRandFloat(0.85, 1) ,
      Pregnant = ZombRandFloat(0, 0.3) 
    }
  ]]
});
```
#### `ZLBFPregnancyLabor`: Fired during labor
```lua
  Events.ZLBFPregnancyLabor.Add(function (delta --[[ number ]]) {
    -- delta is a number between 0-1 that represents how far along the labor is
  });
```
### Triggers
#### `ZLBFIntercourse`: Trigger for intercourse event
This will check for condoms and handle intercourse based on current conditions
```lua
  triggerEvent("ZLBFIntercourse");
```
#### `ZLBFMenstrualEffects`: Trigger for menstruation effects
```lua
  triggerEvent("ZLBFMenstrualEffects");
```
#### `ZLBFPregnancyStart`: Trigge to start pregnancy
```lua
  triggerEvent("ZLBFPregnancyStart");
```
#### `ZLBFWombAnimation`: Triggers a womb animation
Usually triggered inside a Update of a **Custom Animation**
```lua
  triggerEvent("ZLBFWombAnimation", {
    animation = "intercourse" --[[ A valid womb animation ]],
    delta = 0.5 --[[ number - usually the action.getJobDelta() ]],
    duration: 1 --[[ number - usualy the action.duration ]]
  });
```
#### `ZLBFWombAnimationStop`: Clear the womb animation state
usually is called at Perform / Stop of a custom animation. ensure the `Animation.wombImage` can show the still image again
```lua
  triggerEvent("ZLBFWombAnimationStop");
```
#### `ZLBFWombImage`: Updates the womb image for the current static image
This will update the `Animation.wombImage` based on current womb / pregnancy state
```lua
  triggerEvent("ZLBFWombImage");
```

---

## Installation

1. Download the mod from the [releases page](https://github.com/zikhad/zwbf-pipewrench/releases)
2. Extract to your Project Zomboid mods directory
3. Enable "ZomboLust Being Female" in the mod menu

## Requirements

- **Project Zomboid**: Build 41.78 or later

## Configuration

The mod includes several sandbox options for customization:
- Cycle duration and phase lengths
- Fertility multipliers
- Pain effect intensities
- Lactation rates and durations
- Animation settings

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## Credits

- **Zikhad**: Lead developer and maintainer
- **[PipeWrench](https://github.com/asledgehammer/PipeWrench)**: Framework for Typescript zomboid mod creation

---

# Upcoming Changes
- [x] Fix animation looping
- [x] Fix contraceptive effects (seems not to be working)
- [x] Check and potentially fix Lactaid
- [x] Create Sperm fluid
- [x] Make distribuitions work
- [x] Fix HaloTextHelper from Moodles.ts
- [x] Revamp body effects methods
- [x] Add pain at birth
- [x] Add fatigue and at birth
- [x] Create triggers event for animations
- [x] Reintroduce Babies or similar artifacts
- [x] Inspect the ZomboLust (new mod that aims to replace Zombowin)
