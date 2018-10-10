local linalg = require('lib/linalg')

local GrandTour = {}

function GrandTour:new(ndim, stepsize)
	local ret = {}
	setmetatable(ret, self)
    self.__index = self

    ret.t = 0
	ret.ndim = ndim
	ret.stepsize = stepsize
	ret.thetas = {}
	ret.matrix = linalg.eye(ndim, ndim)
	for i=1,ndim do
		ret.thetas[i] = {}
		for j=1,ndim do
			ret.thetas[i][j] = math.random()-0.5
		end
	end
	return ret
end

function _rotate(matrix, i,j, theta)
	local tmp = {}
	tmp[1] = {}
	tmp[2] = {}
	for k=1,#matrix do
		tmp[1][k] = matrix[k][i]*math.cos(theta) + matrix[k][j]*math.sin(theta)
		tmp[2][k] = -matrix[k][i]*math.sin(theta) + matrix[k][j]*math.cos(theta)
	end

	for k=1,#matrix do
		matrix[k][i] = tmp[1][k]
		matrix[k][j] = tmp[2][k]
	end
	return matrix
end	

function GrandTour:tick(dt)
	self.t = self.t + dt
	for i=1,self.ndim do
		for j=i+1,self.ndim do
			self.matrix = _rotate(self.matrix, i,j, dt*self.thetas[i][j]*self.stepsize)
		end
	end
	return self.matrix
end

function GrandTour:project(data)
	self.points = linalg.dot(data, self.matrix)
	return self.points
end

--test
-- local m = linalg.eye(3,3)
-- for _=1,100 do
-- 	m = _rotate(m, 1,2,30)
-- 	for i=1,3 do
-- 		for j=1,3 do
-- 			io.write(tostring(m[i][j]))
-- 			io.write('\t')
-- 		end
-- 		io.write('\n')
-- 	end
-- 	print()
-- end

-- local gt = Grandtour:new(5, 0.5)
-- for i=1,100 do
-- 	gt:tick(1)
-- 	print(gt.matrix[1][1])
-- end

return GrandTour
