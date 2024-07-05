import matplotlib.pyplot as plt
import numpy as np
import scipy.optimize as optimize
from matplotlib.widgets import Button


def get_points():
    points = []
    with open('contour.txt', 'r') as file:
        for line in file:
            x, y = line.strip().split(',')
            points.append((float(x), float(y)))
    return points


def point_distance(p1, p2):
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)


def contour_length(points):
    length = 0
    for i in range(len(points) - 1):
        length += point_distance(points[i], points[i + 1])
    return length


def get_points_for_min_length(points, min_length):
    # Get the minimum number of points to reach the specified length
    new_points = []
    length = 0
    for i in range(len(points) - 1):
        segment_length = point_distance(points[i], points[i + 1])
        if length + segment_length < min_length:
            new_points.append(points[i])
            length += segment_length
        else:
            new_points.append(points[i])
            new_points.append(points[i + 1])
            break
    return new_points


def fit_circle(points):
    def calc_R(xc, yc):
        return np.sqrt((points[:, 0] - xc)**2 + (points[:, 1] - yc)**2)

    def cost(params):
        xc, yc, r = params
        return calc_R(xc, yc) - r

    # Initial guess: center (xc, yc) at mean of points, radius as mean distance to mean point
    x_m = np.mean(points[:, 0])
    y_m = np.mean(points[:, 1])
    r_guess = np.mean(
        np.sqrt((points[:, 0] - x_m)**2 + (points[:, 1] - y_m)**2))
    initial_guess = [x_m, y_m, r_guess]

    # Optimize the parameters
    result = optimize.least_squares(cost, initial_guess)
    xc, yc, r = result.x

    # Calculate start and stop angles
    start_angle, end_angle = shortest_arc(points, (xc, yc))

    # Calculate R^2 value
    residuals = result.fun
    ss_res = np.sum(residuals**2)
    ss_tot = np.sum((calc_R(xc, yc) - np.mean(calc_R(xc, yc)))**2)
    r_squared = 1 - (ss_res / ss_tot)
    print("Deviation: ", ss_res)
    return xc, yc, r, start_angle, end_angle, ss_res


def shortest_arc(points, center):
    # Find the shortest arc between multiple points
    angles = np.rad2deg(np.arctan2(
        points[:, 1] - center[1], points[:, 0] - center[0]))
    # Sort the angles
    angles = np.sort(angles)
    # Calculate the differences between the angles
    differences = np.abs(np.roll(angles, -1) - angles)
    # Find the index of the largest absolute difference
    max_diff_index = np.argmax(differences)
    # Find the two points with the largest difference
    p1 = points[max_diff_index]
    if max_diff_index == len(points) - 1:
        p2 = points[0]
    else:
        p2 = points[max_diff_index + 1]
    # Start and end angle
    border_angles = np.array([np.rad2deg(np.arctan2(
        p1[1] - center[1], p1[0] - center[0])), np.rad2deg(np.arctan2(p2[1] - center[1], p2[0] - center[0]))])
    # Get an angle from angles that is not in border_angles
    angle_between = 0
    for angle in angles:
        if angle not in border_angles:
            angle_between = angle
            break
    # Check on which side of the border the angle is
    if angle_between < np.max(border_angles) and angle_between > np.min(border_angles):
        return np.min(border_angles), np.max(border_angles)
    else:
        return np.max(border_angles), np.min(border_angles)


def points_between_angles(start_angle, end_angle, amount):
    # Return evenly spaced angles between theta1 and theta2 (shortest arc)
    if start_angle < end_angle:
        return np.linspace(start_angle, end_angle, amount)
    elif (start_angle > 0 and end_angle > 0) or (start_angle < 0 and end_angle < 0):
        angle_range = (360 - np.abs(start_angle) +
                       np.abs(end_angle)) % 360
    else:
        angle_range = 360 - np.abs(start_angle) - np.abs(end_angle)
    step_size = angle_range / amount
    angles = []
    for i in range(amount+1):
        if start_angle < end_angle or start_angle >= 0:
            angle = start_angle + i * step_size
            if angle > 360:
                angle -= 360
        else:
            angle = start_angle - i * step_size
            if angle < 0:
                angle += 360
        angles.append(angle)
    return np.array(angles)


