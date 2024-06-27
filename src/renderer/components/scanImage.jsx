import Button from './buttons';

export default function ScanImage({ currentPath }) {
  async function scan() {
    await window.electronAPI.scanImage(currentPath + '/scan.png');
  }

  return (
    <div className="mt-10 mx-10 w-full">
      <Button title="Scan" onClick={scan} big />
    </div>
  );
}
