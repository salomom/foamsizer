import Button from './buttons';
import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import useImage from 'use-image';

export default function EditTools({ currentPath, setCurrentPath }) {
  const [coverImage, setCoverImage] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [properties, setProperties] = useState('');

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

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (currentPath) {
        readMainImage(currentPath);
        readPropertyFile(currentPath);
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
        <OverlayCoverImage mainImage={mainImage} coverImage={coverImage} />
      </div>
    </div>
  );
}

function OverlayCoverImage({ mainImage, coverImage }) {
  const [konvaMainImage] = useImage(mainImage);
  const [konvaCoverImage] = useImage(coverImage);

  const stageHeight = 700;
  const stageWidth = 900;
  const imageScale = Math.min(
    stageWidth / konvaMainImage?.naturalWidth,
    stageHeight / konvaMainImage?.naturalHeight,
  );

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
        {konvaCoverImage && (
          <Image
            image={konvaCoverImage}
            height={konvaCoverImage?.naturalHeight * imageScale}
            width={konvaCoverImage?.naturalWidth * imageScale}
            opacity={0.5}
            draggable
          />
        )}
      </Layer>
    </Stage>
  );
}
