import cv2
import numpy as np
from matplotlib import pyplot as plt
import sys

# Read args
image_path = sys.argv[1]
# Load the image
# image_path = "C:/Users/timal/Documents/Programmieren/foamsizer/opencv/img/caliper.jpg"
image = cv2.imread(image_path)

# Convert to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Apply GaussianBlur to reduce noise
blurred = cv2.GaussianBlur(gray, (5, 5), 0)

# Use adaptive thresholding
thresh = cv2.adaptiveThreshold(
    blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 135, 2)

# Use morphological operations to close gaps
kernel = np.ones((25, 25), np.uint8)
morphed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

# Find contours
contours, _ = cv2.findContours(
    morphed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Select the contour with the largest area
largest_contour = max(contours, key=cv2.contourArea)

# Draw the largest contour on the original image
contour_image = image.copy()
cv2.drawContours(contour_image, [largest_contour], -1, (0, 255, 0), 2)

# Draw an approximated contour around the largest contour
epsilon = 0.0025 * cv2.arcLength(largest_contour, True)
approx = cv2.approxPolyDP(largest_contour, epsilon, True)
cv2.drawContours(contour_image, [approx], -1, (0, 0, 255), 2)

# Print approx points
approx_points = approx.tolist()
for point in approx_points:
    print(str(point[0][0]) + "," + str(point[0][1]))
    sys.stdout.flush()

# Display the original image, thresholded image, and contour image
plt.figure(figsize=(15, 5))

plt.subplot(1, 4, 1)
plt.title("Original Image")
plt.imshow(cv2.cvtColor(blurred, cv2.COLOR_BGR2RGB))

plt.subplot(1, 4, 2)
plt.title("Thresholded Image")
plt.imshow(thresh, cmap='gray')

plt.subplot(1, 4, 3)
plt.title("Closed Contours")
plt.imshow(morphed, cmap='gray')

plt.subplot(1, 4, 4)
plt.title("Largest Contour")
plt.imshow(cv2.cvtColor(contour_image, cv2.COLOR_BGR2RGB))

# plt.show()
