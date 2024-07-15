import Button from './buttons';
import useImage from 'use-image';
import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image, Rect, Transformer } from 'react-konva';

export default function ScanImage({ currentPath, setCurrentPath }) {
  const [image, setImage] = useState('https://placehold.co/500x500');
  const [sizeRect, setSizeRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imgRotation, setImgRotation] = useState(0.0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [properties, setProperties] = useState({});
  const imgPath = currentPath + getCoverName();
  const [konvaImage, konvaImageStatus] = useImage(image);

  const basePath = 'C:/Users/timal/Desktop/foamsizer/';

  function getFolderName() {
    return currentPath.split('\\').at(-1);
  }

  function getCoverName() {
    return '/' + getFolderName() + '_cover.png';
  }

  async function coverImageExists() {
    if (!currentPath) {
      return false;
    }
    const exists = await window.electronAPI.fileExists(
      currentPath + '/cover.png',
    );
    return exists;
  }

  async function openCoverImage() {
    const imgBase64 = await window.electronAPI.openImage(
      currentPath + '/cover.png',
    );
    if (!imgBase64) {
      return;
    }
    setImage('data:image/jpg;base64,' + imgBase64);
  }

  async function cropImage() {
    const x = sizeRect.x < 0 ? 0 : sizeRect.x;
    const y = sizeRect.y < 0 ? 0 : sizeRect.y;
    const cropHeight = sizeRect.height;
    const cropWidth = sizeRect.width;
    window.electronAPI.cropImage(
      currentPath + '/cover.png',
      imgPath,
      x,
      y,
      cropWidth,
      cropHeight,
      imgRotation,
    );
    const height = heightInputRef.current.value;
    const width = widthInputRef.current.value;
    var propertiesObj = properties;
    if (height) {
      propertiesObj['height'] = height;
    }
    if (width) {
      propertiesObj['width'] = width;
    }
    if (propertiesObj.height && !propertiesObj.width) {
      propertiesObj.width = Math.round(
        (propertiesObj.height / cropHeight) * cropWidth,
      );
    }
    if (propertiesObj.width && !propertiesObj.height) {
      propertiesObj.height = Math.round(
        (propertiesObj.width / cropWidth) * cropHeight,
      );
    }
    await saveProperties(propertiesObj);
  }

  async function createNewDirectory() {
    // Creates a new directory with current timestamp
    const name = new Date()
      .toISOString()
      .replaceAll('-', '')
      .replaceAll('T', '-')
      .replaceAll(':', '')
      .split('.')[0]; // ex: 20240630-115751
    const newDir = await window.electronAPI.createDirectory(basePath + name);
    if (!newDir) {
      return;
    }
    setImage('https://placehold.co/500x500');
    setCurrentPath(newDir);
    await createPresetPropertiesFile(newDir);
    await readPropertyFile();
  }

  async function createPresetPropertiesFile(directory) {
    const content = await window.electronAPI.readFile(
      './templates/properties.txt',
    );
    if (!content) {
      return;
    }
    await window.electronAPI.writeFile(directory + '/properties.txt', content);
  }

  async function getImageFromUrl(url) {
    setImageModalOpen(false);
    await window.electronAPI.downloadFile(url, currentPath + '/cover.png');
    openCoverImage();
  }

  async function readPropertyFile() {
    const fileContent = await window.electronAPI.readFile(
      currentPath + '/properties.txt',
    );
    if (!fileContent) {
      setProperties({});
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

  async function saveProperties(propertiesObj) {
    if (!currentPath) {
      alert('Please open a folder first');
      return;
    }
    let propertiesString = '';
    for (const [key, value] of Object.entries(propertiesObj)) {
      propertiesString += `${key}: ${value}\n`;
    }
    await window.electronAPI.writeFile(
      currentPath + '/properties.txt',
      propertiesString,
    );
  }
  async function makeTransparent() {
    const inputPath = currentPath + '/cover.png';
    const outputPath = currentPath + '/cover.png';
    window.electronAPI.removeBackground(inputPath, outputPath);
  }

  const firstRender = useRef(true);
  const heightInputRef = useRef(null);
  const widthInputRef = useRef(null);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      coverImageExists().then((exists) => {
        if (exists) {
          openCoverImage();
        }
      });
      if (currentPath) {
        readPropertyFile();
      }
      return;
    }
  });

  return (
    <div>
      {imageModalOpen && (
        <GetImageModal
          closeFunc={() => setImageModalOpen(false)}
          submitFunc={getImageFromUrl}
        />
      )}
      <div className="text-white font-bold ml-10 my-4">
        {currentPath || 'No directory selected'}
      </div>
      <div className="mx-10 w-full">
        <div className="flex">
          <Button title="Create Directory" onClick={createNewDirectory} big />
          <Button
            title="Get Cover Image"
            onClick={() => {
              setImageModalOpen(true);
            }}
            big
          />
          <Button title="Make Transparent" onClick={makeTransparent} big />
          <Button title="Crop" onClick={cropImage} big />
          <div>
            <label className="block text-white font-bold my-2">Rotation</label>
            <input
              type="number"
              min="-180"
              max="180"
              step={0.1}
              value={imgRotation}
              onChange={(e) => setImgRotation(parseFloat(e.target.value))}
              className="pl-2 h-10 rounded-md font-bold"
            />
          </div>
          <div className="ml-3">
            <label className="block text-white font-bold my-2">Height</label>
            <input
              type="number"
              min="0"
              className="pl-2 h-10 rounded-md font-bold"
              ref={heightInputRef}
            />
          </div>
          <div className="ml-3">
            <label className="block text-white font-bold my-2">Width</label>
            <input
              type="number"
              min="0"
              className="pl-2 h-10 rounded-md font-bold"
              ref={widthInputRef}
            />
          </div>
        </div>
        {!imageModalOpen && (
          <ImageCrop
            image={image}
            rotation={imgRotation}
            setSizeRect={setSizeRect}
            konvaImage={konvaImage}
            konvaImageStatus={konvaImageStatus}
          />
        )}
      </div>
    </div>
  );
}

