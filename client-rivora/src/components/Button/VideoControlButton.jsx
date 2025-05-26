const VideoControlButton = ({
  iconOn,
  iconOff,
  label,
  title,
  onClick,
  bgColor = 'bg-[#EE4C4D]',
  isToggled = false,
}) => {
  return (
    <div className='flex flex-col items-center justify-center'>
      <button
        onClick={onClick}
        className={`p-2 w-10 h-10 ${
          isToggled ? bgColor : 'bg-[#252525]'
        } text-white hover:bg-opacity-80
        cursor-pointer focus:outline-none focus:ring-2 rounded-xl flex items-center justify-center transition-colors duration-200`}
        title={title}
        aria-pressed={isToggled}
      >
        {isToggled ? iconOn : iconOff}
      </button>
      <span className='text-xs mt-1 font-normal select-none'>{label}</span>
    </div>
  )
}
export default VideoControlButton
