local linalg  = require "lib/linalg"
local utils  = require "lib/utils"
local GrandTour  = require "lib/GrandTour"

local dpr = 1.0
local maxRange = 0.5 / dpr

local dataraw, dataTensor, labelraw, labels
local epoch = 1
local msg = '<debug message>'

local handlings = {left=nil, right=nil, unknown=nil}
local dx, dy, dz = 0, 1.0,-0.2
local dmax = -1

local axisHandleRadius = 0.02
local axisData = linalg.mul(linalg.eye(10,10), maxRange)
local axis

local nepoch = 100
local npoint = 1000
local ndim = 10

local isGrandTourPlaying = true
local isAutoNextEpoch = true
local pauseInterval = 1.0
local timer = pauseInterval
local isInTransition = false
local epochFastForwardTime = 1.0
local epochFastForwardTimer = epochFastForwardTime

local controllerTip = {0,-1/12,-1/24}
local controllerTrap = {0,-1/28,-1/56}
local controllerModels = {}

local gt = GrandTour:new(ndim,0.4)

function lovr.load()
	labelRaw = assert(io.open('gt/data/fashion-mnist/labels.bin', 'rb'))
	labelPairs = {}
	for i=1,npoint do
		local l = labelRaw:read(1)
		labelPairs[i] = {i, utils.toInt(l)}
	end
	table.sort(labelPairs, function(a,b) return a[2] < b[2] end)
	labels = {}
	for i=1,npoint do
		labels[i] = labelPairs[i][2]
	end

	dataRaw = assert(io.open('gt/data/fashion-mnist/softmax.bin', 'rb'))
	local dataTensor0 = {}
	for epoch=1,nepoch do
		dataTensor0[epoch] = {}
		for i=1,npoint do
			dataTensor0[epoch][i] = {}
			for j=1,ndim do
				local d = dataRaw:read(4)
				local f = utils.toFloat(d)
				if math.abs(f) > dmax then 
					dmax = f
				end
				dataTensor0[epoch][i][j] = f
			end
		end
	end

	dataTensor = {}
	for epoch=1,nepoch do
		dataTensor[epoch] = {}
		for i=1,npoint do
			dataTensor[epoch][i] = {}
				dataTensor[epoch][i] = dataTensor0[epoch][labelPairs[i][1]]
		end
	end
	
	shader = lovr.graphics.newShader([[
	out vec3 vNormal; // This gets passed to the fragment shader
	out vec3 vVertex;
	vec4 position(mat4 projection, mat4 transform, vec4 vertex) {
		vNormal = lovrNormal;
		vVertex = vertex.xyz;
		return projection * transform * vertex;
	}

	]], [[
	in vec3 vVertex;
	in vec3 vNormal; // This gets passed from the vertex shader
	uniform vec3 lightPosition;
	uniform vec3 headsetPosition;
	vec4 color(vec4 graphicsColor, sampler2D image, vec2 uv) {
		vec3 lightDirection = normalize(lightPosition-vVertex);
		vec3 headsetDirection = normalize(headsetPosition-vVertex);
		vec3 halfway = normalize(lightDirection+headsetDirection);
		vec3 lambertian = 0.5*graphicsColor.xyz * max(0, dot(lightDirection, vNormal));
		vec3 blinn_phong = lambertian + 0.5*vec3(1.0,1.0,1.0)*pow(max(0,dot(vNormal, halfway)),4);
		return vec4(graphicsColor.xyz*0.8+lambertian, 1.0);
	}
	]])
	
	shader:send('lightPosition', {10,10,10})

	-- lovr.graphics.setBlendMode('alpha', 'premultiplied')

end


function getControllerTransform(controller)
	local x, y, z = controller:getPosition()
    local angle, ax, ay, az = controller:getOrientation() 
    local A = lovr.math.newTransform(x, y, z, 1, 1, 1, angle, ax, ay, az)
    return A
end


function lovr.update(dt)
	-- shader:send('headsetPosition', {lovr.headset.getPosition()})
	local controllers = lovr.headset.getControllers()

	if isGrandTourPlaying then
		gt:tick(dt)
	end

	if isAutoNextEpoch then
		if isInTransition then
			local epoch0 = epoch
			nextEpoch(dt*2)
			if math.floor(epoch) > math.floor(epoch0) then
				isInTransition = false
				timer = pauseInterval
			end
		else
			timer = timer - dt
			if timer < 0 then
				isInTransition = true
			end
		end
	else
		epochFastForwardTimer = epochFastForwardTimer - dt
		if epochFastForwardTimer < 0 and controllers ~=nil then
			for i,controller in ipairs(controllers) do
				if controller:isDown('touchpad') then
					local x = controller:getAxis('touchx')
					local y = controller:getAxis('touchy')
					if math.sqrt(x^2+y^2)>=0.7 then
						if x>0 then
							nextEpoch()
						else
							prevEpoch()
						end
					end
				end
			end
		end
	end
		

	msg = string.format('epoch: %.0f, left: %s, right: %s', epoch, handlings.left, handlings.right)


	for i,controller in ipairs(controllers) do
		local hand = controller:getHand()
		if handlings[hand] ~= nil then
			local A = getControllerTransform(controller)
			-- local x, y, z = controller:getPosition()
			local x,y,z = A:transformPoint(table.unpack(controllerTip))
			gt.matrix[handlings[controller:getHand()]][1] = (x-dx)/maxRange
			gt.matrix[handlings[controller:getHand()]][2] = (y-dy)/maxRange
			gt.matrix[handlings[controller:getHand()]][3] = (z-dz)/maxRange
			gt.matrix = linalg.orthogonalize(gt.matrix, handlings[controller:getHand()])
		end
	end
