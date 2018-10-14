local linalg  = require "lib/linalg"
local utils  = require "lib/utils"
local GrandTour  = require "lib/GrandTour"

local dpr = 1.0
local maxRange = 0.5

local dataraw, dataTensor, labelraw, labels
local epoch = 1
local msg = ''

local handlings = {left=nil, right=nil, unknown=nil}
local dx, dy, dz = 0, 1.0,-0.2


local dmax = -1

local nepoch = 100
local npoint = 1000
local ndim = 10

local axisHandleRadius = 0.02
local axisData = linalg.mul(linalg.eye(ndim,ndim), 1)
local axis

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
local controllerGrip = {
	prev=nil, 
	now={
		left={0,0,0},
		right={0,0,0}
	}
}

local gt = GrandTour:new(ndim,0.4)

local worldTransform, worldTransformOrigin --transform from data coordinate to world coordinate

function setWorldTransform(kwargs)
	local res
	if kwargs.transform then
		res = kwargs.transform
	else
		res = lovr.math.newTransform()
	end
	if kwargs.translate then
		res:translate(table.unpack(kwargs.translate))
	end
	if kwargs.rotate then
		res:rotate(table.unpack(kwargs.rotate))
	end
	if kwargs.scale then
		res:scale(table.unpack(kwargs.scale))
	end

	worldTransform = res
end


function lovr.load()
	labelRaw = assert(io.open('gt/data/fashion-mnist/labels.bin', 'rb'))
	utils.log('load')

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
	-- order data by label number
	dataTensor = {}
	for epoch=1,nepoch do
		dataTensor[epoch] = {}
		for i=1,npoint do
			dataTensor[epoch][i] = {}
				dataTensor[epoch][i] = dataTensor0[epoch][labelPairs[i][1]]
		end
	end

	setWorldTransform({
		translate={dx,dy,dz}, 
		scale={maxRange/dmax, maxRange/dmax, maxRange/dmax}
	})

	
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

	if isGripping then
		if controllerGrip.origin then
			local controllerCount = lovr.headset.getControllerCount()
			local origin = {}
			local now = {}
			local diff = {}
			for i,controller in ipairs(lovr.headset.getControllers()) do
				local hand = controller:getHand()
				origin[hand] = controllerGrip.origin[hand]
				now[hand] = {controller:getPosition()}
				for j=1,3 do
					if diff[j] then
						diff[j] = diff[j] + (now[hand][j] - origin[hand][j])
					else
						diff[j] = (now[hand][j] - origin[hand][j])
					end
				end
			end

			local scale = 1
			if controllerCount == 2 then
				local dist0 = linalg.distance(origin.left, origin.right)
				local dist1 =  linalg.distance(now.left, now.right)
				scale = dist1 / dist0
			end
			setWorldTransform({
				transform = worldTransformOrigin:clone(),
				translate = diff,
				scale = {scale, scale, scale}
			})

		end
	end


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
		if epochFastForwardTimer < 0 then
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
		

	-- msg = string.format('epoch: %.0f, left: %s, right: %s', epoch, handlings.left, handlings.right)


	for i,controller in ipairs(controllers) do
		local hand = controller:getHand()
		if handlings[hand] ~= nil then
			local A = getControllerTransform(controller)
			-- local x, y, z = controller:getPosition()
			local x,y,z = A:transformPoint(table.unpack(controllerTip))
			-- msg = string.format('%.2f, %.2f, %.2f\n', x, y, z)
			x,y,z = worldTransform:inverseTransformPoint(x,y,z)
			-- msg = msg .. string.format('%.2f, %.2f, %.2f\n', x, y, z)

			gt.matrix[handlings[hand]][1] = x
			gt.matrix[handlings[hand]][2] = y
			gt.matrix[handlings[hand]][3] = z
			gt.matrix = linalg.orthogonalize(gt.matrix, handlings[hand])
		end
	end
end


function lovr.draw()

	-- controllers
	lovr.graphics.setShader(nil)
	controllers = lovr.headset.getControllers()
	lovr.graphics.setPointSize(10)
	lovr.graphics.setWireframe(true)
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

	    px,py,pz = A:transformPoint(0.1,0,0)
	    lovr.graphics.setColor(1.0, 0, 0)
	    lovr.graphics.points(px,py,pz)
	    px,py,pz = A:transformPoint(0,0.1,0)
	    lovr.graphics.setColor(0,1,0)
	    lovr.graphics.points(px,py,pz)
	    px,py,pz = A:transformPoint(0,0,0.1)
	    lovr.graphics.setColor(0,0,1)
	    lovr.graphics.points(px,py,pz)

	    px,py,pz = A:transformPoint(table.unpack(controllerTip))
	    lovr.graphics.setColor(1,1,1)
	    lovr.graphics.points(px,py,pz)
	end


	-- handles, axes
	lovr.graphics.setWireframe(false)
	lovr.graphics.setShader(shader)
	axis = gt:project(axisData)
	for i=1,ndim do
		local q = axis[i]
		local c = utils.baseColors[i]
		lovr.graphics.setColor(c[1], c[2], c[3], 1.0)
		local x,y,z = worldTransform:transformPoint(q[1], q[2], q[3])
		lovr.graphics.sphere(x,y,z, axisHandleRadius)
	end
	lovr.graphics.setWireframe(false)
	for i=1,ndim do
		local q = axis[i]
		local c = utils.baseColors[i]
		lovr.graphics.setColor(c[1], c[2], c[3], 1.0)
		local x0,y0,z0 = worldTransform:transformPoint(0,0,0)
		local x,y,z = worldTransform:transformPoint(q[1], q[2], q[3])
		lovr.graphics.cylinder(x0, y0, z0, x, y, z, 0.002,0.002, false, 6)
	end

	-- points
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
		-- lovr.graphics.sphere(point[1]/dmax*maxRange+dx, point[2]/dmax*maxRange+dy, point[3]/dmax*maxRange+dz, 0.003)
		local x,y,z = worldTransform:transformPoint(point[1],point[2],point[3])
		lovr.graphics.sphere(x,y,z, 0.003)
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
		distMin = 1e9
		for i=1,ndim do
			local dist = linalg.distance({x,y,z}, {worldTransform:transformPoint(table.unpack(axis[i]))})
			if dist < axisHandleRadius*20 then
				if dist < distMin then
					handlings[hand] = i
					distMin = dist
				end
			end
		end
	elseif button == 'grip' then
		-- msg = tostring(os.time())
		isGripping = true
		controllerGrip.origin = {}
		worldTransformOrigin = worldTransform
		for i,controller in ipairs(lovr.headset.getControllers()) do
			local hand = controller:getHand()
			controllerGrip.origin[hand] = {controller:getPosition()}
		end
	end
end


function lovr.controllerreleased(controller, button)
  	if button == 'trigger' then
		handlings[controller:getHand()] = nil
	elseif button == 'touchpad' then
		epochFastForwardTimer = epochFastForwardTime
	elseif button == 'grip' then
		isGripping = false
		controllerGrip.origin = nil
	end
end
