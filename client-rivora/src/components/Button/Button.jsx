const Button = ({ text, onClick, bgColor = 'bg-[#8A65FD]' }) => {
  return (
    <button onClick={onClick} className={`text-sm ${bgColor} cursor-pointer text-white px-4 py-3 rounded-lg transition-colors duration-200`}>
        {text}
    </button>
  )
}

export default Button
