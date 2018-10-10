import numpy as np
from sys import argv
import json

fn = argv[1]
dtype = argv[2]

x = np.loadtxt(fn, delimiter=',')


fnbin = fn.split('.')
fnbin[-1] = 'bin'
fnbin = '.'.join(fnbin)

x = x.astype(dtype)
x.tofile(fnbin)


fnjson = fn.split('.')
fnjson[-1] = 'json'
fnjson = '.'.join(fnjson)


outjson = {
    'shape': x.shape,
}
with open(fnjson, 'w') as f:
    json.dump(outjson, f, indent=2)