local utils  = require "lib/utils"

edgesFile = assert(io.open('data/tessertact/edges_32_2_int32.bin', 'rb'))
edges = {}
for i=1,16 do
	local i1 = edgesFile:read(4)
	local i2 = edgesFile:read(4)
	edges[i] = {utils.parseInt32(i1), utils.parseInt32(i2)}
	print(edges[i][1], edges[i][2])
end
