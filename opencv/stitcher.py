import argparse
import imutils
import cv2
import sys


image = cv2.imread('img/4.JPEG')
image = imutils.resize(image, width=600)
# image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
arucoDict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_ARUCO_ORIGINAL)
arucoParams = cv2.aruco.DetectorParameters
detector = cv2.aruco.ArucoDetector(dictionary=arucoDict)
corners, ids, rejected = detector.detectMarkers(image)

if len(corners) > 0:
    # flatten the ArUco IDs list
    ids = ids.flatten()
    # loop over the detected ArUCo corners
    for (markerCorner, markerID) in zip(corners, ids):
        # extract the marker corners (which are always returned in
        # top-left, top-right, bottom-right, and bottom-left order)
        corners = markerCorner.reshape((4, 2))
        (topLeft, topRight, bottomRight, bottomLeft) = corners
        # convert each of the (x, y)-coordinate pairs to integers
        topRight = (int(topRight[0]), int(topRight[1]))
        bottomRight = (int(bottomRight[0]), int(bottomRight[1]))
        bottomLeft = (int(bottomLeft[0]), int(bottomLeft[1]))
        topLeft = (int(topLeft[0]), int(topLeft[1]))
        # draw the bounding box of the ArUCo detection
        cv2.line(image, topLeft, topRight, (0, 255, 0), 2)
        cv2.line(image, topRight, bottomRight, (0, 255, 0), 2)
        cv2.line(image, bottomRight, bottomLeft, (0, 255, 0), 2)
        cv2.line(image, bottomLeft, topLeft, (0, 255, 0), 2)
        # compute and draw the center (x, y)-coordinates of the ArUco
        # marker
        cX = int((topLeft[0] + bottomRight[0]) / 2.0)
        cY = int((topLeft[1] + bottomRight[1]) / 2.0)
        cv2.circle(image, (cX, cY), 4, (0, 0, 255), -1)
        cv2.circle(image, topLeft, 4, (255, 0, 255), -1)
        cv2.circle(image, (10, 10), 4, (255, 0, 255), -1)
        # draw the ArUco marker ID on the image
        cv2.putText(image, str(markerID),
                    (topLeft[0], topLeft[1] -
                     15), cv2.FONT_HERSHEY_SIMPLEX,
                    0.5, (0, 255, 0), 2)
        h1 = ((topLeft[1]-topRight[1]) ** 2 +
              (topLeft[0]-topRight[0]) ** 2)**0.5
        h1 = round(h1, 2)
        h2 = ((bottomLeft[1]-bottomRight[1]) ** 2 +
              (bottomLeft[0]-bottomRight[0]) ** 2)**0.5
        h2 = round(h2, 2)
        w1 = ((bottomRight[0] - topRight[0]) ** 2 +
              (bottomRight[1] - topRight[1]) ** 2) ** 0.5
        w1 = round(w1, 2)
        w2 = ((bottomLeft[0] - topLeft[0]) ** 2 +
              (bottomLeft[1] - topLeft[1]) ** 2) ** 0.5
        w2 = round(w2, 2)
        cv2.putText(image, str(h1),
                    (topRight[0], topRight[1] + 60
                     ), cv2.FONT_HERSHEY_SIMPLEX,
                    0.5, (255, 255, 0), 2)
        cv2.putText(image, str(h2),
                    (bottomRight[0], bottomRight[1] + 60
                     ), cv2.FONT_HERSHEY_SIMPLEX,
                    0.5, (255, 255, 0), 2)
        cv2.putText(image, str(w1),
                    (topRight[0] + 50, topRight[1]
                     ), cv2.FONT_HERSHEY_SIMPLEX,
                    0.5, (255, 255, 0), 2)
        cv2.putText(image, str(w2),
                    (topLeft[0] + 50, bottomLeft[1]
                     ), cv2.FONT_HERSHEY_SIMPLEX,
                    0.5, (255, 255, 0), 2)

        print("[INFO] ArUco marker ID: {}".format(markerID))
        # show the output image
cv2.imshow("Image", image)
cv2.waitKey(0)
