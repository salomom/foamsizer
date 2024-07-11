import { useEffect, useRef, useState } from 'react';
import { Image, Layer, Line, Stage, Transformer } from 'react-konva';
import useImage from 'use-image';
import Button from './buttons';

export default function EditTools({ currentPath, setCurrentPath }) {
  const [coverImage, setCoverImage] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [properties, setProperties] = useState('');
  const [contourPoints, setContourPoints] = useState([]);

  async function openFile() {
    const filePath = await window.electronAPI.openFile();
    if (!filePath) {
      return;
    }
    return filePath;
  }

  async function readCoverImage(filePath) {
    const imgBase64 = await window.electronAPI.openImage(filePath);
    if (!imgBase64) {
      setCoverImage('');
      return;
    }
    setCoverImage('data:image/jpg;base64,' + imgBase64);
  }

  async function openCoverImage() {
    const filePath = await openFile();
    if (!filePath) {
      return;
    }
    readCoverImage(filePath);
  }

  async function readPropertyFile(filePath) {
    const fileContent = await window.electronAPI.readFile(
      filePath + '/properties.txt',
    );
    if (!fileContent) {
      setProperties('');
    } else {
      const propertiesObj = {};
      const lines = fileContent.split('\n');
      lines.forEach((line) => {
        const [key, value] = line.split(':');
        if (!value) {
          return;
        }
        if (value[0] === ' ') {
          propertiesObj[key] = value.slice(1);
        } else {
          propertiesObj[key] = value;
        }
      });
      setProperties(propertiesObj);
    }
  }

  async function readMainImage(filePath) {
    const imgBase64 = await window.electronAPI.openImage(
      filePath + '/main.png',
    );
    if (!imgBase64) {
      setMainImage('');
      return;
    }
    setMainImage('data:image/jpg;base64,' + imgBase64);
  }

  async function getContourPoints(filePath) {
    const contourFileContent = await window.electronAPI.readFile(
      filePath + '/contour.txt',
    );
    if (!contourFileContent) {
      return;
    }
    const points = parseContourFile(contourFileContent);
    console.log(points.flat());
    setContourPoints(points.flat());
  }

  function parseContourFile(content) {
    const points = content.split('\n').map((point) => {
      const [x, y] = point.split(',');
      return [parseInt(x), parseInt(y)];
    });
    // Filter out NaN values
    const points_filtered = points.filter(
      (point) => !isNaN(point[0]) && !isNaN(point[1]),
    );
    return points_filtered;
  }

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (currentPath) {
        readMainImage(currentPath);
        readPropertyFile(currentPath);
        getContourPoints(currentPath);
      }
      return;
    }
  });

  return (
    <div>
      <div className="text-white font-bold ml-10 my-4">
        {currentPath || 'No directory selected'}
      </div>
      <div className="mx-10 w-full">
        <div className="mb-5 flex items-center">
          <Button title="Select Cover" big={true} onClick={openCoverImage} />
        </div>
      </div>
      <div className="mx-10">
        {mainImage && (
          <OverlayCoverImage
            mainImage={mainImage}
            coverImage={coverImage}
            contourPoints={contourPoints}
          />
        )}
      </div>
    </div>
  );
}

function OverlayCoverImage({ mainImage, coverImage, contourPoints }) {
  const [konvaMainImage] = useImage(mainImage);
  const [konvaCoverImage] = useImage(coverImage);

  const stageHeight = 700;
  const stageWidth = 900;
  const imageScale = Math.min(
    stageWidth / konvaMainImage?.naturalWidth,
    stageHeight / konvaMainImage?.naturalHeight,
  );

  const sizeTransformerRef = useRef(null);
  const coverImageRef = useRef(null);

  useEffect(() => {
    if (coverImageRef.current && sizeTransformerRef.current) {
      sizeTransformerRef.current.nodes([coverImageRef.current]);
      sizeTransformerRef.current.getLayer().batchDraw();
    }
  });

  return (
    <Stage width={stageHeight} height={stageWidth}>
      <Layer>
        {konvaMainImage && (
          <Image
            image={konvaMainImage}
            height={konvaMainImage?.naturalHeight * imageScale}
            width={konvaMainImage?.naturalWidth * imageScale}
          />
        )}
        <Line
          points={contourPoints}
          stroke="red"
          strokeWidth={4}
          scaleX={imageScale * 1.1811}
          scaleY={imageScale * 1.1811}
          closed
        />
        {konvaCoverImage && (
          <>
            <Image
              ref={coverImageRef}
              image={konvaCoverImage}
              height={konvaCoverImage?.naturalHeight * imageScale}
              width={konvaCoverImage?.naturalWidth * imageScale}
              opacity={0.5}
              draggable
            />
            <Transformer ref={sizeTransformerRef} />
          </>
        )}
      </Layer>
    </Stage>
  );
}
