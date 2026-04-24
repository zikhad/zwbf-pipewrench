local ZLBF = require "ZLBF/ZLBF"

local function resolveUI()
	if type(ZLBF) ~= "table" then
		return nil
	end

	local ui = ZLBF.UI
	if type(ui) ~= "table" then
		return nil
	end

	return ui
end

if not ISEquippedItem or not ISButton then
	return
end

if ISEquippedItem.ZLBFSidebarHooked then
	return
end

local original_ISEquippedItem_new = ISEquippedItem.new
local original_ISEquippedItem_initialise = ISEquippedItem.initialise
local original_ISEquippedItem_onOptionMouseDown = ISEquippedItem.onOptionMouseDown
local original_ISEquippedItem_prerender = ISEquippedItem.prerender

local function getTextureWidth()
	if not getCore then
		return 48
	end

	local size = getCore():getOptionSidebarSize()
	if size == 6 then
		size = getCore():getOptionFontSizeReal() - 1
	end

	if size == 2 then
		return 64
	end

	if size == 3 then
		return 80
	end

	if size == 4 then
		return 96
	end

	if size == 5 then
		return 128
	end

	return 48
end

local function getSidebarTexture(path)
	if not getTexture then
		return nil
	end
	return getTexture(path)
end

function ISEquippedItem:new(x, y, width, height, chr)
	local object = original_ISEquippedItem_new(self, x, y, width, height, chr)
	local textureWidth = getTextureWidth()
	object.zlbfIconOn = getSidebarTexture("media/ui/Sidebar/" .. textureWidth .. "/ZLBF_On_" .. textureWidth .. ".png")
	object.zlbfIconOff = getSidebarTexture("media/ui/Sidebar/" .. textureWidth .. "/ZLBF_Off_" .. textureWidth .. ".png")
	return object
end

function ISEquippedItem:initialise()
	original_ISEquippedItem_initialise(self)

	if self.chr:getPlayerNum() ~= 0 then
		return
	end

	if self.chr:isFemale() == false then
		return
	end

	local textureWidth = getTextureWidth()
	local textureHeight = textureWidth * 0.75
	local spacing = 15
	local lastY = 0

	for _, child in pairs(self:getChildren()) do
		if child.internal then
			lastY = math.max(lastY, child:getBottom())
		end
	end

	local y = math.floor(lastY) + spacing
	self.zlbfBtn = ISButton:new(0, y, textureWidth, textureHeight, "", self, ISEquippedItem.onOptionMouseDown)
	if not self.zlbfBtn then
		return
	end

	self.zlbfBtn:setImage(self.zlbfIconOff)
	self.zlbfBtn.internal = "ZLBF"
	self.zlbfBtn:initialise()
	self.zlbfBtn:instantiate()
	self.zlbfBtn:setDisplayBackground(false)
	self.zlbfBtn:ignoreWidthChange()
	self.zlbfBtn:ignoreHeightChange()
	self:addChild(self.zlbfBtn)
	self:addMouseOverToolTipItem(self.zlbfBtn, getText("IGUI_ZLBF_UI_Sidebar_Tooltip"))
	self:shrinkWrap()
end

function ISEquippedItem:onOptionMouseDown(button, x, y)
	if button.internal == "ZLBF" then
		local ui = resolveUI()
		if ui and ui.toggle then
			ui:toggle()
		end
		return
	end

	original_ISEquippedItem_onOptionMouseDown(self, button, x, y)
end

function ISEquippedItem:prerender()
	original_ISEquippedItem_prerender(self)

	if not self.zlbfBtn then
		return
	end

	local ui = resolveUI()
	if ui and ui.isVisible and ui:isVisible() then
		self.zlbfBtn:setImage(self.zlbfIconOn)
		return
	end

	self.zlbfBtn:setImage(self.zlbfIconOff)
end

ISEquippedItem.ZLBFSidebarHooked = true
