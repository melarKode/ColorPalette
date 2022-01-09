from .palette import Palette
from .picture import Picture

image = Picture()
image.load_pixels("test.png")
image.convert_pixels()
palette = Palette()
palette.generate_palette(image)
