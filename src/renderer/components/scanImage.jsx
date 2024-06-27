import Button from './buttons';
import useImage from 'use-image';
import { useEffect, useState } from 'react';
import { Stage, Layer, Image } from 'react-konva';

export default function ScanImage({ currentPath }) {
  const [image, setImage] = useState('https://placehold.co/500x500');

  async function scan() {
    const imgPath = currentPath + '/scan.png';
    await window.electronAPI.scanImage(imgPath);
    const imgBase64 = await window.electronAPI.openImage(imgPath);
    if (!imgBase64) {
      return;
    }
    setImage('data:image/jpg;base64,' + imgBase64);
  }

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
