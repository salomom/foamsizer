import Button from "./buttons";
import { useState } from "react";

export default function InsertSize() {
  const [currentPath, setCurrentPath] = useState('')
  const [textAreaContent, setTextAreaContent] = useState('')

  async function openFolder() {
    const filePath = await window.electronAPI.openFolder()
    if (!filePath) {
      return
    }
    setCurrentPath(filePath)
    const fileContent = await window.electronAPI.openProperties(filePath)
    setTextAreaContent(fileContent)
  }

  async function saveProperties(event) {
    event.preventDefault()
    if (!currentPath) {
      alert('Please open a folder first')
      return
    }
    await window.electronAPI.saveProperties(currentPath, textAreaContent)
  }

  return (
    <div className="mt-10 ml-10 w-full">
      <div className="mb-5">
      <Button title="Open Folder" big={true} onClick={openFolder} />
    </div>
    <PropertiesTable content={textAreaContent} setContent={setTextAreaContent} saveProperties={saveProperties} />
    </div>

  );
}


function PropertiesTable({content, setContent, saveProperties}) {
  function handleChange(event) {
    setContent(event.target.value);
  };
  return (
    <div className="w-[30%]">
    <form>
      <textarea placeholder="name: xyz" className="rounded-md p-4 w-full" rows={20} value={content} onChange={handleChange} />
      <Button title="Save" onClick={saveProperties} />
      </form>
    </div>
  )
}
