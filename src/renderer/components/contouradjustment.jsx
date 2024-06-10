import { Stage, Layer, Rect, Circle, Image, Transformer } from 'react-konva';
import useImage from 'use-image';
import { useState, useRef, useEffect } from 'react';
import ButtonBar from './toolbar';
import { useHotkeys } from 'react-hotkeys-hook';
import Contour from './contourpoints';

export default function ContourAdjuster({ image, getContourPoints }) {
  const [placedShapes, setPlacedShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(-1);
  const [contourPoints, setContourPoints] = useState([]);
  const tRef = useRef();
  const shapeRef = useRef();
  image = image
    ? 'data:image/jpg;base64,' + image
    : 'https://placehold.co/500x500';
  const [konvaImage] = useImage(image);
  const stageSize = { height: 700, width: 700 };
  const scale = getScale({ image: konvaImage, stageSize });

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
        selectedTool={placedShapes.find((shape) => shape.key === selectedShape)}
        remove={() => removeShape(selectedShape)}
        createRect={createRect}
        createCircle={createCircle}
        setSize={(height, width, rotation) => {
          setNewSize(selectedShape, height, width, rotation);
        }}
        setDepth={(depth) => setNewDepth(selectedShape, depth)}
      />
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onClick={checkDeselect}
      >
        <Layer>
          <Image
            image={konvaImage}
            height={konvaImage?.naturalHeight * scale}
            width={konvaImage?.naturalWidth * scale}
          />
          <Contour
            points={contourPoints}
            scale={scale}
            setPoints={setContourPoints}
          />
          {placedShapes.map((shape, i) => (
            <PlacedShape
              key={shape.key}
              shape={shape}
              scale={scale}
              isSelected={selectedShape === shape.key}
              onSelect={() => setSelectedShape(shape.key)}
              setNewPosition={setNewPosition}
              setNewSize={(height, width, rotation) => {
                setNewSize(shape.key, height, width, rotation);
              }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

function PlacedShape({
  shape,
  scale,
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
    shape.width((shape.width() * shape.scaleX()) / scale);
    shape.height((shape.height() * shape.scaleY()) / scale);
    // reset scale
    shape.scaleX(scale);
    shape.scaleY(scale);
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
          scaleX={scale}
          scaleY={scale}
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
          scaleX={scale}
          scaleY={scale}
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
