from PIL import Image
import numpy as np


class Picture:
    def __init__(self):
        pass

    def load_pixels(self, path):
        im = Image.open(path)
        self.pixels = list(im.getdata())
        self.width, self.height = im.size
        self.mode = im.mode

    def convert_pixels(self):
        self.pixels = np.array(self.pixels)
        if self.mode == "RGB":
            self.channels = 3
        elif self.mode == "RGBA":
            self.channels = 4
        else:
            self.channels = 1
        self.pixels = self.pixels.reshape(
            (self.height, self.width, self.channels))