end


function lovr.draw()

	lovr.graphics.setShader(nil)
	controllers = lovr.headset.getControllers()
	lovr.graphics.setPointSize(10)
	lovr.graphics.setWireframe(false)
	for _, controller in ipairs(controllers) do
		local x, y, z = controller:getPosition()
	    local angle, ax, ay, az = controller:getOrientation()
	    controllerModels[controller] = controllerModels[controller] or controller:newModel()
	    controllerModels[controller]:draw(x, y, z, 1, angle, ax, ay, az)
	    
	    local A = getControllerTransform(controller)
	    local px,py,pz
	    px,py,pz = A:transformPoint(0,0,0)
	    lovr.graphics.setColor(1.0, 1.0, 1.0)
	    lovr.graphics.points(px,py,pz)
	    -- px,py,pz = A:transformPoint(1,0,0)
	    -- lovr.graphics.setColor(1.0, 0, 0)
	    -- lovr.graphics.points(px,py,pz)
	    -- px,py,pz = A:transformPoint(0,1,0)
	    -- lovr.graphics.setColor(0,1,0)
	    -- lovr.graphics.points(px,py,pz)
	    -- px,py,pz = A:transformPoint(0,0,1)
	    -- lovr.graphics.setColor(0,0,1)
	    -- lovr.graphics.points(px,py,pz)

	    px,py,pz = A:transformPoint(table.unpack(controllerTip))
	    lovr.graphics.setColor(1,1,1)
	    lovr.graphics.points(px,py,pz)


	end





	-- handles, axes
	lovr.graphics.setWireframe(true)
	lovr.graphics.setShader(shader)
	axis = gt:project(axisData)
	for i=1,ndim do
		local q = axis[i]
		local c = utils.baseColors[i]
		lovr.graphics.setColor(c[1], c[2], c[3], 1.0)
		lovr.graphics.sphere(q[1]+dx, q[2]+dy, q[3]+dz, axisHandleRadius)
	end
	lovr.graphics.setWireframe(false)
	for i=1,ndim do
		local q = axis[i]
		local c = utils.baseColors[i]
		lovr.graphics.setColor(c[1], c[2], c[3], 1.0)
		lovr.graphics.cylinder(dx, dy, dz, q[1]+dx, q[2]+dy, q[3]+dz, 0.002,0.002, false, 6)
	end


	lovr.graphics.setWireframe(false)
	local points = gt:project(interpolate(dataTensor,epoch))
	local c0 = nil
	for i=1,npoint do
		local point = points[i]
		local c = utils.baseColors[labels[i]+1]
		if c~=c0 then
			lovr.graphics.setColor(c[1], c[2], c[3])
			c0 = c
		end
		lovr.graphics.sphere(point[1]/dmax*maxRange+dx, point[2]/dmax*maxRange+dy, point[3]/dmax*maxRange+dz, 0.003)
	end
	lovr.graphics.setShader(nil)
	lovr.graphics.print(msg, 0, 1,-5)
end


function interpolate(dataTensor, epoch)
	if math.floor(epoch) == epoch then
		return dataTensor[epoch]
	else
		return linalg.mix(
			dataTensor[math.floor(epoch)], 
			dataTensor[math.ceil(epoch)], 
			1-(epoch-math.floor(epoch)))
	end
end


function nextEpoch(dt)
	if dt == nil then
		epoch = math.floor(epoch+1)
	else
		epoch = epoch + dt
	end

	if epoch > nepoch then
		epoch = 1
	end
end


function prevEpoch(dt)
	if dt == nil then
		epoch = math.floor(epoch-1)
	else
		epoch = epoch - dt
	end

	if epoch < 1 then
		epoch = nepoch
	end
end


function lovr.controllerpressed(controller0, button)
	if button == 'menu' then
		isAutoNextEpoch = not isAutoNextEpoch
	elseif button == 'touchpad' then
		local x = controller0:getAxis('touchx')
		local y = controller0:getAxis('touchy')
		if math.sqrt(x^2+y^2)<0.7 then
			isGrandTourPlaying = not isGrandTourPlaying
		else
			epochFastForwardTimer = epochFastForwardTime
			if x>0 then
				isAutoNextEpoch = false
				nextEpoch()
			else
				isAutoNextEpoch = false
				prevEpoch()
			end
		end
	elseif button == 'trigger' then
		local A = getControllerTransform(controller0)
		local x,y,z = A:transformPoint(table.unpack(controllerTip))
		local hand = controller0:getHand()
		handlings[hand] = nil
		for i=1,10 do
			if linalg.distance({x-dx, y-dy,z-dz}, axis[i]) < axisHandleRadius*1.5 then
				handlings[hand] = i
				break
			end
		end
		-- msg = tostring(hand)
	end
end


function lovr.controllerreleased(controller, button)
  	if button == 'trigger' then
		handlings[controller:getHand()] = nil
	elseif button == 'touchpad' then
		epochFastForwardTimer = epochFastForwardTime
	end
end
