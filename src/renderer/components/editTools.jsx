import { useEffect, useRef, useState } from 'react';
import { Image, Layer, Line, Stage, Transformer } from 'react-konva';
import useImage from 'use-image';
import Button from './buttons';

export default function EditTools({ currentPath, setCurrentPath }) {
  const [coverImage, setCoverImage] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [properties, setProperties] = useState('');
  const [contourPoints, setContourPoints] = useState([]);
  const [coverImagePath, setCoverImagePath] = useState('');
  const [coverImageProps, setCoverImageProps] = useState(null);
  const [mainImageProps, setMainImageProps] = useState(null);

  async function openFile() {
    const filePath = await window.electronAPI.openFile();
    if (!filePath) {
      return;
    }
    return filePath;
  }

  async function readCoverImage(filePath) {
    const imgBase64 = await window.electronAPI.openImage(filePath);
    setCoverImagePath(filePath);
    if (!imgBase64) {
      setCoverImage('');
      return;
    }
    setCoverImage('data:image/jpg;base64,' + imgBase64);
    setCoverImageProps(null);
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

  async function saveCoverImage() {
    if (!currentPath) {
      alert('Please open a folder first');
      return;
    }
    const folderName = currentPath.split('\\').at(-1);
    const coverName = '/' + folderName + '.png';
    const newCoverPath = currentPath + coverName;
    await window.electronAPI.resizeImage(
      coverImagePath,
      newCoverPath,
      parseInt(coverImageProps.width),
      parseInt(coverImageProps.height),
      parseInt(coverImageProps.rotation),
    );
  }

  async function cropCoverImage() {
    if (!currentPath) {
      alert('Please open a folder first');
      return;
    }
    const folderName = currentPath.split('\\').at(-1);
    const coverName = '/' + folderName + '.png';
    const newCoverPath = currentPath + coverName;
    await window.electronAPI.cropImage(
      newCoverPath,
      currentPath + '/sus.png',
      parseInt(-coverImageProps.x),
      parseInt(-coverImageProps.y),
      mainImageProps.width,
      mainImageProps.height,
      0,
    );
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
          <Button title="Save Cover" big={true} onClick={saveCoverImage} />
          <Button title="Crop Cover" big={true} onClick={cropCoverImage} />
        </div>
      </div>
      <div className="mx-10">
        <div className="flex justify-center">
          {mainImage && (
            <OverlayCoverImage
              mainImage={mainImage}
              mainImageProps={mainImageProps}
              setMainImageProps={setMainImageProps}
              coverImage={coverImage}
              coverImageProps={coverImageProps}
              setCoverImageProps={setCoverImageProps}
              contourPoints={contourPoints}
            />
          )}
          {properties && <PropertiesTable properties={properties} />}
        </div>
      </div>
    </div>
  );
}

function OverlayCoverImage({
  mainImage,
  mainImageProps,
  setMainImageProps,
  coverImage,
  coverImageProps,
  setCoverImageProps,
  contourPoints,
}) {
  const [konvaMainImage, konvaMainImageStatus] = useImage(mainImage);
  const [konvaCoverImage, konvaCoverImageStatus] = useImage(coverImage);

  const stageHeight = 700;
  const stageWidth = 900;
  const imageScale = Math.min(
    stageWidth / konvaMainImage?.naturalWidth,
    stageHeight / konvaMainImage?.naturalHeight,
  );

  const sizeTransformerRef = useRef(null);
  const coverImageRef = useRef(null);

  useEffect(() => {
    if (!coverImageProps && konvaCoverImageStatus === 'loaded') {
      const props = {
        x: 0,
        y: 0,
        width: konvaCoverImage.naturalWidth,
        height: konvaCoverImage.naturalHeight,
        rotation: 0,
      };
      setCoverImageProps(props);
    }
  }, [konvaCoverImageStatus]);

  useEffect(() => {
    if (!mainImageProps && konvaMainImageStatus === 'loaded') {
      const props = {
        x: 0,
        y: 0,
        width: konvaMainImage.naturalWidth,
        height: konvaMainImage.naturalHeight,
        rotation: 0,
      };
      setMainImageProps(props);
    }
  }, [konvaMainImageStatus]);

  useEffect(() => {
    if (coverImageRef.current && sizeTransformerRef.current) {
      sizeTransformerRef.current.nodes([coverImageRef.current]);
      sizeTransformerRef.current.getLayer().batchDraw();
    }
  });

  return (
    <Stage width={stageHeight} height={stageWidth}>
      <Layer>
        {konvaMainImage && mainImageProps && (
          <>
            <Image
              image={konvaMainImage}
              x={mainImageProps.x}
              y={mainImageProps.y}
              height={mainImageProps.height * imageScale}
              width={mainImageProps.width * imageScale}
            />
            <Line
              points={contourPoints}
              stroke="red"
              strokeWidth={4}
              scaleX={imageScale * 1.1811}
              scaleY={imageScale * 1.1811}
              closed
            />
          </>
        )}
        {konvaCoverImage && coverImageProps && (
          <>
            <Image
              ref={coverImageRef}
              image={konvaCoverImage}
              x={coverImageProps?.x}
              y={coverImageProps?.y}
              height={coverImageProps?.height * imageScale}
              width={coverImageProps?.width * imageScale}
              rotation={coverImageProps?.rotation}
              opacity={0.7}
              draggable
              onDragEnd={(e) => {
                const node = coverImageRef.current;
                setCoverImageProps({
                  ...coverImageProps,
                  x: node.x(),
                  y: node.y(),
                });
              }}
              onTransformEnd={(e) => {
                const node = coverImageRef.current;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                setCoverImageProps({
                  ...coverImageProps,
                  x: node.x(),
                  y: node.y(),
                  rotation: node.rotation(),
                  width: parseInt((node.width() * scaleX) / imageScale),
                  height: parseInt((node.height() * scaleY) / imageScale),
                });
              }}
            />
            <Transformer
              ref={sizeTransformerRef}
              rotationSnaps={[0, 90, 180, 270]}
            />
          </>
        )}
      </Layer>
    </Stage>
  );
}

function PropertiesTable({ properties }) {
  return (
    <div className="w-1/2">
      <table className="table-auto">
        <tbody>
          {Object.entries(properties).map(([key, value]) => (
            <tr key={key} className="text-white">
              <td className="border px-4 py-2">{key}</td>
              <td className="border px-4 py-2">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
