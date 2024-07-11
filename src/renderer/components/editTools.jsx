import Button from './buttons';
import { useState } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import useImage from 'use-image';

export default function EditTools({ currentPath, setCurrentPath }) {
  const [coverImage, setCoverImage] = useState('');

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
        {coverImage && <OverlayCoverImage coverImage={coverImage} />}
      </div>
    </div>
  );
}

function OverlayCoverImage({ coverImage }) {
  const [konvaImage] = useImage(coverImage);
  return (
    <Stage width={500} height={500}>
      <Layer>
        <Image image={konvaImage} height={500} width={500} />
      </Layer>
    </Stage>
  );
}
