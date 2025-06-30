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
      disabled={isDisabled || isLoading}

      onClick={onClick}
      className={`text-sm ${bgColor} cursor-pointer hover:bg-[#7A57D1] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg
      focus:outline-none focus:ring-2 focus:ring-[#8A65FD] focus:ring-opacity-75  ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      } min-w-24 flex items-center justify-center`}
    >
      {isLoading ? <Spinner /> : text}
    </button>
  )
}

export default Button
