# Zombowin Being Female

<center>
  <img alt="poster" style="width: 300px;border: 5px solid" src="./src/root/poster.png">
</center>

---

## Overview

**ZomboWin Being Female** is a comprehensive female roleplay enhancement mod for Project Zomboid. This mod introduces realistic female biological systems including menstrual cycles, pregnancy, lactation, and related gameplay mechanics. It provides an immersive experience for players seeking deeper roleplaying opportunities in the zombie apocalypse.

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
- **ZWBF Panel**: Dedicated UI panel accessible from the character info screen
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
- `ZWBFPregnancyUpdate`: Fired when pregnancy data changes
- `ZWBFLactationUpdate`: Fired when lactation data changes
- `ZWBFAnimationUpdate`: Fired during animation sequences
- `ZWBFIntercourse`: Fired during intercourse events
- `ZWBFPregnancyStart`: Fired when pregnancy begins
- `ZWBFWombOnEveryHour`: Fired hourly for womb updates

### Usage Example
```lua
-- Listen for pregnancy events
Events.On("ZWBFPregnancyUpdate", function(data)
    -- Handle pregnancy update
end)

-- Trigger custom events
triggerEvent("ZWBFIntercourse", { player = player, protected = true })
```

## Installation

1. Download the mod from the [releases page](https://github.com/zikhad/zwbf-pipewrench/releases)
2. Extract to your Project Zomboid mods directory
3. Enable "Zombowin Being Female" in the mod menu
4. Ensure "42UIAPI" is also enabled (required dependency)

## Requirements

- **Project Zomboid**: Build 41.78 or later
- **42UIAPI**: Required for UI functionality
- **PipeWrench**: Framework for mod development

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
- [ ] Inspect the ZomboLust (new mod that aims to replace Zombowin)
- [ ] Reintroduce Babies or similar artifacts
