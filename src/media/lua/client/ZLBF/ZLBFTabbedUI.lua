---@diagnostic disable: undefined-global

require "ISUI/ISCollapsableWindow"
require "ISUI/ISTabPanel"
require "ISUI/ISPanel"
require "ZLBF/ZLBFSimpleUI"

local UI_BORDER_SPACING = 10

local function createTabContext(container, width)
	return {
		container = container,
		noNameElements = {},
		namedElements = {},
		lineAct = 1,
		lineColumnCount = { 0 },
		columnAct = 0,
		elemY = { 0 },
		elemH = {},
		elemW = {},
		elemX = {},
		yAct = 0,
		deltaY = 0,
		lineHaveImages = false,
		lineHeightForce = false,
		defaultLineHeight = getTextManager():getFontHeight(UIFont.Small) + 4,
		matriceLayout = {},
		forceColumnWidht = {},
		pxlW = width
	}
end


---
-- Tabbed UI window for ZLBF, supporting dynamic tab registration and context management.
-- @class ZLBFTabbedUI : ISCollapsableWindow
-- @field panel ISTabPanel The tab panel instance.
-- @field tabsByName table<string, ISPanel> Mapping of tab display names to panels.
-- @field tabContexts table<string, table> Mapping of tab display names to their context objects.
-- @field tabAliases table<string, string> Mapping of tab aliases to display names.
-- @field tabContentHeights table<string, number> Mapping of tab display names to their content heights.
-- @field activeTabName string The currently active tab's display name.
ZLBFTabbedUI = ISCollapsableWindow:derive("ZLBFTabbedUI")

---
-- Initializes the tabbed UI window.
-- @return void
function ZLBFTabbedUI:initialise()
	ISCollapsableWindow.initialise(self)
end

---
-- Creates child UI elements, including the tab panel and tab state tables.
-- @return void
function ZLBFTabbedUI:createChildren()
	ISCollapsableWindow.createChildren(self)

	local th = self:titleBarHeight()
	local rh = self:resizeWidgetHeight()

	self.panel = ISTabPanel:new(0, th, self.width, self.height - th - rh)
	self.panel:initialise()
	self.panel.tabPadX = UI_BORDER_SPACING
	self.panel.equalTabWidth = false
	self:addChild(self.panel)

	self.tabsByName = {}
	self.tabContexts = {}
	self.tabAliases = {}
	self.tabContentHeights = {}
	self.activeTabName = nil
end

---
-- Registers a new tab with the given alias and display name.
-- If the tab already exists, only the alias is added.
-- @param alias string An alternate name for the tab (can be nil or empty).
-- @param displayName string The display name for the tab (must be unique).
-- @return void
function ZLBFTabbedUI:registerTab(alias, displayName)
	if not self.panel or not displayName then
		return
	end

	if self.tabContexts[displayName] then
		if alias and alias ~= "" then
			self.tabAliases[alias] = displayName
		end
		self.tabAliases[displayName] = displayName
		return
	end

	local th = self:titleBarHeight()
	local rh = self:resizeWidgetHeight()
	local tab = ISPanel:new(0, 8, self.width, self.height - th - rh)
	tab:initialise()
	tab.backgroundColor = { r = 0, g = 0, b = 0, a = 0 }
	tab.borderColor = { r = 0, g = 0, b = 0, a = 0 }

	self.panel:addView(displayName, tab)
	self.tabsByName[displayName] = tab
	self.tabContexts[displayName] = createTabContext(tab, self.width)
	self.tabAliases[displayName] = displayName
	if alias and alias ~= "" then
		self.tabAliases[alias] = displayName
	end
	self.tabContentHeights[displayName] = 60

	if not self.activeTabName then
		self.activeTabName = displayName
		self.panel:activateView(displayName)
		self:applyTabHeight(displayName)
	end
end

---
-- Sets the active tab by name or alias.
-- @param name string The tab's display name or alias.
-- @return void
function ZLBFTabbedUI:setActiveTab(name)
	if not self.tabContexts then
		return
	end
	local resolvedName = (self.tabAliases and self.tabAliases[name]) or name
	if not self.tabContexts[resolvedName] then
		return
	end
	self.activeTabName = resolvedName
	if self.panel then
		self.panel:activateView(resolvedName)
	end
	self:applyTabHeight(resolvedName)
end

---
-- Returns the context object for the currently active tab.
-- @return table|nil The context object, or nil if not available.
function ZLBFTabbedUI:getActiveContext()
	if not self.tabContexts then
		return nil
	end
	return self.tabContexts[self.activeTabName]
end

