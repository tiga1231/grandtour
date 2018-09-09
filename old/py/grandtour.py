import numpy as np
import matplotlib.pyplot as plt

from natsort import natsorted

import os
import subprocess
from glob import glob
from time import time

def rot(ndim, dim1, dim2, theta):
    res = np.eye(ndim)
    res[dim1, dim1] = np.cos(theta)
    res[dim2, dim1] = -np.sin(theta)
    res[dim1, dim2] = np.sin(theta)
    res[dim2, dim2] = np.cos(theta)
    return res


def proj(matrix, ndim):
    return matrix[:,:ndim]


def draw_frame(ax, data, colors, 
    alpha=1.0, size=30, title=None):


    ax.clear()
    ax.scatter(data[:,0], data[:,1], s=size, c=colors, alpha=alpha)

    if title is not None:
        ax.set_title(title)
    


def draw_projected_axes(ax, axes,show_index=True):
    ax.plot(axes[:,0], axes[:,1], ':', c='grey', alpha=0.5)
    if show_index:
        ndim = axes.shape[0]//2
        for i in range(ndim):
            ax.text(axes[i*2, 0], axes[i*2, 1], str(i))



def make_gif(in_filenames, out_filename, fps=60):
    cmd = ['convert', '-loop', '0', '-delay', str(100//fps)]
    cmd += in_filenames
    cmd.append(out_filename)

    subprocess.run(cmd)


def take_grand_tour(data, colors='C0', mode=['show', 'png', 'gif'], 
    # torus algorithm parameters
    lambdas = None, stepsize=np.pi/6, seed=None,
    # display parameters
    ax = None, should_plot_axis=True, should_fix_extent=False,
    xlim=None, ylim=None, title=None, size=30,
    # animation parameters
    t0=0, T=60, fps=60):
    

    print('mode = {} ...'.format(mode))

    if 'save' in mode:
        tmp_folder = './tmp/{}/'.format(time())
        os.mkdir(tmp_folder)

    ndim = data.shape[1]
    # N = (ndim**2-ndim)//2
    N = ndim**2-ndim

    # init
    if seed is not None:
        np.random.seed(seed)
    
    if lambdas is None:
        lambdas = np.random.beta(2,15,N) * 2*np.pi

    if ax is None:
        fig = plt.figure(figsize=[6,6])
        ax = fig.add_subplot(111)


    # draw frames
    for t in range(t0, t0+T):

        thetas_t = lambdas * t * stepsize
        rotation = np.eye(ndim)

        n=0
        for i in range(ndim):
            for j in range(ndim):
                if i!=j:
                    rot_ij = rot(ndim, i, j, thetas_t[n])
                    rotation = rot_ij.dot(rotation)
                    n+=1

        projection_matrix = proj(rotation, ndim=2)
        data_t = data.dot(projection_matrix)

        draw_frame(ax, data_t, colors,
            size=size, alpha=0.8,
            title='frame {}\n{}'.format(t, title or ''))

        if should_plot_axis:
            axes_length = max( np.abs(data).max()*0.7, 1)
            axis_line = np.eye(ndim) * axes_length
            axis_line = axis_line.dot(projection_matrix)
            dx = np.c_[axis_line[:,0], np.zeros(axis_line.shape[0])].flatten()
            dy = np.c_[axis_line[:,1], np.zeros(axis_line.shape[0])].flatten()
            axis_line = np.c_[dx, dy]
            
            draw_projected_axes(ax, axis_line)
        
        ax.axis('equal')

        if should_fix_extent:
            dmax = np.abs(data).max()
            ax.set_xlim([-dmax, dmax])
            ax.set_ylim([-dmax, dmax])

        if xlim is not None:
            ax.set_xlim(xlim)
        if ylim is not None:
            ax.set_ylim(ylim)


        if 'show' in mode:
            plt.draw()
            plt.pause(1/fps)

        if 'save' in mode:
            plt.savefig('{}/{}.png'.format(tmp_folder, t))


    if 'gif' in mode:
        print('converting to gif...')
        # convert -loop 0 -delay 10 'img/%d.png[0-999]' out.gif
        in_filenames = natsorted(glob(tmp_folder+'*.png'))
        out_filename = '{}/../{}.gif'.format(tmp_folder, tmp_folder.split('/')[-2])
        make_gif(in_filenames, out_filename, fps=fps)
    

    res = {'lambdas': lambdas}
    if 'save' in mode:
        res['folder'] = tmp_folder
    if 'gif' in mode:
        res['gif'] = out_filename

    return res





