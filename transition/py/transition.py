import numpy as np
import matplotlib.pyplot as plt

def Transition(X,Y):
    '''
    X,Y: k subspaces of R^n represented by n by k matrices
    return: a function of time [0,1]
    '''
    M = np.dot(Y, np.linalg.inv(np.dot(X.T, Y)))
    projector = np.eye(X.shape[0]) - np.dot(X, X.T)
    U,sigma,VT = np.linalg.svd(np.dot(projector, M), False)
    theta = np.arctan(sigma)
    V = VT.T
    def f(t):
        res = np.dot(np.dot(X, V), np.diag(np.cos(theta * t)))\
            + np.dot(U, np.diag(np.sin(theta * t)))
        return res
    return f

if __name__ == '__main__':
    data = np.fromfile('softmax_pca_100_1000_10.bin', dtype='float32').reshape([100,1000,10])
    data = data[-1,:,:]
    labels = np.fromfile('labels_1000.bin', dtype='uint8')

    A,_ = np.linalg.qr(np.random.random([10,10]), 'complete')
    B,_ = np.linalg.qr(np.random.random([10,10]), 'complete')
    A = A[:,:2]
    B = B[:,:2]

    f = Transition(A,B)

    fig = plt.figure(figsize=[6,6])

    plt.subplot(131)
    p = np.dot(data, f(0))
    plt.scatter(p[:,0], p[:,1], c=labels, cmap='Set1')
    plt.axis('square')
    plt.xlim([-1,1])
    plt.ylim([-1,1])

    plt.subplot(133)
    p = np.dot(data, B)
    plt.scatter(p[:,0], p[:,1], c=labels, cmap='Set1')
    plt.axis('square')
    plt.xlim([-1,1])
    plt.ylim([-1,1])

    ax = fig.add_subplot(132)
    for i,t in enumerate(np.linspace(0,1,10)):
        m = f(t)
        p = np.dot(data, m)
        ax.clear()
        ax.scatter(p[:,0], p[:,1], c=labels, cmap='Set1')
        # plt.imshow(m, vmax=1, vmin=-1, cmap='coolwarm')
        ax.axis('square')
        ax.set_xlim([-1,1])
        ax.set_ylim([-1,1])
        plt.draw()
        plt.pause(1/60)
    plt.show()