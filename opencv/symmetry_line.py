import cv2
import sys


def overlay_image(img, offset):
    left = img[:, :half + offset]
    right = img[:, half + offset:]
    # Add white pixels to the right side
    if right.shape[1] < left.shape[1]:
        right = cv2.copyMakeBorder(
            right, 0, 0, 0, left.shape[1] - right.shape[1], cv2.BORDER_CONSTANT, value=[255, 255, 255])
        # Add white pixels to the left side
    elif right.shape[1] > left.shape[1]:
        left = cv2.copyMakeBorder(
            left, 0, 0, 0, right.shape[1] - left.shape[1], cv2.BORDER_CONSTANT, value=[255, 255, 255])
        right = cv2.flip(right, 1)
    return cv2.absdiff(left, right)


if __name__ == '__main__':
    path = sys.argv[1]
    imgpath = path + "/main.png"

    # Cut the image in half, flip the right side and subtract it from the left side
    img = cv2.imread(imgpath)
    fitting = True
    height, width, _ = img.shape
    half = width // 2
    offset = 200
    old_sum = None
    sums = []
    offsets = []
    while offset > -200:
        diff = overlay_image(img, offset)
        # Get the diff sum
        diff_sum = diff.sum()
        sums.append(diff_sum)
        offsets.append(offset)
        offset -= 1
    # Find the best offset
    best_offset = offsets[sums.index(min(sums))]
    print(half - best_offset)
