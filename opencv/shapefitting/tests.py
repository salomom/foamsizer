import unittest
from fitting import get_non_arc_points
import numpy as np


class FittingTests(unittest.TestCase):
    def test_get_non_arc_points(self):
        arcs = [{'start': 23, 'end': 28, 'xc': np.float64(-585.0377029902234), 'yc': np.float64(1358.8606668885002), 'r': np.float64(1201.5777515856078), 'start_angle': np.float64(-29.93860575270462), 'end_angle': np.float64(16.101992024239856), 'distance': np.float64(941.3320349377259)}, {'start': 2, 'end': 7, 'xc': np.float64(1322.8589099030492), 'yc': np.float64(1365.0378020783453), 'r': np.float64(1286.9298337234336), 'start_angle': np.float64(167.88690930199084), 'end_angle': np.float64(-151.44183618748684), 'distance': np.float64(894.9145210577377)}, {'start': 17, 'end': 21, 'xc': np.float64(-499.0505758473914), 'yc': np.float64(1401.8325688610435), 'r': np.float64(
            1030.231654442817), 'start_angle': np.float64(-29.983281808982), 'end_angle': np.float64(15.907713413732859), 'distance': np.float64(803.7536936151522)}, {'start': 9, 'end': 13, 'xc': np.float64(1133.029911427782), 'yc': np.float64(1412.9094145832291), 'r': np.float64(1012.9602143317159), 'start_angle': np.float64(163.59964063302874), 'end_angle': np.float64(-153.6681615485035), 'distance': np.float64(737.8685519792804)}, {'start': 18, 'end': 21, 'xc': np.float64(-419.89845510842815), 'yc': np.float64(1402.683943661179), 'r': np.float64(953.1328653933834), 'start_angle': np.float64(-22.243864450315506), 'end_angle': np.float64(17.16244597928772), 'distance': np.float64(642.6546506483867)}]
        points = [(348.0, 31.0), (296.0, 32.0), (191.0, 749.0), (92.0, 1008.0), (39.95147482766049, 1225.5292668245045), (34.0, 1348.0), (45.0, 1504.0), (65.0, 1635.0), (111.0, 1736.0), (161.0, 1699.0), (121.0, 1440.0), (131.0, 1269.0), (168.0, 1099.0), (226.0, 964.0), (298.0,
                                                                                                                                                                                                                                                                               750.0), (322.0, 690.0), (356.0, 763.0), (395.0, 886.0), (462.0, 1042.0), (518.0, 1228.0), (532.0, 1432.0), (491.0, 1684.0), (532.0, 1725.0), (569.0, 1692.0), (609.0, 1485.0), (616.4946977395476, 1261.252612774836), (582.0, 1079.0), (495.0, 845.0), (460.0, 757.0)]
        expected_result = [[(348.0, 31.0, 0), (296.0, 32.0, 1), (191.0, 749.0, 2)], [(65.0, 1635.0, 7), (111.0, 1736.0, 8), (161.0, 1699.0, 9)], [(226.0, 964.0, 13), (
            298.0, 750.0, 14), (322.0, 690.0, 15), (356.0, 763.0, 16), (395.0, 886.0, 17)], [(491.0, 1684.0, 21), (532.0, 1725.0, 22), (569.0, 1692.0, 23)], [(460.0, 757.0, 28)]]
        result = get_non_arc_points(arcs, points)
        self.assertEqual(result, expected_result)

    def test_function2(self):
        # Test code for function 2
        pass

    def test_function3(self):
        # Test code for function 3
        pass


if __name__ == '__main__':
    unittest.main()
