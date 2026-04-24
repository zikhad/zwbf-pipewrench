local ZLBFFertilization = require "ZLBF/AnimationEvents/Fertilization"

return function(actionInstance, eventName, parameter)
    return ZLBFFertilization.onAnimationEvent(actionInstance, eventName, parameter)
end