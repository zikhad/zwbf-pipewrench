local ZWBFFertilization = require("ZWBF/AnimationEvents/Fertilization")

return function(actionInstance, eventName, parameter)
    return ZWBFFertilization.onAnimationEvent(actionInstance, eventName, parameter)
end