local ZWBFFertilization = require "ZLBF/AnimationEvents/Fertilization")

return function(actionInstance, eventName, parameter)
    return ZWBFFertilization.onAnimationEvent(actionInstance, eventName, parameter)
end