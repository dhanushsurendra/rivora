const Button = ({
  text,
  onClick,
  bgColor = 'bg-[#8A65FD]',
  isDisabled = false,
}) => {
  console.log(isDisabled)
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`text-sm ${bgColor} cursor-pointer text-white px-4 py-3 rounded-lg transition-colors duration-200 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} `}
    >
      {text}
    </button>
  )
}

export default Button
