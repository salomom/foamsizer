import Button from './buttons';
import ContourAdjuster from './contouradjustment';
import { useState } from 'react';

export default function InsertSize() {
  const [currentPath, setCurrentPath] = useState('');
  const [textAreaContent, setTextAreaContent] = useState('');
  const [mainImage, setMainImage] = useState('');

  async function openFolder() {
    const filePath = await window.electronAPI.openFolder();
    if (!filePath) {
      return;
    }
    setCurrentPath(filePath);
    const fileContent = await window.electronAPI.openProperties(filePath);
    if (!fileContent) {
      setTextAreaContent('');
    } else {
      setTextAreaContent(fileContent);
    }
    const imgPath = filePath + '/main.jpeg';
    const imgBase64 = await window.electronAPI.openImage(imgPath);
    if (!imgBase64) {
      setMainImage('');
      return;
    }
    setMainImage(imgBase64);
  }

  async function saveProperties(event) {
    event.preventDefault();
    if (!currentPath) {
      alert('Please open a folder first');
      return;
    }
    await window.electronAPI.saveProperties(currentPath, textAreaContent);
  }

  return (
    <div className="mt-10 mx-10 w-full">
      <div className="mb-5">
        <Button title="Open Folder" big={true} onClick={openFolder} />
      </div>
      <div className="flex">
        <ContourAdjuster image={mainImage} />
        <PropertiesTable
          content={textAreaContent}
          setContent={setTextAreaContent}
          saveProperties={saveProperties}
        />
      </div>
    </div>
  );
}

function PropertiesTable({ content, setContent, saveProperties }) {
  function handleChange(event) {
    setContent(event.target.value);
  }
  return (
    <div className="w-[30%]">
      <form>
        <textarea
          placeholder="name: xyz"
          className="rounded-md p-4 w-full"
          rows={20}
          value={content}
          onChange={handleChange}
        />
        <Button title="Save" onClick={saveProperties} />
      </form>
    </div>
  );
}

function MainImage({ image }) {
  image = image
    ? 'data:image/jpg;base64,' + image
    : 'https://placehold.co/500x500';
  return (
    <div className="w-[70%] h-[80%] bg-slate-700 mr-20 rounded-md">
      <div className="max-w-80 max-h-80 h-auto">
        <img
          src={image}
          alt="main"
          className="w-full h-full object-contain max-w-80 max-h-80"
        />
      </div>
    </div>
  );
}
