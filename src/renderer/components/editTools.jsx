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
    const [fullHeight, fullWidth] = getRotatedSize(
      coverImg.height() * coverImg.scaleY(),
      coverImg.width() * coverImg.scaleX(),
      coverImg.rotation(),
    );
    const size = {
      width: Math.round(fullWidth / imageScale),
      height: Math.round(fullHeight / imageScale),
      rotation: Math.round(coverImg.rotation()),
    };
    const [offX, offY] = getOffset(
      [
        coverImg.width() * coverImg.scaleX(),
        coverImg.height() * coverImg.scaleY(),
      ],
      coverImg.rotation(),
    );
    const adjX = coverImg.x() - offX;
    const adjY = coverImg.y() - offY;
    const crop = {
      left: Math.round(-adjX / imageScale),
      top: Math.round(-adjY / imageScale),
      width: konvaMainImage.naturalWidth,
      height: konvaMainImage.naturalHeight,
    };
    const extend = {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    };
    if (crop['left'] < 0) {
      extend['left'] = Math.abs(crop['left']);
      crop['left'] = 0;
    }
    if (crop['top'] < 0) {
      extend['top'] = Math.abs(crop['top']);
      crop['top'] = 0;
    }
    if (crop['left'] + crop['width'] > size['width']) {
      extend['right'] =
        crop['left'] + crop['width'] - size['width'] - extend['left'];
    }
    if (crop['top'] + crop['height'] > size['height']) {
      extend['bottom'] =
        crop['top'] + crop['height'] - size['height'] - extend['top'];
    }
    await window.electronAPI.convertCoverImage(
      coverImagePath,
      newCoverPath,
      size,
      extend,
      crop,
    );
  }

  function getFolderName() {
    return currentPath.split('\\').at(-1);
  }

  async function findEntryInDB() {
    const query = { internalId: getFolderName() };
    const result = await window.electronAPI.dbFindOne(query);
    if (result) {
      setExistsInDb(true);
      return true;
    } else {
      setExistsInDb(false);
      return false;
    }
  }

  async function uploadImage() {
    window.electronAPI.uploadImage(currentPath + '/main.png');
  }

  async function uploadAll() {
    // Upload cover image to s3 and properties to db
    if (!currentPath) {
      alert('Please open a folder first');
      return;
    }
    const folderName = getFolderName();
    const coverName = '/' + folderName + '_cover.png';
    const coverPath = currentPath + coverName;
    // Check if cover image exists
    const coverExists = await window.electronAPI.fileExists(coverPath);
    if (coverExists) {
      alert('Cover image does not exist');
      return;
    }
    // Check if properties exist in db
    let exists = existsInDb;
    if (existsInDb === null) {
      exists = await findEntryInDB();
    }
    // Upload to db
    const query = { ...properties, internalId: folderName };
    if (!exists) {
      window.electronAPI.dbInsertOne(query);
    } else {
      const search = { internalId: folderName };
      window.electronAPI.dbReplaceOne(search, query);
    }
    // Upload cover image to s3
    window.electronAPI.uploadImage(coverPath);
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
          <Button title="Upload" big={true} onClick={uploadImage} />
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

function rad2deg(rad) {
  return rad * (180 / Math.PI);
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function getOffset(imgSize, rotation) {
  var offsetX = 0;
  var offsetY = 0;
  if (rotation >= -90 && rotation <= 90) {
    offsetX = Math.max(
      Math.round(Math.cos(deg2rad(90 - rotation)) * imgSize[1]),
      0,
    );
    offsetY = Math.max(
      Math.round(Math.cos(deg2rad(-90 - rotation)) * imgSize[0]),
      0,
    );
  } else if (rotation > 90) {
    offsetX = Math.max(
      Math.round(
        Math.sin(deg2rad(rotation - 90)) * imgSize[0] +
          Math.cos(deg2rad(rotation - 90)) * imgSize[1],
      ),
      0,
    );
    offsetY = Math.max(
      Math.round(Math.sin(deg2rad(rotation - 90)) * imgSize[1]),
      0,
    );
  } else {
    offsetX = Math.max(
      Math.round(-Math.sin(deg2rad(90 + rotation)) * imgSize[0]),
      0,
    );
    offsetY = Math.max(
      Math.round(
        -Math.sin(deg2rad(90 + rotation)) * imgSize[1] +
          Math.cos(deg2rad(90 + rotation)) * imgSize[0],
      ),
      0,
    );
  }
  return [offsetX, offsetY];
}

function getRotatedSize(height, width, angle) {
  if (angle < 0) {
    angle = 360 + angle;
  }
  const hypotenuse = Math.sqrt((height / 2) ** 2 + (width / 2) ** 2);
  const angleOffsetX = rad2deg(Math.asin(width / 2 / hypotenuse));
  const angleOffsetY = angleOffsetX - 90;
  const offsetX = Math.sin(deg2rad(-angleOffsetX)) * hypotenuse;
  const offsetY = Math.sin(deg2rad(angleOffsetY)) * hypotenuse;
  const fullWidth = Math.max(
    Math.abs(Math.sin(deg2rad(angle - angleOffsetX)) * hypotenuse * 2),
    Math.abs(Math.sin(deg2rad(angle + angleOffsetX)) * hypotenuse * 2),
  );
  const fullHeight = Math.max(
    Math.abs(Math.sin(deg2rad(-angle + angleOffsetY)) * hypotenuse * 2),
    Math.abs(Math.sin(deg2rad(-angle - angleOffsetY)) * hypotenuse * 2),
  );
  return [fullHeight, fullWidth];
}