function ZLBFTabbedUI:addLineToMatrices(context, isLastLine)
	local i = context.lineAct
	local nbElemWidthForce = 0
	local widthLeft = context.pxlW
	context.elemW[i] = {}
	context.elemX[i] = {}
	local nbElement = context.lineColumnCount[i]
	local w = math.floor(context.pxlW / (nbElement > 0 and nbElement or 1))

	for j = 1, context.lineColumnCount[i] do
		if context.matriceLayout[i][j].isWidthForce then
			nbElemWidthForce = nbElemWidthForce + 1
			widthLeft = widthLeft - context.matriceLayout[i][j].pxlW
		end
	end

	for j = 1, context.lineColumnCount[i] do
		if nbElemWidthForce ~= 0 or context.forceColumnWidht ~= {} then
			local nbElementLeft = nbElement - nbElemWidthForce
			local w2 = math.floor(widthLeft / (nbElementLeft > 0 and nbElementLeft or 1))
			local elem = context.matriceLayout[i][j]

			if elem.isWidthForce then
				context.elemW[i][j] = elem.pxlW
			elseif context.forceColumnWidht[j] ~= nil then
				context.elemW[i][j] = context.forceColumnWidht[j]
			else
				context.elemW[i][j] = w2
			end

			context.elemX[i][j] = (j == 1) and 0 or (context.elemX[i][j - 1] + context.elemW[i][j - 1])
		else
			context.elemW[i][j] = w
			context.elemX[i][j] = w * (j - 1)
		end
	end

	if context.lineColumnCount[i] > 0 and not context.matriceLayout[i][context.lineColumnCount[i]].isImage then
		context.elemW[i][context.lineColumnCount[i]] =
			context.pxlW - context.elemX[i][context.lineColumnCount[i]]
	elseif context.lineColumnCount[i] > 0 and context.matriceLayout[i][context.lineColumnCount[i]].isImage then
		context.elemW[i][context.lineColumnCount[i]] =
			context.pxlW - context.elemX[i][context.lineColumnCount[i]]
	elseif not isLastLine then
		print("ZLBF UI - WARNING: line " .. i .. " has no elements.")
	end
end

function ZLBFTabbedUI:nextColumn()
	local context = self:getActiveContext()
	if not context then
		return
	end
	context.lineColumnCount[context.lineAct] = context.lineColumnCount[context.lineAct] + 1
	context.columnAct = context.columnAct + 1
end

function ZLBFTabbedUI:nextLine()
	local context = self:getActiveContext()
	if not context then
		return
	end

	self:addLineToMatrices(context)
	context.columnAct = 0

	if context.lineHaveImages and not context.lineHeightForce then
		context.lineHaveImages = false
		for _, v in ipairs(context.matriceLayout[context.lineAct]) do
			if v.isImage then
				if context.deltaY < context.elemW[v.line][v.column] * v.ratio then
					context.deltaY = context.elemW[v.line][v.column] * v.ratio
				else
					context.elemW[v.line][v.column] = context.deltaY / v.ratio
				end
			end
		end
	end

	context.lineHeightForce = false
	context.lineAct = context.lineAct + 1
	context.yAct = context.yAct + context.deltaY
	table.insert(context.elemH, context.deltaY)
	context.deltaY = 0
	table.insert(context.elemY, context.yAct)
	table.insert(context.lineColumnCount, 0)
end

function ZLBFTabbedUI:initAndAddToTable(newE, name)
	local context = self:getActiveContext()
	if not context then
		return
	end

	newE:initialise()
	newE:instantiate()
	context.container:addChild(newE)

	if name == "" or not name then
		table.insert(context.noNameElements, newE)
	else
		context.namedElements[name] = newE
		self[name] = newE
	end

	if not context.matriceLayout[context.lineAct] then
		context.matriceLayout[context.lineAct] = {}
	end
	context.matriceLayout[context.lineAct][context.columnAct] = newE
end

function ZLBFTabbedUI:addText(name, txt, font, position)
	local context = self:getActiveContext()
	if not context then
		return
	end

	self:nextColumn()
	local newE = ZLBFSimpleText:new(context, txt, font, position)
	self:initAndAddToTable(newE, name)
	if context.deltaY < context.defaultLineHeight then
		context.deltaY = context.defaultLineHeight
	end
end

function ZLBFTabbedUI:addProgressBar(name, value, min, max)
	local context = self:getActiveContext()
	if not context then
		return
	end

	self:nextColumn()
	local newE = ZLBFSimpleProgressBar:new(context, value, min, max)
	self:initAndAddToTable(newE, name)
	if context.deltaY < context.defaultLineHeight then
		context.deltaY = context.defaultLineHeight
	end
end

function ZLBFTabbedUI:addButton(name, text, func)
	local context = self:getActiveContext()
	if not context then
		return
	end

	self:nextColumn()
	local newE = ZLBFSimpleButton:new(context, text, func)
	self:initAndAddToTable(newE, name)
	if context.deltaY < context.defaultLineHeight then
		context.deltaY = context.defaultLineHeight
	end
end

