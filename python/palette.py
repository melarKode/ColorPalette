import numpy as np


class Palette:
    def __init__(self):
        self.palette = []

    def generate_palette(self, picture):
        pixels = picture.pixels
        for i in range(pixels.height):
            for j in range(pixels.width):
                print(pixels[i][j])
