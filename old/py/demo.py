from grandtour import take_grand_tour, make_gif

import numpy as np
import matplotlib.pyplot as plt
from natsort import natsorted
from sklearn.decomposition import PCA

import unittest
from glob import glob

def realData_show():
    layer = 'fc2'
    fn = '../data/{0}/activation_{0}_epoch300.csv'.format(layer)

    data = np.loadtxt(fn, delimiter=',')
    # data = np.exp(data)
    
    labels = np.loadtxt('../data/labels.csv', delimiter=',', dtype=int)

    baseColors = [[166,206,227],[31,120,180],[178,223,138],[51,160,44],[251,154,153],[227,26,28],[253,191,111],[255,127,0],[202,178,214],[106,61,154]]
    baseColors = np.array(baseColors) / 255
    colors = baseColors[labels]
    
    take_grand_tour(data, colors, mode='show', T=200, stepsize=np.pi/1000, seed=0)


def multiData_show():

    fns = natsorted(glob('../data/logSoftmax/*.csv'))
    print('loading data...')
    datas = [np.loadtxt(fn, delimiter=',') for fn in fns]  
    datas = [np.exp(data) for data in datas]

    labels = np.loadtxt('../data/labels.csv', delimiter=',', dtype=int)
    
    baseColors = [[166,206,227],[31,120,180],[178,223,138],[51,160,44],[251,154,153],[227,26,28],[253,191,111],[255,127,0],[202,178,214],[106,61,154]]
    baseColors = np.array(baseColors) / 255
    colors = baseColors[labels]
    
    fig = plt.figure(figsize=[6,6])

    dmax = max([np.abs(data).max() for data in datas])
    
    params = {
        'mode':['show',],
        'stepsize': np.pi**2/1000,
        'seed': 0,
        'T': 15,
        'fps':60,
        'xlim': [-dmax, dmax],
        'ylim': [-dmax, dmax],
        'should_plot_axis': False,
        'size':10,
    }

    ax = fig.add_subplot(111)
    params['ax'] = ax

    for i in range(len(datas)):
        params['t0'] = params['T']*i
        epoch = fns[i].split('.')[-2].split('epoch')[-1]
        params['title'] = 'epoch {}'.format(epoch)
        res = take_grand_tour(datas[i], colors, **params)
        # params['lambdas'] = res['lambdas']

    plt.show()


def multiData_gif():

    fns = natsorted(glob('../data/conv1/*.csv'))
    print('loading data...')
    datas = [np.loadtxt(fn, delimiter=',') for fn in fns]  
    # datas = [np.exp(data) for data in datas]
    
    # for high dim data:
    pca = PCA()
    pca.fit(datas[-1])
    ndim = len(pca.explained_variance_ratio_[pca.explained_variance_ratio_ > 0.01])
    print('using only first {} principle components'.format(ndim))
    datas = [pca.transform(data)[:,:ndim] for data in datas]



    labels = np.loadtxt('../data/labels.csv', delimiter=',', dtype=int)
    
    baseColors = [[166,206,227],[31,120,180],[178,223,138],[51,160,44],[251,154,153],[227,26,28],[253,191,111],[255,127,0],[202,178,214],[106,61,154]]
    baseColors = np.array(baseColors) / 255
    colors = baseColors[labels]
    
    fig = plt.figure(figsize=[6,6])

    dmax = max([np.abs(data).max() for data in datas])
    
    params = {
        'mode':['save',],
        'stepsize': np.pi**2/10000,
        'seed': 0,
        'T': 10,
        'fps':60,
        'xlim': [-dmax, dmax],
        'ylim': [-dmax, dmax],
        'should_plot_axis': False,
        'size':5,
    }

    ax = fig.add_subplot(111)
    params['ax'] = ax

    folders = []
    for i in range(len(datas)):
        print('{}/{}'.format(i+1,len(datas)))
        params['t0'] = params['T']*i
        epoch = fns[i].split('.')[-2].split('epoch')[-1]
        params['title'] = 'epoch {}'.format(epoch)
        res = take_grand_tour(datas[i], colors, **params)
        # params['lambdas'] = res['lambdas']
        folders.append(res['folder'])

    fns = [natsorted(glob('{}/*.png'.format(folder))) for folder in folders]
    fns = sum(fns, [])
    make_gif(fns, './test_multiData_save.gif')


if __name__ == '__main__':
    realData_show()
