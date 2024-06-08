export default function Button({ title = '', icon = '', onClick = () => {}, big = false, type = 'button'}) {
  return (
    <div className="">
      <button
        className={'text-center bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-md ' + (big?'px-4 py-8': 'px-4 py-4')}
        onClick={onClick}
        type={type}
      >
        {title}
        {icon}
      </button>
    </div>
  );
}
