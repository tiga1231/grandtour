from grandtour import take_grand_tour, make_gif

import numpy as np
import matplotlib.pyplot as plt
from natsort import natsorted
from sklearn.decomposition import PCA

import unittest
from glob import glob

class GtTestCase(unittest.TestCase):

    def _test_threeAxis_save(self):
        l = np.linspace(-5,5,10)
        d0 = np.zeros([len(l), 3])
        d0[:,0] = l
        d1 = np.zeros([len(l), 3])
        d1[:,1] = l
        d2 = np.zeros([len(l), 3])
        d2[:,2] = l
        data = np.r_[d0,d1,d2]
        colors = ['C0',]*len(l)+['C1',]*len(l)+['C2',]*len(l)
        take_grand_tour(data, colors, mode='save', T=60)


    def _test_threeAxis_show(self):
        l = np.linspace(-5,5,10)
        d0 = np.zeros([len(l), 3])
        d0[:,0] = l
        d1 = np.zeros([len(l), 3])
        d1[:,1] = l
        d2 = np.zeros([len(l), 3])
        d2[:,2] = l
        data = np.r_[d0,d1,d2]
        colors = ['C0',]*len(l)+['C1',]*len(l)+['C2',]*len(l)
        take_grand_tour(data, colors, mode='show', T=60)


    def _test_realData_save(self):
        fn = 'data/{0}/activation_{0}_epoch300.csv'.format('fc2')
        data = np.loadtxt(fn, delimiter=',')
        # data = np.exp(data)
        
        labels = np.loadtxt('data/labels.csv', delimiter=',', dtype=int)
    
        baseColors = [[166,206,227],[31,120,180],[178,223,138],[51,160,44],[251,154,153],[227,26,28],[253,191,111],[255,127,0],[202,178,214],[106,61,154]]
        baseColors = np.array(baseColors) / 255
        colors = baseColors[labels]
        
        take_grand_tour(data, colors, mode='save', T=200, stepsize=np.pi/100, seed=0)


    def _test_realData_show(self):
        fn = 'data/{0}/activation_{0}_epoch300.csv'.format('fc2')
        data = np.loadtxt(fn, delimiter=',')
        # data = np.exp(data)
        
        labels = np.loadtxt('data/labels.csv', delimiter=',', dtype=int)
    
        baseColors = [[166,206,227],[31,120,180],[178,223,138],[51,160,44],[251,154,153],[227,26,28],[253,191,111],[255,127,0],[202,178,214],[106,61,154]]
        baseColors = np.array(baseColors) / 255
        colors = baseColors[labels]
        
        take_grand_tour(data, colors, mode='show', T=200, stepsize=np.pi/100, seed=0)


    def _test_multiData_show(self):

        fns = natsorted(glob('data/logSoftmax/*.csv'))
        print('loading data...')
        datas = [np.loadtxt(fn, delimiter=',') for fn in fns]  
        datas = [np.exp(data) for data in datas]

        labels = np.loadtxt('data/labels.csv', delimiter=',', dtype=int)
        
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


    def test_multiData_gif(self):

        fns = natsorted(glob('data/conv1/*.csv'))
        print('loading data...')
        datas = [np.loadtxt(fn, delimiter=',') for fn in fns]  
        # datas = [np.exp(data) for data in datas]
        
        # for high dim data:
        pca = PCA()
        pca.fit(datas[-1])
        ndim = len(pca.explained_variance_ratio_[pca.explained_variance_ratio_ > 0.01])
        print('using only first {} principle components'.format(ndim))
        datas = [pca.transform(data)[:,:ndim] for data in datas]



        labels = np.loadtxt('data/labels.csv', delimiter=',', dtype=int)
        
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
        # plt.show()


if __name__ == '__main__':
    unittest.main()

