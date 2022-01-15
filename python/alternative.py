from PIL import Image
from math import pow


def distance(p1, p2):
    return pow(pow(p1[0] - p2[0], 2) + pow(p1[1] - p2[1], 2) + pow(p1[2] - p2[2], 2), 1/2)


MAX_DIST = 50


def main():

    unique_colors = {}
    '''
    Load the image
    '''

    # img_name = input("Enter the name of the image: ")
    img_name = "test.png"
    img = Image.open(img_name)
    pixel_map = img.load()

    # Get the width and height of the image
    width, height = img.size

    for x in range(width):
        for y in range(height):
            # Get the RGB values for the pixel
            r, g, b, a = pixel_map[x, y]
            unique_colors[(r, g, b)] = 1

    keys = list(unique_colors.keys())
    print("Here")

    max_count = 0
    max_index = 0
    for i in range(len(keys)):
        count = 0
        for j in range(len(keys)):
            if distance(keys[i], keys[j]) < MAX_DIST:
                count += 1
        if count > max_count:
            max_count = count
            max_index = i

    i = 0
    print(keys[max_index])
    while i < len(keys):
        if distance(keys[max_index], keys[i]) < MAX_DIST:
            keys.pop(i)
        else:
            i += 1
    print(len(keys))


if __name__ == '__main__':
    main()
