local linalg  = require "lib/linalg"
local utils  = require "lib/utils"
local Grandtour  = require "lib/gt"

local dataraw, dataTensor, labelraw, labels
local baseColors = {
	{166/255.0,206/255.0,227/255.0},
	{31/255.0,120/255.0,180/255.0},
	{178/255.0,223/255.0,138/255.0},
	{51/255.0,160/255.0,44/255.0},
	{251/255.0,154/255.0,153/255.0},
	{227/255.0,26/255.0,28/255.0},
	{253/255.0,191/255.0,111/255.0},
	{255/255.0,127/255.0,0/255.0},
	{202/255.0,178/255.0,214/255.0},
	{106/255.0,61/255.0,154/255.0}
};

function lovr.load()
	print('hello')
	dataRaw = assert(io.open('gt/data/softmax.bin', 'rb'))
	labelRaw = assert(io.open('gt/data/labels.bin', 'rb'))
	dataTensor = {}
	for epoch=1,100 do
		dataTensor[epoch] = {}
		for i=1,1000 do
			dataTensor[epoch][i] = {}
			for j=1,10 do
				local d = dataRaw:read(4)
				print(d)
				dataTensor[epoch][i][j] = utils.toFloat(d)
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

local gt = Grandtour:new(10,0.5)
function lovr.update(dt)
	gt:tick(dt)
end

function lovr.draw()

	-- Point
	lovr.graphics.setPointSize(50)
	lovr.graphics.setColor(1, 1, 1)
	controllers = lovr.headset.getControllers()
	
	local points = gt:project(dataTensor[100])

	for i=1,1000 do
		local point = points[i]
		local c = baseColors[labels[i]+1]
		lovr.graphics.setColor(c[1], c[2], c[3])

		for _, controller in ipairs(controllers) do
			cx, cy, cz = controller:getPosition()
			lovr.graphics.sphere(cx+point[1], cy+point[2], cz+point[3], 0.01)
			break
		end

	end

	-- lovr.graphics.print(points[1][1], 0, 1,-1)

end