function lovr.load()
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

local x,y,z
local t=0
local data = {}
local color = {}
for i=1,100 do
	data[i] = {math.random()-0.5, math.random()-0.5, math.random()-0.5}
	color[i] = {math.random(), math.random(), math.random()}
end

function lovr.update(dt)
	t = t+dt
end

function lovr.draw()

	-- Point
	lovr.graphics.setPointSize(5)
	lovr.graphics.setColor(1, 1, 1)
	controllers = lovr.headset.getControllers()
	

	for i=1,100 do
		point = data[i]
		point = {
			0.4*(point[1]*math.cos(t)+point[2]*math.sin(t)), 
			0.4*(point[3]),
			0.4*(-point[1]*math.sin(t)+point[2]*math.cos(t)), 
		}
		c = color[i]
		lovr.graphics.setColor(c[1], c[2], c[3])

		for _, controller in ipairs(controllers) do
			cx, cy, cz = controller:getPosition()
			lovr.graphics.sphere(cx+point[1], cy+point[2], cz+point[3], 0.02)
			break
		end

		-- lovr.graphics.points(point[1], point[2], point[3])
	end
end