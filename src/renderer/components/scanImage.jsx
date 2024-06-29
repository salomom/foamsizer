import Button from './buttons';
import useImage from 'use-image';
import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image } from 'react-konva';

export default function ScanImage({ currentPath }) {
  const [image, setImage] = useState('https://placehold.co/500x500');
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
      <Button title="Scan" onClick={scan} big />
      <ImageCrop image={image} />
    </div>
  );
}

function ImageCrop({ image }) {
  const [konvaImage] = useImage(image);
  return (
    <div>
      {image && (
        <Stage width={700} height={700}>
          <Layer>
            <Image image={konvaImage} />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
