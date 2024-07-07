import Button from './buttons';
import ContourAdjuster from './contouradjustment';
import { useState, useRef, useEffect } from 'react';

export default function InsertSize({ currentPath, setCurrentPath }) {
  const [textAreaContent, setTextAreaContent] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [contourPoints, setContourPoints] = useState([]);

  const imgPath = currentPath + '/main.png';

  async function openFolder() {
    const filePath = await window.electronAPI.openFolder();
    if (!filePath) {
      return;
    }
    setCurrentPath(filePath);
    updateFolderContent(filePath);
  }

  async function updateFolderContent(filePath) {
    readPropertyFile(filePath);
    readMainImage(filePath);
  }

  async function readPropertyFile(filePath) {
    const fileContent = await window.electronAPI.readFile(
      filePath + '/properties.txt',
    );
    if (!fileContent) {
      setTextAreaContent('');
    } else {
      setTextAreaContent(fileContent);
    }
  }

  async function readMainImage(filePath) {
    const imgBase64 = await window.electronAPI.openImage(imgPath);
    if (!imgBase64) {
      setMainImage('');
      return;
    }
    setMainImage(imgBase64);
  }

  async function analyzeImage() {
    const points = await window.electronAPI.analyzeImage(imgPath);
    var adjusted_points = [];
    points.forEach((point) => {
      adjusted_points.push([point[0] / 1.1811, point[1] / 1.1811]);
    });
    return adjusted_points;
  }

  async function getContourPoints(filePath) {
    const contourFileContent = await window.electronAPI.readFile(
      filePath + '/contour.txt',
    );
    if (!contourFileContent) {
      const points = await analyzeImage();
      return points;
    }
    return parseContourFile(contourFileContent);
  }

  async function getShapes(filePath) {
    const shapesFileContent = await window.electronAPI.readFile(
      filePath + '/shapes.txt',
    );
    if (!shapesFileContent) {
      return [];
    }
    return JSON.parse(shapesFileContent);
  }

  async function saveProperties(event) {
    event.preventDefault();
    if (!currentPath) {
      alert('Please open a folder first');
      return;
    }
    await window.electronAPI.writeFile(
      currentPath + '/properties.txt',
      textAreaContent,
    );
  }

  async function saveShapes(shapes) {
    await window.electronAPI.writeFile(currentPath + '/shapes.txt', shapes);
  }

  async function saveContourPoints(points) {
    await window.electronAPI.writeFile(currentPath + '/contour.txt', points);
    fitContour();
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

  async function fitContour() {
    await window.electronAPI.contourFitting(currentPath);
  }

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (currentPath) {
        updateFolderContent(currentPath);
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
        <div className="mb-5 flex">
          <Button title="Open Folder" big={true} onClick={openFolder} />
        </div>
        <div className="flex">
          <ContourAdjuster
            image={mainImage}
            getContourPoints={() => getContourPoints(currentPath)}
            getShapes={() => getShapes(currentPath)}
            saveShapes={saveShapes}
            saveContourPoints={saveContourPoints}
          />
          <PropertiesTable
            content={textAreaContent}
            setContent={setTextAreaContent}
            saveProperties={saveProperties}
          />
        </div>
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
