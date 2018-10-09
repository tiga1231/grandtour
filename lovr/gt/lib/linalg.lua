local linalg = {}

function linalg.dot(x,y)
	local ret = {}
	for i=1,#x do
		ret[i]={}
		for j=1,#y[1] do
			ret[i][j] = 0
			for k=1,#x[1] do
				ret[i][j] = ret[i][j] + x[i][k]*y[k][j]
			end
		end
	end
	return ret
end

function linalg.add(x,y)
	local ret = {}
	local mode = '1D'
	if type(x[1])=='table' then
		mode = '2D'
	end
	if mode=='1D' then
		for i=1,#x do
			ret[i]=x[i]+y[i]
		end
	else
		print('2D')
		for i=1,#x do
			ret[i] = {}
			for j=1,#x[1] do
				ret[i][j]=x[i][j]+y[i][j]
			end
		end
	end
	return ret
end


function linalg.eye(dim0, dim1)
	local ret = {}
	for i=1,dim0 do
		ret[i] = {}
		for j=1,dim1 do
			if i==j then
				ret[i][j] = 1
			else
				ret[i][j] = 0
			end
		end
	end
	return ret
end

function linalg.distance(v1, v2)
	distSqaure = 0
	for i=1,#v1 do
		distSqaure = distSqaure + (v1[i]-v2[i])^2
	end
	return math.sqrt(distSqaure)
end
return linalg