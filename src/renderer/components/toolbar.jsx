import {
  FaArrowRotateLeft,
  FaArrowRotateRight,
  FaBorderAll,
  FaCrosshairs,
  FaDrawPolygon,
  FaFloppyDisk,
  FaRegCircle,
  FaRegSquare,
  FaSlash,
  FaT,
  FaTrash,
  FaUpload,
} from 'react-icons/fa6';

export default function ButtonBar({
  remove,
  submit,
  createRect,
  createCircle,
  createText,
  selectedTool,
  setPosition,
  setSize,
  setDepth,
  createPoint,
  createPointActive,
}) {
  return (
    <div>
      <div className="bg-indigo-800 w-full flex flex-row">
        <ToolButton
          text="Speichern und beenden"
          icon={<FaFloppyDisk className="inline-block mb-1 mr-3" />}
          clickFunction={submit}
          bgcolor="bg-indigo-700 hover:bg-indigo-600"
        />
        <ToolButton
          icon={<FaTrash className="m-auto" />}
          clickFunction={remove}
          tooltip="Löschen"
        />
        <div className="w-12"></div>
        <ToolButton
          icon={<FaRegSquare className="m-auto" />}
          clickFunction={createRect}
          tooltip="Rechteck"
        />
        <ToolButton
          icon={<FaRegCircle className="m-auto" />}
          clickFunction={createCircle}
          tooltip="Kreis"
        />
        <ToolButton
          icon={<FaT className="m-auto" />}
          clickFunction={createText}
          tooltip="Text"
        />
        <ToolButton
          icon={<FaCrosshairs className="m-auto" />}
          clickFunction={createPoint}
          active={createPointActive}
          tooltip="Create Point"
        />
      </div>
      <div className="w-full flex flex-row h-12 bg-indigo-800">
        {selectedTool?.key === undefined ? (
          <></>
        ) : (
          <>
            <InputField
              label="X:"
              value={selectedTool?.x}
              setValue={(x) => {
                setPosition(selectedTool.key, { x: x, y: selectedTool.y });
              }}
              disabled={true}
            />
            <InputField
              label="Y:"
              value={selectedTool?.y}
              setValue={(y) => {
                setPosition(selectedTool.key, { x: selectedTool.x, y: y });
              }}
              disabled={true}
            />
            {selectedTool?.type !== 'circle' ? (
              <>
                <InputField
                  label="Höhe:"
                  value={selectedTool?.height}
                  setValue={(height) => {
                    setSize(height, selectedTool.width, selectedTool.rotation);
                  }}
                />
                <InputField
                  label="Breite:"
                  value={selectedTool?.width}
                  setValue={(width) => {
                    setSize(selectedTool.height, width, selectedTool.rotation);
                  }}
                />
              </>
            ) : (
              <InputField
                label="Durchmesser:"
                value={selectedTool?.width}
                setValue={(height) => {
                  setSize(height, height, 0);
                }}
              />
            )}
            <InputField
              label="Tiefe:"
              value={selectedTool?.depth}
              setValue={setDepth}
            />
            {selectedTool?.type !== 'circle' && (
              <InputField
                label="Rotation:"
                value={selectedTool?.rotation}
                setValue={(rotation) => {
                  setSize(selectedTool.height, selectedTool.width, rotation);
                }}
                min={0}
                max={360}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ToolButton({
  text = '',
  icon = null,
  tooltip = '',
  clickFunction = () => {},
  bgcolor = 'bg-indigo-800 hover:bg-indigo-500',
  active = false,
}) {
  if (active) {
    bgcolor = 'bg-indigo-500';
  }
  return (
    <button
      onClick={clickFunction}
      className={bgcolor + ' px-5 h-16 font-bold text-xl text-slate-100'}
    >
      {icon}
      {text}
    </button>
  );
}

function InputField({
  label = '',
  icon = null,
  value = 0,
  setValue = () => {},
  min = 0,
  max = null,
  disabled = false,
}) {
  value = parseInt(value);
  return (
    <div className="flex flex-row items-center min-w-32 pl-3">
      <label className="text-slate-100 font-bold mr-2">{label}</label>
      <input
        type="number"
        disabled={disabled}
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-16 h-8 rounded-lg pl-3 font-bold"
      />
    </div>
  );
}