def main_plot():
    ax.clear()
    ax.imshow(main_image)
    # First point in blue
    ax.plot(*points[0], 'bo')
    ax.plot(*zip(*points[1:]), 'ro')


def draw_arc(center, radius, start_angle, end_angle):
    theta = points_between_angles(start_angle, end_angle, 10)
    x_fit = center[0] + radius * np.cos(np.deg2rad(theta))
    y_fit = center[1] + radius * np.sin(np.deg2rad(theta))
    ax.plot(x_fit, y_fit, 'g-')


def filter_arcs(arcs):
    # if arcs overlap, only draw the larger one
    clean_arcs = []
    # Sort the arcs by distance
    arcs = sorted(arcs, key=lambda x: x['distance'])
    while len(arcs) > 0:
        arc = arcs.pop()
        for remaining in arcs:
            if (remaining['start'] <= arc['start'] and remaining['end'] >= arc['start']) or (remaining['start'] <= arc['end'] and remaining['end'] >= arc['end']):
                # Remove the smaller arc
                arcs.remove(remaining)
        clean_arcs.append(arc)
    return clean_arcs


def draw_all_arcs(arcs):
    for arc in arcs:
        draw_arc((arc['xc'], arc['yc']), arc['r'],
                 arc['start_angle'], arc['end_angle'])


# Algorithm
points = get_points()
circumference = contour_length(points)
arc_length_threshold = 0.1 * circumference
arc_deviation_threshold = 100


def find_arcs():
    current_index = 0
    segment_size = 0
    arc_segments = []
    for index in range(0, len(points)):
        print()
        print("Checking next index")
        if index < current_index:
            continue
        for i in points[current_index:]:
            print("Adding point")
            if segment_size < 4:
                segment_points = get_points_for_min_length(
                    points[current_index:], arc_length_threshold)
                segment_size = len(segment_points)
                while segment_size < 4:
                    if current_index + segment_size < len(points):
                        segment_points.append(
                            points[current_index + segment_size])
                        segment_size += 1
                    else:
                        overflow = current_index + segment_size - len(points)
                        segment_points.append(points[overflow])
                        segment_size += 1
                        break  # not implemented yet
            else:
                if current_index + segment_size < len(points):
                    segment_points.append(points[current_index + segment_size])
                    segment_size += 1
                else:
                    overflow = current_index + segment_size - len(points)
                    segment_points.append(points[overflow])
                    segment_size += 1
                    break  # not implemented yet
            # There are now atleast 4 points with a minimum length of arc_length_threshold
            segment_points_np = np.array(segment_points)
            xc, yc, r, start_angle, end_angle, r_squared = fit_circle(
                segment_points_np)
            # Plot the points and the fitted circle
            theta = points_between_angles(start_angle, end_angle, 10)
            x_fit = xc + r * np.cos(np.deg2rad(theta))
            y_fit = yc + r * np.sin(np.deg2rad(theta))
            # If the arc is valid, add it to the list of arc segments and try to fit more points
            if abs(r_squared) < arc_deviation_threshold:
                print("Arc smaller than threshold")
                if len(arc_segments) > 0:
                    if arc_segments[-1]['start'] == current_index:
                        arc_segments.pop()
                arc_segments.append(
                    {'start': current_index, 'end': current_index + segment_size-1, 'xc': xc, 'yc': yc, 'r': r, 'start_angle': start_angle, 'end_angle': end_angle, 'distance': point_distance(points[current_index], points[current_index + segment_size - 1])})
                continue
            # If the arc is invalid, go to the next point
            else:
                print("Arc larger than threshold")
                if len(arc_segments) > 0:
                    if arc_segments[-1]['start'] == current_index and False:
                        current_index = arc_segments[-1]['end']
                    else:
                        current_index += 1
                else:
                    current_index += 1
                segment_size = 0
                break
    return filter_arcs(arc_segments)


