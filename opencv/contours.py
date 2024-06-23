import cv2
import imutils
import numpy as np

# Read image
img = cv2.imread('img/4.JPEG')
hh, ww = img.shape[:2]

# threshold on white
# Define lower and uppper limits
lower = np.array([40, 40, 40])
upper = np.array([255, 255, 255])

# Blur image to remove noise
img = cv2.GaussianBlur(img, (5, 5), 0)

# Create mask to only select black
thresh = cv2.inRange(img, lower, upper)
# apply morphology
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (20, 20))
morph = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
# invert morp image
mask = 255 - morph
# apply mask to image
result = cv2.bitwise_and(img, img, mask=mask)
contours = cv2.findContours(
    mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cnts = imutils.grab_contours(contours)
c = max(cnts, key=cv2.contourArea)

cv2.drawContours(result, [c], -1, (0, 0, 255), 3)
print(len(c))

cv2.namedWindow('img', cv2.WINDOW_NORMAL)
cv2.imshow('img', thresh)
cv2.waitKey(0)
cv2.imshow('img', morph)
cv2.waitKey(0)
cv2.imshow('img', mask)
cv2.waitKey(0)
cv2.imshow('img', result)
cv2.waitKey(0)

eps = 0.001
# approximate the contour
peri = cv2.arcLength(c, True)
approx = cv2.approxPolyDP(c, eps * peri, True)
# draw the approximated contour on the image
output = result.copy()
cv2.drawContours(output, [approx], -1, (0, 255, 0), 3)
text = "eps={:.4f}, num_pts={}".format(eps, len(approx))
# show the approximated contour image
print("[INFO] {}".format(text))
cv2.imshow("img", output)
cv2.waitKey(0)

points = []
for point in approx.tolist():
    point = point[0]
    points.append(point)

print(points)
