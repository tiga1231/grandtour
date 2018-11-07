local linalg  = require "lib/linalg"
local utils  = require "lib/utils"
local GrandTour  = require "lib/GrandTour"

local dpr = 1.0
local maxRange = 0.2 / dpr
local nnodes = 16
local nedges = 32
local ndim = 4

local msg = '<debug message>'

local gt
local nodes, edges
local points

local dmax = -1
local dx,dy,dz = 0, 1.0, -0.5
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
	gt = GrandTour:new(ndim,0.4)

	edgeFile = assert(io.open('tesseract/data/edges_32_2_int32.bin', 'rb'))
	edges = {}
	for i=1,nedges do
		local i1 = edgeFile:read(4)
		local i2 = edgeFile:read(4)
		edges[i] = {utils.parseInt32(i1), utils.parseInt32(i2)}
	end

	nodeFile = assert(io.open('tesseract/data/nodes_16_4_float32.bin', 'rb'))
	nodes = {}
	for i=1,nnodes do
		nodes[i] = {}
		for j=1,4 do
			local d = nodeFile:read(4)
			local f = utils.parseFloat32(d)
			if math.abs(f) > dmax then 
				dmax = f
			end
			nodes[i][j] = f
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
	setWorldTransform({
		translate={dx,dy,dz}, 
		scale={maxRange/dmax, maxRange/dmax, maxRange/dmax}
	})
end

function lovr.update(dt)
	gt:tick(dt)
	points = gt:project(nodes)
end


function lovr.draw()
	lovr.graphics.setWireframe(false)
	local color = utils.baseColors[1]
	lovr.graphics.setColor(color[1], color[2], color[3])

	lovr.graphics.setShader(shader)

	-- for 

	for i=1,nedges do
		local pStart, pStop = points[edges[i][1]+1], points[edges[i][2]+1]
		local x1,y1,z1 = worldTransform:transformPoint(pStart[1], pStart[2], pStart[3])
		local x2,y2,z2 = worldTransform:transformPoint(pStop[1], pStop[2], pStop[3])
		lovr.graphics.cylinder(x1,y1,z1,x2,y2,z2, 0.003, 0.003, false)
	end
	lovr.graphics.setShader(nil)
	msg = tostring(edges[1][1])
	lovr.graphics.print(msg, 0, -2,-20)
end