function ImageCrop({
  image,
  rotation,
  setSizeRect,
  konvaImage,
  konvaImageStatus,
}) {
  const sizeRect = useRef(null);
  const sizeTransformer = useRef(null);

  let imgSize = [100, 100];
  const stageHeight = 800;
  const stageWidth = 800;
  let scale = 1;
  if (konvaImageStatus === 'loaded') {
    imgSize = [konvaImage.naturalWidth, konvaImage.naturalHeight];
    scale = Math.min(stageHeight / imgSize[0], stageWidth / imgSize[1]);
  }
  const [offsetX, offsetY] = getOffset(imgSize, rotation);

  useEffect(() => {
    if (sizeRect.current && sizeTransformer.current) {
      sizeTransformer.current.nodes([sizeRect.current]);
      sizeTransformer.current.getLayer().batchDraw();
    }
  });

  return (
    <div className="mt-4">
      {image && (
        <Stage
          width={stageWidth}
          height={stageHeight}
          scaleX={scale}
          scaleY={scale}
        >
          <Layer>
            <Image
              image={konvaImage}
              rotation={rotation}
              x={offsetX}
              y={offsetY}
            />
          </Layer>
          <Layer>
            <Rect
              x={0}
              y={0}
              ref={sizeRect}
              width={508}
              height={699}
              stroke="black"
              strokeWidth={0}
              draggable
              onDragEnd={(e) => {
                if (e.target.x() < 0) e.target.x(0);
                if (e.target.y() < 0) e.target.y(0);
                setSizeRect({
                  x: parseInt(e.target.x()),
                  y: parseInt(e.target.y()),
                  width: parseInt(e.target.width()),
                  height: parseInt(e.target.height()),
                });
              }}
              onTransformEnd={(e) => {
                const node = sizeRect.current;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                node.scaleX(1);
                node.scaleY(1);
                setSizeRect({
                  x: parseInt(node.x()),
                  y: parseInt(node.y()),
                  width: parseInt(node.width() * scaleX),
                  height: parseInt(node.height() * scaleY),
                });
                e.target.width(node.width() * scaleX);
                e.target.height(node.height() * scaleY);
              }}
            />
            <Transformer
              ref={sizeTransformer}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}

function getOffset(imgSize, rotation) {
  var offsetX = 0;
  var offsetY = 0;
  if (rotation >= -90 && rotation <= 90) {
    offsetX = Math.max(
      Math.round(Math.cos(((90 - rotation) / 180) * Math.PI) * imgSize[1]),
      0,
    );
    offsetY = Math.max(
      Math.round(Math.cos(((-90 - rotation) / 180) * Math.PI) * imgSize[0]),
      0,
    );
  } else if (rotation > 90) {
    offsetX = Math.max(
      Math.round(
        Math.sin(((rotation - 90) / 180) * Math.PI) * imgSize[0] +
          Math.cos(((rotation - 90) / 180) * Math.PI) * imgSize[1],
      ),
      0,
    );
    offsetY = Math.max(
      Math.round(Math.sin(((rotation - 90) / 180) * Math.PI) * imgSize[1]),
      0,
    );
  } else {
    offsetX = Math.max(
      Math.round(-Math.sin(((90 + rotation) / 180) * Math.PI) * imgSize[0]),
      0,
    );
    offsetY = Math.max(
      Math.round(
        -Math.sin(((90 + rotation) / 180) * Math.PI) * imgSize[1] +
          Math.cos(((90 + rotation) / 180) * Math.PI) * imgSize[0],
      ),
      0,
    );
  }
  return [offsetX, offsetY];
}

function GetImageModal({ closeFunc, submitFunc }) {
  const urlInput = useRef(null);
  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white w-96 h-96 rounded-md">
        <div className="text-center text-lg font-bold">Select Image</div>
        <div className="mx-2 my-2">
          <label>
            URL:
            <input type="text" className="border w-full" ref={urlInput} />
          </label>
        </div>
        <div className="mx-2 my-2 flex">
          <Button
            title="Get Image"
            onClick={() => submitFunc(urlInput.current.value)}
          />
          <Button title="Close" onClick={closeFunc} />
        </div>
      </div>
    </div>
  );
}
