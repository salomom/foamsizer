import Button from './buttons';
import useImage from 'use-image';
import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image, Rect, Transformer } from 'react-konva';

export default function ScanImage({ currentPath, setCurrentPath }) {
  const [image, setImage] = useState('https://placehold.co/500x500');
  const [sizeRect, setSizeRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imgRotation, setImgRotation] = useState(0.0);
  const imgPath = currentPath + '/scan.png';

  const basePath = 'C:/Users/timal/Desktop/foamsizer/';

  async function scan() {
    if (await scanImageExists()) {
      await window.electronAPI.deleteFile(imgPath);
    }
    await window.electronAPI.scanImage(imgPath);
    openScanImage();
  }

  async function scanImageExists() {
    const exists = await window.electronAPI.fileExists(imgPath);
    return exists;
  }

  async function openScanImage() {
    const imgBase64 = await window.electronAPI.openImage(imgPath);
    if (!imgBase64) {
      return;
    }
    setImage('data:image/jpg;base64,' + imgBase64);
  }

  async function cropImage() {
    await window.electronAPI.cropImage(
      imgPath,
      currentPath + '/main.png',
      sizeRect.x,
      sizeRect.y,
      sizeRect.width,
      sizeRect.height,
      imgRotation,
    );
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

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (scanImageExists()) {
        openScanImage();
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
        <div className="flex">
          <Button title="Create Directory" onClick={createNewDirectory} big />
          <Button title="Scan" onClick={scan} big />
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
        </div>
        <ImageCrop
          image={image}
          rotation={imgRotation}
          setSizeRect={setSizeRect}
        />
      </div>
    </div>
  );
}

function ImageCrop({ image, rotation, setSizeRect }) {
  const [konvaImage] = useImage(image);
  const sizeRect = useRef(null);
  const sizeTransformer = useRef(null);

  const imgSize = [508, 699];
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
        <Stage width={864} height={864} scaleX={0.2} scaleY={0.2}>
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
      parseInt(Math.cos(((90 - rotation) / 180) * Math.PI) * imgSize[1] * 5),
      0,
    );
    offsetY = Math.max(
      parseInt(Math.cos(((-90 - rotation) / 180) * Math.PI) * imgSize[0] * 5),
      0,
    );
  } else if (rotation > 90) {
    offsetX = Math.max(
      parseInt(
        Math.sin(((rotation - 90) / 180) * Math.PI) * imgSize[0] * 5 +
          Math.cos(((rotation - 90) / 180) * Math.PI) * imgSize[1] * 5,
      ),
      0,
    );
    offsetY = Math.max(
      parseInt(Math.sin(((rotation - 90) / 180) * Math.PI) * imgSize[1] * 5),
      0,
    );
  } else {
    offsetX = Math.max(
      parseInt(-Math.sin(((90 + rotation) / 180) * Math.PI) * imgSize[0] * 5),
      0,
    );
    offsetY = Math.max(
      parseInt(
        -Math.sin(((90 + rotation) / 180) * Math.PI) * imgSize[1] * 5 +
          Math.cos(((90 + rotation) / 180) * Math.PI) * imgSize[0] * 5,
      ),
      0,
    );
  }
  return [offsetX, offsetY];
}