function ZLBFTabbedUI:addImage(name, path)
	local context = self:getActiveContext()
	if not context then
		return
	end

	self:nextColumn()
	context.lineHaveImages = true
	local newE = ZLBFSimpleImage:new(context, path)
	self:initAndAddToTable(newE, name)
	if context.deltaY < context.defaultLineHeight then
		context.deltaY = context.defaultLineHeight
	end
end

function ZLBFTabbedUI:setElementsPositionAndSize(context)
	for _, v in ipairs(context.noNameElements) do
		v:setPositionAndSize()
	end
	for _, v in pairs(context.namedElements) do
		v:setPositionAndSize()
	end
end

function ZLBFTabbedUI:setBorderToAllElements(v)
	if not self.tabContexts then
		return
	end
	for _, context in pairs(self.tabContexts) do
		for _, e in ipairs(context.noNameElements) do
			e:setBorder(v)
		end
		for _, e in pairs(context.namedElements) do
			e:setBorder(v)
		end
	end
end

function ZLBFTabbedUI:saveLayout()
	if not self.tabContexts then
		return
	end

	for tabName, context in pairs(self.tabContexts) do
		if context.lineColumnCount[context.lineAct] > 0 then
			local previous = self.activeTabName
			self.activeTabName = tabName
			self:nextLine()
			self.activeTabName = previous
		end

		self:setElementsPositionAndSize(context)
		self.tabContentHeights[tabName] = math.max(60, context.yAct)
	end

	self.collapseButton:setVisible(false)
	self.pinButton:setVisible(false)
	self:applyTabHeight(self.activeTabName)
	self:setInCenterOfScreen()
end

function ZLBFTabbedUI:applyTabHeight(tabName)
	if not self.panel or not self.tabContentHeights then
		return
	end

	local th = self:titleBarHeight()
	local rh = self:resizeWidgetHeight()
	local tabHeight = self.panel.tabHeight or 24
	local contentHeight = self.tabContentHeights[tabName] or 60
	local panelHeight = tabHeight + contentHeight + UI_BORDER_SPACING * 2

	self.panel:setHeight(panelHeight)
	for _, tab in pairs(self.tabsByName) do
		tab:setHeight(panelHeight - tabHeight)
	end
	self:setHeight(th + rh + panelHeight)
end

function ZLBFTabbedUI:getPanelActiveTabName()
	if not self.panel then
		return nil
	end

	local activeView = self.panel:getActiveView()
	for name, tab in pairs(self.tabsByName) do
		if activeView == tab then
			return name
		end
	end

	return nil
end

function ZLBFTabbedUI:syncActiveTabFromPanel()
	local panelTabName = self:getPanelActiveTabName()
	if panelTabName and panelTabName ~= self.activeTabName then
		self.activeTabName = panelTabName
		self:applyTabHeight(panelTabName)
	end
end

function ZLBFTabbedUI:prerender()
	self:syncActiveTabFromPanel()
	ISCollapsableWindow.prerender(self)
end

function ZLBFTabbedUI:setInCenterOfScreen()
	local sw = getCore():getScreenWidth()
	local sh = getCore():getScreenHeight()
	self:setX((sw - self:getWidth()) / 2)
	self:setY((sh - self:getHeight()) / 2)
end

function ZLBFTabbedUI:setWidthPixel(pxlW)
	self:setWidth(pxlW)
	if self.panel then
		self.panel:setWidth(pxlW)
	end
	if self.tabContexts then
		for _, context in pairs(self.tabContexts) do
			context.pxlW = pxlW
		end
	end
end

function ZLBFTabbedUI:open()
	if not self.isUIVisible then
		if not self:getIsVisible() then
			self:addToUIManager()
		end
		self:setVisible(true)
		self.isUIVisible = true
	end
end

function ZLBFTabbedUI:close()
	if self.isUIVisible then
		self:setVisible(false)
		self.isUIVisible = false
	end
end

function ZLBFTabbedUI:toggle()
	if self.isUIVisible then
		self:close()
	else
		self:open()
	end
end

function ZLBFTabbedUI:new(pctX, pctY, pctW, pxlH)
	local sw = getCore():getScreenWidth()
	local sh = getCore():getScreenHeight()
	local o = ISCollapsableWindow:new(sw * pctX, sh * pctY, sw * pctW, pxlH)
	setmetatable(o, self)
	self.__index = self

	o.pctX = pctX
	o.pctY = pctY
	o.pctW = pctW
	o.isUIVisible = true
	o.resizable = false
	o.drawFrame = true
	return o
end

local allZLBFTabbedUI = {}

function NewZLBFTabbedUI()
	local ui = ZLBFTabbedUI:new(0.4, 0.4, 0.2, 260)
	ui:initialise()
	ui:instantiate()
	ui:addToUIManager()
	table.insert(allZLBFTabbedUI, ui)
	return ui
end