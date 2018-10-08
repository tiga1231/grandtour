dataraw = assert(io.open('./data/softmax.bin', 'rb'))
labelraw =  assert(io.open('./data/labels.bin', 'rb'))
data = {}
for epoch=1,100 do
	data[epoch] = {}
	for i=1,1000 do
		data[epoch][i] = {}
		for j=1,10 do
			d = dataraw:read(4)
			data[epoch][i][j] = string.unpack('f', d)
		end
	end
end