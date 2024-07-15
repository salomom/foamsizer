# Reads a base64 image and removes the background
import cv2
import numpy as np
import sys


def fourChannels(img):
    height, width, channels = img.shape
    if channels < 4:
        new_img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        return new_img

    return img


if __name__ == '__main__':
    # Read the image
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    img = cv2.imread(input_path)
    img = fourChannels(img)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    th, threshed = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    morphed = cv2.morphologyEx(threshed, cv2.MORPH_CLOSE, kernel)

    cnts = cv2.findContours(morphed, cv2.RETR_EXTERNAL,
                            cv2.CHAIN_APPROX_SIMPLE)[-2]
    cnt = sorted(cnts, key=cv2.contourArea)[-1]

    # Make background transparent
    mask = np.zeros(img.shape[:2], np.uint8)
    cv2.drawContours(mask, [cnt], -1, 255, -1)
    dst = cv2.bitwise_and(img, img, mask=mask)

    # Save the result as png with transparent background
    cv2.imwrite(output_path, dst)
