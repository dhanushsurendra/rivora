import Spinner from '../Spinner/Spinner'

const Button = ({
  text,
  onClick,
  bgColor = 'bg-[#8A65FD]',
  isDisabled = false,
  isLoading = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`text-sm ${bgColor} cursor-pointer text-white px-4 py-3 rounded-lg transition-colors duration-200 ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      } min-w-24 flex items-center justify-center`}
    >
      {isLoading ? <Spinner /> : text}
    </button>
  )
}

export default Button
