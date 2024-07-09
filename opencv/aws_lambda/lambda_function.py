import cv2
import numpy as np
import json
import base64


def lambda_handler(event, context):
    payload_base64 = event['body']
    payload = json.loads(base64.b64decode(payload_base64))
    area = payload['area']
    imagebase64 = payload['image']
    image = readb64image(imagebase64)
    approx = analyze_image(image)

    return {
        'statusCode': 200,
        'body': json.dumps(approx),
    }


def readb64image(uri):
    encoded_data = uri.split(',')[1]
    nparr = np.fromstring(base64.b64decode(encoded_data), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


def analyze_image(image):

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

    # Draw an approximated contour around the largest contour
    epsilon = 0.0025 * cv2.arcLength(largest_contour, True)
    approx = cv2.approxPolyDP(largest_contour, epsilon, True)

    # Return approx points
    return approx.tolist()
