import { Circle, Line } from 'react-konva';
export default function Contour({ points, setPoints, scale }) {
  return (
    <>
      <Line points={points.flat()} stroke={'red'} strokeWidth={2} closed />
      {points.map((point, index) => (
        <Circle
          key={index}
          x={point[0]}
          y={point[1]}
          radius={7}
          fill={'red'}
          draggable
          onDragMove={(event) => {
            const newPoints = points.map((p, i) =>
              i === index
                ? [parseInt(event.target.x()), parseInt(event.target.y())]
                : p,
            );
            setPoints(newPoints);
          }}
        />
      ))}
    </>
  );
}
