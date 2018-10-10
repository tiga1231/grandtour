local linalg  = require "lib/linalg"
local utils  = require "lib/utils"
local GrandTour  = require "lib/GrandTour"

local dataraw, dataTensor, labelraw, labels
local epoch = 1
local msg = '<debug message>'

handlings = {left=nil, right=nil, unknown=nil}
local cx0, cy0, cz0 = 0,0,0
local dx, dy, dz = 0, 1.0,-0.2
local dmax = -1
local maxRange = 0.5

local axisData = linalg.mul(linalg.eye(10,10), maxRange)
local axis

function lovr.load()
	dataRaw = assert(io.open('gt/data/fashion-mnist/softmax.bin', 'rb'))
	labelRaw = assert(io.open('gt/data/fashion-mnist/labels.bin', 'rb'))
	dataTensor = {}
	for epoch=1,100 do
		dataTensor[epoch] = {}
		for i=1,1000 do
			dataTensor[epoch][i] = {}
			for j=1,10 do
				local d = dataRaw:read(4)
				local f = utils.toFloat(d)
				if math.abs(f) > dmax then 
					dmax = f
				end
				dataTensor[epoch][i][j] = f
			end
		end
	end
	labels = {}
	for i=1,1000 do
		local l = labelRaw:read(1)
		labels[i] = utils.toInt(l)
	end
	-- shader = lovr.graphics.newShader([[
	-- out vec3 vNormal; // This gets passed to the fragment shader
	-- vec4 position(mat4 projection, mat4 transform, vec4 vertex) {
	-- 	vNormal = lovrNormal;
	-- 	return projection * transform * vertex;
	-- }

	-- ]], [[
	-- in vec3 vNormal; // This gets passed from the vertex shader
	-- vec4 color(vec4 graphicsColor, sampler2D image, vec2 uv) {
	-- 	return vec4(vNormal * .5 + .5, 1.0);
	-- }
	-- ]])
	-- lovr.graphics.setShader(shader)
end

local gt = GrandTour:new(10,0.3)
function lovr.update(dt)
	gt:tick(dt)
	local controllers = lovr.headset.getControllers()
	if controllers ~=nil then
		for i,controller in ipairs(controllers) do
			if handlings[controller:getHand()] ~= nil then
				local cx, cy, cz = controller:getPosition()
				gt.matrix[handlings[controller:getHand()]][1] = (cx-dx)/maxRange
				gt.matrix[handlings[controller:getHand()]][2] = (cy-dy)/maxRange
				gt.matrix[handlings[controller:getHand()]][3] = (cz-dz)/maxRange
				gt.matrix = linalg.orthogonalize(gt.matrix, handlings[controller:getHand()])
			end
		end
	end
end

function lovr.draw()
	lovr.graphics.setPointSize(50)

	controllers = lovr.headset.getControllers()
	for _, controller in ipairs(controllers) do
		cx, cy, cz = controller:getPosition()
		lovr.graphics.setColor(0.5,0.5,0.5)
		lovr.graphics.sphere(cx,cy,cz, 0.01)
	end
	-- Point
	axis = gt:project(axisData)
	-- lovr.graphics.setColor(1,1,1)
	-- for i=1,10 do
	-- 	q = gt.matrix[i]
	-- end
	-- msg = tostring(dx+axis[1][1]).. ', \n'..tostring(dx+axis[1][2])..', \n'..tostring(dz+axis[1][3])..'\n\n'..tostring(dx+axis[2][1]).. ', \n'..tostring(dx+axis[2][2])..', \n'..tostring(dz+axis[2][3])


	for i=1,10 do
		local q = axis[i]
		local c = utils.baseColors[i]
		lovr.graphics.setColor(c[1], c[2], c[3], 1.0)
		lovr.graphics.sphere(q[1]+dx, q[2]+dy, q[3]+dz, 0.02)
		lovr.graphics.setColor(c[1], c[2], c[3], 1.01)
		lovr.graphics.cylinder(dx, dy, dz, q[1]+dx, q[2]+dy, q[3]+dz, 0.002,0.002, false, 6)

	end


	local points = gt:project(dataTensor[epoch])
	for i=1,1000 do
		local point = points[i]
		local c = utils.baseColors[labels[i]+1]
		lovr.graphics.setColor(c[1], c[2], c[3])
		lovr.graphics.sphere(point[1]/dmax*maxRange+dx, point[2]/dmax*maxRange+dy, point[3]/dmax*maxRange+dz, 0.003)
	end
	lovr.graphics.print(msg, 0, 1,-5)
end

function lovr.controllerpressed(controller0, button)
	if button == 'touchpad' then
		local x = controller0:getAxis('touchx')
		local y = controller0:getAxis('touchy')
		if x>0 then
			epoch = epoch + 1
			if epoch > 100 then
				epoch = 1
			end
		else
			epoch = epoch - 1
			if epoch < 1 then
				epoch = 100
			end
		end
	elseif button == 'trigger' then
		local cx,cy,cz = controller0:getPosition()
		local hand = controller0:getHand()
		handlings[hand] = nil
		for i=1,10 do
			if linalg.distance({cx-dx,cy-dy,cz-dz}, axis[i]) < 0.1 then
				handlings[hand] = i
				break
			end
		end
		msg = tostring(handlings.left) .. ', ' .. tostring(handlings.right)
		-- msg = tostring(hand)
	end
end

function lovr.controllerreleased(controller, button)
  if button == 'trigger' then
		handlings[controller:getHand()] = nil
	end
end
