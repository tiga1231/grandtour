import numpy as np
from mpl_toolkits.mplot3d import Axes3D
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA

from natsort import natsorted

from glob import glob

def rot(ndim, dim1, dim2, theta):
    res = np.eye(ndim)
    res[dim1, dim1] = np.cos(theta)
    res[dim2, dim1] = -np.sin(theta)
    res[dim1, dim2] = np.sin(theta)
    res[dim2, dim2] = np.cos(theta)
    return res


def proj(matrix, ndim):
    return matrix[:,:ndim]
    

layer = 'logSoftmax'
# layer = 'fc2'

fns = natsorted(glob('data/{0}/activation_{0}_epoch*'.format(layer)))
datas = [np.loadtxt(fn, delimiter=',') for fn in fns]
datas = [np.exp(d) for d in datas]

# fn = 'out/activation_fc2_epoch300.csv'
# fn = 'out/activation_fc1_epoch300.csv'
# fn = 'out/activation_conv1_epoch300.csv'
# fn = 'out/activation_conv2_epoch300.csv'

# data = np.loadtxt(fn, delimiter=',')
# data = np.exp(data)
# pca = PCA().fit(data)
# data = pca.transform(data)

labels = np.loadtxt('data/labels.csv', delimiter=',', dtype=int)

data = datas[0]
ndim = data.shape[1]

baseColors = [[166,206,227],[31,120,180],[178,223,138],[51,160,44],[251,154,153],[227,26,28],[253,191,111],[255,127,0],[202,178,214],[106,61,154]]
baseColors = np.array(baseColors) / 255
colors = baseColors[labels]

dmax = np.abs(data).max()



N = (ndim**2-ndim)//2
# 
# lambdas = np.exp(np.arange(1, N+1))
# lambdas = lambdas - np.floor(lambdas)
# lambdas = np.random.permutation(lambdas)

np.random.seed(0)
lambdas = np.random.random(N)


fig = plt.figure()
# 2D
ax = fig.add_subplot(111)
# 3D
# ax = fig.add_subplot(111, projection='3d')

STEPSIZE = np.pi/120 #np.sqrt(23)
ts = range(61*20)
for t in ts:
    epoch_index = (t//20)%len(datas)
    data = datas[epoch_index]

    thetas_t = lambdas * t * STEPSIZE
    matrix = np.eye(ndim)

    n=0
    for i in range(ndim):
        for j in range(i+1,ndim):
            rot_ij = rot(ndim, i, j, thetas_t[n])
            matrix = matrix.dot(rot_ij)
            n+=1

    matrix = proj(matrix, 3)
    dt = data.dot(matrix)
    ax.clear()

    d0 = np.eye(ndim)
    # d0 = pca.transform(d0)
    d0 = d0.dot(matrix)
    dx = np.c_[d0[:,0], np.zeros(d0.shape[0])].flatten()
    dy = np.c_[d0[:,1], np.zeros(d0.shape[0])].flatten()
    dz = np.c_[d0[:,2], np.zeros(d0.shape[0])].flatten()

    ax.plot(dx, dy, '-', alpha=0.3)

    ax.scatter(dt[:,0], dt[:,1], 
        alpha=1, s=20,
        c=colors)

    for i in range(ndim):
        d = np.zeros(ndim)
        d[i] = 1
        d = d.dot(matrix)
        ax.text(d[0], d[1], str(i))
    
    plt.title('epoch {}/300'.format(epoch_index*5))
    plt.axis('square')

    # ax.scatter(dt[:,0], dt[:,1], dt[:,2], c=colors)
    
    # ax.set_xlim([-dmax,dmax])
    # ax.set_ylim([-dmax,dmax])
    # ax.set_zlim([-dmax,dmax])

    # plt.savefig('img/' + str(t)+'.png')
    
    plt.draw()
    plt.pause(1/60)

# plt.show()
