--- Localized global functions from PZ
local getText = getText

--- @class ISCharacterInfoWindow
--- @field panel table 
--- @field playerNum number 
--- @field setWidth function
--- @field setHeight function
local ISCharacterInfoWindow = ISCharacterInfoWindow

--- @class ISWindow
--- @field TitleBarHeight number
local ISWindow = ISWindow

--- @class ISLayoutManager
--- @field RegisterWindow function
local ISLayoutManager = ISLayoutManager


--- ZLBF Character Info Tab Manager Class
--- This class manages the tabs in the character info window.
--- It allows adding new tabs and handles their display.
--- @class ZLBFTabManager
--- @field tabs table A table to store the tabs
local ZLBFTabManager = {}
ZLBFTabManager.__index = ZLBFTabManager

--- Static table to store tabs
ZLBFTabManager.tabs = {}

--- Constructor
function ZLBFTabManager:new()
    local instance = setmetatable({}, self)
    return instance
end

--- Adds a new tab
--- @param tabName string The name for the tab
--- @param ui any UI component to show
function ZLBFTabManager:addTab(tabName, ui)
    local viewName = tabName .. "View"

    -- Store tab information
    ZLBFTabManager.tabs[tabName] = {
        viewName = viewName,
        ui = ui,
    }

    -- Override methods only once
    if not ZLBFTabManager.methodsOverridden then
        self:overrideISCharacterInfoWindowMethods()
        ZLBFTabManager.methodsOverridden = true
    end
end

--- Overrides necessary methods in ISCharacterInfoWindow
function ZLBFTabManager:overrideISCharacterInfoWindowMethods()
    local originalCreateChildren = ISCharacterInfoWindow.createChildren
    local originalOnTabTornOff = ISCharacterInfoWindow.onTabTornOff
    local originalPrerender = ISCharacterInfoWindow.prerender
    local originalSaveLayout = ISCharacterInfoWindow.SaveLayout

    -- Extend createChildren
    function ISCharacterInfoWindow:createChildren()
        originalCreateChildren(self)

        for tabName, tabInfo in pairs(ZLBFTabManager.tabs) do
            local viewName = tabInfo.viewName
            local ui = tabInfo.ui

            self[viewName] = ui
            self[viewName]:setPositionPixel(0, 0)
            self[viewName].infoText = getText("UI_" .. tabName .. "_Info")
            self[viewName].closeButton:setVisible(false)

            -- Prevent the tab content from being dragged
            self[viewName].onMouseDown = function()
                self[viewName]:setX(0)
                self[viewName]:setY(ISWindow.TitleBarHeight)
            end

            self.panel:addView(getText("UI_" .. tabName), self[viewName])
        end
    end

    -- Extend onTabTornOff
    function ISCharacterInfoWindow:onTabTornOff(view, window)
        for tabName, tabInfo in pairs(ZLBFTabManager.tabs) do
            if self.playerNum == 0 and view == self[tabInfo.viewName] then
                ISLayoutManager.RegisterWindow('charinfowindow.' .. tabName, ISCharacterInfoWindow, window)
            end
        end
        originalOnTabTornOff(self, view, window)
    end

    -- Extend prerender
    function ISCharacterInfoWindow:prerender()
        originalPrerender(self)
        for _, tabInfo in pairs(ZLBFTabManager.tabs) do
            local viewName = tabInfo.viewName
            if self[viewName] == self.panel:getActiveView() then
                self:setWidth(self[viewName]:getWidth())
                self:setHeight((ISWindow.TitleBarHeight * 2) + self[viewName]:getHeight())
            end
        end
    end

    -- Extend SaveLayout
    function ISCharacterInfoWindow:SaveLayout(name, layout)
        originalSaveLayout(self, name, layout)

        for tabName, tabInfo in pairs(ZLBFTabManager.tabs) do
            local subSelf = self[tabInfo.viewName]
            if subSelf and subSelf.parent == self.panel then
                if not layout.tabs then
                    layout.tabs = tabName
                else
                    layout.tabs = layout.tabs .. ',' .. tabName
                end
                if subSelf == self.panel:getActiveView() then
                    layout.current = tabName
                end
            end
        end
    end
end

local module = { ZLBFTabManager = ZLBFTabManager }
return module;
