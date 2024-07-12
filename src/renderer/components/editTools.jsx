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
  const [existsInDb, setExistsInDb] = useState(null);

  const [konvaMainImage, konvaMainImageStatus] = useImage(mainImage);
  const [konvaCoverImage, konvaCoverImageStatus] = useImage(coverImage);

  const coverImageRef = useRef(null);

  const stageHeight = 700;
  const stageWidth = 900;
  const imageScale = Math.min(
    stageWidth / konvaMainImage?.naturalWidth,
    stageHeight / konvaMainImage?.naturalHeight,
  );

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
    if (!currentPath || !coverImageRef.current) {
      alert('Please open a folder first');
      return;
    }
    const folderName = getFolderName();
    const coverName = '/' + folderName + '_cover.png';
    const newCoverPath = currentPath + coverName;
    const coverImg = coverImageRef.current;
    await window.electronAPI.resizeImage(
      coverImagePath,
      currentPath + '/resized.png',
      parseInt((coverImg.width() * coverImg.scaleX()) / imageScale),
      parseInt((coverImg.height() * coverImg.scaleY()) / imageScale),
      parseInt(coverImg.rotation()),
    );
    setTimeout(() => {
      // Idk why this only works with a delay
      window.electronAPI.cropImage(
        currentPath + '/resized.png',
        newCoverPath,
        parseInt(-coverImg.x() / imageScale),
        parseInt(-coverImg.y() / imageScale),
        konvaMainImage.naturalWidth,
        konvaMainImage.naturalHeight,
        0,
      );
    }, 100);
  }

  function getFolderName() {
    return currentPath.split('\\').at(-1);
  }

  async function findEntryInDB() {
    const query = { internalId: getFolderName() };
    const result = await window.electronAPI.dbFindOne(query);
    if (result) {
      setExistsInDb(true);
    } else {
      setExistsInDb(false);
    }
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
        {existsInDb !== null &&
          (existsInDb ? (
            <span className="text-green-500"> - Exists in DB</span>
          ) : (
            <span className="text-red-500"> - Not in DB</span>
          ))}
      </div>
      <div className="mx-10 w-full">
        <div className="mb-5 flex items-center">
          <Button title="Select Cover" big={true} onClick={openCoverImage} />
          <Button title="Save Cover" big={true} onClick={saveCoverImage} />
          <Button title="Check Exist" big={true} onClick={findEntryInDB} />
        </div>
      </div>
      <div className="mx-10">
        <div className="flex justify-center">
          {konvaMainImageStatus === 'loaded' && (
            <OverlayCoverImage
              mainImage={konvaMainImage}
              coverImage={konvaCoverImage}
              contourPoints={contourPoints}
              coverImageRef={coverImageRef}
              stageWidth={stageWidth}
              stageHeight={stageHeight}
              imageScale={imageScale}
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
  coverImage,
  contourPoints,
  coverImageRef,
  stageWidth,
  stageHeight,
  imageScale,
}) {
  const sizeTransformerRef = useRef(null);

  useEffect(() => {
    if (coverImageRef.current && sizeTransformerRef.current) {
      sizeTransformerRef.current.nodes([coverImageRef.current]);
      sizeTransformerRef.current.getLayer().batchDraw();
    }
  });

  return (
    <Stage width={stageHeight} height={stageWidth}>
      <Layer>
        {mainImage && (
          <>
            <Image
              image={mainImage}
              height={mainImage?.naturalHeight * imageScale}
              width={mainImage?.naturalWidth * imageScale}
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
        {coverImage && (
          <>
            <Image
              ref={coverImageRef}
              image={coverImage}
              height={coverImage?.naturalHeight * imageScale}
              width={coverImage?.naturalWidth * imageScale}
              opacity={0.7}
              draggable
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
