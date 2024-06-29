import Button from './buttons';
import useImage from 'use-image';
import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image, Rect, Transformer } from 'react-konva';

export default function ScanImage({ currentPath }) {
  const [image, setImage] = useState('https://placehold.co/500x500');
  const [sizeRect, setSizeRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const imgPath = currentPath + '/scan.png';

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
    console.log(sizeRect);
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
    <div className="mt-10 mx-10 w-full">
      <div className="flex">
        <Button title="Scan" onClick={scan} big />
        <Button title="Crop" onClick={cropImage} big />
      </div>
      <ImageCrop image={image} setSizeRect={setSizeRect} />
    </div>
  );
}

function ImageCrop({ image, setSizeRect }) {
  const [konvaImage] = useImage(image);
  const sizeRect = useRef(null);
  const sizeTransformer = useRef(null);

  useEffect(() => {
    if (sizeRect.current && sizeTransformer.current) {
      sizeTransformer.current.nodes([sizeRect.current]);
      sizeTransformer.current.getLayer().batchDraw();
    }
  });

  return (
    <div className="mt-4">
      {image && (
        <Stage width={508} height={699} scaleX={0.2} scaleY={0.2}>
          <Layer>
            <Image image={konvaImage} />
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
