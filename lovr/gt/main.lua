local linalg  = require "lib/linalg"
local utils  = require "lib/utils"
local Grandtour  = require "lib/gt"

local dataraw, dataTensor, labelraw, labels
local epoch = 1
local msg = '<debug message>'
local axisData = linalg.eye(10,10)
local axis, handling

local cx0, cy0, cz0 = 0,0,0
local dx, dy, dz = 0, 1.5,-0.1
local dmax = -1;

function lovr.load()
	dataRaw = assert(io.open('gt/data/softmax.bin', 'rb'))
	labelRaw = assert(io.open('gt/data/labels.bin', 'rb'))
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

local gt = Grandtour:new(10,0.3)
function lovr.update(dt)
	gt:tick(dt)
	if handling~= nil then
		local controllers = lovr.headset.getControllers()
		if controllers ~=nil then
			local controller = controllers[1]
			local cx, cy, cz = controller:getPosition()
			gt.matrix[handling][1] = cx-dx
			gt.matrix[handling][2] = cy-dy
			gt.matrix[handling][3] = cz-dz
		end

	end
end

function lovr.draw()

	controllers = lovr.headset.getControllers()
	for _, controller in ipairs(controllers) do
		cx, cy, cz = controller:getPosition()
		lovr.graphics.setColor(0.5,0.5,0.5)
		lovr.graphics.sphere(cx,cy,cz, 0.01)
	end
	-- Point
	axis = gt:project(axisData)
	for i=1,10 do
		local q = axis[i]
		local c = utils.baseColors[i]
		lovr.graphics.setColor(.2, .2, .2, 1.0)
		lovr.graphics.line(
			dx, dy, dz, 
			q[1]+dx, q[2]+dy, q[3]+dz
		)
	end
	for i=1,10 do
		local q = axis[i]
		local c = utils.baseColors[i]
		lovr.graphics.setColor(c[1], c[2], c[3], 1.0)
		lovr.graphics.sphere(q[1]+dx, q[2]+dy, q[3]+dz, 0.02)
	end


	lovr.graphics.setPointSize(50)
	local points = gt:project(dataTensor[epoch])
	for i=1,1000 do
		local point = points[i]
		local c = utils.baseColors[labels[i]+1]
		lovr.graphics.setColor(c[1], c[2], c[3])
		lovr.graphics.sphere(point[1]/dmax+dx, point[2]/dmax+dy, point[3]/dmax+dz, 0.003)
	end

	
	lovr.graphics.print(msg, 0, 1,-5)
end

function lovr.controllerpressed(controller, button)
	if button == 'touchpad' then
		local x = controller:getAxis('touchx')
		local y = controller:getAxis('touchy')
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
		local cx,cy,cz = controller:getPosition()
		for i=1,10 do
			if linalg.distance({cx-dx,cy-dy,cz-dz}, axis[i]) < 0.1 then
				handling = i
				break
			end
		end
		msg = tostring(handling)
	end
end

function lovr.controllerreleased(controller, button)
  if button == 'trigger' then
		handling = nil
	end
end