def get_non_arc_points(arcs, points):
    # Get all points that are not within an arc
    non_arc_points = []
    all_points = points.copy()
    # Add index to each point
    for i, point in enumerate(all_points):
        all_points[i] = (point[0], point[1], i)
    index = 0
    # Sort the arcs by start index
    arcs = sorted(arcs, key=lambda x: x['start'])
    for arc in arcs:
        if index < arc['start']:
            non_arc_points.append(all_points[index:arc['start'] + 1])
        index = arc['end']
    if index < len(points):
        non_arc_points.append(all_points[index:])
    return non_arc_points


def calc_line_deviation(line, points):
    # Calculate the deviation of a line from a set of points
    if len(points) <= 2:
        return 0
    x1, y1, x2, y2 = line
    deviations = []
    for point in points:
        x0, y0, index = point
        deviation = np.abs((y2-y1)*x0 - (x2-x1)*y0 + x2*y1 -
                           y2*x1) / np.sqrt((y2-y1)**2 + (x2-x1)**2)
        deviations.append(deviation)
    return np.mean(deviations)


def filter_lines(lines):
    # If lines overlap, only draw the larger one
    clean_lines = []
    # Sort the lines by length
    lines = sorted(lines, key=lambda x: x['length'])
    while len(lines) > 0:
        line = lines.pop()
        for remaining in lines[:]:
            if (remaining['start'][2] <= line['start'][2] and remaining['end'][2] > line['start'][2]) or \
               (remaining['start'][2] < line['start'][2] and remaining['end'][2] >= line['end'][2]) or \
               (remaining['start'][2] >= line['start'][2] and remaining['end'][2] < line['end'][2]) or \
               (remaining['start'][2] > line['start'][2] and remaining['end'][2] <= line['end'][2]):
                # Remove the smaller line
                lines.remove(remaining)
        clean_lines.append(line)
    return clean_lines


def find_lines(points, arcs):
    line_deviation_threshold = 500
    available_points = get_non_arc_points(arcs, points)
    # Find straight lines between arcs
    lines = []
    for point_group in available_points:
        segment_size = 1
        for i in range(len(point_group) - 1):
            segment = point_group[i: i + segment_size+1]
            start_point = segment[0]
            end_point = segment[-1]
            deviation = calc_line_deviation(
                (start_point[0], start_point[1], end_point[0], end_point[1]), segment)
            while deviation < line_deviation_threshold:
                if i + segment_size < len(point_group):
                    segment_size += 1
                    segment = point_group[i: i + segment_size+1]
                    deviation = calc_line_deviation(
                        (start_point[0], start_point[1], end_point[0], end_point[1]), segment)
                else:
                    break
            lines.append({'start': start_point, 'end': end_point, 'deviation': deviation,
                          'length': point_distance(start_point, end_point)})
    return filter_lines(lines)


def draw_line(line):
    x_fit = [line['start'][0], line['end'][0]]
    y_fit = [line['start'][1], line['end'][1]]
    ax.plot(x_fit, y_fit, 'b-')


def draw_all_lines(lines):
    for line in lines:
        draw_line(line)


# Plot Setup
main_image = plt.imread('main.png')
fig, ax = plt.subplots()
plt.subplots_adjust(bottom=0.2)
main_plot()
plt.draw()


def callback(event):
    arcs = find_arcs()
    lines = find_lines(points, arcs)
    main_plot()
    draw_all_arcs(arcs)
    draw_all_lines(lines)
    plt.draw()


axnext = fig.add_axes([0.7, 0.05, 0.1, 0.075])
bnext = Button(axnext, 'Next')
bnext.on_clicked(callback)
plt.show()
