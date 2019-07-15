import numpy as np

nodes = np.array([
	[1, 1, 1, 1], [-1, 1, 1, 1],
	[-1, -1, 1, 1], [1, -1, 1, 1],
	[1, 1, -1, 1], [-1, 1, -1, 1],
	[-1, -1, -1, 1], [1, -1, -1, 1],

	[1, 1, 1, -1], [-1, 1, 1, -1],
	[-1, -1, 1, -1], [1, -1, 1, -1],
	[1, 1, -1, -1], [-1, 1, -1, -1],
	[-1, -1, -1, -1], [1, -1, -1, -1]
], dtype='float32')

edges = np.array([
	0, 1, 1, 2, 2, 3, 3, 0,
	4, 5, 5, 6, 6, 7, 7, 4,
	0, 4, 1, 5, 2, 6, 3, 7,

	8, 9, 9, 10, 10, 11, 11, 8,
	12, 13, 13, 14, 14, 15, 15, 12,
	8, 12, 9, 13, 10, 14, 11, 15,

	0, 8, 1, 9, 2, 10, 3, 11, 
	4, 12, 5, 13, 6, 14, 7, 15
], dtype='int32')

nodes.tofile('nodes_16_4_float32.bin')
edges.tofile('edges_32_2_int32.bin')