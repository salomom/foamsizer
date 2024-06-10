import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Circle,
  Image,
  Layer,
  Line,
  Rect,
  Stage,
  Transformer,
} from 'react-konva';
import useImage from 'use-image';
import Contour from './contourpoints';
import ButtonBar from './toolbar';

export default function ContourAdjuster({
  image,
  getContourPoints,
  saveShapes,
  saveContourPoints,
}) {
  const [placedShapes, setPlacedShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(-1);
  const [contourPoints, setContourPoints] = useState([]);
  const [createPointActive, setCreatePointActive] = useState(false);
  const tRef = useRef();
  const shapeRef = useRef();
  image = image
    ? 'data:image/jpg;base64,' + image
    : 'https://placehold.co/500x500';
  const [konvaImage] = useImage(image);
  const stageSize = { height: 700, width: 700 };
  const scale = getScale({ image: konvaImage, stageSize });

  function contourPointsToFile() {
    const points = contourPoints.map((point) => point.join(',')).join('\n');
    saveContourPoints(points);
  }

  function shapesToFile() {
    // Placed shapes to json
    const shapes = JSON.stringify(placedShapes);
    saveShapes(shapes);
  }

  function setNewPosition(key, position) {
    position = { x: parseInt(position.x), y: parseInt(position.y) };
    const newPlacedShapes = placedShapes.map((shape, index) =>
      shape.key === key ? { ...shape, ...position } : shape,
    );
    setPlacedShapes(newPlacedShapes);
  }

  function setNewSize(key, height, width, rotation) {
    height = parseInt(height);
    width = parseInt(width);
    rotation = parseInt(rotation);
    if (rotation < 0) {
      rotation = 360 + rotation;
    } else if (rotation >= 360) {
      rotation = rotation - 360;
    }
    const newPlacedShapes = placedShapes.map((shape, index) =>
      shape.key === key
        ? { ...shape, height: height, width: width, rotation: rotation }
        : shape,
    );
    setPlacedShapes(newPlacedShapes);
  }

  function setNewDepth(key, depth) {
    depth = parseInt(depth);
    const newPlacedShapes = placedShapes.map((shape, index) =>
      shape.key === key ? { ...shape, depth: depth } : shape,
    );
    setPlacedShapes(newPlacedShapes);
  }

  function removeShape(key) {
    const newPlacedShapes = placedShapes.filter((shape) => shape.key !== key);
    setPlacedShapes(newPlacedShapes);
  }

  function moveShape(key, direction) {
    const stepSize = 1;
    const newPlacedShape = placedShapes.map((shape) => {
      if (shape.key === key) {
        var newShape;
        switch (direction) {
          case 'up':
            newShape = { ...shape, y: shape.y - stepSize };
            break;
          case 'down':
            newShape = { ...shape, y: shape.y + stepSize };
            break;
          case 'left':
            newShape = { ...shape, x: shape.x - stepSize };
            break;
          case 'right':
            newShape = { ...shape, x: shape.x + stepSize };
            break;
          default:
            return shape;
        }
        return newShape;
      }
      return shape;
    });
    setPlacedShapes(newPlacedShape);
  }

  function createRect() {
    const newPlacedShapes = [
      ...placedShapes,
      {
        type: 'rect',
        key: placedShapes.length,
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        fill: 'red',
        depth: 10,
      },
    ];
    setPlacedShapes(newPlacedShapes);
  }

  function createCircle() {
    const newPlacedShapes = [
      ...placedShapes,
      {
        type: 'circle',
        key: placedShapes.length,
        x: 100,
        y: 100,
        height: 50,
        width: 50,
        fill: 'green',
        depth: 10,
      },
    ];
    setPlacedShapes(newPlacedShapes);
  }

  function addContourPoint(x, y) {
    // find 2 nearest points
    const distances = contourPoints.map((point, index) => {
      const [px, py] = point;
      return { index: index, dist: Math.sqrt((px - x) ** 2 + (py - y) ** 2) };
    });
    distances.sort((a, b) => a.dist - b.dist);
    const nearest = [distances[0].index];
    for (let i = 1; i < distances.length; i++) {
      if (Math.abs(distances[i].index - nearest[0]) === 1) {
        nearest.push(distances[i].index);
        nearest.sort();
        break;
      }
    }
    const newContourPoints = [
      ...contourPoints.slice(0, nearest[0] + 1),
      [x, y],
      ...contourPoints.slice(nearest[1]),
    ];
    setContourPoints(newContourPoints);
    setCreatePointActive(false);
  }

  function checkStageClick(e) {
    if (createPointActive) {
      // get pointer position
      const pos = e.target.getStage().getPointerPosition();
      addContourPoint(pos.x / scale, pos.y / scale);
    } else {
      checkDeselect(e);
    }
  }

  function checkDeselect(e) {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target.className === 'Image';
    if (clickedOnEmpty) {
      setSelectedShape(-1);
    }
  }

  useHotkeys(
    'delete',
    () => {
      removeShape(selectedShape);
    },
    [placedShapes, selectedShape],
  );
  useHotkeys(
    'up',
    () => {
      if (selectedShape !== -1) {
        moveShape(selectedShape, 'up');
      }
    },
    [placedShapes, selectedShape],
  );
  useHotkeys(
    'down',
    () => {
      if (selectedShape !== -1) {
        moveShape(selectedShape, 'down');
      }
    },
    [placedShapes, selectedShape],
  );
  useHotkeys(
    'left',
    () => {
      if (selectedShape !== -1) {
        moveShape(selectedShape, 'left');
      }
    },
    [placedShapes, selectedShape],
  );
  useHotkeys(
    'right',
    () => {
      if (selectedShape !== -1) {
        moveShape(selectedShape, 'right');
      }
    },
    [placedShapes, selectedShape],
  );

  useEffect(() => {
    getContourPoints().then(setContourPoints);
  }, [image]);

  return (
    <div className="w-[70%] h-[80%] bg-slate-700 mr-20 rounded-md">
      <ButtonBar
        submit={() => {
          contourPointsToFile();
          shapesToFile();
        }}
        selectedTool={placedShapes.find((shape) => shape.key === selectedShape)}
        remove={() => removeShape(selectedShape)}
        createRect={createRect}
        createCircle={createCircle}
        setSize={(height, width, rotation) => {
          setNewSize(selectedShape, height, width, rotation);
        }}
        setDepth={(depth) => setNewDepth(selectedShape, depth)}
        createPoint={() => setCreatePointActive(!createPointActive)}
        createPointActive={createPointActive}
      />
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        onClick={checkStageClick}
      >
        <Layer>
          <Image
            image={konvaImage}
            height={konvaImage?.naturalHeight}
            width={konvaImage?.naturalWidth}
          />
          <Line
            points={contourPoints.flat()}
            stroke={'red'}
            strokeWidth={5}
            closed
          />
          {placedShapes.map((shape, i) => (
            <PlacedShape
              key={shape.key}
              shape={shape}
              isSelected={selectedShape === shape.key}
              onSelect={() => setSelectedShape(shape.key)}
              setNewPosition={setNewPosition}
              setNewSize={(height, width, rotation) => {
                setNewSize(shape.key, height, width, rotation);
              }}
            />
          ))}
          <Contour points={contourPoints} setPoints={setContourPoints} />
        </Layer>
      </Stage>
    </div>
  );
}

function PlacedShape({
  shape,
  isSelected,
  onSelect,
  setNewPosition,
  setNewSize,
}) {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  function transform(e) {
    const shape = e.target;
    shape.width(shape.width() * shape.scaleX());
    shape.height(shape.height() * shape.scaleY());
    // reset scale
    shape.scaleX(1);
    shape.scaleY(1);
    setNewSize(shape.height(), shape.width(), shape.rotation());
  }

  return (
    <>
      {shape.type === 'rect' && (
        <Rect
          x={shape.x}
          y={shape.y}
          opacity={0.5}
          rotation={shape.rotation}
          offsetX={shape.width / 2}
          offsetY={shape.height / 2}
          width={shape.width}
          height={shape.height}
          fill={shape.fill}
          onMouseDown={onSelect}
          ref={shapeRef}
          onDragEnd={(e) =>
            setNewPosition(shape.key, { x: e.target.x(), y: e.target.y() })
          }
          onTransform={transform}
          draggable
        />
      )}
      {shape.type === 'circle' && (
        <Circle
          x={shape.x}
          y={shape.y}
          opacity={0.5}
          offsetX={shape.radius}
          offsetY={shape.radius}
          width={shape.width}
          height={shape.height}
          radius={shape.height / 2}
          fill={shape.fill}
          onMouseDown={onSelect}
          ref={shapeRef}
          onDragEnd={(e) =>
            setNewPosition(shape.key, { x: e.target.x(), y: e.target.y() })
          }
          onTransform={transform}
          draggable
        />
      )}
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={shape.type !== 'circle'}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
        />
      )}
    </>
  );
}

function getScale({ image, stageSize }) {
  if (!image) return 1;
  return Math.min(
    stageSize.width / image.naturalWidth,
    stageSize.height / image.naturalHeight,
  );
}
