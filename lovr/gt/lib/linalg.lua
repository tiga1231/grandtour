local linalg = {}

function linalg.dot(x,y)
	if type(x[1]) == 'number' and type(y[1]) == 'number' then
		local ret = 0
		for i=1,#x do
			ret = ret + x[i]*y[i]
		end
		return ret
	end

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
		for i=1,#x do
			ret[i] = {}
			for j=1,#x[1] do
				ret[i][j]=x[i][j]+y[i][j]
			end
		end
	end
	return ret
end

function linalg.sub(x, y)
	local ret = {}
	if type(x[1])=='number' and type(y[1])=='number' then
		for i=1,#x do
			ret[i] = x[i]-y[i]
		end
		return ret
	else
		print('linalg.sub not implemented')
	end
end


function linalg.mul(x, y)
	local ret = {}
	if type(x)=='number' then
		if type(y[1])=='table' then
			for i=1,#y do
				ret[i] = {}
				for j=1,#y[1] do
					ret[i][j]=x*y[i][j]
				end
			end
			return ret
		else
			for i=1,#y do
				ret[i]=x*y[i]
			end
			return ret
		end
	end

	if type(y)=='number' then
		if type(x[1])=='table' then
			for i=1,#x do
				ret[i] = {}
				for j=1,#x[1] do
					ret[i][j]=x[i][j]*y
				end
			end
			return ret
		else
			for i=1,#x do
				ret[i]=x[i]*y
			end
			return ret
		end
	end

	if type(x[1])=='table' then
		for i=1,#x do
			ret[i] = {}
			for j=1,#x[1] do
				ret[i][j]=x[i][j]*y[i][j]
			end
		end
		return ret
	else
		for i=1,#x do
			ret[i]=x[i]*y[i]
		end
		return ret
	end
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


function linalg.norm(v1)
	normSqaure = 0
	for i=1,#v1 do
		normSqaure = normSqaure + v1[i]^2
	end
	return math.sqrt(normSqaure)
end


function linalg.proj(u, v)
	return linalg.mul(linalg.dot(u, v)/linalg.dot(v, v), u);
end


function linalg.normalize(v, unitLength)
	if unitLength == nil then
		unitLength = 1
	end

	if linalg.norm(v) <= 0 then
		return v;
	else
		return linalg.mul(v, unitLength/linalg.norm(v));
	end
end


function linalg.orthogonalize(matrix, priorityRow)
	-- make row vectors in matrix pairwise orthogonal
	if priorityRow==nil then
		priorityRow = 1;
	end
    -- Gram–Schmidt orthogonalization
    matrix[priorityRow] = linalg.normalize(matrix[priorityRow]);
    for i=1,#matrix do
    	print('i', matrix[i])
		if i~=priorityRow then
			matrix[i] = linalg.sub(matrix[i], linalg.proj(matrix[priorityRow], matrix[i]))
			print(matrix[i])
			for j=1,i-1 do
				matrix[i] = linalg.sub(matrix[i], linalg.proj(matrix[j], matrix[i]));
			end
		end
		matrix[i] = linalg.normalize(matrix[i])
    end
    return matrix;
end


-- test
matrix = {{1,2},{3,4}}
res = linalg.orthogonalize(matrix)
for i=1,2 do
	print(matrix[i][1], matrix[i][2])
end


return linalg