import numpy as np


class Pixel:
    def __init__(self, r, g, b):
        self.r = r
        self.g = g
        self.b = b

    def euclid_distance(self, pixel1):
        return np.sqrt((self.r - pixel1.r)**2 + (self.g - pixel1.g)**2 + (self.b - pixel1.b)**2)

    